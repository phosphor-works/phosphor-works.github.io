// SPDX-FileCopyrightText: 2026 fuddlesworth
// SPDX-License-Identifier: GPL-3.0-or-later
//
// Library metadata consumed by /libraries/ index + /libraries/<slug>/
// dynamic pages.  Deep content (responsibility, key types, typical use,
// design notes) lives in the per-library README at
// PlasmaZones/libs/phosphor-<slug>/README.md and is stitched into the
// Doxygen api/html tree by scripts/readme-to-doxypage.py.  This file is
// the lightweight Astro card surface; keep it thin and in sync with the
// repo's library set.

export interface KeyType {
    name: string;
    purpose: string;
}

// Ordering controls how groups appear in surfaces that render the
// catalogue grouped (e.g. the topbar mega-menu). Foundations first
// because everything else builds on them; Surfaces last because that
// stack sits at the top of the runtime.
export const LIBRARY_GROUPS = [
    "Foundations",
    "Layout",
    "Engines",
    "Rendering",
    "Surfaces",
] as const;

export type LibraryGroup = (typeof LIBRARY_GROUPS)[number];

export interface Library {
    slug: string;                 // file-path slug (e.g. "layout-api")
    namespace: string;            // C++ namespace (e.g. "PhosphorLayoutApi")
    oneLiner: string;
    description: string;          // 1-2 paragraphs
    /** Domain bucket used to group libraries in surface UIs (topbar
     *  dropdown today; could power a categorised /libraries/ index
     *  later). */
    group: LibraryGroup;
    keyTypes: KeyType[];
    deps: string[];
    seeAlso?: { slug: string; reason: string }[];
}

export const LIBRARIES: Library[] = [
    {
        slug: "identity",
        namespace: "PhosphorIdentity",
        group: "Foundations",
        oneLiner: "Stable cross-process identity formats.",
        description:
            "Header-only INTERFACE library that owns the wire formats for the IDs " +
            "that flow through the suite: composite `appId|instanceId` window IDs, " +
            "EDID-derived screen IDs, and `<physicalId>/vs:<index>` virtual-screen " +
            "IDs. Daemon, KWin effect, KCM, and any future compositor plugin link " +
            "the same `inline` definitions, so the spelling is unambiguous and " +
            "centralised.",
        keyTypes: [
            { name: "WindowId",        purpose: "Helpers for the canonical `appId|instanceId` window-id format." },
            { name: "ScreenId",        purpose: "EDID parsing + screen-id construction; cached across TUs." },
            { name: "VirtualScreenId", purpose: "`<physicalId>/vs:<index>` build/parse/detect helpers." },
        ],
        deps: ["QtCore"],
    },
    {
        slug: "geometry",
        namespace: "PhosphorGeometry",
        group: "Foundations",
        oneLiner: "Pure-function geometry helpers shared by both engines.",
        description:
            "Zone clamping, overlap resolution, per-window minimum-size " +
            "enforcement, and the canonical rect-to-JSON encoder. Both the snap " +
            "engine and the autotile engine post-process algorithm output through " +
            "these helpers before handing rects to the compositor; keeping them in " +
            "a leaf lib means neither engine ships a private copy and headless " +
            "geometry tests link without GUI infrastructure.",
        keyTypes: [
            { name: "enforceWindowMinSizes", purpose: "Grow zones to fit per-window minimums by stealing from neighbours." },
            { name: "clampZonesToScreen",    purpose: "Position-only clamp; sizes preserved." },
            { name: "removeZoneOverlaps",    purpose: "Resolve residual overlap after min-size growth." },
            { name: "rectToJson",            purpose: "Canonical rect-string format for D-Bus + JSON roundtrip." },
        ],
        deps: ["QtCore", "QtGui"],
    },
    {
        slug: "protocol",
        namespace: "PhosphorProtocol",
        group: "Surfaces",
        oneLiner: "Shared D-Bus service names, wire types, and client helpers.",
        description:
            "The shared D-Bus surface a daemon, a compositor-side plugin such as a " +
            "KWin effect, and a settings UI all talk through. `ServiceConstants` " +
            "centralises the canonical `org.plasmazones.*` interface names. " +
            "`WireTypes` owns the enum and struct marshallers that cross the bus, " +
            "including drag policy, window IDs, zone rects, and navigation result " +
            "types. `ClientHelpers` wraps the common async-call patterns so callers " +
            "aren't reimplementing `QDBusPendingCall` watcher boilerplate.",
        keyTypes: [
            { name: "ServiceConstants", purpose: "Canonical service / object-path / interface names." },
            { name: "WireTypes",        purpose: "Marshallers for enums and structs that cross D-Bus." },
            { name: "ClientHelpers",    purpose: "Async D-Bus call helpers for compositor plugins." },
        ],
        deps: ["QtCore", "QtDBus"],
    },
    {
        slug: "config",
        namespace: "PhosphorConfig",
        group: "Foundations",
        oneLiner: "Pluggable configuration backends with schema + migration.",
        description:
            "`Store` over a pluggable `IBackend` (JSON-on-disk, QSettings, in-memory " +
            "mock). Schema-driven validation rejects invalid values rather than " +
            "silently coercing them. `MigrationRunner` chains versioned JSON " +
            "transforms — one function per schema bump, no per-key fallback reads " +
            "outside migrations.",
        keyTypes: [
            { name: "Store",            purpose: "Front-end API: value(), setValue(), valueChanged signal." },
            { name: "IBackend",         purpose: "Pluggable backend contract." },
            { name: "JsonBackend",      purpose: "Default JSON-on-disk implementation." },
            { name: "Schema",           purpose: "Declarative group tree with leaf type and range constraints." },
            { name: "MigrationRunner",  purpose: "Versioned JSON transforms, one per schema bump." },
        ],
        deps: ["QtCore"],
    },
    {
        slug: "fsloader",
        namespace: "PhosphorFsLoader",
        group: "Foundations",
        oneLiner: "Watched-directory + metadata-pack loader skeleton.",
        description:
            "Generic filesystem-backed registry skeleton: directory walking, file " +
            "watching, debounced rescans, user-wins-over-system layering, plus a " +
            "pluggable `IScanStrategy`. `DirectoryLoader` handles the flat-`*.json` " +
            "case (used by curve and profile loaders); " +
            "`MetadataPackScanStrategy<Payload>` plus `MetadataPackRegistryBase` " +
            "handle the subdirectory-with-`metadata.json` case (used by the shader " +
            "and animation-shader registries). Renamed from `phosphor-jsonloader` " +
            "once the metadata-pack primitives moved in.",
        keyTypes: [
            { name: "WatchedDirectorySet",     purpose: "Watcher + debounce + parent-watch + race-guard mechanism." },
            { name: "IScanStrategy",           purpose: "Pluggable enumerate/parse/commit policy." },
            { name: "DirectoryLoader",         purpose: "Flat `*.json` specialisation paired with `IDirectoryLoaderSink`." },
            { name: "MetadataPackRegistryBase",purpose: "QObject base for registries hosting a `MetadataPackScanStrategy<Payload>`." },
            { name: "JsonEnvelopeValidator",   purpose: "Shared `\"name\"`-field envelope validator." },
        ],
        deps: ["QtCore"],
        seeAlso: [
            { slug: "animation", reason: "ProfileLoader, CurveLoader, and AnimationShaderRegistry are clients." },
            { slug: "shaders",   reason: "ShaderRegistry inherits MetadataPackRegistryBase." },
        ],
    },
    {
        slug: "shaders",
        namespace: "PhosphorShaders",
        group: "Rendering",
        oneLiner: "Shader-effect registry, base UBO layout, uniform extension contract.",
        description:
            "The shader-domain pieces every consumer of `phosphor-rendering` builds " +
            "on. `BaseUniforms` is the std140 block (Shadertoy-compatible plus two " +
            "`appField` ints); `IUniformExtension` is the contract for appending " +
            "application-specific data after it. `ShaderRegistry` discovers shader " +
            "packs from search paths via metadata-pack scanning. " +
            "`ShaderIncludeResolver` handles `#include \"…\"` / `#include <…>` in " +
            "GLSL with a depth limit. `IWallpaperProvider` abstracts the active " +
            "desktop wallpaper image path with built-in detection for KDE, " +
            "Hyprland, Sway, and GNOME. Split out of the old `phosphor-shell`.",
        keyTypes: [
            { name: "BaseUniforms",          purpose: "std140 base UBO layout with two `appField` escape-hatch ints." },
            { name: "IUniformExtension",     purpose: "Contract for appending custom uniforms after the base UBO." },
            { name: "ShaderRegistry",        purpose: "Per-process shader-effect registry with hot-reload." },
            { name: "ShaderIncludeResolver", purpose: "`#include` expansion with depth limit." },
            { name: "IWallpaperProvider",    purpose: "DE-portable wallpaper image-path source." },
            { name: "CustomParamsKey",       purpose: "Canonical `customParams<N>_<x|y|z|w>` key format." },
        ],
        deps: ["QtCore", "QtGui"],
        seeAlso: [
            { slug: "rendering", reason: "ShaderEffect/ShaderNodeRhi consume BaseUniforms + IUniformExtension." },
            { slug: "animation", reason: "AnimationShaderRegistry is a parallel registry for transition effects." },
            { slug: "wayland",   reason: "Sibling of the old phosphor-shell split — Wayland integration lives there." },
        ],
    },
    {
        slug: "rendering",
        namespace: "PhosphorRendering",
        group: "Rendering",
        oneLiner: "ShaderEffect / ShaderNodeRhi / runtime GLSL → SPIR-V.",
        description:
            "QQuickItem plus scene-graph render node plus a runtime GLSL→SPIR-V " +
            "compiler, for hosting multi-pass shader effects in a Qt Quick scene. " +
            "Replaces Qt Quick's built-in `ShaderEffect`, which can't do multipass, " +
            "custom UBOs, or include files. Specialised zone-aware variants " +
            "(`ZoneShaderNodeRhi` + `ZoneUniformExtension`) bake the overlay's " +
            "labels texture and per-zone uniform tail.",
        keyTypes: [
            { name: "ShaderEffect",         purpose: "The QQuickItem you instantiate in QML." },
            { name: "ShaderNodeRhi",        purpose: "QRhi-backed scene-graph node owning pipeline + UBOs." },
            { name: "ShaderCompiler",       purpose: "GLSL → SPIR-V with on-disk cache." },
            { name: "ZoneShaderNodeRhi",    purpose: "Zone-aware subclass: labels texture + zone counts in BaseUniforms." },
            { name: "ZoneUniformExtension", purpose: "Writes zone rects/colors/params into the UBO tail." },
        ],
        deps: ["QtCore", "QtGui", "QtQuick", "QtQml", "glslang"],
        seeAlso: [{ slug: "shaders", reason: "BaseUniforms + IUniformExtension live there." }],
    },
    {
        slug: "animation",
        namespace: "PhosphorAnimation",
        group: "Rendering",
        oneLiner: "Motion runtime + shader-transition runtime with JSON profiles.",
        description:
            "Two cooperating runtimes. The motion runtime drives `AnimatedValue<T>` " +
            "through curves, springs, easings, and a per-output `IMotionClock` " +
            "(`QtQuickClock` is the Qt Quick adapter). The shader-transition " +
            "runtime (`PhosphorAnimationShaders` namespace) discovers transition " +
            "shader packs from search paths and picks one per event. Both are " +
            "configured by JSON `Profile` / `ShaderProfile` trees keyed on dot-path " +
            "events (`window.open`, `zone.snapIn`); `optional` fields support " +
            "inherit/override. Curves, profiles, and shader packs hot-reload from " +
            "the user data dir without a daemon restart.",
        keyTypes: [
            { name: "AnimatedValue<T>",      purpose: "Typed in-flight animation; pull-model `value()` reads the clock." },
            { name: "MotionSpec<T>",         purpose: "Runtime call-site bundle: profile, clock, retarget policy." },
            { name: "IMotionClock",          purpose: "Per-output pull-model clock contract." },
            { name: "Profile / ProfileTree", purpose: "Serialisable curve+duration+stagger bundle with inheritance." },
            { name: "PhosphorProfileRegistry",purpose: "Process-wide hot-reloading profile registry." },
            { name: "AnimationShaderRegistry",purpose: "Transition shader-pack registry (PhosphorAnimationShaders)." },
            { name: "SurfaceAnimator",       purpose: "ISurfaceAnimator impl that wires both runtimes into phosphor-layer." },
        ],
        deps: ["QtCore", "QtGui", "QtQml", "QtQuick (optional, gated on PHOSPHOR_ANIMATION_QUICK)"],
        seeAlso: [
            { slug: "fsloader",  reason: "Profile, curve, and shader-pack discovery use its loaders." },
            { slug: "rendering", reason: "Host items consume the chosen effect's compiled shader." },
            { slug: "shaders",   reason: "Shares the metadata-pack scan strategy and IUniformExtension contract." },
        ],
    },
    {
        slug: "layout-api",
        namespace: "PhosphorLayoutApi",
        group: "Layout",
        oneLiner: "Layout description interfaces + provider registry.",
        description:
            "The shared vocabulary the zones and tiles libraries both speak. " +
            "`ILayoutSource` is the canonical layout-producer contract. " +
            "`ILayoutSourceFactory` and `ILayoutSourceRegistry` are the provider-" +
            "side seams; `LayoutSourceProviderRegistry` + `LayoutSourceBundle` are " +
            "the composition-root glue that lets a process advertise providers " +
            "once. Plus the cross-cutting value types: `LayoutId`, " +
            "`AlgorithmMetadata`, `AspectRatioClass`, `EdgeGaps`, " +
            "`CompositeLayoutSource`, `LayoutPreview`.",
        keyTypes: [
            { name: "ILayoutSource",                purpose: "Canonical layout producer contract." },
            { name: "ILayoutSourceFactory",         purpose: "Builds an ILayoutSource for a given LayoutId." },
            { name: "ILayoutSourceRegistry",        purpose: "Read-side provider catalogue with `contentsChanged`." },
            { name: "LayoutSourceProviderRegistry", purpose: "Process-wide \"which providers exist\" registrar." },
            { name: "CompositeLayoutSource",        purpose: "Multiplexes several ILayoutSources." },
            { name: "AlgorithmMetadata",            purpose: "Tiling algorithm self-description for picker UI." },
            { name: "LayoutPreview",                purpose: "Renderable thumbnail of any layout." },
        ],
        deps: ["QtCore", "QtGui"],
    },
    {
        slug: "zones",
        namespace: "PhosphorZones",
        group: "Layout",
        oneLiner: "Manual zone data model, registry, and ILayoutSource.",
        description:
            "The heart of the manual-tiling model. `Zone` is a UUID-keyed rect with " +
            "metadata; `Layout` is a collection of zones plus per-context " +
            "(screen/desktop/activity) assignment rules. `ZoneDetector` resolves " +
            "cursor-to-zone. `LayoutRegistry` is the concrete catalogue + " +
            "assignment store implementing both `IZoneLayoutRegistry` and the " +
            "`ILayoutSourceRegistry` provider contract; `ZonesLayoutSource` " +
            "publishes manual layouts to the rest of the stack via " +
            "`ILayoutSource`. JSON persistence uses normalised 0..1 coordinates so " +
            "the same layout works on any screen size.",
        keyTypes: [
            { name: "Zone",                       purpose: "Rect, UUID id, label, appearance." },
            { name: "Layout",                     purpose: "Collection of zones plus app-rule auto-snap mappings." },
            { name: "IZoneDetector / ZoneDetector",purpose: "Cursor-to-zone resolver with adjacency-graph navigation." },
            { name: "IZoneLayoutRegistry",        purpose: "Catalogue contract: enumerate, mutate, set active layout." },
            { name: "LayoutRegistry",             purpose: "Concrete IZoneLayoutRegistry + per-context assignment store." },
            { name: "ZonesLayoutSource",          purpose: "ILayoutSource adapter for manual layouts." },
            { name: "ZoneHighlighter",            purpose: "Overlay highlight state machine (hover/drag/snap-flash)." },
        ],
        deps: ["QtCore", "QtGui"],
        seeAlso: [
            { slug: "identity",     reason: "WindowId for assignments." },
            { slug: "layout-api",   reason: "ILayoutSource and registry contracts." },
            { slug: "snap-engine",  reason: "Consumes LayoutRegistry + ZoneDetector for manual snapping." },
            { slug: "tiles",        reason: "Autotile algorithms produce the same Layout shape." },
        ],
    },
    {
        slug: "tiles",
        namespace: "PhosphorTiles",
        group: "Layout",
        oneLiner: "Tiling algorithms, sandboxed JS, and TilingState.",
        description:
            "The algorithm vocabulary and per-screen tiling state. " +
            "`TilingAlgorithm` is the base; built-in C++ algorithms (binary-split, " +
            "master-stack, columns, spiral, …) plus `ScriptedAlgorithm` for user " +
            "JavaScript, sandboxed via `ScriptedAlgorithmSandbox` with " +
            "`ScriptedAlgorithmJsBuiltins` as the allowlist. `AlgorithmRegistry` " +
            "is the concrete catalogue. `TilingState` tracks per-screen window " +
            "order + master count + split tree and implements `IPlacementState`. " +
            "`AutotileLayoutSource` is the `ILayoutSource` adapter. The runtime " +
            "engine lives in `phosphor-tile-engine`.",
        keyTypes: [
            { name: "TilingAlgorithm",       purpose: "Abstract base; layoutFor(TilingParams) → Layout." },
            { name: "TilingState",           purpose: "Per-screen state implementing IPlacementState." },
            { name: "AlgorithmRegistry",     purpose: "Concrete registry: built-ins + scripted algorithms." },
            { name: "ScriptedAlgorithmSandbox",purpose: "QJSEngine subclass with stripped globals + watchdog." },
            { name: "AutotileLayoutSource",  purpose: "ILayoutSource adapter wrapping the registry." },
            { name: "AutotilePreviewRender", purpose: "Paint-a-thumbnail helper for the algorithm picker." },
        ],
        deps: ["QtCore", "QtGui", "QtQml"],
        seeAlso: [
            { slug: "tile-engine", reason: "Runtime engine that drives algorithms in response to compositor events." },
            { slug: "zones",       reason: "Operates on Layout / Zone." },
        ],
    },
    {
        slug: "engine-api",
        namespace: "PhosphorEngineApi",
        group: "Engines",
        oneLiner: "Unified placement-engine surface + shared service contracts.",
        description:
            "Names every user intent (move, swap, focus, assign-to-zone, …) on " +
            "`IPlacementEngine` so the daemon's hot path is one polymorphic call " +
            "regardless of placement mode. `PlacementEngineBase` owns the " +
            "universal Unmanaged/EngineOwned/Floated FSM. The library also " +
            "declares the cross-engine service contracts (`IWindowRegistry`, " +
            "`IWindowTrackingService`, `IVirtualDesktopManager`, " +
            "`IGeometrySettings`, `ISnapSettings`, `IAutotileSettings`) so the " +
            "daemon wires them up once and engines just consume.",
        keyTypes: [
            { name: "IPlacementEngine",      purpose: "Intent dispatcher for move, swap, assign, and focus operations." },
            { name: "IPlacementState",       purpose: "Read-only per-screen state contract." },
            { name: "PlacementEngineBase",   purpose: "Base class implementing the universal window-state FSM." },
            { name: "IWindowTrackingService",purpose: "Cross-engine shared store for assignments and float state." },
            { name: "IWindowRegistry",       purpose: "Window-id canonicaliser + appId-from-instance lookup." },
            { name: "NavigationContext",     purpose: "(windowId, screenId) target for an intent." },
        ],
        deps: ["QtCore"],
        seeAlso: [
            { slug: "snap-engine", reason: "SnapState implements IPlacementState for snap-mode." },
            { slug: "tile-engine", reason: "AutotileEngine drives autotile-mode through this surface." },
        ],
    },
    {
        slug: "snap-engine",
        namespace: "PhosphorSnapEngine",
        group: "Engines",
        oneLiner: "Manual zone-based placement engine.",
        description:
            "Implements `IPlacementEngine` for screens running a user-drawn zone " +
            "layout. Owns auto-snap on window open, directional zone navigation, " +
            "floating, rotation, and resnap-on-layout-change. Owns `SnapState` " +
            "(per-screen `IPlacementState` for zone assignments + pre-tile " +
            "geometry) and `SnapNavigationTargetResolver` (pure compute for " +
            "keyboard-navigation target geometries). Reads from " +
            "`LayoutRegistry`, `ZoneDetector`, and the engine-api shared " +
            "services; reaches into compositor-shadow state through narrow typed " +
            "interfaces (`INavigationStateProvider`, `IZoneAdjacencyResolver`) " +
            "the daemon's adaptors implement.",
        keyTypes: [
            { name: "SnapEngine",                  purpose: "Concrete IPlacementEngine for manual zone layouts." },
            { name: "SnapState",                   purpose: "Per-screen IPlacementState: zone assignments, pre-tile geometry." },
            { name: "ISnapSettings",               purpose: "Settings contract (declared in PhosphorEngineApi)." },
            { name: "INavigationStateProvider",    purpose: "Narrow read-only state contract the daemon implements." },
            { name: "IZoneAdjacencyResolver",      purpose: "Directional zone lookup contract the daemon implements." },
            { name: "SnapNavigationTargetResolver",purpose: "Pure compute for move/focus/swap/cycle/restore target geometries." },
        ],
        deps: ["QtCore"],
        seeAlso: [
            { slug: "engine-api",  reason: "Implements IPlacementEngine; reads engine-api service contracts." },
            { slug: "zones",       reason: "Consumes LayoutRegistry, IZoneDetector, ZoneHighlighter." },
            { slug: "tile-engine", reason: "Sibling autotile engine; same IPlacementEngine contract." },
        ],
    },
    {
        slug: "tile-engine",
        namespace: "PhosphorTileEngine",
        group: "Engines",
        oneLiner: "Automatic-tiling placement engine.",
        description:
            "Implements `IPlacementEngine` for screens running an autotile " +
            "algorithm. Drives the algorithms from `phosphor-tiles` in response to " +
            "compositor events: window open / close / focus, ratio + master-count " +
            "tweaks, per-screen overrides, and overflow auto-floating when the " +
            "tiled count exceeds `maxWindows`. `NavigationController` lifts focus / " +
            "swap / rotate / split-ratio out of the engine without forking state. " +
            "`OverflowManager` returns float-list deltas without mutating " +
            "`TilingState`. `PerScreenConfigResolver` resolves per-screen " +
            "overrides → global config. Per-app restore queues capped at 16 " +
            "entries.",
        keyTypes: [
            { name: "AutotileEngine",         purpose: "Concrete IPlacementEngine for autotile screens." },
            { name: "AutotileConfig",         purpose: "Global config: default algorithm, gaps, master count, per-algorithm settings." },
            { name: "IAutotileSettings",      purpose: "Settings contract (declared in PhosphorEngineApi)." },
            { name: "NavigationController",   purpose: "Stateless helper for focus / swap / rotate / split-ratio." },
            { name: "OverflowManager",        purpose: "Per-screen tracking of auto-floated overflow windows." },
            { name: "PerScreenConfigResolver",purpose: "Per-screen override → global config resolution." },
        ],
        deps: ["QtCore"],
        seeAlso: [
            { slug: "tiles",       reason: "Algorithm vocabulary, JS sandbox, TilingState." },
            { slug: "engine-api",  reason: "Implements IPlacementEngine; reads engine-api service contracts." },
            { slug: "snap-engine", reason: "Sibling manual-zone engine." },
        ],
    },
    {
        slug: "wayland",
        namespace: "PhosphorWayland",
        group: "Surfaces",
        oneLiner: "Custom QPA plugin + LayerSurface wrapper.",
        description:
            "The lowest level of the layer-shell stack. A custom QPA plugin " +
            "(`phosphorwayland`) mounts `QQuickWindow`s on top of " +
            "`zwlr_layer_shell_v1` surfaces; `LayerSurface` is the pure-Qt " +
            "wrapper that exposes layer / anchors / exclusive-zone / margins / " +
            "keyboard interactivity as `Q_PROPERTY`s. " +
            "`registerLayerShellPlugin()` is a header-only helper that sets the " +
            "QPA env var when a Wayland compositor is actually running. Split " +
            "out of the old `phosphor-shell` along with `phosphor-shaders`.",
        keyTypes: [
            { name: "LayerSurface",             purpose: "QObject wrapper around a zwlr_layer_shell_v1 surface; pure Qt API." },
            { name: "LayerSurfaceProps",        purpose: "Property keys used by LayerSurface ↔ QPA plugin communication." },
            { name: "registerLayerShellPlugin", purpose: "Header-only env-var setup before QGuiApplication." },
        ],
        deps: ["QtCore", "QtGui", "QtQuick", "wayland-client", "wlr-layer-shell-v1"],
        seeAlso: [
            { slug: "layer",   reason: "Policy layer (roles, per-screen registry, topology coordinator) on top." },
            { slug: "shaders", reason: "Sibling of the old phosphor-shell split — shader domain lives there." },
        ],
    },
    {
        slug: "layer",
        namespace: "PhosphorLayer",
        group: "Surfaces",
        oneLiner: "Layer-shell surface primitives: Surface, factory, registry, coordinator.",
        description:
            "Policy layer on top of `phosphor-wayland`. `Surface` is the per-" +
            "overlay wrapper; `SurfaceFactory` builds it with injected " +
            "`ILayerShellTransport`, `IQmlEngineProvider`, `IScreenProvider`, and " +
            "`ISurfaceAnimator`. `ScreenSurfaceRegistry<T>` tracks one-surface-per-" +
            "screen mappings; `TopologyCoordinator` debounces `screensChanged` and " +
            "reconciles. `defaults/` ships bundled implementations " +
            "(`PhosphorWaylandTransport`, `JsonSurfaceStore`, " +
            "`DefaultScreenProvider`, `NoOpSurfaceAnimator`, " +
            "`XdgToplevelTransport`) so composition roots wire the common case in " +
            "three lines.",
        keyTypes: [
            { name: "Surface",                  purpose: "Per-overlay wrapper around a layer-shell role." },
            { name: "SurfaceFactory",           purpose: "Stateless builder: SurfaceConfig → Surface." },
            { name: "Role",                     purpose: "Enum + metadata for well-known overlay roles." },
            { name: "ScreenSurfaceRegistry<T>", purpose: "Per-screen surface tracking (template)." },
            { name: "TopologyCoordinator",      purpose: "Debounces screensChanged; reconciles registry." },
            { name: "ILayerShellTransport",     purpose: "Adapter into the Wayland binding." },
            { name: "ISurfaceStore",            purpose: "Persistence of per-surface state across restarts." },
        ],
        deps: ["QtCore", "QtGui", "QtQml"],
        seeAlso: [
            { slug: "wayland",  reason: "Default transport binds to its LayerSurface." },
            { slug: "surfaces", reason: "Higher-level surface manager built on these primitives." },
        ],
    },
    {
        slug: "surfaces",
        namespace: "PhosphorSurfaces",
        group: "Surfaces",
        oneLiner: "Surface manager with QML loading and Vulkan wiring.",
        description:
            "Higher-level surface manager on top of `phosphor-layer`. Given a " +
            "`SurfaceConfig`, `SurfaceManager` warms up a QML scene synchronously " +
            "and rejects async QML load paths, so callers must pass `qrc:/` or " +
            "`file:/` URLs that resolve without a network hop. It creates the " +
            "layer-shell window, wires in a caller-owned or library-managed " +
            "`QVulkanInstance`, and hands back a `Surface*`. This is what app " +
            "code actually instantiates when it needs a zone overlay, a drag " +
            "ghost, or any layer-shell QML scene.",
        keyTypes: [
            { name: "SurfaceManager",       purpose: "Factory and owner for layer-shell surfaces." },
            { name: "SurfaceManagerConfig", purpose: "QML-engine, Vulkan, and pipeline-cache wiring." },
        ],
        deps: ["QtCore", "QtQuick", "QtQml"],
        seeAlso: [{ slug: "layer", reason: "Builds on Surface / SurfaceFactory / transport primitives." }],
    },
    {
        slug: "screens",
        namespace: "Phosphor::Screens",
        group: "Surfaces",
        oneLiner: "Physical and virtual screen topology resolver.",
        description:
            "The seam between \"here's a cursor position\" and \"here's the screen ID " +
            "you should route the next event to\". `Manager` tracks physical screens, " +
            "user-defined virtual sub-regions within them, and panel reservations via " +
            "a pluggable `IPanelSource` per desktop. `Resolver` maps a global point to " +
            "its effective screen and virtual screen. `Swapper` handles D-Bus-addressable " +
            "directional virtual-screen swaps. `DBusScreenAdaptor` exposes the whole " +
            "surface on the canonical `org.plasmazones.Screen` interface so downstream " +
            "consumers stay compositor-agnostic.",
        keyTypes: [
            { name: "Manager",           purpose: "Physical and virtual screen topology state with change signals." },
            { name: "Resolver",          purpose: "Point-to-screen lookup; accepts an optional D-Bus endpoint override." },
            { name: "IPanelSource",      purpose: "Pluggable panel-reservation source per desktop, such as Plasma, GNOME, or wlr." },
            { name: "VirtualScreen",     purpose: "One rectangular sub-region of a physical screen." },
            { name: "DBusScreenAdaptor", purpose: "Canonical `org.plasmazones.Screen` D-Bus surface." },
        ],
        deps: ["QtCore", "QtGui", "QtDBus"],
        seeAlso: [
            { slug: "identity", reason: "VirtualScreenId is the stable screen handle." },
            { slug: "protocol", reason: "Service / interface names come from ServiceConstants." },
        ],
    },
    {
        slug: "shortcuts",
        namespace: "PhosphorShortcuts",
        group: "Foundations",
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
        deps: ["QtCore", "QtGui"],
    },
    {
        slug: "audio",
        namespace: "PhosphorAudio",
        group: "Rendering",
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
        seeAlso: [{ slug: "shaders", reason: "Spectrum feeds shader UBOs through IUniformExtension." }],
    },
];
