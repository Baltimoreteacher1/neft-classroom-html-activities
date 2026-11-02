// Math Discovery Studio: the shell that joins an engine's model to Watch / Build / Try, a simulator and the
// Detective. One mission runs through it: Explore, Build, Solve, Explain, Challenge. The mission only records
// what the learner actually did; nothing here is timed or scored, and nothing touches the lab's mastery record.
import { L, pick } from "./core.js";
import { awardBadge, history, recurringTag, scaffold, startTab } from "./adaptive.js";
import { SIM_FOR, describe, hasBuild, lessonFor, repsOf } from "./engines.js";
import { detectiveFor, mountDetective } from "./detective.js";
import { mountBuild } from "./panel-build.js";
import { mountExplore } from "./panel-explore.js";
import { mountTry } from "./panel-try.js";
import { mountWatch } from "./panel-watch.js";
import { SIMS } from "./sims.js";
import { generateProblem, seededRandom } from "../problem-bank.js";
import { getLang, t } from "../i18n.js";

const esc = (s) =>
  String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
const REP_NAMES = {
  "line:line": L("Number line", "Recta numérica"),
  "line:chips": L("Zero-pair chips", "Fichas de pares cero"),
  "ratio:table": L("Ratio table", "Tabla de razones"),
  "ratio:line": L("Double number line", "Recta numérica doble"),
};
const BADGE = {
  place: L("Place-value builder", "Constructor de valor posicional"),
  fraction: L("Fraction cutter", "Cortador de fracciones"),
  line: L("Number line walker", "Caminante de la recta"),
  balance: L("Balance keeper", "Guardián de la balanza"),
  ratio: L("Ratio scaler", "Escalador de razones"),
  fracmul: L("Grid multiplier", "Multiplicador de cuadrícula"),
  round: L("Line rounder", "Redondeador de recta"),
  digits: L("Place detective", "Detective de lugares"),
  hops: L("Hop counter", "Contador de saltos"),
  power: L("Power builder", "Constructor de potencias"),
  factors: L("Factor finder", "Buscador de factores"),
  graph: L("Slope tracer", "Trazador de pendientes"),
  early: L("Early number explorer", "Explorador de números"),
  expr: L("Expression expert", "Experto en expresiones"),
  decimal: L("Decimal mover", "Movedor de decimales"),
  geo: L("Geometry guide", "Guía de geometría"),
  area: L("Array architect", "Arquitecto de arreglos"),
  steps: L("Step by step thinker", "Pensador paso a paso"),
};
let counter = 0;

export const studioAvailable = (item) => Boolean(lessonFor(item));
export const studioModeled = (item) => lessonFor(item)?.modeled === true;

export function mountStudio(host, { item, skill, context = "idea" }) {
  let lesson = lessonFor(item);
  if (!lesson) return null;
  const id = ++counter;
  const key = `${skill.grade}:${skill.id}`;
  const past = history(key);
  const ctx = {
    id,
    skill,
    key,
    item,
    lesson,
    seed: (Date.now() & 0xffff) + id,
    simple: false,
    narrate: false,
    rep: undefined,
    level: scaffold(past),
    indep: 0,
    tryCount: 0,
    tryNeedsIndependent: false,
    mission: {},
    lang: getLang,
    sim: SIMS[SIM_FOR[skill.id]] || null,
    // The idea lesson starts playing by itself (Pause is always one tap away); a miss never moves under the feedback.
    autoplay: context === "idea",
  };
  const pattern = recurringTag(past);
  const detective = detectiveFor(skill, ctx.seed);
  let tab = context === "miss" ? "watch" : startTab(ctx.level, hasBuild(lesson));
  let cleanup = null;
  let done = false;
  const bound = [];
  const on = (el, type, fn) => {
    el.addEventListener(type, fn);
    bound.push(() => el.removeEventListener(type, fn));
  };

  const steps = () => [
    { id: "explore", label: L("Explore", "Explorar") },
    ...(hasBuild(ctx.lesson) ? [{ id: "build", label: L("Build", "Construir") }] : []),
    { id: "solve", label: L("Solve", "Resolver") },
    ...(ctx.lesson.engine.predicts(ctx.lesson.spec).some((p) => p.explain)
      ? [{ id: "explain", label: L("Explain", "Explicar") }]
      : []),
    { id: "challenge", label: L("Challenge", "Reto") },
  ];

  host.classList.add("sd-studio");
  host.innerHTML = `
    <section class="sd-card" data-ta="Math Discovery Studio" aria-label="${esc(t("Math Discovery Studio"))}">
      <header class="sd-head">
        <div><p class="sd-kicker" data-t="Math Discovery Studio">${esc(t("Math Discovery Studio"))}</p><h3 class="sd-title" data-title></h3></div>
        <ol class="sd-rail" data-rail data-ta="Mission" aria-label="${esc(t("Mission"))}"></ol>
      </header>
      <p class="sd-pattern" data-pattern hidden></p>
      <div class="sd-toolbar" role="group" data-ta="Explain it differently" aria-label="${esc(t("Explain it differently"))}">
        <button type="button" class="sd-chip" data-tool="simple" aria-pressed="false" data-t="Simpler words">${esc(t("Simpler words"))}</button>
        <button type="button" class="sd-chip" data-tool="narrate" aria-pressed="false" data-t="Listen">${esc(t("Listen"))}</button>
        <button type="button" class="sd-chip" data-tool="rep" hidden></button>
        <button type="button" class="sd-chip" data-tool="example" data-t="Another example">${esc(t("Another example"))}</button>
        <button type="button" class="sd-chip" data-tool="lang"></button>
      </div>
      <div class="sd-tabs" role="tablist" data-tabs></div>
      <div class="sd-panel" data-panel role="tabpanel" tabindex="-1"></div>
      <p class="sd-sr" data-live role="status" aria-live="polite"></p>
      <p class="sd-badge" data-badge hidden></p>
    </section>`;
  const q = (s) => host.querySelector(s);

  ctx.say = (m) => {
    q("[data-live]").textContent = m;
  };
  ctx.mark = (step) => {
    if (ctx.mission[step]) return;
    ctx.mission[step] = true;
    rail();
  };
  ctx.refreshRail = rail;
  ctx.showModel = (tryItem) => {
    const l = lessonFor(tryItem);
    if (!l) return;
    ctx.item = tryItem;
    ctx.lesson = l;
    ctx.rep = undefined;
    go("watch");
  };

  function rail() {
    q("[data-rail]").innerHTML = steps()
      .map(
        (s) =>
          `<li class="${ctx.mission[s.id] ? "done" : ""}" ${ctx.mission[s.id] ? 'aria-label="' + esc(pick(s.label, getLang()) + ", " + t("done")) + '"' : ""}><span>${esc(pick(s.label, getLang()))}</span></li>`,
      )
      .join("");
    if (!done && steps().every((s) => ctx.mission[s.id])) {
      done = true;
      const first = awardBadge(ctx.lesson.engine.id);
      const b = q("[data-badge]");
      b.hidden = false;
      b.textContent = `${t("Mission complete.")} ${pick(BADGE[ctx.lesson.engine.id] || BADGE.steps, getLang())}${first ? ` — ${t("new badge")}` : ""}`;
      ctx.say(b.textContent);
    }
  }

  function tabsList() {
    const list = [
      { id: "watch", label: L("Watch", "Mirar") },
      ...(hasBuild(ctx.lesson) ? [{ id: "build", label: L("Build", "Construir") }] : []),
      { id: "try", label: L("Try", "Probar") },
      ...(ctx.sim ? [{ id: "explore", label: L("Explore", "Explorar") }] : []),
      ...(detective ? [{ id: "detective", label: L("Find the mistake", "Halla el error") }] : []),
    ];
    return list;
  }

  function chrome() {
    host.querySelectorAll("[data-t]").forEach((el) => (el.textContent = t(el.dataset.t)));
    host.querySelectorAll("[data-ta]").forEach((el) => el.setAttribute("aria-label", t(el.dataset.ta)));
    q("[data-title]").textContent = `${pick(describe(ctx.lesson), getLang())} · ${skill.title}`;
    q("[data-tabs]").innerHTML = tabsList()
      .map(
        (x) =>
          `<button type="button" role="tab" class="sd-tab" id="sd-t${id}-${x.id}" data-tab="${x.id}" aria-selected="${x.id === tab}" tabindex="${x.id === tab ? 0 : -1}">${esc(pick(x.label, getLang()))}</button>`,
      )
      .join("");
    const reps = repsOf(ctx.lesson);
    const repBtn = q('[data-tool="rep"]');
    repBtn.hidden = reps.length < 2 || tab !== "watch";
    if (reps.length > 1) {
      const current = ctx.rep || reps[0];
      const next = reps[(reps.indexOf(current) + 1) % reps.length];
      repBtn.textContent = `${t("Another way")}: ${pick(REP_NAMES[`${ctx.lesson.engine.id}:${next}`] || L(next, next), getLang())}`;
      repBtn.dataset.next = next;
    }
    q('[data-tool="lang"]').textContent = getLang() === "es" ? "English" : "Español";
    q('[data-tool="lang"]').lang = getLang() === "es" ? "en" : "es";
    const p = q("[data-pattern]");
    const tag = pattern && ctx.lesson.engine.tags?.[pattern];
    p.hidden = !tag;
    if (tag)
      p.textContent = `${t("You have named this slip twice:")} ${pick(tag.label, getLang())}. ${pick(tag.tip, getLang())} ${t("This is a pattern in your last few answers, not a score.")}`;
    rail();
  }

  function go(next) {
    tab = next;
    cleanup?.();
    chrome();
    // A fresh panel element each time, so no listener from the previous tab survives.
    const old = q("[data-panel]");
    const panel = old.cloneNode(false);
    old.replaceWith(panel);
    panel.setAttribute("aria-labelledby", `sd-t${id}-${tab}`);
    cleanup = {
      watch: mountWatch,
      build: mountBuild,
      try: mountTry,
      explore: mountExplore,
      detective: mountDetective,
    }[tab](ctx, panel);
  }

  on(host, "click", (e) => {
    const tb = e.target.closest("[data-tab]");
    if (tb) return go(tb.dataset.tab);
    const tool = e.target.closest("[data-tool]")?.dataset.tool;
    if (!tool) return;
    if (tool === "simple") {
      ctx.simple = !ctx.simple;
      e.target.setAttribute("aria-pressed", String(ctx.simple));
      return go(tab);
    }
    if (tool === "narrate") {
      ctx.narrate = !ctx.narrate;
      e.target.setAttribute("aria-pressed", String(ctx.narrate));
      return;
    }
    if (tool === "rep") {
      ctx.rep = e.target.dataset.next;
      return go("watch");
    }
    if (tool === "example") {
      const rng = seededRandom((Date.now() >>> 0) + id);
      let next = generateProblem(skill, rng);
      for (let n = 0; n < 12 && (next.question === ctx.item.question || !lessonFor(next)); n += 1)
        next = generateProblem(skill, rng);
      ctx.item = next;
      ctx.lesson = lessonFor(next) || ctx.lesson;
      ctx.rep = undefined;
      return go(tab === "explore" || tab === "try" || tab === "detective" ? "watch" : tab);
    }
    if (tool === "lang") document.querySelector("#lang-toggle")?.click();
  });
  on(host.querySelector("[data-tabs]"), "keydown", (e) => {
    if (!["ArrowRight", "ArrowLeft"].includes(e.key)) return;
    const list = tabsList().map((x) => x.id);
    const next =
      list[(list.indexOf(tab) + (e.key === "ArrowRight" ? 1 : list.length - 1)) % list.length];
    go(next);
    q(`[data-tab="${next}"]`).focus();
  });
  const onLang = () => go(tab);
  window.addEventListener("fluency-lang-changed", onLang);

  go(tab);
  return () => {
    cleanup?.();
    window.removeEventListener("fluency-lang-changed", onLang);
    for (const off of bound) off();
  };
}
