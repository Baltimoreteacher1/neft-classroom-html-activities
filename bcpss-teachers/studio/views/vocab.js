// Vocabulary view: library, collection page, word wall and explorer. Routes: #/vocab[/<id>[/wall|/explore]]
import { h } from "../core/dom.js";
import { loadCollections } from "./vocab/source.js";
import { studentSafe } from "./vocab/model.js";
import { ensureVisuals } from "./vocab/visual.js";

const SHEETS = ["vocab.css", "vocab/wall.css", "vocab/explore.css"];

function loadStyles() {
  return Promise.all(
    SHEETS.map((name) => {
      const href = new URL(name, import.meta.url).href;
      if ([...document.styleSheets].some((s) => s.href === href) || document.querySelector(`link[href="${href}"]`)) return null;
      return new Promise((resolve) => {
        const link = h("link", { rel: "stylesheet", href });
        link.addEventListener("load", resolve);
        link.addEventListener("error", resolve);
        document.head.append(link);
        setTimeout(resolve, 1500);
      });
    }),
  );
}

function stateBox(root, { title, body, retry }) {
  root.replaceChildren(
    h(
      "section",
      { class: "st-v-state", role: "alert" },
      h("h1", {}, title),
      h("p", {}, body),
      h("p", { class: "st-v-row" }, retry ? h("button", { class: "st-v-btn st-v-primary", type: "button", onclick: retry }, "Try again") : null, h("a", { class: "st-v-btn", href: "#/vocab" }, "All vocabulary collections")),
    ),
  );
}

export async function render({ root, params, shell }) {
  const student = params.student === "1";
  const cleanups = [];
  if (student) {
    document.documentElement.dataset.vocabStudent = "1";
    cleanups.push(() => delete document.documentElement.dataset.vocabStudent);
  }
  root.classList.add("st-v-root");
  cleanups.push(() => root.classList.remove("st-v-root"));
  const run = () => cleanups.splice(0).reverse().forEach((fn) => fn());
  root.replaceChildren(h("p", { class: "st-v-loading", role: "status" }, "Loading vocabulary"));

  const [{ collections, failed }] = await Promise.all([loadCollections(shell).catch(() => ({ collections: [], failed: ["*"] })), loadStyles(), ensureVisuals()]);
  const retry = () => window.dispatchEvent(new HashChangeEvent("hashchange"));

  if (!params.id) {
    if (failed.length && !collections.length) {
      stateBox(root, { title: "Vocabulary did not load", body: "The collections could not be read. Check your connection and try again. Nothing on this device was changed.", retry });
      return run;
    }
    const { renderLibrary } = await import("./vocab/library.js");
    const c = renderLibrary({ root, params, shell, collections, failed });
    if (typeof c === "function") cleanups.push(c);
    return run;
  }

  const source = collections.find((c) => c.id === params.id);
  if (!source) {
    stateBox(root, {
      title: "That vocabulary collection was not found",
      body: failed.length ? "Some collections could not be loaded. Try again, or open the full list." : `There is no collection called "${params.id}". It may have been renamed.`,
      retry: failed.length ? retry : null,
    });
    return run;
  }
  const collection = student ? studentSafe(source) : source;
  try {
    shell.library.addRecent({ kind: "vocab", id: collection.id, title: collection.title, grade: collection.grade, subject: collection.subject });
  } catch {
    /* recents are a convenience */
  }
  const sub = params.sub === "wall" || params.sub === "explore" ? params.sub : "";
  const mod = await import(sub === "wall" ? "./vocab/wall.js" : sub === "explore" ? "./vocab/explore.js" : "./vocab/collection.js");
  const c = mod.render({ root, params, shell, collection, student, siblings: collections });
  if (typeof c === "function") cleanups.push(c);
  shell.setTitle(`${collection.title}${sub === "wall" ? ": word wall" : sub === "explore" ? ": explore" : ": vocabulary"}`);
  return run;
}

