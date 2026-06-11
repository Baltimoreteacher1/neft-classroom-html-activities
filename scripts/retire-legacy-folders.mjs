import { readFileSync, writeFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join, extname } from "node:path";
import { execSync } from "node:child_process";

const root = process.cwd();

const RETIREMENT_MAPPING = {
  // unit-1 -> math/unit-1/supplemental
  "unit-1/6-1game": "math/unit-1/supplemental/6-1game",
  "unit-1/grade6unit1": "math/unit-1/supplemental/grade6unit1",

  // unit-4 -> math/unit-1/supplemental
  "unit-4/decimaloperationsreview": "math/unit-1/supplemental/decimaloperationsreview",
  "unit-4/decimals-diner": "math/unit-1/supplemental/decimals-diner",
  "unit-4/longdivisionmcapreview": "math/unit-1/supplemental/longdivisionmcapreview",
  "unit-4/math6unit4interactivestudystudio": "math/unit-1/supplemental/math6unit4interactivestudystudio",

  // unit-5 -> math/unit-5/supplemental
  "unit-5/5-1-5-3practice": "math/unit-5/supplemental/5-1-5-3practice",
  "unit-5/5-5squaretriangle": "math/unit-5/supplemental/5-5squaretriangle",
  "unit-5/5-6session1": "math/unit-5/supplemental/5-6session1",
  "unit-5/5-8interactivehtml": "math/unit-5/supplemental/5-8interactivehtml",
  "unit-5/grade6area5-1-2": "math/unit-5/supplemental/grade6area5-1-2",
  "unit-5/grade6area5-1-2language": "math/unit-5/supplemental/grade6area5-1-2language",
  "unit-5/interactiveareamission": "math/unit-5/supplemental/interactiveareamission",
  "unit-5/noamunit5quizbaseball": "math/unit-5/supplemental/noamunit5quizbaseball",
  "unit-5/parallelogramandrhombusgame": "math/unit-5/supplemental/parallelogramandrhombusgame",
  "unit-5/rectangularprismstory": "math/unit-5/supplemental/rectangularprismstory",
  "unit-5/rectangularprismstoryesl": "math/unit-5/supplemental/rectangularprismstoryesl",
  "unit-5/trapezoid-area-studio-env": "math/unit-5/supplemental/trapezoid-area-studio-env",
  "unit-5/trapezoid-area-studio-rv": "math/unit-5/supplemental/trapezoid-area-studio-rv",
  "unit-5/unit5practicehtml": "math/unit-5/supplemental/unit5practicehtml",
  "unit-5/unit5testreview": "math/unit-5/supplemental/unit5testreview",
  "unit-5/volume-scaffold-module": "math/unit-5/supplemental/volume-scaffold-module",
  "unit-5/volumeofrectangularprism": "math/unit-5/supplemental/volumeofrectangularprism",
  "unit-5/world-architect-project": "math/unit-5/supplemental/world-architect-project",

  // unit-5-practice -> math/unit-5/supplemental/practice-hub
  "unit-5-practice": "math/unit-5/supplemental/practice-hub"
};

const PARENT_REDIRECTS = {
  "/unit-1/": "/math/unit-1/supplemental/",
  "/unit-4/": "/math/unit-1/supplemental/",
  "/unit-5/": "/math/unit-5/supplemental/",
  "/unit-5-practice/": "/math/unit-5/supplemental/practice-hub/"
};

function walk(dir) {
  let results = [];
  const list = readdirSync(dir);
  for (const name of list) {
    if (name === ".git" || name === "node_modules" || name === "dist" || name === ".vite") continue;
    const full = join(dir, name);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      results = results.concat(walk(full));
    } else {
      results.push(full);
    }
  }
  return results;
}

function runMigration() {
  console.log("=== Retire Legacy Folders Migration Script ===");

  // 1. Physically move directories using git mv
  for (const [srcRel, destRel] of Object.entries(RETIREMENT_MAPPING)) {
    const srcPath = join(root, srcRel);
    const destPath = join(root, destRel);

    if (existsSync(srcPath)) {
      console.log(`Moving directory: ${srcRel} -> ${destRel}`);
      const destParent = join(destPath, "..");
      if (!existsSync(destParent)) {
        execSync(`mkdir -p "${destParent}"`);
      }
      try {
        execSync(`git mv "${srcPath}" "${destPath}"`);
      } catch (e) {
        console.warn(`Git mv failed, trying standard mv for ${srcRel}:`, e.message);
        execSync(`mv "${srcPath}" "${destPath}"`);
      }
    } else {
      console.log(`Source directory does not exist: ${srcRel}`);
    }
  }

  // 2. Delete the legacy parent index.html files
  const legacyParents = ["unit-1", "unit-4", "unit-5"];
  for (const parent of legacyParents) {
    const indexPath = join(root, parent, "index.html");
    if (existsSync(indexPath)) {
      console.log(`Deleting legacy parent index: ${parent}/index.html`);
      try {
        execSync(`git rm "${indexPath}"`);
      } catch (e) {
        execSync(`rm "${indexPath}"`);
      }
    }
    // Try to remove parent directory if empty
    const dirPath = join(root, parent);
    if (existsSync(dirPath) && readdirSync(dirPath).length === 0) {
      console.log(`Removing empty legacy parent folder: ${parent}`);
      execSync(`rm -rf "${dirPath}"`);
    }
  }

  // 3. Perform URL replacements in all source files
  console.log("Replacing link references in HTML/JS/JSON files...");
  const files = walk(root).filter(f => {
    const ext = extname(f);
    return ext === ".html" || ext === ".js" || ext === ".json" || ext === ".mjs";
  });

  let replacementCount = 0;
  for (const file of files) {
    if (file.endsWith("routes.json") || file.endsWith("retire-legacy-folders.mjs")) continue;

    let content = readFileSync(file, "utf8");
    let modified = false;

    for (const [srcRel, destRel] of Object.entries(RETIREMENT_MAPPING)) {
      const srcWithTrail = "/" + srcRel + "/";
      const destWithTrail = "/" + destRel + "/";
      const srcNoTrail = "/" + srcRel;
      const destNoTrail = "/" + destRel;

      // Replace double-quoted and single-quoted versions
      const dqSrcTrail = `"${srcWithTrail}"`;
      const dqDestTrail = `"${destWithTrail}"`;
      if (content.includes(dqSrcTrail)) {
        content = content.replaceAll(dqSrcTrail, dqDestTrail);
        modified = true;
        replacementCount++;
      }

      const sqSrcTrail = `'${srcWithTrail}'`;
      const sqDestTrail = `'${destWithTrail}'`;
      if (content.includes(sqSrcTrail)) {
        content = content.replaceAll(sqSrcTrail, sqDestTrail);
        modified = true;
        replacementCount++;
      }

      const dqSrcNoTrail = `"${srcNoTrail}"`;
      const dqDestNoTrail = `"${destNoTrail}"`;
      if (content.includes(dqSrcNoTrail)) {
        content = content.replaceAll(dqSrcNoTrail, dqDestNoTrail);
        modified = true;
        replacementCount++;
      }

      const sqSrcNoTrail = `'${srcNoTrail}'`;
      const sqDestNoTrail = `'${destNoTrail}'`;
      if (content.includes(sqSrcNoTrail)) {
        content = content.replaceAll(sqSrcNoTrail, sqDestNoTrail);
        modified = true;
        replacementCount++;
      }

      // Also support relative paths like `./unit-5/` or `./unit-4/`
      const relSrcTrail1 = `"./${srcRel}/"`;
      const relDestTrail1 = `"${destWithTrail}"`;
      if (content.includes(relSrcTrail1)) {
        content = content.replaceAll(relSrcTrail1, relDestTrail1);
        modified = true;
        replacementCount++;
      }

      const relSrcTrail2 = `'./${srcRel}/'`;
      const relDestTrail2 = `'${destWithTrail}'`;
      if (content.includes(relSrcTrail2)) {
        content = content.replaceAll(relSrcTrail2, relDestTrail2);
        modified = true;
        replacementCount++;
      }

      const relSrcNoTrail1 = `"./${srcRel}"`;
      const relDestNoTrail1 = `"${destNoTrail}"`;
      if (content.includes(relSrcNoTrail1)) {
        content = content.replaceAll(relSrcNoTrail1, relDestNoTrail1);
        modified = true;
        replacementCount++;
      }

      const relSrcNoTrail2 = `'./${srcRel}'`;
      const relDestNoTrail2 = `'${destNoTrail}'`;
      if (content.includes(relSrcNoTrail2)) {
        content = content.replaceAll(relSrcNoTrail2, relDestNoTrail2);
        modified = true;
        replacementCount++;
      }
    }

    if (modified) {
      writeFileSync(file, content, "utf8");
      console.log(`Updated legacy folder links in: ${file.replace(root + "/", "")}`);
    }
  }
  console.log(`Total legacy folder link replacements: ${replacementCount}`);

  // 4. Add redirects to data/routes.json
  const routesPath = join(root, "data", "routes.json");
  if (existsSync(routesPath)) {
    console.log("Updating data/routes.json with 301 redirects for legacy folders...");
    const routesObj = JSON.parse(readFileSync(routesPath, "utf8"));
    const existingRedirects = routesObj.redirects || [];

    const existingSources = new Set(existingRedirects.map(r => r.source));

    // Add parent level redirects
    for (const [src, dest] of Object.entries(PARENT_REDIRECTS)) {
      if (!existingSources.has(src)) {
        existingRedirects.push({
          source: src,
          destination: dest,
          status: 301
        });
      }
      const srcNoTrail = src.slice(0, -1);
      if (!existingSources.has(srcNoTrail)) {
        existingRedirects.push({
          source: srcNoTrail,
          destination: dest,
          status: 301
        });
      }
    }

    // Add subfolder level redirects
    for (const [srcRel, destRel] of Object.entries(RETIREMENT_MAPPING)) {
      const srcWithTrail = "/" + srcRel + "/";
      const destWithTrail = "/" + destRel + "/";
      const srcNoTrail = "/" + srcRel;

      if (!existingSources.has(srcWithTrail)) {
        existingRedirects.push({
          source: srcWithTrail,
          destination: destWithTrail,
          status: 301
        });
      }
      if (!existingSources.has(srcNoTrail)) {
        existingRedirects.push({
          source: srcNoTrail,
          destination: destWithTrail,
          status: 301
        });
      }
    }

    routesObj.redirects = existingRedirects;
    writeFileSync(routesPath, JSON.stringify(routesObj, null, 2) + "\n", "utf8");
    console.log("routes.json redirects updated successfully.");
  }
}

runMigration();
