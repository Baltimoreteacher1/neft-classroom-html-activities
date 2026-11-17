// Practice links: which Language Page activities fit a domain, a reported level and a grade band. Activities come
// from the site map (src/sitemap.js) and the Access Prep skill list (src/prep/registry.js), so a renamed or new
// page is picked up here without a second list. Links carry ?grades= so the student lands in their own band.
import { PREP_SKILL_LIST } from "../../access-practice-lab/src/prep/registry.js";
import { DEST_BY_ID } from "../../access-practice-lab/src/sitemap.js";
import { DOMAINS } from "./rules.js";

const BASE = "/access-practice-lab";

/** Grade (K, 1-12, null) to the lab's grade band. */
export function bandForGrade(grade) {
  if (grade === "K") return "K";
  const g = Number(grade);
  if (!Number.isFinite(g)) return "6-8";
  if (g <= 1) return "1";
  if (g <= 3) return "2-3";
  if (g <= 5) return "3-5";
  return "6-8";
}

/**
 * Activity ids per domain in two tiers: `build` for levels below 3 (models, pictures, frames) and `stretch`
 * for 3 and above (extended talk, evidence, argument). Ids are site-map ids, or `prep:<slug>` for Access Prep.
 */
const TIERS = {
  Listening: {
    build: ["listening", "voice", "prep:notes"],
    stretch: ["prep:notes", "conversation", "voice"],
  },
  Speaking: {
    build: ["speaking", "speak", "scenarios"],
    stretch: ["speak", "prep:extempore-speak", "prep:raters-eye", "arena"],
  },
  Reading: {
    build: ["reading-practice", "ladder", "science-of-reading", "reading-room"],
    stretch: ["mentor", "prep:text-structures", "prep:word-meanings", "reading-room"],
  },
  Writing: {
    build: ["writing", "sentences", "scaffold"],
    stretch: ["write", "evidence", "prep:data-talk", "prep:task-words", "book-studio"],
  },
  Vocabulary: { build: ["vocabulary", "flashcards"], stretch: ["wordlab", "prep:word-meanings"] },
};
const WHY = {
  listening: "Short listens with pictures; main idea and details.",
  voice: "Listen, then retell; sound pairs and shadowing.",
  conversation: "Follow a class discussion and choose how to respond.",
  speaking: "Plan, record and listen back.",
  speak: "Guided explanations with models.",
  scenarios: "Everyday situations to practice talking.",
  arena: "Give a claim, reasons and a rebuttal.",
  "reading-practice": "Short texts; find the answer in the text.",
  ladder: "Step-by-step reading with support that fades.",
  "science-of-reading": "Word study and short decodable reading.",
  "reading-room": "Stories at the student's band.",
  mentor: "Study how a model text is built.",
  writing: "Write sentences and check them against a list.",
  sentences: "Combine and expand sentences.",
  scaffold: "Sentence frames and word banks.",
  write: "Plan, draft and revise.",
  evidence: "Write with evidence from a text.",
  "book-studio": "Write and publish a book.",
  vocabulary: "Build academic words in context.",
  flashcards: "Word cards with partner talk.",
  wordlab: "Word families, meanings and use.",
};

/** The first sentence, capped at 90 characters, so activity notes stay one line. */
const firstSentence = (t) => {
  const one = String(t || "").split(/(?<=\.)\s/)[0];
  return one.length > 90 ? `${one.slice(0, 87).replace(/\s+\S*$/, "")}…` : one;
};

function siteActivity(id, band) {
  const d = DEST_BY_ID[id];
  if (!d) return null;
  if (d.bands && !d.bands.includes(band)) return null;
  const href = d.href.startsWith("/") ? d.href : `${BASE}/${d.href}`;
  return {
    id,
    title: Array.isArray(d.title) ? d.title[0] : d.title,
    why: WHY[id] || firstSentence(Array.isArray(d.text) ? d.text[0] : ""),
    href: `${href}${href.includes("?") ? "&" : "?"}grades=${band}`,
  };
}
function prepActivity(slug, band) {
  const p = PREP_SKILL_LIST.find((x) => x.slug === slug);
  if (!p) return null;
  if (p.bands && !p.bands.includes(band)) return null;
  if (["K", "1", "2-3"].includes(band)) return null; // Access Prep skill builders are written for grades 3-8
  return {
    id: `prep:${slug}`,
    title: p.title,
    why: Array.isArray(p.blurb) ? p.blurb[0] : "",
    href: `${BASE}/access-prep/${slug}?grades=${band}`,
  };
}

/** Up to `max` activities for a domain at a reported level and band. */
export function activitiesFor(domain, level, band, max = 3) {
  const t = TIERS[domain];
  if (!t) return [];
  const ids = level != null && level >= 3 ? t.stretch : t.build;
  const out = [];
  // K-3: the early learners' home first (audio-first activities for these grades).
  if (["K", "1", "2-3"].includes(band) && domain !== "Vocabulary")
    out.push({ id: "early", title: "K–3 practice and Story Time", why: "Audio-first activities made for young learners.", href: `${BASE}/early?grades=${band}` });
  for (const id of ids) {
    const a = id.startsWith("prep:") ? prepActivity(id.slice(5), band) : siteActivity(id, band);
    if (a && !out.some((x) => x.id === a.id)) out.push(a);
    if (out.length >= max) break;
  }
  return out;
}

/** A short practice plan for one record: the two lowest domains first, then vocabulary. */
export function practicePlan(record, { max = 3 } = {}) {
  if (!record) return [];
  const band = bandForGrade(record.grade);
  const ranked = DOMAINS.filter((d) => record.domains[d].level != null).sort(
    (a, b) => record.domains[a].level - record.domains[b].level,
  );
  const focus = ranked.slice(0, 2);
  return [
    ...focus.map((d) => ({
      domain: d,
      level: record.domains[d].level,
      activities: activitiesFor(d, record.domains[d].level, band, max),
    })),
    {
      domain: "Vocabulary",
      level: null,
      activities: activitiesFor("Vocabulary", record.composites.Overall.level, band, 2),
    },
  ].filter((x) => x.activities.length);
}
