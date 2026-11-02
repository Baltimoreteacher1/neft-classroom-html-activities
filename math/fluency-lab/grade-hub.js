// Grade home sections. One grade page used to stack ten sections in a single 9,000px scroll; this keeps every
// section but shows one at a time: Today, Skills, Fact Trail, Skill map, Rewards. Sections tag themselves with
// data-hub-panel and grade-hub.css hides the rest, so a re-render of the dashboard never changes the open tab.
const HUBS = ["today", "skills", "trail", "map", "rewards"];
const KEY = "fluency-lab:grade-hub";

const read = () => {
  try {
    const saved = sessionStorage.getItem(KEY);
    return HUBS.includes(saved) ? saved : "today";
  } catch {
    return "today";
  }
};

export function initGradeHub(library, { onChange } = {}) {
  const tabs = library.querySelector("#grade-hub-tabs");
  let current = read();
  const apply = (hub, { focus = false, notify = true } = {}) => {
    if (!HUBS.includes(hub)) return;
    current = hub;
    library.dataset.hub = hub;
    try {
      sessionStorage.setItem(KEY, hub);
    } catch {
      // Private mode: the tab simply resets to Today on the next visit.
    }
    for (const tab of tabs?.querySelectorAll("[data-hub-tab]") ?? []) {
      const on = tab.dataset.hubTab === hub;
      tab.setAttribute("aria-selected", String(on));
      tab.tabIndex = on ? 0 : -1;
      if (on && focus) tab.focus();
    }
    if (notify) onChange?.(hub);
  };
  tabs?.addEventListener("click", (event) => {
    const tab = event.target.closest("[data-hub-tab]");
    if (tab) apply(tab.dataset.hubTab);
  });
  tabs?.addEventListener("keydown", (event) => {
    const step = { ArrowRight: 1, ArrowLeft: -1 }[event.key];
    if (event.key === "Home" || event.key === "End" || step) {
      event.preventDefault();
      const next = event.key === "Home" ? 0 : event.key === "End" ? HUBS.length - 1 : (HUBS.indexOf(current) + step + HUBS.length) % HUBS.length;
      apply(HUBS[next], { focus: true });
    }
  });
  // In-page doors ("Browse skills", "Show me the trail") name the tab they want.
  library.addEventListener("click", (event) => {
    const door = event.target.closest("[data-hub-go], a[href='#subnav-skills']");
    if (!door) return;
    event.preventDefault();
    apply(door.dataset.hubGo || "skills");
    tabs?.scrollIntoView({ behavior: "smooth", block: "start" });
  });
  apply(current, { notify: false });
  return { current: () => current, set: apply };
}
