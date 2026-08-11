/* plan-notes.js — the Plan Notes surface.
 *
 * Two views: a library of plans, and the annotator. No inline handlers anywhere
 * (the generated validator resolves every on* attribute, and the cheapest way
 * to pass that forever is to never write one).
 *
 * The load-bearing idea: a note is pinned to a QUOTE, not to a scroll position.
 * Documents get re-exported and reflowed; quotes survive that and offsets do
 * not. When a quote no longer matches, the note is shown in an unpinned tray —
 * never dropped. A tool that silently loses a teacher's notes gets abandoned.
 */

import { extractFile, extractPastedText, suggestLesson, bytesToBase64 } from "./plan-extract.js";
import { relocateAll, renderPlan, renderRail, renderSummary } from "./plan-render.js";
import * as store from "./plan-store.js";

const root = document.querySelector(".plan-notes-wrap");
const $ = (role) => root.querySelector(`[data-role="${role}"]`);
const views = {};
for (const el of root.querySelectorAll(".pn-view")) views[el.dataset.view] = el;

const editor = document.querySelector('[data-role="editor"]');
const $e = (role) => editor.querySelector(`[data-role="${role}"]`);

/** Everything the current annotator session needs. */
const state = {
  vocab: null,
  docs: [],
  plan: null, // { anchorKey, title, sub, pages, text, lessonId }
  notes: [],
  editing: null, // note being edited, or a draft { anchorRef }
};

function showView(name) {
  for (const [key, el] of Object.entries(views)) el.hidden = key !== name;
}

function setStatus(role, message, tone = "info") {
  const el = $(role);
  if (!el) return;
  el.hidden = !message;
  el.textContent = message || "";
  el.dataset.tone = tone;
}

/* ── Gate ──────────────────────────────────────────────────────────────────── */

async function tryUnlock() {
  try {
    const h = await store.health();
    state.vocab = await store.vocab();
    await refreshLibrary();
    showView("library");
    if (!h.db) {
      setStatus(
        "library-status",
        "The database is not bound on this deployment — notes cannot be saved.",
        "warn",
      );
    } else if (h.ai === "none") {
      setStatus(
        "library-status",
        "Auto-annotation is not configured. Hand annotation works.",
        "warn",
      );
    }
    return true;
  } catch (err) {
    return err;
  }
}

async function boot() {
  if (!store.getKey()) {
    showView("gate");
    return;
  }
  const result = await tryUnlock();
  if (result !== true) {
    showView("gate");
    const el = $("gate-error");
    el.hidden = false;
    el.textContent =
      result?.status === 401
        ? "That key was not accepted."
        : result?.message || "Could not reach Plan Notes.";
  }
}

$("gate-form").addEventListener("submit", async (ev) => {
  ev.preventDefault();
  store.setKey($("key-input").value);
  const result = await tryUnlock();
  if (result !== true) {
    const el = $("gate-error");
    el.hidden = false;
    el.textContent = result?.status === 401 ? "That key was not accepted." : result?.message;
  }
});

/* ── Library ───────────────────────────────────────────────────────────────── */

async function refreshLibrary() {
  const data = await store.listDocs();
  state.docs = data.docs || [];
  renderDocList();
}

function renderDocList() {
  const list = $("doclist");
  list.textContent = "";
  $("doclist-empty").hidden = state.docs.length > 0;

  for (const doc of state.docs) {
    const li = document.createElement("li");
    li.className = "pn-doc";

    const open = document.createElement("button");
    open.type = "button";
    open.className = "pn-doc-open";
    open.textContent = doc.filename;
    open.addEventListener("click", () => openStoredDoc(doc));

    const meta = document.createElement("span");
    meta.className = "pn-doc-meta";
    meta.textContent = doc.lesson_id ? `Lesson ${doc.lesson_id}` : "Not linked to a lesson";
    if (!doc.lesson_id) meta.classList.add("pn-warn");

    const del = document.createElement("button");
    del.type = "button";
    del.className = "pn-btn small danger";
    del.textContent = "Remove";
    del.addEventListener("click", async () => {
      if (!window.confirm(`Remove "${doc.filename}"? Your notes on it are kept.`)) return;
      await store.deleteDoc(doc.sha256);
      await refreshLibrary();
    });

    li.append(open, meta, del);
    list.appendChild(li);
  }
}

/* A stored doc has its text re-extracted from the stored bytes on open. The
 * alternative — caching extracted text server-side — means a second copy that
 * can disagree with the document, and the extraction is fast enough not to. */
async function openStoredDoc(doc) {
  setStatus("library-status", `Opening ${doc.filename}…`);
  try {
    const key = store.getKey();
    const res = await fetch(`/api/plan-notes/blob/${doc.sha256}`, {
      headers: { "x-teacher-key": key },
    });
    if (!res.ok) throw new Error("That plan's file is no longer stored. Re-upload it.");
    const blob = await res.blob();
    const file = new File([blob], doc.filename, { type: doc.mime });
    const extracted = await extractFile(file);
    await openPlan(extracted, doc.lesson_id || "");
    setStatus("library-status", "");
  } catch (err) {
    setStatus("library-status", err.message, "error");
  }
}

async function ingest(extracted) {
  const suggestion = suggestLesson(extracted, state.vocab.lessons);
  let lessonId = "";
  if (suggestion) {
    // Suggested, never applied. A wrong auto-link routes notes to the wrong
    // lesson and quietly poisons everything downstream that reads them.
    const ok = window.confirm(
      `"${extracted.filename}" looks like lesson ${suggestion.lessonId} — ${suggestion.title}.\n\n` +
        `Link it? (${suggestion.confidence} confidence)\n\nCancel leaves it unlinked.`,
    );
    if (ok) lessonId = suggestion.lessonId;
  }

  await store.registerDoc({
    sha256: extracted.sha256,
    filename: extracted.filename,
    mime: extracted.mime,
    pageCount: extracted.pageCount,
    bytes: extracted.bytes,
    lessonId,
  });
  try {
    await store.uploadBlob(extracted.sha256, bytesToBase64(extracted.buffer), extracted.mime);
  } catch (err) {
    // The document is registered and annotatable this session either way; only
    // reopening it later needs the stored bytes. Say so rather than failing.
    setStatus(
      "library-status",
      `${extracted.filename}: annotations will save, but the file itself could not be stored (${err.message}).`,
      "warn",
    );
  }
  await refreshLibrary();
  return lessonId;
}

async function handleFiles(files) {
  for (const file of files) {
    try {
      setStatus("library-status", `Reading ${file.name}…`);
      const extracted = await extractFile(file, (p, total) =>
        setStatus("library-status", `Reading ${file.name} — page ${p} of ${total}…`),
      );
      const lessonId = await ingest(extracted);
      setStatus("library-status", `${file.name} added.`, "ok");
      if (files.length === 1) await openPlan(extracted, lessonId);
    } catch (err) {
      setStatus("library-status", err.message, "error");
    }
  }
}

const drop = $("drop");
const fileInput = $("file-input");
drop.addEventListener("click", () => fileInput.click());
drop.addEventListener("keydown", (ev) => {
  if (ev.key === "Enter" || ev.key === " ") {
    ev.preventDefault();
    fileInput.click();
  }
});
drop.addEventListener("dragover", (ev) => {
  ev.preventDefault();
  drop.classList.add("is-over");
});
drop.addEventListener("dragleave", () => drop.classList.remove("is-over"));
drop.addEventListener("drop", (ev) => {
  ev.preventDefault();
  drop.classList.remove("is-over");
  handleFiles([...ev.dataTransfer.files]);
});
fileInput.addEventListener("change", () => handleFiles([...fileInput.files]));

$("paste-go").addEventListener("click", async () => {
  const text = $("paste-text").value;
  const label = $("paste-label").value.trim();
  try {
    const extracted = await extractPastedText(text, label);
    const lessonId = await ingest(extracted);
    $("paste-text").value = "";
    $("paste-label").value = "";
    await openPlan(extracted, lessonId);
  } catch (err) {
    setStatus("library-status", err.message, "error");
  }
});

/* ── Annotator ─────────────────────────────────────────────────────────────── */

async function openPlan(extracted, lessonId) {
  // A doc linked to a lesson shares that lesson's rail: annotate the PDF today
  // and the repo lesson tomorrow, and it is one set of notes either way.
  const anchorKey = lessonId ? `lesson:${lessonId}` : `doc:${extracted.sha256}`;
  state.plan = {
    anchorKey,
    lessonId,
    title: extracted.filename,
    sub: lessonId ? `Lesson ${lessonId}` : "Not linked to a lesson",
    pages: extracted.pages,
    text: extracted.text,
  };
  $("plan-title").textContent = state.plan.title;
  $("plan-sub").textContent = state.plan.sub;
  showView("annotate");
  setStatus("annotate-status", "");
  await loadAndPaint();
}

async function loadAndPaint() {
  const { notes, online } = await store.loadNotes(state.plan.anchorKey);
  state.notes = notes;
  paint();
  const pending = store.pendingCount();
  $("sync").textContent = online
    ? pending
      ? `${pending} note${pending === 1 ? "" : "s"} still syncing`
      : "Saved"
    : "Offline — notes are held on this device";
  $("sync").dataset.tone = online ? (pending ? "warn" : "ok") : "warn";
}

function paint() {
  const resolved = relocateAll(state.notes, state.plan.pages);
  renderPlan($("plan"), state.plan.pages, resolved, onMarkClick);
  renderRail($("notes"), resolved, state.vocab, openEditor);
  renderSummary($("summary"), resolved, state.vocab);
  $("notes-empty").hidden = state.notes.length > 0;

  const unpinned = resolved.filter((r) => r.status === "unpinned");
  const tray = $("unpinned");
  tray.hidden = unpinned.length === 0;
  if (unpinned.length) {
    tray.textContent = `${unpinned.length} note${unpinned.length === 1 ? "" : "s"} no longer match this document's text — they are listed below, still yours.`;
  }
}

function onMarkClick(noteId) {
  const note = state.notes.find((n) => n.id === noteId);
  if (note) openEditor(note);
}

/* Selecting text in the plan is how a note gets its anchor. */
$("plan").addEventListener("mouseup", () => {
  const sel = window.getSelection();
  const text = sel?.toString().trim();
  if (!text || text.length < 4) return;
  const node = sel.anchorNode?.parentElement?.closest("[data-page]");
  openEditor({
    anchorRef: {
      quote: text.slice(0, 300),
      page: node ? Number(node.dataset.page) : null,
    },
  });
});

$("add-note").addEventListener("click", () => openEditor({ anchorRef: { quote: "", page: null } }));
$("back-to-library").addEventListener("click", async () => {
  showView("library");
  await refreshLibrary();
});

$("auto-annotate").addEventListener("click", async () => {
  const btn = $("auto-annotate");
  btn.disabled = true;
  setStatus("annotate-status", "Reading the plan and drafting notes…");
  try {
    const data = await store.annotate({
      anchorKey: state.plan.anchorKey,
      lessonId: state.plan.lessonId || "",
      text: state.plan.text,
    });
    if (!data.notes.length) {
      setStatus(
        "annotate-status",
        "The annotator did not find anything it could pin to this plan. Annotate by hand.",
        "warn",
      );
    } else {
      await store.createNotes(
        state.plan.anchorKey,
        data.notes.map((n) => ({ ...n, origin: "ai" })),
      );
      await loadAndPaint();
      const dropped = data.rejected
        ? ` ${data.rejected} draft${data.rejected === 1 ? "" : "s"} were discarded for not matching the plan or the tag list.`
        : "";
      setStatus(
        "annotate-status",
        `Drafted ${data.notes.length} note${data.notes.length === 1 ? "" : "s"} — review and edit them.${dropped}`,
        "ok",
      );
    }
  } catch (err) {
    setStatus("annotate-status", err.message, "error");
  } finally {
    btn.disabled = false;
  }
});

/* ── Editor ────────────────────────────────────────────────────────────────── */

const FIELDS_BY_KIND = {
  "watch-for": ["body", "misconceptionTags"],
  swap: ["body", "bodyAlt", "level"],
  timing: ["timingMin", "body"],
  resource: ["activityRefs", "body"],
  note: ["body"],
};

const BODY_LABEL = {
  "watch-for": "What goes wrong here",
  swap: "What the plan says",
  timing: "Why (optional)",
  resource: "Why here (optional)",
  note: "Note",
};

function syncEditorFields() {
  const kind = $e("f-kind").value;
  const shown = new Set(FIELDS_BY_KIND[kind] || ["body"]);
  for (const el of editor.querySelectorAll("[data-field]")) {
    el.hidden = !shown.has(el.dataset.field);
  }
  $e("body-label").textContent = BODY_LABEL[kind] || "Note";
}

function fillTagPicker(selected) {
  const box = $e("f-tags");
  box.textContent = "";
  for (const [id, m] of Object.entries(state.vocab.misconceptions)) {
    const label = document.createElement("label");
    label.className = "pn-tagopt";
    const cb = document.createElement("input");
    cb.type = "checkbox";
    cb.value = id;
    cb.checked = selected.includes(id);
    const span = document.createElement("span");
    span.textContent = m.label;
    span.title = m.watchFor || "";
    label.append(cb, span);
    box.appendChild(label);
  }
}

function fillActivityPicker(selected) {
  const sel = $e("f-activity");
  sel.textContent = "";
  const none = document.createElement("option");
  none.value = "";
  none.textContent = "— pick an activity —";
  sel.appendChild(none);
  // Scoped to the linked lesson's unit when there is one: 171 activities in one
  // dropdown is a list nobody reads.
  const lesson = state.vocab.lessons.find((l) => l.id === state.plan.lessonId);
  const pool = lesson
    ? state.vocab.activities.filter((a) => a.unit === lesson.unit || a.unit == null)
    : state.vocab.activities;
  for (const a of pool) {
    const opt = document.createElement("option");
    opt.value = a.path;
    opt.textContent = `${a.title} — ${a.category}`;
    opt.selected = selected.includes(a.path);
    sel.appendChild(opt);
  }
}

function openEditor(note) {
  state.editing = note;
  const isExisting = Boolean(note.id);
  $e("editor-title").textContent = isExisting ? "Edit note" : "New note";
  $e("editor-delete").hidden = !isExisting;
  $e("editor-error").hidden = true;

  const quote = note.anchorRef?.quote || "";
  $e("editor-quote").hidden = !quote;
  $e("editor-quote").textContent = quote ? `“${quote}”` : "";

  $e("f-kind").value = note.kind || "watch-for";
  $e("f-body").value = note.body || "";
  $e("f-body-alt").value = note.bodyAlt || "";
  $e("f-level").value = note.level == null ? "1" : String(note.level);
  $e("f-timing").value = note.timingMin ?? "";
  fillTagPicker(note.misconceptionTags || []);
  fillActivityPicker(note.activityRefs || []);
  syncEditorFields();
  editor.showModal();
}

$e("f-kind").addEventListener("change", syncEditorFields);
$e("editor-cancel").addEventListener("click", () => editor.close());

$e("editor-delete").addEventListener("click", async () => {
  if (!state.editing?.id) return;
  await store.deleteNote(state.plan.anchorKey, state.editing.id);
  editor.close();
  await loadAndPaint();
});

$e("editor-save").addEventListener("click", async () => {
  const kind = $e("f-kind").value;
  const payload = {
    kind,
    anchorKey: state.plan.anchorKey,
    anchorRef: state.editing.anchorRef || { quote: "", page: null },
    body: $e("f-body").value.trim(),
    bodyAlt: kind === "swap" ? $e("f-body-alt").value.trim() : "",
    level: kind === "swap" ? Number($e("f-level").value) : null,
    timingMin: kind === "timing" ? Number($e("f-timing").value) : null,
    misconceptionTags:
      kind === "watch-for"
        ? [...$e("f-tags").querySelectorAll("input:checked")].map((i) => i.value)
        : [],
    activityRefs: kind === "resource" && $e("f-activity").value ? [$e("f-activity").value] : [],
    standards: [],
  };

  const problem = localCheck(payload);
  if (problem) {
    const el = $e("editor-error");
    el.hidden = false;
    el.textContent = problem;
    return;
  }

  try {
    if (state.editing.id) {
      await store.patchNote(state.plan.anchorKey, state.editing.id, payload);
    } else {
      await store.createNotes(state.plan.anchorKey, [payload]);
    }
    editor.close();
    await loadAndPaint();
  } catch (err) {
    const el = $e("editor-error");
    el.hidden = false;
    el.textContent = err.payload?.errors?.[0]?.errors?.[0] || err.message;
  }
});

/* The same per-kind requirements the server enforces, checked here first so the
 * teacher hears about a missing field immediately instead of after a round trip.
 * The server remains the authority — this is courtesy, not the gate. */
function localCheck(n) {
  if (n.kind === "watch-for" && !n.misconceptionTags.length) return "Pick which mistake this is.";
  if (n.kind === "watch-for" && !n.body) return "Say what goes wrong here.";
  if (n.kind === "swap" && !n.body) return "Say what the plan currently asks for.";
  if (n.kind === "swap" && !n.bodyAlt) return "Say what you do instead.";
  if (n.kind === "timing" && !n.timingMin) return "How many minutes does it really take?";
  if (n.kind === "resource" && !n.activityRefs.length) return "Pick an activity to pin.";
  if (n.kind === "note" && !n.body) return "Write the note.";
  return null;
}

boot();

export { state };
