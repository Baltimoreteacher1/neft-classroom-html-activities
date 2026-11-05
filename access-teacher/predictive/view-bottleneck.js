// Language Bottleneck Detector UI: findings as Observed evidence -> Hypothesis -> Recommended instruction ->
// New assessment opportunity, teacher decisions (confirm / reject / note) and a learning-plan builder, all
// stored on this device in the current mode's workspace state.
import { KEY_LANGUAGE_USES } from "../../access-practice-lab/src/lang/klu.js";
import { detectBottlenecks, planFromFinding } from "./bottleneck.js";
import { h, tip } from "./dom.js";

const PLAN_FIELDS = [
  ["objective", "Language objective", "textarea"],
  ["domain", "Domain", "select:Listening,Reading,Speaking,Writing"],
  ["klu", "Key Language Use", `select:${KEY_LANGUAGE_USES.join(",")}`],
  ["practice", "Practice activity", "textarea"],
  ["initialSupport", "Initial support", "textarea"],
  ["fading", "How supports fade", "textarea"],
  ["checkpoint", "Checkpoint date", "date"],
  ["reassessment", "Reassessment", "textarea"],
];

function control(id, kind, value) {
  if (kind === "textarea") return h("textarea", { id, rows: 2, value });
  if (kind === "date") return h("input", { id, type: "date", value });
  const opts = kind.slice(7).split(",");
  return h(
    "select",
    { id },
    opts.map((o) => h("option", { selected: o === value }, o)),
  );
}

function planBuilder(ws, f, idx) {
  const saved = ws.state.plans[f.id];
  const plan = saved || planFromFinding(f, { today: ws.today });
  const msg = h("p", { class: "fine", role: "status" });
  const form = h(
    "form",
    {
      class: "pi-form pi-plan",
      on: {
        submit: (e) => {
          e.preventDefault();
          const next = {};
          for (const [k] of PLAN_FIELDS)
            next[k] = form.querySelector(`#pi-p${idx}-${k}`).value.trim();
          if (!next.objective) {
            msg.textContent = "Write a language objective before saving.";
            return;
          }
          ws.state.plans[f.id] = { ...next, savedAt: new Date().toISOString() };
          ws.save();
          msg.textContent = "Learning plan saved on this device.";
        },
      },
    },
    PLAN_FIELDS.map(([k, label, kind]) =>
      h(
        "div",
        { class: "pi-field" },
        h("label", { for: `pi-p${idx}-${k}` }, label),
        control(`pi-p${idx}-${k}`, kind, plan[k] ?? ""),
      ),
    ),
    h("button", { type: "submit", class: "btn" }, "Save learning plan"),
    msg,
  );
  return h(
    "details",
    { class: "pi-details", open: Boolean(saved) },
    h("summary", {}, saved ? "Learning plan (saved)" : "Build a learning plan"),
    form,
  );
}

function decisionRow(ws, f, idx, card) {
  const d = ws.state.findings[f.id] || {};
  const set = (status) => {
    const cur = ws.state.findings[f.id] || {};
    ws.state.findings[f.id] = {
      ...cur,
      status: cur.status === status ? null : status,
      at: new Date().toISOString(),
    };
    ws.save();
    card.dataset.decision = ws.state.findings[f.id].status || "open";
    for (const b of card.querySelectorAll("[data-decision-btn]"))
      b.setAttribute(
        "aria-pressed",
        String(b.dataset.decisionBtn === ws.state.findings[f.id].status),
      );
    ws.announce(`Finding marked ${ws.state.findings[f.id].status || "open"}.`);
  };
  const note = h("textarea", { id: `pi-n${idx}`, rows: 2, value: d.note || "" });
  const msg = h("span", { class: "fine", role: "status" });
  return h(
    "div",
    { class: "pi-decide" },
    h(
      "div",
      { class: "pi-seg", role: "group", "aria-label": "Your decision on this hypothesis" },
      h(
        "button",
        {
          type: "button",
          class: "btn small",
          "data-decision-btn": "confirmed",
          "aria-pressed": String(d.status === "confirmed"),
          on: { click: () => set("confirmed") },
        },
        "Confirm",
      ),
      h(
        "button",
        {
          type: "button",
          class: "btn small",
          "data-decision-btn": "rejected",
          "aria-pressed": String(d.status === "rejected"),
          on: { click: () => set("rejected") },
        },
        "Reject",
      ),
    ),
    h("div", { class: "pi-field" }, h("label", { for: `pi-n${idx}` }, "Your note"), note),
    h(
      "button",
      {
        type: "button",
        class: "btn small",
        on: {
          click: () => {
            ws.state.findings[f.id] = {
              ...(ws.state.findings[f.id] || {}),
              note: note.value.trim(),
              at: new Date().toISOString(),
            };
            ws.save();
            msg.textContent = "Note saved.";
          },
        },
      },
      "Save note",
    ),
    msg,
  );
}

function findingCard(ws, f, idx) {
  const card = h(
    "article",
    {
      class: "pi-card pi-finding",
      "data-decision": ws.state.findings[f.id]?.status || "open",
      "data-rule": f.rule,
      "aria-labelledby": `pi-f${idx}`,
    },
    h("h4", { id: `pi-f${idx}` }, `${f.student}: ${f.title}`),
    h(
      "dl",
      { class: "pi-dl pi-chain" },
      h("dt", {}, "Observed evidence"),
      h("dd", {}, f.observed),
      h("dt", {}, "Hypothesis"),
      h("dd", {}, f.hypothesis),
      h("dt", {}, "Recommended instruction"),
      h("dd", {}, f.recommendation),
      h("dt", {}, "New assessment opportunity"),
      h("dd", {}, f.assessment),
    ),
  );
  card.append(decisionRow(ws, f, idx, card), planBuilder(ws, f, idx));
  return card;
}

export function renderBottlenecks(ws) {
  const findings = ws.students.flatMap((s) => detectBottlenecks(s, { evidence: ws.evidence(s) }));
  const hidden = findings.filter((f) => ws.state.findings[f.id]?.status === "rejected").length;
  return h(
    "section",
    { "aria-labelledby": "piBottleTitle", class: "pi-bottlenecks" },
    h(
      "h3",
      { id: "piBottleTitle" },
      "Language Bottleneck Detector",
      tip(
        "Bottleneck",
        "A pattern in practice evidence that may be holding a student back. Each one is a hypothesis for you to check, not a diagnosis.",
      ),
    ),
    h(
      "p",
      { class: "fine" },
      `${findings.length} finding${findings.length === 1 ? "" : "s"} from fixed rules over practice evidence${hidden ? `; ${hidden} rejected by you` : ""}. Confirm or reject each one; decisions and notes stay on this device.`,
    ),
    findings.length
      ? findings.map((f, i) => findingCard(ws, f, i))
      : h(
          "p",
          { class: "pi-note" },
          "No patterns met the rules yet. Each rule needs at least 3 practice items in the domains it compares.",
        ),
  );
}
