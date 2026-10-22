// Teacher Intelligence Dashboard — class language evidence for the ACCESS Practice Lab.
// Students send a share code or file (their alias only); this page reads them in the browser and keeps
// the roster on this teacher device. Nothing is uploaded. Every statement traces to ledger entries or
// to the learner's own words, and no screen shows a proficiency level or a composite score.
import { loadBlueprint, loadExemplars, loadPatterns, loadStudioIndex } from "/access-practice-lab/src/content.js";
import { analyzeResponse } from "/access-practice-lab/src/lang/analyze.js";
import { decodeShare } from "/access-practice-lab/src/lang/share.js";
import {
  classSummary,
  groupSuggestions,
  interventionsFor,
  samplesFor,
  toCSV,
} from "/access-practice-lab/src/lang/teacher.js";
import { CRITERIA, DISCLAIMER, PRACTICE_BANDS } from "/access-practice-lab/src/lang/rubrics.js";
import { diffWords } from "/access-practice-lab/src/lang/text.js";
import { highlightHTML } from "/access-practice-lab/src/studio-ui.js";
import { announce, html, raw, toHtml } from "/access-practice-lab/src/util.js";

const KEY = "accessTeacher:v1:roster";
const root = document.getElementById("classEvidence");
const T = { blueprint: null, studio: { speaking: [], writing: [], missions: [] },
  students: load(),
  tab: "class",
  pick: "",
  patterns: {},
  exemplars: [],
  message: "",
  scores: loadScores(),
};
function load() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
}
function loadScores() {
  try {
    return JSON.parse(localStorage.getItem(`${KEY}:scores`) || "[]");
  } catch {
    return [];
  }
}
const persist = () => {
  try {
    localStorage.setItem(KEY, JSON.stringify(T.students));
    localStorage.setItem(`${KEY}:scores`, JSON.stringify(T.scores));
  } catch {
    T.message = "This browser could not save the roster. Export the CSV before closing.";
  }
};
const pct = (v) => (v == null ? "—" : `${Math.round(v * 100)}%`);

function addStudent(text) {
  const s = decodeShare(text);
  const i = T.students.findIndex((x) => x.alias === s.alias && x.band === s.band);
  if (i >= 0) T.students[i] = s;
  else T.students.push(s);
  persist();
}

function tabs() {
  return html`<div class="band-switch" role="group" aria-label="Dashboard sections">
    ${[
      ["class", "Class"],
      ["groups", "Small groups"],
      ["samples", "Response samples"],
      ["scoring", "Scoring practice"],
      ["blueprint", "Blueprint and quality"],
    ].map(
      ([k, l]) =>
        html`<button
          type="button"
          class="band-btn"
          data-tab="${k}"
          aria-pressed="${T.tab === k}"
        >
          ${l}
        </button>`,
    )}
  </div>`;
}

function importBox() {
  return html`<div class="hub-card">
    <h3>Add student work</h3>
    <p class="fine">
      Students choose “Send my work to my teacher” in their Passport, or copy their progress code.
      Paste one code at a time, or choose files. Only an alias is included.
    </p>
    <textarea
      id="evCode"
      rows="3"
      placeholder="ACCESST1.… or ACCESS1.…"
      aria-label="Student share code"
    ></textarea>
    <div class="row-actions">
      <button type="button" class="btn btn-primary" data-add>Add student</button>
      <label class="btn"
        >Choose file(s)<input type="file" id="evFile" accept=".json,.txt" multiple hidden
      /></label>
      ${T.students.length ? html`<button type="button" class="ghost danger" data-clear>Remove all</button>` : ""}
    </div>
    ${T.message ? html`<p role="status">${T.message}</p>` : ""}
  </div>`;
}

function classTab(rows) {
  if (!rows.length)
    return html`<p>No students yet. Add a share code above to see class evidence.</p>`;
  return html`<div class="lab-table-wrap">
      <table class="hub-table">
        <thead>
          <tr>
            <th scope="col">Student</th>
            <th scope="col">First attempts</th>
            <th scope="col">On own</th>
            <th scope="col">Revisions</th>
            <th scope="col">Top pattern</th>
            <th scope="col">Support check</th>
            <th scope="col">Last active</th>
          </tr>
        </thead>
        <tbody>
          ${rows.map(
            (r) =>
              html`<tr>
                <td class="t-title">
                  <button type="button" class="ghost" data-student="${r.alias}">${r.alias}</button>
                </td>
                <td>
                  ${r.firstAttempts}${r.enoughEvidence ? "" : html` <span class="fine">(early)</span>`}
                </td>
                <td>${pct(r.independentShare)}</td>
                <td>${r.revisions}</td>
                <td>${r.topPattern ? T.patterns[r.topPattern]?.name || r.topPattern : "—"}</td>
                <td>
                  ${r.dependent.length ? html`<span class="badge">Lower alone: ${r.dependent.slice(0, 2).join(", ")}</span>` : r.enoughEvidence ? "Similar with and without help" : html`<span class="fine">Needs more evidence</span>`}
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
      <button type="button" class="btn" data-csv>Download class CSV</button
      ><button type="button" class="btn" data-print>Print</button>
    </div>
    ${T.pick ? studentPanel(rows.find((r) => r.alias === T.pick)) : ""}`;
}

function studentPanel(r) {
  if (!r) return "";
  const p = r.profile;
  const iv = interventionsFor(r, T.patterns);
  return html`<section class="panel student-panel">
    <h3>${r.alias}</h3>
    <ul class="evidence-list">
      ${Object.entries(p.features).map(
        ([k, f]) =>
          html`<li>
            <span>${f.label} <em class="fine">(${f.dimension})</em></span
            ><span
              >${f.all.status === "ok" ? `${f.all.direction} over ${f.all.n} attempts` : `not enough evidence (${f.all.n} of 3)`}${f.dependence.status === "ok" && f.dependence.dependent ? " · lower without supports" : ""}</span
            >
          </li>`,
      )}
    </ul>
    ${
      p.errors.length
        ? html`<p>
            <strong>Recurring patterns:</strong> ${p.errors
              .slice(0, 4)
              .map(
                (e) => `${T.patterns[e.id]?.name || e.id} (${e.drafts})${e.mastered ? " ✓" : ""}`,
              )
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
  </section>`;
}

function groupsTab() {
  const gs = groupSuggestions(T.students, T.patterns);
  if (!T.students.length) return html`<p>Add students to see grouping suggestions.</p>`;
  if (!gs.length)
    return html`<p>
      No two students share a recurring need yet. Groups appear when evidence builds up (patterns in
      2+ pieces, or work that is lower without supports).
    </p>`;
  return html`<div class="hub-grid">
    ${gs.map(
      (g) =>
        html`<div class="hub-card">
          <h3>${g.label}</h3>
          <p>
            <strong>${g.members.join(", ")}</strong>${g.overflow ? ` and ${g.overflow} more` : ""}
          </p>
          <p class="fine">${g.why}</p>
          <p>${g.suggestion.plan}</p>
          <p class="fine">About ${g.suggestion.minutes} minutes</p>
          <a href="${g.suggestion.link}" target="_blank" rel="noopener">Open in the lab</a>
        </div>`,
    )}
  </div>`;
}

function samplesTab(rows) {
  const who = T.students.find((s) => s.alias === (T.pick || rows[0]?.alias));
  if (!who) return html`<p>Add students to read their work.</p>`;
  const samples = samplesFor(who);
  return html`<label class="field"
      ><span>Student</span
      ><select data-pick>
        ${T.students.map((s) => html`<option value="${s.alias}" ${s.alias === who.alias ? raw("selected") : ""}>${s.alias}</option>`)}
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
              ${s.selfReview ? html`<p class="fine"><strong>Self-review:</strong> ${CRITERIA.map((c) => `${c.name}: ${s.selfReview[c.id] || "—"}`).join(" · ")}</p>` : ""}
              ${(s.teacherReview || []).map((r) => html`<p class="fine"><strong>Teacher review ${String(r.t).slice(0, 10)}:</strong> ${CRITERIA.map((c) => `${c.name}: ${r[c.id]}`).join(" · ")} ${r.note || ""}</p>`)}
              ${flagged.length ? html`<p class="fine">Pattern flags: ${[...new Set(flagged.map((f) => T.patterns[f.id]?.name || f.id))].join("; ")}</p>` : ""}
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
    <p class="row-actions"><a class="btn" href="/access-teacher/packets/studio-speaking" target="_blank" rel="noopener">Speaking task cards (teacher copy)</a> <a class="btn" href="/access-teacher/packets/studio-writing" target="_blank" rel="noopener">Writing task cards (teacher copy)</a></p>
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
      <input type="text" id="scWho" placeholder="Student alias" aria-label="Student alias" /><button
        type="button"
        class="btn"
        data-score-save
      >
        Save to scoring sheet</button
      >${T.scores.length ? html`<button type="button" class="btn" data-score-csv>Download scoring sheet (${T.scores.length})</button>` : ""}
    </div>`;
}

function blueprintTab() {
  const b = T.blueprint;
  if (!b) return html`<p>The blueprint could not be loaded.</p>`;
  const n = (list, use) => list.filter((t) => t.keyUse === use || (t.keyUses || []).includes(use)).length;
  return html`<p class="fine">${b.notOfficial}</p>
    <h3>Kinds of practice</h3><div class="hub-grid">${b.purposes.map((p) => html`<article class="hub-card"><h4>${p.label}</h4><p>${p.description}</p>${p.features.length ? html`<ul class="fine">${p.features.map((f) => html`<li>${f}</li>`)}</ul>` : ""}</article>`)}</div>
    <h3>Coverage by Key Language Use</h3>
    <div class="lab-table-wrap"><table class="hub-table"><thead><tr><th scope="col">Key Language Use</th><th scope="col">Speaking tasks</th><th scope="col">Writing tasks</th><th scope="col">Missions</th><th scope="col">Meaning</th></tr></thead><tbody>
    ${b.keyLanguageUses.map((k) => html`<tr><th scope="row">${k.id}</th><td>${n(T.studio.speaking, k.id)}</td><td>${n(T.studio.writing, k.id)}</td><td>${n(T.studio.missions, k.id)}</td><td class="t-meta">${k.definition}</td></tr>`)}</tbody></table></div>
    <h3>Skills</h3><div class="hub-grid">${b.domains.map((d) => html`<article class="hub-card"><h4>${d.domain}</h4><p class="fine"><strong>Official ACCESS:</strong> ${d.officialFormat}</p><p class="fine"><strong>In this lab:</strong> ${d.labFormat}</p></article>`)}</div>
    <h3>Item-quality rules the lab enforces</h3><ul>${b.itemQuality.rules.map((r) => html`<li>${r.text} <span class="fine">(${r.level})</span></li>`)}</ul>
    <p class="fine">Framework: ${b.framework}. ${b.references.map((r) => html`<a href="${r.url}" target="_blank" rel="noopener">${r.title}</a> `)}</p>`;
}

async function draw() {
  const rows = classSummary(T.students);
  const body =
    T.tab === "groups"
      ? groupsTab()
      : T.tab === "samples"
        ? samplesTab(rows)
        : T.tab === "scoring"
          ? scoringTab()
          : T.tab === "blueprint"
            ? blueprintTab()
            : classTab(rows);
  root.innerHTML = toHtml(
    html`<section class="panel" aria-labelledby="evTitle">
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
}

function download(name, text, type = "text/csv") {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = Object.assign(document.createElement("a"), { href: url, download: name });
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

root.addEventListener("click", async (e) => {
  const t = e.target;
  const tab = t.closest("[data-tab]");
  if (tab) {
    T.tab = tab.dataset.tab;
    return draw();
  }
  const st = t.closest("[data-student]");
  if (st) {
    T.pick = T.pick === st.dataset.student ? "" : st.dataset.student;
    return draw();
  }
  if (t.closest("[data-add]")) {
    try {
      addStudent(document.getElementById("evCode").value);
      T.message = "Student added.";
    } catch (err) {
      T.message = err.message;
    }
    announce(T.message);
    return draw();
  }
  if (t.closest("[data-clear]")) {
    if (confirm("Remove all students from this browser?")) {
      T.students = [];
      T.pick = "";
      persist();
    }
    return draw();
  }
  if (t.closest("[data-csv]"))
    return download("class-language-evidence.csv", toCSV(classSummary(T.students)));
  if (t.closest("[data-print]")) return window.print();
  if (t.closest("[data-score-save]")) {
    const row = {
      who: document.getElementById("scWho").value.trim() || "Student",
      t: new Date().toISOString(),
      task: T.taskId || "",
    };
    for (const c of CRITERIA)
      row[c.id] = root.querySelector(`input[name="sc-${c.id}"]:checked`)?.value || "";
    T.scores.push(row);
    persist();
    T.message = "Saved to the scoring sheet.";
    return draw();
  }
  if (t.closest("[data-score-csv]"))
    return download(
      "practice-scoring-sheet.csv",
      `Student,Date,Task,${CRITERIA.map((c) => c.name).join(",")}\n${T.scores.map((r) => [r.who, r.t.slice(0, 10), r.task, ...CRITERIA.map((c) => r[c.id])].map((v) => `"${(/^[=+\-@]/.test(String(v)) ? "'" : "") + String(v).replace(/"/g, '""')}"`).join(",")).join("\n")}\n`,
    );
});
root.addEventListener("change", async (e) => {
  const t = e.target;
  if (t.matches("[data-pick]")) {
    T.pick = t.value;
    return draw();
  }
  if (t.matches("[data-task]")) {
    T.taskId = t.value;
    return draw();
  }
  if (t.id === "evFile") {
    for (const f of t.files) {
      try {
        addStudent(await f.text());
        T.message = "Added from file.";
      } catch (err) {
        T.message = `${f.name}: ${err.message}`;
      }
    }
    return draw();
  }
  if (t.matches("[data-audio]") && t.files[0]) {
    const url = URL.createObjectURL(t.files[0]);
    document.getElementById("evAudio").innerHTML =
      `<audio controls src="${url}" aria-label="Student recording"></audio>`;
  }
});

Promise.all([loadPatterns().catch(() => ({ patterns: {} })), loadExemplars().catch(() => [])]).then(
  ([p, x]) => {
    T.patterns = p.patterns || {};
    T.exemplars = x;
    draw();
  },
);
