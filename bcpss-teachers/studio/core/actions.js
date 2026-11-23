// Standard action bar for any resource: favorite, bundle, copy student link, print/export, projector.
import { h } from "./dom.js";
import { icon } from "./ui.js";

/** Star toggle for a library reference ({ kind, id, title, ... }). */
export function favoriteButton(ref, shell) {
  const lib = shell.library;
  const btn = h("button", { class: "st-fav", type: "button" });
  const paint = () => {
    const on = lib.isFavorite(ref);
    btn.setAttribute("aria-pressed", String(on));
    btn.setAttribute("aria-label", `${on ? "Remove from" : "Save to"} favorites: ${ref.title}`);
    btn.dataset.on = String(on);
    btn.replaceChildren(icon("star", 20));
  };
  btn.addEventListener("click", () => {
    const on = lib.toggleFavorite(ref);
    paint();
    shell.announce(on ? `Saved ${ref.title} to favorites.` : `Removed ${ref.title} from favorites.`);
  });
  paint();
  return btn;
}

export async function copyText(text, doc = document) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const ta = h("textarea", { class: "st-sr-only", "aria-hidden": "true", tabindex: "-1" });
    ta.value = text;
    doc.body.append(ta);
    ta.select();
    let ok = false;
    try {
      ok = doc.execCommand("copy");
    } catch {
      ok = false;
    }
    ta.remove();
    return ok;
  }
}

/** Resolve the activity a student link should open for this resource, or null. */
async function activityFor(item, opts, shell) {
  if (opts.activityId) return { id: opts.activityId, lessonId: opts.lessonId };
  if (item.kind === "activity") return { id: item.id, lessonId: opts.lessonId };
  if (item.kind === "lesson") {
    const lesson = await shell.catalog.lesson(item.id);
    const first = lesson.activities?.[0]?.id;
    return first ? { id: first, lessonId: item.id } : null;
  }
  return null;
}

function bundlePanel(item, shell, close) {
  const lib = shell.library;
  const list = h("ul", { class: "st-plain-list" });
  for (const b of lib.bundles()) {
    const add = h("button", { class: "st-btn st-btn-quiet", type: "button" }, `Add to ${b.name}`);
    add.addEventListener("click", () => {
      lib.addToBundle(b.id, item);
      shell.announce(`Added to ${b.name}.`);
      close();
    });
    list.append(h("li", {}, add));
  }
  const input = h("input", { type: "text", maxlength: "80", id: `st-nb-${item.id}`, autocomplete: "off" });
  const form = h(
    "form",
    { class: "st-inline-form" },
    h("label", { for: input.id }, "New bundle name"),
    input,
    h("button", { class: "st-btn", type: "submit" }, "Create and add"),
  );
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const b = lib.createBundle(input.value.trim() || "My bundle");
    lib.addToBundle(b.id, item);
    shell.announce(`Created ${b.name} and added this.`);
    close();
  });
  return h("div", { class: "st-pop", role: "group", "aria-label": "Add to a bundle" }, list, form);
}

export function renderActionBar(item, shell, opts = {}) {
  const ref = { kind: item.kind, id: item.id, title: item.title, grade: item.grade, subject: item.subject };
  const bar = h("div", { class: "st-actions", role: "group", "aria-label": `Actions for ${item.title}` });
  const status = h("span", { class: "st-sr-only", role: "status" });

  const bundleBtn = h("button", { class: "st-btn", type: "button", "aria-expanded": "false" }, icon("plus"), "Add to bundle");
  let panel = null;
  const close = () => {
    panel?.remove();
    panel = null;
    bundleBtn.setAttribute("aria-expanded", "false");
    bundleBtn.focus();
  };
  bundleBtn.addEventListener("click", () => {
    if (panel) return close();
    panel = bundlePanel(ref, shell, close);
    panel.addEventListener("keydown", (e) => e.key === "Escape" && close());
    bundleBtn.setAttribute("aria-expanded", "true");
    bundleBtn.after(panel);
    panel.querySelector("button, input")?.focus();
  });

  const linkBtn = h("button", { class: "st-btn", type: "button" }, icon("link"), "Copy student link");
  linkBtn.addEventListener("click", async () => {
    try {
      const act = await activityFor(item, opts, shell);
      if (!act) return shell.announce("This resource has no student activity to link.");
      const url = shell.library.playUrl(act.id, { tier: opts.tier, lessonId: act.lessonId, origin: location.origin });
      shell.announce((await copyText(url)) ? "Student link copied." : "Could not copy. Select the link and copy it by hand.");
    } catch {
      shell.announce("Could not find the activity for this link.");
    }
  });

  const printQuery = item.kind === "lesson" ? `?lesson=${encodeURIComponent(item.id)}` : `?type=${encodeURIComponent(item.kind)}&lesson=${encodeURIComponent(opts.lessonId || item.id)}`;
  const printLink = h("a", { class: "st-btn", href: `#/create${printQuery}` }, icon("print"), "Print or export");

  const proj = h("button", { class: "st-btn", type: "button", "aria-pressed": String(shell.projector.get()) }, icon("screen"), "Projector view");
  proj.addEventListener("click", () => proj.setAttribute("aria-pressed", String(shell.projector.toggle())));

  bar.append(favoriteButton(ref, shell), bundleBtn, linkBtn, printLink, proj, status);
  return bar;
}

