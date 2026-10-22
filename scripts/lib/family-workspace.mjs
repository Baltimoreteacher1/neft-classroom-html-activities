/**
 * The per-problem Workspace on the server side: markup, styles and script for the family homework
 * pages and the family and student word-problems pages. The component itself lives in
 * assets/workspace/ (problem-workspace.js, problem-workspace.css) so the Practice Studios load the
 * very same files; this module loads the script in Node to write the markup, and hands the page
 * the file text to inline. Nothing about the workspace is written twice.
 */
import { readFileSync } from "node:fs";
import vm from "node:vm";

const read = (name) =>
  readFileSync(new URL(`../../assets/workspace/${name}`, import.meta.url), "utf8");

export const WORKSPACE_JS = read("problem-workspace.js");
export const WORKSPACE_CSS = read("problem-workspace.css");

const component = (() => {
  const sandbox = {};
  vm.runInNewContext(WORKSPACE_JS, sandbox);
  return sandbox.NTWorkspace;
})();

export const { GUIDE_STEPS, stampForUnit } = component;

/** One workspace, as a lean shell: the page script builds the toolbar and guide on first open. */
export const workspaceHtml = (options) => component.html({ lazy: true, ...options });
