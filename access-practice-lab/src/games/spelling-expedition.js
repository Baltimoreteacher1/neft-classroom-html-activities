// Spelling Expedition: climb a mountain by BUILDING words from parts. Each camp gives a meaning clue and a sentence
// with a gap; the learner assembles the word from prefix / base or root / suffix tiles (tap a tile to add it to the
// next open slot, or drag it onto any slot; tap a placed tile to send it back). Distractor tiles build real but wrong
// words. A right word moves the climber up one camp and opens a word-part card that teaches what each part means.
import { announce } from "../util.js";
import {
  audioBtn,
  dnd,
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
import { mountainSVG } from "./spelling-expedition-mountain.js";

const KINDS = {
  prefix: ["Prefix", "Prefijo"],
  base: ["Base word", "Palabra base"],
  root: ["Root", "Raíz"],
  suffix: ["Suffix", "Sufijo"],
  word: ["Word", "Palabra"],
  ending: ["Ending", "Terminación"],
};
const tileText = (p) =>
  p.kind === "prefix" ? `${p.t}-` : p.kind === "suffix" || p.kind === "ending" ? `-${p.t}` : p.t;
const rowsOf = (env) => env.content.rounds || [];
const src = (env, id) => rowsOf(env).find((r) => r.id === id);
const partOf = (c, t) => [...c.parts, ...c.decoys].find((p) => p.t === t);
const built = (row) =>
  row.slots
    .filter((x) => x !== null)
    .map((i) => row.tiles[i])
    .join("");
const say = (env, en, es) => announce(env.I.S(en, es), { toast: false });

/** Quick mode keeps the climb's range: evenly spaced rounds from easiest to hardest. */
function pick(rows, n) {
  if (n >= rows.length) return rows;
  if (n <= 1) return rows.slice(0, n);
  return Array.from({ length: n }, (_, k) => rows[Math.round((k * (rows.length - 1)) / (n - 1))]);
}

function place(row, tile, slot) {
  if (settled(row.rs) || !Number.isInteger(tile) || tile < 0 || tile >= row.tiles.length)
    return false;
  const k = slot ?? row.slots.indexOf(null);
  if (k < 0 || k >= row.slots.length) return false;
  const was = row.slots.indexOf(tile);
  if (was >= 0) row.slots[was] = null;
  row.slots[k] = tile;
  return true;
}

export default {
  id: "spelling-expedition",

  init(env) {
    const all = rowsOf(env);
    const rows = pick(all, env.count(all.length, Math.min(4, all.length)));
    return {
      i: 0,
      rounds: rows.map((r) => {
        const tiles = shuffle(
          [...r.parts, ...r.decoys].map((p) => p.t),
          env.rng,
        );
        const decoy = tiles.indexOf(r.decoys[0].t);
        return {
          id: r.id,
          tiles,
          answer: r.parts.map((p) => tiles.indexOf(p.t)),
          decoy,
          slots: r.parts.map(() => null),
          rs: newRound(),
          tried: "",
        };
      }),
    };
  },

  done: (s) => s.i >= s.rounds.length,
  progress: (s) => ({ done: s.rounds.filter((r) => settled(r.rs)).length, total: s.rounds.length }),

  view(s, env) {
    const I = env.I;
    const results = s.rounds.map((r) => (settled(r.rs) ? r.rs.status : null));
    const row = s.rounds[s.i];
    if (!row) {
      return html`<section class="se-game">
        <div class="se-map">${mountainSVG(results, false, I)}</div>
        <div class="se-summit" role="status">
          <h2>${I.T("You reached the summit!", "¡Llegaste a la cumbre!")}</h2>
          <p>
            ${I.T("Every camp is behind you. Each word you built is made of parts you can reuse.", "Todos los campamentos quedaron atrás. Cada palabra que formaste tiene partes que puedes volver a usar.")}
          </p>
        </div>
      </section>`;
    }
    const c = src(env, row.id);
    const p = this.progress(s);
    const done = settled(row.rs);
    return html`<section class="se-game" data-mechanic="word-parts">
      <div class="se-map">
        ${mountainSVG(results, done && row.rs.status === "right", I)}
        <p class="se-map-cap">
          ${icon("flag")}${I.T(`Camp ${s.i + 1} of ${s.rounds.length}`, `Campamento ${s.i + 1} de ${s.rounds.length}`)}
        </p>
      </div>
      <div class="se-play">
        ${pips(p.done, p.total, I.S(`${p.done} of ${p.total} camps climbed`, `${p.done} de ${p.total} campamentos escalados`), I.S)}
        ${clueHTML(c, row, done, env)} ${builderHTML(c, row, done, env)}
        ${hintHTML(row.rs, hintsFor(c, I), env, { disabled: done })}
        ${feedbackHTML(row.rs, {
          I,
          right: I.T(
            `You built “${c.word}.” Your climber moves up a camp!`,
            `Formaste “${c.word}”. ¡Tu escaladora sube un campamento!`,
          ),
          retry: I.T(
            `You built “${row.tried}.” That does not match the clue yet. Check what each part means, then swap a part.`,
            `Formaste “${row.tried}”. Todavía no coincide con la pista. Revisa qué significa cada parte y cambia una.`,
          ),
          answer: I.T(
            `The word is “${c.word}”: ${c.parts.map((x) => x.t).join(" + ")}. The guide roped you up to this camp.`,
            `La palabra es “${c.word}”: ${c.parts.map((x) => x.t).join(" + ")}. La guía te ayudó a subir a este campamento.`,
          ),
          explain: I.T(c.explain.en, c.explain.es),
        })}
        ${done ? cardHTML(c, env) : ""}
        <div class="gs-actions se-actions">
          ${done ? html`<button type="button" class="btn btn-primary btn-big" data-g-next>${icon("arrow-right")}${s.i + 1 === s.rounds.length ? I.T("Climb to the summit", "Subir a la cumbre") : I.T("Climb to the next camp", "Subir al siguiente campamento")}</button>` : ""}
        </div>
      </div>
    </section>`;
  },

  click(el, s, env) {
    const b = el.closest("button");
    const row = s.rounds[s.i];
    if (!b || !row) return false;
    const c = src(env, row.id);
    if (b.hasAttribute("data-g-next") && settled(row.rs)) {
      s.i += 1;
      return true;
    }
    if (settled(row.rs)) return false;
    if (b.dataset.seTile !== undefined) {
      const t = Number(b.dataset.seTile);
      if (!place(row, t, null)) {
        say(
          env,
          "Every slot is full. Tap a placed tile to send it back.",
          "Todos los espacios están llenos. Toca una ficha colocada para devolverla.",
        );
        return false;
      }
      say(
        env,
        `Added ${row.tiles[t]}. Your word so far: ${built(row)}.`,
        `Agregaste ${row.tiles[t]}. Tu palabra por ahora: ${built(row)}.`,
      );
      return true;
    }
    if (b.dataset.seSlot !== undefined) {
      const k = Number(b.dataset.seSlot);
      if (row.slots[k] === null) return false;
      const t = row.slots[k];
      row.slots[k] = null;
      say(env, `${row.tiles[t]} went back to the tiles.`, `${row.tiles[t]} volvió a las fichas.`);
      return true;
    }
    if (b.hasAttribute("data-se-undo")) {
      const k = row.slots.findLastIndex((x) => x !== null);
      if (k < 0) return false;
      row.slots[k] = null;
      return true;
    }
    if (b.hasAttribute("data-se-clear")) {
      row.slots = row.slots.map(() => null);
      return true;
    }
    if (b.hasAttribute("data-g-hint")) {
      takeHint(row.rs, env);
      return true;
    }
    if (b.hasAttribute("data-g-check") && row.slots.every((x) => x !== null)) {
      row.tried = built(row);
      judge(row.rs, row.tried === c.word, env, {
        id: row.id,
        skill: "word-parts",
        extra: { built: row.tried },
      });
      if (row.rs.status === "revealed") row.slots = [...row.answer];
      return true;
    }
    return false;
  },

  key(e, s) {
    const row = s.rounds[s.i];
    if (!row || settled(row.rs) || (e.key !== "Backspace" && e.key !== "Delete")) return false;
    const k = row.slots.findLastIndex((x) => x !== null);
    if (k < 0) return false;
    row.slots[k] = null;
    return true;
  },

  mount(root, s, env, changed) {
    const row = s.rounds[s.i];
    if (!row || settled(row.rs)) return null;
    return dnd(root, {
      onDrop: (tile, slot) => {
        if (place(row, Number(tile), Number(slot))) changed();
      },
    });
  },

  plan(s, { wrong } = {}) {
    const row = s.rounds[s.i];
    if (!row) return [];
    if (settled(row.rs)) return [{ click: "[data-g-next]" }];
    const order = wrong ? [row.decoy, ...row.answer.slice(1)] : row.answer;
    return [
      ...(row.slots.some((x) => x !== null) ? [{ click: "[data-se-clear]" }] : []),
      ...order.map((t) => ({ click: `[data-se-tile="${t}"]` })),
      { click: "[data-g-check]" },
    ];
  },

  validate(content) {
    const errs = [];
    const bi = (o) =>
      o && typeof o.en === "string" && o.en.trim() && typeof o.es === "string" && o.es.trim();
    for (const band of ["3-5", "6-8"]) {
      const rows = content.bands?.[band]?.rounds || [];
      if (rows.length < 10 || rows.length > 12)
        errs.push(`${band}: needs 10-12 authored camps (has ${rows.length})`);
      const ids = new Set();
      for (const r of rows) {
        const at = `${band}/${r.id}`;
        if (!r.id || ids.has(r.id)) errs.push(`${at}: missing or duplicate id`);
        ids.add(r.id);
        if (!r.word || !r.es) errs.push(`${at}: needs word and es gloss`);
        if (
          !Array.isArray(r.parts) ||
          r.parts.length < 2 ||
          !Array.isArray(r.decoys) ||
          r.decoys.length < 1
        ) {
          errs.push(`${at}: needs 2+ parts and 1+ decoy`);
          continue;
        }
        if (r.parts.map((x) => x.t).join("") !== r.word)
          errs.push(`${at}: parts do not spell the word`);
        const all = [...r.parts, ...r.decoys];
        if (new Set(all.map((x) => x.t)).size !== all.length)
          errs.push(`${at}: tile texts must be unique`);
        all.forEach((x) => {
          if (!KINDS[x.kind] || !x.t || !bi(x.mean))
            errs.push(`${at}/${x.t}: tile needs a kind, text and bilingual meaning`);
        });
        for (const f of ["meaning", "context", "hint", "explain"])
          if (!bi(r[f])) errs.push(`${at}: ${f} must be bilingual`);
        if (!r.context?.en?.includes("___")) errs.push(`${at}: context needs a ___ gap`);
        const leak = new RegExp(`\\b${r.word}\\b`, "i");
        if ([r.hint?.en, r.hint?.es, r.meaning?.en, r.context?.en].some((t) => leak.test(t || "")))
          errs.push(`${at}: hint, meaning or context gives the word away`);
      }
    }
    return errs;
  },
};

function hintsFor(c, I) {
  const first = c.parts[0];
  return [
    I.T(c.hint.en, c.hint.es),
    I.T(
      "Find the main part first (the base word or root). Then decide what goes before it and after it.",
      "Busca primero la parte principal (la palabra base o la raíz). Luego decide qué va antes y qué va después.",
    ),
    I.T(
      `The first part of the word means “${first.mean.en}.”`,
      `La primera parte de la palabra significa “${first.mean.es}”.`,
    ),
  ];
}

function clueHTML(c, row, done, env) {
  const I = env.I;
  const [pre, post] = c.context.en.split("___");
  const sofar = done ? c.word : built(row);
  const gap = sofar
    ? html`<span class="se-gap is-filled">${sofar}</span>`
    : html`<span class="se-gap" role="img" aria-label="${I.S("blank", "espacio en blanco")}"
        >&nbsp;</span
      >`;
  return html`<div class="se-clue">
    <p class="se-clue-k">${icon("search")}${I.T("Meaning clue", "Pista de significado")}</p>
    <p class="se-meaning">${c.meaning.en}</p>
    ${glossHTML(c.meaning.es, env)}
    <p class="se-context">${pre}${gap}${post}</p>
    <div class="se-clue-tools">
      ${audioBtn(c.context.en.replace("___", "blank"), I, I.S("Listen to the sentence", "Escuchar la oración"))}${glossHTML(c.context.es, env)}
    </div>
  </div>`;
}

function builderHTML(c, row, done, env) {
  const I = env.I;
  const labels = env.sup.frames !== "none";
  const kindOf = (t) => partOf(c, t)?.kind || "base";
  const slots = row.slots.map((t, k) => {
    const want = KINDS[c.parts[k].kind];
    const name = labels ? I.S(want[0], want[1]) : I.S(`Part ${k + 1}`, `Parte ${k + 1}`);
    const has = t !== null;
    const label = has
      ? I.S(
          `${name}: ${row.tiles[t]}. Tap to send it back.`,
          `${name}: ${row.tiles[t]}. Toca para devolverla.`,
        )
      : I.S(`${name}: empty. Drop a tile here.`, `${name}: vacío. Suelta una ficha aquí.`);
    return html`<li class="se-slot-li">
      ${k ? html`<span class="se-plus" aria-hidden="true">+</span>` : ""}<button
        type="button"
        class="se-slot${has ? " is-filled kind-" + kindOf(row.tiles[t]) : ""}"
        data-drop="${k}"
        data-se-slot="${k}"
        aria-label="${label}"
        ${done ? "disabled" : ""}
      >
        <span class="se-slot-k" aria-hidden="true">${name}</span
        ><span class="se-slot-t" aria-hidden="true"
          >${has ? tileText(partOf(c, row.tiles[t])) : "?"}</span
        >
      </button>
    </li>`;
  });
  const tiles = row.tiles.map((t, i) => {
    const part = partOf(c, t);
    const used = row.slots.includes(i);
    const kind = KINDS[part.kind];
    return html`<li>
      <button
        type="button"
        class="se-tile kind-${part.kind}${used ? " is-used" : ""}"
        data-se-tile="${i}"
        data-drag="${i}"
        aria-pressed="false"
        ${used || done ? "disabled" : ""}
        aria-label="${used ? I.S(`${tileText(part)}, placed`, `${tileText(part)}, colocada`) : I.S(`Add ${kind[0].toLowerCase()} ${tileText(part)}`, `Agregar ${kind[1].toLowerCase()} ${tileText(part)}`)}"
      >
        <span class="se-tile-t">${tileText(part)}</span
        >${labels ? html`<span class="se-tile-k">${I.T(kind[0], kind[1])}</span>` : ""}
      </button>
    </li>`;
  });
  const full = row.slots.every((x) => x !== null);
  const any = row.slots.some((x) => x !== null);
  return html`<div class="se-builder">
    <p class="gs-prompt se-how">
      ${I.T("Build the word: tap a tile to add it, or drag it onto a slot.", "Forma la palabra: toca una ficha para agregarla o arrástrala a un espacio.")}
    </p>
    <ol
      class="se-slots"
      aria-label="${I.S("Word builder", "Constructor de palabras")}"
      data-drop-zone
    >
      ${slots}
    </ol>
    <ul class="se-tray" aria-label="${I.S("Word part tiles", "Fichas de partes de palabras")}">
      ${tiles}
    </ul>
    ${
      done
        ? ""
        : html`<div class="se-tools">
            <button type="button" class="btn btn-primary" data-g-check ${full ? "" : "disabled"}>
              ${icon("check")}${I.T("Check my word", "Revisar mi palabra")}
            </button>
            <button type="button" class="btn small" data-se-undo ${any ? "" : "disabled"}>
              ${icon("arrow-left")}${I.T("Undo", "Deshacer")}
            </button>
            <button type="button" class="btn small" data-se-clear ${any ? "" : "disabled"}>
              ${icon("retry")}${I.T("Clear", "Borrar")}
            </button>
          </div>`
    }
  </div>`;
}

function cardHTML(c, env) {
  const I = env.I;
  const sentence = c.context.en.replace("___", c.word);
  const [pre, post] = c.context.en.split("___");
  return html`<section class="se-card" aria-labelledby="se-card-h">
    <p class="se-card-k">${icon("words")}${I.T("Word-part card", "Tarjeta de partes")}</p>
    <h3 id="se-card-h" class="se-card-word">${c.word}</h3>
    <div class="se-card-say">${audioBtn(c.word, I)}${glossHTML(c.es, env)}</div>
    <ul class="se-card-parts">
      ${c.parts.map(
        (x) =>
          html`<li>
            <span class="se-chip kind-${x.kind}">${tileText(x)}</span
            ><span class="se-eq" aria-hidden="true">=</span
            ><span class="se-mean"
              ><span class="visually-hidden">${I.S("means", "significa")} </span
              >${x.mean.en}${glossHTML(x.mean.es, env)}</span
            >
          </li>`,
      )}
    </ul>
    <p class="se-card-ex">
      ${pre}<strong>${c.word}</strong>${post}
      ${audioBtn(sentence, I, I.S("Listen to the example", "Escuchar el ejemplo"))}
    </p>
  </section>`;
}
