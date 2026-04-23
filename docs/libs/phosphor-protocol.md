@page lib_phosphor_protocol phosphor-protocol

<!-- SPDX-FileCopyrightText: 2026 fuddlesworth
     SPDX-License-Identifier: GPL-3.0-or-later -->

> Shared D-Bus service names, wire types, and client helpers.

## Responsibility

A daemon, a compositor-side plugin (such as a KWin effect), and a settings
UI all talk to each other over D-Bus. This library is the single place
that owns the shared wire surface, so magic strings and ad-hoc marshallers
don't proliferate across every consumer.

## Key types

| Type | Purpose |
|------|---------|
| @ref PhosphorProtocol::Service "ServiceConstants" | Canonical service name, object path, and interface names (`org.plasmazones.Autotile`, `.Screen`, `.Overlay`, …). |
| @ref PhosphorProtocol "WireTypes" | Enum + struct marshallers that cross D-Bus (drag policy, window IDs, zone rects). |
| @ref PhosphorProtocol::ClientHelpers "ClientHelpers" | Async-call utilities so compositor plugins aren't reimplementing `QDBusPendingCall` watcher boilerplate. |

## Design notes

- **One source of truth for interface names.** New compositor integrations
  depend on these constants instead of hand-rolling the string.
- **Wire compatibility is explicit.** Some enums serialize as their legacy
  strings (e.g. drag policy) so that rolling upgrades don't require an
  ApiVersion bump. Unknown wire values parse to a safe default rather
  than failing loudly.
- **Client helpers handle async correctly.** `callAsync(...)` wraps
  `QDBusPendingCallWatcher` setup, cancellation on destruction, and
  error routing so each call site is one line.

## Dependencies

- `QtCore`, `QtDBus`

## See also

- @ref PhosphorProtocol — full namespace reference
- @ref lib_phosphor_screens — `DBusScreenAdaptor` implements the `.Screen` interface from these constants.
