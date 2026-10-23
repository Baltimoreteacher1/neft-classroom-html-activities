// Teacher Intelligence Dashboard — class language evidence for the ACCESS Practice Lab.
// Students send a share code or file (their alias only); this page reads them in the browser and keeps
// the roster on this teacher device. Nothing is uploaded. Every statement traces to ledger entries or
// to the learner's own words, and no screen shows a proficiency level or a composite score.
import {
  loadBlueprint,
  loadExemplars,
  loadPatterns,
  loadStudioIndex,
} from "/access-practice-lab/src/content.js";
import { analyzeResponse } from "/access-practice-lab/src/lang/analyze.js";
import { CRITERIA, DISCLAIMER, PRACTICE_BANDS } from "/access-practice-lab/src/lang/rubrics.js";
import { decodeShare } from "/access-practice-lab/src/lang/share.js";
import {
  classSummary,
  csvCell,
  groupSuggestions,
  interventionsFor,
  samplesFor,
  toCSV,
  triage,
} from "/access-practice-lab/src/lang/teacher.js";
import { diffWords } from "/access-practice-lab/src/lang/text.js";
import { highlightHTML } from "/access-practice-lab/src/studio-ui.js";
import { announce, html, raw, toHtml } from "/access-practice-lab/src/util.js";

const KEY = "accessTeacher:v1:roster";
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
});
const persist = () => {
  try {
    localStorage.setItem(KEY, JSON.stringify(T.students.map(slim)));
    localStorage.setItem(`${KEY}:scores`, JSON.stringify(T.scores));
    T.saveError = "";
  } catch {
    T.saveError =
      "This browser could not save the roster (storage is full). Download the class CSV and remove some students before closing, or this list will be lost.";
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
      ["groups", "Small groups"],
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
        ? html`<ul class="fine" role="status">
            ${T.messages.slice(-8).map((m) => html`<li>${m}</li>`)}
          </ul>`
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
      ${label}${T.sort.key === key ? (T.sort.dir === 1 ? " ▲" : " ▼") : ""}
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
    ${T.pick ? studentPanel(allRows.find((r) => r.id === T.pick)) : ""}`;
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

function studentPanel(r) {
  if (!r) return "";
  const p = r.profile;
  const iv = interventionsFor(r, T.patterns);
  return html`<section class="panel student-panel ev-screen" aria-labelledby="stuTitle">
    <h3 id="stuTitle" tabindex="-1">${r.alias} <span class="fine">· ${r.section}</span></h3>
    ${evidenceList(r)}
    ${
      p.errors.length
        ? html`<p>
            <strong>Recurring patterns:</strong> ${p.errors
              .slice(0, 4)
              .map((e) => `${pname(e.id)} (${e.drafts})${e.mastered ? " ✓" : ""}`)
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
  void rowsAll;
  const filter = html`<label class="field inline no-print"
    ><span>Section</span
    ><select data-section>
      <option value="">All</option>
      ${sections().map((s) => html`<option value="${s}" ${T.section === s ? raw("selected") : ""}>${s}</option>`)}
    </select></label
  >`;
  if (!gs.length)
    return html`${filter}
      <p>
        No two students share a recurring need yet. Groups appear when evidence builds up (patterns
        in 2+ pieces, or work that is lower without supports).
      </p>`;
  return html`${filter}
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
    </div>`;
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
                ${s.modality === "writing" ? "✍️" : "🎤"} ${s.task}
                <span class="fine"
                  >·
                  ${s.stage ? (s.stage === "independent" ? "on own" : s.stage === "supported" ? "word bank" : "frames + words") : "stage unknown"}
                  · ${s.versions} version${s.versions === 1 ? "" : "s"}</span
                >
              </h4>
              ${
                s.versions > 1
                  ? html`<h5>First → latest</h5>
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

function draw() {
  const rows = classSummary(T.students);
  const body =
    T.tab === "groups"
      ? groupsTab(rows)
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
      <p class="eyebrow">Teacher Intelligence Dashboard</p>
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
  const tab = t.closest("[data-tab]");
  if (tab) {
    T.tab = tab.dataset.tab;
    return draw();
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
    T.students = T.students.filter((s) => s.id !== rm.dataset.remove);
    if (T.pick === rm.dataset.remove) T.pick = "";
    persist();
    note("Student removed.");
    return draw();
  }
  if (t.closest("[data-clear]")) {
    if (confirm("Remove all students and saved scores from this browser?")) {
      T.students = [];
      T.scores = [];
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
  if (t.matches("[data-section]")) {
    T.section = t.value;
    return draw();
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
]).then(([p, x, bp, idx]) => {
  T.patterns = p.patterns || {};
  T.exemplars = x;
  T.blueprint = bp;
  if (idx) T.studio = idx;
  draw();
});
