/**
 * The dependency-audit gate decides whether somebody's accepted security risk
 * still holds. Until 2026-10-03 none of those decisions was testable: the only
 * way to reach the code was to run `npm audit` against the live registry, so
 * the suite could not say what the gate would do with a given report — and a
 * defect sat in it for weeks because of that.
 *
 * THE DEFECT THIS PINS. The gate keyed `accepted` on `via.source`, the integer
 * npm prints beside an advisory. That integer is registry bookkeeping and npm
 * renumbers it. Both image-size acceptances were written down as
 * 1138808/1138809; npm began reporting the same two advisories as
 * 1239765/1239766. Nothing about the packages, the exposure, or Joel's reasoning
 * changed — but the entries stopped matching, so the gate BLOCKED two
 * advisories that had a reviewed, in-date acceptance while simultaneously
 * reporting those same entries as dead weight to be deleted. Both halves of
 * that are actively harmful: the block is a false alarm on a settled decision,
 * and acting on the deletion advice would have destroyed the written reasoning
 * for a risk somebody had actually thought about.
 *
 * Every case below is driven through the real `classify()` with a synthetic
 * report whose answer is known by construction. The renumbering case is
 * mutation-proven: it fails if the lookup ever goes back to the numeric id.
 */
import assert from "node:assert/strict";
import test from "node:test";
import { classify, ghsaOf } from "./audit-allowlist.mjs";

const TODAY = "2026-10-03";
const FUTURE = "2026-11-09";
const PAST = "2026-09-01";

/* The two image-size advisories exactly as npm reports them TODAY — note the
   source integers, which are not the ones the allowlist was written with. */
const ICNS = {
  source: 1239766,
  title: "image-size: ICNS parser allows denial of service through an infinite loop",
  url: "https://github.com/advisories/GHSA-w3rx-r6r6-pgpr",
};
const JXL = {
  source: 1239765,
  title: "image-size: JXL and HEIF parsers allow denial of service through infinite loops",
  url: "https://github.com/advisories/GHSA-5p2g-fcmc-qvqq",
};

/* A fix that is only a semver-major DOWNGRADE of the parent is not a fix; the
   gate has always said so, and the image-size entries depend on it. */
const DOWNGRADE_ONLY = { name: "pptxgenjs", version: "4.0.0", isSemVerMajor: true };

function imageSizeReport(fixAvailable = DOWNGRADE_ONLY) {
  return { "image-size": { severity: "high", fixAvailable, via: [JXL, ICNS] } };
}

function entry(advisory, reviewBy = FUTURE) {
  return { advisory, package: "image-size", reviewBy, reason: ["because"] };
}

function run(entries, vulns, today = TODAY) {
  const accepted = new Map(entries.map((e) => [String(e.advisory ?? "").toUpperCase(), e]));
  return classify({ vulns, accepted, entries, today });
}

test("ghsaOf reads the GHSA out of the advisory url, case-normalised", () => {
  assert.equal(ghsaOf(ICNS), "GHSA-W3RX-R6R6-PGPR");
  assert.equal(
    ghsaOf({ url: "https://github.com/advisories/ghsa-5p2g-fcmc-qvqq" }),
    "GHSA-5P2G-FCMC-QVQQ",
  );
  assert.equal(ghsaOf({ url: "https://example.com/nothing-here" }), null);
  assert.equal(ghsaOf({}), null);
  assert.equal(ghsaOf(undefined), null);
});

test("THE DEFECT: an acceptance survives npm renumbering the advisory", () => {
  // Entries carry the GHSA. The report carries today's integers, which differ
  // from the ones anybody could have written down. The decision must hold.
  const { blocking, honoured, stale } = run(
    [entry("GHSA-w3rx-r6r6-pgpr"), entry("GHSA-5p2g-fcmc-qvqq")],
    imageSizeReport(),
  );
  assert.deepEqual(blocking, [], "a renumbered advisory must not block — this is the shipped bug");
  assert.deepEqual(stale, [], "nor may the live entries be reported as dead weight");
  assert.equal(honoured.length, 2);
  assert.deepEqual(
    honoured.map((h) => h.id).sort(),
    ["GHSA-5P2G-FCMC-QVQQ", "GHSA-W3RX-R6R6-PGPR"],
    "and the verdict must name the stable id, not the integer",
  );
});

test("mutation: keying on the numeric id reproduces the defect", () => {
  // Proof the case above is load-bearing. An allowlist written with npm's
  // integers — which is what the gate used to match on — fails both ways.
  const byNumber = [
    { advisory: 1138808, package: "image-size", reviewBy: FUTURE },
    { advisory: 1138809, package: "image-size", reviewBy: FUTURE },
  ];
  const { blocking, stale } = run(byNumber, imageSizeReport());
  assert.equal(blocking.length, 2, "numeric keys fail to match the advisories");
  assert.equal(stale.length, 2, "and the unmatched entries get reported for deletion");
  for (const s of stale) assert.match(s.why, /GHSA/, "the message must say what the key should be");
});

test("an unaccepted advisory still blocks, named by its GHSA", () => {
  const { blocking, honoured } = run([], imageSizeReport());
  assert.equal(blocking.length, 2);
  assert.deepEqual(honoured, []);
  assert.deepEqual(blocking.map((b) => b.id).sort(), [
    "GHSA-5P2G-FCMC-QVQQ",
    "GHSA-W3RX-R6R6-PGPR",
  ]);
});

test("a real fix retires the acceptance", () => {
  const { stale, honoured } = run([entry("GHSA-w3rx-r6r6-pgpr"), entry("GHSA-5p2g-fcmc-qvqq")], {
    "image-size": { severity: "high", fixAvailable: true, via: [ICNS] },
  });
  assert.deepEqual(honoured, []);
  assert.match(stale[0].why, /a fix is now available/);
  assert.equal(stale[0].id, "GHSA-W3RX-R6R6-PGPR");
});

test("a semver-major downgrade is not a real fix", () => {
  const { honoured, stale } = run([entry("GHSA-w3rx-r6r6-pgpr")], {
    "image-size": { severity: "high", fixAvailable: DOWNGRADE_ONLY, via: [ICNS] },
  });
  assert.equal(honoured.length, 1, "a three-major downgrade must not retire the decision");
  assert.deepEqual(stale, []);
});

test("an expired or malformed reviewBy fails rather than lapsing quietly", () => {
  const expired = run([entry("GHSA-w3rx-r6r6-pgpr", PAST)], {
    "image-size": { severity: "high", fixAvailable: DOWNGRADE_ONLY, via: [ICNS] },
  });
  assert.match(expired.stale[0].why, /reviewBy 2026-09-01 has passed/);

  // Built literally, not through entry(): passing undefined to a defaulted
  // parameter would quietly restore the good date and test nothing.
  for (const bad of [undefined, "", "soon", "9999-99-99"]) {
    const broken = { advisory: "GHSA-w3rx-r6r6-pgpr", package: "image-size", reviewBy: bad };
    const { stale, honoured } = run([broken], {
      "image-size": { severity: "high", fixAvailable: DOWNGRADE_ONLY, via: [ICNS] },
    });
    assert.deepEqual(honoured, [], `reviewBy ${JSON.stringify(bad)} must not be honoured`);
    assert.match(stale[0].why, /must be a real YYYY-MM-DD date/);
  }
});

test("an entry with no GHSA is refused, not silently inert", () => {
  const { stale } = run([{ package: "image-size", reviewBy: FUTURE }], {});
  assert.equal(stale.length, 1);
  assert.match(stale[0].why, /must be a GHSA id/);
});

test("an advisory with no GHSA in its url blocks instead of being acceptable", () => {
  const { blocking } = run([entry("GHSA-w3rx-r6r6-pgpr")], {
    mystery: {
      severity: "critical",
      fixAvailable: false,
      via: [{ source: 999, title: "no advisory url", url: "https://example.com/x" }],
    },
  });
  assert.equal(
    blocking.length,
    1,
    "there is no stable id to accept it by, so it cannot be accepted",
  );
});

test("an entry nobody reports any more is reported for removal", () => {
  const { stale } = run([entry("GHSA-w3rx-r6r6-pgpr")], {});
  assert.equal(stale.length, 1);
  assert.match(stale[0].why, /no longer reported by npm audit/);
});

test("severities below high are not this gate's business", () => {
  const { blocking, honoured, stale } = run([], {
    nanoid: {
      severity: "moderate",
      fixAvailable: true,
      via: [{ source: 1, url: "https://github.com/advisories/GHSA-aaaa-bbbb-cccc" }],
    },
  });
  assert.deepEqual([blocking, honoured, stale], [[], [], []]);
});

test("the committed allowlist is keyed the durable way", async () => {
  const { readFileSync } = await import("node:fs");
  const { fileURLToPath } = await import("node:url");
  const path = fileURLToPath(new URL("./audit-allowlist.json", import.meta.url));
  const { accepted } = JSON.parse(readFileSync(path, "utf8"));
  assert.ok(accepted.length > 0, "nothing to check means this test has stopped checking");
  for (const a of accepted) {
    assert.match(
      String(a.advisory),
      /^GHSA(-[0-9a-z]{4,})+$/i,
      `${a.package}: advisory must be a GHSA id, never npm's renumbered integer`,
    );
    assert.ok(!("id" in a), `${a.package}: drop the numeric id — it drifts and misleads`);
  }
});
