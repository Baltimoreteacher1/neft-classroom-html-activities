// Year map, Co-plan and Move atlas views (pure string renderers; pathways.js wires events).

import { esc, kluPill } from "./pathways-util.js";

const KLU = ["Narrate", "Inform", "Explain", "Argue"];
const gradeWord = (label) => esc(label);

const unitLinks = (u) => `<div class="pw-links">
  <a href="${esc(u.route)}">Open unit</a>
  <a href="/family/bcpss/${encodeURIComponent(u.id)}">Family guide</a>
</div>`;

function unitCard(u, taught) {
  const tier3 = u.terms.filter((t) => t.tier === 3).map((t) => t.term);
  return `<li class="pw-unit">
    <label class="pw-check no-print">
      <input type="checkbox" data-taught="${esc(u.id)}" ${taught ? "checked" : ""} />
      <span>Mark taught<span class="pw-sr"> ${esc(u.subject)} Unit ${esc(u.unit_number)}</span></span>
    </label>
    <div class="pw-unit-body">
      <p class="pw-unit-num">Unit ${esc(u.unit_number)} ${kluPill(u.klu)}</p>
      <h4>${esc(u.title)}</h4>
      <p class="pw-move">${esc(u.move_name)}</p>
      <details>
        <summary>Starter, words and standards</summary>
        <p class="pw-eq">${esc(u.essential_question)}</p>
        <p class="pw-frame">${esc(u.frame)}</p>
        <p class="pw-small"><strong>Key words:</strong> ${esc(u.terms.map((t) => t.term).join(", "))}${tier3.length ? ` <span class="pw-muted">(${tier3.length} Tier 3)</span>` : ""}</p>
        <p class="pw-small"><strong>Standards:</strong> ${esc(u.standards.join(", "))}</p>
      </details>
      ${unitLinks(u)}
    </div>
  </li>`;
}

const kluBar = (mix, total) =>
  `<div class="pw-klu-bar" role="img" aria-label="${KLU.map((k) => `${mix[k] || 0} ${k}`).join(", ")}">
    ${KLU.filter((k) => mix[k]).map((k) => `<span class="pw-klu-seg pw-klu-${k.toLowerCase()}" style="flex:${mix[k]}">${esc(k)} ${mix[k]}</span>`).join("")}
  </div>
  <p class="pw-small pw-muted">Every unit practises one WIDA Key Language Use. ${total} units this year.</p>`;

export function renderYearMap(g, taughtMap) {
  const done = g.lanes.flatMap((l) => l.units).filter((u) => taughtMap[u.id]).length;
  const s = g.stats;
  return `
    <div class="pw-head-row">
      <h2>${gradeWord(g.label)} year at a glance</h2>
      <button type="button" class="pw-btn no-print" data-print>Print year map</button>
    </div>
    <ul class="pw-stats" aria-label="Year totals">
      <li><strong>${s.units}</strong> units</li>
      <li><strong>${s.tier3}</strong> Tier 3 words</li>
      <li title="${s.true_cognates} look-alike cognates; ${s.translation_only} have a Spanish word with no look-alike (translation only)."><strong>${s.true_cognates}</strong> of ${s.terms} words have a Spanish cognate <span class="pw-muted">(${s.translation_only} more have a Spanish translation only)</span></li>
      <li><strong>${s.moves_in_play}</strong> of ${s.moves_total} WIDA language moves in play</li>
    </ul>
    ${kluBar(g.klu, s.units)}
    <div class="pw-progress no-print">
      <progress id="pwProgress" max="${s.units}" value="${done}" aria-label="Units marked taught"></progress>
      <span id="pwProgressText">${done} of ${s.units} units marked taught on this device</span>
    </div>
    ${g.lanes
      .map(
        (lane) => `<section class="pw-lane" aria-labelledby="lane-${lane.subject.replace(/\W/g, "")}">
          <h3 id="lane-${lane.subject.replace(/\W/g, "")}">${esc(lane.subject)} <small>${esc(lane.curriculum)}</small></h3>
          <ol class="pw-units">${lane.units.map((u) => unitCard(u, taughtMap[u.id])).join("")}</ol>
        </section>`,
      )
      .join("")}`;
}

export function renderCoPlan(g) {
  if (!g.shared_moves.length) {
    return `<h2>${gradeWord(g.label)} co-planning</h2><p class="pw-muted">No WIDA language move is shared by two content areas this year.</p>`;
  }
  return `
    <div class="pw-head-row">
      <h2>${gradeWord(g.label)} co-planning</h2>
      <button type="button" class="pw-btn no-print" data-print>Print co-plan brief</button>
    </div>
    <p class="pw-lede">These ${g.shared_moves.length} language moves appear in two or more content areas this year. Teach each move once, then let every content teacher reuse the same anchor chart and sentence frame.</p>
    ${g.shared_moves
      .map(
        (m) => `<article class="pw-card pw-move-card">
          <header>
            <h3>${esc(m.move_name)} ${kluPill(m.klu)}</h3>
            <p class="pw-subjects">${m.subjects.map(esc).join(" · ")}</p>
          </header>
          <p class="pw-plan"><strong>Plan:</strong> ${esc(m.plan.teach_once)}</p>
          <div class="pw-anchor">
            <p class="pw-small pw-label-sm">Anchor frame (WIDA levels 3–4)</p>
            <p class="pw-frame">${esc(m.anchor.frame)}</p>
            ${m.anchor.word_bank.length ? `<p class="pw-small"><strong>Word bank:</strong> ${esc(m.anchor.word_bank.join(", "))}</p>` : ""}
            ${m.anchor.teacher_move ? `<p class="pw-small"><strong>Teacher move:</strong> ${esc(m.anchor.teacher_move)}</p>` : ""}
          </div>
          <ul class="pw-reinforce">
            ${m.units
              .map(
                (u) => `<li><a href="${esc(u.route)}"><strong>${esc(u.subject)} Unit ${esc(u.unit_number)}</strong>: ${esc(u.title)}</a>
                  <span class="pw-frame pw-frame-sm">${esc(u.frame)}</span></li>`,
              )
              .join("")}
          </ul>
        </article>`,
      )
      .join("")}`;
}

function moveJourney(move) {
  return `<article class="pw-card">
    <header><h3>${esc(move.move_name)} ${kluPill(move.klu)}</h3>
    <p class="pw-small pw-muted">${esc(move.syntax_pattern)}</p></header>
    <ol class="pw-journey">
      ${move.journey
        .map(
          (step) => `<li><strong class="pw-grade-tag">${esc(step.label)}</strong>
            <ul>${step.entries.map((e) => `<li><a href="${esc(e.route)}"><span class="pw-small">${esc(e.subject)} U${esc(e.unit_number)}</span></a> <span class="pw-frame pw-frame-sm">${esc(e.frame)}</span></li>`).join("")}</ul></li>`,
        )
        .join("")}
    </ol>
  </article>`;
}

function subjectSpiral(row) {
  return `<article class="pw-card">
    <header><h3>${esc(row.subject)} from Kindergarten to Grade 8</h3></header>
    <div class="pw-table-wrap"><table class="pw-table">
      <thead><tr><th scope="col">Grade</th><th scope="col">Units</th><th scope="col">Language moves</th><th scope="col">Tier 3 words</th><th scope="col">True Spanish cognates</th><th scope="col">First unit's sentence starter</th></tr></thead>
      <tbody>
        ${row.grades
          .map(
            (r) => `<tr><th scope="row">${esc(r.label)}</th><td>${r.units}</td>
              <td>${KLU.filter((k) => r.klu[k]).map((k) => `<span class="pw-klu pw-klu-${k.toLowerCase()}">${esc(k)} ${r.klu[k]}</span>`).join(" ")}</td>
              <td>${r.tier3}</td><td>${r.cognate_pct}%</td>
              <td>${r.signature ? `<a href="${esc(r.signature.route)}">${esc(r.signature.frame)}</a>` : ""}</td></tr>`,
          )
          .join("")}
      </tbody></table></div>
  </article>`;
}

export function renderAtlas(atlas, view, pick) {
  const options = view === "subject" ? atlas.spiral.map((s) => s.subject) : atlas.moves.map((m) => m.blueprint_id);
  const labelOf = (v) => (view === "subject" ? v : atlas.moves.find((m) => m.blueprint_id === v).move_name);
  const current = options.includes(pick) ? pick : options[0];
  const body =
    view === "subject"
      ? subjectSpiral(atlas.spiral.find((s) => s.subject === current))
      : moveJourney(atlas.moves.find((m) => m.blueprint_id === current));
  return `
    <h2>Move atlas</h2>
    <p class="pw-lede">See how a language move or a whole content area grows from Kindergarten to Grade 8.</p>
    <div class="pw-atlas-controls no-print">
      <div class="pw-seg" role="group" aria-label="Atlas view">
        <button type="button" data-atlas-view="move" aria-pressed="${view === "move"}">By language move</button>
        <button type="button" data-atlas-view="subject" aria-pressed="${view === "subject"}">By content area</button>
      </div>
      <label class="pw-select"><span>${view === "subject" ? "Content area" : "Language move"}</span>
        <select data-atlas-pick>${options.map((o) => `<option value="${esc(o)}" ${o === current ? "selected" : ""}>${esc(labelOf(o))}</option>`).join("")}</select>
      </label>
    </div>
    ${body}`;
}
