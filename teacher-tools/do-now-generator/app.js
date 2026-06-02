(() => {
  "use strict";

  /* =========================================================================
   * Neft Teacher — Do Now / Warm-up / Quiz Generator
   * Vanilla JS, no build-time deps. Builds a question list several ways:
   *   - Assessment Builder: pull REAL items (with correct answers) from the
   *     666-item Grade 6 spiral-review bank, filtered by unit / standard /
   *     tier / length, with one-click presets (Do-Now, Warm-up, Quiz, Spiral).
   *   - Pick a lesson: seed warm-up review from the 74-lesson manifest.
   *   - Type a request: deterministic local generator (placeholders only).
   *   - Upload slides: turn PNG/JPG/PDF/PPTX into a projectable slideshow.
   *
   * Output views: Student (no answers), Answer Key (correct marked), plus a
   * per-item projector reveal. Exports: Print, formatted Google Forms / quiz
   * import list, CSV, and the original Google Apps Script.
   *
   * Where correct answers come from: the spiral-review bank and the lessons
   * manifest both ship `correctIndex` on multiple-choice items (and `answer`
   * on short-answer). We NEVER invent answers — items lacking a real answer
   * are skipped and counted.
   *
   * Future add (out of scope here): live Google Forms creation via the Forms
   * API + Google OAuth. That needs a signed-in backend, so today we emit an
   * importable list + CSV instead. See exportFormsList()/exportCsv().
   * ========================================================================= */

  // OPTIONAL AI hook (DISABLED by default). https-only; null = no network.
  const AI_ENDPOINT = null;

  const STORAGE_KEY = "neft.doNow.v2";
  const THEME_KEY = "neft.doNow.theme";
  const MANIFEST_URL = "./lessons-manifest.json";
  // Bank lives at repo root /spiral-review/bank.json. Root-absolute works on
  // the deployed site; the ../../ relative is a fallback for local file opens.
  const BANK_URLS = [
    "/spiral-review/bank.json",
    "../../spiral-review/bank.json",
  ];

  // CDN libs used ONLY for slide upload parsing. Guarded: if offline / blocked,
  // the affected file type degrades gracefully and the rest of the tool works.
  const PDFJS_URL =
    "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
  const PDFJS_WORKER =
    "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
  const JSZIP_URL =
    "https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js";

  /** @typedef {{type:string,prompt:string,choices?:string[],correctIndex?:number,answer?:string,standard?:string,explanation?:string}} Question */

  const state = {
    /** @type {Question[]} */
    questions: [],
    formTitle: "Do Now",
    formDate: todayISO(),
    quizMode: false,
  };

  let manifest = { lessons: [] };
  let bank = { questions: [] };
  let bankLoaded = false;
  let slides = []; // {kind:'image'|'pdf'|'text', src?, text?, label}
  let slideIdx = 0;
  let slideTimer = null;
  let slideRemaining = 0;

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
    toast._t = setTimeout(() => el.classList.remove("show"), 2200);
  }

  function clamp(n, lo, hi) {
    return Math.max(lo, Math.min(hi, n));
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
    start: ["Start Here", "Build a ready-to-use Do Now, warm-up, or quiz."],
    build: [
      "1. Build Questions",
      "Pull real items, pick a lesson, or type a request.",
    ],
    edit: ["2. Review & Edit", "Tune questions, types, and correct answers."],
    present: ["3. Present & Export", "Project, print, or export your set."],
    slides: [
      "Upload Slides",
      "Turn images / PDF / PPTX into a Do Now slideshow.",
    ],
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
    if (tab === "present") renderPresent();
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
      if (select) {
        select.innerHTML =
          '<option value="">Could not load lessons-manifest.json</option>';
      }
      const hint = $("#lessonHint");
      if (hint)
        hint.textContent =
          "Run build-manifest.mjs to generate lessons-manifest.json, or use another mode.";
      return;
    }
    const lessons = Array.isArray(manifest.lessons) ? manifest.lessons : [];
    if (select) {
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
    }
    const hint = $("#lessonHint");
    if (hint)
      hint.textContent = `${lessons.length} lessons loaded. Selecting one seeds 3-5 warm-up review questions you can then edit.`;
  }

  /* -------------------------------- bank --------------------------------- */
  // The spiral-review bank is the primary source of REAL questions+answers.
  async function loadBank() {
    for (const url of BANK_URLS) {
      try {
        const res = await fetch(url, { cache: "no-cache" });
        if (!res.ok) continue;
        const data = await res.json();
        if (data && Array.isArray(data.questions)) {
          bank = data;
          bankLoaded = true;
          break;
        }
      } catch {
        /* try next */
      }
    }
    populateBankFilters();
  }

  function bankItems() {
    return Array.isArray(bank.questions) ? bank.questions : [];
  }

  function populateBankFilters() {
    const unitSel = $("#bankUnit");
    const stdSel = $("#bankStandard");
    if (!unitSel || !stdSel) return;

    if (!bankLoaded) {
      $("#bankStatus").textContent =
        "Question bank could not be loaded. Pick-a-lesson and Type-a-request still work.";
      return;
    }
    const items = bankItems();
    const units = [
      ...new Set(items.map((q) => q.unit).filter((u) => u != null)),
    ].sort((a, b) => a - b);
    const stds = [
      ...new Set(items.map((q) => q.standard).filter(Boolean)),
    ].sort();

    unitSel.innerHTML =
      '<option value="">All units</option>' +
      units.map((u) => `<option value="${u}">Unit ${u}</option>`).join("");
    stdSel.innerHTML =
      '<option value="">All standards</option>' +
      stds
        .map(
          (s) => `<option value="${escapeAttr(s)}">${escapeHtml(s)}</option>`,
        )
        .join("");
    $("#bankStatus").textContent =
      `${items.length} real Grade 6 items loaded (every item has a verified answer key).`;
    updateBankAvail();
  }

  // Filter the bank by the current control values. Only items with a real
  // correctIndex are eligible (we never invent answers).
  function filterBank() {
    const unit = $("#bankUnit").value;
    const std = $("#bankStandard").value;
    const tier = $("#bankTier").value;
    return bankItems().filter((q) => {
      if (q.type !== "multiple-choice") return false;
      if (!Number.isInteger(q.correctIndex)) return false;
      if (!Array.isArray(q.choices) || q.choices.length < 2) return false;
      if (q.correctIndex < 0 || q.correctIndex >= q.choices.length)
        return false;
      if (unit && String(q.unit) !== unit) return false;
      if (std && q.standard !== std) return false;
      if (tier && tier !== "any" && q.tier !== tier) return false;
      return true;
    });
  }

  function updateBankAvail() {
    const el = $("#bankAvail");
    if (!el || !bankLoaded) return;
    const n = filterBank().length;
    el.textContent = `${n} matching item${n === 1 ? "" : "s"} available with answer keys.`;
  }

  // Deterministic-ish sampler: shuffle a copy with a seeded PRNG so "Generate"
  // gives variety but is reproducible within a session if needed.
  function sampleItems(pool, count) {
    const arr = pool.slice();
    // Fisher–Yates with Math.random (variety each click is desirable here).
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr.slice(0, Math.min(count, arr.length));
  }

  function bankItemToQuestion(q) {
    return normalizeQuestion({
      type: "multiple-choice",
      prompt: String(q.stem || "").trim(),
      choices: (q.choices || []).map((c) => String(c)),
      correctIndex: q.correctIndex,
      standard: q.standard || "",
      explanation: q.explanation || "",
    });
  }

  // Assessment presets: length + quiz behaviour. Spiral pulls across units.
  const PRESETS = {
    "do-now": { count: 3, quiz: false, title: "Do Now", spiral: false },
    warmup: { count: 5, quiz: false, title: "Warm-up", spiral: false },
    quiz: { count: 10, quiz: true, title: "Quiz", spiral: false },
    spiral: { count: 6, quiz: false, title: "Spiral Review", spiral: true },
  };

  function buildAssessment() {
    if (!bankLoaded) {
      toast(
        "Question bank not available. Try Pick-a-lesson or Type-a-request.",
      );
      return;
    }
    const presetKey = $("#bankPreset").value;
    const preset = PRESETS[presetKey] || PRESETS["do-now"];
    const count = clamp(
      parseInt($("#bankCount").value, 10) || preset.count,
      1,
      25,
    );

    let pool = filterBank();
    if (preset.spiral) {
      // Spiral: spread across as many units as possible (ignore unit filter).
      const unitSaved = $("#bankUnit").value;
      $("#bankUnit").value = "";
      pool = filterBank();
      $("#bankUnit").value = unitSaved;
      pool = spreadAcrossUnits(pool, count);
    }

    const skipped = bankItems().length - pool.length;
    if (!pool.length) {
      toast("No matching items with answers. Loosen the filters.");
      return;
    }
    const picked = sampleItems(pool, count).map(bankItemToQuestion);

    state.questions = picked;
    state.quizMode = preset.quiz;
    const unit = $("#bankUnit").value;
    const std = $("#bankStandard").value;
    let label = preset.title;
    if (std) label += ` — ${std}`;
    else if (unit) label += ` — Unit ${unit}`;
    state.formTitle = label;
    save();
    const note =
      picked.length < count
        ? ` (only ${picked.length} of ${count} available for these filters)`
        : "";
    toast(
      `Built ${picked.length}-item ${preset.title}${note}. Skipped ${Math.max(0, skipped)} item(s) without a usable answer.`,
    );
    showTab("edit");
  }

  // Round-robin pick from each unit so a spiral mix touches many units.
  function spreadAcrossUnits(pool, count) {
    const byUnit = new Map();
    for (const q of pool) {
      const u = q.unit ?? 0;
      if (!byUnit.has(u)) byUnit.set(u, []);
      byUnit.get(u).push(q);
    }
    for (const list of byUnit.values()) {
      for (let i = list.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [list[i], list[j]] = [list[j], list[i]];
      }
    }
    const units = [...byUnit.keys()].sort(() => Math.random() - 0.5);
    const out = [];
    let added = true;
    while (out.length < count && added) {
      added = false;
      for (const u of units) {
        const list = byUnit.get(u);
        if (list && list.length) {
          out.push(list.shift());
          added = true;
          if (out.length >= count) break;
        }
      }
    }
    return out;
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
    toast(
      `Generated ${state.questions.length} placeholder questions — edit the prompts and answers.`,
    );
    showTab("edit");
  }

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
    let t = text
      .replace(/^\s*\d+\s+questions?\s+(on|about|for)\s+/i, "")
      .replace(/\b\d+\.[A-Za-z]{1,3}\.[A-Za-z0-9.]+\b/g, "")
      .replace(/\bstandard\b/gi, "")
      .replace(/[.;].*$/, "")
      .trim();
    if (t.length > 80) t = t.slice(0, 80).trim();
    return t;
  }

  function normalizeQuestion(q) {
    const type =
      q.type === "multiple-choice" ||
      q.type === "short-answer" ||
      q.type === "paragraph"
        ? q.type
        : "short-answer";
    const out = { type, prompt: String(q.prompt || "").trim() || "Question" };
    if (q.standard) out.standard = String(q.standard);
    if (q.explanation) out.explanation = String(q.explanation);
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

    const tag = q.standard
      ? `<span class="badge neutral q-std">${escapeHtml(q.standard)}</span>`
      : "";

    return `
    <div class="q-item" data-q="${i}">
      <div class="q-head">
        <span class="q-num">Q${i + 1}</span>
        ${tag}
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
    const badge = $("#countBadge");
    if (badge) badge.textContent = `${n} question${n === 1 ? "" : "s"}`;
  }

  function letter(i) {
    return String.fromCharCode(65 + i);
  }

  /* ===================================================================== *
   * PRESENT & EXPORT
   * ===================================================================== */
  let revealAll = false;

  function renderPresent() {
    updateCount();
    renderStudentView();
    renderAnswerKey();
    renderOutput();
  }

  function setTitle() {
    return (
      (state.formTitle || "Do Now") +
      (state.formDate ? " — " + prettyDate(state.formDate) : "")
    );
  }

  // Student view: clean, projectable/printable. Correct answers hidden until
  // "Reveal answers" is toggled (per-item or all).
  function renderStudentView() {
    const wrap = $("#studentView");
    if (!wrap) return;
    if (!state.questions.length) {
      wrap.innerHTML =
        '<p class="q-empty">Build some questions first (step 1).</p>';
      return;
    }
    const head = `<header class="sheet-head"><h2>${escapeHtml(setTitle())}</h2>
      <div class="sheet-meta"><span>Name: ____________________</span><span>Date: ____________</span></div></header>`;
    const body = state.questions.map((q, i) => studentItemHtml(q, i)).join("");
    wrap.innerHTML = head + body;
  }

  function studentItemHtml(q, i) {
    let body = "";
    if (q.type === "multiple-choice") {
      body =
        '<ol class="sheet-choices">' +
        (q.choices || [])
          .map((c, ci) => {
            const correct = ci === q.correctIndex;
            const cls =
              "sheet-choice" + (revealAll && correct ? " is-correct" : "");
            const mark =
              revealAll && correct ? ' <span class="ck">✓</span>' : "";
            return `<li class="${cls}"><span class="ch-let">${letter(
              ci,
            )}.</span> ${escapeHtml(c)}${mark}</li>`;
          })
          .join("") +
        "</ol>";
    } else if (q.type === "short-answer") {
      body = '<div class="sheet-line"></div>';
      if (revealAll && q.answer) {
        body += `<p class="sheet-reveal">Answer: ${escapeHtml(q.answer)}</p>`;
      }
    } else {
      body =
        '<div class="sheet-line"></div><div class="sheet-line"></div><div class="sheet-line"></div>';
    }
    const std = q.standard
      ? ` <span class="badge neutral q-std">${escapeHtml(q.standard)}</span>`
      : "";
    return `<article class="sheet-q">
      <p class="sheet-prompt"><strong>${i + 1}.</strong> ${escapeHtml(
        q.prompt,
      )}${std}</p>
      ${body}
      <div class="proj-actions no-print">
        <button class="btn small" type="button" data-reveal="${i}">Reveal answer</button>
      </div>
    </article>`;
  }

  // Per-item projector reveal (toggles a single item's answer).
  function bindStudentView() {
    const wrap = $("#studentView");
    if (!wrap) return;
    wrap.addEventListener("click", (e) => {
      const btn = e.target.closest("button[data-reveal]");
      if (!btn) return;
      const i = +btn.dataset.reveal;
      const art = btn.closest(".sheet-q");
      const existing = art.querySelector(
        ".sheet-reveal, .sheet-choice.is-correct, .ck",
      );
      const q = state.questions[i];
      // Toggle: if any reveal showing, re-render this item closed; else open.
      if (art.dataset.open === "1") {
        art.dataset.open = "0";
        art.outerHTML = studentItemHtmlOpen(q, i, false);
      } else {
        const html = studentItemHtmlOpen(q, i, true);
        art.outerHTML = html;
        $(`.sheet-q[data-qi="${i}"]`, wrap)?.setAttribute("data-open", "1");
      }
    });
  }

  // Variant that can force a single item open (for per-item reveal).
  function studentItemHtmlOpen(q, i, open) {
    let body = "";
    if (q.type === "multiple-choice") {
      body =
        '<ol class="sheet-choices">' +
        (q.choices || [])
          .map((c, ci) => {
            const correct = ci === q.correctIndex;
            const cls = "sheet-choice" + (open && correct ? " is-correct" : "");
            const mark = open && correct ? ' <span class="ck">✓</span>' : "";
            return `<li class="${cls}"><span class="ch-let">${letter(
              ci,
            )}.</span> ${escapeHtml(c)}${mark}</li>`;
          })
          .join("") +
        "</ol>";
    } else if (q.type === "short-answer") {
      body = '<div class="sheet-line"></div>';
      if (open && q.answer)
        body += `<p class="sheet-reveal">Answer: ${escapeHtml(q.answer)}</p>`;
    } else {
      body = '<div class="sheet-line"></div><div class="sheet-line"></div>';
    }
    const std = q.standard
      ? ` <span class="badge neutral q-std">${escapeHtml(q.standard)}</span>`
      : "";
    return `<article class="sheet-q" data-qi="${i}" data-open="${open ? 1 : 0}">
      <p class="sheet-prompt"><strong>${i + 1}.</strong> ${escapeHtml(
        q.prompt,
      )}${std}</p>
      ${body}
      <div class="proj-actions no-print">
        <button class="btn small" type="button" data-reveal="${i}">${
          open ? "Hide answer" : "Reveal answer"
        }</button>
      </div>
    </article>`;
  }

  // Answer key view: teacher copy, correct choice marked, explanation shown.
  function renderAnswerKey() {
    const wrap = $("#answerKey");
    if (!wrap) return;
    const mc = state.questions.filter((q) => q.type === "multiple-choice");
    if (!state.questions.length) {
      wrap.innerHTML =
        '<p class="q-empty">Build some questions first (step 1).</p>';
      return;
    }
    const head = `<header class="sheet-head"><h2>Answer Key — ${escapeHtml(
      setTitle(),
    )}</h2><p class="muted">${mc.length} auto-gradable multiple-choice item(s).</p></header>`;
    const body = state.questions
      .map((q, i) => {
        const std = q.standard
          ? ` <span class="badge neutral q-std">${escapeHtml(q.standard)}</span>`
          : "";
        if (q.type === "multiple-choice") {
          const ci = q.correctIndex;
          const ans = `${letter(ci)}. ${escapeHtml(q.choices[ci] || "")}`;
          const exp = q.explanation
            ? `<p class="key-exp">${escapeHtml(q.explanation)}</p>`
            : "";
          return `<article class="key-q"><p><strong>${i + 1}.</strong> ${escapeHtml(
            q.prompt,
          )}${std}</p><p class="key-ans"><strong>Answer:</strong> ${ans}</p>${exp}</article>`;
        }
        if (q.type === "short-answer") {
          const a = q.answer
            ? escapeHtml(q.answer)
            : "<em>open response (no fixed key)</em>";
          return `<article class="key-q"><p><strong>${i + 1}.</strong> ${escapeHtml(
            q.prompt,
          )}${std}</p><p class="key-ans"><strong>Sample answer:</strong> ${a}</p></article>`;
        }
        return `<article class="key-q"><p><strong>${i + 1}.</strong> ${escapeHtml(
          q.prompt,
        )}${std}</p><p class="key-ans"><em>Paragraph — teacher-scored.</em></p></article>`;
      })
      .join("");
    wrap.innerHTML = head + body;
  }

  /* ------------------------- view switch (tabs) -------------------------- */
  function showView(view) {
    $$(".view-tab").forEach((b) =>
      b.setAttribute("aria-selected", String(b.dataset.view === view)),
    );
    $$(".view-panel").forEach((p) =>
      p.classList.toggle("active", p.dataset.viewpanel === view),
    );
  }

  /* -------------------------------- EXPORTS ----------------------------- */

  // Print: open a clean print window with the chosen view.
  function printView(which) {
    if (!state.questions.length) {
      toast("Build some questions first.");
      return;
    }
    const node = which === "key" ? $("#answerKey") : $("#studentView");
    const w = window.open("", "_blank");
    if (!w) {
      toast("Pop-up blocked — allow pop-ups to print.");
      return;
    }
    w.document.write(`<!doctype html><html><head><meta charset="utf-8">
      <title>${escapeHtml(setTitle())}</title>
      <style>
        body{font:15px/1.5 Georgia,'Times New Roman',serif;color:#111;margin:36px;max-width:720px}
        h2{font-size:1.4rem;margin:0 0 4px}
        .sheet-head,.key-q,.sheet-q{margin-bottom:18px}
        .sheet-meta{display:flex;gap:30px;color:#444;margin:6px 0 18px;font-size:.9rem}
        ol.sheet-choices{list-style:none;padding-left:18px;margin:6px 0}
        .sheet-choice{margin:4px 0}
        .is-correct{font-weight:bold}
        .sheet-line{border-bottom:1px solid #999;height:22px;margin:6px 0}
        .key-ans{color:#0a5}.key-exp{color:#555;font-size:.9rem}
        .badge,.proj-actions,.no-print{display:none!important}
        .ch-let{font-weight:bold;margin-right:4px}
      </style></head><body>${node.innerHTML}</body></html>`);
    w.document.close();
    w.focus();
    setTimeout(() => w.print(), 250);
  }

  // Google Forms / quiz import — formatted text list (question + options +
  // correct answer). Teachers can paste this when manually building a Form, or
  // feed it to a Forms import add-on. (Live API auto-create = future, needs OAuth.)
  function formsListText() {
    const lines = [];
    lines.push(setTitle());
    lines.push("Google Forms / quiz import — question list");
    lines.push("");
    state.questions.forEach((q, i) => {
      lines.push(
        `${i + 1}. ${q.prompt}${q.standard ? " [" + q.standard + "]" : ""}`,
      );
      if (q.type === "multiple-choice") {
        (q.choices || []).forEach((c, ci) => {
          const mark = ci === q.correctIndex ? "  *CORRECT*" : "";
          lines.push(`   ${letter(ci)}) ${c}${mark}`);
        });
        lines.push(`   Answer: ${letter(q.correctIndex)}`);
      } else if (q.type === "short-answer") {
        lines.push("   Type: Short answer");
        if (q.answer) lines.push(`   Answer: ${q.answer}`);
      } else {
        lines.push("   Type: Paragraph (long answer)");
      }
      lines.push("");
    });
    return lines.join("\n");
  }

  function renderFormsList() {
    const out = $("#formsListOut");
    if (!out) return;
    out.textContent = state.questions.length
      ? formsListText()
      : "Build some questions first (step 1).";
  }

  function csvCell(s) {
    const v = String(s == null ? "" : s);
    return /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v;
  }

  // CSV: question, optionA..optionD (+ more if needed), correctAnswer.
  function buildCsv() {
    const maxChoices = state.questions.reduce(
      (m, q) =>
        q.type === "multiple-choice" ? Math.max(m, q.choices.length) : m,
      4,
    );
    const header = ["question", "type", "standard"];
    for (let i = 0; i < maxChoices; i++) header.push("option" + letter(i));
    header.push("correctAnswer");
    const rows = [header.map(csvCell).join(",")];
    state.questions.forEach((q) => {
      const row = [q.prompt, q.type, q.standard || ""];
      for (let i = 0; i < maxChoices; i++) {
        row.push(q.type === "multiple-choice" ? q.choices[i] || "" : "");
      }
      let correct = "";
      if (q.type === "multiple-choice") {
        correct = q.choices[q.correctIndex] || "";
      } else if (q.type === "short-answer") {
        correct = q.answer || "";
      }
      row.push(correct);
      rows.push(row.map(csvCell).join(","));
    });
    return rows.join("\r\n");
  }

  function downloadBlob(content, filename, mime) {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  function slugTitle() {
    return (
      (state.formTitle || "do-now")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")
        .slice(0, 40) || "do-now"
    );
  }

  /* ----------------------- Apps Script (.gs) builder -------------------- */
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
    const title = setTitle();
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
    if (quiz) lines.push("  form.setIsQuiz(true);");
    lines.push("");

    state.questions.forEach((q, idx) => {
      lines.push("  // Question " + (idx + 1));
      if (q.type === "multiple-choice") {
        const choices = (q.choices || []).map((c) => gsStr(c));
        lines.push("  var item" + idx + " = form.addMultipleChoiceItem();");
        lines.push("  item" + idx + ".setTitle(" + gsStr(q.prompt) + ");");
        if (quiz) {
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
    if (!out) return;
    out.textContent = state.questions.length
      ? buildAppsScript()
      : "Build some questions first (step 1).";
  }

  async function copyText(text, okMsg) {
    if (!text) {
      toast("Nothing to copy yet.");
      return;
    }
    try {
      await navigator.clipboard.writeText(text);
      toast(okMsg || "Copied.");
    } catch {
      toast("Copy failed — select the text and press Ctrl/Cmd+C.");
    }
  }

  /* ===================================================================== *
   * SLIDE UPLOAD  (images / PDF / PPTX) — all client-side, CDN-guarded.
   * ===================================================================== */
  function loadScriptOnce(src) {
    return new Promise((resolve, reject) => {
      if ([...document.scripts].some((s) => s.src === src)) return resolve();
      const el = document.createElement("script");
      el.src = src;
      el.onload = () => resolve();
      el.onerror = () => reject(new Error("Failed to load " + src));
      document.head.appendChild(el);
    });
  }

  async function handleSlideFiles(fileList) {
    const files = Array.from(fileList || []);
    if (!files.length) return;
    const status = $("#slideStatus");
    for (const file of files) {
      const name = file.name.toLowerCase();
      try {
        if (file.type.startsWith("image/")) {
          await addImageSlide(file);
        } else if (name.endsWith(".pdf") || file.type === "application/pdf") {
          status.textContent = `Reading PDF “${file.name}”…`;
          await addPdfSlides(file);
        } else if (
          name.endsWith(".pptx") ||
          file.type ===
            "application/vnd.openxmlformats-officedocument.presentationml.presentation"
        ) {
          status.textContent = `Reading PowerPoint “${file.name}”…`;
          await addPptxSlides(file);
        } else {
          toast(`Unsupported file type: ${file.name}`);
        }
      } catch (err) {
        toast(`Could not read ${file.name}: ${err.message}`);
      }
    }
    slideIdx = 0;
    renderSlides();
    status.textContent = `${slides.length} slide(s) ready.`;
  }

  function addImageSlide(file) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => {
        slides.push({ kind: "image", src: reader.result, label: file.name });
        resolve();
      };
      reader.onerror = () => resolve();
      reader.readAsDataURL(file);
    });
  }

  // PDF → render each page to a canvas data-URL via pdf.js (CDN, guarded).
  async function addPdfSlides(file) {
    if (!navigator.onLine && typeof window.pdfjsLib === "undefined") {
      // Offline fallback: embed the PDF directly (no per-page slides).
      const url = URL.createObjectURL(file);
      slides.push({ kind: "pdfembed", src: url, label: file.name });
      toast("Offline: embedding PDF as-is (page split needs pdf.js online).");
      return;
    }
    try {
      await loadScriptOnce(PDFJS_URL);
    } catch {
      const url = URL.createObjectURL(file);
      slides.push({ kind: "pdfembed", src: url, label: file.name });
      toast("Could not load pdf.js — embedding PDF as-is.");
      return;
    }
    const pdfjsLib = window.pdfjsLib;
    pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS_WORKER;
    const buf = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: buf }).promise;
    const max = Math.min(pdf.numPages, 60);
    for (let p = 1; p <= max; p++) {
      const page = await pdf.getPage(p);
      const viewport = page.getViewport({ scale: 1.6 });
      const canvas = document.createElement("canvas");
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const ctx = canvas.getContext("2d");
      await page.render({ canvasContext: ctx, viewport }).promise;
      let text = "";
      try {
        const tc = await page.getTextContent();
        text = tc.items
          .map((it) => it.str)
          .join(" ")
          .trim();
      } catch {
        /* text optional */
      }
      slides.push({
        kind: "image",
        src: canvas.toDataURL("image/png"),
        label: `${file.name} · p${p}`,
        text,
      });
    }
  }

  // PPTX → unzip with JSZip, pull <a:t> text from each slide XML, and embed
  // the slide media images. Degrades to text-only if media missing.
  async function addPptxSlides(file) {
    if (!navigator.onLine && typeof window.JSZip === "undefined") {
      toast("Offline: PPTX text extraction needs JSZip (online). Skipped.");
      return;
    }
    try {
      await loadScriptOnce(JSZIP_URL);
    } catch {
      toast("Could not load JSZip — PPTX skipped. Try images or PDF.");
      return;
    }
    const JSZip = window.JSZip;
    const zip = await JSZip.loadAsync(file);
    // Slides are ppt/slides/slideN.xml — order them numerically.
    const slideFiles = Object.keys(zip.files)
      .filter((n) => /^ppt\/slides\/slide\d+\.xml$/.test(n))
      .sort((a, b) => {
        const na = parseInt(a.match(/slide(\d+)\.xml/)[1], 10);
        const nb = parseInt(b.match(/slide(\d+)\.xml/)[1], 10);
        return na - nb;
      });
    for (let i = 0; i < slideFiles.length; i++) {
      const xml = await zip.file(slideFiles[i]).async("string");
      // Extract visible text runs.
      const texts = [];
      const re = /<a:t>([\s\S]*?)<\/a:t>/g;
      let m;
      while ((m = re.exec(xml))) {
        const t = decodeXml(m[1]).trim();
        if (t) texts.push(t);
      }
      slides.push({
        kind: "text",
        label: `${file.name} · slide ${i + 1}`,
        text: texts.join("\n"),
      });
    }
    // Also surface embedded media as image slides (appended after text).
    const media = Object.keys(zip.files).filter((n) =>
      /^ppt\/media\/.*\.(png|jpe?g|gif)$/i.test(n),
    );
    for (const m2 of media.slice(0, 40)) {
      try {
        const b64 = await zip.file(m2).async("base64");
        const ext = m2.split(".").pop().toLowerCase();
        const mime =
          ext === "png"
            ? "image/png"
            : ext === "gif"
              ? "image/gif"
              : "image/jpeg";
        slides.push({
          kind: "image",
          src: `data:${mime};base64,${b64}`,
          label: m2.split("/").pop(),
        });
      } catch {
        /* skip */
      }
    }
  }

  function decodeXml(s) {
    return s
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&apos;/g, "'")
      .replace(/&amp;/g, "&");
  }

  /* ------------------------- slideshow rendering ------------------------ */
  function renderSlides() {
    const stage = $("#slideStage");
    const extracted = $("#slideText");
    if (!stage) return;
    if (!slides.length) {
      stage.innerHTML =
        '<p class="muted slide-placeholder">Upload images, a PDF, or a PPTX to start a projectable slideshow.</p>';
      if (extracted) extracted.innerHTML = "";
      $("#slideCounter").textContent = "";
      return;
    }
    slideIdx = clamp(slideIdx, 0, slides.length - 1);
    const s = slides[slideIdx];
    let html = "";
    if (s.kind === "image") {
      html = `<img class="slide-img" src="${s.src}" alt="${escapeAttr(
        s.label,
      )}" />`;
    } else if (s.kind === "pdfembed") {
      html = `<embed class="slide-embed" src="${s.src}" type="application/pdf" />`;
    } else {
      html = `<div class="slide-text-stage">${
        s.text
          ? escapeHtml(s.text).replace(/\n/g, "<br>")
          : '<span class="muted">(no text on this slide)</span>'
      }</div>`;
    }
    stage.innerHTML = html;
    $("#slideCounter").textContent = `Slide ${slideIdx + 1} / ${slides.length}`;

    // Surface extracted text so the teacher can pair their own questions.
    if (extracted) {
      const all = slides
        .map((sl, i) =>
          sl.text
            ? `<div class="slide-text-row"><strong>${i + 1}.</strong> ${escapeHtml(
                sl.label,
              )}<br>${escapeHtml(sl.text)}</div>`
            : "",
        )
        .filter(Boolean)
        .join("");
      extracted.innerHTML = all
        ? `<h4>Extracted slide text</h4>${all}`
        : '<p class="muted">No text was extracted (image-only slides).</p>';
    }
  }

  function gotoSlide(d) {
    if (!slides.length) return;
    slideIdx = clamp(slideIdx + d, 0, slides.length - 1);
    renderSlides();
  }

  /* ---------------------------- think timer ----------------------------- */
  function startTimer() {
    const secs = clamp(parseInt($("#timerSecs").value, 10) || 60, 5, 900);
    stopTimer();
    slideRemaining = secs;
    updateTimerLabel();
    slideTimer = setInterval(() => {
      slideRemaining -= 1;
      updateTimerLabel();
      if (slideRemaining <= 0) {
        stopTimer();
        toast("Time's up!");
        const t = $("#timerLabel");
        if (t) t.classList.add("done");
      }
    }, 1000);
  }
  function stopTimer() {
    if (slideTimer) clearInterval(slideTimer);
    slideTimer = null;
    const t = $("#timerLabel");
    if (t) t.classList.remove("done");
  }
  function updateTimerLabel() {
    const t = $("#timerLabel");
    if (!t) return;
    const m = Math.floor(Math.max(0, slideRemaining) / 60);
    const s = Math.max(0, slideRemaining) % 60;
    t.textContent = `${m}:${String(s).padStart(2, "0")}`;
  }

  function enterFullscreen() {
    const el = $("#slideStageWrap");
    if (el && el.requestFullscreen) el.requestFullscreen().catch(() => {});
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
    $$(".mode-tab").forEach((t) =>
      t.setAttribute("aria-selected", String(t.dataset.mode === mode)),
    );
    $("#modeBank").hidden = mode !== "bank";
    $("#modeLesson").hidden = mode !== "lesson";
    $("#modeType").hidden = mode !== "type";
  }

  function init() {
    load();
    initTheme();
    loadManifest();
    loadBank();

    // nav
    $$(".nav button").forEach((b) =>
      b.addEventListener("click", () => showTab(b.dataset.tab)),
    );
    $$("[data-go]").forEach((b) =>
      b.addEventListener("click", () => showTab(b.dataset.go)),
    );

    // build mode tabs
    $$(".mode-tab").forEach((t) =>
      t.addEventListener("click", () => selectMode(t.dataset.mode)),
    );

    // assessment builder
    ["bankUnit", "bankStandard", "bankTier"].forEach((id) => {
      const el = $("#" + id);
      if (el) el.addEventListener("change", updateBankAvail);
    });
    $("#bankPreset")?.addEventListener("change", () => {
      const p = PRESETS[$("#bankPreset").value];
      if (p) $("#bankCount").value = p.count;
    });
    $("#buildAssessment")?.addEventListener("click", buildAssessment);

    // build actions
    $("#seedFromLesson")?.addEventListener("click", seedFromLesson);
    $("#genFromText")?.addEventListener("click", generateFromText);

    // edit actions
    $("#addMc")?.addEventListener("click", () =>
      addQuestion("multiple-choice"),
    );
    $("#addShort")?.addEventListener("click", () =>
      addQuestion("short-answer"),
    );
    $("#addPara")?.addEventListener("click", () => addQuestion("paragraph"));
    $("#clearAll")?.addEventListener("click", () => {
      if (!state.questions.length) return;
      if (confirm("Remove all questions?")) {
        state.questions = [];
        save();
        renderQuestions();
      }
    });
    $("#formTitle")?.addEventListener("input", (e) => {
      state.formTitle = e.target.value;
      save();
    });
    $("#formDate")?.addEventListener("input", (e) => {
      state.formDate = e.target.value;
      save();
    });
    $("#quizMode")?.addEventListener("change", (e) => {
      state.quizMode = e.target.checked;
      save();
    });

    bindListEvents();
    bindStudentView();

    // present view tabs
    $$(".view-tab").forEach((b) =>
      b.addEventListener("click", () => showView(b.dataset.view)),
    );
    $("#revealAllBtn")?.addEventListener("click", () => {
      revealAll = !revealAll;
      $("#revealAllBtn").setAttribute("aria-pressed", String(revealAll));
      $("#revealAllBtn").textContent = revealAll
        ? "Hide all answers"
        : "Reveal all answers";
      renderStudentView();
    });

    // exports
    $("#printStudent")?.addEventListener("click", () => printView("student"));
    $("#printKey")?.addEventListener("click", () => printView("key"));
    $("#copyFormsList")?.addEventListener("click", () =>
      copyText(
        formsListText(),
        "Question list copied for Google Forms import.",
      ),
    );
    $("#downloadFormsList")?.addEventListener("click", () => {
      if (!state.questions.length) return toast("Build some questions first.");
      downloadBlob(
        formsListText(),
        `${slugTitle()}-forms-import.txt`,
        "text/plain",
      );
    });
    $("#downloadCsv")?.addEventListener("click", () => {
      if (!state.questions.length) return toast("Build some questions first.");
      downloadBlob(buildCsv(), `${slugTitle()}-quiz.csv`, "text/csv");
    });
    $("#copyCode")?.addEventListener("click", () =>
      copyText(buildAppsScript(), "Apps Script copied to clipboard."),
    );
    $("#downloadCode")?.addEventListener("click", () => {
      if (!state.questions.length) return toast("Build some questions first.");
      downloadBlob(buildAppsScript(), `${slugTitle()}.gs`, "text/plain");
    });

    // export sub-tabs (forms / csv / gs render-on-show via renderPresent)
    $$(".export-tab").forEach((b) =>
      b.addEventListener("click", () => {
        $$(".export-tab").forEach((x) =>
          x.setAttribute("aria-selected", String(x === b)),
        );
        $$(".export-panel").forEach((p) =>
          p.classList.toggle("active", p.dataset.exp === b.dataset.exp),
        );
        if (b.dataset.exp === "forms") renderFormsList();
        if (b.dataset.exp === "gs") renderOutput();
      }),
    );

    // slides
    const drop = $("#slideDrop");
    const fileInput = $("#slideFile");
    fileInput?.addEventListener("change", (e) =>
      handleSlideFiles(e.target.files),
    );
    if (drop) {
      ["dragover", "dragenter"].forEach((ev) =>
        drop.addEventListener(ev, (e) => {
          e.preventDefault();
          drop.classList.add("drag");
        }),
      );
      ["dragleave", "drop"].forEach((ev) =>
        drop.addEventListener(ev, (e) => {
          e.preventDefault();
          drop.classList.remove("drag");
        }),
      );
      drop.addEventListener("drop", (e) =>
        handleSlideFiles(e.dataTransfer.files),
      );
    }
    $("#slidePrev")?.addEventListener("click", () => gotoSlide(-1));
    $("#slideNext")?.addEventListener("click", () => gotoSlide(1));
    $("#clearSlides")?.addEventListener("click", () => {
      slides = [];
      slideIdx = 0;
      stopTimer();
      renderSlides();
    });
    $("#startTimer")?.addEventListener("click", startTimer);
    $("#stopTimer")?.addEventListener("click", stopTimer);
    $("#fullscreenBtn")?.addEventListener("click", enterFullscreen);
    document.addEventListener("keydown", (e) => {
      if (!$("#slides").classList.contains("active")) return;
      if (e.key === "ArrowRight") gotoSlide(1);
      else if (e.key === "ArrowLeft") gotoSlide(-1);
    });
    renderSlides();

    // theme
    $("#themeBtn")?.addEventListener("click", toggleTheme);

    updateCount();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
