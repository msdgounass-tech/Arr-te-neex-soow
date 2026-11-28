"use client";
import { useState } from "react";
import { useAi } from "@/components/ai/useAi";
import { AiError, CopyBlock, Thinking, UsageLine } from "@/components/ai/AiBits";

export function ReplyDrafter({ initial = "" }: { initial?: string }) {
  const ai = useAi<{ reply: string; tips: string[] }>("customer_reply");
  const [message, setMessage] = useState(initial); const [context, setContext] = useState("");
  return (
    <div className="space-y-3">
      <div><label className="label" htmlFor="msg">Message ou avis du client</label>
        <textarea id="msg" className="field min-h-20" maxLength={2000} value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Collez ici le message reçu sur WhatsApp ou l'avis laissé" /></div>
      <div><label className="label" htmlFor="ctx">Ce que vous voulez répondre (facultatif)</label>
        <input id="ctx" className="field" maxLength={600} value={context} onChange={(e) => setContext(e.target.value)} placeholder="Ex. : je peux échanger la taille, livraison sous 48 h" /></div>
      <button type="button" className="btn btn-primary press" disabled={ai.loading || message.trim().length < 3} onClick={() => void ai.run({ message, context })}>{ai.loading ? "Patientez…" : "Rédiger une réponse"}</button>
      {ai.loading && <Thinking />}<AiError message={ai.error} /><UsageLine usage={ai.usage} cached={ai.cached} />
      {ai.result && <div className="space-y-2"><CopyBlock key={ai.result.reply} label="Réponse proposée" text={ai.result.reply} />
        {ai.result.tips.length > 0 && <ul className="ml-4 list-disc text-sm text-slate">{ai.result.tips.map((t) => <li key={t}>{t}</li>)}</ul>}</div>}
    </div>
  );
}
