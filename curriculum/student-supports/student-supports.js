/* student-supports.js — /curriculum/student-supports/
 *
 * A NAVIGATION and STRATEGY surface, not a student record. Everything shown
 * here is template material keyed by SKILL FAMILY (ratios, geometry, …) — no
 * student names, no classifications, no IEP records. Those live behind their
 * own controls in the Learning Supports Manager, which this page links to.
 *
 * SOURCE OF TRUTH. Nothing is copied into this layer:
 *   data/curriculum-supports.json          the support strategies themselves
 *   data/curriculum-teacher-workflow.json  familyRules: lesson → skill family
 *   data/curriculum-launch-manifest.json   lesson ids, titles, small-group routes
 * The family resolution repeats the rule order used by
 * assets/curriculum-teacher-workflow.js so a lesson resolves to the same family
 * on both surfaces; the rules themselves stay in the manifest.
 *
 * Kept as a module with no inline handlers — the generated validator resolves
 * every inline on* attribute to a defined function, and the cheapest way to
 * pass that forever is never to write one.
 */

const root = document.querySelector(".student-supports-wrap");
const main = document.getElementById("main");

const DATA = {};
let lessons = [];
let smallGroupsByParent = new Map();

const esc = (s) =>
  String(s == null ? "" : s).replace(
    /[&<>"]/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c],
  );

/** Lesson → skill family, by the same ordered regex rules the teacher workflow
 * uses. First match wins; "general" is the documented fallback. */
export function familyFor(lesson, rules) {
  const text = `${lesson?.title || ""} ${lesson?.standard || ""}`.toLowerCase();
  for (const rule of rules || []) {
    try {
      if (new RegExp(rule.pattern, "i").test(text)) return rule.family;
    } catch {
      /* a malformed authored rule must not take the page down */
    }
  }
  return "general";
}

function chips(list) {
  if (!Array.isArray(list) || !list.length) return "";
  return `<ul class="chips">${list.map((v) => `<li>${esc(v)}</li>`).join("")}</ul>`;
}

/** One answer to one teacher question. Section, heading, body — no cards inside
 * cards, no badges. */
function block(id, question, body, actions) {
  if (!body && !actions) return "";
  return (
    `<section class="sup-block" aria-labelledby="${id}">` +
    `<h2 id="${id}">${esc(question)}</h2>` +
    (body || "") +
    (actions ? `<p class="sup-actions">${actions}</p>` : "") +
    `</section>`
  );
}

function renderLesson(lesson) {
  const rules = DATA.workflow?.familyRules || [];
  const key = familyFor(lesson, rules);
  const f = DATA.supports?.families?.[key] || DATA.supports?.families?.general;
  if (!f) {
    main.innerHTML = `<p class="empty-state">Support strategies could not be loaded. Reload the page.</p>`;
    return;
  }
  const id = lesson.id;
  const groups = smallGroupsByParent.get(id) || [];
  const launch = (params) =>
    `/curriculum/student-launch/?lesson=${encodeURIComponent(id)}${params ? `&supports=${params}` : ""}`;

  const bbs = f.becauseButSo || {};
  main.innerHTML =
    `<p class="sup-context">Supports for <strong>${esc(lesson.title)}</strong> · Lesson ${esc(id)} · ${esc(lesson.standard || "")}` +
    ` <span class="sup-family">${esc(f.label || key)}</span></p>` +
    `<p class="sup-rigor">These scaffold <em>access</em> to the grade-level standard. None of them lowers the mathematics.</p>` +
    block(
      "q-esol",
      "What can I use with my multilingual students?",
      (f.vocabulary?.length ? `<h3>Words to pre-teach</h3>${chips(f.vocabulary)}` : "") +
        (f.sentenceFrame
          ? `<h3>Sentence frame</h3><p class="frame">${esc(f.sentenceFrame)}</p>`
          : "") +
        (bbs.because || bbs.but || bbs.so
          ? `<h3>Because / But / So</h3><ul class="bbs">` +
            (bbs.because ? `<li><b>Because</b> ${esc(bbs.because)}</li>` : "") +
            (bbs.but ? `<li><b>But</b> ${esc(bbs.but)}</li>` : "") +
            (bbs.so ? `<li><b>So</b> ${esc(bbs.so)}</li>` : "") +
            `</ul>`
          : "") +
        (f.wida12 ? `<h3>Entering / Emerging</h3><p>${esc(f.wida12)}</p>` : "") +
        (f.wida34 ? `<h3>Developing / Expanding</h3><p>${esc(f.wida34)}</p>` : ""),
      `<a class="btn" href="${launch("frames,vocab,tts")}">Open the student lesson with frames, vocabulary and read-aloud</a>` +
        `<a class="btn ghost" href="${launch("vocab,frames")}">Frames and vocabulary only</a>`,
    ) +
    block(
      "q-access",
      "What accommodations can I give without changing the objective?",
      (f.sped ? `<p>${esc(f.sped)}</p>` : "") +
        (f.visualModel ? `<h3>Model to put in front of them</h3><p>${esc(f.visualModel)}</p>` : ""),
      `<a class="btn" href="${launch("frames,vocab,iep-writing-frame,model")}">Open with a writing frame and the model</a>` +
        `<a class="btn ghost" href="/teacher-tools/learning-supports-manager/">Set up per-student supports</a>`,
    ) +
    block(
      "q-scaffold",
      "Is there a more scaffolded pathway?",
      groups.length
        ? `<p>Small-group versions of this lesson, with the same objective and more support:</p>` +
            `<ul class="routes">${groups
              .map((g) => `<li><a href="/lessons/${esc(g.id)}/">${esc(g.title)}</a></li>`)
              .join("")}</ul>`
        : `<p>This lesson has no small-group version. The whole-group lesson carries its own scaffold fade.</p>`,
      `<a class="btn ghost" href="/lessons/${esc(id)}/">Open the whole-group lesson</a>`,
    ) +
    block(
      "q-extend",
      "What if they already have it?",
      f.extension ? `<p>${esc(f.extension)}</p>` : "",
      "",
    ) +
    (f.teacherNote ? `<p class="sup-note">${esc(f.teacherNote)}</p>` : "");
}

function renderPicker(selectedId) {
  const sel = document.getElementById("sup-lesson");
  if (!sel) return;
  sel.innerHTML = lessons
    .map(
      (l) =>
        `<option value="${esc(l.id)}"${l.id === selectedId ? " selected" : ""}>${esc(l.id)} · ${esc(l.title)}</option>`,
    )
    .join("");
}

function show(id) {
  const lesson = lessons.find((l) => l.id === id) || lessons[0];
  if (!lesson) return;
  renderLesson(lesson);
  // Deep link, so a teacher can bookmark the supports for one lesson and so a
  // lesson page can hand off its context. replaceState: changing lesson is not
  // a navigation.
  const url = new URL(location.href);
  url.searchParams.set("lesson", lesson.id);
  history.replaceState(null, "", url);
}

async function boot() {
  if (!root || !main) return;
  try {
    const [supports, workflow, launch] = await Promise.all(
      [
        "/data/curriculum-supports.json",
        "/data/curriculum-teacher-workflow.json",
        "/data/curriculum-launch-manifest.json",
      ].map((u) => fetch(u, { credentials: "same-origin" }).then((r) => r.json())),
    );
    DATA.supports = supports;
    DATA.workflow = workflow;
    lessons = (launch.lessons || []).slice();
    smallGroupsByParent = new Map();
    for (const g of launch.smallGroups || []) {
      if (!smallGroupsByParent.has(g.parent)) smallGroupsByParent.set(g.parent, []);
      smallGroupsByParent.get(g.parent).push(g);
    }
  } catch {
    main.innerHTML = `<p class="empty-state">Could not load the curriculum data. Check your connection and reload.</p>`;
    return;
  }

  const requested = new URLSearchParams(location.search).get("lesson");
  const start = lessons.find((l) => l.id === requested)?.id || lessons[0]?.id;
  renderPicker(start);
  document.getElementById("sup-lesson")?.addEventListener("change", (e) => show(e.target.value));
  show(start);
}

boot();

export { boot };
