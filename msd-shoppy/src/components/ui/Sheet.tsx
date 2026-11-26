"use client";
import { lazy, Suspense, useEffect, useState } from "react";

const Impl = lazy(() => import("./SheetImpl").then((m) => ({ default: m.SheetImpl })));

type Props = { open: boolean; onClose: () => void; title: string; children: React.ReactNode; footer?: React.ReactNode; side?: "auto" | "bottom" };

/** Feuille du bas / tiroir. Motion n'est téléchargé qu'à la première ouverture (pages plus légères). */
export function Sheet(props: Props) {
  const [used, setUsed] = useState(props.open);
  useEffect(() => { if (props.open) setUsed(true); }, [props.open]);
  if (!used) return null;
  return <Suspense fallback={null}><Impl {...props} /></Suspense>;
}
