import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'

const MOTION_SPEED = 1.15

function useScrollProgress() {
  const progress = useRef(0)
  useEffect(() => {
    const update = () => {
      const scrollableHeight = document.documentElement.scrollHeight - window.innerHeight
      progress.current = scrollableHeight > 0 ? window.scrollY / scrollableHeight : 0
    }
    update()
    window.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update)
    return () => {
      window.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
    }
  }, [])
  return progress
}

function MoonBloom({ motionEnabled, position = [0, 0, 0], scale = 1 }) {
  const group = useRef(null)
  const scrollProgress = useScrollProgress()
  useFrame(({ clock }, delta) => {
    if (!group.current || !motionEnabled) return
    const elapsed = clock.elapsedTime * MOTION_SPEED
    group.current.rotation.y += delta * 0.11 * MOTION_SPEED
    group.current.rotation.x = Math.sin(elapsed * 0.22) * 0.08
    group.current.position.y = position[1] + Math.sin(elapsed * 0.45) * 0.08 + Math.sin(scrollProgress.current * Math.PI * 2) * 0.12
  })

  return (
    <group ref={group} position={position} scale={scale}>
      <mesh>
        <icosahedronGeometry args={[0.82, 2]} />
        <meshPhysicalMaterial color="#dba2b3" metalness={0.18} roughness={0.24} clearcoat={0.85} />
      </mesh>
      <mesh scale={1.12}>
        <sphereGeometry args={[0.8, 32, 32]} />
        <meshPhysicalMaterial color="#f8d7db" transparent opacity={0.16} roughness={0.08} transmission={0.7} thickness={0.7} />
      </mesh>
      <mesh rotation={[0.65, 0.3, 0.15]}>
        <torusGeometry args={[1.23, 0.012, 6, 96]} />
        <meshBasicMaterial color="#f5d9ae" transparent opacity={0.78} />
      </mesh>
      <mesh rotation={[1.14, -0.4, 0.3]}>
        <torusGeometry args={[1.42, 0.008, 6, 96]} />
        <meshBasicMaterial color="#c5b1db" transparent opacity={0.5} />
      </mesh>
    </group>
  )
}

function StarDust({ motionEnabled, count = 90 }) {
  const ref = useRef(null)
  const geometry = useMemo(() => {
    const points = new Float32Array(count * 3)
    for (let index = 0; index < count; index += 1) {
      const i = index * 3
      points[i] = (Math.random() - 0.5) * 10
      points[i + 1] = (Math.random() - 0.5) * 8
      points[i + 2] = (Math.random() - 0.5) * 6
    }
    const next = new THREE.BufferGeometry()
    next.setAttribute('position', new THREE.BufferAttribute(points, 3))
    return next
  }, [count])

  useFrame(({ clock }, delta) => {
    if (!ref.current || !motionEnabled) return
    const elapsed = clock.elapsedTime * MOTION_SPEED
    ref.current.rotation.y += delta * 0.02 * MOTION_SPEED
    ref.current.rotation.x = Math.sin(elapsed * 0.16) * 0.055
  })

  return (
    <points ref={ref} geometry={geometry}>
      <pointsMaterial color="#fff2d6" size={0.035} transparent opacity={0.9} sizeAttenuation depthWrite={false} />
    </points>
  )
}

function GalaxySpiral({ accentColor, motionEnabled }) {
  const ref = useRef(null)
  const viewport = useThree(state => state.viewport)
  const scrollProgress = useScrollProgress()
  const geometry = useMemo(() => {
    const count = 560
    const positions = new Float32Array(count * 3)
    const colors = new Float32Array(count * 3)
    const rose = new THREE.Color(accentColor)
    const lavender = new THREE.Color('#a999e6')
    const starlight = new THREE.Color('#ffe9d0')

    for (let index = 0; index < count; index += 1) {
      const offset = index * 3
      let x
      let y
      let z

      if (index < count * 0.76) {
        const radius = Math.sqrt(Math.random()) * 2.1
        const arm = index % 3
        const angle = (arm * Math.PI * 2) / 3 + radius * 2.25 + (Math.random() - 0.5) * 0.48
        x = Math.cos(angle) * radius
        y = Math.sin(angle) * radius * 0.57
        z = (Math.random() - 0.5) * 0.7 - 0.65
      } else {
        x = (Math.random() - 0.5) * viewport.width * 2.1
        y = (Math.random() - 0.5) * viewport.height * 2.1
        z = -2.4 + Math.random() * 1.8
      }

      positions[offset] = x
      positions[offset + 1] = y
      positions[offset + 2] = z

      const tint = rose.clone().lerp(lavender, Math.random() * 0.72)
      if (index % 11 === 0) tint.lerp(starlight, 0.58)
      colors[offset] = tint.r
      colors[offset + 1] = tint.g
      colors[offset + 2] = tint.b
    }

    const points = new THREE.BufferGeometry()
    points.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    points.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    return points
  }, [accentColor, viewport.height, viewport.width])

  useFrame(({ clock }, delta) => {
    if (!ref.current || !motionEnabled) return
    ref.current.rotation.z = clock.elapsedTime * MOTION_SPEED * 0.02 + scrollProgress.current * 0.42
  })

  const scale = Math.min(1.08, Math.max(0.68, viewport.width / 3.2))
  return (
    <points ref={ref} geometry={geometry} position={[viewport.width * 0.16, viewport.height * 0.08, -1.4]} scale={scale}>
      <pointsMaterial size={0.025} transparent opacity={0.82} vertexColors sizeAttenuation depthWrite={false} blending={THREE.AdditiveBlending} />
    </points>
  )
}

const FALLING_STYLES = {
  hearts: { colors: ['#f5a9c6', '#ffe0e9', '#d6b9f4', '#f8d6bc'], size: [0.1, 0.18], speed: [0.42, 0.8], sway: 0.19, spin: 0.5 },
  snow: { colors: ['#f6fbff', '#d7edff', '#dcd5ff', '#fff0f5'], size: [0.09, 0.16], speed: [0.3, 0.58], sway: 0.26, spin: 0.34 },
  flowers: { colors: ['#f4b4cc', '#ffe1ad', '#dfc7fb', '#fff1f3'], size: [0.11, 0.18], speed: [0.31, 0.62], sway: 0.2, spin: 0.42 },
  gifts: { colors: ['#f59ab0', '#f7c777', '#bdafea', '#f7d8c8'], size: [0.13, 0.2], speed: [0.24, 0.48], sway: 0.13, spin: 0.28 },
  petals: { colors: ['#f7adc8', '#fce0df', '#d6b8ea', '#f4d9b0'], size: [0.09, 0.17], speed: [0.38, 0.73], sway: 0.32, spin: 0.62 },
  stars: { colors: ['#fce8b9', '#fff8e8', '#d9ccff', '#f6c6df'], size: [0.08, 0.15], speed: [0.35, 0.68], sway: 0.18, spin: 0.82 },
}

function createFallingShape(key) {
  const shape = new THREE.Shape()
  if (key === 'snow') {
    for (let point = 0; point < 12; point += 1) {
      const angle = -Math.PI / 2 + point * Math.PI / 6
      const radius = point % 2 === 0 ? 0.7 : 0.23
      const x = Math.cos(angle) * radius
      const y = Math.sin(angle) * radius
      if (point === 0) shape.moveTo(x, y)
      else shape.lineTo(x, y)
    }
  } else if (key === 'flowers') {
    for (let point = 0; point < 60; point += 1) {
      const angle = (point / 60) * Math.PI * 2
      const radius = 0.48 + Math.cos(angle * 5) * 0.17
      const x = Math.cos(angle) * radius
      const y = Math.sin(angle) * radius
      if (point === 0) shape.moveTo(x, y)
      else shape.lineTo(x, y)
    }
  } else if (key === 'gifts') {
    shape.moveTo(-0.43, -0.46)
    shape.lineTo(0.43, -0.46)
    shape.lineTo(0.43, 0.24)
    shape.lineTo(0.52, 0.24)
    shape.lineTo(0.52, 0.42)
    shape.lineTo(0.16, 0.42)
    shape.bezierCurveTo(0.47, 0.7, 0.13, 0.8, 0, 0.51)
    shape.bezierCurveTo(-0.13, 0.8, -0.47, 0.7, -0.16, 0.42)
    shape.lineTo(-0.52, 0.42)
    shape.lineTo(-0.52, 0.24)
    shape.lineTo(-0.43, 0.24)
    shape.closePath()
  } else if (key === 'petals') {
    shape.moveTo(0, -0.58)
    shape.bezierCurveTo(-0.48, -0.14, -0.43, 0.54, 0, 0.7)
    shape.bezierCurveTo(0.43, 0.54, 0.48, -0.14, 0, -0.58)
  } else if (key === 'stars') {
    for (let point = 0; point < 10; point += 1) {
      const angle = -Math.PI / 2 + point * Math.PI / 5
      const radius = point % 2 === 0 ? 0.68 : 0.3
      const x = Math.cos(angle) * radius
      const y = Math.sin(angle) * radius
      if (point === 0) shape.moveTo(x, y)
      else shape.lineTo(x, y)
    }
  } else {
    shape.moveTo(0, -0.5)
    shape.bezierCurveTo(-0.18, -0.27, -0.72, 0.04, -0.53, 0.43)
    shape.bezierCurveTo(-0.39, 0.73, -0.08, 0.72, 0, 0.43)
    shape.bezierCurveTo(0.08, 0.72, 0.39, 0.73, 0.53, 0.43)
    shape.bezierCurveTo(0.72, 0.04, 0.18, -0.27, 0, -0.5)
  }
  shape.closePath()
  return shape
}

function FallingShapeInstances({ accentColor, effectKey, count }) {
  const mesh = useRef(null)
  const dummy = useMemo(() => new THREE.Object3D(), [])
  const viewport = useThree(state => state.viewport)
  const style = FALLING_STYLES[effectKey]
  const colors = useMemo(() => [...style.colors, accentColor], [accentColor, style])
  const particles = useMemo(() => Array.from({ length: count }, () => ({
    x: Math.random() - 0.5,
    y: Math.random() - 0.5,
    z: -1.7 + Math.random() * 2.1,
    speed: style.speed[0] + Math.random() * (style.speed[1] - style.speed[0]),
    size: style.size[0] + Math.random() * (style.size[1] - style.size[0]),
    phase: Math.random() * Math.PI * 2,
    color: colors[Math.floor(Math.random() * colors.length)],
  })), [colors, count, style, viewport.height, viewport.width])
  const shape = useMemo(() => createFallingShape(effectKey), [effectKey])

  useEffect(() => {
    if (!mesh.current) return
    const tint = new THREE.Color()
    particles.forEach((particle, index) => mesh.current.setColorAt(index, tint.set(particle.color)))
    if (mesh.current.instanceColor) mesh.current.instanceColor.needsUpdate = true
    mesh.current.instanceMatrix.setUsage(THREE.DynamicDrawUsage)
  }, [particles])

  useFrame(({ clock }) => {
    if (!mesh.current) return
    const elapsed = clock.elapsedTime * MOTION_SPEED
    const verticalSpan = viewport.height + 0.85

    particles.forEach((particle, index) => {
      const wrappedY = ((particle.y * verticalSpan - elapsed * particle.speed + verticalSpan / 2) % verticalSpan + verticalSpan) % verticalSpan - verticalSpan / 2
      const sway = Math.sin(elapsed * 0.62 + particle.phase) * style.sway
      dummy.position.set(particle.x * viewport.width + sway, wrappedY, particle.z)
      dummy.rotation.set(
        0.12 + Math.sin(elapsed * 0.8 + particle.phase) * 0.28,
        Math.sin(elapsed * 0.68 + particle.phase) * 0.62,
        elapsed * style.spin * (particle.phase % 2 < 1 ? 1 : -1) + particle.phase,
      )
      dummy.scale.setScalar(particle.size * (0.9 + Math.sin(elapsed * 1.3 + particle.phase) * 0.1))
      dummy.updateMatrix()
      mesh.current.setMatrixAt(index, dummy.matrix)
    })

    mesh.current.instanceMatrix.needsUpdate = true
  })

  return (
    <instancedMesh ref={mesh} args={[null, null, particles.length]} frustumCulled={false}>
      <extrudeGeometry args={[shape, { depth: 0.07, bevelEnabled: true, bevelSegments: 2, steps: 1, bevelSize: 0.025, bevelThickness: 0.025, curveSegments: 9 }]} />
      <meshPhysicalMaterial color="#ffffff" emissive="#fff5fc" emissiveIntensity={0.045} roughness={0.32} metalness={0.06} clearcoat={0.82} transparent opacity={0.94} depthWrite={false} side={THREE.DoubleSide} />
    </instancedMesh>
  )
}

function FallingDecorations({ accentColor, decorationKeys = ['hearts'] }) {
  const selectedKeys = [...new Set(Array.isArray(decorationKeys) ? decorationKeys : ['hearts'])].filter(key => FALLING_STYLES[key])
  if (!selectedKeys.length) return null
  const count = Math.min(22, Math.max(8, Math.floor(52 / selectedKeys.length)))
  return <>{selectedKeys.map(effectKey => <FallingShapeInstances key={effectKey} accentColor={accentColor} effectKey={effectKey} count={count} />)}</>
}

function GalaxyPlanet({ accentColor, motionEnabled, position }) {
  const group = useRef(null)
  const scrollProgress = useScrollProgress()
  useFrame(({ clock }, delta) => {
    if (!group.current || !motionEnabled) return
    const elapsed = clock.elapsedTime * MOTION_SPEED
    group.current.rotation.y = Math.sin(elapsed * 0.3) * 0.2
    group.current.rotation.z += delta * 0.12 * MOTION_SPEED
    group.current.position.y = position[1] + Math.sin(elapsed * 0.55) * 0.11 + Math.sin(scrollProgress.current * Math.PI * 2) * 0.14
    group.current.position.x = position[0] + Math.cos(elapsed * 0.32) * 0.08
  })

  return (
    <group ref={group} position={position}>
      <mesh>
        <sphereGeometry args={[0.34, 32, 32]} />
        <meshPhysicalMaterial color={accentColor} emissive={accentColor} emissiveIntensity={0.28} roughness={0.27} metalness={0.2} clearcoat={1} />
      </mesh>
      <mesh rotation={[0.86, 0.18, -0.43]}>
        <torusGeometry args={[0.5, 0.012, 7, 96]} />
        <meshBasicMaterial color="#fff0d5" transparent opacity={0.9} />
      </mesh>
      <mesh rotation={[1.18, -0.22, 0.34]}>
        <torusGeometry args={[0.62, 0.006, 5, 80]} />
        <meshBasicMaterial color="#d5c5ff" transparent opacity={0.72} />
      </mesh>
      <pointLight color={accentColor} intensity={2.4} distance={2.8} />
    </group>
  )
}

function SummerSun({ accentColor, motionEnabled, position }) {
  const group = useRef(null)
  const scrollProgress = useScrollProgress()
  useFrame(({ clock }, delta) => {
    if (!group.current || !motionEnabled) return
    const elapsed = clock.elapsedTime * MOTION_SPEED
    group.current.rotation.z += delta * 0.055 * MOTION_SPEED
    group.current.rotation.y = Math.sin(elapsed * 0.35) * 0.12
    group.current.position.y = position[1] + Math.sin(elapsed * 0.65) * 0.09 + Math.sin(scrollProgress.current * Math.PI * 2) * 0.16
  })

  return (
    <group ref={group} position={position}>
      <mesh>
        <sphereGeometry args={[0.34, 32, 32]} />
        <meshPhysicalMaterial color={accentColor} emissive={accentColor} emissiveIntensity={0.32} roughness={0.25} metalness={0.08} clearcoat={0.95} />
      </mesh>
      <mesh scale={1.25}>
        <sphereGeometry args={[0.34, 24, 24]} />
        <meshBasicMaterial color="#ffe9c3" transparent opacity={0.11} depthWrite={false} />
      </mesh>
      <mesh rotation={[0.7, 0.28, 0.2]}>
        <torusGeometry args={[0.57, 0.012, 6, 88]} />
        <meshBasicMaterial color="#ffe6bb" transparent opacity={0.85} />
      </mesh>
      <mesh rotation={[1.15, -0.3, 0.5]}>
        <torusGeometry args={[0.68, 0.006, 5, 80]} />
        <meshBasicMaterial color="#f0bad0" transparent opacity={0.72} />
      </mesh>
      <group>
        {Array.from({ length: 8 }, (_, index) => <group key={index} rotation={[0, 0, (index * Math.PI) / 4]}><mesh position={[0, 0.61, 0]}><coneGeometry args={[0.035, 0.16, 6]} /><meshBasicMaterial color="#ffe9c3" transparent opacity={0.84} /></mesh></group>)}
      </group>
      <pointLight color={accentColor} intensity={2.4} distance={2.8} />
    </group>
  )
}

function CardThemeMotif({ themeKey, accentColor, motionEnabled }) {
  const viewport = useThree(state => state.viewport)
  const position = [viewport.width * 0.34, viewport.height * 0.27, -1.1]
  if (themeKey === 'summer-letter') return <SummerSun accentColor={accentColor} motionEnabled={motionEnabled} position={position} />
  if (themeKey === 'starlit-postcard') return <GalaxyPlanet accentColor={accentColor} motionEnabled={motionEnabled} position={position} />
  return <MoonBloom motionEnabled={motionEnabled} position={[-position[0], position[1], -1.25]} scale={0.46} />
}

export default function AtmosphereCanvas({ motionEnabled, variant = 'home', accentColor = '#d593a8', themeKey = 'moon-garden', decorationKeys = ['hearts'] }) {
  const isCard = variant === 'card'
  return (
    <Canvas
      dpr={isCard ? [1, 1.15] : [1, 1.35]}
      camera={{ position: [0, 0, 5], fov: 44 }}
      gl={{ alpha: true, antialias: false, powerPreference: 'low-power' }}
      fallback={<div className="atmosphere-fallback" />}
    >
      <ambientLight intensity={isCard ? 0.82 : 1.1} />
      {isCard ? <>
        <pointLight position={[2.5, 2.7, 3]} color="#ffced8" intensity={10} distance={8} />
        <pointLight position={[-3, -1.5, 2]} color="#aaa4ec" intensity={7} distance={8} />
        <StarDust motionEnabled={motionEnabled} count={120} />
        {themeKey === 'starlit-postcard' && <GalaxySpiral accentColor={accentColor} motionEnabled={motionEnabled} />}
        <FallingDecorations accentColor={accentColor} decorationKeys={decorationKeys} />
        <CardThemeMotif themeKey={themeKey} accentColor={accentColor} motionEnabled={motionEnabled} />
      </> : <>
        <pointLight position={[2.5, 2.7, 3]} color="#ffced8" intensity={16} distance={10} />
        <pointLight position={[-3, -1.5, 2]} color="#aaa4ec" intensity={10} distance={9} />
        <StarDust motionEnabled={motionEnabled} />
        <MoonBloom motionEnabled={motionEnabled} />
      </>}
    </Canvas>
  )
}
