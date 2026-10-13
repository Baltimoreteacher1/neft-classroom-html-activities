/* Reasoning Studio cycle state: a fresh cycle, the unfinished-cycle draft, and
 * the record saved when a cycle ends. No DOM here. */
(function (root) {
  "use strict";

  const D = root.MWReasoningData;
  const S = root.MWRStore;
  const LAST = 5;

  /* The fields that survive a reload before the cycle is saved. */
  const DRAFT_KEYS = [
    "step",
    "maxStep",
    "skill",
    "level",
    "language",
    "languageManual",
    "homeLang",
    "prompt",
    "representations",
    "firstDraft",
    "firstSeen",
    "revised",
    "rounds",
    "homeLanguage",
    "beforeConfidence",
    "afterConfidence",
    "firstAnalysis",
    "analysis",
    "compare",
    "anchors",
    "linked",
    "events",
    "startedAt",
    "exemplarPick",
  ];

  const uid = () => `mwr-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

  /* carry: skill, level, language, homeLang from the previous cycle. A pending
   * scaffold fade (two connected cycles in a row) moves the level up one. */
  function fresh(carry, worldLang) {
    const keep = carry || {};
    let level = String(keep.level || S.getPref("level", "2"));
    let fadeNotice = false;
    let fadeFrom = "";
    const pending = Number(S.getPref("pendingFade", 0));
    if (pending >= 2 && pending <= 5 && String(pending) !== level) {
      fadeFrom = level;
      level = String(pending);
      fadeNotice = true;
    }
    S.setPref("pendingFade", 0);
    return {
      step: 0,
      maxStep: 0,
      skill: keep.skill && D.SKILLS[keep.skill] ? keep.skill : "ratio",
      level,
      language: keep.language || worldLang,
      languageManual: false,
      homeLang: keep.homeLang || "none",
      stemTx: "",
      stemTxFailed: false,
      prompt: "",
      representations: [],
      firstDraft: "",
      firstSeen: "",
      revised: "",
      rounds: [],
      homeLanguage: "",
      beforeConfidence: "2",
      afterConfidence: "2",
      firstAnalysis: null,
      analysis: null,
      check: null,
      compare: { second: "", which: "" },
      anchors: [],
      anchorId: "",
      anchorText: "",
      coach: null,
      coachStatus: "",
      coachTurn: 0,
      coachFollow: "",
      exemplarPick: "",
      linked: { a: 2, b: 3, factor: 4 },
      events: [],
      startedAt: new Date().toISOString(),
      savedId: "",
      thumb: "",
      dictating: "",
      fadeNotice,
      fadeFrom,
      resumed: false,
      imported: [],
      includeLocal: true,
      importNote: "",
      galleryIndex: 0,
      galleryReveal: false,
    };
  }

  function snapshot(state) {
    const out = {};
    for (const key of DRAFT_KEYS) out[key] = state[key];
    return out;
  }

  /* Copies a saved draft onto a fresh state, checking every field's type. */
  function merge(base, draft) {
    const next = base;
    for (const key of DRAFT_KEYS) {
      const value = draft[key];
      if (value === undefined || value === null) continue;
      if (typeof next[key] === "string") next[key] = String(value).slice(0, 2000);
      else if (Array.isArray(next[key]))
        next[key] = Array.isArray(value) ? value.slice(0, 40) : next[key];
      else if (typeof next[key] === "number")
        next[key] = Math.max(0, Math.min(LAST, Number(value) || 0));
      else if (typeof next[key] === "boolean") next[key] = Boolean(value);
      else if (typeof value === "object") next[key] = value;
    }
    if (!D.SKILLS[next.skill]) next.skill = "ratio";
    next.compare = Object.assign({ second: "", which: "" }, next.compare);
    next.linked = Object.assign({ a: 2, b: 3, factor: 4 }, next.linked);
    next.resumed = true;
    return next;
  }

  /* An analysis without the display-only parts, small enough to store. */
  const slim = (a) =>
    a && {
      status: a.status,
      signal: a.signal,
      evidence: a.evidence,
      nextMove: a.nextMove,
      confidence: a.confidence,
      profile: a.profile,
      tags: a.tags,
      smp: a.smp,
      checks: (a.checks || []).map((k) => ({ id: k.id, ok: k.ok })),
      stats: a.stats,
    };

  function buildSession(state, extra) {
    const skill = D.SKILLS[state.skill] || D.SKILLS.ratio;
    const text = (state.revised || state.firstDraft).trim();
    return {
      schema: 2,
      id: state.savedId || uid(),
      at: new Date().toISOString(),
      skill: state.skill,
      standard: skill.standard,
      level: state.level,
      wida: state.level,
      language: state.language,
      homeLang: state.homeLang,
      prompt: state.prompt,
      firstDraft: state.firstDraft,
      revised: text,
      rounds: state.rounds,
      roundCount: Math.max(1, state.rounds.length),
      homeLanguage: state.homeLanguage,
      representations: state.representations.slice(),
      beforeConfidence: state.beforeConfidence,
      afterConfidence: state.afterConfidence,
      firstAnalysis: slim(state.firstAnalysis),
      analysis: slim(state.analysis),
      compare: {
        second: state.compare.second,
        which: state.compare.which,
        present: extra.compareInfo.present,
        justified: extra.compareInfo.justified,
      },
      compareDone: extra.compareInfo.present,
      anchors: state.anchors.map((x) => ({ type: x.type, sentence: x.sentence })),
      thumb: extra.thumb,
      board: extra.board,
      events: state.events.slice(-60),
    };
  }

  root.MWRState = Object.freeze({ LAST, fresh, snapshot, merge, slim, buildSession });
})(window);
