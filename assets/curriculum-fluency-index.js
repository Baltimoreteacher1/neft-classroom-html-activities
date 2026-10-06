/**
 * EduWonderLab · Grade 6 Reveal Math Fluency Index & Router
 * Interactive search, domain filtering, and seamless view routing between Index and Studio
 */
(function () {
  "use strict";

  const searchInput = document.getElementById("fluencySearchInput");
  const searchClear = document.getElementById("fluencySearchClear");
  const domainPills = document.querySelectorAll(".domain-pill");
  const unitSelect = document.getElementById("fluencyUnitSelect");
  const originSelect = document.getElementById("fluencyOriginSelect");
  const resultsCount = document.getElementById("fluencyResults");

  const tabLessons = document.getElementById("tab-lessons");
  const tabStudio = document.getElementById("tab-studio");
  const viewLessons = document.getElementById("view-lessons");
  const viewStudio = document.getElementById("view-studio");

  let activeDomain = "all";
  let activeUnit = "all";
  let activeOrigin = "all";
  let searchQuery = "";

  function getCards() {
    return Array.from(document.querySelectorAll(".fluency-lesson-card"));
  }

  function getUnits() {
    return Array.from(document.querySelectorAll(".unit-block"));
  }

  function applyFilters() {
    const q = searchQuery.trim().toLowerCase();
    const cards = getCards();
    let visibleCount = 0;

    cards.forEach((card) => {
      const cardDomain = card.getAttribute("data-domain") || "";
      const cardUnit = card.getAttribute("data-unit") || "";
      const cardOrigin = card.getAttribute("data-origin") || "";
      const text = (card.getAttribute("data-search") || card.textContent).toLowerCase();

      const matchesDomain = activeDomain === "all" || cardDomain === activeDomain;
      const matchesUnit = activeUnit === "all" || cardUnit === activeUnit;
      const matchesOrigin =
        activeOrigin === "all" ||
        (activeOrigin === "elementary" && cardOrigin.includes("elem")) ||
        (activeOrigin === "spiral" && cardOrigin.includes("spiral"));
      const matchesQuery = !q || text.includes(q);

      const isVisible = matchesDomain && matchesUnit && matchesOrigin && matchesQuery;
      card.style.display = isVisible ? "" : "none";
      if (isVisible) visibleCount++;
    });

    // Update unit block visibility
    getUnits().forEach((unit) => {
      const visibleInUnit = unit.querySelectorAll(
        ".fluency-lesson-card:not([style*='display: none'])",
      );
      unit.style.display = visibleInUnit.length > 0 ? "" : "none";
    });

    if (resultsCount) {
      resultsCount.textContent = `Showing ${visibleCount} of ${cards.length} lessons`;
    }

    if (searchClear) {
      searchClear.style.display = q ? "inline-block" : "none";
    }
  }

  // Routing between Lessons Index and Practice Studio
  function routeView() {
    const hash = window.location.hash || "";
    const params = new URLSearchParams(hash.replace(/^#/, ""));
    const isStudio =
      params.get("view") === "studio" ||
      params.has("lesson") ||
      params.has("level") ||
      params.has("mode");

    if (isStudio) {
      if (viewLessons) viewLessons.hidden = true;
      if (viewStudio) {
        viewStudio.hidden = false;
        // Inject back button at the top of studio if not already present
        if (!document.getElementById("studioBackNav")) {
          const backNav = document.createElement("div");
          backNav.id = "studioBackNav";
          backNav.className = "studio-nav-bar";
          backNav.innerHTML = `
            <a href="#view=lessons" class="btn btn-sm btn-back" id="btnBackToLessons">
              ← Back to Lessons Index (54 Lessons)
            </a>
            <span style="font-size:12.5px;color:var(--ink-3);font-weight:600">
              Interactive Practice Studio · Reveal Math Grade 6
            </span>
          `;
          viewStudio.prepend(backNav);
        }
      }
      if (tabLessons) {
        tabLessons.setAttribute("aria-selected", "false");
        tabLessons.classList.remove("active");
      }
      if (tabStudio) {
        tabStudio.setAttribute("aria-selected", "true");
        tabStudio.classList.add("active");
      }
      if (window.FluencyStudio && typeof window.FluencyStudio.render === "function") {
        window.FluencyStudio.render();
      }
    } else {
      if (viewLessons) viewLessons.hidden = false;
      if (viewStudio) viewStudio.hidden = true;
      if (tabLessons) {
        tabLessons.setAttribute("aria-selected", "true");
        tabLessons.classList.add("active");
      }
      if (tabStudio) {
        tabStudio.setAttribute("aria-selected", "false");
        tabStudio.classList.remove("active");
      }
      // If hash points to a specific unit or lesson in the index, scroll to it
      if (hash && hash !== "#view=lessons") {
        const target = document.querySelector(hash);
        if (target) {
          setTimeout(() => target.scrollIntoView({ behavior: "smooth" }), 50);
        }
      }
    }
  }

  // Event Listeners
  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      searchQuery = e.target.value;
      applyFilters();
    });
  }

  if (searchClear) {
    searchClear.addEventListener("click", () => {
      if (searchInput) searchInput.value = "";
      searchQuery = "";
      applyFilters();
      searchInput?.focus();
    });
  }

  domainPills.forEach((pill) => {
    pill.addEventListener("click", () => {
      domainPills.forEach((p) => {
        p.classList.remove("active");
        p.setAttribute("aria-pressed", "false");
      });
      pill.classList.add("active");
      pill.setAttribute("aria-pressed", "true");
      activeDomain = pill.getAttribute("data-domain") || "all";
      applyFilters();
    });
  });

  if (unitSelect) {
    unitSelect.addEventListener("change", (e) => {
      activeUnit = e.target.value;
      applyFilters();
    });
  }

  if (originSelect) {
    originSelect.addEventListener("change", (e) => {
      activeOrigin = e.target.value;
      applyFilters();
    });
  }

  if (tabLessons) {
    tabLessons.addEventListener("click", () => {
      window.location.hash = "#view=lessons";
    });
  }

  if (tabStudio) {
    tabStudio.addEventListener("click", () => {
      window.location.hash = "#view=studio";
    });
  }

  // Toggle practice drawer inside cards
  document.addEventListener("click", (e) => {
    const toggleBtn = e.target.closest("[data-toggle='practice']");
    if (!toggleBtn) return;
    const lessonId = toggleBtn.getAttribute("data-id");
    const drawer = document.getElementById(`practice-drawer-${lessonId}`);
    if (drawer) {
      const isOpen = drawer.classList.toggle("open");
      toggleBtn.setAttribute("aria-expanded", String(isOpen));
      toggleBtn.textContent = isOpen ? "Hide Practice" : "Prerequisite Practice";
    }
  });

  window.addEventListener("hashchange", routeView);
  window.addEventListener("DOMContentLoaded", () => {
    routeView();
    applyFilters();
  });

  // Run on script load in case DOM is already ready
  if (document.readyState === "interactive" || document.readyState === "complete") {
    routeView();
    applyFilters();
  }
})();
