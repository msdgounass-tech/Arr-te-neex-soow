"use client";
import { useEffect, useRef } from "react";

let observer: IntersectionObserver | null = null;
function getObserver() {
  observer ??= new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (e.isIntersecting) { (e.target as HTMLElement).dataset.reveal = "visible"; observer!.unobserve(e.target); }
    }
  }, { threshold: 0.15 });
  return observer;
}

/** Apparition au défilement (une seule fois). Réservé à l'accueil et aux pages vitrines. */
export function Reveal({ children, index = 0, className = "", as: Tag = "div" }:
  { children: React.ReactNode; index?: number; className?: string; as?: "div" | "section" | "li" }) {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // Déjà visible à l'écran (ou au-dessus) : jamais masqué. Sinon on attend qu'il entre dans la vue.
    if (el.getBoundingClientRect().top < window.innerHeight) return;
    el.dataset.reveal = "pending";
    const obs = getObserver();
    obs.observe(el);
    return () => obs.unobserve(el);
  }, []);
  return <Tag ref={ref as never} className={`reveal ${className}`} style={{ ["--i" as string]: index }}>{children}</Tag>;
}
