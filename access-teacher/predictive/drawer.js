// Student spotlight drawer: a modal side panel with one student's latest domains (with real-change markers),
// composites, an Overall trend line over comparable results, the validated outlook only, three practice links,
// and actions to open the full profile or print just this page. Native <dialog>.showModal() makes the rest of
// the page inert (focus stays inside), Esc closes it, and focus returns to whatever opened it.
// Exported for other sections: openStudentDrawer(ws, studentId).
import { DOMAIN_COLORS, sparkline } from "./charts2.js";
import { clear, fmt1, h } from "./dom.js";
import { GLANCE_KEYS, glanceRow, TREND_WORDS } from "./glance-model.js";
import { levelName } from "./interpret.js";
import { outlookFor } from "./outlook.js";
import { practicePlan } from "./practice.js";
import { ASSESSMENTS, COMPOSITE_INFO, COMPOSITES, LEVEL_WORDS, levelComparable } from "./rules.js";

const ARROW = { up: "▲", down: "▼", steady: "=", none: "–" };
const band = (lv) => Math.min(5, Math.max(0, Math.floor(lv) - 1));

/** Six level bands for HTML cells, light to dark teal (no violet); every fill/ink pair is at least 5.3:1. */
export const CELL_FILL = Object.freeze(["#e0f2f1", "#b2dfdb", "#80cbc4", "#4db6ac", "#00796b", "#004d40"]);
export const CELL_INK = Object.freeze(["#0f3d3a", "#0f3d3a", "#0f3d3a", "#0f2e2b", "#ffffff", "#ffffff"]);
/** A level cell's colours; the level is always printed as text beside the colour. */
export const levelStyle = (lv) => (lv == null ? "" : `background:${CELL_FILL[band(lv)]};color:${CELL_INK[band(lv)]}`);
export const trendMark = (t) =>
  h(
    "span",
    { class: `pi-gl-trend is-${t.dir}`, title: t.why, "data-trend": t.dir },
    h("span", { "aria-hidden": "true" }, ARROW[t.dir]),
    h("span", { class: "visually-hidden" }, ` ${TREND_WORDS[t.dir]}`),
  );

let dialog = null;
let opener = null;

function ensureDialog() {
  if (dialog?.isConnected) return dialog;
  dialog = h("dialog", { class: "pi-drawer", "aria-labelledby": "piDrawerT", id: "piDrawer" });
  dialog.addEventListener("close", () => {
    document.body.classList.remove("pi-drawer-open");
    const back = opener;
    opener = null;
    if (back?.isConnected) back.focus();
  });
  // Keep Tab inside the drawer (a modal dialog alone lets focus leave to the browser toolbar).
  dialog.addEventListener("keydown", (e) => {
    if (e.key !== "Tab") return;
    const f = [
      ...dialog.querySelectorAll(
        "a[href], button:not([disabled]), summary, input, select, textarea",
      ),
    ].filter((el) => el.getClientRects().length);
    if (!f.length) return;
    const first = f[0];
    const last = f.at(-1);
    if (
      e.shiftKey &&
      (document.activeElement === first || !dialog.contains(document.activeElement))
    ) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  });
  // A click on the backdrop (outside the panel box) closes the drawer.
  dialog.addEventListener("click", (e) => {
    if (e.target !== dialog) return;
    const r = dialog.getBoundingClientRect();
    if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom)
      dialog.close();
  });
  document.body.append(dialog);
  return dialog;
}

function domainsBlock(row) {
  return h(
    "ul",
    { class: "pi-dr-domains" },
    GLANCE_KEYS.map((k) => {
      const lv = row.levels[k];
      const sc = k === "Overall" ? row.rec.composites.Overall : row.rec.domains[k];
      return h(
        "li",
        { class: "pi-dr-dom", "data-domain": k, style: `--dc:${DOMAIN_COLORS[k]}` },
        h("span", { class: "pi-dr-dom-name" }, k === "Overall" ? "Overall (reported)" : k),
        h(
          "span",
          { class: "pi-dr-lv", style: levelStyle(lv) },
          sc.status === "not-assessed"
            ? "Not assessed"
            : lv == null
              ? "—"
              : `${lv.toFixed(1)} ${levelName(lv)}`,
        ),
        trendMark(row.trends[k]),
      );
    }),
  );
}

function compositesBlock(rec) {
  const calc = COMPOSITES.some((c) => rec.composites[c].level == null && rec.composites[c].calculatedScale != null);
  const list = h(
    "ul",
    { class: "pi-dr-comps" },
    COMPOSITES.filter((c) => c !== "Overall").map((c) => {
      const sc = rec.composites[c];
      return h(
        "li",
        { class: "pi-comp", "data-composite": c },
        h("span", { class: "pi-comp-name" }, COMPOSITE_INFO[c].label),
        h(
          "strong",
          {},
          sc.level != null
            ? sc.level.toFixed(1)
            : sc.calculatedScale != null
              ? `${sc.calculatedScale}*`
              : "—",
        ),
        h(
          "span",
          { class: "fine" },
          sc.level != null
            ? `${levelName(sc.level)}, reported`
            : sc.calculatedScale != null
              ? "scale, calculated"
              : "not reported",
        ),
      );
    }),
  );
  return calc
    ? [
        list,
        h(
          "p",
          { class: "fine" },
          "* A composite scale score calculated from the domain scale scores with WIDA's published weights. Composite levels are never calculated.",
        ),
      ]
    : list;
}

function trendBlock(row) {
  const series = comparableSeries(row);
  if (series.length < 2)
    return h("p", { class: "fine" }, "Only one comparable result, so there is no trend line yet.");
  return h(
    "div",
    { class: "pi-dr-spark" },
    sparkline({
      points: series,
      color: DOMAIN_COLORS.Overall,
      label: `${row.st.name}: Overall level over comparable results`,
    }),
    h(
      "p",
      { class: "fine" },
      `Overall: ${series.map((p) => `${p.label} ${fmt1(p.value)}`).join(" · ")}. Only results on the same assessment, scale and cut scores are joined.`,
    ),
  );
}
function comparableSeries(row) {
  return row.recs
    .filter((r) => levelComparable(r, row.rec))
    .map((r) => ({ label: r.academicYear, value: r.composites.Overall.level }))
    .filter((p) => p.value != null);
}

function outlookBlock(ws, st) {
  const o = outlookFor(ws, st);
  if (o.forecast) {
    const [lo, hi] = o.forecast.numbers.interval80;
    return h(
      "div",
      { class: "pi-ol is-validated", "data-outlook": "forecast" },
      h("span", { class: "pi-ol-tag" }, "Validated forecast"),
      h("strong", {}, `${fmt1(lo)} to ${fmt1(hi)}`),
      h(
        "span",
        {},
        `likely Overall range for ${o.forecast.targetYear}; about 8 in 10 students land inside a range like this.`,
      ),
    );
  }
  return h(
    "p",
    { class: "fine", "data-outlook": "none" },
    `No forecast shown. ${o.forecastWhy || "A validated model is needed first."}`,
  );
}

function practiceBlock(rec) {
  const acts = practicePlan(rec)
    .flatMap((p) => p.activities.map((a) => ({ ...a, domain: p.domain })))
    .slice(0, 3);
  if (!acts.length) return h("p", { class: "fine" }, "No matching practice activities.");
  return h(
    "ul",
    { class: "pi-dr-practice" },
    acts.map((a) =>
      h(
        "li",
        {},
        h("a", { href: a.href, "data-activity": a.id }, a.title),
        h("span", { class: "fine" }, ` ${a.domain}. ${a.why}`),
      ),
    ),
  );
}

function body(ws, st, close) {
  const row = glanceRow(st, ws.today);
  const head = h(
    "div",
    { class: "pi-dr-head" },
    h(
      "div",
      {},
      h("h2", { id: "piDrawerT" }, st.name),
      h(
        "p",
        { class: "fine" },
        row.rec
          ? `${ASSESSMENTS[row.rec.assessmentType].short} · ${row.rec.academicYear}${row.grade != null ? ` · Grade ${row.grade}` : ""} · ${LEVEL_WORDS[row.rec.levelVersion]}`
          : "No results on file",
      ),
    ),
    h(
      "button",
      {
        type: "button",
        class: "btn small ghost pi-dr-x no-print",
        "aria-label": `Close ${st.name}'s spotlight`,
        on: { click: close },
      },
      "Close",
    ),
  );
  const actions = h(
    "div",
    { class: "pi-row pi-dr-actions no-print" },
    h(
      "button",
      {
        type: "button",
        class: "btn small",
        "data-drawer-profile": "",
        on: {
          click: () => {
            ws.selected = st.id;
            ws.sub.studentView = "profile";
            opener = null;
            close();
            ws.go("students");
          },
        },
      },
      "Open full profile",
    ),
    h(
      "button",
      {
        type: "button",
        class: "btn small ghost",
        "data-drawer-print": "",
        on: { click: printDrawer },
      },
      "Print one-page profile",
    ),
  );
  if (!row.rec)
    return [
      head,
      h("p", { class: "pi-note" }, "Use Import scores to add this student's results."),
      actions,
    ];
  return [
    head,
    row.flags.length
      ? h(
          "p",
          { class: "pi-badges" },
          row.flags.map((f) => h("span", { class: `pi-chip pi-gl-flag is-${f.kind}` }, f.text)),
        )
      : null,
    h("h3", {}, "Domains"),
    domainsBlock(row),
    h(
      "p",
      { class: "fine" },
      "▲ ▼ only when the change is larger than the reported measurement error; = within it; – no comparable result.",
    ),
    h("h3", {}, "Composites"),
    compositesBlock(row.rec),
    h("h3", {}, "Trend"),
    trendBlock(row),
    h("h3", {}, "Outlook"),
    outlookBlock(ws, st),
    h("h3", {}, "Practice next"),
    practiceBlock(row.rec),
    row.reasons.length
      ? h(
          "details",
          { class: "pi-more" },
          h("summary", {}, "Why look at this student?"),
          h(
            "ul",
            {},
            row.reasons.map((r) => h("li", {}, r.text)),
          ),
        )
      : null,
    actions,
  ];
}

function printDrawer() {
  // Print a static copy of the panel: a modal dialog sits in the top layer and is clipped to one screen in print.
  const panel = dialog?.querySelector(".pi-dr-panel");
  if (!panel) return;
  const sheet = h("div", { class: "pi-print-sheet" }, panel.cloneNode(true));
  document.body.append(sheet);
  document.body.classList.add("pi-print-drawer");
  const done = () => {
    document.body.classList.remove("pi-print-drawer");
    sheet.remove();
    window.removeEventListener("afterprint", done);
  };
  window.addEventListener("afterprint", done);
  window.print();
}

/** Open the spotlight drawer for one student. Focus returns to the element that had it. */
export function openStudentDrawer(ws, studentId) {
  const st = ws.students.find((s) => s.id === studentId);
  if (!st) return;
  const d = ensureDialog();
  if (!d.open) opener = document.activeElement;
  const close = () => d.close();
  clear(d).append(
    h("div", { class: "pi-dr-panel", "data-drawer-student": st.id }, body(ws, st, close)),
  );
  if (!d.open) d.showModal();
  document.body.classList.add("pi-drawer-open");
  d.querySelector(".pi-dr-x")?.focus();
}
