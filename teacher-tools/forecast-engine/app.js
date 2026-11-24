/* Forecast Engine — page shell: navigation, theme, saving and start-up. */
(() => {
  "use strict";
  const NFE = window.NFE;
  const { store, esc, fmt } = NFE;

  const TABS = [
    ["overview", "Overview", "The class at a glance and your next moves."],
    ["data", "Data", "Add scores, import a file or set up your class."],
    ["forecast", "Forecast", "Where each student is headed, and how sure we are."],
    ["scenarios", "Scenarios", "Test a plan before you spend your time on it."],
    ["analysis", "Analysis", "Spread, growth, connections, fairness and data checks."],
    ["groups", "Groups", "Small groups that fit the time you have."],
    ["reports", "Reports", "Print or share a summary."],
    ["settings", "Settings", "Saved classes, backup and help."],
  ];
  const IDS = TABS.map((t) => t[0]);
  let active = "overview";

  NFE.sel = NFE.sel || {};
  NFE.arrive = null;
  NFE.takeArrive = () => {
    const a = NFE.arrive;
    NFE.arrive = null;
    return a;
  };

  /** Jump to a tab, optionally carrying a student, standard or sub-tab. */
  NFE.go = (tab, payload = {}) => {
    if (payload.student && payload.standard)
      NFE.sel = { ...NFE.sel, student: payload.student, standard: payload.standard };
    else if (payload.student && tab === "forecast")
      NFE.sel = { ...NFE.sel, student: payload.student };
    NFE.arrive = payload;
    if (location.hash === `#${tab}`) show(tab, true);
    else location.hash = tab;
  };

  function nav() {
    NFE.$("#nav").innerHTML = TABS.map(
      ([id, label]) =>
        `<a class="nav-item" href="#${id}" data-tab="${id}"${id === active ? ' aria-current="page"' : ""}>${NFE.icon(id, 20)}<span>${label}</span></a>`,
    ).join("");
  }
  function chrome() {
    const s = store.state;
    NFE.$("#classLine").textContent = s.class.name || "My class";
    NFE.$("#classCounts").textContent =
      `${fmt.plural(s.students.length, "student")} · ${fmt.plural(s.standards.length, "standard")} · ${fmt.plural(s.evidence.length, "score")}`;
    document.documentElement.dataset.theme = s.theme === "dark" ? "dark" : "light";
    const dark = s.theme === "dark";
    const btn = NFE.$("#themeBtn");
    btn.innerHTML = NFE.icon(dark ? "sun" : "moon", 18);
    btn.setAttribute("aria-label", dark ? "Switch to light mode" : "Switch to dark mode");
    btn.setAttribute("aria-pressed", String(dark));
  }

  function show(tab, userAction = false) {
    active = IDS.includes(tab) ? tab : "overview";
    store.state.active = active;
    const [, label, sub] = TABS.find((t) => t[0] === active);
    NFE.$("#pageTitle").textContent = label;
    NFE.$("#pageSubtitle").textContent = sub;
    document.title = `${label} · Forecast Engine`;
    IDS.forEach((id) => {
      NFE.$(`#p-${id}`).hidden = id !== active;
    });
    nav();
    chrome();
    NFE.views[active].mount(NFE.$(`#p-${active}`));
    store.touch();
    if (userAction) {
      window.scrollTo({ top: 0 });
      NFE.$("#pageTitle").focus({ preventScroll: true });
    }
  }

  function wireGlobal() {
    document.addEventListener("click", (e) => {
      const go = e.target.closest("[data-go]");
      if (go) {
        let payload = {};
        try {
          payload = go.dataset.sel ? JSON.parse(go.dataset.sel) : {};
        } catch (_) {
          payload = {};
        }
        return NFE.go(go.dataset.go, payload);
      }
      const act = e.target.closest("[data-act]")?.dataset.act;
      if (act === "sample") {
        const run = () => store.loadSample();
        if (store.state.evidence.length && !store.state.sample)
          NFE.confirm(
            "Replace your current data with the sample class? You can undo this right after.",
            { ok: "Load sample" },
          ).then(
            (ok) =>
              ok &&
              (run(),
              NFE.toast("Sample class loaded.", { action: "Undo", onAction: () => store.undo() })),
          );
        else run();
      }
      if (act === "fresh") {
        store.startFresh();
        NFE.toast("Sample removed. Your class is empty.", {
          action: "Undo",
          onAction: () => store.undo(),
        });
        NFE.go("data", { tab: "setup" });
      }
      if (act === "undo" && store.undo()) NFE.toast("Undone.");
      if (act === "clear")
        NFE.confirm(
          "Clear every student, standard and score from this browser? Saved profiles stay. You can undo this right after.",
          { ok: "Clear everything", danger: true },
        ).then((ok) => {
          if (!ok) return;
          store.startFresh();
          NFE.toast("All data cleared.", { action: "Undo", onAction: () => store.undo() });
        });
    });
    NFE.$("#themeBtn").addEventListener("click", () => {
      store.state.theme = store.state.theme === "dark" ? "light" : "dark";
      chrome();
      store.touch();
    });
    NFE.$("#helpBtn").addEventListener("click", NFE.showHelp);
    window.addEventListener("hashchange", () => show(location.hash.slice(1), true));
    window.addEventListener("afterprint", () => delete document.body.dataset.print);
    document.addEventListener("nfe:saved", (e) => {
      const el = NFE.$("#saveBadge");
      el.textContent = e.detail.ok ? "Saved on this device" : "Could not save: export a backup";
      el.classList.toggle("bad", !e.detail.ok);
    });
    store.on(() => {
      chrome();
      NFE.views[active].mount(NFE.$(`#p-${active}`));
    });
  }

  /** Scrollable tables must be reachable by keyboard (a11y): label and focus them. */
  function watchScrollers() {
    const mark = () =>
      NFE.$$(".table-wrap:not([role])").forEach((el) => {
        el.setAttribute("role", "region");
        el.setAttribute("tabindex", "0");
        el.setAttribute("aria-label", "Table, scroll to see more");
      });
    new MutationObserver(mark).observe(NFE.$("#main"), { childList: true, subtree: true });
    mark();
  }

  function boot() {
    store.load();
    document.documentElement.dataset.theme = store.state.theme === "dark" ? "dark" : "light";
    IDS.forEach((id) => NFE.views[id].wire?.(NFE.$(`#p-${id}`)));
    wireGlobal();
    watchScrollers();
    if (store.syncLessons()) store.touch();
    const fromHash = location.hash.slice(1);
    show(
      IDS.includes(fromHash)
        ? fromHash
        : IDS.includes(store.state.active)
          ? store.state.active
          : "overview",
    );
    window.NFE_READY = true;
  }

  void esc;
  boot();
})();
