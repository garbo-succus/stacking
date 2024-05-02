import { forwardRef, useState, useEffect } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { Gltf, PerspectiveCamera, Center } from "@react-three/drei";
import { Physics, RigidBody, CuboidCollider } from "@react-three/rapier";

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

const initialDuckPos = [0, 3, 0];
function App() {
  const [duckPos, setDuckPos] = useState(initialDuckPos);
  const [shell1Pos, setShell1Pos] = useState([0, 0, 0]);

  const handleGravity = () => {
    const newY = 0; // to be calculated
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
    <>
      <Canvas style={{ height: "100vh", width: "100vw" }} onClick={run}>
        <Physics debug>
          <PerspectiveCamera
            makeDefault
            position={[0, 0.2, 10]}
            rotation={[0, 0, 0]}
          />
          <ambientLight intensity={2} />

          <gridHelper />

          <Model src="Duck.glb" id="duck" position={duckPos} />
          <Model
            src="IridescenceAbalone.glb"
            id="shell1"
            position={shell1Pos}
            scale={[20, 20, 20]}
            rotation={[0, 0, 0]}
          />
        </Physics>
      </Canvas>
    </>
  );
}

export default App;
