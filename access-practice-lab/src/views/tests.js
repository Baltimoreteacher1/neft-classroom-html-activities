// Test center: full tests, single-skill tests and minis for the current band,
// plus the model-test item bank (grades 6–8) and WIDA's official practice link.
import { bandSwitchHTML, crumbsHTML } from "../components.js";
import { loadIndex, loadShared } from "../content.js";
import { loadTestRecord } from "../store.js";
import { ART, BASE, CORE_DOMAINS, bandLabel, html, icon } from "../util.js";
import { domainChipHTML } from "./test-report.js";

const KIND = {
  full: ["Four-domain classroom practice", "tests"],
  domain: ["Single-skill tests", "list"],
  mini: ["Short practice sets", "clock"],
};

/** Status is always icon + words, never colour alone. */
function statusOf(rec) {
  if (rec.results)
    return {
      tone: "is-done",
      icon: "check",
      text: rec.results.total
        ? `Done · ${rec.results.correct}/${rec.results.total} auto-checked answers correct`
        : "Practice complete · teacher review needed",
    };
  if (Object.keys(rec.answers || {}).length)
    return { tone: "is-progress", icon: "bookmark", text: "In progress" };
  return { tone: "is-new", icon: null, text: "Not started" };
}

const modeCompareHTML = html`<section class="mode-compare" aria-labelledby="twoWays">
  <h2 id="twoWays">Two ways to practice</h2>
  <p class="lead">You choose the mode before you start. Switching mode restarts the test.</p>
  <div class="mode-cards is-static">
    <article class="mode-card is-guided">
      <span class="mode-card-head">
        <span class="mode-card-icon">${icon("bulb")}</span>
        <span class="mode-card-title"
          ><strong>Guided Practice</strong><span class="mode-tag">Supports on</span></span
        >
      </span>
      <p class="mode-card-copy">Untimed, with hints, answer explanations and retries.</p>
      <span class="mode-points">
        <span>${icon("check")}Listen as often as you like</span>
        <span>${icon("check")}Hints, word banks and sentence frames</span>
        <span>${icon("check")}Check an answer, then try again</span>
      </span>
    </article>
    <article class="mode-card is-independent">
      <span class="mode-card-head">
        <span class="mode-card-icon">${icon("lock")}</span>
        <span class="mode-card-title"
          ><strong>Independent Rehearsal</strong
          ><span class="mode-tag">Test-day conditions</span></span
        >
      </span>
      <p class="mode-card-copy">Like test day, so you see what you can do on your own.</p>
      <span class="mode-points">
        <span>${icon("lock")}Each recording plays once</span>
        <span>${icon("lock")}No sentence frames or word banks</span>
        <span>${icon("lock")}Section review before you submit</span>
      </span>
    </article>
  </div>
</section>`;

export async function render(ctx) {
  const [index, shared] = await Promise.all([loadIndex(), loadShared().catch(() => ({}))]);
  const tests = index.tests.filter((t) => t.band === ctx.band);
  const groups = Object.keys(KIND)
    .map((k) => [k, tests.filter((t) => t.kind === k)])
    .filter(([, list]) => list.length);
  const card = (t) => {
    const rec = loadTestRecord(t.id);
    const st = statusOf(rec);
    const domains = t.domain ? [t.domain] : CORE_DOMAINS;
    return html`<li class="test-card">
      <a href="${BASE}/test/${t.id}?grades=${ctx.band}">
        <span class="tc-domains">${domains.map((d) => domainChipHTML(d))}</span>
        <strong>${t.title}</strong>
        <span class="tc-meta"
          ><span>${icon("list")}${t.items} questions</span
          ><span>${icon("clock")}About ${t.minutes} min</span></span
        >
        <span class="status ${st.tone}">${st.icon ? icon(st.icon) : ""}${st.text}</span>
      </a>
      <p class="mode-links" role="group" aria-label="Start ${t.title} in a mode">
        <a class="is-guided" href="${BASE}/test/${t.id}?grades=${ctx.band}&rehearsal=guided"
          >${icon("bulb")}Guided Practice</a
        >
        <a
          class="is-independent"
          href="${BASE}/test/${t.id}?grades=${ctx.band}&rehearsal=independent"
          >${icon("lock")}Independent Rehearsal</a
        >
      </p>
    </li>`;
  };
  return {
    title: "Practice tests",
    html: html`<div class="tests-page d-model-test">
      ${crumbsHTML([
        ["Lab", `${BASE}/`],
        ["Practice tests", null],
      ])}
      <header class="test-hero">
        <div class="test-hero-copy">
          <p class="eyebrow">${bandLabel(ctx.band)} · Classroom practice</p>
          <h1 tabindex="-1">Practice tests</h1>
          <p class="lead">
            Practice listening, reading, speaking, and writing. These classroom activities build
            language confidence; they do not predict an ACCESS score. No clock unless you turn one
            on.
          </p>
          ${bandSwitchHTML(ctx.band, ctx.bands)}
        </div>
        <img class="test-hero-art" src="${ART}/test-intro.svg" alt="" width="480" height="300" />
      </header>
      ${modeCompareHTML}
      <p class="test-note disclaimer">
        ${icon("info")}<span
          >Actual ACCESS Online adapts Listening and Reading and uses those results for Speaking and
          Writing tier placement. These fixed classroom sets do not reproduce that routing, timing,
          scoring, or difficulty. Grade 3 ACCESS Writing uses paper; ask your teacher about your
          assigned format.</span
        >
      </p>
      ${
        groups.length
          ? groups.map(
              ([k, list]) =>
                html`<section class="test-group" aria-labelledby="grp-${k}">
                  <h2 class="section-title" id="grp-${k}">${icon(KIND[k][1])}${KIND[k][0]}</h2>
                  <ul class="test-grid">
                    ${list.map(card)}
                  </ul>
                </section>`,
            )
          : html`<p class="panel">Practice tests for ${bandLabel(ctx.band)} are coming soon.</p>`
      }
      <div class="test-extras">
        ${
          ctx.band === "6-8"
            ? html`<section class="test-extra">
                <h2>${icon("list")}Model test items</h2>
                <p>Practice single test-style items one at a time, with feedback after each.</p>
                <div class="row-actions">
                  <a class="btn" href="${BASE}/Model-Test/6-8/A">Model items · Part A</a
                  ><a class="btn" href="${BASE}/Model-Test/6-8/B">Model items · Part B</a>
                </div>
              </section>`
            : ""
        }
        <section class="test-extra">
          <h2>${icon("external")}Try the official WIDA practice</h2>
          <p>
            WIDA's free Test Demo (about 15 minutes) and Test Practice items use the real test
            screens. Open the page, then choose <strong>Test Demo</strong> — or choose
            <strong>WIDA ACCESS</strong>, then <strong>WIDA ACCESS Test Practice</strong>.
          </p>
          <div class="row-actions">
            <a
              class="btn"
              href="${shared.widaPractice || "https://wida.wisc.edu"}"
              target="_blank"
              rel="noopener"
              >Open WIDA's Test Demo &amp; Practice${icon("external")}</a
            >
          </div>
        </section>
      </div>
    </div>`,
  };
}
