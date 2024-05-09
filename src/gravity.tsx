import { Quaternion, Euler } from "three";

// Reusuable objects to save on GC
const quaternion = new Quaternion();
const euler = new Euler();

// Cast downward ray from origin & get list of pieces (sorted by Y position)
export const castShapeDown = (
  world,
  { shape, position, rotation, distance = 10000 },
  predicate,
) =>
  world.castShape(
    { x: position[0], y: distance, z: position[2] },
    quaternion.setFromEuler(euler.set(...rotation)),
    { x: 0, y: -1, z: 0 },
    shape,
    distance,
    false,
    undefined,
    undefined,
    undefined,
    undefined,
    predicate,
  );

export const gravity = (world, { shape, position, rotation }, selectedIds) => {
  const distance = 10000;
  const hit = castShapeDown(
    world,
    { shape, position, rotation, distance },
    (match) => {
      const pieceData = match?._parent?.userData?.pieceData;
      if (!pieceData) return false;
      if (selectedIds[pieceData.id]) return false; // ignore selected pieces
      return true;
    },
  );
  return hit ? distance - hit.toi : 0;
};
