@page lib_phosphor_identity phosphor-identity

<!-- SPDX-FileCopyrightText: 2026 fuddlesworth
     SPDX-License-Identifier: GPL-3.0-or-later -->

> Stable window identity primitives — the `WindowId` value type that every
> other library uses to refer to a window across the Wayland / QPA / KWin-script
> boundaries.

## Responsibility

Wayland doesn't expose a reliable numeric window ID the way X11 does.  KWin
scripts refer to windows by their `internalId`, the compositor-bridge D-Bus
interface carries string IDs over the wire, and application QObjects own
`QWindow` pointers with their own lifetimes.  Every path uses a different
representation for "which window."

`phosphor-identity` defines a **single canonical value type**, @ref
PhosphorIdentity::WindowId "WindowId", that:

- Is copyable, hashable, comparable — usable as a key in `QHash` / `std::map`
- Can be parsed from and rendered to a stable string form (the D-Bus wire
  representation, the KWin `internalId`, and the QML string representation
  all round-trip cleanly through the same methods)
- Has a well-defined `isValid()` sentinel so callers don't need to pattern-match
  against empty strings

Every library in the suite uses `WindowId` at any API boundary that touches a
window — there's no mixing of `QString`, `QWindow*`, `quint64`, or KWin's
`WId` type across library boundaries.

## Key types

| Type | Purpose |
|------|---------|
| @ref PhosphorIdentity::WindowId "WindowId" | Stable, hashable, value-semantic window identifier |

## Typical use

```cpp
#include <PhosphorIdentity/WindowId.h>

using PhosphorIdentity::WindowId;

// Construct from a D-Bus-wire string
WindowId id = WindowId::fromString(QStringLiteral("wl-1234-5678"));
if (!id.isValid()) {
    qWarning() << "unknown window id from D-Bus";
    return;
}

// Use as a hash key across libraries
QHash<WindowId, Zone> windowToZone;
windowToZone.insert(id, zone);

// Render for another wire protocol
socket.write(id.toString().toUtf8());
```

## Dependencies

- `QtCore` only.  Zero Phosphor dependencies — this is the foundation library
  everything else builds on.

## See also

- @ref PhosphorIdentity — full namespace reference
