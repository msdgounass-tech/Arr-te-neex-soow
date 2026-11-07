"use client";
import { useState } from "react";

export function ContactForm() {
  const [state, setState] = useState<"idle" | "loading" | "ok" | "error">("idle");
  const [msg, setMsg] = useState("");
  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    setState("loading");
    const res = await fetch("/api/contact", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(Object.fromEntries(new FormData(form))) });
    const json = await res.json().catch(() => ({}));
    if (res.ok) {
      setState("ok");
      setMsg("Merci, votre message a bien été transmis. Nous vous répondrons rapidement.");
      form.reset();
    } else {
      setState("error");
      setMsg(json.error || "Envoi impossible.");
    }
  };
  return (
    <form onSubmit={submit} className="grid gap-x-8 gap-y-7 md:grid-cols-2">
      <label className="md:col-span-2"><span className="label">Nom complet *</span><input name="name" required className="field" /></label>
      <label><span className="label">E-mail</span><input name="email" type="email" className="field" /></label>
      <label><span className="label">Téléphone</span><input name="phone" type="tel" className="field" /></label>
      <label className="md:col-span-2"><span className="label">Objet</span><input name="subject" className="field" /></label>
      <label className="md:col-span-2"><span className="label">Message *</span><textarea name="message" required rows={5} className="field resize-none" /></label>
      <div className="md:col-span-2">
        {msg && <p className={`mb-4 text-sm ${state === "ok" ? "text-accent" : "text-danger"}`}>{msg}</p>}
        <button disabled={state === "loading"} className="btn btn-primary">{state === "loading" ? "Envoi…" : "Envoyer le message"}</button>
      </div>
    </form>
  );
}
