/**
 * Skill Quest model (window.StudioQuestModel): an adaptive run through a lesson's own skills, pure and DOM-free.
 *
 * Each skill sits on a ladder of four levels (the generators' own levels: recognise, grade level, multi-step,
 * challenge). A clean answer (right the first time, no hint) builds a streak; three in a row climbs a level.
 * Two answers that needed help in a row step back a level, so the student is never stranded or coasting.
 * A skill is mastered at level 3 with a streak of 3, or at level 4 with a streak of 2. The quest ends when every
 * skill is mastered or after a fixed number of questions, whichever comes first. Nothing here is timed.
 *
 *   start(skills, { scaffold })            -> quest   skills: [{ g, label }]
 *   pick(quest)                            -> { skill, level }   the next question (least mastered skill first)
 *   record(quest, skillIndex, { clean })   -> quest   mutates and returns it
 *   finished(quest)                        -> boolean
 *   summary(quest)                         -> { stars, mastered, clean, asked, skills: [...] }
 */
(() => {
  const W = /** @type {any} */ (window);
  const MAX_LEVEL = 4;
  const CLIMB = 3;

  const mastered = (/** @type {any} */ s) =>
    (s.level === MAX_LEVEL && s.streak >= 2) || (s.level >= 3 && s.streak >= CLIMB);

  function start(/** @type {Array<{g: string, label?: string}>} */ skills, o = {}) {
    const startLevel = /** @type {any} */ (o).scaffold ? 1 : 2;
    return {
      asked: 0,
      cleanCount: 0,
      cap: Math.min(18, skills.length * 4 + 6),
      skills: skills.map((s) => ({
        g: s.g,
        label: s.label || s.g,
        level: startLevel,
        top: startLevel,
        streak: 0,
        helped: 0,
        mastered: false,
        seen: 0,
      })),
    };
  }

  function pick(/** @type {any} */ q) {
    const open = q.skills
      .map((/** @type {any} */ s, /** @type {number} */ i) => ({ s, i }))
      .filter((/** @type {any} */ x) => !x.s.mastered);
    const pool = open.length
      ? open
      : q.skills.map((/** @type {any} */ s, /** @type {number} */ i) => ({ s, i }));
    // least practised first, then the lowest level: the skill that needs the most help comes up next
    pool.sort(
      (/** @type {any} */ a, /** @type {any} */ b) =>
        a.s.seen - b.s.seen || a.s.level - b.s.level || a.i - b.i,
    );
    const x = pool[0];
    return { skill: x.i, level: x.s.level };
  }

  function record(
    /** @type {any} */ q,
    /** @type {number} */ index,
    /** @type {{clean: boolean}} */ r,
  ) {
    const s = q.skills[index];
    q.asked++;
    s.seen++;
    if (r.clean) {
      q.cleanCount++;
      s.streak++;
      s.helped = 0;
      // mastery is judged at the level the student just answered at, before any climb
      if (mastered(s)) s.mastered = true;
      else if (s.streak >= CLIMB && s.level < MAX_LEVEL) {
        s.level++;
        s.top = Math.max(s.top, s.level);
        s.streak = 0;
      }
    } else {
      s.streak = 0;
      s.helped++;
      if (s.helped >= 2 && s.level > 1) {
        s.level--;
        s.helped = 0;
      }
    }
    return q;
  }

  const finished = (/** @type {any} */ q) =>
    q.skills.every((/** @type {any} */ s) => s.mastered) || q.asked >= q.cap;

  function summary(/** @type {any} */ q) {
    const done = q.skills.filter((/** @type {any} */ s) => s.mastered).length;
    const share = q.asked ? q.cleanCount / q.asked : 0;
    const stars =
      done === q.skills.length ? (share >= 0.7 ? 3 : 2) : done > 0 || share >= 0.5 ? 1 : 0;
    return {
      stars,
      mastered: done,
      clean: q.cleanCount,
      asked: q.asked,
      skills: q.skills.map((/** @type {any} */ s) => ({
        label: s.label,
        level: s.top,
        mastered: s.mastered,
      })),
    };
  }

  W.StudioQuestModel = { start, pick, record, finished, summary, MAX_LEVEL, CLIMB };
})();
