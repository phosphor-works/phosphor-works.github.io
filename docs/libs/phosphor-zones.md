@page lib_phosphor_zones phosphor-zones

<!-- SPDX-FileCopyrightText: 2026 fuddlesworth
     SPDX-License-Identifier: GPL-3.0-or-later -->

> Zone data model, layout persistence, zone-detection / adjacency
> calculations, and the layout-manager interface family.

## Responsibility

A **zone** is a named rectangular region of screen space with metadata
(appearance, label, quick-select slot).  A **layout** is a collection of
zones plus screen/virtual-desktop assignment rules.  This library owns both
the in-memory data model and the JSON-on-disk persistence, and exposes
everything behind interfaces so consumers can mock or swap any piece.

- **Data model** — `Zone`, `Layout`, relative/absolute coordinate conversion
- **Detection** — given a cursor point + modifier state, which zone is the
  window snapping into?  `ZoneDetector` implements the @ref
  PhosphorZones::IZoneDetector "IZoneDetector" interface
- **Persistence** — `ILayoutPersistence` reads / writes layout JSON under
  `~/.local/share/plasmazones/layouts/`
- **Registry** — `ILayoutRegistry` enumerates available layouts; `ILayoutManager`
  extends registry with CRUD + screen assignment
- **Quick-layouts** — `IQuickLayouts` handles the 1–9 numeric-slot mapping
- **Assignments** — `ILayoutAssignments` per-screen / per-virtual-desktop
- **Highlighter** — `ZoneHighlighter` drives the overlay's per-zone emphasis
  state machine (hover, active drag target, just-snapped flash)

## Key types

| Type | Purpose |
|------|---------|
| @ref PhosphorZones::Zone "Zone"                               | Value type: rect, id, label, colors, appearance |
| @ref PhosphorZones::Layout "Layout"                           | Collection of zones + assignment rules |
| @ref PhosphorZones::IZoneDetector "IZoneDetector"             | Abstract cursor-to-zone resolver |
| @ref PhosphorZones::ZoneDetector "ZoneDetector"               | Concrete impl with adjacency-graph navigation |
| @ref PhosphorZones::ILayoutManager "ILayoutManager"           | Full layout CRUD + screen/VD/quick-slot surface |
| @ref PhosphorZones::ILayoutRegistry "ILayoutRegistry"         | Read-only layout enumeration (lighter than ILayoutManager) |
| @ref PhosphorZones::ILayoutPersistence "ILayoutPersistence"   | Load / save layout JSON |
| @ref PhosphorZones::IQuickLayouts "IQuickLayouts"             | Quick-layout slot (1–9) mapping |
| @ref PhosphorZones::ZoneHighlighter "ZoneHighlighter"         | Overlay highlight state machine |

## Typical use

```cpp
#include <PhosphorZones/ILayoutManager.h>
#include <PhosphorZones/ZoneDetector.h>

using namespace PhosphorZones;

ILayoutManager *mgr = /* injected */;
Layout current = mgr->activeLayoutForScreen(screenId);

// Detect which zone the cursor is over
ZoneDetector det;
det.setLayout(current);
QUuid hitZoneId = det.zoneAt(cursorPos, Qt::ShiftModifier);
if (!hitZoneId.isNull()) {
    Zone z = current.zoneById(hitZoneId);
    overlay.highlight(z);
}
```

## Design notes

- **Zone IDs are UUIDs, never indices** — reordering zones in the editor
  never orphans a persisted window-to-zone assignment.
- **Relative coordinates on disk** — zone rects in JSON are normalized
  (`0.0 – 1.0`), so the same layout works on any screen size.  Conversion to
  pixels happens at read-time.
- **`ILayoutRegistry` lighter than `ILayoutManager`** — consumers that only
  *read* layout data (e.g. the KCM screenshot preview) should prefer the
  smaller interface; mockability is much cheaper.

## Dependencies

- `QtCore`, `QtGui`
- @ref lib_phosphor_identity (window IDs for assignments)
- @ref lib_phosphor_layout_api (`ILayoutSource` + related)

## See also

- @ref PhosphorZones — full namespace reference
- @ref lib_phosphor_tiles — tiling algorithms consume the same `Layout` type
- @ref iface_org_plasmazones_LayoutManager — D-Bus facade over `ILayoutManager`
