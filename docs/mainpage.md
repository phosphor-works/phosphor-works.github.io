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

The suite at a glance — click a library name for its design + examples page,
or a namespace for the auto-generated API surface.

| Library | Namespace | Responsibility |
|--------:|:----------|:---------------|
| [`phosphor-identity`](@ref lib_phosphor_identity)         | [PhosphorIdentity](namespacePhosphorIdentity.html)         | Stable cross-process identity formats (`WindowId`, `ScreenId`, `VirtualScreenId`) |
| [`phosphor-geometry`](@ref lib_phosphor_geometry)         | [PhosphorGeometry](namespacePhosphorGeometry.html)         | Pure-function geometry helpers shared by both engines |
| [`phosphor-protocol`](@ref lib_phosphor_protocol)         | [PhosphorProtocol](namespacePhosphorProtocol.html)         | Shared D-Bus service names, wire types, helpers |
| [`phosphor-config`](@ref lib_phosphor_config)             | [PhosphorConfig](namespacePhosphorConfig.html)             | Pluggable configuration backends with schema + migration |
| [`phosphor-fsloader`](@ref lib_phosphor_fsloader)         | [PhosphorFsLoader](namespacePhosphorFsLoader.html)         | Watched-directory + metadata-pack loader skeleton |
| [`phosphor-shaders`](@ref lib_phosphor_shaders)           | [PhosphorShaders](namespacePhosphorShaders.html)           | Shader-effect registry, base UBO layout, uniform extension contract |
| [`phosphor-rendering`](@ref lib_phosphor_rendering)       | [PhosphorRendering](namespacePhosphorRendering.html)       | `ShaderEffect` / `ShaderNodeRhi` / runtime GLSL → SPIR-V |
| [`phosphor-animation`](@ref lib_phosphor_animation)       | [PhosphorAnimation](namespacePhosphorAnimation.html)       | Motion runtime + shader-transition runtime with JSON profiles |
| [`phosphor-layout-api`](@ref lib_phosphor_layout_api)     | [PhosphorLayoutApi](namespacePhosphorLayoutApi.html)       | Layout description interfaces + provider registry |
| [`phosphor-zones`](@ref lib_phosphor_zones)               | [PhosphorZones](namespacePhosphorZones.html)               | Manual zone data model, registry, and `ILayoutSource` |
| [`phosphor-tiles`](@ref lib_phosphor_tiles)               | [PhosphorTiles](namespacePhosphorTiles.html)               | Tiling algorithms, sandboxed JS, and `TilingState` |
| [`phosphor-engine-api`](@ref lib_phosphor_engine_api)     | [PhosphorEngineApi](namespacePhosphorEngineApi.html)       | Unified placement-engine surface + shared service contracts |
| [`phosphor-snap-engine`](@ref lib_phosphor_snap_engine)   | [PhosphorSnapEngine](namespacePhosphorSnapEngine.html)     | Manual zone-based placement engine |
| [`phosphor-tile-engine`](@ref lib_phosphor_tile_engine)   | [PhosphorTileEngine](namespacePhosphorTileEngine.html)     | Automatic-tiling placement engine |
| [`phosphor-wayland`](@ref lib_phosphor_wayland)           | [PhosphorWayland](namespacePhosphorWayland.html)           | Custom QPA plugin + `LayerSurface` wrapper |
| [`phosphor-layer`](@ref lib_phosphor_layer)               | [PhosphorLayer](namespacePhosphorLayer.html)               | Layer-shell surface primitives: factory, registry, coordinator |
| [`phosphor-surfaces`](@ref lib_phosphor_surfaces)         | [PhosphorSurfaces](namespacePhosphorSurfaces.html)         | Surface manager with QML loading and Vulkan wiring |
| [`phosphor-screens`](@ref lib_phosphor_screens)           | [Phosphor::Screens](namespacePhosphor_1_1Screens.html)     | Physical + virtual screen topology resolver |
| [`phosphor-shortcuts`](@ref lib_phosphor_shortcuts)       | [PhosphorShortcuts](namespacePhosphorShortcuts.html)       | Pluggable global-shortcut backends |
| [`phosphor-audio`](@ref lib_phosphor_audio)               | [PhosphorAudio](namespacePhosphorAudio.html)               | Audio spectrum input for audio-reactive shaders |


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
