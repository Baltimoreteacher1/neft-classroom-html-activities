// Prepare my class: Select class (or quick start) -> Select lesson -> Prepare. An editable list of parts, saved as a bundle.
import { renderActionBar } from "../core/actions.js";
import { h } from "../core/dom.js";
import { dominantTier } from "../core/classes.js";
import { searchItems } from "../core/search.js";
import { emptyState, gradeLabel, subjectChip } from "../core/ui.js";
import { SUBJECT_PROFILE } from "../data/taxonomy.js";
import { buildParts } from "./prepare-parts.js";

export async function render({ root, params, shell }) {
  const classes = shell.classes.listClasses();
  const st = { classId: params.class || "", lessonId: params.lesson || "", q: "", noClass: params.class === "none" };
  if (st.noClass) st.classId = "";
  let items = [];
  let manifestError = null;
  try {
    items = (await shell.catalog.manifest()).filter((i) => i.kind === "lesson");
  } catch (e) {
    manifestError = e;
  }
  const cls = () => shell.classes.getClass(st.classId);
  const step1 = h("section", { class: "st-step", "aria-labelledby": "pp-1" });
  const step2 = h("section", { class: "st-step", "aria-labelledby": "pp-2" });
  const step3 = h("section", { class: "st-step", "aria-labelledby": "pp-3" });
  root.append(h("h1", {}, "Prepare my class"), h("p", { class: "st-lede" }, "Pick a class if you have one, pick a lesson, and review what the studio assembled. Each part can be edited or removed."), step1, step2, step3);

  const sync = () => {
    const q = new URLSearchParams();
    if (st.classId) q.set("class", st.classId);
    else if (st.noClass) q.set("class", "none");
    if (st.lessonId) q.set("lesson", st.lessonId);
    shell.replaceHash(`#/prepare${q.toString() ? `?${q}` : ""}`);
  };
  const heading = (id, n, text, done) => h("h2", { id }, h("span", { class: "st-step-num", "aria-hidden": "true" }, n), text, done ? h("span", { class: "st-sr-only" }, " (done)") : null);

  function drawClass() {
    step1.dataset.state = st.classId || st.noClass ? "done" : "";
    const choose = (id, none) => {
      st.classId = id;
      st.noClass = none;
      st.lessonId = "";
      sync();
      drawAll();
    };
    const btn = (text, on, fn, subject) => {
      const b = h("button", { class: "st-pick", type: "button", "aria-pressed": String(on), "data-subject": subject }, text);
      b.addEventListener("click", fn);
      return h("li", {}, b);
    };
    step1.replaceChildren(
      heading("pp-1", "1", "Select a class"),
      h("ul", { class: "st-pills" }, [btn("No class, quick start", st.noClass, () => choose("", true)), ...classes.map((c) => btn(`${c.nickname} (${gradeLabel(c.grade)} ${SUBJECT_PROFILE[c.subject].short})`, st.classId === c.id, () => choose(c.id, false), c.subject))]),
      ...(classes.length ? [] : [h("p", { class: "st-hint" }, "No classes yet. Quick start works fine, or ", h("a", { href: "#/classes?new=1" }, "create a class profile"), ".")]),
    );
  }

  function lessonPool() {
    const c = cls();
    const p = shell.prefs.getPrefs();
    const filters = { grade: c?.grade || p.grade || "", subject: c?.subject || p.subject || "" };
    return { list: searchItems(items, st.q, filters), filters };
  }

  function drawLesson() {
    if (!st.classId && !st.noClass) {
      step2.replaceChildren();
      return;
    }
    step2.dataset.state = st.lessonId ? "done" : "";
    const { filters } = lessonPool();
    const input = h("input", { id: "pp-q", type: "search", value: st.q, placeholder: "Search by title, standard or vocabulary word", autocomplete: "off" });
    input.addEventListener("input", () => {
      st.q = input.value;
      drawList();
    });
    const results = h("div", {});
    const drawList = () => {
      const { list: now } = lessonPool();
      const ul = h(
        "ul",
        { class: "st-results" },
        now.slice(0, 12).map((l) => {
          const b = h("button", { class: "st-btn", type: "button", "aria-pressed": String(st.lessonId === l.id) }, st.lessonId === l.id ? "Chosen" : "Choose this lesson");
          b.addEventListener("click", () => {
            st.lessonId = l.id;
            sync();
            drawAll();
            shell.announce("Lesson chosen. Assembling the parts.");
          });
          return h("li", {}, h("article", { class: "st-card" }, h("h3", { class: "st-card-title" }, l.title), h("p", { class: "st-meta" }, subjectChip(l.subject), l.grade ? h("span", { class: "st-chip st-chip-plain" }, gradeLabel(l.grade)) : null, l.duration ? h("span", { class: "st-chip st-chip-plain" }, `${l.duration} min`) : null), l.lo ? h("p", { class: "st-lo" }, l.lo) : null, h("p", { class: "st-row" }, b)));
        }),
      );
      results.replaceChildren(now.length ? ul : emptyState({ title: manifestError ? "The lesson library did not load" : "No lessons match yet", body: manifestError ? "Check your connection and reload this page." : "Clear the search, or look for lessons in Find. Studio lessons are added over time for every grade and subject.", actions: [h("a", { class: "st-btn", href: `#/find${filters.grade ? `?grade=${filters.grade}${filters.subject ? `&subject=${filters.subject}` : ""}` : ""}` }, "Open Find")] }));
    };
    step2.replaceChildren(
      heading("pp-2", "2", "Select a lesson"),
      ...(filters.grade || filters.subject ? [h("p", { class: "st-hint" }, `Showing ${[filters.grade && gradeLabel(filters.grade), filters.subject && SUBJECT_PROFILE[filters.subject].short].filter(Boolean).join(" ")} lessons.`)] : []),
      h("div", { class: "st-field" }, h("label", { for: "pp-q" }, "Search lessons"), input),
      results,
    );
    drawList();
  }

  async function drawPrepare() {
    const mine = Symbol();
    drawPrepare.token = mine;
    if (!st.lessonId) {
      step3.replaceChildren();
      return;
    }
    step3.replaceChildren(heading("pp-3", "3", "Prepare"), h("p", { class: "st-loading", role: "status" }, "Assembling your lesson"));
    let lesson;
    let parts;
    try {
      lesson = await shell.catalog.lesson(st.lessonId);
      parts = await buildParts(lesson, cls(), shell.catalog);
    } catch {
      if (drawPrepare.token !== mine) return;
      const retry = h("button", { class: "st-btn", type: "button" }, "Try again");
      retry.addEventListener("click", drawPrepare);
      step3.replaceChildren(heading("pp-3", "3", "Prepare"), h("div", { class: "st-notice", role: "alert" }, "That lesson did not load. ", retry));
      return;
    }
    if (drawPrepare.token !== mine) return;
    const ref = { kind: "lesson", id: lesson.id, title: lesson.title, grade: lesson.grade, subject: lesson.subject };
    shell.library.addRecent(ref);
    paintParts(lesson, parts, ref);
  }

  function paintParts(lesson, parts, ref) {
    const removed = new Set();
    const list = h("ul", { class: "st-parts", "aria-label": `Parts of ${lesson.title}` });
    const restore = h("button", { class: "st-btn st-btn-quiet", type: "button" }, "Restore removed parts");
    restore.hidden = true;
    restore.addEventListener("click", () => {
      removed.clear();
      draw();
    });
    const draw = () => {
      list.replaceChildren(...parts.filter((p) => !removed.has(p.key)).map((p) => partItem(p)));
      restore.hidden = !removed.size;
      if (!list.children.length) list.append(h("li", {}, emptyState({ title: "Every part was removed", body: "Restore the parts to continue." })));
    };
    function partItem(p) {
      const lines = p.text.split("\n").filter(Boolean);
      const body = lines.length > 1 ? h("ul", { class: "st-lines" }, lines.map((l) => h("li", {}, l))) : h("p", {}, p.text);
      const edit = h("button", { class: "st-btn", type: "button" }, `Edit ${p.label}`);
      const drop = h("button", { class: "st-btn st-btn-danger", type: "button" }, `Remove ${p.label}`);
      let ta = null;
      edit.addEventListener("click", () => {
        if (ta) {
          p.text = ta.value.trim() || p.text;
          return draw();
        }
        ta = h("textarea", { "aria-label": `Edit ${p.label}`, rows: "5" });
        ta.value = p.text;
        body.replaceWith(ta);
        edit.textContent = `Save ${p.label}`;
        ta.focus();
      });
      drop.addEventListener("click", () => {
        removed.add(p.key);
        shell.announce(`${p.label} removed.`);
        draw();
        restore.focus();
      });
      const extra = [];
      if (p.href) extra.push(h("a", { class: "st-btn", href: p.href }, p.hrefLabel || "Open"));
      if (p.activityId) {
        const go = h("button", { class: "st-btn", type: "button" }, "Open activity");
        go.addEventListener("click", () => shell.openActivity(p.activityId, { tier: cls() ? dominantTier(cls()) : undefined, lessonId: lesson.id }));
        extra.push(go);
      }
      return h("li", {}, h("article", { class: "st-part" }, h("h3", {}, p.label), body, h("p", { class: "st-row" }, extra, edit, drop)));
    }
    const name = h("input", { id: "pp-bundle", type: "text", maxlength: "80", value: `${lesson.title}${cls() ? ` for ${cls().nickname}` : ""}`.slice(0, 80), autocomplete: "off" });
    const save = h("button", { class: "st-btn st-btn-primary", type: "button" }, "Save as bundle");
    const done = h("p", { class: "st-hint", role: "status" });
    save.addEventListener("click", () => {
      const items = [ref, ...parts.filter((p) => !removed.has(p.key)).map((p) => ({ kind: "part", id: `${lesson.id}:${p.key}`, title: p.label, lessonId: lesson.id, label: p.label, text: p.text, href: p.activityId ? shell.library.playUrl(p.activityId, { lessonId: lesson.id }) : p.href || "" }))];
      const b = shell.library.createBundle(name.value.trim() || lesson.title, items);
      done.replaceChildren(`Saved "${b.name}" with ${items.length - 1} parts. `, h("a", { href: "#/library" }, "Open your library"));
      shell.announce(`Saved bundle ${b.name}.`);
    });
    step3.replaceChildren(
      heading("pp-3", "3", "Prepare"),
      h("h3", { class: "st-card-title" }, lesson.title),
      h("p", { class: "st-meta" }, subjectChip(lesson.subject), lesson.grade ? h("span", { class: "st-chip st-chip-plain" }, gradeLabel(lesson.grade)) : null, h("a", { href: `#/lesson/${encodeURIComponent(lesson.id)}` }, "Open the full lesson")),
      renderActionBar(ref, shell, { lessonId: lesson.id }),
      list,
      h("p", { class: "st-row" }, restore),
      h("div", { class: "st-field" }, h("label", { for: "pp-bundle" }, "Bundle name"), name),
      h("p", { class: "st-row" }, save),
      done,
    );
    draw();
  }

  function drawAll() {
    drawClass();
    drawLesson();
    drawPrepare();
  }
  drawAll();
}
