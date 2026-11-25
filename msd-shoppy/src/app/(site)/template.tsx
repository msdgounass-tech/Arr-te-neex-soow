/** Entrée de page commune (CSS, 200 ms, opacité + 4 px). Rejouée à chaque navigation. */
export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="page-enter">{children}</div>;
}
