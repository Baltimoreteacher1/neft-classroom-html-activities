// Writing Lab steps 4-6: Sentence or Fragment?, Appositives, Subordinating conjunctions.
import {
  capitalStart,
  endMark,
  feedback,
  get,
  h,
  isStarter,
  isStretch,
  lessonTag,
  markDone,
  modelReveal,
  save,
  speakBtn,
  startsWithWord,
  textBox,
  wl,
  wordCount,
} from "./wl-core.js";

// ---------- 4. Sentence or fragment? ----------
export function stepFragments(root) {
  root.append(
    h(
      "p",
      { class: "wl-rule" },
      h("b", null, "A sentence "),
      "has a who or what (subject) and an action (verb), and it makes sense alone. ",
      h("b", null, "A fragment "),
      "is missing a part.",
    ),
  );
  const list = h("ol", { class: "wl-items" });
  wl.w.fragments.forEach((f, i) => {
    const fb = feedback();
    const li = h(
      "li",
      { class: "wl-item wl-frag" },
      h(
        "div",
        { class: "wl-item__top" },
        h("p", { class: "wl-item__q" }, f.text),
        speakBtn(f.text, "Hear it"),
      ),
    );
    const fixHost = h("div", { class: "wl-frag__fix" });
    const answer = get("frag")[`a${i}`];
    const row = h("div", {
      class: "wl-choices",
      role: "group",
      "aria-label": `Item ${i + 1}: sentence or fragment`,
    });
    const show = (pick, quiet) => {
      const right = pick === (f.is_sentence ? "S" : "F");
      for (const b of row.children) {
        const mine = b.dataset.v === pick;
        b.setAttribute("aria-pressed", String(mine));
        b.classList.toggle("st-chip--ok", mine && right);
        b.classList.toggle("st-chip--no", mine && !right);
      }
      if (!right) {
        fb.set(
          f.is_sentence
            ? "Look again: find the who or what, and the action. Is anything missing?"
            : "Read it alone. Does it make sense, or does it leave you waiting for more?",
          "no",
        );
        fixHost.replaceChildren();
        return;
      }
      fb.set(
        f.is_sentence
          ? "Correct: it has a subject and a verb and makes sense alone."
          : "Correct: it is a fragment.",
        "ok",
      );
      fixHost.replaceChildren();
      if (!f.is_sentence) {
        if (isStarter())
          fixHost.append(
            h("p", { class: "wl-fixed" }, h("b", null, "Fixed: "), f.fix),
            speakBtn(f.fix, "Hear it"),
          );
        else
          fixHost.append(
            textBox({
              section: "frag",
              field: `f${i}`,
              label: "Fix it: write a complete sentence",
              rows: 1,
            }),
            modelReveal(f.fix, () => wordCount(get("frag")[`f${i}`]) > wordCount(f.text), {
              label: "See one fix",
            }),
          );
      }
      if (!quiet) save("frag", { [`a${i}`]: pick });
    };
    for (const [v, label] of [
      ["S", "Sentence"],
      ["F", "Fragment"],
    ]) {
      const b = h(
        "button",
        { type: "button", class: "st-chip wl-choice", "data-v": v, "aria-pressed": "false" },
        label,
      );
      b.addEventListener("click", () => show(v));
      row.append(b);
    }
    li.append(row, fb, fixHost);
    if (answer) show(answer, true);
    list.append(li);
  });
  root.append(list);
  markDone("frag");
}

// ---------- 5. Appositives ----------
export function stepAppositives(root) {
  root.append(
    h(
      "p",
      { class: "wl-rule" },
      h("b", null, "An appositive "),
      "is a phrase that renames a noun. It sits right after the noun, between commas: ",
      h("i", null, "Max, my little brother, loves crabs."),
    ),
  );
  wl.w.appositives.forEach((a, i) => {
    const fb = feedback();
    const [before, after] = a.sentence.split("___");
    const blank = h("span", { class: "wl-blank" }, get("appos")[`p${i}`] ?? "_____");
    const card = h(
      "section",
      { class: "wl-item wl-appos" },
      h(
        "div",
        { class: "wl-item__top" },
        h("p", { class: "wl-item__q" }, before, blank, after),
        lessonTag(a.lesson),
      ),
    );
    const row = h("div", {
      class: "wl-choices wl-choices--stack",
      role: "group",
      "aria-label": `Which phrase renames ${a.noun}?`,
    });
    a.options.forEach((o, k) => {
      const b = h(
        "button",
        {
          type: "button",
          class: "st-chip wl-choice",
          "aria-pressed": String(get("appos")[`p${i}`] === o),
        },
        o,
      );
      b.addEventListener("click", () => {
        for (const x of row.children) {
          x.setAttribute("aria-pressed", String(x === b));
          x.classList.remove("st-chip--ok", "st-chip--no");
        }
        const ok = k === a.answer;
        b.classList.add(ok ? "st-chip--ok" : "st-chip--no");
        blank.textContent = o;
        save("appos", { [`p${i}`]: o });
        fb.set(
          ok
            ? `Yes! "${o}" tells us more about ${a.noun}.`
            : `Does "${o}" describe ${a.noun}? Read it with the noun and try again.`,
          ok ? "ok" : "no",
        );
      });
      row.append(b);
    });
    card.append(row, fb);
    if (!isStarter())
      card.append(
        textBox({
          section: "appos",
          field: `o${i}`,
          label: isStretch()
            ? `Write your own sentence with an appositive for a different noun from the unit`
            : `Write your own appositive for ${a.noun}`,
          prefix: isStretch() ? "" : `${a.noun},`,
          rows: 1,
          onInput: (v) => {
            if (isStretch())
              fb.set(
                (v.match(/,/g) || []).length >= 2 || /,[^,]+\.$/.test(v)
                  ? "Commas in place around your appositive."
                  : "Remember the commas around the appositive.",
                "hint",
              );
          },
        }),
      );
    root.append(card);
  });
  markDone("appos");
}

// ---------- 6. Subordinating conjunctions ----------
export function stepSubordinate(root) {
  root.append(
    h(
      "p",
      { class: "wl-rule" },
      "Start with a clue word like ",
      h("b", null, "when, although, before, since, if"),
      ". The clue part cannot stand alone, so add a comma and finish with the main idea.",
    ),
  );
  wl.w.subordinate.forEach((s, i) => {
    const fb = feedback();
    const cap = `${s.conjunction[0].toUpperCase()}${s.conjunction.slice(1)}`;
    const card = h(
      "section",
      { class: "wl-item wl-sub" },
      h(
        "div",
        { class: "wl-item__top" },
        h(
          "p",
          { class: "wl-item__q" },
          h("span", { class: "wl-conj wl-conj--sub" }, h("b", null, cap)),
          " ______ , ",
          s.stem,
          ".",
        ),
        lessonTag(s.lesson),
      ),
    );
    const check = (v) => {
      const t = String(v).trim();
      if (!t) return fb.set("", "ok");
      if (isStretch()) {
        if (!startsWithWord(t, s.conjunction))
          return fb.set(`Start your sentence with "${cap}".`, "hint");
        if (!t.includes(",")) return fb.set("Add a comma after the clue part.", "hint");
        if (!endMark(t) || !capitalStart(t))
          return fb.set("Check the capital letter and the end mark.", "hint");
        return fb.set("Strong sentence: clue part, comma, main idea.", "ok");
      }
      return fb.set(
        wordCount(t) >= 3
          ? "Good. Read the whole sentence aloud to check it makes sense."
          : "Add a few more words to the clue part.",
        wordCount(t) >= 3 ? "ok" : "hint",
      );
    };
    if (isStretch())
      card.append(
        textBox({
          section: "sub",
          field: `t${i}`,
          label: `Write the whole sentence. Start with "${cap}" and end with: ${s.stem}.`,
          rows: 2,
          onInput: check,
        }),
      );
    else {
      card.append(
        textBox({
          section: "sub",
          field: `t${i}`,
          label: `Finish the clue part after "${cap}"`,
          prefix: cap,
          rows: 1,
          onInput: check,
        }),
      );
      card.append(h("p", { class: "wl-tail" }, `…, ${s.stem}.`));
    }
    if (isStarter())
      card.append(modelReveal(s.model, () => true, { label: "Need an idea? See an example" }));
    else card.append(modelReveal(s.model, () => wordCount(get("sub")[`t${i}`]) >= 3));
    card.append(fb);
    root.append(card);
  });
  markDone("sub");
}
