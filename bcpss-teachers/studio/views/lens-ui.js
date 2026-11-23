// Shared UI helpers for the Lesson / Unit / Lens / Remix / Evidence views: stylesheet loader, tolerant access to the shell's
// modules (they are written concurrently), list editor, clipboard, print, visuals, and consistent states.
import { announce, h } from "../core/dom.js";

let cssLoaded = false;
export function ensureCss() {
  if (cssLoaded || typeof document === "undefined") return;
  cssLoaded = true;
  const href = new URL("./lens-views.css", import.meta.url).href;
  if (document.querySelector(`link[data-st-ll-css]`)) return;
  document.head.append(h("link", { rel: "stylesheet", href, "data-st-ll-css": "1" }));
}

/** Load an optional studio module and return its exports (default export merged under named ones). null when absent. */
export async function optional(path) {
  try {
    const mod = await import(path);
    return { ...(mod.default && typeof mod.default === "object" ? mod.default : {}), ...mod };
  } catch {
    return null;
  }
}

export async function getCatalog(shell) {
  if (shell?.catalog) return shell.catalog;
  const mod = await optional("../core/catalog.js");
  return mod?.createCatalog ? mod.createCatalog() : mod;
}

export const idFrom = (params = {}) => params.id ?? params.arg ?? params[0] ?? "";

export const btn = (
  label,
  onclick,
  { kind = "", pressed, title, type = "button", small = false, disabled = false } = {},
) =>
  h(
    "button",
    {
      type,
      class: `st-ll-btn${kind ? ` st-ll-btn-${kind}` : ""}${small ? " st-ll-btn-small" : ""}`,
      onclick,
      title,
      disabled,
      "aria-pressed": pressed === undefined ? false : String(pressed),
    },
    label,
  );

export const chip = (text, { domain, title, tone } = {}) =>
  h(
    "span",
    { class: `st-ll-chip${tone ? ` st-ll-chip-${tone}` : ""}`, "data-d": domain, title },
    text,
  );

export function stateBox({ title, message, retry, role = "status" }) {
  return h(
    "section",
    { class: "st-ll st-ll-state", role },
    h("h1", {}, title),
    h("p", {}, message),
    retry ? btn("Try again", retry, { kind: "primary" }) : null,
    h("p", {}, h("a", { class: "st-ll-link", href: "#/" }, "Go to the home page")),
  );
}

export async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const ta = h("textarea", { class: "st-sr-only", "aria-hidden": "true" });
    ta.value = text;
    document.body.append(ta);
    ta.select();
    let ok = false;
    try {
      ok = document.execCommand("copy");
    } catch {
      ok = false;
    }
    ta.remove();
    return ok;
  }
}

/** Copy with a polite announcement. */
export async function copyWithNotice(text, what) {
  const ok = await copyText(text);
  announce(
    ok ? `${what} copied.` : `Could not copy ${what}. Select the text and copy it yourself.`,
  );
  return ok;
}

/** Print only `html` (already escaped by the caller) by swapping it into a print-only container for the print dialog. */
export function printHtml(html) {
  const root = h("div", { id: "st-ll-printroot", class: "st-ll-printroot", html });
  document.body.append(root);
  document.body.classList.add("st-ll-printing");
  const done = () => {
    document.body.classList.remove("st-ll-printing");
    root.remove();
    window.removeEventListener("afterprint", done);
  };
  window.addEventListener("afterprint", done);
  window.print();
}

/** Render a visual spec through core/visuals.js; falls back to the alt text when the visual kit is unavailable. */
export async function renderVisualInto(el, spec) {
  if (!spec) return;
  const fallback = () =>
    el.replaceChildren(h("p", { class: "st-ll-visual-alt" }, spec.alt || "Picture"));
  try {
    const mod = await import("../core/visuals.js");
    const svg = mod.renderVisual?.(spec);
    if (!svg) return fallback();
    const fig = h("figure", { class: "st-ll-figure" }, h("div", { html: svg }));
    if (spec.longDesc) fig.append(h("figcaption", { class: "st-ll-muted" }, spec.longDesc));
    el.replaceChildren(fig);
  } catch {
    fallback();
  }
}

export function visualBox(spec) {
  const box = h("div", { class: "st-ll-visual" });
  if (spec) renderVisualInto(box, spec);
  return box;
}

/**
 * Editable list: textarea per item with add, remove and reorder. onChange(items) gets plain {id,text} items.
 */
export function listEditor({ items, onChange, label, newItem }) {
  let list = items.map((i) => ({ ...i }));
  const wrap = h("div", { class: "st-ll-editor" });
  const emit = () => onChange?.(list.map((i) => ({ ...i })));
  const draw = (focusIndex) => {
    wrap.replaceChildren(
      h(
        "ul",
        { class: "st-ll-editlist" },
        list.map((it, idx) => {
          const ta = h("textarea", {
            class: "st-ll-input",
            rows: "2",
            "aria-label": `${label}, item ${idx + 1} of ${list.length}`,
          });
          ta.value = it.text;
          ta.addEventListener("input", () => {
            it.text = ta.value;
            emit();
          });
          const move = (to) => {
            if (to < 0 || to >= list.length) return;
            list.splice(to, 0, list.splice(idx, 1)[0]);
            emit();
            draw(to);
            announce(`Moved to position ${to + 1} of ${list.length}.`);
          };
          return h(
            "li",
            { class: "st-ll-edititem" },
            ta,
            h(
              "div",
              { class: "st-ll-editbtns" },
              btn("Up", () => move(idx - 1), {
                small: true,
                disabled: idx === 0,
                title: `Move item ${idx + 1} up`,
              }),
              btn("Down", () => move(idx + 1), {
                small: true,
                disabled: idx === list.length - 1,
                title: `Move item ${idx + 1} down`,
              }),
              btn(
                "Remove",
                () => {
                  list.splice(idx, 1);
                  emit();
                  draw(Math.min(idx, list.length - 1));
                  announce(`Item ${idx + 1} removed.`);
                },
                { small: true, title: `Remove item ${idx + 1}` },
              ),
            ),
          );
        }),
      ),
      btn(
        `Add to ${label.toLowerCase()}`,
        () => {
          list.push(newItem());
          emit();
          draw(list.length - 1);
        },
        { small: true },
      ),
    );
    if (focusIndex != null && focusIndex >= 0)
      wrap.querySelectorAll("textarea")[focusIndex]?.focus();
  };
  draw();
  return wrap;
}

export const section = (title, ...kids) =>
  h("section", { class: "st-ll-card" }, h("h2", { class: "st-ll-h2" }, title), ...kids);

export const kvList = (pairs) =>
  h(
    "dl",
    { class: "st-ll-kv" },
    pairs.filter(([, v]) => v).flatMap(([k, v]) => [h("dt", {}, k), h("dd", {}, v)]),
  );

export const ul = (items, cls = "st-ll-list") =>
  h(
    "ul",
    { class: cls },
    items.map((i) => h("li", {}, i)),
  );
