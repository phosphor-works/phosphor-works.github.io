// SPDX-FileCopyrightText: 2026 fuddlesworth
// SPDX-License-Identifier: GPL-3.0-or-later
//
// Auto-generated per-library Open Graph card.  One 1200x630 SVG per
// library in LIBRARIES — the URL shape (/og/library/<slug>.svg) is
// referenced from libraries/[slug].astro's `ogImage` prop, which
// BaseLayout then resolves to an absolute URL for the share card.
//
// SVGs render fine in every modern scraper (Mastodon, LinkedIn,
// Discord, Slack); PNG fallbacks aren't needed for this audience.

import type { APIRoute } from "astro";
import { LIBRARIES } from "../../../data/libraries";

// Basic XML escape — library descriptions come from a typed catalog
// we control, but anything that ends up in <text> still needs to be
// safe against ampersands / angle brackets.
const esc = (s: string) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// Break a long one-liner across two text lines at the nearest space
// under a target width budget.  We can't measure glyph widths without
// a font file; approximate by character count (fine for Inter at this
// size range).
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
    const line2 = words.slice(i).join(" ");
    return [line1 || text, line2];
}

function renderCard(slug: string, oneLiner: string): string {
    const name = `phosphor-${slug}`;
    const [l1, l2] = wrapTwoLines(oneLiner, 62);
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

    <!-- Brand rule at the top, matching the site's accent gradient. -->
    <rect x="0" y="0" width="1200" height="8" fill="url(#accent)"/>

    <!-- Eyebrow: project umbrella. -->
    <text x="72" y="128"
          font-family="ui-sans-serif, system-ui, 'Inter', sans-serif"
          font-size="22" font-weight="600" letter-spacing="4"
          fill="#94A3B8">
        PHOSPHOR · LIBRARY
    </text>

    <!-- Library name in a big monospace.  The doxygen link blue reads
         correctly against the deep-navy bg and echoes the site's
         identifier color. -->
    <text x="72" y="280"
          font-family="ui-monospace, 'JetBrains Mono', monospace"
          font-size="96" font-weight="700"
          fill="#60A5FA">
        ${esc(name)}
    </text>

    <!-- One-liner, broken to two lines so the visual weight stays
         centered even for longer descriptions. -->
    <text x="72" y="390"
          font-family="ui-sans-serif, system-ui, 'Inter', sans-serif"
          font-size="36" font-weight="500"
          fill="#E6EDFF">
        ${esc(l1)}
    </text>
    ${l2 ? `<text x="72" y="440"
          font-family="ui-sans-serif, system-ui, 'Inter', sans-serif"
          font-size="36" font-weight="500"
          fill="#E6EDFF">
        ${esc(l2)}
    </text>` : ""}

    <!-- Footer strip: the site root so scrapers that pull the OG
         card also surface where to find it. -->
    <text x="72" y="560"
          font-family="ui-monospace, 'JetBrains Mono', monospace"
          font-size="24" font-weight="500"
          fill="#64748B">
        phosphor-works.github.io
    </text>

    <!-- Phi corner glyph — cheap signature, no font dep. -->
    <g transform="translate(1060, 500)" stroke="url(#accent)" stroke-width="6" fill="none" stroke-linecap="round">
        <line x1="32" y1="-24" x2="32" y2="80"/>
        <circle cx="32" cy="28" r="28"/>
    </g>
</svg>`;
}

export function getStaticPaths() {
    return LIBRARIES.map(lib => ({
        params: { slug: lib.slug },
        props: { slug: lib.slug, oneLiner: lib.oneLiner },
    }));
}

export const GET: APIRoute = ({ props }) => {
    const { slug, oneLiner } = props as { slug: string; oneLiner: string };
    return new Response(renderCard(slug, oneLiner), {
        headers: {
            "Content-Type": "image/svg+xml; charset=utf-8",
            "Cache-Control": "public, max-age=3600",
        },
    });
};
