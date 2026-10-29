// Teacher Hub: Passport check-ins. A student or family sends a link; opening it adds the student here.
// Everything is read in this browser from the URL fragment (the server never sees it) and kept in this
// browser's storage. The paper passport stays the authoritative record: this list only says who to stamp.
import { CHECKIN_PARAM, decodeCheckin } from "/access-practice-lab/src/checkin.js";
import { ROSTER_KEY, addCheckin, markStamped, needsStamp, removeStudent, sanitizeRoster, waiting } from "/access-practice-lab/src/checkin-roster.js";
import { COUNTRIES } from "/access-practice-lab/src/journey.js";
import { announce, copyText, html, icon, toHtml } from "/access-practice-lab/src/util.js";

const host = document.getElementById("passportCheckins");
let roster = sanitizeRoster(read());
let notice = "";

function read() {
  try {
    return JSON.parse(localStorage.getItem(ROSTER_KEY) || "null");
  } catch {
    return null;
  }
}
function save() {
  try {
    localStorage.setItem(ROSTER_KEY, JSON.stringify(roster));
    return true;
  } catch {
    notice = "This browser could not save the list (storage may be full or blocked).";
    return false;
  }
}

const place = (key) => {
  const [domain, level] = key.split(":");
  return `${COUNTRIES[domain][level][0]} (${domain})`;
};
const lineFor = (r) => `${place(r.key)}: ${r.done} of ${r.total} stops, ${r.fresh} new`;

function importText(text) {
  const parts = String(text || "").split(/\s+/).filter(Boolean);
  const results = [];
  for (const part of parts) {
    try {
      const c = decodeCheckin(part);
      const out = addCheckin(roster, c);
      roster = out.roster;
      results.push(`${c.alias}: ${out.added} new stop${out.added === 1 ? "" : "s"}`);
    } catch (err) {
      results.push(err.message);
    }
  }
  save();
  notice = results.join(" · ") || "Paste a check-in link first.";
  render();
  announce(notice);
}

function stampListText() {
  return waiting(roster)
    .map(([, s]) => `${s.alias} (grades ${s.band}): ${needsStamp(s).map(lineFor).join("; ")}`)
    .join("\n");
}

function render() {
  const queue = waiting(roster);
  const all = Object.entries(roster.students);
  host.innerHTML = toHtml(html`
    <header class="th-sec-head"><div><h2 id="checkinsTitle">Passport check-ins <span class="th-count">(${queue.length} to stamp)</span></h2>
      <p class="fine">Students and families send a link from My Passport. Open it and the student appears here. This list stays in this browser; the paper passport remains the record.</p></div></header>
    <label class="field"><span>Paste check-in links (several are fine)</span>
      <textarea rows="2" data-checkin-text placeholder="Paste a check-in link here"></textarea></label>
    <div class="row-actions"><button type="button" class="btn btn-primary" data-checkin-add>Add check-ins</button>
      ${queue.length ? html`<button type="button" class="btn" data-checkin-list>${icon("copy")} Copy stamp list</button>` : ""}
      ${all.length ? html`<button type="button" class="ghost danger" data-checkin-clear>Remove everyone</button>` : ""}</div>
    <p class="fine" role="status" data-checkin-note>${notice}</p>
    ${queue.length
      ? html`<div class="lab-table-wrap"><table class="hub-table"><thead><tr><th scope="col">Student</th><th scope="col">Stamp these</th><th scope="col">Last check-in</th><th scope="col">Actions</th></tr></thead><tbody>
          ${queue.map(([id, s]) => html`<tr><th scope="row">${s.alias}<span class="fine"> · grades ${s.band}</span></th>
            <td><ul>${needsStamp(s).map((r) => html`<li>${lineFor(r)}</li>`)}</ul></td><td>${s.date}</td>
            <td class="row-actions"><button type="button" class="btn small btn-primary" data-checkin-stamped="${id}">Mark stamped</button>
            <button type="button" class="ghost danger small" data-checkin-remove="${id}">Remove</button></td></tr>`)}
        </tbody></table></div>`
      : html`<p>${all.length ? "Everyone is stamped up to their latest check-in." : "No check-ins yet. When a student sends one, it appears here."}</p>`}
    ${all.length > queue.length
      ? html`<details><summary>Stamped students (${all.length - queue.length})</summary><ul>${all.filter(([, s]) => !needsStamp(s).length).map(([id, s]) => html`<li>${s.alias} · grades ${s.band} · ${s.date} <button type="button" class="ghost danger small" data-checkin-remove="${id}">Remove</button></li>`)}</ul></details>`
      : ""}
    <p class="fine">A check-in is a note from the student's device, not proof. Stamp after you have seen the work.</p>`);
}

host.addEventListener("click", (e) => {
  const t = e.target;
  if (t.closest("[data-checkin-add]")) return importText(host.querySelector("[data-checkin-text]").value);
  const stamped = t.closest("[data-checkin-stamped]");
  if (stamped) roster = markStamped(roster, stamped.dataset.checkinStamped);
  const remove = t.closest("[data-checkin-remove]");
  if (remove) roster = removeStudent(roster, remove.dataset.checkinRemove);
  if (t.closest("[data-checkin-clear]") && window.confirm("Remove every Passport check-in from this browser?")) roster = sanitizeRoster(null);
  if (t.closest("[data-checkin-list]")) {
    copyText(stampListText()).then((ok) => {
      notice = ok ? "Stamp list copied." : "Copy was unavailable.";
      render();
    });
    return;
  }
  if (stamped || remove || t.closest("[data-checkin-clear]")) {
    save();
    notice = "";
    render();
  }
});

/** A link opened straight from a student's message: #checkin=… */
function takeFragment() {
  if (!location.hash.startsWith(`#${CHECKIN_PARAM}=`)) return;
  const fragment = location.hash.slice(1);
  history.replaceState(null, "", location.pathname + location.search);
  importText(fragment);
  host.scrollIntoView({ block: "start" });
}

render();
takeFragment();
window.addEventListener("hashchange", takeFragment);
