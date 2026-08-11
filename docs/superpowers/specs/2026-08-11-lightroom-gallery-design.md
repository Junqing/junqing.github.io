# Lightroom Cloud Gallery — Design

**Date:** 2026-08-11
**Status:** Approved, ready for implementation planning

## Summary

Add a top-level **Gallery** tab showing Jin's own photographs, hotlinked from
publicly-shared Adobe Lightroom albums rather than stored in the repo. Photos
carry per-photo shooting information (camera, lens, aperture, shutter, ISO,
focal length) sourced from Lightroom's public album API at build time.

No photo files enter the repository.

## Goals

- A personal photo gallery, browsable by album
- Per-photo shooting settings visible — this is a camera-recipe site, so the
  settings are the interesting part
- Zero repo weight; no image files committed
- Adding photos is a low-friction, conversational step

## Non-goals

Explicitly out of scope. Each would be a separate project:

- Linking photos to recipes (no recipe↔photo mapping)
- Infinite scroll or pagination
- Per-photo captions, titles, or descriptions
- Sorting controls (fixed order: album order, capture date ascending)
- Per-photo permalinks or deep links
- Any change to Fuji or OM recipe code paths

## Verified findings

All of the following were tested against the live Lightroom API on 2026-08-11
using share `4679d64af9bd4c5f834bb13ca74aef75` (100 photos). These are
measurements, not assumptions.

| Property | Result |
|---|---|
| Image hotlinking | Works — HTTP 200, `image/jpeg` |
| Hotlink protection | None — succeeds with a foreign `Referer` |
| `X-Frame-Options` / CSP | Absent |
| URL form | Content-addressed (`assets/<id>/revisions/<id>/renditions/<id>`), **no expiry token** |
| Renditions available | `thumbnail2x`, `640`, `1280`, `2048` |
| Full-resolution originals | **Not exposed** — 6240×4160 originals stay private |
| EXIF embedded in rendition JPEGs | Fully stripped by Adobe |
| Album listing JSON (server-side) | Readable — 100 assets |
| **Album listing JSON from browser JS** | **HTTP 403 — cross-origin blocked** |
| `cache-control` | `max-age=2592000, private` (browser-cacheable) |

### The controlling constraint

Adobe permits `<img>` requests cross-origin but **blocks `fetch()`/XHR** from a
browser page. The gallery therefore cannot read album contents at runtime. The
photo list must be generated ahead of time and committed as a static file.

Consequence for the author: photos added in Lightroom do **not** appear on the
site automatically. A refresh step must be run and the result committed.

### Metadata availability

Lightroom's per-album share settings gate metadata exposure:

```json
{ "private": false, "metadata": true, "location": false }
```

- With `metadata: false` (initial state) the API exposed **no** camera, lens, or
  exposure data at all.
- With `metadata: true` (enabled 2026-08-11) all 100 photos expose a full `exif`
  block plus `tiff.Make` / `tiff.Model` and `aux.Lens`.
- `location` is an **independent toggle** and was verified to remain `false`
  with metadata on. No GPS, latitude, or longitude appears anywhere in the
  response.

**Serial number exposure:** with metadata on, `aux.SerialNumber` (`5C024309`) is
present on all 100 photos. This is public in Adobe's API and outside this
project's control. The build step must not republish it — see Privacy below.

Exposure values are stored as rationals (`FNumber: [56,10]`,
`ExposureTime: [1,80]`) and are converted to display strings at build time.

## Architecture

Three artifacts, matching the existing repo convention where generated data
lives in a plain-global JS file consumed by `index.html` (as `recipes-om.js`
and `gear.js` already do).

```
tools/build-gallery.py   Author-time script. Not served. Run by hand.
gallery.js               Generated data. Committed. Plain globals.
index.html               Gallery tab + renderGallery().
```

### Data flow

```
Lightroom album (public share)
        │  server-side HTTPS GET (no CORS restriction)
        ▼
tools/build-gallery.py   — allowlist fields, convert rationals, tidy lens names
        │
        ▼
gallery.js               — GALLERY_ALBUMS[], GALLERY_PHOTOS[]
        │  <script src>
        ▼
index.html renderGallery()
        │  <img src> hotlink, per photo
        ▼
Adobe CDN renditions
```

### Build step vs. the "no build" rule

`CLAUDE.md` states the project has no build step. This design adds an
author-time script but **preserves that rule for the site itself**: `gallery.js`
is a plain global file, GitHub Pages serves everything as-is, and no bundler,
`package.json`, or npm dependency is introduced. The script is an authoring
convenience in the same spirit as the existing `/sync-recipes` skill, which
already generates recipe patches. Python 3 is already required for the local
preview server, so no new dependency is added.

This was raised explicitly during design and accepted.

### Album list

The set of albums is declared at the top of `tools/build-gallery.py`:

```python
ALBUMS = [
    {"space": "4679d64af9bd4c5f834bb13ca74aef75", "label": "Kat × Art"},
]
```

This list is the source of truth. `gallery.js` is generated output and must
never be hand-edited.

### Generated data shape

```js
var GALLERY_ALBUMS = [
  { id: "4679d64...", label: "Kat × Art", count: 100 }
];

var GALLERY_PHOTOS = [
  {
    album:    "4679d64...",
    thumb:    "https://lightroom.adobe.com/v2c/spaces/.../renditions/...",
    src:      "https://lightroom.adobe.com/v2c/spaces/.../renditions/...",  // 1280
    w: 6240, h: 4160,
    date:     "2026-07-18",
    camera:   "Fujifilm X-M5",
    lens:     "XF23mm f/2.8 R WR",
    aperture: "f/5.6",
    shutter:  "1/80",
    iso:      3200,
    focal:    "23mm (35mm eq)"
  }
];
```

`w`/`h` are the original dimensions, carried only to reserve grid aspect ratio
and prevent layout shift as images load.

Only two of the four available renditions are stored: `thumbnail2x` for the grid
and `1280` for the detail view. The `640` and `2048` renditions are deliberately
unused — storing all four would double the manifest size for no current benefit.
Their URLs follow the same pattern and can be added later if needed.

## Privacy

The build script uses an **allowlist**: it copies only the fields named in the
schema above. Everything else is dropped by construction, so fields Adobe may
add in future cannot leak in through oversight. This is deliberately not a
blocklist.

Dropped, though present in Adobe's public API:

| Field | Reason |
|---|---|
| `aux.SerialNumber` | Camera body serial — links all photos to one body |
| `develop.device` | Contains `"Jin's MacBook Pro"` |
| `importSource.fileName` | Original filenames (`DSCF0592.jpg`) |
| `importSource.sha256` / `originalDigest` | File hashes |
| `importSource.importedBy` | Adobe account identifier |
| `xmp.CreatorTool` | Lightroom version string |

This does not remove these fields from Adobe's API, where they remain public to
anyone holding the share link. It prevents them being republished on a site
that is indexed and scraped.

## Ownership

- Copyright subsists automatically; no notice is required for it to hold.
- `dc.rights` already carries `"© Jin Qian"`, flowed from the Lightroom catalog
  into the public API independently of this project.
- Only renditions up to 2048px are exposed; the 6240×4160 originals never leave
  Adobe. This is *stronger* protection than committing exports to the repo,
  where whatever is committed is what visitors can retrieve.
- A visible `© Jin Qian` credit is rendered beneath the grid.

## UI

**Placement** — a sixth top-level tab in `.tabs`, after Compare. The tab bar
already scrolls horizontally at ≤1024px; mobile becomes tighter but functional.
The pane takes class `pane-no-subtabs` (no inner subtabs).

**Grid** — responsive `auto-fill` columns. Thumbnails use the `thumbnail2x`
rendition with `loading="lazy"`, so a 100+ photo album does not issue 100
simultaneous requests. Aspect ratio is reserved from `w`/`h`.

**Detail view** — clicking a photo opens the 1280px rendition in the **existing**
`#recipe-modal` overlay, which already handles Escape, backdrop click, and
mobile full-screen. No second modal implementation.

**Caption** — shown in the detail view, not on thumbnails:

```
X-M5 · XF23mm f/2.8 · f/5.6 · 1/80 · ISO 3200
```

Rendered per photo even when an album is uniform in gear. This needs no
uniformity detection and stays correct for future mixed-gear albums.

**Filtering** — album chips in the sidebar. Recipe facets (warmth, punch, mood,
scenario, era, film simulation) are meaningless for photos and are hidden on
this tab.

**Rendering convention** — `renderGallery()` guarded by a `galleryBuilt` flag,
dispatched from `switchTab()`, mirroring `renderGear()`.

## Error handling

| Failure | Behaviour |
|---|---|
| `gallery.js` absent (not committed, or opened over `file://`) | Empty state, matching the existing graceful degradation when `gear.js` fails to load |
| A share is made private → images 404 | Per-image `onerror` swaps in a muted placeholder, so one dead photo does not make the page look broken |
| An album is unreachable at build time | Script **aborts without writing**. A partial `gallery.js` would silently delete photos from the live site; failing loudly at authoring time is preferred |
| Metadata toggle turned off | Captions become empty. The `/gallery` skill reports this explicitly during refresh |

## Dependency risk

The gallery depends on:

1. An active Adobe subscription
2. The album remaining publicly shared
3. Adobe not changing rendition URL structure

If any lapses, every image 404s. This was raised during design and accepted in
exchange for zero repo weight and automatic EXIF stripping. The `/gallery`
skill's health check exists to surface (1) and (2) before a visitor does.

Mitigation if this becomes unacceptable: the manifest shape is
hosting-agnostic. Switching to repo-hosted files changes the `thumb`/`src`
values and the build script, not the renderer.

## `/gallery` skill

Committed to `.claude/skills/gallery/SKILL.md`, mirrored to
`docs/skills/gallery.md`, following the existing `/sync-recipes` layout
(frontmatter with `name` / `description` / `trigger`, numbered steps, closing
Rules section). Shared with collaborators.

On invocation it reads `gallery.js` and reports current state:

```
Gallery: 2 albums, 143 photos

  1. Kat × Art          100 photos   2026-07-18   ✓ reachable
  2. Lisbon trip         43 photos   2026-08-02   ✓ reachable

What would you like to do — add an album, remove one, or refresh?
```

Operations:

- **Add** — accepts a Lightroom share link, extracts the space ID, verifies the
  album is public *before* writing anything, reports what was found, asks for a
  display label, regenerates.
- **Remove** — select by number, confirm the photo count being dropped,
  regenerate.
- **Refresh** — re-read all albums, report the diff (`Kat × Art: +7 photos`).
  The most frequently used operation.
- **Review** — health-check each album and spot-check that image URLs still
  resolve. Early warning that a share has gone private.

The skill drives `tools/build-gallery.py` rather than reimplementing its logic,
so there is a single code path whether the script is run directly or through
conversation.

**Skill rules:**

- Never hand-edit `gallery.js` — it is generated; edits are overwritten
- Refuse to add an album that is not publicly reachable
- Warn when an album has `metadata: false` (captions will be empty)
- Never enable `location` on a share
- Never write a partial manifest — abort if any album fails

## Testing

The repo has no test framework, so verification is manual and must be performed
and reported before the work is claimed complete:

1. Serve locally (`python3 -m http.server 8000`); Gallery tab renders 100 photos
2. Captions match the API for a spot-checked sample
3. `grep` the generated `gallery.js` for `SerialNumber`, `MacBook`, `DSCF` —
   must return nothing
4. Album filter chips filter correctly
5. Detail modal opens, shows the 1280px rendition, closes via ✕ / backdrop / Esc
6. Deliberately corrupt one URL — confirm the placeholder appears and the rest
   of the grid is unaffected
7. All five pre-existing tabs still function; `switchGen()` between Fuji and OM
   is unaffected
8. Mobile viewport (≤680px): tab bar scrolls, grid is single-column

## Open items

None. The metadata toggle question was resolved empirically during design.
