// Start everything fresh: one control that clears all of a learner's saved work in the lab on this device (every
// activity, every page, kept recordings and postcards, preferences) and returns to the start. It never touches the
// Teacher Hub's own data (`accessTeacher:*`), which belongs to a teacher's device, not to a learner's progress.
import * as audioStore from "./audio-store.js";
import * as postcardStore from "./postcard-store.js";
import { BASE, announce, storage } from "./util.js";

const LAB_KEY = /^accessPracticeLab/;

/** Remove every lab key from local and session storage, then the lab's IndexedDB stores. Returns the key count. */
export async function startFresh() {
  let cleared = 0;
  for (const key of storage.keys()) {
    if (LAB_KEY.test(key)) {
      storage.remove(key);
      cleared++;
    }
  }
  try {
    for (const key of Object.keys(sessionStorage)) if (LAB_KEY.test(key)) sessionStorage.removeItem(key);
  } catch {
    // Session storage can be blocked; local storage was already cleared.
  }
  await audioStore.clearAll();
  await postcardStore.clearAll();
  try {
    const { DB_NAME } = await import("./acc/storage/access-db.js");
    await new Promise((resolve) => {
      const req = indexedDB.deleteDatabase(DB_NAME);
      req.onsuccess = req.onerror = req.onblocked = () => resolve();
    });
  } catch {
    // No IndexedDB here: nothing more to clear.
  }
  return cleared;
}

function dialog() {
  const d = document.createElement("dialog");
  d.className = "start-fresh";
  d.setAttribute("aria-labelledby", "startFreshTitle");
  d.innerHTML = `<form method="dialog">
    <h2 id="startFreshTitle" tabindex="-1">Start everything fresh?</h2>
    <p>This clears all of your work on this device: every activity, practice record, saved answer, kept recording and setting. You will start again from the beginning. It cannot be undone.</p>
    <p class="fine">Es: Esto borra todo tu trabajo en este dispositivo y empieza de nuevo. No se puede deshacer.</p>
    <p class="start-fresh-actions">
      <button type="submit" value="cancel" class="btn btn-primary" autofocus>Keep my work</button>
      <button type="button" class="btn" data-start-fresh-confirm>Clear everything and start fresh</button>
    </p>
    <p class="start-fresh-status" role="status"></p>
  </form>`;
  document.body.append(d);
  d.addEventListener("close", () => d.remove());
  d.querySelector("[data-start-fresh-confirm]").addEventListener("click", async (event) => {
    for (const b of d.querySelectorAll("button")) b.disabled = true;
    d.querySelector(".start-fresh-status").textContent = "Clearing your work...";
    announce("Clearing your work.");
    await startFresh();
    event.target.closest("dialog").close();
    location.assign(`${BASE}/`);
  });
  return d;
}

/** Wire every [data-start-fresh] control on any page. Safe to call once at startup. */
export function initStartFresh() {
  document.addEventListener("click", (event) => {
    if (!event.target.closest?.("[data-start-fresh]")) return;
    event.preventDefault();
    const d = dialog();
    if (typeof d.showModal === "function") d.showModal();
    else d.setAttribute("open", "");
  });
}
