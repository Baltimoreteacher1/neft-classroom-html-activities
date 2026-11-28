// Premium Language Labs hub (access-practice-lab/src/labs/hub-premium.js, notebook.js, art.js, language-labs-premium.css):
// every hook of the original hub survives in grades 3-5 and 6-8 and in EN / ES / EN+ES, Spanish never replaces the
// English lab names, stamps come only from the existing progress record and ledger, no learner text is rendered, and
// the stylesheet is scoped to the hub and declares motion only for people who have not asked for less.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const LAB = new URL("../access-practice-lab/", import.meta.url);
const { makeI18n } = await import(new URL("src/i18n.js", LAB));
const { toHtml } = await import(new URL("src/util.js", LAB));
const C = await import(new URL("src/content/language-labs.js", LAB));
const { premiumHubHTML } = await import(new URL("src/labs/hub-premium.js", LAB));
const { notebookFor, HERE_STAMPS, BUILDER_STAMPS, guidedLength } = await import(
  new URL("src/labs/notebook.js", LAB)
);
const { labScene } = await import(new URL("src/labs/art.js", LAB));

const BANDS = ["3-5", "6-8"];
const MODES = ["en", "es", "bi"];
const render = (mode, band, st = {}, helpers = {}) =>
  toHtml(
    premiumHubHTML({ band, prefs: { lang: mode } }, makeI18n(mode), st, band, {
      entries: [],
      ...helpers,
    }),
  );
const count = (s, re) => (s.match(re) || []).length;

const fullVerb = (band) => ({
  seen: [1, 2, 3, 4, 5],
  explore: { at: 1 },
  guided: guidedLength("verb-time-machine", band),
  practice: Object.fromEntries(
    C.VERB_ITEMS.filter((x) => x.band === band).map((x) => [x.id, { ok: true }]),
  ),
  transfer: { text: "", ok: true, checks: 1, hint: false, topic: 0 },
});
const labsEntry = (over = {}) => ({
  id: "e1",
  t: "2026-11-01T00:00:00Z",
  src: "labs",
  band: "6-8",
  stage: "independent",
  m: { ok: 1, lab: "verb-time-machine", transfer: 1 },
  ...over,
});

test("every hook of the original hub survives in both bands and all three language modes", () => {
  for (const band of BANDS)
    for (const mode of MODES) {
      const h = render(mode, band);
      const tag = `${band}/${mode}`;
      assert.match(h, /^<section class="ll-hub llp /, tag);
      assert.equal(count(h, /<a class="ll-card /g), 6, `${tag}: six lab cards`);
      for (const l of C.LABS) {
        const href = l.here
          ? `/access-practice-lab/language-labs/${l.id}?step=1&amp;grades=${band}`
          : `/access-practice-lab/${l.href}?grades=${band}`;
        assert.ok(h.includes(`href="${href}"`), `${tag}: link to ${l.id}`);
      }
      for (const id of ["all", "word", "sentence", "discourse"])
        assert.ok(h.includes(`data-ll-dim-filter="${id}"`), `${tag}: filter ${id}`);
      assert.equal(count(h, /data-ll-dim-filter=/g), 4, tag);
      assert.equal(count(h, /aria-pressed="(true|false)"/g), 4, tag);
      assert.equal(count(h, /<h1 tabindex="-1">/g), 1, tag);
      assert.equal(count(h, /data-ll-speak="/g), 4, `${tag}: one Listen button per craft lesson`);
      for (const id of ["llCatH", "llJourneyH", "llCraftH", "llGuidesH"])
        assert.ok(h.includes(`id="${id}"`), `${tag}: #${id}`);
      assert.equal(count(h, /<details class="llp-guide" open>/g), 2, tag);
      assert.ok(
        h.includes(`/access-practice-lab/book-studio?grades=${band}`),
        `${tag}: Book Studio link`,
      );
      for (const p of C.programForLab(band).craft)
        assert.ok(
          h.includes(`${p.href}${p.href.includes("?") ? "&amp;" : "?"}grades=${band}`),
          `${tag}: craft ${p.id}`,
        );
      assert.equal(count(h, /<li class="llp-station"/g), 5, tag);
      assert.ok(!/<script|onclick=|javascript:/i.test(h), `${tag}: no script`);
      assert.equal(
        count(h, /<svg class="llp-art /g),
        6 + 3 + 1,
        `${tag}: six covers, three plates, one next-up scene`,
      );
    }
});

test("the dimension filter hides cards with the hidden attribute, as the original hub did", () => {
  const h = render("en", "6-8", {}, { dimFilter: "word" });
  assert.equal(count(h, /<li hidden>/g), 4);
  assert.ok(
    h.includes('data-ll-dim-filter="word"') &&
      /class="chip is-on"\s+data-ll-dim-filter="word"/.test(h),
  );
  assert.equal(count(render("en", "6-8"), /<li hidden>/g), 0);
});

test("Spanish and EN+ES keep the English lab names; ES chrome is Spanish", () => {
  for (const band of BANDS)
    for (const mode of ["es", "bi"]) {
      const h = render(mode, band);
      for (const l of C.LABS) {
        assert.ok(
          h.includes(`<span class="llp-card-name">${l.title[0].replace(/&/g, "&amp;")}`) ||
            h.includes(l.title[0]),
          `${mode}: ${l.title[0]}`,
        );
        const name = new RegExp(`llp-card-name">(<span class="bi-pair">)?${l.title[0]}`);
        assert.match(h, name, `${band}/${mode}: card name stays English for ${l.id}`);
      }
      for (const l of C.LABS)
        assert.ok(h.includes(l.mentor[band]), `${mode}: mentor sentence is English`);
    }
  const es = render("es", "6-8");
  assert.ok(
    es.includes("Elige un laboratorio de lenguaje") && es.includes("Tus sellos de descubrimiento"),
  );
  assert.ok(!/Choose a language lab/.test(es));
  assert.ok(render("bi", "3-5").includes('lang="es"'));
});

test("stamps: See it needs a step beyond it; Explore needs a recorded action; Example needs every guided step", () => {
  const get = (ls, band = "6-8", entries = []) =>
    notebookFor({ "verb-time-machine": { [band]: ls } }, band, entries).labs[0];
  const earned = (p) => Object.fromEntries(p.stamps.map((s) => [s.id, s.earned]));
  assert.deepEqual(Object.values(earned(get({}))), Array(6).fill(false));
  assert.equal(earned(get({ seen: [1] })).see, false);
  assert.equal(earned(get({ seen: [1, 2] })).see, true);
  assert.equal(
    earned(get({ seen: [1, 2] })).explore,
    false,
    "opening Explore as the last step is not enough",
  );
  assert.equal(earned(get({ seen: [1, 2, 3] })).explore, true, "moved on from Explore");
  assert.equal(
    earned(get({ seen: [1, 2], explore: { at: 3 } })).explore,
    true,
    "a recorded control change counts",
  );
  const g = guidedLength("verb-time-machine", "6-8");
  assert.equal(earned(get({ guided: g - 1 })).example, false);
  assert.equal(earned(get({ guided: g })).example, true);
});

test("stamps: Practice needs every item solved; New task and On my own follow the checks and the ledger", () => {
  const items = C.VERB_ITEMS.filter((x) => x.band === "6-8");
  const part = Object.fromEntries(items.slice(0, -1).map((x) => [x.id, { ok: true }]));
  const get = (ls, entries = []) =>
    notebookFor({ "verb-time-machine": { "6-8": ls } }, "6-8", entries).labs[0];
  const p = get({ practice: part });
  assert.equal(p.stamps.find((s) => s.id === "practice").earned, false);
  assert.deepEqual(p.practice, { solved: items.length - 1, total: items.length });
  const full = fullVerb("6-8");
  assert.equal(get(full).stamps.find((s) => s.id === "practice").earned, true);
  // independent: the ledger says the passing check was made with no support
  assert.equal(get(full, [labsEntry()]).stamps.find((s) => s.id === "solo").earned, true);
  assert.equal(
    get(full, [labsEntry({ stage: "supported" })]).stamps.find((s) => s.id === "solo").earned,
    false,
  );
  assert.equal(
    get({ ...full, transfer: { ...full.transfer, hint: true } }, [
      labsEntry({ stage: "supported" }),
    ]).stamps.find((s) => s.id === "task").earned,
    true,
  );
  // a different band's entry never counts
  const hinted = { ...full, transfer: { ...full.transfer, hint: true } };
  assert.equal(
    get(hinted, [labsEntry({ band: "3-5" })]).stamps.find((s) => s.id === "solo").earned,
    false,
  );
  assert.equal(
    get(full, []).stamps.find((s) => s.id === "solo").earned,
    true,
    "no ledger: state shows no hint was opened",
  );
  assert.equal(get(hinted, []).stamps.find((s) => s.id === "solo").earned, false);
  assert.equal(get(full, [labsEntry()]).complete, true);
  assert.equal(get({ ...full, explore: {}, seen: [1] }).complete, false);
});

test("stamps: scaffold builders count distinct finished tasks and independent builds in this band", () => {
  const e = (task, stage, ok = 1, band = "6-8") => ({
    id: task + stage,
    t: "2026-11-01T00:00:00Z",
    src: "scaffold",
    task,
    band,
    stage,
    m: { ok, tool: "sentence-architecture" },
  });
  const p = (entries) =>
    notebookFor({}, "6-8", entries).labs.find((x) => x.lab.id === "sentence-expansion");
  assert.equal(p([]).earned, 0);
  assert.equal(p([e("a", "guided", 0)]).started, true);
  assert.equal(p([e("a", "guided", 0)]).earned, 0, "an unfinished try is not a stamp");
  assert.equal(
    p([e("a", "guided"), e("a", "guided")]).earned,
    1,
    "the same task twice is one build",
  );
  assert.equal(p([e("a", "guided"), e("b", "supported")]).earned, 2);
  const all = p([e("a", "independent"), e("b", "guided")]);
  assert.equal(all.earned, 3);
  assert.equal(all.complete, true);
  assert.equal(p([e("a", "independent", 1, "3-5")]).earned, 0);
  assert.equal(p([]).stamps.length, BUILDER_STAMPS.length);
  assert.equal(HERE_STAMPS.filter((s) => !s.bonus).length, 5);
});

test("Next up resumes at the first stamp not yet earned and moves on when a lab is complete", () => {
  const n = (st, entries = []) => notebookFor(st, "6-8", entries).next;
  assert.deepEqual(
    [n({}).state, n({}).progress.lab.id, n({}).step],
    ["start", "verb-time-machine", 1],
  );
  const mid = {
    "connector-bridge": { "6-8": { seen: [1, 2, 3], explore: { connector: "so" }, guided: 1 } },
  };
  const r = n(mid);
  assert.deepEqual(
    [r.state, r.progress.lab.id, r.step, r.stamp.id],
    ["resume", "connector-bridge", 3, "example"],
  );
  const skipped = {
    "verb-time-machine": { "6-8": { ...fullVerb("6-8"), explore: {}, seen: [1, 3, 4, 5] } },
  };
  assert.equal(n(skipped).step, 2, "a skipped Explore is the next stamp");
  const done = { "verb-time-machine": { "6-8": fullVerb("6-8") } };
  const next = n(done);
  assert.deepEqual(
    [next.state, next.progress.lab.id],
    ["start", "connector-bridge"],
    "a finished lab hands over to the next one",
  );
  assert.ok(
    render("en", "6-8", mid).includes("language-labs/connector-bridge?step=3&amp;grades=6-8"),
  );
  assert.ok(render("en", "6-8", done).includes("Lab complete."), "quiet completion moment");
  assert.ok(!render("en", "6-8", {}).includes("Lab complete."));
});

test("the hub renders progress counts but never learner text, and says a stamp is not a grade", () => {
  const secret = "ZEBRA-SECRET-SENTENCE";
  const st = {
    "verb-time-machine": {
      "6-8": {
        ...fullVerb("6-8"),
        transfer: { text: secret, ok: true, checks: 1, hint: false, topic: 0 },
        practice: { "vt-68-1": { ok: true, answer: secret } },
      },
    },
  };
  for (const mode of MODES) {
    const h = render(mode, "6-8", st, {
      entries: [labsEntry({ m: { ok: 1, lab: "verb-time-machine", transfer: 1, got: secret } })],
    });
    assert.ok(!h.includes(secret), mode);
  }
  const en = render("en", "6-8");
  assert.match(en, /not a grade and does not predict ACCESS/);
  assert.ok(
    !/\bscore\b|streak|timer|leaderboard/i.test(en.replace(/<[^>]+>/g, " ")),
    "no scores, streaks or timers in the copy",
  );
});

test("cover art: six labs, both bands, decorative, token colours, unique gradient ids per use", () => {
  for (const l of C.LABS)
    for (const band of BANDS) {
      const svg = toHtml(labScene(l.id, band, "x"));
      assert.match(svg, /^<svg class="llp-art [^"]+" viewBox="0 0 400 250"/, `${l.id}/${band}`);
      assert.ok(
        svg.includes('aria-hidden="true"') && svg.includes('focusable="false"'),
        `${l.id}: decorative`,
      );
      assert.ok(svg.includes("var(--"), `${l.id}: token colours`);
      assert.ok(!/<script|<image|href="http/i.test(svg), `${l.id}: self-contained`);
      assert.notEqual(
        toHtml(labScene(l.id, band, "x")),
        toHtml(labScene(l.id, band, "y")),
        `${l.id}: uid changes ids`,
      );
      for (const m of svg.matchAll(/url\(#([^)]+)\)/g))
        assert.ok(svg.includes(`id="${m[1]}"`), `${l.id}: ${m[1]} is defined`);
    }
  assert.notEqual(
    toHtml(labScene("verb-time-machine", "3-5")),
    toHtml(labScene("verb-time-machine", "6-8")),
    "bands differ",
  );
});

test("premium stylesheet: scoped to the hub, light only, motion only under no-preference, reduce switches it off", () => {
  const css = ["language-labs-premium.css", "language-labs-premium-sections.css"]
    .map((f) => readFileSync(new URL(f, LAB), "utf8"))
    .join("\n")
    .replace(/\/\*[\s\S]*?\*\//g, "");
  assert.match(css, /@media \(prefers-reduced-motion: no-preference\)/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)[\s\S]*animation: none !important/);
  assert.ok(!/prefers-color-scheme|data-theme/.test(css), "no dark theme");
  const noPref = css.indexOf("@media (prefers-reduced-motion: no-preference)");
  const reduce = css.indexOf("@media (prefers-reduced-motion: reduce)");
  let from = 0;
  for (let i = css.indexOf("@keyframes"); i !== -1; i = css.indexOf("@keyframes", from)) {
    assert.ok(i > noPref && i < reduce, "keyframes live inside the no-preference block");
    from = i + 1;
  }
  // every top-level or @media rule selector begins with the hub root class
  let depth = 0;
  let prelude = "";
  const kf = [];
  const bad = [];
  for (const ch of css) {
    if (ch === "{") {
      const sel = prelude.trim();
      const inKeyframes = kf.length > 0;
      if (sel.startsWith("@keyframes")) kf.push(depth);
      else if (!sel.startsWith("@") && !inKeyframes)
        for (const one of sel.split(/,(?![^(]*\))/))
          if (!/^(\.ll-hub\.llp|\.llp)/.test(one.trim())) bad.push(one.trim());
      depth++;
      prelude = "";
    } else if (ch === "}") {
      depth--;
      if (kf.length && kf.at(-1) === depth) kf.pop();
      prelude = "";
    } else if (ch === ";") prelude = "";
    else prelude += ch;
  }
  assert.deepEqual(bad, [], "unscoped selectors leak outside the hub");
  assert.match(css, /min-height: 3\.25rem|--target|\.btn/, "uses the shared 44px+ controls");
  assert.match(css, /:focus-visible/);
});
