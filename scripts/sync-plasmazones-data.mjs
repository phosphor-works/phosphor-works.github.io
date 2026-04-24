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
import path from "node:path";
import vm from "node:vm";
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

// ── Layouts ──────────────────────────────────────────────────────
// Each file is already JSON with the shape we need; just aggregate.
const layoutDir = path.join(src, "data/layouts");
const layouts = fs.readdirSync(layoutDir)
    .filter(f => f.endsWith(".json"))
    .map(f => JSON.parse(fs.readFileSync(path.join(layoutDir, f), "utf-8")))
    .sort((a, b) => (a.defaultOrder ?? 999) - (b.defaultOrder ?? 999)
                 || a.name.localeCompare(b.name));
fs.writeFileSync(path.join(outDir, "layouts.json"),
    JSON.stringify(layouts, null, 2) + "\n");
console.log(`layouts: ${layouts.length} entries`);

// ── Shaders ──────────────────────────────────────────────────────
// Each shader is a directory containing metadata.json.
const shaderDir = path.join(src, "data/shaders");
const shaders = fs.readdirSync(shaderDir)
    .filter(name => {
        const metaPath = path.join(shaderDir, name, "metadata.json");
        return fs.existsSync(metaPath);
    })
    .map(name => {
        const meta = JSON.parse(fs.readFileSync(
            path.join(shaderDir, name, "metadata.json"), "utf-8"));
        // Strip the large "parameters" array — the gallery only needs
        // top-level metadata, not the per-parameter tuning schema.
        const { parameters, ...rest } = meta;
        return {
            ...rest,
            paramCount: Array.isArray(parameters) ? parameters.length : 0,
        };
    })
    .sort((a, b) => a.category.localeCompare(b.category)
                 || a.name.localeCompare(b.name));
fs.writeFileSync(path.join(outDir, "shaders.json"),
    JSON.stringify(shaders, null, 2) + "\n");
console.log(`shaders: ${shaders.length} entries`);

// ── Autotile algorithms ──────────────────────────────────────────
// Each .js file exports metadata + calculateZones. Run each one in
// a vm sandbox to capture both the metadata AND a preview window
// arrangement we can render as an SVG thumbnail.
//
// Sandbox globals mirror what libs/phosphor-tiles/src/
// scriptedalgorithm.cpp injects (see AutotileConstants.h for the
// canonical values). The 22 helper scripts under
// libs/phosphor-tiles/src/builtins/ get concatenated into the
// sandbox before the user script, same as the production runtime.
const algoDir = path.join(src, "data/algorithms");
const builtinDir = path.join(src, "libs/phosphor-tiles/src/builtins");
const builtinSource = fs.readdirSync(builtinDir)
    .filter(f => f.endsWith(".js"))
    .sort()
    .map(f => fs.readFileSync(path.join(builtinDir, f), "utf-8"))
    .join("\n");

// Preview canvas: 1920x1080 so MinZoneSizePx (50) won't clip realistic
// output.  Normalize the returned rects to 0-1 afterwards.
const PREVIEW_AREA = { x: 0, y: 0, width: 1920, height: 1080 };
// 5 windows is the DefaultMaxWindows from AutotileConstants.h — the
// arrangement most algorithms converge on for "looks like the
// algorithm's intent" versus 2-3 (too sparse) or 8+ (overflow).
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

function renderPreview(algoSource, algoId) {
    const context = {
        // Constants the sandbox injects — see
        // ScriptedAlgorithm::loadScript() in scriptedalgorithm.cpp
        // and AutotileDefaults in AutotileConstants.h.
        PZ_MIN_ZONE_SIZE: 50,
        PZ_MIN_SPLIT: 0.1,
        PZ_MAX_SPLIT: 0.9,
        MAX_TREE_DEPTH: 50,
        // Capture calculateZones's return value out of the sandbox.
        __result: null,
    };
    vm.createContext(context);
    try {
        // Builtins + algorithm source + a call capturing the result.
        const wrapped = `${builtinSource}\n\n${algoSource}\n\n__result = calculateZones(__params);`;
        const windowCount = WINDOW_COUNT_OVERRIDE[algoId] ?? PREVIEW_WINDOW_COUNT;
        context.__params = {
            windowCount,
            innerGap: 8,
            area: PREVIEW_AREA,
            masterCount: 1,
            splitRatio: 0.5,
            minSizes: [],
        };
        vm.runInContext(wrapped, context, { timeout: 1000 });
    } catch (err) {
        console.warn(`  ${algoId}: preview failed — ${err.message}`);
        return null;
    }
    if (!Array.isArray(context.__result) || context.__result.length === 0) {
        return null;
    }
    // Normalize screen-pixel rects to 0..1 for the SVG renderer.
    return context.__result.map(r => ({
        x: r.x / PREVIEW_AREA.width,
        y: r.y / PREVIEW_AREA.height,
        width: r.width / PREVIEW_AREA.width,
        height: r.height / PREVIEW_AREA.height,
    }));
}

const algorithms = fs.readdirSync(algoDir)
    .filter(f => f.endsWith(".js"))
    .map(f => {
        const source = fs.readFileSync(path.join(algoDir, f), "utf-8");
        const m = source.match(/var\s+metadata\s*=\s*(\{[\s\S]*?\n\});/);
        if (!m) {
            console.warn(`  skip ${f}: no metadata object found`);
            return null;
        }
        let metadata;
        try {
            metadata = new Function(`return (${m[1]});`)();
        } catch (err) {
            console.warn(`  skip ${f}: metadata parse failed — ${err.message}`);
            return null;
        }
        const preview = renderPreview(source, metadata.id);
        return { ...metadata, preview };
    })
    .filter(Boolean)
    .sort((a, b) => a.name.localeCompare(b.name));
fs.writeFileSync(path.join(outDir, "algorithms.json"),
    JSON.stringify(algorithms, null, 2) + "\n");
const withPreview = algorithms.filter(a => a.preview).length;
console.log(`algorithms: ${algorithms.length} entries, ${withPreview} with previews`);

console.log(`\nWrote to ${path.relative(siteRoot, outDir)}/`);
