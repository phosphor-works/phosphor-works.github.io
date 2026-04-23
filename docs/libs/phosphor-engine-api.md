@page lib_phosphor_engine_api phosphor-engine-api

<!-- SPDX-FileCopyrightText: 2026 fuddlesworth
     SPDX-License-Identifier: GPL-3.0-or-later -->

> Unified placement-engine interface a daemon can dispatch through.

## Responsibility

Both manual snap-mode (zone assignments) and automatic autotile-mode (tiling
algorithms) do the same kinds of things when a user hits a shortcut: move
focus, swap windows, assign to a zone, react to a window opening or
closing. Without a shared interface, a daemon has to branch on the current
mode for every such event. `phosphor-engine-api` names each of those
operations as a user *intent* and lets each engine fulfil the intent in
its own terms, so the daemon's hot path is a single polymorphic call.

## Key types

| Type | Purpose |
|------|---------|
| @ref PhosphorEngineApi::IPlacementEngine "IPlacementEngine" | Contract both `SnapEngine` and the autotile engine implement. Methods name intents, not implementation steps. |
| @ref PhosphorEngineApi::IPlacementState "IPlacementState"   | Read-only per-screen state contract. The persistence layer and D-Bus adaptor consume this without caring which mode produced it. |
| @ref PhosphorEngineApi::NavigationContext "NavigationContext" | Target window and screen for an intent. Populated by the daemon from compositor shadow state. |

## Design notes

- **Interface names intents, not steps.** "Move focused window left" has
  different meaning in tile-swap vs. zone-snap mode; the interface just
  names the user's request and each engine does what it needs.
- **Idempotent on empty context.** Every method accepts a
  `NavigationContext` whose fields may be empty on very-early-startup
  shortcuts or when no window is focused. Each engine emits navigation
  feedback with a sensible reason code rather than erroring out.
- **Mutation stays engine-specific.** `IPlacementState` is deliberately
  read-only plus serialization. Mutation goes through engine-specific
  APIs like `SnapState::assignWindowToZone` and `TilingState::addWindow`,
  because the semantics diverge.

## Dependencies

- `QtCore`

## See also

- @ref PhosphorEngineApi — full namespace reference
- @ref lib_phosphor_zones — `SnapState` implements `IPlacementState`.
- @ref lib_phosphor_tiles — `TilingState` implements `IPlacementState`.
