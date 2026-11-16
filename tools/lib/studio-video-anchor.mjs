/**
 * Where inside a static page a studio video card goes (the `after` / `up` of a manifest page entry).
 *
 * `after` is a CSS selector (first match wins), `up` climbs that many parents (0-3), and the card is inserted
 * right after the end of the element it lands on. Resolved with jsdom's source locations so the page's own
 * text is never re-serialised: the generator splices the card into the original bytes.
 *
 * Shared by the validator (a renamed section must fail, not silently move the card) and the generator.
 */
import { JSDOM, VirtualConsole } from "jsdom";

export const MAX_UP = 3;

/** Every card block the generator wrote, with the newline it was spliced after (exact undo). */
export const BLOCK =
  /\n<!-- studio-video:start(?: [a-z0-9-]+)? -->[\s\S]*?<!-- studio-video:end -->/g;
export const stripBlocks = (html) => html.replace(BLOCK, "");

function parse(html) {
  // A page's own CSS/script problems are not ours to print: a fresh VirtualConsole with no sink stays silent.
  return new JSDOM(html, { includeNodeLocations: true, virtualConsole: new VirtualConsole() });
}

/** Throw a readable error unless `selector` is valid CSS. */
export function assertSelector(selector) {
  const dom = parse("<!doctype html><title>x</title>");
  try {
    dom.window.document.querySelector(selector);
  } catch {
    throw new Error(`"${selector}" is not a valid CSS selector`);
  } finally {
    dom.window.close();
  }
}

/** Offset in `html` (already stripped of card blocks) just after the anchored element. Throws if it is missing. */
export function locateAnchor(html, { after, up = 0 }) {
  const dom = parse(html);
  try {
    const { document } = dom.window;
    let el;
    try {
      el = document.querySelector(after);
    } catch {
      throw new Error(`"${after}" is not a valid CSS selector`);
    }
    const inside = (node) => node && node !== document.body && document.body.contains(node);
    if (!inside(el)) throw new Error(`no element inside <body> matches "${after}"`);
    for (let i = 0; i < up; i += 1) {
      el = el.parentElement;
      if (!inside(el))
        throw new Error(`"${after}" has no parent ${i + 1} level(s) up inside <body>`);
    }
    const end = dom.nodeLocation(el)?.endOffset;
    if (!Number.isInteger(end))
      throw new Error(`cannot locate the end of "${after}" in the source`);
    return end;
  } finally {
    dom.window.close();
  }
}
