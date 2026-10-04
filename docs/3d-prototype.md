# The desk journey

The homepage opens on a 3D studio: a desk, a 2017 MacBook Air with its glowing
logo, and a seated figure of me. Scrolling (or dragging, or the timeline) carries the
camera up a tightening helix around the desk while cloth panels, one per piece
of work, spiral the other way. The helix ends in a descent over the statue's
shoulder to the laptop, whose screen is the real macOS-style site running in an
iframe. Deep links (`/notes/...`, `/finder`, ...) still open the desktop directly.

## Run it

```sh
bun dev -p 3001
```

Open `http://localhost:3001/`. Add `?tune` for the choreography tuner (development only).

## How it fits together

| File | Responsibility |
| --- | --- |
| `lib/journey/tuning.ts` | **Every** hand-tuned number: timeline beats, camera helix, panel helix, springs |
| `lib/journey/timeline.ts` | Named beats derived from tuning (chapters, handoff, settle, panel fade) |
| `lib/journey/machine.ts` | State machine: `orbit → settling → focused`, and `approaching` for laptop clicks |
| `lib/journey/path.ts` | Camera rail, laptop-click flight, panel helix, screen pose, projection maths |
| `lib/journey/works.ts` + `content/journey/works.json` | The works on the cloth |
| `lib/journey/anchors.ts` | Laptop and screen anchors exported from Blender (`air-model.json`) |
| `app/_components/journey/portal.tsx` | Wires runtime, input, overlay, iframe, sound, loader |
| `app/_components/journey/scene.tsx` | Canvas, camera driver, scene assembly |
| `app/_components/journey/cloth.tsx` | Cloth shader: folds, grayscale → colour from the hover point, printed icons |
| `app/_components/journey/screen.tsx` | Projects the live iframe onto the laptop screen; full screen on phones |
| `app/_components/journey/lens.tsx` | Post pass: short camera motion blur and HDR bloom (logo glow) |
| `app/_components/journey/use-journey-input.ts` | Wheel, drag with momentum, keyboard |
| `app/_components/journey/sound.ts` | Procedural room tone, city, panel passes, key clicks (off by default) |
| `app/_components/journey/tuner.tsx` | Dev tuner: sliders for every tuning value, Copy JSON |

### Choreography

Progress runs 0 → 1. Works sit evenly between `firstChapter` and `lastChapter`.
At `handoffStart` the orbit hands off (same velocity, no kink) to a cubic descent
that comes down over the statue into the resting Mac pose; `railPose(1)` *is*
that pose. Moving forward past `settleArm` glides the rest of the way in; the
descent is never a resting place. Clicking the laptop from anywhere flies up and
joins the same descent, so every arrival looks the same, and leaving flies back.

To change the feel: open `/?tune`, adjust, press **Copy JSON**, paste over
`DEFAULT_TUNING`. Then run the tests, which check continuity, statue clearance,
at most three visible panels, and each work being framed at its reading moment.

```sh
bun test lib/journey
```

### Panels

Each panel rides its own helix around the shared axis, turning against the
camera and rising as the story advances. The only coupling to the camera is
where a panel sits at its own reading moment: slightly right of centre, on the
line of sight. Visibility falls off like onion skins around the reading panel.

### Works

Edit `content/journey/works.json`, then regenerate the artwork:

```sh
bun scripts/works/build.ts          # all
bun scripts/works/build.ts fastcut  # one
```

It captures YouTube thumbnails, renders tweet cards from X's public embed data,
and screenshots sites with headless Chrome into `public/journey/works/`.

## The 3D assets

Blender sources are local-only (`assets/blender/*.blend`, ignored by git) and
rebuilt from `scripts/`. Only the web exports in `public/journey/` are committed.
See `scripts/room/README.md` (room + baked lighting) and `scripts/statue/`.

The room is lit by **baked lighting**: Cycles renders global illumination,
soft shadows and contact shading into textures, which the browser draws unlit.
That is why the browser matches the Blender render and why it is cheap to draw.
Only the laptop, screen, logo glow and cloth are lit live.

Asset credits: `public/journey/CREDITS.md`.

## Open items

- The MacBook model (Riccardo Pavone, BlendSwap) has an unclear licence; resolve
  or replace it before publishing.
- `mediagroww.com` no longer resolves; its panel links to an Internet Archive copy.
- The first paid-edit video is private; that panel uses the "first dollar" tweet.
