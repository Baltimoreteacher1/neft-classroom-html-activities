// Direction Dash (Carrera de instrucciones): a listening game. The learner HEARS a spoken direction ("Put the beaker
// to the left of the microscope", "First transfer ..., then place ...") and acts it out on an illustrated 4 x 3 board
// (science-lab shelves or a classroom map): tap an object, tap the square where it goes, then Check. Every control is
// a native button, so Tab + Enter/Space plays the whole game; Escape puts a held object back down.
//
// Support modes (engine SUP): A autoplays the direction once per round and shows the transcript, Spanish and picture
// glosses for the spatial words. B plays on tap; the transcript is one tap away and opening it is saved as help
// (env.use). C is audio only; the first two plays are the task, every replay after that is saved as help.
// The board is checked as a whole: each named object must end where the direction says and nothing else may move.
// Standard engine loop: miss -> hint -> revise -> reveal (the reveal moves the objects to a correct answer).
import {
  feedbackHTML,
  glossHTML,
  hintHTML,
  html,
  icon,
  judge,
  newRound,
  pips,
  settled,
  shuffle,
  takeHint,
} from "./engine.js";
import { mascot } from "./art.js";
import { speak } from "../speech.js";
import { OBJ, SCENES, TERMS, objArt, termArt } from "./direction-dash-art.js";

const COLS = 4;
const CELLS = 12;
const VERBS = ["place", "position", "transfer"];
const supKey = (env) => env.support || env.sup?.key || "A";
const empty = (pos, cell) => !Object.values(pos).includes(cell);
const rowOf = (row, cell, I) => {
  const r = SCENES[row.scene].rows[Math.floor(cell / COLS)];
  return I.T(r[0], r[1]);
};
const rowOfS = (row, cell, I) => {
  const r = SCENES[row.scene].rows[Math.floor(cell / COLS)];
  return I.S(r[0], r[1]);
};

/** A full final board where every goal object sits in one of its cells and every other object stays put. */
export function solution(start, goal, prefer = start) {
  const movers = goal.map((g) => g.obj);
  const taken = new Set(
    Object.entries(start)
      .filter(([k]) => !movers.includes(k))
      .map(([, c]) => c),
  );
  const out = Object.fromEntries(Object.entries(start).filter(([k]) => !movers.includes(k)));
  const walk = (i) => {
    if (i === goal.length) return true;
    const g = goal[i];
    const order = [...g.cells].sort((a, b) => (b === prefer[g.obj]) - (a === prefer[g.obj]));
    for (const c of order) {
      if (taken.has(c)) continue;
      taken.add(c);
      out[g.obj] = c;
      if (walk(i + 1)) return true;
      taken.delete(c);
      delete out[g.obj];
    }
    return false;
  };
  return walk(0) ? out : null;
}
/** Objects that are not where the direction puts them (a named object off its squares, or any other object moved). */
export const misplaced = (pos, start, goal) =>
  Object.keys(start).filter((k) => {
    const g = goal.find((x) => x.obj === k);
    return g ? !g.cells.includes(pos[k]) : pos[k] !== start[k];
  });
export const solved = (pos, start, goal) => misplaced(pos, start, goal).length === 0;

/** Moves [obj, cell] that turn `pos` into `want` without stacking two objects in one square. */
function movesTo(pos, want) {
  const p = { ...pos };
  const out = [];
  for (let guard = 0; guard < 24; guard += 1) {
    const off = Object.keys(want).filter((k) => p[k] !== want[k]);
    if (!off.length) break;
    const k = off.find((x) => empty(p, want[x]));
    if (k) {
      out.push([k, want[k]]);
      p[k] = want[k];
      continue;
    }
    const park = Array.from({ length: CELLS }, (_, c) => c).find(
      (c) => empty(p, c) && !Object.values(want).includes(c),
    );
    out.push([off[0], park]);
    p[off[0]] = park;
  }
  return out;
}

let spokenKey = "";
let focusSel = "";
const play = (row, env) => {
  if (typeof window === "undefined") return;
  const prefs = env.ctx?.prefs || {};
  speak(row.say.en, { rate: prefs.rate || 0.9, voiceURI: prefs.readingVoice || "" });
};

function termsHTML(row, env) {
  const I = env.I;
  if (!env.sup.visuals || !row.terms.length) return "";
  return html`<ul class="dd-terms" aria-label="${I.S("Word help", "Ayuda con las palabras")}">
    ${row.terms.map((k) => html`<li class="dd-term">${termArt(k)}<span class="dd-term-en">${TERMS[k].en}</span>${glossHTML(TERMS[k].es, env)}</li>`)}
  </ul>`;
}

function transcriptHTML(row, env) {
  const I = env.I;
  const sup = supKey(env);
  const open = sup === "A" || settled(row.rs) || (sup === "B" && row.tx);
  if (open)
    return html`<div class="dd-transcript">
      <p class="dd-say" lang="en">“${row.say.en}”</p>
      ${settled(row.rs) && sup === "C" ? "" : glossHTML(row.say.es, env)}
    </div>`;
  if (sup === "B")
    return html`<button type="button" class="btn small dd-tx-btn" data-dd-transcript>
      ${icon("reading")}${I.T("Show the words", "Mostrar las palabras")}
    </button>`;
  return html`<p class="fine dd-plays">
    ${I.T(`Plays: ${row.plays}. The first two plays are part of the task; replays after that are saved as help.`, `Reproducciones: ${row.plays}. Las dos primeras son parte de la tarea; las siguientes se guardan como ayuda.`)}
  </p>`;
}

function cellHTML(row, c, env, locked) {
  const I = env.I;
  const k = Object.keys(row.pos).find((x) => row.pos[x] === c);
  const where = I.S(
    `${rowOfS(row, c, I)}, square ${(c % COLS) + 1}`,
    `${rowOfS(row, c, I)}, casilla ${(c % COLS) + 1}`,
  );
  if (!k)
    return html`<li>
      <button
        type="button"
        class="dd-cell"
        data-dd-cell="${c}"
        aria-label="${I.S("Empty", "Vacía")}: ${where}"
        ${locked ? "disabled" : ""}
      >
        <span class="dd-dot" aria-hidden="true"></span>
      </button>
    </li>`;
  const goal = row.goal.some((g) => g.obj === k);
  const mark = locked && goal ? (row.rs.status === "right" ? " is-right" : " is-reveal") : "";
  const held = row.held === k;
  return html`<li>
    <button
      type="button"
      class="dd-cell has-obj${held ? " is-held" : ""}${mark}"
      data-dd-obj="${k}"
      aria-pressed="${held}"
      aria-label="${OBJ[k].en}: ${where}"
      ${locked ? "disabled" : ""}
    >
      ${objArt(k)}<span class="dd-name" lang="en">${OBJ[k].en}</span
      >${env.sup.gloss === "show" ? html`<span class="dd-name-es" lang="es">${OBJ[k].es}</span>` : ""}
    </button>
  </li>`;
}

const NOTES = {
  picked: (row, I) =>
    I.T(
      `You picked up the ${OBJ[row.last].en}. Now tap the square where it goes.`,
      `Tomaste: ${OBJ[row.last].es}. Ahora toca la casilla donde va.`,
    ),
  dropped: (row, I) =>
    I.T(`You put the ${OBJ[row.last].en} back down.`, `Dejaste: ${OBJ[row.last].es}.`),
  placed: (row, I) =>
    I.T(
      `You moved the ${OBJ[row.last].en}. Move more objects, or press Check.`,
      `Moviste: ${OBJ[row.last].es}. Mueve más objetos o pulsa Comprobar.`,
    ),
  empty: (row, I) =>
    I.T("First tap an object to pick it up.", "Primero toca un objeto para tomarlo."),
  reset: (row, I) => I.T("Everything is back where it started.", "Todo volvió a su lugar inicial."),
};

export default {
  id: "direction-dash",

  init(env) {
    const band = env.content.bands?.[env.band] || env.content;
    const all = shuffle(band.rounds, env.rng);
    const take = all.slice(0, Math.min(all.length, env.count(8, 4)));
    return {
      sid: env.rng.int(1e9),
      i: 0,
      band: env.band,
      rounds: take.map((r) => ({
        id: r.id,
        kind: r.kind,
        scene: r.scene,
        say: r.say,
        terms: r.terms || [],
        hint: r.hint,
        explain: r.explain,
        goal: r.goal,
        start: r.start,
        pos: { ...r.start },
        held: null,
        last: null,
        note: "",
        plays: 0,
        tx: false,
        rs: newRound(),
      })),
    };
  },

  done: (s) => s.i >= s.rounds.length,
  progress: (s) => ({ done: s.rounds.filter((r) => settled(r.rs)).length, total: s.rounds.length }),

  view(s, env) {
    const I = env.I;
    const row = s.rounds[s.i];
    if (!row)
      return html`<p role="status">
        ${I.T("Every direction is done.", "Todas las instrucciones están hechas.")}
      </p>`;
    const p = this.progress(s);
    const locked = settled(row.rs);
    const sc = SCENES[row.scene];
    const guide = s.band === "6-8" ? "juno" : "pip";
    const mood = row.rs.status === "right" ? "cheer" : row.rs.status === "retry" ? "think" : "hi";
    const want = solution(row.start, row.goal) || {};
    const hints = [
      I.T(row.hint.en, row.hint.es),
      I.T(
        `Move: ${row.goal.map((g) => `the ${OBJ[g.obj].en}`).join(" and ")}.`,
        `Mueve: ${row.goal.map((g) => OBJ[g.obj].es).join(" y ")}.`,
      ),
      html`${I.T("Where it goes:", "Dónde va:")}
      ${row.goal.map((g, n) => html`${n ? "; " : ""}${OBJ[g.obj].en} → ${rowOf(row, want[g.obj], I)}`)}`,
    ];
    const rows = sc.rows.map(
      (r, ri) =>
        html`<div class="dd-row">
          <p class="dd-rowname">${I.T(r[0], r[1])}</p>
          <ul class="dd-cells">
            ${Array.from({ length: COLS }, (_, ci) => cellHTML(row, ri * COLS + ci, env, locked))}
          </ul>
        </div>`,
    );
    const wrongCount = row.rs.status === "retry" ? misplaced(row.pos, row.start, row.goal).length : 0;
    return html`<section
      class="cg-station dd-board dd-scene-${row.scene}"
      data-mechanic="listen-and-place"
    >
      ${pips(p.done, p.total, I.S(`${p.done} of ${p.total} directions done`, `${p.done} de ${p.total} instrucciones hechas`), I.S)}
      <div class="dd-call">
        <div class="dd-guide">${mascot(guide, s.band, mood, 76)}</div>
        <div class="dd-bubble">
          <h2 class="dd-head" tabindex="-1">
            ${I.T("Direction", "Instrucción")}
            ${s.i + 1}/${s.rounds.length}${row.kind !== "one-step" ? html` <span class="dd-kind">${row.kind === "conditional" ? I.T("Look first, then decide", "Observa y luego decide") : I.T("Two steps", "Dos pasos")}</span>` : ""}
          </h2>
          <button
            type="button"
            class="btn btn-primary dd-play"
            data-dd-play
            aria-label="${I.S("Play the direction", "Escuchar la instrucción")}"
          >
            ${icon("listening")}${row.plays || env.sup.audio === "auto" ? I.T("Play it again", "Escuchar otra vez") : I.T("Play the direction", "Escuchar la instrucción")}
          </button>
          ${transcriptHTML(row, env)} ${termsHTML(row, env)}
        </div>
      </div>
      <p class="cg-instruction">
        ${I.T("Tap an object, then tap the square where it goes. Press Check when the picture matches the direction.", "Toca un objeto y luego la casilla donde va. Pulsa Comprobar cuando la imagen coincida con la instrucción.")}
      </p>
      <div class="dd-scene" role="group" aria-label="${I.S(sc.name[0], sc.name[1])}">
        ${row.scene === "class" ? html`<p class="dd-whiteboard">${I.T("Board (front of the room)", "Pizarra (frente del salón)")}</p>` : ""}
        ${rows}
      </div>
      <p class="dd-note" role="status" aria-live="polite">
        ${row.note && NOTES[row.note] ? NOTES[row.note](row, I) : ""}
      </p>
      ${
        locked
          ? ""
          : html`<div class="gs-actions dd-actions">
              <button type="button" class="btn btn-primary" data-dd-check>
                ${icon("check")}${I.T("Check", "Comprobar")}
              </button>
              <button type="button" class="btn" data-dd-reset>
                ${icon("replay")}${I.T("Start over", "Empezar de nuevo")}
              </button>
            </div>`
      }
      ${hintHTML(row.rs, hints, env, { disabled: locked })}
      ${feedbackHTML(row.rs, {
        I,
        right: I.T(
          "Every object is where the direction says.",
          "Cada objeto está donde dice la instrucción.",
        ),
        retry: I.T(
          `Listen again and compare each part of the direction with the picture.${wrongCount ? ` Objects to look at again: ${wrongCount}.` : ""}`,
          `Escucha otra vez y compara cada parte de la instrucción con la imagen.${wrongCount ? ` Objetos para revisar: ${wrongCount}.` : ""}`,
        ),
        answer: I.T(
          `The direction said: “${row.say.en}”`,
          `La instrucción decía: “${row.say.en}” (${row.say.es})`,
        ),
        explain: I.T(row.explain.en, row.explain.es),
        hint: "",
      })}
      ${locked ? html`<div class="gs-actions"><button type="button" class="btn btn-primary btn-big" data-g-next>${icon("arrow-right")}${s.i + 1 === s.rounds.length ? I.T("Finish", "Terminar") : I.T("Next direction", "Siguiente instrucción")}</button></div>` : ""}
    </section>`;
  },

  click(el, s, env) {
    const b = el.closest("button");
    const row = s.rounds[s.i];
    if (!b || !row) return false;
    const open = !settled(row.rs);
    if (b.hasAttribute("data-dd-play")) {
      row.plays += 1;
      if (supKey(env) === "C" && row.plays > 2) env.use("audio-replay");
      play(row, env);
      return true;
    }
    if (b.hasAttribute("data-dd-transcript") && !row.tx) {
      row.tx = true;
      env.use("transcript");
      return true;
    }
    if (b.dataset.ddObj !== undefined && open) {
      const k = b.dataset.ddObj;
      row.held = row.held === k ? null : k;
      row.last = k;
      row.note = row.held ? "picked" : "dropped";
      focusSel = `[data-dd-obj="${k}"]`;
      return true;
    }
    if (b.dataset.ddCell !== undefined && open) {
      if (!row.held) {
        row.note = "empty";
        return true;
      }
      row.pos[row.held] = Number(b.dataset.ddCell);
      row.last = row.held;
      row.held = null;
      row.note = "placed";
      focusSel = `[data-dd-obj="${row.last}"]`;
      return true;
    }
    if (b.hasAttribute("data-dd-reset") && open) {
      row.pos = { ...row.start };
      row.held = null;
      row.note = "reset";
      return true;
    }
    if (b.hasAttribute("data-dd-check") && open) {
      row.held = null;
      row.note = "";
      judge(row.rs, solved(row.pos, row.start, row.goal), env, {
        id: row.id,
        skill: env.def.skill.toLowerCase(),
        extra: { kind: row.kind },
      });
      if (row.rs.status === "revealed") row.pos = solution(row.start, row.goal, row.pos);
      focusSel = ".gs-feedback";
      return true;
    }
    if (b.hasAttribute("data-g-hint") && open) {
      takeHint(row.rs, env);
      return true;
    }
    if (b.hasAttribute("data-g-next") && !open) {
      s.i += 1;
      focusSel = ".dd-head";
      return true;
    }
    return false;
  },

  key(e, s) {
    const row = s.rounds[s.i];
    if (e.key !== "Escape" || !row?.held) return false;
    row.last = row.held;
    row.held = null;
    row.note = "dropped";
    return true;
  },

  mount(root, s, env) {
    const row = s.rounds[s.i];
    if (row && env.sup.audio === "auto" && !settled(row.rs) && spokenKey !== `${s.sid}:${s.i}`) {
      spokenKey = `${s.sid}:${s.i}`;
      play(row, env);
    }
    if (focusSel) {
      const n = root.querySelector(focusSel);
      if (n && !n.hasAttribute("tabindex") && !/^(BUTTON|A|INPUT)$/.test(n.tagName))
        n.setAttribute("tabindex", "-1");
      n?.focus({ preventScroll: false });
      focusSel = "";
    }
    return null;
  },

  plan(s, { wrong } = {}) {
    const row = s.rounds[s.i];
    if (!row) return [];
    if (settled(row.rs)) return [{ click: "[data-g-next]" }];
    const out = [];
    const move = (k, c, first) => {
      if (!(first && row.held === k)) out.push({ click: `[data-dd-obj="${k}"]` });
      out.push({ click: `[data-dd-cell="${c}"]` });
    };
    if (wrong) {
      const g = row.goal[0];
      const c = Array.from({ length: CELLS }, (_, n) => n).find(
        (n) => empty(row.pos, n) && !g.cells.includes(n),
      );
      move(g.obj, c, true);
    } else {
      movesTo(row.pos, solution(row.start, row.goal, row.pos)).forEach(([k, c], n) =>
        move(k, c, n === 0),
      );
    }
    out.push({ click: "[data-dd-check]" });
    return out;
  },

  validate(content) {
    const errors = [];
    const two = (x) => x?.en && x?.es;
    for (const band of ["3-5", "6-8"]) {
      const rounds = content.bands?.[band]?.rounds || [];
      if (rounds.length < 12) errors.push(`${band}: needs at least 12 directions`);
      if (new Set(rounds.map((r) => r.id)).size !== rounds.length)
        errors.push(`${band}: round ids must be unique`);
      rounds.forEach((r) => {
        const at = `${band}/${r.id}`;
        if (!SCENES[r.scene]) errors.push(`${at}: unknown scene`);
        if (!two(r.say) || !two(r.hint) || !two(r.explain))
          errors.push(`${at}: direction, hint and explanation must be bilingual`);
        if (r.hint?.en === r.explain?.en)
          errors.push(`${at}: explanation must say why, not repeat the hint`);
        (r.terms || []).forEach((t) => {
          if (!TERMS[t]) errors.push(`${at}: unknown term "${t}"`);
        });
        const cells = Object.values(r.start || {});
        if (
          !cells.length ||
          cells.some((c) => !Number.isInteger(c) || c < 0 || c >= CELLS) ||
          new Set(cells).size !== cells.length
        )
          errors.push(`${at}: start cells must be unique squares 0-11`);
        Object.keys(r.start || {}).forEach((k) => {
          if (!OBJ[k]) errors.push(`${at}: unknown object "${k}"`);
        });
        (r.goal || []).forEach((g) => {
          if (!(g.obj in (r.start || {})))
            errors.push(`${at}: goal object ${g.obj} is not on the board`);
          if (!g.cells?.length || g.cells.some((c) => !Number.isInteger(c) || c < 0 || c >= CELLS))
            errors.push(`${at}: goal cells must be squares 0-11`);
          if (OBJ[g.obj] && !r.say?.en?.toLowerCase().includes(OBJ[g.obj].en))
            errors.push(`${at}: the direction must name the ${g.obj}`);
        });
        if (!r.goal?.length || !solution(r.start || {}, r.goal || []))
          errors.push(`${at}: no board satisfies the goal`);
        else if (solved(r.start, r.start, r.goal))
          errors.push(`${at}: the board already matches before any move`);
        if (band === "3-5" && (r.kind !== "one-step" || r.goal?.length !== 1))
          errors.push(`${at}: grades 3-5 directions are one-step with one object`);
        if (band === "6-8") {
          if (!["two-step", "conditional"].includes(r.kind))
            errors.push(`${at}: grades 6-8 directions are two-step or conditional`);
          if (r.kind === "two-step" && r.goal?.length < 2)
            errors.push(`${at}: a two-step direction moves two objects`);
          if (!(r.terms || []).some((t) => VERBS.includes(t)))
            errors.push(`${at}: use an academic verb (place, position, transfer)`);
          if (
            r.kind === "conditional" &&
            !(r.terms || []).some((t) => ["if", "unless", "otherwise"].includes(t))
          )
            errors.push(`${at}: a conditional direction needs if, unless or otherwise`);
        }
      });
    }
    return errors;
  },
};
