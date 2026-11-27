// Plan & Respond — innovation reserve (two prototypes, labelled as such on screen):
//   Station rotation: turn the unit's own activities into a rotation chart for small groups, with a printable station card each.
//   Spiral warm-up: the unit's five review questions from earlier units, playable on screen or printable with a key.
// Both read only the unit's authored content. No student data is used or stored.

import { buildCatalog, spiralItems } from "./companion-data.js";
import { doc, FOOT, openPrint, unitLine } from "./companion-print.js";
import { esc, vstate } from "./util.js";
import { domainIcon, rotationSvg } from "./visuals.js";

const SID = "stations";
const QID = "quick";
const ORDER = ["Reading", "Writing", "Speaking", "Listening"];

/** A rotation chart and one station per language domain. Pure; swap[domain] picks a different activity in that domain. */
export function buildStations(detail, level, { n = 4, minutes = 12, swap = {} } = {}) {
  const catalog = buildCatalog(detail, level).filter((i) => i.type === "activity");
  const domains = ORDER.slice(0, n);
  const used = new Set();
  const stations = domains.map((domain) => {
    const pool = catalog.filter((i) => i.domain === domain);
    const pick = pool.length
      ? pool[(swap[domain] || 0) % pool.length]
      : catalog.find((i) => !used.has(i.id));
    if (pick) used.add(pick.id);
    const act = pick ? detail.studio.activities[Number(pick.id.split("-")[1]) - 1] : null;
    return {
      domain,
      title: pick?.title || `${domain} station`,
      note: pick?.note || "",
      mission: act?.mission || "",
      support: act?.support?.[`l${level}`] || "",
      minutes: pick?.minutes || minutes,
      grouping: pick?.grouping || "",
      play: pick?.play || "",
      alternatives: pool.length,
    };
  });
  const groups = Array.from({ length: n }, (_, g) => String.fromCharCode(65 + g));
  const rounds = Array.from({ length: n }, (_, r) => ({
    round: r + 1,
    cells: groups.map((_, g) => (g + r) % n),
  }));
  return { groups, rounds, stations, minutes, total: n * (minutes + 2) };
}

function stationsHtml(plan) {
  return `
    <table class="cp-table"><caption class="cp-muted">Who goes where. Each group visits every station.</caption>
      <thead><tr><th scope="col">Round</th>${plan.groups.map((g) => `<th scope="col">Group ${g}</th>`).join("")}</tr></thead>
      <tbody>${plan.rounds.map((r) => `<tr><th scope="row">${r.round}</th>${r.cells.map((c) => `<td>${esc(plan.stations[c].domain)}</td>`).join("")}</tr>`).join("")}</tbody>
    </table>
    <p class="cp-muted">${plan.groups.length} rounds of ${plan.minutes} minutes plus 2 minutes to move: about ${plan.total} minutes.</p>`;
}

export function renderStations(st, detail) {
  const vs = vstate(st, SID, { n: 4, minutes: 12, swap: {}, round: 0 });
  const plan = buildStations(detail, st.level, vs);
  const round = Math.min(vs.round || 0, plan.rounds.length - 1);
  const chip = (act, arg, label, on) =>
    `<button type="button" class="cp-chip" data-cp-act="${SID}:${act}" data-cp-arg="${arg}" aria-pressed="${on}">${label}</button>`;
  return `
    <div class="cp-stations">
      <p class="cp-note"><b>Prototype.</b> Built from this unit's activities. You choose the groups. Nothing about students is used or saved.</p>
      <div class="cp-two">
        <fieldset class="cp-field"><legend>Stations</legend><div class="cp-chiprow cp-chiprow--tight">${[3, 4].map((n) => chip("n", n, `${n} stations`, vs.n === n)).join("")}</div></fieldset>
        <fieldset class="cp-field"><legend>Minutes at each station</legend><div class="cp-chiprow cp-chiprow--tight">${[10, 12, 15].map((m) => chip("min", m, `${m} min`, vs.minutes === m)).join("")}</div></fieldset>
      </div>
      <div class="cp-card"><h4>Where each group is</h4>
        <div class="cp-chiprow cp-chiprow--tight" role="group" aria-label="Round">${plan.rounds.map((r, i) => chip("round", i, `Round ${r.round}`, i === round)).join("")}</div>
        ${rotationSvg(plan, round)}</div>
      ${stationsHtml(plan)}
      <div class="cp-groups">${plan.stations
        .map(
          (
            s,
          ) => `<div class="cp-card"><h4><span aria-hidden="true">${domainIcon(s.domain)}</span> ${esc(s.domain)}: ${esc(s.title)}</h4><p>${esc(s.mission)}</p>${s.support ? `<p class="cp-muted"><b>Support:</b> ${esc(s.support)}</p>` : ""}<p class="cp-muted">${[s.grouping, `${s.minutes} min`].filter(Boolean).join(" · ")}</p>
        <div class="cp-actions">${s.play ? `<a class="cp-btn cp-btn--solid" href="${esc(s.play)}" target="_blank" rel="noopener">Open the activity</a>` : ""}${s.alternatives > 1 ? `<button type="button" class="cp-btn" data-cp-act="${SID}:swap" data-cp-arg="${esc(s.domain)}">Try a different ${esc(s.domain.toLowerCase())} activity</button>` : ""}</div></div>`,
        )
        .join("")}</div>
      <button type="button" class="cp-btn cp-btn--solid" data-cp-act="${SID}:print">Print the rotation and station cards</button>
    </div>`;
}

export function actStations(st, action, arg, ctx) {
  const vs = vstate(st, SID, {});
  if (action === "n") {
    vs.n = Number(arg);
    vs.round = 0;
  }
  else if (action === "min") vs.minutes = Number(arg);
  else if (action === "round") vs.round = Number(arg);
  else if (action === "swap") vs.swap[arg] = (vs.swap[arg] || 0) + 1;
  else if (action === "print") {
    openPrint(
      stationsDoc(ctx.detail.unit, buildStations(ctx.detail, st.level, vs)),
      `stations-${ctx.detail.unit.id}.html`,
    );
    return false;
  } else return false;
  return true;
}

export function stationsDoc(unit, plan) {
  const head = `<div class="head"><div><h1>Station rotation</h1><div class="meta">${unitLine(unit)} · Teacher copy</div></div></div>`;
  const chart = `<table style="border-collapse:collapse;width:100%"><tr><th style="border:1pt solid #111;padding:4pt">Round</th>${plan.groups.map((g) => `<th style="border:1pt solid #111;padding:4pt">Group ${g}</th>`).join("")}</tr>${plan.rounds.map((r) => `<tr><td style="border:1pt solid #111;padding:4pt"><b>${r.round}</b></td>${r.cells.map((c) => `<td style="border:1pt solid #111;padding:4pt">${esc(plan.stations[c].domain)}</td>`).join("")}</tr>`).join("")}</table><p class="small">${plan.minutes} minutes at each station plus 2 to move: about ${plan.total} minutes.</p>`;
  const cards = plan.stations
    .map(
      (s) =>
        `<div class="step" style="break-before:page"><h3><span>${esc(s.domain)} station: ${esc(s.title)}</span><small>${s.minutes} min</small></h3><p>${esc(s.mission)}</p>${s.support ? `<p class="small"><b>Support:</b> ${esc(s.support)}</p>` : ""}<p class="small">${esc(s.grouping)}</p></div>`,
    )
    .join("");
  return doc(`Station rotation - ${unit.unit_title}`, head + chart + cards, FOOT);
}

// ── Spiral warm-up ──────────────────────────────────────────────────────────

export function renderQuick(st, detail) {
  const vs = vstate(st, QID, { answers: {} });
  const items = spiralItems(detail);
  if (!items.length) return `<p class="cp-note">This unit has no spiral review questions yet.</p>`;
  const right = items.filter((q, i) => vs.answers[i] === q.answer_index).length;
  const done = Object.keys(vs.answers).length;
  return `
    <div class="cp-quick">
      <p class="cp-note"><b>Prototype.</b> A five-minute warm-up from earlier units. Answers are checked on this device and are not saved or graded.</p>
      ${items
        .map((q, i) => {
          const picked = vs.answers[i];
          return `<fieldset class="cp-field"><legend>${i + 1}. ${esc(q.prompt)}</legend><div class="cp-chiprow">${q.options.map((o, oi) => `<button type="button" class="cp-chip" data-cp-act="${QID}:ans" data-cp-arg="${i}:${oi}" aria-pressed="${picked === oi}">${esc(o)}</button>`).join("")}</div>${picked === undefined ? "" : `<p class="cp-note" role="status">${picked === q.answer_index ? "Yes." : `Not quite. The answer is ${esc(q.answer)}.`}${q.from ? ` <span class="cp-muted">From: ${esc(q.from)}.</span>` : ""}</p>`}</fieldset>`;
        })
        .join("")}
      ${done === items.length ? `<p class="cp-say" role="status">${right} of ${items.length} right. Talk about the ones that were tricky.</p>` : ""}
      <div class="cp-actions"><button type="button" class="cp-btn cp-btn--solid" data-cp-act="${QID}:print">Print the warm-up with a key</button><button type="button" class="cp-btn" data-cp-act="${QID}:reset">Start over</button></div>
    </div>`;
}

export function actQuick(st, action, arg, ctx) {
  const vs = vstate(st, QID, { answers: {} });
  if (action === "ans") {
    const [i, o] = arg.split(":").map(Number);
    vs.answers[i] = o;
    return true;
  }
  if (action === "reset") {
    vs.answers = {};
    return true;
  }
  if (action === "print") {
    openPrint(warmupDoc(ctx.detail), `warmup-${ctx.detail.unit.id}.html`);
  }
  return false;
}

export function warmupDoc(detail) {
  const unit = detail.unit;
  const items = spiralItems(detail);
  const qs = items
    .map(
      (q, i) =>
        `<div class="step"><p><b>${i + 1}. ${esc(q.prompt)}</b></p>${q.options.map((o) => `<p>☐ ${esc(o)}</p>`).join("")}</div>`,
    )
    .join("");
  const key = items
    .map(
      (q, i) =>
        `<li>${i + 1}. ${esc(q.answer)}${q.from ? ` <span class="small">(${esc(q.from)})</span>` : ""}</li>`,
    )
    .join("");
  return doc(
    `Warm-up - ${unit.unit_title}`,
    `<div class="head"><div><h1>Warm-up</h1><div class="meta">${unitLine(unit)}</div></div><div class="name">Name <span></span></div></div>${qs}<h2 style="break-before:page">Teacher key</h2><ol style="list-style:none;padding:0">${key}</ol>`,
    FOOT,
  );
}
