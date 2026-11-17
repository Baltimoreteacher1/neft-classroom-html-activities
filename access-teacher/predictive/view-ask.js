// Ask the data: a plain-English question bar answered from the studio's own records by ask.js (no AI service,
// no network). The interpreted question is always shown in words above the answer; a question the parser
// cannot read opens "Here is what I understood" chips the teacher edits, so nothing dead-ends.
import {
  answerQuery,
  ASK_KEYS,
  EXAMPLES,
  gradesIn,
  OP_ASK,
  parseQuestion,
  queryFromChips,
  tableToCSV,
  toQuestion,
} from "./ask.js";
import { h } from "./dom.js";
import { quartiles } from "./interpret.js";
import { activitiesFor, bandForGrade } from "./practice.js";
import { DOMAINS } from "./rules.js";
import { assignButton } from "./view-class-live.js";
import { emptyState, heading } from "./view-common.js";

const RECENT_KEY = "pi:ask:recent";
const recentList = () => {
  try {
    const v = JSON.parse(sessionStorage.getItem(RECENT_KEY) || "[]");
    return Array.isArray(v) ? v.filter((x) => typeof x === "string").slice(0, 6) : [];
  } catch {
    return [];
  }
};
function remember(question) {
  try {
    const next = [question, ...recentList().filter((x) => x !== question)].slice(0, 6);
    sessionStorage.setItem(RECENT_KEY, JSON.stringify(next));
  } catch {
    /* private mode: recent questions are simply not kept */
  }
}

/** Open a student: P1's spotlight drawer when present, otherwise the Students section. */
function openStudent(ws, id) {
  const fallback = () => {
    ws.selected = id;
    ws.go("students");
  };
  import("./drawer.js")
    .then((m) =>
      typeof m.openStudentDrawer === "function" ? m.openStudentDrawer(ws, id) : fallback(),
    )
    .catch(fallback);
}

const plural = (n) => `${n} student${n === 1 ? "" : "s"}`;

function download(name, text) {
  const url = URL.createObjectURL(new Blob([text], { type: "text/csv;charset=utf-8" }));
  const a = h("a", { href: url, download: name, hidden: true });
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** The "Here is what I understood" chips: domain, comparison, value, grade. */
function builder(ws, hints, run, { open }) {
  const grades = gradesIn(ws.students);
  const key = h(
    "select",
    { id: "piAskKey" },
    ASK_KEYS.filter((k) => DOMAINS.includes(k) || k === "Overall").map((k) =>
      h("option", { value: k, selected: k === hints.key }, k),
    ),
  );
  const op = h(
    "select",
    { id: "piAskOp" },
    Object.entries(OP_ASK).map(([v, t]) => h("option", { value: v, selected: v === hints.op }, t)),
  );
  const value = h("input", {
    id: "piAskVal",
    type: "number",
    min: "1",
    max: "6",
    step: "0.1",
    value: String(hints.value),
    inputmode: "decimal",
  });
  const grade = h(
    "select",
    { id: "piAskGrade" },
    h("option", { value: "" }, "Any grade"),
    grades.map((g) =>
      h(
        "option",
        { value: String(g), selected: String(g) === String(hints.grade) },
        g === "K" ? "Kindergarten" : `Grade ${g}`,
      ),
    ),
  );
  const field = (id, text, control) =>
    h("div", { class: "pi-field pi-field-sm" }, h("label", { for: id }, text), control);
  return h(
    "details",
    { class: "pi-ask-build", open: open || null, "data-ask-builder": "" },
    h(
      "summary",
      {},
      open
        ? "Here is what I understood. Change any part:"
        : "Build a question with choices instead",
    ),
    h(
      "form",
      {
        class: "pi-ask-chips",
        on: {
          submit: (e) => {
            e.preventDefault();
            run(
              queryFromChips({
                key: key.value,
                op: op.value,
                value: value.value,
                grade: grade.value,
              }),
            );
          },
        },
      },
      field("piAskKey", "Score", key),
      field("piAskOp", "Is", op),
      field("piAskVal", "Level", value),
      field("piAskGrade", "Grade", grade),
      h("button", { type: "submit", class: "btn" }, "Show students"),
    ),
  );
}

function actions(ws, query, ans) {
  const out = h("div", { class: "pi-ask-out", "aria-live": "polite" });
  const ids = ans.rows.map((r) => r.student.id);
  const headers = ["Student", ...ans.columns, "Why"];
  const matrix = ans.rows.map((r) => [
    r.student.name,
    ...ans.columns.map((c) => r.cells[c]),
    r.reason,
  ]);
  const domain = [...query.conds.map((c) => c.key), query.sort?.key].find((k) =>
    DOMAINS.includes(k),
  );
  const groupName = h("input", {
    type: "text",
    maxlength: "80",
    value: ans.text.slice(0, 80),
    "aria-label": "Group name",
  });
  const makeGroup = () => {
    const id = `ask-${Date.now().toString(36)}`;
    ws.state.groups = {
      ...(ws.state.groups || {}),
      [id]: {
        name: groupName.value.trim() || "Ask the data group",
        members: ids,
        approvedAt: new Date().toISOString(),
      },
    };
    ws.save();
    out.textContent = `Group saved on this device with ${plural(ids.length)}. It is listed in Reports.`;
    ws.announce(out.textContent);
  };
  const assign = () => {
    if (!domain) {
      out.replaceChildren(
        h(
          "p",
          {},
          "This question does not name a domain. The Instructional Planner suggests practice student by student.",
        ),
        h(
          "button",
          { type: "button", class: "btn small", on: { click: () => ws.go("planner") } },
          "Open the Instructional Planner",
        ),
      );
      return;
    }
    const levels = ans.rows.map((r) => r.record?.domains[domain]?.level).filter((x) => x != null);
    const level = quartiles(levels)?.median ?? null;
    const grade = ans.rows[0]?.record?.grade;
    const acts = activitiesFor(domain, level, bandForGrade(grade), 3);
    out.replaceChildren(
      h(
        "p",
        {},
        `${domain} practice matched to the group's middle level${level != null ? ` (${level.toFixed(1)})` : ""}:`,
      ),
      acts.length
        ? h(
            "ul",
            {},
            acts.map((a) => h("li", {}, h("a", { href: a.href, "data-activity": a.id }, a.title))),
          )
        : h("p", {}, "Practice activities are still loading. Try again in a moment."),
      assignButton(ws, {
        domain,
        level,
        grade,
        label: `Assign ${domain.toLowerCase()} practice to my class`,
      }),
    );
  };
  const copy = () => {
    const tsv = [headers, ...matrix]
      .map((r) => r.map((c) => String(c).replace(/[\t\n]/g, " ")).join("\t"))
      .join("\n");
    const done = (ok) => {
      out.textContent = ok
        ? "Copied. Paste it into a spreadsheet or document."
        : "This browser would not copy. Use Export CSV instead.";
      ws.announce(out.textContent);
    };
    if (navigator.clipboard?.writeText)
      navigator.clipboard.writeText(tsv).then(
        () => done(true),
        () => done(false),
      );
    else done(false);
  };
  const exportCsv = () => {
    download(
      `ask-the-data${ws.mode === "demo" ? "-sample" : ""}.csv`,
      tableToCSV([headers, ...matrix]),
    );
    out.textContent = "CSV downloaded to this device.";
  };
  const btn = (text, fn, attrs = {}) =>
    h("button", { type: "button", class: "btn small", ...attrs, on: { click: fn } }, text);
  return h(
    "div",
    { class: "pi-ask-actions" },
    h(
      "details",
      { class: "pi-ask-group" },
      h("summary", { class: "btn small" }, "Make a group"),
      h(
        "div",
        { class: "pi-row" },
        groupName,
        btn("Save group", makeGroup, { "data-ask-act": "group" }),
      ),
    ),
    btn("Assign practice", assign, { "data-ask-act": "assign" }),
    btn("Copy as table", copy, { "data-ask-act": "copy" }),
    btn("Export CSV", exportCsv, { "data-ask-act": "csv" }),
    out,
  );
}

function results(ws, query, ans) {
  const n = ans.n;
  const kids = [
    h(
      "p",
      { class: "pi-ask-interp", "data-ask-interp": "" },
      query.count ? h("span", { class: "pi-ask-count" }, String(n)) : null,
      h("strong", {}, ans.text),
      ` — ${plural(n)}`,
    ),
  ];
  if (n) {
    kids.push(
      h(
        "div",
        {
          class: "pi-table-wrap",
          role: "region",
          "aria-label": `${ans.text}: ${plural(n)}`,
          tabindex: "0",
        },
        h(
          "table",
          { class: "pi-table pi-ask-table" },
          h("caption", { class: "visually-hidden" }, `${ans.text}: ${plural(n)}`),
          h(
            "thead",
            {},
            h(
              "tr",
              {},
              ["Student", ...ans.columns, "Why"].map((x) => h("th", { scope: "col" }, x)),
            ),
          ),
          h(
            "tbody",
            {},
            ans.rows.map((r) =>
              h(
                "tr",
                {},
                h(
                  "th",
                  { scope: "row" },
                  h(
                    "button",
                    {
                      type: "button",
                      class: "linkish pi-ask-open",
                      "data-ask-student": r.student.id,
                      "aria-label": `Open ${r.student.name}`,
                      on: { click: () => openStudent(ws, r.student.id) },
                    },
                    r.student.name,
                  ),
                ),
                ans.columns.map((c) => h("td", {}, r.cells[c])),
                h("td", { class: "pi-ask-why" }, r.reason),
              ),
            ),
          ),
        ),
      ),
      actions(ws, query, ans),
    );
  } else
    kids.push(
      h(
        "p",
        { class: "pi-note" },
        "No students match. Try a different level or remove a condition.",
      ),
    );
  if (ans.excluded.length)
    kids.push(
      h(
        "details",
        { class: "pi-ask-excl" },
        h("summary", {}, `Not included: ${plural(ans.excluded.length)} could not be checked`),
        h(
          "ul",
          {},
          ans.excluded.map((x) =>
            h("li", {}, `${x.student.name}: ${x.reason}${x.why ? ` (${x.why})` : ""}`),
          ),
        ),
      ),
    );
  if (query.conds.some((c) => c.type === "growth") || query.sort?.by === "growth")
    kids.push(
      h(
        "p",
        { class: "fine" },
        "Growth counts only when the scale-score change is larger than the reported measurement error between two comparable results. The 2025-26 scale reset breaks comparisons.",
      ),
    );
  if (ws.mode === "demo") kids.push(h("p", { class: "fine" }, "Sample class: fictional students."));
  return kids;
}

export function renderAsk(ws) {
  if (!ws.students.length) return emptyState(ws);
  ws.sub.ask ||= { q: "" };
  const area = h("div", { class: "pi-ask-result", id: "piAskResult", "aria-live": "polite" });
  const input = h("input", {
    type: "search",
    id: "piAskQ",
    class: "pi-ask-input",
    value: ws.sub.ask.q,
    placeholder: "e.g. grade 6 and below 3 in writing",
    autocomplete: "off",
    enterkeyhint: "search",
  });
  const recentBox = h("div", { class: "pi-ask-recent" });
  const chipRow = (label, list) =>
    h(
      "div",
      { class: "pi-ask-examples", role: "group", "aria-label": label },
      h("span", { class: "fine" }, `${label}:`),
      list.map((q) =>
        h(
          "button",
          {
            type: "button",
            class: "pi-ask-chip",
            "data-ask-example": q,
            on: { click: () => ask(q) },
          },
          q,
        ),
      ),
    );
  const drawRecent = () => {
    const r = recentList();
    recentBox.replaceChildren(r.length ? chipRow("Recent on this device", r) : "");
  };
  const show = (query) => {
    const ans = answerQuery(query, ws.students, { today: ws.today });
    area.replaceChildren(
      ...results(ws, query, ans),
      builder(ws, query.hints, show, { open: false }),
    );
    remember(toQuestion(query));
    drawRecent();
  };
  function ask(q, { focus = true } = {}) {
    input.value = q;
    ws.sub.ask.q = q;
    const query = parseQuestion(q);
    if (!q.trim()) {
      area.replaceChildren(
        h("p", { class: "pi-note" }, "Type a question, or pick an example below."),
      );
      return;
    }
    if (query.understood) return show(query);
    area.replaceChildren(
      h(
        "p",
        { class: "pi-ask-interp", "data-ask-unknown": "" },
        h("strong", {}, "I could not read all of that question. "),
        query.unknown.length
          ? `The part I did not understand: “${query.unknown.join(" … ")}”.`
          : "",
      ),
      builder(ws, query.hints, show, { open: true }),
    );
    if (focus) area.querySelector("#piAskKey")?.focus();
  }
  const form = h(
    "form",
    {
      class: "pi-ask-form",
      role: "search",
      on: { submit: (e) => (e.preventDefault(), ask(input.value)) },
    },
    h("label", { for: "piAskQ", class: "pi-ask-label" }, "Ask about your class"),
    h("div", { class: "pi-ask-bar" }, input, h("button", { type: "submit", class: "btn" }, "Ask")),
  );
  drawRecent();
  if (ws.sub.ask.q) queueMicrotask(() => ask(ws.sub.ask.q, { focus: false }));
  return h(
    "div",
    { class: "pi-ask" },
    heading(2, "Ask the data"),
    h(
      "p",
      { class: "lead" },
      "Ask in plain words, in English or with Spanish domain words. Answers come only from the scores saved here; nothing leaves this device.",
    ),
    form,
    chipRow("Try", EXAMPLES),
    recentBox,
    area,
  );
}
