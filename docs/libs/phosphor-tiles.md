@page lib_phosphor_tiles phosphor-tiles

<!-- SPDX-FileCopyrightText: 2026 fuddlesworth
     SPDX-License-Identifier: GPL-3.0-or-later -->

> Tiling algorithms — built-in (binary-split / master-stack / column / grid /
> spiral) plus a sandboxed JavaScript engine so users can ship their own tiling
> scripts.

## Responsibility

Zones are static layouts the user draws in the editor.  Autotiling is the
*dynamic* counterpart: as windows open and close, a tiling algorithm
recomputes the zone boundaries automatically.  `phosphor-tiles` owns that
algorithm surface.

- **Built-in algorithms** — implemented in C++ inside the library
- **Scripted algorithms** — JavaScript, loaded from
  `~/.local/share/plasmazones/algorithms/*.js` or the system data dir.  Sandboxed
  via `ScriptedAlgorithmSandbox` — no filesystem / network / process access,
  no direct Qt bindings; only the small APIs in
  `ScriptedAlgorithmJsBuiltins` are reachable from the script context
- **A layout source** — `AutotileLayoutSource` adapts an algorithm to the
  generic `ILayoutSource` interface from @ref lib_phosphor_layout_api so
  the rest of the stack treats autotile output as just another `Layout`
- **Preview rendering** — `AutotilePreviewRender` draws a minimal layout
  thumbnail directly on a `QPainter` context for layout-picker UI

## Key types

| Type | Purpose |
|------|---------|
| @ref PhosphorTiles::TilingAlgorithm "TilingAlgorithm"                 | Abstract base — concrete algorithms implement `layoutFor(Windows) -> Layout` |
| @ref PhosphorTiles::AlgorithmRegistry "AlgorithmRegistry"             | Name → algorithm factory; holds built-ins and scripted algos |
| @ref PhosphorTiles::AutotileLayoutSource "AutotileLayoutSource"       | Adapts a `TilingAlgorithm` to `ILayoutSource` |
| @ref PhosphorTiles::AutotilePreviewRender "AutotilePreviewRender"     | Paint-a-thumbnail helper for algorithm picker |
| @ref PhosphorTiles::ScriptedAlgorithm "ScriptedAlgorithm"             | `TilingAlgorithm` impl that delegates to a JS function |
| @ref PhosphorTiles::ScriptedAlgorithmLoader "ScriptedAlgorithmLoader" | Discovers `*.js` files, validates signatures, loads into sandbox |
| @ref PhosphorTiles::ScriptedAlgorithmSandbox "ScriptedAlgorithmSandbox" | QJSEngine subclass that strips dangerous globals |
| @ref PhosphorTiles::ScriptedAlgorithmJsBuiltins "ScriptedAlgorithmJsBuiltins" | The exact JS API scripts can call (math, window iteration, `makeZone(rect, slot)`) |

## Typical use

Register and run a scripted algorithm:

```cpp
#include <PhosphorTiles/AlgorithmRegistry.h>
#include <PhosphorTiles/AutotileLayoutSource.h>

using namespace PhosphorTiles;

AlgorithmRegistry reg;
reg.discoverBuiltins();                                      // master-stack, spiral, …
reg.discoverScripts(QStandardPaths::AppDataLocation);        // user *.js

auto alg = reg.algorithm(QStringLiteral("master-stack"));
AutotileLayoutSource src(alg);
// … feeds generated layouts into the same pipeline ZonesLayoutSource does.
```

A minimal scripted algorithm (`~/.local/share/plasmazones/algorithms/vstack.js`):

```js
// Single column, each window gets an equal vertical slice.
function layout(windows, screenRect) {
    const n = windows.length;
    if (n === 0) return [];
    const h = screenRect.height / n;
    return windows.map((w, i) => makeZone(
        { x: screenRect.x, y: screenRect.y + i * h,
          width: screenRect.width, height: h },
        i + 1  // quick-layout slot
    ));
}
```

## Design notes

- **JS sandbox is defensive** — no global `Qt`, `console`, `require`, `fetch`,
  `process`, etc.  Only the allowlist in `ScriptedAlgorithmJsBuiltins`.  A
  watchdog kills scripts that exceed CPU budget.
- **Algorithms consume positions, not window IDs** — they operate on a list
  of visible-window metadata, return a list of zones with associated slot
  numbers.  The consuming layer maps windows → zones afterward.  Lets the
  same algorithm drive preview rendering without owning window bindings.
- **Preview render is headless** — `AutotilePreviewRender` paints into a
  `QImage` the layout picker can use in `QListView` delegates.

## Dependencies

- `QtCore`, `QtGui`, `QtQml` (for `QJSEngine` in the sandbox)
- @ref lib_phosphor_layout_api (`ILayoutSource`)
- @ref lib_phosphor_zones (`Layout`, `Zone`)

## See also

- @ref PhosphorTiles — full namespace reference
- @ref iface_org_plasmazones_Autotile — D-Bus facade (enable/disable, algorithm selection, window ops)
