# Explore — current implementation

Explore compares a manually tuned target against the selected recipe family.
It is a settings-distance reference, not a photo renderer or camera simulator.
There is no slider sub-tab or secondary overlay pane.

## Fuji

`initExplore()` in `recipes-ui.js` builds these controls:

1. **Start From** — searchable recipe picker, including a neutral target.
2. **Film Simulation** — limits similarity results; it does not change the radar.
3. **White Balance** — preset/temperature dropdown and draggable shift grid.
4. **Color & Tone** — five-axis radar with draggable handles.
5. **Detail & Range** — Sharpness, Clarity and ISO NR steppers; DR, Grain and
   Grain Size toggles, with deltas against the closest result.
6. **Results** — the closest recipes, their differences and detail/Compare actions.

State is `T`. `recipeToT()` copies a recipe into that shape without mutating the
recipe. `computeSimilarity(T)` ranks the active generation by normalized
Euclidean settings distance; `expDebounce()` coalesces updates at 80ms.

### Radar

Axes: HL, SH, COL, CCE and CCB. The reference scale is symmetric around zero:

```js
extent = Math.max(Math.abs(axis.lo), Math.abs(axis.hi))
ratio = clamp((value + extent) / (2 * extent), 0, 1)
```

- Middle ring: zero. Outer ring: maximum positive. Center: maximum negative.
- HL/SH: −2..+4, step 0.5. COL: −4..+4, step 1.
- CCE/CCB: Off/Weak/Strong represented as 0/1/2.
- Your shape is gold. Closest-match shape is dashed blue. Legend buttons toggle
  the visibility of each shape; deltas indicate settings differences.

These are the application's comparison ranges. Older cameras do not expose all
of the controls or step sizes; follow the camera manual and actual recipe card
when programming a body. Similarity maps unavailable recipe values to neutral
values, so a distance score should not be read as measured photographic similarity.

### WB and remaining settings

The shift grid uses R/B values from −9..+9. The target is a gold diamond; the
closest match is a blue crosshair. The dropdown includes values in the selected
data pool and the current target value, so a retained target never appears blank.

Detail controls: Sharpness −4..+4; Clarity −5..+5; ISO NR −4..+4; DR 100/200/400;
Grain Off/Weak/Strong; Grain Size Small/Large. Missing library NR values are
neutral in similarity calculations, not evidence that the published recipe
specifies NR 0.

## OM

`initExplore()` explicitly delegates to `initOmExplore()` in `om-analysis.js`.
The Fuji field set and algorithms are not used for OM recipes.

- `TOM` is separate from Fuji `T`.
- A draggable 12-channel color wheel is the main control, using the OM recipe
  schema's −7..+7 values.
- Amber/green WB offsets, OM tone controls and recipe-type selection accompany
  the wheel. `computeOmSimilarity()` ranks OM recipes only.
- The wheel uses a dark instrument surface in both light and dark appearances.
- Same-name recipes from different authors remain distinct in the picker,
  result modals and Compare. Labels include the author; records are not renamed.

The schema range is not a promise that every Olympus/OM camera's native control
range or feature set matches it. The PEN-F and OM-3 setup guides remain their own
camera-specific programming references.

## Lifecycle and responsiveness

- Controls are built on demand, not during Home startup.
- `exploreBuilt` / `omExploreBuilt` avoid rebuilding on ordinary revisits.
- The initial Fuji markup is kept in `fujiExploreHTML` because OM uses the same
  pane. Every required Fuji rebuild restores fresh nodes before wiring them;
  this prevents duplicate options and event handlers across generation changes.
- Valid target choices can persist. An unavailable film-simulation filter or
  seed is cleared when switching Fuji generations.
- Slow family loads, cancellation and retries are managed by `switchGen()`.
  Completion rebuilds the actual active view with the newly loaded schema.
- On phones the controls stack in one column and input/select text is 16px.

## Checks

```bash
node --test tools/test_*.cjs
# Optional browser suite; Playwright is not a site/runtime dependency:
SITE_URL=http://localhost:8000/ node tools/smoke_site.cjs
```

See [production architecture/deployment](site-design.md) for optional browser
configuration, asset versioning and the other views.
