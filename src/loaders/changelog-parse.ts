// SPDX-FileCopyrightText: 2026 fuddlesworth
// SPDX-License-Identifier: GPL-3.0-or-later
//
// Pure Keep-a-Changelog parsing, with no Astro or Node-API imports.
//
// Lives apart from the loader in changelog.ts so the plain-ESM sync
// script (scripts/sync-plasmazones-data.mjs) and the TypeScript
// content loader can share one implementation — the news scaffolder
// and the changelog pages must agree on where a release starts and
// what counts as an entry, and two parsers would drift.

/** Matches a full-line link reference definition: `[label]: url`. */
const LINK_DEF = /^\[[^\]]+\]:\s*\S+\s*$/;

/** `## [3.4.0] - 2026-08-25` — every heading in the file carries a date. */
const RELEASE_HEADING = /^## \[([^\]]+)\](?:\s*-\s*(\d{4}-\d{2}-\d{2}))?\s*$/;

export interface ParsedRelease {
    version: string;
    date: string | undefined;
    body: string;
    sections: { heading: string; count: number }[];
    entryCount: number;
    highlights: string[];
}

/**
 * Split a changelog into releases plus the shared link-definition
 * block.  Exported for the sync script, which scaffolds news entries
 * from the same parse rather than reimplementing it.
 */
export function parseChangelog(raw: string): {
    releases: ParsedRelease[];
    linkDefs: string;
} {
    const lines = raw.split("\n");

    // Hold aside every link reference definition wherever it sits.
    // Today they are one block at the foot of the file; collecting by
    // pattern rather than by position means a future release that
    // parks its own definitions mid-document still resolves.
    const linkDefLines: string[] = [];
    const bodyLines: string[] = [];
    for (const line of lines) {
        (LINK_DEF.test(line) ? linkDefLines : bodyLines).push(line);
    }
    const linkDefs = linkDefLines.join("\n");

    const releases: ParsedRelease[] = [];
    let current: { version: string; date?: string; buf: string[] } | null = null;

    const flush = () => {
        if (!current) return;
        const body = current.buf.join("\n").trim();
        // `### Heading` blocks and the bullets under each.
        const sections: { heading: string; count: number }[] = [];
        let entryCount = 0;
        let heading: string | null = null;
        let count = 0;
        for (const line of body.split("\n")) {
            const h = /^### (.+?)\s*$/.exec(line);
            if (h) {
                if (heading !== null) sections.push({ heading, count });
                heading = h[1];
                count = 0;
                continue;
            }
            // Top-level bullets only — a nested `  - ` is detail, not
            // a separate change, and counting it inflates every total.
            if (/^- /.test(line)) {
                count++;
                entryCount++;
            }
        }
        if (heading !== null) sections.push({ heading, count });

        const highlights = [...body.matchAll(/^- \*\*(.+?)\*\*/gm)].map(m => m[1]);

        releases.push({
            version: current.version,
            date: current.date,
            body,
            sections,
            entryCount,
            highlights,
        });
        current = null;
    };

    for (const line of bodyLines) {
        const m = RELEASE_HEADING.exec(line);
        if (m) {
            flush();
            current = { version: m[1], date: m[2], buf: [] };
            continue;
        }
        if (current) current.buf.push(line);
    }
    flush();

    return { releases, linkDefs };
}

/** Parse "3.4.0" into a numeric sort key, tolerating suffixes. */
export function versionKey(version: string): number[] {
    const parts = version.split(".").map(p => parseInt(p, 10));
    // A non-numeric or short version (an "Unreleased" heading, a
    // "-rc1" suffix) still sorts rather than throwing.
    return [0, 1, 2].map(i => (Number.isFinite(parts[i]) ? parts[i] : 0));
}
