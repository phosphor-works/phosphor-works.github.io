// SPDX-FileCopyrightText: 2026 fuddlesworth
// SPDX-License-Identifier: GPL-3.0-or-later
//
// Build-time TOC extractor for .astro guide pages.  Called from the
// guide's own frontmatter with import.meta.url — reads the page's
// source file off disk and regexes out <h2 id="…">…</h2> entries.
//
// Why not Astro's built-in getHeadings(): that only works for .md/.mdx
// pages.  The guides here are .astro because they mix JSX, Hljs code
// blocks, and structural HTML that's simpler to author as components.
// Converting them to .mdx is a separate migration; this keeps them
// in .astro while still giving a single source of truth for headings.

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

export interface TocEntry {
    /** Heading depth — 2 for <h2>, 3 for <h3>.  Guides usually only
     *  surface h2s in the TOC; h3s are extracted too but filtered
     *  out by default in <GuideToc />. */
    level: 2 | 3;
    /** `#slug` — ready to drop into an <a href>. */
    href: string;
    /** Visible label.  Uses the raw text content of the heading with
     *  inner HTML stripped so nested <code> / <small> tags don't
     *  leak into the TOC. */
    label: string;
}

/**
 * Parse <h2 id="…">…</h2> and <h3 id="…">…</h3> out of a file's
 * source.  Only matches headings that already carry an `id=` — a
 * conservative rule that keeps headings without anchors (or HTML
 * inside code blocks) out of the TOC.
 */
export function extractGuideHeadings(fileUrl: string | URL): TocEntry[] {
    const path = typeof fileUrl === "string" && !fileUrl.startsWith("file:")
        ? fileUrl
        : fileURLToPath(fileUrl);
    const src = readFileSync(path, "utf-8");

    const re = /<h([23])\s+id="([^"]+)"[^>]*>([\s\S]*?)<\/h\1>/g;
    const entries: TocEntry[] = [];
    let m: RegExpExecArray | null;
    while ((m = re.exec(src)) !== null) {
        const level = parseInt(m[1], 10) as 2 | 3;
        const label = m[3]
            .replace(/<[^>]+>/g, "")     // strip inner tags
            .replace(/&amp;/g, "&")      // restore common entities
            .replace(/&lt;/g, "<")
            .replace(/&gt;/g, ">")
            .replace(/\s+/g, " ")
            .trim();
        entries.push({ level, href: `#${m[2]}`, label });
    }
    return entries;
}
