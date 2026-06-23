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
// this repo (or at $PLASMAZONES_SRC).  Emits three aggregate JSON
// files — the gallery pages import them directly.

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

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

// ── Shaders ──────────────────────────────────────────────────────
// Each shader is a directory containing metadata.json.
const shaderDir = path.join(src, "data/shaders");
const shaders = fs.readdirSync(requireDir(shaderDir))
    .filter(name => {
        const metaPath = path.join(shaderDir, name, "metadata.json");
        return fs.existsSync(metaPath);
    })
    .map(name => {
        const meta = readJson(path.join(shaderDir, name, "metadata.json"));
        // Strip the large "parameters" array — the gallery only needs
        // top-level metadata, not the per-parameter tuning schema.
        const { parameters, ...rest } = meta;
        return {
            ...rest,
            paramCount: Array.isArray(parameters) ? parameters.length : 0,
        };
    })
    .sort((a, b) => (a.category ?? "").localeCompare(b.category ?? "")
                 || (a.name ?? "").localeCompare(b.name ?? ""));
fs.writeFileSync(path.join(outDir, "shaders.json"),
    JSON.stringify(shaders, null, 2) + "\n");
console.log(`shaders: ${shaders.length} entries`);

// ── Autotile algorithms ──────────────────────────────────────────
// Each .luau file returns `pz.algorithm{ metadata = …, tile = … }`.
// We can't evaluate Luau in Node, so we run each script through the
// `luau` CLI against the bundled `pz` standard library — the exact
// prelude the daemon injects (libs/phosphor-tiles/src/pz/pz.luau) —
// to capture BOTH the metadata table AND a preview window arrangement
// we render as an SVG thumbnail.
//
// This needs the `luau` binary on PATH (or $LUAU). It is the same
// runtime CI already uses for `luau-analyze`. Without it we cannot
// regenerate previews, so we leave the committed algorithms.json
// untouched rather than emit an empty file.
const algoDir = path.join(src, "data/algorithms");
const preludePath = path.join(src, "libs/phosphor-tiles/src/pz/pz.luau");
const luauBin = process.env.LUAU || "luau";

// Preview canvas: 1920x1080 so pz.MIN_ZONE_SIZE (50) won't clip
// realistic output. Rects get normalized to 0-1 afterwards.
const PREVIEW_AREA = { x: 0, y: 0, width: 1920, height: 1080 };
// 5 windows is the arrangement most algorithms converge on for "looks
// like the algorithm's intent" versus 2-3 (too sparse) or 8+ (overflow).
const PREVIEW_WINDOW_COUNT = 5;
// Specific algorithms need fewer / more windows to render a
// representative preview (monocle at 5 is a solid single rect;
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
        prelude,                          // sets the global `pz`
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
