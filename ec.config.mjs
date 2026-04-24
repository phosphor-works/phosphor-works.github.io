// SPDX-FileCopyrightText: 2026 fuddlesworth
// SPDX-License-Identifier: GPL-3.0-or-later
//
// Expressive Code lives in its own config file because the
// themeCssSelector callback isn't JSON-serializable, and the
// <Code> component needs to load the renderer at runtime from
// a serializable source.

import { defineEcConfig } from "astro-expressive-code";

export default defineEcConfig({
    themes: ["github-dark-dimmed", "github-light"],
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
