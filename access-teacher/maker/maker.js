// Language Sheet & Card Maker (access-teacher/maker/maker.js)
// Client-side worksheet & flashcard generator using Word Lab (755 words),
// Survival Vocabulary (144 words), or custom English | Spanish | Clue lists.

import { WORDS } from "/access-practice-lab/src/content/wordlab-words.js";
import { SURVIVAL_TOPICS } from "/access-practice-lab/src/packs/survival-vocabulary.js";

const $ = (id) => document.getElementById(id);

const state = {
  source: "wordlab",
  band: "3-5",
  template: "wordsearch",
  title: "Academic Vocabulary Practice",
  count: 8,
  diagonals: false,
  showKey: false,
  lang: "en",
  seed: 1,
};

const esc = (s) =>
  String(s || "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

function seededRng(seed) {
  let s = seed >>> 0 || 1;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function getWordPool() {
  if (state.source === "custom") {
    const lines = ($("mkCustomText")?.value || "").split("\n").map((l) => l.trim()).filter(Boolean);
    return lines.map((line) => {
      const [en = "", es = "", clue = ""] = line.split("|").map((p) => p.trim());
      return { en, es: es || en, clue: clue || es || en };
    }).filter((w) => w.en);
  }
  if (state.source === "survival") {
    return SURVIVAL_TOPICS.flatMap((t) =>
      t.words.map(([en, es]) => ({
        en,
        es,
        clue: `${t.title[0]} (${es})`,
      })),
    );
  }
  const bandMatch = state.band === "6-8" ? "6-8" : "3-5";
  return WORDS.filter((w) => w.b === bandMatch || w.b === "both").map((w) => ({
    en: w.w,
    es: w.e || w.w,
    clue: state.lang === "es" ? (w.de || w.d) : (w.d || w.de),
  }));
}

function pickWords() {
  const pool = getWordPool();
  const rng = seededRng(state.seed * 7919 + state.count);
  const copy = [...pool];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, state.count);
}

function renderWordSearch(words) {
  const cleanWords = words.map((w) => ({ ...w, clean: w.en.toUpperCase().replace(/[^A-Z]/g, "") })).filter((w) => w.clean.length >= 2 && w.clean.length <= 12);
  const size = Math.max(10, Math.min(14, Math.max(...cleanWords.map((w) => w.clean.length), 10) + 2));
  const grid = Array.from({ length: size }, () => Array(size).fill(""));
  const keyCells = new Set();
  const rng = seededRng(state.seed * 104729);
  const dirs = state.diagonals ? [[0, 1], [1, 0], [1, 1], [-1, 1]] : [[0, 1], [1, 0]];

  for (const w of cleanWords) {
    let placed = false;
    for (let tries = 0; tries < 80 && !placed; tries++) {
      const [dr, dc] = dirs[Math.floor(rng() * dirs.length)];
      const r0 = Math.floor(rng() * size);
      const c0 = Math.floor(rng() * size);
      const rEnd = r0 + dr * (w.clean.length - 1);
      const cEnd = c0 + dc * (w.clean.length - 1);
      if (rEnd < 0 || rEnd >= size || cEnd < 0 || cEnd >= size) continue;
      let ok = true;
      for (let i = 0; i < w.clean.length; i++) {
        const ch = grid[r0 + dr * i][c0 + dc * i];
        if (ch && ch !== w.clean[i]) { ok = false; break; }
      }
      if (!ok) continue;
      for (let i = 0; i < w.clean.length; i++) {
        const rr = r0 + dr * i;
        const cc = c0 + dc * i;
        grid[rr][cc] = w.clean[i];
        keyCells.add(`${rr},${cc}`);
      }
      placed = true;
    }
  }
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (!grid[r][c]) grid[r][c] = letters[Math.floor(rng() * letters.length)];
    }
  }
  const cellsHTML = grid.flatMap((row, r) =>
    row.map((ch, c) => `<div class="mk-ws-cell${state.showKey && keyCells.has(`${r},${c}`) ? " is-key" : ""}">${ch}</div>`),
  ).join("");
  const bankHTML = words.map((w) => `<li><strong>${esc(w.en)}</strong>${state.lang !== "en" ? ` (${esc(w.es)})` : ""}</li>`).join("");
  return `<p>Find each word hidden in the grid.</p>
    <div class="mk-ws-grid" style="grid-template-columns:repeat(${size}, 32px);" role="img" aria-label="Word search grid">${cellsHTML}</div>
    <h3>Word Bank</h3>
    <ul style="columns:2;gap:1.5rem;">${bankHTML}</ul>`;
}

function renderCrossword(words) {
  const list = words.map((w) => ({ ...w, clean: w.en.toUpperCase().replace(/[^A-Z]/g, "") })).filter((w) => w.clean.length >= 2 && w.clean.length <= 12);
  const size = 14;
  const grid = Array.from({ length: size }, () => Array(size).fill(""));
  const placed = [];

  if (list.length) {
    const first = list[0];
    const r0 = Math.floor(size / 2);
    const c0 = Math.max(0, Math.floor((size - first.clean.length) / 2));
    for (let i = 0; i < first.clean.length && c0 + i < size; i++) grid[r0][c0 + i] = first.clean[i];
    placed.push({ ...first, r: r0, c: c0, dir: "across", num: 1 });
  }

  for (let idx = 1; idx < list.length; idx++) {
    const w = list[idx];
    let done = false;
    for (let r = 0; r < size && !done; r++) {
      for (let c = 0; c < size && !done; c++) {
        const ch = grid[r][c];
        if (!ch) continue;
        const pos = w.clean.indexOf(ch);
        if (pos < 0) continue;
        for (const dir of ["down", "across"]) {
          const dr = dir === "down" ? 1 : 0;
          const dc = dir === "across" ? 1 : 0;
          const sr = r - dr * pos;
          const sc = c - dc * pos;
          if (sr < 0 || sc < 0 || sr + dr * (w.clean.length - 1) >= size || sc + dc * (w.clean.length - 1) >= size) continue;
          let fits = true;
          for (let k = 0; k < w.clean.length; k++) {
            const rr = sr + dr * k;
            const cc = sc + dc * k;
            if (grid[rr][cc] && grid[rr][cc] !== w.clean[k]) { fits = false; break; }
          }
          if (!fits) continue;
          for (let k = 0; k < w.clean.length; k++) grid[sr + dr * k][sc + dc * k] = w.clean[k];
          placed.push({ ...w, r: sr, c: sc, dir, num: placed.length + 1 });
          done = true;
          break;
        }
      }
    }
  }

  const numMap = new Map(placed.map((p) => [`${p.r},${p.c}`, p.num]));
  const cells = [];
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const ch = grid[r][c];
      const n = numMap.get(`${r},${c}`);
      if (!ch) cells.push(`<div class="mk-cw-cell is-block"></div>`);
      else cells.push(`<div class="mk-cw-cell">${n ? `<span class="mk-cw-num">${n}</span>` : ""}${state.showKey ? ch : ""}</div>`);
    }
  }
  const across = placed.filter((p) => p.dir === "across").map((p) => `<li><strong>${p.num}.</strong> ${esc(p.clue)}${state.lang !== "en" ? ` <em>(${esc(p.es)})</em>` : ""}</li>`).join("");
  const down = placed.filter((p) => p.dir === "down").map((p) => `<li><strong>${p.num}.</strong> ${esc(p.clue)}${state.lang !== "en" ? ` <em>(${esc(p.es)})</em>` : ""}</li>`).join("");

  return `<p>Use the clues to fill in the interlocking crossword.</p>
    <div class="mk-cw-grid" style="grid-template-columns:repeat(${size}, 34px);">${cells.join("")}</div>
    <div class="mk-match-cols">
      <div><h3>Across</h3><ul>${across || "<li>—</li>"}</ul></div>
      <div><h3>Down</h3><ul>${down || "<li>—</li>"}</ul></div>
    </div>`;
}

function renderMatching(words) {
  const rng = seededRng(state.seed * 313);
  const clues = [...words].sort(() => rng() - 0.5);
  return `<p>Draw a line to match each word to its meaning${state.lang !== "en" ? " or Spanish equivalent" : ""}.</p>
    <div class="mk-match-cols">
      <ul class="mk-match-list">${words.map((w, i) => `<li class="mk-match-item"><span><strong>${i + 1}.</strong> ${esc(w.en)}</span><span>○</span></li>`).join("")}</ul>
      <ul class="mk-match-list">${clues.map((w, i) => `<li class="mk-match-item"><span>○</span><span><strong>${String.fromCharCode(65 + i)}.</strong> ${esc(w.clue)}${state.lang !== "en" ? ` (${esc(w.es)})` : ""}</span></li>`).join("")}</ul>
    </div>
    ${state.showKey ? `<p style="margin-top:1rem;"><strong>Answer Key:</strong> ${words.map((w, i) => `${i + 1}→${String.fromCharCode(65 + clues.indexOf(w))}`).join(", ")}</p>` : ""}`;
}

function renderScramble(words) {
  const rng = seededRng(state.seed * 997);
  const scrambleWord = (word) => {
    const arr = word.split("");
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr.join("").toUpperCase();
  };
  return `<p>Unscramble the letters to spell each vocabulary word.</p>
    <div class="mk-scramble-list">${words.map((w, i) => {
      const clean = w.en.replace(/\s+/g, "");
      const boxes = clean.split("").map((ch) => `<span class="mk-box">${state.showKey ? ch.toUpperCase() : ""}</span>`).join("");
      return `<div class="mk-scramble-row">
        <div><strong>${i + 1}. ${esc(scrambleWord(clean))}</strong><br><small>${esc(w.clue)}${state.lang !== "en" ? ` · ${esc(w.es)}` : ""}</small></div>
        <div class="mk-boxes">${boxes}</div>
      </div>`;
    }).join("")}</div>`;
}

function renderTracer(words) {
  return `<p>Trace each word carefully on the primary writing lines, then write it once on your own.</p>
    <div class="mk-tracer-rows">${words.slice(0, 6).map((w) => `
      <svg viewBox="0 0 640 72" width="100%" height="72" role="img" aria-label="Tracing row for ${esc(w.en)}">
        <line x1="0" y1="14" x2="640" y2="14" stroke="#17324d" stroke-width="1.5"/>
        <line x1="0" y1="36" x2="640" y2="36" stroke="#1fa6a2" stroke-width="1.5" stroke-dasharray="6 6"/>
        <line x1="0" y1="58" x2="640" y2="58" stroke="#17324d" stroke-width="2"/>
        <text x="16" y="52" font-size="38" font-family="sans-serif" fill="none" stroke="#64748b" stroke-width="1.4" stroke-dasharray="3 3">${esc(w.en)}</text>
        <text x="260" y="52" font-size="38" font-family="sans-serif" fill="none" stroke="#cbd5e1" stroke-width="1.2" stroke-dasharray="3 3">${esc(w.en)}</text>
      </svg>`).join("")}
    </div>`;
}

function renderFlashcards(words) {
  return `<p>Cut along the dashed lines to make bilingual flashcards, and use the SVO Sentence Frame mat below.</p>
    <div class="mk-cards-grid">${words.map((w) => `
      <div class="mk-card-cut">
        <strong style="font-size:1.15rem;color:#17324d;">${esc(w.en)}</strong>
        <span style="color:#075568;font-weight:600;">${esc(w.es)}</span>
        <small style="color:#24323f;">${esc(w.clue)}</small>
      </div>`).join("")}
    </div>
    <div class="mk-svo-mat">
      <h3 style="margin:0;">SVO Sentence Frame Desk Mat</h3>
      <div class="mk-svo-cols">
        <div class="mk-svo-col"><strong>Subject (Who/What)</strong><br>The scientist / I / We</div>
        <div class="mk-svo-col"><strong>Verb (Action)</strong><br>uses / explains / compares</div>
        <div class="mk-svo-col"><strong>Object / Evidence</strong><br>${esc(words[0]?.en || "evidence")} to show…</div>
      </div>
    </div>`;
}

function render() {
  const words = pickWords();
  const body =
    state.template === "crossword" ? renderCrossword(words)
    : state.template === "matching" ? renderMatching(words)
    : state.template === "scramble" ? renderScramble(words)
    : state.template === "tracer" ? renderTracer(words)
    : state.template === "flashcards" ? renderFlashcards(words)
    : renderWordSearch(words);

  $("mkPreview").innerHTML = `
    <div class="mk-sheet-header">
      <div>
        <h2 style="margin:0;color:#17324d;">${esc(state.title)}</h2>
        <p style="margin:.25rem 0 0;color:#475569;">Grade Band: ${esc(state.band)} · ACCESS Practice Lab</p>
      </div>
      <div class="mk-name-line">Name: ______________________ Date: __________</div>
    </div>
    ${body}`;
}

function launchInteractive() {
  const words = pickWords();
  const payload = { title: state.title, words };
  const json = JSON.stringify(payload);
  const b64 = btoa(unescape(encodeURIComponent(json))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  window.open(`/access-practice-lab/play?sheet=custom&grades=${encodeURIComponent(state.band === "6-8" ? "6-8" : "3-5")}#sheet=${b64}`, "_blank", "noopener");
}

$("mkSource")?.addEventListener("change", (e) => {
  state.source = e.target.value;
  $("mkCustomWrap").hidden = state.source !== "custom";
  render();
});
$("mkBand")?.addEventListener("change", (e) => { state.band = e.target.value; render(); });
$("mkTemplate")?.addEventListener("change", (e) => { state.template = e.target.value; render(); });
$("mkSheetTitle")?.addEventListener("input", (e) => { state.title = e.target.value; render(); });
$("mkCount")?.addEventListener("change", (e) => { state.count = Number(e.target.value) || 8; render(); });
$("mkDiagonals")?.addEventListener("change", (e) => { state.diagonals = e.target.checked; render(); });
$("mkShowKey")?.addEventListener("change", (e) => { state.showKey = e.target.checked; render(); });
$("mkCustomText")?.addEventListener("input", () => render());
$("mkGenerate")?.addEventListener("click", () => { state.seed += 1; render(); });
$("mkPrint")?.addEventListener("click", () => window.print());
$("mkLaunch")?.addEventListener("click", launchInteractive);

document.querySelectorAll("[data-mk-lang]").forEach((btn) => {
  btn.addEventListener("click", () => {
    state.lang = btn.dataset.mkLang;
    document.querySelectorAll("[data-mk-lang]").forEach((b) => b.setAttribute("aria-pressed", String(b === btn)));
    render();
  });
});

document.querySelector("[data-mk-comfort]")?.addEventListener("click", (e) => {
  const on = e.currentTarget.getAttribute("aria-pressed") !== "true";
  e.currentTarget.setAttribute("aria-pressed", String(on));
  document.documentElement.dataset.comfortTheme = on ? "calm" : "";
  document.documentElement.dataset.comfortMotion = on ? "calm" : "";
});

render();
