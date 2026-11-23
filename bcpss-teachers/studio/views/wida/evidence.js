// Class results from pasted evidence codes. Anonymous and device-local: codes hold no names and no writing.
// Codes can be kept with a class (shared with the Classes page) or read for this visit only.
import {
  addClassEvidence,
  classEvidence,
  clearClassEvidence,
  decodeCode,
} from "../../core/evidence.js";
import { h } from "../../core/dom.js";
import { MIN_ATTEMPTS } from "../../core/wida-path.js";
import { TIERS } from "../../data/taxonomy.js";
import { aggregate, taskNote } from "./aggregate.js";

const plural = (n, one, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;
const SIGNAL = {
  support: "More language support likely needed",
  steady: "Steady with current supports",
  ready: "Ready to try fewer supports",
  unknown: "Not enough practice yet",
};

function indicator(t) {
  if (t.n < MIN_ATTEMPTS)
    return `${plural(t.n, "attempt")} so far. ${MIN_ATTEMPTS} are needed before this shows a pattern.`;
  if (!t.scored)
    return `${plural(t.n, "attempt")}. Speaking and writing tasks record completion and hints only.`;
  return `${t.correct} of ${t.scored} items answered correctly across ${plural(t.n, "attempt")}; ${t.hints} ${t.hints === 1 ? "hint" : "hints"} used.`;
}

function taskRows(col, titles) {
  return h(
    "ul",
    { class: "st-wida-taskrows" },
    col.tasks.map((t) =>
      h(
        "li",
        {},
        h("strong", {}, titles?.[t.id] || t.id),
        h("span", {}, indicator(t)),
        taskNote(t) ? h("em", {}, taskNote(t)) : null,
        t.tags.length
          ? h("small", {}, `Slips tagged: ${t.tags.map(([k, n]) => `${k} (${n})`).join(", ")}`)
          : null,
      ),
    ),
  );
}

/** Render the summary into `box`. `lookup(aid)` -> { title, tasks:{id:title} } or null. */
export function paintSummary(box, attempts, { domainOf, lookup }) {
  const a = aggregate(attempts, { domainOf });
  box.replaceChildren();
  if (!a.total) {
    box.append(
      h(
        "p",
        { class: "st-hint" },
        "No WIDA practice evidence yet. Paste codes above after students finish a practice.",
      ),
    );
    return a;
  }
  box.append(
    h(
      "p",
      { class: "st-wida-total", role: "status" },
      `${plural(a.total, "practice attempt")} counted. `,
      TIERS.filter((t) => a.tiers[t.id])
        .map((t) => `${t.short}: ${a.tiers[t.id]}`)
        .join("; "),
      a.captions ? `. Captions used in ${plural(a.captions, "attempt")}.` : ".",
    ),
    h(
      "div",
      { class: "st-wida-domains" },
      a.domains.map((d) =>
        h(
          "article",
          {
            class: "st-card st-wida-domain",
            "data-domain": d.domain,
            "data-enough": String(d.enough),
          },
          h("h3", {}, d.domain),
          h("p", { class: "st-wida-signal" }, SIGNAL[d.signal]),
          h("p", { class: "st-hint" }, d.statement),
        ),
      ),
    ),
  );
  for (const col of a.collections) {
    const info = lookup(col.aid);
    box.append(
      h(
        "section",
        { class: "st-wida-colsum" },
        h("h3", {}, info?.title || col.aid),
        h(
          "p",
          { class: "st-hint" },
          `${col.domain || "WIDA practice"}: ${plural(col.attempts, "attempt")}${col.enough ? "" : `. ${MIN_ATTEMPTS} are needed before patterns show`}.`,
        ),
        taskRows(col, info?.tasks),
      ),
    );
  }
  if (a.ignored)
    box.append(
      h(
        "p",
        { class: "st-hint" },
        `${plural(a.ignored, "code")} came from other activities and ${a.ignored === 1 ? "was" : "were"} not counted here.`,
      ),
    );
  box.append(
    h(
      "p",
      { class: "st-wida-disclaimer" },
      "Instructional indicators from practice only. Not a WIDA score, not an ACCESS prediction, and not a proficiency level.",
    ),
  );
  return a;
}

export function evidenceSection({ shell, domainOf, classId = "" }) {
  const sec = h("section", { class: "st-wida-evidence", "aria-labelledby": "st-wida-ev-h" });
  const session = [];
  const lookupCache = new Map();
  const classes = shell.classes.listClasses();
  const sel = h(
    "select",
    { id: "st-wida-ev-class", name: "class" },
    h("option", { value: "" }, "This visit only (not saved)"),
    classes.map((c) =>
      h("option", { value: c.id, selected: c.id === classId }, `Save with ${c.nickname}`),
    ),
  );
  const ta = h("textarea", {
    id: "st-wida-ev-codes",
    rows: "4",
    placeholder: "Paste one evidence code per line",
    spellcheck: "false",
    autocomplete: "off",
  });
  const note = h("p", { class: "st-hint", role: "status", "aria-live": "polite" });
  const box = h("div", { class: "st-wida-summary", "aria-live": "polite" });

  const current = () => (sel.value ? classEvidence(sel.value) : session);
  const lookup = (aid) => lookupCache.get(aid) || null;
  const warm = async (attempts) => {
    const ids = [
      ...new Set(attempts.filter((x) => x.eng === "wida-studio").map((x) => x.aid)),
    ].filter((id) => !lookupCache.has(id));
    await Promise.all(
      ids.map(async (id) => {
        try {
          const c = await shell.catalog.wida(id);
          lookupCache.set(id, {
            title: c.title,
            tasks: Object.fromEntries((c.tasks || []).map((t) => [t.id, t.title || t.id])),
          });
        } catch {
          /* an unknown collection id still counts; it shows by id */
        }
      }),
    );
  };
  const paint = async () => {
    const list = current();
    await warm(list);
    paintSummary(box, list, { domainOf, lookup });
  };

  const add = h("button", { class: "st-btn st-btn-primary", type: "button" }, "Add evidence");
  add.addEventListener("click", async () => {
    const codes = ta.value.split(/\s+/).filter(Boolean);
    const seen = new Set(current().map((x) => JSON.stringify(x)));
    let ok = 0;
    let dup = 0;
    let bad = "";
    for (const code of codes) {
      try {
        const att = decodeCode(code);
        const key = JSON.stringify(att);
        if (seen.has(key)) {
          dup += 1;
          continue;
        }
        seen.add(key);
        if (sel.value) addClassEvidence(sel.value, code);
        else session.push(att);
        ok += 1;
      } catch (e) {
        bad ||= /evidence code/.test(e.message) ? e.message : "A code could not be read. Copy it again from the results page.";
      }
    }
    if (!codes.length) bad = "Paste at least one evidence code first.";
    if (!bad) ta.value = "";
    note.textContent = `${plural(ok, "code")} added${dup ? `, ${plural(dup, "repeat")} skipped` : ""}.${bad ? ` ${bad}` : ""}`;
    shell.announce(note.textContent);
    await paint();
  });

  const clear = h("button", { class: "st-btn st-btn-danger", type: "button" }, "Clear evidence");
  let armed = false;
  clear.addEventListener("click", async () => {
    if (!armed) {
      armed = true;
      clear.textContent = "Confirm: clear this evidence";
      setTimeout(() => {
        armed = false;
        clear.textContent = "Clear evidence";
      }, 5000);
      return;
    }
    armed = false;
    clear.textContent = "Clear evidence";
    if (sel.value) clearClassEvidence(sel.value);
    else session.length = 0;
    note.textContent = "Evidence cleared.";
    shell.announce("Evidence cleared.");
    await paint();
  });
  sel.addEventListener("change", paint);

  sec.append(
    h("h2", { id: "st-wida-ev-h" }, "Class results"),
    h(
      "p",
      { class: "st-hint" },
      "Students copy an anonymous evidence code from the practice results page. Paste codes here to see class-level patterns. Codes carry no names and no student writing. Nothing is uploaded.",
    ),
    h(
      "div",
      { class: "st-field" },
      h("label", { for: "st-wida-ev-class" }, "Where to keep the codes"),
      sel,
    ),
    h("div", { class: "st-field" }, h("label", { for: "st-wida-ev-codes" }, "Evidence codes"), ta),
    h("div", { class: "st-row" }, add, clear),
    note,
    box,
  );
  paint();
  return sec;
}
