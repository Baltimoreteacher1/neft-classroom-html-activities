/* Curriculum matrix: dense unit x lesson grid, an Inspector drawer that never navigates, and a Cmd/Ctrl+K omnibar.
 * Data: /data/curriculum/matrix.json (generated). Search: curriculum-matrix-search.js. */
(() => {
  const root = document.getElementById("matrix-root");
  if (!root) return;
  const Search = window.CurriculumMatrixSearch;
  const el = (tag, attrs, ...kids) => {
    const n = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs || {})) {
      if (v === false || v == null) continue;
      if (k === "text") n.textContent = v;
      else n.setAttribute(k, v === true ? "" : v);
    }
    for (const k of kids.flat()) if (k) n.append(k);
    return n;
  };
  const byId = new Map();
  let matrix;
  let inspector;
  let lastTrigger;

  const lessonLinks = (l) =>
    [
      ["Lesson path", `/math/lesson-path/${l.id}/`],
      ["Open lesson", l.paths.lesson],
      l.tracks.scaffold && ["Group 1 (scaffold)", l.paths.group1],
      l.paths.group2 && ["Group 2 (enrichment)", l.paths.group2],
      l.paths.learningLab && ["Learning lab", l.paths.learningLab],
    ].filter(Boolean);

  function openInspector(l, trigger) {
    lastTrigger = trigger || document.activeElement;
    inspector.replaceChildren(
      el("button", {
        class: "mx-close",
        type: "button",
        "aria-label": "Close inspector",
        text: "×",
      }),
      el("p", { class: "mx-kicker", text: `Lesson ${l.id}` }),
      el("h2", { id: "mx-insp-title", text: l.title }),
      el("p", { class: "mx-obj", text: l.objective }),
      el(
        "dl",
        {},
        el("dt", { text: "Standards" }),
        el("dd", { text: l.standards.join(", ") || "—" }),
        el("dt", { text: "Pacing" }),
        el("dd", { text: `${l.minutes} minutes` }),
        el("dt", { text: "Vocabulary" }),
        el("dd", { text: l.topics.join(", ") || "—" }),
      ),
      el(
        "ul",
        { class: "mx-links" },
        lessonLinks(l).map(([label, href]) => el("li", {}, el("a", { href, text: label }))),
      ),
    );
    inspector.querySelector(".mx-close").addEventListener("click", closeInspector);
    inspector.hidden = false;
    document.body.classList.add("mx-insp-open");
    for (const t of root.querySelectorAll(".mx-cell[aria-pressed]"))
      t.setAttribute("aria-pressed", String(t.dataset.id === l.id));
    inspector.querySelector(".mx-close").focus();
  }
  function closeInspector() {
    inspector.hidden = true;
    document.body.classList.remove("mx-insp-open");
    for (const t of root.querySelectorAll(".mx-cell[aria-pressed]"))
      t.setAttribute("aria-pressed", "false");
    if (lastTrigger?.focus) lastTrigger.focus();
  }

  function cell(l) {
    const b = el("button", {
      class: "mx-cell",
      type: "button",
      "data-id": l.id,
      "aria-pressed": "false",
      "aria-label": `Lesson ${l.id}: ${l.title}`,
      title: l.title,
    });
    b.append(el("span", { class: "mx-id", text: l.id }));
    const marks = el("span", { class: "mx-marks", "aria-hidden": "true" });
    if (l.tracks.scaffold) marks.append(el("i", { class: "mx-m-s", title: "Scaffold" }));
    if (l.tracks.enrichment) marks.append(el("i", { class: "mx-m-e", title: "Enrichment" }));
    if (l.hasInteractive) marks.append(el("i", { class: "mx-m-i", title: "Interactive" }));
    b.append(marks);
    b.addEventListener("click", () => openInspector(l, b));
    return b;
  }

  function render() {
    const grid = el("div", { class: "mx-grid", role: "group", "aria-label": "Lessons by unit" });
    for (const u of matrix.units) {
      grid.append(
        el(
          "section",
          { class: "mx-unit", "data-domain": u.domain, "aria-labelledby": `mx-u${u.unitNumber}` },
          el(
            "h2",
            { id: `mx-u${u.unitNumber}` },
            el("span", { class: "mx-un", text: `Unit ${u.unitNumber}` }),
            el("span", { class: "mx-ut", text: u.title }),
            el("span", { class: "mx-dom", text: u.domain }),
          ),
          el("div", { class: "mx-cells" }, u.lessons.map(cell)),
        ),
      );
    }
    root.replaceChildren(
      el(
        "div",
        { class: "mx-bar" },
        el("button", {
          class: "mx-omni-btn",
          type: "button",
          text: "Search lessons, topics, standards  ⌘K",
        }),
        el(
          "p",
          { class: "mx-legend" },
          el("span", {}, el("i", { class: "mx-m-s" }), " Scaffold"),
          el("span", {}, el("i", { class: "mx-m-e" }), " Enrichment"),
          el("span", {}, el("i", { class: "mx-m-i" }), " Interactive"),
        ),
      ),
      grid,
    );
    root.querySelector(".mx-omni-btn").addEventListener("click", openOmni);
  }

  /* ---- omnibar ---- */
  let omni;
  let results = [];
  let active = 0;
  function paint() {
    const list = omni.querySelector(".mx-results");
    list.replaceChildren(
      ...results.map((l, i) => {
        const li = el("li", {
          role: "option",
          id: `mx-opt-${i}`,
          "aria-selected": String(i === active),
          "data-id": l.id,
        });
        li.append(
          el("strong", { text: l.id }),
          ` ${l.title}`,
          el("small", { text: l.standards.join(" · ") }),
        );
        li.addEventListener("click", () => pick(l));
        return li;
      }),
    );
    const input = omni.querySelector("input");
    input.setAttribute("aria-activedescendant", results.length ? `mx-opt-${active}` : "");
    omni.querySelector(".mx-status").textContent = input.value
      ? `${results.length} result${results.length === 1 ? "" : "s"}`
      : "";
  }
  function pick(l) {
    closeOmni(false);
    const b = root.querySelector(`.mx-cell[data-id="${l.id}"]`);
    openInspector(l, b);
    b?.scrollIntoView?.({ block: "nearest" });
  }
  function openOmni() {
    lastTrigger = document.activeElement;
    omni.hidden = false;
    const input = omni.querySelector("input");
    input.value = "";
    results = [];
    paint();
    input.focus();
  }
  function closeOmni(restore = true) {
    omni.hidden = true;
    if (restore && lastTrigger?.focus) lastTrigger.focus();
  }
  function buildOmni() {
    omni = el(
      "div",
      {
        class: "mx-omni",
        role: "dialog",
        "aria-modal": "true",
        "aria-label": "Search the curriculum",
        hidden: true,
      },
      el(
        "div",
        { class: "mx-omni-box" },
        el("input", {
          type: "search",
          role: "combobox",
          "aria-expanded": "true",
          "aria-controls": "mx-results",
          "aria-autocomplete": "list",
          placeholder: "Try 6-3, unit rate, or 6.RP.A.1",
          autocomplete: "off",
        }),
        el("ul", { class: "mx-results", id: "mx-results", role: "listbox" }),
        el("p", { class: "mx-status", role: "status", "aria-live": "polite" }),
      ),
    );
    const input = omni.querySelector("input");
    input.addEventListener("input", () => {
      results = Search.search(matrix, input.value);
      active = 0;
      paint();
    });
    input.addEventListener("keydown", (e) => {
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        if (results.length)
          active = (active + (e.key === "ArrowDown" ? 1 : -1) + results.length) % results.length;
        paint();
      } else if (e.key === "Enter" && results[active]) {
        e.preventDefault();
        pick(results[active]);
      }
    });
    omni.addEventListener("mousedown", (e) => {
      if (e.target === omni) closeOmni();
    });
    document.body.append(omni);
  }

  document.addEventListener("keydown", (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
      e.preventDefault();
      if (omni) omni.hidden ? openOmni() : closeOmni();
    } else if (e.key === "Escape") {
      if (omni && !omni.hidden) closeOmni();
      else if (inspector && !inspector.hidden) closeInspector();
    }
  });

  fetch("/data/curriculum/matrix.json")
    .then((r) => {
      if (!r.ok) throw new Error(String(r.status));
      return r.json();
    })
    .then((m) => {
      matrix = m;
      for (const u of m.units) for (const l of u.lessons) byId.set(l.id, l);
      inspector = el("aside", {
        class: "mx-inspector",
        "aria-labelledby": "mx-insp-title",
        hidden: true,
      });
      document.body.append(inspector);
      render();
      buildOmni();
      const want = new URLSearchParams(location.search).get("lesson");
      if (want && byId.has(want)) openInspector(byId.get(want));
    })
    .catch(() => {
      root.replaceChildren(
        el("p", {
          class: "mx-error",
          role: "alert",
          text: "The curriculum matrix could not load. Reload the page, or use the Units page.",
        }),
      );
    });
})();
