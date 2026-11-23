// Step 2: where the content comes from. A lesson, a vocabulary set from the library, or only a title.
import { h } from "../../core/dom.js";
import { emptyState, gradeLabel, plural, subjectChip } from "../../core/ui.js";
import { heading } from "./controls.js";
import { sourceChoices } from "./source.js";
import { SOURCES } from "./state.js";

/**
 * ctx: { st, items, listError, onChange(what) }. `redraw(data)` repaints with the loaded source data
 * ({ lesson, vocab, entries, error }) so the word list and the chosen title are real.
 */
export function contentPicker({ st, items, listError, onChange }) {
  const box = h("section", { class: "st-step", "aria-labelledby": "st-cr-s2" });
  let data = { lesson: null, vocab: null, entries: [], error: "" };
  let q = "";
  const kind = () => (st.source === "vocab" ? "vocab" : "lesson");
  const chosenId = () => (st.source === "vocab" ? st.vocabId : st.lessonId);

  function results() {
    const list = sourceChoices(items, kind(), { grade: st.grade, subject: st.subject, q });
    if (!list.length) {
      return emptyState({
        title: listError ? "The library did not load" : "Nothing matches yet",
        body: listError
          ? "Check your connection and reload. You can still make a resource from your own title."
          : "Clear the search or the grade and subject, or choose My own title.",
      });
    }
    return h(
      "ul",
      {
        class: "st-cr-results",
        "aria-label": st.source === "vocab" ? "Vocabulary sets" : "Lessons",
      },
      list.map((it) => {
        const on = chosenId() === it.id;
        const b = h(
          "button",
          { class: "st-cr-result", type: "button", "aria-pressed": String(on) },
          h("span", { class: "st-cr-result-name" }, it.title),
          h(
            "span",
            { class: "st-meta" },
            subjectChip(it.subject),
            it.grade ? h("span", { class: "st-chip st-chip-plain" }, gradeLabel(it.grade)) : null,
          ),
        );
        b.addEventListener("click", () => {
          if (st.source === "vocab") st.vocabId = it.id;
          else st.lessonId = it.id;
          st.entryIds = null;
          if (it.grade && !st.grade) st.grade = String(it.grade);
          if (it.subject && !st.subject) st.subject = it.subject;
          onChange("source");
        });
        return h("li", {}, b);
      }),
    );
  }

  function words() {
    if (!data.entries.length) return null;
    const picked = new Set(st.entryIds || data.entries.map((e) => e.id));
    const boxes = data.entries.map((e) => {
      const cb = h("input", { type: "checkbox", id: `st-cr-w-${e.id}`, checked: picked.has(e.id) });
      cb.addEventListener("change", () => {
        const next = data.entries
          .filter((x) => (x.id === e.id ? cb.checked : picked.has(x.id)))
          .map((x) => x.id);
        if (!next.length) {
          cb.checked = true;
          return;
        }
        st.entryIds = next.length === data.entries.length ? null : next;
        onChange("entries");
      });
      return h("label", { class: "st-cr-check", for: cb.id }, cb, h("span", {}, e.word));
    });
    return h(
      "details",
      { class: "st-cr-words", open: data.entries.length <= 12 },
      h("summary", {}, `Words to include (${picked.size} of ${data.entries.length})`),
      h("div", { class: "st-cr-wordlist" }, boxes),
    );
  }

  function draw() {
    const pills = SOURCES.map((s) => {
      const b = h(
        "button",
        { class: "st-pick", type: "button", "aria-pressed": String(st.source === s.v) },
        s.label,
      );
      b.addEventListener("click", () => {
        st.source = s.v;
        st.entryIds = null;
        onChange("source");
      });
      return h("li", {}, b);
    });
    const parts = [
      heading("st-cr-s2", "2", "Choose the content"),
      h("ul", { class: "st-pills", "aria-label": "Content source" }, pills),
    ];
    if (st.source === "topic") {
      parts.push(
        h(
          "p",
          { class: "st-hint" },
          "Organizers, foldables and writing sheets can be made from a title alone. Type it under Title in step 3. Cards and task sheets need a lesson or word set.",
        ),
      );
    } else {
      const input = h("input", {
        id: "st-cr-q",
        type: "search",
        value: q,
        autocomplete: "off",
        placeholder: "Search by title, standard or word",
      });
      input.addEventListener("input", () => {
        q = input.value;
        list.replaceChildren(results());
      });
      const list = h("div", {}, results());
      const title = data.lesson?.title || data.vocab?.title;
      parts.push(
        h(
          "div",
          { class: "st-field" },
          h(
            "label",
            { for: "st-cr-q" },
            st.source === "vocab" ? "Search vocabulary sets" : "Search lessons",
          ),
          input,
        ),
        chosenId()
          ? h("p", { class: "st-cr-chosen", role: "status" }, `Using: ${title || chosenId()}`)
          : null,
        data.error ? h("p", { class: "st-error", role: "alert" }, data.error) : null,
        list,
        words(),
      );
      if (st.grade || st.subject)
        parts.push(
          h(
            "p",
            { class: "st-hint" },
            `Showing ${plural(sourceChoices(items, kind(), { grade: st.grade, subject: st.subject, q }, 999).length, "match", "matches")} for your grade and subject.`,
          ),
        );
    }
    box.replaceChildren(...parts.filter(Boolean));
    box.dataset.state = chosenId() || st.source === "topic" ? "done" : "";
  }
  draw();
  return {
    el: box,
    redraw(next) {
      if (next) data = next;
      const active = box.ownerDocument.activeElement;
      const keepFocus = active?.id === "st-cr-q";
      draw();
      if (keepFocus) box.querySelector("#st-cr-q")?.focus();
    },
  };
}
