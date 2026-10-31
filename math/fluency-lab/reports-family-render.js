// Markup for the student report and the family report: accessible SVG sparklines and bars with text alternatives, a clear
// split between observed and inferred facts, plain language in English or Spanish, and a Letter print layout.
import { stateLabel } from "./achievements-4.js";
import { REPORT_CSS } from "./reports-family-css.js";
import { categoryLabel, reasonLabel, startLabel } from "./reports-family.js";
import { reportHeaderArt, emptyStateArt } from "./illustrations.js";
import { getLang, t } from "./i18n.js";

// Heading levels: the standalone document starts at h1; embedded in a page that has its own h1 it starts at h2.
let levels = [1, 2];
const esc = (value) =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
const dateText = (time) =>
  new Date(time).toLocaleDateString(getLang() === "es" ? "es" : "en", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

// A badge that says where a fact comes from, in words (never colour alone).
const basis = (kind) =>
  kind === "observed"
    ? `<span class="rp-basis rp-observed">${t("Observed")}</span>`
    : `<span class="rp-basis rp-inferred">${t("Inferred")}</span>`;

// Score bar: the number and the state are always printed beside it.
export function scoreBar(score) {
  const width = Math.max(2, Math.min(100, Math.round(score)));
  return `<svg class="rp-bar" viewBox="0 0 100 8" preserveAspectRatio="none" aria-hidden="true" focusable="false"><rect width="100" height="8" rx="4" class="rp-bar-track"/><rect width="${width}" height="8" rx="4" class="rp-bar-fill"/></svg>`;
}

// Sparkline with a text alternative that lists the first and last values. Needs two points; one point draws one dot.
export function sparkline(points, label) {
  const list = points.filter((point) => Number.isFinite(point.score));
  const width = 120;
  const height = 36;
  const x = (index) =>
    list.length < 2 ? width / 2 : 6 + (index * (width - 12)) / (list.length - 1);
  const y = (score) => height - 6 - (Math.max(0, Math.min(100, score)) / 100) * (height - 12);
  const path = list
    .map(
      (point, index) => `${index ? "L" : "M"}${x(index).toFixed(1)} ${y(point.score).toFixed(1)}`,
    )
    .join(" ");
  const first = list[0];
  const last = list.at(-1);
  const alt =
    list.length > 1
      ? t("{skill}: score went from {a} to {b} over {n} checkpoints.", {
          skill: label,
          a: first.score,
          b: last.score,
          n: list.length,
        })
      : t("{skill}: score is {a}.", { skill: label, a: last?.score ?? 0 });
  const dots = list
    .map(
      (point, index) =>
        `<circle cx="${x(index).toFixed(1)}" cy="${y(point.score).toFixed(1)}" r="${index === list.length - 1 ? 3.5 : 2.2}" class="rp-dot"/>`,
    )
    .join("");
  return `<svg class="rp-spark" viewBox="0 0 ${width} ${height}" role="img" aria-label="${esc(alt)}"><title>${esc(alt)}</title><line x1="6" y1="${height - 6}" x2="${width - 6}" y2="${height - 6}" class="rp-axis"/>${list.length > 1 ? `<path d="${path}" class="rp-line"/>` : ""}${dots}</svg>`;
}

const section = (title, kind, body, note = "") =>
  `<section class="rp-sec"><h${levels[1]} class="rp-h2">${esc(title)}${kind ? ` ${basis(kind)}` : ""}</h${levels[1]}>${note ? `<p class="rp-note">${esc(note)}</p>` : ""}${body}</section>`;
const empty = (text) => `<p class="rp-empty">${esc(text)}</p>`;
const list = (items) => `<ul class="rp-list">${items.join("")}</ul>`;

function headerHtml(report, audience) {
  const student = audience === "student";
  const title = student ? t("My Math Fluency Report") : t("Family Math Fluency Report");
  const who = report.name
    ? student
      ? t("For {name}", { name: esc(report.name) })
      : t("For {name}", { name: esc(report.name) })
    : student
      ? t("Made from my own practice")
      : t("Made from your learner’s own practice");
  const scope = t("Skills practiced: Grade {n}", { n: report.grade === 0 ? "K" : report.grade });
  return `<header class="rp-head"><span class="rp-art">${reportHeaderArt(audience, { decorative: true, size: 72, idPrefix: "rp-head" })}</span><div><p class="rp-kicker">${t("Math Fluency Lab")}</p><h${levels[0]} class="rp-h1">${esc(title)}</h${levels[0]}><p class="rp-meta">${who} · ${esc(scope)} · ${esc(dateText(report.generatedAt))}</p></div></header>`;
}

const keyHtml = () =>
  `<p class="rp-key">${basis("observed")} ${t("is what the learner did and answered.")} ${basis("inferred")} ${t("is what the practice suggests. It is never a grade level or a prediction.")}</p>`;

function summaryHtml(report, audience) {
  const tile = (value, label, kind) =>
    `<div class="rp-tile"><b>${esc(value)}</b><span>${esc(label)}</span>${basis(kind)}</div>`;
  const student = audience === "student";
  return `<div class="rp-tiles">${tile(report.totals.skills, student ? t("skills I practiced") : t("skills practiced"), "observed")}${tile(report.totals.independent, student ? t("checks on my own") : t("checks done independently"), "observed")}${tile(report.evidence.practiceDays, student ? t("days I practiced") : t("practice days"), "observed")}${tile(report.totals.states.proficient + report.totals.states.mastered, student ? t("skills solid or better") : t("skills proficient or better"), "inferred")}</div>`;
}

function startedHtml(report, audience) {
  const lead = audience === "student" ? t("Where I started") : t("Where your learner started");
  if (!report.started.length)
    return section(
      lead,
      "observed",
      empty(
        t(
          "A starting point appears here after a starting-point checkup or a first progress snapshot.",
        ),
      ),
    );
  const rows = report.started.map(
    (row) => `<li><span>${esc(row.title)}</span><b>${esc(startLabel(row.start))}</b></li>`,
  );
  return section(lead, "observed", list(rows));
}

function currentHtml(report, audience) {
  const lead = audience === "student" ? t("Where I am now") : t("Where your learner is now");
  if (!report.rows.length)
    return section(
      lead,
      "inferred",
      empty(t("No independent practice has been saved for this grade yet.")),
    );
  const rows = report.rows
    .slice(0, 8)
    .map(
      (row) =>
        `<li class="rp-bar-row"><span class="rp-name">${esc(row.title)}</span>${scoreBar(row.score)}<b>${esc(stateLabel(row.state))} · ${row.score}</b></li>`,
    );
  return section(
    lead,
    "inferred",
    list(rows),
    t(
      "Scores run from 0 to 100 and come from independent, spaced practice. Hints and repeats do not raise them.",
    ),
  );
}

function growthHtml(report, audience) {
  const lead = audience === "student" ? t("How I have grown") : t("Growth over time");
  if (!report.growth.length)
    return section(
      lead,
      "observed",
      empty(t("Growth appears here once there is a starting point to compare with.")),
    );
  const rows = report.growth.map((row) => {
    if (row.kind === "checkup") return `<li><span class="rp-name">${esc(row.title)}</span><b>${esc(startLabel(row.start))} → ${esc(stateLabel(row.to))}</b></li>`;
    const points = row.history.length > 1 ? row.history : [{ score: row.fromScore }, { score: row.toScore }];
    const change = row.delta > 0 ? t("up {n}", { n: row.delta }) : t("down {n}", { n: Math.abs(row.delta) });
    return `<li class="rp-growth"><span class="rp-name">${esc(row.title)}</span>${sparkline(points, row.title)}<b>${esc(stateLabel(row.from))} → ${esc(stateLabel(row.to))} (${esc(change)})</b></li>`;
  });
  return section(lead, "observed", list(rows));
}

function retainedHtml(report, audience) {
  const lead = audience === "student" ? t("Skills I still remember") : t("Skills still remembered");
  const body = report.retained.length
    ? list(
        report.retained.map(
          (row) =>
            `<li><span>${esc(row.title)}</span><b>${esc(t("{n} days later", { n: row.daysHeld }))}</b></li>`,
        ),
      )
    : empty(t("A skill shows here after it is solved on your own again a week or more later."));
  return section(lead, "inferred", body);
}

function correctedHtml(report, audience) {
  const lead = audience === "student" ? t("Tricky ideas I fixed") : t("Tricky ideas corrected");
  const body = report.corrected.length
    ? list(
        report.corrected.map(
          (row) =>
            `<li><span>${esc(row.title)}</span><b>${esc(categoryLabel(row.category))}</b></li>`,
        ),
      )
    : empty(
        t("When a repeated slip is fixed with two fresh right answers in a row, it shows here."),
      );
  return section(lead, "observed", body);
}

function nextHtml(report, audience) {
  const lead = audience === "student" ? t("Good next skills for me") : t("Good next skills to try");
  const body = report.next.length
    ? list(
        report.next.map(
          (row) => `<li><span>${esc(row.title)}</span><b>${esc(reasonLabel(row.reason))}</b></li>`,
        ),
      )
    : empty(t("Pick any skill to begin."));
  return section(lead, "inferred", body, t("Suggestions only. Any practice is optional."));
}

function evidenceHtml(report, audience) {
  const ev = report.evidence;
  const items = [
    t("{n} checks answered on their own, {c} of them right", {
      n: report.totals.independent,
      c: report.totals.correct,
    }),
    t("{n} checks answered with a hint or a second try", { n: report.totals.supported }),
  ];
  if (ev.strategies) items.push(t("{n} different ways of thinking used", { n: ev.strategies }));
  if (ev.explanations !== null)
    items.push(
      t("{n} explanations written, using {w} math words", { n: ev.explanations, w: ev.mathWords }),
    );
  const lead = audience === "student" ? t("What I did") : t("What your learner did");
  return section(lead, "observed", list(items.map((text) => `<li><span>${esc(text)}</span></li>`)));
}

function helpHtml() {
  const tips = [
    t("Ask: “Show me how you solved one. What did you do first?”"),
    t("Ask: “How could you check that answer?”"),
    t("Celebrate effort and fixing mistakes, not speed. All practice is optional."),
  ];
  return section(
    t("How to help at home"),
    "",
    list(tips.map((text) => `<li><span>${esc(text)}</span></li>`)),
  );
}

export function reportHtml(report, audience = "student", { embedded = false } = {}) {
  levels = embedded ? [2, 3] : [1, 2];
  const student = audience === "student";
  if (!report.rows.length)
    return `<article class="rp" data-report="${audience}">${headerHtml(report, audience)}<div class="rp-blank"><span aria-hidden="true">${emptyStateArt("report", { decorative: true, size: 96, idPrefix: "rp-empty" })}</span><p>${esc(student ? t("Your report starts after you practice a few skills on your own.") : t("This report starts after your learner practices a few skills on their own."))}</p></div></article>`;
  return `<article class="rp" data-report="${audience}">${headerHtml(report, audience)}${keyHtml()}${summaryHtml(report, audience)}${startedHtml(report, audience)}${currentHtml(report, audience)}${growthHtml(report, audience)}<div class="rp-two">${retainedHtml(report, audience)}${correctedHtml(report, audience)}</div>${nextHtml(report, audience)}${evidenceHtml(report, audience)}${student ? "" : helpHtml()}<footer class="rp-foot">${t("Saved on this device only. Nothing was uploaded to make this report. It shows practice, not a grade.")}</footer></article>`;
}

// A standalone file a family can save, share or print (Letter, up to two pages).
export function reportDocument(report, audience = "student") {
  const title =
    audience === "student" ? t("My Math Fluency Report") : t("Family Math Fluency Report");
  return `<!doctype html><html lang="${getLang()}"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/><title>${esc(title)}</title><style>${REPORT_CSS}</style></head><body class="rp-doc">${reportHtml(report, audience)}</body></html>`;
}
