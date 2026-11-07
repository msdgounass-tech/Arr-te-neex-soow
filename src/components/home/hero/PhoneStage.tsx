"use client";
import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import clsx from "clsx";
import type { MotionValue } from "framer-motion";
import type { PhoneAngle } from "./PhoneScene";

const PhoneScene = dynamic(() => import("./PhoneScene"), { ssr: false });

/** Silhouette affichée avant le chargement de la 3D (ou si WebGL est indisponible). */
function Poster() {
  return (
    <div aria-hidden className="absolute inset-0 flex items-center justify-center">
      <div className="relative h-[68%] max-h-[520px] aspect-[0.49] rotate-[-8deg] rounded-[2.4rem] border border-white/15 bg-gradient-to-br from-[#3a3f4a] via-[#14171e] to-[#0a0c11] p-[3.5%] shadow-[0_40px_120px_-30px_rgba(126,164,255,.45)]">
        <div className="h-full w-full overflow-hidden rounded-[2rem] bg-[radial-gradient(120%_70%_at_20%_15%,rgba(126,164,255,.75),transparent_60%),radial-gradient(90%_60%_at_85%_70%,rgba(99,230,210,.45),transparent_60%),#04060b]">
          <div className="mx-auto mt-[6%] h-[3.6%] w-[28%] rounded-full bg-black" />
        </div>
      </div>
    </div>
  );
}

/**
 * La 3D n'est activée qu'avec une vraie accélération graphique : sans GPU (rendu logiciel),
 * en mode économie de données ou sur un appareil très modeste, la silhouette reste affichée.
 */
function canRender3D() {
  try {
    const nav = navigator as Navigator & { connection?: { saveData?: boolean }; deviceMemory?: number };
    if (nav.connection?.saveData) return false;
    if ((nav.hardwareConcurrency || 4) <= 2 || (nav.deviceMemory || 4) < 2) return false;
    const c = document.createElement("canvas");
    const gl = (c.getContext("webgl2") || c.getContext("webgl")) as WebGLRenderingContext | null;
    if (!gl) return false;
    const info = gl.getExtension("WEBGL_debug_renderer_info");
    const renderer = String(info ? gl.getParameter(info.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER)).toLowerCase();
    gl.getExtension("WEBGL_lose_context")?.loseContext();
    if (/swiftshader|llvmpipe|softpipe|software|basic render/.test(renderer)) return false;
    return true;
  } catch {
    return false;
  }
}

const ANGLE_LABELS: [PhoneAngle, string][] = [
  ["face", "Face"],
  ["profil", "Profil"],
  ["dos", "Dos"],
];

export function PhoneStage({ progress, reduce }: { progress: MotionValue<number>; reduce: boolean }) {
  const wrap = useRef<HTMLDivElement>(null);
  const angle = useRef<PhoneAngle>("face");
  const drag = useRef(0);
  const [current, setCurrent] = useState<PhoneAngle>("face");
  const [mount, setMount] = useState(false);
  const [ready, setReady] = useState(false);
  const [visible, setVisible] = useState(true);

  // La 3D est chargée après le chargement de la page, quand le navigateur est disponible,
  // pour ne jamais retarder l'affichage du texte ni les premières interactions.
  useEffect(() => {
    const force = new URLSearchParams(window.location.search).has("3d");
    if (!force && !canRender3D()) return;
    const w = window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number };
    const go = () => (w.requestIdleCallback ? w.requestIdleCallback(() => setMount(true), { timeout: 2000 }) : setTimeout(() => setMount(true), 400));
    if (document.readyState === "complete") go();
    else window.addEventListener("load", go, { once: true });
  }, []);

  // Pause du rendu quand la scène n'est plus visible (batterie, processeur).
  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { threshold: 0.02 });
    io.observe(el);
    const onVis = () => setVisible(document.visibilityState === "visible" && el.getBoundingClientRect().bottom > 0);
    document.addEventListener("visibilitychange", onVis);
    return () => {
      io.disconnect();
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  // Glisser horizontalement pour faire tourner le produit (le défilement vertical reste libre).
  const startX = useRef<number | null>(null);
  const base = useRef(0);
  const onDown = (e: React.PointerEvent) => {
    startX.current = e.clientX;
    base.current = drag.current;
  };
  const onMove = (e: React.PointerEvent) => {
    if (startX.current == null) return;
    const w = wrap.current?.clientWidth || 400;
    drag.current = base.current + ((e.clientX - startX.current) / w) * Math.PI * 1.4;
  };
  const onUp = () => {
    startX.current = null;
  };

  const choose = (a: PhoneAngle) => {
    angle.current = a;
    drag.current = 0;
    setCurrent(a);
  };

  return (
    <div className="relative h-full w-full">
      <div
        ref={wrap}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
        onPointerLeave={onUp}
        className="absolute inset-0 cursor-grab touch-pan-y active:cursor-grabbing"
        role="img"
        aria-label="Smartphone en 3D : faites glisser pour le faire pivoter"
      >
        <div className={clsx("absolute inset-0 transition-opacity duration-700", ready ? "opacity-0" : "opacity-100")}>
          <Poster />
        </div>
        {mount && (
          <div className={clsx("absolute inset-0 transition-opacity duration-1000", ready ? "opacity-100" : "opacity-0")}>
            <PhoneScene progress={progress} angle={angle} dragRef={drag} active={visible} reduce={reduce} onReady={() => setReady(true)} />
          </div>
        )}
      </div>
      <div className="absolute inset-x-0 bottom-2 flex justify-center md:bottom-6">
        <div className="glass flex gap-1 rounded-full p-1" role="group" aria-label="Angle de vue">
          {ANGLE_LABELS.map(([a, label]) => (
            <button
              key={a}
              type="button"
              onClick={() => choose(a)}
              aria-pressed={current === a}
              className={clsx("rounded-full px-4 py-1.5 text-[0.8rem] font-semibold transition-colors", current === a ? "bg-ivory text-ink" : "text-ivory/80 hover:text-white")}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
