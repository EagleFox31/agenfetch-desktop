#!/usr/bin/env python3
"""AgenFetch subtitle sidecar.

The process accepts one JSON request on stdin and writes one JSON response on
stdout. Provider discovery and matching are delegated to the reusable
Subliminal engine while network failures remain isolated from Electron.
"""

from __future__ import annotations

import io
import json
import os
import re
import sys
import urllib.error
import urllib.parse
import urllib.request
import zipfile
from pathlib import Path
from typing import Any

from subliminal_adapter import (
    BASE_PROVIDERS,
    OPTIONAL_PROVIDERS,
    SubliminalAdapterError,
    backend_version,
    download_subtitle as download_subliminal_subtitle,
    search_subtitles as search_subliminal_subtitles,
)


VERSION = "0.3.1"
USER_AGENT = f"AgenFetch/{VERSION}"
MAX_RESPONSE_BYTES = 25 * 1024 * 1024
SUBTITLE_EXTENSIONS = {".srt", ".vtt", ".ass", ".ssa", ".sub"}
LANGUAGE_PATTERN = re.compile(r"^[a-z]{2,3}(?:-[a-z0-9]{2,8})?$", re.I)
EPISODE_PATTERNS = (
    re.compile(r"(?i)\bS(?P<season>\d{1,2})[ ._-]*E(?P<episode>\d{1,3})\b"),
    re.compile(r"(?i)\b(?P<season>\d{1,2})x(?P<episode>\d{1,3})\b"),
)
TECHNICAL_TOKEN = re.compile(
    r"(?i)^(?:2160p|1440p|1080p|720p|480p|web(?:-?dl)?|bluray|brrip|webrip|hdtv|"
    r"dvdrip|x26[45]|h26[45]|hevc|av1|aac\d*|dts|atmos|hdr\d*|proper|repack)$"
)


class EngineError(RuntimeError):
    pass


def clean_text(value: Any, limit: int = 240) -> str:
    return str(value or "").strip()[:limit]


def clean_languages(values: Any) -> list[str]:
    if not isinstance(values, list):
        return ["fr", "en"]
    result: list[str] = []
    for value in values:
        language = clean_text(value, 16).lower()
        if LANGUAGE_PATTERN.fullmatch(language) and language not in result:
            result.append(language)
    return result[:12] or ["fr", "en"]


def parse_media_name(value: str) -> dict[str, Any]:
    original = clean_text(value, 1024)
    stem = Path(original).stem if original else ""
    normalized = re.sub(r"[._]+", " ", stem)
    normalized = re.sub(r"\s+", " ", normalized).strip()
    season = episode = None
    episode_match = None
    for pattern in EPISODE_PATTERNS:
        episode_match = pattern.search(normalized)
        if episode_match:
            season = int(episode_match.group("season"))
            episode = int(episode_match.group("episode"))
            break

    year_match = re.search(r"\b(19\d{2}|20\d{2})\b", normalized)
    year = int(year_match.group(1)) if year_match else None
    cut_indexes = [match.start() for match in (episode_match, year_match) if match]
    title_part = normalized[: min(cut_indexes)] if cut_indexes else normalized
    title_tokens = []
    for token in title_part.split():
        if TECHNICAL_TOKEN.fullmatch(token):
            break
        title_tokens.append(token)
    title = " ".join(title_tokens).strip(" -._()[]") or normalized or "Média local"

    return {
        "title": title[:180],
        "year": year,
        "season": season,
        "episode": episode,
        "type": "tv" if season is not None and episode is not None else "movie",
        "fileName": Path(original).name if original else "",
    }


def http_json(url: str, *, headers: dict[str, str] | None = None,
              method: str = "GET", body: dict[str, Any] | None = None) -> Any:
    request_headers = {"Accept": "application/json", "User-Agent": USER_AGENT}
    request_headers.update(headers or {})
    payload = None
    if body is not None:
        payload = json.dumps(body).encode("utf-8")
        request_headers["Content-Type"] = "application/json"
    request = urllib.request.Request(url, data=payload, headers=request_headers, method=method)
    try:
        with urllib.request.urlopen(request, timeout=22) as response:
            raw = response.read(MAX_RESPONSE_BYTES + 1)
    except urllib.error.HTTPError as error:
        detail = error.read(2048).decode("utf-8", "replace")
        raise EngineError(f"HTTP {error.code}: {detail[:300]}") from error
    except urllib.error.URLError as error:
        raise EngineError(f"Service injoignable: {error.reason}") from error
    if len(raw) > MAX_RESPONSE_BYTES:
        raise EngineError("Réponse fournisseur anormalement volumineuse.")
    return json.loads(raw.decode("utf-8"))


def provider_score(language: str, preferred: list[str], *, hearing_impaired: bool,
                   downloads: int = 0, exact_release: bool = False) -> int:
    try:
        language_score = max(0, 50 - preferred.index(language.lower()) * 5)
    except ValueError:
        language_score = 10
    return min(100, language_score + (18 if exact_release else 0)
               + min(20, downloads // 1000) - (4 if hearing_impaired else 0))


def search_subdl(query: dict[str, Any], api_key: str) -> list[dict[str, Any]]:
    params: dict[str, Any] = {
        "api_key": api_key,
        "languages": ",".join(language.upper() for language in query["languages"]),
        "type": query["type"],
        "subs_per_page": 30,
        "comment": 1,
        "releases": 1,
        "hi": 1,
        "unpack": 1,
        "client": "custom_integration",
    }
    if query.get("fileName"):
        params["file_name"] = query["fileName"]
    else:
        params["film_name"] = query["title"]
    if query.get("year"):
        params["year"] = query["year"]
    if query.get("season") is not None:
        params["season_number"] = query["season"]
    if query.get("episode") is not None:
        params["episode_number"] = query["episode"]

    url = "https://api.subdl.com/api/v1/subtitles?" + urllib.parse.urlencode(params)
    payload = http_json(url)
    if payload.get("status") and not payload.get("subtitles") and query.get("fileName"):
        params.pop("file_name", None)
        params["film_name"] = query["title"]
        fallback_url = "https://api.subdl.com/api/v1/subtitles?" + urllib.parse.urlencode(params)
        payload = http_json(fallback_url)
    if not payload.get("status"):
        raise EngineError(clean_text(payload.get("error"), 300) or "Recherche SubDL refusée.")

    results = []
    for index, subtitle in enumerate(payload.get("subtitles") or []):
        unpacked = subtitle.get("unpack_files") or []
        candidates = unpacked if unpacked else [subtitle]
        for file_index, item in enumerate(candidates):
            language = clean_text(item.get("language") or subtitle.get("language") or subtitle.get("lang"), 16).lower()
            download_path = clean_text(item.get("url") or subtitle.get("url"), 600)
            if not language or not download_path.startswith("/subtitle/"):
                continue
            release = clean_text(item.get("release_name") or subtitle.get("release_name") or item.get("name"), 220)
            hearing_impaired = bool(item.get("hi", subtitle.get("hi", False)))
            results.append({
                "id": f"subdl:{index}:{file_index}",
                "provider": "subdl",
                "providerLabel": "SubDL",
                "language": language,
                "release": release or query["title"],
                "fileName": clean_text(item.get("name") or subtitle.get("name"), 220),
                "format": clean_text(item.get("format"), 12).lower() or Path(clean_text(item.get("name"))).suffix.lstrip(".") or "zip",
                "fps": clean_text(item.get("fps") or subtitle.get("fps"), 16),
                "hearingImpaired": hearing_impaired,
                "downloads": int(subtitle.get("download_count") or 0),
                "score": provider_score(language, query["languages"], hearing_impaired=hearing_impaired, exact_release=bool(query.get("fileName") and release)),
                "downloadRef": {"path": download_path},
            })
    return results


def normalize_query(payload: dict[str, Any]) -> dict[str, Any]:
    media_path = clean_text(payload.get("mediaPath"), 1024)
    detected = parse_media_name(media_path or clean_text(payload.get("title"), 240))
    title = clean_text(payload.get("title"), 180) or detected["title"]
    if not title:
        raise EngineError("Indique un fichier ou un titre à rechercher.")

    def integer(name: str, fallback: Any = None, minimum: int = 0, maximum: int = 9999) -> Any:
        value = payload.get(name, fallback)
        if value in (None, ""):
            return None
        try:
            number = int(value)
        except (TypeError, ValueError):
            return fallback
        return number if minimum <= number <= maximum else fallback

    season = integer("season", detected["season"], 0, 99)
    episode = integer("episode", detected["episode"], 0, 999)
    media_type = "tv" if season is not None and episode is not None else "movie"
    return {
        "title": title,
        "year": integer("year", detected["year"], 1900, 2100),
        "season": season,
        "episode": episode,
        "type": media_type,
        "fileName": Path(media_path).name if media_path else "",
        "mediaPath": media_path,
        "languages": clean_languages(payload.get("languages")),
    }


def search(payload: dict[str, Any]) -> dict[str, Any]:
    query = normalize_query(payload)
    credentials = payload.get("credentials") if isinstance(payload.get("credentials"), dict) else {}
    try:
        backend = search_subliminal_subtitles(query, credentials)
    except SubliminalAdapterError as error:
        raise EngineError(str(error)) from error
    results = list(backend.get("results") or [])
    errors = list(backend.get("errors") or [])
    subdl_key = clean_text(credentials.get("subdl"), 300)
    if subdl_key:
        try:
            results.extend(search_subdl(query, subdl_key))
        except Exception as error:  # provider isolation is intentional
            errors.append({"provider": "subdl", "message": clean_text(error, 320)})
    results.sort(key=lambda item: (-int(item.get("score") or 0), -int(item.get("downloads") or 0)))
    return {"query": query, "results": results[:80], "errors": errors}


def allowed_download_url(value: str, provider: str) -> bool:
    try:
        parsed = urllib.parse.urlparse(value)
    except ValueError:
        return False
    if parsed.scheme != "https":
        return False
    host = (parsed.hostname or "").lower()
    if provider == "subdl":
        return host == "dl.subdl.com"
    return False


def download_bytes(url: str, provider: str, headers: dict[str, str] | None = None) -> bytes:
    if not allowed_download_url(url, provider):
        raise EngineError("Adresse de téléchargement fournisseur refusée.")
    request_headers = {"Accept": "application/octet-stream", "User-Agent": USER_AGENT}
    request_headers.update(headers or {})
    request = urllib.request.Request(url, headers=request_headers)
    with urllib.request.urlopen(request, timeout=30) as response:
        final_url = response.geturl()
        if not allowed_download_url(final_url, provider):
            raise EngineError("Redirection de téléchargement refusée.")
        data = response.read(MAX_RESPONSE_BYTES + 1)
    if len(data) > MAX_RESPONSE_BYTES:
        raise EngineError("Sous-titre anormalement volumineux.")
    return data


def extract_subtitle(data: bytes, preferred_name: str = "") -> tuple[bytes, str]:
    if not zipfile.is_zipfile(io.BytesIO(data)):
        extension = Path(preferred_name).suffix.lower()
        return data, extension if extension in SUBTITLE_EXTENSIONS else ".srt"
    with zipfile.ZipFile(io.BytesIO(data)) as archive:
        candidates = [entry for entry in archive.infolist()
                      if not entry.is_dir() and Path(entry.filename).suffix.lower() in SUBTITLE_EXTENSIONS]
        if not candidates:
            raise EngineError("L’archive ne contient aucun fichier de sous-titres reconnu.")
        preferred_stem = Path(preferred_name).stem.lower()
        candidates.sort(key=lambda entry: (
            0 if preferred_stem and preferred_stem in Path(entry.filename).stem.lower() else 1,
            0 if Path(entry.filename).suffix.lower() == ".srt" else 1,
            entry.file_size,
        ))
        selected = candidates[0]
        if selected.file_size > MAX_RESPONSE_BYTES:
            raise EngineError("Fichier de sous-titres trop volumineux.")
        return archive.read(selected), Path(selected.filename).suffix.lower()


def convert_subtitle(data: bytes, source_extension: str, target_format: str) -> tuple[bytes, str]:
    target = target_format if target_format in {"srt", "vtt"} else source_extension.lstrip(".")
    source = source_extension.lstrip(".")
    if source == target:
        return data, f".{target}"
    text = data.decode("utf-8-sig", "replace")
    if source == "srt" and target == "vtt":
        converted = "WEBVTT\n\n" + text.replace(",", ".")
        return converted.encode("utf-8"), ".vtt"
    if source == "vtt" and target == "srt":
        lines = text.splitlines()
        if lines and lines[0].lstrip("\ufeff").strip().upper() == "WEBVTT":
            lines = lines[1:]
        converted = "\n".join(lines).replace(".", ",")
        return converted.encode("utf-8"), ".srt"
    return data, source_extension


def safe_output_stem(value: str) -> str:
    cleaned = re.sub(r"[<>:\"/\\|?*\x00-\x1f]", " ", value)
    cleaned = re.sub(r"\s+", " ", cleaned).strip(" .")
    return (cleaned or "subtitle")[:160]


def download(payload: dict[str, Any]) -> dict[str, Any]:
    result = payload.get("result") if isinstance(payload.get("result"), dict) else {}
    provider = clean_text(result.get("provider"), 32)
    credentials = payload.get("credentials") if isinstance(payload.get("credentials"), dict) else {}
    reference = result.get("downloadRef") if isinstance(result.get("downloadRef"), dict) else {}
    api_key = clean_text(credentials.get(provider), 300)

    if provider == "subliminal":
        query_payload = payload.get("query") if isinstance(payload.get("query"), dict) else payload
        query = normalize_query(query_payload)
        try:
            downloaded = download_subliminal_subtitle(
                query,
                result,
                credentials,
                clean_text(payload.get("format"), 8).lower() or "srt",
            )
        except SubliminalAdapterError as error:
            raise EngineError(str(error)) from error
        subtitle_data = downloaded["data"]
        extension = downloaded["extension"]
        language = clean_text(downloaded.get("language"), 16).lower() or "und"
    elif provider == "subdl":
        if not api_key:
            raise EngineError("Clé subdl absente.")
        relative_path = clean_text(reference.get("path"), 600)
        if not relative_path.startswith("/subtitle/"):
            raise EngineError("Référence SubDL invalide.")
        data = download_bytes("https://dl.subdl.com" + relative_path, provider)
    else:
        raise EngineError("Fournisseur inconnu.")

    if provider != "subliminal":
        subtitle_data, source_extension = extract_subtitle(data, clean_text(result.get("fileName"), 220))
        subtitle_data, extension = convert_subtitle(
            subtitle_data, source_extension, clean_text(payload.get("format"), 8).lower() or "srt"
        )
        language = clean_text(result.get("language"), 16).lower() or "und"
    media_path = clean_text(payload.get("mediaPath"), 1024)
    destination_dir = clean_text(payload.get("destination"), 1024)
    if not destination_dir and media_path:
        destination_dir = str(Path(media_path).parent)
    if not destination_dir:
        raise EngineError("Dossier de destination absent.")
    Path(destination_dir).mkdir(parents=True, exist_ok=True)
    base_name = Path(media_path).stem if media_path else clean_text(payload.get("title"), 180)
    output_path = Path(destination_dir) / f"{safe_output_stem(base_name)}.{language}{extension}"
    if output_path.exists() and not bool(payload.get("overwrite")):
        counter = 2
        while output_path.exists():
            output_path = Path(destination_dir) / f"{safe_output_stem(base_name)}.{language}.{counter}{extension}"
            counter += 1
    output_path.write_bytes(subtitle_data)
    return {"filePath": str(output_path), "provider": provider, "language": language}


def dispatch(request: dict[str, Any]) -> dict[str, Any]:
    command = clean_text(request.get("command"), 32)
    payload = request.get("payload") if isinstance(request.get("payload"), dict) else {}
    if command == "version":
        return {
            "version": VERSION,
            "backend": {"name": "Subliminal", "version": backend_version()},
            "providers": [*BASE_PROVIDERS, *OPTIONAL_PROVIDERS, "subdl"],
        }
    if command == "parse":
        return parse_media_name(clean_text(payload.get("value"), 1024))
    if command == "search":
        return search(payload)
    if command == "download":
        return download(payload)
    raise EngineError("Commande inconnue.")


def main() -> int:
    try:
        raw = sys.stdin.buffer.read(1024 * 1024 + 1)
        if len(raw) > 1024 * 1024:
            raise EngineError("Requête trop volumineuse.")
        request = json.loads(raw.decode("utf-8"))
        if not isinstance(request, dict):
            raise EngineError("Requête JSON invalide.")
        response = {"ok": True, "result": dispatch(request)}
    except Exception as error:
        response = {"ok": False, "error": clean_text(error, 500) or error.__class__.__name__}
    sys.stdout.buffer.write(json.dumps(response, ensure_ascii=False).encode("utf-8"))
    return 0 if response["ok"] else 1


if __name__ == "__main__":
    raise SystemExit(main())
