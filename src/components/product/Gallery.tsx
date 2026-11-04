"use client";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useState } from "react";
import clsx from "clsx";
import type { ProductImage } from "@/lib/types";
import { ChevronLeft, ChevronRight, CloseIcon, ZoomIcon } from "@/components/ui/Icons";

export function Gallery({ images, name }: { images: ProductImage[]; name: string }) {
  const [index, setIndex] = useState(0);
  const [zoom, setZoom] = useState<{ x: number; y: number } | null>(null);
  const [lightbox, setLightbox] = useState(false);
  const count = images.length;
  const go = useCallback((d: number) => setIndex((i) => (i + d + count) % count), [count]);

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
      <div className="flex aspect-[3/4] items-center justify-center bg-ink-3">
        <span className="display text-7xl text-gold/30">GL</span>
      </div>
    );
  }
  const current = images[index];

  return (
    <div className="flex flex-col-reverse gap-4 md:flex-row">
      {count > 1 && (
        <div className="no-scrollbar flex gap-3 overflow-x-auto md:w-20 md:flex-col md:overflow-visible">
          {images.map((img, i) => (
            <button
              key={img.id}
              onClick={() => setIndex(i)}
              aria-label={`Voir la photo ${i + 1}`}
              className={clsx("relative aspect-[3/4] w-16 shrink-0 overflow-hidden border transition-colors md:w-full", i === index ? "border-gold" : "border-transparent opacity-60 hover:opacity-100")}
            >
              <Image src={img.url} alt="" fill sizes="80px" className="object-cover" />
            </button>
          ))}
        </div>
      )}

      <div
        className="group relative aspect-[3/4] flex-1 cursor-zoom-in overflow-hidden bg-ink-3"
        onMouseMove={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          setZoom({ x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 });
        }}
        onMouseLeave={() => setZoom(null)}
        onClick={() => setLightbox(true)}
      >
        <AnimatePresence mode="wait">
          <motion.div key={current.id} className="absolute inset-0" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }}>
            <Image
              src={current.url}
              alt={current.alt || name}
              fill
              priority={index === 0}
              sizes="(min-width:1024px) 50vw, 100vw"
              className="object-cover transition-transform duration-300 ease-out"
              style={zoom ? { transform: "scale(2)", transformOrigin: `${zoom.x}% ${zoom.y}%` } : undefined}
            />
          </motion.div>
        </AnimatePresence>
        <span className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-ink/60 text-ivory backdrop-blur md:opacity-0 md:transition-opacity md:group-hover:opacity-100">
          <ZoomIcon />
        </span>
        {count > 1 && (
          <>
            <button aria-label="Photo précédente" onClick={(e) => { e.stopPropagation(); go(-1); }} className="absolute left-3 top-1/2 -translate-y-1/2 p-2 text-ivory/80 hover:text-gold md:hidden">
              <ChevronLeft width={26} height={26} />
            </button>
            <button aria-label="Photo suivante" onClick={(e) => { e.stopPropagation(); go(1); }} className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-ivory/80 hover:text-gold md:hidden">
              <ChevronRight width={26} height={26} />
            </button>
            <span className="absolute bottom-4 left-1/2 -translate-x-1/2 text-[0.6rem] tracking-[0.3em] text-ivory/80">
              {String(index + 1).padStart(2, "0")} / {String(count).padStart(2, "0")}
            </span>
          </>
        )}
      </div>

      <AnimatePresence>
        {lightbox && (
          <motion.div role="dialog" aria-label="Photos en plein écran" className="fixed inset-0 z-[95] bg-ink" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <button aria-label="Fermer" onClick={() => setLightbox(false)} className="absolute right-5 top-5 z-10 p-2 text-ivory hover:text-gold">
              <CloseIcon width={26} height={26} />
            </button>
            <div className="relative h-full w-full overflow-auto">
              <div className="relative mx-auto h-[200vh] w-full max-w-[1400px] md:h-[180vh]">
                <Image src={current.url} alt={current.alt || name} fill sizes="100vw" className="object-contain" />
              </div>
            </div>
            {count > 1 && (
              <>
                <button aria-label="Photo précédente" onClick={() => go(-1)} className="fixed left-4 top-1/2 -translate-y-1/2 p-3 text-ivory hover:text-gold"><ChevronLeft width={32} height={32} /></button>
                <button aria-label="Photo suivante" onClick={() => go(1)} className="fixed right-4 top-1/2 -translate-y-1/2 p-3 text-ivory hover:text-gold"><ChevronRight width={32} height={32} /></button>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
