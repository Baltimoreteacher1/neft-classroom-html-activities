/**
 * Shared code for the family homework pages, served once instead of 166 times.
 *
 * Every homework.html used to inline ~430 KB of script and ~213 KB of CSS that
 * are byte-identical across all 166 pages (audit 2026-10-04: only the lesson id,
 * title, vocabulary and the unit theme differ). Inlined, none of it can be
 * cached between nights, so a family on a phone re-downloads it for every
 * lesson. The generator marks the shared stretches with comments; this module
 * moves each one into a content-hashed file under assets/homework/ and leaves
 * the per-lesson data inline, in the same order, so the page executes and
 * cascades exactly as before.
 */
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";

export const SHARED_DIR = "assets/homework";
const URL_DIR = `/${SHARED_DIR}`;

export const MARK = {
  cssThemeBegin: "/*hw-theme:begin*/",
  cssThemeEnd: "/*hw-theme:end*/",
  jsShared: "/*hw-shared-js:begin*/",
};

const hash = (text) => createHash("sha256").update(text).digest("hex").slice(0, 10);

/**
 * Split one generated page. Returns the rewritten page and the shared files it
 * references ({ name: content }). Throws if a marker is missing, so a template
 * edit that drops one fails the generator instead of shipping a page that
 * inlines everything again unnoticed.
 */
export function externalizeSharedCode(html) {
  const files = {};

  const styleOpen = html.indexOf("<style>");
  const styleClose = html.indexOf("</style>", styleOpen);
  const css = html.slice(styleOpen + "<style>".length, styleClose);
  const tb = css.indexOf(MARK.cssThemeBegin);
  const te = css.indexOf(MARK.cssThemeEnd);
  if (styleOpen < 0 || tb < 0 || te < tb)
    throw new Error("homework page: CSS theme markers missing");
  const cssA = css.slice(0, tb).trim();
  const theme = css.slice(tb + MARK.cssThemeBegin.length, te).trim();
  const cssB = css.slice(te + MARK.cssThemeEnd.length).trim();
  const nameA = `homework-base-${hash(cssA)}.css`;
  const nameB = `homework-layer-${hash(cssB)}.css`;
  files[nameA] = `${cssA}\n`;
  files[nameB] = `${cssB}\n`;
  const styleHtml = [
    `<link rel="stylesheet" href="${URL_DIR}/${nameA}">`,
    `<style>\n${theme}\n</style>`,
    `<link rel="stylesheet" href="${URL_DIR}/${nameB}">`,
  ].join("\n");
  let out = html.slice(0, styleOpen) + styleHtml + html.slice(styleClose + "</style>".length);

  const js = out.indexOf(MARK.jsShared);
  if (js < 0) throw new Error("homework page: shared-JS marker missing");
  const scriptOpen = out.lastIndexOf("<script>", js);
  const scriptClose = out.indexOf("</script>", js);
  const data = out.slice(scriptOpen + "<script>".length, js).trim();
  const shared = out.slice(js + MARK.jsShared.length, scriptClose).trim();
  // `.bundle.js`: a concatenation of the generator's script modules, excluded
  // from Biome like every other bundle (it was never linted while inline).
  const nameJs = `homework-core-${hash(shared)}.bundle.js`;
  files[nameJs] = `${shared}\n`;
  out =
    out.slice(0, scriptOpen) +
    `<script>\n${data}\n</script>\n<script src="${URL_DIR}/${nameJs}"></script>` +
    out.slice(scriptClose + "</script>".length);

  return { html: out, files };
}

/** Write the shared files and delete any older generation nothing references. */
export function writeSharedFiles(root, files) {
  const dir = join(root, SHARED_DIR);
  mkdirSync(dir, { recursive: true });
  for (const [name, content] of Object.entries(files)) {
    const path = join(dir, name);
    if (!existsSync(path) || readFileSync(path, "utf8") !== content) writeFileSync(path, content);
  }
  for (const name of readdirSync(dir)) {
    if (
      /^homework-(base|layer|core)-[0-9a-f]{10}\.(css|js|bundle\.js)$/.test(name) &&
      !(name in files)
    ) {
      rmSync(join(dir, name));
    }
  }
}

/** --check: every referenced shared file exists with exactly this content. */
export function staleSharedFiles(root, files) {
  return Object.entries(files)
    .filter(([name, content]) => {
      const path = join(root, SHARED_DIR, name);
      return !existsSync(path) || readFileSync(path, "utf8") !== content;
    })
    .map(([name]) => `${SHARED_DIR}/${name}`);
}

/**
 * A homework page with its shared files read back in from disk — what a
 * browser assembles from the network. For jsdom tests and offline tooling,
 * which have no server to fetch /assets/homework/ from.
 */
export function inlineSharedFromDisk(root, html) {
  return html.replace(
    /<link rel="stylesheet" href="\/(assets\/homework\/[\w.-]+\.css)">|<script src="\/(assets\/homework\/[\w.-]+\.js)"><\/script>/g,
    (_, css, js) => {
      const text = readFileSync(join(root, css || js), "utf8");
      return css ? `<style>\n${text}</style>` : `<script>\n${text}</script>`;
    },
  );
}
