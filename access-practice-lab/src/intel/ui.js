// The feedback loop panel (Language Intelligence Engine): any view embeds it with loopPanelHTML(ctx, loopId, opts)
// and forwards its click and input events to onLoopClick / onLoopInput. The panel shows whatever stage the loop
// store says comes next (loop.js nextStage):
//   feedback card + one guided try → revision → what changed → a new task on your own → share with my teacher → done
//
// Rules this module keeps:
//  * All state lives in the loop store (accessPracticeLab:v1:intel), including drafts, so a reload resumes at the
//    same stage with the same words in the box.
//  * A revision is always saved as supported. A new task is independent only when no help was opened.
//  * An optional AI second look can only re-rank which authored next step is shown (feedbackSource "ai"); when it is
//    unavailable the rule-based feedback stands. It uses the existing select-only endpoint, on the learner's press.
//  * Nothing is shared unless the learner presses Share. The teacher's decision, once it arrives, is written into
//    the loop and wins over the automated suggestion.
import { askSecondLook } from "../class/ai-feedback.js";
import { api, loadLink } from "../class/link.js";
import { i18nFor } from "../i18n.js";
import { analyzeResponse } from "../lang/analyze.js";
import { canDictate, startDictation } from "../stt.js";
import { announce } from "../util.js";
import { buildFeedback, preferFromSecondLook } from "./engine.js";
import {
  getLoop,
  loadIntel,
  loopDigest,
  nextStage,
  recordStage,
  saveIntel,
  startLoop,
} from "./loop.js";
import { buildPractice, checkPractice } from "./practice.js";
import { applyTeacherReviews } from "./review.js";
import { inClass, shareWithClass } from "./share.js";
import {
  changesHTML,
  doneHTML,
  feedbackCardHTML,
  practiceHTML,
  responseHTML,
  reviewHTML,
  revisionHTML,
  shellHTML,
  transferHTML,
} from "./ui-view.js";

/** Transient, per page load: nothing here needs to survive a reload. */
const live = { busy: "", note: null, share: null, dict: null, opts: new Map(), synced: new Set() };
const FIELDS = ["response", "practice", "revision", "transfer"];
const NEED_WORDS = ["Write or say something first.", "Primero escribe o di algo."];

const metricsOf = (text, loop) =>
  analyzeResponse(text, {
    keyUse: loop.task.keyUse,
    modality: loop.task.domain === "Speaking" ? "speaking" : "writing",
  }).ledger;
const panelOf = (loop) => (loop.panel ||= { drafts: {}, help: {}, said: {} });

/** The newest loop in a chain of tries (a "try again" starts a new loop and points the old one at it). */
function resolve(state, loopId) {
  let loop = getLoop(state, loopId);
  for (let i = 0; loop?.panel?.nextLoop && i < 20; i++)
    loop = getLoop(state, loop.panel.nextLoop) || loop;
  return loop;
}

function feedbackInput(loop) {
  const r = loop.stages.response;
  return {
    text: r.text,
    keyUse: loop.task.keyUse,
    domain: loop.task.domain,
    source: r.source === "transcript" ? "transcript" : "typed",
    task: { id: loop.task.id, prompt: loop.task.prompt, ...(loop.panel?.src || {}) },
    supports: r.supports,
    band: loop.band,
  };
}

function recordResponse(state, loop, { text, source, supports, audioId }) {
  recordStage(
    state,
    loop.id,
    "response",
    {
      text,
      source: source === "transcript" ? "transcript" : "typed",
      uncertain: source === "transcript",
      supports: supports || {},
      audioId: audioId || "",
    },
    { metrics: metricsOf(text, loop) },
  );
  recordStage(state, loop.id, "feedback", {
    feedback: buildFeedback(feedbackInput(loop)),
    feedbackSource: "local-rule",
  });
}

/**
 * The one-call entry other views use: start a loop for a response, save it, build and save its feedback.
 * @param {object} ctx the render ctx (its band is used)
 * @param {{src:string, task:{id:string,title?:string,prompt?:string,keyUse?:string,domain?:string,sourceText?:string,sourceTerms?:string[]},
 *          text:string, source?:"typed"|"transcript", supports?:object, objective?:string, audioId?:string}} init
 * @returns {string} the loop id ("" when there are no words to coach)
 */
export function startTextLoop(
  ctx,
  { src, task = {}, text, source = "typed", supports = {}, objective = "", audioId = "" },
) {
  const words = String(text || "").trim();
  if (!words) return "";
  const state = loadIntel();
  const loop = startLoop(state, { src, band: ctx?.band, objective, task });
  const p = panelOf(loop);
  if (task.sourceText || task.sourceTerms?.length)
    p.src = {
      sourceText: String(task.sourceText || "").slice(0, 2000),
      sourceTerms: (task.sourceTerms || []).slice(0, 40),
    };
  recordResponse(state, loop, { text: words, source, supports, audioId });
  saveIntel(state);
  return loop.id;
}

/** The loop panel for whatever stage comes next. Returns "" when the loop is unknown. */
export function loopPanelHTML(ctx, loopId, opts = {}) {
  const state = loadIntel();
  const loop = resolve(state, loopId);
  if (!loop) return "";
  const I = i18nFor(ctx);
  const o = {
    compact: Boolean(opts.compact),
    allowSpeech: opts.allowSpeech !== false && canDictate(),
    onDone: opts.onDone,
  };
  live.opts.set(loop.id, o);
  if (loop.stages.response && !loop.stages.feedback) {
    recordStage(state, loop.id, "feedback", {
      feedback: buildFeedback(feedbackInput(loop)),
      feedbackSource: "local-rule",
    });
    saveIntel(state);
  }
  const stage = nextStage(loop);
  const joined = inClass();
  let body;
  if (stage === "response") body = responseHTML(I, loop, live, o);
  else if (stage === "practice") {
    const fb = loop.stages.feedback.feedback;
    const practice = buildPractice(fb, loop.stages.response.text, { keyUse: loop.task.keyUse });
    body = [feedbackCardHTML(I, loop, live), practiceHTML(I, loop, practice, live, o)];
  } else if (stage === "revision")
    body = [feedbackCardHTML(I, loop, live, { full: false }), revisionHTML(I, loop, live, o)];
  else if (stage === "transfer")
    body = loop.panel?.changesSeen ? transferHTML(I, loop, live, o) : changesHTML(I, loop);
  else if (stage === "review") body = reviewHTML(I, loop, live, joined);
  else {
    body = doneHTML(I, loop, live, joined);
    if (loop.stages.review?.shared && joined && !live.synced.has(loop.id)) {
      live.synced.add(loop.id);
      syncTeacher(ctx, loop.id, { quiet: true });
    }
  }
  return shellHTML(I, loop, stage, body, o);
}

async function syncTeacher(ctx, loopId, { quiet = false } = {}) {
  const link = loadLink();
  if (!link) return;
  let res;
  try {
    res = await api.reviewMine(link);
  } catch {
    res = null;
  }
  const state = loadIntel();
  const changed = res?.ok ? applyTeacherReviews(state, res.reviews || []) : 0;
  if (changed) saveIntel(state);
  if (!quiet) {
    const I = i18nFor(ctx);
    announce(
      !res?.ok
        ? I.S(
            "Could not check right now. Try again later.",
            "No se pudo revisar ahora. Inténtalo más tarde.",
          )
        : getLoop(state, loopId)?.stages.review?.teacher
          ? I.S(
              "Your teacher's feedback is here.",
              "Aquí están los comentarios de tu maestro o maestra.",
            )
          : I.S(
              "No feedback from your teacher yet.",
              "Todavía no hay comentarios de tu maestro o maestra.",
            ),
    );
  }
  if (changed || !quiet) ctx.rerender();
}

function focusHeading(loopId) {
  requestAnimationFrame(() =>
    document
      .querySelector(`[data-intel-panel="${loopId}"] h3[tabindex="-1"]`)
      ?.focus?.({ preventScroll: false }),
  );
}

const fieldValue = (loop, field) =>
  String(
    document.querySelector(`[data-intel-field="${field}"][data-intel-loop="${loop.id}"]`)?.value ??
      loop.panel?.drafts?.[field] ??
      "",
  ).trim();

async function stopDictation() {
  const d = live.dict;
  live.dict = null;
  if (d?.session) await d.session.stop().catch(() => "");
}

async function toggleDictation(ctx, loop, field) {
  if (live.dict) {
    const same = live.dict.field === field && live.dict.loopId === loop.id;
    await stopDictation();
    if (same) return ctx.rerender();
  }
  const sel = `[data-intel-field="${field}"][data-intel-loop="${loop.id}"]`;
  const base = String(document.querySelector(sel)?.value || "").trim();
  const write = (said) => {
    const value = `${base} ${said}`.trim();
    const box = document.querySelector(sel);
    if (box) box.value = value;
    const state = loadIntel();
    const l = getLoop(state, loop.id);
    if (!l) return;
    const p = panelOf(l);
    p.drafts[field] = value;
    if (said) p.said[field] = true;
    saveIntel(state);
  };
  live.dict = { field, loopId: loop.id, session: null };
  const session = await startDictation({
    onText: ({ text }) => write(text),
    onError: () => {
      live.dict = null;
      ctx.rerender();
    },
  });
  if (!session) live.dict = null;
  else if (live.dict) live.dict.session = session;
  ctx.rerender();
}

async function secondLook(ctx, loopId) {
  live.busy = `ai:${loopId}`;
  ctx.rerender();
  let look = { ok: false };
  const first = getLoop(loadIntel(), loopId);
  try {
    look = await askSecondLook(first.stages.response.text, first.task.keyUse);
  } catch {}
  const state = loadIntel();
  const loop = getLoop(state, loopId);
  live.busy = "";
  if (!loop) return;
  const prefer = preferFromSecondLook(look);
  if (look?.ok && prefer.length) {
    // The reply may only choose among next steps the rules already support for this text.
    recordStage(state, loopId, "feedback", {
      feedback: buildFeedback(feedbackInput(loop), { prefer }),
      feedbackSource: "ai",
    });
    panelOf(loop).ai = "used";
  } else panelOf(loop).ai = "unavailable";
  saveIntel(state);
  ctx.rerender();
}

async function share(ctx, loopId) {
  live.busy = `share:${loopId}`;
  ctx.rerender();
  const loop = getLoop(loadIntel(), loopId);
  const res = await shareWithClass({
    label: loop.task.title || loop.task.id || "Language coach",
    text: loopDigest(loop),
  });
  live.busy = "";
  live.share = { loopId, ...res };
  if (res.ok) {
    const state = loadIntel();
    recordStage(state, loopId, "review", { shared: true, workId: res.workId, teacher: null });
    saveIntel(state);
    announce(i18nFor(ctx).S("Shared with your teacher.", "Compartido con tu maestro o maestra."));
  }
  ctx.rerender();
  focusHeading(loopId);
}

/** Handle a click inside a loop panel. Returns true when it was one. */
export function onLoopClick(e, ctx) {
  const btn = e.target?.closest?.("[data-intel]");
  if (!btn) return false;
  const name = btn.dataset.intel;
  const state = loadIntel();
  const loop = getLoop(state, btn.dataset.intelLoop);
  if (!loop) return false;
  const p = panelOf(loop);
  const I = i18nFor(ctx);
  const done = (focus = true) => {
    saveIntel(state);
    ctx.rerender();
    if (focus) focusHeading(loop.id);
    return true;
  };
  const need = () => {
    live.note = { loopId: loop.id, text: NEED_WORDS };
    ctx.rerender();
    return true;
  };
  live.note = null;
  if (name !== "dictate" && live.dict) stopDictation();

  if (name === "dictate") {
    toggleDictation(ctx, loop, btn.dataset.intelFor);
    return true;
  }
  if (name === "ai") {
    secondLook(ctx, loop.id);
    return true;
  }
  if (name === "respond") {
    const text = fieldValue(loop, "response");
    if (!text) return need();
    recordResponse(state, loop, {
      text,
      source: p.said.response ? "transcript" : "typed",
      supports: {},
    });
    delete p.drafts.response;
    return done();
  }
  if (name === "practice-check") {
    const fb = loop.stages.feedback?.feedback;
    if (!fb) return true;
    const practice = buildPractice(fb, loop.stages.response.text, { keyUse: loop.task.keyUse });
    const input = fieldValue(loop, "practice");
    p.drafts.practice = input;
    const res = checkPractice(practice, input);
    if (!res.ok) {
      p.practiceNote = res.note;
      return done(false);
    }
    p.practiceNote = null;
    recordStage(state, loop.id, "practice", { kind: practice.kind, done: true });
    announce(I.S(...res.note));
    return done();
  }
  if (name === "practice-skip") {
    p.practiceNote = null;
    recordStage(state, loop.id, "practice", { kind: "skipped", done: false });
    return done();
  }
  if (name === "revise-save") {
    const text = fieldValue(loop, "revision");
    if (!text) return need();
    recordStage(
      state,
      loop.id,
      "revision",
      {
        text,
        supports: { coach: true, practice: Boolean(loop.stages.practice?.done) },
        source: p.said.revision ? "transcript" : "typed",
      },
      { metrics: metricsOf(text, loop) },
    );
    delete p.drafts.revision;
    return done();
  }
  if (name === "changes-next") {
    p.changesSeen = true;
    return done();
  }
  if (name === "help") {
    p.help.frame = true;
    return done(false);
  }
  if (name === "transfer-save") {
    const text = fieldValue(loop, "transfer");
    if (!text) return need();
    const prompt = loop.stages.feedback.feedback.transfer.prompt;
    recordStage(
      state,
      loop.id,
      "transfer",
      {
        prompt: prompt[0],
        promptEs: prompt[1],
        text,
        supports: { ...p.help },
        source: p.said.transfer ? "transcript" : "typed",
      },
      { metrics: metricsOf(text, loop) },
    );
    delete p.drafts.transfer;
    return done();
  }
  if (name === "share") {
    share(ctx, loop.id);
    return true;
  }
  if (name === "finish") {
    recordStage(state, loop.id, "review", { shared: false, workId: "", teacher: null });
    return done();
  }
  if (name === "sync") {
    syncTeacher(ctx, loop.id);
    return true;
  }
  if (name === "again") {
    const next = startLoop(state, {
      src: loop.src,
      band: loop.band,
      objective: loop.objective,
      task: loop.task,
    });
    next.panel = { drafts: {}, help: {}, said: {}, src: loop.panel?.src };
    p.nextLoop = next.id;
    saveIntel(state);
    ctx.rerender();
    focusHeading(next.id);
    return true;
  }
  if (name === "done") {
    live.opts.get(loop.id)?.onDone?.(loop);
    return true;
  }
  return false;
}

/** Keep a draft as it is typed, so a reload does not lose it. Returns true when the input was a panel box. */
export function onLoopInput(e, ctx) {
  const box = e.target?.closest?.("[data-intel-field]");
  if (!box || !FIELDS.includes(box.dataset.intelField)) return false;
  const state = loadIntel();
  const loop = getLoop(state, box.dataset.intelLoop);
  if (!loop) return false;
  panelOf(loop).drafts[box.dataset.intelField] = String(box.value || "").slice(0, 6000);
  saveIntel(state);
  return true;
}
