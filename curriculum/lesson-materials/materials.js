/* Lesson materials are read from the same generated launch manifest as the
 * planning tools. Keep paths and availability in that manifest, not here. */
(() => {
  "use strict";
  const $ = (id) => document.getElementById(id);
  const unit = $("materials-unit");
  const lesson = $("materials-lesson");
  const status = $("materials-status");
  const result = $("materials-result");
  const groups = $("materials-groups");
  const sections = $("materials-sections");
  const definitions = [
    {
      id: "learn",
      title: "Learn & get ready",
      links: [
        ["lesson", "Interactive lesson", "Work through the lesson on this device."],
        ["readiness", "Get ready", "Review the skills that help with this lesson."],
        ["studentHelp", "Student help", "See an explanation when you get stuck."],
      ],
    },
    {
      id: "explore",
      title: "Explore the idea",
      links: [
        ["learningLab", "Learning lab", "Try the math with an interactive model."],
      ],
    },
    {
      id: "practice",
      title: "Practice & print",
      links: [
        ["guidedNotes", "Guided notes", "Follow along and record your thinking."],
        ["handout", "Lesson handout", "Keep the key ideas nearby."],
        ["worksheet", "Practice sheet A", "Practice this lesson's skill."],
        ["worksheet2", "Practice sheet B", "Try another set of problems."],
        ["worksheetLevel0", "Supported practice", "Start with extra scaffolds."],
        ["mstarWorksheet", "MSTAR practice", "Try related readiness questions."],
      ],
    },
    {
      id: "home",
      title: "At home & reflect",
      links: [
        ["homework", "Family homework", "Practice together at home."],
        ["familyPage", "Family connection", "See what this lesson is about."],
        ["exitTicket", "Reflect", "Show what you learned in the lesson."],
      ],
    },
  ];
  let lessons = [];
  let selected = null;

  function path(value) {
    return typeof value === "string" && /^\/(?!\/)[^\\\u0000-\u001f]*$/.test(value)
      ? value
      : null;
  }
  function link(href, title, description) {
    const a = document.createElement("a");
    a.className = "materials-link";
    a.href = href;
    const name = document.createElement("strong");
    name.textContent = title;
    const detail = document.createElement("span");
    detail.textContent = description;
    a.append(name, detail);
    return a;
  }
  function options(select, values, label) {
    select.replaceChildren();
    for (const [value, text] of values) {
      const option = document.createElement("option");
      option.value = value;
      option.textContent = text;
      select.append(option);
    }
    select.setAttribute("aria-label", label);
    select.disabled = false;
  }
  function choose(id, updateUrl = true) {
    const current = lessons.find((entry) => entry.id === id);
    if (!current) return;
    selected = current;
    unit.value = String(current.unit);
    fillLessons(current.unit);
    lesson.value = current.id;
    $("materials-id").textContent = `Unit ${current.unit} · Lesson ${current.id}${current.standard ? ` · ${current.standard}` : ""}`;
    $("materials-title").textContent = current.title || `Lesson ${current.id}`;
    $("materials-objective").textContent = current.objective || "";
    groups.replaceChildren();
    sections.replaceChildren();
    const resources = current.resources || {};
    let count = 0;
    for (const group of definitions) {
      const available = group.links
        .map(([key, title, description]) => [path(resources[key]), title, description])
        .filter(([href]) => href);
      if (!available.length) continue;
      const section = document.createElement("section");
      section.className = "materials-group";
      section.id = `materials-${group.id}`;
      const heading = document.createElement("h3");
      heading.textContent = group.title;
      const list = document.createElement("div");
      list.className = "materials-grid";
      for (const [href, title, description] of available) list.append(link(href, title, description));
      section.append(heading, list);
      groups.append(section);
      const jump = document.createElement("a");
      jump.href = `#${section.id}`;
      jump.textContent = group.title;
      sections.append(jump);
      count += available.length;
    }
    const index = lessons.indexOf(current);
    for (const [element, neighbor, text] of [
      [$("materials-prev"), lessons[index - 1], "← Previous lesson"],
      [$("materials-next"), lessons[index + 1], "Next lesson →"],
    ]) {
      element.hidden = !neighbor;
      if (neighbor) {
        element.href = `?lesson=${encodeURIComponent(neighbor.id)}`;
        element.textContent = `${text}: ${neighbor.id}`;
      }
    }
    result.hidden = false;
    status.textContent = `${count} materials for lesson ${current.id}.`;
    document.title = `Lesson ${current.id}: ${current.title} materials | EduWonderLab`;
    if (updateUrl) history.replaceState(null, "", `?lesson=${encodeURIComponent(current.id)}`);
  }
  function fillLessons(unitNumber) {
    options(
      lesson,
      lessons
        .filter((entry) => entry.unit === Number(unitNumber))
        .map((entry) => [entry.id, `${entry.id} · ${entry.title}`]),
      "Lesson",
    );
  }
  unit.addEventListener("change", () => {
    const first = lessons.find((entry) => entry.unit === Number(unit.value));
    if (first) choose(first.id);
  });
  lesson.addEventListener("change", () => choose(lesson.value));
  window.addEventListener("popstate", () => {
    const id = new URLSearchParams(location.search).get("lesson");
    choose(id || lessons[0]?.id, false);
  });
  fetch("/data/curriculum-launch-manifest.json")
    .then((response) => {
      if (!response.ok) throw new Error("Could not load the lesson library");
      return response.json();
    })
    .then((manifest) => {
      lessons = Array.isArray(manifest.lessons) ? manifest.lessons : [];
      if (!lessons.length) throw new Error("No lessons are available");
      const units = [...new Set(lessons.map((entry) => entry.unit))].sort((a, b) => a - b);
      options(unit, units.map((number) => [String(number), `Unit ${number}`]), "Unit");
      const requested = new URLSearchParams(location.search).get("lesson");
      choose(lessons.some((entry) => entry.id === requested) ? requested : lessons[0].id, false);
    })
    .catch(() => {
      status.textContent = "The lesson list could not load. Browse the units or try again later.";
    });
})();
