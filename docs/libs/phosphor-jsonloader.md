@page lib_phosphor_jsonloader phosphor-jsonloader

<!-- SPDX-FileCopyrightText: 2026 fuddlesworth
     SPDX-License-Identifier: GPL-3.0-or-later -->

> Directory watcher and JSON parser for user-editable on-disk schemas.

## Responsibility

Several Phosphor libraries need the same pattern: walk a directory, parse
each JSON file into a typed record, watch the directory for live edits,
debounce rescans, and apply user files that shadow bundled files of the
same ID. `phosphor-jsonloader` owns that pattern once so curve-loader,
profile-loader, and any future user-schema loader can stay focused on
parsing.

## Key types

| Type | Purpose |
|------|---------|
| @ref PhosphorJsonLoader::DirectoryLoader "DirectoryLoader" | Directory walk, `QFileSystemWatcher` install, 50 ms debounced rescan, user-wins-collision bookkeeping. |
| @ref PhosphorJsonLoader::IDirectoryLoaderSink "IDirectoryLoaderSink" | Consumer strategy with two methods: `parseFile()` for one entry, `commitBatch()` for the full rescan. |
| @ref PhosphorJsonLoader::ParsedEntry "ParsedEntry" | Parse-result value type carrying source-path metadata. |

## Typical use

```cpp
class CurveLoaderSink : public IDirectoryLoaderSink {
    std::optional<ParsedEntry> parseFile(const QString& path) override { /* parse one curve */ }
    void commitBatch(const QList<ParsedEntry>& all, const QStringList& removed) override {
        // Emit one reloadAll() signal for the whole scan.
    }
};

DirectoryLoader loader(QStringList{ bundledDir, userDir }, DirectoryWatchPolicy::On);
loader.setSink(new CurveLoaderSink{...});
loader.rescan();
```

## Design notes

- **Watcher is opt-in.** `DirectoryWatchPolicy::On` installs a
  `QFileSystemWatcher` on every scanned directory (or its parent, if the
  target doesn't exist yet, so fresh installs that create the user-data
  dir later still pick up edits without a restart). `Off` disables it.
- **`commitBatch` is the one mutation point.** The sink only touches its
  target registry inside `commitBatch`, so bulk signals (e.g. a QML
  `reloadAll`) coalesce to one emit per scan.
- **User wins on collision.** When a bundled file and a user file share
  an ID, the user file is the one that commits.

## Dependencies

- `QtCore`

## See also

- @ref PhosphorJsonLoader — full namespace reference
- @ref lib_phosphor_animation — curve and profile loaders are sinks on a `DirectoryLoader`.
