// The share-link contract for the Family Language Story. A link is the page address plus a URL FRAGMENT:
//   /access-practice-lab/family/story#1&n=Mia&l=bi&d=LS&w=3&c=lk&s=l1.sn.r1&q=…&m=w&t=…&x=en&k=261116
// The fragment is never sent to a server, so a link carries the story and nothing else: no roster, no class code, no
// student id, no alias. Only the keys listed in KEYS are ever written, each re-validated by `normalizeStory`.
// The short form (for a printed QR code, which holds about 100 bytes) drops the free-text keys q, m, t and x.
import { BASE } from "../../util.js";
import { MAX_BYTES } from "../../../../shared/qr/qr-code.mjs";
import { normalizeStory } from "./model.js";

export const VERSION = "1";
export const KEYS = Object.freeze(["n", "l", "d", "w", "c", "s", "q", "m", "t", "x", "k"]);
const FREE_TEXT = new Set(["q", "m", "t", "x"]);
export const STORY_PATH = `${BASE}/family/story`;
const MAX_FRAGMENT = 1500;

/** The fragment text (without "#") for an approved story. `short` leaves out the quote and the note. */
export function encodeStory(input, { short = false } = {}) {
  const story = normalizeStory(input);
  const params = new URLSearchParams();
  const put = (key, value) => {
    if (value !== "" && value != null && !(short && FREE_TEXT.has(key))) params.set(key, value);
  };
  put("n", story.n);
  if (story.l !== "bi") put("l", story.l);
  put("d", story.d.join(""));
  if (story.w) put("w", String(story.w));
  if (story.c !== "ef") put("c", story.c);
  put("s", story.s.join("."));
  put("q", story.q);
  if (story.q && story.m !== "w") put("m", story.m);
  put("t", story.t);
  if (story.t && story.x !== "en") put("x", story.x);
  put("k", story.k);
  return `${VERSION}&${params.toString()}`;
}

/** A story from a fragment (with or without "#"), or null when it is empty, another version or too long. */
export function decodeStory(fragment) {
  const text = String(fragment || "").replace(/^#/, "");
  if (!text || text.length > MAX_FRAGMENT) return null;
  const [version, ...rest] = text.split("&");
  if (version !== VERSION) return null;
  const params = new URLSearchParams(rest.join("&"));
  const raw = {};
  for (const key of KEYS) if (params.has(key)) raw[key] = params.get(key);
  return normalizeStory(raw);
}

/** The full address a teacher shares. `origin` is the site origin (`location.origin`). */
export const storyUrl = (input, { origin = "", short = false } = {}) =>
  `${origin}${STORY_PATH}#${encodeStory(input, { short })}`;

/** True when the address fits a printed QR code. */
export const fitsQr = (url) => new TextEncoder().encode(url).length <= MAX_BYTES;
