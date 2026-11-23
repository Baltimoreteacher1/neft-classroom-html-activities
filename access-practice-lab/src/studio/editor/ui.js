// Tiny DOM helpers for the editor. Everything is built with createElement and textContent, never innerHTML, so a
// teacher's text (or anything pasted into it) can never become markup.

/** h("button.btn.primary", { onclick, "aria-label": "x" }, "Text", childNode) */
export function h(spec, attrs, ...kids) {
  const [tag, ...classes] = String(spec).split(".");
  const el = document.createElement(tag || "div");
  if (classes.length) el.className = classes.join(" ");
  const props =
    attrs && typeof attrs === "object" && !(attrs instanceof Node) && !Array.isArray(attrs)
      ? attrs
      : null;
  if (!props && attrs != null) kids.unshift(attrs);
  for (const [k, v] of Object.entries(props || {})) {
    if (v == null || v === false) continue;
    if (k.startsWith("on") && typeof v === "function") el.addEventListener(k.slice(2), v);
    else if (k === "value") el.value = v;
    else if (k === "checked" || k === "disabled" || k === "hidden" || k === "selected")
      el[k] = Boolean(v);
    else el.setAttribute(k, v === true ? "" : String(v));
  }
  append(el, kids);
  return el;
}

export function append(el, kids) {
  for (const kid of kids.flat(Infinity)) {
    if (kid == null || kid === false) continue;
    el.append(kid instanceof Node ? kid : document.createTextNode(String(kid)));
  }
  return el;
}

export const clear = (el) => {
  el.replaceChildren();
  return el;
};

let seq = 0;
export const domId = (p = "st") => `${p}-${++seq}`;

/** A labeled form control: <label> wraps text + control so the name is always attached. */
export function field(label, control, hint = "") {
  const id = control.id || (control.id = domId("f"));
  const wrap = h("div.st-field", h("label", { for: id }, label), control);
  if (hint) {
    const hid = domId("hint");
    wrap.append(h("p.st-hint", { id: hid }, hint));
    control.setAttribute("aria-describedby", hid);
  }
  return wrap;
}

export const textInput = (value, onInput, attrs = {}) =>
  h("input.st-input", {
    type: "text",
    value: value ?? "",
    oninput: (e) => onInput(e.target.value),
    ...attrs,
  });

export function textArea(value, onInput, attrs = {}) {
  const el = h("textarea.st-input", {
    rows: attrs.rows || 3,
    oninput: (e) => onInput(e.target.value),
    ...attrs,
  });
  el.value = value ?? "";
  return el;
}

export const select = (options, value, onChange, attrs = {}) =>
  h(
    "select.st-input",
    { onchange: (e) => onChange(e.target.value), ...attrs },
    options.map(([v, label]) => h("option", { value: v, selected: v === value }, label)),
  );

export function toggle(label, checked, onChange, hint = "") {
  const id = domId("t");
  const box = h("input", {
    type: "checkbox",
    id,
    checked,
    onchange: (e) => onChange(e.target.checked),
  });
  const wrap = h("div.st-toggle", box, h("label", { for: id }, label));
  if (hint) wrap.append(h("p.st-hint", hint));
  return wrap;
}

const BUTTON_CLASS = { primary: "btn-primary", big: "btn-big", ghost: "st-ghost", small: "small", link: "st-linkbtn" };
export const button = (label, onclick, cls = "", attrs = {}) => h(`button.btn${cls ? `.${cls.split(" ").map((c) => BUTTON_CLASS[c] || c).join(".")}` : ""}`, { type: "button", onclick, ...attrs }, label);
export const iconButton = (glyph, label, onclick, attrs = {}) =>
  h(
    "button.st-icon",
    { type: "button", "aria-label": label, title: label, onclick, ...attrs },
    h("span", { "aria-hidden": "true" }, glyph),
  );

/** A disclosure with a visible summary; closed by default so advanced settings never crowd the page. */
export function disclosure(summary, ...content) {
  return h("details.st-more", h("summary", summary), h("div.st-more-body", ...content));
}

/** A modal dialog with focus trapping from the platform <dialog>; resolves when closed. */
export function openDialog(title, build, { onClose } = {}) {
  const dlg = h("dialog.st-dialog", { "aria-labelledby": "st-dlg-title" });
  const close = () => dlg.close();
  const body = h("div.st-dialog-body");
  dlg.append(
    h(
      "div.st-dialog-head",
      h("h2", { id: "st-dlg-title" }, title),
      iconButton("✕", "Close", close),
    ),
    body,
  );
  build(body, close);
  dlg.addEventListener("close", () => {
    dlg.remove();
    onClose?.();
  });
  document.body.append(dlg);
  dlg.showModal();
  return { close, body };
}

export const debounce = (fn, ms) => {
  let t;
  const run = (...a) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...a), ms);
  };
  run.flush = (...a) => {
    clearTimeout(t);
    fn(...a);
  };
  run.cancel = () => clearTimeout(t);
  return run;
};

/** Polite, visually hidden announcement for screen readers. */
export function say(message) {
  let live = document.getElementById("st-live");
  if (!live) {
    live = h("div#st-live.st-sr", { role: "status", "aria-live": "polite" });
    document.body.append(live);
  }
  live.textContent = "";
  setTimeout(() => {
    live.textContent = message;
  }, 30);
}
