# Baked studio room

The website room is a **lightmapped** asset: Cycles renders global illumination,
sun, soft shadows and contact occlusion into texture atlases once, and three.js
draws the result unlit. This is the same idea as Henry Heffernan's portfolio.

Coordinates: Blender is Z-up with half-metre units (2 BU = 1 m; the desk top is
at z = 1.59 = 795 mm). three.js `(x, y, z)` = Blender `(x, z, -y)`. The web camera
orbits the desk axis at three `(0, *, -0.44)` = Blender `(0, 0.44)`.

## One-time setup

```sh
python3 scripts/room/fetch_polyhaven.py          # CC0 models, textures and sky HDRI -> assets/_local/polyhaven/
```

## Rebuild

From the repository root:

```sh
# 1. person-free room -> bake-ready source (lighting, window view, Poly Haven furniture, materials)
blender -b assets/_local/studio-clean.blend --python scripts/room/upgrade.py
#    -> assets/blender/studio.blend (git-ignored)

# 2. bake + export (about 45 min on an M4 Pro GPU at 512 samples)
blender -b assets/blender/studio.blend --python scripts/room/bake.py -- --samples 512
#    add --with-statue to append collection "Statue" from assets/_local/statue/statue.blend
#    (or --with-statue path/to/file.blend) so it is lit, casts baked shadows and is exported

# 3. optional: render the shipped GLB the way the site should draw it and compare
blender -b --factory-startup --python scripts/room/preview_baked.py
#    -> assets/_local/bake-cache/preview-{start,overview,desk}.png
```

Outputs:

| file | what |
| --- | --- |
| `public/journey/studio-baked.glb` | one mesh + one baked atlas per group, meshopt geometry, WebP textures, `KHR_materials_unlit` |
| `public/journey/studio-baked.json` | `exposureScale`, `K`, per-group stats, notes for the runtime |
| `assets/blender/review-cycles-overview.png` | Cycles ground truth, "Apartment overview camera", 1600x1000 |
| `assets/blender/review-cycles-start.png` | Cycles ground truth, web start camera: three pos (-4.23, 3.2, -6.26) looking at (0, 2.48, -0.44), 40 deg vertical FOV |

Useful `bake.py` flags: `--quick` (quarter-size atlases, 64 samples, ~2 min end to end),
`--no-render` / `--render-only` (review renders), `--reuse` (skip baking when the
cached bake in `assets/_local/bake-cache/` matches the geometry), `--groups a,b`
(re-bake only these groups, reuse the rest), `--dry-run` (print the group
classification and texel densities), `--limit-groups a,b` (debug a subset).

## What `bake.py` does

1. Optionally appends the `Statue` collection.
2. Classifies every visible static object into a bake group:
   `architecture` (shell, window wall, kitchen run, door, media wall), `floor`
   (floor + rug), `furniture`, `desk` (desk, notebook, mug, solved cube, pencil),
   `decor`, `foliage` (alpha-tested leaves), `statue`. The laptop (collection
   `Collection`) stays in the scene as a shadow/occlusion caster and light source
   (screen) but is not exported; the site keeps `macbook-air-calibrated.glb`.
3. Joins an evaluated copy of each group, fixes inward-facing normals (Cycles
   bakes from the normal side), and builds a `Lightmap` UV: smart project,
   equalised texel density, per-island importance weights (desk props x1.7,
   desk legs x0.45, undersides x0.2, ceiling x0.7), packed with 4 px (4096) /
   2 px (2048) margins. Original UVs stay render-active so textures still sample.
4. Bakes on the GPU: `COMBINED` with diffuse direct + indirect + colour +
   emission + transmission (glossy excluded: it is view dependent), plus albedo
   and normal passes. OIDN (compositor Denoise, albedo + normal guided) cleans
   the radiance. Metals bake as their base colour (diffuse) so they don't go black.
   Foliage gets an extra EMIT bake of material alpha for alpha testing.
5. Headroom: 8-bit textures clip at 1.0, so texture = linear radiance x `K`,
   with `K` chosen so the 98th-percentile texel lands at 0.95; the brightest
   (sunlit) ~2 % roll off with a soft knee instead of clipping. The runtime
   multiplies colour by `exposureScale = 1/K`.
6. Exports glTF (single UV set, no normals, WebP q90) and runs
   `gltfpack -cc -vpf -vtf -kn -km` (meshopt, float positions/UVs so no
   texture transforms), then patches in `KHR_materials_unlit`, `doubleSided`,
   foliage `alphaMode: MASK`, and `asset.extras.exposureScale`.

## Runtime contract

- Use `MeshBasicMaterial` (GLTFLoader already does for `KHR_materials_unlit`),
  keep `map` in sRGB, and set `material.color.setScalar(exposureScale)`. With
  `AgXToneMapping` and `toneMappingExposure = 1` the result matches the Blender
  AgX review renders (Blender exposure 0).
- `studio-foliage`: `alphaTest = 0.5`, double sided.
- `studio-window-view` is the skyline backdrop (a 200 degree cylinder of radius
  17 m around the camera axis), encoded the same way.
- Do not add scene lights, shadows or environment lighting to these meshes; it is
  all in the textures. Dynamic objects (the laptop) can keep their own PBR
  lighting.

## Scene notes (`upgrade.py`)

- Light: Poly Haven "Qwantani Late Afternoon (Pure Sky)" rotated so the 19 degree
  sun rakes in from the right of the skyline across the rug and desk; the window
  opening is a Cycles light portal; the lounge lamp, paper lantern and shelf
  spill stay as warm practicals; ceiling downlights are off.
- Window view: `assets/_local/unused-public/manhattan-view.png` (AI-generated
  Manhattan plate) extended into a panorama (`assets/_local/window-view-pano.png`)
  on a camera-visible-only emissive cylinder; the room is lit by the sky HDRI.
  No Poly Haven HDRI offers an elevated Manhattan-style skyline, so the plate
  stays for the view.
- Desk: light silver-oak veneer top and legs (Poly Haven texture, world-box UVs,
  1 m tile), no visible hardware. Notebook in cream cloth with the BITS Pilani
  mark centred on the front board, elastic at the fore edge, pencil beside it.
- Sofa in cream boucle (Curly Teddy Natural), rug in desaturated cream fleece.
- Poly Haven models: mid-century lounge chair (window corner), potted plant 01
  (window corner), potted plant 02 (east wall), calathea (by the sofa), three
  white ceramic vases. Plants and vases are decimated for the web budget; small
  bevels/curves elsewhere are reduced (lighting is baked, so they only cost
  triangles).
- The old per-vertex contact-shading export (`export-prepare.py`,
  `export-bake.py`) and the MCP modelling scripts (`architecture.py` ...
  `greenery.py`, `common.py`) produced `studio-clean.blend`; they are kept for
  history but are no longer part of the build.
