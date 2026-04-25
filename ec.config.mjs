// SPDX-FileCopyrightText: 2026 fuddlesworth
// SPDX-License-Identifier: GPL-3.0-or-later
//
// Expressive Code lives in its own config file because the
// themeCssSelector callback isn't JSON-serializable, and the
// <Code> component needs to load the renderer at runtime from
// a serializable source.
//
// Two things are non-obvious here:
//
// 1. Theme bodies are passed as plain parsed objects, not as
//    `ExpressiveCodeTheme` instances.  EC loads that class from both
//    `astro-expressive-code` and `@expressive-code/core` across the
//    pipeline; an instance built here fails the downstream
//    `instanceof ExpressiveCodeTheme` check and EC silently falls
//    back to its bundled github-dark / github-light defaults.  Plain
//    objects go through the "must construct" branch and get wrapped
//    with the correct class identity, so highlighting actually uses
//    our settings.
//
// 2. The theme files are read with plain relative paths ("src/...")
//    rather than `new URL(...)`.  Both read identical content, but
//    the URL-object form makes EC / Vite's config pipeline skip the
//    theme (again silently falling back to github defaults).  Relies
//    on Astro running with the project root as CWD, which it does.

import { defineEcConfig } from "astro-expressive-code";

// Themes are built programmatically from the Material You palette
// tokens documented in src/data/palette.ts.  Mapping lives in
// src/themes/build-phosphor-themes.mjs — single source of truth for
// "this M3 role drives this kind of token", so the syntax theme
// follows whenever the palette is rebalanced.  See that file for
// the role mapping (e.g. M3.error → strings, M3.tertiary → types).
import {
    phosphorDark,
    phosphorLight,
} from "./src/themes/build-phosphor-themes.mjs";

export default defineEcConfig({
    themes: [phosphorDark, phosphorLight],
    // Site theme toggles via [data-theme="dark"|"light"] on <html>
    // (see BaseLayout.astro).  Match that rather than the default
    // prefers-color-scheme media query.
    themeCssSelector: (theme) => `[data-theme="${theme.type}"]`,
    defaultProps: {
        // No editor/terminal chrome — keeps the bare-block look the
        // old hljs component rendered inside .guide <pre>.
        frame: "none",
    },
    styleOverrides: {
        borderRadius: "var(--radius-sm)",
        borderColor: "var(--border)",
        codeFontFamily: "'JetBrains Mono', ui-monospace, monospace",
        codeFontSize: "12.5px",
        codeLineHeight: "1.6",
        uiFontFamily: "'JetBrains Mono', ui-monospace, monospace",
    },
});
