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

/**
 * A hidden extra: the shelf clock reads 14:08. Nothing marks it out except the
 * pointer; clicking it brings the camera over for a closer look. The box is
 * the click volume, the pose is where the camera comes to rest.
 */
export const clockEgg = {
  position: [7.74, 1.39, 0.42] as [number, number, number],
  size: [0.24, 0.38, 0.68] as [number, number, number],
  label: [7.6, 1.69, 0.42] as [number, number, number],
  camera: {
    position: [5.75, 1.56, 0.15] as [number, number, number],
    target: [7.64, 1.43, 0.42] as [number, number, number],
  },
  seconds: 1.4,
};

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
