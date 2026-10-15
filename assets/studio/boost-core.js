/**
 * Daily Boost core (window.StudioBoostCore): spaced, mixed retrieval across every lesson. Pure and DOM-free.
 *
 * Every generated skill the student answers lands in a Leitner box (1 to 5). A clean answer (right the first time,
 * no hint) moves the skill up a box and pushes its next review further out; anything else drops it back to box 1
 * for tomorrow. Today's Boost serves the skills that are due, then fresh skills from lessons the student has
 * actually opened, then the weakest skills, mixed so two questions in a row rarely share a skill. No timers.
 *
 *   record(store, g, clean, today, lesson) -> store
 *   plan(store, catalog, today, rand, n, lessons) -> [{ g, level, lesson, title }]
 *   levelFor(box) -> 2 | 3 | 4
 *   streak(days, today) -> number     consecutive days ending today or yesterday
 *   addDays(ymd, n), ymd(date)
 */
(() => {
  const W = /** @type {any} */ (window);
  const GAP = [0, 1, 3, 7, 14, 30]; // days until a skill is due again, by the box it just reached
  const pad = (/** @type {number} */ n) => String(n).padStart(2, "0");
  const ymd = (/** @type {Date} */ d) =>
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const addDays = (/** @type {string} */ s, /** @type {number} */ n) => {
    const [y, m, d] = s.split("-").map(Number);
    const x = new Date(y, m - 1, d + n, 12);
    return ymd(x);
  };
  const levelFor = (/** @type {number} */ box) => (box >= 5 ? 4 : box >= 3 ? 3 : 2);

  function record(
    /** @type {any} */ store,
    /** @type {string} */ g,
    /** @type {boolean} */ clean,
    /** @type {string} */ today,
    /** @type {string} [lesson] */ lesson,
  ) {
    store.skills ||= {};
    const s = (store.skills[g] ||= { box: 0, due: today, seen: 0, lesson: lesson || "" });
    s.seen++;
    if (lesson && lesson !== "0-0") s.lesson = lesson;
    s.box = clean ? Math.min(5, s.box + 1) : 1;
    s.due = addDays(today, GAP[s.box]);
    return store;
  }

  function plan(
    /** @type {any} */ store,
    /** @type {Array<{g: string, title?: string, lesson: string, unit?: number}>} */ catalog,
    /** @type {string} */ today,
    /** @type {() => number} */ rand,
    /** @type {number} */ n = 10,
    /** @type {string[]} */ lessons = [],
  ) {
    const skills = store.skills || {};
    const byG = new Map(catalog.map((c) => [c.g, c]));
    const out = /** @type {any[]} */ ([]);
    const used = new Set();
    const add = (/** @type {string} */ g, /** @type {number} */ box) => {
      const c = byG.get(g);
      if (!c || used.has(g) || out.length >= n) return;
      used.add(g);
      out.push({ g, level: levelFor(box), lesson: c.lesson, title: c.title || g });
    };
    const shuffled = (/** @type {any[]} */ a) =>
      a
        .map((x) => [rand(), x])
        .sort((p, q) => p[0] - q[0])
        .map((p) => p[1]);
    // 1. due now, weakest and most overdue first
    Object.entries(skills)
      .filter(([, s]) => /** @type {any} */ (s).due <= today)
      .sort(
        (a, b) =>
          /** @type {any} */ (a[1]).box - /** @type {any} */ (b[1]).box ||
          /** @type {any} */ (a[1]).due.localeCompare(/** @type {any} */ (b[1]).due),
      )
      .forEach(([g, s]) => add(g, /** @type {any} */ (s).box));
    // 2. fresh skills from lessons the student has opened (or a gentle start when there is no history yet)
    const known = new Set([
      ...lessons,
      ...Object.values(skills)
        .map((s) => /** @type {any} */ (s).lesson)
        .filter(Boolean),
    ]);
    const fresh = catalog.filter((c) => !skills[c.g]);
    const mine = fresh.filter((c) => known.has(c.lesson));
    const start = fresh.filter((c) => Number(c.unit) <= 3);
    const pool = mine.length ? mine : known.size ? fresh : start.length ? start : fresh;
    shuffled(pool).forEach((c) => add(c.g, 0));
    // 3. weakest skills not yet due, to fill the set
    Object.entries(skills)
      .filter(([g]) => !used.has(g))
      .sort((a, b) => /** @type {any} */ (a[1]).box - /** @type {any} */ (b[1]).box)
      .forEach(([g, s]) => add(g, /** @type {any} */ (s).box));
    // mixed order, but the due skills still come early in the run
    const dueCount = out.filter((x) => (skills[x.g]?.due || "9999") <= today).length;
    const head = shuffled(out.slice(0, dueCount));
    const tail = shuffled(out.slice(dueCount));
    return [...head, ...tail];
  }

  function streak(/** @type {string[]} */ days, /** @type {string} */ today) {
    const set = new Set(days);
    let d = set.has(today) ? today : addDays(today, -1);
    let n = 0;
    while (set.has(d)) {
      n++;
      d = addDays(d, -1);
    }
    return n;
  }

  W.StudioBoostCore = { record, plan, levelFor, streak, addDays, ymd, GAP };
})();
