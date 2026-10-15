/* Lesson Path: level tabs (arrow keys), the remembered level, and honest "I finished this step" marks.
 * Marks are the student's own report, saved with EWLStateStore.markStage (curious, notes, lab, check). */
(() => {
  const page = document.querySelector(".lp-page");
  if (!page) return;
  const id = page.dataset.lesson;
  const store = window.EWLStateStore;
  const lang = new URLSearchParams(location.search).get("lang");
  if (lang === "es") document.documentElement.lang = "es";
  const STAGE = { curious: "curious", build: "notes", lab: "lab", check: "check" };
  const tabs = [...page.querySelectorAll(".lp-levels [role=tab]")];
  const choose = (level, focus) => {
    for (const t of tabs) {
      const on = t.dataset.level === level;
      t.setAttribute("aria-selected", String(on));
      t.tabIndex = on ? 0 : -1;
      page.querySelector(`#lp-level-${t.dataset.level}`).hidden = !on;
      if (on && focus) t.focus();
    }
    if (store)
      store.update((s) => {
        s.prefs.level = level;
      });
  };
  tabs.forEach((t, i) => {
    t.addEventListener("click", () => choose(t.dataset.level));
    t.addEventListener("keydown", (e) => {
      const d = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
      if (d) {
        e.preventDefault();
        choose(tabs[(i + d + tabs.length) % tabs.length].dataset.level, true);
      }
    });
  });
  const saved = store?.get().prefs.level;
  if (saved && tabs.some((t) => t.dataset.level === saved)) choose(saved);
  if (store) {
    try {
      store.setLesson(id);
    } catch {
      /* ignore */
    }
  }
  for (const b of page.querySelectorAll(".lp-mark")) {
    const stage = STAGE[b.dataset.stage];
    if (store?.stagesDone(id).includes(stage)) b.setAttribute("aria-pressed", "true");
    b.addEventListener("click", () => {
      if (!store) return;
      store.markStage(id, stage);
      b.setAttribute("aria-pressed", "true");
    });
  }
  // Class sprint: the Fluency Spiral loads only when a student asks for it.
  const start = page.querySelector("#lp-sprint-start");
  if (start) {
    const load = (src) =>
      new Promise((ok) => {
        const s = document.createElement("script");
        s.src = src;
        s.onload = () => ok(true);
        s.onerror = () => ok(false);
        document.head.appendChild(s);
      });
    start.addEventListener("click", async () => {
      const host = page.querySelector("#lp-sprint-host");
      for (const f of ["reasoning", "ui", "fluency"])
        if (!(await load(`/assets/ewl/${f}.js`))) {
          host.textContent = "The sprint could not load. Check your connection and try again.";
          return;
        }
      const unit = Number(page.querySelector(".lp-sprint").dataset.unit);
      const code = page.querySelector("#lp-code").value.trim();
      const parsed = window.EWL.Fluency.parseCode(code);
      if (code && !parsed) {
        host.textContent = "That code should look like KITE-4821.";
        return;
      }
      window.EWL.Fluency.mount(host, { unit, code: parsed ? code : undefined, n: 12 });
    });
  }
})();
