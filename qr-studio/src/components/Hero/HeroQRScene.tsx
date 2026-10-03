import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js'
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js'

const CYAN = new THREE.Color('#2DE2E6')
const PLUM = new THREE.Color('#B5577E')

interface Props {
  // Path to a .glb file (e.g. '/models/qr-hero.glb' in /public) to use in
  // place of the procedural block grid. Leave undefined until you have one —
  // the procedural fallback renders either way, so this is safe to add now.
  modelUrl?: string
}
const GRID_SIZE = 13 // odd number so there's a clean center
const BLOCK_GAP = 0.12

// A fixed, hand-shaped pattern that *reads* as a QR code (corner finder
// squares + a scattered field) without encoding real data — this is a
// decorative hero object, not the functional QR output.
function buildPattern(size: number): boolean[][] {
  const grid: boolean[][] = Array.from({ length: size }, () => Array(size).fill(false))
  const seedRandom = (x: number, y: number) => {
    const v = Math.sin(x * 127.1 + y * 311.7) * 43758.5453
    return v - Math.floor(v)
  }
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      grid[y][x] = seedRandom(x, y) > 0.52
    }
  }
  // Stamp finder-pattern-style squares in three corners for visual QR recognition.
  const stampFinder = (ox: number, oy: number) => {
    for (let y = 0; y < 5; y++) {
      for (let x = 0; x < 5; x++) {
        const border = x === 0 || x === 4 || y === 0 || y === 4
        const core = x >= 1 && x <= 3 && y >= 1 && y <= 3 && !(x === 2 && y === 2)
        grid[oy + y][ox + x] = border || core
      }
    }
  }
  stampFinder(0, 0)
  stampFinder(size - 5, 0)
  stampFinder(0, size - 5)
  return grid
}

function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export function HeroQRScene({ modelUrl }: Props = {}) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const reducedMotion = prefersReducedMotion()

    // ── Scene / camera / renderer ──────────────────────────────
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100)
    camera.position.set(0, 0, 12.5)

    // Opaque, color-matched to the hero's own background rather than fighting
    // UnrealBloomPass's known alpha-compositing quirks — it reliably clobbers
    // alpha to 1 on the bloom composite, which was the cause of the visible
    // rectangle. Matching the clear color makes the seam disappear instead.
    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.0
    renderer.setClearColor(0x07070a, 1)
    container.appendChild(renderer.domElement)

    // ── Post-processing (restrained bloom — accents only, not a wash) ──
    const composer = new EffectComposer(renderer)
    composer.addPass(new RenderPass(scene, camera))
    // strength, radius, threshold — threshold raised so only genuinely bright
    // emissive edges bloom, strength cut by more than half from the last pass.
    const bloomPass = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.45, 0.4, 0.55)
    composer.addPass(bloomPass)
    composer.addPass(new OutputPass())

    // ── The QR block grid ───────────────────────────────────────
    const group = new THREE.Group()
    const pattern = buildPattern(GRID_SIZE)
    const blockGeo = new RoundedBoxGeometry(1, 1, 1, 3, 0.08)
    const spacing = 1 + BLOCK_GAP
    const offset = (GRID_SIZE - 1) / 2

    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        if (!pattern[y][x]) continue
        const depth = 0.4 + Math.random() * 0.5
        const t = (x + y) / (GRID_SIZE * 2) // diagonal gradient position 0..1
        const emissive = CYAN.clone().lerp(PLUM, t)

        const material = new THREE.MeshPhysicalMaterial({
          color: new THREE.Color('#0a0a14'),
          roughness: 0.35,
          metalness: 0.6,
          clearcoat: 0.4,
          emissive,
          emissiveIntensity: 0.35,
        })

        const mesh = new THREE.Mesh(blockGeo, material)
        mesh.scale.set(0.92, 0.92, depth)
        mesh.position.set((x - offset) * spacing * 0.4, (offset - y) * spacing * 0.4, depth / 2)
        group.add(mesh)
      }
    }
    group.scale.setScalar(0.52)
    scene.add(group)

    // If a model URL is supplied, load it and swap it in for the procedural
    // grid once ready. The procedural grid renders immediately in the
    // meantime so there's never an empty hero while the model loads.
    if (modelUrl) {
      const loader = new GLTFLoader()
      loader.load(
        modelUrl,
        (gltf) => {
          group.clear() // remove the procedural blocks
          const model = gltf.scene
          // Center and scale the model to roughly fill the same footprint
          // the procedural grid occupied, regardless of its native size.
          const box = new THREE.Box3().setFromObject(model)
          const size = box.getSize(new THREE.Vector3())
          const center = box.getCenter(new THREE.Vector3())
          const maxDim = Math.max(size.x, size.y, size.z) || 1
          model.scale.setScalar(6 / maxDim)
          model.position.sub(center.multiplyScalar(6 / maxDim))
          group.add(model)
        },
        undefined,
        (err) => {
          // Load failed (bad path, bad format) — keep the procedural grid
          // rather than leaving an empty hero.
          console.warn('[HeroQRScene] Failed to load model, using procedural fallback:', err)
        },
      )
    }

    // ── Lighting ─────────────────────────────────────────────────
    scene.add(new THREE.AmbientLight(0x404060, 0.6))

    const keyLight = new THREE.DirectionalLight(0xffffff, 1.2)
    keyLight.position.set(5, 6, 8)
    scene.add(keyLight)

    const rimLight = new THREE.PointLight(CYAN, 1.1, 20)
    rimLight.position.set(-4, 2, 4)
    scene.add(rimLight)

    // A single light that periodically sweeps across the surface for the
    // "occasional neon light sweep" effect, rather than a constant animation.
    const sweepLight = new THREE.PointLight(PLUM, 0, 15)
    sweepLight.position.set(0, 0, 5)
    scene.add(sweepLight)

    // ── Resize handling ──────────────────────────────────────────
    function handleResize() {
      const { clientWidth, clientHeight } = container!
      camera.aspect = clientWidth / clientHeight
      camera.updateProjectionMatrix()
      renderer.setSize(clientWidth, clientHeight)
      composer.setSize(clientWidth, clientHeight)
      bloomPass.setSize(clientWidth, clientHeight)
    }
    const resizeObserver = new ResizeObserver(handleResize)
    resizeObserver.observe(container)
    handleResize()

    // ── Subtle mouse parallax (lerped, never snaps) ────────────
    const mouseTarget = { x: 0, y: 0 }
    const mouseCurrent = { x: 0, y: 0 }
    function handlePointerMove(e: PointerEvent) {
      const rect = container!.getBoundingClientRect()
      mouseTarget.x = ((e.clientX - rect.left) / rect.width - 0.5) * 2
      mouseTarget.y = ((e.clientY - rect.top) / rect.height - 0.5) * 2
    }
    if (!reducedMotion) window.addEventListener('pointermove', handlePointerMove)

    // ── Animation loop ──────────────────────────────────────────
    const clock = new THREE.Clock()
    let frameId: number
    let sweepTimer = 2 + Math.random() * 2

    function animate() {
      frameId = requestAnimationFrame(animate)
      const dt = clock.getDelta()
      const elapsed = clock.getElapsedTime()

      if (!reducedMotion) {
        group.rotation.y = Math.sin(elapsed * 0.25) * 0.35 + elapsed * 0.08
        group.position.y = Math.sin(elapsed * 0.6) * 0.15

        mouseCurrent.x += (mouseTarget.x - mouseCurrent.x) * 0.04
        mouseCurrent.y += (mouseTarget.y - mouseCurrent.y) * 0.04
        group.rotation.x = -mouseCurrent.y * 0.12
        group.rotation.z = mouseCurrent.x * 0.06

        // Periodic sweep: light ramps up, travels across x, fades out, then waits.
        sweepTimer -= dt
        if (sweepTimer <= 0) {
          sweepTimer = 4 + Math.random() * 3
        }
        const sweepProgress = 1 - Math.min(1, Math.max(0, sweepTimer / 2))
        if (sweepTimer < 2) {
          sweepLight.intensity = Math.sin(sweepProgress * Math.PI) * 3
          sweepLight.position.x = (sweepProgress - 0.5) * 8
        } else {
          sweepLight.intensity = 0
        }
      }

      composer.render()
    }
    animate()

    // ── Cleanup ──────────────────────────────────────────────────
    return () => {
      cancelAnimationFrame(frameId)
      resizeObserver.disconnect()
      window.removeEventListener('pointermove', handlePointerMove)
      // Recursive traversal — required once a loaded GLTF model (a nested
      // tree, not flat children) can occupy this group, not just the flat
      // procedural block list.
      group.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          if (Array.isArray(child.material)) {
            child.material.forEach((m) => m.dispose())
          } else {
            child.material.dispose()
          }
          if (child.geometry !== blockGeo) child.geometry.dispose()
        }
      })
      blockGeo.dispose()
      renderer.dispose()
      composer.dispose()
      container!.removeChild(renderer.domElement)
    }
  }, [modelUrl])

  return <div ref={containerRef} className="w-full h-full" aria-hidden="true" />
}
