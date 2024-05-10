import { useState, useEffect, Suspense, forwardRef } from "react";
import { Canvas, GroupProps } from "@react-three/fiber";
import { PerspectiveCamera, OrbitControls } from "@react-three/drei";
import {
  useRapier,
  Physics,
  RigidBody,
  RapierContext,
  Vector3Tuple,
} from "@react-three/rapier";
import { Quaternion, Euler, Object3D } from "three";
import { getShape, setRigidBody } from "./rigidBodyMap";
import { Box3, Group } from "three/src/Three.js";
import { suspend } from "suspend-react";
import { GLTFLoader } from "three/examples/jsm/Addons.js";

// Reusuable objects to save on GC
const quaternion = new Quaternion();
const euler = new Euler();

// Cast downward ray from origin & get list of pieces (sorted by Y position)
export const castShapeDown = (
  { world }: RapierContext,
  { shape, position, rotation, distance = 10000 },
  predicate
): number => {
  quaternion.setFromEuler(euler.set(...rotation));
  const hit = world.castShape(
    { x: position[0], y: distance, z: position[2] },
    quaternion,
    { x: 0, y: -1, z: 0 },
    shape,
    distance,
    false,
    undefined,
    undefined,
    undefined,
    undefined,
    predicate
  );
  // TODO: if no hit, run a query against a plane at Y=0
  const newY = hit ? distance - hit.toi : 0;
  return newY;
};

const loader = new GLTFLoader();
const boxHelper = new Box3();

async function loadCenteredGltf(
  _: any,
  src: string,
  ...rotation: Vector3Tuple
) {
  const { scene } = await loader.loadAsync(src);
  const wrapper = new Object3D();
  wrapper.add(scene);
  wrapper.rotation.fromArray(rotation);
  boxHelper.setFromObject(wrapper, true);

  //x & z center
  boxHelper.getCenter(wrapper.position);
  //y bottom
  wrapper.position.y = boxHelper.min.y;
  wrapper.position.multiplyScalar(-1);
  console.log(wrapper.position.toArray());
  return wrapper;
}

const LoadCenteredGltfSymbol = Symbol("loadCenteredGltf");

const Gltf = forwardRef<
  Group,
  Omit<GroupProps, "rotation"> & { rotation: Vector3Tuple; src: string }
>(({ src, rotation, ...props }, ref) => {
  const gltf = suspend(loadCenteredGltf, [
    LoadCenteredGltfSymbol,
    src,
    ...rotation,
  ]);
  return (
    <group ref={ref} {...props}>
      <primitive object={gltf} />
    </group>
  );
});

const Model = ({ id, position, rotation, ...props }) => {
  return (
    <RigidBody
      colliders="trimesh"
      userData={{ pieceData: { id } }}
      type="fixed"
      position={position}
      ref={setRigidBody.bind(null, id)}
    >
      <Gltf rotation={rotation} {...props} />
    </RigidBody>
  );
};

const initialDuckPos = [0, 3.5, 0];
function World() {
  const [duckPos, setDuckPos] = useState(initialDuckPos);
  const [duckRot, setDuckRot] = useState([0, 0, 0]);

  const rapier = useRapier();

  const handleGravity = (id) => {
    const shape = getShape(id);
    const position = duckPos;
    const rotation = duckRot;
    const newY = castShapeDown(
      rapier,
      { shape, position, rotation },
      (match) => {
        const pieceData = rapier.rigidBodyStates.get(match.handle)?.object
          ?.userData?.pieceData;
        if (!pieceData) return false;
        if (pieceData.id === id) return false; // ignore selected pieces
        return true;
      }
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
        rotation={[0, 1, 0]}
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
