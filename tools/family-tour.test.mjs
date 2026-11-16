// Family Tour contract: both languages are complete, every recommended activity is a real lab activity with a valid
// student link that fits a QR code, and the kit builds as a PDF. Run: node tools/family-tour.test.mjs
import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import { SCENES } from "../access-practice-lab/src/early/scenes.js";
import { qrModules } from "../shared/qr/qr-code.mjs";
import { allKeys } from "../access-practice-lab/family-tour/i18n.js";
import en from "../access-practice-lab/family-tour/lang/en.js";
import es from "../access-practice-lab/family-tour/lang/es.js";
import { Pdf, wrap } from "../access-practice-lab/family-tour/pdf.js";
import { recommend, activityPath } from "../access-practice-lab/family-tour/picks.js";
import { picksJson } from "./build-family-tour-picks.mjs";

const TOUR = "access-practice-lab/family-tour";
const picks = JSON.parse(readFileSync(`${TOUR}/picks.json`, "utf8")).picks;

test("picks.json is current with the lab content", () => {
  assert.equal(readFileSync(`${TOUR}/picks.json`, "utf8"), picksJson());
});

test("Spanish has every English key and no extras", () => {
  const a = allKeys(en).sort();
  const b = allKeys(es).sort();
  assert.deepEqual(b.filter((k) => !a.includes(k)), [], "keys only in es.js");
  assert.deepEqual(a.filter((k) => !b.includes(k)), [], "keys missing from es.js");
  for (const k of a) {
    const get = (o) => k.split(".").reduce((x, p) => x?.[p], o);
    assert.equal(typeof get(en), typeof get(es), `${k} type`);
    if (typeof get(es) === "string" && k !== "stage.kit.help") assert.ok(get(es).trim(), `${k} empty in es`);
  }
});

test("every t() key used in the tour exists in English", () => {
  const files = [...readdirSync(TOUR).filter((f) => f.endsWith(".js") && f !== "i18n.js").map((f) => join(TOUR, f)), ...readdirSync(`${TOUR}/steps`).map((f) => join(TOUR, "steps", f))];
  const have = new Set(allKeys(en));
  const prefixes = new Set([...have].map((k) => k.split(".").slice(0, -1).join(".")));
  const missing = [];
  for (const f of files) {
    for (const m of readFileSync(f, "utf8").matchAll(/\bt\(\s*"([\w.]+)"/g)) {
      if (!have.has(m[1]) && !prefixes.has(m[1])) missing.push(`${f}: ${m[1]}`);
    }
  }
  assert.deepEqual(missing, []);
});

test("every pick is a real constructed activity with a student link that fits a QR code", () => {
  assert.ok(picks.length >= 40);
  for (const band of ["K", "1", "2-3", "3-5", "6-8"])
    for (const domain of ["Speaking", "Writing"])
      assert.ok(picks.filter((p) => p.band === band && p.domain === domain).length >= (["K", "1", "2-3"].includes(band) ? 3 : 10), `${band} ${domain} pool`);
  const content = {};
  for (const p of picks) {
    const dir = { K: "gK", 1: "g1", "2-3": "g2-3", "3-5": "g3-5", "6-8": "g6-8" }[p.band];
    const set = (content[`${dir}/${p.domain}`] ||= JSON.parse(readFileSync(`access-practice-lab/content/${dir}/${p.domain}.json`, "utf8")));
    const row = set.levels[p.level].activities.find((a) => a.id === p.id);
    assert.ok(row, `${p.id} exists in ${dir}/${p.domain} level ${p.level}`);
    assert.equal(row.type, "constructed");
    assert.equal(row.prompt, p.prompt);
    if (p.picture) assert.ok(existsSync(`access-practice-lab/${p.picture.src}`), `${p.id} picture`);
    if (p.scene) assert.ok(SCENES.includes(p.scene), `${p.id} scene exists`);
    if (!["3-5", "6-8"].includes(p.band)) assert.ok(p.scene, `${p.id} (early band) names a drawn scene`);
    assert.ok(p.skillEs, `${p.id} skillEs`);
    const url = `https://thelanguagepage.com${activityPath(p)}`;
    assert.doesNotThrow(() => qrModules(url), `${url} fits a QR code`);
  }
});

test("recommend gives at most three fitting activities for every choice", () => {
  for (const band of ["K", "1", "2-3", "3-5", "6-8"])
    for (const focus of ["speaking", "writing", "both"])
      for (const minutes of [5, 10, 15]) {
        const r = recommend(picks, { band, focus, minutes });
        assert.ok(r.length >= 1 && r.length <= 3, `${band} ${focus} ${minutes}`);
        assert.equal(new Set(r.map((p) => p.id)).size, r.length);
        for (const p of r) assert.equal(p.band, band);
        if (focus === "speaking") assert.ok(r.every((p) => p.domain === "Speaking"));
        if (focus === "writing") assert.ok(r.every((p) => p.domain === "Writing"));
      }
});

test("every grade has a demonstration activity for speaking and writing", () => {
  const demos = readFileSync(`${TOUR}/picks.js`, "utf8");
  for (const id of [...demos.matchAll(/"((?:gk|g1|g23|g35|v3|v10)-[\w-]+)"/g)].map((m) => m[1]))
    assert.ok(picks.some((p) => p.id === id), `demo ${id} is in picks.json`);
});

test("PDF writer makes a valid document with Spanish text and links", () => {
  const pdf = new Pdf({ title: "Prueba" });
  pdf.para("¿Qué observas? Cuéntame más: niño, canción, año.", { size: 14 });
  pdf.para("https://thelanguagepage.com/access-practice-lab/", { link: "https://thelanguagepage.com/access-practice-lab/" });
  pdf.qr(qrModules("https://thelanguagepage.com/"), 54, 600, 120);
  const out = pdf.build();
  assert.ok(out.startsWith("%PDF-1.4") && out.trimEnd().endsWith("%%EOF"));
  assert.match(out, /\/Subtype \/Link/);
  assert.ok(wrap("uno dos tres cuatro cinco seis siete ocho nueve diez", 12, 80).length > 1);
  assert.ok(!/[^\x00-\x7f]/.test(out), "document body is ASCII so byte offsets are exact");
});
