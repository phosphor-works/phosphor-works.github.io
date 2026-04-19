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
```

## Local preview

No build step — everything is plain HTML + CSS + vanilla JS. Either open
`index.html` directly in a browser, or serve the directory statically:

```sh
python3 -m http.server 8080
# then open http://localhost:8080
```

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
