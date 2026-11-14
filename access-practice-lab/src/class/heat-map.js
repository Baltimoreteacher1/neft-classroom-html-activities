// Class heat map (Language Page teacher tools): students x (Key Language Use x domain) practice counts from each
// learner's class summary (link.js languageSummary.byUse). It is a real <table> with row and column headers, so a
// screen reader reads every cell with its student, use and domain; shading only repeats the number in the cell.
// Summaries from devices that predate `byUse` show a dash, not a zero, so "no data" never reads as "no practice".
import { KEY_USES, SUMMARY_DOMAINS } from "../../../shared/class-platform/contract.js";
import { el } from "./dom.js";

const USE_ES = { Narrate: "Narrar", Inform: "Informar", Explain: "Explicar", Argue: "Argumentar" };
const DOMAIN_LABEL = {
  listening: ["Listening", "Escuchar"],
  speaking: ["Speaking", "Hablar"],
  reading: ["Reading", "Leer"],
  writing: ["Writing", "Escribir"],
};
const DOMAIN_SHORT = {
  listening: ["L", "E"],
  speaking: ["S", "H"],
  reading: ["R", "L"],
  writing: ["W", "Es"],
};

/** Rows for the grid: { studentId, alias, hasData, cells: [{ use, domain, count|null }] } plus the class maximum. */
export function heatGrid(students = []) {
  let max = 0;
  const rows = students.map((s) => {
    const byUse = s.docs?.language?.summary?.byUse;
    const hasData = !!byUse && typeof byUse === "object";
    const cells = KEY_USES.flatMap((use) =>
      SUMMARY_DOMAINS.map((domain) => {
        const count = hasData ? Number(byUse[use]?.[domain]) || 0 : null;
        if (count) max = Math.max(max, count);
        return { use, domain, count };
      }),
    );
    return { studentId: s.studentId, alias: s.alias, hasData, cells };
  });
  return { rows, max };
}

/** Shade step 0-4 for a count against the class maximum (0 = none). */
export const heatStep = (count, max) =>
  !count || !max ? 0 : Math.max(1, Math.min(4, Math.ceil((count / max) * 4)));

/** The table. `onPick(studentId)` opens that learner's details. */
export function heatMapTable(S, students, onPick) {
  const { rows, max } = heatGrid(students);
  if (!rows.length) return el("p", {}, S("No students yet.", "Todavía no hay estudiantes."));
  const head1 = el(
    "tr",
    {},
    el("th", { scope: "col", rowspan: "2" }, S("Student", "Estudiante")),
    KEY_USES.map((use) =>
      el("th", { scope: "colgroup", colspan: String(SUMMARY_DOMAINS.length) }, S(use, USE_ES[use])),
    ),
  );
  const head2 = el(
    "tr",
    {},
    KEY_USES.flatMap((use) =>
      SUMMARY_DOMAINS.map((d) =>
        el(
          "th",
          { scope: "col", class: "cls-heat-dom" },
          el(
            "abbr",
            { title: `${S(use, USE_ES[use])} · ${S(...DOMAIN_LABEL[d])}` },
            S(...DOMAIN_SHORT[d]),
          ),
        ),
      ),
    ),
  );
  const body = rows.map((r) =>
    el(
      "tr",
      {},
      el(
        "th",
        { scope: "row" },
        el(
          "button",
          { type: "button", class: "btn small ghost", onclick: () => onPick?.(r.studentId) },
          r.alias,
        ),
      ),
      r.cells.map((c) =>
        el(
          "td",
          { class: `cls-heat cls-heat-${heatStep(c.count, max)}` },
          c.count === null
            ? el(
                "span",
                {
                  title: S(
                    "No Key Language Use data from this device yet",
                    "Todavía no hay datos de usos clave del lenguaje de este dispositivo",
                  ),
                },
                "–",
              )
            : String(c.count),
        ),
      ),
    ),
  );
  return el(
    "div",
    { class: "cls-heat-wrap" },
    el(
      "table",
      { class: "cls-table cls-heat-table" },
      el(
        "caption",
        { class: "fine" },
        S(
          "Practice counts by Key Language Use and domain (L Listening, S Speaking, R Reading, W Writing). Darker means more practice in this class. Counts, not scores.",
          "Cantidad de práctica por uso clave del lenguaje y dominio (E Escuchar, H Hablar, L Leer, Es Escribir). Más oscuro significa más práctica en esta clase. Son cantidades, no puntajes.",
        ),
      ),
      el("thead", {}, head1, head2),
      el("tbody", {}, body),
    ),
  );
}
