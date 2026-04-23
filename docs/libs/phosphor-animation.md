@page lib_phosphor_animation phosphor-animation

<!-- SPDX-FileCopyrightText: 2026 fuddlesworth
     SPDX-License-Identifier: GPL-3.0-or-later -->

> Window motion curves and animation controllers. Drives a window's
> position and size through a named curve (ease-out, critically-damped
> spring, custom Bézier) without pulling in `QPropertyAnimation`'s
> single-shape limitation.

## Responsibility

Qt's built-in animation system ties a property to one easing curve. For
snap animations we need:

- **Multiple curve families** (linear, eased-Bézier, critically-damped
  spring, stagger) and the ability to swap between them per profile.
- **Steps that report polymorphic state:** current position, velocity,
  whether the animation has settled, and whether terminal frame semantics
  apply.
- **A controller** that owns per-window animation state with reentrancy
  protection. `beginStep` and `endStep` bracket each evaluation so a
  curve mid-evaluation can't be replaced under it.

`phosphor-animation` supplies those pieces as a standalone library. A snap
engine such as the one in `phosphor-zones` owns a controller, feeds it
windows and target geometries, and the controller drives whatever curves
the current profile picks.

## Key types

| Type | Purpose |
|------|---------|
| @ref PhosphorAnimation::AnimationController "AnimationController" | Per-window animation lifecycle manager |
| @ref PhosphorAnimation::Curve "Curve"                             | Polymorphic base; every curve family implements `step()` returning `WindowMotion` |
| @ref PhosphorAnimation::CurveRegistry "CurveRegistry"             | Name-to-Curve factory; lets profiles reference curves by string |
| @ref PhosphorAnimation::Easing "Easing"                           | Cubic-Bézier curve family (ease-out, ease-in-out, etc.) |
| @ref PhosphorAnimation::Spring "Spring"                           | Critically-damped spring with configurable tension and friction |
| @ref PhosphorAnimation::Profile "Profile"                         | Named bundle of move-curve, resize-curve, settle-curve, and stagger |
| @ref PhosphorAnimation::ProfileTree "ProfileTree"                 | Hierarchical profile lookup with inheritance |
| @ref PhosphorAnimation::StaggerTimer "StaggerTimer"               | Schedules animation starts across a group of windows |
| @ref PhosphorAnimation::AnimationMath "AnimationMath"             | Shared math primitives: cubic-Bézier eval, distance metrics |

## Typical use

```cpp
#include <PhosphorAnimation/AnimationController.h>
#include <PhosphorAnimation/Profile.h>

using namespace PhosphorAnimation;

AnimationController controller;
controller.setProfile(ProfileTree::lookup(QStringLiteral("snap/default")));

// Kick off an animation toward a target geometry
controller.animate(windowId, fromRect, toRect);

// Each vsync, ask the controller for the current window geometry
while (controller.isAnimating(windowId)) {
    WindowMotion m = controller.step(windowId, elapsedMs);
    compositorBridge.moveResize(windowId, m.rect);
    if (m.settled) break;
}
```

## Design notes

- **Polymorphic step contract.** Every `Curve` returns a `WindowMotion`
  with position, velocity, and a `settled` flag. The controller doesn't
  know or care whether the underlying curve is a spring, an ease, or a
  user-defined Bézier.
- **Profiles are hierarchical.** `snap/default` inherits from `snap`, so
  a user can override one parameter without re-specifying the whole
  bundle.
- **Reentrancy-protected.** `AnimationController::step()` guards against
  being re-entered, for example via a signal handler that calls
  `animate()` again mid-step.

## Dependencies

- `QtCore` only.

## See also

- @ref PhosphorAnimation — full namespace reference
- @ref lib_phosphor_zones — a snap engine that can own the controller
