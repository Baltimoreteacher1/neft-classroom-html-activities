// Negative controls for validate:console-clean: console.error and an uncaught exception must
// each be reported with their text; a quiet page passes.
import { check, finish, withFixtures } from "./lib/gate-test-kit.mjs";

const G = "validate-console-clean.mjs";
await withFixtures(async (run) => {
  const clean = await run(G, ["clean"]);
  check("quiet page passes", clean.code === 0 && /console-clean: PASS/.test(clean.out), clean.out);

  const bad = await run(G, ["console-error"]);
  check("console.error + uncaught throw FAIL", bad.code === 1, bad.out);
  check("names the console.error text", /fixture boom/.test(bad.out), bad.out);
  check("names the uncaught exception", /fixture uncaught/.test(bad.out), bad.out);
});
finish();
