/**
 * Class Pulse analysis: pasted class codes -> a pull list, a trap heat table, and the "needs a look" groups.
 *
 * Pure: no DOM, no network, nothing stored. The page (app.js) passes in `decode` (assets/studio/pulse-core.js) and the generated
 * `index` (hinge-index.json). Students are identified only by the order their code was pasted.
 */

export const MAX_CODES = 60;
export const ERRORS = {
  chars: "has a character a class code never uses (a typo?)",
  checksum: "does not add up: one character is probably mistyped",
  version: "was made by a newer version of the studio than this page reads",
  length: "is too short or too long to be a whole code",
  empty: "is empty",
};

/** Names for the kinds of place a code can point at, in the order a teacher should look. */
export const FOCUS_LABEL = {
  teacher: "never stood on its own, needs you",
  "no-twin": "closed without a fresh problem, needs you",
  certain: "was Certain but wrong",
  guessed: "was solved only after two or more misses",
};

const CODE_CHARS = /^[0-9A-Za-z]+$/;

/**
 * One line per student. A line can be the bare code, or the "Class code: ..." line of a student's copied results; other prose is
 * ignored. A line that is plainly an attempt at a code but does not decode is reported with its line number.
 * @param {string} text
 * @param {(s: string) => any} decode
 */
export function parseCodes(text, decode) {
  /** @type {{n: number, line: number, pulse: any}[]} */
  const entries = [];
  /** @type {{line: number, text: string, error: string, message: string}[]} */
  const problems = [];
  const seen = new Map();
  let ignored = 0;
  const lines = String(text || "").split(/\r?\n/);
  lines.forEach((raw, k) => {
    const line = k + 1;
    const labelled = /class code\s*[:\-]/i.test(raw);
    const body = raw.replace(/^.*class code\s*[:\-]\s*/i, "").trim();
    const squeezed = body.replace(/[\s\-_.]+/g, "");
    if (!squeezed) return;
    const tokens = body.split(/[\s\-_.]+/).filter(Boolean);
    const groupy = tokens.length === 1 || tokens.every((t) => t.length <= 5);
    const attempt = labelled || (squeezed.length >= 12 && CODE_CHARS.test(squeezed) && groupy);
    if (!attempt) {
      ignored++;
      return;
    }
    const r = decode(body);
    if (!r.ok) {
      problems.push({
        line,
        text: body.length > 24 ? `${body.slice(0, 24)}…` : body,
        error: r.error,
        message: ERRORS[/** @type {keyof typeof ERRORS} */ (r.error)] || "could not be read",
      });
      return;
    }
    const key = squeezed.toUpperCase();
    if (seen.has(key)) {
      problems.push({
        line,
        text: body,
        error: "duplicate",
        message: `is the same code as line ${seen.get(key)}, so it was counted once`,
      });
      return;
    }
    seen.set(key, line);
    entries.push({ n: entries.length + 1, line, pulse: r.pulse });
  });
  const over = entries.length > MAX_CODES;
  return { entries: entries.slice(0, MAX_CODES), problems, ignored, over };
}

/** @param {string} lesson @param {string} mode @param {number} [tab] @param {number} [i] @param {any} [index] */
export function studioHref(lesson, mode, tab, i, index) {
  const u4 = index?.u4?.[lesson];
  if (u4) return u4[mode === "challenge" ? "challenge" : "practice"];
  const base = `/math/practice-studio/${lesson}/${mode === "challenge" ? "challenge/" : ""}`;
  return tab && i ? `${base}?s=${tab}&i=${i}` : base;
}

const KIND_WORD = { move: "Which move?", mc: "multiple choice", gen: "new numbers", pool: "new numbers" };
const modeWord = (/** @type {string} */ m) => (m === "challenge" ? "Challenge" : "Practice");

/** A readable place: "Practice 2-1, section 3, problem 6 (Which move?)". */
function placeLabel(/** @type {string} */ lesson, /** @type {string} */ mode, /** @type {number} */ tab, /** @type {number} */ i, /** @type {string} */ kind) {
  return `${modeWord(mode)} ${lesson}, section ${tab}, problem ${i}${kind && KIND_WORD[/** @type {keyof typeof KIND_WORD} */ (kind)] ? ` (${KIND_WORD[/** @type {keyof typeof KIND_WORD} */ (kind)]})` : ""}`;
}

/**
 * Where to send students for a trap in a lesson: the places the lesson's index names for it, this mode's first. Unit 4 and any lesson
 * the index does not know link to the studio page itself.
 */
export function practiceLinks(/** @type {any} */ index, /** @type {string} */ lesson, /** @type {string} */ mode, /** @type {string} */ trap, limit = 2) {
  const L = index?.lessons?.[lesson];
  if (!L) {
    const u4 = index?.u4?.[lesson];
    return u4 ? [{ href: studioHref(lesson, mode, 0, 0, index), label: `${modeWord(mode)} ${lesson} studio` }] : [];
  }
  const refs = /** @type {any[]} */ (L.items?.[trap] || []);
  const ordered = [...refs.filter((r) => r[0] === mode), ...refs.filter((r) => r[0] !== mode)];
  return ordered.slice(0, limit).map(([m, tab, i, kind]) => ({
    href: studioHref(lesson, m, tab, i, index),
    label: placeLabel(lesson, m, tab, i, kind),
  }));
}

/** Total problems a lesson's mode holds, or 0 when the index does not know it. */
const totalOf = (/** @type {any} */ index, /** @type {string} */ lesson, /** @type {string} */ mode) =>
  /** @type {number[]} */ (index?.lessons?.[lesson]?.sizes?.[mode] || []).reduce((a, b) => a + b, 0);

/**
 * @param {{n: number, line: number, pulse: any}[]} entries
 * @param {any} index
 */
export function analyze(entries, index) {
  const nameOf = (/** @type {string} */ id) => index?.trapInfo?.[id]?.n || id;
  const students = entries.map(({ n, pulse: p }) => {
    const sizes = /** @type {number[]} */ (index?.lessons?.[p.lesson]?.sizes?.[p.mode] || []);
    const total = sizes.reduce((a, b) => a + b, 0);
    const done = /** @type {number[]} */ (p.done).reduce((a, b) => a + Math.min(b, 99), 0);
    const title = index?.lessons?.[p.lesson]?.title || index?.u4?.[p.lesson]?.title || "";
    return {
      n,
      lesson: p.lesson,
      mode: p.mode,
      title,
      done,
      total,
      sections: /** @type {number[]} */ (p.done).map((d, k) => ({ done: d, of: sizes[k] ?? null })),
      clean: p.clean,
      assisted: p.assisted,
      guessed: p.guessed,
      certain: p.certain,
      teacher: p.fTeacher,
      noTwin: p.fNoTwin,
      seals: p.seals,
      u4: !!p.u4,
      traps: /** @type {{h: number, n: number}[]} */ (p.traps).map((t) => {
        const id = index?.traps?.[t.h.toString(16).padStart(6, "0")] || "";
        return { id, name: id ? nameOf(id) : "A misconception this page does not know", count: t.n, known: !!id };
      }),
      focus: /** @type {{kind: string, tab: number, i: number}[]} */ (p.focus).map((f) => ({
        ...f,
        label: placeLabel(p.lesson, p.mode, f.tab, f.i, ""),
        href: p.u4 ? studioHref(p.lesson, p.mode, 0, 0, index) : studioHref(p.lesson, p.mode, f.tab, f.i, index),
      })),
    };
  });

  /* ---- pull list: students who met the same named misconception ------------------------------------------------ */
  const byTrap = new Map();
  let unknown = 0;
  for (const s of students)
    for (const t of s.traps) {
      if (!t.known) {
        unknown++;
        continue;
      }
      const g = byTrap.get(t.id) || { id: t.id, name: t.name, fix: index?.trapInfo?.[t.id]?.fix || "", students: [], misses: 0 };
      g.students.push({ n: s.n, count: t.count, lesson: s.lesson, mode: s.mode });
      g.misses += t.count;
      byTrap.set(t.id, g);
    }
  const pull = [...byTrap.values()]
    .map((g) => {
      const seen = new Set();
      const links = [];
      for (const st of g.students) {
        const key = `${st.lesson}|${st.mode}`;
        if (seen.has(key)) continue;
        seen.add(key);
        for (const l of practiceLinks(index, st.lesson, st.mode, g.id, 2)) links.push({ ...l, lesson: st.lesson });
      }
      return { ...g, links: links.slice(0, 6) };
    })
    .sort((a, b) => b.students.length - a.students.length || b.misses - a.misses || a.name.localeCompare(b.name));

  /* ---- heat: per lesson and mode, per trap ------------------------------------------------------------------------ */
  const cells = new Map();
  for (const s of students)
    for (const t of s.traps) {
      if (!t.known) continue;
      const key = `${s.lesson}|${s.mode}`;
      const lessonCells = cells.get(key) || new Map();
      const c = lessonCells.get(t.id) || { id: t.id, name: t.name, students: 0, misses: 0 };
      c.students++;
      c.misses += t.count;
      lessonCells.set(t.id, c);
      cells.set(key, lessonCells);
    }
  const lessonOrder = (/** @type {string} */ a, /** @type {string} */ b) => a.localeCompare(b, "en", { numeric: true });
  const heat = [...cells.entries()]
    .map(([key, m]) => {
      const [lesson, mode] = key.split("|");
      const rows = [...m.values()].sort((a, b) => b.students - a.students || b.misses - a.misses || a.name.localeCompare(b.name));
      return {
        lesson,
        mode,
        title: index?.lessons?.[lesson]?.title || index?.u4?.[lesson]?.title || "",
        students: students.filter((s) => s.lesson === lesson && s.mode === mode).length,
        rows,
        max: Math.max(...rows.map((r) => r.misses)),
      };
    })
    .sort((a, b) => lessonOrder(a.lesson, b.lesson) || a.mode.localeCompare(b.mode));

  /* ---- the three "needs a look" groups --------------------------------------------------------------------------- */
  const focusOf = (/** @type {any} */ s, /** @type {string[]} */ kinds) => s.focus.filter((/** @type {any} */ f) => kinds.includes(f.kind));
  const groups = {
    certain: students
      .filter((s) => s.certain > 0)
      .map((s) => ({ n: s.n, lesson: s.lesson, mode: s.mode, count: s.certain, places: focusOf(s, ["certain"]) }))
      .sort((a, b) => b.count - a.count || a.n - b.n),
    eliminated: students
      .filter((s) => s.guessed > 0)
      .map((s) => ({ n: s.n, lesson: s.lesson, mode: s.mode, count: s.guessed, places: focusOf(s, ["guessed"]) }))
      .sort((a, b) => b.count - a.count || a.n - b.n),
    teacher: students
      .filter((s) => s.teacher + s.noTwin > 0)
      .map((s) => ({
        n: s.n,
        lesson: s.lesson,
        mode: s.mode,
        count: s.teacher + s.noTwin,
        places: focusOf(s, ["teacher", "no-twin"]),
      }))
      .sort((a, b) => b.count - a.count || a.n - b.n),
  };

  return {
    students,
    pull,
    heat,
    groups,
    unknownTraps: unknown,
    lessons: [...new Set(students.map((s) => s.lesson))].sort(lessonOrder),
    quiet: students.filter((s) => !s.traps.length && !s.certain && !s.guessed && !s.teacher && !s.noTwin).map((s) => s.n),
    totalOf: (/** @type {string} */ lesson, /** @type {string} */ mode) => totalOf(index, lesson, mode),
  };
}

/* ---- hinge-question cards -------------------------------------------------------------------------------------------- */
const LETTERS = ["A", "B", "C", "D", "E"];

/**
 * One printable A/B/C/D diagnostic for a lesson, with a key that maps each wrong option to the misconception it names.
 * `which` picks among the lesson's candidates (0 = best); it wraps.
 * @param {any} index @param {string} lesson @param {number} [which]
 */
export function hingeCard(index, lesson, which = 0) {
  const L = index?.lessons?.[lesson];
  const list = /** @type {any[]} */ (L?.hinge || []);
  if (!list.length) return null;
  const k = ((which % list.length) + list.length) % list.length;
  const h = list[k];
  return {
    lesson,
    title: L.title,
    which: k,
    of: list.length,
    mode: h.mode,
    question: h.q,
    context: h.ctx || "",
    work: /** @type {string[]} */ (h.work || []),
    options: /** @type {string[]} */ (h.c).map((text, i) => {
      const id = h.tag[i];
      return {
        letter: LETTERS[i],
        text,
        correct: i === h.a,
        trap: id ? { id, name: index.trapInfo?.[id]?.n || id, fix: index.trapInfo?.[id]?.fix || "" } : null,
      };
    }),
    source: placeLabel(lesson, h.mode, h.tab, h.i, h.id?.startsWith("mv-") ? "move" : "mc"),
  };
}

/** The lessons that have a hinge card, in curriculum order. */
export function cardLessons(/** @type {any} */ index) {
  return Object.keys(index?.lessons || {})
    .filter((id) => index.lessons[id].hinge?.length)
    .sort((a, b) => a.localeCompare(b, "en", { numeric: true }));
}
