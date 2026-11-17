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

## Upstream checkouts

The gallery data and the API reference are built from other repositories,
checked out next to this one:

| Checkout | Used for | Override |
| --- | --- | --- |
| `../PlasmaZones` | layouts, overlays, animations, scrolling templates, algorithms, changelog, D-Bus XML | `PLASMAZONES_SRC` |
| `../phosphor-surface-packs` | the surface shader gallery | `PHOSPHOR_SURFACE_PACKS_SRC` |
| `../phosphor-libs` | core library headers, the `pluau` prelude for algorithm previews | `PHOSPHOR_LIBS_SRC` |
| `../phosphor-shell-libs` | shell library headers | `PHOSPHOR_SHELL_LIBS_SRC` |

Set `PHOSPHOR_WORKS_SRC` to look for all of them in another directory, or
one of the per-repository variables to point at a single checkout.

## PlasmaZones gallery data

`src/data/plasmazones/*.json` are generated artifacts, synced from the
checkouts above. Edit them upstream, not here, then regenerate:

```sh
npm run sync:plasmazones
PHOSPHOR_WORKS_SRC=~/src npm run sync:plasmazones
```

Algorithm previews need the `luau` binary on `PATH`; without it the existing
`algorithms.json` is left untouched. See `scripts/sync-plasmazones-data.mjs`.

## API documentation (Doxygen)

The Phosphor API reference under `/api/` is generated from the
`libs/phosphor-*/include/` headers in the sibling
[phosphor-libs](https://github.com/phosphor-works/phosphor-libs) and
[phosphor-shell-libs](https://github.com/phosphor-works/phosphor-shell-libs)
checkouts, with D-Bus pages from PlasmaZones. Install `doxygen` + `graphviz`,
then:

```sh
npm run docs                                # uses the sibling checkouts
PHOSPHOR_WORKS_SRC=~/src npm run docs       # look for them somewhere else
npm run docs:clean                          # fresh rebuild
```

Output is `api/html/index.html`. `api/` is gitignored; the deploy workflow
builds it fresh and bundles it into the Pages artifact.

## Deploy (GitHub Pages)

`.github/workflows/deploy.yml` builds the site on every push to `main` and
once a night. It runs `npm run build`, builds the Doxygen reference, merges
`api/` into the Astro `dist/`, and uploads the result as the Pages artifact.
Enable **Settings → Pages → Source: GitHub Actions** on the repository to
serve it.

Every deploy first refreshes what the site mirrors from other repos: both
submodules move to the tip of their upstream `main`, the four upstream
repositories above are cloned at `main` into `_src/`, and
`npm run sync:plasmazones` runs against them. None of that is
committed back, so the submodule pointers and `src/data/plasmazones/` in this
repo are only what a local build starts from. `settings.json` is the
exception: it needs a built PlasmaZones tree, so the deploy uses the committed
copy and it still has to be synced and committed by hand.

## License

SPDX: `GPL-3.0-or-later` for code. Palette hex values themselves are facts and
unencumbered; brand assets in the branding submodule are CC-BY-SA 4.0.

[pz]: https://github.com/phosphor-works/PlasmaZones
[astro]: https://astro.build/
[pagefind]: https://pagefind.app/
