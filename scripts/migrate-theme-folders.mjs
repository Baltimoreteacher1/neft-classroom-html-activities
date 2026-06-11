import { readFileSync, writeFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join, extname } from "node:path";
import { execSync } from "node:child_process";

const root = process.cwd();

// Map folders under theme directories to their new canonical math/unit-N or math/statistics homes.
const MAPPING = {
  // number-system
  "number-system/pixel-area-model": "math/unit-2/pixel-area-model",
  "number-system/coordinate-navigator": "math/unit-7/coordinate-navigator",
  "number-system/6-ns-a-1game": "math/unit-2/6-ns-a-1game",
  "number-system/6-ns-b-2reviewactivities": "math/unit-1/6-ns-b-2reviewactivities",
  "number-system/6-ns-c-6game": "math/unit-7/6-ns-c-6game",
  "number-system/subzero-ledger": "math/unit-7/subzero-ledger",
  "number-system/6-ns-3practice": "math/unit-7/6-ns-3practice",
  "number-system/6-ns-c-5game": "math/unit-7/6-ns-c-5game",
  "number-system/6-ns-b-2game": "math/unit-1/6-ns-b-2game",
  "number-system/fraction-division-soccer": "math/unit-2/fraction-division-soccer",
  "number-system/6-ns-b-3game": "math/unit-1/6-ns-b-3game",
  "number-system/6-ns-b-4game": "math/unit-1/6-ns-b-4game",
  "number-system/6-ns-c": "math/unit-7/6-ns-c",
  "number-system/6-ns-b-4review": "math/unit-1/6-ns-b-4review",
  "number-system/grid-architect": "math/unit-7/grid-architect",
  "number-system/coordinate-quest": "math/unit-7/coordinate-quest",
  "number-system/factor-tree-salvage": "math/unit-1/factor-tree-salvage",
  "number-system/6-ns-c-8game": "math/unit-7/6-ns-c-8game",
  "number-system/6-ns-c-3game": "math/unit-7/6-ns-c-3game",
  "number-system/6-ns-c-3review": "math/unit-7/6-ns-c-3review",
  "number-system/6-ns-b-3review": "math/unit-1/6-ns-b-3review",
  "number-system/6-ns-cstudypractice": "math/unit-7/6-ns-cstudypractice",

  // ratios-proportions
  "ratios-proportions/6-rp-1reviewlearn": "math/unit-3/6-rp-1reviewlearn",
  "ratios-proportions/recipe-factory-line": "math/unit-3/recipe-factory-line",
  "ratios-proportions/6-rp-1game": "math/unit-3/6-rp-1game",
  "ratios-proportions/ratio-lab": "math/unit-3/ratio-lab",
  "ratios-proportions/ratio-fuel-mixer": "math/unit-3/ratio-fuel-mixer",
  "ratios-proportions/6-rp-a-3study": "math/unit-4/6-rp-a-3study",
  "ratios-proportions/6-rp-a-2-interactive-study-guide": "math/unit-4/6-rp-a-2-interactive-study-guide",
  "ratios-proportions/unit-rate-duel": "math/unit-4/unit-rate-duel",
  "ratios-proportions/6-rp-a-2game": "math/unit-4/6-rp-a-2game",
  "ratios-proportions/percent-shadow-caster": "math/unit-4/percent-shadow-caster",
  "ratios-proportions/6-rp-a-3game": "math/unit-4/6-rp-a-3game",

  // expressions-equations (distributive property / expressions -> unit-6, one-step/inequality -> unit-8, rest are two-variable -> unit-9)
  "expressions-equations/distributive-alchemy": "math/unit-6/distributive-alchemy",
  "expressions-equations/equivalent-expressions-forge": "math/unit-6/equivalent-expressions-forge",
  "expressions-equations/one-step-solver-arena": "math/unit-8/one-step-solver-arena",
  "expressions-equations/neon-inequality": "math/unit-8/neon-inequality",
  "expressions-equations/9-1-9-2studyforquiz": "math/unit-9/9-1-9-2studyforquiz",
  "expressions-equations/6-ee-c-9googleversiongifted-talentedversion": "math/unit-9/6-ee-c-9googleversiongifted-talentedversion",
  "expressions-equations/6-ee-c-9projectroblox": "math/unit-9/6-ee-c-9projectroblox",
  "expressions-equations/martian-fuel-pod": "math/unit-9/martian-fuel-pod",
  "expressions-equations/6-ee-c-9martiangame": "math/unit-9/6-ee-c-9martiangame",
  "expressions-equations/proportional-relationships-mission": "math/unit-9/proportional-relationships-mission",
  "expressions-equations/ind-dep-variables": "math/unit-9/ind-dep-variables",
  "expressions-equations/6-ee-9notespracti-e": "math/unit-9/6-ee-9notespracti-e",
  "expressions-equations/9-3reviewpractice": "math/unit-9/9-3reviewpractice",
  "expressions-equations/6-ee-b-6review": "math/unit-9/6-ee-b-6review",
  "expressions-equations/6-ee-c-9game": "math/unit-9/6-ee-c-9game",
  "expressions-equations/unit-9-1-6-ee-9": "math/unit-9/unit-9-1-6-ee-9",
  "expressions-equations/6-ee-c-9googleversion": "math/unit-9/6-ee-c-9googleversion",
  "expressions-equations/6-ee-c-9variablevelocitygame": "math/unit-9/6-ee-c-9variablevelocitygame",
  "expressions-equations/cloudflare-pages-game-for-6-ee-9": "math/unit-9/cloudflare-pages-game-for-6-ee-9",
  "expressions-equations/6-ee-c-9aftertest": "math/unit-9/6-ee-c-9aftertest",
  "expressions-equations/6-ee-c-9study": "math/unit-9/6-ee-c-9study",
  "expressions-equations/functionforge6-ee-9": "math/unit-9/functionforge6-ee-9",
  "expressions-equations/6-ee-9": "math/unit-9/6-ee-9",
  "expressions-equations/variableexploreresol": "math/unit-9/variableexploreresol",
  "expressions-equations/variablechartpractice": "math/unit-9/variablechartpractice",
  "expressions-equations/variableexplorer1": "math/unit-9/variableexplorer1",
  "expressions-equations/6-ee-c-9function-forge-the-relationship-reactor": "math/unit-9/6-ee-c-9function-forge-the-relationship-reactor",
  "expressions-equations/6-ee-c-9proportional-reasoning-lab": "math/unit-9/6-ee-c-9proportional-reasoning-lab",
  "expressions-equations/6-ee-9gamereview": "math/unit-9/6-ee-9gamereview",
  "expressions-equations/variablecomparisongame": "math/unit-9/variablecomparisongame",
  "expressions-equations/6-ee-c-9reviewactivities": "math/unit-9/6-ee-c-9reviewactivities",
  "expressions-equations/proportional-relationships-gallery": "math/unit-9/proportional-relationships-gallery",

  // statistics-data
  "statistics-data/6-sp-a-1data-lab-6-sp-a-1-flagship": "math/statistics/6-sp-a-1data-lab-6-sp-a-1-flagship",
  "statistics-data/6-sp-a-1game-2": "math/statistics/6-sp-a-1game-2",
  "statistics-data/6-sp-b-5-data-detective-game": "math/statistics/6-sp-b-5-data-detective-game",
  "statistics-data/6-sp-a-1reviewactivities": "math/statistics/6-sp-a-1reviewactivities",
  "statistics-data/6-sp-b-5-interactive-review": "math/statistics/6-sp-b-5-interactive-review",
  "statistics-data/gemini-data-quest": "math/statistics/gemini-data-quest",
  "statistics-data/box-plot-builder": "math/statistics/box-plot-builder",
  "statistics-data/bar-graph-world-comparison-lab": "math/statistics/bar-graph-world-comparison-lab",
  "statistics-data/histogram-hero": "math/statistics/histogram-hero",
  "statistics-data/world-cup-goals-data-quest": "math/statistics/world-cup-goals-data-quest",
  "statistics-data/mean-median-mode-game": "math/statistics/mean-median-mode-game",
  "statistics-data/histogram-master-lab": "math/statistics/histogram-master-lab",
  "statistics-data/6-sp-a-1review2": "math/statistics/6-sp-a-1review2",
  "statistics-data/meanmedianmodesoccerandbracelets": "math/statistics/meanmedianmodesoccerandbracelets",
  "statistics-data/statistics-of-my-life": "math/statistics/statistics-of-my-life",
  "statistics-data/6-sp-a-1game": "math/statistics/6-sp-a-1game",
  "statistics-data/distribution-detective": "math/statistics/distribution-detective",
  "statistics-data/data-studio": "math/statistics/data-studio",
  "statistics-data/histogram-graphic-novel": "math/statistics/histogram-graphic-novel",
  "statistics-data/mean-median-mode-intro": "math/statistics/mean-median-mode-intro",
  "statistics-data/box-plot-detective": "math/statistics/box-plot-detective",
  "statistics-data/mean-median-modegallerywalk": "math/statistics/mean-median-modegallerywalk"
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
  console.log("=== Phase 2 Reorganization Migration Script ===");

  // 1. Physically move the directories using git mv
  for (const [srcRel, destRel] of Object.entries(MAPPING)) {
    const srcPath = join(root, srcRel);
    const destPath = join(root, destRel);

    if (existsSync(srcPath)) {
      console.log(`Moving: ${srcRel} -> ${destRel}`);
      // Ensure the destination parent directory exists
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
      console.log(`Source directory does not exist (already moved?): ${srcRel}`);
    }
  }

  // 2. Perform global URL replacements in files
  console.log("Replacing link references in HTML/JS/JSON files...");
  const files = walk(root).filter(f => {
    const ext = extname(f);
    return ext === ".html" || ext === ".js" || ext === ".json" || ext === ".mjs";
  });

  let replacementCount = 0;
  for (const file of files) {
    // Skip routes.json for this replacement phase to avoid messing up the redirect rules themselves
    if (file.endsWith("routes.json") || file.endsWith("migrate-theme-folders.mjs")) continue;

    let content = readFileSync(file, "utf8");
    let modified = false;

    for (const [srcRel, destRel] of Object.entries(MAPPING)) {
      const srcPattern = "/" + srcRel + "/";
      const destPattern = "/" + destRel + "/";

      if (content.includes(srcPattern)) {
        content = content.replaceAll(srcPattern, destPattern);
        modified = true;
        replacementCount++;
      }

      // Also support links without trailing slashes
      const srcNoTrail = "/" + srcRel;
      const destNoTrail = "/" + destRel;
      // Use boundary-like checks (e.g. quote, space, or end-of-string)
      const quoteRegex1 = new RegExp('"' + srcNoTrail + '"', 'g');
      if (quoteRegex1.test(content)) {
        content = content.replace(quoteRegex1, '"' + destNoTrail + '"');
        modified = true;
        replacementCount++;
      }
      const quoteRegex2 = new RegExp("'" + srcNoTrail + "'", 'g');
      if (quoteRegex2.test(content)) {
        content = content.replace(quoteRegex2, "'" + destNoTrail + "'");
        modified = true;
        replacementCount++;
      }
    }

    if (modified) {
      writeFileSync(file, content, "utf8");
      console.log(`Updated links in: ${file.replace(root + "/", "")}`);
    }
  }
  console.log(`Total replacements made: ${replacementCount}`);

  // 3. Add 301 redirects to data/routes.json
  const routesPath = join(root, "data", "routes.json");
  if (existsSync(routesPath)) {
    console.log("Updating data/routes.json with 301 redirects...");
    const routesObj = JSON.parse(readFileSync(routesPath, "utf8"));
    const existingRedirects = routesObj.redirects || [];

    // Track existing redirect sources to prevent duplicates
    const existingSources = new Set(existingRedirects.map(r => r.source));

    for (const [srcRel, destRel] of Object.entries(MAPPING)) {
      const srcWithTrail = "/" + srcRel + "/";
      const destWithTrail = "/" + destRel + "/";
      const srcNoTrail = "/" + srcRel;
      const destNoTrail = "/" + destRel;

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
          destination: destWithTrail, // Redirect to destination with trailing slash for canonicalization
          status: 301
        });
      }
    }

    routesObj.redirects = existingRedirects;
    writeFileSync(routesPath, JSON.stringify(routesObj, null, 2) + "\n", "utf8");
    console.log("routes.json updated successfully.");
  }

  console.log("Migration finished! Remember to run build and validation scripts.");
}

runMigration();
