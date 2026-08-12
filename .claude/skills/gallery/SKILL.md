---
name: gallery
description: Review the photo gallery and add or remove Lightroom albums through conversation. Regenerates gallery.js via tools/build_gallery.py.
trigger: /gallery
---

# /gallery

Review the current photo gallery and manage which Adobe Lightroom shared albums
appear on the site. All changes go through `tools/build_gallery.py` — never
hand-edit `gallery.js`.

## Background

Photos are **hotlinked** from public Lightroom shares, not stored in the repo.
Adobe blocks browser JS from reading album contents (HTTP 403 cross-origin), so
the photo list is generated at author time and committed.

The album list lives in the `ALBUMS` constant at the top of
`tools/build_gallery.py`. That list is the source of truth.

## What you must do when invoked

### Step 1 — Report current state

Read `gallery.js` and the `ALBUMS` list in `tools/build_gallery.py`. For each
album, check it is still reachable:

```bash
curl -sS -o /dev/null -w "%{http_code}" \
  "https://lightroom.adobe.com/v2c/spaces/<SPACE_ID>"
```

200 means reachable; 403 or 404 means the share is private or deleted.

Print:

```
Gallery: N albums, M photos

  1. <label>    <count> photos   <earliest date>   ✓ reachable
  2. <label>    <count> photos   <earliest date>   ✗ UNREACHABLE

What would you like to do — add an album, remove one, or refresh?
```

If any album is unreachable, say so plainly and note that those photos are
currently broken on the live site.

If an album has `"metadata": false`, warn that its captions will be empty and
that the fix is to enable "Show Metadata" in Lightroom's share settings.

### Step 2 — Handle the request

**Add an album.** Ask for the Lightroom share link. Extract the 32-character
space ID from a URL of the form
`https://lightroom.adobe.com/shares/<SPACE_ID>`.

Verify it is public **before** changing any file. Adobe prefixes the response
with an XSSI guard (`while (1) {}\n`, 13 bytes) that must be stripped before
the JSON will parse:

```bash
curl -sS "https://lightroom.adobe.com/v2c/spaces/<SPACE_ID>" | tail -c +14 | \
  python3 -c "import json,sys; print('private:', json.load(sys.stdin)['payload']['private'])"
```

This prints `private: False` for a public share. If it prints `private: True`,
the request fails, or the JSON fails to parse, refuse and tell the user to
make the share public first. Do not edit anything.

Report what was found (photo count, date range, whether metadata is on), then
ask for a display label. Add the entry to `ALBUMS` in
`tools/build_gallery.py`, then go to Step 3.

**Remove an album.** Ask which number. Confirm the photo count being dropped:

> Remove "<label>" (<count> photos)? The photos stay in Lightroom — only the
> site stops showing them.

On confirmation, delete that entry from `ALBUMS`, then go to Step 3.

**Refresh.** Skip straight to Step 3.

### Step 3 — Regenerate

Run:

```bash
python3 tools/build_gallery.py
```

If it exits non-zero it aborted without writing — report the error and stop. Do
not attempt to hand-write `gallery.js`.

Verify no private fields leaked:

```bash
grep -cE 'SerialNumber|MacBook|DSCF|sha256|importedBy|CreatorTool' gallery.js
```

Must print `0`. If not, stop and report a bug in `photo_from_asset()`.

### Step 4 — Report the diff

Compare against the counts from Step 1 and print:

```
  <label>: <old> → <new> photos (+N)
```

Then tell the user to review the Gallery tab locally before committing:

```bash
python3 -m http.server 8000 --bind 127.0.0.1
```

### Step 5 — Offer to commit

Ask whether to commit `gallery.js` (and `tools/build_gallery.py` if the album
list changed). Do not push. Do not use the `gh` CLI — it is authenticated to a
different GitHub account on this machine.

## Rules

- Never hand-edit `gallery.js` — it is generated and edits are overwritten
- Never add an album that is not publicly reachable
- Never enable `location` on a Lightroom share (that is GPS)
- Warn when an album has metadata disabled — captions will be empty
- Never write a partial manifest — if the script aborts, stop
- Never download or commit image files; photos are hotlinked
- Do not modify `index.html` — this skill only touches the album list and the
  generated manifest
- Do not use the `gh` CLI in this repo
