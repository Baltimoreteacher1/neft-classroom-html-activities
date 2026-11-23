// Sheet & Card Maker: the six printable templates (access-teacher/maker/sheets.js).
// Pure functions. Each takes the picked words plus the maker state and returns
//   { pages: [{ body, head?: false, cards?: true }], key: [{ body }], notes: [string] }
// maker.js wraps every page in the fixed-size paper frame, so what the teacher sees is what prints.

export const TEMPLATES = [
  {
    id: "wordsearch",
    name: "Word Search",
    blurb: "Hidden words in a letter grid",
    max: 16,
    def: 8,
  },
  { id: "crossword", name: "Crossword", blurb: "Fill the grid from clues", max: 14, def: 8 },
  { id: "matching", name: "Matching", blurb: "Join each word to its meaning", max: 12, def: 8 },
  { id: "scramble", name: "Word Scramble", blurb: "Unscramble and spell", max: 12, def: 8 },
  { id: "tracer", name: "Handwriting", blurb: "Trace, then write (K–2)", max: 8, def: 6 },
  {
    id: "flashcards",
    name: "Flashcards",
    blurb: "Cut-out bilingual cards + SVO mat",
    max: 24,
    def: 8,
  },
];

export const esc = (s) =>
  String(s ?? "").replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c],
  );

export function seededRng(seed) {
  let s = seed >>> 0 || 1;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

export function shuffle(list, rng) {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const letters = (w) =>
  String(w || "")
    .toUpperCase()
    .replace(/[^A-Z]/g, "");
const reEsc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** A clue must not contain the word it defines ("compare: to compare two things"). */
export function maskClue(clue, en) {
  if (!clue || !en) return clue || "";
  const word = en.trim();
  const stem = word.replace(/(ing|ed|es|s|e|y)$/i, "");
  const base = stem.length >= 3 ? stem : word;
  return clue.replace(new RegExp(`\\b${reEsc(base)}\\w*`, "gi"), "_____");
}

const esHelp = (s) => s.lang !== "en";
const gloss = (w, s) =>
  esHelp(s) && w.es && w.es !== w.en ? ` <em class="mk-es">(${esc(w.es)})</em>` : "";

/* ── word search ─────────────────────────────────────────────────────────── */

function buildSearchGrid(items, s) {
  const longest = Math.max(...items.map((w) => w.clean.length), 8);
  const total = items.reduce((n, w) => n + w.clean.length, 0);
  let size = Math.min(16, Math.max(10, longest + 1, Math.ceil(Math.sqrt(total * 2))));
  const dirs = s.diagonals
    ? [
        [0, 1],
        [1, 0],
        [1, 1],
        [-1, 1],
      ]
    : [
        [0, 1],
        [1, 0],
      ];
  let best = null;
  for (let attempt = 0; attempt < 10; attempt++) {
    if (attempt > 0 && attempt % 3 === 0) size = Math.min(16, size + 1);
    const rng = seededRng(s.seed * 104729 + attempt * 7919);
    const grid = Array.from({ length: size }, () => Array(size).fill(""));
    const keyCells = new Set();
    const placed = [];
    for (const w of [...items].sort((a, b) => b.clean.length - a.clean.length)) {
      for (let tries = 0; tries < 300; tries++) {
        const [dr, dc] = dirs[Math.floor(rng() * dirs.length)];
        const r0 = Math.floor(rng() * size);
        const c0 = Math.floor(rng() * size);
        const rEnd = r0 + dr * (w.clean.length - 1);
        const cEnd = c0 + dc * (w.clean.length - 1);
        if (rEnd < 0 || rEnd >= size || cEnd < 0 || cEnd >= size) continue;
        let ok = true;
        for (let i = 0; i < w.clean.length && ok; i++) {
          const ch = grid[r0 + dr * i][c0 + dc * i];
          if (ch && ch !== w.clean[i]) ok = false;
        }
        if (!ok) continue;
        for (let i = 0; i < w.clean.length; i++) {
          grid[r0 + dr * i][c0 + dc * i] = w.clean[i];
          keyCells.add(`${r0 + dr * i},${c0 + dc * i}`);
        }
        placed.push(w);
        break;
      }
    }
    if (!best || placed.length > best.placed.length) best = { grid, keyCells, placed, size, rng };
    if (placed.length === items.length) break;
  }
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  for (let r = 0; r < best.size; r++)
    for (let c = 0; c < best.size; c++)
      if (!best.grid[r][c]) best.grid[r][c] = alphabet[Math.floor(best.rng() * 26)];
  return best;
}

function wordSearch(words, s) {
  const all = words.map((w) => ({ ...w, clean: letters(w.en) }));
  const items = all.filter((w) => w.clean.length >= 2 && w.clean.length <= 14);
  const notes = [];
  if (all.length > items.length)
    notes.push(`${all.length - items.length} word(s) skipped: a word search needs 2–14 letters.`);
  if (!items.length)
    return {
      pages: [
        { body: `<p class="mk-empty">Add words with 2–14 letters to build a word search.</p>` },
      ],
      key: [],
      notes,
    };
  const g = buildSearchGrid(items, s);
  if (g.placed.length < items.length)
    notes.push(
      `${items.length - g.placed.length} word(s) did not fit. Press Shuffle or lower the word count.`,
    );
  const cells = (key) =>
    g.grid
      .flatMap((row, r) =>
        row.map(
          (ch, c) =>
            `<span class="mk-ws-cell${key && g.keyCells.has(`${r},${c}`) ? " is-key" : ""}">${ch}</span>`,
        ),
      )
      .join("");
  const bank = g.placed
    .sort((a, b) => a.en.localeCompare(b.en))
    .map(
      (w) =>
        `<li><span class="mk-chk" aria-hidden="true"></span><strong>${esc(w.en)}</strong>${gloss(w, s)}</li>`,
    )
    .join("");
  const body = `<p class="mk-instr">Find each word hidden in the grid.${s.diagonals ? " Words can go across, down, and diagonally." : " Words go across and down."}</p>
    <div class="mk-ws" style="--n:${g.size}" role="img" aria-label="Word search grid, ${g.size} by ${g.size}">${cells(false)}</div>
    <h3 class="mk-sub">Word Bank</h3>
    <ul class="mk-bank">${bank}</ul>`;
  const key = `<p class="mk-instr">Hidden words are shaded.</p><div class="mk-ws" style="--n:${g.size}">${cells(true)}</div>`;
  return { pages: [{ body }], key: [{ body: key }], notes };
}

/* ── crossword ───────────────────────────────────────────────────────────── */

function layoutCrossword(list, s, attempt) {
  const G = 15;
  const rng = seededRng(s.seed * 131 + attempt * 977 + 3);
  const grid = Array.from({ length: G }, () => Array(G).fill(""));
  const used = Array.from({ length: G }, () => Array(G).fill(0)); // bit 1 = across, 2 = down
  const placed = [];
  const order =
    attempt === 0
      ? [...list].sort((a, b) => b.clean.length - a.clean.length)
      : shuffle(list, rng).sort((a, b) => b.clean.length - a.clean.length + (rng() - 0.5) * 4);
  const empty = (r, c) => r < 0 || c < 0 || r >= G || c >= G || !grid[r][c];
  const fits = (w, r, c, dir) => {
    const dr = dir === "down" ? 1 : 0;
    const dc = dir === "across" ? 1 : 0;
    const bit = dir === "across" ? 1 : 2;
    const len = w.clean.length;
    if (r < 0 || c < 0 || r + dr * (len - 1) >= G || c + dc * (len - 1) >= G) return -1;
    if (!empty(r - dr, c - dc) || !empty(r + dr * len, c + dc * len)) return -1;
    let cross = 0;
    for (let k = 0; k < len; k++) {
      const rr = r + dr * k;
      const cc = c + dc * k;
      if (grid[rr][cc]) {
        if (grid[rr][cc] !== w.clean[k] || used[rr][cc] & bit) return -1;
        cross++;
      } else if (!empty(rr + dc, cc + dr) || !empty(rr - dc, cc - dr)) return -1;
    }
    return cross;
  };
  const put = (w, r, c, dir) => {
    const dr = dir === "down" ? 1 : 0;
    const dc = dir === "across" ? 1 : 0;
    for (let k = 0; k < w.clean.length; k++) {
      grid[r + dr * k][c + dc * k] = w.clean[k];
      used[r + dr * k][c + dc * k] |= dir === "across" ? 1 : 2;
    }
    placed.push({ ...w, r, c, dir });
  };
  order.forEach((w, i) => {
    if (i === 0)
      return put(w, Math.floor(G / 2), Math.max(0, Math.floor((G - w.clean.length) / 2)), "across");
    const options = [];
    for (let r = 0; r < G; r++) {
      for (let c = 0; c < G; c++) {
        if (!grid[r][c]) continue;
        for (let k = 0; k < w.clean.length; k++) {
          if (w.clean[k] !== grid[r][c]) continue;
          for (const dir of ["across", "down"]) {
            const sr = dir === "down" ? r - k : r;
            const sc = dir === "across" ? c - k : c;
            const cross = fits(w, sr, sc, dir);
            if (cross > 0) options.push({ sr, sc, dir, cross });
          }
        }
      }
    }
    if (!options.length) return;
    const top = Math.max(...options.map((o) => o.cross));
    const pool = options.filter((o) => o.cross === top);
    const pick = pool[Math.floor(rng() * pool.length)];
    put(w, pick.sr, pick.sc, pick.dir);
  });
  return { grid, placed };
}

function crossword(words, s) {
  const all = words.map((w) => ({ ...w, clean: letters(w.en) }));
  const list = all.filter((w) => w.clean.length >= 3 && w.clean.length <= 13);
  const notes = [];
  if (all.length > list.length)
    notes.push(`${all.length - list.length} word(s) skipped: crossword words need 3–13 letters.`);
  if (!list.length)
    return {
      pages: [
        { body: `<p class="mk-empty">Add words with 3–13 letters to build a crossword.</p>` },
      ],
      key: [],
      notes,
    };
  let best = null;
  for (let a = 0; a < 160; a++) {
    const cand = layoutCrossword(list, s, a);
    if (!best || cand.placed.length > best.placed.length) best = cand;
    if (best.placed.length === list.length) break;
  }
  if (best.placed.length < list.length)
    notes.push(
      `${list.length - best.placed.length} word(s) did not fit the crossing pattern. Press Shuffle or lower the word count.`,
    );
  const { grid, placed } = best;
  let r0 = 99,
    r1 = -1,
    c0 = 99,
    c1 = -1;
  grid.forEach((row, r) =>
    row.forEach((ch, c) => {
      if (ch) {
        r0 = Math.min(r0, r);
        r1 = Math.max(r1, r);
        c0 = Math.min(c0, c);
        c1 = Math.max(c1, c);
      }
    }),
  );
  const rows = r1 - r0 + 1;
  const cols = c1 - c0 + 1;
  const starts = new Map();
  placed.forEach((p) => starts.set(`${p.r},${p.c}`, null));
  let n = 0;
  for (let r = r0; r <= r1; r++)
    for (let c = c0; c <= c1; c++) if (starts.has(`${r},${c}`)) starts.set(`${r},${c}`, ++n);
  placed.forEach((p) => (p.num = starts.get(`${p.r},${p.c}`)));
  const cells = (key) => {
    const out = [];
    for (let r = r0; r <= r1; r++) {
      for (let c = c0; c <= c1; c++) {
        const ch = grid[r][c];
        const num = starts.get(`${r},${c}`);
        out.push(
          ch
            ? `<span class="mk-cw-cell">${num ? `<i>${num}</i>` : ""}${key ? ch : ""}</span>`
            : `<span class="mk-cw-gap"></span>`,
        );
      }
    }
    return out.join("");
  };
  const clues = (dir) =>
    placed
      .filter((p) => p.dir === dir)
      .sort((a, b) => a.num - b.num)
      .map(
        (p) =>
          `<li><strong>${p.num}.</strong> ${esc(maskClue(p.clue, p.en))}${gloss(p, s)} <span class="mk-len">(${p.clean.length})</span></li>`,
      )
      .join("") || "<li>—</li>";
  const wrap = (key) =>
    `<div class="mk-cw" style="--cols:${cols};--rows:${rows}" role="img" aria-label="Crossword grid, ${cols} by ${rows}">${cells(key)}</div>`;
  const body = `<p class="mk-instr">Use the clues to fill in the interlocking crossword.</p>${wrap(false)}
    <div class="mk-two"><div><h3 class="mk-sub">Across</h3><ul class="mk-clues">${clues("across")}</ul></div>
    <div><h3 class="mk-sub">Down</h3><ul class="mk-clues">${clues("down")}</ul></div></div>`;
  return {
    pages: [{ body }],
    key: [{ body: `<p class="mk-instr">Completed crossword.</p>${wrap(true)}` }],
    notes,
  };
}

/* ── matching ────────────────────────────────────────────────────────────── */

function matching(words, s) {
  const rng = seededRng(s.seed * 313);
  let right = shuffle(words, rng);
  if (words.length > 1 && right.every((w, i) => w === words[i]))
    right = [...right.slice(1), right[0]];
  const side = (w) => `${esc(maskClue(w.clue, w.en))}${gloss(w, s)}`;
  const rows = words
    .map(
      (w, i) => `<div class="mk-mrow">
        <div class="mk-mL"><strong>${i + 1}.</strong> ${esc(w.en)}</div><i class="mk-dot"></i><span></span><i class="mk-dot"></i>
        <div class="mk-mR"><strong>${String.fromCharCode(65 + i)}.</strong> ${side(right[i])}</div></div>`,
    )
    .join("");
  const body = `<p class="mk-instr">Draw a line to match each word to its meaning${esHelp(s) ? " or Spanish equivalent" : ""}.</p><div class="mk-match">${rows}</div>`;
  const keyText = words
    .map((w, i) => `${i + 1} → ${String.fromCharCode(65 + right.indexOf(w))}`)
    .join("&nbsp;&nbsp;·&nbsp;&nbsp;");
  return {
    pages: [{ body }],
    key: [{ body: `<p class="mk-instr">Matches</p><p class="mk-keyline">${keyText}</p>` }],
    notes: [],
  };
}

/* ── scramble ────────────────────────────────────────────────────────────── */

function scramble(words, s) {
  const rng = seededRng(s.seed * 997);
  const scrambled = (word) => {
    for (let t = 0; t < 12; t++) {
      const out = shuffle(word.split(""), rng).join("");
      if (out !== word || word.length < 2) return out.toUpperCase();
    }
    return word.toUpperCase();
  };
  const rowOf = (w, i, key) => {
    const clean = w.en.replace(/\s+/g, "");
    const boxes = clean
      .split("")
      .map((ch) => `<span class="mk-box">${key ? esc(ch.toUpperCase()) : ""}</span>`)
      .join("");
    return `<div class="mk-srow"><span class="mk-snum">${i + 1}.</span>
      <div class="mk-sword">${key ? esc(clean.toUpperCase()) : esc(scrambled(clean))}
        <small>${esc(maskClue(w.clue, w.en))}${esHelp(s) && w.es ? ` · ${esc(w.es)}` : ""}</small></div>
      <div class="mk-boxes">${boxes}</div></div>`;
  };
  const rows = words.map((w, i) => rowOf(w, i, false));
  const first = 8;
  const rest = 10;
  const pages = [
    {
      body: `<p class="mk-instr">Unscramble the letters to spell each vocabulary word.</p><div class="mk-slist">${rows.slice(0, first).join("")}</div>`,
    },
  ];
  for (let i = first; i < rows.length; i += rest)
    pages.push({ body: `<div class="mk-slist">${rows.slice(i, i + rest).join("")}</div>` });
  const keyRows = words
    .map((w, i) => `<div class="mk-krow"><span class="mk-snum">${i + 1}.</span><div class="mk-boxes">${w.en.replace(/\s+/g, "").split("").map((ch) => `<span class="mk-box">${esc(ch.toUpperCase())}</span>`).join("")}</div></div>`)
    .join("");
  return { pages, key: [{ body: `<p class="mk-instr">Correct spellings.</p><div class="mk-kgrid">${keyRows}</div>` }], notes: [] };
}

/* ── handwriting tracer ──────────────────────────────────────────────────── */

let measureCtx;
function textWidth(text, size) {
  try {
    measureCtx ||= document.createElement("canvas").getContext("2d");
    measureCtx.font = `${size}px "Atkinson Hyperlegible", system-ui, sans-serif`;
    return measureCtx.measureText(text).width;
  } catch {
    return text.length * size * 0.56;
  }
}

function tracer(words, s) {
  const primary = ["K", "1", "2-3"].includes(s.band);
  const fs = primary ? 52 : 40;
  const H = primary ? 92 : 78;
  const W = 700;
  const base = H - 16;
  const mid = base - fs * 0.52;
  const top = base - fs * 0.74;
  const rowsHtml = words.slice(0, 8).map((w) => {
    const text = w.en;
    const tw = textWidth(text, fs);
    let x = 10;
    const shown = [`<text x="${x}" y="${base}" font-size="${fs}" fill="#1c1c1a">${esc(text)}</text>`];
    x += tw + 28;
    for (let t = 0; t < 2 && x + tw + 150 <= W; t++) {
      shown.push(`<text x="${x}" y="${base}" font-size="${fs}" fill="none" stroke="#6b6b64" stroke-width="1.1" stroke-dasharray="3 3">${esc(text)}</text>`);
      x += tw + 28;
    }
    const hint = esHelp(s) && w.es ? `<text x="${W - 6}" y="${top - 5}" font-size="13" text-anchor="end" fill="#3d3d3a">${esc(w.es)}</text>` : "";
    return `<svg class="mk-trace" viewBox="0 0 ${W} ${H}" role="img" aria-label="Tracing row for ${esc(text)}">
      <line x1="0" y1="${top}" x2="${W}" y2="${top}" stroke="#a9a79b" stroke-width="1"/>
      <line x1="0" y1="${mid}" x2="${W}" y2="${mid}" stroke="#a9a79b" stroke-width="1" stroke-dasharray="5 5"/>
      <line x1="0" y1="${base}" x2="${W}" y2="${base}" stroke="#2b2b28" stroke-width="1.6"/>${shown.join("")}${hint}</svg>`;
  });
  const notes = words.length > 8 ? ["Handwriting sheets hold up to 8 words per page."] : [];
  const body = `<p class="mk-instr">Trace each word carefully on the primary writing lines, then write it once on your own.</p><div class="mk-tracer">${rowsHtml.join("")}</div>`;
  return { pages: [{ body }], key: [], notes };
}

/* ── flashcards + SVO mat ────────────────────────────────────────────────── */

const LAYOUTS = { 6: [2, 3], 8: [2, 4], 9: [3, 3] };

function flashcards(words, s) {
  const [cols, rows] = LAYOUTS[s.cardsPerPage] || LAYOUTS[8];
  const per = cols * rows;
  const duplex = s.cardMode === "duplex";
  const icon = (w) => (w.icon ? `<span class="mk-card-ic" aria-hidden="true">${esc(w.icon)}</span>` : "");
  const extra = (w) => w.pic ? "" : `<small class="mk-c-def">${esc(w.clue)}</small>${w.example ? `<small class="mk-c-ex">“${esc(w.example)}”</small>` : ""}`;
  const single = (w) => `<div class="mk-card">${icon(w)}<strong class="mk-c-en">${esc(w.en)}</strong><span class="mk-c-es">${esc(w.es)}</span>${extra(w)}</div>`;
  const front = (w) => `<div class="mk-card is-front">${icon(w)}<strong class="mk-c-en">${esc(w.en)}</strong></div>`;
  const back = (w) => `<div class="mk-card"><span class="mk-c-es">${esc(w.es)}</span>${extra(w)}</div>`;
  const grid = (cards) => `<div class="mk-cards" style="--cols:${cols};--rows:${rows}">${cards.join("")}</div>`;
  const pad = (list) => [...list, ...Array(per - list.length).fill(`<div class="mk-card is-blank"></div>`)];
  const pages = [];
  for (let i = 0; i < words.length; i += per) {
    const chunk = words.slice(i, i + per);
    const note = duplex ? "Print double-sided, flip on the long edge. Cut on the dashed lines." : "Cut on the dashed lines. Practice with the SVO Sentence Frame desk mat on the last page.";
    pages.push({ cards: true, body: `<p class="mk-cut-note">${note}</p>${grid(pad(chunk.map(duplex ? front : single)))}` });
    if (duplex) {
      const backs = pad(chunk.map(back));
      const mirrored = [];
      for (let r = 0; r < rows; r++) mirrored.push(...backs.slice(r * cols, r * cols + cols).reverse());
      pages.push({ cards: true, body: `<p class="mk-cut-note">Back sides. Spanish and meaning.</p>${grid(mirrored)}` });
    }
  }
  if (s.svo !== false) {
    const w0 = esc(words[0]?.en || "evidence");
    pages.push({
      body: `<h3 class="mk-sub">SVO Sentence Frame Desk Mat</h3>
      <div class="mk-svo-cols">
        <div class="mk-svo-col"><strong>Subject (Who / What)</strong><span>The scientist / Our group / I</span><i></i><i></i><i></i></div>
        <div class="mk-svo-col"><strong>Verb (Action)</strong><span>observes / compares / explains</span><i></i><i></i><i></i></div>
        <div class="mk-svo-col"><strong>Object / Evidence</strong><span>${w0} because…</span><i></i><i></i><i></i></div>
      </div>
      <p class="mk-instr">Build a sentence with one card word. Say it out loud, then write it.</p>
      <div class="mk-strip"><span>Subject</span><span>Verb</span><span>Object</span><span>because</span></div>
      <div class="mk-write"><i></i><i></i><i></i></div>`,
    });
  }
  return { pages, key: [], notes: [] };
}

export function buildSheet(words, s) {
  switch (s.template) {
    case "crossword":
      return crossword(words, s);
    case "matching":
      return matching(words, s);
    case "scramble":
      return scramble(words, s);
    case "tracer":
      return tracer(words, s);
    case "flashcards":
      return flashcards(words, s);
    default:
      return wordSearch(words, s);
  }
}
