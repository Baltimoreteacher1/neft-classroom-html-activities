// Plan & Respond — "Today's lesson": one class period assembled from this unit's own pieces (spiral warm-up, word game,
// shared reading, the subject lab or an activity, partner talk with frames, the exit ticket). Each step opens the view that
// runs it. Printable as a one-page plan. No student data.

import { buildCatalog, spiralItems } from "./companion-data.js";
import { blanks as printBlanks, doc, FOOT, openPrint, unitLine } from "./companion-print.js";
import { labsFor } from "./labs.js";
import { blanks, esc, vstate } from "./util.js";

const ID = "day";

/** A plan whose step minutes add up to exactly `minutes` (45 or 60). Pure. */
export function buildDayPlan(detail, level, minutes = 45) {
  const s = detail.studio;
  const lk = `l${level}`;
  const lab = labsFor(detail)[0];
  const activity = buildCatalog(detail, level).find(
    (i) => i.type === "activity" && ["Speaking", "Writing"].includes(i.domain),
  );
  const steps = [
    spiralItems(detail).length
      ? {
          id: "warm",
          title: "Warm-up",
          minutes: 5,
          view: "quick",
          text: "Five review questions from earlier units. Students answer on whiteboards, then check together.",
        }
      : {
          id: "warm",
          title: "Warm-up",
          minutes: 5,
          view: "words",
          text: "Show one word card. Students tell a partner what they remember about it.",
        },
    {
      id: "words",
      title: "Word game",
      minutes: 8,
      view: "guess",
      text: `Play Guess my word with three of the unit's words: ${s.vocab
        .slice(0, 3)
        .map((v) => v.term)
        .join(", ")}.`,
    },
    {
      id: "read",
      title: "Read together",
      minutes: 10,
      view: "text",
      text: `Read “${detail.reading.title}” one sentence at a time. Ask question 1 and find the evidence together.`,
    },
    { id: "lab", title: lab.title, minutes: 10, view: "labs", text: lab.hint },
    {
      id: "talk",
      title: "Partner talk",
      minutes: 6,
      view: "practice",
      text: `Partners answer: ${s.essential_question}`,
      frame: s.frames[lk]?.[0] || "",
    },
    {
      id: "exit",
      title: "Exit ticket",
      minutes: 6,
      view: "check",
      text: s.exit_ticket.prompt,
      frame: s.exit_ticket.frame,
    },
  ];
  if (minutes >= 60 && activity)
    steps.splice(4, 0, {
      id: "activity",
      title: activity.title,
      minutes: 15,
      play: activity.play || "",
      text: activity.note || `${activity.domain} activity`,
    });
  else if (minutes >= 60) steps[3].minutes += 15;
  return {
    unit: detail.unit,
    minutes: steps.reduce((n, x) => n + x.minutes, 0),
    goals: { content: s.can_do.content, language: s.can_do.language },
    question: s.essential_question,
    steps,
  };
}

export function render(st, detail) {
  const vs = vstate(st, ID, { minutes: 45 });
  const plan = buildDayPlan(detail, st.level, vs.minutes);
  let clock = 0;
  return `
    <div class="cp-day">
      <div class="cp-card cp-card--lead">
        <p class="cp-eyebrow">Today's lesson</p><p class="cp-question">${esc(plan.question)}</p>
        <div class="cp-goals"><div><h4>Content goal</h4><p>${esc(plan.goals.content)}</p></div><div><h4>Language goal</h4><p>${esc(plan.goals.language)}</p></div></div>
      </div>
      <fieldset class="cp-field"><legend>Class length</legend><div class="cp-chiprow cp-chiprow--tight">${[45, 60].map((m) => `<button type="button" class="cp-chip" data-cp-act="${ID}:min" data-cp-arg="${m}" aria-pressed="${vs.minutes === m}">${m} minutes</button>`).join("")}</div></fieldset>
      <div class="cp-timeline" role="img" aria-label="${esc(plan.steps.map((x) => `${x.title} ${x.minutes} minutes`).join(", "))}">${plan.steps.map((x) => `<span style="flex:${x.minutes}" title="${esc(x.title)}">${esc(x.title)}</span>`).join("")}</div>
      <ol class="cp-steps">${plan.steps
        .map((x) => {
          const at = clock;
          clock += x.minutes;
          return `<li class="cp-step"><div class="cp-step-head"><b>${esc(x.title)}</b><span>${at}–${clock} min</span></div><p>${esc(x.text)}</p>${x.frame ? `<p><b>Frame:</b> ${blanks(x.frame)}</p>` : ""}${x.view ? `<button type="button" class="cp-btn" data-cp-view="${x.view}">Open</button>` : ""}${x.play ? `<a class="cp-btn" href="${esc(x.play)}" target="_blank" rel="noopener">Open the activity</a>` : ""}</li>`;
        })
        .join("")}</ol>
      <button type="button" class="cp-btn cp-btn--solid" data-cp-act="${ID}:print">Print this plan</button>
    </div>`;
}

export function act(st, action, arg, ctx) {
  const vs = vstate(st, ID, { minutes: 45 });
  if (action === "min") {
    vs.minutes = Number(arg);
    return true;
  }
  if (action === "print")
    openPrint(
      dayPlanDoc(buildDayPlan(ctx.detail, st.level, vs.minutes)),
      `lesson-${ctx.detail.unit.id}.html`,
    );
  return false;
}

export function dayPlanDoc(plan) {
  let clock = 0;
  const steps = plan.steps
    .map((x) => {
      const at = clock;
      clock += x.minutes;
      return `<div class="step"><h3><span>${esc(x.title)}</span><small>${at}–${clock} min</small></h3><p>${esc(x.text)}</p>${x.frame ? `<p class="small"><b>Frame:</b> ${printBlanks(x.frame)}</p>` : ""}</div>`;
    })
    .join("");
  const body = `<div class="head"><div><h1>Today's lesson</h1><div class="meta">${unitLine(plan.unit)} · ${plan.minutes} minutes</div></div><div class="name">Teacher copy</div></div>
    <p class="q">${esc(plan.question)}</p><p class="small"><b>Content goal:</b> ${esc(plan.goals.content)}<br><b>Language goal:</b> ${esc(plan.goals.language)}</p>${steps}`;
  return doc(`Today's lesson - ${plan.unit.unit_title}`, body, FOOT);
}
