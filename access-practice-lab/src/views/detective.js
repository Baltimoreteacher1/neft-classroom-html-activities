// Language Error Detective: diagnose a specific language pattern in the learner's own work, learn it in a
// short micro-lesson, REVISE the sentence, try fresh sentences without help, then write a new piece where
// the pattern is needed (transfer). Feedback is specific to the pattern; "right/wrong" is never the whole message.
import { loadPatterns } from "../content.js";
import { checkRevision, detect } from "../lang/errors.js";
import { appendEntry, buildProfile, loadLedger, saveLedger } from "../lang/ledger.js";
import { analyzeResponse } from "../lang/analyze.js";
import { detectiveState, loadStudio, saveStudio } from "../lang/studio.js";
import { chooserHeroHTML, highlightHTML, jumpNavHTML, setStudioI18n, stepperHTML } from "../studio-ui.js";
import { i18nFor, makeI18n } from "../i18n.js";
import { crumbsHTML, setComponentsI18n } from "../components.js";
import { ART, BASE, announce, html, icon, raw, wordCount } from "../util.js";

const IGN = raw("data-nsr-ignore");
let D = null;
// Chrome strings are localized through I (set at the top of render and onClick). Pattern names, rules, examples and
// prompts come from the content JSON and stay English.
let I = makeI18n("en");
const M = (en, es) => ({ en, es }); // a stored message, localized when it is shown
const CATEGORY = {
  syntax: "Sentence structure",
  discourse: "Connecting ideas",
  conventions: "Conventions",
  "word-choice": "Word choice",
  morphology: "Word parts",
};
const CATEGORY_ES = {
  syntax: "Estructura de las oraciones",
  discourse: "Conectar ideas",
  conventions: "Convenciones",
  "word-choice": "Elección de palabras",
  morphology: "Partes de las palabras",
};
const catEn = (c, fallback = c) => CATEGORY[c] || fallback;
const catEs = (c, fallback = c) => CATEGORY_ES[c] || catEn(c, fallback);
const cat = (c, fallback = c) => I.T(catEn(c, fallback), catEs(c, fallback));
const stepLabels = () => [
  I.T("Notice", "Observa"),
  I.T("Learn", "Aprende"),
  I.T("Fix", "Corrige"),
  I.T("Try new ones", "Prueba otras"),
  I.T("Use it", "Úsalo"),
];
const FRESH = 3; // fresh sentences after the guided revision

/** Examples of each pattern in the learner's own writing and transcripts: [{id, text, sentence}] */
function ownExamples(studio) {
  const texts = [];
  for (const [task, w] of Object.entries(studio.writing))
    for (const v of w.versions.slice(-2)) texts.push({ task, text: v.text });
  for (const [task, s] of Object.entries(studio.speaking))
    for (const t of s.takes.slice(-2)) if (t.transcript) texts.push({ task, text: t.transcript });
  const found = {};
  for (const { text } of texts)
    for (const f of detect(text))
      if (f.confidence === "high")
        (found[f.id] ||= []).push({
          sentence: f.sentence.text,
          span: { start: f.start - f.sentence.start, end: f.end - f.sentence.start },
          text: f.text,
        });
  return found;
}

function hubHTML(ctx, data) {
  const own = D.own;
  const profile = buildProfile(D.ledger.entries, { band: ctx.band });
  const mine = Object.keys(own)
    .map((id) => ({ id, n: own[id].length }))
    .sort((a, b) => b.n - a.n);
  const pats = Object.entries(data.patterns);
  const cats = [...new Set(pats.map(([, p]) => p.category))];
  const state = (id) => D.studio.detective[id];
  const status = (id) =>
    state(id)?.transfer?.some((t) => t.ok && t.independent)
      ? html`<span class="mode-pill is-done">${icon("check")} ${I.T("Used on my own", "Lo usé por mi cuenta")}</span>`
      : state(id)?.seen
        ? html`<span class="mode-pill">${icon("clock")} ${I.T("In progress", "En progreso")}</span>`
        : "";
  const card = (id, p, extra) =>
    html`<a class="card task-card case-card" href="${BASE}/detective/${id}?grades=${ctx.band}">
      <span class="task-top"><span class="task-ico">${icon("detective")}</span><span class="task-kind">${cat(p.category)}</span>${status(id)}</span>
      <strong class="task-title">${p.name}</strong>
      <span class="case-ex"><del>${p.lesson.wrong}</del><span class="case-arrow" aria-hidden="true">${icon("arrow-right")}</span><ins>${p.lesson.right}</ins></span>
      ${extra ? html`<span class="task-why">${icon("search")}<span>${extra}</span></span>` : ""}
    </a>`;
  return html`${crumbsHTML([
      [I.S("Lab", "Laboratorio"), `${BASE}/?grades=${ctx.band}`],
      [I.S("Language Error Detective", "Detective de errores de lenguaje"), null],
    ])}
    <div class="d-detective">
    ${chooserHeroHTML({
      domain: "d-detective",
      eyebrow: I.T(`${pats.length} case files · Grades ${ctx.band.replace("-", "–")}`, `${pats.length} casos · Grados ${ctx.band.replace("-", "–")}`),
      title: I.T("Language Error Detective", "Detective de errores de lenguaje"),
      lead: I.T("Find a pattern in your own writing, learn the rule, fix your sentence, try new ones, then use it in new writing.", "Encuentra un patrón en tu propia escritura, aprende la regla, corrige tu oración, prueba otras nuevas y luego úsalo en una escritura nueva."),
      art: `${ART}/studio-detective.svg`,
      i18n: I,
      loop: stepLabels(),
    })}
    <section class="task-group is-next" aria-labelledby="det-own-h">
      <header><h2 id="det-own-h">${icon("search")} ${I.T("Cases from your own work", "Casos de tu propio trabajo")}</h2><p class="fine">${I.T("Patterns found in the writing and speaking saved on this device.", "Patrones encontrados en la escritura y el habla guardadas en este dispositivo.")}</p></header>
      ${
        mine.length
          ? html`<div class="task-grid">${mine.slice(0, 4).map((m) => card(m.id, data.patterns[m.id], I.T(`Found ${m.n} time${m.n === 1 ? "" : "s"} in your recent writing or speaking`, `Se encontró ${m.n} ${m.n === 1 ? "vez" : "veces"} en lo que escribiste o dijiste hace poco`)))}</div>`
          : html`<p class="case-empty">${icon("info")}<span>${I.T("No pattern errors found in your saved work yet. Write or speak in the studios, then come back — or pick any case file below.", "Todavía no hay errores de patrones en tu trabajo guardado. Escribe o habla en los estudios y vuelve, o elige cualquier caso de abajo.")}</span></p>`
      }
      ${profile.detective ? html`<p class="fine">${I.T(`${profile.detective} detective attempts saved on this device.`, `${profile.detective} intentos de detective guardados en este dispositivo.`)}</p>` : ""}
    </section>
    ${jumpNavHTML(cats.map((c) => [`det-${c}`, cat(c)]), I.S("Jump to a kind of pattern", "Ir a un tipo de patrón"))}
    ${cats.map(
      (c) =>
        html`<section class="task-group" id="det-${c}" aria-labelledby="det-${c}-h">
          <header><h2 id="det-${c}-h">${cat(c, c[0].toUpperCase() + c.slice(1))}</h2></header>
          <div class="task-grid">${pats.filter(([, p]) => p.category === c).map(([id, p]) => card(id, p))}</div>
        </section>`,
    )}</div>`;
}

const phaseOf = () =>
  D.step === 0
    ? "diagnose"
    : D.step === 1
      ? "lesson"
      : D.step === 2
        ? "revise"
        : D.step <= 2 + FRESH
          ? "fresh"
          : "transfer";
const STEP_OF = { diagnose: 0, lesson: 1, revise: 2, fresh: 3, transfer: 4 };

function ruleHTML(p, phase) {
  const lesson = p.lesson;
  return html`<section class="panel micro-lesson">
    <h3>${icon("bulb")} ${I.T("The rule", "La regla")}</h3>
    <p class="rule-text">${lesson.rule}</p>
    <div class="rule-pair"><p class="is-wrong"><span class="pair-label">${I.T("Not quite", "Todavía no")}</span><del>${lesson.wrong}</del></p><p class="is-right"><span class="pair-label">${I.T("Fluent", "Fluida")}</span><ins>${lesson.right}</ins></p></div>
    <p class="fine">${lesson.why}</p>
    ${lesson.l1 ? html`<p class="l1-note">${icon("language")}<span>${lesson.l1}</span></p>` : ""}
    <p class="move-ask self-check">${icon("check")}<span>${I.T("Self-check:", "Revisa tu trabajo:")} ${lesson.check}</span></p>
    ${phase === "lesson" ? html`<button type="button" class="btn btn-primary" data-next>${I.T("Fix a sentence", "Corrige una oración")}${icon("arrow-right")}</button>` : ""}
  </section>`;
}

function caseHTML(ctx, p, id) {
  const lesson = p.lesson;
  const own = D.own[id]?.[0];
  const items = D.items;
  const phase = phaseOf();
  const idx = D.step - 3;
  const cur = phase === "revise" ? items[0] : phase === "fresh" ? items[1 + idx] : null;
  const showLesson = phase === "lesson" || phase === "revise";
  const at = STEP_OF[phase];
  const steps = stepLabels().map((label, i) => ({ label, done: i < at }));
  return html`${crumbsHTML([
      [I.S("Lab", "Laboratorio"), `${BASE}/?grades=${ctx.band}`],
      [I.S("Language Error Detective", "Detective de errores de lenguaje"), `${BASE}/detective?grades=${ctx.band}`],
      [p.name, null],
    ])}
    <article class="activity studio-view detective d-detective">
      <header class="act-head">
        <div class="act-bar"><p class="act-context">${icon("detective")} ${I.T(`Case file · ${catEn(p.category)}`, `Caso · ${catEs(p.category)}`)}</p></div>
        <h1 tabindex="-1">${p.name}</h1>
        <p class="fine case-sub">${I.T("Five short steps: notice the pattern, learn the rule, fix a sentence, try new ones, then use it in your own writing.", "Cinco pasos cortos: observa el patrón, aprende la regla, corrige una oración, prueba otras nuevas y luego úsalo en tu propia escritura.")}</p>
      </header>
      ${stepperHTML(steps, { label: I.S("Steps", "Pasos"), current: at, i18n: I })}
      ${
        phase === "diagnose"
          ? html`<section class="panel notice-panel">
              <h3>${icon("search")} ${I.T("Notice", "Observa")}</h3>
              ${
                own
                  ? html`<p>${I.T("This pattern showed up in your own work:", "Este patrón apareció en tu propio trabajo:")}</p>
                      <p class="evidence-text specimen">${highlightHTML(own.sentence, [own.span], "hl hl-error")}</p>`
                  : html`<p>${I.T("An example of this pattern:", "Un ejemplo de este patrón:")}</p>
                      <p class="evidence-text specimen"><del>${lesson.wrong}</del></p>`
              }
              <p class="move-ask">${I.T("Read it aloud. Where does it sound different from how a fluent writer would say it?", "Léela en voz alta. ¿Dónde suena diferente de como la diría un buen escritor?")}</p>
              <button type="button" class="btn btn-primary" data-next>${I.T("Show me the rule", "Muéstrame la regla")}${icon("arrow-right")}</button>
            </section>`
          : ""
      }
      <div class="${showLesson && cur ? "det-split" : ""}">
      ${showLesson ? ruleHTML(p, phase) : ""}
      ${
        cur
          ? html`<section class="panel fix-panel">
              <h3>${phase === "revise" ? html`${icon("writing")} ${I.T("Fix this sentence", "Corrige esta oración")}` : html`${icon("writing")} ${I.T(`Fresh sentence ${idx + 1} of ${FRESH} — no rule on screen`, `Oración nueva ${idx + 1} de ${FRESH}: sin la regla en pantalla`)}`}</h3>
              ${
                phase === "fresh"
                  ? html`<p class="fine">${I.T("Opening the rule again counts as help.", "Volver a abrir la regla cuenta como ayuda.")} <button type="button" class="ghost small" data-peek>${I.T("Show the rule", "Mostrar la regla")}</button></p>
                      ${D.peek ? html`<p class="rule-text">${lesson.rule}</p>` : ""}`
                  : ""
              }
              <p class="fine">${cur.prompt}</p>
              <label class="field paper"><span class="paper-head">${I.T("Your corrected sentence", "Tu oración corregida")}</span><textarea id="det-answer" rows="3" data-answer ${IGN}>
${D.answer ?? cur.broken}</textarea></label>
              <div class="row-actions">
                <button type="button" class="btn btn-primary" data-check-fix>${icon("check")} ${I.T("Check my fix", "Revisar mi corrección")}</button>
                <button type="button" class="ghost" data-hint>${icon("bulb")} ${I.T("Hint", "Pista")}</button>
              </div>
              ${
                D.result
                  ? html`<div class="feedback ${D.result.ok ? "is-right" : "is-hint"}" role="status">
                      <p class="fb-title">${icon(D.result.ok ? "check" : D.result.hint ? "bulb" : "retry")} ${D.result.ok ? I.T("Fixed", "Corregida") : D.result.hint ? I.T("Hint", "Pista") : I.T("Not yet", "Todavía no")}</p>
                      <p>${I.T(D.result.msg.en, D.result.msg.es)}</p>
                      ${D.result.ok ? html`<button type="button" class="btn btn-primary" data-next>${I.T("Next", "Siguiente")}${icon("arrow-right")}</button>` : ""}
                    </div>`
                  : ""
              }
            </section>`
          : ""
      }
      </div>
      ${phase === "transfer" ? transferHTML(p) : ""}
    </article>`;
}

function transferHTML(p) {
  const t = D.transfer;
  return html`<section class="panel fix-panel">
    <h3>${icon("writing")} ${I.T("Use it in new writing", "Úsalo en una escritura nueva")}</h3>
    <p class="fine">${t.context}</p>
    <p class="transfer-prompt">${t.prompt}</p>
    <label class="field paper"><span class="paper-head">${I.T("Your writing", "Tu escritura")}</span><textarea id="det-transfer" rows="5" data-transfer ${IGN}>${D.answer ?? ""}</textarea></label>
    <p class="fine">${I.T(`At least ${t.minWords} words. We check for "${p.name}" only — nothing else.`, `Al menos ${t.minWords} palabras. Solo revisamos "${p.name}", nada más.`)}</p>
    <button type="button" class="btn btn-primary" data-check-transfer>${icon("check")} ${I.T("Check my writing", "Revisar mi escritura")}</button>
    ${
      D.result
        ? html`<div class="feedback ${D.result.ok ? "is-right" : "is-hint"}" role="status">
            <p class="fb-title">${icon(D.result.ok ? "check" : "retry")} ${D.result.ok ? I.T("You used it correctly in new writing", "Lo usaste correctamente en una escritura nueva") : I.T("Not yet", "Todavía no")}</p>
            <p>${I.T(D.result.msg.en, D.result.msg.es)}</p>
          </div>`
        : ""
    }
    ${
      D.result?.ok
        ? html`<p class="saved-note">${icon("check")} ${I.T("Case closed. Your teacher will see this transfer.", "Caso cerrado. Tu docente verá este trabajo.")}</p>
            <a class="btn" href="${BASE}/detective?grades=${D.band}">${I.T("Back to case files", "Volver a los casos")}</a>`
        : ""
    }
  </section>`;
}

function log(kind, ok, extra = {}) {
  const st = D.helped ? "supported" : "independent";
  appendEntry(D.ledger, {
    src: "detective",
    task: `det-${D.id}`,
    band: D.band,
    domain: "Writing",
    use: "",
    stage: st,
    kind,
    supports: D.peek || D.hintsUsed ? { hint: true } : {},
    m: { pattern: D.id, ok, ...extra },
  });
  saveLedger(D.ledger);
}

export async function render(ctx) {
  I = i18nFor(ctx);
  setComponentsI18n(I);
  setStudioI18n(I);
  const data = await loadPatterns();
  const id = ctx.route.id;
  const studio = loadStudio();
  const keep = D && D.id === id ? D : null;
  D = keep || {
    band: ctx.band,
    step: 0,
    answer: null,
    result: null,
    hintsUsed: 0,
    peek: false,
    helped: false,
  };
  Object.assign(D, { studio, ledger: loadLedger(), band: ctx.band, own: ownExamples(studio), id });
  if (!id) return { title: I.S("Language Error Detective", "Detective de errores de lenguaje"), html: hubHTML(ctx, data) };
  const p = data.patterns[id];
  if (!p)
    return {
      title: I.S("Not found", "No se encontró"),
      html: html`<section class="panel">
        <h1>${I.T("That case file does not exist.", "Ese caso no existe.")}</h1>
        <a class="btn" href="${BASE}/detective?grades=${ctx.band}">${I.T("Case files", "Casos")}</a>
      </section>`,
    };
  if (!keep) {
    const st = detectiveState(studio, id);
    // least-practised items first, so a second visit brings new sentences instead of memorised ones
    const times = (id) => (st.seenItems || {})[id] || 0;
    const ordered = [...p.practice].sort((a, b) => times(a.id) - times(b.id) || p.practice.indexOf(a) - p.practice.indexOf(b));
    D.items = ordered.slice(0, 1 + FRESH);
    st.seenItems = { ...(st.seenItems || {}) };
    for (const it of D.items) st.seenItems[it.id] = times(it.id) + 1;
    D.transfer = p.transfer[(st.transfer?.length || 0) % p.transfer.length];
    st.seen = (st.seen || 0) + 1;
    saveStudio(studio);
  }
  D.pattern = p;
  return { title: p.name, html: caseHTML(ctx, p, id) };
}

export function onInput(e) {
  if (!D) return;
  if (e.target.matches("[data-answer], [data-transfer]")) D.answer = e.target.value;
}

function currentItem() {
  return D.step === 2 ? D.items[0] : D.items[1 + (D.step - 3)];
}

export function onClick(e, ctx) {
  if (!D?.pattern) return false;
  I = i18nFor(ctx);
  const t = e.target;
  const next = () => {
    D.step++;
    D.answer = null;
    D.result = null;
    D.hintsUsed = 0;
    D.peek = false;
    D.misses = 0;
    D.itemHelped = false;
    ctx.rerender();
  };
  if (t.closest("[data-next]")) {
    next();
    return true;
  }
  if (t.closest("[data-peek]")) {
    D.peek = true;
    D.helped = true;
    D.itemHelped = true;
    ctx.rerender();
    return true;
  }
  if (t.closest("[data-hint]")) {
    const item = currentItem();
    D.hintsUsed++;
    D.helped = true;
    D.itemHelped = true;
    const first = detect(item.broken).find((f) => f.id === D.id);
    D.result = {
      ok: false,
      hint: true,
      msg:
        D.hintsUsed === 1
          ? M(`Self-check: ${D.pattern.lesson.check}`, `Revisa tu trabajo: ${D.pattern.lesson.check}`)
          : D.hintsUsed === 2 && first
            ? M(`Look at these words: “${first.text}”.`, `Mira estas palabras: “${first.text}”.`)
            : M(`The rule: ${D.pattern.lesson.rule}`, `La regla: ${D.pattern.lesson.rule}`),
    };
    ctx.rerender();
    return true;
  }
  if (t.closest("[data-check-fix]")) {
    const item = currentItem();
    const answer = D.answer ?? item.broken;
    const r = checkRevision(item.broken, answer, D.id);
    let msg;
    if (!r.changed) msg = M("Your sentence has not changed. Which words need to change?", "Tu oración no ha cambiado. ¿Qué palabras necesitan cambiar?");
    else if (!r.fixed)
      msg =
        (D.misses || 0) === 0
          ? M("That pattern is still in your sentence. Read it aloud once, slowly, and listen for the spot.", "Ese patrón sigue en tu oración. Léela en voz alta una vez, despacio, y escucha dónde está.")
          : M(`That pattern is still in your sentence: “${r.remaining[0].text}”. ${D.pattern.lesson.check}`, `Ese patrón sigue en tu oración: “${r.remaining[0].text}”. ${D.pattern.lesson.check}`);
    else if (r.introduced.length)
      msg = M(
        `You fixed it, but a new pattern appeared: ${r.introduced[0].name} (“${r.introduced[0].text}”). Reread and adjust.`,
        `Lo corregiste, pero apareció un patrón nuevo: ${r.introduced[0].name} (“${r.introduced[0].text}”). Vuelve a leer y ajusta.`,
      );
    else if (!r.sameMessage)
      msg = M(
        "The pattern is gone, but your sentence no longer says the same thing. Keep the meaning and change only what the rule needs.",
        "El patrón ya no está, pero tu oración ya no dice lo mismo. Mantén el significado y cambia solo lo que pide la regla.",
      );
    const ok = !msg;
    D.result = { ok, msg: ok ? M("The pattern is fixed and your meaning is the same.", "El patrón está corregido y tu significado es el mismo.") : msg };
    if (!ok) D.misses = (D.misses || 0) + 1;
    const clean = ok && !D.itemHelped && (D.misses || 0) === 0; // fixed on the first check, with no hint or rule
    if (ok) {
      const st = detectiveState(D.studio, D.id);
      st.done = [...new Set([...(st.done || []), item.id])];
      if (clean) st.fixedFirst++;
      else st.helped++;
      saveStudio(D.studio);
    }
    if (!clean && ok) D.helped = true; // needing help on this pattern means the transfer is not credited as independent
    log("retry", ok, { item: item.id, hints: D.hintsUsed, misses: D.misses || 0 });
    announce(ok ? I.S("Fixed.", "Corregida.") : I.S("Not yet. Read the feedback below.", "Todavía no. Lee los comentarios de abajo."));
    ctx.rerender();
    return true;
  }
  if (t.closest("[data-check-transfer]")) {
    const text = D.answer || "";
    const a = analyzeResponse(text, {
      keyUse: "Explain",
      stage: "independent",
      modality: "writing",
    });
    const has = detect(text).filter((f) => f.id === D.id);
    let msg;
    let ok = false;
    if (wordCount(text) < D.transfer.minWords)
      msg = M(
        `Write at least ${D.transfer.minWords} words so the pattern has room to appear (you have ${wordCount(text)}).`,
        `Escribe al menos ${D.transfer.minWords} palabras para que el patrón tenga espacio para aparecer (tienes ${wordCount(text)}).`,
      );
    else if (has.length)
      msg = M(`“${has[0].text}” still shows the pattern. ${D.pattern.lesson.check}`, `“${has[0].text}” todavía muestra el patrón. ${D.pattern.lesson.check}`);
    else {
      ok = true;
      msg = M(`No “${D.pattern.name}” errors found in your ${a.words} words.`, `No se encontraron errores de “${D.pattern.name}” en tus ${a.words} palabras.`);
    }
    D.result = { ok, msg };
    const st = detectiveState(D.studio, D.id);
    (st.transfer ||= []).push({
      id: `x${Date.now().toString(36)}`,
      t: new Date().toISOString(),
      text,
      ok,
      prompt: D.transfer.id,
      independent: !D.helped,
    });
    saveStudio(D.studio);
    log("transfer", ok, { words: a.words, prompt: D.transfer.id });
    announce(ok ? I.S("Case closed.", "Caso cerrado.") : I.S("Not yet.", "Todavía no."));
    ctx.rerender();
    return true;
  }
  return false;
}

export function unmount() {
  D = null;
}
