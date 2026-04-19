@page lib_phosphor_config phosphor-config

<!-- SPDX-FileCopyrightText: 2026 fuddlesworth
     SPDX-License-Identifier: GPL-3.0-or-later -->

> Pluggable configuration backends — JSON-on-disk (default), QSettings, or a
> custom `IBackend` — with a schema-validated `Store` and a versioned
> migration runner.

## Responsibility

PlasmaZones's settings are structured: hierarchical groups (Snapping,
Snapping.Behavior, Snapping.Behavior.ZoneSpan…), typed values (bool, int,
color, string), defaults, validation.  `phosphor-config` gives consumers:

- **A `Store` front-end** with `value(key, default)` / `setValue(key, value)`
  over a **pluggable `IBackend`** — JSON file, QSettings, or an in-memory mock
- **Schema-driven validation** — the `Schema` declares the tree of groups
  and the type/range of each leaf.  Invalid values on load are rejected, not
  silently coerced
- **Versioned migrations** — `MigrationRunner` chains `v1 → v2 → v3 …`
  transforms against the raw JSON root.  Each schema-version bump lands one
  migration function; consumers never have to write per-key fallback reads
- **Group-path resolution** — `IGroupPathResolver` turns
  `"Snapping.Behavior.ZoneSpan.enabled"` into a lookup the backend
  understands, regardless of whether the backend stores by path or nested
  object

## Key types

| Type | Purpose |
|------|---------|
| @ref PhosphorConfig::Store "Store"                                   | Front-end API — value(), setValue(), watch() |
| @ref PhosphorConfig::IBackend "IBackend"                             | Abstract backend — JsonBackend / QSettingsBackend / mock |
| @ref PhosphorConfig::JsonBackend "JsonBackend"                       | Default: `~/.config/plasmazones/config.json` |
| @ref PhosphorConfig::QSettingsBackend "QSettingsBackend"             | QSettings-backed; useful in Qt-only (non-KF6) builds |
| @ref PhosphorConfig::Schema "Schema"                                 | Declarative group tree + leaf type/range constraints |
| @ref PhosphorConfig::MigrationRunner "MigrationRunner"               | Versioned JSON transforms, one function per schema bump |
| @ref PhosphorConfig::IGroupPathResolver "IGroupPathResolver"         | Dotted path → backend key mapping |

## Typical use

```cpp
#include <PhosphorConfig/Store.h>
#include <PhosphorConfig/JsonBackend.h>
#include <PhosphorConfig/Schema.h>

using namespace PhosphorConfig;

auto backend = std::make_unique<JsonBackend>(configPath);
Store settings(std::move(backend), Schema::plasmazonesDefault());

// Read a value with a type-safe default
bool zoneSpanEnabled =
    settings.value(QStringLiteral("Snapping.Behavior.ZoneSpan.enabled"), false).toBool();

// Write + auto-persist
settings.setValue(QStringLiteral("Snapping.Behavior.ZoneSpan.enabled"), true);

// React to any external change
connect(&settings, &Store::valueChanged,
        this, [](const QString &key) { qDebug() << "changed:" << key; });
```

Migrating between schema versions is one function per bump:

```cpp
// runs automatically on load if on-disk version < 2
MigrationRunner::registerStep(1, 2,
    [](QJsonObject &root) {
        // v1 had a single "snap.enabled" flag; v2 splits into per-edge flags.
        bool was = root.take(QStringLiteral("snap.enabled")).toBool();
        QJsonObject snap;
        snap.insert(QStringLiteral("left"),  was);
        snap.insert(QStringLiteral("right"), was);
        snap.insert(QStringLiteral("top"),   was);
        snap.insert(QStringLiteral("bottom"),was);
        root.insert(QStringLiteral("snap"), snap);
    });
```

## Design notes

- **No ad-hoc backwards compatibility** — the library enforces "one migration
  per schema bump, nothing else."  No per-key fallback reads outside migration
  functions.  Within a schema version, renaming a key = users get the default
  for the new key; no silent rescue.  Keeps the config-reading code trivial
- **Schema lives separately from defaults** — the `Schema` declares *what
  exists*; `ConfigDefaults` (in the application) declares *what value*.  Lets
  the KCM introspect the schema to generate UI without pulling in defaults
- **Backends are completely mockable** — tests construct a `Store` over an
  in-memory `IBackend` without touching disk

## Dependencies

- `QtCore` only.  Zero Phosphor deps — leaf library

## See also

- @ref PhosphorConfig — full namespace reference
- @ref iface_org_plasmazones_Settings — D-Bus facade over the Store
