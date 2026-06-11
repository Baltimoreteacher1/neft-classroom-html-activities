import { existsSync, mkdirSync, readdirSync, rmSync, copyFileSync } from "node:fs";
import { resolve, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = resolve(fileURLToPath(import.meta.url), "..");
const REPO_ROOT = resolve(__dirname, "..");

const BUNDLES = [
  {
    src: "tools/cardforge/staged/unit-4/lesson-1-rates-and-unit-rates-demo",
    dest: "lessons/4-1/bundle",
  },
  {
    src: "tools/cardforge/staged/unit-6/lesson-2-write-and-evaluate-expressions-demo",
    dest: "lessons/6-2/bundle",
  },
  {
    src: "tools/cardforge/staged/unit-10/lesson-3-surface-area-of-rectangular-prisms-demo",
    dest: "lessons/10-3/bundle",
  },
];

function main() {
  for (const b of BUNDLES) {
    const srcPath = resolve(REPO_ROOT, b.src);
    const destPath = resolve(REPO_ROOT, b.dest);

    if (!existsSync(srcPath)) {
      console.warn(`Source folder does not exist: ${srcPath}`);
      continue;
    }

    if (existsSync(destPath)) {
      console.log(`Cleaning old bundle directory: ${b.dest}`);
      rmSync(destPath, { recursive: true, force: true });
    }

    mkdirSync(destPath, { recursive: true });
    console.log(`Copying staged files from ${b.src} to ${b.dest}...`);

    for (const file of readdirSync(srcPath)) {
      copyFileSync(join(srcPath, file), join(destPath, file));
    }
    console.log(`✓ Copied bundle for ${b.dest}`);
  }
}

main();
