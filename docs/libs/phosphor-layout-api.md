@page lib_phosphor_layout_api phosphor-layout-api

<!-- SPDX-FileCopyrightText: 2026 fuddlesworth
     SPDX-License-Identifier: GPL-3.0-or-later -->

> Layout description interfaces — the `ILayoutSource` seam plus the value
> types (algorithm metadata, edge-gaps, aspect-ratio classes, layout IDs,
> previews) that cross library boundaries.

## Responsibility

The zones library and the autotiling library both produce "a layout for this
screen at this moment."  They do it differently — zones from a user-drawn
JSON description, autotiling from a dynamic algorithm over the current window
set — but downstream consumers (the snap engine, the overlay, the KCM
previews) shouldn't care which source a layout came from.

`phosphor-layout-api` is the **tiny shared vocabulary** both sides agree on:

- **`ILayoutSource`** — the interface every layout producer implements.  One
  method: "given this screen + window-set, give me a `Layout`"
- **`LayoutId`** — stable string identifier that survives rename, because
  consumers (assignments, quick-layout slots) reference layouts across
  restarts
- **`AlgorithmMetadata`** — what a tiling algorithm declares about itself:
  display name, description, configurable parameters.  Lets the picker UI
  render entries for autotile algorithms uniformly
- **`AspectRatioClass`** — the three buckets layouts declare for screen-
  matching ("narrow / normal / wide"), so a narrow vertical monitor picks a
  different preset than an ultrawide
- **`EdgeGaps` + `GapKeys`** — spacing between zones (inner) and between
  zones + screen edge (outer), with well-known `GapKeys` constants for the
  JSON roundtrip
- **`CompositeLayoutSource`** — chains multiple sources (e.g. zones for
  screen 1, autotile for screen 2), presenting them as one logical source
- **`LayoutPreview`** — lightweight struct + free function that paints a
  thumbnail of any layout for the picker UI

## Key types

| Type | Purpose |
|------|---------|
| @ref PhosphorLayoutApi::ILayoutSource "ILayoutSource"                   | Abstract layout producer |
| @ref PhosphorLayoutApi::LayoutId "LayoutId"                             | Stable string identifier, value-semantic |
| @ref PhosphorLayoutApi::AlgorithmMetadata "AlgorithmMetadata"           | Tiling algorithm self-description |
| @ref PhosphorLayoutApi::AspectRatioClass "AspectRatioClass"             | Screen aspect bucket (Narrow / Normal / Wide) |
| @ref PhosphorLayoutApi::EdgeGaps "EdgeGaps"                             | Inner/outer spacing value type |
| `GapKeys`                                                               | JSON key constants for roundtrip |
| @ref PhosphorLayoutApi::CompositeLayoutSource "CompositeLayoutSource"   | Multiplexes several `ILayoutSource`s |
| @ref PhosphorLayoutApi::LayoutPreview "LayoutPreview"                   | Paint-a-thumbnail helper for pickers |

## Typical use

Implement a custom layout source:

```cpp
#include <PhosphorLayoutApi/ILayoutSource.h>

class MyLayoutSource : public PhosphorLayoutApi::ILayoutSource {
public:
    PhosphorZones::Layout layoutFor(
        const PhosphorLayoutApi::LayoutQuery &q) const override
    {
        PhosphorZones::Layout layout;
        // Populate zones based on q.screenRect, q.windows, q.activity…
        return layout;
    }

    PhosphorLayoutApi::LayoutId id() const override
    {
        return PhosphorLayoutApi::LayoutId{QStringLiteral("my-source")};
    }
};
```

Chain two sources for screens with different preferences:

```cpp
CompositeLayoutSource composite;
composite.addScreen("output-1", zonesSource);   // user-drawn
composite.addScreen("output-2", autotileSource);

ILayoutSource *combined = &composite;            // consumers don't know the difference
```

## Design notes

- **Zero Qt-GUI deps** — `ILayoutSource` is `QtCore` + `QtGui` (for `QRect`)
  only.  A headless test or a command-line tool can link against it without
  pulling in QML or Quick
- **Value-typed `LayoutId`** — `QString` would let two APIs disagree on
  case-sensitivity; wrapping enforces a single canonical form
- **`CompositeLayoutSource`** is how the daemon handles mixed-source setups
  without special-casing per-screen logic in the snap engine

## Dependencies

- `QtCore`, `QtGui`
- @ref lib_phosphor_identity (window IDs in `LayoutQuery`)

## See also

- @ref lib_phosphor_zones   — primary `ILayoutSource` implementation (`ZonesLayoutSource`)
- @ref lib_phosphor_tiles   — alternative implementation (`AutotileLayoutSource`)
