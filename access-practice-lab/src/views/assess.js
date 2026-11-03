// Assessment simulator: /assess (choose a set and a mode) and /assess/<set>?mode=summative|formative.
//   summative  Test simulation: no hints, no feedback until the end, optional timer, explicit submission.
//   formative  Learning mode: check, targeted feedback, support ladder, revise, fresh attempt.
// A saved session resumes exactly where it stopped. Practice only: results are never presented as WIDA or ACCESS scores.
import { AssessmentCanvas } from "../acc/engine/canvas.js";
import * as persist from "../acc/engine/persist.js";
import { validateSet } from "../acc/engine/schema.js";
import { AssessmentSession } from "../acc/engine/session.js";
import { I18nEngine } from "../acc/i18n/I18nEngine.js";
import { makeAudioStimulusRenderer } from "../acc/audio/listening-ui.js";
import { makeSpeakingRenderer } from "../acc/audio/speaking-ui.js";
import { registerRenderer } from "../acc/engine/renderers.js";
import { assembleSet } from "../acc/adapt/mastery.js";
import { renderTeacherFeedback } from "../acc/review/feedback-ui.js";
import { openStorage } from "../acc/storage/access-db.js";
import { mountConnectionStatus, renderStoragePanel } from "../acc/storage/storage-ui.js";
import * as speech from "../speech.js";
import { BASE, esc, raw } from "../util.js";

const CONTENT = `${BASE}/content/assess`;
let loaded = null;
let controller = null;
let registered = false;
let connection = null;
let i18n = null;

async function getJson(path) {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`${path} ${res.status}`);
  return res.json();
}

/** Starter samples live with the first release's content; the bank sets (b35-..., b68-...) live in content/bank. */
const setPath = (id) => (id.startsWith("starter-") ? `${CONTENT}/${encodeURIComponent(id)}.json` : `${CONTENT.replace("/assess", "/bank")}/${encodeURIComponent(id)}.json`);

/** /assess/custom?ids=<set>:<item>,<set>:<item>: a set assembled from bank items (an assignment or a suggested next step). */
const MAX_CUSTOM = 24;
async function loadCustom(raw) {
  const picks = raw.split(",").map((x) => x.split(":")).filter(([a, b]) => /^[\w-]+$/.test(a || "") && /^[\w-]+$/.test(b || "")).slice(0, MAX_CUSTOM).map(([setId, itemId]) => ({ setId, itemId }));
  if (!picks.length) throw new Error("no items");
  const ids = [...new Set(picks.map((p) => p.setId))];
  const sets = await Promise.all(ids.map((sid) => getJson(setPath(sid))));
  const hash = [...picks.map((p) => `${p.setId}:${p.itemId}`).join(",")].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7).toString(36);
  const title = new URLSearchParams(location.search).get("title")?.slice(0, 80) || "Custom practice";
  const set = assembleSet(sets, picks, { id: `custom-${hash}`, title });
  if (!set) throw new Error("no items");
  return set;
}

const DOMAIN_ORDER = ["Listening", "Reading", "Speaking", "Writing"];
function libraryHTML(sets) {
  const card = (s) => `<li class="acc-lib-card" data-grade="${esc(s.grade)}" data-domain="${esc(s.domain)}">
  <p class="acc-q-meta">${esc(s.domain)} · Grades ${esc(s.grade.replace("-", "–"))} · ${s.items.length} questions · about ${s.minutes} minutes</p>
  <h3 data-i18n-skip>${esc(s.title)}</h3>
  <div class="acc-actions">
    <a class="acc-btn primary" href="${BASE}/assess/${esc(s.id)}?mode=summative">Test simulation</a>
    <a class="acc-btn" href="${BASE}/assess/${esc(s.id)}?mode=formative">Learning mode</a>
  </div>
</li>`;
  return `<section class="acc-library" aria-labelledby="accLibTitle">
  <h2 id="accLibTitle">Practice library</h2>
  <p class="acc-hint">Original practice sets in listening, reading, speaking and writing for grades 3–5 and 6–8. Speaking sets need a microphone. They are saved for your teacher to review.</p>
  <div class="acc-filters">
    <label class="acc-field" for="libGrade"><span>Grade band</span><select id="libGrade" class="acc-select"><option value="all">All</option><option value="3-5">Grades 3–5</option><option value="6-8">Grades 6–8</option></select></label>
    <label class="acc-field" for="libDomain"><span>Domain</span><select id="libDomain" class="acc-select"><option value="all">All</option>${DOMAIN_ORDER.map((d) => `<option value="${d}">${d}</option>`).join("")}</select></label>
  </div>
  <p class="acc-hint" id="libCount" role="status" aria-live="polite"></p>
  <ul class="acc-lib-list">${sets.map(card).join("")}</ul>
</section>`;
}

export async function render(ctx) {
  const { id, mode: modeParam } = { id: ctx.route.id, mode: new URLSearchParams(location.search).get("mode") };
  loaded = null;
  if (!id) {
    const { sets } = await getJson(`${CONTENT}/sets.json`);
    let bank = [];
    try {
      bank = (await getJson(`${CONTENT.replace("/assess", "/bank")}/index.json`)).sets.map((x) => ({ ...x, items: x.items }));
    } catch {}
    const cards = sets
      .map(
        (s) => `<article class="acc-card">
  <p class="acc-q-meta">Grades ${esc(s.grade.replace("-", "–"))} · ${s.items} questions · about ${s.minutes} minutes</p>
  <h2 data-i18n-skip>${esc(s.title)}</h2>
  <p data-i18n-skip>${esc(s.description)}</p>
  <div class="acc-actions">
    <a class="acc-btn primary" href="${BASE}/assess/${esc(s.id)}?mode=summative">Test simulation</a>
    <a class="acc-btn" href="${BASE}/assess/${esc(s.id)}?mode=formative">Learning mode</a>
  </div>
</article>`,
      )
      .join("");
    return {
      title: "Assessment simulator",
      html: raw(`<section class="acc-wrap" aria-labelledby="accTitle">
  <p class="eyebrow">Assessment simulator</p>
  <h1 id="accTitle" tabindex="-1">Practice like the real thing, or learn as you go</h1>
  <p class="lead">Each set has passages, listening, speaking and writing. Choose <strong>Test simulation</strong> to practice on your own with no hints. Choose <strong>Learning mode</strong> to get feedback, supports and a fresh try.</p>
  <h2>Mixed practice samples</h2>
  <div class="acc-grid">${cards}</div>
  ${bank.length ? libraryHTML(bank) : ""}
  <div id="accStorageHost"></div>
  <p class="acc-hint">This is independent practice. It is not an official WIDA or ACCESS assessment and it does not produce an official score or level.</p>
</section>`),
    };
  }
  let set;
  try {
    set = id === "custom" ? await loadCustom(new URLSearchParams(location.search).get("ids") || "") : await getJson(setPath(id));
  } catch {
    return { title: "Practice set not found", html: raw(`<section class="acc-wrap"><h1 tabindex="-1">We could not find that practice set.</h1><p><a class="acc-btn primary" href="${BASE}/assess">Choose a practice set</a></p></section>`) };
  }
  const check = validateSet(set);
  if (!check.ok) {
    console.error("[assess] invalid set", check.errors);
    return { title: "Practice set unavailable", html: raw(`<section class="acc-wrap"><h1 tabindex="-1">This practice set is unavailable.</h1><p>It did not pass its content checks.</p></section>`) };
  }
  const mode = modeParam === "formative" ? "formative" : "summative";
  loaded = { set, mode };
  return {
    title: set.title,
    html: raw(`<section class="acc-wrap acc-wide" aria-labelledby="accTitle">
  <nav class="acc-crumb" aria-label="Breadcrumb"><a href="${BASE}/">Practice Lab</a> / <a href="${BASE}/assess">Assessment simulator</a> / <span aria-current="page" data-i18n-skip>${esc(set.title)}</span></nav>
  <h1 id="accTitle" tabindex="-1" data-i18n-skip>${esc(set.title)}</h1>
  <div id="accConnHost"></div>
  <div id="accAssess" data-set="${esc(set.id)}" data-mode="${mode}"></div>
</section>`),
  };
}

function introHTML(set, mode, saved) {
  const rules =
    mode === "summative"
      ? "<li>You get no hints and no feedback until you finish.</li><li>You can go back, mark questions for review, and change answers.</li><li>You submit when you are ready. Nothing is scored by the lab for speaking or writing.</li>"
      : "<li>Check an answer to get feedback.</li><li>Open Support 1, 2, then 3 if you need help.</li><li>Revise and try again. Your first try on your own is what shows independence.</li>";
  return `<div class="acc-card acc-intro">
  <p class="acc-q-meta">${mode === "summative" ? "Test simulation" : "Learning mode"} · ${set.items.length} questions</p>
  <h2>Before you begin</h2>
  <ul>${rules}<li>Tools: highlighter, line reader, text size, and answer cross-out are at the top of every question.</li></ul>
  ${mode === "summative" ? `<label class="acc-check"><input type="checkbox" id="accTimer" checked /> Use the timer (${set.minutes} minutes)</label>` : ""}
  <div class="acc-actions">
    <button type="button" class="acc-btn primary" data-act="begin">${saved ? "Resume where I left off" : "Start"}</button>
    ${saved ? '<button type="button" class="acc-btn" data-act="restart">Start over</button>' : ""}
  </div>
</div>`;
}

export async function mount(root) {
  i18n?.stop();
  i18n = new I18nEngine({ root: root.querySelector(".acc-wrap") || root }).start();
  const storageHost = root.querySelector("#accStorageHost");
  if (storageHost) {
    renderTeacherFeedback({ doc: document, getStorage: openStorage }).then((fb) => fb && storageHost.before(fb));
    storageHost.append(renderStoragePanel({ doc: document, getStorage: openStorage }).el);
    bindLibrary(root);
    return;
  }
  const host = root.querySelector("#accAssess");
  if (!host || !loaded) return;
  connection?.destroy();
  connection = mountConnectionStatus(document, root.querySelector("#accConnHost"));
  const { set, mode } = loaded;
  if (!registered) {
    registered = true;
    registerRenderer("speaking-response", makeSpeakingRenderer({ getStorage: openStorage }));
  }
  const saved = await persist.loadSession(set.id, mode);
  const usable = saved && saved.session && saved.session.setId === set.id && saved.session.status !== "submitted" ? saved : null;
  const done = saved?.session?.status === "submitted" ? saved : null;

  const start = async (resume, withTimer = true) => {
    const session = resume && usable ? AssessmentSession.restore(set, usable.session) : new AssessmentSession(set, { mode, minutes: mode === "summative" && withTimer ? set.minutes : null });
    session.start();
    host.replaceChildren();
    const canvas = new AssessmentCanvas(host, session, {
      prefs: usable?.prefs || saved?.prefs,
      tools: resume && usable ? usable.tools : null,
      stimulusRenderers: { audio: makeAudioStimulusRenderer(speech) },
      save: (snapshot) => persist.saveSession(set.id, mode, snapshot),
      onSubmit: (result) => persist.submitResult(set, mode, canvas.snapshot(), result),
    });
    controller = canvas.mount();
    canvas.save();
    canvas.focusQuestion();
  };

  if (done) {
    const session = AssessmentSession.restore(set, done.session);
    controller = new AssessmentCanvas(host, session, { prefs: done.prefs, tools: done.tools, stimulusRenderers: { audio: makeAudioStimulusRenderer(speech) }, save: (s) => persist.saveSession(set.id, mode, s) }).mount();
    return;
  }
  host.innerHTML = introHTML(set, mode, Boolean(usable));
  host.querySelector("[data-act=begin]").addEventListener("click", () => start(Boolean(usable), host.querySelector("#accTimer")?.checked !== false));
  host.querySelector("[data-act=restart]")?.addEventListener("click", async () => {
    await persist.removeSession(set.id, mode);
    start(false, host.querySelector("#accTimer")?.checked !== false);
  });
}

function bindLibrary(root) {
  const grade = root.querySelector("#libGrade");
  const domain = root.querySelector("#libDomain");
  if (!grade) return;
  const cards = [...root.querySelectorAll(".acc-lib-card")];
  const count = root.querySelector("#libCount");
  const apply = () => {
    let n = 0;
    for (const c of cards) {
      const show = (grade.value === "all" || c.dataset.grade === grade.value) && (domain.value === "all" || c.dataset.domain === domain.value);
      c.hidden = !show;
      if (show) n += 1;
    }
    count.textContent = `${n} practice sets shown`;
  };
  grade.addEventListener("change", apply);
  domain.addEventListener("change", apply);
  apply();
}

export function unmount() {
  i18n?.stop();
  i18n = null;
  connection?.destroy();
  connection = null;
  controller?.destroy();
  controller = null;
}
