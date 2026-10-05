import contextlib
import io
import os
import ssl
import subprocess
import tempfile
import urllib.error
import unittest
from unittest import mock

import build_gallery as bg


class TestTransforms(unittest.TestCase):
    def test_strip_xssi_removes_prefix(self):
        self.assertEqual(bg.strip_xssi('while (1) {}{"a":1}'), '{"a":1}')

    def test_strip_xssi_passes_clean_json_through(self):
        self.assertEqual(bg.strip_xssi('{"a":1}'), '{"a":1}')

    def test_rational_from_pair(self):
        self.assertAlmostEqual(bg.rational([56, 10]), 5.6)

    def test_rational_from_plain_number(self):
        self.assertAlmostEqual(bg.rational(35), 35.0)

    def test_fmt_shutter_fast(self):
        self.assertEqual(bg.fmt_shutter([1, 80]), '1/80')

    def test_fmt_shutter_long_exposure(self):
        self.assertEqual(bg.fmt_shutter([2, 1]), '2s')

    def test_fmt_aperture(self):
        self.assertEqual(bg.fmt_aperture([56, 10]), 'f/5.6')

    def test_fmt_aperture_whole_stop(self):
        self.assertEqual(bg.fmt_aperture([80, 10]), 'f/8')

    def test_tidy_lens_inserts_space_and_lowercases_f(self):
        self.assertEqual(bg.tidy_lens('XF23mmF2.8 R WR'), 'XF23mm f/2.8 R WR')

    def test_tidy_lens_leaves_clean_names_alone(self):
        self.assertEqual(bg.tidy_lens('M.Zuiko 17mm f/1.8'), 'M.Zuiko 17mm f/1.8')


class TestVerifiedFetch(unittest.TestCase):
    def test_certificate_error_uses_verified_https_only_curl(self):
        error = urllib.error.URLError(ssl.SSLCertVerificationError('missing local issuer'))
        response = mock.Mock(stdout=b'while (1) {}{"payload":{"private":false}}')
        with mock.patch.object(bg.urllib.request, 'urlopen', side_effect=error), \
             mock.patch.object(bg.shutil, 'which', return_value='/usr/bin/curl'), \
             mock.patch.object(bg.subprocess, 'run', return_value=response) as run:
            result = bg.fetch('https://lightroom.adobe.com/test')
        self.assertFalse(result['payload']['private'])
        args = run.call_args.args[0]
        self.assertNotIn('-k', args)
        self.assertNotIn('--insecure', args)
        self.assertIn('--proto', args)
        self.assertIn('=https', args)

    def test_ordinary_network_error_does_not_use_a_different_transport(self):
        with mock.patch.object(bg.urllib.request, 'urlopen', side_effect=urllib.error.URLError('offline')), \
             mock.patch.object(bg.subprocess, 'run') as run:
            with self.assertRaises(urllib.error.URLError):
                bg.fetch('https://lightroom.adobe.com/test')
        run.assert_not_called()

    def test_failed_native_fallback_remains_an_abortable_os_error(self):
        error = urllib.error.URLError(ssl.SSLCertVerificationError('missing local issuer'))
        with mock.patch.object(bg.urllib.request, 'urlopen', side_effect=error), \
             mock.patch.object(bg.shutil, 'which', return_value='/usr/bin/curl'), \
             mock.patch.object(bg.subprocess, 'run', side_effect=subprocess.CalledProcessError(60, ['curl'])):
            with self.assertRaises(OSError):
                bg.fetch('https://lightroom.adobe.com/test')


class TestPhotoFromAsset(unittest.TestCase):
    def setUp(self):
        self.asset = {
            "id": "06a25c299da14a7fa0fdac1cfa1afaf6",
            "links": {
                "/rels/rendition_type/thumbnail2x": {"href": "assets/A/revisions/B/renditions/THUMB"},
                "/rels/rendition_type/1280": {"href": "assets/A/revisions/B/renditions/BIG"},
            },
            "payload": {
                "captureDate": "2026-07-18T10:49:38.92+01:00",
                "importSource": {
                    "originalWidth": 6240, "originalHeight": 4160,
                    "fileName": "DSCF0592.jpg", "sha256": "deadbeef",
                    "importedBy": "f1d86fc934af10861871262c098a2574",
                },
                "develop": {"device": "Jin's MacBook Pro {abc123}"},
                "xmp": {
                    "tiff": {"Make": "FUJIFILM", "Model": "X-M5"},
                    "aux": {"SerialNumber": "5C024309", "Lens": "XF23mmF2.8 R WR"},
                    "xmp": {"CreatorTool": "Adobe Lightroom 9.4.1 (Macintosh)"},
                    "exif": {
                        "FNumber": [56, 10], "ExposureTime": [1, 80],
                        "ISOSpeedRatings": 3200, "FocalLength": [2300, 100],
                        "FocalLengthIn35mmFilm": 35,
                    },
                },
            },
        }

    def test_extracts_expected_fields(self):
        p = bg.photo_from_asset(self.asset, 'SPACE', 'ALBUM')
        self.assertEqual(p['camera'], 'Fujifilm X-M5')
        self.assertEqual(p['lens'], 'XF23mm f/2.8 R WR')
        self.assertEqual(p['aperture'], 'f/5.6')
        self.assertEqual(p['shutter'], '1/80')
        self.assertEqual(p['iso'], 3200)
        self.assertEqual(p['focal'], '23mm (35mm eq)')
        self.assertEqual(p['date'], '2026-07-18')
        self.assertEqual(p['album'], 'SPACE')
        self.assertEqual(p['w'], 6240)
        self.assertEqual(p['h'], 4160)

    def test_builds_absolute_rendition_urls(self):
        p = bg.photo_from_asset(self.asset, 'SPACE', 'ALBUM')
        self.assertTrue(p['thumb'].startswith('https://lightroom.adobe.com/v2c/spaces/SPACE/'))
        self.assertTrue(p['thumb'].endswith('THUMB'))
        self.assertTrue(p['src'].endswith('BIG'))

    def test_drops_every_private_field(self):
        blob = repr(bg.photo_from_asset(self.asset, 'SPACE', 'ALBUM'))
        for leaked in ['5C024309', 'MacBook', 'DSCF0592', 'deadbeef',
                       'f1d86fc934af10861871262c098a2574', 'CreatorTool']:
            self.assertNotIn(leaked, blob)

    def test_survives_missing_exif_when_metadata_disabled(self):
        del self.asset['payload']['xmp']['exif']
        del self.asset['payload']['xmp']['aux']
        p = bg.photo_from_asset(self.asset, 'SPACE', 'ALBUM')
        self.assertIsNone(p['aperture'])
        self.assertIsNone(p['lens'])
        self.assertEqual(p['camera'], 'Fujifilm X-M5')
        self.assertTrue(p['thumb'])


class TestMainTimeoutHandling(unittest.TestCase):
    """A stalled network call raises TimeoutError (a socket.timeout /
    OSError subclass, NOT a urllib.error.URLError subclass). main() must
    catch it, print the clean abort message, return 1, and must not write
    a partial gallery.js."""

    def setUp(self):
        self.tmpdir = tempfile.TemporaryDirectory()
        self.out_path = os.path.join(self.tmpdir.name, 'gallery.js')
        self._orig_albums = bg.ALBUMS
        self._orig_out = bg.OUT
        bg.ALBUMS = [{"space": "SPACE", "label": "Test Album"}]
        bg.OUT = self.out_path

    def tearDown(self):
        bg.ALBUMS = self._orig_albums
        bg.OUT = self._orig_out
        self.tmpdir.cleanup()

    def test_timeout_error_is_caught_and_aborts_without_writing(self):
        output, errors = io.StringIO(), io.StringIO()
        with mock.patch.object(bg, 'fetch', side_effect=TimeoutError('timed out')), \
             contextlib.redirect_stdout(output), contextlib.redirect_stderr(errors):
            result = bg.main()
        self.assertIn('NOT modified', errors.getvalue())
        self.assertEqual(result, 1)
        self.assertFalse(os.path.exists(self.out_path))


if __name__ == '__main__':
    unittest.main()
