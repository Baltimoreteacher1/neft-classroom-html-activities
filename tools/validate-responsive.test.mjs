// Negative controls for validate:responsive: a 900px box must make a 360px page scroll sideways
// and a 20px button must fail the 44px target rule; the clean page passes at all four widths.
import { check, finish, withFixtures } from "./lib/gate-test-kit.mjs";

const G = "validate-responsive.mjs";
await withFixtures(async (run) => {
  const clean = await run(G, ["clean"]);
  check(
    "clean page passes at 360, 768, 1366, 1440",
    clean.code === 0 && /responsive: PASS/.test(clean.out),
    clean.out,
  );
  check(
    "all four viewports were swept",
    ["360x800", "768x1024", "1366x768", "1440x900"].every((v) => clean.out.includes(`${v}: `)),
    clean.out,
  );

  const wide = await run(G, ["overflow"]);
  check("horizontal overflow FAILS", wide.code === 1, wide.out);
  check(
    "names the defect (sideways scroll at 360)",
    /h-scroll\|360x800/.test(wide.out) || /page scrolls sideways/.test(wide.out),
    wide.out,
  );
  check(
    "is only a defect where the page is narrower than the box",
    !/h-scroll\|1440x900/.test(wide.out),
    wide.out,
  );

  const small = await run(G, ["small-target"]);
  check(
    "a 20px control FAILS the 44px rule",
    small.code === 1 && /target<44/.test(small.out),
    small.out,
  );
  check("names the effective size", /is 60x20px effective/.test(small.out), small.out);

  const one = await run(G, ["overflow"], ["--viewport", "1440x900"]);
  check("--viewport narrows the sweep (overflow is invisible at 1440)", one.code === 0, one.out);
});
finish();
