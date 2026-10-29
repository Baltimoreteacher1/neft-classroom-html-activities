// ACCESS Practice Lab — Teacher Hub. Reads the same content files as the
// student lab. This page sits behind the teacher password (/access-teacher/ is a
// teacher surface), which is why answer keys and listening scripts live here.
import {
  bandRows,
  loadDomain,
  loadIndex,
  loadRoad,
  loadShared,
} from "/access-practice-lab/src/content.js";
import { correctAnswerText } from "/access-practice-lab/src/grade.js";
import {
  BASE,
  DOMAIN_META,
  TIERS,
  announce,
  asList,
  bandLabel,
  copyText,
  html,
  icon,
  toHtml,
} from "/access-practice-lab/src/util.js";

const FORM_EDITORS = {
  Listening: "1bbbIlu-zadD6Pirqbp35U7oUo67Sxt8s1ymef0r6tZs",
  Reading: "1hxiN6IJB7qP4_bL0HD3NPh6XzqXpsqflCrm94IKxIRo",
  Writing: "11KhntaGKT_Pa_tl71sDAGDeLRgqoe3XB8E9K2mXfdpU",
  Speaking: null,
};
const DRIVE_FOLDER = "https://drive.google.com/drive/folders/1fqSJrL49plVHwkSEDFmhjPlaLYIdyl5G";
const TYPE_LABEL = {
  multipleChoice: "Choose",
  multiSelect: "Choose all",
  sort: "Sort",
  order: "Order",
  cloze: "Fill in",
  hotText: "Evidence",
  constructed: "Open response",
  worksheet: "Printable",
};

const PAGE = 25;
const S = {
  band: "6-8",
  tripGrade: "6-8",
  tripSkill: "Listening",
  q: "",
  domain: "",
  level: "",
  type: "",
  picked: [],
  keys: new Set(),
  plTitle: "",
  limit: PAGE,
};
const root = document.getElementById("hub");
const abs = (p) => new URL(p, location.origin).href;
const actUrl = (r) =>
  r.domain === "Model-Test"
    ? `${BASE}/Model-Test/${r.level.replace(/-([A-C])$/, "/$1")}/${r.id}`
    : `${BASE}/${r.domain}/${r.level}/${r.id}`;
const packetBase = (band, domain, level) =>
  band === "6-8" ? `${domain}-${level}` : `g3-5-${domain}-${level}`;
const playUrl = () =>
  `${BASE}/play?ids=${S.picked.join(",")}${S.plTitle ? `&t=${encodeURIComponent(S.plTitle)}` : ""}&grades=${S.band}`;

const TAG_TEACHER = html`<span class="th-tag is-teacher">${icon("lock")} Teacher only</span>`;
const TAG_STUDENT = html`<span class="th-tag is-student">${icon("user")} Student-facing</span>`;

async function keyHTML(r) {
  const data = await loadDomain(r.band, r.domain);
  const a = data.levels[r.level].activities.find((x) => x.id === r.id);
  if (!a) return "";
  const answer = correctAnswerText(a);
  return html`<tr class="key-row">
    <td colspan="5">
      <div class="th-key">
        <p class="th-key-head">${TAG_TEACHER} <span class="fine">Answer key for ${r.title}</span></p>
        ${a.script ? html`<p><strong>Listening script:</strong> ${asList(a.script).join(" ")}</p>` : ""}
        ${answer ? html`<p><strong>Answer:</strong> ${answer}</p>` : ""}
        ${
          a.models
            ? html`<p>
                <strong>Sample answers:</strong> ${["A", "B", "C"]
                  .filter((k) => a.models[k])
                  .map((k) => `${TIERS[k].name}: ${a.models[k]}`)
                  .join(" · ")}
              </p>`
            : ""
        }
        ${a.teacher?.use ? html`<p><strong>Use:</strong> ${a.teacher.use}</p>` : ""}
        ${a.teacher?.lower ? html`<p><strong>Lower support:</strong> ${a.teacher.lower}</p>` : ""}
        ${a.teacher?.challenge ? html`<p><strong>Challenge:</strong> ${a.teacher.challenge}</p>` : ""}
        ${a.teacher?.noTech ? html`<p><strong>No-tech option:</strong> ${a.teacher.noTech}</p>` : ""}
        ${(a.wida || []).length ? html`<p class="fine">WIDA: ${a.wida.join(" · ")}</p>` : ""}
      </div>
    </td>
  </tr>`;
}

const copyBtn = (url, label = "Copy link") =>
  html`<button type="button" class="btn small" data-copy-url="${url}">${icon("copy")} ${label}</button>`;
const openLink = (url, label) =>
  html`<a class="btn small" href="${url}" target="_blank" rel="noopener">${label} ${icon("external")}</a>`;

const GUIDE = [
  ["20 minutes:", "students open their skill room and press “Next up”. The lab remembers where each student is on that device."],
  ["45-minute stations:", "10 minutes each in Listening, Reading, Speaking and Writing, then 5 minutes to print or share the Passport."],
  ["Speaking:", "students record on the device, play back, and compare their answer with sample answers at three levels. Nothing is uploaded; ask students to play their best try for you."],
  ["Different devices:", "students copy a progress code from their Passport and paste it on the new device."],
];

async function render() {
  const [index, rows, road, shared] = await Promise.all([
    loadIndex(),
    bandRows(S.band),
    loadRoad(),
    loadShared().catch(() => ({})),
  ]);
  const bands = Object.keys(index.bands);
  const q = S.q.toLowerCase();
  const shown = rows.filter(
    (r) =>
      (!S.domain || r.domain === S.domain) &&
      (!S.level || r.level === S.level) &&
      (!S.type || r.type === S.type) &&
      (!q || `${r.title} ${r.skill} ${r.id}`.toLowerCase().includes(q)),
  );
  const visible = shown.slice(0, S.limit);
  const domains = Object.keys(index.bands[S.band].domains);
  const keyRows = new Map(
    await Promise.all(
      visible.filter((r) => S.keys.has(r.id)).map(async (r) => [r.id, await keyHTML(r)]),
    ),
  );
  const tests = index.tests.filter((t) => t.band === S.band);
  const weeks = road?.[S.band]?.weeks || [];
  const levelsOf = (d) => Object.keys(index.bands[S.band].domains[d].levels);
  const forms = S.band === "6-8" ? Object.entries(shared.officialForms || {}) : [];
  const packetCount = domains.reduce((n, d) => n + levelsOf(d).length, 0);
  const cats = [
    ["#activities", "list", "Activities", rows.length, "Search, answer keys, playlist builder", "both"],
    ["#weekly", "road", "Road to ACCESS", weeks.length, "One link per week", "student"],
    ["#tests", "tests", "Practice tests", tests.length, "Full tests and short minis", "student"],
    ["#printables", "print", "Printable packets", packetCount, "Student and teacher PDFs and Word files", "both"],
    ...(forms.length ? [["#forms", "evidence", "Google Forms", forms.length, "Grades 6–8 response forms", "both"]] : []),
    ["#guide", "bulb", "How to use it", GUIDE.length + 1, "Station ideas and routines", "teacher"],
  ];
  const tag = (kind) => (kind === "teacher" ? TAG_TEACHER : kind === "student" ? TAG_STUDENT : html`${TAG_STUDENT}${TAG_TEACHER}`);

  root.innerHTML = toHtml(html`
    <section class="th-cats" aria-label="Resource categories">
      ${cats.map(([href, ico, title, n, text, kind]) => html`<a class="th-cat" href="${href}"><span class="th-tile">${icon(ico)}</span><span class="th-cat-body"><strong>${title}</strong><span>${text}</span><span class="th-cat-tags">${tag(kind)}</span></span><span class="th-cat-n">${n}</span></a>`)}
    </section>

    <section class="th-sec" id="familyTrip" aria-labelledby="familyTripTitle">
      <header class="th-sec-head"><div><h2 id="familyTripTitle">Assign a Family Trip</h2>
        <p class="fine">Choose a grade band and skill, then copy a student-facing link. Progress stays on the family’s device.</p></div>${TAG_STUDENT}</header>
      <div class="th-trip-link">
        <label class="field"><span>Grade band</span><select data-trip-grade><option value="3-5" ${S.tripGrade === "3-5" ? "selected" : ""}>Grades 3–5</option><option value="6-8" ${S.tripGrade === "6-8" ? "selected" : ""}>Grades 6–8</option></select></label>
        <label class="field"><span>Skill</span><select data-trip-skill>${["Listening", "Speaking", "Reading", "Writing"].map((d) => html`<option value="${d}" ${S.tripSkill === d ? "selected" : ""}>${d}</option>`)}</select></label>
        <button type="button" class="btn btn-primary" data-trip-copy>Copy Family Trip link</button>
        <a class="btn small" data-trip-open href="${BASE}/family/trip?grades=${S.tripGrade}&skill=${S.tripSkill}">Open link</a>
      </div>
      <p class="fine" role="status" data-trip-status aria-live="polite"></p>
      <p><a class="btn small" href="${BASE}/paper-passport/language-passport-teacher-key.pdf" target="_blank" rel="noopener">Open teacher country key (PDF)</a></p>
    </section>

    <section class="th-sec" id="activities" aria-labelledby="actTitle">
      <header class="th-sec-head">
        <div>
          <h2 id="actTitle">Activities <span class="th-count">(${shown.length} of ${rows.length})</span></h2>
          <p class="fine">
            Tick activities to build a playlist. Students open one link and work through them in order.
            Tap “Key” for answers, scripts and sample answers.
          </p>
        </div>
        <div class="th-band">
          <span class="th-band-label" id="bandLabel">Grade band</span>
          <div class="band-switch" role="group" aria-labelledby="bandLabel">
            ${bands.map((b) => html`<button type="button" class="band-btn" data-hub-band="${b}" aria-pressed="${b === S.band}">${bandLabel(b)}</button>`)}
          </div>
        </div>
      </header>
      <div class="hub-filters">
        <label class="field th-search"><span class="visually-hidden">Search</span>
          <input type="search" placeholder="Search titles and skills…" value="${S.q}" data-f="q" aria-label="Search" />
        </label>
        <select data-f="domain" aria-label="Skill">
          <option value="">All skills</option>
          ${domains.map((d) => html`<option value="${d}" ${S.domain === d ? "selected" : ""}>${d}</option>`)}
        </select>
        <select data-f="level" aria-label="Level">
          <option value="">All levels</option>
          ${[...new Set(domains.flatMap(levelsOf))].map((l) => html`<option value="${l}" ${S.level === l ? "selected" : ""}>${TIERS[l]?.name || l}</option>`)}
        </select>
        <select data-f="type" aria-label="Type">
          <option value="">All types</option>
          ${Object.entries(TYPE_LABEL).map(([k, v]) => html`<option value="${k}" ${S.type === k ? "selected" : ""}>${v}</option>`)}
        </select>
        <button type="button" class="btn small" data-reset-filters>Reset filters</button>
      </div>
      <div class="lab-table-wrap">
        <table class="hub-table th-table">
          <thead>
            <tr>
              <th scope="col"><span class="visually-hidden">Add</span></th>
              <th scope="col">Activity</th>
              <th scope="col" class="col-skill">Skill</th>
              <th scope="col">Level</th>
              <th scope="col">Links</th>
            </tr>
          </thead>
          <tbody>
            ${visible.map(
              (r) =>
                html`<tr class="d-${r.domain.toLowerCase()}">
                    <td class="th-pick-cell">
                      <label class="th-pick"
                        ><input
                          type="checkbox"
                          data-pick="${r.id}"
                          ${S.picked.includes(r.id) ? "checked" : ""}
                          aria-label="Add ${r.title} to playlist"
                      /></label>
                    </td>
                    <td class="t-title">
                      <a href="${actUrl(r)}" target="_blank" rel="noopener">${r.title}</a>
                      <div class="t-meta">
                        <span class="th-dom">${icon(DOMAIN_META[r.domain]?.icon || "star")} ${r.domain}</span> · ${TYPE_LABEL[r.type] || r.type}
                      </div>
                    </td>
                    <td class="col-skill t-meta">${r.skill}</td>
                    <td class="t-meta"><span class="th-level">${TIERS[r.level]?.name || r.level}</span></td>
                    <td class="th-links">
                      <button type="button" class="ghost small" data-copy-url="${actUrl(r)}">${icon("copy")} Copy</button>
                      <button
                        type="button"
                        class="ghost small"
                        data-key="${r.id}"
                        aria-expanded="${S.keys.has(r.id)}"
                      >${icon("lock")} Key</button>
                    </td>
                  </tr>
                  ${keyRows.get(r.id) || ""}`,
            )}
          </tbody>
        </table>
      </div>
      <div class="th-more">
        <p class="fine" role="status">Showing ${visible.length} of ${shown.length} activities.</p>
        ${shown.length > visible.length ? html`<button type="button" class="btn" data-more>Show ${Math.min(PAGE, shown.length - visible.length)} more</button>` : ""}
      </div>
    </section>

    ${
      weeks.length
        ? html`<section class="th-sec" id="weekly" aria-labelledby="weeklyTitle">
            <header class="th-sec-head"><div><h2 id="weeklyTitle">Road to ACCESS — weekly links</h2>
            <p class="fine">
              Post one link a week. Each opens that week's four activities in order, with a
              bilingual family prompt.
            </p></div>${TAG_STUDENT}</header>
            <div class="th-grid th-weeks">
              ${weeks.map(
                (w) =>
                  html`<article class="th-card">
                    <span class="th-week-n">Week ${w.n}</span>
                    <h3>${w.taskType}</h3>
                    <p class="fine">${w.theme} · starts ${w.start}</p>
                    <div class="th-card-actions">${openLink(`${BASE}/road/${w.n}?grades=${S.band}`, "Open week")}${copyBtn(`${BASE}/road/${w.n}?grades=${S.band}`)}</div>
                  </article>`,
              )}
            </div>
          </section>`
        : ""
    }

    <section class="th-sec" id="tests" aria-labelledby="testsTitle">
      <header class="th-sec-head"><div><h2 id="testsTitle">Practice tests</h2></div>${TAG_STUDENT}</header>
      <div class="th-grid">
        ${tests.map(
          (t) =>
            html`<article class="th-card">
              <h3>${t.title}</h3>
              <p class="fine">${t.kind} · ${t.items} questions · ~${t.minutes} min</p>
              <div class="th-card-actions">${openLink(`${BASE}/test/${t.id}`, "Open test")}${copyBtn(`${BASE}/test/${t.id}`)}</div>
            </article>`,
        )}
      </div>
    </section>

    <section class="th-sec" id="printables" aria-labelledby="printTitle">
      <header class="th-sec-head"><div><h2 id="printTitle">Printable packets</h2>
      <p class="fine">
        Student packets have no answers. Teacher packets add answer keys, listening scripts and
        sample answers. Word files open in Google Docs.
      </p></div></header>
      <p class="th-key-legend"><span class="th-swatch is-student"></span> Student packets have no answers. <span class="th-swatch is-teacher"></span> Teacher packets add answer keys. ${TAG_STUDENT} ${TAG_TEACHER}</p>
      <div class="th-pgroups">
        ${domains.map(
          (d) => html`<article class="th-pgroup d-${d.toLowerCase()}">
            <header><span class="th-tile">${icon(DOMAIN_META[d]?.icon || "star")}</span><h3>${d}</h3></header>
            <div class="th-packets">
              ${levelsOf(d).map((l) => {
                const base = packetBase(S.band, d, l);
                return html`<div class="th-packet">
                  <h4>${TIERS[l]?.name || l}</h4>
                  <div class="th-pk-row">
                    <div class="th-pk is-student">
                      <span class="th-pk-label">Student</span>
                      <a class="btn small" href="${BASE}/printables/${base}" target="_blank" rel="noopener">${icon("print")} Student packet</a>
                      <a class="btn small" href="${BASE}/printables/${base}.docx">${icon("download")} Student Word</a>
                    </div>
                    <div class="th-pk is-teacher">
                      <span class="th-pk-label">${icon("lock")} Teacher · answers</span>
                      <a class="btn small" href="/access-teacher/packets/${base}" target="_blank" rel="noopener">${icon("print")} Teacher packet</a>
                      <a class="btn small" href="/access-teacher/packets/${base}.docx">${icon("download")} Teacher Word</a>
                    </div>
                  </div>
                </div>`;
              })}
            </div>
          </article>`,
        )}
      </div>
      <p class="th-drive">
        <a class="btn" href="${DRIVE_FOLDER}" target="_blank" rel="noopener">${icon("external")} Teacher packets folder in Google Drive</a>
      </p>
    </section>

    ${
      forms.length
        ? html`<section class="th-sec" id="forms" aria-labelledby="formsTitle">
            <header class="th-sec-head"><div><h2 id="formsTitle">Google Forms (grades 6–8)</h2></div></header>
            <div class="th-grid">
              ${forms.map(
                ([d, link]) =>
                  html`<article class="th-card d-${d.toLowerCase()}">
                    <h3><span class="th-dom">${icon(DOMAIN_META[d]?.icon || "star")} ${d}</span></h3>
                    <div class="th-pk is-student">
                      <span class="th-pk-label">Student</span>
                      <a class="btn small" href="${link}" target="_blank" rel="noopener">${icon("external")} Student link</a>
                    </div>
                    ${FORM_EDITORS[d] ? html`<div class="th-pk is-teacher">
                      <span class="th-pk-label">${icon("lock")} Teacher · edit and results</span>
                      <a class="btn small" href="https://docs.google.com/forms/d/${FORM_EDITORS[d]}/edit" target="_blank" rel="noopener">${icon("writing")} Edit form</a>
                      <a class="btn small" href="https://docs.google.com/forms/d/${FORM_EDITORS[d]}/edit#responses" target="_blank" rel="noopener">${icon("growth")} Responses</a>
                    </div>` : ""}
                  </article>`,
              )}
            </div>
          </section>`
        : ""
    }

    <section class="th-sec" id="guide" aria-labelledby="guideTitle">
      <header class="th-sec-head"><div><h2 id="guideTitle">How to use it</h2></div>${TAG_TEACHER}</header>
      <ol class="th-guide">
        ${GUIDE.map(([lead, text]) => html`<li><div><strong>${lead}</strong> ${text}</div></li>`)}
        <li><div>This is classroom practice inspired by ACCESS, not an official WIDA test or score.</div></li>
      </ol>
    </section>

    ${
      S.picked.length
        ? html`<div class="th-plbar" role="region" aria-label="Playlist">
            <strong>${icon("list")} ${S.picked.length} in playlist</strong>
            <input
              class="pl-title"
              type="text"
              placeholder="Playlist name (optional)"
              value="${S.plTitle}"
              data-pl-title
              aria-label="Playlist name"
            />
            <a class="btn btn-primary" href="${playUrl()}" target="_blank" rel="noopener"
              >${icon("play")} Preview</a
            >
            <button type="button" class="btn" data-copy-url="${playUrl()}">
              ${icon("copy")} Copy playlist link
            </button>
            <button type="button" class="ghost" data-clear-pl>Clear</button>
          </div>`
        : ""
    }
  `);
}

let timer = 0;
root.addEventListener("input", (e) => {
  const f = e.target.dataset.f;
  if (f) {
    S[f] = e.target.value;
    S.limit = PAGE;
    clearTimeout(timer);
    timer = setTimeout(
      () => render().then(() => root.querySelector(`[data-f="${f}"]`)?.focus()),
      f === "q" ? 200 : 0,
    );
  }
  if (e.target.matches("[data-pl-title]")) {
    S.plTitle = e.target.value;
    root
      .querySelectorAll('.th-plbar [data-copy-url], .th-plbar a[href*="/play?"]')
      .forEach((el) =>
        el.tagName === "A" ? (el.href = playUrl()) : (el.dataset.copyUrl = playUrl()),
      );
  }
});
root.addEventListener("change", (e) => {
  if (e.target.matches("select[data-f]")) return;
  const id = e.target.dataset.pick;
  if (!id) return;
  S.picked = e.target.checked ? [...S.picked, id] : S.picked.filter((x) => x !== id);
  render();
});
root.addEventListener("click", (e) => {
  const t = e.target;
  if (t.closest("[data-trip-copy]")) {
    const url = new URL(`${BASE}/family/trip`, location.origin);
    url.searchParams.set("grades", root.querySelector("[data-trip-grade]")?.value || "6-8");
    url.searchParams.set("skill", root.querySelector("[data-trip-skill]")?.value || "Listening");
    copyText(url.href).then((ok) => {
      const status = root.querySelector("[data-trip-status]");
      if (status) status.textContent = ok ? "Family Trip link copied." : "Copy was unavailable. Use the Open link button.";
    });
    return;
  }
  if (t.closest("[data-reset-filters]")) {
    Object.assign(S, { q: "", domain: "", level: "", type: "", limit: PAGE });
    render().then(() => root.querySelector('[data-f="q"]')?.focus());
    return;
  }
  const band = t.closest("[data-hub-band]");
  if (band) {
    Object.assign(S, {
      band: band.dataset.hubBand,
      domain: "",
      level: "",
      limit: PAGE,
      picked: [],
      keys: new Set(),
    });
    return render();
  }
  if (t.closest("[data-more]")) {
    const from = S.limit;
    S.limit += PAGE;
    return render().then(() => root.querySelectorAll("[data-pick]")[from]?.focus());
  }
  const copy = t.closest("[data-copy-url]");
  if (copy) return copyText(abs(copy.dataset.copyUrl));
  const key = t.closest("[data-key]");
  if (key) {
    const id = key.dataset.key;
    S.keys.has(id) ? S.keys.delete(id) : S.keys.add(id);
    return render();
  }
  if (t.closest("[data-clear-pl]")) {
    S.picked = [];
    announce("Playlist cleared.");
    render();
  }
});
root.addEventListener("change", (e) => {
  if (!e.target.matches("[data-trip-grade], [data-trip-skill]")) return;
  if (e.target.matches("[data-trip-grade]")) S.tripGrade = e.target.value;
  if (e.target.matches("[data-trip-skill]")) S.tripSkill = e.target.value;
  const grade = S.tripGrade;
  const skill = S.tripSkill;
  const link = root.querySelector("[data-trip-open]");
  if (link) link.href = `${BASE}/family/trip?grades=${encodeURIComponent(grade)}&skill=${encodeURIComponent(skill)}`;
});

render().catch((err) => {
  console.error(err);
  root.innerHTML =
    '<section class="panel"><h1>Could not load the Teacher Hub.</h1><p>Check your connection and reload.</p></section>';
});
