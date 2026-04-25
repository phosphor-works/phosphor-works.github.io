# Shader previews

`.webm` and `.poster.png` files for each bundled shader, rendered
from a live PlasmaZones instance and encoded to a 480x270 VP9 clip
plus a single frame poster.

Generate or refresh with:

```
npm run capture:shaders                    # capture any missing
npm run capture:shaders -- --force         # recapture all
npm run capture:shaders -- --only neon-city  # one shader
```

Needs a running `plasmazones.service`, `qdbus6`, `jq`, `ffmpeg`,
and either `wf-recorder` or `gpu-screen-recorder` on PATH.

See `scripts/capture-shader-previews.sh` for the full recipe.
