// Teach It Back (/teach-back): a learner shows they understand a school idea by explaining it to someone else, typed or
// recorded, with supports that fade (frames, then feedback, then a different idea on their own). Rule-based and local:
// nothing typed or recorded leaves the device. Engine: src/teachback/check.js. Flow, files and rules: TEACH-BACK.md.
import * as audioStore from "../audio-store.js";
import { crumbsHTML } from "../components.js";
import { i18nFor } from "../i18n.js";
import { printSheet } from "../print-sheet.js";
import * as recorder from "../recorder.js";
import { analyze } from "../teachback/check.js";
import { CONCEPTS, conceptById, isTeachBand } from "../teachback/concepts.js";
import { MAX_TEXT, attemptsFor, currentId, endSession, markExplained, recordAttempt, startOwn, startRevision } from "../teachback/session.js";
import * as store from "../teachback/store.js";
import { learnHTML, pickHTML, planHTML, stepperHTML } from "../teachback/ui.js";
import { doneHTML, feedbackHTML, ownHTML, teachHTML } from "../teachback/ui-teach.js";
import { BASE, announce, copyText, html, icon } from "../util.js";

const ui = { state: null, showPick: false, recording: false, micError: false, audioUrl: "", audioFor: "", error: "" };

const sess = () => ui.state?.session;
const save = () => store.save(ui.state);
const band = (ctx) => (isTeachBand(ctx.band) ? ctx.band : "6-8");
const canRecord = () => recorder.canRecord() && audioStore.available();

/** Object URL for a kept recording, or "" when it is gone (kept for 30 days). Read-only. */
async function urlFor(id) {
  if (!id) return "";
  if (ui.audioFor === id) return ui.audioUrl;
  const row = audioStore.available() ? await audioStore.get(id) : null;
  ui.audioFor = id;
  ui.audioUrl = row?.blob ? URL.createObjectURL(row.blob) : "";
  return ui.audioUrl;
}

function stepHTML(I, concept, s, ctx) {
  if (s.step === "plan") return planHTML(I, concept, s);
  if (s.step === "teach") return teachHTML(I, concept, s, { ...ui, canRecord: canRecord() });
  if (s.step === "own") return ownHTML(I, conceptById(s.id));
  if (s.step === "feedback") {
    const attempt = s.attempts.at(-1);
    const analysis = attempt?.text.trim() ? analyze(concept, attempt.text, { plan: s.plan }) : null;
    return attempt ? feedbackHTML(I, concept, s, attempt, analysis) : learnHTML(I, concept, s);
  }
  if (s.step === "done") return doneHTML(I, s, nextIdeas(band(ctx), s));
  return learnHTML(I, concept, s);
}

/** Up to three ideas not yet explained, from other subjects first. */
function nextIdeas(band, s) {
  const base = conceptById(s.id);
  const done = new Set(s.attempts.map((a) => a.conceptId));
  const pool = CONCEPTS.filter((c) => c.band === band && !done.has(c.id) && !ui.state.explained[c.id]);
  return [...pool.filter((c) => c.subject !== base?.subject), ...pool.filter((c) => c.subject === base?.subject)].slice(0, 3);
}

export async function render(ctx) {
  const I = i18nFor(ctx);
  ui.state = store.load();
  let s = sess();
  if (s && !conceptById(currentId(s))) {
    ui.state.session = null;
    s = null;
  }
  const title = I.S("Teach It Back", "Enséñalo de vuelta");
  const concept = s ? conceptById(currentId(s)) : null;
  if (s?.step === "teach" && s.audioId && !(await urlFor(s.audioId))) {
    s.audioId = "";
    save();
  }
  const inSteps = Boolean(s) && !ui.showPick;
  // The app shell already shows early bands (K-3) a friendly "made for grades 3-8" page, so only 3-5 and 6-8 arrive here.
  const body = inSteps ? html`${stepperHTML(I, s)}${stepHTML(I, concept, s, ctx)}` : pickHTML(I, band(ctx), ui.state, s ? conceptById(s.id) : null);
  return {
    title,
    html: html`${crumbsHTML([
        [I.S("Lab", "Laboratorio"), `${BASE}/?grades=${ctx.band}`],
        [title, null],
      ])}
      <div class="cb tb">
        <header class="cb-hero">
          <p class="eyebrow">${icon("speaking")} ${I.T("Show what you understand", "Muestra lo que entiendes")}</p>
          <h1 tabindex="-1">${I.T("Teach It Back", "Enséñalo de vuelta")}</h1>
          ${inSteps ? "" : html`<p class="lead">${I.T("Pick an idea, learn it, then teach it to someone else by typing or by recording yourself. You get feedback on your own words, and then try a different idea on your own. Nothing you write or record leaves this device.", "Elige una idea, apréndela y luego enséñasela a otra persona escribiendo o grabándote. Recibes comentarios sobre tus propias palabras y luego pruebas una idea distinta por tu cuenta. Nada de lo que escribes o grabas sale de este dispositivo.")}</p>`}
        </header>
        ${body}
      </div>`,
  };
}

const focusHeading = () => {
  const h = document.getElementById("tbStepH") || document.querySelector("h1");
  h?.focus();
  h?.scrollIntoView?.({ block: "start" });
};

async function show(ctx, { persist = true } = {}) {
  ui.error = "";
  if (persist) save();
  await ctx.rerender();
  focusHeading();
}

function problem(I, message) {
  ui.error = message;
  const box = document.getElementById("tbMsg");
  if (box) box.textContent = message;
  document.getElementById("tbText")?.focus();
}

function submit(ctx, I) {
  const s = sess();
  const concept = conceptById(currentId(s));
  const text = (document.getElementById("tbText")?.value ?? s.draft).slice(0, MAX_TEXT);
  s.draft = text;
  if (recorder.isRecording(`tb:${concept.id}`))
    return problem(I, I.S("Press Stop and keep my recording first.", "Primero pulsa Parar y guardar mi grabación."));
  const hasWords = text.trim().length > 0;
  if (!hasWords && !(s.mode === "record" && (s.audioId || s.self.length)))
    return problem(
      I,
      s.mode === "record"
        ? I.S("Record yourself, type a few words, or tick what you said.", "Grábate, escribe unas palabras o marca lo que dijiste.")
        : I.S("Write at least one sentence first.", "Primero escribe al menos una oración."),
    );
  const analysis = hasWords ? analyze(concept, text, { plan: s.plan }) : null;
  const attempt = recordAttempt(ui.state, { text, analysis });
  store.writeLedger(concept, attempt, ctx.band);
  s.step = "feedback";
  return show(ctx);
}

async function toggleRecording(ctx, I) {
  const s = sess();
  const key = `tb:${currentId(s)}`;
  if (recorder.isRecording(key)) return recorder.stop();
  ui.micError = false;
  try {
    const started = await recorder.start(key, {
      onStop: async (list) => {
        const take = list.at(-1);
        const ok = take ? await audioStore.keep(take, `teach-back:${currentId(s)}`) : false;
        ui.recording = false;
        const cur = sess(); // each render reloads the state, so the session captured at click time is stale by now
        if (ok && cur) {
          cur.audioId = take.id;
          ui.audioFor = take.id;
          ui.audioUrl = take.url;
          save();
        }
        announce(ok ? I.S("Recording kept on this device.", "Grabación guardada en este dispositivo.") : I.S("The recording could not be kept. You can type it instead.", "No se pudo guardar la grabación. Puedes escribirla."), { tone: ok ? "info" : "warn" });
        ctx.rerender();
      },
    });
    ui.recording = Boolean(started);
  } catch {
    ui.recording = false;
    ui.micError = true;
    announce(I.S("The microphone is not available. You can type your explanation.", "El micrófono no está disponible. Puedes escribir tu explicación."), { tone: "warn" });
  }
  return ctx.rerender();
}

function wordsText(I, s) {
  return s.attempts
    .map((a) => {
      const c = conceptById(a.conceptId);
      return `${c.title.en} (${a.phase})\n${a.text.trim() || "(recorded; no typed words)"}`;
    })
    .join("\n\n");
}

const printHTML = (s) =>
  html`<article class="tb-print">
    <h2>My explanations</h2>
    ${s.attempts.map((a) => html`<h3>${conceptById(a.conceptId).title.en}</h3><p>${a.text.trim() || "(recorded; no typed words)"}</p>`)}
  </article>`;

export function onInput(e) {
  const s = sess();
  if (s && e.target.id === "tbText") {
    s.draft = e.target.value.slice(0, MAX_TEXT);
    save();
  }
}

export function onChange(e, ctx) {
  const s = sess();
  const t = e.target;
  if (!s) return;
  if (t.name === "tbMode") {
    s.mode = t.value === "record" ? "record" : "type";
    save();
    ctx.rerender();
  } else if (t.name === "tbPlan" || t.name === "tbSelf") {
    const picked = [...document.querySelectorAll(`input[name="${t.name}"]:checked`)].map((x) => x.value);
    if (t.name === "tbPlan") s.plan = picked;
    else s.self = picked;
    save();
  } else if (t.matches("[data-tb-claim]")) {
    const a = s.attempts.at(-1);
    if (!a) return;
    a.claimed = t.checked ? [...new Set([...a.claimed, t.dataset.tbClaim])] : a.claimed.filter((id) => id !== t.dataset.tbClaim);
    save();
  }
}

export async function onClick(e, ctx) {
  const t = e.target.closest("button");
  if (!t || !ui.state) return false;
  const I = i18nFor(ctx);
  const s = sess();
  const d = t.dataset;
  if ("tbPick" in d) {
    if (s) markExplained(ui.state);
    store.startSession(ui.state, d.tbPick);
    Object.assign(ui, { showPick: false, audioUrl: "", audioFor: "", micError: false });
    await show(ctx, { persist: false });
  } else if ("tbResume" in d) {
    ui.showPick = false;
    await show(ctx, { persist: false });
  } else if ("tbHome" in d) {
    ui.showPick = true;
    await show(ctx, { persist: false });
  } else if ("tbNewtopic" in d) {
    endSession(ui.state);
    ui.showPick = true;
    await show(ctx);
  } else if (!s) return false;
  else if ("tbGo" in d) {
    s.step = d.tbGo;
    await show(ctx);
  } else if ("tbFrames" in d) {
    s.framesOpen = !s.framesOpen;
    if (s.framesOpen) s.framesUsed = true;
    save();
    await ctx.rerender();
  } else if ("tbModeSet" in d) {
    s.mode = "type";
    await show(ctx);
  } else if ("tbRec" in d) await toggleRecording(ctx, I);
  else if ("tbUnrec" in d) {
    const id = s.audioId;
    s.audioId = "";
    ui.audioUrl = "";
    ui.audioFor = "";
    save();
    if (id) await audioStore.remove(id);
    await ctx.rerender();
  } else if ("tbSubmit" in d) await submit(ctx, I);
  else if ("tbRevise" in d) {
    startRevision(s, attemptsFor(s, s.id).findLast((a) => a.text.trim())?.text || "");
    await show(ctx);
  } else if ("tbOwn" in d) {
    if (startOwn(s, d.tbOwn)) await show(ctx);
  } else if ("tbFinish" in d) {
    s.step = "done";
    markExplained(ui.state);
    await show(ctx);
  } else if ("tbCopy" in d) {
    const ok = await copyText(wordsText(I, s));
    announce(ok === false ? I.S("Could not copy. Use Print instead.", "No se pudo copiar. Usa Imprimir.") : I.S("Copied. Your words are on the clipboard.", "Copiado. Tus palabras están en el portapapeles."));
  } else if ("tbPrint" in d) printSheet(printHTML(s));
  else return false;
  return true;
}
