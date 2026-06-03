// Teacher Launch Mode
// Fetches /data/launch-manifest.json and lets a teacher pick a unit + lesson,
// then surfaces one-click links to every resource that exists for that lesson.
// Plain static JS — works on Cloudflare Pages with no server or build step.

(function () {
  "use strict";

  const MANIFEST_URL = "/data/launch-manifest.json";

  const els = {
    unitSelect: document.querySelector("[data-unit-select]"),
    lessonSelect: document.querySelector("[data-lesson-select]"),
    search: document.querySelector("[data-launch-search]"),
    unitChips: document.querySelector("[data-unit-chips]"),
    grid: document.querySelector("[data-lesson-grid]"),
    count: document.querySelector("[data-launch-count]"),
    error: document.querySelector("[data-launch-error]"),
    empty: document.querySelector("[data-launch-empty]"),
    detail: document.querySelector("[data-launch-detail]"),
  };

  // Resource button definitions, in display order.
  // openParts: extra hrefs opened together (Print Packet).
  const RESOURCE_DEFS = [
    {
      key: "student",
      icon: "🚀",
      label: "Open Student Activity",
      sub: "Project or launch the interactive lesson",
      primary: true,
    },
    {
      key: "notes",
      icon: "📋",
      label: "Teacher Notes",
      sub: "Guided notes with answers and moves",
    },
    {
      key: "notesPdf",
      icon: "📄",
      label: "Guided Notes (PDF)",
      sub: "Printable student notes packet",
    },
    {
      key: "notesDocx",
      icon: "📝",
      label: "Guided Notes (DOCX)",
      sub: "Editable Word version",
    },
    {
      key: "homework",
      icon: "🏠",
      label: "Homework",
      sub: "Take-home practice (DOCX)",
    },
    {
      key: "readiness",
      icon: "🧭",
      label: "Get Ready / Readiness",
      sub: "Pre-lesson skills check",
    },
    {
      key: "assessment",
      icon: "✅",
      label: "Assessment",
      sub: "Lesson check or quiz",
    },
  ];

  const state = {
    lessons: [],
    selectedUnit: "all",
    selectedId: null,
    query: "",
  };

  function escapeHtml(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function unitsFromLessons(lessons) {
    const set = new Set();
    lessons.forEach((l) => {
      if (l.unit != null) set.add(l.unit);
    });
    return [...set].sort((a, b) => a - b);
  }

  // Lessons matching the active unit filter + search query.
  function visibleLessons() {
    const q = state.query.trim().toLowerCase();
    return state.lessons.filter((l) => {
      if (
        state.selectedUnit !== "all" &&
        String(l.unit) !== String(state.selectedUnit)
      ) {
        return false;
      }
      if (!q) return true;
      const hay =
        `${l.id} ${l.title} ${l.standard} ${l.objective}`.toLowerCase();
      return hay.includes(q);
    });
  }

  function lessonLabel(l) {
    const flag = l.flagship ? " ★ Flagship" : "";
    return `${l.id} · ${l.title}${flag}`;
  }

  function populateUnitControls() {
    const units = unitsFromLessons(state.lessons);

    // Dropdown
    const opts = ['<option value="all">All units</option>'];
    units.forEach((u) => {
      opts.push(`<option value="${u}">Unit ${u}</option>`);
    });
    els.unitSelect.innerHTML = opts.join("");

    // Chips
    const chips = [
      `<button type="button" data-unit="all" aria-pressed="true">All units</button>`,
    ];
    units.forEach((u) => {
      chips.push(
        `<button type="button" data-unit="${u}" aria-pressed="false">Unit ${u}</button>`,
      );
    });
    els.unitChips.innerHTML = chips.join("");
  }

  function populateLessonSelect() {
    const list = visibleLessons();
    if (state.selectedUnit === "all" && !state.query) {
      els.lessonSelect.disabled = false;
      els.lessonSelect.innerHTML =
        '<option value="">All lessons (' +
        state.lessons.length +
        ")</option>" +
        list
          .map(
            (l) =>
              `<option value="${escapeHtml(l.id)}">${escapeHtml(lessonLabel(l))}</option>`,
          )
          .join("");
    } else if (list.length) {
      els.lessonSelect.disabled = false;
      els.lessonSelect.innerHTML =
        '<option value="">Pick a lesson…</option>' +
        list
          .map(
            (l) =>
              `<option value="${escapeHtml(l.id)}">${escapeHtml(lessonLabel(l))}</option>`,
          )
          .join("");
    } else {
      els.lessonSelect.disabled = true;
      els.lessonSelect.innerHTML =
        '<option value="">No matching lessons</option>';
    }
    if (state.selectedId) els.lessonSelect.value = state.selectedId;
  }

  function renderLessonGrid() {
    const list = visibleLessons();
    els.count.textContent = list.length
      ? `Showing ${list.length} lesson${list.length === 1 ? "" : "s"}.`
      : "No lessons match your filter or search.";

    els.grid.innerHTML = list
      .map((l) => {
        const pressed = l.id === state.selectedId ? "true" : "false";
        const flagBadge = l.flagship
          ? '<span class="lp-flagship">Flagship</span>'
          : "";
        const emoji = l.themeEmoji
          ? `<span class="lp-emoji" aria-hidden="true">${escapeHtml(l.themeEmoji)}</span>`
          : "";
        return (
          `<button type="button" class="lesson-pick" data-pick="${escapeHtml(l.id)}" aria-pressed="${pressed}">` +
          `<span class="lp-top"><span class="lp-id">${escapeHtml(l.id)}</span>${emoji}${flagBadge}</span>` +
          `<span class="lp-title">${escapeHtml(l.title)}</span>` +
          `<span class="lp-standard">${escapeHtml(l.standard || "—")}</span>` +
          `</button>`
        );
      })
      .join("");
  }

  function resourceButtonHtml(def, href) {
    return (
      `<a class="resource-btn${def.primary ? " rb-primary" : ""}" href="${escapeHtml(href)}" target="_blank" rel="noopener">` +
      `<span class="rb-icon" aria-hidden="true">${def.icon}</span>` +
      `<span class="rb-label">${def.label}</span>` +
      `<span class="rb-sub">${def.sub}</span>` +
      `</a>`
    );
  }

  function renderDetail() {
    const lesson = state.lessons.find((l) => l.id === state.selectedId);
    if (!lesson) {
      els.detail.hidden = true;
      els.empty.hidden = false;
      return;
    }
    els.empty.hidden = true;
    els.detail.hidden = false;

    const res = lesson.resources || {};
    const buttons = RESOURCE_DEFS.filter((def) => res[def.key]).map((def) =>
      resourceButtonHtml(def, res[def.key]),
    );

    // Print Packet: open PDF notes (and homework) for printing.
    const printTargets = [res.notesPdf, res.homework].filter(Boolean);
    let printBtn = "";
    if (printTargets.length) {
      printBtn =
        `<button type="button" class="resource-btn rb-print" data-print>` +
        `<span class="rb-icon" aria-hidden="true">🖨️</span>` +
        `<span class="rb-label">Print Packet</span>` +
        `<span class="rb-sub">Opens notes PDF${res.homework ? " + homework" : ""} in new tabs to print</span>` +
        `</button>`;
    }

    const emoji = lesson.themeEmoji
      ? `<span class="ld-emoji" aria-hidden="true">${escapeHtml(lesson.themeEmoji)}</span>`
      : "";
    const flagBadge = lesson.flagship
      ? '<span class="lp-flagship">Flagship</span>'
      : "";
    const langObjective = lesson.languageObjective
      ? `<p class="ld-objective ld-lang"><strong>Language:</strong> ${escapeHtml(lesson.languageObjective)}</p>`
      : "";
    const contentObjective = lesson.contentObjective
      ? `<p class="ld-objective"><strong>Objective:</strong> ${escapeHtml(lesson.contentObjective)}</p>`
      : "";

    const allButtons = buttons.concat(printBtn ? [printBtn] : []);

    els.detail.innerHTML =
      `<div class="launch-detail-head">` +
      `<p class="ld-eyebrow"><span class="lp-id">${escapeHtml(lesson.id)}</span>` +
      `<span class="badge core">${escapeHtml(lesson.standard || "—")}</span>${flagBadge}</p>` +
      `<h2>${emoji}${escapeHtml(lesson.title)}</h2>` +
      contentObjective +
      langObjective +
      `</div>` +
      `<div class="resource-grid">${allButtons.join("")}</div>`;

    // Wire the print button.
    const printEl = els.detail.querySelector("[data-print]");
    if (printEl) {
      printEl.addEventListener("click", function () {
        printTargets.forEach((url) => window.open(url, "_blank", "noopener"));
      });
    }

    // Bring the panel into view on small screens.
    if (window.matchMedia("(max-width: 720px)").matches) {
      els.detail.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  function selectLesson(id) {
    state.selectedId = id || null;
    els.lessonSelect.value = id || "";
    renderLessonGrid();
    renderDetail();
  }

  function setUnit(unit) {
    state.selectedUnit = unit;
    // Deselect a lesson that no longer matches the unit.
    if (state.selectedId) {
      const sel = state.lessons.find((l) => l.id === state.selectedId);
      if (sel && unit !== "all" && String(sel.unit) !== String(unit)) {
        state.selectedId = null;
      }
    }
    els.unitSelect.value = unit;
    els.unitChips.querySelectorAll("button").forEach((b) => {
      b.setAttribute(
        "aria-pressed",
        b.dataset.unit === String(unit) ? "true" : "false",
      );
    });
    populateLessonSelect();
    renderLessonGrid();
    renderDetail();
  }

  function wireEvents() {
    els.unitSelect.addEventListener("change", (e) => setUnit(e.target.value));

    els.unitChips.addEventListener("click", (e) => {
      const btn = e.target.closest("button[data-unit]");
      if (btn) setUnit(btn.dataset.unit);
    });

    els.lessonSelect.addEventListener("change", (e) =>
      selectLesson(e.target.value),
    );

    els.search.addEventListener("input", (e) => {
      state.query = e.target.value || "";
      populateLessonSelect();
      renderLessonGrid();
    });

    els.grid.addEventListener("click", (e) => {
      const btn = e.target.closest("button[data-pick]");
      if (btn) selectLesson(btn.dataset.pick);
    });
  }

  function showError() {
    if (els.error) els.error.hidden = false;
    if (els.empty) els.empty.hidden = true;
    if (els.count) els.count.textContent = "";
  }

  async function init() {
    if (!els.grid) return;
    try {
      const res = await fetch(MANIFEST_URL, { cache: "no-cache" });
      if (!res.ok) throw new Error("HTTP " + res.status);
      const data = await res.json();
      const lessons = Array.isArray(data) ? data : data.lessons;
      if (!Array.isArray(lessons) || !lessons.length)
        throw new Error("empty manifest");
      state.lessons = lessons;
    } catch (err) {
      console.error("Launch Mode: failed to load manifest", err);
      showError();
      return;
    }

    populateUnitControls();
    populateLessonSelect();
    renderLessonGrid();
    renderDetail();
    wireEvents();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
