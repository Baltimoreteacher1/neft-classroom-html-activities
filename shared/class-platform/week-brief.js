// Class dashboard 2.0 (teacher view): completion by unit and domain, assigned vs finished, the goal meter, and a
// three-bullet "this week" brief. Pure and deterministic: no DOM, no fetch, no clock (callers pass `now`), no model.
// It reads only what the class platform already returns to a teacher (roster summaries, the assignment status
// board, the class settings) plus authored unit data (activities, common_language_misconception). Students appear
// by ALIAS only: an alias that fails the platform's own alias rule is shown as "a student", and ids never leave here.
// Same shape as the Insight Brief engine (teacher-tools/insight-brief/insight-engine.js): input JSON in, one brief out.

import { isLate } from "./assignment-lifecycle.js";
import { activityItem, baseId, bcpssUnitOf, unitLabel } from "./bcpss-assignments.js";
import { goalProgress, SUMMARY_DOMAINS, validateAlias } from "./contract.js";

export const BRIEF_VERSION = 1;
const FINISHED = new Set(["submitted", "reviewed"]);
const MAX_NAMES = 3;
const DOMAIN_NAME = {
  listening: ["Listening", "Escuchar"],
  speaking: ["Speaking", "Hablar"],
  reading: ["Reading", "Leer"],
  writing: ["Writing", "Escribir"],
};
const PATH_DOMAIN = /\/(Reading|Writing|Speaking|Listening)\//i;

export const percent = (done, total) => (total > 0 ? Math.round((100 * done) / total) : 0);
const asc = (a, b) => (a < b ? -1 : a > b ? 1 : 0);

/** What the brief needs from one unit detail (/api/bcpss/units/:id): its activities, misconception and provenance. */
export function unitSnapshot(detail) {
  const m = detail?.connections?.[0]?.common_language_misconception;
  return {
    title: String(detail?.unit?.unit_title || ""),
    provenance: detail?.provenance?.state || "draft",
    misconception: m?.misconception_pattern
      ? { pattern: String(m.misconception_pattern), redirect: String(m.teacher_redirect || "") }
      : null,
    activities: (detail?.studio?.activities || []).map((a) => ({
      title: String(a.title || ""),
      domain: String(a.domain || ""),
    })),
  };
}

/** The alias a teacher may see: the platform's own rule decides, anything else becomes "A student". */
function safeAlias(raw) {
  const checked = validateAlias(raw);
  return checked.ok ? checked.alias : "A student";
}

/** Which unit (or lab band) and which domain an assignment belongs to. Domain is null when it spans a whole unit. */
export function classifyAssignment(assignment, units = {}) {
  const unitId = bcpssUnitOf(assignment.path);
  if (!unitId) {
    const band = /[?&]grades=([\w-]+)/.exec(String(assignment.path || ""))?.[1] || "6-8";
    const domain = PATH_DOMAIN.exec(String(assignment.path || ""))?.[1]?.toLowerCase() || null;
    return { group: `lab:${band}`, unitId: "", labBand: band, domain };
  }
  const [kind, , index] = baseId(assignment.id).split(":");
  let domain = null;
  if (kind === "wl") domain = "writing";
  if (kind === "sa") {
    const act = units[unitId]?.activities?.[Number(index) - 1];
    domain = SUMMARY_DOMAINS.includes(String(act?.domain).toLowerCase())
      ? String(act.domain).toLowerCase()
      : null;
  }
  return { group: unitId, unitId, labBand: "", domain };
}

function stateOf(board, assignmentId, studentId) {
  const row = board?.assignments?.find((a) => a.id === assignmentId);
  return row?.students?.find((s) => s.studentId === studentId) || null;
}

/** Slots are (released assignment x student). Finished = turned in or reviewed (board), or marked done by the learner's summary. */
function buildSlots({ students, assignments, board, units, now }) {
  const slots = [];
  for (const a of assignments) {
    const where = classifyAssignment(a, units);
    for (const s of students) {
      const row = stateOf(board, a.id, s.studentId);
      const doneIds = Array.isArray(s.summary?.assignmentsDone) ? s.summary.assignmentsDone : [];
      const finished =
        FINISHED.has(row?.state) || doneIds.some((id) => baseId(id) === baseId(a.id));
      const late = !finished && (row?.late === true || isLate(a.due, now));
      slots.push({ a, s, ...where, finished, late });
    }
  }
  return slots;
}

function tally(slots, keyOf) {
  const map = new Map();
  for (const slot of slots) {
    const key = keyOf(slot);
    if (key == null) continue;
    const row = map.get(key) || { key, assigned: 0, finished: 0, late: 0 };
    row.assigned += 1;
    if (slot.finished) row.finished += 1;
    if (slot.late) row.late += 1;
    map.set(key, row);
  }
  return [...map.values()].map((r) => ({ ...r, percent: percent(r.finished, r.assigned) }));
}

function groupLabel(group) {
  if (group.startsWith("lab:"))
    return {
      en: `Lab practice, grades ${group.slice(4)}`,
      es: `Práctica del laboratorio, grados ${group.slice(4)}`,
    };
  const label = unitLabel(group) || group;
  return { en: label, es: label };
}

/** Per-student totals from the slots. */
function studentRows(slots, students) {
  return students
    .map((s) => {
      const mine = slots.filter((x) => x.s === s);
      const finished = mine.filter((x) => x.finished).length;
      const open = tally(
        mine.filter((x) => !x.finished),
        (x) => x.group,
      ).sort((a, b) => b.assigned - a.assigned || asc(a.key, b.key));
      return {
        alias: safeAlias(s.alias),
        assigned: mine.length,
        finished,
        percent: percent(finished, mine.length),
        late: mine.filter((x) => x.late).length,
        weekDays: Number(s.summary?.weekDays) || 0,
        worstGroup: open[0]?.key || "",
      };
    })
    .sort((a, b) => asc(a.alias, b.alias));
}

function weakestDomain(byDomain, practice) {
  const order = SUMMARY_DOMAINS;
  const assigned = byDomain.filter((d) => d.assigned > 0);
  if (assigned.length > 1 || (assigned.length === 1 && assigned[0].percent < 100)) {
    return [...assigned].sort(
      (a, b) => a.percent - b.percent || order.indexOf(a.key) - order.indexOf(b.key),
    )[0].key;
  }
  return [...order].sort(
    (a, b) => practice[a] - practice[b] || order.indexOf(a) - order.indexOf(b),
  )[0];
}

function nextActivity(unitId, unit, domain, assignments) {
  const activities = unit?.activities || [];
  if (!unitId || !activities.length) return null;
  const taken = new Set(
    assignments.filter((a) => bcpssUnitOf(a.path) === unitId).map((a) => baseId(a.id)),
  );
  const open = activities
    .map((act, i) => ({ act, index: i + 1 }))
    .filter(({ index }) => !taken.has(`sa:${unitId}:${index}`) && !taken.has(`su:${unitId}`));
  const pool = open.length ? open : activities.map((act, i) => ({ act, index: i + 1 }));
  const pick = pool.find(({ act }) => String(act.domain).toLowerCase() === domain) || pool[0];
  const item = activityItem(unitId, pick.index, { title: pick.act.title });
  return {
    unitId,
    index: pick.index,
    title: String(pick.act.title || `Activity ${pick.index}`),
    domain: String(pick.act.domain || "").toLowerCase() || null,
    path: item.path,
  };
}

/**
 * Build the dashboard model and its three-bullet brief.
 * @param {{ now:number, students:Array<{studentId:string, alias:string, summary?:object}>, settings?:object,
 *           board?:object|null, units?:Record<string,object> }} input
 *   units[id] = { title, misconception:{pattern, redirect}|null, provenance:"draft"|"authored"|"reviewed", activities:[{title, domain}] }
 */
export function buildDashboard({ now, students = [], settings = {}, board = null, units = {} }) {
  const released = (settings.assignments || []).filter((a) => a.draft !== true);
  const slots = buildSlots({ students, assignments: released, board, units, now });
  const finished = slots.filter((x) => x.finished).length;
  const byUnit = tally(slots, (x) => x.group).map((r) => ({
    ...r,
    unitId: r.key.startsWith("lab:") ? "" : r.key,
    label: groupLabel(r.key),
  }));
  const byDomain = SUMMARY_DOMAINS.map(
    (d) =>
      tally(slots, (x) => (x.domain === d ? d : null))[0] || {
        key: d,
        assigned: 0,
        finished: 0,
        late: 0,
        percent: 0,
      },
  );
  const byAssignment = released.map((a) => {
    const mine = slots.filter((x) => x.a === a);
    return {
      id: a.id,
      title: String(a.title || a.id),
      due: a.due || null,
      assigned: mine.length,
      finished: mine.filter((x) => x.finished).length,
      late: mine.filter((x) => x.late).length,
      percent: percent(mine.filter((x) => x.finished).length, mine.length),
    };
  });
  const practice = Object.fromEntries(
    SUMMARY_DOMAINS.map((d) => [
      d,
      students.reduce((n, s) => n + (Number(s.summary?.domains?.[d]) || 0), 0),
    ]),
  );
  const rows = studentRows(slots, students);
  const avgDays = students.length
    ? Math.round((10 * rows.reduce((n, r) => n + r.weekDays, 0)) / students.length) / 10
    : 0;
  const goal = goalProgress(
    settings.goal,
    students.map((s) => s.summary),
  );
  const overall = { assigned: slots.length, finished, percent: percent(finished, slots.length) };

  const weak = weakestDomain(byDomain, practice);
  const target = byUnit
    .filter((u) => u.unitId && u.assigned > u.finished)
    .sort(
      (a, b) =>
        b.assigned - b.finished - (a.assigned - a.finished) ||
        a.percent - b.percent ||
        asc(a.unitId, b.unitId),
    )[0];
  const unit = target ? units[target.unitId] : null;
  const misconception = unit?.misconception?.pattern
    ? {
        unitId: target.unitId,
        pattern: unit.misconception.pattern,
        redirect: unit.misconception.redirect || "",
        draft: unit.provenance !== "reviewed",
      }
    : null;
  const next = target ? nextActivity(target.unitId, unit, weak, released) : null;

  const behind = rows
    .filter((r) => r.finished < r.assigned)
    .sort((a, b) => a.percent - b.percent || b.late - a.late || asc(a.alias, b.alias))
    .slice(0, MAX_NAMES)
    .map((r) => ({
      alias: r.alias,
      percent: r.percent,
      late: r.late,
      group: r.worstGroup,
      label: groupLabel(r.worstGroup || "lab:6-8"),
    }));
  const complete = rows.filter((r) => r.assigned > 0 && r.finished === r.assigned);
  const celebrate = complete.length
    ? {
        kind: "finished",
        aliases: complete.slice(0, MAX_NAMES).map((r) => r.alias),
        count: complete.length,
      }
    : rows.some((r) => r.weekDays > 0)
      ? {
          kind: "practice",
          aliases: [...rows]
            .sort((a, b) => b.weekDays - a.weekDays || asc(a.alias, b.alias))
            .slice(0, MAX_NAMES)
            .filter((r) => r.weekDays > 0)
            .map((r) => r.alias),
          count: 0,
        }
      : { kind: "joined", aliases: [], count: students.length };

  return {
    version: BRIEF_VERSION,
    students: students.length,
    assignments: released.length,
    overall,
    average: { completionPercent: overall.percent, practiceDays: avgDays },
    byUnit: byUnit.sort((a, b) => asc(a.key, b.key)),
    byDomain,
    byAssignment,
    practice,
    goal,
    weakestDomain: weak,
    misconception,
    nextActivity: next,
    bullets: { behind, celebrate, goalReached: goal?.reached === true },
    provenance: {
      source: "class summaries, assignment status and authored unit data",
      unitText: misconception ? (misconception.draft ? "draft" : "reviewed") : "none",
    },
  };
}

const list = (names, and) =>
  names.length < 2 ? names.join("") : `${names.slice(0, -1).join(", ")} ${and} ${names.at(-1)}`;

/** The brief as plain sentences: { headline, behind, reteach, celebrate } in one language ("en" | "es"). */
export function briefText(dash, lang = "en") {
  const en = lang !== "es";
  const t = (a, b) => (en ? a : b);
  const dom = (d) => DOMAIN_NAME[d][en ? 0 : 1];
  if (!dash.students)
    return {
      headline: t("No students have joined yet.", "Todavía no se ha unido ningún estudiante."),
      behind: "",
      reteach: "",
      celebrate: "",
    };
  if (!dash.assignments) {
    return {
      headline: t(
        `${dash.students} students joined. Nothing is assigned yet.`,
        `${dash.students} estudiantes se unieron. Todavía no hay tareas asignadas.`,
      ),
      behind: t(
        "Assign one activity to see who is behind.",
        "Asigna una actividad para ver quién va atrasado.",
      ),
      reteach: t(
        "Assign a unit activity and the brief will name what to reteach.",
        "Asigna una actividad de unidad y el resumen dirá qué reenseñar.",
      ),
      celebrate:
        dash.bullets.celebrate.kind === "joined"
          ? t(
              `${dash.students} students joined the class.`,
              `${dash.students} estudiantes se unieron a la clase.`,
            )
          : t(
              `Most practice days: ${list(dash.bullets.celebrate.aliases, "and")}.`,
              `Más días de práctica: ${list(dash.bullets.celebrate.aliases, "y")}.`,
            ),
    };
  }
  const { behind, celebrate } = dash.bullets;
  const headline = t(
    `Class average: ${dash.average.completionPercent}% of assigned work finished (${dash.overall.finished} of ${dash.overall.assigned}), ${dash.average.practiceDays} practice days each this week.`,
    `Promedio de la clase: ${dash.average.completionPercent}% de la tarea asignada terminada (${dash.overall.finished} de ${dash.overall.assigned}), ${dash.average.practiceDays} días de práctica por estudiante esta semana.`,
  );
  const behindLine = behind.length
    ? t(
        `Behind: ${behind.map((b) => `${b.alias} on ${b.label.en}${b.late ? " (late)" : ""}`).join("; ")}.`,
        `Atrasados: ${behind.map((b) => `${b.alias} en ${b.label.es}${b.late ? " (tarde)" : ""}`).join("; ")}.`,
      )
    : t("Nobody is behind on assigned work.", "Nadie va atrasado en la tarea asignada.");
  const m = dash.misconception;
  const n = dash.nextActivity;
  const reteachParts = [
    m
      ? t(
          `Reteach: ${m.pattern} Redirect: ${m.redirect}`.trim(),
          `Reenseñar: ${m.pattern} Redirección: ${m.redirect} (texto de la unidad, en inglés)`.trim(),
        )
      : t(
          `Reteach ${dom(dash.weakestDomain).toLowerCase()}: it has the least finished work.`,
          `Reenseñar ${dom(dash.weakestDomain).toLowerCase()}: es lo que menos se terminó.`,
        ),
    n
      ? t(
          `Next: "${n.title}" (${n.domain || "activity"}).`,
          `Siguiente: "${n.title}" (${n.domain ? dom(n.domain).toLowerCase() : "actividad"}).`,
        )
      : "",
    m?.draft
      ? t("(Draft unit text, not yet reviewed.)", "(Texto borrador de la unidad, sin revisar.)")
      : "",
  ].filter(Boolean);
  let celebrateLine;
  if (celebrate.kind === "finished")
    celebrateLine = t(
      `Celebrate: ${list(celebrate.aliases, "and")} finished everything assigned.`,
      `Celebrar: ${list(celebrate.aliases, "y")} ${celebrate.aliases.length > 1 ? "terminaron" : "terminó"} toda la tarea asignada.`,
    );
  else if (celebrate.kind === "practice")
    celebrateLine = t(
      `Celebrate: ${list(celebrate.aliases, "and")} practiced on the most days.`,
      `Celebrar: ${list(celebrate.aliases, "y")} ${celebrate.aliases.length > 1 ? "practicaron" : "practicó"} más días.`,
    );
  else
    celebrateLine = t(
      `Celebrate: ${celebrate.count} students joined the class.`,
      `Celebrar: ${celebrate.count} estudiantes se unieron a la clase.`,
    );
  if (dash.bullets.goalReached)
    celebrateLine += t(" The class goal is reached.", " Se alcanzó la meta de la clase.");
  return {
    headline,
    behind: behindLine,
    reteach: reteachParts.join(" "),
    celebrate: celebrateLine,
  };
}
