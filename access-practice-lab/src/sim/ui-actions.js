// Living Language Simulation Engine: what the player does with a click, a keystroke or a changed choice. Every
// change to the mission goes through runtime.act(); this module only gathers the learner's input, sends the
// action, saves the new state and says what happened (announce). A refused action changes nothing and is explained
// in the open panel. Speech: the lab's own TTS reads audio evidence; the recorder and speech-to-text are started
// only by the learner, and typing always works.
import { i18nFor } from "../i18n.js";
import * as recorder from "../recorder.js";
import { speak, stop as stopSpeech } from "../speech.js";
import { startDictation } from "../stt.js";
import { announce, wordCount } from "../util.js";
import { AI_TIMEOUT_MS, classAllowsAi, matchTopic, resolveQuestion } from "./characters.js";
import { feedbackOn, recordLanguage, shareReport } from "./evidence.js";
import { DEFAULT_MIN_WORDS, act, hotspotsOf, openTopics } from "./runtime.js";
import { LANGUAGE_TASKS, OPEN_ACTION, characterOf, evidenceOf, sceneOf, taskOf } from "./schema.js";
import { recKey } from "./ui-state.js";

const ERRORS = {
  "scene-locked": [
    "That place is not open yet. Finish this act first.",
    "Ese lugar todavía no está abierto. Primero termina este acto.",
  ],
  "cite-evidence": [
    "Mark at least one piece of evidence you stand on.",
    "Marca al menos una evidencia en la que te apoyas.",
  ],
  "unknown-option": ["Choose one of the options first.", "Primero elige una de las opciones."],
  "choose-relation": [
    "Say what the two pieces of evidence say about each other.",
    "Di qué dicen las dos evidencias, una de la otra.",
  ],
  "choose-stronger": ["Say which one is stronger evidence.", "Di cuál es evidencia más fuerte."],
  "reason-needed": [
    "Give a short reason in your own words.",
    "Da una razón corta con tus propias palabras.",
  ],
  "not-changed": [
    "Change at least one thing before you send your revision.",
    "Cambia por lo menos una cosa antes de enviar tu revisión.",
  ],
  "already-done": ["You already sent this.", "Ya enviaste esto."],
  "already-decided": ["This decision is already made.", "Esta decisión ya está tomada."],
  listen: [
    "Play the message first, or open the transcript.",
    "Primero escucha el mensaje o abre la transcripción.",
  ],
  question: ["Type or say a question first.", "Primero escribe o di una pregunta."],
  other: ["That is not possible right now.", "Eso no se puede hacer ahora."],
};
const tooShort = (n, have) => [
  `Say a little more: at least ${n} words. You have ${have}.`,
  `Di un poco más: al menos ${n} palabras. Llevas ${have}.`,
];

const focusSoon = (selector) =>
  requestAnimationFrame(() => document.querySelector(selector)?.focus?.({ preventScroll: false }));
function show(ctx, selector = "#simPanelH") {
  ctx.rerender();
  focusSoon(selector);
  return true;
}
const say = (ctx, pair, tone) =>
  announce(i18nFor(ctx).S(pair[0], pair[1]), tone ? { tone } : undefined);

/** Send one action to the runtime; save and announce on success, leave a note in the panel on refusal. */
function apply(session, ctx, action) {
  const { def, ui } = session;
  const result = act(def, session.state, action);
  if (result.error) {
    ui.note = ERRORS[result.error] || ERRORS.other;
    return result;
  }
  session.state = result.state;
  session.save(result.state);
  ui.note = null;
  for (const ev of result.events) {
    if (ev.type === "evidence") {
      const title = evidenceOf(def, ev.evidence).title;
      say(
        ctx,
        [
          `Added to your evidence notebook: ${title[0]}`,
          `Agregado a tu cuaderno de evidencia: ${title[1]}`,
        ],
        "success",
      );
    } else if (ev.type === "act" && ev.act) {
      const title = def.acts.find((a) => a.id === ev.act).title;
      say(ctx, [`New act: ${title[0]}`, `Nuevo acto: ${title[1]}`], "success");
    } else if (ev.type === "outcome")
      say(ctx, [
        "The city acted on your work. See what happened next.",
        "La ciudad actuó según tu trabajo. Mira lo que pasó después.",
      ]);
    else if (ev.type === "complete")
      say(ctx, ["Mission complete.", "Misión terminada."], "success");
  }
  return result;
}

function openPanel(session, panel) {
  const { ui } = session;
  stopTalking(session);
  ui.panel = panel;
  ui.note = null;
  ui.confirm = "";
  ui.lastQ = null;
  ui.question = "";
  ui.listen = { played: false, transcript: false };
}

function stopTalking(session) {
  if (session.ui.speaking) stopSpeech();
  session.ui.speaking = false;
  const dict = session.ui.dict;
  session.ui.dict = null;
  dict?.session?.stop();
}

/** Stop anything still running (speech, speech-to-text, a recording). Call when the player leaves the screen. */
export function stopPlayer(session) {
  if (!session) return;
  stopTalking(session);
  if (session.ui.recording) recorder.stop();
  session.ui.recording = "";
}

function move(session, ctx, sceneId) {
  const result = apply(session, ctx, { type: "move", scene: sceneId });
  if (result.error) {
    say(ctx, ERRORS[result.error] || ERRORS.other, "warn");
    return true;
  }
  const title = sceneOf(session.def, sceneId).title;
  openPanel(session, null);
  session.ui.view = "scene";
  session.ui.arriving = true;
  say(ctx, [`You are at ${title[0]}.`, `Estás en ${title[1]}.`]);
  show(ctx, "#simSceneH");
  requestAnimationFrame(() => {
    session.ui.arriving = false;
  });
  return true;
}

function hotspot(session, ctx, id) {
  const { def, state } = session;
  const h = hotspotsOf(def, state).find((x) => x.id === id);
  if (!h) return false;
  if (h.opens.scene) return move(session, ctx, h.opens.scene);
  if (h.opens.character) openPanel(session, { kind: "character", id: h.opens.character });
  else if (h.opens.task) openPanel(session, { kind: "task", id: h.opens.task });
  else {
    const e = evidenceOf(def, h.opens.evidence);
    openPanel(session, { kind: "evidence", id: e.id });
    // A message is heard before it is added; anything else goes into the notebook as soon as it is opened.
    if (!state.evidence[e.id] && e.kind !== "audio")
      apply(session, ctx, { type: OPEN_ACTION[e.kind], evidence: e.id });
  }
  return show(ctx);
}

function play(session, ctx, id) {
  const { ui } = session;
  if (ui.speaking) {
    stopTalking(session);
    return show(ctx, `[data-sim-play="${id}"]`);
  }
  ui.listen.played = true;
  ui.speaking = true;
  speak(evidenceOf(session.def, id).body[0], { lang: "en-US" }).then(() => {
    if (!ui.speaking) return;
    ui.speaking = false;
    if (ui.panel?.id === id) ctx.rerender();
  });
  return show(ctx, `[data-sim-play="${id}"]`);
}

/** Whether this device may ask the helper: asked once per player, fail closed (characters.js classAllowsAi). */
function aiAllowed(session) {
  if (!session.ui.aiAllowed)
    session.ui.aiAllowed = import("../class/link.js")
      .then((m) => classAllowsAi(m.loadLink(), (link) => m.api.whoAmI(link)))
      .catch(() => false);
  return session.ui.aiAllowed;
}

/**
 * A typed (or dictated) question. A sure on-device match answers at once. When the device is unsure, the helper is
 * asked automatically while the character "thinks" (never in a preview, never when the class turned the AI coach off);
 * no reply, a refusal or a reply slower than AI_TIMEOUT_MS leaves the on-device answer (nearest topic or fallback).
 * Suggested-question buttons never come here.
 */
async function askTyped(session, ctx, characterId) {
  const { def, ui } = session;
  if (ui.thinking) return true;
  const text = String(ui.question || "")
    .trim()
    .slice(0, 240);
  if (!text) {
    ui.note = ERRORS.question;
    return show(ctx, "#simQ");
  }
  const open = openTopics(def, session.state, characterId).map((t) => t.id);
  const local = matchTopic(characterOf(def, characterId), text, { open });
  ui.question = "";
  let topic = local.topic;
  if (local.weak && !local.locked && open.length >= 2 && !ui.preview && text.length >= 2) {
    ui.thinking = characterId;
    ui.lastQ = { character: characterId, text, matched: false, thinking: true };
    ctx.rerender();
    const assist = await aiAllowed(session);
    topic = (
      await resolveQuestion(def, session.state, characterId, text, {
        assist,
        timeoutMs: AI_TIMEOUT_MS,
      })
    ).topic;
    ui.thinking = "";
  }
  apply(session, ctx, { type: "ask", character: characterId, topic });
  ui.lastQ = { character: characterId, text, matched: Boolean(topic) };
  return show(ctx, "#simAsked");
}

async function dictate(session, ctx, key) {
  const { ui } = session;
  if (ui.dict) {
    const was = ui.dict;
    ui.dict = null;
    await was.session.stop();
    return ctx.rerender();
  }
  const put = (text) => {
    if (key === "q") {
      ui.question = text.slice(0, 240);
      const box = document.querySelector("[data-sim-question]");
      if (box) box.value = ui.question;
    } else {
      ui.drafts[key] = text.slice(0, 2000);
      ui.spoken[key] = true;
      const box = document.querySelector(`[data-sim-text="${key}"]`);
      if (box) box.value = ui.drafts[key];
    }
  };
  const started = await startDictation({
    lang: "en-US",
    onText: ({ text }) => put(text),
    onError: () => {
      ui.dict = null;
      ctx.rerender();
    },
  });
  if (started) {
    ui.dict = { key, session: started };
    ctx.rerender();
  }
}

async function record(session, ctx, taskId) {
  const { def, ui } = session;
  const key = recKey(def, taskId);
  if (recorder.isRecording(key)) {
    await recorder.stop();
    ui.recording = "";
    return ctx.rerender();
  }
  try {
    const started = await recorder.start(key, {
      onStop: () => {
        ui.recording = "";
        ctx.rerender();
      },
    });
    if (started) ui.recording = key;
  } catch {
    say(
      ctx,
      [
        "The microphone is not available. You can type what you would say.",
        "El micrófono no está disponible. Puedes escribir lo que dirías.",
      ],
      "warn",
    );
  }
  ctx.rerender();
}

function compare(session, ctx, taskId, pair) {
  const { ui } = session;
  const pick = ui.cmp[taskId] || {};
  const result = apply(session, ctx, {
    type: "compare",
    task: taskId,
    pair,
    relation: pick.relation,
    stronger: pick.stronger,
    reason: ui.drafts[`reason:${taskId}`] || "",
  });
  if (!result.error) {
    const right = result.events[0].relationRight && result.events[0].strongerRight;
    say(
      ctx,
      right
        ? ["You settled it.", "Lo aclaraste."]
        : [
            "Not settled yet. Look at both again.",
            "Todavía no está aclarado. Mira las dos otra vez.",
          ],
    );
  }
  return show(ctx);
}

function decide(session, ctx, taskId, sure) {
  const { def, ui } = session;
  const draft = ui.cite[taskId] || { option: "", cited: [] };
  const task = taskOf(def, taskId);
  if (!task.options.some((o) => o.id === draft.option)) ui.note = ERRORS["unknown-option"];
  else if (!draft.cited.length) ui.note = ERRORS["cite-evidence"];
  else if (!sure) {
    ui.note = null;
    ui.confirm = taskId;
  } else {
    ui.confirm = "";
    apply(session, ctx, { type: "decide", task: taskId, option: draft.option, cited: draft.cited });
  }
  return show(ctx);
}

async function submit(session, ctx, taskId) {
  const { def, ui } = session;
  if (ui.busy) return;
  const task = taskOf(def, taskId);
  if (ui.dict) await dictate(session, ctx, taskId);
  const text = String(
    ui.drafts[taskId] ?? document.querySelector(`[data-sim-text="${taskId}"]`)?.value ?? "",
  ).trim();
  const source = ui.spoken[taskId] ? "transcript" : "typed";
  // Ask the runtime first (nothing is written), so refused work never reaches the loop store or the ledger.
  const dry = act(def, session.state, { type: "submit", task: taskId, text, source });
  if (dry.error) {
    ui.note =
      dry.error === "too-short"
        ? tooShort(task.minWords || DEFAULT_MIN_WORDS, wordCount(text))
        : ERRORS[dry.error] || ERRORS.other;
    return show(ctx);
  }
  ui.busy = true;
  const supports = dry.state.tasks[taskId].supports;
  const input = { text, source, supports, band: session.band, objective: session.objective };
  let loopId = "";
  let feedback = null;
  try {
    if (ui.preview)
      feedback =
        task.type === "speak" || task.type === "write"
          ? await feedbackOn(def, session.state, task, input)
          : null;
    else ({ loopId, feedback } = await recordLanguage(def, session.state, task, input));
  } catch {
    // The mission goes on even when this device cannot store the loop (storage full or blocked).
  }
  ui.busy = false;
  if (task.type === "speak" || task.type === "write") ui.feedback[taskId] = feedback;
  apply(session, ctx, { type: "submit", task: taskId, text, source, loopId });
  delete ui.drafts[taskId];
  show(ctx);
}

async function share(session, ctx) {
  const { ui } = session;
  if (ui.busy || ui.shared?.ok || ui.preview) return;
  ui.busy = true;
  ui.shared = await shareReport(session.def, session.state);
  ui.busy = false;
  show(ctx);
}

/** Opening the word meanings while a draft is in progress is help for that piece of work. */
function wordsOpened(session, ctx) {
  const { def, ui } = session;
  ui.words = true;
  for (const t of def.tasks)
    if (
      LANGUAGE_TASKS.includes(t.type) &&
      t.type !== "transfer" &&
      String(ui.drafts[t.id] || "").trim() &&
      !session.state.tasks[t.id]?.done
    )
      apply(session, ctx, { type: "help", task: t.id, kind: "words" });
}

/** Click handler for the player. Returns true when the click was the player's. */
export function onPlayerClick(e, ctx, session) {
  const t = e.target;
  if (!session || !t.closest?.("[data-sim-player]")) return false;
  const { ui } = session;
  const hit = (attr) => t.closest(`[${attr}]`);
  const off = (el) => el.getAttribute("aria-disabled") === "true";
  let el;
  if (hit("data-sim-close")) {
    openPanel(session, null);
    return show(ctx, "#simSceneH");
  }
  if ((el = hit("data-sim-view"))) {
    ui.view = el.dataset.simView === "map" ? "map" : "scene";
    return show(ctx, "#simSceneH");
  }
  if (hit("data-sim-journal")) {
    openPanel(session, ui.panel?.kind === "journal" ? null : { kind: "journal" });
    return show(ctx);
  }
  if (hit("data-sim-outcome")) {
    openPanel(session, { kind: "outcome" });
    return show(ctx);
  }
  if (hit("data-sim-finish") || hit("data-sim-continue")) {
    openPanel(session, session.state.complete ? { kind: "complete" } : null);
    return show(ctx);
  }
  if ((el = hit("data-sim-go"))) {
    if (el.dataset.simGo === session.state.scene) {
      ui.view = "scene";
      return show(ctx, "#simSceneH");
    }
    return move(session, ctx, el.dataset.simGo);
  }
  if ((el = hit("data-sim-hot"))) return hotspot(session, ctx, el.dataset.simHot);
  if ((el = hit("data-sim-open-ev"))) {
    openPanel(session, { kind: "evidence", id: el.dataset.simOpenEv });
    return show(ctx);
  }
  if ((el = hit("data-sim-play"))) return play(session, ctx, el.dataset.simPlay);
  if (hit("data-sim-transcript")) {
    ui.listen.transcript = true;
    return show(ctx, "[data-sim-transcript]");
  }
  if ((el = hit("data-sim-collect"))) {
    if (off(el)) {
      ui.note = null;
      say(ctx, ERRORS.listen, "warn");
      return true;
    }
    stopTalking(session);
    apply(session, ctx, {
      type: "listen",
      evidence: el.dataset.simCollect,
      transcript: ui.listen.transcript,
    });
    return show(ctx);
  }
  if ((el = hit("data-sim-ask")) || (el = hit("data-sim-clarify"))) {
    const clarify = el.hasAttribute("data-sim-clarify");
    ui.lastQ = null;
    apply(session, ctx, {
      type: clarify ? "clarify" : "ask",
      character: ui.panel.id,
      topic: clarify ? el.dataset.simClarify : el.dataset.simAsk,
    });
    return show(ctx);
  }
  if ((el = hit("data-sim-send"))) return void askTyped(session, ctx, el.dataset.simSend) || true;
  if (hit("data-sim-qdict")) return void dictate(session, ctx, "q") || true;
  if ((el = hit("data-sim-dict"))) return void dictate(session, ctx, el.dataset.simDict) || true;
  if ((el = hit("data-sim-rec"))) return void record(session, ctx, el.dataset.simRec) || true;
  if ((el = hit("data-sim-help"))) {
    apply(session, ctx, { type: "help", task: ui.panel.id, kind: el.dataset.simHelp });
    return show(ctx, `[data-sim-help="${el.dataset.simHelp}"]`);
  }
  if ((el = hit("data-sim-compare")))
    return compare(session, ctx, el.dataset.simCompare, Number(el.dataset.pair));
  if ((el = hit("data-sim-decide")))
    return decide(session, ctx, el.dataset.simDecide, el.dataset.sure === "1");
  if (hit("data-sim-unsure")) {
    ui.confirm = "";
    return show(ctx);
  }
  if ((el = hit("data-sim-submit"))) return void submit(session, ctx, el.dataset.simSubmit) || true;
  if (hit("data-sim-share")) return void share(session, ctx) || true;
  // The word-meanings fold is a native <details>: note that it was opened, and let the browser open it.
  if (t.closest("summary") && (el = hit("data-sim-words")) && !el.open) wordsOpened(session, ctx);
  return false;
}

/** Typing: drafts are kept as the learner types, with no re-render (the caret never jumps). */
export function onPlayerInput(e, ctx, session) {
  const t = e.target;
  if (!session || !t.matches) return;
  const { ui } = session;
  if (t.matches("[data-sim-text]")) {
    const id = t.dataset.simText;
    ui.drafts[id] = t.value.slice(0, 2000);
    const min = taskOf(session.def, id)?.minWords || DEFAULT_MIN_WORDS;
    const count = document.getElementById("simCount");
    const have = wordCount(t.value);
    if (count)
      count.textContent = i18nFor(ctx).S(
        `Use at least ${min} words. You have ${have}.`,
        `Usa al menos ${min} palabras. Llevas ${have}.`,
      );
  } else if (t.matches("[data-sim-question]")) ui.question = t.value.slice(0, 240);
  else if (t.matches("[data-sim-reason]"))
    ui.drafts[`reason:${t.dataset.simReason}`] = t.value.slice(0, 300);
}

/** Choices (which pair, what the pair says, which option, which evidence is cited). */
export function onPlayerChange(e, ctx, session) {
  const t = e.target;
  if (!session || !t.matches || session.ui.panel?.kind !== "task") return;
  const { ui } = session;
  const id = ui.panel.id;
  if (t.matches('[name="sim-pair"]')) {
    ui.cmp[id] = { pair: Number(t.value) };
    ctx.rerender();
  } else if (t.matches('[name="sim-rel"]')) ui.cmp[id] = { ...ui.cmp[id], relation: t.value };
  else if (t.matches('[name="sim-strong"]')) ui.cmp[id] = { ...ui.cmp[id], stronger: t.value };
  else if (t.matches('[name="sim-opt"]'))
    ui.cite[id] = { cited: [], ...ui.cite[id], option: t.value };
  else if (t.matches("[data-sim-cite]")) {
    const draft = (ui.cite[id] ||= { option: "", cited: [] });
    const ev = t.dataset.simCite;
    draft.cited = t.checked
      ? [...new Set([...draft.cited, ev])]
      : draft.cited.filter((x) => x !== ev);
  }
}
