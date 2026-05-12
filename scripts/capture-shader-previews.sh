#!/usr/bin/env bash
# SPDX-FileCopyrightText: 2026 fuddlesworth
# SPDX-License-Identifier: GPL-3.0-or-later
#
# Capture per-shader .webm + .poster.png assets for the site gallery at
# public/plasmazones/shaders/<id>.webm and <id>.poster.png. Drives
# plasmazones-shader-render once per pack (rendering to a temporary mp4
# because direct rawvideo→libvpx-vp9 pipes crash mid-stream on some
# shaders), then transcodes the mp4 to webm and extracts a poster frame
# with ffmpeg. The shaders.astro gallery picks the assets up via
# import.meta.glob, so packs without a captured webm fall back to the
# placeholder gradient automatically.
#
# Requires:
#   - plasmazones-shader-render built (cmake -DBUILD_TOOLS=ON)
#   - ffmpeg on PATH
#   - PlasmaZones checked out at ../PlasmaZones (or set $PLASMAZONES_SRC)

set -euo pipefail

# Match the existing on-site captures: 960x540 @ 30fps for 15 seconds
# (450 frames). The poster is the third second so audio-reactive and
# time-driven shaders show a representative pose, not the boot frame.
readonly RESOLUTION="960x540"
readonly FRAMES=450
readonly FPS=30
readonly AUDIO_MODE="sine"
readonly LAYOUT="master-stack"
readonly POSTER_SECOND=3

site_root() {
    git -C "$(dirname "$0")" rev-parse --show-toplevel
}

SITE_ROOT="$(site_root)"
PLASMAZONES_SRC="${PLASMAZONES_SRC:-$(realpath "$SITE_ROOT/../PlasmaZones")}"
RENDERER=""
ONLY=()
DRY_RUN=0

usage() {
    cat <<EOF
Usage: $(basename "$0") [--renderer PATH] [--only ID]... [--dry-run]

Options:
    --renderer PATH   Path to plasmazones-shader-render (auto-detected
                      from \$PLASMAZONES_SRC/build/ if omitted)
    --only ID         Only capture this pack (repeatable; defaults to all)
    --dry-run         Print the commands that would run, don't execute
    -h, --help        Show this help

Env:
    PLASMAZONES_SRC   PlasmaZones repo root (default: ../PlasmaZones)
EOF
}

while [[ $# -gt 0 ]]; do
    case "$1" in
        --renderer)
            RENDERER="${2:?--renderer requires a path}"
            shift 2
            ;;
        --only)
            ONLY+=("${2:?--only requires a shader id}")
            shift 2
            ;;
        --dry-run)
            DRY_RUN=1
            shift
            ;;
        -h|--help)
            usage
            exit 0
            ;;
        *)
            echo "Error: unknown argument: $1" >&2
            usage >&2
            exit 1
            ;;
    esac
done

if [[ ! -d "$PLASMAZONES_SRC/data/shaders" ]]; then
    echo "Error: PlasmaZones data/shaders not found at $PLASMAZONES_SRC." >&2
    echo "       Set PLASMAZONES_SRC or symlink ../PlasmaZones to the checkout." >&2
    exit 1
fi

SHADER_DIR="$PLASMAZONES_SRC/data/shaders"
LAYOUT_DIR="$PLASMAZONES_SRC/data/layouts"
OUT_DIR="$SITE_ROOT/public/plasmazones/shaders"

if [[ -z "$RENDERER" ]]; then
    for candidate in \
        "$PLASMAZONES_SRC/build/bin/plasmazones-shader-render" \
        "$PLASMAZONES_SRC/build/tools/shader-render/plasmazones-shader-render"
    do
        if [[ -x "$candidate" ]]; then
            RENDERER="$candidate"
            break
        fi
    done
fi

if [[ -z "$RENDERER" || ! -x "$RENDERER" ]]; then
    echo "Error: plasmazones-shader-render not found." >&2
    echo "       Build it with: cmake -B build -DBUILD_TOOLS=ON && cmake --build build --target plasmazones-shader-render" >&2
    echo "       Or pass --renderer PATH." >&2
    exit 1
fi

if ! command -v ffmpeg >/dev/null 2>&1; then
    echo "Error: ffmpeg not on PATH." >&2
    exit 1
fi

mkdir -p "$OUT_DIR"
WORK_DIR="$(mktemp -d -t plasmazones-capture-XXXXXX)"
trap 'rm -rf "$WORK_DIR"' EXIT

collect_packs() {
    local pack
    for pack in "$SHADER_DIR"/*/; do
        local id
        id="$(basename "$pack")"
        [[ "$id" == "shared" ]] && continue
        [[ -f "$pack/metadata.json" ]] || continue
        echo "$id"
    done
}

if [[ ${#ONLY[@]} -gt 0 ]]; then
    PACKS=("${ONLY[@]}")
else
    mapfile -t PACKS < <(collect_packs)
fi

if [[ ${#PACKS[@]} -eq 0 ]]; then
    echo "Error: no shader packs found under $SHADER_DIR" >&2
    exit 1
fi

echo "Renderer: $RENDERER"
echo "Source:   $SHADER_DIR"
echo "Output:   $OUT_DIR"
echo "Packs:    ${#PACKS[@]} (${PACKS[*]})"
echo "Settings: ${RESOLUTION} @ ${FPS}fps, ${FRAMES} frames, audio=${AUDIO_MODE}, layout=${LAYOUT}"
echo

failed=()
for id in "${PACKS[@]}"; do
    pack_dir="$SHADER_DIR/$id"
    if [[ ! -f "$pack_dir/metadata.json" ]]; then
        echo "[skip] $id — no metadata.json under $pack_dir" >&2
        failed+=("$id")
        continue
    fi

    webm_out="$OUT_DIR/$id.webm"
    poster_out="$OUT_DIR/$id.poster.png"
    mp4_tmp="$WORK_DIR/$id.mp4"

    # Render to mp4 first. The rawvideo→libvpx-vp9 pipe path inside the
    # renderer crashes mid-stream for a handful of audio-reactive shaders
    # (cosmic-flow, fedora-drift, mosaic-pulse, nixos-drift, opensuse-drift,
    # voxel-terrain consistently fail around frame 426). libx264 from the
    # same renderer succeeds, and libvpx-vp9 happily transcodes an mp4
    # source. So the two-step costs an extra encode but works for every
    # pack.
    render_cmd=(
        "$RENDERER"
        --shader "$id"
        --layout "$LAYOUT"
        --shader-dir "$SHADER_DIR"
        --layout-dir "$LAYOUT_DIR"
        --resolution "$RESOLUTION"
        --frames "$FRAMES"
        --fps "$FPS"
        --audio-mode "$AUDIO_MODE"
        --out "$mp4_tmp"
    )

    transcode_cmd=(
        ffmpeg -y -loglevel error
        -i "$mp4_tmp"
        -c:v libvpx-vp9 -b:v 0 -crf 28 -row-mt 1 -deadline good
        "$webm_out"
    )

    poster_cmd=(
        ffmpeg -y -loglevel error
        -ss "$POSTER_SECOND" -i "$webm_out"
        -frames:v 1 "$poster_out"
    )

    echo "[render] $id → $webm_out"
    if (( DRY_RUN )); then
        printf '           %q ' "${render_cmd[@]}"
        printf '\n'
        printf '           %q ' "${transcode_cmd[@]}"
        printf '\n'
        printf '           %q ' "${poster_cmd[@]}"
        printf '\n'
        continue
    fi

    if ! "${render_cmd[@]}"; then
        echo "[fail]   $id — renderer exited non-zero" >&2
        failed+=("$id")
        continue
    fi

    if ! "${transcode_cmd[@]}"; then
        echo "[fail]   $id — webm transcode failed" >&2
        failed+=("$id")
        continue
    fi

    if ! "${poster_cmd[@]}"; then
        echo "[fail]   $id — poster extraction failed" >&2
        failed+=("$id")
        continue
    fi

    echo "[ok]     $id"
done

echo
if (( ${#failed[@]} > 0 )); then
    echo "Done with errors. Failed packs: ${failed[*]}" >&2
    exit 1
fi

echo "Done. Captured ${#PACKS[@]} pack(s) into $OUT_DIR."
