/**
 * Project Studio workbench: live linked models, undo/redo, revision checkpoints, and the
 * "what the Studio checks vs. what your teacher judges" panel. It reads and writes the one Studio
 * state object (design, checked, checkpoints, workbench) through the host callbacks, so the models
 * can never disagree with the form or the checks.
 */
import { fieldsFor, format, model, number } from "./math.mjs";
import { clampStep, controlsHTML, defaultBin, esc, hasModels, modelsHTML, statisticsEditor, stepFor } from "./models.mjs";
import { createHistory } from "./history.mjs";
import { addCheckpoint, changedFields, cleanCheckpoints, reasonFrames, removeCheckpoint, restoreDesign } from "./checkpoints.mjs";
import { hasV2, JUDGED, verifiedFacts } from "./feedback.mjs";
import { BUILDER_KEYS } from "./builders.mjs";
import { PLANE, planePoint } from "./models-space.mjs";
import { graphPoint } from "./models-algebra.mjs";

const clip = (v, n) => (typeof v === "string" ? v.slice(0, n) : "");
/** Additive save fields. Called after state.mjs `clean`, which ignores fields it does not know. */
export function attachExtras(project, state, raw) {
  state.checkpoints = cleanCheckpoints(project, raw?.checkpoints);
  const bin = Number(raw?.workbench?.bin);
  state.workbench = {
    bin: Number.isFinite(bin) && bin >= 0.5 && bin <= 1000 ? bin : null,
    builder: Object.fromEntries(BUILDER_KEYS.map((k) => [k, clip(raw?.workbench?.builder?.[k], 12)])),
    mover: raw?.workbench?.mover === "B" ? "B" : "A",
  };
  return state;
}

/** Report lines for the checkpoints the student saved. */
export function checkpointReport(project, state) {
  const list = state.checkpoints || [];
  if (!list.length) return [];
  return [
    "REVISION CHECKPOINTS",
    ...list.map((cp, i) => `${i + 1}. ${cp.name}: ${fieldsFor(project).map((f) => `${f.label} ${cp.design[f.key]}`).join("; ")}\n   Why: ${cp.reason || "[no reason written]"}`),
    "",
  ];
}

export function createWorkbench({ project, getState, save, refreshSidebar }) {
  const history = createHistory(getState().design);
  let section = null;
  let confirmRemove = null;
  const $ = (s) => section?.querySelector(s);
  const fields = fieldsFor(project);
  const statsFamily = project.family === "statistics";

  const ensure = () => {
    const s = getState();
    s.checkpoints ||= [];
    s.workbench ||= { bin: null, builder: {}, mover: "A" };
    return s;
  };
  const reveal = () => {
    const s = getState();
    return (id) => s.role === "teacher" || s.checked?.[id] === true;
  };
  const dataValues = () => String(getState().design.data ?? "").split(",").map((x) => x.trim());
  const announce = (message) => {
    const el = $("#wb-status");
    if (el) el.textContent = message;
  };

  function modelsMarkup(editable) {
    const s = ensure();
    return modelsHTML(project, s.design, { reveal: reveal(), bin: s.workbench.bin, builder: s.workbench.builder, mover: s.workbench.mover, editable });
  }
  function withFocus(container, render) {
    const active = document.activeElement;
    const id = active && container.contains(active) ? active.id : "";
    const caret = id && active.selectionStart != null ? [active.selectionStart, active.selectionEnd] : null;
    render();
    if (id) {
      const next = document.getElementById(id);
      next?.focus({ preventScroll: true });
      if (caret && next?.setSelectionRange) next.setSelectionRange(...caret);
    }
  }
  function sync({ structural = false } = {}) {
    if (!section) return;
    const s = ensure();
    const models = $("#wb-models");
    if (models) withFocus(models, () => (models.innerHTML = modelsMarkup(s.stage === 1)));
    for (const input of section.querySelectorAll("[data-wb-field]"))
      if (input !== document.activeElement) input.value = s.design[input.dataset.wbField] ?? "";
    for (const f of fields) {
      const form = document.getElementById(`design-${f.key}`);
      if (form && form !== document.activeElement) form.value = s.design[f.key] ?? "";
    }
    const editor = $("#wb-editor");
    if (editor && statsFamily && (structural || editor.dataset.count !== String(dataValues().length)))
      withFocus(editor, () => {
        editor.innerHTML = statisticsEditor(dataValues(), s.stage === 1);
        editor.dataset.count = String(dataValues().length);
      });
    else if (editor && statsFamily)
      for (const input of editor.querySelectorAll("[data-wb-datum-input]"))
        if (input !== document.activeElement) input.value = dataValues()[Number(input.dataset.wbDatumInput)] ?? "";
    refreshSidebar();
    const steps = history.steps();
    for (const [name, can] of [["undo", history.canUndo()], ["redo", history.canRedo()]]) {
      const b = $(`[data-wb="${name}"]`);
      if (b) b.disabled = !can;
    }
    const count = $("#wb-steps");
    if (count) count.textContent = `${steps.undo} step${steps.undo === 1 ? "" : "s"} to undo, ${steps.redo} to redo`;
    const list = $("#wb-checkpoints");
    if (list) list.innerHTML = checkpointList();
    const facts = $("#wb-facts");
    if (facts) facts.innerHTML = factsList();
  }
  function applyDesign(patch, tag = null, message = "") {
    const s = ensure();
    s.design = { ...s.design, ...patch };
    s.checked = {};
    s.review[0] = false;
    history.record(s.design, tag);
    save();
    sync({ structural: !tag });
    if (message) announce(message);
  }
  function setWholeDesign(design, message) {
    const s = ensure();
    s.design = design;
    s.checked = {};
    s.review[0] = false;
    save();
    sync({ structural: true });
    announce(message);
  }

  function checkpointList() {
    const s = ensure();
    if (!s.checkpoints.length) return '<p class="muted">No checkpoints yet. Save one before you try a new idea.</p>';
    return `<ol class="cp-list">${s.checkpoints
      .map((cp) => {
        const diff = changedFields(project, cp.design, s.design);
        const summary = diff.length ? `Different from your current design: ${diff.map((f) => `${f.label} was ${cp.design[f.key]}`).join("; ")}.` : "Same as your current design.";
        return `<li><strong>${esc(cp.name)}</strong> <span class="muted">${cp.matched} of 6 checks matched when saved</span><p>${esc(cp.reason) || '<span class="muted">No reason written.</span>'}</p><p class="muted">${esc(summary)}</p><p class="actions compact"><button type="button" class="secondary small" data-wb-restore="${cp.id}" aria-label="Restore checkpoint: ${esc(cp.name)}">Restore</button><button type="button" class="secondary small" data-wb-remove="${cp.id}" aria-label="${confirmRemove === cp.id ? "Confirm removing" : "Remove"} checkpoint: ${esc(cp.name)}">${confirmRemove === cp.id ? "Confirm remove" : "Remove"}</button></p></li>`;
      })
      .join("")}</ol>`;
  }
  function checkpointPanel() {
    const s = ensure();
    const frames = reasonFrames(project, s.lang);
    return `<section class="card wb-checkpoints" aria-labelledby="cp-heading"><h3 id="cp-heading">Revision checkpoints</h3><div class="wb-undo" role="group" aria-label="Undo and redo design changes"><button type="button" class="secondary" data-wb="undo">Undo</button><button type="button" class="secondary" data-wb="redo">Redo</button><span id="wb-steps" class="muted"></span></div><p id="wb-status" class="notice" role="status"></p><form data-wb-form="checkpoint" novalidate><div class="evidence-field"><label for="cp-name">Checkpoint name</label><input id="cp-name" type="text" maxlength="40" autocomplete="off" placeholder="For example: Version with more seats"></div><div class="evidence-field"><label for="cp-reason">Explain your choice: why is this design worth keeping?</label><textarea id="cp-reason" maxlength="500" rows="3"></textarea></div><p class="muted" id="cp-frames-label">Sentence frames (choose one to start):</p><div class="wb-frames" role="group" aria-labelledby="cp-frames-label">${frames.map((f, i) => `<button type="button" class="secondary small" data-wb-frame="${i}">${esc(f)}</button>`).join("")}</div><p class="actions compact"><button type="submit">Save checkpoint</button></p></form><div id="wb-checkpoints" aria-live="polite">${checkpointList()}</div></section>`;
  }
  function factsList() {
    const s = ensure();
    const facts = verifiedFacts(project, s.design, s.checked);
    return facts.length ? `<ul>${facts.map((f) => `<li>${esc(f)}</li>`).join("")}</ul>` : '<p class="muted">Confirmed facts appear here as your checks match.</p>';
  }
  function judgePanel() {
    return `<section class="card wb-judge" aria-labelledby="wb-judge-h"><h3 id="wb-judge-h">What the Studio checks, and what your teacher judges</h3><div class="wb-two"><div><h4>Checked by the Studio</h4><p>Arithmetic and constraints, computed from your numbers. A match means the calculation fits this design. It is not a grade.</p><div id="wb-facts" aria-live="polite">${factsList()}</div></div><div><h4>Judged by your teacher</h4><ul>${JUDGED[project.family].map((t) => `<li>${esc(t)}</li>`).join("")}</ul></div></div></section>`;
  }
  function html() {
    const s = ensure();
    const stage = s.stage;
    if (stage === 1 && hasModels(project))
      return `<h3 id="wb-h">Live models: change a quantity and every picture updates</h3><p class="muted">Values you have not checked yet show as ?. They appear when your answer matches in Test.</p>${statsFamily ? `<div id="wb-editor" data-count="${dataValues().length}">${statisticsEditor(dataValues(), true)}</div>` : controlsHTML(project, s.design, true)}<div id="wb-models" class="wb-models">${modelsMarkup(true)}</div>${checkpointPanel()}`;
    if (stage === 2 && hasModels(project))
      return `<details class="wb-details wb-test-models"><summary>Show the live models for this design</summary><div id="wb-models" class="wb-models">${modelsMarkup(false)}</div></details>${hasV2(project) ? judgePanel() : ""}`;
    if (stage === 3 && hasModels(project)) return checkpointPanel();
    return "";
  }

  function mount() {
    section?.remove();
    section = null;
    const s = ensure();
    history.record(s.design, null);
    const panel = document.querySelector("#stage-panel");
    const footer = panel?.querySelector(".stage-footer");
    const markup = hasV2(project) ? html() : "";
    if (!panel || !footer || !markup) return;
    section = document.createElement("div");
    section.id = "workbench";
    section.className = "wb";
    section.innerHTML = markup;
    footer.before(section);
    section.addEventListener("click", onClick);
    section.addEventListener("input", onInput);
    section.addEventListener("change", () => history.breakRun());
    section.addEventListener("keydown", onKey);
    section.addEventListener("submit", onSubmit);
    sync({ structural: true });
  }

  function stepField(key, dir) {
    const field = fields.find((f) => f.key === key);
    const s = ensure();
    const cur = number(s.design[key]);
    const base = Number.isFinite(cur) ? cur : field.min;
    const next = clampStep(field, base + dir * stepFor(field));
    if (String(next) !== String(s.design[key])) applyDesign({ [key]: String(next) }, null);
  }
  function setData(values, tag = null) {
    applyDesign({ data: values.join(", ") }, tag);
  }
  function pixel(event, holder, width) {
    const box = holder.querySelector("svg").getBoundingClientRect();
    const k = width / box.width;
    return [(event.clientX - box.left) * k, (event.clientY - box.top) * k];
  }
  const numbers = () => model(project, ensure().design).values;
  const within = (key, value) => {
    const f = fields.find((x) => x.key === key);
    return String(Math.min(f.max, Math.max(f.min, Math.round(value))));
  };
  function planeClick(event, holder) {
    const { x, y } = planePoint(...pixel(event, holder, PLANE.size));
    if (ensure().workbench.mover === "B") applyDesign({ c: within("c", x) }, null, `Moved point B to x = ${x}.`);
    else applyDesign({ a: within("a", x), b: within("b", y) }, null, `Moved point A to (${x}, ${y}).`);
    document.getElementById("wb-plane")?.focus({ preventScroll: true });
  }
  function graphClick(event, holder) {
    const v = numbers();
    if (!v) return;
    const { x, y } = graphPoint(v, ...pixel(event, holder, 360));
    if (x === 0) applyDesign({ b: within("b", y) }, null, `Set the starting amount to ${within("b", y)}.`);
    else applyDesign({ a: within("a", (y - v.b) / x) }, null, `Bent the line through (${x}, ${y}) to the nearest whole rate.`);
    document.getElementById("wb-graph")?.focus({ preventScroll: true });
  }
  function onClick(event) {
    const plane = event.target.closest("[data-wb-plane]");
    if (plane) return planeClick(event, plane);
    const graph = event.target.closest("[data-wb-graph]");
    if (graph) return graphClick(event, graph);
    const t = event.target.closest("button, [data-cell]");
    if (!t) return;
    const s = ensure();
    if (t.dataset.wbStep) return stepField(t.dataset.wbStep, Number(t.dataset.dir));
    if (t.dataset.cell) return gridSet(Number(t.dataset.cell));
    if (t.dataset.wbDatum !== undefined) {
      const values = dataValues(), i = Number(t.dataset.wbDatum), cur = number(values[i]);
      const step = values.some((x) => /\./.test(x)) ? 0.5 : 1;
      values[i] = format(Math.max(-1000, Math.min(1000, (Number.isFinite(cur) ? cur : 0) + Number(t.dataset.dir) * step)));
      return setData(values);
    }
    if (t.dataset.wbBin) {
      const current = Number(s.workbench.bin) || defaultBin(model(project, s.design).values?.data || [1, 2]);
      s.workbench.bin = Math.max(0.5, Math.min(1000, current + Number(t.dataset.wbBin) * 0.5));
      save();
      return sync();
    }
    const name = t.dataset.wb;
    if (name === "undo" || name === "redo") {
      const next = name === "undo" ? history.undo() : history.redo();
      if (next) {
        setWholeDesign(next, name === "undo" ? "Undid the last design change. Your math checks need to be run again." : "Redid the design change. Your math checks need to be run again.");
      }
    } else if (name === "add-value") {
      const values = dataValues();
      if (values.length < 12) setData([...values, values.at(-1) || "0"]);
    } else if (name === "remove-value") {
      const values = dataValues();
      if (values.length > 6) setData(values.slice(0, -1));
    } else if (name === "sort-values") {
      setData(dataValues().sort((x, y) => number(x) - number(y)));
    } else if (t.dataset.wbRestore) {
      const design = restoreDesign(s.checkpoints, t.dataset.wbRestore);
      const cp = s.checkpoints.find((c) => c.id === t.dataset.wbRestore);
      if (design) {
        history.record(design, null);
        setWholeDesign(design, `Restored checkpoint ${cp.name}. You can undo this. Your math checks need to be run again.`);
      }
    } else if (t.dataset.wbRemove) {
      if (confirmRemove !== t.dataset.wbRemove) {
        confirmRemove = t.dataset.wbRemove;
        sync();
        announce("Press Remove again to confirm.");
      } else {
        s.checkpoints = removeCheckpoint(s.checkpoints, t.dataset.wbRemove);
        confirmRemove = null;
        save();
        sync();
        announce("Checkpoint removed.");
      }
    } else if (t.dataset.wbFrame !== undefined) {
      const box = $("#cp-reason");
      const frame = reasonFrames(project, s.lang)[Number(t.dataset.wbFrame)];
      box.value = box.value.trim() ? `${box.value.trim()} ${frame}` : frame;
      box.focus();
    }
  }
  function onInput(event) {
    const t = event.target;
    const s = ensure();
    if (t.dataset.wbField) applyDesign({ [t.dataset.wbField]: t.value }, t.dataset.wbField);
    else if (t.dataset.wbDatumInput !== undefined) {
      const values = dataValues();
      values[Number(t.dataset.wbDatumInput)] = t.value;
      setData(values, `datum-${t.dataset.wbDatumInput}`);
    } else if (t.dataset.wbBuilder) {
      s.workbench.builder[t.dataset.wbBuilder] = t.value.slice(0, 12);
      save();
      sync();
    } else if (t.dataset.wbMover) {
      s.workbench.mover = t.dataset.wbMover === "B" ? "B" : "A";
      save();
      sync();
    } else if (t.dataset.wbBinInput !== undefined) {
      const n = number(t.value);
      if (Number.isFinite(n) && n >= 0.5 && n <= 1000) {
        s.workbench.bin = n;
        save();
        sync();
      }
    }
  }
  function gridSet(value) {
    const field = fields.find((f) => f.key === "b");
    const next = Math.min(field.max, Math.max(field.min, value));
    applyDesign({ b: String(next) }, null);
    document.getElementById("wb-grid")?.focus({ preventScroll: true });
  }
  function onKey(event) {
    const plane = event.target.closest?.("[data-wb-plane]");
    const graph = event.target.closest?.("[data-wb-graph]");
    if (plane || graph) {
      const v = numbers();
      const dx = { ArrowRight: 1, ArrowLeft: -1 }[event.key] ?? 0;
      const dy = { ArrowUp: 1, ArrowDown: -1 }[event.key] ?? 0;
      if (!v || (!dx && !dy)) return;
      event.preventDefault();
      if (plane && ensure().workbench.mover === "B") return dx ? applyDesign({ c: within("c", v.c + dx) }, null, `Point B is at x = ${within("c", v.c + dx)}.`) : undefined;
      if (plane) return applyDesign({ a: within("a", v.a + dx), b: within("b", v.b + dy) }, null, `Point A is at (${within("a", v.a + dx)}, ${within("b", v.b + dy)}).`);
      return applyDesign({ a: within("a", v.a + dx), b: within("b", v.b + dy) }, null, `Rate ${within("a", v.a + dx)}, start ${within("b", v.b + dy)}.`);
    }
    const grid = event.target.closest?.("[data-wb-grid]");
    if (!grid) return;
    const cur = Number(ensure().design.b);
    const delta = { ArrowRight: 1, ArrowUp: 1, ArrowLeft: -1, ArrowDown: -1, PageUp: 10, PageDown: -10 }[event.key];
    if (delta === undefined && event.key !== "Home" && event.key !== "End") return;
    event.preventDefault();
    const field = fields.find((f) => f.key === "b");
    gridSet(event.key === "Home" ? field.min : event.key === "End" ? field.max : cur + delta);
  }
  function onSubmit(event) {
    if (event.target.dataset.wbForm !== "checkpoint") return;
    event.preventDefault();
    const s = ensure();
    const result = addCheckpoint(project, s.checkpoints, {
      name: $("#cp-name").value,
      reason: $("#cp-reason").value,
      design: s.design,
      matched: Object.values(s.checked).filter(Boolean).length,
    });
    if (result.error) return announce(result.error);
    s.checkpoints = result.list;
    $("#cp-name").value = "";
    $("#cp-reason").value = "";
    save();
    sync();
    announce(`Saved checkpoint ${result.entry.name}.`);
  }

  return {
    mount,
    /** The Build form changed a design input. */
    designTyped(key) {
      const s = ensure();
      history.record(s.design, `form-${key}`);
      sync();
    },
    /** A check matched, was unmatched, or the role changed: reveal state moved. */
    checksChanged() {
      sync();
    },
  };
}
