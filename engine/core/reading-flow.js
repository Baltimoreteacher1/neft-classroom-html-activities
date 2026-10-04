/** Presentation only: keep the original nodes, answers, and navigation callbacks. */
function styles() {
  if (document.getElementById("reading-flow-styles")) return;
  const link = document.createElement("link");
  link.id = "reading-flow-styles";
  link.rel = "stylesheet";
  link.href = "/assets/reading-flow.css?v=20261002";
  document.head.append(link);
  const opened = new Set();
  window.addEventListener("beforeprint", () => {
    document
      .querySelectorAll(
        ".reading-intro-details:not([open]), .reading-bonus:not([open]), .flagship-scene-hud:not([open])",
      )
      .forEach((details) => {
        details.open = true;
        opened.add(details);
      });
  });
  window.addEventListener("afterprint", () => {
    opened.forEach((details) => {
      details.open = false;
    });
    opened.clear();
  });
}

/** A current-step label with the full, keyboard-accessible outline on demand. */
export function mountStepGuide(strip, labels, { collapsed = true } = {}) {
  styles();
  const guide = document.createElement("div");
  guide.className = "reading-guide";
  const current = document.createElement("p");
  current.className = "reading-current";
  current.setAttribute("aria-live", "polite");
  if (!collapsed) {
    // Few steps: keep every step in view so a student can see the whole path.
    strip.before(guide);
    guide.append(current, strip);
    return (index) => {
      current.textContent = `Step ${index + 1} of ${labels.length} · ${labels[index]}`;
    };
  }
  const outline = document.createElement("details");
  outline.className = "reading-outline";
  const summary = document.createElement("summary");
  summary.textContent = "All steps";
  strip.before(guide);
  outline.append(summary, strip);
  guide.append(current, outline);
  return (index, moveFocus = false) => {
    current.textContent = `Step ${index + 1} of ${labels.length} · ${labels[index]}`;
    if (moveFocus && outline.contains(document.activeElement)) {
      outline.open = false;
      summary.focus({ preventScroll: true });
    }
  };
}

/** One card at a time, with a reversible overview; never rebuild or reorder cards. */
export function mountCardReader(
  container,
  { label = "Question", count, initial = 0, onChange } = {},
) {
  styles();
  const cards = [...container.children].slice(0, count);
  if (cards.length < 2) return;
  cards.forEach((card) => card.setAttribute("data-reading-card", ""));
  const savedIndex = Number(initial);
  let index = Number.isInteger(savedIndex)
    ? Math.max(0, Math.min(cards.length - 1, savedIndex))
    : 0;
  let all = false;
  const controls = document.createElement("nav");
  controls.className = "reading-cards";
  controls.setAttribute("aria-label", `${label} navigation`);
  const button = (text) => {
    const node = document.createElement("button");
    node.type = "button";
    node.textContent = text;
    return node;
  };
  const back = button("Previous");
  const next = button(`Next ${label.toLowerCase()} →`);
  const toggle = button("Show all");
  toggle.setAttribute("aria-pressed", "false");
  const status = document.createElement("span");
  status.setAttribute("aria-live", "polite");
  const show = () => {
    cards.forEach((card, i) => card.toggleAttribute("data-reading-hidden", !all && i !== index));
    status.textContent = all
      ? `All ${cards.length} ${label.toLowerCase()}s`
      : `${label} ${index + 1} of ${cards.length}`;
    back.disabled = all || index === 0;
    next.disabled = all || index === cards.length - 1;
    toggle.textContent = all ? "One at a time" : "Show all";
    toggle.setAttribute("aria-pressed", String(all));
  };
  back.onclick = () => {
    index--;
    onChange?.(index);
    show();
  };
  next.onclick = () => {
    index++;
    onChange?.(index);
    show();
  };
  toggle.onclick = () => {
    all = !all;
    show();
  };
  controls.append(back, status, next, toggle);
  container.before(controls);
  container.classList.add("reading-card-stack");
  show();
  return {
    showAll() {
      all = true;
      show();
    },
  };
}

/** Fold secondary introductory material without losing tools, art, or objectives. */
export function simplifyStudioHeader(hero) {
  styles();
  const details = document.createElement("details");
  details.className = "reading-intro-details";
  const summary = document.createElement("summary");
  summary.textContent = "Lesson details & tools";
  details.append(summary);
  for (const node of hero.querySelectorAll(
    ".sg-obj-more, .sg-tagline, .sg-chips, .sg-hero-mark, .sg-math-move, .nt-toolpoint",
  )) {
    details.append(node);
  }
  hero.append(details);
  hero.classList.add("reading-hero");
}
