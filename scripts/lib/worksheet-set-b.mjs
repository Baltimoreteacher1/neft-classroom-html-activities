/**
 * worksheet-set-b.mjs — what the SECOND practice sheet is made of.
 *
 * Every lesson now prints two worksheets. Set A (`worksheet.html`) is unchanged.
 * Set B (`worksheet-2.html`) is the parallel form a teacher reaches for when the
 * first sheet has been used: re-teach, homework, a retake, or the second day of
 * a two-day lesson.
 *
 * THE ONE RULE THIS FILE EXISTS TO ENFORCE: Set B is built only from problems
 * the lesson's author already wrote and Set A does not print. It never invents
 * a number, never re-numbers an authored stem, and never re-prints an item Set A
 * already carries.
 *
 * That rule is not stylistic. A generated variant of "8 ÷ 1/3 = ?" needs a new
 * quotient AND three new distractors that are each wrong for a named reason;
 * across 4,232 authored items only 100 are bare arithmetic the generator could
 * even re-derive, so a variant engine would be guessing on 98% of the fleet and
 * shipping the guesses in an answer key. Reserve items are content a human wrote
 * and reviewed.
 *
 * Where the reserve comes from, by lesson kind:
 *
 *   core       practice.optional (authored stretch, never printed) · warmup
 *              questions · connect.check · reflect.exitTicket · explore.cards.
 *              Set A prints approaching + onLevel + extending in full, so those
 *              are spent; these five pools are untouched by it.
 *   group1     approaching past the 6 Set A slices, then onLevel — which
 *              buildGroup1SupportWorksheet never reads at all when a lesson has
 *              an approaching pool.
 *   group2     extending past 6, then onLevel.
 *   catchup    approaching past 5, then onLevel, then optional.
 *
 * A group lesson's Set B deliberately does NOT touch warmup / connect / explore /
 * turnAndTalk / vocabulary / exitTicket. Those belong to the small-group Practice
 * Set (`practice.html`, scripts/generate-sg-practice.mjs), whose whole definition
 * is that it renders the pools the worksheets leave alone. Taking them here would
 * make the two packets print the same problems, and both would still build.
 */

/** An item is printable when it carries something to render. */
export function printable(pool) {
  return (Array.isArray(pool) ? pool : []).filter((p) => p && (p.type || p.stem || p.prompt));
}

/**
 * Normalize a non-practice item (warm-up, Connect check, exit ticket) into the
 * shape renderProblem consumes.
 *
 * Two traps this closes.
 *
 * ANSWER FIELD: warmup.questions and reflect.exitTicket mark the answer with
 * `correctIndex`, but connect.check uses `answer`. renderMC reads `correctIndex`
 * and nothing else, so an un-normalized Connect check prints an answer key in
 * which every item is A.
 *
 * DANGLING REFERENT: a Connect check is written to be ASKED, right after the
 * teacher has read `connect.scenario` aloud, so it refers back to it — lesson
 * 6-1's second check is "If each section were 1/2 yard instead, how many
 * sections?", and the sections are in the scenario, not in the question. On a
 * screen the scenario is on the same card; on paper, lifted out of the lesson
 * flow, the question has no subject. So the scenario is carried onto the stem of
 * every item that depends on it. A worksheet problem has to stand alone, and
 * repeating one authored sentence is how it does — inventing a replacement
 * context is not.
 */
function asProblem(raw, { origin, lead = "" }) {
  if (!raw || typeof raw !== "object") return null;
  const rawStem = raw.stem || raw.prompt || raw.question || raw.questionText || "";
  const choices = Array.isArray(raw.choices)
    ? raw.choices
    : Array.isArray(raw.options)
      ? raw.options
      : [];
  if (!rawStem) return null;
  const leadText = String(lead || "").trim();
  // Skip the lead when the question already restates it — repeating a context
  // the stem has just given reads as an editing mistake, not as support.
  const stem =
    leadText && !rawStem.startsWith(leadText) ? `${leadText} ${rawStem}`.trim() : rawStem;

  let correctIndex = Number.isInteger(raw.correctIndex) ? raw.correctIndex : null;
  if (correctIndex === null && Number.isInteger(raw.answer)) correctIndex = raw.answer;

  // Choices with no resolvable key would print a blank answer key — worse than
  // not printing the item. An item with no choices at all is a written response.
  if (choices.length && correctIndex === null) return null;
  if (choices.length && (correctIndex < 0 || correctIndex >= choices.length)) return null;

  const item = {
    type: choices.length ? "multiple-choice" : "open-response",
    stem,
    origin,
  };
  if (choices.length) {
    item.choices = choices;
    item.correctIndex = correctIndex;
  }
  if (raw.explanation) item.explanation = raw.explanation;
  if (raw.sampleAnswer) item.sampleAnswer = raw.sampleAnswer;
  if (raw.answer != null && !Number.isInteger(raw.answer)) item.answer = raw.answer;
  if (raw.watchFor) item.watchFor = raw.watchFor;
  return item;
}

function tag(items, origin) {
  return items.map((p) => ({ ...p, origin }));
}

/**
 * The reserve for a core (whole-group) lesson, ordered from the most supported
 * end to the most independent end.
 *
 * The order is the tiering. Warm-up items rehearse the prerequisite skill and
 * Connect checks are the guided mid-lesson check, so they open the supported
 * edition; practice.optional is authored stretch and the exit ticket is the
 * independent mastery item, so they close the core edition. Splitting a shuffled
 * pool in half and calling the halves A and B would imply a rigor difference
 * that is not there.
 */
export function coreReserve(cfg) {
  const out = [];
  for (const q of printable(cfg?.warmup?.questions)) {
    const item = asProblem(q, { origin: "warmup" });
    if (item) out.push(item);
  }
  const check = cfg?.connect?.check;
  const scenario = String(cfg?.connect?.scenario || "").trim();
  for (const c of Array.isArray(check) ? check : check ? [check] : []) {
    const item = asProblem(c, { origin: "connect", lead: scenario });
    if (item) out.push(item);
  }
  // `explore.cards` are NOT questions — they are the sortable cards of a
  // drag-sort (`{text, correct}`), with no stem, no choices and no answer of
  // their own. Reading them here would either drop all 202 of them (which is
  // what happens today, silently) or, if `text` were ever added to the stem
  // fields above, print a bare category label as a problem. The sort itself is
  // Set A's job.
  //
  // practice.optional items are already authored in the practice shape — they
  // keep their own type (error-analysis, fill-table, drag-sort, …) rather than
  // being flattened to multiple-choice.
  out.push(...tag(printable(cfg?.practice?.optional), "optional"));
  const exit = cfg?.reflect?.exitTicket;
  for (const e of Array.isArray(exit) ? exit : exit ? [exit] : []) {
    const item = asProblem(e, { origin: "exit" });
    if (item) out.push(item);
  }
  return out;
}

/** Practice-pool leftovers for a small-group or catch-up lesson. */
export function smallGroupReserve(cfg, kind) {
  const app = printable(cfg?.practice?.approaching);
  const on = printable(cfg?.practice?.onLevel);
  const ext = printable(cfg?.practice?.extending);
  const opt = printable(cfg?.practice?.optional);

  // Mirror exactly what Set A consumed, including its fallback: when the primary
  // pool is empty Set A falls back to onLevel, and then onLevel is spent too.
  if (kind === "group1") {
    const primary = app.length ? app : on;
    const rest = primary.slice(6);
    return [
      ...tag(rest, "practice"),
      ...tag(app.length ? on : [], "practice"),
      ...tag(ext, "practice"),
      ...tag(opt, "practice"),
    ];
  }
  if (kind === "group2") {
    const primary = ext.length ? ext : on;
    const rest = primary.slice(6);
    return [
      ...tag(rest, "practice"),
      ...tag(ext.length ? on : [], "practice"),
      ...tag(app, "practice"),
      ...tag(opt, "practice"),
    ];
  }
  // catchup
  const primary = app.length ? app : on;
  const rest = primary.slice(5);
  return [
    ...tag(rest, "practice"),
    ...tag(app.length ? on : [], "practice"),
    ...tag(ext, "practice"),
    ...tag(opt, "practice"),
  ];
}

export function kindOf(lessonId) {
  const id = String(lessonId || "");
  if (id.includes("-group1")) return "group1";
  if (id.includes("-group2")) return "group2";
  if (id.includes("-catchup")) return "catchup";
  // Apply Day. Its practice lives under `groupLevels.level1/2/3`, not under
  // `practice.*`, which is why the worksheet generator skipped all 76 of these
  // lessons in silence until 2026-08-28 — `hasAny` asked only about `practice`.
  if (id.includes("-part2")) return "partTwo";
  return "core";
}

/** Set A prints this many items per Apply Day tier; the rest is Set B's. */
export const PART_TWO_TIER_CAP = 3;

/** The three authored tiers of an Apply Day, in increasing demand. */
export const PART_TWO_LEVELS = ["level1", "level2", "level3"];

/**
 * Apply Day's reserve: what Set A's per-tier cap leaves behind, then the review
 * warm-up.
 *
 * The warm-up comes LAST despite being the easiest, because it is retrieval on
 * the PREVIOUS lesson rather than practice on this one — it belongs at the end
 * of the second sheet as a spiral check, not at the front as a warm-up a
 * student has already done in class.
 *
 * The cap is 3 rather than "print everything": measured across all 76 lessons,
 * a cap of 3 leaves Set A a mean of 8.1 items over three tier pages and Set B a
 * mean of 7.1 with nothing below 4, where a cap of 5 leaves Set B the three
 * warm-up questions and nothing else. Both sheets have to stand on their own.
 */
/**
 * The three Apply Day tiers, with each problem belonging to exactly one of them.
 *
 * THE TIERS OVERLAP AS AUTHORED: 192 items are repeated across level1/level2/
 * level3 in 65 of the 76 lessons. In the app that is invisible — a group only
 * ever sees its own level — but on paper it puts the same problem on the
 * Version A page and the Version B page of the same packet, and (because Set A
 * takes each tier's head and Set B its tail) it put 53 of 76 Set B sheets in
 * breach of the no-reprint rule. The gate caught it; this is the fix.
 *
 * A shared item is kept at the LOWEST tier it appears in. A problem good enough
 * for the supported group is a supported problem; promoting it would take
 * content away from the students with the least of it.
 */
export function partTwoTiers(cfg) {
  const claimed = new Set();
  return PART_TWO_LEVELS.map((level) =>
    printable(cfg?.groupLevels?.[level]).filter((p) => {
      const f = itemFingerprint(p);
      if (claimed.has(f)) return false;
      claimed.add(f);
      return true;
    }),
  );
}

/**
 * Does this Apply Day actually have three tiers once the duplicates are gone?
 *
 * In 19 of the 76 lessons the deduped tiers come out like 1 / 5 / 0 — level 3
 * was a verbatim copy of the other two and level 1 holds a single unique item.
 * Those lessons have ONE authored pool wearing three labels, and printing a
 * "Challenge" page with nothing on it, or a "Version A" page with one problem,
 * would be labelling that a student can read and the content cannot support.
 */
export function partTwoHasRealTiers(tiers) {
  return tiers.filter((t) => t.length >= 2).length >= 2;
}

/**
 * How Set A and Set B divide an Apply Day.
 *
 * Well-tiered lesson: a page per tier, each taking that tier's first
 * PART_TWO_TIER_CAP; Set B gets the tails.
 * Single-pool lesson: the deduped items in tier order, split down the middle so
 * both sheets carry the same weight instead of one taking everything.
 */
export function partTwoSplit(cfg) {
  const tiers = partTwoTiers(cfg);
  if (partTwoHasRealTiers(tiers)) {
    return {
      tiered: true,
      setA: tiers.map((t) => t.slice(0, PART_TWO_TIER_CAP)),
      reserve: tiers.flatMap((t) => t.slice(PART_TWO_TIER_CAP)),
    };
  }
  // Single-pool lesson: split so the two SHEETS come out even, not the pool.
  // Set B also receives the review warm-up, so an even split of the pool alone
  // hands Set B three extra problems and leaves Set A the thinner sheet — which
  // is what a plain halving did (Set A floor 2). Both sheets keep at least
  // MIN_PER_SHEET where the content allows it.
  const flat = tiers.flat();
  const warmUps = printable(cfg?.reviewWarmup?.questions).length;
  let at = Math.ceil((flat.length + warmUps) / 2);
  at = Math.min(at, Math.max(0, flat.length - Math.max(0, MIN_PER_SHEET - warmUps)));
  at = Math.max(at, Math.min(MIN_PER_SHEET, flat.length));
  return { tiered: false, setA: [flat.slice(0, at)], reserve: flat.slice(at) };
}

/** What Set A prints for an Apply Day. */
export function partTwoSetAPool(cfg) {
  return partTwoSplit(cfg).setA.flat();
}

export function partTwoReserve(cfg) {
  const out = tag(partTwoSplit(cfg).reserve, "practice");
  for (const q of printable(cfg?.reviewWarmup?.questions)) {
    const item = asProblem(q, { origin: "warmup" });
    if (item) out.push(item);
  }
  return out;
}

/**
 * Two items that render identically are one item. Guards the fallback paths,
 * where a lesson's onLevel pool can repeat what its extending pool already had.
 *
 * The fingerprint is the whole item, not a stem-and-choices digest: a drag-sort
 * and a fill-table both carry their prompt on `instructions` or `label` and have
 * neither `stem` nor `choices`, so a digest built from those fields makes every
 * one of them look like every other one and silently drops real problems.
 */
export function itemFingerprint(item) {
  const { origin: _origin, ...rest } = item || {};
  return JSON.stringify(rest, Object.keys(rest).sort());
}

function dedupe(items) {
  const seen = new Set();
  return items.filter((p) => {
    const f = itemFingerprint(p);
    if (seen.has(f)) return false;
    seen.add(f);
    return true;
  });
}

const MAX_PER_PAGE = 6;

/** A sheet below this many problems is not worth printing on its own. */
const MIN_PER_SHEET = 4;

/**
 * The pages Set B prints for this lesson, or [] when the lesson has no reserve.
 *
 * Returns the same {pool, label, sub, supported, extraScaffold} shape the Set A
 * tier list uses, so both sets run through one page builder.
 */
export function setBPages(cfg) {
  const kind = kindOf(cfg?.lessonId);
  const reserve = dedupe(
    kind === "core"
      ? coreReserve(cfg)
      : kind === "partTwo"
        ? partTwoReserve(cfg)
        : smallGroupReserve(cfg, kind),
  );
  if (!reserve.length) return [];

  if (kind === "partTwo") {
    return [
      {
        pool: reserve.slice(0, MAX_PER_PAGE * 2),
        label: "Apply Day · Set B",
        sub: "Second Practice Form · Independent Application and Spiral Review",
        supported: false,
      },
    ];
  }

  if (kind === "group1") {
    return [
      {
        pool: reserve.slice(0, MAX_PER_PAGE),
        label: "🟡 Group 1 · Set B",
        sub: "Second Practice Form · Re-Teach, Homework or Retake · Same Standard, New Problems",
        supported: true,
      },
    ];
  }
  if (kind === "group2") {
    return [
      {
        pool: reserve.slice(0, MAX_PER_PAGE),
        label: "🟣 Group 2 · Set B",
        sub: "Second Challenge Form · Non-Routine Extension · Same Standard, New Problems",
        supported: false,
      },
    ];
  }
  if (kind === "catchup") {
    return [
      {
        pool: reserve.slice(0, MAX_PER_PAGE),
        label: "🔵 Catch-Up · Set B",
        sub: "Second Bridge Form · Additional Prerequisite Reinforcement",
        supported: true,
      },
    ];
  }

  // Core: one supported edition and one core-mastery edition when there is
  // enough reserve to fill both honestly; otherwise a single sheet.
  const capped = reserve.slice(0, MAX_PER_PAGE * 2);
  if (capped.length < 6) {
    return [
      {
        pool: capped,
        label: "Set B",
        sub: "Second Practice Form · Re-Teach, Homework or Retake · Same Standard, New Problems",
        supported: true,
      },
    ];
  }
  const at = Math.ceil(capped.length / 2);
  return [
    {
      pool: capped.slice(0, at),
      label: "Set B · Version A",
      sub: "Second Practice Form · Supported · Review and Guided Checks",
      supported: true,
    },
    {
      pool: capped.slice(at),
      label: "Set B · Version B",
      sub: "Second Practice Form · Core Mastery · Stretch and Independent Application",
      supported: false,
    },
  ];
}
