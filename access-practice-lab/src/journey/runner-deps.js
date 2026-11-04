// Journey runner: the real collaborators, wired once. runner.js receives these as `deps`
// (tests pass fakes instead). Loaded lazily by src/views/journey.js so the main bundle stays small.
import { appendEntry, loadLedger, saveLedger } from "../lang/ledger.js";
import { announce } from "../util.js";
import * as curriculum from "./curriculum.js";
import * as recommend from "./recommend.js";
import * as state from "./state.js";

/** Each engine UI loads only when a step needs it. */
const UI = {
  scene: () => import("./ui/scene.js"),
  listen: () => import("./ui/listen.js"),
  xray: () => import("./ui/xray.js"),
  construct: () => import("./ui/construct.js"),
  converse: () => import("./ui/converse.js"),
  compose: () => import("./ui/compose.js"),
  mirror: () => import("./ui/mirror.js"),
  growth: () => import("./ui/growth.js"),
};

export const deps = {
  state,
  curriculum,
  recommend,
  ledger: { loadLedger, appendEntry, saveLedger },
  loadUI: (name) => UI[name](),
  announce,
};
