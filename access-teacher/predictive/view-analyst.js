// Research Analyst view. Questions are answered on this device by fixed computations (analyst.js); no
// question or student data leaves the browser.
import { answer, INTENTS } from "./analyst.js";
import { clear, h, table, tip } from "./dom.js";
import { emptyState, heading } from "./view-common.js";

function renderAnswer(ws, out, question) {
  clear(out);
  if (!question.trim()) return;
  const a = answer(question, {
    students: ws.students,
    evidence: ws.evidence,
    forecast: ws.forecast,
    targets: ws.state.targets,
    snapshots: ws.state.snapshots,
  });
  if (!a.supported) {
    out.append(
      h(
        "div",
        { class: "pi-card", "data-answer": "unsupported" },
        h("h3", {}, "I can't answer that one yet"),
        h(
          "p",
          {},
          "This analyst answers a fixed set of questions with computations over your local data. I can answer these kinds of questions:",
        ),
        h(
          "ul",
          {},
          a.examples.map((x) => h("li", {}, x)),
        ),
      ),
    );
    return;
  }
  out.append(
    h(
      "div",
      { class: "pi-card", "data-answer": a.intent },
      h("h3", {}, a.title),
      h(
        "dl",
        { class: "pi-dl" },
        [
          ["Query interpretation", a.interpretation],
          ["Data used", a.dataUsed],
          ["Time range", a.timeRange],
          ["Computation", a.computation],
          ["Uncertainty", a.uncertainty],
          ["Suggested action", a.action],
        ].flatMap(([k, v]) => [h("dt", {}, k), h("dd", {}, v)]),
      ),
      a.rows.length
        ? table(`Result: ${a.title}`, a.columns, a.rows)
        : h("p", { class: "pi-note" }, "No students matched."),
    ),
  );
}

export function renderAnalyst(ws) {
  if (!ws.students.length) return emptyState(ws);
  const out = h("div", { "aria-live": "polite", id: "piAnswer" });
  const input = h("input", {
    id: "pi-q",
    type: "text",
    value: ws.analystQuestion,
    autocomplete: "off",
    maxlength: "200",
  });
  const ask = (q) => {
    ws.analystQuestion = q;
    input.value = q;
    renderAnswer(ws, out, q);
  };
  const form = h(
    "form",
    {
      class: "pi-form pi-ask",
      role: "search",
      on: {
        submit: (e) => {
          e.preventDefault();
          ask(input.value);
        },
      },
    },
    h("label", { for: "pi-q" }, "Ask a question about your class"),
    h(
      "div",
      { class: "pi-row" },
      input,
      h("button", { type: "submit", class: "btn btn-primary" }, "Ask"),
    ),
  );
  renderAnswer(ws, out, ws.analystQuestion);
  return h(
    "div",
    {},
    heading(
      2,
      "Research Analyst",
      tip(
        "How it works",
        "Your question is matched to one of a fixed set of question types by its words. The answer is computed here from your data; nothing is sent anywhere and no AI model is used.",
      ),
    ),
    h(
      "p",
      { class: "lead" },
      "Answers come from fixed computations on this device. Each answer shows how the question was read, the data, the time range, the computation and its uncertainty.",
    ),
    form,
    h(
      "div",
      { class: "pi-chips", role: "group", "aria-label": "Example questions" },
      INTENTS.map((i) =>
        h(
          "button",
          { type: "button", class: "btn small", on: { click: () => ask(i.example) } },
          i.example,
        ),
      ),
    ),
    out,
  );
}
