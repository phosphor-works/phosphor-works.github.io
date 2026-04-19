// SPDX-FileCopyrightText: 2026 fuddlesworth
// SPDX-License-Identifier: GPL-3.0-or-later
//
// Library metadata consumed by /libraries/ index + /libraries/<slug>/
// dynamic pages.  Deep content lives in docs/libs/*.md (which only
// doxygen reads today).

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
        oneLiner: "Wayland layer-shell and QPA plugin for overlays.",
        description:
            "Window-overlay primitives. A QPA plugin lets a Qt app mount " +
            "`QQuickWindow`s as Wayland layer-shell surfaces. `ShaderRegistry` " +
            "backs shader-driven overlays like zone flashes, snap previews, and " +
            "drag ghosts. Consumers never touch wl_layer_shell directly.",
        keyTypes: [
            { name: "LayerSurface",     purpose: "Q_PROPERTY wrapper around the layer-shell role." },
            { name: "ShaderRegistry",   purpose: "Global registry of shader effects addressable by ID." },
            { name: "IUniformExtension",purpose: "Feeds per-zone data into shader UBOs." },
        ],
        deps: ["QtCore", "QtGui", "QtQuick", "QtWaylandClient (private)"],
    },
    {
        slug: "identity",
        namespace: "PhosphorIdentity",
        oneLiner: "Stable window identity primitives.",
        description:
            "`WindowId` is a portable handle for a top-level window across Wayland, " +
            "XWayland, and KWin. It's opaque to callers but comparable, hashable, " +
            "and persistable. Needed because Wayland's xdg_toplevel tokens aren't " +
            "persistent, yet `ILayoutAssignments` and snap-rules tracking rely on " +
            "a handle that survives restarts.",
        keyTypes: [
            { name: "WindowId",        purpose: "Opaque window handle. Equality and hashing only." },
            { name: "IWindowRegistry", purpose: "Enumerates known windows, emits open/close signals." },
        ],
        deps: ["QtCore"],
    },
    {
        slug: "rendering",
        namespace: "PhosphorRendering",
        oneLiner: "ShaderEffect and RenderNode infrastructure.",
        description:
            "QQuickItem plus scene-graph render node plus a runtime GLSL→SPIR-V " +
            "compiler, for hosting multi-pass shader effects in a Qt Quick scene. " +
            "Replaces Qt Quick's built-in `ShaderEffect`, which can't do multipass, " +
            "custom UBOs, or include files. Powers zone highlights, snap indicators, " +
            "and window dim/fade.",
        keyTypes: [
            { name: "ShaderEffect",    purpose: "The QQuickItem you instantiate in QML." },
            { name: "ShaderNodeRhi",   purpose: "QRhi-backed scene-graph node that owns the pipeline and UBOs." },
            { name: "ShaderCompiler",  purpose: "GLSL → SPIR-V with on-disk cache." },
        ],
        deps: ["QtCore", "QtGui", "QtQuick", "QtQml", "glslang"],
        seeAlso: [{ slug: "shell", reason: "ShaderRegistry and IUniformExtension live there." }],
    },
    {
        slug: "animation",
        namespace: "PhosphorAnimation",
        oneLiner: "Window motion curves and animation controllers.",
        description:
            "Motion primitives for zone snap-in, window fade, drag-ghost transitions, " +
            "and ambient shader-time updates. Time is a single per-frame " +
            "`AnimationController` tick that individual effects subscribe to.",
        keyTypes: [
            { name: "AnimationController", purpose: "Per-frame tick scheduler." },
            { name: "EasingCurve",         purpose: "Standard easings plus custom splines." },
        ],
        deps: ["QtCore"],
    },
    {
        slug: "zones",
        namespace: "PhosphorZones",
        oneLiner: "Zone data model and JSON persistence.",
        description:
            "The heart of the window-tiling model. `Zone` is a named rect with metadata. " +
            "`Layout` is a set of zones plus screen and virtual-desktop assignment rules. " +
            "`ZoneDetector` resolves a cursor position to a zone. Persistence lives under " +
            "`~/.local/share/plasmazones/layouts/` as JSON with normalized 0..1 " +
            "coordinates so the same layout works on any screen size.",
        keyTypes: [
            { name: "Zone",              purpose: "Rect, id, label, appearance." },
            { name: "Layout",            purpose: "Collection of zones plus assignment rules." },
            { name: "IZoneDetector",     purpose: "Cursor-to-zone resolver." },
            { name: "ILayoutManager",    purpose: "Full layout CRUD." },
            { name: "ILayoutPersistence",purpose: "Loads and saves layout JSON." },
        ],
        deps: ["QtCore", "QtGui"],
        seeAlso: [
            { slug: "identity",   reason: "WindowId for assignments." },
            { slug: "layout-api", reason: "ILayoutSource and related interfaces." },
            { slug: "tiles",      reason: "Tiling algorithms consume the same Layout." },
        ],
    },
    {
        slug: "tiles",
        namespace: "PhosphorTiles",
        oneLiner: "Tiling algorithms, built-in and scripted.",
        description:
            "Algorithms that turn a set of windows into a layout. Ships with " +
            "built-in binary-split, columns, and master-stack, plus a sandboxed " +
            "QJSEngine host so users can add their own tiling rules without a " +
            "recompile. Operates on `Layout` from phosphor-zones.",
        keyTypes: [
            { name: "BuiltInAlgorithm",       purpose: "C++ tiling implementation." },
            { name: "ScriptedAlgorithm",      purpose: "Wraps a user JS function." },
            { name: "AutotilePreviewRender",  purpose: "Renders a thumbnail for the algorithm picker." },
        ],
        deps: ["QtCore", "QtQml", "QtQuick"],
        seeAlso: [{ slug: "zones", reason: "Operates on Layout." }],
    },
    {
        slug: "shortcuts",
        namespace: "PhosphorShortcuts",
        oneLiner: "Pluggable global-shortcut backends.",
        description:
            "A `Registry` and `IBackend` pair. Client code registers shortcut IDs; " +
            "backends translate them into platform shortcut primitives. Ships with " +
            "KGlobalAccel for KDE, XDG Portal for other desktops, and a D-Bus " +
            "fallback for headless or non-KDE sessions.",
        keyTypes: [
            { name: "Registry",         purpose: "Client-facing shortcut registration API." },
            { name: "IBackend",         purpose: "Backend contract." },
            { name: "IAdhocRegistrar",  purpose: "Dynamic shortcut binding for non-static shortcuts." },
            { name: "Factory",          purpose: "Picks the right IBackend for the current session." },
        ],
        deps: ["QtCore", "QtGui", "QtDBus"],
    },
    {
        slug: "layer",
        namespace: "PhosphorLayer",
        oneLiner: "Layer-based overlay rendering.",
        description:
            "Shared infrastructure for the overlay layers: zone preview, snap " +
            "indicators, drag ghosts. `SurfaceConfig` carries per-surface " +
            "configuration. Common render passes live here rather than being " +
            "duplicated across consumers.",
        keyTypes: [
            { name: "SurfaceConfig", purpose: "Per-surface display and render settings." },
        ],
        deps: ["QtCore", "QtGui", "QtQuick"],
    },
    {
        slug: "layout-api",
        namespace: "PhosphorLayoutApi",
        oneLiner: "Layout description interfaces.",
        description:
            "Interfaces that describe a layout to any consumer: the editor, autotile, " +
            "the D-Bus facade. `ILayoutSource` is the canonical producer. Downstream " +
            "code works against this contract rather than the `Layout` value type, " +
            "so fake sources in tests are cheap to write.",
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
            "`IConfigBackend` is the contract. The default JSON implementation " +
            "writes to `~/.config/plasmazones/config.json`. Schema versioning and " +
            "the migration chain live here too, so app code never deals with " +
            "version-bump logic directly.",
        keyTypes: [
            { name: "IConfigBackend",    purpose: "Get/set/list keys in a group." },
            { name: "JsonConfigBackend", purpose: "Default JSON-on-disk implementation." },
            { name: "MigrationStep",     purpose: "One version-to-version migration entry." },
        ],
        deps: ["QtCore"],
    },
];
