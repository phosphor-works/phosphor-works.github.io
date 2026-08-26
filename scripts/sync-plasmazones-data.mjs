#!/usr/bin/env node
// SPDX-FileCopyrightText: 2026 fuddlesworth
// SPDX-License-Identifier: GPL-3.0-or-later
//
// Sync layout / shader / algorithm metadata from the PlasmaZones
// source repo into src/data/plasmazones/ so the gallery pages can
// import it.  Run after a PlasmaZones version bump:
//
//     npm run sync:plasmazones
//
// Expects PlasmaZones checked out at ../PlasmaZones relative to
// this repo (or at $PLASMAZONES_SRC).  Emits one aggregate JSON
// file per data family — the gallery pages import them directly.

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { parseChangelog } from "../src/loaders/changelog-parse.ts";

const here = path.dirname(fileURLToPath(import.meta.url));
const siteRoot = path.resolve(here, "..");
const src = process.env.PLASMAZONES_SRC
    ? path.resolve(process.env.PLASMAZONES_SRC)
    : path.resolve(siteRoot, "../PlasmaZones");

if (!fs.existsSync(path.join(src, "data"))) {
    console.error(`PlasmaZones data not found at ${src}/data`);
    console.error(`Set PLASMAZONES_SRC or symlink ../PlasmaZones to the checkout.`);
    process.exit(1);
}

const outDir = path.join(siteRoot, "src/data/plasmazones");
fs.mkdirSync(outDir, { recursive: true });

// Parse a JSON file, attaching the offending path to any syntax error
// so one malformed upstream file is identifiable instead of aborting
// the whole sync with a bare SyntaxError.
function readJson(file) {
    const raw = fs.readFileSync(file, "utf-8");
    try {
        return JSON.parse(raw);
    } catch (err) {
        throw new Error(`Invalid JSON in ${path.relative(src, file)}: ${err.message}`);
    }
}

// Require an upstream subdirectory to exist, failing with the same
// friendly message style as the top-level data/ guard above rather
// than a raw ENOENT from readdirSync.
function requireDir(dir) {
    if (!fs.existsSync(dir)) {
        console.error(`PlasmaZones data subdirectory not found: ${dir}`);
        process.exit(1);
    }
    return dir;
}

// ── Layouts ──────────────────────────────────────────────────────
// Each file is already JSON with the shape we need; just aggregate.
const layoutDir = path.join(src, "data/layouts");
const layouts = fs.readdirSync(requireDir(layoutDir))
    .filter(f => f.endsWith(".json"))
    .map(f => readJson(path.join(layoutDir, f)))
    .sort((a, b) => (a.defaultOrder ?? 999) - (b.defaultOrder ?? 999)
                 || (a.name ?? "").localeCompare(b.name ?? ""));
fs.writeFileSync(path.join(outDir, "layouts.json"),
    JSON.stringify(layouts, null, 2) + "\n");
console.log(`layouts: ${layouts.length} entries`);

// ── Shader families ─────────────────────────────────────
// Three sibling families, one directory each, every entry a directory
// containing metadata.json:
//
//   overlays/   zone highlights, snap previews, drag ghosts
//   surface/    per-window effects (blur, glass, borders, ambience)
//   animations/ open / close / minimize / desktop-switch transitions
//
// They shared a single data/shaders/ directory before 3.4.  A `shared`
// directory sits alongside the entries in each holding common GLSL
// includes — it has no metadata.json, so the filter below drops it.
const SHADER_FAMILIES = [
    { dir: "overlays",   out: "overlays.json" },
    { dir: "surface",    out: "surface.json" },
    { dir: "animations", out: "animations.json" },
];

for (const family of SHADER_FAMILIES) {
    const familyDir = path.join(src, "data", family.dir);
    const entries = fs.readdirSync(requireDir(familyDir))
        .filter(name => fs.existsSync(path.join(familyDir, name, "metadata.json")))
        .map(name => {
            const meta = readJson(path.join(familyDir, name, "metadata.json"));
            // Strip the large "parameters" array — the galleries only need
            // top-level metadata, not the per-parameter tuning schema.
            const { parameters, ...rest } = meta;
            return {
                ...rest,
                paramCount: Array.isArray(parameters) ? parameters.length : 0,
            };
        })
        .sort((a, b) => (a.category ?? "").localeCompare(b.category ?? "")
                     || (a.name ?? "").localeCompare(b.name ?? ""));
    fs.writeFileSync(path.join(outDir, family.out),
        JSON.stringify(entries, null, 2) + "\n");
    console.log(`${family.dir}: ${entries.length} entries`);
}

// ── Scrolling templates ────────────────────────────────
// Scrolling's peer of snapping's layouts and tiling's algorithms: one
// JSON file each, already the shape the gallery needs.
const templateDir = path.join(src, "data/scrolling-templates");
const templates = fs.readdirSync(requireDir(templateDir))
    .filter(f => f.endsWith(".json"))
    .map(f => readJson(path.join(templateDir, f)))
    .sort((a, b) => (a.defaultOrder ?? 999) - (b.defaultOrder ?? 999)
                 || (a.name ?? "").localeCompare(b.name ?? ""));
fs.writeFileSync(path.join(outDir, "scrolling-templates.json"),
    JSON.stringify(templates, null, 2) + "\n");
console.log(`scrolling templates: ${templates.length} entries`);

// ── Changelog ───────────────────────────────────────────
// Copied verbatim.  A content-collection loader
// (src/loaders/changelog.ts) splits it into one entry per release at
// build time, so these pages always match upstream and nothing is
// hand-edited on this side.
const changelogSrc = path.join(src, "CHANGELOG.md");
if (fs.existsSync(changelogSrc)) {
    const raw = fs.readFileSync(changelogSrc, "utf-8");
    fs.writeFileSync(path.join(outDir, "changelog.md"), raw);
    const { releases } = parseChangelog(raw);
    console.log(`changelog: ${releases.length} releases`);
    scaffoldReleaseNews(releases);
} else {
    console.warn(`changelog: CHANGELOG.md not found at ${changelogSrc} — skipping.`);
}

// Write a news entry for each feature release (x.y.0) that does not
// already have one.  EXISTING FILES ARE NEVER TOUCHED: the scaffold
// is a starting point you then edit by hand, and re-running the sync
// leaves your prose alone because the file is already there.
//
// Only the newest feature release is published; the rest land as
// drafts, so backfilling the archive doesn't push two dozen dated
// posts into the RSS feed at once.  Flip `draft: false` on any of
// them to publish.
function scaffoldReleaseNews(releases) {
    const newsDir = path.join(siteRoot, "src/content/news");
    fs.mkdirSync(newsDir, { recursive: true });

    const features = releases
        .filter(r => r.date && /^\d+\.\d+\.0$/.test(r.version))
        .sort((a, b) => b.date.localeCompare(a.date));
    if (features.length === 0) return;

    const newest = features[0].version;
    let written = 0;
    let skipped = 0;

    for (const release of features) {
        // Dots are stripped from the filename by Astro's glob loader
        // when it derives the entry id, which would turn "3.4.0" into
        // a URL reading "plasmazones-340". Spell the version with
        // dashes so the slug stays legible.
        const slug = `${release.date}-plasmazones-${release.version.replace(/\./g, "-")}`;
        const file = path.join(newsDir, `${slug}.md`);
        if (fs.existsSync(file)) {
            skipped++;
            continue;
        }

        // The bold lead-ins carry the headline of each change, so a
        // handful of them read as a summary. Older releases wrote
        // plain bullets and have none — fall back to the section mix.
        const heads = release.highlights.slice(0, 3);
        const summary = heads.length > 0
            ? `${heads.join(", ")}, and ${release.entryCount - heads.length} more changes.`
            : release.sections.map(s => `${s.count} ${s.heading.toLowerCase()}`).join(", ") + ".";

        const body = [
            "---",
            `title: "PlasmaZones ${release.version}"`,
            `date: ${release.date}`,
            "kind: release",
            `version: "${release.version}"`,
            `summary: >`,
            `    ${wrapYaml(summary)}`,
            `draft: ${release.version === newest ? "false" : "true"}`,
            "---",
            "",
            "<!-- Scaffolded by `npm run sync:plasmazones` from CHANGELOG.md.",
            "     Edit freely — the sync will not overwrite this file once it",
            "     exists. The authoritative, always-current notes live at",
            `     /plasmazones/changelog/${release.version}/. -->`,
            "",
            release.highlights.length > 0
                ? release.highlights.slice(0, 6).map(h => `- ${h}`).join("\n")
                : "",
            "",
            `[Full release notes for ${release.version} →](/plasmazones/changelog/${release.version}/)`,
            "",
        ].join("\n");

        fs.writeFileSync(file, body);
        written++;
    }
    console.log(`  news: ${written} scaffolded, ${skipped} left untouched`);
}

// Indent a summary onto YAML block-scalar continuation lines so a
// long one stays readable in the frontmatter.
function wrapYaml(text, width = 68) {
    const words = text.split(/\s+/);
    const lines = [];
    let line = "";
    for (const word of words) {
        if (line && (line + " " + word).length > width) {
            lines.push(line);
            line = word;
        } else {
            line = line ? `${line} ${word}` : word;
        }
    }
    if (line) lines.push(line);
    return lines.join("\n    ");
}

// ── Autotile algorithms ──────────────────────────────────────────
// Each .luau file returns `pluau.algorithm{ metadata = …, tile = … }`.
// We can't evaluate Luau in Node, so we run each script through the
// `luau` CLI against the bundled `pluau` standard library — the exact
// prelude the daemon injects (libs/phosphor-tiles/src/pluau/pluau.luau) —
// to capture BOTH the metadata table AND a preview window arrangement
// we render as an SVG thumbnail.
//
// This needs the `luau` binary on PATH (or $LUAU). It is the same
// runtime CI already uses for `luau-analyze`. Without it we cannot
// regenerate previews, so we leave the committed algorithms.json
// untouched rather than emit an empty file.
const algoDir = path.join(src, "data/algorithms");
const preludePath = path.join(src, "libs/phosphor-tiles/src/pluau/pluau.luau");
const luauBin = process.env.LUAU || "luau";

// Preview canvas: 1920x1080 so pz.MIN_ZONE_SIZE (50) won't clip
// realistic output. Rects get normalized to 0-1 afterwards.
const PREVIEW_AREA = { x: 0, y: 0, width: 1920, height: 1080 };
// 5 windows is the arrangement most algorithms converge on for "looks
// like the algorithm's intent" versus 2-3 (too sparse) or 8+ (overflow).
const PREVIEW_WINDOW_COUNT = 5;
// Specific algorithms need fewer / more windows to render a
// representative preview (monocle at 4 is a solid single rect;
// cluster / tatami want enough windows to show the pattern).
const WINDOW_COUNT_OVERRIDE = {
    "monocle": 4,
    "cluster": 6,
    "tatami": 6,
    "grid": 6,
    "spread": 6,
};

// Canonical key orders so the generated JSON has stable, readable
// diffs — Luau `pairs()` iteration order is unspecified.
const META_ORDER = [
    "name", "id", "description", "producesOverlappingZones",
    "supportsMasterCount", "supportsSplitRatio", "defaultSplitRatio",
    "defaultMaxWindows", "minimumWindows", "supportsMinSizes",
    "zoneNumberDisplay", "masterZoneIndex", "supportsMemory",
    "centerLayout", "customParams",
];
const CUSTOM_PARAM_ORDER = ["name", "type", "default", "min", "max", "options", "description"];

function orderObject(obj, order) {
    const out = {};
    for (const key of order) {
        if (obj[key] !== undefined) out[key] = obj[key];
    }
    for (const key of Object.keys(obj).sort()) {
        if (!(key in out)) out[key] = obj[key];
    }
    return out;
}

// Minimal Lua JSON encoder. Written with string.char() instead of
// backslash escapes so it survives embedding in this JS template
// literal verbatim (no double-escaping).
const JSON_ENCODER = `
local __BS = string.char(92)
local __QT = string.char(34)
local __esc = {}
__esc[__BS] = __BS .. __BS
__esc[__QT] = __BS .. __QT
__esc[string.char(10)] = __BS .. "n"
__esc[string.char(13)] = __BS .. "r"
__esc[string.char(9)] = __BS .. "t"
local __pat = "[" .. __BS .. __QT .. string.char(10) .. string.char(13) .. string.char(9) .. "]"
local function __enc(v)
    local tv = type(v)
    if tv == "string" then
        return __QT .. (v:gsub(__pat, __esc)) .. __QT
    elseif tv == "number" then
        if v ~= v or v == math.huge or v == -math.huge then return "null" end
        return tostring(v)
    elseif tv == "boolean" then
        return tostring(v)
    elseif tv == "table" then
        local n = 0
        for _ in pairs(v) do n = n + 1 end
        if n == #v then
            local parts = {}
            for i = 1, #v do parts[i] = __enc(v[i]) end
            return "[" .. table.concat(parts, ",") .. "]"
        end
        local parts = {}
        for k, val in pairs(v) do
            parts[#parts + 1] = __enc(tostring(k)) .. ":" .. __enc(val)
        end
        return "{" .. table.concat(parts, ",") .. "}"
    end
    return "null"
end
`;

const prelude = fs.readFileSync(preludePath, "utf-8");

// Runs one algorithm through luau and returns { metadata, preview }.
// Throws on a missing binary (ENOENT) so the caller can skip the whole
// section; per-script failures return null.
function runAlgorithm(algoSource, algoId) {
    const windowCount = WINDOW_COUNT_OVERRIDE[algoId] ?? PREVIEW_WINDOW_COUNT;
    const harness = [
        prelude,                          // sets the global `pluau`
        JSON_ENCODER,
        "local __algo = (function()",     // wrap the script's top-level `return`
        algoSource,
        "end)()",
        "local __ctx = {",
        `    windowCount = ${windowCount}, count = ${windowCount},`,
        "    innerGap = 8, gap = 8,",
        `    area = { x = ${PREVIEW_AREA.x}, y = ${PREVIEW_AREA.y}, width = ${PREVIEW_AREA.width}, height = ${PREVIEW_AREA.height} },`,
        "    masterCount = 1, splitRatio = 0.5, minSizes = {}, focusedIndex = 1,",
        "}",
        "local __zones = nil",
        'if type(__algo) == "table" and type(__algo.tile) == "function" then',
        "    local ok, res = pcall(__algo.tile, __ctx)",
        "    if ok then __zones = res end",
        "end",
        'local __meta = (type(__algo) == "table" and __algo.metadata) or {}',
        "print(__enc({ metadata = __meta, preview = __zones }))",
    ].join("\n");

    const tmp = path.join(os.tmpdir(), `pz-preview-${algoId}.luau`);
    fs.writeFileSync(tmp, harness);
    try {
        const out = execFileSync(luauBin, [tmp], { timeout: 5000, encoding: "utf-8" });
        return JSON.parse(out.trim());
    } catch (err) {
        if (err.code === "ENOENT") throw err;   // binary missing — propagate
        console.warn(`  ${algoId}: luau run failed — ${err.message}`);
        return null;
    } finally {
        fs.rmSync(tmp, { force: true });
    }
}

function normalizePreview(zones) {
    if (!Array.isArray(zones) || zones.length === 0) return null;
    return zones.map(r => ({
        x: r.x / PREVIEW_AREA.width,
        y: r.y / PREVIEW_AREA.height,
        width: r.width / PREVIEW_AREA.width,
        height: r.height / PREVIEW_AREA.height,
    }));
}

try {
    const algorithms = fs.readdirSync(requireDir(algoDir))
        .filter(f => f.endsWith(".luau"))
        .map(f => {
            const source = fs.readFileSync(path.join(algoDir, f), "utf-8");
            const fallbackId = path.basename(f, ".luau");
            const result = runAlgorithm(source, fallbackId);
            if (!result || !result.metadata) {
                console.warn(`  skip ${f}: no metadata captured`);
                return null;
            }
            const metadata = result.metadata;
            if (!metadata.id) metadata.id = fallbackId;
            if (Array.isArray(metadata.customParams)) {
                metadata.customParams = metadata.customParams.map(p =>
                    (p && typeof p === "object") ? orderObject(p, CUSTOM_PARAM_ORDER) : p);
            }
            const ordered = orderObject(metadata, META_ORDER);
            ordered.preview = normalizePreview(result.preview);
            return ordered;
        })
        .filter(Boolean)
        .sort((a, b) => (a.name ?? "").localeCompare(b.name ?? ""));
    fs.writeFileSync(path.join(outDir, "algorithms.json"),
        JSON.stringify(algorithms, null, 2) + "\n");
    const withPreview = algorithms.filter(a => a.preview).length;
    console.log(`algorithms: ${algorithms.length} entries, ${withPreview} with previews`);
} catch (err) {
    if (err.code === "ENOENT") {
        console.warn(
            `algorithms: '${luauBin}' not found — skipping algorithm sync.\n` +
            `  Install Luau (https://luau.org/) or set $LUAU to regenerate\n` +
            `  algorithms.json; the existing file is left untouched.`);
    } else {
        throw err;
    }
}

console.log(`\nWrote to ${path.relative(siteRoot, outDir)}/`);
