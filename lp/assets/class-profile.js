// My class: a teacher sets grade, content area, proficiency band, this week's topic and key words once (or picks a
// Content + Language unit) and every Teacher Tool opens with that class filled in. Stored on this device only.
//
// Rule: the profile fills a tool only when it was saved after that tool's own draft, so a teacher's edits inside a
// tool are never overwritten; the next profile change fills the tools again. "?example=1" shows the built-in example.
import { $, $$, escapeHtml, store, toast, tr } from "./lib.js";

const KEY = "class";
const FIELDS = ["grade", "area", "band", "topic", "terms", "klu"];
const LABEL = {
  grade: { "2-3": "Grades 2–3", "4-5": "Grades 4–5", "6-8": "Grades 6–8" },
  area: {
    math: "Math",
    science: "Science",
    ela: "ELA",
    "social-studies": "Social Studies",
    general: "Any class",
  },
  band: { "L1-2": "Levels 1–2", "L3-4": "Levels 3–4", "L5-6": "Levels 5–6" },
};
const AREA_OF_UNIT = (id) =>
  ["math", "science", "ela", "social-studies"].find((a) => id.startsWith(`${a}-`)) || "general";
const GRADE_OF_UNIT = (id) => {
  const g = Number(/-(\d)-/.exec(id)?.[1]);
  return g <= 3 ? "2-3" : g <= 5 ? "4-5" : "6-8";
};

export const loadProfile = () => store.get(KEY, null);
const hasProfile = (p) => p && FIELDS.some((f) => p[f]);

export function summary(p) {
  if (!hasProfile(p)) return "";
  return [LABEL.grade[p.grade], LABEL.area[p.area], LABEL.band[p.band], p.topic]
    .filter(Boolean)
    .join(" · ");
}

let units = null;
async function loadUnits() {
  if (units) return units;
  try {
    units = await (await fetch("/lp/assets/units.json")).json();
  } catch {
    units = [];
  }
  return units;
}

/* ---------- /tools/: the editor ---------- */
async function mountEditor(box) {
  const form = $("form", box);
  const status = $("[data-class-status]", box);
  const unitSel = form.elements.unit;
  for (const u of await loadUnits()) unitSel.append(new Option(u.title, u.id));
  const p = loadProfile() || {};
  for (const f of [...FIELDS, "unit"]) if (form.elements[f] && p[f]) form.elements[f].value = p[f];
  const paint = () => {
    const s = summary(loadProfile());
    status.textContent = s
      ? `${tr("class.saved", "Saved. Every tool now opens with")}: ${s}`
      : tr("class.empty", "Not set yet. Tools open with an example.");
    box.classList.toggle("is-set", Boolean(s));
  };
  const save = () => {
    const next = { savedAt: Date.now() };
    for (const f of [...FIELDS, "unit"]) {
      const v = form.elements[f]?.value?.trim();
      if (v) next[f] = v;
    }
    store.set(KEY, next);
    paint();
  };
  unitSel.addEventListener("change", () => {
    const u = units.find((x) => x.id === unitSel.value);
    if (!u) return;
    form.elements.area.value = AREA_OF_UNIT(u.id);
    form.elements.grade.value = GRADE_OF_UNIT(u.id);
    form.elements.topic.value = u.title.split(":")[0];
    form.elements.terms.value = u.vocabulary.map((v) => v.term).join(", ");
    if (u.klu && form.elements.klu) form.elements.klu.value = u.klu;
  });
  form.addEventListener("input", save);
  form.addEventListener("change", save);
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    save();
    toast(tr("class.savedShort", "My class saved"));
  });
  $("[data-class-clear]", box)?.addEventListener("click", () => {
    store.remove(KEY);
    form.reset();
    paint();
    toast(tr("class.cleared", "My class cleared"));
  });
  paint();
}

/* ---------- each tool: fill the form ---------- */
const waitForOption = (select, value, ms = 4000) =>
  new Promise((resolve) => {
    const t0 = Date.now();
    const tick = () => {
      if ([...select.options].some((o) => o.value === value)) return resolve(true);
      if (Date.now() - t0 > ms) return resolve(false);
      setTimeout(tick, 80);
    };
    tick();
  });

async function fillTool(root) {
  const slug = root.dataset.tool;
  const p = loadProfile();
  if (!hasProfile(p) || new URLSearchParams(location.search).has("example")) return;
  const draft = store.get(`draft:${slug}`);
  if (draft && draft.savedAt > (p.savedAt || 0)) return; // the teacher has worked in this tool since: keep it
  const form = $("form", root);
  if (!form) return;
  let filled = 0;
  for (const f of FIELDS) {
    const el = form.elements[f];
    if (!el || !p[f] || el instanceof RadioNodeList) continue;
    if (el.tagName === "SELECT" && ![...el.options].some((o) => o.value === p[f])) continue;
    el.value = p[f];
    filled++;
  }
  const unitSel = $("#gm-from, #vc-from", root);
  if (unitSel && p.unit && (await waitForOption(unitSel, p.unit))) {
    unitSel.value = p.unit;
    unitSel.dispatchEvent(new Event("change", { bubbles: true }));
    filled++;
  }
  if (!filled) return;
  form.dispatchEvent(new Event("input", { bubbles: true }));
  form.dispatchEvent(new Event("change", { bubbles: true }));
  const bar = document.createElement("p");
  bar.className = "class-bar no-print";
  bar.setAttribute("role", "status");
  bar.innerHTML = `<span class="class-dot" aria-hidden="true"></span><span><strong>${escapeHtml(tr("class.filled", "Filled in for My class"))}:</strong> ${escapeHtml(summary(p))}</span>
<a href="/tools/#my-class">${escapeHtml(tr("class.edit", "Change"))}</a><a href="?example=1">${escapeHtml(tr("class.example", "Show the example instead"))}</a>`;
  root.before(bar);
}

const editor = $("[data-class-profile]");
if (editor) mountEditor(editor);
for (const root of $$("[data-tool]")) fillTool(root);
