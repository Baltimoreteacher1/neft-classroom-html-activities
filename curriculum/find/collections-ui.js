/* collections-ui.js — the "My collections" panel on /curriculum/find/ and the shared-collection banner.
 *
 * State lives in ./collections.js (pure); this module draws it and wires the controls. Every change is saved at once;
 * when the browser refuses storage the panel still works for this visit and says so. */

import {
  activeSet,
  addSet,
  clearAll,
  clearSet,
  decodeShare,
  deleteSet,
  encodeShare,
  inActive,
  loadRecent,
  loadSets,
  moveItem,
  pushRecent,
  removeItem,
  renameSet,
  saveSets,
  selectSet,
  setNote,
  toggleItem,
} from "./collections.js";
import { $, copy, el, printOnly, store } from "./dom.js";
import { kindLabel } from "./find-engine.js";

let state = loadSets(store);
let byPath = new Map();
const say = (msg) => {
  $("find-saved-status").textContent = msg;
};

function commit(next, msg) {
  state = next;
  if (!store || !saveSets(store, state))
    msg = `${msg ? `${msg} ` : ""}This browser is not letting the page save, so this list lasts only until you close the tab.`;
  render();
  if (msg) say(msg);
}

/* ---------- public ------------------------------------------------------------------------------------------- */
export const isSaved = (p) => inActive(state, p);
export function toggleSave(doc) {
  const had = isSaved(doc.p);
  commit(
    toggleItem(state, doc),
    had
      ? `Removed “${doc.t}” from ${activeSet(state).name}.`
      : `Saved “${doc.t}” to ${activeSet(state).name}.`,
  );
}
/** A new collection from a built set ("Lesson 6-6 · Small-group reteach"), made active. */
export function saveAsCollection(name, items) {
  if (state.sets.length >= 20) {
    say("You have 20 collections, the most this page keeps. Delete one first.");
    return;
  }
  commit(addSet(state, name, items), `Saved as the collection “${name}”.`);
  $("find-saved").scrollIntoView({ block: "nearest" });
}
export function syncSaveButtons(root = document) {
  for (const b of root.querySelectorAll("[data-save]")) {
    const saved = isSaved(b.dataset.save);
    b.setAttribute("aria-pressed", String(saved));
    b.textContent = saved ? "Saved" : "Save";
  }
}
export function saveButton(doc) {
  const b = el("button", {
    type: "button",
    class: "find-save",
    "data-save": doc.p,
    "aria-pressed": "false",
  });
  b.addEventListener("click", () => toggleSave(doc));
  syncSaveButtons({ querySelectorAll: () => [b] });
  return b;
}

/* ---------- drawing ---------------------------------------------------------------------------------------------- */
function itemRow(x, i, n) {
  const doc = byPath.get(x.p);
  const kids = [
    el("a", { href: x.p, "data-doc": x.p, text: x.t }),
    el("span", {
      class: "find-saved-kind",
      text: x.k === "language" ? "The Language Page" : kindLabel(x.k || doc?.k),
    }),
  ];
  if (x.n) kids.push(el("p", { class: "find-saved-note-text", text: x.n }));
  const btn = (text, label, fn, disabled) => {
    const b = el("button", {
      type: "button",
      class: "find-x",
      "aria-label": label,
      text,
      disabled,
    });
    b.addEventListener("click", fn);
    return b;
  };
  const up = btn(
    "Up",
    `Move ${x.t} up`,
    () => {
      commit(moveItem(state, x.p, -1), `Moved “${x.t}” up.`);
      $("find-saved-list").children[i - 1]?.querySelector("[data-move='up'], a")?.focus();
    },
    i === 0,
  );
  up.dataset.move = "up";
  const down = btn(
    "Down",
    `Move ${x.t} down`,
    () => {
      commit(moveItem(state, x.p, 1), `Moved “${x.t}” down.`);
      $("find-saved-list").children[i + 1]?.querySelector("[data-move='down'], a")?.focus();
    },
    i === n - 1,
  );
  down.dataset.move = "down";
  const noteId = `find-note-${i}`;
  const area = el("textarea", {
    id: noteId,
    rows: "2",
    maxlength: "240",
    class: "find-note-input",
  });
  area.value = x.n || "";
  const saveNote = btn("Save note", `Save the note for ${x.t}`, () => {
    commit(setNote(state, x.p, area.value), area.value.trim() ? "Note saved." : "Note removed.");
  });
  const note = el(
    "details",
    { class: "find-note-edit" },
    el("summary", { text: x.n ? "Edit note" : "Add a note" }),
    el("label", { for: noteId, text: `Note for ${x.t} (for example: “Group 2, Tuesday”)` }),
    area,
    saveNote,
  );
  const tools = el(
    "div",
    { class: "find-saved-tools" },
    up,
    down,
    btn("Remove", `Remove ${x.t} from ${activeSet(state).name}`, () =>
      commit(removeItem(state, x.p), `Removed “${x.t}”.`),
    ),
  );
  return el("li", {}, ...kids, tools, note);
}

function render() {
  const set = activeSet(state);
  const pick = $("find-set");
  pick.replaceChildren(
    ...state.sets.map((s) =>
      el("option", {
        value: s.id,
        selected: s.id === set.id,
        text: `${s.name} (${s.items.length})`,
      }),
    ),
  );
  $("find-set-name").textContent = set.name;
  $("find-saved-count").textContent = String(set.items.length);
  $("find-saved-list").replaceChildren(...set.items.map((x, i) => itemRow(x, i, set.items.length)));
  $("find-saved-empty").hidden = set.items.length > 0;
  $("find-saved-actions").hidden = set.items.length === 0;
  $("find-set-rename-input").value = set.name;
  $("find-print-date").textContent = new Date().toLocaleDateString();
  renderRecent();
  syncSaveButtons();
}

function renderRecent() {
  const list = store ? loadRecent(store) : [];
  $("find-recent").hidden = list.length === 0;
  $("find-recent-count").textContent = String(list.length);
  $("find-recent-list").replaceChildren(
    ...list.map((x) =>
      el(
        "li",
        {},
        el("a", { href: x.p, "data-doc": x.p, text: x.t }),
        el("span", { class: "find-saved-kind", text: kindLabel(x.k) }),
      ),
    ),
  );
}

/* ---------- shared collections ----------------------------------------------------------------------------------- */
function showShared(index) {
  const m = location.hash.match(/^#share=([\w-]+)$/);
  const box = $("find-shared");
  if (!m) {
    box.hidden = true;
    return;
  }
  const shared = decodeShare(m[1], index);
  box.hidden = false;
  if (!shared || !shared.items.length) {
    box.replaceChildren(
      el("h2", { id: "find-shared-title", text: "This shared link did not open" }),
      el("p", { text: "It may have been cut off when it was copied. Ask for the link again." }),
    );
    return;
  }
  const save = el("button", {
    type: "button",
    class: "find-go",
    text: "Save a copy on this device",
  });
  save.addEventListener("click", () => {
    saveAsCollection(shared.name, shared.items);
    history.replaceState(null, "", location.pathname + location.search);
    box.hidden = true;
  });
  box.replaceChildren(
    el("h2", { id: "find-shared-title", text: `Shared with you: ${shared.name}` }),
    el("p", {
      text: `${shared.items.length} resource${shared.items.length === 1 ? "" : "s"}. Open any of them here, or save a copy to change it.${shared.dropped ? ` ${shared.dropped} link${shared.dropped === 1 ? " is" : "s are"} no longer in the course and ${shared.dropped === 1 ? "was" : "were"} left out.` : ""}`,
    }),
    el(
      "ol",
      { class: "find-shared-list" },
      shared.items.map((x) =>
        el(
          "li",
          {},
          el("a", { href: x.p, "data-doc": x.p, text: x.t }),
          el("span", {
            class: "find-saved-kind",
            text: x.k === "language" ? "The Language Page" : kindLabel(x.k),
          }),
          x.n ? el("p", { class: "find-saved-note-text", text: x.n }) : null,
        ),
      ),
    ),
    save,
  );
}

/* ---------- wiring ----------------------------------------------------------------------------------------------- */
export function initCollections(index) {
  byPath = new Map(index.docs.map((d) => [d.p, d]));
  $("find-set").addEventListener("change", (e) =>
    commit(
      selectSet(state, e.target.value),
      `Showing ${activeSet(selectSet(state, e.target.value)).name}.`,
    ),
  );
  $("find-set-new").addEventListener("click", () => {
    commit(
      addSet(state, `Collection ${state.sets.length + 1}`),
      "New collection made. Rename it under Manage.",
    );
    const manage = $("find-set-manage");
    manage.open = true;
    $("find-set-rename-input").select();
  });
  $("find-set-rename").addEventListener("submit", (e) => {
    e.preventDefault();
    commit(renameSet(state, $("find-set-rename-input").value), "Collection renamed.");
  });
  $("find-set-clear").addEventListener("click", () =>
    commit(clearSet(state), `${activeSet(state).name} is empty.`),
  );
  $("find-set-delete").addEventListener("click", () => {
    const name = activeSet(state).name;
    commit(deleteSet(state), `Deleted “${name}”.`);
  });
  $("find-print").addEventListener("click", () => printOnly("set"));
  $("find-copy").addEventListener("click", async () => {
    const set = activeSet(state);
    const text = [
      set.name,
      ...set.items.map(
        (x) => `${x.t}${x.n ? ` (${x.n})` : ""}\n${new URL(x.p, location.origin).href}`,
      ),
    ].join("\n\n");
    say(
      (await copy(text))
        ? "Links copied. Paste them into an email, a doc or your LMS."
        : "Copying is blocked in this browser. Use Print instead.",
    );
  });
  $("find-share").addEventListener("click", async () => {
    const url = `${location.origin}/curriculum/find/#share=${encodeShare(activeSet(state))}`;
    say(
      (await copy(url))
        ? "Share link copied. It carries only the titles' links and your notes, nothing about a student."
        : `Copying is blocked. Select and copy this link: ${url}`,
    );
  });
  $("find-forget").addEventListener("click", () => {
    if (store) clearAll(store);
    state = loadSets(null);
    render();
    say(
      "Everything Find kept on this device is gone: collections, notes, recently opened and practice-path marks.",
    );
    document.dispatchEvent(new CustomEvent("find:forgot"));
  });
  // Recently opened: any resource link on the page, recorded when it is followed.
  document.querySelector(".find-wrap").addEventListener("click", (e) => {
    const a = e.target.closest("a[data-doc]");
    if (!a || !store) return;
    const doc = byPath.get(a.dataset.doc);
    if (doc) pushRecent(store, doc);
  });
  addEventListener("hashchange", () => showShared(index));
  render();
  showShared(index);
}
