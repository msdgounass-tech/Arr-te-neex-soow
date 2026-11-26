"use client";
/** Réduit et convertit une photo en WebP dans le navigateur avant l'envoi (moins de données mobiles, chargement plus rapide). */
export async function compressImage(file: File, maxSize = 1600, quality = 0.82): Promise<{ file: File; width: number; height: number }> {
  const bitmap = await createImageBitmap(file).catch(() => null);
  if (!bitmap) throw new Error("Cette image ne peut pas être lue. Essayez une photo JPEG ou PNG.");
  const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale), height = Math.round(bitmap.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = width; canvas.height = height;
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();
  const blob: Blob | null = await new Promise((r) => canvas.toBlob(r, "image/webp", quality));
  if (!blob || blob.type !== "image/webp") {
    const jpg: Blob | null = await new Promise((r) => canvas.toBlob(r, "image/jpeg", quality));
    if (!jpg) throw new Error("La conversion de l'image a échoué.");
    return { file: new File([jpg], "photo.jpg", { type: "image/jpeg" }), width, height };
  }
  return { file: new File([blob], "photo.webp", { type: "image/webp" }), width, height };
}
