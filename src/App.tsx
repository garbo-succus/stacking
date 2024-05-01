import { forwardRef, useState, useEffect } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { Gltf, PerspectiveCamera, Bvh, Center } from "@react-three/drei";

const Model = forwardRef(({ id, position, ...props }, ref) => {
  const three = useThree();
  return (
    <Bvh>
      <Center top position={position}>
        <Gltf {...props} ref={ref} />
      </Center>
    </Bvh>
  );
});

function App() {
  const [duckPos, setDuckPos] = useState([0, 5, 0]);
  const [shell1Pos, setShell1Pos] = useState([0, 1, 0]);

  const handleGravity = () => {
    const newY = 2.5; // to be calculated
    setDuckPos([0, newY, 0]);
  };

  // Helper for visualising what is happening
  const run = () => {
    setDuckPos([0, 5, 0]);
    const t = setTimeout(handleGravity, 300);
    return () => clearTimeout(t);
  };
  useEffect(run, []);

  return (
    <>
      <Canvas style={{ height: "100vh", width: "100vw" }} onClick={run}>
        <PerspectiveCamera
          makeDefault
          position={[0, 3, 10]}
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
          rotation={[2.4, 0, 0]}
        />

        <Model
          src="IridescenceAbalone.glb"
          id="shell2"
          position={[-5, 0, 0]}
          scale={[20, 20, 20]}
        />
      </Canvas>
    </>
  );
}

export default App;
