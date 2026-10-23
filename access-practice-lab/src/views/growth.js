// Language Growth Map: what the learner's own work shows, by WIDA language dimension, with the
// supports they used kept visibly separate. Every number comes from the evidence ledger; nothing is
// estimated from how many activities were finished, and nothing here is combined into one number or turned into a percentage of "development".
import { crumbsHTML } from "../components.js";
import {
  focusAreas,
  buildProfile,
  featureValue,
  firstAttempts,
  loadLedger,
  MIN_POINTS,
} from "../lang/ledger.js";
import { loadPatterns } from "../content.js";
import { allRecords } from "../store.js";
import { buildSkillGraph } from "../lang/skill-graph.js";
import { ACCESS_LAB_FLAGS } from "../lang/feature-flags.js";
import { BASE, CORE_DOMAINS, DOMAIN_META, html } from "../util.js";

const WORD = { improving: "growing", steady: "steady", slipping: "changing — worth a look" };
const DIM_BLURB = {
  Discourse:
    "Organizing a whole response: moves of the genre, linking ideas, evidence from sources.",
  Sentence: "Building sentences: more than one idea in a sentence, and control of patterns.",
  "Word/Phrase": "Choosing words: precise subject words and academic vocabulary.",
};
const COMP_SKILL = {
  "main-idea": "Main idea",
  detail: "Detail",
  inference: "Inference",
  evidence: "Evidence",
  vocabulary: "Vocabulary",
  purpose: "Purpose",
  synthesis: "Synthesis",
};

function spark(values, label) {
  if (values.length < 2) return "";
  const w = 120;
  const h = 28;
  const lo = Math.min(...values);
  const hi = Math.max(...values);
  const pts = values
    .map(
      (v, i) =>
        `${Math.round((i / (values.length - 1)) * w)},${Math.round(h - 3 - ((v - lo) / (hi - lo || 1)) * (h - 6))}`,
    )
    .join(" ");
  return html`<svg
    class="spark"
    viewBox="0 0 ${w} ${h}"
    role="img"
    aria-label="${label}: ${values.map((v) => Math.round(v * 10) / 10).join(", ")}"
  >
    <polyline points="${pts}" fill="none" stroke="currentColor" stroke-width="2" />
  </svg>`;
}

function featureCard(key, f, entries) {
  const series = firstAttempts(entries)
    .map((e) => featureValue(e, key))
    .filter((v) => v != null);
  const t = f.all;
  const dep = f.dependence;
  return html`<div class="card dim-card">
    <h4>${f.label}</h4>
    ${series.length ? spark(series, f.label) : ""}
    <p class="fine">
      ${t.status === "ok" ? html`Across your first attempts this is <strong>${WORD[t.direction]}</strong> (${series.length} attempts).` : `Not enough evidence yet — ${t.n} of ${MIN_POINTS} first attempts.`}
    </p>
    ${dep.status === "ok" ? html`<p class="fine ${dep.dependent ? "todo" : "ok"}">${dep.dependent ? "Lower when you work without supports — keep practicing it on your own." : "Similar with and without supports."}</p>` : html`<p class="fine">Support check needs ${MIN_POINTS}+ attempts with and without help.</p>`}
  </div>`;
}

export async function render(ctx) {
  const band = ctx.band;
  const ledger = loadLedger();
  const patterns = (await loadPatterns().catch(() => ({ patterns: {} }))).patterns || {};
  const pname = (id) => (Object.hasOwn(patterns, id) ? patterns[id].name : id);
  const entries = ledger.entries.filter((e) => e.band === band);
  const literacyRecords = Object.fromEntries(allRecords().filter((r) => r.band === band && ["Listening", "Reading"].includes(r.domain)).map((r) => [`${r.band === "3-5" ? "g3-5:" : ""}${r.domain}:${r.level}`, r]));
  const skillGraph = buildSkillGraph(entries, literacyRecords);
  const p = buildProfile(entries, { band });
  const focus = focusAreas(p);
  const records = allRecords().filter((r) => r.band === band);
  const stamps = Object.fromEntries(
    CORE_DOMAINS.map((d) => [
      d,
      records
        .filter((r) => r.domain === d)
        .reduce((n, r) => n + (r.record.complete?.length || 0), 0),
    ]),
  );
  const dims = ["Discourse", "Sentence", "Word/Phrase"];
  const sp = p.speaking;
  return {
    title: "Language Growth Map",
    html: html`${crumbsHTML([
        ["Lab", `${BASE}/?grades=${band}`],
        ["Passport", `${BASE}/passport?grades=${band}`],
        ["Language Growth Map", null],
      ])}
      <section class="room-hero" style="--room:#1f766f">
        <div>
          <span class="badge">Evidence from your own work</span>
          <h1 tabindex="-1">🗺️ Language Growth Map</h1>
          <p class="lead">
            What your writing, speaking and missions show — and which kind of help you used. No
            scores: only evidence and next steps.
          </p>
        </div>
      </section>
      <section class="panel">
        <h2>Your evidence so far</h2>
        <dl class="pp-stats">
          <div>
            <dt>First attempts</dt>
            <dd>${p.firstAttempts}</dd>
          </div>
          <div>
            <dt>On your own</dt>
            <dd>${p.independentFirstAttempts}</dd>
          </div>
          <div>
            <dt>Revisions</dt>
            <dd>${p.revisions}</dd>
          </div>
          <div>
            <dt>Detective tries</dt>
            <dd>${p.detective}</dd>
          </div>
        </dl>
        ${p.firstAttempts === 0 ? html`<p>No studio work yet. Try the <a href="${BASE}/write?grades=${band}">Writing Studio</a>, <a href="${BASE}/speak?grades=${band}">Speaking Studio</a> or a <a href="${BASE}/missions?grades=${band}">mission</a> and your growth map will start to fill in.</p>` : html`<p class="fine">A trend appears after ${MIN_POINTS} first attempts. “On your own” means no frames, word bank or model were open.</p>`}
      </section>
      ${ACCESS_LAB_FLAGS.skillGraphEnabled ? html`<section class="panel" aria-labelledby="skillGraphHeading">
        <h2 id="skillGraphHeading">Academic-language skills</h2>
        <p class="fine">Practice profile from your saved work. A skill is shown as demonstrated only after repeated evidence on different tasks. This is not an ACCESS score or proficiency level.</p>
        ${["Listening", "Reading", "Speaking", "Writing"].map((domain) => {
          const skills = skillGraph.filter((s) => s.domain === domain);
          const ready = skills.filter((s) => s.status !== "insufficient");
          return html`<details class="skill-domain" ${ready.length ? "" : ""}>
            <summary>${domain} <span class="fine">${ready.length} skill${ready.length === 1 ? "" : "s"} with evidence</span></summary>
            <ul class="evidence-list">
              ${skills.map((s) => html`<li><strong>${s.name}</strong><span>${s.status === "insufficient" ? "Collecting evidence" : s.status === "demonstrated" ? "Demonstrated independently" : s.status === "supported" ? "Demonstrated with support" : "Currently developing"}${s.evidenceCount ? ` · ${s.evidenceCount} evidence points` : ""}</span></li>`)}
            </ul>
          </details>`;
        })}
        <p class="fine">Suggested next step: choose a skill marked “Currently developing” or collect more evidence where the map says it is still collecting evidence.</p>
      </section>` : ""}
      ${
        focus.length
          ? html`<section class="panel">
              <h2>Where to focus next</h2>
              <ol>
                ${focus.map((f) => html`<li>${f.reason} ${f.kind === "pattern" ? html`<a href="${BASE}/detective/${f.id}?grades=${band}">Practice this pattern</a>` : ""}</li>`)}
              </ol>
            </section>`
          : ""
      }
      ${dims.map(
        (d) =>
          html`<section class="panel growth-dimensions-panel">
            <h2>${d}</h2>
            <p class="fine">${DIM_BLURB[d]}</p>
            <div class="dimension-bars">
              ${Object.entries(p.features)
                .filter(([, f]) => f.dimension === d)
                .map(([k, f]) => featureCard(k, f, entries))}
            </div>
          </section>`,
      )}
      <section class="panel">
        <h2>Patterns in your language</h2>
        ${
          p.errors.length
            ? html`<ul class="evidence-list">
                ${p.errors.slice(0, 6).map((e) => html`<li><a href="${BASE}/detective/${e.id}?grades=${band}">${pname(e.id)}</a><span>${e.mastered ? "✓ Used correctly on your own in new writing" : `in ${e.drafts} recent piece${e.drafts === 1 ? "" : "s"}`}${e.transfer ? ` · ${e.transfer.transferIndependent} independent transfer${e.transfer.transferIndependent === 1 ? "" : "s"}` : ""}</span></li>`)}
              </ul>`
            : html`<p>No repeating pattern errors found in your recent work.</p>`
        }
      </section>
      ${
        p.comprehension.total
          ? html`<section class="panel">
              <h2>Listening and reading questions</h2>
              <ul class="evidence-list">
                ${Object.entries(p.comprehension.bySkill).map(([k, v]) => html`<li><span>${COMP_SKILL[k] || k}</span><span>${v.ok} of ${v.n} right on the first try${v.independentN ? ` · ${v.independentOk} of ${v.independentN} without help` : ""}</span></li>`)}
              </ul>
              ${p.comprehension.topTrap ? html`<p class="fine">Wrong answers you chose most: the “${p.comprehension.topTrap.type}” kind (${p.comprehension.topTrap.count}). Reread the question, then find the sentence that proves your answer.</p>` : ""}
            </section>`
          : ""
      }
      ${
        sp.n
          ? html`<section class="panel">
              <h2>Speaking</h2>
              <p class="fine">
                From ${sp.n} recorded first attempt${sp.n === 1 ? "" : "s"}, measured on this device
                (time speaking and pauses — not pronunciation).
              </p>
              <ul class="evidence-list">
                <li>
                  <span>Time speaking</span
                  ><span
                    >${sp.speechSeconds.status === "ok" ? WORD[sp.speechSeconds.direction] : `not enough evidence yet (${sp.speechSeconds.n} of ${MIN_POINTS})`}</span
                  >
                </li>
                <li>
                  <span>Longest stretch without pausing</span
                  ><span
                    >${sp.longestRun.status === "ok" ? WORD[sp.longestRun.direction] : "not enough evidence yet"}</span
                  >
                </li>
                <li>
                  <span>Pauses per 30 seconds</span
                  ><span
                    >${sp.pausesPer30.status === "ok" ? WORD[sp.pausesPer30.direction] : "not enough evidence yet"}</span
                  >
                </li>
              </ul>
            </section>`
          : ""
      }
      <section class="panel">
        <h2>Practice volume</h2>
        <p class="fine">
          Activities finished in each skill room. This shows how much you practiced, not how well.
        </p>
        <div class="domain-grid">
          ${CORE_DOMAINS.map(
            (d) =>
              html`<div class="card domain-growth-card">
                <h3>${DOMAIN_META[d].glyph} ${DOMAIN_META[d].room}</h3>
                <p><strong>${stamps[d]}</strong> activities finished</p>
                <a href="${BASE}/${d}/A?grades=${band}" class="btn ghost small">Continue ${d}</a>
              </div>`,
          )}
        </div>
      </section>
      <p class="disclaimer">
        Classroom practice evidence. It is not a WIDA proficiency level or an ACCESS score, and it
        only describes what these tasks showed.
      </p>`,
  };
}
