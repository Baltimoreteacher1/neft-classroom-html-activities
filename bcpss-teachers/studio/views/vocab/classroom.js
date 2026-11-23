// Classroom mode: the Fullscreen API where it exists, a viewport-filling overlay everywhere else.
export function createClassroom(el, { onChange }) {
  let on = false;
  const set = (next) => {
    if (next === on) return;
    on = next;
    el.classList.toggle("st-v-classroom", on);
    document.documentElement.classList.toggle("st-v-lock", on);
    onChange(on);
  };
  const onFs = () => {
    if (on && !document.fullscreenElement && el.dataset.fs === "1") {
      el.dataset.fs = "0";
      set(false);
    }
  };
  document.addEventListener("fullscreenchange", onFs);
  return {
    get active() {
      return on;
    },
    async enter() {
      set(true);
      if (el.requestFullscreen && document.fullscreenEnabled !== false) {
        try {
          await el.requestFullscreen();
          el.dataset.fs = "1";
        } catch {
          el.dataset.fs = "0"; // overlay fallback: same layout, no browser full screen
        }
      }
    },
    async exit() {
      if (document.fullscreenElement === el) {
        el.dataset.fs = "0";
        try {
          await document.exitFullscreen();
        } catch {
          /* already out */
        }
      }
      set(false);
    },
    destroy() {
      document.removeEventListener("fullscreenchange", onFs);
      if (document.fullscreenElement === el) document.exitFullscreen?.().catch(() => {});
      el.classList.remove("st-v-classroom");
      document.documentElement.classList.remove("st-v-lock");
    },
  };
}
