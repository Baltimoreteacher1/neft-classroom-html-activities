// Writing Lab steps 1-3: Read & Take Notes, Because-But-So, Stretch a Sentence (sentence expansion).
import {
  feedback,
  get,
  h,
  isStarter,
  isStretch,
  lessonTag,
  markDone,
  modelReveal,
  save,
  seed,
  shuffleSeeded,
  speakBtn,
  textBox,
  wl,
  wordCount,
} from "./wl-core.js";

const SYMBOLS = [
  ["→", "leads to / causes"],
  ["=", "means / is"],
  ["+", "more / and"],
  ["−", "less"],
  ["b/c", "because"],
  ["w/", "with"],
  ["ex.", "example"],
  ["@", "at"],
];

// ---------- 1. Read & take notes ----------
export function stepNotes(root) {
  const { source, notes } = wl.w;
  root.append(
    h(
      "article",
      { class: "wl-source" },
      h(
        "div",
        { class: "wl-source__head" },
        h("h3", null, source.title),
        speakBtn(source.text, "Read to me"),
        lessonTag(source.lesson),
      ),
      ...source.text
        .split(/(?<=[.!?])\s+(?=[A-Z"])/)
        .reduce((paras, s, i, all) => {
          const per = Math.ceil(all.length / (all.length > 5 ? 2 : 1));
          const p = Math.floor(i / per);
          (paras[p] ||= []).push(s);
          return paras;
        }, [])
        .map((p) => h("p", null, p.join(" "))),
    ),
    h(
      "aside",
      { class: "wl-symbols", "aria-label": "Note-taking symbols" },
      h("strong", null, "Note-taking symbols"),
      h("ul", null, ...SYMBOLS.map(([s, m]) => h("li", null, h("b", null, s), ` ${m}`))),
    ),
  );
  const fb = feedback();
  const list = h("ol", { class: "wl-items" });
  notes.forEach((n, i) => {
    const li = h("li", { class: "wl-item" }, h("p", { class: "wl-item__q" }, n.sentence));
    if (isStarter()) {
      // Choose the best note: the real note, the whole sentence copied, and a note that changes the meaning.
      const wrong = notes[(i + 1) % notes.length].note;
      const opts = shuffleSeeded(
        [
          { t: n.note, ok: true, why: "Yes! Key words only, with symbols." },
          {
            t: n.sentence.replace(/[.!?]$/, ""),
            ok: false,
            why: "That copies the whole sentence. Notes keep only the key words.",
          },
          {
            t: wrong,
            ok: false,
            why: "That note is about a different sentence. Look for the key words in this one.",
          },
        ],
        seed(`note${i}`),
      );
      const picked = get("notes")[`p${i}`];
      const row = h("div", {
        class: "wl-choices",
        role: "group",
        "aria-label": `Best note for sentence ${i + 1}`,
      });
      for (const o of opts) {
        const b = h(
          "button",
          { type: "button", class: "st-chip wl-choice", "aria-pressed": String(picked === o.t) },
          o.t,
        );
        b.addEventListener("click", () => {
          for (const x of row.children) x.setAttribute("aria-pressed", String(x === b));
          b.classList.toggle("st-chip--ok", o.ok);
          b.classList.toggle("st-chip--no", !o.ok);
          save("notes", { [`p${i}`]: o.t });
          fb.set(o.why, o.ok ? "ok" : "no");
        });
        row.append(b);
      }
      li.append(row);
    } else {
      li.append(
        textBox({
          section: "notes",
          field: `t${i}`,
          label: `My note for sentence ${i + 1}`,
          hint: "Key words, symbols and abbreviations. No full sentence.",
          rows: 1,
          onInput: (v) => {
            const full = wordCount(v) >= wordCount(n.sentence) - 1 || /[.!?]\s*$/.test(v);
            fb.set(
              full
                ? "Make it shorter: keep only the key words, no end mark."
                : "Nice and short. That is a real note.",
              full ? "hint" : "ok",
            );
          },
        }),
        modelReveal(n.note, () => wordCount(get("notes")[`t${i}`]) >= 2, {
          label: "See a sample note",
          note: "Write your note first.",
        }),
      );
    }
    list.append(li);
  });
  root.append(
    h(
      "h3",
      { class: "wl-sub" },
      isStarter() ? "Pick the best note" : "Turn each sentence into a note",
    ),
    list,
    fb,
  );
  markDone("notes");
}

// ---------- 2. Because · But · So ----------
const CONJ = [
  { c: "because", meaning: "gives a reason" },
  { c: "but", meaning: "shows a change or a problem" },
  { c: "so", meaning: "tells what happens as a result" },
];
export function stepBBS(root) {
  root.append(
    h(
      "div",
      { class: "wl-key" },
      ...CONJ.map((x) =>
        h("span", { class: `wl-conj wl-conj--${x.c}` }, h("b", null, x.c), ` ${x.meaning}`),
      ),
    ),
  );
  wl.w.bbs.forEach((b, i) => {
    const card = h(
      "section",
      { class: "wl-item wl-bbs" },
      h(
        "div",
        { class: "wl-item__top" },
        h("p", { class: "wl-kernel" }, `${b.kernel} …`),
        lessonTag(b.lesson),
      ),
    );
    if (isStarter()) card.append(matchEndings(b, i));
    else {
      for (const x of CONJ)
        card.append(
          textBox({
            section: "bbs",
            field: `${i}${x.c}`,
            label: `${x.c[0].toUpperCase()}${x.c.slice(1)}: ${x.meaning}`,
            prefix: isStretch() ? "" : `${b.kernel} ${x.c}`,
            rows: 1,
            placeholder: isStretch()
              ? `Write the whole sentence with "${x.c}".`
              : "finish the sentence…",
          }),
        );
      card.append(
        modelReveal(
          CONJ.map((x) => `${b.kernel} ${x.c} ${b[x.c]}`).join("\n"),
          () => CONJ.filter((x) => wordCount(get("bbs")[`${i}${x.c}`]) >= 2).length >= 2,
          { note: "Finish at least two endings first." },
        ),
      );
    }
    root.append(card);
  });
  markDone("bbs");
}

// Starter: tap an ending, then tap the conjunction it belongs with.
function matchEndings(b, i) {
  const fb = feedback();
  const state = get("bbs")[`m${i}`] || {};
  let held = null;
  const endings = shuffleSeeded(
    CONJ.map((x) => ({ c: x.c, t: b[x.c] })),
    seed(`bbs${i}`),
  );
  const slots = h("div", { class: "wl-slots" });
  const pool = h("div", { class: "wl-pool", role: "group", "aria-label": "Endings" });
  const slotEls = {};
  for (const x of CONJ) {
    const out = h(
      "span",
      { class: "wl-slot__out" },
      state[x.c] ? b[x.c] : "tap an ending, then tap here",
    );
    const btn = h(
      "button",
      {
        type: "button",
        class: `wl-slot wl-conj--${x.c}${state[x.c] ? " is-filled" : ""}`,
        "aria-label": `${b.kernel} ${x.c} …`,
      },
      h("b", null, x.c),
      out,
    );
    btn.addEventListener("click", () => {
      if (!held) {
        fb.set("First tap an ending from the list.", "hint");
        return;
      }
      if (held.c === x.c) {
        btn.classList.add("is-filled");
        out.textContent = held.t;
        held.el.disabled = true;
        held.el.classList.add("st-chip--ok");
        save("bbs", { [`m${i}`]: { ...(get("bbs")[`m${i}`] || {}), [x.c]: true } });
        fb.set(`Yes! "${x.c}" ${CONJ.find((k) => k.c === x.c).meaning}.`, "ok");
      } else {
        held.el.classList.add("st-chip--no");
        fb.set(
          `Read it aloud with "${x.c}". Does it ${CONJ.find((k) => k.c === x.c).meaning}? Try another word.`,
          "no",
        );
      }
      held.el.setAttribute("aria-pressed", "false");
      held = null;
    });
    slotEls[x.c] = btn;
    slots.append(btn);
  }
  for (const e of endings) {
    const chip = h(
      "button",
      {
        type: "button",
        class: "st-chip wl-ending",
        "aria-pressed": "false",
        disabled: state[e.c] ? true : null,
      },
      e.t,
    );
    if (state[e.c]) chip.classList.add("st-chip--ok");
    chip.addEventListener("click", () => {
      for (const c of pool.children) c.setAttribute("aria-pressed", "false");
      chip.classList.remove("st-chip--no");
      chip.setAttribute("aria-pressed", "true");
      held = { ...e, el: chip };
    });
    pool.append(chip);
  }
  return h(
    "div",
    { class: "wl-match" },
    pool,
    slots,
    fb,
    speakBtn(() => CONJ.map((x) => `${b.kernel} ${x.c} ${b[x.c]}`).join(". "), "Hear all three"),
  );
}

// ---------- 3. Stretch a sentence (expansion) ----------
const ASK = {
  who: "Who?",
  what: "What?",
  when: "When?",
  where: "Where?",
  why: "Why?",
  how: "How?",
};
export function stepExpand(root) {
  wl.w.expand.forEach((e, i) => {
    const keys = Object.keys(e.parts);
    const card = h(
      "section",
      { class: "wl-item wl-expand" },
      h(
        "div",
        { class: "wl-item__top" },
        h("p", { class: "wl-kernel wl-kernel--big" }, e.kernel),
        lessonTag(e.lesson),
      ),
    );
    if (isStarter()) {
      const chosen = new Set(get("expand")[`c${i}`] || []);
      const preview = h("p", { class: "wl-preview", "aria-live": "polite" });
      const render = () => {
        const add = keys.filter((k) => chosen.has(k)).map((k) => e.parts[k]);
        preview.textContent = add.length
          ? `${e.kernel.replace(/[.!?]$/, "")} + ${add.join(" + ")}`
          : "Tap a card to add it to the sentence.";
      };
      const grid = h(
        "div",
        { class: "wl-qgrid" },
        ...keys.map((k) => {
          const b = h(
            "button",
            { type: "button", class: "wl-qcard", "aria-pressed": String(chosen.has(k)) },
            h("b", null, ASK[k]),
            h("span", null, e.parts[k]),
          );
          b.addEventListener("click", () => {
            chosen.has(k) ? chosen.delete(k) : chosen.add(k);
            b.setAttribute("aria-pressed", String(chosen.has(k)));
            save("expand", { [`c${i}`]: [...chosen] });
            render();
          });
          return b;
        }),
      );
      render();
      card.append(
        grid,
        preview,
        textBox({
          section: "expand",
          field: `s${i}`,
          label: "Now write your longer sentence",
          rows: 2,
        }),
        modelReveal(e.model, () => wordCount(get("expand")[`s${i}`]) >= wordCount(e.kernel) + 2),
      );
    } else {
      const grid = h("div", { class: "wl-qgrid wl-qgrid--write" });
      for (const k of keys)
        grid.append(
          textBox({
            section: "expand",
            field: `${i}${k}`,
            label: ASK[k],
            rows: 1,
            placeholder: isStretch() ? "" : `ex. ${e.parts[k].split(" ").slice(0, 2).join(" ")}…`,
          }),
        );
      card.append(
        grid,
        textBox({
          section: "expand",
          field: `s${i}`,
          label: "Put it together: your expanded sentence",
          hint: isStretch()
            ? "Move the parts around. Try starting with when or where."
            : "Start with the kernel, then add your answers.",
          rows: 2,
        }),
        modelReveal(e.model, () => wordCount(get("expand")[`s${i}`]) >= wordCount(e.kernel) + 3),
      );
    }
    root.append(card);
  });
  markDone("expand");
}
