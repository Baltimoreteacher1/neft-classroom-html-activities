/* ============================================================
   NEFT CITY: DATA CRISIS — Living School simulation
   Vanilla JS. No dependencies, no backend, no external APIs.
   All "AI-style" feedback is generated locally from student work.

   Architecture:
     CONFIG        — dataset, answers, vocabulary, copy
     state         — single source of truth, persisted to localStorage
     render*()     — paint UI from state
     validate*()   — check student work, return feedback
     score*()      — deterministic local scoring -> city meters
     export/print  — JSON + printable report
     teacher view  — local diagnostic summary
   ============================================================ */

(() => {
  "use strict";

  /* ============================ CONFIG ============================ */
  const DATASET = [8, 12, 7, 15, 10, 9, 11, 13, 12, 14, 9, 16, 10, 12, 8, 11, 17, 13, 10, 9];
  const SORTED = [...DATASET].sort((a, b) => a - b); // 7,8,8,9,9,9,10,10,10,11,11,12,12,12,13,13,14,15,16,17

  const ANSWERS = {
    mean: 11.3,
    median: 11,
    mode: [9, 10, 12],
    range: 10,
  };

  const HISTO = {
    intervals: ["7–9", "10–12", "13–15", "16–18"],
    correct: [6, 8, 4, 2],
    max: 10,
  };

  const BEST_CHOICE = "A";

  const STEPS = [
    { id: "enter", label: "Enter City", icon: "🚪" },
    { id: "briefing", label: "Briefing", icon: "🏛️" },
    { id: "datalab", label: "Data Lab", icon: "🔬" },
    { id: "graph", label: "Graph", icon: "📊" },
    { id: "decision", label: "Decision", icon: "🗳️" },
    { id: "reaction", label: "City", icon: "🌆" },
    { id: "news", label: "News", icon: "📰" },
    { id: "passport", label: "Passport", icon: "🪪" },
  ];

  const VOCAB = [
    { term: "data", def: "Facts and numbers we collect to learn something.", ex: "The 20 wait times are our data." },
    { term: "mean", def: "The average. Add all the numbers, then divide by how many there are.", ex: "Mean = total ÷ number of values." },
    { term: "median", def: "The middle number after you sort from least to greatest.", ex: "With 20 numbers, the median is between the 10th and 11th." },
    { term: "mode", def: "The number that appears the most. There can be more than one.", ex: "If 9 appears most, 9 is a mode." },
    { term: "range", def: "The distance from the smallest to the largest number.", ex: "Range = greatest − least." },
    { term: "histogram", def: "A bar graph that shows how many values fall into each group (interval).", ex: "Each bar shows how many people waited that long." },
    { term: "evidence", def: "Proof from your data that supports your idea.", ex: "“The mode was 9–12 minutes” is evidence." },
  ];

  const DECISION_STARTERS = [
    "The data shows ",
    "The most common wait times were ",
    "I recommend ",
    "One piece of evidence is ",
    "Another piece of evidence is ",
  ];

  const NEWS_WORDS = ["data", "mean", "median", "mode", "range", "histogram", "evidence", "recommend", "wait time"];
  const NEWS_FRAMES = [
    "Neft City studied ",
    "The data showed ",
    "The histogram helped us see ",
    "I recommend ",
  ];

  const SKILLS = [
    { key: "sort", label: "I can sort data." },
    { key: "calc", label: "I can find mean, median, mode, and range." },
    { key: "graph", label: "I can build a graph from data." },
    { key: "recommend", label: "I can make a recommendation using evidence." },
    { key: "revise", label: "I can revise my thinking." },
  ];

  const ROLE_FLAVOR = {
    "Data Analyst": "As our Data Analyst, you'll dig into the numbers first.",
    "City Planner": "As our City Planner, you'll picture how a fix changes the arena.",
    "News Reporter": "As our News Reporter, you'll explain the story to the whole city.",
    "Budget Advisor": "As our Budget Advisor, you'll weigh the cost of each choice.",
    "Community Advocate": "As our Community Advocate, you'll speak up for the visitors waiting in line.",
  };

  const STORAGE_KEY = "neftcity_datacrisis_v1";

  /* ============================ STATE ============================ */
  const defaultState = () => ({
    name: "",
    role: "",
    current: "enter",
    maxStep: 0, // highest unlocked step index
    sort: { tray: [], solved: false },
    calc: {
      mean: { value: "", attempts: 0, solved: false, hint: false },
      median: { value: "", attempts: 0, solved: false, hint: false },
      mode: { value: "", attempts: 0, solved: false, hint: false },
      range: { value: "", attempts: 0, solved: false, hint: false },
    },
    graph: { bars: [0, 0, 0, 0], solved: false },
    interp: { answers: {}, written: "", solved: false },
    decision: { choice: "", text: "", submitted: false, accepted: false, revisions: 0 },
    news: { text: "", submitted: false },
    reflect: { r1: "", r2: "" },
    meters: { trust: 0, wait: 0, confidence: 0, explanation: 0 },
    outcomeTier: "", // good | medium | revise
  });

  let state = load() || defaultState();

  function save() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (e) { /* storage may be unavailable */ }
  }
  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      // Deep-merge onto a fresh default so older/partial saves keep every
      // nested key (prevents undefined-property crashes if the schema grows).
      const merge = (target, source) => {
        for (const key in source) {
          const val = source[key];
          if (val && typeof val === "object" && !Array.isArray(val)) {
            if (!target[key] || typeof target[key] !== "object") target[key] = {};
            merge(target[key], val);
          } else {
            target[key] = val;
          }
        }
        return target;
      };
      return merge(defaultState(), parsed);
    } catch (e) { return null; }
  }

  /* ============================ HELPERS ============================ */
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const wordCount = (s) => (s.trim().match(/\S+/g) || []).length;
  const stepIndex = (id) => STEPS.findIndex((s) => s.id === id);

  let toastTimer;
  function toast(msg, type = "") {
    const el = $("#toast");
    el.textContent = msg;
    el.className = "toast" + (type ? " " + type : "");
    el.hidden = false;
    requestAnimationFrame(() => el.classList.add("show"));
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      el.classList.remove("show");
      setTimeout(() => (el.hidden = true), 320);
    }, 2200);
  }

  /* ============================ NAVIGATION ============================ */
  function unlock(stepId) {
    const idx = stepIndex(stepId);
    if (idx > state.maxStep) {
      state.maxStep = idx;
      save();
      renderProgress();
    }
  }

  function go(stepId) {
    const idx = stepIndex(stepId);
    if (idx > state.maxStep) {
      toast("🔒 Finish the current step first!");
      return;
    }
    state.current = stepId;
    save();
    $$(".screen").forEach((s) => {
      const active = s.dataset.screen === stepId;
      s.classList.toggle("is-active", active);
      s.hidden = !active;
    });
    renderProgress();
    // screen-specific refresh
    if (stepId === "reaction") renderReaction();
    if (stepId === "passport") renderPassport();
    $("#main").focus();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function renderProgress() {
    const ol = $("#progressMap");
    ol.innerHTML = "";
    STEPS.forEach((step, i) => {
      const li = document.createElement("li");
      li.className = "progress-step";
      const locked = i > state.maxStep;
      if (locked) li.classList.add("is-locked");
      if (i < state.maxStep) li.classList.add("is-done");
      if (step.id === state.current) li.setAttribute("aria-current", "step");
      li.innerHTML = `<span class="ps-num" aria-hidden="true">${i < state.maxStep ? "✓" : i + 1}</span><span class="ps-label">${step.label}</span>`;
      li.setAttribute("role", "button");
      li.tabIndex = locked ? -1 : 0;
      li.setAttribute("aria-label", `${step.label}${locked ? " (locked)" : ""}`);
      if (!locked) {
        li.addEventListener("click", () => go(step.id));
        li.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); go(step.id); } });
      }
      ol.appendChild(li);
    });
  }

  /* ============================ 1. ENTER ============================ */
  function initEnter() {
    const nameInput = $("#studentName");
    const startBtn = $("#startBtn");
    const startHelp = $("#startHelp");

    nameInput.value = state.name;

    const refresh = () => {
      const ok = state.name.trim().length > 0 && state.role;
      startBtn.disabled = !ok;
      startHelp.textContent = ok ? "Ready! Press the button to begin." : "Add your name and pick a role to begin.";
    };

    nameInput.addEventListener("input", () => { state.name = nameInput.value; save(); refresh(); });

    $$("#roleGrid .role-card").forEach((btn) => {
      if (btn.dataset.role === state.role) btn.setAttribute("aria-pressed", "true");
      btn.addEventListener("click", () => {
        state.role = btn.dataset.role;
        $$("#roleGrid .role-card").forEach((b) => b.setAttribute("aria-pressed", String(b === btn)));
        save();
        refresh();
      });
    });

    startBtn.addEventListener("click", () => {
      unlock("briefing");
      unlock("datalab"); // briefing is informational; the Data Lab is the first gated task
      renderBriefing();
      go("briefing");
    });

    refresh();
  }

  /* ============================ 2. BRIEFING ============================ */
  function renderBriefing() {
    if (state.maxStep >= stepIndex("briefing")) unlock("datalab"); // keep Data Lab reachable on resume
    const intro = $("#mayorBriefing");
    const flavor = ROLE_FLAVOR[state.role] || "";
    intro.innerHTML =
      `${state.name ? `<strong>${escapeHtml(state.name)}</strong>, welcome to the team! ` : "Welcome to the team! "}` +
      `${flavor} ` +
      `Neft City's new sports arena is amazing — but the concession stands have <strong>long wait times</strong>. ` +
      `We surveyed <strong>20 visitors</strong> and timed how long each waited in line. ` +
      `Your job: study the data and tell us what the city should do.`;

    // vocab chips
    const wrap = $("#briefingVocab");
    wrap.innerHTML = "";
    ["data", "mean", "median", "mode", "range", "histogram", "evidence"].forEach((t) => {
      const b = document.createElement("button");
      b.className = "vocab-term";
      b.type = "button";
      b.textContent = t;
      b.addEventListener("click", () => openVocab(t));
      wrap.appendChild(b);
    });
  }

  /* ============================ 3. DATA LAB — SORT ============================ */
  function renderSort() {
    const pool = $("#sortPool");
    const tray = $("#sortTray");
    pool.innerHTML = "";
    tray.innerHTML = "";

    // numbers still in pool = dataset minus what's in tray (by position-aware multiset)
    const trayCounts = {};
    state.sort.tray.forEach((n) => (trayCounts[n] = (trayCounts[n] || 0) + 1));
    const remaining = [];
    const used = {};
    DATASET.forEach((n) => {
      used[n] = used[n] || 0;
      if (used[n] < (trayCounts[n] || 0)) { used[n]++; } else { remaining.push(n); }
    });

    remaining.forEach((n) => {
      const b = makeChip(n, false);
      b.addEventListener("click", () => {
        state.sort.tray.push(n);
        save();
        renderSort();
      });
      pool.appendChild(b);
    });

    state.sort.tray.forEach((n, i) => {
      const b = makeChip(n, true);
      b.addEventListener("click", () => {
        state.sort.tray.splice(i, 1);
        save();
        renderSort();
      });
      tray.appendChild(b);
    });

    if (state.sort.solved) markSortSolved();
  }

  function makeChip(n, inTray) {
    const b = document.createElement("button");
    b.className = "num-chip" + (inTray ? " in-tray" : "");
    b.type = "button";
    b.textContent = n;
    b.setAttribute("role", "listitem");
    b.setAttribute("aria-label", inTray ? `${n}, placed. Click to remove.` : `${n}. Click to place in sorted line.`);
    return b;
  }

  function checkSort() {
    const fb = $("#sortFeedback");
    const tray = state.sort.tray;
    if (tray.length < DATASET.length) {
      setFeedback(fb, "no", `Place all ${DATASET.length} numbers first. You have ${tray.length}.`);
      return;
    }
    const correct = tray.every((n, i) => n === SORTED[i]);
    if (correct) {
      state.sort.solved = true;
      save();
      setFeedback(fb, "ok", "✅ Perfect! The data is sorted least → greatest. Calculations unlocked!");
      markSortSolved();
      awardXp("Data sorted!");
      $("#calcBlock").classList.remove("locked");
      $("#calcBlock").setAttribute("aria-disabled", "false");
      $("#calcLockTag").textContent = "🔓 Unlocked";
      $("#calcLockTag").classList.add("unlocked");
    } else {
      // find first out-of-order index for targeted hint
      let firstBad = tray.findIndex((n, i) => n !== SORTED[i]);
      $$("#sortTray .num-chip").forEach((c, i) => {
        c.classList.toggle("bad", i >= firstBad);
      });
      setFeedback(fb, "no", "Check the order. The numbers should go from least to greatest. Look at the highlighted spot.");
    }
  }

  function markSortSolved() {
    $$("#sortTray .num-chip").forEach((c) => c.classList.remove("bad"));
    $("#calcBlock").classList.remove("locked");
    $("#calcBlock").setAttribute("aria-disabled", "false");
    $("#calcLockTag").textContent = "🔓 Unlocked";
    $("#calcLockTag").classList.add("unlocked");
  }

  /* ============================ 3. DATA LAB — CALCULATIONS ============================ */
  const CALC_DEFS = [
    { key: "mean", name: "Mean (average)", placeholder: "e.g. 11.3", hint: "Add all 20 numbers (total = 226). Then divide: 226 ÷ 20.", aria: "Mean answer" },
    { key: "median", name: "Median (middle)", placeholder: "e.g. 11", hint: "With 20 sorted numbers, look at the 10th and 11th. They are both 11, so the median is 11.", aria: "Median answer" },
    { key: "mode", name: "Mode (most common)", placeholder: "e.g. 9, 10, 12", hint: "Count each number. 9 appears 3 times, 10 appears 3 times, 12 appears 3 times. Three modes!", aria: "Mode answer" },
    { key: "range", name: "Range (spread)", placeholder: "e.g. 10", hint: "Greatest − least = 17 − 7.", aria: "Range answer" },
  ];

  function renderCalc() {
    const grid = $("#calcGrid");
    grid.innerHTML = "";
    CALC_DEFS.forEach((def) => {
      const c = state.calc[def.key];
      const row = document.createElement("div");
      row.className = "calc-row";
      row.innerHTML = `
        <div class="calc-head">
          <span class="calc-name">${def.name}</span>
          <span class="calc-state ${c.solved ? "solved" : ""}" id="state-${def.key}">${c.solved ? "✓ Solved" : "Try it"}</span>
        </div>
        <div class="calc-input-row">
          <input type="text" inputmode="decimal" id="input-${def.key}" value="${escapeAttr(c.value)}"
            placeholder="${def.placeholder}" aria-label="${def.aria}" ${c.solved ? "disabled" : ""} />
          <button class="btn-primary" type="button" id="check-${def.key}" ${c.solved ? "disabled" : ""}>Check</button>
          <button class="btn-hint" type="button" id="hint-${def.key}">💡 Hint</button>
        </div>
        <p class="feedback" id="fb-${def.key}" role="status" aria-live="polite"></p>
        <div class="hintcard ${c.hint ? "show" : ""}" id="hintcard-${def.key}">💡 ${def.hint}</div>
      `;
      grid.appendChild(row);

      $(`#check-${def.key}`).addEventListener("click", () => checkCalc(def.key));
      $(`#input-${def.key}`).addEventListener("keydown", (e) => { if (e.key === "Enter") checkCalc(def.key); });
      $(`#input-${def.key}`).addEventListener("input", (e) => { state.calc[def.key].value = e.target.value; save(); });
      $(`#hint-${def.key}`).addEventListener("click", () => {
        state.calc[def.key].hint = true;
        save();
        $(`#hintcard-${def.key}`).classList.add("show");
      });

      if (c.solved) setFeedback($(`#fb-${def.key}`), "ok", "✓ Correct!");
    });
    refreshDataLabGate();
  }

  function checkCalc(key) {
    const c = state.calc[key];
    const fb = $(`#fb-${key}`);
    const raw = $(`#input-${key}`).value.trim();
    c.value = raw;
    if (raw === "") { setFeedback(fb, "no", "Type your answer first."); save(); return; }

    const ok = validateCalc(key, raw);
    if (ok) {
      c.solved = true;
      save();
      setFeedback(fb, "ok", "✅ Correct! Nice work.");
      $(`#state-${key}`).textContent = "✓ Solved";
      $(`#state-${key}`).classList.add("solved");
      $(`#input-${key}`).disabled = true;
      $(`#check-${key}`).disabled = true;
      awardXp(`${CALC_DEFS.find((d) => d.key === key).name.split(" ")[0]} solved!`);
      refreshDataLabGate();
    } else {
      c.attempts++;
      save();
      let msg = calcMissMessage(key, raw);
      if (c.attempts >= 2) {
        c.hint = true;
        $(`#hintcard-${key}`).classList.add("show");
        setFeedback(fb, "tip", `${msg} A hint is now open below. 💡`);
      } else {
        setFeedback(fb, "no", msg);
      }
    }
  }

  function validateCalc(key, raw) {
    if (key === "mode") {
      const nums = (raw.match(/\d+/g) || []).map(Number);
      const set = new Set(nums);
      return set.size === ANSWERS.mode.length && ANSWERS.mode.every((m) => set.has(m));
    }
    const v = parseFloat(raw.replace(/,/g, ".").replace(/[^0-9.\-]/g, ""));
    if (Number.isNaN(v)) return false;
    if (key === "mean") return Math.abs(v - ANSWERS.mean) < 0.05;
    return Math.abs(v - ANSWERS[key]) < 0.001;
  }

  // Targeted, misconception-aware feedback (generated locally).
  function calcMissMessage(key, raw) {
    const v = parseFloat(raw.replace(/,/g, ".").replace(/[^0-9.\-]/g, ""));
    if (key === "mean") {
      if (Math.abs(v - 226) < 0.5) return "That's the total. Now divide by the number of values (20).";
      if (Math.abs(v - 11) < 0.001) return "Close! Did you forget the decimal? Try dividing more exactly.";
      return "Not yet. Mean = total ÷ number of values. Total is 226.";
    }
    if (key === "median") {
      if (Math.abs(v - 11.3) < 0.05) return "That's the mean, not the median. The median is the middle of the sorted list.";
      if (Math.abs(v - 10) < 0.001) return "Close. Look again at the 10th and 11th numbers in the sorted list.";
      return "Not yet. The median is the middle value after sorting.";
    }
    if (key === "mode") {
      const nums = (raw.match(/\d+/g) || []).map(Number);
      if (nums.length === 1) return "There is more than one mode here. Look for every number that ties for most.";
      return "Not yet. Find every number that appears the most times.";
    }
    if (key === "range") {
      if (Math.abs(v - 24) < 0.001) return "That looks like greatest + least. Range uses subtraction: greatest − least.";
      return "Not yet. Range = greatest − least (17 − 7).";
    }
    return "Not quite — try again.";
  }

  function refreshDataLabGate() {
    const allSolved = state.sort.solved && CALC_DEFS.every((d) => state.calc[d.key].solved);
    const btn = $("#toGraphBtn");
    if (btn) btn.disabled = !allSolved;
    if (allSolved) unlock("graph");
  }

  /* ============================ 4. GRAPH ============================ */
  function renderGraph() {
    const wrap = $("#histogram");
    wrap.innerHTML = "";
    HISTO.intervals.forEach((label, i) => {
      const col = document.createElement("div");
      col.className = "hbar-col";
      col.innerHTML = `
        <div class="hbar-track" id="track-${i}" role="slider" tabindex="0"
             aria-label="Bar for ${label} minutes" aria-valuemin="0" aria-valuemax="${HISTO.max}" aria-valuenow="${state.graph.bars[i]}">
          <div class="hbar" id="bar-${i}"><span class="hbar-val" id="barval-${i}">${state.graph.bars[i]}</span></div>
        </div>
        <div class="hbar-controls">
          <button class="hbar-btn" type="button" id="minus-${i}" aria-label="Decrease ${label} bar">−</button>
          <button class="hbar-btn" type="button" id="plus-${i}" aria-label="Increase ${label} bar">+</button>
        </div>
        <span class="hbar-label">${label}</span>
        <span class="hbar-tick">minutes</span>
      `;
      wrap.appendChild(col);

      $(`#plus-${i}`).addEventListener("click", () => setBar(i, state.graph.bars[i] + 1));
      $(`#minus-${i}`).addEventListener("click", () => setBar(i, state.graph.bars[i] - 1));
      const track = $(`#track-${i}`);
      track.addEventListener("click", (e) => {
        const rect = track.getBoundingClientRect();
        const frac = 1 - (e.clientY - rect.top) / rect.height;
        setBar(i, Math.round(frac * HISTO.max));
      });
      track.addEventListener("keydown", (e) => {
        if (e.key === "ArrowUp" || e.key === "ArrowRight") { e.preventDefault(); setBar(i, state.graph.bars[i] + 1); }
        if (e.key === "ArrowDown" || e.key === "ArrowLeft") { e.preventDefault(); setBar(i, state.graph.bars[i] - 1); }
      });
      paintBar(i);
    });
    if (state.graph.solved) {
      $("#interpBlock").classList.remove("locked");
      $("#interpLockTag").textContent = "🔓 Unlocked";
      $("#interpLockTag").classList.add("unlocked");
    }
    renderInterp();
  }

  function setBar(i, val) {
    val = Math.max(0, Math.min(HISTO.max, val));
    state.graph.bars[i] = val;
    save();
    paintBar(i);
  }

  function paintBar(i) {
    const bar = $(`#bar-${i}`);
    const val = state.graph.bars[i];
    bar.style.height = (val / HISTO.max) * 100 + "%";
    $(`#barval-${i}`).textContent = val;
    bar.classList.remove("correct", "wrong");
    const track = $(`#track-${i}`);
    if (track) track.setAttribute("aria-valuenow", val);
  }

  function checkGraph() {
    const fb = $("#graphFeedback");
    let allRight = true;
    state.graph.bars.forEach((v, i) => {
      const bar = $(`#bar-${i}`);
      const right = v === HISTO.correct[i];
      bar.classList.toggle("correct", right);
      bar.classList.toggle("wrong", !right);
      if (!right) allRight = false;
    });
    if (allRight) {
      state.graph.solved = true;
      save();
      setFeedback(fb, "ok", "✅ Your histogram matches the data! Interpretation questions unlocked.");
      $("#interpBlock").classList.remove("locked");
      $("#interpLockTag").textContent = "🔓 Unlocked";
      $("#interpLockTag").classList.add("unlocked");
      awardXp("Histogram built!");
    } else {
      const total = state.graph.bars.reduce((a, b) => a + b, 0);
      let hint = "Check the red bars. Count again from the sorted data.";
      if (total !== 20) hint = `Your bars add up to ${total}, but there are 20 visitors. Recount each interval.`;
      setFeedback(fb, "no", hint);
    }
  }

  /* ---- interpretation ---- */
  const INTERP = [
    {
      id: "most", q: "Which interval has the most visitors?",
      opts: ["7–9", "10–12", "13–15", "16–18"], answer: "10–12",
    },
    {
      id: "tell", q: "What does this tell us about the wait times?",
      opts: ["Most people waited a medium amount of time", "Everyone waited the same", "Nobody waited long"], answer: "Most people waited a medium amount of time",
    },
    {
      id: "length", q: "Are most waits short, medium, or long?",
      opts: ["Short", "Medium", "Long"], answer: "Medium",
    },
    {
      id: "attention", q: "What should the city pay attention to?",
      opts: ["The long lines at the busiest times", "Closing the arena", "Nothing at all"], answer: "The long lines at the busiest times",
    },
  ];

  function renderInterp() {
    const wrap = $("#interpQuestions");
    if (wrap.dataset.built === "1") { restoreInterpUI(); return; }
    wrap.innerHTML = "";
    INTERP.forEach((q) => {
      const div = document.createElement("div");
      div.className = "interp-q";
      div.innerHTML = `<p>${q.q}</p><div class="opt-row" id="opts-${q.id}"></div>`;
      wrap.appendChild(div);
      q.opts.forEach((opt) => {
        const b = document.createElement("button");
        b.className = "opt";
        b.type = "button";
        b.textContent = opt;
        b.setAttribute("aria-pressed", String(state.interp.answers[q.id] === opt));
        b.addEventListener("click", () => {
          state.interp.answers[q.id] = opt;
          $$(`#opts-${q.id} .opt`).forEach((o) => o.setAttribute("aria-pressed", String(o === b)));
          save();
        });
        $(`#opts-${q.id}`, div).appendChild(b);
      });
    });
    // short written response
    const writeDiv = document.createElement("div");
    writeDiv.className = "interp-q";
    writeDiv.innerHTML = `<p>In one sentence: what is the biggest thing your graph shows? (written response)</p>`;
    const ta = document.createElement("textarea");
    ta.className = "writebox";
    ta.rows = 2;
    ta.id = "interpWritten";
    ta.placeholder = "Type one sentence about your graph…";
    ta.value = state.interp.written;
    ta.addEventListener("input", (e) => { state.interp.written = e.target.value; save(); });
    writeDiv.appendChild(ta);
    wrap.appendChild(writeDiv);
    wrap.dataset.built = "1";
  }

  function restoreInterpUI() {
    INTERP.forEach((q) => {
      $$(`#opts-${q.id} .opt`).forEach((o) =>
        o.setAttribute("aria-pressed", String(state.interp.answers[q.id] === o.textContent))
      );
    });
    const ta = $("#interpWritten");
    if (ta) ta.value = state.interp.written;
  }

  function checkInterp() {
    const fb = $("#interpFeedback");
    let correctCount = 0;
    INTERP.forEach((q) => {
      const picked = state.interp.answers[q.id];
      const right = picked === q.answer;
      if (right) correctCount++;
      $$(`#opts-${q.id} .opt`).forEach((o) => {
        o.classList.remove("correct", "wrong");
        if (o.textContent === picked) o.classList.add(right ? "correct" : "wrong");
        if (o.textContent === q.answer) o.classList.add("correct");
      });
    });
    const written = wordCount(state.interp.written) >= 3;
    if (correctCount === INTERP.length && written) {
      state.interp.solved = true;
      save();
      setFeedback(fb, "ok", "✅ Great reading of the data! The Decision Room is open.");
      $("#toDecisionBtn").disabled = false;
      unlock("decision");
      awardXp("Graph interpreted!");
    } else {
      let msg = `You have ${correctCount} of ${INTERP.length} multiple-choice answers correct.`;
      if (!written) msg += " Also write at least one full sentence in the response box.";
      else msg += " Look at the highlighted answers and try again.";
      setFeedback(fb, "no", msg);
    }
  }

  /* ============================ 5. DECISION ============================ */
  function initDecision() {
    // choices
    $$("#decisionChoices .choice").forEach((btn) => {
      btn.addEventListener("click", () => {
        state.decision.choice = btn.dataset.choice;
        $$("#decisionChoices .choice").forEach((b) => b.setAttribute("aria-pressed", String(b === btn)));
        save();
      });
    });

    // sentence starters
    const wrap = $("#decisionStarters");
    DECISION_STARTERS.forEach((s) => {
      const b = document.createElement("button");
      b.className = "starter";
      b.type = "button";
      b.textContent = s.trim() + "…";
      b.addEventListener("click", () => insertText("#decisionText", s, "decision", "text"));
      wrap.appendChild(b);
    });

    const ta = $("#decisionText");
    ta.addEventListener("input", () => {
      state.decision.text = ta.value;
      updateCount("#decisionCount", ta.value, 18);
      save();
    });

    $("#submitDecisionBtn").addEventListener("click", submitDecision);
  }

  function renderDecision() {
    $$("#decisionChoices .choice").forEach((b) =>
      b.setAttribute("aria-pressed", String(b.dataset.choice === state.decision.choice))
    );
    $("#decisionText").value = state.decision.text;
    updateCount("#decisionCount", state.decision.text, 18);
  }

  function submitDecision() {
    const fb = $("#decisionFeedback");
    const wc = wordCount(state.decision.text);
    if (!state.decision.choice) { setFeedback(fb, "no", "Pick a recommendation (A, B, C, or D) first."); return; }
    if (wc < 18) { setFeedback(fb, "no", `Write at least 18 words of evidence. You have ${wc}.`); return; }

    state.decision.submitted = true;

    if (state.decision.choice === BEST_CHOICE) {
      state.decision.accepted = true;
      save();
      setFeedback(fb, "ok", "✅ The city council is convinced! Heading to City Reaction…");
      computeScore();
      unlock("reaction");
      awardXp("Recommendation accepted!");
      setTimeout(() => go("reaction"), 700);
    } else {
      // revision event
      state.decision.accepted = false;
      state.decision.revisions++;
      save();
      setFeedback(fb, "no", "🏛️ The city council is not convinced yet. Look back at the data and revise your recommendation. (Hint: the data shows medium waits at the busiest times — adding capacity helps.)");
      // still let them see a (revise) reaction so the loop is visible
      computeScore();
      unlock("reaction");
      awardXp("Revision needed");
      setTimeout(() => go("reaction"), 900);
    }
  }

  /* ============================ 6. CITY REACTION + SCORING ============================ */
  // Deterministic local scoring -> four 0..100 meters.
  function computeScore() {
    const calcSolved = CALC_DEFS.filter((d) => state.calc[d.key].solved).length;
    const totalAttempts = CALC_DEFS.reduce((a, d) => a + state.calc[d.key].attempts, 0);
    const decWords = wordCount(state.decision.text);
    const acceptedBest = state.decision.choice === BEST_CHOICE;

    // Data Confidence: calculations + sort + graph
    let confidence = 0;
    if (state.sort.solved) confidence += 20;
    confidence += calcSolved * 12.5; // 4 -> 50
    if (state.graph.solved) confidence += 20;
    if (state.interp.solved) confidence += 10;
    confidence -= Math.min(20, totalAttempts * 2); // penalize many misses
    confidence = clamp(confidence);

    // Explanation Strength: words + evidence keywords + correctness
    const evidenceHits = countEvidence(state.decision.text);
    let explanation = Math.min(50, decWords * 1.5) + evidenceHits * 10;
    if (acceptedBest) explanation += 15;
    explanation = clamp(explanation);

    // Public Trust: best decision + strong explanation, minus revisions
    let trust = (acceptedBest ? 55 : 20) + Math.round(explanation * 0.3) - state.decision.revisions * 8;
    trust = clamp(trust);

    // Wait Time Problem (higher = more solved/improved)
    let wait = acceptedBest ? 70 : 30;
    if (state.graph.solved) wait += 15;
    if (acceptedBest && evidenceHits >= 2) wait += 15;
    wait = clamp(wait);

    state.meters = {
      trust: Math.round(trust),
      wait: Math.round(wait),
      confidence: Math.round(confidence),
      explanation: Math.round(explanation),
    };

    // outcome tier
    if (!acceptedBest) {
      state.outcomeTier = "revise";
    } else if (state.meters.explanation >= 65 && evidenceHits >= 2 && state.meters.confidence >= 70) {
      state.outcomeTier = "good";
    } else {
      state.outcomeTier = "medium";
    }
    save();
  }

  function countEvidence(text) {
    const t = text.toLowerCase();
    let hits = 0;
    [/mean/, /median/, /mode/, /range/, /histogram|graph|bar/, /\b9\b|\b10\b|\b11\b|\b12\b/, /most|common|medium|interval/, /minute/].forEach((re) => {
      if (re.test(t)) hits++;
    });
    return hits;
  }

  const OUTCOME_COPY = {
    good: { icon: "🎉", cls: "good", text: "Your team used strong data evidence. Neft City approves a new concession stand, and wait times begin to improve." },
    medium: { icon: "🤔", cls: "medium", text: "Your team found some useful evidence, but the city needs a clearer explanation before making a full decision." },
    revise: { icon: "⚠️", cls: "revise", text: "The city made a rushed decision and the problem continued. Your team must revise the data report." },
  };

  function renderReaction() {
    computeScore();
    const tier = state.outcomeTier || "medium";
    const copy = OUTCOME_COPY[tier];
    const banner = $("#outcomeBanner");
    banner.className = "outcome-banner " + copy.cls;
    $("#outcomeIcon").textContent = copy.icon;
    $("#outcomeStory").textContent = copy.text;

    const meters = [
      { name: "Public Trust", val: state.meters.trust },
      { name: "Wait Time Problem", val: state.meters.wait },
      { name: "Data Confidence", val: state.meters.confidence },
      { name: "Explanation Strength", val: state.meters.explanation },
    ];
    const wrap = $("#meters");
    wrap.innerHTML = "";
    meters.forEach((m) => {
      const div = document.createElement("div");
      div.className = "meter";
      div.innerHTML = `
        <div class="meter-top"><span class="meter-name">${m.name}</span><span class="meter-val">${m.val}</span></div>
        <div class="meter-bar"><div class="meter-fill"></div></div>`;
      wrap.appendChild(div);
      requestAnimationFrame(() => { $(".meter-fill", div).style.width = m.val + "%"; });
    });

    // News unlocks once they've seen reaction with an accepted best decision
    if (state.decision.accepted) unlock("news");
  }

  /* ============================ 7. NEWS ============================ */
  function initNews() {
    const bank = $("#newsWordbank");
    NEWS_WORDS.forEach((w) => {
      const b = document.createElement("button");
      b.className = "word-chip";
      b.type = "button";
      b.textContent = w;
      b.addEventListener("click", () => insertText("#newsText", w + " ", "news", "text"));
      bank.appendChild(b);
    });
    const frames = $("#newsStarters");
    NEWS_FRAMES.forEach((f) => {
      const b = document.createElement("button");
      b.className = "starter";
      b.type = "button";
      b.textContent = f.trim() + "…";
      b.addEventListener("click", () => insertText("#newsText", f, "news", "text"));
      frames.appendChild(b);
    });
    const ta = $("#newsText");
    ta.addEventListener("input", () => {
      state.news.text = ta.value;
      updateCount("#newsCount", ta.value, 35);
      save();
    });
    $("#submitNewsBtn").addEventListener("click", submitNews);
  }

  function renderNews() {
    $("#newsText").value = state.news.text;
    updateCount("#newsCount", state.news.text, 35);
  }

  function submitNews() {
    const fb = $("#newsFeedback");
    const wc = wordCount(state.news.text);
    if (wc < 35) { setFeedback(fb, "no", `Write at least 35 words. You have ${wc}.`); return; }
    state.news.submitted = true;
    save();
    setFeedback(fb, "ok", "✅ Published! Generating your Proof-of-Learning Passport…");
    unlock("passport");
    awardXp("News published!");
    setTimeout(() => go("passport"), 700);
  }

  /* ============================ 8. PASSPORT ============================ */
  function renderPassport() {
    $("#ppName").textContent = state.name || "Student";
    $("#ppRole").textContent = state.role || "City Team";
    const tier = state.outcomeTier || "medium";
    $("#ppOutcome").textContent = tier === "good" ? "New concession stand approved 🎉"
      : tier === "medium" ? "Decision under review 🤔" : "Report sent back for revision ⚠️";

    const earned = {
      sort: state.sort.solved,
      calc: CALC_DEFS.every((d) => state.calc[d.key].solved),
      graph: state.graph.solved,
      recommend: state.decision.accepted,
      revise: state.decision.revisions > 0 || state.decision.accepted,
    };
    const list = $("#ppSkills");
    list.innerHTML = "";
    SKILLS.forEach((s) => {
      const li = document.createElement("li");
      li.textContent = s.label;
      if (!earned[s.key]) li.classList.add("not-yet");
      list.appendChild(li);
    });

    $("#reflect1").value = state.reflect.r1;
    $("#reflect2").value = state.reflect.r2;
  }

  function initPassport() {
    $("#reflect1").addEventListener("input", (e) => { state.reflect.r1 = e.target.value; save(); });
    $("#reflect2").addEventListener("input", (e) => { state.reflect.r2 = e.target.value; save(); });
    $("#printBtn").addEventListener("click", printReport);
    $("#downloadBtn").addEventListener("click", downloadJSON);
    $("#resetBtn").addEventListener("click", resetMission);
  }

  /* ============================ 9. EXPORT / PRINT ============================ */
  function buildPrintHTML() {
    const m = state.meters;
    const tier = state.outcomeTier || "medium";
    const outcome = tier === "good" ? "New concession stand approved" : tier === "medium" ? "Decision under review" : "Report sent back for revision";
    const skills = {
      "Sort data": state.sort.solved,
      "Mean/median/mode/range": CALC_DEFS.every((d) => state.calc[d.key].solved),
      "Build a graph": state.graph.solved,
      "Recommend with evidence": state.decision.accepted,
      "Revise thinking": state.decision.revisions > 0 || state.decision.accepted,
    };
    return `
      <h1>Neft City: Data Crisis — Proof of Learning</h1>
      <div class="pr-grid">
        <div class="pr-row"><b>Name:</b> ${escapeHtml(state.name || "—")}</div>
        <div class="pr-row"><b>Role:</b> ${escapeHtml(state.role || "—")}</div>
        <div class="pr-row"><b>Mission:</b> Data Crisis at the Arena</div>
        <div class="pr-row"><b>City Outcome:</b> ${outcome}</div>
      </div>

      <h2>Sorted Data (least → greatest)</h2>
      <div class="pr-row">${state.sort.tray.length === DATASET.length ? state.sort.tray.join(", ") : SORTED.join(", ")}</div>

      <h2>Calculations</h2>
      <div class="pr-grid">
        <div class="pr-row"><b>Mean:</b> ${escapeHtml(state.calc.mean.value || "—")}</div>
        <div class="pr-row"><b>Median:</b> ${escapeHtml(state.calc.median.value || "—")}</div>
        <div class="pr-row"><b>Mode:</b> ${escapeHtml(state.calc.mode.value || "—")}</div>
        <div class="pr-row"><b>Range:</b> ${escapeHtml(state.calc.range.value || "—")}</div>
      </div>

      <h2>Graph Frequencies</h2>
      <div class="pr-row">${HISTO.intervals.map((iv, i) => `${iv}: ${state.graph.bars[i]}`).join(" &nbsp;·&nbsp; ")}</div>

      <h2>Recommendation</h2>
      <div class="pr-row"><b>Choice:</b> ${state.decision.choice || "—"}</div>
      <div class="pr-row"><b>Explanation:</b> ${escapeHtml(state.decision.text || "—")}</div>

      <h2>News Report</h2>
      <div class="pr-row">${escapeHtml(state.news.text || "—")}</div>

      <h2>Reflection</h2>
      <div class="pr-row"><b>I understand better:</b> ${escapeHtml(state.reflect.r1 || "—")}</div>
      <div class="pr-row"><b>I want to practice:</b> ${escapeHtml(state.reflect.r2 || "—")}</div>

      <h2>Skill Checklist</h2>
      <ul>${Object.entries(skills).map(([k, v]) => `<li>${v ? "☑" : "☐"} ${k}</li>`).join("")}</ul>

      <h2>City Status</h2>
      <div class="pr-row">Public Trust: ${m.trust} &nbsp;·&nbsp; Wait Time: ${m.wait} &nbsp;·&nbsp; Data Confidence: ${m.confidence} &nbsp;·&nbsp; Explanation: ${m.explanation}</div>
    `;
  }

  function printReport() {
    $("#printReport").innerHTML = buildPrintHTML();
    window.print();
  }

  function downloadJSON() {
    const data = JSON.stringify(state, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const safe = (state.name || "student").replace(/[^a-z0-9]/gi, "_").toLowerCase();
    a.href = url;
    a.download = `neft-city-data-crisis_${safe}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    // Delay revocation so slower browsers (Firefox/Safari/mobile) finish the fetch.
    setTimeout(() => URL.revokeObjectURL(url), 100);
    toast("⬇️ Progress downloaded");
  }

  function resetMission() {
    if (!confirm("Reset the whole mission? This clears all your work on this device.")) return;
    try { localStorage.removeItem(STORAGE_KEY); } catch (e) {}
    state = defaultState();
    save();
    // rebuild dynamic UI
    $("#interpQuestions").dataset.built = "";
    location.reload();
  }

  /* ============================ 10. TEACHER VIEW ============================ */
  function buildTeacherHTML() {
    const c = state.calc;
    const calcSolved = CALC_DEFS.filter((d) => c[d.key].solved).length;
    const totalAttempts = CALC_DEFS.reduce((a, d) => a + c[d.key].attempts, 0);
    const decWords = wordCount(state.decision.text);
    const newsWords = wordCount(state.news.text);
    const evidenceHits = countEvidence(state.decision.text);
    const acceptedBest = state.decision.choice === BEST_CHOICE;

    const pill = (ok, warn) => ok ? `<span class="t-pill good">strong</span>` : warn ? `<span class="t-pill warn">developing</span>` : `<span class="t-pill bad">not yet</span>`;

    // misconception detection (local)
    const misconceptions = [];
    if (c.median.attempts >= 2 && !c.median.solved) misconceptions.push("Median: may be reading the unsorted list or picking the mean.");
    if (c.mode.attempts >= 2) misconceptions.push("Mode: may be giving only one mode instead of all three (9, 10, 12).");
    if (c.range.attempts >= 2) misconceptions.push("Range: may be adding instead of subtracting greatest − least.");
    if (c.mean.attempts >= 2) misconceptions.push("Mean: may stop at the total (226) without dividing by 20.");
    if (state.graph.solved === false && state.graph.bars.reduce((a, b) => a + b, 0) !== 20 && stepIndex(state.current) >= 3)
      misconceptions.push("Histogram: bar frequencies do not total 20 — likely miscounting intervals.");
    if (!misconceptions.length) misconceptions.push("None detected so far.");

    // recommendation quality
    let recQuality, recPill;
    if (acceptedBest && evidenceHits >= 2 && decWords >= 18) { recQuality = "Strong — best choice with 2+ pieces of evidence."; recPill = `<span class="t-pill good">strong</span>`; }
    else if (acceptedBest) { recQuality = "On track — best choice, evidence could be richer."; recPill = `<span class="t-pill warn">developing</span>`; }
    else if (state.decision.submitted) { recQuality = "Needs revision — not yet the best-supported choice."; recPill = `<span class="t-pill bad">revise</span>`; }
    else { recQuality = "Not submitted yet."; recPill = `<span class="t-pill warn">pending</span>`; }

    // suggested next move
    let nextMove;
    if (c.median.attempts >= 2 && !c.median.solved) nextMove = "Review median: student may need to sort data before finding the middle.";
    else if (c.mode.attempts >= 2) nextMove = "Review mode: remind student a data set can have more than one mode.";
    else if (c.range.attempts >= 2) nextMove = "Review range: practice greatest − least with a number line.";
    else if (acceptedBest && evidenceHits < 2) nextMove = "Student can calculate but needs support explaining with evidence. Use sentence frames for academic explanation.";
    else if (calcSolved === 4 && state.graph.solved && acceptedBest && evidenceHits >= 2) nextMove = "Student is ready for enrichment: ask how an outlier (e.g., a 30-minute wait) would change the mean vs. the median.";
    else nextMove = "Continue mission; check in during the Decision Room for evidence quality.";

    return `
      <div class="teacher-section">
        <h3>Student</h3>
        <div class="tstat"><span>Name</span><b>${escapeHtml(state.name || "—")}</b></div>
        <div class="tstat"><span>Role</span><b>${escapeHtml(state.role || "—")}</b></div>
        <div class="tstat"><span>Current step</span><b>${state.current}</b></div>
      </div>

      <div class="teacher-section">
        <h3>Score by Skill</h3>
        <div class="tstat"><span>Sort data</span>${pill(state.sort.solved, false)}</div>
        <div class="tstat"><span>Calculations (${calcSolved}/4)</span>${pill(calcSolved === 4, calcSolved >= 2)}</div>
        <div class="tstat"><span>Histogram</span>${pill(state.graph.solved, false)}</div>
        <div class="tstat"><span>Interpretation</span>${pill(state.interp.solved, false)}</div>
        <div class="tstat"><span>Recommendation</span>${recPill}</div>
      </div>

      <div class="teacher-section">
        <h3>Attempts per Calculation</h3>
        <div class="tstat"><span>Mean</span><b>${c.mean.attempts} ${c.mean.solved ? "✓" : ""}</b></div>
        <div class="tstat"><span>Median</span><b>${c.median.attempts} ${c.median.solved ? "✓" : ""}</b></div>
        <div class="tstat"><span>Mode</span><b>${c.mode.attempts} ${c.mode.solved ? "✓" : ""}</b></div>
        <div class="tstat"><span>Range</span><b>${c.range.attempts} ${c.range.solved ? "✓" : ""}</b></div>
        <div class="tstat"><span>Total misses</span><b>${totalAttempts}</b></div>
      </div>

      <div class="teacher-section">
        <h3>Misconceptions Detected</h3>
        <ul>${misconceptions.map((m) => `<li>${m}</li>`).join("")}</ul>
      </div>

      <div class="teacher-section">
        <h3>Writing</h3>
        <div class="tstat"><span>Explanation words</span><b>${decWords}</b></div>
        <div class="tstat"><span>Evidence signals</span><b>${evidenceHits}</b></div>
        <div class="tstat"><span>News report words</span><b>${newsWords}</b></div>
        <div class="tstat"><span>Revisions</span><b>${state.decision.revisions}</b></div>
      </div>

      <div class="teacher-section">
        <h3>Recommendation Quality</h3>
        <p>${recQuality}</p>
      </div>

      <div class="teacher-section">
        <h3>Suggested Teacher Next Move</h3>
        <div class="next-move">${nextMove}</div>
      </div>
    `;
  }

  function openTeacher() {
    $("#teacherBody").innerHTML = buildTeacherHTML();
    showModal("#teacherModal");
  }

  /* ============================ VOCAB MODAL ============================ */
  function buildVocab() {
    const list = $("#vocabList");
    list.innerHTML = "";
    VOCAB.forEach((v) => {
      const div = document.createElement("div");
      div.className = "vocab-item";
      div.id = "vocab-" + v.term;
      div.innerHTML = `<h3>${v.term}</h3><p>${v.def}</p><p class="vi-ex">Example: ${v.ex}</p>`;
      list.appendChild(div);
    });
  }
  function openVocab(term) {
    showModal("#vocabModal");
    if (term) {
      const el = $("#vocab-" + term);
      if (el) { el.scrollIntoView({ block: "center" }); el.style.outline = "3px solid var(--gold-1)"; setTimeout(() => (el.style.outline = ""), 1500); }
    }
  }

  /* ============================ MODAL PLUMBING ============================ */
  let lastFocus = null;
  function showModal(sel) {
    lastFocus = document.activeElement;
    const m = $(sel);
    m.hidden = false;
    const closeBtn = $(".modal-close", m);
    if (closeBtn) closeBtn.focus();
  }
  function hideModal(sel) {
    $(sel).hidden = true;
    if (lastFocus) lastFocus.focus();
  }

  /* ============================ SHARED UI HELPERS ============================ */
  function setFeedback(el, kind, msg) {
    if (!el) return;
    el.className = "feedback " + kind;
    el.textContent = msg;
  }
  function updateCount(sel, text, min) {
    const el = $(sel);
    const n = wordCount(text);
    el.textContent = `${n} words` + (n >= min ? " ✓" : ` (need ${min})`);
    el.classList.toggle("ok", n >= min);
  }
  function insertText(taSel, snippet, stateKey, field) {
    const ta = $(taSel);
    const start = ta.selectionStart ?? ta.value.length;
    const before = ta.value.slice(0, start);
    const after = ta.value.slice(ta.selectionEnd ?? start);
    const sep = before && !/\s$/.test(before) ? " " : "";
    ta.value = before + sep + snippet + after;
    const pos = (before + sep + snippet).length;
    ta.focus();
    ta.setSelectionRange(pos, pos);
    state[stateKey][field] = ta.value;
    save();
    // refresh counters
    if (stateKey === "decision") updateCount("#decisionCount", ta.value, 18);
    if (stateKey === "news") updateCount("#newsCount", ta.value, 35);
  }
  function awardXp(label) { toast("⭐ " + label, "xp"); }
  function clamp(n) { return Math.max(0, Math.min(100, n)); }
  function escapeHtml(s) { return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])); }
  function escapeAttr(s) { return escapeHtml(s); }

  /* ============================ GLOBAL WIRING ============================ */
  function wireNavButtons() {
    $$("[data-nav]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const target = btn.dataset.nav;
        // render target screen content before showing
        if (target === "briefing") renderBriefing();
        if (target === "datalab") { renderSort(); renderCalc(); }
        if (target === "graph") renderGraph();
        if (target === "decision") renderDecision();
        if (target === "news") renderNews();
        go(target);
      });
    });
  }

  function init() {
    renderProgress();
    buildVocab();
    initEnter();
    wireNavButtons();

    // data lab
    $("#checkSortBtn").addEventListener("click", checkSort);
    $("#resetSortBtn").addEventListener("click", () => { state.sort.tray = []; state.sort.solved = false; save(); renderSort(); setFeedback($("#sortFeedback"), "", ""); });

    // graph
    $("#checkGraphBtn").addEventListener("click", checkGraph);
    $("#resetGraphBtn").addEventListener("click", () => { state.graph.bars = [0, 0, 0, 0]; state.graph.solved = false; save(); renderGraph(); setFeedback($("#graphFeedback"), "", ""); });
    $("#checkInterpBtn").addEventListener("click", checkInterp);

    // decision / news / passport
    initDecision();
    initNews();
    initPassport();

    // modals
    $("#vocabOpenBtn").addEventListener("click", () => openVocab());
    $("#vocabClose").addEventListener("click", () => hideModal("#vocabModal"));
    $("#teacherBtn").addEventListener("click", openTeacher);
    $("#teacherClose").addEventListener("click", () => hideModal("#teacherModal"));
    $$(".modal").forEach((m) => m.addEventListener("click", (e) => { if (e.target === m) hideModal("#" + m.id); }));
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") $$(".modal").forEach((m) => { if (!m.hidden) hideModal("#" + m.id); });
      if (e.shiftKey && (e.key === "T" || e.key === "t") && !/input|textarea/i.test(document.activeElement.tagName)) openTeacher();
    });

    // build dynamic content for current screen + restore
    renderBriefing();
    renderSort();
    renderCalc();
    renderGraph();
    renderDecision();
    renderNews();

    // resume on last screen
    go(state.current || "enter");
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
