// Resource Studio form pieces: the resource picker (step 1) and the class and print settings (step 3).
// Every control writes to the shared state object and calls onChange(what); the view decides what to rebuild.
import { h } from "../../core/dom.js";
import { GRADES, GRADE_LABEL, SUBJECTS, TIERS, bandOf } from "../../data/taxonomy.js";
import { FAMILIES, defaultOptions, templateById, templatesFor } from "../../print/templates.js";
import { LANG_CHOICES, SIZE_CHOICES, VIS_CHOICES } from "./state.js";

const subjectNames = (ids) =>
  ids.map((id) => SUBJECTS.find((s) => s.id === id)?.short || id).join(", ");

export function heading(id, n, text) {
  return h("h2", { id }, h("span", { class: "st-step-num", "aria-hidden": "true" }, n), text);
}

export function field(id, label, control, hint) {
  return h(
    "div",
    { class: "st-field" },
    h("label", { for: id }, label),
    control,
    hint ? h("p", { class: "st-hint", id: `${id}-h` }, hint) : null,
  );
}

export function select(id, choices, value, onPick, placeholder) {
  const sel = h(
    "select",
    { id },
    placeholder ? h("option", { value: "" }, placeholder) : null,
    choices.map((c) =>
      h("option", { value: c.v, selected: String(c.v) === String(value) }, c.label),
    ),
  );
  sel.addEventListener("change", () => onPick(sel.value));
  return sel;
}

/** Step 1: pick a family, then a resource. */
export function resourcePicker(st, onChange) {
  const box = h("section", { class: "st-step", "aria-labelledby": "st-cr-s1" });
  const draw = () => {
    const band = bandOf(st.grade);
    const pool = templatesFor({ band, subject: st.subject }).filter(
      (t) => !st.family || t.family === st.family,
    );
    const chips = ["", ...FAMILIES].map((f) => {
      const b = h(
        "button",
        { class: "st-pick", type: "button", "aria-pressed": String(st.family === f) },
        f || "All types",
      );
      b.addEventListener("click", () => {
        st.family = f;
        draw();
      });
      return h("li", {}, b);
    });
    const cards = pool.map((t) => {
      const on = st.templateId === t.id;
      const b = h(
        "button",
        {
          class: "st-cr-tpl",
          type: "button",
          "aria-pressed": String(on),
          "aria-describedby": `st-cr-tpl-${t.id}`,
        },
        h("span", { class: "st-cr-tpl-name" }, t.label),
        h("span", { class: "st-cr-tpl-blurb", id: `st-cr-tpl-${t.id}` }, t.blurb || t.family),
        !t.recommended && t.subjects
          ? h("span", { class: "st-cr-tpl-note" }, `Made for ${subjectNames(t.subjects)}`)
          : null,
      );
      b.addEventListener("click", () => {
        st.templateId = t.id;
        st.options = defaultOptions(t, band || "6-8");
        draw();
        onChange("template");
      });
      return h("li", {}, b);
    });
    box.replaceChildren(
      heading("st-cr-s1", "1", "Choose a resource"),
      h("ul", { class: "st-pills", "aria-label": "Resource types" }, chips),
      h("ul", { class: "st-cr-tpls", "aria-label": "Resources" }, cards),
    );
    box.dataset.state = st.templateId ? "done" : "";
  };
  draw();
  return { el: box, redraw: draw };
}

/** Step 3: grade, subject, support levels, pictures, language, paper and this resource's own options. */
export function settingsForm(st, onChange) {
  const box = h("section", { class: "st-step", "aria-labelledby": "st-cr-s3" });
  const set = (key) => (value) => {
    st[key] = value;
    onChange(key);
  };
  const draw = () => {
    const tpl = templateById(st.templateId);
    const tierBoxes = TIERS.map((t) => {
      const cb = h("input", {
        type: "checkbox",
        id: `st-cr-t-${t.id}`,
        checked: st.tiers.includes(t.id),
      });
      cb.addEventListener("change", () => {
        const next = TIERS.map((x) => x.id).filter((id) =>
          id === t.id ? cb.checked : st.tiers.includes(id),
        );
        if (!next.length) {
          cb.checked = true;
          return;
        }
        st.tiers = next;
        onChange("tiers");
      });
      return h(
        "label",
        { class: "st-cr-check", for: cb.id },
        cb,
        h("span", {}, t.label, h("small", {}, ` ${t.levels}`)),
      );
    });
    const opts = (tpl?.options || []).map((o) =>
      field(
        `st-cr-o-${o.id}`,
        o.label,
        select(
          `st-cr-o-${o.id}`,
          o.choices,
          st.options[o.id] ?? defaultOptions(tpl, bandOf(st.grade) || "6-8")[o.id],
          (v) => {
            st.options = { ...st.options, [o.id]: v };
            onChange("options");
          },
        ),
      ),
    );
    const cover = h("input", { type: "checkbox", id: "st-cr-cover", checked: st.cover });
    cover.addEventListener("change", () => set("cover")(cover.checked));
    const title = h("input", {
      type: "text",
      id: "st-cr-title",
      maxlength: "120",
      autocomplete: "off",
      value: st.title,
      "aria-describedby": "st-cr-title-h",
    });
    title.addEventListener("change", () => set("title")(title.value.trim()));
    box.replaceChildren(
      heading("st-cr-s3", "3", "Class and page settings"),
      field(
        "st-cr-grade",
        "Grade",
        select(
          "st-cr-grade",
          GRADES.map((g) => ({ v: g, label: GRADE_LABEL[g] })),
          st.grade,
          set("grade"),
          "Choose a grade",
        ),
      ),
      field(
        "st-cr-subject",
        "Subject",
        select(
          "st-cr-subject",
          SUBJECTS.map((s) => ({ v: s.id, label: s.short })),
          st.subject,
          set("subject"),
          "Any subject",
        ),
      ),
      h(
        "fieldset",
        { class: "st-field st-cr-fieldset" },
        h("legend", { class: "st-legend" }, "Language support levels"),
        h(
          "p",
          { class: "st-hint" },
          "Choose more than one to print a set of pages for each level. Levels change the language help, never the task.",
        ),
        tierBoxes,
      ),
      field("st-cr-vis", "Pictures", select("st-cr-vis", VIS_CHOICES, st.vis, set("vis"))),
      field(
        "st-cr-lang",
        "Languages",
        select("st-cr-lang", LANG_CHOICES, st.lang, set("lang")),
        "Spanish appears only where a translation is marked verified.",
      ),
      ...opts,
      field("st-cr-size", "Paper size", select("st-cr-size", SIZE_CHOICES, st.size, set("size"))),
      field(
        "st-cr-orient",
        "Page direction",
        select(
          "st-cr-orient",
          [
            { v: "auto", label: "Best for this resource" },
            { v: "portrait", label: "Portrait" },
            { v: "landscape", label: "Landscape" },
          ],
          st.orientation,
          set("orientation"),
        ),
      ),
      field(
        "st-cr-title",
        "Title (optional)",
        title,
        "Leave blank to use the lesson or word set title. Do not put student names in a title.",
      ),
      h(
        "div",
        { class: "st-field" },
        h(
          "label",
          { class: "st-cr-check", for: "st-cr-cover" },
          cover,
          h("span", {}, "Add a cover page with grade, supports and standards"),
        ),
      ),
    );
    box.dataset.state = st.grade ? "done" : "";
  };
  draw();
  return { el: box, redraw: draw };
}
