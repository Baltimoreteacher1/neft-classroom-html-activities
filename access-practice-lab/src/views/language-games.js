// Language Games (/language-games, /language-games/<game>, /language-games/<game>/<chapter>, /language-games/<game>/log):
// four flagship story games on one engine (src/flagship/engine.js): Language Escape Room, Evidence Detective,
// Conversation Quest and Newsroom Challenge, each with a grades 3-5 and a grades 6-8 version. Chapters unlock in order;
// each check is a ledger entry (src "flagship"; supported when Spanish help was opened or the model was shown; first vs
// revision). Progress is saved on this device (key accessPracticeLab:v1:flagship) and resumes where the learner
// stopped. No timers, points or rankings: the reward is the next chapter and the learner's own artifact.
import { keepInView } from "../keep-in-view.js";
import { openInBookStudio } from "../book/handoff.js";
import { crumbsHTML } from "../components.js";
import {
  activeSteps,
  advance,
  applyFlags,
  attempt,
  bandOf,
  bandState,
  chapterState,
  chaptersOf,
  gameById,
  isUnlocked,
  ledgerEntry,
  stepState,
} from "../flagship/engine.js";
import {
  artifactHTML,
  bookPages,
  chapterHTML,
  gameHTML,
  hubHTML,
  stepKey,
  ARTIFACT,
} from "../flagship/ui.js";
import { i18nFor } from "../i18n.js";
import { appendEntry, loadLedger, saveLedger } from "../lang/ledger.js";
import { canDictate, startDictation } from "../stt.js";
import { BASE, announce, html, safeJson, storage } from "../util.js";

const KEY = "accessPracticeLab:v1:flagship";
const load = () => safeJson(storage.get(KEY), {}) || {};
const save = (st) => storage.set(KEY, JSON.stringify(st));
let ui = { at: "", drafts: {}, sort: {}, pick: {}, es: {}, dict: null };

function resolve(ctx) {
  const game = gameById(ctx.route.id || "");
  const band = bandOf(ctx.band);
  const st = load();
  if (!game) return { st, band };
  const bs = bandState(st, game.id, band);
  const chapters = chaptersOf(game, band);
  const index = chapters.findIndex((c) => c.id === ctx.route.chapter);
  return { st, band, game, bs, chapter: chapters[index], index };
}

export async function render(ctx) {
  const I = i18nFor(ctx);
  const { st, band, game, bs, chapter, index } = resolve(ctx);
  const here = `${ctx.route.id || ""}/${ctx.route.chapter || ""}/${band}`;
  if (ui.at !== here) {
    ui.dict?.session?.stop();
    ui = { at: here, drafts: {}, sort: {}, pick: {}, es: {}, dict: null };
  }
  const hubCrumb = [
    I.S("Language Games", "Juegos de lenguaje"),
    `${BASE}/language-games?grades=${band}`,
  ];
  const home = [I.S("Lab", "Laboratorio"), `${BASE}/?grades=${band}`];
  if (!game)
    return {
      title: I.S("Language Games", "Juegos de lenguaje"),
      html: html`${crumbsHTML([home, [hubCrumb[0], null]])}${hubHTML(I, st, band)}`,
    };
  const gameTitle = I.S(...game.title);
  const gameCrumb = [gameTitle, `${BASE}/language-games/${game.id}?grades=${band}`];
  if (ctx.route.chapter === "log")
    return {
      title: `${I.S(...ARTIFACT[game.id])} · ${gameTitle}`,
      html: html`${crumbsHTML([home, hubCrumb, gameCrumb, [I.S(...ARTIFACT[game.id]), null]])}${artifactHTML(I, game, band, bs)}`,
    };
  if (!chapter || !isUnlocked(game, band, bs, index))
    return {
      title: gameTitle,
      html: html`${crumbsHTML([home, hubCrumb, [gameTitle, null]])}${
        chapter
          ? html`<p class="feedback is-hint" role="status">
              ${I.T("That chapter is still locked. Finish the one before it first.", "Ese capítulo todavía está cerrado. Primero termina el anterior.")}
            </p>`
          : ""
      }${gameHTML(I, game, band, bs, ui)}`,
    };
  const cs = chapterState(bs, chapter.id);
  if (bs.last !== chapter.id) {
    bs.last = chapter.id;
    save(st);
  }
  return {
    title: `${chapter.title} · ${gameTitle}`,
    html: html`${crumbsHTML([home, hubCrumb, gameCrumb, [chapter.title, null]])}${chapterHTML(I, game, band, chapter, index, cs, ui, { dictate: canDictate() })}`,
  };
}

// ── events ───────────────────────────────────────────────────────────────────
function current(ctx, key) {
  const r = resolve(ctx);
  if (!r.chapter) return null;
  const cs = chapterState(r.bs, r.chapter.id);
  const step = activeSteps(r.chapter, cs.flags).find((s) => stepKey(r.chapter, s) === key);
  return step ? { ...r, cs, step, ss: stepState(cs, step.id) } : null;
}

function focusStep() {
  requestAnimationFrame(() =>
    (
      document.querySelector(".lg-fb") ||
      document.querySelector("#lgStepH") ||
      document.querySelector("#lgDoneH")
    )?.focus?.({ preventScroll: false }),
  );
}

function check(ctx, key) {
  const c = current(ctx, key);
  if (!c) return false;
  const { st, game, band, bs, chapter, cs, step, ss } = c;
  let input;
  if (step.type === "choose")
    input = ui.pick[key] ?? document.querySelector(`[data-lg-pick="${key}"]:checked`)?.value;
  else if (step.type === "sort") input = ui.sort[key] || {};
  else
    input =
      document.querySelector(`[data-lg-text="${key}"]`)?.value ?? ui.drafts[key] ?? ss.text ?? "";
  const res = attempt(step, ss, input);
  if (res.level !== "empty") {
    const ledger = loadLedger();
    appendEntry(ledger, ledgerEntry(game, band, chapter, step, ss, res));
    saveLedger(ledger);
  }
  if (res.ok) applyFlags(bs, cs, res.sets);
  if (step.type === "sort") ui.sort[key] = {};
  save(st);
  ctx.rerender();
  requestAnimationFrame(() => document.querySelector(".lg-fb")?.setAttribute("tabindex", "-1"));
  focusStep();
  return true;
}

function next(ctx, key) {
  const c = current(ctx, key);
  if (!c?.ss.ok) return false;
  const finished = advance(c.bs, c.chapter, c.cs);
  save(c.st);
  if (finished)
    announce(i18nFor(ctx).S(`${c.chapter.title}: complete.`, `${c.chapter.title}: terminado.`));
  ctx.rerender();
  requestAnimationFrame(() => {
    const h = document.querySelector("#lgStepH") || document.querySelector("#lgDoneH");
    h?.focus();
    keepInView(h);
  });
  return true;
}

async function dictate(ctx, key) {
  if (ui.dict) {
    const { key: was, session } = ui.dict;
    ui.dict = null;
    const text = await session.stop();
    if (text) ui.drafts[was] = text;
    return ctx.rerender();
  }
  const session = await startDictation({
    lang: "en-US",
    onText: ({ text }) => {
      const box = document.querySelector(`[data-lg-text="${key}"]`);
      if (box) box.value = text;
      ui.drafts[key] = text;
    },
    onError: () => {
      ui.dict = null;
      ctx.rerender();
    },
  });
  if (session) {
    ui.dict = { key, session };
    ctx.rerender();
  }
}

async function toBook(ctx) {
  const { game, band, bs } = resolve(ctx);
  if (!game) return;
  const I = i18nFor(ctx);
  await openInBookStudio({
    source: { kind: "world", id: game.id, label: I.S(...game.title) },
    title: `${I.S(...ARTIFACT[game.id])}: ${I.S(...game.title)}`,
    templateId: game.book,
    band,
    keepTemplatePages: false,
    pages: bookPages(game, band, bs),
  });
}

export function onClick(e, ctx) {
  const t = e.target;
  const es = t.closest("[data-lg-es]");
  if (es) {
    ui.es[es.dataset.lgEs] = !ui.es[es.dataset.lgEs];
    ctx.rerender();
    return true;
  }
  const chk = t.closest("[data-lg-check]");
  if (chk) return check(ctx, chk.dataset.lgCheck);
  const nx = t.closest("[data-lg-next]");
  if (nx) return next(ctx, nx.dataset.lgNext);
  const help = t.closest("[data-lg-help]");
  if (help) {
    const c = current(ctx, help.dataset.lgHelp);
    if (!c) return false;
    c.ss.help = true;
    save(c.st);
    ctx.rerender();
    requestAnimationFrame(
      () =>
        document.querySelector(".lg-help")?.setAttribute("tabindex", "-1") ||
        document.querySelector(".lg-help")?.focus(),
    );
    return true;
  }
  const dict = t.closest("[data-lg-dict]");
  if (dict) {
    dictate(ctx, dict.dataset.lgDict);
    return true;
  }
  if (t.closest("[data-lg-book]")) {
    toBook(ctx);
    return true;
  }
  if (t.closest("[data-lg-print]")) {
    window.print();
    return true;
  }
  return false;
}

export function onChange(e) {
  const t = e.target;
  if (t.matches?.("[data-lg-pick]")) ui.pick[t.dataset.lgPick] = t.value;
  else if (t.matches?.("[data-lg-sort]")) {
    const k = t.dataset.lgSort;
    ui.sort[k] ||= {};
    ui.sort[k][t.dataset.item] = {
      ...(ui.sort[k][t.dataset.item] || {}),
      [t.dataset.part]: t.value,
    };
    // Keep earlier answers for parts the learner has not changed this time.
    const box = t.closest(".lg-sort-item");
    for (const s of box?.querySelectorAll("select") || [])
      if (s.value) ui.sort[k][t.dataset.item][s.dataset.part] = s.value;
  }
}

export function onInput(e) {
  const t = e.target;
  if (t.matches?.("[data-lg-text]")) ui.drafts[t.dataset.lgText] = t.value.slice(0, 2000);
}

export function onKey(e) {
  if (e.key === "Enter" && (e.ctrlKey || e.metaKey) && e.target.matches?.("[data-lg-text]")) {
    e.preventDefault();
    document.querySelector(`[data-lg-check="${e.target.dataset.lgText}"]`)?.click();
  }
}

export function unmount() {
  ui.dict?.session?.stop();
  ui = { at: "", drafts: {}, sort: {}, pick: {}, es: {}, dict: null };
}
