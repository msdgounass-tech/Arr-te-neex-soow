"use client";
import clsx from "clsx";

/** Conteneur dont le halo lumineux (classe .spotlight) suit le pointeur. */
export function Spotlight({ className, children, ...rest }: React.HTMLAttributes<HTMLDivElement>) {
  const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== "mouse") return;
    const r = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty("--mx", `${e.clientX - r.left}px`);
    e.currentTarget.style.setProperty("--my", `${e.clientY - r.top}px`);
  };
  return (
    <div onPointerMove={onMove} className={clsx("spotlight", className)} {...rest}>
      {children}
    </div>
  );
}
