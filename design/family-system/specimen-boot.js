// Applies the reader options before first paint. Classic script so it also works from file://.
// Options live in the URL (so a frame and a test can set them) and in localStorage (so a refresh keeps them).
(() => {
  const KEY = "fm-specimen-v1";
  const OPTIONS = {
    lang: ["en", "es"],
    theme: ["auto", "light", "dark", "contrast"],
    text: ["100", "115", "130", "150"],
    unit: ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"],
    frame: ["full", "320", "390", "768", "1280"],
    spacing: ["default", "more"],
    reading: ["default", "dyslexia"],
    measure: ["default", "narrow"],
    motion: ["default", "reduce"],
    gray: ["off", "on"],
  };
  let stored = {};
  try {
    stored = JSON.parse(localStorage.getItem(KEY) || "{}");
  } catch {}
  const params = new URLSearchParams(location.search);
  const embed = params.has("embed");
  const state = {};
  for (const [name, allowed] of Object.entries(OPTIONS)) {
    // An embedded frame is told everything by the URL; it never reads another tab's saved choices.
    const wanted = params.get(name) ?? (embed ? undefined : stored[name]);
    state[name] = allowed.includes(wanted) ? wanted : allowed[0];
  }
  if (params.get("unit") == null && (embed || stored.unit == null)) state.unit = "4";
  const root = document.documentElement;
  const set = (attr, on, value) =>
    on ? root.setAttribute(attr, value) : root.removeAttribute(attr);
  function apply() {
    root.lang = state.lang;
    set("data-theme", state.theme !== "auto", state.theme);
    set("data-text-size", state.text !== "100", state.text);
    root.setAttribute("data-unit", state.unit);
    set("data-spacing", state.spacing !== "default", state.spacing);
    set("data-reading", state.reading !== "default", state.reading);
    set("data-measure", state.measure !== "default", state.measure);
    set("data-motion", state.motion !== "default", state.motion);
    set("data-gray", state.gray === "on", "on");
    set("data-embed", embed, "");
    set("data-frame", !embed && state.frame !== "full", state.frame);
  }
  apply();
  window.__fmSpecimen = {
    OPTIONS,
    state,
    embed,
    apply,
    save() {
      if (embed) return;
      try {
        localStorage.setItem(KEY, JSON.stringify(state));
      } catch {}
    },
  };
})();
