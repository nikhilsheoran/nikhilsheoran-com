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
  cornerRadius: number;
  rotationY: number;
}

export const deskLinks: DeskLink[] = [
  {
    id: "rubiks-cube",
    label: "My fastest solve",
    url: "https://www.instagram.com/reel/CiwBxhUKbYQ/",
    // Measured from the cubies in assets/blender/studio.blend.
    position: [-0.7224, 1.662, -0.1376],
    size: [0.0963, 0.112, 0.0963],
    cornerRadius: 0.006,
    rotationY: 0.31,
  },
];
