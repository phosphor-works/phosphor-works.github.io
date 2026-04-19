<!--
    SPDX-FileCopyrightText: 2026 fuddlesworth
    SPDX-License-Identifier: GPL-3.0-or-later

    Doxygen main page for the Phosphor API reference.  Consumed by
    docs/Doxyfile via USE_MDFILE_AS_MAINPAGE; becomes api/html/index.html.
-->

# Phosphor {#mainpage}

**Phosphor** is a suite of ten focused Qt6 / Wayland libraries for building
window-management tools.  Each library owns a single responsibility; the
suite is designed to be consumed à la carte — pull in only what you need.

The suite currently ships with [PlasmaZones][pz], the reference consumer,
and the headers live under `libs/phosphor-*/include/` in that repository.
These docs are generated from those public headers.

[pz]: https://github.com/fuddlesworth/PlasmaZones


## Libraries

The suite at a glance — click a library name for its design + examples page,
or a namespace for the auto-generated API surface.

| Library | Namespace | Responsibility |
|--------:|:----------|:---------------|
| [`phosphor-shell`](@ref lib_phosphor_shell)            | [PhosphorShell](namespacePhosphorShell.html)            | Wayland layer-shell + custom QPA plugin for overlays |
| [`phosphor-identity`](@ref lib_phosphor_identity)      | [PhosphorIdentity](namespacePhosphorIdentity.html)      | Stable window identity primitives (`WindowId`) |
| [`phosphor-rendering`](@ref lib_phosphor_rendering)    | [PhosphorRendering](namespacePhosphorRendering.html)    | `ShaderEffect` / `RenderNode` / `ShaderCompiler` infrastructure |
| [`phosphor-animation`](@ref lib_phosphor_animation)    | [PhosphorAnimation](namespacePhosphorAnimation.html)    | Window motion curves & animation controllers |
| [`phosphor-zones`](@ref lib_phosphor_zones)            | [PhosphorZones](namespacePhosphorZones.html)            | Zone data model & JSON persistence |
| [`phosphor-tiles`](@ref lib_phosphor_tiles)            | [PhosphorTiles](namespacePhosphorTiles.html)            | Tiling algorithms — built-in + scripted JS |
| [`phosphor-shortcuts`](@ref lib_phosphor_shortcuts)    | [PhosphorShortcuts](namespacePhosphorShortcuts.html)    | Pluggable global-shortcut backends |
| [`phosphor-layer`](@ref lib_phosphor_layer)            | [PhosphorLayer](namespacePhosphorLayer.html)            | Layer-based overlay surface configuration |
| [`phosphor-layout-api`](@ref lib_phosphor_layout_api)  | [see PhosphorLayoutApi.h](PhosphorLayoutApi_8h.html)    | Layout description interfaces |
| [`phosphor-config`](@ref lib_phosphor_config)          | [PhosphorConfig](namespacePhosphorConfig.html)          | Pluggable configuration backends |


## Where to start

- **Library deep-dives?** → @ref libs_index "Libraries" — design notes +
  typical usage examples for each of the ten libraries.
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
