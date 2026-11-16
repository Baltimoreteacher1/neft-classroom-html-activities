// The five tour steps. Each function returns { guide, stage }: the left Teacher Guidance panel and the right
// Interactive Experience panel. Views are pure functions of (state, data, ui); the controller owns events and loading.
// `D` = { rows, act(pick) } where act() is the real activity record from content/g<band>/<Domain>.json.
import { ART, BASE, html, icon } from "../../util.js";
import { DEST_BY_ID } from "../../sitemap.js";
import { ROUTES } from "../data.js";
import { buildLesson, defaultTarget, diffProfiles, profilesFor } from "./lesson.js";
import {
  BANDS,
  DOMAINS,
  LEVELS,
  PURPOSES,
  PROFILES,
  WHY,
  bandName,
  domainName,
  domainOf,
  findRow,
  focusDomain,
  pickOf,
  recommend,
  sameResource,
} from "./model.js";
import { chips, frameHTML, linkBox, seg } from "./ui.js";

const nameOf = (id) => DEST_BY_ID[id]?.title?.[0] || id;
const pic = (act) =>
  act?.picture?.src
    ? html`<img
        class="t2-pic"
        src="${BASE}/${act.picture.src}"
        alt="${act.picture.alt || ""}"
        loading="lazy"
      />`
    : "";

/** One line per step that says where this lives on the real site, so the tour builds a map, not just a memory. */
const WHERE = {
  1: "On the site: Practice, in the top bar. Every activity sits under Listening, Reading, Speaking or Writing.",
  2: "On the site: this is what a student sees after opening your link. No account, no sign-in.",
  3: "On the site: every activity has a Help choice at the top. Students can change it any time.",
  4: "On the site: Teachers → Launch Studio, where you find an activity and share its link.",
  5: "On the site: Teachers → Lesson Builder turns one activity into a full lesson.",
};

const guide = ({ n, minutes, title, objective, directions, classroom, extra = "" }) =>
  html` <p class="t2-eyebrow">Step ${n} of 5 · about ${minutes} minutes</p>
    <h1 id="t2Title" tabindex="-1">${title}</h1>
    ${WHERE[n] ? html`<p class="t2-where"><span aria-hidden="true">📍</span> ${WHERE[n]}</p>` : ""}
    <p class="t2-objective"><strong>You will:</strong> ${objective}</p>
    <p class="t2-directions">${directions}</p>
    ${extra}
    <aside class="t2-use">
      <h2>In your classroom</h2>
      <p>${classroom}</p>
    </aside>`;

/** The tour's example for a domain: the best warm-up for the band, with its real activity record. */
export function exampleFor(D, S, domain, purpose = "warmup") {
  const res = recommend(D.rows, { band: S.band, domain, purpose })[0] || null;
  return { res, act: res ? D.act(pickOf(res)) : null };
}

/* ── Step 1: Welcome ── */

const CARDS = [
  {
    id: "listening",
    name: "Listening Practice",
    art: "domain-listening.svg",
    text: "Students hear a short talk or direction, choose what they understood, and read guidance on what to listen for.",
  },
  {
    id: "speaking",
    name: "Speaking Practice",
    art: "domain-speaking.svg",
    text: "Students practice expressing ideas, using academic language, and building oral responses.",
  },
  {
    id: "reading",
    name: "Reading Practice",
    art: "domain-reading.svg",
    text: "Students read a short text, find the answer in it, and use guidance that points back to the words.",
  },
  {
    id: "writing",
    name: "Writing Practice",
    art: "domain-writing.svg",
    text: "Students write responses, use supports, read feedback, and improve their writing.",
  },
  {
    id: "growth",
    name: "Practice and Growth",
    icon: "growth",
    text: "Students build words and skills in games and studios, and see their progress over time.",
  },
];

/** One line per skill: how a teacher uses it in class (the Welcome card's "In your classroom" line). */
const CLASS_USE = {
  listening: "Listening practice works as a warm-up: play it, students choose, then share the detail that proved it.",
  speaking: "Speaking practice works as a warm-up or a partner response.",
  reading: "Reading practice works in a small group: read together, point to the sentence that proves the answer, then check.",
  writing: "Writing practice works as a short exit task or a guided paragraph.",
};

/** What the Experience step tells a teacher to do, and what the check gives back, for each skill. */
const TRY = {
  listening: {
    directions: "Press the activity’s Hear button, listen, then choose an answer and use the check button.",
    note: "Students can replay what they hear. The check points back to what to listen for. Nothing is scored.",
  },
  speaking: {
    directions: "Press the activity’s Record or Hear buttons, then answer the prompt.",
    note: "If the microphone is blocked, students can still say the answer aloud to a partner and type notes in the activity. Nothing is scored.",
  },
  reading: {
    directions: "Read the text and the prompt, choose an answer, then use the activity’s check button.",
    note: "The check points back to the text without giving the answer away. Nothing is scored.",
  },
  writing: {
    directions: "Read the prompt, type a sentence or two, then use the activity’s check button.",
    note: "The check names one thing to add or fix. Nothing is scored.",
  },
};

function peekHTML(D, S, id) {
  if (id === "growth")
    return html`<h3>
        ${icon("growth")}Practice and Growth: ${nameOf("wordlab")}, ${nameOf("games")} and
        ${nameOf("growth")}
      </h3>
      <p>
        <strong>Example:</strong> ${nameOf("wordlab")} lets students build, sort and use academic
        words. Students see their own progress in the ${nameOf("growth")} on their own device.
      </p>
      <p>
        <strong>In class:</strong> Use it for independent time after a speaking or writing lesson,
        or as a station.
      </p>
      <p class="t2-note">
        These pages stay on the main site. You can visit them after the tour; nothing here asks you
        to leave.
      </p>`;
  const { res, act } = exampleFor(D, S, id);
  if (!res || !act) return html`<p role="status">This example is loading…</p>`;
  return html`<h3>${icon(id)}${CARDS.find((c) => c.id === id).name}: ${res.title}</h3>
    <div class="t2-peek-body">
      ${pic(act)}
      <div>
        <p><strong>Students:</strong> ${act.directions}</p>
        <p><strong>Prompt:</strong> ${act.prompt}</p>
        <p><strong>In class:</strong> ${act.teacher?.use || "A short practice activity."}</p>
        <p class="t2-note">
          ${bandName(res.band)} · ${res.support} · about ${res.minutes} minutes. You will try this
          activity in Step 2.
        </p>
      </div>
    </div>`;
}

export function welcome(D, S, ui) {
  const used = [
    ["Activity library", `Find an activity by grade band, skill and support level.`],
    ["Launch Studio", `Make a student link, QR code and printable card.`],
    ["Activity Guide", `See how to use each featured activity.`],
    ["Whole-Class Studio", `Projector-ready routines for the whole class.`],
    ["My Passport", `Students keep their own practice record on their device.`],
  ];
  return {
    guide: guide({
      n: 1,
      minutes: 2,
      title: "Welcome! Here’s How The Language Page Works",
      objective:
        "see the kinds of practice on the site and choose the skill you want to use first.",
      directions: "Select a card to look inside. Then tell us what you want to use with students.",
      classroom:
        ui.peek === "growth"
          ? "Use practice time for words and skills students need again."
          : CLASS_USE[ui.peek] || CLASS_USE.speaking,
      extra: html`<div class="t2-field">
        ${seg({ label: "Which grades do you teach?", attr: "band", value: S.band, options: BANDS.map((b) => ({ id: b.id, name: b.name })) })}
      </div>`,
    }),
    stage: html` <ul class="t2-cards">
        ${CARDS.map(
          (c) =>
            html`<li>
              <button
                type="button"
                class="t2-card is-${c.id}"
                data-t2="peek"
                data-t2-value="${c.id}"
                aria-expanded="${String(ui.peek === c.id)}"
                aria-controls="t2Peek"
              >
                <span class="t2-card-art" aria-hidden="true"
                  >${c.art ? html`<img src="${ART}/${c.art}" alt="" width="160" height="100" loading="lazy" />` : html`<span class="t2-card-icon">${icon(c.icon)}</span>`}</span
                >
                <strong>${c.name}</strong>
                <span>${c.text}</span>
                <span class="t2-card-go"
                  >${ui.peek === c.id ? "Looking inside" : "See an example"}${icon("chevron-down")}</span
                >
              </button>
            </li>`,
        )}
      </ul>
      <section id="t2Peek" class="t2-peek" aria-live="polite">
        ${ui.peek ? peekHTML(D, S, ui.peek) : html`<p class="t2-note">Select a card to see a real activity from that part of the site.</p>`}
      </section>
      <details class="t2-more">
        <summary>What will I use most as a teacher?</summary>
        <ul>
          ${used.map(([n, t]) => html`<li><strong>${n}:</strong> ${t}</li>`)}
        </ul>
      </details>
      <div class="t2-ask">
        ${seg({
          label: "What would you most like to use with students?",
          attr: "focus",
          value: S.focus,
          options: [...DOMAINS.map((d) => ({ id: d.id, name: d.name })), { id: "all", name: "All four" }],
          hint: S.focus
            ? "Saved. We will start there in the next steps."
            : "Choose one to personalize the next steps.",
        })}
      </div>`,
  };
}

/* ── Step 2: Experience ── */

export function experience(D, S, ui) {
  const domain = S.tab;
  const { res, act } = exampleFor(D, S, domain);
  const sp = domain === "speaking";
  const makes = domainOf(domain)?.produce;
  return {
    guide: guide({
      n: 2,
      minutes: 3,
      title: "Try an Activity Just Like a Student",
      objective: makes
        ? "see what a student sees, does and produces."
        : "see what a student sees and does, and the guidance they get.",
      directions: TRY[domain].directions,
      classroom: act?.teacher?.use
        ? `Try this tomorrow: ${act.teacher.use}`
        : "Try this tomorrow: use it as a short warm-up, partner response, or guided practice.",
      extra: html`<dl class="t2-compare">
        <div>
          <dt>What students see</dt>
          <dd>
            The prompt,${act?.picture ? " a picture," : ""} directions, and supports they can open.
          </dd>
        </div>
        <div>
          <dt>What teachers do</dt>
          <dd>
            ${makes
              ? "Choose the task, model what a good answer sounds like, and look at what students produced."
              : "Choose the task, preview the key words, and use the guidance to see what to reteach."}
          </dd>
        </div>
      </dl>`,
    }),
    stage: html` <div class="t2-tabs" role="group" aria-label="Choose a skill to try">
        ${DOMAINS.map((d) => html`<button type="button" class="t2-tab" data-t2="set" data-t2-field="tab" data-t2-value="${d.id}" aria-pressed="${String(S.tab === d.id)}">${icon(d.id)}${d.name}</button>`)}
      </div>
      ${
        res
          ? html` <p class="t2-live-note">
                <strong>${res.title}</strong> · ${res.support} · about ${res.minutes} minutes.
                <span class="t2-pill"
                  >Preview: your answers here are not saved to this device’s progress.</span
                >
              </p>
              ${sp ? html`<p class="t2-mic" data-t2-mic role="status">Checking microphone access…</p>` : ""}
              ${frameHTML(res)}
              <p class="t2-note">
                ${TRY[domain].note}
                If the activity looks lost,
                <button type="button" class="t2-linkbtn" data-t2="reload-frame">
                  restart the preview</button
                >.
              </p>`
          : html`<p role="alert" class="t2-note is-alert">
              No ${domainName(domain)} activity is available for ${bandName(S.band)} yet.
            </p>`
      }`,
  };
}

/* ── Step 3: Support ── */

const bullets = (v) =>
  v.length > 1
    ? html`<ul>
        ${v.map((x) => html`<li>${x}</li>`)}
      </ul>`
    : html`<p>${v[0]}</p>`;
const TAGS = { added: "Added", changed: "Changed", removed: "Removed" };

export function support(D, S, ui) {
  const domain = S.tab;
  const { res, act } = exampleFor(D, S, domain);
  if (!res || !act)
    return {
      guide: guide({
        n: 3,
        minutes: 3,
        title: "One Activity. Different Language Supports.",
        objective: "see supports change while the goal stays the same.",
        directions: "",
        classroom: "",
      }),
      stage: html`<p role="alert" class="t2-note is-alert">
        No activity is available for this grade band yet.
      </p>`,
    };
  const profiles = profilesFor(act);
  const i = Math.max(
    0,
    PROFILES.findIndex((p) => p.id === S.profile),
  );
  const cur = profiles[i];
  const diff = diffProfiles(profiles[i - 1] || null, cur);
  const mark = {};
  for (const [k, v] of Object.entries({ added: diff.added, changed: diff.changed }))
    for (const l of v) mark[l] = k;
  const summary = [
    ["added", diff.added],
    ["changed", diff.changed],
    ["removed", diff.removed],
  ].filter(([, v]) => v.length);
  return {
    guide: guide({
      n: 3,
      minutes: 3,
      title: "One Activity. Different Language Supports.",
      objective: "choose supports that help students reach the same goal.",
      directions: "Switch between Starting, Growing and Expanding. Watch what changes.",
      classroom:
        "One class, one link: a newer English learner opens the frames and word bank, a growing student uses a starter and a hint, and an expanding student self-checks with the criteria and then elaborates.",
      extra: html`<div class="t2-delta" aria-live="polite">
        <h2>${cur.name}${i ? ` (compared with ${profiles[i - 1].name})` : ""}</h2>
        <ul>
          ${summary.map(([k, v]) => html`<li><span class="t2-badge is-${k}">${TAGS[k]}</span> ${v.join("; ")}</li>`)}
          <li><span class="t2-badge is-same">Unchanged</span> Learning goal: ${cur.goal}</li>
        </ul>
        <p class="t2-note">
          These are classroom support choices, not WIDA proficiency levels or scores.
        </p>
      </div>`,
    }),
    stage: html` <div class="t2-tabs" role="group" aria-label="Choose a task">
        ${DOMAINS.map((d) => html`<button type="button" class="t2-tab" data-t2="set" data-t2-field="tab" data-t2-value="${d.id}" aria-pressed="${String(S.tab === d.id)}">${icon(d.id)}${d.name}</button>`)}
      </div>
      ${seg({ label: "Language supports", attr: "profile", value: S.profile, options: PROFILES.map((p) => ({ id: p.id, name: p.name })), cls: "is-big" })}
      <article
        class="t2-sim"
        aria-label="Demonstration of the student screen with ${cur.name} supports"
      >
        <p class="t2-sim-tag">
          Demonstration built from “${res.title}”. Open the live activity in Step 2 to use it.
        </p>
        <p class="t2-sim-goal"><span>Goal for everyone</span>${cur.goal}</p>
        <div class="t2-sim-task">
          ${pic(act)}
          <div>
            <h3>${res.title}</h3>
            <p>${act.prompt}</p>
          </div>
        </div>
        <div class="t2-sim-sups">
          ${cur.items.map(
            (it) =>
              html`<section class="t2-sup ${mark[it.label] ? `is-${mark[it.label]}` : ""}">
                <h4>
                  ${it.label}${mark[it.label] ? html` <span class="t2-badge is-${mark[it.label]}">${TAGS[mark[it.label]]}</span>` : ""}
                </h4>
                ${bullets(it.value)}
              </section>`,
          )}
        </div>
        ${cur.expect ? html`<p class="t2-expect"><strong>What to expect:</strong> ${cur.expect}</p>` : ""}
      </article>`,
  };
}

/* ── Step 4: Implement ── */

function resultCard(D, S, res, ui) {
  const act = D.act(pickOf(res));
  const picked = sameResource(S.pick, res);
  const supports = act
    ? [
        act.frames?.length && `${act.frames.length} sentence frames`,
        act.wordBank?.length && `${act.wordBank.length}-word bank`,
        act.vocabulary?.length && `${act.vocabulary.length} vocabulary words`,
        act.hint && "hint",
        act.models && "model answers",
      ]
    : [];
  return html`<li class="t2-result ${picked ? "is-picked" : ""}">
    <h3>
      ${res.title}${picked ? html` <span class="t2-badge is-same">${icon("check")}In your lesson</span>` : ""}
    </h3>
    ${chips([domainName(res.domain), res.focus, `about ${res.minutes} min`, res.support])}
    <p><strong>Students:</strong> ${act?.prompt || res.focus}</p>
    <p>
      <strong>Use it for:</strong>
      ${WHY[S.finder.purpose]}${act?.teacher?.use ? ` ${act.teacher.use}` : ""}
    </p>
    <p class="t2-supports">
      <strong>Supports:</strong>
      ${supports.filter(Boolean).join(" · ") || "available inside the activity"}
    </p>
    <button type="button" class="btn btn-primary" data-t2="preview" data-t2-value="${res.key}">
      ${icon("play")}Preview<span class="visually-hidden">: ${res.title}</span>
    </button>
  </li>`;
}

export function implement(D, S, ui) {
  const f = S.finder;
  const domain = f.domain || focusDomain(S);
  const prev = ui.previewKey ? D.rows.find((r) => r.key === ui.previewKey) : null;
  const g = guide({
    n: 4,
    minutes: 3,
    title: "Find an Activity You Can Use Tomorrow",
    objective: "find a fitting activity, try it, and know how students will open it.",
    directions: prev
      ? "Try the activity. When you are ready, add it to your first lesson."
      : "Choose grades, a skill and a purpose. Then preview a result.",
    classroom:
      "Students open the link on any device. No student accounts. They choose their own help inside the activity.",
  });
  if (prev)
    return {
      guide: g,
      stage: html` <div class="t2-bar">
          <button type="button" class="btn" data-t2="close-preview" data-t2-value="${prev.key}">
            ${icon("arrow-left")}Back to My Resources
          </button>
          <p class="t2-live-note">
            <strong>${prev.title}</strong> · ${prev.support} · about ${prev.minutes} minutes
          </p>
        </div>
        ${frameHTML(prev)}
        <section class="t2-share" aria-labelledby="t2ShareTitle">
          <h2 id="t2ShareTitle">How students open it</h2>
          <ol class="t2-steps">
            <li>
              Copy the link and paste it where students already look (class page, chat or slides).
            </li>
            <li>
              Or show the QR code on the projector, or print the Student Activity Card from your
              lesson kit.
            </li>
            <li>Students open it on any device and start. They choose their own help.</li>
          </ol>
          ${linkBox(prev)}
        </section>
        <div class="t2-bar">
          <button
            type="button"
            class="btn btn-primary"
            data-t2="use-pick"
            data-t2-value="${prev.key}"
          >
            ${icon("check")}${sameResource(S.pick, prev) ? "In My First Lesson" : "Use This in My First Lesson"}
          </button>
        </div>`,
    };
  const recs = recommend(D.rows, { band: S.band, domain, purpose: f.purpose });
  return {
    guide: g,
    stage: html` <div class="t2-finder">
        ${seg({ label: "Grade band", attr: "band", value: S.band, options: BANDS.map((b) => ({ id: b.id, name: b.name })) })}
        ${seg({ label: "Focus", attr: "finder-domain", value: domain, options: DOMAINS.map((d) => ({ id: d.id, name: d.name })) })}
        ${seg({ label: "Purpose", attr: "finder-purpose", value: f.purpose, options: PURPOSES.map((p) => ({ id: p.id, name: p.name })), cls: "is-four" })}
      </div>
      <h2 class="t2-results-title" id="t2Results" tabindex="-1">
        ${recs.length} ${recs.length === 1 ? "activity" : "activities"} for ${bandName(S.band)}
        ${domainName(domain)} · ${PURPOSES.find((p) => p.id === f.purpose).name}
      </h2>
      <ul class="t2-results" aria-labelledby="t2Results">
        ${recs.length ? recs.map((r) => resultCard(D, S, r, ui)) : html`<li class="t2-note">No activities match. Try another purpose.</li>`}
      </ul>
      ${S.pick ? "" : html`<p class="t2-note">Preview a result, then choose <strong>Use This in My First Lesson</strong> to continue.</p>`}`,
  };
}

/* ── Step 5: Prepare ── */

export const SEQUENCE = [
  { id: "introduce", name: "Introduce" },
  { id: "model", name: "Model" },
  { id: "practice", name: "Practice" },
  { id: "check", name: "Check" },
  { id: "feedback", name: "Feedback" },
  { id: "revise", name: "Revise" },
];

export function prepare(D, S, ui) {
  const res = findRow(D.rows, S.pick);
  const act = res ? D.act(S.pick) : null;
  if (!res || !act)
    return {
      guide: guide({
        n: 5,
        minutes: 3,
        title: "See How It Fits Into Your Lesson",
        objective: "connect your activity to a lesson.",
        directions: "",
        classroom: "",
      }),
      stage: html`<p role="alert" class="t2-note is-alert">Choose an activity in Step 4 first.</p>`,
    };
  const L = buildLesson({
    res,
    act,
    minutes: 10,
    approach: PROFILES.find((p) => p.level === res.level)?.id || "mixed",
  });
  const doing = L.student.doing;
  const crit = L.evidence;
  const models = act.models || {};
  const step = SEQUENCE.some((s) => s.id === ui.seq) ? ui.seq : "introduce";
  const content = {
    introduce: {
      act: "Show students the goal in kid-friendly words, then read the prompt.",
      say: `“${L.target}”`,
      note: `Prompt: ${act.prompt}`,
    },
    model: {
      act: L.modelMove.act,
      say: L.modelMove.say,
      note: L.modelMove.note,
    },
    practice: {
      act: `Students open the link and ${doing} on their own device while you circulate.`,
      say: act.directions,
      note: `They use “${res.title}” (about ${res.minutes} minutes).`,
    },
    check: {
      act: L.checkAct,
      list: crit,
    },
    feedback: {
      act: "Name what worked, then one next step.",
      say: `“${L.feedback.praise}” Next step: “${L.feedback.next}”`,
    },
    revise: {
      act: "Students try again with one change.",
      say: L.feedback.revise,
      note:
        models.A && models.B
          ? `Example only: an illustrative first try, “${models.A}” becomes a revision, “${models.B}”`
          : act.hint
            ? `Hint students can use: ${act.hint}`
            : "",
    },
  }[step];
  const idx = SEQUENCE.findIndex((s) => s.id === step);
  return {
    guide: guide({
      n: 5,
      minutes: 3,
      title: "See How It Fits Into Your Lesson",
      objective: "connect your chosen activity to a real lesson sequence.",
      directions: "Move through the six parts. Each shows one thing you do.",
      classroom: `Your activity, ${res.title}, is the Practice part. The other five parts turn it from an online task into instruction.`,
    }),
    stage: html` <ol class="t2-seq" aria-label="Lesson sequence">
        ${SEQUENCE.map(
          (s, k) =>
            html`<li>
              <button
                type="button"
                class="t2-seq-btn ${k < idx ? "is-past" : ""}"
                data-t2="seq"
                data-t2-value="${s.id}"
                aria-pressed="${String(s.id === step)}"
              >
                <span aria-hidden="true">${k + 1}</span>${s.name}
              </button>
            </li>`,
        )}
      </ol>
      <section class="t2-seq-card" aria-live="polite">
        <h3>${SEQUENCE[idx].name}</h3>
        <p><strong>You:</strong> ${content.act}</p>
        ${content.say ? html`<blockquote>${content.say}</blockquote>` : ""}
        ${
          content.list
            ? html`<ul class="t2-check">
                ${content.list.map((c) => html`<li>${c}</li>`)}
              </ul>`
            : ""
        }
        ${content.note ? html`<p class="t2-note">${content.note}</p>` : ""}
        <div class="t2-bar">
          ${idx > 0 ? html`<button type="button" class="btn" data-t2="seq" data-t2-value="${SEQUENCE[idx - 1].id}">${icon("arrow-left")}${SEQUENCE[idx - 1].name}</button>` : ""}
          ${idx < SEQUENCE.length - 1 ? html`<button type="button" class="btn btn-primary" data-t2="seq" data-t2-value="${SEQUENCE[idx + 1].id}">${SEQUENCE[idx + 1].name}${icon("arrow-right")}</button>` : ""}
        </div>
      </section>
      ${
        idx === SEQUENCE.length - 1
          ? html`<section class="t2-ready" aria-label="Ready">
              <h2>${icon("check")}You’re Ready to Build Your First Lesson.</h2>
              <p>
                Your target, model, practice, evidence, feedback and revision are all connected to
                ${res.title}. Press <strong>Build My First Lesson</strong> below.
              </p>
            </section>`
          : ""
      }`,
  };
}
