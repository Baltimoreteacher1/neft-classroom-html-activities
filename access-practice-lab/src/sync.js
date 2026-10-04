// Integration with the site-wide Save/Resume engine (window.NeftSaveResume).
// The lab contributes its whole progress set as custom state, so a student's
// Save/Resume code carries their lab progress to another device. The engine's
// generic field/tab capture never touches lab controls (they are marked
// data-nsr-ignore and the lab renders no tab-shaped elements).
import { PREFIX, importProgressData } from "./store.js";
import { storage, announce } from "./util.js";

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
      try {
        importProgressData(custom.data);
        onRestore?.();
        announce("Backup loaded. Work already on this device was kept; missing activities were added.");
      } catch (err) {
        announce(err.message || "That backup could not be loaded.");
      }
    });
    return true;
  };
  if (attach()) return;
  // The engine loads with `defer`; try again once the document is ready.
  const retry = () => attach();
  if (document.readyState === "complete") setTimeout(retry, 0);
  else window.addEventListener("load", retry, { once: true });
}
