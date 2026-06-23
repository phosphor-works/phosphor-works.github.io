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
    "Shell",
    "Services",
] as const;

export type LibraryGroup = (typeof LIBRARY_GROUPS)[number];

export interface Library {
    slug: string;                 // file-path slug (e.g. "layout-api")
    namespace: string;            // C++ namespace (e.g. "PhosphorZones").
                                  // Must match the real `namespace` in the
                                  // headers, not the include-dir name — they
                                  // diverge for phosphor-layout-api.
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
            { name: "enforceMinSizes",    purpose: "Grow zones to fit per-window minimums by stealing surplus from neighbours, then resolve overlap." },
            { name: "clampZonesToScreen", purpose: "Position-only clamp; shifts zones to stay on screen, sizes preserved." },
            { name: "removeRectOverlaps", purpose: "Resolve residual overlap between zones after min-size growth." },
            { name: "rectToJson",         purpose: "Canonical rect-string format for D-Bus + JSON roundtrip." },
        ],
        deps: ["QtCore"],
    },
    {
        slug: "dbus",
        namespace: "PhosphorDBus",
        group: "Foundations",
        oneLiner: "Generic, service-agnostic D-Bus client utilities.",
        description:
            "The generic D-Bus plumbing every consumer would otherwise " +
            "reimplement. `Client` is a copyable value type bound to a " +
            "`(connection, service, objectPath)` triple — `fireAndForget`, " +
            "`sendOneWay`, `asyncCall`, `syncCall`, `createCall` — that never " +
            "blocks the calling thread on wire introspection. " +
            "`HasDBusStreaming` is a compile-time check that catches a missing " +
            "`QDBusArgument` marshaller at build time instead of as a runtime " +
            "demarshalling crash. Knows nothing about Phosphor or PlasmaZones; " +
            "project-specific service names and wire types live one layer up " +
            "in phosphor-protocol.",
        keyTypes: [
            { name: "Client",           purpose: "Value-type method-call client bound to a connection / service / object-path triple." },
            { name: "HasDBusStreaming", purpose: "Compile-time check for QDBusArgument operator<< / operator>>." },
            { name: "lcPhosphorDBus",   purpose: "Default logging category for call-failure warnings." },
        ],
        deps: ["QtCore", "QtDBus"],
        seeAlso: [
            { slug: "protocol", reason: "The PlasmaZones contract layer builds on Client + HasDBusStreaming." },
        ],
    },
    {
        slug: "protocol",
        namespace: "PhosphorProtocol",
        group: "Foundations",
        oneLiner: "Shared D-Bus service names, wire types, and client helpers.",
        description:
            "The shared D-Bus surface a daemon, a compositor-side plugin such as a " +
            "KWin effect, and a settings UI all talk through. The " +
            "`PhosphorProtocol::Service` namespace centralises the canonical " +
            "`org.plasmazones.*` service and interface names. Per-interface " +
            "`*Types.h` headers own the QtCore-only enum and struct value " +
            "vocabulary (drag, window, zone, navigation, autotile, bridge); the " +
            "matching `*Marshalling.h` headers add the `QDBusArgument` operators " +
            "with a `HasDBusStreaming` build-time guard. `daemonClient()` and the " +
            "`ClientHelpers` namespace wrap the common async-call patterns so " +
            "callers aren't reimplementing `QDBusPendingCall` watcher boilerplate.",
        keyTypes: [
            { name: "PhosphorProtocol::Service", purpose: "Canonical org.plasmazones service name, object path, and interface-name constants." },
            { name: "registerWireTypes",         purpose: "One-shot QDBusArgument metatype registration for every wire struct; call once at startup." },
            { name: "daemonClient",              purpose: "Returns a PhosphorDBus::Client pre-bound to the org.plasmazones daemon." },
            { name: "ClientHelpers",             purpose: "Namespace of thin async / sync D-Bus call wrappers over the daemon client." },
        ],
        deps: ["QtCore", "QtDBus", "phosphor-dbus"],
        seeAlso: [
            { slug: "dbus", reason: "Generic D-Bus Client + HasDBusStreaming utilities this contract layer builds on." },
        ],
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
        deps: ["QtCore", "QtGui"],
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
            { name: "WatchedDirectorySet",      purpose: "Watcher + debounce + parent-watch + race-guard mechanism." },
            { name: "IScanStrategy",            purpose: "Pluggable enumerate/parse/commit policy." },
            { name: "DirectoryLoader",          purpose: "Flat `*.json` specialisation paired with `IDirectoryLoaderSink`." },
            { name: "MetadataPackScanStrategy", purpose: "Subdirectory-with-`metadata.json` scan strategy, templated on payload." },
            { name: "MetadataPackRegistryBase", purpose: "QObject base for registries hosting a `MetadataPackScanStrategy`." },
            { name: "ParsedEntry",              purpose: "Parse-result value type: source-path metadata plus a `std::any` payload." },
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
            "desktop wallpaper image path. Split out of the old `phosphor-shell`.",
        keyTypes: [
            { name: "BaseUniforms",          purpose: "std140 base UBO layout with two `appField` escape-hatch ints." },
            { name: "IUniformExtension",     purpose: "Contract for appending custom uniforms after the base UBO." },
            { name: "ShaderRegistry",        purpose: "Per-process shader-effect registry with hot-reload." },
            { name: "ShaderIncludeResolver", purpose: "`#include` expansion with depth limit." },
            { name: "IWallpaperProvider",    purpose: "DE-portable wallpaper image-path source." },
            { name: "CustomParamsKey",       purpose: "Canonical `customParams<N>_<x|y|z|w>` key format." },
        ],
        deps: ["QtCore", "QtGui", "phosphor-fsloader"],
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
        deps: ["QtCore", "QtGui", "QtQuick", "phosphor-shaders"],
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
        deps: ["QtCore", "QtGui", "QtQml", "QtQuick (optional, gated on PHOSPHOR_ANIMATION_QUICK)", "phosphor-fsloader", "phosphor-shaders", "phosphor-layer", "phosphor-rendering"],
        seeAlso: [
            { slug: "fsloader",  reason: "Profile, curve, and shader-pack discovery use its loaders." },
            { slug: "rendering", reason: "Host items consume the chosen effect's compiled shader." },
            { slug: "shaders",   reason: "Shares the metadata-pack scan strategy and IUniformExtension contract." },
        ],
    },
    {
        slug: "layout-api",
        // Include dir is PhosphorLayoutApi/ but the headers declare
        // `namespace PhosphorLayout` — Doxygen names the page after the
        // namespace (namespacePhosphorLayout.html).
        namespace: "PhosphorLayout",
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
        deps: ["QtCore"],
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
        deps: ["QtCore", "QtGui", "phosphor-layout-api", "phosphor-geometry", "phosphor-config", "phosphor-identity", "phosphor-screens"],
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
        oneLiner: "Tiling algorithms (Luau via pluau), the registry, and TilingState.",
        description:
            "The algorithm vocabulary and per-screen tiling state. " +
            "`TilingAlgorithm` is the base; `LuauTileAlgorithm` is the single " +
            "concrete implementation — every layout (binary-split, master-stack, " +
            "columns, spiral, …) ships as a `.luau` script in `data/algorithms/`, " +
            "written against the `pluau` standard library. There are no hard-coded " +
            "C++ geometry algorithms. `ScriptedAlgorithmLoader` discovers and " +
            "hot-reloads `*.luau` files; `AlgorithmRegistry` is the concrete " +
            "catalogue. The Luau host (read-only sandbox, watchdog, marshalling) " +
            "lives in `phosphor-scripting`. `TilingState` tracks per-screen window " +
            "order + master count + split tree and implements `IPlacementState`. " +
            "`AutotileLayoutSource` is the `ILayoutSource` adapter. The runtime " +
            "engine lives in `phosphor-tile-engine`.",
        keyTypes: [
            { name: "TilingAlgorithm",       purpose: "Abstract base; calculateZones(TilingParams) → QVector<QRect>." },
            { name: "LuauTileAlgorithm",     purpose: "The concrete TilingAlgorithm; delegates to a Luau script." },
            { name: "ScriptedAlgorithmLoader",purpose: "Discovers *.luau files, validates names, registers + hot-reloads them." },
            { name: "AlgorithmRegistry",     purpose: "Concrete catalogue of registered LuauTileAlgorithms." },
            { name: "TilingState",           purpose: "Per-screen state implementing IPlacementState." },
            { name: "AutotileLayoutSource",  purpose: "ILayoutSource adapter wrapping the registry." },
            { name: "AutotilePreviewRender", purpose: "Paint-a-thumbnail helper for the algorithm picker." },
        ],
        deps: ["QtCore", "phosphor-layout-api", "phosphor-engine", "phosphor-scripting", "phosphor-fsloader"],
        seeAlso: [
            { slug: "tile-engine", reason: "Runtime engine that drives algorithms in response to compositor events." },
            { slug: "zones",       reason: "Operates on Layout / Zone." },
        ],
    },
    {
        slug: "engine",
        namespace: "PhosphorEngine",
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
        deps: ["QtCore", "QtGui", "phosphor-geometry", "phosphor-identity"],
        seeAlso: [
            { slug: "snap-engine", reason: "SnapState implements IPlacementState for snap-mode." },
            { slug: "tile-engine", reason: "AutotileEngine drives autotile-mode through this surface." },
            { slug: "placement",   reason: "WindowTrackingService implements IWindowTrackingService over this surface." },
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
            "`LayoutRegistry`, `ZoneDetector`, and the shared engine " +
            "services; reaches into compositor-shadow state through narrow typed " +
            "interfaces (`INavigationStateProvider`, `IZoneAdjacencyResolver`) " +
            "the daemon's adaptors implement.",
        keyTypes: [
            { name: "SnapEngine",                  purpose: "Concrete IPlacementEngine for manual zone layouts." },
            { name: "SnapState",                   purpose: "Per-screen IPlacementState: zone assignments, pre-tile geometry." },
            { name: "ISnapSettings",               purpose: "Settings contract (declared in PhosphorEngine)." },
            { name: "INavigationStateProvider",    purpose: "Narrow read-only state contract the daemon implements." },
            { name: "IZoneAdjacencyResolver",      purpose: "Directional zone lookup contract the daemon implements." },
            { name: "SnapNavigationTargetResolver",purpose: "Pure compute for move/focus/swap/cycle/restore target geometries." },
        ],
        deps: ["QtCore", "QtGui", "phosphor-engine", "phosphor-zones", "phosphor-protocol", "phosphor-identity", "phosphor-screens"],
        seeAlso: [
            { slug: "engine",      reason: "Implements IPlacementEngine; reads its service contracts." },
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
            { name: "IAutotileSettings",      purpose: "Settings contract (declared in PhosphorEngine)." },
            { name: "NavigationController",   purpose: "Stateless helper for focus / swap / rotate / split-ratio." },
            { name: "OverflowManager",        purpose: "Per-screen tracking of auto-floated overflow windows." },
            { name: "PerScreenConfigResolver",purpose: "Per-screen override → global config resolution." },
        ],
        deps: ["QtCore", "phosphor-engine", "phosphor-tiles", "phosphor-zones", "phosphor-identity", "phosphor-screens"],
        seeAlso: [
            { slug: "tiles",       reason: "Algorithm vocabulary, Luau sandbox, TilingState." },
            { slug: "engine",      reason: "Implements IPlacementEngine; reads its service contracts." },
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
            "(`phosphorwayland`) mounts `QWindow`s on top of " +
            "`zwlr_layer_shell_v1` surfaces; `LayerSurface` is the pure-Qt " +
            "wrapper that exposes layer / anchors / exclusive-zone / margins / " +
            "keyboard interactivity as `Q_PROPERTY`s. " +
            "`registerLayerShellPlugin()` is a header-only helper that sets the " +
            "QPA env var when a Wayland compositor is actually running. Split " +
            "out of the old `phosphor-shell` along with `phosphor-shaders`.",
        keyTypes: [
            { name: "LayerSurface",             purpose: "QObject wrapper around a zwlr_layer_shell_v1 surface; pure Qt API." },
            { name: "registerLayerShellPlugin", purpose: "Header-only env-var setup before QGuiApplication." },
            { name: "ForeignToplevel",          purpose: "ext/wlr foreign-toplevel consumer for taskbars and window lists." },
            { name: "IdleNotifier",             purpose: "`ext-idle-notify-v1` wrapper for idle / active detection." },
            { name: "IdleInhibitor",            purpose: "`zwp-idle-inhibit-v1` wrapper to suppress idle while active." },
            { name: "LayerSurfaceProps",        purpose: "Property-key constants for LayerSurface ↔ QPA plugin communication." },
        ],
        deps: ["QtCore", "QtGui", "wayland-client", "wlr-layer-shell-v1"],
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
        deps: ["QtCore", "QtGui", "QtQml", "QtQuick", "phosphor-wayland"],
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
        deps: ["QtCore", "QtQuick", "phosphor-layer", "phosphor-shell-patterns"],
        seeAlso: [{ slug: "layer", reason: "Builds on Surface / SurfaceFactory / transport primitives." }],
    },
    {
        slug: "screens",
        namespace: "Phosphor::Screens",
        group: "Surfaces",
        oneLiner: "Physical and virtual screen topology resolver.",
        description:
            "The seam between \"here's a cursor position\" and \"here's the screen ID " +
            "you should route the next event to\". `ScreenManager` tracks physical " +
            "screens, user-defined virtual sub-regions within them, and panel " +
            "reservations via a pluggable `IPanelSource` per desktop. `ScreenResolver` " +
            "maps a global point to its effective screen and virtual screen. " +
            "`VirtualScreenSwapper` handles D-Bus-addressable " +
            "directional virtual-screen swaps. `DBusScreenAdaptor` exposes the whole " +
            "surface on the canonical `org.plasmazones.Screen` interface so downstream " +
            "consumers stay compositor-agnostic.",
        keyTypes: [
            { name: "ScreenManager",        purpose: "Physical and virtual screen topology state with change signals." },
            { name: "ScreenResolver",       purpose: "Point-to-screen lookup; accepts an optional D-Bus endpoint override." },
            { name: "VirtualScreenSwapper", purpose: "D-Bus-addressable directional virtual-screen swaps (left/right/up/down)." },
            { name: "IPanelSource",         purpose: "Pluggable panel-reservation source per desktop; the Plasma source ships built in." },
            { name: "DBusScreenAdaptor",    purpose: "Canonical `org.plasmazones.Screen` D-Bus surface." },
        ],
        deps: ["QtCore", "QtGui", "QtDBus", "phosphor-identity", "phosphor-protocol", "phosphor-wayland"],
        seeAlso: [
            { slug: "identity", reason: "VirtualScreenId is the stable screen handle." },
            { slug: "protocol", reason: "Service / interface names come from ServiceConstants." },
        ],
    },
    {
        slug: "shortcuts",
        // Headers declare the nested `namespace Phosphor::Shortcuts`;
        // [slug].astro mangles `::` to `_1_1` for the Doxygen page URL.
        namespace: "Phosphor::Shortcuts",
        group: "Foundations",
        oneLiner: "Pluggable global-shortcut backends.",
        description:
            "A `Registry` and `IBackend` pair. Client code registers shortcut IDs; " +
            "backends translate them into platform shortcut primitives. Ships with " +
            "a KGlobalAccel backend, an XDG Portal backend, and a D-Bus fallback.",
        keyTypes: [
            { name: "Registry",        purpose: "Client-facing API: bind / rebind / unbind shortcut ids with callbacks." },
            { name: "IBackend",        purpose: "Abstract backend; shipped impls are KGlobalAccel, XDG-Portal, and D-Bus." },
            { name: "IAdhocRegistrar", purpose: "Transient binding (Phosphor::Shortcuts::Integration) that skips persistent storage." },
            { name: "createBackend",   purpose: "Factory free function: builds the right IBackend from a BackendHint." },
            { name: "BackendHint",     purpose: "Enum selecting or auto-detecting the backend (Auto / KGlobalAccel / Portal / DBus)." },
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
    {
        slug: "workspaces",
        namespace: "PhosphorWorkspaces",
        group: "Foundations",
        oneLiner: "Virtual desktop and activity tracking.",
        description:
            "Compositors and window managers need to know which virtual desktop " +
            "or activity is active and react to switches. `VirtualDesktopManager` " +
            "tracks KWin virtual desktops via D-Bus: current desktop, count, " +
            "names, and UUID mapping. `ActivityManager` tracks KDE Activities " +
            "via KActivities or PlasmaActivities as an optional compile-time " +
            "dependency. Any consumer that needs workspace awareness links the " +
            "library directly, independently of the PlasmaZones daemon.",
        keyTypes: [
            { name: "VirtualDesktopManager", purpose: "KWin virtual-desktop state: current, count, names, UUID mapping." },
            { name: "ActivityManager",       purpose: "KDE Activities state via KActivities or PlasmaActivities (optional)." },
        ],
        deps: ["QtCore", "QtDBus", "phosphor-engine", "KF6Activities (optional)"],
        seeAlso: [
            { slug: "engine", reason: "ActivityManager and VirtualDesktopManager implement engine-side workspace contracts." },
        ],
    },
    {
        slug: "placement",
        namespace: "PhosphorPlacement",
        group: "Engines",
        oneLiner: "Window-zone tracking, floating state, auto-snap, and resnap.",
        description:
            "Core business logic for zone-based window management. Tracks which " +
            "windows are in which zones, handles floating and unfloating, " +
            "auto-snaps new windows to their last-used zone, resnaps when " +
            "layouts or screens change, rotates windows between zones, and " +
            "answers empty-zone queries for snap-assist. The daemon owns a " +
            "`WindowTrackingService` instance and exposes it over D-Bus, so any " +
            "compositor plugin gets this logic without linking the library. The " +
            "daemon decides, the plugin applies.",
        keyTypes: [
            { name: "WindowTrackingService", purpose: "Zone assignments, floating state, auto-snap, resnap, rotation." },
            { name: "IGeometryResolver",     purpose: "Interface a consumer implements to resolve gaps and padding for the active screen." },
            { name: "PlacementConfig",       purpose: "Value struct for runtime config; replaces direct ISettings coupling." },
        ],
        deps: ["QtCore", "QtGui", "phosphor-engine", "phosphor-snap-engine", "phosphor-zones", "phosphor-protocol", "phosphor-screens", "phosphor-workspaces", "phosphor-identity", "phosphor-layout-api"],
        seeAlso: [
            { slug: "engine",      reason: "Implements IWindowTrackingService and related engine service contracts." },
            { slug: "snap-engine", reason: "Reads WindowTrackingService for manual-mode placement decisions." },
            { slug: "tile-engine", reason: "Reads WindowTrackingService for autotile placement decisions." },
        ],
    },
    {
        slug: "overlay",
        namespace: "PhosphorOverlay",
        group: "Shell",
        oneLiner: "Per-screen layer-shell shell hosts with named slot vocabulary.",
        description:
            "Helper layer on top of `phosphor-layer`, `phosphor-surfaces`, and " +
            "`phosphor-animation`. Given a consumer-provided surface factory, " +
            "`ShellHost` owns the per-screen layer-shell shell lifecycle " +
            "(create, destroy, rekey), the slot map keyed by consumer-chosen " +
            "slot names, animator-driven slot hides, and per-role animator " +
            "config registration. Knows nothing about zones, layouts, or " +
            "specific content; consumers wire their own slot vocabulary " +
            "through callbacks.",
        keyTypes: [
            { name: "ShellHost",             purpose: "Per-screen ShellState map, lifecycle, and animator wiring." },
            { name: "ShellState",            purpose: "One screen's layer-shell surface, QQuickWindow, physical screen, and slot map." },
            { name: "SlotEntry",             purpose: "One slot: QPointer<QQuickItem> + PhosphorLayer::Role." },
            { name: "makePerInstanceRole()", purpose: "Build a per-instance Role by appending screenId and generation to a scope prefix." },
        ],
        deps: ["QtCore", "QtQuick", "phosphor-layer", "phosphor-shell-patterns", "phosphor-surfaces", "phosphor-animation", "phosphor-screens"],
        seeAlso: [
            { slug: "layer",     reason: "Owns the Role vocabulary ShellHost composes from." },
            { slug: "surfaces",  reason: "Surface and SurfaceFactory primitives ShellHost coordinates." },
            { slug: "animation", reason: "Slot hides drive animators from this library's profile registry." },
        ],
    },
    {
        slug: "shell-patterns",
        namespace: "PhosphorShellPatterns",
        group: "Shell",
        oneLiner: "Named UI-pattern recipes on top of phosphor-layer Role.",
        description:
            "The axis-2 vocabulary between wlr-layer-shell wire primitives in " +
            "`phosphor-layer` and consumer-side application roles. " +
            "`phosphor-layer` exposes domain-agnostic Role bundles of layer, " +
            "anchors, exclusive zone, and keyboard interactivity; this library " +
            "names the UI patterns a shell wants (a wallpaper, a panel, a " +
            "modal, a toast) as ready-to-use Role values, so consumers compose " +
            "their public roles from named recipes instead of re-deriving the " +
            "combo each time. Any Phosphor shell links this; PlasmaZones today, " +
            "Phosphor-as-standalone tomorrow.",
        keyTypes: [
            { name: "Wallpaper", purpose: "Background-layer Role preset: all anchors, exclusive zone 0, no keyboard." },
            { name: "Panel",     purpose: "Edge-anchored Role factory reserving space via exclusive zone; takes an Edge." },
            { name: "Modal",     purpose: "Top-layer keyboard-grabbing Role preset for modal dialogs." },
            { name: "Toast",     purpose: "Corner-anchored click-through Role factory; takes a Corner." },
            { name: "Hud",       purpose: "Overlay-layer click-through Role preset for drag indicators and highlights." },
            { name: "Floating",  purpose: "Overlay-layer no-anchor Role preset; consumer supplies the position." },
        ],
        deps: ["QtCore", "QtGui", "phosphor-layer"],
        seeAlso: [
            { slug: "layer",   reason: "Provides the Role primitive these recipes compose." },
            { slug: "overlay", reason: "ShellHost uses these patterns when consumers don't supply a custom Role." },
        ],
    },
    {
        slug: "compositor",
        namespace: "PhosphorCompositor",
        group: "Surfaces",
        oneLiner: "Compositor-plugin SDK — the plugin side of the daemon / plugin split.",
        description:
            "PlasmaZones splits into a daemon that owns placement logic and a " +
            "compositor plugin that observes windows and applies geometry. " +
            "This library is the plugin side of that split. A plugin links " +
            "`PhosphorCompositor`, implements `ICompositorBridge` to map " +
            "native window handles to the daemon's vocabulary, wires the " +
            "handler interfaces for drag and geometry callbacks, and lets " +
            "`DaemonClient` manage all D-Bus communication.",
        keyTypes: [
            { name: "ICompositorBridge", purpose: "Interface a plugin implements for window lookup, identity, properties, filtering, and actions." },
            { name: "DaemonClient",      purpose: "Typed D-Bus client: registration, service watching, reconnection, method calls, signal dispatch." },
            { name: "IDragHandler",      purpose: "Callback contract for drag start, move, end, and policy-change events from the daemon." },
            { name: "IGeometryHandler",  purpose: "Callback contract for geometry apply, batch operations, raise, and activate." },
        ],
        deps: ["QtCore", "QtGui", "QtDBus", "phosphor-protocol", "phosphor-identity", "phosphor-animation"],
        seeAlso: [
            { slug: "protocol", reason: "Wire-level D-Bus paths and service names live there." },
            { slug: "engine",   reason: "Daemon-side service contracts the plugin invokes through DaemonClient." },
        ],
    },
    {
        slug: "shell",
        namespace: "PhosphorShell",
        group: "Shell",
        oneLiner: "Quickshell-style declarative QML framework for layer-shell desktop shells.",
        description:
            "The infrastructure layer between `phosphor-wayland` / " +
            "`phosphor-layer` and the consumer QML config that describes " +
            "what the shell should look like. A shell binary constructs a " +
            "`ShellEngine`, points it at an XDG config tree, and the engine " +
            "instantiates the user's QML which declares `PanelWindow`, " +
            "`PopupWindow`, and friends. Each window type creates the " +
            "appropriate layer-shell surface through `phosphor-layer` " +
            "underneath, so the QML author writes panels without touching " +
            "wlr-protocol primitives. API mirrors Quickshell where it " +
            "matters so existing configs port with minimal rework.",
        keyTypes: [
            { name: "ShellEngine",         purpose: "Top-level lifecycle: QML engine, config discovery, reload." },
            { name: "ShellLoader",         purpose: "Discovers and loads the user's QML config from XDG paths." },
            { name: "PanelWindow",         purpose: "Layer-shell-backed panel window with edge anchoring and exclusive zone." },
            { name: "PopupWindow",         purpose: "Top-layer popup with optional keyboard grab and parent anchoring." },
            { name: "Variants",            purpose: "Lazy per-screen instantiation of declarative content." },
            { name: "PersistentProperties",purpose: "QML-friendly persistence of property values across launches." },
            { name: "Process",             purpose: "Sandboxed subprocess runner exposed to QML." },
            { name: "Toplevels",           purpose: "`ext-foreign-toplevel-list-v1` consumer for taskbars and window lists." },
        ],
        deps: ["QtCore", "QtGui", "QtQuick", "QtQml", "phosphor-layer", "phosphor-rendering", "phosphor-shaders", "phosphor-wayland"],
        seeAlso: [
            { slug: "service-sni",    reason: "System tray host and dbusmenu the shell renders." },
            { slug: "layer",          reason: "Role vocabulary the window types compose from." },
            { slug: "shell-patterns", reason: "Named Role recipes the panels use." },
        ],
    },
    {
        slug: "registry",
        namespace: "PhosphorRegistry",
        group: "Foundations",
        oneLiner: "Factory-by-name registry and plugin loader for shell extension seams.",
        description:
            "Generalises the per-domain registry pattern into one `Registry<T>` " +
            "template the shell instantiates once per UI seam: bar widgets, " +
            "control-center tiles, launcher providers, OSDs, and desktop widgets. " +
            "Built-ins register explicitly at the composition root, with no " +
            "static-init magic. It also owns the plugin path, scanning `.so` plus " +
            "`manifest.json` bundles under `~/.local/share/phosphor/plugins/`, " +
            "validating their ABI, and hot-reloading them on disk change.",
        keyTypes: [
            { name: "Registry<T>",  purpose: "Template registry of `T` factories keyed by `T::id()`, one per composition root." },
            { name: "IFactoryBase", purpose: "Common base for the factory families; declares `id()`, `displayName()`, `capabilities()`." },
            { name: "PluginLoader", purpose: "Scans a plugin root, loads each `.so` plus manifest, and hot-reloads on disk change." },
            { name: "Manifest",     purpose: "POD mirror of `manifest.json`; `parse()` validates ABI version and required fields." },
        ],
        deps: ["QtCore", "QtQml", "phosphor-fsloader"],
        seeAlso: [
            { slug: "ipc", reason: "Sibling shell-wide seam wired at the composition root." },
        ],
    },
    {
        slug: "ipc",
        namespace: "PhosphorIpc",
        group: "Foundations",
        oneLiner: "Typed JSON-over-Unix-socket invocation channel for the shell.",
        description:
            "Lets compositor keybinds, scripts, and other shells drive Phosphor " +
            "actions by verb, for example `phosphorctl call launcher.toggle`. It " +
            "runs alongside the D-Bus adaptors rather than replacing them. The " +
            "`IpcRouter` listens on `$XDG_RUNTIME_DIR/phosphor.sock`, registers " +
            "`QObject` targets by name, derives JSON schemas from their " +
            "`QMetaObject`, and routes calls and broadcast events to subscribers. " +
            "Plugin authors declare `IpcTarget` QML elements, and the `phosphorctl` " +
            "CLI provides `call`, `list`, `schema`, and `subscribe`.",
        keyTypes: [
            { name: "IpcRouter",          purpose: "Per-application dispatcher owning one `QLocalServer`, the target registry, and subscriptions." },
            { name: "IpcTarget",          purpose: "QML element binding one target name; declared functions become callable, `emitEvent` pushes events." },
            { name: "IpcProtocol",        purpose: "NDJSON wire format plus parser, shared between server and the `phosphorctl` client." },
            { name: "IpcSchemaGenerator", purpose: "Converts a `QMetaObject` into JSON Schema for schema responses and arg validation." },
        ],
        deps: ["QtCore", "QtQml", "QtNetwork"],
        seeAlso: [
            { slug: "registry", reason: "Sibling shell-wide seam wired at the composition root." },
        ],
    },
    {
        slug: "scripting",
        namespace: "PhosphorScripting",
        group: "Foundations",
        oneLiner: "Generic sandboxed Luau host with CPU and heap guards.",
        description:
            "A domain-agnostic Luau host that owns VM lifecycle, `luaL_sandbox`, a " +
            "CPU-time watchdog, a per-engine heap cap, bytecode compile and load, " +
            "and a `QVariant`-to-Lua marshalling layer. It knows nothing about " +
            "tiling or any other domain, so each domain binding stays small. " +
            "`LuauEngine` exposes an entirely `QVariant`-based surface and never " +
            "lets `lua_State` cross the library boundary, while a shared " +
            "`LuauWatchdog` bounds CPU time and a capped allocator (64 MiB default) " +
            "turns a runaway script into a catchable error.",
        keyTypes: [
            { name: "LuauEngine",   purpose: "The sandboxed VM with a `QVariant`-only API (init / runPrelude / sandbox / callModule)." },
            { name: "LuauWatchdog", purpose: "Shared CPU-deadline supervisor that aborts runaway scripts; one can serve many engines." },
        ],
        deps: ["QtCore"],
        seeAlso: [
            { slug: "tiles", reason: "The first domain binding: phosphor-tiles embeds this host for Luau autotile algorithms." },
        ],
    },
    {
        slug: "context-resolver",
        // Include dir is phosphor-context-resolver but the headers declare
        // `namespace PhosphorContext` — Doxygen names the page after the
        // namespace (namespacePhosphorContext.html).
        namespace: "PhosphorContext",
        group: "Foundations",
        oneLiner: "Frozen-snapshot gate over the mode, desktop, and activity cascade.",
        description:
            "Names one primitive for a cascade every gating site used to inline: " +
            "read the screen's mode, the current virtual desktop, and the current " +
            "activity, then ask whether that tuple is disabled or locked. " +
            "`ContextHandle` freezes `(screenId, virtualDesktop, activity, mode)` at " +
            "construction so downstream gates answer against one consistent tuple. " +
            "It is read-only, with no Gui, QML, or D-Bus dependency, and preserves " +
            "the historical monitor-over-desktop-over-activity policy.",
        keyTypes: [
            { name: "ContextHandle",     purpose: "Frozen `(screenId, virtualDesktop, activity, mode)` snapshot passed to every gate call." },
            { name: "IContextResolver",  purpose: "Façade exposing `handleFor()`, `disabledReason()`, `isLocked()`, `isGated()`." },
            { name: "ContextResolver",   purpose: "Concrete resolver composing the cascade over borrowed adapter pointers; owns no state." },
            { name: "DisabledReason",    purpose: "Enum of why a context is off (monitor / desktop / activity disabled, or not)." },
        ],
        deps: ["QtCore", "phosphor-zones"],
        seeAlso: [
            { slug: "window-rules", reason: "The resolver defers rule-priority math to the window-rules engine." },
        ],
    },
    {
        slug: "window-rules",
        namespace: "PhosphorWindowRules",
        group: "Engines",
        oneLiner: "Unified window/context rule engine with one match language and cache.",
        description:
            "Phosphor's single window-rule engine: one composable match-expression " +
            "language, one pluggable action set, one serialization format, and one " +
            "evaluation pipeline with a match cache. Both the KWin effect and the " +
            "daemon link this one implementation so match code lives in exactly one " +
            "place. `RuleEvaluator::resolve()` walks the rule set in descending " +
            "priority and accumulates the first action that fills each slot, and " +
            "`WindowRuleSet` reads and writes `windowrules.json` at a fixed schema " +
            "version, dropping malformed rules with a diagnostic.",
        keyTypes: [
            { name: "WindowRule",      purpose: "A single rule: `{ id, name, enabled, priority, match, actions }`." },
            { name: "MatchExpression", purpose: "Composable leaf/composite predicate tree with JSON serialization and cached regex." },
            { name: "RuleEvaluator",   purpose: "Descending-priority resolution into `ResolvedActions`, backed by a match cache." },
            { name: "WindowRuleSet",   purpose: "Ordered rule collection with a monotonic revision and `windowrules.json` I/O." },
        ],
        deps: ["QtCore", "phosphor-protocol", "phosphor-identity", "phosphor-fsloader"],
        seeAlso: [
            { slug: "context-resolver", reason: "Owns the mode/desktop/activity gate the rules build on." },
        ],
    },
    {
        slug: "theme",
        namespace: "PhosphorTheme",
        group: "Rendering",
        oneLiner: "Active design-token store with hot reload and matugen retint.",
        description:
            "The live design-token store shells bind colors through instead of " +
            "literals. `PaletteStore` keeps one token map per engine, shipping the " +
            "canonical dark palette as its default and merging three input paths " +
            "into the same map: JSON file load with a watcher, in-process " +
            "`applyTokens()` pushes, and matugen subprocess output. It covers " +
            "Material 3, ANSI 16, and brand-gradient tokens, exposes them through " +
            "the `Phosphor.Theme` QML module and the `IThemeService` C++ surface, " +
            "and renders `{{token}}` templates so external apps can be themed from " +
            "the same palette. It is a leaf library with no Phosphor dependencies.",
        keyTypes: [
            { name: "PaletteStore",   purpose: "Concrete `IThemeService` with dark defaults, JSON parsing, file watching, QML singleton." },
            { name: "IThemeService",  purpose: "Abstract service: `palette()`, `token()`, `loadFromFile()`, `applyTokens()`, `resetToDefaults()`." },
            { name: "MatugenRunner",  purpose: "`QProcess` wrapper around matugen; emits `paletteReady(tokens, wallpaper)` / `failed`." },
            { name: "TemplateEngine", purpose: "Static renderer for `{{token[.field]}}` substitution with hex/rgb/channel variants." },
        ],
        deps: ["QtCore", "QtGui", "QtQml"],
        seeAlso: [
            { slug: "popout", reason: "Popout animations bind Theme motion tokens." },
        ],
    },
    {
        slug: "popout",
        namespace: "PhosphorPopout",
        group: "Surfaces",
        oneLiner: "Central arbiter for transient popout lifetime, focus, and exclusivity.",
        description:
            "The single coordinator every transient surface routes through: control " +
            "center, launcher, calendar, notification history, OSDs, and tray menus. " +
            "Centralising layer-shell creation, focus arbitration, screen affinity, " +
            "exclusive zones, and dismiss-on-focus-loss avoids two popups fighting " +
            "over a Wayland grab. The arbitration state machine lives in " +
            "`PopoutController`, while surface creation hides behind an injected " +
            "`IPopoutTransport` so it tests as pure logic. One `open` entry point " +
            "resolves three exclusivity modes (Cooperative, Modal, Detached) and " +
            "returns opaque handles.",
        keyTypes: [
            { name: "PopoutController", purpose: "Concrete `IPopoutService` owning the arbitration state machine; delegates surface creation." },
            { name: "IPopoutService",   purpose: "Abstract service: `open`, `close`, `toggle`, `isOpen`, `closeAll`." },
            { name: "IPopoutTransport", purpose: "Transport seam that creates, tears down, and tracks layer-shell surfaces." },
            { name: "PopoutRequest",    purpose: "Value type describing a popout to open (id, content, screen, anchor, exclusivity, scope)." },
        ],
        deps: ["QtCore", "QtGui", "QtQml"],
        seeAlso: [
            { slug: "theme", reason: "Popout animations bind Theme motion tokens." },
            { slug: "layer", reason: "Transient surfaces are layer-shell surfaces created through phosphor-layer." },
        ],
    },
    {
        slug: "control",
        namespace: "PhosphorControl",
        group: "Shell",
        oneLiner: "Reusable Qt6/QML/Kirigami settings-app framework.",
        description:
            "The framework a Phosphor settings application is built on: the window " +
            "chrome plus the orchestration, so each consumer writes only its own " +
            "page controllers and QML pages. Each page is backed by a " +
            "`StagingDomain` that holds the user's pending edits, and " +
            "`ApplicationController` owns the page registry and domains, recomputes " +
            "a global dirty flag, and drives batched `applyAll` / `discardAll` as " +
            "one transaction. `SearchController` builds a ranked, typo-tolerant " +
            "search index from the page registry and registered providers, and a " +
            "QML module ships the `SettingsAppWindow`, sidebar, breadcrumbs, and " +
            "unsaved-changes chrome wired to those controllers. `DBusBridge` wraps " +
            "a configured endpoint for daemon calls.",
        keyTypes: [
            { name: "ApplicationController", purpose: "Top-level orchestrator: page registry, staging domains, global dirty flag, batched apply/discard." },
            { name: "StagingDomain",         purpose: "Abstract unit of staged edits: `isDirty()`, `apply()`, `discard()`, `resetToDefaults()`, with async result signals." },
            { name: "PageRegistry",          purpose: "Tree-structured catalogue of registered pages driving the sidebar and breadcrumbs." },
            { name: "SearchController",       purpose: "Ranked, typo-tolerant settings search over pages, authored anchors, and dynamic providers." },
        ],
        deps: ["QtCore", "QtDBus", "QtGui", "QtQml", "QtQuick"],
        seeAlso: [
            { slug: "ipc", reason: "A second way the shell exposes actions, over a socket verb channel." },
        ],
    },
    {
        slug: "service-bluetooth",
        namespace: "PhosphorServiceBluetooth",
        group: "Services",
        oneLiner: "BlueZ adapter and device state with device pairing.",
        description:
            "Exposes the system-bus `org.bluez` surface as Qt and QML types: " +
            "per-adapter power and discovery state, per-device pairing and " +
            "connection state, and the pairing agent. It is a D-Bus client built on " +
            "the `phosphor-dbus` client and ObjectManager helpers, tracking adapters " +
            "and devices with live `PropertiesChanged` updates. Writes are async and " +
            "non-optimistic, so cached state only moves once BlueZ echoes the change " +
            "back. A shell binds the adapter and device models to render toggles and " +
            "lists, and wires a pairing dialog to `BluetoothAgent`.",
        keyTypes: [
            { name: "BluetoothHost",        purpose: "Owns the adapter and device sets via an ObjectManager observer and registers the pairing agent." },
            { name: "BluetoothDevice",      purpose: "One `org.bluez.Device1` with pairing/connection state and connect/pair/trust controls." },
            { name: "BluetoothDeviceModel", purpose: "`QAbstractListModel` over the host's devices, optionally scoped to one adapter." },
            { name: "BluetoothAgent",       purpose: "`org.bluez.Agent1` pairing agent emitting PIN/passkey/confirmation requests." },
        ],
        deps: ["QtCore", "QtQml", "QtDBus", "phosphor-dbus"],
        seeAlso: [
            { slug: "dbus", reason: "Built on the shared D-Bus client and ObjectManager helpers." },
        ],
    },
    {
        slug: "service-brightness",
        namespace: "PhosphorServiceBrightness",
        group: "Services",
        oneLiner: "Display and keyboard backlight brightness control.",
        description:
            "Surfaces brightness-controllable backlights as Qt and QML types: " +
            "display panels under `/sys/class/backlight`, keyboard backlights under " +
            "`/sys/class/leds`, and external monitors over DDC/CI. Internal panels " +
            "read from sysfs and write through logind's `Session.SetBrightness`, so " +
            "no root or udev rule is needed, and writes are non-optimistic. A shell " +
            "binds the device model to render a brightness slider or OSD. " +
            "External-monitor support is a compile-time option via `libddcutil` on a " +
            "worker thread.",
        keyTypes: [
            { name: "BrightnessHost",        purpose: "Enumerates backlight devices, resolves the logind session for writes, optionally adds DDC/CI monitors." },
            { name: "BrightnessDevice",      purpose: "One backlight or external monitor with `kind`, `brightness`, `percentage`, and setters." },
            { name: "BrightnessDeviceModel", purpose: "`QAbstractListModel` over the host's devices, tracking async add/remove." },
        ],
        deps: ["QtCore", "QtQml", "QtDBus", "phosphor-dbus"],
        seeAlso: [
            { slug: "service-session", reason: "Both rely on logind, and brightness writes go through the session." },
        ],
    },
    {
        slug: "service-clipboard",
        namespace: "PhosphorServiceClipboard",
        group: "Services",
        oneLiner: "De-duplicated, persistent clipboard history.",
        description:
            "Watches the session clipboard, keeps a de-duplicated and capped " +
            "on-disk history, and re-applies any entry. It is the policy and " +
            "persistence layer over `phosphor-wayland`'s `ClipboardDevice` (a " +
            "`wlr-data-control` client), composed privately so no Wayland types leak " +
            "out. Selections are read off a pipe so a slow producer never blocks the " +
            "UI, and entries carrying a password-manager sensitivity hint are " +
            "dropped before they are read. A shell binds the `history` model to " +
            "render a picker and calls `copy(index)` to re-apply.",
        keyTypes: [
            { name: "ClipboardService", purpose: "The history host: `history` model, `count`, `copy(index)` to re-apply, `remove`/`clear` to prune." },
        ],
        deps: ["QtCore", "QtQml", "phosphor-wayland"],
        seeAlso: [
            { slug: "wayland",      reason: "Composes the wlr-data-control ClipboardDevice primitive." },
            { slug: "service-idle", reason: "Sibling policy layer over a phosphor-wayland primitive." },
        ],
    },
    {
        slug: "service-icontheme",
        namespace: "PhosphorServiceIconTheme",
        group: "Services",
        oneLiner: "XDG icon-theme lookup and a QML image provider.",
        description:
            "Implements XDG Icon Theme Specification lookup and the Qt image " +
            "provider that lets QML consume the resulting `QImage` payloads through " +
            "a `QUrl`. `IconThemeResolver` detects the active theme, parses each " +
            "theme's `index.theme`, follows `Inherits=` chains, falls back to " +
            "Hicolor, and returns the best match by the spec's distance algorithm. " +
            "`IconImageProvider` is mounted at `image://phosphor-service-icontheme/` " +
            "so a publisher such as a tray-item model can route raw icon blobs to " +
            "QML.",
        keyTypes: [
            { name: "IconThemeResolver", purpose: "Singleton XDG resolver: `iconForName(name, size, scale)` plus a `decodePixmaps` helper." },
            { name: "IconImageProvider", purpose: "`QQuickImageProvider` with a process-global registry; `setImage` / `clearImage` from publishers." },
        ],
        deps: ["QtCore", "QtGui", "QtQml", "QtQuick"],
        seeAlso: [
            { slug: "service-sni", reason: "Resolves themed tray icons and routes IconPixmap blobs to QML." },
        ],
    },
    {
        slug: "service-idle",
        namespace: "PhosphorServiceIdle",
        group: "Services",
        oneLiner: "Multi-stage Wayland idle monitoring and inhibition.",
        description:
            "Watches the session for inactivity through a configurable timeout " +
            "ladder and reference-counts idle inhibition. It is the policy layer " +
            "over `phosphor-wayland`'s `IdleNotifier` (`ext-idle-notify-v1`) and " +
            "`IdleInhibitor` (`zwp-idle-inhibit-v1`), composed privately. It ships " +
            "no default stages, so the shell maps each stage to an action such as " +
            "dim, lock, or display-off. Stages fire in ascending-timeout order, the first " +
            "activity resets the ladder, and held inhibit cookies disarm it.",
        keyTypes: [
            { name: "IdleService", purpose: "The idle host: configures `stages`, reports `currentStage` / `idle`, ref-counts `inhibit` / `release`." },
        ],
        deps: ["QtCore", "QtQml", "phosphor-wayland"],
        seeAlso: [
            { slug: "wayland",      reason: "Composes the IdleNotifier and IdleInhibitor primitives." },
            { slug: "service-lock", reason: "A sibling that maps an idle stage to a session lock." },
        ],
    },
    {
        slug: "service-lock",
        namespace: "PhosphorServiceLock",
        group: "Services",
        oneLiner: "PAM authentication and Wayland session-lock lifecycle.",
        description:
            "Authenticates the session user through PAM and coordinates the " +
            "`ext-session-lock-v1` lock state with the compositor. It is the " +
            "state-machine layer over `phosphor-wayland`'s `SessionLock` client and " +
            "a PAM backend, both composed privately. PAM transactions run off the " +
            "GUI thread one at a time, and the password is wiped after use and never " +
            "logged. A lock surface drives `LockService`: `lock()` asks the " +
            "compositor to lock and `unlock(password)` authenticates and releases it.",
        keyTypes: [
            { name: "LockService",     purpose: "Drives the Unlocked → Locking → Locked → Authenticating state machine; `lock` / `unlock`." },
            { name: "PamAuthenticator", purpose: "Standalone credential check: `authenticate(user, password)` runs PAM off the GUI thread." },
        ],
        deps: ["QtCore", "QtQml", "phosphor-wayland"],
        seeAlso: [
            { slug: "wayland",      reason: "Composes the SessionLock primitive." },
            { slug: "service-idle", reason: "Can drive `lock()` when an idle stage fires." },
        ],
    },
    {
        slug: "service-mpris",
        namespace: "PhosphorServiceMpris",
        group: "Services",
        oneLiner: "MPRIS2 media-player discovery, status, and transport control.",
        description:
            "Watches the session bus for MPRIS2 players, surfaces their identity, " +
            "track metadata, and playback state, and forwards transport controls. " +
            "Player discovery follows `NameOwnerChanged`, property updates ride " +
            "`PropertiesChanged`, and every fetch goes through a pending-call watcher " +
            "so the GUI thread never blocks on a slow player. A shell binds the " +
            "`MprisPlayerModel` to render a now-playing card or media pop-out and " +
            "calls the per-player transport invokables.",
        keyTypes: [
            { name: "MprisHost",       purpose: "Watches the bus for `org.mpris.MediaPlayer2.*`, owns the live player set, emits add/remove." },
            { name: "MprisPlayer",     purpose: "One player: identity, metadata, state, position, and play/pause/next/seek invokables." },
            { name: "MprisPlayerModel", purpose: "`QAbstractListModel` over the host with identity / state / title / artist / art roles." },
        ],
        deps: ["QtCore", "QtQml", "QtDBus"],
        seeAlso: [
            { slug: "service-icontheme", reason: "Resolves themed icons for media art." },
        ],
    },
    {
        slug: "service-network",
        namespace: "PhosphorServiceNetwork",
        group: "Services",
        oneLiner: "NetworkManager device and connectivity state.",
        description:
            "Exposes the system-bus `org.freedesktop.NetworkManager` surface as Qt " +
            "and QML types: per-device type and state, the global connectivity " +
            "level, and the networking and Wi-Fi radio toggles. It is a D-Bus client " +
            "on the `phosphor-dbus` client helper with no UI of its own. Alongside " +
            "the read surface it offers a small write path: toggle Wi-Fi, trigger a " +
            "scan, and activate connections. A shell binds the host and device model " +
            "to render a connectivity icon or an access-point picker.",
        keyTypes: [
            { name: "NetworkHost",        purpose: "Owns the device set and manager state; `connectivity`, radio toggles, `scanWifi()`." },
            { name: "NetworkDevice",      purpose: "One `Device`: `interfaceName`, `deviceType`, `state`, `managed`." },
            { name: "AccessPoint",        purpose: "One Wi-Fi access point: `ssid`, `strength`, `frequency`, `security`." },
            { name: "NetworkDeviceModel", purpose: "`QAbstractListModel` over the host's devices for QML." },
        ],
        deps: ["QtCore", "QtQml", "QtDBus", "phosphor-dbus"],
        seeAlso: [
            { slug: "service-upower", reason: "Sibling system-bus readout service with the same host/device/model shape." },
        ],
    },
    {
        slug: "service-notifications",
        namespace: "PhosphorServiceNotifications",
        group: "Services",
        oneLiner: "Freedesktop notification server and live history.",
        description:
            "The notification daemon. It acquires `org.freedesktop.Notifications` " +
            "on the session bus and answers the Desktop Notifications Specification " +
            "methods and signals rather than being a client of one. It owns the full " +
            "lifecycle: id allocation, `replaces_id` reuse, per-urgency expiry, " +
            "dismissal, action invocation, and close-reason bookkeeping. Each " +
            "request decodes into a typed `Notification`, and the live set surfaces " +
            "through a `NotificationModel` for a shell to render as toasts or a " +
            "notification center.",
        keyTypes: [
            { name: "NotificationServer", purpose: "Owns the bus name and lifecycle; `dismissNotification` / `invokeAction` are invokable for a UI." },
            { name: "Notification",       purpose: "One decoded live notification (summary, body, actions, urgency, image), mutated on `replaces_id`." },
            { name: "NotificationModel",  purpose: "`QAbstractListModel` over a server's live notifications; rows track add / replace / close." },
        ],
        deps: ["QtCore", "QtQml", "QtDBus", "QtGui", "phosphor-service-icontheme"],
        seeAlso: [
            { slug: "service-icontheme", reason: "Resolves notification image and icon paths." },
        ],
    },
    {
        slug: "service-pipewire",
        namespace: "PhosphorServicePipeWire",
        group: "Services",
        oneLiner: "Native PipeWire mixer for sinks, sources, and streams.",
        description:
            "Owns the PipeWire main loop on a dedicated thread, walks the registry, " +
            "and surfaces sinks, sources, and per-app streams as Qt and QML types " +
            "with default-node switching, volume, and mute. All cross-thread " +
            "plumbing hides behind queued signals, so consumers see a pure " +
            "GUI-thread API. The public headers are libpipewire-free through a " +
            "pimpl, so a shell links only Qt to render a volume mixer, OSD, or sound " +
            "page.",
        keyTypes: [
            { name: "PipeWireConnection", purpose: "Lifecycle owner: holds the loop thread, context, and core; routes writes onto the loop thread." },
            { name: "PwNode",             purpose: "One audio node (sink, source, stream): `name`, `mediaClass`, `volumes`, `muted`, async setters." },
            { name: "PwNodeModel",        purpose: "`QAbstractListModel` filtering nodes by `mediaClasses` (sink / source / stream subclasses)." },
            { name: "PipeWireHost",       purpose: "QML singleton owning the process-wide connection and forwarding its signals." },
        ],
        deps: ["QtCore", "QtQml"],
        seeAlso: [
            { slug: "service-mpris", reason: "Pairs with media playback for a full sound and now-playing surface." },
        ],
    },
    {
        slug: "service-polkit",
        namespace: "PhosphorServicePolkit",
        group: "Services",
        oneLiner: "PolicyKit authentication agent for the session.",
        description:
            "A PolicyKit authentication agent built on `polkit-qt6`. When an " +
            "application requests a privileged action, `polkitd` calls into the " +
            "registered session agent and this library drives the PAM conversation " +
            "that authenticates the user. Registration is opt-in, since becoming the " +
            "agent intercepts every authentication. It surfaces the active request " +
            "and a respond or cancel path, passing the user's response straight " +
            "through to PAM without retaining it, so a shell renders the dialog.",
        keyTypes: [
            { name: "PolkitAgent", purpose: "Registers as the session auth agent and surfaces the active request plus respond/cancel." },
            { name: "AuthRequest", purpose: "One decoded request (action, message, icon, details, identities, selected identity)." },
        ],
        deps: ["QtCore", "QtQml"],
        seeAlso: [
            { slug: "service-session", reason: "Interactive power actions route auth through the polkit agent." },
        ],
    },
    {
        slug: "service-session",
        namespace: "PhosphorServiceSession",
        group: "Services",
        oneLiner: "logind session manager, power actions, and sleep inhibitors.",
        description:
            "The logind edge of the shell. It surfaces session and power actions " +
            "over `org.freedesktop.login1` (lock, logout, suspend, hibernate, " +
            "reboot, power-off, halt), each gated by its logind capability. It also " +
            "manages inhibitor locks: a delay inhibitor on sleep so the shell can " +
            "lock before suspend, and a block inhibitor on the power, suspend, " +
            "hibernate, and lid keys so the shell decides what they do. It surfaces " +
            "logind's `PrepareForSleep` and the session `Lock` / `Unlock` signals.",
        keyTypes: [
            { name: "SessionHost",              purpose: "The logind session host: capability properties, action invokables, `allowSleep()`, sleep signals." },
            { name: "SessionHost::Availability", purpose: "`Yes` / `No` / `NotApplicable` / `Challenge` / `Unknown`, parsed from logind capabilities." },
        ],
        deps: ["QtCore", "QtQml", "QtDBus", "phosphor-dbus"],
        seeAlso: [
            { slug: "service-polkit", reason: "Interactive actions route auth through the polkit agent." },
            { slug: "service-lock",   reason: "Lock requests pair with the Wayland session-lock service." },
        ],
    },
    {
        slug: "service-sni",
        namespace: "PhosphorServiceSni",
        group: "Services",
        oneLiner: "StatusNotifierItem system-tray host with dbusmenu menus.",
        description:
            "A system-tray host implementing `org.kde.StatusNotifierItem` and " +
            "`StatusNotifierWatcher` plus the `com.canonical.dbusmenu` context-menu " +
            "model. It registers the watcher on the session bus, advertises hosts, " +
            "watches for tray-item appearance and disappearance, and exposes each " +
            "live item and its menu as a Qt model. It has no UI of its own, and the " +
            "shell decides how the tray slot is rendered.",
        keyTypes: [
            { name: "StatusNotifierHost",      purpose: "Per-shell host: registers the watcher if absent, declares itself a host, owns the live items." },
            { name: "StatusNotifierItem",      purpose: "Live proxy for one tray item: icon (`QImage`), tooltip, status, menu path." },
            { name: "StatusNotifierItemModel", purpose: "`QAbstractListModel` over the host's items (id, title, status, iconUrl, menuPath)." },
            { name: "DBusMenuModel",           purpose: "`QAbstractListModel` exposing one level of a dbusmenu tree; cascaded popups bind per level." },
        ],
        deps: ["QtCore", "QtGui", "QtQml", "QtDBus", "phosphor-service-icontheme"],
        seeAlso: [
            { slug: "service-icontheme", reason: "Supplies the tray-item icon image provider." },
            { slug: "shell",             reason: "Consumes the tray model to render the panel's tray slot." },
        ],
    },
    {
        slug: "service-upower",
        namespace: "PhosphorServiceUPower",
        group: "Services",
        oneLiner: "Battery and power-device status via UPower.",
        description:
            "Exposes the system-bus `org.freedesktop.UPower` surface as Qt and QML " +
            "types: the aggregate display device, the per-device list, and the " +
            "`OnBattery` flag. It is a read-only D-Bus client, since UPower has no " +
            "writable surface for the facts it reports. A shell binds the host's " +
            "`displayDevice` for a single-battery indicator or the device model for " +
            "a per-device list.",
        keyTypes: [
            { name: "UPowerHost",        purpose: "Owns the device set: `onBattery`, `displayDevice` (aggregate battery), add/remove signals." },
            { name: "UPowerDevice",      purpose: "One power source: `percentage`, `state`, `type`, `timeToEmpty`, `iconName`, `healthPercentage`." },
            { name: "UPowerDeviceModel", purpose: "`QAbstractListModel` over the host's devices for QML." },
        ],
        deps: ["QtCore", "QtQml", "QtDBus"],
        seeAlso: [
            { slug: "service-network", reason: "Sibling system-bus readout service with the same host/device/model shape." },
        ],
    },
];
