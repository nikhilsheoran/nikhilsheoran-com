# 3D portfolio prototype

The homepage now introduces the existing macOS portfolio through an ascending, tightening camera helix and upward-moving photographic cloth surfaces. Existing `/notes/...`, `/finder`, `/music`, and other deep links still open the desktop directly.

## Try it

Run `bun dev` and open the server's root URL (the current development server is at http://localhost:3001/).

- Scroll or swipe along the rising helix to explore five chapters, 2022–2026. The camera makes 1.65 turns, rises, then bends toward the display; the panels move upward along their own helix.
- Hover a fabric panel to reveal color around the pointer and let its folds settle. Click it or **Read this chapter** to open the associated existing note.
- Hover over the laptop for 850 ms, click it, or use **Enter my Mac** to enter early.
- Reach the end of the timeline to enter automatically.
- Use **Back to the scene** or Escape inside the iframe to reverse the camera move. The same desktop remains mounted, preserving open windows. The timeline stops before automatic entry to avoid a loop.
- Year buttons and a native range input provide keyboard/touch navigation. Reduced motion removes animated camera transitions, page flutter, and hover-to-enter.

## What is real, and what is provisional

The camera helix, reverse screen approach, shader-deformed fabric, pointer-centered grayscale/color reveal, and live desktop inside the 3D screen are implemented. A depth-buffer post-process adds selective focus and camera-reprojection motion blur, with subtle grain and vignette. Pointer movement adds restrained camera parallax. The WebGL render loop pauses while the desktop is fullscreen; the iframe stays mounted throughout.

The figure, furniture, plant, and laptop are original procedural placeholders. The person is **not a likeness**, and the laptop approximates the older silver Air silhouette rather than reproducing the 2017 dimensions. Cloth is animated with broad billows, ripples, curled edges, scroll-velocity deformation, surface-normal lighting, and fine print grain. It is not a physical cloth simulation. Motion blur derives from camera motion and scene depth, not per-object cloth motion vectors.

The laptop now contains the actual interactive website in a same-origin `/desktop` iframe, projected onto the screen's corners. A WebGL alpha opening provides occlusion by the bezel, person, and other scene objects. The final approach expands this same iframe to the viewport instead of swapping to a second desktop. The old canvas screenshot is retained only while the iframe loads. Narrow viewports retain the existing site's mobile Notes layout.

The hosted site currently sends `X-Frame-Options: DENY`; embedding `https://nikhilsheoran.com/` is therefore blocked. Only the local `/desktop` route allows embedding, using `X-Frame-Options: SAMEORIGIN` and CSP `frame-ancestors 'self'`. Other routes keep DENY. Parent/child messages validate both origin and source. Nothing has been deployed or changed on the hosted site.

Chapter text is adapted from the existing about-me note. Photographs already in `public/` stand in for project artwork. Most chapters currently open about-me; the first opens the archived introduction. No external reference-site code, textures, or models were copied into this prototype.

## Files and replacement points

| File | Responsibility |
| --- | --- |
| `lib/journey/story.ts` | Chapter copy, photos, note destinations, screen coordinates |
| `lib/journey/path.ts` | Orbit and final display framing |
| `app/_components/journey/portal.tsx` | Input, timeline, reduced motion, desktop handoff and return |
| `app/_components/journey/scene.tsx` | Helical camera path, lighting, atmosphere, scene assembly |
| `app/_components/journey/cloth.tsx` | Moving cloth helix, deformation, surface shading and color reveal |
| `app/_components/journey/lens.tsx` | Depth-aware focus, camera motion blur, grain and vignette |
| `app/_components/journey/screen.tsx` | Persistent iframe projection and fullscreen expansion |
| `app/desktop/page.tsx`, `embedded-desktop.tsx` | Embeddable existing desktop and validated message bridge |
| `app/_components/journey/objects.tsx` | Replaceable desk, seated person, chair, and laptop groups |
| `app/_components/journey/textures.ts` | Full-bleed photographic fabric artwork and loading-only display preview |
| `app/_components/journey/journey.module.css` | Responsive scene interface |

Replace a procedural group with a GLB at the same origin and scale. Replacing the laptop also requires updating its screen center, normal/tilt, dimensions, and invisible interaction region. Prefer a single optimized GLB for the static person, desk, and props; retain a separate laptop interaction target. Measure real device performance before choosing texture sizes and mesh budgets. A recognizable personal likeness needs reference photographs or a scan plus modeling work; a generic stock human will not supply that.

## Motion and screen references

- [Greta’s creators describe their implementation](https://www.commarts.com/webpicks/the-year-of-greta): tornado-like arrangement, vertex-deformed planes, environmental lighting, smoke and noise. The live site was inspected while scrolling. The redesign uses vertically separated photographic surfaces, stronger fabric deformation, and atmospheric depth instead of a circular ring of postcard layouts.
- [Henry’s MonitorScreen source](https://github.com/henryjeff/portfolio-website/blob/master/src/Application/World/MonitorScreen.ts): a CSS3D iframe under a WebGL transparency mask. This implementation uses an independently written screen-corner projection and keeps the same iframe during entry and exit.
- [Greta-inspired recreation](https://github.com/KevinMons1/THREE.js-TheYearOfGreta-Clone): inspected to understand how rotation and vertical translation combine. This is a recreation, not Greta's original source. Its assets and source were not copied.

## Model sources

Verified on 19 September 2026; these assets have **not** been downloaded or bundled.

| Source | Useful for | Verified status |
| --- | --- | --- |
| [Quaternius Background Posed Humans](https://quaternius.com/packs/backgroundposedhumans.html) | Better stylized human placeholders, hairstyle/pose starting points | Official page lists CC0 and FBX/OBJ/Blend; not a custom likeness |
| [Kenney Furniture Kit](https://kenney.nl/assets/furniture-kit) | Low-poly tables, chairs, and room props | Official page lists 140 assets and CC0 |
| [2017 MacBook Air listing](https://embed-3dwarehouse-classic.sketchup.com/model/0eafe77f-9748-4b08-b5b9-9fb0ac27d22a/Macbook-Air-2017) | A candidate for the correct hardware generation | Listing found; download usability, geometry quality, and reuse terms still unverified |

For a final realistic scene, these stylized libraries are starting points, not evidence that a photorealistic matching set exists. Inspect each downloaded model and its included license before integrating it. An M2 Air model is not an accurate substitute for the glowing-logo 2017 machine.

## Git workflow

This work lives in the existing checkout on `codex/3d-portfolio-prototype`, based on `main` at `62819be`. No new repository or worktree was created. Keep building on this branch, then merge it into `main` when the direction is approved. No push or deployment is part of this prototype.

Use `bunx next build` for a local production check. The existing `bun run build` script also invokes Convex deployment and should not be used merely to validate the frontend.

## Validation and remaining polish

TypeScript, ESLint for the changed source, a local production Next.js build, and two geometry tests pass. The tests check perspective projection at all four screen corners and vertical progression of the helix. Browser checks cover desktop and 390 × 844 layouts, timeline navigation, page color hover, laptop hover entry, desktop entry/return, Finder opening from the dock, direct note URLs bypassing the scene, a chapter opening its note, and reduced-motion entry at the timeline endpoint.

The existing root layout produces a hydration warning because its early script adds `class="js"`; the existing analytics script also reports that localhost tracking is disabled. Those were observed during testing and are outside this scene change. React Three Fiber currently emits a Three.Clock deprecation warning with Three 0.186; rendering and the production build succeed.

Before a final release: replace project artwork and models, create the personal likeness, refine lighting, and profile real mobile hardware. The lens pass is capped at device pixel ratio 1 with eight depth-aware samples to limit GPU cost; this is a quality/performance tradeoff, not a claim of universal 60 fps. This is a working interaction prototype, not the finished visual treatment.
