import { fluencyForGrade, fluencyForSkill, getFluencyMapping } from "../mls/fluency-map.js";
import { fluencyHref, fluencyLaunch, fluencyReturn } from "../mls/fluency-launch.js";
import { announce, ensureStylesheet, html, icon, raw } from "../util.js";

const optionsOf = (ctx, h) => ({
  support: h.supportOf(),
  level: h.param("level") || 2,
  lang: ctx.prefs?.lang || "en",
  seed: h.param("seed") || 1,
});

function select(name, label, options, selected) {
  return html`<label>${label} <select name="${name}">${options.map(([value, text]) => html`<option value="${value}" ${String(selected) === String(value) ? raw("selected") : ""}>${text}</option>`)}</select></label>`;
}

export function skillPractice(ctx, skill, h) {
  const subskills = fluencyForSkill(skill.id);
  const source = subskills.find((s) => s.id === h.param("focus")) || subskills[0];
  const opts = { ...optionsOf(ctx, h), studio: skill.id };
  const settings = { level: opts.level, lang: opts.lang, support: opts.support, seed: opts.seed };
  const href = source ? fluencyHref(source.grade, source.id, opts) : "";
  const guided = source ? fluencyHref(source.grade, source.id, { ...opts, stage: "model" }) : "";
  const race = source?.capabilities?.race ? fluencyHref(source.grade, source.id, { ...opts, stage: "game" }) : "";
  return html`<section class="panel ml-interactive" aria-labelledby="mlInteractiveTitle">
    <h2 id="mlInteractiveTitle">Interactive practice</h2>
    ${source ? html`<p class="fine">${source.title} · Untimed, with hints and a chance to try again.</p>` : ""}
    ${subskills.length > 1 ? html`<form class="ml-inline" data-ml-fluency-options>
      ${select("focus", "Practice focus", subskills.map((x) => [x.id, x.title]), source.id)}
      <button class="btn small" type="submit">Choose focus</button>
    </form>` : ""}
    <div class="ml-fluency-actions">
      <a class="btn" href="${h.mh("tool/auto", { skill: skill.id, ...settings })}">${icon("tools")} Explore a model</a>
      ${source ? html`<a class="btn" href="${guided}">See a guided example</a>
        <a class="btn primary" href="${href}">${icon("writing")} Practice this skill</a>` : ""}
      ${race
        ? html`<a class="btn" href="${race}">${icon("play")} Play a math race</a>`
        : html`<a class="btn" href="${h.mh(`play/${skill.id}/auto`, settings)}">${icon("play")} Play a skill game</a>`}
    </div>
    ${source ? html`<details class="ml-adv"><summary>Adjust or share practice</summary>
      <form class="ml-inline" data-ml-fluency-options>
        ${select("level", "Mathematics", [[1, "Friendlier numbers"], [2, "On grade level"], [3, "Challenge"]], opts.level)}
        ${select("lang", "Language", [["en", "English"], ["es", "Español"], ["bi", "English + Español"]], opts.lang)}
        <button class="btn small" type="submit">Apply</button>
      </form>
      <div class="ml-fluency-actions">
        <button type="button" class="btn small" data-ml-fluency-copy="${href}">Copy practice link</button>
        <button type="button" class="btn small" data-ml-fluency-save="${href}">Save to collections</button>
      </div>
      <p class="fine" data-ml-fluency-status role="status"></p>
    </details>` : ""}
  </section>`;
}

export function extraPractice(ctx, grade, h) {
  const skills = fluencyForGrade(grade, { unmatchedOnly: true });
  if (!skills.length) return "";
  const opts = optionsOf(ctx, h);
  const topics = [...new Set(skills.map((s) => s.topic))];
  return html`<section class="panel"><details class="ml-adv">
    <summary>${grade === 0 ? "Kindergarten practice" : "More skills to practice"}</summary>
    ${topics.map((topic) => html`<h3>${topic}</h3><ul class="ml-skills">
      ${skills.filter((s) => s.topic === topic).map((s) => html`<li class="ml-skill"><a class="ml-skill-link" href="${fluencyHref(grade, s.id, opts)}">${s.title}</a></li>`)}
    </ul>`)}
  </details></section>`;
}

export function prerequisitePractice(ctx, skill, h) {
  const target = fluencyForSkill(skill.id)[0];
  const next = target?.prerequisites?.[0];
  if (!next) return "";
  return html`<p>Check the mathematics with a short practice on <a href="${fluencyHref(next.grade, next.id, { ...optionsOf(ctx, h), support: "more" })}">${next.title}</a>. Ask the learner to show what they know with a model, words, or an example.</p>`;
}

export function optionalFamilyPractice(skill, es) {
  const source = fluencyForSkill(skill.id)[0];
  if (!source) return "";
  return html`<p><a class="btn" href="${fluencyHref(source.grade, source.id, { studio: skill.id, from: "family", level: 1, lang: es ? "es" : "en" })}">
    ${es ? "Practiquen con tres preguntas más" : "Try three more questions together"}
  </a></p>`;
}

export async function render(ctx, I, grade, sourceId, h) {
  const config = fluencyLaunch(grade, sourceId, { ...Object.fromEntries(new URLSearchParams(location.search)), lang: ctx.prefs?.lang });
  if (!config) return h.wrap("Activity not found", html`<section class="panel"><h1 tabindex="-1">That practice activity is unavailable</h1>${h.backLink("Choose a skill", h.mh("teach"))}</section>`);
  await ensureStylesheet("mls-play.css");
  const back = fluencyReturn(config);
  const returnLabel = config.from === "family" ? I.T("Back to the family page", "Volver a la página familiar") : config.studio ? I.T("Back to the skill", "Volver a la habilidad") : I.T("Back to the grade", "Volver al grado");
  const heading = config.grade === 0 ? "Kindergarten" : I.S(`Grade ${config.grade}`, `Grado ${config.grade}`);
  const theme = config.grade <= 2 ? "ml-g12" : config.grade <= 5 ? "ml-g35" : "ml-g68";
  return { ...h.wrap(config.title, html`
    <p class="ml-back"><a class="btn small" href="${back}">${icon("arrow-left")} ${returnLabel}</a></p>
    <header class="panel"><p class="eyebrow">${heading}</p><h1 tabindex="-1">${config.title}</h1></header>
    <section class="panel ml-stage" data-ml-fluency aria-label="${config.title}"><p role="status">${I.T("Loading practice…", "Cargando la práctica…")}</p></section>`, `ml-play ${theme}`), chrome: "activity" };
}

let cleanUp;
export function unmount() {
  cleanUp?.();
  cleanUp = null;
}

export function mount(root, ctx) {
  unmount();
  const stage = root.querySelector("[data-ml-fluency]");
  if (!stage) return;
  const { sub, sub2 } = ctx.route;
  const config = fluencyLaunch(sub, sub2, { ...Object.fromEntries(new URLSearchParams(location.search)), lang: ctx.prefs?.lang });
  if (!config) return;
  const controller = new AbortController();
  cleanUp = () => controller.abort();
  void import("../mls/fluency-player.js").then(async ({ mountFluency }) => {
    if (controller.signal.aborted || !stage.isConnected) return;
    const practiceHref = fluencyHref(config.grade, config.sourceId, { ...config, stage: "practice" });
    const modelHref = fluencyHref(config.grade, config.sourceId, { ...config, stage: "model" });
    const dispose = await mountFluency(stage, { ...config, practiceHref, modelHref });
    if (controller.signal.aborted || !stage.isConnected) dispose?.();
    else controller.signal.addEventListener("abort", () => dispose?.(), { once: true });
  }).catch((error) => {
    if (controller.signal.aborted || !stage.isConnected) return;
    console.error("[math-literacy] fluency practice could not load", error);
    stage.textContent = "Practice could not load. Reconnect and try again.";
  });
}

export function optionSubmit(form, ctx) {
  const data = new FormData(form);
  const url = new URL(location.href);
  for (const name of ["focus", "level", "lang"]) {
    if (data.has(name)) url.searchParams.set(name, data.get(name));
  }
  ctx.navigate(url.pathname + url.search);
}

export function linkConfig(href) {
  const url = new URL(href, location.origin);
  const m = url.pathname.match(/\/math-literacy\/fluency\/([0-8])\/([a-z0-9-]+)$/);
  return m && url.origin === location.origin ? fluencyLaunch(m[1], m[2], Object.fromEntries(url.searchParams)) : null;
}

export function recipeLink(recipe) {
  const config = recipe.opts;
  return fluencyHref(config.grade, config.sourceId, { ...config, studio: recipe.skillId });
}

export function copyLink(button) {
  const status = button.closest("details").querySelector("[data-ml-fluency-status]");
  const text = new URL(button.dataset.mlFluencyCopy, location.origin).href;
  void Promise.resolve().then(() => navigator.clipboard.writeText(text)).then(() => {
    status.textContent = "Practice link copied.";
    const link = status.parentElement.querySelector("input[data-ml-share-url]");
    link?.remove();
  }).catch(() => {
    status.textContent = "Select and copy this practice link.";
    let input = status.parentElement.querySelector("input[data-ml-share-url]");
    if (!input) {
      input = document.createElement("input");
      input.readOnly = true;
      input.dataset.mlShareUrl = "";
      input.setAttribute("aria-label", "Practice link");
      status.after(input);
    }
    input.value = text;
    input.select();
  });
}

export function saveLink(button, store) {
  const config = linkConfig(button.dataset.mlFluencySave);
  if (!config?.studio) return;
  const { studio, grade, sourceId, level, support, lang, stage, seed } = config;
  const recipe = store.recipe(studio, "fluency-activity", { grade, sourceId, level, support, lang, stage, seed });
  const exists = store.load().saved.some((item) => store.recipeKey(item.recipe) === store.recipeKey(recipe));
  if (!exists) store.saveResource(recipe, `${getFluencyMapping(grade, sourceId).title} · Interactive practice`);
  announce(exists ? "This practice is already saved" : "Practice saved to collections", { toast: false });
  button.textContent = "Saved to collections";
}
