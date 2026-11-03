// The Living Mathematics Studio home: the grade's hero (headline, one dominant next action and the interactive
// sculpture), three authored portals (Learn, Practice, Play) and the Mastery Landscape. It reads only what the
// lab already saved (tutor records, the recommendation engine's next step) and reuses the app's own delegated
// actions (data-view, data-open-key, data-resume-practice, data-start-checkup), so it adds no second router and
// no new learner data. Called by app.js after the dashboard renders.
import { gradeExperience } from "../grade-experience.js";
import { getLang, t } from "../i18n.js";
import { continueTarget, dueSkills, recommend, skillSignals } from "../recommendation-engine.js";
import { escapeHtml, stateGlyph } from "../skill-card.js";
import { layoutSkillMap } from "../skill-map.js";
import { findSkill, prerequisiteGraph } from "../tutor-engine.js";
import { HEADLINES, LANDING, STATE_WORD } from "./copy.js";
import { PORTAL_ART } from "./portal-art.js";
import { bandFor, mountSculpture } from "./sculpture.js";


// Four honest landscape states, each shown by a word and a shape as well as colour.
export function landscapeState(signal) {
  if (signal.attempted && signal.due) return "revisiting";
  if (signal.state === "proficient" || signal.state === "mastered") return "secure";
  if (signal.attempted || signal.lessonCompleted) return "developing";
  return "new";
}
const STATE_GLYPH = {
  new: "new",
  developing: "developing",
  secure: "mastered",
  revisiting: "learning",
};

// Pure layout: the grade's skills walk one winding trail, in prerequisite order (depth first, then strand), across
// four terrain rows (a descending sawtooth) so labels on one row are always four steps apart. x and y are 0..1.
const ROWS = [0, 1 / 3, 2 / 3, 1];
export function landscapeLayout(grade, tutor, now = Date.now()) {
  const { nodes: placed } = layoutSkillMap(grade);
  const own = placed.filter((node) => node.kind === "grade");
  const lanes = [...new Set(own.map((node) => node.strand))];
  const ordered = [...own].sort(
    (a, b) => a.column - b.column || lanes.indexOf(a.strand) - lanes.indexOf(b.strand) || a.row - b.row,
  );
  const keys = new Set(own.map((node) => node.key));
  const nodes = ordered.map((node, index) => ({
    key: node.key,
    skill: node.skill,
    strand: node.strand,
    state: landscapeState(skillSignals(tutor, node.skill, now)),
    x: ordered.length === 1 ? 0.5 : index / (ordered.length - 1),
    y: ROWS[index % ROWS.length],
  }));
  const edges = nodes.flatMap((node) =>
    (prerequisiteGraph[node.key]?.prerequisiteSkills || [])
      .filter((from) => keys.has(from))
      .map((from) => ({ from, to: node.key })),
  );
  return { nodes, edges, lanes };
}

const heroAction = (ctx, dashboard) => {
  if (ctx.landing)
    return `<button type="button" class="at-cta" data-at-choose>${escapeHtml(t("Choose your grade"))}<span aria-hidden="true">→</span></button>`;
  const source = dashboard?.querySelector(
    ".fl4-hero [data-resume-practice], .fl4-hero [data-open-key]",
  );
  if (!source)
    return `<button type="button" class="at-cta" data-view="practice">${escapeHtml(t("Start practicing"))}<span aria-hidden="true">→</span></button>`;
  const resume = source.hasAttribute("data-resume-practice");
  const attrs = resume
    ? "data-resume-practice"
    : `data-open-key="${escapeHtml(source.dataset.openKey)}" data-open-mode="${escapeHtml(source.dataset.openMode || "learn")}"`;
  // The hero names the skill so it never repeats the next-step card's "Continue learning" button word for word.
  const skill = resume ? null : findSkill(source.dataset.openKey);
  const label = resume
    ? t("Continue where I stopped")
    : ctx.hasRecords && skill
      ? t("Continue with {skill}", { skill: t(skill.title) })
      : t("Start my first lesson");
  return `<button type="button" class="at-cta" ${attrs}>${escapeHtml(label)}<span aria-hidden="true">→</span></button>`;
};

function portalsHtml(ctx) {
  const due = dueSkills(ctx.tutor, ctx.grade).length;
  const portal = (key, view, title, body, status) =>
    `<button type="button" class="at-portal at-portal--${key}" data-view="${view}">
      <span class="at-portal__art" aria-hidden="true">${PORTAL_ART[key]}</span>
      <span class="at-portal__copy"><span class="at-portal__eyebrow">${escapeHtml(title)}</span><span class="at-portal__body">${escapeHtml(body)}</span><span class="at-portal__status">${escapeHtml(status)}<span aria-hidden="true"> →</span></span></span>
    </button>`;
  return `<section class="at-portals" data-hub-panel="today" aria-labelledby="at-portals-title">
    <h2 id="at-portals-title" class="at-section-title">${escapeHtml(t("Three ways in"))}</h2>
    <div class="at-portals__grid">
      ${portal("learn", "models", t("Learn"), t("Change a model and watch the picture, the words and the symbols move together."), t("Open the Model Lab"))}
      ${portal("practice", "practice", t("Practice"), t("Problems that adapt to your answers, with help when you ask for it."), due ? t("{n} skills ready to revisit", { n: due }) : t("Choose how to practice"))}
      ${portal("play", "games", t("Play ##nav"), t("Untimed games and puzzles built on real mathematics."), t("Enter the Game Room"))}
    </div>
  </section>`;
}

function landscapeHtml(ctx, target) {
  const { nodes, edges } = landscapeLayout(ctx.grade, ctx.tutor);
  if (!nodes.length) return "";
  const byKey = new Map(nodes.map((node) => [node.key, node]));
  const W = 1000;
  const H = 400;
  const px = (node) => [W * (0.08 + node.x * 0.84), H * (0.12 + node.y * 0.76)];
  const curve = ([x1, y1], [x2, y2]) => {
    const mid = (x1 + x2) / 2;
    return `M${x1} ${y1}C${mid} ${y1} ${mid} ${y2} ${x2} ${y2}`;
  };
  // The walking trail joins the skills in order; finer arcs mark prerequisite links.
  const trail = nodes
    .slice(1)
    .map((node, i) => `<path class="at-trail is-walk${nodes[i].state === "secure" ? " is-solid" : ""}" d="${curve(px(nodes[i]), px(node))}"/>`)
    .join("");
  const paths =
    trail +
    edges
      .map(({ from, to }) => `<path class="at-trail is-link" d="${curve(px(byKey.get(from)), px(byKey.get(to)))}"/>`)
      .join("");
  // Terrain: secure skills rise as hills of contour rings, developing ones as low rises, new ground stays flat.
  const rings = { new: 0, developing: 2, revisiting: 2, secure: 4 };
  const terrain = nodes
    .map((node) => {
      const [x, y] = px(node);
      return Array.from(
        { length: rings[node.state] },
        (_, i) =>
          `<ellipse class="at-contour" cx="${x}" cy="${y + 6}" rx="${92 - i * 18}" ry="${34 - i * 6.5}"/>`,
      ).join("");
    })
    .join("");
  const focusKey = target?.action?.key;
  const items = nodes
    .map(
      (
        node,
      ) => `<li class="at-land__item" style="--x:${node.x.toFixed(4)};--y:${node.y.toFixed(4)}">
        <button type="button" class="at-land__node is-${node.state}${node.key === focusKey ? " is-focus" : ""}" data-open-key="${escapeHtml(node.key)}" data-open-mode="learn">
          ${stateGlyph(STATE_GLYPH[node.state], 18)}<span class="at-land__name">${escapeHtml(t(node.skill.title))}</span><span class="at-land__state">${escapeHtml(node.key === focusKey ? t("Next step") : t(STATE_WORD[node.state]))}</span>
        </button></li>`,
    )
    .join("");
  const counts = nodes.reduce(
    (acc, node) => ({ ...acc, [node.state]: (acc[node.state] || 0) + 1 }),
    {},
  );
  const why =
    target?.why && target?.skill
      ? `<p class="at-land__why"><strong>${escapeHtml(t("Why this next step?"))}</strong> ${escapeHtml(t(target.skill.title))}: ${escapeHtml(target.why)}</p>`
      : "";
  return `<section class="at-land" data-hub-panel="today" aria-labelledby="at-land-title">
    <div class="at-land__head">
      <div><h2 id="at-land-title" class="at-section-title">${escapeHtml(t("Your mastery landscape"))}</h2>
      <p>${escapeHtml(t("Ground rises as a skill becomes secure. Trails show which skills build on others. Open any skill to learn or practice it."))}</p></div>
      <ul class="at-land__legend">${["new", "developing", "secure", "revisiting"].map((s) => `<li class="is-${s}">${stateGlyph(STATE_GLYPH[s], 16)}<span>${escapeHtml(t(STATE_WORD[s]))}</span><strong>${counts[s] || 0}</strong></li>`).join("")}</ul>
    </div>
    ${why}
    <div class="at-land__map">
      <svg class="at-land__terrain" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" aria-hidden="true" focusable="false">${terrain}${paths}</svg>
      <ol class="at-land__list" aria-label="${escapeHtml(t("Grade {n} skills from first to last", { n: ctx.grade }))}">${items}</ol>
    </div>
  </section>`;
}

let sculpture = { grade: null, cleanup: null };
export function mountAtelierHome(ctx) {
  const root = document.documentElement;
  const band = bandFor(ctx.landing ? 4 : ctx.grade);
  root.dataset.atelierBand = band;
  root.toggleAttribute("data-atelier-landing", Boolean(ctx.landing));
  const dashboard = document.querySelector("#personal-dashboard");
  const title = document.querySelector("#page-title");
  const description = document.querySelector("#intro-description");
  const kicker = document.querySelector("#at-kicker");
  const [headline, sub] = ctx.landing
    ? LANDING
    : HEADLINES[band];
  if (title) {
    title.dataset.i18nEn = headline;
    title.textContent = t(headline);
  }
  if (description) {
    description.dataset.i18nEn = sub;
    description.textContent = t(sub);
  }
  const profile = gradeExperience(ctx.grade);
  if (kicker)
    kicker.textContent = ctx.landing
      ? t("EduWonderLab · Math Fluency Lab")
      : `${ctx.gradeLabel}${profile ? ` · ${getLang() === "es" ? profile.es.name : profile.name}` : ""}`;
  const actions = document.querySelector("#at-hero-actions");
  if (actions)
    actions.innerHTML = `${heroAction(ctx, dashboard)}${ctx.landing ? "" : `<button type="button" class="at-cta-quiet" data-start-checkup>${escapeHtml(t("Find my starting point"))}</button>`}`;
  const stage = document.querySelector("#at-hero-sculpture");
  const sculptureGrade = ctx.landing ? 4 : ctx.grade;
  if (stage && (sculpture.grade !== sculptureGrade || !stage.firstChild)) {
    sculpture.cleanup?.();
    sculpture = {
      grade: sculptureGrade,
      cleanup: mountSculpture(stage, { grade: sculptureGrade }),
    };
  }
  if (!dashboard || ctx.landing) return;
  const target = continueTarget(recommend(ctx.tutor, ctx.grade));
  const anchor =
    dashboard.querySelector(".fl4-steps") ||
    dashboard.querySelector(".fl4-reminder") ||
    dashboard.querySelector(".fl4-hero");
  const wrap = document.createElement("div");
  wrap.className = "at-home";
  wrap.innerHTML = `${portalsHtml(ctx)}${landscapeHtml(ctx, target)}`;
  if (anchor) anchor.after(wrap);
  else dashboard.prepend(wrap);
}

// The landing hero's "Choose your grade" moves focus to the first grade in the chooser.
globalThis.document?.addEventListener("click", (event) => {
  if (!event.target.closest("[data-at-choose]")) return;
  const first = document.querySelector(".grade-chooser .grade-choice");
  first?.scrollIntoView?.({ behavior: "smooth", block: "center" });
  first?.focus({ preventScroll: true });
});
