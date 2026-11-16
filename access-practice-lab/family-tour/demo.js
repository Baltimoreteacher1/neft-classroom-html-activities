// The contained demonstration: the same picture, question, word help, sentence starters and example answers a student
// sees for one real activity, rebuilt from its content so it runs inside the tour. It is not the student page: it
// reads no progress, writes none, and keeps a recording or typed answer in this page's memory until the family leaves.
import { canSpeak } from "./audio.js";
import { tips } from "./feedback.js";
import { getLang, t } from "./i18n.js";
import { canRecord } from "./recorder.js";
import { en, esc, icon, markAdded, pictureSrc } from "./util.js";

/** Per-activity screen state: kept across language changes and re-renders, dropped when the tour closes. */
export const ui = { demo: {}, recorders: {}, picks: {} };
export const demoState = (id) => (ui.demo[id] ||= { open: {}, mode: "", text: "", attempts: [], checked: false, listened: false });

const listenBtn = (text, label, lang = "en-US") =>
  canSpeak()
    ? `<button type="button" class="btn-listen" data-act="listen" data-text="${esc(text)}" data-speech="${lang}" aria-pressed="false" aria-label="${esc(label)}">${icon("listen")}<span>${esc(t("shell.listen"))}</span></button>`
    : "";

const disclosure = (id, key, title, body, open) =>
  `<div class="support ${open ? "is-open" : ""}">
    <button type="button" class="support-btn" data-act="support" data-id="${esc(id)}" data-k="${key}" aria-expanded="${open}" aria-controls="sup-${esc(id)}-${key}">${esc(title)}<span aria-hidden="true">${open ? "−" : "+"}</span></button>
    <div class="support-body" id="sup-${esc(id)}-${key}" ${open ? "" : "hidden"}>${body}</div>
  </div>`;

function supports(p, st, domainKey) {
  const es = getLang() === "es";
  const words = p.words
    .map((w) => {
      const v = p.vocab.find((x) => x.word.toLowerCase() === w.toLowerCase());
      return `<li>${en(w)}${es && v?.es ? ` <small>= ${esc(v.es)}</small>` : ""}</li>`;
    })
    .join("");
  const vocabNote = es && p.vocab.length ? `<p class="fine">${esc(t("demo.wordsEsNote"))}</p>` : "";
  const frames = p.frames.map((f) => `<li>${en(f)}</li>`).join("");
  const sample = p.models.A || "";
  return [
    disclosure(p.id, "words", t("demo.words"), `<ul class="chips">${words}</ul>${vocabNote}`, st.open.words),
    disclosure(p.id, "starters", t("demo.starters"), `<ul class="frames">${frames}</ul>`, st.open.starters),
    disclosure(
      p.id,
      "sample",
      t("demo.sample"),
      `<p class="sample" lang="en">${esc(sample)}</p><p class="fine">${esc(t(domainKey === "Speaking" ? "demo.sampleSay" : "demo.sampleWrite"))}</p>${listenBtn(sample, t("shell.listenTo", { what: t("demo.sample") }))}`,
      st.open.sample,
    ),
  ].join("");
}

function feedbackBlock(p, st) {
  if (!st.checked) return "";
  const last = st.attempts[st.attempts.length - 1];
  const { good, next } = tips(last, p);
  const line = (m) => `<li>${esc(t(m.key, m.vars))}</li>`;
  return `<div class="feedback" role="status" aria-live="polite" data-feedback>
    <h4>${esc(t("demo.fbTitle"))}</h4>
    ${good.length ? `<ul class="ok">${good.map(line).join("")}</ul>` : ""}
    <p class="next"><strong>${esc(t("demo.fbNext"))}</strong> ${esc(t(next.key, next.vars))}</p>
    <p class="fine">${esc(t("demo.fbHonest"))}</p>
    <button type="button" class="btn-quiet" data-act="retry" data-id="${esc(p.id)}">${esc(t("demo.tryAgain"))}</button>
  </div>`;
}

export function recorderHTML(p, state, url) {
  const id = esc(p.id);
  const note = `<p class="fine">${esc(t("demo.recPrivacy"))}</p>`;
  if (state === "unsupported" || state === "denied" || state === "error")
    return `<div class="rec-msg" role="status"><p><strong>${esc(t(`demo.rec_${state}`))}</strong></p><p>${esc(t("demo.recFallback"))}</p><button type="button" class="btn-quiet" data-act="resp-mode" data-id="${id}" data-v="type">${esc(t("demo.typeInstead"))}</button></div>`;
  if (state === "recording")
    return `<div class="rec-live" role="status"><span class="rec-dot" aria-hidden="true"></span>${esc(t("demo.recording"))}<button type="button" class="btn-primary" data-act="rec-stop" data-id="${id}">${esc(t("demo.stop"))}</button></div>`;
  if (state === "asking") return `<p role="status">${esc(t("demo.recAsking"))}</p>`;
  if (state === "recorded")
    return `<div class="rec-done"><p><strong>${esc(t("demo.recDone"))}</strong></p><audio controls src="${esc(url)}" aria-label="${esc(t("demo.recListen"))}"></audio>
      ${selfCheck(p)}
      <button type="button" class="btn-quiet" data-act="rec-reset" data-id="${id}">${esc(t("demo.recAgain"))}</button>${note}</div>`;
  return `<button type="button" class="btn-primary btn-mic" data-act="rec-start" data-id="${id}">${icon("speak")}<span>${esc(t("demo.recStart"))}</span></button>${note}`;
}

function selfCheck(p) {
  const items = (p.sayFor || []).slice(0, 3);
  const generic = [t("demo.self1"), t("demo.self2"), t("demo.self3")];
  const rows = items.length ? items.map((x) => `<li lang="en">${esc(x)}</li>`) : generic.map((x) => `<li>${esc(x)}</li>`);
  return `<fieldset class="selfcheck"><legend>${esc(t("demo.selfTitle"))}</legend><ul>${rows.join("")}</ul><p class="fine">${esc(t("demo.selfNote"))}</p></fieldset>`;
}

function response(p, st) {
  const id = esc(p.id);
  const speaking = p.domain === "Speaking";
  const mode = st.mode || (speaking && canRecord() ? "say" : "type");
  const tabs = speaking
    ? `<div class="seg" role="group" aria-label="${esc(t("demo.howRespond"))}">
        <button type="button" data-act="resp-mode" data-id="${id}" data-v="say" aria-pressed="${mode === "say"}">${esc(t("demo.say"))}</button>
        <button type="button" data-act="resp-mode" data-id="${id}" data-v="type" aria-pressed="${mode === "type"}">${esc(t("demo.type"))}</button>
      </div>`
    : "";
  const rec = ui.recorders[p.id];
  const body =
    mode === "say"
      ? `<div data-rec="${id}">${recorderHTML(p, rec?.state || (canRecord() ? "idle" : "unsupported"), rec?.url || "")}</div>`
      : `<label class="field" for="ans-${id}"><span>${esc(t(speaking ? "demo.typeLabelSay" : "demo.typeLabelWrite"))}</span>
          <textarea id="ans-${id}" rows="4" data-draft="${id}" lang="en" placeholder="${esc(p.frames[0] || "")}">${esc(st.text)}</textarea></label>
        <button type="button" class="btn-primary" data-act="check" data-id="${id}">${esc(t("demo.check"))}</button>
        ${feedbackBlock(p, st)}`;
  return `<div class="response"><h4>${esc(t(speaking ? "demo.yourTurnSay" : "demo.yourTurnWrite"))}</h4>${tabs}${body}</div>`;
}

/** The student's view of one activity. `variant` is "explore", "practice" or "preview"; only the heading line differs. */
export function demoHTML(p, variant = "explore") {
  const st = demoState(p.id);
  const src = pictureSrc(p);
  ui.picks[p.id] = p;
  return `<article class="demo demo-${variant} d-${p.domain.toLowerCase()}" aria-label="${esc(p.title)}">
    <header class="demo-bar"><span>${esc(t(p.domain === "Speaking" ? "demo.barSpeaking" : "demo.barWriting"))}</span><span class="pill">${esc(t("demo.previewOnly"))}</span></header>
    <div class="demo-body">
      <h3 lang="en">${esc(p.title)}</h3>
      ${src ? `<figure><img src="${esc(src)}" alt="${esc(p.picture.alt)}" lang="en" loading="lazy" width="640" height="400"></figure>` : ""}
      <p class="q" lang="en">${esc(p.prompt)}</p>
      ${listenBtn(p.prompt, t("shell.listenTo", { what: t("demo.question") }))}
      ${p.directions ? `<p class="dir" lang="en">${esc(p.directions)}</p>` : ""}
      <div class="supports"><h4>${esc(t("demo.helpTitle"))}</h4>${supports(p, st, p.domain)}</div>
      ${response(p, st)}
    </div>
  </article>`;
}

/** Updates the recorder slot in place so a typed or half-finished answer elsewhere on the screen is untouched. */
export function refreshRecorder(id) {
  const slot = document.querySelector(`[data-rec="${CSS.escape(id)}"]`);
  const rec = ui.recorders[id];
  const pick = ui.picks[id];
  if (slot && rec && pick) slot.innerHTML = recorderHTML(pick, rec.state, rec.url);
}

/** Two sentences for the "make it better" demonstration: a short answer, then a fuller one, with the additions marked. */
export function improveHTML(p) {
  const a = p.models.A;
  const b = p.models.B || p.models.C;
  if (!a || !b) return "";
  return `<section class="improve" aria-labelledby="imp-${esc(p.id)}">
    <h4 id="imp-${esc(p.id)}">${esc(t("demo.improveTitle"))}</h4>
    <div class="improve-grid">
      <div><p class="tag">${esc(t("demo.improveFirst"))}</p><p class="bubble" lang="en">${esc(a)}</p></div>
      <div><p class="tag">${esc(t("demo.improveBetter"))}</p><p class="bubble good" lang="en">${markAdded(a, b)}</p></div>
    </div>
    <p class="fine">${esc(t("demo.improveNote"))}</p>
  </section>`;
}

