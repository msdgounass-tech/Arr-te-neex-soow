"use client";
import { usePathname } from "next/navigation";
import { WhatsAppIcon } from "@/components/ui/Icons";

/** Bouton WhatsApp flottant : ouvre une conversation avec la boutique (numéro configuré dans l'admin). */
export function WhatsAppFloat({ number }: { number: string }) {
  const pathname = usePathname();
  if (!number || pathname.startsWith("/commande")) return null;
  const text = encodeURIComponent("Bonjour GOUNASS LUXURY, j'ai une question sur une pièce de la boutique.");
  return (
    <a
      href={`https://wa.me/${number}?text=${text}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Écrire à GOUNASS LUXURY sur WhatsApp"
      className="fixed bottom-5 right-5 z-[70] flex h-14 w-14 items-center justify-center rounded-full bg-[#1f8a4c] text-white shadow-[0_10px_30px_-8px_rgba(0,0,0,.6)] ring-1 ring-white/20 transition-transform hover:scale-105 md:bottom-7 md:right-7"
    >
      <WhatsAppIcon width={28} height={28} />
    </a>
  );
}
