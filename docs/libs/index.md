@page libs_index Libraries

<!--
    SPDX-FileCopyrightText: 2026 fuddlesworth
    SPDX-License-Identifier: GPL-3.0-or-later
-->

Sixteen focused libraries, each with a single responsibility and a stable
LGPL-licensed public API. Pages below go deeper than the auto-generated
namespace reference: design intent, typical usage patterns, and links out to
the full API surface.

## Libraries

- @subpage lib_phosphor_shell
- @subpage lib_phosphor_identity
- @subpage lib_phosphor_rendering
- @subpage lib_phosphor_animation
- @subpage lib_phosphor_zones
- @subpage lib_phosphor_tiles
- @subpage lib_phosphor_shortcuts
- @subpage lib_phosphor_layer
- @subpage lib_phosphor_layout_api
- @subpage lib_phosphor_config
- @subpage lib_phosphor_audio
- @subpage lib_phosphor_engine_api
- @subpage lib_phosphor_jsonloader
- @subpage lib_phosphor_protocol
- @subpage lib_phosphor_screens
- @subpage lib_phosphor_surfaces

## Reference

| Library | Responsibility | API Namespace |
|---------|----------------|---------------|
| [`phosphor-shell`](@ref lib_phosphor_shell)             | Wayland layer-shell + QPA plugin for overlays            | @ref PhosphorShell |
| [`phosphor-identity`](@ref lib_phosphor_identity)       | Stable window identity primitives (`WindowId`)           | @ref PhosphorIdentity |
| [`phosphor-rendering`](@ref lib_phosphor_rendering)     | `ShaderEffect` / `RenderNode` / `ShaderCompiler`         | @ref PhosphorRendering |
| [`phosphor-animation`](@ref lib_phosphor_animation)     | Motion curves, profiles, animation controllers           | @ref PhosphorAnimation |
| [`phosphor-zones`](@ref lib_phosphor_zones)             | Zone data model and JSON persistence                     | @ref PhosphorZones |
| [`phosphor-tiles`](@ref lib_phosphor_tiles)             | Tiling algorithms, built-in and scripted JS              | @ref PhosphorTiles |
| [`phosphor-shortcuts`](@ref lib_phosphor_shortcuts)     | Pluggable global-shortcut backends                       | @ref PhosphorShortcuts |
| [`phosphor-layer`](@ref lib_phosphor_layer)             | Layer-shell `Surface` / `SurfaceFactory` / transport     | @ref PhosphorLayer |
| [`phosphor-layout-api`](@ref lib_phosphor_layout_api)   | Layout description interfaces                            | `PhosphorLayoutApi.h` |
| [`phosphor-config`](@ref lib_phosphor_config)           | Pluggable configuration backends                         | @ref PhosphorConfig |
| [`phosphor-audio`](@ref lib_phosphor_audio)             | Audio spectrum input for audio-reactive shaders          | @ref PhosphorAudio |
| [`phosphor-engine-api`](@ref lib_phosphor_engine_api)   | Unified placement-engine interface                       | @ref PhosphorEngineApi |
| [`phosphor-jsonloader`](@ref lib_phosphor_jsonloader)   | Directory watcher + JSON parser for user schemas         | @ref PhosphorJsonLoader |
| [`phosphor-protocol`](@ref lib_phosphor_protocol)       | Shared D-Bus service names, wire types, client helpers   | @ref PhosphorProtocol |
| [`phosphor-screens`](@ref lib_phosphor_screens)         | Physical + virtual screen topology resolver              | @ref Phosphor::Screens |
| [`phosphor-surfaces`](@ref lib_phosphor_surfaces)       | Layer-shell surface manager with QML + Vulkan wiring     | @ref PhosphorSurfaces |

## Linking

Every library is built standalone and links against only the others it strictly
needs:

- **Foundation**: `phosphor-identity` (window IDs) has no Phosphor deps.
- **Leaf libraries**: `phosphor-shortcuts`, `phosphor-config`,
  `phosphor-layout-api`, `phosphor-audio`, `phosphor-engine-api`,
  `phosphor-jsonloader`, and `phosphor-protocol` are minimal-dep and usable
  in any Qt6 host.
- **Composition**: `phosphor-shell` pulls `phosphor-identity` +
  `phosphor-rendering`; `phosphor-zones` pulls `phosphor-layout-api`;
  `phosphor-tiles` pulls `phosphor-layout-api`; `phosphor-surfaces` pulls
  `phosphor-layer`; `phosphor-screens` pulls `phosphor-identity`.

No library depends on the full suite. Consume only what you need.
