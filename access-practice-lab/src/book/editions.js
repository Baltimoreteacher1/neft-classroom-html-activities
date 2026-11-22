// Support editions of a Book Studio book. An edition is a copy of the book made for one support level: it keeps the
// story exactly as written and carries only the language supports that level would be given, each marked as part of
// the published copy so it also reaches a student who opens the book from a link (a reader never has a profile).
//
// The promise is that an edition changes language access, not the story or its thinking demand. So the story text of
// the original and of every edition is fingerprinted, and `compareEditions` says whether they still match.
// A support level is a teacher's grouping, never an official proficiency level (src/book/lang/profiles.js).
import { INTENSITY_RANK, intensityFor, level, planForLevel } from "./lang/profiles.js";
import { normalizeSupport } from "./lang/supports.js";
import { cloneWithNewIds, normalizeBook, pageSpeech } from "./model.js";

export const EDITION_KIND = "edition";

export const isEdition = (book) => book?.source?.kind === EDITION_KIND;
/** The support level an edition was made for (its plan's profile), or 0. */
export const editionLevel = (book) => (isEdition(book) ? Number(book.plan?.profile) || 0 : 0);

const fnv = (text) => {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(16).padStart(8, "0");
};
const tidy = (text) =>
  String(text ?? "")
    .replace(/\s+/g, " ")
    .trim();

/**
 * What the story says, in reading order: each page's words (text and speech bubbles) and the wording of its
 * choices (their label and the text shown while locked). Ids, styling, supports and pictures are not part of it, so a copy with new ids has the same fingerprint.
 */
export function storyFingerprint(book) {
  const pages = (book?.pages || []).map((p) =>
    [
      pageSpeech(p)
        .map((s) => tidy(s.text))
        .join("␞"),
      (p.choices || []).map((c) => `${tidy(c.label)}␜${tidy(c.lockedText)}`).join("␞"),
    ].join("␟"),
  );
  const words = (book?.pages || []).reduce(
    (n, p) =>
      n + pageSpeech(p).reduce((m, s) => m + tidy(s.text).split(" ").filter(Boolean).length, 0),
    0,
  );
  return { hash: fnv(pages.join("␝")), pages: pages.length, words };
}
export const sameStory = (a, b) => storyFingerprint(a).hash === storyFingerprint(b).hash;

/**
 * Which supports a plan assigns or offers: those for this level (or any level), never authoring-only notes, and
 * those light enough for the plan's intensity in their domain. A required support is always kept. A "help on demand"
 * plan keeps every support for the level, because each is available when asked. This mirrors resolveSupports.
 */
export function supportsForPlan(supports, plan) {
  return supports.filter((s) => {
    if (s.authoringOnly) return false;
    if (s.levels.length && !s.levels.includes(plan.profile)) return false;
    if (s.required) return true;
    const want = INTENSITY_RANK[intensityFor(plan, s.domain)];
    if (want === 0) return plan.intensity === "help";
    return INTENSITY_RANK[s.intensity] <= want;
  });
}

/**
 * Make an edition of `src` for support level 1-6. Returns the unsaved book and what was kept or left out.
 * @param {object} src a normalized book
 * @param {{ level: number, label?: string }} options
 */
export function createEdition(src, { level: n, label = "" }) {
  const info = level(n);
  if (!info) throw new Error("Support level must be 1 to 6.");
  const name = tidy(label) || info.en;
  const plan = {
    ...planForLevel(info.n),
    reason: `Support edition: ${info.en}`,
    auto: false,
    at: new Date().toISOString(),
  };
  const copy = cloneWithNewIds(src, {
    title: `${src.title} · ${name}`.slice(0, 80),
    source: { kind: EDITION_KIND, id: src.id, label: src.title },
  });
  const all = (copy.supports || []).map(normalizeSupport);
  const kept = supportsForPlan(all, plan).map((s) => ({ ...s, inPublished: true }));
  const edition = normalizeBook({ ...copy, plan, supports: kept });
  return { book: edition, kept: kept.length, left: all.length - kept.length, level: info.n };
}

/** A support described without ids, so the same support in two copies of a book matches. */
function signature(book, s) {
  const t = s.target || {};
  const pageIndex = t.pageId ? book.pages.findIndex((p) => p.id === t.pageId) : -1;
  const elementIndex =
    t.elementId && pageIndex >= 0
      ? book.pages[pageIndex].elements.findIndex((e) => e.id === t.elementId)
      : -1;
  return [s.type, s.kind, s.title, t.scope, pageIndex, elementIndex, t.text || ""].join("|");
}
const describe = (s) => ({
  type: s.type,
  kind: s.kind,
  title: s.title,
  scope: s.target?.scope || "book",
});

/**
 * Compare two editions (or an edition and its original).
 * @returns {{ sameStory: boolean, a: {supports:number,words:number}, b: {supports:number,words:number},
 *   shared: object[], onlyA: object[], onlyB: object[] }}
 */
export function compareEditions(a, b) {
  const sa = new Map((a.supports || []).map((s) => [signature(a, s), s]));
  const sb = new Map((b.supports || []).map((s) => [signature(b, s), s]));
  const shared = [];
  const onlyA = [];
  const onlyB = [];
  for (const [sig, s] of sa) (sb.has(sig) ? shared : onlyA).push(describe(s));
  for (const [sig, s] of sb) if (!sa.has(sig)) onlyB.push(describe(s));
  const fa = storyFingerprint(a);
  const fb = storyFingerprint(b);
  return {
    sameStory: fa.hash === fb.hash,
    a: { supports: sa.size, words: fa.words },
    b: { supports: sb.size, words: fb.words },
    shared,
    onlyA,
    onlyB,
  };
}
