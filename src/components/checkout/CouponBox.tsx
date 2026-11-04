"use client";
import { useState } from "react";
import { cartSubtotal, useCart } from "@/store/cart";

export function CouponBox() {
  const { lines, coupon, setCoupon } = useCart();
  const [code, setCode] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const subtotal = cartSubtotal(lines);

  const apply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;
    setLoading(true);
    setMsg("");
    try {
      const res = await fetch("/api/coupon", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, subtotal }),
      });
      const json = await res.json();
      if (json.valid) {
        setCoupon({ code: json.code, discount: json.discount, message: json.message, subtotal });
        setCode("");
      } else setMsg(json.message || "Code invalide.");
    } catch {
      setMsg("Vérification impossible pour le moment.");
    } finally {
      setLoading(false);
    }
  };

  if (coupon) {
    return (
      <div className="flex items-center justify-between border border-gold/30 bg-gold/[0.06] px-4 py-3 text-sm">
        <span>
          Code <strong className="tracking-widest text-gold">{coupon.code}</strong> appliqué ({coupon.message})
        </span>
        <button onClick={() => setCoupon(null)} className="text-[0.8rem] uppercase tracking-[0.2em] text-mist hover:text-ivory">Retirer</button>
      </div>
    );
  }
  return (
    <form onSubmit={apply}>
      <label className="label" htmlFor="coupon">Code promotionnel</label>
      <div className="mt-1 flex items-end gap-3">
        <input id="coupon" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} className="field uppercase tracking-widest" placeholder="VOTRE CODE" />
        <button disabled={loading} className="btn btn-ghost-gold min-h-11 px-5">{loading ? "…" : "Appliquer"}</button>
      </div>
      {msg && <p className="mt-2 text-xs text-danger">{msg}</p>}
    </form>
  );
}
