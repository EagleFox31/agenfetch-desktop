import json
import os
import subprocess
import unittest
import sys
from pathlib import Path
from types import SimpleNamespace
from unittest import mock

sys.path.insert(0, str(Path(__file__).resolve().parent))
import agenfetch_subtitles as engine
import subliminal_adapter as adapter


class SubtitleEngineTests(unittest.TestCase):
    def test_parses_episode_release_name(self):
        result = engine.parse_media_name("The.Last.of.Us.S02E03.1080p.WEB-DL.mkv")
        self.assertEqual(result["title"], "The Last of Us")
        self.assertEqual(result["season"], 2)
        self.assertEqual(result["episode"], 3)
        self.assertEqual(result["type"], "tv")

    def test_parses_movie_year(self):
        result = engine.parse_media_name("Dune.Part.Two.2024.2160p.BluRay.mkv")
        self.assertEqual(result["title"], "Dune Part Two")
        self.assertEqual(result["year"], 2024)
        self.assertEqual(result["type"], "movie")

    def test_filters_languages(self):
        self.assertEqual(engine.clean_languages(["FR", "en", "../../bad", "fr"]), ["fr", "en"])

    def test_converts_srt_to_vtt(self):
        value, extension = engine.convert_subtitle(
            b"1\n00:00:01,000 --> 00:00:02,000\nHello\n", ".srt", "vtt"
        )
        self.assertEqual(extension, ".vtt")
        self.assertTrue(value.startswith(b"WEBVTT"))
        self.assertIn(b"00:00:01.000", value)

    def test_restricts_provider_download_hosts(self):
        self.assertTrue(engine.allowed_download_url("https://dl.subdl.com/subtitle/123.zip", "subdl"))
        self.assertFalse(engine.allowed_download_url("https://www.podnapisi.net/subtitles/abc/download", "podnapisi"))
        self.assertFalse(engine.allowed_download_url("https://evil.example/subtitle.zip", "subdl"))

    def test_writes_unicode_json_even_with_windows_legacy_stdout(self):
        request = {
            "command": "parse",
            "payload": {"value": "폭露貝貝 Wonder boy (1988).mp4"},
        }
        environment = {**os.environ, "PYTHONIOENCODING": "cp1252"}
        completed = subprocess.run(
            [sys.executable, str(Path(engine.__file__).resolve())],
            input=json.dumps(request, ensure_ascii=False).encode("utf-8"),
            capture_output=True,
            check=False,
            env=environment,
        )
        self.assertEqual(completed.returncode, 0, completed.stderr.decode("utf-8", "replace"))
        response = json.loads(completed.stdout.decode("utf-8"))
        self.assertTrue(response["ok"])
        self.assertIn("폭露貝貝", response["result"]["title"])

    def test_builds_stable_subliminal_release_names(self):
        self.assertEqual(
            adapter.release_name({"title": "The Last of Us", "season": 2, "episode": 3}),
            "The Last of Us.S02E03.mkv",
        )
        self.assertEqual(
            adapter.release_name({"title": "Dune Part Two", "year": 2024}),
            "Dune Part Two.2024.mkv",
        )

    def test_enables_only_configured_keyed_providers(self):
        self.assertEqual(adapter.enabled_providers({}), ["podnapisi", "gestdown", "subtis"])
        self.assertEqual(
            adapter.enabled_providers({"opensubtitles": "secret"}),
            ["podnapisi", "gestdown", "subtis", "opensubtitlescom"],
        )

    def test_normalizes_subliminal_results_without_exposing_urls(self):
        class FakeRuntime:
            @staticmethod
            def get_scores(_video):
                return {"hash": 100}

            @staticmethod
            def compute_score(_subtitle, _video):
                return 87

        class FakeSubtitle:
            provider_name = "podnapisi"
            id = "safe-id"
            file_name = "../The.Last.of.Us.fr.srt"
            release = "The.Last.of.Us.S02E03.WEB-DL"
            subtitle_format = "srt"
            fps = 24.0
            hearing_impaired = False
            download_count = 42
            language = "fr"

        result = adapter._result(FakeRuntime(), FakeSubtitle(), object())
        self.assertEqual(result["provider"], "subliminal")
        self.assertEqual(result["providerLabel"], "Podnapisi")
        self.assertEqual(result["score"], 87)
        self.assertEqual(result["fileName"], "The.Last.of.Us.fr.srt")
        self.assertEqual(
            result["downloadRef"],
            {"providerName": "podnapisi", "subtitleId": "safe-id"},
        )
        self.assertNotIn("url", json.dumps(result).lower())

    def test_isolates_a_failing_subliminal_provider(self):
        class FakeLanguage:
            @staticmethod
            def fromietf(value):
                return value

        class FakeSubtitle:
            provider_name = "podnapisi"
            id = "subtitle-42"
            file_name = "Dune.Part.Two.fr.srt"
            release = "Dune.Part.Two.2024.WEB-DL"
            subtitle_format = "srt"
            fps = 24.0
            hearing_impaired = False
            download_count = 100
            language = "fr"

        class FakePool:
            def __init__(self, providers, provider_configs):
                self.provider = providers[0]
                self.provider_configs = provider_configs
                self.discarded_providers = set()

            def list_subtitles(self, _video, _languages):
                if self.provider == "gestdown":
                    raise RuntimeError("provider offline")
                return [FakeSubtitle()] if self.provider == "podnapisi" else []

            def terminate(self):
                return None

        runtime = SimpleNamespace(
            version="2.7.0",
            Language=FakeLanguage,
            ProviderPool=FakePool,
            compute_score=lambda _subtitle, _video: 90,
            get_scores=lambda _video: {"hash": 100},
            refine=lambda *_args, **_kwargs: None,
            scan_name=lambda _name: object(),
            scan_video=lambda *_args, **_kwargs: object(),
        )
        with mock.patch.object(adapter, "_load_runtime", return_value=runtime):
            response = adapter.search_subtitles(
                {"title": "Dune Part Two", "year": 2024, "languages": ["fr"]},
                {},
            )
        self.assertEqual(len(response["results"]), 1)
        self.assertEqual(response["results"][0]["providerLabel"], "Podnapisi")
        self.assertEqual(response["errors"], [
            {"provider": "gestdown", "message": "provider offline"},
        ])


if __name__ == "__main__":
    unittest.main()
