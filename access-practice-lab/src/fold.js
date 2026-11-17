// Progressive disclosure for secondary page sections. A view marks a section `data-fold` (or `data-fold="open"`);
// after each render its first h2/h3 becomes a toggle and everything after the heading block folds away.
// Folds open for a link or #hash that targets something inside them, and for the browser's find-in-page
// (hidden="until-found"). Open state is remembered per page while the tab lives, so a re-render keeps it.
const opened = new Set();
let wired = false;

const keyOf = (section, index) => `${location.pathname}#${section.id || index}`;

function setOpen(section, open) {
  const body = section.querySelector(":scope > .fold-body");
  const toggle = section.querySelector(".fold-toggle");
  if (!body || !toggle) return;
  section.classList.toggle("is-folded", !open);
  toggle.setAttribute("aria-expanded", String(open));
  if (open) body.removeAttribute("hidden");
  else body.setAttribute("hidden", "until-found");
  if (open) opened.add(section.dataset.foldKey);
  else opened.delete(section.dataset.foldKey);
}

/** Open every fold that contains `target`, so a jump never lands on hidden content. */
export function revealFoldsFor(target) {
  for (
    let s = target?.closest?.("[data-fold-key]");
    s;
    s = s.parentElement?.closest("[data-fold-key]")
  )
    setOpen(s, true);
}

function wire() {
  if (wired || typeof document === "undefined" || typeof document.addEventListener !== "function")
    return;
  wired = true;
  document.addEventListener(
    "click",
    (e) => {
      const toggle = e.target.closest?.(".fold-toggle");
      if (toggle) {
        const section = toggle.closest("[data-fold-key]");
        setOpen(section, toggle.getAttribute("aria-expanded") !== "true");
        return;
      }
      const link = e.target.closest?.('a[href*="#"]');
      if (!link) return;
      const url = new URL(link.href, location.href);
      if (url.pathname !== location.pathname || !url.hash) return;
      revealFoldsFor(document.getElementById(decodeURIComponent(url.hash.slice(1))));
    },
    true,
  );
  document.addEventListener("beforematch", (e) => revealFoldsFor(e.target), true);
}

export function applyFolds(root) {
  if (!root?.querySelectorAll) return;
  wire();
  const hashTarget = location.hash
    ? document.getElementById(decodeURIComponent(location.hash.slice(1)))
    : null;
  [...root.querySelectorAll("[data-fold]:not([data-fold-key])")].forEach((section, index) => {
    const heading = section.querySelector("h2, h3");
    const block =
      heading && [...section.children].find((c) => c === heading || c.contains(heading));
    if (!block || !block.nextElementSibling) return;
    const key = keyOf(section, index);
    section.dataset.foldKey = key;
    const body = document.createElement("div");
    body.className = "fold-body";
    body.id = `fold-${key.replace(/[^a-z0-9]+/gi, "-")}`;
    while (block.nextSibling) body.append(block.nextSibling);
    section.append(body);
    const toggle = document.createElement("button");
    toggle.type = "button";
    toggle.className = "fold-toggle";
    toggle.setAttribute("aria-controls", body.id);
    while (heading.firstChild) toggle.append(heading.firstChild);
    heading.append(toggle);
    const open =
      opened.has(key) ||
      section.dataset.fold === "open" ||
      Boolean(hashTarget && section.contains(hashTarget));
    setOpen(section, open);
  });
}
