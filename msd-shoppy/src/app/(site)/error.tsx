"use client";
import { useEffect } from "react";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error(error); }, [error]);
  return (
    <div className="container-page py-16 text-center">
      <h1 className="text-2xl font-bold">Cette page n'a pas pu s'afficher</h1>
      <p className="mt-2 text-slate">Vérifiez votre connexion puis réessayez.</p>
      <button type="button" onClick={reset} className="btn btn-primary press mt-6">Réessayer</button>
    </div>
  );
}
