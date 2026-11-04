// Reading X-Ray Vision: DOM for the `read` engine. render(task, env) -> html, mount(root, env).
// All resumable state lives in env.data.read; the pure rules live in ../engines/xray.js.
// Everything is tap or keyboard. Supports (frame, hint, X-Ray layers) are help items; the transfer passage and
// "on my own" render none of them.
import { html, icon, raw, toHtml } from "../../util.js";
import * as X from "../engines/xray.js";

const LAYER_META = {
  meaning: {
    name: ["Meaning", "Significado"],
    legend: ["Underlined: the key ideas and facts.", "Subrayado: las ideas y los datos clave."],
  },
  discourse: {
    name: ["Discourse", "Discurso"],
    legend: ["Dashed: words that connect ideas.", "Guiones: palabras que conectan ideas."],
  },
  sentence: {
    name: ["Sentence", "Oración"],
    legend: ["Boxed: how the sentence is built.", "En recuadro: cómo está construida la oración."],
  },
  word: {
    name: ["Word or phrase", "Palabra o frase"],
    legend: [
      "Dotted: a word or phrase worth knowing.",
      "Punteado: una palabra o frase que vale la pena conocer.",
    ],
  },
};
const STEPS = [
  ["Pick the claim", "Elige la afirmación"],
  ["Select evidence", "Selecciona evidencia"],
  ["Connect", "Conecta"],
  ["Explain", "Explica"],
  ["New passage", "Texto nuevo"],
];
const HINTS = [
  [
    "Ask of each sentence: if I took it away, would the claim be easier or harder to believe?",
    "Pregúntate de cada oración: si la quitara, ¿sería más fácil o más difícil creer la afirmación?",
  ],
  [
    "Evidence can be a number, a measurement, or a reason that explains how one thing leads to another.",
    "La evidencia puede ser un número, una medida o una razón que explica cómo una cosa lleva a otra.",
  ],
  [
    "A sentence on the same topic is not always evidence. Look for sentences that help prove the claim.",
    "Una oración del mismo tema no siempre es evidencia. Busca las que ayudan a probar la afirmación.",
  ],
];
const MARKS = {
  valid: ["check", ["Supports the claim", "Apoya la afirmación"]],
  weak: ["alert", ["On topic, but not support", "Del tema, pero no apoya"]],
  irrelevant: ["x", ["Not about this claim", "No trata de esta afirmación"]],
};

/** ARIA state attributes need the strings "true"/"false"; the html tag renders a bare false as nothing. */
const flag = (on) => (on ? "true" : "false");
const taskOf = (env) => env.pack?.understand?.read;
const fresh = (task) => ({
  stage: "main",
  main: X.init(task, "main"),
  transfer: null,
  ui: {},
  helps: [],
  ledgered: {},
  finished: false,
});
const sessionOf = (task, env) => (env.data?.read?.main ? env.data.read : fresh(task));
const stateOf = (s) => (s.stage === "transfer" ? s.transfer : s.main);
const withState = (s, st) => ({ ...s, [s.stage]: st });
const say = (env, pair) => env.announce?.(env.I.S(...pair));
/** Return markup that is both a util `html` value (safe to interpolate) and a string (safe for innerHTML). */
const markup = (r) => Object.defineProperty(r, "toString", { value: () => toHtml(r) });

function caps(task, env, s) {
  const off = s.stage === "transfer" || env.independent;
  return {
    layers: !off && X.LAYERS.some((l) => task.layers?.[l]?.length),
    frame: !off && env.support !== "C",
    hint: !off && env.support !== "C",
  };
}

function stepNo(s, st) {
  if (s.stage === "transfer") return 5;
  if (!st.claim) return 1;
  if (!st.link) return s.ui.ready ? 3 : 2;
  return st.explained ? 5 : 4;
}
function innerStep(st, ui) {
  if (!st.claim) return 1;
  if (!st.link) return ui.ready ? 3 : 2;
  return 4;
}

// ---------- pieces ----------

function banner(I, s, st) {
  const now = s.finished ? 6 : stepNo(s, st);
  const items = STEPS.map((label, i) => {
    const n = i + 1;
    const cls = n < now ? "is-done" : n === now ? "is-current" : "";
    return html`<li class="xr-step ${cls}" ${n === now ? raw('aria-current="step"') : ""}>
      <span class="xr-step-n">${n < now ? icon("check") : n}</span
      ><span class="xr-step-t">${I.T(...label)}</span>
    </li>`;
  });
  return html`<ol class="xr-steps" aria-label="${I.S("Steps", "Pasos")}">
    ${items}
  </ol>`;
}

function prompt(I, s, st, v) {
  const step = s.stage === "transfer" ? innerStep(st, s.ui) : stepNo(s, st);
  const lead =
    s.stage === "transfer"
      ? html`<strong>${I.T("New passage, on your own.", "Texto nuevo, tú solo.")}</strong> `
      : "";
  const text = {
    1: I.T(
      "Read the passage. Tap the sentence that is the claim: the idea the writer wants you to believe.",
      "Lee el texto. Toca la oración que es la afirmación: la idea que el autor quiere que creas.",
    ),
    2:
      s.stage === "transfer"
        ? I.T(
            "Tap the sentences that give evidence for the claim, then press Check.",
            "Toca las oraciones que dan evidencia para la afirmación y luego pulsa Revisar.",
          )
        : I.T(
            `Tap the sentences that give evidence for the claim (at least ${v.minValid}), then press Check.`,
            `Toca las oraciones que dan evidencia para la afirmación (al menos ${v.minValid}) y luego pulsa Revisar.`,
          ),
    3: I.T(
      "Your evidence is strong. Connect it to the claim.",
      "Tu evidencia es sólida. Conéctala con la afirmación.",
    ),
    4: I.T(
      "Explain in your own words how the evidence supports the claim.",
      "Explica con tus palabras cómo la evidencia apoya la afirmación.",
    ),
    5: I.T(
      "Main passage done. Now try a new passage on your own.",
      "Texto principal listo. Ahora prueba con un texto nuevo tú solo.",
    ),
  }[step];
  return html`<p class="xr-prompt">${lead}${text}</p>`;
}

function layerBar(I, task, st, ui) {
  const buttons = X.LAYERS.filter((l) => task.layers?.[l]?.length).map(
    (l) =>
      html`<button
        type="button"
        class="xr-seg"
        data-xr="layer"
        data-layer="${l}"
        aria-pressed="${flag(st.layer === l)}"
      >
        ${I.T(...LAYER_META[l].name)}
      </button>`,
  );
  let detail = "";
  if (st.layer) {
    const anns = X.layerAnnotations(task, st.layer);
    const open = anns.find((a) => a.id === ui.note);
    detail = html`<p class="xr-legend">
        <span class="xr-swatch xr-hl-${st.layer}" aria-hidden="true">Aa</span
        >${I.T(...LAYER_META[st.layer].legend)}
        ${I.T("Tap a note to read it.", "Toca una nota para leerla.")}
      </p>
      <ul class="xr-notes">
        ${anns.map(
          (a, i) =>
            html`<li>
              <button
                type="button"
                class="xr-notebtn"
                data-xr="note"
                data-ann="${a.id}"
                aria-pressed="${flag(a.id === ui.note)}"
              >
                <span class="xr-hl-n" aria-hidden="true">${i + 1}</span>${a.text}
              </button>
            </li>`,
        )}
      </ul>
      <p class="xr-note" role="status">
        ${open ? html`<strong>${open.text}</strong>: ${open.label}${open.def ? html` — ${open.def}` : ""}` : ""}
      </p>`;
  }
  return html`<div class="xr-layerbar">
    <p class="xr-layerlabel">${I.T("X-Ray layers", "Capas de rayos X")}</p>
    <div class="xr-layers" role="group" aria-label="${I.S("X-Ray layers", "Capas de rayos X")}">
      ${buttons}
    </div>
    ${detail}
  </div>`;
}

/** Sentence text with nested layer highlights and pronoun buttons. */
function sentenceText(task, env, s, st, sent) {
  const { I } = env;
  const ranges = [];
  const anns =
    st.layer && s.stage === "main" && caps(task, env, s).layers
      ? X.layerAnnotations(task, st.layer)
      : [];
  anns.forEach(
    (a, i) => a.s === sent.id && ranges.push({ ...a, kind: "ann", n: i + 1, priority: 1 }),
  );
  if (s.stage === "main")
    for (const r of X.referenceRanges(task))
      if (r.s === sent.id) ranges.push({ ...r, kind: "ref", priority: 2 });
  const view = X.stageView(task, s.stage);
  const walk = (nodes, from, to) => {
    const out = [];
    let pos = from;
    for (const n of nodes) {
      const r = n.range;
      out.push(sent.text.slice(pos, r.start));
      const inner = walk(n.children, r.start, r.end);
      if (r.kind === "ann")
        out.push(
          html`<mark class="xr-hl xr-hl-${st.layer}"
            >${inner}<sup class="xr-hl-n" aria-hidden="true">${r.n}</sup></mark
          >`,
        );
      else {
        const traced = st.refsTraced[r.idx]?.ok;
        out.push(
          html`<button
            type="button"
            class="xr-ref ${traced ? "is-traced" : ""}"
            data-xr="ref"
            data-ref="${r.idx}"
            aria-expanded="${flag(s.ui.tracing === r.idx)}"
            aria-label="${I.S(`Trace what “${r.text}” means`, `Rastrea qué significa “${r.text}”`)}"
          >
            ${inner}
          </button>`,
        );
        if (traced)
          out.push(
            html`<span class="xr-back"
              >${icon("arrow-left")}<span>${view.refs[r.idx].means}</span></span
            >`,
          );
      }
      pos = r.end;
    }
    out.push(sent.text.slice(pos, to));
    return out;
  };
  return walk(X.nestRanges(ranges), 0, sent.text.length);
}

function tracePanel(I, task, st, ui, idx) {
  const ref = X.stageView(task, "main").refs[idx];
  const done = st.refsTraced[idx]?.ok;
  const fb = ui.refFeedback?.idx === idx ? ui.refFeedback : null;
  const opts = X.referenceOptions(task, idx).map(
    (o) =>
      html`<button type="button" class="xr-opt" data-xr="opt" data-ref="${idx}" data-guess="${o}">
        ${o}
      </button>`,
  );
  return html`<div class="xr-trace">
    <p>
      <strong
        >${I.T(`What does “${ref.phrase}” mean here?`, `¿Qué significa “${ref.phrase}” aquí?`)}</strong
      >
    </p>
    ${done ? "" : html`<div class="xr-opts">${opts}</div>`}
    ${fb ? html`<p class="xr-trace-fb ${fb.ok ? "is-right" : "is-hint"}" role="status">${icon(fb.ok ? "check" : "info")}${I.T(...fb.message)}</p>` : ""}
  </div>`;
}

function sentenceRow(task, env, s, st, ui, sent, n) {
  const { I } = env;
  const isClaim = st.claim === sent.id;
  const picked = st.selected.includes(sent.id);
  const checked = ui.checked?.[sent.id];
  const linked = st.link?.evidence.includes(sent.id);
  const pressed = isClaim || picked;
  const cls = [
    isClaim && "is-claim",
    picked && "is-selected",
    linked && "is-linked",
    checked && `is-${checked.cls}`,
  ]
    .filter(Boolean)
    .join(" ");
  const locked = Boolean(st.link) || isClaim;
  const tag = isClaim
    ? html`<span class="xr-tag xr-tag-claim">${icon("flag")}${I.T("Claim", "Afirmación")}</span>`
    : linked
      ? html`<span class="xr-tag xr-tag-ev"
          >${icon("evidence")}${I.T(...(st.link.labels[sent.id] === "reason" ? ["Reason", "Razón"] : ["Evidence", "Evidencia"]))}</span
        >`
      : "";
  const [ico, label] = checked ? MARKS[checked.cls] : [];
  const mark = checked
    ? html`<span class="xr-mark xr-mark-${checked.cls}">${icon(ico)}${I.T(...label)}</span>`
    : "";
  const why =
    checked && checked.cls !== "valid"
      ? html`<p class="xr-why">${I.T("Why not: ", "Por qué no: ")}${I.T(...checked.note)}</p>`
      : "";
  const trace =
    s.stage === "main" &&
    X.referenceRanges(task).some((r) => r.s === sent.id && r.idx === ui.tracing)
      ? tracePanel(I, task, st, ui, ui.tracing)
      : "";
  return html`<li class="xr-sent ${cls}" data-sid="${sent.id}">
    <button
      type="button"
      class="xr-chip"
      data-xr="pick"
      data-sid="${sent.id}"
      aria-pressed="${flag(pressed)}"
      ${locked ? raw('aria-disabled="true"') : ""}
      aria-label="${I.S(`Sentence ${n}`, `Oración ${n}`)}: ${X.snippet(sent.text)}"
    >
      ${n}
    </button>
    <div class="xr-body">
      <p class="xr-text" lang="en">${sentenceText(task, env, s, st, sent)}</p>
      ${tag}${mark}${why}${trace}
    </div>
  </li>`;
}

function board(I, task, s, st) {
  const v = X.stageView(task, s.stage);
  const text = (id) => v.passage.find((x) => x.id === id)?.text;
  const rows = st.link.evidence.map(
    (id, i) =>
      html`<li class="xr-evrow" style="--i:${i}">
        <span class="xr-branch" aria-hidden="true"></span>
        <div class="xr-evcard">
          <span class="xr-tag xr-tag-ev"
            >${I.T(...(st.link.labels[id] === "reason" ? ["Reason", "Razón"] : ["Evidence", "Evidencia"]))}</span
          >
          <p lang="en">${text(id)}</p>
        </div>
      </li>`,
  );
  return html`<figure
    class="xr-board ${s.ui.fresh ? "is-fresh" : ""}"
    aria-label="${I.S("How the evidence connects to the claim", "Cómo la evidencia se conecta con la afirmación")}"
  >
    <div class="xr-claimcard">
      <span class="xr-tag xr-tag-claim">${icon("flag")}${I.T("Claim", "Afirmación")}</span>
      <p lang="en">${text(st.claim)}</p>
      <svg class="xr-arrow" viewBox="0 0 16 12" aria-hidden="true" focusable="false">
        <path d="M8 1 1 11h14z"></path>
      </svg>
    </div>
    <ul class="xr-ev">
      ${rows}
    </ul>
    <figcaption>
      ${I.T("Each piece of evidence points up to the claim it supports.", "Cada prueba señala hacia arriba la afirmación que apoya.")}
    </figcaption>
  </figure>`;
}

function explainPanel(env, task, s, st) {
  const { I } = env;
  const c = caps(task, env, s);
  const fb = s.ui.explainFeedback;
  const frame = X.stageView(task, s.stage).frame;
  const draft = s.ui.draft ?? st.explanation;
  return html`<div class="xr-explain">
    <label class="xr-label" for="xr-explain"
      >${I.T("Explain how the evidence supports the claim", "Explica cómo la evidencia apoya la afirmación")}</label
    >
    ${c.frame && !st.explained ? (s.ui.frameOpen ? html`<p class="xr-frame" lang="en">${icon("bulb")}${frame}</p>` : html`<button type="button" class="btn small ghost" data-xr="frame">${icon("bulb")} ${I.T("Show a sentence frame", "Mostrar un marco de oración")}</button>`) : ""}
    <textarea
      id="xr-explain"
      class="xr-explain-input"
      rows="4"
      lang="en"
      ${st.explained ? raw("disabled") : ""}
    >
${draft}</textarea>
    ${
      fb
        ? html`<div class="xr-feedback ${fb.ok ? "is-right" : "is-hint"}" role="status">
            ${icon(fb.ok ? "check" : "info")}
            <div>
              <p>${I.T(...fb.message)}</p>
              ${fb.next ? html`<p class="xr-next"><strong>${I.T("Next move: ", "Siguiente paso: ")}</strong>${I.T(...fb.next)}</p>` : ""}
            </div>
          </div>`
        : ""
    }
    ${st.explained ? "" : html`<div class="xr-actions"><button type="button" class="btn btn-primary" data-xr="explain">${I.T("Check my explanation", "Revisar mi explicación")}</button>${st.explainTries >= 2 ? html`<button type="button" class="btn btn-secondary" data-xr="keep">${I.T("Keep my explanation and continue", "Conservar mi explicación y continuar")}</button>` : ""}</div>`}
  </div>`;
}

function closing(env, s) {
  const { I } = env;
  if (s.finished) {
    const used = s.helps.length;
    return html`<section class="xr-done panel" aria-labelledby="xr-done-t">
      <h3 id="xr-done-t">
        ${icon("check")}
        ${I.T("You traced the evidence on two passages.", "Rastreaste la evidencia en dos textos.")}
      </h3>
      <p>
        ${I.T("You connected evidence to a claim and explained why it supports it, first with the passage open to help and then on a new passage.", "Conectaste evidencia con una afirmación y explicaste por qué la apoya, primero con ayuda y luego en un texto nuevo.")}
      </p>
      <p>
        ${used ? I.T("On the first passage you also opened help. The new passage was on your own.", "En el primer texto también abriste ayuda. El texto nuevo fue tú solo.") : I.T("You did the first passage without opening any help.", "Hiciste el primer texto sin abrir ninguna ayuda.")}
      </p>
    </section>`;
  }
  if (s.stage === "main" && s.main.explained)
    return html`<div class="xr-actions">
      <button type="button" class="btn btn-primary" data-xr="next">
        ${I.T("Try a new passage", "Probar un texto nuevo")} ${icon("arrow-right")}
      </button>
    </div>`;
  return "";
}

// ---------- render ----------

export function render(task, env) {
  const { I } = env;
  const s = sessionOf(task, env);
  const st = stateOf(s);
  const v = X.stageView(task, s.stage);
  const c = caps(task, env, s);
  const step = innerStep(st, s.ui);
  const fb = s.ui.feedback;
  const rows = v.passage.map((sent, i) => sentenceRow(task, env, s, st, s.ui, sent, i + 1));
  const actions =
    st.claim && !st.link
      ? html`<div class="xr-actions">
          <button
            type="button"
            class="btn btn-secondary"
            data-xr="check"
            ${st.selected.length ? "" : raw('aria-disabled="true"')}
          >
            ${I.T("Check my evidence", "Revisar mi evidencia")}
          </button>
          ${s.ui.ready ? html`<button type="button" class="btn btn-primary" data-xr="connect">${icon("evidence")} ${I.T("Connect the evidence to the claim", "Conectar la evidencia con la afirmación")}</button>` : ""}
          ${c.hint ? html`<button type="button" class="btn small ghost" data-xr="hint">${icon("bulb")} ${I.T("Give me a hint", "Dame una pista")}</button>` : ""}
        </div>`
      : "";
  return markup(
    html`<section class="xr d-reading" data-xr-root data-stage="${s.stage}" data-step="${step}">
      <header class="xr-head">
        <h2 class="xr-title">
          ${s.stage === "transfer" ? I.T("A new passage", "Un texto nuevo") : task.title}
        </h2>
        ${banner(I, s, st)}${s.finished ? "" : prompt(I, s, st, v)}
      </header>
      ${c.layers ? layerBar(I, task, st, s.ui) : ""}
      <ol class="xr-passage" aria-label="${I.S("Passage sentences", "Oraciones del texto")}">
        ${rows}
      </ol>
      <div class="xr-feedback-slot" role="status" aria-live="polite">
        ${
          fb
            ? html`<div class="xr-feedback ${fb.kind === "good" ? "is-right" : "is-hint"}">
                ${icon(fb.kind === "good" ? "check" : "info")}
                <p>${I.T(...fb.message)}</p>
              </div>`
            : ""
        }
      </div>
      ${actions} ${st.link ? board(I, task, s, st) : ""}
      ${st.link ? explainPanel(env, task, s, st) : ""} ${closing(env, s)}
    </section>`,
  );
}

// ---------- events ----------

function helpOnce(env, s, id) {
  if (s.helps.includes(id)) return s;
  env.help?.(id);
  return { ...s, helps: [...s.helps, id] };
}
const feedbackKind = (result) => (result.status === "sufficient" ? "good" : "hint");

function finishStage(env, task, s, st) {
  const stageKey = s.stage;
  let next = s;
  if (!s.ledgered[stageKey]) {
    env.ledger?.(
      X.ledgerEntry({
        missionId: env.missionId,
        band: env.band,
        klu: env.mission?.klu,
        stageKey,
        state: st,
        supportsUsed: s.helps,
        independent: env.independent,
      }),
    );
    next = { ...next, ledgered: { ...s.ledgered, [stageKey]: true } };
  }
  if (stageKey === "transfer" && !next.finished) {
    next = { ...next, finished: true };
    env.done?.({
      main: X.stageSummary(next.main),
      transfer: X.stageSummary(st),
      explanation: next.main.explanation,
      transferExplanation: st.explanation,
      supportsUsed: next.helps,
    });
  }
  return next;
}

function act(root, env, action, el) {
  const task = taskOf(env);
  let s = sessionOf(task, env);
  let st = stateOf(s);
  let ui = { ...s.ui, fresh: false };
  const input = root.querySelector(".xr-explain-input");
  if (input && !st.explained) ui.draft = input.value;
  const set = (patch) => (ui = { ...ui, ...patch });
  switch (action) {
    case "pick": {
      const id = el.dataset.sid;
      if (st.link || id === st.claim) break;
      if (!st.claim) {
        const r = X.chooseClaim(task, st, id);
        st = r.state;
        set({
          feedback: { kind: r.kind === "chosen" ? "good" : "hint", message: r.message },
          ready: false,
        });
        say(env, r.message);
      } else {
        st = X.toggleEvidence(st, id);
        const checked = { ...ui.checked };
        delete checked[id];
        set({ checked, ready: false, feedback: null });
      }
      break;
    }
    case "check": {
      if (!st.selected.length) break;
      const r = X.checkEvidence(task, st);
      st = r.state;
      set({
        checked: Object.fromEntries(
          r.result.items.map((i) => [i.id, { cls: i.cls, note: i.note }]),
        ),
        ready: r.result.status === "sufficient",
        feedback: { kind: feedbackKind(r.result), message: r.result.message },
      });
      say(env, r.result.message);
      break;
    }
    case "connect":
      st = X.buildLink(task, st);
      set({ ready: false, feedback: null, fresh: Boolean(st.link) });
      break;
    case "hint": {
      s = helpOnce(env, s, "hint");
      st = { ...st, hints: st.hints + 1 };
      set({ feedback: { kind: "hint", message: HINTS[(st.hints - 1) % HINTS.length] } });
      break;
    }
    case "frame":
      s = helpOnce(env, s, "frame");
      set({ frameOpen: true });
      break;
    case "layer":
      s = helpOnce(env, s, "xray");
      st = { ...st, layer: st.layer === el.dataset.layer ? null : el.dataset.layer };
      set({ note: null });
      break;
    case "note":
      set({ note: ui.note === el.dataset.ann ? null : el.dataset.ann });
      break;
    case "ref":
      set({ tracing: ui.tracing === Number(el.dataset.ref) ? null : Number(el.dataset.ref) });
      break;
    case "opt": {
      const idx = Number(el.dataset.ref);
      const r = X.traceReference(task, st, idx, el.dataset.guess);
      st = r.state;
      set({ refFeedback: { idx, ok: r.ok, message: r.message } });
      say(env, r.message);
      break;
    }
    case "explain":
    case "keep": {
      const r = X.submitExplanation(task, st, input?.value ?? "", { keep: action === "keep" });
      st = r.state;
      set({
        explainFeedback: { ok: r.result.ok, message: r.result.message, next: r.result.next },
        draft: undefined,
      });
      say(env, r.result.message);
      s = withState({ ...s, ui }, st);
      if (st.explained) s = finishStage(env, task, s, st);
      return env.update({ read: s });
    }
    case "next":
      st = X.init(task, "transfer");
      s = { ...s, stage: "transfer" };
      ui = {};
      break;
    default:
      return;
  }
  env.update({ read: withState({ ...s, ui }, st) });
}

const bound = new WeakMap();

export function mount(root, env) {
  const old = bound.get(root);
  if (old) {
    root.removeEventListener("click", old.click);
    root.removeEventListener("focusout", old.focusout);
  }
  const click = (e) => {
    const el = e.target.closest("[data-xr]");
    if (el && root.contains(el)) {
      if (el.getAttribute("aria-disabled") === "true" && el.dataset.xr !== "pick") return;
      return act(root, env, el.dataset.xr, el);
    }
    const row = e.target.closest(".xr-sent");
    if (row && root.contains(row) && !e.target.closest("button, textarea, a"))
      act(root, env, "pick", { dataset: { sid: row.dataset.sid } });
  };
  const focusout = (e) => {
    if (!e.target.matches?.(".xr-explain-input")) return;
    const to = e.relatedTarget;
    if (to && root.contains(to) && to.closest("button")) return;
    const task = taskOf(env);
    const s = sessionOf(task, env);
    if (stateOf(s)?.explained || e.target.value === (s.ui.draft ?? stateOf(s).explanation)) return;
    env.update({ read: { ...s, ui: { ...s.ui, draft: e.target.value } } });
  };
  root.addEventListener("click", click);
  root.addEventListener("focusout", focusout);
  bound.set(root, { click, focusout });
}
