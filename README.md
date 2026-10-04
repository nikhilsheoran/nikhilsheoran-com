# nikhilsheoran.com

My personal site. It opens on a 3D studio with me at a desk; scrolling carries the camera up a spiral of cloth panels that tell my story, and it ends at the laptop, whose screen is a working macOS-style desktop with my notes, files and a guestbook.

## Approach

**One room, lit once.** The studio is modelled in Blender by scripts, so it can be rebuilt and changed in code. Its lighting is rendered offline and baked into the textures, and the browser draws those textures unlit. The page gets soft daylight, bounce light and shadows at the cost of a few images.

**The scroll is the story.** A single scroll position drives everything: the camera's path, where each panel hangs, what the timeline shows. The path and the panel layout are plain functions of that one number, with tests that keep the camera out of the furniture and the panels readable on every screen shape.

**A site inside the site.** The laptop screen is the real website, running in a frame and talking to the room through messages. The same desktop also opens directly at its own addresses, so every note has a normal link and the content is server-rendered for search engines and readers without WebGL.

**Content as files.** Notes are Markdown, the story cards are one JSON file, and both feed the 3D panels, the desktop apps and the plain-text version of the site.

**The person at the desk.** The seated figure is a likeness built from my own photos: reference pictures, an image-to-3D model for the base shape, then code that reshapes the face against the portrait, repaints it through fixed cameras and cleans it up before it is baked into the room. The photos and working files stay out of the repository.

**Built with coding agents.** Nearly all of the code, the Blender scripts and the asset pipeline were written in conversation with Claude and Codex, one small reviewable change at a time.

## Stack

Next.js and React, three.js with React Three Fiber, Blender with Cycles for the baked room, Postgres on Supabase with Better Auth for the guestbook, deployed on Vercel.

## Credits and licences

Third-party assets, their licences and trademarks are listed in [public/journey/CREDITS.md](public/journey/CREDITS.md).
