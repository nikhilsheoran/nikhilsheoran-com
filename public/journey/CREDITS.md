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
