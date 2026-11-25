// Hash router. Lazy-loads views/<name>.js, moves focus to <h1>, sets the document title, announces the change,
// and never lets a missing or broken view take the shell down.
import { h } from "./dom.js";

export const VIEW_FOR = {
  "": "home",
  find: "find",
  prepare: "prepare",
  lesson: "lesson",
  unit: "unit",
  lens: "lens",
  remix: "remix",
  vocab: "vocab",
  wida: "wida",
  create: "create",
  projects: "projects",
  project: "projects",
  classes: "classes",
  class: "classes",
  library: "library",
  review: "review/queue",
};

export const VIEW_TITLES = {
  home: "Home",
  find: "Find my lesson",
  prepare: "Prepare my class",
  lesson: "Lesson",
  unit: "Unit",
  lens: "Language Lens",
  remix: "Remix",
  vocab: "Vocabulary",
  wida: "WIDA Practice",
  create: "Resource Studio",
  projects: "Projects",
  classes: "Classes",
  library: "Library",
  "review/queue": "Reviewer queue",
};

export const TITLE_SUFFIX = "BCPSS Teacher Studio";

const decode = (s) => {
  try {
    return decodeURIComponent(s);
  } catch {
    return s;
  }
};

/** "#/vocab/g6/wall?x=1" -> { view, key, segs, path, params:{ x, id:"g6", sub:"wall", route:"vocab" } } */
export function parseHash(hash = "") {
  const raw = String(hash || "").replace(/^#/, "");
  const cut = raw.indexOf("?");
  const pathPart = cut >= 0 ? raw.slice(0, cut) : raw;
  const query = cut >= 0 ? raw.slice(cut + 1) : "";
  const segs = pathPart.split("/").filter(Boolean).map(decode);
  const key = segs[0] || "";
  const view = Object.hasOwn(VIEW_FOR, key) ? VIEW_FOR[key] : null;
  const params = { ...Object.fromEntries(new URLSearchParams(query)), route: key };
  if (segs[1] !== undefined) params.id = segs[1];
  if (segs[2] !== undefined) params.sub = segs[2];
  return { view, key, segs, path: `/${segs.join("/")}`, params };
}

/** buildHash("/find", { grade: "6", subject: "" }) -> "#/find?grade=6" (empty values are dropped) */
export function buildHash(path = "/", query = {}) {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(query || {})) if (v !== "" && v != null && v !== false) q.set(k, String(v));
  const qs = q.toString();
  return `#${path.startsWith("/") ? path : `/${path}`}${qs ? `?${qs}` : ""}`;
}

export function notFoundView({ root, hash }) {
  const form = h(
    "form",
    { class: "st-searchbar", role: "search", "aria-label": "Search the studio" },
    h("label", { class: "st-sr-only", for: "st-nf-q" }, "Search lessons, standards or words"),
    h("input", { id: "st-nf-q", type: "search", name: "q", placeholder: "Search lessons, standards or words", autocomplete: "off" }),
    h("button", { class: "st-btn st-btn-primary", type: "submit" }, "Search"),
  );
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const q = new FormData(form).get("q");
    root.ownerDocument.defaultView.location.hash = buildHash("/find", { q });
  });
  root.replaceChildren(
    h(
      "section",
      { class: "st-state" },
      h("h1", {}, "We could not find that page"),
      h("p", {}, `Nothing is at ${hash || "this address"}. It may have moved, or the link may be mistyped.`),
      form,
      h("p", {}, h("a", { class: "st-btn", href: "#/" }, "Go to the home page")),
    ),
  );
}

/**
 * createRouter({ root, win, importView, shell, announce })
 *   importView(name) -> Promise<{ render }>   (default: import("../views/<name>.js"))
 */
export function createRouter({ root, win = window, importView, shell, announce = () => {} }) {
  const doc = win.document;
  const load = importView || ((name) => import(`../views/${name}.js`));
  let token = 0;
  let cleanup = null;
  let titleSet = false;
  let loadingTimer = null;
  let started = false;

  const setTitle = (t) => {
    titleSet = true;
    doc.title = t ? `${t} — ${TITLE_SUFFIX}` : TITLE_SUFFIX;
  };

  function runCleanup() {
    const fn = cleanup;
    cleanup = null;
    try {
      fn?.();
    } catch {
      /* a view's cleanup must never block navigation */
    }
  }

  function showError(route) {
    const retry = h("button", { class: "st-btn st-btn-primary", type: "button" }, "Try again");
    retry.addEventListener("click", () => resolve());
    root.replaceChildren(
      h(
        "section",
        { class: "st-state", role: "alert" },
        h("h1", {}, "This section did not load"),
        h("p", {}, "The page may still be loading, or your connection dropped. Your classes and saved items are safe on this device."),
        h("p", { class: "st-row" }, retry, h("a", { class: "st-btn", href: "#/" }, "Go to the home page")),
      ),
    );
    setTitle("Section did not load");
    finish(route, "This section did not load.");
  }

  function finish(route, message) {
    root.removeAttribute("aria-busy");
    const heading = root.querySelector("h1");
    if (!titleSet) setTitle(heading?.textContent?.trim() || VIEW_TITLES[route.view] || "");
    if (heading) {
      heading.setAttribute("tabindex", "-1");
      heading.focus({ preventScroll: true });
    } else {
      root.setAttribute("tabindex", "-1");
      root.focus({ preventScroll: true });
    }
    win.scrollTo?.(0, 0);
    announce(message || `${heading?.textContent?.trim() || VIEW_TITLES[route.view] || "Page"} opened.`);
  }

  async function resolve() {
    const my = ++token;
    const hash = win.location.hash;
    const route = parseHash(hash);
    runCleanup();
    clearTimeout(loadingTimer);
    titleSet = false;
    if (!route.view) {
      notFoundView({ root, hash });
      setTitle("Page not found");
      finish(route, "Page not found.");
      return;
    }
    setTitle(VIEW_TITLES[route.view]);
    titleSet = false;
    root.setAttribute("aria-busy", "true");
    loadingTimer = setTimeout(() => {
      if (my === token) root.replaceChildren(h("p", { class: "st-loading", role: "status" }, "Loading"));
    }, 160);
    try {
      const mod = await load(route.view);
      if (my !== token) return;
      if (typeof mod?.render !== "function") throw new Error(`View "${route.view}" has no render()`);
      clearTimeout(loadingTimer);
      root.replaceChildren();
      const result = await mod.render({ root, params: route.params, shell });
      if (my !== token) {
        if (typeof result === "function") result();
        return;
      }
      cleanup = typeof result === "function" ? result : null;
      finish(route);
    } catch (err) {
      clearTimeout(loadingTimer);
      if (my !== token) return;
      console.warn("[studio] view failed:", route.view, err);
      showError(route);
    }
  }

  const onChange = () => resolve();
  return {
    start() {
      if (started) return resolve();
      started = true;
      win.addEventListener("hashchange", onChange);
      return resolve();
    },
    stop() {
      win.removeEventListener("hashchange", onChange);
      started = false;
      token += 1;
      runCleanup();
    },
    refresh: resolve,
    setTitle,
  };
}
