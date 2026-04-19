// SPDX-FileCopyrightText: 2026 fuddlesworth
// SPDX-License-Identifier: GPL-3.0-or-later

import { defineConfig } from "astro/config";

// https://astro.build/config
export default defineConfig({
    // Root-org-site is served from https://phosphor-works.github.io/ with
    // no path prefix.  `site` feeds into absolute-URL generation (e.g.
    // canonical links, sitemap).  `base` stays empty because we're at
    // the domain root.
    site: "https://phosphor-works.github.io",
    base: "/",

    // Emit static HTML only — no server adapter.  GitHub Pages serves
    // the `dist/` tree verbatim.
    output: "static",

    // Copy `public/` through to `dist/` unchanged.  The doxygen build
    // output is NOT under public/ — it lives at `./api/` and gets
    // copied into `dist/api/` by the deploy workflow after astro build.
    build: {
        format: "directory",
    },

    // Deterministic asset naming keeps diffs between builds smaller
    // when the content hasn't actually changed.
    vite: {
        build: {
            rollupOptions: {
                output: {
                    assetFileNames: "_astro/[name].[hash][extname]",
                },
            },
        },
    },
});
