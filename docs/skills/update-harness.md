---
name: update-harness
description: Read the current state of index.html and gear.js, then update CLAUDE.md to accurately reflect the architecture, key functions, data shape, CSS conventions, and anything else a future Claude session needs to work effectively.
trigger: /update-harness
---

# /update-harness

Audit the live codebase and rewrite the relevant sections of `CLAUDE.md` so the harness stays accurate. Run this after any significant structural change: new tabs, new data fields, layout refactors, new filter facets, or anything that makes the current CLAUDE.md stale.

## What you must do when invoked

### Step 1 — Read the source files

Read these files in full:
- `index.html` (all of it — CSS, HTML structure, JS)
- `gear.js`
- `CLAUDE.md` (current state)

Also check:
- `docs/explore.md` if it exists
- Any other `docs/*.md` files

### Step 2 — Audit each CLAUDE.md section

Go through every section of the current CLAUDE.md and check it against what you just read. For each section, answer:

1. Is it accurate? (function names, line numbers, field names, CSS class names)
2. Is it complete? (anything new that exists in the code but isn't documented?)
3. Is it stale? (anything documented that no longer exists, or has moved?)

Produce a short audit report in this format:

```
Section: Architecture
  Status: STALE
  Issues: gear.js now has 5 globals (RECIPE_META_PATCHES added), text says 4

Section: Layout structure
  Status: ACCURATE

Section: Tabs (current order)
  Status: INCOMPLETE
  Issues: Explore tab render functions not listed; data-tab values wrong for My/Insights

Section: Key functions
  Status: STALE
  Issues: openLightbox() removed, wbMiniGrid() added, fingerprint() sig changed
```

Print this audit before making any edits. Ask:

> Found [N] sections to update. Apply all updates to CLAUDE.md?

Wait for confirmation.

### Step 3 — Update CLAUDE.md

For each stale or incomplete section, rewrite it to match the current code. Rules:

- **Never remove sections** — only update or add to them
- **Never invent** — every claim must be verifiable in the source files you just read
- **Be specific** — include actual function names, CSS class names, JS variable names, and approximate line numbers for important anchors (e.g. `RECIPES (~line 804)`)
- **Stay concise** — CLAUDE.md is a reference, not a tutorial. No paragraphs of explanation; use bullet points and code snippets
- **Preserve user-written notes** — if a section contains notes that appear to be manually written (opinions, intent, decisions), keep them verbatim unless they're factually wrong

Sections to always check and update if needed:

1. **Overview** — description of what the site is
2. **Architecture** — globals in gear.js, inline structure of index.html, data layer (RECIPES count, approximate line), field list
3. **Badge classification** — warmth/punch formula functions, helper maps, override mechanism
4. **State** — S object shape, filter keys (check S.f.* keys match current code)
5. **Rendering pipeline** — init/render/filtered flow
6. **Tabs** — exact tab labels, data-tab values, render functions, notes (keep the table format)
7. **Key functions** — all exported/top-level functions with one-line descriptions
8. **MY_CUSTOM_SLOTS structure** — if gear.js shape changed
9. **Layout structure** — .app/.content/.sidebar chain, sticky behaviour (critical — don't let this go stale)
10. **Sidebar** — collapse state, mobile overlay, sb-inner, info popovers
11. **View toggle** — which tab it appears on, how switchTab controls it
12. **Responsive breakpoints** — pixel values and what changes at each
13. **Key conventions** — DOM query pattern, filter pattern, build-once flags, adding tabs/facets
14. **What NOT to commit** — verify .gitignore matches

### Step 4 — Check skills registration

Verify that `CLAUDE.md` has a skills section registering all skills in `docs/skills/`. If any skill files exist in `docs/skills/` but are not registered in CLAUDE.md, add them.

The registration block should look like:

```markdown
## Skills

Skills are stored in `docs/skills/` and shared in the repo.

- **`/sync-recipes`** — Fetch fujixweekly.com recipe lists, diff against RECIPES in index.html, produce a ready-to-paste patch. See `docs/skills/sync-recipes.md`.
- **`/update-harness`** — Audit codebase and update CLAUDE.md to reflect current architecture. See `docs/skills/update-harness.md`.

To invoke: type the skill name (e.g. `/sync-recipes`) and Claude will follow the skill instructions.
```

If this section already exists, update it with any new/removed skills.

### Step 5 — Report

Print a final summary:
```
CLAUDE.md updated.
  Sections rewritten: N
  Sections unchanged: N
  Skills registered:  N
```

Then identify the single most stale or missing piece of documentation and call it out:
> Most important update: [what changed and why it matters for future sessions]

## Rules

- Read before writing — never update CLAUDE.md without reading the full source first
- One pass — audit everything in Step 2 before editing anything in Step 3
- Verify function existence — if you're about to document a function, grep for it first
- Don't bloat — if a section is already accurate and complete, don't rewrite it
- Don't document `.superpowers/` or `.claude/` internals — those are session artefacts, not architecture
