// Pictures: a teacher picks a file and we shrink it to a safe size here, so nobody has to resize anything.
// Only PNG, JPEG, WebP and GIF are accepted; the result is always a re-encoded raster data URL (never SVG, never
// the original bytes), so a file cannot carry script or hidden data into an activity.

import { LIMITS } from "../core/schema.js";

const OK = /^image\/(png|jpeg|webp|gif)$/;
const MAX_SIDE = 1000;
export const MAX_PICK_BYTES = 8 * 1024 * 1024;

const loadImage = (url) =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("unreadable"));
    img.src = url;
  });

/**
 * @returns {Promise<{ ok: true, src: string, width: number, height: number } | { ok: false, error: "type"|"size"|"unreadable"|"too-big" }>}
 */
export async function imageFromFile(file) {
  if (!file || !OK.test(file.type)) return { ok: false, error: "type" };
  if (file.size > MAX_PICK_BYTES) return { ok: false, error: "size" };
  const url = URL.createObjectURL(file);
  try {
    const img = await loadImage(url);
    let scale = Math.min(1, MAX_SIDE / Math.max(img.width, img.height));
    for (let tries = 0; tries < 5; tries++) {
      const w = Math.max(1, Math.round(img.width * scale));
      const h = Math.max(1, Math.round(img.height * scale));
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      ctx.fillStyle = "#fff";
      ctx.fillRect(0, 0, w, h);
      ctx.drawImage(img, 0, 0, w, h);
      const src = canvas.toDataURL("image/jpeg", tries ? 0.7 : 0.82);
      if (src.length <= LIMITS.imageBytes * 1.3) return { ok: true, src, width: w, height: h };
      scale *= 0.75;
    }
    return { ok: false, error: "too-big" };
  } catch {
    return { ok: false, error: "unreadable" };
  } finally {
    URL.revokeObjectURL(url);
  }
}

export const IMAGE_ERRORS = {
  type: ["Use a PNG, JPG, WebP or GIF picture.", "Use una imagen PNG, JPG, WebP o GIF."],
  size: [
    "That picture is over 8 MB. Pick a smaller one.",
    "Esa imagen pesa más de 8 MB. Elija una más pequeña.",
  ],
  unreadable: ["That picture could not be opened.", "No se pudo abrir esa imagen."],
  "too-big": [
    "That picture is too detailed to fit. Try a simpler one.",
    "Esa imagen es demasiado detallada. Pruebe con una más sencilla.",
  ],
};
