// Math Literacy Studio: the student-activity host. /learn/<skill>/<engine>, /play/<skill>/<game|auto> and /tool/<manipulative|auto>?skill=<id>
// mount a self-contained activity (src/mls/engines.js, games.js, manips.js) on a page with the same dials a teacher uses: language support and
// mathematics level, set separately. Nothing here is timed, no answer is shown after a wrong try, and nothing leaves the device.
import { html, icon, ensureStylesheet } from "../util.js";
import { loadSkill } from "../mls/content.js";
import { BANDS, bandOf } from "../mls/lang.js";

let pending = null;
let live = null;
const q = (k) => new URLSearchParams(location.search).get(k) || "";
const BAND_OF_SUPPORT = { more: "1-2", standard: "3-4", extension: "5-6" };
const LEVEL_OF_SUPPORT = { more: 2, standard: 2, extension: 3 };

export async function render(ctx, I, kind, skillId, sub, h) {
  await ensureStylesheet("mls.css");
  let skill = null;
  let title = "";
  let blurb = "";
  let backTo = h.mh("teach");
  let extra = {};
  if (kind === "tool") {
    const Man = await import("../mls/manips.js");
    const sid = skillId === "auto" ? q("skill") : q("skill");
    skill = sid ? await loadSkill(sid) : null;
    const id = skillId === "auto" ? (skill ? Man.manipFor(skill) : "tenframe") : skillId;
    const m = Man.MANIPS[id];
    if (!m) return notFound(I, h, "That manipulative is not in the studio");
    title = m.title;
    blurb = m.purpose;
    extra = { manip: id };
    if (skill) backTo = h.mh(`skill/${skill.id}`);
    pending = { kind, id, skill, mod: m };
    if (!skill) pending.skill = null;
  } else {
    skill = await loadSkill(skillId);
    if (!skill) return notFound(I, h, "That skill is not in the studio");
    backTo = h.mh(`skill/${skill.id}`);
    if (kind === "learn") {
      const Eng = await import("../mls/engines.js");
      const e = Eng.ENGINES[sub];
      if (!e) return notFound(I, h, "That activity is not in the studio");
      title = e.title;
      blurb = e.blurb;
      pending = { kind, id: sub, skill, mod: e };
    } else {
      const G = await import("../mls/games.js");
      const id = sub === "auto" || !G.GAMES[sub] ? G.defaultGameFor(skill) : sub;
      const g = G.GAMES[id];
      title = g.title;
      blurb = g.blurb;
      extra = { game: id, games: Object.entries(G.GAMES).filter(([, x]) => x.eligible?.(skill) !== false).map(([k, x]) => [k, x.title]) };
      pending = { kind, id, skill, mod: g };
    }
  }
  const support = h.supportOf();
  const band = bandOf(q("band") || BAND_OF_SUPPORT[support]);
  const level = Number(q("level")) || LEVEL_OF_SUPPORT[support];
  const seed = Number(q("seed")) || 1;
  pending.opts = { skill: pending.skill, band, level, seed, support, ctx: q("ctx") || pending.skill?.contexts?.[0] || "store", manip: extra.manip };
  const g = skill?.grade || 3;
  const theme = g <= 2 ? "ml-g12" : g <= 5 ? "ml-g35" : "ml-g68";
  return {
    title: `${title} · Math Literacy Studio`,
    html: html`<div class="ml-page ml-play ${theme}">
      ${h.crumbs(I, ...(skill ? [["Teach a skill", h.mh("teach")], [skill.title, h.mh(`skill/${skill.id}`)], [title, null]] : [[title, null]]))}
      <header class="panel"><p class="eyebrow">${skill ? `Grade ${skill.grade} · ${skill.title}` : "Manipulative"}</p><h1 tabindex="-1">${title}</h1><p class="lead">${blurb}</p>
        <form class="ml-dials" data-ml-dials><label>Language support <select name="band">${Object.values(BANDS).map((b) => html`<option value="${b.id}" ${b.id === band ? "selected" : ""}>${b.short}</option>`)}</select></label>
          <label>Mathematics <select name="level">${[[1, "Friendlier numbers"], [2, "On grade level"], [3, "Extension"]].map(([v, l]) => html`<option value="${v}" ${v === level ? "selected" : ""}>${l}</option>`)}</select></label>
          ${extra.games ? html`<label>Game <select name="game">${extra.games.map(([k, t]) => html`<option value="${k}" ${k === extra.game ? "selected" : ""}>${t}</option>`)}</select></label>` : ""}
          <button class="btn small" type="submit">Apply</button> <button class="btn small" type="button" data-ml-restart>${icon("retry")} Start over</button></form></header>
      <section class="panel ml-stage" data-ml-stage aria-label="${title}"><p>Loading...</p></section>
      <p class="fine ml-note">Nothing is timed. Wrong answers get a hint, not the answer. Device speech is the browser's own voice, not a recording of a person. This activity saves nothing about the student.</p>
      <p class="ml-back"><a class="btn small" href="${backTo}">${icon("arrow-left")} ${skill ? "Back to the skill" : "Back"}</a></p></div>`,
  };
}
const notFound = (I, h, msg) => ({ title: "Not found", html: html`<div class="ml-page">${h.crumbs(I, ["Not found", null])}<section class="panel"><h1>${msg}</h1>${h.backLink()}</section></div>` });

function start(root) {
  const stage = root.querySelector("[data-ml-stage]");
  if (!stage || !pending) return;
  live?.destroy?.();
  stage.innerHTML = "";
  try {
    live = pending.mod.mount(stage, pending.opts) || null;
  } catch (e) {
    console.error("[math-literacy] activity failed", e);
    stage.innerHTML = "<p>This activity could not start. Please go back and try again.</p>";
  }
}
export function mount(root, ctx) {
  if (!pending || !root.querySelector("[data-ml-stage]")) return;
  start(root);
  // games say "back" with a cancelable event; the host answers by following the page's own Back link (the skill), so the router handles it
  root.querySelector("[data-ml-stage]")?.addEventListener("ml-game-back", (e) => {
    const back = root.querySelector(".ml-back a");
    if (!back) return;
    e.preventDefault();
    back.click();
  });
  const f = root.querySelector("[data-ml-dials]");
  f?.addEventListener("submit", (e) => {
    e.preventDefault();
    const d = new FormData(f);
    const u = new URL(location.href);
    u.searchParams.set("band", d.get("band"));
    u.searchParams.set("level", d.get("level"));
    if (d.get("game")) {
      u.pathname = u.pathname.replace(/[^/]+$/, d.get("game"));
    }
    history.pushState({}, "", u);
    ctx.rerender();
  });
}
export function onClick(e, ctx) {
  if (e.target.closest("[data-ml-restart]") && pending) {
    pending.opts.seed = (pending.opts.seed || 1) + 1;
    start(document);
    return true;
  }
  return false;
}
export function unmount() {
  live?.destroy?.();
  live = null;
  pending = null;
}
