(() => {
  const year = new Date().getFullYear();

  document.querySelectorAll("[data-current-year]").forEach((element) => {
    element.textContent = String(year);
  });

  if (!document.body.classList.contains("pk-hub")) return;

  // Unit project pages are choice hubs, not response activities.
  window.NT_ACTIVITY = false;

  const shell = document.querySelector("main.page-shell");
  const hero = shell?.querySelector(":scope > .hero");
  if (shell && hero && !shell.querySelector(".project-hub-nav")) {
    const nav = document.createElement("nav");
    nav.className = "project-hub-nav no-print";
    nav.setAttribute("aria-label", "Project navigation");
    nav.innerHTML =
      '<a href="/curriculum/projects/">← All projects</a>' +
      '<a href="/curriculum/">Curriculum</a>' +
      '<a href="/math/projects/portfolio/">My portfolio</a>';
    shell.insertBefore(nav, hero);
  }

  // Directions must be encountered before the choice links in both reading
  // and keyboard order. The shared publisher injector owns the markup; this
  // migration keeps older already-injected hubs correct without duplicating it.
  const directions = document.getElementById("pickpath-heading")?.closest("section");
  const choices = document.getElementById("versions-heading")?.closest("section");
  if (
    directions &&
    choices &&
    directions.compareDocumentPosition(choices) & Node.DOCUMENT_POSITION_PRECEDING
  ) {
    choices.parentNode?.insertBefore(directions, choices);
  }

  const directionParagraph = directions?.querySelector(".note-panel p");
  if (directionParagraph) {
    directionParagraph.innerHTML =
      "<strong>Choose the project your teacher assigned—or the context that fits you.</strong> " +
      "Each path has its own aligned success criteria, math evidence, and final product.";
  }

  const path = location.pathname;
  shell?.querySelectorAll(".hero-illustration svg").forEach((svg) => {
    svg.setAttribute("aria-hidden", "true");
    svg.setAttribute("focusable", "false");
  });
  if (path.includes("/unit-8/")) {
    const heading = document.getElementById("versions-heading");
    if (heading) heading.textContent = "Three Project Paths";
  }

  document.querySelectorAll("a.activity-card").forEach((card) => {
    const href = card.getAttribute("href") || "";
    const kicker = card.querySelector(".card-kicker");
    if (href.includes("unit6-expression-engine")) {
      card.classList.add("optional-practice");
      if (kicker) kicker.textContent = "Optional Practice Game · Expressions";
    }
    if (href.includes("/unit-8/projects/version-c/")) {
      card.classList.add("is-stretch");
      if (kicker) kicker.textContent = "Stretch Project · Use When Assigned";
    }
    if (href.includes("/unit-10/projects/world-architect/")) {
      card.classList.add("is-stretch");
      if (kicker) kicker.textContent = "Extension Expedition · Broader Geometry";
    }
    const title = card.querySelector("h3")?.textContent?.replace(/\s+/g, " ").trim();
    const version = card.querySelector(".card-kicker")?.textContent?.replace(/\s+/g, " ").trim();
    if (title) card.setAttribute("aria-label", `${title}${version ? ` — ${version}` : ""}`);
  });

  // Keep implementation notes available to teachers without placing an answer
  // key link at the same visual level as the student choices.
  const teacher = document.getElementById("teacher-heading")?.closest("section");
  if (teacher && !teacher.closest(".project-teacher-guide")) {
    const details = document.createElement("details");
    details.className = "project-teacher-guide no-print";
    const summary = document.createElement("summary");
    summary.textContent = "Teacher guide & answer key";
    const body = document.createElement("div");
    body.className = "project-teacher-guide__body";
    while (teacher.firstChild) body.appendChild(teacher.firstChild);
    details.append(summary, body);
    teacher.replaceWith(details);
  }
})();
