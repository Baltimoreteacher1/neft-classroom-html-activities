// Teacher assessment builder, item library and "from my class to my lesson" planner (Phase 6E). Everything comes from the
// authored bank; the page loads one grade at a time, builds a blueprint that says what a score is a score OF, prints a
// student copy and a separate key, and turns the Teacher Hub's class findings into a short plan of real items.
import { getLang } from "../i18n.js";
import { NOT_PRINTABLE, renderAssessment } from "./assessment-print.js";
import { loadGradeBank, loadStandards } from "./content-bank.js";
import { coverageMatrix } from "./coverage.js";
import { planFromClass } from "./data-to-instruction.js";
import { buildClassModel } from "./class-model.js";
import {
  buildExplanation,
  discoursePrompts,
  languageSupports,
} from "./instruction-engine.js";
import { MODES, buildAssessment } from "./item-engine.js";

const lang = () => (getLang() === "es" ? "es" : "en");
const L = (en, es) => (lang() === "es" ? es : en);
const pick = (o) =>
  o && typeof o === "object" ? o[lang()] || o.en : String(o ?? "");
const esc = (v) =>
  String(v ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;",
      })[c],
  );
const MODE_NAMES = {
  practice: ["Practice set", "Conjunto de práctica"],
  diagnostic: ["Diagnostic check", "Revisión diagnóstica"],
  exit: ["Exit ticket", "Boleto de salida"],
  quiz: ["Quiz", "Prueba corta"],
  unit: ["Unit check", "Revisión de unidad"],
  pretest: ["Pre-test", "Prueba previa"],
  challenge: ["Challenge set", "Conjunto de desafío"],
};

export function mountAssessmentBuilder(
  host,
  { klass = null, grade = 5, onPrint = null, announce = () => {} } = {},
) {
  const ui = {
    grade: Number(grade) || 5,
    mode: "quiz",
    seed: (Date.now() / 86400000) | 0,
    standards: new Set(),
    count: null,
    bank: [],
    standardsTable: [],
    asm: null,
    openItem: null,
  };

  async function load() {
    host.innerHTML = `<p role="status">${esc(L("Loading the item bank…", "Cargando el banco de ejercicios…"))}</p>`;
    [ui.bank, ui.standardsTable] = await Promise.all([
      loadGradeBank(ui.grade),
      loadStandards(),
    ]);
    ui.asm = null;
    render();
  }

  function render() {
    const cov = coverageMatrix(ui.bank, ui.standardsTable, { grade: ui.grade });
    const gradeOptions = [1, 2, 3, 4, 5, 6, 7, 8]
      .map(
        (g) =>
          `<option value="${g}" ${g === ui.grade ? "selected" : ""}>${esc(L(`Grade ${g}`, `Grado ${g}`))}</option>`,
      )
      .join("");
    const modeOptions = Object.keys(MODES)
      .map(
        (m) =>
          `<option value="${m}" ${m === ui.mode ? "selected" : ""}>${esc(MODE_NAMES[m][lang() === "es" ? 1 : 0])} (${MODES[m].size})</option>`,
      )
      .join("");
    const stdList = cov
      .map(
        (r) =>
          `<label class="e8th-check"><input type="checkbox" data-as-std="${esc(r.code)}" ${ui.standards.has(r.code) ? "checked" : ""} ${r.bare ? "disabled" : ""}> ${esc(r.code)} <small>(${r.count})</small></label>`,
      )
      .join("");
    host.innerHTML = `<section class="e8th" aria-labelledby="e8as-title"><h3 id="e8as-title">${esc(L("Assessment builder and item library", "Constructor de evaluaciones y biblioteca de ejercicios"))}</h3><p>${esc(L(`${ui.bank.length} items for this grade. Every answer was checked with exact arithmetic. None has had an outside expert review yet, so look an item over before you use it with students.`, `${ui.bank.length} ejercicios para este grado. Cada respuesta se comprobó con aritmética exacta. Ninguno ha tenido todavía una revisión de un experto externo, así que revisa un ejercicio antes de usarlo con estudiantes.`))}</p><div class="e8th-controls"><label>${esc(L("Grade", "Grado"))}<select data-as-grade>${gradeOptions}</select></label><label>${esc(L("Kind of check", "Tipo de revisión"))}<select data-as-mode>${modeOptions}</select></label><label>${esc(L("Seed (same seed, same set)", "Semilla (misma semilla, mismo conjunto)"))}<input type="number" min="1" max="999999" value="${ui.seed}" data-as-seed></label><button type="button" class="t4-btn" data-as-build>${esc(L("Build", "Crear"))}</button></div><details><summary>${esc(L("Limit to standards (optional)", "Limitar a estándares (opcional)"))}</summary><div class="e8as-stds">${stdList}</div></details><div data-as-out>${ui.asm ? out() : ""}</div></section>`;
    wire();
  }

  function out() {
    const a = ui.asm;
    const b = a.blueprint;
    const rows = a.items
      .map(
        (it, i) =>
          `<tr><th scope="row">${i + 1}</th><td><button type="button" class="e8th-cell" data-as-open="${esc(it.id)}">${esc(pick(it.stem).slice(0, 90))}${pick(it.stem).length > 90 ? "…" : ""}</button></td><td>${esc(it.standard)}</td><td>DOK ${it.dok}</td><td>${esc(it.type)}${NOT_PRINTABLE.has(it.type) ? ` <small>${esc(L("(on screen only)", "(solo en pantalla)"))}</small>` : ""}</td></tr>`,
      )
      .join("");
    return `<h4>${esc(L("Blueprint", "Plano"))}</h4><p>${esc(
      L(
        `${b.count} items, ${b.points} points, ${b.standards.length} standards. DOK mix: ${Object.entries(
          b.dok,
        )
          .map(([k, v]) => `${k}: ${v}`)
          .join(
            ", ",
          )}. ${b.selfChecked} written-response item(s) are scored by a person, not by the page.`,
        `${b.count} ejercicios, ${b.points} puntos, ${b.standards.length} estándares. Mezcla de DOK: ${Object.entries(
          b.dok,
        )
          .map(([k, v]) => `${k}: ${v}`)
          .join(
            ", ",
          )}. ${b.selfChecked} ejercicio(s) de respuesta escrita los califica una persona, no la página.`,
      ),
    )}</p><div class="e8th-scroll" tabindex="0" role="region" aria-label="${esc(L("Items in this set", "Ejercicios de este conjunto"))}"><table class="e8th-table"><caption>${esc(L("Items in this set", "Ejercicios de este conjunto"))}</caption><thead><tr><th scope="col">#</th><th scope="col">${esc(L("Item", "Ejercicio"))}</th><th scope="col">${esc(L("Standard", "Estándar"))}</th><th scope="col">DOK</th><th scope="col">${esc(L("Type", "Tipo"))}</th></tr></thead><tbody>${rows}</tbody></table></div><div class="e8th-row"><button type="button" class="t4-btn" data-as-print="student">${esc(L("Print student copy", "Imprimir copia del estudiante"))}</button><button type="button" class="t4-btn" data-as-print="key">${esc(L("Print answer key", "Imprimir la clave"))}</button><select data-as-lang aria-label="${esc(L("Print language", "Idioma de impresión"))}"><option value="en">English</option><option value="es">Español</option><option value="both">English / Español</option></select></div><div class="e8th-detail" data-as-detail role="status" aria-live="polite">${ui.openItem ? detail(a.items.find((i) => i.id === ui.openItem)) : ""}</div>`;
  }

  function detail(it) {
    if (!it) return "";
    const ex = buildExplanation(it);
    const sup = languageSupports(it);
    return `<h4>${esc(it.id)}</h4><p><b>${esc(pick(it.stem))}</b></p><h5>${esc(L("Explanation in five layers", "Explicación en cinco capas"))}</h5><ol>${ex.layers.map((l) => `<li><b>${esc(pick(l.title))}.</b> ${esc(pick(l.body))}</li>`).join("")}</ol><h5>${esc(L("Talk prompts", "Preguntas para conversar"))}</h5><ul>${discoursePrompts(
      it,
    )
      .map((p) => `<li>${esc(pick(p))}</li>`)
      .join(
        "",
      )}</ul><h5>${esc(L("Language supports", "Apoyos de lenguaje"))}</h5><ul>${sup.frames.map((f) => `<li>${esc(pick(f))}</li>`).join("")}</ul>`;
  }

  function wire() {
    host.querySelector("[data-as-grade]")?.addEventListener("change", (e) => {
      ui.grade = Number(e.target.value);
      ui.standards.clear();
      load();
    });
    host.querySelector("[data-as-mode]")?.addEventListener("change", (e) => {
      ui.mode = e.target.value;
    });
    host.querySelector("[data-as-seed]")?.addEventListener("change", (e) => {
      ui.seed = Math.max(1, Number(e.target.value) || 1);
    });
    host.querySelectorAll("[data-as-std]").forEach((c) =>
      c.addEventListener("change", () => {
        c.checked
          ? ui.standards.add(c.dataset.asStd)
          : ui.standards.delete(c.dataset.asStd);
      }),
    );
    host.querySelector("[data-as-build]")?.addEventListener("click", () => {
      ui.asm = buildAssessment(ui.bank, {
        mode: ui.mode,
        grade: ui.grade,
        standards: ui.standards.size ? [...ui.standards] : null,
        seed: ui.seed,
      });
      ui.openItem = null;
      render();
      announce(
        L(
          `Built ${ui.asm.items.length} items.`,
          `Se crearon ${ui.asm.items.length} ejercicios.`,
        ),
      );
    });
    host.querySelectorAll("[data-as-open]").forEach((b) =>
      b.addEventListener("click", () => {
        ui.openItem = b.dataset.asOpen;
        host.querySelector("[data-as-detail]").innerHTML = detail(
          ui.asm.items.find((i) => i.id === ui.openItem),
        );
      }),
    );
    host.querySelectorAll("[data-as-print]").forEach((b) =>
      b.addEventListener("click", () => {
        const language = host.querySelector("[data-as-lang]")?.value || "en";
        onPrint?.(
          renderAssessment(ui.asm, {
            audience: b.dataset.asPrint,
            language,
            title: L(MODE_NAMES[ui.mode][0], MODE_NAMES[ui.mode][1]),
          }),
        );
      }),
    );
  }

  load();
  return { refresh: render };
}

// "From my class to my lesson": reads the class the teacher opened and lists what to teach tomorrow from real items.
export function mountLessonPlanner(host, { klass, grade = 5 }) {
  let level = Number(klass.state.grade ?? grade) || 5;
  async function render() {
    const learners = klass.learners();
    if (!learners.length) {
      host.innerHTML = `<p class="e8th-empty" role="status">${esc(L("Open learner files in “Class insights” first.", "Abre primero archivos de estudiantes en “Panorama de la clase”."))}</p>`;
      return;
    }
    const [bank] = await Promise.all([loadGradeBank(level)]);
    const model = buildClassModel(learners, { grade: level });
    const plan = planFromClass(model, bank, { grade: level });
    const byId = new Map(bank.map((i) => [i.id, i]));
    const list = (ids) =>
      ids
        .map((id) => `<li>${esc(pick(byId.get(id)?.stem).slice(0, 110))}</li>`)
        .join("");
    host.innerHTML = `<section class="e8th"><h3>${esc(L("From my class to my lesson", "De mi clase a mi lección"))}</h3>${plan.reteach.length ? plan.reteach.map((r) => `<article><h4>${esc(r.title)}</h4><p>${esc(r.reason[lang()])} <span>${esc(r.learners.join(", "))}</span></p>${r.note ? `<p>${esc(pick(r.note))}</p>` : `<h5>${esc(L("Launch", "Inicio"))}</h5><ul>${list(r.launch)}</ul><h5>${esc(L("Guided practice", "Práctica guiada"))}</h5><ul>${list(r.guided)}</ul><h5>${esc(L("Exit check", "Revisión de salida"))}</h5><ul>${list(r.exit)}</ul>`}${r.discourse.length ? `<h5>${esc(L("Talk prompts", "Preguntas para conversar"))}</h5><ul>${r.discourse.map((p) => `<li>${esc(pick(p))}</li>`).join("")}</ul>` : ""}</article>`).join("") : `<p>${esc(L("No skill is flagged for the whole class right now.", "Ninguna destreza está marcada para toda la clase por ahora."))}</p>`}${plan.patterns.map((p) => `<article><h4>${esc(pick(p.title))}</h4><p>${esc(p.learners.join(", "))}</p><p>${esc(pick(p.counter))}</p><p>${esc(pick(p.idea))}</p></article>`).join("")}</section>`;
  }
  render();
  return { refresh: render };
}
