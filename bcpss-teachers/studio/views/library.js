// Library: favorites, bundles, history search, student links, and a backup file for the whole workspace.
import { copyText, favoriteButton } from "../core/actions.js";
import { KIND_LABELS, hrefFor } from "../core/catalog.js";
import { h } from "../core/dom.js";
import { emptyState, icon, plural } from "../core/ui.js";

const LABELS = { ...KIND_LABELS, part: "Lesson part" };
const hrefOf = (r) => (r.kind === "part" ? r.href || (r.lessonId ? `#/lesson/${encodeURIComponent(r.lessonId)}` : "#/library") : hrefFor(r.kind, r.id));
const small = (r) => `${LABELS[r.kind] || r.kind}${r.subject ? `, ${r.subject}` : ""}`;

function itemRow(r, shell, extra = []) {
  const external = r.kind === "activity";
  return h("li", {}, h("span", { class: "st-grow" }, h("a", { href: hrefOf(r), target: external ? "_blank" : null, rel: external ? "noopener" : null }, r.title), " ", h("small", {}, small(r))), extra);
}

function iconBtn(name, label, fn, { danger = false } = {}) {
  const b = h("button", { class: `st-btn${danger ? " st-btn-danger" : ""}`, type: "button", "aria-label": label, title: label }, icon(name, 18));
  b.addEventListener("click", fn);
  return b;
}

async function linkFor(r, shell) {
  const origin = location.origin;
  if (r.kind === "activity") return shell.library.playUrl(r.id, { origin });
  if (r.kind === "part" && r.href?.startsWith("/bcpss-teachers/studio/play/")) return `${origin}${r.href}`;
  if (r.kind === "lesson") {
    const lesson = await shell.catalog.lesson(r.id);
    const a = lesson.activities?.[0]?.id;
    return a ? shell.library.playUrl(a, { lessonId: r.id, origin }) : null;
  }
  return null;
}

const refocus = (label) =>
  [...document.querySelectorAll("button[aria-label]")].find((b) => b.getAttribute("aria-label") === label)?.focus();

function section(id, title, ...kids) {
  return h("section", { "aria-labelledby": id }, h("h2", { id }, title), kids);
}

export async function render({ root, shell }) {
  const lib = shell.library;
  const status = h("p", { class: "st-hint", role: "status" });
  const say = (t) => {
    status.textContent = t;
    shell.announce(t);
  };
  const body = h("div", {});
  root.append(h("h1", {}, "Library"), h("p", { class: "st-lede" }, "Everything you saved lives on this device. Export a backup if you want it on another computer."), status, body);
  let historyQuery = "";

  const copyLinkBtn = (r) => {
    const b = h("button", { class: "st-btn", type: "button" }, icon("link", 18), "Student link");
    b.addEventListener("click", async () => {
      try {
        const url = await linkFor(r, shell);
        say(url ? ((await copyText(url)) ? "Student link copied." : "Could not copy the link. Try again.") : "This item has no student activity to link.");
      } catch {
        say("Could not find the activity for this link.");
      }
    });
    return b;
  };

  function favorites() {
    const list = lib.favorites();
    return section("lib-fav", `Favorites (${list.length})`, list.length ? h("ul", { class: "st-list" }, list.map((r) => itemRow(r, shell, [copyLinkBtn(r), iconBtn("trash", `Remove ${r.title} from favorites`, () => {
      lib.toggleFavorite(r);
      say(`Removed ${r.title}.`);
      draw();
    })]))) : emptyState({ title: "No favorites yet", body: "Use the star on any lesson, activity or word list to keep it here.", actions: [h("a", { class: "st-btn", href: "#/find" }, "Find a lesson")] }));
  }

  function bundleCard(b) {
    const name = h("input", { type: "text", value: b.name, maxlength: "80", "aria-label": `Name of bundle ${b.name}` });
    const rename = h("button", { class: "st-btn", type: "button" }, "Rename");
    rename.addEventListener("click", () => {
      lib.renameBundle(b.id, name.value);
      say("Bundle renamed.");
      draw();
    });
    const links = h("button", { class: "st-btn", type: "button" }, "Copy all student links");
    links.addEventListener("click", async () => {
      const urls = (await Promise.all(b.items.map((r) => linkFor(r, shell).catch(() => null)))).filter(Boolean);
      say(urls.length ? ((await copyText(urls.join("\n"))) ? `Copied ${plural(urls.length, "link")}.` : "Could not copy the links.") : "No student activities in this bundle.");
    });
    let armed = false;
    const del = h("button", { class: "st-btn st-btn-danger", type: "button" }, "Delete bundle");
    del.addEventListener("click", () => {
      if (!armed) {
        armed = true;
        del.textContent = "Confirm delete";
        return;
      }
      lib.deleteBundle(b.id);
      say("Bundle deleted.");
      draw();
    });
    del.addEventListener("blur", () => {
      armed = false;
      del.textContent = "Delete bundle";
    });
    const rows = b.items.map((r, i) =>
      itemRow(r, shell, [
        iconBtn("up", `Move ${r.title} up`, () => {
          lib.moveInBundle(b.id, i, i - 1);
          draw();
          refocus(`Move ${r.title} up`);
        }),
        iconBtn("down", `Move ${r.title} down`, () => {
          lib.moveInBundle(b.id, i, i + 1);
          draw();
          refocus(`Move ${r.title} down`);
        }),
        iconBtn("trash", `Remove ${r.title} from bundle`, () => {
          lib.removeFromBundle(b.id, i);
          draw();
        }, { danger: true }),
      ]),
    );
    return h("article", { class: "st-card" }, h("h3", { class: "st-card-title" }, b.name), h("p", { class: "st-hint" }, plural(b.items.length, "item")), h("ul", { class: "st-list" }, rows), h("div", { class: "st-field" }, h("label", {}, "Bundle name", name)), h("p", { class: "st-row" }, rename, links, del));
  }

  function bundles() {
    const input = h("input", { id: "lib-newb", type: "text", maxlength: "80", autocomplete: "off" });
    const form = h("form", { class: "st-searchbar" }, h("label", { class: "st-sr-only", for: "lib-newb" }, "New bundle name"), input, h("button", { class: "st-btn", type: "submit" }, "Create bundle"));
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const b = lib.createBundle(input.value.trim() || "My bundle");
      say(`Created ${b.name}.`);
      draw();
    });
    const all = lib.bundles();
    return section("lib-bun", `Bundles (${all.length})`, form, all.length ? h("div", { class: "st-class-grid" }, all.map(bundleCard)) : emptyState({ title: "No bundles yet", body: "A bundle groups the lesson, word wall, activity and printables you use together. Build one from Prepare my class, or create an empty one above." }));
  }

  function history() {
    const input = h("input", { id: "lib-hq", type: "search", value: historyQuery, autocomplete: "off", placeholder: "Search what you opened" });
    const out = h("div", {});
    const paint = () => {
      const list = lib.searchHistory(historyQuery);
      out.replaceChildren(list.length ? h("ul", { class: "st-list" }, list.slice(0, 40).map((r) => itemRow(r, shell, [favoriteButton(r, shell), copyLinkBtn(r)]))) : emptyState({ title: historyQuery ? "Nothing in your history matches" : "Nothing opened yet", body: historyQuery ? "Try a different word." : "Lessons and activities you open appear here." }));
    };
    input.addEventListener("input", () => {
      historyQuery = input.value;
      paint();
    });
    const clear = h("button", { class: "st-btn", type: "button" }, "Clear history");
    clear.addEventListener("click", () => {
      lib.clearRecents();
      say("History cleared.");
      draw();
    });
    paint();
    return section("lib-his", "History", h("div", { class: "st-field" }, h("label", { for: "lib-hq" }, "Search history"), input), out, h("p", { class: "st-row" }, clear));
  }

  function backup() {
    const ev = h("input", { type: "checkbox", id: "lib-ev" });
    const exp = h("button", { class: "st-btn", type: "button" }, "Download backup");
    exp.addEventListener("click", () => {
      const data = lib.exportWorkspace({ includeEvidence: ev.checked });
      const blob = new Blob([JSON.stringify(data, null, 1)], { type: "application/json" });
      const a = h("a", { href: URL.createObjectURL(blob), download: `bcpss-teacher-studio-backup-${new Date().toISOString().slice(0, 10)}.json` });
      document.body.append(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 1000);
      say("Backup downloaded.");
    });
    const file = h("input", { type: "file", id: "lib-file", accept: "application/json,.json" });
    const mode = h("select", { id: "lib-mode" }, h("option", { value: "merge" }, "Add to what is here"), h("option", { value: "replace" }, "Replace what is here"));
    const evIn = h("input", { type: "checkbox", id: "lib-evin" });
    const imp = h("button", { class: "st-btn", type: "button" }, "Restore from file");
    imp.addEventListener("click", async () => {
      const f = file.files?.[0];
      if (!f) return say("Choose a backup file first.");
      try {
        const r = lib.importWorkspace(await f.text(), { mode: mode.value, includeEvidence: evIn.checked });
        say(`Restored ${plural(r.classes, "class", "classes")}, ${plural(r.bundles, "bundle")}, ${plural(r.favorites, "favorite")}${r.evidenceKeys ? ` and evidence for ${plural(r.evidenceKeys, "record set")}` : ""}.${r.hasEvidence && !evIn.checked ? " The file also holds evidence, which was left out." : ""}`);
        draw();
      } catch (e) {
        say(e.message);
      }
    });
    return section(
      "lib-bak",
      "Backup and restore",
      h("p", { class: "st-hint" }, "A backup holds your classes, favorites, history, bundles and in-progress activities. It never includes student evidence unless you tick the box."),
      h("div", { class: "st-two" }, h("div", {}, h("h3", {}, "Export"), h("div", { class: "st-checks" }, h("label", {}, ev, "Include pasted class evidence")), h("p", { class: "st-row" }, exp)), h("div", {}, h("h3", {}, "Import"), h("div", { class: "st-field" }, h("label", { for: "lib-file" }, "Backup file"), file), h("div", { class: "st-field" }, h("label", { for: "lib-mode" }, "When restoring"), mode), h("div", { class: "st-checks" }, h("label", {}, evIn, "Also restore evidence found in the file")), h("p", { class: "st-row" }, imp))),
    );
  }

  function draw() {
    const active = document.activeElement?.id;
    body.replaceChildren(favorites(), bundles(), history(), backup());
    if (active) document.getElementById(active)?.focus();
  }
  draw();
}
