import unittest
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


if __name__ == '__main__':
    unittest.main()
