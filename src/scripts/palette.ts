// SPDX-FileCopyrightText: 2026 fuddlesworth
// SPDX-License-Identifier: GPL-3.0-or-later
//
// Palette page interactivity.  The brand/role/gradient/ansi grids are
// SSR-rendered by palette/index.astro; this script only wires up two
// behaviors: theme toggle (dark ↔ light) and click-to-copy on any
// element carrying a data-hex attribute.  No FOUC because the default
// (dark) is already rendered and visible when this runs.

import { setSiteTheme, getSiteTheme, type SiteTheme } from "./theme";

// The palette's in-hero Dark/Light buttons delegate to the site-wide
// theme setter — flipping the palette's local state AND the global
// html[data-theme] at the same time, so the topbar's ThemeToggle and
// the palette's own buttons can't fall out of sync.
document.querySelectorAll<HTMLElement>("[data-theme-btn]").forEach(btn => {
    btn.addEventListener("click", () => {
        const t = btn.dataset.themeBtn as SiteTheme | undefined;
        if (t === "dark" || t === "light") setSiteTheme(t);
    });
});

// Initial button-active mirror: whichever theme the pre-paint script
// picked.  setSiteTheme also handles this on user clicks.
setSiteTheme(getSiteTheme());

document.addEventListener("click", async (e) => {
    const target = (e.target as HTMLElement | null)?.closest<HTMLElement>("[data-hex]");
    if (!target) return;
    const hex = target.dataset.hex;
    if (!hex) return;
    try {
        await navigator.clipboard.writeText(hex);
        target.classList.add("copied");
        setTimeout(() => target.classList.remove("copied"), 900);
    } catch {
        /* clipboard blocked — silent */
    }
});
