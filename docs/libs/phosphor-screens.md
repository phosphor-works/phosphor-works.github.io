@page lib_phosphor_screens phosphor-screens

<!-- SPDX-FileCopyrightText: 2026 fuddlesworth
     SPDX-License-Identifier: GPL-3.0-or-later -->

> Physical and virtual screen topology, panel reservations, and the canonical `org.plasmazones.Screen` surface.

## Responsibility

Owns the mapping from "here's a cursor position" to "here's the screen ID
you should route the next event to." Tracks physical screens as reported
by `QScreen`, user-defined virtual sub-regions within each physical
screen, and panel reservations from taskbars, docks, and status bars that
eat part of the usable geometry. Exposes all of it on the canonical
`org.plasmazones.Screen` D-Bus interface so downstream consumers stay
compositor-agnostic.

## Key types

| Type | Purpose |
|------|---------|
| @ref Phosphor::Screens::Manager "Manager"                 | Physical + virtual topology state with change signals as screens come and go. |
| @ref Phosphor::Screens::Resolver "Resolver"               | Point-to-screen lookup; accepts an optional D-Bus endpoint override. |
| @ref Phosphor::Screens::IPanelSource "IPanelSource"       | Pluggable panel-reservation source per desktop (Plasma, GNOME, wlr). |
| @ref Phosphor::Screens::VirtualScreen "VirtualScreen"     | One rectangular sub-region of a physical screen with its own screen ID. |
| @ref Phosphor::Screens::Swapper "VirtualScreenSwapper"    | D-Bus-addressable directional virtual-screen swaps (`left`, `right`, `up`, `down`). |
| @ref Phosphor::Screens::DBusScreenAdaptor "DBusScreenAdaptor" | Canonical `org.plasmazones.Screen` D-Bus surface. |
| @ref Phosphor::Screens::IConfigStore "IConfigStore"       | Persisted virtual-screen configuration. `InMemoryConfigStore` is the default for tests. |

## Design notes

- **Virtual screens are first-class.** Each virtual screen gets its own
  screen ID, layout assignments, autotile state, and overlay windows.
  Everything downstream treats them exactly like physical screens.
- **Panel source is pluggable.** Plasma exposes reservations via
  `org.kde.plasmashell`; GNOME via `org.gnome.Mutter`; sway and Hyprland
  via wlr-foreign-toplevel. The manager core stays compositor-agnostic
  by delegating to an `IPanelSource` owned by the consumer.
- **Direction tokens match the wire format.** `Direction::Left` /
  `Right` / `Up` / `Down` are the same lower-case ASCII strings the
  D-Bus `swapVirtualScreenInDirection` method accepts, so adaptors can
  pass user strings through verbatim.

## Dependencies

- `QtCore`, `QtGui`, `QtDBus`
- @ref lib_phosphor_identity (`VirtualScreenId`)

## See also

- @ref Phosphor::Screens — full namespace reference
- @ref PhosphorIdentity — where `VirtualScreenId` lives.
