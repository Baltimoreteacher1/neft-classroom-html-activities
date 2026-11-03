// Storage and connection UI for the ACCESS lab: where the work lives, how much space it takes, and the learner's
// export / import / delete controls. Everything stays on this device; there is no sync, and the text never says there is.
import { h } from "../engine/dom.js";

const mb = (n) => (n < 1024 * 1024 ? `${Math.max(1, Math.round(n / 1024))} KB` : `${(n / 1024 / 1024).toFixed(1)} MB`);

/** "You are offline" / "back online" line. Honest: nothing is synced, so reconnecting changes nothing. */
export function mountConnectionStatus(doc, parent) {
  const el = h(doc, "p", { class: "acc-conn", role: "status", "aria-live": "polite" });
  const view = doc.defaultView;
  let off = view.navigator.onLine === false;
  let wasOffline = off;
  const paint = () => {
    if (off) {
      el.textContent = "You are offline. You can keep working: answers and recordings are saved on this device.";
      el.dataset.state = "offline";
    } else if (wasOffline) {
      el.textContent = "You are back online. Nothing needs to upload: your work is already saved on this device.";
      el.dataset.state = "online";
    } else {
      el.textContent = "";
      el.dataset.state = "";
    }
    el.hidden = !el.textContent;
  };
  // Driven by the browser's events, not by polling navigator.onLine, so a page loaded while offline still reports the change.
  const goOffline = () => ((off = true), (wasOffline = true), paint());
  const goOnline = () => ((off = false), paint());
  view.addEventListener("online", goOnline);
  view.addEventListener("offline", goOffline);
  paint();
  parent.append(el);
  return { el, destroy: () => (view.removeEventListener("online", goOnline), view.removeEventListener("offline", goOffline)) };
}

/** Panel with usage, persistence status and data controls. */
export function renderStoragePanel({ doc, getStorage, onChange }) {
  const root = h(doc, "section", { class: "acc-storage acc-card", "aria-labelledby": "accStorageTitle" });
  const note = h(doc, "p", { class: "acc-hint" }); // where the data lives: set by refresh()
  const status = h(doc, "p", { class: "acc-hint", role: "status", "aria-live": "polite" }); // result of the last action
  const usage = h(doc, "dl", { class: "acc-stats" });
  const actions = h(doc, "div", { class: "acc-actions" });
  const confirmBox = h(doc, "div", { class: "acc-state is-warn", role: "group", hidden: true });
  const say = (m) => {
    status.textContent = m;
  };
  const stat = (label, value) => h(doc, "div", { class: "acc-stat" }, h(doc, "dt", { text: label }), h(doc, "dd", { text: String(value) }));

  async function refresh() {
    const store = await getStorage();
    const u = await store.usage().catch(() => null);
    usage.replaceChildren(...(u ? [stat("Practice sittings saved", u.sessions), stat("Evidence rows", u.progress), stat("Recordings", `${u.recordings}${u.recordings ? ` · ${mb(u.recordingBytes)}` : ""}`), ...(u.quota ? [stat("Space used on this device", `${mb(u.usage || 0)} of ${mb(u.quota)}`)] : [])] : []));
    note.textContent = store.persistent ? "Saved in this browser on this device. Nothing is uploaded." : "This browser is not saving your work (private browsing or blocked storage). It will be lost when you close the page. Export it to keep it.";
    root.dataset.persistent = String(store.persistent);
  }

  const download = (name, data, type = "application/json") => {
    const url = URL.createObjectURL(new Blob([data], { type }));
    const a = h(doc, "a", { href: url, download: name });
    doc.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  const btn = (text, act, fn, primary = false) => {
    const b = h(doc, "button", { type: "button", class: `acc-btn${primary ? " primary" : ""}`, "data-act": act, text });
    b.addEventListener("click", fn);
    actions.append(b);
    return b;
  };
  const ask = (message, yesText, run) => {
    confirmBox.hidden = false;
    confirmBox.replaceChildren(h(doc, "p", { text: message }));
    const row = h(doc, "div", { class: "acc-actions" });
    const yes = h(doc, "button", { type: "button", class: "acc-btn primary", "data-act": "confirm-delete", text: yesText });
    const no = h(doc, "button", { type: "button", class: "acc-btn", text: "Keep it" });
    yes.addEventListener("click", async () => {
      confirmBox.hidden = true;
      await run();
      await refresh();
      onChange?.();
    });
    no.addEventListener("click", () => (confirmBox.hidden = true));
    row.append(yes, no);
    confirmBox.append(row);
    yes.focus();
  };

  btn("Export my practice data", "export", async () => {
    const data = await (await getStorage()).exportAll();
    download(`access-practice-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify(data));
    say("Exported your sittings and evidence. Recordings are not included.");
  });
  btn("Export with recordings", "export-audio", async () => {
    const data = await (await getStorage()).exportAll({ includeRecordings: true });
    download(`access-practice-with-audio-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify(data));
    say("Exported everything, including your recordings. Keep this file private: it contains your voice.");
  });
  const file = h(doc, "input", { type: "file", accept: "application/json,.json", class: "acc-visually-hidden", "aria-label": "Choose an exported practice file", id: "accImport" });
  file.addEventListener("change", async () => {
    try {
      const data = JSON.parse(await file.files[0].text());
      const r = await (await getStorage()).importAll(data);
      say(`Imported ${r.added} ${r.added === 1 ? "item" : "items"}. ${r.conflicts ? `${r.conflicts} already here, so they were kept as they are.` : ""}`);
      await refresh();
      onChange?.();
    } catch (e) {
      say(e?.code === "invalid" ? e.message : "That file could not be read. Choose a file exported from the ACCESS Practice Lab.");
    }
    file.value = "";
  });
  const importLabel = h(doc, "label", { class: "acc-btn", for: "accImport", text: "Import a saved file" });
  actions.append(importLabel, file);
  btn("Delete my recordings", "delete-recordings", () => ask("Delete every saved recording on this device? This cannot be undone.", "Yes, delete recordings", async () => ((await (await getStorage()).purge({ recordings: true })), say("Recordings deleted."))));
  btn("Delete all my practice data", "delete-all", () => ask("Delete all sittings, evidence and recordings on this device? This cannot be undone.", "Yes, delete everything", async () => ((await (await getStorage()).purge({ sessions: true, recordings: true, progress: true })), say("All practice data deleted from this device."))));

  root.append(h(doc, "h2", { id: "accStorageTitle", text: "Your data on this device" }), note, usage, status, actions, confirmBox);
  refresh();
  return { el: root, refresh };
}
