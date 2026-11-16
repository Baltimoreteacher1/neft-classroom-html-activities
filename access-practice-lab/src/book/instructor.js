// Book Studio 2.0 · the teacher workspace (/book-studio/teacher): create a differentiated assignment in one guided
// form, manage assignments, and review learning evidence (a class's server-side records, or a student's book file).
// Everything descriptive: no WIDA level and no ACCESS-equivalent score is ever produced here.
import * as db from "./db.js";
import { download, exportProject, importProject } from "./export.js";
import { bkIcon } from "./icons.js";
import { PACKS, instantiatePack } from "./lang/library.js";
import {
  INTENSITY_LABEL,
  KEY_LANGUAGE_USES,
  LEVELS,
  STANDARD_LABEL,
  planForLevel,
  profileLabel,
} from "./lang/profiles.js";
import { evidenceReport } from "./lang/work.js";
import { KINDS, bookFromTemplate, newBook } from "./model.js";
import { esc } from "./render.js";
import { CREATION_MODES, adventureSkeleton } from "./story.js";
import { TEMPLATES, templateById } from "./templates.js";
import { makePage } from "./model.js";

const BASE = "/access-practice-lab";
const CLUSTERS = ["K", "1", "2-3", "4-5", "6-8", "9-12"];

export async function mountTeacher(root, ctx, I, { go }) {
  const tr = I.S;
  const lang = I.spanish ? "es" : "en";
  let books = await db.listBooks();
  const S = { evidence: null, student: null, status: "" };
  const assignmentBooks = () =>
    books.filter((b) => b.assignment?.role === "teacher" || (b.supports.length && !b.assignment));

  const draw = () => {
    root.innerHTML = `<section class="bk-teacher">
      <header class="bk-hero"><div class="bk-hero-text"><p class="eyebrow">${esc(tr("For teachers", "Para docentes"))}</p><h1 tabindex="-1">${esc(tr("Teacher workspace", "Espacio del docente"))}</h1>
      <p class="lead">${esc(tr("Create one assignment for the whole class. Every student does the same story task; each gets the language help that fits. Preview each profile, adjust, and see the evidence.", "Crea una tarea para toda la clase. Todos hacen la misma tarea de cuento; cada uno recibe la ayuda de lenguaje que le conviene. Mira cada perfil, ajusta y revisa la evidencia."))}</p>
      <p class="fine">${esc(tr("This workspace runs in your browser. Student work stays private unless a class is connected. Profiles are support recipes, not WIDA levels or scores.", "Este espacio funciona en tu navegador. El trabajo de los estudiantes es privado salvo que haya una clase conectada. Los perfiles son recetas de apoyo, no niveles ni puntajes de WIDA."))}</p></div></header>
      <section class="panel" aria-labelledby="tA"><h2 id="tA">${bkIcon("plus")} ${esc(tr("1. Create an assignment", "1. Crear una tarea"))}</h2>${createFormHTML()}</section>
      <section class="panel" aria-labelledby="tB"><h2 id="tB">${bkIcon("book")} ${esc(tr("2. My assignments", "2. Mis tareas"))}</h2>${listHTML()}</section>
      <section class="panel" aria-labelledby="tC"><h2 id="tC">${bkIcon("feedback")} ${esc(tr("3. Learning evidence", "3. Evidencia de aprendizaje"))}</h2>${evidenceHTML()}</section>
      <p class="fine" role="status" data-t-status>${esc(S.status)}</p></section>`;
    root.querySelector("h1")?.focus({ preventScroll: true });
  };

  function createFormHTML() {
    const kinds = KINDS.map((k) => `<option value="${k.id}">${esc(k[lang])}</option>`).join("");
    const tpls = TEMPLATES.slice(0, 60)
      .map(
        (t) =>
          `<option value="${t.id}">${esc(typeof t.title === "object" ? t.title[lang] || t.title.en : t.title)}</option>`,
      )
      .join("");
    return `<form class="bk-t-form" data-t-create novalidate>
      <div class="bk-grid2"><label class="bk-f"><span>${esc(tr("Assignment title", "Título de la tarea"))}</span><input name="title" required maxlength="80" placeholder="${esc(tr("Write an interactive mystery", "Escribe un misterio interactivo"))}"></label>
      <label class="bk-f"><span>${esc(tr("Grade cluster", "Grupo de grados"))}</span><select name="grade">${CLUSTERS.map((c) => `<option ${c === "4-5" ? "selected" : ""}>${c}</option>`).join("")}</select></label></div>
      <label class="bk-f"><span>${esc(tr("The task every student does (same for all)", "La tarea que hacen todos (igual para todos)"))}</span><textarea name="task" rows="3" maxlength="400" placeholder="${esc(tr("Develop a setting, characters, a problem, clues, logical events and a resolution.", "Desarrolla un escenario, personajes, un problema, pistas, hechos lógicos y una resolución."))}"></textarea></label>
      <div class="bk-grid2"><label class="bk-f"><span>${esc(tr("Story mode", "Modo de cuento"))}</span><select name="mode">${CREATION_MODES.map((m) => `<option value="${m.id}">${esc(m[lang])}</option>`).join("")}</select></label>
      <label class="bk-f"><span>${esc(tr("Starting point", "Punto de partida"))}</span><select name="start"><option value="kind:narrative">${esc(tr("Blank narrative", "Narración en blanco"))}</option>${`<optgroup label="${esc(tr("Kinds of book", "Tipos de libro"))}">${kinds}</optgroup>`.replace(/value="/g, 'value="kind:')}<optgroup label="${esc(tr("Templates", "Plantillas"))}">${tpls.replace(/value="/g, 'value="tpl:')}</optgroup></select></label></div>
      <fieldset><legend>${esc(tr("Language objective", "Objetivo de lenguaje"))}</legend><div class="bk-grid2"><label class="bk-f"><span>${esc(tr("Objective (what students will do with language)", "Objetivo (qué harán los estudiantes con el lenguaje)"))}</span><input name="objective" maxlength="300" placeholder="${esc(tr("Explain why a clue matters using because and so", "Explicar por qué importa una pista con porque y entonces"))}"></label>
      <label class="bk-f"><span>${esc(tr("Key Language Use", "Uso clave del lenguaje"))}</span><select name="klu"><option value="">—</option>${KEY_LANGUAGE_USES.map((k) => `<option>${k}</option>`).join("")}</select></label>
      <label class="bk-f"><span>${esc(tr("ELD Standard (WIDA 2020)", "Estándar ELD (WIDA 2020)"))}</span><select name="std"><option value="">—</option>${Object.entries(
        STANDARD_LABEL,
      )
        .map(([k, l]) => `<option value="${k}">${esc(l)}</option>`)
        .join("")}</select></label></div></fieldset>
      <fieldset><legend>${esc(tr("Support packs to start from (everything stays editable)", "Paquetes de apoyo para empezar (todo sigue siendo editable)"))}</legend><div class="bk-chkrow">${PACKS.map((p) => `<label class="bk-chk"><input type="checkbox" name="pack" value="${p.id}" ${["mystery-1-2", "narrative-3-4", "argument-4-5"].includes(p.id) ? "checked" : ""}> <span>${esc(p.title)}</span></label>`).join("")}</div></fieldset>
      <fieldset><legend>${esc(tr("Starting support groups", "Grupos de apoyo iniciales"))}</legend><p class="fine">${esc(tr("Three groups are created. Change names, profiles and intensity any time. You assign students to groups after publishing to your class.", "Se crean tres grupos. Cambia nombres, perfiles e intensidad cuando quieras. Asignas estudiantes a los grupos después de publicar en tu clase."))}</p></fieldset>
      <div class="bk-btnrow"><button type="submit" class="btn btn-primary btn-big">${bkIcon("check")} ${esc(tr("Create the assignment and open the Support Studio", "Crear la tarea y abrir el Estudio de apoyos"))}</button></div></form>`;
  }

  function listHTML() {
    const list = assignmentBooks();
    if (!list.length)
      return `<p class="fine">${esc(tr("No assignments yet. Create one above.", "Aún no hay tareas. Crea una arriba."))}</p>`;
    return `<ul class="bk-assign">${list
      .map(
        (
          b,
        ) => `<li><div><strong>${esc(b.assignment?.title || b.title)}</strong><span class="fine">${b.supports.length} ${esc(tr("supports", "apoyos"))} · ${b.groups.length} ${esc(tr("groups", "grupos"))} · ${esc(b.mode)}${b.assignment?.classCode ? ` · ${esc(tr("published to class", "publicada en la clase"))} ${esc(b.assignment.classCode)}` : ""}</span></div>
        <div class="bk-btnrow"><a class="btn small" href="${BASE}/book-studio/edit/${b.id}">${esc(tr("Open the book", "Abrir el libro"))}</a><button type="button" class="btn small" data-t="studio" data-id="${b.id}">${esc(tr("Language Support Studio", "Estudio de apoyos"))}</button><button type="button" class="btn small" data-t="preview" data-id="${b.id}">${bkIcon("eye")} ${esc(tr("Preview as student", "Ver como estudiante"))}</button><button type="button" class="btn small ghost" data-t="template" data-id="${b.id}">${esc(tr("Save as a reusable template", "Guardar como plantilla reutilizable"))}</button></div></li>`,
      )
      .join("")}</ul>`;
  }

  function evidenceHTML() {
    const list = assignmentBooks();
    const classBlock = `<h3>${esc(tr("From a class", "De una clase"))}</h3><p class="fine">${esc(tr("Needs an assignment published to a class. Support use and work come from each student's own device and are stored under that student only.", "Requiere una tarea publicada en una clase. El uso de apoyos y el trabajo vienen del dispositivo de cada estudiante y se guardan solo bajo ese estudiante."))}</p>
      <div class="bk-grid2"><label class="bk-f"><span>${esc(tr("Assignment", "Tarea"))}</span><select data-e="book">${list.map((b) => `<option value="${b.id}">${esc(b.assignment?.title || b.title)}</option>`).join("")}</select></label><label class="bk-f"><span>${esc(tr("Class code", "Código de clase"))}</span><input data-e="code" maxlength="6" autocapitalize="characters"></label><label class="bk-f"><span>${esc(tr("Class teacher passcode", "Clave de docente"))}</span><input data-e="pass" type="password" autocomplete="off" maxlength="40"></label></div>
      <div class="bk-btnrow"><button type="button" class="btn" data-t="load-evidence" ${list.length ? "" : "disabled"}>${esc(tr("Load evidence", "Cargar evidencia"))}</button></div>${S.evidence ? evidenceTable() : ""}`;
    const fileBlock = `<h3>${esc(tr("From a student's book file", "De un archivo de libro de un estudiante"))}</h3><div class="bk-btnrow"><button type="button" class="btn" data-t="open-file">${bkIcon("upload")} ${esc(tr("Open a student's book file", "Abrir el archivo de un estudiante"))}</button><input type="file" hidden accept=".langbook,.zip,.json" data-t-file></div>${S.student ? studentBlock() : ""}`;
    return `${classBlock}${fileBlock}`;
  }

  function evidenceTable() {
    const ev = S.evidence;
    return `<div class="bk-ev"><h4>${esc(ev.assignment.title)}</h4>${
      ev.students.length
        ? ev.students
            .map(
              (
                s,
              ) => `<details class="bk-ev-stu"><summary><strong>${esc(s.alias)}</strong> · ${esc(s.plan.group || (s.plan.source === "student" ? tr("individual plan", "plan individual") : tr("class default", "plan de la clase")))} · ${esc(tr(...INTENSITY_LABEL[s.plan.intensity]))} · ${s.revisions.length} ${esc(tr("revisions", "revisiones"))}</summary>
      <table class="bk-ev-table"><caption class="sr-only">${esc(tr("Support use", "Uso de apoyos"))}</caption><thead><tr><th scope="col">${esc(tr("Support", "Apoyo"))}</th><th scope="col">${esc(tr("Opened", "Abierto"))}</th><th scope="col">${esc(tr("Used", "Usado"))}</th><th scope="col">${esc(tr("Finished", "Terminado"))}</th><th scope="col">${esc(tr("Hidden", "Oculto"))}</th><th scope="col">${esc(tr("Independent", "Independiente"))}</th></tr></thead><tbody>${s.usage.map((u) => `<tr><th scope="row">${esc(u.title)}${u.required ? ` (${esc(tr("required", "requerido"))})` : ""}</th><td>${u.opened}</td><td>${u.used}</td><td>${u.completed}</td><td>${u.hidden}</td><td>${u.independent}</td></tr>`).join("")}</tbody></table>
      ${s.revisions.map((r) => `<div class="bk-sp-compare"><section><h5>${esc(tr("Before", "Antes"))} (${esc(r.by)})</h5><p>${esc(r.before)}</p></section><section><h5>${esc(tr("After", "Después"))}</h5><p>${esc(r.after)}</p>${r.note ? `<p class="fine">${esc(tr("Student reflection:", "Reflexión del estudiante:"))} ${esc(r.note)}</p>` : ""}</section></div>`).join("")}
      ${s.texts.length ? `<h5>${esc(tr("Current writing", "Escritura actual"))}</h5>${s.texts.map((t) => `<p class="fine">${esc(t.text)}</p>`).join("")}` : ""}
      <form class="bk-t-adjust" data-adjust="${esc(s.alias)}"><fieldset><legend>${esc(tr("Change this student's plan (a reason is kept)", "Cambiar el plan de este estudiante (se guarda el motivo)"))}</legend><div class="bk-grid2">
        <label class="bk-f"><span>${esc(tr("Support profile", "Perfil de apoyo"))}</span><select name="profile"><option value="">${esc(tr("keep", "mantener"))}</option>${LEVELS.map((l) => `<option value="${l.n}">${esc(profileLabel(l.n, tr))}</option>`).join("")}</select></label>
        <label class="bk-f"><span>${esc(tr("Intensity", "Intensidad"))}</span><select name="intensity"><option value="">${esc(tr("keep", "mantener"))}</option>${["heavy", "moderate", "minimal", "help", "none"].map((i) => `<option value="${i}">${esc(tr(...INTENSITY_LABEL[i]))}</option>`).join("")}</select></label>
        <label class="bk-f"><span>${esc(tr("Reason", "Motivo"))}</span><input name="reason" maxlength="300" required></label></div><button type="submit" class="btn small">${esc(tr("Save change", "Guardar cambio"))}</button></fieldset></form></details>`,
            )
            .join("")
        : `<p class="fine">${esc(tr("No student activity yet.", "Aún no hay actividad de estudiantes."))}</p>`
    }
      <div class="bk-btnrow"><button type="button" class="btn small" data-t="csv">${bkIcon("export")} ${esc(tr("Export a CSV summary", "Exportar un resumen CSV"))}</button></div></div>`;
  }

  function studentBlock() {
    const b = S.student;
    const w = b.work;
    return `<div class="bk-ev"><h4>${esc(b.title)}</h4><p class="fine">${w.attempts.length} ${esc(tr("first attempts", "primeros intentos"))} · ${w.revisions.length} ${esc(tr("revisions", "revisiones"))} (${w.revisions.filter((r) => r.by === "assisted").length} ${esc(tr("assisted", "asistidas"))})</p>
      ${w.revisions.map((r) => `<div class="bk-sp-compare"><section><h5>${esc(tr("Original", "Original"))}</h5><p>${esc(r.before)}</p></section><section><h5>${esc(tr("Revised", "Revisado"))} (${esc(r.by)})</h5><p>${esc(r.after)}</p>${r.note ? `<p class="fine">${esc(r.note)}</p>` : ""}</section></div>`).join("") || `<p class="fine">${esc(tr("No revisions recorded.", "No hay revisiones registradas."))}</p>`}
      <div class="bk-btnrow"><button type="button" class="btn small" data-t="report">${bkIcon("export")} ${esc(tr("Export an evidence summary", "Exportar un resumen de evidencia"))}</button><a class="btn small" href="${BASE}/book-studio/review/${esc(b.id)}">${esc(tr("Open with teacher notes", "Abrir con notas del docente"))}</a></div>
      <p class="fine">${esc(tr("This summary describes what happened. Word count, long sentences and tool use are not evidence of language growth, and no WIDA level or ACCESS score is calculated.", "Este resumen describe lo ocurrido. La cantidad de palabras, las oraciones largas y el uso de herramientas no son evidencia de crecimiento del lenguaje, y no se calcula ningún nivel de WIDA ni puntaje ACCESS."))}</p></div>`;
  }

  const status = (m) => {
    S.status = m;
    const n = root.querySelector("[data-t-status]");
    if (n) n.textContent = m;
  };

  draw();
  root.addEventListener("submit", async (e) => {
    if (e.target.matches("[data-t-create]")) {
      e.preventDefault();
      const f = new FormData(e.target);
      const title =
        String(f.get("title") || "")
          .trim()
          .slice(0, 80) || tr("My assignment", "Mi tarea");
      const [src, id] = String(f.get("start")).split(":");
      const t = src === "tpl" ? templateById(id) : null;
      const base = t
        ? bookFromTemplate(t, { title, lang })
        : newBook({ kind: id || "narrative", title, lang });
      const mode = String(f.get("mode"));
      base.mode = mode;
      if (!t && mode === "adventure") adventureSkeleton(base, makePage);
      base.gradeCluster = String(f.get("grade"));
      const objective = String(f.get("objective") || "").trim();
      base.objectives =
        objective || f.get("klu")
          ? [
              {
                id: `ob${Date.now().toString(36)}`,
                text: objective,
                keyUse: String(f.get("klu") || ""),
                standard: String(f.get("std") || ""),
              },
            ]
          : [];
      base.assignment = {
        id: "",
        title,
        task: String(f.get("task") || "").trim(),
        classCode: "",
        role: "teacher",
      };
      base.groups = [
        {
          id: "grpa1",
          name: tr("Group A (profiles 1–2)", "Grupo A (perfiles 1–2)"),
          plan: planForLevel(1),
        },
        {
          id: "grpb1",
          name: tr("Group B (profiles 3–4)", "Grupo B (perfiles 3–4)"),
          plan: planForLevel(3),
        },
        {
          id: "grpc1",
          name: tr("Group C (profiles 5–6)", "Grupo C (perfiles 5–6)"),
          plan: planForLevel(5),
        },
      ];
      base.plan = planForLevel(3);
      const chosen = PACKS.filter((p) => f.getAll("pack").includes(p.id));
      base.supports = chosen
        .flatMap((p) => instantiatePack(p, { scope: "book" }))
        .map((s, i) => ({ ...s, order: i, gradeClusters: [] }));
      const saved = await db.saveBook(base);
      await db.saveVersion(saved, tr("New assignment", "Tarea nueva")).catch(() => {});
      try {
        sessionStorage.setItem("bkOpenStudio", `${saved.id}:manage`);
      } catch {}
      go(`/edit/${saved.id}`);
    } else if (e.target.matches("[data-adjust]")) {
      e.preventDefault();
      const f = new FormData(e.target);
      const sel = root.querySelector('[data-e="book"]');
      const book = books.find((b) => b.id === sel.value);
      try {
        const { adjustStudent, loadEvidence } = await import("./lang/class-sync.js");
        const profile = f.get("profile") ? Number(f.get("profile")) : null;
        const intensity = String(f.get("intensity") || "");
        const cur = S.evidence.students.find((s) => s.alias === e.target.dataset.adjust);
        const plan = {
          profile: profile ?? cur.plan.profile,
          intensity: intensity || cur.plan.intensity,
          domains: Object.fromEntries(
            Object.keys(cur.plan.domains).map((d) => [d, intensity || cur.plan.domains[d]]),
          ),
        };
        const creds = {
          code: root.querySelector('[data-e="code"]').value,
          passcode: root.querySelector('[data-e="pass"]').value,
        };
        await adjustStudent(book, {
          ...creds,
          alias: e.target.dataset.adjust,
          plan,
          reason: String(f.get("reason")),
        });
        S.evidence = await loadEvidence(book, creds);
        status(tr("Plan changed and logged.", "Plan cambiado y registrado."));
        draw();
      } catch (error) {
        status(
          error?.userMessage || tr("Could not save that change.", "No se pudo guardar el cambio."),
        );
      }
    }
  });
  root.addEventListener("click", async (e) => {
    const b = e.target.closest("[data-t]");
    if (!b) return;
    const act = b.dataset.t;
    const book = books.find((x) => x.id === b.dataset.id);
    if (act === "studio" || act === "preview") {
      try {
        sessionStorage.setItem(
          "bkOpenStudio",
          `${book.id}:${act === "studio" ? "manage" : "preview"}`,
        );
      } catch {}
      go(`/edit/${book.id}`);
    } else if (act === "template") {
      const copy = {
        ...JSON.parse(JSON.stringify(book)),
        id: "",
        title: `${book.title} (template)`.slice(0, 80),
        work: undefined,
        status: "draft",
        assignment: { ...book.assignment, id: "", classCode: "" },
      };
      const saved = await db.saveBook(copy);
      books = await db.listBooks();
      status(
        `${tr("Saved a copy you can reuse:", "Se guardó una copia que puedes reutilizar:")} ${saved.title}.`,
      );
      draw();
    } else if (act === "load-evidence") {
      const sel = books.find((x) => x.id === root.querySelector('[data-e="book"]').value);
      if (!sel?.assignment?.id)
        return status(
          tr(
            "Publish this assignment to your class first (Language Support Studio → Plans & groups).",
            "Primero publica esta tarea en tu clase (Estudio de apoyos → Planes y grupos).",
          ),
        );
      try {
        const { loadEvidence } = await import("./lang/class-sync.js");
        S.evidence = await loadEvidence(sel, {
          code: root.querySelector('[data-e="code"]').value,
          passcode: root.querySelector('[data-e="pass"]').value,
        });
        draw();
      } catch (error) {
        status(
          error?.userMessage ||
            tr("Could not load the evidence.", "No se pudo cargar la evidencia."),
        );
      }
    } else if (act === "csv") {
      const rows = [
        [
          "student",
          "plan_source",
          "intensity",
          "support",
          "opened",
          "used",
          "completed",
          "hidden",
          "independent",
          "revisions",
        ],
      ];
      for (const s of S.evidence.students)
        for (const u of s.usage)
          rows.push([
            s.alias,
            s.plan.source,
            s.plan.intensity,
            u.title,
            u.opened,
            u.used,
            u.completed,
            u.hidden,
            u.independent,
            s.revisions.length,
          ]);
      const csv = rows
        .map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))
        .join("\n");
      download(
        new Blob([csv], { type: "text/csv;charset=utf-8" }),
        "language-support-evidence.csv",
      );
    } else if (act === "open-file") root.querySelector("[data-t-file]").click();
    else if (act === "report") {
      download(
        new Blob([evidenceReport(S.student)], { type: "text/plain;charset=utf-8" }),
        `${S.student.title.replace(/[^\w-]+/g, "-")}-evidence.txt`,
      );
    }
  });
  root.addEventListener("change", async (e) => {
    if (!e.target.matches("[data-t-file]")) return;
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const res = await importProject(file);
      S.student = res.book || res;
      status("");
      draw();
    } catch {
      status(
        tr("That file could not be opened as a book.", "No se pudo abrir ese archivo como libro."),
      );
    }
  });
  void exportProject;
  return () => {};
}
