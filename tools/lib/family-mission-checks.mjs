// Rule implementations for validate-family-mission-content (COUNTS, BILINGUAL, OBJECTIVE, LINKS).
// Each check takes the parsed page model (family-mission-page.mjs) and returns findings:
//   { rule, lesson, field, quote, detail }
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { REPO_ROOT } from "./curriculum-source.mjs";

const finding = (rule, lesson, field, quote, detail = "") => ({
  rule,
  lesson,
  field,
  quote: String(quote ?? "").slice(0, 140),
  detail,
});

/* ------------------------------------------------------------------ routes (read from the shipped bundle) */

const bundleCache = new Map();

/** Route limits and goal sizes as the page's own JavaScript bundle defines them. */
export function readRouteConfig(page) {
  const src = page.links.find((l) =>
    /\/assets\/homework\/homework-core-[\w]+\.bundle\.js/.test(l.href),
  );
  if (!src) return null;
  const file = join(REPO_ROOT, src.href.split("?")[0].replace(/^\//, ""));
  if (!bundleCache.has(file)) {
    const js = existsSync(file) ? readFileSync(file, "utf8") : "";
    const route = (name) => {
      const m = new RegExp(
        `${name}:\\s*\\{\\s*tabs:\\s*\\[([^\\]]*)\\],\\s*problemLimit:\\s*(\\d+)`,
      ).exec(js);
      return m
        ? { tabs: m[1].replace(/['"\s]/g, "").split(","), problemLimit: Number(m[2]) }
        : null;
    };
    bundleCache.set(file, { quick: route("quick"), full: route("full") });
  }
  return bundleCache.get(file);
}

const coreProblems = (page) => page.problems.filter((p) => p.tier !== "more");

/** The number the page shows for a goal, given the route and the problems it really renders. */
export function expectedGoal(page, cfg, mode) {
  const available = coreProblems(page).length;
  /* The goal is every problem the route shows: the mission's limit, or all of them. */
  const limit = mode === "quick" ? cfg.quick.problemLimit : 0;
  return Math.max(1, limit > 0 ? Math.min(limit, available || limit) : available);
}

/* ------------------------------------------------------------------ COUNTS */

export function countChecks(page, cfg = readRouteConfig(page)) {
  const out = [];
  const id = page.id;
  const core = coreProblems(page);
  if (!cfg?.quick || !cfg.quick.problemLimit) {
    return [
      finding(
        "COUNT_NO_ROUTE",
        id,
        "bundle",
        "",
        "route limits could not be read from the shipped bundle",
      ),
    ];
  }
  const r = page.route;
  const quickShown = Math.min(cfg.quick.problemLimit, core.length);
  if (r.quickClaim === null)
    out.push(
      finding(
        "COUNT_QUICK_CLAIM",
        id,
        "quick route",
        "",
        "no 'One example and N problems' text on the Quick route",
      ),
    );
  else if (r.quickClaim !== quickShown)
    out.push(
      finding(
        "COUNT_QUICK_CLAIM",
        id,
        "quick route",
        `One example and ${r.quickClaim} problems`,
        `Quick route renders ${quickShown} problem(s)`,
      ),
    );
  if (!page.html.includes('id="hw_learn_idea"'))
    out.push(
      finding(
        "COUNT_QUICK_EXAMPLE",
        id,
        "learn",
        "",
        "Quick route promises one example but the page has no worked example (#hw_learn_idea)",
      ),
    );
  // The page opens on its default route, so the static goal must be that route's goal before any script runs.
  const want = expectedGoal(page, cfg, r.defaultMode || "quick");
  const stale = [...new Set(r.goalCounts.filter((n) => n !== want))];
  if (stale.length)
    out.push(
      finding(
        "COUNT_STATIC_GOAL",
        id,
        "goal chips (first paint)",
        `goal shows ${stale.join("/")}`,
        `default route is ${r.defaultMode}: goal should read ${want} (script corrects it after load)`,
      ),
    );
  const wrongAvail = r.availCounts.filter((n) => n !== core.length);
  if (wrongAvail.length)
    out.push(
      finding(
        "COUNT_AVAILABLE",
        id,
        "problems available",
        `says ${wrongAvail[0]}`,
        `page renders ${core.length} core problems`,
      ),
    );
  if (core.length < cfg.quick.problemLimit)
    out.push(
      finding(
        "COUNT_TOO_FEW",
        id,
        "core problems",
        String(core.length),
        `the mission shows ${cfg.quick.problemLimit}`,
      ),
    );
  const ids = page.problems.map((p) => p.index);
  if (new Set(ids).size !== ids.length)
    out.push(finding("COUNT_DUPLICATE_ID", id, "problems", ids.join(","), "duplicate problem ids"));
  return out;
}

/* ------------------------------------------------------------------ BILINGUAL */

/** Words that are English and never Spanish. A hit inside Spanish text is a missed translation. */
const ENGLISH_ONLY =
  /(?<![\p{L}\d_])(the|and|your|with|you|is|are|what|this|that|which|have|from|does|how|tonight|problems?|answer|because)(?![\p{L}\d_])/iu;

const letters = (s) => (s.match(/\p{L}{3,}/gu) || []).length;
const bare = (s) => s.replace(/[\d\s.,;:!?¿¡$%()\-–—−+×÷=/<>|"'“”«»…]/g, "").toLowerCase();

/** EN and ES are a pair when ES exists, is not the English copied over, and holds no English function words. */
// Spanish may quote the English text a card actually shows ('for every', “10 red beads”).
const QUOTED = /'[^']{3,}'|“[^”]*”|"[^"]*"|«[^»]*»/g;

function pairProblem(en, es) {
  if (!en || letters(en) === 0) return null;
  if (es === null || es === undefined || es === "") return "Spanish is missing";
  // A label that already carries both languages ("12 units² / unidades²") is one string on purpose.
  if (en === es && / \/ /.test(en)) return null;
  if (bare(en) === bare(es)) return letters(en) >= 2 ? "Spanish is a copy of the English" : null;
  const hit = ENGLISH_ONLY.exec(es.replace(QUOTED, " "));
  return hit ? `English word "${hit[0]}" in the Spanish` : null;
}

let titlesEs = null;
const titlesEsMap = () => {
  titlesEs ||= JSON.parse(
    readFileSync(join(REPO_ROOT, "data", "family-homework-titles-es.json"), "utf8"),
  );
  return titlesEs;
};

/**
 * The Spanish page title lives in data/family-homework-titles-es.json, keyed by page id; the generator
 * falls back to the ENGLISH title when the key is missing. Checking the source finds the gap before the
 * page is regenerated (25 Part 2 / practice pages had no entry).
 */
export function titleSourceChecks(page, ctx, map = titlesEsMap()) {
  const es = map[page.id];
  if (!es)
    return [
      finding(
        "BILINGUAL_TITLE_SOURCE",
        page.id,
        "data/family-homework-titles-es.json",
        ctx.title,
        "no Spanish title for this page",
      ),
    ];
  return pairProblem(ctx.title, es)
    ? [
        finding(
          "BILINGUAL_TITLE_SOURCE",
          page.id,
          "data/family-homework-titles-es.json",
          ctx.title,
          pairProblem(ctx.title, es),
        ),
      ]
    : [];
}

const SKIP_ATTR = /^data-(aria|title|fw-tip)-en$/;

export function bilingualChecks(page) {
  const out = [];
  const id = page.id;
  let unpaired = 0;
  for (const p of page.langPairs) {
    if (!p.paired) {
      unpaired++;
      continue;
    }
    const why = pairProblem(p.en, p.es);
    if (why) out.push(finding("BILINGUAL", id, "page text", p.en, why));
  }
  if (unpaired)
    out.push(
      finding(
        "BILINGUAL_UNPAIRED",
        id,
        "page text",
        "",
        `${unpaired} English span(s) with no Spanish sibling`,
      ),
    );
  for (const a of page.attrPairs) {
    if (!SKIP_ATTR.test(a.attr) && !/^data-(hint|chip|card|stamp|fw-stamp)-en$/.test(a.attr))
      continue;
    const why = pairProblem(a.en, a.es);
    if (why) out.push(finding("BILINGUAL", id, a.attr, a.en, why));
  }
  for (const q of page.problems) {
    const f = `problem ${q.index + 1}`;
    if (q.stemEn && pairProblem(q.stemEn, q.stemEs))
      out.push(finding("BILINGUAL", id, `${f} stem`, q.stemEn, pairProblem(q.stemEn, q.stemEs)));
    if (q.explanationEn && pairProblem(q.explanationEn, q.explanationEs))
      out.push(
        finding(
          "BILINGUAL",
          id,
          `${f} explanation`,
          q.explanationEn,
          pairProblem(q.explanationEn, q.explanationEs),
        ),
      );
    if (q.feedbackEn.length !== q.feedbackEs.length)
      out.push(
        finding(
          "BILINGUAL",
          id,
          `${f} feedback`,
          "",
          `${q.feedbackEn.length} English vs ${q.feedbackEs.length} Spanish choice notes`,
        ),
      );
    q.feedbackEn.forEach((t, i) => {
      const why = t && pairProblem(t, q.feedbackEs[i]);
      if (why) out.push(finding("BILINGUAL", id, `${f} feedback ${i}`, t, why));
    });
  }
  return out;
}

/* ------------------------------------------------------------------ OBJECTIVE */

const STANDARD = /^(MPP\.\d|5\.(NF|NBT|MD|OA)\.[A-Z]\.\d+(\.[a-z])?|6\.(AT|DS|GR|NOS)\.\d+[a-z]?)$/;
let tocTitles = null;

function loadToc() {
  if (tocTitles) return tocTitles;
  tocTitles = new Map();
  const toc = JSON.parse(readFileSync(join(REPO_ROOT, "data", "reveal-toc-2025.json"), "utf8"));
  for (const u of toc.units) for (const l of u.lessons) tocTitles.set(l.n, l.title);
  return tocTitles;
}

const flat = (html) => html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");

export function objectiveChecks(page, ctx) {
  const out = [];
  const id = page.id;
  const { config, sidecar, baseId, session } = ctx;
  if (!config)
    return [finding("OBJ_NO_CONFIG", id, "config", "", `lessons/${baseId}/config.json is missing`)];
  const toc = loadToc();
  ctx.tocTitle = toc.get(baseId) ?? null;
  if (ctx.tocTitle && config.title !== ctx.tocTitle)
    out.push(
      finding(
        "OBJ_TITLE",
        id,
        "config.title",
        config.title,
        `reveal-toc title is "${ctx.tocTitle}"`,
      ),
    );
  if (!STANDARD.test(String(config.standard || "")))
    out.push(
      finding(
        "OBJ_STANDARD_FORMAT",
        id,
        "config.standard",
        config.standard,
        "not a valid standard code",
      ),
    );
  const shown = (/Standard:\s*(?:Est[aá]ndar:\s*)?([A-Z0-9.]+[a-z]?)/.exec(flat(page.html)) ||
    [])[1];
  if (shown && shown !== config.standard)
    out.push(
      finding("OBJ_STANDARD_SHOWN", id, "page standard", shown, `config says ${config.standard}`),
    );
  const tonight = sidecar?.learningTonight;
  if (!tonight?.en || !tonight?.es)
    out.push(
      finding(
        "OBJ_SESSION_TEXT",
        id,
        "sidecar.learningTonight",
        "",
        "session objective text missing in English or Spanish",
      ),
    );
  if (session > 1 && !sidecar?.sessionTitle)
    out.push(
      finding(
        "OBJ_SESSION_TITLE",
        id,
        "sidecar.sessionTitle",
        "",
        "Session 2+ page has no session title",
      ),
    );
  if (!config.contentObjective)
    out.push(
      finding("OBJ_CONTENT_OBJECTIVE", id, "config.contentObjective", "", "no lesson objective"),
    );
  const expected = (session > 1 ? sidecar?.sessionTitle : config.title) || "";
  if (expected && page.title && !page.title.includes(expected))
    out.push(finding("OBJ_PAGE_TITLE", id, "page title", page.title, `expected "${expected}"`));
  return out;
}

/* ------------------------------------------------------------------ LINKS */

const EXTERNAL_OK_HOSTS = new Set(["eduwonderlab.com", "www.eduwonderlab.com"]);
// The "Message Mr. Neft" button on every Done stop; the generator writes it, no data file lists it.
const EXTERNAL_TOOLS = new Set(["https://home.classdojo.com/"]);
let listedExternal = null;

function externalUrls() {
  if (listedExternal) return listedExternal;
  listedExternal = new Set();
  const walk = (o) => {
    if (typeof o === "string") {
      if (/^https?:\/\//.test(o)) listedExternal.add(o);
    } else if (o && typeof o === "object") for (const v of Object.values(o)) walk(v);
  };
  walk(
    JSON.parse(readFileSync(join(REPO_ROOT, "data", "homework-external-resources.json"), "utf8")),
  );
  return listedExternal;
}

const ROOTS = ["", "public"];
// Built entries: Vite serves these under /assets/ from a source file elsewhere (vite.config.js `input`,
// dev rewrite at vite.config.js:474), so no file exists at the URL itself.
const BUILT_ENTRIES = { "/assets/homework-lesson-models.js": "engine/homework-lesson-models.js" };

/** True when `path` (site-absolute) resolves to a file in the repo. */
export function resolvesInRepo(path) {
  const clean = decodeURIComponent(path.split(/[?#]/)[0]).replace(/^\//, "");
  if (BUILT_ENTRIES[`/${clean}`]) return existsSync(join(REPO_ROOT, BUILT_ENTRIES[`/${clean}`]));
  if (!clean) return existsSync(join(REPO_ROOT, "index.html"));
  const tries = clean.endsWith("/")
    ? [`${clean}index.html`]
    : [clean, `${clean}.html`, `${clean}/index.html`];
  return ROOTS.some((root) => tries.some((t) => existsSync(join(REPO_ROOT, root, t))));
}

export function linkChecks(page) {
  const out = [];
  const seen = new Set();
  for (const l of page.links) {
    if (seen.has(l.href)) continue;
    seen.add(l.href);
    if (/^https?:\/\//i.test(l.href)) {
      const url = new URL(l.href);
      if (EXTERNAL_OK_HOSTS.has(url.hostname)) {
        if (!resolvesInRepo(url.pathname))
          out.push(
            finding(
              "LINK_SELF_BROKEN",
              page.id,
              `${l.tag} href`,
              l.href,
              "own-site URL does not resolve to a repo file",
            ),
          );
      } else if (!EXTERNAL_TOOLS.has(l.href) && !externalUrls().has(l.href)) {
        out.push(
          finding(
            "LINK_EXTERNAL_UNLISTED",
            page.id,
            `${l.tag} href`,
            l.href,
            "not in data/homework-external-resources.json",
          ),
        );
      }
    } else if (l.href.startsWith("/")) {
      if (l.href.startsWith("/api/")) continue; // served by functions/, not a file
      if (!resolvesInRepo(l.href))
        out.push(
          finding(
            "LINK_BROKEN",
            page.id,
            `${l.tag} href`,
            l.href,
            "does not resolve to a repo file",
          ),
        );
    }
  }
  return out;
}
