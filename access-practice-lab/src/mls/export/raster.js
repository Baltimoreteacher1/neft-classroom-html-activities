// Math Literacy Studio exports: pictures and the helpers every exporter shares.
//
// Exporters consume a Resource only (docs/math-literacy/architecture.md). The few things that are the same in every
// format live here so no format grows its own copy: HTML escaping, file names, the block-reference scheme that ties a
// picture to its block, SVG sizing, the visuals loader, the teacher answer key as a Resource of its own, and the
// browser-side SVG -> PNG rasteriser. Nothing here needs the DOM except svgToPng, and nothing fails when it is missing:
// an exporter that has no PNG for a picture writes the alt text as a visible caption instead.

export const MLS_NAME = "Math Literacy Studio";
export const MLS_ORIGIN = "https://eduwonderlab.com/access-practice-lab/math-literacy";

// ── small text helpers ──────────────────────────────────────────────────────

const ESC = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
/** HTML/XML-escape any value. */
export const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ESC[c]);

/** Characters XML 1.0 cannot carry at all (control characters other than tab, LF, CR) are dropped. */
export function xmlSafe(s) {
  let out = "";
  for (const ch of String(s ?? "")) {
    const c = ch.codePointAt(0);
    if (c === 9 || c === 10 || c === 13 || (c >= 0x20 && c <= 0xd7ff) || (c >= 0xe000 && c <= 0xfffd) || c >= 0x10000)
      out += ch;
  }
  return out;
}
/** XML-escape (attributes and text). */
export const xesc = (s) => xmlSafe(s).replace(/[&<>"]/g, (c) => ESC[c]);

/** "Grade 3: Fractions & more!" -> "grade-3-fractions-more". */
export function kebab(s, fallback = "resource") {
  const k = String(s ?? "")
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 70)
    .replace(/-+$/g, "");
  return k || fallback;
}

/** A plain-text line count helper: split on newlines, never returns an empty list. */
export const lines = (s) => String(s ?? "").split("\n");

/** Resource defaults so a sparse Resource never throws. */
export function normalizeResource(resource) {
  const r = resource || {};
  return {
    ...r,
    id: r.id || kebab(r.title),
    title: String(r.title || "Untitled resource"),
    subtitle: r.subtitle || "",
    lang: r.lang || "en",
    meta: r.meta || {},
    sections: (r.sections || []).map((s) => ({ heading: s.heading || "", blocks: (s.blocks || []).filter(Boolean) })),
    key: r.key || [],
    notes: r.notes || [],
  };
}

/** "Grade 3 · about 20 minutes" (the only meta shown on a student document). */
export function metaLine(resource) {
  const parts = [];
  if (resource.grade != null && resource.grade !== "") parts.push(`Grade ${resource.grade}`);
  const min = resource.meta?.minutes;
  if (min) parts.push(`about ${min} minutes`);
  return parts.join(" · ");
}

// ── block references ────────────────────────────────────────────────────────

/** Stable reference for a block (and for a picture inside it): "s1.b4", "s1.b4.v", "s1.b4.c2". */
export const blockRef = (si, bi, sub = "") => `s${si}.b${bi}${sub ? `.${sub}` : ""}`;

/** Every picture a Resource asks for: { ref, spec, alt } in reading order. */
export function listVisuals(resource) {
  const r = normalizeResource(resource);
  const out = [];
  r.sections.forEach((s, si) =>
    s.blocks.forEach((b, bi) => {
      if (b.t === "visual" && b.spec) out.push({ ref: blockRef(si, bi), spec: b.spec, alt: b.alt || b.spec.alt || "" });
      else if (b.t === "problem" && b.visual)
        out.push({ ref: blockRef(si, bi, "v"), spec: b.visual, alt: b.visual.alt || "" });
      else if (b.t === "cards")
        (b.items || []).forEach((c, ci) => {
          if (c.visual) out.push({ ref: blockRef(si, bi, `c${ci}`), spec: c.visual, alt: c.visual.alt || "" });
        });
    }),
  );
  return out;
}

// ── SVG helpers ─────────────────────────────────────────────────────────────

/** Natural size of an SVG string: viewBox first, then width/height, then 4:3. */
export function svgSize(svg) {
  const open = /<svg\b[^>]*>/i.exec(svg || "")?.[0] || "";
  const vb = /viewBox\s*=\s*["']\s*([-\d.eE+]+)[\s,]+([-\d.eE+]+)[\s,]+([-\d.eE+]+)[\s,]+([-\d.eE+]+)\s*["']/i.exec(open);
  if (vb && +vb[3] > 0 && +vb[4] > 0) return { w: +vb[3], h: +vb[4] };
  const w = /\swidth\s*=\s*["']([\d.]+)/i.exec(open);
  const h = /\sheight\s*=\s*["']([\d.]+)/i.exec(open);
  if (w && h && +w[1] > 0 && +h[1] > 0) return { w: +w[1], h: +h[1] };
  return { w: 400, h: 300 };
}

/** Make an SVG string safe to load as a standalone image: xmlns present, explicit pixel width and height. */
export function standaloneSvg(svg, widthPx) {
  const { w, h } = svgSize(svg);
  const heightPx = Math.max(1, Math.round((widthPx * h) / w));
  let open = /<svg\b[^>]*>/i.exec(svg)[0];
  let next = open.replace(/\s(width|height)\s*=\s*("[^"]*"|'[^']*')/gi, "");
  if (!/\sxmlns\s*=/.test(next)) next = next.replace(/<svg\b/i, '<svg xmlns="http://www.w3.org/2000/svg"');
  next = next.replace(/<svg\b/i, `<svg width="${widthPx}" height="${heightPx}"`);
  return { svg: svg.replace(open, next), w: widthPx, h: heightPx };
}

// ── the visuals loader ──────────────────────────────────────────────────────

let visualsPromise = null;
/**
 * renderVisual(spec) -> { svg, alt, summary } from ../visuals.js, loaded lazily so a missing or still-being-written
 * module degrades to "no picture, alt text instead" rather than breaking every export. Resolves to null when absent.
 */
export function getRenderVisual() {
  visualsPromise ||= import("../visuals.js").then((m) => m.renderVisual || null).catch(() => null);
  return visualsPromise;
}

/** Safe wrapper: a visual that throws or returns junk becomes null (the exporter then writes the alt text). */
export function safeRender(renderVisual, spec) {
  if (!renderVisual || !spec) return null;
  try {
    const out = renderVisual(spec);
    return out && typeof out.svg === "string" && out.svg.includes("<svg") ? out : null;
  } catch {
    return null;
  }
}

// ── rasterising (browser) ───────────────────────────────────────────────────

/** True where an Image + canvas pipeline exists. */
export const canRasterise = () => typeof document !== "undefined" && typeof Image !== "undefined";

/** SVG string -> PNG bytes on a fixed white background. Browser only; throws elsewhere. */
export async function svgToPng(svgString, widthPx = 1200) {
  if (!canRasterise()) throw new Error("svgToPng needs a browser (Image and canvas)");
  const { svg, w, h } = standaloneSvg(svgString, widthPx);
  const img = new Image();
  img.decoding = "sync";
  await new Promise((resolve, reject) => {
    img.onload = resolve;
    img.onerror = () => reject(new Error("the SVG could not be loaded as an image"));
    img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  });
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, w, h);
  ctx.drawImage(img, 0, 0, w, h);
  const blob = await new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("canvas.toBlob returned nothing"))), "image/png"),
  );
  return new Uint8Array(await blob.arrayBuffer());
}

/**
 * Rasterise every picture in a Resource: Map(blockRef -> { png, w, h, alt }). A picture that cannot be rendered or
 * rasterised is simply absent from the map; the exporter then falls back to its alt-text caption.
 */
export async function collectImages(resource, { renderVisual, widthPx = 1200 } = {}) {
  const images = new Map();
  if (!canRasterise()) return images;
  const render = renderVisual || (await getRenderVisual());
  for (const v of listVisuals(resource)) {
    const out = safeRender(render, v.spec);
    if (!out) continue;
    try {
      const png = await svgToPng(out.svg, widthPx);
      const { w, h } = standaloneSvg(out.svg, widthPx);
      images.set(v.ref, { png, w, h, alt: v.alt || out.alt || "" });
    } catch {
      /* leave it out: alt text is written instead */
    }
  }
  return images;
}

/** Pixel size of a PNG from its IHDR, so an images map entry only needs bytes. */
export function pngSize(png) {
  if (!png || png.length < 24) return null;
  const dv = new DataView(png.buffer, png.byteOffset, png.byteLength);
  if (dv.getUint32(0) !== 0x89504e47) return null;
  return { w: dv.getUint32(16), h: dv.getUint32(20) };
}

/** An images-map entry, completed from the PNG itself when w/h were left out. */
export function imageEntry(images, ref) {
  const e = images?.get?.(ref);
  if (!e?.png) return null;
  const size = e.w && e.h ? { w: e.w, h: e.h } : pngSize(e.png);
  return size ? { ...e, ...size } : null;
}

// ── the teacher answer key as a Resource ────────────────────────────────────

/**
 * The key is a separate document built from resource.key and resource.notes only, so it can go through the very same
 * exporters. Its title is "<title>: Answer key". The student document never carries any of it.
 */
export function keyResource(resource) {
  const r = normalizeResource(resource);
  const blocks = [{ t: "p", style: "teacher", text: "Teacher copy. Do not hand this page to students." }];
  if (r.key.length) {
    blocks.push({
      t: "table",
      headers: ["Item", "Answer", "Work"],
      rows: r.key.map((k) => [String(k.ref ?? ""), String(k.answer ?? ""), (k.work || []).map(String).join("\n")]),
    });
  } else {
    blocks.push({ t: "p", text: "No answer key was written for this resource." });
  }
  const sections = [{ heading: "Answers", blocks }];
  if (r.notes.length) sections.push({ heading: "Teacher notes", blocks: [{ t: "list", items: r.notes.map(String) }] });
  return {
    ...r,
    id: `${r.id}-key`,
    title: `${r.title}: Answer key`,
    subtitle: r.title,
    sections,
    key: [],
    notes: [],
    isKey: true,
  };
}

/** Column shares for a table: proportional to the longest line in each column, clamped so none collapses. */
export function columnShares(headers, rows, { min = 0.1 } = {}) {
  const n = Math.max(headers?.length || 0, ...rows.map((r) => r.length), 1);
  const weight = Array.from({ length: n }, (_, c) => {
    const cells = [headers?.[c] ?? "", ...rows.map((r) => r[c] ?? "")];
    const longest = Math.max(...cells.flatMap((x) => lines(x).map((l) => l.length)), 1);
    return Math.min(Math.max(longest, 8), 48);
  });
  const total = weight.reduce((a, b) => a + b, 0);
  let share = weight.map((w) => w / total);
  const floor = Math.min(min, 1 / n);
  share = share.map((s) => Math.max(s, floor));
  const sum = share.reduce((a, b) => a + b, 0);
  return share.map((s) => s / sum);
}

/** Workspace height in inches for a problem: size 1..6, 0.6 in per step. */
export const workspaceInches = (ws) => (ws && ws.kind !== "none" ? Math.min(6, Math.max(1, +ws.size || 2)) * 0.6 : 0);

/** The text of one lettered choice label. */
export const letter = (i) => String.fromCharCode(65 + i);
