import { Texture } from "pixi.js";

function normalizeDataUrl(data: string): string {
  const cleaned = data.replace(/\s+/g, "");
  if (cleaned.startsWith("data:")) return cleaned;

  const head = cleaned.slice(0, 10);
  let mime = "image/png";
  if (head.startsWith("/9j/")) mime = "image/jpeg";
  else if (head.startsWith("R0lGOD")) mime = "image/gif";
  else if (head.startsWith("UklGR")) mime = "image/webp";

  return `data:${mime};base64,${cleaned}`;
}

export async function textureFromBase64(
  dataUrlOrBase64: string,
): Promise<Texture | null> {
  const src = normalizeDataUrl(dataUrlOrBase64);

  return await new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";

    img.onload = () => resolve(Texture.from(img));
    img.onerror = () => resolve(null);

    img.src = src;
  });
}
