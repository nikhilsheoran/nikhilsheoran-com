# Asset credits

CC0 assets from Poly Haven, https://polyhaven.com/license . Downloaded 2026-09-19.

- `diffuse.jpg` (4K), `nor_gl.jpg` and `roughness.jpg` (2K): Wood Table 001, Dimitrios Savva / Rico Cilliers. https://polyhaven.com/a/wood_table_001
- `studio_small_09_1k.hdr`: Studio Small 09, Sergej Majboroda. https://polyhaven.com/a/studio_small_09

Files were downloaded from the asset URLs returned by https://api.polyhaven.com/files/wood_table_001 and https://api.polyhaven.com/files/studio_small_09 .

- `macbook-air-2017.glb`: original model authored for this project in Blender; editable source and generator are in `assets/blender/` and `scripts/build-studio.py`. Proportions reference https://support.apple.com/en-ca/111924 . Not manufacturer CAD.
- `action-play.svg`, `action-x.svg`, `action-external.svg`: Phosphor Icons, MIT license, generated from the installed `@phosphor-icons/react` package. Full notice: `PHOSPHOR-LICENSE.txt`. https://github.com/phosphor-icons/react

- `studio-furniture.glb`: original Blender-authored desk, chair and props. Embeds the credited Poly Haven wood maps and an original procedural upholstery normal map. Detailed source: `assets/blender/nikhil-studio-detailed.blend`.

## September 20 daylight apartment update

- `nyc-apartment.glb`: original Blender set: pale oak floor, window wall, sofa, shelves, kitchen and nearby rooftop geometry. Source: `assets/blender/nikhil-nyc-studio.blend`; generator: `scripts/build-nyc-loft.py`.
- `manhattan-view.png`: AI-generated Manhattan-inspired skyline backplate, 2172 × 724 pixels. It is an illustrative view, not documentation of an actual apartment or exact address.
- `bits-pilani-logo.png`: official BITS Pilani website asset, https://www.bits-pilani.ac.in/wp-content/uploads/bits-pillani-logo.png . Used as a notebook-cover mark. Trademark belongs to BITS Pilani.
- `studio-furniture.glb`: now uses an original embedded pale-oak grain texture in place of the dark Poly Haven wood material.
- `nikhil-seated.glb`: modified Blender Studio Human Base Meshes v1.4.1 anatomical foundation (CC0), https://studio.blender.org/assets/ . Locally fitted face from user-provided reference; custom seated deformation, clothing regions and hair. Reference stature: 181 cm. This is an approximate likeness study, not a body scan. The weight/body-fat values do not uniquely determine circumferences or facial geometry.
- The original reference photos remain local and git-ignored. Only the fitted facial UV crop is embedded in the human model.

## September 20 refinement

- The floor is now an original off-white mineral finish with an undyed woven rug. The apartment includes modeled curtains, hardware, kitchen fittings, furniture details, original framed prints and a 57 mm cube scrambled with legal face turns. `scripts/refine-apartment.py` creates these original details.
- The flat facial patch was replaced with a complete head fitted locally using the official KeenTools FaceBuilder 2026.3.1 add-on, https://keentools.io/products/facebuilder-for-blender . The user approved the vendor EULA and its free 15-day trial. No paid subscription was started. Three supplied photographs were aligned locally; only the derived facial UV atlas is exported. Private source images and fitting state remain under the ignored `assets/references/` directory.
- `scripts/refine-character.py` adds separate cotton garments, woven normal maps, revised resting hands and geometric hair. `scripts/export-refined-character.py` consolidates editable source pieces into six browser material batches with meshopt compression (about 5 MB). `scripts/finish-trousers.py` replaces incomplete trouser regions with continuous seated legs. The FaceBuilder fit materially improves the head but does not make this a metrically validated body scan; the procedural hair and garments remain an artist approximation.
- Blender uses Cycles for offline renders. The website uses real-time Three.js rasterization with AgX tone mapping, environmental lighting, shadow maps and restrained HDR bloom. It does not reproduce Cycles' full indirect illumination. Depth softening is limited to distant flying panels; the room and laptop are no longer globally blurred.

## September 20 camera refinement

- The seated character is no longer loaded or rendered by the website. Its two collections are hidden in the editable Blender apartment scene; the earlier assets are retained for history.
- Camera and fabric panels now share one fixed helix axis. The camera path ends at the interactive display pose, with continuous spring-driven scroll and reversible eased click transitions. Static room shadows are cached, and the stationary 3D backdrop stops rendering while the Mac is in use.

## September 20 shallow helix and desk finishes

- Panels retain the earlier reading trajectory on a tighter, shallow helix, passing against the camera's rotation with radial orientation and a maximum seven-degree correction toward it. Larger bounded artwork keeps nearby chapters readable. The screen remains interactive from a distance; the final panel fade triggers the camera approach.
- `scripts/refine-desk-finish.py` restores all six cube faces to solved colors, removes remaining wooden floor trim, and uses a plain off-white mineral floor. It also increases and tints the Apple emission pink. `scripts/finalize-desk-assets.py` preserves that tint in glTF after Blender export without changing the source emission mask or geometry.

## September 25 baked studio (`studio-baked.glb`)

Lighting, shadows and bounce light are baked with Blender Cycles into the texture atlases of `studio-baked.glb` (generator: `scripts/room/upgrade.py`, `scripts/room/bake.py`). CC0 assets from Poly Haven, https://polyhaven.com/license , downloaded 2026-09-25 through https://api.polyhaven.com (`scripts/room/fetch_polyhaven.py`). Their textures are baked into the atlases; the original files are not redistributed.

- Sky lighting: Qwantani Late Afternoon (Pure Sky), Greg Zaal (photography) and Jarod Guest (processing). https://polyhaven.com/a/qwantani_late_afternoon_puresky
- Mid Century Lounge Chair, Kuutti Siitonen. https://polyhaven.com/a/mid_century_lounge_chair
- Potted Plant 01, Rico Cilliers. https://polyhaven.com/a/potted_plant_01
- Potted Plant 02, Rico Cilliers. https://polyhaven.com/a/potted_plant_02
- Calathea Orbifolia 01, Rob Tuytel and Rico Cilliers. https://polyhaven.com/a/calathea_orbifolia_01
- Ceramic Vase 01, 03 and 04, James Ray Cock. https://polyhaven.com/a/ceramic_vase_01 , https://polyhaven.com/a/ceramic_vase_03 , https://polyhaven.com/a/ceramic_vase_04
- Silver Oak Veneer 01 (desk), Jenelle van Heerden. https://polyhaven.com/a/silver_oak_veneer_01
- Curly Teddy Natural (sofa boucle), colormass and Rico Cilliers. https://polyhaven.com/a/curly_teddy_natural
- Polar Fleece (rug), colormass and Rico Cilliers. https://polyhaven.com/a/polar_fleece

The window view in `studio-baked.glb` is the AI-generated Manhattan-inspired plate credited above (`manhattan-view.png`), mirrored at its far edges and extended with a sky gradient into a panorama. The BITS Pilani mark on the notebook is the official asset credited above. All other room geometry is original Blender work.
