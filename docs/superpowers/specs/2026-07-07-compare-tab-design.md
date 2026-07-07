# Compare Tab — Design Spec
_2026-07-07_

## Overview

A new **Compare** tab (placed after Explore in the tab bar) that lets the user put two recipes side-by-side and examine their differences through three complementary views. Recipes can be selected via dropdowns on the tab itself, or via a **Compare** button added to every recipe card throughout the app.

---

## Entry Points

### Compare button on recipe cards
- Added to every card in the Recipes tab grid and Explore results list.
- Module-level `compareSlots = [null, null]` queue (recipe objects).
- **First press on an empty queue:** fills slot 0, button shows "A ✕".
- **Second press (different card):** fills slot 1, sets `C.a` / `C.b`, switches to Compare tab, renders immediately.
- **Press on a card already in a slot:** clears that slot. Button returns to "Compare".
- Button label states: `"Compare"` → `"A ✕"` → `"B ✕"` depending on which slot this card occupies.

### Dropdowns on the Compare tab
- Two `<select>` elements, all recipe names as options, sorted alphabetically.
- Recipe A select styled with gold accent; Recipe B with blue accent.
- Swap button (⇄) exchanges A and B.
- Clear button resets both slots and clears `compareSlots`.
- Always in sync with `C.a` / `C.b`; changing a dropdown re-renders immediately.

---

## State

```js
const C = { a: null, b: null, view: 'sidebyside' }  // recipe objects
let compareSlots = [null, null]                       // queue for card buttons
let compareBuilt = false
```

`renderCompare()` is the single entry point — it delegates to the active view's render function. Called whenever `C.a`, `C.b`, or `C.view` changes.

---

## Tab Shell (built once via `initCompare()`)

```
[ Recipe A ▼ ]  ⇄  [ Recipe B ▼ ]  [ Clear ]
[ Side-by-side ] [ Row diff ] [ Overlay ]          ← subtab pills
─────────────────────────────────────────────────
<div id="cmp-content">                             ← replaced on each render
```

`initCompare()` is guarded by `compareBuilt`. Only the `#cmp-content` div is replaced on subsequent renders.

---

## View A — Side-by-side

Two equal-width columns with a narrow centre diff strip.

**Each column contains:**
1. Recipe name (bold) + film sim badge + color direction badge
2. Radar fingerprint (120×120, with value labels) — using existing `fingerprint(r)`
3. WB mini-grid — using existing `wbMiniGrid(r)`
4. Param pills: DR, Grain, Sharpness, Clarity, ISO Max, Exposure
5. Keywords: chips coloured by exclusivity — gold if only in A, blue if only in B, muted grey if shared
6. **Top 3 most similar recipes** — `computeSimilarity(recipeToT(r)).filter(s => s.name !== r.name).slice(0,3)` — small inline cards (name + film sim badge, clickable → `openRecipeModal`)

**Centre diff strip (between columns):**
- One row per numeric T_PARAM where `|normA − normB| ≥ step_threshold`
- Shows: param label + signed diff value (e.g. `HL +2`, `COL −1`)
- Positive diff (A > B) in gold; negative (A < B) in blue
- WB mode mismatch row if they differ
- Grain size mismatch row if they differ

---

## View B — Row diff

A comparison table. Rows where values match are dimmed (opacity 0.4); differing rows are full opacity with a coloured diff indicator.

**Row structure:** `Param | A value | ← diff → | B value`

**Row order:**
1. Categorical params first: Film Sim, WB Mode, Dynamic Range, Grain, Grain Size
2. Numeric params: HL, SH, COL, CCE, CCB, SHP, CL, NR
3. WB Shift: R and B values

**Bottom section:**
- Two keyword chip clouds side by side — shared keywords visually struck-through / muted; unique ones coloured gold (A) or blue (B)

---

## View C — Overlay

**Radar:** Single large radar (reuses the Explore radar static structure, drawn fresh each render). Recipe A polygon in gold (solid, `rgba(212,168,67,.15)` fill). Recipe B polygon in blue (dashed, `rgba(91,154,240,.08)` fill). Axis labels with both values shown: `HL: +2 / 0`. Legend pills at top (not SVG-embedded).

**WB grid:** Single `wbMiniGrid`-style SVG with both dots — gold diamond for A, blue crosshair for B, both with value labels outside the grid area.

**Keyword cloud:** Single merged cloud. Each chip coloured: gold = A only, blue = B only, both = split gold-blue border.

**Top-3 similar:** Two-column grid at the bottom — A's top 3 on the left, B's top 3 on the right. Each card: name + film sim badge + color direction badge, click → `openRecipeModal`.

---

## Reused Functions (no changes)

| Function | Used for |
|---|---|
| `fingerprint(r)` | Radar SVG in Side-by-side and as standalone in Row diff |
| `wbMiniGrid(r)` | WB grids in Side-by-side |
| `recipeToT(r)` | Converting recipes for similarity computation |
| `computeSimilarity(t)` | Top-3 similar for each recipe |
| `bc(dir)`, `dc(dir)` | Badge classes and colors |
| `openRecipeModal(name)` | Click handler on similar-recipe cards |

---

## CSS

New classes prefixed `cmp-`. Key ones:
- `.cmp-layout` — flex row, gap, wraps on mobile
- `.cmp-col` — flex column, equal width (flex:1, min-width:240px)
- `.cmp-diff-strip` — narrow centre column, flex column
- `.cmp-diff-badge` — individual diff row in the strip
- `.cmp-row-table` — the Row diff table
- `.cmp-overlay-radar` — wrapper for the overlay radar SVG
- `.cmp-top3-grid` — two-column grid for similar recipes at bottom
- `.cmp-kw-a`, `.cmp-kw-b`, `.cmp-kw-shared` — keyword chip colour variants

Mobile (≤680px): `.cmp-layout` stacks to column; diff strip moves below both columns.

---

## What is NOT included

- Saving or sharing comparisons
- More than two recipes at once
- Animated transitions between views
