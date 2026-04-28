// SPDX-FileCopyrightText: 2026 fuddlesworth
// SPDX-License-Identifier: GPL-3.0-or-later
//
// Single source of truth for which routes get a generated OG card.
// Both the SVG endpoint (src/pages/og/[...route].svg.ts) and the
// BaseLayout's auto-resolver consume this registry, so adding a new
// page card is a one-line edit here — no drift between the URL the
// scraper requests and the URL BaseLayout emits.
//
// News-post cards are merged in at request time from the `news`
// content collection, so each post automatically gets a card with no
// further wiring.

import { getCollection } from "astro:content";
import { LIBRARIES } from "./libraries";

export interface OgPage {
    /** Small uppercase section label rendered above the title.
     *  E.g. "PHOSPHOR · LIBRARY" or "PLASMAZONES". */
    eyebrow: string;
    /** Big headline.  Keep under ~28 chars for sans, ~24 for mono. */
    title: string;
    /** One-line summary; auto-wraps to a second line if needed. */
    description: string;
    /** Render the title in monospace at a slightly smaller size.
     *  Used for package names that read as code (phosphor-foo). */
    mono?: boolean;
}

// Top-level + sub-page cards.  Library cards are appended below
// from the LIBRARIES catalog so each new entry gets a card for free.
const STATIC_PAGES: Record<string, OgPage> = {
    "index": {
        eyebrow: "PHOSPHOR",
        title: "Phosphor",
        description: "Qt6 and Wayland libraries for window-management tools.",
    },

    // PlasmaZones — flagship app + 8 sub-pages
    "plasmazones": {
        eyebrow: "PHOSPHOR · APP",
        title: "PlasmaZones",
        description: "Zone-based window tiling for KDE Plasma. Drop a window, snap to a zone.",
    },
    "plasmazones/getting-started": {
        eyebrow: "PLASMAZONES",
        title: "Getting started",
        description: "First-run tour: verify the install, open the zone editor, snap your first window.",
    },
    "plasmazones/shortcuts": {
        eyebrow: "PLASMAZONES",
        title: "Keyboard shortcuts",
        description: "Drag-snap, zone navigation, layout cycling, autotile, and virtual screens.",
    },
    "plasmazones/from-fancyzones": {
        eyebrow: "PLASMAZONES",
        title: "From FancyZones",
        description: "PlasmaZones for Windows FancyZones users — feature map and keyboard equivalents.",
    },
    "plasmazones/dbus": {
        eyebrow: "PLASMAZONES",
        title: "D-Bus scripting",
        description: "Service map, common recipes, signal watching, and the interface XML.",
    },
    "plasmazones/troubleshooting": {
        eyebrow: "PLASMAZONES",
        title: "Troubleshooting",
        description: "Daemon not starting, zones not appearing, KCM cache, verbose logging, support reports.",
    },
    "plasmazones/autotile": {
        eyebrow: "PLASMAZONES · GALLERY",
        title: "Autotile algorithms",
        description: "Every built-in JavaScript autotile algorithm grouped by family with parameters.",
    },
    "plasmazones/layouts": {
        eyebrow: "PLASMAZONES · GALLERY",
        title: "Layout gallery",
        description: "Standard, portrait, ultrawide, and superwide variants with live-rendered previews.",
    },
    "plasmazones/shaders": {
        eyebrow: "PLASMAZONES · GALLERY",
        title: "Shader gallery",
        description: "GLSL shaders: branded, audio-reactive, cyberpunk, energy, organic, and 3D categories.",
    },

    // Libraries landing
    "libraries": {
        eyebrow: "PHOSPHOR",
        title: "Libraries",
        description: `${LIBRARIES.length} focused libraries, each with a single responsibility.`,
    },

    // Guides — landing + 3 walkthroughs
    "guides": {
        eyebrow: "PHOSPHOR",
        title: "Guides",
        description: "Walkthroughs and integration recipes for the Phosphor stack.",
    },
    "guides/install": {
        eyebrow: "GUIDES",
        title: "Install a library",
        description: "Include a Phosphor library in Qt6 CMake: find_package, FetchContent, and Nix.",
    },
    "guides/shaders": {
        eyebrow: "GUIDES",
        title: "Shader authoring",
        description: "Custom GLSL for zone overlays. Uniform contract, metadata, audio, multipass.",
    },
    "guides/tiling": {
        eyebrow: "GUIDES",
        title: "Tiling algorithms",
        description: "JavaScript tilers in a sandbox. Metadata tags, built-in helpers, hot-reload.",
    },

    // API
    "api": {
        eyebrow: "PHOSPHOR",
        title: "API reference",
        description: "Doxygen-generated reference covering every public type in the Phosphor suite.",
    },

    // Brand + Palette
    "brand": {
        eyebrow: "PHOSPHOR",
        title: "Brand assets",
        description: "Canonical SVG logos, color tokens, and usage guidelines.",
    },
    "palette": {
        eyebrow: "PHOSPHOR",
        title: "Palette",
        description: "Material You roles, ANSI 16 mapping, click-to-copy swatches.",
    },

    // About — landing + 2 sub-pages
    "about": {
        eyebrow: "PHOSPHOR",
        title: "About Phosphor",
        description: "What Phosphor is, why it exists, who builds it, and how it's licensed.",
    },
    "about/contributing": {
        eyebrow: "ABOUT",
        title: "Contributing",
        description: "File issues, submit PRs, follow code conventions, and land translations.",
    },
    "about/ai-disclosure": {
        eyebrow: "ABOUT",
        title: "AI disclosure",
        description: "How AI tools are used in development, the human review gate, what stays out.",
    },

    // News landing — per-post entries are appended at build time
    // from the news content collection.
    "news": {
        eyebrow: "PHOSPHOR",
        title: "News",
        description: "Release notes, announcements, and project updates from the Phosphor team.",
    },
};

// Per-library cards — auto-generated so a new entry in LIBRARIES
// gets a recognisable share image with no further wiring.
for (const lib of LIBRARIES) {
    STATIC_PAGES[`libraries/${lib.slug}`] = {
        eyebrow: "PHOSPHOR · LIBRARY",
        title: `phosphor-${lib.slug}`,
        description: lib.oneLiner,
        mono: true,
    };
}

// Cache the merged registry across calls within a single Astro
// build/dev session.  getCollection is cheap (memoised by Astro
// itself) but BaseLayout calls this on every page render, so we
// also avoid rebuilding the merged object dozens of times.
let cached: Record<string, OgPage> | null = null;

/** Returns the full OG registry — static pages + per-library +
 *  per-news-post.  Call from any Astro frontmatter or endpoint. */
export async function getOgPages(): Promise<Record<string, OgPage>> {
    if (cached) return cached;
    const news = await getCollection("news", ({ data }) => !data.draft);
    const merged: Record<string, OgPage> = { ...STATIC_PAGES };
    for (const post of news) {
        merged[`news/${post.id}`] = {
            eyebrow: post.data.kind === "release"
                ? `PHOSPHOR · RELEASE${post.data.version ? " " + post.data.version : ""}`
                : "PHOSPHOR · NEWS",
            title: post.data.title,
            description: post.data.summary,
        };
    }
    cached = merged;
    return cached;
}

/** Map a request URL pathname (e.g. "/plasmazones/getting-started/")
 *  to an OG slug ("plasmazones/getting-started") if and only if the
 *  registry has a card for it.  Returns null for unknown routes so
 *  BaseLayout can fall back to the static brand card. */
export function pathToOgSlug(
    pathname: string,
    pages: Record<string, OgPage>,
): string | null {
    if (pathname === "/") return "index" in pages ? "index" : null;
    const trimmed = pathname.replace(/^\//, "").replace(/\/$/, "");
    return trimmed in pages ? trimmed : null;
}
