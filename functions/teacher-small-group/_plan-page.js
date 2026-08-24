/* =============================================================================
 * The small-group plan, as a page a teacher can hold.
 * -----------------------------------------------------------------------------
 * Every small-group lesson already ships a full facilitation plan — who to pull
 * and why, what to ask, what to listen for, what to do when the group stalls,
 * and the sentence frames students borrow. Until now the only way to reach it
 * was `GET /teacher-small-group/<id>/data`, which returns JSON. Nothing rendered
 * it, so in practice the plan did not exist.
 *
 * This is the teacher's half of leading a group. The other half — the studio on
 * screen — deliberately blacks out every teacher-only surface while presenting
 * (engine/core/small-group-present.js), because the screen a teacher turns
 * toward the table is a screen the students can read. That is exactly why this
 * page exists: the coaching has to live somewhere the group cannot see, and
 * paper is the one display a teacher fully controls.
 *
 * Print-first, self-contained, no external assets. Served only behind the same
 * teacher gate as the JSON.
 * ========================================================================== */

const ESCAPES = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };

/** Authored content is trusted-ish, but it renders into HTML — escape it all. */
export function esc(value) {
  return String(value ?? "").replace(/[&<>"']/g, (c) => ESCAPES[c]);
}

function list(items, className) {
  const rows = (Array.isArray(items) ? items : [])
    .map((item) => String(item ?? "").trim())
    .filter(Boolean);
  if (!rows.length) return "";
  return `<ul class="${className}">${rows.map((r) => `<li>${esc(r)}</li>`).join("")}</ul>`;
}

/**
 * One block of the plan. Returns "" when there is nothing authored, so a lesson
 * with a thin plan prints a short sheet rather than a sheet full of empty
 * headings — an empty heading reads as "nothing to do here", which is a lie.
 */
function block(kicker, title, body) {
  if (!body) return "";
  return `<section class="blk">
      <p class="kick">${esc(kicker)}</p>
      <h2>${esc(title)}</h2>
      ${body}
    </section>`;
}

const STYLES = `
:root{color-scheme:light}
*{box-sizing:border-box}
body{margin:0;padding:28px 32px;font:16px/1.55 ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;color:#12355b;background:#fff}
header{border-bottom:3px solid #0f6d78;padding-bottom:14px;margin-bottom:22px}
h1{margin:0 0 6px;font-size:1.7rem;line-height:1.2}
.meta{margin:0;font-size:.95rem;color:#44607f}
.meta strong{color:#0f6d78}
.blk{margin:0 0 20px;padding:14px 16px;border:1.5px solid #cbd5e1;border-radius:10px;break-inside:avoid;page-break-inside:avoid}
.blk.lead{border-color:#0f6d78;border-left-width:6px;background:#f2fbfc}
.kick{margin:0 0 2px;font-size:.72rem;letter-spacing:.09em;text-transform:uppercase;font-weight:700;color:#0f6d78}
h2{margin:0 0 8px;font-size:1.12rem;line-height:1.3}
p.body{margin:0;font-size:1.02rem}
ul{margin:0;padding-left:1.15rem}
li{margin:0 0 6px}
ul.frames li{font-style:italic}
.hint{margin:18px 0 0;font-size:.85rem;color:#5b7391;border-top:1px solid #e2e8f0;padding-top:10px}
.noprint{margin:0 0 18px}
button{font:inherit;padding:9px 16px;border:0;border-radius:99px;background:#0f6d78;color:#fff;font-weight:700;cursor:pointer}
@media print{
  body{padding:0;font-size:12.5pt}
  .noprint{display:none}
  .blk{border-color:#94a3b8}
  .blk.lead{background:transparent}
  @page{margin:14mm}
}
`;

/**
 * Render the printable plan.
 *
 * Order is the order a teacher uses it in: who is at the table, what you open
 * with, what you are listening for, what to do when it stalls, and the frames
 * you hand the students. Sentence frames come last because they are the thing
 * you read aloud, so they want to be findable at a glance mid-lesson.
 */
export function planPageHtml(lessonId, facilitation = {}) {
  const moves = facilitation.teacherMoves || {};
  const label = facilitation.label || "Small group";
  const duration = facilitation.duration || "";
  const lessonNumber = String(lessonId).replace(/-(group[12]|catchup)$/, "");

  const body = [
    block(
      "Before they sit down",
      "Who to pull",
      facilitation.who ? `<p class="body">${esc(facilitation.who)}</p>` : "",
    ),
    block("Open with this", "Ask", moves.ask ? `<p class="body">${esc(moves.ask)}</p>` : ""),
    block(
      "While they work",
      "Listen for",
      moves.lookFor ? `<p class="body">${esc(moves.lookFor)}</p>` : "",
    ),
    block(
      "When the group stalls",
      "If they are stuck",
      moves.ifStuck ? `<p class="body">${esc(moves.ifStuck)}</p>` : "",
    ),
    block(
      "What a strong answer sounds like",
      "Strong vs. weak responses",
      list(facilitation.listenFor, "listen"),
    ),
    block("Give these to students", "Sentence frames", list(facilitation.frames, "frames")),
  ]
    .filter(Boolean)
    .join("\n");

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow">
<title>Small-group plan · Lesson ${esc(lessonNumber)} · Neft Teacher</title>
<style>${STYLES}</style>
</head>
<body>
<header>
  <h1>Small-group plan · Lesson ${esc(lessonNumber)}</h1>
  <p class="meta"><strong>${esc(label)}</strong>${duration ? ` · ${esc(duration)}` : ""} · teacher copy</p>
</header>
<p class="noprint"><button type="button" onclick="window.print()">🖨 Print this plan</button></p>
${body}
<p class="hint">Teacher copy — keep this off the screen you turn toward the table.
While you present the studio, every teacher-only panel is hidden automatically,
so this sheet is where your coaching lives.</p>
</body>
</html>`;
}
