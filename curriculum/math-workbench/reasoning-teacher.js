/* Reasoning Studio teacher view: Teacher Mode gate, class dashboard built from
 * imported student files, anonymous exemplar pairs, and class-level settings.
 * HTML only; reasoning-studio.js wires the handlers. */
(function (root) {
  "use strict";

  const D = root.MWReasoningData;
  const A = root.MWRAnalyzer;
  const I = root.MWRI18n;
  const S = root.MWRStore;
  const TAGS = root.MWReasoningTags || {};
  const TEACHER_KEY = "nt-teacher-mode";

  /* Same sticky flag engine/core/teacher-mode.js reads. The Studio never asks
   * for a PIN itself, so there is one place a teacher unlocks. */
  function unlocked() {
    try {
      const params = new URLSearchParams(location.search);
      if (params.get("teacher") === "0" || params.get("student") === "1") return false;
      return localStorage.getItem(TEACHER_KEY) === "1";
    } catch (_) {
      return false;
    }
  }

  const attr = (v) => A.escapeHtml(String(v == null ? "" : v));

  function locked(c) {
    return (
      `<section class="mwr-panel"><h3>${c.esc(c.t("tv.lockedH"))}</h3><p>${c.esc(c.t("tv.lockedBody"))}</p>` +
      `<ol class="mwr-help"><li>${c.esc(c.t("tv.lock1"))}</li><li>${c.esc(c.t("tv.lock2"))}</li><li>${c.esc(c.t("tv.lock3"))}</li></ol>` +
      `<div class="mwr-btn-row"><button type="button" class="mwr-btn primary" data-action="teacher-recheck" data-keep="recheck">${c.esc(c.t("tv.recheck"))}</button></div><p class="mwr-live" role="status" aria-live="polite"></p></section>`
    );
  }

  function bars(c, counts, labelOf, total) {
    const entries = Object.entries(counts).sort((x, y) => y[1] - x[1]);
    if (!entries.length) return `<p class="mwr-muted">${c.esc(c.t("tv.none"))}</p>`;
    return `<ul class="mwr-bars">${entries.map(([key, n]) => `<li><span class="mwr-bar-label">${c.esc(labelOf(key))}</span><span class="mwr-bar"><span style="width:${Math.round((n / Math.max(1, total)) * 100)}%"></span></span><b>${n}</b></li>`).join("")}</ul>`;
  }

  function pair(exemplars, index) {
    const sorted = [...exemplars].sort((x, y) => (S.RANK[y.status] || 0) - (S.RANK[x.status] || 0));
    if (sorted.length < 2) return null;
    const high = sorted.slice(0, Math.ceil(sorted.length / 2));
    const low = sorted.slice(Math.ceil(sorted.length / 2)).reverse();
    const a = high[index % high.length];
    const b = low[index % low.length];
    if (!a || !b) return null;
    return index % 2 === 0 ? [a, b] : [b, a];
  }

  function dashboard(c, agg) {
    const t = c.t;
    const dims = S.DIMS.map(
      (d) =>
        `<li>${c.esc(t(`dim.${d}`))}: <b>${agg.total ? Math.round((agg.dims[d] / agg.total) * 100) : 0}%</b></li>`,
    ).join("");
    const tags = Object.entries(agg.tags)
      .sort((x, y) => y[1] - x[1])
      .map(([tag, n]) => {
        const info = TAGS[tag];
        return `<li><b>${n}</b> ${c.esc(info ? (c.lang === "es" ? info.labelEs : info.label) : tag)}${info ? `<small> ${c.esc(info.watchFor)}</small>` : ""}</li>`;
      })
      .join("");
    const smp = Object.entries(agg.smp)
      .map(([id, n]) => `<li class="mwr-badge">${c.esc(id)} · ${n}</li>`)
      .join("");
    const p = pair(agg.exemplars, c.state.galleryIndex);
    const gallery = p
      ? `<div class="mwr-grid">${p
          .map(
            (e, i) =>
              `<blockquote class="mwr-gallery"><b>${c.esc(t("tv.explanation"))} ${"AB"[i]}</b><p dir="auto">${c.esc(e.text)}</p>${c.state.galleryReveal ? `<small>${c.esc(I.statusLabel(c.lang, e.status))}</small>` : ""}</blockquote>`,
          )
          .join(
            "",
          )}</div><p class="mwr-notice">${c.esc(t("tv.galleryPrompt"))}</p><div class="mwr-btn-row"><button type="button" class="mwr-btn" data-action="gallery-next" data-keep="gnext">${c.esc(t("tv.nextPair"))}</button><button type="button" class="mwr-btn" data-action="gallery-reveal" aria-pressed="${c.state.galleryReveal}" data-keep="greveal">${c.esc(t("tv.reveal"))}</button></div><p class="mwr-help">${c.esc(t("tv.galleryWarn"))}</p>`
      : `<p class="mwr-muted">${c.esc(t("tv.needMore"))}</p>`;
    return (
      `<div class="mwr-card"><h4>${c.esc(t("tv.signals"))}</h4>${bars(c, agg.byStatus, (k) => I.statusLabel(c.lang, k), agg.total)}</div>` +
      `<div class="mwr-grid"><div class="mwr-card"><h4>${c.esc(t("tv.dims"))}</h4><ul class="mwr-dims">${dims}</ul></div>` +
      `<div class="mwr-card"><h4>${c.esc(t("tv.growth"))}</h4><p>${c.esc(t("tv.improved", { n: agg.growth.improved }))}<br>${c.esc(t("tv.same", { n: agg.growth.same }))}<br>${c.esc(t("tv.lower", { n: agg.growth.lower }))}</p>` +
      `<p>${c.esc(t("tv.confUp", { up: agg.confidence.up, same: agg.confidence.same, down: agg.confidence.down }))}</p></div></div>` +
      `<div class="mwr-card"><h4>${c.esc(t("tv.skills"))}</h4>${bars(c, agg.bySkill, (k) => (D.SKILLS[k] ? D.SKILLS[k].label[c.lang] || D.SKILLS[k].label.en : k), agg.total)}</div>` +
      (tags
        ? `<div class="mwr-card"><h4>${c.esc(t("tv.patterns"))}</h4><ul class="mwr-checks">${tags}</ul></div>`
        : "") +
      (smp
        ? `<div class="mwr-card"><h4>${c.esc(t("tv.smp"))}</h4><ul class="mwr-badges">${smp}</ul></div>`
        : "") +
      `<div class="mwr-card"><h4>${c.esc(t("tv.gallery"))}</h4>${gallery}</div>`
    );
  }

  function render(c) {
    if (!c.teacherUnlocked) return locked(c);
    const t = c.t;
    const local = c.sessions;
    const list = [...c.state.imported, ...(c.state.includeLocal ? local : [])];
    const agg = S.aggregate(list);
    const retention = [0, 30, 90, 180]
      .map(
        (d) =>
          `<option value="${d}"${S.retentionDays() === d ? " selected" : ""}>${c.esc(d ? t("tv.days", { n: d }) : t("tv.never"))}</option>`,
      )
      .join("");
    const sessionsList = local
      .map(
        (s) =>
          `<li><span>${c.esc(D.SKILLS[s.skill] ? D.SKILLS[s.skill].label[c.lang] || D.SKILLS[s.skill].label.en : s.skill)} · ${c.esc(String(s.at || "").slice(0, 10))} · ${c.esc(I.statusLabel(c.lang, s.analysis && s.analysis.status))}</span> <button type="button" class="mwr-btn small" data-action="delete-local" data-id="${attr(s.id)}" data-keep="dl-${attr(s.id)}">${c.esc(t("ev.delete"))}</button></li>`,
      )
      .join("");
    return (
      `<section class="mwr-panel"><h3>${c.esc(t("tv.h"))}</h3><p class="mwr-muted">${c.esc(t("tv.lead"))}</p>` +
      `<div class="mwr-card"><h4>${c.esc(t("tv.sources"))}</h4><p>${c.esc(t("tv.sourceCount", { local: local.length, imported: c.state.imported.length }))}</p>` +
      `<label class="mwr-inline"><input type="checkbox" data-field="includeLocal"${c.state.includeLocal ? " checked" : ""}> ${c.esc(t("tv.includeLocal"))}</label>` +
      `<input type="file" id="mwrImport" accept="application/json,.json" multiple hidden>` +
      `<div class="mwr-btn-row"><button type="button" class="mwr-btn primary" data-action="import" data-keep="import">${c.esc(t("tv.import"))}</button>${c.state.imported.length ? `<button type="button" class="mwr-btn" data-action="clear-import" data-keep="clearimp">${c.esc(t("tv.clearImport"))}</button>` : ""}</div>` +
      `<p class="mwr-live" role="status" aria-live="polite">${c.esc(c.state.importNote)}</p></div>` +
      (agg.total
        ? dashboard(c, agg)
        : `<div class="mwr-card"><p class="mwr-muted">${c.esc(t("tv.empty"))}</p></div>`) +
      `<div class="mwr-card"><h4>${c.esc(t("tv.coachH"))}</h4><p>${c.esc(t("tv.coachBody"))}</p>` +
      `<div class="mwr-btn-row"><button type="button" class="mwr-btn" data-action="coach-setting" aria-pressed="${c.coachOn}" data-keep="coachset">${c.esc(t("tv.coachBtn", { state: c.coachOn ? t("tv.on") : t("tv.off") }))}</button></div>` +
      `<label class="mwr-label">${c.esc(t("tv.avoid"))}<small>${c.esc(t("tv.avoidHint"))}</small><input class="mwr-input" type="text" inputmode="decimal" data-field="avoidNumbers" value="${attr(S.getPref("avoidNumbers", ""))}"></label></div>` +
      `<div class="mwr-card"><h4>${c.esc(t("tv.retention"))}</h4><label class="mwr-label">${c.esc(t("tv.retentionLabel"))}<select class="mwr-select" data-field="retentionDays">${retention}</select></label>` +
      `<div class="mwr-btn-row"><button type="button" class="mwr-btn primary" data-action="export-research" data-keep="exp1">${c.esc(t("tv.exportJson"))}</button><button type="button" class="mwr-btn" data-action="export-csv" data-keep="exp2">${c.esc(t("tv.exportCsv"))}</button>` +
      `<button type="button" class="mwr-btn" data-action="clear-local" data-keep="clr">${c.esc(t("tv.clear"))}</button></div><ul class="mwr-own">${sessionsList}</ul></div></section>`
    );
  }

  const stamp = () => new Date().toISOString().slice(0, 10);

  /* Reads several student files at once. Bad or oversized files are counted, not fatal. */
  async function importFiles(files, host) {
    const state = host.state;
    let ok = 0;
    let bad = 0;
    let count = 0;
    for (const file of [...files].slice(0, 60)) {
      if (file.size > 2000000) {
        bad++;
        continue;
      }
      try {
        const result = S.parseImport(JSON.parse(await file.text()));
        if (result.error) {
          bad++;
          continue;
        }
        state.imported.push(...result.sessions);
        ok++;
        count += result.sessions.length;
      } catch (_) {
        bad++;
      }
    }
    state.imported = state.imported.slice(-600);
    state.importNote = host.t("tv.imported", { files: ok, n: count, bad });
    host.render({ keepFocus: true });
  }

  /* Teacher-view buttons. Returns true when the action belonged to this view. */
  function handleAction(action, el, host) {
    const T = root.MWRTools;
    const state = host.state;
    switch (action) {
      case "import":
        host.body().querySelector("#mwrImport")?.click();
        return true;
      case "clear-import":
        state.imported = [];
        state.importNote = "";
        break;
      case "coach-setting":
        S.setCoach(!S.coachEnabled());
        break;
      case "export-research":
        T.download(`math-workbench-reasoning-research-${stamp()}.json`, JSON.stringify(S.researchExport(S.loadSessions()), null, 2), "application/json");
        return true;
      case "export-csv":
        T.download(`math-workbench-reasoning-${stamp()}.csv`, S.toCsv(S.loadSessions()), "text/csv");
        return true;
      case "delete-local":
        S.deleteSession(el.dataset.id);
        host.render({ keepFocus: false });
        return true;
      case "clear-local":
        if (!root.confirm(host.t("tv.confirmClear"))) return true;
        S.clearSessions();
        host.clearOwn();
        host.render({ keepFocus: false });
        return true;
      case "gallery-next":
        state.galleryIndex++;
        break;
      case "gallery-reveal":
        state.galleryReveal = !state.galleryReveal;
        break;
      default:
        return false;
    }
    host.render({ keepFocus: true });
    return true;
  }

  /* Teacher-view fields. Returns true when handled. */
  function handleInput(key, el, host) {
    switch (key) {
      case "includeLocal":
        host.state.includeLocal = el.checked;
        break;
      case "avoidNumbers":
        S.setPref("avoidNumbers", el.value.slice(0, 80));
        return true;
      case "retentionDays":
        S.setPref("retentionDays", Number(el.value));
        S.loadSessions();
        break;
      default:
        return false;
    }
    host.render({ keepFocus: true });
    return true;
  }

  root.MWRTeacher = Object.freeze({ unlocked, render, pair, importFiles, handleAction, handleInput });
})(window);
