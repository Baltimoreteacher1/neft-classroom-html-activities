/* ── Neft Teacher — Spiral Review / MCAP Prep ──────────────────────────
   Self-contained vanilla JS. Loads bank.json (built by build-bank.mjs),
   assembles a MIXED, SPIRAL-weighted set on demand, serves questions one at
   a time with encouraging feedback + explanation, tracks score, and shows an
   end-of-set summary by standard. Optionally records the result to the
   shared localStorage `rma_gradebook` so the Class Dashboard / Forecast
   Engine can pick it up. */

(() => {
  "use strict";

  const GRADEBOOK_KEY = "rma_gradebook";

  const state = {
    bank: null,
    units: [],
    set: [],
    index: 0,
    correct: 0,
    answered: false,
    studentName: "",
    config: { count: 10, scope: "all", upto: null, from: null, to: null },
  };

  /* ── DOM ── */
  const $ = (id) => document.getElementById(id);
  const els = {
    setup: $("setup"),
    quiz: $("quiz"),
    summary: $("summary"),
    countChips: $("count-chips"),
    scopeSelect: $("scope-select"),
    uptoGroup: $("upto-group"),
    uptoSelect: $("upto-select"),
    rangeGroup: $("range-group"),
    rangeFrom: $("range-from"),
    rangeTo: $("range-to"),
    nameInput: $("name-input"),
    startBtn: $("start-btn"),
    donowBtn: $("donow-btn"),
    bankMeta: $("bank-meta"),
    progressText: $("progress-text"),
    scoreText: $("score-text"),
    progressFill: $("progress-fill"),
    progressBar: document.querySelector(".progress-track"),
    tagRow: $("tag-row"),
    stem: $("stem"),
    readAloudBtn: $("read-aloud-btn"),
    choices: $("choices"),
    feedback: $("feedback"),
    nextBtn: $("next-btn"),
    quitBtn: $("quit-btn"),
    summaryLine: $("summary-line"),
    summaryScore: $("summary-score"),
    stdList: $("std-list"),
    savedNote: $("saved-note"),
    againBtn: $("again-btn"),
  };

  /* ── helpers ── */
  function show(el) {
    el.classList.remove("hidden");
  }
  function hide(el) {
    el.classList.add("hidden");
  }

  // Fisher–Yates shuffle.
  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  // Weighted random pick WITHOUT replacement, given items with .weight.
  function weightedSampleNoReplace(pool, n) {
    const items = pool.map((q) => ({ q, w: q._weight }));
    const picked = [];
    while (picked.length < n && items.length > 0) {
      let total = 0;
      for (const it of items) total += it.w;
      let r = Math.random() * total;
      let idx = 0;
      for (let i = 0; i < items.length; i++) {
        r -= items[i].w;
        if (r <= 0) {
          idx = i;
          break;
        }
      }
      picked.push(items[idx].q);
      items.splice(idx, 1);
    }
    return picked;
  }

  /* ── bank loading ── */
  async function loadBank() {
    const res = await fetch("bank.json", { cache: "no-cache" });
    if (!res.ok) throw new Error("bank.json not found");
    return res.json();
  }

  /* ── scope + spiral weighting ──
     SPIRAL LOGIC: every candidate question gets a weight that decreases for
     newer (higher-numbered) units, so older units are reviewed more often.
     weight = 1 + (maxUnit - unit) * SPIRAL_STRENGTH. The newest unit gets
     weight 1; each step back adds SPIRAL_STRENGTH. */
  const SPIRAL_STRENGTH = 0.6;

  function unitsInScope() {
    const cfg = state.config;
    const all = state.units;
    if (cfg.scope === "upto" && cfg.upto != null) {
      return all.filter((u) => u <= cfg.upto);
    }
    if (cfg.scope === "range" && cfg.from != null && cfg.to != null) {
      const lo = Math.min(cfg.from, cfg.to);
      const hi = Math.max(cfg.from, cfg.to);
      return all.filter((u) => u >= lo && u <= hi);
    }
    return all.slice();
  }

  function buildSet(count) {
    const scope = new Set(unitsInScope());
    const maxUnit = Math.max(...scope);
    const candidates = state.bank.questions
      .filter((q) => scope.has(q.unit))
      .map((q) => {
        const weight = 1 + (maxUnit - q.unit) * SPIRAL_STRENGTH;
        return Object.assign({}, q, { _weight: weight });
      });

    if (candidates.length === 0) return [];
    const picked = weightedSampleNoReplace(candidates, count);
    // Shuffle answer choices per question so position is not a tell.
    return picked.map((q) => withShuffledChoices(q));
  }

  function withShuffledChoices(q) {
    const order = shuffle(q.choices.map((_, i) => i));
    const choices = order.map((i) => q.choices[i]);
    const correctIndex = order.indexOf(q.correctIndex);
    return Object.assign({}, q, { choices, correctIndex });
  }

  /* ── render setup selects ── */
  function fillUnitSelect(sel, units, selectedValue) {
    sel.innerHTML = "";
    units.forEach((u) => {
      const opt = document.createElement("option");
      opt.value = String(u);
      opt.textContent = `Unit ${u}`;
      if (u === selectedValue) opt.selected = true;
      sel.appendChild(opt);
    });
  }

  function initSetupControls() {
    const units = state.units;
    fillUnitSelect(els.uptoSelect, units, units[units.length - 1]);
    fillUnitSelect(els.rangeFrom, units, units[0]);
    fillUnitSelect(els.rangeTo, units, units[units.length - 1]);

    els.bankMeta.textContent = `Question bank: ${state.bank.questions.length} questions across units ${units[0]}–${units[units.length - 1]}.`;
  }

  /* ── quiz flow ── */
  function startSet(count) {
    state.config.count = count;
    state.studentName = (els.nameInput.value || "").trim();
    state.set = buildSet(count);
    state.index = 0;
    state.correct = 0;

    if (state.set.length === 0) {
      els.bankMeta.textContent =
        "No questions match that selection. Try a wider range.";
      return;
    }

    hide(els.setup);
    hide(els.summary);
    show(els.quiz);
    renderQuestion();
    els.quiz.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function renderQuestion() {
    const q = state.set[state.index];
    state.answered = false;
    stopSpeech();

    const total = state.set.length;
    els.progressText.textContent = `Question ${state.index + 1} of ${total}`;
    els.scoreText.textContent = `Score: ${state.correct} / ${state.index}`;
    const pct = Math.round((state.index / total) * 100);
    els.progressFill.style.width = `${pct}%`;
    els.progressBar.setAttribute("aria-valuenow", String(pct));

    // tags
    els.tagRow.innerHTML = "";
    const unitTag = document.createElement("span");
    unitTag.className = "tag unit";
    unitTag.textContent = `Unit ${q.unit}`;
    els.tagRow.appendChild(unitTag);
    if (q.standard) {
      const stdTag = document.createElement("span");
      stdTag.className = "tag";
      stdTag.textContent = q.standard;
      els.tagRow.appendChild(stdTag);
    }

    els.stem.textContent = q.stem;

    // choices
    els.choices.innerHTML = "";
    q.choices.forEach((choice, i) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "choice";
      const marker = document.createElement("span");
      marker.className = "marker";
      marker.textContent = String.fromCharCode(65 + i); // A, B, C...
      marker.setAttribute("aria-hidden", "true");
      const label = document.createElement("span");
      label.textContent = choice;
      btn.appendChild(marker);
      btn.appendChild(label);
      btn.setAttribute(
        "aria-label",
        `Option ${String.fromCharCode(65 + i)}: ${choice}`,
      );
      btn.addEventListener("click", () => answer(i, btn));
      els.choices.appendChild(btn);
    });

    hide(els.feedback);
    hide(els.nextBtn);
    els.feedback.className = "feedback hidden";

    // focus first choice for keyboard users
    const first = els.choices.querySelector(".choice");
    if (first) first.focus();
  }

  function answer(choiceIndex, btn) {
    if (state.answered) return;
    state.answered = true;
    const q = state.set[state.index];
    const isRight = choiceIndex === q.correctIndex;
    if (isRight) state.correct += 1;
    recordResult(isRight);

    // mark choices
    const buttons = Array.from(els.choices.querySelectorAll(".choice"));
    buttons.forEach((b, i) => {
      b.disabled = true;
      if (i === q.correctIndex) b.classList.add("correct");
      if (i === choiceIndex && !isRight) b.classList.add("wrong");
    });

    // feedback
    const cheers = [
      "Nice work!",
      "You got it!",
      "Exactly right!",
      "Great thinking!",
    ];
    const encourage = [
      "Not quite — let's learn from it.",
      "Good try — here's the idea.",
      "Almost! Check this out.",
    ];
    els.feedback.className = `feedback ${isRight ? "good" : "bad"}`;
    const head = document.createElement("p");
    head.className = "headline";
    head.textContent = isRight
      ? cheers[Math.floor(Math.random() * cheers.length)]
      : encourage[Math.floor(Math.random() * encourage.length)];
    const exp = document.createElement("p");
    exp.className = "explanation";
    let text = q.explanation || "";
    if (!isRight) {
      const correctLetter = String.fromCharCode(65 + q.correctIndex);
      const correctText = q.choices[q.correctIndex];
      text = `The answer is ${correctLetter}: ${correctText}. ${text}`.trim();
    }
    exp.textContent = text;
    els.feedback.innerHTML = "";
    els.feedback.appendChild(head);
    els.feedback.appendChild(exp);
    const tagNote = document.createElement("p");
    tagNote.className = "review-note";
    tagNote.textContent = `Unit ${q.unit} · ${q.standard || "review"}`;
    els.feedback.appendChild(tagNote);
    show(els.feedback);

    els.scoreText.textContent = `Score: ${state.correct} / ${state.index + 1}`;

    const last = state.index + 1 >= state.set.length;
    els.nextBtn.textContent = last ? "See results" : "Next question";
    show(els.nextBtn);
    els.nextBtn.focus();
  }

  function next() {
    if (!state.answered) return;
    if (state.index + 1 >= state.set.length) {
      finish();
      return;
    }
    state.index += 1;
    renderQuestion();
    els.quiz.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  /* ── summary ── */
  function finish() {
    stopSpeech();
    hide(els.quiz);
    show(els.summary);

    const total = state.set.length;
    const correct = state.correct;
    const pct = total > 0 ? Math.round((correct / total) * 100) : 0;

    // progress bar full
    els.progressFill.style.width = "100%";
    els.progressBar.setAttribute("aria-valuenow", "100");

    els.summaryScore.textContent = `${correct} / ${total}  ·  ${pct}%`;
    let msg = "Keep practicing — every set makes you stronger.";
    if (pct >= 85) msg = "Excellent! You are MCAP-ready on this mix.";
    else if (pct >= 70)
      msg = "Solid work — a little more review and you've got it.";
    else if (pct >= 50) msg = "Good effort — focus on the standards below.";
    els.summaryLine.textContent = msg;

    // Summary by standard (from the per-question results[] log).
    renderStandardBreakdown();

    // Optional, de-duped localStorage write for the teacher dashboards.
    maybeSaveToGradebook();
  }

  // We track per-question result as we go to support the breakdown.
  const results = []; // {standard, unit, correct:bool, lessonId, lessonTitle}

  function renderStandardBreakdown() {
    const byStd = new Map();
    results.forEach((r) => {
      const key = r.standard || "review";
      if (!byStd.has(key))
        byStd.set(key, { standard: key, unit: r.unit, correct: 0, total: 0 });
      const rec = byStd.get(key);
      rec.total += 1;
      if (r.correct) rec.correct += 1;
    });

    const rows = Array.from(byStd.values()).sort((a, b) => {
      const ap = a.correct / a.total;
      const bp = b.correct / b.total;
      return ap - bp; // weakest first
    });

    els.stdList.innerHTML = "";
    rows.forEach((r) => {
      const pct = Math.round((r.correct / r.total) * 100);
      const li = document.createElement("li");
      li.className = `std-row ${pct >= 70 ? "solid" : "review"}`;
      const name = document.createElement("span");
      name.className = "name";
      name.textContent = `Unit ${r.unit} · ${r.standard}`;
      const ratio = document.createElement("span");
      ratio.className = "ratio";
      ratio.textContent = `${r.correct} / ${r.total} (${pct}%)${pct >= 70 ? "" : " — review"}`;
      li.appendChild(name);
      li.appendChild(ratio);
      els.stdList.appendChild(li);
    });
  }

  /* ── optional localStorage gradebook write ──
     De-duped + safe. Writes ONE record per standard in this set, keyed by a
     synthetic lessonId `spiral-<standard>` so the Forecast Engine de-dupe
     (studentName||lessonId) updates rather than duplicates. Only writes when
     the student typed a name (otherwise we just track the session). */
  function maybeSaveToGradebook() {
    els.savedNote.classList.add("hidden");
    const name = state.studentName;
    if (!name) return;

    // group results by standard
    const byStd = new Map();
    results.forEach((r) => {
      const std = (r.standard || "").trim();
      if (!std) return;
      if (!byStd.has(std))
        byStd.set(std, { standard: std, unit: r.unit, correct: 0, total: 0 });
      const rec = byStd.get(std);
      rec.total += 1;
      if (r.correct) rec.correct += 1;
    });
    if (byStd.size === 0) return;

    let book;
    try {
      const raw = localStorage.getItem(GRADEBOOK_KEY);
      const arr = raw ? JSON.parse(raw) : [];
      book = Array.isArray(arr) ? arr : [];
    } catch {
      return; // storage unavailable — silently skip
    }

    const today = new Date().toISOString().slice(0, 10);
    const keyOf = (r) =>
      `${r.lessonId}||${(r.studentName || "").trim().toLowerCase()}`;

    let wrote = 0;
    byStd.forEach((rec) => {
      const pct = Math.round((rec.correct / rec.total) * 100);
      const record = {
        studentName: name,
        studentPeriod: "",
        lessonId: `spiral-${rec.standard}`,
        lessonTitle: `Spiral Review (${rec.standard})`,
        standard: rec.standard,
        correct: rec.correct,
        attempts: rec.total,
        pct,
        band: masteryBand(pct),
        date: today,
        assessment: "Spiral Review",
      };
      const target = keyOf(record);
      const idx = book.findIndex((r) => keyOf(r) === target);
      if (idx >= 0) book[idx] = record;
      else book.push(record);
      wrote += 1;
    });

    try {
      localStorage.setItem(GRADEBOOK_KEY, JSON.stringify(book));
      els.savedNote.textContent = `Saved your result for ${wrote} standard${wrote === 1 ? "" : "s"} to this device so your teacher's dashboard can see it.`;
      els.savedNote.classList.remove("hidden");
    } catch {
      /* ignore quota / private mode */
    }
  }

  function masteryBand(pct) {
    if (pct >= 85) return "Strong";
    if (pct >= 70) return "Likely Ready";
    if (pct >= 60) return "Approaching";
    return "Needs Reteach";
  }

  /* ── read-aloud (speechSynthesis) ── */
  let speaking = false;
  function stopSpeech() {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
      speaking = false;
    }
  }
  function readAloud() {
    if (!("speechSynthesis" in window)) return;
    if (speaking) {
      stopSpeech();
      return;
    }
    const q = state.set[state.index];
    const parts = [
      q.stem,
      ...q.choices.map((c, i) => `Option ${String.fromCharCode(65 + i)}. ${c}`),
    ];
    const utter = new SpeechSynthesisUtterance(parts.join(". "));
    utter.rate = 0.95;
    utter.onend = () => {
      speaking = false;
    };
    speaking = true;
    window.speechSynthesis.speak(utter);
  }

  /* ── wiring ── */
  function setupEvents() {
    // count chips
    els.countChips.querySelectorAll(".chip").forEach((chip) => {
      chip.addEventListener("click", () => {
        els.countChips
          .querySelectorAll(".chip")
          .forEach((c) => c.setAttribute("aria-pressed", "false"));
        chip.setAttribute("aria-pressed", "true");
        state.config.count = Number(chip.dataset.count);
      });
    });

    // scope select
    els.scopeSelect.addEventListener("change", () => {
      const v = els.scopeSelect.value;
      state.config.scope = v;
      els.uptoGroup.classList.toggle("hidden", v !== "upto");
      els.rangeGroup.classList.toggle("hidden", v !== "range");
    });
    els.uptoSelect.addEventListener("change", () => {
      state.config.upto = Number(els.uptoSelect.value);
    });
    els.rangeFrom.addEventListener("change", () => {
      state.config.from = Number(els.rangeFrom.value);
    });
    els.rangeTo.addEventListener("change", () => {
      state.config.to = Number(els.rangeTo.value);
    });

    els.startBtn.addEventListener("click", () => {
      // sync defaults if user never touched the selects
      if (state.config.upto == null)
        state.config.upto = state.units[state.units.length - 1];
      if (state.config.from == null) state.config.from = state.units[0];
      if (state.config.to == null)
        state.config.to = state.units[state.units.length - 1];
      results.length = 0;
      startSet(state.config.count);
    });

    els.donowBtn.addEventListener("click", () => {
      // Review Do Now = 5 mixed questions across ALL units.
      results.length = 0;
      state.config.scope = "all";
      els.scopeSelect.value = "all";
      els.uptoGroup.classList.add("hidden");
      els.rangeGroup.classList.add("hidden");
      state.studentName = (els.nameInput.value || "").trim();
      startSet(5);
    });

    els.nextBtn.addEventListener("click", next);
    els.readAloudBtn.addEventListener("click", readAloud);
    els.quitBtn.addEventListener("click", () => {
      // If nothing has been answered yet, confirm; otherwise show results.
      const answeredAny = results.length > 0;
      if (answeredAny || confirm("End this set now?")) finish();
    });
    els.againBtn.addEventListener("click", () => {
      stopSpeech();
      hide(els.summary);
      hide(els.quiz);
      show(els.setup);
      els.setup.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  // Record each answered question for the by-standard summary breakdown.
  function recordResult(isRight) {
    const q = state.set[state.index];
    results.push({
      standard: q.standard,
      unit: q.unit,
      lessonId: q.lessonId,
      lessonTitle: q.lessonTitle,
      correct: isRight,
    });
  }

  /* ── boot ── */
  async function init() {
    try {
      const bank = await loadBank();
      state.bank = bank;
      state.units = (bank.meta && bank.meta.units) || [];
      if (!state.units.length) {
        state.units = Array.from(
          new Set(bank.questions.map((q) => q.unit)),
        ).sort((a, b) => a - b);
      }
      initSetupControls();
      setupEvents();
    } catch (err) {
      els.bankMeta.textContent =
        "Could not load the question bank. Run build-bank.mjs, then open this page from a local server.";
      els.startBtn.disabled = true;
      els.donowBtn.disabled = true;
    }
  }

  document.addEventListener("DOMContentLoaded", init);
})();
