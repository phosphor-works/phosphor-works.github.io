@page lib_phosphor_shell phosphor-shell

<!-- SPDX-FileCopyrightText: 2026 fuddlesworth
     SPDX-License-Identifier: GPL-3.0-or-later -->

> Wayland layer-shell plus a custom QPA plugin for building always-on-top
> overlay surfaces from QML. The bridge between a Qt6 application and
> `zwlr_layer_shell_v1`.

## Responsibility

Qt's standard QPA plugins (`wayland`, `xcb`) create desktop-level windows.
Overlays (zone outlines, snap-assist previews, shader wallpapers) need to
live on a **layer shell surface** with per-surface anchor, margin, and
exclusive-zone configuration that the regular Qt surface API doesn't
expose.

`phosphor-shell` provides:

- **A custom QPA plugin** (`LayerShellPluginLoader`) that hosts a
  QQuickWindow on top of a `wlr-layer-shell-v1` surface. Loaded via
  `QT_QPA_PLATFORM_PLUGIN_PATH`.
- **A wrapper** (`LayerSurface`) that owns the layer-shell object and
  exposes anchor, margin, exclusive-zone, namespace, and
  keyboard-interactivity as Q_PROPERTYs.
- **A shader-effect toolkit:** `ShaderRegistry` (effect catalog and
  metadata loading), `ShaderIncludeResolver` (`#include` resolution for
  GLSL), and the uniform-extension contract (`IUniformExtension`) that
  downstream libraries implement to feed custom per-effect data to
  shaders.
- **A wallpaper provider contract** (`IWallpaperProvider`) that decouples
  where the wallpaper texture comes from from how it gets bound into an
  effect.

## Key types

| Type | Purpose |
|------|---------|
| @ref PhosphorShell::LayerSurface "LayerSurface"                     | QQuickWindow-like wrapper over a `zwlr_layer_shell_v1` surface |
| @ref PhosphorShell::ShaderRegistry "ShaderRegistry"                 | Enumerates available effects + parses their `metadata.json` |
| @ref PhosphorShell::ShaderIncludeResolver "ShaderIncludeResolver"   | Resolves `#include <common.glsl>` etc. at shader compile time |
| @ref PhosphorShell::IUniformExtension "IUniformExtension"           | Interface for contributing custom uniforms to a `ShaderEffect`'s UBO |
| @ref PhosphorShell::IWallpaperProvider "IWallpaperProvider"         | Abstract source for the wallpaper texture (KWin, XDG, FS) |

## Typical use

Load the plugin, create a layer surface, show it:

```cpp
// qputenv("QT_QPA_PLATFORM_PLUGIN_PATH", ...); before QApplication construction
QGuiApplication app(argc, argv);

auto *surface = new PhosphorShell::LayerSurface();
surface->setNamespace(QStringLiteral("my-overlay"));
surface->setLayer(PhosphorShell::LayerSurface::Layer::Overlay);
surface->setAnchors(PhosphorShell::LayerSurface::AnchorTop
                  | PhosphorShell::LayerSurface::AnchorBottom
                  | PhosphorShell::LayerSurface::AnchorLeft
                  | PhosphorShell::LayerSurface::AnchorRight);
surface->setKeyboardInteractivity(PhosphorShell::LayerSurface::KeyboardInteractivity::OnDemand);
surface->setSource(QUrl(QStringLiteral("qrc:/overlay.qml")));
surface->show();

return app.exec();
```

## Dependencies

- `QtCore`, `QtGui`, `QtQuick`
- `wayland-client`, `zwlr-layer-shell-v1` protocol
- `phosphor-identity` (re-exports `WindowId`)
- `phosphor-rendering` (for the shader infrastructure `ShaderRegistry` loads)

## See also

- @ref PhosphorShell — full namespace reference
- @ref lib_phosphor_rendering — the shader effect host that consumes this
  library's `ShaderRegistry`
