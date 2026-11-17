#!/usr/bin/env node
// SPDX-FileCopyrightText: 2026 fuddlesworth
// SPDX-License-Identifier: GPL-3.0-or-later
//
// Fetch the pinned branding release into vendor/branding/ (gitignored).
// The site serves its svg/ tree at /brand/assets/ and reads its palette
// through the public/ symlinks and src/data/palette.ts.
//
// The release is pinned by version, URL and SHA-256, as PlasmaZones and
// Lambent pin it.  This is the only place the pin lives.  Bumping it:
// change all four together, with the hash taken from the release's own
// .sha256 asset.
//
// Runs before `npm run dev` and `npm run build`, and in the deploy
// workflow.  Nothing is downloaded when vendor/branding/ already holds
// the pinned version.

import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { siteRoot } from "./upstream-checkouts.mjs";

const BRANDING_VERSION = "0.2.0";
const BRANDING_URL = "https://github.com/phosphor-works/branding/releases/download/v0.2.0/phosphor-branding-0.2.0.tar.gz";
const BRANDING_FILE = "phosphor-branding-0.2.0.tar.gz";
const BRANDING_SHA256 = "f070cae3490eefe364d0230b737ae7e1ae9463e3ba5c9f93b93a7119665d413c";

const dest = path.join(siteRoot, "vendor/branding");
const versionFile = path.join(dest, "VERSION");

if (fs.existsSync(versionFile) && fs.readFileSync(versionFile, "utf-8").trim() === BRANDING_VERSION) {
    console.log(`branding ${BRANDING_VERSION}: already in ${path.relative(siteRoot, dest)}/`);
    process.exit(0);
}

console.log(`branding ${BRANDING_VERSION}: downloading ${BRANDING_URL}`);
const res = await fetch(BRANDING_URL);
if (!res.ok) {
    console.error(`branding: download failed: HTTP ${res.status} ${res.statusText}`);
    process.exit(1);
}
const archive = Buffer.from(await res.arrayBuffer());
const sha256 = crypto.createHash("sha256").update(archive).digest("hex");
if (sha256 !== BRANDING_SHA256) {
    console.error(`branding: ${BRANDING_FILE} has SHA-256 ${sha256}, expected ${BRANDING_SHA256}`);
    process.exit(1);
}

// Unpack beside the destination and rename it into place, so an
// interrupted run never leaves a half-extracted tree that the VERSION
// check would trust.
fs.mkdirSync(path.dirname(dest), { recursive: true });
const stage = fs.mkdtempSync(path.join(path.dirname(dest), ".branding-"));
const archivePath = path.join(os.tmpdir(), `${process.pid}-${BRANDING_FILE}`);
try {
    fs.writeFileSync(archivePath, archive);
    execFileSync("tar", ["-xzf", archivePath, "-C", stage, "--strip-components=1"]);
    fs.rmSync(dest, { recursive: true, force: true });
    fs.renameSync(stage, dest);
} finally {
    fs.rmSync(archivePath, { force: true });
    fs.rmSync(stage, { recursive: true, force: true });
}
console.log(`branding ${BRANDING_VERSION}: unpacked into ${path.relative(siteRoot, dest)}/`);
