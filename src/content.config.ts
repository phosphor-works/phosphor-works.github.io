// SPDX-FileCopyrightText: 2026 fuddlesworth
// SPDX-License-Identifier: GPL-3.0-or-later
//
// Content collections.  The site's IA is intentionally bespoke
// .astro routes — most pages are hand-tuned and don't benefit from
// a collection.  The exception is `news`: release notes, post-style
// announcements, and project updates are exactly what content
// collections are built for (chronological listing, RSS, per-post
// pages, structured frontmatter).  And `releases`: PlasmaZones'
// CHANGELOG.md, split into one entry per version by a custom loader
// so the changelog pages always mirror upstream.

import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";
import { changelogLoader } from "./loaders/changelog.ts";

const news = defineCollection({
    // Markdown files under src/content/news/<slug>.md.  Astro 6's
    // glob loader gives us the slug from the filename and lets us
    // mix nested folders later if we ever section the archive.
    loader: glob({ pattern: "**/*.md", base: "./src/content/news" }),
    schema: z.object({
        title: z.string(),
        // Authoring date.  Coerced from YAML strings so frontmatter
        // can stay human (`date: 2026-04-27`) without quoting.
        date: z.coerce.date(),
        // Categorises the entry for the index list and for filters
        // we may add later.  `release` carries an optional version.
        kind: z.enum(["release", "post", "announcement"]),
        // One-line summary used by the index card, the RSS feed
        // <description>, and the per-post OG card.
        summary: z.string(),
        // Optional: present for `kind: release`, omitted otherwise.
        version: z.string().optional(),
        // Hide a post from the index/RSS while keeping it routable
        // (handy for drafts that need a preview URL).
        draft: z.boolean().default(false),
    }),
});

// PlasmaZones' release history.  The source file is a verbatim copy
// synced from the PlasmaZones repo by `npm run sync:plasmazones`; it
// is parsed at build time and never written back, so these pages
// always match upstream.  The loader supplies the schema.
const releases = defineCollection({
    loader: changelogLoader({ file: "./src/data/plasmazones/changelog.md" }),
    schema: z.object({
        // Semver string as written in the heading, e.g. "3.4.0".
        version: z.string(),
        date: z.coerce.date(),
        // Sort key [major, minor, patch], numeric so 3.10 > 3.9.
        sortKey: z.array(z.number()),
        major: z.number(),
        // A `x.y.0` cut — the releases that get a news entry
        // scaffolded by the sync script.
        isFeature: z.boolean(),
        // `### Heading` blocks and their bullet counts, for the index
        // summary. Headings are recorded as written rather than
        // normalised into an enum: the history also contains
        // Improved, Performance, Features, Breaking Changes, and
        // Migration Notes (Packagers).
        sections: z.array(z.object({
            heading: z.string(),
            count: z.number(),
        })),
        entryCount: z.number(),
        // The `**bold lead-in**` of each top-level bullet. Near
        // universal in recent releases, empty in older ones that
        // wrote plain prose bullets.
        highlights: z.array(z.string()),
    }),
});

export const collections = { news, releases };
