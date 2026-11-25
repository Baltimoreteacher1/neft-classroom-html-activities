// Misconception Detective (/claim-check): a fictional classmate explains an idea and one line is wrong. The learner
// finds the line, sorts evidence from assumption, picks the correct statement, explains the mistake in a sentence and
// compares with the accurate idea. Local and rule-based: nothing the learner types leaves the device. No score, level,
// streak, timer or points; supported (a hint was opened) and independent cases are counted apart.
// Engine: src/claimcheck/engine.js. Flow, files and how to add a case: CLAIM-CHECK.md.
import { crumbsHTML } from "../components.js";
import { chooserHTML, findStep, fixStep, hintsHTML, listHref, nextCase, readStep, revealStep, FRAME, sortStep, stepsNav, bandText } from "../claimcheck/parts.js";
import { SUBJECTS, caseById, checkSentence, chooseFix, countWords, finish, hintFor, MIN_WORDS, newState, sortCard, sortDone, summarize, supportsBand, tapLine } from "../claimcheck/engine.js";
import { load, save } from "../claimcheck/store.js";
import { i18nFor } from "../i18n.js";
import { appendEntry, loadLedger, saveLedger } from "../lang/ledger.js";
import { BASE, announce, html, icon } from "../util.js";

const ui = { msg: null };
const currentId = (ctx) => ctx.route?.id || "";

function unsupportedHTML(I) {
  return html`<div class="panel cc-hero">
    <p class="lead">${I.T("Misconception Detective is for grades 3–8. Pick a band to start: it uses reading, evidence and explaining across math, science, social studies, ELA and health.", "El Detective de ideas equivocadas es para los grados 3 a 8. Elige un grupo de grados para empezar: usa lectura, evidencia y explicación en matemáticas, ciencias, estudios sociales, ELA y salud.")}</p>
    <div class="row-actions">
      <a class="btn btn-primary" href="${listHref("3-5")}">${I.T("Grades 3–5", "Grados 3–5")}</a>
      <a class="btn" href="${listHref("6-8")}">${I.T("Grades 6–8", "Grados 6–8")}</a>
    </div>
  </div>`;
}

function caseBody(I, c, data) {
  let s = data.open[c.id];
  if (!s) {
    s = newState(c.id);
    data.open[c.id] = s;
    data.last = c.id;
    save(data);
  }
  const msg = ui.msg;
  ui.msg = null;
  const step = { read: readStep, find: findStep, sort: sortStep }[s.step];
  const body = step ? step(I, c, s) : s.step === "fix" ? fixStep(I, c, s, msg) : revealStep(I, c, s, nextCase(c, data));
  return html`<p class="eyebrow">${icon("detective")} ${I.T(SUBJECTS.find((x) => x[0] === c.subject)[1], SUBJECTS.find((x) => x[0] === c.subject)[2])} · ${I.T(`Grades ${bandText(c.band)}`, `Grados ${bandText(c.band)}`)}</p>
    <h2 class="cc-case-title">${I.T(c.title.en, c.title.es)}</h2>
    ${stepsNav(I, s)}
    ${body}
    ${s.step === "reveal" ? "" : hintsHTML(I, c, s)}`;
}

export async function render(ctx) {
  const I = i18nFor(ctx);
  const title = I.S("Misconception Detective", "Detective de ideas equivocadas");
  const crumbs = (...more) => crumbsHTML([[I.S("Lab", "Laboratorio"), `${BASE}/?grades=${ctx.band}`], more.length ? [title, listHref(ctx.band)] : [title, null], ...more]);
  const c = caseById(currentId(ctx));
  let inner;
  let trail = crumbs();
  if (!supportsBand(ctx.band)) inner = unsupportedHTML(I);
  else if (c && c.band === ctx.band) {
    inner = caseBody(I, c, load());
    trail = crumbs([I.S(c.title.en, c.title.es), null]);
  } else {
    const data = load();
    inner = chooserHTML(I, ctx.band, data, summarize(data.done, ctx.band));
  }
  return {
    title,
    html: html`${trail}
      <div class="cc">
        <header class="cc-head">
          <h1 tabindex="-1">${I.T("Misconception Detective", "Detective de ideas equivocadas")}</h1>
          <p class="lead">${I.T("A classmate explains an idea, but one part is wrong. Find it, sort the evidence, fix it and explain why. Everything you type stays on this device.", "Un compañero explica una idea, pero una parte está mal. Encuéntrala, clasifica la evidencia, corrígela y explica por qué. Todo lo que escribes se queda en este dispositivo.")}</p>
        </header>
        ${inner}
      </div>`,
  };
}

/** Change the open case's saved state, remember it as the latest, and persist. */
function edit(ctx, fn) {
  const c = caseById(currentId(ctx));
  const data = load();
  const next = fn(data.open[c.id] || newState(c.id), c, data);
  data.open[c.id] = next;
  data.last = c.id;
  save(data);
  return { c, s: next, data };
}

async function redraw(ctx, focusId, heading) {
  await ctx.rerender();
  const el = heading ? document.getElementById("ccStep") : document.getElementById(focusId);
  el?.focus();
  if (heading) el?.scrollIntoView({ block: "start" });
}

function record(c, s) {
  const ledger = loadLedger();
  appendEntry(ledger, { src: "claim-check", task: `cc-${c.id}`, band: c.band, domain: "Reading", stage: s.independent ? "independent" : "supported", kind: "first", supports: s.hints ? { hint: true } : {}, m: { flaw: c.flaw, subject: c.subject } });
  saveLedger(ledger);
}

export function onInput(e, ctx) {
  if (e.target.id !== "ccSentence") return;
  const id = currentId(ctx);
  const data = load();
  const s = data.open[id];
  if (!s) return;
  s.sentence = e.target.value;
  s.checked = false;
  save(data);
  document.getElementById("ccAfter")?.replaceChildren();
}

export async function onChange(e, ctx) {
  const t = e.target;
  if (t.matches?.("input[data-cc-card]")) {
    const I = i18nFor(ctx);
    const { c, s } = edit(ctx, (s, c) => sortCard(s, c, t.dataset.ccCard, t.value).state);
    const card = c.cards.find((k) => k.id === t.dataset.ccCard);
    const ok = card.kind === t.value;
    announce(ok ? I.S("Yes. In the right pile.", "Sí. En el grupo correcto.") : I.S("Not quite. Try another pile.", "Todavía no. Prueba otro grupo."), { toast: false });
    if (ok && sortDone(s, c)) announce(I.S("Every card is sorted correctly.", "Todas las tarjetas están bien clasificadas."), { toast: false });
    await redraw(ctx, t.id);
  } else if (t.matches?.("input[data-cc-fix]")) {
    const I = i18nFor(ctx);
    const { s } = edit(ctx, (s, c) => chooseFix(s, c, Number(t.dataset.ccFix)).state);
    announce(s.fixed ? I.S("That statement fits the evidence.", "Ese enunciado coincide con la evidencia.") : I.S("Not quite. Check it against the evidence.", "Todavía no. Compárala con la evidencia."), { toast: false });
    await redraw(ctx, s.fixed ? "ccSentence" : t.id);
  }
}

export async function onClick(e, ctx) {
  const t = e.target.closest("button");
  if (!t || !currentId(ctx)) return false;
  const I = i18nFor(ctx);
  if (t.matches("[data-cc-go]")) {
    const to = t.dataset.ccGo;
    const { c, s } = edit(ctx, (s, c) => {
      const ok = { find: true, sort: s.found, fix: s.found && sortDone(s, c), reveal: s.fixed && s.checked }[to];
      if (to === "reveal" && ok) {
        const done = finish({ ...s, step: "reveal" });
        return done;
      }
      return ok ? { ...s, step: to } : s;
    });
    if (to === "reveal" && s.done && !load().done[c.id]) {
      const d = load();
      d.done[c.id] = { independent: s.independent, t: new Date().toISOString() };
      save(d);
      record(c, s);
    }
    await redraw(ctx, "", true);
    return true;
  }
  if (t.matches("[data-cc-line]")) {
    const i = Number(t.dataset.ccLine);
    const { s, c } = edit(ctx, (s, c) => tapLine(s, c, i).state);
    const nudge = i === c.flawed ? I.S("You found the line with the mistake.", "Encontraste la línea con el error.") : I.S(`Line ${i + 1} holds up. ${c.whyFine[i].en}`, `La línea ${i + 1} se sostiene. ${c.whyFine[i].es}`);
    announce(nudge, { toast: false });
    await redraw(ctx, s.found ? "" : `cc-line-${i}`, s.found);
    return true;
  }
  if (t.matches("[data-cc-hint]")) {
    const { c, s } = edit(ctx, (s) => ({ ...s, hints: Math.min(3, s.hints + 1) }));
    const h = hintFor(c, s.hints);
    announce(I.S(h.en, h.es), { toast: false });
    await redraw(ctx, "ccHints");
    return true;
  }
  if (t.matches("[data-cc-frame]")) {
    const box = document.getElementById("ccSentence");
    if (box && !box.value.trim()) {
      box.value = FRAME;
      edit(ctx, (s) => ({ ...s, sentence: FRAME, checked: false }));
    } else announce(I.S("The frame is for an empty box. Clear your sentence to use it.", "La estructura es para una caja vacía. Borra tu oración para usarla."), { toast: false });
    box?.focus();
    box?.setSelectionRange(0, 0);
    return true;
  }
  if (t.matches("[data-cc-check]")) {
    const text = document.getElementById("ccSentence")?.value ?? "";
    const c = caseById(currentId(ctx));
    const res = checkSentence(c, text);
    const ok = !res.tooShort && countWords(text) >= MIN_WORDS;
    edit(ctx, (s) => ({ ...s, sentence: text, checked: ok }));
    if (!ok) ui.msg = { en: res.en, es: res.es };
    announce(I.S(res.en, res.es), { toast: false });
    await ctx.rerender();
    document.getElementById(ok ? "ccAfter" : "ccSentence")?.scrollIntoView({ block: "nearest" });
    if (!ok) document.getElementById("ccSentence")?.focus();
    return true;
  }
  return false;
}
