// Practice-test results screen pieces (views/test.js): practice-rubric ratings, the Practice
// Composite table, the formative breakdown (Independent vs Supported, by domain / Key Language
// Use / dimension, with "Practice this skill next" links) and the answer review.
import { transcriptHTML } from "../components.js";
import { correctAnswerText, isAuto, isCorrect } from "../grade.js";
import { seedAnswer } from "../items.js";
import { CRITERIA, PRACTICE_BANDS } from "../lang/rubrics.js";
import { BASE, html, raw } from "../util.js";
import { MODES } from "./test-modes.js";

const IGN = raw("data-nsr-ignore");

const ratingId = (domain, crit, band) => `rate-${domain}-${crit}-${band}`;

/** Speaking and Writing cannot be machine-scored, so the composite waits for a practice-rubric rating. */
export function ratingHTML(r, ratings) {
  const rated = r.sections.filter(
    (s) => (s.domain === "Speaking" || s.domain === "Writing") && s.openDone > 0,
  );
  if (!rated.length) return "";
  return html`<section class="rate-panel" aria-labelledby="rateTitle">
    <h2 id="rateTitle">Rate your speaking and writing</h2>
    <p class="fine">
      Use the practice rubric to rate each response. A teacher rating is a different kind of
      evidence than a self-rating, so say who rated. Ratings are saved on this device.
    </p>
    ${rated.map((s) => {
      const cur = ratings?.[s.domain] || {};
      return html`<fieldset class="rate-domain">
        <legend>${s.domain}</legend>
        ${CRITERIA.map(
          (c) =>
            html`<fieldset class="rate-crit">
              <legend>${c.name} <span class="fine">· ${c.dimension}</span></legend>
              ${PRACTICE_BANDS.map(
                (b) =>
                  html`<label class="rate-opt">
                    <input
                      type="radio"
                      id="${ratingId(s.domain, c.id, b.id)}"
                      name="rate-${s.domain}-${c.id}"
                      value="${b.id}"
                      data-rating="${s.domain}"
                      data-rating-crit="${c.id}"
                      ${cur[c.id] === b.id ? raw("checked") : ""}
                      ${IGN}
                    />
                    <span><strong>${b.label}</strong> — ${c.student[b.id]}</span>
                  </label>`,
              )}
            </fieldset>`,
        )}
        <fieldset class="rate-crit">
          <legend>Who rated this?</legend>
          ${["me", "teacher"].map(
            (who) =>
              html`<label class="rate-opt">
                <input
                  type="radio"
                  id="rate-${s.domain}-by-${who}"
                  name="rate-${s.domain}-by"
                  value="${who}"
                  data-rating-by="${s.domain}"
                  ${(cur.by || "me") === who ? raw("checked") : ""}
                  ${IGN}
                />
                <span>${who === "me" ? "I rated my own work" : "My teacher rated it"}</span>
              </label>`,
          )}
        </fieldset>
      </fieldset>`;
    })}
  </section>`;
}

/** The Practice Composite (computed by views/test.js): weighted, never filled in, never a WIDA score or level. */
export function compositeHTML(c, { WEIGHTS, METHOD, LIMITS, MIN_ITEMS, BAND_POINTS }) {
  const points = (m) => (m.status === "ok" ? `${Math.round(m.value)}` : "—");
  const card = (label, sub, v) =>
    html`<article class="comp-card">
      <h3>${label} <span class="fine">${sub}</span></h3>
      ${
        v
          ? html`<p class="comp-num">
                <strong>${v.value}</strong> <span>/ 100 practice points</span>
              </p>
              ${v.small ? html`<p class="fine">Small sample: fewer than 12 questions in a skill. Treat this as a rough picture.</p>` : ""}`
          : html`<p class="fine">Not shown yet.</p>`
      }
    </article>`;
  return html`<section class="composite" aria-labelledby="compTitle">
    <h2 id="compTitle">Practice composite</h2>
    <div class="comp-grid">
      ${card("Practice comprehension", "Listening + Reading", c.comprehension)}
      ${card("Practice overall", "all four skills", c.overall)}
    </div>
    ${c.withheld ? html`<p class="fine">${c.withheld}</p>` : ""}
    ${c.overall ? html`<p class="fine">Speaking and Writing ${c.overall.raters.length > 1 ? "were rated by both you and your teacher" : c.overall.raters[0] === "teacher" ? "were rated by your teacher" : "are your own ratings"}.</p>` : ""}
    <table class="comp-table">
      <caption>
        How each skill counts
      </caption>
      <thead>
        <tr>
          <th scope="col">Skill</th>
          <th scope="col">Weight</th>
          <th scope="col">Practice points</th>
          <th scope="col">Based on</th>
        </tr>
      </thead>
      <tbody>
        ${c.measures.map(
          (m) =>
            html`<tr>
              <th scope="row">${m.domain}</th>
              <td>${Math.round(WEIGHTS[m.domain] * 100)}%</td>
              <td>${points(m)}</td>
              <td>${m.why}</td>
            </tr>`,
        )}
      </tbody>
    </table>
    <details class="comp-method">
      <summary>How this is calculated, and what it is not</summary>
      <p>${METHOD}</p>
      <p>${LIMITS}</p>
      <p class="fine">
        A skill needs at least ${MIN_ITEMS} answered questions to count. Rubric points: early
        ${BAND_POINTS.early}, building ${BAND_POINTS.building}, strong ${BAND_POINTS.strong}.
      </p>
    </details>
  </section>`;
}

/** Where to practice next, by group (existing Lab routes). */
export const PRACTICE_NEXT = Object.freeze({
  Listening: ["/worlds/signal-station", "Signal Station"],
  Reading: ["/worlds/evidence-city", "Evidence City"],
  Speaking: ["/speak", "Speaking Studio"],
  Writing: ["/write", "Writing Studio"],
  Narrate: ["/worlds/storyworks", "StoryWorks"],
  Inform: ["/worlds/evidence-city", "Evidence City"],
  Explain: ["/missions", "Academic missions"],
  Argue: ["/worlds/conversation-quest", "Conversation Quest"],
  Discourse: ["/construction", "Language Construction Lab"],
  Sentence: ["/detective", "Language Error Detective"],
  "Word/Phrase": ["/vocabulary", "Word Builder"],
});

function fmTableHTML(caption, rows) {
  if (!rows.length) return "";
  return html`<div class="fm-scroll"><table class="fm-table">
    <caption>${caption}</caption>
    <thead><tr><th scope="col">Group</th><th scope="col">Checked questions</th><th scope="col">Spoken and written work</th><th scope="col">Practice this skill next</th></tr></thead>
    <tbody>
      ${rows.map((r) => {
        const [path, name] = PRACTICE_NEXT[r.key] || [];
        return html`<tr>
          <th scope="row">${r.key}</th>
          <td>${r.scored ? html`${r.right} of ${r.scored} right${r.small ? html`<span class="fm-small">Small sample</span>` : ""}` : "—"}</td>
          <td>${r.open ? `${r.openDone} of ${r.open} done` : ""}${r.ratings.map((x) => html`<span class="fm-rating">${r.open ? "; " : ""}${x.domain}: ${x.band} (${x.by === "teacher" ? "teacher" : "self"} rating)</span>`)}${!r.open && !r.ratings.length ? "—" : ""}</td>
          <td>${path ? html`<a href="${BASE}${path}">${name}</a>` : ""}</td>
        </tr>`;
      })}
    </tbody>
  </table></div>`;
}

/** Independent Rehearsal and Supported Practice, side by side and never combined. */
export function formativeHTML(formative, formativeBreakdown, { SMALL_SAMPLE, FORMATIVE_SMALL }) {
  const block = (mode) => {
    const snap = formative?.[mode];
    const title = MODES[mode].results;
    if (!snap?.outcomes?.length)
      return html`<article class="fm-mode">
        <h3>${title}</h3>
        <p>No ${title} finished for this test yet.</p>
        <button type="button" class="ghost" data-switch-mode="${mode}">Start ${MODES[mode].label} (restarts this test)</button>
      </article>`;
    const b = formativeBreakdown(snap);
    return html`<article class="fm-mode">
      <h3>${title}</h3>
      <p class="fine">
        ${mode === "independent" ? "Your own work under test-day rules." : "Work with hints, transcripts and retries. Each question counts your first check."}
        ${snap.date ? ` Finished ${new Date(snap.date).toLocaleDateString()}.` : ""}
      </p>
      ${b.small ? html`<p class="fine"><strong>Small sample:</strong> fewer than ${SMALL_SAMPLE} checked questions in this run. Treat these counts as a hint, not a pattern. A group with fewer than ${FORMATIVE_SMALL} is marked.</p>` : ""}
      ${fmTableHTML("By domain", b.byDomain)}
      ${fmTableHTML("By Key Language Use", b.byKeyUse)}
      ${fmTableHTML("By language dimension", b.byDimension)}
    </article>`;
  };
  return html`<section class="formative" aria-labelledby="fmTitle">
    <h2 id="fmTitle">Formative results: what to practice next</h2>
    <p class="fine">
      Two separate results. They are never added together, and neither is a WIDA ACCESS score or
      level. Key Language Use and language dimension are this lab's own tags for what each question
      mostly practices. Speaking and Writing appear by dimension only after a practice-rubric rating.
    </p>
    ${block("independent")} ${block("guided")}
  </section>`;
}

/** Every question with its key; Listening keeps its transcript here, after the test. */
export function answerReviewHTML(flat, answers) {
  return html`<section class="panel">
      <h2>Answer review</h2>
      <ol class="answer-review">
        ${flat.map((f) => {
          const a = answers[f.item.id] ?? seedAnswer(f.item);
          const auto = isAuto(f.item);
          const ok = auto && isCorrect(f.item, a);
          return html`<li class="${auto ? (ok ? "is-right" : "is-wrong") : "is-open"}">
            <p class="ar-q"><strong>${f.section.domain}:</strong> ${f.item.prompt}</p>
            ${auto ? html`<p>${ok ? "✓ Correct" : html`✗ Correct answer: <strong>${correctAnswerText(f.item)}</strong>`}</p>` : html`<p>Your teacher will review this answer.</p>`}
            ${!ok && f.item.hint ? html`<p class="fine">${f.item.hint}</p>` : ""}
            ${f.section.domain === "Listening" && f.item.script ? transcriptHTML(f.item.id, f.item.script) : ""}
          </li>`;
        })}
      </ol>
    </section>`;
}
