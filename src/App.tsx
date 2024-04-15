import { useRef, useState, useEffect } from 'react'
import { Canvas } from '@react-three/fiber'
import { Gltf, PerspectiveCamera } from '@react-three/drei'

const Duck = (props) => {
  const ref = useRef()
  return (
    <Gltf {...props} ref={ref} src='Duck.glb' />
  )
}

const Shell = (props) => {
  const ref = useRef()
  return (
    <Gltf {...props} ref={ref} src='IridescenceAbalone.glb' />
  )
}

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
    <Canvas style={{ height: 'calc(100vh - 2em)', width: '100%' }} onClick={run}>
      <PerspectiveCamera makeDefault position={[0, 2, 10]} rotation={[0,0,0]} />
      <ambientLight intensity={Math.PI / 2} />
      <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} decay={0} intensity={Math.PI} />
      <pointLight position={[-10, -10, -10]} decay={0} intensity={Math.PI} />
      <Duck position={duckPos} />
      <Shell position={shellPos} scale={[20,20,20]} rotation={[-Math.PI/4,0,0]} />
    </Canvas>
    <b>Duck should sit inside shell</b>
    </>
  )
}

export default App
