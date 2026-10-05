# Jin — Photography & Field Notes

A static, buildless personal homepage for photography, camera gear and setups,
Fujifilm/OM recipes, and practical learning guides.

## View locally

```bash
python3 -m http.server 8000
```

Open [localhost:8000](http://localhost:8000/). Use a server rather than `file://`
so lazy recipe loading and the shared data files behave as they do on GitHub Pages.

## Edit

- `index.html` — production shell and event wiring
- `styles.css` — responsive layout, light/dark appearance and component styling
- `site-ui.js` — Home, page headings, theme and scroll restoration
- `nav.js` — hash-based routing
- `personal-ui.js` / `recipes-ui.js` / `om-analysis.js` — functional renderers
- `gear.js` — editable personal gear and setup data
- `learn.js` — learning guides and exposure scenarios
- `gallery.js` — generated gallery manifest; never hand-edit

Only X-Trans V data loads at startup; other families load on demand. Correlation
views compute current-family statistics rather than using a saved snapshot.

The retired `refreshed.html` URL redirects to the main site. No preview assets
or shell generator are required.

## Check

```bash
node --test tools/test_*.cjs
python3 -m unittest discover -s tools -p 'test_*.py'
```

Optional real-browser checks are in `tools/smoke_site.cjs` (Playwright installed
outside the checkout; not a runtime dependency). See [design and deployment
notes](docs/site-design.md) for configuration and [repository guidance](AGENTS.md).
Historical designs/plans are indexed under [docs/superpowers](docs/superpowers/README.md);
they are not instructions for the current implementation. See the [repository
sweep report](docs/repository-audit.md) for verified fixes, retained items and the
pending agent-guidance update.

## Deploy

GitHub Pages serves the files as-is from the repository's configured branch.
Keep `.nojekyll`, relative case-correct asset paths, and hash routing. No npm or
build command is needed. Changes are published by the existing Pages deployment
after pushing to its configured branch; local edits alone are not published.
