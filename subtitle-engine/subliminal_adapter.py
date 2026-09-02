#!/usr/bin/env python3
"""Subliminal integration for the AgenFetch subtitle sidecar.

The Electron process never receives provider objects or download URLs. Search
results expose only stable provider identifiers; a selected subtitle is looked
up again inside this isolated process before it is downloaded.
"""

from __future__ import annotations

import os
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path
from types import SimpleNamespace
from typing import Any


SUBLIMINAL_VERSION = "2.7.0"
BASE_PROVIDERS = ("podnapisi", "gestdown", "subtis")
OPTIONAL_PROVIDERS = ("opensubtitlescom",)
ALLOWED_PROVIDERS = frozenset((*BASE_PROVIDERS, *OPTIONAL_PROVIDERS))
PROVIDER_LABELS = {
    "podnapisi": "Podnapisi",
    "gestdown": "Gestdown",
    "subtis": "Subtis",
    "opensubtitlescom": "OpenSubtitles",
}
PROVIDER_TIMEOUT_SECONDS = 15
MAX_PROVIDER_RESULTS = 40


class SubliminalAdapterError(RuntimeError):
    """Raised when the reusable subtitle backend cannot fulfil a request."""


def _load_runtime() -> SimpleNamespace:
    try:
        import subliminal
        from babelfish import Language
        from subliminal import ProviderPool, compute_score, get_scores, refine, scan_video
        from subliminal.core import scan_name
    except ImportError as error:  # pragma: no cover - exercised by packaged status checks
        raise SubliminalAdapterError(
            "Le composant Subliminal est absent. Réinstalle le moteur de sous-titres AgenFetch."
        ) from error
    return SimpleNamespace(
        version=getattr(subliminal, "__version__", ""),
        Language=Language,
        ProviderPool=ProviderPool,
        compute_score=compute_score,
        get_scores=get_scores,
        refine=refine,
        scan_name=scan_name,
        scan_video=scan_video,
    )


def backend_version() -> str:
    version = str(_load_runtime().version or "")
    if version != SUBLIMINAL_VERSION:
        raise SubliminalAdapterError(
            f"Version Subliminal inattendue ({version or 'inconnue'} au lieu de {SUBLIMINAL_VERSION})."
        )
    return version


def enabled_providers(credentials: dict[str, Any] | None = None) -> list[str]:
    providers = list(BASE_PROVIDERS)
    if str((credentials or {}).get("opensubtitles") or "").strip():
        providers.append("opensubtitlescom")
    return providers


def provider_config(provider: str, credentials: dict[str, Any] | None = None) -> dict[str, Any]:
    if provider not in ALLOWED_PROVIDERS:
        raise SubliminalAdapterError("Fournisseur Subliminal non autorisé.")
    config: dict[str, Any] = {"timeout": PROVIDER_TIMEOUT_SECONDS}
    if provider == "opensubtitlescom":
        api_key = str((credentials or {}).get("opensubtitles") or "").strip()
        if not api_key:
            raise SubliminalAdapterError("Clé OpenSubtitles absente.")
        config.update({"apikey": api_key, "max_result_pages": 2})
    return config


def release_name(query: dict[str, Any]) -> str:
    title = str(query.get("title") or "Média local").strip() or "Média local"
    season = query.get("season")
    episode = query.get("episode")
    year = query.get("year")
    if season is not None and episode is not None:
        return f"{title}.S{int(season):02d}E{int(episode):02d}.mkv"
    if year:
        return f"{title}.{int(year):04d}.mkv"
    return f"{title}.mkv"


def _language(runtime: SimpleNamespace, value: str) -> Any:
    code = str(value or "").strip()
    try:
        return runtime.Language.fromietf(code)
    except (AttributeError, ValueError):
        try:
            return runtime.Language.fromalpha2(code)
        except (AttributeError, ValueError):
            return runtime.Language.fromalpha3b(code)


def _language_code(language: Any) -> str:
    try:
        return str(language).replace("_", "-").lower()
    except Exception:  # pragma: no cover - defensive for third-party language objects
        return "und"


def _video(runtime: SimpleNamespace, query: dict[str, Any], providers: list[str], languages: set[Any]) -> Any:
    media_path = str(query.get("mediaPath") or "").strip()
    guessed_name = release_name(query)
    if media_path and os.path.isfile(media_path):
        video = runtime.scan_video(media_path, name=guessed_name)
        runtime.refine(video, refiners=["hash"], providers=providers, languages=languages)
        return video
    return runtime.scan_name(guessed_name)


def _provider_search(
    runtime: SimpleNamespace,
    provider: str,
    config: dict[str, Any],
    video: Any,
    languages: set[Any],
) -> tuple[list[Any], str]:
    pool = runtime.ProviderPool(
        providers=[provider],
        provider_configs={provider: config},
    )
    try:
        subtitles = pool.list_subtitles(video, languages)
        if provider in pool.discarded_providers:
            return [], "Le fournisseur a refusé la recherche."
        return list(subtitles or [])[:MAX_PROVIDER_RESULTS], ""
    except Exception as error:  # provider isolation is a product requirement
        return [], str(error)[:300] or error.__class__.__name__
    finally:
        pool.terminate()


def _result(runtime: SimpleNamespace, subtitle: Any, video: Any) -> dict[str, Any]:
    provider = str(getattr(subtitle, "provider_name", "") or "").lower()
    if provider not in ALLOWED_PROVIDERS:
        raise SubliminalAdapterError("Résultat Subliminal provenant d’un fournisseur inconnu.")
    subtitle_id = str(getattr(subtitle, "id", "") or "")[:500]
    if not subtitle_id:
        raise SubliminalAdapterError("Résultat Subliminal sans identifiant.")
    scores = runtime.get_scores(video)
    maximum = max(1, int(scores.get("hash") or sum(scores.values()) or 1))
    raw_score = max(0, int(runtime.compute_score(subtitle, video)))
    score = min(100, round(raw_score * 100 / maximum))
    file_name = str(getattr(subtitle, "file_name", "") or "")
    release = str(
        getattr(subtitle, "release", "")
        or file_name
        or getattr(subtitle, "info", "")
        or "Sous-titre"
    )[:220]
    subtitle_format = str(getattr(subtitle, "subtitle_format", "") or "").lower()
    if not subtitle_format:
        subtitle_format = Path(file_name).suffix.lstrip(".").lower() or "srt"
    downloads = getattr(subtitle, "download_count", 0)
    return {
        "id": f"subliminal:{provider}:{subtitle_id}",
        "provider": "subliminal",
        "providerLabel": PROVIDER_LABELS.get(provider, provider.title()),
        "language": _language_code(getattr(subtitle, "language", "und")),
        "release": release,
        "fileName": Path(file_name).name[:220],
        "format": subtitle_format[:12],
        "fps": str(getattr(subtitle, "fps", "") or "")[:16],
        "hearingImpaired": bool(getattr(subtitle, "hearing_impaired", False)),
        "downloads": int(downloads or 0),
        "score": score,
        "downloadRef": {"providerName": provider, "subtitleId": subtitle_id},
    }


def search_subtitles(query: dict[str, Any], credentials: dict[str, Any] | None = None) -> dict[str, Any]:
    runtime = _load_runtime()
    providers = enabled_providers(credentials)
    languages = {_language(runtime, value) for value in query.get("languages") or ["fr", "en"]}
    video = _video(runtime, query, providers, languages)
    results: list[dict[str, Any]] = []
    errors: list[dict[str, str]] = []
    with ThreadPoolExecutor(max_workers=max(1, len(providers))) as executor:
        futures = {
            executor.submit(
                _provider_search,
                runtime,
                provider,
                provider_config(provider, credentials),
                video,
                languages,
            ): provider
            for provider in providers
        }
        for future in as_completed(futures):
            provider = futures[future]
            subtitles, error = future.result()
            if error:
                errors.append({"provider": provider, "message": error})
                continue
            for subtitle in subtitles:
                try:
                    results.append(_result(runtime, subtitle, video))
                except Exception as result_error:
                    errors.append({"provider": provider, "message": str(result_error)[:300]})
    return {"results": results, "errors": errors}


def download_subtitle(
    query: dict[str, Any],
    result: dict[str, Any],
    credentials: dict[str, Any] | None,
    target_format: str,
) -> dict[str, Any]:
    runtime = _load_runtime()
    reference = result.get("downloadRef") if isinstance(result.get("downloadRef"), dict) else {}
    provider = str(reference.get("providerName") or "").lower()
    subtitle_id = str(reference.get("subtitleId") or "")[:500]
    if provider not in ALLOWED_PROVIDERS or not subtitle_id:
        raise SubliminalAdapterError("Référence Subliminal invalide.")
    if provider not in enabled_providers(credentials):
        raise SubliminalAdapterError("Ce fournisseur Subliminal n’est pas configuré.")
    language_value = str(result.get("language") or "und")
    languages = {_language(runtime, language_value)}
    video = _video(runtime, query, [provider], languages)
    subtitles, error = _provider_search(
        runtime,
        provider,
        provider_config(provider, credentials),
        video,
        languages,
    )
    if error:
        raise SubliminalAdapterError(error)
    selected = next((item for item in subtitles if str(getattr(item, "id", "")) == subtitle_id), None)
    if selected is None:
        raise SubliminalAdapterError("Le sous-titre sélectionné n’est plus disponible chez le fournisseur.")
    pool = runtime.ProviderPool(
        providers=[provider],
        provider_configs={provider: provider_config(provider, credentials)},
    )
    try:
        if not pool.download_subtitle(selected):
            raise SubliminalAdapterError("Le fournisseur n’a pas renvoyé un sous-titre valide.")
    finally:
        pool.terminate()
    output_format = target_format if target_format in {"srt", "vtt"} else "srt"
    current_format = str(getattr(selected, "subtitle_format", "") or "").lower()
    converted = selected.convert(output_format=output_format, output_encoding="utf-8")
    if not converted and current_format == output_format:
        converted = selected.reencode(encoding="utf-8")
    data = getattr(selected, "content", None)
    if not converted or not isinstance(data, bytes) or not data:
        raise SubliminalAdapterError("Le sous-titre reçu n’a pas pu être converti en UTF-8.")
    return {
        "data": data,
        "extension": f".{output_format}",
        "language": _language_code(getattr(selected, "language", language_value)),
        "provider": provider,
    }
