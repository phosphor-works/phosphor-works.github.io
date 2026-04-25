// SPDX-FileCopyrightText: 2026 fuddlesworth
// SPDX-License-Identifier: GPL-3.0-or-later
//
// Astro 6 emits a "Content config not loaded" warning at dev startup
// when no content collections are declared.  This site uses bespoke
// .astro routes under src/pages/ rather than content collections, so
// declare an empty `collections` object to satisfy the loader and
// silence the warning.

export const collections = {};
