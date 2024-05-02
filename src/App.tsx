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

// Reusuable objects to save on GC
const quaternion = new Quaternion();
const euler = new Euler();

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
    distance + 1, // TODO: is it necessary to do +1?
    false, // firstHitOnly
    undefined,
    undefined,
    undefined,
    undefined,
    predicate,
  );

const Model = forwardRef(({ id, position, rotation, ...props }, ref) => {
  const three = useThree();
  return (
    <RigidBody
      colliders="trimesh"
      userData={{ pieceData: { id } }}
      transformState={false}
      type="fixed"
      position={position}
      rotation={rotation}
    >
      <Gltf {...props} ref={ref} />
    </RigidBody>
  );
});

const initialDuckPos = [0, 3.5, 0];
function World() {
  const [duckPos, setDuckPos] = useState(initialDuckPos);
  const [shell1Pos, setShell1Pos] = useState([0, 1.5, 0]);

  const rapier = useRapier();
  const duckRef = useRef();

  const handleGravity = () => {
    const hit = castShapeDown(
      rapier,
      {
        shape: new rapier.rapier.Cuboid(1, 1, 1), // TODO: duck geometry
        position: [0, 0, 0],
        rotation: [0, 0, 0],
      },
      (match) => {
        const pieceData = rapier.rigidBodyStates.get(match.handle)?.object
          ?.userData?.pieceData;
        if (!pieceData) return false;
        const { id } = pieceData;
        if (id === "duck") return false;
        return true;
      },
    );
    console.log("castShapeDown", hit);
    const newY = 10000 - hit.toi; // not working correctly
    setDuckPos([0, newY, 0]);
  };

  // Helper for visualising what is happening
  const run = () => {
    setDuckPos(initialDuckPos);
    const t = setTimeout(handleGravity, 300);
    return () => clearTimeout(t);
  };
  useEffect(run, []);

  return (
    <group onClick={run}>
      <Model src="Duck.glb" id="duck" position={duckPos} ref={duckRef} />
      <Model
        src="IridescenceAbalone.glb"
        id="shell1"
        position={shell1Pos}
        scale={[20, 20, 20]}
        rotation={[0, 0, 0]}
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
            position={[0, 0.2, 10]}
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
