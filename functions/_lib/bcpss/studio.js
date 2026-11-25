// BCPSS Language Studio v2 — runtime loader and projection onto the unit detail shape.
// Authored content lives in db/seeds/bcpss/v2/units/<unitId>.mjs and is loaded lazily, one unit at a time.

import {
  FAMILY_LOADERS,
  STUDIO_LOADERS,
  WRITING_LOADERS,
} from "../../../db/seeds/bcpss/v2/index.mjs";
import { withListeningLab } from "../../../db/seeds/bcpss/v2/listening-lab.mjs";

export async function loadStudio(unitId) {
  const load = STUDIO_LOADERS[unitId];
  if (!load) return null;
  const mod = await load();
  // Listening Lab: two more listening activities per unit, derived from the unit's own authored data and appended
  // after the authored ones (so existing activity numbers, links and saved progress never move).
  return mod.default ? withListeningLab(unitId, mod.default) : null;
}

export async function loadFamily(unitId) {
  const load = FAMILY_LOADERS[unitId];
  if (!load) return null;
  return (await load()).default || null;
}

// Writing Lab (TWR sentence-to-paragraph path): db/seeds/bcpss/v2/writing/<unitId>.mjs
export async function loadWriting(unitId) {
  const load = WRITING_LOADERS[unitId];
  if (!load) return null;
  return (await load()).default || null;
}

const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// "I can decompose this L-shape." -> "I can _____ this L-shape."
function blankOut(sentence, term) {
  const re = new RegExp(`\\b${escapeRe(term)}(?:s|es|d|ed|ing)?\\b`, "i");
  return re.test(sentence) ? sentence.replace(re, "_____") : null;
}

function clozeFromVocab(vocab) {
  const items = [];
  for (const v of vocab) {
    const sentence = blankOut(v.example, v.term);
    if (!sentence) continue;
    const pool = vocab.filter((o) => o.term !== v.term).map((o) => o.term);
    items.push({
      sentence_with_blank: sentence,
      answer: v.term,
      hint: v.es ? `Spanish: ${v.es} — ${v.def}` : `Meaning clue: ${v.def}`,
      distractor_pool: pool.slice(0, 3),
    });
  }
  return items;
}

function partnerTalkFrom(studio) {
  const talk = studio.activities.find((a) => a.kind === "talk_cards");
  if (!talk) return null;
  const p = talk.payload;
  return {
    protocol_name: talk.title,
    role_a_title: p.roles.a,
    role_a_prompt: p.cards[0].starter,
    role_b_title: p.roles.b,
    role_b_prompt: p.cards[0].follow_up,
    talk_moves: p.moves,
  };
}

function exitTicketFrom(studio, blueprintId, klu) {
  const e = studio.exit_ticket;
  const model = e.model.toLowerCase();
  return {
    wida_klu: klu || null,
    blueprint_id: blueprintId || null,
    prompt: e.prompt,
    target_frame: e.frame,
    model: e.model,
    required_vocab: studio.vocab
      .filter((v) => model.includes(v.term.toLowerCase().split(" ")[0].slice(0, 5)))
      .map((v) => v.term)
      .slice(0, 3),
    look_fors: [e.rubric.proficient],
    quick_rubric: e.rubric,
  };
}

function lessonArcFrom(studio) {
  const by = (kinds) => studio.activities.filter((a) => kinds.includes(a.kind)).map((a) => a.title);
  const phase = (name, minutes, focus, titles) => ({
    phase: name,
    minutes,
    focus,
    activities: titles,
  });
  return [
    phase("Launch", 10, "Hook with listening and a mystery word", by(["dictogloss", "clue_game"])),
    phase("Build words", 15, "Vocabulary and word sorts", by(["match", "word_sort", "cloze"])),
    phase("Talk it out", 15, "Partner talk and information gap", by(["talk_cards", "info_gap"])),
    phase(
      "Read and write",
      20,
      "Close reading and writing",
      by([
        "read_annotate",
        "unscramble",
        "sentence_combine",
        "error_analysis",
        "write_scaffold",
        "sequence",
        "quiz",
      ]),
    ),
  ].filter((p) => p.activities.length);
}

// Projects authored studio content onto a unit detail (mutates and returns it).
export function applyStudio(detail, studio) {
  if (!detail || !studio) return detail;
  detail.unit.essential_question = studio.essential_question;
  const c = detail.connections?.[0];
  if (c) {
    c.unit_example_frame = studio.frames.l3_4[0];
    c.tier2_tier3_vocab = studio.vocab.map((v) => ({
      term: v.term,
      tier: v.tier,
      pos: v.pos,
      student_friendly_def: v.def,
      kid_def: v.def,
      example: v.example,
      nonexample: v.nonexample,
      cognate_es: v.es,
      cognate_hint: v.es ? `Spanish: ${v.es}${v.es_note ? ` — ${v.es_note}` : ""}` : null,
      family: v.family,
      cue: v.cue,
      icon: v.icon || null,
    }));
    c.mentor_sentence_unpacking = {
      mentor_sentence: studio.mentor.text,
      gist: studio.mentor.gist,
      chunks: studio.mentor.chunks.map((k) => ({
        text: k.text,
        role: k.role,
        color_token: k.tone,
        student_question: k.ask,
      })),
    };
    c.interactive_cloze_items = clozeFromVocab(studio.vocab);
    c.partner_talk_protocol = partnerTalkFrom(studio);
    c.common_language_misconception = {
      misconception_pattern: studio.misconception.pattern,
      teacher_redirect: studio.misconception.redirect,
    };
    c.l1_watchouts = studio.watchouts.map((w) => ({
      l1_group: w.group,
      friction_point: w.issue,
      quick_fix: w.fix,
    }));
    c.language_exit_ticket_json = exitTicketFrom(studio, c.blueprint_id, c.wida_klu);
    c.lesson_arc = lessonArcFrom(studio);
  }
  detail.studio = studio;
  detail.activities = studio.activities.map((a, i) => ({
    id: `${detail.unit.id}-s${i + 1}`,
    unit_id: detail.unit.id,
    activity_order: i + 1,
    title: a.title,
    domain: a.domain,
    activity_type: a.kind,
    grouping: a.grouping,
    duration_minutes: a.minutes,
    mission: a.mission,
    student_prompt: a.mission,
  }));
  return detail;
}

// Essential questions for the unit list (no full detail needed).
export async function studioEssentialQuestions(unitIds) {
  const out = new Map();
  await Promise.all(
    unitIds.map(async (id) => {
      const s = await loadStudio(id);
      if (s)
        out.set(id, {
          essential_question: s.essential_question,
          activity_count: s.activities.length,
        });
    }),
  );
  return out;
}
