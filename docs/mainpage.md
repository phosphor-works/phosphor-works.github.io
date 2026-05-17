<!--
    SPDX-FileCopyrightText: 2026 fuddlesworth
    SPDX-License-Identifier: GPL-3.0-or-later

    Doxygen main page for the Phosphor API reference.  Consumed by
    docs/Doxyfile via USE_MDFILE_AS_MAINPAGE; becomes api/html/index.html.
-->

# Phosphor {#mainpage}

**Phosphor** is a suite of focused Qt6 / Wayland libraries for building
window-management tools.  Each library owns a single responsibility; the
suite is designed to be consumed à la carte, so you pull in only what you
need.

The suite currently ships with [PlasmaZones][pz], the reference consumer,
and the headers live under `libs/phosphor-*/include/` in that repository.
These docs are generated from those public headers, with each library's
hand-written design notes coming from its `README.md`.

[pz]: https://github.com/fuddlesworth/PlasmaZones


## Libraries

The suite is organized into five categories — click a library name for its
design + examples page, or a namespace for the auto-generated API surface.

@subpage cat_foundations
@subpage cat_layout
@subpage cat_engines
@subpage cat_rendering
@subpage cat_surfaces
@subpage cat_shell

### Foundations

Low-level shared infrastructure every other layer builds on.

| Library | Namespace | Responsibility |
|--------:|:----------|:---------------|
| [`phosphor-identity`](@ref lib_phosphor_identity)         | [PhosphorIdentity](namespacePhosphorIdentity.html)         | Stable cross-process identity formats (`WindowId`, `ScreenId`, `VirtualScreenId`) |
| [`phosphor-geometry`](@ref lib_phosphor_geometry)         | [PhosphorGeometry](namespacePhosphorGeometry.html)         | Pure-function geometry helpers shared by both engines |
| [`phosphor-protocol`](@ref lib_phosphor_protocol)         | [PhosphorProtocol](namespacePhosphorProtocol.html)         | Shared D-Bus service names, wire types, helpers |
| [`phosphor-config`](@ref lib_phosphor_config)             | [PhosphorConfig](namespacePhosphorConfig.html)             | Pluggable configuration backends with schema + migration |
| [`phosphor-fsloader`](@ref lib_phosphor_fsloader)         | [PhosphorFsLoader](namespacePhosphorFsLoader.html)         | Watched-directory + metadata-pack loader skeleton |
| [`phosphor-shortcuts`](@ref lib_phosphor_shortcuts)       | [Phosphor::Shortcuts](namespacePhosphor_1_1Shortcuts.html) | Pluggable global-shortcut backends |
| [`phosphor-workspaces`](@ref lib_phosphor_workspaces)     | [PhosphorWorkspaces](namespacePhosphorWorkspaces.html)     | Virtual desktop and activity tracking |

### Layout

Zone and tile data models — the *what* of placement.

| Library | Namespace | Responsibility |
|--------:|:----------|:---------------|
| [`phosphor-layout-api`](@ref lib_phosphor_layout_api)     | [PhosphorLayout](namespacePhosphorLayout.html)             | Layout description interfaces + provider registry |
| [`phosphor-zones`](@ref lib_phosphor_zones)               | [PhosphorZones](namespacePhosphorZones.html)               | Manual zone data model, registry, and `ILayoutSource` |
| [`phosphor-tiles`](@ref lib_phosphor_tiles)               | [PhosphorTiles](namespacePhosphorTiles.html)               | Tiling algorithms, sandboxed JS, and `TilingState` |

### Engines

Placement runtime — the *how* of placement.

| Library | Namespace | Responsibility |
|--------:|:----------|:---------------|
| [`phosphor-engine`](@ref lib_phosphor_engine)             | [PhosphorEngine](namespacePhosphorEngine.html)             | Unified placement-engine surface + shared service contracts |
| [`phosphor-snap-engine`](@ref lib_phosphor_snap_engine)   | [PhosphorSnapEngine](namespacePhosphorSnapEngine.html)     | Manual zone-based placement engine |
| [`phosphor-tile-engine`](@ref lib_phosphor_tile_engine)   | [PhosphorTileEngine](namespacePhosphorTileEngine.html)     | Automatic-tiling placement engine |
| [`phosphor-placement`](@ref lib_phosphor_placement)       | [PhosphorPlacement](namespacePhosphorPlacement.html)       | Window tracking, auto-snap, resnap, rotation, empty-zone queries |

### Rendering

Shader and animation pipeline.

| Library | Namespace | Responsibility |
|--------:|:----------|:---------------|
| [`phosphor-shaders`](@ref lib_phosphor_shaders)           | [PhosphorShaders](namespacePhosphorShaders.html)           | Shader-effect registry, base UBO layout, uniform extension contract |
| [`phosphor-rendering`](@ref lib_phosphor_rendering)       | [PhosphorRendering](namespacePhosphorRendering.html)       | `ShaderEffect` / `ShaderNodeRhi` / runtime GLSL → SPIR-V |
| [`phosphor-animation`](@ref lib_phosphor_animation)       | [PhosphorAnimation](namespacePhosphorAnimation.html)       | Motion runtime + shader-transition runtime with JSON profiles |
| [`phosphor-audio`](@ref lib_phosphor_audio)               | [PhosphorAudio](namespacePhosphorAudio.html)               | Audio spectrum input for audio-reactive shaders |

### Surfaces

Wayland integration, layer-shell primitives, and screen topology.

| Library | Namespace | Responsibility |
|--------:|:----------|:---------------|
| [`phosphor-wayland`](@ref lib_phosphor_wayland)           | [PhosphorWayland](namespacePhosphorWayland.html)           | Custom QPA plugin + `LayerSurface` wrapper |
| [`phosphor-layer`](@ref lib_phosphor_layer)               | [PhosphorLayer](namespacePhosphorLayer.html)               | Layer-shell surface primitives: factory, registry, coordinator |
| [`phosphor-surfaces`](@ref lib_phosphor_surfaces)         | [PhosphorSurfaces](namespacePhosphorSurfaces.html)         | Surface manager with QML loading and Vulkan wiring |
| [`phosphor-screens`](@ref lib_phosphor_screens)           | [Phosphor::Screens](namespacePhosphor_1_1Screens.html)     | Physical + virtual screen topology resolver |
| [`phosphor-compositor`](@ref lib_phosphor_compositor)     | [PhosphorCompositor](namespacePhosphorCompositor.html)     | Plugin SDK for hosting the daemon in non-KWin Wayland compositors |

### Shell

Higher-level shell infrastructure on top of the surface stack — panel
windows, named UI-pattern recipes, system-tray and platform services.

| Library | Namespace | Responsibility |
|--------:|:----------|:---------------|
| [`phosphor-shell`](@ref lib_phosphor_shell)               | [PhosphorShell](namespacePhosphorShell.html)               | Quickshell-style declarative QML framework for layer-shell shells |
| [`phosphor-services`](@ref lib_phosphor_services)         | [PhosphorServices](namespacePhosphorServices.html)         | D-Bus + platform integrations (system tray today; notifications, MPRIS, UPower next) |
| [`phosphor-overlay`](@ref lib_phosphor_overlay)           | [PhosphorOverlay](namespacePhosphorOverlay.html)           | Per-screen layer-shell shell hosts with named slot vocabulary |
| [`phosphor-shell-patterns`](@ref lib_phosphor_shell_patterns) | [PhosphorShellPatterns](namespacePhosphorShellPatterns.html) | Named UI-pattern Role recipes (wallpaper, panel, modal, toast) |


## Where to start

- **Browsing by name?** → @ref annotated "Classes" — alphabetical class index
  across every library.
- **Browsing by namespace?** → @ref namespaces "Namespaces" — one entry per
  `Phosphor*` library.
- **Browsing by header?** → @ref files "Files" — every header under
  `libs/phosphor-*/include/` grouped by library directory.
- **D-Bus interfaces?** → @ref dbus_apis "D-Bus APIs" — every interface
  PlasmaZones exposes on the session bus, generated from
  [`dbus/*.xml`](https://github.com/fuddlesworth/PlasmaZones/tree/main/dbus).
- **Looking for a specific symbol?** → use the search box in the upper
  corner (indexes class names, method names, and file names).


## Conventions

All Phosphor libraries share a handful of cross-cutting conventions so
anything you learn in one library transfers to the others:

- **Namespaces mirror library names** — `libs/phosphor-identity/include/PhosphorIdentity/WindowId.h`
  declares `PhosphorIdentity::WindowId`.  The `Phosphor` prefix is elided
  when sorting the class index (you won't see a hundred classes starting
  with `Phosphor...`).
- **Public API in `include/`, implementation in `src/`** — everything under
  `libs/phosphor-*/include/` is the stable surface you can link against.
  `src/` and any `_p.h`/`internal/` headers are intentionally excluded
  from this reference.
- **Per-library README is the design page** — each library's
  `README.md` is the source of truth for its responsibility, key types,
  examples, and design notes; the build pipeline (`scripts/readme-to-doxypage.py`)
  stitches them in here.
- **Qt idioms throughout** — `Q_OBJECT`, `Q_PROPERTY` with READ/WRITE/NOTIFY,
  parent-based ownership, signals in past tense
  (`layoutChanged`), slots in imperative (`saveLayout`).  Macros are
  stripped by the preprocessor before Doxygen parses, so class
  declarations read cleanly in the generated HTML.
- **Interface-first for anything pluggable** — config storage, shortcut
  backends, wallpaper providers, render backends are all declared as
  abstract `I*` interfaces with one or more concrete implementations.
  That makes it easy to drop in a different persistence layer or
  shortcut router without touching the consumers.


## License

All Phosphor libraries: **LGPL-2.1-or-later**.
Consumers (including PlasmaZones) link against them under that license.


<!--
    The five blocks below are sidebar-tree organisers. Each @page declares
    a category landing page and uses @subpage to claim its member libraries
    as children, so the generated tree reads Phosphor → <Category> → lib
    instead of Phosphor → lib (× 25). The library @page declarations come
    from each lib's README.md via scripts/readme-to-doxypage.py.
-->

@page cat_foundations Foundations

Low-level shared infrastructure every other layer builds on: identity
formats, pure-function geometry, the D-Bus vocabulary, configuration,
watched-directory loaders, global keyboard shortcuts, and workspace
tracking.

@subpage lib_phosphor_identity
@subpage lib_phosphor_geometry
@subpage lib_phosphor_protocol
@subpage lib_phosphor_config
@subpage lib_phosphor_fsloader
@subpage lib_phosphor_shortcuts
@subpage lib_phosphor_workspaces


@page cat_layout Layout

Zone and tile data models. These libraries describe *what* a screen
layout looks like, independent of any placement engine.

@subpage lib_phosphor_layout_api
@subpage lib_phosphor_zones
@subpage lib_phosphor_tiles


@page cat_engines Engines

The placement runtime. These libraries decide *how* windows are arranged
in response to user intents (open, close, focus, swap, assign-to-zone)
and maintain the shared window-tracking state both engines read from.

@subpage lib_phosphor_engine
@subpage lib_phosphor_snap_engine
@subpage lib_phosphor_tile_engine
@subpage lib_phosphor_placement


@page cat_rendering Rendering

Shader and animation pipeline. Compiles GLSL to SPIR-V at runtime,
manages shader packs, drives motion curves and transition profiles, and
feeds audio spectra to audio-reactive effects.

@subpage lib_phosphor_shaders
@subpage lib_phosphor_rendering
@subpage lib_phosphor_animation
@subpage lib_phosphor_audio


@page cat_surfaces Surfaces

Wayland integration, layer-shell primitives, screen topology, and the
compositor-plugin SDK. The QPA plugin sits at the bottom of this stack;
surface managers and screen resolvers sit on top.

@subpage lib_phosphor_wayland
@subpage lib_phosphor_layer
@subpage lib_phosphor_surfaces
@subpage lib_phosphor_screens
@subpage lib_phosphor_compositor


@page cat_shell Shell

Higher-level shell infrastructure built on top of the surface stack.
QML panel and popup window types, named UI-pattern recipes for common
shell roles, per-screen overlay hosts, and D-Bus / platform-spec
integrations every desktop shell needs.

@subpage lib_phosphor_shell
@subpage lib_phosphor_services
@subpage lib_phosphor_overlay
@subpage lib_phosphor_shell_patterns
