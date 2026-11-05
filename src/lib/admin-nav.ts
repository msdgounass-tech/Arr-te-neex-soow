import type { UserRole } from "@/lib/types";

export const ROLE_RANK: Record<UserRole, number> = { customer: 0, staff: 1, manager: 2, admin: 3 };

/** Rubriques de l'espace d'administration, avec le rôle minimal requis. */
export const ADMIN_ITEMS: { href: string; label: string; min: UserRole }[] = [
  { href: "/admin", label: "Tableau de bord", min: "staff" },
  { href: "/admin/commandes", label: "Commandes", min: "staff" },
  { href: "/admin/produits", label: "Produits", min: "manager" },
  { href: "/admin/categories", label: "Catégories", min: "manager" },
  { href: "/admin/collections", label: "Collections", min: "manager" },
  { href: "/admin/coupons", label: "Codes promo", min: "manager" },
  { href: "/admin/livraison", label: "Livraison", min: "admin" },
  { href: "/admin/clients", label: "Clients & équipe", min: "staff" },
  { href: "/admin/messages", label: "Messages", min: "staff" },
  { href: "/admin/parametres", label: "Paramètres", min: "admin" },
];

export const adminItemsFor = (role: UserRole) => ADMIN_ITEMS.filter((i) => ROLE_RANK[role] >= ROLE_RANK[i.min]);
