// SPDX-FileCopyrightText: 2026 fuddlesworth
// SPDX-License-Identifier: GPL-3.0-or-later
//
// The Phosphor desktop suite: one row per app.  The topbar Apps menu,
// the home page app grid, the footer, and each app's landing page all
// read from here, so adding an app or changing its status is one edit.
//
// `status` must stay honest.  "Released" means there is a tagged
// release people can install; "In development" means code exists and
// runs but has not shipped; "In design" means a written design and
// little or no app code; "Planned" means the app is decided on but
// not started.

export type AppStatus = "Released" | "In development" | "In design" | "Planned";

export interface SuiteApp {
    /** URL segment and icon slug in the branding repo. */
    slug: string;
    /** Icon file name under /brand/assets/{square,circle}/{theme}/. */
    icon: string;
    name: string;
    /** What it is, in two or three words.  Shown under the name. */
    role: string;
    /** One sentence for cards and the topbar menu. */
    summary: string;
    status: AppStatus;
    /** Latest released version, when there is one. */
    version?: string;
    href: string;
    repo: string;
}

export const APPS: SuiteApp[] = [
    {
        slug: "compositor",
        icon: "phosphor",
        name: "Phosphor",
        role: "Wayland compositor",
        summary: "A standalone Wayland compositor written directly against libwayland, DRM and libinput, with window placement built in.",
        status: "In design",
        href: "/compositor/",
        repo: "https://github.com/fuddlesworth/PlasmaZones/tree/main/docs/phosphor-compositor-core",
    },
    {
        slug: "lambent",
        icon: "lambent",
        name: "Lambent",
        role: "Desktop shell",
        summary: "A QML desktop shell whose bar draws the live window layout and whose popouts are placed like windows.",
        status: "In development",
        href: "/lambent/",
        repo: "https://github.com/fuddlesworth/PlasmaZones/tree/main/phosphor-shell",
    },
    {
        slug: "plasmazones",
        icon: "plasmazones",
        name: "PlasmaZones",
        role: "Window management",
        summary: "Window snapping, tiling and scrolling for KDE Plasma, with zone layouts, Luau tiling scripts and shader effects.",
        status: "Released",
        version: "3.5.5",
        href: "/plasmazones/",
        repo: "https://github.com/fuddlesworth/PlasmaZones",
    },
    {
        slug: "afterglow",
        icon: "afterglow",
        name: "Afterglow",
        role: "Terminal",
        summary: "A GPU-rendered terminal with tabs, splits, shell integration, inline images, Luau scripts and audio-reactive shaders.",
        status: "In development",
        href: "/afterglow/",
        repo: "https://github.com/phosphor-works/Afterglow",
    },
    {
        slug: "facet",
        icon: "facet",
        name: "Facet",
        role: "Settings manager",
        summary: "One settings app for the whole suite, grown out of the PlasmaZones settings window.",
        status: "Planned",
        href: "/facet/",
        repo: "https://github.com/fuddlesworth/PlasmaZones/tree/main/plasmazones/src/settings",
    },
];

export function appBySlug(slug: string): SuiteApp {
    const app = APPS.find((a) => a.slug === slug);
    if (!app) throw new Error(`unknown app: ${slug}`);
    return app;
}
