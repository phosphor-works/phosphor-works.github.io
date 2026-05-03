#!/usr/bin/env bash
# SPDX-FileCopyrightText: 2026 fuddlesworth
# SPDX-License-Identifier: GPL-3.0-or-later
#
# Build Phosphor API docs with Doxygen + doxygen-awesome-css theme.
#
# Usage:
#   ./scripts/build-docs.sh [--clean] [--open]
#
# Environment:
#   PHOSPHOR_SRC       Path to PlasmaZones3 checkout containing libs/phosphor-*
#                      (default: ../PlasmaZones3 relative to this repo root)
#   DOXYGEN_AWESOME    Tag of doxygen-awesome-css to fetch (default: v2.3.4)
#
# Output: ./api/html/  (gitignored)

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

# ── Flags ───────────────────────────────────────────────────────────────────
CLEAN=0
OPEN=0
for arg in "$@"; do
    case "$arg" in
        --clean) CLEAN=1 ;;
        --open)  OPEN=1  ;;
        -h|--help)
            sed -n '3,18p' "${BASH_SOURCE[0]}"
            exit 0
            ;;
        *) echo "unknown flag: $arg" >&2; exit 2 ;;
    esac
done

# ── Dependency check ────────────────────────────────────────────────────────
if ! command -v doxygen >/dev/null 2>&1; then
    cat >&2 <<EOF
error: doxygen not found on PATH.

Install with your package manager, e.g.:
    sudo pacman -S doxygen graphviz    # Arch / CachyOS
    sudo apt install doxygen graphviz  # Debian / Ubuntu
    sudo dnf install doxygen graphviz  # Fedora
    brew install doxygen graphviz      # macOS
EOF
    exit 1
fi
echo "doxygen: $(doxygen --version)"

# ── Source path ─────────────────────────────────────────────────────────────
: "${PHOSPHOR_SRC:=$(realpath "$ROOT/../PlasmaZones" 2>/dev/null || echo "")}"
if [ -z "$PHOSPHOR_SRC" ] || [ ! -d "$PHOSPHOR_SRC/libs" ]; then
    cat >&2 <<EOF
error: PHOSPHOR_SRC points at '$PHOSPHOR_SRC' but libs/ is missing.

Set PHOSPHOR_SRC to the path of the PlasmaZones checkout, e.g.:
    PHOSPHOR_SRC=\$HOME/src/PlasmaZones $0
EOF
    exit 1
fi
export PHOSPHOR_SRC
echo "PHOSPHOR_SRC: $PHOSPHOR_SRC"

# ── Fetch doxygen-awesome-css ───────────────────────────────────────────────
: "${DOXYGEN_AWESOME:=v2.3.4}"
CACHE="$ROOT/docs/.cache"
mkdir -p "$CACHE"

# Stamp file tracks which tag the cache represents so upgrading DOXYGEN_AWESOME
# re-fetches rather than silently mixing versions.
STAMP="$CACHE/.version"
if [ ! -f "$STAMP" ] || [ "$(cat "$STAMP" 2>/dev/null)" != "$DOXYGEN_AWESOME" ]; then
    echo "fetching doxygen-awesome-css $DOXYGEN_AWESOME..."
    BASE="https://raw.githubusercontent.com/jothepro/doxygen-awesome-css/$DOXYGEN_AWESOME"
    for f in \
        doxygen-awesome.css \
        doxygen-awesome-sidebar-only.css \
        doxygen-awesome-sidebar-only-darkmode-toggle.css \
        doxygen-awesome-darkmode-toggle.js \
        doxygen-awesome-fragment-copy-button.js \
        doxygen-awesome-paragraph-link.js \
        doxygen-awesome-interactive-toc.js
    do
        curl --fail --silent --show-error -L "$BASE/$f" -o "$CACHE/$f"
    done
    echo "$DOXYGEN_AWESOME" > "$STAMP"
else
    echo "doxygen-awesome-css $DOXYGEN_AWESOME: cached"
fi

# ── Fetch highlight.js + language packs ─────────────────────────────────────
# highlight.js runs client-side to syntax-highlight code blocks.  We fetch
# the core + a handful of language packs covering what we actually use
# (C/C++, QML, JS, CMake, JSON, TOML, bash, GLSL).  Vendoring keeps the
# docs buildable offline and deterministic once cached.
: "${HLJS_VERSION:=11.10.0}"
HLJS_CACHE="$CACHE/hljs"
HLJS_STAMP="$HLJS_CACHE/.version"
if [ ! -f "$HLJS_STAMP" ] || [ "$(cat "$HLJS_STAMP" 2>/dev/null)" != "$HLJS_VERSION" ]; then
    echo "fetching highlight.js $HLJS_VERSION..."
    mkdir -p "$HLJS_CACHE/languages"
    HLJS_BASE="https://cdn.jsdelivr.net/gh/highlightjs/cdn-release@${HLJS_VERSION}/build"
    curl --fail --silent --show-error -L \
        "$HLJS_BASE/highlight.min.js" -o "$HLJS_CACHE/highlight.min.js"
    for lang in qml cpp c javascript cmake json ini bash glsl; do
        curl --fail --silent --show-error -L \
            "$HLJS_BASE/languages/$lang.min.js" -o "$HLJS_CACHE/languages/$lang.min.js"
    done
    echo "$HLJS_VERSION" > "$HLJS_STAMP"
else
    echo "highlight.js $HLJS_VERSION: cached"
fi

# ── Clean if requested ──────────────────────────────────────────────────────
# Only wipe the doxygen-owned subtree; api/index.html is our hand-written
# landing page and is committed to the repo.
if [ "$CLEAN" = "1" ]; then
    rm -rf "$ROOT/api/html" "$ROOT/api/"*.tag 2>/dev/null || true
    rm -rf "$ROOT/docs/generated" 2>/dev/null || true
fi

# ── Generate D-Bus interface pages from introspection XML ───────────────────
# scripts/dbus-to-doxygen.py reads $PHOSPHOR_SRC/dbus/*.xml and emits one
# Markdown page per interface under docs/generated/dbus-raw/, plus an index
# page.  Output goes to the `-raw` staging dir so the subsequent fence
# preprocessor can rewrite fenced code blocks before doxygen sees them.
DBUS_DIR="$PHOSPHOR_SRC/dbus"
DBUS_RAW="$ROOT/docs/generated/dbus-raw"
if [ -d "$DBUS_DIR" ]; then
    echo "generating D-Bus API pages from $DBUS_DIR..."
    mkdir -p "$DBUS_RAW"
    "$ROOT/scripts/dbus-to-doxygen.py" "$DBUS_DIR" "$DBUS_RAW"
else
    echo "note: $DBUS_DIR not found, skipping D-Bus page generation"
fi

# ── Stage per-library READMEs as Doxygen pages ──────────────────────────────
# Source-of-truth for each library's hand-written explanation lives at
# $PHOSPHOR_SRC/libs/phosphor-<slug>/README.md so contributors edit it
# alongside the code and github.com renders it natively.  The staging
# script rewrites those READMEs into Doxygen @page sources by stripping
# the first heading, prepending an @page directive, and rewriting
# sibling-lib relative links into @ref anchors.
LIBS_RAW="$ROOT/docs/generated/libs-raw"
echo "staging library READMEs from $PHOSPHOR_SRC/libs ..."
mkdir -p "$LIBS_RAW" "$ROOT/docs/generated/dbus" "$ROOT/docs/generated/libs" "$ROOT/docs/generated/pages"
"$ROOT/scripts/readme-to-doxypage.py" "$PHOSPHOR_SRC/libs" "$LIBS_RAW"

# ── Preprocess Markdown fenced code blocks ──────────────────────────────────
# Doxygen's markdown handler strips fence language annotations
# (```qml, ```cpp, ```js) and renders every block as a bare
# <div class="fragment">, so highlight.js can't tell what grammar to use.
# The preprocessor rewrites each fence as @htmlonly + <pre><code
# class="hljs language-X"> which doxygen passes through verbatim;
# highlight.js picks up the language-X class at load time.
# Results land under docs/generated/dbus and docs/generated/libs, which
# are where Doxyfile's INPUT points.
echo "preprocessing markdown fences..."
"$ROOT/scripts/preprocess-md-fences.py" "$LIBS_RAW" "$ROOT/docs/generated/libs"
if [ -d "$DBUS_RAW" ]; then
    "$ROOT/scripts/preprocess-md-fences.py" "$DBUS_RAW" "$ROOT/docs/generated/dbus"
fi
# mainpage lives alone — copy into a single-file staging dir and process it
# (the preprocessor expects a directory input).
STAGE_MAIN="$CACHE/mainpage-stage"
mkdir -p "$STAGE_MAIN"
cp "$ROOT/docs/mainpage.md" "$STAGE_MAIN/mainpage.md"
"$ROOT/scripts/preprocess-md-fences.py" "$STAGE_MAIN" "$ROOT/docs/generated/pages"

# ── Run doxygen ─────────────────────────────────────────────────────────────
mkdir -p "$ROOT/api"
echo "running doxygen..."
doxygen "$ROOT/docs/Doxyfile"

# ── Copy highlight.js vendor files into api/html/ ───────────────────────────
# Doxygen's HTML_EXTRA_FILES flattens everything into api/html/, which would
# collapse highlight.js's languages/ subdirectory.  Instead, copy the vendored
# tree directly so relative paths (`hljs/languages/qml.min.js`) resolve.
if [ -f "$ROOT/api/html/index.html" ] && [ -d "$HLJS_CACHE" ]; then
    mkdir -p "$ROOT/api/html/hljs/languages"
    cp "$HLJS_CACHE/highlight.min.js" "$ROOT/api/html/hljs/"
    cp "$HLJS_CACHE/languages/"*.min.js "$ROOT/api/html/hljs/languages/"
fi

# ── Post-run summary ───────────────────────────────────────────────────────
HTML_ROOT="$ROOT/api/html/index.html"
if [ -f "$HTML_ROOT" ]; then
    SIZE=$(du -sh "$ROOT/api" | awk '{print $1}')
    COUNT=$(find "$ROOT/api/html" -name '*.html' | wc -l)
    echo
    echo "✓ API docs built"
    echo "  output:   $ROOT/api/html/"
    echo "  entry:    $HTML_ROOT"
    echo "  size:     $SIZE across $COUNT HTML files"
    # Wrapped in `if` so `OPEN=0` doesn't trip `set -e` on the last
    # command of the script (bash exits with the && chain's status).
    if [ "$OPEN" = "1" ] && command -v xdg-open >/dev/null; then
        xdg-open "$HTML_ROOT"
    fi
else
    echo "warn: expected $HTML_ROOT to exist after doxygen run" >&2
    exit 1
fi
