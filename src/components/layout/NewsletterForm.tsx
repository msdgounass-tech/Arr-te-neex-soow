"use client";
import { useState } from "react";
import clsx from "clsx";
import { ArrowRight } from "@/components/ui/Icons";

export function NewsletterForm({ variant = "footer" }: { variant?: "footer" | "section" }) {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "loading" | "ok" | "error">("idle");
  const [message, setMessage] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setState("loading");
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Inscription impossible.");
      setState("ok");
      setMessage("Merci. Vous faites désormais partie du cercle GOUNASS.");
      setEmail("");
    } catch (err) {
      setState("error");
      setMessage(err instanceof Error ? err.message : "Inscription impossible.");
    }
  };

  return (
    <form onSubmit={submit} className={clsx("w-full", variant === "section" && "mx-auto max-w-xl")}>
      <div className="flex items-center border-b border-ivory/25 focus-within:border-gold">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Votre adresse e-mail"
          aria-label="Adresse e-mail"
          className={clsx("w-full bg-transparent py-4 text-ivory placeholder:text-ivory/35 focus:outline-none", variant === "section" ? "text-lg" : "text-sm")}
        />
        <button type="submit" disabled={state === "loading"} aria-label="S'inscrire" className="flex items-center gap-2 py-3 pl-4 text-[0.65rem] uppercase tracking-[0.28em] text-gold hover:text-ivory disabled:opacity-50">
          {variant === "section" && <span>S&apos;inscrire</span>}
          <ArrowRight />
        </button>
      </div>
      {message && (
        <p role="status" className={clsx("mt-3 text-xs", state === "ok" ? "text-gold" : "text-danger")}>
          {message}
        </p>
      )}
    </form>
  );
}
