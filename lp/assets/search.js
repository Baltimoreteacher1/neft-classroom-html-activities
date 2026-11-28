// Client-side search over lp/assets/search-index.json (built with the site). Filters: type, grades, skill, content
// area, proficiency level and Key Language Use. The query lives in the URL (?q=) so results can be shared.
import { $, escapeHtml, tr } from "./lib.js";
import { searchScore, tokenize } from "./search-core.js";

const form = $("[data-search-form]");
const q = $("#q");
const results = $("[data-search-results]");
const count = $("[data-search-count]");
const F = { kind: $("#f-kind"), g: $("#f-cluster"), dom: $("#f-domain"), a: $("#f-area"), pl: $("#f-level"), klu: $("#f-klu") };
const KIND = { practice: "Practice", tool: "Teacher tool", content: "Content + Language", guide: "ACCESS Guide" };
let index = [];

function render() {
  const tokens = tokenize(q.value);
  const hits = index
    .map((e) => ({ e, s: searchScore(e, tokens, KIND[e.k]) }))
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
