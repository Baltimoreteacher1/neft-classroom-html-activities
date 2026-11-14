// Student details + starting support (Language Page teacher tools). One <details> per learner: their practice
// counts, and the teacher's starting support stage per domain (A Starting, B Growing, C Expanding) and Road week.
// Saved through POST /api/class/settings (`support`, validated by the shared contract); each learner's device reads
// only its own entry from GET /me and applies it as a default (support.js). The learner sees the stage name only.
//
// Prefill: when the Teacher Hub on THIS device holds official results for a student with the same nickname, the
// stages are proposed from dna.js `decideSupport` (via buildLanguageDna). The level itself is never sent anywhere.
import {
  MAX_ROAD_WEEK,
  SUMMARY_DOMAINS,
  SUPPORT_STAGES,
} from "../../../shared/class-platform/contract.js";
import { buildLanguageDna } from "../lang/dna.js";
import { safeJson, TIERS } from "../util.js";
import { el, errorText } from "./dom.js";

const HUB_ROSTER_KEY = "accessTeacher:v1:roster";
const HUB_OFFICIAL_KEY = "accessTeacher:v1:officialResults";
const DOMAIN_NAME = {
  listening: "Listening",
  speaking: "Speaking",
  reading: "Reading",
  writing: "Writing",
};
const DOMAIN_ES = {
  listening: "Escuchar",
  speaking: "Hablar",
  reading: "Leer",
  writing: "Escribir",
};
/** dna.js support conditions -> the lab's three learner-facing support stages. */
export const CONDITION_STAGE = Object.freeze({
  modeled: "A",
  partial: "B",
  minimal: "C",
  independent: "C",
});

const readLocal = (key, fallback) => {
  try {
    return safeJson(localStorage.getItem(key), fallback) ?? fallback;
  } catch {
    return fallback;
  }
};

/** Proposed stages from official results typed or imported in the Teacher Hub on this device, or null. */
export function officialStages(
  alias,
  { roster = readLocal(HUB_ROSTER_KEY, []), official = readLocal(HUB_OFFICIAL_KEY, {}) } = {},
) {
  const name = String(alias || "")
    .trim()
    .toLowerCase();
  const hub = (Array.isArray(roster) ? roster : []).find(
    (s) =>
      String(s?.alias || "")
        .trim()
        .toLowerCase() === name,
  );
  const list = hub && Array.isArray(official?.[hub.id]) ? official[hub.id] : [];
  if (!list.length) return null;
  const stages = {};
  for (const d of buildLanguageDna({ official: list }).domains)
    if (d.official) stages[d.domain.toLowerCase()] = CONDITION_STAGE[d.support.condition] || "A";
  return Object.keys(stages).length ? stages : null;
}

const stageName = (S, st) => S(TIERS[st].name, TIERS[st].es);

function studentCard(S, s, saved, save) {
  const proposed = saved ? null : officialStages(s.alias);
  const start = saved?.stages || proposed || {};
  const sum = s.docs?.language?.summary || {};
  const selects = SUMMARY_DOMAINS.map((d) => {
    const sel = el(
      "select",
      {
        "aria-label": `${S(DOMAIN_NAME[d], DOMAIN_ES[d])}: ${S("starting support", "apoyo inicial")}`,
      },
      el("option", { value: "" }, S("Not set", "Sin definir")),
      SUPPORT_STAGES.map((st) => el("option", { value: st }, stageName(S, st))),
    );
    sel.value = start[d] || "";
    return [d, sel];
  });
  const week = el("input", {
    type: "number",
    min: "1",
    max: String(MAX_ROAD_WEEK),
    value: saved?.roadWeek ?? "",
    "aria-label": S("Road week for this student", "Semana del Camino para este estudiante"),
  });
  const details = el(
    "details",
    { class: "cls-det", id: `cls-det-${s.studentId}`, "data-student": s.studentId },
    el(
      "summary",
      {},
      s.alias,
      saved ? el("span", { class: "fine" }, ` · ${S("support set", "apoyo definido")}`) : null,
    ),
    el(
      "p",
      { class: "fine" },
      SUMMARY_DOMAINS.map(
        (d) => `${S(DOMAIN_NAME[d], DOMAIN_ES[d])}: ${sum.domains?.[d] ?? 0}`,
      ).join(" · "),
    ),
    proposed
      ? el(
          "p",
          { class: "fine" },
          S(
            "Prefilled from official results saved in the Teacher Hub on this device. Press Save to send the support stages (not the levels) to this student.",
            "Prellenado con resultados oficiales guardados en el Centro docente de este dispositivo. Presiona Guardar para enviar las etapas de apoyo (no los niveles) a este estudiante.",
          ),
        )
      : null,
    el(
      "div",
      { class: "cls-det-grid" },
      selects.map(([d, sel]) => el("label", {}, S(DOMAIN_NAME[d], DOMAIN_ES[d]), sel)),
      el("label", {}, S("Road week", "Semana del Camino"), week),
    ),
    el(
      "div",
      { class: "row-actions" },
      el(
        "button",
        {
          type: "button",
          class: "btn small",
          onclick: () => {
            const stages = Object.fromEntries(
              selects.filter(([, sel]) => sel.value).map(([d, sel]) => [d, sel.value]),
            );
            const n = Number(week.value);
            save({
              [s.studentId]: {
                stages,
                ...(week.value && Number.isInteger(n) ? { roadWeek: n } : {}),
              },
            });
          },
        },
        S("Save starting support", "Guardar apoyo inicial"),
      ),
      saved
        ? el(
            "button",
            {
              type: "button",
              class: "btn small ghost",
              onclick: () => save({ [s.studentId]: null }),
            },
            S("Clear", "Borrar"),
          )
        : null,
    ),
  );
  return details;
}

/**
 * Mount the editor into `box`. `api` is the teacher client; `getRoster()` the last roster; `reload()` refreshes it.
 * Returns { draw(roster), open(studentId) }. draw() re-renders only when the student list or saved support changed,
 * so a 10-second roster poll never resets a select the teacher is using.
 */
export function mountSupportEditor(box, { S, api, live, reload }) {
  let sig = "";
  async function saveSettings(settings) {
    const res = await api.settings(settings);
    live.textContent = res.ok
      ? S("Starting support saved.", "Apoyo inicial guardado.")
      : errorText(S, res.error);
    if (res.ok) reload();
  }
  function draw(roster) {
    const students = roster?.students || [];
    const support = roster?.settings?.support || {};
    const next = JSON.stringify([
      students.map((s) => s.studentId),
      support,
      roster?.settings?.roadWeek ?? null,
    ]);
    if (next === sig) return;
    sig = next;
    const classWeek = el("input", {
      type: "number",
      min: "1",
      max: String(MAX_ROAD_WEEK),
      value: roster?.settings?.roadWeek ?? "",
      "aria-label": S("Road week for the whole class", "Semana del Camino para toda la clase"),
    });
    box.replaceChildren(
      el(
        "p",
        { class: "fine" },
        S(
          "Set where each student starts. Students see only the support stage name (Starting, Growing, Expanding) and can still change it. No level or score is sent.",
          "Define dónde empieza cada estudiante. Los estudiantes solo ven el nombre de la etapa de apoyo (Comenzando, Creciendo, Ampliando) y aún pueden cambiarla. No se envía ningún nivel ni puntaje.",
        ),
      ),
      el(
        "div",
        { class: "row-actions" },
        el(
          "label",
          {},
          S(
            "Class Road week (blank follows the calendar)",
            "Semana del Camino de la clase (en blanco sigue el calendario)",
          ),
          classWeek,
        ),
        el(
          "button",
          {
            type: "button",
            class: "btn small",
            onclick: () => {
              const n = Number(classWeek.value);
              saveSettings({ roadWeek: classWeek.value && Number.isInteger(n) ? n : null });
            },
          },
          S("Save class week", "Guardar semana de la clase"),
        ),
      ),
      ...(students.length
        ? students.map((s) =>
            studentCard(S, s, support[s.studentId] || null, (patch) =>
              saveSettings({ support: patch }),
            ),
          )
        : [el("p", {}, S("No students yet.", "Todavía no hay estudiantes."))]),
    );
  }
  function open(studentId) {
    const node = box.querySelector(`[data-student="${studentId}"]`);
    if (!node) return;
    node.open = true;
    node.scrollIntoView?.({ block: "nearest" });
    node.querySelector("summary")?.focus();
  }
  return { draw, open };
}
