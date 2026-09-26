# Commandeer

JMeter command-ladder generator. Zero runtime and zero dev dependencies.

## Run

- **Development:** open `docs/index.html` directly. No server and no build step needed; it works from `file://`.
- **Distribute to client machines:** `node tools/build.mjs` → `dist/commandeer.html`, one self-contained file with no external references (the build fails if any remain).
- **Test:** `npm test` (Node ≥ 18, built-in `node:test`).

## Layout

```
docs/                      (served by GitHub Pages: Settings → Pages → main /docs)
  index.html               markup only + <template>s for repeated rows
  css/
    tokens.css             design tokens (the only place colours/sizes live)
    base.css               reset, element defaults
    layout.css             app shell, topbar, workspace grid
    components.css         section, field, input, stepper, buttons, slider, seg
    preview.css            preview panel + syntax colours
    overlays.css           drawer, prop rows, toast
    responsive.css         breakpoints 900 / 720 / 560
  js/
    core/                  PURE — no DOM, no storage. Unit-tested in Node.
      config.js            DEFAULTS, limits, storage key, initial state
      utils.js             esc, sanitize, parseList, clamp, clone
      distribution.js      ★ rounding (distribute / distributeExact / evenPcts)
      ladder.js            ★ buildLadder, propNames
      format.js            ★ RUNME text format, header, filename
      model.js             validate → ladder → distribute → text
    services/
      storage.js           localStorage that never throws (memory fallback)
      state.js             the app state + every non-trivial state transition
    ui/                    DOM only; reads state, calls services, never computes
      dom.js               byId, templates, toast
      highlight.js         RUNME text → coloured HTML
      scenario-table.js    distribution rows (delegated events)
      property-list.js     per-scenario -J names
      preview.js           preview pane, meta strip, button enablement
      drawer.js            preferences slide-over
      forms.js             declarative field ↔ state binding, rounding, reset
      export.js            download / copy
    app.js                 composition root: wires everything, owns refresh()
tests/
  fixtures/golden-v1.json  output captured from the verified v1 build
  golden.test.js           byte-for-byte output regression
  distribution.test.js     rounding rules over 5,000 generated splits each
  ladder.test.js, state.test.js
tools/build.mjs            inliner → dist/commandeer.html
```

★ = correctness-critical. Change only with tests.

## Rules

1. **Data flow is one-way:** event → `state` (via `services/state.js` or a direct field set) → `app.refresh()` → `buildModel(state)` → `ui/preview`. UI modules never compute distributions or text.
2. **`core/` stays pure.** No `document`, `window` or `localStorage`. The clock is injected (`buildModel(state, now)`).
3. **Scripts are classic, not ES modules.** Module scripts are blocked on `file://` in Chromium. Each file is an IIFE that registers itself on `globalThis.Commandeer`. Load order is dependency order in `index.html`.
4. **Golden fixtures are a contract.** Regenerate them only for an intended output change, and say so in the commit.
5. **Adding a plain setting:** one line in `SETTINGS_FIELDS` (`ui/forms.js`), one input in `index.html`, a default in `config.js`.
