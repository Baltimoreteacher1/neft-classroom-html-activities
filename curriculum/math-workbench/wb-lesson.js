/* Math Workbench — "Start from today's lesson" (opt-in).
 *
 * Nothing is ever placed on the board unless the student presses a button. Arriving
 * from a lesson (?lesson=3-1) only shows a one-line offer; the picker on the empty board
 * lets anyone choose a lesson. A chosen lesson offers its own problems (from the lesson
 * config) and the tools that match its standard, on a fresh page — existing work is
 * never touched (MWBPresets.apply adds a page when the current one has work). */
(function (root) {
  "use strict";
  const doc = root.document;
  if (!doc || root.MWBLesson) return;

  const LAST_KEY = "mw_lesson";
  const ID_RE = /^\d{1,2}-\d{1,2}$/;
  const $ = (selector, scope) => (scope || doc).querySelector(selector);

  function stash(key, value) {
    try {
      if (value === undefined) return root.localStorage.getItem(key);
      root.localStorage.setItem(key, value);
    } catch (_) {}
    return null;
  }

  function clean(text, max) {
    return String(text || "")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, max);
  }

  /* One lesson's offers: its word problem and practice problems (text only). */
  function problemsFrom(config) {
    const out = [];
    const word = config && config.revealWordProblem && config.revealWordProblem.text;
    if (word) out.push({ kind: "Word problem", text: clean(word, 700) });
    const practice = (config && config.practice) || {};
    for (const [label, list] of [
      ["Practice problem", practice.onLevel],
      ["Practice problem", practice.optional],
      ["Challenge problem", practice.extending],
    ]) {
      const item = Array.isArray(list) ? list.find((x) => x && x.stem) : null;
      if (item && !out.some((o) => o.text === clean(item.stem, 700))) {
        out.push({ kind: label, text: clean(item.stem, 700) });
      }
    }
    return out.slice(0, 3);
  }

  function presetKeyFor(standard) {
    const launcher = root.NTWorkbenchLauncher;
    return launcher && launcher.presetFor ? launcher.presetFor(standard) : "";
  }

  let manifestPromise = null;
  function loadLessons() {
    if (!manifestPromise) {
      manifestPromise = fetch("/data/curriculum-launch-manifest.json")
        .then((r) => (r.ok ? r.json() : null))
        .then((m) =>
          m && Array.isArray(m.lessons)
            ? m.lessons.map((l) => ({ id: l.id, unit: l.unit, title: l.title }))
            : [],
        )
        .catch(() => []);
    }
    return manifestPromise;
  }

  function loadConfig(id) {
    return fetch(`/lessons/${id}/config.json`)
      .then((r) => (r.ok ? r.json() : null))
      .catch(() => null);
  }

  /* ------------------------------------------------------------------ dialog */
  let dialog = null;
  function close() {
    if (!dialog) return;
    dialog.remove();
    dialog = null;
    doc.removeEventListener("keydown", onKey, true);
  }
  function onKey(event) {
    if (event.key === "Escape") close();
  }

  function el(tag, cls, text) {
    const node = doc.createElement(tag);
    if (cls) node.className = cls;
    if (text != null) node.textContent = text;
    return node;
  }

  async function open(preselect) {
    close();
    const bg = el("div", "wbx-gate-bg");
    const card = el("div", "wbx-gate wbx-lesson");
    card.setAttribute("role", "dialog");
    card.setAttribute("aria-modal", "true");
    card.setAttribute("aria-labelledby", "wbxLessonTitle");
    const title = el("h2", "", "Start from a lesson");
    title.id = "wbxLessonTitle";
    const label = el("label", "wbx-pop-label", "Lesson");
    label.htmlFor = "wbxLessonPick";
    const pick = el("select", "wbx-input");
    pick.id = "wbxLessonPick";
    pick.dataset.noI18n = "1"; // lesson titles are curriculum names, not interface text
    const offers = el("div", "wbx-offers");
    const note = el("p", "wbx-muted wbx-lesson-note", "Loading the lessons…");
    note.setAttribute("role", "status");
    const row = el("div", "wbx-gate-row");
    const add = el("button", "tbtn solid", "Add to my board");
    add.type = "button";
    add.disabled = true;
    const cancel = el("button", "tbtn", "Close");
    cancel.type = "button";
    cancel.addEventListener("click", close);
    row.append(add, cancel);
    card.append(
      title,
      el(
        "p",
        "wbx-muted",
        "Pick a lesson to get its problem and the tools that fit it. Nothing is added until you choose.",
      ),
      label,
      pick,
      offers,
      note,
      row,
    );
    bg.appendChild(card);
    bg.addEventListener("click", (event) => {
      if (event.target === bg) close();
    });
    doc.body.appendChild(bg);
    dialog = bg;
    doc.addEventListener("keydown", onKey, true);
    pick.focus();

    const lessons = await loadLessons();
    if (!dialog) return;
    if (!lessons.length) {
      note.textContent =
        "The lesson list is not available right now. You can still use the Guided Practice templates.";
      return;
    }
    const placeholder = el("option", "", "Choose a lesson…");
    placeholder.value = "";
    pick.appendChild(placeholder);
    let group = null;
    let unit = null;
    for (const lesson of lessons) {
      if (lesson.unit !== unit) {
        unit = lesson.unit;
        group = doc.createElement("optgroup");
        group.label = `Unit ${unit}`;
        pick.appendChild(group);
      }
      const option = el("option", "", `${lesson.id} · ${lesson.title}`);
      option.value = lesson.id;
      group.appendChild(option);
    }
    note.textContent = "";

    let chosen = null;
    const show = async () => {
      offers.textContent = "";
      add.disabled = true;
      chosen = null;
      const id = pick.value;
      if (!ID_RE.test(id)) return;
      note.textContent = "Loading the problems…";
      const config = await loadConfig(id);
      if (!dialog || pick.value !== id) return;
      if (!config) {
        note.textContent = "That lesson could not be loaded.";
        return;
      }
      note.textContent = "";
      stash(LAST_KEY, id);
      const key = presetKeyFor(config.standard);
      const preset =
        root.MWBPresets && key ? root.MWBPresets.resolve(root.MWBPresets.get(key)) : null;
      const problems = problemsFrom(config);
      const fieldset = el("fieldset", "wbx-fieldset");
      fieldset.appendChild(el("legend", "", "Choose a problem"));
      problems.forEach((problem, index) => {
        const lab = el("label", "wbx-offer");
        const input = doc.createElement("input");
        input.type = "radio";
        input.name = "wbxProblem";
        input.checked = index === 0;
        input.addEventListener("change", () => {
          chosen = problem;
        });
        const body = el("span", "");
        const wording = el("span", "", problem.text);
        wording.dataset.noI18n = "1"; // the lesson's own wording
        body.append(el("b", "", problem.kind), doc.createElement("br"), wording);
        lab.append(input, body);
        fieldset.appendChild(lab);
      });
      const blank = el("label", "wbx-offer");
      const blankInput = doc.createElement("input");
      blankInput.type = "radio";
      blankInput.name = "wbxProblem";
      blankInput.checked = !problems.length;
      blankInput.addEventListener("change", () => {
        chosen = { kind: "", text: "" };
      });
      blank.append(blankInput, el("span", "", "Just the tools — I will write my own problem"));
      fieldset.appendChild(blank);
      offers.appendChild(fieldset);
      if (preset) {
        offers.appendChild(
          el(
            "p",
            "wbx-muted",
            `Tools for this lesson: ${preset.tools.map((t) => t.type).join(", ") || "none"}`,
          ),
        );
      }
      chosen = problems[0] || { kind: "", text: "" };
      add.disabled = false;
      add.onclick = () => {
        close();
        if (root.MWBPresets) root.MWBPresets.apply(key, { problem: chosen ? chosen.text : "" });
      };
    };
    pick.addEventListener("change", show);
    const want = preselect || stash(LAST_KEY) || "";
    if (ID_RE.test(want) && lessons.some((l) => l.id === want)) {
      pick.value = want;
      show();
    }
  }

  /* ---------------------------------------------------- arriving from a lesson */
  function offerBanner(id) {
    if (!ID_RE.test(id)) return;
    const banner = el("div", "wbx-banner");
    banner.setAttribute("role", "region");
    banner.setAttribute("aria-label", "Start from your lesson");
    const text = el("span", "", `Start from lesson ${id}?`);
    const yes = el("button", "tbtn solid", "Yes, show me");
    yes.type = "button";
    const no = el("button", "tbtn", "No thanks");
    no.type = "button";
    yes.addEventListener("click", () => {
      banner.remove();
      open(id);
    });
    no.addEventListener("click", () => banner.remove());
    banner.append(text, yes, no);
    doc.body.appendChild(banner);
  }

  function boot() {
    doc.addEventListener("click", (event) => {
      if (event.target.closest("[data-wbx-lesson]")) open();
    });
    let id = "";
    try {
      id = new URLSearchParams(root.location.search).get("lesson") || "";
    } catch (_) {}
    if (id) offerBanner(id);
  }
  root.MWBLesson = Object.freeze({ open, problemsFrom });
  if (doc.readyState === "loading") doc.addEventListener("DOMContentLoaded", boot);
  else boot();
})(window);
