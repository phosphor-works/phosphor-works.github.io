// SPDX-FileCopyrightText: 2026 fuddlesworth
// SPDX-License-Identifier: GPL-3.0-or-later
//
// Content collections.  The site's IA is intentionally bespoke
// .astro routes — most pages are hand-tuned and don't benefit from
// a collection.  The exception is `news`: release notes, post-style
// announcements, and project updates are exactly what content
// collections are built for (chronological listing, RSS, per-post
// pages, structured frontmatter).

import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

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

export const collections = { news };
