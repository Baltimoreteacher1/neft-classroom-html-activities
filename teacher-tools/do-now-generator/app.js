(() => {
  "use strict";

  /* =========================================================================
   * Neft Teacher — Do Now / Warm-up Generator
   * Vanilla JS, no dependencies. Builds a question list two ways
   * (pick-a-lesson OR type-a-request), lets the teacher edit it, and emits
   * ready-to-paste Google Apps Script that creates a Google Form.
   * ========================================================================= */

  // OPTIONAL AI hook (DISABLED by default). If you point this at an https
  // endpoint that returns {questions:[...]} it will be used in Mode B; on any
  // failure the deterministic local generator runs instead. Left null = pure
  // local generation, no network calls.
  const AI_ENDPOINT = null; // e.g. "https://your-endpoint.example.com/donow"

  const STORAGE_KEY = "neft.doNow.v1";
  const THEME_KEY = "neft.doNow.theme";
  const MANIFEST_URL = "./lessons-manifest.json";

  /** @typedef {{type:string,prompt:string,choices?:string[],correctIndex?:number,answer?:string}} Question */

  const state = {
    /** @type {Question[]} */
    questions: [],
    formTitle: "Do Now",
    formDate: todayISO(),
    quizMode: false,
  };

  let manifest = { lessons: [] };

  /* ----------------------------- DOM helpers ----------------------------- */
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  function todayISO() {
    const d = new Date();
    const z = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())}`;
  }

  function prettyDate(iso) {
    if (!iso) return "";
    const [y, m, d] = iso.split("-").map((n) => parseInt(n, 10));
    if (!y || !m || !d) return iso;
    const dt = new Date(y, m - 1, d);
    return dt.toLocaleDateString(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }

  function toast(msg) {
    const el = $("#toast");
    if (!el) return;
    el.textContent = msg;
    el.classList.add("show");
    clearTimeout(toast._t);
    toast._t = setTimeout(() => el.classList.remove("show"), 1800);
  }

  /* ------------------------------ persistence ---------------------------- */
  function save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* storage optional */
    }
  }
  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const data = JSON.parse(raw);
      if (data && typeof data === "object") {
        state.questions = Array.isArray(data.questions) ? data.questions : [];
        state.formTitle = data.formTitle || "Do Now";
        state.formDate = data.formDate || todayISO();
        state.quizMode = Boolean(data.quizMode);
      }
    } catch {
      /* ignore */
    }
  }

  /* ------------------------------ navigation ----------------------------- */
  const TITLES = {
    start: ["Start Here", "Make today's Do Now in three steps."],
    build: ["1. Build Questions", "Pick a lesson or type what you want."],
    edit: ["2. Review & Edit", "Tune questions, types, and correct answers."],
    output: ["3. Get Form Code", "Copy the Apps Script and run it in Google."],
    about: [
      "How Outputs Work",
      "What each output is, and why no login is needed.",
    ],
  };

  function showTab(tab) {
    $$(".screen").forEach((s) => s.classList.toggle("active", s.id === tab));
    $$(".nav button").forEach((b) =>
      b.classList.toggle("active", b.dataset.tab === tab),
    );
    const [t, sub] = TITLES[tab] || ["", ""];
    $("#pageTitle").textContent = t;
    $("#pageSubtitle").textContent = sub;
    if (tab === "edit") renderQuestions();
    if (tab === "output") renderOutput();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  /* ------------------------------ manifest ------------------------------- */
  async function loadManifest() {
    const select = $("#lessonSelect");
    try {
      const res = await fetch(MANIFEST_URL, { cache: "no-cache" });
      if (!res.ok) throw new Error("HTTP " + res.status);
      manifest = await res.json();
    } catch (err) {
      select.innerHTML =
        '<option value="">Could not load lessons-manifest.json</option>';
      $("#lessonHint").textContent =
        "Run build-manifest.mjs to generate lessons-manifest.json, or use Type a request instead.";
      return;
    }
    const lessons = Array.isArray(manifest.lessons) ? manifest.lessons : [];
    select.innerHTML =
      '<option value="">Choose a lesson…</option>' +
      lessons
        .map((l) => {
          const std = l.standard ? ` — ${escapeAttr(l.standard)}` : "";
          return `<option value="${escapeAttr(l.id)}">${escapeHtml(
            l.id,
          )}: ${escapeHtml(l.title)}${std}</option>`;
        })
        .join("");
    $("#lessonHint").textContent =
      `${lessons.length} lessons loaded. Selecting one seeds 3-5 warm-up review questions you can then edit.`;
  }

  /* -------------------------- Mode A: pick lesson ------------------------ */
  function seedFromLesson() {
    const id = $("#lessonSelect").value;
    if (!id) {
      toast("Pick a lesson first.");
      return;
    }
    const lesson = (manifest.lessons || []).find((l) => l.id === id);
    if (!lesson) {
      toast("Lesson not found.");
      return;
    }
    const count = parseInt($("#lessonCount").value, 10) || 5;
    const seeded = (lesson.questions || [])
      .slice(0, count)
      .map((q) => normalizeQuestion(q));
    state.questions = seeded;
    state.formTitle = `Do Now — ${lesson.title}`;
    if (lesson.standard) state.formTitle += ` (${lesson.standard})`;
    save();
    toast(`Seeded ${seeded.length} questions from ${lesson.id}.`);
    showTab("edit");
  }

  /* -------------------------- Mode B: type request ----------------------- */
  async function generateFromText() {
    const text = $("#reqText").value.trim();
    const count = clamp(parseInt($("#reqCount").value, 10) || 4, 1, 20);
    const standard = $("#reqStandard").value.trim();
    const typePref = $("#reqTypes").value;

    let questions = null;
    if (AI_ENDPOINT && /^https:\/\//i.test(AI_ENDPOINT)) {
      questions = await tryAiEndpoint({ text, count, standard, typePref });
    }
    if (!questions) {
      questions = localGenerate({ text, count, standard, typePref });
    }
    state.questions = questions.map(normalizeQuestion);
    const topic = extractTopic(text) || standard || "Warm-up";
    state.formTitle = `Do Now — ${topic}`;
    save();
    toast(`Generated ${state.questions.length} questions.`);
    showTab("edit");
  }

  // Clearly-marked https-only stub; returns null on any problem so the local
  // fallback runs. No call happens unless AI_ENDPOINT is set above.
  async function tryAiEndpoint(payload) {
    try {
      const res = await fetch(AI_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) return null;
      const data = await res.json();
      return Array.isArray(data.questions) && data.questions.length
        ? data.questions
        : null;
    } catch {
      return null;
    }
  }

  // Deterministic local generator: produces MC + short-answer items from the
  // teacher's description. No randomness — same input → same output.
  function localGenerate({ text, count, standard, typePref }) {
    const topic = extractTopic(text) || standard || "today's topic";
    const out = [];
    for (let i = 0; i < count; i++) {
      const type = pickType(typePref, i);
      if (type === "multiple-choice") {
        out.push(mcTemplate(topic, standard, i));
      } else if (type === "paragraph") {
        out.push({
          type: "paragraph",
          prompt: `Explain your thinking about ${topic}. Use complete sentences and at least one example.`,
        });
      } else {
        out.push(shortTemplate(topic, standard, i));
      }
    }
    return out;
  }

  function pickType(pref, i) {
    if (pref === "multiple-choice") return "multiple-choice";
    if (pref === "short-answer") return "short-answer";
    if (pref === "paragraph") return "paragraph";
    // mixed: mostly MC, every 3rd a short answer
    return i % 3 === 2 ? "short-answer" : "multiple-choice";
  }

  function mcTemplate(topic, standard, i) {
    const stems = [
      `Which statement about ${topic} is correct?`,
      `A student is working with ${topic}. What should they do first?`,
      `Which example best shows ${topic}?`,
      `What is the key idea behind ${topic}?`,
      `Which one is true when working with ${topic}?`,
    ];
    const stem = stems[i % stems.length];
    return {
      type: "multiple-choice",
      prompt: standard ? `${stem} (${standard})` : stem,
      choices: [
        "Option A — edit this to the correct answer",
        "Option B — edit this distractor",
        "Option C — edit this distractor",
        "Option D — edit this distractor",
      ],
      correctIndex: 0,
    };
  }

  function shortTemplate(topic, standard, i) {
    const prompts = [
      `In one sentence, what does ${topic} mean?`,
      `Give one real-world example of ${topic}.`,
      `Solve a quick problem about ${topic} and show your answer.`,
      `What is one thing to remember about ${topic}?`,
    ];
    const p = prompts[i % prompts.length];
    return {
      type: "short-answer",
      prompt: standard ? `${p} (${standard})` : p,
      answer: "",
    };
  }

  function extractTopic(text) {
    if (!text) return "";
    // Strip leading "N questions on/about" and trailing standard mentions.
    let t = text
      .replace(/^\s*\d+\s+questions?\s+(on|about|for)\s+/i, "")
      .replace(/\b\d+\.[A-Za-z]{1,3}\.[A-Za-z0-9.]+\b/g, "")
      .replace(/\bstandard\b/gi, "")
      .replace(/[.;].*$/, "")
      .trim();
    if (t.length > 80) t = t.slice(0, 80).trim();
    return t;
  }

  function clamp(n, lo, hi) {
    return Math.max(lo, Math.min(hi, n));
  }

  function normalizeQuestion(q) {
    const type =
      q.type === "multiple-choice" ||
      q.type === "short-answer" ||
      q.type === "paragraph"
        ? q.type
        : "short-answer";
    const out = { type, prompt: String(q.prompt || "").trim() || "Question" };
    if (type === "multiple-choice") {
      out.choices =
        Array.isArray(q.choices) && q.choices.length
          ? q.choices.map((c) => String(c))
          : ["Option A", "Option B"];
      out.correctIndex =
        Number.isInteger(q.correctIndex) &&
        q.correctIndex >= 0 &&
        q.correctIndex < out.choices.length
          ? q.correctIndex
          : 0;
    } else if (type === "short-answer") {
      out.answer = String(q.answer || "");
    }
    return out;
  }

  /* ----------------------- editable question list UI -------------------- */
  function renderQuestions() {
    $("#formTitle").value = state.formTitle;
    $("#formDate").value = state.formDate;
    $("#quizMode").checked = state.quizMode;
    updateCount();

    const list = $("#qList");
    if (!state.questions.length) {
      list.innerHTML =
        '<p class="q-empty">No questions yet. Build some on step 1, or add them above.</p>';
      return;
    }
    list.innerHTML = state.questions
      .map((q, i) => questionCardHtml(q, i))
      .join("");
  }

  function questionCardHtml(q, i) {
    const typeOptions = ["multiple-choice", "short-answer", "paragraph"]
      .map(
        (t) =>
          `<option value="${t}"${q.type === t ? " selected" : ""}>${
            {
              "multiple-choice": "Multiple choice",
              "short-answer": "Short answer",
              paragraph: "Paragraph",
            }[t]
          }</option>`,
      )
      .join("");

    let body = "";
    if (q.type === "multiple-choice") {
      const choices = q.choices || [];
      body =
        `<div class="q-choices" data-choices="${i}">` +
        choices
          .map(
            (c, ci) => `
          <div class="q-choice">
            <span class="correct-wrap">
              <input type="radio" name="correct-${i}" data-correct="${i}" value="${ci}" ${
                ci === q.correctIndex ? "checked" : ""
              } aria-label="Mark choice ${ci + 1} correct" />
              correct
            </span>
            <input type="text" data-choice="${i}" data-ci="${ci}" value="${escapeAttr(
              c,
            )}" aria-label="Choice ${ci + 1} for question ${i + 1}" />
            <button class="btn small danger" type="button" data-delchoice="${i}" data-ci="${ci}" aria-label="Delete choice ${ci + 1}">✕</button>
          </div>`,
          )
          .join("") +
        `</div>
        <div class="button-row">
          <button class="btn small" type="button" data-addchoice="${i}">+ Add choice</button>
        </div>`;
    } else if (q.type === "short-answer") {
      body = `
        <label class="field" for="ans-${i}" style="margin-top:8px">
          Sample / correct answer (optional)
          <input id="ans-${i}" type="text" data-answer="${i}" value="${escapeAttr(
            q.answer || "",
          )}" />
        </label>`;
    } else {
      body = `<p class="muted" style="margin:8px 0 0">Paragraph (long answer) question — students type a written response.</p>`;
    }

    return `
    <div class="q-item" data-q="${i}">
      <div class="q-head">
        <span class="q-num">Q${i + 1}</span>
        <label class="inline">Type
          <select data-type="${i}">${typeOptions}</select>
        </label>
        <span class="spacer"></span>
        <button class="btn small" type="button" data-move="${i}" data-dir="-1" aria-label="Move question ${i + 1} up">↑</button>
        <button class="btn small" type="button" data-move="${i}" data-dir="1" aria-label="Move question ${i + 1} down">↓</button>
        <button class="btn small danger" type="button" data-del="${i}" aria-label="Delete question ${i + 1}">Delete</button>
      </div>
      <label class="sr-only" for="prompt-${i}">Question ${i + 1} text</label>
      <textarea id="prompt-${i}" class="q-prompt" data-prompt="${i}" rows="2">${escapeHtml(
        q.prompt,
      )}</textarea>
      ${body}
    </div>`;
  }

  // Event delegation for the question list.
  function bindListEvents() {
    const list = $("#qList");

    list.addEventListener("input", (e) => {
      const t = e.target;
      if (t.dataset.prompt != null) {
        state.questions[+t.dataset.prompt].prompt = t.value;
      } else if (t.dataset.choice != null) {
        state.questions[+t.dataset.choice].choices[+t.dataset.ci] = t.value;
      } else if (t.dataset.answer != null) {
        state.questions[+t.dataset.answer].answer = t.value;
      }
      save();
    });

    list.addEventListener("change", (e) => {
      const t = e.target;
      if (t.dataset.type != null) {
        changeType(+t.dataset.type, t.value);
      } else if (t.dataset.correct != null) {
        state.questions[+t.dataset.correct].correctIndex = +t.value;
        save();
      }
    });

    list.addEventListener("click", (e) => {
      const t = e.target.closest("button");
      if (!t) return;
      if (t.dataset.del != null) {
        state.questions.splice(+t.dataset.del, 1);
        save();
        renderQuestions();
      } else if (t.dataset.move != null) {
        moveQuestion(+t.dataset.move, +t.dataset.dir);
      } else if (t.dataset.addchoice != null) {
        const q = state.questions[+t.dataset.addchoice];
        q.choices.push(`Option ${q.choices.length + 1}`);
        save();
        renderQuestions();
      } else if (t.dataset.delchoice != null) {
        const q = state.questions[+t.dataset.delchoice];
        if (q.choices.length <= 2) {
          toast("Multiple choice needs at least 2 choices.");
          return;
        }
        const ci = +t.dataset.ci;
        q.choices.splice(ci, 1);
        if (q.correctIndex >= q.choices.length) q.correctIndex = 0;
        else if (q.correctIndex > ci) q.correctIndex -= 1;
        save();
        renderQuestions();
      }
    });
  }

  function changeType(i, type) {
    const q = state.questions[i];
    q.type = type;
    if (type === "multiple-choice") {
      if (!Array.isArray(q.choices) || !q.choices.length) {
        q.choices = ["Option A", "Option B", "Option C", "Option D"];
      }
      if (!Number.isInteger(q.correctIndex)) q.correctIndex = 0;
    } else if (type === "short-answer") {
      if (typeof q.answer !== "string") q.answer = "";
    }
    save();
    renderQuestions();
  }

  function moveQuestion(i, dir) {
    const j = i + dir;
    if (j < 0 || j >= state.questions.length) return;
    const tmp = state.questions[i];
    state.questions[i] = state.questions[j];
    state.questions[j] = tmp;
    save();
    renderQuestions();
  }

  function addQuestion(type) {
    if (type === "multiple-choice") {
      state.questions.push({
        type,
        prompt: "New multiple-choice question",
        choices: ["Option A", "Option B", "Option C", "Option D"],
        correctIndex: 0,
      });
    } else if (type === "paragraph") {
      state.questions.push({ type, prompt: "New paragraph question" });
    } else {
      state.questions.push({
        type: "short-answer",
        prompt: "New short-answer question",
        answer: "",
      });
    }
    save();
    renderQuestions();
  }

  function updateCount() {
    const n = state.questions.length;
    $("#countBadge").textContent = `${n} question${n === 1 ? "" : "s"}`;
  }

  /* ----------------------- Apps Script (.gs) builder -------------------- */

  // JS string -> Apps Script (JavaScript) single-quoted string literal.
  function gsStr(s) {
    return (
      "'" +
      String(s)
        .replace(/\\/g, "\\\\")
        .replace(/'/g, "\\'")
        .replace(/\r/g, "")
        .replace(/\n/g, "\\n") +
      "'"
    );
  }

  function buildAppsScript() {
    const title =
      (state.formTitle || "Do Now") +
      " — " +
      (prettyDate(state.formDate) || "");
    const quiz = state.quizMode;
    const lines = [];

    lines.push("/**");
    lines.push(" * Auto-generated by Neft Teacher Do Now / Warm-up Generator.");
    lines.push(
      " * Paste into script.google.com (New project), then Run buildDoNowForm.",
    );
    lines.push(
      " * Requires authorization the first time (Forms + Drive in your account).",
    );
    lines.push(" */");
    lines.push("function buildDoNowForm() {");
    lines.push("  var form = FormApp.create(" + gsStr(title.trim()) + ");");
    lines.push(
      "  form.setDescription(" + gsStr("Daily Do Now / warm-up.") + ");",
    );
    if (quiz) {
      lines.push("  form.setIsQuiz(true);");
    }
    lines.push("");

    state.questions.forEach((q, idx) => {
      lines.push("  // Question " + (idx + 1));
      if (q.type === "multiple-choice") {
        const choices = (q.choices || []).map((c) => gsStr(c));
        lines.push("  var item" + idx + " = form.addMultipleChoiceItem();");
        lines.push("  item" + idx + ".setTitle(" + gsStr(q.prompt) + ");");
        if (quiz) {
          // Build graded choices: only correctIndex is the correct answer.
          const ci = Number.isInteger(q.correctIndex) ? q.correctIndex : 0;
          const built = (q.choices || []).map(
            (c, i) =>
              "item" +
              idx +
              ".createChoice(" +
              gsStr(c) +
              ", " +
              (i === ci ? "true" : "false") +
              ")",
          );
          lines.push("  item" + idx + ".setChoices([");
          built.forEach((b, i) => {
            lines.push("    " + b + (i < built.length - 1 ? "," : ""));
          });
          lines.push("  ]);");
          lines.push("  item" + idx + ".setPoints(1);");
        } else {
          lines.push(
            "  item" + idx + ".setChoiceValues([" + choices.join(", ") + "]);",
          );
        }
        lines.push("  item" + idx + ".setRequired(false);");
      } else if (q.type === "paragraph") {
        lines.push("  var item" + idx + " = form.addParagraphTextItem();");
        lines.push("  item" + idx + ".setTitle(" + gsStr(q.prompt) + ");");
        lines.push("  item" + idx + ".setRequired(false);");
      } else {
        lines.push("  var item" + idx + " = form.addTextItem();");
        lines.push("  item" + idx + ".setTitle(" + gsStr(q.prompt) + ");");
        lines.push("  item" + idx + ".setRequired(false);");
      }
      lines.push("");
    });

    lines.push("  Logger.log('Edit your form here: ' + form.getEditUrl());");
    lines.push(
      "  Logger.log('Share with students: ' + form.getPublishedUrl());",
    );
    lines.push("  return form.getEditUrl();");
    lines.push("}");
    return lines.join("\n");
  }

  function renderOutput() {
    const out = $("#codeOut");
    if (!state.questions.length) {
      out.textContent = "Build some questions first (step 1).";
      return;
    }
    out.textContent = buildAppsScript();
  }

  async function copyCode() {
    const code = $("#codeOut").textContent;
    if (!code || !state.questions.length) {
      toast("Nothing to copy yet.");
      return;
    }
    try {
      await navigator.clipboard.writeText(code);
      toast("Code copied to clipboard.");
    } catch {
      // Fallback: select the pre so the teacher can copy manually.
      const range = document.createRange();
      range.selectNodeContents($("#codeOut"));
      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
      toast("Press Ctrl/Cmd+C to copy.");
    }
  }

  function downloadCode() {
    if (!state.questions.length) {
      toast("Nothing to download yet.");
      return;
    }
    const blob = new Blob([buildAppsScript()], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "do-now-form.gs";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  /* --------------------------------- escape ------------------------------ */
  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }
  function escapeAttr(s) {
    return escapeHtml(s).replace(/"/g, "&quot;");
  }

  /* --------------------------------- theme ------------------------------- */
  function initTheme() {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved === "dark") setTheme(true);
    else if (saved === "light") setTheme(false);
    else
      setTheme(
        window.matchMedia &&
          window.matchMedia("(prefers-color-scheme: dark)").matches,
      );
  }
  function setTheme(dark) {
    document.documentElement.setAttribute(
      "data-theme",
      dark ? "dark" : "light",
    );
    const btn = $("#themeBtn");
    if (btn) btn.setAttribute("aria-pressed", String(dark));
  }
  function toggleTheme() {
    const dark = document.documentElement.getAttribute("data-theme") !== "dark";
    setTheme(dark);
    try {
      localStorage.setItem(THEME_KEY, dark ? "dark" : "light");
    } catch {
      /* optional */
    }
  }

  /* -------------------------------- wiring ------------------------------- */
  function selectMode(mode) {
    const isLesson = mode === "lesson";
    $("#tabLesson").setAttribute("aria-selected", String(isLesson));
    $("#tabType").setAttribute("aria-selected", String(!isLesson));
    $("#modeLesson").hidden = !isLesson;
    $("#modeType").hidden = isLesson;
  }

  function init() {
    load();
    initTheme();
    loadManifest();

    // nav
    $$(".nav button").forEach((b) =>
      b.addEventListener("click", () => showTab(b.dataset.tab)),
    );
    $$("[data-go]").forEach((b) =>
      b.addEventListener("click", () => showTab(b.dataset.go)),
    );

    // mode tabs
    $("#tabLesson").addEventListener("click", () => selectMode("lesson"));
    $("#tabType").addEventListener("click", () => selectMode("type"));

    // build actions
    $("#seedFromLesson").addEventListener("click", seedFromLesson);
    $("#genFromText").addEventListener("click", generateFromText);

    // edit actions
    $("#addMc").addEventListener("click", () => addQuestion("multiple-choice"));
    $("#addShort").addEventListener("click", () => addQuestion("short-answer"));
    $("#addPara").addEventListener("click", () => addQuestion("paragraph"));
    $("#clearAll").addEventListener("click", () => {
      if (!state.questions.length) return;
      if (confirm("Remove all questions?")) {
        state.questions = [];
        save();
        renderQuestions();
      }
    });
    $("#formTitle").addEventListener("input", (e) => {
      state.formTitle = e.target.value;
      save();
    });
    $("#formDate").addEventListener("input", (e) => {
      state.formDate = e.target.value;
      save();
    });
    $("#quizMode").addEventListener("change", (e) => {
      state.quizMode = e.target.checked;
      save();
    });

    bindListEvents();

    // output actions
    $("#copyCode").addEventListener("click", copyCode);
    $("#downloadCode").addEventListener("click", downloadCode);

    // theme
    $("#themeBtn").addEventListener("click", toggleTheme);

    updateCount();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
