import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { encodeMatrix } from '@/qr/encoder';

interface SceneApi {
  setActive: (active: boolean) => void;
}

const cssColor = (name: string): THREE.Color => {
  const [r, g, b] = getComputedStyle(document.documentElement).getPropertyValue(name).trim().split(/\s+/).map(Number);
  return new THREE.Color(`rgb(${r}, ${g}, ${b})`);
};

/**
 * A soft matte 3D QR code under warm key + fill light. No emissive materials, no bloom.
 * It sits still and only leans toward the pointer (lerped). Rendering is on demand, so a settled scene costs nothing.
 */
export default function HeroScene({ active }: { active: boolean }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const apiRef = useRef<SceneApi | null>(null);
  const activeRef = useRef(active);
  activeRef.current = active;

  useEffect(() => {
    const container = hostRef.current;
    if (!container) return;
    // Re-bind to a typed const: narrowing from the `if` above does not reach the closures below.
    const host: HTMLDivElement = container;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' });
    } catch (err) {
      console.warn('QR Studio: WebGL is unavailable, the hero model is skipped.', err);
      return;
    }
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping; // without this, highlights clip to flat white
    renderer.toneMappingExposure = 1;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.setClearColor(0x000000, 0); // no composer, so a transparent canvas is safe and theme-proof
    renderer.domElement.style.display = 'block';
    host.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 60);

    // Warm key from upper left, gentle fill, faint rim from the lower right.
    const key = new THREE.DirectionalLight(0xffe4c0, 2.7);
    key.position.set(-3.5, 4.5, 6);
    key.castShadow = true;
    key.shadow.mapSize.set(2048, 2048);
    key.shadow.camera.left = -4;
    key.shadow.camera.right = 4;
    key.shadow.camera.top = 4;
    key.shadow.camera.bottom = -4;
    key.shadow.camera.near = 0.5;
    key.shadow.camera.far = 20;
    key.shadow.bias = -0.0004;
    key.shadow.normalBias = 0.02;
    const fill = new THREE.HemisphereLight(0xfff3e2, 0x6b5842, 0.95);
    const rim = new THREE.DirectionalLight(0xffd8a6, 0.55);
    rim.position.set(4, -2.5, 3);
    scene.add(key, fill, rim);

    // Geometry: a plate, a thin lip, and one instanced block per dark module.
    const matrix = encodeMatrix('https://qr.studio/hello', 'M');
    const n = matrix.size;
    const quiet = 2;
    const unit = 4 / (n + quiet * 2);
    const lipMat = new THREE.MeshStandardMaterial({ roughness: 0.92, metalness: 0 });
    const plateMat = new THREE.MeshStandardMaterial({ roughness: 0.88, metalness: 0 });
    const modMat = new THREE.MeshStandardMaterial({ roughness: 0.7, metalness: 0 });

    const group = new THREE.Group();
    const lip = new THREE.Mesh(new THREE.BoxGeometry(4.22, 4.22, 0.1), lipMat);
    lip.position.z = -0.045;
    lip.receiveShadow = true;
    const plate = new THREE.Mesh(new THREE.BoxGeometry(4, 4, 0.14), plateMat);
    plate.receiveShadow = true;

    let count = 0;
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (matrix.isDark(r, c)) count++;
    const blocks = new THREE.InstancedMesh(new THREE.BoxGeometry(unit * 0.94, unit * 0.94, 0.17), modMat, count);
    blocks.castShadow = true;
    blocks.receiveShadow = true;
    const m4 = new THREE.Matrix4();
    let i = 0;
    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n; c++) {
        if (!matrix.isDark(r, c)) continue;
        m4.setPosition((c - (n - 1) / 2) * unit, -(r - (n - 1) / 2) * unit, 0.07 + 0.085);
        blocks.setMatrixAt(i++, m4);
      }
    }
    blocks.instanceMatrix.needsUpdate = true;
    group.add(lip, plate, blocks);
    scene.add(group);

    const applyTheme = () => {
      plateMat.color.copy(cssColor('--surface'));
      modMat.color.copy(cssColor('--ink-primary'));
      lipMat.color.copy(cssColor('--border'));
      dirty = true;
    };

    // Motion state: pointer target -> lerped current. No idle animation.
    const base = { x: -0.16, y: 0.36 };
    const target = { x: 0, y: 0 };
    const current = { x: 0, y: 0 };
    let dirty = true;
    let raf = 0;
    let last = 0;

    const onPointer = (e: PointerEvent) => {
      target.x = (e.clientX / window.innerWidth - 0.5) * 2;
      target.y = (e.clientY / window.innerHeight - 0.5) * 2;
    };
    if (!reduceMotion) window.addEventListener('pointermove', onPointer, { passive: true });

    const fit = () => {
      const w = Math.max(1, host.clientWidth);
      const h = Math.max(1, host.clientHeight);
      renderer.setSize(w, h);
      camera.aspect = w / h;
      const dist = Math.max(10.5, 5.6 / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.aspect));
      camera.position.set(0, 0, dist);
      camera.updateProjectionMatrix();
      dirty = true;
    };
    const ro = new ResizeObserver(fit);
    ro.observe(host);
    fit();

    const tick = (t: number) => {
      raf = requestAnimationFrame(tick);
      const dt = Math.min(0.05, (t - last) / 1000 || 0.016);
      last = t;
      const k = 1 - Math.pow(1 - 0.04, dt * 60); // current += (target - current) * 0.04, frame-rate independent
      const dx = target.x - current.x;
      const dy = target.y - current.y;
      current.x += dx * k;
      current.y += dy * k;
      if (!dirty && Math.abs(dx) < 0.0005 && Math.abs(dy) < 0.0005) return;
      group.rotation.x = base.x + current.y * 0.14;
      group.rotation.y = base.y + current.x * 0.24;
      group.position.x = current.x * 0.12;
      group.position.y = -current.y * 0.08;
      renderer.render(scene, camera);
      dirty = false;
    };
    const start = () => {
      if (!raf) {
        last = performance.now();
        dirty = true;
        raf = requestAnimationFrame(tick);
      }
    };
    const stop = () => {
      cancelAnimationFrame(raf);
      raf = 0;
    };

    apiRef.current = { setActive: (a) => (a ? start() : stop()) };
    applyTheme();
    const mo = new MutationObserver(applyTheme);
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    if (activeRef.current) start();

    return () => {
      stop();
      apiRef.current = null;
      mo.disconnect();
      ro.disconnect();
      window.removeEventListener('pointermove', onPointer);
      // Recursive disposal; Mesh.material may be a single material or an array.
      group.traverse((obj) => {
        const mesh = obj as THREE.Mesh;
        if (!mesh.isMesh) return;
        mesh.geometry.dispose();
        const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
        mats.forEach((mt) => mt.dispose());
      });
      blocks.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      renderer.domElement.remove();
    };
  }, []);

  useEffect(() => {
    apiRef.current?.setActive(active);
  }, [active]);

  return <div ref={hostRef} className="h-full w-full" aria-hidden="true" />;
}
