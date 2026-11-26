// BCPSS Plan & Respond — curriculum map, resource catalog and purpose-based composer.
// Pure functions over the unit detail from /api/bcpss/units/<id>. No DOM, importable by Node tests.
// Every item points at a resource that already exists for the unit (export parts, packet kits, studio activities,
// Writing Lab, teacher-page tabs). Nothing here invents curriculum, alignment or publisher content.

export const LEVELS = [
  { key: "1_2", label: "More support", hint: "Pictures, word banks and full sentence frames" },
  { key: "3_4", label: "Some support", hint: "Sentence starters and partner rehearsal" },
  { key: "5_6", label: "Light support", hint: "Connectors and open writing" },
];

// Six teacher-facing groups (the brief's conceptual groupings, shown as sections, not new navigation).
export const GROUPS = [
  { id: "teach", label: "Teach and explain" },
  { id: "vocab", label: "Vocabulary" },
  { id: "practice", label: "Student practice" },
  { id: "language", label: "Language support" },
  { id: "assess", label: "Assess and respond" },
  { id: "projects", label: "Writing and projects" },
];

export const PURPOSES = [
  {
    id: "introduce",
    label: "Introduce the concept",
    pick: [
      "tab-overview",
      "part-poster",
      "kind-dictogloss",
      "kind-listen_and_show",
      "kind-read_annotate",
      "kind-talk_cards",
      "tab-vocab",
    ],
  },
  {
    id: "vocab",
    label: "Teach vocabulary",
    pick: [
      "tab-vocab",
      "kind-match",
      "kind-word_sort",
      "part-cards",
      "tab-reading",
      "kind-clue_game",
      "part-wall",
      "part-bingo",
    ],
  },
  {
    id: "support",
    label: "Support multilingual learners",
    pick: [
      "local-support",
      "part-strips",
      "kit-cards",
      "kind-dictogloss",
      "kind-sentence_combine",
      "part-talk",
      "kit-family",
    ],
  },
  {
    id: "practice",
    label: "Independent practice",
    pick: [
      "part-book",
      "kind-cloze",
      "kind-sequence",
      "kind-error_analysis",
      "kind-unscramble",
      "kind-quiz",
      "part-key",
    ],
  },
  {
    id: "small-group",
    label: "Prepare a small group",
    pick: [
      "local-reteach",
      "local-support",
      "kind-match",
      "kind-sentence_combine",
      "kind-talk_cards",
      "kit-exit",
    ],
  },
  {
    id: "review",
    label: "Review content",
    pick: [
      "kind-clue_game",
      "part-bingo",
      "kind-quiz",
      "kind-word_sort",
      "local-retrieval",
      "kind-cloze",
    ],
  },
  {
    id: "writing",
    label: "Develop academic writing",
    pick: [
      "writing-lab",
      "part-writing",
      "kind-write_scaffold",
      "kind-sentence_combine",
      "part-strips",
      "part-writing-key",
    ],
  },
  {
    id: "access",
    label: "ACCESS-style language practice",
    pick: [
      "kind-dictogloss",
      "kind-listen_and_show",
      "kind-talk_cards",
      "kind-info_gap",
      "kind-read_annotate",
      "kind-cloze",
      "kind-write_scaffold",
    ],
  },
  {
    id: "assess",
    label: "Check understanding",
    pick: ["kit-exit", "kind-error_analysis", "local-check", "part-key", "kind-quiz"],
  },
];

const DEFAULT_PICKS = 5;

const enc = encodeURIComponent;
const exportHref = (unitId, part, format, wida) =>
  `/api/bcpss/export/${enc(unitId)}?format=${format}&part=${enc(part)}&wida=${wida}${format === "html" ? "" : "&download=1"}`;
const packetHref = (unitId, part, format) =>
  `/api/bcpss/packet?unit=${enc(unitId)}&part=${enc(part)}&format=${format}`;
const studioHref = (unitId, wida, index) =>
  `/bcpss-teachers/language-studio/?unit=${enc(unitId)}&level=l${wida}${index ? `&a=${index}` : ""}`;

const PART_ITEMS = [
  {
    part: "book",
    group: "practice",
    title: "Student Activity Book",
    note: "Every activity on paper",
  },
  {
    part: "key",
    group: "assess",
    title: "Answer Key",
    note: "Answers, models and rubric",
    teacher: true,
  },
  {
    part: "cards",
    group: "vocab",
    title: "Vocabulary Cards",
    note: "Cut-out cards with pictures and examples",
  },
  { part: "bingo", group: "vocab", title: "Vocabulary Bingo", note: "Six boards and a call sheet" },
  { part: "wall", group: "vocab", title: "Word Wall", note: "Large-print strips" },
  {
    part: "poster",
    group: "teach",
    title: "Mentor Sentence Poster",
    note: "Color-coded anchor chart",
  },
  {
    part: "strips",
    group: "language",
    title: "Sentence Strips",
    note: "Frames for each support level",
  },
  { part: "talk", group: "language", title: "Talk Cards", note: "Partner conversation deck" },
  {
    part: "packet",
    group: "teach",
    title: "Unit Planning Page",
    note: "Goals, words and watch-outs",
    teacher: true,
  },
];
const WRITING_PART_ITEMS = [
  {
    part: "writing",
    group: "projects",
    title: "Writing Lab Packet",
    note: "Sentence-to-paragraph writing on paper",
  },
  {
    part: "writing-key",
    group: "projects",
    title: "Writing Lab Teacher Guide",
    note: "Models and answers",
    teacher: true,
  },
];
const KIT_ITEMS = [
  {
    part: "kit-cards",
    group: "language",
    title: "Word Cards Kit",
    note: "Small cards for desks and groups",
  },
  {
    part: "kit-frames",
    group: "language",
    title: "Frames Kit",
    note: "Desk strips for all three levels",
  },
  { part: "kit-exit", group: "assess", title: "Exit Ticket Slips", note: "Four slips per page" },
  { part: "kit-family", group: "language", title: "Family Take-Home", note: "English and Spanish" },
];

// Activity kind -> catalog group. Kinds missing here fall back to their domain.
const KIND_GROUP = {
  match: "vocab",
  word_sort: "vocab",
  clue_game: "vocab",
  dictogloss: "language",
  listen_and_show: "language",
  talk_cards: "language",
  info_gap: "language",
  read_annotate: "teach",
  sequence: "practice",
  cloze: "practice",
  unscramble: "practice",
  quiz: "assess",
  error_analysis: "assess",
  sentence_combine: "language",
  write_scaffold: "projects",
};

const TAB_ITEMS = [
  {
    tab: "overview",
    group: "teach",
    title: "Unit Overview",
    note: "Goals, mentor sentence and frames on one screen",
  },
  {
    tab: "vocab",
    group: "vocab",
    title: "Visual Vocabulary",
    note: "Pictures, examples and non-examples for every word",
  },
  {
    tab: "reading",
    group: "vocab",
    title: "Vocabulary Reading",
    note: "A short text that uses the unit words",
  },
  {
    tab: "create",
    group: "projects",
    title: "Creation Studio",
    note: "Make your own activity from the unit words",
    teacher: true,
  },
];

const LOCAL_ITEMS = [
  {
    id: "local-support",
    group: "language",
    title: "Language Support Sheet",
    note: "Word bank, frames and connectors, with a fade-out option",
    view: "build",
  },
  {
    id: "local-reteach",
    group: "assess",
    title: "Small-Group Reteach Plan",
    note: "Eight short steps from warm-up to a fresh try",
    view: "reteach",
  },
  {
    id: "local-check",
    group: "assess",
    title: "Check Student Work",
    note: "Paste an anonymous answer and see what it shows",
    view: "check",
  },
  {
    id: "local-retrieval",
    group: "practice",
    title: "Spiral Review Questions",
    note: "Quick questions from earlier units",
    view: "build",
  },
];

/** Every resource available for one unit, with group, purpose keys and links. */
export function buildCatalog(detail, wida = "3_4") {
  const unitId = detail?.unit?.id;
  if (!unitId) throw new Error("buildCatalog: detail.unit.id is required");
  const studio = detail.studio || null;
  const items = [];
  for (const t of TAB_ITEMS) {
    items.push({
      id: `tab-${t.tab}`,
      type: "tab",
      group: t.group,
      title: t.title,
      note: t.note,
      tab: t.tab,
      teacher: !!t.teacher,
    });
  }
  for (const [i, a] of (studio?.activities || []).entries()) {
    items.push({
      id: `activity-${i + 1}`,
      key: `kind-${a.kind}`,
      type: "activity",
      group: KIND_GROUP[a.kind] || (a.domain === "Writing" ? "projects" : "practice"),
      title: a.title,
      note: a.mission,
      domain: a.domain,
      minutes: a.minutes,
      grouping: a.grouping,
      play: studioHref(unitId, wida, i + 1),
      print: exportHref(unitId, `activity-${i + 1}`, "pdf", wida),
      page: exportHref(unitId, `activity-${i + 1}`, "html", wida),
    });
  }
  if (studio) {
    for (const p of PART_ITEMS) items.push(partItem(unitId, wida, p));
    for (const k of KIT_ITEMS) {
      items.push({
        id: k.part,
        type: "kit",
        group: k.group,
        title: k.title,
        note: k.note,
        page: packetHref(unitId, k.part, "html"),
        print: packetHref(unitId, k.part, "pdf"),
      });
    }
  }
  if (detail.writing) {
    for (const p of WRITING_PART_ITEMS) items.push(partItem(unitId, wida, p));
    items.push({
      id: "writing-lab",
      type: "link",
      group: "projects",
      title: "Writing Lab",
      note: `${detail.writing.title}: guided steps from sentences to a paragraph`,
      play: `/bcpss-teachers/writing-lab/?unit=${enc(unitId)}&level=l${wida}`,
    });
  }
  if (studio)
    for (const l of LOCAL_ITEMS)
      if (l.id !== "local-retrieval" || spiralItems(detail).length)
        items.push({ ...l, type: "local" });
  return items;
}

function partItem(unitId, wida, p) {
  return {
    id: `part-${p.part}`,
    type: "part",
    group: p.group,
    title: p.title,
    note: p.note,
    teacher: !!p.teacher,
    page: exportHref(unitId, p.part, "html", wida),
    print: exportHref(unitId, p.part, "pdf", wida),
    word: exportHref(unitId, p.part, "docx", wida),
  };
}

const itemKey = (item) => item.key || item.id;

/** Catalog items grouped into the six teacher-facing groups, in GROUPS order (empty groups dropped). */
export function groupCatalog(catalog) {
  return GROUPS.map((g) => ({ ...g, items: catalog.filter((i) => i.group === g.id) })).filter(
    (g) => g.items.length,
  );
}

/**
 * Assemble a resource set for one purpose: items in the purpose's priority order, the first few selected by default.
 * Activity kinds can appear more than once in a unit; every matching activity is included.
 */
export function composeSet(purposeId, catalog) {
  const purpose = PURPOSES.find((p) => p.id === purposeId);
  if (!purpose) throw new Error(`composeSet: unknown purpose "${purposeId}"`);
  const out = [];
  const seen = new Set();
  for (const key of purpose.pick) {
    for (const item of catalog) {
      if (itemKey(item) !== key || seen.has(item.id)) continue;
      seen.add(item.id);
      out.push({ ...item, selected: out.length < DEFAULT_PICKS });
    }
  }
  return { purpose, items: out };
}

/** Spiral-review questions the unit pack carries from earlier units (verified retrieval items only). */
export function spiralItems(detail) {
  const list = detail?.esol_pack?.retrieval;
  return Array.isArray(list)
    ? list.filter((r) => r && r.prompt && r.answer && Array.isArray(r.options))
    : [];
}

/** Neighbouring units in the same course, from the district unit sequence returned by /api/bcpss/units. */
export function courseNeighbors(unit, courseUnits) {
  const list = (courseUnits || [])
    .filter((u) => u && u.id)
    .sort((a, b) => (a.unit_number || 0) - (b.unit_number || 0));
  const at = list.findIndex((u) => u.id === unit?.id);
  if (at < 0) return { before: null, after: null, all: list };
  return { before: list[at - 1] || null, after: list[at + 1] || null, all: list };
}

/** The curriculum map for a unit: goals, standards, words, watch-outs, connections. All fields come from detail. */
export function buildUnitMap(detail, courseUnits = []) {
  const unit = detail?.unit;
  if (!unit?.id) throw new Error("buildUnitMap: detail.unit.id is required");
  const studio = detail.studio || {};
  const neighbors = courseNeighbors(unit, courseUnits);
  const spiralFrom = [
    ...new Set(
      spiralItems(detail)
        .filter((r) => r.spiral && r.from)
        .map((r) => r.from),
    ),
  ];
  return {
    unit,
    question: studio.essential_question || unit.essential_question || "",
    contentGoal: studio.can_do?.content || "",
    languageGoal: studio.can_do?.language || "",
    klu: detail.esol_pack?.klu || detail.connections?.[0]?.wida_klu || "",
    standards: Array.isArray(unit.core_standards) ? unit.core_standards : [],
    words: (studio.vocab || []).map((v) => ({
      term: v.term,
      def: v.def,
      es: v.es || "",
      tier: v.tier,
    })),
    connectors: studio.connectors || [],
    misconception: studio.misconception || null,
    watchouts: studio.watchouts || [],
    before: neighbors.before,
    after: neighbors.after,
    spiralFrom,
    transfers: (detail.cross_subject_transfers || []).map((t) => ({
      id: t.unit_id,
      title: t.unit_title,
      subject: t.subject,
      grade: t.grade,
      note: t.cross_subject_bridge_note || "",
    })),
    module: detail.module || null,
    provenance: detail.provenance || null,
  };
}

/**
 * Language-support sheet content for one level with scaffold fading.
 * fade 0 = full frames, 1 = sentence starters (frame text up to the first blank), 2 = word bank and connectors only.
 */
export function buildSupportSheet(detail, wida = "3_4", fade = 0) {
  const studio = detail?.studio;
  if (!studio) throw new Error("buildSupportSheet: unit has no authored studio content");
  const frames = studio.frames?.[`l${wida}`] || [];
  // A starter keeps the frame's opening words. A frame that opens with a blank keeps "____" plus the words after it.
  const starters = frames.map((f) => {
    const parts = f.replace(/\[[^\]]*\]/g, "\u0000").split("\u0000");
    const head = parts[0].trim() ? parts[0] : `____${parts[1] || ""}`;
    return head.trim().replace(/[,;:]$/, "");
  });
  const vocab = studio.vocab || [];
  const showPictures = wida === "1_2";
  return {
    level: LEVELS.find((l) => l.key === wida) || LEVELS[1],
    fade,
    question: studio.essential_question,
    languageGoal: studio.can_do?.language || "",
    words: vocab.map((v) => ({
      term: v.term,
      def: v.def,
      es: wida === "5_6" ? "" : v.es || "",
      cue: showPictures ? v.cue || "" : "",
    })),
    connectors: studio.connectors || [],
    frames: fade === 0 ? frames : [],
    starters: fade === 1 ? starters.filter(Boolean) : [],
    mentor: studio.mentor?.text || "",
  };
}
