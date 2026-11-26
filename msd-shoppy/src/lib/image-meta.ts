/** Lit les dimensions réelles d'une image WebP, PNG ou JPEG à partir de ses octets (sans dépendance). */
export function imageSize(buf: Uint8Array): { width: number; height: number; type: "webp" | "png" | "jpeg" } | null {
  const str = (o: number, n: number) => String.fromCharCode(...buf.slice(o, o + n));
  if (str(0, 4) === "RIFF" && str(8, 4) === "WEBP") {
    const chunk = str(12, 4);
    if (chunk === "VP8X") return { type: "webp", width: 1 + (buf[24] | (buf[25] << 8) | (buf[26] << 16)), height: 1 + (buf[27] | (buf[28] << 8) | (buf[29] << 16)) };
    if (chunk === "VP8 ") return { type: "webp", width: (buf[26] | (buf[27] << 8)) & 0x3fff, height: (buf[28] | (buf[29] << 8)) & 0x3fff };
    if (chunk === "VP8L") { const b = buf.slice(21, 25); return { type: "webp", width: 1 + (((b[1] & 0x3f) << 8) | b[0]), height: 1 + (((b[3] & 0xf) << 10) | (b[2] << 2) | ((b[1] & 0xc0) >> 6)) }; }
    return null;
  }
  if (buf[0] === 0x89 && str(1, 3) === "PNG") {
    const dv = new DataView(buf.buffer, buf.byteOffset); return { type: "png", width: dv.getUint32(16), height: dv.getUint32(20) };
  }
  if (buf[0] === 0xff && buf[1] === 0xd8) {
    let i = 2;
    while (i < buf.length - 9) {
      if (buf[i] !== 0xff) { i++; continue; }
      const marker = buf[i + 1]; const len = (buf[i + 2] << 8) | buf[i + 3];
      if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) return { type: "jpeg", height: (buf[i + 5] << 8) | buf[i + 6], width: (buf[i + 7] << 8) | buf[i + 8] };
      i += 2 + len;
    }
  }
  return null;
}
