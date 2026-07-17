---
name: sync-recipes
description: Fetch fujixweekly.com recipe lists, diff against RECIPES in index.html, and produce a ready-to-paste JS patch for new or changed recipes.
trigger: /sync-recipes
---

# /sync-recipes

Compare the live fujixweekly.com recipe catalogue for a chosen X-Trans sensor generation against the `RECIPES` array in `index.html`. Output a ready-to-paste JS patch for every recipe that is new or has changed settings.

## Supported X-Trans generations

| Generation | URL | Status |
|---|---|---|
| X-Trans V | https://fujixweekly.com/fujifilm-x-trans-v-recipes/ | Supported (current app data) |
| X-Trans IV | https://fujixweekly.com/fujifilm-x-trans-iv-recipes/ | Supported (requires app expansion first) |
| X-Trans III | https://fujixweekly.com/fujifilm-x-trans-iii-recipes/ | Supported (requires app expansion first) |
| X-Trans II | https://fujixweekly.com/fujifilm-x-trans-ii-recipes/ | Supported (requires app expansion first) |
| X-Trans I | https://fujixweekly.com/fujifilm-x-trans-i-recipes/ | Supported (requires app expansion first) |

**"Requires app expansion"** means the RECIPES array in index.html currently only holds X-Trans V entries. Before syncing another generation, the app must be updated to support multi-generation data (separate arrays or a `xtrans_generation` field). Running this skill for a non-V generation before that expansion is done will warn you and stop.

## What you must do when invoked

### Step 1 — Ask which generation to sync

Present the table above. Ask:

> Which X-Trans generation do you want to sync? (I, II, III, IV, or V)

Wait for the answer. If the user picks anything other than V, check whether `index.html` already contains a `xtrans_generation` field in the RECIPES objects or a separate array per generation. If not, respond:

> The app currently only holds X-Trans V recipes. To add [generation], the data model needs expanding first (add `xtrans_generation` field to each recipe object and update filters/UI). Do you want me to do that expansion now, or just preview what recipes would be added?

If the user wants expansion first, stop here and tell them to use the `/update-harness` skill to plan the data model change before re-running this skill.

If the user wants a preview only, continue but clearly mark all output as **PREVIEW — not patchable until app is expanded**.

### Step 2 — Read current RECIPES from index.html

Read `index.html` and extract the `RECIPES` array. Build an in-memory map keyed by `name` for fast lookup.

Also note the line number where `const RECIPES = [` starts — you will need it to report patch insertion points.

### Step 3 — Fetch the recipe index page

Use WebFetch on the catalogue URL for the chosen generation. Extract every recipe link — these are typically `<a>` tags pointing to individual recipe posts on fujixweekly.com.

Print:
```
Found N recipe links on [URL]
Currently in app: M recipes
```

### Step 4 — Identify new and potentially changed recipes

Compare fetched names against the app's RECIPES map (match by normalised name: lowercase, strip punctuation). Bucket into:

- **New** — on the site, not in the app
- **Possibly changed** — in both, but site post-dates the recipe's `source_url` creation (heuristic: URL slug contains a year earlier than the current year, or the post title differs slightly)
- **Up to date** — in both, no signal of change

Print a summary:
```
New recipes:      N
Possibly changed: N
Up to date:       N
```

Ask:
> Fetch full settings for new recipes (and possibly-changed ones)? This will make one web request per recipe. [N total]

Wait for confirmation before proceeding.

### Step 5 — Fetch individual recipe pages

For each recipe in "new" + "possibly changed", use WebFetch on the individual post URL. Parse the settings table. Extract every field that maps to the RECIPES schema:

| Site field | RECIPES key |
|---|---|
| Film Simulation | `film_simulation` |
| Grain Effect | `grain_effect` |
| Color Chrome Effect | `color_chrome_effect` |
| Color Chrome FX Blue | `color_chrome_fx_blue` |
| White Balance | `white_balance` |
| WB Shift Red / Blue | `wb_shift_red`, `wb_shift_blue` |
| Dynamic Range | `dynamic_range` |
| Highlight | `highlight` (numeric) |
| Shadow | `shadow` (numeric) |
| Color | `color` (numeric) |
| Sharpness | `sharpness` (numeric) |
| Clarity | `clarity` (numeric) |
| ISO | `iso_max` (extract number, e.g. "6400") |
| Exposure Compensation | `exposure_compensation` |

Also extract:
- Post title → `name`
- Post URL → `source_url`
- Post slug → `filename` (slug + `.md`)
- First paragraph / intro text → `narrative` (truncate to ~200 chars)
- Any mood/aesthetic descriptors mentioned → `mood_keywords[]`
- Any scenario/use-case mentions → `scenario_keywords[]`
- Film stock mentioned → `film_emulated`
- Era or decade references → `era_reference`

For numeric fields (highlight, shadow, color, sharpness, clarity): parse as float. Values are typically shown as +2, -1, 0 etc. Map to float: `+2` → `2.0`, `-1` → `-1.0`, `0` → `0.0`.

`color_direction` is legacy — omit it (the app computes warmth/punch from settings now).

### Step 6 — Build the JS patch

For each new recipe, format a JS object matching the exact shape of existing RECIPES entries:

```js
{"name":"[name]","filename":"[slug].md","source_url":"[url]","film_simulation":"[val]","grain_effect":"[val]","color_chrome_effect":"[val]","color_chrome_fx_blue":"[val]","white_balance":"[val]","wb_shift_red":"[val]","wb_shift_blue":"[val]","dynamic_range":"[val]","highlight":[float],"shadow":[float],"color":[float],"sharpness":[float],"clarity":[float],"iso_max":"[val]","exposure_compensation":"[val]","mood_keywords":[...],"scenario_keywords":[...],"era_reference":"[val]","film_emulated":"[val]","narrative":"[val]"}
```

For changed recipes, produce a diff showing old vs new field values and the replacement object.

### Step 7 — Present results

Show:
1. A numbered list of all new recipes with their key settings (film sim, WB, DR)
2. A numbered list of changed recipes with what changed
3. The complete JS patch — formatted as comma-separated objects ready to append inside the `RECIPES = [...]` array in `index.html`

Then ask:
> Apply this patch to index.html automatically, or copy-paste manually?

If the user says apply: use Edit to insert the new objects at the end of the RECIPES array (before the closing `]`). Do not touch any other part of the file.

If manual: output the patch in a code block and tell them exactly where to paste it (line number of the closing `]` of the RECIPES array).

### Step 8 — Summary

Print:
```
Sync complete.
  Added:   N new recipes
  Updated: N changed recipes
  Total:   N recipes now in app
```

Remind the user to check warmth/punch badge output for the new recipes — if any look wrong, add overrides to `RECIPE_META_PATCHES` in `gear.js`.

## Rules

- Never delete or reorder existing recipes — only append or update
- Never modify anything outside the RECIPES array when applying the patch
- If a field cannot be parsed from the site (site layout changed, field missing), set it to `null` and note it in the output
- Do not guess settings — if you can't read a value, leave it null and flag it
- `color_direction` must NOT be added — it is a legacy field the app no longer reads
