# phosphor-web

Umbrella site for the **Phosphor** library suite, a set of Qt6 / Wayland
window-management primitives used by [PlasmaZones][pz] and other downstream
projects. Built with [Astro][astro] and deployed to GitHub Pages.

## Structure

```
src/
  pages/        route files (.astro / .ts) — one file per URL
  layouts/      BaseLayout shared by every page
  components/   reusable UI (Topbar, Sidebar, Cards, Tabs, search, …)
  content/      content collections (news), schema in content.config.ts
  data/         site data (libraries, nav, palette, OG, plasmazones/*)
  styles/       global CSS (home.css, guide.css)
  scripts/      client-side TS (theme toggle, search, palette)
  themes/       Expressive Code theme built from the palette
public/         static assets served as-is (.nojekyll, palette CSS, robots)
docs/           Doxygen tooling (Doxyfile + header/footer + CSS) for the API ref
scripts/        build + data-sync tooling (build-docs.sh, sync-plasmazones-data.mjs)
submodules/     branding submodule (logos, icons, canonical palette TOML)
```

## Local development

Install dependencies and start the dev server:

```sh
npm install
npm run dev          # astro dev — http://localhost:4321
```

Other scripts:

```sh
npm run build        # production build to dist/
npm run preview      # serve the built dist/ locally
npm run check        # astro check (type + content-collection checks)
```

Site search uses [Pagefind][pagefind], whose index is generated during
`npm run build`. Search therefore works under `npm run preview` but not
under `npm run dev`.

## Brand assets and palette

Logos, icons, and the canonical palette live in the
[`phosphor-works/branding`](https://github.com/phosphor-works/branding)
submodule under `submodules/branding/`. `public/palette/phosphor.toml` is a
symlink into it, and `src/data/palette.ts` reads that TOML to drive the
palette page and the Expressive Code theme. Initialise the submodule after
cloning:

```sh
git submodule update --init --recursive
```

## PlasmaZones gallery data

`src/data/plasmazones/{layouts,shaders,algorithms}.json` are generated
artifacts, synced from a local PlasmaZones checkout. Edit them upstream,
not here, then regenerate:

```sh
npm run sync:plasmazones                          # uses ../PlasmaZones
PLASMAZONES_SRC=~/src/PlasmaZones npm run sync:plasmazones
```

Algorithm previews need the `luau` binary on `PATH`; without it the existing
`algorithms.json` is left untouched. See `scripts/sync-plasmazones-data.mjs`.

## API documentation (Doxygen)

The Phosphor API reference under `/api/` is generated from the
`libs/phosphor-*/include/` headers in a sibling
[PlasmaZones](https://github.com/fuddlesworth/PlasmaZones) checkout. Install
`doxygen` + `graphviz`, then:

```sh
npm run docs                                    # uses ../PlasmaZones/ by default
PHOSPHOR_SRC=~/src/PlasmaZones npm run docs     # override the source path
npm run docs:clean                              # fresh rebuild
```

Output is `api/html/index.html`. `api/` is gitignored; the deploy workflow
builds it fresh and bundles it into the Pages artifact.

## Deploy (GitHub Pages)

`.github/workflows/deploy.yml` builds the site on every push to `main`. It
runs `npm run build`, builds the Doxygen reference, merges `api/` into the
Astro `dist/`, and uploads the result as the Pages artifact. Enable
**Settings → Pages → Source: GitHub Actions** on the repository to serve it.

## License

SPDX: `GPL-3.0-or-later` for code. Palette hex values themselves are facts and
unencumbered; brand assets in the branding submodule are CC-BY-SA 4.0.

[pz]: https://github.com/fuddlesworth/PlasmaZones
[astro]: https://astro.build/
[pagefind]: https://pagefind.app/
