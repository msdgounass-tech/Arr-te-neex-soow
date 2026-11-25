"use client";
import { useEffect, useRef } from "react";

let observer: IntersectionObserver | null = null;
function getObserver() {
  observer ??= new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (e.isIntersecting) { (e.target as HTMLElement).dataset.visible = "true"; observer!.unobserve(e.target); }
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
    const obs = getObserver();
    obs.observe(el);
    return () => obs.unobserve(el);
  }, []);
  return <Tag ref={ref as never} className={`reveal ${className}`} style={{ ["--i" as string]: index }}>{children}</Tag>;
}
