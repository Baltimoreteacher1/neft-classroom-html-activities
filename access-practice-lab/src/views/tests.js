// Test center: full tests, single-skill tests and minis for the current band,
// plus the model-test item bank (grades 6–8) and WIDA's official practice link.
import { bandSwitchHTML, crumbsHTML } from "../components.js";
import { loadIndex, loadShared } from "../content.js";
import { loadTestRecord } from "../store.js";
import { BASE, bandLabel, html } from "../util.js";

const KIND = {
  full: "Full practice tests",
  domain: "Single-skill tests",
  mini: "Mini tests (10–15 minutes)",
};

export async function render(ctx) {
  const [index, shared] = await Promise.all([loadIndex(), loadShared().catch(() => ({}))]);
  const tests = index.tests.filter((t) => t.band === ctx.band);
  const groups = Object.keys(KIND)
    .map((k) => [k, tests.filter((t) => t.kind === k)])
    .filter(([, list]) => list.length);
  const card = (t) => {
    const rec = loadTestRecord(t.id);
    const status = rec.results
      ? `Done · ${rec.results.correct}/${rec.results.total} right`
      : Object.keys(rec.answers || {}).length
        ? "In progress"
        : "Not started";
    return html`<li class="test-card">
      <a href="${BASE}/test/${t.id}">
        <strong>${t.title}</strong>
        <span
          >${t.domain ? `${t.domain} · ` : "Listening · Reading · Speaking · Writing · "}${t.items}
          questions · about ${t.minutes} min</span
        >
        <span class="status ${rec.results ? "is-done" : ""}">${status}</span>
      </a>
    </li>`;
  };
  return {
    title: "Practice tests",
    html: html`${crumbsHTML([
        ["Lab", `${BASE}/`],
        ["Practice tests", null],
      ])}
      <section class="room-hero">
        <div>
          <p class="eyebrow">${bandLabel(ctx.band)}</p>
          <h1 tabindex="-1">🧪 Practice tests</h1>
          <p class="lead">
            Practice the real test order: Listening, Reading, Speaking, then Writing. No clock
            unless you turn one on.
          </p>
          ${bandSwitchHTML(ctx.band, ctx.bands)}
        </div>
      </section>
      ${
        groups.length
          ? groups.map(
              ([k, list]) =>
                html`<section>
                  <h2 class="section-title">${KIND[k]}</h2>
                  <ul class="test-grid">
                    ${list.map(card)}
                  </ul>
                </section>`,
            )
          : html`<p class="panel">Practice tests for ${bandLabel(ctx.band)} are coming soon.</p>`
      }
      ${
        ctx.band === "6-8"
          ? html`<section class="panel">
              <h2>Model test items</h2>
              <p>Practice single test-style items one at a time, with feedback after each.</p>
              <div class="row-actions">
                <a class="btn" href="${BASE}/Model-Test/6-8/A">Model items · Part A</a
                ><a class="btn" href="${BASE}/Model-Test/6-8/B">Model items · Part B</a>
              </div>
            </section>`
          : ""
      }
      <section class="panel">
        <h2>Try the official WIDA practice</h2>
        <p>
          WIDA's free Test Demo (about 15 minutes) and Test Practice items use the real test
          screens. Open the page, then choose <strong>Test Demo</strong> — or choose
          <strong>WIDA ACCESS</strong>, then <strong>WIDA ACCESS Test Practice</strong>.
        </p>
        <a
          class="btn"
          href="${shared.widaPractice || "https://wida.wisc.edu"}"
          target="_blank"
          rel="noopener"
          >Open WIDA's Test Demo &amp; Practice ↗</a
        >
      </section>`,
  };
}
