// Families (/family and /family/<page>). A thin router over src/family/*: each page renders itself,
// and every string comes through the language mode (src/i18n.js), so English, Español and bilingual
// all work on every page.
//   /family            home            /family/start     setup (language, grade, who, time)
//   /family/practice   planner+finder  /family/trip      guided six-stop trip
//   /family?mission=mNN  Family Mission Companion (Learning Journey)
//   /family/story      Family Language Story (a teacher's note, opened from a link)
//   /family/progress   what we practiced
//   /family/help       help center     /family/save      Save & Continue Later
// Old /family?skill=…&minutes=…&level=… links (teacher shares) open the planner's finder.
import { i18nFor } from "../i18n.js";
import { familyHubCardHTML } from "../pathways/family-card.js";
import { html } from "../util.js";
import * as help from "../family/help.js";
import * as hub from "../family/hub.js";
import { companionPageFor, continueSectionHTML } from "../family/journey-companion.js";
import * as planner from "../family/planner.js";
import * as progress from "../family/progress.js";
import * as save from "../family/save.js";
import * as setup from "../family/setup.js";
import { storyCardHTML } from "../family/story/card.js";
import * as story from "../family/story/page.js";
import * as trip from "../family/trip.js";
import * as understand from "../family/understand.js";

const PAGES = { "": hub, start: setup, understand, practice: planner, trip, progress, help, save, story };
const LEGACY_FILTERS = ["skill", "minutes", "level"];

const COMPANION = {};
let current = hub;
let lastPath = "";

function pageFor(route) {
  const id = route.id || "";
  if (id === "" && LEGACY_FILTERS.some((k) => new URLSearchParams(location.search).has(k))) return planner;
  return PAGES[id] || hub;
}

export async function render(ctx) {
  const I = i18nFor(ctx);
  const isHome = (ctx.route.id || "") === "";
  const companion = isHome ? await companionPageFor(ctx, I) : null;
  if (companion) {
    current = COMPANION; // no page-level handlers: the shared shell already handles print and the grade switch
    return companion;
  }
  current = pageFor(ctx.route);
  if (location.pathname !== lastPath) {
    lastPath = location.pathname;
    current.enter?.(ctx);
  }
  const page = await current.render(ctx, I);
  if (current !== hub) return page;
  // Learning Journey: a "Continue Family Practice" card above the family home. Never blocks the page if it cannot render.
  const cont = await continueSectionHTML(ctx, I).catch(() => "");
  // Connected Pathways: the family conversation card for the pathway this child is on (nothing when there is none).
  const talk = familyHubCardHTML(I);
  const note = storyCardHTML(I);
  return { ...page, html: html`${cont}${note}${talk}${page.html}` };
}

export const mount = (root, ctx) => current.mount?.(root, ctx);
export const unmount = () => current.unmount?.();
export const onClick = (e, ctx) => current.onClick?.(e, ctx, i18nFor(ctx)) ?? false;
export const onChange = (e, ctx) => current.onChange?.(e, ctx, i18nFor(ctx));
export const onInput = (e, ctx) => current.onInput?.(e, ctx, i18nFor(ctx));
