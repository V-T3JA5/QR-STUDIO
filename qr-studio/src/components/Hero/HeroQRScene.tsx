import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js'
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js'
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js'

const CYAN = new THREE.Color('#2DE2E6')
const VIOLET = new THREE.Color('#8B5CF6')
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

export function HeroQRScene() {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const reducedMotion = prefersReducedMotion()

    // ── Scene / camera / renderer ──────────────────────────────
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100)
    camera.position.set(0, 0, 11)

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.outputColorSpace = THREE.SRGBColorSpace
    container.appendChild(renderer.domElement)

    // ── Post-processing (bloom for the neon glow) ──────────────
    const composer = new EffectComposer(renderer)
    composer.addPass(new RenderPass(scene, camera))
    const bloomPass = new UnrealBloomPass(new THREE.Vector2(1, 1), 1.1, 0.5, 0.15)
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
        const emissive = CYAN.clone().lerp(VIOLET, t)

        const material = new THREE.MeshPhysicalMaterial({
          color: new THREE.Color('#0a0a14'),
          roughness: 0.35,
          metalness: 0.6,
          clearcoat: 0.4,
          emissive,
          emissiveIntensity: 0.9,
        })

        const mesh = new THREE.Mesh(blockGeo, material)
        mesh.scale.set(0.92, 0.92, depth)
        mesh.position.set((x - offset) * spacing * 0.4, (offset - y) * spacing * 0.4, depth / 2)
        group.add(mesh)
      }
    }
    group.scale.setScalar(0.62)
    scene.add(group)

    // ── Lighting ─────────────────────────────────────────────────
    scene.add(new THREE.AmbientLight(0x404060, 0.6))

    const keyLight = new THREE.DirectionalLight(0xffffff, 1.2)
    keyLight.position.set(5, 6, 8)
    scene.add(keyLight)

    const rimLight = new THREE.PointLight(CYAN, 2, 20)
    rimLight.position.set(-4, 2, 4)
    scene.add(rimLight)

    // A single light that periodically sweeps across the surface for the
    // "occasional neon light sweep" effect, rather than a constant animation.
    const sweepLight = new THREE.PointLight(VIOLET, 0, 15)
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
          sweepLight.intensity = Math.sin(sweepProgress * Math.PI) * 6
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
      group.children.forEach((child) => {
        if (child instanceof THREE.Mesh) {
          if (Array.isArray(child.material)) {
            child.material.forEach((m) => m.dispose())
          } else {
            child.material.dispose()
          }
        }
      })
      blockGeo.dispose()
      renderer.dispose()
      composer.dispose()
      container!.removeChild(renderer.domElement)
    }
  }, [])

  return <div ref={containerRef} className="w-full h-full" aria-hidden="true" />
}
