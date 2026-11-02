// Loads the authored item bank and the standards table in the browser. Files are fetched on demand, one grade at a time,
// and cached for the page visit. A missing or unreadable file yields an empty list rather than an error screen: the
// lab's other features do not depend on the bank.
const cache = new Map();
// Built from the module URL as a string on purpose: Vite rewrites `new URL("literal", import.meta.url)` as an asset
// reference, which would resolve a folder wrongly in dev and try to bundle it in a build.
const moduleUrl = import.meta.url;
const here = new URL(`${moduleUrl.slice(0, moduleUrl.lastIndexOf("/e8/"))}/content/`);

async function getJson(path) {
  if (cache.has(path)) return cache.get(path);
  const promise = fetch(new URL(path, here))
    .then((r) => (r.ok ? r.json() : null))
    .catch(() => null);
  cache.set(path, promise);
  return promise;
}

export async function loadGradeBank(grade) {
  const list = await getJson(`items/grade-${Number(grade)}.json`);
  return Array.isArray(list) ? list : [];
}
export async function loadBank(grades = [1, 2, 3, 4, 5, 6, 7, 8]) {
  return (await Promise.all(grades.map(loadGradeBank))).flat();
}
export async function loadStandards() {
  const table = await getJson("ccss-k8.json");
  return table?.standards || [];
}
