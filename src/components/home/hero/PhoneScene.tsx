"use client";
/**
 * Smartphone 3D procédural (Three.js + React Three Fiber).
 * Aucun modèle à télécharger : la géométrie est construite à la volée,
 * l'écran est un shader animé, les reflets viennent d'un environnement
 * de studio généré (RoomEnvironment). Le rendu s'arrête hors écran.
 */
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import type { MotionValue } from "framer-motion";

export type PhoneAngle = "face" | "profil" | "dos";
const ANGLES: Record<PhoneAngle, number> = { face: -0.38, profil: -Math.PI / 2 + 0.12, dos: Math.PI - 0.42 };

const W = 0.74;
const H = 1.52;
const R = 0.12;
const D = 0.06; // épaisseur de l'extrusion (hors biseau)
const BEVEL = 0.018;

function roundedRect(w: number, h: number, r: number) {
  const s = new THREE.Shape();
  const x = -w / 2;
  const y = -h / 2;
  s.moveTo(x + r, y);
  s.lineTo(x + w - r, y);
  s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + h - r);
  s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  s.lineTo(x + r, y + h);
  s.quadraticCurveTo(x, y + h, x, y + h - r);
  s.lineTo(x, y + r);
  s.quadraticCurveTo(x, y, x + r, y);
  return s;
}

/** UV normalisées 0..1 pour une ShapeGeometry centrée. */
function withUv(geo: THREE.BufferGeometry, w: number, h: number) {
  const pos = geo.attributes.position;
  const uv = new Float32Array(pos.count * 2);
  for (let i = 0; i < pos.count; i++) {
    uv[i * 2] = pos.getX(i) / w + 0.5;
    uv[i * 2 + 1] = pos.getY(i) / h + 0.5;
  }
  geo.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
  return geo;
}

const screenVertex = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

// Fond d'écran « aurore » : nappes de lumière bleue et cyan qui ondulent lentement.
const screenFragment = /* glsl */ `
  uniform float uTime;
  uniform float uIntro;
  varying vec2 vUv;
  float blob(vec2 p, vec2 c, float r) { return smoothstep(r, 0.0, length(p - c)); }
  void main() {
    vec2 p = vUv;
    p.y *= 2.05;
    float t = uTime * 0.25;
    vec3 col = vec3(0.012, 0.016, 0.03);
    col += vec3(0.30, 0.45, 1.0) * blob(p, vec2(0.25 + 0.15 * sin(t), 1.45 + 0.2 * cos(t * 0.8)), 0.95) * 0.85;
    col += vec3(0.20, 0.90, 0.80) * blob(p, vec2(0.85 + 0.1 * cos(t * 1.3), 0.75 + 0.25 * sin(t * 0.7)), 0.8) * 0.55;
    col += vec3(0.55, 0.35, 1.0) * blob(p, vec2(0.45 + 0.2 * sin(t * 0.6), 0.25), 0.7) * 0.45;
    // vignette
    vec2 q = vUv - 0.5;
    col *= 1.0 - dot(q, q) * 0.9;
    // allumage de l'écran à l'arrivée
    col *= uIntro;
    gl_FragColor = vec4(col, 1.0);
  }
`;

function Phone({ progress, angle, dragRef, reduce }: { progress?: MotionValue<number>; angle: React.RefObject<PhoneAngle>; dragRef: React.RefObject<number>; reduce: boolean }) {
  const group = useRef<THREE.Group>(null);
  const inner = useRef<THREE.Group>(null);
  const screenMat = useRef<THREE.ShaderMaterial>(null);
  const { pointer } = useThree();
  const start = useRef<number | null>(null);
  const rotY = useRef(ANGLES.face);

  const geos = useMemo(() => {
    const body = new THREE.ExtrudeGeometry(roundedRect(W, H, R), {
      depth: D,
      bevelEnabled: true,
      bevelThickness: BEVEL,
      bevelSize: BEVEL,
      bevelSegments: 8,
      curveSegments: 24,
    });
    body.translate(0, 0, -D / 2);
    const screen = withUv(new THREE.ShapeGeometry(roundedRect(W - 0.05, H - 0.05, R - 0.03), 24), W - 0.05, H - 0.05);
    const glass = new THREE.ShapeGeometry(roundedRect(W - 0.01, H - 0.01, R - 0.006), 24);
    const back = new THREE.ShapeGeometry(roundedRect(W - 0.012, H - 0.012, R - 0.008), 24);
    const plateau = new THREE.ExtrudeGeometry(roundedRect(0.34, 0.34, 0.09), { depth: 0.012, bevelEnabled: true, bevelThickness: 0.006, bevelSize: 0.006, bevelSegments: 4, curveSegments: 16 });
    const island = new THREE.ShapeGeometry(roundedRect(0.2, 0.055, 0.0275), 12);
    return { body, screen, glass, back, plateau, island };
  }, []);

  const mats = useMemo(
    () => ({
      frame: new THREE.MeshPhysicalMaterial({ color: "#3a3f4a", metalness: 1, roughness: 0.24, clearcoat: 0.5, clearcoatRoughness: 0.2, envMapIntensity: 1.25 }),
      glass: new THREE.MeshPhysicalMaterial({ color: "#ffffff", metalness: 0, roughness: 0.04, transparent: true, opacity: 0.12, clearcoat: 1, envMapIntensity: 1.6, depthWrite: false }),
      back: new THREE.MeshPhysicalMaterial({ color: "#1a1f2a", metalness: 0.35, roughness: 0.42, clearcoat: 0.8, clearcoatRoughness: 0.35, envMapIntensity: 0.9 }),
      plateau: new THREE.MeshPhysicalMaterial({ color: "#232936", metalness: 0.6, roughness: 0.18, clearcoat: 1, envMapIntensity: 1.3 }),
      lensRing: new THREE.MeshStandardMaterial({ color: "#9aa3b5", metalness: 1, roughness: 0.18 }),
      lens: new THREE.MeshPhysicalMaterial({ color: "#05060a", metalness: 0.2, roughness: 0.05, clearcoat: 1, iridescence: 0.8, iridescenceIOR: 1.6, envMapIntensity: 2 }),
      black: new THREE.MeshBasicMaterial({ color: "#000000" }),
      flash: new THREE.MeshStandardMaterial({ color: "#f3e9cf", emissive: "#3a3426", roughness: 0.4 }),
    }),
    [],
  );

  const uniforms = useMemo(() => ({ uTime: { value: 0 }, uIntro: { value: reduce ? 1 : 0 } }), [reduce]);

  useEffect(
    () => () => {
      Object.values(geos).forEach((g) => g.dispose());
      Object.values(mats).forEach((m) => m.dispose());
    },
    [geos, mats],
  );

  useFrame((state, delta) => {
    const g = group.current;
    const i = inner.current;
    if (!g || !i) return;
    const t = state.clock.elapsedTime;
    if (start.current == null) start.current = t;
    const since = t - start.current;
    // Arrivée : montée + rotation complète amortie sur ~1,8 s
    const intro = reduce ? 1 : 1 - Math.pow(1 - Math.min(since / 1.8, 1), 3);
    const p = progress?.get() ?? 0;

    const target = ANGLES[angle.current ?? "face"] + (dragRef.current ?? 0) + p * Math.PI * 0.9 + (reduce ? 0 : Math.sin(t * 0.35) * 0.18);
    const k = 1 - Math.exp(-delta * 3.2);
    rotY.current += (target - rotY.current) * k;

    g.rotation.y = rotY.current + (1 - intro) * Math.PI * 1.6;
    g.rotation.x = THREE.MathUtils.lerp(g.rotation.x, (reduce ? 0 : -pointer.y * 0.18) + 0.08 - p * 0.25, k);
    g.rotation.z = THREE.MathUtils.lerp(g.rotation.z, (reduce ? 0 : -pointer.x * 0.06) + 0.04, k);
    i.rotation.y = THREE.MathUtils.lerp(i.rotation.y, reduce ? 0 : pointer.x * 0.35, k);
    g.position.y = (1 - intro) * -1.4 + (reduce ? 0 : Math.sin(t * 0.9) * 0.025) + p * 0.35;
    const s = (0.75 + intro * 0.25) * (1 - p * 0.12);
    g.scale.setScalar(s);

    if (screenMat.current) {
      screenMat.current.uniforms.uTime.value = t;
      screenMat.current.uniforms.uIntro.value = reduce ? 1 : Math.min(1, Math.max(0, (since - 0.6) / 0.9));
    }
  });

  const zFront = D / 2 + BEVEL + 0.0005;
  const zBack = -(D / 2 + BEVEL + 0.0005);
  const lenses: [number, number, number][] = [
    [-0.075, 0.075, 0.062],
    [-0.075, -0.075, 0.062],
    [0.08, 0.0, 0.058],
  ];

  return (
    <group ref={group}>
      <group ref={inner}>
        {/* Châssis */}
        <mesh geometry={geos.body} material={mats.frame} />
        {/* Écran + vitre */}
        <mesh geometry={geos.screen} position={[0, 0, zFront]}>
          <shaderMaterial ref={screenMat} vertexShader={screenVertex} fragmentShader={screenFragment} uniforms={uniforms} />
        </mesh>
        <mesh geometry={geos.island} position={[0, H / 2 - 0.085, zFront + 0.0008]} material={mats.black} />
        <mesh geometry={geos.glass} position={[0, 0, zFront + 0.0015]} material={mats.glass} />
        {/* Dos */}
        <mesh geometry={geos.back} position={[0, 0, zBack]} rotation={[0, Math.PI, 0]} material={mats.back} />
        <group position={[0.155, H / 2 - 0.22, zBack]} rotation={[0, Math.PI, 0]}>
          <mesh geometry={geos.plateau} material={mats.plateau} />
          {lenses.map(([x, y, r], k) => (
            <group key={k} position={[x, y, 0.018]}>
              <mesh rotation={[Math.PI / 2, 0, 0]} material={mats.lensRing}>
                <cylinderGeometry args={[r, r, 0.02, 40]} />
              </mesh>
              <mesh position={[0, 0, 0.0105]} material={mats.lens}>
                <circleGeometry args={[r * 0.78, 40]} />
              </mesh>
            </group>
          ))}
          <mesh position={[0.08, 0.1, 0.019]} material={mats.flash}>
            <circleGeometry args={[0.022, 24]} />
          </mesh>
        </group>
        {/* Boutons latéraux */}
        <mesh position={[W / 2 + BEVEL + 0.004, 0.22, 0]} material={mats.frame}>
          <boxGeometry args={[0.012, 0.2, 0.03]} />
        </mesh>
        <mesh position={[-(W / 2 + BEVEL + 0.004), 0.32, 0]} material={mats.frame}>
          <boxGeometry args={[0.012, 0.11, 0.03]} />
        </mesh>
        <mesh position={[-(W / 2 + BEVEL + 0.004), 0.16, 0]} material={mats.frame}>
          <boxGeometry args={[0.012, 0.11, 0.03]} />
        </mesh>
      </group>
    </group>
  );
}

/** Reflets de studio générés (aucun fichier HDR à charger). */
function StudioEnvironment() {
  const { gl, scene } = useThree();
  useEffect(() => {
    const pmrem = new THREE.PMREMGenerator(gl);
    const room = new RoomEnvironment();
    const env = pmrem.fromScene(room, 0.04).texture;
    scene.environment = env;
    return () => {
      scene.environment = null;
      env.dispose();
      room.dispose();
      pmrem.dispose();
    };
  }, [gl, scene]);
  return null;
}

export default function PhoneScene({
  progress,
  angle,
  dragRef,
  active,
  reduce,
  onReady,
}: {
  progress?: MotionValue<number>;
  angle: React.RefObject<PhoneAngle>;
  dragRef: React.RefObject<number>;
  active: boolean;
  reduce: boolean;
  onReady?: () => void;
}) {
  return (
    <Canvas
      frameloop={active ? "always" : "never"}
      dpr={[1, 1.75]}
      camera={{ position: [0, 0, 3.1], fov: 34 }}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.05;
        onReady?.();
      }}
      aria-hidden
    >
      <StudioEnvironment />
      <ambientLight intensity={0.25} />
      {/* lumière principale + liserés colorés sur les tranches */}
      <directionalLight position={[2.5, 3, 4]} intensity={1.6} />
      <pointLight position={[-2.2, 0.6, 1.2]} intensity={6} color="#7ea4ff" distance={6} />
      <pointLight position={[2.2, -0.8, -1]} intensity={5} color="#63e6d2" distance={6} />
      <Phone progress={progress} angle={angle} dragRef={dragRef} reduce={reduce} />
    </Canvas>
  );
}
