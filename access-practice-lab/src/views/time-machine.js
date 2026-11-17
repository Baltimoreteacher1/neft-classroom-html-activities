// Language Time Machine (/time-machine, ?tab=writing|speaking|challenge|reflections|evidence, &pair=<id>, &from=<item>):
// an earlier and a later piece of the learner's own language side by side, with the context of each. It extends
// Passport and Portfolio (both show a door to it) and keeps no second copy of any work: everything is read from what
// the lab already saves (src/timemachine/collect.js), also after a Passport import on a teacher's device.
//
// Rules this view keeps: earlier work is read-only (the only writes are this feature's own key, a NEW loop for a
// new-context task, and a kept recording the learner makes here); pairs are same-domain only; every change statement
// shows its quote; length is never growth; speaking is never judged by how a voice sounds; nothing is sent anywhere
// until the learner presses "Share this comparison with my teacher"; no score, level, percentage or timer.
import * as audioStore from "../audio-store.js";
import { crumbsHTML } from "../components.js";
import { i18nFor } from "../i18n.js";
import { compareWork, transferFor } from "../intel/engine.js";
import { loadIntel, saveIntel } from "../intel/loop.js";
import { inClass, shareWithClass } from "../intel/share.js";
import * as recorder from "../recorder.js";
import {
  TASK_PREFIX,
  canSave,
  challengeFor,
  helpFrames,
  saveChallenge,
} from "../timemachine/challenge.js";
import { pairId } from "../timemachine/collect.js";
import { comparePair } from "../timemachine/compare.js";
import { buildEvidence, packetLabel, packetText } from "../timemachine/evidence.js";
import { loadModel } from "../timemachine/load.js";
import {
  loadTM,
  reflectionFor,
  saveTM,
  setAnswer,
  setAudio,
  setTranscript,
  setVerified,
} from "../timemachine/reflect.js";
import {
  challengeHTML,
  challengePickHTML,
  evidenceHTML,
  reflectionsHTML,
} from "../timemachine/ui-more.js";
import { speakingPairHTML } from "../timemachine/ui-speaking.js";
import { TABS, emptyHTML, headHTML, pairListHTML, writingPairHTML } from "../timemachine/ui.js";
import { BASE, announce, html } from "../util.js";

const MAX_AGE_MS = 30 * 864e5; // the same 30 days audio-store.js keeps a recording
const freshChallenge = (key = "") => ({
  key,
  text: "",
  help: false,
  saved: "",
  error: false,
  audioId: "",
  audioUrl: "",
  recording: false,
});
let ui = { share: {}, ch: freshChallenge(), recording: "", urls: new Map(), seq: null };
/** Object URL for a recording that is still kept (and not past 30 days), else "". Read-only: nothing is deleted. */
async function urlFor(id) {
  if (!id) return "";
  if (ui.urls.has(id)) return ui.urls.get(id);
  const row = audioStore.available() ? await audioStore.get(id) : null;
  const kept = row?.blob && Date.now() - Date.parse(row.t) <= MAX_AGE_MS;
  const url = kept ? URL.createObjectURL(row.blob) : "";
  ui.urls.set(id, url);
  return url;
}
async function urlsFor(ids) {
  const out = {};
  for (const id of new Set(ids.filter(Boolean))) out[id] = await urlFor(id);
  return out;
}

const tabOf = (ctx) => {
  const t = ctx.route.tab || ctx.route.id || "writing";
  return TABS.some((x) => x.id === t) ? t : "writing";
};

async function pairSection(I, ctx, model, kind) {
  const band = ctx.band;
  const list = kind === "speaking" ? model.speaking : model.writing;
  if (!list.length)
    return emptyHTML(
      I,
      band,
      kind,
      model.items.filter((x) => x.kind === kind && x.keyUse),
    );
  const pair = list.find((p) => p.id === ctx.route.q?.pair) || list[0];
  const cmp = comparePair(pair, { compareWork });
  const reflection = reflectionFor(model.tm, pair.id);
  const urls = await urlsFor([
    pair.earlier.audioId,
    pair.later.audioId,
    ...Object.values(reflection.audio || {}),
  ]);
  const extra = {
    reflection,
    urls,
    canRecord: recorder.canRecord() && audioStore.available(),
    recording: ui.recording,
    inClass: inClass(),
    share: { ...ui.share[pair.id], sharedAt: model.tm.shared[pair.id]?.t },
  };
  return html`${pairListHTML(I, band, kind, list, pair.id)}${kind === "speaking" ? speakingPairHTML(I, band, model, pair, cmp, extra) : writingPairHTML(I, band, model, pair, cmp, extra)}`;
}

function challengeSection(I, ctx, model) {
  const from = model.items.find((x) => x.id === ctx.route.q?.from);
  if (!from) return challengePickHTML(I, ctx.band, model.items);
  if (ui.ch.key !== from.id) ui.ch = freshChallenge(from.id);
  const done = model.items.filter((x) => x.taskId.startsWith(TASK_PREFIX)).map((x) => x.taskId);
  const ch = challengeFor(from, { transferFor, done });
  return challengeHTML(I, ctx.band, from, ch, ui.ch, {
    frames: helpFrames(ch.keyUse),
    canRecord: recorder.canRecord() && audioStore.available(),
  });
}

export async function render(ctx) {
  const I = i18nFor(ctx);
  const band = ctx.band;
  const tab = tabOf(ctx);
  const model = await loadModel();
  const counts = {
    writing: model.writing.length,
    speaking: model.speaking.length,
    reflections: model.reflections.length,
  };
  let body;
  if (tab === "challenge") body = challengeSection(I, ctx, model);
  else if (tab === "reflections") {
    const urls = await urlsFor(model.reflections.flatMap((r) => Object.values(r.audio)));
    body = reflectionsHTML(
      I,
      band,
      model.reflections,
      new Map(model.pairs.map((p) => [p.id, p])),
      urls,
    );
  } else if (tab === "evidence") {
    const comparisons = Object.fromEntries(
      model.pairs.map((p) => [p.id, comparePair(p, { compareWork })]),
    );
    body = evidenceHTML(
      I,
      band,
      buildEvidence({ items: model.items, pairs: model.pairs, comparisons, tm: model.tm }),
      model.reflections,
    );
  } else body = await pairSection(I, ctx, model, tab);
  const title = I.S("Language Time Machine", "Máquina del tiempo del lenguaje");
  return {
    title,
    html: html`${crumbsHTML([
        [I.S("Lab", "Laboratorio"), `${BASE}/?grades=${band}`],
        [I.S("Passport", "Pasaporte"), `${BASE}/passport?grades=${band}`],
        [title, null],
      ])}
      <div
        class="tm-page"
        data-tm-tab="${tab}"
        data-tm-engine="engine"
      >
        ${headHTML(I, band, tab, counts)}${body}
      </div>`,
  };
}

// ── events ───────────────────────────────────────────────────────────────────
const players = () => ["a", "b"].map((s) => document.querySelector(`[data-tm-audio="${s}"]`));
function stopPlayers() {
  ui.seq?.abort();
  ui.seq = null;
  for (const p of players()) p?.pause();
}
function play(mode, I) {
  const [a, b] = players();
  const status = document.querySelector("[data-tm-playing]");
  const say = (en, es) => status && (status.textContent = I.S(en, es));
  stopPlayers();
  if (mode === "stop" || !a || !b) return say("Stopped.", "Detenido.");
  a.currentTime = 0;
  b.currentTime = 0;
  if (mode === "together") {
    say(
      "Playing both recordings together from the start.",
      "Reproduciendo las dos grabaciones juntas desde el inicio.",
    );
    Promise.all([a.play(), b.play()]).catch(() =>
      say("The recordings could not play.", "No se pudieron reproducir las grabaciones."),
    );
    return;
  }
  ui.seq = new AbortController();
  say(
    "Playing the earlier recording, then the later one.",
    "Reproduciendo la grabación anterior y luego la posterior.",
  );
  a.addEventListener(
    "ended",
    () => {
      say("Now the later recording.", "Ahora la grabación posterior.");
      b.play().catch(() => {});
    },
    { once: true, signal: ui.seq.signal },
  );
  a.play().catch(() =>
    say("The recordings could not play.", "No se pudieron reproducir las grabaciones."),
  );
}

async function share(ctx, id) {
  const model = await loadModel();
  const pair = model.pairs.find((p) => p.id === id);
  if (!pair) return;
  if (!inClass()) {
    ui.share[id] = { state: "no-class" };
    return ctx.rerender();
  }
  ui.share[id] = { state: "sending" };
  ctx.rerender();
  const text = packetText(
    pair,
    comparePair(pair, { compareWork }),
    reflectionFor(model.tm, id),
  );
  const res = await shareWithClass({ label: packetLabel(pair), text });
  if (res.ok) {
    const tm = loadTM();
    tm.shared[id] = { t: new Date().toISOString(), workId: res.workId || "" };
    saveTM(tm);
  }
  ui.share[id] = { state: res.ok ? "sent" : res.reason === "no-class" ? "no-class" : "failed" };
  ctx.rerender();
}

/** Record with the lab's recorder and keep the take on this device; `done(audioId)` runs once it is kept. */
async function toggleRecording(ctx, I, key, task, done) {
  if (recorder.isRecording(key)) return recorder.stop();
  try {
    const started = await recorder.start(key, {
      onStop: async (list) => {
        const take = list.at(-1);
        const ok = take ? await audioStore.keep(take, task) : false;
        if (ok) ui.urls.delete(take.id);
        done(ok ? take.id : "");
        announce(
          ok
            ? I.S("Recording kept on this device.", "Grabación guardada en este dispositivo.")
            : I.S("The recording could not be kept.", "No se pudo guardar la grabación."),
        );
        ctx.rerender();
      },
    });
    if (!started) done("");
  } catch {
    done("");
    announce(
      I.S(
        "The microphone is not available. You can type your answer.",
        "El micrófono no está disponible. Puedes escribir tu respuesta.",
      ),
      { tone: "warn" },
    );
  }
  ctx.rerender();
}

function saveChallengeNow(ctx) {
  const text = document.querySelector("[data-tm-challenge]")?.value ?? ui.ch.text;
  ui.ch.text = text;
  if (!canSave(text)) {
    ui.ch.error = true;
    return ctx.rerender();
  }
  // The challenge is rebuilt from the same inputs the page showed, so what is saved is what was asked.
  loadModel().then((model) => {
    const from = model.items.find((x) => x.id === ctx.route.q?.from);
    if (!from) return;
    const done = model.items.filter((x) => x.taskId.startsWith(TASK_PREFIX)).map((x) => x.taskId);
    const ch = challengeFor(from, { transferFor, done });
    const intel = loadIntel();
    const tm = loadTM();
    const saved = saveChallenge(intel, tm, ch, {
      text,
      supports: ui.ch.help ? { frames: true } : {},
      audioId: ui.ch.audioId,
      band: ctx.band,
    });
    if (!saved) return;
    saveIntel(intel);
    saveTM(tm);
    ui.ch.saved = pairId(from, { id: `l:${saved.loop.id}:transfer` });
    ui.ch.error = false;
    ctx.rerender();
    requestAnimationFrame(() => document.querySelector("#tmChDone")?.focus());
  });
}

export function onClick(e, ctx) {
  const t = e.target;
  const I = i18nFor(ctx);
  const show = t.closest("[data-tm-show]");
  if (show) {
    for (const m of document.querySelectorAll(".tm-mark.is-shown")) m.classList.remove("is-shown");
    // Two statements can quote overlapping words; then the second one is shown inside the first one's mark.
    const quote = show.closest(".tm-quote")?.querySelector("q")?.textContent || "";
    const side = show.dataset.tmShow.slice(4, 5);
    const mark =
      document.getElementById(show.dataset.tmShow) ||
      [...document.querySelectorAll(`.tm-mark[id^="tmq-${side}"]`)].find((m) => quote && m.textContent.includes(quote));
    mark?.classList.add("is-shown");
    mark?.focus({ preventScroll: false });
    mark?.scrollIntoView({ block: "center", behavior: "auto" });
    return true;
  }
  const playBtn = t.closest("[data-tm-play]");
  if (playBtn) return (play(playBtn.dataset.tmPlay, I), true);
  const shareBtn = t.closest("[data-tm-share]");
  if (shareBtn) return (share(ctx, shareBtn.dataset.tmShare), true);
  const verify = t.closest("[data-tm-verify], [data-tm-unverify]");
  if (verify) {
    const tm = loadTM();
    setVerified(
      tm,
      verify.dataset.tmVerify || verify.dataset.tmUnverify,
      Boolean(verify.dataset.tmVerify),
    );
    saveTM(tm);
    ctx.rerender();
    return true;
  }
  const words = t.closest("[data-tm-words-save]");
  if (words) {
    const tm = loadTM();
    setTranscript(
      tm,
      words.dataset.tmWordsSave,
      document.getElementById(words.dataset.tmField)?.value || "",
    );
    saveTM(tm);
    ctx.rerender();
    return true;
  }
  const rec = t.closest("[data-tm-rec]");
  if (rec) {
    const { tmRec: prompt, tmPair: pair } = rec.dataset;
    ui.recording = recorder.isRecording(`tm:${prompt}`) ? "" : prompt;
    toggleRecording(ctx, I, `tm:${prompt}`, `time-machine:reflection:${prompt}`, (audioId) => {
      ui.recording = "";
      if (!audioId) return;
      const tm = loadTM();
      setAudio(tm, pair, prompt, audioId);
      saveTM(tm);
    });
    return true;
  }
  const unrec = t.closest("[data-tm-unrec]");
  if (unrec) {
    const tm = loadTM();
    const id = reflectionFor(tm, unrec.dataset.tmPair).audio?.[unrec.dataset.tmUnrec];
    setAudio(tm, unrec.dataset.tmPair, unrec.dataset.tmUnrec, "");
    saveTM(tm);
    // A recording made here for this reflection is this feature's own; removing it removes the audio too.
    if (id) audioStore.remove(id).then(() => ctx.rerender());
    else ctx.rerender();
    return true;
  }
  if (t.closest("[data-tm-help]")) {
    ui.ch.text = document.querySelector("[data-tm-challenge]")?.value ?? ui.ch.text;
    ui.ch.help = true; // once opened, the work stays "done with help"
    ctx.rerender();
    return true;
  }
  if (t.closest("[data-tm-chrec]")) {
    ui.ch.text = document.querySelector("[data-tm-challenge]")?.value ?? ui.ch.text;
    ui.ch.recording = !recorder.isRecording("tm:challenge");
    toggleRecording(ctx, I, "tm:challenge", `time-machine:${ui.ch.key}`, async (audioId) => {
      ui.ch.recording = false;
      if (!audioId) return;
      ui.ch.audioId = audioId;
      ui.ch.audioUrl = await urlFor(audioId);
      ctx.rerender();
    });
    return true;
  }
  if (t.closest("[data-tm-chsave]")) return (saveChallengeNow(ctx), true);
  return false;
}

export function onInput(e, ctx) {
  const t = e.target;
  if (t.matches?.("[data-tm-challenge]")) {
    ui.ch.text = t.value;
    return;
  }
  if (t.matches?.("[data-tm-reflect]")) {
    const tm = loadTM();
    setAnswer(tm, t.dataset.tmPair, t.dataset.tmReflect, t.value);
    saveTM(tm);
    const status = document.querySelector("[data-tm-saved]");
    if (status) status.textContent = i18nFor(ctx).S("Saved on this device.", "Guardado en este dispositivo.");
  }
}
