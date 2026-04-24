// SPDX-FileCopyrightText: 2026 fuddlesworth
// SPDX-License-Identifier: GPL-3.0-or-later
//
// Palette page interactivity.  The brand/role/gradient/ansi grids are
// SSR-rendered by palette/index.astro and the dark/light theme is
// driven entirely by the site-wide ThemeToggle in the topbar — so all
// this script has left to do is click-to-copy on any element carrying
// a data-hex attribute.

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
