// Practice-test screen pieces shared by tests.js and test.js: domain chips, the mode badge and mode cards,
// and the results screen parts: practice-rubric ratings, the Practice Composite table, the formative
// breakdown (Independent vs Supported, by domain / Key Language Use / dimension, with "Practice this
// skill next" links) and the answer review.
import { transcriptHTML } from "../components.js";
import { correctAnswerText, isAuto, isCorrect } from "../grade.js";
import { seedAnswer } from "../items.js";
import { CRITERIA, PRACTICE_BANDS } from "../lang/rubrics.js";
import { BASE, DOMAIN_META, html, icon, raw } from "../util.js";
import { MODES, modeOf, otherMode } from "./test-modes.js";

const IGN = raw("data-nsr-ignore");

export const plural = (n, word) => `${n} ${word}${n === 1 ? "" : "s"}`;

/** Domain colour class (`d-reading`...). Unknown domains stay neutral. */
export const domainClass = (domain) =>
  DOMAIN_META[domain] ? `d-${domain.toLowerCase()}` : "d-model-test";

/** Domain name with its icon, tinted by the domain colour. Icon, colour and word always travel together. */
export const domainChipHTML = (domain, label = domain) =>
  html`<span class="dom-chip ${domainClass(domain)}"
    >${icon(DOMAIN_META[domain]?.icon || "tests")}${label}</span
  >`;

const MODE_ICON = { guided: "bulb", independent: "lock" };
const MODE_TAG = { guided: "Supports on", independent: "Test-day conditions" };

/** Mode label with a different icon and shape per mode, so the two are never told apart by colour alone. */
export const modeBadgeHTML = (mode, { tag = false, cls = "", iconOnly = false } = {}) =>
  html`<span class="mode-badge is-${mode} ${cls} ${iconOnly ? "is-icon" : ""}">${icon(MODE_ICON[mode])}${iconOnly ? "" : html`<span>${MODES[mode].label}</span>`}${tag ? html`<span class="mode-tag">${MODE_TAG[mode]}</span>` : ""}</span>`;

const MODE_POINTS = {
  guided: [
    ["check", "No clock. Take your time"],
    ["check", "Listen as often as you like"],
    ["check", "Hints, word banks and sentence frames"],
    ["check", "Check an answer, see why, and try again"],
  ],
  independent: [
    ["lock", "Each recording plays once and cannot be paused"],
    ["lock", "No hints, sentence frames or word banks"],
    ["lock", "Flag questions and review each section"],
    ["lock", "Optional practice timer that never ends your test"],
  ],
};
const MODE_SENTENCE = {
  guided: "Learn as you go. Check each answer, see why it is right, and try again.",
  independent: "Like test day. Show what you can do on your own, then submit to see a practice breakdown.",
};

const modePointsHTML = (mode) =>
  html`<span class="mode-points"
    >${MODE_POINTS[mode].map(([ic, text]) => html`<span>${icon(ic)}${text}</span>`)}</span
  >`;

/**
 * The mode choice on the intro screen. Before the test starts it is a radio group of two cards (same
 * `data-conditions` radios as before); once started it only states the mode and offers a restart.
 */
export function modeCardsHTML(rec, { started, minutes }) {
  const mode = modeOf(rec);
  if (started)
    return html`<div class="test-mode is-started">
      <p>
        ${modeBadgeHTML(mode, { tag: true })}
        <span class="fine">You chose this when you started. Changing mode restarts the test.</span>
      </p>
      <button type="button" class="btn small" data-switch-mode="${otherMode(mode)}">
        ${icon("retry")} Restart in ${MODES[otherMode(mode)].label}
      </button>
    </div>`;
  const card = (id, value) =>
    html`<label class="mode-card is-${id} ${mode === id ? "is-chosen" : ""}">
      <input
        type="radio"
        name="test-mode"
        value="${value}"
        data-conditions
        ${mode === id ? raw("checked") : ""}
        ${IGN}
      />
      <span class="mode-card-head">
        <span class="mode-card-icon">${icon(MODE_ICON[id])}</span>
        <span class="mode-card-title"
          ><strong>${MODES[id].label}</strong><span class="mode-tag">${MODE_TAG[id]}</span></span
        >
        <span class="mode-card-check" aria-hidden="true">${icon("check")}</span>
      </span>
      <span class="mode-card-copy">${MODE_SENTENCE[id]}</span>
      ${modePointsHTML(id)}
    </label>`;
  return html`<fieldset class="test-mode">
    <legend>Choose your mode before you start</legend>
    <div class="mode-cards">${card("guided", "learning")}${card("independent", "test")}</div>
    ${
      mode === "independent"
        ? html`<div class="mode-options">
            <label class="opt-row"
              ><input type="checkbox" data-replay ${rec.replay ? raw("checked") : ""} ${IGN} />
              <span
                >Allow one replay of each recording
                <span class="fine"
                  >EduWonderLab rehearsal setting. It does not grant or represent an official
                  testing accommodation. Ask your teacher about your assessment plan.</span
                ></span
              ></label
            >
            <label class="opt-row"
              ><input type="checkbox" data-timer ${rec.timer ? raw("checked") : ""} ${IGN} />
              <span
                >Practice with a timer (about ${minutes} minutes). It will never end your
                test.</span
              ></label
            >
          </div>`
        : ""
    }
  </fieldset>`;
}

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
      return html`<fieldset class="rate-domain ${domainClass(s.domain)}">
        <legend>${domainChipHTML(s.domain)}</legend>
        ${CRITERIA.map(
          (c) =>
            html`<fieldset class="rate-crit">
              <legend>${c.name} <span class="fine">· ${c.dimension}</span></legend>
              <div class="rate-options">
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
                      <span><strong>${b.label}</strong><span>${c.student[b.id]}</span></span>
                    </label>`,
                )}
              </div>
            </fieldset>`,
        )}
        <fieldset class="rate-crit rate-who">
          <legend>Who rated this?</legend>
          <div class="rate-options">
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
                  <span
                    ><strong
                      >${who === "me" ? "I rated my own work" : "My teacher rated it"}</strong
                    ></span
                  >
                </label>`,
            )}
          </div>
        </fieldset>
      </fieldset>`;
    })}
  </section>`;
}

/** The Practice Composite (computed by views/test.js): weighted, never filled in, never a WIDA score or level. */
export function compositeHTML(c, { WEIGHTS, METHOD, LIMITS, MIN_ITEMS, BAND_POINTS }) {
  const points = (m) => (m.status === "ok" ? `${Math.round(m.value)}` : "—");
  const card = (label, sub, v) =>
    html`<article class="comp-card ${v ? "has-value" : ""}">
      <h3>${label} <span class="fine">${sub}</span></h3>
      ${
        v
          ? html`<p class="comp-num">
                <strong>${v.value}</strong> <span>/ 100 practice points</span>
              </p>
              ${v.small ? html`<p class="fine">Small sample: fewer than 12 questions in a skill. Treat this as a rough picture.</p>` : ""}`
          : html`<p class="comp-num is-empty"><strong>—</strong> <span>Not shown yet</span></p>`
      }
    </article>`;
  return html`<section class="composite" aria-labelledby="compTitle">
    <h2 id="compTitle">Practice composite</h2>
    <p class="fine comp-kicker">Practice points, not a WIDA ACCESS score, level or placement.</p>
    <div class="comp-grid">
      ${card("Practice comprehension", "Listening + Reading", c.comprehension)}
      ${card("Practice overall", "all four skills", c.overall)}
    </div>
    ${c.withheld ? html`<p class="comp-withheld">${icon("info")}<span>${c.withheld}</span></p>` : ""}
    ${c.overall ? html`<p class="fine">Speaking and Writing ${c.overall.raters.length > 1 ? "were rated by both you and your teacher" : c.overall.raters[0] === "teacher" ? "were rated by your teacher" : "are your own ratings"}.</p>` : ""}
    <div class="fm-scroll">
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
                <th scope="row">${domainChipHTML(m.domain)}</th>
                <td data-label="Weight">${Math.round(WEIGHTS[m.domain] * 100)}%</td>
                <td data-label="Practice points">${points(m)}</td>
                <td data-label="Based on">${m.why}</td>
              </tr>`,
          )}
        </tbody>
      </table>
    </div>
    <div class="comp-method">
      <h3>How this is calculated, and what it is not</h3>
      <p>${METHOD}</p>
      <p>${LIMITS}</p>
      <p class="fine">
        A skill needs at least ${MIN_ITEMS} answered questions to count. Rubric points: early
        ${BAND_POINTS.early}, building ${BAND_POINTS.building}, strong ${BAND_POINTS.strong}.
      </p>
    </div>
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
  return html`<div class="fm-scroll">
    <table class="fm-table">
      <caption>
        ${caption}
      </caption>
      <thead>
        <tr>
          <th scope="col">Group</th>
          <th scope="col">Checked questions</th>
          <th scope="col">Spoken and written work</th>
          <th scope="col">Practice this skill next</th>
        </tr>
      </thead>
      <tbody>
        ${rows.map((r) => {
          const [path, name] = PRACTICE_NEXT[r.key] || [];
          return html`<tr>
            <th scope="row">${r.key}</th>
            <td data-label="Checked questions">
              ${r.scored ? html`${r.right} of ${r.scored} right${r.small ? html`<span class="fm-small">Small sample</span>` : ""}` : "—"}
            </td>
            <td data-label="Spoken and written work">
              ${r.open ? `${r.openDone} of ${r.open} done` : ""}${r.ratings.map((x) => html`<span class="fm-rating">${r.open ? "; " : ""}${x.domain}: ${x.band} (${x.by === "teacher" ? "teacher" : "self"} rating)</span>`)}${!r.open && !r.ratings.length ? "—" : ""}
            </td>
            <td data-label="Practice this skill next">
              ${path ? html`<a href="${BASE}${path}">${name}</a>` : ""}
            </td>
          </tr>`;
        })}
      </tbody>
    </table>
  </div>`;
}

/** Independent Rehearsal and Supported Practice, side by side and never combined. */
export function formativeHTML(formative, formativeBreakdown, { SMALL_SAMPLE, FORMATIVE_SMALL }) {
  const block = (mode) => {
    const snap = formative?.[mode];
    const title = MODES[mode].results;
    if (!snap?.outcomes?.length)
      return html`<article class="fm-mode is-${mode} is-empty">
        <h3>${modeBadgeHTML(mode, { iconOnly: true })}<span class="fm-title">${title}</span></h3>
        <p>No ${title} finished for this test yet.</p>
        <button type="button" class="btn small" data-switch-mode="${mode}">
          Start ${MODES[mode].label} (restarts this test)
        </button>
      </article>`;
    const b = formativeBreakdown(snap);
    return html`<article class="fm-mode is-${mode}">
      <h3>${modeBadgeHTML(mode, { iconOnly: true })}<span class="fm-title">${title}</span></h3>
      <p class="fine">
        ${mode === "independent" ? "Your own work under test-day rules." : "Work with hints, transcripts and retries. Each question counts your first check."}
        ${snap.date ? ` Finished ${new Date(snap.date).toLocaleDateString()}.` : ""}
      </p>
      ${b.small ? html`<p class="fine"><strong>Small sample:</strong> fewer than ${SMALL_SAMPLE} checked questions in this run. Treat these counts as a hint, not a pattern. A group with fewer than ${FORMATIVE_SMALL} is marked.</p>` : ""}
      ${fmTableHTML("By domain", b.byDomain)} ${fmTableHTML("By Key Language Use", b.byKeyUse)}
      ${fmTableHTML("By language dimension", b.byDimension)}
    </article>`;
  };
  return html`<section class="formative" aria-labelledby="fmTitle">
    <h2 id="fmTitle">Formative results: what to practice next</h2>
    <p class="fine">
      Two separate results. They are never added together, and neither is a WIDA ACCESS score or
      level. Key Language Use and language dimension are this lab's own tags for what each question
      mostly practices. Speaking and Writing appear by dimension only after a practice-rubric
      rating.
    </p>
    <div class="fm-modes">${block("independent")} ${block("guided")}</div>
  </section>`;
}

/** Every question with its key; Listening keeps its transcript here, after the test. */
export function answerReviewHTML(flat, answers) {
  return html`<section class="panel answer-review-panel">
    <h2>Answer review</h2>
    <ol class="answer-review">
      ${flat.map((f, i) => {
        const a = answers[f.item.id] ?? seedAnswer(f.item);
        const auto = isAuto(f.item);
        const ok = auto && isCorrect(f.item, a);
        return html`<li
          class="${auto ? (ok ? "is-right" : "is-wrong") : "is-open"} ${domainClass(f.section.domain)}"
        >
          <span class="ar-n" aria-hidden="true">${i + 1}</span>
          <div class="ar-body">
            <p class="ar-q">${domainChipHTML(f.section.domain)} <span>${f.item.prompt}</span></p>
            ${
              auto
                ? ok
                  ? html`<p class="ar-verdict">
                      ${icon("check")}<span class="visually-hidden">\u2713 </span>Correct
                    </p>`
                  : html`<p class="ar-verdict">
                      ${icon("x")}<span
                        >Correct answer: <strong>${correctAnswerText(f.item)}</strong></span
                      >
                    </p>`
                : html`<p class="ar-verdict">
                    ${icon("info")}<span>Your teacher will review this answer.</span>
                  </p>`
            }
            ${!ok && f.item.hint ? html`<p class="fine">${f.item.hint}</p>` : ""}
            ${f.section.domain === "Listening" && f.item.script ? transcriptHTML(f.item.id, f.item.script) : ""}
          </div>
        </li>`;
      })}
    </ol>
  </section>`;
}

/** Intro side column: what is in the test, how it works in the chosen mode, and the not-official note. */
export function introSideHTML(test, { mode, plays }) {
  return html`<aside class="test-intro-side">
        <section class="test-card-side" aria-labelledby="inTest">
          <h2 id="inTest">In this test</h2>
          <ol class="section-list">
            ${(test.sections || []).map((s) => html`<li class="${domainClass(s.domain)}"><span class="section-name">${domainChipHTML(s.domain, s.title || s.domain)}</span><span class="section-meta">${plural(s.items.length, "question")} · about ${s.estMinutes || 8} min</span></li>`)}
          </ol>
        </section>
        <section class="test-card-side" aria-labelledby="howTest">
          <h2 id="howTest">How it works</h2>
          <ul class="rules">
            <li>${icon("clock")}<span>${mode === "guided" ? "Take your time. Guided Practice has no clock." : "There is no clock unless you turn on the practice timer."}</span></li>
            <li>${icon("arrow-right")}<span>Use <strong>Next</strong> and <strong>Back</strong>. Flag a question to come back to it. You review each section before you submit.</span></li>
            ${
              plays
                ? html`<li>${icon("play")}<span>Listening: press <strong>Play</strong>. Each recording plays ${plays === 1 ? "one time" : "up to two times"} and cannot be paused or stopped.</span></li>`
                : html`<li>${icon("play")}<span>Listening: press <strong>Listen</strong>. You may listen more than once. After you check an answer you can read what you heard.</span></li>`
            }
            <li>${icon("writing")}<span>Speaking: record your answer or say it to a teacher or partner. Writing: type your answer. For Grade 3 ACCESS preparation, also practice handwriting on paper with your teacher.</span></li>
          </ul>
        </section>
        <p class="test-note disclaimer">
          ${icon("info")}<span>Original classroom practice, not an official WIDA test or score. Actual ACCESS Online adapts
          Listening and Reading and uses those results for Speaking and Writing tier placement. This
          fixed practice set does not reproduce its difficulty, scoring, timing, or routing. Use the
          <a href="https://wbte.drcedirect.com/WIDA" target="_blank" rel="noopener">official WIDA demo</a>
          to learn the actual testing interface.</span>
        </p>
      </aside>`;
}

/** Section review before submit: counts, a warning for blanks, and every question by section. */
export function reviewScreenHTML({ test, flat, rec, done, answered: n }) {
  const flags = rec.flags || [];
  const missing = flat.length - n;
  const row = (f, i) => {
    const completed = done(f);
    const fl = flags.includes(f.item.id);
    return html`<li>
      <button type="button" class="review-row ${completed ? "is-done" : "is-blank"}" data-jump="${i}">
        <span class="rv-n" aria-hidden="true">${i + 1}</span>
        <span class="rv-title"><span class="visually-hidden">${i + 1}. </span>${f.item.title || f.item.skill || "Question"}</span>
        <span class="rv-state">${completed ? html`<span class="rv-pill is-done">${icon("check")}Answered</span>` : html`<span class="rv-pill is-blank">${icon("alert")}Not answered</span>`}${fl ? html`<span class="rv-pill is-flag">${icon("flag")}Flagged</span>` : ""}</span>
      </button>
    </li>`;
  };
  return html`<section class="review">
    <header class="review-head">
      <p class="eyebrow">${modeBadgeHTML(modeOf(rec))}</p>
      <h1 tabindex="-1">Review each section before you submit</h1>
      <p class="lead">
        ${n} answered · ${missing} not answered · ${flags.length} flagged. Tap a question to go back.
      </p>
      <ul class="review-stats" aria-hidden="true">
        <li class="is-done">${icon("check")}<strong>${n}</strong> answered</li>
        <li class="is-blank">${icon("alert")}<strong>${missing}</strong> not answered</li>
        <li class="is-flag">${icon("flag")}<strong>${flags.length}</strong> flagged</li>
      </ul>
    </header>
    ${missing ? html`<p class="review-warn" role="note">${icon("alert")}<span>${plural(missing, "question")} ${missing === 1 ? "has" : "have"} no answer yet. You can go back to ${missing === 1 ? "it" : "them"}, or submit as it is.</span></p>` : ""}
    ${(test.sections || []).map((s, si) => {
      const rows = flat.map((f, i) => [f, i]).filter(([f]) => f.si === si);
      const sDone = rows.filter(([f]) => done(f)).length;
      const sFlags = rows.filter(([f]) => flags.includes(f.item.id)).length;
      return html`<section class="review-section" data-domain="${s.domain}" aria-labelledby="rev-${si}">
        <div class="rs-head">
          <h2 id="rev-${si}">${icon(DOMAIN_META[s.domain]?.icon || "tests")}${s.title || s.domain}</h2>
          <p class="fine">${sDone} of ${rows.length} answered · ${sFlags} flagged</p>
          <div class="bar" aria-hidden="true"><i style="width:${Math.round((sDone / rows.length) * 100)}%"></i></div>
        </div>
        <ol class="review-list">
          ${rows.map(([f, i]) => row(f, i))}
        </ol>
      </section>`;
    })}
    <div class="row-actions review-actions">
      <button type="button" class="btn" data-jump="${rec.index}">${icon("arrow-left")}Keep working</button
      ><button type="button" class="btn btn-primary btn-big" data-submit>Submit test${icon("check")}</button>
    </div>
  </section>`;
}

