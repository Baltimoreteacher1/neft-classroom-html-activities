/**
 * Practice Studio learner model (window.StudioLearner): what a student has shown on each skill, kept on this device.
 * Contract: docs/specs/studio-v3-w2.md. Pure apart from one localStorage key; nothing here is timed, sent anywhere, or knows
 * any mathematics. It listens to the studio event bus (`answer`) and raises `seal` when a seal rises.
 *
 *   record(e)          one bus `answer` payload -> { key, rose } (rose = the seal number just earned, or 0)
 *   get(key)           one skill's record, or null
 *   forLesson(lesson)  every skill seen in that lesson, newest first
 *   sealOf(rec)        0..3
 *   SEALS              the three seals, EN + ES
 *   reset()            forget everything (tests; no UI offers it)
 */
(() => {
  const W = /** @type {any} */ (window);
  if (W.StudioLearner) return;
  const KEY = "neft_studio_learner_v1";
  const EMA_WEIGHT = 0.3;

  const SEALS = [
    null,
    { name: "Bronze", nameEs: "Bronce", word: "Tried", wordEs: "Probado", ring: "○" },
    { name: "Silver", nameEs: "Plata", word: "Steady", wordEs: "Constante", ring: "◐" },
    { name: "Gold", nameEs: "Oro", word: "Mastered", wordEs: "Dominado", ring: "●" },
  ];

  /** @returns {any} */
  const blank = () => ({
    v: 1,
    skills: {},
    traps: {},
    conf: { 1: { n: 0, ok: 0 }, 2: { n: 0, ok: 0 }, 3: { n: 0, ok: 0 } },
  });
  /** @returns {any} */
  function load() {
    try {
      const r = JSON.parse(localStorage.getItem(KEY) || "null");
      if (r && r.v === 1 && r.skills && typeof r.skills === "object") return { ...blank(), ...r };
    } catch (_e) {
      /* a blocked or corrupt store only means a fresh start */
    }
    return blank();
  }
  let rec = load();
  const save = () => {
    try {
      localStorage.setItem(KEY, JSON.stringify(rec));
    } catch (_e) {
      /* a blocked store only means seals are not remembered */
    }
  };
  const today = () => new Date().toLocaleDateString("en-CA");
  const slug = (/** @type {string} */ s) =>
    String(s)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

  /** The skill an answer belongs to, or null when the item is not a skill (plain authored multiple choice). */
  function keyOf(/** @type {any} */ e) {
    if (e.gen) return `gen:${e.gen}`;
    if (e.skill) return `${e.kind === "lab" ? "lab" : "act"}:${slug(e.skill)}`;
    return null;
  }

  /** The seal an evidence record has earned right now (0..3), before stickiness. */
  function earned(/** @type {any} */ r) {
    if (r.seen >= 8 && r.ema >= 0.85 && r.level >= 3 && r.streak >= 3) return 3;
    if (r.seen >= 5 && r.ema >= 0.7 && r.level >= 2) return 2;
    if (r.seen >= 3) return 1;
    return 0;
  }
  const sealOf = (/** @type {any} */ r) => (r ? r.seal || 0 : 0);

  /** One plain sentence about what the next seal needs. Never a number the student must beat, only what to do. @returns {{en: string, es: string}} */
  function nextStep(/** @type {any} */ r) {
    const seen = r ? r.seen : 0;
    const seal = sealOf(r);
    if (seal >= 3)
      return {
        en: "Mastered. Keep it fresh now and then.",
        es: "Dominado. Repásalo de vez en cuando.",
      };
    const left = (/** @type {number} */ n) => Math.max(1, n - seen);
    if (seal === 0)
      return {
        en: `${left(3)} more ${left(3) === 1 ? "answer" : "answers"} to earn Bronze.`,
        es: `${left(3) === 1 ? "Una respuesta más" : `${left(3)} respuestas más`} para ganar el Bronce.`,
      };
    const level = seal === 1 ? 2 : 3;
    const name = seal === 1 ? "Silver" : "Gold";
    const nameEs = seal === 1 ? "Plata" : "Oro";
    if (r.level < level)
      return {
        en: `Answer one at a higher level with no hint to work toward ${name}.`,
        es: `Responde una de nivel más alto sin pista para avanzar hacia el sello de ${nameEs}.`,
      };
    if (seen < (seal === 1 ? 5 : 8))
      return {
        en: `${left(seal === 1 ? 5 : 8)} more ${left(seal === 1 ? 5 : 8) === 1 ? "answer" : "answers"} toward ${name}.`,
        es: `${left(seal === 1 ? 5 : 8) === 1 ? "Una respuesta más" : `${left(seal === 1 ? 5 : 8)} respuestas más`} hacia el sello de ${nameEs}.`,
      };
    return {
      en: `A few more answers with no hint will earn ${name}.`,
      es: `Unas respuestas más sin pista te darán el sello de ${nameEs}.`,
    };
  }

  function skillFor(/** @type {string} */ key, /** @type {any} */ e) {
    return (rec.skills[key] ||= {
      label: e.skill || key,
      labelEs: e.skillEs || "",
      lesson: e.lesson || "",
      seen: 0,
      clean: 0,
      helped: 0,
      ema: 0,
      level: 0,
      streak: 0,
      best: 0,
      last: "",
      seal: 0,
      repaired: 0,
      traps: {},
    });
  }

  /* ---- the Trap Book: every misconception this student has met, across lessons ------------------------------------------ */
  const TAME_AFTER = 3;

  function trapRec(/** @type {string} */ tag) {
    rec.traps ||= {};
    const t = (rec.traps[tag] ||= {
      tag,
      name: "",
      nameEs: "",
      fix: "",
      fixEs: "",
      n: 0,
      dodged: 0,
      since: 0,
      confirmed: 0,
      first: today(),
      last: "",
      lessons: {},
      tamed: false,
    });
    // names travel with the record so the book reads on any page, even one that never uses this trap
    const d = W.StudioRT?.api?.data?.traps?.[tag] || W.StudioGen?.traps?.names?.[tag];
    if (d && !t.name) {
      t.name = d.n || d.name || "";
      t.nameEs = d.nEs || d.nameEs || "";
      t.fix = d.fix || "";
      t.fixEs = d.fixEs || "";
    }
    return t;
  }

  /** A trap is spotted by a miss that names it, dodged by a clean answer on an item that offered it, tamed after three dodges in a row. */
  function trackTraps(/** @type {any} */ e) {
    if (!e.ok && e.tag) {
      const t = trapRec(e.tag);
      t.n += 1;
      t.since = 0;
      t.last = today();
      if (e.lesson) t.lessons[e.lesson] = (t.lessons[e.lesson] || 0) + 1;
      return;
    }
    if (e.ok && e.tries === 1 && !e.hints && Array.isArray(e.traps))
      for (const tag of new Set(e.traps)) {
        const t = rec.traps?.[tag];
        if (!t || !t.n) continue;
        t.dodged += 1;
        t.since += 1;
        if (!t.tamed && t.since >= TAME_AFTER) {
          t.tamed = true;
          W.StudioBus?.emit("trap", {
            tag,
            name: t.name,
            nameEs: t.nameEs,
            tamed: true,
            lesson: e.lesson,
          });
        }
      }
  }

  /** The student said "this sounds like my thinking" (tier two of a wrong answer). */
  function confirm(/** @type {string} */ tag, /** @type {string} */ lesson) {
    const t = trapRec(tag);
    t.confirmed += 1;
    t.last = today();
    if (lesson) t.lessons[lesson] = t.lessons[lesson] || 0;
    save();
    return t;
  }

  function record(/** @type {any} */ e) {
    trackTraps(e);
    const key = keyOf(e);
    if (!key) {
      save();
      return { key: null, rose: 0 };
    }
    const r = skillFor(key, e);
    if (e.skillEs && !r.labelEs) r.labelEs = e.skillEs;
    if (!e.ok) {
      if (e.tag) r.traps[e.tag] = (r.traps[e.tag] || 0) + 1;
      save();
      return { key, rose: 0 };
    }
    const clean = e.tries === 1 && !e.hints;
    r.seen += 1;
    r.last = today();
    if (clean) {
      r.clean += 1;
      r.streak += 1;
      r.best = Math.max(r.best, r.streak);
      r.level = Math.max(r.level, Number(e.genLevel) || 1);
      if (e.redeem && /^r[pd]_/.test(String(e.itemId || ""))) r.repaired += 1;
    } else {
      r.helped += 1;
      r.streak = 0;
    }
    r.ema = r.ema * (1 - EMA_WEIGHT) + (clean ? 1 : 0) * EMA_WEIGHT;
    if (e.conf >= 1 && e.conf <= 3) {
      const c = (rec.conf[e.conf] ||= { n: 0, ok: 0 });
      c.n += 1;
      if (clean) c.ok += 1;
    }
    const before = sealOf(r);
    r.seal = Math.max(before, earned(r));
    save();
    const rose = r.seal > before ? r.seal : 0;
    if (rose)
      W.StudioBus?.emit("seal", {
        key,
        label: r.label,
        labelEs: r.labelEs,
        seal: rose,
        lesson: e.lesson,
      });
    return { key, rose };
  }

  W.StudioLearner = {
    SEALS,
    record,
    sealOf,
    earned,
    nextStep,
    keyOf,
    confirm,
    traps: () => rec.traps || {},
    trap: (/** @type {string} */ tag) => rec.traps?.[tag] || null,
    TAME_AFTER,
    get: (/** @type {string} */ key) => rec.skills[key] || null,
    all: () => rec.skills,
    confidence: () => rec.conf,
    forLesson: (/** @type {string} */ lesson) =>
      Object.entries(rec.skills)
        .filter(([, r]) => /** @type {any} */ (r).lesson === lesson)
        .sort((a, b) =>
          /** @type {any} */ (b[1]).last.localeCompare(/** @type {any} */ (a[1]).last),
        )
        .map(([key, r]) => ({ key, .../** @type {any} */ (r) })),
    reset() {
      rec = blank();
      save();
    },
  };
  W.StudioBus?.on("answer", (/** @type {any} */ e) => W.StudioLearner.record(e));
})();
