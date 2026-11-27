// Client-side search over lp/assets/search-index.json (built with the site). Filters: type, grades, skill, content
// area, proficiency level and Key Language Use. The query lives in the URL (?q=) so results can be shared.
import { $, escapeHtml, tr } from "./lib.js";

const form = $("[data-search-form]");
const q = $("#q");
const results = $("[data-search-results]");
const count = $("[data-search-count]");
const F = { kind: $("#f-kind"), g: $("#f-cluster"), dom: $("#f-domain"), a: $("#f-area"), pl: $("#f-level"), klu: $("#f-klu") };
const KIND = { practice: "Practice", tool: "Teacher tool", content: "Content + Language", guide: "ACCESS Guide" };
let index = [];

const norm = (s) =>
  String(s || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[–—]/g, "-");
function score(entry, tokens) {
  const title = norm(entry.t);
  const hay = `${title} ${norm(entry.d)} ${norm(entry.g)} ${norm(entry.dom)} ${norm(entry.a)} ${norm(entry.klu)} ${norm(KIND[entry.k])}`;
  let s = 0;
  for (const tok of tokens) {
    if (!hay.includes(tok)) return 0;
    s += title.includes(tok) ? 3 : 1;
  }
  return s || 1;
}
function render() {
  const tokens = norm(q.value)
    .split(/[\s,]+/)
    .filter((x) => x.length > 1)
    .map((x) => x.replace(/^grades?$/, "").replace(/^(\d)-(\d)$/, "grades-$1-$2"))
    .filter(Boolean);
  const hits = index
    .map((e) => ({ e, s: score(e, tokens) }))
    .filter(({ e, s }) => s > 0 && (!F.kind.value || e.k === F.kind.value) && (!F.g.value || e.g === F.g.value) && (!F.dom.value || e.dom === F.dom.value) && (!F.a.value || e.a === F.a.value) && (!F.pl.value || (e.pl || []).includes(F.pl.value)) && (!F.klu.value || e.klu === F.klu.value))
    .sort((a, b) => b.s - a.s)
    .slice(0, 60);
  const any = q.value.trim() || Object.values(F).some((s) => s.value);
  count.textContent = any ? `${hits.length} ${tr("search.results", "results")}` : "";
  results.innerHTML = !any ? "" : hits.length
    ? hits.map(({ e }) => `<li><a href="${e.u}">${escapeHtml(e.t)}</a> <span class="chip">${KIND[e.k]}</span><p class="muted">${escapeHtml(e.d)}</p></li>`).join("")
    : `<li class="empty">${escapeHtml(tr("search.none", "No matches. Try fewer words."))}</li>`;
  const params = new URLSearchParams();
  if (q.value.trim()) params.set("q", q.value.trim());
  history.replaceState(null, "", params.toString() ? `?${params}` : location.pathname);
}
form.addEventListener("submit", (e) => e.preventDefault());
form.addEventListener("input", render);
form.addEventListener("change", render);
(async () => {
  try {
    index = await (await fetch("/lp/assets/search-index.json")).json();
  } catch {
    count.textContent = "Search is not available right now.";
    return;
  }
  q.value = new URLSearchParams(location.search).get("q") || "";
  render();
  q.focus();
})();
