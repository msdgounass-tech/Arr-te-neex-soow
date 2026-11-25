"use client";
import Image from "next/image";
import { useRef, useState } from "react";
import type { ProductImage } from "@/lib/types";
import { Icon } from "@/components/ui/Icon";

/** Galerie : défilement natif (scroll-snap) sur mobile, miniatures sur ordinateur. Aucune animation JS. */
export function Gallery({ images, title }: { images: ProductImage[]; title: string }) {
  const [index, setIndex] = useState(0);
  const track = useRef<HTMLDivElement>(null);
  const goTo = (i: number) => {
    const el = track.current; if (!el) return;
    el.scrollTo({ left: i * el.clientWidth, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  };
  if (!images.length) return <div className="grid aspect-square place-items-center rounded-3xl bg-mist text-slate"><Icon name="image" size={40} /></div>;
  return (
    <div>
      <div className="relative">
        <div ref={track} className="no-scrollbar flex aspect-square snap-x snap-mandatory overflow-x-auto rounded-3xl bg-mist"
          onScroll={(e) => setIndex(Math.round(e.currentTarget.scrollLeft / e.currentTarget.clientWidth))} aria-label="Photos du produit">
          {images.map((img, i) => (
            <div key={img.id} className="relative h-full w-full shrink-0 snap-center">
              <Image src={img.url} alt={i === 0 ? title : `${title}, photo ${i + 1}`} fill priority={i === 0} sizes="(min-width: 768px) 50vw, 100vw" className="object-contain" />
            </div>
          ))}
        </div>
        {images.length > 1 && (
          <p className="absolute bottom-3 right-3 rounded-full bg-ink/70 px-2.5 py-1 text-xs font-semibold text-white">{index + 1} / {images.length}</p>
        )}
      </div>
      {images.length > 1 && (
        <ul className="mt-3 hidden gap-2 md:flex">
          {images.map((img, i) => (
            <li key={img.id}>
              <button type="button" onClick={() => goTo(i)} aria-label={`Photo ${i + 1}`} aria-current={i === index}
                className={`press relative block h-16 w-16 overflow-hidden rounded-xl border-2 ${i === index ? "border-orange-strong" : "border-transparent"}`}>
                <Image src={img.url} alt="" fill sizes="64px" className="object-cover" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
