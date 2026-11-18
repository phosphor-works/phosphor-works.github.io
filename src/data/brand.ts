// SPDX-FileCopyrightText: 2026 fuddlesworth
// SPDX-License-Identifier: GPL-3.0-or-later
//
// The icons in the pinned branding release (vendor/branding/svg/), with
// what each one depicts.  /brand/ lists them all, and an app's landing
// page reads its own entry, so an icon is described once.

export interface BrandIcon {
    /** File name under /brand/assets/{square,circle,mark}/{theme}/. */
    slug: string;
    label: string;
    desc: string;
}

export const ICONS: BrandIcon[] = [
    {
        slug: "phosphor",
        label: "Phosphor",
        desc: "Umbrella brand mark. Φ is the scientific symbol for luminous flux and visually reads as stylized \"P\"/\"ph\".",
    },
    {
        slug: "lambent",
        label: "Lambent",
        desc: "Lambent desktop shell. A curved L cradles a small flame.",
    },
    {
        slug: "afterglow",
        label: "Afterglow",
        desc: "Afterglow terminal. A tapered A with a split elliptical crossbar that echoes the Phosphor mark.",
    },
    {
        slug: "facet",
        label: "Facet",
        desc: "Facet settings manager. A cut gem seen from above, with eight star facets around an octagonal table. Each settings page is one facet of the whole.",
    },
    {
        slug: "limn",
        label: "Limn",
        desc: "Limn text editor. A slanted pen nib, split by its slit and vent, drawing a tapered stroke.",
    },
    {
        slug: "glisten",
        label: "Glisten",
        desc: "Glisten screen capture and recorder. A lens ring around a record dot, with a four-pointed glint of light off its rim.",
    },
    {
        slug: "cresset",
        label: "Cresset",
        desc: "Cresset file explorer. A beacon fire: a three-tongued flame in a crescent bowl on a tapered pole.",
    },
    {
        slug: "illume",
        label: "Illume",
        desc: "Illume image viewer. An almond eye of two crescent lids, with a small eight-rayed sun for its iris.",
    },
    {
        slug: "plasmazones",
        label: "PlasmaZones",
        desc: "Primary app icon for the zone-tiling flagship. Five stroked zones sitting inside the shared gradient frame.",
    },
    {
        slug: "plasmazones-editor",
        label: "PlasmaZones Editor",
        desc: "Layout editor variant. Zone motif wrapped in a canvas mark.",
    },
    {
        slug: "plasmazones-settings",
        label: "PlasmaZones Settings",
        desc: "Settings app variant. Zone motif wrapped in a cog outline.",
    },
];

export function iconBySlug(slug: string): BrandIcon {
    const icon = ICONS.find((i) => i.slug === slug);
    if (!icon) throw new Error(`unknown brand icon: ${slug}`);
    return icon;
}
