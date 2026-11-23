// Two games built from a grade's real unit data. No timers, no ranking: a wrong try gets a hint, never the answer.
//   Sentence Builder: put a unit's mentor-sentence chunks in order, then name the job each chunk does.
//   Cognate Match:    pair English and Spanish cognates; the grade's collection is kept on this device.

import { keepView } from "../keep-view.js";
import { $, announce, esc, seededShuffle, speak, store } from "./pathways-util.js";

const ROUND_SIZE = 5;
const stars = (n) => "★".repeat(n) + "☆".repeat(Math.max(0, 3 - n));

// ── Sentence Builder ────────────────────────────────────────────────────────

function newBuilder(puzzle, attempt = 0) {
  return {
    puzzle,
    pool: seededShuffle(
      puzzle.chunks.map((_, i) => i),
      `${puzzle.unit_id}:${attempt}`,
    ),
    tray: Array(puzzle.chunks.length).fill(null), // tray[position] = chunk index placed there, or null
    locked: new Set(), // tray positions already correct
    misses: 0,
    phase: "order",
    roles: {}, // chunk index -> chosen role
    roleMisses: 0,
    attempt,
  };
}

/** Which tray positions hold the chunk that belongs there (true order = original index). */
const correctPositions = (tray) => tray.map((chunkIdx, pos) => chunkIdx === pos);
const isFull = (tray) => tray.every((i) => i !== null);

function builderHtml(b) {
  const p = b.puzzle;
  const tile = (i, attrs, extra = "") => `<button type="button" class="pw-tile ${extra}" ${attrs}>${esc(p.chunks[i].text)}</button>`;
  const pool = b.pool.filter((i) => !b.tray.includes(i));
  const slots = p.chunks.map((_, pos) => {
    const idx = b.tray[pos];
    if (idx === null) return `<li class="pw-slot"><span class="pw-slot-n">${pos + 1}</span></li>`;
    const locked = b.locked.has(pos);
    return `<li class="pw-slot is-filled ${locked ? "is-locked" : ""}"><span class="pw-slot-n">${pos + 1}</span>${tile(idx, locked ? "disabled" : `data-unplace="${pos}"`, locked ? "is-correct" : "")}</li>`;
  });
  const full = isFull(b.tray);
  return `
    <p class="pw-small pw-muted">${esc(p.subject)} Unit ${esc(p.unit_number)}: ${esc(p.title)}</p>
    <p class="pw-prompt">Put the pieces in order to build the sentence.</p>
    <ol class="pw-tray" aria-label="Your sentence">${slots.join("")}</ol>
    <div class="pw-pool" role="group" aria-label="Sentence pieces">${pool.map((i) => tile(i, `data-place="${i}"`)).join("") || '<span class="pw-muted">All pieces are placed.</span>'}</div>
    <div class="pw-row">
      <button type="button" class="pw-btn is-primary" data-check ${full ? "" : "disabled"}>Check my sentence</button>
      ${"speechSynthesis" in window ? '<button type="button" class="pw-btn" data-hear>Hear it</button>' : ""}
      <button type="button" class="pw-btn" data-restart>Start over</button>
    </div>
    <p class="pw-feedback" id="pwFeedback" role="status"></p>`;
}

function rolesHtml(b) {
  const p = b.puzzle;
  const roleNames = [...new Set(p.chunks.map((c) => c.role))].sort();
  const rows = p.chunks.map((c, i) => {
    const chosen = b.roles[i];
    const ok = chosen === c.role;
    return `<li class="pw-role-row">
      <p class="pw-role-chunk">${esc(c.text)}</p>
      <div class="pw-role-opts" role="group" aria-label="What job does this piece do?">
        ${roleNames
          .map((r) => `<button type="button" class="pw-chip ${chosen === r ? (ok ? "is-correct" : "is-wrong") : ""}" data-role="${i}" data-value="${esc(r)}" aria-pressed="${chosen === r}" ${ok ? "disabled" : ""}>${esc(r)}</button>`)
          .join("")}
      </div>
      <p class="pw-small ${ok ? "pw-good" : "pw-hint"}">${ok ? "Yes. Talk about it: " : chosen ? "Not yet. Think: " : ""}${chosen || ok ? esc(c.question) : ""}</p>
    </li>`;
  });
  return `<p class="pw-good pw-prompt">Sentence built! <q>${esc(p.sentence)}</q></p>
    <p class="pw-prompt">Now name the job each piece does.</p><ol class="pw-roles">${rows.join("")}</ol>`;
}

function doneHtml(b, earned) {
  return `<p class="pw-good pw-prompt">Well done: ${stars(earned)}</p>
    <p>Say the sentence out loud with a partner, then switch one word to make it your own.</p>
    <div class="pw-row"><button type="button" class="pw-btn is-primary" data-next-puzzle>Next sentence</button></div>`;
}

function earnedStars(b) {
  return (b.misses === 0 ? 1 : 0) + (b.roleMisses === 0 ? 1 : 0) + 1; // completing both parts always earns the third
}

function renderBuilder(panel, ctx) {
  const b = ctx.builder;
  const body = b.phase === "order" ? builderHtml(b) : b.phase === "roles" ? rolesHtml(b) : doneHtml(b, earnedStars(b));
  const options = ctx.data.puzzles
    .map((p, i) => `<option value="${i}" ${i === ctx.puzzleIdx ? "selected" : ""}>${esc(p.subject)} · Unit ${esc(p.unit_number)}: ${esc(p.title)}</option>`)
    .join("");
  const best = store.read().stars[b.puzzle.unit_id] || 0;
  panel.querySelector("#pwGameBody").innerHTML = `
    <div class="pw-game-head">
      <label class="pw-select"><span>Sentence from</span><select data-puzzle-pick>${options}</select></label>
      <p class="pw-small pw-muted">Best: ${stars(best)}</p>
    </div>${body}`;
}

function builderClick(e, panel, ctx) {
  const b = ctx.builder;
  const feedback = (msg) => {
    const el = $("#pwFeedback", panel);
    if (el) el.textContent = msg;
    announce(msg);
  };
  const redraw = () => keepView(panel, () => renderBuilder(panel, ctx));
  const place = e.target.closest("[data-place]");
  if (place && !isFull(b.tray)) {
    b.tray[b.tray.indexOf(null)] = Number(place.dataset.place);
    return redraw();
  }
  const unplace = e.target.closest("[data-unplace]");
  if (unplace) {
    b.tray[Number(unplace.dataset.unplace)] = null;
    return redraw();
  }
  if (e.target.closest("[data-hear]")) {
    speak(b.tray.filter((i) => i !== null).map((i) => b.puzzle.chunks[i].text).join(" "));
    return;
  }
  if (e.target.closest("[data-restart]")) {
    ctx.builder = newBuilder(b.puzzle, b.attempt + 1);
    return redraw();
  }
  if (e.target.closest("[data-check]")) {
    const right = correctPositions(b.tray);
    if (right.every(Boolean)) {
      b.phase = "roles";
      announce("Sentence built. Now name the job of each piece.");
      return redraw();
    }
    b.misses += 1;
    right.forEach((ok, pos) => ok && b.locked.add(pos));
    // Wrong pieces go back to the pool; right ones stay locked in place.
    b.tray = b.tray.map((idx, pos) => (b.locked.has(pos) ? idx : null));
    redraw();
    return feedback(`${right.filter(Boolean).length} of ${right.length} pieces are in the right place and stay locked. Move the others.`);
  }
  const role = e.target.closest("[data-role]");
  if (role) {
    const i = Number(role.dataset.role);
    const value = role.dataset.value;
    b.roles[i] = value;
    if (value !== b.puzzle.chunks[i].role) b.roleMisses += 1;
    if (b.puzzle.chunks.every((c, k) => b.roles[k] === c.role)) {
      b.phase = "done";
      store.update((s) => {
        s.stars[b.puzzle.unit_id] = Math.max(s.stars[b.puzzle.unit_id] || 0, earnedStars(b));
      });
      announce("All pieces named. Sentence complete.");
    }
    return redraw();
  }
  if (e.target.closest("[data-next-puzzle]")) {
    ctx.puzzleIdx = (ctx.puzzleIdx + 1) % ctx.data.puzzles.length;
    ctx.builder = newBuilder(ctx.data.puzzles[ctx.puzzleIdx]);
    redraw();
  }
}

// ── Cognate Match ───────────────────────────────────────────────────────────

function roundWords(deck, round) {
  const start = (round * ROUND_SIZE) % deck.length;
  return Array.from({ length: Math.min(ROUND_SIZE, deck.length) }, (_, i) => deck[(start + i) % deck.length]);
}

function newMatch(deck, round) {
  const words = roundWords(deck, round);
  return {
    round,
    words,
    left: seededShuffle(words, `en:${round}`),
    right: seededShuffle(words, `es:${round}`),
    matched: new Set(),
    pick: null, // { side, term }
    misses: 0,
  };
}

function matchHtml(ctx) {
  const m = ctx.match;
  const found = store.read().cognates[ctx.data.grade] || [];
  const card = (w, side) => {
    const done = m.matched.has(w.term);
    const sel = m.pick && m.pick.side === side && m.pick.term === w.term;
    const text = side === "en" ? w.term : w.es;
    return `<button type="button" class="pw-card-btn ${done ? "is-correct" : ""} ${sel ? "is-picked" : ""}" data-pair="${esc(w.term)}" data-side="${side}" ${done ? "disabled" : ""} ${side === "es" ? 'lang="es"' : ""} aria-pressed="${Boolean(sel)}">${esc(text)}</button>`;
  };
  const complete = m.matched.size === m.words.length;
  const earned = m.misses === 0 ? 3 : m.misses <= 2 ? 2 : 1;
  return `
    <p class="pw-prompt">Match each English word with its Spanish cognate.</p>
    <p class="pw-small pw-muted">Collected: ${found.length} of ${ctx.deck.length} words in this grade</p>
    <div class="pw-match" role="group" aria-label="English and Spanish words">
      <div class="pw-match-col" aria-label="English">${m.left.map((w) => card(w, "en")).join("")}</div>
      <div class="pw-match-col" aria-label="Español">${m.right.map((w) => card(w, "es")).join("")}</div>
    </div>
    <ul class="pw-found">${m.words.filter((w) => m.matched.has(w.term)).map((w) => `<li><strong>${esc(w.term)}</strong> = <span lang="es">${esc(w.es)}</span> <span class="pw-muted">${esc(w.def)} (${esc(w.subject)} Unit ${esc(w.unit_number)})</span></li>`).join("")}</ul>
    <p class="pw-feedback" id="pwFeedback" role="status"></p>
    ${complete ? `<p class="pw-good pw-prompt">Round complete: ${stars(earned)}</p><div class="pw-row"><button type="button" class="pw-btn is-primary" data-next-round>Next round</button></div>` : ""}`;
}

function matchClick(e, panel, ctx) {
  const m = ctx.match;
  const redraw = () => keepView(panel, () => {
    panel.querySelector("#pwGameBody").innerHTML = matchHtml(ctx);
  });
  if (e.target.closest("[data-next-round]")) {
    ctx.match = newMatch(ctx.deck, m.round + 1);
    return redraw();
  }
  const btn = e.target.closest("[data-pair]");
  if (!btn) return;
  const pick = { side: btn.dataset.side, term: btn.dataset.pair };
  if (!m.pick || m.pick.side === pick.side) {
    m.pick = m.pick && m.pick.side === pick.side && m.pick.term === pick.term ? null : pick;
    return redraw();
  }
  const same = m.pick.term === pick.term;
  m.pick = null;
  if (same) {
    m.matched.add(pick.term);
    store.update((s) => {
      const list = (s.cognates[ctx.data.grade] ||= []);
      if (!list.includes(pick.term)) list.push(pick.term);
    });
    announce("Match!");
  } else {
    m.misses += 1;
  }
  redraw();
  const el = $("#pwFeedback", panel);
  if (el && !same) {
    el.textContent = "Not a pair. Look again for the words that sound alike.";
    announce(el.textContent);
  }
}

// ── Entry point ─────────────────────────────────────────────────────────────

export function renderPlay(panel, data, mode = "builder") {
  const deck = data.word_wall.filter((w) => w.es);
  if (!data.puzzles.length && !deck.length) {
    panel.innerHTML = `<h2>Play</h2><p class="pw-muted">No games are available for this grade yet.</p>`;
    return;
  }
  const ctx = { data, deck, mode, puzzleIdx: 0, builder: null, match: null };
  ctx.builder = data.puzzles.length ? newBuilder(data.puzzles[0]) : null;
  ctx.match = deck.length ? newMatch(deck, 0) : null;

  const draw = () => {
    panel.querySelector("#pwGameBody").innerHTML = ctx.mode === "builder" ? "" : matchHtml(ctx);
    if (ctx.mode === "builder") renderBuilder(panel, ctx);
    for (const b of panel.querySelectorAll("[data-game]")) b.setAttribute("aria-pressed", String(b.dataset.game === ctx.mode));
  };

  panel.innerHTML = `
    <h2>Play with ${esc(data.label)} language</h2>
    <p class="pw-lede">Built from this grade's own unit sentences and words. No timers; hints never give the answer.</p>
    <div class="pw-seg no-print" role="group" aria-label="Choose a game">
      ${data.puzzles.length ? '<button type="button" data-game="builder" aria-pressed="true">Sentence Builder</button>' : ""}
      ${deck.length ? '<button type="button" data-game="match" aria-pressed="false">Cognate Match</button>' : ""}
    </div>
    <div id="pwGameBody" class="pw-game"></div>`;
  ctx.mode = data.puzzles.length ? mode : "match";
  draw();

  panel.onclick = (e) => {
    const game = e.target.closest("[data-game]");
    if (game) {
      ctx.mode = game.dataset.game;
      return draw();
    }
    if (ctx.mode === "builder") builderClick(e, panel, ctx);
    else matchClick(e, panel, ctx);
  };
  panel.onchange = (e) => {
    const pick = e.target.closest("[data-puzzle-pick]");
    if (!pick) return;
    ctx.puzzleIdx = Number(pick.value);
    ctx.builder = newBuilder(data.puzzles[ctx.puzzleIdx]);
    keepView(panel, () => renderBuilder(panel, ctx));
  };
}
