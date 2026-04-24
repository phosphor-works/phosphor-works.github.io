// SPDX-FileCopyrightText: 2026 fuddlesworth
// SPDX-License-Identifier: GPL-3.0-or-later
//
// Palette page interactivity.  The brand/role/gradient/ansi grids are
// SSR-rendered by palette/index.astro; this script only wires up two
// behaviors: theme toggle (dark ↔ light) and click-to-copy on any
// element carrying a data-hex attribute.  No FOUC because the default
// (dark) is already rendered and visible when this runs.

type Theme = "dark" | "light";

// The palette page's outer .container carries `data-palette-theme`;
// the CSS selector that hides the inactive variant is scoped to it,
// so we flip the attribute on this exact node (not document.html).
const container = document.querySelector<HTMLElement>("[data-palette-theme]");

const applyTheme = (theme: Theme) => {
    if (container) container.dataset.paletteTheme = theme;
    const link = document.getElementById("theme-link") as HTMLLinkElement | null;
    if (link) link.href = `/palette/preview.${theme}.css`;
    document.querySelectorAll<HTMLElement>("[data-theme-btn]").forEach(b => {
        b.classList.toggle("active", b.dataset.themeBtn === theme);
    });
};

document.querySelectorAll<HTMLElement>("[data-theme-btn]").forEach(btn => {
    btn.addEventListener("click", () => {
        const t = btn.dataset.themeBtn as Theme | undefined;
        if (t === "dark" || t === "light") applyTheme(t);
    });
});

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
