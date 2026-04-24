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
// Each .js file starts with `var metadata = { ... };` — extract it
// and evaluate the literal.  Safer than regex-scraping each field.
const algoDir = path.join(src, "data/algorithms");
const algorithms = fs.readdirSync(algoDir)
    .filter(f => f.endsWith(".js"))
    .map(f => {
        const source = fs.readFileSync(path.join(algoDir, f), "utf-8");
        const m = source.match(/var\s+metadata\s*=\s*(\{[\s\S]*?\n\});/);
        if (!m) {
            console.warn(`  skip ${f}: no metadata object found`);
            return null;
        }
        // Use Function to evaluate the object literal in a scope that
        // permits JS syntax (unquoted keys, trailing commas).
        try {
            const obj = new Function(`return (${m[1]});`)();
            return obj;
        } catch (err) {
            console.warn(`  skip ${f}: ${err.message}`);
            return null;
        }
    })
    .filter(Boolean)
    .sort((a, b) => a.name.localeCompare(b.name));
fs.writeFileSync(path.join(outDir, "algorithms.json"),
    JSON.stringify(algorithms, null, 2) + "\n");
console.log(`algorithms: ${algorithms.length} entries`);

console.log(`\nWrote to ${path.relative(siteRoot, outDir)}/`);
