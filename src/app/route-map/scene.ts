import * as THREE from "three";
import { CSS2DObject, CSS2DRenderer } from "three/examples/jsm/renderers/CSS2DRenderer.js";
// Real road (OSRM) and river (OpenStreetMap) geometry, in km around the Bhubaneswar–Cuttack midpoint. x = east, z = south.
import geo from "./geo.json";

export type MapLabels = { bbsr: string; ctc: string; river: string };

const ROAD_KM = 26.2;
const INK = new THREE.Color("#171411");
const RED = new THREE.Color("#b3261e");
const RIVER = new THREE.Color("#6f93ad");
const INTRO_SECONDS = 3.6;
const LAP_SECONDS = 14;

const v3 = (p: number[], y = 0) => new THREE.Vector3(p[0], y, p[1]);
const ease = (x: number) => 1 - Math.pow(1 - Math.min(1, Math.max(0, x)), 3);

function distToPolyline(x: number, z: number, pts: number[][]) {
  let best = Infinity;
  for (let i = 0; i < pts.length - 1; i++) {
    const [ax, az] = pts[i], [bx, bz] = pts[i + 1];
    const dx = bx - ax, dz = bz - az;
    const t = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / (dx * dx + dz * dz || 1)));
    best = Math.min(best, Math.hypot(x - ax - t * dx, z - az - t * dz));
  }
  return best;
}

function htmlLabel(html: string) {
  const el = document.createElement("div");
  el.innerHTML = html;
  return new CSS2DObject(el);
}

/**
 * Mounts the 3D route map into `container`. The camera tilts from a flat map into perspective while the road draws,
 * then a walker loops the route; horizontal drag rotates the map. Returns a cleanup function.
 */
export function mountRouteMap(container: HTMLElement, labels: MapLabels, animate: boolean, kmEl?: HTMLElement | null) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "low-power" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  container.appendChild(renderer.domElement);

  const labelRenderer = new CSS2DRenderer();
  Object.assign(labelRenderer.domElement.style, { position: "absolute", inset: "0", pointerEvents: "none" });
  container.appendChild(labelRenderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 200);
  const target = new THREE.Vector3(0, 0, 0);
  const { bbsr, ctc } = geo.cities;

  // Dot-matrix ground in ink; dots near the road are darker, and a ripple follows the walker.
  const dots: number[] = [];
  const near: number[] = [];
  for (let x = -24; x <= 24; x += 0.5) {
    for (let z = -24; z <= 24; z += 0.5) {
      if (x * x + z * z > 24 * 24) continue;
      dots.push(x, 0, z);
      const d = distToPolyline(x, z, geo.route);
      near.push(Math.exp(-(d * d) / 2.5));
    }
  }
  const dotGeo = new THREE.BufferGeometry();
  dotGeo.setAttribute("position", new THREE.Float32BufferAttribute(dots, 3));
  dotGeo.setAttribute("aNear", new THREE.Float32BufferAttribute(near, 1));
  const dotMat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    uniforms: {
      uWalker: { value: new THREE.Vector3(999, 0, 999) },
      uInk: { value: INK },
      uRed: { value: RED },
      uScale: { value: renderer.getPixelRatio() },
    },
    vertexShader: /* glsl */ `
      uniform vec3 uWalker; uniform float uScale;
      attribute float aNear;
      varying float vAlpha; varying float vWave;
      void main() {
        vec3 p = position;
        float d = distance(p.xz, uWalker.xz);
        vWave = exp(-d * d / 3.0);
        p.y += vWave * 0.35;
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_Position = projectionMatrix * mv;
        gl_PointSize = (2.2 + aNear * 1.2 + vWave * 2.5) * uScale * (30.0 / -mv.z);
        vAlpha = (0.13 + aNear * 0.22 + vWave * 0.5) * (1.0 - smoothstep(14.0, 24.0, length(p.xz)));
      }`,
    fragmentShader: /* glsl */ `
      uniform vec3 uInk; uniform vec3 uRed; varying float vAlpha; varying float vWave;
      void main() {
        if (length(gl_PointCoord - 0.5) > 0.5) discard;
        gl_FragColor = vec4(mix(uInk, uRed, vWave), vAlpha);
        #include <colorspace_fragment>
      }`,
  });
  scene.add(new THREE.Points(dotGeo, dotMat));

  // Rivers
  const riverMat = new THREE.MeshBasicMaterial({ color: RIVER, transparent: true, opacity: 0.55, depthWrite: false });
  for (const r of geo.rivers) {
    const curve = new THREE.CatmullRomCurve3(r.pts.map((p) => v3(p, 0.02)));
    scene.add(new THREE.Mesh(new THREE.TubeGeometry(curve, r.pts.length * 4, 0.06, 6), riverMat));
  }
  const mahanadi = geo.rivers.filter((r) => r.name === "Mahanadi").flatMap((r) => r.pts);
  const riverAt = mahanadi.reduce((a, b) =>
    Math.hypot(b[0] - ctc[0] + 7, b[1] - ctc[1] + 1) < Math.hypot(a[0] - ctc[0] + 7, a[1] - ctc[1] + 1) ? b : a,
  );
  const riverLabel = htmlLabel(`<span class="font-serif text-base italic text-[#5b7f99]">${labels.river}</span>`);
  riverLabel.position.copy(v3(riverAt, 0.3));
  scene.add(riverLabel);

  // Road: solid red core and a soft halo, both revealed along uv.x; a lighter streak trails the walker.
  const routeCurve = new THREE.CatmullRomCurve3(geo.route.map((p) => v3(p, 0.1)), false, "centripetal");
  const shared = { uProgress: { value: 0 }, uHead: { value: -1 }, uRed: { value: RED } };
  const roadMat = (opacity: number) =>
    new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      uniforms: { ...shared, uOpacity: { value: opacity } },
      vertexShader: `varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
      fragmentShader: /* glsl */ `
        uniform float uProgress, uHead, uOpacity; uniform vec3 uRed; varying vec2 vUv;
        void main() {
          if (vUv.x > uProgress) discard;
          float trail = smoothstep(0.12, 0.0, uHead - vUv.x) * step(vUv.x, uHead);
          gl_FragColor = vec4(mix(uRed, vec3(0.9, 0.35, 0.03), trail), uOpacity);
          #include <colorspace_fragment>
        }`,
    });
  scene.add(new THREE.Mesh(new THREE.TubeGeometry(routeCurve, 320, 0.13, 10), roadMat(1)));
  scene.add(new THREE.Mesh(new THREE.TubeGeometry(routeCurve, 320, 0.42, 10), roadMat(0.12)));

  // Walker: red bead with a white rim and a ground ripple.
  const walker = new THREE.Group();
  const rim = new THREE.Mesh(new THREE.SphereGeometry(0.34, 24, 24), new THREE.MeshBasicMaterial({ color: 0xffffff }));
  const bead = new THREE.Mesh(new THREE.SphereGeometry(0.25, 24, 24), new THREE.MeshBasicMaterial({ color: RED }));
  bead.position.y = 0.02;
  rim.scale.y = 0.9;
  const ripple = new THREE.Mesh(
    new THREE.RingGeometry(0.5, 0.58, 48),
    new THREE.MeshBasicMaterial({ color: RED, transparent: true, depthWrite: false, side: THREE.DoubleSide }),
  );
  ripple.rotation.x = -Math.PI / 2;
  ripple.position.y = -0.3;
  walker.add(rim, bead, ripple);
  walker.visible = false;
  scene.add(walker);

  // Cities: ink pin, thin leader line, typographic label with coordinates.
  const leaderMat = new THREE.LineBasicMaterial({ color: INK, transparent: true, opacity: 0.55 });
  const cities = [
    // Label offsets keep the names off the road line.
    { pos: bbsr, name: labels.bbsr, coord: "20.30°N · 85.82°E", off: [-4, 2.6] },
    { pos: ctc, name: labels.ctc, coord: "20.46°N · 85.88°E", off: [-3, -0.5] },
  ];
  for (const c of cities) {
    const pin = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.12, 32), new THREE.MeshBasicMaterial({ color: INK }));
    pin.position.copy(v3(c.pos, 0.06));
    scene.add(pin);
    const dot = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.14, 24), new THREE.MeshBasicMaterial({ color: 0xffffff }));
    dot.position.copy(v3(c.pos, 0.08));
    scene.add(dot);
    const top = v3([c.pos[0] + c.off[0], c.pos[1] + c.off[1]], 3.4);
    scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([v3(c.pos, 0.1), top]), leaderMat));
    const tag = htmlLabel(
      `<div class="-translate-y-1/2 text-center whitespace-nowrap">
        <div class="font-serif text-xl leading-none text-ink">${c.name}</div>
        <div class="mt-1 text-[9px] font-medium tracking-[0.16em] text-ink-3">${c.coord}</div>
      </div>`,
    );
    tag.position.copy(top);
    scene.add(tag);
  }

  // Horizontal drag rotates the map; vertical swipes still scroll the page (touch-action: pan-y on the container).
  let dragAz = 0;
  let velocity = 0;
  let dragging = false;
  let lastX = 0;
  const el = renderer.domElement;
  const onDown = (e: PointerEvent) => {
    dragging = true;
    lastX = e.clientX;
    el.setPointerCapture(e.pointerId);
  };
  const onMove = (e: PointerEvent) => {
    if (!dragging) return;
    velocity = (e.clientX - lastX) * -0.006;
    dragAz += velocity;
    lastX = e.clientX;
  };
  const onUp = () => (dragging = false);
  el.addEventListener("pointerdown", onDown);
  el.addEventListener("pointermove", onMove);
  el.addEventListener("pointerup", onUp);
  el.addEventListener("pointercancel", onUp);
  el.style.cursor = "grab";

  let radius = 40;
  const resize = () => {
    const w = container.clientWidth, h = container.clientHeight;
    renderer.setSize(w, h);
    labelRenderer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    radius = camera.aspect < 1 ? 50 : 42; // pull back on portrait phones so both cities fit
  };
  resize();

  const head = new THREE.Vector3();
  const far = new THREE.Vector3(999, 0, 999);
  let lastKm = "";
  const frame = (t: number) => {
    const intro = ease(t / INTRO_SECONDS);
    shared.uProgress.value = ease((t - 0.4) / (INTRO_SECONDS - 0.6));

    if (!dragging) {
      dragAz += velocity;
      velocity *= 0.92;
    }
    const polar = 0.12 + 0.78 * intro; // top-down → tilted
    const az = -0.55 + Math.sin(t * 0.1) * 0.12 + dragAz;
    const r = radius * (1.2 - 0.2 * intro);
    camera.position.set(r * Math.sin(polar) * Math.sin(az), r * Math.cos(polar), r * Math.sin(polar) * Math.cos(az));
    camera.lookAt(target);

    const lap = t < INTRO_SECONDS ? -1 : ((t - INTRO_SECONDS) / LAP_SECONDS) % 1;
    shared.uHead.value = lap;
    walker.visible = lap >= 0;
    if (lap >= 0) {
      routeCurve.getPointAt(lap, head);
      walker.position.copy(head).setY(0.42);
      const k = (t * 0.9) % 1;
      ripple.scale.setScalar(1 + k * 2.5);
      (ripple.material as THREE.MeshBasicMaterial).opacity = 0.6 * (1 - k);
    }
    dotMat.uniforms.uWalker.value.copy(lap >= 0 ? head : far);

    if (kmEl) {
      const km = (lap >= 0 ? lap * ROAD_KM : shared.uProgress.value * ROAD_KM).toFixed(1);
      if (km !== lastKm) kmEl.textContent = lastKm = km;
    }

    renderer.render(scene, camera);
    labelRenderer.render(scene, camera);
  };

  // Only animate while on screen and the tab is visible; reduced-motion users get one still frame.
  // The clock only runs while visible, so the intro plays when the map is first scrolled into view.
  let raf = 0;
  let onScreen = false;
  let elapsed = 0;
  let last = 0;
  const loop = (now: number) => {
    raf = 0;
    if (!onScreen || document.hidden) {
      last = 0;
      return;
    }
    if (last) elapsed += Math.min(0.1, (now - last) / 1000);
    last = now;
    frame(elapsed);
    raf = requestAnimationFrame(loop);
  };
  const kick = () => {
    if (animate && !raf) raf = requestAnimationFrame(loop);
  };
  const still = () => frame(INTRO_SECONDS + LAP_SECONDS * 0.55);
  const io = new IntersectionObserver(([e]) => {
    onScreen = e.isIntersecting;
    kick();
  });
  io.observe(container);
  document.addEventListener("visibilitychange", kick);
  const ro = new ResizeObserver(() => {
    resize();
    if (!animate) still();
  });
  ro.observe(container);
  if (animate) frame(0);
  else still();

  return () => {
    cancelAnimationFrame(raf);
    io.disconnect();
    ro.disconnect();
    document.removeEventListener("visibilitychange", kick);
    el.removeEventListener("pointerdown", onDown);
    el.removeEventListener("pointermove", onMove);
    el.removeEventListener("pointerup", onUp);
    el.removeEventListener("pointercancel", onUp);
    scene.traverse((o) => {
      if (o instanceof THREE.Mesh || o instanceof THREE.Points || o instanceof THREE.Line) {
        o.geometry.dispose();
        (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => m.dispose());
      }
    });
    renderer.dispose();
    renderer.domElement.remove();
    labelRenderer.domElement.remove();
  };
}
