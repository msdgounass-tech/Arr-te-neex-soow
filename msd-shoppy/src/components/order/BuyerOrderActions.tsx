"use client";
import { useState, useTransition } from "react";
import { setOrderStatusAction, submitReviewAction } from "@/app/actions/orders";
import { toast } from "@/components/ui/toast";
import { Icon } from "@/components/ui/Icon";
import type { OrderStatus } from "@/lib/types";

export function BuyerOrderActions({ orderId, status, hasReview }: { orderId: string; status: OrderStatus; hasReview: boolean }) {
  const [pending, start] = useTransition();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const run = (s: OrderStatus, msg: string) => start(async () => {
    const r = await setOrderStatusAction(orderId, s);
    toast(r.ok ? msg : r.error, r.ok ? "success" : "error");
  });
  return (
    <div className="space-y-3">
      {(status === "pending" || status === "confirmed") && (
        <button type="button" disabled={pending} className="btn btn-secondary press w-full"
          onClick={() => { if (confirm("Annuler cette commande ?")) run("cancelled", "Commande annulée"); }}>Annuler la commande</button>
      )}
      {(status === "shipped" || status === "delivered") && (
        <button type="button" disabled={pending} className="btn btn-primary press w-full" onClick={() => run("completed", "Réception confirmée. Merci !")}>
          <Icon name="check" size={18} /> J'ai bien reçu ma commande</button>
      )}
      {status === "completed" && !hasReview && (
        <form className="card space-y-3 p-4" onSubmit={(e) => { e.preventDefault(); if (!rating) { toast("Choisissez une note.", "error"); return; }
          start(async () => { const r = await submitReviewAction(orderId, rating, comment); toast(r.ok ? "Avis publié. Merci !" : r.error, r.ok ? "success" : "error"); }); }}>
          <fieldset><legend className="label">Votre avis sur la boutique</legend>
            <div className="flex gap-1">{[1, 2, 3, 4, 5].map((n) => (
              <button key={n} type="button" aria-label={`${n} étoile${n > 1 ? "s" : ""}`} aria-pressed={rating === n} onClick={() => setRating(n)} className="press p-1 text-orange">
                <Icon name="star" size={28} filled={n <= rating} className={n <= rating ? "" : "text-line"} /></button>))}</div></fieldset>
          <textarea className="field" rows={3} maxLength={1000} placeholder="Qualité du produit, respect des délais, accueil…" value={comment} onChange={(e) => setComment(e.target.value)} aria-label="Commentaire" />
          <button type="submit" disabled={pending} className="btn btn-primary press w-full">Publier mon avis</button>
        </form>
      )}
      {status === "completed" && hasReview && <p className="rounded-2xl bg-success-soft p-3 text-sm text-success">Merci, votre avis a été publié.</p>}
    </div>
  );
}
