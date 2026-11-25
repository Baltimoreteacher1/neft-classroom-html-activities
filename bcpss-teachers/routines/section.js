// Studio tab: "Routines and checks". Every authored routine block of the unit (shared/bcpss-routines), grouped by family,
// each with its content for the selected WIDA band, a Print / Web page / Word link, an Assign button (student blocks
// only), and a "used" tick that the page-level Save/Resume engine keeps (stable input ids).
import { EXPORT_PATH } from "../../shared/class-platform/bcpss-assignments.js";
import { DRAFT_NOTICE } from "../../shared/bcpss-provenance.js";
import { blocksFor, buildBlock, FAMILIES } from "../../shared/bcpss-routines/index.js";
import { esc, nodesHtml } from "./render.js";

const LEVEL_NAMES = { "1_2": "Levels 1–2", "3_4": "Levels 3–4", "5_6": "Levels 5–6" };

const partUrl = (unitId, part, format, wida) =>
  `${EXPORT_PATH}${encodeURIComponent(unitId)}?format=${format}&part=${part}&wida=${wida}${format === "html" ? "" : "&download=1"}`;

// Open/used state survives the redraw a WIDA band switch causes (the page-level Save/Resume engine keeps the ticks across visits).
const memKey = (unitId, id) => `bcpssRoutines:${unitId}:${id}`;
function remembered(unitId, id) {
  try {
    return JSON.parse(window.sessionStorage.getItem(memKey(unitId, id)) || "{}");
  } catch {
    return {};
  }
}
function remember(unitId, id, patch) {
  try {
    window.sessionStorage.setItem(memKey(unitId, id), JSON.stringify({ ...remembered(unitId, id), ...patch }));
  } catch {
    // Storage blocked: the block still works, it just forgets on redraw.
  }
}

/** Wires the open/used memory for one rendered section (a no-op when the unit has no routines). */
export function bindRoutines(section, unitId) {
  if (!section) return;
  section.addEventListener(
    "toggle",
    (e) => {
      const row = e.target.closest?.("[data-routine]");
      if (row) remember(unitId, row.dataset.routine, { open: e.target.open });
    },
    true,
  );
  section.addEventListener("change", (e) => {
    const row = e.target.closest?.("[data-routine]");
    if (row && e.target.matches("[data-used]")) remember(unitId, row.dataset.routine, { used: e.target.checked });
  });
}

const isGenerated = (block) => block.paths.every((p) => p.startsWith("esol_pack"));

function links(block, unitId, wida) {
  const one = (part, label) => `
    <span class="rt-file"><b>${esc(label)}</b>
      <a href="${partUrl(unitId, part, "html", wida)}" aria-label="${esc(label)}: ${esc(block.title)} as a web page">Web page</a>
      <a href="${partUrl(unitId, part, "pdf", wida)}" aria-label="Print ${esc(label)}: ${esc(block.title)}">Print</a>
      <a href="${partUrl(unitId, part, "docx", wida)}" aria-label="${esc(label)}: ${esc(block.title)} as a Word file">Word</a>
    </span>`;
  const main = one(block.part, block.audience === "student" ? "Student sheet" : "Teacher page");
  return block.keyPart ? `${main}${one(block.keyPart, "Teacher key")}` : main;
}

function row(block, detail, wida) {
  const unitId = detail.unit.id;
  let body;
  try {
    body = nodesHtml(buildBlock(block, detail, wida, "teacher"));
  } catch (err) {
    // A unit whose data is only partly there (an old fixture, a half-written row) loses this card, not the whole tab.
    console.warn(`routines: skipped "${block.id}" for ${unitId}: ${err?.message || err}`);
    return "";
  }
  const assign =
    block.audience === "student"
      ? `<button type="button" class="stt-assign" data-assign data-kind="pr" data-part="${esc(block.part)}" data-title="${esc(block.title)}">Assign</button>`
      : "";
  const mem = remembered(unitId, block.id);
  const draft = isGenerated(block)
    ? `<span class="rt-tag rt-tag--draft" title="${esc(DRAFT_NOTICE)}">Draft: generated from this unit's words</span>`
    : "";
  return `
    <li class="rt-block" data-routine="${esc(block.id)}">
      <details${mem.open ? " open" : ""}>
        <summary>
          <span class="rt-title">${esc(block.title)}</span>
          <span class="rt-blurb">${esc(block.blurb)}</span>
          <span class="rt-tags"><span class="rt-tag">${block.audience === "student" ? "Students" : "Teacher"}</span>${draft}</span>
        </summary>
        <div class="rt-body" data-band="${esc(wida)}">${body}</div>
      </details>
      <div class="rt-actions">
        <label class="rt-used"><input type="checkbox" data-used id="rt-used-${esc(unitId)}-${esc(block.id)}"${mem.used ? " checked" : ""} /> Used this week</label>
        ${links(block, unitId, wida)}
        ${assign}
      </div>
    </li>`;
}

/** The section's markup ("" when the unit has no routine data), for studio-tab.js to place in the panel. */
export function routinesSection(detail, wida) {
  const blocks = blocksFor(detail);
  if (!blocks.length || !detail?.unit) return "";
  const groups = FAMILIES.map((f) => ({
    f,
    rows: blocks
      .filter((b) => b.family === f.id)
      .map((b) => row(b, detail, wida))
      .filter(Boolean),
  }))
    .filter((g) => g.rows.length)
    .map(
      (g) => `
      <div class="rt-family" data-family="${esc(g.f.id)}">
        <h4>${esc(g.f.title)} <small>${esc(g.f.note)}</small></h4>
        <ul class="rt-list-blocks">${g.rows.join("")}</ul>
      </div>`,
    )
    .join("");
  if (!groups) return "";
  return `
      <section class="rt" aria-labelledby="sttRtH" data-section="routines">
        <h3 id="sttRtH" class="stt-h">Routines and checks <span class="rt-level">${esc(LEVEL_NAMES[wida] || "")}</span></h3>
        <p class="rt-intro">Ready-made partner talk, listening, retrieval and rubric blocks for this unit. Content follows the level chosen above. Printed and Word versions carry the same text.</p>
        ${groups}
      </section>`;
}
