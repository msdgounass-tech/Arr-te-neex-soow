"use client";
import Image from "next/image";
import { AnimatePresence, motion, useReducedMotion, type PanInfo } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";
import clsx from "clsx";
import type { ProductImage } from "@/lib/types";
import { Emblem } from "@/components/brand/Logo";
import { ChevronLeft, ChevronRight, CloseIcon, ZoomIcon } from "@/components/ui/Icons";

export function Gallery({ images, name }: { images: ProductImage[]; name: string }) {
  const [[index, dir], setState] = useState<[number, number]>([0, 0]);
  const [zoom, setZoom] = useState<{ x: number; y: number } | null>(null);
  const [lightbox, setLightbox] = useState(false);
  const reduce = useReducedMotion();
  const dragged = useRef(false);
  const count = images.length;
  const go = useCallback((d: number) => setState(([i]) => [(i + d + count) % count, d]), [count]);
  const select = (i: number) => setState(([cur]) => [i, i > cur ? 1 : -1]);

  useEffect(() => {
    if (!lightbox) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightbox(false);
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [lightbox, go]);

  if (!count) {
    return (
      <div className="surface flex aspect-square items-center justify-center">
        <Emblem className="h-20 w-20 opacity-40" />
      </div>
    );
  }
  const current = images[index];
  const onDragEnd = (_: unknown, info: PanInfo) => {
    if (count < 2) return;
    if (info.offset.x < -60) go(1);
    else if (info.offset.x > 60) go(-1);
  };

  return (
    <div className="flex min-w-0 flex-col-reverse gap-3 md:flex-row md:gap-4">
      {count > 1 && (
        <div className="no-scrollbar flex gap-2 overflow-x-auto md:w-20 md:flex-col md:overflow-visible">
          {images.map((img, i) => (
            <button
              key={img.id}
              onClick={() => select(i)}
              aria-label={`Voir la photo ${i + 1}`}
              aria-current={i === index}
              className={clsx(
                "relative aspect-square w-16 shrink-0 overflow-hidden rounded-xl border bg-white/[0.03] transition-all md:w-full",
                i === index ? "border-accent shadow-[0_0_0_3px_rgba(126,164,255,.18)]" : "border-white/10 opacity-60 hover:opacity-100",
              )}
            >
              <Image src={img.url} alt="" fill sizes="80px" className="object-contain p-1.5" />
            </button>
          ))}
        </div>
      )}

      <div
        className="surface group relative aspect-square w-full min-w-0 flex-1 cursor-zoom-in overflow-hidden"
        onMouseMove={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          setZoom({ x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 });
        }}
        onMouseLeave={() => setZoom(null)}
        onClick={() => {
          if (dragged.current) {
            dragged.current = false;
            return;
          }
          setLightbox(true);
        }}
      >
        <div aria-hidden className="absolute inset-0 bg-[radial-gradient(60%_55%_at_50%_45%,rgba(126,164,255,.12),transparent_70%)]" />
        <AnimatePresence initial={false} custom={dir} mode="popLayout">
          <motion.div
            key={current.id}
            custom={dir}
            className="absolute inset-0"
            initial={reduce ? { opacity: 0 } : { opacity: 0, x: dir * 60, scale: 0.97 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, x: dir * -60, scale: 0.97 }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            drag={count > 1 ? "x" : false}
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.25}
            onDragStart={() => (dragged.current = true)}
            onDragEnd={onDragEnd}
          >
            <Image
              src={current.url}
              alt={current.alt || name}
              fill
              priority={index === 0}
              sizes="(min-width:1024px) 50vw, 100vw"
              draggable={false}
              className="object-contain p-6 transition-transform duration-300 ease-out md:p-10"
              style={zoom ? { transform: "scale(1.9)", transformOrigin: `${zoom.x}% ${zoom.y}%` } : undefined}
            />
          </motion.div>
        </AnimatePresence>
        <span className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-ink/60 text-ivory backdrop-blur md:opacity-0 md:transition-opacity md:group-hover:opacity-100">
          <ZoomIcon />
        </span>
        {count > 1 && (
          <>
            <button aria-label="Photo précédente" onClick={(e) => { e.stopPropagation(); go(-1); }} className="absolute left-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-ink/50 text-ivory backdrop-blur hover:bg-ink/80 md:opacity-0 md:group-hover:opacity-100">
              <ChevronLeft width={20} height={20} />
            </button>
            <button aria-label="Photo suivante" onClick={(e) => { e.stopPropagation(); go(1); }} className="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-ink/50 text-ivory backdrop-blur hover:bg-ink/80 md:opacity-0 md:group-hover:opacity-100">
              <ChevronRight width={20} height={20} />
            </button>
            <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-1.5" aria-hidden>
              {images.map((img, i) => (
                <span key={img.id} className={clsx("h-1.5 rounded-full transition-all duration-500", i === index ? "w-6 bg-ivory" : "w-1.5 bg-white/30")} />
              ))}
            </div>
          </>
        )}
      </div>

      <AnimatePresence>
        {lightbox && (
          <motion.div role="dialog" aria-modal="true" aria-label="Photos en plein écran" className="fixed inset-0 z-[95] bg-ink/95 backdrop-blur-xl" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <button aria-label="Fermer" onClick={() => setLightbox(false)} className="absolute right-4 top-4 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-ivory hover:bg-white/20">
              <CloseIcon width={22} height={22} />
            </button>
            <div className="relative h-full w-full p-4 md:p-12">
              <div className="relative h-full w-full">
                <Image src={current.url} alt={current.alt || name} fill sizes="100vw" className="object-contain" />
              </div>
            </div>
            {count > 1 && (
              <>
                <button aria-label="Photo précédente" onClick={() => go(-1)} className="fixed left-4 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-ivory hover:bg-white/20"><ChevronLeft width={24} height={24} /></button>
                <button aria-label="Photo suivante" onClick={() => go(1)} className="fixed right-4 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-ivory hover:bg-white/20"><ChevronRight width={24} height={24} /></button>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
