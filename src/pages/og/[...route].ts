// SPDX-FileCopyrightText: 2026 fuddlesworth
// SPDX-License-Identifier: GPL-3.0-or-later
//
// Build-time OG-image route.  Each entry below produces a 1200×630
// PNG at /og/<slug>.png suitable for og:image / twitter:image.
// Pages opt in by passing `ogImage="/og/<slug>.png"` to BaseLayout.
//
// Why a hand-listed enumeration instead of crawling every page:
//   • Astro 4's getStaticPaths needs to know every route at build
//     time, and there's no first-class "all pages on the site"
//     iterator without content collections.
//   • Most pages share the same template — only the headline-tier
//     pages (top-level + per-library) really benefit from a unique
//     OG image.  Burning canvas time on every single page would
//     bloat the build for marginal social-share gain.
// Add new entries here when a page wants its own OG card.

import { OGImageRoute } from "astro-og-canvas";
import { LIBRARIES } from "../../data/libraries";

interface OgPage {
    title: string;
    description: string;
}

const pages: Record<string, OgPage> = {
    "index": {
        title: "Phosphor",
        description:
            "Qt6 and Wayland libraries for window-management tools.",
    },
    "plasmazones": {
        title: "PlasmaZones",
        description:
            "Zone-based window tiling for KDE Plasma.  Layouts, shaders, "
            + "and autotile algorithms — drop a window, snap to a zone.",
    },
    "libraries": {
        title: "Libraries",
        description:
            `${LIBRARIES.length} focused libraries, each with a single `
            + "responsibility.  Wire them together to build new tools.",
    },
    "api": {
        title: "API reference",
        description:
            "Doxygen-generated reference covering every public type "
            + "across the Phosphor library suite.",
    },
    "brand": {
        title: "Brand",
        description:
            "Canonical SVG logos, color tokens, and usage guidelines.",
    },
    "guides": {
        title: "Guides",
        description: "Walkthroughs and integration recipes for the Phosphor stack.",
    },
    "palette": {
        title: "Palette",
        description: "Material You roles, ANSI 16 mapping, click-to-copy swatches.",
    },
    "about": {
        title: "About Phosphor",
        description:
            "Origin story, contributing, and the AI-assisted-development "
            + "disclosure.",
    },
};

// One OG card per library — these are the pages that get linked
// directly from external API references and search results, so a
// recognisable per-library card actually pays off.
for (const lib of LIBRARIES) {
    pages[`libraries/${lib.slug}`] = {
        title: `phosphor-${lib.slug}`,
        description: lib.oneLiner,
    };
}

export const { getStaticPaths, GET } = OGImageRoute({
    pages,
    param: "route",
    getImageOptions: (_path, page: OgPage) => ({
        title: page.title,
        description: page.description,
        bgGradient: [
            [7, 15, 34],     // #070F22 — deep navy (matches site theme-color)
            [11, 23, 48],    // #0B1730 — slightly lifted navy
        ],
        // Phosphor brand sweep border: cyan → blue → purple → rose.
        // astro-og-canvas only renders a single border colour, so we
        // pick the dominant brand-cyan.  The full gradient lives in
        // the static og-image.svg and the favicons.
        border: {
            color: [34, 211, 238], // #22D3EE — brand cyan
            width: 4,
            side: "block-start",
        },
        font: {
            title: {
                color: [246, 249, 255], // #F6F9FF
                size: 72,
                weight: "Bold",
                lineHeight: 1.15,
            },
            description: {
                color: [184, 200, 224],
                size: 32,
                lineHeight: 1.4,
            },
        },
        padding: 64,
        // Logo would land here — we ship SVGs and astro-og-canvas
        // wants a raster path, so leaving this off until we add
        // a public/og-logo.png raster.  The bg gradient + brand
        // accent are enough on their own for a recognisable card.
    }),
});
