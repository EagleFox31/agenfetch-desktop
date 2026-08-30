import unittest
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import agenfetch_subtitles as engine


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
        self.assertTrue(engine.allowed_download_url("https://www.podnapisi.net/subtitles/abc/download", "podnapisi"))
        self.assertFalse(engine.allowed_download_url("https://evil.example/subtitle.zip", "subdl"))


if __name__ == "__main__":
    unittest.main()
