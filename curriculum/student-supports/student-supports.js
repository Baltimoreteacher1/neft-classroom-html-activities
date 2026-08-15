/* student-supports.js — /curriculum/student-supports/
 *
 * SUPPORT → PREVIEW → APPLY → TEACH.
 *
 * This surface used to answer teacher questions with strategy text and then
 * leave the teacher to carry those strategies into the lesson by hand. It now
 * also CONFIGURES the lesson: a selection made here is stored as a delta and
 * read by the in-lesson supports layer, so the whole-group lesson and its
 * small-group variants open with the supports already present.
 *
 * NO STUDENT RECORDS. Everything on this page is keyed by LESSON. There is no
 * student name, no initials, no section, no disability category, no WIDA
 * record, and no link from a support selection to a person. Per-student
 * assignment is a separate, teacher-gated system and is only linked to.
 *
 * SOURCE OF TRUTH. Nothing is copied into this layer:
 *   shared/supports/lesson-supports.js      the support catalogue + inheritance
 *   assets/learning-supports/manifest.json  each lesson's own vocabulary/frames
 *   data/curriculum-supports.json           the family strategy guidance
 *   data/curriculum-teacher-workflow.json   familyRules: lesson → skill family
 *   data/curriculum-launch-manifest.json    lesson ids, titles, small-group routes
 * The stored profile holds support KEYS and a lesson id — never a lesson title,
 * a problem, a URL, or any adapted text. Content is resolved at render time so
 * a curriculum correction flows through instead of being frozen into a copy.
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
let LS = null; // shared/supports/lesson-supports.js, once loaded
let currentLessonId = null;
/* The class being taught: 601 / 602 / 603, or null for the configuration that
 * applies to every class. It arrives as ?section= from the hub's Teach band and
 * otherwise from the teacher state that already owns it
 * (curriculumTeacherWorkflow:v1.section). A class is CONTEXT — the canonical
 * lesson is identical for all three; only the teacher's support selection
 * differs. Nothing about a student is stored, read or displayed here. */
let currentSection = null;
let selection = new Set();
let activePreset = null;
let dirty = false;

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

/* ---------------------------------------------------------------------------
 * IMPACT. Shown next to every support so a teacher reaching for an
 * accommodation never applies a modification by accident. Three words, not a
 * taxonomy lecture.
 * ------------------------------------------------------------------------ */
const IMPACT_LABEL = {
  access: { text: "Access support", note: "Objective unchanged." },
  scaffold: { text: "Scaffold", note: "Objective unchanged; more instructional support." },
  modification: { text: "Changes the task", note: "The expectation itself changes." },
};

function impactBadge(impact) {
  const m = IMPACT_LABEL[impact] || IMPACT_LABEL.access;
  return `<span class="sup-impact is-${esc(impact)}" title="${esc(m.note)}">${esc(m.text)}</span>`;
}

/* ---------------------------------------------------------------------------
 * SELECTION UI
 * ------------------------------------------------------------------------ */
function overrideCtx(lessonId) {
  const o = (DATA.overrides?.lessons || {})[lessonId] || {};
  return {
    computationIsObjective: !!o.computationIsObjective,
    factRecallIsObjective: !!o.factRecallIsObjective,
    pin: Array.isArray(o.pin) ? o.pin.slice() : [],
    excluded: Array.isArray(o.exclude) ? o.exclude.map((e) => e.key || e) : [],
  };
}

/* WHY A SUPPORT IS NOT ON THE LIST.
 *
 * A control that silently is not there reads as an oversight. Naming the
 * reason — in instructional language, never in engine language — turns a
 * missing checkbox into a deliberate decision the teacher can agree or
 * disagree with. Only supports a reader would EXPECT to see are explained;
 * listing all eighteen absences would be noise. */
function unavailableNotes(lessonId) {
  const entry = DATA.supportManifest?.[lessonId];
  if (!LS || !entry) return [];
  const ctx = overrideCtx(lessonId);
  const offered = new Set(applicableFor(lessonId).map((s) => s.key));
  const worthExplaining = [
    "calculator",
    "multiplication-chart",
    "bilingual-vocabulary",
    "word-bank",
    "sentence-frames",
    "worked-example",
    "readiness-review",
  ];
  return worthExplaining
    .filter((k) => !offered.has(k))
    .map((k) => LS.explainUnavailable(k, ctx))
    .filter(Boolean);
}

function applicableFor(lessonId) {
  const entry = DATA.supportManifest?.[lessonId];
  const ctx = overrideCtx(lessonId);
  if (!LS || !entry) return [];
  return LS.applicableSupports(entry, ctx).filter((s) => !ctx.excluded.includes(s.key));
}

function renderChooser(lessonId) {
  const applicable = applicableFor(lessonId);
  if (!applicable.length) {
    return `<p class="sup-empty-note">This lesson has no support data yet, so there is nothing to
      configure here. The strategies below still apply, and the lesson opens normally.</p>`;
  }
  const byCategory = new Map();
  for (const s of applicable) {
    if (!byCategory.has(s.category)) byCategory.set(s.category, []);
    byCategory.get(s.category).push(s);
  }

  const presets = LS.PRESETS.filter((p) => p.keys.some((k) => applicable.some((s) => s.key === k)))
    .map(
      (p) =>
        `<button type="button" class="btn ghost sup-preset" data-preset="${esc(p.key)}"` +
        `${activePreset === p.key ? ' aria-pressed="true"' : ' aria-pressed="false"'}>${esc(p.label)}</button>`,
    )
    .join("");

  const groups = LS.CATEGORIES.filter((c) => byCategory.has(c.id))
    .map((c) => {
      const items = byCategory
        .get(c.id)
        .map(
          (s) =>
            `<li><label class="sup-choice">` +
            `<input type="checkbox" data-support="${esc(s.key)}"${selection.has(s.key) ? " checked" : ""} />` +
            `<span class="sup-choice-label">${esc(s.label)}</span>` +
            impactBadge(s.impact) +
            `</label></li>`,
        )
        .join("");
      return (
        `<fieldset class="sup-category${c.id === "modification" ? " is-modification" : ""}">` +
        `<legend>${esc(c.label)}</legend>` +
        (c.id === "modification"
          ? `<p class="sup-modification-note">These change what is asked of the student, not only
             how they reach it. Nothing here is applied unless you choose it.</p>`
          : "") +
        `<ul class="sup-choices">${items}</ul></fieldset>`
      );
    })
    .join("");

  const notImplemented = LS.NOT_IMPLEMENTED.map(
    (n) => `<li><b>${esc(n.label)}</b> — ${esc(n.reason)} <em>${esc(n.insteadDo)}</em></li>`,
  ).join("");

  const notes = unavailableNotes(lessonId);
  const notesHtml = notes.length
    ? `<div class="sup-unavailable"><p class="sup-unavailable-head">Not offered for this lesson</p>` +
      `<ul>${notes.map((n) => `<li>${esc(n)}</li>`).join("")}</ul></div>`
    : "";

  return (
    `<div class="sup-presets"><span class="sup-presets-label">Start from</span>${presets}</div>` +
    groups +
    notesHtml +
    `<details class="sup-not-implemented"><summary>Accommodations this software cannot provide</summary>
       <ul>${notImplemented}</ul></details>`
  );
}

/* ---------------------------------------------------------------------------
 * SCOPE.
 *
 * The store has always been a two-level thing — a lesson default that applies
 * to every class, and a per-class override that replaces it for one class —
 * and it has always behaved correctly. What it did not do was SAY so. A
 * teacher arriving from the hub with ?section=602 saw one sentence of prose
 * and, from then on, had to infer the whole inheritance model from what
 * happened after pressing Apply.
 *
 * These three functions render the model instead of leaving it to be inferred:
 * which scope is being edited, whether this class is reading the default or
 * has diverged from it, and — before Apply, not after — where the changes are
 * about to land.
 *
 * NOTHING ABOUT A STUDENT. A class here is 601/602/603: a period on a
 * timetable. The store holds support keys and a lesson id, and this UI adds no
 * field to it.
 * ------------------------------------------------------------------------ */

/** The one-line answer to "what am I editing?", shown at the chooser and again
 * beside Apply so it cannot scroll out of sight at the moment it matters. */
function scopeLabel() {
  return currentSection ? `Class ${currentSection} only` : "All class sections";
}

function renderScopePicker(lessonId) {
  if (!LS) return "";
  const list = LS.sections();
  const overriding = LS.sectionsOverriding(lessonId);
  const tab = (value, label, note) => {
    const on = (currentSection || "") === value;
    return (
      `<button type="button" class="sup-scope-tab" data-scope="${esc(value)}"` +
      ` aria-pressed="${on ? "true" : "false"}">` +
      `<span class="sup-scope-tab-label">${esc(label)}</span>` +
      (note ? `<span class="sup-scope-tab-note">${esc(note)}</span>` : "") +
      `</button>`
    );
  };
  return (
    `<div class="sup-scope">` +
    `<p class="sup-scope-head" id="sup-scope-head">Configure supports for</p>` +
    `<div class="sup-scope-tabs" role="group" aria-labelledby="sup-scope-head">` +
    tab("", "All classes", "the lesson default") +
    list
      .map((s) => tab(s, `Class ${s}`, overriding.includes(s) ? "own override" : "lesson default"))
      .join("") +
    `</div></div>`
  );
}

/** WHAT THIS SCOPE MEANS, in the three states it can be in. Each one names the
 * scope, says what it inherits or overrides, and offers the one action that
 * changes that relationship — never a bare "Reset". */
function renderInheritance(lessonId) {
  if (!LS) return "";
  const list = LS.sections();

  if (!currentSection) {
    const overriding = LS.sectionsOverriding(lessonId);
    const following = list.filter((s) => !overriding.includes(s));
    let body =
      `<p class="sup-inherit-body">${esc(list.join(" · "))} use this lesson configuration ` +
      `unless a class has its own override.</p>`;
    if (overriding.length) {
      body +=
        `<p class="sup-inherit-warn">Class ${esc(overriding.join(", "))} ` +
        `${overriding.length === 1 ? "has" : "have"} an override, so changes here will not reach ` +
        `${overriding.length === 1 ? "that class" : "those classes"}` +
        (following.length ? ` — only ${esc(following.join(" and "))}.` : ".") +
        `</p>`;
    }
    return (
      `<section class="sup-inherit is-default" aria-label="Scope">` +
      `<p class="sup-inherit-head">Applies to all class sections</p>${body}</section>`
    );
  }

  const owns = LS.hasOwnOverride(lessonId, currentSection);
  if (!owns) {
    return (
      `<section class="sup-inherit is-inheriting" aria-label="Scope">` +
      `<p class="sup-inherit-head">Class ${esc(currentSection)}</p>` +
      `<p class="sup-inherit-body">Using the lesson default. Changing anything below and ` +
      `applying it gives this class its own override; the other classes keep the default.</p>` +
      `<p class="sup-actions"><button type="button" class="btn ghost" id="sup-customize">` +
      `Customize for ${esc(currentSection)}</button></p></section>`
    );
  }
  return (
    `<section class="sup-inherit is-override" aria-label="Scope">` +
    `<p class="sup-inherit-head">Class ${esc(currentSection)} override</p>` +
    // One string literal, not two. tools/validate-student-supports.mjs greps
    // for this sentence, and a phrase split across a `+` is invisible to a
    // grep — the gate would report the sentence gone while the page renders it.
    `<p class="sup-inherit-body">This class uses its own support configuration instead of the lesson default.</p>` +
    `<p class="sup-actions"><button type="button" class="btn ghost" id="sup-drop-override">` +
    `Reset ${esc(currentSection)} to lesson default</button></p></section>`
  );
}

/** COPY BETWEEN CLASSES — lesson-scoped, like every other control on this page.
 * The destination becomes its own explicit override; nothing else moves. */
function renderCopy(lessonId) {
  if (!LS || !currentSection) return "";
  const targets = LS.sections().filter((s) => s !== currentSection);
  if (!targets.length) return "";
  return (
    `<section class="sup-copy" aria-labelledby="sup-copy-head">` +
    `<p class="sup-copy-head" id="sup-copy-head">Copy class ${esc(currentSection)} supports for ` +
    `this lesson to</p>` +
    `<div class="sup-copy-targets">` +
    targets
      .map(
        (s) =>
          `<label class="sup-choice"><input type="checkbox" data-copy-to="${esc(s)}" />` +
          `<span class="sup-choice-label">Class ${esc(s)}</span></label>`,
      )
      .join("") +
    `</div>` +
    `<p class="sup-actions"><button type="button" class="btn ghost" id="sup-copy-go">Copy</button>` +
    `<span class="sup-copy-note">The classes you tick get their own override for Lesson ` +
    `${esc(lessonId)}. The lesson default, class ${esc(currentSection)} and any class you do not ` +
    `tick are left exactly as they are.</span></p></section>`
  );
}

/* ---------------------------------------------------------------------------
 * PREVIEW. Built from THIS lesson's authored content, so a teacher sees the
 * actual frame and the actual vocabulary before applying anything.
 * ------------------------------------------------------------------------ */
function renderPreview(lessonId) {
  const entry = DATA.supportManifest?.[lessonId];
  if (!LS || !entry) return "";
  const keys = [...selection];
  if (!keys.length) {
    return `<p class="sup-preview-empty">Nothing selected. The lesson opens exactly as written.</p>`;
  }
  const pv = LS.preview(keys, entry);
  const items = pv.items
    .map((i) => {
      const adds = i.adds.length
        ? `<ul class="sup-preview-adds">${i.adds.map((a) => `<li>${esc(a)}</li>`).join("")}</ul>`
        : `<p class="sup-preview-none">No new text — this one changes how the lesson is presented.</p>`;
      return (
        `<li class="sup-preview-item"><p class="sup-preview-head">${esc(i.label)} ${impactBadge(i.impact)}</p>` +
        `<p class="sup-preview-where">Appears in: ${esc(i.elements.join(", "))}</p>` +
        adds +
        `<p class="sup-preview-guard"><b>Will not</b> ${esc(i.mustNot.join("; "))}.</p></li>`
      );
    })
    .join("");
  const mods = pv.modifications.length
    ? `<p class="sup-preview-mod-warning">${pv.modifications.length} of these changes the task itself:
       ${esc(pv.modifications.map((m) => m.label).join(", "))}.</p>`
    : "";
  return (
    mods +
    `<ul class="sup-preview-list">${items}</ul>` +
    `<p class="sup-preview-unchanged">Unchanged either way: the standard, the objective, the numbers,
      the worked example, and every correct answer.</p>`
  );
}

/* ---------------------------------------------------------------------------
 * WHERE IT LANDS. Whole group plus each variant, including what a variant
 * already authors for itself and therefore will not have doubled.
 * ------------------------------------------------------------------------ */
function renderApplyTargets(lessonId) {
  const entry = DATA.supportManifest?.[lessonId];
  const keys = [...selection];
  if (!keys.length || !LS) return "";

  // A provisional store, so "where will this land" is answered by the SAME
  // resolver the lesson, the small-group variant and the printable will use.
  // Computing it here a second way is exactly how a preview comes to promise
  // something the lesson then does not do.
  const trial = { [lessonId]: LS.normalizeProfile({ keys }, lessonId) };
  const ctx = overrideCtx(lessonId);
  const at = (id, surface) =>
    LS.resolveEffectiveSupports({ lessonId: id, store: trial, entry, surface, ctx });

  const labels = (list) => list.map((k) => LS.byKey[k]?.label || k).join(", ");
  const rows = [];

  const screen = at(lessonId, "screen");
  rows.push(`<li><b>Whole-group lesson</b> — ${screen.active.length} support(s)</li>`);

  const variants = (entry && entry.variants) || {};
  for (const name of Object.keys(variants).sort()) {
    const v = variants[name];
    const eff = at(v.id, "screen");
    rows.push(
      `<li><b>${esc(v.title || v.id)}</b> — ${eff.active.length} inherited` +
        (eff.suppressed.length
          ? `; ${esc(eff.suppressed.map((k) => LS.explainSuppressed(k, v.title)).join(" "))}`
          : "") +
        `</li>`,
    );
  }

  // PAPER. Stated separately because it is the surface a teacher is most likely
  // to assume works by magic, and because the differences are real: paper
  // cannot speak, so read-aloud becomes a delivery note in the teacher copy.
  const print = at(lessonId, "print");
  let paper = `<li><b>Printable, worksheet, handout and notes</b> — ${print.active.length} support(s)`;
  if (print.teacherNotes.length) {
    paper += `; ${esc(labels(print.teacherNotes.map((t) => t.key)))} cannot be done by a printed page, so the teacher copy carries a delivery note instead`;
  }
  paper += `</li>`;
  rows.push(paper);

  return `<ul class="routes sup-targets">${rows.join("")}</ul>`;
}

/* ---------------------------------------------------------------------------
 * RENDER
 * ------------------------------------------------------------------------ */
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
  const bbs = f.becauseButSo || {};
  const stored = LS ? LS.loadProfile(id, currentSection) : { keys: [] };
  const appliedCount = stored.keys.length;

  main.innerHTML =
    `<p class="sup-context">Supports for <strong>${esc(lesson.title)}</strong> · Lesson ${esc(id)} · ${esc(lesson.standard || "")}` +
    ` <span class="sup-family">${esc(f.label || key)}</span></p>` +
    renderScopePicker(id) +
    `<div id="sup-inherit">${renderInheritance(id)}</div>` +
    `<p class="sup-rigor">These scaffold <em>access</em> to the grade-level standard. None of them lowers the mathematics.</p>` +
    block(
      "q-choose",
      "Which supports do I want for this lesson?",
      `<p class="sup-editing" id="sup-editing">Editing: <strong>${esc(scopeLabel())}</strong></p>` +
        renderChooser(id),
      "",
    ) +
    `<section class="sup-block" aria-labelledby="q-preview"><h2 id="q-preview">What will this change?</h2>` +
    `<div id="sup-preview">${renderPreview(id)}</div>` +
    `<div id="sup-targets">${renderApplyTargets(id)}</div>` +
    /* The scope is repeated here on purpose. The chooser can be a screen and a
     * half of checkboxes, so by the time a teacher reaches Apply the scope line
     * above it has scrolled away — and "which class did I have selected?" at
     * the moment of pressing Apply is the exact confusion this pass is for. */
    `<p class="sup-editing" id="sup-editing-apply">Editing: <strong>${esc(scopeLabel())}</strong></p>` +
    `<p class="sup-actions">` +
    `<button type="button" class="btn" id="sup-apply">${
      currentSection ? `Apply to class ${esc(currentSection)} only` : "Apply to all classes"
    }</button>` +
    `<button type="button" class="btn ghost" id="sup-reset">${
      currentSection
        ? `Reset ${esc(currentSection)} to lesson default`
        : "Clear the lesson default"
    }</button>` +
    `<span class="sup-status" id="sup-status" role="status" aria-live="polite">${
      appliedCount
        ? `${appliedCount} support(s) applied to ${esc(scopeLabel()).toLowerCase()}.`
        : "No supports applied yet."
    }</span></p>` +
    /* RESET SEMANTICS, stated rather than discovered. Verified against
     * resetProfile() in shared/supports/lesson-supports.js: with no section it
     * deletes the lesson's entry from `lessons` and never touches `sections`,
     * so clearing the default leaves every class override standing. */
    (currentSection
      ? `<p class="sup-reset-note">Reset removes only class ${esc(currentSection)}'s override for
         this lesson. The lesson default and your other classes are untouched.</p>`
      : `<p class="sup-reset-note">Clearing the lesson default removes it for the classes that
         follow it. A class with its own override keeps that override — reset it from its own tab
         above.</p>`) +
    `</section>` +
    renderCopy(id) +
    block(
      "q-teach",
      "Open the lesson with these supports",
      `<ul class="routes"><li><a href="/lessons/${esc(id)}/">Whole-group lesson</a></li>` +
        groups
          .map((g) => `<li><a href="/lessons/${esc(g.id)}/">${esc(g.title)}</a></li>`)
          .join("") +
        `</ul>` +
        (groups.length
          ? ""
          : `<p>This lesson has no small-group version. The whole-group lesson carries its own scaffold fade.</p>`),
      `<a class="btn ghost" href="/curriculum/planning/">Back to Math Planner</a>`,
    ) +
    block(
      "q-esol",
      "What else can I use with my multilingual students?",
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
      "",
    ) +
    block(
      "q-access",
      "What accommodations can I give without changing the objective?",
      (f.sped ? `<p>${esc(f.sped)}</p>` : "") +
        (f.visualModel ? `<h3>Model to put in front of them</h3><p>${esc(f.visualModel)}</p>` : ""),
      `<a class="btn ghost" href="/teacher-tools/learning-supports-manager/">Set up per-student supports</a>`,
    ) +
    block(
      "q-extend",
      "What if they already have it?",
      f.extension ? `<p>${esc(f.extension)}</p>` : "",
      "",
    ) +
    (f.teacherNote ? `<p class="sup-note">${esc(f.teacherNote)}</p>` : "");

  bindLessonControls(id);
}

function refreshPreview(id) {
  const pv = document.getElementById("sup-preview");
  if (pv) pv.innerHTML = renderPreview(id);
  const tg = document.getElementById("sup-targets");
  if (tg) tg.innerHTML = renderApplyTargets(id);
  const st = document.getElementById("sup-status");
  if (st && dirty) st.textContent = "Not applied yet — choose Apply supports.";
}

/** The two buttons inside the inheritance panel. Separate from
 * bindLessonControls because the panel is re-rendered on its own (refreshScope)
 * while the rest of the form stays put. */
function bindInheritanceActions(id) {
  /* "Customize for 602" pins the default this class is currently reading as
   * 602's own override, so the teacher starts from what they were looking at
   * instead of from an empty list. */
  document.getElementById("sup-customize")?.addEventListener("click", () => {
    if (!LS) return;
    LS.saveProfile(id, [...selection], activePreset, currentSection);
    dirty = false;
    refreshScope(id);
    const st = document.getElementById("sup-status");
    if (st) {
      st.textContent = `Class ${currentSection} now has its own override for Lesson ${id}, starting from the lesson default. Changes here no longer affect your other classes.`;
    }
  });

  document.getElementById("sup-drop-override")?.addEventListener("click", () => {
    if (!LS) return;
    LS.resetProfile(id, currentSection);
    show(id);
    const st = document.getElementById("sup-status");
    if (st) {
      st.textContent = `Class ${currentSection}'s override removed. It follows the lesson default again.`;
    }
  });
}

function bindLessonControls(id) {
  /* SCOPE TABS. Switching scope re-reads the store for that scope — it never
   * carries the current screen across, because carrying a 601 selection into
   * the 602 tab and then pressing Apply is precisely how a teacher would give
   * 602 an override they never chose. */
  main.querySelectorAll("[data-scope]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const value = btn.getAttribute("data-scope") || "";
      currentSection = value && LS && LS.isSection(value) ? value : null;
      if (LS) LS.setActiveSection(currentSection);
      const url = new URL(location.href);
      if (currentSection) url.searchParams.set("section", currentSection);
      else url.searchParams.delete("section");
      history.replaceState(null, "", url);
      show(id);
    });
  });

  bindInheritanceActions(id);

  document.getElementById("sup-copy-go")?.addEventListener("click", () => {
    const targets = [...main.querySelectorAll("[data-copy-to]")]
      .filter((box) => box.checked)
      .map((box) => box.getAttribute("data-copy-to"));
    const st = document.getElementById("sup-status");
    if (!LS || !targets.length) {
      if (st) st.textContent = "Choose at least one class to copy to.";
      return;
    }
    const done = targets.filter((to) => LS.copyLessonToSection(id, currentSection, to));
    show(id);
    const after = document.getElementById("sup-status");
    if (after) {
      after.textContent = done.length
        ? `Copied Lesson ${id} from class ${currentSection} to class ${done.join(" and ")}. Each is now its own override; nothing else changed.`
        : "Could not copy on this device (private browsing?).";
    }
  });

  main.querySelectorAll("[data-support]").forEach((box) => {
    box.addEventListener("change", () => {
      const key = box.getAttribute("data-support");
      if (box.checked) selection.add(key);
      else selection.delete(key);
      activePreset = null;
      main.querySelectorAll(".sup-preset").forEach((b) => b.setAttribute("aria-pressed", "false"));
      dirty = true;
      refreshPreview(id);
    });
  });

  main.querySelectorAll(".sup-preset").forEach((btn) => {
    btn.addEventListener("click", () => {
      const preset = LS.PRESETS.find((p) => p.key === btn.getAttribute("data-preset"));
      if (!preset) return;
      // A preset SELECTS; it never applies. The teacher still previews and
      // still presses Apply, and can change anything the preset chose.
      const applicable = new Set(applicableFor(id).map((s) => s.key));
      selection = new Set(preset.keys.filter((k) => applicable.has(k)));
      activePreset = preset.key;
      dirty = true;
      main.querySelectorAll("[data-support]").forEach((box) => {
        box.checked = selection.has(box.getAttribute("data-support"));
      });
      main.querySelectorAll(".sup-preset").forEach((b) => {
        b.setAttribute("aria-pressed", String(b === btn));
      });
      refreshPreview(id);
    });
  });

  document.getElementById("sup-apply")?.addEventListener("click", () => {
    const st = document.getElementById("sup-status");
    if (!LS) {
      if (st) st.textContent = "Supports could not be saved. The lesson still opens as written.";
      return;
    }
    const ok = LS.saveProfile(id, [...selection], activePreset, currentSection);
    dirty = false;
    const scope = currentSection ? `class ${currentSection} only` : "all class sections";
    if (st) {
      st.textContent = ok
        ? selection.size
          ? `Applied to ${scope}. ${selection.size} support(s) are now part of Lesson ${id} and its small-group versions.`
          : `Cleared for ${scope}. Lesson ${id} opens exactly as written.`
        : "Could not save on this device (private browsing?). The lesson still opens as written.";
    }
    // Applying can change the inheritance state — a class that was following
    // the default now owns an override — so the panel that describes it has to
    // be re-read from the store rather than left showing the previous answer.
    refreshScope(id);
  });

  document.getElementById("sup-reset")?.addEventListener("click", () => {
    if (LS) LS.resetProfile(id, currentSection);
    selection = new Set();
    activePreset = null;
    dirty = false;
    main.querySelectorAll("[data-support]").forEach((box) => {
      box.checked = false;
    });
    main.querySelectorAll(".sup-preset").forEach((b) => b.setAttribute("aria-pressed", "false"));
    refreshPreview(id);
    const st = document.getElementById("sup-status");
    if (st) {
      st.textContent = currentSection
        ? `Class ${currentSection}'s override removed. It follows the lesson default again; your other classes are untouched.`
        : `Lesson default cleared. Any class with its own override keeps it.`;
    }
    refreshScope(id);
  });
}

/** Re-read the scope panel and the tab notes from the store. Called after any
 * action that can change whether a class owns an override.
 *
 * It re-binds ONLY the two buttons it just re-rendered. Calling the full
 * bindLessonControls here would add a second change listener to every checkbox
 * that was not replaced, and a support would then toggle twice per click. */
function refreshScope(id) {
  const panel = document.getElementById("sup-inherit");
  if (panel) {
    panel.innerHTML = renderInheritance(id);
    bindInheritanceActions(id);
  }
  if (!LS) return;
  const overriding = LS.sectionsOverriding(id);
  main.querySelectorAll("[data-scope]").forEach((btn) => {
    const value = btn.getAttribute("data-scope") || "";
    if (!value) return;
    const note = btn.querySelector(".sup-scope-tab-note");
    if (note) note.textContent = overriding.includes(value) ? "own override" : "lesson default";
  });
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
  // CHANGING LESSON. The selection is rebuilt from the NEW lesson's stored
  // profile, never carried across: a frame written for a parallelogram lesson
  // has no business in a ratio lesson, and a support the new lesson cannot
  // deliver is dropped by the applicability filter on render.
  currentLessonId = lesson.id;
  const stored = LS ? LS.loadProfile(lesson.id, currentSection) : { keys: [], preset: null };
  selection = new Set(stored.keys);
  activePreset = stored.preset || null;
  dirty = false;
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
    const [supports, workflow, launch, supportManifest, overrides] = await Promise.all(
      [
        "/data/curriculum-supports.json",
        "/data/curriculum-teacher-workflow.json",
        "/data/curriculum-launch-manifest.json",
        "/assets/learning-supports/manifest.json",
        "/data/lesson-support-overrides.json",
      ].map((u) =>
        fetch(u, { credentials: "same-origin" })
          .then((r) => r.json())
          // The last two are enhancements: without them the page still answers
          // every strategy question it answered before.
          .catch(() => null),
      ),
    );
    if (!supports || !workflow || !launch) throw new Error("core curriculum data unavailable");
    DATA.supports = supports;
    DATA.workflow = workflow;
    DATA.supportManifest = supportManifest || {};
    DATA.overrides = overrides || { lessons: {} };
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

  try {
    await import("/shared/supports/lesson-supports.js");
    LS = window.EWLLessonSupports || null;
  } catch {
    LS = null; // strategy guidance still renders; configuration simply is not offered
  }

  /* CLASS CONTEXT. `?section=` from the hub's Teach band wins; otherwise the
   * class already in teacher state is used, so arriving here by any other route
   * still lands on the right class. An unrecognised value is ignored rather
   * than trusted — the all-class configuration is the safe default. */
  const params = new URLSearchParams(location.search);
  const requestedSection = params.get("section");
  if (LS) {
    if (requestedSection && LS.isSection(requestedSection)) {
      currentSection = requestedSection;
      LS.setActiveSection(currentSection);
    } else {
      currentSection = LS.activeSection();
    }
  }

  const requested = params.get("lesson");
  const known = requested ? lessons.find((l) => l.id === requested) : null;
  if (requested && !known) {
    // INVALID LESSON. Say so, apply nothing, and offer the picker — never fall
    // through to another lesson's configuration.
    renderPicker(lessons[0]?.id);
    main.innerHTML =
      `<p class="empty-state">There is no lesson <strong>${esc(requested)}</strong> in this curriculum.` +
      ` No supports were loaded or changed. Choose a lesson above to continue.</p>`;
    document.getElementById("sup-lesson")?.addEventListener("change", (e) => show(e.target.value));
    return;
  }
  const start = known?.id || lessons[0]?.id;
  renderPicker(start);
  document.getElementById("sup-lesson")?.addEventListener("change", (e) => show(e.target.value));
  show(start);
}

boot();

export { boot };
