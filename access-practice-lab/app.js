(() => {
  const DATA = window.ACCESS_LAB_DATA;
  const $ = (id) => document.getElementById(id);
  const state = {
    mode: "hub",
    hubScope: "root",
    domain: null,
    level: null,
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
    if (!state.domain || !state.level) return;
    const saved = safeParse(localStorage.getItem(storageKey()) || "{}", {});
    state.studentName =
      localStorage.getItem(`${storagePrefix}:studentName`) || "";
    state.complete = new Set(
      Array.isArray(saved.complete) ? saved.complete : [],
    );
    state.selected = saved.selected || {};
    state.sortAnswers = saved.sortAnswers || {};
    state.attempts = saved.attempts || {};
    state.feedback = saved.feedback || {};
    state.notes = saved.notes || {};
  }

  function saveProgress() {
    if (!state.domain || !state.level) return;
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
      $("hubEyebrow").textContent = "Teacher dashboard";
      $("hubTitle").textContent = DATA.productTitle;
      $("hubLead").textContent =
        "Browse every ACCESS domain, pick a level, and share a clean practice link with students.";
      $("studentGoal").textContent =
        "Students open one activity at a time — directions, prompt, answer, reflection.";
      $("studentObjective").innerHTML =
        `<p class="muted">Use the dashboards below to assign practice. Share activity URLs directly in Google Classroom.</p>`;
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
    grid.innerHTML = Object.entries(DATA.domains)
      .map(([name, domain]) => {
        const stats = domainStats(name);
        const levels = Object.entries(domain.levels || {})
          .map(([levelKey, level]) => {
            const href = hubUrl(name, levelKey);
            return `<a class="level-chip" href="${href}">${escapeHtml(levelLabel(levelKey, level))}</a>`;
          })
          .join("");
        return `
        <article class="domain-overview-card" style="--domain-color:${domain.color}">
          <div class="domain-overview-head">
            <span class="domain-tab-icon">${escapeHtml(domain.icon)}</span>
            <h3>${escapeHtml(domainLabel(name))}</h3>
          </div>
          <p>${escapeHtml(domain.description)}</p>
          <p class="domain-overview-meta">${stats.levelCount} level${stats.levelCount === 1 ? "" : "s"} · ${stats.activityCount} activit${stats.activityCount === 1 ? "y" : "ies"}</p>
          <div class="level-chip-row">${levels}</div>
          <a class="primary-link" href="${hubUrl(name, null)}">Open ${escapeHtml(domainLabel(name))} dashboard</a>
        </article>
      `;
      })
      .join("");
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
      list
        .map((activity, index) => {
          const href = practiceUrl(state.domain, state.level, activity.id);
          const done = state.complete.has(activity.id);
          return `
        <article class="activity-card-hub ${done ? "is-done" : ""}">
          <div class="activity-card-head">
            <span class="activity-card-num">${done ? "✓" : `${itemLabel} ${index + 1}`}</span>
            <span class="activity-card-time">${escapeHtml(activity.time)}</span>
          </div>
          <h3>${escapeHtml(activity.title)}</h3>
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
    $("practiceLevelSwitch").innerHTML = Object.entries(domain.levels || {})
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
        <dl>${terms.map(([term, meaning]) => `<div><dt>${escapeHtml(term)}</dt><dd>${escapeHtml(meaning)}</dd></div>`).join("")}</dl>
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

  function constructedHTML(activity) {
    return `
      <label class="constructed-response">
        <span>${escapeHtml(activity.responseLabel || "Type your response")}</span>
        <textarea data-note rows="5" placeholder="${escapeHtml(activity.responsePlaceholder || "Use the frame and write your answer here.")}">${escapeHtml(state.notes[activity.id] || "")}</textarea>
      </label>
      <button class="primary-action" type="button" data-check>Save response</button>
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

  function answerHTML(activity) {
    if (activity.type === "sort") return sortHTML(activity);
    if (activity.type === "constructed") return constructedHTML(activity);
    return multipleChoiceHTML(activity);
  }

  function feedbackHTML(activity) {
    const feedback = state.feedback[activity.id];
    if (!feedback) return "";
    const heading = feedback.ok
      ? state.domain === "Model-Test"
        ? "Saved"
        : "Nice work"
      : "Try again";
    return `
      <section class="feedback-box ${feedback.ok ? "correct" : "hint"}" role="status" aria-live="polite">
        <h3>${heading}</h3>
        <p>${escapeHtml(feedback.message)}</p>
        ${feedback.support ? `<p class="model">${escapeHtml(feedback.support)}</p>` : ""}
      </section>
    `;
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
    const showReflection = activity.type !== "constructed";

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
    if (activity.type === "constructed") {
      ok = (state.notes[activity.id] || "").trim().length >= 12;
    } else if (activity.type === "sort") {
      const answers = state.sortAnswers[activity.id] || {};
      ok = activity.items.every((item) => answers[item.id] === item.answer);
    } else {
      ok = state.selected[activity.id] === activity.answer;
    }
    state.feedback[activity.id] = ok
      ? { ok: true, message: activity.correct || "Response saved." }
      : {
          ok: false,
          message: activity.hint,
          support: state.attempts[activity.id] >= 2 ? activity.support : "",
        };
    if (ok) state.complete.add(activity.id);
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
    window.speechSynthesis.speak(
      new SpeechSynthesisUtterance(
        `${activity.title}. ${activity.prompt || activity.directions}`,
      ),
    );
  }

  function showSaveStatus(message) {
    const el = $("saveStatus");
    if (el) el.textContent = message;
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
      showSaveStatus("Choose a domain and level first.");
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

  function renderAll() {
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
