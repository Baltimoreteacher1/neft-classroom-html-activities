// Publisher demonstration: one learner journey (Listening → Reading → Speaking → Writing → Evidence) on a
// shared science topic. Own storage key; never writes to the real ledger or Passport.
//   /publisher-demo  /publisher-demo/<listen|read|speak|write|evidence|publishers>
import { loadPublisherEvidence, loadPublisherJourney } from "../content.js";
import { i18nFor } from "../i18n.js";
import { takesFor } from "../recorder.js";
import { summarizeEnvelope } from "../lang/audio.js";
import { speak } from "../speech.js";
import { announce, safeJson, storage } from "../util.js";
import { html } from "../util.js";
import { defaultOrder, freshState, isCorrect, normalize, recordResult, STORE_KEY, stageOf } from "../publisher/evidence.js";
import { evidenceHTML, overviewHTML, publishersHTML, stepperHTML } from "../publisher/panels.js";
import { listenStage, readStage, speakStage, writeStage } from "../publisher/stages.js";

let J = null;
let E = null;
let s = freshState();
let ctxRef = null;
const DOMAIN_OF = { listen: "listening", read: "reading" };

const load = () => normalize(safeJson(storage.get(STORE_KEY), null));
const save = () => storage.set(STORE_KEY, JSON.stringify(s));
const mark = (domain) => { if (s.mode === "supported") s[domain].support = true; };
const taskOf = (domain, id) => J[DOMAIN_OF[domain]].tasks.find((t) => t.id === id);

export async function render(ctx) {
  ctxRef = ctx;
  [J, E] = await Promise.all([loadPublisherJourney(), loadPublisherEvidence()]);
  s = load();
  const I = i18nFor(ctx);
  const step = ctx.route.id || "";
  const body = {
    "": () => overviewHTML(J, E, s, I),
    listen: () => listenStage(J, s, I, s.mode),
    read: () => readStage(J, s, I, s.mode),
    speak: () => speakStage(J, s, I, s.mode),
    write: () => writeStage(J, s, I, s.mode),
    evidence: () => evidenceHTML(J, E, s, I),
    publishers: () => publishersHTML(J, E, I),
  }[step] || (() => overviewHTML(J, E, s, I));
  const modeNote = ["listen", "read", "speak", "write"].includes(step)
    ? html`<fieldset class="pd-mode pd-mode-inline"><legend>${I.T("Working mode", "Modo de trabajo")}</legend>${["supported", "independent"].map((m) => html`<label class="pd-opt"><input type="radio" name="pd-mode" data-pd-mode="${m}" ${s.mode === m ? html`checked` : ""}> <span>${m === "supported" ? I.T("Learn with support", "Aprender con apoyo") : I.T("Show it on my own", "Mostrarlo por mi cuenta")}</span></label>`)}</fieldset>` : "";
  const nav = step === "publishers" ? "" : stepperHTML(step, I);
  return { title: J.title, html: html`<div class="pd-wrap domain-journey">${nav}${modeNote}${body()}<p class="fine pd-fine">${J.unofficial}</p></div>` };
}

export const canListen = (key) => key !== "pd-listen" || s.mode === "supported" || s.listen.plays < J.listening.maxPlays;
export function onListen(key) {
  if (key !== "pd-listen") return;
  s.listen.plays += 1;
  mark("listen");
  save();
  // Show the questions and the play count at once, even where speech cannot report that it finished.
  setTimeout(() => ctxRef?.rerender(), 0);
}

/** After a take: keep loudness measures (never the audio or envelope). */
export function onRecorded(key) {
  if (key !== "pd-speak") return;
  const take = takesFor(key).at(-1);
  if (!take) return;
  s = load();
  const m = summarizeEnvelope(take.env, take.fps);
  s.speak.measures.push({ ...m, segments: undefined });
  mark("speak");
  save();
}

function check(domain, id) {
  const t = taskOf(domain, id);
  const answer = domain === "listen" && t.type === "order" ? (s.listen.order || defaultOrder(t)) : domain === "read" && t.type === "evidence" ? s.read.pinned : s[domain].answers[id];
  mark(domain);
  recordResult(s[domain].results, t, isCorrect(t, answer), stageOf(s[domain]));
  s[domain].answers[id] = answer;
}

export function onClick(e) {
  const t = e.target;
  const q = (sel) => t.closest(sel);
  let el;
  if ((el = q("[data-pd-move]"))) {
    const [id, dir] = el.dataset.pdMove.split(":");
    const task = J.listening.tasks[0];
    const order = [...(s.listen.order || defaultOrder(task))];
    const i = order.indexOf(id), j = i + Number(dir);
    if (j >= 0 && j < order.length) { [order[i], order[j]] = [order[j], order[i]]; s.listen.order = order; save(); announce(`Moved to position ${j + 1} of ${order.length}.`); }
  } else if ((el = q("[data-pd-check]"))) {
    const [d, id] = el.dataset.pdCheck.split(":");
    check(d, id); save();
  } else if ((el = q("[data-pd-retry]"))) {
    const [d, id] = el.dataset.pdRetry.split(":");
    delete s[d].answers[id];
    if (d === "read" && taskOf(d, id).type === "evidence") s.read.pinned = "";
    save();
  } else if ((el = q("[data-pd-pin]"))) { s.read.pinned = el.dataset.pdPin; save(); announce("Sentence pinned.");
  } else if ((el = q("[data-pd-part]"))) { speak(J.listening.script[Number(el.dataset.pdPart)], { rate: ctxRef.prefs.rate }); return true;
  } else if (q("[data-pd-feedback]")) { s.write.gotFeedback = true; mark("write"); save();
  } else if (q("[data-pd-print]")) { window.print(); return true;
  } else if (q("[data-pd-reset]")) {
    if (!window.confirm("Clear this demonstration's saved work on this device?")) return true;
    storage.remove(STORE_KEY); s = freshState(); announce("Journey cleared.");
  } else return false;
  e.preventDefault();
  ctxRef.rerender();
  return true;
}

export function onChange(e) {
  const t = e.target;
  if (t.dataset.pdMode) { s.mode = t.dataset.pdMode; save(); ctxRef.rerender(); announce(s.mode === "supported" ? "Learning with support." : "Independent attempt."); }
  else if (t.dataset.pdAnswer) { const [d, id] = t.dataset.pdAnswer.split(":"); s[d].answers[id] = t.value; save(); ctxRef.rerender(); }
  else if (t.dataset.pdTranscript !== undefined || t.dataset.pdDraft === "2" || t.dataset.pdReflection !== undefined) { save(); ctxRef.rerender(); }
  else if (t.dataset.pdSpeakcheck) { s.speak.checks[t.dataset.pdSpeakcheck] = t.checked; mark("speak"); save(); }
}

export function onInput(e) {
  const t = e.target;
  if (t.dataset.pdNote !== undefined) s.listen.notes[t.dataset.pdNote] = t.value;
  else if (t.dataset.pdTranscript !== undefined) s.speak.transcripts[Number(t.dataset.pdTranscript)] = t.value;
  else if (t.dataset.pdDraft) {
    s.write[t.dataset.pdDraft === "1" ? "draft1" : "draft2"] = t.value;
    const btn = document.querySelector("[data-pd-feedback]");
    if (btn && t.dataset.pdDraft === "1") btn.disabled = t.value.trim().split(/\s+/).filter(Boolean).length < 5;
  }
  else if (t.dataset.pdReflection !== undefined) s.write.reflection = t.value;
  else return;
  save();
}
export const onKey = () => {};
