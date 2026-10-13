/* Reasoning Studio core: rendering, navigation and event handling.
 * Panels, analysis, storage, tools, coach and the teacher view live in their
 * own files (loaded before this one). This file owns the event handlers for
 * the student flow. */
(function (root) {
  "use strict";

  const D = root.MWReasoningData;
  const A = root.MWRAnalyzer;
  const I = root.MWRI18n;
  const S = root.MWRStore;
  const T = root.MWRTools;
  const P = root.MWRPanels;
  const TP = root.MWRTeacher;
  const M = root.MWRState;
  const C = root.MWRCoach;
  const STAMP = root.MWRStamp;
  if (!(D && A && I && S && T && P && TP && M && C && STAMP)) return;

  const LAST = M.LAST;
  const PANELS = [P.setup, P.model, P.explain, P.revise, P.compare, P.evidence];
  const MAX_ROUNDS = 5;
  const CONNECTED = "connected-reasoning-visible";

  let overlay;
  let body;
  let foot;
  let stepList;
  let returnFocus;
  let view = "student";
  let ownIds = [];
  let replay = null;
  let dictation = null;
  let draftTimer = 0;
  let txToken = 0;
  let lastKey = "";

  const worldLang = () => (root.__mwbLang === "es" ? "es" : "en");
  const api = () => root.MathWorkbenchAPI || null;
  let state = M.fresh(null, worldLang());

  const t = (key, vars) => I.t(state.language, key, vars);
  const esc = A.escapeHtml;
  const track = (type, detail) => state.events.push({ type, detail: detail || "", at: Date.now() });
  const skillOf = () => D.SKILLS[state.skill] || D.SKILLS.ratio;

  function safeDigest() {
    try {
      const d = api() && api().getBoardDigest ? api().getBoardDigest() : null;
      if (d) return d;
    } catch (_) {}
    return { items: [], numbers: [], strokeCount: 0, objectCount: 0, hasEquationText: false };
  }

  function runAnalysis(text) {
    return D.analyze({
      skill: state.skill,
      response: text,
      language: state.language,
      level: state.level,
      digest: safeDigest(),
      representations: state.representations,
      prompt: state.prompt,
    });
  }

  /* ---------------- unfinished cycle ---------------- */
  function scheduleDraft() {
    clearTimeout(draftTimer);
    draftTimer = setTimeout(() => {
      if (!state.savedId && (state.prompt || state.firstDraft)) S.saveDraft(M.snapshot(state));
    }, 500);
  }

  function restoreDraft() {
    const draft = S.loadDraft();
    if (draft && typeof draft === "object" && (draft.prompt || draft.firstDraft)) {
      state = M.merge(M.fresh(null, worldLang()), draft);
    }
  }

  /* ---------------- context for panels ---------------- */
  function ctx() {
    const sessions = S.loadSessions();
    let boardProblem = false;
    let selection = null;
    try {
      boardProblem =
        Boolean(api() && api().getProblemText && api().getProblemText()) && !state.prompt.trim();
      selection = api() && api().getSelectedObject ? api().getSelectedObject() : null;
    } catch (_) {}
    return {
      state,
      lang: state.language,
      t,
      esc,
      skill: skillOf(),
      digest: safeDigest(),
      store: S,
      tools: T,
      own: sessions.filter((s) => ownIds.includes(s.id)),
      sessions,
      storedCount: sessions.length,
      retention: S.retentionDays(),
      coachOn: S.coachEnabled(),
      dictation: T.dictationSupported,
      boardProblem,
      selection,
      fadeNotice: state.fadeNotice,
      repFound: (rep) => (rep.kind === "words" ? null : A.repVerified(rep, safeDigest(), 0, "")),
      teacherUnlocked: TP.unlocked(),
    };
  }

  /* ---------------- mount ---------------- */
  function mount() {
    overlay = document.createElement("div");
    overlay.className = "mwr-overlay";
    overlay.id = "reasoningStudio";
    overlay.innerHTML = P.shell();
    document.body.appendChild(overlay);
    body = overlay.querySelector(".mwr-body");
    foot = overlay.querySelector(".mwr-foot");
    stepList = overlay.querySelector(".mwr-step-list");
    overlay.addEventListener("click", onClick);
    overlay.addEventListener("input", onInput);
    overlay.addEventListener("change", onInput);
    overlay.addEventListener("keydown", onKeys);
    root.addEventListener("mwb:lang", onLang);
    document.getElementById("reasoningStudioBtn")?.addEventListener("click", open);
    restoreDraft();
    render();
  }

  /* ---------------- open / close / mode ---------------- */
  function mode() {
    const pref = S.getPref("mode", "");
    if (pref === "dock" || pref === "modal") return pref;
    return root.innerWidth >= 1100 ? "dock" : "modal";
  }

  function applyMode() {
    const docked = mode() === "dock";
    overlay.classList.toggle("is-docked", docked);
    overlay.querySelector(".mwr-dialog").setAttribute("aria-modal", docked ? "false" : "true");
    document.body.style.overflow = docked || !overlay.classList.contains("is-open") ? "" : "hidden";
  }

  function open() {
    returnFocus = document.activeElement;
    view = "student";
    if (!state.languageManual) state.language = worldLang();
    overlay.classList.add("is-open");
    applyMode();
    S.loadSessions();
    ensureStemTx();
    render({ focusFirst: true });
  }

  function close() {
    T.stopSpeaking();
    if (dictation) dictation.stop();
    dictation = null;
    state.dictating = "";
    stopReplay();
    overlay.classList.remove("is-open");
    document.body.style.overflow = "";
    scheduleDraft();
    if (returnFocus && typeof returnFocus.focus === "function") returnFocus.focus();
  }

  function onLang(event) {
    state.language = event && event.detail && event.detail.lang === "es" ? "es" : "en";
    state.languageManual = false;
    ensureStemTx();
    if (overlay.classList.contains("is-open")) render({ keepFocus: true });
  }

  function onKeys(event) {
    // Keep the Workbench's global shortcuts (undo, delete, tool letters) out of the Studio.
    event.stopPropagation();
    if (event.key === "Escape") return close();
    if (event.key !== "Tab" || mode() === "dock") return;
    const nodes = [
      ...overlay.querySelectorAll(
        "button:not(:disabled),input:not([hidden]),select,textarea,summary",
      ),
    ].filter((n) => n.offsetParent !== null);
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

  /* ---------------- render ---------------- */
  function live(message) {
    const node = body.querySelector(".mwr-live");
    if (node) node.textContent = message;
  }

  function paintStemHome() {
    const node = body.querySelector("#mwrStemHome");
    if (!node) return;
    const info = I.HOME_LANGS[state.homeLang];
    node.hidden = !state.stemTx;
    node.textContent = state.stemTx;
    node.dir = info && info.rtl ? "rtl" : "ltr";
    const note = body.querySelector("#mwrStemNote");
    if (note) note.hidden = Boolean(state.stemTx) || !state.stemTxFailed;
  }

  function renderHeader() {
    overlay.querySelector("#mwrTitle").textContent = t("title");
    overlay.querySelector("#mwrSubtitle").textContent = t("subtitle");
    overlay.querySelector("#mwrDock").textContent = t(mode() === "dock" ? "hd.full" : "hd.dock");
    const label =
      view === "teacher"
        ? t("hd.student")
        : TP.unlocked()
          ? t("hd.teacher")
          : `🔒 ${t("hd.teacher")}`;
    overlay.querySelector("#mwrViewBtn").textContent = label;
    overlay.querySelector("#mwrClose").setAttribute("aria-label", t("hd.close"));
    overlay.querySelector("#mwrSteps").setAttribute("aria-label", t("steps.label"));
  }

  function renderSteps() {
    overlay.querySelector("#mwrSteps").classList.toggle("is-off", view === "teacher");
    stepList.innerHTML = view === "teacher" ? "" : P.steps(ctx());
  }

  const renderFoot = () => {
    foot.innerHTML = P.foot(ctx(), view);
  };

  function resumedNotice() {
    if (!state.resumed || state.step >= LAST) return "";
    return `<p class="mwr-notice" role="status">${esc(t("resume.note"))} <button type="button" class="mwr-btn small" data-action="new" data-keep="startover">${esc(t("resume.startOver"))}</button></p>`;
  }

  function render(opts) {
    if (!overlay) return;
    const o = opts || {};
    const active = document.activeElement;
    const inBody = active && body.contains(active);
    const keep =
      o.keepFocus === false || !inBody
        ? ""
        : active.getAttribute("data-keep") || active.getAttribute("data-field") || "";
    const key = `${view}${state.step}`;
    const scroll = key === lastKey ? body.scrollTop : 0;
    stopReplay();
    renderHeader();
    renderSteps();
    const c = ctx();
    body.innerHTML =
      view === "teacher"
        ? TP.render(c)
        : `<div class="mwr-wrap">${resumedNotice()}${PANELS[state.step](c)}</div>`;
    renderFoot();
    lastKey = key;
    body.scrollTop = scroll;
    const heading = body.querySelector("h3");
    if (heading) heading.tabIndex = -1;
    paintStemHome();
    afterRender();
    let target = null;
    if (keep)
      target =
        body.querySelector(`[data-keep="${keep}"]`) || body.querySelector(`[data-field="${keep}"]`);
    if (!target && o.focusFirst) target = body.querySelector("[data-autofocus]") || heading;
    if (target) target.focus({ preventScroll: Boolean(keep) });
  }

  function afterRender() {
    if (view !== "student" || state.step !== LAST) return;
    const canvas = body.querySelector("#mwrReplay");
    if (!canvas) return;
    let data = null;
    try {
      data = api() && api().getInkReplay ? api().getInkReplay() : null;
    } catch (_) {}
    replay = data && data.strokes.length ? T.mountReplay(canvas, data) : null;
    const note = body.querySelector("#mwrReplayNote");
    if (!replay) {
      canvas.hidden = true;
      for (const n of body.querySelectorAll('[data-action^="replay"], [data-field="replaySpeed"]'))
        n.disabled = true;
      if (note) note.textContent = t("replay.none");
      return;
    }
    replay.onState((playing) => {
      const b = body.querySelector('[data-action="replay-play"]');
      if (b) b.textContent = t(playing ? "replay.pause" : "replay.play");
    });
    replay.showAll();
  }

  function stopReplay() {
    if (replay) replay.pause();
    replay = null;
  }

  /* ---------------- navigation ---------------- */
  function goTo(step, opts) {
    state.step = Math.max(0, Math.min(LAST, step));
    state.maxStep = Math.max(state.maxStep, state.step);
    state.check = null;
    track("step", `step.${state.step + 1}`);
    scheduleDraft();
    render(Object.assign({ focusFirst: true, keepFocus: false }, opts));
  }

  function commitFirstDraft() {
    const text = state.firstDraft.trim();
    if (state.firstSeen !== text) {
      state.rounds = [];
      state.revised = text;
      state.firstSeen = text;
    }
    state.firstDraft = text;
    state.firstAnalysis = runAnalysis(text);
    state.analysis = state.firstAnalysis;
  }

  function commitRevision() {
    const text = state.revised.trim() || state.firstDraft;
    state.revised = text;
    const last = state.rounds.length
      ? state.rounds[state.rounds.length - 1].text
      : state.firstDraft;
    state.analysis = runAnalysis(text);
    if (text !== last && state.rounds.length < MAX_ROUNDS) {
      state.rounds.push({ text, at: new Date().toISOString(), status: state.analysis.status });
    }
  }

  function next() {
    if (state.step === 0 && state.prompt.trim().length < 12) return live(t("msg.problem"));
    if (state.step === 2) {
      if (state.firstDraft.trim().length < 4) return live(t("msg.write"));
      commitFirstDraft();
    }
    if (state.step === 3) commitRevision();
    if (state.step === 4) return finish();
    goTo(state.step + 1);
  }

  /* ---------------- save the cycle ---------------- */
  function finish() {
    if (!state.firstAnalysis) commitFirstDraft();
    state.revised = (state.revised || state.firstDraft).trim();
    state.analysis = runAnalysis(state.revised);
    let board = {};
    let thumb = "";
    try {
      board = api() && api().getSnapshot ? api().getSnapshot() : {};
      thumb = api() && api().getThumbnail ? api().getThumbnail(240) : "";
    } catch (_) {}
    state.thumb = thumb;
    track("finish", state.analysis.status);
    const session = M.buildSession(state, {
      compareInfo: A.analyzeCompare(state.compare),
      thumb,
      board,
    });
    const list = S.loadSessions().filter((s) => s.id !== session.id);
    list.unshift(session);
    S.saveSessions(list);
    state.savedId = session.id;
    if (!ownIds.includes(session.id)) ownIds.push(session.id);
    const level = Number(state.level);
    if (S.recordOutcome(level, state.analysis.status === CONNECTED)) {
      S.setPref("pendingFade", level + 1);
      S.resetFade(level + 1);
    }
    S.setPref("level", state.level);
    S.clearDraft();
    state.resumed = false;
    goTo(LAST);
  }

  function newCycle() {
    const carry = {
      skill: state.skill,
      level: state.level,
      language: state.language,
      homeLang: state.homeLang,
    };
    const keepManual = state.languageManual;
    const imported = state.imported;
    S.clearDraft();
    state = M.fresh(carry, worldLang());
    state.languageManual = keepManual;
    state.imported = imported;
    view = "student";
    ensureStemTx();
    render({ focusFirst: true, keepFocus: false });
  }

  /* ---------------- home-language stem ---------------- */
  function ensureStemTx() {
    const code = state.homeLang;
    state.stemTx = "";
    state.stemTxFailed = false;
    const token = ++txToken;
    if (code === "none" || (code === "es" && state.language === "es")) return;
    if (code === "es") {
      state.stemTx = D.STEMS.es[state.level] || "";
      return;
    }
    T.translate(D.STEMS.en[state.level], code).then((out) => {
      if (token !== txToken) return;
      state.stemTx = out;
      state.stemTxFailed = !out;
      paintStemHome();
    });
  }

  /* ---------------- speech ---------------- */
  const say = (text, code) => T.speak(text, code || I.speechLang(state.language));

  function toggleDictation(field) {
    const was = state.dictating;
    if (dictation) dictation.stop();
    dictation = null;
    state.dictating = "";
    if (was === field) return render({ keepFocus: true });
    const home = I.HOME_LANGS[state.homeLang];
    const code = field === "homeLanguage" && home ? home.speech : I.speechLang(state.language);
    dictation = T.createDictation(code);
    if (!dictation) return;
    state.dictating = field;
    dictation.start(
      (text) => appendText(field, text),
      () => {
        state.dictating = "";
        dictation = null;
        render({ keepFocus: true });
      },
      () => live(t("dictate.error")),
    );
    render({ keepFocus: true });
  }

  function appendText(field, text) {
    if (!text) return;
    state[field] = state[field] ? `${state[field]} ${text}` : text;
    const node = body.querySelector(`[data-field="${field}"]`);
    if (node) node.value = state[field];
    if (field === "firstDraft" || field === "revised") clearCheck();
    scheduleDraft();
  }

  /* ---------------- checks ---------------- */
  function clearCheck() {
    state.check = null;
    const node = body.querySelector("#mwrSignal");
    if (node) node.innerHTML = "";
  }

  function analyzeNow(field) {
    const text = state[field].trim();
    if (text.length < 4) return live(t("msg.write"));
    state.check = runAnalysis(text);
    track("signal", state.check.status);
    const node = body.querySelector("#mwrSignal");
    if (node) node.innerHTML = P.signal(ctx(), state.check, text);
    live("");
  }

  async function askCoach(button) {
    const text = (state.step === 3 ? state.revised : state.firstDraft).trim();
    if (!text) return analyzeNow(state.step === 3 ? "revised" : "firstDraft");
    if (state.coachTurn >= C.MAX_TURNS) return;
    const turn = state.coach ? 2 : 1;
    state.coachStatus = t("coach.looking");
    if (button) button.disabled = true;
    const lastTag =
      (state.check && state.check.tags[0]) ||
      (state.analysis && state.analysis.tags && state.analysis.tags[0]) ||
      "";
    try {
      state.coach = await C.request({
        standard: skillOf().standard,
        skill: state.skill,
        prompt: state.prompt,
        response: text,
        misconception: lastTag,
        language: state.language,
        level: state.level,
        digest: safeDigest(),
        turn,
        followup: state.coachFollow,
      });
      state.coachTurn = turn;
      state.coachFollow = "";
      state.coachStatus = "";
      track("coach", state.coach.source || "unknown");
    } catch (_) {
      state.coachStatus = t("coach.unavailable");
    }
    render({ keepFocus: true });
  }

  /* ---------------- events ---------------- */
  const hostFor = () => ({ state, t, render, body: () => body, clearOwn: () => (ownIds = []) });
  const mine = () => S.loadSessions().filter((s) => ownIds.includes(s.id));
  const stamp = () => new Date().toISOString().slice(0, 10);

  function insertFrame(text) {
    const node = body.querySelector('[data-field="firstDraft"]');
    if (!node) return;
    const at = node.selectionStart == null ? node.value.length : node.selectionStart;
    const end = node.selectionEnd == null ? at : node.selectionEnd;
    const gap = at && !/\s$/.test(node.value.slice(0, at)) ? " " : "";
    node.value = `${node.value.slice(0, at)}${gap}${text}${node.value.slice(end)}`;
    state.firstDraft = node.value;
    clearCheck();
    scheduleDraft();
    track("frame", "");
    node.focus();
  }

  function addAnchor() {
    const id = state.anchorId || (body.querySelector('[data-field="anchorId"]') || {}).value;
    const sentence = state.anchorText.trim();
    const ok = id && sentence && api() && api().addCallout ? api().addCallout(id, sentence) : false;
    if (!ok) return live(t("anc.missing"));
    const item = safeDigest().items.find((i) => i.id === id);
    state.anchors.push({ id, type: item ? item.type : "object", sentence });
    state.firstDraft = state.firstDraft ? `${state.firstDraft}\n${sentence}` : sentence;
    state.anchorText = "";
    clearCheck();
    scheduleDraft();
    render({ keepFocus: true });
  }

  function toggleRep(value) {
    const i = state.representations.indexOf(value);
    if (i >= 0) state.representations.splice(i, 1);
    else state.representations.push(value);
    track("representation", value);
    scheduleDraft();
    render({ keepFocus: true });
  }

  function onClick(event) {
    const el = event.target.closest("[data-action]");
    if (!el) return;
    const action = el.dataset.action;
    if (TP.handleAction(action, el, hostFor())) return;
    switch (action) {
      case "close":
        return close();
      case "dock":
        S.setPref("mode", mode() === "dock" ? "modal" : "dock");
        applyMode();
        return render({ keepFocus: false });
      case "view-toggle":
        view = view === "teacher" ? "student" : "teacher";
        return render({ focusFirst: true, keepFocus: false });
      case "teacher-recheck":
        render({ keepFocus: false });
        return live(TP.unlocked() ? "" : t("tv.stillLocked"));
      case "tour-done":
        S.setPref("tourSeen", true);
        return render({ focusFirst: true, keepFocus: false });
      case "fade-undo":
        state.level = state.fadeFrom || state.level;
        state.fadeNotice = false;
        S.resetFade(Number(state.level));
        ensureStemTx();
        return render({ keepFocus: true });
      case "goto":
        return goTo(Number(el.dataset.step));
      case "next":
        return next();
      case "back":
        return goTo(state.step - 1);
      case "rep":
        return toggleRep(el.dataset.value);
      case "listen":
        return say(state.prompt || D.STEMS[state.language][state.level]);
      case "listen-stem": {
        const base = D.STEMS[state.language][state.level];
        const home = I.HOME_LANGS[state.homeLang];
        if (state.stemTx && home)
          return T.speak(base, I.speechLang(state.language), () =>
            T.speak(state.stemTx, home.speech),
          );
        return say(base);
      }
      case "use-board-problem": {
        const text = api() && api().getProblemText ? api().getProblemText() : "";
        if (text) state.prompt = text;
        scheduleDraft();
        return render({ keepFocus: false, focusFirst: true });
      }
      case "stamp": {
        const objects = STAMP.build(state, api());
        root.dispatchEvent(new CustomEvent("mwb:reasoning-stamp", { detail: { objects } }));
        track("stamp", state.representations.join("|"));
        return live(t(objects.length ? "s2.stamped" : "s2.stampNone"));
      }
      case "frame":
        return insertFrame(el.dataset.text || "");
      case "exemplar":
        state.exemplarPick = el.dataset.value;
        return render({ keepFocus: true });
      case "dictate":
        return toggleDictation(el.dataset.fieldTarget);
      case "anchor":
        return addAnchor();
      case "analyze":
        return analyzeNow("firstDraft");
      case "analyze-revision":
        if (state.revised.trim().length < 4) return live(t("msg.write"));
        commitRevision();
        state.check = state.analysis;
        return render({ keepFocus: true });
      case "coach":
        return askCoach(el);
      case "speak-signal": {
        const a = state.check || state.analysis;
        return a && say(`${a.signal} ${a.evidence} ${t("sig.next")} ${a.nextMove}`);
      }
      case "speak-coach": {
        const r = state.coach;
        return r && say([r.strengths, r.gap, r.question].filter(Boolean).join(" "));
      }
      case "replay-play":
        if (replay) return replay.playing ? replay.pause() : replay.play();
        return;
      case "replay-restart":
        if (!replay) return;
        replay.reset();
        return replay.play();
      case "board-reflection": {
        const move = (state.analysis && state.analysis.nextMove) || "";
        const text = `${t("refl.title")}\n${t("refl.first")} ${state.firstDraft}\n${t("refl.revision")} ${state.revised}\n${t("refl.next")} ${move}`;
        root.dispatchEvent(new CustomEvent("mwb:add-text", { detail: { text } }));
        return live(t("s6.added"));
      }
      case "share":
        T.download(
          `math-workbench-reasoning-share-${stamp()}.json`,
          JSON.stringify(S.shareExport(mine()), null, 2),
          "application/json",
        );
        return live(t("s6.shared"));
      case "print":
        return T.printPortfolio(mine(), state.language);
      case "delete-cycle":
        S.deleteSession(el.dataset.id);
        ownIds = ownIds.filter((id) => id !== el.dataset.id);
        if (state.savedId === el.dataset.id) state.savedId = "";
        return render({ keepFocus: false });
      case "new":
        return newCycle();
      default:
    }
  }

  function onInput(event) {
    const el = event.target;
    if (el.id === "mwrImport" && event.type === "change")
      return TP.importFiles(el.files || [], hostFor());
    const key = el.dataset && el.dataset.field;
    if (!key) return;
    if (TP.handleInput(key, el, hostFor())) return;
    if (key.startsWith("linked.")) {
      state.linked[key.split(".")[1]] = Math.max(
        1,
        Math.min(20, Math.round(Number(el.value)) || 1),
      );
      return updateLinked();
    }
    if (key === "compare.second" || key === "compare.which") {
      state.compare[key.split(".")[1]] = el.value;
      return scheduleDraft();
    }
    switch (key) {
      case "anchorId":
      case "anchorText":
        state[key] = el.value;
        return;
      case "replaySpeed":
        if (replay) replay.setSpeed(el.value);
        return;
      case "speechRate":
        return T.setRate(el.value);
      case "coachFollow":
        state.coachFollow = el.value.slice(0, 600);
        return;
      default:
    }
    state[key] = el.value;
    if (key === "firstDraft" || key === "revised") clearCheck();
    if (key === "skill") {
      const valid = skillOf().reps.map((r) => r.id);
      state.representations = state.representations.filter((id) => valid.includes(id));
      state.exemplarPick = "";
    }
    if (key === "language") state.languageManual = true;
    scheduleDraft();
    if (["skill", "level", "language", "homeLang"].includes(key)) {
      if (key !== "skill") ensureStemTx();
      render({ keepFocus: true });
    }
  }

  function updateLinked() {
    const { a, b, factor: k } = state.linked;
    const values = { a, a2: a * 2, ak: a * k, b, b2: b * 2, bk: b * k };
    for (const [key, value] of Object.entries(values)) {
      const node = body.querySelector(`[data-linked="${key}"]`);
      if (node) node.textContent = String(value);
    }
    const eq = body.querySelector('[data-linked="equation"]');
    if (eq)
      eq.textContent =
        state.skill === "percent"
          ? `${a}/${b} = ${a * k}/${b * k}`
          : `${a}:${b} = ${a * k}:${b * k}`;
    const words = body.querySelector('[data-linked="words"]');
    if (words)
      words.textContent = t(state.skill === "percent" ? "lab.wordsPercent" : "lab.wordsRatio", {
        a,
        b,
        k,
      });
  }

  root.MWRStudio = Object.freeze({ open, close, getState: () => state, getView: () => view });

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", mount);
  else mount();
})(window);
