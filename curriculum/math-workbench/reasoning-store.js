/* Reasoning Studio storage, export and class aggregation.
 *
 * Everything stays on the device. Sessions carry no name or student id; a
 * student chooses whether to export a file that includes their writing. The
 * teacher view can import several of those files and aggregate them in the
 * browser, so no server or roster is involved. */
(function (root) {
  "use strict";

  const KEY = "neft.mathWorkbench.reasoning.v1";
  const DRAFT = "neft.mathWorkbench.reasoning.draft";
  const PREFS = "neft.mathWorkbench.reasoning.prefs";
  const COACH = "neft.mathWorkbench.reasoningCoach";
  const MAX_SESSIONS = 40;
  const MAX_THUMBS = 12;
  const DRAFT_DAYS = 7;
  const TEXT_MAX = 1500;

  /* Order of growth for the signal ladder. */
  const RANK = {
    "not-yet-observed": 0,
    "reasoning-not-yet-visible": 1,
    "representation-connection-needed": 2,
    "model-consistency-check": 3,
    "concept-link-needed": 4,
    "justification-link-needed": 5,
    "unit-meaning-needed": 6,
    "connected-reasoning-visible": 7,
  };
  const DIMS = ["claim", "reason", "concept", "model", "link", "units"];

  const read = (key, fallback) => {
    try {
      const raw = localStorage.getItem(key);
      return raw == null ? fallback : JSON.parse(raw);
    } catch (_) {
      return fallback;
    }
  };
  const write = (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (_) {
      return false;
    }
  };

  /* ---------------- preferences ---------------- */
  function prefs() {
    const p = read(PREFS, {});
    return p && typeof p === "object" ? p : {};
  }
  function setPref(name, value) {
    const p = prefs();
    p[name] = value;
    write(PREFS, p);
  }
  const getPref = (name, fallback) => (prefs()[name] === undefined ? fallback : prefs()[name]);

  function retentionDays() {
    const d = Number(getPref("retentionDays", 90));
    return [0, 30, 90, 180].includes(d) ? d : 90;
  }

  function coachEnabled() {
    try {
      const param = new URLSearchParams(location.search).get("coach");
      if (param === "off") return false;
      if (param === "on") return true;
      return localStorage.getItem(COACH) === "1";
    } catch (_) {
      return false;
    }
  }
  function setCoach(on) {
    try {
      localStorage.setItem(COACH, on ? "1" : "0");
    } catch (_) {}
  }

  /* ---------------- sessions ---------------- */
  function purge(list) {
    const days = retentionDays();
    if (!days) return list;
    const cutoff = Date.now() - days * 86400000;
    return list.filter((s) => {
      const at = Date.parse(s.at);
      return !Number.isFinite(at) || at >= cutoff;
    });
  }

  function loadSessions() {
    const raw = read(KEY, []);
    const list = Array.isArray(raw) ? raw.filter((s) => s && typeof s === "object") : [];
    const kept = purge(list).slice(0, MAX_SESSIONS);
    if (kept.length !== list.length) write(KEY, kept);
    return kept;
  }

  function saveSessions(list) {
    const trimmed = list
      .slice(0, MAX_SESSIONS)
      .map((s, i) => (i >= MAX_THUMBS && s.thumb ? { ...s, thumb: "" } : s));
    if (write(KEY, trimmed)) return true;
    // Storage is shared with the notebook: drop pictures first, then retry.
    return write(
      KEY,
      trimmed.map((s) => ({ ...s, thumb: "" })),
    );
  }

  function addSession(session) {
    const list = loadSessions();
    list.unshift(session);
    saveSessions(list);
    return list;
  }

  function deleteSession(id) {
    const list = loadSessions().filter((s) => s.id !== id);
    saveSessions(list);
    return list;
  }

  function clearSessions() {
    saveSessions([]);
  }

  /* ---------------- unfinished cycle ---------------- */
  function saveDraft(snapshot) {
    return write(DRAFT, { savedAt: Date.now(), data: snapshot });
  }
  function loadDraft() {
    const d = read(DRAFT, null);
    if (!d || !d.data || typeof d.savedAt !== "number") return null;
    if (Date.now() - d.savedAt > DRAFT_DAYS * 86400000) {
      clearDraft();
      return null;
    }
    return d.data;
  }
  function clearDraft() {
    try {
      localStorage.removeItem(DRAFT);
    } catch (_) {}
  }

  /* ---------------- scaffold fade ---------------- */
  function fadeInfo() {
    return getPref("fade", { level: 0, run: 0 });
  }
  /* Returns true when this cycle should move the student to the next level. */
  function recordOutcome(level, connected) {
    const f = fadeInfo();
    const run = f.level === level && connected ? (f.run || 0) + 1 : connected ? 1 : 0;
    setPref("fade", { level, run });
    return run >= 2 && level < 5;
  }
  function resetFade(level) {
    setPref("fade", { level, run: 0 });
  }

  /* ---------------- normalising sessions (v1 files and v2 files) ---------------- */
  const clampText = (v) => String(v == null ? "" : v).slice(0, TEXT_MAX);
  const status = (v) => (Object.hasOwn(RANK, v) ? v : "not-yet-observed");
  const profileOf = (a) => {
    const out = {};
    for (const d of DIMS) out[d] = Boolean(a && a.profile && a.profile[d]);
    return out;
  };

  /* Accepts a stored session, a v1 research row, or an already-normalized record
   * (a student's shared file), so normalizing twice gives the same result. */
  function normalize(raw) {
    if (!raw || typeof raw !== "object") return null;
    const finalA = raw.analysis || {};
    const firstA = raw.firstAnalysis || {};
    const list = (value, max, size) =>
      (Array.isArray(value) ? value : []).map((t) => String(t).slice(0, size)).slice(0, max);
    const dims = (analysis, flat) => profileOf(analysis.profile ? analysis : { profile: flat });
    return {
      at: typeof raw.at === "string" ? raw.at.slice(0, 40) : "",
      skill: String(raw.skill || "").slice(0, 24),
      standard: String(raw.standard || "").slice(0, 32),
      level: String(raw.level || raw.wida || "").slice(0, 2),
      language: raw.language === "es" ? "es" : "en",
      firstStatus: status(firstA.status || raw.firstStatus),
      finalStatus: status(finalA.status || raw.finalStatus || raw.signal),
      profile: dims(finalA, raw.profile),
      firstProfile: dims(firstA, raw.firstProfile),
      compare: Boolean(raw.compareDone || raw.compare === true || (raw.compare && raw.compare.present)),
      rounds: Math.max(
        1,
        Math.min(
          9,
          Number(raw.roundCount) ||
            (Array.isArray(raw.rounds) ? raw.rounds.length : Number(raw.rounds)) ||
            1,
        ),
      ),
      confBefore: String(raw.beforeConfidence || raw.confidenceBefore || raw.confBefore || ""),
      confAfter: String(raw.afterConfidence || raw.confidenceAfter || raw.confAfter || ""),
      tags: list(finalA.tags || raw.tags, 6, 60),
      smp: list(finalA.smp || raw.smp, 8, 6),
      wordDelta: Number(raw.revisionWordDelta || raw.wordDelta) || 0,
      firstDraft: clampText(raw.firstDraft),
      revised: clampText(raw.revised),
    };
  }

  /* ---------------- exports ---------------- */
  function wordsOf(text) {
    return String(text || "")
      .split(/\s+/)
      .filter(Boolean).length;
  }

  /* De-identified research data: no writing, no pictures. */
  function researchExport(sessions) {
    return {
      schema: 2,
      kind: "mw-reasoning-research",
      sessions: sessions.map((s) => {
        const n = normalize(s) || {};
        return {
          at: n.at,
          skill: n.skill,
          standard: n.standard,
          level: n.level,
          language: n.language,
          firstStatus: n.firstStatus,
          finalStatus: n.finalStatus,
          profile: n.profile,
          firstProfile: n.firstProfile,
          compare: n.compare,
          rounds: n.rounds,
          confBefore: n.confBefore,
          confAfter: n.confAfter,
          tags: n.tags,
          smp: n.smp,
          wordDelta: wordsOf(s.revised) - wordsOf(s.firstDraft),
        };
      }),
    };
  }

  /* A file a student chooses to give a teacher: includes the writing, never a name. */
  function shareExport(sessions) {
    return {
      schema: 2,
      kind: "mw-reasoning-share",
      sessions: sessions.map((s) => {
        const n = normalize(s) || {};
        return { ...n, wordDelta: wordsOf(s.revised) - wordsOf(s.firstDraft) };
      }),
    };
  }

  function toCsv(sessions) {
    const head = [
      "date",
      "skill",
      "standard",
      "level",
      "language",
      "first_signal",
      "final_signal",
      "rounds",
      ...DIMS,
      "compare",
      "confidence_before",
      "confidence_after",
      "word_delta",
      "tags",
      "smp",
    ];
    const cell = (v) => {
      const s = String(v == null ? "" : v);
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const rows = sessions.map((s) => {
      const n = normalize(s) || {};
      return [
        String(n.at).slice(0, 10),
        n.skill,
        n.standard,
        n.level,
        n.language,
        n.firstStatus,
        n.finalStatus,
        n.rounds,
        ...DIMS.map((d) => (n.profile[d] ? 1 : 0)),
        n.compare ? 1 : 0,
        n.confBefore,
        n.confAfter,
        wordsOf(s.revised) - wordsOf(s.firstDraft),
        n.tags.join("|"),
        n.smp.join("|"),
      ].map(cell);
    });
    return [head.map(cell).join(","), ...rows.map((r) => r.join(","))].join("\n");
  }

  /* Accepts one parsed file; returns normalized sessions or an error. */
  function parseImport(parsed) {
    if (!parsed || typeof parsed !== "object" || !Array.isArray(parsed.sessions))
      return { error: "shape", sessions: [] };
    const sessions = parsed.sessions.slice(0, 200).map(normalize).filter(Boolean);
    return { sessions };
  }

  /* ---------------- class aggregation ---------------- */
  function aggregate(list) {
    const sessions = list.map((s) => (s && s.finalStatus ? s : normalize(s))).filter(Boolean);
    const out = {
      total: sessions.length,
      byStatus: {},
      bySkill: {},
      dims: {},
      growth: { improved: 0, same: 0, lower: 0 },
      tags: {},
      smp: {},
      confidence: { up: 0, same: 0, down: 0 },
      exemplars: [],
    };
    for (const d of DIMS) out.dims[d] = 0;
    for (const s of sessions) {
      out.byStatus[s.finalStatus] = (out.byStatus[s.finalStatus] || 0) + 1;
      out.bySkill[s.skill] = (out.bySkill[s.skill] || 0) + 1;
      for (const d of DIMS) if (s.profile[d]) out.dims[d]++;
      const a = RANK[s.firstStatus] || 0;
      const b = RANK[s.finalStatus] || 0;
      if (a) out.growth[b > a ? "improved" : b === a ? "same" : "lower"]++;
      for (const t of s.tags) out.tags[t] = (out.tags[t] || 0) + 1;
      for (const t of s.smp) out.smp[t] = (out.smp[t] || 0) + 1;
      const cb = Number(s.confBefore);
      const ca = Number(s.confAfter);
      if (cb && ca) out.confidence[ca > cb ? "up" : ca === cb ? "same" : "down"]++;
      const text = s.revised || s.firstDraft;
      if (text && wordsOf(text) >= 4)
        out.exemplars.push({ status: s.finalStatus, skill: s.skill, text });
    }
    return out;
  }

  root.MWRStore = Object.freeze({
    KEY,
    RANK,
    DIMS,
    MAX_SESSIONS,
    getPref,
    setPref,
    retentionDays,
    coachEnabled,
    setCoach,
    loadSessions,
    saveSessions,
    addSession,
    deleteSession,
    clearSessions,
    saveDraft,
    loadDraft,
    clearDraft,
    fadeInfo,
    recordOutcome,
    resetFade,
    normalize,
    researchExport,
    shareExport,
    toCsv,
    parseImport,
    aggregate,
    wordsOf,
  });
})(window);
