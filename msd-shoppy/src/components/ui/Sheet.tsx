"use client";
import { lazy, Suspense, useEffect, useState } from "react";

const load = () => import("./SheetImpl");
const Impl = lazy(() => load().then((m) => ({ default: m.SheetImpl })));
let preloaded = false;

type Props = { open: boolean; onClose: () => void; title: string; children: React.ReactNode; footer?: React.ReactNode; side?: "auto" | "bottom" };

/** Feuille du bas / tiroir. Motion n'est téléchargé qu'à la première ouverture (pages plus légères). */
export function Sheet(props: Props) {
  const [used, setUsed] = useState(props.open);
  useEffect(() => { if (props.open) setUsed(true); }, [props.open]);
  // Préchargement au repos, une fois la page affichée : le premier appui ouvre la feuille sans attendre le réseau.
  useEffect(() => {
    if (preloaded) return; preloaded = true;
    const w = window as Window & { requestIdleCallback?: (cb: () => void) => number };
    if (w.requestIdleCallback) w.requestIdleCallback(() => void load()); else setTimeout(() => void load(), 1500);
  }, []);
  if (!used) return null;
  return <Suspense fallback={null}><Impl {...props} /></Suspense>;
}
