---
name: remove-recipe-images
description: Remove all hotlinked fujixweekly image references from recipes; replace hero slot with fingerprint SVG; delete lightbox
metadata:
  type: project
---

# Design: Remove Recipe Images

**Date:** 2026-07-16
**Branch:** feature/explore-tab

## Background

All 111 recipe objects in `RECIPES` contain `hero_image` and `gallery_images` fields that hotlink to `i0.wp.com/fujixweekly.com/...`. These images are copyright Ritchie Roesch / fujixweekly.com. Using them without permission is infringement. Every recipe already has a `source_url` pointing to the correct blog post — that is sufficient attribution and access.

## Goal

Remove all hotlinked image references and replace the hero slot with the existing per-recipe fingerprint SVG. Delete the lightbox infrastructure entirely.

## Changes

### 1. Data layer — `RECIPES` array

Strip `hero_image` and `gallery_images` from all 111 recipe objects. No other recipe fields change.

### 2. `makeCard(r)` — hero slot

Replace the `<img class="card-img">` / `<div class="card-img-ph">` block with the fingerprint SVG in a container that keeps the same `150px` height. Use the existing `fingerprint(r)` function.

Remove the gallery strip (`<div class="gallery-strip">`) block.

The existing "View on fujixweekly.com ↗" footer link inside the card is unchanged.

### 3. My Recipes panel (~lines 2266–2376)

Same as `makeCard`: replace the `hero_image` render block with the fingerprint SVG; remove the gallery strip block.

### 4. Lightbox — remove entirely

- HTML: remove `<div id="lightbox">...</div>` and its children
- JS: remove `openLightbox()` function and all call sites
- JS: remove the keyboard listener for arrow navigation (lightbox-only)
- CSS: remove `.gallery-strip`, `.card-img`, `.card-img-ph`, `#lightbox`, `#lightbox img`, `#lightbox-close`, `#lightbox-prev`, `#lightbox-next` rules

### 5. Footer attribution

Change:
> "Recipe data and sample images sourced from FujiXWeekly by Ritchie Roesch."

To:
> "Recipe data sourced from FujiXWeekly by Ritchie Roesch."

## Out of scope

- `images/gear/` — user's own product photos, unaffected
- `source_url` field — kept as-is, already used for the footer link

## Success criteria

- No `hero_image` or `gallery_images` keys remain in `RECIPES`
- No requests made to `i0.wp.com` or `fujixweekly.com/wp-content/`
- Recipe cards render with fingerprint SVG in the hero slot at 150px height
- Lightbox HTML/JS/CSS is fully gone
- Footer text is accurate
