// Book Studio media handling: validating and preparing pictures, recordings, video and captions before they are
// stored on this device, plus the freehand drawing tool. Files are checked by type and size first; pictures are
// re-encoded through a canvas (which also drops EXIF location data from phone photos).
import { LIMITS } from "./model.js";

export const IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif"];
export const AUDIO_TYPES = /^audio\/(webm|ogg|mpeg|mp3|mp4|x-m4a|aac|wav|x-wav)$/;
export const VIDEO_TYPES = /^video\/(mp4|webm|quicktime|ogg)$/;
const MAX_SIDE = 2000;

export class MediaError extends Error {
  constructor(code, en, es) {
    super(code);
    this.code = code;
    this.en = en;
    this.es = es;
  }
}
const mb = (n) => `${Math.round(n / 1024 / 1024)} MB`;

/** A picture file → a re-encoded Blob no larger than MAX_SIDE on its long side. GIFs keep their animation. */
export async function prepareImage(file) {
  if (!file || !IMAGE_TYPES.includes(file.type))
    throw new MediaError(
      "type",
      "Choose a PNG, JPEG, WebP or GIF picture.",
      "Elige una imagen PNG, JPEG, WebP o GIF.",
    );
  if (file.size > LIMITS.imageBytes)
    throw new MediaError(
      "size",
      `That picture is larger than ${mb(LIMITS.imageBytes)}. Choose a smaller one.`,
      `Esa imagen pesa más de ${mb(LIMITS.imageBytes)}. Elige una más pequeña.`,
    );
  if (file.type === "image/gif") return { blob: file, width: 0, height: 0 };
  let bitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    throw new MediaError(
      "decode",
      "This picture could not be opened. Try another file.",
      "No se pudo abrir esta imagen. Prueba con otro archivo.",
    );
  }
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  const w = Math.max(1, Math.round(bitmap.width * scale));
  const h = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  canvas.getContext("2d").drawImage(bitmap, 0, 0, w, h);
  bitmap.close?.();
  const type = file.type === "image/png" || file.type === "image/webp" ? "image/png" : "image/jpeg";
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, type, 0.86));
  if (!blob)
    throw new MediaError(
      "encode",
      "This picture could not be saved. Try another file.",
      "No se pudo guardar esta imagen. Prueba con otro archivo.",
    );
  return { blob, width: w, height: h };
}

export function checkAudio(file) {
  if (!file || !AUDIO_TYPES.test(file.type))
    throw new MediaError(
      "type",
      "Choose an audio file (MP3, M4A, WAV, WebM or OGG).",
      "Elige un archivo de audio (MP3, M4A, WAV, WebM u OGG).",
    );
  if (file.size > LIMITS.audioBytes)
    throw new MediaError(
      "size",
      `That recording is larger than ${mb(LIMITS.audioBytes)}.`,
      `Esa grabación pesa más de ${mb(LIMITS.audioBytes)}.`,
    );
}

export function checkVideo(file) {
  if (!file || !VIDEO_TYPES.test(file.type))
    throw new MediaError(
      "type",
      "Choose a video file (MP4, WebM or MOV).",
      "Elige un archivo de video (MP4, WebM o MOV).",
    );
  if (file.size > LIMITS.videoBytes)
    throw new MediaError(
      "size",
      `That video is larger than ${mb(LIMITS.videoBytes)}. Trim it or choose a shorter one.`,
      `Ese video pesa más de ${mb(LIMITS.videoBytes)}. Recórtalo o elige uno más corto.`,
    );
}

/** Length of an audio/video Blob in seconds (0 when the browser cannot tell). */
export function mediaDuration(blob, tag = "audio") {
  return new Promise((resolve) => {
    const el = document.createElement(tag);
    const url = URL.createObjectURL(blob);
    const done = (n) => {
      URL.revokeObjectURL(url);
      resolve(Number.isFinite(n) ? Math.round(n) : 0);
    };
    el.preload = "metadata";
    el.onloadedmetadata = () => done(el.duration);
    el.onerror = () => done(0);
    setTimeout(() => done(0), 4000);
    el.src = url;
  });
}

/** A poster frame (JPEG Blob) from half a second into a video, or null. */
export function videoPoster(blob) {
  return new Promise((resolve) => {
    const v = document.createElement("video");
    const url = URL.createObjectURL(blob);
    const finish = (out) => {
      URL.revokeObjectURL(url);
      resolve(out);
    };
    v.muted = true;
    v.playsInline = true;
    v.preload = "auto";
    v.onloadeddata = () => {
      v.currentTime = Math.min(0.5, (v.duration || 1) / 2);
    };
    v.onseeked = () => {
      try {
        const scale = Math.min(1, 1280 / (v.videoWidth || 1280));
        const c = document.createElement("canvas");
        c.width = Math.round((v.videoWidth || 640) * scale);
        c.height = Math.round((v.videoHeight || 360) * scale);
        c.getContext("2d").drawImage(v, 0, 0, c.width, c.height);
        c.toBlob((b) => finish(b), "image/jpeg", 0.82);
      } catch {
        finish(null);
      }
    };
    v.onerror = () => finish(null);
    setTimeout(() => finish(null), 8000);
    v.src = url;
  });
}

/** A captions file must be WebVTT (SRT is converted). Returns a text/vtt Blob. */
export async function prepareCaptions(file) {
  if (!file || file.size > 300 * 1024)
    throw new MediaError(
      "size",
      "Choose a captions file (.vtt or .srt) under 300 KB.",
      "Elige un archivo de subtítulos (.vtt o .srt) de menos de 300 KB.",
    );
  let text = (await file.text()).replace(/^\uFEFF/, "").replace(/\r/g, "");
  if (!/^WEBVTT/.test(text)) {
    if (!/\d\d:\d\d:\d\d,\d{3} --> /.test(text))
      throw new MediaError(
        "format",
        "That file is not WebVTT or SRT captions.",
        "Ese archivo no es de subtítulos WebVTT o SRT.",
      );
    text = `WEBVTT\n\n${text.replace(/(\d\d:\d\d:\d\d),(\d{3})/g, "$1.$2")}`;
  }
  return new Blob([text], { type: "text/vtt" });
}

/** A YouTube video id from a watch, share, shorts or embed link (the only approved embed provider). */
export function youTubeId(url) {
  try {
    const u = new URL(String(url).trim());
    const host = u.hostname.replace(/^www\.|^m\./, "");
    let id = "";
    if (host === "youtu.be") id = u.pathname.slice(1);
    else if (host === "youtube.com" || host === "youtube-nocookie.com") {
      if (u.pathname === "/watch") id = u.searchParams.get("v") || "";
      else {
        const m = /^\/(embed|shorts|live)\/([\w-]{11})/.exec(u.pathname);
        id = m ? m[2] : "";
      }
    }
    return /^[\w-]{11}$/.test(id) ? id : "";
  } catch {
    return "";
  }
}

/** Width/height of a picture so it can be placed at its own aspect ratio on the page. */
export function fitOnPage(imgW, imgH, pageRatio, maxW = 60, maxH = 60) {
  if (!imgW || !imgH) return { w: maxW * 0.8, h: maxH * 0.6 };
  // Percent units differ on each axis: a page-width percent is pageRatio times a page-height percent.
  const r = imgW / imgH / pageRatio; // element w% / h% ratio that keeps the picture's shape
  let w = maxW;
  let h = w / r;
  if (h > maxH) {
    h = maxH;
    w = h * r;
  }
  return { w: Math.round(w * 10) / 10, h: Math.round(h * 10) / 10 };
}

// ── drawing ──────────────────────────────────────────────────────────────────

/**
 * Freehand drawing on a page. `surface` is an absolutely positioned overlay covering the page; strokes are reported in
 * 0..1000 units of that overlay (so they scale with the page) through onStroke. Pen and touch draw; a stylus is
 * pressure-blind on purpose (simpler for young writers). The eraser reports the point it touched; the caller removes
 * any stroke passing near it.
 */
export function startDrawing(surface, { getTool, onStroke, onErase }) {
  let pts = null;
  let live = null;
  const toLocal = (e) => {
    const r = surface.getBoundingClientRect();
    return [
      Math.round(((e.clientX - r.left) / r.width) * 1000),
      Math.round(((e.clientY - r.top) / r.height) * 1000),
    ];
  };
  const down = (e) => {
    if (e.button > 0) return;
    e.preventDefault();
    surface.setPointerCapture(e.pointerId);
    const tool = getTool();
    if (tool.erase) {
      onErase(toLocal(e), tool.size);
      pts = [];
      return;
    }
    pts = [toLocal(e)];
    live = document.createElementNS("http://www.w3.org/2000/svg", "path");
    live.setAttribute("fill", "none");
    live.setAttribute("stroke", tool.color);
    live.setAttribute("stroke-linecap", "round");
    live.setAttribute("stroke-linejoin", "round");
    live.setAttribute("vector-effect", "non-scaling-stroke");
    live.style.strokeWidth = `calc(${tool.size}*0.5cqw)`;
    surface.querySelector("svg")?.append(live);
  };
  const move = (e) => {
    if (!pts) return;
    const tool = getTool();
    if (tool.erase) return onErase(toLocal(e), tool.size);
    const p = toLocal(e);
    const last = pts.at(-1);
    if (Math.abs(p[0] - last[0]) + Math.abs(p[1] - last[1]) < 4) return;
    pts.push(p);
    live?.setAttribute("d", `M${pts.map((q) => q.join(" ")).join(" L")}`);
  };
  const up = () => {
    if (!pts) return;
    const tool = getTool();
    if (!tool.erase && pts.length) onStroke({ color: tool.color, size: tool.size, pts });
    live?.remove();
    live = null;
    pts = null;
  };
  surface.addEventListener("pointerdown", down);
  surface.addEventListener("pointermove", move);
  surface.addEventListener("pointerup", up);
  surface.addEventListener("pointercancel", up);
  return () => {
    surface.removeEventListener("pointerdown", down);
    surface.removeEventListener("pointermove", move);
    surface.removeEventListener("pointerup", up);
    surface.removeEventListener("pointercancel", up);
  };
}

/** Strokes that pass within `radius` (0..1000 units) of a point. */
export function strokesNear(strokes, [x, y], radius = 18) {
  const r2 = radius * radius;
  return strokes.filter((s) =>
    s.pts.some(([px, py]) => (px - x) ** 2 + (py - y) ** 2 <= r2 + (s.size * 5) ** 2),
  );
}
