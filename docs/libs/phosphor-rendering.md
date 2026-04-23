@page lib_phosphor_rendering phosphor-rendering

<!-- SPDX-FileCopyrightText: 2026 fuddlesworth
     SPDX-License-Identifier: GPL-3.0-or-later -->

> `ShaderEffect` / `RenderNode` / `ShaderCompiler` infrastructure for mounting
> per-frame shader passes inside a Qt Quick scene graph.

## Responsibility

Qt Quick's built-in `ShaderEffect` item is fine for toy demos but doesn't
support multipass, compute shaders, custom UBO layouts, or including one
shader file from another. `phosphor-rendering` replaces it with three
cooperating pieces:

- **@ref PhosphorRendering::ShaderEffect "ShaderEffect":** a `QQuickItem`
  subclass that owns one `RenderNode`, exposes shader source and
  parameters as Q_PROPERTYs, and delegates uniform packing to a pluggable
  `IUniformExtension` (see @ref lib_phosphor_shell).
- **@ref PhosphorRendering::ShaderNodeRhi "ShaderNodeRhi":** the
  scene-graph render node. Owns the QRhi pipeline, vertex and index
  buffers, the uniform buffer object (UBO), texture bindings, and
  per-pass targets. Supports multipass via ping-pong buffers, input
  channel textures (`iChannel0..3`, Shadertoy-style), and writeable depth
  attachments.
- **@ref PhosphorRendering::ShaderCompiler "ShaderCompiler":** a runtime
  GLSL to SPIR-V compiler using `glslang`. Feeds into Qt's shader
  pipeline. Caches compiled modules keyed on source-hash and target-API,
  so re-entering the editor doesn't recompile unchanged shaders.

## Key types

| Type | Purpose |
|------|---------|
| @ref PhosphorRendering::ShaderEffect "ShaderEffect"         | The QQuickItem you instantiate in QML |
| @ref PhosphorRendering::ShaderNodeRhi "ShaderNodeRhi"       | The QRhi-backed scene-graph node it owns |
| @ref PhosphorRendering::ShaderCompiler "ShaderCompiler"     | GLSL to SPIR-V pipeline with on-disk cache |

## Typical use

In QML:

```qml
import PhosphorRendering 1.0

ShaderEffect {
    anchors.fill: parent
    fragmentShader: "qrc:/shaders/neon-city/effect.frag"
    bufferShaderPaths: [
        "qrc:/shaders/neon-city/buffer.frag"
    ]

    customParams: [0.7, 1.0, 0.35, ...]   // packed into UBO
    customColors: ["#3B82F6", "#A855F7", ...]

    // Optional: a uniform extension feeds per-zone data into the UBO tail
    uniformExtension: ZoneUniformExtension { zones: view.zones }
}
```

## Design notes

- **No texture ownership by the item.** Textures are loaded by
  `ShaderNodeRhi` inside the render thread. The item just carries paths
  and parameters. This avoids the GPU-resource-lifetime bugs that plague
  naive `ShaderEffect` reimplementations.
- **Multipass is opt-in.** Single-pass shaders don't pay for the
  additional framebuffers. Setting `bufferShaderPaths` to a non-empty
  list enables the multipass path.
- **No direct GL calls.** Everything goes through QRhi, so the same code
  runs on OpenGL, Vulkan, and Metal backends. Shaders are authored in
  Vulkan-flavor GLSL 450.

## Dependencies

- `QtCore`, `QtGui`, `QtQuick`, `QtQml`
- `glslang` for runtime compilation

## See also

- @ref PhosphorRendering — full namespace reference
- @ref lib_phosphor_shell — `ShaderRegistry` + `IUniformExtension` live there
