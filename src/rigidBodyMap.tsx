import { RapierRigidBody } from "@react-three/rapier";

export const rigidBodyMap = new Map<string, RapierRigidBody>();

export const getShape = (id: string) => rigidBodyMap.get(id)?.collider(0).shape;

// usage: <Component ref={setRigidBody.bind(null, id)} />
export const setRigidBody = (id: string, body: RapierRigidBody) =>
  void rigidBodyMap.set(id, body);
