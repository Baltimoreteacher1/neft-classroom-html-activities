// The unit's error catalog: every error type a class tally may name, built from the unit's OWN data.
// The server accepts only ids in this list (so a tally can never carry free text or a name), and the Studio uses
// the same list for its example, redirect and reteach activity.
//
// Id families (prefix:slug):
//   misc:primary             the unit's common_language_misconception (always first: the default dominant pick)
//   doctor:<error_type>      a Language Doctor error type the unit's ESOL pack drills
//   distractor:<error_type>  picking a look-alike answer on that Language Doctor item
//   frame:<slug>             a frame-completion slip on the exit ticket (fixed ids, text built from the ticket)

const text = (v) => (typeof v === "string" ? v.trim() : "");

const FRAME_ERRORS = [
  {
    id: "frame:no-connector",
    label: "The sentence has no linking word",
    redirect:
      "Point to the linking word in the frame and ask, 'What word shows the connection?' Have the student say it, then write it.",
  },
  {
    id: "frame:missing-term",
    label: "A required unit word is missing",
    redirect:
      "Show the word bank, have the student point to the missing word, say it in a spoken sentence, then add it to the writing.",
  },
  {
    id: "frame:incomplete",
    label: "A blank in the frame was left empty",
    redirect:
      "Read the frame together, say each blank out loud first, then write what was said into the blank.",
  },
];

/** Preference order of studio activity kinds that reteach each family. */
export const RETEACH_KINDS = Object.freeze({
  misc: ["talk_cards", "error_analysis", "write_scaffold", "sentence_combine"],
  doctor: ["error_analysis", "sentence_combine", "cloze"],
  distractor: ["match", "word_sort", "cloze"],
  frame: ["write_scaffold", "sentence_combine", "cloze"],
});

/** @returns {{ id, kind, label, example, redirect }[]} in priority order (used as the tie-break). */
export function errorCatalog(detail) {
  const out = [];
  const m = detail?.connections?.[0]?.common_language_misconception;
  const pattern = text(m?.misconception_pattern);
  if (pattern) {
    out.push({
      id: "misc:primary",
      kind: "misc",
      label: pattern,
      example: pattern,
      redirect: text(m.teacher_redirect),
    });
  }
  const unique = [];
  const seen = new Set();
  for (const item of Array.isArray(detail?.esol_pack?.doctor) ? detail.esol_pack.doctor : []) {
    const type = text(item?.error_type);
    if (!/^[a-z0-9-]{2,40}$/.test(type) || seen.has(type)) continue;
    seen.add(type);
    unique.push({ type, item });
  }
  for (const { type, item } of unique) {
    out.push({
      id: `doctor:${type}`,
      kind: "doctor",
      label: text(item.rule),
      example: text(item.wrong),
      redirect: text(item.why) ? `${text(item.rule)} ${text(item.why)}` : text(item.rule),
    });
  }
  for (const { type, item } of unique) {
    const options = Array.isArray(item.options) ? item.options : [];
    const decoy = options.find((_, i) => i !== item.answer_index);
    out.push({
      id: `distractor:${type}`,
      kind: "distractor",
      label: `Picked a look-alike answer: ${text(item.rule)}`,
      example: text(decoy),
      redirect: text(item.rule),
    });
  }
  const raw = detail?.connections?.[0]?.language_exit_ticket_json || {};
  const frame = text(raw.target_frame);
  const vocab = Array.isArray(raw.required_vocab) ? raw.required_vocab.join(", ") : "";
  for (const f of FRAME_ERRORS) {
    const example = f.id === "frame:missing-term" && vocab ? `Required words: ${vocab}` : frame;
    out.push({ id: f.id, kind: "frame", label: f.label, example, redirect: f.redirect });
  }
  return out;
}

export const catalogIds = (catalog) => new Set(catalog.map((e) => e.id));

/**
 * The follow-up activity for one catalog entry: the first of the unit's activities whose kind is preferred for the
 * entry's family, else the unit's first activity, else null. Deterministic.
 */
export function reteachActivity(entry, detail) {
  const activities = Array.isArray(detail?.activities)
    ? [...detail.activities].sort((a, b) => Number(a.activity_order) - Number(b.activity_order))
    : [];
  if (!entry || !activities.length) return null;
  const prefs = RETEACH_KINDS[entry.kind] || [];
  const pick =
    prefs.map((k) => activities.find((a) => a.activity_type === k)).find(Boolean) || activities[0];
  return {
    id: pick.id,
    title: text(pick.title),
    kind: pick.activity_type,
    minutes: Number(pick.duration_minutes) || null,
    domain: text(pick.domain),
  };
}
