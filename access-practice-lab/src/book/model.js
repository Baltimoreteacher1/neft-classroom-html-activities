// Book Studio document model: one structured, versioned JSON document per book. Pure data and pure functions (no DOM,
// no storage) so Node tests can import it. The editor, reader, thumbnails and every export read this one shape.
//
// Coordinates are percentages of the page (x, y, w, h in 0..100), so a page renders identically at any size: the
// editor canvas, a bookshelf thumbnail, the reader and a printed PDF page. Text size is in "page-width hundredths"
// (CSS cqw), for the same reason. Element order in `elements` is the layer order (last = front).

import { GRADE_CLUSTER_IDS, KEY_LANGUAGE_USES, normalizePlan } from "./lang/profiles.js";
import { normalizeSupport } from "./lang/supports.js";
import { emptyWork, normalizeWork } from "./lang/work.js";
import {
  CREATION_MODES,
  normalizeChoice,
  normalizeCharacter,
  normalizeHotspot,
  normalizeScene,
  normalizeStory,
  validateStory,
} from "./story.js";

/** Schema 3 adds the Living Storyworld layer (supports, characters, scenes, choices, work). Schema 2 books load unchanged. */
export const SCHEMA = 3;

/** Page shapes. `ratio` is width / height. */
export const FORMATS = Object.freeze({
  portrait: { ratio: 3 / 4, en: "Portrait", es: "Vertical", pageCss: "8.5in 11.333in" },
  landscape: { ratio: 4 / 3, en: "Landscape", es: "Horizontal", pageCss: "11in 8.25in" },
  square: { ratio: 1, en: "Square", es: "Cuadrado", pageCss: "8.5in 8.5in" },
  comic: { ratio: 2 / 3, en: "Comic", es: "Cómic", pageCss: "7.333in 11in" },
});

/** Kinds of book offered on "Create a book". Each picks a format and a starting page set. */
export const KINDS = Object.freeze([
  { id: "blank", format: "portrait", icon: "writing", en: "Blank book", es: "Libro en blanco" },
  {
    id: "picture",
    format: "landscape",
    icon: "sparkle",
    en: "Picture book",
    es: "Libro ilustrado",
  },
  { id: "comic", format: "comic", icon: "speaking", en: "Comic book", es: "Cómic" },
  { id: "report", format: "portrait", icon: "reading", en: "Report", es: "Informe" },
  { id: "narrative", format: "portrait", icon: "star", en: "Narrative", es: "Narración" },
  {
    id: "informational",
    format: "landscape",
    icon: "bulb",
    en: "Informational text",
    es: "Texto informativo",
  },
  {
    id: "bilingual",
    format: "landscape",
    icon: "families",
    en: "Bilingual book",
    es: "Libro bilingüe",
  },
  { id: "audio", format: "square", icon: "listening", en: "Audio story", es: "Cuento con audio" },
]);

export const STATUSES = Object.freeze({
  draft: { en: "Draft", es: "Borrador" },
  completed: { en: "Finished", es: "Terminado" },
  submitted: { en: "Sent to teacher", es: "Enviado al docente" },
  returned: { en: "Feedback to read", es: "Comentarios para leer" },
  published: { en: "In my portfolio", es: "En mi portafolio" },
});

export const ELEMENT_TYPES = Object.freeze([
  "text",
  "image",
  "art",
  "shape",
  "bubble",
  "audio",
  "video",
  "drawing",
  "panel",
]);
export const SHAPES = Object.freeze([
  "rect",
  "rounded",
  "ellipse",
  "triangle",
  "star",
  "arrow",
  "line",
  "heart",
]);
export const BUBBLES = Object.freeze(["speech", "thought", "shout", "caption"]);
export const TEXT_ROLES = Object.freeze(["title", "heading", "body", "caption"]);
export const FONTS = Object.freeze({
  atkinson: {
    css: "'Atkinson Hyperlegible', system-ui, sans-serif",
    en: "Clear (Atkinson)",
    es: "Clara (Atkinson)",
  },
  fraunces: {
    css: "Fraunces, Georgia, serif",
    en: "Storybook (Fraunces)",
    es: "Cuento (Fraunces)",
  },
  system: { css: "system-ui, -apple-system, 'Segoe UI', sans-serif", en: "Simple", es: "Sencilla" },
  rounded: {
    css: "ui-rounded, 'Arial Rounded MT Bold', 'Nunito', system-ui, sans-serif",
    en: "Rounded",
    es: "Redondeada",
  },
  mono: {
    css: "ui-monospace, 'SF Mono', Menlo, monospace",
    en: "Typewriter",
    es: "Máquina de escribir",
  },
  comic: {
    css: "'Comic Neue', 'Chalkboard SE', 'Comic Sans MS', 'Atkinson Hyperlegible', sans-serif",
    en: "Comic",
    es: "Cómic",
  },
});
export const ROLE_DEFAULTS = Object.freeze({
  title: { size: 7, weight: 700, font: "fraunces", lineHeight: 1.1 },
  heading: { size: 4.6, weight: 700, font: "fraunces", lineHeight: 1.15 },
  body: { size: 3.2, weight: 400, font: "atkinson", lineHeight: 1.45 },
  caption: { size: 2.5, weight: 400, font: "atkinson", lineHeight: 1.35 },
});

/** Swatches offered in the editor. Every text swatch keeps 4.5:1 on the light page colours. */
export const PALETTE = Object.freeze({
  ink: ["#1b1f3b", "#0b3d4a", "#5a1e3a", "#6b2f12", "#1f4a2e", "#ffffff"],
  fill: [
    "#fffaf0",
    "#ffffff",
    "#e7f4f2",
    "#e9edf8",
    "#f8e8ef",
    "#fbeadf",
    "#e6f0e3",
    "#fff3c4",
    "#1b2a5c",
    "#075568",
    "#8a3a5c",
    "#9a4a26",
    "#f2b134",
    "#e86a50",
    "#7fb48a",
  ],
});

export const LIMITS = Object.freeze({
  pages: 60,
  elementsPerPage: 60,
  imageBytes: 12 * 1024 * 1024,
  audioBytes: 20 * 1024 * 1024,
  videoBytes: 80 * 1024 * 1024,
  audioSeconds: 300,
  textChars: 6000,
  titleChars: 80,
  versions: 20,
});

const rnd = () => Math.random().toString(36).slice(2, 8);
export const newId = (prefix) => `${prefix}${Date.now().toString(36)}${rnd()}`;
const clampNum = (n, lo, hi, fallback) =>
  Number.isFinite(Number(n)) ? Math.min(hi, Math.max(lo, Number(n))) : fallback;
const str = (v, max = 400) => String(v ?? "").slice(0, max);
const COLOR = /^#[0-9a-f]{3,8}$/i;
const color = (v, fallback) => (COLOR.test(String(v || "")) ? String(v) : fallback);

/** A language pair from template data, or plain text for both. */
export const pick = (v, lang = "en") =>
  v && typeof v === "object" ? (v[lang] ?? v.en ?? "") : (v ?? "");

/** A language pair that may be nested ({ en: { en, es } }) unwrapped to one string. */
export function deepPick(v, lang = "en") {
  let out = v;
  for (let i = 0; i < 4 && out && typeof out === "object" && !Array.isArray(out); i++) out = out[lang] ?? out.en;
  return typeof out === "string" ? out : "";
}

/** Plain text of a sanitized text element (for reading aloud, EPUB fallbacks, search and the teacher queue). */
export function plainText(htmlText) {
  return String(htmlText || "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|li|h[1-6])>/gi, "\n")
    .replace(/<li[^>]*>/gi, "• ")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** Text → the HTML subset the editor stores (paragraphs and line breaks), escaped. */
export function textToHtml(text) {
  const e = (s) =>
    s.replace(
      /[&<>"']/g,
      (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c],
    );
  return String(text || "")
    .split(/\n{2,}/)
    .map((p) => `<p>${e(p).replace(/\n/g, "<br>")}</p>`)
    .join("");
}

export function makeElement(type, props = {}) {
  const base = { id: newId("e"), type, x: 10, y: 10, w: 40, h: 20, rot: 0 };
  const defaults = {
    text: { html: "", role: "body", style: {} },
    image: { media: "", alt: "", fit: "cover", caption: "" },
    art: { art: "", alt: "", flip: false },
    shape: { shape: "rounded", fill: "#e7f4f2", stroke: "#075568", strokeW: 0.6 },
    bubble: { variant: "speech", html: "", tail: "bottom-left", fill: "#ffffff" },
    audio: { media: "", label: "", transcript: "", seconds: 0, w: 30, h: 9 },
    video: { media: "", embed: null, captions: "", poster: "", title: "" },
    drawing: { strokes: [], x: 0, y: 0, w: 100, h: 100 },
    panel: { stroke: "#1b1f3b", strokeW: 0.8, fill: "#ffffff", radius: 1.5 },
  }[type];
  return normalizeElement({ ...base, ...defaults, ...props, type });
}

export function makePage(props = {}) {
  return {
    id: newId("p"),
    bg: "#fffaf0",
    bgArt: "",
    narration: "",
    prompt: null,
    elements: [],
    choices: [],
    scene: { actions: [], ambience: "", parallax: false },
    ending: "",
    ...props,
  };
}

/** Trusted shape of one element; unknown fields dropped, numbers clamped. Used on load, import and paste. */
export function normalizeElement(raw = {}) {
  const type = ELEMENT_TYPES.includes(raw.type) ? raw.type : "text";
  const el = {
    id: /^[a-z0-9]{4,40}$/i.test(raw.id || "") ? raw.id : newId("e"),
    type,
    x: clampNum(raw.x, -50, 150, 10),
    y: clampNum(raw.y, -50, 150, 10),
    w: clampNum(raw.w, 1, 200, 40),
    h: clampNum(raw.h, 1, 200, 20),
    rot: clampNum(raw.rot, -360, 360, 0),
  };
  if (raw.locked) el.locked = true;
  if (raw.charId) el.charId = str(raw.charId, 40);
  if (raw.speaker) el.speaker = str(raw.speaker, 40);
  if (raw.expression) el.expression = str(raw.expression, 20);
  if (raw.hotspot) el.hotspot = normalizeHotspot(raw.hotspot);
  if (raw.anim && ["none", "fade", "rise", "slide"].includes(raw.anim)) el.anim = raw.anim;
  if (raw.ph)
    el.ph = { en: str(raw.ph.en ?? raw.ph, 300), es: str(raw.ph.es ?? raw.ph.en ?? raw.ph, 300) };
  if (type === "text" || type === "bubble") {
    el.html = str(raw.html, LIMITS.textChars * 2);
    const s = raw.style || {};
    el.style = {};
    if (FONTS[s.font]) el.style.font = s.font;
    if (s.size != null) el.style.size = clampNum(s.size, 1, 20, 3.2);
    if (s.color) el.style.color = color(s.color, "#1b1f3b");
    if (s.bg) el.style.bg = color(s.bg, "");
    if (["left", "center", "right", "justify", "start", "end"].includes(s.align))
      el.style.align = s.align;
    if (s.lineHeight != null) el.style.lineHeight = clampNum(s.lineHeight, 0.9, 2.5, 1.4);
    if (s.weight != null)
      el.style.weight = [400, 700].includes(Number(s.weight)) ? Number(s.weight) : 400;
    if (s.dir === "rtl" || s.dir === "ltr") el.style.dir = s.dir;
    if (s.lang) el.style.lang = /^[a-z]{2,3}(-[A-Za-z]{2,4})?$/.test(s.lang) ? s.lang : undefined;
    if (s.columns != null) el.style.columns = clampNum(s.columns, 1, 3, 1);
    if (type === "text") el.role = TEXT_ROLES.includes(raw.role) ? raw.role : "body";
    if (type === "bubble") {
      el.variant = BUBBLES.includes(raw.variant) ? raw.variant : "speech";
      el.tail = [
        "bottom-left",
        "bottom-right",
        "top-left",
        "top-right",
        "left",
        "right",
        "none",
      ].includes(raw.tail)
        ? raw.tail
        : "bottom-left";
      el.fill = color(raw.fill, "#ffffff");
    }
  }
  if (type === "image") {
    el.media = str(raw.media, 60);
    el.alt = str(raw.alt, 300);
    el.fit = raw.fit === "contain" ? "contain" : "cover";
    el.caption = str(raw.caption, 300);
    el.crop = raw.crop
      ? {
          x: clampNum(raw.crop.x, 0, 100, 50),
          y: clampNum(raw.crop.y, 0, 100, 50),
          zoom: clampNum(raw.crop.zoom, 1, 4, 1),
        }
      : null;
  }
  if (type === "art") {
    el.art = /^[a-z0-9-]{2,40}$/.test(raw.art || "") ? raw.art : "";
    el.alt = str(raw.alt, 300);
    el.flip = !!raw.flip;
  }
  if (type === "shape") {
    el.shape = SHAPES.includes(raw.shape) ? raw.shape : "rounded";
    el.fill = raw.fill === "none" ? "none" : color(raw.fill, "#e7f4f2");
    el.stroke = raw.stroke === "none" ? "none" : color(raw.stroke, "#075568");
    el.strokeW = clampNum(raw.strokeW, 0, 5, 0.6);
  }
  if (type === "panel") {
    el.stroke = color(raw.stroke, "#1b1f3b");
    el.strokeW = clampNum(raw.strokeW, 0, 5, 0.8);
    el.fill = color(raw.fill, "#ffffff");
    el.radius = clampNum(raw.radius, 0, 10, 1.5);
  }
  if (type === "audio") {
    el.media = str(raw.media, 60);
    el.label = str(raw.label, 120);
    el.transcript = str(raw.transcript, LIMITS.textChars);
    el.seconds = clampNum(raw.seconds, 0, 3600, 0);
  }
  if (type === "video") {
    el.media = str(raw.media, 60);
    el.captions = str(raw.captions, 60);
    el.poster = str(raw.poster, 60);
    el.title = str(raw.title, 200);
    el.embed =
      raw.embed && raw.embed.provider === "youtube" && /^[\w-]{11}$/.test(raw.embed.id || "")
        ? { provider: "youtube", id: raw.embed.id }
        : null;
  }
  if (type === "drawing") {
    el.strokes = (Array.isArray(raw.strokes) ? raw.strokes : []).slice(0, 400).map((s) => ({
      color: color(s.color, "#1b1f3b"),
      size: clampNum(s.size, 0.2, 12, 1),
      erase: !!s.erase,
      pts: (Array.isArray(s.pts) ? s.pts : [])
        .slice(0, 2000)
        .map((p) => [clampNum(p[0], -100, 1100, 0), clampNum(p[1], -100, 1100, 0)]),
    }));
  }
  return el;
}

export function normalizePage(raw = {}) {
  return {
    id: /^[a-z0-9]{4,40}$/i.test(raw.id || "") ? raw.id : newId("p"),
    bg: color(raw.bg, "#fffaf0"),
    bgArt: /^[a-z0-9-]{2,40}$/.test(raw.bgArt || "") ? raw.bgArt : "",
    narration: str(raw.narration, 60),
    prompt: raw.prompt
      ? {
          en: str(raw.prompt.en ?? raw.prompt, 600),
          es: str(raw.prompt.es ?? raw.prompt.en ?? raw.prompt, 600),
        }
      : null,
    frames: Array.isArray(raw.frames)
      ? raw.frames
          .slice(0, 8)
          .map((f) => ({ en: str(f.en ?? f, 200), es: str(f.es ?? f.en ?? f, 200) }))
      : [],
    elements: (Array.isArray(raw.elements) ? raw.elements : [])
      .slice(0, LIMITS.elementsPerPage)
      .map(normalizeElement),
    choices: (Array.isArray(raw.choices) ? raw.choices : []).slice(0, 6).map(normalizeChoice),
    scene: normalizeScene(raw.scene),
    ending: ["good", "neutral", "open"].includes(raw.ending) ? raw.ending : "",
  };
}

/** Migrate any saved version forward, then normalize. Never throws on old or partial data. */
export function migrate(raw) {
  if (!raw || typeof raw !== "object") throw new Error("not-a-book");
  const b = { ...raw };
  // v1 (pre-release drafts) stored `pages[].items` and a top-level `size`.
  if ((b.schema || 1) < 2) {
    b.format = b.format || b.size || "portrait";
    b.pages = (b.pages || []).map((p) => ({ ...p, elements: p.elements || p.items || [] }));
  }
  return normalizeBook(b);
}

export function normalizeBook(raw = {}) {
  const pages = (Array.isArray(raw.pages) ? raw.pages : [])
    .slice(0, LIMITS.pages)
    .map(normalizePage);
  return {
    schema: SCHEMA,
    id: /^[a-z0-9]{4,40}$/i.test(raw.id || "") ? raw.id : newId("b"),
    title: str(raw.title, LIMITS.titleChars) || "My book",
    format: FORMATS[raw.format] ? raw.format : "portrait",
    kind: KINDS.some((k) => k.id === raw.kind) ? raw.kind : "blank",
    templateId: str(raw.templateId, 60),
    purpose: str(raw.purpose, 200),
    author: str(raw.author, 60),
    lang: ["en", "es", "bi"].includes(raw.lang) ? raw.lang : "en",
    dir: raw.dir === "rtl" ? "rtl" : "ltr",
    status: STATUSES[raw.status] ? raw.status : "draft",
    createdAt: str(raw.createdAt, 40) || new Date().toISOString(),
    updatedAt: str(raw.updatedAt, 40) || new Date().toISOString(),
    rev: clampNum(raw.rev, 0, 1e9, 0),
    source:
      raw.source && typeof raw.source === "object"
        ? {
            kind: str(raw.source.kind, 30),
            id: str(raw.source.id, 80),
            label: str(raw.source.label, 120),
          }
        : null,
    remix: raw.remix === true,
    feedback: (Array.isArray(raw.feedback) ? raw.feedback : []).slice(0, 200).map((f) => ({
      id: str(f.id, 40) || newId("f"),
      pageId: str(f.pageId, 40),
      text: str(f.text, 600),
      by: str(f.by, 60),
      at: str(f.at, 40),
      done: !!f.done,
    })),
    submission:
      raw.submission && typeof raw.submission === "object"
        ? { workId: str(raw.submission.workId, 60), at: str(raw.submission.at, 40) }
        : null,
    review:
      raw.review && typeof raw.review === "object"
        ? {
            chips: (raw.review.chips || []).slice(0, 12).map((c) => str(c, 80)),
            comment: str(raw.review.comment, 400),
            at: str(raw.review.at, 40),
          }
        : null,
    mode: CREATION_MODES.some((m) => m.id === raw.mode) ? raw.mode : "story",
    gradeCluster: GRADE_CLUSTER_IDS.includes(raw.gradeCluster) ? raw.gradeCluster : "",
    objectives: (Array.isArray(raw.objectives) ? raw.objectives : []).slice(0, 6).map((o) => ({
      id: /^[a-z0-9]{4,40}$/i.test(o?.id || "") ? o.id : newId("ob"),
      text: str(o?.text, 300),
      keyUse: KEY_LANGUAGE_USES.includes(o?.keyUse) ? o.keyUse : "",
      standard: ["ELD-SI", "ELD-LA", "ELD-MA", "ELD-SC", "ELD-SS"].includes(o?.standard) ? o.standard : "",
    })),
    assignment:
      raw.assignment && typeof raw.assignment === "object"
        ? { id: str(raw.assignment.id, 40), title: str(raw.assignment.title, 120), task: str(raw.assignment.task, 400), classCode: str(raw.assignment.classCode, 12), role: raw.assignment.role === "student" ? "student" : "teacher" }
        : null,
    supports: (Array.isArray(raw.supports) ? raw.supports : []).slice(0, 400).map(normalizeSupport),
    plan: normalizePlan(raw.plan),
    planLog: (Array.isArray(raw.planLog) ? raw.planLog : []).slice(-50).map((l) => ({
      at: str(l?.at, 40),
      domain: str(l?.domain, 20),
      from: str(l?.from, 20),
      to: str(l?.to, 20),
      reason: str(l?.reason, 300),
      supportId: str(l?.supportId, 40),
    })),
    coach: { enabled: raw.coach?.enabled !== false },
    groups: (Array.isArray(raw.groups) ? raw.groups : []).slice(0, 12).map((g) => ({
      id: /^[a-z0-9]{4,40}$/i.test(g?.id || "") ? g.id : newId("g"),
      name: str(g?.name, 40) || "Group",
      plan: normalizePlan(g?.plan),
    })),
    characters: (Array.isArray(raw.characters) ? raw.characters : []).slice(0, 24).map(normalizeCharacter),
    story: normalizeStory(raw.story),
    work: raw.work ? normalizeWork(raw.work) : emptyWork(),
    publish: {
      // Student work is private by default. Nothing here ever publishes by itself.
      audience: ["private", "teacher", "class", "family", "public"].includes(raw.publish?.audience) ? raw.publish.audience : "private",
      approvedBy: str(raw.publish?.approvedBy, 60),
      approvedAt: str(raw.publish?.approvedAt, 40),
      includeSupports: raw.publish?.includeSupports === true,
      editions: (Array.isArray(raw.publish?.editions) ? raw.publish.editions : []).filter((e) => ["narrated", "multilingual", "interactive", "print"].includes(e)).slice(0, 4),
    },
    pages: pages.length
      ? pages
      : [coverPage(str(raw.title, LIMITS.titleChars) || "My book", raw.author)],
  };
}

export function coverPage(title, author = "") {
  return makePage({
    bg: "#1b2a5c",
    elements: [
      makeElement("shape", {
        shape: "rounded",
        x: 7,
        y: 7,
        w: 86,
        h: 86,
        fill: "none",
        stroke: "#f2b134",
        strokeW: 0.7,
      }),
      makeElement("text", {
        role: "title",
        x: 12,
        y: 30,
        w: 76,
        h: 26,
        html: textToHtml(title),
        style: { color: "#ffffff", align: "center", size: 8 },
      }),
      makeElement("text", {
        role: "body",
        x: 12,
        y: 70,
        w: 76,
        h: 10,
        html: author ? textToHtml(`by ${author}`) : "",
        ph: { en: "by (your name)", es: "por (tu nombre)" },
        style: { color: "#fff3c4", align: "center" },
      }),
    ],
  });
}

/** Starting pages for each kind of blank book: a cover plus a few useful layouts, all empty. */
export function starterPages(kind, title, author) {
  const cover = coverPage(title, author);
  const T = (props) => makeElement("text", props);
  if (kind === "comic") return [cover, comicPage("three"), comicPage("four")];
  if (kind === "bilingual")
    return [
      cover,
      makePage({
        elements: [
          makeElement("shape", {
            shape: "rounded",
            x: 6,
            y: 8,
            w: 42,
            h: 50,
            fill: "#e7f4f2",
            stroke: "none",
          }),
          T({
            x: 52,
            y: 10,
            w: 42,
            h: 36,
            ph: { en: "Write in English here.", es: "Escribe en inglés aquí." },
            style: { lang: "en" },
          }),
          T({
            x: 52,
            y: 52,
            w: 42,
            h: 36,
            ph: { en: "Write in your other language here.", es: "Escribe en tu otro idioma aquí." },
            style: { color: "#0b3d4a" },
          }),
        ],
      }),
    ];
  if (kind === "audio")
    return [
      cover,
      makePage({
        elements: [
          T({
            x: 8,
            y: 62,
            w: 84,
            h: 22,
            ph: {
              en: "Write what you will say on this page.",
              es: "Escribe lo que dirás en esta página.",
            },
          }),
          makeElement("audio", { x: 8, y: 86, w: 40, h: 9, label: "Narration" }),
        ],
      }),
    ];
  if (kind === "report" || kind === "informational")
    return [
      cover,
      makePage({
        elements: [
          T({ role: "heading", x: 8, y: 6, w: 84, h: 10, ph: { en: "Heading", es: "Encabezado" } }),
          T({
            x: 8,
            y: 18,
            w: 46,
            h: 70,
            ph: {
              en: "Explain your topic. Use facts and examples.",
              es: "Explica tu tema. Usa datos y ejemplos.",
            },
          }),
          makeElement("shape", {
            shape: "rounded",
            x: 58,
            y: 18,
            w: 34,
            h: 40,
            fill: "#e9edf8",
            stroke: "none",
          }),
          T({
            role: "caption",
            x: 58,
            y: 60,
            w: 34,
            h: 10,
            ph: {
              en: "Caption: what does the picture show?",
              es: "Pie de foto: ¿qué muestra la imagen?",
            },
          }),
        ],
      }),
    ];
  return [
    cover,
    makePage({
      elements: [
        T({
          x: 8,
          y: 64,
          w: 84,
          h: 28,
          ph: { en: "Start writing here.", es: "Empieza a escribir aquí." },
        }),
      ],
    }),
  ];
}

/** Comic page layouts made of panel frames. */
export function comicPage(layout = "three") {
  const P = (x, y, w, h) => makeElement("panel", { x, y, w, h });
  const sets = {
    one: [P(5, 5, 90, 90)],
    two: [P(5, 5, 90, 43), P(5, 52, 90, 43)],
    three: [P(5, 5, 90, 36), P(5, 45, 43, 50), P(52, 45, 43, 50)],
    four: [P(5, 5, 43, 43), P(52, 5, 43, 43), P(5, 52, 43, 43), P(52, 52, 43, 43)],
    six: [
      P(5, 5, 43, 28),
      P(52, 5, 43, 28),
      P(5, 36, 43, 28),
      P(52, 36, 43, 28),
      P(5, 67, 43, 28),
      P(52, 67, 43, 28),
    ],
  };
  return makePage({ bg: "#ffffff", elements: sets[layout] || sets.three });
}
export const COMIC_LAYOUTS = Object.freeze(["one", "two", "three", "four", "six"]);

/** A new book from a blank kind. */
export function newBook({
  kind = "blank",
  title = "My book",
  author = "",
  format,
  lang = "en",
  purpose = "",
} = {}) {
  const k = KINDS.find((x) => x.id === kind) || KINDS[0];
  const now = new Date().toISOString();
  return normalizeBook({
    id: newId("b"),
    kind: k.id,
    format: format || k.format,
    title,
    author,
    lang,
    purpose,
    createdAt: now,
    updatedAt: now,
    pages: starterPages(k.id, title, author),
  });
}

/** Expand template shorthand ({ t: "text", ... }) into elements; give every page and element a fresh id. */
export function bookFromTemplate(tpl, { title, author = "", lang = "en", band = "6-8" } = {}) {
  const now = new Date().toISOString();
  const expandEl = (e) => {
    const { t, text, ...rest } = e;
    const props = { ...rest };
    const lang2 = lang === "es" ? "es" : "en";
    if (text != null) props.html = textToHtml(deepPick(text, lang2));
    if (rest.alt && typeof rest.alt === "object") props.alt = deepPick(rest.alt, lang2);
    if (rest.ph && typeof rest.ph === "object") props.ph = { en: deepPick(rest.ph, "en"), es: deepPick(rest.ph, "es") };
    return makeElement(t || e.type || "text", props);
  };
  const pages = tpl.pages.map((p) => {
    const { elements = [], frames68, ...rest } = p;
    const frames = band === "6-8" && frames68?.length ? frames68 : rest.frames;
    return normalizePage({ ...rest, frames, elements: elements.map(expandEl) });
  });
  const name = title || pick(tpl.title, lang === "es" ? "es" : "en");
  // The cover's title box (role "title") always carries the book's title.
  const coverTitle = pages[0]?.elements.find((e) => e.type === "text" && e.role === "title");
  if (coverTitle) coverTitle.html = textToHtml(name);
  const byline = pages[0]?.elements.find(
    (e) => e.type === "text" && e.ph && /by \(|tu nombre/.test(e.ph.en),
  );
  if (byline && author) byline.html = textToHtml(`by ${author}`);
  return normalizeBook({
    id: newId("b"),
    kind: tpl.kind || "blank",
    format: tpl.format || "portrait",
    templateId: tpl.id,
    purpose: pick(tpl.purpose, "en"),
    title: name,
    author,
    lang,
    createdAt: now,
    updatedAt: now,
    pages,
  });
}

/** Deep copy with new ids (duplicate, remix, page duplicate). */
export function cloneWithNewIds(book, patch = {}) {
  const copy = JSON.parse(JSON.stringify(book));
  const pageMap = new Map();
  const elMap = new Map();
  copy.id = newId("b");
  copy.pages = copy.pages.map((p) => {
    const id = newId("p");
    pageMap.set(p.id, id);
    return {
      ...p,
      id,
      elements: p.elements.map((e) => {
        const eid = newId("e");
        elMap.set(e.id, eid);
        return { ...e, id: eid };
      }),
    };
  });
  // Every reference to a page or element follows it to the copy: choices, scene actions, supports, the story start,
  // and the learner's own work. A copy must behave exactly like the original.
  const P = (id) => pageMap.get(id) || id;
  const El = (id) => elMap.get(id) || id;
  for (const p of copy.pages) {
    for (const c of p.choices || []) {
      c.id = newId("c");
      c.to = P(c.to);
    }
    for (const a of p.scene?.actions || []) {
      a.id = newId("a");
      a.target = El(a.target);
      if (a.params?.bubbleId) a.params.bubbleId = El(a.params.bubbleId);
    }
  }
  if (copy.story?.startPageId) copy.story.startPageId = P(copy.story.startPageId);
  for (const s of copy.supports || []) {
    if (s.target?.pageId) s.target.pageId = P(s.target.pageId);
    if (s.target?.elementId) s.target.elementId = El(s.target.elementId);
  }
  const w = copy.work;
  if (w) {
    for (const r of w.revisions || []) {
      r.elementId = El(r.elementId);
      r.pageId = P(r.pageId);
    }
    for (const a of w.attempts || []) a.elementId = El(a.elementId);
    for (const c of w.coach || []) c.elementId = El(c.elementId);
    for (const r of w.records || []) if (r.target) r.target = El(r.target);
  }
  copy.feedback = [];
  copy.submission = null;
  copy.review = null;
  copy.status = "draft";
  copy.rev = 0;
  copy.createdAt = copy.updatedAt = new Date().toISOString();
  return normalizeBook({ ...copy, ...patch });
}

export function duplicatePage(page) {
  const copy = JSON.parse(JSON.stringify(page));
  const remap = new Map();
  const elements = page.elements.map((e) => {
    const id = newId("e");
    remap.set(e.id, id);
    return { ...JSON.parse(JSON.stringify(e)), id };
  });
  // Scene actions follow their elements to the copy; choices get fresh ids so two pages never share one.
  for (const a of copy.scene?.actions || []) {
    a.id = newId("a");
    if (remap.has(a.target)) a.target = remap.get(a.target);
    if (a.params?.bubbleId && remap.has(a.params.bubbleId)) a.params.bubbleId = remap.get(a.params.bubbleId);
  }
  for (const c of copy.choices || []) c.id = newId("c");
  return normalizePage({ ...copy, id: newId("p"), elements });
}

/** Every media id a book references (for export, duplication and cleanup). */
export function mediaIds(book) {
  const ids = new Set();
  for (const p of book.pages) {
    if (p.narration) ids.add(p.narration);
    for (const e of p.elements)
      for (const k of ["media", "captions", "poster"]) if (e[k]) ids.add(e[k]);
  }
  return [...ids];
}

/** The book in reading order as plain text (teacher queue, read-aloud, search). */
export function bookText(book, { pageLabel = (n) => `Page ${n}` } = {}) {
  return book.pages
    .map((p, i) => {
      const parts = readingOrder(p)
        .map((e) =>
          e.type === "text" || e.type === "bubble"
            ? plainText(e.html)
            : e.type === "image" || e.type === "art"
              ? e.alt
                ? `[${e.alt}]`
                : ""
              : e.type === "audio" && e.transcript
                ? `(${e.transcript})`
                : "",
        )
        .filter(Boolean);
      return parts.length ? `${pageLabel(i + 1)}\n${parts.join("\n")}` : "";
    })
    .filter(Boolean)
    .join("\n\n");
}

/** Reading order: top-to-bottom bands, then left-to-right (right-to-left books reverse each band). */
export function readingOrder(page, dir = "ltr") {
  const els = page.elements.filter(
    (e) => e.type !== "panel" && e.type !== "shape" && e.type !== "drawing",
  );
  return els.slice().sort((a, b) => {
    const band = Math.abs(a.y - b.y) < 6 ? 0 : a.y - b.y;
    if (band) return band;
    return dir === "rtl" ? b.x - a.x : a.x - b.x;
  });
}

/** Words on a page that the reader can read aloud. */
export function pageSpeech(page, dir = "ltr") {
  return readingOrder(page, dir)
    .filter((e) => e.type === "text" || e.type === "bubble")
    .map((e) => ({ id: e.id, text: plainText(e.html), lang: e.style?.lang || "" }))
    .filter((x) => x.text);
}

export function countWords(book) {
  return book.pages.reduce(
    (n, p) => n + pageSpeech(p).reduce((m, s) => m + s.text.split(/\s+/).filter(Boolean).length, 0),
    0,
  );
}

/** Basic self-check before marking finished: what a learner might still want to do. Never blocks. */
export function finishChecklist(book) {
  const empty = book.pages.filter(
    (p, i) =>
      i > 0 &&
      !p.elements.some((e) => (e.type === "text" || e.type === "bubble") && plainText(e.html)) &&
      !p.elements.some((e) => e.type === "image" || e.type === "art" || e.type === "drawing"),
  );
  const noAlt = book.pages.flatMap((p) =>
    p.elements.filter((e) => (e.type === "image" || e.type === "art") && !e.alt),
  );
  const noTranscript = book.pages.flatMap((p) =>
    p.elements.filter((e) => e.type === "audio" && e.media && !e.transcript),
  );
  const hasTitle = book.title && book.title !== "My book";
  const storyErrors = validateStory(book).filter((v) => v.level === "error");
  return [
    ...(storyErrors.length
      ? [
          {
            id: "story",
            ok: false,
            en: `${storyErrors.length} story problem(s) to fix before readers can play it (open the Story map).`,
            es: `${storyErrors.length} problema(s) del cuento por arreglar antes de jugarlo (abre el Mapa del cuento).`,
          },
        ]
      : []),
    {
      id: "title",
      ok: !!hasTitle,
      en: "My book has its own title.",
      es: "Mi libro tiene su propio título.",
    },
    {
      id: "pages",
      ok: empty.length === 0,
      en: empty.length
        ? `${empty.length} page(s) are still empty.`
        : "Every page has words or a picture.",
      es: empty.length
        ? `${empty.length} página(s) siguen vacías.`
        : "Cada página tiene palabras o una imagen.",
    },
    {
      id: "alt",
      ok: noAlt.length === 0,
      en: noAlt.length
        ? `${noAlt.length} picture(s) need a description for readers who cannot see them.`
        : "Every picture has a description.",
      es: noAlt.length
        ? `${noAlt.length} imagen(es) necesitan una descripción para quienes no pueden verlas.`
        : "Cada imagen tiene una descripción.",
    },
    {
      id: "transcript",
      ok: noTranscript.length === 0,
      en: noTranscript.length
        ? `${noTranscript.length} recording(s) need the words written out.`
        : "Every recording has its words written out.",
      es: noTranscript.length
        ? `${noTranscript.length} grabación(es) necesitan las palabras escritas.`
        : "Cada grabación tiene sus palabras escritas.",
    },
  ];
}
