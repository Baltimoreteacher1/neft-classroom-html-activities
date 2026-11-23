// Resource Studio state: the teacher's choices, how they travel in the address, and how links from other views resolve.
// Pure functions only (no DOM), so the routing rules are unit-tested in Node.
import { GRADES, SUBJECT_IDS, TIER_IDS } from "../../data/taxonomy.js";
import { FAMILIES, templateById } from "../../print/templates.js";

export const VIS_CHOICES = [
  { v: "full", label: "Pictures with every item" },
  { v: "key", label: "Pictures on key items only" },
  { v: "none", label: "No pictures" },
];
export const LANG_CHOICES = [
  { v: "en", label: "English" },
  { v: "bilingual", label: "English and Spanish (verified words only)" },
];
export const SIZE_CHOICES = [
  { v: "letter", label: "US Letter" },
  { v: "a4", label: "A4" },
];
export const SOURCES = [
  { v: "lesson", label: "A lesson" },
  { v: "vocab", label: "A vocabulary set" },
  { v: "topic", label: "My own title" },
];

/** Type names other views link with, mapped to a template or a family of templates. */
const TYPE_ALIASES = {
  organizer: { family: "Graphic organizers" },
  organizers: { family: "Graphic organizers" },
  "answer-key": { templateId: "task-cards" },
  "small-group": { templateId: "discussion-cards" },
  "vocab-mat": { templateId: "vocab-mat" },
};
/** Item kinds `renderActionBar` sends as `type=` together with the item's own id. */
const ITEM_KINDS = new Set(["lesson", "vocab", "activity", "wida", "project", "unit"]);

/** Resolve `?type=` to { templateId, family, itemKind, remix }. Unknown values resolve to nothing, never to an error. */
export function resolveType(type) {
  const t = String(type || "").trim();
  if (!t) return { templateId: null, family: null, itemKind: null, remix: null };
  if (templateById(t))
    return { templateId: t, family: templateById(t).family, itemKind: null, remix: null };
  if (t.startsWith("remix-"))
    return { templateId: null, family: null, itemKind: null, remix: t.slice(6) };
  if (TYPE_ALIASES[t]) {
    const a = TYPE_ALIASES[t];
    return {
      templateId: a.templateId || null,
      family: a.family || (a.templateId ? templateById(a.templateId).family : null),
      itemKind: null,
      remix: null,
    };
  }
  if (ITEM_KINDS.has(t)) return { templateId: null, family: null, itemKind: t, remix: null };
  return { templateId: null, family: null, itemKind: null, remix: null };
}

export const defaultState = () => ({
  templateId: null,
  family: "",
  source: "lesson",
  lessonId: "",
  vocabId: "",
  entryIds: null,
  grade: "",
  subject: "",
  tiers: ["dev"],
  vis: "full",
  lang: "en",
  title: "",
  cover: true,
  size: "letter",
  orientation: "auto",
  options: {},
  draft: "",
});

const csv = (s) =>
  String(s || "")
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);
const pick = (v, list, fallback) => (list.includes(v) ? v : fallback);

/** Build the starting state from the route params and the teacher's saved grade and subject. */
export function stateFromParams(params = {}, prefs = {}, classTier = null) {
  const st = defaultState();
  const r = resolveType(params.type);
  st.templateId = r.templateId;
  st.family = r.family || "";
  if (r.remix) st.draft = r.remix;
  if (params.draft === "remix") st.draft = r.remix || "remix";
  const id = params.lesson || "";
  if (params.vocab) {
    st.source = "vocab";
    st.vocabId = params.vocab;
  } else if (id) {
    // `type=vocab&lesson=<id>` is how the action bar names a vocabulary set.
    if (r.itemKind === "vocab") {
      st.source = "vocab";
      st.vocabId = id;
    } else st.lessonId = id;
  }
  if (params.source && SOURCES.some((s) => s.v === params.source)) st.source = params.source;
  st.grade = pick(String(params.grade || prefs.grade || "").toUpperCase(), GRADES, "");
  st.subject = pick(params.subject || prefs.subject || "", SUBJECT_IDS, "");
  const tiers = csv(params.tiers).filter((t) => TIER_IDS.includes(t));
  st.tiers = tiers.length
    ? tiers
    : classTier && TIER_IDS.includes(classTier)
      ? [classTier]
      : ["dev"];
  st.vis = pick(
    params.vis,
    VIS_CHOICES.map((x) => x.v),
    "full",
  );
  st.lang = pick(
    params.lang,
    LANG_CHOICES.map((x) => x.v),
    "en",
  );
  st.size = pick(
    params.size,
    SIZE_CHOICES.map((x) => x.v),
    "letter",
  );
  st.orientation = pick(params.orient, ["auto", "portrait", "landscape"], "auto");
  st.cover = params.cover !== "0";
  st.title = String(params.title || "").slice(0, 120);
  return st;
}

/** The query that reopens the same setup. Only values that differ from the defaults are written. */
export function stateToQuery(st) {
  const d = defaultState();
  const q = {};
  if (st.templateId) q.type = st.templateId;
  if (st.source === "lesson" && st.lessonId) q.lesson = st.lessonId;
  if (st.source === "vocab" && st.vocabId) q.vocab = st.vocabId;
  if (st.source === "topic") q.source = "topic";
  if (st.grade) q.grade = st.grade;
  if (st.subject) q.subject = st.subject;
  if (st.tiers.join() !== d.tiers.join()) q.tiers = st.tiers.join(",");
  for (const [k, p] of [
    ["vis", "vis"],
    ["lang", "lang"],
    ["size", "size"],
    ["orientation", "orient"],
  ])
    if (st[k] !== d[k]) q[p] = st[k];
  if (!st.cover) q.cover = "0";
  if (st.title) q.title = st.title;
  return q;
}

/** Input for buildDocument from the state and the loaded source data. */
export function buildInput(st, data = {}, tpl = null) {
  const orientation = st.orientation !== "auto" ? st.orientation : tpl?.orientation || "portrait";
  return {
    grade: st.grade || data.lesson?.grade || data.vocab?.grade,
    subject: st.subject || data.lesson?.subject || data.vocab?.subject || undefined,
    lesson: data.lesson || null,
    vocab: data.vocab || null,
    entryIds: st.entryIds || undefined,
    tiers: st.tiers,
    visual: st.vis,
    lang: st.lang,
    title: st.title || undefined,
    cover: st.cover,
    format: { size: st.size, orientation },
    options: st.options,
  };
}

export const familyList = () => FAMILIES;
