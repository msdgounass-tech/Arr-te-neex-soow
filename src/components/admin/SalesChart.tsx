import { formatPrice } from "@/lib/format";

/** Histogramme SVG du chiffre d'affaires encaissé par jour. */
export function SalesChart({ data }: { data: { day: string; revenue: number; orders: number }[] }) {
  const max = Math.max(1, ...data.map((d) => d.revenue));
  const w = 100 / Math.max(data.length, 1);
  const total = data.reduce((a, d) => a + d.revenue, 0);
  return (
    <div>
      <div className="relative h-56">
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-full w-full" role="img" aria-label={`Chiffre d'affaires sur la période : ${formatPrice(total)}`}>
          {[25, 50, 75].map((y) => <line key={y} x1="0" x2="100" y1={y} y2={y} stroke="#2a2a2a" strokeWidth=".3" vectorEffect="non-scaling-stroke" />)}
          {data.map((d, i) => {
            const h = (d.revenue / max) * 96;
            return (
              <rect key={d.day} x={i * w + w * 0.18} width={w * 0.64} y={100 - h} height={h} fill="#7ea4ff" opacity={d.revenue ? 0.9 : 0.15}>
                <title>{`${new Date(d.day).toLocaleDateString("fr-FR")} — ${formatPrice(d.revenue)} · ${d.orders} commande(s)`}</title>
              </rect>
            );
          })}
        </svg>
      </div>
      <div className="mt-2 flex justify-between text-[0.78rem] text-mist">
        <span>{data[0] ? new Date(data[0].day).toLocaleDateString("fr-FR", { day: "numeric", month: "short" }) : ""}</span>
        <span>Max : {formatPrice(max === 1 ? 0 : max)}</span>
        <span>{data.at(-1) ? new Date(data.at(-1)!.day).toLocaleDateString("fr-FR", { day: "numeric", month: "short" }) : ""}</span>
      </div>
    </div>
  );
}
