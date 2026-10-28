// Negative controls for validate:axe-lessons: an <img> with no alternative text is a critical
// axe violation (image-alt) and must FAIL the gate by name; a labelled, landmarked page passes.
import { check, finish, withFixtures } from "./lib/gate-test-kit.mjs";

const G = "validate-axe-lessons.mjs";
await withFixtures(async (run) => {
  const clean = await run(G, ["clean"]);
  check(
    "accessible page passes",
    clean.code === 0 && /axe-lessons: PASS/.test(clean.out),
    clean.out,
  );
  check("axe actually ran", /axe runs: [1-9]/.test(clean.out), clean.out);

  const bad = await run(G, ["axe-violation"]);
  check("missing alt text FAILS", bad.code === 1, bad.out);
  check("names the rule (image-alt)", /image-alt/.test(bad.out), bad.out);
  check("reports its impact", /\[critical\]/.test(bad.out), bad.out);
});
finish();
