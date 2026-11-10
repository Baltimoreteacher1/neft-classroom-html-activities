// Site Guide search: a small, pure search over the guide's own headings, explanations and activity names.
// No DOM and no lab imports besides the data files, so the unit test runs it in Node. Results carry the section, a short
// excerpt and one direct link (an activity route or a guide section). Spanish and English text are both indexed.
import { ROUTES } from "./data.js";
import {
  cardFor,
  EXTRA_ACTIVITIES,
  SECTIONS,
  SPEAKING_IDS,
  START_STEPS,
  WRITING_IDS,
} from "./site-guide-data.js";
import { AREAS, FAQ, OTHER_AREAS, ROUTINES, SHARING, WAYS } from "./site-guide-more.js";

const both = (p) => (p && typeof p === "object" ? `${p.en} ${p.es}` : String(p ?? ""));
const sectionRoute = (id) => `${ROUTES.siteGuide}/${id}`;

/** One entry per searchable thing. `route` is a lab route; `guide` is true when it points back into the guide. */
export function buildIndex() {
  const out = [];
  const add = (section, title, text, route, guide = false) =>
    out.push({ section, title: both(title), text: both(text), route, guide });
  for (const s of SECTIONS) add(s.id, s.title, "", sectionRoute(s.id), true);
  for (const st of START_STEPS) add("start", st.head, st.body, sectionRoute("start"), true);
  for (const id of [...SPEAKING_IDS, ...WRITING_IDS]) {
    const c = cardFor(id);
    const section = SPEAKING_IDS.includes(id) ? "speaking" : "writing";
    add(section, c.name, `${c.where} ${c.does} ${c.tryNow} ${both(c.text.support)}`, c.route);
  }
  for (const a of OTHER_AREAS)
    add("more", `${a.name}: ${a.start}`, `${a.helps} ${a.supports}`, a.route);
  for (const r of ROUTINES)
    add(
      "classroom",
      `${r.length}: ${r.name}`,
      `${r.directions} ${r.lookFor} ${r.followUp}`,
      sectionRoute("classroom"),
      true,
    );
  for (const s of SHARING) add("classroom", s.head, s.text, s.route);
  for (const w of WAYS) add("around", w.q, w.a, sectionRoute("around"), true);
  for (const a of AREAS) add("around", a.name, a.text, a.route);
  for (const f of FAQ) add("help", f.q, f.a, sectionRoute("help"), true);
  add(
    "home",
    "Practice at Home / Practicar en casa",
    "Practice Together family page Practicar juntos",
    ROUTES.together,
  );
  return out;
}

const fold = (s) =>
  String(s)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s]/g, " ");

export const tokens = (q) =>
  fold(q)
    .split(/\s+/)
    .filter((t) => t.length > 1);

function excerpt(text, token, width = 130) {
  const clean = text.replace(/\s+/g, " ").trim();
  if (!clean) return "";
  const at = fold(clean).indexOf(token);
  if (at < 0 || clean.length <= width)
    return clean.slice(0, width) + (clean.length > width ? "…" : "");
  const start = Math.max(0, at - 35);
  return `${start ? "…" : ""}${clean.slice(start, start + width)}…`;
}

/** Entries that contain every word of the query (title matches rank first). */
export function searchGuide(index, query, limit = 8) {
  const toks = tokens(query);
  if (!toks.length) return [];
  return index
    .map((e) => {
      const title = fold(e.title);
      const body = fold(`${e.title} ${e.text}`);
      if (!toks.every((t) => body.includes(t))) return null;
      const score = toks.reduce((n, t) => n + (title.includes(t) ? 3 : 1), 0);
      return { ...e, score, excerpt: excerpt(e.text || e.title, toks[0]) };
    })
    .filter(Boolean)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

/** Every lab route this guide can link to (the link test and the e2e test open each one). */
export function allGuideRoutes() {
  const set = new Set(buildIndex().map((e) => e.route));
  for (const a of Object.values(EXTRA_ACTIVITIES)) set.add(a.route);
  for (const g of [...WAYS, ...FAQ]) for (const l of g.links || []) set.add(l.route);
  for (const a of AREAS) if (a.second) set.add(a.second.route);
  return [...set];
}
