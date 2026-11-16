// Teacher Hub reader: "Language Expeditions: lands stamped" (feature "teacher"). One row per learner who shared a code
// with expedition stamps. It shows where they practiced in their latest expedition, never a level or a score.
// Older share codes carry no expedition field and simply do not appear here.
import { LANDS } from "/access-practice-lab/src/games/language-expeditions-stamps.js";
import { html } from "/access-practice-lab/src/util.js";

const NAMES = { listening: "Listening", reading: "Reading", speaking: "Speaking", writing: "Writing" };

const cell = (row) => {
  if (!row) return html`<td><span class="fine">—</span></td>`;
  const stops = row.of ? `${row.stops} of ${row.of} ${row.of === 1 ? "stop" : "stops"}` : "";
  if (row.stamp) return html`<td><strong>Stamped</strong>${stops ? html` <span class="fine">· ${stops}</span>` : ""}</td>`;
  return html`<td>${row.stops ? stops : html`<span class="fine">Not visited</span>`}</td>`;
};

/** @param {{alias:string, section:string, expeditions?:{lands:{land:string}[], gear?:number, words?:number}|null}[]} students */
export function expeditionsTable(students) {
  const rows = students.filter((s) => s?.expeditions?.lands?.length);
  if (!rows.length) return "";
  const extra = rows.some((s) => Number.isInteger(s.expeditions.gear) || Number.isInteger(s.expeditions.words));
  return html`<section class="panel ev-expeditions" aria-labelledby="evExpTitle">
    <h3 id="evExpTitle">Language Expeditions: lands stamped</h3>
    <div class="lab-table-wrap" tabindex="0" role="region" aria-label="Language Expeditions: lands stamped">
      <table class="hub-table">
        <thead>
          <tr>
            <th scope="col">Student</th>
            <th scope="col">Section</th>
            ${LANDS.map((land) => html`<th scope="col">${NAMES[land]}</th>`)}
            <th scope="col">Gathered</th>
            ${extra ? html`<th scope="col">Gear / words</th>` : ""}
          </tr>
        </thead>
        <tbody>
          ${rows.map((s) => {
            const by = Object.fromEntries(s.expeditions.lands.map((r) => [r.land, r]));
            const got = s.expeditions.lands.reduce((n, r) => n + (r.got || 0), 0);
            return html`<tr>
              <th scope="row" class="t-title">${s.alias}</th>
              <td>${s.section}</td>
              ${LANDS.map((land) => cell(by[land]))}
              <td>${got}</td>
              ${extra ? html`<td>${[s.expeditions.gear, s.expeditions.words].map((n) => (Number.isInteger(n) ? n : "—")).join(" / ")}</td>` : ""}
            </tr>`;
          })}
        </tbody>
      </table>
    </div>
    <p class="fine">
      A stamp shows where a student practiced in their latest expedition. Stamps and gathered items are counted, not
      scored, and they never show a proficiency level.
    </p>
  </section>`;
}
