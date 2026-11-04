"use client";
import { useState } from "react";
import { WhatsAppIcon } from "@/components/ui/Icons";

export function RetryPayment({ orderNumber, token }: { orderNumber: string; token: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  return (
    <div>
      <button
        disabled={loading}
        onClick={async () => {
          setLoading(true);
          setError("");
          const res = await fetch("/api/payments/retry", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ orderNumber, token }) });
          const json = await res.json().catch(() => ({}));
          if (res.ok && json.redirectUrl) window.location.href = json.redirectUrl;
          else {
            setError(json.error || "Impossible de relancer le paiement.");
            setLoading(false);
          }
        }}
        className="btn btn-gold"
      >
        {loading ? "Redirection…" : "Procéder au paiement"}
      </button>
      {error && <p className="mt-3 text-sm text-danger">{error}</p>}
    </div>
  );
}

export function WhatsAppShare({ number, text }: { number: string; text: string }) {
  return (
    <a href={`https://wa.me/${number}?text=${encodeURIComponent(text)}`} target="_blank" rel="noopener noreferrer" className="btn btn-outline">
      <WhatsAppIcon /> Transmettre sur WhatsApp
    </a>
  );
}

export function PrintButton() {
  return (
    <button onClick={() => window.print()} className="btn btn-outline">
      Imprimer le reçu
    </button>
  );
}
