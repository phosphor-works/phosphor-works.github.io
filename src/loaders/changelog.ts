// SPDX-FileCopyrightText: 2026 fuddlesworth
// SPDX-License-Identifier: GPL-3.0-or-later
//
// Content-collection loader that turns a Keep-a-Changelog file into
// one entry per release.
//
// The source is a verbatim copy of PlasmaZones' CHANGELOG.md, synced
// into src/data/plasmazones/ by `npm run sync:plasmazones`.  It is
// parsed at build time and nothing is written back — these pages
// mirror upstream, so a wrong entry is fixed in the PlasmaZones repo
// and re-synced rather than patched here.
//
// Two details of the format the split has to respect:
//
//   1. Link reference definitions (`[#852]: https://…`) all live in
//      one block at the foot of the file, but the `[#852]` references
//      that use them are scattered through the release bodies.  Slice
//      a release out on its own and every one of those links renders
//      as literal bracket text, so the block is held aside and
//      appended to each body before rendering.
//
//   2. Section headings are not consistent across the history —
//      `Added` / `Changed` / `Fixed` dominate, but older releases also
//      use `Improved`, `Performance`, `Features`, `Breaking Changes`,
//      and `Migration Notes (Packagers)`.  They are recorded as-is
//      rather than normalised into a fixed enum, so a heading nobody
//      anticipated still surfaces instead of vanishing.

import fs from "node:fs";
import path from "node:path";
import type { Loader } from "astro/loaders";
import { parseChangelog, versionKey } from "./changelog-parse.ts";

export { parseChangelog, versionKey } from "./changelog-parse.ts";
export type { ParsedRelease } from "./changelog-parse.ts";

// NOTE: the schema lives in src/content.config.ts, not here.
// Declaring it in the loader would mean importing `astro:content`,
// whose types are generated *from* content.config.ts — which imports
// this file. That cycle leaves the loader undefined at config-eval
// time and fails the build with a bare "changelogLoader is not
// defined".

interface Options {
    /** Absolute or repo-relative path to the changelog file. */
    file: string;
}

export function changelogLoader({ file }: Options): Loader {
    return {
        name: "plasmazones-changelog",
        load: async ({ store, renderMarkdown, parseData, generateDigest, logger, watcher }) => {
            const abs = path.resolve(file);
            if (!fs.existsSync(abs)) {
                // A missing changelog is a sync that has not been run,
                // not a build error — the section simply renders empty
                // rather than taking the whole site down.
                logger.warn(
                    `changelog not found at ${file} — /plasmazones/changelog/ will be empty. ` +
                    `Run \`npm run sync:plasmazones\` to fetch it.`,
                );
                store.clear();
                return;
            }

            watcher?.add(abs);

            const raw = fs.readFileSync(abs, "utf-8");
            const { releases, linkDefs } = parseChangelog(raw);

            store.clear();
            for (const release of releases) {
                if (!release.date) {
                    // Every heading in the file carries a date today;
                    // an undated one (an "Unreleased" section) has no
                    // place on a dated archive page.
                    logger.warn(`skipping undated release heading: [${release.version}]`);
                    continue;
                }
                const key = versionKey(release.version);
                const data = await parseData({
                    id: release.version,
                    data: {
                        version: release.version,
                        date: release.date,
                        sortKey: key,
                        major: key[0],
                        isFeature: key[2] === 0,
                        sections: release.sections,
                        entryCount: release.entryCount,
                        highlights: release.highlights,
                    },
                });

                // Re-attach the shared link definitions so `[#852]`
                // style references resolve inside this one release.
                const withRefs = linkDefs
                    ? `${release.body}\n\n${linkDefs}\n`
                    : release.body;

                store.set({
                    id: release.version,
                    data,
                    body: release.body,
                    rendered: await renderMarkdown(withRefs),
                    digest: generateDigest(withRefs),
                });
            }
            logger.info(`parsed ${store.keys().length} releases from ${path.basename(abs)}`);
        },
    };
}
