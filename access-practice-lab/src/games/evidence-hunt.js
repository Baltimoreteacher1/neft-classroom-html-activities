// Evidence Hunt: a case-file game for citing text evidence. Each round shows a short original
// informational passage and a claim. The learner (1) taps the ONE sentence that best proves the claim
// (distractors are true-but-irrelevant, too general or point the other way, and each says why when
// tapped), (2) chooses the reasoning that links that evidence to the claim, and (3) on Expanding mode or
// in grades 6-8 writes one sentence, "The text says ___, which shows ___." Step 3 is never graded: simple
// rule checks quote the learner's own words back as specific feedback. Steps 1 and 2 use the engine's
// miss -> hint -> revise -> reveal loop. Proven evidence fills the case board. Passage text is English
// practice; key-word glosses follow the support mode; directions and feedback are bilingual.
import {
  audioBtn,
  countWords,
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
import { renderBoard } from "./evidence-hunt-view.js";

const KINDS = ["proof", "general", "irrelevant", "opposite"];
const FRAME = "The text says ___, which shows ___.";
const LINKS = [
  "which shows",
  "this shows",
  "shows",
  "show",
  "proves",
  "prove",
  "means",
  "because",
  "so",
  "tells us",
  "explains",
  "demonstrates",
];
const STOP = new Set(
  "text says shows that this with from they their there them then than have were when what which while into about after also some many most more much your will just only very such each been being does like over under onto upon".split(
    " ",
  ),
);
const REASON_HINTS = [
  [
    "Read your evidence sentence again. Which reason uses an idea from it?",
    "Lee otra vez tu oración de evidencia. ¿Qué razón usa una idea de ella?",
  ],
  [
    "A strong reason explains HOW the evidence proves the claim. It does not change the topic.",
    "Una razón fuerte explica CÓMO la evidencia prueba la afirmación. No cambia de tema.",
  ],
  [
    "Check the claim's key words. The best reason connects them to the evidence.",
    "Revisa las palabras clave de la afirmación. La mejor razón las une con la evidencia.",
  ],
];

const bandOf = (env) =>
  env.content.passages ? env.content : env.content.bands?.[env.band] || { passages: [] };
const passageOf = (env, id) => bandOf(env).passages.find((p) => p.id === id);
const proofOf = (p) => p.sentences.findIndex((x) => x.kind === "proof");
const bi = (o) => Boolean(o?.en?.trim?.() && o?.es?.trim?.() && o.es !== o.en);
const say = (I, o) => I.T(o.en, o.es);
const writes = (env) => env.support === "C" || env.band === "6-8";
export const words = (t) =>
  (
    String(t || "")
      .toLowerCase()
      .match(/[a-z][a-z'-]*/g) || []
  ).map((w) => w.replace(/'s$/, ""));
const content = (t) => [...new Set(words(t).filter((w) => w.length >= 4 && !STOP.has(w)))];
const stem = (w) => (w.length > 4 ? w.replace(/ies$/, "y").replace(/(ing|ed|es|s)$/, "") : w);
const near = (a, b) => {
  const [x, y] = [stem(a), stem(b)];
  return x === y || (x.length >= 5 && y.length >= 5 && x.slice(0, 5) === y.slice(0, 5));
};
const stepsOf = (r) => 2 + (r.write ? 1 : 0);
const stepsDone = (r) =>
  (settled(r.ers) ? 1 : 0) + (settled(r.rrs) ? 1 : 0) + (r.write && r.wn > 0 ? 1 : 0);

export default {
  id: "evidence-hunt",

  init(env) {
    const pool = bandOf(env).passages || [];
    const picked = shuffle(pool, env.rng).slice(0, Math.min(pool.length, env.count(6, 3)));
    const write = writes(env);
    const rounds = picked.map((p) => ({
      id: p.id,
      order: shuffle(
        p.reasons.map((_, i) => i),
        env.rng,
      ),
      ers: newRound(),
      rrs: newRound(),
      reason: null,
      write,
      text: "",
      wn: 0,
      wfb: null,
      words: false,
      frame: false,
    }));
    return { rounds, i: 0 };
  },

  done: (s) => s.i >= s.rounds.length,
  progress(s) {
    return {
      done: s.rounds.reduce((n, r) => n + stepsDone(r), 0),
      total: s.rounds.reduce((n, r) => n + stepsOf(r), 0),
    };
  },

  view(s, env) {
    const I = env.I;
    const r = s.rounds[s.i];
    if (!r)
      return html`<p role="status">
        ${I.T("Every case is proven.", "Todos los casos están probados.")}
      </p>`;
    const p = passageOf(env, r.id);
    const pr = this.progress(s);
    const n = `${s.i + 1}/${s.rounds.length}`;
    const text = p.sentences.map((x) => x.en).join(" ");
    return html`<section class="eh" data-mechanic="evidence-case-file">
      ${pips(pr.done, pr.total, I.S(`${pr.done} of ${pr.total} evidence steps finished`, `${pr.done} de ${pr.total} pasos de evidencia terminados`), I.S)}
      <div class="eh-desk">
        <article class="eh-file">
          <header class="eh-head">
            <span class="eh-lens" aria-hidden="true">${icon("detective")}</span>
            <div class="eh-head-t">
              <p class="eh-tab">${I.T(`Case file ${n}`, `Expediente ${n}`)} · ${say(I, p.topic)}</p>
              <h2 class="eh-title">${say(I, p.title)}</h2>
            </div>
          </header>
          <div class="eh-claim">
            <p class="eh-claim-l">
              ${I.T("The claim to prove", "La afirmación que hay que probar")}
            </p>
            <p class="eh-claim-t">${p.claim.en}</p>
            ${glossHTML(p.claim.es, env)}
          </div>
          <div class="eh-tools">
            ${audioBtn(`${p.claim.en} ${text}`, I, I.S("Listen to the case file", "Escuchar el expediente"))}${keysHTML(r, p, env)}
          </div>
          ${stripsHTML(r, p, env)}
        </article>
        ${renderBoard(s, env, passageOf)}
      </div>
      ${stageHTML(s, r, p, env)}
    </section>`;
  },

  click(el, s, env) {
    const b = el.closest("button");
    const r = s.rounds[s.i];
    if (!b || !r) return false;
    const p = passageOf(env, r.id);
    if (b.hasAttribute("data-g-next")) {
      if (!settled(r.rrs) || (r.write && !r.wn)) return false;
      s.i += 1;
      return true;
    }
    if (b.hasAttribute("data-g-words")) {
      if (r.words) return false;
      r.words = true;
      env.use("gloss");
      return true;
    }
    if (b.hasAttribute("data-g-frame")) {
      if (r.frame) return false;
      r.frame = true;
      env.use("frame");
      return true;
    }
    if (b.hasAttribute("data-g-hint")) return takeHint(settled(r.ers) ? r.rrs : r.ers, env) >= 0;
    if (b.dataset.gEv !== undefined) return pickEvidence(r, p, Number(b.dataset.gEv), env);
    if (b.dataset.gReason !== undefined) return pickReason(r, p, Number(b.dataset.gReason), env);
    if (b.hasAttribute("data-g-wcheck")) return checkWriting(r, p);
    return false;
  },

  input(el, s) {
    const r = s.rounds[s.i];
    if (r && el.matches?.("[data-g-write]")) r.text = String(el.value || "").slice(0, 400);
    return false; // saved with the next click; re-rendering here would drop the cursor mid-word
  },

  plan(s, { wrong } = {}, env) {
    const r = s.rounds[s.i];
    if (!r) return [];
    const p = passageOf(env, r.id);
    if (!settled(r.ers)) {
      const miss = wrong
        ? p.sentences.findIndex((x, n) => x.kind !== "proof" && !r.ers.picks.includes(n))
        : -1;
      return [{ click: `[data-g-ev="${miss >= 0 ? miss : proofOf(p)}"]` }];
    }
    if (!settled(r.rrs)) {
      const miss = wrong
        ? r.order.find((i) => i !== p.reason && !r.rrs.picks.includes(i))
        : undefined;
      return [{ click: `[data-g-reason="${miss ?? p.reason}"]` }];
    }
    if (r.write && !r.wn) {
      const proof = p.sentences[proofOf(p)].en.replace(/[.!?]$/, "");
      const claim = p.claim.en.replace(/[.!?]$/, "");
      const line = `The text says ${proof[0].toLowerCase()}${proof.slice(1)}, which shows ${claim[0].toLowerCase()}${claim.slice(1)}.`;
      return [{ fill: ["[data-g-write]", line] }, { click: "[data-g-wcheck]" }];
    }
    return [{ click: "[data-g-next]" }];
  },

  validate(doc) {
    const errs = [];
    const ids = new Set();
    for (const band of ["3-5", "6-8"]) {
      const list = doc.bands?.[band]?.passages || [];
      if (list.length < 8) errs.push(`${band}: needs at least 8 passages`);
      for (const p of list) errs.push(...passageErrors(p, `${band}/${p.id}`, ids));
    }
    return errs;
  },
};

function passageErrors(p, at, ids) {
  const errs = [];
  if (ids.has(p.id)) errs.push(`${at}: duplicate id`);
  ids.add(p.id);
  for (const f of ["topic", "title", "claim", "explain"])
    if (!bi(p[f])) errs.push(`${at}: ${f} must be bilingual`);
  const s = p.sentences || [];
  if (s.length < 4 || s.length > 6) errs.push(`${at}: needs 4-6 sentences`);
  if (s.filter((x) => x.kind === "proof").length !== 1)
    errs.push(`${at}: needs exactly one proof sentence`);
  if (new Set(s.filter((x) => x.kind !== "proof").map((x) => x.kind)).size < 2)
    errs.push(`${at}: needs 2+ kinds of distractor`);
  s.forEach((x, n) => {
    if (!x.en?.trim()) errs.push(`${at}/s${n}: sentence text missing`);
    if (!KINDS.includes(x.kind)) errs.push(`${at}/s${n}: unknown kind`);
    if (x.kind !== "proof" && !bi(x.why))
      errs.push(`${at}/s${n}: a distractor needs a bilingual reason`);
  });
  if (!(p.keys?.length >= 2) || !p.keys.every(bi)) errs.push(`${at}: needs 2+ bilingual key words`);
  if (p.reasons?.length !== 3 || !p.reasons.every(bi))
    errs.push(`${at}: needs 3 bilingual reasons`);
  if (!Number.isInteger(p.reason) || !p.reasons?.[p.reason])
    errs.push(`${at}: reason must index a reason`);
  p.reasons?.forEach((x, i) => {
    if (i !== p.reason && !bi(x.why))
      errs.push(`${at}/r${i}: a wrong reason needs a bilingual why`);
    if (!/^This shows .+ because .+/.test(x.en || ""))
      errs.push(`${at}/r${i}: use "This shows … because …"`);
  });
  if (p.hints?.length !== 3 || !p.hints.every(bi)) errs.push(`${at}: needs 3 bilingual hints`);
  const proof = s[proofOf({ sentences: s })]?.en?.toLowerCase();
  const right = p.reasons?.[p.reason]?.en?.toLowerCase();
  if (
    p.hints?.some(
      (h) =>
        (proof && h.en.toLowerCase().includes(proof)) ||
        (right && h.en.toLowerCase().includes(right)),
    )
  )
    errs.push(`${at}: a hint leaks the answer`);
  if (p.explain && p.hints?.some((h) => h.en === p.explain.en))
    errs.push(`${at}: explanation repeats a hint`);
  return errs;
}

// ── actions ──────────────────────────────────────────────────────────────────────────────
function pickEvidence(r, p, n, env) {
  const x = p.sentences[n];
  if (!x || settled(r.ers) || r.ers.picks.includes(n)) return false;
  r.ers.picks.push(n);
  judge(r.ers, x.kind === "proof", env, {
    id: `${r.id}:evidence`,
    skill: "text-evidence",
    extra: { kind: x.kind },
  });
  return true;
}

function pickReason(r, p, i, env) {
  if (!settled(r.ers) || settled(r.rrs) || !p.reasons[i] || r.rrs.picks.includes(i)) return false;
  r.rrs.picks.push(i);
  r.reason = i;
  judge(r.rrs, i === p.reason, env, { id: `${r.id}:reasoning`, skill: "evidence-reasoning" });
  return true;
}

/** Rule checks only (never a score): words from the evidence, a link word, an idea from the claim. */
export function checkSentence(text, proof, claim) {
  const t = String(text || "").trim();
  const lw = ` ${words(t).join(" ")} `;
  const mine = content(t);
  return {
    text: t,
    n: countWords(t),
    from: mine.filter((m) => content(proof).some((w) => near(m, w))),
    link: LINKS.find((l) => lw.includes(` ${l} `)) || null,
    claim: mine.filter((m) => content(claim).some((w) => near(m, w))),
  };
}

function checkWriting(r, p) {
  if (!settled(r.rrs) || !r.write) return false;
  r.wfb = checkSentence(r.text, p.sentences[proofOf(p)].en, p.claim.en);
  r.wn += 1;
  return true;
}

// ── views ────────────────────────────────────────────────────────────────────────────────
function keysHTML(r, p, env) {
  const I = env.I;
  const list = html`<ul class="eh-keys" aria-label="${I.S("Key words", "Palabras clave")}">
    ${p.keys.map((k) => html`<li><strong>${k.en}</strong><span lang="es">${k.es}</span></li>`)}
  </ul>`;
  if (env.sup.gloss === "show") return list;
  if (env.sup.gloss === "tap")
    return html`<details class="eh-keys-tap">
      <summary>
        ${icon("reading")}${I.T("Key words in Spanish", "Palabras clave en español")}
      </summary>
      ${list}
    </details>`;
  return r.words
    ? list
    : html`<button type="button" class="btn small" data-g-words>
        ${icon("help")}${I.T("Show key words", "Mostrar palabras clave")}
      </button>`;
}

function stripsHTML(r, p, env) {
  const I = env.I;
  const done = settled(r.ers);
  const proof = proofOf(p);
  const strip = (x, n) => {
    const miss = r.ers.picks.includes(n) && n !== proof;
    const found = done && n === proof;
    const cls = `eh-strip${miss ? " is-miss" : ""}${found ? " is-proof" : ""}`;
    const tag = found
      ? html`<span class="eh-tag is-proof">${icon("check")}${I.T("Evidence", "Evidencia")}</span>`
      : miss
        ? html`<span class="eh-tag">${icon("x")}${I.T("Not the proof", "No es la prueba")}</span>`
        : "";
    return html`<li>
      <button
        type="button"
        class="${cls}"
        data-g-ev="${n}"
        aria-pressed="${found}"
        ${done || miss ? "disabled" : ""}
      >
        <span class="eh-strip-t">${x.en}</span>${tag}
      </button>
    </li>`;
  };
  return html`<div class="eh-text">
    ${done ? "" : html`<p class="eh-note">${I.T("Tap the ONE sentence that best proves the claim.", "Toca la ÚNICA oración que mejor prueba la afirmación.")}</p>`}
    <ol class="eh-strips">
      ${p.sentences.map(strip)}
    </ol>
  </div>`;
}

function stageHTML(s, r, p, env) {
  const I = env.I;
  const proof = p.sentences[proofOf(p)];
  if (!settled(r.ers)) {
    const last = p.sentences[r.ers.picks.at(-1)];
    return html`<div class="eh-step">
      ${hintHTML(
        r.ers,
        p.hints.map((h) => say(I, h)),
        env,
      )}
      ${feedbackHTML(r.ers, { I, retry: last?.why ? say(I, last.why) : "" })}
    </div>`;
  }
  const lastEv = p.sentences[r.ers.picks.at(-1)];
  const evFb = feedbackHTML(r.ers, {
    I,
    right: I.T("That sentence proves the claim.", "Esa oración prueba la afirmación."),
    answer: html`${I.T("Evidence:", "Evidencia:")} “${proof.en}”`,
    explain: html`${lastEv?.why ? html`${say(I, lastEv.why)} ` : ""}${say(I, p.explain)}`,
  });
  const done = settled(r.rrs);
  const opt = (i) => {
    const x = p.reasons[i];
    const sel = r.reason === i;
    const miss = r.rrs.picks.includes(i) && i !== p.reason;
    const cls = `gs-choice eh-reason${sel ? " is-sel" : ""}${done && i === p.reason ? " is-right" : ""}${miss ? " is-miss" : ""}`;
    return html`<button
      type="button"
      class="${cls}"
      data-g-reason="${i}"
      aria-pressed="${sel}"
      ${done || miss ? "disabled" : ""}
    >
      ${x.en}${glossHTML(x.es, env)}
    </button>`;
  };
  const lastR = p.reasons[r.rrs.picks.at(-1)];
  const rFb = feedbackHTML(r.rrs, {
    I,
    right: I.T(
      "Your reason links the evidence to the claim.",
      "Tu razón une la evidencia con la afirmación.",
    ),
    retry: lastR?.why ? say(I, lastR.why) : "",
    answer: html`${I.T("Reasoning:", "Razonamiento:")} ${p.reasons[p.reason].en}`,
    explain: I.T(
      "A strong reason uses the evidence to explain the claim. It does not change the topic.",
      "Una razón fuerte usa la evidencia para explicar la afirmación. No cambia de tema.",
    ),
  });
  return html`<div class="eh-step">
    ${evFb}
    <h3 class="eh-step-h">
      <span class="eh-step-n" aria-hidden="true">2</span
      >${I.T("Link it: choose the reasoning that connects your evidence to the claim.", "Conéctala: elige el razonamiento que une tu evidencia con la afirmación.")}
    </h3>
    <div
      class="gs-choices"
      role="group"
      aria-label="${I.S("Reasoning choices", "Opciones de razonamiento")}"
    >
      ${r.order.map(opt)}
    </div>
    ${
      done
        ? ""
        : hintHTML(
            r.rrs,
            REASON_HINTS.map((h) => I.T(h[0], h[1])),
            env,
          )
    }
    ${rFb} ${done && r.write ? writeHTML(r, env) : ""} ${done ? nextHTML(s, r, env) : ""}
  </div>`;
}

function writeHTML(r, env) {
  const I = env.I;
  const frame =
    env.sup.frames === "none"
      ? r.frame
        ? html`<p class="gs-frame">
            <span class="gs-frame-l">${I.T("Sentence frame", "Estructura de oración")}</span>
            ${FRAME}
          </p>`
        : html`<button type="button" class="btn small" data-g-frame>
            ${icon("help")}${I.T("Show the sentence frame", "Mostrar la estructura de oración")}
          </button>`
      : frameBox(FRAME, env);
  return html`<div class="eh-write">
    <h3 class="eh-step-h">
      <span class="eh-step-n" aria-hidden="true">3</span
      >${I.T("Write it: cite the text and explain it in one sentence.", "Escríbelo: cita el texto y explícalo en una oración.")}
    </h3>
    ${frame}
    <label class="eh-write-l" for="eh-write-${r.id}">${I.T("Your sentence", "Tu oración")}</label>
    <textarea
      id="eh-write-${r.id}"
      class="eh-write-box"
      data-g-write
      rows="3"
      maxlength="400"
      spellcheck="true"
    >
${r.text}</textarea>
    <div class="gs-actions">
      <button type="button" class="btn" data-g-wcheck>
        ${icon("writing")}${r.wn ? I.T("Check my revision", "Revisar mi nueva versión") : I.T("Check my sentence", "Revisar mi oración")}
      </button>
    </div>
    ${r.wfb ? writeFeedback(r.wfb, I) : ""}
  </div>`;
}

function writeFeedback(f, I) {
  const q = (list) => list.map((w) => `“${w}”`).join(", ");
  if (f.n < 4)
    return html`<div class="gs-feedback is-retry eh-wfb" role="status" aria-live="polite">
      <p>
        ${I.T("Write one full sentence first. Start with “The text says” and add words from your evidence.", "Primero escribe una oración completa. Empieza con “The text says” y añade palabras de tu evidencia.")}
      </p>
    </div>`;
  const row = (ok, en, es) =>
    html`<li class="${ok ? "is-ok" : "is-next"}">
      ${icon(ok ? "check" : "sparkle")}<span>${I.T(en, es)}</span>
    </li>`;
  return html`<div class="gs-feedback eh-wfb" role="status" aria-live="polite">
    <p class="eh-wfb-you">${I.T("You wrote:", "Escribiste:")} <q>${f.text}</q></p>
    <ul class="eh-wfb-list">
      ${f.from.length ? row(true, `You used words from the text: ${q(f.from)}.`, `Usaste palabras del texto: ${q(f.from)}.`) : row(false, "Add words from your evidence sentence so a reader knows what the text says.", "Añade palabras de tu oración de evidencia para que se sepa qué dice el texto.")}
      ${f.link ? row(true, `You linked the evidence with “${f.link}”.`, `Uniste la evidencia con “${f.link}”.`) : row(false, "Add a link word such as “which shows” or “because” to connect the evidence to the claim.", "Añade una palabra de enlace como “which shows” o “because” para unir la evidencia con la afirmación.")}
      ${f.claim.length ? row(true, `You named the claim's idea: ${q(f.claim)}.`, `Nombraste la idea de la afirmación: ${q(f.claim)}.`) : row(false, "After your link word, say what the evidence shows about the claim.", "Después de la palabra de enlace, di qué muestra la evidencia sobre la afirmación.")}
    </ul>
    <p class="fine">
      ${I.T("These are writing checks, not a grade. Revise if you like, then go on.", "Son revisiones de escritura, no una nota. Revisa si quieres y luego sigue.")}
    </p>
  </div>`;
}

function nextHTML(s, r, env) {
  const I = env.I;
  if (r.write && !r.wn) return "";
  const last = s.i === s.rounds.length - 1;
  return html`<div class="gs-actions">
    <button type="button" class="btn btn-primary btn-big" data-g-next>
      ${icon("arrow-right")}${last ? I.T("Close the case board", "Cerrar el tablero de casos") : I.T("Open the next case file", "Abrir el siguiente expediente")}
    </button>
  </div>`;
}
