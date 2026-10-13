/* Reasoning Studio step panels: pure functions from a context to HTML.
 * ctx = { state, lang, t, esc, skill, digest, api, store, tools, own, coachOn }.
 * No event wiring here; reasoning-studio.js owns every handler. */
(function (root) {
  "use strict";

  const D = root.MWReasoningData;
  const A = root.MWRAnalyzer;
  const I = root.MWRI18n;
  const EX = root.MWReasoningExemplars;
  const TAGS = root.MWReasoningTags || {};

  const attr = (v) => A.escapeHtml(String(v == null ? "" : v));

  function option(value, label, selected) {
    return `<option value="${attr(value)}"${selected ? " selected" : ""}>${A.escapeHtml(label)}</option>`;
  }

  function button(c, action, labelKey, cls, extra) {
    return `<button type="button" class="mwr-btn${cls ? ` ${cls}` : ""}" data-action="${action}"${extra || ""}>${c.esc(c.t(labelKey))}</button>`;
  }

  function micButton(c, field) {
    if (!c.dictation) return "";
    const on = c.state.dictating === field;
    return `<button type="button" class="mwr-btn mwr-mic" data-action="dictate" data-field-target="${field}" aria-pressed="${on}">${c.esc(c.t(on ? "dictate.stop" : "dictate.start"))}</button>`;
  }

  function confidenceOptions(c, selected) {
    return ["1", "2", "3", "4"].map((v) => option(v, c.t(`conf.${v}`), v === selected)).join("");
  }

  /* ---------------- first run ---------------- */
  function tour(c) {
    if (c.store.getPref("tourSeen", false)) return "";
    const steps = [1, 2, 3, 4, 5].map((n) => `<li>${c.esc(c.t(`tour.${n}`))}</li>`).join("");
    return `<aside class="mwr-card mwr-tour" aria-label="${attr(c.t("tour.title"))}"><h4>${c.esc(c.t("tour.title"))}</h4><ol>${steps}</ol><p class="mwr-muted">${c.esc(c.t("tour.privacy"))}</p>${button(c, "tour-done", "tour.done", "primary", ' data-keep="tour"')}</aside>`;
  }

  /* ---------------- 1 Understand ---------------- */
  function setup(c) {
    const s = c.state;
    const skills = Object.entries(D.SKILLS)
      .map(([id, item]) =>
        option(id, `${item.label[c.lang] || item.label.en} · ${item.standard}`, id === s.skill),
      )
      .join("");
    const levels = [1, 2, 3, 4, 5]
      .map((n) => option(String(n), D.LEVELS[c.lang][n], String(n) === s.level))
      .join("");
    const homes = ["none", ...Object.keys(I.HOME_LANGS)]
      .map((code) =>
        option(
          code,
          code === "none" ? c.t("home.none") : I.HOME_LANGS[code].label,
          code === s.homeLang,
        ),
      )
      .join("");
    const fade = c.fadeNotice
      ? `<p class="mwr-notice" role="status">${c.esc(c.t("fade.notice", { level: s.level }))} ${button(c, "fade-undo", "fade.keep", "", ' data-keep="fade"')}</p>`
      : "";
    const board = c.boardProblem
      ? `<button type="button" class="mwr-btn" data-action="use-board-problem" data-keep="boardproblem">${c.esc(c.t("s1.useBoard"))}</button>`
      : "";
    return (
      `<section class="mwr-panel"><h3>${c.esc(c.t("s1.h"))}</h3><p class="mwr-muted">${c.esc(c.t("s1.lead"))}</p>${tour(c)}${fade}` +
      `<div class="mwr-grid"><label class="mwr-label">${c.esc(c.t("s1.skill"))}<select class="mwr-select" data-field="skill">${skills}</select></label>` +
      `<label class="mwr-label">${c.esc(c.t("s1.level"))}<select class="mwr-select" data-field="level">${levels}</select></label>` +
      `<label class="mwr-label">${c.esc(c.t("s1.language"))}<select class="mwr-select" data-field="language">${option("en", "English", s.language === "en")}${option("es", "Español", s.language === "es")}</select></label>` +
      `<label class="mwr-label">${c.esc(c.t("s1.home"))}<select class="mwr-select" data-field="homeLang">${homes}</select></label>` +
      `<label class="mwr-label">${c.esc(c.t("s1.confBefore"))}<select class="mwr-select" data-field="beforeConfidence">${confidenceOptions(c, s.beforeConfidence)}</select></label></div>` +
      `<p class="mwr-stem" id="mwrStemPreview">${c.esc(D.STEMS[c.lang][s.level])}</p>` +
      `<label class="mwr-label">${c.esc(c.t("s1.problem"))}<textarea class="mwr-textarea" data-field="prompt" data-autofocus dir="auto" placeholder="${attr(c.t("s1.problemPh"))}">${c.esc(s.prompt)}</textarea></label>` +
      `<div class="mwr-btn-row">${button(c, "listen", "s1.read", "", ' data-keep="listen"')}${board}</div><p class="mwr-live" role="status" aria-live="polite"></p></section>`
    );
  }

  /* ---------------- 2 Model ---------------- */
  function linkedLab(c) {
    const { a, b, factor: k } = c.state.linked;
    const words = c.state.skill === "percent" ? "lab.wordsPercent" : "lab.wordsRatio";
    const eq =
      c.state.skill === "percent"
        ? `${a}/${b} = ${a * k}/${b * k}`
        : `${a}:${b} = ${a * k}:${b * k}`;
    const number = (field, key, v) =>
      `<label class="mwr-label">${c.esc(c.t(key))}<input class="mwr-input" type="number" min="1" max="20" data-field="linked.${field}" value="${v}"></label>`;
    return (
      `<div class="mwr-card"><h4>${c.esc(c.t("lab.h"))}</h4><p class="mwr-help">${c.esc(c.t("lab.help"))}</p>` +
      `<div class="mwr-grid">${number("a", c.state.skill === "percent" ? "lab.part" : "lab.first", a)}${number("b", c.state.skill === "percent" ? "lab.whole" : "lab.second", b)}${number("factor", "lab.scale", k)}</div>` +
      `<table class="mwr-linked-table"><caption>${c.esc(c.t("lab.caption"))}</caption><tbody>` +
      `<tr><th scope="row">${c.esc(c.t(c.state.skill === "percent" ? "lab.part" : "lab.first"))}</th><td data-linked="a">${a}</td><td data-linked="a2">${a * 2}</td><td data-linked="ak">${a * k}</td></tr>` +
      `<tr><th scope="row">${c.esc(c.t(c.state.skill === "percent" ? "lab.whole" : "lab.second"))}</th><td data-linked="b">${b}</td><td data-linked="b2">${b * 2}</td><td data-linked="bk">${b * k}</td></tr>` +
      `</tbody></table><p class="mwr-stem" data-linked="equation">${c.esc(eq)}</p><p data-linked="words">${c.esc(c.t(words, { a, b, k }))}</p></div>`
    );
  }

  function model(c) {
    const s = c.state;
    const skill = c.skill;
    const chips = skill.reps
      .map((rep) => {
        const on = s.representations.includes(rep.id);
        const found = c.repFound(rep);
        const badge =
          found == null
            ? ""
            : `<small class="mwr-rep-state">${c.esc(c.t(found ? "s2.onBoard" : "s2.notYet"))}</small>`;
        return `<button type="button" class="mwr-rep" data-action="rep" data-value="${attr(rep.id)}" data-keep="rep-${attr(rep.id)}" aria-pressed="${on}"><span>${c.esc(rep[c.lang] || rep.en)}</span>${badge}</button>`;
      })
      .join("");
    const filled = c.digest.items.filter((i) => i.filled).length;
    return (
      `<section class="mwr-panel"><h3>${c.esc(c.t("s2.h"))}</h3><p>${c.esc(c.t("s2.lead"))}</p><div class="mwr-reps">${chips}</div>` +
      `<p class="mwr-muted" id="mwrBoardLine">${c.esc(c.t("s2.board", { filled, ink: c.digest.strokeCount }))}</p>` +
      `<p class="mwr-help">${c.esc(c.t("s2.truth"))}</p>` +
      (["ratio", "percent"].includes(s.skill) ? linkedLab(c) : "") +
      `<div class="mwr-btn-row">${button(c, "stamp", "s2.stamp", "success", ' data-keep="stamp"')}</div><p class="mwr-live" role="status" aria-live="polite"></p></section>`
    );
  }

  /* ---------------- signal block (shared by Explain and Revise) ---------------- */
  function signal(c, a, text) {
    if (!a) return "";
    const dims = ["claim", "reason", "concept", "model", "link", "units"]
      .map(
        (d) =>
          `<li class="${a.profile[d] ? "is-on" : ""}"><span aria-hidden="true">${a.profile[d] ? "✓" : "○"}</span> ${c.esc(c.t(`dim.${d}`))}<span class="mwr-sr-only"> ${c.esc(c.t(a.profile[d] ? "dim.yes" : "dim.no"))}</span></li>`,
      )
      .join("");
    const checks = a.checks
      .map(
        (k) =>
          `<li class="${k.ok ? "is-on" : "is-flag"}">${c.esc(k.text[c.lang] || k.text.en)}</li>`,
      )
      .join("");
    const tags = a.tags
      .map((tag) => {
        const info = TAGS[tag];
        const label = info ? (c.lang === "es" ? info.labelEs : info.label) : tag;
        return `<li>${c.esc(c.t("sig.mixup"))} <b>${c.esc(label)}</b></li>`;
      })
      .join("");
    const marks = text
      ? `<p class="mwr-compare mwr-marked" dir="auto">${A.markup(text, a.marks)}</p><p class="mwr-legend"><mark class="mwr-mark mwr-mark-reason">${c.esc(c.t("sig.reason"))}</mark> <mark class="mwr-mark mwr-mark-concept">${c.esc(c.t("sig.concept"))}</mark> <mark class="mwr-mark mwr-mark-unit">${c.esc(c.t("sig.unit"))}</mark></p>`
      : "";
    return (
      `<div class="mwr-signal" data-state="${attr(a.status)}"><strong>${c.esc(a.signal)}</strong><span>${c.esc(a.evidence)}</span><b>${c.esc(c.t("sig.next"))} ${c.esc(a.nextMove)}</b>` +
      `<small>${Math.round(Number(a.confidence || 0) * 100)}% ${c.esc(c.t("sig.provisional"))}</small>` +
      `<div class="mwr-btn-row">${button(c, "speak-signal", "sig.listen", "", ' data-keep="speak-signal"')}</div></div>` +
      `<ul class="mwr-dims" aria-label="${attr(c.t("dim.h"))}">${dims}</ul>` +
      (checks
        ? `<ul class="mwr-checks" aria-label="${attr(c.t("sig.checks"))}">${checks}</ul>`
        : "") +
      (tags ? `<ul class="mwr-checks">${tags}</ul>` : "") +
      marks
    );
  }

  function coach(c) {
    const r = c.state.coach;
    if (!r) return "";
    const follow =
      c.state.coachTurn === 1
        ? `<label class="mwr-label">${c.esc(c.t("coach.answer"))}<textarea class="mwr-textarea short" data-field="coachFollow" dir="auto">${c.esc(c.state.coachFollow)}</textarea></label><div class="mwr-btn-row">${button(c, "coach", "coach.again", "", ' data-keep="coach-again"')}</div>`
        : `<p class="mwr-muted">${c.esc(c.t("coach.done"))}</p>`;
    return (
      `<div class="mwr-card" id="mwrCoach"><h4>${c.esc(c.t("coach.h"))}</h4>` +
      (r.strengths ? `<p><b>${c.esc(c.t("coach.strength"))}</b> ${c.esc(r.strengths)}</p>` : "") +
      (r.gap ? `<p><b>${c.esc(c.t("coach.gap"))}</b> ${c.esc(r.gap)}</p>` : "") +
      `<p><b>${c.esc(c.t("coach.question"))}</b> ${c.esc(r.question)}</p>` +
      `<div class="mwr-btn-row">${button(c, "speak-coach", "sig.listen", "", ' data-keep="speak-coach"')}</div>` +
      `<small>${c.esc(c.t("coach.note"))}</small>${follow}</div>`
    );
  }

  /* ---------------- 3 Explain ---------------- */
  function frames(c) {
    const level = Number(c.state.level);
    const chips = D.FRAME_CHIPS[c.lang];
    const shown =
      level <= 2 ? chips : level === 3 ? chips.slice(1, 4) : level === 4 ? chips.slice(3, 5) : [];
    if (!shown.length) return `<p class="mwr-muted">${c.esc(c.t("frames.none"))}</p>`;
    return `<div class="mwr-frames" role="group" aria-label="${attr(c.t("frames.h"))}">${shown.map((f, i) => `<button type="button" class="mwr-frame" data-action="frame" data-text="${attr(f)}" data-keep="frame-${i}">${c.esc(f)}</button>`).join("")}</div>`;
  }

  function exemplar(c) {
    const ex = EX[c.state.skill];
    if (!ex) return "";
    // Show the pair in a stable order that does not give the answer away by position.
    const flip = (c.state.skill.length + c.state.level.length) % 2 === 1;
    const a = flip ? ex.strong : ex.weak;
    const b = flip ? ex.weak : ex.strong;
    const pick = c.state.exemplarPick;
    const note = pick ? `<p class="mwr-notice">${c.esc(ex.note[c.lang] || ex.note.en)}</p>` : "";
    return (
      `<details class="mwr-card mwr-exemplar"${pick ? " open" : ""}><summary>${c.esc(c.t("ex.h"))}</summary><p class="mwr-muted">${c.esc(c.t("ex.lead"))}</p>` +
      `<blockquote><b>A.</b> ${c.esc(a[c.lang] || a.en)}</blockquote><blockquote><b>B.</b> ${c.esc(b[c.lang] || b.en)}</blockquote>` +
      `<div class="mwr-btn-row"><button type="button" class="mwr-btn" data-action="exemplar" data-value="A" aria-pressed="${pick === "A"}" data-keep="exA">${c.esc(c.t("ex.pickA"))}</button><button type="button" class="mwr-btn" data-action="exemplar" data-value="B" aria-pressed="${pick === "B"}" data-keep="exB">${c.esc(c.t("ex.pickB"))}</button></div>${note}</details>`
    );
  }

  function anchors(c) {
    const items = c.digest.items;
    if (!items.length)
      return `<div class="mwr-card"><h4>${c.esc(c.t("anc.h"))}</h4><p class="mwr-muted">${c.esc(c.t("anc.none"))}</p></div>`;
    const selected = c.selection ? c.selection.id : "";
    const opts = items
      .map((it, i) => option(it.id, `${I.typeLabel(c.lang, it.type)} ${i + 1}`, it.id === selected))
      .join("");
    const list = c.state.anchors
      .map((x) => `<li>${c.esc(I.typeLabel(c.lang, x.type))}: ${c.esc(x.sentence)}</li>`)
      .join("");
    return (
      `<div class="mwr-card"><h4>${c.esc(c.t("anc.h"))}</h4><p class="mwr-help">${c.esc(c.t("anc.help"))}</p>` +
      `<div class="mwr-grid"><label class="mwr-label">${c.esc(c.t("anc.part"))}<select class="mwr-select" data-field="anchorId">${opts}</select></label>` +
      `<label class="mwr-label">${c.esc(c.t("anc.sentence"))}<input class="mwr-input" type="text" maxlength="200" data-field="anchorText" dir="auto" value="${attr(c.state.anchorText)}"></label></div>` +
      `<div class="mwr-btn-row">${button(c, "anchor", "anc.add", "", ' data-keep="anchor"')}</div>${list ? `<ul class="mwr-anchors">${list}</ul>` : ""}</div>`
    );
  }

  function stemBlock(c) {
    const s = c.state;
    const base = D.STEMS[c.lang][s.level];
    const info = I.HOME_LANGS[s.homeLang];
    const home = info
      ? `<p class="mwr-stem mwr-stem-home" id="mwrStemHome" hidden lang="${attr(s.homeLang === "prs" ? "fa-AF" : s.homeLang)}"></p><p class="mwr-muted" id="mwrStemNote" hidden>${c.esc(c.t("home.unavailable"))}</p>`
      : "";
    const speeds = [
      ["0.75", "rate.slow"],
      ["0.95", "rate.normal"],
      ["1.15", "rate.fast"],
    ]
      .map(([v, k]) => option(v, c.t(k), v === "0.95"))
      .join("");
    return (
      `<p class="mwr-stem">${c.esc(base)}</p>${home}` +
      `<div class="mwr-btn-row">${button(c, "listen-stem", "s1.read", "", ' data-keep="listen-stem"')}` +
      `<label class="mwr-inline">${c.esc(c.t("rate.h"))} <select class="mwr-select compact" data-field="speechRate">${speeds}</select></label></div>`
    );
  }

  function explain(c) {
    const s = c.state;
    return (
      `<section class="mwr-panel"><h3>${c.esc(c.t("s3.h"))}</h3>${stemBlock(c)}${exemplar(c)}` +
      `<h4 class="mwr-sub">${c.esc(c.t("frames.h"))}</h4>${frames(c)}` +
      `<label class="mwr-label">${c.esc(c.t("s3.reasoning"))}<textarea class="mwr-textarea" data-field="firstDraft" data-autofocus dir="auto" placeholder="${attr(c.t("s3.placeholder"))}">${c.esc(s.firstDraft)}</textarea></label>` +
      `<div class="mwr-btn-row">${micButton(c, "firstDraft")}</div>` +
      `<label class="mwr-label">${c.esc(c.t("s3.home"))}<small>${c.esc(c.t("s3.homeHint"))}</small><textarea class="mwr-textarea short" data-field="homeLanguage" dir="auto" lang="${attr(s.homeLang === "none" ? "" : s.homeLang)}">${c.esc(s.homeLanguage)}</textarea></label>` +
      `<div class="mwr-btn-row">${micButton(c, "homeLanguage")}</div>` +
      (c.dictation ? `<p class="mwr-help">${c.esc(c.t("dictate.note"))}</p>` : "") +
      anchors(c) +
      `<div class="mwr-btn-row">${button(c, "analyze", "s3.check", "primary", ' data-keep="analyze"')}${c.coachOn ? button(c, "coach", "s3.coach", "", ' data-keep="coach"') : ""}</div>` +
      `<p class="mwr-live" role="status" aria-live="polite">${c.esc(s.coachStatus)}</p><div id="mwrSignal">${signal(c, s.check, s.firstDraft)}</div>${coach(c)}</section>`
    );
  }

  /* ---------------- 4 Revise ---------------- */
  function rounds(c) {
    const s = c.state;
    if (!s.rounds.length) return "";
    let prev = s.firstDraft;
    const list = s.rounds
      .map((r, i) => {
        const html = `<li><b>${c.esc(c.t("s4.round", { n: i + 1 }))}</b> <span class="mwr-pill">${c.esc(I.statusLabel(c.lang, r.status))}</span><p class="mwr-compare" dir="auto">${A.diffHtml(prev, r.text)}</p></li>`;
        prev = r.text;
        return html;
      })
      .join("");
    return `<div class="mwr-card"><h4>${c.esc(c.t("s4.history"))}</h4><p class="mwr-legend"><mark class="mwr-add">${c.esc(c.t("s4.added"))}</mark> <del class="mwr-del">${c.esc(c.t("s4.removed"))}</del></p><ol class="mwr-rounds">${list}</ol></div>`;
  }

  function revise(c) {
    const s = c.state;
    return (
      `<section class="mwr-panel"><h3>${c.esc(c.t("s4.h"))}</h3><div class="mwr-grid"><article class="mwr-card"><h4>${c.esc(c.t("s4.first"))}</h4><p class="mwr-compare" dir="auto">${c.esc(s.firstDraft)}</p></article>` +
      `<article class="mwr-card"><h4>${c.esc(c.t("s4.next"))}</h4><p>${c.esc(s.firstAnalysis ? s.firstAnalysis.nextMove : c.t("s4.nextDefault"))}</p></article></div>` +
      rounds(c) +
      `<label class="mwr-label">${c.esc(c.t("s4.revised"))}<textarea class="mwr-textarea" data-field="revised" data-autofocus dir="auto">${c.esc(s.revised)}</textarea></label>` +
      `<div class="mwr-btn-row">${micButton(c, "revised")}${button(c, "analyze-revision", "s4.check", "primary", ' data-keep="analyze-revision"')}</div>` +
      `<label class="mwr-label">${c.esc(c.t("s4.confAfter"))}<select class="mwr-select" data-field="afterConfidence">${confidenceOptions(c, s.afterConfidence)}</select></label>` +
      `<p class="mwr-live" role="status" aria-live="polite"></p><div id="mwrSignal">${signal(c, s.check, s.revised)}</div></section>`
    );
  }

  /* ---------------- 5 Compare ---------------- */
  function compare(c) {
    const s = c.state;
    return (
      `<section class="mwr-panel"><h3>${c.esc(c.t("s5.h"))}</h3><p>${c.esc(c.t("s5.lead"))}</p><p class="mwr-muted">${c.esc(c.t("s5.optional"))}</p>` +
      `<label class="mwr-label">${c.esc(c.t("s5.second"))}<textarea class="mwr-textarea short" data-field="compare.second" data-autofocus dir="auto">${c.esc(s.compare.second)}</textarea></label>` +
      `<label class="mwr-label">${c.esc(c.t("s5.which"))}<textarea class="mwr-textarea short" data-field="compare.which" dir="auto" placeholder="${attr(c.t("s5.whichPh"))}">${c.esc(s.compare.which)}</textarea></label>` +
      `<p class="mwr-live" role="status" aria-live="polite"></p></section>`
    );
  }

  /* ---------------- 6 Evidence ---------------- */
  function growth(c, first, last) {
    if (!first || !last) return "";
    const rows = ["claim", "reason", "concept", "model", "link", "units"]
      .map((d) => {
        const was = first.profile[d];
        const now = last.profile[d];
        const mark = now && !was ? c.t("ev.gained") : now ? c.t("ev.kept") : c.t("ev.next");
        return `<li class="${now ? "is-on" : ""}">${c.esc(c.t(`dim.${d}`))}: <span>${was ? "✓" : "○"} → ${now ? "✓" : "○"}</span> <small>${c.esc(mark)}</small></li>`;
      })
      .join("");
    return `<ul class="mwr-dims mwr-growth">${rows}</ul>`;
  }

  function evidence(c) {
    const s = c.state;
    const first = s.firstAnalysis;
    const last = s.analysis;
    const smp = (last ? last.smp : [])
      .map(
        (id) =>
          `<li class="mwr-badge">${c.esc(id)} · ${c.esc(D.SMP[id] ? D.SMP[id][c.lang] || D.SMP[id].en : id)}</li>`,
      )
      .join("");
    const own = c.own
      .map(
        (x) =>
          `<li><span>${c.esc(D.SKILLS[x.skill] ? D.SKILLS[x.skill].label[c.lang] || D.SKILLS[x.skill].label.en : x.skill)} · ${c.esc(String(x.at || "").slice(0, 10))}</span> <button type="button" class="mwr-btn small" data-action="delete-cycle" data-id="${attr(x.id)}" data-keep="del-${attr(x.id)}">${c.esc(c.t("ev.delete"))}</button></li>`,
      )
      .join("");
    const compareLine =
      s.compare.second || s.compare.which
        ? `<article class="mwr-card"><h4>${c.esc(c.t("s5.h"))}</h4><p class="mwr-compare" dir="auto">${c.esc(s.compare.second)}</p><p class="mwr-compare" dir="auto">${c.esc(s.compare.which)}</p></article>`
        : "";
    return (
      `<section class="mwr-panel"><h3>${c.esc(c.t("s6.h"))}</h3><p class="mwr-muted">${c.esc(c.t("s6.lead"))}</p><div class="mwr-evidence-grid">` +
      `<article class="mwr-card"><h4>${c.esc(c.t("s6.changed"))}</h4><p class="mwr-compare" dir="auto">${A.diffHtml(s.firstDraft, s.revised || s.firstDraft)}</p>` +
      `<p class="mwr-legend"><mark class="mwr-add">${c.esc(c.t("s4.added"))}</mark> <del class="mwr-del">${c.esc(c.t("s4.removed"))}</del></p>` +
      `<p><b>${c.esc(c.t("s6.confidence"))}</b> ${c.esc(c.t(`conf.${s.beforeConfidence}`))} → ${c.esc(c.t(`conf.${s.afterConfidence}`))}</p></article>` +
      `<article class="mwr-card"><h4>${c.esc(c.t("s6.signal"))}</h4><p><b>${c.esc(first ? I.statusLabel(c.lang, first.status) : "")}</b> → <b>${c.esc(last ? I.statusLabel(c.lang, last.status) : "")}</b></p>${last ? signal(c, last, "") : ""}${growth(c, first, last)}</article></div>` +
      (smp
        ? `<h4 class="mwr-sub">${c.esc(c.t("s6.smp"))}</h4><ul class="mwr-badges">${smp}</ul>`
        : "") +
      compareLine +
      `<div class="mwr-card"><h4>${c.esc(c.t("s6.board"))}</h4>${s.thumb ? `<img class="mwr-thumb" src="${attr(s.thumb)}" alt="${attr(c.t("s6.boardAlt"))}">` : `<p class="mwr-muted">${c.esc(c.t("s6.noThumb"))}</p>`}` +
      `<canvas id="mwrReplay" class="mwr-replay" width="560" height="320" role="img" aria-label="${attr(c.t("replay.alt"))}"></canvas>` +
      `<div class="mwr-btn-row">${button(c, "replay-play", "replay.play", "", ' data-keep="replay-play"')}${button(c, "replay-restart", "replay.restart", "", ' data-keep="replay-restart"')}` +
      `<label class="mwr-inline">${c.esc(c.t("replay.speed"))} <select class="mwr-select compact" data-field="replaySpeed"><option value="1">1×</option><option value="2">2×</option><option value="4">4×</option></select></label></div><p class="mwr-muted" id="mwrReplayNote"></p></div>` +
      `<div class="mwr-btn-row">${button(c, "board-reflection", "s6.toBoard", "success", ' data-keep="board-reflection"')}${button(c, "share", "s6.share", "", ' data-keep="share"')}${button(c, "print", "s6.print", "", ' data-keep="print"')}${button(c, "new", "s6.new", "", ' data-keep="new"')}</div>` +
      `<p class="mwr-live" role="status" aria-live="polite"></p>` +
      `<div class="mwr-card"><h4>${c.esc(c.t("s6.stored"))}</h4><p class="mwr-muted">${c.esc(c.t("s6.storedNote", { n: c.storedCount, days: c.retention || "∞" }))}</p><ul class="mwr-own">${own}</ul></div></section>`
    );
  }

  /* ---------------- dialog chrome ---------------- */
  const STEP_KEYS = ["step.1", "step.2", "step.3", "step.4", "step.5", "step.6"];
  const LAST = 5;

  function shell() {
    return (
      '<section class="mwr-dialog" role="dialog" aria-labelledby="mwrTitle">' +
      '<div class="mwr-head"><div class="mwr-title"><span class="mwr-title-mark" aria-hidden="true">↗</span>' +
      '<div><h2 id="mwrTitle"></h2><p id="mwrSubtitle"></p></div></div>' +
      '<div class="mwr-btn-row"><button type="button" class="mwr-btn small" data-action="dock" id="mwrDock"></button>' +
      '<button type="button" class="mwr-btn small" data-action="view-toggle" id="mwrViewBtn"></button>' +
      '<button type="button" class="mwr-icon-btn" data-action="close" id="mwrClose">✕</button></div></div>' +
      '<nav class="mwr-steps" id="mwrSteps"><ol class="mwr-step-list"></ol></nav><div class="mwr-body"></div><div class="mwr-foot"></div></section>'
    );
  }

  function steps(c) {
    const s = c.state;
    return STEP_KEYS.map((key, i) => {
      const reachable = i <= s.maxStep && (i < LAST || s.savedId);
      const cls = `mwr-step${i === s.step ? " is-current" : ""}${i < s.step ? " is-done" : ""}`;
      return `<li><button type="button" class="${cls}" data-action="goto" data-step="${i}"${i === s.step ? ' aria-current="step"' : ""}${reachable ? "" : " disabled"}>${i + 1}. ${c.esc(c.t(key))}</button></li>`;
    }).join("");
  }

  function foot(c, view) {
    if (view === "teacher") {
      return `<div class="mwr-btn-row"><button type="button" class="mwr-btn" data-action="view-toggle">${c.esc(c.t("tv.back"))}</button></div><span class="mwr-muted">${c.esc(c.t("tv.stored"))}</span>`;
    }
    const step = c.state.step;
    const pct = ((step + 1) / (LAST + 1)) * 100;
    let primary = "";
    if (step === 4) primary = `<button type="button" class="mwr-btn success" data-action="next">${c.esc(c.t("nav.save"))}</button>`;
    else if (step < 4) primary = `<button type="button" class="mwr-btn primary" data-action="next">${c.esc(c.t("nav.continue"))}</button>`;
    return (
      `<div class="mwr-btn-row">${step > 0 ? `<button type="button" class="mwr-btn" data-action="back">${c.esc(c.t("nav.back"))}</button>` : ""}${primary}</div>` +
      `<div class="mwr-foot-note"><div class="mwr-progress" role="progressbar" aria-label="${c.esc(c.t("nav.progress"))}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round(pct)}"><span style="width:${pct}%"></span></div><small class="mwr-muted">${c.esc(c.t("privacy"))}</small></div>`
    );
  }

  root.MWRPanels = Object.freeze({
    shell,
    steps,
    foot,
    setup,
    model,
    explain,
    revise,
    compare,
    evidence,
    signal,
    coach,
    attr,
    option,
  });
})(window);
