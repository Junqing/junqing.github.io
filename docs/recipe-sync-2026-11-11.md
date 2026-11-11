# Fujixweekly refresh — 2026-11-11

## Scope and verification

The approved V/IV/II catalogue audit fetched **270 distinct source pages** over
verified HTTPS and compared **333 existing recipes**: V 102, IV 199, II 32.
Fourteen recent records (V 11, IV 3) had no age signal and were outside that fetch
batch; they are not claimed as freshly verified.

An older post URL was only a conservative recheck heuristic, not evidence that
its publisher recently changed the settings. Fourteen multi-recipe posts were
matched to their specific simulation, version and camera-generation blocks.
Equivalent labels, fraction notation and optional camera alternatives were not
treated as setting changes. Raw HTML, network logs and comparison scratch stay
outside the repository; the site gains no runtime network dependency.

## Applied additions

Six records were appended to V and six to IV. No existing recipes were deleted
or reordered. The four compatible IV additions below were confirmed by the new
V posts even though they were absent from the IV index.

| Recipe | Added to | Film simulation | WB | DR | Published source |
| --- | --- | --- | --- | --- | --- |
| Retro Slide | V | Nostalgic Neg. | 5000K, R−1/B+3 | DR400 | [Source](https://fujixweekly.com/2026/08/10/retro-slide-a-fujifilm-recipe-for-5th-gen-x-trans-v-cameras/) |
| KinaColor 26 | V, IV | Classic Negative | Auto, R+3/B−5 | DR200 | [Source](https://fujixweekly.com/2026/10/22/kinacolor-26-film-simulation-recipe/) |
| Astia Azure | V, IV | Astia/Soft | Shade, R−2/B−2 | DR400 | [Source](https://fujixweekly.com/2026/11/09/astia-azure-a-fujifilm-x-trans-iv-x-trans-v-film-simulation-recipe/) |
| CineStill 800T v2 | V | Reala Ace | 4500K, R−1/B−3 | DR200 | [Source](https://fujixweekly.com/2026/09/29/cinestill-800t-v2-a-fujifilm-recipes-for-x-trans-v-cameras/) |
| Atlantic Sunrise | V, IV | Provia/STD | Daylight, R+4/B−2 | DR400 | [Source](https://fujixweekly.com/2026/11/06/atlantic-sunrise-a-fujifilm-film-simulation-recipe/) |
| AgfaChrome RSX II 200 Expired | V, IV | Eterna Bleach Bypass | Auto Ambience Priority, R+3/B−5 | DR Auto | [Source](https://fujixweekly.com/2026/10/27/agfachrome-rsx-ii-200-expired-a-film-simulation-recipe-for-5th-gen-fujifilm-cameras/) |
| Kodak Portra 160 (X-T3/X-T30) | IV | Classic Chrome | Daylight, R+4/B−5 | DR Auto | [Source](https://fujixweekly.com/2020/04/03/my-fujifilm-x-t30-kodak-portra-160-film-simulation-recipe/) |
| Verano Tostado | IV | Classic Chrome | Auto, R−2/B−5 | DR200 | [Source](https://fujixweekly.com/2020/08/26/fujifilm-x100v-film-simulation-recipe-verano-tostado/) |

- KinaColor 26 uses **CCB Weak on V, Strong on IV**, following the author's
  explicit adjustment. No blanket cross-generation conversion was applied.
- Retro Slide and CineStill 800T v2 stay V-only. Compatibility caveats for newer
  IV bodies are kept in the other additions' narratives.
- The 2020 Portra 160 recipe has a distinct name to preserve the existing 2023
  Kodak Portra 160 record. The index's “Kodak Porta 160” was a typo.
- The older Portra recipe does not prescribe Clarity or CCB, so those new fields
  are null. Verano Tostado prescribes no typical exposure compensation: that
  field is null, with its experimental range described in the narrative.
- Source High ISO NR is not a field in this repository's Fuji recipe schema;
  the refresh does not expand the schema or invent defaults.

## Applied IV corrections/completions

| Existing recipe | Local change | Published source |
| --- | --- | --- |
| Kodak Portra 800 v3 | Shadow −1 → −0.5 | [Source](https://fujixweekly.com/2024/02/14/kodak-portra-800-v3-fujifilm-x-t5-x-trans-v-x-e4-x-trans-iv-film-simulation-recipe/) |
| Scanned Superia | Ordinary Auto → DR-P Auto | [Source](https://fujixweekly.com/2021/09/15/fujifilm-x-e4-x-trans-iv-film-simulation-recipe-scanned-superia/) |
| Pulled Fujicolor Superia | Ordinary Auto → DR-P Strong | [Source](https://fujixweekly.com/2021/10/11/fujifilm-x100v-x-trans-iv-film-simulation-recipe-pulled-fujicolor-superia/) |
| Kodak Tri-X 400 | Missing ISO maximum → 12800 | [Source](https://fujixweekly.com/2020/06/18/fujifilm-x100v-film-simulation-recipe-kodak-tri-x-400/) |
| Moody Monochrome | Missing ISO value → 3200 | [Source](https://fujixweekly.com/2022/04/05/fujifilm-x-trans-iv-film-simulation-recipe-moody-monochrome/) |
| Kodacolor II 126 | Missing ISO maximum → 6400 | [Source](https://fujixweekly.com/2020/04/28/my-fujifilm-x-t30-kodacolor-ii-126-film-simulation-recipe/) |
| Ilford HP5 Plus 400 Push Process | Missing ISO maximum → 51200; unsupported DR100 entry → null | [Source](https://fujixweekly.com/2019/05/29/my-fujifilm-x-t30-ilford-hp5-plus-400-push-process-film-simulation-recipe/) |

The existing `iso_max` field records the maximum of source ranges/choices:
Tri-X 1600–12800, Kodacolor II 126 3200–6400, and HP5 Push 25600 or 51200.
Moody Monochrome specifies fixed ISO 3200. These are recipe references, not
saved personal Auto ISO profiles or automatic FS-dial recalls.

## Preserved data and limits

- No explicit dial-setting corrections were identified for the compared V/II
  records. X-Trans II remains at 32 recipes; X70 belongs to this pool.
- [Astia's source](https://fujixweekly.com/2020/08/22/fujifilm-x-trans-ii-film-simulation-recipe-astia/)
  explicitly permits ISO 3200 on APS-C X-Trans II bodies; that allowance is
  retained for X70 rather than replaced by the small-sensor XQ1 limit of 1600.
- [Universal Negative](https://fujixweekly.com/2025/03/28/universal-negative-14-fujifilm-x100vi-x-trans-v-film-simulation-recipes-yes-14/)
  explicitly permits ISO 12800 for Acros/Eterna and disables Color on B&W
  simulations. Those exceptions remain intact.
- Existing source-omitted fields are not blindly cleared. They remain local
  values, not assertions of independent confirmation. In particular,
  [Reggie's Portra](https://fujixweekly.com/2022/06/11/fujifilm-x-trans-iv-film-simulation-recipe-reggies-portra/)
  has no published compensation entry; the older V/IV catalogue values are
  retained as unresolved local guidance. The personal X-E5 guide correctly
  states that no fixed compensation is prescribed.
- The seven X-E5 recipe references, archived X-T50 slot data, OM recipes,
  III/I recipe pools and gallery data are untouched by this refresh.
- Fujixweekly groups X-M5 with fifth-generation recipes by JPEG capability,
  despite its X-Trans IV sensor. IV remains a useful compatible recipe source.

## Integration

`RECIPE_FAMILIES` now declares V **119**, IV **208**, II **32**. The full site
has **485 recipes** across six families. Application asset URLs and the lazy
loader share `editorial-7`, preventing older cached data from obscuring the
refresh. Deployment remains static and buildless.

Regression checks cover additions/identity, generation-specific CCB, source
corrections, null new fields, preserved prose exceptions, schema separation and
all seven X-E5 recipe references:

```bash
node --test tools/test_*.cjs
python3 -m unittest discover -s tools -p 'test_*.py'
```
