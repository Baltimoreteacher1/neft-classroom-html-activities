// Family Connections — inline Edit mode.
// Lets Mr. Neft rewrite the page's static wording in place. Edits are keyed by
// language (English / Español) and saved on this device, so they survive the
// language toggle and page reloads. "Export for publishing" hands the edits
// back so they can be committed to source and made live for every family.

import { countCopyEdits, readCopyEdits, writeCopyEdits } from "./shared/copy-overrides.js";

const nodes = Array.from(document.querySelectorAll("[data-i18n]"));
const byKey = new Map(nodes.map((node) => [node.dataset.i18n, node]));
const toggle = document.getElementById("edit-toggle");

let edits = readCopyEdits();
let editing = false;
let bar = null;

if (toggle && nodes.length) {
  toggle.addEventListener("click", () => setEditing(!editing));
  updateToggle();
}

function currentLang() {
  return document.documentElement.lang === "es" ? "es" : "en";
}

function setEditing(next) {
  editing = next;
  document.body.classList.toggle("is-editing", editing);
  for (const node of nodes) {
    if (editing) {
      node.setAttribute("contenteditable", "true");
      node.setAttribute("spellcheck", "true");
      node.addEventListener("input", handleInput);
      node.addEventListener("paste", handlePaste);
      node.addEventListener("keydown", handleKeydown);
      node.addEventListener("click", preventNavigation);
    } else {
      node.removeAttribute("contenteditable");
      node.removeEventListener("input", handleInput);
      node.removeEventListener("paste", handlePaste);
      node.removeEventListener("keydown", handleKeydown);
      node.removeEventListener("click", preventNavigation);
    }
  }
  updateToggle();
  editing ? openBar() : closeBar();
}

function updateToggle() {
  const count = countCopyEdits(edits);
  toggle.setAttribute("aria-pressed", String(editing));
  toggle.classList.toggle("edit-active", editing);
  toggle.innerHTML = editing
    ? '<span aria-hidden="true">✓</span> Done'
    : `<span aria-hidden="true">✎</span> Edit${count ? ` <span class="edit-badge">${count}</span>` : ""}`;
}

function handleInput(event) {
  const node = event.currentTarget;
  const key = node.dataset.i18n;
  const lang = currentLang();
  const value = clean(node.textContent);
  const lane = edits[lang];
  // In English the pristine text is cached on the node, so we can drop a
  // redundant override; other lanes simply store whatever is shown.
  if (lang === "en" && value === clean(node.dataset.en ?? "")) {
    delete lane[key];
  } else if (value) {
    lane[key] = value;
  } else {
    delete lane[key];
  }
  writeCopyEdits(edits);
  renderBarStatus();
  updateToggle();
}

function handlePaste(event) {
  event.preventDefault();
  const text = (event.clipboardData || window.clipboardData)?.getData("text/plain") || "";
  document.execCommand("insertText", false, text.replace(/\s+/g, " "));
}

function handleKeydown(event) {
  if (event.key === "Enter") {
    event.preventDefault();
    event.currentTarget.blur();
  }
  if (event.key === "Escape") setEditing(false);
}

function preventNavigation(event) {
  // Keep clicks on editable links/labels from navigating while editing.
  event.preventDefault();
}

function openBar() {
  if (bar) return;
  bar = document.createElement("div");
  bar.className = "edit-bar";
  bar.setAttribute("role", "region");
  bar.setAttribute("aria-label", "Edit mode controls");
  bar.innerHTML = `
    <div class="edit-bar-text">
      <strong>Edit mode</strong>
      <span data-edit-status></span>
    </div>
    <div class="edit-bar-actions">
      <button type="button" class="edit-btn ghost" data-edit-reset>Reset all</button>
      <button type="button" class="edit-btn" data-edit-export>Export for publishing</button>
      <button type="button" class="edit-btn solid" data-edit-done>Done</button>
    </div>`;
  document.body.appendChild(bar);
  bar.querySelector("[data-edit-reset]").addEventListener("click", resetAll);
  bar.querySelector("[data-edit-export]").addEventListener("click", exportEdits);
  bar.querySelector("[data-edit-done]").addEventListener("click", () => setEditing(false));
  renderBarStatus();
  requestAnimationFrame(() => bar.classList.add("is-open"));
}

function closeBar() {
  if (!bar) return;
  const closing = bar;
  bar = null;
  closing.classList.remove("is-open");
  setTimeout(() => closing.isConnected && closing.remove(), 400);
}

function renderBarStatus() {
  const status = bar?.querySelector("[data-edit-status]");
  if (!status) return;
  const count = countCopyEdits(edits);
  const lang = currentLang() === "es" ? "Español" : "English";
  status.textContent = count
    ? `${count} edit${count === 1 ? "" : "s"} saved on this device · editing ${lang}. Export to publish for everyone.`
    : `Editing ${lang}. Click any heading or paragraph to rewrite it.`;
}

function resetAll() {
  if (!countCopyEdits(edits)) {
    setEditing(false);
    return;
  }
  if (
    !window.confirm("Restore all original wording on this page? Your device edits will be removed.")
  )
    return;
  edits = { en: {}, es: {} };
  writeCopyEdits(edits);
  window.dispatchEvent(new Event("fc:apply-copy"));
  renderBarStatus();
  updateToggle();
  showStatus("Original wording restored.");
}

function exportEdits() {
  if (!countCopyEdits(edits)) {
    showStatus("No edits yet. Rewrite some text first, then export.");
    return;
  }
  const payload = {
    page: "curriculum/family-connections",
    savedAt: new Date().toISOString(),
    edits,
  };
  const json = JSON.stringify(payload, null, 2);
  try {
    const url = URL.createObjectURL(new Blob([json], { type: "application/json" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "family-connections-edits.json";
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  } catch (error) {
    console.warn("Edit export download failed.", error);
  }
  navigator.clipboard?.writeText(json).then(
    () => showStatus("Edits downloaded and copied. Send the file to publish them for everyone."),
    () => showStatus("Edits downloaded. Attach the file to publish them for everyone."),
  );
}

function clean(value) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim();
}

function showStatus(message) {
  const live = document.getElementById("family-status");
  if (live) live.textContent = message;
  const status = bar?.querySelector("[data-edit-status]");
  if (status) {
    status.textContent = message;
    clearTimeout(showStatus.timer);
    showStatus.timer = setTimeout(renderBarStatus, 4000);
  }
}
