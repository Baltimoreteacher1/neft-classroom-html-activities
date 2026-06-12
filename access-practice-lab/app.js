(() => {
  const DATA = window.ACCESS_LAB_DATA;
  const $ = (id) => document.getElementById(id);
  const state = {
    domain: "Listening",
    level: "A",
    activityIndex: 0,
    selected: {},
    attempts: {},
    feedback: {},
    sortAnswers: {},
    notes: {},
    studentName: "",
    complete: new Set(),
  };
  const storagePrefix = "accessPracticeLab:v1";
  function escapeHtml(value) {
    return String(value || "").replace(/[&<>"']/g, (ch) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    })[ch]);
  }
  function routeToState() {
    const cleanPath = window.location.pathname.replace(/^\/access-practice-lab\/?/, "");
    const route = cleanPath || window.location.hash.replace(/^#\/?/, "");
    const parts = route.split("/").filter(Boolean);
    state.domain = parts[0] || "Listening";
    if (state.domain === "Model-Test") {
      state.level = `${parts[1] || "6-8"}-${parts[2] || "A"}`;
      state.activityIndex = indexFromRoutePart(parts[3]);
      return;
    }
    state.level = parts[1] || "A";
    state.activityIndex = indexFromRoutePart(parts[2]);
  }
  function activeDomain() {
    return DATA.domains[state.domain] || DATA.domains.Listening;
  }
  function activeLevel() {
    return activeDomain().levels[state.level] || DATA.domains.Listening.levels.A;
  }
  function activities() {
    return activeLevel().activities || [];
  }
  function activeActivity() {
    const list = activities();
    return list[Math.min(state.activityIndex, Math.max(0, list.length - 1))];
  }
  function indexFromRoutePart(part) {
    const list = activities();
    if (!part) return 0;
    if (/^\d+$/.test(part)) return Math.max(0, Number(part) || 0);
    return Math.max(0, list.findIndex((activity) => activity.id === part));
  }
  function storageKey() {
    return `${storagePrefix}:${state.domain}:${state.level}`;
  }
  function safeParse(value, fallback) {
    try {
      return JSON.parse(value);
    } catch {
      return fallback;
    }
  }
  function loadProgress() {
    const saved = safeParse(localStorage.getItem(storageKey()) || "{}", {});
    state.studentName = localStorage.getItem(`${storagePrefix}:studentName`) || "";
    state.complete = new Set(Array.isArray(saved.complete) ? saved.complete : []);
    state.selected = saved.selected || {};
    state.sortAnswers = saved.sortAnswers || {};
    state.attempts = saved.attempts || {};
    state.feedback = saved.feedback || {};
    state.notes = saved.notes || {};
  }
  function saveProgress() {
    const payload = {
      complete: [...state.complete],
      selected: state.selected,
      sortAnswers: state.sortAnswers,
      attempts: state.attempts,
      feedback: state.feedback,
      notes: state.notes,
    };
    localStorage.setItem(storageKey(), JSON.stringify(payload));
    localStorage.setItem(`${storagePrefix}:studentName`, state.studentName);
    showSaveStatus("Saved on this device.");
  }
  function setHash(domain, level, index) {
    const target = activities()[Math.max(0, Math.min(index, activities().length - 1))];
    const page = target?.id || String(index);
    let path = "";
    if (domain === "Model-Test") {
      const [cluster, band, testLevel] = level.split("-");
      path = `/access-practice-lab/${domain}/${cluster}-${band}/${testLevel}/${page}`;
    } else {
      path = `/access-practice-lab/${domain}/${level}/${page}`;
    }
    history.pushState({}, "", path);
    initFromRoute();
  }
  function pill(text, tone = "") {
    return `<span class="pill ${tone}">${escapeHtml(text)}</span>`;
  }
  function renderHeader() {
    const domain = activeDomain();
    const level = activeLevel();
    const levelLabel = level.displayLabel || `Level ${state.level}`;
    const path = `${DATA.productTitle} > ${state.domain} > ${levelLabel}`;
    $("breadcrumb").textContent = path;
    $("pageTitle").textContent = DATA.productTitle;
    $("pageSubtitle").textContent = `${state.domain} ${levelLabel}: ${domain.description}`;
    $("studentGoal").textContent = level.studentGoal;
    $("studentObjective").innerHTML = `${escapeHtml(level.objective)} ${escapeHtml(level.target)}${levelNotesHTML()}`;
    $("metaRow").innerHTML = [
      pill(state.domain, "domain"),
      pill(levelLabel, "level"),
      pill(level.range || "WIDA practice", "range"),
      pill(level.time || "Flexible time", "time"),
    ].join("");
    $("labHero").style.setProperty("--domain-color", domain.color || "#1f766f");
  }
  function renderDomains() {
    $("domainGrid").innerHTML = Object.entries(DATA.domains).map(([name, domain]) => {
      const firstLevel = Object.keys(domain.levels || {})[0];
      const hasLevel = Boolean(firstLevel);
      const isActive = name === state.domain;
      const firstId = domain.levels?.[firstLevel]?.activities?.[0]?.id || 0;
      const label = name === "Model-Test" ? "Model Tests" : name;
      const route = hasLevel && name === "Model-Test" ? `/access-practice-lab/Model-Test/6-8/A/${firstId}` : hasLevel ? `/access-practice-lab/${name}/${firstLevel}/${firstId}` : "/access-practice-lab/Listening/A/classroom-directions";
      const status = name === "Model-Test" ? "Open grades 6-8 model test" : hasLevel ? `Open ${domain.levels[firstLevel].displayLabel || `Level ${firstLevel}`}` : "Choose Listening Level A first";
      const domainProgress = getProgressFor(name, firstLevel);
      return `
        <a class="domain-card ${isActive ? "active" : ""}" href="${route}" style="--domain-color:${domain.color}">
          <span class="domain-icon">${escapeHtml(domain.icon)}</span>
          <strong>${escapeHtml(label)}</strong>
          <span>${escapeHtml(domain.description)}</span>
          <em>${escapeHtml(status)} · ${domainProgress}</em>
        </a>
      `;
    }).join("");
  }
  function levelHref(domainName, levelKey, level) {
    if (domainName === "Model-Test") {
      return `/access-practice-lab/Model-Test/${levelKey.replace(/-([ABC])$/, "/$1")}/${level.activities[0]?.id || 0}`;
    }
    return `/access-practice-lab/${domainName}/${levelKey}/${level.activities[0]?.id || 0}`;
  }
  function renderLevels() {
    const domain = activeDomain();
    const levels = Object.entries(domain.levels || {});
    const levelGrid = $("levelGrid");
    if (!levelGrid) return;
    levelGrid.innerHTML = levels.map(([levelKey, level]) => {
      const active = levelKey === state.level;
      const href = levelHref(state.domain, levelKey, level);
      return `
        <a class="level-card ${active ? "active" : ""}" href="${href}">
          <strong>${escapeHtml(level.displayLabel || `Level ${levelKey}`)}</strong>
          <span>${escapeHtml(level.time || "Flexible time")}</span>
          <em>${getProgressFor(state.domain, levelKey)}</em>
        </a>
      `;
    }).join("");
  }
  function renderChooseSubtitle() {
    const subtitle = $("chooseSubtitle");
    if (!subtitle) return;
    const levelLabel = activeLevel().displayLabel || `Level ${state.level}`;
    subtitle.textContent = `Switch domains without losing your ${state.domain} ${levelLabel} progress.`;
  }
  function activityHref(domainName, levelKey, activityId) {
    if (domainName === "Model-Test") {
      return `/access-practice-lab/Model-Test/${levelKey.replace(/-([ABC])$/, "/$1")}/${activityId}`;
    }
    return `/access-practice-lab/${domainName}/${levelKey}/${activityId}`;
  }
  function renderLinkBoard() {
    const board = $("linkBoardGrid");
    if (!board) return;
    const sections = [];
    for (const [domainName, domain] of Object.entries(DATA.domains)) {
      for (const [levelKey, level] of Object.entries(domain.levels || {})) {
        const levelLabel = domainName === "Model-Test"
          ? (level.displayLabel || levelKey.replace("6-8-", "Grades 6-8 · "))
          : `${domainName} ${level.displayLabel || `Level ${levelKey}`}`;
        const links = (level.activities || []).map((activity, index) => {
          const href = activityHref(domainName, levelKey, activity.id);
          return `<a href="${href}">${index + 1}. ${escapeHtml(activity.title)}</a>`;
        }).join("");
        if (links) sections.push(`<section><h3>${escapeHtml(levelLabel)}</h3>${links}</section>`);
      }
    }
    board.innerHTML = sections.join("");
  }
  function getProgressFor(domainName, levelName) {
    const domain = DATA.domains[domainName];
    const total = domain?.levels?.[levelName]?.activities?.length || 0;
    const saved = safeParse(localStorage.getItem(`${storagePrefix}:${domainName}:${levelName}`) || "{}", {});
    const done = Array.isArray(saved.complete) ? saved.complete.length : 0;
    return total ? `${done}/${total} done` : "coming soon";
  }
  function renderProgress() {
    const list = activities();
    const done = list.filter((activity) => state.complete.has(activity.id)).length;
    const percent = list.length ? Math.round((done / list.length) * 100) : 0;
    $("progressSummary").textContent = `${done} of ${list.length} activities complete`;
    $("progressDetail").textContent = done === list.length
      ? "Great work. You finished this practice path."
      : `Current activity: ${Math.min(state.activityIndex + 1, list.length)} of ${list.length}`;
    $("progressFill").style.width = `${percent}%`;
  }
  function renderLearnerTools() {
    const name = $("studentName");
    if (name && name.value !== state.studentName) name.value = state.studentName;
  }
  function renderActivityList() {
    const list = activities();
    const itemLabel = state.domain === "Model-Test" ? "Item" : "Activity";
    $("activityList").innerHTML = list.map((activity, index) => {
      const isActive = index === state.activityIndex;
      const done = state.complete.has(activity.id);
      return `
        <button class="path-item ${isActive ? "active" : ""}" type="button" data-jump="${index}" aria-current="${isActive ? "step" : "false"}">
          <span>${done ? "Done" : `${itemLabel} ${index + 1}`}</span>
          <strong>${escapeHtml(activity.title)}</strong>
          <small>${escapeHtml(activity.skill)}</small>
        </button>
      `;
    }).join("");
  }
  function listHTML(items) {
    if (!items || !items.length) return "";
    return `<ul>${items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`;
  }
  function vocabularyHTML(activity) {
    const terms = activity.vocabulary || [];
    const essential = DATA.essentialTerms || [];
    return `
      <section class="support-box vocab-box" aria-labelledby="vocabTitle">
        <h3 id="vocabTitle">Key Vocabulary</h3>
        <dl>
          ${terms.map(([term, meaning]) => `<div><dt>${escapeHtml(term)}</dt><dd>${escapeHtml(meaning)}</dd></div>`).join("")}
        </dl>
        <p class="spanish-mini"><strong>English / Spanish academic words:</strong> ${essential.map(([en, es]) => `${escapeHtml(en)} / ${escapeHtml(es)}`).join("; ")}</p>
      </section>
    `;
  }
  function frameHTML(activity) {
    return `
      <section class="support-box frame-box" aria-labelledby="frameTitle">
        <h3 id="frameTitle">Sentence Frames</h3>
        ${listHTML(activity.frames || [])}
      </section>
    `;
  }
  function trackerHTML(activity) {
    if (!activity.tracker && !activity.wordBank) return "";
    const tracker = activity.tracker || [];
    const wordBank = activity.wordBank || [];
    return `
      <section class="support-box tracker-box" aria-labelledby="trackerTitle">
        <h3 id="trackerTitle">Detail Tracker</h3>
        ${tracker.map(([label, value]) => `<p><strong>${escapeHtml(label)}</strong> ${escapeHtml(value)}</p>`).join("")}
        ${wordBank.length ? `<p><strong>Word bank:</strong> ${wordBank.map(escapeHtml).join(", ")}</p>` : ""}
      </section>
    `;
  }
  function multipleChoiceHTML(activity) {
    const selected = state.selected[activity.id];
    return `
      <fieldset class="choice-set">
        <legend class="visually-hidden">Choose the best answer</legend>
        ${activity.options.map((option) => `
          <label class="choice-card ${selected === option.id ? "selected" : ""}">
            <input type="radio" name="answer" value="${escapeHtml(option.id)}" ${selected === option.id ? "checked" : ""} />
            <span class="choice-visual" aria-hidden="true">${escapeHtml(option.visual || "")}</span>
            <span>${escapeHtml(option.text)}</span>
          </label>
        `).join("")}
      </fieldset>
      <button class="primary-action" type="button" data-check>${state.domain === "Model-Test" ? "Save and check item" : "Check my listening choice"}</button>
    `;
  }
  function constructedHTML(activity) {
    return `
      <label class="constructed-response">
        <span>${escapeHtml(activity.responseLabel || "Type your response")}</span>
        <textarea data-note rows="5" placeholder="${escapeHtml(activity.responsePlaceholder || "Use the frame and write your answer here.")}">${escapeHtml(state.notes[activity.id] || "")}</textarea>
      </label>
      <button class="primary-action" type="button" data-check>Save constructed response</button>
    `;
  }
  function sortHTML(activity) {
    const answers = state.sortAnswers[activity.id] || {};
    return `
      <div class="sort-list">
        ${activity.items.map((item) => `
          <div class="sort-row">
            <p>${escapeHtml(item.text)}</p>
            <label>
              <span class="visually-hidden">Category for ${escapeHtml(item.text)}</span>
              <select data-sort-item="${escapeHtml(item.id)}">
                <option value="">Choose a category</option>
                ${activity.categories.map((category) => `
                  <option value="${escapeHtml(category)}" ${answers[item.id] === category ? "selected" : ""}>${escapeHtml(category)}</option>
                `).join("")}
              </select>
            </label>
          </div>
        `).join("")}
      </div>
      <button class="primary-action" type="button" data-check>Check my sort</button>
    `;
  }
  function answerHTML(activity) {
    if (activity.type === "sort") return sortHTML(activity);
    if (activity.type === "constructed") return constructedHTML(activity);
    return multipleChoiceHTML(activity);
  }
  function testModeHTML(activity) {
    if (!activity.testPart) return "";
    return `
      <section class="test-mode-box" aria-label="Practice test information">
        <div>
          <strong>${escapeHtml(activity.testPart)}</strong>
          <span>${escapeHtml(activity.testFormat || "Grades 6-8 ACCESS-style practice")}</span>
        </div>
        <p>This is EduWonderLab classroom practice inspired by ACCESS skills. It is not an official WIDA test.</p>
        ${activity.adminScript ? `<p class="admin-script"><strong>Read aloud:</strong> ${escapeHtml(activity.adminScript)}</p>` : ""}
      </section>
    `;
  }
  function teacherHTML(activity) {
    const teacher = activity.teacher;
    if (!teacher) return "";
    const rows = [
      ["Use", teacher.use],
      ["Language function", teacher.function],
      ["Lower support", teacher.lower],
      ["On-level", teacher.onLevel],
      ["Challenge", teacher.challenge],
      ["No-tech option", teacher.noTech],
      ["Discussion prompt", teacher.prompt],
    ].filter(([, value]) => value);
    if (!rows.length) return "";
    return `
      <details class="teacher-notes">
        <summary>Teacher notes (optional)</summary>
        <dl>
          ${rows.map(([label, value]) => `<div><dt>${escapeHtml(label)}</dt><dd>${escapeHtml(value)}</dd></div>`).join("")}
        </dl>
      </details>
    `;
  }
  function levelNotesHTML() {
    const summary = activeLevel().teacherSummary;
    if (!summary) return "";
    return `
      <details class="level-notes">
        <summary>About this practice level</summary>
        <p>${escapeHtml(summary)}</p>
      </details>
    `;
  }
  function feedbackHTML(activity) {
    const feedback = state.feedback[activity.id];
    if (!feedback) return "";
    const heading = feedback.ok ? (state.domain === "Model-Test" ? "Item saved" : `Good ${state.domain.toLowerCase()}`) : "Try this hint";
    return `
      <section class="feedback-box ${feedback.ok ? "correct" : "hint"}" role="status" aria-live="polite">
        <h3>${heading}</h3>
        <p>${escapeHtml(feedback.message)}</p>
        ${feedback.support ? `<p class="model">${escapeHtml(feedback.support)}</p>` : ""}
      </section>
    `;
  }
  function certificateHTML() {
    const list = activities();
    if (!list.length || list.some((activity) => !state.complete.has(activity.id))) return "";
    const name = state.studentName || "Student";
    return `
      <section class="certificate-box">
        <h3>Completion Slip</h3>
        <p><strong>${escapeHtml(name)}</strong> completed ${escapeHtml(state.domain)} ${escapeHtml(activeLevel().displayLabel || `Level ${state.level}`)} practice.</p>
        <p>I practiced listening, vocabulary, sentence frames, and explaining with evidence.</p>
      </section>
    `;
  }
  function renderActivity() {
    const activity = activeActivity();
    if (!activity) {
      $("activityPanel").innerHTML = `<div class="empty-state">This practice path is not available yet. Choose Listening Level A to begin.</div>`;
      return;
    }
    const done = state.complete.has(activity.id);
    const showReflection = activity.type !== "constructed";
    $("activityPanel").innerHTML = `
      <article class="activity-card">
        <header class="activity-intro">
          <div class="activity-topline">
            ${pill(`${state.domain === "Model-Test" ? "Item" : "Activity"} ${state.activityIndex + 1}`, "number")}
            ${pill(activity.skill, "skill")}
            ${pill(activity.time, "time")}
            ${done ? pill("Complete", "complete") : ""}
          </div>
          <h2 id="activityTitle">${escapeHtml(activity.title)}</h2>
          <p class="directions">${escapeHtml(activity.directions)}</p>
          ${testModeHTML(activity)}
        </header>

        <section class="activity-guide" aria-label="How to practice">
          <div class="student-steps">
            <section>
              <h3>Listen / Read / Think</h3>
              <ol>
                <li>Listen for the important words.</li>
                <li>Read each answer choice carefully.</li>
                <li>Choose the answer that matches the evidence.</li>
              </ol>
            </section>
            <section>
              <h3>What to listen for</h3>
              ${listHTML(activity.listenFor || [])}
            </section>
          </div>
        </section>

        <section class="prompt-box" aria-labelledby="promptTitle">
          <h3 id="promptTitle">Practice Prompt</h3>
          <p>${escapeHtml(activity.prompt || "Sort each phrase into the best category.")}</p>
          <button class="listen-btn" type="button" data-speak>Read prompt aloud</button>
        </section>

        <section class="activity-support" aria-label="Vocabulary and frames">
          <div class="support-grid">
            ${vocabularyHTML(activity)}
            ${frameHTML(activity)}
            ${trackerHTML(activity)}
          </div>
        </section>

        <section class="answer-zone" aria-label="Answer area">
          ${answerHTML(activity)}
          ${feedbackHTML(activity)}
        </section>

        ${showReflection ? `
          <section class="extension-box" aria-label="Say or write your answer">
            <h3>Say It or Write It</h3>
            <p>${escapeHtml(activity.extension)}</p>
            <label class="reflection-label">
              <span>My sentence</span>
              <textarea data-note rows="3" placeholder="I chose ___ because ___.">${escapeHtml(state.notes[activity.id] || "")}</textarea>
            </label>
          </section>
        ` : ""}

        <footer class="activity-meta">
          <section class="alignment-box">
            <h3>ACCESS Skill Alignment</h3>
            <div>${(activity.wida || []).map((item) => pill(item, "alignment")).join("")}</div>
          </section>
          ${teacherHTML(activity)}
        </footer>

        ${certificateHTML()}
        <nav class="activity-nav" aria-label="Activity controls">
          <button type="button" data-prev ${state.activityIndex === 0 ? "disabled" : ""}>Previous activity</button>
          <button type="button" data-mark>${done ? "Mark not complete" : "Mark complete"}</button>
          <button type="button" data-next ${state.activityIndex >= activities().length - 1 ? "disabled" : ""}>Next activity</button>
        </nav>
      </article>
    `;
  }
  function checkAnswer() {
    const activity = activeActivity();
    if (!activity) return;
    state.attempts[activity.id] = (state.attempts[activity.id] || 0) + 1;
    let ok = false;
    if (activity.type === "constructed") {
      ok = (state.notes[activity.id] || "").trim().length >= 12;
    } else if (activity.type === "sort") {
      const answers = state.sortAnswers[activity.id] || {};
      ok = activity.items.every((item) => answers[item.id] === item.answer);
    } else {
      ok = state.selected[activity.id] === activity.answer;
    }
    if (ok) {
      state.complete.add(activity.id);
      state.feedback[activity.id] = { ok: true, message: activity.correct || "Response saved. Review your answer for a clear claim and evidence." };
    } else {
      state.feedback[activity.id] = {
        ok: false,
        message: activity.hint,
        support: state.attempts[activity.id] >= 2 ? activity.support : "",
      };
    }
    saveProgress();
    renderAll();
  }
  function speakPrompt() {
    const activity = activeActivity();
    if (!activity || !("speechSynthesis" in window)) {
      showSaveStatus("Read aloud is not available in this browser.");
      return;
    }
    window.speechSynthesis.cancel();
    const text = `${activity.title}. ${activity.prompt || activity.directions}`;
    window.speechSynthesis.speak(new SpeechSynthesisUtterance(text));
  }
  function showSaveStatus(message) {
    const el = $("saveStatus");
    if (el) el.textContent = message;
  }
  async function copySummary() {
    const list = activities();
    const done = list.filter((activity) => state.complete.has(activity.id)).length;
    const rows = list.map((activity, index) => `${index + 1}. ${activity.title}: ${state.complete.has(activity.id) ? "complete" : "not complete"}`);
    const summary = [`${DATA.productTitle}: ${state.domain} Level ${state.level}`, `Student: ${state.studentName || "Not entered"}`, `Progress: ${done}/${list.length} complete`, ...rows].join("\n");
    showSaveStatus("Progress summary ready.");
    try {
      await navigator.clipboard.writeText(summary);
      showSaveStatus("Progress summary copied.");
    } catch {
      showSaveStatus(summary);
    }
  }
  function wireEvents() {
    document.addEventListener("change", (event) => {
      const activity = activeActivity();
      if (!activity) return;
      if (event.target.name === "answer") {
        state.selected[activity.id] = event.target.value;
        saveProgress();
        renderActivity();
      }
      if (event.target.matches("[data-sort-item]")) {
        const itemId = event.target.getAttribute("data-sort-item");
        state.sortAnswers[activity.id] = state.sortAnswers[activity.id] || {};
        state.sortAnswers[activity.id][itemId] = event.target.value;
        saveProgress();
      }
    });
    document.addEventListener("input", (event) => {
      const activity = activeActivity();
      if (event.target.id === "studentName") {
        state.studentName = event.target.value.trim();
        saveProgress();
      } else if (activity && event.target.matches("[data-note]")) {
        state.notes[activity.id] = event.target.value;
        saveProgress();
      }
    });
    document.addEventListener("click", (event) => {
      const jump = event.target.closest("[data-jump]");
      if (jump) setHash(state.domain, state.level, jump.getAttribute("data-jump"));
      if (event.target.closest("[data-check]")) checkAnswer();
      if (event.target.closest("[data-speak]")) speakPrompt();
      if (event.target.closest("[data-prev]")) setHash(state.domain, state.level, state.activityIndex - 1);
      if (event.target.closest("[data-next]")) setHash(state.domain, state.level, state.activityIndex + 1);
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
      localStorage.removeItem(storageKey());
      loadProgress();
      renderAll();
      showSaveStatus("This practice path was reset.");
    });
    window.addEventListener("hashchange", initFromRoute);
    window.addEventListener("popstate", initFromRoute);
  }
  function renderAll() {
    renderHeader();
    renderDomains();
    renderLevels();
    renderChooseSubtitle();
    renderLinkBoard();
    renderProgress();
    renderLearnerTools();
    renderActivityList();
    renderActivity();
  }
  function initFromRoute() {
    routeToState();
    loadProgress();
    renderAll();
  }
  function init() {
    if (window.location.pathname.replace(/^\/access-practice-lab\/?/, "") === "" && !window.location.hash) setHash("Listening", "A", 0);
    routeToState();
    loadProgress();
    wireEvents();
    renderAll();
  }
  init();
})();
