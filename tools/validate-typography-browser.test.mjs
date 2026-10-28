// Negative controls for validate:typography-browser: a 9px sentence and a Georgia sentence must
// each FAIL the gate and be named; a clean Nunito page must pass.
import { check, finish, withFixtures } from "./lib/gate-test-kit.mjs";

const G = "validate-typography-browser.mjs";
await withFixtures(async (run) => {
  const clean = await run(G, ["clean"]);
  check(
    "clean page passes",
    clean.code === 0 && /typography-browser: PASS/.test(clean.out),
    clean.out,
  );
  check("clean page was measured", /text nodes: [1-9]/.test(clean.out), clean.out);

  const tiny = await run(G, ["tiny-font"]);
  check("9px text FAILS", tiny.code === 1, tiny.out);
  check("names the defect (size)", /is 9px \(< 12px\)/.test(tiny.out), tiny.out);

  const wrong = await run(G, ["wrong-font"]);
  check("a non-approved family FAILS", wrong.code === 1, wrong.out);
  check("names the defect (family)", /set in Georgia/.test(wrong.out), wrong.out);
});
finish();
