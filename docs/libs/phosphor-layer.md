@page lib_phosphor_layer phosphor-layer

<!-- SPDX-FileCopyrightText: 2026 fuddlesworth
     SPDX-License-Identifier: GPL-3.0-or-later -->

> Layer-based overlay rendering — per-surface configuration (role, anchor,
> exclusive zone, animation policy), surface store, screen provider, and
> the transport adapter that plugs into `phosphor-shell`'s QPA plugin.

## Responsibility

`phosphor-shell` owns the low-level `zwlr_layer_shell_v1` plumbing — creating
surfaces, driving roundtrips.  `phosphor-layer` sits one level up: it's the
**policy layer** that says "we currently have these overlay surfaces, they
belong to these screens, their per-surface animators look like this, each has
one of these well-known roles."

- **Role vocabulary** (`Role.h`) — named overlay kinds: zone-outline, snap-
  preview, wallpaper-effect, snap-assist, OSD.  Each role carries its default
  anchor/margin/interactivity settings so individual consumers don't re-invent
  them
- **Surface configuration** (`SurfaceConfig.h`) — the per-surface bundle a
  consumer hands in: role, screen id, QML source, context properties,
  optional animator
- **Surface store** (`ISurfaceStore`) — registry of live layer surfaces keyed
  by role + screen.  Lets a caller ask "is the zone-outline overlay up on
  screen 2?" without tracking it themselves
- **Screen provider** (`IScreenProvider`) — abstract source of
  (screen-id, geometry, scale, refresh-rate) tuples.  Lets tests inject fake
  screen sets
- **Surface animator** (`ISurfaceAnimator`) — lets a consumer drive a show/
  hide animation on the layer surface itself (opacity fade, slide-from-edge,
  etc.) without the consumer knowing anything about layer-shell internals
- **Layer-shell transport** (`ILayerShellTransport`) — the seam between this
  library and `phosphor-shell`.  In the default build this is wired to the
  QPA plugin's LayerSurface; in headless tests it's a mock

## Key types

| Type | Purpose |
|------|---------|
| @ref PhosphorLayer::SurfaceConfig "SurfaceConfig"           | Per-surface descriptor — role, screen, QML source, props |
| @ref PhosphorLayer::Role "Role"                             | Enum + metadata for well-known overlay roles |
| @ref PhosphorLayer::ISurfaceStore "ISurfaceStore"           | Registry of live surfaces keyed by role + screen |
| @ref PhosphorLayer::IScreenProvider "IScreenProvider"       | Enumerates screens with geometry/scale |
| @ref PhosphorLayer::ISurfaceAnimator "ISurfaceAnimator"     | Show / hide animator for layer surfaces |
| @ref PhosphorLayer::ILayerShellTransport "ILayerShellTransport" | Adapter into `phosphor-shell`'s QPA plugin |
| @ref PhosphorLayer::IQmlEngineProvider "IQmlEngineProvider" | Shared QQmlEngine for surface QML instantiation |

## Typical use

Request that a zone-outline overlay be shown on screen 1:

```cpp
#include <PhosphorLayer/SurfaceConfig.h>
#include <PhosphorLayer/Role.h>
#include <PhosphorLayer/ISurfaceStore.h>

using namespace PhosphorLayer;

SurfaceConfig cfg;
cfg.role       = Role::ZoneOutline;
cfg.screenId   = "output-1";
cfg.qmlSource  = QUrl(QStringLiteral("qrc:/overlays/ZoneOutline.qml"));
cfg.contextProperties.insert(QStringLiteral("zones"), QVariant::fromValue(zoneList));

store.showSurface(cfg);        // creates the layer surface + drives its lifecycle
// … later
store.hideSurface(Role::ZoneOutline, "output-1");  // tears down
```

## Design notes

- **Role is the primary key** — "zone-outline overlay on screen 1" has a
  single identity; calling `showSurface` twice with the same role+screen
  updates the existing surface rather than creating a new one
- **Transport abstraction** — every interaction with `phosphor-shell`'s
  `LayerSurface` goes through `ILayerShellTransport`.  Lets tests verify
  "the store asked the transport to change anchor to Top+Right" without
  a live Wayland compositor
- **Animator is optional** — surfaces without an animator show/hide with no
  transition; attach an `ISurfaceAnimator` to get fade / slide / scale

## Dependencies

- `QtCore`, `QtGui`, `QtQml`
- @ref lib_phosphor_shell (transport target)

## See also

- @ref PhosphorLayer — full namespace reference
- @ref lib_phosphor_shell — the QPA plugin this library talks to via `ILayerShellTransport`
