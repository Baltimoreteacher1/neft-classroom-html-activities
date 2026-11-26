// Project Studio (Create): route registry coverage, the pure build pipeline on real platform content, the packet
// merge, the creation session, the link parser, and the student-side load boundary. See access-practice-lab/CREATE.md.
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const LAB = `${ROOT}access-practice-lab/src`;
const { customizeFrom } = await import(`${LAB}/studio/adapters/registry.js`);
const B = await import(`${LAB}/create/build.js`);
const R = await import(`${LAB}/create/routes.js`);
const SS = await import(`${LAB}/create/session.js`);
const { sourceFromHref } = await import(`${LAB}/create/page.js`);
const { renderWorksheetParts } = await import(`${LAB}/studio/print/worksheet.js`);
const { questionsOf } = await import(`${LAB}/studio/core/schema.js`);

const fetchJson = async (u) =>
  JSON.parse(await readFile(`${ROOT}${u.split("?")[0].replace(/^\//, "")}`, "utf8"));
const memIo = (init = {}) => {
  const m = new Map(Object.entries(init));
  return { get: (k) => (m.has(k) ? m.get(k) : null), set: (k, v) => (m.set(k, v), true), m };
};

/** Every view id parseRoute can return, read from main.js so a new route cannot skip the registry. */
async function routeViews() {
  const s = await readFile(`${LAB}/main.js`, "utf8");
  const body = s.slice(
    s.indexOf("export function parseRoute"),
    s.indexOf("// Pages under the lab"),
  );
  const set = new Set();
  for (const m of body.matchAll(/view: "([a-z0-9-]+)"/g)) set.add(m[1]);
  for (const m of body.matchAll(/\[((?:"[a-z0-9-]+",?\s*)+)\]\.includes\(a\)/g))
    for (const x of m[1].matchAll(/"([a-z0-9-]+)"/g)) set.add(x[1]);
  for (const m of body.matchAll(/a === "([a-z0-9-]+)"\)\s*return \{ \.\.\.r, view: a/g))
    set.add(m[1]);
  for (const m of body.matchAll(
    /a === "([a-z0-9-]+)" \|\| a === "([a-z0-9-]+)"\)\s*return \{ \.\.\.r, view: a/g,
  ))
    set.add(m[1]), set.add(m[2]);
  for (const m of body.matchAll(/\? "([a-z0-9-]+)"/g)) set.add(m[1]);
  for (const m of body.matchAll(/: "([a-z][a-z0-9-]+)",\s*id: b/g)) set.add(m[1]);
  return set;
}

test("every lab route has a Create disposition, and the registry names no dead route", async () => {
  const views = await routeViews();
  assert.ok(views.size > 100, `parsed ${views.size} views: the extractor stopped matching main.js`);
  const missing = [...views].filter((v) => !R.ROUTES[v]);
  assert.deepEqual(missing, [], `routes without a disposition: ${missing.join(", ")}`);
  const dead = Object.keys(R.ROUTES).filter((v) => !views.has(v));
  assert.deepEqual(
    dead,
    [],
    `registry entries for routes main.js no longer has: ${dead.join(", ")}`,
  );
  for (const [v, cap] of Object.entries(R.ROUTES)) {
    assert.ok(["source", "hub", "workspace", "excluded"].includes(cap.disposition), v);
    assert.ok(cap.note && cap.note.length > 8, `${v} needs a reason`);
  }
});

test("capabilityFor resolves the page's own resource, and never offers Create to students or families", () => {
  assert.deepEqual(R.capabilityFor({ view: "reading-room", id: "ecosystems-1" }).source, {
    family: "reading-room",
    ref: "ecosystems-1",
  });
  assert.deepEqual(R.capabilityFor({ view: "assess", id: "b35-listen-01" }).source, {
    family: "access-bank",
    ref: "b35-listen-01",
  });
  assert.deepEqual(
    R.capabilityFor({ view: "vocab-academy", path: ["grade", "6", "lesson", "3"] }).source,
    { family: "vocab-academy", ref: "g6-u03" },
  );
  assert.equal(
    R.capabilityFor({ view: "vocab-academy", path: [] }).disposition,
    "hub",
    "the Academy home is a picker, not a source",
  );
  assert.equal(
    R.capabilityFor({ view: "assess", id: "../x" }).disposition,
    "hub",
    "a malformed id is never used as a ref",
  );
  const bc = R.capabilityFor({ view: "tools" }, "?bcpssUnit=g6-sci-u2&band=3_4");
  assert.deepEqual(bc.source, { family: "bcpss-unit", ref: "g6-sci-u2", band: "3_4" });
  for (const v of [
    "do",
    "play",
    "students",
    "test",
    "family",
    "family-start",
    "practice-together",
    "class",
    "class-quiz",
    "nonexistent",
  ]) {
    const c = R.capabilityFor({ view: v }, "?bcpssUnit=g6-sci-u2");
    assert.equal(R.offersCreate(c), false, `${v} must not offer Create`);
    assert.equal(c.tray, false, `${v} must not show the packet chip`);
  }
  assert.equal(
    R.offersCreate(R.capabilityFor({ view: "activity-studio" })),
    false,
    "no second Create inside the Studio",
  );
});

test("every source family builds every available format with no validation errors and no invented answers", async () => {
  const bank = await fetchJson("/access-practice-lab/content/bank/index.json");
  const bankIds = (bank.sets || bank).map((s) => s.id).slice(0, 6);
  const rr = await fetchJson("/access-practice-lab/content/reading-room/lessons.json");
  const rrIds = rr.lessons.slice(0, 4).map((l) => l.id);
  const sources = [
    ...bankIds.map((ref) => ["access-bank", ref]),
    ...rrIds.map((ref) => ["reading-room", ref]),
    ...["gK-u01", "g3-u02", "g6-u01", "g8-u05"].map((ref) => ["vocab-academy", ref]),
  ];
  let built = 0;
  for (const [family, ref] of sources) {
    const { activity } = await customizeFrom(family, ref, { fetchJson });
    const formats = B.availableFormats(activity);
    assert.ok(formats.length >= 3, `${family}/${ref}: only ${formats.length} formats`);
    for (const f of formats) {
      const r = B.buildResource(activity, { format: f.id });
      assert.equal(r.format, f.id, `${family}/${ref} ${f.id}: format fell back`);
      assert.deepEqual(
        r.validation.errors,
        [],
        `${family}/${ref} ${f.id}: ${JSON.stringify(r.validation.errors)}`,
      );
      built++;
    }
    // language support never changes a question or its answer
    const base = B.buildResource(activity, { format: "worksheet" }).activity;
    const more = B.buildResource(activity, {
      format: "worksheet",
      adjust: { support: "more" },
    }).activity;
    const key = (a) =>
      questionsOf(a).map((q) =>
        JSON.stringify([
          q.id,
          q.format,
          q.answer ?? q.answers ?? q.correct ?? q.pairs ?? q.order ?? null,
        ]),
      );
    assert.deepEqual(key(more), key(base), `${family}/${ref}: support changed a question`);
  }
  assert.ok(built > 60, `only ${built} builds`);
});

test("a format the content cannot support falls back and says so", async () => {
  const { activity } = await customizeFrom("access-bank", "b35-listen-01", { fetchJson });
  const can = B.availableFormats(activity).map((f) => f.id);
  assert.ok(!can.includes("vocab"), "fixture assumption: a listening set has no word list");
  const r = B.buildResource(activity, { format: "vocab" });
  assert.notEqual(r.format, "vocab");
  assert.ok(r.warnings.some((w) => /cannot be made/.test(w.en)));
});

test("outputs offered match what really exists for the kind", async () => {
  const { activity } = await customizeFrom("vocab-academy", "g6-u01", { fetchJson });
  const ws = B.buildResource(activity, { format: "worksheet" }).activity;
  const ia = B.buildResource(activity, { format: "interactive" }).activity;
  assert.deepEqual(B.outputsFor(ws), {
    open: true,
    html: true,
    print: true,
    docx: true,
    key: true,
  });
  assert.equal(B.outputsFor(ia).print, false);
  assert.equal(B.outputsFor(ia).docx, false);
});

test("the student printed page carries no answers; the key does", async () => {
  const { activity } = await customizeFrom("vocab-academy", "g6-u01", { fetchJson });
  const ws = B.buildResource(activity, { format: "worksheet" }).activity;
  const student = renderWorksheetParts(ws, { part: "student" }).html;
  const key = renderWorksheetParts(ws, { part: "key" }).html;
  assert.doesNotMatch(student, /Answer key|Teacher copy/i);
  assert.match(key, /Answer key/i);
});

test("packet: one model, a heading per part, repeated blocks once, block limit respected", async () => {
  const a = (await customizeFrom("vocab-academy", "g6-u01", { fetchJson })).activity;
  const b = (
    await customizeFrom(
      "reading-room",
      (
        await fetchJson("/access-practice-lab/content/reading-room/lessons.json")
      ).lessons[0].id,
      { fetchJson },
    )
  ).activity;
  const p = B.packetActivity(
    [
      { title: "Words", activity: a },
      { title: "Reading", activity: b },
      { title: "Words again", activity: a },
    ],
    { title: "Unit packet" },
  );
  assert.equal(p.activity.kind, "worksheet");
  assert.equal(p.activity.title, "Unit packet");
  const heads = p.activity.blocks
    .filter((x) => x.type === "text" && x.role === "heading")
    .map((x) => x.text);
  assert.deepEqual(heads.slice(0, 2), ["Part 1: Words", "Part 2: Reading"]);
  assert.ok(p.duplicateBlocks > 0, "the second copy of the word list is not repeated");
  assert.ok(p.activity.blocks.length <= 80);
  assert.equal(
    new Set(p.activity.blocks.map((x) => x.id)).size,
    p.activity.blocks.length,
    "block ids are unique",
  );
  const big = B.packetActivity(
    Array.from({ length: 8 }, (_, i) => ({ title: `P${i}`, activity: b })),
  );
  assert.ok(big.activity.blocks.length <= 80);
  assert.ok(big.skippedBlocks > 0 || big.included === 8);
  const qa = questionsOf(a).length;
  assert.equal(
    questionsOf(p.activity).length,
    qa * 2 + questionsOf(b).length,
    "every question keeps its place (questions are never deduplicated)",
  );
});

test("session: add, reorder, remove, caps, and recovery from bad data", async () => {
  const io = memIo();
  const { activity } = await customizeFrom("vocab-academy", "g6-u01", { fetchJson });
  const r1 = SS.addItem(io, {
    title: "One",
    source: { family: "vocab-academy", ref: "g6-u01" },
    format: "worksheet",
    activity,
  });
  const r2 = SS.addItem(io, {
    title: "Two",
    source: { family: "vocab-academy", ref: "g6-u01" },
    format: "game",
    activity,
  });
  assert.ok(r1.ok && r2.ok);
  assert.deepEqual(
    SS.readSession(io).items.map((i) => i.title),
    ["One", "Two"],
  );
  SS.moveItem(io, r2.item.id, -1);
  assert.deepEqual(
    SS.readSession(io).items.map((i) => i.title),
    ["Two", "One"],
  );
  assert.equal(SS.moveItem(io, r2.item.id, -1).ok, false, "cannot move above the first");
  SS.removeItem(io, r2.item.id);
  assert.deepEqual(
    SS.readSession(io).items.map((i) => i.title),
    ["One"],
  );
  for (let i = 0; i < 20; i++) SS.addItem(io, { title: `x${i}`, activity });
  assert.equal(SS.readSession(io).items.length, SS.MAX_ITEMS);
  assert.equal(SS.addItem(io, { title: "over", activity }).reason, "full");
  SS.rememberChoice(io, {
    source: { family: "reading-room", ref: "abc" },
    format: "worksheet",
    adjust: { support: "more", amount: "bogus" },
  });
  const last = SS.lastChoiceFor(io, { family: "reading-room", ref: "abc" });
  assert.deepEqual(last.adjust, { support: "more", amount: "standard", challenge: "standard" });
  assert.equal(SS.lastChoiceFor(io, { family: "reading-room", ref: "other" }), null);
  for (const bad of [
    "{",
    "null",
    JSON.stringify({ schema: "lp-create-session/0", items: [{}] }),
    JSON.stringify({ schema: SS.SESSION_SCHEMA, items: [{ id: "<script>", activity: {} }] }),
  ]) {
    const s = SS.readSession(memIo({ [SS.SESSION_KEY]: bad }));
    assert.deepEqual(s.items, []);
  }
  const refusing = { get: () => null, set: () => false };
  assert.equal(SS.addItem(refusing, { title: "x", activity }).reason, "storage");
});

test("Customize links: only the Studio chooser with a well-formed family and ref become a Create source", () => {
  assert.deepEqual(
    sourceFromHref(
      "/access-practice-lab/activity-studio/customize?family=bcpss-unit&ref=g6-sci-u2&band=3_4",
    ),
    { family: "bcpss-unit", ref: "g6-sci-u2", band: "3_4" },
  );
  assert.deepEqual(
    sourceFromHref(
      "/access-practice-lab/activity-studio/customize?family=access-bank&ref=b35-listen-01&band=9",
    ),
    { family: "access-bank", ref: "b35-listen-01" },
  );
  for (const bad of [
    "/access-practice-lab/activity-studio/customize",
    "/access-practice-lab/activity-studio/customize?family=access-bank&ref=../../x",
    "/access-practice-lab/activity-studio/customize?family=<b>&ref=x",
    "//evil.example/access-practice-lab/activity-studio/customize?family=access-bank&ref=a",
    "https://evil.example/access-practice-lab/activity-studio/customize?family=access-bank&ref=a",
    "/access-practice-lab/activity-studio/mine?family=access-bank&ref=a",
    "javascript:alert(1)",
  ])
    assert.equal(sourceFromHref(bad, "https://thelanguagepage.com"), null, bad);
});

test("student devices never load authoring code: main.js imports only the tiny gate", async () => {
  const main = await readFile(`${LAB}/main.js`, "utf8");
  const statics = [...main.matchAll(/^import .* from "(\.\/create\/[^"]+)";/gm)].map((m) => m[1]);
  assert.deepEqual(statics, ["./create/gate.js"]);
  assert.match(main, /if \(!mayTeach\(\)\)/);
  const gate = await readFile(`${LAB}/create/gate.js`, "utf8");
  const deps = [...gate.matchAll(/from "([^"]+)"/g)].map((m) => m[1]).sort();
  assert.deepEqual(deps, ["../audience.js", "../util.js"]);
  const launcher = await readFile(`${LAB}/create/launcher.js`, "utf8");
  assert.match(
    launcher,
    /if \(!nav \|\| !isTeacherMode\(\)\) return;/,
    "the authoritative teacher check runs before anything mounts",
  );
  for (const f of ["panel.js", "packet.js", "launcher.js", "page.js"]) {
    const src = await readFile(`${LAB}/create/${f}`, "utf8");
    assert.doesNotMatch(
      src,
      /\.innerHTML\s*=|insertAdjacentHTML|outerHTML\s*=/,
      `${f} must build DOM without HTML strings`,
    );
    // ui.js#h splits a spec on "." only: "h3#id" creates an element literally named "h3#id" with no id
    assert.doesNotMatch(
      src,
      /\bh\("[a-z0-9]+#/,
      `${f}: pass ids as attributes, not in the h() spec`,
    );
  }
});
