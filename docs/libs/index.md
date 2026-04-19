@page libs_index Libraries

<!--
    SPDX-FileCopyrightText: 2026 fuddlesworth
    SPDX-License-Identifier: GPL-3.0-or-later
-->

Ten focused libraries, each with a single responsibility and a stable LGPL-licensed
public API. Pages below go deeper than the auto-generated namespace reference
— design intent, typical usage patterns, and links out to the full API surface.

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

## Reference

| Library | Responsibility | API Namespace |
|---------|----------------|---------------|
| [`phosphor-shell`](@ref lib_phosphor_shell)           | Wayland layer-shell + QPA plugin for overlays            | @ref PhosphorShell |
| [`phosphor-identity`](@ref lib_phosphor_identity)     | Stable window identity primitives (`WindowId`)           | @ref PhosphorIdentity |
| [`phosphor-rendering`](@ref lib_phosphor_rendering)   | `ShaderEffect` / `RenderNode` / `ShaderCompiler`         | @ref PhosphorRendering |
| [`phosphor-animation`](@ref lib_phosphor_animation)   | Window motion curves & animation controllers             | @ref PhosphorAnimation |
| [`phosphor-zones`](@ref lib_phosphor_zones)           | Zone data model & JSON persistence                       | @ref PhosphorZones |
| [`phosphor-tiles`](@ref lib_phosphor_tiles)           | Tiling algorithms — built-in + scripted JS               | @ref PhosphorTiles |
| [`phosphor-shortcuts`](@ref lib_phosphor_shortcuts)   | Pluggable global-shortcut backends                       | @ref PhosphorShortcuts |
| [`phosphor-layer`](@ref lib_phosphor_layer)           | Layer-based overlay surface configuration                | @ref PhosphorLayer |
| [`phosphor-layout-api`](@ref lib_phosphor_layout_api) | Layout description interfaces                            | `PhosphorLayoutApi.h` |
| [`phosphor-config`](@ref lib_phosphor_config)         | Pluggable configuration backends                         | @ref PhosphorConfig |

## Linking

Every library is built standalone and links against only the others it strictly
needs:

- **Foundation**: `phosphor-identity` (window IDs) has no Phosphor deps.
- **Leaf libraries**: `phosphor-shortcuts`, `phosphor-config`, `phosphor-layout-api` —
  minimal deps, usable in any Qt6 host.
- **Composition**: `phosphor-shell` pulls `phosphor-identity` + `phosphor-rendering`;
  `phosphor-zones` pulls `phosphor-layout-api`; `phosphor-tiles` pulls
  `phosphor-layout-api`.

No library depends on the full suite — consume only what you need.
