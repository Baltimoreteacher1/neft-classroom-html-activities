(function (root) {
  "use strict";

  const DATA = root.MWReasoningData;
  const STORE = "neft.mathWorkbench.reasoning.v1";
  const COACH = "neft.mathWorkbench.reasoningCoach";
  const STEPS = ["Understand", "Model", "Explain", "Revise", "Evidence"];
  if (!DATA) return;

  let overlay;
  let body;
  let foot;
  let returnFocus;
  let view = "student";
  let sessions = loadSessions();
  let state = freshState();

  function freshState() {
    return {
      step: 0,
      skill: "ratio",
      wida: "2",
      language: root.__mwbLang === "es" ? "es" : "en",
      prompt: "",
      representations: [],
      firstDraft: "",
      revised: "",
      homeLanguage: "",
      beforeConfidence: "2",
      afterConfidence: "2",
      analysis: null,
      coach: null,
      coachStatus: "",
      linked: { a: 2, b: 3, factor: 4 },
      events: [],
      startedAt: new Date().toISOString(),
    };
  }

  function esc(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function snapshot() {
    try {
      return root.MathWorkbenchAPI ? root.MathWorkbenchAPI.getSnapshot() : {};
    } catch (_) {
      return {};
    }
  }

  function loadSessions() {
    try {
      const parsed = JSON.parse(localStorage.getItem(STORE));
      return Array.isArray(parsed) ? parsed.slice(0, 40) : [];
    } catch (_) {
      return [];
    }
  }

  function saveSessions() {
    try {
      localStorage.setItem(STORE, JSON.stringify(sessions.slice(0, 40)));
    } catch (_) {}
  }

  function track(type, detail) {
    state.events.push({ type, detail: detail || "", at: Date.now() });
  }

  function buildToolbarMenu() {
    const bar = document.querySelector(".top-actions");
    if (!bar || document.getElementById("mwbMoreTools")) return;
    const details = document.createElement("details");
    details.id = "mwbMoreTools";
    details.className = "mwb-more-tools";
    details.innerHTML =
      '<summary aria-label="Open more Workbench tools">••• More</summary><div class="mwb-more-menu"></div>';
    const menu = details.querySelector(".mwb-more-menu");
    // multBtn is deliberately NOT collected here. The Times Table is a
    // reference a student reaches for mid-problem, so it stays in the top row
    // where it can be tapped without opening a menu first; this builder used to
    // pull it in and undo that placement at runtime.
    ["bgTopBtn", "snapBtn", "calcBtn", "backupBtn", "openBtn", "helpBtn"].forEach((id) => {
      const node = document.getElementById(id);
      if (node) menu.appendChild(node);
    });
    bar.appendChild(details);
    document.addEventListener("click", (event) => {
      if (details.open && !details.contains(event.target)) details.open = false;
    });
  }

  function mount() {
    buildToolbarMenu();
    overlay = document.createElement("div");
    overlay.className = "mwr-overlay";
    overlay.id = "reasoningStudio";
    overlay.innerHTML =
      '<section class="mwr-dialog" role="dialog" aria-modal="true" aria-labelledby="mwrTitle">' +
      '<div class="mwr-head"><div class="mwr-title"><span class="mwr-title-mark" aria-hidden="true">↗</span>' +
      '<div><h2 id="mwrTitle">Reasoning Studio</h2><p id="mwrSubtitle">Model · connect · explain · revise</p></div></div>' +
      '<div class="mwr-btn-row"><button class="mwr-btn" data-action="teacher">Evidence view</button>' +
      '<button class="mwr-icon-btn" data-action="close" aria-label="Close Reasoning Studio">✕</button></div></div>' +
      '<nav class="mwr-steps" aria-label="Reasoning steps"></nav><div class="mwr-body"></div>' +
      '<div class="mwr-foot"></div></section>';
    document.body.appendChild(overlay);
    body = overlay.querySelector(".mwr-body");
    foot = overlay.querySelector(".mwr-foot");
    overlay.addEventListener("click", handleClick);
    overlay.addEventListener("input", handleInput);
    overlay.addEventListener("change", handleInput);
    document.getElementById("reasoningStudioBtn")?.addEventListener("click", open);
    document.addEventListener("keydown", handleKeys);
    render();
  }

  function open() {
    returnFocus = document.activeElement;
    overlay.classList.add("is-open");
    document.body.style.overflow = "hidden";
    render();
    overlay.querySelector("button, textarea, select, input")?.focus();
  }

  function close() {
    overlay.classList.remove("is-open");
    document.body.style.overflow = "";
    if (returnFocus && typeof returnFocus.focus === "function") returnFocus.focus();
  }

  function handleKeys(event) {
    if (!overlay?.classList.contains("is-open")) return;
    if (event.key === "Escape") close();
    if (event.key !== "Tab") return;
    const nodes = [...overlay.querySelectorAll("button:not(:disabled),input,select,textarea")].filter(
      (node) => node.offsetParent !== null,
    );
    if (!nodes.length) return;
    const first = nodes[0];
    const last = nodes[nodes.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  function handleInput(event) {
    const key = event.target.dataset.field;
    if (!key) return;
    if (key.startsWith("linked.")) {
      const sub = key.split(".")[1];
      state.linked[sub] = Math.max(1, Math.min(20, Number(event.target.value) || 1));
      updateLinkedPresentation();
      return;
    }
    state[key] = event.target.value;
    if (["skill", "wida", "language"].includes(key)) render();
  }

  function handleClick(event) {
    const button = event.target.closest("[data-action]");
    if (!button) return;
    const action = button.dataset.action;
    if (action === "close") return close();
    if (action === "teacher") {
      view = "teacher";
      return render();
    }
    if (action === "student") {
      view = "student";
      return render();
    }
    if (action === "next") return next();
    if (action === "back") {
      state.step = Math.max(0, state.step - 1);
      return render();
    }
    if (action === "rep") return toggleRep(button.dataset.value);
    if (action === "listen") return speak(state.prompt || DATA.STEMS[state.language][state.wida]);
    if (action === "stamp") return stampRepresentations();
    if (action === "analyze") return analyzeDraft();
    if (action === "coach") return coachReasoning(button);
    if (action === "finish") return finishSession();
    if (action === "new") {
      state = freshState();
      view = "student";
      return render();
    }
    if (action === "board-reflection") return addReflectionToBoard();
    if (action === "export") return exportEvidence();
    if (action === "clear-evidence") return clearEvidence();
    if (action === "coach-setting") return toggleCoach();
  }

  function next() {
    if (state.step === 0 && state.prompt.trim().length < 12) {
      body.querySelector(".mwr-live").textContent = "Add the problem or learning question first.";
      return;
    }
    if (state.step === 2 && !state.analysis) return analyzeDraft();
    state.step = Math.min(4, state.step + 1);
    track("step", STEPS[state.step]);
    render();
  }

  function toggleRep(value) {
    const index = state.representations.indexOf(value);
    if (index >= 0) state.representations.splice(index, 1);
    else state.representations.push(value);
    track("representation", value);
    render();
  }

  function speak(text) {
    if (!("speechSynthesis" in root) || !text) return;
    root.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = state.language === "es" ? "es-US" : "en-US";
    root.speechSynthesis.speak(utterance);
  }

  function stampRepresentations() {
    root.dispatchEvent(
      new CustomEvent("mwb:reasoning-stamp", {
        detail: {
          skill: state.skill,
          prompt: state.prompt,
          representations: state.representations,
          linked: state.linked,
          stem: DATA.STEMS[state.language][state.wida],
        },
      }),
    );
    track("stamp", state.representations.join("|"));
    const live = body.querySelector(".mwr-live");
    if (live) live.textContent = "Selected representations were added to the board.";
  }

  function analyzeDraft() {
    const response = state.revised || state.firstDraft;
    if (String(response).trim().length < 4) {
      body.querySelector(".mwr-live").textContent = "Write at least one reasoning sentence first.";
      return;
    }
    if (!state.firstDraft) state.firstDraft = response;
    state.analysis = DATA.analyze({
      skill: state.skill,
      response,
      snapshot: snapshot(),
      representations: state.representations,
      expectUnits: /\b(cost|mile|cup|feet|foot|meter|dollar|percent|%)\b/i.test(state.prompt),
    });
    track("signal", state.analysis.status);
    render();
  }

  async function coachReasoning(button) {
    const response = state.revised || state.firstDraft;
    if (!response.trim()) return analyzeDraft();
    state.coachStatus = "Looking at the reasoning…";
    state.coach = null;
    button.disabled = true;
    render();
    try {
      const skill = DATA.SKILLS[state.skill];
      const request = await fetch("/api/reasoning/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          standard: skill.standard,
          prompt: state.prompt,
          response,
          misconception: state.analysis?.signal || "",
        }),
      });
      const result = await request.json().catch(() => null);
      if (!request.ok || !result?.ok) throw new Error("unavailable");
      state.coach = result;
      state.coachStatus = "";
      track("coach", result.source || "unknown");
    } catch (_) {
      state.coachStatus = "The optional coach is unavailable. Use the local next move below.";
    }
    render();
  }

  function finishSession() {
    if (!state.revised.trim()) {
      state.revised = state.firstDraft;
      body.querySelector(".mwr-live").textContent = "Revise or confirm your explanation first.";
      return;
    }
    state.analysis = DATA.analyze({
      skill: state.skill,
      response: state.revised,
      snapshot: snapshot(),
      representations: state.representations,
    });
    track("finish", state.analysis.status);
    const session = {
      id: `mwr-${Date.now().toString(36)}`,
      at: new Date().toISOString(),
      skill: state.skill,
      standard: DATA.SKILLS[state.skill].standard,
      wida: state.wida,
      language: state.language,
      prompt: state.prompt,
      firstDraft: state.firstDraft,
      revised: state.revised,
      homeLanguage: state.homeLanguage,
      representations: state.representations.slice(),
      beforeConfidence: state.beforeConfidence,
      afterConfidence: state.afterConfidence,
      analysis: state.analysis,
      board: snapshot(),
      events: state.events.slice(),
    };
    sessions.unshift(session);
    saveSessions();
    state.step = 4;
    render();
  }

  function addReflectionToBoard() {
    const text = `Reasoning reflection\nFirst draft: ${state.firstDraft}\nRevision: ${state.revised}\nNext move: ${state.analysis?.nextMove || "Compare another strategy."}`;
    root.dispatchEvent(new CustomEvent("mwb:add-text", { detail: { text } }));
    body.querySelector(".mwr-live").textContent = "Your reflection was added to the board.";
  }

  function linkedHTML() {
    const a = state.linked.a;
    const b = state.linked.b;
    const k = state.linked.factor;
    return (
      '<div class="mwr-card"><h4>Linked representation lab</h4><p class="mwr-help">Change one value. The table, equation, and words update together.</p>' +
      '<div class="mwr-grid"><label class="mwr-label">First quantity<input class="mwr-input" type="number" min="1" max="20" data-field="linked.a" value="' +
      a +
      '"></label><label class="mwr-label">Second quantity<input class="mwr-input" type="number" min="1" max="20" data-field="linked.b" value="' +
      b +
      '"></label><label class="mwr-label">Scale factor<input class="mwr-input" type="number" min="1" max="20" data-field="linked.factor" value="' +
      k +
      '"></label></div><table class="mwr-linked-table"><caption>Equivalent relationship table</caption><tbody>' +
      `<tr><th scope="row">First</th><td data-linked="a">${a}</td><td data-linked="a2">${a * 2}</td><td data-linked="ak">${a * k}</td></tr>` +
      `<tr><th scope="row">Second</th><td data-linked="b">${b}</td><td data-linked="b2">${b * 2}</td><td data-linked="bk">${b * k}</td></tr>` +
      `</tbody></table><p class="mwr-stem" data-linked="equation">Equation: ${a}:${b} = ${a * k}:${b * k}</p>` +
      `<p data-linked="words">Words: For every ${a}, there are ${b}. Scaling both quantities by ${k} keeps the relationship equivalent.</p></div>`
    );
  }

  function updateLinkedPresentation() {
    if (!body) return;
    const { a, b, factor: k } = state.linked;
    const values = { a, a2: a * 2, ak: a * k, b, b2: b * 2, bk: b * k };
    Object.entries(values).forEach(([key, value]) => {
      const node = body.querySelector(`[data-linked="${key}"]`);
      if (node) node.textContent = String(value);
    });
    const equation = body.querySelector('[data-linked="equation"]');
    if (equation) equation.textContent = `Equation: ${a}:${b} = ${a * k}:${b * k}`;
    const words = body.querySelector('[data-linked="words"]');
    if (words)
      words.textContent = `Words: For every ${a}, there are ${b}. Scaling both quantities by ${k} keeps the relationship equivalent.`;
  }

  function renderSetup() {
    const skillOptions = Object.entries(DATA.SKILLS)
      .map(([id, item]) => `<option value="${id}"${id === state.skill ? " selected" : ""}>${esc(item.label)}</option>`)
      .join("");
    return (
      '<section class="mwr-panel"><h3>1. Understand the task</h3><p class="mwr-muted">Set a math goal and a language support level. No name or account is needed.</p>' +
      '<div class="mwr-grid"><label class="mwr-label">Math focus<select class="mwr-select" data-field="skill">' +
      skillOptions +
      '</select></label><label class="mwr-label">Language scaffold<select class="mwr-select" data-field="wida">' +
      [1, 2, 3, 4].map((n) => `<option value="${n}"${String(n) === state.wida ? " selected" : ""}>Level ${n}</option>`).join("") +
      '</select></label><label class="mwr-label">Studio language<select class="mwr-select" data-field="language"><option value="en">English</option><option value="es"' +
      (state.language === "es" ? " selected" : "") +
      '>Español</option></select></label><label class="mwr-label">Confidence before starting<select class="mwr-select" data-field="beforeConfidence">' +
      confidenceOptions(state.beforeConfidence) +
      '</select></label></div><label class="mwr-label">Problem or learning question<textarea class="mwr-textarea" data-field="prompt" dir="auto" placeholder="Paste or type the problem. No answer is stored in the page.">' +
      esc(state.prompt) +
      '</textarea></label><div class="mwr-btn-row"><button class="mwr-btn" data-action="listen">🔊 Read aloud</button></div><p class="mwr-live" role="status" aria-live="polite"></p></section>'
    );
  }

  function renderModel() {
    const skill = DATA.SKILLS[state.skill];
    const board = snapshot();
    const reps = skill.reps
      .map(
        (rep) =>
          `<button class="mwr-rep" data-action="rep" data-value="${esc(rep)}" aria-pressed="${state.representations.includes(rep)}">${esc(rep)}</button>`,
      )
      .join("");
    return (
      '<section class="mwr-panel"><h3>2. Model and connect</h3><p>Choose at least two ways to show the same idea. The goal is to explain how they match.</p>' +
      `<div class="mwr-reps">${reps}</div>` +
      `<p class="mwr-muted">Board evidence now: ${Number(board.modelCount || 0)} model objects and ${Number(board.strokeCount || 0)} ink strokes.</p>` +
      (["ratio", "percent"].includes(state.skill) ? linkedHTML() : "") +
      '<div class="mwr-btn-row"><button class="mwr-btn success" data-action="stamp">Add selected supports to board</button></div><p class="mwr-live" role="status" aria-live="polite"></p></section>'
    );
  }

  function renderExplain() {
    const response = state.firstDraft;
    const signal = state.analysis ? signalHTML(state.analysis) : "";
    const coach = coachHTML();
    return (
      '<section class="mwr-panel"><h3>3. Explain the connection</h3><p class="mwr-stem">' +
      esc(DATA.STEMS[state.language][state.wida]) +
      '</p><label class="mwr-label">Your reasoning<textarea class="mwr-textarea" data-field="firstDraft" dir="auto" placeholder="Explain a decision, not only an answer.">' +
      esc(response) +
      '</textarea></label><label class="mwr-label">Optional home-language rehearsal<small>Use any language. Math understanding is not reduced to English fluency.</small><textarea class="mwr-textarea" data-field="homeLanguage" dir="auto">' +
      esc(state.homeLanguage) +
      '</textarea></label><div class="mwr-btn-row"><button class="mwr-btn primary" data-action="analyze">Check reasoning evidence</button>' +
      (coachEnabled() ? '<button class="mwr-btn" data-action="coach">Ask the bounded reasoning coach</button>' : "") +
      '</div><p class="mwr-live" role="status" aria-live="polite">' +
      esc(state.coachStatus) +
      "</p>" +
      signal +
      coach +
      "</section>"
    );
  }

  function renderRevise() {
    return (
      '<section class="mwr-panel"><h3>4. Revise with evidence</h3><div class="mwr-grid"><article class="mwr-card"><h4>First draft</h4><p class="mwr-compare">' +
      esc(state.firstDraft) +
      '</p></article><article class="mwr-card"><h4>One next move</h4><p>' +
      esc(state.analysis?.nextMove || "Connect two representations with because.") +
      '</p></article></div><label class="mwr-label">Revised explanation<textarea class="mwr-textarea" data-field="revised" dir="auto">' +
      esc(state.revised || state.firstDraft) +
      '</textarea></label><label class="mwr-label">Confidence after revising<select class="mwr-select" data-field="afterConfidence">' +
      confidenceOptions(state.afterConfidence) +
      '</select></label><p class="mwr-live" role="status" aria-live="polite"></p></section>'
    );
  }

  function renderEvidence() {
    const last = sessions[0];
    const first = last?.firstDraft || state.firstDraft;
    const revised = last?.revised || state.revised;
    const analysis = last?.analysis || state.analysis;
    return (
      '<section class="mwr-panel"><h3>5. Evidence of growth</h3><p class="mwr-muted">The evidence describes the work. It does not label the learner.</p><div class="mwr-evidence-grid">' +
      '<article class="mwr-card"><h4>What changed</h4><p class="mwr-compare"><b>Before:</b> ' +
      esc(first) +
      "</p><p class=\"mwr-compare\"><b>After:</b> " +
      esc(revised) +
      '</p></article><article class="mwr-card"><h4>Current signal</h4>' +
      signalHTML(analysis) +
      '</article></div><div class="mwr-btn-row"><button class="mwr-btn success" data-action="board-reflection">Add reflection to board</button><button class="mwr-btn" data-action="teacher">Open evidence view</button><button class="mwr-btn" data-action="new">Start a new cycle</button></div><p class="mwr-live" role="status" aria-live="polite"></p></section>'
    );
  }

  function signalHTML(analysis) {
    if (!analysis) return "";
    return `<div class="mwr-signal" data-state="${esc(analysis.status)}"><strong>${esc(analysis.signal)}</strong><span>${esc(analysis.evidence)}</span><b>Next move: ${esc(analysis.nextMove)}</b><small>${Math.round(Number(analysis.confidence || 0) * 100)}% confidence · provisional, not a grade</small></div>`;
  }

  function coachHTML() {
    if (!state.coach) return "";
    return `<div class="mwr-card"><h4>Reasoning coach</h4>${state.coach.strengths ? `<p><b>Visible strength:</b> ${esc(state.coach.strengths)}</p>` : ""}${state.coach.gap ? `<p><b>One gap:</b> ${esc(state.coach.gap)}</p>` : ""}<p><b>One question:</b> ${esc(state.coach.question)}</p><small>No score and no answer was generated.</small></div>`;
  }

  function confidenceOptions(selected) {
    return [
      ["1", "Not sure yet"],
      ["2", "Developing"],
      ["3", "Mostly sure"],
      ["4", "Ready to defend it"],
    ]
      .map(([value, label]) => `<option value="${value}"${value === selected ? " selected" : ""}>${label}</option>`)
      .join("");
  }

  function renderTeacher() {
    const counts = {};
    sessions.forEach((session) => {
      const key = session.analysis?.status || "not-yet-observed";
      counts[key] = (counts[key] || 0) + 1;
    });
    const patterns = Object.entries(counts)
      .map(([key, count]) => `<span class="mwr-badge">${esc(key)} · ${count}</span>`)
      .join("");
    const list = sessions
      .map(
        (session) =>
          `<details class="mwr-session"><summary>${esc(DATA.SKILLS[session.skill]?.label || session.skill)} · ${new Date(session.at).toLocaleString()}</summary><p>${esc(session.analysis?.signal || "No signal")}</p><p><b>Representations:</b> ${esc(session.representations.join(", ") || "none recorded")}</p><p><b>Revision:</b> confidence ${esc(session.beforeConfidence)} → ${esc(session.afterConfidence)}</p></details>`,
      )
      .join("");
    body.innerHTML =
      '<section class="mwr-panel"><h3>De-identified evidence view</h3><p>Local reasoning cycles: <b>' +
      sessions.length +
      '</b>. No roster, name, or student ID is collected.</p><div class="mwr-card"><h4>Patterns to plan for</h4>' +
      (patterns || '<p class="mwr-muted">Complete a reasoning cycle to see patterns.</p>') +
      '</div><div class="mwr-card"><h4>Bounded AI setting</h4><p>The optional coach reviews one paragraph only when a learner presses its button. It returns one gap and one question, never a score or answer.</p><button class="mwr-btn" data-action="coach-setting">Coach on this device: ' +
      (coachEnabled() ? "on" : "off") +
      '</button></div><div class="mwr-btn-row"><button class="mwr-btn primary" data-action="export">Export de-identified research data</button><button class="mwr-btn" data-action="clear-evidence">Clear local evidence</button></div><div class="mwr-session-list">' +
      list +
      '</div></section>';
    foot.innerHTML = '<button class="mwr-btn" data-action="student">← Student reasoning cycle</button><span class="mwr-muted">Stored only on this device</span>';
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

  function toggleCoach() {
    try {
      localStorage.setItem(COACH, coachEnabled() ? "0" : "1");
    } catch (_) {}
    render();
  }

  function exportEvidence() {
    const safe = sessions.map((session) => ({
      at: session.at,
      skill: session.skill,
      standard: session.standard,
      wida: session.wida,
      language: session.language,
      representations: session.representations,
      signal: session.analysis?.status || "not-observed",
      signalConfidence: session.analysis?.confidence || 0,
      confidenceBefore: session.beforeConfidence,
      confidenceAfter: session.afterConfidence,
      boardModelCount: session.board?.modelCount || 0,
      revisionWordDelta: Math.max(0, session.revised.split(/\s+/).length - session.firstDraft.split(/\s+/).length),
      events: session.events.map(({ type, at }) => ({ type, at })),
    }));
    const blob = new Blob([JSON.stringify({ schema: 1, sessions: safe }, null, 2)], {
      type: "application/json",
    });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `math-workbench-evidence-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(link.href), 1000);
  }

  function clearEvidence() {
    if (!root.confirm("Clear all Reasoning Studio evidence stored on this device?")) return;
    sessions = [];
    saveSessions();
    render();
  }

  function render() {
    if (!overlay) return;
    const text = DATA.TEXT[state.language] || DATA.TEXT.en;
    overlay.querySelector("#mwrTitle").textContent = text.title;
    overlay.querySelector("#mwrSubtitle").textContent = text.subtitle;
    overlay.querySelector("[data-action=teacher]").textContent = view === "teacher" ? "Student view" : "Evidence view";
    overlay.querySelector("[data-action=teacher]").dataset.action = view === "teacher" ? "student" : "teacher";
    if (view === "teacher") return renderTeacher();
    const nav = overlay.querySelector(".mwr-steps");
    nav.innerHTML = STEPS.map(
      (label, index) => `<span class="mwr-step${index === state.step ? " is-current" : ""}${index < state.step ? " is-done" : ""}"${index === state.step ? ' aria-current="step"' : ""}>${index + 1}. ${label}</span>`,
    ).join("");
    const panels = [renderSetup, renderModel, renderExplain, renderRevise, renderEvidence];
    body.innerHTML = panels[state.step]();
    const pct = ((state.step + 1) / STEPS.length) * 100;
    foot.innerHTML =
      '<div class="mwr-btn-row">' +
      (state.step > 0 ? '<button class="mwr-btn" data-action="back">← Back</button>' : "") +
      (state.step < 3 ? '<button class="mwr-btn primary" data-action="next">Continue →</button>' : "") +
      (state.step === 3 ? '<button class="mwr-btn success" data-action="finish">Save revision evidence</button>' : "") +
      '</div><div><div class="mwr-progress" role="progressbar" aria-label="Reasoning cycle progress" aria-valuemin="0" aria-valuemax="100" aria-valuenow="' +
      Math.round(pct) +
      '"><span style="width:' +
      pct +
      '%"></span></div><small class="mwr-muted">' +
      esc(text.privacy) +
      "</small></div>";
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", mount);
  else mount();
})(window);
