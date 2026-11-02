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
import { DESIGN_CSS_LINKS } from "./homework-design-links.mjs";

export const SHARED_DIR = "assets/homework";
const URL_DIR = `/${SHARED_DIR}`;

const DESIGN_URL = new URL("../../assets/design/family/", import.meta.url);
const FONT_URL = "/assets/design/family/fonts/";
/** Fonts the hero paints with. Preloaded so the heading never shows in a fallback face. */
export const HERO_FONTS = ["baloo2-var.woff2", "nunito-var.woff2"];
/** The head marker the generator writes where the design system's links belong. */
export const DESIGN_HEAD_MARK = "<!--fm-design-head-->";

/**
 * The design system as the page's head links: the hero fonts preloaded, then tokens.css, family.css
 * and body.css straight from assets/design/family/ (versioned `?v=` by content hash, see
 * homework-design-links.mjs), then the art kit's palette as one shared hashed file. art.css also
 * declares its own unit hues; those are dropped because the unit identity comes from the tokens
 * (AA-checked), and only the `--art-*` palette the scene and hook art read is kept.
 */
export function designSharedFiles() {
  const art = readFileSync(new URL("art/art.css", DESIGN_URL), "utf8")
    .split("\n")
    .filter((line) => /--art-/.test(line) && !/^\[data-unit/.test(line))
    .join("\n");
  const files = { [`homework-art-${hash(art)}.css`]: `${art}\n` };
  const preload = HERO_FONTS.map(
    (f) => `<link rel="preload" href="${FONT_URL}${f}" as="font" type="font/woff2" crossorigin>`,
  );
  const artLink = Object.keys(files).map((n) => `<link rel="stylesheet" href="${URL_DIR}/${n}">`);
  return { files, head: [...preload, DESIGN_CSS_LINKS, ...artLink].join("\n") };
}

export const MARK = {
  jsShared: "/*hw-shared-js:begin*/",
};

const hash = (text) => createHash("sha256").update(text).digest("hex").slice(0, 10);

/**
 * Split one generated page. Returns the rewritten page and the shared files it
 * references ({ name: content }). Throws if a marker is missing, so a template
 * edit that drops one fails the generator instead of shipping a page that
 * inlines everything again unnoticed.
 */
export function externalizeSharedCode(html, sharedVocab) {
  const files = {};
  const design = designSharedFiles();
  Object.assign(files, design.files);

  // The one inline sheet is the legacy shell (hero, top bar, print): identical on every page.
  const styleOpen = html.indexOf("<style>");
  const styleClose = html.indexOf("</style>", styleOpen);
  if (styleOpen < 0 || styleClose < styleOpen)
    throw new Error("homework page: legacy shell <style> missing");
  const legacy = html.slice(styleOpen + "<style>".length, styleClose).trim();
  const nameCss = `homework-legacy-${hash(legacy)}.css`;
  files[nameCss] = `${legacy}\n`;
  let out =
    html.slice(0, styleOpen) +
    `<link rel="stylesheet" href="${URL_DIR}/${nameCss}">` +
    html.slice(styleClose + "</style>".length);
  if (!out.includes(DESIGN_HEAD_MARK)) throw new Error("homework page: design head marker missing");
  out = out.replace(DESIGN_HEAD_MARK, design.head);

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
  // The glossary every lesson shares, ahead of the core bundle that reads it.
  const vocabJson = JSON.stringify(sharedVocab);
  const nameVocab = `homework-vocab-${hash(vocabJson)}.bundle.js`;
  files[nameVocab] = `window.__HW_VOCAB_SHARED__ = ${vocabJson};\n`;
  out =
    out.slice(0, scriptOpen) +
    `<script>\n${data}\n</script>\n<script src="${URL_DIR}/${nameVocab}"></script>\n<script src="${URL_DIR}/${nameJs}"></script>\n<script src="/assets/family-engagement/engagement-beacon.js" defer></script>` +
    out.slice(scriptClose + "</script>".length);

  return { html: out, files };
}

/**
 * Write the shared files and delete any older generation nothing references.
 * `prune: false` (a scoped --only run) keeps older generations, because pages that were not
 * regenerated still link to them.
 */
export function writeSharedFiles(root, files, { prune = true } = {}) {
  const dir = join(root, SHARED_DIR);
  mkdirSync(dir, { recursive: true });
  for (const [name, content] of Object.entries(files)) {
    const path = join(dir, name);
    if (!existsSync(path) || readFileSync(path, "utf8") !== content) writeFileSync(path, content);
  }
  if (!prune) return;
  for (const name of readdirSync(dir)) {
    if (
      /^homework-(base|layer|legacy|core|vocab|tokens|family|art)-[0-9a-f]{10}\.(css|js|bundle\.js)$/.test(
        name,
      ) &&
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
    /<link rel="stylesheet" href="\/(assets\/(?:homework|design\/family)\/[\w.-]+\.css)(?:\?v=\w+)?">|<script src="\/(assets\/homework\/[\w.-]+\.js)"><\/script>/g,
    (_, css, js) => {
      const text = readFileSync(join(root, css || js), "utf8");
      return css ? `<style>\n${text}</style>` : `<script>\n${text}</script>`;
    },
  );
}
