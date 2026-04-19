@page lib_phosphor_shortcuts phosphor-shortcuts

<!-- SPDX-FileCopyrightText: 2026 fuddlesworth
     SPDX-License-Identifier: GPL-3.0-or-later -->

> Pluggable global-shortcut backends — KGlobalAccel (Plasma-native) / XDG
> Portal (xdg-desktop-portal.GlobalShortcuts) / D-Bus ad-hoc fallback —
> behind a single registration API.

## Responsibility

"Super+1 snaps to zone 1" needs to register a global shortcut from a
userspace process.  On Plasma that goes through KGlobalAccel; on generic
Wayland compositors that support the portal, through
`org.freedesktop.portal.GlobalShortcuts`; on compositors with neither,
there's no standard — hence the ad-hoc D-Bus fallback for KWin-script /
compositor-provided shortcut dispatch.

The consumer shouldn't care which backend is active.  `phosphor-shortcuts`:

- Defines a **single registration interface** (`Registry::bind`) for "here's a
  shortcut id, default sequence, description, and a callback"
- Dispatches through a **pluggable backend** (`IBackend`) that the application
  chooses at startup — or auto-selects by probing available services
- Provides **factory helpers** (`Factory`) that build the right backend given
  a compositor/desktop hint
- Separates "system shortcuts" (persistent, configurable per-user) from
  **ad-hoc registrations** (`IAdhocRegistrar`) for transient UI like
  modal-capture dialogs

## Key types

| Type | Purpose |
|------|---------|
| @ref PhosphorShortcuts::Registry "Registry"                 | Front-end: `bind()` a shortcut id + callback |
| @ref PhosphorShortcuts::IBackend "IBackend"                 | Abstract backend — implementors: KGlobalAccel / XDG-Portal / D-Bus |
| @ref PhosphorShortcuts::IAdhocRegistrar "IAdhocRegistrar"   | Short-lived registrations that skip persistent storage |
| @ref PhosphorShortcuts::Factory "Factory"                   | Selects the right backend based on running environment |

## Typical use

```cpp
#include <PhosphorShortcuts/Registry.h>
#include <PhosphorShortcuts/Factory.h>

using namespace PhosphorShortcuts;

auto backend = Factory::autodetectBackend();  // picks KGlobalAccel on Plasma
Registry registry(backend);

registry.bind(
    /*id*/          QStringLiteral("snap-to-quick-1"),
    /*defaultSeq*/  QKeySequence(QStringLiteral("Meta+1")),
    /*description*/ tr("Snap active window to Quick Layout 1"),
    /*callback*/    [] { engine.snapTo(1); },
    /*persistent*/  true
);
```

Switching backends is a one-liner — the same `Registry` API, different
`IBackend`:

```cpp
auto portalBackend = Factory::createBackend(Factory::Backend::XdgPortal);
Registry adhoc(portalBackend);
adhoc.bind(id, seq, desc, cb, /*persistent*/ false);
```

## Design notes

- **No direct KGlobalAccel include in callers** — callers never see the Plasma-
  specific API.  Makes the whole suite compilable without KF6 by swapping in
  a portal-only backend build.
- **`IAdhocRegistrar` is a separate interface** — binds that should never
  end up in the user's KCM shortcut editor live behind a different API so
  the backend can persist only the ones that asked for it.
- **`Factory::autodetectBackend`** probes at runtime.  First preference is
  KGlobalAccel (fastest, native Plasma integration); falls back to the
  portal; last-ditch D-Bus.

## Dependencies

- `QtCore`, `QtGui` (for `QKeySequence`)
- **Optional** at runtime: `KF6::GlobalAccel` (Plasma backend), compiled in
  when `-DUSE_KDE_FRAMEWORKS=ON`

## See also

- @ref PhosphorShortcuts — full namespace reference
