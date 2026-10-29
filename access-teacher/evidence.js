// Teacher Intelligence Dashboard — class language evidence for the ACCESS Practice Lab.
// Students send a share code or file (their alias only); this page reads them in the browser and keeps
// the roster on this teacher device. Nothing is uploaded. Every statement traces to ledger entries or
// to the learner's own words, and no screen shows a proficiency level or combines evidence into one number.
import {
  loadAlignment,
  loadBlueprint,
  loadExemplars,
  loadPatterns,
  loadSpeakingTasks,
  loadStudioIndex,
  loadWritingTasks,
} from "/access-practice-lab/src/content.js";
import { analyzeResponse } from "/access-practice-lab/src/lang/analyze.js";
import { CRITERIA, DISCLAIMER, PRACTICE_BANDS } from "/access-practice-lab/src/lang/rubrics.js";
import { decodeShare } from "/access-practice-lab/src/lang/share.js";
import {
  DEMO_LABEL,
  classSummary,
  conferencePlans,
  csvCell,
  demoClass,
  groupSuggestions,
  interventionsFor,
  samplesFor,
  supportGaps,
  toCSV,
  triage,
} from "/access-practice-lab/src/lang/teacher.js";
import { diffWords } from "/access-practice-lab/src/lang/text.js";
import { highlightHTML } from "/access-practice-lab/src/studio-ui.js";
import { buildSkillGraph, makeMiniLesson, recommendInstructionalGroups } from "/access-practice-lab/src/lang/skill-graph.js";
import { ACCESS_LAB_FLAGS } from "/access-practice-lab/src/lang/feature-flags.js";
import { announce, html, icon, raw, toHtml } from "/access-practice-lab/src/util.js";

const KEY = "accessTeacher:v1:roster";
const GROUP_KEY = "accessTeacher:v1:instructionalGroups";
const LESSON_KEY = "accessTeacher:v1:miniLessons";
const OVERRIDE_KEY = "accessTeacher:v1:skillOverrides";
const ALIGNMENT_REVIEW_KEY = "accessTeacher:v1:alignmentReviews";
const QUOTA_WARN = 3_500_000; // characters; localStorage holds roughly 5 MB
const root = document.getElementById("classEvidence");

function read(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key) || "null") ?? fallback;
  } catch {
    return fallback;
  }
}
/** Older rosters had no section or id; give them both so nothing is lost. */
const upgrade = (s) => ({
  ...s,
  section: s.section || "Unsorted",
  id: s.id || `${s.section || "Unsorted"}|${s.alias}|${s.band}`,
});

const T = {
  blueprint: null,
  alignment: null,
  alignmentFilters: { band: "", domain: "", keyUse: "", contentArea: "", standard: "", expectation: "", languageFunction: "", support: "", q: "" },
  alignmentPage: 1,
  alignmentReviews: read(ALIGNMENT_REVIEW_KEY, {}),
  studio: { speaking: [], writing: [], missions: [] },
  students: read(KEY, []).map(upgrade),
  scores: read(`${KEY}:scores`, []),
  tab: "class",
  pick: "",
  section: "",
  q: "",
  sort: { key: "alias", dir: 1 },
  patterns: {},
  exemplars: [],
  messages: [],
  saveError: "",
  skillDomain: "All",
  selectedLesson: "",
  groups: read(GROUP_KEY, []),
  lessons: read(LESSON_KEY, []),
  overrides: read(OVERRIDE_KEY, {}),
  tasks: [],
  demo: null, // SYNTHETIC DEMO class: in memory only, never persisted, cleared when real codes are added
};

/** Keep only what the tabs read: no raw progress records, no audio, no per-segment timing. */
const slim = (s) => ({
  id: s.id,
  section: s.section,
  alias: s.alias,
  band: s.band,
  created: s.created,
  addedAt: s.addedAt,
  ledger: s.ledger,
  studio: s.studio,
  records: s.records || {},
});
const persist = () => {
  try {
    localStorage.setItem(KEY, JSON.stringify(T.students.map(slim)));
    localStorage.setItem(`${KEY}:scores`, JSON.stringify(T.scores));
    localStorage.setItem(GROUP_KEY, JSON.stringify(T.groups));
    localStorage.setItem(LESSON_KEY, JSON.stringify(T.lessons));
    localStorage.setItem(OVERRIDE_KEY, JSON.stringify(T.overrides));
    localStorage.setItem(ALIGNMENT_REVIEW_KEY, JSON.stringify(T.alignmentReviews));
    T.saveError = "";
  } catch {
    T.saveError = "This browser could not save changes (storage may be full). Download the class CSV and remove unneeded student records before closing.";
  }
};
const sizeChars = () => {
  try {
    return (localStorage.getItem(KEY) || "").length;
  } catch {
    return 0;
  }
};
const pct = (v) => (v == null ? "—" : `${Math.round(v * 100)}%`);
const pname = (id) => (Object.hasOwn(T.patterns, id) ? T.patterns[id].name : id);
const sections = () => [...new Set(T.students.map((s) => s.section))].sort();
const note = (m) => {
  T.messages.push(m);
  announce(m);
};

/** Add one share code or file. A newer file replaces an older one for the same student; an older one never does. */
function addStudent(text, section) {
  const incoming = decodeShare(text);
  const s = { ...incoming, section: section || "Unsorted", addedAt: new Date().toISOString() };
  s.id = `${s.section}|${s.alias}|${s.band}`;
  const i = T.students.findIndex((x) => x.id === s.id);
  if (i >= 0) {
    if (String(T.students[i].created) > String(s.created) && s.created) {
      note(`${s.alias}: this file is older than the one you already have, so it was not used.`);
      return;
    }
    T.students[i] = s;
    note(`${s.alias}: updated.`);
  } else {
    T.students.push(s);
    note(`${s.alias}: added to ${s.section}.`);
  }
}

function tabs() {
  return html`<div class="band-switch no-print" role="group" aria-label="Dashboard sections">
    ${[
      ["class", "Class"],
      ["plans", "Conference plans"],
      ...(ACCESS_LAB_FLAGS.teacherDiagnosticsEnabled ? [["skills", "Skill diagnostics"]] : []),
      ...(ACCESS_LAB_FLAGS.instructionalGroupsEnabled ? [["groups", "Small groups"]] : []),
      ...(ACCESS_LAB_FLAGS.contentProvenanceEnabled ? [["content", "Lesson review"]] : []),
      ["samples", "Response samples"],
      ["scoring", "Scoring practice"],
      ["blueprint", "Blueprint and quality"],
    ].map(
      ([k, l]) =>
        html`<button type="button" class="band-btn" data-tab="${k}" aria-pressed="${T.tab === k}">
          ${l}
        </button>`,
    )}
  </div>`;
}

function importBox() {
  const used = sizeChars();
  return html`<div class="hub-card no-print">
    <h3>Add student work</h3>
    <p class="fine">
      Students choose “Send my work to my teacher” in their Passport. Paste one or many codes, or
      choose files. Only an alias is included — ask students to use initials or a class nickname.
    </p>
    <label class="field"
      ><span>Class period or section</span
      ><input
        type="text"
        id="evSection"
        list="evSections"
        placeholder="e.g. Period 3"
        value="${T.lastSection || ""}"
        autocomplete="off"
      />
      <datalist id="evSections">
        ${sections().map((s) => html`<option value="${s}"></option>`)}
      </datalist></label
    >
    <textarea
      id="evCode"
      rows="3"
      placeholder="ACCESST1.… or ACCESS1.… (several codes are fine)"
      aria-label="Student share codes"
    ></textarea>
    <div class="row-actions">
      <button type="button" class="btn btn-primary" data-add>Add students</button>
      <label class="btn"
        >Choose file(s)<input type="file" id="evFile" accept=".json,.txt" multiple hidden
      /></label>
      ${T.students.length ? html`<button type="button" class="ghost danger" data-clear>Remove everything</button>` : ""}
    </div>
    ${T.saveError ? html`<p class="feedback is-hint" role="alert">${T.saveError}</p>` : ""}
    ${used > QUOTA_WARN ? html`<p class="feedback is-hint" role="status">The roster is nearly full (${Math.round(used / 1000)} KB). Download the CSV and remove students you no longer need.</p>` : ""}
    ${
      T.messages.length
        ? html`<div role="status" aria-live="polite"><ul class="fine">
            ${T.messages.slice(-8).map((m) => html`<li>${m}</li>`)}
          </ul></div>`
        : ""
    }
    <p class="fine">
      Data stays in this browser. “Remove everything” also clears saved scores. On a shared
      computer, remove students when you finish.
    </p>
  </div>`;
}

function visibleRows(rows) {
  const q = T.q.trim().toLowerCase();
  const list = rows.filter(
    (r) => (!T.section || r.section === T.section) && (!q || r.alias.toLowerCase().includes(q)),
  );
  const { key, dir } = T.sort;
  const val = (r) =>
    key === "alias"
      ? r.alias.toLowerCase()
      : key === "lastActive"
        ? r.lastActive || ""
        : (r[key] ?? -1);
  return [...list].sort((a, b) => (val(a) > val(b) ? 1 : val(a) < val(b) ? -1 : 0) * dir);
}

function startHere(rows) {
  const t = triage(rows);
  const chip = (label, list) =>
    list.length
      ? html`<li>
          <strong>${label}:</strong>
          ${list.map((r) => html`<button type="button" class="ghost small" data-student="${r.id}">${r.alias}</button> `)}
        </li>`
      : "";
  const any = t.stale.length + t.lowerAlone.length + t.thin.length + t.broken.length;
  return html`<section class="panel no-print" aria-labelledby="startHere">
    <h3 id="startHere">Start here</h3>
    ${
      any
        ? html`<ul>
            ${chip("No activity in 14+ days", t.stale)}${chip("Lower when working without supports", t.lowerAlone)}${chip("Fewer than 3 first attempts (not enough evidence yet)", t.thin)}${chip("File could not be read", t.broken)}
          </ul>`
        : html`<p>Nothing needs attention right now.</p>`
    }
  </section>`;
}

const sortBtn = (key, label) =>
  html`<th
    scope="col"
    aria-sort="${T.sort.key === key ? (T.sort.dir === 1 ? "ascending" : "descending") : "none"}"
  >
    <button type="button" class="ghost small" data-sort="${key}">
      ${label}${T.sort.key === key ? html` <span class="ev-sort ${T.sort.dir === 1 ? "is-asc" : "is-desc"}">${icon("chevron-down")}</span>` : ""}
    </button>
  </th>`;

function classTab(allRows) {
  if (!allRows.length)
    return html`<p>No students yet. Add a share code above to see class evidence.</p>`;
  const rows = visibleRows(allRows);
  return html`${startHere(allRows)}
    <div class="row-actions no-print">
      <label class="field inline"
        ><span>Section</span
        ><select data-section>
          <option value="">All (${allRows.length})</option>
          ${sections().map((s) => html`<option value="${s}" ${T.section === s ? raw("selected") : ""}>${s} (${allRows.filter((r) => r.section === s).length})</option>`)}
        </select></label
      >
      <label class="field inline"
        ><span>Find a student</span><input type="search" data-search value="${T.q}"
      /></label>
    </div>
    <div class="lab-table-wrap" tabindex="0" role="region" aria-label="Class table">
      <table class="hub-table">
        <thead>
          <tr>
            ${sortBtn("alias", "Student")}
            <th scope="col">Section</th>
            ${sortBtn("firstAttempts", "First attempts")}${sortBtn("independentShare", "On own")}${sortBtn("revisions", "Revisions")}
            <th scope="col">Top pattern</th>
            <th scope="col">Support check</th>
            ${sortBtn("lastActive", "Last active")}
          </tr>
        </thead>
        <tbody>
          ${rows.map(
            (r) =>
              html`<tr>
                <td class="t-title">
                  <button type="button" class="ghost" data-student="${r.id}">${r.alias}</button>
                </td>
                <td>${r.section}</td>
                <td>
                  ${r.firstAttempts}${r.enoughEvidence ? "" : html` <span class="fine">(early)</span>`}
                </td>
                <td>${pct(r.independentShare)}</td>
                <td>${r.revisions}</td>
                <td>${r.topPattern ? pname(r.topPattern) : "—"}</td>
                <td>
                  ${r.broken ? html`<span class="badge">unreadable</span>` : r.dependent.length ? html`<span class="badge">Lower alone: ${r.dependent.slice(0, 2).join(", ")}</span>` : r.enoughEvidence ? "Similar with and without help" : html`<span class="fine">Needs more evidence</span>`}
                </td>
                <td>${(r.lastActive || "").slice(0, 10) || "—"}</td>
              </tr>`,
          )}
        </tbody>
      </table>
    </div>
    <p class="fine">
      “On own” = share of first attempts made with no frames, word bank or model open. A trend
      appears after 3 first attempts.
    </p>
    <div class="row-actions no-print">
      <button type="button" class="btn" data-csv>Download class CSV</button>
      <button type="button" class="btn" data-print-sheets="${T.section || "all"}">
        Print student sheets (${rows.length})
      </button>
    </div>
    ${T.pick ? studentPanel(allRows.find((r) => r.id === T.pick), T.students.find((student) => student.id === T.pick)) : ""}`;
}

function evidenceList(r) {
  const p = r.profile;
  return html`<ul class="evidence-list">
    ${Object.values(p.features).map(
      (f) =>
        html`<li>
          <span>${f.label} <em class="fine">(${f.dimension})</em></span
          ><span
            >${f.all.status === "ok" ? `${f.all.direction} over ${f.all.n} attempts` : `not enough evidence (${f.all.n} of 3)`}${f.dependence.status === "ok" && f.dependence.dependent ? " · lower without supports" : ""}</span
          >
        </li>`,
    )}
  </ul>`;
}

function studentPanel(r, student) {
  if (!r) return "";
  const p = r.profile;
  const iv = interventionsFor(r, T.patterns);
  return html`<section class="panel student-panel ev-screen" aria-labelledby="stuTitle">
    <h3 id="stuTitle" tabindex="-1">${r.alias} <span class="fine">· ${r.section}</span></h3>
    ${evidenceList(r)}
    ${student?.postcards?.length ? html`<h4>Postcards shared for this teacher review</h4><ul class="postcard-list">${student.postcards.map((postcard) => html`<li><img src="${postcard.image}" alt="${postcard.alt}"><div><strong>${postcard.place || "Postcard"}</strong><p>${postcard.alt}</p><time>${String(postcard.created).slice(0, 10)}</time></div></li>`)}</ul><p class="fine">Shared postcard images stay in this open dashboard only; they are not saved in the teacher roster.</p>` : ""}
    ${
      p.errors.length
        ? html`<p>
            <strong>Recurring patterns:</strong> ${p.errors
              .slice(0, 4)
              .map((e) => `${pname(e.id)} (${e.drafts})${e.mastered ? " (used correctly on own)" : ""}`)
              .join("; ")}
          </p>`
        : ""
    }
    ${
      p.comprehension.total
        ? html`<p>
            <strong>Listening/reading:</strong> ${Object.entries(p.comprehension.bySkill)
              .map(([k, v]) => `${k} ${v.ok}/${v.n}`)
              .join(
                ", ",
              )}${p.comprehension.topTrap ? ` · most chosen trap: ${p.comprehension.topTrap.type}` : ""}
          </p>`
        : ""
    }
    <h4>Suggested next steps</h4>
    <ol>
      ${iv.map((x) => html`<li>${x.what} <span class="fine">— ${x.why}</span></li>`)}
    </ol>
    <div class="row-actions no-print">
      <button type="button" class="btn" data-print-sheets="${r.id}">
        Print this student’s sheet
      </button>
      <button type="button" class="ghost danger" data-remove="${r.id}">Remove ${r.alias}</button>
    </div>
  </section>`;
}

function sheetFor(r, student) {
  const iv = interventionsFor(r, T.patterns);
  const samples = samplesFor(student).slice(0, 3);
  const scores = T.scores.filter((x) => x.who === r.alias);
  return html`<article class="ev-sheet">
    <h2>
      ${r.alias} <span class="fine">· ${r.section} · ${new Date().toISOString().slice(0, 10)}</span>
    </h2>
    <p class="fine">
      ACCESS Practice Lab — classroom practice evidence. Not a WIDA score, proficiency level or
      placement.
    </p>
    <h3>What the work shows</h3>
    ${evidenceList(r)}
    ${
      r.profile.errors.length
        ? html`<p>
            <strong>Recurring patterns:</strong> ${r.profile.errors
              .slice(0, 4)
              .map((e) => pname(e.id))
              .join("; ")}
          </p>`
        : ""
    }
    <h3>Next steps</h3>
    <ol>
      ${iv.map((x) => html`<li>${x.what} — ${x.why}</li>`)}
    </ol>
    <h3>Writing and speaking samples</h3>
    ${
      samples.length
        ? samples.map(
            (s) =>
              html`<div>
                <p>
                  <strong>${s.task}</strong>
                  (${s.stage === "independent" ? "on own" : s.stage ? "with supports" : "stage unknown"},
                  ${s.versions} version${s.versions === 1 ? "" : "s"})
                </p>
                <p class="portfolio-response">${s.versions > 1 ? s.latest : s.first}</p>
              </div>`,
          )
        : html`<p>No saved samples.</p>`
    }
    ${
      scores.length
        ? html`<h3>Teacher practice scoring</h3>
            <ul>
              ${scores.map((x) => html`<li>${x.t.slice(0, 10)} ${x.task}: ${CRITERIA.map((c) => `${c.name}: ${x[c.id] || "—"}`).join("; ")}</li>`)}
            </ul>`
        : ""
    }
  </article>`;
}

function printSheets(scope) {
  const rows = classSummary(T.students);
  const picked =
    scope === "all"
      ? visibleRows(rows)
      : scope.includes("|")
        ? rows.filter((r) => r.id === scope)
        : visibleRows(rows).filter((r) => r.section === scope);
  let host = document.getElementById("evPrint");
  if (!host) {
    host = Object.assign(document.createElement("div"), { id: "evPrint", className: "ev-print" });
    root.append(host);
  }
  host.innerHTML = toHtml(
    html`${picked.map((r) =>
      sheetFor(
        r,
        T.students.find((s) => s.id === r.id),
      ),
    )}`,
  );
  document.body.dataset.printing = "sheets";
  const done = () => {
    delete document.body.dataset.printing;
    window.removeEventListener("afterprint", done);
  };
  window.addEventListener("afterprint", done);
  window.print();
}

function groupsTab(rowsAll) {
  if (!T.students.length) return html`<p>Add students to see grouping suggestions.</p>`;
  const scoped = T.students.filter((s) => !T.section || s.section === T.section);
  const gs = groupSuggestions(scoped, T.patterns);
  const skillGroups = ACCESS_LAB_FLAGS.instructionalGroupsEnabled ? recommendInstructionalGroups(scoped) : [];
  void rowsAll;
  const filter = html`<label class="field inline no-print"
    ><span>Section</span
    ><select data-section>
      <option value="">All</option>
      ${sections().map((s) => html`<option value="${s}" ${T.section === s ? raw("selected") : ""}>${s}</option>`)}
    </select></label
  >`;
  if (!gs.length && !skillGroups.length)
    return html`${filter}
      <p>
        No two students share a recurring need yet. Groups appear when evidence builds up (patterns
        in 2+ pieces, or work that is lower without supports).
      </p>`;
  return html`${filter}
    ${skillGroups.length ? html`<h3>Shared skill needs</h3><p class="fine">Rule-based suggestions from imported practice evidence. Review the evidence and adjust membership before planning.</p><div class="hub-grid">${skillGroups.map((g) => html`<article class="hub-card"><h3>${g.label}</h3><p><strong>${g.members.length} students</strong>: ${g.members.join(", ")}</p><p class="fine">${g.why}</p><p class="fine">Evidence: ${g.evidence.slice(0, 5).map((e) => `${e.student} · ${e.activityId} · ${e.stage}`).join("; ")}</p><button class="btn ghost small" type="button" data-make-lesson="${g.key}" data-label="${g.label}" data-domain="${g.domain}" data-members="${g.members.join("|")}">Draft 12-minute lesson</button></article>`)}</div>` : ""}
    <h3>Existing response-pattern groups</h3>
    <div class="hub-grid">
      ${gs.map(
        (g) =>
          html`<div class="hub-card">
            <h3>${g.label}</h3>
            ${g.chunks.map((c, i) => html`<p><strong>${g.chunks.length > 1 ? `Group ${i + 1}: ` : ""}</strong>${c.join(", ")} <button type="button" class="ghost small no-print" data-copy="${c.join(", ")}">Copy names</button></p>`)}
            <p class="fine">${g.why}</p>
            <p>${g.suggestion.plan}</p>
            <p class="fine">About ${g.suggestion.minutes} minutes</p>
            <a href="${g.suggestion.link}" target="_blank" rel="noopener">Open in the lab</a>
          </div>`,
      )}
    </div>
    ${T.groups.length ? html`<h3>Teacher-edited groups</h3>${T.groups.map((g) => html`<details class="hub-card"><summary>${g.label} · ${g.members.length} students</summary><fieldset><legend>Group membership</legend>${T.students.filter((s) => !T.section || s.section === T.section).map((s) => html`<label><input type="checkbox" data-group-member="${g.id}" data-alias="${s.alias}" ${g.members.includes(s.alias) ? raw("checked") : ""} /> ${s.alias}</label>`)}</fieldset><p class="fine">Suggested need: ${g.label}. Group edits are saved on this teacher device.</p></details>`)}` : ""}
    ${lessonPanel()}`;
}

const demoBadge = () => html`<span class="badge">${DEMO_LABEL}</span>`;

function plansTab() {
  const real = T.students.filter((s) => !T.section || s.section === T.section);
  const demo = !T.students.length && T.demo;
  const students = T.students.length ? real : T.demo || [];
  if (!students.length)
    return html`<section aria-labelledby="plansTitle">
      <h3 id="plansTitle">Conference plans</h3>
      <p>No student codes are loaded. Conference plans and support gaps are built only from Passport codes students send you — add codes above.</p>
      <p class="fine">To see how this panel works, load an invented class. It is synthetic demo data, kept in this page only and never saved with your roster.</p>
      <button type="button" class="btn" data-demo-load>Load sample demo class (${DEMO_LABEL} DATA)</button>
    </section>`;
  const plans = conferencePlans(students, T.tasks);
  const gaps = supportGaps(students, T.tasks);
  return html`<section aria-labelledby="plansTitle">
      <h3 id="plansTitle">Small-group conference plans${demo ? ` — ${DEMO_LABEL} DATA` : ""}</h3>
      ${demo ? html`<p class="feedback is-hint" role="note"><strong>${DEMO_LABEL} DATA.</strong> These students and their work are invented to show the panel. Nothing here describes a real learner. <button type="button" class="ghost small" data-demo-clear>Clear synthetic demo</button></p>` : ""}
      <p class="fine">Students are grouped when 2 or more of their first attempts in one Key Language Use missed the same observable target. Practice evidence only — not a WIDA level or ACCESS score. Links open the task with the grade band only.</p>
      ${
        plans.length
          ? html`<div class="hub-grid">${plans.map(
              (p) => html`<article class="hub-card">
                <h4>${demo ? demoBadge() : ""} ${p.label}</h4>
                <p><strong>${p.members.length} students</strong> · ${p.dimension} · Grades ${p.band.replace("-", "–")}</p>
                <ul class="fine">${p.members.map((m) => html`<li>${m.alias}: ${m.why}</li>`)}</ul>
                ${p.chunks.length > 1 ? p.chunks.map((c, i) => html`<p>Group ${i + 1}: ${c.join(", ")}</p>`) : ""}
                <h5>${p.minutes}-minute mini-lesson</h5>
                <ol>${p.script.map((st) => html`<li><strong>${st.step} (${st.minutes} min):</strong> ${st.say}</li>`)}</ol>
                ${p.launches.length ? html`<h5>Launch</h5><ul>${p.launches.map((l) => html`<li><a href="${l.url}" target="_blank" rel="noopener">${l.title}</a> <span class="fine">(${l.modality === "speaking" ? "Speaking" : "Writing"} Studio)</span></li>`)}</ul>` : ""}
                <button type="button" class="ghost small no-print" data-copy="${p.members.map((m) => m.alias).join(", ")}">Copy names</button>
              </article>`,
            )}</div>`
          : html`<p>No two students share a missed target yet. Plans appear when 2 or more students each have 2+ first attempts that missed the same target.</p>`
      }
    </section>
    <section aria-labelledby="gapsTitle">
      <h3 id="gapsTitle">Supported vs. independent${demo ? ` — ${DEMO_LABEL} DATA` : ""}</h3>
      <p class="fine">Skills a learner meets with sentence frames or a word bank (2+ supported first attempts, at least two-thirds met) but has not shown on their own yet, or meets one-third less often on their own. Counts come straight from the ledger.</p>
      ${
        gaps.length
          ? html`<div class="lab-table-wrap" tabindex="0" role="region" aria-label="Supported versus independent gaps">
              <table class="hub-table">
                <thead><tr><th scope="col">Student</th><th scope="col">Skill</th><th scope="col">With supports</th><th scope="col">On own</th><th scope="col">Next step</th></tr></thead>
                <tbody>${gaps.map(
                  (g) => html`<tr>
                    <th scope="row">${g.alias}</th>
                    <td>${g.label}</td>
                    <td>${g.supported.met} of ${g.supported.n} met</td>
                    <td>${g.independent.n ? `${g.independent.met} of ${g.independent.n} met` : "No attempts yet"}</td>
                    <td>${g.next}${g.launch ? html` <a href="${g.launch.url}" target="_blank" rel="noopener">${g.launch.title}</a>` : ""}</td>
                  </tr>`,
                )}</tbody>
              </table>
            </div>`
          : html`<p>No supported-vs-independent gaps in the imported evidence yet.</p>`
      }
    </section>`;
}

function diagnosticsTab() {
  const domains = ["All", "Listening", "Reading", "Speaking", "Writing"];
  const rows = T.students.flatMap((student) => buildSkillGraph(student.ledger?.entries || [], student.records || {}).filter((s) => T.skillDomain === "All" || s.domain === T.skillDomain).map((s) => ({ student, skill: s })));
  return html`<label class="field inline"><span>Domain</span><select data-skill-domain>${domains.map((d) => html`<option value="${d}" ${T.skillDomain === d ? raw("selected") : ""}>${d}</option>`)}</select></label>
    <p class="fine">Practice profile only. Every row is derived from a student's imported local evidence ledger. “Confidence” describes evidence coverage and consistency, not a probability.</p>
    ${rows.length ? html`<div class="lab-table-wrap"><table class="hub-table"><thead><tr><th scope="col">Student</th><th scope="col">Skill</th><th scope="col">Practice profile</th><th scope="col">Independent</th><th scope="col">With support</th><th scope="col">Evidence</th><th scope="col">Evidence confidence</th><th scope="col">Last evidence</th><th scope="col">Teacher observation</th></tr></thead><tbody>${rows.filter(({ student, skill }) => skill.evidenceCount || T.overrides[`${student.id}:${skill.id}`]).map(({ student, skill }) => { const key = `${student.id}:${skill.id}`; const ov = T.overrides[key]; const current = ov?.status || skill.status; return html`<tr><th scope="row">${student.alias}</th><td>${skill.domain}: ${skill.name}</td><td>${current === "demonstrated" ? "Demonstrated independently" : current === "supported" ? "Demonstrated with support" : current === "developing" ? "Currently developing" : "Not enough evidence"}</td><td>${skill.independentEvidenceCount}</td><td>${skill.supportedEvidenceCount}</td><td><details><summary>${skill.evidenceCount} item${skill.evidenceCount === 1 ? "" : "s"}</summary><ul>${skill.evidence.map((e) => html`<li>${e.activityId} · ${e.independenceLevel} · ${new Date(e.createdAt).toLocaleDateString()}</li>`)}</ul></details></td><td>${skill.confidence}</td><td>${skill.lastEvidenceAt ? new Date(skill.lastEvidenceAt).toLocaleDateString() : "—"}</td><td><label class="visually-hidden" for="ov-${student.id}-${skill.id}">Teacher observation for ${student.alias}, ${skill.name}</label><select id="ov-${student.id}-${skill.id}" data-skill-override="${key}"><option value="" ${!ov ? raw("selected") : ""}>No override</option><option value="demonstrated" ${ov?.status === "demonstrated" ? raw("selected") : ""}>Teacher: demonstrated independently</option><option value="supported" ${ov?.status === "supported" ? raw("selected") : ""}>Teacher: demonstrated with support</option><option value="developing" ${ov?.status === "developing" ? raw("selected") : ""}>Teacher: currently developing</option></select><label class="visually-hidden" for="note-${student.id}-${skill.id}">Teacher note for ${student.alias}, ${skill.name}</label><textarea id="note-${student.id}-${skill.id}" rows="2" data-observation="${key}" placeholder="Optional teacher observation">${ov?.observation || ""}</textarea>${ov ? html`<small>Teacher record saved ${new Date(ov.updatedAt).toLocaleDateString()}</small>` : ""}</td></tr>`; })}</tbody></table></div>` : html`<p>No imported evidence for this domain yet. Students can share work through Passport when they choose.</p>`}
    <p class="fine">Evidence details link to task identifiers; open Response Samples to review the underlying student work. Teacher overrides are separate and stored in this browser.</p>
    ${lessonPanel()}`;
}

function lessonPanel() {
  const lesson = T.lessons.find((l) => l.id === T.selectedLesson) || T.lessons.at(-1);
  if (!lesson) return T.lessons.length ? "" : "";
  const fields = ["languageObjective", "studentObjective", "teacherModel", "guidedPractice", "studentPractice", "formativeCheck", "fadeScaffolds", "homeLanguageConnection", "extension", "evidenceToCollect"];
  const checks = ["Originality", "Copyright and licensing", "Clear and answerable task", "Cultural assumptions", "Reading load", "Vocabulary level", "Image dependence", "Accessibility", "Bias", "Answer rationale", "Age appropriateness", "Domain validity"];
  return html`<section class="panel" aria-labelledby="lesson-title"><h3 id="lesson-title">${lesson.groupNeed}: next-day mini-lesson (${lesson.durationMinutes} minutes)</h3><p class="fine">Template draft · teacher review required · ${lesson.status === "approved" ? `approved ${new Date(lesson.approvedAt).toLocaleString()}` : "not approved"}</p><label class="field"><span>Group need</span><input data-lesson-edit="groupNeed" value="${lesson.groupNeed}" /></label><label class="field"><span>Materials</span><input data-lesson-edit="materials" value="${lesson.materials.join("; ")}" /></label>${fields.map((field) => html`<label class="field"><span>${field.replace(/[A-Z]/g, (m) => ` ${m.toLowerCase()}`)}</span><textarea data-lesson-edit="${field}" rows="2">${lesson[field]}</textarea></label>`)}<h4>Scaffolds</h4><p>${lesson.scaffolds.join(" · ")}</p><p class="fine">Evidence references: ${lesson.evidenceRefs.map((e) => `${e.student} · ${e.activityId}`).join("; ")}</p><fieldset><legend>Content review before approval</legend>${checks.map((c) => html`<label><input type="checkbox" data-review-check="${c}" ${lesson.provenance.reviewChecklist?.[c] ? raw("checked") : ""} /> ${c}</label>`)}</fieldset><button type="button" class="btn" data-lesson-save="${lesson.id}">Save edits and review</button> <button type="button" class="btn" data-lesson-approve="${lesson.id}" ${lesson.status === "approved" ? raw("disabled") : ""}>Approve lesson</button> <button type="button" class="ghost" data-print-lesson>Print lesson</button><details><summary>Edit history (${lesson.history.length})</summary><ol>${lesson.history.map((h) => html`<li>${new Date(h.t).toLocaleString()} · ${h.action}</li>`)}</ol></details></section>`;
}

function contentReviewTab() {
  const drafts = T.lessons.filter((l) => l.status !== "approved");
  return html`<h3>Original-content provenance review</h3><p>Lesson drafts use an EduWonderLab template and ask the teacher to supply original classroom materials. Nothing is generated or assigned to students automatically.</p>${drafts.length ? html`<ul>${drafts.map((l) => html`<li><button type="button" class="ghost" data-select-lesson="${l.id}">${l.groupNeed}</button> · ${l.provenance.sourceDescription} · ${l.provenance.approvedForStudents ? "approved" : "awaiting teacher review"}</li>`)}</ul>` : html`<p>No lesson drafts are waiting for review.</p>`}${lessonPanel()}`;
}

function samplesTab(rows) {
  const who = T.students.find((s) => s.id === (T.pick || rows[0]?.id));
  if (!who) return html`<p>Add students to read their work.</p>`;
  const samples = samplesFor(who);
  return html`<label class="field no-print"
      ><span>Student</span
      ><select data-pick>
        ${T.students.map((s) => html`<option value="${s.id}" ${s.id === who.id ? raw("selected") : ""}>${s.alias} (${s.section})</option>`)}
      </select></label
    >
    ${
      samples.length
        ? samples.map((s) => {
            const a = analyzeResponse(s.latest, {
              keyUse: "Explain",
              modality: s.modality,
              stage: "supported",
            });
            const flagged = a.errors.filter((e) => e.confidence === "high");
            return html`<article class="portfolio-entry">
              <h4>
                ${icon(s.modality === "writing" ? "writing" : "speaking")} ${s.task}
                <span class="fine"
                  >·
                  ${s.stage ? (s.stage === "independent" ? "on own" : s.stage === "supported" ? "word bank" : "frames + words") : "stage unknown"}
                  · ${s.versions} version${s.versions === 1 ? "" : "s"}</span
                >
              </h4>
              ${
                s.versions > 1
                  ? html`<h5>First draft to latest</h5>
                      <p class="diff">
                        ${diffWords(s.first, s.latest).map((x) => (x.op === "same" ? html`${x.text} ` : x.op === "add" ? html`<ins>${x.text}</ins> ` : html`<del>${x.text}</del> `))}
                      </p>`
                  : html`<p class="portfolio-response">
                      ${highlightHTML(s.latest, flagged, "hl hl-error")}
                    </p>`
              }
              ${s.reflection ? html`<p class="fine"><strong>Student reflection:</strong> ${s.reflection}</p>` : ""}
              ${s.audio?.ok ? html`<p class="fine">Recording: ${s.audio.speechSeconds}s speaking in ${s.audio.seconds}s, ${s.audio.pauseCount} pause${s.audio.pauseCount === 1 ? "" : "s"}, longest run ${s.audio.longestRun}s.</p>` : ""}
              ${s.selfReview ? html`<p class="fine"><strong>Student self-review:</strong> ${CRITERIA.map((c) => `${c.name}: ${s.selfReview[c.id] || "—"}`).join(" · ")}</p>` : ""}
              ${(s.teacherReview || []).map((r) => html`<p class="fine"><strong>Shared by student — recorded as a teacher review ${String(r.t).slice(0, 10)} (unverified):</strong> ${CRITERIA.map((c) => `${c.name}: ${r[c.id]}`).join(" · ")} ${r.note || ""}</p>`)}
              ${flagged.length ? html`<p class="fine">Pattern flags: ${[...new Set(flagged.map((f) => pname(f.id)))].join("; ")}</p>` : ""}
            </article>`;
          })
        : html`<p>${who.alias} has no saved writing or speaking transcripts in this file.</p>`
    }`;
}

function scoringTab() {
  const tasks = [...new Map(T.exemplars.map((x) => [x.taskId, x])).values()];
  const cur = T.taskId || tasks[0]?.taskId;
  const ex = T.exemplars.filter((x) => x.taskId === cur);
  const order = PRACTICE_BANDS.map((b) => ex.find((x) => x.practiceBand === b.id)).filter(Boolean);
  return html`<p class="fine">${DISCLAIMER}</p>
    <label class="field"
      ><span>Scoring anchors for this task</span
      ><select data-task>
        ${tasks.map((x) => html`<option value="${x.taskId}" ${x.taskId === cur ? raw("selected") : ""}>${x.taskId}</option>`)}
      </select></label
    >
    <div class="hub-grid">
      ${order.map(
        (x) =>
          html`<article class="hub-card">
            <h3>${x.practiceBand[0].toUpperCase()}${x.practiceBand.slice(1)}</h3>
            <p class="portfolio-response">${x.response}</p>
            <ul>
              ${x.annotations.map((a) => html`<li>“${a.quote}” — <em>${a.dimension}</em>: ${a.note}</li>`)}
            </ul>
            <p class="fine">${x.whyThisBand}</p>
            <p class="fine"><strong>Teach next:</strong> ${x.nextStep}</p>
          </article>`,
      )}
    </div>
    <p class="row-actions">
      <a class="btn" href="/access-teacher/packets/studio-speaking" target="_blank" rel="noopener"
        >Speaking task cards (teacher copy)</a
      >
      <a class="btn" href="/access-teacher/packets/studio-writing" target="_blank" rel="noopener"
        >Writing task cards (teacher copy)</a
      >
    </p>
    <h3>Score a recording or writing sample</h3>
    <p class="fine">
      Choose an audio file a student downloaded (it plays here; it is not uploaded). Record practice
      bands per criterion and download the sheet.
    </p>
    <input type="file" accept="audio/*" data-audio aria-label="Student recording file" />
    <div id="evAudio"></div>
    <div class="hub-grid">
      ${CRITERIA.map(
        (c) =>
          html`<fieldset class="rubric">
            <legend>${c.name}</legend>
            <ul class="fine">
              ${c.teacher.lookFor.map((x) => html`<li>${x}</li>`)}
            </ul>
            ${PRACTICE_BANDS.map((b) => html`<label class="rubric-opt"><input type="radio" name="sc-${c.id}" value="${b.id}" data-score="${c.id}" /> <strong>${b.label}</strong> ${c.student[b.id]}</label>`)}
          </fieldset>`,
      )}
    </div>
    <div class="row-actions">
      <label class="field inline"
        ><span>Student</span
        ><select id="scWho">
          ${T.students.map((s) => html`<option value="${s.alias}">${s.alias} (${s.section})</option>`)}
          <option value="">Someone else</option>
        </select></label
      >
      <button type="button" class="btn" data-score-save>Save to scoring sheet</button>
      ${T.scores.length ? html`<button type="button" class="btn" data-score-csv>Download scoring sheet (${T.scores.length})</button>` : ""}
    </div>`;
}

function blueprintTab() {
  const b = T.blueprint;
  if (!b) return html`<p>The blueprint could not be loaded. Check your connection and reload.</p>`;
  const alignment = T.alignment;
  const n = (list, use) =>
    list.filter((t) => t.keyUse === use || (t.keyUses || []).includes(use)).length;
  return html`<p class="fine">${b.notOfficial}</p>
    <h3>Kinds of practice</h3>
    <div class="hub-grid">
      ${b.purposes.map(
        (p) =>
          html`<article class="hub-card">
            <h4>${p.label}</h4>
            <p>${p.description}</p>
            ${
              p.features.length
                ? html`<ul class="fine">
                    ${p.features.map((f) => html`<li>${f}</li>`)}
                  </ul>`
                : ""
            }
          </article>`,
      )}
    </div>
    <h3>Coverage by Key Language Use</h3>
    <div class="lab-table-wrap" tabindex="0" role="region" aria-label="Coverage table">
      <table class="hub-table">
        <thead>
          <tr>
            <th scope="col">Key Language Use</th>
            <th scope="col">Speaking tasks</th>
            <th scope="col">Writing tasks</th>
            <th scope="col">Missions</th>
            <th scope="col">Meaning</th>
          </tr>
        </thead>
        <tbody>
          ${b.keyLanguageUses.map(
            (k) =>
              html`<tr>
                <th scope="row">${k.id}</th>
                <td>${n(T.studio.speaking, k.id)}</td>
                <td>${n(T.studio.writing, k.id)}</td>
                <td>${n(T.studio.missions, k.id)}</td>
                <td class="t-meta">${k.definition}</td>
              </tr>`,
          )}
        </tbody>
      </table>
    </div>
    ${alignment ? alignmentCoverageTab(alignment) : html`<section aria-labelledby="activityCoverageTitle"><h3 id="activityCoverageTitle">Activity alignment coverage</h3><p role="status">Alignment metadata could not be loaded. Reload this page to try again.</p></section>`}
    <h3>Skills</h3>
    <div class="hub-grid">
      ${b.domains.map(
        (d) =>
          html`<article class="hub-card">
            <h4>${d.domain}</h4>
            <p class="fine"><strong>Official ACCESS:</strong> ${d.officialFormat}</p>
            <p class="fine"><strong>In this lab:</strong> ${d.labFormat}</p>
          </article>`,
      )}
    </div>
    <h3>Item-quality rules the lab enforces</h3>
    <ul>
      ${b.itemQuality.rules.map((r) => html`<li>${r.text} <span class="fine">(${r.level})</span></li>`)}
    </ul>
    <p class="fine">
      Framework: ${b.framework}.
      ${b.references.map((r) => html`<a href="${r.url}" target="_blank" rel="noopener">${r.title}</a> `)}
    </p>`;
}

const ALIGNMENT_PAGE_SIZE = 40;
const displayList = (list, fallback = "Not tagged") => list?.length ? list.join(", ") : fallback;

function alignmentCoverageTab(alignment) {
  const sourceRows = alignment.records || [];
  const expectationCatalog = alignment.expectationCatalog || [];
  const rows = sourceRows.map((source) => {
    const teacherReview = T.alignmentReviews[source.id];
    if (!teacherReview) return source;
    return {
      ...source,
      gradeClusterCandidates: [teacherReview.gradeCluster],
      academicContext: teacherReview.academicContext,
      keyUses: [teacherReview.keyUse],
      eldStandards: [teacherReview.standard],
      languageExpectations: [teacherReview.languageExpectation],
      languageFunctions: [teacherReview.languageFunction],
      suggestedLanguageFunction: teacherReview.languageFunction,
      languageFeatures: teacherReview.languageFeatures,
      teacherReview,
    };
  });
  const f = T.alignmentFilters;
  const values = (pick) => [...new Set(rows.flatMap(pick).filter(Boolean))].sort((a, b) => a.localeCompare(b));
  const options = (items, value, empty = "All") => html`<option value="">${empty}</option>${items.map((item) => html`<option value="${item}" ${value === item ? raw("selected") : ""}>${item === "__untagged__" ? "Not tagged / missing" : item}</option>`)}`;
  const selected = rows.filter((r) =>
    (!f.band || r.localGradeBand === f.band) &&
    (!f.domain || r.domains.includes(f.domain)) &&
    (!f.keyUse || (f.keyUse === "__untagged__" ? !r.keyUses.length : r.keyUses.includes(f.keyUse))) &&
    (!f.contentArea || (f.contentArea === "__untagged__" ? !r.academicContext : r.academicContext === f.contentArea)) &&
    (!f.standard || (f.standard === "__untagged__" ? !r.eldStandards.length : r.eldStandards.includes(f.standard))) &&
    (!f.expectation || (f.expectation === "__untagged__" ? !r.languageExpectations.length && !r.languageExpectationCandidates?.length : [...r.languageExpectations, ...(r.languageExpectationCandidates || [])].includes(f.expectation))) &&
    (!f.languageFunction || r.suggestedLanguageFunction === f.languageFunction) &&
    (!f.support || r.localSupportTier === f.support) &&
    (!f.review || (f.review === "needs-review" ? !r.teacherReview : Boolean(r.teacherReview))) &&
    (!f.q || `${r.title} ${r.localLanguageFocus.join(" ")} ${r.sourceFile}`.toLowerCase().includes(f.q.toLowerCase()))
  );
  const pages = Math.max(1, Math.ceil(selected.length / ALIGNMENT_PAGE_SIZE));
  T.alignmentPage = Math.min(Math.max(1, T.alignmentPage), pages);
  const shown = selected.slice((T.alignmentPage - 1) * ALIGNMENT_PAGE_SIZE, T.alignmentPage * ALIGNMENT_PAGE_SIZE);
  const total = alignment.counts || {};
  const localReviewCount = Object.keys(T.alignmentReviews).length;
  const reviewSelect = (items, value) => html`<option value="">Choose one</option>${items.map((item) => html`<option value="${item}" ${item === value ? raw("selected") : ""}>${item}</option>`)}`;
  const reviewEditor = (r) => {
    const v = r.teacherReview || {};
    const clusters = r.localGradeBand === "3-5" ? ["2-3", "4-5"] : r.localGradeBand === "6-8" ? ["6-8"] : [...new Set(expectationCatalog.flatMap((x) => x.gradeClusters || [x.gradeCluster]))];
    const expectationValues = [...new Set(expectationCatalog.filter((x) => (x.gradeClusters || [x.gradeCluster]).some((cluster) => clusters.includes(cluster))).map((x) => x.id))];
    return html`<details class="alignment-review" data-alignment-review="${r.id}">
      <summary>${r.teacherReview ? "Edit local teacher review" : "Record local teacher review"}</summary>
      <p class="fine">Saved only in this browser. This review records your source-based decision; it is not official WIDA verification or endorsement.</p>
      <label class="field"><span>WIDA grade cluster reviewed</span><select data-alignment-field="gradeCluster">${reviewSelect(r.localGradeBand === "3-5" ? ["2-3", "4-5"] : ["6-8"], v.gradeCluster || "")}</select></label>
      <label class="field"><span>Academic context</span><input data-alignment-field="academicContext" maxlength="80" value="${v.academicContext ?? r.academicContext}" /></label>
      <label class="field"><span>Key Language Use</span><select data-alignment-field="keyUse">${reviewSelect(["Narrate", "Inform", "Explain", "Argue"], v.keyUse || r.keyUses[0] || "")}</select></label>
      <label class="field"><span>ELD Standard</span><select data-alignment-field="standard">${reviewSelect(["ELD-SI", "ELD-LA", "ELD-MA", "ELD-SC", "ELD-SS"], v.standard || r.eldStandards[0] || "")}</select></label>
      <label class="field"><span>Language Expectation (official catalog)</span><select data-alignment-field="languageExpectation">${reviewSelect(expectationValues, v.languageExpectation || r.languageExpectations[0] || r.languageExpectationCandidates?.[0] || "")}</select><span class="fine">${expectationValues.length} catalog IDs for this record’s possible grade cluster(s).</span></label>
      <label class="field"><span>Language function</span><input data-alignment-field="languageFunction" maxlength="120" value="${v.languageFunction || r.suggestedLanguageFunction}" /></label>
      <label class="field"><span>Language features (separate with semicolons)</span><textarea data-alignment-field="languageFeatures" rows="2" maxlength="600">${(v.languageFeatures || r.languageFeatures).join("; ")}</textarea></label>
      <label class="field"><span>WIDA source page or framework citation</span><input data-alignment-field="sourceReference" maxlength="240" placeholder="https://wida.wisc.edu/... or edition and page" value="${v.sourceReference || ""}" /></label>
      <p class="fine" data-alignment-review-error role="alert" hidden></p>
      <button class="btn" type="button" data-align-save="${r.id}">Save local review</button>
      ${r.teacherReview ? html`<button class="ghost" type="button" data-align-clear="${r.id}">Clear local review</button>` : ""}
    </details>`;
  };
  return html`<section aria-labelledby="activityCoverageTitle">
    <h3 id="activityCoverageTitle">Activity alignment coverage</h3>
    <p class="fine">${alignment.provenance} Counts show source tags and missing metadata; they do not rate students or claim WIDA alignment.</p>
    <div class="hub-grid" aria-label="Alignment metadata totals">
      <article class="hub-card"><strong>${total.total || 0}</strong><p>activities and studio tasks</p></article>
      <article class="hub-card"><strong>${total.explicitStandards || 0}</strong><p>with an author-entered ELD Standard tag</p></article>
      <article class="hub-card"><strong>${total.explicitKeyUses || 0}</strong><p>with an author-entered Key Language Use tag</p></article>
      <article class="hub-card"><strong>${total.explicitExpectations || 0}</strong><p>with a Language Expectation ID</p></article>
      <article class="hub-card"><strong>${total.suggestedExpectations || 0}</strong><p>with source-tag-based candidate mappings (review required)</p></article>
      <article class="hub-card"><strong>${localReviewCount}</strong><p>local teacher reviews saved on this device</p></article>
    </div>
    <p class="feedback is-hint" role="note"><strong>Review status:</strong> ${total.needsReview || 0} records need metadata review. Suggested IDs are drawn from the WIDA 2020 catalog using local standard, Key Language Use, domain and grade-band tags. They are candidates, not verified alignments; educators must check the source task and record a cited local review.</p>
    <p class="fine">The local Grades 3–5 band spans WIDA grade clusters 2–3 and 4–5. This inventory marks both as candidates; an individual task needs a grade-specific review before one cluster can be selected.</p>
    <div class="library-filters" aria-label="Filter activity alignment inventory">
      <label class="field"><span>Local grade band</span><select data-align-filter="band">${options(["3-5", "6-8", "Integrated"], f.band)}</select></label>
      <label class="field"><span>Domain</span><select data-align-filter="domain">${options(["Listening", "Reading", "Speaking", "Writing"], f.domain)}</select></label>
      <label class="field"><span>Key Language Use</span><select data-align-filter="keyUse">${options(["Narrate", "Inform", "Explain", "Argue", "__untagged__"], f.keyUse)}</select></label>
      <label class="field"><span>Academic context</span><select data-align-filter="contentArea">${options([...values((r) => [r.academicContext]), "__untagged__"], f.contentArea)}</select></label>
      <label class="field"><span>Author-entered ELD Standard</span><select data-align-filter="standard">${options(["ELD-SI", "ELD-LA", "ELD-MA", "ELD-SC", "ELD-SS", "__untagged__"], f.standard)}</select></label>
      <label class="field"><span>Language Expectation ID</span><select data-align-filter="expectation">${options([...values((r) => [...r.languageExpectations, ...(r.languageExpectationCandidates || [])]), "__untagged__"], f.expectation)}</select></label>
      <label class="field"><span>Language function (suggestions marked)</span><select data-align-filter="languageFunction">${options(values((r) => [r.suggestedLanguageFunction]), f.languageFunction)}</select></label>
      <label class="field"><span>Local support choice</span><select data-align-filter="support">${options(values((r) => [r.localSupportTier]), f.support)}</select></label>
      <label class="field"><span>Review status</span><select data-align-filter="review">${options(["needs-review", "teacher-reviewed"], f.review)}</select></label>
      <label class="field library-search"><span>Search title or language focus</span><input type="search" data-align-search maxlength="100" value="${f.q}" placeholder="Try cause and effect, evidence, retell…" /></label>
      <button class="btn" type="button" data-align-reset>Reset alignment filters</button>
    </div>
    <p role="status">${selected.length} of ${rows.length} records match these filters.</p>
    <div class="lab-table-wrap" tabindex="0" role="region" aria-label="Filtered activity alignment records">
      <table class="hub-table"><thead><tr><th scope="col">Task</th><th scope="col">Grade and domain</th><th scope="col">Context and use</th><th scope="col">Language function</th><th scope="col">Standard / expectation</th><th scope="col">Local supports</th><th scope="col">Review state</th></tr></thead>
      <tbody>${shown.map((r) => html`<tr>
        <th scope="row">${r.title}<span class="fine">${r.sourceType} · ${r.id}</span></th>
        <td>${r.localGradeBand}${r.gradeClusterCandidates.length ? html`<span class="fine">WIDA cluster candidate: ${displayList(r.gradeClusterCandidates, "—")}</span>` : ""}<span class="fine">${displayList(r.domains)}</span></td>
        <td>${r.academicContext || "Not tagged"}<span class="fine">${displayList(r.keyUses, "No Key Language Use tag")}</span></td>
        <td>${r.suggestedLanguageFunction || "Not tagged"}<span class="fine">${r.functionStatus}</span></td>
        <td>${displayList(r.eldStandards)}<span class="fine">Expectation: ${displayList(r.languageExpectations, r.languageExpectationCandidates?.length ? `Candidate: ${r.languageExpectationCandidates.join(", ")}` : "No catalog candidate")}</span><span class="fine">${r.expectationMappingStatus || ""}</span></td>
        <td>${r.localSupportTier}<span class="fine">${displayList(r.scaffoldAvailability)}</span></td>
        <td>${r.teacherReview ? "Teacher-reviewed locally" : r.alignmentStatus}<span class="fine">${r.teacherReview ? `Source: ${r.teacherReview.sourceReference} · saved ${r.teacherReview.reviewedAt.slice(0, 10)}` : r.metadataGaps.length ? `Missing: ${r.metadataGaps.join(", ")}` : "No listed metadata gaps"}</span>${reviewEditor(r)}</td>
      </tr>`)}</tbody></table>
    </div>
    <nav class="library-pagination" aria-label="Alignment record pages">
      <button type="button" class="btn" data-align-page="${T.alignmentPage - 1}" ${T.alignmentPage <= 1 ? raw("disabled") : ""}>Previous</button>
      <span>Page ${T.alignmentPage} of ${pages} · showing up to ${ALIGNMENT_PAGE_SIZE}</span>
      <button type="button" class="btn" data-align-page="${T.alignmentPage + 1}" ${T.alignmentPage >= pages ? raw("disabled") : ""}>Next</button>
    </nav>
  </section>`;
}

function draw() {
  const rows = classSummary(T.students);
  const body =
    T.tab === "plans"
      ? plansTab()
      : T.tab === "groups"
      ? groupsTab(rows)
      : T.tab === "skills"
        ? diagnosticsTab()
        : T.tab === "content"
          ? contentReviewTab()
      : T.tab === "samples"
        ? samplesTab(rows)
        : T.tab === "scoring"
          ? scoringTab()
          : T.tab === "blueprint"
            ? blueprintTab()
            : classTab(rows);
  const host = document.getElementById("evPrint");
  root.innerHTML = toHtml(
    html`<section class="panel ev-screen" aria-labelledby="evTitle">
      <p class="eyebrow">Teacher Intelligence Dashboard <span class="th-tag is-teacher">${icon("lock")} Teacher only</span></p>
      <h2 id="evTitle">Class language evidence</h2>
      <p class="fine">
        Built from what students actually did, with the help they used kept separate. Practice
        evidence only — never a WIDA level or ACCESS score.
      </p>
      ${importBox()}${tabs()}
      <div class="ev-body">${body}</div>
    </section>`,
  );
  if (host) root.append(host);
}

function download(name, text, type = "text/csv;charset=utf-8") {
  const url = URL.createObjectURL(new Blob(["﻿", text], { type }));
  const a = Object.assign(document.createElement("a"), { href: url, download: name });
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

const focusTitle = () => document.getElementById("stuTitle")?.focus();

root.addEventListener("click", async (e) => {
  const t = e.target;
  const alignmentPage = t.closest("[data-align-page]");
  if (alignmentPage) {
    T.alignmentPage = Number(alignmentPage.dataset.alignPage) || 1;
    return draw();
  }
  const tab = t.closest("[data-tab]");
  if (tab) {
    T.tab = tab.dataset.tab;
    return draw();
  }
  if (t.closest("[data-align-reset]")) {
    T.alignmentFilters = { band: "", domain: "", keyUse: "", contentArea: "", standard: "", expectation: "", languageFunction: "", support: "", q: "" };
    T.alignmentPage = 1;
    return draw();
  }
  const saveAlignmentReview = t.closest("[data-align-save]");
  if (saveAlignmentReview) {
    const editor = saveAlignmentReview.closest("[data-alignment-review]");
    const readField = (name) => editor?.querySelector(`[data-alignment-field="${name}"]`)?.value.trim() || "";
    const review = {
      gradeCluster: readField("gradeCluster"),
      academicContext: readField("academicContext"),
      keyUse: readField("keyUse"),
      standard: readField("standard"),
      languageExpectation: readField("languageExpectation"),
      languageFunction: readField("languageFunction"),
      languageFeatures: readField("languageFeatures").split(";").map((x) => x.trim()).filter(Boolean),
      sourceReference: readField("sourceReference"),
    };
    const error = editor?.querySelector("[data-alignment-review-error]");
    const referenceUrl = (() => { try { return new URL(review.sourceReference); } catch { return null; } })();
    const row = T.alignment?.records?.find((r) => r.id === saveAlignmentReview.dataset.alignSave);
    const mapping = T.alignment?.expectationCatalog?.find((x) => x.id === review.languageExpectation);
    const domains = row?.domains || [];
    const allowedModes = domains.length === 4 || (domains.some((d) => d === "Listening" || d === "Reading") && domains.some((d) => d === "Speaking" || d === "Writing"))
      ? ["Interpretive", "Expressive"]
      : domains.some((d) => d === "Listening" || d === "Reading") ? ["Interpretive"] : ["Expressive"];
    const expectationValid = mapping && (mapping.gradeClusters || [mapping.gradeCluster]).includes(review.gradeCluster) && mapping.standard === review.standard && mapping.keyUse === review.keyUse && (mapping.standard === "ELD-SI" || allowedModes.includes(mapping.mode));
    const valid = review.gradeCluster && review.academicContext && review.keyUse && review.standard &&
      expectationValid && review.languageFunction && review.languageFeatures.length &&
      referenceUrl && ["wida.wisc.edu", "www.wida.wisc.edu"].includes(referenceUrl.hostname) && referenceUrl.protocol === "https:";
    if (!valid) {
      if (error) { error.hidden = false; error.textContent = "Choose a catalog expectation that matches the selected grade cluster, standard and Key Language Use, then complete the fields and cite an HTTPS page on wida.wisc.edu."; }
      return;
    }
    T.alignmentReviews[saveAlignmentReview.dataset.alignSave] = {
      ...review, status: "teacher-reviewed-local", reviewedAt: new Date().toISOString(),
    };
    persist();
    note("Local alignment review saved on this device. This is not official WIDA validation.");
    return draw();
  }
  const clearAlignmentReview = t.closest("[data-align-clear]");
  if (clearAlignmentReview) {
    delete T.alignmentReviews[clearAlignmentReview.dataset.alignClear];
    persist();
    note("Local alignment review cleared from this device.");
    return draw();
  }
  if (t.closest("[data-demo-load]")) {
    T.demo = demoClass();
    note(`Loaded a ${DEMO_LABEL} class. It is invented data and is not saved.`);
    return draw();
  }
  if (t.closest("[data-demo-clear]")) {
    T.demo = null;
    note(`${DEMO_LABEL} class cleared.`);
    return draw();
  }
  const lessonPick = t.closest("[data-select-lesson]");
  if (lessonPick) { T.selectedLesson = lessonPick.dataset.selectLesson; return draw(); }
  const makeLesson = t.closest("[data-make-lesson]");
  if (makeLesson) {
    const group = { key: makeLesson.dataset.makeLesson, label: makeLesson.dataset.label, domain: makeLesson.dataset.domain, members: (makeLesson.dataset.members || "").split("|").filter(Boolean), evidence: recommendInstructionalGroups(T.students).find((g) => g.key === makeLesson.dataset.makeLesson)?.evidence || [] };
    const savedGroup = { id: `${group.key}:${Date.now().toString(36)}`, ...group };
    T.groups.push(savedGroup);
    const lesson = makeMiniLesson(group);
    lesson.provenance.reviewChecklist = {};
    T.lessons.push(lesson); T.selectedLesson = lesson.id; T.tab = "groups"; persist(); note("A template lesson draft is ready. Review and approve it before using it with students."); return draw();
  }
  const saveLesson = t.closest("[data-lesson-save]");
  if (saveLesson) {
    const lesson = T.lessons.find((l) => l.id === saveLesson.dataset.lessonSave);
    if (!lesson) return;
    lesson.history.push({ t: new Date().toISOString(), action: "Teacher saved lesson edits" });
    for (const input of root.querySelectorAll("[data-lesson-edit]")) {
      const key = input.dataset.lessonEdit;
      lesson[key] = key === "materials" ? input.value.split(";").map((x) => x.trim()).filter(Boolean) : input.value.trim();
    }
    lesson.provenance.reviewChecklist ||= {};
    for (const check of root.querySelectorAll("[data-review-check]")) lesson.provenance.reviewChecklist[check.dataset.reviewCheck] = check.checked;
    if (lesson.status === "approved") { lesson.status = "draft"; lesson.provenance.approvedForStudents = false; lesson.approvedAt = null; }
    persist(); note("Lesson edits and review checks saved."); return draw();
  }
  const approveLesson = t.closest("[data-lesson-approve]");
  if (approveLesson) {
    const lesson = T.lessons.find((l) => l.id === approveLesson.dataset.lessonApprove);
    if (!lesson) return;
    const checklist = lesson.provenance.reviewChecklist || {};
    const required = ["Originality", "Copyright and licensing", "Clear and answerable task", "Cultural assumptions", "Reading load", "Vocabulary level", "Image dependence", "Accessibility", "Bias", "Answer rationale", "Age appropriateness", "Domain validity"];
    if (!required.every((key) => checklist[key])) { note("Complete and save every content review check before approval."); return; }
    lesson.history.push({ t: new Date().toISOString(), action: "Teacher approved lesson after content review" });
    lesson.status = "approved"; lesson.approvedAt = new Date().toISOString(); lesson.provenance.approvedForStudents = true; lesson.provenance.biasChecked = true; lesson.provenance.accessibilityChecked = true; lesson.provenance.reviewedAt = lesson.approvedAt; lesson.provenance.reviewerId = "local teacher workspace"; persist(); note("Lesson approved in this teacher workspace. Assignment remains a separate teacher action."); return draw();
  }
  if (t.closest("[data-print-lesson]")) {
    const lesson = T.lessons.find((l) => l.id === T.selectedLesson) || T.lessons.at(-1);
    if (!lesson) return;
    let host = document.getElementById("lessonPrint");
    if (!host) { host = Object.assign(document.createElement("div"), { id: "lessonPrint", className: "ev-print" }); root.append(host); }
    host.innerHTML = toHtml(html`<article class="ev-sheet"><h1>Next-day mini-lesson: ${lesson.groupNeed}</h1><p>${lesson.durationMinutes} minutes · ${lesson.status === "approved" ? "Teacher approved" : "Draft for teacher review"}</p><p><strong>Language objective:</strong> ${lesson.languageObjective}</p><p><strong>Student objective:</strong> ${lesson.studentObjective}</p><p><strong>Materials:</strong> ${lesson.materials.join("; ")}</p><h2>Teacher model</h2><p>${lesson.teacherModel}</p><h2>Guided practice</h2><p>${lesson.guidedPractice}</p><h2>Student practice</h2><p>${lesson.studentPractice}</p><p><strong>Formative check:</strong> ${lesson.formativeCheck}</p><p><strong>Scaffolds:</strong> ${lesson.scaffolds.join("; ")}</p><p><strong>Fade:</strong> ${lesson.fadeScaffolds}</p><p><strong>Home-language connection:</strong> ${lesson.homeLanguageConnection}</p><p><strong>Extension:</strong> ${lesson.extension}</p><p><strong>Collect:</strong> ${lesson.evidenceToCollect}</p><p class="fine">Instructional practice only. Evidence references: ${lesson.evidenceRefs.map((ref) => `${ref.student} · ${ref.activityId}`).join("; ")}</p></article>`);
    document.body.dataset.printing = "lesson";
    const done = () => { delete document.body.dataset.printing; window.removeEventListener("afterprint", done); };
    window.addEventListener("afterprint", done); window.print(); return;
  }
  const sort = t.closest("[data-sort]");
  if (sort) {
    const key = sort.dataset.sort;
    T.sort = { key, dir: T.sort.key === key ? -T.sort.dir : 1 };
    return draw();
  }
  const st = t.closest("[data-student]");
  if (st) {
    T.pick = T.pick === st.dataset.student ? "" : st.dataset.student;
    draw();
    return focusTitle();
  }
  if (t.closest("[data-add]")) {
    T.demo = null;
    T.lastSection = document.getElementById("evSection").value.trim();
    const text = document.getElementById("evCode").value;
    const codes = text.match(/ACCESST?1\.[A-Za-z0-9+/=_-]+/g) || (text.trim() ? [text] : []);
    if (!codes.length) note("Paste a code or choose a file first.");
    for (const c of codes) {
      try {
        addStudent(c, T.lastSection);
      } catch (err) {
        note(err.message);
      }
    }
    persist();
    return draw();
  }
  const rm = t.closest("[data-remove]");
  if (rm) {
    const removed = T.students.find((s) => s.id === rm.dataset.remove);
    T.students = T.students.filter((s) => s.id !== rm.dataset.remove);
    if (removed) {
      for (const group of T.groups) group.members = group.members.filter((alias) => alias !== removed.alias);
      for (const lesson of T.lessons) lesson.evidenceRefs = lesson.evidenceRefs.filter((ref) => ref.student !== removed.alias);
      for (const key of Object.keys(T.overrides)) if (key.startsWith(`${removed.id}:`)) delete T.overrides[key];
      T.scores = T.scores.filter((row) => row.who !== removed.alias);
    }
    if (T.pick === rm.dataset.remove) T.pick = "";
    persist();
    note("Student removed.");
    return draw();
  }
  if (t.closest("[data-clear]")) {
    if (confirm("Remove all students and saved scores from this browser?")) {
      T.students = [];
      T.scores = [];
      T.groups = [];
      T.lessons = [];
      T.overrides = {};
      T.pick = "";
      T.messages = [];
      persist();
    }
    return draw();
  }
  const copy = t.closest("[data-copy]");
  if (copy) {
    try {
      await navigator.clipboard.writeText(copy.dataset.copy);
      return announce("Names copied.");
    } catch {
      return announce("Copy failed. Select the names and copy them.");
    }
  }
  if (t.closest("[data-csv]"))
    return download("class-language-evidence.csv", toCSV(visibleRows(classSummary(T.students))));
  const ps = t.closest("[data-print-sheets]");
  if (ps) return printSheets(ps.dataset.printSheets);
  if (t.closest("[data-score-save]")) {
    const row = {
      who: document.getElementById("scWho").value || "Student",
      t: new Date().toISOString(),
      task: T.taskId || "",
    };
    for (const c of CRITERIA)
      row[c.id] = root.querySelector(`input[name="sc-${c.id}"]:checked`)?.value || "";
    T.scores.push(row);
    persist();
    note("Saved to the scoring sheet.");
    return draw();
  }
  if (t.closest("[data-score-csv]")) {
    const head = ["Student", "Date", "Task", ...CRITERIA.map((c) => c.name)].map(csvCell).join(",");
    const lines = T.scores.map((r) =>
      [r.who, r.t.slice(0, 10), r.task, ...CRITERIA.map((c) => r[c.id])].map(csvCell).join(","),
    );
    return download("practice-scoring-sheet.csv", `${head}\n${lines.join("\n")}\n`);
  }
});

let searchTimer = 0;
root.addEventListener("input", (e) => {
  if (e.target.matches("[data-align-search]")) {
    T.alignmentFilters.q = e.target.value;
    T.alignmentPage = 1;
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      draw();
      root.querySelector("[data-align-search]")?.focus();
    }, 150);
    return;
  }
  if (!e.target.matches("[data-search]")) return;
  T.q = e.target.value;
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => {
    draw();
    root.querySelector("[data-search]")?.focus();
  }, 150);
});

root.addEventListener("change", async (e) => {
  const t = e.target;
  if (t.matches("[data-align-filter]")) {
    T.alignmentFilters[t.dataset.alignFilter] = t.value;
    T.alignmentPage = 1;
    return draw();
  }
  if (t.matches("[data-section]")) {
    T.section = t.value;
    return draw();
  }
  if (t.matches("[data-skill-domain]")) { T.skillDomain = t.value; return draw(); }
  if (t.matches("[data-group-member]")) {
    const group = T.groups.find((g) => g.id === t.dataset.groupMember);
    if (!group) return;
    const members = new Set(group.members);
    if (t.checked) members.add(t.dataset.alias); else members.delete(t.dataset.alias);
    group.members = [...members]; group.editedAt = new Date().toISOString(); persist(); note("Group membership saved in this browser.");
  }
  if (t.matches("[data-skill-override]")) {
    const key = t.dataset.skillOverride;
    if (t.value) T.overrides[key] = { ...(T.overrides[key] || {}), status: t.value, updatedAt: new Date().toISOString(), source: "teacher" };
    else delete T.overrides[key];
    persist(); note("Teacher override saved separately from practice evidence."); return draw();
  }
  if (t.matches("[data-observation]")) {
    const key = t.dataset.observation;
    T.overrides[key] = { ...(T.overrides[key] || {}), observation: t.value.trim(), updatedAt: new Date().toISOString(), source: "teacher" };
    persist(); note("Teacher observation saved separately from practice evidence.");
  }
  if (t.matches("[data-pick]")) {
    T.pick = t.value;
    return draw();
  }
  if (t.matches("[data-task]")) {
    T.taskId = t.value;
    return draw();
  }
  if (t.id === "evFile") {
    T.demo = null;
    T.lastSection = document.getElementById("evSection").value.trim();
    for (const f of t.files) {
      try {
        addStudent(await f.text(), T.lastSection);
      } catch (err) {
        note(`${f.name}: ${err.message}`);
      }
    }
    persist();
    return draw();
  }
  if (t.matches("[data-audio]") && t.files[0]) {
    const url = URL.createObjectURL(t.files[0]);
    document.getElementById("evAudio").innerHTML =
      `<audio controls src="${url}" aria-label="Student recording"></audio>`;
  }
});

Promise.all([
  loadPatterns().catch(() => ({ patterns: {} })),
  loadExemplars().catch(() => []),
  loadBlueprint().catch(() => null),
  loadStudioIndex().catch(() => null),
  loadSpeakingTasks().catch(() => ({ tasks: [] })),
  loadWritingTasks().catch(() => ({ tasks: [] })),
  loadAlignment().catch(() => null),
]).then(([p, x, bp, idx, sp, wr, alignment]) => {
  T.tasks = [
    ...(sp.tasks || []).map((t) => ({ id: t.id, title: t.title, keyUse: t.keyUse, band: t.band, modality: "speaking" })),
    ...(wr.tasks || []).map((t) => ({ id: t.id, title: t.title, keyUse: t.keyUse, band: t.band, modality: "writing" })),
  ];
  T.patterns = p.patterns || {};
  T.exemplars = x;
  T.blueprint = bp;
  T.alignment = alignment;
  if (idx) T.studio = idx;
  draw();
});
