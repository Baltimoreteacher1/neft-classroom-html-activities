// Integration with the site-wide Save/Resume engine (window.NeftSaveResume).
// The lab contributes its whole progress set as custom state, so a student's
// Save/Resume code carries their lab progress to another device. The engine's
// generic field/tab capture never touches lab controls (they are marked
// data-nsr-ignore and the lab renders no tab-shaped elements).
import { PREFIX } from "./store.js";
import { storage } from "./util.js";

export function registerSaveResume(onRestore) {
  const attach = () => {
    const engine = window.NeftSaveResume;
    if (!engine?.registerStateProvider) return false;
    engine.registerStateProvider(() => {
      const data = {};
      for (const key of storage.keys())
        if (key.startsWith(`${PREFIX}:`)) data[key] = storage.get(key);
      return { accessLab: 1, data };
    });
    engine.registerStateRestorer?.((custom) => {
      if (!custom || custom.accessLab !== 1 || typeof custom.data !== "object") return;
      for (const [key, value] of Object.entries(custom.data))
        if (key.startsWith(`${PREFIX}:`) && typeof value === "string") storage.set(key, value);
      onRestore?.();
    });
    return true;
  };
  if (attach()) return;
  // The engine loads with `defer`; try again once the document is ready.
  const retry = () => attach();
  if (document.readyState === "complete") setTimeout(retry, 0);
  else window.addEventListener("load", retry, { once: true });
}
