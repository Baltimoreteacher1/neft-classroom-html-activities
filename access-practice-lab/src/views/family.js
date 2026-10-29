// Families (/family and /family/<page>). A thin router over src/family/*: each page renders itself,
// and every string comes through the language mode (src/i18n.js), so English, Español and bilingual
// all work on every page.
//   /family            home            /family/start     setup (language, grade, who, time)
//   /family/practice   planner+finder  /family/trip      guided six-stop trip
//   /family/progress   what we practiced
//   /family/help       help center     /family/save      Save & Continue Later
// Old /family?skill=…&minutes=…&level=… links (teacher shares) open the planner's finder.
import { i18nFor } from "../i18n.js";
import * as help from "../family/help.js";
import * as hub from "../family/hub.js";
import * as planner from "../family/planner.js";
import * as progress from "../family/progress.js";
import * as save from "../family/save.js";
import * as setup from "../family/setup.js";
import * as trip from "../family/trip.js";

const PAGES = { "": hub, start: setup, practice: planner, trip, progress, help, save };
const LEGACY_FILTERS = ["skill", "minutes", "level"];

let current = hub;
let lastPath = "";

function pageFor(route) {
  const id = route.id || "";
  if (id === "" && LEGACY_FILTERS.some((k) => new URLSearchParams(location.search).has(k))) return planner;
  return PAGES[id] || hub;
}

export async function render(ctx) {
  current = pageFor(ctx.route);
  if (location.pathname !== lastPath) {
    lastPath = location.pathname;
    current.enter?.(ctx);
  }
  return current.render(ctx, i18nFor(ctx));
}

export const mount = (root, ctx) => current.mount?.(root, ctx);
export const unmount = () => current.unmount?.();
export const onClick = (e, ctx) => current.onClick?.(e, ctx, i18nFor(ctx)) ?? false;
export const onChange = (e, ctx) => current.onChange?.(e, ctx, i18nFor(ctx));
export const onInput = (e, ctx) => current.onInput?.(e, ctx, i18nFor(ctx));
