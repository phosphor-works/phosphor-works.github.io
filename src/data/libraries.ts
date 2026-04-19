// SPDX-FileCopyrightText: 2026 fuddlesworth
// SPDX-License-Identifier: GPL-3.0-or-later
//
// Library metadata consumed by /libraries/ index + /libraries/<slug>/
// dynamic pages.  Kept tight — 3-5 sentences per library max — so
// these pages load fast and the doxygen reference stays the source
// of truth for the full API.  Deep content lives in docs/libs/*.md
// (which only doxygen reads today).

export interface KeyType {
    name: string;
    purpose: string;
}

export interface Library {
    slug: string;                 // file-path slug (e.g. "layout-api")
    namespace: string;            // C++ namespace (e.g. "PhosphorLayoutApi")
    oneLiner: string;
    description: string;          // 1-2 paragraphs
    keyTypes: KeyType[];
    deps: string[];
    seeAlso?: { slug: string; reason: string }[];
}

export const LIBRARIES: Library[] = [
    {
        slug: "shell",
        namespace: "PhosphorShell",
        oneLiner: "Wayland layer-shell & QPA plugin for overlays.",
        description:
            "Phosphor's home for window-overlay primitives: a custom QPA plugin that " +
            "lets a Qt app mount `QQuickWindow`s as Wayland layer-shell surfaces, plus " +
            "the `ShaderRegistry` that backs shader-driven overlays (zone flash, snap " +
            "preview, drag ghost).  Consumers never touch wl_layer_shell directly.",
        keyTypes: [
            { name: "LayerSurface",     purpose: "Q_PROPERTY-driven wrapper around the layer-shell role." },
            { name: "ShaderRegistry",   purpose: "Global registry of shader effects addressable by ID." },
            { name: "IUniformExtension",purpose: "Interface that feeds per-zone data into shader UBOs." },
        ],
        deps: ["QtCore", "QtGui", "QtQuick", "QtWaylandClient (private)"],
    },
    {
        slug: "identity",
        namespace: "PhosphorIdentity",
        oneLiner: "Stable window identity primitives.",
        description:
            "`WindowId` is a portable handle for a top-level window across Wayland, " +
            "XWayland, and KWin — opaque to callers but comparable, hashable, and " +
            "persistable.  Critical for `ILayoutAssignments` and snap-rules tracking " +
            "because Wayland's xdg_toplevel tokens aren't themselves persistent.",
        keyTypes: [
            { name: "WindowId",        purpose: "Opaque window handle — equality/hashing only." },
            { name: "IWindowRegistry", purpose: "Enumerates known windows, emits open/close signals." },
        ],
        deps: ["QtCore"],
    },
    {
        slug: "rendering",
        namespace: "PhosphorRendering",
        oneLiner: "ShaderEffect / RenderNode infrastructure.",
        description:
            "QQuickItem + scene-graph render node + runtime GLSL→SPIR-V compiler for " +
            "hosting multi-pass shader effects in a Qt Quick scene.  Replaces Qt Quick's " +
            "built-in `ShaderEffect` which can't do multipass, custom UBOs, or include " +
            "files.  Used for zone highlights, snap indicators, window dim/fade.",
        keyTypes: [
            { name: "ShaderEffect",    purpose: "QQuickItem you instantiate in QML." },
            { name: "ShaderNodeRhi",   purpose: "QRhi-backed scene-graph node owning pipeline + UBOs." },
            { name: "ShaderCompiler",  purpose: "GLSL → SPIR-V with on-disk cache." },
        ],
        deps: ["QtCore", "QtGui", "QtQuick", "QtQml", "glslang"],
        seeAlso: [{ slug: "shell", reason: "ShaderRegistry + IUniformExtension live there." }],
    },
    {
        slug: "animation",
        namespace: "PhosphorAnimation",
        oneLiner: "Window motion curves & animation controllers.",
        description:
            "Motion primitives that drive zone snap-in, window-fade, drag-ghost " +
            "transitions, and ambient shader-time updates.  Time is a single " +
            "per-frame `AnimationController` tick; individual effects subscribe.",
        keyTypes: [
            { name: "AnimationController", purpose: "Per-frame tick scheduler." },
            { name: "EasingCurve",         purpose: "Standard + custom spline easings." },
        ],
        deps: ["QtCore"],
    },
    {
        slug: "zones",
        namespace: "PhosphorZones",
        oneLiner: "Zone data model & JSON persistence.",
        description:
            "The heart of the window-tiling model: `Zone` is a named rect with metadata, " +
            "`Layout` is a set of zones plus screen / virtual-desktop assignment rules, " +
            "and `ZoneDetector` resolves cursor-position → zone.  All persistence lives " +
            "under `~/.local/share/plasmazones/layouts/` as JSON with normalized (0-1) " +
            "coordinates so layouts are screen-size-independent.",
        keyTypes: [
            { name: "Zone",              purpose: "Rect + id + label + appearance." },
            { name: "Layout",            purpose: "Collection of zones + assignment rules." },
            { name: "IZoneDetector",     purpose: "Cursor-to-zone resolver." },
            { name: "ILayoutManager",    purpose: "Full layout CRUD." },
            { name: "ILayoutPersistence",purpose: "Load / save JSON." },
        ],
        deps: ["QtCore", "QtGui"],
        seeAlso: [
            { slug: "identity",   reason: "WindowId for assignments." },
            { slug: "layout-api", reason: "ILayoutSource + related interfaces." },
            { slug: "tiles",      reason: "Tiling algorithms consume the same Layout." },
        ],
    },
    {
        slug: "tiles",
        namespace: "PhosphorTiles",
        oneLiner: "Tiling algorithms — built-in + scripted JS.",
        description:
            "Algorithms that turn a set of windows into a layout.  Ships with built-in " +
            "binary-split / columns / master-stack, plus a sandboxed QJSEngine host so " +
            "users can add their own tiling rules without a recompile.  Operates on " +
            "`Layout` from phosphor-zones.",
        keyTypes: [
            { name: "BuiltInAlgorithm",       purpose: "C++ tiling impl." },
            { name: "ScriptedAlgorithm",      purpose: "Wraps a user JS function." },
            { name: "AutotilePreviewRender",  purpose: "Renders a thumbnail for the algorithm picker." },
        ],
        deps: ["QtCore", "QtQml", "QtQuick"],
        seeAlso: [{ slug: "zones", reason: "Operates on Layout." }],
    },
    {
        slug: "shortcuts",
        namespace: "PhosphorShortcuts",
        oneLiner: "Pluggable global-shortcut backends (KGlobalAccel / XDG / D-Bus).",
        description:
            "A `Registry` + `IBackend` pair: client code registers shortcut IDs, " +
            "backends translate those into platform shortcut primitives.  Ships with " +
            "KGlobalAccel (KDE), XDG Portal (standardized desktop), and a D-Bus " +
            "fallback for headless / non-KDE sessions.",
        keyTypes: [
            { name: "Registry",         purpose: "Client-facing shortcut registration API." },
            { name: "IBackend",         purpose: "Backend contract." },
            { name: "IAdhocRegistrar",  purpose: "Dynamic (non-static) shortcut binding." },
            { name: "Factory",          purpose: "Instantiates the right IBackend for the session." },
        ],
        deps: ["QtCore", "QtGui", "QtDBus"],
    },
    {
        slug: "layer",
        namespace: "PhosphorLayer",
        oneLiner: "Layer-based overlay rendering.",
        description:
            "Shared infrastructure for the overlay layers (zone preview, snap indicators, " +
            "drag ghosts) — `SurfaceConfig` carries the per-surface configuration, and " +
            "common render passes live here instead of being duplicated across consumers.",
        keyTypes: [
            { name: "SurfaceConfig", purpose: "Per-surface display + render settings." },
        ],
        deps: ["QtCore", "QtGui", "QtQuick"],
    },
    {
        slug: "layout-api",
        namespace: "PhosphorLayoutApi",
        oneLiner: "Layout description interfaces.",
        description:
            "Interfaces that describe a layout to any consumer (editor, autotile, D-Bus " +
            "facade).  `ILayoutSource` is the canonical producer; downstream code works " +
            "off this contract rather than `Layout` directly so testing with fake " +
            "sources is painless.",
        keyTypes: [
            { name: "ILayoutSource",          purpose: "Canonical layout producer contract." },
            { name: "CompositeLayoutSource",  purpose: "Combines multiple sources." },
            { name: "AlgorithmMetadata",      purpose: "Descriptor shown in the autotile picker." },
            { name: "LayoutPreview",          purpose: "Renderable thumbnail of a layout." },
        ],
        deps: ["QtCore"],
    },
    {
        slug: "config",
        namespace: "PhosphorConfig",
        oneLiner: "Pluggable configuration backends.",
        description:
            "`IConfigBackend` is the contract; ships with a JSON implementation that " +
            "writes to `~/.config/plasmazones/config.json`.  Schema versioning + " +
            "migration chain lives here too so app code doesn't deal with " +
            "version-bump logic directly.",
        keyTypes: [
            { name: "IConfigBackend",    purpose: "Contract — get/set/list keys in a group." },
            { name: "JsonConfigBackend", purpose: "Default JSON-on-disk implementation." },
            { name: "MigrationStep",     purpose: "One version→version migration entry." },
        ],
        deps: ["QtCore"],
    },
];
