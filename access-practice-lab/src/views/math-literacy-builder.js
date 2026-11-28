// Math Literacy Studio: the resource builder (/math-literacy/resource/<skill>/<type>) and packet builder (/math-literacy/packet/<kind>/<skill>).
// One structured Resource drives everything on this page: the preview, the edits, the compare view and every download. Changing the format or the
// material never starts over, because the Resource is rebuilt from the same options and edits.
import { html, icon, raw, announce, esc } from "../util.js";
import { loadSkill } from "../mls/content.js";
import { generate } from "../mls/families.js";
import { BANDS, INDEPENDENCE, PRESETS, bandOf } from "../mls/lang.js";
import { applyEdits, buildResource, diffResources, normalizeOpts, packetResource } from "../mls/model.js";
import { ROLE_MAP, TYPE_LABEL, TYPE_META } from "../mls/roles.js";
import * as Store from "../mls/store.js";
import * as Exp from "../mls/export/index.js";

void generate;
const ENGINE_NAME = { "reading-lab": "Reading Lab", anatomy: "Word Problem Anatomy", "sentence-studio": "Sentence Studio", translator: "Representation Translator", "vocab-explorer": "Vocabulary Explorer", "talk-studio": "Math Talk Studio", "listening-lab": "Listening Lab", "error-detective": "Error Detective", "story-studio": "Story Studio", "modeling-workshop": "Modeling Workshop", "concept-comics": "Concept Comics", "transfer-lab": "Language Transfer Lab" };

/** What is on screen: the skill, the recipe, the built Resource and any packet parts. */
let cur = null;
// unmount() runs on every re-render, so edits are stashed here when the page re-renders itself (a dial changed, a question regenerated) and are
// picked up once by the next render of the same skill and type. Opening any other resource starts clean.
let carry = null;
let compare = false;
/** Which details panels the teacher has open; kept across re-renders so a change never closes the panel being used. */
const openPanels = { adjust: false, questions: false };
let helpers = null;

const q = (k) => new URLSearchParams(location.search).get(k) || "";
const OPT_KEYS = ["support", "math", "band", "visuals", "writing", "independence", "count", "ctx", "seed", "variant", "key"];
function optsFromUrl() {
  const o = {};
  for (const k of OPT_KEYS) if (q(k) !== "") o[k] = ["math", "count", "seed"].includes(k) ? Number(q(k)) : k === "key" ? q(k) !== "0" : q(k);
  try {
    if (q("pseed")) o.pseed = JSON.parse(q("pseed"));
    if (q("hide")) o.hide = JSON.parse(q("hide"));
  } catch {
    /* ignore a damaged parameter */
  }
  return o;
}
const urlFor = (path, o) => {
  const u = new URLSearchParams();
  for (const k of OPT_KEYS) if (o[k] !== undefined && o[k] !== "" && o[k] !== false) u.set(k, String(o[k]));
  if (o.key === false) u.set("key", "0");
  if (o.pseed && Object.keys(o.pseed).length) u.set("pseed", JSON.stringify(o.pseed));
  if (o.hide?.length) u.set("hide", JSON.stringify(o.hide));
  const s = u.toString();
  return `${path}${s ? `?${s}` : ""}`;
};

function rebuild() {
  const { skill, type, opts, edits } = cur;
  const r = buildResource(skill, type, opts);
  cur.resource = applyEdits(r, edits);
  cur.norm = normalizeOpts(opts, skill);
}

// ------------------------------------------------------------------------------------------------------------- key document (for the preview)
function keyHtml(resource) {
  const rows = resource.key.map((k) => `<tr><th scope="row">${esc(k.ref)}</th><td>${esc(k.answer)}</td><td>${esc((k.work || []).join(" "))}</td></tr>`).join("");
  const notes = (resource.notes || []).map((n) => `<li>${esc(n)}</li>`).join("");
  return `<!doctype html><html lang="en"><meta charset="utf-8"><title>${esc(resource.title)}: Answer key</title><style>body{font:16px/1.5 system-ui,sans-serif;color:#24323f;margin:1rem}table{border-collapse:collapse;inline-size:100%}th,td{border:1px solid #888;padding:.4rem;text-align:left;vertical-align:top}h1{font-size:1.2rem}</style><h1>${esc(resource.title)}: Answer key (teacher copy)</h1>${rows ? `<table><thead><tr><th>Item</th><th>Answer</th><th>Work</th></tr></thead><tbody>${rows}</tbody></table>` : "<p>This resource has no answer key: its answers vary by student.</p>"}${notes ? `<h2>Teacher notes</h2><ul>${notes}</ul>` : ""}</html>`;
}

// ------------------------------------------------------------------------------------------------------------- page
const radio = (name, value, label, checked, hint = "") => html`<label class="ml-opt"><input type="radio" name="${name}" value="${value}" data-mlb="${name}" ${checked ? raw("checked") : ""}> <span>${label}${hint ? html` <span class="fine">${hint}</span>` : ""}</span></label>`;

function controls(skill, type, o) {
  const m = ROLE_MAP;
  void m;
  const engine = Object.values(ROLE_MAP).find((r) => r.type === type && r.launch?.kind === "engine")?.launch.id;
  const stdBand = bandOf(o.band);
  return html`<section class="panel ml-controls" aria-label="Adjust this resource">
    <h2>Support</h2>
    <div class="ml-seg" role="radiogroup" aria-label="Support level">${Object.values(PRESETS).map((p) => html`<label class="ml-seg-item"><input type="radio" name="support" value="${p.id}" data-mlb="support" ${o.support === p.id ? raw("checked") : ""}> <span><strong>${p.label}</strong><span class="fine">${p.note}</span></span></label>`)}</div>
    <details class="ml-adv" data-mlb-adv="adjust" ${openPanels.adjust ? raw("open") : ""}><summary>Adjust (mathematics, language, pictures, scaffolds, length)</summary>
      <fieldset class="ml-fs"><legend>Mathematics level</legend>${[[1, "Friendlier numbers", "On grade, one idea at a time"], [2, "On grade level", ""], [3, "Extension", "Larger numbers or one more step"]].map(([v, l, h]) => radio("math", v, l, o.math === v, h))}</fieldset>
      <fieldset class="ml-fs"><legend>Language support (separate from the math)</legend>${Object.values(BANDS).map((b) => radio("band", b.id, b.short, stdBand === b.id, b.label.en))}</fieldset>
      <fieldset class="ml-fs"><legend>Pictures</legend>${radio("visuals", "standard", "Pictures where the problem has one", o.visuals !== "more")}${radio("visuals", "more", "Add a picture reference of the key words", o.visuals === "more")}</fieldset>
      <fieldset class="ml-fs"><legend>Writing support</legend>${radio("writing", "frames", "Sentence frames", o.writing === "frames")}${radio("writing", "starter", "One sentence starter", o.writing === "starter")}${radio("writing", "none", "None", o.writing === "none")}</fieldset>
      <label class="ml-field">Independence <select data-mlb="independence">${INDEPENDENCE.map((x) => html`<option value="${x.id}" ${o.independence === x.id ? raw("selected") : ""}>${x.label}: ${x.text}</option>`)}</select></label>
      <label class="ml-field">Number of problems <input type="number" min="1" max="20" value="${o.count}" data-mlb="count"></label>
      <label class="ml-field">Setting <select data-mlb="ctx">${skill.contexts.map((c) => html`<option value="${c}" ${o.ctx === c ? raw("selected") : ""}>${c[0].toUpperCase() + c.slice(1)}</option>`)}</select></label>
      <p><button type="button" class="btn small" data-mlb-act="newset">New set of problems</button> <label class="ml-check"><input type="checkbox" data-mlb="key" ${o.key ? raw("checked") : ""}> Include answer key</label></p>
    </details>
    <h2>Edit</h2>
    <label class="ml-field">Title <input type="text" data-mlb-edit="title" value="${cur.edits.title || cur.resource.title}"></label>
    <label class="ml-field">Directions to students <textarea rows="2" data-mlb-edit="directions" placeholder="Replace the directions on the page">${cur.edits.directions || ""}</textarea></label>
    ${problemEditor()}
    <h2>Use</h2>
    <div class="ml-use">
      <button type="button" class="btn primary" data-mlb-act="print">${icon("print")} Print or save as PDF</button>
      <button type="button" class="btn" data-mlb-act="dl" data-fmt="docx">${icon("download")} Word (.docx)</button>
      <button type="button" class="btn" data-mlb-act="dl" data-fmt="pptx">${icon("download")} PowerPoint (.pptx)</button>
      <button type="button" class="btn" data-mlb-act="dl" data-fmt="html">${icon("download")} Interactive web page</button>
      ${engine ? html`<a class="btn" href="${helpers.mh(`learn/${skill.id}/${engine}`)}">${icon("play")} Launch the interactive ${ENGINE_NAME[engine]}</a>` : ""}
    </div>
    ${o.key ? html`<p class="fine">Answer key (separate document): <button type="button" class="btn small" data-mlb-act="keyprint">Print</button> <button type="button" class="btn small" data-mlb-act="keydl" data-fmt="docx">Word</button> <button type="button" class="btn small" data-mlb-act="keydl" data-fmt="pptx">PowerPoint</button> <button type="button" class="btn small" data-mlb-act="keydl" data-fmt="html">Web page</button></p>` : ""}
    <p class="fine">"Print or save as PDF" opens your browser's print window; choose Save as PDF there. Word and PowerPoint files contain real, editable text.</p>
    <h2>Keep</h2>
    <div class="ml-use"><button type="button" class="btn" data-mlb-act="save">${icon("save")} Save</button>${cur.savedId ? html`<button type="button" class="btn" data-mlb-act="dupe">Duplicate</button>` : ""}<button type="button" class="btn" data-mlb-act="compare" aria-pressed="${compare}">Compare versions</button></div>
    <label class="ml-field">Make this into another material <select data-mlb="retype"><option value="">Choose...</option>${Object.keys(TYPE_META).filter((t) => t !== type).map((t) => html`<option value="${t}">${TYPE_LABEL[t]}</option>`)}</select></label>
    <p class="fine" id="ml-status" role="status" aria-live="polite"></p>
  </section>`;
}

function problemEditor() {
  const probs = cur.resource.sections.flatMap((s) => s.blocks).filter((b) => b.t === "problem" && b.n > 0);
  if (!probs.length) return "";
  return html`<details class="ml-adv" data-mlb-adv="questions" ${openPanels.questions ? raw("open") : ""}><summary>Questions (${probs.length}): replace, regenerate, remove</summary>
    <ol class="ml-probs">${probs.map((b) => html`<li data-mlb-prob="${b.tag}:${b.idx}"><label class="ml-field">Question ${b.n}<input type="text" data-mlb-pedit="ask" value="${b.ask}"></label>${b.answer != null ? html`<label class="ml-field">Answer (key and checking)<input type="text" data-mlb-pedit="answer" value="${b.answer}"></label>` : ""}<button type="button" class="btn small" data-mlb-act="regen">New version of this question</button> <button type="button" class="btn small" data-mlb-act="hide">Remove</button></li>`)}</ol></details>`;
}

function previewFrame(resource, label) {
  return html`<iframe class="ml-frame" title="${label}" sandbox="allow-same-origin" data-mlb-frame srcdoc="${Exp.printDocument(resource, { key: false, button: false })}"></iframe>`;
}

function comparePanel() {
  const { skill, type, opts } = cur;
  const a = buildResource(skill, type, { ...opts, support: "more", math: undefined, band: undefined, visuals: undefined, writing: undefined, independence: undefined, count: undefined });
  const b = buildResource(skill, type, { ...opts, support: "extension", math: undefined, band: undefined, visuals: undefined, writing: undefined, independence: undefined, count: undefined });
  const diff = diffResources(a, b);
  return html`<section class="panel ml-compare"><h2>Compare: More support and Extension</h2>
    <p class="fine">Same skill and same objective. This is what changed:</p><ul>${diff.map((d) => html`<li>${d}</li>`)}</ul>
    <div class="ml-compare-grid"><div><h3>More support</h3>${previewFrame(a, "More support version")}</div><div><h3>Extension</h3>${previewFrame(b, "Extension version")}</div></div></section>`;
}

export async function render(ctx, I, id, sub, sub2, h) {
  helpers = h;
  if (id === "packet") return packet(ctx, I, sub, sub2, h);
  const skill = await loadSkill(sub);
  if (!skill || !TYPE_META[sub2] && !["lesson-sequence"].includes(sub2)) {
    return { title: "Resource not found", html: html`<div class="ml-page">${h.crumbs(I, ["Resource not found", null])}<section class="panel"><h1>That resource is not in the studio</h1>${h.backLink("Choose a skill", h.mh("teach"))}</section></div>` };
  }
  const type = sub2;
  let opts = optsFromUrl();
  let edits = carry && carry.skillId === skill.id && carry.type === type ? carry.edits : {};
  carry = null;
  let savedId = "";
  const sv = q("saved") ? Store.load().saved.find((x) => x.id === q("saved")) : null;
  if (sv && sv.recipe.skillId === sub) {
    opts = { ...sv.recipe.opts, ...opts };
    edits = sv.recipe.edits || {};
    savedId = sv.id;
  }
  if (!opts.support) opts.support = h.supportOf();
  cur = { skill, type, opts, edits, savedId, resource: null, norm: null };
  rebuild();
  Store.remember({ skillId: skill.id, type, opts });
  const r = cur.resource;
  const label = r.title;
  return {
    title: `${label} · Math Literacy Studio`,
    html: html`<div class="ml-page ml-builder">
      ${h.crumbs(I, ["Teach a skill", h.mh("teach")], [skill.title, h.mh(`skill/${skill.id}`)], [r.subtitle || label, null])}
      <header class="panel"><p class="eyebrow">Grade ${skill.grade} · ${skill.title}</p><h1 tabindex="-1">${label}</h1>
        <p class="fine">${r.subtitle}. About ${r.meta.minutes} minutes. Math level ${r.meta.mathLevel} of 3 · ${BANDS[bandOf(r.meta.langBand)].short.toLowerCase()} · ${r.meta.independence}. Standards (informational): ${r.meta.standards.join(", ")}.</p></header>
      <div class="ml-layout">${controls(skill, type, cur.norm)}<div class="ml-previewcol"><section class="panel" aria-label="Preview"><h2>Preview</h2>${previewFrame(r, "Resource preview")}</section>${cur.norm.key ? html`<section class="panel"><h2>Answer key (separate document)</h2><iframe class="ml-frame ml-frame-key" title="Answer key preview" sandbox="allow-same-origin" srcdoc="${keyHtml(r)}"></iframe></section>` : ""}</div></div>
      ${compare ? comparePanel() : ""}
      ${h.backLink("Back to the skill", h.mh(`skill/${skill.id}`))}
    </div>`,
  };
}

// ------------------------------------------------------------------------------------------------------------- packets
async function packet(ctx, I, kind, skillId, h) {
  const { PREBUILT } = h;
  let recipes = [];
  let title = "";
  let skillFor = null;
  if (kind.startsWith("saved-")) {
    const col = Store.load().collections.find((c) => c.id === kind.slice(6));
    const items = (col?.items || []).map((i) => Store.load().saved.find((x) => x.id === i)).filter(Boolean);
    title = col?.name || "My collection";
    const parts = [];
    for (const it of items) {
      const sk = await loadSkill(it.recipe.skillId);
      if (sk) parts.push({ skill: sk, type: it.recipe.type, opts: it.recipe.opts, edits: it.recipe.edits || {} });
    }
    recipes = parts;
  } else {
    const def = PREBUILT[kind];
    skillFor = await loadSkill(skillId);
    if (!def || !skillFor) return { title: "Packet not found", html: html`<div class="ml-page">${h.crumbs(I, ["Packet not found", null])}<section class="panel"><h1>That packet is not in the studio</h1>${h.backLink("Saved and collections", h.mh("collections"))}</section></div>` };
    title = `${skillFor.title}: ${def.title}`;
    recipes = def.recipes.map(([t, v]) => ({ skill: skillFor, type: t, opts: { ...(def.opts || {}), variant: v || "", support: def.opts?.support || h.supportOf() }, edits: {} }));
  }
  const skip = new Set((q("skip") || "").split(",").filter(Boolean));
  const parts = recipes.map((r, i) => ({ ...r, i, resource: applyEdits(buildResource(r.skill, r.type, r.opts), r.edits), on: !skip.has(String(i)) }));
  const chosen = parts.filter((p) => p.on).map((p) => p.resource);
  const pk = chosen.length ? packetResource(chosen, title) : null;
  cur = { packet: pk, parts, title, kind, skillId, skill: skillFor, type: "packet" };
  return {
    title: `${title} · Math Literacy Studio`,
    html: html`<div class="ml-page ml-builder">
      ${h.crumbs(I, ["Saved and collections", h.mh("collections")], [title, null])}
      <header class="panel"><h1 tabindex="-1">${title}</h1><p class="fine">One packet, ${chosen.length} resource${chosen.length === 1 ? "" : "s"}. Untick any you do not need.</p></header>
      <div class="ml-layout"><section class="panel ml-controls"><h2>In this packet</h2><ul class="ml-list">${parts.map((p) => html`<li><label class="ml-check"><input type="checkbox" data-mlb-pk="${p.i}" ${p.on ? raw("checked") : ""}> ${p.resource.title}</label></li>`)}</ul>
        ${pk ? html`<h2>Use</h2><div class="ml-use"><button type="button" class="btn primary" data-mlb-act="print">${icon("print")} Print or save as PDF</button> <button type="button" class="btn" data-mlb-act="dl" data-fmt="docx">${icon("download")} Word (.docx)</button> <button type="button" class="btn" data-mlb-act="dl" data-fmt="pptx">${icon("download")} PowerPoint (.pptx)</button> <button type="button" class="btn" data-mlb-act="dl" data-fmt="html">${icon("download")} Interactive web page</button></div><p class="fine">Answer key (separate): <button type="button" class="btn small" data-mlb-act="keyprint">Print</button> <button type="button" class="btn small" data-mlb-act="keydl" data-fmt="docx">Word</button> <button type="button" class="btn small" data-mlb-act="keydl" data-fmt="pptx">PowerPoint</button></p>` : html`<p>Tick at least one resource.</p>`}
        <p class="fine" id="ml-status" role="status" aria-live="polite"></p></section>
        <div class="ml-previewcol">${pk ? html`<section class="panel"><h2>Preview</h2>${previewFrame(pk, "Packet preview")}</section>` : ""}</div></div>
      ${h.backLink("Saved and collections", h.mh("collections"))}</div>`,
  };
}

// ------------------------------------------------------------------------------------------------------------- download helpers
function say(msg) {
  const el = document.getElementById("ml-status");
  if (el) el.textContent = msg;
  announce(msg, { toast: false });
}
function saveBlob(out) {
  const blob = out.blob instanceof Blob ? out.blob : new Blob([out.blob ?? out.text ?? ""], { type: out.mime || "application/octet-stream" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = out.filename;
  document.body.append(a);
  a.click();
  setTimeout(() => {
    URL.revokeObjectURL(a.href);
    a.remove();
  }, 1500);
}
const target = () => (cur.packet ? cur.packet : cur.resource);

async function doDownload(fmt, key) {
  const res = target();
  say("Preparing the file...");
  try {
    const out = key ? await Exp.exportKey(res, fmt) : await Exp.exportResource(res, fmt, { key: false });
    saveBlob(out);
    say(`Downloaded ${out.filename}`);
  } catch (e) {
    console.error(e);
    say("The file could not be made. Please try Print or save as PDF instead.");
  }
}

// ------------------------------------------------------------------------------------------------------------- events
let editT = 0;
function refreshPreview() {
  const frame = document.querySelector("[data-mlb-frame]");
  if (frame) frame.srcdoc = Exp.printDocument(cur.resource, { key: false, button: false });
  const kf = document.querySelector(".ml-frame-key");
  if (kf) kf.srcdoc = keyHtml(cur.resource);
}
function navigate(opts, ctx) {
  cur.opts = opts;
  carry = { skillId: cur.skill.id, type: cur.type, edits: cur.edits };
  const path = location.pathname;
  history.replaceState({}, "", urlFor(path, { ...opts, variant: opts.variant || "" }));
  ctx.rerender();
}
export function onClick(e, ctx) {
  const act = e.target.closest("[data-mlb-act]");
  if (!act || !cur) return false;
  const a = act.dataset.mlbAct;
  if (a === "print") return (Exp.openPrintView(target(), { key: false }), true);
  if (a === "keyprint") return (Exp.openPrintView({ ...target(), sections: [{ heading: "Answer key", blocks: [{ t: "table", headers: ["Item", "Answer", "Work"], rows: target().key.map((k) => [k.ref, k.answer, (k.work || []).join(" ")]) }] }], key: [], notes: [] }, { key: false }), true);
  if (a === "dl") return (doDownload(act.dataset.fmt, false), true);
  if (a === "keydl") return (doDownload(act.dataset.fmt, true), true);
  if (a === "save") {
    const item = Store.saveResource({ skillId: cur.skill.id, type: cur.type, opts: cur.opts, edits: cur.edits }, `${cur.skill.title}: ${cur.resource.title.split(": ").pop()}`);
    cur.savedId = item.id;
    Store.noteCreated();
    say("Saved on this device. Find it under Saved and collections.");
    return true;
  }
  if (a === "dupe") {
    const c = Store.duplicateResource(cur.savedId);
    say(c ? "Duplicated. Find the copy under Saved and collections." : "Save it first.");
    return true;
  }
  if (a === "compare") return ((compare = !compare), (carry = { skillId: cur.skill.id, type: cur.type, edits: cur.edits }), ctx.rerender(), true);
  if (a === "newset") return (navigate({ ...cur.opts, seed: (cur.norm.seed || 1) + 1, pseed: {} }, ctx), true);
  const li = act.closest("[data-mlb-prob]");
  if (li && a === "regen") {
    const k = li.dataset.mlbProb;
    const ps = { ...(cur.opts.pseed || {}), [k]: Math.floor(Math.random() * 90000) + 1000 };
    return (navigate({ ...cur.opts, pseed: ps }, ctx), true);
  }
  if (li && a === "hide") {
    const idx = Number(li.dataset.mlbProb.split(":")[1]);
    return (navigate({ ...cur.opts, hide: [...(cur.opts.hide || []), idx] }, ctx), true);
  }
  return false;
}
export function onChange(e, ctx) {
  const pk = e.target.closest("[data-mlb-pk]");
  if (pk && cur?.packet !== undefined) {
    const skip = new Set((q("skip") || "").split(",").filter(Boolean));
    if (pk.checked) skip.delete(pk.dataset.mlbPk);
    else skip.add(pk.dataset.mlbPk);
    const u = new URL(location.href);
    if (skip.size) u.searchParams.set("skip", [...skip].join(","));
    else u.searchParams.delete("skip");
    history.replaceState({}, "", u);
    ctx.rerender();
    return true;
  }
  const el = e.target.closest("[data-mlb]");
  if (!el || !cur?.skill) return false;
  const k = el.dataset.mlb;
  if (k === "retype") {
    if (!el.value) return true;
    history.pushState({}, "", urlFor(`${location.pathname.replace(/\/[^/]+$/, "")}/${el.value}`, { ...cur.opts, variant: "" }));
    ctx.rerender();
    return true;
  }
  const o = { ...cur.opts };
  if (k === "support") {
    // a preset resets the dials to its defaults; each dial can then be changed alone
    for (const d of ["math", "band", "visuals", "writing", "independence", "count"]) delete o[d];
    o.support = el.value;
  } else if (k === "key") o.key = el.checked;
  else if (["math", "count"].includes(k)) o[k] = Number(el.value);
  else o[k] = el.value;
  navigate(o, ctx);
  return true;
}
export function onInput(e) {
  const t = e.target.closest("[data-mlb-edit],[data-mlb-pedit]");
  if (!t || !cur?.skill) return false;
  clearTimeout(editT);
  editT = setTimeout(() => {
    if (t.dataset.mlbEdit) cur.edits[t.dataset.mlbEdit] = t.value;
    else {
      const k = t.closest("[data-mlb-prob]").dataset.mlbProb;
      cur.edits.problems = { ...(cur.edits.problems || {}), [k]: { ...(cur.edits.problems?.[k] || {}), [t.dataset.mlbPedit]: t.value } };
    }
    rebuild();
    refreshPreview();
  }, 350);
  return true;
}
export function mount(root) {
  if (root.dataset.mlbToggle) return;
  root.dataset.mlbToggle = "1";
  root.addEventListener(
    "toggle",
    (e) => {
      const k = e.target?.dataset?.mlbAdv;
      if (k && k in openPanels) openPanels[k] = e.target.open;
    },
    true,
  );
}
export const unmount = () => {
  clearTimeout(editT);
  cur = null;
  compare = false;
};
