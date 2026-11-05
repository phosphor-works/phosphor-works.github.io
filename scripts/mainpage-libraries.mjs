#!/usr/bin/env node
// SPDX-FileCopyrightText: 2026 fuddlesworth
// SPDX-License-Identifier: GPL-3.0-or-later
//
// Fill the library catalogue into the staged Doxygen main page from
// src/data/libraries.ts, so the API reference lists the same libraries,
// groups and namespaces as the website and cannot drift from it.
//
//   node scripts/mainpage-libraries.mjs <staged mainpage.md> <libs-raw dir>
//
// Replaces two markers in the main page:
//   <!-- GENERATED:LIBRARY-TABLES -->   one table per group
//   <!-- GENERATED:CATEGORY-PAGES -->   one @page per group with an
//                                       @subpage per library
//
// A library links to its overview page (@ref / @subpage) only when its
// README was staged into <libs-raw dir>, since Doxygen makes no page
// otherwise.  A namespace links to its Doxygen page only when it is a
// C++ namespace; QML-only libraries list their module name as text.

import fs from "node:fs";
import path from "node:path";
import { LIBRARIES, LIBRARY_GROUPS, LIBRARY_GROUP_BLURBS } from "../src/data/libraries.ts";

const [mainpage, libsRaw] = process.argv.slice(2);
if (!mainpage || !libsRaw) {
    console.error("usage: mainpage-libraries.mjs <mainpage.md> <libs-raw dir>");
    process.exit(2);
}

const pageId = (slug) => `lib_phosphor_${slug.replace(/-/g, "_")}`;
const hasPage = (slug) => fs.existsSync(path.join(libsRaw, `phosphor-${slug}.md`));
const isCppNamespace = (ns) => /^[A-Za-z_][A-Za-z0-9_]*(::[A-Za-z_][A-Za-z0-9_]*)*$/.test(ns);
const nsFile = (ns) => `namespace${ns.replace(/::/g, "_1_1")}.html`;
const groupId = (group) => `cat_${group.toLowerCase()}`;
const cell = (s) => s.replace(/\|/g, "\\|");

const groups = LIBRARY_GROUPS
    .map(group => ({
        group,
        libs: LIBRARIES.filter(l => l.group === group).sort((a, b) => a.slug.localeCompare(b.slug)),
    }))
    .filter(g => g.libs.length > 0);

const tables = groups.map(({ group, libs }) => {
    const rows = libs.map(l => {
        const name = hasPage(l.slug)
            ? `[\`phosphor-${l.slug}\`](@ref ${pageId(l.slug)})`
            : `\`phosphor-${l.slug}\``;
        const ns = isCppNamespace(l.namespace)
            ? `[${l.namespace}](${nsFile(l.namespace)})`
            : `\`${l.namespace}\` (QML)`;
        return `| ${name} | ${ns} | ${cell(l.oneLiner)} |`;
    });
    return [
        `### ${group}`,
        "",
        LIBRARY_GROUP_BLURBS[group],
        "",
        "| Library | Namespace | Responsibility |",
        "|--------:|:----------|:---------------|",
        ...rows,
    ].join("\n");
}).join("\n\n");

const categoryPages = groups.map(({ group, libs }) => [
    `@page ${groupId(group)} ${group}`,
    "",
    LIBRARY_GROUP_BLURBS[group],
    "",
    ...libs.filter(l => hasPage(l.slug)).map(l => `@subpage ${pageId(l.slug)}`),
].join("\n")).join("\n\n\n");

const subpageIndex = groups.map(({ group }) => `@subpage ${groupId(group)}`).join("\n");

let text = fs.readFileSync(mainpage, "utf-8");
for (const [marker, body] of [
    ["<!-- GENERATED:CATEGORY-INDEX -->", subpageIndex],
    ["<!-- GENERATED:LIBRARY-TABLES -->", tables],
    ["<!-- GENERATED:CATEGORY-PAGES -->", categoryPages],
]) {
    if (!text.includes(marker)) {
        console.error(`error: ${mainpage} has no ${marker} marker`);
        process.exit(1);
    }
    text = text.replace(marker, body);
}
fs.writeFileSync(mainpage, text);

const linked = LIBRARIES.filter(l => hasPage(l.slug)).length;
console.log(`mainpage: ${LIBRARIES.length} libraries in ${groups.length} groups, ${linked} with overview pages`);
