/**
 * Objects on the desk that open a link, like the laptop opens the Mac. The
 * geometry is baked into the room; these boxes are the hover and click volumes
 * (three.js coordinates, half-metre units, measured from assets/blender/studio.blend).
 */
export interface DeskLink {
  id: string;
  label: string;
  url: string;
  position: [number, number, number];
  size: [number, number, number];
  rotationY: number;
}

export const deskLinks: DeskLink[] = [
  {
    id: "rubiks-cube",
    label: "Watch the reel",
    url: "https://www.instagram.com/reel/CiwBxhUKbYQ/",
    position: [-0.722, 1.662, -0.138],
    size: [0.116, 0.114, 0.116],
    rotationY: 0.07,
  },
];
