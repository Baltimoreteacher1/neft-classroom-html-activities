// ACCESS Learning Journey: the route view. Dispatches by path and hands each page to its owner.
//
//   /journey                 Continue My Journey          (journey/ui/pages.js homeHTML)
//   /journey/map             the journey map              (pages.js mapHTML)
//   /journey/guide           teacher mission guide        (journey/ui/guide.js render; "teacher" in a path is gated by the site)
//   /journey/growth          growth over the journey      (journey/ui/growth.js growthHTML)
//   /journey/<mNN|n>         mission overview             (pages.js overviewHTML)
//   /journey/<mNN|n>/<step>  the step runner              (journey/runner.js)
//
// Contract: access-practice-lab/JOURNEY.md. Everything heavy loads on demand so the main bundle stays small.
import { i18nFor } from "../i18n.js";
import { BASE, html } from "../util.js";

let runner = null; // set while the step runner owns the screen
let guide = null; // set while the teacher guide owns the screen

/** Raw segments after /journey: [] home, ["map"], ["guide"], ["growth"], [mission], [mission, step]. */
export function journeyParams(pathname = location.pathname, search = location.search) {
  const segs = pathname
    .replace(new RegExp(`^${BASE}/?`), "")
    .split("/")
    .filter(Boolean)
    .map(decodeURIComponent);
  const [root, first = "", second = ""] = segs;
  const assigned = new URLSearchParams(search).get("assigned") === "1";
  if (root !== "journey" || !first) return { kind: "home" };
  if (first === "teacher") return { kind: "redirect", to: "guide" };
  if (["map", "guide", "growth"].includes(first)) return { kind: first };
  return { kind: "mission", first, second, assigned };
}

/** Resolve a raw mission/step against the curriculum: step runner, overview, or an unknown mission. */
export function resolveJourney(p, curriculum) {
  if (p.kind !== "mission") return p;
  const mission = curriculum.missionIdFromParam(p.first);
  if (!mission) return { kind: "notfound", raw: p.first };
  if (p.second && curriculum.STEP_IDS.includes(p.second)) return { kind: "step", mission, step: p.second, assigned: p.assigned };
  return { kind: "overview", mission };
}

const asView = (out, title) =>
  out && typeof out === "object" && "html" in out ? out : { title, html: out };

export async function render(ctx) {
  const [{ deps }, curriculum] = await Promise.all([import("../journey/runner-deps.js"), import("../journey/curriculum.js")]);
  const params = resolveJourney(journeyParams(), curriculum);
  runner = null;
  guide = null;
  if (params.kind === "step") {
    runner = await import("../journey/runner.js");
    return runner.renderStep(ctx, deps, params);
  }
  if (params.kind === "redirect") {
    // The old /journey/teacher path: rewrite the address in place and render the guide (a nested navigate would render twice).
    history.replaceState({}, "", `${BASE}/journey/${params.to}${location.search}${location.hash}`);
    params.kind = params.to;
  }
  if (params.kind === "guide") {
    guide = await import("../journey/ui/guide.js");
    return guide.render(ctx);
  }
  // Pages read whatever they are not given (state, ledger, recommendation, reviews) from the device.
  const pages = await import("../journey/ui/pages.js");
  const page = { band: ctx.band, I: i18nFor(ctx) };
  if (params.kind === "map") return asView(await pages.mapHTML(ctx, page), "Journey map");
  if (params.kind === "overview") {
    const title = page.I.S(...curriculum.MISSIONS[params.mission].title);
    return asView(await pages.overviewHTML(ctx, params.mission, page), title);
  }
  if (params.kind === "growth") return asView(await growthPage(ctx, pages, page), "My growth");
  if (params.kind === "notfound") return asView(await pages.mapHTML(ctx, page), "Journey map");
  return asView(await pages.homeHTML(ctx, page), "My Learning Journey");
}

/** /journey/growth: the evidence and Before/After cards across every mission. */
async function growthPage(ctx, pages, { I, band }) {
  const [growth, { state, ledger }] = await Promise.all([import("../journey/ui/growth.js"), pages.loadJourneyData(band)]);
  return html`<div class="jr-page">
    <nav class="crumbs" aria-label="${I.S("Breadcrumb", "Ruta de navegación")}">
      <ol>
        <li><a href="${BASE}/journey?grades=${band}">${I.T("My Journey", "Mi viaje")}</a></li>
        <li aria-current="page">${I.T("My growth", "Mi progreso")}</li>
      </ol>
    </nav>
    <section class="panel">
      <h1 tabindex="-1">${I.T("My growth", "Mi progreso")}</h1>
      ${growth.growthSectionHTML(I, state, ledger, band)}
    </section>
  </div>`;
}

export function mount(root, ctx) {
  runner?.mountStep(root, ctx);
  guide?.mount(root, ctx);
}

export function unmount() {
  runner?.unmountStep();
  guide?.unmount();
}

/** Runs first on every click (see main.js); the runner handles its own controls. */
export function onClick(e) {
  return runner?.handleClick(e) === true;
}
