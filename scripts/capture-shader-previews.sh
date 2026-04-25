#!/usr/bin/env bash
# SPDX-FileCopyrightText: 2026 fuddlesworth
# SPDX-License-Identifier: GPL-3.0-or-later
#
# Capture shader video previews for the /plasmazones/shaders/
# gallery page.  Uses PlasmaZones's own Overlay.showShaderPreview
# D-Bus method so the user's layouts + active shaders are never
# touched — this just draws a floating preview rect, we record it,
# encode to webm, and hide the preview.
#
# Requirements (checked below):
#   - PlasmaZones daemon running (systemctl --user status plasmazones)
#   - qdbus6 (Qt6 D-Bus CLI)
#   - jq (parses shader metadata JSON)
#   - wf-recorder (preferred) OR gpu-screen-recorder (fallback)
#   - ffmpeg (re-encode MP4 -> webm, generate poster PNG)
#
# For audio-reactive shaders, pipe any audio into CAVA before
# running (a silent track plays fine but will produce flat
# spectra; a music loop gives visible motion).  Categories that
# use the spectrum are tagged as Audio Visualizer in shaders.json.
#
# Output:
#   public/plasmazones/shaders/<id>.webm     ~500KB 5s 480x270 VP9
#   public/plasmazones/shaders/<id>.poster.png  ~40KB frame 0
#
# Usage:
#   scripts/capture-shader-previews.sh                  # capture missing
#   scripts/capture-shader-previews.sh --force          # recapture all
#   scripts/capture-shader-previews.sh --only neon-city # one shader
#
# Typical run time: ~8s per shader (5s capture + 3s encode) so
# a full sweep of 26 shaders is ~3½ minutes.

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SHADER_JSON="${ROOT}/src/data/plasmazones/shaders.json"
OUT_DIR="${ROOT}/public/plasmazones/shaders"

# ── Preview geometry ───────────────────────────────────────────────
# 960x540 capture, downscaled to 480x270 in the webm so the source
# is 2x the target (crisp on HiDPI) without paying for 1080p
# throughout.  Shader-preview is a floating overlay — positions in
# screen pixel coords on whichever output is focused.
PREVIEW_X=200
PREVIEW_Y=150
PREVIEW_W=960
PREVIEW_H=540

# 5 seconds at 30fps = 150 frames.  Long enough for audio-reactive
# shaders to surface one beat; short enough to keep webm size down.
DURATION=5
FPS=30

# Output dimensions + encoder settings.
OUT_W=480
OUT_H=270
VP9_BITRATE=600k

FORCE=0
ONLY=""
RECORDER_OVERRIDE=""
while [ $# -gt 0 ]; do
    case "$1" in
        --force) FORCE=1; shift ;;
        --only) ONLY="$2"; shift 2 ;;
        --recorder) RECORDER_OVERRIDE="$2"; shift 2 ;;
        -h|--help) sed -n '3,40p' "${BASH_SOURCE[0]}"; exit 0 ;;
        *) echo "unknown flag: $1" >&2; exit 2 ;;
    esac
done

# ── Dependency checks ─────────────────────────────────────────────
need() {
    command -v "$1" >/dev/null 2>&1 || { echo "error: $1 not on PATH" >&2; exit 1; }
}
need qdbus6
need jq
need ffmpeg

# Pick a recorder.  wf-recorder is wlroots-only (Sway, Hyprland,
# river, wayfire) — it WILL silently produce zero-byte files on
# KDE/KWin because it speaks wlr-screencopy, which KWin doesn't
# implement.  On KDE, use gpu-screen-recorder, which talks
# PipeWire via xdg-desktop-portal and works on every mainstream
# compositor.
detect_recorder() {
    if [ -n "${RECORDER_OVERRIDE}" ]; then
        if ! command -v "${RECORDER_OVERRIDE}" >/dev/null 2>&1; then
            echo "error: --recorder ${RECORDER_OVERRIDE} not on PATH" >&2
            exit 1
        fi
        echo "${RECORDER_OVERRIDE}"
        return
    fi

    local desktop="${XDG_CURRENT_DESKTOP:-}"
    local is_kde=0
    case ":${desktop,,}:" in
        *:kde:*|*:plasma:*) is_kde=1 ;;
    esac

    if [ "${is_kde}" = "1" ]; then
        # KDE: wf-recorder won't work.  Require gpu-screen-recorder.
        if command -v gpu-screen-recorder >/dev/null 2>&1; then
            echo "gpu-screen-recorder"
        else
            cat >&2 <<EOF
error: gpu-screen-recorder not on PATH.
       KDE/KWin needs a PipeWire-based recorder — wf-recorder is
       wlroots-only and silently produces zero bytes here.

       Arch:   sudo pacman -S gpu-screen-recorder
       Fedora: sudo dnf install gpu-screen-recorder
       Other:  https://git.dec05eba.com/gpu-screen-recorder/
EOF
            exit 1
        fi
    else
        # wlroots compositors — prefer wf-recorder, fall back to gsr.
        if command -v wf-recorder >/dev/null 2>&1; then
            echo "wf-recorder"
        elif command -v gpu-screen-recorder >/dev/null 2>&1; then
            echo "gpu-screen-recorder"
        else
            echo "error: need wf-recorder or gpu-screen-recorder on PATH" >&2
            exit 1
        fi
    fi
}
RECORDER="$(detect_recorder)"
echo "using recorder: ${RECORDER} (XDG_CURRENT_DESKTOP=${XDG_CURRENT_DESKTOP:-unset})"

# Daemon up?
if ! qdbus6 org.plasmazones /PlasmaZones org.plasmazones.Control.getFullState >/dev/null 2>&1; then
    echo "error: plasmazonesd isn't responding on D-Bus." >&2
    echo "       systemctl --user status plasmazones.service" >&2
    exit 1
fi

# ── Per-shader capture ────────────────────────────────────────────
mkdir -p "${OUT_DIR}"
TMP_DIR="$(mktemp -d)"
trap 'rm -rf "${TMP_DIR}"; qdbus6 org.plasmazones /PlasmaZones org.plasmazones.Overlay.hideShaderPreview >/dev/null 2>&1 || true' EXIT

# Zones JSON the preview fills — one zone covering the whole
# preview rectangle.  Matches what Overlay expects (pixel coords,
# not normalized).
ZONES_JSON="[{\"x\":0,\"y\":0,\"width\":${PREVIEW_W},\"height\":${PREVIEW_H}}]"

capture_one() {
    local id="$1"
    local webm="${OUT_DIR}/${id}.webm"
    local poster="${OUT_DIR}/${id}.poster.png"

    if [ "${FORCE}" = "0" ] && [ -f "${webm}" ] && [ -f "${poster}" ]; then
        echo "[skip] ${id} (already captured, pass --force to redo)"
        return 0
    fi

    echo "[capture] ${id}"

    # Fetch default params as a JSON object, then translate to
    # uniform names the renderer wants.  qdbus6 returns QVariantMap
    # in a human-readable form; round-trip through jq to re-emit
    # as strict JSON.
    local params_json
    params_json="$(qdbus6 --literal org.plasmazones /PlasmaZones \
        org.plasmazones.Shader.defaultShaderParams "${id}" \
        2>/dev/null || echo '{}')"
    # translateShaderParams takes the map in and emits uniform-
    # keyed JSON.  The easiest shape is to pass an empty object
    # and let the daemon substitute defaults itself.
    local uniforms_json='{}'

    # Show the preview.  showShaderPreview takes:
    #   x y width height screenId shaderId shaderParamsJson zonesJson
    # Empty screenId = whichever screen contains (x, y).
    qdbus6 org.plasmazones /PlasmaZones \
        org.plasmazones.Overlay.showShaderPreview \
        "${PREVIEW_X}" "${PREVIEW_Y}" "${PREVIEW_W}" "${PREVIEW_H}" \
        "" "${id}" "${uniforms_json}" "${ZONES_JSON}" \
        >/dev/null

    # Small settle so the first frame isn't a half-composited
    # shader (some multipass effects need 1-2 frames before their
    # buffers are primed).
    sleep 0.4

    # Record.  Recorder output goes to stderr so real failures are
    # visible — wf-recorder / gpu-screen-recorder both print
    # actionable messages ("Failed to open Wayland display",
    # "Portal permission denied") that used to get swallowed.
    local raw="${TMP_DIR}/${id}.mp4"
    local filter
    case "${RECORDER}" in
        wf-recorder)
            # wf-recorder records just the rect, so ffmpeg only
            # needs to scale.  On KDE this produces nothing —
            # guarded against above by detect_recorder.
            timeout "${DURATION}s" wf-recorder \
                -g "${PREVIEW_X},${PREVIEW_Y} ${PREVIEW_W}x${PREVIEW_H}" \
                -r "${FPS}" \
                -f "${raw}" \
                2>&1 | sed 's/^/    wf-recorder: /' || true
            filter="scale=${OUT_W}:${OUT_H}:flags=lanczos"
            ;;
        gpu-screen-recorder)
            # gsr records the whole screen (or a named output);
            # ffmpeg crops to the preview rect then scales.
            # "-w screen" auto-selects a PipeWire source via the
            # portal — first run prompts for permission, subsequent
            # runs remember the grant.
            timeout "${DURATION}s" gpu-screen-recorder \
                -w screen \
                -f "${FPS}" \
                -o "${raw}" \
                2>&1 | sed 's/^/    gpu-screen-recorder: /' || true
            filter="crop=${PREVIEW_W}:${PREVIEW_H}:${PREVIEW_X}:${PREVIEW_Y},scale=${OUT_W}:${OUT_H}:flags=lanczos"
            ;;
    esac

    qdbus6 org.plasmazones /PlasmaZones \
        org.plasmazones.Overlay.hideShaderPreview >/dev/null

    if [ ! -s "${raw}" ]; then
        echo "  ${id}: recorder produced no output, skipping" >&2
        return 0
    fi

    # Re-encode to VP9 webm.  -crf 34 is a good size/quality knob
    # for subtle-motion shaders; drop to 30 for busier effects
    # (spectrum-bloom, spectrum-pulse).
    ffmpeg -y -nostdin -loglevel error \
        -i "${raw}" \
        -vf "${filter}" \
        -c:v libvpx-vp9 -b:v "${VP9_BITRATE}" -crf 34 -row-mt 1 \
        -pix_fmt yuv420p -an \
        "${webm}"

    # Poster: single frame 1 second in so audio-reactive shaders
    # have had a chance to settle into something representative.
    ffmpeg -y -nostdin -loglevel error \
        -ss 1 -i "${webm}" -frames:v 1 \
        -vf "scale=${OUT_W}:${OUT_H}:flags=lanczos" \
        "${poster}"

    printf "  ok: %s (%s / %s)\n" "${id}" \
        "$(du -h "${webm}" | cut -f1)" \
        "$(du -h "${poster}" | cut -f1)"
}

# Iterate shaders.
if [ -n "${ONLY}" ]; then
    capture_one "${ONLY}"
else
    count=$(jq 'length' "${SHADER_JSON}")
    idx=0
    jq -r '.[].id' "${SHADER_JSON}" | while read -r id; do
        idx=$((idx + 1))
        printf "[%d/%d] " "${idx}" "${count}"
        capture_one "${id}"
    done
fi

echo
echo "done. Videos in ${OUT_DIR#${ROOT}/}/"
