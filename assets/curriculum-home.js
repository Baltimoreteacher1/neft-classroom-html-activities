/* Native disclosures preserve the full library without dominating lesson discovery. */
(() => {
  if (
    !document.body.classList.contains("curriculum-home") &&
    !document.getElementById("curriculum-navigator") &&
    !document.getElementById("course-overview")
  )
    return;

  function reveal(target) {
    if (!target) return;
    for (let node = target; node; node = node.parentElement) {
      if (node instanceof HTMLDetailsElement) node.open = true;
    }
  }

  // Capture runs before existing workflow handlers attempt to scroll/focus a panel.
  document.addEventListener(
    "click",
    (event) => {
      const source = event.target instanceof Element ? event.target : null;
      if (!source) return;
      if (source.closest("[data-home-mode]")) {
        const toggle = document.getElementById("hub-mode-toggle");
        if (toggle) {
          toggle.click();
        } else {
          document.body.classList.remove("teacher-mode");
          try {
            localStorage.setItem("nt-teacher-mode", "0");
          } catch {}
          document.dispatchEvent(new CustomEvent("nt:mode-change"));
        }
      }
      if (source.closest("[data-guide-teacher-view], [data-audience='teacher']")) {
        reveal(
          document.getElementById("curriculum-teacher-workflow") ||
            document.getElementById("hub-library-collection"),
        );
      }
      const link = source.closest("a[href^='#']");
      const hash = link?.getAttribute("href");
      if (hash && hash.length > 1) {
        try {
          reveal(document.getElementById(decodeURIComponent(hash.slice(1))));
        } catch {}
      }
    },
    true,
  );

  function revealHash() {
    if (!location.hash) return;
    try {
      reveal(document.getElementById(decodeURIComponent(location.hash.slice(1))));
    } catch {}
  }
  window.addEventListener("hashchange", revealHash);
  revealHash();

  // Mark the unit being taught now (or next, between units) on the course cards.
  function markCurrentUnit() {
    const cards = Array.from(document.querySelectorAll(".course-unit-list li[data-start]"));
    if (!cards.length) return;
    const now = new Date();
    const today = [
      now.getFullYear(),
      String(now.getMonth() + 1).padStart(2, "0"),
      String(now.getDate()).padStart(2, "0"),
    ].join("-");
    const ordered = cards.sort((a, b) => a.dataset.start.localeCompare(b.dataset.start));
    const current =
      ordered.find((li) => li.dataset.start <= today && today <= li.dataset.end) ||
      ordered.find((li) => today < li.dataset.start);
    // Finished units step back so the eye lands on what is current and next.
    ordered.forEach((li) => {
      if (li.dataset.end < today) li.classList.add("is-done");
    });
    if (!current) return;
    const live = current.dataset.start <= today;
    current.classList.add("is-current");
    const tag = document.createElement("span");
    tag.className = "course-unit-now";
    tag.textContent = live ? "Now" : "Next";
    current.querySelector("a")?.prepend(tag);
    if (live) current.querySelector("a")?.setAttribute("aria-current", "date");
  }
  markCurrentUnit();

  // The course cards are listed by unit NUMBER (the sync tool's contract), but
  // the district teaches them in a different ORDER (Pre, 3, 4, 6, 7, 8, 9, 5,
  // 2, 10). The caption under the heading says so in words; this draws it: one
  // bar, units in teaching order, width by length, today marked. Built from the
  // same data-start/data-end the cards already carry, so it cannot drift from
  // them, and it is inserted beside the list rather than into the generated
  // block.
  function isoDate(d) {
    return [
      d.getFullYear(),
      String(d.getMonth() + 1).padStart(2, "0"),
      String(d.getDate()).padStart(2, "0"),
    ].join("-");
  }
  function daysBetween(a, b) {
    const [ay, am, ad] = a.split("-").map(Number);
    const [by, bm, bd] = b.split("-").map(Number);
    return Math.round((Date.UTC(by, bm - 1, bd) - Date.UTC(ay, am - 1, ad)) / 86400000);
  }
  function buildYearTimeline() {
    const section = document.getElementById("course-overview");
    const head = section?.querySelector(".course-overview__head");
    const cards = Array.from(
      document.querySelectorAll(".course-unit-list li[data-start][data-end]"),
    );
    if (!section || !head || cards.length < 2 || section.querySelector(".course-timeline")) return;
    const units = cards
      .map((li) => ({
        number: li.dataset.unit,
        start: li.dataset.start,
        end: li.dataset.end,
        title: li.querySelector(".course-unit-title")?.textContent.trim() || "",
        dates: li.querySelector(".course-unit-dates")?.textContent.trim() || "",
        count: li.querySelector(".course-unit-count")?.textContent.trim() || "",
        href: li.querySelector("a")?.getAttribute("href") || "/curriculum/units/",
        days: Math.max(1, daysBetween(li.dataset.start, li.dataset.end) + 1),
      }))
      .sort((a, b) => a.start.localeCompare(b.start));
    const total = units.reduce((n, u) => n + u.days, 0);
    const today = isoDate(new Date());

    const wrap = document.createElement("div");
    wrap.className = "course-timeline";
    wrap.setAttribute("role", "group");
    wrap.setAttribute("aria-label", "School year at a glance, units in teaching order");

    const track = document.createElement("ol");
    track.className = "course-timeline__track";
    let before = 0;
    let todayPct = null;
    let current = null;
    units.forEach((u, index) => {
      const li = document.createElement("li");
      li.style.flexGrow = String(u.days);
      li.style.setProperty("--tl-accent", `var(--unit-${u.number}, #5b6470)`);
      const live = u.start <= today && today <= u.end;
      if (u.end < today) li.classList.add("is-done");
      if (live) {
        current = u;
        li.classList.add("is-current");
        todayPct = ((before + daysBetween(u.start, today)) / total) * 100;
      } else if (!current && todayPct === null && today < u.start) {
        todayPct = (before / total) * 100;
      }
      const link = document.createElement("a");
      link.href = u.href;
      link.title = `Unit ${u.number} · ${u.title} · ${u.dates}`;
      const num = document.createElement("span");
      num.className = "course-timeline__num";
      num.setAttribute("aria-hidden", "true");
      num.textContent = u.number;
      const label = document.createElement("span");
      label.className = "visually-hidden";
      label.textContent = `${index + 1} of ${units.length}: Unit ${u.number}, ${u.title}, ${u.dates}, ${u.count}`;
      link.append(num, label);
      li.appendChild(link);
      track.appendChild(li);
      before += u.days;
    });
    if (todayPct === null && today > units[units.length - 1].end) todayPct = 100;

    wrap.appendChild(track);
    if (todayPct !== null) {
      const marker = document.createElement("span");
      marker.className = "course-timeline__today";
      marker.style.left = `${Math.min(100, Math.max(0, todayPct)).toFixed(2)}%`;
      marker.setAttribute("aria-hidden", "true");
      wrap.appendChild(marker);
    }
    const caption = document.createElement("p");
    caption.className = "course-timeline__caption";
    // Where the class is today is the Now / Next card's job (lesson level);
    // the bar only states the order.
    const order = units.map((u) => u.number).join(" → ");
    caption.textContent = `Taught in this order: ${order}.`;
    wrap.appendChild(caption);
    head.after(wrap);
  }
  buildYearTimeline();

  // Now / Next — the lesson the class is on today and on the next class day,
  // from the pacing baseline (assets/pacing-days.generated.js, written by the
  // sync tool). Day
  // types without a lesson (project, review, assessment) link to their unit.
  const DAY_TYPE_ES = {
    Project: "Proyecto de la unidad",
    Review: "Repaso de la unidad",
    Assessment: "Evaluación de la unidad",
    Flex: "Día flexible",
    "MCAP / Testing": "Pruebas estatales",
  };
  function dayLabel(iso, locale) {
    const [y, m, d] = iso.split("-").map(Number);
    return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString(locale, {
      weekday: "short",
      month: "short",
      day: "numeric",
      timeZone: "UTC",
    });
  }
  function unitTitle(unit) {
    const card = document.querySelector(`.course-unit-list li[data-unit="${unit}"]`);
    return card?.querySelector(".course-unit-title")?.textContent.trim() || "";
  }
  function describeDay(day, lessons) {
    const [, unit, dayType, lessonId, detail] = day;
    if (lessonId) {
      const base = lessonId.replace(/-catchup$/, "");
      const [title, titleEs] = lessons[base] || [base, base];
      const catchUp = lessonId !== base;
      const part = detail ? ` (day ${detail})` : "";
      const partEs = detail ? ` (día ${detail})` : "";
      return {
        href: `/lessons/${lessonId}/`,
        title: `${catchUp ? "Catch-up · " : ""}Lesson ${base} · ${title}${part}`,
        titleEs: `${catchUp ? "Repaso · " : ""}Lección ${base} · ${titleEs}${partEs}`,
        base,
        unit,
      };
    }
    return {
      href: dayType === "Project" ? "/curriculum/projects/" : `/curriculum/units/#unit-${unit}`,
      title: detail,
      titleEs: `${DAY_TYPE_ES[dayType] || detail}${unit ? ` · Unidad ${unit}` : ""}`,
      base: null,
      unit,
    };
  }
  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text) node.textContent = text;
    return node;
  }
  function es(text) {
    const node = el("span", "hub-es", text);
    node.lang = "es";
    return node;
  }
  function nowCard(kind, kindEs, day, lessons) {
    const card = el("article", `hub-now__card hub-now__card--${kind.toLowerCase()}`);
    const when = el("p", "hub-now__when");
    when.append(
      el("strong", "", kind),
      ` · ${dayLabel(day[0], "en-US")} `,
      es(`${kindEs} · ${dayLabel(day[0], "es-US")}`),
    );
    const info = describeDay(day, lessons);
    const heading = el("h3", "hub-now__title");
    const link = el("a", "", info.title);
    link.href = info.href;
    heading.appendChild(link);
    card.append(when, heading, es(info.titleEs));
    if (info.unit) {
      const title = unitTitle(info.unit);
      card.appendChild(el("p", "hub-now__unit", `Unit ${info.unit}${title ? ` · ${title}` : ""}`));
    }
    if (info.base) card.appendChild(lessonActions(info.base));
    if (info.base) {
      const guide = el("a", "hub-now__guide hub-for-family", "Family guide ");
      guide.href = `/lessons/${info.base}/family/`;
      guide.appendChild(es("· Guía para familias"));
      card.appendChild(guide);
    }
    return card;
  }
  // Three one-tap steps for a lesson day, in the order a student needs them:
  // warm up on the prerequisite skills, do the practice sheet, get help.
  // Every lesson in the pacing plan has all three pages (checked in the tests).
  function lessonActions(base) {
    const row = el("p", "hub-now__actions");
    [
      ["Get ready", "Prepárate", `/lessons/${base}/readiness/`],
      ["Practice", "Practica", `/lessons/${base}/worksheet.html`],
      ["Get help", "Ayuda", `/lessons/${base}/student-help/`],
    ].forEach(([label, labelEs, href]) => {
      const link = el("a", "hub-now__action", label);
      link.href = href;
      link.append(" ", es(`· ${labelEs}`));
      row.appendChild(link);
    });
    return row;
  }

  // Practice days in a row, read from the Fluency Lab's own saved days so the
  // number matches what the lab shows. Local to this device; never sent.
  function fluencyStreak() {
    try {
      const stored = JSON.parse(localStorage.getItem("ewl-fluency-profiles-v1") || "{}");
      const active = Number.isInteger(stored.active) && stored.active > 0 ? stored.active : 0;
      const base = "ewl-fluency-rewards-v1";
      const saved = JSON.parse(
        localStorage.getItem(active ? `${base}:profile-${active}` : base) || "{}",
      );
      const days = new Set(Array.isArray(saved.days) ? saved.days : []);
      let cursor = new Date();
      if (!days.has(isoDate(cursor))) cursor.setDate(cursor.getDate() - 1);
      let run = 0;
      while (days.has(isoDate(cursor))) {
        run += 1;
        cursor.setDate(cursor.getDate() - 1);
      }
      return run;
    } catch {
      return 0;
    }
  }
  // A day with no class is still a day to practice: the card says so, shows the
  // streak when there is one, and links to the Fluency Lab game room.
  function restCard() {
    const card = el("article", "hub-now__card hub-now__card--off");
    const when = el("p", "hub-now__when", "No class today ");
    when.appendChild(es("Hoy no hay clase"));
    const streak = fluencyStreak();
    const link = el("a", "hub-now__action hub-now__action--play");
    link.href = "/math/fluency-lab/";
    link.append(
      streak ? `🔥 ${streak}-day streak. Keep it going` : "🎮 Play a quick fluency game",
      " ",
    );
    link.appendChild(es(streak ? `· Racha de ${streak} días` : "· Un juego rápido"));
    card.append(when, link);
    return card;
  }

  // "Pick up where you left off": the most recent unfinished Save / Resume
  // record on this device (shared/save-resume stores them as nsr:rec:<code>).
  // Only same-site paths are linked, and "Not me" hides it for shared devices.
  const CONTINUE_DISMISSED = "nt-hub-continue-dismissed";
  const CONTINUE_MAX_DAYS = 30;
  function latestUnfinished() {
    let best = null;
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (!key || !key.startsWith("nsr:rec:")) continue;
        let rec = null;
        try {
          rec = JSON.parse(localStorage.getItem(key) || "null");
        } catch {}
        if (!rec || typeof rec.url !== "string" || !/^\/(?!\/)/.test(rec.url)) continue;
        if (rec.url === "/curriculum/") continue;
        const pct = Number(rec.progressPercent) || 0;
        const when = Date.parse(rec.updatedAt);
        if (!rec.activityTitle || pct >= 100 || !Number.isFinite(when)) continue;
        if (Date.now() - when > CONTINUE_MAX_DAYS * 86400000) continue;
        if (!best || when > best.when)
          best = {
            code: rec.saveCode,
            url: rec.url,
            title: String(rec.activityTitle),
            step: rec.currentStepLabel || rec.phase || "",
            pct,
            when,
          };
      }
      if (best && localStorage.getItem(CONTINUE_DISMISSED) === `${best.code}@${best.when}`)
        return null;
    } catch {
      return null;
    }
    return best;
  }
  function savedAgo(when) {
    const days = Math.floor((Date.now() - when) / 86400000);
    if (days <= 0) return ["Saved today", "Guardado hoy"];
    if (days === 1) return ["Saved yesterday", "Guardado ayer"];
    return [`Saved ${days} days ago`, `Guardado hace ${days} días`];
  }
  function renderContinue(host) {
    const item = latestUnfinished();
    if (!host || !item) return;
    // Deduplicate legacy #resume-strip when the unified Continue card is active
    const legacyStrip = document.getElementById("resume-strip");
    if (legacyStrip) legacyStrip.classList.remove("on");
    const card = el("article", "hub-now__card hub-now__card--continue");
    const when = el("p", "hub-now__when");
    when.append(el("strong", "", "Pick up where you left off "), es("· Sigue donde lo dejaste"));
    const heading = el("h3", "hub-now__title");
    const link = el("a", "", item.title);
    link.href = item.url;
    heading.appendChild(link);
    const [ago, agoEs] = savedAgo(item.when);
    const stepText = item.step ? `${item.step} · ` : "";
    const meter = el("p", "hub-now__unit", `${stepText}${Math.round(item.pct)}% done · ${ago} `);
    meter.appendChild(es(`· ${Math.round(item.pct)}% completado · ${agoEs}`));
    const bar = el("span", "hub-now__bar");
    bar.setAttribute("aria-hidden", "true");
    bar.style.setProperty("--pct", `${Math.min(100, Math.max(0, item.pct))}%`);
    const meta = el("div", "hub-now__meta");
    const saveCode =
      item.code ||
      (typeof window !== "undefined" &&
      /** @type {any} */ (window).NTSignal &&
      typeof (/** @type {any} */ (window).NTSignal.getCode) === "function"
        ? /** @type {any} */ (window).NTSignal.getCode()
        : "");
    if (saveCode) {
      const codePill = el("span", "hub-now__code", `Save Code: ${saveCode}`);
      codePill.title = "Use this 6-character code on any school Chromebook to resume";
      meta.appendChild(codePill);
    }
    const portfolioLink = el("a", "hub-now__portfolio", "My Progress & Portfolio ");
    portfolioLink.href = "/curriculum/my-progress/";
    portfolioLink.appendChild(es("· Mi progreso y portafolio"));
    meta.appendChild(portfolioLink);
    const hide = el("button", "hub-now__dismiss", "Not me ");
    hide.type = "button";
    hide.appendChild(es("· No soy yo"));
    hide.addEventListener("click", () => {
      try {
        localStorage.setItem(CONTINUE_DISMISSED, `${item.code}@${item.when}`);
      } catch {}
      card.remove();
    });
    card.append(when, heading, meter, bar, meta, hide);
    host.prepend(card);
  }
  function renderNowNext() {
    const host = document.querySelector("[data-hub-now]");
    // assets/pacing-days.generated.js (tools/sync-curriculum-shell.mjs)
    const plan = /** @type {any} */ (window).__NT_PACING_DAYS;
    if (!host || !plan) return;
    const days = Array.isArray(plan?.days) ? plan.days : [];
    const lessons = plan?.lessons || {};
    const today = isoDate(new Date());
    const now = days.find((day) => day[0] === today);
    const next = days.find((day) => day[0] > today);
    host.replaceChildren();
    if (now) host.appendChild(nowCard("Today", "Hoy", now, lessons));
    else host.appendChild(restCard());
    if (next) host.appendChild(nowCard("Next", "Siguiente", next, lessons));
    // The family "Lesson guide" card points at this week's lesson.
    const lessonDay = days.find((day) => day[0] >= today && day[3]);
    const guide = document.querySelector("[data-hub-family-guide]");
    if (guide && lessonDay) {
      const base = lessonDay[3].replace(/-catchup$/, "");
      guide.href = `/lessons/${base}/family/`;
      const sub = guide.querySelector("span:not([lang])");
      if (sub && lessons[base])
        sub.textContent = `Lesson ${base} · ${lessons[base][0]}: what it teaches and how to help at home.`;
      const subEs = guide.querySelector("span[lang='es']:not(strong span)");
      if (subEs && lessons[base])
        subEs.textContent = `Lección ${base} · ${lessons[base][1]}: lo que enseña y cómo ayudar en casa.`;
    }
  }
  renderNowNext();
  renderContinue(document.querySelector("[data-hub-now]"));

  // Lesson finder: type a topic (English or Spanish) or a number like "4-1" and
  // get links straight to the lesson. Reads the same pacing plan as Now / Next.
  function plain(text) {
    return text
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();
  }
  function setupLessonFinder() {
    const box = document.querySelector("[data-hub-find]");
    const plan = /** @type {any} */ (window).__NT_PACING_DAYS;
    const lessons = plan?.lessons;
    if (!box || !lessons) return;
    const input = box.querySelector("input");
    const status = box.querySelector(".hub-find__status");
    const list = box.querySelector(".hub-find__results");
    if (!input || !status || !list) return;
    const index = Object.entries(lessons)
      .filter(([id]) => !id.endsWith("-catchup"))
      .map(([id, [title, titleEs]]) => ({
        id,
        title,
        titleEs,
        named: plain(`${id} ${title} ${titleEs}`),
        vocab: /** @type {string[]} */ ([]),
      }))
      .sort((a, b) => a.id.localeCompare(b.id, "en", { numeric: true }));
    box.hidden = false;
    const haystack = (item) => `${item.named} ${plain(item.vocab.join(" "))}`;
    function search() {
      const words = plain(input.value).split(/\s+/).filter(Boolean);
      list.replaceChildren();
      if (!words.length) {
        status.textContent = "";
        return;
      }
      const found = index.filter((item) => words.every((word) => haystack(item).includes(word)));
      found.slice(0, 8).forEach((item) => {
        const li = el("li");
        const link = el("a", "hub-find__link");
        link.href = `/lessons/${item.id}/`;
        link.append(el("strong", "", `${item.id} `), `${item.title} `, es(`· ${item.titleEs}`));
        // A match that came from a vocabulary word says which word, so the
        // result never looks unrelated to what was typed.
        if (!words.every((word) => item.named.includes(word))) {
          const hits = (v) => words.filter((word) => plain(v).includes(word)).length;
          const term = item.vocab.reduce((best, v) => (hits(v) > hits(best || "") ? v : best), "");
          if (term) link.append(el("small", "hub-find__word", `Word: ${term}`));
        }
        li.appendChild(link);
        list.appendChild(li);
      });
      status.textContent = found.length
        ? `${found.length} ${found.length === 1 ? "lesson" : "lessons"} found${found.length > 8 ? ", showing 8" : ""}`
        : "No lesson found. Try a shorter word.";
    }
    // Vocabulary words come from the launch manifest; the hub's other scripts
    // already fetch it, so this is a cache hit. Fetched on first focus only.
    let vocabLoaded = false;
    function loadVocabulary() {
      if (vocabLoaded) return;
      vocabLoaded = true;
      fetch("/data/curriculum-launch-manifest.json")
        .then((res) => (res.ok ? res.json() : Promise.reject(new Error(String(res.status)))))
        .then((manifest) => {
          const byId = new Map((manifest.lessons || []).map((l) => [l.id, l.vocabulary || []]));
          index.forEach((item) => {
            item.vocab = (byId.get(item.id) || []).filter((v) => plain(v) !== plain(item.title));
          });
          search();
        })
        .catch(() => {});
    }
    input.addEventListener("focus", loadVocabulary, { once: true });
    input.addEventListener("input", search);
    input.addEventListener("keydown", (event) => {
      if (event.key === "Enter") list.querySelector("a")?.click();
    });
    // "/" jumps to the finder from anywhere on the page, like most search boxes.
    document.addEventListener("keydown", (event) => {
      const target = /** @type {HTMLElement | null} */ (event.target);
      if (event.key !== "/" || event.ctrlKey || event.metaKey || event.altKey) return;
      if (target?.closest("input, textarea, select, [contenteditable]")) return;
      if (box.hidden || !box.offsetParent) return;
      event.preventDefault();
      input.focus();
    });
  }
  setupLessonFinder();

  // Audience switcher: Student (default) / Family / Teacher. Student and Family
  // are remembered on this device; Teacher is the existing Teacher view, whose
  // PIN prompt and storage live in curriculum-enhancements.js — the Teacher
  // button carries the id that file already binds (#hub-mode-banner-switch).
  const AUDIENCE_KEY = "nt-hub-audience";
  const audienceButtons = Array.from(document.querySelectorAll("[data-hub-audience]"));
  function currentAudience() {
    if (document.body.classList.contains("teacher-mode")) return "teacher";
    return document.body.classList.contains("hub-aud-family") ? "family" : "student";
  }
  function syncAudience() {
    const audience = currentAudience();
    audienceButtons.forEach((button) => {
      button.setAttribute("aria-pressed", String(button.dataset.hubAudience === audience));
    });
  }
  if (audienceButtons.length) {
    document.addEventListener(
      "click",
      (event) => {
        const button =
          event.target instanceof Element ? event.target.closest("[data-hub-audience]") : null;
        if (!button) return;
        const audience = button.dataset.hubAudience;
        if (audience === "teacher") {
          // Already in Teacher view: nothing to unlock, so do not re-prompt.
          if (currentAudience() === "teacher") {
            event.preventDefault();
            event.stopPropagation();
          }
          return;
        }
        document.body.classList.toggle("hub-aud-family", audience === "family");
        try {
          localStorage.setItem(AUDIENCE_KEY, audience);
        } catch {}
        if (document.body.classList.contains("teacher-mode")) {
          /** @type {HTMLElement | null} */ (
            document.querySelector("#hub-teacher-banner [data-home-mode]")
          )?.click();
        }
        syncAudience();
      },
      true,
    );
    new MutationObserver(syncAudience).observe(document.body, {
      attributes: true,
      attributeFilter: ["class"],
    });
    syncAudience();
  }
})();
