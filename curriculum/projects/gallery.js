/* Projects gallery behaviour: search + filters kept in the URL, a native detail dialog, and a
   read-only "Continue" hint. The cards are real HTML before this runs (no script = all projects
   listed with their links); this only filters them. It never writes student data: every
   storage access is a read inside try/catch, so a blocked or corrupt store simply shows no
   Continue. Markup: tools/lib/projects-gallery.mjs. */
(() => {
  "use strict";
  const $ = (selector, root = document) => root.querySelector(selector);
  const grid = $("#pg-grid");
  const dataEl = $("#pg-data");
  if (!grid || !dataEl) return;

  const data = JSON.parse(dataEl.textContent);
  const byId = new Map(data.projects.map((p) => [p.id, p]));
  const cards = [...grid.querySelectorAll(".pg-card")];
  const controls = {
    q: $("#pg-search"),
    unit: $("#pg-unit"),
    topic: $("#pg-topic"),
    standard: $("#pg-standard"),
    type: $("#pg-type"),
  };
  const FILTERS = Object.keys(controls);
  const status = $("#pg-status");
  const empty = $("#pg-empty");
  const dialog = $("#pg-dialog");
  const total = cards.length;
  let lastOpener = null;
  let dialogFromHistory = false;

  /* ---------- filter state <-> URL ---------- */
  const optionValues = (select) => new Set([...select.options].map((o) => o.value));
  function readURL() {
    const params = new URLSearchParams(location.search);
    const state = { q: (params.get("q") || "").slice(0, 120), project: "" };
    for (const key of FILTERS.slice(1)) {
      const value = params.get(key) || "";
      state[key] = optionValues(controls[key]).has(value) ? value : "";
    }
    const project = params.get("project") || "";
    state.project = byId.has(project) ? project : "";
    return state;
  }
  function writeControls(state) {
    controls.q.value = state.q;
    for (const key of FILTERS.slice(1)) controls[key].value = state[key];
  }
  function stateFromControls() {
    const state = {
      q: controls.q.value.trim(),
      project: dialog.open ? dialog.dataset.id || "" : "",
    };
    for (const key of FILTERS.slice(1)) state[key] = controls[key].value;
    return state;
  }
  function toURL(state) {
    const params = new URLSearchParams();
    for (const key of [...FILTERS, "project"]) if (state[key]) params.set(key, state[key]);
    const query = params.toString();
    return location.pathname + (query ? `?${query}` : "");
  }

  /* ---------- filtering ---------- */
  function applyFilters() {
    const tokens = controls.q.value.toLowerCase().split(/\s+/).filter(Boolean);
    const { unit, topic, standard, type } = Object.fromEntries(
      FILTERS.slice(1).map((key) => [key, controls[key].value]),
    );
    let shown = 0;
    for (const card of cards) {
      const set = card.dataset;
      const match =
        (!unit || set.unit === unit) &&
        (!topic || set.topic === topic) &&
        (!type || set.type === type) &&
        (!standard || set.standards.split(" ").includes(standard)) &&
        tokens.every((token) => set.search.includes(token));
      card.hidden = !match;
      if (match) shown += 1;
    }
    status.textContent = `Showing ${shown} of ${total} projects`;
    empty.hidden = shown !== 0;
    return shown;
  }
  const reset = () => {
    writeControls({ q: "", unit: "", topic: "", standard: "", type: "" });
    applyFilters();
    history.pushState(null, "", toURL(stateFromControls()));
    controls.q.focus();
  };

  let typingTimer = 0;
  controls.q.addEventListener("input", () => {
    applyFilters();
    clearTimeout(typingTimer);
    typingTimer = setTimeout(() => history.replaceState(null, "", toURL(stateFromControls())), 250);
  });
  controls.q.addEventListener("keydown", (event) => {
    if (event.key === "Enter") event.preventDefault();
  });
  for (const key of FILTERS.slice(1))
    controls[key].addEventListener("change", () => {
      applyFilters();
      history.pushState(null, "", toURL(stateFromControls()));
    });
  $("#pg-form").addEventListener("submit", (event) => event.preventDefault());
  $("#pg-reset").addEventListener("click", reset);
  $("#pg-empty-reset").addEventListener("click", reset);

  /* ---------- detail dialog ---------- */
  const el = (tag, props = {}, ...kids) => {
    const node = document.createElement(tag);
    for (const [key, value] of Object.entries(props)) {
      if (key === "text") node.textContent = value;
      else if (key === "lang" || key === "href" || key === "class" || key === "role")
        node.setAttribute(key, value);
      else node[key] = value;
    }
    for (const kid of kids) if (kid) node.append(kid);
    return node;
  };
  const section = (title, ...kids) =>
    el("section", { class: "pg-d-sec" }, el("h3", { text: title }), ...kids);
  const list = (tag, items) => el(tag, {}, ...items.map((text) => el("li", { text })));
  const bilingual = (cell, tag = "span") => {
    const node = el(tag, { text: cell.en });
    if (cell.es) node.append(el("small", { lang: "es", text: cell.es }));
    return node;
  };

  function renderDialog(project, opener) {
    const inner = $("#pg-d-inner");
    const card = grid.querySelector(`.pg-card[data-id="${project.id}"]`);
    inner.style.setProperty("--pg-unit", card.style.getPropertyValue("--pg-unit"));
    inner.style.setProperty("--art-accent", "var(--pg-unit)");
    const art = card.querySelector(".pg-svg").cloneNode(true);
    for (const node of art.querySelectorAll("[id]")) node.id = `${node.id}-d`;
    art.setAttribute(
      "aria-labelledby",
      art.getAttribute("aria-labelledby").replace(/(\S+)/g, "$1-d"),
    );
    $("#pg-d-art").replaceChildren(art);
    $("#pg-d-meta").replaceChildren(
      ...[
        project.unitLabel,
        project.typeLabel,
        project.letter &&
          (project.letter.length === 1 ? `Version ${project.letter}` : project.letter),
      ]
        .filter(Boolean)
        .map((text) => el("span", { class: "pg-chip", text })),
    );
    $("#pg-d-title").textContent = project.title;

    const challenge = section(
      "The challenge",
      el("p", { text: project.role }),
      el("p", {}, el("strong", { text: project.question })),
      el("p", { text: "Pick one context:" }),
      list("ul", project.choices),
      el("p", {}, el("strong", { text: "Then a twist: " }), project.twist),
    );
    const evidence = section(
      "Math evidence you will show",
      list("ol", project.evidence),
      el("p", {
        text: `Studio also checks ${project.mathChecks} calculations from your design.`,
      }),
    );
    const make = section("What you will make", el("p", { text: project.product }));
    const rubric = section(
      "How it is assessed",
      el("p", { text: "Studio teacher mode scores four dimensions from 1 to 4:" }),
      el(
        "dl",
        { class: "pg-d-rubric" },
        ...data.rubric.map((row) =>
          el("div", {}, el("dt", { text: row.name }), el("dd", { text: row.levels })),
        ),
      ),
    );
    if (project.pageRubric) {
      const rows = el(
        "ul",
        { class: "pg-d-rows" },
        ...project.pageRubric.map((row) => {
          const [expert, proficient, developing] = row.levels;
          return el(
            "li",
            {},
            el("strong", {}, bilingual(row.skill)),
            el("small", { text: `4 Expert: ${expert.en}` }),
            el("small", { text: `3 Proficient: ${proficient.en}` }),
            el("small", { text: `2 Developing: ${developing.en}` }),
          );
        }),
      );
      rubric.append(
        el(
          "details",
          {},
          el("summary", { text: `Classic page rubric (${project.pageRubric.length} skills)` }),
          rows,
        ),
      );
    }
    const standards = section(
      "Standards and key words",
      el("p", { text: `Course standards: ${project.codes.join(" · ")}` }),
      el("p", {
        text: `National crosswalk: ${project.ccss.join(" · ")} · ${project.smp.join(" · ")}`,
      }),
      el(
        "ul",
        { class: "pg-d-key" },
        ...project.terms.map((term) =>
          el(
            "li",
            { class: "pg-chip" },
            `${term.en} · `,
            el("span", { lang: "es", text: term.es }),
          ),
        ),
      ),
    );
    $("#pg-d-body").replaceChildren(challenge, evidence, make, rubric, standards);

    const actions = $("#pg-d-actions");
    const link = (cls, href, text) => el("a", { class: `pg-btn ${cls}`, href, text });
    const next = [];
    const saved = savedFor(project);
    if (saved.studio) next.push(link("pg-continue", project.urls.studio, "Continue in Studio"));
    if (saved.legacy && project.urls.classic)
      next.push(link("pg-continue", project.urls.classic, "Continue classic page"));
    next.push(link("pg-primary", project.urls.studio, "Open in Studio"));
    if (project.urls.classic) next.push(link("", project.urls.classic, "Classic page"));
    const others = project.versions.filter((v) => v.id !== project.id);
    for (const v of others)
      next.push(
        link("", v.url, `${v.label.length === 1 ? `Version ${v.label}` : v.label}: ${v.title}`),
      );
    actions.replaceChildren(...next);
    dialog.dataset.id = project.id;
    lastOpener = opener || lastOpener;
  }

  function openProject(id, opener, push) {
    const project = byId.get(id);
    if (!project) return;
    renderDialog(project, opener);
    if (!dialog.open) dialog.showModal();
    dialog.scrollTop = 0;
    $("#pg-d-title").focus();
    if (push)
      history.pushState({ pgDialog: true }, "", toURL({ ...stateFromControls(), project: id }));
  }
  function closeDialog() {
    if (dialog.open) dialog.close();
  }
  dialog.addEventListener("close", () => {
    const opener = lastOpener;
    delete dialog.dataset.id;
    if (!dialogFromHistory) {
      if (history.state?.pgDialog) history.back();
      else history.replaceState(null, "", toURL(stateFromControls()));
    }
    dialogFromHistory = false;
    if (opener && document.contains(opener) && !opener.closest("[hidden]")) opener.focus();
    else controls.q.focus();
  });
  // Keep Tab inside the open dialog: wrap from the last control to the first and back.
  dialog.addEventListener("keydown", (event) => {
    if (event.key !== "Tab") return;
    const controls = [...dialog.querySelectorAll("a[href], button, summary")].filter(
      (node) => node.getClientRects().length > 0,
    );
    if (!controls.length) return;
    const first = controls[0];
    const last = controls[controls.length - 1];
    if (event.shiftKey && (document.activeElement === first || document.activeElement === $("#pg-d-title"))) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) closeDialog();
  });
  $("#pg-d-close").addEventListener("click", closeDialog);
  grid.addEventListener("click", (event) => {
    const button = event.target.closest(".pg-details");
    if (button) openProject(button.dataset.id, button, true);
  });

  window.addEventListener("popstate", () => {
    const state = readURL();
    writeControls(state);
    applyFilters();
    if (state.project) {
      dialogFromHistory = false;
      openProject(state.project, null, false);
    } else if (dialog.open) {
      dialogFromHistory = true;
      closeDialog();
    }
  });

  /* ---------- Continue: only what a saved record really shows ---------- */
  const STUDIO_PREFIX = "ewl-project-studio:v1:";
  const normalizePath = (path) => {
    const clean = String(path || "")
      .split(/[?#]/)[0]
      .replace(/index\.html?$/i, "");
    return clean.endsWith("/") ? clean : `${clean}/`;
  };
  const studioSaves = new Map();
  const classicSaves = new Map();
  function scanStorage() {
    studioSaves.clear();
    classicSaves.clear();
    let store;
    try {
      store = window.localStorage;
      void store.length;
    } catch {
      return;
    }
    const keys = [];
    try {
      for (let i = 0; i < store.length; i += 1) keys.push(store.key(i));
    } catch {
      return;
    }
    for (const key of keys) {
      try {
        if (key.startsWith(STUDIO_PREFIX)) {
          const id = key.slice(STUDIO_PREFIX.length);
          const saved = JSON.parse(store.getItem(key));
          if (!byId.has(id) || !saved || typeof saved !== "object" || saved.projectId !== id)
            continue;
          const touched =
            saved.stage > 0 ||
            saved.choice ||
            ["vision", "critique", "revision", "claim"].some((f) =>
              String(saved[f] || "").trim(),
            ) ||
            (saved.evidence || []).some((t) => String(t || "").trim()) ||
            Object.keys(saved.checked || {}).length ||
            saved.baseline;
          if (touched)
            studioSaves.set(id, { step: Number.isInteger(saved.stage) ? saved.stage + 1 : null });
        } else if (key.startsWith("nsr:rec:")) {
          const rec = JSON.parse(store.getItem(key));
          if (!rec || typeof rec.url !== "string") continue;
          const path = normalizePath(rec.url);
          const percent = Number(rec.progressPercent);
          const prior = classicSaves.get(path);
          if (!prior || (percent > 0 && !(prior.percent > percent)))
            classicSaves.set(path, { percent: percent > 0 ? Math.round(percent) : null });
        } else {
          const m = key.match(/^nt-project-(?:rubric|reflect|peer|level|workspace):(\/[^:]*)/);
          if (m && store.getItem(key)) {
            const path = normalizePath(m[1]);
            if (!classicSaves.has(path)) classicSaves.set(path, { percent: null });
          }
        }
      } catch {
        /* a corrupt or unreadable record shows nothing */
      }
    }
  }
  function savedFor(project) {
    const studio = studioSaves.get(project.id) || null;
    const legacy = project.urls.classic
      ? classicSaves.get(normalizePath(project.urls.launch)) || null
      : null;
    return { studio, legacy };
  }
  function markSaved() {
    scanStorage();
    const resumeLinks = [];
    for (const card of cards) {
      const project = byId.get(card.dataset.id);
      const { studio, legacy } = savedFor(project);
      const note = $(".pg-saved", card);
      const parts = [];
      if (studio) parts.push(studio.step ? `Studio: step ${studio.step} of 5` : "Studio: started");
      if (legacy)
        parts.push(
          legacy.percent
            ? `Classic page: about ${legacy.percent}% saved`
            : "Classic page: saved work found",
        );
      note.hidden = parts.length === 0;
      note.textContent = parts.length ? `Saved on this device. ${parts.join(" · ")}` : "";
      card.classList.toggle("has-saved", parts.length > 0);
      $('[data-role="continue-studio"]', card).hidden = !studio;
      const classic = $('[data-role="continue-classic"]', card);
      if (classic) classic.hidden = !legacy;
      if (parts.length) resumeLinks.push(project);
    }
    const resume = $("#pg-resume");
    resume.replaceChildren();
    resume.hidden = resumeLinks.length === 0;
    if (resumeLinks.length) {
      resume.append(
        `Saved work on this device: ${resumeLinks.length} project${resumeLinks.length === 1 ? "" : "s"}. `,
      );
      resumeLinks.slice(0, 3).forEach((project, i) => {
        if (i) resume.append(", ");
        const target = savedFor(project).studio ? project.urls.studio : project.urls.classic;
        resume.append(el("a", { href: target, text: project.title }));
      });
      if (resumeLinks.length > 3)
        resume.append(` and ${resumeLinks.length - 3} more (marked on their cards)`);
    }
  }

  /* ---------- start ---------- */
  $("#pg-tools").hidden = false;
  const initial = readURL();
  writeControls(initial);
  applyFilters();
  markSaved();
  window.addEventListener("pageshow", (event) => event.persisted && markSaved());
  if (initial.project) {
    openProject(initial.project, null, false);
    history.replaceState({ pgDialog: false }, "", toURL({ ...initial }));
  }
})();
