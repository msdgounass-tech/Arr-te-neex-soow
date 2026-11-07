"use client";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useUI } from "@/store/ui";
import { CheckIcon } from "./Icons";

export function Toast() {
  const toast = useUI((s) => s.toast);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (!toast) return;
    setVisible(true);
    const t = setTimeout(() => setVisible(false), 3200);
    return () => clearTimeout(t);
  }, [toast]);
  return (
    <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-[max(1.5rem,env(safe-area-inset-bottom))] z-[90] flex justify-center px-4">
      <AnimatePresence>
        {visible && toast && (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 380, damping: 30 }}
            role="status"
            className="glass flex items-center gap-3 rounded-full py-2.5 pl-2.5 pr-5 text-sm font-semibold text-ivory shadow-[0_20px_60px_-20px_rgba(0,0,0,.9)]"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-accent text-ink">
              <CheckIcon width={15} height={15} strokeWidth={2.4} />
            </span>
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
