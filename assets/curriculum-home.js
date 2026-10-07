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
    let next = null;
    units.forEach((u, index) => {
      const li = document.createElement("li");
      li.style.flexGrow = String(u.days);
      li.style.setProperty("--tl-accent", `var(--unit-${u.number}, #5b6470)`);
      const live = u.start <= today && today <= u.end;
      if (live) {
        current = u;
        li.classList.add("is-current");
        todayPct = ((before + daysBetween(u.start, today)) / total) * 100;
      } else if (!current && !next && today < u.start) {
        next = u;
        if (todayPct === null) todayPct = (before / total) * 100;
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
    const order = units.map((u) => u.number).join(" → ");
    let where = "";
    if (current) {
      const week = Math.ceil((daysBetween(current.start, today) + 1) / 7);
      const weeks = Math.ceil(current.days / 7);
      where = `Today: Unit ${current.number} · ${current.title}, week ${week} of ${weeks}.`;
    } else if (next) {
      where = `Next: Unit ${next.number} · ${next.title}, from ${next.dates.split("–")[0].trim()}.`;
    }
    caption.textContent = `Taught in this order: ${order}. ${where}`.trim();
    wrap.appendChild(caption);
    head.after(wrap);
  }
  buildYearTimeline();
})();
