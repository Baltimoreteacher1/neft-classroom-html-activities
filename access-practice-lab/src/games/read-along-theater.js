// Read-Along Theater. The learner directs a three-page play. Every line can be heard (tap it); each page has
// one stage task that must be settled before the page turns: restore a missing word from context, pick the
// line that answers a cause / evidence question, or give each actor a feeling card (drag or tap-to-place).
// Stars depend on understanding (first try, revised, shown), never on speed. A curtain call retells the play
// in one framed sentence, then a playbill scoreboard closes the show.
import {
  audioBtn,
  dnd,
  feedbackHTML,
  frameBox,
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
import { C, mascot, svg } from "./art.js";
import { COLORS, stageArt } from "./read-along-theater-stage.js";

const TYPES = ["word", "line", "mood"];
const FACES = [
  "smile",
  "frown",
  "sleepy",
  "worry",
  "blush",
  "flat",
  "angry",
  "set",
  "grin",
  "soft",
];
const SETS = ["park", "home", "night", "school"];
const bandOf = (env) => (env.content.plays ? env.content : env.content.bands?.[env.band] || {});
const playOf = (s, env) => bandOf(env).plays.find((p) => p.id === s.play);
const T = (I, x) => I.T(x.en, x.es);
const sel = (a, v) => `[${a}="${v}"]`;

// ── scoring: understanding, never speed ─────────────────────────────────────────────────
const starsOf = (rs) =>
  !rs
    ? 0
    : rs.status === "right"
      ? rs.tries === 1 && rs.h === 0
        ? 3
        : 2
      : rs.status === "revealed"
        ? 1
        : 0;
const roundsOf = (ps) => (ps.kind === "mood" ? Object.values(ps.rs) : [ps.rs]);
const pageDone = (ps) => roundsOf(ps).every(settled);
const pageStars = (ps) => (pageDone(ps) ? Math.min(...roundsOf(ps).map(starsOf)) : 0);
const allRounds = (s) => [...s.pages.flatMap(roundsOf), s.call.rs];
function streak(s) {
  let n = 0;
  for (const rs of allRounds(s).filter(settled)) n = starsOf(rs) === 3 ? n + 1 : 0;
  return n;
}
const AWARD = {
  3: [
    "Spotlight",
    "Reflector",
    "You understood it on the first try with no hint.",
    "Lo entendiste al primer intento y sin pista.",
  ],
  2: [
    "Applause",
    "Aplausos",
    "You used a hint or revised, then got it.",
    "Usaste una pista o revisaste, y lo lograste.",
  ],
  1: [
    "Rehearsal",
    "Ensayo",
    "You saw how it works. Next time it will be easier.",
    "Viste cómo funciona. La próxima vez será más fácil.",
  ],
};

export default {
  id: "read-along-theater",

  init(env) {
    const plays = bandOf(env).plays;
    const play = plays[env.rng.int(plays.length)];
    const pages = play.pages.map((pg) => {
      const t = pg.task;
      if (t.type === "mood")
        return {
          kind: "mood",
          cards: shuffle(
            t.cards.map((c) => c.id),
            env.rng,
          ),
          hold: null,
          placed: {},
          last: null,
          rs: Object.fromEntries(play.cast.map((c) => [c.id, newRound()])),
        };
      if (t.type === "word")
        return {
          kind: "word",
          order: shuffle(
            t.options.map((_, i) => i),
            env.rng,
          ),
          pick: null,
          rs: newRound(),
        };
      return { kind: "line", pick: null, rs: newRound() };
    });
    const call = {
      order: play.retell.slots.map((sl) =>
        shuffle(
          sl.options.map((_, i) => i),
          env.rng,
        ),
      ),
      picks: play.retell.slots.map(() => -1),
      rs: newRound(),
    };
    return { play: play.id, page: 0, pages, call, heard: [], fx: null, flip: false, bowed: false };
  },

  done: (s) => s.bowed,
  progress(s) {
    return {
      done: s.pages.filter(pageDone).length + (settled(s.call.rs) ? 1 : 0),
      total: s.pages.length + 1,
    };
  },

  view(s, env) {
    const play = playOf(s, env);
    const inCall = s.page >= s.pages.length;
    const body = inCall ? callView(s, env, play) : pageView(s, env, play);
    return html`<section class="rat" data-mechanic="page-turn">
      ${playbill(s, env, play)}${stageArt(s, env, play, s.pages.filter(pageDone).length + (settled(s.call.rs) ? 1 : 0) + (s.bowed ? 1 : 0))}${coach(s, env, play)}${body}
    </section>`;
  },

  click(el, s, env) {
    const b = el.closest("button");
    if (!b) return false;
    const before = [s.fx, s.flip];
    s.fx = null;
    s.flip = false;
    const changed = act(b, s, env);
    if (!changed) [s.fx, s.flip] = before;
    return changed;
  },

  mount(root, s, env, changed) {
    // A line tap speaks through the shared [data-say] handler; remember it as "heard" without blocking speech.
    const onSay = (e) => {
      const line = e.target.closest("[data-rat-line]");
      if (!line || !root.contains(line)) return;
      if (!s.heard.includes(line.dataset.ratLine)) s.heard.push(line.dataset.ratLine);
      line.classList.add("is-heard");
    };
    root.addEventListener("click", onSay);
    if (s.flip) root.querySelector(".rat-page-h")?.focus();
    const ps = s.pages[s.page];
    const stop =
      ps?.kind === "mood"
        ? dnd(root, {
            I: env.I,
            onDrop: (card, cast) => {
              if (place(s, env, playOf(s, env), card, cast)) changed();
            },
          })
        : null;
    return () => {
      root.removeEventListener("click", onSay);
      stop?.();
    };
  },

  plan(s, { wrong } = {}, env) {
    if (s.bowed) return [];
    const play = playOf(s, env);
    if (s.page >= s.pages.length) {
      const c = s.call;
      if (settled(c.rs)) return [{ click: "[data-g-bow]" }];
      const steps = play.retell.slots.flatMap((sl, i) => {
        const target = wrong && i === 0 ? c.order[0].find((k) => k !== sl.answer) : sl.answer;
        return c.picks[i] === target ? [] : [{ click: `[data-g-slot="${i}:${target}"]` }];
      });
      return [...steps, { click: "[data-g-check]" }];
    }
    const ps = s.pages[s.page];
    const task = play.pages[s.page].task;
    if (pageDone(ps)) return [{ click: "[data-g-turn]" }];
    if (ps.kind === "mood") {
      const cast = nextCast(ps, play);
      const card = wrong
        ? ps.cards.find((id) => id !== task.fit[cast] && !Object.values(ps.placed).includes(id))
        : task.fit[cast];
      return [
        ...(ps.hold === card ? [] : [{ click: sel("data-drag", card) }]),
        { click: sel("data-drop", cast) },
      ];
    }
    const n = ps.kind === "word" ? task.options.length : play.pages[s.page].lines.length;
    const pick = wrong ? (task.answer + 1) % n : task.answer;
    return [
      { click: ps.kind === "word" ? sel("data-g-opt", pick) : sel("data-g-pickline", pick) },
      { click: "[data-g-check]" },
    ];
  },

  validate(content) {
    const errs = [];
    const bi = (x, at) => {
      if (!x?.en || !x?.es) errs.push(`${at}: needs en and es`);
      else if (x.en === x.es && /[a-z]{4}/i.test(x.en)) errs.push(`${at}: Spanish copies English`);
    };
    const leak = (hints, words, at) =>
      hints.forEach((h, i) =>
        words.forEach((w) => {
          if (new RegExp(`\\b${w}\\b`, "i").test(h.en))
            errs.push(`${at}/hint${i + 1}: leaks "${w}"`);
        }),
      );
    for (const band of ["3-5", "6-8"]) {
      const B = content.bands?.[band] || {};
      bi(B.frame, `${band}/frame`);
      if ((B.plays || []).length < 2) errs.push(`${band}: needs at least 2 plays`);
      for (const p of B.plays || []) {
        const at = `${band}/${p.id}`;
        bi(p.title, `${at}/title`);
        if (!SETS.includes(p.set)) errs.push(`${at}: unknown set "${p.set}"`);
        if (p.cast?.length !== 2 || p.cast.some((c) => !c.id || !c.name || !COLORS[c.color]))
          errs.push(`${at}: needs 2 cast members with id, name, color`);
        if (p.pages?.length !== 3) errs.push(`${at}: needs exactly 3 pages`);
        (p.pages || []).forEach((pg, i) => {
          const pa = `${at}/p${i + 1}`;
          const t = pg.task || {};
          if (pg.lines.length < 2 || pg.lines.length > 4) errs.push(`${pa}: 2-4 lines`);
          pg.lines.forEach((l, j) => bi(l, `${pa}/line${j + 1}`));
          if (!TYPES.includes(t.type)) return errs.push(`${pa}: unknown task type`);
          bi(t.prompt, `${pa}/prompt`);
          bi(t.explain, `${pa}/explain`);
          if (!(t.hints?.length >= 2)) errs.push(`${pa}: needs 2+ hints`);
          (t.hints || []).forEach((h, j) => {
            bi(h, `${pa}/hint${j + 1}`);
            if (h.en === t.explain?.en) errs.push(`${pa}: explanation repeats a hint`);
          });
          if (t.type === "word") {
            if (!/___/.test(pg.lines[t.line]?.en || "") || !/___/.test(pg.lines[t.line]?.es || ""))
              errs.push(`${pa}: gap line needs ___ in en and es`);
            if (pg.lines.some((l, j) => j !== t.line && /___/.test(l.en)))
              errs.push(`${pa}: only the gap line may have ___`);
            if (!(t.options?.length >= 3) || !Number.isInteger(t.answer) || !t.options[t.answer])
              errs.push(`${pa}: 3+ options and a valid answer`);
            (t.options || []).forEach((o, j) => bi(o, `${pa}/opt${j + 1}`));
            if (t.options?.[t.answer]) leak(t.hints, [t.options[t.answer].en], pa);
          } else if (t.type === "line") {
            if (!Number.isInteger(t.answer) || !pg.lines[t.answer])
              errs.push(`${pa}: answer must name a line`);
          } else {
            const ids = (t.cards || []).map((c) => c.id);
            (t.cards || []).forEach((c) => {
              bi(c, `${pa}/card ${c.id}`);
              if (!FACES.includes(c.face)) errs.push(`${pa}: card ${c.id} has unknown face`);
            });
            if (ids.length < 3 || new Set(ids).size !== ids.length)
              errs.push(`${pa}: 3+ unique feeling cards`);
            const fit = Object.entries(t.fit || {});
            if (
              fit.length !== p.cast.length ||
              fit.some(([k, v]) => !p.cast.some((c) => c.id === k) || !ids.includes(v)) ||
              new Set(fit.map((f) => f[1])).size !== fit.length
            )
              errs.push(`${pa}: fit must give each actor a different card`);
            leak(
              t.hints || [],
              fit.map((f) => f[1]),
              pa,
            );
          }
        });
        const r = p.retell || {};
        bi(r.explain, `${at}/retell`);
        if (r.slots?.length !== 3) errs.push(`${at}: retell needs 3 slots`);
        (r.slots || []).forEach((sl, i) => {
          if (!(sl.options?.length >= 3) || !sl.options[sl.answer])
            errs.push(`${at}/retell${i + 1}: 3+ options and a valid answer`);
          (sl.options || []).forEach((o, j) => bi(o, `${at}/retell${i + 1}/opt${j + 1}`));
        });
      }
    }
    return errs;
  },
};

// ── one click; true when state changed ─────────────────────────────────────────────────────
function act(b, s, env) {
  const play = playOf(s, env);
  if (b.hasAttribute("data-g-bow")) {
    if (!settled(s.call.rs)) return false;
    s.bowed = true;
    return true;
  }
  if (s.page >= s.pages.length) return callClick(b, s, env, play);
  const ps = s.pages[s.page];
  const task = play.pages[s.page].task;
  if (b.hasAttribute("data-g-turn")) {
    if (!pageDone(ps)) return false;
    s.page += 1;
    s.flip = true;
    return true;
  }
  if (b.hasAttribute("data-g-hint")) {
    const rs = ps.kind === "mood" ? ps.rs[nextCast(ps, play)] : ps.rs;
    return Boolean(rs && !settled(rs) && takeHint(rs, env) >= 0);
  }
  if (ps.kind === "mood") {
    if (b.dataset.drag !== undefined) {
      if (b.disabled) return false;
      ps.hold = ps.hold === b.dataset.drag ? null : b.dataset.drag;
      return true;
    }
    if (b.dataset.drop !== undefined && ps.hold)
      return place(s, env, play, ps.hold, b.dataset.drop);
    return false;
  }
  if (settled(ps.rs)) return false;
  if (b.dataset.gOpt !== undefined && ps.kind === "word") {
    ps.pick = Number(b.dataset.gOpt);
    return true;
  }
  if (b.dataset.gPickline !== undefined && ps.kind === "line") {
    ps.pick = Number(b.dataset.gPickline);
    return true;
  }
  if (b.hasAttribute("data-g-check") && ps.pick !== null) {
    judge(ps.rs, ps.pick === task.answer, env, {
      id: `${play.id}:p${s.page + 1}`,
      skill: `reading-${task.type === "word" ? "context" : "evidence"}`,
    });
    s.fx = ps.rs.status === "right" ? "right" : "miss";
    if (ps.rs.status === "retry") ps.pick = null;
    return true;
  }
  return false;
}

// ── mood placement (shared by tap-to-place and pointer drag) ───────────────────────────
function nextCast(ps, play) {
  return play.cast.map((c) => c.id).find((id) => !settled(ps.rs[id]));
}
function place(s, env, play, cardId, castId) {
  const ps = s.pages[s.page];
  if (!ps || ps.kind !== "mood") return false;
  const rs = ps.rs[castId];
  if (!rs || settled(rs) || Object.values(ps.placed).includes(cardId)) return false;
  const fit = play.pages[s.page].task.fit[castId];
  judge(rs, cardId === fit, env, {
    id: `${play.id}:p${s.page + 1}:${castId}`,
    skill: "reading-character-feelings",
  });
  if (settled(rs)) ps.placed[castId] = fit;
  ps.hold = null;
  ps.last = castId;
  s.fx = rs.status === "right" ? "right" : "miss";
  return true;
}

function callClick(b, s, env, play) {
  const c = s.call;
  if (settled(c.rs)) return false;
  if (b.dataset.gSlot !== undefined) {
    const [i, k] = b.dataset.gSlot.split(":").map(Number);
    if (!play.retell.slots[i]?.options[k]) return false;
    c.picks[i] = k;
    return true;
  }
  if (b.hasAttribute("data-g-hint")) return takeHint(c.rs, env) >= 0;
  if (b.hasAttribute("data-g-check") && c.picks.every((k) => k >= 0)) {
    const ok = play.retell.slots.every((sl, i) => c.picks[i] === sl.answer);
    judge(c.rs, ok, env, { id: `${play.id}:retell`, skill: "reading-retell" });
    s.fx = ok ? "right" : "miss";
    return true;
  }
  return false;
}

// ── header: playbill with one sticker per scene + the curtain call ─────────────────────
function playbill(s, env, play) {
  const I = env.I;
  const scores = [...s.pages.map(pageStars), settled(s.call.rs) ? starsOf(s.call.rs) : 0];
  const names = [
    I.S("Page 1", "Página 1"),
    I.S("Page 2", "Página 2"),
    I.S("Page 3", "Página 3"),
    I.S("Curtain call", "Despedida"),
  ];
  const run = streak(s);
  return html`<header class="rat-bill">
    <p class="rat-bill-t">${icon("star")}<span>${T(I, play.title)}</span></p>
    <ol class="rat-stickers" aria-label="${I.S("Playbill stickers", "Calcomanías del programa")}">
      ${scores.map((n, i) => html`<li class="rat-sticker is-s${n}${i === Math.min(s.page, 3) && !s.bowed ? " is-now" : ""}"><span class="rat-sticker-n" aria-hidden="true">${i < 3 ? i + 1 : icon("star")}</span><span class="visually-hidden">${names[i]}: ${n ? I.S(`${AWARD[n][0]} sticker`, `calcomanía de ${AWARD[n][1]}`) : I.S("not yet", "todavía no")}</span></li>`)}
    </ol>
    ${run >= 2 ? html`<p class="rat-streak">${icon("sparkle")}${I.T(`Spotlight streak: ${run}`, `Racha de reflector: ${run}`)}</p>` : ""}
  </header>`;
}

// ── the guide speaks to the director ─────────────────────────────────────────────────────
function coach(s, env, play) {
  const I = env.I;
  const inCall = s.page >= s.pages.length;
  const ps = inCall ? null : s.pages[s.page];
  const rs = inCall
    ? s.call.rs
    : ps.kind === "mood"
      ? ps.rs[ps.last] || ps.rs[nextCast(ps, play)]
      : ps.rs;
  const open = {
    word: [
      "A word fell out of the script! Read the words around the gap. They are your clues.",
      "¡Se cayó una palabra del guion! Lee las palabras alrededor del espacio. Son tus pistas.",
    ],
    line: [
      "Every line is a clue. Tap a line to hear it, then choose the one that answers the question.",
      "Cada línea es una pista. Toca una línea para oírla y luego elige la que responde la pregunta.",
    ],
    mood: [
      "Actors need to know how to feel. Read what each one says and does, then hand out the feeling cards.",
      "Los actores necesitan saber cómo sentirse. Lee lo que dice y hace cada uno y reparte las tarjetas.",
    ],
  };
  let msg = inCall
    ? [
        "Curtain call! Tell the whole play in one sentence: beginning, middle and end.",
        "¡Despedida! Cuenta toda la obra en una oración: principio, medio y final.",
      ]
    : open[ps.kind];
  if (rs?.status === "retry")
    msg = [
      "Good rehearsal. Mistakes are how directors learn. Take a hint and look at the lines again.",
      "Buen ensayo. Los errores ayudan a aprender. Pide una pista y mira las líneas otra vez.",
    ];
  else if (rs?.status === "right")
    msg =
      rs.tries === 1 && rs.h === 0
        ? [
            "Spotlight! You read the clues like a real director.",
            "¡Reflector! Leíste las pistas como un director de verdad.",
          ]
        : [
            "You revised and got it. That is exactly what directors do.",
            "Revisaste y lo lograste. Eso es justo lo que hacen los directores.",
          ];
  else if (rs?.status === "revealed")
    msg = [
      "Now you know why. Read the explanation, and the show goes on.",
      "Ahora sabes por qué. Lee la explicación y la función continúa.",
    ];
  if (inCall && settled(s.call.rs))
    msg = [
      "What a show! Look at your playbill, then take a bow.",
      "¡Qué función! Mira tu programa y luego haz una reverencia.",
    ];
  const mood =
    rs?.status === "right"
      ? "cheer"
      : rs?.status === "retry" || rs?.status === "open"
        ? "think"
        : "hi";
  return html`<div class="rat-coach">
    ${mascot(env.band === "3-5" ? "pip" : "juno", env.band, mood, 64)}
    <p class="rat-bubble">${I.T(msg[0], msg[1])}</p>
  </div>`;
}

// ── a page of the script ────────────────────────────────────────────────────────────────
function lineHTML(l, key, s, env, inner) {
  const heard = s.heard.includes(key);
  return html`<button
      type="button"
      class="rat-line${heard ? " is-heard" : ""}"
      data-say="${l.en.replace("___", "blank")}"
      data-rat-line="${key}"
      aria-label="${env.I.S("Listen", "Escuchar")}: ${l.en.replace("___", env.I.S("blank", "espacio en blanco"))}"
    >
      ${icon(heard ? "check" : "volume")}<span>${inner}</span></button
    >${glossHTML(l.es, env)}`;
}
function pageView(s, env, play) {
  const I = env.I;
  const pg = play.pages[s.page];
  const ps = s.pages[s.page];
  const t = pg.task;
  const fill = (l) => {
    const [a, b] = l.en.split("___");
    const word =
      ps.kind === "word" && settled(ps.rs)
        ? t.options[t.answer].en
        : ps.pick !== null && ps.kind === "word"
          ? t.options[ps.pick].en
          : "";
    return html`${a}<mark class="rat-gap${word ? " is-filled" : ""}"
        >${word || html`<span class="visually-hidden">${I.S("blank", "espacio en blanco")}</span>`}</mark
      >${b}`;
  };
  const lines = pg.lines.map((l, i) => {
    const key = `${s.page}:${i}`;
    if (ps.kind === "line") {
      const st = settled(ps.rs);
      const cls = `rat-pick${ps.pick === i ? " is-sel" : ""}${st && i === t.answer ? " is-right" : ""}`;
      return html`<li class="rat-row">
        ${audioBtn(l.en, I)}<button
          type="button"
          class="${cls}"
          data-g-pickline="${i}"
          aria-pressed="${ps.pick === i}"
          ${st ? "disabled" : ""}
        >
          ${l.en}</button
        >${glossHTML(l.es, env)}
      </li>`;
    }
    return html`<li class="rat-row${ps.kind === "word" && i === t.line ? " is-cue" : ""}">
      ${lineHTML(l, key, s, env, ps.kind === "word" && i === t.line ? fill(l) : l.en)}
    </li>`;
  });
  const body =
    ps.kind === "mood" ? moodTask(s, env, play) : ps.kind === "word" ? wordTask(ps, t, env) : "";
  const fb =
    ps.kind === "mood"
      ? moodFeedback(ps, t, env, play)
      : feedbackHTML(ps.rs, {
          I,
          right: I.T("Your choice is supported by the script.", "Tu elección se apoya en el guion."),
          retry: I.T(
            "Not this one yet. Use a clue from the lines and try again.",
            "Esta todavía no. Usa una pista de las líneas e inténtalo otra vez.",
          ),
          answer:
            ps.kind === "word"
              ? I.T(
                  `The missing word is “${t.options[t.answer].en}”.`,
                  `La palabra que falta es “${t.options[t.answer].en}” (${t.options[t.answer].es}).`,
                )
              : I.T(`The line: “${pg.lines[t.answer].en}”`, `La línea: “${pg.lines[t.answer].en}”`),
          explain: T(I, t.explain),
        });
  const hintRs = ps.kind === "mood" ? ps.rs[nextCast(ps, play)] || ps.rs[ps.last] : ps.rs;
  const turn = pageDone(ps)
    ? html`<button type="button" class="btn btn-primary btn-big" data-g-turn>
        ${icon("arrow-right")}${s.page < 2 ? I.T("Turn the page", "Pasar la página") : I.T("Go to the curtain call", "Ir a la despedida")}
      </button>`
    : ps.kind !== "mood"
      ? html`<button
          type="button"
          class="btn btn-primary btn-big"
          data-g-check
          ${ps.pick === null ? "disabled" : ""}
        >
          ${icon("check")}${I.T("Check my choice", "Revisar mi elección")}
        </button>`
      : "";
  return html`<article class="rat-page">
    <h2 class="rat-page-h" tabindex="-1">
      ${I.T(`Page ${s.page + 1} of 3`, `Página ${s.page + 1} de 3`)}
    </h2>
    <p class="fine">${I.T("Tap a line to hear it.", "Toca una línea para oírla.")}</p>
    <ol class="rat-lines">
      ${lines}
    </ol>
    <div class="rat-task">
      <p class="gs-prompt">${icon("bulb")}${T(I, t.prompt)}</p>
      ${body}
      ${hintHTML(
        hintRs || ps.rs,
        (t.hints || []).map((h) => T(I, h)),
        env,
        { disabled: !hintRs || settled(hintRs) },
      )}
      ${fb}
      <div class="gs-actions">${turn}</div>
    </div>
  </article>`;
}
function wordTask(ps, t, env) {
  const I = env.I;
  const st = settled(ps.rs);
  return html`<div
    class="gs-choices rat-props"
    role="group"
    aria-label="${I.S("Word cards", "Tarjetas de palabras")}"
  >
    ${ps.order.map((k) => html`<button type="button" class="gs-choice rat-prop${ps.pick === k ? " is-sel" : ""}${st && k === t.answer ? " is-right" : ""}" data-g-opt="${k}" aria-pressed="${ps.pick === k}" ${st ? "disabled" : ""}>${t.options[k].en}${glossHTML(t.options[k].es, env)}</button>`)}
  </div>`;
}
function moodTask(s, env, play) {
  const I = env.I;
  const ps = s.pages[s.page];
  const t = play.pages[s.page].task;
  const used = Object.values(ps.placed);
  const cards = ps.cards.map((id) => {
    const c = t.cards.find((x) => x.id === id);
    const gone = used.includes(id);
    return html`<li>
      <button
        type="button"
        class="rat-card${gone ? " is-used" : ""}"
        data-drag="${id}"
        aria-pressed="${ps.hold === id}"
        ${gone ? "disabled" : ""}
      >
        ${c.en}${glossHTML(c.es, env)}
      </button>
    </li>`;
  });
  const cast = play.cast.map((c) => {
    const card = t.cards.find((x) => x.id === ps.placed[c.id]);
    return html`<li class="rat-cast is-${c.color}" data-drop-in>
      <span class="rat-cast-n">${c.name}</span
      >${card ? html`<span class="rat-cast-f">${icon("check")}${card.en}</span>` : html`<button type="button" class="rat-drop" data-drop="${c.id}" aria-label="${I.S(`Give the card to ${c.name}`, `Darle la tarjeta a ${c.name}`)}" ${ps.hold ? "" : 'aria-disabled="true"'}>${ps.hold ? I.T("Place the card here", "Coloca la tarjeta aquí") : I.T("Pick a card first", "Primero elige una tarjeta")}</button>`}
    </li>`;
  });
  return html`<div class="rat-mood">
    <ul class="rat-cards" aria-label="${I.S("Feeling cards", "Tarjetas de sentimientos")}">
      ${cards}
    </ul>
    <ul class="rat-castlist" aria-label="${I.S("Actors", "Actores")}">
      ${cast}
    </ul>
  </div>`;
}
function moodFeedback(ps, t, env, play) {
  const I = env.I;
  const id = ps.last;
  if (!id) return "";
  const rs = ps.rs[id];
  const who = play.cast.find((c) => c.id === id).name;
  const fit = t.cards.find((c) => c.id === t.fit[id]);
  const finished = pageDone(ps);
  return feedbackHTML(rs, {
    I,
    right: finished
      ? I.T("Both actors have the right feeling.", "Los dos actores tienen el sentimiento correcto.")
      : I.T(
          `Yes, that fits ${who}. Now the other actor.`,
          `Sí, eso le queda a ${who}. Ahora el otro actor.`,
        ),
    retry: I.T(
      `That card does not match what ${who} says and does. Read ${who}'s line again.`,
      `Esa tarjeta no coincide con lo que ${who} dice y hace. Lee otra vez la línea de ${who}.`,
    ),
    answer: I.T(`${who} feels ${fit.en}.`, `${who} se siente: ${fit.es}.`),
    explain: finished ? T(I, t.explain) : "",
  });
}

// ── curtain call: retell the play in one framed sentence, then the playbill ──────────────
function callView(s, env, play) {
  const I = env.I;
  const c = s.call;
  const st = settled(c.rs);
  const labels =
    env.band === "3-5"
      ? [
          ["First", "Primero"],
          ["Then", "Luego"],
          ["In the end", "Al final"],
        ]
      : [
          ["At the beginning", "Al principio"],
          ["Then", "Luego"],
          ["By the end", "Al final"],
        ];
  const slots = play.retell.slots.map(
    (sl, i) =>
      html`<fieldset class="rat-slot">
        <legend>${I.T(labels[i][0], labels[i][1])}…</legend>
        <div class="gs-choices" role="group">
          ${c.order[i].map((k) => html`<button type="button" class="gs-choice${c.picks[i] === k ? " is-sel" : ""}${st && k === sl.answer ? " is-right" : ""}" data-g-slot="${i}:${k}" aria-pressed="${c.picks[i] === k}" ${st ? "disabled" : ""}>${sl.options[k].en}${glossHTML(sl.options[k].es, env)}</button>`)}
        </div>
      </fieldset>`,
  );
  const said = play.retell.slots
    .map((sl, i) => `${labels[i][0]}, ${sl.options[st ? sl.answer : c.picks[i]]?.en || "…"}.`)
    .join(" ");
  const hints = [
    I.T(
      "Each part must be something that really happened in the play. Check each choice against the pages.",
      "Cada parte debe ser algo que de verdad pasó en la obra. Compara cada opción con las páginas.",
    ),
    I.T(
      "Put the events in order: what started the problem, what happened next, and how it ended.",
      "Ordena los sucesos: qué empezó el problema, qué pasó después y cómo terminó.",
    ),
  ];
  return html`<article class="rat-page rat-call">
    <h2 class="rat-page-h" tabindex="-1">${I.T("Curtain call", "Despedida final")}</h2>
    <p class="gs-prompt">
      ${I.T("Retell the whole play. Choose one part for each part of the sentence.", "Vuelve a contar toda la obra. Elige una opción para cada parte de la oración.")}
    </p>
    ${frameBox(T(I, bandOf(env).frame), env)} ${slots}
    ${c.picks.every((k) => k >= 0) ? html`<p class="rat-said">${audioBtn(said, I, I.S("Listen to my retelling", "Escuchar mi resumen"))} <span>${said}</span></p>` : ""}
    ${hintHTML(c.rs, hints, env, { disabled: st })}
    ${feedbackHTML(c.rs, { I, right: I.T("Your retelling matches the play from beginning to end.", "Tu resumen coincide con la obra de principio a fin."), retry: I.T(`${play.retell.slots.filter((sl, i) => c.picks[i] !== sl.answer).length} part(s) do not match the play. Change them and check again.`, `${play.retell.slots.filter((sl, i) => c.picks[i] !== sl.answer).length} parte(s) no coinciden con la obra. Cámbialas y revisa otra vez.`), answer: said, explain: T(I, play.retell.explain) })}
    ${st ? scoreboard(s, env) : ""}
    <div class="gs-actions">
      ${st ? html`<button type="button" class="btn btn-primary btn-big" data-g-bow>${icon("medal")}${I.T("Take a bow", "Hacer una reverencia")}</button>` : html`<button type="button" class="btn btn-primary btn-big" data-g-check ${c.picks.every((k) => k >= 0) ? "" : "disabled"}>${icon("check")}${I.T("Check my retelling", "Revisar mi resumen")}</button>`}
    </div>
  </article>`;
}
function scoreboard(s, env) {
  const I = env.I;
  const scores = [...s.pages.map(pageStars), starsOf(s.call.rs)];
  const total = scores.reduce((a, b) => a + b, 0);
  const names = [
    ["Page 1", "Página 1"],
    ["Page 2", "Página 2"],
    ["Page 3", "Página 3"],
    ["Curtain call", "Despedida"],
  ];
  return html`<section class="rat-score" aria-labelledby="rat-score-h">
    <h3 id="rat-score-h">
      ${icon("star")}${I.T(`Applause meter: ${total} of 12 stars`, `Medidor de aplausos: ${total} de 12 estrellas`)}
    </h3>
    <ul>
      ${scores.map((n, i) => html`<li class="is-s${n}"><strong>${I.T(names[i][0], names[i][1])}</strong> <span class="rat-stars" aria-hidden="true">${[0, 1, 2].map((k) => html`<span class="rat-star${k < n ? " is-on" : ""}">${icon("star")}</span>`)}</span> <span>${I.T(AWARD[n][0], AWARD[n][1])}: ${I.T(AWARD[n][2], AWARD[n][3])}</span></li>`)}
    </ul>
  </section>`;
}
