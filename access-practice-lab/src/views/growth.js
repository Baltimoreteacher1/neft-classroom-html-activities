// Language Growth Map: what the learner's own work shows, by WIDA language dimension, with the
// supports they used kept visibly separate. Every number comes from the evidence ledger; nothing is
// estimated from how many activities were finished, and nothing here is combined into one number or turned into a percentage of "development".
import { crumbsHTML, domainGlyph } from "../components.js";
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
import { SUPPORT_TIERS, supportOverride } from "../lang/adapt.js";
import { ACCESS_LAB_FLAGS } from "../lang/feature-flags.js";
import { ART, BASE, CORE_DOMAINS, DOMAIN_META, html, icon } from "../util.js";

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

const DIM_ICON = { Discourse: "list", Sentence: "writing", "Word/Phrase": "words" };
const SKILL_STATUS = {
  insufficient: ["Collecting evidence", "clock", "is-none"],
  demonstrated: ["Demonstrated independently", "check", "is-ind"],
  supported: ["Demonstrated with support", "bulb", "is-sup"],
  developing: ["Currently developing", "growth", "is-dev"],
};
const skillStatus = (status) => SKILL_STATUS[status] || SKILL_STATUS.developing;

function spark(values, label) {
  if (values.length < 2) return "";
  const w = 120;
  const h = 32;
  const lo = Math.min(...values);
  const hi = Math.max(...values);
  const point = (v, i) => [
    Math.round((i / (values.length - 1)) * (w - 8)) + 4,
    Math.round(h - 5 - ((v - lo) / (hi - lo || 1)) * (h - 10)),
  ];
  const pts = values.map(point);
  const [lx, ly] = pts.at(-1);
  return html`<svg
    class="spark"
    viewBox="0 0 ${w} ${h}"
    role="img"
    aria-label="${label}: ${values.map((v) => Math.round(v * 10) / 10).join(", ")}"
  >
    <polyline points="${pts.map((p) => p.join(",")).join(" ")}" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
    <circle cx="${lx}" cy="${ly}" r="3.5" fill="currentColor" />
  </svg>`;
}

function featureCard(key, f, entries) {
  const series = firstAttempts(entries)
    .map((e) => featureValue(e, key))
    .filter((v) => v != null);
  const t = f.all;
  const dep = f.dependence;
  return html`<div class="grow-feature">
    <h4>${f.label}</h4>
    ${series.length ? spark(series, f.label) : ""}
    ${t.status === "ok" ? "" : html`<div class="bar mini" aria-hidden="true"><i style="width:${Math.min(100, Math.round((t.n / MIN_POINTS) * 100))}%"></i></div>`}
    <p class="fine">
      ${t.status === "ok" ? html`Across your first attempts this is <strong>${WORD[t.direction]}</strong> (${series.length} attempts).` : `Not enough evidence yet — ${t.n} of ${MIN_POINTS} first attempts.`}
    </p>
    ${dep.status === "ok" ? html`<p class="grow-dep ${dep.dependent ? "is-low" : "is-ok"}">${icon(dep.dependent ? "flag" : "check")} ${dep.dependent ? "Lower when you work without supports — keep practicing it on your own." : "Similar with and without supports."}</p>` : html`<p class="fine">Support check needs ${MIN_POINTS}+ attempts with and without help.</p>`}
  </div>`;
}

function supportChoiceHTML(ctx) {
  const current = supportOverride(ctx.prefs);
  const chosen = SUPPORT_TIERS.find((s) => s.id === current);
  const choices = [...SUPPORT_TIERS.map((s) => [s.id, s.id === "independent" ? s.label : `${s.label} · ${s.id}`]), ["", "Follow my evidence"]];
  return html`<section class="panel grow-support" aria-labelledby="supportChoiceTitle">
    <h2 id="supportChoiceTitle">How much support do you want?</h2>
    <p class="fine">The lab suggests support from your own work. You can choose instead with one click; it is saved on this device and changes the help missions suggest first.</p>
    <div class="grow-choices" role="group" aria-label="Support choice">
      ${choices.map(([id, label]) => html`<button type="button" class="cat-chip" id="support-${id || "evidence"}" data-support-choice="${id}" aria-pressed="${id === current ? "true" : "false"}">${id === current ? icon("check") : ""}${label}</button>`)}
    </div>
    <p class="fine" role="status">${chosen ? `Your choice: ${chosen.label} support — ${chosen.detail}.` : "Following your evidence: each mission says which help it opens and why."} Support choices are not WIDA levels or scores.</p>
  </section>`;
}

function skillGraphHTML(skillGraph) {
  return html`<section class="panel" aria-labelledby="skillGraphHeading">
    <h2 id="skillGraphHeading">Academic-language skills</h2>
    <p class="fine">Practice profile from your saved work. A skill is shown as demonstrated only after repeated evidence on different tasks. This is not an ACCESS score or proficiency level.</p>
    <div class="grow-skills">
    ${["Listening", "Reading", "Speaking", "Writing"].map((domain) => {
      const skills = skillGraph.filter((s) => s.domain === domain);
      const ready = skills.filter((s) => s.status !== "insufficient");
      return html`<details class="grow-skill-domain d-${domain.toLowerCase()}">
        <summary><span class="prog-tile sm">${domainGlyph(domain)}</span><span class="grow-skill-name">${domain}</span><span class="fine">${ready.length} skill${ready.length === 1 ? "" : "s"} with evidence</span></summary>
        <ul class="grow-skill-list">
          ${skills.map((s) => {
            const [word, ico, cls] = skillStatus(s.status);
            return html`<li><strong>${s.name}</strong><span class="grow-status ${cls}">${icon(ico)} ${word}</span>${s.evidenceCount ? html`<span class="fine">${s.evidenceCount} evidence points</span>` : ""}</li>`;
          })}
        </ul>
      </details>`;
    })}
    </div>
    <p class="fine">Suggested next step: choose a skill marked “Currently developing” or collect more evidence where the map says it is still collecting evidence.</p>
  </section>`;
}

const rowsHTML = (items) =>
  html`<ul class="grow-rows">${items.map(([a, b]) => html`<li><span>${a}</span><span>${b}</span></li>`)}</ul>`;

export async function render(ctx) {
  const band = ctx.band;
  const ledger = loadLedger();
  const patterns = (await loadPatterns().catch(() => ({ patterns: {} }))).patterns || {};
  const pname = (id) => (Object.hasOwn(patterns, id) ? patterns[id].name : id);
  const entries = ledger.entries.filter((e) => e.band === band);
  // evidenceFromPracticeRecords reads { domain, results } per saved level record.
  const literacyRecords = Object.fromEntries(allRecords().filter((r) => r.band === band && ["Listening", "Reading"].includes(r.domain)).map((r) => [`${r.band === "3-5" ? "g3-5:" : ""}${r.domain}:${r.level}`, { domain: r.domain, results: r.record.results }]));
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
  const studioLinks = html`<a class="btn" href="${BASE}/write?grades=${band}">${icon("writing")} Writing Studio</a><a class="btn" href="${BASE}/speak?grades=${band}">${icon("speaking")} Speaking Studio</a><a class="btn" href="${BASE}/missions?grades=${band}">${icon("mission")} Missions</a>`;
  return {
    title: "Language Growth Map",
    html: html`${crumbsHTML([
        ["Lab", `${BASE}/?grades=${band}`],
        ["Passport", `${BASE}/passport?grades=${band}`],
        ["Language Growth Map", null],
      ])}
      <section class="prog-hero grow-hero d-reading is-tint">
        <div class="prog-hero-copy">
          <p class="eyebrow">${icon("growth")} Evidence from your own work</p>
          <h1 tabindex="-1">Language Growth Map</h1>
          <p class="lead">
            What your writing, speaking and missions show — and which kind of help you used. No
            scores: only evidence and next steps.
          </p>
        </div>
        <div class="prog-hero-art"><img src="${ART}/progress-growth.svg" alt="" width="360" height="270" /></div>
      </section>
      <section class="panel" aria-labelledby="growEvidence">
        <h2 id="growEvidence">Your evidence so far</h2>
        <ul class="pass-stats grow-stats">
          <li><span class="pass-stat-ico">${icon("pin")}</span><span class="pass-stat-label">First attempts</span><strong class="pass-stat-value">${p.firstAttempts}</strong></li>
          <li><span class="pass-stat-ico">${icon("flag")}</span><span class="pass-stat-label">On your own</span><strong class="pass-stat-value">${p.independentFirstAttempts}</strong></li>
          <li><span class="pass-stat-ico">${icon("retry")}</span><span class="pass-stat-label">Revisions</span><strong class="pass-stat-value">${p.revisions}</strong></li>
          <li><span class="pass-stat-ico">${icon("detective")}</span><span class="pass-stat-label">Detective tries</span><strong class="pass-stat-value">${p.detective}</strong></li>
        </ul>
        ${p.firstAttempts === 0 ? html`<div class="empty-state grow-empty"><img src="${ART}/empty.svg" alt="" width="320" height="240" /><h3>Your growth map is waiting for work</h3><p>No studio work yet. Try the Writing Studio, Speaking Studio or a mission and your growth map will start to fill in.</p><div class="row-actions">${studioLinks}</div></div>` : html`<p class="fine">A trend appears after ${MIN_POINTS} first attempts. “On your own” means no frames, word bank or model were open.</p>`}
      </section>
      ${supportChoiceHTML(ctx)}
      ${ACCESS_LAB_FLAGS.skillGraphEnabled ? skillGraphHTML(skillGraph) : ""}
      ${
        focus.length
          ? html`<section class="panel" aria-labelledby="growFocus">
              <h2 id="growFocus">Where to focus next</h2>
              <ol class="grow-focus">
                ${focus.map((f) => html`<li><span>${f.reason}</span>${f.kind === "pattern" ? html`<a class="btn small" href="${BASE}/detective/${f.id}?grades=${band}">${icon("detective")} Practice this pattern</a>` : ""}</li>`)}
              </ol>
            </section>`
          : ""
      }
      ${dims.map(
        (d) =>
          html`<section class="panel grow-dim" aria-labelledby="dim-${d.replace(/\W/g, "")}">
            <header class="grow-dim-head"><span class="prog-tile">${icon(DIM_ICON[d])}</span><div><h2 id="dim-${d.replace(/\W/g, "")}">${d}</h2>
            <p class="fine">${DIM_BLURB[d]}</p></div></header>
            <div class="grow-features">
              ${Object.entries(p.features)
                .filter(([, f]) => f.dimension === d)
                .map(([k, f]) => featureCard(k, f, entries))}
            </div>
          </section>`,
      )}
      <div class="grow-pair">
      <section class="panel">
        <h2>Patterns in your language</h2>
        ${
          p.errors.length
            ? html`<ul class="grow-rows">
                ${p.errors.slice(0, 6).map((e) => html`<li><a href="${BASE}/detective/${e.id}?grades=${band}">${pname(e.id)}</a><span>${e.mastered ? html`<span class="grow-status is-ind">${icon("check")} Used correctly on your own in new writing</span>` : `in ${e.drafts} recent piece${e.drafts === 1 ? "" : "s"}`}${e.transfer ? ` · ${e.transfer.transferIndependent} independent transfer${e.transfer.transferIndependent === 1 ? "" : "s"}` : ""}</span></li>`)}
              </ul>`
            : html`<p>No repeating pattern errors found in your recent work.</p>`
        }
      </section>
      ${
        p.comprehension.total
          ? html`<section class="panel">
              <h2>Listening and reading questions</h2>
              <ul class="grow-rows">
                ${Object.entries(p.comprehension.bySkill).map(([k, v]) => html`<li><span>${COMP_SKILL[k] || k}<span class="bar mini" aria-hidden="true"><i style="width:${Math.round((v.ok / v.n) * 100)}%"></i></span></span><span>${v.ok} of ${v.n} right on the first try${v.independentN ? ` · ${v.independentOk} of ${v.independentN} without help` : ""}</span></li>`)}
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
              ${rowsHTML([
                ["Time speaking", sp.speechSeconds.status === "ok" ? WORD[sp.speechSeconds.direction] : `not enough evidence yet (${sp.speechSeconds.n} of ${MIN_POINTS})`],
                ["Longest stretch without pausing", sp.longestRun.status === "ok" ? WORD[sp.longestRun.direction] : "not enough evidence yet"],
                ["Pauses per 30 seconds", sp.pausesPer30.status === "ok" ? WORD[sp.pausesPer30.direction] : "not enough evidence yet"],
              ])}
            </section>`
          : ""
      }
      </div>
      <section class="panel" aria-labelledby="growVolume">
        <h2 id="growVolume">Practice volume</h2>
        <p class="fine">
          Activities finished in each skill room. This shows how much you practiced, not how well.
        </p>
        <div class="grow-volume">
          ${CORE_DOMAINS.map(
            (d) =>
              html`<div class="card d-${d.toLowerCase()}">
                <span class="prog-tile">${icon(DOMAIN_META[d].icon)}</span>
                <h3>${DOMAIN_META[d].room}</h3>
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

export function onClick(e, ctx) {
  const btn = e.target.closest?.("[data-support-choice]");
  if (!btn) return false;
  const id = btn.dataset.supportChoice;
  ctx.setPrefs({ supportOverride: SUPPORT_TIERS.some((s) => s.id === id) ? id : "" });
  ctx.rerender().then(() => document.getElementById(btn.id)?.focus({ preventScroll: true }));
  return true;
}
