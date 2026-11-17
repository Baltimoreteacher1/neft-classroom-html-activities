// Word Search Adventure: grid-search. Each puzzle is a themed letter grid (3-5: 7x7, across and down; 6-8: 8x8,
// across, down and both diagonals) hiding four academic words. The clue comes first: a definition, with a context
// sentence as the first hint. The learner selects the word by its first and last letters (tap, or arrow keys +
// Enter/Space on a roving-tabindex role="grid"); either order works. Each found word uncovers a piece of the
// theme scene and shows its meaning, an example sentence and a Spanish gloss (env.sup.gloss).
//
// Grids are placed with env.rng at init and stored in state, so a reload resumes the same puzzle.
// Evidence: one judge() per clue decision. A straight-line selection that does not spell the clue's word is a miss
// (first -> hint + revise, second -> the word is marked in the grid). Taps that are not a straight line are
// turned away without using a try. Hints: 1 context sentence, 2 first letter + length, 3 (mode A) marks the first cell.
import {
  rng,
  audioBtn,
  feedbackHTML,
  glossHTML,
  hintHTML,
  html,
  icon,
  judge,
  newRound,
  settled,
  shuffle,
  takeHint,
} from "./engine.js";
import { cellsOf, DIRS, lineBetween, placeWords, spell } from "./word-search-adventure-grid.js";

const BANDS = ["3-5", "6-8"];
const say = (en, es) => ({ en, es });
const DIR_WORDS = {
  "3-5": say("across or down", "de izquierda a derecha o de arriba abajo"),
  "6-8": say("across, down or diagonally", "en horizontal, en vertical o en diagonal"),
};
const key = (r, c) => `${r}-${c}`;
const puzzle = (s) => s.puzzles[s.p];
const current = (s) => puzzle(s)?.words[s.w];
const firstTry = (w) => w.rs.status === "right" && w.rs.tries === 1 && w.rs.h === 0;

function cellMap(P) {
  const map = new Map();
  P.words.forEach((w, k) => {
    if (!settled(w.rs)) return;
    for (const [r, c] of cellsOf(w)) map.set(key(r, c), { k, w });
  });
  return map;
}

function gridHTML(s, env) {
  const I = env.I;
  const P = puzzle(s);
  const w = current(s);
  const n = P.size;
  const found = cellMap(P);
  const fresh = s.fx && P.words.find((x) => x.id === s.fx);
  const freshCells = new Set(fresh ? cellsOf(fresh).map(([r, c]) => key(r, c)) : []);
  const hintCell = w && !settled(w.rs) && w.rs.h >= 3 ? key(...w.at) : "";
  const cur = s.cur || [0, 0];
  const rows = P.rows.map(
    (row, r) =>
      html`<div
        class="ws-row"
        role="row"
        aria-label="${I.S(`Row ${r + 1}: ${[...row].join(" ")}`, `Fila ${r + 1}: ${[...row].join(" ")}`)}"
      >
        ${[...row].map((ch, c) => {
          const k = key(r, c);
          const f = found.get(k);
          const start = s.sel && s.sel[0] === r && s.sel[1] === c;
          const cls = [
            "ws-cell",
            f ? `is-found ws-c${f.k % 4}` : "",
            f && f.w.rs.status === "revealed" ? "is-revealed" : "",
            start ? "is-start" : "",
            hintCell === k ? "is-hint" : "",
            freshCells.has(k) ? "is-fresh" : "",
          ]
            .filter(Boolean)
            .join(" ");
          const notes = [
            start ? I.S("first letter selected", "primera letra seleccionada") : "",
            f ? I.S(`part of ${f.w.word}`, `parte de ${f.w.word}`) : "",
            hintCell === k ? I.S("hint: start here", "pista: empieza aquí") : "",
          ].filter(Boolean);
          return html`<div
            role="gridcell"
            class="ws-gc"
            aria-selected="${start ? "true" : "false"}"
          >
            <button
              type="button"
              class="${cls}"
              data-ws-cell="${k}"
              tabindex="${cur[0] === r && cur[1] === c ? "0" : "-1"}"
              aria-label="${ch}, ${I.S(`row ${r + 1}, column ${c + 1}`, `fila ${r + 1}, columna ${c + 1}`)}${notes.length ? `, ${notes.join(", ")}` : ""}"
            >
              ${ch}
            </button>
          </div>`;
        })}
      </div>`,
  );
  return html`<div class="ws-grid-wrap">
    <div
      class="ws-grid"
      role="grid"
      style="--ws-n:${n}"
      aria-label="${I.S(`Letter grid, ${n} rows by ${n} columns. Use the arrow keys to move and Enter to pick a letter.`, `Sopa de letras de ${n} filas por ${n} columnas. Usa las flechas para moverte y Enter para elegir una letra.`)}"
    >
      ${rows}
    </div>
  </div>`;
}

function sceneHTML(s, I) {
  const P = puzzle(s);
  const k = P.words.filter((w) => settled(w.rs)).length;
  return html`<ul
    class="ws-scene"
    aria-label="${I.S(`Words found in this puzzle: ${k} of ${P.words.length}`, `Palabras encontradas en esta sopa de letras: ${k} de ${P.words.length}`)}"
  >
    ${P.words.map((w, j) => {
      const open = settled(w.rs);
      const now = j === s.w && !open;
      return html`<li
        class="ws-piece${open ? " is-open" : ""}${now ? " is-now" : ""}${open && w.rs.status === "revealed" ? " is-revealed" : ""}${s.fx === w.id ? " is-fresh" : ""}"
      >
        <span class="ws-piece-pic" aria-hidden="true">${open ? w.pic : "?"}</span>
        <span class="ws-piece-w"
          >${open ? html`${w.rs.status === "right" ? html`<span aria-hidden="true">✓ </span>` : ""}${w.word}` : now ? I.T("Clue now", "Pista actual") : I.T("Hidden", "Escondida")}</span
        >
      </li>`;
    })}
  </ul>`;
}

function foundCard(w, env) {
  const I = env.I;
  const lower = w.word.toLowerCase();
  return html`<section
    class="ws-card"
    aria-label="${I.S(`Word card: ${w.word}`, `Tarjeta de la palabra: ${w.word}`)}"
  >
    <div class="ws-card-head">
      <span class="ws-card-pic" aria-hidden="true">${w.pic}</span>
      <p class="ws-card-word" lang="en">${lower}</p>
      ${glossHTML(w.es, env)}${audioBtn(lower, I, I.S("Hear the word", "Escuchar la palabra"))}
    </div>
    <p><strong>${I.T("Meaning:", "Significado:")}</strong> ${I.T(w.clue.en, w.clue.es)}</p>
    <p class="ws-example">
      <strong>${I.T("Example:", "Ejemplo:")}</strong>
      <span lang="en">${w.context.en.replace("___", lower)}</span>
    </p>
  </section>`;
}

export default {
  id: "word-search-adventure",

  init(env) {
    const band = env.content || {};
    const themes = band.themes || [];
    const n = Math.max(1, Math.min(themes.length, env.count(3, 1)));
    const dirs = (band.dirs || ["across", "down"]).filter((d) => DIRS[d]);
    const puzzles = shuffle(themes, env.rng)
      .slice(0, n)
      .map((t) => {
        const placed = placeWords(
          t.words.map((w) => w.word),
          band.size,
          dirs,
          env.rng,
        );
        return {
          id: t.id,
          title: t.title,
          pic: t.pic,
          size: band.size,
          rows: placed.rows,
          words: shuffle(t.words, env.rng).map((w) => ({
            id: w.id,
            word: w.word,
            pic: w.pic,
            es: w.es,
            clue: w.clue,
            context: w.context,
            at: placed.at[w.word].at,
            dir: placed.at[w.word].dir,
            misses: [],
            rs: newRound(),
          })),
        };
      });
    return {
      band: env.band,
      dirs,
      p: 0,
      w: 0,
      sel: null,
      cur: [0, 0],
      msg: null,
      fk: "",
      fx: "",
      puzzles,
    };
  },

  done: (s) => s.p >= s.puzzles.length,
  progress(s) {
    const all = s.puzzles.flatMap((P) => P.words);
    return { done: all.filter((w) => settled(w.rs)).length, total: all.length };
  },

  view(s, env) {
    const I = env.I;
    const P = puzzle(s);
    const w = current(s);
    if (!P || !w)
      return html`<p role="status">
        ${I.T("Every puzzle is solved.", "Todas las sopas de letras están resueltas.")}
      </p>`;
    const open = !settled(w.rs);
    const total = P.words.length;
    const foundN = P.words.filter((x) => settled(x.rs)).length;
    const cleared = foundN === total;
    const lastWord = s.w + 1 === total;
    const lastPuzzle = s.p + 1 === s.puzzles.length;
    const stars = s.puzzles.flatMap((x) => x.words).filter(firstTry).length;
    const dirs = DIR_WORDS[s.band] || DIR_WORDS["3-5"];
    const blank = w.context.en.split("___");
    const hints = [
      html`<span lang="en"
          >${blank[0]}<span
            class="ws-blank"
            role="img"
            aria-label="${I.S("blank", "espacio en blanco")}"
          ></span
          >${blank[1] || ""}</span
        >${(I.mode || "en") === "en" ? "" : html` <span class="ws-hint-es" lang="es">${w.context.es}</span>`}`,
      I.T(
        `It starts with ${w.word[0]} and has ${w.word.length} letters.`,
        `Empieza con ${w.word[0]} y tiene ${w.word.length} letras.`,
      ),
      I.T(
        "Look for the marked letter in the grid. That is where the word starts.",
        "Busca la letra marcada en la sopa de letras. Ahí empieza la palabra.",
      ),
    ];
    const missed = w.misses[w.misses.length - 1] || "";
    const other = P.words.find(
      (x) => x !== w && (x.word === missed || [...x.word].reverse().join("") === missed),
    );
    const retry = other
      ? I.T(
          `That spells ${other.word}, another word in this puzzle, but it does not match this clue. Read the clue again.`,
          `Eso dice ${other.word}, otra palabra de esta sopa de letras, pero no coincide con esta pista. Lee la pista otra vez.`,
        )
      : I.T(
          `Those letters spell ${missed}. That is not the word for this clue. Read the clue again and look ${dirs.en}.`,
          `Esas letras dicen ${missed}. No es la palabra de esta pista. Lee la pista otra vez y busca ${dirs.es}.`,
        );
    const nextLabel = !lastWord
      ? I.T("Next clue", "Siguiente pista")
      : !lastPuzzle
        ? I.T("Next puzzle", "Siguiente sopa de letras")
        : I.T("Finish the adventure", "Terminar la aventura");
    return html`<section
      class="cg-station ws ws-b${s.band === "6-8" ? "68" : "35"}"
      data-mechanic="grid-search"
    >
      <header class="ws-top">
        <p class="ws-theme">
          <span class="ws-theme-pic" aria-hidden="true">${P.pic}</span
          ><span>${I.T(P.title.en, P.title.es)}</span
          ><span class="ws-theme-n"
            >${I.T(`Puzzle ${s.p + 1} of ${s.puzzles.length}`, `Sopa ${s.p + 1} de ${s.puzzles.length}`)}</span
          >
        </p>
        <p class="ws-tally">
          <span aria-hidden="true">⭐</span>
          ${I.T(`${stars} found on the first try`, `${stars} encontradas al primer intento`)}
        </p>
      </header>
      ${sceneHTML(s, I)}
      <article class="ws-clue" aria-labelledby="ws-clue-t">
        <h2 id="ws-clue-t" class="ws-clue-t" tabindex="-1">
          ${I.T(`Clue ${s.w + 1} of ${total}`, `Pista ${s.w + 1} de ${total}`)}
        </h2>
        <p class="ws-clue-text">${I.T(w.clue.en, w.clue.es)}</p>
        <div class="ws-clue-meta">
          <ol
            class="ws-slots"
            aria-label="${I.S(`${w.word.length} letters`, `${w.word.length} letras`)}"
          >
            ${[...w.word].map((ch) => html`<li>${open ? "" : ch}</li>`)}
          </ol>
          ${audioBtn(w.clue.en, I, I.S("Listen to the clue", "Escuchar la pista"))}
        </div>
      </article>
      ${gridHTML(s, env)}
      <p class="ws-status" role="status" aria-live="polite">
        ${s.msg && open && w.rs.status !== "retry" ? I.T(s.msg.en, s.msg.es) : ""}
      </p>
      ${open ? html`<p class="fine ws-tip">${I.T(`Tap the first letter, then the last letter. Words go ${dirs.en}.`, `Toca la primera letra y luego la última. Las palabras van ${dirs.es}.`)}${s.sel ? html` <button type="button" class="btn small" data-ws-clear>${I.T("Clear selection", "Borrar selección")}</button>` : ""}</p>` : ""}
      ${hintHTML(w.rs, hints, env, { disabled: !open })}
      ${feedbackHTML(w.rs, {
        I,
        right: cleared
          ? I.T(
              `Found ${w.word}! Puzzle cleared: you uncovered the whole ${P.title.en.toLowerCase()} scene.`,
              `¡Encontraste ${w.word}! Sopa resuelta: descubriste toda la escena de ${P.title.es.toLowerCase()}.`,
            )
          : I.T(
              `Found ${w.word}! ${foundN} of ${total} words found.`,
              `¡Encontraste ${w.word}! ${foundN} de ${total} palabras encontradas.`,
            ),
        retry,
        answer: I.T(
          `The word is ${w.word}. It is marked in the grid with a dashed outline.`,
          `La palabra es ${w.word}. Está marcada en la sopa de letras con un borde punteado.`,
        ),
      })}
      ${open ? "" : foundCard(w, env)}
      ${open ? "" : html`<div class="gs-actions"><button type="button" class="btn btn-primary btn-big" data-g-next>${icon("arrow-right")}${nextLabel}</button></div>`}
    </section>`;
  },

  click(el, s, env) {
    const b = el.closest("button");
    const P = puzzle(s);
    const w = current(s);
    if (!b || !P || !w) return false;
    if (b.dataset.wsCell !== undefined) {
      if (settled(w.rs)) return false;
      const [r, c] = b.dataset.wsCell.split("-").map(Number);
      if (!(r >= 0 && r < P.size && c >= 0 && c < P.size)) return false;
      s.cur = [r, c];
      s.fk = "grid";
      s.fx = "";
      const ch = P.rows[r][c];
      if (!s.sel) {
        s.sel = [r, c];
        if (w.rs.status === "retry") w.rs.status = "open";
        s.msg = say(
          `First letter: ${ch}. Now pick the last letter.`,
          `Primera letra: ${ch}. Ahora elige la última letra.`,
        );
        return true;
      }
      if (s.sel[0] === r && s.sel[1] === c) {
        s.sel = null;
        s.msg = say("Selection cleared.", "Selección borrada.");
        return true;
      }
      const cells = lineBetween(s.sel, [r, c], s.dirs);
      if (!cells) {
        s.sel = [r, c];
        s.msg = say(
          `Those two letters are not in a straight line ${DIR_WORDS[s.band]?.en || ""}, so ${ch} is your new first letter.`,
          `Esas dos letras no están en línea recta ${DIR_WORDS[s.band]?.es || ""}, así que ${ch} es tu nueva primera letra.`,
        );
        return true;
      }
      const word = spell(P.rows, cells);
      const ok = word === w.word || [...word].reverse().join("") === w.word;
      s.sel = null;
      s.msg = null;
      if (!ok) w.misses.push(word);
      judge(w.rs, ok, env, {
        id: w.id,
        skill: env.def?.skill?.toLowerCase() || "reading",
        extra: { word: w.word },
      });
      if (settled(w.rs)) {
        s.fk = "next";
        if (ok) s.fx = w.id;
      }
      return true;
    }
    if (b.hasAttribute("data-ws-clear") && s.sel) {
      s.sel = null;
      s.msg = say("Selection cleared.", "Selección borrada.");
      s.fk = "grid";
      return true;
    }
    if (b.hasAttribute("data-g-hint") && !settled(w.rs)) {
      if (takeHint(w.rs, env) < 0) return false;
      s.fx = "";
      s.fk = "hint";
      return true;
    }
    if (b.hasAttribute("data-g-next") && settled(w.rs)) {
      s.fx = "";
      s.msg = null;
      s.sel = null;
      s.fk = "clue";
      if (s.w + 1 < P.words.length) s.w += 1;
      else {
        s.p += 1;
        s.w = 0;
        s.cur = [0, 0];
      }
      return true;
    }
    return false;
  },

  mount(root, s) {
    const grid = root.querySelector(".ws-grid");
    const f = s.fk;
    let el = null;
    if (f === "grid" && s.cur) el = root.querySelector(`[data-ws-cell="${key(...s.cur)}"]`);
    else if (f === "next") el = root.querySelector("[data-g-next]");
    else if (f === "clue") el = root.querySelector("#ws-clue-t");
    else if (f === "hint") {
      el = root.querySelector("[data-g-hint]");
      if (!el) {
        const shown = root.querySelectorAll(".gs-hints .gs-hint");
        el = shown[shown.length - 1] || root.querySelector(`[data-ws-cell][tabindex="0"]`);
        if (el && !el.matches("button")) el.tabIndex = -1;
      }
    }
    // The app restores focus to the last-focused control right after mount; move focus after that, once.
    s.fk = "";
    if (el) Promise.resolve().then(() => el.isConnected && el.focus({ preventScroll: f === "grid" || f === "hint" }));
    if (!grid) return null;
    const n = puzzle(s)?.size || 0;
    const onKey = (e) => {
      const btn = e.target.closest?.("[data-ws-cell]");
      if (!btn || e.altKey || e.metaKey) return;
      let [r, c] = btn.dataset.wsCell.split("-").map(Number);
      const was = `${r}-${c}`;
      if (e.key === "ArrowUp") r -= 1;
      else if (e.key === "ArrowDown") r += 1;
      else if (e.key === "ArrowLeft") c -= 1;
      else if (e.key === "ArrowRight") c += 1;
      else if (e.key === "Home") [r, c] = e.ctrlKey ? [0, 0] : [r, 0];
      else if (e.key === "End") [r, c] = e.ctrlKey ? [n - 1, n - 1] : [r, n - 1];
      else return;
      e.preventDefault();
      r = Math.max(0, Math.min(n - 1, r));
      c = Math.max(0, Math.min(n - 1, c));
      if (`${r}-${c}` === was) return;
      const to = grid.querySelector(`[data-ws-cell="${r}-${c}"]`);
      if (!to) return;
      btn.tabIndex = -1;
      to.tabIndex = 0;
      to.focus();
    };
    grid.addEventListener("keydown", onKey);
    return () => grid.removeEventListener("keydown", onKey);
  },

  plan(s, { wrong } = {}) {
    const P = puzzle(s);
    const w = current(s);
    if (!P || !w) return [];
    if (settled(w.rs)) return [{ click: "[data-g-next]" }];
    const cell = ([r, c]) => ({ click: `[data-ws-cell="${key(r, c)}"]` });
    const cells = cellsOf(w);
    const steps = s.sel ? [cell(s.sel)] : [];
    steps.push(cell(cells[0]), cell(wrong ? cells[cells.length - 2] : cells[cells.length - 1]));
    return steps;
  },

  validate(content) {
    const errors = [];
    const bi = (o) =>
      o &&
      typeof o.en === "string" &&
      o.en.trim() &&
      typeof o.es === "string" &&
      o.es.trim() &&
      o.es !== o.en;
    for (const name of BANDS) {
      const band = content.bands?.[name] || {};
      const size = band.size;
      const dirs = band.dirs || [];
      if (!Number.isInteger(size) || size < 6 || size > 10)
        errors.push(`${name}: size must be 6-10`);
      if (!dirs.length || dirs.some((d) => !DIRS[d]))
        errors.push(`${name}: dirs must be from ${Object.keys(DIRS).join(", ")}`);
      const themes = band.themes || [];
      if (themes.length < 3) errors.push(`${name}: needs at least three themed puzzles`);
      const total = themes.reduce((t, x) => t + (x.words || []).length, 0);
      if (total < 10) errors.push(`${name}: needs at least ten authored words`);
      const ids = new Set();
      for (const t of themes) {
        if (!t.id || !bi(t.title) || !t.pic)
          errors.push(`${name}/${t.id}: theme needs id, bilingual title and pic`);
        const words = t.words || [];
        if (words.length < 3 || words.length > 5)
          errors.push(`${name}/${t.id}: a puzzle holds 3-5 words`);
        if (new Set(words.map((w) => w.word)).size !== words.length)
          errors.push(`${name}/${t.id}: words must be unique`);
        for (const w of words) {
          const at = `${name}/${w.id}`;
          if (!w.id || ids.has(w.id)) errors.push(`${at}: ids must be unique`);
          ids.add(w.id);
          if (!/^[A-Z]+$/.test(w.word || "") || w.word.length < 4 || w.word.length > size)
            errors.push(`${at}: word must be 4-${size} capital letters`);
          if (!w.pic || !w.es) errors.push(`${at}: needs a pic and a Spanish gloss (es)`);
          for (const f of ["clue", "context"])
            if (!bi(w[f]))
              errors.push(
                `${at}: ${f} must be bilingual (Spanish must not be a copy of the English)`,
              );
          if (!String(w.context?.en).includes("___") || !String(w.context?.es).includes("___"))
            errors.push(`${at}: context needs a ___ blank in both languages`);
          if (!w.word) continue;
          const esWord = String(w.es || "")
            .split(/[ (]/)[0]
            .toLowerCase();
          for (const f of ["clue", "context"]) {
            if (new RegExp(`\\b${w.word.toLowerCase()}`, "i").test(`${w[f]?.en} ${w[f]?.es}`))
              errors.push(`${at}: ${f} gives away the word`);
            if (
              esWord &&
              String(w[f]?.es || "")
                .toLowerCase()
                .includes(esWord)
            )
              errors.push(`${at}: ${f} gives away the Spanish gloss`);
          }
          if (/timer|countdown/i.test(JSON.stringify(w))) errors.push(`${at}: no timer language`);
        }
        if (
          Number.isInteger(size) &&
          dirs.length &&
          words.every((w) => /^[A-Z]+$/.test(w.word || "") && w.word.length <= size)
        ) {
          for (let seed = 1; seed <= 25; seed += 1) {
            try {
              placeWords(
                words.map((w) => w.word),
                size,
                dirs,
                rng(seed),
              );
            } catch {
              errors.push(
                `${name}/${t.id}: words do not fit the ${size}x${size} grid (seed ${seed})`,
              );
              break;
            }
          }
        }
      }
    }
    return errors;
  },
};
