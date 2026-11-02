/**
 * Markup helper for the delegated action layer (`homework-actions.runtime.js`).
 *
 * `act("switchHomeworkTab", "check")` writes `data-act="switchHomeworkTab" data-args='["check"]'`
 * where an inline `onclick="switchHomeworkTab('check')"` used to be. Pages carry no inline
 * handler code: one listener per event type, loaded from the shared bundle, reads these
 * attributes. Keeping the page free of inline handlers also lets the shared bundle ship under a
 * strict script policy and cuts ~400 attributes per page.
 */
import { readFileSync } from "node:fs";

/** Argument tokens resolved by the runtime at event time. */
export const EL = "$el";
export const EV = "$ev";
export const VALUE = "$value";

export const HOMEWORK_ACTIONS_JS = readFileSync(
  new URL("./homework-actions.runtime.js", import.meta.url),
  "utf8",
);

const EVENT_NAMES = new Set([
  "click",
  "change",
  "input",
  "keydown",
  "dragstart",
  "dragend",
  "dragover",
  "drop",
]);

const attrText = (text) =>
  String(text).replace(/&/g, "&amp;").replace(/'/g, "&#39;").replace(/</g, "&lt;");

/** A literal string beginning with "$" would read as a token, so it is written "$$...". */
const wire = (arg) =>
  typeof arg === "string" && arg[0] === "$" && !TOKENS.has(arg) ? `$${arg}` : arg;
const TOKENS = new Set([EL, EV, VALUE]);

/**
 * Attributes that run `names` (space-separated, called in order, arguments to the first) when
 * `event` fires on this element. `opts.prevent` is the old `return false`, `opts.stop` the old `event.stopPropagation()`.
 */
export function actOn(event, names, args = [], { prevent = false, stop = false } = {}) {
  if (!EVENT_NAMES.has(event)) throw new Error(`homework action: unsupported event "${event}"`);
  if (!/^[A-Za-z_$][\w$]*(\s+[A-Za-z_$][\w$]*)*$/.test(names))
    throw new Error(`homework action: bad action name "${names}"`);
  const suffix = event === "click" ? "" : `-${event}`;
  const parts = [`data-act${suffix}="${names}"`];
  if (args.length) parts.push(`data-args${suffix}='${attrText(JSON.stringify(args.map(wire)))}'`);
  if (prevent) parts.push(`data-prevent${suffix}`);
  if (stop) parts.push(`data-stop${suffix}`);
  return parts.join(" ");
}

/** Click action, the common case. */
export const act = (names, ...args) => actOn("click", names, args);
