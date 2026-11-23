// WIDA practice view. Routes: #/wida (hub), #/wida/<collection id>, #/wida/path?class=<id>
// Always "WIDA-aligned original practice": never a score, never an ACCESS prediction, never official items, untimed.
import { h } from "../core/dom.js";
import { loadWida } from "./wida/data.js";

const SHEET = new URL("./wida/wida.css", import.meta.url).href;

function loadStyles() {
  if (document.querySelector(`link[href="${SHEET}"]`)) return Promise.resolve();
  return new Promise((resolve) => {
    const link = h("link", { rel: "stylesheet", href: SHEET });
    link.addEventListener("load", resolve);
    link.addEventListener("error", resolve);
    document.head.append(link);
    setTimeout(resolve, 1500);
  });
}

function stateBox(root, { title, body, retry }) {
  root.replaceChildren(
    h(
      "section",
      { class: "st-state", role: "alert" },
      h("h1", {}, title),
      h("p", {}, body),
      h(
        "p",
        { class: "st-row" },
        retry
          ? h(
              "button",
              { class: "st-btn st-btn-primary", type: "button", onclick: retry },
              "Try again",
            )
          : null,
        h("a", { class: "st-btn", href: "#/wida" }, "All WIDA practice"),
        h("a", { class: "st-btn", href: "#/" }, "Home"),
      ),
    ),
  );
}

export async function render({ root, params, shell }) {
  root.classList.add("st-wida-root");
  const cleanups = [() => root.classList.remove("st-wida-root")];
  const run = () =>
    cleanups
      .splice(0)
      .reverse()
      .forEach((fn) => fn());
  const retry = () => window.dispatchEvent(new HashChangeEvent("hashchange"));
  root.replaceChildren(h("p", { class: "st-loading", role: "status" }, "Loading WIDA practice"));

  let data;
  try {
    [data] = await Promise.all([loadWida(shell), loadStyles()]);
  } catch (err) {
    console.warn("[studio] wida data failed", err);
    stateBox(root, {
      title: "WIDA practice did not load",
      body: "The practice list could not be read. Check your connection and try again. Nothing on this device was changed.",
      retry,
    });
    return run;
  }
  root.replaceChildren();

  if (params.id === "path") {
    shell.setTitle("WIDA practice path");
    const { renderPath } = await import("./wida/path.js");
    renderPath({ root, params, shell, data });
    return run;
  }
  if (params.id) {
    let collection;
    try {
      collection = await shell.catalog.wida(params.id);
    } catch {
      const known = data.entries.some((e) => e.id === params.id);
      stateBox(root, {
        title: known ? "This practice did not load" : "That practice was not found",
        body: known
          ? "Its file could not be read. Try again."
          : `There is no WIDA practice called "${params.id}". It may have been renamed.`,
        retry: known ? retry : null,
      });
      return run;
    }
    try {
      shell.library.addRecent({
        kind: "wida",
        id: collection.id,
        title: collection.title,
        grade: collection.grade,
        subject: collection.subject,
      });
    } catch {
      /* recents are a convenience */
    }
    shell.setTitle(`${collection.title}: WIDA practice`);
    const { renderCollection } = await import("./wida/collection.js");
    const c = renderCollection({ root, params, shell, collection, data });
    if (typeof c === "function") cleanups.push(c);
    return run;
  }
  shell.setTitle("WIDA practice");
  const { renderHub } = await import("./wida/hub.js");
  renderHub({ root, params, shell, data });
  return run;
}
