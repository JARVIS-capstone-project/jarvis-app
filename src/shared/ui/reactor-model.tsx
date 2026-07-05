import { Suspense, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Center, useGLTF } from '@react-three/drei'
import type { Group } from 'three'
import { useTheme } from '@app/providers/theme-context'

// Resolved from Vite's public/ at runtime — do NOT import via the module graph
// or Vite tries to inline the .glb into the bundle.
const MODEL_URL = '/models/arc-reactor.glb'

// The .glb is Draco-compressed (geometry ~10× smaller). drei's useGLTF loads
// the decoder wasm from this path on first use — files live in public/draco/,
// copied from three/examples/jsm/libs/draco/gltf/.
const DRACO_DECODER_PATH = '/draco/'

// Static hero tilt applied to the OUTER group. The inner group is what spins,
// so the tilt never gets animated away.
const HERO_TILT: [number, number, number] = [0.9, 0.25, 0]

// Model-fitting scale. Tune if the reactor looks too big or too small. This
// replaces drei's <Bounds fit> — Bounds animated the camera on load, which
// read as a pop-up "zoom-in" effect. Fixed scale = instant, no animation.
const MODEL_SCALE = 0.4

/**
 * The rotating mesh. `<Center>` re-anchors the model's origin to (0,0,0) so
 * models exported from any tool sit centered regardless of their pivot point.
 * The wrapping group spins on Y so the auto-centered mesh rotates around its
 * true visual center.
 */
function SpinningReactor() {
  const spinRef = useRef<Group>(null)
  const { scene } = useGLTF(MODEL_URL, DRACO_DECODER_PATH)

  useFrame((_, delta) => {
    if (spinRef.current) spinRef.current.rotation.y += delta * 0.5
  })

  return (
    <group rotation={HERO_TILT} scale={MODEL_SCALE}>
      <group ref={spinRef}>
        <Center>
          <primitive object={scene} />
        </Center>
      </group>
    </group>
  )
}

// Warm the cache on module import so the first paint after route entry isn't
// blocked on the network fetch.
useGLTF.preload(MODEL_URL, DRACO_DECODER_PATH)

/**
 * The 3D reactor mesh — Canvas + theme-aware lights + spinning glTF.
 *
 * Lighting swaps with the app theme:
 *   - Dark  → warm, dramatic, brand-orange rig (matches the HUD scene glow)
 *   - Light → brighter, near-white rig with a subtle brand-orange rim so the
 *             mesh stays legible on the cream canvas (the warm dark rig
 *             read as murky/underexposed on a light background)
 *
 * react-three-fiber reconciles the light nodes when `isDark` flips, so the
 * scene updates the moment the theme toggle changes.
 */
export function ReactorModel() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  return (
    <div className="pointer-events-none size-full">
      <Canvas
        gl={{ alpha: true, antialias: true }}
        camera={{ position: [-2, 0, 4], fov: 15 }}
      >
        {isDark ? (
          <>
            <ambientLight intensity={0.6} />
            <directionalLight position={[2, 2, 4]} intensity={1.1} color="#fe6128" />
            <directionalLight position={[-2, -1, -2]} intensity={0.7} color="#ffb090" />
            <pointLight position={[0, 0, 2]} intensity={1.2} color="#fe6128" distance={6} />
          </>
        ) : (
          <>
            <ambientLight intensity={1.3} />
            <directionalLight position={[2, 2, 4]} intensity={1.6} color="#ffffff" />
            <directionalLight position={[-2, -1, -2]} intensity={0.9} color="#fff2e6" />
            <pointLight position={[0, 0, 2]} intensity={0.7} color="#fe6128" distance={6} />
          </>
        )}

        <Suspense fallback={null}>
          <SpinningReactor />
        </Suspense>
      </Canvas>
    </div>
  )
}
