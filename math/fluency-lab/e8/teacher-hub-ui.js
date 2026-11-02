// Teacher Hub: Mastery map and Practice-sheet studio (Enterprise 8). Reads the class the teacher already opened in
// "Class insights" (learner files or this device) and shows it as a table of learners by skill. Every cell is a symbol
// plus words plus a pattern, never colour alone, and the table is a real <table> with row and column headers.
// Nothing leaves the device: exports are files the teacher saves, sheets print through the lab's own print path.
import { getLang } from "../i18n.js";
import {
  buildClassModel,
  describeCell,
  gradeSkills,
  heatmapCsv,
  STATE_MARK,
  STATE_ORDER,
} from "./class-model.js";
import { STATE_LABELS } from "./mastery-evidence.js";
import { DOMAINS } from "./tokens.js";
import { buildPacket, renderSheet } from "./print-engine.js";

const lang = () => (getLang() === "es" ? "es" : "en");
const L = (en, es) => (lang() === "es" ? es : en);
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
const DOMAIN_NAMES = {
  number: ["Number sense", "Sentido numérico"],
  operations: ["Operations", "Operaciones"],
  fractions: ["Fractions and decimals", "Fracciones y decimales"],
  ratio: ["Ratio and rates", "Razones y tasas"],
  algebra: ["Algebra", "Álgebra"],
  geometry: ["Geometry", "Geometría"],
  data: ["Data", "Datos"],
  measurement: ["Measurement", "Medición"],
};
const domainName = (d) =>
  DOMAIN_NAMES[d] ? DOMAIN_NAMES[d][lang() === "es" ? 1 : 0] : d;
const saveFile = (name, text, type) => {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = Object.assign(document.createElement("a"), {
    href: url,
    download: name,
  });
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};

export function mountMasteryMap(
  host,
  { klass, grade, onPlan, onPrint, announce = () => {} },
) {
  const ui = {
    grade: Number(klass.state.grade ?? grade) || 1,
    domain: "all",
    attentionOnly: false,
    selected: null,
    sheet: null,
  };

  function model() {
    const learners = klass.learners();
    return learners.length
      ? buildClassModel(learners, { grade: ui.grade })
      : null;
  }

  function render() {
    const m = model();
    const gradeOptions = [1, 2, 3, 4, 5, 6, 7, 8]
      .map(
        (g) =>
          `<option value="${g}" ${g === ui.grade ? "selected" : ""}>${esc(L(`Grade ${g}`, `Grado ${g}`))}</option>`,
      )
      .join("");
    const domainOptions = ["all", ...DOMAINS]
      .map(
        (d) =>
          `<option value="${d}" ${d === ui.domain ? "selected" : ""}>${esc(d === "all" ? L("All strands", "Todas las áreas") : domainName(d))}</option>`,
      )
      .join("");
    const controls = `<div class="e8th-controls"><label>${esc(L("Grade", "Grado"))}<select data-th-grade>${gradeOptions}</select></label><label>${esc(L("Strand", "Área"))}<select data-th-domain>${domainOptions}</select></label><label class="e8th-check"><input type="checkbox" data-th-attention ${ui.attentionOnly ? "checked" : ""}> ${esc(L("Only learners who need attention", "Solo estudiantes que necesitan atención"))}</label></div>`;
    host.innerHTML = `<section class="e8th" aria-labelledby="e8th-title"><h3 id="e8th-title">${esc(L("Mastery map", "Mapa de dominio"))}</h3><p>${esc(L("Each cell shows what a learner has done on their own for a skill. Speed is never used, and help during practice is kept separate.", "Cada celda muestra lo que cada estudiante ha hecho por sí solo en una destreza. Nunca se usa la velocidad y la ayuda durante la práctica se mantiene aparte."))}</p>${controls}${m ? body(m) : `<p class="e8th-empty" role="status">${esc(L("Open learner files or use this device in “Class insights” to see the map.", "Abre archivos de estudiantes o usa este dispositivo en “Panorama de la clase” para ver el mapa."))}</p>`}${printStudio()}</section>`;
    wire(m);
  }

  const legend = () =>
    `<ul class="e8th-legend" aria-label="${esc(L("Legend", "Leyenda"))}">${STATE_ORDER.map((s) => `<li><span class="e8th-mark e8th-p-${STATE_MARK[s].pattern}" aria-hidden="true">${STATE_MARK[s].symbol}</span> ${esc(STATE_LABELS[s][lang()])}</li>`).join("")}</ul>`;

  function body(m) {
    const skills = m.skills.filter(
      (s) => ui.domain === "all" || s.domain === ui.domain,
    );
    const rows = m.rows.filter((r) => !ui.attentionOnly || r.attention);
    const head = `<tr><th scope="col" class="e8th-corner">${esc(L("Learner", "Estudiante"))}</th>${skills.map((s) => `<th scope="col" class="e8th-skill${m.columns.find((c) => c.key === s.key)?.flagged ? " e8th-flag" : ""}" title="${esc(s.title)}"><span>${esc(s.title)}</span>${m.columns.find((c) => c.key === s.key)?.flagged ? `<small>${esc(L("Reteach", "Reenseñar"))}</small>` : ""}</th>`).join("")}</tr>`;
    const trs = rows
      .map(
        (r) =>
          `<tr><th scope="row">${esc(r.learner.label)}${r.attention ? ` <span class="e8th-attn">${esc(L("needs attention", "necesita atención"))}</span>` : ""}</th>${skills
            .map((s) => {
              const c = r.cells[s.key];
              const mk = STATE_MARK[c.state];
              return `<td><button type="button" class="e8th-cell e8th-p-${mk.pattern}" data-th-cell="${esc(r.learner.id)}|${esc(s.key)}" aria-label="${esc(describeCell(r.learner.label, s.title, c, lang()))}"><span aria-hidden="true">${mk.symbol}</span><span class="e8th-word">${esc(STATE_LABELS[c.state][lang()])}</span>${c.thin ? `<small>${esc(L("early", "inicial"))}</small>` : ""}</button></td>`;
            })
            .join("")}</tr>`,
      )
      .join("");
    const detail = ui.selected ? detailFor(m, ui.selected) : "";
    const reteach = m.reteach.length
      ? `<h4>${esc(L("Skills to reteach", "Destrezas para reenseñar"))}</h4><ul class="e8th-reteach">${m.reteach.map((r) => `<li><b>${esc(r.title)}</b> ${esc(r.reason[lang()])} <span>${esc(r.needing.join(", "))}</span> <button type="button" class="t4-btn" data-th-plan="${esc(r.key)}">${esc(L("Add to assignment", "Añadir a una tarea"))}</button></li>`).join("")}</ul>`
      : `<p>${esc(L("No skill is flagged for the whole class. A skill is flagged when at least 2 learners, and 40% of those with evidence, are still developing it or need a review (classes of 3 or more).", "Ninguna destreza está marcada para toda la clase. Se marca cuando al menos 2 estudiantes, y el 40% de quienes tienen evidencia, aún la desarrollan o necesitan repasar (clases de 3 o más)."))}</p>`;
    const clusters = m.clusters.length
      ? `<h4>${esc(L("Shared answer patterns", "Patrones de respuesta compartidos"))}</h4><ul>${m.clusters.map((c) => `<li>${esc(c.id)}: ${esc(c.learners.join(", "))}</li>`).join("")}</ul>`
      : "";
    return `<p class="e8th-note">${esc(m.caveats[lang()])}</p>${legend()}<div class="e8th-scroll" tabindex="0" role="region" aria-label="${esc(L("Mastery map table", "Tabla del mapa de dominio"))}"><table class="e8th-table"><caption>${esc(L(`Grade ${m.grade} skills, ${rows.length} learners`, `Destrezas de grado ${m.grade}, ${rows.length} estudiantes`))}</caption><thead>${head}</thead><tbody>${trs}</tbody></table></div><div class="e8th-detail" role="status" aria-live="polite">${detail}</div>${reteach}${clusters}<div class="e8th-row"><button type="button" class="t4-btn" data-th-csv>${esc(L("Save map as a spreadsheet (CSV)", "Guardar el mapa como hoja de cálculo (CSV)"))}</button></div>`;
  }

  function detailFor(m, sel) {
    const [id, key] = sel.split("|");
    const row = m.rows.find((r) => r.learner.id === id);
    const skill = m.skills.find((s) => s.key === key);
    if (!row || !skill) return "";
    const c = row.cells[key];
    return `<p><b>${esc(describeCell(row.learner.label, skill.title, c, lang()))}</b>${c.overdue ? ` ${esc(L("A review is due.", "Toca un repaso."))}` : ""}</p>`;
  }

  function printStudio() {
    const skills = gradeSkills(ui.grade);
    const options = skills
      .map((s) => `<option value="${esc(s.key)}">${esc(s.title)}</option>`)
      .join("");
    return `<details class="e8th-print"><summary>${esc(L("Practice sheet studio", "Estudio de hojas de práctica"))}</summary><p>${esc(L("A sheet and its answer key come from one seed, so they always match. There is no timer.", "Una hoja y su clave salen de una misma semilla, así que siempre coinciden. No hay cronómetro."))}</p><form class="e8th-form" data-th-form><label>${esc(L("Skills (choose one or more)", "Destrezas (elige una o más)"))}<select multiple size="6" name="skills" required>${options}</select></label><label>${esc(L("Problems", "Problemas"))}<input type="number" name="count" min="4" max="40" value="12"></label><label>${esc(L("Level", "Nivel"))}<select name="level"><option value="0">${esc(L("Picture-first", "Primero con imágenes"))}</option><option value="1" selected>${esc(L("Grade level", "Nivel del grado"))}</option><option value="2">${esc(L("Challenge", "Desafío"))}</option></select></label><label>${esc(L("Language", "Idioma"))}<select name="language"><option value="en">English</option><option value="es">Español</option><option value="both">English / Español</option></select></label><label>${esc(L("For", "Para"))}<select name="audience"><option value="student">${esc(L("Student", "Estudiante"))}</option><option value="family">${esc(L("Family", "Familia"))}</option></select></label><label class="e8th-check"><input type="checkbox" name="large"> ${esc(L("Large print", "Letra grande"))}</label><label>${esc(L("Seed (same seed, same sheet)", "Semilla (misma semilla, misma hoja)"))}<input type="number" name="seed" min="1" max="999999" value="${Math.floor(Date.now() / 86400000) % 999999 || 1}"></label><div class="e8th-row"><button type="submit" class="t4-btn">${esc(L("Print student sheet", "Imprimir hoja del estudiante"))}</button><button type="button" class="t4-btn" data-th-key>${esc(L("Print answer key", "Imprimir la clave"))}</button><button type="button" class="t4-btn" data-th-save>${esc(L("Save both as files", "Guardar ambos como archivos"))}</button></div></form></details>`;
  }

  function readForm(form) {
    const data = new FormData(form);
    return {
      skills: data.getAll("skills"),
      count: Number(data.get("count")) || 12,
      level: Number(data.get("level")),
      language: data.get("language"),
      audience: data.get("audience"),
      large: data.get("large") === "on",
      seed: Number(data.get("seed")) || 1,
    };
  }

  function wire(m) {
    host.querySelector("[data-th-grade]")?.addEventListener("change", (e) => {
      ui.grade = Number(e.target.value);
      ui.selected = null;
      render();
    });
    host.querySelector("[data-th-domain]")?.addEventListener("change", (e) => {
      ui.domain = e.target.value;
      render();
    });
    host
      .querySelector("[data-th-attention]")
      ?.addEventListener("change", (e) => {
        ui.attentionOnly = e.target.checked;
        render();
      });
    host.querySelectorAll("[data-th-cell]").forEach((b) =>
      b.addEventListener("click", () => {
        ui.selected = b.dataset.thCell;
        host.querySelector(".e8th-detail").innerHTML = detailFor(
          m,
          ui.selected,
        );
      }),
    );
    host.querySelectorAll("[data-th-plan]").forEach((b) =>
      b.addEventListener("click", () => {
        const skill = m.skills.find((s) => s.key === b.dataset.thPlan);
        onPlan?.({
          grade: ui.grade,
          keys: [b.dataset.thPlan],
          count: 5,
          mode: "guided",
          tiers: [1, 3],
          target: { score: 70, days: 2 },
          label: L(`Reteach: ${skill?.title}`, `Reenseñar: ${skill?.title}`),
        });
      }),
    );
    host.querySelector("[data-th-csv]")?.addEventListener("click", () => {
      saveFile(
        `mastery-map-grade-${m.grade}.csv`,
        heatmapCsv(m, lang()),
        "text/csv",
      );
      announce(
        L("Map saved as a spreadsheet.", "Mapa guardado como hoja de cálculo."),
      );
    });
    const form = host.querySelector("[data-th-form]");
    const make = () => {
      const o = readForm(form);
      if (!o.skills.length) {
        announce(
          L("Choose at least one skill.", "Elige al menos una destreza."),
        );
        return null;
      }
      return {
        o,
        packet: buildPacket({
          ...o,
          title: L("Fluency practice", "Práctica de fluidez"),
        }),
      };
    };
    form?.addEventListener("submit", (e) => {
      e.preventDefault();
      const made = make();
      if (!made) return;
      const sheet = renderSheet(made.packet.sheet, {
        audience: made.o.audience,
        language: made.o.language,
        large: made.o.large,
        title: L("Fluency practice", "Práctica de fluidez"),
        fragment: true,
      });
      onPrint?.(sheet);
    });
    host.querySelector("[data-th-key]")?.addEventListener("click", () => {
      const made = make();
      if (!made) return;
      onPrint?.(
        renderSheet(made.packet.sheet, {
          audience: "teacher",
          language: made.o.language,
          large: made.o.large,
          title: L("Fluency practice", "Práctica de fluidez"),
          fragment: true,
        }),
      );
    });
    host.querySelector("[data-th-save]")?.addEventListener("click", () => {
      const made = make();
      if (!made) return;
      saveFile(
        `practice-seed-${made.o.seed}.html`,
        made.packet.student,
        "text/html",
      );
      saveFile(
        `practice-seed-${made.o.seed}-key.html`,
        made.packet.key,
        "text/html",
      );
    });
  }

  render();
  return { refresh: render };
}
