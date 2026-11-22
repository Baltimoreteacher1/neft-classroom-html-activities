// Teacher Hub views (access-teacher/teacher-navigation.js).
// The hub is one workspace with six views (Start, Teach, Plan & assign, Review, Resources, My workspace). Only one
// view is on screen at a time. Any link to a section (#liveClass, #activities, #familyTrip …) opens the view that
// holds it, unfolds the section and scrolls to it. Sections render after load, so unknown targets are awaited.
const VIEWS = ["start", "teach", "plan", "review", "resources", "workspace"];
// Hashes from the earlier four-group layout keep working.
const LEGACY = {
  "task-teach": "teach",
  "task-plan": "plan",
  "task-review": "review",
  "task-find": "resources",
};

const nav = document.getElementById("thViews");
const tabs = [...document.querySelectorAll("#thViews [role='tab']")];
const panels = Object.fromEntries(VIEWS.map((v) => [v, document.getElementById(`view-${v}`)]));
const header = document.querySelector(".lab-top");
const topBar = () =>
  header && getComputedStyle(header).position === "sticky"
    ? header.getBoundingClientRect().height
    : 0;
// The tab bar sticks just under the sticky page header, whatever height that has at this width.
const syncTop = () =>
  document.documentElement.style.setProperty("--th-top", `${Math.round(topBar())}px`);
syncTop();
if (header && "ResizeObserver" in window) new ResizeObserver(syncTop).observe(header);
window.addEventListener("resize", syncTop);

function viewOf(id) {
  if (!id) return null;
  if (VIEWS.includes(id.replace(/^view-/, "")) && panels[id.replace(/^view-/, "")])
    return id.replace(/^view-/, "");
  if (LEGACY[id]) return LEGACY[id];
  const el = document.getElementById(id);
  const panel = el?.closest(".th-panel");
  return panel ? panel.id.replace(/^view-/, "") : null;
}

function show(view) {
  for (const v of VIEWS) {
    const on = v === view;
    panels[v].hidden = !on;
    const tab = tabs.find((t) => t.dataset.view === v);
    tab.setAttribute("aria-selected", String(on));
    tab.tabIndex = on ? 0 : -1;
  }
}

function unfold(el) {
  const sec = el?.closest?.("section.th-sec[data-fold], #classEvidencePanel[data-fold]");
  const toggle = sec?.querySelector?.(':scope > .fold-head .fold-toggle[aria-expanded="false"]');
  if (toggle) toggle.click();
}

function scrollToView(view, behavior = "auto") {
  const top = nav.getBoundingClientRect().top + window.scrollY - topBar() - 8;
  // Keep the tab bar in sight when the page is long, but never jump past a short panel.
  if (window.scrollY > top) window.scrollTo({ top, behavior });
}

function go(id, { updateHash = true } = {}) {
  const view = viewOf(id) || "start";
  show(view);
  const el = document.getElementById(id);
  const isView = !el || el.classList.contains("th-panel");
  if (updateHash && location.hash.slice(1) !== id) history.pushState(null, "", `#${id}`);
  if (isView) {
    scrollToView(view);
    return true;
  }
  unfold(el);
  el.scrollIntoView({ block: "start" });
  return true;
}

// A target that has not rendered yet (Family trip, resource cards): wait for it, then reveal it.
function reveal(id, opts) {
  if (
    viewOf(id) &&
    (VIEWS.includes(id.replace(/^view-/, "")) || LEGACY[id] || document.getElementById(id))
  ) {
    return go(id, opts);
  }
  show("start");
  const observer = new MutationObserver(() => {
    if (document.getElementById(id)) {
      observer.disconnect();
      go(id, { updateHash: false });
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });
  window.setTimeout(() => observer.disconnect(), 10000);
  return false;
}

tabs.forEach((tab, i) => {
  tab.addEventListener("click", () => go(`view-${tab.dataset.view}`));
  tab.addEventListener("keydown", (e) => {
    const step = { ArrowRight: 1, ArrowLeft: -1 }[e.key];
    const next =
      e.key === "Home"
        ? 0
        : e.key === "End"
          ? tabs.length - 1
          : step
            ? (i + step + tabs.length) % tabs.length
            : -1;
    if (next < 0) return;
    e.preventDefault();
    tabs[next].focus();
    go(`view-${tabs[next].dataset.view}`);
  });
});

document.addEventListener(
  "click",
  (event) => {
    if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.shiftKey) return;
    const link = event.target.closest?.('a[href*="#"]');
    if (!link) return;
    const url = new URL(link.href, location.href);
    if (url.origin !== location.origin || url.pathname !== location.pathname || url.hash.length < 2)
      return;
    const id = decodeURIComponent(url.hash.slice(1));
    if (!viewOf(id) && !LEGACY[id]) return; // not ours (passport check-in fragments, etc.): leave it alone
    event.preventDefault();
    reveal(id);
  },
  true,
);

function fromHash() {
  const id = decodeURIComponent(location.hash.slice(1));
  if (!id) return show("start");
  if (/^[^=]+=/.test(id)) return show("teach"); // passport check-in fragment (#checkin=…) lands in Teach
  reveal(id, { updateHash: false });
}
window.addEventListener("hashchange", fromHash);
window.addEventListener("popstate", fromHash);
fromHash();

// Resource shortcuts point at sections teacher.js renders per grade band (K–1 has no tests, weekly links or forms).
// Once the hub has rendered, hide any shortcut whose section is not on the page.
const libraryCards = [...document.querySelectorAll("#thLibrary [data-lib-target]")];
const hubRoot = document.getElementById("hub");
function syncLibrary() {
  if (!hubRoot || hubRoot.querySelector(".boot")) return;
  for (const card of libraryCards)
    card.closest("li").hidden = !document.getElementById(card.dataset.libTarget);
}
if (libraryCards.length && hubRoot) {
  syncLibrary();
  new MutationObserver(syncLibrary).observe(hubRoot, { childList: true });
}
