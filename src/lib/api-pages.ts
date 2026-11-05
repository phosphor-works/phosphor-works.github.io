// SPDX-FileCopyrightText: 2026 fuddlesworth
// SPDX-License-Identifier: GPL-3.0-or-later
//
// Links into the Doxygen reference under /api/html/.  In CI the
// reference is generated into api/html/ before the Astro build (see
// scripts/build-docs.sh and .github/workflows/deploy.yml), so a link is
// only emitted when its target page exists.  Without a local Doxygen
// build there is nothing to check against, and links are emitted as-is.

import { existsSync } from "node:fs";
import { join } from "node:path";

const API_DIR = join(process.cwd(), "api", "html");
const haveReference = existsSync(join(API_DIR, "index.html"));

/** `/api/html/<file>` if that page exists (or can't be checked), else null. */
export function apiPage(file: string): string | null {
    if (!haveReference || existsSync(join(API_DIR, file))) return `/api/html/${file}`;
    return null;
}

/** True for a C++ namespace, false for a QML module name such as `Phosphor.Bar`. */
export function isCppNamespace(ns: string): boolean {
    return /^[A-Za-z_]\w*(::[A-Za-z_]\w*)*$/.test(ns);
}
