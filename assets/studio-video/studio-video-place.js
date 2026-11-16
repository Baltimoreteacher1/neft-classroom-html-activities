/**
 * Where a studio video card goes on the Language Page app's own routes, and nothing else: no custom element, no
 * player. The app imports this one statically so the card is in the page in the same frame as the screen it
 * belongs to (no layout shift); the player (studio-video.js) loads afterwards and upgrades the card in place.
 */
import { cardHtml } from "./studio-video-markup.mjs";

/**
 * Mount a card into `container` (used by the Language Page app on its own routes).
 *
 * With `entry.after` (a CSS selector, `entry.up` parents higher) the card goes right after that element, so it
 * sits inside the section it is about. Otherwise, or if the selector no longer matches, it goes under the page's
 * heading block, the first thing a visitor sees: directly under the first <h1> and its lead paragraph, or climbing
 * from the <h1> until the parent has three or more children. With no <h1> it goes first in the container.
 */
function anchorOf(container, { after, up = 0 }) {
  let el = null;
  try {
    el = container.querySelector(after);
  } catch {
    el = null;
  }
  for (let i = 0; el && i < up; i += 1)
    el = el.parentElement && el.parentElement !== container ? el.parentElement : null;
  if (!el) console.warn(`[studio-video] anchor "${after}" not found; using the default place`);
  return el;
}

export function placeStudioVideo(container, entry, options) {
  const html = cardHtml(entry, options);
  const anchor = entry.after ? anchorOf(container, entry) : null;
  if (anchor) {
    anchor.insertAdjacentHTML("afterend", html);
    return anchor.nextElementSibling;
  }
  let block = container.querySelector("h1");
  // Best spot: directly under the title and its lead paragraph, before controls and side cards.
  if (block?.nextElementSibling?.tagName === "P") {
    block.nextElementSibling.insertAdjacentHTML("afterend", html);
    return block.nextElementSibling.nextElementSibling;
  }
  while (
    block &&
    block.parentElement &&
    block.parentElement !== container &&
    block.parentElement.children.length < 3
  )
    block = block.parentElement;
  if (block && block !== container && block.parentElement) {
    block.insertAdjacentHTML("afterend", html);
    return block.nextElementSibling;
  }
  container.insertAdjacentHTML("afterbegin", html);
  return container.firstElementChild;
}
