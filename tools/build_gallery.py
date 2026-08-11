#!/usr/bin/env python3
"""Generate gallery.js from public Adobe Lightroom shared albums.

Run:  python3 tools/build_gallery.py

Photos are hotlinked, never downloaded. Only the fields named in
photo_from_asset() are copied — this is an allowlist, so anything Adobe adds
later cannot leak into the published site by oversight.
"""

import json
import re
import sys
import urllib.error
import urllib.request

# ── Album declarations — the source of truth. Edit this list, then re-run. ──
ALBUMS = [
    {"space": "4679d64af9bd4c5f834bb13ca74aef75", "label": "Kat × Art"},
]

API = "https://lightroom.adobe.com/v2c/spaces/{space}/"
OUT = "gallery.js"
TIMEOUT = 30


def strip_xssi(text):
    """Adobe prefixes JSON responses with `while (1) {}` against XSSI."""
    return re.sub(r'^while\s*\(1\)\s*\{\}', '', text, count=1)


def fetch(url):
    req = urllib.request.Request(url, headers={"User-Agent": "build-gallery/1.0"})
    with urllib.request.urlopen(req, timeout=TIMEOUT) as r:
        return json.loads(strip_xssi(r.read().decode("utf-8")))


def rational(v):
    """Lightroom stores EXIF numbers as [numerator, denominator] pairs."""
    if isinstance(v, list) and len(v) == 2 and v[1]:
        return v[0] / v[1]
    return float(v) if isinstance(v, (int, float)) else None


def fmt_shutter(v):
    t = rational(v)
    if t is None:
        return None
    if t < 1:
        return "1/{}".format(round(1 / t))
    return "{:g}s".format(t)


def fmt_aperture(v):
    f = rational(v)
    return None if f is None else "f/{:g}".format(round(f, 1))


def tidy_lens(name):
    """'XF23mmF2.8 R WR' -> 'XF23mm f/2.8 R WR'."""
    if not name:
        return None
    return re.sub(r'([a-z])F(\d)', r'\1 f/\2', name)


def photo_from_asset(asset, space_id, album_id):
    """Copy ONLY the allowlisted fields. Everything else is dropped."""
    payload = asset.get("payload", {})
    xmp = payload.get("xmp", {})
    exif = xmp.get("exif", {})
    aux = xmp.get("aux", {})
    tiff = xmp.get("tiff", {})
    imp = payload.get("importSource", {})
    links = asset.get("links", {})
    base = API.format(space=space_id)

    def rendition(key):
        href = links.get("/rels/rendition_type/" + key)
        return base + href["href"] if href else None

    make = (tiff.get("Make") or "").strip().title()
    model = (tiff.get("Model") or "").strip()
    camera = " ".join(p for p in [make, model] if p) or None
    if camera and model.upper().startswith(make.upper()):
        camera = model

    focal = rational(exif.get("FocalLength"))
    eq = exif.get("FocalLengthIn35mmFilm")
    focal_str = None
    if focal:
        focal_str = "{:g}mm".format(round(focal))
        if eq:
            focal_str += " ({}mm eq)".format(eq)

    capture = payload.get("captureDate") or ""

    return {
        "album": space_id,
        "thumb": rendition("thumbnail2x"),
        "src": rendition("1280"),
        "w": imp.get("originalWidth"),
        "h": imp.get("originalHeight"),
        "date": capture[:10] or None,
        "camera": camera,
        "lens": tidy_lens(aux.get("Lens")),
        "aperture": fmt_aperture(exif.get("FNumber")),
        "shutter": fmt_shutter(exif.get("ExposureTime")),
        "iso": exif.get("ISOSpeedRatings"),
        "focal": focal_str,
    }


def load_album(space_id, label):
    """Return (album_dict, [photo, ...]). Raises on any failure."""
    base = API.format(space=space_id)
    space = fetch(base)
    share = space.get("payload", {})
    if share.get("private"):
        raise RuntimeError("album {} is private".format(space_id))

    resources = fetch(base + "resources").get("resources", [])
    albums = [r for r in resources if r.get("type") == "album"]
    if not albums:
        raise RuntimeError("no album found in space {}".format(space_id))

    photos = []
    for alb in albums:
        alb_id = alb["id"]
        url = (base + "albums/{}/assets?embed=asset&subtype=image%3Bvideo"
               .format(alb_id))
        for res in fetch(url).get("resources", []):
            asset = res.get("asset")
            if not asset:
                continue
            p = photo_from_asset(asset, space_id, alb_id)
            if p["thumb"] and p["src"]:
                photos.append(p)

    return (
        {"id": space_id, "label": label, "count": len(photos),
         "metadata": bool(share.get("metadata"))},
        photos,
    )


def main():
    albums, photos = [], []
    for entry in ALBUMS:
        label = entry["label"]
        print("Fetching {} ...".format(label))
        try:
            alb, pics = load_album(entry["space"], label)
        except (urllib.error.URLError, urllib.error.HTTPError,
                RuntimeError, KeyError, ValueError) as exc:
            # Abort without writing. A partial manifest would silently delete
            # photos from the live site.
            print("\nERROR: {} failed: {}".format(label, exc), file=sys.stderr)
            print("Aborted. {} was NOT modified.".format(OUT), file=sys.stderr)
            return 1
        if not alb["metadata"]:
            print("  WARNING: metadata disabled on this share — "
                  "captions will be empty.")
        print("  {} photos".format(alb["count"]))
        albums.append(alb)
        photos.extend(pics)

    with open(OUT, "w", encoding="utf-8") as fh:
        fh.write("// GENERATED by tools/build_gallery.py — DO NOT EDIT BY HAND.\n")
        fh.write("// Re-run the script or use the /gallery skill to update.\n")
        fh.write("var GALLERY_ALBUMS = ")
        json.dump(albums, fh, ensure_ascii=False, indent=1)
        fh.write(";\n\nvar GALLERY_PHOTOS = ")
        json.dump(photos, fh, ensure_ascii=False, indent=1)
        fh.write(";\n")

    print("\nWrote {} — {} albums, {} photos".format(OUT, len(albums), len(photos)))
    return 0


if __name__ == "__main__":
    sys.exit(main())
