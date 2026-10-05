/** Filter the already-rendered index; every resource works without JavaScript. */
(() => {
  const form = document.querySelector(".eh-filters");
  if (!form) return;
  const search = document.getElementById("help-search");
  const unitSelect = document.getElementById("help-unit");
  const units = [...document.querySelectorAll(".eh-unit")];
  const count = document.getElementById("help-count");
  const empty = document.getElementById("help-empty");
  let announcement;
  const normalize = (value) =>
    value
      .toLowerCase()
      .replace(/(\d+)[.-](\d+)/g, "$1-$2")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");

  function filter() {
    const terms = normalize(search.value.trim()).split(/\s+/).filter(Boolean);
    let visible = 0;
    for (const unit of units) {
      let matches = 0;
      for (const lesson of unit.querySelectorAll("[data-lesson]")) {
        const text = normalize(lesson.dataset.search);
        lesson.hidden =
          Boolean(unitSelect.value && unit.dataset.unit !== unitSelect.value) ||
          !terms.every((term) => text.includes(term));
        if (!lesson.hidden) matches++;
      }
      unit.hidden = matches === 0;
      visible += matches;
    }
    empty.hidden = visible !== 0;
    clearTimeout(announcement);
    announcement = setTimeout(() => {
      count.textContent = `${visible} ${visible === 1 ? "lesson" : "lessons"} found.`;
    }, 200);
  }

  form.hidden = false;
  form.addEventListener("submit", (event) => event.preventDefault());
  search.addEventListener("input", filter);
  unitSelect.addEventListener("change", filter);
  form.addEventListener("reset", () => setTimeout(filter, 0));
  // Unit links clear a conflicting search before following the native anchor.
  document.querySelector(".eh-jumps").addEventListener("click", (event) => {
    if (!event.target.closest("a")) return;
    search.value = "";
    unitSelect.value = "";
    filter();
  });
})();
