// BCPSS Teacher Studio — Language Studio tab (v2): launchpad into the student player + printable resources.
// The player itself lives at /bcpss-teachers/language-studio/ (student-facing). This tab is the teacher's shelf.

const esc = (value) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c],
  );

const DOMAINS = ["Listening", "Speaking", "Reading", "Writing", "Vocabulary", "Game"];

// Printable resources, one tidy shelf. `part` is the export endpoint part (see functions/api/bcpss/export).
const RESOURCES = [
  { part: "book", title: "Student Activity Book", note: "Every activity, ready to print" },
  { part: "key", title: "Answer Key", note: "Answers, models, rubric" },
  { part: "cards", title: "Vocabulary Cards", note: "Cut-out flashcards" },
  { part: "bingo", title: "Vocabulary Bingo", note: "Six boards + call sheet" },
  { part: "wall", title: "Word Wall", note: "Large-print strips" },
  { part: "poster", title: "Mentor Sentence Poster", note: "Color-coded anchor chart" },
  { part: "strips", title: "Sentence Strips", note: "Frames by level" },
  { part: "talk", title: "Talk Cards", note: "Partner conversation deck" },
  { part: "packet", title: "Unit Overview", note: "Planning page for teachers" },
];

const studioUrl = (unitId, wida, index) => {
  const params = new URLSearchParams({ unit: unitId, level: `l${wida}` });
  if (index) params.set("a", String(index));
  return `/bcpss-teachers/language-studio/?${params}`;
};

const exportUrl = (unitId, part, format, wida) =>
  `/api/bcpss/export/${encodeURIComponent(unitId)}?format=${format}&part=${part}&wida=${wida}${format === "html" ? "" : "&download=1"}`;

function activityRow(a, i, unitId, wida) {
  return `
    <li class="stt-row stt-row--${esc(a.domain.toLowerCase())}">
      <span class="stt-num" aria-hidden="true">${i + 1}</span>
      <div class="stt-main">
        <b>${esc(a.title)}</b>
        <span>${esc(a.mission)}</span>
        <small>${esc(a.domain)} · ${esc(a.minutes)} min · ${esc(a.grouping)}</small>
      </div>
      <div class="stt-actions">
        <a class="stt-play" href="${studioUrl(unitId, wida, i + 1)}">Play</a>
        <a class="stt-print" href="${exportUrl(unitId, `activity-${i + 1}`, "pdf", wida)}" aria-label="Print ${esc(a.title)}">Print</a>
      </div>
    </li>`;
}

function resourceCard(r, unitId, wida) {
  return `
    <li class="stt-res">
      <b>${esc(r.title)}</b>
      <span>${esc(r.note)}</span>
      <div>
        <a href="${exportUrl(unitId, r.part, "pdf", wida)}">PDF</a>
        <a href="${exportUrl(unitId, r.part, "docx", wida)}">Word</a>
      </div>
    </li>`;
}

export function renderStudioTab(panel, { detail, wida }) {
  const studio = detail?.studio;
  const unit = detail?.unit;
  if (!studio || !unit) {
    panel.innerHTML = `<div class="bh-empty">This unit's Language Studio is being finished. Check back soon.</div>`;
    return;
  }
  const counts = DOMAINS.map((d) => ({
    d,
    n: studio.activities.filter((a) => a.domain === d).length,
  })).filter((x) => x.n);
  const rows = studio.activities.map((a, i) => activityRow(a, i, unit.id, wida)).join("");
  panel.innerHTML = `
    <div class="stt">
      <section class="stt-hero" aria-labelledby="sttHeroH">
        <div>
          <h3 id="sttHeroH">Language Studio</h3>
          <p>${studio.activities.length} games and language activities students can play on any device. Self-checking, no timers, every level supported.</p>
          <p class="stt-chips">${counts.map((c) => `<span>${esc(c.d)} · ${c.n}</span>`).join("")}</p>
        </div>
        <a class="stt-launch" href="${studioUrl(unit.id, wida)}">Open Language Studio</a>
      </section>
      <section aria-labelledby="sttListH">
        <h3 id="sttListH" class="stt-h">All activities</h3>
        <ol class="stt-list">${rows}</ol>
      </section>
      <section aria-labelledby="sttResH">
        <h3 id="sttResH" class="stt-h">Printables and resources</h3>
        <ul class="stt-res-grid">${RESOURCES.map((r) => resourceCard(r, unit.id, wida)).join("")}</ul>
      </section>
    </div>`;
}
