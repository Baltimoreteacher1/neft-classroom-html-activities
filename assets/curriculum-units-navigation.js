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
    let active = String(units[0].unitIndex);
    let restoring = false;

    const unitFor = (number) => units.find((unit) => String(unit.unitIndex) === String(number));
    const cards = () => Array.from(hub.querySelectorAll(".unit-card"));
    const unitOf = (card) => units[cards().indexOf(card)];
    const getSelect = (card) =>
      /** @type {HTMLSelectElement} */ (card.querySelector(".lesson-select"));
    const isSearching = () => search.value.trim().length > 0;
    const isFiltering = () =>
      !!document.querySelector('.hub-filter-chip[aria-pressed="true"]:not([data-filter="all"])');

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
        if (state.activity) {
          for (const element of card.querySelectorAll(".activity-select")) {
            const activity = /** @type {HTMLSelectElement} */ (element);
            if (Array.from(activity.options).some((option) => option.value === state.activity)) {
              card.querySelectorAll(".activity-select").forEach((other) => {
                /** @type {HTMLSelectElement} */ (other).selectedIndex = 0;
              });
              activity.value = state.activity;
              // A synthetic activity change would open the launch dialog on
              // every async refresh. Restore its visible state without launching.
              const launch = /** @type {HTMLAnchorElement} */ (card.querySelector(".btn-launch"));
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
      });
      picker.value = active;
      const unit = unitFor(active);
      const count = unit.lessons.filter((lesson) => /^\d+-\d+$/.test(lesson.lessonId)).length;
      const text = browsingAll
        ? "Searching and filtering across all 10 units. Choose a unit to return to browsing."
        : unit.num + " · " + count + " lessons. Choose a lesson below, then open an activity.";
      if (status.textContent !== text) status.textContent = text;
      document.querySelectorAll("[data-unit-step]").forEach((button) => {
        const index =
          units.indexOf(unit) + Number(/** @type {HTMLElement} */ (button).dataset.unitStep);
        /** @type {HTMLButtonElement} */ (button).disabled = index < 0 || index >= units.length;
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
      if (unitFor(number)) active = String(number);
      const query = params.get("q") || "";
      search.value = query;
      if (query) api.renderSearchResults(query.trim().toLowerCase());
      else api.renderHub();
      if (params.get("l") && String(number) === params.get("l").split("-")[0]) {
        selections.set(active, { lesson: params.get("l"), activity: params.get("a") || "" });
        restore();
      }
      sync();
      search.dispatchEvent(new Event("input", { bubbles: true }));
    }

    units.forEach((unit) => {
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
        item.textContent = lesson.title;
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
      const result = renderHub.apply(this, arguments);
      restore();
      sync();
      return result;
    };
    const renderSearch = api.renderSearchResults;
    api.renderSearchResults = function () {
      remember();
      const result = renderSearch.apply(this, arguments);
      sync();
      return result;
    };

    picker.addEventListener("change", () => choose(picker.value));
    document.addEventListener("click", (event) => {
      const target = event.target instanceof Element ? event.target : null;
      const step = target?.closest("[data-unit-step]");
      if (step) {
        const index =
          units.indexOf(unitFor(active)) +
          Number(/** @type {HTMLElement} */ (step).dataset.unitStep);
        if (units[index]) choose(units[index].unitIndex);
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
      document.querySelector(".units-page-head").appendChild(disclosure);
    }
    applyLocation();
  }

  if (document.readyState === "loading")
    document.addEventListener("DOMContentLoaded", setupCurriculumNavSync, { once: true });
  else setupCurriculumNavSync();
})();
