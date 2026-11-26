"use client";
import { useState } from "react";

/**
 * Histogramme quotidien, une seule série (pas de légende : le titre la nomme).
 * Barres fines arrondies côté données, 2 px d'écart, axe et grille discrets, infobulle au survol et au clavier,
 * tableau accessible. Aucune animation : ce sont des données lues et utilisées.
 */
export function BarChart({ title, data, unit }: { title: string; data: { day: string; value: number }[]; unit: string }) {
  const [hover, setHover] = useState<number | null>(null);
  const W = 600, H = 160, padL = 28, padB = 20, padT = 8;
  const max = Math.max(1, ...data.map((d) => d.value));
  const nice = max <= 4 ? max : Math.ceil(max / 4) * 4;
  const plotW = W - padL, plotH = H - padB - padT;
  const step = plotW / Math.max(1, data.length);
  const barW = Math.max(2, step - 2);
  const label = (d: string) => new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short", timeZone: "UTC" }).format(new Date(d + "T00:00:00Z"));
  const total = data.reduce((s, d) => s + d.value, 0);
  const tickEvery = Math.ceil(data.length / 6);
  return (
    <figure className="card p-4">
      <figcaption className="mb-2 flex items-baseline justify-between gap-3"><span className="font-semibold">{title}</span><span className="text-sm text-slate">Total : <b className="text-ink">{total}</b></span></figcaption>
      <div className="relative">
        <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label={`${title} : ${total} ${unit} sur la période`} onMouseLeave={() => setHover(null)}>
          {[0, 0.5, 1].map((t) => {
            const y = padT + plotH * (1 - t);
            return <g key={t}><line x1={padL} x2={W} y1={y} y2={y} stroke="var(--color-line)" strokeWidth="1" />
              <text x={padL - 6} y={y + 4} textAnchor="end" fontSize="10" fill="var(--color-slate)">{Math.round(nice * t)}</text></g>;
          })}
          {data.map((d, i) => {
            const h = (d.value / nice) * plotH;
            const x = padL + i * step + 1;
            const y = padT + plotH - h;
            const r = Math.min(4, barW / 2, h);
            return (
              <g key={d.day} onMouseEnter={() => setHover(i)} onFocus={() => setHover(i)} onBlur={() => setHover(null)} tabIndex={0} aria-label={`${label(d.day)} : ${d.value} ${unit}`}>
                <rect x={padL + i * step} y={padT} width={step} height={plotH} fill="transparent" />
                {h > 0 && <path d={`M${x},${padT + plotH} V${y + r} Q${x},${y} ${x + r},${y} H${x + barW - r} Q${x + barW},${y} ${x + barW},${y + r} V${padT + plotH} Z`}
                  fill={hover === i ? "#a83c09" : "#c9480b"} />}
                {i % tickEvery === 0 && <text x={x + barW / 2} y={H - 5} textAnchor="middle" fontSize="10" fill="var(--color-slate)">{label(d.day)}</text>}
              </g>
            );
          })}
          <line x1={padL} x2={W} y1={padT + plotH} y2={padT + plotH} stroke="#cfd3db" strokeWidth="1" />
        </svg>
        {hover != null && (
          <div className="pointer-events-none absolute top-0 -translate-x-1/2 rounded-lg bg-ink px-2 py-1 text-xs text-white shadow"
            style={{ left: `${((padL + hover * step + step / 2) / W) * 100}%` }}>
            {label(data[hover].day)} · <b>{data[hover].value}</b> {unit}
          </div>
        )}
      </div>
      <details className="mt-2 text-sm"><summary className="cursor-pointer text-slate">Voir le tableau</summary>
        <table className="mt-2 w-full text-left"><thead><tr><th className="py-1 font-medium">Jour</th><th className="py-1 text-right font-medium">{unit}</th></tr></thead>
          <tbody>{data.filter((d) => d.value > 0).map((d) => <tr key={d.day} className="border-t border-line"><td className="py-1">{label(d.day)}</td><td className="py-1 text-right">{d.value}</td></tr>)}</tbody></table>
      </details>
    </figure>
  );
}
