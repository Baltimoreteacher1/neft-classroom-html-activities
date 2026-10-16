// Every Unit 4 and Unit 6 family homework page carries a "Then vs. now" bridge card.
//   node tools/validate-family-bridge.mjs [lessonId ...]   (no ids = every required sidecar)
import { checkBridges, requiredIds } from "./lib/family-bridge-check.mjs";

const want = process.argv.slice(2);
const ids = want.length ? want : null;
const problems = checkBridges(ids);
if (problems.length) {
  for (const m of problems) console.error(m);
  console.error(`\n${problems.length} bridge problem(s).`);
  process.exit(1);
}
console.log(
  `family bridge: ${(ids ?? requiredIds()).length} page(s) carry a sound Then-vs-now card.`,
);
