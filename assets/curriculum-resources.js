/* Task-based discovery for reusable curriculum resources. Pins stay on this device. */
(function () {
  "use strict";
  /** @typedef {{id:string,title:string,description:string,href:string,audience:"all"|"teacher"|"student",category:string,keywords:string,links:{label:string,href:string}[]}} Resource */
  /** @typedef {{categories:{id:string,label:string}[],resources:Resource[]}} ResourceGuide */
  const root = document.getElementById("curriculum-resources");
  if (!root) return;
  const search = /** @type {HTMLInputElement} */ (root.querySelector("#cr-search"));
  const controls = /** @type {HTMLElement} */ (root.querySelector("#cr-controls"));
  const filters = /** @type {HTMLElement} */ (root.querySelector("#cr-filters"));
  const list = /** @type {HTMLElement} */ (root.querySelector("#cr-results"));
  const status = /** @type {HTMLElement} */ (root.querySelector("#cr-status"));
  const notice = /** @type {HTMLElement} */ (root.querySelector("#cr-notice"));
  const more = /** @type {HTMLButtonElement} */ (root.querySelector("#cr-more"));
  const retry = /** @type {HTMLButtonElement} */ (root.querySelector("#cr-retry"));
  const reset = /** @type {HTMLButtonElement} */ (root.querySelector("#cr-reset"));
  const pinnedFilter = /** @type {HTMLButtonElement} */ (root.querySelector("#cr-pinned"));
  const directory = /** @type {HTMLAnchorElement} */ (root.querySelector("#cr-directory"));
  const fallback = /** @type {HTMLElement} */ (root.querySelector("#cr-fallback"));
  const KEY = "ewl:curriculum:resource-pins:v1";
  const PAGE_SIZE = 6;
  /** @type {Resource[]} */
  let resources = [];
  /** @type {{id:string,label:string}[]} */
  let categories = [];
  let pins = new Set();
  let category = "all";
  let onlyPinned = false;
  let limit = PAGE_SIZE;
  let loading = false;
  let loaded = false;
  let teacher = document.body.classList.contains("teacher-mode");

  // A cold fragment link must wait for the lesson list above this section.
  // Stop adjusting as soon as the user interacts; never pull them back later.
  let bookmarkPending = location.hash === "#curriculum-resources";
  let guideReady = false;
  let bookmarkObserver;
  const lessonDesk = document.getElementById("curriculum-navigator");
  const cancelEvents = ["pointerdown", "keydown", "wheel", "touchstart"];
  function cancelBookmark() {
    bookmarkPending = false;
    bookmarkObserver?.disconnect();
    cancelEvents.forEach((event) => window.removeEventListener(event, cancelBookmark));
    window.removeEventListener("load", settleBookmark);
  }
  function settleBookmark() {
    if (!bookmarkPending) return;
    if (location.hash !== "#curriculum-resources") {
      cancelBookmark();
      return;
    }
    if (!guideReady || lessonDesk?.getAttribute("aria-busy") === "true") return;
    requestAnimationFrame(() => {
      if (!bookmarkPending) return;
      cancelBookmark();
      root.scrollIntoView({ block: "start", behavior: "instant" });
    });
  }
  if (bookmarkPending) {
    if (lessonDesk) {
      bookmarkObserver = new MutationObserver(settleBookmark);
      bookmarkObserver.observe(lessonDesk, { attributes: true, attributeFilter: ["aria-busy"] });
    }
    cancelEvents.forEach((event) =>
      window.addEventListener(event, cancelBookmark, { passive: true }),
    );
    window.addEventListener("load", settleBookmark, { once: true });
  }

  /** @template {keyof HTMLElementTagNameMap} T
   * @param {T} tag @param {string} value @param {string} [className] */
  function text(tag, value, className) {
    const el = document.createElement(tag);
    el.textContent = value;
    if (className) el.className = className;
    return el;
  }
  function safePath(value) {
    if (
      typeof value !== "string" ||
      !value.startsWith("/") ||
      /^\/\//.test(value) ||
      /[\\\u0000-\u001f]/.test(value)
    )
      return false;
    const url = new URL(value, location.origin);
    return url.origin === location.origin;
  }
  function readPins() {
    try {
      const saved = JSON.parse(localStorage.getItem(KEY) || "[]");
      const ids = new Set(resources.map((r) => r.id));
      pins = new Set(Array.isArray(saved) ? saved.filter((id) => ids.has(id)) : []);
    } catch {
      pins = new Set();
      notice.textContent =
        "Pinned resources could not be restored. You can still browse and open everything below.";
    }
  }
  function available() {
    return resources.filter(
      (r) => r.audience === "all" || r.audience === (teacher ? "teacher" : "student"),
    );
  }
  function pinLabel(button, item) {
    const on = pins.has(item.id);
    button.textContent = on ? "Pinned" : "Pin";
    button.setAttribute("aria-label", `${on ? "Unpin" : "Pin"} ${item.title}`);
    button.setAttribute("aria-pressed", String(on));
  }
  function pinCount() {
    const count = available().filter((r) => pins.has(r.id)).length;
    pinnedFilter.textContent = `Pinned (${count})`;
    pinnedFilter.setAttribute("aria-pressed", String(onlyPinned));
  }
  function togglePin(item, button) {
    const next = new Set(pins);
    if (next.has(item.id)) next.delete(item.id);
    else next.add(item.id);
    try {
      localStorage.setItem(KEY, JSON.stringify([...next]));
      pins = next;
      notice.textContent = `${item.title} ${pins.has(item.id) ? "pinned on this device" : "unpinned"}.`;
    } catch {
      notice.textContent =
        "This browser could not save your pins. Bookmark the resource link instead, or allow site storage.";
      return;
    }
    pinLabel(button, item);
    pinCount();
    if (onlyPinned) {
      render();
      pinnedFilter.focus();
    }
  }
  function card(item) {
    const li = document.createElement("li");
    li.dataset.resource = item.id;
    const heading = document.createElement("h3");
    const link = text("a", item.title);
    link.href = item.href;
    heading.append(link);
    const label = categories.find((c) => c.id === item.category).label;
    li.append(
      text("p", `${label}${item.audience === "teacher" ? " · Teacher tool" : ""}`, "cr-kind"),
      heading,
      text("p", item.description, "cr-description"),
    );
    const actions = document.createElement("div");
    actions.className = "cr-card-actions";
    for (const extra of item.links || []) {
      const a = text("a", extra.label);
      a.href = extra.href;
      actions.append(a);
    }
    const pin = document.createElement("button");
    pin.type = "button";
    pinLabel(pin, item);
    pin.addEventListener("click", () => togglePin(item, pin));
    actions.append(pin);
    li.append(actions);
    return li;
  }
  function renderFilters() {
    filters.replaceChildren();
    for (const c of [{ id: "all", label: "All needs" }, ...categories]) {
      const count = available().filter((r) => c.id === "all" || c.id === r.category).length;
      if (count === 0 && c.id !== "all") continue;
      const button = text("button", `${c.label} (${count})`);
      button.type = "button";
      button.dataset.category = c.id;
      button.setAttribute("aria-pressed", String(c.id === category));
      button.disabled = count === 0;
      button.addEventListener("click", () => {
        category = c.id;
        limit = PAGE_SIZE;
        render();
      });
      filters.append(button);
    }
  }
  function render() {
    if (!loaded) return;
    const query = search.value.trim().toLowerCase();
    const words = query.split(/\s+/).filter(Boolean);
    const matches = available().filter((r) => {
      const haystack = `${r.title} ${r.description} ${r.keywords}`.toLowerCase();
      return (
        (category === "all" || r.category === category) &&
        (!onlyPinned || pins.has(r.id)) &&
        words.every((word) => haystack.includes(word))
      );
    });
    // Stable authored order within each group. Pins rise on the next search/visit;
    // pressing Pin itself keeps the active control under the user's keyboard.
    matches.sort((a, b) => Number(pins.has(b.id)) - Number(pins.has(a.id)));
    list.replaceChildren(...matches.slice(0, limit).map(card));
    status.textContent = `${matches.length} ${matches.length === 1 ? "resource" : "resources"}${query ? ` matching “${search.value.trim()}”` : ""} · Showing ${Math.min(limit, matches.length)}${onlyPinned ? " pinned" : ""}`;
    if (!matches.length) {
      const empty = text(
        "li",
        onlyPinned
          ? "No pinned resources match. Turn off Pinned or clear the filters to find something to save."
          : "No resources match these filters. Try a shorter search, clear the filters, or search the full site below.",
        "cr-empty",
      );
      list.append(empty);
    }
    for (const button of filters.querySelectorAll("button"))
      button.setAttribute("aria-pressed", String(button.dataset.category === category));
    pinCount();
    more.hidden = matches.length <= limit;
    more.textContent = `Show ${Math.min(PAGE_SIZE, Math.max(0, matches.length - limit))} more resources`;
    const params = new URLSearchParams();
    if (query) params.set("q", search.value.trim());
    if (!teacher) params.set("lane", "student");
    directory.href = `/directory/${params.size ? `?${params}` : ""}`;
    directory.textContent = query
      ? `Search the full site for “${search.value.trim()}”`
      : "Search the full site directory";
  }
  async function load() {
    if (loading) return;
    loading = true;
    retry.hidden = true;
    status.textContent = "Loading the resource guide…";
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    try {
      const response = await fetch("/data/curriculum-resource-guide.json", {
        cache: "no-cache",
        signal: controller.signal,
      });
      if (!response.ok) throw new Error("Resource guide unavailable");
      const data = /** @type {ResourceGuide} */ (await response.json());
      if (
        !Array.isArray(data.categories) ||
        !Array.isArray(data.resources) ||
        !data.resources.length
      )
        throw new Error("Invalid resource guide");
      const categoryIds = new Set(data.categories.map((c) => c.id));
      if (
        data.resources.some(
          (r) =>
            !safePath(r.href) ||
            !categoryIds.has(r.category) ||
            !["all", "teacher", "student"].includes(r.audience) ||
            !r.id ||
            !r.title ||
            !r.description ||
            (r.links || []).some((l) => !safePath(l.href)),
        )
      )
        throw new Error("Invalid resource entry");
      resources = data.resources;
      categories = data.categories;
      loaded = true;
      readPins();
      controls.hidden = false;
      fallback.hidden = true;
      renderFilters();
      render();
    } catch {
      status.textContent =
        "The resource guide could not load. Use the direct links below or try again.";
      retry.hidden = false;
      fallback.hidden = false;
    } finally {
      clearTimeout(timeout);
      loading = false;
      guideReady = true;
      settleBookmark();
    }
  }
  search.addEventListener("input", () => {
    limit = PAGE_SIZE;
    render();
  });
  reset.addEventListener("click", () => {
    search.value = "";
    category = "all";
    onlyPinned = false;
    limit = PAGE_SIZE;
    render();
    search.focus();
  });
  pinnedFilter.addEventListener("click", () => {
    onlyPinned = !onlyPinned;
    limit = PAGE_SIZE;
    render();
  });
  more.addEventListener("click", () => {
    const previous = list.children.length;
    limit += PAGE_SIZE;
    render();
    list.children[previous]?.querySelector("a")?.focus();
  });
  retry.addEventListener("click", async () => {
    await load();
    if (loaded) search.focus();
  });
  window.addEventListener("storage", (event) => {
    if ((event.key === KEY || event.key === null) && loaded) {
      readPins();
      render();
    }
  });
  new MutationObserver(() => {
    const next = document.body.classList.contains("teacher-mode");
    if (next === teacher) return;
    teacher = next;
    limit = PAGE_SIZE;
    if (loaded) {
      if (category !== "all" && !available().some((r) => r.category === category)) category = "all";
      renderFilters();
      render();
    }
  }).observe(document.body, { attributes: true, attributeFilter: ["class"] });
  load();
})();
