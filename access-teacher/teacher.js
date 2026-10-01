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

const S = {
  band: "6-8",
  q: "",
  domain: "",
  level: "",
  type: "",
  picked: [],
  keys: new Set(),
  plTitle: "",
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

async function keyHTML(r) {
  const data = await loadDomain(r.band, r.domain);
  const a = data.levels[r.level].activities.find((x) => x.id === r.id);
  if (!a) return "";
  const answer = correctAnswerText(a);
  return html`<tr class="key-row">
    <td colspan="5">
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
    </td>
  </tr>`;
}

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
  const domains = Object.keys(index.bands[S.band].domains);
  const keyRows = new Map(
    await Promise.all(
      shown.filter((r) => S.keys.has(r.id)).map(async (r) => [r.id, await keyHTML(r)]),
    ),
  );
  const tests = index.tests.filter((t) => t.band === S.band);
  const weeks = road?.[S.band]?.weeks || [];
  const levelsOf = (d) => Object.keys(index.bands[S.band].domains[d].levels);

  root.innerHTML = toHtml(html`
    <section class="room-hero">
      <div>
        <p class="eyebrow">Teacher Hub · ${bandLabel(S.band)}</p>
        <h1 tabindex="-1">ACCESS Practice Lab — Teacher Hub</h1>
        <p class="lead">
          Find any activity, see its answer key and listening script, build a playlist link for
          Canvas or Google Classroom, and print packets.
        </p>
        <div class="band-switch" role="group" aria-label="Grade band">
          ${bands.map((b) => html`<button type="button" class="band-btn" data-hub-band="${b}" aria-pressed="${b === S.band}">${bandLabel(b)}</button>`)}
        </div>
      </div>
    </section>

    <section class="panel">
      <h2>Activities (${shown.length} of ${rows.length})</h2>
      <p class="fine">
        Tick activities to build a playlist. Students open one link and work through them in order.
        Tap “Key” for answers, scripts and sample answers.
      </p>
      <div class="hub-filters">
        <input
          type="search"
          placeholder="Search titles and skills…"
          value="${S.q}"
          data-f="q"
          aria-label="Search"
        />
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
      </div>
      <div class="lab-table-wrap">
        <table class="hub-table">
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
            ${shown.map(
              (r) =>
                html`<tr>
                    <td>
                      <input
                        type="checkbox"
                        data-pick="${r.id}"
                        ${S.picked.includes(r.id) ? "checked" : ""}
                        aria-label="Add ${r.title} to playlist"
                      />
                    </td>
                    <td class="t-title">
                      <a href="${actUrl(r)}" target="_blank" rel="noopener">${r.title}</a>
                      <div class="t-meta">
                        ${DOMAIN_META[r.domain]?.glyph || ""} ${r.domain} ·
                        ${TYPE_LABEL[r.type] || r.type}
                      </div>
                    </td>
                    <td class="col-skill t-meta">${r.skill}</td>
                    <td class="t-meta">${TIERS[r.level]?.name || r.level}</td>
                    <td>
                      <button type="button" class="ghost small" data-copy-url="${actUrl(r)}">
                        🔗 Copy
                      </button>
                      <button
                        type="button"
                        class="ghost small"
                        data-key="${r.id}"
                        aria-expanded="${S.keys.has(r.id)}"
                      >
                        🔑 Key
                      </button>
                    </td>
                  </tr>
                  ${keyRows.get(r.id) || ""}`,
            )}
          </tbody>
        </table>
      </div>
    </section>

    ${
      weeks.length
        ? html`<section class="panel">
            <h2>Road to ACCESS — weekly links</h2>
            <p class="fine">
              Post one link a week. Each opens that week's four activities in order, with a
              bilingual family prompt.
            </p>
            <div class="hub-grid">
              ${weeks.map(
                (w) =>
                  html`<div class="hub-card">
                    <h3>Week ${w.n} · ${w.taskType}</h3>
                    <span class="fine">${w.theme} · starts ${w.start}</span
                    ><a href="${BASE}/road/${w.n}?grades=${S.band}" target="_blank" rel="noopener"
                      >Open week</a
                    ><button
                      type="button"
                      class="ghost small"
                      data-copy-url="${BASE}/road/${w.n}?grades=${S.band}"
                    >
                      🔗 Copy link
                    </button>
                  </div>`,
              )}
            </div>
          </section>`
        : ""
    }

    <section class="panel">
      <h2>Practice tests</h2>
      <div class="hub-grid">
        ${tests.map(
          (t) =>
            html`<div class="hub-card">
              <h3>${t.title}</h3>
              <span class="fine">${t.kind} · ${t.items} questions · ~${t.minutes} min</span
              ><a href="${BASE}/test/${t.id}" target="_blank" rel="noopener">Open test</a
              ><button type="button" class="ghost small" data-copy-url="${BASE}/test/${t.id}">
                🔗 Copy link
              </button>
            </div>`,
        )}
      </div>
    </section>

    <section class="panel">
      <h2>Printable packets</h2>
      <p class="fine">
        Student packets have no answers. Teacher packets add answer keys, listening scripts and
        sample answers. Word files open in Google Docs.
      </p>
      <div class="hub-grid">
        ${domains.flatMap((d) =>
          levelsOf(d).map((l) => {
            const base = packetBase(S.band, d, l);
            return html`<div class="hub-card">
              <h3>${d} · ${TIERS[l]?.name || l}</h3>
              <a href="${BASE}/printables/${base}" target="_blank" rel="noopener"
                >🖨️ Student packet</a
              >
              <a href="${BASE}/printables/${base}.docx">📝 Student Word</a>
              <a href="/access-teacher/packets/${base}" target="_blank" rel="noopener"
                >🔑 Teacher packet</a
              >
              <a href="/access-teacher/packets/${base}.docx">📝 Teacher Word</a>
            </div>`;
          }),
        )}
      </div>
      <p>
        <a href="${DRIVE_FOLDER}" target="_blank" rel="noopener"
          >📁 Teacher packets folder in Google Drive</a
        >
      </p>
    </section>

    ${
      S.band === "6-8"
        ? html`<section class="panel">
            <h2>Google Forms (grades 6–8)</h2>
            <div class="hub-grid">
              ${Object.entries(shared.officialForms || {}).map(
                ([d, link]) =>
                  html`<div class="hub-card">
                    <h3>${d}</h3>
                    ${FORM_EDITORS[d] ? html`<a href="https://docs.google.com/forms/d/${FORM_EDITORS[d]}/edit" target="_blank" rel="noopener">✏️ Edit form</a><a href="https://docs.google.com/forms/d/${FORM_EDITORS[d]}/edit#responses" target="_blank" rel="noopener">📊 Responses</a>` : ""}<a
                      href="${link}"
                      target="_blank"
                      rel="noopener"
                      >🔗 Student link</a
                    >
                  </div>`,
              )}
            </div>
          </section>`
        : ""
    }

    <section class="panel">
      <h2>How to use it</h2>
      <ul>
        <li>
          <strong>20 minutes:</strong> students open their skill room and press “Next up”. The lab
          remembers where each student is on that device.
        </li>
        <li>
          <strong>45-minute stations:</strong> 10 minutes each in Listening, Reading, Speaking and
          Writing, then 5 minutes to print or share the Passport.
        </li>
        <li>
          <strong>Speaking:</strong> students record on the device, play back, and compare their
          answer with sample answers at three levels. Nothing is uploaded; ask students to play
          their best try for you.
        </li>
        <li>
          <strong>Different devices:</strong> students copy a progress code from their Passport and
          paste it on the new device.
        </li>
        <li>This is classroom practice inspired by ACCESS, not an official WIDA test or score.</li>
      </ul>
    </section>

    ${
      S.picked.length
        ? html`<div class="pl-bar" role="region" aria-label="Playlist">
            <strong>${S.picked.length} in playlist</strong>
            <input
              class="pl-title"
              type="text"
              placeholder="Playlist name (optional)"
              value="${S.plTitle}"
              data-pl-title
              aria-label="Playlist name"
            />
            <a class="btn btn-primary" href="${playUrl()}" target="_blank" rel="noopener"
              >▶ Preview</a
            >
            <button type="button" class="btn" data-copy-url="${playUrl()}">
              🔗 Copy playlist link
            </button>
            <button type="button" class="ghost" data-clear-pl style="color:inherit">Clear</button>
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
    clearTimeout(timer);
    timer = setTimeout(
      () => render().then(() => root.querySelector(`[data-f="${f}"]`)?.focus()),
      f === "q" ? 200 : 0,
    );
  }
  if (e.target.matches("[data-pl-title]")) {
    S.plTitle = e.target.value;
    root
      .querySelectorAll('.pl-bar [data-copy-url], .pl-bar a[href*="/play?"]')
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
  const band = t.closest("[data-hub-band]");
  if (band) {
    Object.assign(S, {
      band: band.dataset.hubBand,
      domain: "",
      level: "",
      picked: [],
      keys: new Set(),
    });
    return render();
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

render().catch((err) => {
  console.error(err);
  root.innerHTML =
    '<section class="panel"><h1>Could not load the Teacher Hub.</h1><p>Check your connection and reload.</p></section>';
});
