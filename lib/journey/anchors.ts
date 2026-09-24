import air from "./air-model.json";

// The whole studio uses two scene units per metre; anchors are exported by Blender.
export const LAPTOP_POSITION: [number, number, number] = [0, 1.59, -0.13];
export const SCREEN_TILT = air.screenTilt;
export const SCREEN_WIDTH = air.screenWidth;
export const SCREEN_HEIGHT = air.screenHeight;
export const SCREEN_LOCAL_POSITION = air.screenLocalPosition as [
  number,
  number,
  number,
];
export const SCREEN_POSITION = LAPTOP_POSITION.map(
  (value, index) => value + SCREEN_LOCAL_POSITION[index],
) as [number, number, number];
