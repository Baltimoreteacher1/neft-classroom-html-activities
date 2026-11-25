// #/packets — mixed-band class packets and print kits. The teacher picks a unit and enters how many students sit at each band;
// the page offers the uniform student papers (one file per paper, footed with an opaque code), the answer key, the one-page
// teacher cover sheet that decodes the codes, and the print kits. Only counts are entered: no names, aliases or initials.
import { announce, h } from "../../core/dom.js";
import { BAND_LABEL, BANDS, NOT_A_SCORE } from "../../../../shared/packets/bands.js";
import { GRADES, KIT_PARTS, packetHref, paperRows, parseCounts, SUBJECTS, unitFacts } from "./links.js";

let cssLoaded = false;
function ensureCss() {
  if (cssLoaded || typeof document === "undefined") return;
  cssLoaded = true;
  if (!document.querySelector("link[data-st-pk-css]")) {
    document.head.append(h("link", { rel: "stylesheet", href: new URL("./packets.css", import.meta.url).href, "data-st-pk-css": "1" }));
  }
}

const field = (id, label, control, hint) =>
  h("div", { class: "st-field" }, h("label", { for: id }, label), control, hint ? h("p", { class: "st-hint", id: `${id}-hint` }, hint) : null);

const select = (id, options, value, onChange) => {
  const el = h("select", { id }, options.map(([v, t]) => h("option", { value: v, selected: v === value }, t)));
  el.addEventListener("change", () => onChange(el.value));
  return el;
};

const downloads = (unit, spec, counts) =>
  h(
    "span",
    { class: "st-pk-links" },
    ["pdf", "docx"].map((format) =>
      h(
        "a",
        { class: "st-btn", href: packetHref({ unit, format, counts, ...spec }), target: format === "pdf" ? "_blank" : null, rel: format === "pdf" ? "noopener" : null },
        format === "pdf" ? "PDF" : "Word",
        h("span", { class: "st-sr-only" }, ` ${spec.srLabel}`),
      ),
    ),
  );

const row = (title, note, links) =>
  h("li", { class: "st-pk-row" }, h("div", {}, h("strong", {}, title), note ? h("p", { class: "st-hint" }, note) : null), links);

export async function render({ root, params = {} }) {
  ensureCss();
  const start = unitFacts(params.unit);
  const st = {
    grade: start?.grade || params.grade || "6",
    subject: start?.subject || params.subject || "Math",
    unit: start ? params.unit : "",
    counts: { "1_2": 0, "3_4": 0, "5_6": 0, ...(parseCounts(params.counts || "").counts || {}) },
  };
  const unitSlot = h("div", { class: "st-field" });
  const out = h("div", { class: "st-pk-out", "aria-live": "polite" });

  async function loadUnits() {
    unitSlot.replaceChildren(h("p", { class: "st-loading", role: "status" }, "Loading units"));
    let units = [];
    try {
      const res = await fetch(`/api/bcpss/units?grade=${encodeURIComponent(st.grade)}&subject=${encodeURIComponent(st.subject)}`, { headers: { Accept: "application/json" } });
      if (!res.ok) throw new Error(String(res.status));
      units = (await res.json()).units || [];
    } catch {
      unitSlot.replaceChildren(h("p", { class: "st-error", role: "alert" }, "The unit list did not load. Check your connection and change the grade or subject to try again."));
      return;
    }
    if (!units.some((u) => u.id === st.unit)) st.unit = "";
    const picker = select("st-pk-unit", [["", "Choose a unit"], ...units.map((u) => [u.id, `Unit ${u.unit_number}: ${u.unit_title}`])], st.unit, (v) => {
      st.unit = v;
      paint();
    });
    unitSlot.replaceChildren(h("label", { for: "st-pk-unit" }, "Unit"), picker);
    paint();
  }

  const countInput = (band) => {
    const input = h("input", { id: `st-pk-${band}`, type: "number", min: "0", max: "60", step: "1", inputmode: "numeric", value: String(st.counts[band]) });
    input.addEventListener("input", () => {
      st.counts[band] = input.value === "" ? 0 : Number(input.value);
      paint();
    });
    return field(`st-pk-${band}`, `Students at ${BAND_LABEL[band]}`, input);
  };

  function paint() {
    if (!st.unit) {
      out.replaceChildren(h("p", { class: "st-hint" }, "Choose a unit to see its packet files."));
      return;
    }
    const parsed = parseCounts(st.counts);
    if (!parsed.ok) {
      out.replaceChildren(h("p", { class: "st-error", role: "alert" }, `Check the counts: ${parsed.error}.`));
      return;
    }
    const counts = parsed.counts;
    const papers = paperRows(st.unit, counts).map((p) =>
      row(`Paper ${p.code} · ${p.label}`, p.copies ? `Print ${p.copies} ${p.copies === 1 ? "copy" : "copies"}.` : "No students entered for this paper.", downloads(st.unit, { part: "student", band: p.band, srLabel: `paper ${p.code}` }, null)),
    );
    const teacher = [
      row("Answer key", "Every paper's expected answers, the exit-ticket model answer and the rubric row.", downloads(st.unit, { part: "key", srLabel: "answer key" }, null)),
      row("Teacher cover sheet", "One page. Says which code is which group and how many copies to print. Keep it out of the student stack.", downloads(st.unit, { part: "cover", srLabel: "cover sheet" }, counts)),
    ];
    const kits = KIT_PARTS.map((k) => row(k.label, k.note, downloads(st.unit, { part: k.part, srLabel: k.label }, null)));
    out.replaceChildren(
      h("h2", {}, "Student papers"),
      h("p", { class: "st-hint" }, "Every paper looks the same: same title, layout and length, with no names or labels. Only the code at the bottom differs, and the cover sheet decodes it."),
      h("ul", { class: "st-pk-list" }, papers),
      h("h2", {}, "Teacher files"),
      h("ul", { class: "st-pk-list" }, teacher),
      h("h2", {}, "Print kits"),
      h("ul", { class: "st-pk-list" }, kits),
      h("p", { class: "st-hint" }, `${NOT_A_SCORE} Spanish glosses print as draft translations until a reviewer approves them.`),
    );
    announce("Packet files updated.");
  }

  const gradeSel = select("st-pk-grade", GRADES.map((g) => [g, g === "K" ? "Kindergarten" : `Grade ${g}`]), st.grade, (v) => {
    st.grade = v;
    st.unit = "";
    loadUnits();
  });
  const subjectSel = select("st-pk-subject", SUBJECTS.map((s) => [s, s]), st.subject, (v) => {
    st.subject = v;
    st.unit = "";
    loadUnits();
  });

  root.replaceChildren(
    h(
      "section",
      { class: "st-pk" },
      h("h1", {}, "Class packets"),
      h("p", {}, "Print one set of uniform-looking papers for a mixed class. Enter how many students need each kind of support; no names are needed or stored."),
      h(
        "form",
        { class: "st-pk-form", "aria-label": "Packet settings", onsubmit: (e) => e.preventDefault() },
        field("st-pk-grade", "Grade", gradeSel),
        field("st-pk-subject", "Subject", subjectSel),
        unitSlot,
        h("fieldset", { class: "st-pk-counts" }, h("legend", {}, "Students in each group"), BANDS.map(countInput)),
      ),
      out,
    ),
  );
  await loadUnits();
}
