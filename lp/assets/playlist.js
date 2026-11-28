// Student side of a practice playlist. The playlist (title, note, set ids) lives in the link after #p=; progress is
// read from this device only (done:<id>, pos:<id>). Nothing is sent anywhere.
import { $, decodeShare, escapeHtml, readJson, store, tr, uiLang } from "./lib.js";

const index = readJson("sets-index") || [];
const byId = new Map(index.map((s) => [s.id, s]));
const fmt = (key, fallback, vars) =>
  tr(key, fallback).replace(/\{(\w+)\}/g, (_, k) => (k in vars ? String(vars[k]) : ""));
const dateText = (ms) =>
  new Date(ms).toLocaleDateString(uiLang(), { month: "short", day: "numeric" });

let playlist = null;

function status(s) {
  const done = store.get(`done:${s.id}`);
  if (done) return { state: "done", done };
  const pos = store.get(`pos:${s.id}`);
  if (pos != null && Number(pos) > 0) return { state: "started", pos: Math.min(Number(pos) + 1, s.n) };
  return { state: "new" };
}

function render() {
  if (!playlist) return;
  const sets = playlist.s.map((id) => byId.get(id)).filter(Boolean);
  const states = sets.map(status);
  const doneCount = states.filter((x) => x.state === "done").length;

  $("[data-pl-count]").textContent = fmt("playlist.count", "{done} of {total} sets done", {
    done: doneCount,
    total: sets.length,
  });
  const pct = sets.length ? Math.round((doneCount / sets.length) * 100) : 0;
  const bar = $("[data-pl-progress] [role=progressbar]");
  bar.setAttribute("aria-valuenow", String(pct));
  bar.setAttribute("aria-label", tr("playlist.progress", "Playlist progress"));
  $("[data-pl-bar]").style.width = `${pct}%`;

  const nextAt = states.findIndex((x) => x.state !== "done");
  const next = $("[data-pl-next]");
  const label = $("[data-pl-next-label]");
  if (nextAt === -1) {
    next.href = sets[0]?.u || "/practice/";
    label.textContent = tr("playlist.review", "Practice one again");
    next.classList.add("secondary");
  } else {
    next.href = sets[nextAt].u;
    label.textContent = doneCount === 0 && states[nextAt].state === "new" ? tr("playlist.start", "Start") : tr("playlist.next", "Next set");
    next.classList.remove("secondary");
  }

  const list = $("[data-pl-list]");
  list.innerHTML = sets
    .map((s, i) => {
      const st = states[i];
      let detail;
      if (st.state === "done") {
        const score = st.done.total
          ? ` · ${fmt("playlist.firstTry", "{right} of {total} right on the first try", st.done)}`
          : "";
        detail = `<span class="chip done-chip">${escapeHtml(tr("playlist.done", "Done"))} ✓</span> <span class="muted">${escapeHtml(dateText(st.done.at))}${escapeHtml(score)}</span>`;
      } else if (st.state === "started") {
        detail = `<span class="chip amber">${escapeHtml(fmt("playlist.inProgress", "Started: question {n} of {total}", { n: st.pos, total: s.n }))}</span>`;
      } else {
        detail = `<span class="chip">${escapeHtml(tr("playlist.notStarted", "Not started"))}</span>`;
      }
      const current = i === nextAt ? ' aria-current="step"' : "";
      return `<li class="card pl-item${st.state === "done" ? " is-done" : ""}"${current}><a class="pl-link" href="${escapeHtml(s.u)}">${escapeHtml(s.t)}</a><span class="muted">${escapeHtml(s.cl)} · ${escapeHtml(s.dl)} · ${s.m} min</span><span class="pl-status">${detail}</span></li>`;
    })
    .join("");
  if (nextAt === -1) {
    const msg = document.createElement("li");
    msg.className = "note pl-finished";
    msg.textContent = tr("playlist.allDone", "You finished the whole playlist!");
    list.append(msg);
  }
}

(async () => {
  const code = /#p=([A-Za-z0-9_-]+)/.exec(location.hash)?.[1];
  const decoded = code ? await decodeShare(code) : null;
  $("[data-pl-loading]").hidden = true;
  const ids = Array.isArray(decoded?.s) ? decoded.s.filter((id) => byId.has(id)).slice(0, 12) : [];
  if (!ids.length) {
    $("[data-pl-missing]").hidden = false;
    return;
  }
  playlist = { t: String(decoded.t || "").slice(0, 80), n: String(decoded.n || "").slice(0, 240), s: ids };
  if (playlist.t) {
    $("[data-pl-title]").textContent = playlist.t;
    document.title = `${playlist.t} · The Language Page`;
  }
  $("[data-pl-note]").textContent = playlist.n;
  $("[data-pl-progress]").hidden = false;
  $("[data-pl-actions]").hidden = false;
  // The practice page reads this to offer "Next in your playlist" when a set is finished.
  store.set("playlist", {
    code,
    t: playlist.t,
    items: ids.map((id) => ({ id, t: byId.get(id).t, u: byId.get(id).u })),
  });
  render();
  // Coming back from a set (back button or bfcache) or switching the interface language refreshes the list.
  window.addEventListener("pageshow", render);
  document.addEventListener("visibilitychange", () => document.visibilityState === "visible" && render());
  document.addEventListener("lp:lang", render);
})();
