// SPDX-FileCopyrightText: 2026 fuddlesworth
// SPDX-License-Identifier: GPL-3.0-or-later

import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";
import pagefind from "astro-pagefind";
import expressiveCode from "astro-expressive-code";
import mdx from "@astrojs/mdx";
import compress from "astro-compress";
import brokenLinks from "astro-broken-links-checker";

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

    integrations: [
        // Build-time syntax highlighting via Shiki.  Must come before
        // @astrojs/mdx so MDX code fences share the same renderer.
        // Options live in ./ec.config.mjs because themeCssSelector is
        // a function (non-serializable), and the <Code> component
        // requires the config to be loadable at runtime.
        expressiveCode(),

        // Markdown-in-JSX for future migration away from hand-rolled
        // <pre><code> blocks in .astro files.  Currently no .mdx pages
        // exist; the integration is wired so the extension-point pages
        // under /guides/ can migrate incrementally.
        mdx(),

        // Emits dist/sitemap-index.xml + dist/sitemap-0.xml at build time
        // covering every Astro-generated page.  Doxygen pages under
        // /api/html/ aren't included because they're copied into dist/
        // after the Astro build finishes (see .github/workflows/deploy.yml).
        sitemap(),

        // Runs pagefind over dist/ after astro build, emitting
        // dist/pagefind/ (WASM + index shards).  The doxygen tree has
        // its own search and isn't under dist/ at this point in the
        // deploy workflow, so we don't need to exclude it here.
        pagefind(),

        // Walks the final dist/ HTML looking for dead internal links.
        // Fails the build on broken references so /plasmazones/shortcut/
        // typos and stale /libraries/<slug>/ moves don't slip through.
        brokenLinks({
            checkExternalLinks: false,
        }),

        // HTML / CSS / JS / SVG minification on the built tree.  Images
        // are left alone since Astro's own <Image> pipeline already
        // handles them.  Runs last so it sees the final, pagefind-and-
        // sitemap-completed output.
        compress({
            Image: false,
        }),
    ],

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
                // /pagefind/pagefind.js is emitted by astro-pagefind's
                // post-build hook into dist/pagefind/ AFTER Vite runs.
                // It doesn't exist during bundling, so mark it external
                // — the browser picks it up from the same origin at
                // runtime via the dynamic import() in search.ts.
                external: [/\/pagefind\//],
                output: {
                    assetFileNames: "_astro/[name].[hash][extname]",
                },
            },
        },
    },
});
