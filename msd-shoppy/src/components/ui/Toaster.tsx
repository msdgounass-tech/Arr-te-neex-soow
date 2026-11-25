"use client";
import { useSyncExternalStore } from "react";
import { toastStore } from "./toast";
import { Icon } from "./Icon";

export function Toaster() {
  const items = useSyncExternalStore(toastStore.subscribe, toastStore.get, toastStore.server);
  return (
    <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-[calc(76px+env(safe-area-inset-bottom))] z-[60] flex flex-col items-center gap-2 px-4 md:bottom-6">
      {items.map((t) => (
        <div key={t.id} data-state={t.state} role={t.tone === "error" ? "alert" : "status"}
          className="toast pointer-events-auto flex max-w-md items-center gap-3 rounded-2xl bg-ink px-4 py-3 text-sm font-medium text-white shadow-lg">
          <span className={t.tone === "error" ? "text-red-300" : t.tone === "success" ? "text-green-300" : "text-orange"}>
            <Icon name={t.tone === "error" ? "info" : t.tone === "success" ? "check" : "bell"} size={18} />
          </span>
          <span>{t.message}</span>
          <button type="button" onClick={() => toastStore.dismiss(t.id)} className="-mr-1 ml-1 rounded-full p-1 text-white/70 hover:text-white" aria-label="Fermer">
            <Icon name="x" size={16} />
          </button>
        </div>
      ))}
    </div>
  );
}
