// SPDX-FileCopyrightText: 2026 fuddlesworth
// SPDX-License-Identifier: GPL-3.0-or-later
//
// Locates the phosphor-works checkouts the site is built from.  Each is
// looked up by repository name under $PHOSPHOR_WORKS_SRC (default: the
// directory holding this repo, so sibling clones work with no setup),
// and each can be pointed elsewhere on its own with its variable.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const siteRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const worksRoot = path.resolve(process.env.PHOSPHOR_WORKS_SRC || path.resolve(siteRoot, ".."));

// Resolve one checkout, throwing with a pointer at the fix when `marker`
// (a path inside the repository) is missing.
export function checkout(envVar, repo, marker) {
    const dir = process.env[envVar]
        ? path.resolve(process.env[envVar])
        : path.join(worksRoot, repo);
    if (!fs.existsSync(path.join(dir, marker))) {
        throw new Error(
            `${repo}: ${marker} not found under ${dir}\n` +
            `Check out phosphor-works/${repo} next to this repo, or set ${envVar}\n` +
            `(or PHOSPHOR_WORKS_SRC for the directory holding every checkout).`);
    }
    return dir;
}

// Afterglow's docs/, which the site renders as /afterglow/<doc>/.
export function afterglowDocsDir() {
    return path.join(checkout("AFTERGLOW_SRC", "Afterglow", "docs"), "docs");
}
