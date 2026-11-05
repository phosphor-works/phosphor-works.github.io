// SPDX-FileCopyrightText: 2026 fuddlesworth
// SPDX-License-Identifier: GPL-3.0-or-later
//
// Section navigation trees consumed by <Sidebar> and <PrevNext>.
//
// Each section key maps to an ordered list of NavEntry rows.  The
// order here is the order users see in the sidebar and the order
// PrevNext walks for ← prev / next → links — sequential reading
// flow lives here, in one place.
//
// Adding a new page to a section: drop another entry in the
// matching array.  Renaming or moving a page: update the href.
// The Sidebar highlights the active row by exact-matching
// Astro.url.pathname against href, so trailing slashes matter
// (Astro's static build emits trailing slashes for all routes).

export interface NavEntry {
    label: string;
    href: string;
    /** Optional one-line subtitle shown under the label in the
     *  sidebar.  Skip for short / self-explanatory entries. */
    desc?: string;
    /** Optional group heading.  The sidebar prints it above the first
     *  entry of each run of entries that share the same group. */
    group?: string;
}

export interface NavSection {
    /** Heading shown above the link list. */
    title: string;
    /** Where the section "home" lives — used by the breadcrumb in
     *  the sidebar header.  Falls back to the first entry's href. */
    indexHref: string;
    entries: NavEntry[];
}

export const NAV: Record<string, NavSection> = {
    // Afterglow's pages mirror submodules/afterglow/docs/*.md; the
    // [doc].astro route renders whichever of these the submodule has.
    afterglow: {
        title: "Afterglow",
        indexHref: "/afterglow/",
        entries: [
            { group: "Start", label: "Overview",            href: "/afterglow/" },
            { group: "Start", label: "All documents",       href: "/afterglow/docs/" },
            { group: "Start", label: "Build and install",   href: "/afterglow/build/" },
            { group: "Start", label: "Configuration",       href: "/afterglow/configuration/", desc: "Every setting and default binding" },
            { group: "Start", label: "Appearance",          href: "/afterglow/appearance/",    desc: "Fonts, colors and themes" },
            { group: "Use",   label: "Input",               href: "/afterglow/input/",         desc: "Keys, selection, search, hints" },
            { group: "Use",   label: "Panes and projects",  href: "/afterglow/projects/" },
            { group: "Use",   label: "Desktop integration", href: "/afterglow/desktop/",       desc: "Accessibility, input methods, files" },
            { group: "Use",   label: "Bidirectional text",  href: "/afterglow/bidi/" },
            { group: "Use",   label: "External control",    href: "/afterglow/control/",       desc: "Command line and control socket" },
            { group: "Extend", label: "Luau scripting",     href: "/afterglow/scripting/" },
            { group: "Extend", label: "Packages and state", href: "/afterglow/packages/" },
            { group: "Extend", label: "Shaders",            href: "/afterglow/shaders/",       desc: "Reactive effects" },
            { group: "Extend", label: "Shader API",         href: "/afterglow/shader-api/",    desc: "Writing shader passes" },
            { group: "Reference", label: "Compatibility",   href: "/afterglow/compatibility/", desc: "Protocols and limits" },
            { group: "Reference", label: "Performance",     href: "/afterglow/performance/" },
            { group: "Reference", label: "Testing",         href: "/afterglow/testing/" },
            { group: "Reference", label: "Writing rules",   href: "/afterglow/writing/" },
        ],
    },

    guides: {
        title: "Guides",
        indexHref: "/guides/",
        entries: [
            {
                label: "Install a Phosphor library",
                href: "/guides/install/",
                desc: "find_package, FetchContent, Nix",
            },
            {
                label: "Shader authoring",
                href: "/guides/shaders/",
                desc: "GLSL, uniforms, multipass",
            },
            {
                label: "Tiling algorithms",
                href: "/guides/tiling/",
                desc: "Luau sandbox + helpers",
            },
        ],
    },

    plasmazones: {
        title: "PlasmaZones",
        indexHref: "/plasmazones/",
        entries: [
            {
                label: "Install",
                href: "/plasmazones/install/",
                desc: "Packages, tarball, source, requirements",
            },
            {
                label: "Getting started",
                href: "/plasmazones/getting-started/",
                desc: "Verify install → first snap",
            },
            {
                label: "Snapping",
                href: "/plasmazones/snapping/",
                desc: "Triggers, snap assist, zone span, window handling",
            },
            {
                label: "Tiling",
                href: "/plasmazones/tiling/",
                desc: "Insertion, window cap, dragging, exemptions",
            },
            {
                label: "Scrolling",
                href: "/plasmazones/scrolling/",
                desc: "The strip, templates, Meta+Alt family",
            },
            {
                label: "Window rules",
                href: "/plasmazones/rules/",
                desc: "Matching, priority cascade, action families",
            },
            {
                label: "Monitors",
                href: "/plasmazones/screens/",
                desc: "Per-context layouts, monitor identity, virtual screens",
            },
            {
                label: "Keyboard shortcuts",
                href: "/plasmazones/shortcuts/",
                desc: "Default bindings + how to rebind",
            },
            {
                label: "Settings reference",
                href: "/plasmazones/settings/",
                desc: "All 324 configuration keys, generated from the schema",
            },
            {
                label: "From FancyZones",
                href: "/plasmazones/from-fancyzones/",
                desc: "Feature-map for PowerToys users",
            },
            {
                label: "D-Bus scripting",
                href: "/plasmazones/dbus/",
                desc: "17 interfaces on org.plasmazones",
            },
            {
                label: "Troubleshooting",
                href: "/plasmazones/troubleshooting/",
                desc: "Daemon debug, support reports",
            },
            {
                label: "Changelog",
                href: "/plasmazones/changelog/",
                desc: "Every tagged release, mirrored from the repo",
            },
        ],
    },
};

/**
 * Compute the prev / next neighbours of a given pathname inside a
 * section, for use by <PrevNext>.  Either side may be null at the
 * ends of the list.
 */
export function neighbours(
    section: string,
    pathname: string,
): { prev: NavEntry | null; next: NavEntry | null } {
    const sec = NAV[section];
    if (!sec) return { prev: null, next: null };
    const idx = sec.entries.findIndex((e) => e.href === pathname);
    if (idx < 0) return { prev: null, next: null };
    return {
        prev: idx > 0 ? sec.entries[idx - 1] : null,
        next: idx < sec.entries.length - 1 ? sec.entries[idx + 1] : null,
    };
}
