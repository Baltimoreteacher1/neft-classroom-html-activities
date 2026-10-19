(() => {
  "use strict";
  const $ = (id) => document.getElementById(id);
  const unit = $("teacher-unit");
  const lesson = $("teacher-lesson");
  const status = $("teacher-status");
  const groups = $("teacher-groups");
  let lessons = [];

  function fill(select, values) {
    select.replaceChildren(...values.map(([value, label]) => {
      const option = document.createElement("option");
      option.value = value;
      option.textContent = label;
      return option;
    }));
    select.disabled = false;
  }

  function fillLessons(number) {
    fill(lesson, lessons.filter((entry) => entry.unit === Number(number)).map((entry) => [entry.id, `${entry.id} · ${entry.title}`]));
  }

  function cards(items) {
    const grid = document.createElement("div");
    grid.className = "materials-grid";
    for (const item of items) {
      const link = document.createElement("a");
      link.className = "materials-link";
      link.href = item.href;
      const title = document.createElement("strong");
      title.textContent = item.title;
      link.append(title);
      grid.append(link);
    }
    return grid;
  }

  function choose(id, updateUrl = true) {
    const current = lessons.find((entry) => entry.id === id);
    if (!current) return;
    unit.value = String(current.unit);
    fillLessons(current.unit);
    lesson.value = current.id;
    $("teacher-id").textContent = `Unit ${current.unit} · Lesson ${current.id}${current.standard ? ` · ${current.standard}` : ""}`;
    $("teacher-title").textContent = current.title;
    $("teacher-student").href = `/curriculum/lesson-materials/?lesson=${encodeURIComponent(id)}`;
    groups.replaceChildren();
    let count = 0;
    for (const [key, title] of [["plan", "Plan and teach"], ["keys", "Answer keys"], ["unit", "Unit materials"]]) {
      const items = current.groups[key] || [];
      if (!items.length) continue;
      const section = document.createElement("section");
      section.className = "materials-group";
      const heading = document.createElement("h3");
      heading.textContent = title;
      section.append(heading, cards(items));
      groups.append(section);
      count += items.length;
    }
    const publisher = current.groups.publisher || [];
    if (publisher.length) {
      const details = document.createElement("details");
      details.className = "teacher-publisher";
      const summary = document.createElement("summary");
      summary.textContent = `Publisher teacher documents (${publisher.length})`;
      details.append(summary, cards(publisher));
      groups.append(details);
      count += publisher.length;
    }
    if (current.variants?.length) {
      const details = document.createElement("details");
      details.className = "teacher-publisher";
      const summary = document.createElement("summary");
      summary.textContent = `Small groups, catch-up, and Part 2 (${current.variants.length} pathways)`;
      details.append(summary);
      for (const variant of current.variants) {
        const section = document.createElement("section");
        section.className = "teacher-variant";
        const heading = document.createElement("h3");
        heading.textContent = `${variant.title} · ${variant.id}`;
        section.append(heading, cards(variant.links));
        details.append(section);
        count += variant.links.length;
      }
      groups.append(details);
    }
    const index = lessons.indexOf(current);
    for (const [name, neighbor, prefix] of [["teacher-prev", lessons[index - 1], "← Previous"], ["teacher-next", lessons[index + 1], "Next →"]]) {
      const anchor = $(name);
      anchor.hidden = !neighbor;
      if (neighbor) {
        anchor.href = `?lesson=${encodeURIComponent(neighbor.id)}`;
        anchor.textContent = `${prefix}: ${neighbor.id}`;
      }
    }
    $("teacher-result").hidden = false;
    status.textContent = `${count} teacher materials for lesson ${id}.`;
    document.title = `Lesson ${id} teacher materials | EduWonderLab`;
    if (updateUrl) history.replaceState(null, "", `?lesson=${encodeURIComponent(id)}`);
  }

  unit.addEventListener("change", () => {
    const first = lessons.find((entry) => entry.unit === Number(unit.value));
    if (first) choose(first.id);
  });
  lesson.addEventListener("change", () => choose(lesson.value));
  window.addEventListener("popstate", () => choose(new URLSearchParams(location.search).get("lesson") || lessons[0]?.id, false));
  fetch("./materials.json")
    .then((response) => { if (!response.ok) throw new Error("Teacher index unavailable"); return response.json(); })
    .then((data) => {
      lessons = Array.isArray(data.lessons) ? data.lessons : [];
      if (!lessons.length) throw new Error("No teacher materials available");
      fill(unit, [...new Set(lessons.map((entry) => entry.unit))].sort((a, b) => a - b).map((number) => [String(number), `Unit ${number}`]));
      const requested = new URLSearchParams(location.search).get("lesson");
      choose(lessons.some((entry) => entry.id === requested) ? requested : lessons[0].id, false);
    })
    .catch(() => { status.textContent = "Teacher materials could not load. Try the activity guides or return to Teacher Tools."; });
})();
