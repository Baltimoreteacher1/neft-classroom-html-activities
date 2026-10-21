/** The one tiny DOM helper the hub's views share. Text goes in as text, never HTML. */
export function el(tag, text, className) {
  const node = document.createElement(tag);
  if (text !== undefined) node.textContent = text;
  if (className) node.className = className;
  return node;
}

/** An anchor styled as a button. `href` is set last so a bad value cannot half-build it. */
export function link(text, href, className = "button") {
  const node = el("a", text, className);
  node.setAttribute("href", href);
  return node;
}
