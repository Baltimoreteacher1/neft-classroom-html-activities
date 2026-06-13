(() => {
  const DATA = window.ACCESS_LAB_DATA;
  const $ = (id) => document.getElementById(id);
  const storagePrefix = "accessPracticeLab:v1";

  // ── v3 content module: additively merge new activities + full practice tests ──
  (function mergeV3() {
    const v3 = window.ACCESS_LAB_V3;
    if (!v3) return;
    const append = v3.appendActivities || {};
    for (const [domainName, levels] of Object.entries(append)) {
      const domain = DATA.domains[domainName];
      if (!domain) continue;
      for (const [levelKey, list] of Object.entries(levels)) {
        const level = domain.levels[levelKey];
        if (!level || !Array.isArray(list)) continue;
        const existing = new Set((level.activities || []).map((a) => a.id));
        level.activities = (level.activities || []).concat(
          list.filter((a) => a && a.id && !existing.has(a.id)),
        );
      }
    }
    DATA.tests = Array.isArray(v3.tests) ? v3.tests : [];
  })();
  if (!Array.isArray(DATA.tests)) DATA.tests = [];

  // ── v4 content module: domain-specific WIDA practice tests + worksheets ──
  (function mergeV4() {
    const v4 = window.ACCESS_LAB_V4;
    if (!v4) return;
    const append = v4.appendActivities || {};
    for (const [domainName, levels] of Object.entries(append)) {
      const domain = DATA.domains[domainName];
      if (!domain) continue;
      for (const [levelKey, list] of Object.entries(levels)) {
        const level = domain.levels[levelKey];
        if (!level || !Array.isArray(list)) continue;
        const existing = new Set((level.activities || []).map((a) => a.id));
        level.activities = (level.activities || []).concat(
          list.filter((a) => a && a.id && !existing.has(a.id)),
        );
      }
    }
    if (Array.isArray(v4.tests)) {
      const seen = new Set(DATA.tests.map((t) => t.id));
      DATA.tests = DATA.tests.concat(
        v4.tests.filter((t) => t && t.id && !seen.has(t.id)),
      );
    }
  })();

  // ── v5 content module: large catalog expansion (activities, worksheets,
  //    a second WIDA "mini" practice test per domain) ──
  (function mergeV5() {
    const v5 = window.ACCESS_LAB_V5;
    if (!v5) return;
    const append = v5.appendActivities || {};
    for (const [domainName, levels] of Object.entries(append)) {
      const domain = DATA.domains[domainName];
      if (!domain) continue;
      for (const [levelKey, list] of Object.entries(levels)) {
        const level = domain.levels[levelKey];
        if (!level || !Array.isArray(list)) continue;
        const existing = new Set((level.activities || []).map((a) => a.id));
        level.activities = (level.activities || []).concat(
          list.filter((a) => a && a.id && !existing.has(a.id)),
        );
      }
    }
    if (Array.isArray(v5.tests)) {
      const seen = new Set(DATA.tests.map((t) => t.id));
      DATA.tests = DATA.tests.concat(
        v5.tests.filter((t) => t && t.id && !seen.has(t.id)),
      );
    }
  })();

  const state = {
    mode: "hub",
    hubScope: "root",
    domain: null,
    level: null,
    activityIndex: 0,
    selected: {},
    multi: {},
    cloze: {},
    hot: {},
    order: {},
    attempts: {},
    feedback: {},
    sortAnswers: {},
    notes: {},
    selfChecks: {},
    practiced: {},
    results: {},
    studentName: "",
    pathway: localStorage.getItem(`${storagePrefix}:pathway`) || "A",
    complete: new Set(),
  };
  const coreDomains = ["Listening", "Speaking", "Reading", "Writing"];
  const pathwaySupport = {
    A: {
      name: "Newcomer",
      range: "WIDA 1.0-2.4",
      complexity: "Short directions, short sentences, and many visual clues.",
      vocabulary: "Large word bank with bilingual vocabulary support.",
      frames: "Full sentence frames students can copy and complete.",
      response: "Say or write 1-3 clear sentences.",
      wordGoal: 25,
    },
    B: {
      name: "Developing",
      range: "WIDA 2.5-3.5",
      complexity:
        "Connected sentences with reasons, examples, and school vocabulary.",
      vocabulary: "Medium word bank focused on key academic words.",
      frames: "Sentence starters plus Because / But / So expansion.",
      response: "Say or write 4-6 connected sentences.",
      wordGoal: 45,
    },
    C: {
      name: "Expanding",
      range: "WIDA 3.6-4.5+",
      complexity: "Longer explanations with evidence and comparison language.",
      vocabulary: "Smaller word bank so students choose precise words.",
      frames:
        "Light frames that prompt elaboration, evidence, and transitions.",
      response: "Say or write a developed paragraph.",
      wordGoal: 70,
    },
  };
  const domainPracticePlan = {
    Listening: {
      practice: "listen for main ideas, details, directions, and evidence",
      time: "5-8 minutes per activity",
      submit: "choose an answer, then explain your evidence",
    },
    Speaking: {
      practice: "plan, speak, record or rehearse, and self-check your answer",
      time: "5-7 minutes per prompt",
      submit: "a local recording or spoken practice checklist",
    },
    Reading: {
      practice: "read passages, charts, captions, and short school texts",
      time: "6-10 minutes per task",
      submit: "an answer plus a text-evidence sentence",
    },
    Writing: {
      practice: "write responses using vocabulary, frames, and expansion words",
      time: "8-12 minutes per task",
      submit: "a written response you can print or copy",
    },
  };
  const speakingCheck = [
    "Named the topic",
    "Used details",
    "Explained thinking",
    "Spoke clearly",
  ];
  const writingCheck = [
    "I answered every part of the prompt.",
    "I used vocabulary from the word bank.",
    "I expanded one idea with because, but, or so.",
    "I checked capitals, punctuation, and spacing.",
  ];
  const teacherPlans = [
    [
      "20-minute use plan",
      "2 minutes: choose domain and pathway. 12 minutes: complete one activity. 4 minutes: add evidence or self-check. 2 minutes: print or copy progress.",
    ],
    [
      "45-minute station rotation",
      "10 minutes Listening, 10 minutes Reading, 10 minutes Speaking, 10 minutes Writing, 5 minutes progress report and reflection.",
    ],
    [
      "What to tell students",
      "This is classroom practice inspired by ACCESS tasks. It is not an official WIDA test, and it is safe to try, revise, and ask for help.",
    ],
    [
      "Level guidance",
      "Newcomer uses full frames and larger word banks. Developing adds reasons and connected sentences. Expanding expects evidence, transitions, and a longer response.",
    ],
  ];
  const recordingState = {
    recorder: null,
    chunks: [],
    url: "",
    status: "No recording yet.",
  };

  function escapeHtml(value) {
    return String(value || "").replace(
      /[&<>"']/g,
      (ch) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[ch],
    );
  }

  function routeParts() {
    return window.location.pathname
      .replace(/^\/access-practice-lab\/?/, "")
      .split("/")
      .filter(Boolean);
  }

  function parseRoute() {
    const parts = routeParts();
    if (parts.length === 0) {
      return {
        mode: "hub",
        hubScope: "root",
        domain: null,
        level: null,
        activityIndex: null,
      };
    }
    const domain = parts[0];
    if (domain === "test") {
      const testId = parts[1] || (DATA.tests[0] && DATA.tests[0].id) || null;
      return {
        mode:
          testId && DATA.tests.some((t) => t.id === testId) ? "test" : "hub",
        hubScope: "root",
        domain: null,
        level: null,
        activityIndex: null,
        testId,
      };
    }
    if (!DATA.domains[domain]) {
      return {
        mode: "hub",
        hubScope: "root",
        domain: null,
        level: null,
        activityIndex: null,
      };
    }
    if (domain === "Model-Test") {
      if (parts.length >= 4) {
        return {
          mode: "practice",
          hubScope: null,
          domain,
          level: `${parts[1]}-${parts[2]}`,
          activityIndex: indexFromRoutePart(
            domain,
            `${parts[1]}-${parts[2]}`,
            parts[3],
          ),
        };
      }
      if (parts.length === 3) {
        return {
          mode: "hub",
          hubScope: "level",
          domain,
          level: `${parts[1]}-${parts[2]}`,
          activityIndex: null,
        };
      }
      return {
        mode: "hub",
        hubScope: "domain",
        domain,
        level: defaultLevel(domain),
        activityIndex: null,
      };
    }
    if (parts.length >= 3) {
      return {
        mode: "practice",
        hubScope: null,
        domain,
        level: parts[1],
        activityIndex: indexFromRoutePart(domain, parts[1], parts[2]),
      };
    }
    if (parts.length === 2) {
      const level = parts[1];
      if (!DATA.domains[domain]?.levels?.[level]) {
        return {
          mode: "hub",
          hubScope: "domain",
          domain,
          level: defaultLevel(domain),
          activityIndex: null,
        };
      }
      return {
        mode: "hub",
        hubScope: "level",
        domain,
        level,
        activityIndex: null,
      };
    }
    return {
      mode: "hub",
      hubScope: "domain",
      domain,
      level: defaultLevel(domain),
      activityIndex: null,
    };
  }

  function defaultLevel(domainName) {
    const domain = DATA.domains[domainName];
    return Object.keys(domain?.levels || {})[0] || "A";
  }

  function activeDomain() {
    if (!state.domain) return DATA.domains.Listening;
    return DATA.domains[state.domain] || DATA.domains.Listening;
  }

  function activeLevel() {
    if (!state.level) return { activities: [] };
    return activeDomain().levels[state.level] || { activities: [] };
  }

  function domainStats(domainName) {
    const domain = DATA.domains[domainName];
    const levels = Object.entries(domain?.levels || {});
    const activityCount = levels.reduce(
      (sum, [, level]) => sum + (level.activities?.length || 0),
      0,
    );
    return { levelCount: levels.length, activityCount };
  }

  function promptStepLabel(domainName, activity) {
    if (activity?.testPart) return "Read / listen";
    if (domainName === "Speaking") return "Read / say";
    if (domainName === "Reading") return "Read";
    if (domainName === "Writing") return "Read / write";
    if (domainName === "Listening") return "Listen / read";
    return "Read / listen";
  }

  function activities() {
    return activeLevel().activities || [];
  }

  function activeActivity() {
    const list = activities();
    return list[Math.min(state.activityIndex, Math.max(0, list.length - 1))];
  }

  function indexFromRoutePart(domainName, levelKey, part) {
    const list = DATA.domains[domainName]?.levels?.[levelKey]?.activities || [];
    if (!part) return 0;
    if (/^\d+$/.test(part)) return Math.max(0, Number(part) || 0);
    return Math.max(
      0,
      list.findIndex((activity) => activity.id === part),
    );
  }

  function storageKey(domain = state.domain, level = state.level) {
    return `${storagePrefix}:${domain}:${level}`;
  }

  function safeParse(value, fallback) {
    try {
      return JSON.parse(value);
    } catch {
      return fallback;
    }
  }

  function loadProgress() {
    state.studentName =
      localStorage.getItem(`${storagePrefix}:studentName`) || "";
    if (!state.domain || !state.level) return;
    const saved = safeParse(localStorage.getItem(storageKey()) || "{}", {});
    state.complete = new Set(
      Array.isArray(saved.complete) ? saved.complete : [],
    );
    state.selected = saved.selected || {};
    state.multi = saved.multi || {};
    state.cloze = saved.cloze || {};
    state.hot = saved.hot || {};
    state.order = saved.order || {};
    state.sortAnswers = saved.sortAnswers || {};
    state.attempts = saved.attempts || {};
    state.feedback = saved.feedback || {};
    state.notes = saved.notes || {};
    state.selfChecks = saved.selfChecks || {};
    state.practiced = saved.practiced || {};
    state.results = saved.results || {};
  }

  function saveProgress() {
    if (!state.domain || !state.level) return;
    const payload = {
      complete: [...state.complete],
      selected: state.selected,
      multi: state.multi,
      cloze: state.cloze,
      hot: state.hot,
      order: state.order,
      sortAnswers: state.sortAnswers,
      attempts: state.attempts,
      feedback: state.feedback,
      notes: state.notes,
      selfChecks: state.selfChecks,
      practiced: state.practiced,
      results: state.results,
    };
    localStorage.setItem(storageKey(), JSON.stringify(payload));
    localStorage.setItem(`${storagePrefix}:studentName`, state.studentName);
    showSaveStatus("Saved on this device.");
  }

  function hubUrl(domain, level) {
    if (!domain) return "/access-practice-lab/";
    if (!level) return `/access-practice-lab/${domain}`;
    if (domain === "Model-Test") {
      const [cluster, band, testLevel] = level.split("-");
      return `/access-practice-lab/Model-Test/${cluster}-${band}/${testLevel}`;
    }
    return `/access-practice-lab/${domain}/${level}`;
  }

  function practiceUrl(domain, level, activityId) {
    if (domain === "Model-Test") {
      const [cluster, band, testLevel] = level.split("-");
      return `/access-practice-lab/Model-Test/${cluster}-${band}/${testLevel}/${activityId}`;
    }
    return `/access-practice-lab/${domain}/${level}/${activityId}`;
  }

  function navigate(path) {
    history.pushState(
      {},
      "",
      path.startsWith("/") ? path : `/access-practice-lab/${path}`,
    );
    initFromRoute();
  }

  function setMode(mode) {
    state.mode = mode;
    document.body.classList.toggle("mode-hub", mode === "hub");
    document.body.classList.toggle("mode-practice", mode === "practice");
    document.body.classList.toggle("mode-test", mode === "test");
  }

  function domainLabel(name) {
    return name === "Model-Test" ? "Model Tests" : name;
  }

  function levelLabel(levelKey, level) {
    return (
      level?.displayLabel ||
      (levelKey === "Model-Test" ? levelKey : `Level ${levelKey}`)
    );
  }

  function pathwayKey(levelKey) {
    if (/B|3\.6|4\.5|Expanding/i.test(levelKey || "")) return "B";
    return "A";
  }

  function pathwayFor(levelKey) {
    return (
      pathwaySupport[state.pathway] ||
      pathwaySupport[pathwayKey(levelKey)] ||
      pathwaySupport.A
    );
  }

  function wordCount(text) {
    return (text || "").trim().split(/\s+/).filter(Boolean).length;
  }

  function slug(value) {
    return String(value || "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  }

  function bandFromScore(score, total) {
    if (!total || score <= 0) return "Not yet";
    const ratio = score / total;
    if (ratio >= 0.85) return "Strong practice response";
    if (ratio >= 0.6) return "Almost there";
    return "Getting started";
  }

  function badgeFromResult(result, done = false) {
    if (!result) return done ? "Practice Complete" : "Not Started";
    if (result.badge) return result.badge;
    if (result.band === "Strong practice response") return "Strong Practice";
    if (result.band === "Almost there") return "Practice Complete";
    if (result.band === "Not yet" || result.band === "Getting started")
      return "Needs Review";
    return "In Progress";
  }

  function resultStatusClass(label) {
    return slug(label || "not-started");
  }

  function bankTerms(activity) {
    return [
      ...(activity.wordBank || []),
      ...(activity.vocabulary || []).map(([term]) => term),
      ...(DATA.essentialTerms || []).map(([term]) => term),
    ]
      .filter(Boolean)
      .map((term) => String(term).split("/")[0].trim().toLowerCase())
      .filter(Boolean);
  }

  function makeResult(activity, details) {
    return {
      activityId: activity.id,
      title: activity.title,
      domain: state.domain,
      level: state.level,
      pathway: pathwayFor(state.level).name,
      date: new Date().toISOString(),
      teacherReviewRecommended:
        state.domain === "Speaking" ||
        state.domain === "Writing" ||
        details.badge === "Needs Review",
      ...details,
    };
  }

  // Unified auto-grader for every item type. `answer` is the stored response
  // (string for MC, array for multiSelect/hotText/order, map for cloze/sort).
  // Returns { auto: boolean, correct: boolean }. Used by both single-activity
  // practice and full test scoring so there is one source of truth.
  function gradeItem(item, answer) {
    const eqSet = (want, got) => {
      const a = [...(want || [])].map(String).sort().join("");
      const b = [...(got || [])].map(String).sort().join("");
      return a.length > 0 && a === b;
    };
    switch (item.type) {
      case "multiSelect":
        return { auto: true, correct: eqSet(item.answers, answer) };
      case "hotText":
        return { auto: true, correct: eqSet(item.answers, answer) };
      case "order": {
        const want = (item.answer || []).map(String).join("");
        const got = (answer || []).map(String).join("");
        return { auto: true, correct: want.length > 0 && want === got };
      }
      case "cloze": {
        const blanks = (item.segments || [])
          .filter((seg) => seg.blank)
          .map((seg) => seg.blank);
        const a = answer || {};
        return {
          auto: true,
          correct:
            blanks.length > 0 && blanks.every((b) => a[b.id] === b.answer),
        };
      }
      case "sort": {
        const a = answer || {};
        return {
          auto: true,
          correct:
            (item.items || []).length > 0 &&
            item.items.every((it) => a[it.id] === it.answer),
        };
      }
      case "constructed":
        return { auto: false, correct: false };
      case "multipleChoice":
      default:
        return {
          auto: true,
          correct: item.answer != null && answer === item.answer,
        };
    }
  }

  // Pull the stored answer for an activity out of the practice-mode state.
  function practiceAnswer(activity) {
    switch (activity.type) {
      case "multiSelect":
        return state.multi[activity.id] || [];
      case "hotText":
        return state.hot[activity.id] || [];
      case "order":
        return state.order[activity.id] || [];
      case "cloze":
        return state.cloze[activity.id] || {};
      case "sort":
        return state.sortAnswers[activity.id] || {};
      default:
        return state.selected[activity.id];
    }
  }

  function scoreSelectedActivity(activity, ok) {
    const domainName = domainLabel(state.domain);
    return makeResult(activity, {
      score: ok ? 1 : 0,
      total: 1,
      band: ok ? "Strong practice response" : "Getting started",
      badge: ok ? "Strong Practice" : "Needs Review",
      skillFeedback: ok
        ? activity.correct || `Strong ${domainName} practice.`
        : `Skill feedback: look back at the prompt, sentence, table, or chart that supports your answer.`,
      nextStep: ok
        ? `Try another ${domainName} task and explain your evidence.`
        : activity.support ||
          activity.hint ||
          "Reread or replay the prompt, then choose the answer with the strongest evidence.",
    });
  }

  function scoreSpeakingActivity(activity) {
    const checks = state.selfChecks[activity.id] || {};
    const checked = speakingCheck.filter((item) => checks[slug(item)]).length;
    const practiced = Boolean(state.practiced[activity.id]);
    const score = practiced ? checked : Math.max(0, checked - 1);
    const band = practiced
      ? bandFromScore(score, speakingCheck.length)
      : "Not yet";
    const missing = speakingCheck.find((item) => !checks[slug(item)]);
    return makeResult(activity, {
      score,
      total: speakingCheck.length,
      band,
      badge:
        band === "Strong practice response"
          ? "Strong Practice"
          : band === "Almost there"
            ? "Practice Complete"
            : "Needs Review",
      skillFeedback:
        "Speaking practice uses your self-check. A teacher should review the response for language growth.",
      nextStep: !practiced
        ? "Record or practice aloud, then complete the self-check."
        : missing
          ? `Practice again and focus on: ${missing.toLowerCase()}.`
          : "Share this response with a teacher or partner for feedback.",
    });
  }

  function scoreWritingActivity(activity) {
    const text = state.notes[activity.id] || "";
    const lower = text.toLowerCase();
    const support = pathwayFor(state.level);
    const words = wordCount(text);
    const terms = bankTerms(activity);
    const usedTerms = terms.filter((term) => lower.includes(term)).slice(0, 4);
    const checks = [
      {
        ok: words >= support.wordGoal,
        next: `Add more detail until you reach about ${support.wordGoal} words.`,
      },
      {
        ok: /\b(because|but|so|therefore|as a result|this shows|i know|explains?)\b/i.test(
          text,
        ),
        next: "Add because, but, or so to explain your thinking.",
      },
      {
        ok: usedTerms.length > 0,
        next: "Use at least one word from the vocabulary bank.",
      },
      {
        ok: /[.!?]/.test(text) && words >= 6,
        next: "Write at least one complete sentence with punctuation.",
      },
      {
        ok: /\b(evidence|detail|example|text says|table shows|chart shows|according to|shows)\b/i.test(
          text,
        ),
        next: "Add a detail or evidence word that points back to the prompt.",
      },
    ];
    const score = checks.filter((check) => check.ok).length;
    const band = bandFromScore(score, checks.length);
    const next = checks.find((check) => !check.ok)?.next;
    return makeResult(activity, {
      score,
      total: checks.length,
      band,
      badge:
        band === "Strong practice response"
          ? "Strong Practice"
          : band === "Almost there"
            ? "Practice Complete"
            : "Needs Review",
      skillFeedback: `Writing practice score checks word count, explanation language, vocabulary, complete sentences, and evidence/detail words. Vocabulary used: ${usedTerms.length ? usedTerms.join(", ") : "none yet"}.`,
      nextStep:
        next || "Read your response aloud and ask a teacher to review it.",
    });
  }

  function allProgressRows() {
    return coreDomains.map((domainName) => {
      const domain = DATA.domains[domainName];
      const levels = Object.entries(domain?.levels || {});
      const total = levels.reduce(
        (sum, [, level]) => sum + (level.activities?.length || 0),
        0,
      );
      const resultList = [];
      const done = levels.reduce((sum, [levelKey]) => {
        const saved = safeParse(
          localStorage.getItem(storageKey(domainName, levelKey)) || "{}",
          {},
        );
        resultList.push(...Object.values(saved.results || {}));
        return (
          sum + (Array.isArray(saved.complete) ? saved.complete.length : 0)
        );
      }, 0);
      const scored = resultList.filter((result) => Number(result.total) > 0);
      const score = scored.reduce(
        (sum, result) => sum + Number(result.score || 0),
        0,
      );
      const scoreTotal = scored.reduce(
        (sum, result) => sum + Number(result.total || 0),
        0,
      );
      const latestNeedsReview = [...scored]
        .reverse()
        .find((result) => badgeFromResult(result) === "Needs Review");
      const best = scored.reduce((winner, result) => {
        const ratio =
          Number(result.score || 0) / Math.max(1, Number(result.total || 1));
        const bestRatio = winner
          ? Number(winner.score || 0) / Math.max(1, Number(winner.total || 1))
          : -1;
        return ratio > bestRatio ? result : winner;
      }, null);
      const avg = scoreTotal ? score / scoreTotal : 0;
      const badge = scoreTotal
        ? avg >= 0.85
          ? "Strong Practice"
          : latestNeedsReview
            ? "Needs Review"
            : "Practice Complete"
        : done
          ? "In Progress"
          : "Not Started";
      return {
        domainName,
        done,
        total,
        score,
        scoreTotal,
        resultList,
        badge,
        band: scoreTotal ? bandFromScore(score, scoreTotal) : "Not started",
        strongestBand: best?.band || "Not started",
        nextStep:
          latestNeedsReview?.nextStep ||
          (done
            ? `Complete another ${domainName} task and explain your evidence.`
            : `Start one ${domainName} practice task.`),
      };
    });
  }

  function reportSummary() {
    const rows = allProgressRows();
    const scored = rows.filter((row) => row.scoreTotal > 0);
    const strongest =
      scored.reduce((winner, row) => {
        const ratio = row.score / Math.max(1, row.scoreTotal);
        const bestRatio = winner
          ? winner.score / Math.max(1, winner.scoreTotal)
          : -1;
        return ratio > bestRatio ? row : winner;
      }, null)?.domainName || "Not enough practice yet";
    const next =
      rows.find((row) => row.badge === "Needs Review") ||
      rows.find((row) => row.done < row.total) ||
      rows[0];
    return {
      rows,
      strongest,
      nextDomain: next?.domainName || "Choose any domain",
    };
  }

  function pathwayLink(domainName, levelKey) {
    const first = DATA.domains[domainName]?.levels?.[levelKey]?.activities?.[0];
    return first
      ? practiceUrl(domainName, levelKey, first.id)
      : hubUrl(domainName, levelKey);
  }

  function getProgressFor(domainName, levelName) {
    const domain = DATA.domains[domainName];
    const total = domain?.levels?.[levelName]?.activities?.length || 0;
    const saved = safeParse(
      localStorage.getItem(storageKey(domainName, levelName)) || "{}",
      {},
    );
    const done = Array.isArray(saved.complete) ? saved.complete.length : 0;
    return total ? `${done}/${total} done` : "coming soon";
  }

  function renderHub() {
    document.body.dataset.hubScope = state.hubScope;
    const isRoot = state.hubScope === "root";
    const isDomain = state.hubScope === "domain";
    const isLevel = state.hubScope === "level";
    const domain = state.domain ? activeDomain() : null;
    const level = state.level ? activeLevel() : null;
    const levelName = level ? levelLabel(state.level, level) : "";
    const domainName = state.domain ? domainLabel(state.domain) : "";

    if (isRoot) {
      $("hubEyebrow").textContent = "WIDA ACCESS-style practice";
      $("hubTitle").textContent = DATA.productTitle;
      $("hubLead").textContent =
        "Choose a domain, choose your support level, practice, check your work, and print a classroom practice report.";
      $("studentGoal").textContent =
        "Students practice one task at a time with vocabulary, sentence frames, self-checks, and local feedback.";
      $("studentObjective").innerHTML =
        `<p class="muted">Teacher note: these are original classroom practice tasks inspired by ACCESS-style skills, not official WIDA test content.</p>`;
      $("activityGridSubtitle").textContent =
        "Select a domain to see activities.";
      document.title = `${DATA.productTitle} | EduWonderLab`;
    } else if (isDomain) {
      $("hubEyebrow").textContent = domainName;
      $("hubTitle").textContent = domainName;
      $("hubLead").textContent =
        `${domain.description} Pick a level, then share an activity link.`;
      $("studentGoal").textContent = "";
      $("studentObjective").innerHTML = "";
      $("activityGridSubtitle").textContent =
        `Choose a level for ${domainName}.`;
      document.title = `${DATA.productTitle} · ${domainName} | EduWonderLab`;
      $("labHero")?.style.setProperty(
        "--domain-color",
        domain.color || "#0f766e",
      );
    } else {
      $("hubEyebrow").textContent = `${domainName} · ${levelName}`;
      $("hubTitle").textContent = `${domainName} ${levelName}`;
      $("hubLead").textContent =
        `${domain.description} Open a practice page or copy a link for students.`;
      $("studentGoal").textContent = level.studentGoal || "";
      $("studentObjective").innerHTML = [
        level.objective ? `<span>${escapeHtml(level.objective)}</span>` : "",
        level.target ? `<span>${escapeHtml(level.target)}</span>` : "",
        level.teacherSummary
          ? `<p class="muted">${escapeHtml(level.teacherSummary)}</p>`
          : "",
      ]
        .filter(Boolean)
        .join(" ");
      $("activityGridSubtitle").textContent =
        `${activities().length} activities · ${getProgressFor(state.domain, state.level)} on this device`;
      document.title = `${DATA.productTitle} · ${domainName} ${levelName} | EduWonderLab`;
      $("labHero")?.style.setProperty(
        "--domain-color",
        domain.color || "#0f766e",
      );
    }

    renderDomainOverview();
    renderTestLabGrid();
    renderPathways();
    renderReadinessLab();
    renderProgressTracker();
    renderTeacherQuickUse();
    renderDomainTabs();
    renderHubLevelTabs();
    renderActivityGrid();
    renderQuickLinks();
    renderLinkBoard();
    renderLearnerTools();
  }

  function renderDomainOverview() {
    const grid = $("domainOverviewGrid");
    if (!grid) return;
    grid.innerHTML = coreDomains
      .map((name) => [name, DATA.domains[name]])
      .filter(([, domain]) => domain)
      .map(([name, domain]) => {
        const stats = domainStats(name);
        const plan = domainPracticePlan[name];
        const progress = allProgressRows().find(
          (row) => row.domainName === name,
        );
        const badge = progress?.badge || "Not Started";
        const levels = Object.entries(domain.levels || {})
          .map(([levelKey, level]) => {
            const href = hubUrl(name, levelKey);
            return `<a class="level-chip" href="${href}">${escapeHtml(levelLabel(levelKey, level))}</a>`;
          })
          .join("");
        const domainTests = (DATA.tests || []).filter((t) => t.domain === name);
        const testLink = domainTests.length
          ? `<div class="wida-test-links">${domainTests
              .map(
                (t, i) =>
                  `<a class="primary-link wida-test-link" href="/access-practice-lab/test/${escapeHtml(t.id)}">📝 ${i === 0 ? "WIDA Practice Test" : "WIDA Practice Test (Mini)"}</a>`,
              )
              .join("")}</div>`
          : "";
        return `
        <article class="domain-overview-card" style="--domain-color:${domain.color}">
            <div class="domain-overview-head">
              <span class="domain-tab-icon">${escapeHtml(domain.icon)}</span>
              <h3>${escapeHtml(domainLabel(name))}</h3>
              <span class="score-badge ${resultStatusClass(badge)}">${escapeHtml(badge)}</span>
            </div>
            <p>${escapeHtml(domain.description)}</p>
            <dl class="domain-practice-list">
              <div><dt>Practice</dt><dd>${escapeHtml(plan.practice)}</dd></div>
              <div><dt>Time</dt><dd>${escapeHtml(plan.time)}</dd></div>
              <div><dt>Complete</dt><dd>${escapeHtml(plan.submit)}</dd></div>
            </dl>
            <p class="domain-overview-meta">${stats.levelCount} pathways · ${stats.activityCount} practice tasks</p>
            <div class="level-chip-row">${levels}</div>
            ${testLink}
            <a class="primary-link" href="${hubUrl(name, null)}">Open ${escapeHtml(domainLabel(name))} dashboard</a>
          </article>
        `;
      })
      .join("");
  }

  function renderPathways() {
    const grid = $("levelPathwayGrid");
    if (!grid) return;
    grid.innerHTML = [
      ["A", "Newcomer", "Listening", "A"],
      ["B", "Developing", "Reading", "B"],
      ["C", "Expanding", "Writing", "B"],
    ]
      .map(([supportKey, displayName, startDomain, routeLevel]) => {
        const support =
          displayName === "Developing"
            ? {
                ...pathwaySupport.B,
                name: displayName,
                range: "WIDA 2.5-3.5",
                wordGoal: 45,
              }
            : displayName === "Expanding"
              ? pathwaySupport.C
              : pathwaySupport.A;
        const href = pathwayLink(startDomain, routeLevel);
        return `
            <article class="pathway-card">
              <p class="pathway-range">${escapeHtml(support.range)}</p>
              <h3>${escapeHtml(support.name)}</h3>
              <ul>
                <li>${escapeHtml(support.complexity)}</li>
                <li>${escapeHtml(support.vocabulary)}</li>
                <li>${escapeHtml(support.frames)}</li>
                <li>${escapeHtml(support.response)}</li>
              </ul>
              <div class="pathway-actions">
                <button type="button" class="ghost-btn ${state.pathway === supportKey ? "active" : ""}" data-pathway="${supportKey}">Use this support</button>
                <a class="primary-link" href="${href}">Try ${escapeHtml(support.name)} practice</a>
              </div>
            </article>
          `;
      })
      .join("");
  }

  function renderReadinessLab() {
    const panel = $("readinessLab");
    if (!panel) return;
    panel.innerHTML = `
        <div class="readiness-card">
          <h3>1. Click an answer</h3>
          <fieldset class="mini-choice-set" aria-label="Practice choosing an answer">
            <label><input type="radio" name="toolClickPractice" /> A</label>
            <label><input type="radio" name="toolClickPractice" /> B</label>
            <label><input type="radio" name="toolClickPractice" /> C</label>
          </fieldset>
        </div>
        <div class="readiness-card">
          <h3>2. Listen or read</h3>
          <p id="readinessScript">Practice sentence: Read the question, choose an answer, then explain your thinking.</p>
          <button type="button" class="listen-btn" data-readiness-speak>Read aloud</button>
        </div>
        <div class="readiness-card">
          <h3>3. Type a response</h3>
          <textarea rows="3" data-readiness-text placeholder="Type one practice sentence here."></textarea>
        </div>
        <div class="readiness-card">
          <h3>4. Speak or simulate</h3>
          <p>Practice aloud. Recording is available inside Speaking tasks when your browser allows it.</p>
          <label><input type="checkbox" /> I practiced aloud.</label>
        </div>
        <div class="readiness-card">
          <h3>5. Move and check</h3>
          <div class="tool-actions">
            <button type="button" data-readiness-prev>Back</button>
            <button type="button" data-readiness-next>Next</button>
            <button type="button" data-readiness-check>Check tools</button>
          </div>
          <p class="muted" id="readinessStatus">Try each tool before you begin.</p>
        </div>
      `;
  }

  function renderProgressTracker() {
    const tracker = $("progressTracker");
    if (!tracker) return;
    const summary = reportSummary();
    const rows = summary.rows;
    const totalDone = rows.reduce((sum, row) => sum + row.done, 0);
    const totalTasks = rows.reduce((sum, row) => sum + row.total, 0);
    const today = new Date().toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
    tracker.innerHTML = `
        <label class="progress-name">
          <span>Student name or initials (optional)</span>
          <input id="studentName" type="text" autocomplete="off" placeholder="First name or initials" value="${escapeHtml(state.studentName)}" />
        </label>
        <div class="progress-summary">
          <strong>${totalDone}/${totalTasks}</strong>
          <span>practice tasks completed on this browser</span>
          <span class="score-badge ${resultStatusClass(rows.some((row) => row.badge === "Strong Practice") ? "Strong Practice" : totalDone ? "In Progress" : "Not Started")}">${escapeHtml(totalDone ? "ACCESS-style practice report ready" : "Not Started")}</span>
        </div>
        <section class="practice-report" aria-label="ACCESS-style practice report">
          <div class="report-head">
            <div>
              <p class="eyebrow">ACCESS-style practice report</p>
              <h3>${escapeHtml(state.studentName || "Student")} · ${escapeHtml(today)}</h3>
              <p>This is classroom practice feedback, not an official WIDA ACCESS score.</p>
            </div>
            <div class="report-summary-chip">
              <span>Support level</span>
              <strong>${escapeHtml(pathwayFor(state.level).name)}</strong>
            </div>
          </div>
          <div class="report-highlights">
            <p><strong>Strongest domain:</strong> ${escapeHtml(summary.strongest)}</p>
            <p><strong>Next domain to practice:</strong> ${escapeHtml(summary.nextDomain)}</p>
            <p><strong>Teacher review:</strong> Recommended for speaking, writing, and any Needs Review band.</p>
          </div>
          <div class="progress-domain-grid">
          ${rows
            .map(
              (row) => `
              <article>
                <div class="domain-report-title">
                  <h3>${escapeHtml(row.domainName)}</h3>
                  <span class="score-badge ${resultStatusClass(row.badge)}">${escapeHtml(row.badge)}</span>
                </div>
                <p>${row.done}/${row.total} complete · ${row.scoreTotal ? `${row.score}/${row.scoreTotal} practice points` : "no score yet"}</p>
                <p><strong>Practice band:</strong> ${escapeHtml(row.band)}</p>
                <p><strong>Next step:</strong> ${escapeHtml(row.nextStep)}</p>
              </article>
            `,
            )
            .join("")}
          </div>
        </section>
        <div class="tool-actions">
          <button type="button" data-update-report>Update My Report</button>
          <button type="button" data-print-report>Print Practice Report</button>
          <button type="button" data-clear-all-progress>Clear My Practice Data</button>
        </div>
        <p class="muted">No login, upload, or private student data collection. This page only uses this browser's local storage.</p>
      `;
  }

  function renderTeacherQuickUse() {
    const grid = $("teacherQuickUse");
    if (!grid) return;
    const scoringGuide = [
      [
        "Not yet",
        "Reteach the task language, model one response, and let the student try again with a partner.",
      ],
      [
        "Getting started",
        "Keep the frame visible, reduce choices, and ask for one clear detail or evidence word.",
      ],
      [
        "Almost there",
        "Ask the student to add a reason, evidence sentence, or clearer academic vocabulary.",
      ],
      [
        "Strong practice response",
        "Invite peer sharing, a second prompt, or teacher feedback for precision and fluency.",
      ],
    ];
    grid.innerHTML =
      teacherPlans
        .map(
          ([title, text]) => `
            <article class="teacher-plan-card">
              <h4>${escapeHtml(title)}</h4>
              <p>${escapeHtml(text)}</p>
            </article>
          `,
        )
        .join("") +
      `
          <article class="teacher-plan-card scoring-guide-card">
            <h4>Practice scoring guide</h4>
            <p>This report gives classroom practice feedback only. It is not an official ACCESS score, level, or placement decision.</p>
            <dl>
              ${scoringGuide.map(([band, move]) => `<div><dt>${escapeHtml(band)}</dt><dd>${escapeHtml(move)}</dd></div>`).join("")}
            </dl>
            <p><strong>Small-group moves:</strong> replay the prompt, highlight evidence, rehearse sentence frames, and conference briefly on speaking/writing.</p>
          </article>
        `;
  }

  function renderDomainTabs() {
    const tabs = $("domainTabs");
    if (!tabs) return;
    tabs.innerHTML = Object.entries(DATA.domains)
      .map(([name, domain]) => {
        const active = name === state.domain;
        const href = hubUrl(name, null);
        return `
        <a class="domain-tab ${active ? "active" : ""}" href="${href}" style="--domain-color:${domain.color}">
          <span class="domain-tab-icon">${escapeHtml(domain.icon)}</span>
          <span class="domain-tab-label">${escapeHtml(domainLabel(name))}</span>
        </a>
      `;
      })
      .join("");
  }

  function renderHubLevelTabs() {
    const tabs = $("hubLevelTabs");
    if (!tabs || !state.domain) {
      if (tabs) tabs.innerHTML = "";
      return;
    }
    const domain = activeDomain();
    tabs.innerHTML = Object.entries(domain.levels || {})
      .map(([levelKey, level]) => {
        const active = levelKey === state.level;
        const href = hubUrl(state.domain, levelKey);
        const firstActivity = level.activities?.[0];
        const sampleHref = firstActivity
          ? practiceUrl(state.domain, levelKey, firstActivity.id)
          : href;
        return `
        <article class="level-tab ${active ? "active" : ""}">
          <a class="level-tab-main" href="${href}">
            <strong>${escapeHtml(levelLabel(levelKey, level))}</strong>
            <span>${escapeHtml(level.time || "Flexible time")} · ${level.activities?.length || 0} activit${(level.activities?.length || 0) === 1 ? "y" : "ies"} · ${getProgressFor(state.domain, levelKey)}</span>
            ${firstActivity ? `<em class="level-tab-sample">Sample: ${escapeHtml(firstActivity.title)}</em>` : ""}
          </a>
          <div class="level-tab-actions">
            <a class="ghost-btn" href="${href}">Browse activities</a>
            ${firstActivity ? `<a class="primary-link" href="${sampleHref}">Open first activity</a>` : ""}
          </div>
        </article>
      `;
      })
      .join("");
  }

  function renderActivityGrid() {
    const grid = $("activityGrid");
    if (!grid) return;
    if (state.hubScope !== "level") {
      grid.innerHTML =
        state.hubScope === "root"
          ? `<p class="empty-state">Choose a domain above to browse levels and activities.</p>`
          : `<p class="empty-state">Choose a level above to see shareable activity pages.</p>`;
      return;
    }
    const list = activities();
    const itemLabel = state.domain === "Model-Test" ? "Item" : "Activity";
    $("activityGrid").innerHTML =
      modelTestRecapHTML() +
        list
          .map((activity, index) => {
            const href = practiceUrl(state.domain, state.level, activity.id);
            const done = state.complete.has(activity.id);
            const result = state.results[activity.id];
            const badge = badgeFromResult(result, done);
            return `
        <article class="activity-card-hub ${done ? "is-done" : ""}">
          <div class="activity-card-head">
            <span class="activity-card-num">${done ? "✓" : `${itemLabel} ${index + 1}`}</span>
            <span class="activity-card-time">${escapeHtml(activity.time)}</span>
          </div>
          <h3>${escapeHtml(activity.title)}</h3>
          <span class="score-badge ${resultStatusClass(badge)}">${escapeHtml(badge)}</span>
          <p class="activity-card-skill">${escapeHtml(activity.skill)}</p>
          <p class="activity-card-directions">${escapeHtml(activity.directions)}</p>
          <div class="activity-card-actions">
            <a class="primary-link" href="${href}">Open practice page</a>
            <button type="button" class="ghost-btn" data-copy-link="${href}">Copy link</button>
          </div>
        </article>
      `;
          })
          .join("") ||
      `<p class="empty-state">No activities for this level yet.</p>`;
  }

  function renderQuickLinks() {
    const links = [];
    for (const [domainName, domain] of Object.entries(DATA.domains)) {
      for (const [levelKey, level] of Object.entries(domain.levels || {})) {
        const first = level.activities?.[0];
        if (!first) continue;
        const href = practiceUrl(domainName, levelKey, first.id);
        const title = `${domainLabel(domainName)} · ${levelLabel(levelKey, level)}`;
        const desc = first.title;
        links.push([href, title, desc]);
      }
    }
    $("quickTestLinks").innerHTML = links
      .map(
        ([href, title, desc]) => `
      <a href="${href}">
        <strong>${escapeHtml(title)}</strong>
        <span>${escapeHtml(desc)}</span>
      </a>
    `,
      )
      .join("");
  }

  function renderLinkBoard() {
    const sections = [];
    for (const [domainName, domain] of Object.entries(DATA.domains)) {
      for (const [levelKey, level] of Object.entries(domain.levels || {})) {
        const label =
          domainName === "Model-Test"
            ? levelLabel(levelKey, level)
            : `${domainLabel(domainName)} ${levelLabel(levelKey, level)}`;
        const links = (level.activities || [])
          .map((activity, index) => {
            const href = practiceUrl(domainName, levelKey, activity.id);
            return `<a href="${href}">${index + 1}. ${escapeHtml(activity.title)}</a>`;
          })
          .join("");
        if (links)
          sections.push(
            `<section><h4>${escapeHtml(label)}</h4>${links}</section>`,
          );
      }
    }
    $("linkBoardGrid").innerHTML = sections.join("");
  }

  function renderPracticeHeader() {
    const level = activeLevel();
    const activity = activeActivity();
    const list = activities();
    const levelName = levelLabel(state.level, level);
    const itemLabel = state.domain === "Model-Test" ? "Item" : "Activity";
    const index = Math.min(state.activityIndex, Math.max(0, list.length - 1));

    $("practiceMeta").innerHTML = `
      <span>${escapeHtml(domainLabel(state.domain))}</span>
      <span aria-hidden="true">·</span>
      <span>${escapeHtml(levelName)}</span>
      <span aria-hidden="true">·</span>
      <span>${itemLabel} ${index + 1} of ${list.length}</span>
    `;

    const domain = activeDomain();
    const levelLinks = Object.entries(domain.levels || {})
      .map(([levelKey, lvl]) => {
        const active = levelKey === state.level;
        const firstId = lvl.activities?.[0]?.id || 0;
        const href = practiceUrl(
          state.domain,
          levelKey,
          activity?.id && lvl.activities?.some((a) => a.id === activity.id)
            ? activity.id
            : firstId,
        );
        return `<a class="level-pill ${active ? "active" : ""}" href="${href}">${escapeHtml(levelLabel(levelKey, lvl))}</a>`;
      })
      .join("");
    const supportLinks = Object.entries(pathwaySupport)
      .map(
        ([key, support]) =>
          `<button type="button" class="level-pill pathway-pill ${state.pathway === key ? "active" : ""}" data-pathway="${key}">${escapeHtml(support.name)}</button>`,
      )
      .join("");
    $("practiceLevelSwitch").innerHTML = `
        <div class="switch-group" aria-label="Activity level">${levelLinks}</div>
        <div class="switch-group" aria-label="WIDA support pathway">${supportLinks}</div>
      `;

    document.title = activity
      ? `${activity.title} · ${domainLabel(state.domain)} ${levelName} | EduWonderLab`
      : `${DATA.productTitle} | EduWonderLab`;

    $("backToHubBtn").onclick = () =>
      navigate(hubUrl(state.domain, state.level));
  }

  function listHTML(items) {
    if (!items?.length) return "";
    return `<ul>${items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`;
  }

  function vocabularyHTML(activity) {
    const terms = activity.vocabulary || [];
    const essential = DATA.essentialTerms || [];
    if (!terms.length && !essential.length) return "";
    return `
      <section class="support-box">
        <h4>Key vocabulary</h4>
        <dl>${terms.map(([term, meaning, spanish]) => `<div><dt>${escapeHtml(term)}</dt><dd>${escapeHtml(meaning)}${spanish ? `<span class="vocab-es" lang="es">🌐 ${escapeHtml(spanish)}<button type="button" class="vocab-es-speak" data-es="${escapeHtml(spanish)}" aria-label="Escuchar en español">🔊</button></span>` : ""}</dd></div>`).join("")}</dl>
        ${essential.length ? `<p class="spanish-mini"><strong>English / Spanish:</strong> ${essential.map(([en, es]) => `${escapeHtml(en)} / ${escapeHtml(es)}`).join("; ")}</p>` : ""}
      </section>
    `;
  }

  function frameHTML(activity) {
    if (!activity.frames?.length) return "";
    return `<section class="support-box"><h4>Sentence frames</h4>${listHTML(activity.frames)}</section>`;
  }

  function trackerHTML(activity) {
    if (!activity.tracker && !activity.wordBank) return "";
    const tracker = activity.tracker || [];
    const wordBank = activity.wordBank || [];
    return `
      <section class="support-box">
        <h4>Detail tracker</h4>
        ${tracker.map(([label, value]) => `<p><strong>${escapeHtml(label)}</strong> ${escapeHtml(value)}</p>`).join("")}
        ${wordBank.length ? `<p><strong>Word bank:</strong> ${wordBank.map(escapeHtml).join(", ")}</p>` : ""}
      </section>
    `;
  }

  function helpHTML(activity) {
    const focus = activity.listenFor?.length
      ? ["What to listen for", activity.listenFor]
      : activity.readFor?.length
        ? ["What to read for", activity.readFor]
        : activity.sayFor?.length
          ? ["What to say", activity.sayFor]
          : null;
    const focusBox = focus
      ? `<section class="support-box"><h4>${escapeHtml(focus[0])}</h4>${listHTML(focus[1])}</section>`
      : "";
    const support = [
      focusBox,
      vocabularyHTML(activity),
      frameHTML(activity),
      trackerHTML(activity),
    ]
      .filter(Boolean)
      .join("");
    if (!support) return "";
    return `
      <details class="help-drawer">
        <summary>Need help? Vocabulary &amp; frames</summary>
        <div class="help-drawer-body">${support}</div>
      </details>
    `;
  }

  function multipleChoiceHTML(activity) {
    const selected = state.selected[activity.id];
    return `
      <fieldset class="choice-set">
        <legend class="visually-hidden">Choose the best answer</legend>
        ${activity.options
          .map(
            (option) => `
          <label class="choice-card ${selected === option.id ? "selected" : ""}">
            <input type="radio" name="answer" value="${escapeHtml(option.id)}" ${selected === option.id ? "checked" : ""} />
            <span class="choice-visual" aria-hidden="true">${escapeHtml(option.visual || "")}</span>
            <span>${escapeHtml(option.text)}</span>
          </label>
        `,
          )
          .join("")}
      </fieldset>
      <button class="primary-action" type="button" data-check>${state.domain === "Model-Test" ? "Check answer" : "Check my answer"}</button>
    `;
  }

  function worksheetHTML(activity) {
    const sheet = Array.isArray(activity.sheet) ? activity.sheet : [];
    const body = sheet
      .map(
        (sec) => `
        <section class="worksheet-section">
          <h4>${escapeHtml(sec.heading || "")}</h4>
          <ul class="worksheet-lines">
            ${(sec.items || [])
              .map((line) => `<li>${escapeHtml(line)}</li>`)
              .join("")}
          </ul>
        </section>`,
      )
      .join("");
    return `
      <div class="worksheet" id="worksheetPrintable">
        ${activity.directions ? `<p class="worksheet-intro">${escapeHtml(activity.directions)}</p>` : ""}
        ${body}
        <p class="worksheet-name-line">Name: ____________________   Date: ____________</p>
      </div>
      <div class="worksheet-actions">
        <button class="primary-action" type="button" data-print-report>🖨️ Print this worksheet</button>
        <button class="ghost-btn" type="button" data-mark>Mark as done</button>
      </div>
    `;
  }

  function constructedHTML(activity) {
    const note = state.notes[activity.id] || "";
    const count = wordCount(note);
    const support = pathwayFor(state.level);
    const isWriting = state.domain === "Writing";
    const isSpeaking = state.domain === "Speaking";
    const minWords = isWriting
      ? support.wordGoal
      : Math.max(12, Math.round(support.wordGoal / 2));
    return `
        ${isWriting ? writingPracticeHTML(activity, count, minWords) : ""}
        ${isSpeaking ? speakingPracticeHTML(activity) : ""}
        <label class="constructed-response">
          <span>${escapeHtml(activity.responseLabel || "Type your response")}</span>
          <textarea data-note rows="6" placeholder="${escapeHtml(activity.responsePlaceholder || "Use the frame and write your answer here.")}">${escapeHtml(note)}</textarea>
        </label>
        <p class="word-meter ${count >= minWords ? "is-ready" : ""}">${count}/${minWords} words for this pathway</p>
        ${isWriting ? selfCheckHTML("Writing self-check", writingCheck, activity) : ""}
        ${isSpeaking ? selfCheckHTML("Speaking self-check", speakingCheck, activity) : ""}
        <button class="primary-action" type="button" data-check>Save response</button>
      `;
  }

  function speakingAnswerHTML(activity) {
    const note = state.notes[activity.id] || "";
    return `
        ${speakingPracticeHTML(activity)}
        <label class="constructed-response">
          <span>Planning notes (optional)</span>
          <textarea data-note rows="4" placeholder="Topic: ___. Details: ___. Why: ___.">${escapeHtml(note)}</textarea>
        </label>
        ${selfCheckHTML("Speaking self-check", speakingCheck, activity)}
        <button class="primary-action" type="button" data-check>Save speaking practice</button>
      `;
  }

  function selfCheckHTML(title, items, activity) {
    const checks = state.selfChecks[activity.id] || {};
    return `
        <section class="self-check" aria-label="${escapeHtml(title)}">
          <h4>${escapeHtml(title)}</h4>
          ${items
            .map((item) => {
              const key = slug(item);
              return `<label><input type="checkbox" data-self-check="${escapeHtml(key)}" ${checks[key] ? "checked" : ""} /> ${escapeHtml(item)}</label>`;
            })
            .join("")}
        </section>
      `;
  }

  function writingPracticeHTML(activity, count, minWords) {
    const bank = [
      ...(activity.wordBank || []),
      ...(activity.vocabulary || []).map(([term]) => term),
    ]
      .filter(Boolean)
      .slice(0, pathwayKey(state.level) === "A" ? 10 : 7);
    const frames = activity.frames?.length
      ? activity.frames
      : [
          "I think ___ because ___.",
          "One detail is ___.",
          "This is important because ___.",
        ];
    return `
        <section class="practice-support writing-support">
          <h3>Writing support</h3>
          <p>Goal: write at least ${minWords} words. Current count: ${count}.</p>
          ${bank.length ? `<p><strong>Vocabulary bank:</strong> ${bank.map(escapeHtml).join(", ")}</p>` : ""}
          <div class="frame-bank">
            ${frames.map((frame) => `<span>${escapeHtml(frame)}</span>`).join("")}
          </div>
          <div class="because-but-so">
            <strong>Expand one idea:</strong>
            <span>Because gives a reason.</span>
            <span>But shows a contrast.</span>
            <span>So explains a result.</span>
          </div>
        </section>
      `;
  }

  function speakingPracticeHTML(activity) {
    const planningWords = [
      ...(activity.wordBank || []),
      ...(activity.vocabulary || []).map(([term]) => term),
    ]
      .filter(Boolean)
      .slice(0, 8);
    const canRecord = Boolean(
      navigator.mediaDevices?.getUserMedia && window.MediaRecorder,
    );
    return `
        <section class="practice-support speaking-support">
          <h3>Speaking practice studio</h3>
          <p>Plan for 30 seconds, speak clearly, then listen to yourself or use the aloud checklist.</p>
          <label class="practice-confirm"><input type="checkbox" data-practiced-speaking ${state.practiced[activity.id] ? "checked" : ""} /> I recorded or practiced aloud.</label>
          ${planningWords.length ? `<p><strong>Planning words:</strong> ${planningWords.map(escapeHtml).join(", ")}</p>` : ""}
          ${activity.frames?.length ? `<div class="frame-bank">${activity.frames.map((frame) => `<span>${escapeHtml(frame)}</span>`).join("")}</div>` : ""}
          ${
            canRecord
              ? `
                <div class="recording-controls">
                  <button type="button" data-record-start>Record</button>
                  <button type="button" data-record-stop>Stop</button>
                  <button type="button" data-record-clear>Re-record</button>
                </div>
                <p class="recording-status" id="recordingStatus">${escapeHtml(recordingState.status)}</p>
                ${recordingState.url ? `<audio controls src="${recordingState.url}"></audio>` : ""}
                <p class="muted">Recording stays only in this browser tab and is not uploaded.</p>
              `
              : `
                <p class="fallback-note">Recording is not available in this browser. Practice aloud, then check the boxes.</p>
              `
          }
        </section>
      `;
  }

  function sortHTML(activity) {
    const answers = state.sortAnswers[activity.id] || {};
    return `
      <div class="sort-list">
        ${activity.items
          .map(
            (item) => `
          <div class="sort-row">
            <p>${escapeHtml(item.text)}</p>
            <label>
              <span class="visually-hidden">Category for ${escapeHtml(item.text)}</span>
              <select data-sort-item="${escapeHtml(item.id)}">
                <option value="">Choose a category</option>
                ${activity.categories
                  .map(
                    (category) => `
                  <option value="${escapeHtml(category)}" ${answers[item.id] === category ? "selected" : ""}>${escapeHtml(category)}</option>
                `,
                  )
                  .join("")}
              </select>
            </label>
          </div>
        `,
          )
          .join("")}
      </div>
      <button class="primary-action" type="button" data-check>Check my sort</button>
    `;
  }

  function multiSelectHTML(activity) {
    const chosen = new Set(state.multi[activity.id] || []);
    return `
      <fieldset class="choice-set multi-select-set">
        <legend class="visually-hidden">Choose all correct answers</legend>
        ${activity.options
          .map(
            (option) => `
          <label class="choice-card ${chosen.has(option.id) ? "selected" : ""}">
            <input type="checkbox" data-multi="${escapeHtml(option.id)}" ${chosen.has(option.id) ? "checked" : ""} />
            ${option.visual ? `<span class="choice-visual" aria-hidden="true">${escapeHtml(option.visual)}</span>` : ""}
            <span>${escapeHtml(option.text)}</span>
          </label>
        `,
          )
          .join("")}
      </fieldset>
      <p class="field-hint">Tip: more than one answer can be correct.</p>
      <button class="primary-action" type="button" data-check>Check my answer</button>
    `;
  }

  function clozeHTML(activity) {
    const saved = state.cloze[activity.id] || {};
    let blankNum = 0;
    const body = (activity.segments || [])
      .map((seg) => {
        if (seg.text != null) return escapeHtml(seg.text);
        const blank = seg.blank;
        blankNum += 1;
        const opts = [""]
          .concat(blank.options || [])
          .map(
            (opt) =>
              `<option value="${escapeHtml(opt)}" ${saved[blank.id] === opt ? "selected" : ""}>${opt ? escapeHtml(opt) : "Choose…"}</option>`,
          )
          .join("");
        return `<span class="cloze-blank"><span class="visually-hidden">Blank ${blankNum}</span><select data-cloze="${escapeHtml(blank.id)}">${opts}</select></span>`;
      })
      .join("");
    return `
      <p class="cloze-passage">${body}</p>
      <button class="primary-action" type="button" data-check>Check my answer</button>
    `;
  }

  function hotTextHTML(activity) {
    const chosen = new Set(state.hot[activity.id] || []);
    return `
      <div class="hot-text" role="group" aria-label="Click the sentence that gives the best evidence">
        ${(activity.sentences || [])
          .map(
            (sentence) => `
          <button type="button" class="hot-sentence ${chosen.has(sentence.id) ? "selected" : ""}" data-hot="${escapeHtml(sentence.id)}" aria-pressed="${chosen.has(sentence.id)}">${escapeHtml(sentence.text)}</button>
        `,
          )
          .join("")}
      </div>
      <p class="field-hint">Click the sentence(s) that best support the answer. Click again to unselect.</p>
      <button class="primary-action" type="button" data-check>Check my answer</button>
    `;
  }

  function orderHTML(activity) {
    const saved = state.order[activity.id] || [];
    const total = (activity.items || []).length;
    const positionOf = (id) => {
      const idx = saved.indexOf(id);
      return idx === -1 ? "" : String(idx + 1);
    };
    return `
      <ol class="order-list">
        ${(activity.items || [])
          .map(
            (item) => `
          <li class="order-row">
            <label class="order-pos">
              <span class="visually-hidden">Step number for ${escapeHtml(item.text)}</span>
              <select data-order="${escapeHtml(item.id)}">
                <option value="">#</option>
                ${Array.from({ length: total }, (_, i) => i + 1)
                  .map(
                    (n) =>
                      `<option value="${n}" ${positionOf(item.id) === String(n) ? "selected" : ""}>${n}</option>`,
                  )
                  .join("")}
              </select>
            </label>
            <p>${escapeHtml(item.text)}</p>
          </li>
        `,
          )
          .join("")}
      </ol>
      <p class="field-hint">Number each step from 1 to ${total} in the correct order.</p>
      <button class="primary-action" type="button" data-check>Check my order</button>
    `;
  }

  function answerHTML(activity) {
    if (activity.type === "worksheet") return worksheetHTML(activity);
    if (state.domain === "Speaking") return speakingAnswerHTML(activity);
    if (activity.type === "sort") return sortHTML(activity);
    if (activity.type === "multiSelect") return multiSelectHTML(activity);
    if (activity.type === "cloze") return clozeHTML(activity);
    if (activity.type === "hotText") return hotTextHTML(activity);
    if (activity.type === "order") return orderHTML(activity);
    if (activity.type === "constructed") return constructedHTML(activity);
    return multipleChoiceHTML(activity);
  }

  function feedbackHTML(activity) {
    const feedback = state.feedback[activity.id];
    if (!feedback) return "";
    const result = state.results[activity.id];
    const badge = result
      ? badgeFromResult(result)
      : feedback.ok
        ? "Practice Complete"
        : "Needs Review";
    const heading = feedback.ok
      ? state.domain === "Model-Test"
        ? "Saved"
        : "Practice saved"
      : "Suggested next step";
    return `
      <section class="feedback-box ${feedback.ok ? "correct" : "hint"}" role="status" aria-live="polite">
        <div class="feedback-heading">
          <h3>${heading}</h3>
          <span class="score-badge ${resultStatusClass(badge)}">${escapeHtml(badge)}</span>
        </div>
        <p>${escapeHtml(feedback.message)}</p>
        ${result ? `<p><strong>Practice band:</strong> ${escapeHtml(result.band)}</p>` : ""}
        ${feedback.support ? `<p class="model">${escapeHtml(feedback.support)}</p>` : ""}
      </section>
    `;
  }

  function domainSkillSupportHTML(activity) {
    if (state.domain === "Listening") {
      return `
          <section class="flow-step domain-skill-box">
            <p class="step-label">Listening routine</p>
            <p><strong>Teacher-readable script:</strong> ${escapeHtml(activity.adminScript || activity.prompt || activity.directions)}</p>
            <div class="tool-actions">
              <button type="button" class="listen-btn" data-speak>Play / replay with browser voice</button>
            </div>
            <p class="muted">Listen twice if you need to. Then answer and read the feedback to understand why.</p>
          </section>
        `;
    }
    if (state.domain === "Reading") {
      return `
          <section class="flow-step domain-skill-box">
            <p class="step-label">Show evidence</p>
            <label class="evidence-prompt">
              <span>Copy one word, number, or sentence from the text that supports your answer.</span>
              <textarea data-note rows="3" placeholder="My evidence is...">${escapeHtml(state.notes[activity.id] || "")}</textarea>
            </label>
          </section>
        `;
    }
    return "";
  }

  function teacherPanelHTML(activity) {
    const teacher = activity.teacher;
    const rows = teacher
      ? [
          ["Use", teacher.use],
          ["Language function", teacher.function],
          ["Lower support", teacher.lower],
          ["On-level", teacher.onLevel],
          ["Challenge", teacher.challenge],
          ["No-tech option", teacher.noTech],
          ["Discussion prompt", teacher.prompt],
        ].filter(([, value]) => value)
      : [];

    const wida = (activity.wida || []).length
      ? `<section class="teacher-block"><h4>ACCESS alignment</h4><p>${activity.wida.map((item) => escapeHtml(item)).join(" · ")}</p></section>`
      : "";

    const testInfo = activity.testPart
      ? `<section class="teacher-block"><h4>${escapeHtml(activity.testPart)}</h4><p>${escapeHtml(activity.testFormat || "Grades 6-8 ACCESS-style practice")}</p><p class="muted">Classroom model practice — not an official WIDA test.</p>${activity.adminScript ? `<p><strong>Read aloud:</strong> ${escapeHtml(activity.adminScript)}</p>` : ""}</section>`
      : "";

    const adminScript =
      activity.adminScript && !activity.testPart
        ? `<section class="teacher-block"><h4>Speaking administration</h4><p><strong>Read aloud:</strong> ${escapeHtml(activity.adminScript)}</p></section>`
        : "";

    const teacherNotes = rows.length
      ? `<section class="teacher-block"><h4>Teacher notes</h4><dl>${rows.map(([label, value]) => `<div><dt>${escapeHtml(label)}</dt><dd>${escapeHtml(value)}</dd></div>`).join("")}</dl></section>`
      : "";

    const shareLink = `<section class="teacher-block"><h4>Share this activity</h4><p class="share-url" id="shareUrl">${escapeHtml(window.location.href)}</p><button type="button" class="ghost-btn" data-copy-current>Copy link for Classroom</button></section>`;

    return `${shareLink}${testInfo}${adminScript}${wida}${teacherNotes}`;
  }

  function certificateHTML() {
    const list = activities();
    if (!list.length || list.some((a) => !state.complete.has(a.id))) return "";
    const name = state.studentName || "Student";
    return `
      <section class="certificate-box">
        <h3>Completion slip</h3>
        <p><strong>${escapeHtml(name)}</strong> completed ${escapeHtml(domainLabel(state.domain))} ${escapeHtml(levelLabel(state.level, activeLevel()))}.</p>
      </section>
    `;
  }

  function modelTestPartLabel(activity) {
    const raw = activity.testPart || domainLabel(state.domain);
    return raw.replace(/\s*Part\s+[AB0-9-]+$/i, "").trim() || raw;
  }

  function modelTestRecapHTML() {
    if (state.domain !== "Model-Test") return "";
    const list = activities();
    const auto = list.filter((a) => a.type !== "constructed");
    // Score only items the student actually checked; data-mark toggles are ignored.
    const graded = auto.filter((a) => state.feedback[a.id]);
    if (!graded.length) return "";
    const correct = graded.filter((a) => state.feedback[a.id]?.ok).length;
    const written = list.filter(
      (a) => a.type === "constructed" && state.complete.has(a.id),
    ).length;
    const totalConstructed = list.filter(
      (a) => a.type === "constructed",
    ).length;
    const pct = Math.round((correct / graded.length) * 100);
    const tone =
      pct >= 80
        ? "Strong work — you are ACCESS-ready on these items."
        : pct >= 50
          ? "Good progress — review the items you missed and try again."
          : "Keep practicing — reread the prompts and use the help drawer.";

    const parts = {};
    for (const a of graded) {
      const key = modelTestPartLabel(a);
      parts[key] = parts[key] || { correct: 0, total: 0 };
      parts[key].total += 1;
      if (state.feedback[a.id]?.ok) parts[key].correct += 1;
    }
    const partRows = Object.entries(parts)
      .map(
        ([label, s]) =>
          `<li><span>${escapeHtml(label)}</span><strong>${s.correct}/${s.total}</strong></li>`,
      )
      .join("");

    return `
      <section class="lab-results" aria-label="Practice test results">
        <div class="lab-results-score">
          <span class="lab-results-pct">${pct}%</span>
          <span class="lab-results-frac">${correct} of ${graded.length} auto-scored items correct</span>
        </div>
        <p class="lab-results-tone">${escapeHtml(tone)}</p>
        <ul class="lab-results-parts">${partRows}</ul>
        ${
          totalConstructed
            ? `<p class="lab-results-note">${written}/${totalConstructed} written response${totalConstructed === 1 ? "" : "s"} submitted for teacher review (not auto-scored).</p>`
            : ""
        }
      </section>
    `;
  }

  function renderPractice() {
    const activity = activeActivity();
    renderPracticeHeader();
    if (!activity) {
      $("activityPanel").innerHTML =
        `<div class="empty-state">Activity not found. <a href="${hubUrl(state.domain, state.level)}">Back to activities</a></div>`;
      $("practiceTeacherPanel").innerHTML = "";
      return;
    }

    const done = state.complete.has(activity.id);
    const showReflection =
      activity.type !== "constructed" && state.domain !== "Speaking";

    $("activityPanel").innerHTML = `
      <article class="activity-card">
        <header class="flow-step">
          <p class="step-label">Directions</p>
          <h2 id="activityTitle">${escapeHtml(activity.title)}</h2>
          <p class="directions">${escapeHtml(activity.directions)}</p>
        </header>

        <section class="flow-step prompt-box">
          <p class="step-label">${escapeHtml(promptStepLabel(state.domain, activity))}</p>
          <p class="prompt-text">${escapeHtml(activity.prompt || "Sort each phrase into the best category.")}</p>
          <button class="listen-btn" type="button" data-speak>Read aloud</button>
        </section>

          ${helpHTML(activity)}
          ${domainSkillSupportHTML(activity)}

          <section class="flow-step answer-zone">
          <p class="step-label">Your answer</p>
          ${answerHTML(activity)}
          ${feedbackHTML(activity)}
        </section>

        ${
          showReflection
            ? `
          <section class="flow-step extension-box">
            <p class="step-label">Reflection</p>
            <p>${escapeHtml(activity.extension)}</p>
            <label class="reflection-label">
              <span>My sentence</span>
              <textarea data-note rows="3" placeholder="I chose ___ because ___.">${escapeHtml(state.notes[activity.id] || "")}</textarea>
            </label>
          </section>
        `
            : ""
        }

        ${certificateHTML()}

        <nav class="activity-nav" aria-label="Activity navigation">
          <button type="button" data-prev ${state.activityIndex === 0 ? "disabled" : ""}>Previous</button>
          <button type="button" class="mark-btn" data-mark>${done ? "Mark incomplete" : "Mark complete"}</button>
          <button type="button" data-next ${state.activityIndex >= activities().length - 1 ? "disabled" : ""}>Next</button>
        </nav>
      </article>
    `;

    $("practiceTeacherPanel").innerHTML = teacherPanelHTML(activity);
  }

  function renderLearnerTools() {
    const name = $("studentName");
    if (name && name.value !== state.studentName)
      name.value = state.studentName;
  }

  function checkAnswer() {
    const activity = activeActivity();
    if (!activity) return;
    state.attempts[activity.id] = (state.attempts[activity.id] || 0) + 1;
    let ok = false;
    let result = null;
    if (state.domain === "Speaking") {
      result = scoreSpeakingActivity(activity);
      ok =
        result.band === "Almost there" ||
        result.band === "Strong practice response";
    } else if (activity.type === "constructed") {
      if (state.domain === "Writing") {
        result = scoreWritingActivity(activity);
      } else {
        const minimumWords = Math.max(
          8,
          Math.round(pathwayFor(state.level).wordGoal / 3),
        );
        ok = wordCount(state.notes[activity.id] || "") >= minimumWords;
        result = makeResult(activity, {
          score: ok ? 1 : 0,
          total: 1,
          band: ok ? "Strong practice response" : "Getting started",
          badge: ok ? "Practice Complete" : "Needs Review",
          skillFeedback: ok
            ? "Response saved for teacher review."
            : "Add more detail before saving.",
          nextStep: ok
            ? "Ask a teacher to review your response."
            : "Add one more sentence with evidence.",
        });
      }
      ok =
        result.band === "Almost there" ||
        result.band === "Strong practice response";
    } else {
      ok = gradeItem(activity, practiceAnswer(activity)).correct;
      result = scoreSelectedActivity(activity, ok);
    }
    state.results[activity.id] = result;
    state.feedback[activity.id] = ok
      ? {
          ok: true,
          message:
            result.skillFeedback ||
            activity.correct ||
            "Practice response saved.",
          support: `Practice score: ${result.band}. Suggested next step: ${result.nextStep}`,
        }
      : {
          ok: false,
          message:
            result.skillFeedback ||
            activity.hint ||
            "This practice response needs one more step.",
          support: `Practice score: ${result.band}. Suggested next step: ${result.nextStep}`,
        };
    if (ok) state.complete.add(activity.id);
    saveProgress();
    renderAll();
  }

  function speakText(text, lang = "en-US") {
    if (!text || !("speechSynthesis" in window)) {
      showSaveStatus("Read aloud is not available in this browser.");
      return;
    }
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    // Slower, clearer pace for multilingual learners (mirrors ACCESS audio).
    utter.lang = lang;
    utter.rate = 0.9;
    window.speechSynthesis.speak(utter);
  }

  function speakPrompt() {
    const activity = activeActivity();
    if (!activity) return;
    speakText(`${activity.title}. ${activity.prompt || activity.directions}`);
  }

  function showSaveStatus(message) {
    const el = $("saveStatus");
    if (el) el.textContent = message;
    const readiness = $("readinessStatus");
    if (readiness && message.startsWith("Tool"))
      readiness.textContent = message;
    const recording = $("recordingStatus");
    if (recording && message.startsWith("Recording"))
      recording.textContent = message;
  }

  function clearAllProgress() {
    if (
      !window.confirm(
        "Clear ACCESS Practice Lab progress from this browser? This cannot be undone.",
      )
    )
      return;
    Object.keys(localStorage)
      .filter((key) => key.startsWith(storagePrefix))
      .forEach((key) => localStorage.removeItem(key));
    state.studentName = "";
    state.complete = new Set();
    state.selected = {};
    state.multi = {};
    state.cloze = {};
    state.hot = {};
    state.order = {};
    state.sortAnswers = {};
    state.attempts = {};
    state.feedback = {};
    state.notes = {};
    state.selfChecks = {};
    state.practiced = {};
    state.results = {};
    renderAll();
    showSaveStatus("Progress cleared from this browser.");
  }

  async function startRecording() {
    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
      showSaveStatus("Recording is not available in this browser.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      recordingState.chunks = [];
      recordingState.recorder = new MediaRecorder(stream);
      recordingState.recorder.addEventListener("dataavailable", (event) => {
        if (event.data.size > 0) recordingState.chunks.push(event.data);
      });
      recordingState.recorder.addEventListener("stop", () => {
        stream.getTracks().forEach((track) => track.stop());
        if (recordingState.url) URL.revokeObjectURL(recordingState.url);
        const blob = new Blob(recordingState.chunks, { type: "audio/webm" });
        recordingState.url = URL.createObjectURL(blob);
        recordingState.status = "Recording ready. Play it back or re-record.";
        renderPractice();
      });
      recordingState.recorder.start();
      recordingState.status = "Recording now. Speak your answer clearly.";
      showSaveStatus("Recording now. Speak your answer clearly.");
    } catch {
      recordingState.status =
        "Microphone permission was not available. Practice aloud and use the checklist.";
      showSaveStatus(recordingState.status);
    }
  }

  function stopRecording() {
    if (recordingState.recorder?.state === "recording") {
      recordingState.recorder.stop();
      recordingState.status = "Recording stopped.";
      showSaveStatus("Recording stopped.");
    }
  }

  function clearRecording() {
    if (recordingState.url) URL.revokeObjectURL(recordingState.url);
    recordingState.url = "";
    recordingState.chunks = [];
    recordingState.status = "No recording yet.";
    renderPractice();
  }

  async function copyText(text) {
    try {
      await navigator.clipboard.writeText(text);
      showSaveStatus("Link copied.");
    } catch {
      showSaveStatus(text);
    }
  }

  async function copySummary() {
    if (!state.domain || !state.level) {
      const summary = reportSummary();
      const rows = summary.rows.map(
        (row) =>
          `${row.domainName}: ${row.done}/${row.total} complete, ${row.band}, next step: ${row.nextStep}`,
      );
      await copyText(
        [
          `${DATA.productTitle}: ACCESS-style practice report`,
          `Student: ${state.studentName || "Not entered"}`,
          `Date: ${new Date().toLocaleDateString()}`,
          `Support level: ${pathwayFor(state.level).name}`,
          `Strongest domain: ${summary.strongest}`,
          `Next domain to practice: ${summary.nextDomain}`,
          ...rows,
          "Teacher review recommended for speaking, writing, and Needs Review bands.",
          "This is classroom practice feedback, not an official WIDA ACCESS score.",
        ].join("\n"),
      );
      showSaveStatus("Progress summary copied.");
      return;
    }
    const list = activities();
    const done = list.filter((a) => state.complete.has(a.id)).length;
    const rows = list.map(
      (a, i) =>
        `${i + 1}. ${a.title}: ${state.complete.has(a.id) ? "complete" : "not complete"}`,
    );
    const summary = [
      `${DATA.productTitle}: ${domainLabel(state.domain)} ${levelLabel(state.level, activeLevel())}`,
      `Student: ${state.studentName || "Not entered"}`,
      `Progress: ${done}/${list.length} complete`,
      ...rows,
    ].join("\n");
    await copyText(summary);
    showSaveStatus("Progress summary copied.");
  }

  function wireEvents() {
    document.addEventListener("change", (event) => {
      if (state.mode === "test") {
        handleTestChange(event);
        return;
      }
      const activity = activeActivity();
      if (!activity) return;
      if (event.target.name === "answer") {
        state.selected[activity.id] = event.target.value;
        saveProgress();
        if (state.mode === "practice") renderPractice();
      }
      if (event.target.matches("[data-sort-item]")) {
        const itemId = event.target.getAttribute("data-sort-item");
        state.sortAnswers[activity.id] = state.sortAnswers[activity.id] || {};
        state.sortAnswers[activity.id][itemId] = event.target.value;
        saveProgress();
      }
      if (event.target.matches("[data-multi]")) {
        const optId = event.target.getAttribute("data-multi");
        const set = new Set(state.multi[activity.id] || []);
        if (event.target.checked) set.add(optId);
        else set.delete(optId);
        state.multi[activity.id] = [...set];
        event.target
          .closest(".choice-card")
          ?.classList.toggle("selected", event.target.checked);
        saveProgress();
      }
      if (event.target.matches("[data-cloze]")) {
        const blankId = event.target.getAttribute("data-cloze");
        state.cloze[activity.id] = state.cloze[activity.id] || {};
        state.cloze[activity.id][blankId] = event.target.value;
        saveProgress();
      }
      if (event.target.matches("[data-order]")) {
        const itemId = event.target.getAttribute("data-order");
        const pos = Number(event.target.value);
        const list = (state.order[activity.id] || []).filter(
          (id) => id !== itemId,
        );
        if (pos >= 1) list.splice(pos - 1, 0, itemId);
        state.order[activity.id] = list;
        saveProgress();
      }
      if (event.target.matches("[data-self-check]")) {
        const key = event.target.getAttribute("data-self-check");
        state.selfChecks[activity.id] = state.selfChecks[activity.id] || {};
        state.selfChecks[activity.id][key] = event.target.checked;
        saveProgress();
      }
      if (event.target.matches("[data-practiced-speaking]")) {
        state.practiced[activity.id] = event.target.checked;
        saveProgress();
      }
    });

    document.addEventListener("input", (event) => {
      if (state.mode === "test") {
        if (event.target.matches("[data-test-note]")) {
          const itemId = event.target.getAttribute("data-test-note");
          testState.answers[itemId] = event.target.value;
          saveTestProgress();
        }
        return;
      }
      const activity = activeActivity();
      if (event.target.id === "studentName") {
        state.studentName = event.target.value.trim();
        localStorage.setItem(`${storagePrefix}:studentName`, state.studentName);
        if (state.domain && state.level) saveProgress();
        else showSaveStatus("Name saved on this device.");
      } else if (activity && event.target.matches("[data-note]")) {
        state.notes[activity.id] = event.target.value;
        saveProgress();
      }
    });

    document.addEventListener("click", (event) => {
      if (state.mode === "test" && handleTestClick(event)) return;
      const hotBtn = event.target.closest("[data-hot]");
      if (hotBtn && state.mode === "practice") {
        const activity = activeActivity();
        if (activity) {
          const id = hotBtn.getAttribute("data-hot");
          const set = new Set(state.hot[activity.id] || []);
          if (set.has(id)) set.delete(id);
          else set.add(id);
          state.hot[activity.id] = [...set];
          hotBtn.classList.toggle("selected", set.has(id));
          hotBtn.setAttribute("aria-pressed", String(set.has(id)));
          saveProgress();
        }
        return;
      }
      const copyLink = event.target.closest("[data-copy-link]");
      if (copyLink) {
        copyText(
          new URL(
            copyLink.getAttribute("data-copy-link"),
            window.location.origin,
          ).href,
        );
        return;
      }
      if (event.target.closest("[data-copy-current]")) {
        copyText(window.location.href);
        return;
      }
      if (event.target.closest("[data-check]")) checkAnswer();
      if (event.target.closest("[data-speak]")) speakPrompt();
      const pathwayBtn = event.target.closest("[data-pathway]");
      if (pathwayBtn) {
        state.pathway = pathwayBtn.getAttribute("data-pathway");
        localStorage.setItem(`${storagePrefix}:pathway`, state.pathway);
        renderAll();
        showSaveStatus(`${pathwayFor(state.level).name} support selected.`);
        return;
      }
      if (event.target.closest("[data-readiness-speak]")) {
        speakText($("readinessScript")?.textContent || "");
        return;
      }
      if (event.target.closest("[data-readiness-check]")) {
        showSaveStatus("Tool practice complete. You are ready to begin.");
        return;
      }
      if (event.target.closest("[data-update-report]")) {
        renderProgressTracker();
        showSaveStatus("Practice report updated.");
        return;
      }
      if (event.target.closest("[data-readiness-prev]")) {
        showSaveStatus("Tool practice: Back button works.");
        return;
      }
      if (event.target.closest("[data-readiness-next]")) {
        showSaveStatus("Tool practice: Next button works.");
        return;
      }
      if (event.target.closest("[data-print-report]")) {
        window.print();
        return;
      }
      if (event.target.closest("[data-clear-all-progress]")) {
        clearAllProgress();
        return;
      }
      if (event.target.closest("[data-record-start]")) {
        startRecording();
        return;
      }
      if (event.target.closest("[data-record-stop]")) {
        stopRecording();
        return;
      }
      if (event.target.closest("[data-record-clear]")) {
        clearRecording();
        return;
      }
      const esBtn = event.target.closest("[data-es]");
      if (esBtn) speakText(esBtn.getAttribute("data-es"), "es-US");
      if (event.target.closest("[data-prev]")) {
        const prev = activities()[state.activityIndex - 1];
        if (prev) navigate(practiceUrl(state.domain, state.level, prev.id));
      }
      if (event.target.closest("[data-next]")) {
        const next = activities()[state.activityIndex + 1];
        if (next) navigate(practiceUrl(state.domain, state.level, next.id));
      }
      if (event.target.closest("[data-mark]")) {
        const activity = activeActivity();
        if (state.complete.has(activity.id)) state.complete.delete(activity.id);
        else state.complete.add(activity.id);
        saveProgress();
        renderAll();
      }
    });

    $("printBtn").addEventListener("click", () => window.print());
    $("exportBtn").addEventListener("click", copySummary);
    $("resetProgressBtn").addEventListener("click", () => {
      if (!state.domain || !state.level) {
        showSaveStatus("Choose a domain and level first.");
        return;
      }
      localStorage.removeItem(storageKey());
      loadProgress();
      renderAll();
      showSaveStatus("This practice path was reset.");
    });
    window.addEventListener("popstate", initFromRoute);
  }

  /* ════════════════════════════════════════════════════════════════════
     WIDA-style full Test Mode — intro → runner (palette/flag/timer) →
     review → scored proficiency report. Layered additively on DATA.tests.
     ════════════════════════════════════════════════════════════════════ */
  const testState = {
    test: null,
    flat: [],
    index: 0,
    phase: "intro",
    answers: {},
    flags: new Set(),
    startedAt: null,
    durationSec: 0,
    remainingSec: 0,
    timerId: null,
    results: null,
  };

  const WIDA_LEVELS = [
    { num: 1, name: "Entering" },
    { num: 2, name: "Emerging" },
    { num: 3, name: "Developing" },
    { num: 4, name: "Expanding" },
    { num: 5, name: "Bridging" },
    { num: 6, name: "Reaching" },
  ];

  function widaLevelFromPct(pct) {
    if (pct >= 90) return WIDA_LEVELS[5];
    if (pct >= 75) return WIDA_LEVELS[4];
    if (pct >= 60) return WIDA_LEVELS[3];
    if (pct >= 45) return WIDA_LEVELS[2];
    if (pct >= 30) return WIDA_LEVELS[1];
    return WIDA_LEVELS[0];
  }

  function testKey(id) {
    return `${storagePrefix}:test:${id || testState.test?.id}`;
  }

  function clearTestTimer() {
    if (testState.timerId) {
      clearInterval(testState.timerId);
      testState.timerId = null;
    }
  }

  function loadTest(testId) {
    const test =
      DATA.tests.find((t) => t.id === testId) || DATA.tests[0] || null;
    clearTestTimer();
    testState.test = test;
    testState.flat = [];
    testState.results = null;
    if (!test) return;
    let globalNumber = 0;
    (test.sections || []).forEach((section, sectionIndex) => {
      (section.items || []).forEach((item, itemIndex) => {
        globalNumber += 1;
        testState.flat.push({
          item,
          section,
          sectionIndex,
          numberInSection: itemIndex + 1,
          globalNumber,
        });
      });
    });
    testState.durationSec = (test.sections || []).reduce(
      (sum, s) => sum + (Number(s.estMinutes) || 8) * 60,
      0,
    );
    const saved = safeParse(localStorage.getItem(testKey(test.id)) || "{}", {});
    testState.phase = saved.phase || "intro";
    testState.index = Math.min(saved.index || 0, testState.flat.length - 1);
    testState.answers = saved.answers || {};
    testState.flags = new Set(saved.flags || []);
    testState.startedAt = saved.startedAt || null;
    testState.remainingSec =
      typeof saved.remainingSec === "number"
        ? saved.remainingSec
        : testState.durationSec;
    testState.studentName =
      localStorage.getItem(`${storagePrefix}:studentName`) || "";
    if (saved.results) {
      testState.results = saved.results;
      testState.phase = "results";
    }
    if (testState.phase === "running") startTestTimer();
  }

  function saveTestProgress() {
    if (!testState.test) return;
    localStorage.setItem(
      testKey(),
      JSON.stringify({
        phase: testState.phase,
        index: testState.index,
        answers: testState.answers,
        flags: [...testState.flags],
        startedAt: testState.startedAt,
        remainingSec: testState.remainingSec,
        results: testState.results,
      }),
    );
  }

  function startTestTimer() {
    clearTestTimer();
    testState.timerId = setInterval(() => {
      testState.remainingSec = Math.max(0, testState.remainingSec - 1);
      const el = $("testTimer");
      if (el) el.textContent = formatClock(testState.remainingSec);
      if (testState.remainingSec <= 0) {
        clearTestTimer();
        submitTest(true);
      } else if (testState.remainingSec % 15 === 0) {
        saveTestProgress();
      }
    }, 1000);
  }

  function formatClock(totalSec) {
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${m}:${String(s).padStart(2, "0")}`;
  }

  function testItemAnsweredCount() {
    return testState.flat.filter((f) => isTestItemAnswered(f.item)).length;
  }

  function isTestItemAnswered(item) {
    const a = testState.answers[item.id];
    if (a == null) return false;
    if (item.type === "constructed") return wordCount(a) > 0;
    if (item.type === "cloze")
      return Object.values(a).some((v) => v && v !== "");
    if (Array.isArray(a)) return a.length > 0;
    return a !== "";
  }

  function gradeTest() {
    const sections = (testState.test.sections || []).map((section, si) => {
      const items = testState.flat
        .filter((f) => f.sectionIndex === si)
        .map((f) => f.item);
      const auto = items.filter((it) => gradeItem(it, null).auto);
      const correct = auto.filter(
        (it) => gradeItem(it, testState.answers[it.id]).correct,
      ).length;
      const constructed = items.filter((it) => it.type === "constructed");
      const submitted = constructed.filter((it) =>
        isTestItemAnswered(it),
      ).length;
      const pct = auto.length
        ? Math.round((correct / auto.length) * 100)
        : null;
      return {
        domain: section.domain,
        title: section.title || section.domain,
        correct,
        total: auto.length,
        pct,
        level: pct == null ? null : widaLevelFromPct(pct),
        constructedTotal: constructed.length,
        constructedSubmitted: submitted,
      };
    });
    const autoCorrect = sections.reduce((s, x) => s + x.correct, 0);
    const autoTotal = sections.reduce((s, x) => s + x.total, 0);
    const overallPct = autoTotal
      ? Math.round((autoCorrect / autoTotal) * 100)
      : 0;
    return {
      overallPct,
      autoCorrect,
      autoTotal,
      level: widaLevelFromPct(overallPct),
      sections,
      date: new Date().toISOString(),
      studentName: testState.studentName || "",
    };
  }

  function submitTest(auto) {
    clearTestTimer();
    testState.results = gradeTest();
    testState.phase = "results";
    saveTestProgress();
    renderTest();
    if (auto) showSaveStatus("Time is up. Your practice test was submitted.");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function renderTest() {
    const root = $("testRoot");
    if (!root) return;
    if (!testState.test) {
      root.innerHTML = `<div class="empty-state">Test not found. <a href="/access-practice-lab/">Back to the lab</a></div>`;
      return;
    }
    if (testState.phase === "intro") root.innerHTML = testIntroHTML();
    else if (testState.phase === "results") root.innerHTML = testResultsHTML();
    else if (testState.phase === "review") root.innerHTML = testReviewHTML();
    else root.innerHTML = testRunnerHTML();
    document.title = `${testState.test.title} | EduWonderLab`;
  }

  function testIntroHTML() {
    const test = testState.test;
    const totalItems = testState.flat.length;
    const inProgress =
      testItemAnsweredCount() > 0 && testState.phase !== "results";
    const sectionRows = (test.sections || [])
      .map(
        (s) => `
        <li>
          <span class="ti-domain">${escapeHtml(s.title || s.domain)}</span>
          <span class="ti-meta">${(s.items || []).length} items · about ${escapeHtml(String(s.estMinutes || 8))} min</span>
        </li>`,
      )
      .join("");
    return `
      <section class="test-intro" aria-labelledby="testIntroTitle">
        <div class="test-intro-badge">ACCESS-style practice test</div>
        <p class="eyebrow">Grades ${escapeHtml(test.gradeCluster || "6-8")} · ${escapeHtml(test.tier || "Practice form")}</p>
        <h1 id="testIntroTitle">${escapeHtml(test.title)}</h1>
        <p class="test-intro-lead">${escapeHtml(test.overview || "A full practice test across all four language domains.")}</p>
        <div class="test-intro-grid">
          <article class="test-intro-card">
            <h2>What is on this test</h2>
            <ul class="test-section-list">${sectionRows}</ul>
            <p class="test-intro-total">${totalItems} questions · about ${Math.round(testState.durationSec / 60)} minutes</p>
          </article>
          <article class="test-intro-card">
            <h2>Test directions</h2>
            <ul class="test-rules">
              <li>Answer every question. You can flag a question and come back to it.</li>
              <li>Use <strong>Go On</strong> to move forward and <strong>Back</strong> to return.</li>
              <li>A timer is shown at the top. The test submits when time runs out.</li>
              <li>For Listening, press <strong>Play</strong> to hear the question read aloud.</li>
              <li>Speaking and Writing answers are saved for your teacher to review.</li>
            </ul>
            <p class="test-disclaimer">This is original classroom practice inspired by the WIDA ACCESS test. It is not an official WIDA test, score, or placement.</p>
          </article>
        </div>
        <div class="test-intro-actions">
          <button type="button" class="primary-action big" data-test-start>${inProgress ? "Resume test" : "Start test"}</button>
          ${inProgress ? `<button type="button" class="ghost-btn" data-test-restart>Start over</button>` : ""}
          <a class="ghost-btn" href="/access-practice-lab/">Back to lab</a>
        </div>
      </section>
    `;
  }

  function testRunnerHTML() {
    const entry = testState.flat[testState.index];
    if (!entry) return testReviewHTML();
    const { item, section, sectionIndex, numberInSection } = entry;
    const totalSections = (testState.test.sections || []).length;
    const sectionItems = testState.flat.filter(
      (f) => f.sectionIndex === sectionIndex,
    );
    const flagged = testState.flags.has(item.id);
    return `
      <div class="test-topbar">
        <div class="test-topbar-left">
          <span class="test-domain-chip">${escapeHtml(section.title || section.domain)}</span>
          <span class="test-section-counter">Section ${sectionIndex + 1} of ${totalSections}</span>
        </div>
        <div class="test-topbar-right">
          <span class="test-timer" id="testTimer" role="timer" aria-label="Time remaining">${formatClock(testState.remainingSec)}</span>
          <button type="button" class="ghost-btn test-exit" data-test-exit>Save &amp; exit</button>
        </div>
      </div>
      <div class="test-progressbar" aria-hidden="true"><span style="width:${Math.round(((testState.index + 1) / testState.flat.length) * 100)}%"></span></div>

      <div class="test-stage">
        <main class="test-question" aria-live="polite">
          <div class="test-question-head">
            <p class="test-qnum">Question ${entry.globalNumber} of ${testState.flat.length} <span class="test-qsub">(${escapeHtml(section.domain)} item ${numberInSection} of ${sectionItems.length})</span></p>
            <button type="button" class="flag-btn ${flagged ? "active" : ""}" data-test-flag aria-pressed="${flagged}">${flagged ? "★ Flagged" : "☆ Flag for review"}</button>
          </div>
          ${section.directions && numberInSection === 1 ? `<p class="test-section-directions">${escapeHtml(section.directions)}</p>` : ""}
          ${testStimulusHTML(item, section)}
          <div class="test-prompt">
            <p class="test-prompt-text">${escapeHtml(item.prompt || item.directions || "")}</p>
          </div>
          ${testInputHTML(item)}
        </main>

        <aside class="test-palette" aria-label="Question navigator">
          <h2>Questions</h2>
          <div class="palette-grid">
            ${testState.flat
              .map((f, i) => {
                const answered = isTestItemAnswered(f.item);
                const isFlagged = testState.flags.has(f.item.id);
                const current = i === testState.index;
                return `<button type="button" class="palette-dot ${current ? "current" : ""} ${answered ? "answered" : ""} ${isFlagged ? "flagged" : ""}" data-test-jump="${i}" aria-label="Question ${i + 1}${answered ? ", answered" : ""}${isFlagged ? ", flagged" : ""}">${i + 1}</button>`;
              })
              .join("")}
          </div>
          <dl class="palette-legend">
            <div><dt class="dot answered"></dt><dd>Answered</dd></div>
            <div><dt class="dot flagged"></dt><dd>Flagged</dd></div>
            <div><dt class="dot"></dt><dd>Not yet</dd></div>
          </dl>
        </aside>
      </div>

      <nav class="test-nav" aria-label="Test navigation">
        <button type="button" class="ghost-btn" data-test-prev ${testState.index === 0 ? "disabled" : ""}>Back</button>
        <span class="test-nav-count">${testItemAnsweredCount()}/${testState.flat.length} answered</span>
        ${
          testState.index >= testState.flat.length - 1
            ? `<button type="button" class="primary-action" data-test-review>Review answers</button>`
            : `<button type="button" class="primary-action" data-test-next>Go On →</button>`
        }
      </nav>
    `;
  }

  function testStimulusHTML(item, section) {
    let html = "";
    if (item.passage || item.passageTitle) {
      const lines = Array.isArray(item.passage)
        ? item.passage
        : [item.passage].filter(Boolean);
      html += `
        <section class="test-passage">
          ${item.passageTitle ? `<h3>${escapeHtml(item.passageTitle)}</h3>` : ""}
          ${lines.map((line) => `<p>${escapeHtml(line)}</p>`).join("")}
        </section>`;
    }
    if (item.adminScript && section.domain === "Listening") {
      html += `
        <div class="test-audio">
          <button type="button" class="listen-btn" data-test-speak="${escapeHtml(item.adminScript)}">▶ Play audio</button>
          <span class="test-audio-note">Press play to hear the question. You may listen more than once.</span>
        </div>`;
    }
    if (section.domain === "Speaking") {
      html += `
        <div class="test-speaking-note">
          <p><strong>Speaking task:</strong> Plan for a moment, then say your answer aloud. Type planning notes below — your teacher will listen to or read your response.</p>
          ${item.adminScript ? `<button type="button" class="listen-btn" data-test-speak="${escapeHtml(item.adminScript)}">▶ Hear the prompt</button>` : ""}
        </div>`;
    }
    return html;
  }

  function testInputHTML(item) {
    const a = testState.answers[item.id];
    switch (item.type) {
      case "multiSelect": {
        const chosen = new Set(a || []);
        return `<fieldset class="choice-set multi-select-set"><legend class="visually-hidden">Choose all that apply</legend>${(
          item.options || []
        )
          .map(
            (o) =>
              `<label class="choice-card ${chosen.has(o.id) ? "selected" : ""}"><input type="checkbox" data-test-multi="${escapeHtml(o.id)}" ${chosen.has(o.id) ? "checked" : ""} />${o.visual ? `<span class="choice-visual" aria-hidden="true">${escapeHtml(o.visual)}</span>` : ""}<span>${escapeHtml(o.text)}</span></label>`,
          )
          .join(
            "",
          )}</fieldset><p class="field-hint">Choose all correct answers.</p>`;
      }
      case "cloze": {
        const saved = a || {};
        const body = (item.segments || [])
          .map((seg) => {
            if (seg.text != null) return escapeHtml(seg.text);
            const b = seg.blank;
            const opts = [""]
              .concat(b.options || [])
              .map(
                (opt) =>
                  `<option value="${escapeHtml(opt)}" ${saved[b.id] === opt ? "selected" : ""}>${opt ? escapeHtml(opt) : "Choose…"}</option>`,
              )
              .join("");
            return `<span class="cloze-blank"><select data-test-cloze="${escapeHtml(b.id)}">${opts}</select></span>`;
          })
          .join("");
        return `<p class="cloze-passage">${body}</p>`;
      }
      case "hotText": {
        const chosen = new Set(a || []);
        return `<div class="hot-text">${(item.sentences || [])
          .map(
            (s) =>
              `<button type="button" class="hot-sentence ${chosen.has(s.id) ? "selected" : ""}" data-test-hot="${escapeHtml(s.id)}" aria-pressed="${chosen.has(s.id)}">${escapeHtml(s.text)}</button>`,
          )
          .join(
            "",
          )}</div><p class="field-hint">Click the sentence(s) that give the best evidence.</p>`;
      }
      case "order": {
        const saved = a || [];
        const total = (item.items || []).length;
        const posOf = (id) => {
          const idx = saved.indexOf(id);
          return idx === -1 ? "" : String(idx + 1);
        };
        return `<ol class="order-list">${(item.items || [])
          .map(
            (it) =>
              `<li class="order-row"><label class="order-pos"><span class="visually-hidden">Step for ${escapeHtml(it.text)}</span><select data-test-order="${escapeHtml(it.id)}"><option value="">#</option>${Array.from(
                { length: total },
                (_, i) => i + 1,
              )
                .map(
                  (n) =>
                    `<option value="${n}" ${posOf(it.id) === String(n) ? "selected" : ""}>${n}</option>`,
                )
                .join("")}</select></label><p>${escapeHtml(it.text)}</p></li>`,
          )
          .join("")}</ol><p class="field-hint">Number each step in order.</p>`;
      }
      case "constructed":
        return `<label class="constructed-response"><span>${escapeHtml(item.responseLabel || "Type your response")}</span><textarea data-test-note="${escapeHtml(item.id)}" rows="7" placeholder="${escapeHtml(item.responsePlaceholder || "Write your answer here.")}">${escapeHtml(a || "")}</textarea></label>${item.wordBank?.length ? `<p class="field-hint"><strong>Word bank:</strong> ${item.wordBank.map(escapeHtml).join(", ")}</p>` : ""}`;
      case "multipleChoice":
      default:
        return `<fieldset class="choice-set"><legend class="visually-hidden">Choose the best answer</legend>${(
          item.options || []
        )
          .map(
            (o) =>
              `<label class="choice-card ${a === o.id ? "selected" : ""}"><input type="radio" name="test-${escapeHtml(item.id)}" data-test-mc="${escapeHtml(o.id)}" ${a === o.id ? "checked" : ""} />${o.visual ? `<span class="choice-visual" aria-hidden="true">${escapeHtml(o.visual)}</span>` : ""}<span>${escapeHtml(o.text)}</span></label>`,
          )
          .join("")}</fieldset>`;
    }
  }

  function testReviewHTML() {
    const answered = testItemAnsweredCount();
    const unanswered = testState.flat.length - answered;
    const rows = testState.flat
      .map((f, i) => {
        const answeredItem = isTestItemAnswered(f.item);
        const flagged = testState.flags.has(f.item.id);
        return `
        <button type="button" class="review-row ${answeredItem ? "is-answered" : "is-blank"}" data-test-jump="${i}">
          <span class="review-num">${i + 1}</span>
          <span class="review-title">${escapeHtml(f.section.domain)} · ${escapeHtml(f.item.title || f.item.skill || "Question")}</span>
          <span class="review-status">${answeredItem ? "Answered" : "Not answered"}${flagged ? " · ★ Flagged" : ""}</span>
        </button>`;
      })
      .join("");
    return `
      <div class="test-topbar">
        <div class="test-topbar-left"><span class="test-domain-chip">Review</span></div>
        <div class="test-topbar-right"><span class="test-timer" id="testTimer">${formatClock(testState.remainingSec)}</span></div>
      </div>
      <section class="test-review">
        <h1>Review your answers</h1>
        <p class="test-review-summary">${answered} answered · ${unanswered} not answered · ${testState.flags.size} flagged. Click any question to go back and change your answer.</p>
        <div class="review-list">${rows}</div>
        <div class="test-review-actions">
          <button type="button" class="ghost-btn" data-test-jump="${testState.index}">Keep working</button>
          <button type="button" class="primary-action big" data-test-submit>Submit test</button>
        </div>
        <p class="test-disclaimer">When you submit, you will see a classroom practice report. This is not an official WIDA score.</p>
      </section>
    `;
  }

  function testResultsHTML() {
    const r = testState.results || gradeTest();
    const sectionCards = r.sections
      .map((s) => {
        const pct = s.pct == null ? null : s.pct;
        return `
        <article class="result-domain-card">
          <div class="result-domain-head">
            <h3>${escapeHtml(s.title)}</h3>
            ${s.level ? `<span class="wida-pill level-${s.level.num}">Level ${s.level.num} · ${escapeHtml(s.level.name)}</span>` : `<span class="wida-pill teacher">Teacher review</span>`}
          </div>
          ${
            pct == null
              ? `<p class="result-line">${s.constructedSubmitted}/${s.constructedTotal} response${s.constructedTotal === 1 ? "" : "s"} submitted for teacher review.</p>`
              : `<div class="result-bar"><span style="width:${pct}%"></span></div>
                 <p class="result-line">${s.correct}/${s.total} correct · ${pct}%${s.constructedTotal ? ` · ${s.constructedSubmitted}/${s.constructedTotal} written for review` : ""}</p>`
          }
        </article>`;
      })
      .join("");
    return `
      <section class="test-results">
        <div class="results-hero level-${r.level.num}">
          <p class="eyebrow">ACCESS-style practice report</p>
          <h1>${escapeHtml(r.studentName || "Practice")} · ${escapeHtml(testState.test.title)}</h1>
          <div class="results-score-ring">
            <span class="results-pct">${r.overallPct}%</span>
            <span class="results-frac">${r.autoCorrect}/${r.autoTotal} auto-scored</span>
          </div>
          <p class="results-wida">Practice proficiency estimate: <strong>Level ${r.level.num} — ${escapeHtml(r.level.name)}</strong></p>
        </div>
        <div class="results-domain-grid">${sectionCards}</div>
        <section class="results-explain">
          <h2>What this practice shows</h2>
          <p>This estimate is based only on the auto-scored Listening and Reading questions. Speaking and Writing are saved for your teacher, because real language growth is best judged by a person.</p>
          <p class="test-disclaimer">This is classroom practice feedback inspired by WIDA ACCESS. It is <strong>not</strong> an official WIDA test, score, or placement decision.</p>
        </section>
        <div class="test-results-actions">
          <button type="button" class="primary-action" data-print-report>Print report</button>
          <button type="button" class="ghost-btn" data-test-restart>Retake test</button>
          <a class="ghost-btn" href="/access-practice-lab/">Back to lab</a>
        </div>
      </section>
    `;
  }

  function handleTestChange(event) {
    const t = event.target;
    const entry = testState.flat[testState.index];
    if (!entry) return;
    const item = entry.item;
    if (t.matches("[data-test-mc]")) {
      testState.answers[item.id] = t.getAttribute("data-test-mc");
    } else if (t.matches("[data-test-multi]")) {
      const id = t.getAttribute("data-test-multi");
      const set = new Set(testState.answers[item.id] || []);
      if (t.checked) set.add(id);
      else set.delete(id);
      testState.answers[item.id] = [...set];
    } else if (t.matches("[data-test-cloze]")) {
      const id = t.getAttribute("data-test-cloze");
      testState.answers[item.id] = testState.answers[item.id] || {};
      testState.answers[item.id][id] = t.value;
    } else if (t.matches("[data-test-order]")) {
      const id = t.getAttribute("data-test-order");
      const pos = Number(t.value);
      const list = (testState.answers[item.id] || []).filter((x) => x !== id);
      if (pos >= 1) list.splice(pos - 1, 0, id);
      testState.answers[item.id] = list;
    } else {
      return;
    }
    saveTestProgress();
    renderTest();
  }

  function handleTestClick(event) {
    const t = event.target;
    const speakBtn = t.closest("[data-test-speak]");
    if (speakBtn) {
      speakText(speakBtn.getAttribute("data-test-speak"));
      return true;
    }
    if (t.closest("[data-test-start]")) {
      testState.phase = "running";
      if (!testState.startedAt) testState.startedAt = new Date().toISOString();
      if (testState.remainingSec <= 0)
        testState.remainingSec = testState.durationSec;
      startTestTimer();
      saveTestProgress();
      renderTest();
      return true;
    }
    if (t.closest("[data-test-restart]")) {
      clearTestTimer();
      localStorage.removeItem(testKey());
      testState.phase = "intro";
      testState.index = 0;
      testState.answers = {};
      testState.flags = new Set();
      testState.startedAt = null;
      testState.results = null;
      testState.remainingSec = testState.durationSec;
      renderTest();
      return true;
    }
    const hotBtn = t.closest("[data-test-hot]");
    if (hotBtn) {
      const entry = testState.flat[testState.index];
      const id = hotBtn.getAttribute("data-test-hot");
      const set = new Set(testState.answers[entry.item.id] || []);
      if (set.has(id)) set.delete(id);
      else set.add(id);
      testState.answers[entry.item.id] = [...set];
      saveTestProgress();
      renderTest();
      return true;
    }
    if (t.closest("[data-test-flag]")) {
      const entry = testState.flat[testState.index];
      if (testState.flags.has(entry.item.id))
        testState.flags.delete(entry.item.id);
      else testState.flags.add(entry.item.id);
      saveTestProgress();
      renderTest();
      return true;
    }
    if (t.closest("[data-test-prev]")) {
      testState.index = Math.max(0, testState.index - 1);
      saveTestProgress();
      renderTest();
      window.scrollTo({ top: 0 });
      return true;
    }
    if (t.closest("[data-test-next]")) {
      testState.index = Math.min(
        testState.flat.length - 1,
        testState.index + 1,
      );
      saveTestProgress();
      renderTest();
      window.scrollTo({ top: 0 });
      return true;
    }
    const jump = t.closest("[data-test-jump]");
    if (jump) {
      testState.index = Number(jump.getAttribute("data-test-jump")) || 0;
      testState.phase = "running";
      saveTestProgress();
      renderTest();
      window.scrollTo({ top: 0 });
      return true;
    }
    if (t.closest("[data-test-review]")) {
      testState.phase = "review";
      saveTestProgress();
      renderTest();
      window.scrollTo({ top: 0 });
      return true;
    }
    if (t.closest("[data-test-submit]")) {
      submitTest(false);
      return true;
    }
    if (t.closest("[data-test-exit]")) {
      saveTestProgress();
      clearTestTimer();
      navigate("/access-practice-lab/");
      return true;
    }
    if (t.closest("[data-print-report]")) {
      window.print();
      return true;
    }
    return false;
  }

  function renderTestLabGrid() {
    const grid = $("testLabGrid");
    if (!grid) return;
    if (!DATA.tests.length) {
      $("testLabSection")?.setAttribute("hidden", "");
      return;
    }
    grid.innerHTML = DATA.tests
      .map((test) => {
        const saved = safeParse(
          localStorage.getItem(testKey(test.id)) || "{}",
          {},
        );
        const items = (test.sections || []).reduce(
          (s, sec) => s + (sec.items || []).length,
          0,
        );
        const mins = (test.sections || []).reduce(
          (s, sec) => s + (Number(sec.estMinutes) || 8),
          0,
        );
        let status = "Not started";
        if (saved.results)
          status = `Completed · Level ${saved.results.level?.num ?? "—"}`;
        else if (saved.answers && Object.keys(saved.answers).length)
          status = "In progress";
        const sectionTags = (test.sections || [])
          .map(
            (s) =>
              `<span class="test-tag">${escapeHtml(s.title || s.domain)} ${(s.items || []).length}</span>`,
          )
          .join("");
        return `
        <article class="testlab-card">
          <div class="testlab-card-head">
            <span class="testlab-icon" aria-hidden="true">📝</span>
            <span class="score-badge ${resultStatusClass(status.startsWith("Completed") ? "Strong Practice" : status === "In progress" ? "In Progress" : "Not Started")}">${escapeHtml(status)}</span>
          </div>
          <h3>${escapeHtml(test.title)}</h3>
          <p class="testlab-meta">Grades ${escapeHtml(test.gradeCluster || "6-8")} · ${escapeHtml(test.tier || "Practice form")}</p>
          <div class="test-tag-row">${sectionTags}</div>
          <p class="testlab-stats">${items} questions · about ${mins} minutes</p>
          <a class="primary-link" href="/access-practice-lab/test/${escapeHtml(test.id)}">${status === "In progress" ? "Resume test" : "Start test"}</a>
        </article>`;
      })
      .join("");
  }

  function renderAll() {
    if (state.mode === "test") {
      setMode("test");
      renderTest();
      return;
    }
    if (state.mode === "hub") {
      setMode("hub");
      loadProgress();
      renderHub();
    } else {
      setMode("practice");
      loadProgress();
      renderPractice();
    }
  }

  function initFromRoute() {
    const route = parseRoute();
    state.mode = route.mode;
    state.hubScope = route.hubScope || "level";
    state.domain = route.domain;
    state.level = route.level;
    state.activityIndex = route.activityIndex ?? 0;
    if (route.mode === "test") {
      loadTest(route.testId);
      setMode("test");
      renderTest();
      return;
    } else if (testState.timerId) {
      clearTestTimer();
    }
    if (
      state.mode === "hub" &&
      state.hubScope === "domain" &&
      state.domain &&
      !state.level
    ) {
      state.level = defaultLevel(state.domain);
    }
    loadProgress();
    renderAll();
  }

  function init() {
    wireEvents();
    initFromRoute();
  }

  init();
})();
