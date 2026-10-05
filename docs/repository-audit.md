# Repository sweep — findings and verification

## Completed fixes

- Family loading now deduplicates scripts/promises, permits retry, invalidates
  late requests on return to the active family and rebuilds the actual active
  view after a deferred load. Cold OM Explore/Insights/Compare no longer retain
  Fuji controls.
- Fuji Explore rebuilds fresh nodes, keeps valid target choices and clears
  unavailable filters/seeds. Repeated generation switches do not accumulate
  options or handlers.
- Correlations uses the active Fuji generation, ignores unavailable numeric
  settings and deduplicates tags per recipe. The obsolete fixed V snapshot is
  removed. OM computation remains separate.
- Legitimate same-name OM recipes are distinguished by author metadata/record
  identity in modals, Compare and Explore. All 66 OM records are retained.
- Recipe-browser visual cards have an explicit keyboard-accessible details
  action. Badge explanations update with the family; OM statistics use recipe
  types rather than an irrelevant film-simulation count.
- Corrected reversed Fuji Shadow educational descriptions and stale setup prose
  without changing any saved numerical settings or recipe references.
- The gallery authoring tool can use verified system curl only for Python CA-store
  certificate failures. HTTPS verification is never disabled; unrelated network
  failures and fallback errors still abort without writing a partial manifest.

## Leaner runtime/assets

- Only V data loads eagerly. Four other Fuji files totaling **270,573 raw bytes**
  are deferred until requested; OM remains lazy.
- Removed `buildSliderPane`, unused `pillSvg`, unused `SIM_CHARACTER` and the
  **12,276-byte** stale `corr-data.js` snapshot.
- Removed 36 unused selector entries and 179 overridden CSS declarations without
  changing rule order, conditional scope or specificity. Computed-style parity
  was checked across 96 desktop/tablet/mobile + light/dark states.
- Converted three large PNG gear images to **pixel-identical lossless WebP**,
  retaining dimensions and attribution and saving **84,945 bytes**. Updated all
  references and removed the replaced PNGs.
- Startup no longer constructs hidden recipe-card/cloud/analysis panes.
- Added portable Finder-metadata ignores and removed that generated junk from
  project folders. No package.json, framework, bundler or runtime dependency was
  introduced.

## Deliberately retained

- All six recipe datasets: **473 recipes**, unchanged.
- Gallery manifest: **1 album / 90 photos**, unchanged. Read-only live API check
  returned the same count with metadata enabled; no regeneration was performed.
- X-T50 slot values/references and all camera setup configurations, including
  the planned X-E5 setup and untouched X-M5 placeholder.
- `renderCharts()` / `#pane-charts` as the repository explicitly requires, and
  empty `MY_RECIPES` as a documented future-use reserve.
- `refreshed.html` as a tiny bookmark redirect, not a second app.
- Historical design records and ignored developer scratch. Neither is loaded
  into the app or counted as browser bundle bloat.

## Verification

- **38 dependency-free Node tests + 18 Python tests pass.**
- Optional committed `tools/smoke_site.cjs` suite passes in Chromium and WebKit:
  all six families and views, counts, lazy startup, deferred/canceled loads,
  author-specific OM selection, setup guides, search/cheatsheet, Learn demos,
  viewer isolation and 1440/768/390/320px layouts beneath a Pages-style subpath.
- All application/data JS and inline entry blocks parse; `git diff --check` passes.
- Gallery privacy allowlist remains intact. No private identifiers are published.
- No local resource 404s or unexpected JavaScript errors in browser checks.
- Current README, Explore and production-design docs are updated; historical
  records are explicitly indexed as historical, not current instructions.

## Pending approval / scope limits

`AGENTS.md` has 15 stale/incomplete sections identified by the update-harness
workflow. That instruction file is left unchanged by this sweep pending the
requested confirmation. Its old preview/load-order descriptions must not be
used as current production instructions; use `docs/site-design.md` meanwhile.

The sweep validates committed recipe data and references; it does not claim to
have externally resynchronized every publisher recipe. The site still depends
on the public Lightroom share. Changes are local: no commit, push or deployment
was performed.
