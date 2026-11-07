import type { SVGProps } from "react";
import { GamepadIcon, GridIcon, HeadphonesIcon, LaptopIcon, PhoneIcon, PlugIcon, WatchIcon } from "@/components/ui/Icons";

const MAP: Record<string, (p: SVGProps<SVGSVGElement>) => React.ReactElement> = {
  telephonie: PhoneIcon,
  smartphones: PhoneIcon,
  tablettes: PhoneIcon,
  informatique: LaptopIcon,
  "ordinateurs-portables": LaptopIcon,
  audio: HeadphonesIcon,
  "ecouteurs-casques": HeadphonesIcon,
  "objets-connectes": WatchIcon,
  "montres-connectees": WatchIcon,
  "tv-gaming": GamepadIcon,
  "consoles-jeux": GamepadIcon,
  "accessoires-tech": PlugIcon,
  "chargeurs-cables": PlugIcon,
};

/** Pictogramme d'une catégorie (pictogramme générique pour une catégorie créée dans l'admin). */
export function CategoryIcon({ slug, ...p }: { slug: string } & SVGProps<SVGSVGElement>) {
  const Icon = MAP[slug] || GridIcon;
  return <Icon {...p} />;
}
