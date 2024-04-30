import { forwardRef, useRef, useState, useEffect, useMemo } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import { Gltf, PerspectiveCamera, Bvh, useHelper, Center } from '@react-three/drei'

const Model = forwardRef(
  ({position, ...props}, ref) => {
  const three = useThree()
  return (
    <Bvh>
      <Center top position={position}>
        <Gltf {...props} ref={ref} onClick={
          e =>  console.log(three)
        } />
      </Center>
    </Bvh>
    )  
}
)


const initialDuckPos = [0,3,0]

function App() {
  const [duckPos, setDuckPos] = useState(initialDuckPos)
  const [shellPos, setShellPos] = useState([0, 0, 0])

  const handleGravity = () => {
    const newY = 0
    setDuckPos([0, newY, 0])
  }

  const run = () => {
    setDuckPos(initialDuckPos)
    const t = setTimeout(handleGravity, 300)
    return () => clearTimeout(t)
  }
  useEffect(run, [])

  return (
    <>
    <Canvas style={{ height: '100vh', width: '100vw' }} onClick={run}>
      <PerspectiveCamera makeDefault position={[0, 2, 10]} rotation={[0,0,0]} />
      <ambientLight intensity={Math.PI / 2} />
      <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} decay={0} intensity={Math.PI} />
      <pointLight position={[-10, -10, -10]} decay={0} intensity={Math.PI} />
      <gridHelper />
 
      <Model src='Duck.glb' position={duckPos} />
      <Model src='IridescenceAbalone.glb' position={shellPos} scale={[20,20,20]} rotation={[-Math.PI/4,0,0]} />
      <Model src='IridescenceAbalone.glb' position={[-4.5,0,0]} scale={[20,20,20]} rotation={[0,0,0]} />
    </Canvas>
    </>
  )
}

export default App
