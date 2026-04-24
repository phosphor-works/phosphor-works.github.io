// SPDX-FileCopyrightText: 2026 fuddlesworth
// SPDX-License-Identifier: GPL-3.0-or-later
//
// Shared site-theme driver.  Two entry points:
//   - initThemeToggle() wires the ThemeToggle button in the topbar.
//   - setSiteTheme(theme) is the low-level setter; the palette page's
//     own toggle delegates to it so the two UIs stay in sync.
//
// All state lives in localStorage["phosphor-theme"] and on
// document.documentElement.dataset.theme.  The pre-paint inline
// script in BaseLayout.astro does the initial read; this module
// handles user-triggered changes after the page is live.

export type SiteTheme = "dark" | "light";
const STORAGE_KEY = "phosphor-theme";

export function getSiteTheme(): SiteTheme {
    const v = document.documentElement.dataset.theme;
    return v === "light" ? "light" : "dark";
}

export function setSiteTheme(theme: SiteTheme): void {
    document.documentElement.dataset.theme = theme;
    try { localStorage.setItem(STORAGE_KEY, theme); } catch {}

    // Palette-page integration: swap the preview stylesheet link.
    // The palette imports its page-specific CSS from
    // /palette/preview.<theme>.css and we swap the href on the
    // <link id="theme-link"> whenever the site theme flips.  The
    // element only exists on the palette page; the lookup is cheap
    // on every other page and safely returns null.
    const link = document.getElementById("theme-link") as HTMLLinkElement | null;
    if (link) link.href = `/palette/preview.${theme}.css`;
}

export function initThemeToggle(): void {
    const btn = document.querySelector<HTMLButtonElement>("[data-site-theme-toggle]");
    if (!btn) return;
    btn.addEventListener("click", () => {
        setSiteTheme(getSiteTheme() === "dark" ? "light" : "dark");
    });

    // Cross-tab sync.  If another tab flips the theme, mirror here.
    window.addEventListener("storage", (e) => {
        if (e.key !== STORAGE_KEY) return;
        if (e.newValue === "dark" || e.newValue === "light") {
            setSiteTheme(e.newValue);
        }
    });
}
