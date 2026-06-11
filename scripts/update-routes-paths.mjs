import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

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

  // expressions-equations
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

const GAME_MAPPING = {
  "games/unit1-factor-frenzy.html": "math/unit-1/games/unit1-factor-frenzy.html",
  "games/unit2-fraction-kitchen.html": "math/unit-2/games/unit2-fraction-kitchen.html",
  "games/unit3-ratio-rally.html": "math/unit-3/games/unit3-ratio-rally.html",
  "games/unit4-discount-dash.html": "math/unit-4/games/unit4-discount-dash.html",
  "games/unit5-area-architect.html": "math/unit-5/games/unit5-area-architect.html",
  "games/unit6-expression-engine.html": "math/unit-6/games/unit6-expression-engine.html",
  "games/unit7-equation-escape.html": "math/unit-8/games/unit7-equation-escape.html",
  "games/unit8-stats-slam.html": "math/statistics/games/unit8-stats-slam.html",
  "games/unit9-coordinate-quest.html": "math/unit-7/games/unit9-coordinate-quest.html",
  "games/unit10-volume-vault.html": "math/unit-10/games/unit10-volume-vault.html"
};

function run() {
  const routesPath = join(root, "data", "routes.json");
  const routesObj = JSON.parse(readFileSync(routesPath, "utf8"));
  
  let routeUpdates = 0;
  let redirectUpdates = 0;

  // Update routes
  if (Array.isArray(routesObj.routes)) {
    for (const route of routesObj.routes) {
      if (!route.path) continue;
      
      // Try mapping standard directories
      for (const [srcRel, destRel] of Object.entries(MAPPING)) {
        const srcPath = "/" + srcRel + "/";
        const destPath = "/" + destRel + "/";
        if (route.path === srcPath) {
          route.path = destPath;
          routeUpdates++;
          console.log(`Updated route ${route.id}: ${srcPath} -> ${destPath}`);
        }
      }

      // Try mapping unit games
      for (const [srcRel, destRel] of Object.entries(GAME_MAPPING)) {
        const srcPath = "/" + srcRel;
        const destPath = "/" + destRel;
        if (route.path === srcPath) {
          route.path = destPath;
          routeUpdates++;
          console.log(`Updated game route ${route.id}: ${srcPath} -> ${destPath}`);
        }
      }
    }
  }

  // Update redirects destinations (to avoid pointing to old missing targets)
  if (Array.isArray(routesObj.redirects)) {
    for (const redirect of routesObj.redirects) {
      if (!redirect.destination) continue;

      // Update redirect destinations if they point to moved themes
      for (const [srcRel, destRel] of Object.entries(MAPPING)) {
        const srcPath = "/" + srcRel + "/";
        const destPath = "/" + destRel + "/";
        if (redirect.destination === srcPath) {
          redirect.destination = destPath;
          redirectUpdates++;
        }
      }

      // Update redirect destinations if they point to moved unit games
      for (const [srcRel, destRel] of Object.entries(GAME_MAPPING)) {
        const srcPath = "/" + srcRel;
        const destPath = "/" + destRel;
        if (redirect.destination === srcPath) {
          redirect.destination = destPath;
          redirectUpdates++;
        }
      }
    }
  }

  writeFileSync(routesPath, JSON.stringify(routesObj, null, 2) + "\n", "utf8");
  console.log(`Finished updating routes.json. Route updates: ${routeUpdates}, Redirect destination updates: ${redirectUpdates}`);
}

run();
