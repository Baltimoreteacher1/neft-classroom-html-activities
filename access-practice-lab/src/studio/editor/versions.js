// Make versions: one activity, up to four versions for different learners. Each version is saved as its own draft
// (the original is untouched), then a comparison table shows what differs and confirms what must not: the same
// learning objective and the same answer keys. If that cannot be confirmed, a plain warning says why.

import { saveLocal } from "../drafts.js";
import { TIER_HELP, TIER_LABEL } from "./source-banner.js";
import { button, domId, h, openDialog, say } from "./ui.js";

export const TIER_ORDER = ["emerging", "developing", "expanding", "extension"];

const cellText = (v, S) => {
  if (v == null || v === "") return "—";
  if (typeof v === "boolean") return v ? S("Yes", "Sí") : S("No", "No");
  if (Array.isArray(v)) return v.length ? v.map((x) => cellText(x, S)).join(", ") : "—";
  if (typeof v === "object") return S(v.en ?? "", v.es ?? v.en ?? "") || "—";
  return String(v);
};
const loc = (v, S) =>
  v && typeof v === "object" ? S(v.en ?? "", v.es ?? v.en ?? "") : String(v ?? "");

/** Column headings: the original first, then each version by its level. */
export function columnLabels(columns, versions, S) {
  return columns.map((c, i) => {
    if (i === 0) return S("Original", "Original");
    const tier = versions[i - 1]?.activity?.lineage?.tier;
    if (tier && TIER_LABEL[tier]) return S(TIER_LABEL[tier].en, TIER_LABEL[tier].es);
    return typeof c === "string" ? c : loc(c.label || c.title || c.tier || "", S);
  });
}

/** A real table: caption, scoped headers, one row per thing that can differ. */
export function comparisonTable({ compare, versions, S }) {
  const heads = columnLabels(compare.columns || [], versions, S);
  return h(
    "div.st-table-wrap",
    {
      tabindex: "0",
      role: "region",
      "aria-label": S("How the versions compare", "Cómo se comparan las versiones"),
    },
    h(
      "table.st-compare",
      h("caption", S("How the versions compare", "Cómo se comparan las versiones")),
      h(
        "thead",
        h(
          "tr",
          h("th", { scope: "col" }, S("What changes", "Qué cambia")),
          heads.map((t) => h("th", { scope: "col" }, t)),
        ),
      ),
      h(
        "tbody",
        (compare.rows || []).map((r) =>
          h(
            "tr",
            h("th", { scope: "row" }, loc(r.label ?? r.key, S)),
            (r.values || []).map((v) => h("td", cellText(v, S))),
          ),
        ),
      ),
    ),
  );
}

/** What the teacher should read about rigor: a confirmation, or the specific problems. */
export function rigorNote({ compare, checks, S }) {
  const problems = checks.flatMap((c) => c.problems || []);
  const ok =
    checks.every((c) => c.ok) &&
    compare.sameObjective !== false &&
    compare.sameAnswerKeys !== false;
  if (ok)
    return h(
      "p.st-confirm",
      { role: "status" },
      h("span", { "aria-hidden": "true" }, "✓ "),
      S(
        "Same learning objective and same answer keys",
        "Mismo objetivo de aprendizaje y mismas claves de respuestas",
      ),
    );
  return h(
    "div.st-needs",
    { role: "alert" },
    h(
      "h3",
      S("Check these versions before you use them", "Revise estas versiones antes de usarlas"),
    ),
    h(
      "p",
      S(
        "We could not confirm that every version keeps the same objective and answer keys.",
        "No pudimos confirmar que todas las versiones mantengan el mismo objetivo y claves de respuestas.",
      ),
    ),
    problems.length
      ? h(
          "ul",
          problems.slice(0, 6).map((p) => h("li", loc(p, S))),
        )
      : null,
  );
}

/** Dialog: choose levels, make the drafts, show the comparison. */
export function openVersions({ store, saver, S, nav, goTo }) {
  return openDialog(
    S("Make versions for different learners", "Crear versiones para distintos estudiantes"),
    (body, close) => {
      const status = h("p.st-status", { role: "status", "aria-live": "polite" });
      const boxes = TIER_ORDER.map((tier) => {
        const id = domId("tier");
        const input = h("input", { type: "checkbox", id, value: tier, checked: true });
        const [en, es] = TIER_HELP[tier];
        return {
          tier,
          input,
          row: h(
            "div.st-toggle",
            input,
            h(
              "label",
              { for: id },
              h("strong", S(TIER_LABEL[tier].en, TIER_LABEL[tier].es)),
              h("span.st-sub-label", ` — ${S(en, es)}`),
            ),
          ),
        };
      });
      const make = button(
        S("Make versions", "Crear versiones"),
        async () => {
          const tiers = boxes.filter((b) => b.input.checked).map((b) => b.tier);
          if (!tiers.length) {
            status.textContent = S("Choose at least one version.", "Elija al menos una versión.");
            return;
          }
          make.disabled = true;
          status.textContent = S("Making versions…", "Creando versiones…");
          try {
            await saver.flush();
            const [{ makeVersions, assertRigor, compareVersions }] = await Promise.all([
              import("../core/differentiate.js"),
            ]);
            const original = store.get();
            const versions = makeVersions(original, tiers).map((v) =>
              v.activity ? v : { activity: v, changes: [] },
            );
            for (const v of versions) saveLocal(v.activity, null);
            const compare = compareVersions([original, ...versions.map((v) => v.activity)]);
            const checks = versions.map((v) => assertRigor(original, v.activity));
            show(versions, compare, checks);
          } catch (err) {
            console.error("[studio] versions failed", err);
            make.disabled = false;
            status.textContent = S(
              "The versions could not be made. Your activity is unchanged.",
              "No se pudieron crear las versiones. Su actividad no cambió.",
            );
          }
        },
        "primary",
      );
      const form = h(
        "div.st-versions-form",
        h(
          "p",
          S(
            "Pick the versions to make. Each one is saved as its own draft; your original stays as it is.",
            "Elija las versiones que quiere crear. Cada una se guarda como su propio borrador; su original no cambia.",
          ),
        ),
        h(
          "fieldset.st-fieldset",
          h("legend", S("Versions", "Versiones")),
          boxes.map((b) => b.row),
        ),
        h(
          "p.st-hint",
          S(
            "Language support changes how students reach the task. It never changes the task or the answers.",
            "El apoyo de lenguaje cambia cómo los estudiantes llegan a la tarea. Nunca cambia la tarea ni las respuestas.",
          ),
        ),
        h("div.st-add-row", make, button(S("Cancel", "Cancelar"), close)),
      );
      const results = h("div.st-versions-out", { hidden: true });
      function show(versions, compare, checks) {
        form.hidden = true;
        results.hidden = false;
        results.replaceChildren(
          rigorNote({ compare, checks, S }),
          comparisonTable({ compare, versions, S }),
          h(
            "ul.st-version-list",
            versions.map((v) => {
              const tier = v.activity.lineage?.tier;
              const label = tier ? S(TIER_LABEL[tier].en, TIER_LABEL[tier].es) : v.activity.title;
              return h(
                "li",
                h("span", label),
                button(
                  S("Open", "Abrir"),
                  () => (close(), nav(goTo.edit(v.activity.id))),
                  "small",
                  { "aria-label": S(`Open the ${label} version`, `Abrir la versión ${label}`) },
                ),
              );
            }),
          ),
          h(
            "p.st-hint",
            S(
              "All versions are in My activities, under the original.",
              "Todas las versiones están en Mis actividades, bajo el original.",
            ),
          ),
          h("div.st-add-row", button(S("Done", "Listo"), close, "primary")),
        );
        say(S(`${versions.length} versions made.`, `${versions.length} versiones creadas.`));
        }
      body.append(form, results, status);
    },
  );
}
