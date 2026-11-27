// Vocabulary Card Builder: Frayer-model or word cards from a pasted list or a Content + Language unit. Print 4 a page.
import { $, escapeHtml, loadDraft, parseTable, printOnly, saveDraft } from "../lib.js";

const form = $("[data-vc-form]");
const out = $("[data-vc-out]");
const unitSelect = $("#vc-from");
let units = [];
let unitCognates = new Map(); // term -> true/false from an authored unit (more reliable than the spelling check)

const plain = (s) =>
  String(s || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z]/g, "");
/** Spelling check for a likely cognate: same first four letters, or one is mostly inside the other. A hint only. */
function looksCognate(en, es) {
  const a = plain(en);
  const b = plain(es);
  if (a.length < 4 || b.length < 4) return false;
  return a.slice(0, 4) === b.slice(0, 4) || (a.length >= 5 && b.includes(a.slice(0, Math.max(5, a.length - 2))));
}

function rows() {
  return parseTable(form.elements.rows.value)
    .map(([word, meaning = "", es = "", example = "", tier = ""]) => ({ word, meaning, es, example, tier: /3/.test(tier) ? 3 : /2/.test(tier) ? 2 : "" }))
    .filter((r) => r.word)
    .slice(0, 40);
}
function cognateNote(r) {
  if (!form.elements.cognates.checked || !r.es) return "";
  const known = unitCognates.get(r.word.toLowerCase());
  if (known === true) return '<span class="chip teal">Cognate</span>';
  if (known === false) return "";
  return looksCognate(r.word, r.es) ? '<span class="chip teal" title="Spelling looks alike. Check the meaning matches.">Possible cognate</span>' : "";
}
function render() {
  const layout = form.elements.layout.value;
  const list = rows();
  saveDraft("vocabulary-cards", { layout, rows: form.elements.rows.value }, { quiet: true });
  if (!list.length) {
    out.innerHTML = '<div class="empty"><p>Add a word to see a card.</p></div>';
    return;
  }
  const card = (r) =>
    layout === "frayer"
      ? `<article class="panel vc-card"><div class="vc-word"><h3>${escapeHtml(r.word)}</h3><p class="btn-row">${r.tier ? `<span class="chip">Tier ${r.tier}</span>` : ""}${r.es ? `<span class="chip" lang="es">${escapeHtml(r.es)}</span>` : ""}${cognateNote(r)}</p></div>
        <div class="vc-frayer"><div><p class="label">Definition</p><p>${escapeHtml(r.meaning)}</p></div><div><p class="label">Picture</p><div class="vc-draw"></div></div><div><p class="label">Example</p><p>${escapeHtml(r.example) || "&nbsp;"}</p></div><div><p class="label">Non-example</p><div class="vc-draw small"></div></div></div></article>`
      : `<article class="panel vc-card"><div class="vc-word"><h3>${escapeHtml(r.word)}</h3><p class="btn-row">${r.tier ? `<span class="chip">Tier ${r.tier}</span>` : ""}${r.es ? `<span class="chip" lang="es">${escapeHtml(r.es)}</span>` : ""}${cognateNote(r)}</p></div>
        <p class="label">Picture</p><div class="vc-draw"></div><p><strong>It means:</strong> ${escapeHtml(r.meaning)}</p><p><strong>My sentence:</strong> ____________________________</p></article>`;
  out.innerHTML = `<div class="vc-sheet" id="vc-sheet"><div class="print-only print-header"><span>Vocabulary cards</span><span>Name: ________________</span></div><div class="vc-grid">${list.map(card).join("")}</div></div>`;
}
async function loadUnits() {
  try {
    units = await (await fetch("/lp/assets/units.json")).json();
  } catch {
    units = [];
  }
  for (const u of units) {
    const o = document.createElement("option");
    o.value = u.id;
    o.textContent = u.title;
    unitSelect.append(o);
  }
}
async function useUnit(id) {
  const u = units.find((x) => x.id === id);
  if (!u) return;
  // The unit page knows tier and cognate; units.json carries term, definition and Spanish.
  form.elements.rows.value = u.vocabulary.map((v) => [v.term, v.definition, v.es, "", ""].map((c) => (/[,"]/.test(c) ? `"${String(c).replace(/"/g, '""')}"` : c)).join(", ")).join("\n");
  unitCognates = new Map(u.vocabulary.filter((v) => "cognate" in v).map((v) => [v.term.toLowerCase(), v.cognate]));
  unitSelect.value = id;
  render();
}
unitSelect.addEventListener("change", () => useUnit(unitSelect.value));
form.addEventListener("input", () => {
  if (document.activeElement === form.elements.rows) unitCognates = new Map();
  render();
});
form.addEventListener("change", render);
$("[data-vc-print]").addEventListener("click", () => printOnly($("#vc-sheet")));
(async () => {
  await loadUnits();
  const from = new URLSearchParams(location.search).get("from");
  const draft = loadDraft("vocabulary-cards");
  if (from) await useUnit(from);
  else if (draft) {
    form.elements.layout.value = draft.layout;
    form.elements.rows.value = draft.rows;
  }
  render();
})();
