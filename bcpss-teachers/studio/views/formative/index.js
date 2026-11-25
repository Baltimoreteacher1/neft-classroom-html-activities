// #/formative: score a class on an exit ticket by alias (one tap each), see the live distribution and the dominant
// misconception, tally the errors you hear, and download the numbers as CSV files for your own records.
// All numbers come from shared/formative; this file only wires the page. Nothing is sent anywhere but the class API.
import { h } from "../../core/dom.js";
import { NOTE, weekStart } from "../../../../shared/formative/constants.js";
import { agreement, distribution, scoresFromRows, tap } from "../../../../shared/formative/scoring.js";
import { SCORE_HEADER, TREND_HEADER, dominantMisconception, errorTrend, scoreRows, toCsv, topErrors, trendRows } from "../../../../shared/formative/insights.js";
import { createFormativeApi, explain } from "./api.js";
import { scoreGrid } from "./grid.js";
import { picker } from "./picker.js";
import { distributionBars, misconceptionCard, tallyPanel, topTable } from "./report.js";

const FLUSH_MS = 350;
let cssLoaded = false;
function ensureCss() {
  if (cssLoaded || typeof document === "undefined") return;
  cssLoaded = true;
  if (!document.querySelector("link[data-st-fm-css]"))
    document.head.append(h("link", { rel: "stylesheet", href: new URL("./formative.css", import.meta.url).href, "data-st-fm-css": "1" }));
}

function download(name, text) {
  const url = URL.createObjectURL(new Blob([`﻿${text}\r\n`], { type: "text/csv;charset=utf-8" }));
  const a = h("a", { href: url, download: name });
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

async function openBoard({ cls, unitId, mount }) {
  const api = createFormativeApi(cls);
  mount.replaceChildren(h("p", { class: "st-loading", role: "status" }, "Loading the class and exit ticket"));
  const [roster, sum] = await Promise.all([api.students(), api.summary(unitId)]);
  if (!sum.ok || !roster) {
    const why = !roster ? "The class roster could not be read. Check the class code and passcode." : explain(sum);
    return mount.replaceChildren(h("p", { class: "st-error", role: "alert" }, why));
  }
  const { ticket, catalog, reteach } = sum.data;
  const st = { scores: scoresFromRows(sum.data.scores), rows: sum.data.errors, pending: new Map(), timer: null };
  const status = h("p", { class: "st-meta", role: "status" });
  const live = h("div", { class: "st-fm-live", "aria-live": "polite" });
  const say = (text) => { status.textContent = text; };

  function paintLive() {
    const dist = distribution(roster, st.scores.teacher);
    const top = topErrors(st.rows, catalog);
    const trend = errorTrend(st.rows, catalog, Date.now());
    const parts = [
      distributionBars(dist, { id: "teacher", text: "Class distribution (your scores)" }),
      misconceptionCard(dominantMisconception({ catalog, rows: st.rows, dist }), reteach),
    ];
    if (Object.keys(st.scores.self).length) {
      const a = agreement(st.scores);
      parts.push(distributionBars(distribution(roster, st.scores.self), { id: "self", text: "Student self-scores (separate from yours)" }),
        h("p", { class: "st-meta" }, `Self and teacher scores match for ${a.same} of ${a.both} students scored both ways.`));
    }
    parts.push(topTable(top, trend, reteach));
    live.replaceChildren(...parts);
  }

  async function flush() {
    clearTimeout(st.timer);
    if (!st.pending.size) return;
    const batch = [...st.pending].map(([studentId, level]) => ({ studentId, level }));
    st.pending.clear();
    const res = await api.saveScores(unitId, ticket.ticketId, batch);
    if (res.ok) return say(`Saved ${batch.length} ${batch.length === 1 ? "score" : "scores"}.`);
    for (const e of batch) if (!st.pending.has(e.studentId)) st.pending.set(e.studentId, e.level);
    say(`${explain(res)} Tap any level again, or press Save, to retry.`);
  }

  const grid = scoreGrid(roster, (id) => st.scores.teacher[id], (id, level) => {
    const r = tap(st.scores, id, level);
    st.scores = r.scores;
    st.pending.set(id, r.level);
    grid.refresh();
    paintLive();
    clearTimeout(st.timer);
    st.timer = setTimeout(flush, FLUSH_MS);
  });

  async function bump(type, count) {
    const week = weekStart(Date.now());
    const before = st.rows;
    const hit = before.find((r) => r.errorType === type && r.weekStart === week);
    st.rows = hit
      ? before.map((r) => (r === hit ? { ...r, count: Math.max(0, r.count + count) } : r))
      : [...before, { errorType: type, weekStart: week, count: Math.max(0, count) }];
    paintLive();
    const res = await api.bumpErrors(unitId, [{ type, count }]);
    if (res.ok) return;
    st.rows = before;
    paintLive();
    say(explain(res));
  }

  const save = (name, header, rows) => download(`${name}.csv`, toCsv(header, [...rows, [`# ${NOTE}`]]));
  const exportBar = h("p", { class: "st-row" },
    h("button", { class: "st-btn", type: "button", onclick: () => flush() }, "Save now"),
    h("button", { class: "st-btn", type: "button", onclick: () => save(`exit-ticket-${unitId}-scores`, SCORE_HEADER, scoreRows({ ticketId: ticket.ticketId, unitId, roster, scores: st.scores })) }, "Download scores (CSV)"),
    h("button", { class: "st-btn", type: "button", onclick: () => save(`exit-ticket-${unitId}-error-trend`, TREND_HEADER, trendRows({ unitId, rows: st.rows, catalog })) }, "Download error trend (CSV)"),
  );
  const rubric = h("dl", { class: "st-fm-rubric" }, ["emerging", "developing", "proficient"].flatMap((l) => [h("dt", {}, l[0].toUpperCase() + l.slice(1)), h("dd", {}, ticket.rubric[l])]));
  paintLive();
  mount.replaceChildren(
    h("section", { class: "st-fm-card", "aria-labelledby": "st-fm-ticket" },
      h("h2", { id: "st-fm-ticket" }, `Exit ticket: ${ticket.unitTitle}`),
      h("p", { class: "st-fm-lead" }, ticket.prompt),
      ticket.targetFrame ? h("p", {}, h("strong", {}, "Frame: "), ticket.targetFrame) : null,
      rubric),
    h("section", { "aria-labelledby": "st-fm-score" },
      h("h2", { id: "st-fm-score" }, "Score by alias"),
      h("p", { class: "st-hint" }, "One tap per student. Tap the same level again to clear it. With a row focused, press 1, 2 or 3."),
      grid.el, status),
    live, tallyPanel(catalog, bump), exportBar,
    h("p", { class: "st-meta" }, NOTE),
  );
  return () => { void flush(); };
}

export async function render({ root, params = {}, shell }) {
  ensureCss();
  const mount = h("div", { class: "st-fm-board" });
  let closeBoard = null;
  root.replaceChildren(
    h("div", { class: "st-fm" },
      h("h1", {}, "Exit tickets and error trends"),
      h("p", { class: "st-hint" }, "Score a class on the exit ticket by alias, see the whole-class picture at once, and keep the numbers in your own files."),
      picker({ params, catalog: shell.catalog, onOpen: async (sel) => { closeBoard?.(); closeBoard = await openBoard({ ...sel, mount }); } }),
      mount,
    ),
  );
  return () => closeBoard?.();
}
