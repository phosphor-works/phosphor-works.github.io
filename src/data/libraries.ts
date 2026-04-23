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
        oneLiner: "Motion curves, profiles, and animation controllers.",
        description:
            "Motion primitives for zone snap-in, window fade, drag-ghost transitions, " +
            "and ambient shader-time updates. `AnimationController` drives a single " +
            "per-frame tick that effects subscribe to. The richer path is the `Profile` " +
            "+ `PhosphorProfileRegistry` system: JSON-backed bundles of duration, curve, " +
            "and sequencing defaults that round-trip through settings, D-Bus, and QML. " +
            "`MotionSpec` is the runtime call-site bundle an `AnimatedValue<T>` takes " +
            "when it starts. User-edited curves and profiles hot-reload from " +
            "`~/.local/share/` without a daemon restart.",
        keyTypes: [
            { name: "AnimationController",     purpose: "Per-frame tick scheduler." },
            { name: "Profile",                 purpose: "Serializable duration / curve / sequencing config." },
            { name: "PhosphorProfileRegistry", purpose: "Process-wide registry that publishes live profile updates." },
            { name: "MotionSpec",              purpose: "Call-site bundle for starting an `AnimatedValue<T>`." },
            { name: "Curve / Spring / Easing", purpose: "Curve primitives for motion specs." },
        ],
        deps: ["QtCore", "QtQml"],
        seeAlso: [{ slug: "jsonloader", reason: "Profile and curve files come through its directory loader." }],
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
        oneLiner: "Layer-shell surface primitives: Surface, SurfaceFactory, transport.",
        description:
            "Core primitives for mounting a QML scene as a Wayland layer-shell " +
            "surface. `Surface` is the per-surface wrapper; `SurfaceFactory` builds it " +
            "with an `ILayerShellTransport` (the wl_layer_shell binding), plus " +
            "`IQmlEngineProvider` and `IScreenProvider` injected so the factory stays " +
            "host-agnostic. `ScreenSurfaceRegistry` tracks one-surface-per-screen " +
            "mappings and `TopologyCoordinator` reconciles them as screens come and go. " +
            "Consumers that just want a ready-to-use surface manager on top should " +
            "reach for `phosphor-surfaces`.",
        keyTypes: [
            { name: "Surface",                 purpose: "Per-surface wrapper around a layer-shell role." },
            { name: "SurfaceFactory",          purpose: "Builds Surfaces with injected transport / engine / screen providers." },
            { name: "ILayerShellTransport",    purpose: "Abstract `wl_layer_shell` binding." },
            { name: "ScreenSurfaceRegistry",   purpose: "Per-screen surface tracking." },
            { name: "TopologyCoordinator",     purpose: "Reconciles surfaces as the screen topology shifts." },
            { name: "SurfaceConfig",           purpose: "Per-surface display and render settings." },
        ],
        deps: ["QtCore", "QtGui", "QtQuick"],
        seeAlso: [{ slug: "surfaces", reason: "Higher-level surface manager built on these primitives." }],
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
    {
        slug: "audio",
        namespace: "PhosphorAudio",
        oneLiner: "Audio spectrum input for audio-reactive shaders.",
        description:
            "Lightweight audio-spectrum feed for shader effects without linking Qt " +
            "Multimedia or writing a PulseAudio client directly. " +
            "`IAudioSpectrumProvider` is the contract; `CavaSpectrumProvider` shells " +
            "out to the user's existing `cava` install, parses its raw-byte output, " +
            "and emits normalized FFT bars at a configurable framerate. Drop it in " +
            "as a UBO feeder for visualizer overlays without the app having to know " +
            "anything about PulseAudio, PipeWire, or ALSA.",
        keyTypes: [
            { name: "IAudioSpectrumProvider", purpose: "Spectrum-provider contract: start, stop, bar count, framerate." },
            { name: "CavaSpectrumProvider",   purpose: "`cava`-backed implementation that normalizes FFT bars." },
        ],
        deps: ["QtCore"],
        seeAlso: [{ slug: "rendering", reason: "Spectrum feeds `ShaderEffect` UBOs." }],
    },
    {
        slug: "engine-api",
        namespace: "PhosphorEngineApi",
        oneLiner: "Unified placement-engine interface for the daemon.",
        description:
            "Decouples the PlasmaZones daemon from the specific placement engines it " +
            "drives (manual snap-mode and automatic autotile-mode). `IPlacementEngine` " +
            "names user intents — move focus, swap windows, assign to zone — and each " +
            "engine implements the intent in its own terms. `IPlacementState` is the " +
            "read-only state contract that the persistence layer and D-Bus adaptor both " +
            "consume. The daemon dispatches every window lifecycle event through a " +
            "single polymorphic call, eliminating mode branches from the hot path.",
        keyTypes: [
            { name: "IPlacementEngine",  purpose: "Intent dispatcher — move, swap, assign, focus." },
            { name: "IPlacementState",   purpose: "Read-only per-screen state contract." },
            { name: "NavigationContext", purpose: "Window + screen target for a navigation or lifecycle op." },
        ],
        deps: ["QtCore"],
        seeAlso: [
            { slug: "zones", reason: "`SnapState` implements `IPlacementState` for snap-mode." },
            { slug: "tiles", reason: "`TilingState` implements `IPlacementState` for autotile-mode." },
        ],
    },
    {
        slug: "jsonloader",
        namespace: "PhosphorJsonLoader",
        oneLiner: "Directory watcher + JSON parser for user-editable schemas.",
        description:
            "Shared loader skeleton for JSON-backed resources that users edit on disk: " +
            "motion curves, animation profiles, layouts. `DirectoryLoader` handles " +
            "directory walks, `QFileSystemWatcher` setup, 50 ms debounced rescans, and " +
            "user-wins-collision bookkeeping. Consumers supply an " +
            "`IDirectoryLoaderSink` with just two methods — `parseFile()` for one entry " +
            "and `commitBatch()` for the full rescan — so each schema's loader is only " +
            "the parsing it actually cares about.",
        keyTypes: [
            { name: "DirectoryLoader",      purpose: "Walk + watch + debounce + rescan skeleton." },
            { name: "IDirectoryLoaderSink", purpose: "Per-schema parse + commit strategy." },
            { name: "ParsedEntry",          purpose: "Parse-result value type with source-path metadata." },
        ],
        deps: ["QtCore"],
    },
    {
        slug: "protocol",
        namespace: "PhosphorProtocol",
        oneLiner: "Shared D-Bus service names, wire types, and client helpers.",
        description:
            "The D-Bus surface the PlasmaZones daemon exposes to compositor plugins " +
            "(KWin effect, Wayfire) and client tools. `ServiceConstants` centralizes " +
            "interface names instead of leaving magic strings scattered across plugins. " +
            "`WireTypes` owns the enum and struct marshallers that cross the D-Bus " +
            "boundary (drag policy, window IDs, zone rects). `ClientHelpers` wraps the " +
            "common async-call patterns so compositor plugins aren't reimplementing " +
            "`QDBusPendingCall` watcher boilerplate.",
        keyTypes: [
            { name: "ServiceConstants", purpose: "Canonical service / object-path / interface names." },
            { name: "WireTypes",        purpose: "Marshallers for enums and structs that cross D-Bus." },
            { name: "ClientHelpers",    purpose: "Async D-Bus call helpers for compositor plugins." },
        ],
        deps: ["QtCore", "QtDBus"],
    },
    {
        slug: "screens",
        namespace: "Phosphor::Screens",
        oneLiner: "Physical and virtual screen topology resolver.",
        description:
            "The seam between \"here's a cursor position\" and \"here's the screen ID " +
            "you should route to\". `Manager` tracks physical screens, virtual " +
            "sub-regions within them, and panel reservations via a pluggable " +
            "`IPanelSource` per desktop. `Resolver` maps a global point to its effective " +
            "screen and virtual screen. `Swapper` handles D-Bus-addressable directional " +
            "virtual-screen swaps. `DBusScreenAdaptor` exposes the whole surface on the " +
            "canonical `org.plasmazones.Screen` interface so editor, KCM, and launcher " +
            "call sites can stay compositor-agnostic.",
        keyTypes: [
            { name: "Manager",           purpose: "Physical + virtual screen topology state with change signals." },
            { name: "Resolver",          purpose: "Point-to-screen lookup; accepts an optional D-Bus endpoint override." },
            { name: "IPanelSource",      purpose: "Pluggable panel-reservation source per desktop (Plasma, GNOME, wlr)." },
            { name: "VirtualScreen",     purpose: "One rectangular sub-region of a physical screen." },
            { name: "DBusScreenAdaptor", purpose: "Canonical `org.plasmazones.Screen` D-Bus surface." },
        ],
        deps: ["QtCore", "QtGui", "QtDBus"],
        seeAlso: [
            { slug: "identity", reason: "`VirtualScreenId` is the stable screen handle." },
            { slug: "shell",    reason: "Layer surfaces pick a screen to mount on." },
        ],
    },
    {
        slug: "surfaces",
        namespace: "PhosphorSurfaces",
        oneLiner: "Layer-shell surface manager with QML loading and Vulkan wiring.",
        description:
            "Higher-level surface manager on top of `phosphor-layer`. Given a " +
            "`SurfaceConfig`, `SurfaceManager` warms up a QML scene synchronously " +
            "(no async QML resolution — callers pass `qrc:/` or `file:/` URLs), creates " +
            "the layer-shell window, wires in a caller-owned or library-managed " +
            "`QVulkanInstance`, and hands back a `Surface*`. This is what app code " +
            "actually instantiates when it needs a zone overlay, a drag ghost, or any " +
            "layer-shell QML scene.",
        keyTypes: [
            { name: "SurfaceManager",       purpose: "Factory and owner for layer-shell surfaces." },
            { name: "SurfaceManagerConfig", purpose: "QML-engine, Vulkan, and pipeline-cache wiring." },
        ],
        deps: ["QtCore", "QtQuick", "QtQml"],
        seeAlso: [{ slug: "layer", reason: "Builds on `Surface` / `SurfaceFactory` / transport primitives." }],
    },
];
