import { readFileSync, writeFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join, extname } from "node:path";

const root = process.cwd();

const GAME_MAPPING = {
  "/games/unit1-factor-frenzy.html": "/math/unit-1/games/unit1-factor-frenzy.html",
  "/games/unit2-fraction-kitchen.html": "/math/unit-2/games/unit2-fraction-kitchen.html",
  "/games/unit3-ratio-rally.html": "/math/unit-3/games/unit3-ratio-rally.html",
  "/games/unit4-discount-dash.html": "/math/unit-4/games/unit4-discount-dash.html",
  "/games/unit5-area-architect.html": "/math/unit-5/games/unit5-area-architect.html",
  "/games/unit6-expression-engine.html": "/math/unit-6/games/unit6-expression-engine.html",
  "/games/unit7-equation-escape.html": "/math/unit-8/games/unit7-equation-escape.html",
  "/games/unit8-stats-slam.html": "/math/statistics/games/unit8-stats-slam.html",
  "/games/unit9-coordinate-quest.html": "/math/unit-7/games/unit9-coordinate-quest.html",
  "/games/unit10-volume-vault.html": "/math/unit-10/games/unit10-volume-vault.html"
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
  console.log("=== Unit Games Reference Migration Script ===");

  // 1. Replace references in all source files
  const files = walk(root).filter(f => {
    const ext = extname(f);
    // Target configs, lessons, 3d games, hubs
    return ext === ".html" || ext === ".js" || ext === ".json" || ext === ".mjs";
  });

  let replacementCount = 0;
  for (const file of files) {
    if (file.endsWith("routes.json") || file.endsWith("migrate-unit-games.mjs")) continue;

    let content = readFileSync(file, "utf8");
    let modified = false;

    for (const [oldPath, newPath] of Object.entries(GAME_MAPPING)) {
      // Replace with double quotes
      const dqOld = `"${oldPath}"`;
      const dqNew = `"${newPath}"`;
      if (content.includes(dqOld)) {
        content = content.replaceAll(dqOld, dqNew);
        modified = true;
        replacementCount++;
      }

      // Replace with single quotes
      const sqOld = `'${oldPath}'`;
      const sqNew = `'${newPath}'`;
      if (content.includes(sqOld)) {
        content = content.replaceAll(sqOld, sqNew);
        modified = true;
        replacementCount++;
      }
    }

    if (modified) {
      writeFileSync(file, content, "utf8");
      console.log(`Updated game links in: ${file.replace(root + "/", "")}`);
    }
  }
  console.log(`Total unit game link replacements: ${replacementCount}`);

  // 2. Add redirects to data/routes.json
  const routesPath = join(root, "data", "routes.json");
  if (existsSync(routesPath)) {
    console.log("Updating data/routes.json with 301 redirects for unit games...");
    const routesObj = JSON.parse(readFileSync(routesPath, "utf8"));
    const existingRedirects = routesObj.redirects || [];

    const existingSources = new Set(existingRedirects.map(r => r.source));

    for (const [oldPath, newPath] of Object.entries(GAME_MAPPING)) {
      if (!existingSources.has(oldPath)) {
        existingRedirects.push({
          source: oldPath,
          destination: newPath,
          status: 301
        });
        console.log(`Added redirect: ${oldPath} -> ${newPath}`);
      }
    }

    routesObj.redirects = existingRedirects;
    writeFileSync(routesPath, JSON.stringify(routesObj, null, 2) + "\n", "utf8");
    console.log("routes.json updated successfully.");
  }
}

runMigration();
