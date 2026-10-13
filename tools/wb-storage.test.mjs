import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const ctx = {};
ctx.window = ctx;
vm.createContext(ctx);
vm.runInContext(readFileSync("curriculum/math-workbench/wb-storage.js", "utf8"), ctx);
const { create, memoryBackend, LEGACY_KEY, MAX_VERSIONS } = ctx.WBStore;

function fakeLs(initial = {}, opts = {}) {
  const m = new Map(Object.entries(initial));
  return {
    m,
    getItem: (k) => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => {
      if (opts.full) throw new Error("QuotaExceededError");
      m.set(k, v);
    },
  };
}
const board = (n, bg = "blank") => ({
  strokes: [],
  objects: [{ id: `o${n}`, type: "text", x: n, y: 0, text: `p${n}` }],
  bg,
  pages: 3,
  scroll: 0,
});

// --- legacy notebook migrates into IndexedDB and the legacy copy is untouched
{
  const legacy = JSON.stringify({ v: 2, active: 1, boards: [board(1), board(2)] });
  const ls = fakeLs({ [LEGACY_KEY]: legacy });
  const be = memoryBackend();
  const st = create({ backend: be, ls });
  const raw = await st.loadLatest();
  assert.equal(JSON.parse(raw).boards.length, 2, "an existing saved notebook is restored");
  assert.equal(
    ls.getItem(LEGACY_KEY) === legacy || JSON.parse(ls.getItem(LEGACY_KEY)).boards.length === 2,
    true,
    "legacy data still present after migration",
  );
  const again = create({ backend: be, ls: fakeLs({}) });
  const raw2 = await again.loadLatest();
  assert.equal(
    JSON.parse(raw2).boards[1].objects[0].text,
    "p2",
    "the migrated copy loads from IndexedDB alone",
  );
  assert.equal(JSON.parse(raw2).active, 1);
}

// --- only changed pages are rewritten; removed pages are pruned
{
  const be = memoryBackend();
  const st = create({ backend: be, ls: null });
  const nb = { active: 0, boards: [board(1), board(2), board(3)] };
  assert.equal((await st.save(nb)).ok, true);
  be.writes.length = 0;
  nb.boards[1].objects[0].x = 99;
  await st.save(nb);
  const pageWrites = be.writes.filter((w) => w.startsWith("pages:"));
  assert.equal(pageWrites.length, 1, "one edited page means one page record written");
  nb.boards.splice(0, 1);
  await st.save(nb);
  assert.equal((await be.keys("pages")).length, 2, "a deleted page's record is removed");
  const back = JSON.parse(await create({ backend: be, ls: null }).loadLatest());
  assert.equal(back.boards[0].objects[0].x, 99);
}

// --- rolling versions keep only the newest few
{
  let t = 1000;
  const be = memoryBackend();
  const st = create({ backend: be, ls: null, now: () => t });
  const nb = { active: 0, boards: [board(1)] };
  for (let i = 0; i < MAX_VERSIONS + 4; i++) {
    nb.boards[0].objects[0].x = i;
    t += 130000;
    await st.save(nb);
  }
  const versions = await st.listVersions();
  assert.equal(versions.length, MAX_VERSIONS, "autosave versions are capped");
  assert.ok(versions[0].at > versions[versions.length - 1].at, "newest version first");
  const full = await st.getVersion(versions[0].id);
  assert.equal(JSON.parse(full.data).boards[0].objects[0].x, MAX_VERSIONS + 3);
}

// --- named saves
{
  const be = memoryBackend();
  const st = create({ backend: be, ls: null });
  const json = JSON.stringify({ v: 2, active: 0, boards: [board(1), board(2)] });
  const id = await st.createSave("Ratio practice", json, "");
  await st.renameSave(id, "Ratio tables");
  const list = await st.listSaves();
  assert.equal(list[0].name, "Ratio tables");
  assert.equal(list[0].pages, 2);
  assert.equal((await st.getSave(id)).data, json);
  await st.deleteSave(id);
  assert.equal((await st.listSaves()).length, 0);
}

// --- IndexedDB failure falls back to localStorage; both failing is reported
{
  const bad = {
    get: async () => {
      throw new Error("x");
    },
    put: async () => {
      throw new Error("x");
    },
    del: async () => {},
    keys: async () => [],
    all: async () => [],
  };
  const ls = fakeLs();
  const st = create({ backend: bad, ls });
  const r = await st.save({ active: 0, boards: [board(1)] });
  assert.deepEqual([r.ok, r.via], [true, "ls"], "falls back to localStorage");
  assert.equal(JSON.parse(await create({ backend: bad, ls }).loadLatest()).boards.length, 1);
  const full = create({ backend: bad, ls: fakeLs({}, { full: true }) });
  assert.equal(
    (await full.save({ active: 0, boards: [board(1)] })).ok,
    false,
    "total failure is reported, not swallowed",
  );
}

// --- a newer localStorage copy (written at pagehide) beats a stale IndexedDB copy
{
  let t = 5000;
  const be = memoryBackend();
  const ls = fakeLs();
  const st = create({ backend: be, ls, now: () => t });
  await st.save({ active: 0, boards: [board(1)] });
  t = 9000;
  const nb = { active: 0, boards: [board(1)] };
  nb.boards[0].objects[0].text = "newest";
  assert.equal(st.saveSync(nb), true);
  const raw = await create({ backend: be, ls, now: () => t }).loadLatest();
  assert.equal(JSON.parse(raw).boards[0].objects[0].text, "newest");
}

// --- copied pages never share a record; startup hold; session archive
{
  const be = memoryBackend();
  const st = create({ backend: be, ls: null });
  const a = board(1);
  a.pid = "same";
  const b = JSON.parse(JSON.stringify(a));
  await st.save({ active: 0, boards: [a, b] });
  assert.notEqual(a.pid, b.pid, "a duplicated page gets its own record id");
  assert.equal((await be.keys("pages")).length, 2);

  const be2 = memoryBackend();
  const st2 = create({ backend: be2, ls: null });
  let release;
  st2.holdUntil(new Promise((r) => (release = r)));
  const pending = st2.save({ active: 0, boards: [board(1)] });
  await new Promise((r) => setTimeout(r, 20));
  assert.equal((await be2.keys("pages")).length, 0, "saves wait for the startup read");
  release();
  await pending;
  assert.equal((await be2.keys("pages")).length, 1);

  const worked = JSON.stringify({ v: 2, active: 0, boards: [board(1)] });
  assert.equal(await st2.archiveSession(worked), true, "a worked-on previous session is archived");
  assert.equal(
    await st2.archiveSession(JSON.stringify({ v: 2, boards: [{ strokes: [], objects: [] }] })),
    false,
    "an empty session is not",
  );
  assert.equal((await st2.listVersions())[0].label, "last session");
}

console.log("wb-storage: all assertions passed");
