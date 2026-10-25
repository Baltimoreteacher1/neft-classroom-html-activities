/* ACCESS Practice Lab — offline worker.
 *
 * Scope: /access-practice-lab/ only. Once a device has loaded the lab online, practice keeps working without
 * Wi-Fi (test day, buses, a dead router). Rules that keep it safe:
 *   - Content-hashed files (?v=<hash> .js/.css) are served cache-first: the URL changes whenever the file does.
 *   - Everything else in scope is network-first with a short timeout, then the saved copy, so a deploy is seen
 *     as soon as the network answers and a flaky connection never blocks the lab.
 *   - HTML navigations get the app shell. The shell is byte-identical to index.html (tools/sync-access-shell.mjs).
 *   - /api/, the build stamp (config.json), this file, Range requests, non-GET and cross-origin requests are never touched.
 *   - A device keeps this build's files and the previous build's, so a tab opened before a deploy still finds its modules.
 * The block between the build markers is written by tools/sync-access-shell.mjs; do not edit it by hand.
 */
/* build:begin */
const BUILD_HASH = "e9f193469de0";
const PRECACHE_CORE = [
  "/access-practice-lab/styles.css?v=03f96256791b",
  "/access-practice-lab/library.css?v=50b712adeeb8",
  "/access-practice-lab/session-plan.css?v=f7eed42e57d1",
  "/access-practice-lab/audit.css?v=3de36e8cd3e4",
  "/access-practice-lab/studio.css?v=8dd83b16d878",
  "/access-practice-lab/launch-studio.css?v=ea4abfd0aba6",
  "/access-practice-lab/diagnostic.css?v=be5f008eb281",
  "/access-practice-lab/worlds.css?v=0d1b5484f694",
  "/access-practice-lab/classroom-studio.css?v=31199ffc6165",
  "/access-practice-lab/vocabulary.css?v=7b37b0bdaa01",
  "/access-practice-lab/rehearsal.css?v=346e647fb1ba",
  "/access-practice-lab/src/attempts.js?v=9ad8ee9e3283",
  "/access-practice-lab/src/audio-store.js?v=d05edac67707",
  "/access-practice-lab/src/components.js?v=05be44a23c28",
  "/access-practice-lab/src/content/vocabulary-items.js?v=8504c5643bba",
  "/access-practice-lab/src/content/world-missions.js?v=6ac1466837b1",
  "/access-practice-lab/src/content.js?v=495f00256281",
  "/access-practice-lab/src/evidence-ui.js?v=7d58a4a4180b",
  "/access-practice-lab/src/glossary.js?v=ce62bb1e18d9",
  "/access-practice-lab/src/grade.js?v=c88ead48711f",
  "/access-practice-lab/src/items.js?v=c223abb3ea7e",
  "/access-practice-lab/src/lang/adapt.js?v=15890fbe0aac",
  "/access-practice-lab/src/lang/analyze.js?v=8ce4f669ba4c",
  "/access-practice-lab/src/lang/audio.js?v=54ef48960185",
  "/access-practice-lab/src/lang/composite.js?v=8eacfb10f125",
  "/access-practice-lab/src/lang/errors.js?v=80fe733bc8c8",
  "/access-practice-lab/src/lang/evidence-notebook.js?v=28c0a0b75362",
  "/access-practice-lab/src/lang/feature-flags.js?v=634849364698",
  "/access-practice-lab/src/lang/klu.js?v=abe5a0b1e38a",
  "/access-practice-lab/src/lang/ledger.js?v=209b24eeb69b",
  "/access-practice-lab/src/lang/lexicon.js?v=9355534986ce",
  "/access-practice-lab/src/lang/providers.js?v=03dd3b9732ad",
  "/access-practice-lab/src/lang/purpose.js?v=4a86ba5123ec",
  "/access-practice-lab/src/lang/rubrics.js?v=5656db97483b",
  "/access-practice-lab/src/lang/scaffolds.js?v=18c8ecbb21fa",
  "/access-practice-lab/src/lang/share.js?v=64f094dd2eb1",
  "/access-practice-lab/src/lang/skill-graph.js?v=1917f4b842ba",
  "/access-practice-lab/src/lang/studio.js?v=fe989ddb7881",
  "/access-practice-lab/src/lang/teacher.js?v=2a78245d948e",
  "/access-practice-lab/src/lang/text.js?v=391bde3f4bec",
  "/access-practice-lab/src/learning.js?v=8a99a6d8753a",
  "/access-practice-lab/src/main.js?v=7eabaf035407",
  "/access-practice-lab/src/media.js?v=41d2ac925829",
  "/access-practice-lab/src/multilingual.js?v=d0b46fb38de3",
  "/access-practice-lab/src/practice-plan.js?v=e0ccb901e2cd",
  "/access-practice-lab/src/recorder.js?v=3621e4e1517d",
  "/access-practice-lab/src/shell.js?v=eed6146bd024",
  "/access-practice-lab/src/speech.js?v=0eb57c8581e0",
  "/access-practice-lab/src/store.js?v=866cc149de30",
  "/access-practice-lab/src/studio-ui.js?v=52534befb588",
  "/access-practice-lab/src/sync.js?v=b3e398476cee",
  "/access-practice-lab/src/util.js?v=5fbdef684724",
  "/access-practice-lab/src/views/activity.js?v=519f2fe61979",
  "/access-practice-lab/src/views/classroom-data.js?v=de468c8a1192",
  "/access-practice-lab/src/views/classroom.js?v=21eec95ace72",
  "/access-practice-lab/src/views/construction.js?v=8e107f13259a",
  "/access-practice-lab/src/views/conversation.js?v=51b123303ff0",
  "/access-practice-lab/src/views/detective.js?v=24c98ff43e25",
  "/access-practice-lab/src/views/diagnostic.js?v=4b641cf6b3b1",
  "/access-practice-lab/src/views/evidence.js?v=08df183727bd",
  "/access-practice-lab/src/views/family.js?v=493eb17898e2",
  "/access-practice-lab/src/views/growth.js?v=35d91e567d36",
  "/access-practice-lab/src/views/home.js?v=40158cb5fc09",
  "/access-practice-lab/src/views/launch-studio.js?v=4729ee70b72a",
  "/access-practice-lab/src/views/library.js?v=2ad35e7fa59a",
  "/access-practice-lab/src/views/missions.js?v=2040f7e1b237",
  "/access-practice-lab/src/views/passport.js?v=3e2f4f4581e9",
  "/access-practice-lab/src/views/road.js?v=47ecec4284e8",
  "/access-practice-lab/src/views/room.js?v=4307b4cbb0d4",
  "/access-practice-lab/src/views/speak.js?v=fc7269f672ff",
  "/access-practice-lab/src/views/test-modes.js?v=3796200e81c2",
  "/access-practice-lab/src/views/test-report.js?v=143a38f0bd4e",
  "/access-practice-lab/src/views/test.js?v=029682cebea8",
  "/access-practice-lab/src/views/tests.js?v=99163871e5f1",
  "/access-practice-lab/src/views/tools.js?v=5509ef41f4ea",
  "/access-practice-lab/src/views/vocabulary.js?v=b0c45f2aaeaf",
  "/access-practice-lab/src/views/worlds.js?v=de0305808d00",
  "/access-practice-lab/src/views/write.js?v=b749d744ee84",
];
const PRECACHE_MORE = [
  "/access-practice-lab/content/blueprints.json",
  "/access-practice-lab/content/detective/patterns.json",
  "/access-practice-lab/content/family.json",
  "/access-practice-lab/content/g3-5/Listening.json",
  "/access-practice-lab/content/g3-5/Reading.json",
  "/access-practice-lab/content/g3-5/Speaking.json",
  "/access-practice-lab/content/g3-5/Writing.json",
  "/access-practice-lab/content/g6-8/Listening.json",
  "/access-practice-lab/content/g6-8/Model-Test.json",
  "/access-practice-lab/content/g6-8/Reading.json",
  "/access-practice-lab/content/g6-8/Speaking.json",
  "/access-practice-lab/content/g6-8/Writing.json",
  "/access-practice-lab/content/glossary.json",
  "/access-practice-lab/content/index.json",
  "/access-practice-lab/content/missions/bike-lane-budget.json",
  "/access-practice-lab/content/missions/harbor-petition.json",
  "/access-practice-lab/content/missions/lighthouse-letters.json",
  "/access-practice-lab/content/missions/newsroom-debate.json",
  "/access-practice-lab/content/missions/space-colony.json",
  "/access-practice-lab/content/missions/watershed-mystery.json",
  "/access-practice-lab/content/road.json",
  "/access-practice-lab/content/shared.json",
  "/access-practice-lab/content/studio/exemplars-speaking.json",
  "/access-practice-lab/content/studio/exemplars-writing.json",
  "/access-practice-lab/content/studio/speaking.json",
  "/access-practice-lab/content/studio/writing.json",
  "/access-practice-lab/content/tests/g35-form-a.json",
  "/access-practice-lab/content/tests/g35-form-b.json",
  "/access-practice-lab/content/tests/g35-listening-mini.json",
  "/access-practice-lab/content/tests/g35-reading-mini.json",
  "/access-practice-lab/content/tests/g35-speaking-mini.json",
  "/access-practice-lab/content/tests/g35-writing-mini.json",
  "/access-practice-lab/content/tests/model-form-a.json",
  "/access-practice-lab/content/tests/model-form-b.json",
  "/access-practice-lab/content/tests/model-form-c.json",
  "/access-practice-lab/content/tests/wida-listening-leon.json",
  "/access-practice-lab/content/tests/wida-listening-mini.json",
  "/access-practice-lab/content/tests/wida-reading-garden.json",
  "/access-practice-lab/content/tests/wida-reading-mini.json",
  "/access-practice-lab/content/tests/wida-speaking-mini.json",
  "/access-practice-lab/content/tests/wida-speaking-newworld.json",
  "/access-practice-lab/content/tests/wida-writing-classes.json",
  "/access-practice-lab/content/tests/wida-writing-mini.json",
  "/access-practice-lab/content/worlds.json",
  "/access-practice-lab/pictures/35-listening-classroom.svg",
  "/access-practice-lab/pictures/35-listening-frac-1of4.svg",
  "/access-practice-lab/pictures/35-listening-frac-2of4.svg",
  "/access-practice-lab/pictures/35-listening-frac-3of4.svg",
  "/access-practice-lab/pictures/35-listening-frac-3of6.svg",
  "/access-practice-lab/pictures/35-listening-habitats.svg",
  "/access-practice-lab/pictures/35-listening-plant.svg",
  "/access-practice-lab/pictures/35-listening-playground.svg",
  "/access-practice-lab/pictures/35-listening-town-map.svg",
  "/access-practice-lab/pictures/35-listening-water-cycle.svg",
  "/access-practice-lab/pictures/35-reading-frog-cycle.svg",
  "/access-practice-lab/pictures/35-reading-garden.svg",
  "/access-practice-lab/pictures/35-reading-lemonade.svg",
  "/access-practice-lab/pictures/35-reading-library.svg",
  "/access-practice-lab/pictures/35-reading-market.svg",
  "/access-practice-lab/pictures/35-reading-night.svg",
  "/access-practice-lab/pictures/35-reading-park.svg",
  "/access-practice-lab/pictures/35-reading-plant-parts.svg",
  "/access-practice-lab/pictures/35-reading-rain.svg",
  "/access-practice-lab/pictures/35-reading-recycle.svg",
  "/access-practice-lab/pictures/35-reading-seasons.svg",
  "/access-practice-lab/pictures/35-reading-water-cycle.svg",
  "/access-practice-lab/pictures/35-speaking-class-garden.svg",
  "/access-practice-lab/pictures/35-speaking-classroom-jobs.svg",
  "/access-practice-lab/pictures/35-speaking-family-dinner.svg",
  "/access-practice-lab/pictures/35-speaking-field-trip.svg",
  "/access-practice-lab/pictures/35-speaking-ice-melt.svg",
  "/access-practice-lab/pictures/35-speaking-lemonade.svg",
  "/access-practice-lab/pictures/35-speaking-library.svg",
  "/access-practice-lab/pictures/35-speaking-lost-dog.svg",
  "/access-practice-lab/pictures/35-speaking-market.svg",
  "/access-practice-lab/pictures/35-speaking-neighborhood-map.svg",
  "/access-practice-lab/pictures/35-speaking-plant-experiment.svg",
  "/access-practice-lab/pictures/35-speaking-playground.svg",
  "/access-practice-lab/pictures/35-speaking-rainy-picnic.svg",
  "/access-practice-lab/pictures/35-speaking-recycling.svg",
  "/access-practice-lab/pictures/35-speaking-seed-steps.svg",
  "/access-practice-lab/pictures/35-speaking-shapes-quilt.svg",
  "/access-practice-lab/pictures/35-speaking-weather.svg",
  "/access-practice-lab/pictures/35-writing-bird-feeder.svg",
  "/access-practice-lab/pictures/35-writing-class-pet.svg",
  "/access-practice-lab/pictures/35-writing-cleanup.svg",
  "/access-practice-lab/pictures/35-writing-field-trip-choice.svg",
  "/access-practice-lab/pictures/35-writing-lost-backpack.svg",
  "/access-practice-lab/pictures/35-writing-market.svg",
  "/access-practice-lab/pictures/35-writing-park.svg",
  "/access-practice-lab/pictures/35-writing-rainy-day.svg",
  "/access-practice-lab/pictures/35-writing-sandwich-steps.svg",
  "/access-practice-lab/pictures/35-writing-seed-story.svg",
  "/access-practice-lab/pictures/35-writing-shapes.svg",
  "/access-practice-lab/pictures/35-writing-water-cycle.svg",
  "/access-practice-lab/pictures/35t-bee-flower.svg",
  "/access-practice-lab/pictures/35t-community-street.svg",
  "/access-practice-lab/pictures/35t-farm.svg",
  "/access-practice-lab/pictures/35t-garden-seq.svg",
  "/access-practice-lab/pictures/35t-helpers.svg",
  "/access-practice-lab/pictures/35t-kite-seq.svg",
  "/access-practice-lab/pictures/35t-lunchroom.svg",
  "/access-practice-lab/pictures/35t-morning-seq.svg",
  "/access-practice-lab/pictures/35t-park-choice.svg",
  "/access-practice-lab/pictures/35t-park-cleanup.svg",
  "/access-practice-lab/pictures/35t-puppy-seq.svg",
  "/access-practice-lab/pictures/35t-rain-seq.svg",
  "/access-practice-lab/pictures/35t-reading-buddies.svg",
  "/access-practice-lab/pictures/35t-seasons-tree.svg",
  "/access-practice-lab/pictures/35t-tortilla-seq.svg",
  "/access-practice-lab/pictures/68-classroom-lesson.svg",
  "/access-practice-lab/pictures/68-classroom.svg",
  "/access-practice-lab/pictures/68-colonists.svg",
  "/access-practice-lab/pictures/68-dog-and-cat.svg",
  "/access-practice-lab/pictures/68-jamestown-artifacts.svg",
  "/access-practice-lab/pictures/68-lunch-tray.svg",
  "/access-practice-lab/pictures/68-park.svg",
  "/access-practice-lab/pictures/68-plant-needs.svg",
  "/access-practice-lab/pictures/68-school-hallway.svg",
  "/access-practice-lab/pictures/68-school-street.svg",
  "/access-practice-lab/pictures/68-science-class.svg",
  "/access-practice-lab/pictures/68-science-lab.svg",
  "/access-practice-lab/pictures/68-student-raises-hand.svg",
  "/access-practice-lab/pictures/68-triangle-and-square.svg",
  "/access-practice-lab/pictures/68-two-classrooms.svg",
  "/access-practice-lab/pictures/68-water-cycle.svg",
  "/access-practice-lab/pictures/68c-hillside-erosion.svg",
  "/access-practice-lab/pictures/68c-seasons.svg",
  "/access-practice-lab/pictures/68c-water-filter.svg",
  "/access-practice-lab/pictures/lab-icons.svg",
  "/access-practice-lab/pictures/lab-investigation.svg",
  "/access-practice-lab/pictures/shape-circle.svg",
  "/access-practice-lab/pictures/shape-rectangle.svg",
  "/access-practice-lab/pictures/shape-triangle.svg",
  "/access-practice-lab/pictures/worlds/conversation-quest.svg",
  "/access-practice-lab/pictures/worlds/evidence-city.svg",
  "/access-practice-lab/pictures/worlds/signal-station.svg",
  "/access-practice-lab/pictures/worlds/storyworks.svg",
];
/* build:end */

const SCOPE = "/access-practice-lab/";
const SHELL = `${SCOPE}app-shell`;
const PREFIX = "ewl-access-";
const CACHE = `${PREFIX}${BUILD_HASH}`;
const FRESH_MS = 3500;
// Shared chrome the lab loads from outside its own folder; worth having offline so the page is not unstyled.
const OUTSIDE = [/^\/assets\/mobile-access\.css$/, /^\/shared\/save-resume\//];

/** How a request is served: "shell" | "immutable" | "fresh" | "network". Pure, so it can be tested. */
function route(request, url, origin) {
  if (request.method !== "GET" || url.origin !== origin) return "network";
  if (request.headers.get("range")) return "network";
  const path = url.pathname;
  if (path.startsWith("/api/")) return "network";
  if (path === `${SCOPE}config.json` || path === `${SCOPE}sw.js`) return "network";
  const inScope = path.startsWith(SCOPE);
  if (request.mode === "navigate")
    return inScope && !path.startsWith(`${SCOPE}printables/`) && !/\.[a-z0-9]+$/i.test(path)
      ? "shell"
      : "network";
  if (inScope) return url.searchParams.has("v") && /\.(js|css)$/.test(path) ? "immutable" : "fresh";
  return OUTSIDE.some((re) => re.test(path)) ? "fresh" : "network";
}

const isHtml = (response) => /text\/html/i.test(response.headers.get("content-type") || "");

// The copy is taken before this returns: once the page starts reading the response its body cannot be cloned.
function put(cacheName, key, response) {
  if (!response || !response.ok) return Promise.resolve();
  const copy = response.clone();
  return caches
    .open(cacheName)
    .then((cache) => cache.put(key, copy))
    .catch(() => {
      /* storage full or blocked: the network copy still works */
    });
}

function withTimeout(promise, ms, fallback) {
  return Promise.race([
    promise,
    new Promise((resolve) => setTimeout(() => resolve(fallback()), ms)),
  ]);
}

async function shellResponse(request) {
  const network = fetch(request).then((response) => {
    if (response.ok && isHtml(response)) put(CACHE, SHELL, response);
    return response;
  });
  const saved = await caches.match(SHELL);
  if (!saved) return network;
  return withTimeout(
    network.then((r) => (r.status >= 500 ? saved : r)).catch(() => saved),
    FRESH_MS,
    () => saved,
  );
}

async function immutableResponse(request) {
  const saved = await caches.match(request);
  if (saved) return saved;
  const response = await fetch(request);
  put(CACHE, request, response);
  return response;
}

async function freshResponse(request) {
  const network = fetch(request).then((response) => {
    put(CACHE, request, response);
    return response;
  });
  const saved = await caches.match(request);
  if (!saved) return network;
  return withTimeout(
    network.then((r) => (r.status >= 500 ? saved : r)).catch(() => saved),
    FRESH_MS,
    () => saved,
  );
}

async function precache() {
  const cache = await caches.open(CACHE);
  // Required: the shell and every module and stylesheet it names. If any fails the install fails and retries later.
  await cache.put(SHELL, await fetchOk(new Request(SHELL, { cache: "reload" })));
  await Promise.all(
    PRECACHE_CORE.map(async (url) => cache.put(url, await fetchOk(new Request(url)))),
  );
  // Best effort: content and pictures. A miss here is filled in by the first online visit.
  for (let i = 0; i < PRECACHE_MORE.length; i += 8)
    await Promise.all(
      PRECACHE_MORE.slice(i, i + 8).map(async (url) => {
        try {
          await cache.put(url, await fetchOk(new Request(url, { cache: "reload" })));
        } catch {
          /* skip */
        }
      }),
    );
}

async function fetchOk(request) {
  const response = await fetch(request);
  if (!response.ok) throw new Error(`${response.status} ${request.url}`);
  return response;
}

async function dropOldCaches() {
  const keys = (await caches.keys()).filter((key) => key.startsWith(PREFIX) && key !== CACHE);
  // Keep the newest previous build for tabs opened before this deploy; caches.keys() is in creation order.
  const stale = keys.slice(0, Math.max(0, keys.length - 1));
  await Promise.all(stale.map((key) => caches.delete(key)));
}

if (typeof self !== "undefined" && typeof self.addEventListener === "function") {
  self.addEventListener("install", (event) => {
    event.waitUntil(precache().then(() => self.skipWaiting()));
  });
  self.addEventListener("activate", (event) => {
    event.waitUntil(dropOldCaches().then(() => self.clients.claim()));
  });
  self.addEventListener("fetch", (event) => {
    const kind = route(event.request, new URL(event.request.url), self.location.origin);
    if (kind === "network") return;
    event.respondWith(
      kind === "shell"
        ? shellResponse(event.request)
        : kind === "immutable"
          ? immutableResponse(event.request)
          : freshResponse(event.request),
    );
  });
}

if (typeof module !== "undefined")
  module.exports = {
    route,
    shellResponse,
    immutableResponse,
    freshResponse,
    precache,
    dropOldCaches,
  };
