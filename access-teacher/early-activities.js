// Teacher Hub: Kindergarten, Grade 1 and Grades 2-3 practice is made of the lab's audio-first activities, not of
// assessment-engine sets, so the engine panels (content library, assignment builder) show it from the lab's activity
// index instead. Every row names its grade band and says it is audio-first. One module, two panels.
import { h } from "/access-practice-lab/src/acc/engine/dom.js";
import { ASSIGN_DOMAINS, assignableActivities } from "/access-practice-lab/src/class/assign.js";
import { BAND_INFO, isEarlyBand } from "/access-practice-lab/src/bands.js";

export { isEarlyBand };

export async function loadLabIndex() {
  const res = await fetch("/access-practice-lab/content/index.json");
  if (!res.ok) throw new Error("index");
  return res.json();
}

/** One select of the four skills; calls onChange(domain). */
export function skillSelect(doc, id, value, onChange) {
  const s = h(doc, "select", { id, class: "acc-select" }, ...ASSIGN_DOMAINS.map((d) => h(doc, "option", { value: d, text: d })));
  s.value = value;
  s.addEventListener("change", () => onChange(s.value));
  return h(doc, "label", { class: "acc-field", for: id }, h(doc, "span", { text: "Skill" }), s);
}

/** "Kindergarten · audio-first · Level A · Reading" under an activity title. */
export const rowMeta = (row, domain) => `${BAND_INFO[row.band].label} · ${row.audioFirst ? "audio-first · " : ""}Level ${row.level} · ${domain}`;

const note = (doc, band) =>
  h(doc, "p", { class: "acc-state is-info", role: "note", "data-early-note": "" },
    `${BAND_INFO[band].label} practice is audio-first: learners hear each question and every choice. It is made of lab activities, not assessment-engine sets, so it is listed here from the activity index.${BAND_INFO[band].hostedByAdult ? " Kindergarten is adult-hosted." : ""}`);

/** Content library view of one early band: its activities for one skill, each with a link to open it. */
export function earlyBrowse(doc, index, band, domain, onDomain) {
  const rows = assignableActivities(index, band, domain);
  return h(doc, "div", { "data-early-browse": band },
    note(doc, band),
    h(doc, "div", { class: "acc-filters" }, skillSelect(doc, "eSkill", domain, onDomain)),
    h(doc, "p", { class: "acc-hint", role: "status", text: `${BAND_INFO[band].label}: ${rows.length} ${domain} ${rows.length === 1 ? "activity" : "activities"}.` }),
    rows.length
      ? h(doc, "ul", { class: "acc-item-list" }, ...rows.map((r) => h(doc, "li", { class: "acc-item-row" },
          h(doc, "p", { class: "acc-item-stem", lang: "en", "data-i18n-skip": "", text: r.title }),
          h(doc, "p", { class: "acc-hint", text: rowMeta(r, domain) }),
          h(doc, "div", { class: "acc-actions" }, h(doc, "a", { class: "acc-btn", href: r.path, text: "Open activity" })))))
      : h(doc, "p", { class: "acc-state is-empty", text: "No activities for this skill." }));
}

/**
 * Assignment builder view of one early band: pick a skill and an activity, copy the student link or save it with the
 * others. `link` and `save` come from the panel so the saved list stays one list.
 */
export function earlyAssign(doc, index, band, state, { draw, save, status }) {
  const rows = assignableActivities(index, band, state.earlyDomain);
  const pick = h(doc, "select", { id: "asActivity", class: "acc-select" }, ...rows.map((r, n) => h(doc, "option", { value: String(n), lang: "en", "data-i18n-skip": "", text: `Level ${r.level} · ${r.title}${r.audioFirst ? " · audio-first" : ""}` })));
  pick.value = String(Math.min(state.earlyPick, Math.max(0, rows.length - 1)));
  pick.addEventListener("change", () => ((state.earlyPick = Number(pick.value)), draw()));
  const row = rows[Number(pick.value)];
  const link = row ? location.origin + row.path : "";
  const copy = h(doc, "button", { type: "button", class: "acc-btn primary", "data-act": "copy-assign", disabled: !link, text: "Copy student link" });
  copy.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(link);
      status.textContent = "Link copied. Share it however you share class links.";
    } catch {
      status.textContent = link;
    }
  });
  const saveBtn = h(doc, "button", { type: "button", class: "acc-btn", "data-act": "save-assign", disabled: !link, text: "Save on this device" });
  saveBtn.addEventListener("click", () => save({ title: row.title, link, count: 1 }));
  return [
    note(doc, band),
    h(doc, "div", { class: "acc-filters" },
      skillSelect(doc, "asSkill", state.earlyDomain, (d) => ((state.earlyDomain = d), (state.earlyPick = 0), draw())),
      h(doc, "label", { class: "acc-field", for: "asActivity" }, h(doc, "span", { text: "Activity" }), pick)),
    row ? h(doc, "p", { class: "acc-hint", id: "asCountMsg", text: rowMeta(row, state.earlyDomain) }) : h(doc, "p", { class: "acc-state is-empty", text: "No activities for this skill." }),
    h(doc, "div", { class: "acc-actions no-print" }, copy, saveBtn),
  ];
}
