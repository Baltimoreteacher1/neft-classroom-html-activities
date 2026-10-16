// Our Class Investigation — the guided contribution form.
//
// One form, two homes: the investigation page and the family Home Mission card.
// It asks only the active investigation's declared fields, shows the unit beside
// every number, refuses impossible values with a sentence a Grade 6 student can
// act on, and asks "is that right?" for a value that is possible but unusual
// before it is sent, because once it is sent it is part of the record.

import { isUnusual, validateFieldValue } from "./contract.js";
import { announce, h } from "./dom.js";
import { pick, tr } from "./i18n.js";
import { activeFields } from "./templates.js";

const ERROR_KEY = {
  "too-small": "errTooSmall",
  "too-large": "errTooLarge",
  "bad-step": "errStep",
  "not-a-number": "errNumber",
  "missing-field": "errMissing",
  "bad-choice": "errChoice",
};

function errorText(code, field, lang) {
  const unit = pick(field.unit, lang);
  return tr(ERROR_KEY[code] ?? "errGeneric", lang, {
    min: field.min,
    max: field.max,
    unit,
    step: field.step === 0.5 ? (lang === "es" ? "0,5" : "0.5") : "1",
  });
}

/**
 * @param {object} o
 * @param {import("./templates.js").Template} o.template
 * @param {Record<string, boolean>} o.options
 * @param {"en"|"es"} o.lang
 * @param {ReturnType<import("./store.js").createStore>} o.store
 * @param {"class"|"home"} [o.source]
 * @param {(entry: object) => void} o.onAdded
 * @param {() => void} [o.onNextPerson]
 * @param {string} [o.blockedReason]  an i18n key; the form shows it instead of inputs
 */
export function buildForm({
  template,
  options,
  lang,
  store,
  source = "class",
  onAdded,
  onNextPerson,
  blockedReason,
}) {
  const fields = activeFields(template, options);
  const status = h("div", { class: "ci-form-status", role: "status", "aria-live": "polite" });
  const wrap = h("section", { class: "ci-card ci-form", "aria-labelledby": "ci-form-title" });
  const title = h("h3", { id: "ci-form-title", text: tr("formTitle", lang) });

  if (blockedReason) {
    wrap.append(title, h("p", { class: "ci-note", text: tr(blockedReason, lang) }));
    return wrap;
  }
  if (store.madeBy(template.id) >= template.maxPerContributor) {
    wrap.append(
      title,
      h("p", { class: "ci-note", text: tr("limitReached", lang) }),
      h("button", {
        type: "button",
        class: "ci-btn",
        text: tr("nextPerson", lang),
        onclick: () => {
          store.nextPerson();
          onNextPerson?.();
        },
      }),
      h("p", { class: "ci-small", text: tr("nextPersonNote", lang) }),
    );
    return wrap;
  }

  const inputs = new Map();
  const errors = new Map();
  const focusTargets = new Map();
  const rows = fields.map((field) => {
    const id = `ci-f-${field.id}`;
    const err = h("p", { class: "ci-error", id: `${id}-err`, role: "alert" });
    errors.set(field.id, err);
    const help = h("p", { class: "ci-help", id: `${id}-help`, text: pick(field.help, lang) });
    const label = pick(field.label, lang);
    const tag = field.optional
      ? h("span", { class: "ci-tag", text: ` ${tr("optionalTag", lang)}` })
      : null;

    if (field.kind === "choice") {
      const group = h("fieldset", {
        class: "ci-field",
        "aria-describedby": `${id}-help ${id}-err`,
      });
      group.append(h("legend", {}, label, tag), help);
      const radios = field.choices.map((c) => {
        const input = h("input", { type: "radio", name: id, value: c.id, id: `${id}-${c.id}` });
        return h(
          "label",
          { class: "ci-choice", for: `${id}-${c.id}` },
          input,
          h("span", { text: pick(c.label, lang) }),
        );
      });
      group.append(h("div", { class: "ci-choices" }, radios), err);
      focusTargets.set(field.id, group.querySelector("input"));
      inputs.set(field.id, () => group.querySelector("input:checked")?.value ?? null);
      return group;
    }

    const input = h("input", {
      type: "number",
      id,
      inputmode: "decimal",
      step: field.step ?? 1,
      min: field.min,
      max: field.max,
      autocomplete: "off",
      "aria-describedby": `${id}-help ${id}-err`,
      "aria-required": field.optional ? null : "true",
    });
    focusTargets.set(field.id, input);
    inputs.set(field.id, () => (input.value === "" ? null : input.valueAsNumber));
    return h(
      "div",
      { class: "ci-field" },
      h("label", { for: id }, label, tag),
      help,
      h(
        "div",
        { class: "ci-inputrow" },
        input,
        h("span", { class: "ci-unit", text: pick(field.unit, lang) }),
      ),
      err,
    );
  });

  const confirmBox = h("div", { class: "ci-confirm", hidden: true });
  let confirmed = false;

  function collect() {
    const values = {};
    let ok = true;
    let firstBad = null;
    for (const field of fields) {
      errors.get(field.id).textContent = "";
      const raw = inputs.get(field.id)();
      if (raw === null || (typeof raw === "number" && Number.isNaN(raw))) {
        if (field.optional) continue;
        errors.get(field.id).textContent = errorText(
          raw === null ? "missing-field" : "not-a-number",
          field,
          lang,
        );
        ok = false;
        continue;
      }
      const checked = validateFieldValue(field, raw);
      if (!checked.ok) {
        errors.get(field.id).textContent = errorText(checked.error, field, lang);
        ok = false;
        firstBad ??= field.id;
      } else values[field.id] = checked.value;
    }
    if (firstBad) focusTargets.get(firstBad)?.focus();
    return ok ? values : null;
  }

  function send(values) {
    const result = store.add({ values, source });
    if (!result.ok) {
      announce(
        status,
        tr(result.error === "contributor-limit" ? "limitReached" : "errGeneric", lang),
      );
      return;
    }
    onAdded(result.entry);
  }

  function submit(event) {
    event.preventDefault();
    const values = collect();
    if (!values) {
      wrap
        .querySelector(".ci-error:not(:empty)")
        ?.previousElementSibling?.querySelector?.("input")
        ?.focus();
      wrap.querySelector("input[aria-invalid], input")?.focus?.({ preventScroll: true });
      return;
    }
    const odd = fields.filter((f) => f.id in values && isUnusual(f, values[f.id]));
    if (odd.length && !confirmed) {
      const field = odd[0];
      confirmBox.hidden = false;
      confirmBox.replaceChildren(
        h("p", {
          class: "ci-confirm-text",
          text: tr("unusual", lang, { value: values[field.id], unit: pick(field.unit, lang) }),
        }),
        h("div", { class: "ci-row" }, [
          h("button", {
            type: "button",
            class: "ci-btn",
            text: tr("yesRight", lang),
            onclick: () => {
              confirmed = true;
              send(values);
            },
          }),
          h("button", {
            type: "button",
            class: "ci-btn ci-btn-quiet",
            text: tr("fixIt", lang),
            onclick: () => {
              confirmBox.hidden = true;
              wrap.querySelector("input[type=number]")?.focus();
            },
          }),
        ]),
      );
      confirmBox.querySelector("button")?.focus();
      announce(status, confirmBox.querySelector("p").textContent);
      return;
    }
    send(values);
  }

  const form = h(
    "form",
    { novalidate: true, onsubmit: submit },
    h("p", { class: "ci-rule", text: tr("formRule", lang) }),
    rows,
    confirmBox,
    h("button", { type: "submit", class: "ci-btn ci-btn-primary", text: tr("addBtn", lang) }),
  );
  wrap.append(title, form, status);
  return wrap;
}
