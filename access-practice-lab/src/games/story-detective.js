// Story Detective: an evidence-board mystery game. Each run opens case files with different twists
// (infer a feeling, infer what happened, spot the unsupported theory). In every case the learner
// (1) taps sentences in the case file to pin genuine clues on the evidence board (true-but-irrelevant
// details bounce off with a reason), (2) makes a two-part claim, the theory plus the single strongest
// clue, through the engine's miss -> hint -> revise -> reveal loop, and (3) closes the case for a
// sticker earned by reasoning quality (first try, hints, fake clues), never speed. Story text is
// English practice with Spanish glosses that follow the support mode; directions and feedback are
// bilingual and live with the cases in content/games/story-detective.json (`copy`).
import {
  audioBtn,
  feedbackHTML,
  frameBox,
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
import { C, mascot, stroke, svg } from "./art.js";

const TWISTS = ["feeling", "event", "unsupported"];
const GUIDE = "intro pin bounce solve usolve retry closed learner".split(" ");
const STEPS = "theory utheory link ulink".split(" ");
const BADGES = { sharp: C.gold, solid: C.teal, learner: C.coral };
const PROPS = "spell dog cookies umbrella book plant chat list ball fish trophy tomato".split(" ");
const FRAME = {
  claim: "I think ___ because the text says “___.”",
  unsupported: "The theory that ___ has no support because the text says “___.”",
};

const bandOf = (env) =>
  env.content.cases ? env.content : env.content.bands?.[env.band] || { cases: [] };
const copyOf = (env) => (env.contentAll || env.content).copy;
const caseOf = (env, id) => bandOf(env).cases.find((k) => k.id === id);
const cluesOf = (k) => k.sentences.map((x, n) => (x.clue ? n : -1)).filter((n) => n >= 0);
const isU = (k) => k.twist === "unsupported";
const tilt = (n) => [-3, 2, -1.5, 3, -2.5, 1.5][n % 6];
const fill = (s, v, lang) =>
  s.replace(/\{(\w+)\}/g, (_, key) => (typeof v[key] === "object" ? v[key][lang] : (v[key] ?? "")));
/** Bilingual copy { en, es } with {placeholders}; a var may itself be { en, es }. */
const say = (I, o, v = {}) => I.T(fill(o.en, v, "en"), fill(o.es, v, "es"));
const bi = (o) => Boolean(o?.en?.trim?.() && o.es?.trim?.() && o.es !== o.en);
const step = (c) => (c.stage === "pin" ? 0 : 1) + (settled(c.rs) ? 1 : 0);
const picks = () => ({ last: null, theory: null, link: null, miss: null, badge: null });
const fresh = (id, order) => ({ id, order, pins: [], bounced: [], fakes: 0, stage: "pin", ...picks() });

export default {
  id: "story-detective",

  init(env) {
    const all = bandOf(env).cases || [];
    const n = env.count(3, 2);
    const twists = n >= 3 ? TWISTS : shuffle(TWISTS, env.rng).slice(0, n);
    twists.sort((a, b) => TWISTS.indexOf(a) - TWISTS.indexOf(b));
    const pools = twists.map((t) => all.filter((k) => k.twist === t)).filter((x) => x.length);
    const cases = pools.map((pool) => {
      const k = pool[env.rng.int(pool.length)];
      const idx = k.theories.map((_, i) => i);
      return { ...fresh(k.id, shuffle(idx, env.rng)), prs: newRound(), rs: newRound() };
    });
    return { cases, i: 0, streak: 0, best: 0 };
  },

  done: (s) => s.i >= s.cases.length,
  progress(s) {
    return { done: s.cases.reduce((n, c) => n + step(c), 0), total: s.cases.length * 2 };
  },

  view(s, env) {
    const I = env.I;
    const c = s.cases[s.i];
    if (!c) return html`<p role="status">${I.T("All cases closed.", "Casos cerrados.")}</p>`;
    const k = caseOf(env, c.id);
    const cp = copyOf(env);
    const p = this.progress(s);
    const story = k.sentences.map((x) => x.en).join(" ");
    const n = `${s.i + 1}/${s.cases.length}`;
    const caseN = I.T(`Case ${n}`, `Caso ${n}`);
    return html`<section class="sd" data-mechanic="evidence-board">
      ${tabsHTML(s, env)}
      ${pips(p.done, p.total, I.S(`${p.done} of ${p.total} detective steps finished`, `${p.done} de ${p.total} pasos de detective terminados`), I.S)}
      <div class="sd-file">
        <div class="sd-head">
          <div class="sd-photo">${photo(k.prop, env.band, I.S(k.title.en, k.title.es))}</div>
          <div class="sd-head-t">
            <p class="sd-twist">${icon("detective")}${caseN} · ${say(I, cp.twist[k.twist])}</p>
            <h2 class="sd-title">${say(I, k.title)}</h2>
            <p class="sd-q">
              <strong>${I.T("The mystery:", "El misterio:")}</strong> ${k.question.en}
            </p>
            ${glossHTML(k.question.es, env)}
            ${audioBtn(`${k.question.en} ${story}`, I, I.S("Listen to the case", "Escuchar el caso"))}
          </div>
        </div>
        ${guideHTML(c, k, env)}
        <div class="sd-grid">${storyHTML(c, k, env)}${boardHTML(c, k, env)}</div>
        ${c.stage === "pin" ? hintHTML(c.prs, pinHints(c, k, env), env) : solveHTML(s, c, k, env)}
      </div>
    </section>`;
  },

  click(el, s, env) {
    const b = el.closest("button");
    const c = s.cases[s.i];
    if (!b || !c) return false;
    const k = caseOf(env, c.id);
    if (b.hasAttribute("data-g-next")) {
      if (!settled(c.rs)) return false;
      s.i += 1;
      return true;
    }
    if (b.hasAttribute("data-g-hint")) {
      c.last = null;
      return takeHint(c.stage === "pin" ? c.prs : c.rs, env) >= 0;
    }
    if (c.stage === "pin" && b.dataset.gClue !== undefined)
      return pin(c, k, Number(b.dataset.gClue), env);
    if (c.stage !== "solve" || settled(c.rs)) return false;
    if (b.dataset.gTheory !== undefined) c.theory = Number(b.dataset.gTheory);
    else if (b.dataset.gLink !== undefined) c.link = Number(b.dataset.gLink);
    else if (b.hasAttribute("data-g-check") && c.theory !== null && c.link !== null)
      check(s, c, k, env);
    else return false;
    c.last = null;
    return true;
  },

  plan(s, { wrong } = {}, env) {
    const c = s.cases[s.i];
    if (!c) return [];
    if (settled(c.rs)) return [{ click: "[data-g-next]" }];
    const k = caseOf(env, c.id);
    if (c.stage === "pin") {
      const fake = wrong ? k.sentences.findIndex((x, n) => !x.clue && !c.bounced.includes(n)) : -1;
      const n = fake >= 0 ? fake : cluesOf(k).find((x) => !c.pins.includes(x));
      return [{ click: `[data-g-clue="${n}"]` }];
    }
    const theory = wrong ? c.order.find((t) => t !== k.answer) : k.answer;
    const steps = [];
    if (c.theory !== theory) steps.push({ click: `[data-g-theory="${theory}"]` });
    if (c.link !== k.strongest) steps.push({ click: `[data-g-link="${k.strongest}"]` });
    return [...steps, { click: "[data-g-check]" }];
  },

  validate(content) {
    const errs = [];
    const cp = content.copy || {};
    const copyPairs = [
      ...TWISTS.flatMap((t) => [cp.twist?.[t], cp.lesson?.[t]]),
      ...Object.keys(BADGES).flatMap((b) => [cp.badge?.[b]?.name, cp.badge?.[b]?.why]),
      ...["theory", "link", "both", "utheory", "ulink", "uboth"].map((r) => cp.retry?.[r]),
      ...GUIDE.map((g) => cp.guide?.[g]),
      ...STEPS.map((g) => cp.step?.[g]),
      ...[0, 1, 2].map((h) => cp.pinHints?.[h]),
    ];
    if (!copyPairs.every(bi)) errs.push("copy: every interface string must be bilingual");
    const ids = new Set();
    for (const band of ["3-5", "6-8"]) {
      const cases = content.bands?.[band]?.cases || [];
      for (const t of TWISTS)
        if (!cases.some((k) => k.twist === t)) errs.push(`${band}: needs a "${t}" case`);
      for (const k of cases) errs.push(...caseErrors(k, `${band}/${k.id}`, ids));
    }
    return errs;
  },
};

function caseErrors(k, at, ids) {
  const errs = [];
  if (ids.has(k.id)) errs.push(`${at}: duplicate id`);
  ids.add(k.id);
  if (!TWISTS.includes(k.twist)) errs.push(`${at}: unknown twist`);
  if (!PROPS.includes(k.prop)) errs.push(`${at}: unknown prop art`);
  for (const f of ["title", "question", "explain"])
    if (!bi(k[f])) errs.push(`${at}: ${f} must be bilingual`);
  const s = k.sentences || [];
  if (s.length < 4 || s.length > 7) errs.push(`${at}: needs 4-7 sentences`);
  s.forEach((x, n) => {
    if (!bi(x)) errs.push(`${at}/s${n}: sentence must be bilingual`);
    if (!x.clue && !bi(x.why)) errs.push(`${at}/s${n}: a red herring needs a bilingual reason`);
  });
  const clues = cluesOf({ sentences: s });
  if (clues.length < 2 || clues.length === s.length)
    errs.push(`${at}: needs 2+ clues and 1+ red herring`);
  if (k.theories?.length !== 3 || !k.theories.every(bi))
    errs.push(`${at}: needs 3 bilingual theories`);
  if (!Number.isInteger(k.answer) || !k.theories?.[k.answer])
    errs.push(`${at}: answer must index a theory`);
  if (!clues.includes(k.strongest)) errs.push(`${at}: strongest must index a clue sentence`);
  if (k.hints?.length !== 3 || !k.hints.every(bi)) errs.push(`${at}: needs 3 bilingual hints`);
  const ans = k.theories?.[k.answer];
  const leaks = (h) => ["en", "es"].some((l) => h[l].toLowerCase().includes(ans[l].toLowerCase()));
  if (ans && k.hints?.some(leaks)) errs.push(`${at}: a hint leaks the answer`);
  if (k.explain && k.hints?.some((h) => h.en === k.explain.en))
    errs.push(`${at}: explanation repeats a hint`);
  return errs;
}

// ── actions ──────────────────────────────────────────────────────────────────────────────
function pin(c, k, n, env) {
  const x = k.sentences[n];
  if (!x || c.pins.includes(n)) return false;
  if (!x.clue) {
    c.fakes += 1;
    if (!c.bounced.includes(n)) c.bounced.push(n);
    c.last = { k: "bounce", n };
    return true;
  }
  c.pins.push(n);
  c.last = { k: "pin", n };
  if (cluesOf(k).every((i) => c.pins.includes(i))) {
    c.stage = "solve";
    // The clue hunt is its own learning round: first-try only with no fake clues and no hints.
    const first = c.fakes === 0 && c.prs.h === 0;
    const row = { id: `${c.id}:clues`, skill: "text-evidence", ok: true, first, hints: c.prs.h };
    env.report({ ...row, revised: c.fakes > 0, fakeClues: c.fakes, twist: k.twist });
  }
  return true;
}

function check(s, c, k, env) {
  const tOk = c.theory === k.answer;
  const lOk = c.link === k.strongest;
  c.miss = tOk && lOk ? null : !tOk && !lOk ? "both" : tOk ? "link" : "theory";
  const extra = { twist: k.twist, theoryOk: tOk, evidenceOk: lOk, fakeClues: c.fakes };
  judge(c.rs, tOk && lOk, env, { id: c.id, skill: "inference-evidence", extra });
  if (!settled(c.rs)) return;
  const first = c.rs.status === "right" && c.rs.tries === 1;
  const clean = first && c.rs.h === 0 && c.prs.h === 0 && c.fakes === 0;
  c.badge = c.rs.status === "revealed" ? "learner" : clean ? "sharp" : "solid";
  s.streak = first ? s.streak + 1 : 0;
  s.best = Math.max(s.best, s.streak);
}

// ── views ────────────────────────────────────────────────────────────────────────────────
function tabsHTML(s, env) {
  const I = env.I;
  const cp = copyOf(env);
  const tab = (c, j) => {
    const k = caseOf(env, c.id);
    const state = c.badge ? "is-done" : j === s.i ? "is-now" : "is-locked";
    const name = c.badge ? cp.badge[c.badge].name : null;
    const status = name
      ? I.S(`Closed: ${name.en}`, `Cerrado: ${name.es}`)
      : j === s.i
        ? I.S("Open now", "Abierto ahora")
        : I.S("Locked: close the case before it", "Bloqueado: cierra el caso anterior");
    const ic = c.badge ? sticker(c.badge, 34) : icon(j === s.i ? "detective" : "lock");
    return html`<li class="sd-tab ${state}">
      <span class="sd-tab-ic">${ic}</span>
      <span class="sd-tab-t"
        ><strong>${I.T(`Case ${j + 1}`, `Caso ${j + 1}`)}</strong
        ><small>${say(I, cp.twist[k.twist])}</small></span
      >
      <span class="visually-hidden">${status}</span>
    </li>`;
  };
  return html`<div class="sd-top">
    <ol class="sd-tabs" aria-label="${I.S("Case files", "Expedientes")}">
      ${s.cases.map(tab)}
    </ol>
    <p class="sd-streak${s.streak ? " is-hot" : ""}">
      ${icon("star")}<span
        >${I.T("Understanding streak", "Racha de comprensión")}: <strong>${s.streak}</strong></span
      >
    </p>
  </div>`;
}

function guideHTML(c, k, env) {
  const I = env.I;
  const g = copyOf(env).guide;
  const n = cluesOf(k).filter((x) => !c.pins.includes(x)).length;
  let mood = "hi";
  let line = say(I, g.intro, { n });
  if (settled(c.rs)) {
    mood = c.badge === "learner" ? "think" : "cheer";
    line =
      c.badge === "learner"
        ? say(I, g.learner)
        : say(I, g.closed, { badge: copyOf(env).badge[c.badge].name });
  } else if (c.stage === "solve") {
    mood = c.rs.status === "retry" ? "think" : "hi";
    line = say(I, c.rs.status === "retry" ? g.retry : isU(k) ? g.usolve : g.solve);
  } else if (c.last?.k === "bounce") {
    mood = "think";
    line = html`${say(I, g.bounce)} ${say(I, k.sentences[c.last.n].why)}`;
  } else if (c.last?.k === "pin") {
    mood = "cheer";
    line = say(I, g.pin, { n });
  }
  return html`<div class="sd-guide is-${mood}">
    ${mascot("juno", env.band, mood, 64)}
    <p class="sd-bubble" role="status" aria-live="polite">${line}</p>
  </div>`;
}

function storyHTML(c, k, env) {
  const I = env.I;
  const line = (x, n) => {
    const pinned = c.pins.includes(n);
    const bounced = c.bounced.includes(n);
    const shake = c.last?.k === "bounce" && c.last.n === n;
    const cls = `sd-line${pinned ? " is-pinned" : ""}${bounced ? " is-bounced" : ""}${shake ? " is-shake" : ""}`;
    const tag = pinned
      ? html`<span class="sd-tag is-clue">${icon("pin")}${I.T("Clue", "Pista")}</span>`
      : bounced
        ? html`<span class="sd-tag">${icon("x")}${I.T("Not a clue", "No es pista")}</span>`
        : "";
    const body = html`<span class="sd-line-t">${x.en}</span>${tag}`;
    const el =
      c.stage === "pin"
        ? html`<button
            type="button"
            class="${cls}"
            data-g-clue="${n}"
            aria-pressed="${pinned}"
            ${pinned ? "disabled" : ""}
          >
            ${body}
          </button>`
        : html`<p class="${cls} is-static">${body}</p>`;
    return html`<li>${el}${glossHTML(x.es, env)}</li>`;
  };
  const note =
    c.stage === "pin"
      ? html`<p class="sd-note">
          ${I.T("Tap a sentence to test it as a clue.", "Toca una oración para probarla como pista.")}
        </p>`
      : "";
  return html`<div class="sd-story">
    <h3 class="sd-h">${icon("reading")}${I.T("Case file", "Expediente")}</h3>
    ${note}
    <ol class="sd-lines">
      ${k.sentences.map(line)}
    </ol>
  </div>`;
}

function boardHTML(c, k, env) {
  const I = env.I;
  const total = cluesOf(k).length;
  const solved = settled(c.rs);
  const card = (n) => {
    const cls = `sd-card${c.last?.k === "pin" && c.last.n === n ? " is-new" : ""}${solved && n === k.strongest ? " is-proof" : ""}`;
    return html`<li class="${cls}" style="--tilt:${tilt(n)}deg">
      <span class="sd-pin" aria-hidden="true"></span>${k.sentences[n].en}
    </li>`;
  };
  const empty = Array.from(
    { length: total - c.pins.length },
    (_, j) =>
      html`<li class="sd-card is-empty" style="--tilt:${tilt(j + 3)}deg" aria-hidden="true">?</li>`,
  );
  const label = isU(k) ? I.T("No support:", "Sin apoyo:") : I.T("Solution:", "Solución:");
  const center = solved
    ? html`<span class="sd-stamp" aria-hidden="true">${I.S("SOLVED", "RESUELTO")}</span
        ><strong>${label}</strong> ${k.theories[k.answer].en}`
    : html`<span class="sd-q-mark" aria-hidden="true">?</span>${k.question.en}`;
  return html`<aside class="sd-board" aria-label="${I.S("Evidence board", "Tablero de evidencia")}">
    <h3 class="sd-h sd-board-h">
      ${icon("evidence")}${I.T("Evidence board", "Tablero de evidencia")}
      <span class="sd-count">${c.pins.length}/${total}</span>
    </h3>
    <ul class="sd-pins">
      ${c.pins.map(card)}${empty}
    </ul>
    <div class="sd-suspect${solved ? " is-solved" : ""}">${center}</div>
  </aside>`;
}

function solveHTML(s, c, k, env) {
  const I = env.I;
  const cp = copyOf(env);
  const done = settled(c.rs);
  const u = isU(k);
  const opt = (attr, v, sel, right, body, es = "") => {
    const cls = `gs-choice sd-opt sd-${attr}${sel ? " is-sel" : ""}${done && right ? " is-right" : ""}${done && sel && !right ? " is-miss" : ""}`;
    return html`<button
      type="button"
      class="${cls}"
      data-g-${attr}="${v}"
      aria-pressed="${sel}"
      ${done ? "disabled" : ""}
    >
      ${body}${glossHTML(es, env)}
    </button>`;
  };
  const theories = c.order.map((t) =>
    opt("theory", t, c.theory === t, t === k.answer, k.theories[t].en, k.theories[t].es),
  );
  const pinBody = (n) => html`<span class="sd-pin" aria-hidden="true"></span>${k.sentences[n].en}`;
  const links = c.pins.map((n) => opt("link", n, c.link === n, n === k.strongest, pinBody(n)));
  const step1 = say(I, cp.step[u ? "utheory" : "theory"]);
  const step2 = say(I, cp.step[u ? "ulink" : "link"]);
  const answer = html`${I.T("Solution:", "Solución:")} ${k.theories[k.answer].en} ·
  ${I.T("Proof:", "Prueba:")} “${k.sentences[k.strongest].en}”`;
  const fb = {
    I,
    right: I.T("Your theory and your evidence match.", "Tu teoría y tu evidencia coinciden."),
    retry: c.miss ? say(I, cp.retry[(u ? "u" : "") + c.miss]) : "",
    answer,
    explain: say(I, k.explain),
  };
  const ready = c.theory !== null && c.link !== null;
  const action = done
    ? closedHTML(s, c, env)
    : html`<div class="gs-actions">
        <button
          type="button"
          class="btn btn-primary btn-big"
          data-g-check
          ${ready ? "" : "disabled"}
        >
          ${icon("check")}${I.T("Close the case", "Cerrar el caso")}
        </button>
      </div>`;
  return html`<div class="sd-solve">
    <h3 class="sd-step"><span class="sd-step-n" aria-hidden="true">1</span>${step1}</h3>
    <div class="gs-choices" role="group" aria-label="${I.S("Theories", "Teorías")}">
      ${theories}
    </div>
    <h3 class="sd-step"><span class="sd-step-n" aria-hidden="true">2</span>${step2}</h3>
    <div
      class="gs-choices"
      role="group"
      aria-label="${I.S("Clues on your board", "Pistas de tu tablero")}"
    >
      ${links}
    </div>
    ${frameBox(u ? FRAME.unsupported : FRAME.claim, env, { label: I.T("Say your claim", "Di tu afirmación") })}
    ${hintHTML(
      c.rs,
      k.hints.map((h) => say(I, h)),
      env,
    )}
    ${feedbackHTML(c.rs, fb)} ${action}
  </div>`;
}

function closedHTML(s, c, env) {
  const I = env.I;
  const cp = copyOf(env);
  const b = cp.badge[c.badge];
  const last = s.i === s.cases.length - 1;
  const stat = (en, es, v) => html`<li><span>${I.T(en, es)}</span><strong>${v}</strong></li>`;
  const row = (x) => {
    const kk = caseOf(env, x.id);
    return html`<li>
      ${sticker(x.badge, 40)}<span
        ><strong>${say(I, kk.title)}</strong> · ${say(I, cp.badge[x.badge].name)}<br />${say(I, cp.lesson[kk.twist])}</span
      >
    </li>`;
  };
  const best = I.T(`Best understanding streak: ${s.best}`, `Mejor racha de comprensión: ${s.best}`);
  const recap = last
    ? html`<div class="sd-recap">
        <h3>${icon("medal")}${I.T("Your casebook", "Tu libro de casos")}</h3>
        <ul>
          ${s.cases.map(row)}
        </ul>
        <p class="fine">${best}</p>
      </div>`
    : "";
  const next = last
    ? I.T("Finish the casebook", "Terminar el libro de casos")
    : I.T("Open the next case file", "Abrir el siguiente expediente");
  return html`<div class="sd-closed">
      <div class="sd-sticker">${sticker(c.badge, 92)}</div>
      <div>
        <p class="sd-stamp-big" aria-hidden="true">${I.S("CASE CLOSED", "CASO CERRADO")}</p>
        <h3 class="sd-badge-n">${say(I, b.name)}</h3>
        <p>${say(I, b.why)}</p>
        <ul class="sd-stats">
          ${stat("Fake clues tested", "Pistas falsas probadas", c.fakes)}${stat("Hints opened", "Pistas abiertas", c.prs.h + c.rs.h)}${stat("Tries", "Intentos", c.rs.tries)}
        </ul>
      </div>
    </div>
    ${recap}
    <div class="gs-actions">
      <button type="button" class="btn btn-primary btn-big" data-g-next>
        ${icon("arrow-right")}${next}
      </button>
    </div>`;
}

function pinHints(c, k, env) {
  const n = cluesOf(k).filter((x) => !c.pins.includes(x)).length;
  return copyOf(env).pinHints.map((h) => say(env.I, h, { n }));
}

// ── art: case photos and stickers (original inline SVG, no purple) ───────────────────────
const o = (b) => stroke(b, 2.2);
const dot = (x, y, r, f) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${f}"/>`;
const drop = (x, y) => `<path d="M${x} ${y}q-3 5 0 7q3 -2 0 -7Z" fill="${C.sky}"/>`;
const paw = (x, y) =>
  `<g transform="translate(${x} ${y})" fill="${C.stoneDk}"><ellipse cy="3" rx="3.6" ry="3"/>${dot(-3.6, -2.6, 1.4, C.stoneDk)}${dot(0, -4, 1.4, C.stoneDk)}${dot(3.6, -2.6, 1.4, C.stoneDk)}</g>`;
const ART = {
  spell: (b) =>
    `<path d="M0 74h120v16H0Z" fill="${C.wood}"/><rect x="36" y="16" width="48" height="40" rx="5" fill="#fff" ${o(b)}/><text x="60" y="44" text-anchor="middle" font-size="20" font-weight="800" fill="${C.navy}">12</text><path d="M48 56v14M72 56v14" stroke="${C.navy}" stroke-width="3"/><text x="14" y="28" font-size="14" font-weight="800" fill="${C.coralDk}">A</text><text x="98" y="24" font-size="14" font-weight="800" fill="${C.tealDk}">B</text><text x="102" y="60" font-size="14" font-weight="800" fill="${C.goldDk}">C</text>`,
  dog: (b) =>
    `<rect x="74" y="8" width="36" height="72" rx="3" fill="${C.wood}" ${o(b)}/>${dot(102, 46, 3, C.gold)}<g transform="translate(42 54)"><path d="M18 8q16 -6 16 -20" fill="none" stroke="${C.woodDk}" stroke-width="5" stroke-linecap="round"/><ellipse cy="10" rx="20" ry="14" fill="${C.sand}" ${o(b)}/><circle cy="-10" r="14" fill="${C.sand}" ${o(b)}/><path d="M-12 -20q-10 6 -4 18ZM12 -20q10 6 4 18Z" fill="${C.woodDk}"/>${dot(-5, -12, 2.2, C.navy)}${dot(5, -12, 2.2, C.navy)}<ellipse cy="-5" rx="3.2" ry="2.2" fill="${C.navy}"/></g>`,
  cookies: (b) =>
    `<path d="M0 66h120v24H0Z" fill="${C.sand}"/><ellipse cx="54" cy="70" rx="34" ry="9" fill="#fff" ${o(b)}/>${dot(42, 68, 2.2, C.woodDk)}${dot(56, 72, 2.2, C.woodDk)}${dot(66, 66, 2.2, C.woodDk)}${dot(84, 80, 2.2, C.woodDk)}<circle cx="88" cy="30" r="12" fill="${C.goldDk}" ${o(b)}/>${dot(84, 26, 2, C.woodDk)}${dot(92, 32, 2, C.woodDk)}${paw(22, 34)}${paw(34, 22)}`,
  umbrella: (b) =>
    `<path d="M30 46a30 26 0 0 1 60 0q-7.5 -6 -15 0q-7.5 -6 -15 0q-7.5 -6 -15 0q-7.5 -6 -15 0Z" fill="${C.coral}" ${o(b)}/><path d="M60 46v24q0 6 -6 6" fill="none" stroke="${C.navy}" stroke-width="3" stroke-linecap="round"/>${drop(34, 58)}${drop(44, 66)}${drop(86, 60)}${drop(20, 20)}${drop(100, 16)}<ellipse cx="60" cy="84" rx="34" ry="4" fill="${C.sky}" opacity=".7"/>`,
  book: (b) =>
    `<rect x="22" y="22" width="48" height="58" rx="4" fill="${C.teal}" ${o(b)}/><path d="M30 30h32v26H30Z" fill="${C.tealLt}"/><path d="M36 52q4 -14 14 -12q8 2 6 10l4 2h-6q-2 -6 -8 -4l-2 6Z" fill="${C.leafDk}"/><text x="94" y="58" text-anchor="middle" font-size="44" font-weight="800" fill="${C.coral}">?</text>`,
  plant: (b) =>
    `${dot(98, 20, 11, C.gold)}<path d="M40 62h40l-5 22H45Z" fill="${C.coral}" ${o(b)}/><path d="M42 62h36" stroke="${C.woodDk}" stroke-width="5"/><path d="M60 62q0 -26 -18 -30" fill="none" stroke="${C.leafDk}" stroke-width="3.5" stroke-linecap="round"/><path d="M42 32q-14 4 -14 18q12 -4 14 -18Z" fill="${C.leafLt}" ${o(b)}/><path d="M56 46q14 2 16 14q-14 -2 -16 -14Z" fill="${C.leafLt}" ${o(b)}/>`,
  chat: (b) =>
    `<rect x="10" y="12" width="56" height="28" rx="12" fill="${C.coral}" ${o(b)}/><rect x="54" y="32" width="56" height="28" rx="12" fill="${C.teal}" ${o(b)}/><rect x="20" y="62" width="26" height="16" rx="8" fill="${C.stone}" ${o(b)}/><path d="M20 26h34M64 46h34" stroke="#fff" stroke-width="4" stroke-linecap="round"/><path d="M26 70h2M32 70h2M38 70h2" stroke="#fff" stroke-width="3" stroke-linecap="round"/>`,
  list: (b) =>
    `<rect x="30" y="8" width="60" height="76" rx="3" fill="#fff" ${o(b)}/><rect x="52" y="4" width="16" height="8" rx="2" fill="${C.gold}"/><path d="M38 22h44M38 32h36M38 42h44M38 52h36M38 62h44M38 72h36" stroke="${C.navy}" stroke-opacity=".45" stroke-width="3" stroke-linecap="round"/><path d="M96 54l-14 -6l4 -4l-6 -10l4 -2l8 10Z" fill="${C.sand}" ${o(b)}/>`,
  ball: (b) =>
    `<path d="M0 70h120v20H0Z" fill="${C.leafLt}"/><path d="M62 70V30l22 -16l22 16v40Z" fill="${C.wood}" ${o(b)}/><rect x="76" y="46" width="16" height="24" fill="${C.woodDk}"/><circle cx="34" cy="60" r="11" fill="#fff" ${o(b)}/><path d="M34 52l5 4l-2 6h-6l-2 -6Z" fill="${C.navy}"/><g fill="${C.woodDk}"><ellipse cx="10" cy="82" rx="3.4" ry="2"/><ellipse cx="20" cy="78" rx="3.4" ry="2"/><ellipse cx="46" cy="82" rx="3.4" ry="2"/><ellipse cx="56" cy="78" rx="3.4" ry="2"/></g>`,
  fish: (b) =>
    `<rect x="14" y="18" width="92" height="60" rx="6" fill="${C.skyLt}" ${o(b)}/><path d="M16 30h88" stroke="${C.sky}" stroke-width="3"/><g transform="translate(52 52)"><ellipse rx="14" ry="8" fill="${C.coral}" ${o(b)}/><path d="M12 0l10 -7v14Z" fill="${C.coral}" ${o(b)}/>${dot(-7, -2, 2, C.navy)}</g>${dot(76, 40, 3, "#fff")}${dot(82, 32, 2, "#fff")}<rect x="84" y="56" width="18" height="16" fill="${C.gold}" transform="rotate(6 93 64)"/><path d="M14 72h92" stroke="${C.leaf}" stroke-width="5"/>`,
  trophy: (b) =>
    `<rect x="70" y="8" width="40" height="46" fill="${C.skyLt}" ${o(b)}/><path d="M90 8v46M70 31h40" stroke="${C.navy}" stroke-width="2"/><path d="M74 12q8 16 2 38" fill="none" stroke="${C.coral}" stroke-width="4"/><path d="M0 76h120v14H0Z" fill="${C.wood}"/><path d="M18 62h24l-4 12H22Z" fill="${C.gold}" ${o(b)}/><path d="M24 50l-6 -12h24l-6 12Z" fill="${C.gold}" ${o(b)} transform="rotate(-24 30 44)"/><path d="M48 70l8 -4l2 6ZM14 72l-6 -2l4 -5Z" fill="${C.goldDk}"/>`,
  tomato: (b) =>
    `<circle cx="50" cy="48" r="24" fill="${C.coral}" ${o(b)}/><path d="M66 32a10 10 0 1 0 8 14" fill="${C.paper}"/><path d="M50 26l-6 -6M50 26l6 -7M50 26v-8" stroke="${C.leafDk}" stroke-width="3.5" stroke-linecap="round"/>${paw(92, 30)}${paw(100, 46)}${paw(92, 62)}${paw(100, 78)}`,
};
const MARK = {
  sharp: `<path d="M0 -12l3.5 7l7.8 1.1l-5.6 5.5l1.3 7.8L0 5.7l-7 3.7l1.3 -7.8l-5.6 -5.5l7.8 -1.1Z" fill="${C.goldDk}"/>`,
  solid: `<circle cx="-2" cy="-2" r="7" fill="none" stroke="${C.tealDk}" stroke-width="3.4"/><path d="M3 3l7 7" stroke="${C.tealDk}" stroke-width="4" stroke-linecap="round"/>`,
  learner: `<path d="M-10 -8q5 -3 10 0v16q-5 -3 -10 0ZM10 -8q-5 -3 -10 0v16q5 -3 10 0Z" fill="#fff" stroke="${C.coralDk}" stroke-width="2"/>`,
};
function photo(prop, band, label) {
  const bg = `<rect width="120" height="90" fill="${band === "6-8" ? "#eef5f8" : C.paper}"/>`;
  return svg("0 0 120 90", bg + (ART[prop] || ART.book)(band), { label, cls: "sd-photo-art" });
}
function sticker(kind, size) {
  const ribbons = `<path d="M-14 16l-6 14l8 -3l5 6l4 -14ZM14 16l6 14l-8 -3l-5 6l-4 -14Z" fill="${C.navy}"/>`;
  const disc = `<circle r="24" fill="${BADGES[kind] || C.teal}" stroke="${C.navy}" stroke-width="3"/><circle r="17" fill="#fff" opacity=".92"/>`;
  const style = `width:${size}px;height:${size}px`;
  return svg("-30 -30 60 60", ribbons + disc + (MARK[kind] || ""), {
    cls: `sd-sticker-art is-${kind}`,
    style,
  });
}
