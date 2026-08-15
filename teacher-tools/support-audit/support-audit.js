/* support-audit.js — /teacher-tools/support-audit/
 *
 * Every instructional decision the lesson support system makes, in one table a
 * teacher can argue with.
 *
 * WHY THIS EXISTS. The decisions this system makes are instructional, not
 * technical: whether a calculator belongs in a lesson about the division
 * algorithm is a teaching judgement, and a teaching judgement buried in a
 * `requires` function is a judgement nobody can review. Everything here is
 * DERIVED — the catalogue's own applicability rules, the authored review file,
 * and the generated manifest — so the table cannot drift from the behaviour it
 * describes. There is no second copy of any decision.
 *
 * NO STUDENT DATA. Lessons and supports. Nothing on this page is about a
 * person, and nothing here reads or writes a support profile.
 *
 * The page is teacher-gated by its /teacher-tools/ path (functions/_middleware).
 */

const REVIEW_URL = "/data/lesson-support-applicability-review.json";
const OVERRIDES_URL = "/data/lesson-support-overrides.json";
const MANIFEST_URL = "/assets/learning-supports/manifest.json";

const LS = window.EWLLessonSupports || null;
const body = document.getElementById("sa-body");
const countEl = document.getElementById("sa-count");

const esc = (s) =>
  String(s == null ? "" : s).replace(
    /[&<>"]/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c],
  );

let ROWS = [];

/* -------------------------------------------------------------------------
 * Build the rows. Four SOURCES, named on every row so a teacher who disagrees
 * knows which file to change:
 *   catalogue      — the support's own applicability rule
 *   review         — an authored instructional decision, with evidence
 *   small group    — a variant that already carries the support itself
 *   classification — the support's impact (only surfaced for modifications)
 * ---------------------------------------------------------------------- */
function ctxFor(overrides, lessonId) {
  const o = (overrides.lessons || {})[lessonId] || {};
  return {
    computationIsObjective: !!o.computationIsObjective,
    factRecallIsObjective: !!o.factRecallIsObjective,
    pin: Array.isArray(o.pin) ? o.pin : [],
    excluded: Array.isArray(o.exclude) ? o.exclude.map((e) => e.key || e) : [],
  };
}

function buildRows(manifest, overrides, review) {
  const rows = [];
  const reviewsByLesson = new Map();
  for (const r of review.reviews || []) {
    const list = reviewsByLesson.get(r.lessonId) || [];
    list.push(r);
    reviewsByLesson.set(r.lessonId, list);
  }

  for (const lessonId of Object.keys(manifest)) {
    const entry = manifest[lessonId];
    const unit = Number(String(lessonId).split("-")[0]) || null;
    const ctx = ctxFor(overrides, lessonId);
    const offered = new Set(
      LS.applicableSupports(entry, ctx)
        .filter((s) => !ctx.excluded.includes(s.key))
        .map((s) => s.key),
    );
    const authored = reviewsByLesson.get(lessonId) || [];
    const authoredBySupport = new Map(authored.map((r) => [r.support, r]));

    for (const support of LS.CATALOG) {
      const rec = authoredBySupport.get(support.key);
      const isOffered = offered.has(support.key);
      let decision;
      let why;
      let source;

      if (rec && rec.decision === "suppress") {
        decision = "suppress";
        why = rec.reason;
        source = "Reviewed lesson decision";
      } else if (rec && rec.decision === "allow") {
        decision = "allow";
        why = rec.reason;
        source = "Reviewed lesson decision";
      } else if (rec && rec.decision === "pin") {
        decision = "pin";
        why = rec.reason;
        source = "Reviewed lesson decision";
      } else if (!isOffered) {
        decision = "suppress";
        why = LS.explainUnavailable(support.key, ctx);
        source = "This lesson has nothing for it to use";
      } else {
        decision = "offered";
        why = support.contract.may[0];
        source = "Support rule";
      }

      rows.push({
        lessonId,
        unit,
        title: entry.title || "",
        support: support.key,
        supportLabel: support.label,
        impact: support.impact,
        decision,
        why: why || "",
        source,
        evidence: rec ? rec.evidence || [] : [],
        status: rec ? rec.status || "reviewed" : "",
        variantIntrinsic: [],
      });
    }

    // A support a small-group variant already carries is a fifth kind of
    // decision, and the one most likely to look like a bug from outside: the
    // support IS on, and the variant still does not add it, because the variant
    // already wrote its own.
    for (const [name, v] of Object.entries(entry.variants || {})) {
      for (const key of v.intrinsic || []) {
        const s = LS.byKey[key];
        if (!s) continue;
        rows.push({
          lessonId: v.id,
          unit,
          title: v.title || `${lessonId} · ${name}`,
          support: key,
          supportLabel: s.label,
          impact: s.impact,
          decision: "intrinsic",
          why: LS.explainSuppressed(key, v.title || "this small-group lesson"),
          source: "Written into this small-group lesson",
          evidence: [],
          status: "",
          variantIntrinsic: [key],
        });
      }
    }
  }
  return rows;
}

/* ---------------------------------------------------------------------- */
const DECISION_LABEL = {
  offered: "Offered",
  suppress: "Withheld",
  allow: "Reviewed &amp; allowed",
  pin: "Always visible",
  intrinsic: "Built in already",
};

function matches(row, f) {
  if (f.unit && String(row.unit) !== f.unit) return false;
  if (f.support && row.support !== f.support) return false;
  if (f.decision) {
    if (f.decision === "modification") {
      if (row.impact !== "modification") return false;
    } else if (f.decision === "teacher-review") {
      if (row.status !== "teacher-review") return false;
    } else if (row.decision !== f.decision) return false;
  }
  if (f.search) {
    const hay = `${row.lessonId} ${row.title} ${row.supportLabel} ${row.why}`.toLowerCase();
    if (!hay.includes(f.search)) return false;
  }
  return true;
}

function render() {
  const f = {
    search: document.getElementById("f-search").value.trim().toLowerCase(),
    unit: document.getElementById("f-unit").value,
    support: document.getElementById("f-support").value,
    decision: document.getElementById("f-decision").value,
  };
  const shown = ROWS.filter((r) => matches(r, f));
  const needsReview = ROWS.filter((r) => r.status === "teacher-review").length;

  countEl.textContent =
    `${shown.length} of ${ROWS.length} decisions shown` +
    (needsReview ? ` · ${needsReview} flagged for your review` : "");

  if (!shown.length) {
    body.innerHTML = `<tr><td colspan="5" class="sa-empty">No decisions match those filters.</td></tr>`;
    return;
  }

  // Capped for responsiveness; the count line above always reports the true
  // total, so a cap can never read as "that is all there is".
  const LIMIT = 400;
  const page = shown.slice(0, LIMIT);
  body.innerHTML =
    page
      .map((r) => {
        const flags = [];
        if (r.impact === "modification")
          flags.push(`<span class="sa-flag sa-mod">Changes the task</span>`);
        if (r.status === "teacher-review")
          flags.push(`<span class="sa-flag sa-review">Needs your review</span>`);
        const ev = r.evidence.length
          ? `<ul class="sa-evidence">${r.evidence.map((e) => `<li>${esc(e)}</li>`).join("")}</ul>`
          : "";
        return (
          `<tr>` +
          `<td><a href="/curriculum/student-supports/?lesson=${esc(LS.parentLessonId(r.lessonId) || r.lessonId)}">${esc(r.lessonId)}</a>` +
          `<span class="sa-title">${esc(r.title)}</span></td>` +
          `<td>${esc(r.supportLabel)}${flags.join("")}</td>` +
          `<td><span class="sa-decision sa-${esc(r.decision)}">${DECISION_LABEL[r.decision] || esc(r.decision)}</span></td>` +
          `<td>${esc(r.why)}${ev}</td>` +
          `<td class="sa-source">${esc(r.source)}</td>` +
          `</tr>`
        );
      })
      .join("") +
    (shown.length > LIMIT
      ? `<tr><td colspan="5" class="sa-empty">Showing the first ${LIMIT}. Narrow the filters to see the rest.</td></tr>`
      : "");
}

async function boot() {
  if (!LS) {
    body.innerHTML = `<tr><td colspan="5" class="sa-empty">The support catalogue could not be loaded. Reload the page.</td></tr>`;
    return;
  }
  let manifest;
  let overrides;
  let review;
  try {
    [manifest, overrides, review] = await Promise.all(
      [MANIFEST_URL, OVERRIDES_URL, REVIEW_URL].map((u) =>
        fetch(u, { credentials: "same-origin" }).then((r) => r.json()),
      ),
    );
  } catch {
    body.innerHTML = `<tr><td colspan="5" class="sa-empty">Could not load the curriculum data. Check your connection and reload.</td></tr>`;
    return;
  }

  ROWS = buildRows(manifest, overrides, review);

  const units = [...new Set(ROWS.map((r) => r.unit).filter(Boolean))].sort((a, b) => a - b);
  document
    .getElementById("f-unit")
    .insertAdjacentHTML(
      "beforeend",
      units.map((u) => `<option value="${u}">Unit ${u}</option>`).join(""),
    );
  document
    .getElementById("f-support")
    .insertAdjacentHTML(
      "beforeend",
      LS.CATALOG.map((s) => `<option value="${esc(s.key)}">${esc(s.label)}</option>`).join(""),
    );

  for (const id of ["f-search", "f-unit", "f-support", "f-decision"]) {
    document.getElementById(id).addEventListener("input", render);
  }
  document.getElementById("f-clear").addEventListener("click", () => {
    document.getElementById("sa-filters").reset();
    render();
  });

  // Deep link, so "show me everything still needing review" is bookmarkable.
  const q = new URLSearchParams(location.search);
  if (q.get("decision")) document.getElementById("f-decision").value = q.get("decision");
  if (q.get("lesson")) document.getElementById("f-search").value = q.get("lesson");

  render();
}

boot();

export { buildRows, matches };
