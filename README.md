# phosphor-web

Static umbrella site for the **Phosphor** library suite — a set of Qt6 / Wayland
window-management primitives used by [PlasmaZones][pz] and other downstream
projects.

## Structure

```
/                     landing page — suite overview
/palette/             Phosphor brand palette reference
  ├─ index.html         visual swatch preview (dark/light theme toggle)
  └─ phosphor.toml      canonical palette source (Material You + ANSI 16)
/api/html/            Doxygen-generated API reference (GITIGNORED)
/docs/                Doxygen tooling (Doxyfile + header/footer + CSS)
/scripts/
  └─ build-docs.sh      regenerates /api/ from a sibling PlasmaZones3 checkout
```

## Local preview

No build step for the site itself — everything is plain HTML + CSS + vanilla
JS. Either open `index.html` directly in a browser, or serve the directory
statically:

```sh
python3 -m http.server 8080
# then open http://localhost:8080
```

## API documentation (Doxygen)

The Phosphor API reference under `/api/` is generated from the
`libs/phosphor-*/include/` headers in a sibling
[PlasmaZones3](https://github.com/fuddlesworth/PlasmaZones) checkout.
Install `doxygen` + `graphviz`, then:

```sh
./scripts/build-docs.sh                         # uses ../PlasmaZones3/ by default
PHOSPHOR_SRC=~/src/PlasmaZones ./scripts/build-docs.sh  # override path
./scripts/build-docs.sh --clean --open          # fresh rebuild + xdg-open
```

The script fetches [doxygen-awesome-css](https://github.com/jothepro/doxygen-awesome-css)
on first run (cached under `docs/.cache/`), then runs Doxygen with the
Phosphor-branded header/footer + brand-color CSS overrides. Output is
`./api/html/index.html`.

`/api/` is gitignored — the site only ships it when the deploy pipeline
builds docs fresh. When a CI workflow is added, it'll check out both repos,
run `build-docs.sh`, and upload `/api/` as part of the Pages artifact.

## Deploy (GitHub Pages)

The site is Pages-ready as-is:

- Plain `.html` / `.css` / `.js` files at paths that work from a subdirectory
- `.nojekyll` at the root so Pages ships files starting with `_` untouched
- No server-side rendering, no build artifacts to track

When a remote is added, enable **Settings → Pages → Source: Deploy from a
branch** on the repository and pick the default branch's root. A
`.github/workflows/deploy.yml` can be added later for branch-agnostic
artifact-based deploys.

## License

SPDX: `GPL-3.0-or-later` for code; palette hex values themselves are facts and
unencumbered.

[pz]: https://github.com/fuddlesworth/PlasmaZones
