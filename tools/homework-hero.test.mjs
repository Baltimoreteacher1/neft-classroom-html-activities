// The hero's contract: what the first screen of a family page renders and what its scripts do.
// Markup half: the top bar, the hook card in the lesson's own style, the two route cards, ONE Start button.
// Behavior half (JSDOM): reader options persist, the More sheet opens, Grown-up tips is one switch.
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import { JSDOM } from "jsdom";
import { icon, PAGE_ICONS, renderIconSprite } from "../scripts/lib/family-icons.mjs";
import {
  HERO_JS,
  HOOK_VARIANTS,
  READER_BOOT_JS,
  READER_KEY,
  renderHookCard,
  renderTopBar,
  unitScene,
} from "../scripts/lib/homework-hero.mjs";
import { lessonPath, REPO_ROOT } from "./lib/curriculum-source.mjs";

const notes = (id) =>
  JSON.parse(readFileSync(join(REPO_ROOT, `data/family-homework-notes/${id}.json`), "utf8"));
const ids = readdirSync(join(REPO_ROOT, "data/family-homework-notes"))
  .filter((f) => f.endsWith(".json"))
  .map((f) => f.slice(0, -5));

test("every v3.hook.style has a design-system hook variant and an icon the sprite carries", () => {
  const styles = new Set(ids.map((id) => notes(id).v3?.hook?.style));
  assert.ok(styles.size >= 6);
  for (const style of styles) {
    assert.ok(HOOK_VARIANTS[style], `no hook variant for style "${style}"`);
    assert.ok(PAGE_ICONS.includes(HOOK_VARIANTS[style].icon));
  }
  assert.throws(() => renderHookCard({ style: "nope", en: "x", es: "y" }), /unknown v3.hook.style/);
});

test("all 166 generated pages carry one H1, a hook card in the lesson's style, two routes and one Start", () => {
  // String checks, not a DOM per page: a JSDOM over 166 half-megabyte pages in one loop runs out of memory.
  assert.ok(ids.length >= 160);
  const count = (html, re) => (html.match(re) ?? []).length;
  const esc = (t) =>
    t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  const bad = [];
  for (const id of ids) {
    const html = readFileSync(lessonPath(id, "homework.html"), "utf8");
    const hook = notes(id).v3.hook;
    const checks = {
      h1: count(html, /<h1[\s>]/g) === 1,
      hook: html.includes(
        `<div class="fm-hook hw-hook" data-variant="${HOOK_VARIANTS[hook.style].variant}">`,
      ),
      hookText: html.includes(`<span class="lang-en">${esc(hook.en)}</span>`),
      routes: count(html, /class="hw-route-option fm-route[^"]*" data-route-mode=/g) === 2,
      start: count(html, /id="hw_start_button"/g) === 1,
      artBand: html.includes('<div class="fm-hero__art" aria-hidden="true"><svg'),
      sprite: count(html, /<svg[^>]*class="fm-sprite"/g) === 1,
      tokens: ["tokens", "family", "body"].every((n) =>
        new RegExp(`/assets/design/family/${n}\\.css\\?v=[0-9a-f]{10}"`).test(html),
      ),
      art: /homework-art-[0-9a-f]{10}\.css/.test(html),
      preload: html.includes('rel="preload" href="/assets/design/family/fonts/baloo2-var.woff2"'),
      boot: html.includes(READER_KEY),
      noLegacyBar: !html.includes("hw_colearn_hud") && !html.includes("hw_theme_toggle_btn"),
      moreSheet: html.includes('<dialog class="fm-sheet hw-tools-menu" id="hw_more_sheet"'),
    };
    for (const [name, ok] of Object.entries(checks)) if (!ok) bad.push(`${id}:${name}`);
  }
  assert.deepEqual(bad.slice(0, 10), []);
});

test("every <use> in a page points at a symbol the page's sprite defines", () => {
  for (const id of ["4-5", "1-1", "8-2"]) {
    const d = new JSDOM(readFileSync(lessonPath(id, "homework.html"), "utf8")).window.document;
    const defined = new Set([...d.querySelectorAll("symbol")].map((s) => s.id));
    for (const u of d.querySelectorAll("use"))
      assert.ok(defined.has(u.getAttribute("href").slice(1)), `${id}: ${u.getAttribute("href")}`);
  }
  assert.throws(() => icon("not-an-icon"), /not in PAGE_ICONS/);
  assert.throws(() => renderIconSprite(["nope"]), /not in assets/);
});

test("every unit has a scene, and the top bar has no dev-style readout", () => {
  for (let u = 1; u <= 10; u++) assert.match(unitScene(u), /^<svg/);
  const bar = renderTopBar({ readAloud: { en: "a", es: "b" } });
  assert.match(bar, /data-persona-btn="copilot"/);
  assert.match(bar, /data-open-sheet="hw_more_sheet"/);
  assert.match(bar, /data-lang-mode="bilingual"/);
  assert.doesNotMatch(bar, /Completed:|Accuracy:|Streak:/);
});

test("reader options persist, apply before paint and the More sheet opens", () => {
  const html = `<!doctype html><html><head><script>${READER_BOOT_JS}</script></head><body>
    <button data-fm-text-cycle></button><button data-open-sheet="s" id="open"></button>
    <dialog id="s" class="fm-sheet"><button data-close id="close"></button>
      <input type="radio" name="fm-theme" value="auto" data-fm-pref="theme"><input type="radio" name="fm-theme" value="dark" data-fm-pref="theme">
      <button class="fm-switch" role="switch" aria-checked="false" data-fm-switch="reading"><span class="fm-switch__state"></span></button></dialog>
    <p class="fm-save" data-fm-save data-state="saved"></p><script>${HERO_JS}</script></body></html>`;
  const dom = new JSDOM(html, { runScripts: "dangerously", url: "https://example.test/" });
  const w = dom.window;
  const root = w.document.documentElement;
  const stored = () => JSON.parse(w.localStorage.getItem(READER_KEY));
  w.document.querySelector("[data-fm-text-cycle]").click();
  assert.equal(root.getAttribute("data-text-size"), "115");
  assert.equal(stored().text, "115");
  w.document.querySelector('[data-fm-switch="reading"]').click();
  assert.equal(root.getAttribute("data-reading"), "dyslexia");
  assert.equal(
    w.document.querySelector('[data-fm-switch="reading"]').getAttribute("aria-checked"),
    "true",
  );
  const dark = w.document.querySelector('input[value="dark"]');
  dark.checked = true;
  dark.dispatchEvent(new w.Event("change", { bubbles: true }));
  assert.equal(root.getAttribute("data-theme"), "dark");
  // A second page load reads the saved options in the head script, before first paint.
  const again = new JSDOM(
    `<html><head><script>${READER_BOOT_JS}</script></head><body></body></html>`,
    {
      runScripts: "dangerously",
      url: "https://example.test/",
    },
  );
  assert.equal(
    again.window.document.documentElement.getAttribute("data-theme"),
    null,
    "separate origin storage",
  );
  w.localStorage.setItem(
    READER_KEY,
    JSON.stringify({ theme: "contrast", text: "130", spacing: "more", reading: "dyslexia" }),
  );
  const third = new JSDOM(
    `<html><head><script>${READER_BOOT_JS}</script></head><body></body></html>`,
    { runScripts: "dangerously", url: "https://example.test/" },
  );
  third.window.localStorage.setItem(READER_KEY, w.localStorage.getItem(READER_KEY));
  third.window.eval(READER_BOOT_JS);
  const r = third.window.document.documentElement;
  assert.deepEqual(
    [r.dataset.theme, r.dataset.textSize, r.dataset.spacing, r.dataset.reading],
    ["contrast", "130", "more", "dyslexia"],
  );
  // A hostile value is ignored, never written to the page.
  third.window.localStorage.setItem(
    READER_KEY,
    JSON.stringify({ theme: 'x" onload="1', text: "999" }),
  );
  r.removeAttribute("data-theme");
  r.removeAttribute("data-text-size");
  third.window.eval(READER_BOOT_JS);
  assert.equal(r.getAttribute("data-theme"), null);
  assert.equal(r.getAttribute("data-text-size"), null);
});
