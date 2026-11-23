// Projects view. Routes: #/projects (browse) and #/project/<id> (one project as a teacher plan).
// Projects are original, standards-aligned plans; nothing here is a score or an official WIDA or district resource.
import { h } from "../core/dom.js";
import { loadProjects } from "./projects/data.js";

const SHEET = new URL("./projects/projects.css", import.meta.url).href;

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
        retry ? h("button", { class: "st-btn st-btn-primary", type: "button", onclick: retry }, "Try again") : null,
        h("a", { class: "st-btn", href: "#/projects" }, "All projects"),
        h("a", { class: "st-btn", href: "#/" }, "Home"),
      ),
    ),
  );
}

export async function render({ root, params, shell }) {
  root.classList.add("st-pj-root");
  const cleanups = [() => root.classList.remove("st-pj-root")];
  const run = () =>
    cleanups
      .splice(0)
      .reverse()
      .forEach((fn) => fn());
  const retry = () => window.dispatchEvent(new HashChangeEvent("hashchange"));
  root.replaceChildren(h("p", { class: "st-loading", role: "status" }, "Loading projects"));

  if (params.id) {
    let project;
    try {
      [project] = await Promise.all([shell.catalog.project(params.id), loadStyles()]);
    } catch (err) {
      const known = await shell.catalog.byKind("project").then((l) => l.some((e) => e.id === params.id)).catch(() => false);
      console.warn("[studio] project failed", err);
      stateBox(root, {
        title: known ? "This project did not load" : "That project was not found",
        body: known ? "Its file could not be read. Check your connection and try again. Nothing on this device was changed." : `There is no project called "${params.id}". It may have been renamed.`,
        retry: known ? retry : null,
      });
      return run;
    }
    try {
      shell.library.addRecent({ kind: "project", id: project.id, title: project.title, grade: project.grade, subject: project.subject });
    } catch {
      /* recents are a convenience */
    }
    shell.setTitle(project.title);
    const { renderDetail } = await import("./projects/detail.js");
    const cleanup = await renderDetail({ root, params, shell, project });
    if (typeof cleanup === "function") cleanups.push(cleanup);
    return run;
  }

  let data;
  try {
    [data] = await Promise.all([loadProjects(shell), loadStyles()]);
  } catch (err) {
    console.warn("[studio] project list failed", err);
    stateBox(root, { title: "Projects did not load", body: "The project list could not be read. Check your connection and try again. Nothing on this device was changed.", retry });
    return run;
  }
  root.replaceChildren();
  shell.setTitle("Projects");
  const { renderBrowse } = await import("./projects/browse.js");
  renderBrowse({ root, params, shell, data });
  if (data.failed.length)
    root.append(h("p", { class: "st-pj-note", role: "status" }, `${data.failed.length} project${data.failed.length === 1 ? "" : "s"} could not be read and ${data.failed.length === 1 ? "is" : "are"} not shown. Reload to try again.`));
  return run;
}
