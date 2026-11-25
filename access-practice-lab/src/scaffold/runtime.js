// Scaffold Studio runtime: attaches the support behaviours to a container by event delegation. It orchestrates the
// pure modules (components, fading, profile, ask, writing) and the browser (speech, audio, microphone); it owns no
// content and no storage format. One support dial, remembered per device, applies everywhere the layer is mounted.
import { askPassage, REFUSAL } from "./ask.js";
import { wordPopoverHTML } from "./components.js";
import { needMoreHelp, STEPS } from "./fading.js";
import * as P from "./profile.js";

const t = (o, lang) => (typeof o === "string" ? o : lang === "es" ? o.es || o.en : o.en);

/** Release flags: studentRelease gates the layer for students; teachers and ?scaffold=preview always see it. */
export async function loadRelease(fetchImpl = fetch, base = "/access-practice-lab") {
  try {
    const r = await fetchImpl(`${base}/content/scaffold/release.json`, { cache: "no-cache" });
    return r.ok ? await r.json() : { studentRelease: false };
  } catch {
    return { studentRelease: false };
  }
}
export const layerOn = ({ release, audience = "student", preview = false }) => audience === "teacher" || preview || release?.studentRelease === true;

/**
 * attach(root, opts) -> detach()
 *  opts: words (id -> word support), passage (string), unit, domain, lang, home, audience, store {get,set},
 *        announce(msg), speak(text, lang), rerender()
 */
export function attach(root, opts) {
  const { words = {}, passage = "", unit = "", domain = "Reading", lang = "en", home = "", audience = "student", store, announce = () => {}, speak = defaultSpeak, rerender = () => {} } = opts;
  let profile = P.load(store);
  let step = STEPS.includes(profile.dial) ? profile.dial : "full";
  let used = new Set();
  let recorder = null;
  let url = "";
  let opener = null;
  const host = () => root.querySelector("[data-ss-pop-host]");

  const persist = () => P.save(store, profile);
  const setStep = (s) => { step = s; profile = { ...profile, dial: s }; persist(); };
  const closePop = () => { const h = host(); if (h) h.innerHTML = ""; opener?.focus?.(); opener = null; };

  function onClick(e) {
    const w = e.target.closest("[data-ss-word]");
    if (w && words[w.dataset.ssWord]) {
      opener = w;
      used.add("word");
      if (home && words[w.dataset.ssWord].glosses?.[home]) used.add("gloss");
      const h = host();
      if (h) {
        h.innerHTML = wordPopoverHTML(words[w.dataset.ssWord], { lang, home, audience, showImage: opts.showImage !== false });
        h.querySelector(".ss-pop")?.setAttribute("tabindex", "-1");
        h.querySelector(".ss-pop")?.focus();
      }
      return true;
    }
    if (e.target.closest("[data-ss-close]")) return closePop(), true;
    const sp = e.target.closest("[data-ss-speak]");
    if (sp) return used.add("audio"), speak(sp.dataset.ssSpeak, "en"), true;
    const au = e.target.closest("[data-ss-audio]");
    if (au) return used.add("audio"), new Audio(au.dataset.ssAudio).play().catch(() => {}), true;
    if (e.target.closest("[data-ss-more-help]")) {
      const r = needMoreHelp(step);
      helpAsked = true;
      setStep(r.step);
      announce(lang === "es" ? "Más ayuda activada. Está bien pedir ayuda." : "More help is on. Asking for help is fine.");
      rerender();
      return true;
    }
    const ask = e.target.closest("[data-ss-ask]");
    if (ask) return doAsk(), true;
    if (e.target.closest("[data-ss-rec-start]")) return startRec(), true;
    if (e.target.closest("[data-ss-rec-stop]")) return stopRec(), true;
    if (e.target.closest("[data-ss-done]")) return finish(), true;
    return false;
  }
  let helpAsked = false;

  function onChange(e) {
    if (e.target.matches?.('input[name^="ss-dial"]') && STEPS.includes(e.target.value)) { setStep(e.target.value); rerender(); return true; }
    return false;
  }
  function onKey(e) { if (e.key === "Escape" && host()?.firstChild) closePop(); }

  function doAsk() {
    const q = root.querySelector("[data-ss-question]")?.value || "";
    const out = root.querySelector("[data-ss-answer]");
    const pas = root.querySelector("[data-ss-passage]");
    pas?.querySelectorAll("mark").forEach((m) => m.replaceWith(...m.childNodes));
    const r = askPassage(passage, q);
    used.add("ask");
    if (r.refused) { if (out) out.textContent = t(REFUSAL[r.reason], lang); return; }
    if (out) out.textContent = (lang === "es" ? "Esto dice la lectura: " : "The passage says: ") + r.evidence;
    // highlight the evidence sentence in the visible passage
    if (pas) {
      const node = [...pas.querySelectorAll("[data-ss-sent]")].find((n) => Number(n.dataset.ssSent) === r.index);
      if (node) { const m = document.createElement("mark"); m.append(...node.childNodes); node.append(m); }
    }
  }

  async function startRec() {
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") { announce(lang === "es" ? "Este dispositivo no puede grabar. Di la oración en voz alta." : "This device can't record. Say the sentence aloud instead."); return; }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const chunks = [];
      recorder = new MediaRecorder(stream);
      recorder.ondataavailable = (ev) => chunks.push(ev.data);
      recorder.onstop = () => {
        stream.getTracks().forEach((tr) => tr.stop());
        if (url) URL.revokeObjectURL(url);
        // Memory only: the take is played back in this tab and never stored or sent.
        if (!opts.privateMode) { url = URL.createObjectURL(new Blob(chunks)); const a = root.querySelector("[data-ss-playback]"); if (a) { a.src = url; a.hidden = false; } }
        used.add("rehearsal");
      };
      recorder.start();
    } catch { announce(lang === "es" ? "No se pudo usar el micrófono." : "The microphone could not be used."); }
  }
  function stopRec() { recorder?.state === "recording" && recorder.stop(); }

  function finish() {
    profile = P.recordRun(profile, { unit, domain, step, help: helpAsked, supports: [...used], at: new Date().toISOString().slice(0, 10) });
    persist();
    used = new Set(); helpAsked = false;
    announce(lang === "es" ? "Actividad guardada en este dispositivo." : "Activity saved on this device.");
    rerender();
  }

  root.addEventListener("click", onClick);
  root.addEventListener("change", onChange);
  root.addEventListener("keydown", onKey);
  return function detach() {
    root.removeEventListener("click", onClick);
    root.removeEventListener("change", onChange);
    root.removeEventListener("keydown", onKey);
    if (recorder?.state === "recording") recorder.stop();
    if (url) URL.revokeObjectURL(url);
  };
}

function defaultSpeak(text, lang) {
  if (!("speechSynthesis" in window)) return;
  const u = new SpeechSynthesisUtterance(text);
  u.lang = lang === "es" ? "es-US" : "en-US";
  u.rate = 0.9;
  speechSynthesis.cancel();
  speechSynthesis.speak(u);
}
