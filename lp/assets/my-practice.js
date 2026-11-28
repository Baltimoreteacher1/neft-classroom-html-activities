// "My practice": every set this device has finished or started, from local storage only. Nothing is sent anywhere.
import { $, escapeHtml, readJson, store, toast, tr, uiLang } from "./lib.js";

const index = readJson("sets-index") || [];
const fmt = (key, fallback, vars) =>
  tr(key, fallback).replace(/\{(\w+)\}/g, (_, k) => (k in vars ? String(vars[k]) : ""));
const dateText = (ms) => new Date(ms).toLocaleDateString(uiLang(), { year: "numeric", month: "short", day: "numeric" });

function rows() {
  return index
    .map((s) => ({ s, done: store.get(`done:${s.id}`), pos: store.get(`pos:${s.id}`) }))
    .filter((r) => r.done || (r.pos != null && Number(r.pos) > 0));
}

function render() {
  const all = rows();
  const finished = all.filter((r) => r.done);
  const any = all.length > 0;
  $("[data-mine-empty]").hidden = any;
  $("[data-mine-stats]").hidden = !any;
  $("[data-mine-actions]").hidden = !any;
  const scored = finished.filter((r) => r.done.total);
  $("[data-mine-sets]").textContent = String(finished.length);
  $("[data-mine-right]").textContent = scored.length
    ? `${scored.reduce((n, r) => n + r.done.right, 0)} / ${scored.reduce((n, r) => n + r.done.total, 0)}`
    : "—";
  $("[data-mine-minutes]").textContent = String(finished.reduce((n, r) => n + r.s.m, 0));

  // One table per grade band, in the site's order; finished sets first, newest first.
  const groups = new Map();
  for (const r of all) {
    if (!groups.has(r.s.cl)) groups.set(r.s.cl, []);
    groups.get(r.s.cl).push(r);
  }
  const head = `<tr><th scope="col">${escapeHtml(tr("mine.colSet", "Practice set"))}</th><th scope="col">${escapeHtml(tr("mine.colResult", "Result"))}</th><th scope="col">${escapeHtml(tr("mine.colDate", "Finished"))}</th></tr>`;
  $("[data-mine-list]").innerHTML = [...groups.entries()]
    .map(([label, list]) => {
      list.sort((a, b) => (b.done?.at || 0) - (a.done?.at || 0));
      const body = list
        .map(({ s, done, pos }) => {
          const result = done
            ? done.total
              ? fmt("playlist.firstTry", "{right} of {total} right on the first try", done)
              : `${tr("playlist.done", "Done")} ✓`
            : fmt("playlist.inProgress", "Started: question {n} of {total}", {
                n: Math.min(Number(pos) + 1, s.n),
                total: s.n,
              });
          return `<tr><th scope="row"><a href="${escapeHtml(s.u)}">${escapeHtml(s.t)}</a><br><span class="muted">${escapeHtml(s.dl)} · ${s.m} min</span></th><td>${escapeHtml(result)}</td><td>${done ? escapeHtml(dateText(done.at)) : escapeHtml(tr("mine.started", "Started, not finished"))}</td></tr>`;
        })
        .join("");
      return `<section class="section"><h2 class="h3">${escapeHtml(label)}</h2><div class="table-wrap"><table class="mine-table"><thead>${head}</thead><tbody>${body}</tbody></table></div></section>`;
    })
    .join("");
}

const clear = $("[data-mine-clear]");
const confirm = $("[data-mine-confirm]");
clear.addEventListener("click", () => {
  // Two steps on the page itself, no browser dialog: the second button does the clearing.
  confirm.hidden = false;
  confirm.focus();
});
confirm.addEventListener("click", () => {
  for (const s of index) {
    store.remove(`done:${s.id}`);
    store.remove(`pos:${s.id}`);
  }
  store.remove("playlist");
  confirm.hidden = true;
  render();
  toast(tr("mine.cleared", "Your progress was cleared from this device."));
  $("#main").focus();
});

render();
window.addEventListener("pageshow", render);
document.addEventListener("lp:lang", render);
