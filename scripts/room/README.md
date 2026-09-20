# Designed apartment

Editable source: `assets/blender/nikhil-designed-studio.blend`.
The room was modeled in the live Blender application through Blender MCP.
The central desk, calibrated MacBook, person-free composition, and camera rail
remain separate from the perimeter furnishings.

The source uses half-metre scene units. Modeling scripts describe coordinates
in the website's Y-up convention; `common.py` converts them to Blender Z-up.
Collection `09 - Designed living studio` contains the new editable geometry.
Replaced blockout furnishings are hidden in the older collections.

## Rebuild

The source file is the normal editing starting point. To reproduce the modeling
pass from `nikhil-nyc-studio.blend`, run each script with `common.py` prepended
through Blender MCP, in order:

1. `architecture.py`
2. `furniture.py`
3. `decor.py`
4. `finish.py`
5. `greenery.py`

Model creation scripts are not generally idempotent. Do not run them again on
the completed source. The compact-room transform in `finish.py` is guarded.

To export an edited source, run `common.py` + `export-prepare.py`, followed by
`common.py` + `export-bake.py`. The temporary evaluated mesh converts the curves,
fonts and modifiers without destroying the editable source. Contact shading
uses ten short hemisphere rays per cached surface sample, including the desk
and laptop as occluders. It is stored in `COLOR_0`; the runtime must retain that
attribute when merging geometries.

Then optimize the temporary GLB from the repository root:

```sh
bunx gltfpack@1.2.0 -i /tmp/nikhil-studio-unoptimized.glb -o public/journey/nyc-apartment.glb -cc -ce ext -vpf -vp 16 -vn 10 -vt 14 -vc 8 -si 0.6 -se 0.0001 -km
```

Float positions are intentional: `useStaticModel` applies world transforms to
vertex positions when batching. Tight simplification error preserves the small
modeled details. Meshopt compression, quantized shading attributes and redundant
geometry removal reduce the current asset to about 6.3 MB / 268k triangles / 50
material draws. No additional compression library is needed by the website.
Bump the room query string in `objects.tsx` after exporting.

The packed normal/roughness textures work in both Blender and glTF. Blender uses
Cycles global illumination; the website uses baked contact shading, a static
window shadow map, environment fill, and three warm practical lights. This is a
detailed real-time room, not a claim of identical rendering between engines.

For an offline Cycles review, without changing saved application preferences:

```sh
/Applications/Blender.app/Contents/MacOS/Blender --background assets/blender/nikhil-designed-studio.blend --threads 6 --render-output /tmp/designed-studio-preview --render-format PNG --render-frame 1
```

The saved source includes an overview camera and a small denoised preview
configuration. This command writes `/tmp/designed-studio-preview0001.png`.
Increase samples and resolution in Blender for a final offline render.
