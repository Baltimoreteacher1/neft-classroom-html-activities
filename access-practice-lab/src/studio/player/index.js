// mountPlayer(root, activity, opts): the student player for interactive activities, quick checks, worksheets
// (digital version) and games. It always normalizes the activity first, judges answers with core/check.js,
// and reports only a tiny anonymous summary (question id + statuses), never anything a student typed.
//
// opts: { strings, lang: "en"|"es"|"bi", onEvent(evt), reportUrl, preview, reset, editMode, onSelect(blockId), fetch }
//   preview: no network and no storage.  reset: ignore any stored preferences.
//   editMode: a click or Enter/Space on a block selects it for editing (onSelect) instead of answering it.
// Returns a controller: { goto(blockId), destroy(), reset(), summary(), setEditMode(on), el }.

import { normalizeActivity } from "../core/schema.js";
import { renderFinish } from "./finish.js";
import { mountFlow } from "./flow.js";
import { mountGame } from "./game.js";
import { icon } from "./icons.js";
import { applyLook } from "./look.js";
import { createSession } from "./session.js";
import { createSpeaker } from "./speech.js";
import { makeTranslator } from "./strings.js";
import { h, rich } from "./util.js";

const PREFS_KEY = "lp-activity-player:prefs";
const LANGS = ["en", "es", "bi"];

function loadPrefs(opts) {
  if (opts.preview || opts.reset) return {};
  try {
    return JSON.parse(globalThis.localStorage.getItem(PREFS_KEY) || "{}") || {};
  } catch {
    return {};
  }
}

function savePrefs(opts, prefs) {
  if (opts.preview) return;
  try {
    globalThis.localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
  } catch {
    /* storage is blocked: preferences just do not persist */
  }
}

const prefersReducedMotion = () => Boolean(globalThis.matchMedia?.("(prefers-reduced-motion: reduce)").matches);

export function mountPlayer(root, input, opts = {}) {
  const activity = normalizeActivity(input);
  const prefs = loadPrefs(opts);
  const emit = (evt) => {
    try {
      opts.onEvent?.({ ...evt, activity: activity.id });
    } catch {
      /* a host's listener must never break the activity */
    }
  };
  const session = createSession(activity, emit);
  const speaker = createSpeaker();
  const wantsLang = LANGS.includes(opts.lang) ? opts.lang : LANGS.includes(prefs.lang) ? prefs.lang : "bi";
  const canSpanish = activity.supports.spanish;

  const el = h("div", { class: "sp-root", "data-kind": activity.kind, "data-template": activity.template, lang: "en" });
  applyLook(el, activity.look);
  const live = h("div", { class: "sp-sr", role: "status", "aria-live": "polite", "aria-atomic": "true" });
  const header = h("header", { class: "sp-header" });
  const notice = h("p", { class: "sp-notice", role: "status", hidden: true });
  const stage = h("div", { class: "sp-stage" });
  el.append(live, header, notice, stage);
  root.replaceChildren(el);

  let translators = {};
  const ctx = {
    activity,
    supports: activity.supports,
    options: activity.options,
    session,
    speaker,
    root: el,
    editMode: opts.editMode === true,
    interacted: false,
    focus(node) {
      if (ctx.interacted) node?.focus?.();
    },
    lang: canSpanish ? wantsLang : "en",
    state: { step: 0, game: {}, mode: "game", finished: false, calm: prefs.calm ?? prefersReducedMotion() },
    t: (key, vars) => translators[ctx.lang === "es" ? "es" : "en"].t(key, vars),
    msg(key, vars) {
      const en = translators.en.t(key, vars);
      const es = translators.es.t(key, vars);
      if (ctx.lang === "en") return document.createTextNode(en);
      const span = h("span", { lang: "es" }, es);
      if (ctx.lang === "es") return span;
      const frag = document.createDocumentFragment();
      frag.append(en, " ", h("span", { class: "sp-es", lang: "es" }, es));
      return frag;
    },
    announce(text) {
      live.textContent = "";
      live.textContent = text;
    },
    notice(text) {
      notice.textContent = text;
      notice.hidden = !text;
    },
    showGloss: () => ctx.lang !== "en",
    markEditable(node, block) {
      if (!ctx.editMode) return node;
      node.tabIndex = 0;
      node.classList.add("sp-editable");
      node.dataset.editLabel = ctx.t("edit");
      node.setAttribute("aria-description", `${ctx.t("edit")}: ${block.type}`);
      return node;
    },
  };
  const loadTranslators = () => {
    translators = { en: makeTranslator("en", opts.strings), es: makeTranslator("es", opts.strings) };
  };
  loadTranslators();

  let stageCtl = null;
  let sent = false;

  function paintHeader() {
    const ctxLine = [activity.context.grade && `Grade ${activity.context.grade}`, activity.context.subject].filter(Boolean);
    header.replaceChildren(
      h("p", { class: "sp-eyebrow" }, [ctx.t(`kind${activity.kind[0].toUpperCase()}${activity.kind.slice(1)}`), ...ctxLine].join(" · ")),
      h("h1", { class: "sp-title" }, rich(h("span"), activity.title)),
    );
    if (activity.description) header.append(rich(h("p", { class: "sp-desc" }), activity.description));
    const controls = h("div", { class: "sp-controls" });
    if (canSpanish) {
      const group = h("div", { class: "sp-seg", role: "group", "aria-label": ctx.t("langLabel") });
      for (const [lang, key] of [["en", "langEn"], ["es", "langEs"], ["bi", "langBi"]]) {
        const b = h("button", { type: "button", class: "sp-seg-btn", "aria-pressed": String(ctx.lang === lang) }, translators.en.t(key));
        b.addEventListener("click", () => setLang(lang));
        group.append(b);
      }
      controls.append(group);
    }
    const calm = h("button", { type: "button", class: "sp-btn sp-btn-quiet", "aria-pressed": String(ctx.state.calm) }, icon("moon", 18), ctx.msg("calm"));
    calm.addEventListener("click", () => {
      ctx.state.calm = !ctx.state.calm;
      applyCalm();
      savePrefs(opts, { calm: ctx.state.calm, lang: ctx.lang });
      calm.setAttribute("aria-pressed", String(ctx.state.calm));
      if (ctx.state.calm) ctx.announce(ctx.t("calmOn"));
    });
    controls.append(calm);
    if (activity.kind === "game") {
      const list = ctx.state.mode === "list";
      const mode = h("button", { type: "button", class: "sp-btn sp-btn-quiet sp-mode" }, icon(list ? "play" : "list", 18), ctx.msg(list ? "gameMode" : "listMode"));
      mode.addEventListener("click", () => {
        ctx.state.mode = list ? "game" : "list";
        ctx.state.finished = false;
        paintHeader();
        showStage();
      });
      controls.append(mode);
    }
    header.append(controls);
    if (activity.supports.readAloud) header.append(h("p", { class: "sp-note-small" }, ctx.t("speechNote")));
  }

  function applyCalm() {
    el.classList.toggle("sp-calm", ctx.state.calm);
  }

  function showStage() {
    stageCtl?.destroy?.();
    speaker.stop();
    ctx.notice("");
    if (ctx.state.finished) return showFinish();
    const game = activity.kind === "game" && ctx.state.mode === "game";
    stageCtl = game
      ? mountGame(stage, ctx, { onFinish: finish })
      : mountFlow(stage, ctx, { start: ctx.state.step, onFinish: finish });
    if (activity.kind === "game" && !game) stage.prepend(h("p", { class: "sp-listnote" }, ctx.t("listNote")));
  }

  function showFinish() {
    renderFinish(stage, ctx, {
      reported: Boolean(opts.reportUrl) && !opts.preview,
      onAgain: reset,
      onBack:
        activity.kind === "game" && ctx.state.mode === "list"
          ? () => {
              ctx.state.mode = "game";
              ctx.state.finished = false;
              paintHeader();
              showStage();
            }
          : null,
    });
  }

  function finish() {
    ctx.state.finished = true;
    showFinish();
    emit({ type: "finish", answers: session.summary() });
    report();
  }

  function report() {
    if (opts.preview || !opts.reportUrl || sent) return;
    sent = true;
    const body = JSON.stringify({ id: activity.id, session: session.id, answers: session.summary() });
    try {
      const send = opts.fetch || globalThis.fetch;
      Promise.resolve(
        send?.(opts.reportUrl, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body,
          keepalive: true,
          credentials: "omit",
        }),
      ).catch(() => {});
    } catch {
      /* the summary is best effort: the activity never depends on it */
    }
  }

  function reset() {
    session.reset();
    ctx.state.step = 0;
    ctx.state.game = {};
    ctx.state.finished = false;
    sent = false;
    showStage();
    emit({ type: "reset" });
  }

  function setLang(lang) {
    if (!canSpanish) return;
    ctx.lang = lang;
    savePrefs(opts, { calm: ctx.state.calm, lang });
    paintHeader();
    showStage();
  }

  const select = (e) => {
    if (!ctx.editMode) return;
    const block = e.target.closest?.("[data-block-id]");
    if (!block || !el.contains(block)) return;
    if (e.type === "keydown" && e.key !== "Enter" && e.key !== " ") return;
    e.preventDefault();
    e.stopPropagation();
    opts.onSelect?.(block.dataset.blockId);
  };
  const touched = () => {
    ctx.interacted = true;
  };
  el.addEventListener("pointerdown", touched, true);
  el.addEventListener("keydown", touched, true);
  el.addEventListener("click", touched, true);
  el.addEventListener("click", select, true);
  el.addEventListener("keydown", select, true);

  el.classList.toggle("sp-edit", ctx.editMode);
  applyCalm();
  paintHeader();
  showStage();
  emit({ type: "start" });

  return {
    el,
    goto: (blockId) => stageCtl?.goto?.(blockId) ?? false,
    destroy() {
      stageCtl?.destroy?.();
      speaker.stop();
      el.removeEventListener("click", select, true);
      el.removeEventListener("keydown", select, true);
      root.replaceChildren();
    },
    reset,
    summary: () => session.summary(),
    setEditMode(on) {
      ctx.editMode = Boolean(on);
      el.classList.toggle("sp-edit", ctx.editMode);
      showStage();
    },
  };
}
