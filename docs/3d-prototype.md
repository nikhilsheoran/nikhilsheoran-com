# 3D portfolio prototype

The homepage now introduces the existing macOS portfolio through an ascending, tightening camera helix and upward-moving photographic cloth surfaces. Existing `/notes/...`, `/finder`, `/music`, and other deep links still open the desktop directly.

## Try it

Run `bun dev` and open the server's root URL (the current development server is at http://localhost:3001/).

- Scroll, swipe, or drag horizontally/vertically through the same 1.4-turn helix. Dragging tracks the pointer directly with a small release momentum and suppresses accidental panel clicks. Radius decreases throughout the path, which is computed backward from the final desk framing. There is no separate final zoom or automatic fullscreen entry.
- Three cloth panels are present from the opening frame. A continuous travelling visibility window draws at most three, with the current chapter sharpest and quieter surrounding panels filtered for depth. Hover a panel to spread color quickly from the initial hit point with a soft edge, without rings or refraction. Gentle pointer-following deformation remains. The YouTube/X icon and external arrow are printed into the same surface shader, inheriting its folds, light, depth and blur. A conservative projected-size limit shrinks panels near the camera, including clearance for curled edges. Click the cloth or its accessible caption link to open a new tab.
- Hover the laptop for 350 ms or tap it to focus. The screen remains inside its physical bezel, with a surrounding hover-out margin. Moving into that margin returns to the previous scene position after a 180 ms grace period.
- Dragging inside the desktop holds the camera until release. Escape and **Back to the desk** provide explicit return controls; the same iframe preserves open windows and notes.
- Year buttons and a range input support keyboard/touch navigation. A keyboard-focusable screen action replaces the removed visible “Enter my Mac” button. Reduced motion makes camera transitions and color reveals immediate, and stops cloth flutter.
- The black profile strips use the requested description and existing social URLs.

## What is real, and what is provisional

The camera helix, reverse screen approach, shader-deformed fabric, point-anchored grayscale/color reveal, and live desktop inside the 3D screen are implemented. A depth-buffer post-process adds selective focus and camera-reprojection motion blur, with subtle grain and vignette. Pointer movement adds restrained camera parallax. The WebGL scene continues rendering while the focused screen is interactive. The iframe stays mounted throughout.

The figure remains the original procedural placeholder. Furniture and props now load an original Blender-authored GLB: a beveled walnut desk with welded frame, feet and cable tray; a contoured upholstered chair with piping, supports and dual casters; and a hollow ceramic mug, notebook with page edges, pencil and curved-leaf plant. The person is **not a likeness**. The laptop now loads an original Blender-authored GLB with a tapered aluminum body, 78 labeled keys, trackpad, ports and bezel details. Its proportions use published 2017 Air specifications; it is an approximation, not manufacturer CAD or a finished production model. Cloth is animated with broad billows, ripples, curled edges, scroll-velocity deformation, surface-normal lighting, and fine print grain. It is not a physical cloth simulation. Motion blur derives from camera motion and scene depth, not per-object cloth motion vectors.

The laptop now contains the actual interactive website in a same-origin `/desktop` iframe, projected onto the screen's corners. A WebGL alpha opening provides occlusion by the bezel, person, and other scene objects. The projected iframe never expands beyond the physical screen. Reflections, edge shadows, subtle pixel texture, and restrained display color grading keep it visually integrated. The old canvas screenshot is retained only while the iframe loads. The iframe uses a stable 1440 × 900 desktop viewport. Portrait cameras lift above the seated figure to avoid obscuring the screen; desktop text is necessarily small in this miniature mobile view. Direct note URLs remain the readable mobile alternative.

The hosted site currently sends `X-Frame-Options: DENY`; embedding `https://nikhilsheoran.com/` is therefore blocked. Only the local `/desktop` route allows embedding, using `X-Frame-Options: SAMEORIGIN` and CSP `frame-ancestors 'self'`. Other routes keep DENY. Parent/child messages validate both origin and source. Nothing has been deployed or changed on the hosted site.

Chapter text is adapted from the existing about-me note. Photographs already in `public/` stand in for project artwork. Panel destinations are editable in `lib/journey/story.ts`: the first two use existing video URLs, the 2024 panel uses the hackathon tweet, and the 2025/2026 panels temporarily use the YouTube/X profiles until specific posts are supplied. Those last two are placeholders, not claimed project videos or tweets. No reference-site models or textures were copied. The bundled environment and wood textures are CC0 Poly Haven assets (see credits below).

## Files and replacement points

| File                                           | Responsibility                                                             |
| ---------------------------------------------- | -------------------------------------------------------------------------- |
| `lib/journey/story.ts`                         | Chapter copy, photos, external destinations, screen coordinates            |
| `lib/journey/path.ts`                          | Orbit and final display framing                                            |
| `app/_components/journey/portal.tsx`           | Input, timeline, reduced motion, monitor focus and pointer-boundary return |
| `app/_components/journey/scene.tsx`            | Helical camera path, lighting, atmosphere, scene assembly                  |
| `app/_components/journey/cloth.tsx`            | Moving cloth helix, deformation, surface shading and color reveal          |
| `app/_components/journey/lens.tsx`             | Depth-aware focus, camera motion blur, grain and vignette                  |
| `app/_components/journey/screen.tsx`           | Persistent iframe projection within the physical display                   |
| `app/desktop/page.tsx`, `embedded-desktop.tsx` | Embeddable existing desktop and validated message bridge                   |
| `app/_components/journey/objects.tsx`          | Replaceable desk, seated person, chair, and laptop groups                  |
| `app/_components/journey/textures.ts`          | Full-bleed photographic fabric artwork and loading-only display preview    |
| `app/_components/journey/journey.module.css`   | Responsive scene interface                                                 |

Replace a procedural group with a GLB at the same origin and scale. Replacing the laptop also requires updating its screen center, normal/tilt, dimensions, and invisible interaction region. Prefer a single optimized GLB for the static person, desk, and props; retain a separate laptop interaction target. Measure real device performance before choosing texture sizes and mesh budgets. A recognizable personal likeness needs reference photographs or a scan plus modeling work; a generic stock human will not supply that.

## Motion and screen references

- [Greta’s creators describe their implementation](https://www.commarts.com/webpicks/the-year-of-greta): tornado-like arrangement, vertex-deformed planes, environmental lighting, smoke and noise. The live site was inspected while scrolling. The redesign uses vertically separated photographic surfaces, stronger fabric deformation, and atmospheric depth instead of a circular ring of postcard layouts.
- [Henry’s MonitorScreen source](https://github.com/henryjeff/portfolio-website/blob/master/src/Application/World/MonitorScreen.ts): a CSS3D iframe under a WebGL transparency mask. This implementation uses an independently written screen-corner projection and keeps the same iframe during focus and return. [Camera.ts](https://github.com/henryjeff/portfolio-website/blob/master/src/Application/Camera/Camera.ts) and [CameraKeyframes.ts](https://github.com/henryjeff/portfolio-website/blob/master/src/Application/Camera/CameraKeyframes.ts) inform the distinct desk/monitor poses and boundary-driven return. [InfoOverlay.tsx](https://github.com/henryjeff/portfolio-website/blob/master/src/Application/UI/components/InfoOverlay.tsx) informs the black profile strips. The scene and motion code here are independently implemented.
- [Greta-inspired recreation](https://github.com/KevinMons1/THREE.js-TheYearOfGreta-Clone): inspected to understand how rotation and vertical translation combine. This is a recreation, not Greta's original source. Its assets and source were not copied.

## Model sources

Verified on 19 September 2026; these assets have **not** been downloaded or bundled.

| Source                                                                                                                                 | Useful for                                                         | Verified status                                                                       |
| -------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ | ------------------------------------------------------------------------------------- |
| [Quaternius Background Posed Humans](https://quaternius.com/packs/backgroundposedhumans.html)                                          | Better stylized human placeholders, hairstyle/pose starting points | Official page lists CC0 and FBX/OBJ/Blend; not a custom likeness                      |
| [Kenney Furniture Kit](https://kenney.nl/assets/furniture-kit)                                                                         | Low-poly tables, chairs, and room props                            | Official page lists 140 assets and CC0                                                |
| [2017 MacBook Air listing](https://embed-3dwarehouse-classic.sketchup.com/model/0eafe77f-9748-4b08-b5b9-9fb0ac27d22a/Macbook-Air-2017) | A candidate for the correct hardware generation                    | Listing found; download usability, geometry quality, and reuse terms still unverified |

For a final realistic scene, these stylized libraries are starting points, not evidence that a photorealistic matching set exists. Inspect each downloaded model and its included license before integrating it. An M2 Air model is not an accurate substitute for the glowing-logo 2017 machine.

## Git workflow

This work lives in the existing checkout on `codex/3d-portfolio-prototype`, based on `main` at `62819be`. No new repository or worktree was created. Keep building on this branch, then merge it into `main` when the direction is approved. No push or deployment is part of this prototype.

Use `bunx next build` for a local production check. The existing `bun run build` script also invokes Convex deployment and should not be used merely to validate the frontend.

## Validation and remaining polish

TypeScript, ESLint for the changed source, the local production build, and eight geometry tests pass. Additional tests cover panels staying above the floor, a perspective size bound including curled corners, a maximum of three visible panels throughout all fades, and readable chapter centers inside the camera frustum across viewport shapes. The original tests cover four-corner projection, vertical helix progression, continuous radius reduction and convergence, and the nominal 76% focused screen framing. Browser checks cover the framed endpoint, interactive Notes inside the display, pointer-out return with persistent note state, cloth color spread and printed icons, portrait screen clearance, reduced-motion keyboard focus, and holding a drag across the screen boundary until release. A brief desktop preview sample measured roughly 102 animation frames/second on this machine; this is not a sustained benchmark or a mobile performance guarantee.

The existing root layout produces a hydration warning because its early script adds `class="js"`; the existing analytics script also reports that localhost tracking is disabled. Those were observed during testing and are outside this scene change. React Three Fiber currently emits a Three.Clock deprecation warning with Three 0.186; rendering and the production build succeed.

Before a final release: replace project artwork and models, create the personal likeness, refine lighting, and profile real mobile hardware. The lens pass supports device pixel ratios up to 2, capped to fit a 3840 × 2160 render target, with 2× MSAA and eight depth-aware samples. Directional shadows use a 4096 map. The desktop iframe and source photographs are not native 4K content; render resolution does not make the placeholder geometry photorealistic. This is a working interaction prototype, not the finished visual treatment.

## Bundled asset credits

All assets below are [CC0, verified on Poly Haven](https://polyhaven.com/license). They are self-hosted in `public/journey/`; visitors do not depend on a third-party asset CDN.

- [Wood Table 001](https://polyhaven.com/a/wood_table_001), photography by Dimitrios Savva and processing by Rico Cilliers: 4K diffuse (`diffuse.jpg`), 2K OpenGL normal (`nor_gl.jpg`) and roughness (`roughness.jpg`). Used by the desk's physical material.
- [Studio Small 09](https://polyhaven.com/a/studio_small_09), Sergej Majboroda: 1K HDR lighting/reflections (`studio_small_09_1k.hdr`). Higher-resolution HDRs would add download cost without useful detail for this small, rough-surface scene.

The environment and wood textures add about 6.2 MB, plus the approximately 1.7 MB laptop GLB and 8.2 MB furniture GLB (including embedded textures). The scene still needs a detailed personal likeness, refined materials and lighting, and device profiling for the requested final appearance.

## Editable Blender source

`assets/blender/nikhil-studio.blend` contains the laptop, textured desk, lighting and a review camera. The person is an explicitly named reference marker. `studio-preview.png` is a small art-review render. The live site uses the exported laptop and detailed furniture while retaining its interactive screen.

Rebuild the source scene and web export with `blender -b -t 4 --python scripts/build-studio.py`. Add `-- --render` for the 1600 × 1100 Cycles review render. Rendering is opt-in to avoid occupying the machine during ordinary asset exports. The script packs the existing wood/HDRI/display images into the blend file.

The original model follows [Apple’s 2017 Air specifications](https://support.apple.com/en-ca/111924): 32.5 × 22.7 cm footprint, tapered body and 16:10 display. The live glowing logo and interactive display remain separate web elements. Blender's native review screen uses a static wallpaper. Web materials, lighting and the person require further art work; a Blender file alone does not make the browser output photorealistic.

For the likeness: provide sharp front, left/right profile and three-quarter face photos, front/side full-body photos, and a seated-at-desk pose. Use soft even light without portrait blur or face filters. Include the intended hairstyle, clothes and shoes, and approximate height. A desk/setup photo will guide the room and props. These references stay local unless another workflow is explicitly chosen.

The three cloth action SVGs come from Phosphor Icons (MIT), generated by `bun scripts/generate-cloth-icons.ts`. Their translucent backgrounds are part of the texture, not floating HTML.

## Detailed studio and Blender MCP

`assets/blender/nikhil-studio-detailed.blend` is the refined source, edited in the live Blender application through [MCP for Blender](https://github.com/ahujasid/mcp-for-blender). The original `nikhil-studio.blend` remains available as the starting scene. The detailed source includes the continuous laptop bezel/gasket, dished keycaps, vents and screws, furniture, props, corrected wood UVs, a web-compatible woven normal texture, lighting and a review camera. The person remains a reference marker in Blender and a temporary procedural figure on the website. This is not yet the final personal likeness or photorealistic art treatment. The studio's overall proportions still follow the prototype's existing screen/camera anchors.

Reproduce the refinement with `blender -b assets/blender/nikhil-studio.blend -t 4 --python scripts/refine-studio.py`. The refinement expects the original source, not an already-refined scene. It exports `macbook-air-2017.glb` and `studio-furniture.glb`, and saves a separate detailed source. Native procedural microstructure is used for render review; exported PBR materials and the woven normal map are used in WebGL.

Static GLB meshes are batched by material at load time to reduce draw calls. The Blender source keeps the individual components editable. Cloth transparency, depth-aware blur and camera motion blur remain independent of the static model batching.

The final panel now rises and moves aside during the handoff, disappearing by 89% of the timeline. Camera rotation settles by 93%, while the radius continues toward the computed screen framing. The large chapter caption becomes a compact screen instruction after 81%, and focus shifts continuously from the photograph to the laptop. No automatic fullscreen entry is introduced.

MCP for Blender is installed as the `blender_mcp` Blender add-on and registered as `blender` in the user's Codex configuration. It listens on localhost:9876, with telemetry disabled and MCP safe mode enabled. The connection was verified using actual MCP `get_scene_info`, `execute_blender_code` and `get_viewport_screenshot` calls. Codex may need a restart for newly registered tools to appear directly. Start the add-on's server again from Blender's MCP sidebar after a Blender restart. The current task used a standard MCP client to communicate with the server without restarting Codex.

## Calibrated Air replacement (20 September 2026)

The local prototype now uses the user's downloaded Riccardo Pavone Air model,
with the original archive preserved under `assets/source-models/MacBook Air`.
This is an older Air design, not a verified 2017 production CAD file.

- Published reference: [Apple, MacBook Air 13-inch 2017 specifications](https://support.apple.com/en-ca/111924).
- Corrected case footprint: 325 × 227 mm. The studio uses two scene units per metre
  (the desk is 1525 mm wide, with its top at 795 mm).
- Active screen: derived from the published 13.3-inch diagonal at 16:10,
  286.47 × 179.04 mm. The legacy aperture was too tall and has been corrected.
- The live iframe, fallback screen, camera focus and screen projection all use
  `lib/journey/air-model.json`, exported from the same geometry conversion.
- Rebuilt legacy material masks as PBR textures; preserved the sculpted body,
  keyboard recess, individual keys, feet, hinge and perimeter seal. Added a camera
  lens and emissive Apple inlay. Removed the platform-dependent Apple font glyph.
- Exact published footprint and nominal display diagonal do **not** establish
  manufacturing accuracy: taper, closed thickness, port revision (particularly
  MagSafe 2), logo placement, key layout and radii still need model-specific
  references. The legacy asset must not be described as exact 2017 CAD.

`convert-air-reference.py` runs in a separate background Blender with automatic
script execution disabled. `install-air-scene.py` imports its data-only GLB through
Blender MCP. Import with `scale_length=1`, then restore the studio's `0.5` scale:
Blender's glTF importer otherwise rescales mesh data using the existing scene units.
The editable assembled source is `assets/blender/nikhil-studio-calibrated.blend`.
Old laptop geometry remains hidden and recoverable in that source.

### Asset attribution and distribution status

Original model: **MacBook Air — Riccardo Pavone**, BlendSwap legacy asset 53154.
The bundled `BLENDSWAP_LICENSE.txt` identifies CC BY-SA 3.0 but also contains a
noncommercial fan-art restriction; the public listing encountered in research
reports a different license. Preserve the bundled files and obtain clear reuse
terms or replace the asset before publishing the derivative. No deployment has
been made as part of this work. No claim that the entire site inherits an asset
license is intended.

### Human reference preparation

[Blender Studio Human Base Meshes v1.4.1](https://www.blender.org/download/demo-files/)
is supplied under CC0. The anatomical male body and eyes were extracted from the
[official bundle](https://download.blender.org/demo/asset-bundles/human-base-meshes/human-base-meshes-bundle-v1.4.1.zip)
with automatic script execution disabled, and exported without bundled drivers
or animations to `assets/blender/human-anatomical-reference.glb`.
It is a sculpting foundation, not a textured, clothed, posed or personalized person.
The existing web figure remains provisional. Finishing a likeness requires front,
left/right profile, three-quarter, full-body and seated references, height, hair
and clothing choices. Stock scan licenses must explicitly support delivery of
extractable web 3D assets; permission to render images alone is insufficient.

## Daylight loft pass — 2026-09-20

The live Blender MCP source is `assets/blender/nikhil-nyc-studio.blend`. New static exports add the apartment and seated reference figure. The window view combines an AI-generated panorama and nearby modeled buildings for parallax. This remains a stylized real-time set; it is not a finished photoreal architectural render.

Laptop hover now provides a material highlight and paper tooltip; entry requires a click. The iframe glare no longer changes with interaction state. Screen and scene exposure stay stable across the handoff. The logo emits above the HDR bloom threshold; the daylight fill exposes the aluminum bezel. Three paper-textured profile strips contain the name, description, and X/Instagram/LinkedIn links.

Panels peel away and fade between 76.5% and 85%, before the camera overtakes them. Their projected size remains bounded and now damps toward that bound. Existing path tests cover maximum visibility, projected bounds, screen framing and continuity.

The human uses Blender Studio's anatomical base, normalized to 181 cm before posing, with local photo landmarks and a facial UV crop. Hair, neck/face integration, sleeve edges and garment topology still need specialist sculpting/retopology and visual likeness review. This is not scan-level identity or body-composition accuracy. Raw references are ignored by git and were not uploaded to an external generator. `scripts/build-seated-likeness.py` expects the local `FACE` landmark dictionary and local normalized reference image; `scripts/refine-seated-likeness.py` is the subsequent face/shoe refinement.

## Continuous screen approach and reference-driven sheets — 2026-09-20

The current scene omits the person. The floor is off-white, the cube is solved,
and the Apple inlay has soft pink emission. The latest web assets retain the
Blender scene as their editable source.

Automatic focus is now the endpoint of `journeyPose`, reached at `PANEL_END`
(85%). Starting after the final reading pose (74%), one shared curve settles
position, orbit angle and aim together. At 80% the existing scroll spring finishes
the approach automatically, so moving the pointer over the live iframe cannot
strand the camera just short of focus. Changing from orbit to desktop introduces
no additional camera animation. Reverse scrolling or dragging interrupts the
settle. Forward wheel events after arrival are ignored outside the screen;
reverse scrolling and the Back button return along the rail. Explicit early
laptop clicks still use an approach from the current displayed camera pose.

The previous automatic handoff reset scroll velocity and started a second timed
zoom. Its wheel handler also interpreted the remaining events of the same forward
gesture as an exit. Both behaviors have been removed from automatic focus.

Studied [The Year of Greta](https://theyearofgreta.com/) live and its public
`static/1580145979468/js/main.bundle.js`. Its sheets use shallow curvature,
velocity-dependent shear, a radial sequence with about 3.5 sheets per turn,
distance-dependent roll, and tinted grayscale photography. They do not use a
visible woven texture or continuously flapping fabric. Our implementation follows
those principles with original shader code, this site's images, a compact shallow
helix around the laptop, and the requested point-origin hover color reveal.
No Greta images, videos, fonts or source modules are bundled into the project.

Validation includes projected screen continuity at the automatic handoff,
monotonic camera approach, the three-panel visibility cap, readable chapter
positions and bounded panel size. Browser QA exercises sustained forward wheel
input through arrival, additional wheel momentum while focused, reverse scroll,
explicit focus and the Back button. The live DOM-screen projection was unchanged
on the frame that switched to desktop mode.
