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
: "${PHOSPHOR_SRC:=$(realpath "$ROOT/../PlasmaZones3" 2>/dev/null || echo "")}"
if [ -z "$PHOSPHOR_SRC" ] || [ ! -d "$PHOSPHOR_SRC/libs" ]; then
    cat >&2 <<EOF
error: PHOSPHOR_SRC points at '$PHOSPHOR_SRC' but libs/ is missing.

Set PHOSPHOR_SRC to the path of the PlasmaZones3 checkout, e.g.:
    PHOSPHOR_SRC=\$HOME/src/PlasmaZones3 $0
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

# ── Clean if requested ──────────────────────────────────────────────────────
# Only wipe the doxygen-owned subtree; api/index.html is our hand-written
# landing page and is committed to the repo.
if [ "$CLEAN" = "1" ]; then
    rm -rf "$ROOT/api/html" "$ROOT/api/"*.tag 2>/dev/null || true
fi

# ── Run doxygen ─────────────────────────────────────────────────────────────
mkdir -p "$ROOT/api"
echo "running doxygen..."
doxygen "$ROOT/docs/Doxyfile"

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
    [ "$OPEN" = "1" ] && command -v xdg-open >/dev/null && xdg-open "$HTML_ROOT"
else
    echo "warn: expected $HTML_ROOT to exist after doxygen run" >&2
    exit 1
fi
