// Class dashboard 2.0 in the teacher class panel (docs/class-platform.md): the weekly brief, the goal meter and the
// completion tables, built by the pure engine in shared/class-platform/week-brief.js from what the class platform
// already returns to a teacher (roster summaries, the assignment status board) plus the authored unit data.
// Read-only: it writes nothing to the class, sends nothing to any model, and shows students by alias only.
// Behind the `class_dashboard_v2` flag (shared/flags/registry.js).
import { bcpssUnitOf } from "../../../shared/class-platform/bcpss-assignments.js";
import {
  briefText,
  buildDashboard,
  unitSnapshot,
} from "../../../shared/class-platform/week-brief.js";
import { pageFlag } from "../../../shared/flags/page-flag.js";
import { el } from "./dom.js";

export const DASHBOARD_FLAG = "class_dashboard_v2";
const MAX_UNIT_FETCH = 30;
const DOMAIN_LABEL = {
  listening: ["Listening", "Escuchar"],
  speaking: ["Speaking", "Hablar"],
  reading: ["Reading", "Leer"],
  writing: ["Writing", "Escribir"],
};

/** Unit snapshots for the units a class has assigned. Cached per page; a failed unit is simply left out. */
export async function loadUnits(ids, fetchImpl, cache = new Map()) {
  const wanted = [...new Set(ids)].filter((id) => id && !cache.has(id)).slice(0, MAX_UNIT_FETCH);
  await Promise.all(
    wanted.map(async (id) => {
      try {
        const res = await fetchImpl(`/api/bcpss/units/${encodeURIComponent(id)}`, {
          headers: { Accept: "application/json" },
        });
        if (res.ok) cache.set(id, unitSnapshot(await res.json()));
      } catch {
        /* offline: the brief falls back to the weakest domain */
      }
    }),
  );
  return Object.fromEntries(cache);
}

const pct = (n) => `${n}%`;
const meter = (S, label, value) =>
  el(
    "label",
    { class: "fine" },
    `${label} `,
    el(
      "meter",
      { min: "0", max: "100", value: String(value), "aria-label": `${label} ${pct(value)}` },
      pct(value),
    ),
    ` ${pct(value)}`,
  );

function table(S, caption, head, rows) {
  return el(
    "table",
    { class: "cls-table" },
    el("caption", { class: "fine" }, caption),
    el(
      "thead",
      {},
      el(
        "tr",
        {},
        head.map((h) => el("th", { scope: "col" }, h)),
      ),
    ),
    el(
      "tbody",
      {},
      rows.map((r) =>
        el(
          "tr",
          {},
          el("th", { scope: "row" }, r[0]),
          r.slice(1).map((c) => el("td", {}, String(c))),
        ),
      ),
    ),
  );
}

/** Render a built dashboard into `box`. `S(en, es)` picks the teacher's language. */
export function drawDashboard(box, S, dash) {
  const lang = S("en", "es");
  const text = briefText(dash, lang);
  const lines = [text.behind, text.reteach, text.celebrate].filter(Boolean);
  const copy = el(
    "button",
    {
      type: "button",
      class: "btn small ghost",
      onclick: () =>
        navigator.clipboard?.writeText(
          [text.headline, ...lines.map((t) => `- ${t}`)].join("\n"),
        ),
    },
    S("Copy this brief", "Copiar este resumen"),
  );
  const parts = [
    el("p", {}, el("strong", {}, text.headline)),
    el(
      "ul",
      { class: "cls-list" },
      lines.map((t) => el("li", {}, t)),
    ),
    dash.provenance.unitText === "draft"
      ? el(
          "p",
          { class: "fine" },
          S(
            "Unit text in this brief is draft and not yet reviewed. Built from class summaries only; no student work is read.",
            "El texto de unidad en este resumen es borrador y aún no se ha revisado. Se construye solo con resúmenes de la clase; no se lee el trabajo del estudiante.",
          ),
        )
      : el(
          "p",
          { class: "fine" },
          S(
            "Built from class summaries only; no student work is read.",
            "Se construye solo con resúmenes de la clase; no se lee el trabajo del estudiante.",
          ),
        ),
  ];
  if (dash.nextActivity)
    parts.push(
      el(
        "p",
        {},
        el(
          "a",
          { class: "btn small", href: dash.nextActivity.path },
          S(
            `Open next activity: ${dash.nextActivity.title}`,
            `Abrir la siguiente actividad: ${dash.nextActivity.title}`,
          ),
        ),
      ),
    );
  if (dash.goal)
    parts.push(
      meter(
        S,
        `${S("Class goal", "Meta de la clase")}: ${dash.goal.label || ""}`.trim(),
        dash.goal.percent,
      ),
    );
  parts.push(copy);
  if (dash.assignments) {
    parts.push(
      table(
        S,
        S(
          "Finished by unit (assigned work, all students)",
          "Terminado por unidad (tarea asignada, todos los estudiantes)",
        ),
        [
          S("Unit", "Unidad"),
          S("Assigned", "Asignado"),
          S("Finished", "Terminado"),
          S("Done", "Hecho"),
        ],
        dash.byUnit.map((u) => [S(u.label.en, u.label.es), u.assigned, u.finished, pct(u.percent)]),
      ),
      table(
        S,
        S(
          "By domain: finished assigned work and practice counts",
          "Por dominio: tarea terminada y cantidad de práctica",
        ),
        [
          S("Domain", "Dominio"),
          S("Assigned", "Asignado"),
          S("Finished", "Terminado"),
          S("Practice count", "Cantidad de práctica"),
        ],
        dash.byDomain.map((d) => [
          S(...DOMAIN_LABEL[d.key]),
          d.assigned,
          d.finished,
          dash.practice[d.key],
        ]),
      ),
      table(
        S,
        S("Assigned vs finished, by assignment", "Asignado y terminado, por tarea"),
        [
          S("Assignment", "Tarea"),
          S("Students", "Estudiantes"),
          S("Finished", "Terminado"),
          S("Late", "Tarde"),
        ],
        dash.byAssignment.map((a) => [a.title, a.assigned, a.finished, a.late]),
      ),
    );
  }
  box.replaceChildren(...parts);
}

/** Mount into `box`; call `update(roster)` after every roster load. */
export function mountDashboardV2(box, { S, api, fetchImpl = (...a) => fetch(...a) }) {
  const cache = new Map();
  let enabled = null;
  let run = 0;
  const flag = () => (enabled === null ? (enabled = pageFlag(DASHBOARD_FLAG, fetchImpl)) : enabled);
  async function update(roster) {
    const mine = ++run;
    if (!(await flag())) {
      box.replaceChildren();
      box.closest("section")?.setAttribute("hidden", "");
      return;
    }
    box.closest("section")?.removeAttribute("hidden");
    const settings = roster?.settings || {};
    const board = await api
      .astatusBoard()
      .then((r) => (r.ok ? r : null))
      .catch(() => null);
    const units = await loadUnits(
      (settings.assignments || []).map((a) => bcpssUnitOf(a.path)),
      fetchImpl,
      cache,
    );
    if (mine !== run) return;
    const students = (roster?.students || []).map((s) => ({
      studentId: s.studentId,
      alias: s.alias,
      summary: s.docs?.language?.summary,
    }));
    drawDashboard(box, S, buildDashboard({ now: Date.now(), students, settings, board, units }));
  }
  return { update, unmount: () => (run += 1) };
}
