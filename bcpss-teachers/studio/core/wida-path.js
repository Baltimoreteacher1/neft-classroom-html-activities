// Personalized WIDA pathway generator and class-needs summary. PURE: no DOM, no storage, no randomness.
// Same inputs always give the same pathway (candidates are ranked, then tie-broken by id).
//
// Rules that the tests pin:
//  1. A full pathway always carries all four domains (Listening, Speaking, Reading, Writing). A missing resource becomes an
//     explicit gap step, never a silently dropped domain.
//  2. Content demand is never lowered: a collection is eligible only when it is in the class's grade band and at or above the
//     class's grade. Tiers and evidence change language SUPPORTS and the practice MODE, never which content is chosen.
//  3. Evidence adapts a domain only when that domain has MIN_ATTEMPTS (3) or more attempts; otherwise the profile decides.
import {
  BANDS,
  DOMAINS,
  GRADES,
  KLUS,
  TIERS,
  TIER_IDS,
  bandOf,
  widaClusterOf,
} from "../data/taxonomy.js";
import { KLU_PURPOSE } from "./wida-frames.js";

export const MIN_ATTEMPTS = 3;
export const PATH_LENGTHS = [5, 6, 7];
export const RIGOR_NOTE =
  "Same grade-level content at every support level. Supports change language access, not the task.";

const tierLabel = (t) => TIERS.find((x) => x.id === t)?.short || t;
export const gradeNum = (g) => (String(g) === "K" ? 0 : Number(g));

/** Largest proficiency count wins; ties go to the lower tier (more supports). Null when no counts. */
export function dominantTier(proficiency = {}) {
  let best = null;
  let max = 0;
  for (const t of TIER_IDS) {
    const n = Number(proficiency[t]) || 0;
    if (n > max) {
      max = n;
      best = t;
    }
  }
  return best;
}

/** Coerce a classes.js profile (or an ad hoc one) to what the generator needs. Never throws. */
export function normalizeProfile(raw = {}) {
  const grade = GRADES.includes(String(raw.grade)) ? String(raw.grade) : "";
  const fallback = dominantTier(raw.proficiency) || "dev";
  const tiers = {};
  const mixed = {};
  for (const d of DOMAINS) {
    const t = raw.domainTiers?.[d] ?? raw.tiers?.[d];
    mixed[d] = !TIER_IDS.includes(t);
    tiers[d] = TIER_IDS.includes(t) ? t : fallback;
  }
  const klus = KLUS.filter((k) => (raw.klus || []).includes(k));
  return {
    id: raw.id || "",
    name: raw.nickname || raw.name || "",
    grade,
    band: grade ? bandOf(grade) : "",
    cluster: grade ? widaClusterOf(grade) : "",
    subject: raw.subject || "",
    lessonId: raw.lessonId || "",
    lessonTitle: raw.lessonTitle || "",
    vocabId: raw.vocabId || "",
    tiers,
    mixed,
    klus,
    priorities: DOMAINS.filter((d) => (raw.domainPriorities || []).includes(d)),
  };
}

// ---------- evidence ----------

const tagValue = (tags = [], key) => {
  const t = tags.find((x) => x.startsWith(`${key}:`));
  return t ? t.slice(key.length + 1) : null;
};

/** Domain of an attempt: from item tags (`domain:Listening`), else from a caller-supplied aid lookup. */
export function attemptDomain(att, domainOf) {
  for (const it of att.items || []) {
    const d = tagValue(it.tags, "domain");
    if (DOMAINS.includes(d)) return d;
  }
  const d = domainOf?.(att.aid);
  return DOMAINS.includes(d) ? d : null;
}

/** Per-domain evidence totals from class evidence attempts (core/evidence.js classEvidence). Only wida-studio attempts count. */
export function summarizeEvidence(attempts = [], { domainOf } = {}) {
  const out = Object.fromEntries(
    DOMAINS.map((d) => [
      d,
      { attempts: 0, items: 0, scored: 0, correct: 0, hints: 0, independent: 0, firstTry: 0 },
    ]),
  );
  let total = 0;
  for (const att of attempts) {
    if (att?.eng !== "wida-studio") continue;
    const d = attemptDomain(att, domainOf);
    if (!d) continue;
    total += 1;
    const s = out[d];
    s.attempts += 1;
    for (const it of att.items || []) {
      s.items += 1;
      s.hints += Number(it.hints) || 0;
      if (tagValue(it.tags, "mode") === "independent") s.independent += 1;
      if (!(it.tags || []).includes("unscored")) {
        s.scored += 1;
        if (it.ok) s.correct += 1;
        if (it.ok && it.tries <= 1) s.firstTry += 1;
      }
    }
  }
  return { total, domains: out };
}

/** support | steady | ready | unknown for one domain's totals. Needs MIN_ATTEMPTS attempts in that domain. */
export function signalFor(s) {
  if (!s || s.attempts < MIN_ATTEMPTS || s.items === 0) return "unknown";
  const hintRate = s.hints / s.items;
  if (s.scored > 0) {
    const okRate = s.correct / s.scored;
    if (okRate < 0.6 || hintRate >= 1.5) return "support";
    if (okRate >= 0.85 && hintRate <= 0.5) return "ready";
    return "steady";
  }
  if (hintRate >= 1) return "support";
  if (hintRate <= 0.25 && s.independent / s.items >= 0.5) return "ready";
  return "steady";
}

const pct = (a, b) => Math.round((100 * a) / Math.max(1, b));

/** Plain-language statement that always shows the count behind it. */
export function evidenceStatement(domain, s) {
  const base = `${s.attempts} ${s.attempts === 1 ? "attempt" : "attempts"} in ${domain}`;
  if (s.attempts < MIN_ATTEMPTS)
    return `${base}. Not enough practice evidence yet (${MIN_ATTEMPTS} needed).`;
  const parts = [];
  if (s.scored > 0)
    parts.push(
      `${s.correct} of ${s.scored} scored items answered correctly (${pct(s.correct, s.scored)}%)`,
    );
  parts.push(`${s.hints} hints or support requests across ${s.items} items`);
  if (s.independent) parts.push(`${s.independent} items done in independent practice`);
  return `${base}: ${parts.join("; ")}.`;
}

// ---------- collection choice ----------

const asArr = (v) => (Array.isArray(v) ? v : []);

/** Eligible = same band and at or above the class grade. This is the "never lowers content demand" rule. */
export function eligible(c, profile) {
  if (!profile.grade || !c) return false;
  if (c.band !== profile.band) return false;
  return gradeNum(c.grade) >= gradeNum(profile.grade);
}

function score(c, profile, domain, opts) {
  let s = 0;
  if (String(c.grade) === profile.grade) s += 4;
  else s -= gradeNum(c.grade) - gradeNum(profile.grade);
  if (opts.preferOtherSubject) s += c.subject !== profile.subject ? 3 : 0;
  else s += c.subject === profile.subject ? 3 : 0;
  if (profile.lessonId && c.lessonId === profile.lessonId) s += 6;
  const klus = asArr(c.klus);
  profile.klus.forEach((k, i) => {
    if (klus.includes(k)) s += Math.max(1, 3 - i);
  });
  if (profile.priorities.includes(domain)) s += 1;
  return s;
}

/** Ranked eligible collections for a domain. Deterministic: score desc, then id asc. */
export function rankCollections(widaIndex = [], profile, domain, opts = {}) {
  const skip = new Set(opts.exclude || []);
  return widaIndex
    .filter((c) => c.domain === domain && eligible(c, profile) && !skip.has(c.id))
    .map((c) => ({ c, s: score(c, profile, domain, opts) }))
    .sort((a, b) => b.s - a.s || (a.c.id < b.c.id ? -1 : 1))
    .map((x) => x.c);
}

function pickVocab(index, profile) {
  const list = asArr(index.vocab).filter((v) => !v.band || v.band === profile.band);
  const ranked = list
    .map((v) => {
      let s = 0;
      if (profile.vocabId && v.id === profile.vocabId) s += 10;
      if (profile.lessonId && v.lessonId === profile.lessonId) s += 6;
      if (v.subject === profile.subject) s += 3;
      if (String(v.grade) === profile.grade) s += 2;
      return { v, s };
    })
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s || (a.v.id < b.v.id ? -1 : 1));
  return ranked[0]?.v || null;
}

function pickTalkActivity(index, profile) {
  const list = asArr(index.activities).filter(
    (a) =>
      a.engine === "conversation-studio" &&
      (!a.band || a.band === profile.band) &&
      (!a.grade || gradeNum(a.grade) >= gradeNum(profile.grade)),
  );
  const ranked = list
    .map((a) => ({
      a,
      s:
        (a.lessonId && a.lessonId === profile.lessonId ? 6 : 0) +
        (a.subject === profile.subject ? 3 : 0),
    }))
    .sort((x, y) => y.s - x.s || (x.a.id < y.a.id ? -1 : 1));
  return ranked[0]?.a || null;
}

// ---------- tiers and adaptation ----------

/** One tier toward more support ("support" signal) or less ("ready"). Supports only; content is untouched. */
export function shiftTier(tier, signal) {
  const i = TIER_IDS.indexOf(tier);
  if (signal === "support") return TIER_IDS[Math.max(0, i - 1)];
  if (signal === "ready") return TIER_IDS[Math.min(TIER_IDS.length - 1, i + 1)];
  return tier;
}

export function domainPlan(profile, evidenceSummary) {
  const plan = {};
  for (const d of DOMAINS) {
    const s = evidenceSummary?.domains?.[d];
    const signal = evidenceSummary ? signalFor(s) : "unknown";
    const base = profile.tiers[d];
    plan[d] = {
      domain: d,
      baseTier: base,
      tier: signal === "unknown" ? base : shiftTier(base, signal),
      signal,
      attempts: s?.attempts || 0,
      adapted: signal === "support" || signal === "ready",
      statement: s ? evidenceStatement(d, s) : evidenceStatement(d, { attempts: 0 }),
    };
  }
  return plan;
}

// ---------- the pathway ----------

const STEP_ORDER = {
  5: ["vocab", "listen", "talk", "guided-write", "transfer"],
  6: ["vocab", "listen", "talk", "guided-write", "independent", "transfer"],
  7: ["vocab", "listen", "talk", "guided-write", "independent", "revise", "transfer"],
};

const kluFor = (profile, collection) => profile.klus[0] || asArr(collection?.klus)[0] || "Explain";

const EXTRA = {
  support: {
    Listening: "Show the visual and pre-teach three key words before the audio plays.",
    Speaking:
      "Add one more round of partner rehearsal with the frames before anyone speaks to the class.",
    Reading: "Read the first paragraph together and pre-teach the starred words.",
    Writing: "Co-write the first sentence, then release students to finish with the frames.",
  },
  ready: {
    Listening: "Hide captions and supports until a student asks for them.",
    Speaking: "Ask students to extend each answer with a reason before they check the model.",
    Reading: "Have students find the evidence themselves before looking at word help.",
    Writing: "Let students draft before opening frames, then compare with the model.",
  },
};

function resourceFor(c, { tier, mode, focus } = {}) {
  return {
    kind: "wida",
    id: c.id,
    title: c.title,
    domain: c.domain,
    grade: c.grade,
    subject: c.subject,
    tier,
    mode,
    focus: focus || null,
  };
}

/**
 * buildPathway({ profile, index, evidence, length }) -> { steps, basis, adaptedDomains, domainsCovered, gaps, notes, rigor }
 *  profile  normalized by normalizeProfile
 *  index    { wida:[descriptor], vocab:[...], activities:[...] }  (see views/wida/data.js for how the manifest becomes this)
 *  evidence class evidence attempts, or an already-built summary ({total, domains})
 */
export function buildPathway({
  profile: rawProfile,
  index = {},
  evidence = null,
  length = 7,
  lessonTitle = "",
} = {}) {
  const profile = rawProfile?.tiers ? rawProfile : normalizeProfile(rawProfile);
  if (!profile.grade) throw new Error("A pathway needs the class grade.");
  const len = PATH_LENGTHS.includes(length) ? length : 7;
  const summary = Array.isArray(evidence)
    ? summarizeEvidence(evidence, { domainOf: index.domainOf })
    : evidence;
  const plan = domainPlan(profile, summary);
  const wida = asArr(index.wida);
  const used = new Set();
  const take = (domain, opts = {}) => {
    const first = rankCollections(wida, profile, domain, {
      ...opts,
      exclude: opts.reuse ? [] : [...used],
    })[0];
    const pick = first || rankCollections(wida, profile, domain, opts)[0] || null;
    if (pick) used.add(pick.id);
    return pick;
  };
  const topic = lessonTitle || profile.lessonTitle;
  const forLesson = topic ? ` for ${topic}` : "";
  const steps = [];
  const add = (step) => steps.push({ n: steps.length + 1, ...step });

  const basisFor = (d) =>
    plan[d].signal === "unknown"
      ? `Class profile: ${d} supports are set to ${tierLabel(plan[d].baseTier)}${profile.mixed[d] ? " (the class is mixed, so the largest group sets the starting point)" : ""}. ${plan[d].attempts ? plan[d].statement : ""}`
      : `Class evidence: ${plan[d].statement} Supports move from ${tierLabel(plan[d].baseTier)} to ${tierLabel(plan[d].tier)} because the class ${plan[d].signal === "support" ? "needed more help than the profile predicted" : "needed less help than the profile predicted"}.`;
  const extraFor = (d) => (plan[d].adapted ? EXTRA[plan[d].signal][d] : null);

  let guidedWriteCollection = null;

  for (const key of STEP_ORDER[len]) {
    if (key === "vocab") {
      const v = pickVocab(index, profile);
      add({
        key,
        title: `See, say and use the key words${forLesson}`,
        domain: "Vocabulary",
        klu: kluFor(profile, null),
        purpose:
          "Meet each word with a picture, say it aloud, and use it in a short phrase before the practice that needs it.",
        why: `Why this step: the words in the next steps carry the content. ${v ? "A vocabulary collection matches this class." : "No matching vocabulary collection is in the Studio yet."}`,
        resource: v
          ? {
              kind: "vocab",
              id: v.id,
              title: v.title,
              href: `#/vocab/${encodeURIComponent(v.id)}/explore`,
            }
          : null,
        gap: !v,
        teacherMove: v
          ? null
          : "List the five to eight words students need. Show a picture or gesture for each, say it together, then have partners use each word in a spoken phrase.",
        tier: null,
        mode: null,
      });
    } else if (key === "listen") {
      const c = take("Listening");
      add({
        key,
        title: `Listen with a visual${forLesson}`,
        domain: "Listening",
        klu: kluFor(profile, c),
        purpose: `Listen for how a speaker uses language to ${KLU_PURPOSE[kluFor(profile, c)]}, with a picture or diagram that anchors the meaning.`,
        why: `Why this step: students hear the target language in context before they have to produce it. ${basisFor("Listening")}`,
        resource: c ? resourceFor(c, { tier: plan.Listening.tier, mode: "instructional" }) : null,
        gap: !c,
        tier: plan.Listening.tier,
        mode: "instructional",
        extra: extraFor("Listening"),
        adapted: plan.Listening.adapted,
      });
    } else if (key === "talk") {
      const c = take("Speaking");
      const act = c ? null : pickTalkActivity(index, profile);
      add({
        key,
        title: `Partner talk${forLesson}`,
        domain: "Speaking",
        klu: kluFor(profile, c),
        purpose: `Say the language aloud with a partner first: ${KLU_PURPOSE[kluFor(profile, c)]}. Oral rehearsal makes the writing step possible.`,
        why: `Why this step: talking before writing lets students try the frames with support from a partner. ${basisFor("Speaking")}`,
        resource: c
          ? resourceFor(c, { tier: plan.Speaking.tier, mode: "instructional" })
          : act
            ? {
                kind: "activity",
                id: act.id,
                title: act.title,
                engine: act.engine,
                tier: plan.Speaking.tier,
              }
            : null,
        gap: !c && !act,
        tier: plan.Speaking.tier,
        mode: "instructional",
        extra: extraFor("Speaking"),
        adapted: plan.Speaking.adapted,
      });
    } else if (key === "guided-write") {
      const c = take("Writing");
      guidedWriteCollection = c;
      add({
        key,
        title: `Guided written explanation${forLesson}`,
        domain: "Writing",
        klu: kluFor(profile, c),
        purpose: `Write with frames and a model close by: ${KLU_PURPOSE[kluFor(profile, c)]}.`,
        why: `Why this step: guided writing turns the rehearsed talk into text while supports are still available. ${basisFor("Writing")}`,
        resource: c ? resourceFor(c, { tier: plan.Writing.tier, mode: "instructional" }) : null,
        gap: !c,
        tier: plan.Writing.tier,
        mode: "instructional",
        extra: extraFor("Writing"),
        adapted: plan.Writing.adapted,
      });
    } else if (key === "independent") {
      const c = take("Writing") || guidedWriteCollection;
      add({
        key,
        title: `Independent explanation${forLesson}`,
        domain: "Writing",
        klu: kluFor(profile, c),
        purpose:
          "Write again with supports hidden until requested. This is simulated independent practice, not a test.",
        why: `Why this step: it shows what students can do on their own and which supports they still ask for. ${basisFor("Writing")}`,
        resource: c ? resourceFor(c, { tier: plan.Writing.tier, mode: "independent" }) : null,
        gap: !c,
        tier: plan.Writing.tier,
        mode: "independent",
        extra: null,
        adapted: plan.Writing.adapted,
      });
    } else if (key === "revise") {
      const c = guidedWriteCollection || take("Writing", { reuse: true });
      add({
        key,
        title: `Feedback and revision${forLesson}`,
        domain: "Writing",
        klu: kluFor(profile, c),
        purpose:
          "Check the draft against the language targets, get one specific piece of feedback, revise, and compare drafts.",
        why: `Why this step: revising against targeted feedback is where language grows. ${basisFor("Writing")}`,
        resource: c
          ? resourceFor(c, { tier: plan.Writing.tier, mode: "instructional", focus: "revision" })
          : null,
        gap: !c,
        tier: plan.Writing.tier,
        mode: "instructional",
        extra: null,
        adapted: plan.Writing.adapted,
      });
    } else if (key === "transfer") {
      const c = take("Reading", { preferOtherSubject: true });
      add({
        key,
        title: "Transfer: read and use the language in a new context",
        domain: "Reading",
        klu: kluFor(profile, c),
        purpose: `Meet the same kind of language (${KLU_PURPOSE[kluFor(profile, c)]}) in a new text, so students see it is not tied to one lesson.`,
        why: `Why this step: transfer shows whether the language travels beyond the lesson. ${basisFor("Reading")}`,
        resource: c
          ? resourceFor(c, {
              tier: plan.Reading.tier,
              mode: plan.Reading.signal === "ready" ? "independent" : "instructional",
            })
          : null,
        gap: !c,
        tier: plan.Reading.tier,
        mode: plan.Reading.signal === "ready" ? "independent" : "instructional",
        extra: extraFor("Reading"),
        adapted: plan.Reading.adapted,
      });
    }
  }

  const domainsCovered = DOMAINS.filter((d) => steps.some((s) => s.domain === d));
  const gaps = steps.filter((s) => s.gap).map((s) => ({ n: s.n, key: s.key, domain: s.domain }));
  const adaptedDomains = DOMAINS.filter((d) => plan[d].adapted);
  return {
    steps,
    length: steps.length,
    basis: adaptedDomains.length ? "evidence" : "profile",
    adaptedDomains,
    domainsCovered,
    gaps,
    plan,
    rigor: RIGOR_NOTE,
    notes: [
      RIGOR_NOTE,
      adaptedDomains.length
        ? `Adapted from class evidence in ${adaptedDomains.join(", ")} (${MIN_ATTEMPTS} or more attempts each). Other domains follow the class profile.`
        : `Built from the class profile. Evidence adapts a domain after ${MIN_ATTEMPTS} or more practice attempts in it.`,
      gaps.length
        ? `${gaps.length} step${gaps.length === 1 ? " has" : "s have"} no matching resource in the Studio yet. Each shows what to do instead.`
        : "Every step has a matching resource.",
    ],
  };
}

// ---------- class needs by domain ----------

export function classNeeds({ profile: rawProfile, index = {}, evidence = [] } = {}) {
  const profile = rawProfile?.tiers ? rawProfile : normalizeProfile(rawProfile);
  const summary = Array.isArray(evidence)
    ? summarizeEvidence(evidence, { domainOf: index.domainOf })
    : evidence;
  const plan = domainPlan(profile, summary);
  return DOMAINS.map((d) => {
    const p = plan[d];
    const top = profile.grade ? rankCollections(asArr(index.wida), profile, d)[0] : null;
    const lesson = profile.lessonId ? `&lesson=${encodeURIComponent(profile.lessonId)}` : "";
    const actions = [
      {
        kind: "open-practice",
        label: `Open ${d} practice`,
        href: `#/wida?domain=${d}${profile.cluster ? `&cluster=${profile.cluster}` : ""}`,
      },
      top
        ? {
            kind: "assign",
            label: `Assign "${top.title}"`,
            href: `#/wida/${encodeURIComponent(top.id)}`,
            collectionId: top.id,
          }
        : {
            kind: "assign",
            label: `No ${d} collection for grade ${profile.grade || "?"} yet`,
            href: null,
          },
      {
        kind: "small-group",
        label: `Create a small-group ${d.toLowerCase()} activity`,
        href: `#/create?type=small-group&domain=${d}${lesson}`,
      },
    ];
    const headline =
      p.signal === "support"
        ? "More language support needed"
        : p.signal === "ready"
          ? "Ready for less support"
          : p.signal === "steady"
            ? "Steady with current supports"
            : "Based on the class profile";
    return {
      domain: d,
      tier: p.baseTier,
      suggestedTier: p.tier,
      mixed: profile.mixed[d],
      signal: p.signal,
      headline,
      attempts: p.attempts,
      enough: p.attempts >= MIN_ATTEMPTS,
      statement: p.statement,
      actions,
    };
  });
}

// ---------- route parsing for #/wida ----------

/** "#/wida", "#/wida/<id>", "#/wida/path?class=c-1" -> { page, id?, query } */
export function parseWidaRoute(hash = "") {
  const raw = String(hash).replace(/^#/, "");
  const cut = raw.indexOf("?");
  const path = cut >= 0 ? raw.slice(0, cut) : raw;
  const query = Object.fromEntries(new URLSearchParams(cut >= 0 ? raw.slice(cut + 1) : ""));
  const segs = path
    .split("/")
    .filter(Boolean)
    .map((s) => {
      try {
        return decodeURIComponent(s);
      } catch {
        return s;
      }
    });
  if (segs[0] !== "wida") return { page: "hub", query };
  if (!segs[1]) return { page: "hub", query };
  if (segs[1] === "path") return { page: "path", query };
  return { page: "collection", id: segs[1], query };
}

export const BAND_LABEL = Object.fromEntries(BANDS.map((b) => [b.id, b.label]));
