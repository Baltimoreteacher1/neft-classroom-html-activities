// Teacher Hub: review queue for speaking and writing practice from THIS device. A teacher listens to (or reads) the response,
// rates each rubric dimension, and writes a short note. Reviews are saved on this device and optionally shared with the student
// on the same device. They are practice feedback against a classroom rubric, not WIDA scores or levels.
import { h } from "/access-practice-lab/src/acc/engine/dom.js";
import { I18nEngine } from "/access-practice-lab/src/acc/i18n/I18nEngine.js";
import { reviewQueue } from "/access-practice-lab/src/acc/analytics/evidence.js";
import { openStorage } from "/access-practice-lab/src/acc/storage/access-db.js";
import { makeReview, MAX_NOTE, reviewedKeySet, rubricFor, REVIEW_PREFIX, reviewKey, storageKey, validateReview } from "/access-practice-lab/src/acc/review/review.js";

const getJson = async (p) => (await fetch(p)).json();

export async function mountReviewPanel(root, doc = document) {
  const store = await openStorage();
  const state = { rows: [], reviewed: new Set(), open: null, sets: new Map(), rubrics: new Map(), showDone: false };
  let audioUrl = null;

  async function load() {
    state.rows = await store.progress.list();
    state.reviewed = reviewedKeySet(await listSettings());
  }
  const listSettings = async () => (await store._all("settings")) || [];
  const rubric = async (id) => state.rubrics.get(id) || (state.rubrics.set(id, await getJson(`/access-practice-lab/content/rubrics/${id}.json`)), state.rubrics.get(id));
  const itemFor = async (row) => {
    if (!state.sets.has(row.setId)) {
      const path = row.setId.startsWith("starter-") ? `/access-practice-lab/content/assess/${row.setId}.json` : `/access-practice-lab/content/bank/${row.setId}.json`;
      state.sets.set(row.setId, await getJson(path).catch(() => null));
    }
    const set = state.sets.get(row.setId);
    return { set, item: set?.items.find((i) => i.id === row.itemId) };
  };
  const prompt = (set, item) => {
    const stim = set?.stimuli?.find((s) => s.id === item?.stimulus);
    return [stim?.title, ...(stim?.paragraphs || []), item?.stem].filter(Boolean);
  };

  async function detail(row) {
    const { set, item } = await itemFor(row);
    const rb = await rubric(rubricFor(item || { type: row.type }));
    const saved = await store.settings.get(storageKey(row), null);
    const ratings = { ...(saved?.ratings || {}) };
    const session = await store.sessions.get(`${row.setId}:${row.mode}`);
    const response = (session?.data?.session?.responses ?? session?.data?.responses)?.[row.itemId];
    let evidence;
    if (row.type === "speaking-response") {
      const recs = (await store.recordings.list()).filter((r) => r.itemId === row.itemId && (!r.sessionId || r.sessionId === (response?.sessionId || r.sessionId)));
      const rec = recs.find((r) => r.id === response?.recordingId) || recs.sort((a, b) => b.createdAt - a.createdAt)[0];
      const audio = h(doc, "audio", { controls: "", class: "acc-audio", "aria-label": "Student recording" });
      if (rec) {
        const full = await store.recordings.get(rec.id);
        if (audioUrl) URL.revokeObjectURL(audioUrl);
        if (full?.blob) { audioUrl = URL.createObjectURL(full.blob); audio.src = audioUrl; }
      }
      evidence = h(doc, "div", { class: "acc-review-evidence" }, rec ? audio : h(doc, "p", { class: "acc-state is-empty", text: "The recording for this response is not on this device. It may have been deleted or practiced on another device." }), h(doc, "p", { class: "acc-hint", text: `Not scored here: ${rb.notScored.join(", ")}. ${rb.notScoredNote}` }));
    } else {
      const text = typeof response === "string" ? response : response?.text || "";
      evidence = h(doc, "div", { class: "acc-review-evidence" }, h(doc, "blockquote", { class: "acc-review-text", lang: "en", "data-i18n-skip": "" }, text || "(No text is saved for this response.)"));
    }
    const form = h(doc, "form", { class: "acc-review-form", "aria-label": "Rubric review" });
    for (const d of rb.dimensions) {
      const fs = h(doc, "fieldset", { class: "acc-review-dim", "data-i18n-skip": "" }, h(doc, "legend", { text: d.label }), h(doc, "p", { class: "acc-hint", text: d.look }));
      rb.ratings.forEach((name, i) => {
        const id = `rv-${d.id}-${i}`;
        const input = h(doc, "input", { type: "radio", name: `rv-${d.id}`, id, value: String(i) });
        if (ratings[d.id] === i) input.checked = true;
        input.addEventListener("change", () => (ratings[d.id] = i));
        fs.append(h(doc, "label", { class: "acc-choice", for: id }, input, h(doc, "span", { class: "acc-choice-text" }, h(doc, "strong", { text: name + ". " }), d.descriptors[i])));
      });
      form.append(fs);
    }
    const note = h(doc, "textarea", { id: "rvNote", class: "acc-textarea", rows: "3", maxlength: String(MAX_NOTE) });
    note.value = saved?.note || "";
    const share = h(doc, "input", { type: "checkbox", id: "rvShare" });
    share.checked = Boolean(saved?.shared);
    const status = h(doc, "p", { class: "acc-hint", role: "status" });
    const saveBtn = h(doc, "button", { type: "button", class: "acc-btn primary", "data-act": "save-review", text: saved ? "Update review" : "Save review" });
    saveBtn.addEventListener("click", async () => {
      const review = makeReview({ rubric: rb, ratings, note: note.value, shared: share.checked });
      const v = validateReview(review, rb);
      if (!v.ok) { status.textContent = `Rate every dimension before saving. Still to rate: ${v.missing.map((m) => rb.dimensions.find((d) => d.id === m).label).join(", ")}.`; status.className = "acc-state is-error"; return; }
      await store.settings.set(storageKey(row), review);
      await load();
      draw();
    });
    form.append(h(doc, "label", { class: "acc-field", for: "rvNote" }, h(doc, "span", { text: `Note to the student (optional, up to ${MAX_NOTE} characters)` }), note), h(doc, "label", { class: "acc-choice", for: "rvShare" }, share, h(doc, "span", { text: "Show this feedback to the student on this device" })), status, saveBtn);
    return h(doc, "div", { class: "acc-review-detail" },
      h(doc, "h4", { text: `${row.domain} · ${row.klu} · ${row.context || "Social and Instructional"}` }),
      h(doc, "div", { class: "acc-review-prompt", lang: "en", "data-i18n-skip": "" }, ...prompt(set, item).map((t) => h(doc, "p", { text: t }))),
      evidence,
      h(doc, "p", { class: "acc-hint", text: "This is practice feedback against a classroom rubric. It does not produce a WIDA or ACCESS score or level." }),
      form);
  }

  async function draw() {
    const pending = reviewQueue(state.rows, state.reviewed);
    const done = state.rows.filter((r) => r.status === "needs-review" && state.reviewed.has(reviewKey(r)));
    const list = state.showDone ? done : pending;
    const toggle = h(doc, "button", { type: "button", class: "acc-btn", "data-act": "toggle-done", text: state.showDone ? `Show waiting (${pending.length})` : `Show reviewed (${done.length})` });
    toggle.addEventListener("click", () => ((state.showDone = !state.showDone), (state.open = null), draw()));
    const rowsUi = list.map((r) => {
      const key = reviewKey(r);
      const b = h(doc, "button", { type: "button", class: "acc-btn", "data-act": "open-review", "aria-pressed": String(state.open === key), text: `${r.type === "speaking-response" ? "Speaking" : "Writing"} · ${r.setId} · ${new Date(r.t).toLocaleDateString()}` });
      b.addEventListener("click", () => ((state.open = key), draw()));
      return h(doc, "li", {}, b);
    });
    const openRow = list.find((r) => reviewKey(r) === state.open);
    root.replaceChildren(
      h(doc, "div", { class: "acc-state is-info", role: "note" }, h(doc, "p", { text: "Speaking and writing responses are never scored by the lab. They wait here for you. Reviews and recordings stay on this device." })),
      h(doc, "div", { class: "acc-actions no-print" }, toggle),
      list.length ? h(doc, "ul", { class: "acc-review-list" }, ...rowsUi) : h(doc, "div", { class: "acc-state is-empty" }, h(doc, "p", { text: state.showDone ? "No reviewed responses yet." : "Nothing is waiting for review." })),
      openRow ? await detail(openRow) : h(doc, "span"));
  }

  await load();
  await draw();
  new I18nEngine({ root: root.closest("section") || root }).start();
  return { reload: async () => (await load(), draw()) };
}
export { REVIEW_PREFIX };
