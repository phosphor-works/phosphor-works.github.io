// SPDX-FileCopyrightText: 2026 fuddlesworth
// SPDX-License-Identifier: GPL-3.0-or-later
//
// Build-time Open Graph card endpoint.  One 1200x630 SVG per entry
// in the OG_PAGES registry, served at /og/<slug>.svg.  BaseLayout's
// auto-resolver maps page pathnames to the same slugs, so adding a
// page card is a one-line edit in src/data/og.ts and nothing else.
//
// SVGs render fine in every modern scraper (Mastodon, LinkedIn,
// Discord, Slack); a PNG generator (astro-og-canvas) used to live
// alongside this file but produced unused images and dragged in a
// canvas dep.  Removed once SVGs proved sufficient.

import type { APIRoute } from "astro";
import { getOgPages, type OgPage } from "../../data/og";

// Basic XML escape for any text we drop into <text> nodes.  Page
// data comes from a typed registry we control, but ampersands /
// angle brackets in descriptions still need to be safe.
const esc = (s: string) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// Break a long one-liner across two text lines at the nearest space
// under a target width budget.  We can't measure glyph widths without
// a font file; approximate by character count (fine for Inter at the
// sizes used here).
function wrapTwoLines(text: string, maxCharsPerLine: number): [string, string] {
    if (text.length <= maxCharsPerLine) return [text, ""];
    const words = text.split(" ");
    let line1 = "";
    let i = 0;
    for (; i < words.length; i++) {
        const next = line1 ? `${line1} ${words[i]}` : words[i];
        if (next.length > maxCharsPerLine) break;
        line1 = next;
    }
    return [line1 || text, words.slice(i).join(" ")];
}

function renderCard(page: OgPage): string {
    const wrapBudget = page.mono ? 62 : 58;
    const [d1, d2] = wrapTwoLines(page.description, wrapBudget);
    const titleFont = page.mono
        ? "ui-monospace, 'JetBrains Mono', monospace"
        : "ui-sans-serif, system-ui, 'Inter', sans-serif";
    // Mono titles read as code (phosphor-foo) — link blue makes the
    // identifier feel hyperlinky and matches the doxygen accent.
    // Sans titles are headlines — full-strength foreground.
    const titleColor = page.mono ? "#60A5FA" : "#F6F9FF";
    const titleSize  = page.mono ? 96 : 92;

    return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630" width="1200" height="630">
    <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="1200" y2="630" gradientUnits="userSpaceOnUse">
            <stop offset="0"    stop-color="#0B1730"/>
            <stop offset="0.6"  stop-color="#070F22"/>
            <stop offset="1"    stop-color="#050916"/>
        </linearGradient>
        <linearGradient id="accent" x1="0" y1="0" x2="1200" y2="0" gradientUnits="userSpaceOnUse">
            <stop offset="0"    stop-color="#22D3EE"/>
            <stop offset="0.35" stop-color="#3B82F6"/>
            <stop offset="0.7"  stop-color="#A855F7"/>
            <stop offset="1"    stop-color="#F43F5E"/>
        </linearGradient>
        <linearGradient id="halo" x1="0" y1="0" x2="1200" y2="630" gradientUnits="userSpaceOnUse">
            <stop offset="0"   stop-color="#22D3EE" stop-opacity="0.12"/>
            <stop offset="0.5" stop-color="#3B82F6" stop-opacity="0.08"/>
            <stop offset="1"   stop-color="#A855F7" stop-opacity="0.10"/>
        </linearGradient>
    </defs>

    <rect width="1200" height="630" fill="url(#bg)"/>
    <rect width="1200" height="630" fill="url(#halo)"/>

    <!-- Brand rule across the top, matching the site's accent gradient. -->
    <rect x="0" y="0" width="1200" height="8" fill="url(#accent)"/>

    <!-- Eyebrow: section context (project / parent / "library"). -->
    <text x="72" y="128"
          font-family="ui-sans-serif, system-ui, 'Inter', sans-serif"
          font-size="22" font-weight="600" letter-spacing="4"
          fill="#94A3B8">${esc(page.eyebrow)}</text>

    <!-- Title: the page name, large.  Sans for prose pages, mono
         for package names so they read as code. -->
    <text x="72" y="280"
          font-family="${titleFont}"
          font-size="${titleSize}" font-weight="700"
          fill="${titleColor}">${esc(page.title)}</text>

    <!-- Description: one-liner, broken to two lines so longer
         summaries don't crowd the corner glyph. -->
    <text x="72" y="390"
          font-family="ui-sans-serif, system-ui, 'Inter', sans-serif"
          font-size="36" font-weight="500"
          fill="#E6EDFF">${esc(d1)}</text>
    ${d2 ? `<text x="72" y="440"
          font-family="ui-sans-serif, system-ui, 'Inter', sans-serif"
          font-size="36" font-weight="500"
          fill="#E6EDFF">${esc(d2)}</text>` : ""}

    <!-- Footer strip: site root so cards surface where they came from. -->
    <text x="72" y="560"
          font-family="ui-monospace, 'JetBrains Mono', monospace"
          font-size="24" font-weight="500"
          fill="#64748B">phosphor-works.github.io</text>

    <!-- Phi corner glyph — cheap signature, no font dep. -->
    <g transform="translate(1060, 500)" stroke="url(#accent)" stroke-width="6" fill="none" stroke-linecap="round">
        <line x1="32" y1="-24" x2="32" y2="80"/>
        <circle cx="32" cy="28" r="28"/>
    </g>
</svg>`;
}

export async function getStaticPaths() {
    const pages = await getOgPages();
    return Object.entries(pages).map(([route, page]) => ({
        params: { route },
        props: { page },
    }));
}

export const GET: APIRoute = ({ props }) => {
    const { page } = props as { page: OgPage };
    return new Response(renderCard(page), {
        headers: {
            "Content-Type": "image/svg+xml; charset=utf-8",
            "Cache-Control": "public, max-age=3600",
        },
    });
};
