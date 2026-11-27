// Small helpers shared by the front-layer page renderers.
import crypto from "node:crypto";
import fs from "node:fs";

export const SITE = {
  name: "The Language Page",
  host: "thelanguagepage.com",
  origin: "https://thelanguagepage.com",
  promise: "English for school, in your language",
  ogImage: "/access-practice-lab/pictures/og-the-language-page.png",
};

const ESC = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
export const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ESC[c]);

/** `html` tagged template: interpolations are escaped unless wrapped with raw(). Arrays are joined. */
export class Raw {
  constructor(s) {
    this.s = s;
  }
  toString() {
    return this.s;
  }
}
export const raw = (s) => new Raw(String(s));
const part = (v) => {
  if (v == null || v === false) return "";
  if (Array.isArray(v)) return v.map(part).join("");
  if (v instanceof Raw) return v.s;
  return esc(v);
};
export function html(strings, ...values) {
  let out = strings[0];
  values.forEach((v, i) => {
    out += part(v) + strings[i + 1];
  });
  return raw(out);
}

export const slugify = (s) =>
  String(s)
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

export const words = (s) => String(s).trim().split(/\s+/).filter(Boolean).length;

export function hashFile(path) {
  return crypto.createHash("sha256").update(fs.readFileSync(path)).digest("hex").slice(0, 8);
}

/** JSON for a <script type="application/json"> block: safe against </script> and U+2028. */
export const jsonBlock = (data) =>
  JSON.stringify(data)
    .replace(/</g, "\\u003c")
    .replace(new RegExp(String.fromCharCode(0x2028), "g"), "\\u2028")
    .replace(new RegExp(String.fromCharCode(0x2029), "g"), "\\u2029");

export const CLUSTERS = [
  {
    slug: "grades-2-3",
    label: "Grades 2–3",
    short: "2–3",
    note: "Written for grade 3. Grade 3 is in the WIDA ACCESS 2–3 cluster.",
  },
  { slug: "grades-4-5", label: "Grades 4–5", short: "4–5", note: "The WIDA ACCESS 4–5 cluster." },
  { slug: "grades-6-8", label: "Grades 6–8", short: "6–8", note: "The WIDA ACCESS 6–8 cluster." },
];
export const DOMAINS = [
  {
    slug: "listening",
    label: "Listening",
    icon: "ear",
    verb: "Listen to a teacher or classmates, then answer questions.",
  },
  {
    slug: "reading",
    label: "Reading",
    icon: "book",
    verb: "Read a short text, then answer questions.",
  },
  {
    slug: "speaking",
    label: "Speaking",
    icon: "mouth",
    verb: "Look, think, and record your answer. It stays on your device.",
  },
  {
    slug: "writing",
    label: "Writing",
    icon: "pencil",
    verb: "Plan, write and check your writing with sentence starters.",
  },
];
export const ELD = {
  "ELD-SI": "Language for Social and Instructional Purposes",
  "ELD-LA": "Language for Language Arts",
  "ELD-MA": "Language for Mathematics",
  "ELD-SC": "Language for Science",
  "ELD-SS": "Language for Social Studies",
};
export const KLUS = ["Narrate", "Inform", "Explain", "Argue"];
export const PL_LABEL = { "1-2": "Levels 1–2", "3-4": "Levels 3–4", 5: "Level 5" };
export const LEVEL_NAMES = [
  "",
  "Entering",
  "Emerging",
  "Developing",
  "Expanding",
  "Bridging",
  "Reaching",
];
