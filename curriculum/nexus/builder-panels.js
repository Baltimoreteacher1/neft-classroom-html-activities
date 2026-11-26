// nexus/builder-panels.js — the optional "Customize" and "Versions" panels of
// the Mission Builder, as markup builders and a reader that turns the form back
// into a draft resource. Kept apart from builder.js so the default 3-step flow
// stays small; a teacher who never opens Customize never meets any of this.

import { KITS } from "./kits.mjs";
import { esc } from "./render.mjs";
import { questions, transferQuestion } from "./resource.mjs";

const pairInputs = (id, label, p, { area = false, max = 300 } = {}) => {
  const tag = (lang) =>
    area
      ? `<textarea class="nx-input" id="${id}-${lang}" maxlength="${max}" rows="2">${esc(p[lang] || "")}</textarea>`
      : `<input class="nx-input" id="${id}-${lang}" maxlength="${max}" value="${esc(p[lang] || "")}">`;
  return `<div class="nx-two"><div class="nx-field"><label for="${id}-en">${label} (English)</label>${tag("en")}</div><div class="nx-field"><label for="${id}-es">${label} (Español)</label>${tag("es")}</div></div>`;
};

export function customizeHtml(r) {
  const kit = KITS[r.kit];
  const nums = kit.fields
    .map((f) => {
      const val = f.env ? (r.env[f.key] ?? kit.envDefaults?.[f.key]) : r.model[f.key];
      return `<div class="nx-field"><label for="cz-n-${f.key}">${esc(f.label.en)} (${f.min}–${f.max})</label><input class="nx-input" type="number" id="cz-n-${f.key}" min="${f.min}" max="${f.max}" step="1" value="${esc(val)}" data-num="${f.key}" data-env="${f.env ? 1 : ""}"></div>`;
    })
    .join("");
  const dataEdit =
    r.kit === "mean-balance"
      ? `<div class="nx-field"><label for="cz-values">Data values (comma separated, multiples of ${r.model.unit || 1}, 3–6 values)</label><input class="nx-input" id="cz-values" value="${esc(r.model.values.join(", "))}"></div>`
      : "";
  const vocab = r.vocab
    .map(
      (v, i) =>
        `<fieldset class="nx-card" data-vrow="${i}"><legend>Word ${i + 1}</legend>${pairInputs(`cz-vt${i}`, "Word", v.term, { max: 40 })}${pairInputs(`cz-vd${i}`, "Meaning", v.def, { max: 160 })}<button type="button" class="nx-btn" data-vdel="${i}">Remove word ${i + 1}</button></fieldset>`,
    )
    .join("");
  const qs = [...questions(r), transferQuestion(r, "print")].filter(Boolean);
  const wording = qs
    .map((q) => {
      const o = r.overrides[`${q.id}:stem`];
      const gen = q.generatedStem || q.stem;
      return `<div class="nx-card"><p class="nx-note"><b>${q.id.toUpperCase()}</b> generated wording: “${esc(gen.en)}” · answer ${esc(String(Math.round(q.answer * 1e4) / 1e4))} (always computed from the numbers)</p>${pairInputs(`cz-q-${q.id}`, "Your wording (blank = generated)", o ? o.text : { en: "", es: "" }, { area: true })}</div>`;
    })
    .join("");
  return `<details class="nx-more nx-card" id="nx-customize"><summary>Customize (optional)</summary>
    <p class="nx-note">Edits wait here as a draft. Nothing changes until you review and apply them, and every applied change is a version you can restore.</p>
    <h3>Title and goal</h3>${pairInputs("cz-title", "Title", r.title, { max: 80 })}${pairInputs("cz-obj", "What students should accomplish", r.objective, { area: true })}
    <h3>Numbers</h3><p class="nx-note">The model, every question and every answer key are recomputed from these. Numbers the model cannot draw truthfully are refused.</p><div class="nx-two">${nums}</div>${dataEdit}
    <h3>Vocabulary</h3>${vocab}<button type="button" class="nx-btn" data-vadd ${r.vocab.length >= 8 ? "disabled" : ""}>Add a word</button>
    <h3>Question wording</h3>${wording}
    <h3>Teacher notes</h3><p class="nx-note">Only on your answer key. Never in a student link or file.</p>${pairInputs("cz-notes", "Notes", r.notes, { area: true, max: 600 })}
    <div class="nx-row"><button type="button" class="nx-btn primary" data-review>Review changes</button></div>
    <div id="nx-plan" aria-live="polite"></div></details>`;
}

const readPair = (root, id) => ({
  en: root.querySelector(`#${id}-en`)?.value.trim() || "",
  es: root.querySelector(`#${id}-es`)?.value.trim() || "",
});

/** The draft resource the Customize form describes (not yet validated). */
export function readCustomize(root, r) {
  const draft = structuredClone(r);
  delete draft.history;
  draft.title = readPair(root, "cz-title");
  draft.objective = readPair(root, "cz-obj");
  draft.notes = readPair(root, "cz-notes");
  for (const el of root.querySelectorAll("[data-num]")) {
    const n = Number(el.value);
    if (el.dataset.env) draft.env = { ...draft.env, [el.dataset.num]: n };
    else draft.model = { ...draft.model, [el.dataset.num]: n };
  }
  const vals = root.querySelector("#cz-values");
  if (vals) {
    const values = vals.value.split(/[,\s]+/).filter(Boolean).map(Number);
    // Only an actual edit drops the lesson's day labels and story (they describe the old numbers).
    if (values.join() !== r.model.values.join()) draft.model = { ...draft.model, values, labels: undefined, story: undefined };
  }
  draft.vocab = [...root.querySelectorAll("[data-vrow]")].map((f) => {
    const i = f.dataset.vrow;
    return { term: readPair(root, `cz-vt${i}`), def: readPair(root, `cz-vd${i}`) };
  });
  const overrides = {};
  for (const id of ["q1", "q2", "q3", "t1"]) {
    const p = readPair(root, `cz-q-${id}`);
    if (p.en) overrides[`${id}:stem`] = { text: p, base: { en: "", es: "" } };
  }
  draft.overrides = overrides;
  return draft;
}

export function planHtml(plan, errors) {
  if (errors.length) return `<p class="nx-fb cue" role="alert">${errors.map(esc).join("<br>")}</p>`;
  if (plan.empty) return `<p class="nx-fb">No changes to apply.</p>`;
  const changes = plan.changes
    .map(
      (c) => `<li><b>${esc(c.where)}</b> ${esc(c.what)}: <s>${esc(c.from)}</s> → ${esc(c.to)}</li>`,
    )
    .join("");
  const conflicts = plan.conflicts
    .map(
      (c) =>
        `<fieldset class="nx-card"><legend>${esc(c.key.split(":")[0].toUpperCase())}: you wrote your own wording, and the generated wording changed</legend><p>Yours: “${esc(c.yours)}”</p><p>New generated: “${esc(c.newBase)}”</p><label><input type="radio" name="cf-${esc(c.key)}" value="keep" checked> Keep my wording</label><br><label><input type="radio" name="cf-${esc(c.key)}" value="new" data-usenew="${esc(c.key)}"> Use the new wording</label></fieldset>`,
    )
    .join("");
  return `<div class="nx-card"><h3>These versions will update: ${plan.outputs.join(", ")}</h3><ul>${changes}</ul>${conflicts}<button type="button" class="nx-btn primary" data-apply>Apply changes</button></div>`;
}

export function versionsHtml(r) {
  const h = r.history || [];
  return `<details class="nx-more nx-card"><summary>Versions (${r.version})</summary>${h.length ? `<ul>${h.map((x) => `<li>Version ${x.v} · ${esc(x.at.replace("T", " "))} · ${esc(x.summary)} <button type="button" class="nx-btn" data-restore="${x.v}">Restore</button></li>`).join("")}</ul>` : "<p>This is the first version.</p>"}</details>`;
}
