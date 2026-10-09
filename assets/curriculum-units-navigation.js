/** Public curriculum browser: one unit at a time, with global search intact.
 * Keep all cards attached: curriculum-enhancements maps their DOM order to the
 * canonical unitsData array. Static details remain the print/no-script source.
 */
(function () {
  "use strict";

  function setupCurriculumNavSync() {
    const api = window.CurriculumHub;
    const nav = document.getElementById("units-browser-nav");
    const picker = /** @type {HTMLSelectElement} */ (
      document.getElementById("units-browser-select")
    );
    const status = document.getElementById("units-browser-status");
    const bottom = /** @type {HTMLSelectElement} */ (
      document.getElementById("bottom-lesson-select")
    );
    if (!api || !api.unitsData.length || !nav || !picker || !status) return;
    const hub = /** @type {HTMLElement} */ (api.hubEl);
    const search = /** @type {HTMLInputElement} */ (api.searchBox);
    const units = api.unitsData;
    const selections = new Map();
    // District pacing (assets/curriculum-units-pacing.js). Every unit is
    // resolved through its curriculum unit number, never the sequence key.
    const pacing = window.NTUnitsPacing;
    const ranges = pacing ? pacing.unitRanges(window.__NT_PACING_DATES) : new Map();
    const pacingDays = Array.isArray(window.__NT_PACING_DAYS) ? window.__NT_PACING_DAYS : [];
    const todayIso = pacing ? pacing.isoDate(new Date()) : "";
    const currentUnit = ranges.size ? pacing.currentUnit(ranges, pacingDays, todayIso) : null;
    const ordered = pacing
      ? pacing
          .teachingOrder(
            units.map((unit) => Number(unit.unitIndex)),
            ranges,
          )
          .map((number) => units.find((unit) => Number(unit.unitIndex) === number))
      : units.slice();
    let active = String(units[0].unitIndex);
    let restoring = false;
    let previousSelectionUrl = "";

    const unitFor = (number) => units.find((unit) => String(unit.unitIndex) === String(number));
    const cards = () => Array.from(hub.querySelectorAll(".unit-card"));
    const unitOf = (card) => units[cards().indexOf(card)];
    const getSelect = (card) =>
      /** @type {HTMLSelectElement} */ (card.querySelector(".lesson-select"));
    const isSearching = () => search.value.trim().length > 0;
    const isFiltering = () =>
      !!document.querySelector('.hub-filter-chip[aria-pressed="true"]:not([data-filter="all"])');

    function studentUrl(href) {
      const url = new URL(href, location.origin);
      url.searchParams.set("student", "1");
      const supports = new URLSearchParams(location.search).get("supports");
      if (supports) url.searchParams.set("supports", supports);
      return url.pathname + url.search + url.hash;
    }

    function selectLesson(unit, lessonId, options = {}) {
      const previousUrl = location.href;
      choose(unit.unitIndex, { push: false, focus: false });
      selections.set(String(unit.unitIndex), { lesson: lessonId, activity: "" });
      restore();
      sync();
      // Returning from a search is a navigation, so Back restores the query.
      // choose() also notifies search listeners; preserve the original entry.
      history.replaceState(history.state, "", previousUrl);
      updateUrl(true);
      const card = document.getElementById("unit-" + unit.unitIndex);
      const focus = options.pathway
        ? card?.querySelector('[data-pathway="' + options.pathway + '"]')
        : card?.querySelector(".units-lesson-heading");
      if (focus instanceof HTMLElement) focus.focus({ preventScroll: !!options.pathway });
    }

    function lessonPathways(card, unit, lesson, heading) {
      const baseId = /^(\d+-\d+)(?:-group[12])?$/.exec(lesson.lessonId || "")?.[1];
      let group = card.querySelector(".units-lesson-pathways");
      if (!baseId) {
        if (group) group.hidden = true;
        return;
      }
      if (!group) {
        group = document.createElement("div");
        group.className = "units-lesson-pathways";
        group.setAttribute("role", "group");
        group.setAttribute("aria-label", "Choose a lesson pathway");
        heading.after(group);
      }
      group.hidden = false;
      if (group.dataset.lessonId === lesson.lessonId) return;
      group.dataset.lessonId = lesson.lessonId;
      group.replaceChildren();
      const choices = [
        [baseId, "Lesson", "Explore the idea, then practice and explain your thinking."],
        [
          baseId + "-group1",
          "Extra support",
          "Work through the same learning target in smaller steps with guidance.",
        ],
        [
          baseId + "-group2",
          "Challenge",
          "Explain, compare, and apply the same learning target in new situations.",
        ],
      ];
      const description = document.createElement("p");
      description.className = "units-pathway-description";
      description.id = "unit-" + unit.unitIndex + "-pathway-description";
      group.setAttribute("aria-describedby", description.id);
      choices.forEach(([id, label, hint]) => {
        if (!unit.lessons.some((item) => item.lessonId === id)) return;
        const button = document.createElement("button");
        button.type = "button";
        button.dataset.pathway = id;
        button.textContent = label;
        button.setAttribute("aria-pressed", String(lesson.lessonId === id));
        button.addEventListener("click", () => {
          if (lesson.lessonId !== id) selectLesson(unit, id, { pathway: id });
        });
        group.appendChild(button);
        if (lesson.lessonId === id) description.textContent = hint;
      });
      group.appendChild(description);
    }

    function compactControls() {
      const toolbar = document.getElementById("hub-toolbar-sticky");
      if (!toolbar || toolbar.querySelector(".units-refine")) return;
      // Keep the global search and unit selector together, before lesson content.
      let desk = document.querySelector(".units-discovery");
      if (!desk) {
        desk = document.createElement("section");
        desk.className = "units-discovery";
        desk.setAttribute("aria-label", "Find a unit or lesson");
        toolbar.before(desk);
        desk.append(toolbar, nav);
      }
      const optional = Array.from(toolbar.children).filter((element) =>
        element.matches(".hub-enhance-controls, .hub-filter-chips, #hub-progress-summary"),
      );
      if (!optional.length) return;
      const details = document.createElement("details");
      details.className = "units-refine";
      const summary = document.createElement("summary");
      summary.textContent = "Filter resources & view options";
      details.append(summary, ...optional);
      toolbar.appendChild(details);
    }

    function compactLessonActions(card) {
      const unit = unitOf(card);
      const select = getSelect(card);
      const lesson = unit?.lessons[select?.selectedIndex];
      if (!lesson || !select) return;
      const info = card.querySelector(".lesson-info");
      if (!info) return;
      let heading = card.querySelector(".units-lesson-heading");
      if (!heading) {
        heading = document.createElement("h3");
        heading.className = "units-lesson-heading";
        heading.tabIndex = -1;
        card.querySelector(".selector-group--lesson").after(heading);
      }
      heading.textContent = lesson.displayTitle || lesson.title;
      lessonPathways(card, unit, lesson, heading);
      let actions = card.querySelector(".units-lesson-actions");
      if (!actions) {
        actions = document.createElement("nav");
        actions.className = "units-lesson-actions";
        actions.setAttribute("aria-label", "Selected lesson resources");
        const selector = card.querySelector(".selector-group--lesson");
        if (selector) (card.querySelector(".units-lesson-pathways") || heading).after(actions);
        else info.before(actions);
      }
      // Use the actual rendered resource links, never assume a file exists.
      const links = Array.from(info.querySelectorAll(".lesson-outline-item a[href]"));
      const lessonPath = "/lessons/" + lesson.lessonId;
      /** @type {[string, string[]][]} */
      const entries = [
        ["Open lesson", [lessonPath + "/"]],
        ["Practice", [lessonPath + "/worksheet.html", lessonPath + "-part2/worksheet.html"]],
        ["Homework", [lessonPath + "/homework.html"]],
      ];
      const signature = lesson.lessonId + links.map((link) => link.getAttribute("href")).join("|");
      if (actions.dataset.signature !== signature) {
        actions.dataset.signature = signature;
        actions.replaceChildren();
        entries.forEach(([label, paths], index) => {
          const source = paths
            .map((path) =>
              links.find((link) => {
                const url = new URL(link.getAttribute("href"), location.origin);
                return url.origin === location.origin && path === url.pathname;
              }),
            )
            .find(Boolean);
          if (!source) return;
          const link = document.createElement("a");
          link.href = studentUrl(source.getAttribute("href"));
          link.textContent = label;
          if (index === 0) link.className = "units-open-lesson";
          actions.appendChild(link);
        });
        actions.hidden = !actions.children.length;
      }
      const phases = card.querySelector(".phase-selectors");
      if (phases && !phases.closest(".units-lesson-options")) {
        const details = document.createElement("details");
        details.className = "units-lesson-options";
        const summary = document.createElement("summary");
        summary.textContent = "More lesson resources";
        phases.before(details);
        details.append(summary, phases);
      }
      const options = card.querySelector(".units-lesson-options");
      if (options && Array.from(card.querySelectorAll(".activity-select")).some((s) => s.value))
        options.open = true;
      // Copy link / Copy student launch / Print lesson / Canvas package are
      // appended to .lesson-info one at a time by three different scripts, so
      // they stacked as four full-width buttons under the resource list. One
      // labelled row keeps them together and in proportion. Idempotent: nodes
      // already inside the row are skipped.
      const utilities = Array.from(
        info.querySelectorAll(
          ":scope > .lesson-copy-link, :scope > .lesson-print-lesson, :scope > .scorm-lesson-btn",
        ),
      );
      if (utilities.length) {
        let row = info.querySelector(":scope > .units-lesson-utilities");
        if (!row) {
          row = document.createElement("div");
          row.className = "units-lesson-utilities";
          row.setAttribute("role", "group");
          row.setAttribute("aria-label", "Share and print this lesson");
          const label = document.createElement("span");
          label.className = "units-lesson-utilities__label";
          label.textContent = "Share & print";
          row.appendChild(label);
          info.appendChild(row);
        }
        utilities.forEach((node) => row.appendChild(node));
      }
      let paging = card.querySelector(".units-lesson-paging");
      if (!paging) {
        paging = document.createElement("nav");
        paging.className = "units-lesson-paging";
        paging.setAttribute("aria-label", "Lesson sequence");
        actions.after(paging);
      }
      if (paging.dataset.lessonId === String(lesson.lessonId)) return;
      paging.dataset.lessonId = String(lesson.lessonId);
      paging.replaceChildren();
      const core = unit.lessons.filter((item) => /^\d+-\d+$/.test(item.lessonId));
      const baseId = /^(\d+-\d+)/.exec(lesson.lessonId || "")?.[1];
      const position = core.findIndex((item) => item.lessonId === baseId);
      if (position < 0) {
        paging.hidden = true;
        return;
      }
      paging.hidden = false;
      const count = document.createElement("span");
      count.textContent = "Lesson " + (position + 1) + " of " + core.length;
      paging.appendChild(count);
      [-1, 1].forEach((step) => {
        const button = document.createElement("button");
        button.type = "button";
        button.textContent = step < 0 ? "Previous lesson" : "Next lesson";
        const adjacent = core[position + step];
        const pathway = /(-group[12])$/.exec(lesson.lessonId)?.[1] || "";
        const next =
          adjacent &&
          (unit.lessons.find((item) => item.lessonId === adjacent.lessonId + pathway) || adjacent);
        button.disabled = !next;
        button.addEventListener("click", () => {
          if (!next) return;
          select.value = String(unit.lessons.indexOf(next));
          select.dispatchEvent(new Event("change", { bubbles: true }));
          const replacement = card.querySelectorAll(".units-lesson-paging button")[
            step < 0 ? 0 : 1
          ];
          if (replacement && !replacement.disabled) replacement.focus({ preventScroll: true });
          else select.focus({ preventScroll: true });
        });
        paging.appendChild(button);
      });
    }

    // "Aug 24 – Sep 8 · 11 school days" under the unit title, from the same
    // generated pacing dates the dashboard's course cards use, resolved by
    // curriculum unit (the generated map is keyed by district sequence). The
    // unit being taught today is marked; earlier units are de-emphasised.
    // Decorative colour never carries the meaning.
    const STATUS_BADGE = {
      now: ["Now", "Ahora"],
      next: ["Next", "Sigue"],
      past: ["Done", "Terminada"],
    };
    function decorateUnitHeaders() {
      if (!ranges.size) return;
      cards().forEach((card, index) => {
        const unit = units[index];
        const range = unit && ranges.get(Number(unit.unitIndex));
        const meta = card.querySelector(".unit-card-meta");
        if (!range || !meta || meta.querySelector(".unit-card-dates")) return;
        const status = pacing.unitStatus(range, currentUnit, ranges);
        const line = document.createElement("p");
        line.className = "unit-card-dates";
        line.dataset.start = range.start;
        line.dataset.end = range.end;
        line.textContent =
          `Taught ${pacing.shortDate(range.start)} – ${pacing.shortDate(range.end)}` +
          (range.days > 0 ? ` · ${range.days} school day${range.days === 1 ? "" : "s"}` : "");
        const badge = STATUS_BADGE[status];
        if (badge) {
          const chip = document.createElement("span");
          chip.className = "unit-card-now unit-card-status--" + status;
          chip.textContent = badge[0] + " · ";
          const es = document.createElement("span");
          es.lang = "es";
          es.textContent = badge[1];
          chip.appendChild(es);
          line.prepend(chip, " ");
        }
        card.classList.toggle("is-current-unit", status === "now");
        card.classList.toggle("is-past-unit", status === "past");
        meta.appendChild(line);
      });
    }

    // Links to teacher surfaces (the same predicate as isTeacherSurface in
    // functions/_lib/teacher-surface.js) answer 401 to a student. They keep
    // the hub's existing treatment: hidden unless Teacher Mode is on.
    function isTeacherHref(href) {
      let url;
      try {
        url = new URL(href, location.origin);
      } catch {
        return false;
      }
      if (url.origin !== location.origin) return false;
      let path = url.pathname;
      try {
        path = decodeURIComponent(path);
      } catch {
        /* keep the raw path */
      }
      path = path.toLowerCase();
      if (/^\/(?:assets|data|api)\//.test(path)) return false;
      return (
        path.includes("teacher") ||
        path.includes("dashboard") ||
        path.includes("answer-key") ||
        path.startsWith("/curriculum/plan-notes") ||
        path.startsWith("/curriculum/planning") ||
        path.startsWith("/admin")
      );
    }
    function markTeacherOnly() {
      if (!hub.isConnected) return;
      const teacherMode = hub.ownerDocument.body.classList.contains("teacher-mode");
      hub.querySelectorAll("a[href]").forEach((link) => {
        if (!isTeacherHref(link.getAttribute("href"))) return;
        const holder = link.closest(".lesson-outline-item") || link;
        holder.classList.add("hub-teacher-only");
      });
      hub.querySelectorAll(".lesson-outline-group").forEach((group) => {
        const items = group.querySelectorAll(".lesson-outline-item");
        const teacherItems = group.querySelectorAll(".lesson-outline-item.hub-teacher-only");
        group.classList.toggle(
          "hub-teacher-only",
          items.length > 0 && items.length === teacherItems.length,
        );
      });
      // CSS cannot hide an <option> in every browser; the attribute can.
      hub.querySelectorAll("option[value]").forEach((option) => {
        const value = /** @type {HTMLOptionElement} */ (option).value;
        if (!value || !isTeacherHref(value)) return;
        option.classList.add("hub-teacher-only");
        /** @type {HTMLOptionElement} */ (option).hidden = !teacherMode;
      });
    }

    function compactUnitCards() {
      decorateUnitHeaders();
      markTeacherOnly();
      cards().forEach((card) => {
        const resources = card.querySelector(".unit-resources-row");
        if (!resources || resources.closest(".units-resource-drawer")) return;
        const details = document.createElement("details");
        details.className = "units-resource-drawer";
        const summary = document.createElement("summary");
        summary.textContent = "Unit resources & downloads";
        resources.before(details);
        details.append(summary, resources);
      });
    }

    function compactResults() {
      const panel = /** @type {HTMLElement} */ (hub.querySelector(".search-results-panel"));
      const items = panel ? Array.from(panel.querySelectorAll(".search-result-item")) : [];
      if (!panel || !items.length || panel.dataset.compactResults) return;
      panel.dataset.compactResults = "true";
      panel.classList.add("units-compact-results");
      const title = panel.querySelector("h2");
      const filter = document.querySelector('.hub-filter-chip[aria-pressed="true"]');
      if (title && !isSearching())
        title.textContent = (filter?.textContent || "Resources") + " across all units";
      const grid = document.createElement("div");
      grid.className = "units-results-grid";
      items.forEach((item) => {
        const oldHeading = item.querySelector(".search-result-header");
        if (oldHeading && oldHeading.tagName !== "H3") {
          const heading = document.createElement("h3");
          heading.className = oldHeading.className;
          heading.append(...Array.from(oldHeading.childNodes));
          oldHeading.replaceWith(heading);
        }
        // Identify the rendered lesson by its canonical title, including the
        // exact small-group suffix. Resource URLs may be shared by pathways.
        const normalize = (value) => value.replace(/\s+/g, " ").trim();
        const titleText = normalize(item.querySelector(".search-result-header")?.textContent || "");
        const matches = units.flatMap((unit) =>
          unit.lessons
            .filter((lesson) => normalize(lesson.displayTitle || lesson.title) === titleText)
            .map((lesson) => ({ unit, lesson })),
        );
        if (matches.length === 1) {
          const { unit, lesson } = matches[0];
          item.setAttribute("data-lesson-id", lesson.lessonId);
          const actions = document.createElement("div");
          actions.className = "units-result-actions";
          const primary = Array.from(item.querySelectorAll(".lesson-outline-item > a[href]")).find(
            (link) => {
              const url = new URL(link.getAttribute("href"), location.origin);
              return (
                url.origin === location.origin &&
                url.pathname === "/lessons/" + lesson.lessonId + "/" &&
                !url.searchParams.has("mode") &&
                !url.searchParams.has("extra")
              );
            },
          );
          if (primary) {
            const open = document.createElement("a");
            open.href = studentUrl(primary.getAttribute("href"));
            open.textContent = "Open lesson";
            open.setAttribute("aria-label", "Open lesson: " + lesson.title);
            actions.appendChild(open);
          }
          const detailsLink = document.createElement("a");
          const url = new URL(location.href);
          url.searchParams.delete("q");
          url.searchParams.delete("a");
          url.searchParams.set("u", String(unit.unitIndex));
          url.searchParams.set("l", lesson.lessonId);
          url.hash = "unit-" + unit.unitIndex;
          detailsLink.href = url.pathname + url.search + url.hash;
          detailsLink.textContent = "Lesson & support choices";
          detailsLink.setAttribute("aria-label", "Lesson and support choices: " + lesson.title);
          detailsLink.addEventListener("click", (event) => {
            if (event.button || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)
              return;
            event.preventDefault();
            selectLesson(unit, lesson.lessonId);
          });
          actions.appendChild(detailsLink);
          item.querySelector(".search-result-header").after(actions);
        }
        const details = document.createElement("details");
        details.className = "units-result-details";
        const summary = document.createElement("summary");
        const count = item.querySelectorAll(
          ".lesson-outline-list > .lesson-outline-item > a",
        ).length;
        summary.textContent = "Materials · " + count + (count === 1 ? " resource" : " resources");
        details.appendChild(summary);
        Array.from(item.children).forEach((child) => {
          if (
            !child.matches(
              ".search-result-unit, .search-result-header, .lesson-standard-line, .units-result-actions",
            )
          )
            details.appendChild(child);
        });
        item.appendChild(details);
        grid.appendChild(item);
      });
      const resultStatus = document.createElement("p");
      resultStatus.className = "units-results-status";
      resultStatus.setAttribute("role", "status");
      const more = document.createElement("button");
      more.type = "button";
      more.className = "units-results-more";
      let visibleCount = Math.min(8, items.length);
      const update = () => {
        items.forEach((item, index) => item.toggleAttribute("hidden", index >= visibleCount));
        resultStatus.textContent =
          "Showing " +
          visibleCount +
          " of " +
          items.length +
          " matching lessons and pathways. Expand Materials to choose a resource.";
        more.hidden = visibleCount >= items.length;
        more.textContent = "Show " + Math.min(8, items.length - visibleCount) + " more results";
      };
      more.addEventListener("click", () => {
        const next = visibleCount;
        visibleCount = Math.min(items.length, visibleCount + 8);
        update();
        /** @type {HTMLElement} */ (items[next]?.querySelector("summary"))?.focus();
      });
      update();
      panel.append(resultStatus, grid, more);
    }

    // Quick-jump pills follow the teaching order too; each keeps its #unit-N
    // anchor. They sit in a closed disclosure, so moving them shifts nothing.
    function orderUnitPills() {
      document.querySelectorAll(".unit-jump-pills").forEach((row) => {
        const pills = Array.from(row.querySelectorAll(':scope > .unit-jump-pill[href^="#unit-"]'));
        const tail = pills.length ? pills[pills.length - 1].nextSibling : null;
        ordered.forEach((unit) => {
          const pill = pills.find(
            (link) => link.getAttribute("href") === "#unit-" + unit.unitIndex,
          );
          if (!pill) return;
          const status = pacing
            ? pacing.unitStatus(ranges.get(Number(unit.unitIndex)), currentUnit, ranges)
            : "";
          pill.classList.toggle("is-past", status === "past");
          pill.classList.toggle("is-now", status === "now");
          row.insertBefore(pill, tail);
        });
      });
    }

    // A scheduled catch-up day opens its own lesson (/lessons/<id>-catchup/,
    // which validate:planning proves exists) under its core lesson's title.
    function findLesson(lessonId) {
      const coreId = lessonId.replace(/-catchup$/, "");
      for (const unit of units) {
        const exact = unit.lessons.find((item) => item.lessonId === lessonId);
        if (exact) return exact;
        const core = unit.lessons.find((item) => item.lessonId === coreId);
        if (core) return { ...core, lessonId };
      }
      return null;
    }

    function renderTodayStrip() {
      const strip = document.getElementById("units-today");
      if (!strip) return;
      if (!pacing || !pacingDays.length) {
        strip.hidden = true;
        return;
      }
      pacing.renderToday(strip, {
        days: pacingDays,
        ranges,
        today: todayIso,
        findLesson,
        lessonHref: (lesson) => studentUrl("/lessons/" + lesson.lessonId + "/"),
      });
    }

    function remember() {
      cards().forEach((card, index) => {
        const lesson = units[index]?.lessons[getSelect(card)?.selectedIndex];
        if (!lesson) return;
        const selectedActivity =
          Array.from(card.querySelectorAll(".activity-select"))
            .map((select) => /** @type {HTMLSelectElement} */ (select).value)
            .find(Boolean) || "";
        selections.set(String(units[index].unitIndex), {
          lesson: lesson.lessonId,
          activity: selectedActivity,
        });
      });
    }

    function restore() {
      // Change handlers also update the URL. Restore it after replaying state so
      // asynchronous data refreshes never silently move the user's deep link.
      const url = location.href;
      restoring = true;
      cards().forEach((card, index) => {
        const state = selections.get(String(units[index].unitIndex));
        if (!state) return;
        const select = getSelect(card);
        const lessonIndex = units[index].lessons.findIndex(
          (lesson) => lesson.lessonId === state.lesson,
        );
        if (select && lessonIndex >= 0 && select.selectedIndex !== lessonIndex) {
          select.selectedIndex = lessonIndex;
          select.dispatchEvent(new Event("change", { bubbles: true }));
        }
        // A history entry with no activity must clear a later activity too.
        card.querySelectorAll(".activity-select").forEach((other) => {
          /** @type {HTMLSelectElement} */ (other).selectedIndex = 0;
        });
        const launch = /** @type {HTMLAnchorElement} */ (card.querySelector(".btn-launch"));
        if (launch) launch.style.display = "none";
        if (state.activity) {
          for (const element of card.querySelectorAll(".activity-select")) {
            const activity = /** @type {HTMLSelectElement} */ (element);
            if (Array.from(activity.options).some((option) => option.value === state.activity)) {
              activity.value = state.activity;
              // A synthetic activity change would open the launch dialog on
              // every async refresh. Restore its visible state without launching.
              if (launch) {
                launch.href = state.activity;
                launch.textContent = "Launch: " + activity.selectedOptions[0].textContent + " →";
                launch.style.display = "";
              }
              break;
            }
          }
        }
      });
      restoring = false;
      if (location.href !== url) history.replaceState(history.state, "", url);
    }

    function sync() {
      const browsingAll = isSearching() || isFiltering();
      cards().forEach((card, index) => {
        const number = String(units[index].unitIndex);
        card.id = "unit-" + number;
        card.toggleAttribute("hidden", !browsingAll && number !== active);
        compactLessonActions(card);
      });
      picker.value = active;
      const unit = unitFor(active);
      const count = unit.lessons.filter((lesson) => /^\d+-\d+$/.test(lesson.lessonId)).length;
      const text = browsingAll
        ? "Searching and filtering across all 10 units. Choose a unit to return to browsing."
        : unit.num + " · " + count + " lessons";
      if (status.textContent !== text) status.textContent = text;
      const refineSummary = document.querySelector(".units-refine > summary");
      const filter = document.querySelector('.hub-filter-chip[aria-pressed="true"]');
      if (refineSummary)
        refineSummary.textContent = isFiltering()
          ? "Filter: " + filter.textContent + " · View options"
          : "Filter resources & view options";
      document.querySelectorAll("[data-unit-step]").forEach((button) => {
        const index =
          ordered.indexOf(unit) + Number(/** @type {HTMLElement} */ (button).dataset.unitStep);
        /** @type {HTMLButtonElement} */ (button).disabled = index < 0 || index >= ordered.length;
      });
      document.querySelectorAll('.unit-jump-pill[href^="#unit-"]').forEach((link) => {
        const selected = !browsingAll && link.getAttribute("href") === "#unit-" + active;
        link.classList.toggle("is-active", selected);
        if (selected) link.setAttribute("aria-current", "true");
        else link.removeAttribute("aria-current");
      });
      if (bottom) bottom.value = selections.get(active)?.lesson || "";
    }

    function updateUrl(push) {
      const url = new URL(location.href);
      const state = selections.get(active);
      url.searchParams.delete("q");
      url.searchParams.set("u", active);
      if (state?.lesson) url.searchParams.set("l", state.lesson);
      else url.searchParams.delete("l");
      if (state?.activity) url.searchParams.set("a", state.activity);
      else url.searchParams.delete("a");
      url.hash = "unit-" + active;
      if (url.href !== location.href) history[push ? "pushState" : "replaceState"](null, "", url);
    }

    function choose(number, options = { push: true, focus: false }) {
      if (!unitFor(number)) return;
      remember();
      active = String(number);
      const hadSearch = isSearching();
      search.value = "";
      const allChip = /** @type {HTMLButtonElement} */ (
        document.querySelector('.hub-filter-chip[data-filter="all"]')
      );
      if (isFiltering() && allChip) allChip.click();
      else if (hadSearch || !cards().length) api.renderHub();
      const clear = document.getElementById("curr-search-clear");
      if (clear) clear.hidden = true;
      restore();
      sync();
      if (options.push) updateUrl(true);
      if (hadSearch) search.dispatchEvent(new Event("input", { bubbles: true }));
      if (options.focus) {
        picker.focus({ preventScroll: true });
        nav.scrollIntoView({ block: "start", behavior: "auto" });
      }
    }

    function applyLocation() {
      const params = new URLSearchParams(location.search);
      const hash = /^#unit-(\d+)$/.exec(location.hash);
      const number = hash?.[1] || params.get("u") || params.get("l")?.split("-")[0];
      // A bare URL opens the unit being taught today on its current lesson;
      // without pacing data it is the first unit/lesson, as before.
      const fallback = unitFor(currentUnit) ? String(currentUnit) : String(units[0].unitIndex);
      active = unitFor(number) ? String(number) : fallback;
      const requestedLesson =
        params.get("l") ||
        (!unitFor(number) && unitFor(currentUnit)
          ? pacing.currentLessonId(pacingDays, todayIso, currentUnit)
          : "");
      const lesson = unitFor(active).lessons.find((item) => item.lessonId === requestedLesson);
      // A bare URL is always today's unit/lesson, even after visiting other
      // units. Resolve exact IDs so small-group and catch-up deep links stay
      // distinct.
      const requestedState = {
        lesson: lesson?.lessonId || unitFor(active).lessons[0].lessonId,
        activity: lesson ? params.get("a") || "" : "",
      };
      const query = params.get("q") || "";
      search.value = query;
      if (query) api.renderSearchResults(query.trim().toLowerCase());
      else api.renderHub();
      selections.set(active, requestedState);
      restore();
      sync();
      search.dispatchEvent(new Event("input", { bubbles: true }));
    }

    ordered.forEach((unit) => {
      const option = document.createElement("option");
      option.value = String(unit.unitIndex);
      option.textContent = unit.num + " · " + unit.name;
      picker.appendChild(option);
      if (!bottom) return;
      const group = document.createElement("optgroup");
      group.label = option.textContent;
      unit.lessons.forEach((lesson) => {
        if (!lesson.lessonId) return;
        const item = document.createElement("option");
        item.value = lesson.lessonId;
        item.textContent = lesson.displayTitle || lesson.title;
        group.appendChild(item);
      });
      bottom.appendChild(group);
    });

    // Avoid duplicate fragment targets while retaining stable no-script IDs.
    document.querySelectorAll("details.unit").forEach((unit, index) => {
      unit.id = "unit-source-" + units[index].unitIndex;
    });
    document.body.classList.add("units-nav-ready");
    nav.hidden = false;

    remember();
    const renderHub = api.renderHub;
    api.renderHub = function () {
      remember();
      if (isFiltering() && !isSearching()) return api.renderSearchResults("");
      const focused = document.activeElement;
      const focusedCard = focused?.closest(".unit-card");
      const focusId = focusedCard?.id;
      const focusPathway = focused?.getAttribute("data-pathway");
      const focusHeading = focused?.classList.contains("units-lesson-heading");
      const result = renderHub.apply(this, arguments);
      restore();
      compactUnitCards();
      sync();
      // Search debounce and late resource data can repaint the selected card
      // after navigation. Keep keyboard focus on its equivalent new control.
      if (focused && !focused.isConnected && focusId && (focusPathway || focusHeading)) {
        const replacement = document
          .getElementById(focusId)
          ?.querySelector(
            focusPathway ? '[data-pathway="' + focusPathway + '"]' : ".units-lesson-heading",
          );
        if (replacement instanceof HTMLElement) replacement.focus({ preventScroll: true });
      }
      return result;
    };
    const renderSearch = api.renderSearchResults;
    api.renderSearchResults = function () {
      remember();
      const result = renderSearch.apply(this, arguments);
      compactResults();
      markTeacherOnly();
      sync();
      return result;
    };

    picker.addEventListener("change", () => choose(picker.value));
    document.addEventListener("click", (event) => {
      const target = event.target instanceof Element ? event.target : null;
      if (target?.closest(".hub-clear-filters")) {
        // The shared empty-state button changes the field directly. Notify all
        // input listeners so the URL, clear control, and visible results agree.
        search.dispatchEvent(new Event("input", { bubbles: true }));
        search.focus();
        return;
      }
      const step = target?.closest("[data-unit-step]");
      if (step) {
        const index =
          ordered.indexOf(unitFor(active)) +
          Number(/** @type {HTMLElement} */ (step).dataset.unitStep);
        if (ordered[index]) choose(ordered[index].unitIndex);
      }
      const jump = target?.closest('.unit-jump-pill[href^="#unit-"]');
      if (jump) {
        event.preventDefault();
        choose(jump.getAttribute("href").slice(6), { push: true, focus: true });
      }
    });
    bottom?.addEventListener("change", () => {
      const lessonId = bottom.value;
      if (!lessonId) return;
      choose(lessonId.split("-")[0], { push: false, focus: true });
      selections.set(active, { lesson: lessonId, activity: "" });
      restore();
      sync();
      updateUrl(true);
      const current = document.getElementById("unit-" + active);
      getSelect(current)?.focus();
    });
    // The shared renderer replaces query parameters in its target handler.
    // Capture the previous URL first, then keep explicit selections as separate
    // history entries so Back can return to the previous lesson or activity.
    hub.addEventListener(
      "change",
      (event) => {
        if (restoring || !(event.target instanceof Element)) return;
        if (!event.target.matches(".lesson-select, .activity-select")) return;
        previousSelectionUrl = location.href;
      },
      true,
    );
    hub.addEventListener("change", (event) => {
      if (restoring || !(event.target instanceof Element)) return;
      const card = event.target.closest(".unit-card");
      if (!card) return;
      active = String(unitOf(card).unitIndex);
      remember();
      // The shared renderer owns lesson/activity query parameters; keep the
      // fragment consistent when a user selects a lesson after a unit jump.
      if (/^#unit-/.test(location.hash)) {
        const url = new URL(location.href);
        url.hash = "unit-" + active;
        history.replaceState(history.state, "", url);
      }
      const currentUrl = location.href;
      if (previousSelectionUrl && currentUrl !== previousSelectionUrl) {
        history.replaceState(history.state, "", previousSelectionUrl);
        history.pushState(null, "", currentUrl);
      }
      previousSelectionUrl = "";
      sync();
    });
    search.addEventListener("input", () => {
      const url = new URL(location.href);
      if (search.value.trim()) url.searchParams.set("q", search.value.trim());
      else url.searchParams.delete("q");
      history.replaceState(history.state, "", url);
      sync();
    });
    window.addEventListener("popstate", applyLocation);
    window.addEventListener("hashchange", () => {
      const number = /^#unit-(\d+)$/.exec(location.hash)?.[1];
      if (number) choose(number, { push: false, focus: true });
    });

    // This optional gallery used to precede search with twelve large cards.
    // A native disclosure keeps every preset available and keyboard accessible.
    const gallery = document.getElementById("ewl-workbench-preset-bar");
    if (gallery) {
      const disclosure = document.createElement("details");
      disclosure.className = "units-visual-tools";
      const summary = document.createElement("summary");
      summary.textContent = "Explore visual math tools";
      disclosure.append(summary, gallery);
      hub.after(disclosure);
    }
    // Late resource enhancements append authored practice links after the
    // initial render. Keep shortcuts in sync; changes to our nav are outside
    // .lesson-info, so this observer cannot react to its own updates.
    new MutationObserver((records) => {
      const changed = new Set();
      records.forEach((record) => {
        const target = record.target instanceof Element ? record.target : null;
        const info = target?.closest(".lesson-info");
        if (info) changed.add(info.closest(".unit-card"));
      });
      changed.forEach((card) => {
        if (card?.isConnected) compactLessonActions(card);
      });
      if (records.some((record) => record.addedNodes.length)) markTeacherOnly();
    }).observe(hub, { childList: true, subtree: true });
    // Teacher Mode toggles body.teacher-mode; keep hidden <option>s in step.
    new MutationObserver(markTeacherOnly).observe(document.body, {
      attributes: true,
      attributeFilter: ["class"],
    });
    orderUnitPills();
    renderTodayStrip();
    compactControls();
    applyLocation();
    compactUnitCards();
  }

  if (document.readyState === "loading")
    document.addEventListener("DOMContentLoaded", setupCurriculumNavSync, { once: true });
  else setupCurriculumNavSync();
})();
