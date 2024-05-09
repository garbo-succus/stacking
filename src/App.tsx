import { useState, useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import { Gltf, PerspectiveCamera, OrbitControls } from "@react-three/drei";
import {
  useRapier,
  Physics,
  RigidBody,
  RapierRigidBody,
} from "@react-three/rapier";
import { gravity } from "./gravity";
import { getShape, setRigidBody } from "./rigidBodyMap";

const Model = ({ id, position, rotation, ...props }) => {
  return (
    <RigidBody
      colliders="trimesh"
      userData={{ pieceData: { id } }}
      type="fixed"
      position={position}
      rotation={rotation}
      ref={setRigidBody.bind(null, id)}
    >
      <Gltf {...props} />
    </RigidBody>
  );
};

const initialDuckPos = [0, 3.5, 0];

function World() {
  const [duckPos, setDuckPos] = useState(initialDuckPos);
  const [duckRot, setDuckRot] = useState([0, 0, 0]);

  const rapier = useRapier();

  const handleGravity = (id) => {
    const newY = gravity(
      rapier.world,
      {
        shape: getShape(id),
        position: duckPos,
        rotation: duckRot,
      },
      { duck: true },
    );
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
      <Model src="Duck.glb" id="duck" position={duckPos} rotation={duckRot} />
      <Model
        src="IridescenceAbalone.glb"
        id="shell1"
        position={[0, 0, 0]}
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
        <OrbitControls />
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
