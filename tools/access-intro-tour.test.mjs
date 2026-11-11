/**
 * Guided Tour plan step and auto-tick, without a browser:
 *   - every tour activity's student-link QR that fits (shared/qr/qr-code.mjs, as the plan card draws it) fits and a scanner
 *     (macOS CoreImage, tools/lib/access-intro-qr-read.mjs) reads it back to exactly that link;
 *   - the plan text, the mailto: (no address, subject + body) and the Launch Studio hand-off;
 *   - auto-tick triggers: every quoted control name is parsed, explicit triggers point at real steps, and no control
 *     name ticks two steps of one activity.
 * The in-browser half (ticks from real clicks, Show to the class, Print, Assign) is tools/access-intro-e2e.mjs and
 * tools/access-intro-tour-a11y.mjs.
 *   node --test tools/access-intro-tour.test.mjs
 */
import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { Resvg } from "@resvg/resvg-js";
import { absUrl } from "../access-practice-lab/src/intro/data.js";
import {
  normLabel,
  STEP_TRIGGERS,
  stepLabels,
  stepTriggers,
} from "../access-practice-lab/src/intro/tour-autotick.js";
import {
  BAND_TOUR,
  DOMAINS,
  tourActivity,
  tourRoute,
} from "../access-practice-lab/src/intro/tour-bands.js";
import {
  inLaunchStudio,
  planForText,
  planMailto,
  planText,
  qrFits,
} from "../access-practice-lab/src/intro/tour-plan.js";
import { MAX_BYTES, qrSvg } from "../shared/qr/qr-code.mjs";
import { readQrCodes } from "./lib/access-intro-qr-read.mjs";

const ALL = Object.keys(BAND_TOUR).flatMap((pick) =>
  DOMAINS.map((d) => tourActivity(pick, d.id)).filter(Boolean),
);

test("there is one activity per domain for each of the five grade choices", () => {
  assert.equal(ALL.length, 20);
});

// The encoder stops at 106 bytes (QR version 5). The two Language Upgrade Lab links are longer; the plan card shows
// their link without a code. Any other link that stops fitting fails here.
const LONG = ["4-5:writing", "6-8:writing"];
const WITH_QR = ALL.filter((a) => qrFits(absUrl(tourRoute(a))));

test("every student link but the two Language Upgrade Lab links fits a QR code", () => {
  assert.equal(MAX_BYTES, 106);
  assert.deepEqual(
    ALL.filter((a) => !qrFits(absUrl(tourRoute(a)))).map((a) => `${a.pick}:${a.domain.id}`),
    LONG,
  );
});

test("a scanner reads each plan QR code back to its student link", {
  skip: process.platform !== "darwin" && !process.env.CI && "CoreImage decoder needs macOS",
}, () => {
  const dir = mkdtempSync(join(tmpdir(), "tour-qr-"));
  const files = WITH_QR.map((a, i) => {
    const file = join(dir, `qr-${i}.png`);
    const svg = qrSvg(absUrl(tourRoute(a)), { px: 144, label: a.title });
    writeFileSync(file, new Resvg(svg, { fitTo: { mode: "width", value: 600 } }).render().asPng());
    return file;
  });
  const read = readQrCodes(files);
  assert.ok(read, "no decoder available");
  assert.equal(files.length, 18);
  WITH_QR.forEach((a, i) => assert.deepEqual(read[files[i]], [absUrl(tourRoute(a))], a.title));
});

test("plan text, email and the class line come from the saved notes", () => {
  const notes = { pick: "listening", group: "Room 12", when: "Tuesday" };
  const text = planText("2-3", notes);
  assert.match(text, /Who Waters the Garden\?/);
  assert.match(
    text,
    /Student link: https:\/\/thelanguagepage\.com\/access-practice-lab\/Listening\//,
  );
  assert.match(text, /Class or group: Room 12\nWhen: Tuesday$/);
  const mail = planMailto("2-3", notes);
  assert.ok(mail.startsWith("mailto:?subject="), "no address is prefilled");
  const q = new URLSearchParams(mail.slice("mailto:?".length));
  assert.equal(q.get("subject"), "My plan from The Language Page tour");
  assert.equal(q.get("body"), text);
  assert.equal(planForText(notes), "Class or group: Room 12 · When: Tuesday");
  assert.equal(planForText({}), "");
});

test("the Launch Studio hand-off is offered only for activities it lists", () => {
  const listed = ALL.filter(inLaunchStudio).map((a) => `${a.pick}:${a.domain.id}`);
  assert.ok(listed.includes("2-3:listening"));
  assert.ok(
    !listed.includes("6-8:speaking"),
    "the speaking ladder is not a Launch Studio activity",
  );
  assert.ok(
    !listed.includes("4-5:writing"),
    "Language Upgrade Lab is not a Launch Studio activity",
  );
});

test("quoted control names are parsed and normalised", () => {
  assert.deepEqual(stepLabels("Press “Check.”"), [{ exact: "check" }]);
  assert.deepEqual(stepLabels("Press “Listen.” Try “Slower,” then “Hear question.”"), [
    { exact: "listen" },
    { exact: "slower" },
    { exact: "hear question" },
  ]);
  assert.deepEqual(stepLabels("Press “Hear: sun” beside a choice"), [{ prefix: "hear: " }]);
  assert.equal(normLabel("🐈cat"), "cat");
  assert.equal(normLabel(" Hear Mateo, age 6 answer first "), "hear mateo, age 6 answer first");
});

test("explicit triggers name real activities and steps", () => {
  for (const [key, steps] of Object.entries(STEP_TRIGGERS)) {
    const [pick, domain] = key.split(":");
    const a = tourActivity(pick, domain);
    assert.ok(a, key);
    for (const i of Object.keys(steps)) assert.ok(a.steps[i], `${key} step ${i}`);
  }
});

test("no control name ticks two steps of one activity, and most steps can tick themselves", () => {
  let auto = 0;
  for (const a of ALL) {
    const t = stepTriggers(a);
    const seen = new Map();
    t.forEach((s, i) => {
      if (s.labels.length || s.click || s.typing) auto++;
      for (const l of s.labels) {
        const k = l.exact || l.prefix;
        assert.ok(
          !seen.has(k),
          `${a.pick} ${a.domain.id}: “${k}” in steps ${seen.get(k)} and ${i}`,
        );
        seen.set(k, i);
      }
    });
  }
  assert.ok(auto >= 54, `${auto} of 60 steps tick themselves`);
});
