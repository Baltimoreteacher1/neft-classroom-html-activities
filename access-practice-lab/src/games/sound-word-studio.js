// Sound & Word Studio: a music-studio mixer for multisyllable decoding. The learner HEARS a word, builds it one
// syllable at a time by putting syllable pads on mixer tracks (tap a pad to fill the next track, or drag it onto a
// track), checks the mix (every syllable in the right place lights its track), then finds the strong beat (the
// stressed syllable) and reads the whole word aloud. Each word carries a meaning line, a Spanish gloss that follows
// the support mode, and studio notes on its syllable types, stress and sound changes.
import { announce } from "../util.js";
import { audioBtn, dnd, glossHTML, html, judge, newRound, pips, settled, shuffle, takeHint } from "./engine.js";
import { TYPES, beatHTML, buildHTML, readHTML } from "./sound-word-studio-view.js";

const rowsOf = (env) => env.content.rounds || [];
const src = (env, id) => rowsOf(env).find((r) => r.id === id);
const say = (env, en, es) => announce(env.I.S(en, es), { toast: false });
const phaseOf = (row) => (!settled(row.rs) ? "build" : !settled(row.beat) ? "beat" : "read");
const mix = (row) => row.tracks.map((t) => (t === null ? "_" : row.pads[t])).join("-");

function pick(rows, n) {
  if (n >= rows.length) return rows;
  if (n <= 1) return rows.slice(0, n);
  return Array.from({ length: n }, (_, k) => rows[Math.round((k * (rows.length - 1)) / (n - 1))]);
}

function place(row, pad, track) {
  if (phaseOf(row) !== "build" || !Number.isInteger(pad) || pad < 0 || pad >= row.pads.length)
    return false;
  const k = track ?? row.tracks.indexOf(null);
  if (k < 0 || k >= row.tracks.length) return false;
  const was = row.tracks.indexOf(pad);
  if (was >= 0) {
    row.tracks[was] = null;
    row.lit[was] = null;
  }
  row.tracks[k] = pad;
  row.lit[k] = null;
  return true;
}

export default {
  id: "sound-word-studio",

  init(env) {
    const all = rowsOf(env);
    const rows = pick(all, env.count(all.length, Math.min(4, all.length)));
    return {
      i: 0,
      rounds: rows.map((r) => {
        const pads = shuffle([...r.syl, ...r.decoys], env.rng);
        return {
          id: r.id,
          pads,
          answer: r.syl.map((x) => pads.indexOf(x)),
          decoy: pads.indexOf(r.decoys[0]),
          stress: r.stress,
          n: r.syl.length,
          tracks: r.syl.map(() => null),
          lit: r.syl.map(() => null),
          rs: newRound(),
          beat: newRound(),
          pick: null,
          said: false,
        };
      }),
    };
  },

  done: (s) => s.i >= s.rounds.length,
  progress: (s) => ({
    done: s.rounds.filter((r) => settled(r.rs) && settled(r.beat)).length,
    total: s.rounds.length,
  }),

  view(s, env) {
    const I = env.I;
    const row = s.rounds[s.i];
    if (!row)
      return html`<section class="sw-studio">
        <p class="sw-wrap-up" role="status">
          ${I.T("That's a wrap! Every track is mixed.", "¡Terminamos! Todas las pistas están mezcladas.")}
        </p>
      </section>`;
    const c = src(env, row.id);
    const p = this.progress(s);
    const phase = phaseOf(row);
    const steps = [
      ["build", "1 · Build", "1 · Formar"],
      ["beat", "2 · Beat", "2 · Ritmo"],
      ["read", "3 · Read", "3 · Leer"],
    ];
    return html`<section class="sw-studio" data-mechanic="build-word" data-phase="${phase}">
      <header class="sw-console">
        <div class="sw-now">
          <p class="sw-now-k">
            <span class="sw-rec" aria-hidden="true"></span
            >${I.T(`Session ${s.i + 1} of ${s.rounds.length}`, `Sesión ${s.i + 1} de ${s.rounds.length}`)}
          </p>
          <div class="sw-play">
            ${audioBtn(c.word, I, I.S("Play the word", "Escuchar la palabra"))}
          </div>
          <p class="sw-meaning">
            <span class="sw-meaning-k">${I.T("Meaning", "Significado")}</span> ${c.meaning.en}
          </p>
          ${glossHTML(c.meaning.es, env)}
        </div>
        <ol class="sw-steps" aria-label="${I.S("Studio steps", "Pasos del estudio")}">
          ${steps.map(([k, en, es]) => html`<li class="${k === phase ? "is-now" : steps.findIndex((x) => x[0] === phase) > steps.findIndex((x) => x[0] === k) ? "is-done" : ""}" aria-current="${k === phase ? "step" : "false"}">${I.T(en, es)}</li>`)}
        </ol>
      </header>
      ${pips(p.done, p.total, I.S(`${p.done} of ${p.total} words mixed`, `${p.done} de ${p.total} palabras mezcladas`), I.S)}
      ${phase === "build" ? buildHTML(c, row, env) : phase === "beat" ? beatHTML(c, row, env) : readHTML(c, row, env, s)}
    </section>`;
  },

  click(el, s, env) {
    const b = el.closest("button");
    const row = s.rounds[s.i];
    if (!b || !row) return false;
    const c = src(env, row.id);
    const phase = phaseOf(row);
    if (phase === "read") {
      if (b.hasAttribute("data-sw-said")) {
        row.said = !row.said;
        return true;
      }
      if (b.hasAttribute("data-g-next")) {
        s.i += 1;
        return true;
      }
      return false;
    }
    if (phase === "beat") {
      if (b.dataset.swBeat !== undefined) {
        row.pick = Number(b.dataset.swBeat);
        return true;
      }
      if (b.hasAttribute("data-g-hint")) {
        takeHint(row.beat, env);
        return true;
      }
      if (b.hasAttribute("data-g-check") && row.pick !== null) {
        judge(row.beat, row.pick === c.stress, env, { id: `${row.id}:beat`, skill: "stress" });
        return true;
      }
      return false;
    }
    if (b.dataset.swPad !== undefined) {
      const t = Number(b.dataset.swPad);
      if (!place(row, t, null)) {
        say(
          env,
          "Every track is full. Tap a track to clear it.",
          "Todas las pistas están llenas. Toca una pista para vaciarla.",
        );
        return false;
      }
      say(
        env,
        `${row.pads[t]} on track ${row.tracks.indexOf(t) + 1}. Mix so far: ${mix(row)}.`,
        `${row.pads[t]} en la pista ${row.tracks.indexOf(t) + 1}. Mezcla por ahora: ${mix(row)}.`,
      );
      return true;
    }
    if (b.dataset.swTrack !== undefined) {
      const k = Number(b.dataset.swTrack);
      if (row.tracks[k] === null) return false;
      say(env, `Track ${k + 1} cleared.`, `Pista ${k + 1} vaciada.`);
      row.tracks[k] = null;
      row.lit[k] = null;
      return true;
    }
    if (b.hasAttribute("data-sw-clear")) {
      row.tracks = row.tracks.map(() => null);
      row.lit = row.lit.map(() => null);
      return true;
    }
    if (b.hasAttribute("data-g-hint")) {
      takeHint(row.rs, env);
      return true;
    }
    if (b.hasAttribute("data-g-check") && row.tracks.every((x) => x !== null)) {
      row.lit = row.tracks.map((t, k) => row.pads[t] === c.syl[k]);
      judge(row.rs, row.lit.every(Boolean), env, {
        id: row.id,
        skill: "syllables",
        extra: { built: mix(row) },
      });
      if (row.rs.status === "revealed") {
        row.tracks = [...row.answer];
        row.lit = row.lit.map(() => true);
      }
      const n = row.lit.filter(Boolean).length;
      if (row.rs.status === "retry")
        say(env, `${n} of ${row.n} tracks lit.`, `${n} de ${row.n} pistas encendidas.`);
      return true;
    }
    return false;
  },

  key(e, s) {
    const row = s.rounds[s.i];
    if (!row || phaseOf(row) !== "build" || (e.key !== "Backspace" && e.key !== "Delete"))
      return false;
    const k = row.tracks.findLastIndex((x) => x !== null);
    if (k < 0) return false;
    row.tracks[k] = null;
    row.lit[k] = null;
    return true;
  },

  mount(root, s, env, changed) {
    const row = s.rounds[s.i];
    if (!row || phaseOf(row) !== "build") return null;
    return dnd(root, {
      onDrop: (pad, track) => {
        if (place(row, Number(pad), Number(track))) changed();
      },
    });
  },

  plan(s, { wrong } = {}) {
    const row = s.rounds[s.i];
    if (!row) return [];
    const phase = phaseOf(row);
    if (phase === "read") return [{ click: "[data-g-next]" }];
    if (phase === "beat")
      return [
        { click: `[data-sw-beat="${wrong ? (row.stress + 1) % row.n : row.stress}"]` },
        { click: "[data-g-check]" },
      ];
    const order = wrong ? [row.decoy, ...row.answer.slice(1)] : row.answer;
    return [
      ...(row.tracks.some((x) => x !== null) ? [{ click: "[data-sw-clear]" }] : []),
      ...order.map((t) => ({ click: `[data-sw-pad="${t}"]` })),
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
        errs.push(`${band}: needs 10-12 authored words (has ${rows.length})`);
      const ids = new Set();
      for (const r of rows) {
        const at = `${band}/${r.id}`;
        if (!r.id || ids.has(r.id)) errs.push(`${at}: missing or duplicate id`);
        ids.add(r.id);
        if (!Array.isArray(r.syl) || r.syl.length < 2 || r.syl.join("") !== r.word) {
          errs.push(`${at}: syllables must spell the word`);
          continue;
        }
        if (!Number.isInteger(r.stress) || r.stress < 0 || r.stress >= r.syl.length)
          errs.push(`${at}: stress must index a syllable`);
        const pads = [...r.syl, ...(r.decoys || [])];
        if (!r.decoys?.length || new Set(pads).size !== pads.length)
          errs.push(`${at}: needs decoys, and every pad must be unique`);
        if (band === "3-5" && (!Array.isArray(r.types) || r.types.length !== r.syl.length))
          errs.push(`${at}: 3-5 words need a syllable type per syllable`);
        (r.types || []).forEach((t) => {
          if (!TYPES[t]) errs.push(`${at}: unknown syllable type ${t}`);
        });
        if (!r.es) errs.push(`${at}: needs a Spanish gloss`);
        for (const f of ["meaning", "hint", "explain"])
          if (!bi(r[f])) errs.push(`${at}: ${f} must be bilingual`);
        const leak = new RegExp(`\\b${r.word}\\b`, "i");
        const split = r.syl.join("-");
        if (
          [r.hint?.en, r.hint?.es, r.meaning?.en].some(
            (t) => leak.test(t || "") || (t || "").toLowerCase().includes(split),
          )
        )
          errs.push(`${at}: hint or meaning gives the word away`);
      }
    }
    return errs;
  },
};

