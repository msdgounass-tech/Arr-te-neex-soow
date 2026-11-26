"use client";
import Image, { type ImageProps } from "next/image";
import { useCallback, useState } from "react";

/** Image avec fondu au chargement. Gère le cas d'une image déjà en cache (chargée avant l'hydratation). */
export function FadeImage({ className = "", ...props }: ImageProps) {
  // Image prioritaire (au-dessus de la ligne de flottaison) : jamais masquée en attendant l'hydratation.
  if (props.priority) return <Image {...props} className={className} />;
  return <FadingImage className={className} {...props} />;
}

function FadingImage({ className = "", ...props }: ImageProps) {
  const [loaded, setLoaded] = useState(false);
  const ref = useCallback((img: HTMLImageElement | null) => {
    if (img?.complete && img.naturalWidth > 0) setLoaded(true);
  }, []);
  return <Image {...props} ref={ref} onLoad={() => setLoaded(true)} data-loaded={loaded} className={`fade-img ${className}`} />;
}
