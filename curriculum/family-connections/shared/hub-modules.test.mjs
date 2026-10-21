/* The pure parts of the weekly hub: which language it opens in, what the welcome
 * file may contain, and how the welcome card is built. */
import assert from "node:assert/strict";
import { test } from "node:test";
import { JSDOM } from "jsdom";
import { isLocalAsset, isMondayKey, normalizeWelcome, welcomeForWeek, welcomeProblems } from "./family-welcome.js";
import { readLanguageMode, resolveHubLanguage, writeLanguageMode } from "./hub-language.js";
import { welcomeCard } from "./hub-panels.js";

test("language: an address beats a lesson-page choice beats older hub visits beats a Spanish browser", () => {
  const r = resolveHubLanguage;
  assert.deepEqual(r({ queryLang: "es", storedMode: "en" }), { language: "es", chosen: true });
  assert.deepEqual(r({ queryLang: "en", storedMode: "es" }), { language: "en", chosen: true });
  assert.deepEqual(r({ storedMode: "es", saved: { language: "en", languageChosen: true } }), { language: "es", chosen: true });
  assert.deepEqual(r({ saved: { language: "en", languageChosen: true }, browserLanguages: ["es-MX"] }), { language: "en", chosen: true });
  assert.deepEqual(r({ saved: { language: "es" } }), { language: "es", chosen: true }, "an old saved es was a person's doing");
  assert.deepEqual(r({ saved: { language: "en" }, browserLanguages: ["es-US"] }), { language: "es", chosen: false }, "an old saved en was automatic");
  assert.deepEqual(r({ browserLanguages: ["ES"] }), { language: "es", chosen: false });
  assert.deepEqual(r({}), { language: "en", chosen: false });
  // The lesson page's third mode is not a hub language and is not overridden by looking.
  assert.deepEqual(r({ storedMode: "bilingual" }), { language: "en", chosen: false });
  assert.deepEqual(r({ queryLang: "fr", storedMode: "ar" }), { language: "en", chosen: false }, "only English and Spanish exist");
});

test("language storage never throws and only writes en or es", () => {
  const store = new Map();
  const storage = { getItem: (k) => store.get(k) ?? null, setItem: (k, v) => store.set(k, v) };
  assert.equal(writeLanguageMode(storage, "es"), true);
  assert.equal(store.get("hw_lang_mode"), "es");
  assert.equal(readLanguageMode(storage), "es");
  assert.throws(() => writeLanguageMode(storage, "bilingual"), /unsupported language/);
  assert.throws(() => writeLanguageMode(storage, "ar"), /unsupported language/);
  const blocked = {
    getItem() {
      throw new Error("denied");
    },
    setItem() {
      throw new Error("denied");
    },
  };
  assert.equal(readLanguageMode(blocked), "");
  assert.equal(writeLanguageMode(blocked, "en"), false);
  assert.equal(readLanguageMode(null), "");
});

const note = { en: "Hello", es: "Hola" };
const video = {
  src: "/welcome/w.mp4",
  captions: { en: "/welcome/w.en.vtt", es: "/welcome/w.es.vtt" },
};
const MONDAY = "2026-10-26";

test("welcome: the strict check names each defect", () => {
  assert.deepEqual(welcomeProblems({ enabled: false, weeks: {} }), []);
  assert.deepEqual(welcomeProblems({ enabled: true, weeks: { [MONDAY]: { ...note, video } } }), []);
  const bad = (entry) => welcomeProblems({ enabled: true, weeks: { [MONDAY]: entry } }).join("\n");
  assert.match(bad({ ...note, video: { src: video.src, captions: { en: video.captions.en } } }), /captions\.es must be a site path ending \.vtt/);
  assert.match(bad({ ...note, video: { src: video.src } }), /BOTH English and Spanish/);
  assert.match(bad({ ...note, video: { ...video, captions: { ...video.captions, fr: "/x.vtt" } } }), /English and Spanish only/);
  assert.match(bad({ en: "Hello" }), /"es" is required/);
  assert.match(bad({ en: "Same", es: "Same" }), /copy of the English/);
  assert.match(bad({ ...note, extra: 1 }), /unknown field "extra"/);
  assert.match(welcomeProblems({ enabled: true, weeks: { "2026-10-27": note } }).join(), /real Monday/);
});

test("welcome: only same-site files of the right kind, never a URL or a climb", () => {
  assert.equal(isLocalAsset("/a/b.mp4", /\.mp4$/), true);
  for (const bad of ["https://x.test/a.mp4", "//x.test/a.mp4", "a/b.mp4", "/a/../b.mp4", "/a b.mp4", "/a/b.mov", "", null])
    assert.equal(isLocalAsset(bad, /\.mp4$/), false, String(bad));
  assert.equal(isMondayKey("2026-10-26"), true);
  for (const bad of ["2026-10-25", "2026-02-30", "26-10-26", "", "2026-10-26T00:00"]) assert.equal(isMondayKey(bad), false, bad);
});

test("welcome: the browser view drops what the check refuses and never throws", () => {
  for (const raw of [null, undefined, 3, "x", [], { enabled: "true" }, { enabled: true }, { enabled: true, weeks: [] }])
    assert.deepEqual(normalizeWelcome(raw), { enabled: false, weeks: {} });
  const shown = normalizeWelcome({
    enabled: true,
    weeks: {
      [MONDAY]: { ...note, video, junk: "ignored" },
      "2026-11-02": { ...note, video: { src: video.src, captions: { en: video.captions.en } } },
      "2026-11-09": { en: "only english" },
      "2026-11-11": note,
    },
  });
  assert.deepEqual(Object.keys(shown.weeks).sort(), [MONDAY, "2026-11-02"]);
  assert.deepEqual(shown.weeks[MONDAY], { ...note, video });
  assert.equal(shown.weeks["2026-11-02"].video, undefined, "text kept, half-captioned video dropped");
  assert.equal(welcomeForWeek(shown, "2026-11-16"), null);
  assert.equal(welcomeForWeek(null, MONDAY), null);
});

test("the welcome card sets text as text and builds an accessible, lazy, captioned player", () => {
  const dom = new JSDOM("");
  const previous = globalThis.document;
  globalThis.document = dom.window.document;
  try {
    const xss = { en: "<img src=x onerror=alert(1)>", es: "<b>hola</b>", video: { ...video, poster: "/welcome/p.jpg" } };
    const card = welcomeCard(xss, "es");
    assert.equal(card.querySelector("img, b"), null);
    assert.equal(card.querySelector(".welcome-text").textContent, "<b>hola</b>");
    const player = card.querySelector("video");
    assert.equal(player.getAttribute("preload"), "none");
    assert.equal(player.hasAttribute("controls"), true);
    assert.equal(player.hasAttribute("playsinline"), true);
    assert.equal(player.getAttribute("poster"), "/welcome/p.jpg");
    assert.equal(player.querySelector("source").getAttribute("type"), "video/mp4");
    const tracks = [...player.querySelectorAll("track")];
    assert.deepEqual(tracks.map((t) => [t.getAttribute("kind"), t.getAttribute("srclang"), t.getAttribute("label"), t.getAttribute("src")]), [
      ["captions", "es", "Español", "/welcome/w.es.vtt"],
      ["captions", "en", "English", "/welcome/w.en.vtt"],
    ]);
    assert.equal(card.getAttribute("aria-labelledby"), card.querySelector("h3").id);
  } finally {
    globalThis.document = previous;
    dom.window.close();
  }
});
