// Negative controls for validate:contrast-browser (see tools/lib/gate-test-kit.mjs).
// Skips (exit 3) without a browser; otherwise proves the gate FAILS and names a seeded
// low-contrast sentence, PASSES a clean page, honours/rejects review decisions, and fails an
// empty sweep.
import { join } from "node:path";
import { check, FIXTURES, finish, withFixtures } from "./lib/gate-test-kit.mjs";

const G = "validate-contrast-browser.mjs";
await withFixtures(async (run) => {
  const clean = await run(G, ["clean"]);
  check(
    "clean page passes",
    clean.code === 0 && /contrast-browser: PASS/.test(clean.out),
    clean.out,
  );
  check("clean page was actually judged", /text elements judged: [1-9]/.test(clean.out), clean.out);

  const low = await run(G, ["low-contrast"]);
  check("seeded low-contrast text FAILS", low.code === 1, low.out);
  check(
    "names the defect (ratio, colours, selector)",
    /text\|main>p\.low\|#aaaaaa\|#ffffff/.test(low.out) && /< 4\.5:1/.test(low.out),
    low.out,
  );

  // Positive control for the false-positive classes the first baseline taught us: text nobody can
  // see (a flip card's far face, a closed <details>) is not judged, so the page passes.
  const hidden = await run(G, ["hidden-faces"]);
  check(
    "text on a card's far face / in a closed details is not judged",
    hidden.code === 0 && !/Far face|Pale text/.test(hidden.out),
    hidden.out,
  );

  const empty = await run(G, ["empty"]);
  check(
    "a sweep that judged nothing FAILS",
    empty.code === 1 && /judged ZERO text/.test(empty.out),
    empty.out,
  );

  const reviewed = await run(
    G,
    ["low-contrast"],
    ["--review", join(FIXTURES, "review-low-contrast.json")],
  );
  check(
    "a recorded decision (40+ char reason) turns it into 'reviewed'",
    reviewed.code === 0 && /reviewed \(recorded decisions\): 1/.test(reviewed.out),
    reviewed.out,
  );

  const stale = await run(
    G,
    ["clean"],
    ["--review", join(FIXTURES, "review-stale.json"), "--check-stale"],
  );
  check(
    "a review entry that no longer fires FAILS as stale",
    stale.code === 1 && /stale review entry/.test(stale.out),
    stale.out,
  );

  const short = await run(
    G,
    ["low-contrast"],
    ["--review", join(FIXTURES, "review-short-reason.json")],
  );
  check(
    "a review reason under 40 characters is rejected",
    short.code === 1 && /reason must be 40\+ characters/.test(short.out),
    short.out,
  );
});
finish();
