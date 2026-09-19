# 3D portfolio prototype

The homepage now introduces the existing macOS portfolio through a scroll-driven Three.js scene. Existing `/notes/...`, `/finder`, `/music`, and other deep links still open the desktop directly.

## Try it

Run `bun dev` and open the server's root URL (the current development server is at http://localhost:3001/).

- Scroll or swipe to orbit the seated figure and explore five chapters, 2022–2026.
- Hover a floating page to bring its photograph and accent into color. Click it or **Read this chapter** to open the associated existing note.
- Hover over the laptop for 850 ms, click it, or use **Enter my Mac** to enter early.
- Reach the end of the timeline to enter automatically.
- Use **Back to the scene** to return. The timeline stops before automatic entry to avoid a loop.
- Year buttons and a native range input provide keyboard/touch navigation. Reduced motion removes animated camera transitions, page flutter, and hover-to-enter.

## What is real, and what is provisional

The orbit, curved camera approach, shader-deformed pages, grayscale/color interaction, and handoff into the existing interactive desktop are implemented. The 3D canvas unmounts inside the desktop, so it does not keep rendering in the background.

The figure, furniture, plant, and laptop are original procedural placeholders. The person is **not a likeness**, and the laptop is an approximation of the older silver Air silhouette, not a dimensionally accurate 2017 model. Its display uses an on-device canvas preview of the existing wallpaper and dock. The actual interactive desktop mounts after the zoom; it is not running live on the angled 3D screen. There can be a visible handoff between that preview and the Notes window.

Chapter text is adapted from the existing about-me note. Photographs already in `public/` stand in for project artwork. Most chapters currently open about-me; the first opens the archived introduction. No external reference-site code, textures, or models were copied into this prototype.

## Files and replacement points

| File | Responsibility |
| --- | --- |
| `lib/journey/story.ts` | Chapter copy, photos, note destinations, screen coordinates |
| `lib/journey/path.ts` | Orbit and final display framing |
| `app/_components/journey/portal.tsx` | Input, timeline, reduced motion, desktop handoff and return |
| `app/_components/journey/scene.tsx` | Camera, lighting, floating page geometry and shaders |
| `app/_components/journey/objects.tsx` | Replaceable desk, seated person, chair, and laptop groups |
| `app/_components/journey/textures.ts` | Story artwork and lightweight laptop display preview |
| `app/_components/journey/journey.module.css` | Responsive scene interface |

Replace a procedural group with a GLB at the same origin and scale. Replacing the laptop also requires updating its screen center, normal/tilt, dimensions, and invisible interaction region. Prefer a single optimized GLB for the static person, desk, and props; retain a separate laptop interaction target. Measure real device performance before choosing texture sizes and mesh budgets. A recognizable personal likeness needs reference photographs or a scan plus modeling work; a generic stock human will not supply that.

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

TypeScript, ESLint for the changed source, and a local production Next.js build pass. Browser checks cover desktop and 390 × 844 layouts, timeline navigation, page color hover, laptop hover entry, desktop entry/return, Finder opening from the dock, direct note URLs bypassing the scene, a chapter opening its note, and reduced-motion entry at the timeline endpoint.

The existing root layout produces a hydration warning because its early script adds `class="js"`; the existing analytics script also reports that localhost tracking is disabled. Those were observed during testing and are outside this scene change. React Three Fiber currently emits a Three.Clock deprecation warning with Three 0.186; rendering and the production build succeed.

Before a final release: replace project artwork and models, create the personal likeness, refine lighting and the display-to-desktop crossfade, and profile real mobile hardware. This is a working interaction prototype, not the finished visual treatment.
