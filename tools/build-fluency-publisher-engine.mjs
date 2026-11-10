import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

const source = fileURLToPath(new URL("../src/components/MathFluencyLabEngine.ts", import.meta.url));
const output = fileURLToPath(new URL("../src/components/MathFluencyLabEngine.js", import.meta.url));
const temporary = await mkdtemp(join(tmpdir(), "fluency-engine-"));
let compiled;
try {
  const compiler = fileURLToPath(new URL("../node_modules/.bin/tsc", import.meta.url));
  await promisify(execFile)(compiler, [
    "--ignoreConfig",
    "--strict",
    "true",
    "--target",
    "ES2022",
    "--module",
    "ESNext",
    "--outDir",
    temporary,
    source,
  ]);
  compiled = await readFile(join(temporary, "MathFluencyLabEngine.js"), "utf8");
} finally {
  await rm(temporary, { recursive: true, force: true });
}

if (process.argv.includes("--check")) {
  assert.equal(
    await readFile(output, "utf8"),
    compiled,
    "Browser module is stale; run node tools/build-fluency-publisher-engine.mjs",
  );
  console.log("Fluency publisher engine browser module is current");
} else {
  await writeFile(output, compiled);
  console.log("Built Fluency publisher engine browser module");
}
