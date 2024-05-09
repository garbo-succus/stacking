import { useState, useEffect, useRef } from "react";
import { Canvas } from "@react-three/fiber";
import { Gltf, PerspectiveCamera, OrbitControls } from "@react-three/drei";
import { useRapier, Physics, RigidBody } from "@react-three/rapier";
import { Quaternion, Euler, Object3D } from "three";
import { getShape, setRigidBody } from "./rigidBodyMap";
import { Vector3 } from "three";
import { Box3 } from "three/src/Three.js";

// Reusuable objects to save on GC
const quaternion = new Quaternion();
const euler = new Euler();

// Cast downward ray from origin & get list of pieces (sorted by Y position)
export const castShapeDown = (
  { world },
  { shape, position, rotation, distance = 10000 },
  predicate
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
    predicate
  );

const boxHelper = new Box3();
const vectorHelper = new Vector3();
const parentHelper = new Object3D();

const Model = ({ id, position, rotation, center = false, ...props }) => {
  const gltfRef = useRef<Object3D>(null);
  const [offset, setOffset] = useState(new Vector3());
  const offsetRef = useRef(offset);

  useEffect(() => {
    if (!center || gltfRef.current == null) {
      return;
    }

    //measuring the contents of the group
    if (Array.isArray(rotation)) {
      parentHelper.rotation.fromArray(rotation as any);
    } else {
      parentHelper.rotation.copy(rotation);
    }
    parentHelper.children[0] = gltfRef.current;
    const parent = gltfRef.current.parent;
    gltfRef.current.parent = parentHelper;
    boxHelper.setFromObject(parentHelper, true);
    gltfRef.current.parent = parent;

    //x & z center
    boxHelper.getCenter(vectorHelper);
    //y bottom
    vectorHelper.y = boxHelper.min.y;
    vectorHelper.multiplyScalar(-1);
    if (offsetRef.current.distanceToSquared(vectorHelper) <= 0.001) {
      return;
    }
    setOffset(vectorHelper);
    offsetRef.current = vectorHelper;
  }, [rotation]);

  const centeredPosition = new Vector3();
  if (Array.isArray(position)) {
    centeredPosition.fromArray(position);
  } else {
    centeredPosition.copy(position);
  }
  centeredPosition.add(offset);

  return (
    <RigidBody
      colliders="trimesh"
      userData={{ pieceData: { id } }}
      type="fixed"
      position={centeredPosition}
      rotation={rotation}
      ref={setRigidBody.bind(null, id)}
    >
      <Gltf ref={gltfRef} {...props} />
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
    const hit = castShapeDown(
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
      <Model src="Duck.glb" id="duck" position={duckPos} rotation={duckRot} />
      <Model
        src="IridescenceAbalone.glb"
        id="shell1"
        center
        position={[0, 0, 0]}
        scale={[20, 20, 20]}
        rotation={[2, 1, 0]}
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
