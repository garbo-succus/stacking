import { forwardRef, useRef, useState, useEffect } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { Gltf, PerspectiveCamera, Center } from "@react-three/drei";
import {
  useRapier,
  Physics,
  RigidBody,
  CuboidCollider,
} from "@react-three/rapier";
import { Quaternion, Euler } from "three";

import { create } from 'zustand'

// Reusuable objects to save on GC
const quaternion = new Quaternion();
const euler = new Euler();

// TODO: We shouldn't need to iterate over the whole list every time
// Get a map of { [id]: rapierShape, ... }
const getShapes = ({ colliderStates }) => {
  const shapes = {};
  colliderStates.forEach((state) => {
    const key = state.worldParent?.userData?.pieceData?.id;
    if (key) shapes[key] = state.collider._shape;
  });
  return shapes;
};

// Cast downward ray from origin & get list of pieces (sorted by Y position)
export const castShapeDown = (
  { world },
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

const Model = ({ id, position, rotation, ...props }) => {
  const three = useThree();
  const ref = useRef(); // TODO: Can we keep refs in a state object, instead of using getShapes?
  return (
    <RigidBody
      colliders="trimesh"
      userData={{ pieceData: { id } }}
      transformState={false}
      type="fixed"
      position={position}
      rotation={rotation}
      ref={ref}
    >
      <Gltf {...props} />
    </RigidBody>
  );
};

const initialDuckPos = [0, 3.5, 0];
function World() {
  const [duckPos, setDuckPos] = useState(initialDuckPos);
  const [shell1Pos, setShell1Pos] = useState([0, 0, 0]);

  const rapier = useRapier();

  const handleGravity = (id) => {
    // if (!duckRef.current) return;
    // const handle = duckRef.current.handle
    // const shape = rapier.colliderStates.get(handle).collider._shape
    // const shape = duckRef.current.collider()._shape;

    const shapes = getShapes(rapier);
    const shape = shapes[id];

    const hit = castShapeDown(
      rapier,
      {
        shape,
        position: [0, 0, 0],
        rotation: [0, 0, 0],
      },
      (match) => {
        const pieceData = rapier.rigidBodyStates.get(match.handle)?.object
          ?.userData?.pieceData;
        if (!pieceData) return false;
        if (pieceData.id === id) return false; // ignore selected pieces
        return true;
      },
    );
    const newY = hit ? 10000 - hit.toi : 0; // TODO: if no hit, run a query against a plane at Y=0
    setDuckPos([0, newY, 0]);
  };

  // Helper for visualising what is happening
  const run = () => {
    setDuckPos(initialDuckPos);
    const t = setTimeout(() => handleGravity("duck"), 100);
    return () => clearTimeout(t);
  };
  useEffect(run, []);

  return (
    <group onClick={run}>
      <Model src="Duck.glb" id="duck" position={duckPos} />
      <Model
        src="IridescenceAbalone.glb"
        id="shell1"
        position={shell1Pos}
        scale={[20, 20, 20]}
        rotation={[2, 0, 0]}
      />
    </group>
  );
}

function App() {
  return (
    <>
      <Canvas style={{ height: "100vh", width: "100vw" }}>
        <Physics debug>
          <PerspectiveCamera
            makeDefault
            position={[0, 1, 10]}
            rotation={[0, 0, 0]}
          />
          <ambientLight intensity={2} />
          <gridHelper />
          <World />
        </Physics>
      </Canvas>
    </>
  );
}

export default App;
