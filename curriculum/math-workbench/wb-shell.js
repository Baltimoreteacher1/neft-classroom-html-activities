/* Math Workbench — shell layer: top-bar fit, tool search + recent tools, first-run tour.
 * Reaches the board only through window.MWBShell (defined in index.html).
 *
 *  - On phones the less-used top-bar buttons move into the "More" menu so the bar stays
 *    one row; they move back when the screen is wide again (listeners travel with them).
 *  - "Find a tool" lists every tool the palettes offer (read from the palettes themselves,
 *    so a tool added to a palette is searchable with no second list to keep in sync) and
 *    remembers the last few you used.
 *  - A short, skippable, remembered tour; it never starts by itself. */
(function (root) {
  "use strict";
  const doc = root.document;
  if (!doc || root.MWBShellUI) return;

  const RECENT_KEY = "mw_recent_tools";
  const TOUR_KEY = "mw_tour_done";
  const $ = (selector, scope) => (scope || doc).querySelector(selector);
  const tr = (text) => (root.MWBI18n ? root.MWBI18n.t(text) : text);

  function store(key, value) {
    try {
      if (value === undefined) return root.localStorage.getItem(key);
      root.localStorage.setItem(key, value);
    } catch (_) {}
    return null;
  }

  /* ------------------------------------------------------- one-row top bar (phones) */
  const MOVE_IDS = ["clearBtn", "printBtn", "langBtn", "a11yBtn"];
  // The "••• More" menu. Times Table is deliberately NOT collected: it is a lookup a
  // student reaches for mid-problem, so it stays in the top row.
  function buildMoreMenu() {
    const bar = $(".top-actions");
    if (!bar || doc.getElementById("mwbMoreTools")) return;
    const details = doc.createElement("details");
    details.id = "mwbMoreTools";
    details.className = "mwb-more-tools";
    details.innerHTML =
      '<summary aria-label="Open more Workbench tools">••• More</summary><div class="mwb-more-menu"></div>';
    const menu = details.querySelector(".mwb-more-menu");
    for (const id of ["bgTopBtn", "snapBtn", "calcBtn", "backupBtn", "openBtn", "helpBtn"]) {
      const node = doc.getElementById(id);
      if (node) menu.appendChild(node);
    }
    bar.appendChild(details);
    doc.addEventListener("click", (event) => {
      if (details.open && !details.contains(event.target)) details.open = false;
    });
  }
  function setupTopBar() {
    buildMoreMenu();
    const bar = $(".top-actions");
    const more = $("#mwbMoreTools .mwb-more-menu");
    const anchor = $("#mwbMoreTools");
    if (!bar || !more || !anchor || !root.matchMedia) return;
    const nodes = MOVE_IDS.map((id) => doc.getElementById(id)).filter(Boolean);
    const query = root.matchMedia("(max-width: 700px)");
    const place = () => {
      for (const node of nodes) {
        if (query.matches) more.appendChild(node);
        else bar.insertBefore(node, anchor);
      }
    };
    place();
    query.addEventListener("change", place);
  }

  /* ----------------------------------------------------------- tool registry */
  const KEYWORDS = {
    "Coordinate plane": "graph axes x y points quadrant ordered pair",
    "Number line": "integers negative positive",
    Protractor: "angle degrees measure",
    "Angle (measurable)": "protractor degrees",
    Ruler: "measure length inches centimeters",
    "Place-value chart": "decimal digits tenths hundredths",
    "Ten-frame": "counting ten",
    "Array / area model": "multiply rows columns area box",
    "Fraction bar": "fractions parts shade strip",
    "Base-ten blocks": "place value hundreds tens ones",
    "Double number line": "ratio rate unit",
    "Ratio table": "ratio equivalent unit rate",
    "Tape diagram": "bar model strip part whole",
    "Integer chips": "counters positive negative zero pairs",
    "Algebra tiles": "equation variable x",
    "Inequality line": "graph greater less than",
    "Dot plot": "data line plot",
    "Box plot": "box and whisker median quartile",
    Histogram: "data bars frequency",
    Fraction: "numerator denominator",
    "Long division": "divide quotient",
    "Separator line": "line bar",
    "Cross out": "cancel regroup",
  };

  function normalize(value) {
    return String(value || "")
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .trim();
  }

  function readRecents() {
    try {
      const list = JSON.parse(store(RECENT_KEY));
      return Array.isArray(list) ? list.filter((x) => x && x.id).slice(0, 6) : [];
    } catch (_) {
      return [];
    }
  }
  function remember(entry) {
    const list = readRecents().filter((x) => x.id !== entry.id);
    list.unshift({ id: entry.id, kind: entry.kind, label: entry.label });
    store(RECENT_KEY, JSON.stringify(list.slice(0, 6)));
    renderRecentRow();
  }

  /* The palettes are built when opened, so read them by opening each one out of sight. */
  function harvestTools() {
    const shell = root.MWBShell;
    const flyout = $("#flyout");
    if (!shell || !flyout) return [];
    const wasOpen = flyout.classList.contains("open");
    const wasKind = shell.flyoutKind();
    flyout.style.visibility = "hidden";
    const found = [];
    const seen = new Set();
    // "tools" first: when two palettes offer a tool of the same name, the richer one wins.
    for (const kind of ["tools", "setup", "shapes"]) {
      shell.openFlyout(kind);
      flyout.querySelectorAll(".pal-item.tall").forEach((button) => {
        const label = (button.querySelector("small") || button).textContent.trim();
        if (!label || seen.has(label)) return;
        seen.add(label);
        const icon = button.firstElementChild;
        found.push({
          id: `${kind}:${label}`,
          kind,
          label,
          icon: icon && icon.tagName !== "SMALL" ? icon.outerHTML : "",
        });
      });
    }
    if (wasOpen && wasKind) shell.openFlyout(wasKind);
    else shell.closeFlyout();
    flyout.style.visibility = "";
    return found;
  }

  function runTool(entry) {
    const shell = root.MWBShell;
    const flyout = $("#flyout");
    if (!shell || !flyout) return;
    flyout.style.visibility = "hidden";
    shell.openFlyout(entry.kind);
    const target = [...flyout.querySelectorAll(".pal-item.tall")].find(
      (button) => (button.querySelector("small") || button).textContent.trim() === entry.label,
    );
    if (target) target.click();
    shell.closeFlyout();
    flyout.style.visibility = "";
    if (target) remember(entry);
    else shell.toast("That tool is not available right now");
  }

  /* Remember tools picked straight from a palette too. */
  function watchPalettes() {
    const flyout = $("#flyout");
    if (!flyout) return;
    flyout.addEventListener("click", (event) => {
      if (flyout.style.visibility === "hidden") return;
      const button = event.target.closest(".pal-item.tall");
      if (!button) return;
      const label = (button.querySelector("small") || button).textContent.trim();
      const kind = flyout.dataset.kind || "";
      if (label && ["setup", "shapes", "tools"].includes(kind)) {
        remember({ id: `${kind}:${label}`, kind, label });
      }
    });
  }

  /* -------------------------------------------------------------- search popover */
  let pop = null;
  let searchBtn = null;
  let tools = [];

  function closePop() {
    if (!pop) return;
    pop.remove();
    pop = null;
    if (searchBtn) {
      searchBtn.setAttribute("aria-expanded", "false");
      searchBtn.focus();
    }
  }

  function matches(entry, query) {
    if (!query) return true;
    const hay = normalize(`${entry.label} ${tr(entry.label)} ${KEYWORDS[entry.label] || ""}`);
    return normalize(query)
      .split(/\s+/)
      .every((term) => hay.includes(term));
  }

  function resultButton(entry) {
    const li = doc.createElement("li");
    const b = doc.createElement("button");
    b.type = "button";
    b.className = "wbx-result";
    b.dataset.id = entry.id;
    if (entry.icon) {
      const icon = doc.createElement("span");
      icon.className = "wbx-result-icon";
      icon.setAttribute("aria-hidden", "true");
      icon.innerHTML = entry.icon;
      b.appendChild(icon);
    }
    const text = doc.createElement("span");
    text.textContent = entry.label;
    b.appendChild(text);
    b.addEventListener("click", () => {
      closePop();
      runTool(entry);
    });
    li.appendChild(b);
    return li;
  }

  function fillResults(query) {
    const ul = $(".wbx-results", pop);
    ul.textContent = "";
    const recents = readRecents()
      .map((r) => tools.find((t) => t.id === r.id))
      .filter(Boolean);
    const shown = tools.filter((t) => matches(t, query));
    if (!query && recents.length) {
      const head = doc.createElement("li");
      head.className = "wbx-results-head";
      head.textContent = "Recent";
      ul.appendChild(head);
      recents.forEach((entry) => {
        ul.appendChild(resultButton(entry));
      });
      const all = doc.createElement("li");
      all.className = "wbx-results-head";
      all.textContent = "All tools";
      ul.appendChild(all);
    }
    shown.forEach((entry) => {
      ul.appendChild(resultButton(entry));
    });
    if (!shown.length) {
      const none = doc.createElement("li");
      none.className = "wbx-muted";
      none.textContent = "No tool found. Try a shorter word, like graph, fraction or angle.";
      ul.appendChild(none);
    }
    const status = $(".wbx-status", pop);
    status.textContent = shown.length === 1 ? "1 tool" : `${shown.length} tools`;
  }

  function openPop() {
    if (pop) return closePop();
    tools = harvestTools();
    pop = doc.createElement("div");
    pop.className = "wbx-pop";
    pop.setAttribute("role", "dialog");
    pop.setAttribute("aria-label", "Find a tool");
    pop.innerHTML =
      '<label class="wbx-pop-label" for="wbxToolQuery">Find a tool</label>' +
      '<input id="wbxToolQuery" type="search" class="wbx-input" autocomplete="off" spellcheck="false" placeholder="Try: graph, fraction, angle…" />' +
      '<p class="wbx-status wbx-muted" role="status" aria-live="polite"></p>' +
      '<ul class="wbx-results"></ul>';
    doc.body.appendChild(pop);
    searchBtn.setAttribute("aria-expanded", "true");
    const input = $("#wbxToolQuery", pop);
    fillResults("");
    input.addEventListener("input", () => fillResults(input.value));
    pop.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closePop();
        return;
      }
      if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
      const items = [...pop.querySelectorAll(".wbx-result")];
      if (!items.length) return;
      event.preventDefault();
      const at = items.indexOf(doc.activeElement);
      const next =
        event.key === "ArrowDown"
          ? items[Math.min(items.length - 1, at + 1)]
          : at <= 0
            ? input
            : items[at - 1];
      next.focus();
    });
    input.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        const first = pop.querySelector(".wbx-result");
        if (first) first.click();
      }
    });
    input.focus();
  }

  function renderRecentRow() {
    const row = $("#wbxRecent");
    if (!row) return;
    row.textContent = "";
    readRecents()
      .slice(0, 3)
      .forEach((entry) => {
        const b = doc.createElement("button");
        b.type = "button";
        b.className = "wbx-recent-btn";
        b.title = entry.label;
        b.setAttribute("aria-label", `Recent tool: ${entry.label}`);
        b.textContent = entry.label;
        b.addEventListener("click", () => runTool({ ...entry, id: entry.id }));
        row.appendChild(b);
      });
    row.hidden = !row.children.length;
  }

  function setupSearch() {
    const rail = $("#rail");
    if (!rail || $("#wbxToolBtn")) return;
    searchBtn = doc.createElement("button");
    searchBtn.type = "button";
    searchBtn.id = "wbxToolBtn";
    searchBtn.className = "wbx-tool";
    searchBtn.setAttribute("aria-haspopup", "dialog");
    searchBtn.setAttribute("aria-expanded", "false");
    searchBtn.title = "Find a tool by name";
    searchBtn.innerHTML =
      '<span class="glyph" aria-hidden="true">🔎</span><span class="lbl">Find</span>';
    searchBtn.addEventListener("click", openPop);
    const quick = $(".op-quick", rail);
    if (quick) quick.after(searchBtn);
    else rail.prepend(searchBtn);
    const row = doc.createElement("div");
    row.id = "wbxRecent";
    row.className = "wbx-recent";
    row.setAttribute("role", "group");
    row.setAttribute("aria-label", "Recent tools");
    searchBtn.after(row);
    renderRecentRow();
    watchPalettes();
    doc.addEventListener("pointerdown", (event) => {
      if (pop && !pop.contains(event.target) && !searchBtn.contains(event.target)) closePop();
    });
    doc.addEventListener("keydown", (event) => {
      if (!event.altKey || event.ctrlKey || event.metaKey || event.key.toLowerCase() !== "f")
        return;
      event.preventDefault();
      openPop();
    });
  }

  /* ------------------------------------------------------------------- the tour */
  const STEPS = [
    ["[data-tool='pen']", "Pick the Pen, then write or draw right on the board."],
    [
      "[data-tool='tools']",
      "Tools drops math models on the board: number lines, graphs, tape diagrams and more.",
    ],
    ["#wbxToolBtn", "Not sure where a tool is? Find it by name."],
    ["#undoBtn", "Made a mistake? Undo brings it back."],
    [
      "#guideBtn",
      "Guided Practice puts a ready-made workspace on the board for the kind of problem you are solving.",
    ],
    [
      "#reasoningStudioBtn",
      "The Reasoning Studio helps you explain your thinking and keep evidence of how you grew.",
    ],
    ["#dock", "The Formula & Reference Bank is down here. Tap a card to put it on your board."],
  ];

  let tour = null;
  function endTour(done) {
    if (!tour) return;
    tour.ring.remove();
    tour.card.remove();
    doc.removeEventListener("keydown", tour.onKey, true);
    root.removeEventListener("resize", tour.onResize);
    const opener = tour.opener;
    tour = null;
    if (done) store(TOUR_KEY, "1");
    if (opener && opener.isConnected) opener.focus();
  }

  function stepTargets() {
    return STEPS.map(([selector, text]) => ({ el: $(selector), text })).filter(
      (s) => s.el && s.el.getClientRects().length,
    );
  }

  function showStep() {
    const steps = tour.steps;
    const step = steps[tour.i];
    const rect = step.el.getBoundingClientRect();
    const pad = 5;
    Object.assign(tour.ring.style, {
      left: `${rect.left - pad}px`,
      top: `${rect.top - pad}px`,
      width: `${rect.width + pad * 2}px`,
      height: `${rect.height + pad * 2}px`,
    });
    $(".wbx-tour-text", tour.card).textContent = step.text;
    $(".wbx-tour-count", tour.card).textContent = `Step ${tour.i + 1} / ${steps.length}`;
    $(".wbx-tour-back", tour.card).hidden = tour.i === 0;
    $(".wbx-tour-next", tour.card).textContent = tour.i === steps.length - 1 ? "Done" : "Next";
    const cardW = Math.min(300, root.innerWidth - 16);
    const left = Math.max(8, Math.min(root.innerWidth - cardW - 8, rect.left));
    const below = rect.bottom + 12 + 150 < root.innerHeight;
    tour.card.style.width = `${cardW}px`;
    tour.card.style.left = `${left}px`;
    tour.card.style.top = below ? `${rect.bottom + 12}px` : "";
    tour.card.style.bottom = below ? "" : `${Math.max(8, root.innerHeight - rect.top + 12)}px`;
    $(".wbx-tour-next", tour.card).focus();
  }

  function startTour() {
    endTour(false);
    const steps = stepTargets();
    if (!steps.length) return;
    const ring = doc.createElement("div");
    ring.className = "wbx-tour-ring";
    ring.setAttribute("aria-hidden", "true");
    const card = doc.createElement("div");
    card.className = "wbx-tour";
    card.setAttribute("role", "dialog");
    card.setAttribute("aria-label", "Workbench tour");
    card.innerHTML =
      '<p class="wbx-tour-count wbx-muted"></p><p class="wbx-tour-text"></p>' +
      '<div class="wbx-tour-row"><button type="button" class="tbtn wbx-tour-skip">Skip tour</button>' +
      '<button type="button" class="tbtn wbx-tour-back">Back</button>' +
      '<button type="button" class="tbtn solid wbx-tour-next">Next</button></div>';
    doc.body.append(ring, card);
    const onKey = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        endTour(true);
      }
    };
    const onResize = () => tour && showStep();
    tour = { steps, i: 0, ring, card, onKey, onResize, opener: doc.activeElement };
    doc.addEventListener("keydown", onKey, true);
    root.addEventListener("resize", onResize);
    $(".wbx-tour-skip", card).addEventListener("click", () => endTour(true));
    $(".wbx-tour-back", card).addEventListener("click", () => {
      tour.i = Math.max(0, tour.i - 1);
      showStep();
    });
    $(".wbx-tour-next", card).addEventListener("click", () => {
      if (tour.i >= tour.steps.length - 1) endTour(true);
      else {
        tour.i += 1;
        showStep();
      }
    });
    showStep();
  }

  function setupTour() {
    doc.addEventListener("click", (event) => {
      if (event.target.closest("[data-wbx-tour]")) {
        const help = $("#helpModal");
        if (help && help.classList.contains("open") && $("#helpClose")) $("#helpClose").click();
        startTour();
      }
    });
    let wanted = false;
    try {
      wanted = new URLSearchParams(root.location.search).get("tour") === "1";
    } catch (_) {}
    if (wanted) root.setTimeout(startTour, 400);
    root.MWBShellUI = Object.freeze({
      startTour,
      tourDone: () => store(TOUR_KEY) === "1",
      openToolSearch: openPop,
    });
  }

  function boot() {
    setupTopBar();
    setupSearch();
    setupTour();
  }
  if (doc.readyState === "loading") doc.addEventListener("DOMContentLoaded", boot);
  else boot();
})(window);
