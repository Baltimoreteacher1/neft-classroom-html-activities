// Teacher Hub: assignment builder. Choose a type and filters, preview the questions, then copy a link or print the list. The link
// opens the practice on a student's device. Nothing is sent to students or to any school system; saved assignments stay on this device.
import { h } from "/access-practice-lab/src/acc/engine/dom.js";
import { I18nEngine } from "/access-practice-lab/src/acc/i18n/I18nEngine.js";
import { assignmentLink, KINDS, selectItems, validateSpec } from "/access-practice-lab/src/acc/adapt/assign.js";
import { openStorage } from "/access-practice-lab/src/acc/storage/access-db.js";

const BASE = "/access-practice-lab";
const DOMAINS = ["Listening", "Reading", "Speaking", "Writing"];
const KLUS = ["Narrate", "Inform", "Explain", "Argue"];
const CONTEXTS = ["Mathematics", "Science", "Social Studies", "Language Arts", "Social and Instructional"];

export async function mountAssignPanel(root, doc = document) {
  const store = await openStorage();
  let index;
  try {
    index = await (await fetch(`${BASE}/content/bank/index.json`)).json();
  } catch {
    root.replaceChildren(h(doc, "p", { class: "acc-state is-error", role: "alert", text: "The item bank could not be loaded." }));
    return;
  }
  const bank = index.sets.flatMap((s) => s.items.map((i) => ({ ...i, setId: s.id, grade: s.grade, domain: s.domain })));
  const fns = [...new Set(bank.flatMap((i) => i.functions || []))].sort();
  const state = { kind: "domain", grade: "3-5", domain: "Reading", context: "Science", klu: "Explain", fn: fns[0] || "", setId: index.sets[0].id, count: 8, includeProductive: false, title: "" };
  let saved = (await store.settings.get("assignments", [])) || [];

  const sel = (id, label, opts, key) => {
    const s = h(doc, "select", { id, class: "acc-select" }, ...opts.map(([v, t]) => h(doc, "option", { value: v, text: t })));
    s.value = state[key];
    s.addEventListener("change", () => ((state[key] = s.value), draw()));
    return h(doc, "label", { class: "acc-field", for: id }, h(doc, "span", { text: label }), s);
  };

  function draw() {
    const need = KINDS[state.kind].needs;
    const fields = [sel("asKind", "Assignment type", Object.entries(KINDS).map(([k, v]) => [k, v.label]), "kind"), sel("asGrade", "Grade band", [["3-5", "Grades 3–5"], ["6-8", "Grades 6–8"]], "grade")];
    if (need.includes("domain")) fields.push(sel("asDomain", "Domain", DOMAINS.map((d) => [d, d]), "domain"));
    if (need.includes("context")) fields.push(sel("asContext", "Academic context", CONTEXTS.map((d) => [d, d]), "context"));
    if (need.includes("klu")) fields.push(sel("asKlu", "Key language use", KLUS.map((d) => [d, d]), "klu"));
    if (need.includes("fn")) fields.push(sel("asFn", "Language function", fns.map((d) => [d, d]), "fn"));
    if (need.includes("setId")) fields.push(sel("asSet", "Practice set", index.sets.filter((s) => s.grade === state.grade).map((s) => [s.id, `${s.domain}: ${s.title}`]), "setId"));
    const count = h(doc, "input", { type: "number", id: "asCount", class: "acc-input", min: "1", max: "24", value: String(state.count) });
    count.addEventListener("change", () => ((state.count = Number(count.value)), draw()));
    const prod = h(doc, "input", { type: "checkbox", id: "asProd" });
    prod.checked = state.includeProductive;
    prod.addEventListener("change", () => ((state.includeProductive = prod.checked), draw()));
    const title = h(doc, "input", { type: "text", id: "asTitle", class: "acc-input", maxlength: "80", value: state.title, placeholder: "Practice assignment" });
    title.addEventListener("change", () => ((state.title = title.value), draw()));
    if (state.kind !== "simulation") fields.push(h(doc, "label", { class: "acc-field", for: "asCount" }, h(doc, "span", { text: "Number of questions" }), count), h(doc, "label", { class: "acc-choice", for: "asProd" }, prod, h(doc, "span", { text: "Include speaking and writing (needs your review)" })));
    fields.push(h(doc, "label", { class: "acc-field", for: "asTitle" }, h(doc, "span", { text: "Title" }), title));
    const spec = { ...state };
    const v = validateSpec(spec);
    const picks = v.ok ? selectItems(bank, spec) : [];
    const link = picks.length || spec.kind === "simulation" ? assignmentLink(location.origin + BASE, spec, picks) : "";
    const byItem = new Map(bank.map((i) => [`${i.setId}:${i.id}`, i]));
    const preview = h(doc, "ol", { class: "acc-assign-list", id: "asPreview" }, ...picks.map((p) => { const i = byItem.get(`${p.setId}:${p.itemId}`); return h(doc, "li", {}, h(doc, "span", { class: "acc-q-meta", text: `${i.domain} · ${i.klu} · ${i.context || "Social and Instructional"} · ${i.band}` }), h(doc, "div", { lang: "en", "data-i18n-skip": "" }, i.stem || p.itemId)); }));
    const status = h(doc, "p", { class: "acc-hint", role: "status", id: "asStatus" });
    const copy = h(doc, "button", { type: "button", class: "acc-btn primary", "data-act": "copy-assign", disabled: !link, text: "Copy student link" });
    copy.addEventListener("click", async () => { try { await navigator.clipboard.writeText(link); status.textContent = "Link copied. Share it however you share class links."; } catch { status.textContent = link; } });
    const save = h(doc, "button", { type: "button", class: "acc-btn", "data-act": "save-assign", disabled: !link, text: "Save on this device" });
    save.addEventListener("click", async () => { saved = [{ id: Date.now().toString(36), title: state.title || "Practice assignment", link, count: picks.length || null, savedAt: Date.now() }, ...saved].slice(0, 30); await store.settings.set("assignments", saved); status.textContent = "Saved on this device."; draw(); });
    const print = h(doc, "button", { type: "button", class: "acc-btn", "data-act": "print-assign", disabled: !picks.length, text: "Print the question list" });
    print.addEventListener("click", () => window.print());
    root.replaceChildren(
      h(doc, "div", { class: "acc-state is-info", role: "note" }, h(doc, "p", { text: "Assignments are links to practice that students open on their own device. Nothing is sent to students or to a school system." })),
      h(doc, "div", { class: "acc-filters" }, ...fields),
      v.ok ? h(doc, "p", { class: "acc-hint", id: "asCountMsg", text: spec.kind === "simulation" ? "The whole set will be taken as a test simulation." : picks.length < spec.count ? `Only ${picks.length} matching ${picks.length === 1 ? "question exists" : "questions exist"} for these choices.` : `${picks.length} questions chosen across the matching sets.` }) : h(doc, "p", { class: "acc-state is-error", role: "alert", text: v.errors.join(" ") }),
      preview,
      h(doc, "div", { class: "acc-actions no-print" }, copy, save, print), status,
      saved.length ? h(doc, "div", {}, h(doc, "h3", { text: "Saved assignments" }), h(doc, "ul", { id: "asSaved" }, ...saved.map((a) => h(doc, "li", {}, h(doc, "a", { href: a.link, text: a.title, "data-i18n-skip": "" }), ` · ${new Date(a.savedAt).toLocaleDateString()}`)))) : h(doc, "span"));
  }
  draw();
  new I18nEngine({ root: root.closest("section") || root }).start();
}
