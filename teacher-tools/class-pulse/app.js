/* Class Pulse page: read pasted codes, show the pull list, heat table and groups, print hinge cards.
   Everything stays in this page: nothing is stored, sent, or fetched except the generated hinge-index.json next to it. */
import {
  analyze,
  cardLessons,
  FOCUS_LABEL,
  hingeCard,
  MAX_CODES,
  parseCodes,
} from "./analysis.mjs";

const core = window.StudioPulseCore;
const $ = (/** @type {string} */ sel) => /** @type {any} */ (document.querySelector(sel));

/** Build an element: attrs {class, text, on*}, then children (strings or nodes). */
function h(
  /** @type {string} */ tag,
  /** @type {Record<string, any>} */ attrs = {},
  /** @type {any[]} */ ...kids
) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v === null || v === undefined || v === false) continue;
    if (k === "class") el.className = v;
    else if (k === "text") el.textContent = v;
    else if (k.startsWith("on")) el.addEventListener(k.slice(2), v);
    else el.setAttribute(k, v === true ? "" : v);
  }
  for (const kid of kids.flat())
    if (kid !== null && kid !== undefined && kid !== false) el.append(kid);
  return el;
}

let index = /** @type {any} */ (null);
let result = /** @type {any} */ (null);
let demo = false;
/** @type {Record<number, string>} */
const labels = {};
/** @type {{lesson: string, which: number}[]} */
let cards = [];

const who = (/** @type {number} */ n) => (labels[n] || "").trim() || `Student ${n}`;
const modeWord = (/** @type {string} */ m) => (m === "challenge" ? "Challenge" : "Practice");
const times = (/** @type {number} */ n) => (n === 1 ? "1 time" : `${n} times`);
const plural = (
  /** @type {number} */ n,
  /** @type {string} */ one,
  /** @type {string} */ many = `${one}s`,
) => `${n} ${n === 1 ? one : many}`;
const link = (/** @type {{href: string, label: string}} */ l) =>
  h("a", { href: l.href, target: "_blank", rel: "noopener", text: l.label });

/* ---- index ---------------------------------------------------------------------------------------------- */
async function loadIndex() {
  try {
    const r = await fetch("hinge-index.json");
    if (!r.ok) throw new Error(String(r.status));
    index = await r.json();
  } catch (_e) {
    index = null;
    say(
      "The list of misconception names did not load, so they will show as unknown. Everything else still works.",
      true,
    );
  }
  const sel = $("#card-lesson");
  for (const id of cardLessons(index))
    sel.append(h("option", { value: id, text: `${id} · ${index.lessons[id].title}` }));
}

function say(/** @type {string} */ msg, /** @type {boolean} */ error = false) {
  const s = $("#status");
  s.textContent = msg;
  s.classList.toggle("error", error);
}

/* ---- reading ---------------------------------------------------------------------------------------------- */
function read(/** @type {{isDemo?: boolean}} */ opts = {}) {
  if (!core) return say("The code reader did not load. Reload this page.", true);
  demo = !!opts.isDemo;
  const parsed = parseCodes($("#codes").value, core.decode);
  const list = $("#problems");
  list.replaceChildren(
    ...parsed.problems.map((p) => h("li", { text: `Line ${p.line} (${p.text}) ${p.message}.` })),
  );
  list.hidden = !parsed.problems.length;
  if (!parsed.entries.length) {
    $("#results").hidden = true;
    return say(
      parsed.problems.length
        ? "No code could be read. Check the lines below."
        : "Paste at least one class code, then press Read codes.",
      true,
    );
  }
  result = analyze(parsed.entries, index);
  for (const n of Object.keys(labels))
    if (Number(n) > parsed.entries.length) delete labels[Number(n)];
  const bits = [`Read ${plural(parsed.entries.length, "code")}`];
  if (parsed.problems.length) bits.push(`${plural(parsed.problems.length, "line")} need a look`);
  if (parsed.over) bits.push(`only the first ${MAX_CODES} are used`);
  if (parsed.ignored) bits.push(`${plural(parsed.ignored, "other line")} skipped`);
  say(`${bits.join(". ")}.`, !!parsed.problems.length);
  render();
  $("#demo-note").hidden = !demo;
  $("#btn-card-class").disabled = !index;
  $("#results").hidden = false;
  $("#results-h").focus({ preventScroll: false });
}

/* ---- rendering --------------------------------------------------------------------------------------------- */
function render() {
  renderStats();
  renderRoster();
  renderViews();
}
function renderViews() {
  renderPull();
  renderLook();
  renderHeat();
  renderProgress();
}

function renderStats() {
  const r = result;
  const stat = (/** @type {string} */ label, /** @type {number} */ n) =>
    h("div", {}, h("dt", { text: label }), h("dd", { text: String(n) }));
  $("#stats").replaceChildren(
    stat("Codes read", r.students.length),
    stat("Lessons", r.lessons.length),
    stat(
      "Met a named misconception",
      r.students.filter((/** @type {any} */ s) => s.traps.length).length,
    ),
    stat("Certain but wrong", r.groups.certain.length),
    stat("Solved by elimination", r.groups.eliminated.length),
    stat("Need you", r.groups.teacher.length),
  );
}

function renderRoster() {
  $("#roster").replaceChildren(
    ...result.students.map((/** @type {any} */ s) => {
      const id = `lab-${s.n}`;
      return h(
        "li",
        {},
        h("label", { for: id, text: `Student ${s.n} · ${s.lesson} ${modeWord(s.mode)}` }),
        h("input", {
          id,
          type: "text",
          value: labels[s.n] || "",
          maxlength: "40",
          autocomplete: "off",
          oninput: (/** @type {any} */ e) => {
            labels[s.n] = e.target.value;
            renderViews();
          },
        }),
      );
    }),
  );
}

function renderPull() {
  const groups = result.pull.filter((/** @type {any} */ g) => g.students.length >= 2);
  const solos = result.pull.filter((/** @type {any} */ g) => g.students.length < 2);
  const host = $("#pull");
  host.replaceChildren();
  if (!result.pull.length) {
    host.append(
      h("p", {
        class: "empty",
        text: result.unknownTraps
          ? "These codes name misconceptions this page does not know. Reload it, or ask for the index to be regenerated."
          : "No named misconception in these codes. That is a good sign, or the students were not stuck on the same thing.",
      }),
    );
    return;
  }
  if (groups.length)
    host.append(
      h("h3", { text: "Pull together" }),
      h(
        "ul",
        { class: "pull-list" },
        groups.map((/** @type {any} */ g) =>
          h(
            "li",
            { class: "pull-card" },
            h(
              "h3",
              {},
              g.name,
              h("small", {
                text: `${plural(g.students.length, "student")} · ${times(g.misses)} in all`,
              }),
            ),
            h("p", {
              class: "who",
              text: g.students
                .map((/** @type {any} */ s) => `${who(s.n)} (${times(s.count)})`)
                .join(", "),
            }),
            g.fix ? h("p", { class: "idea" }, h("strong", { text: "Reteach: " }), g.fix) : null,
            g.links.length
              ? h(
                  "ul",
                  { class: "practice-links" },
                  g.links.map((/** @type {any} */ l) => h("li", {}, link(l))),
                )
              : null,
          ),
        ),
      ),
    );
  if (solos.length)
    host.append(
      h("h3", { text: groups.length ? "One student each" : "Each seen once" }),
      h(
        "ul",
        { class: "solo-list" },
        solos.map((/** @type {any} */ g) =>
          h(
            "li",
            {},
            h("strong", { text: g.name }),
            `: ${g.students.map((/** @type {any} */ s) => `${who(s.n)} (${times(s.count)})`).join(", ")}`,
            g.links[0] ? [" · ", link(g.links[0])] : null,
          ),
        ),
      ),
    );
  if (result.unknownTraps)
    host.append(
      h("p", {
        class: "hint",
        text: `${plural(result.unknownTraps, "misconception")} in these codes could not be named.`,
      }),
    );
}

function renderLook() {
  const box = (
    /** @type {string} */ title,
    /** @type {string} */ what,
    /** @type {any[]} */ rows,
  ) =>
    h(
      "section",
      { class: "look-box" },
      h("h3", {}, title, h("span", { text: String(rows.length) })),
      h("p", { class: "what", text: what }),
      rows.length
        ? h(
            "ul",
            { class: "look-list" },
            rows.map((r) =>
              h(
                "li",
                {},
                h("strong", { text: who(r.n) }),
                ` · ${r.lesson} ${modeWord(r.mode)} · ${plural(r.count, "answer")}`,
                r.places.length
                  ? h(
                      "ul",
                      { class: "practice-links" },
                      r.places.map((/** @type {any} */ f) =>
                        h(
                          "li",
                          {},
                          link({ href: f.href, label: f.label }),
                          ` (${FOCUS_LABEL[/** @type {keyof typeof FOCUS_LABEL} */ (f.kind)]})`,
                        ),
                      ),
                    )
                  : null,
              ),
            ),
          )
        : h("p", { class: "empty", text: "No one." }),
    );
  const g = result.groups;
  $("#look").replaceChildren(
    h(
      "div",
      { class: "look-grid" },
      box(
        "Certain but wrong",
        "Picked Certain, then missed on the first try. A mistake that feels like a fact.",
        g.certain,
      ),
      box(
        "Solved by elimination",
        "Needed two or more misses before the answer. They have not shown it on their own yet.",
        g.eliminated,
      ),
      box(
        "Needs the teacher",
        "Closed with a flag: a fresh problem did not show the skill, or there was no fresh problem to give.",
        g.teacher,
      ),
    ),
  );
}

function renderHeat() {
  const host = $("#heat");
  host.replaceChildren();
  if (!result.heat.length)
    return host.append(h("p", { class: "empty", text: "No named misconceptions to chart." }));
  for (const lesson of result.heat)
    host.append(
      h(
        "div",
        { class: "table-wrap" },
        h(
          "table",
          {},
          h("caption", {
            text: `${lesson.lesson} ${modeWord(lesson.mode)}${lesson.title ? ` · ${lesson.title}` : ""} · ${plural(lesson.students, "student")}`,
          }),
          h(
            "thead",
            {},
            h(
              "tr",
              {},
              h("th", { scope: "col", text: "Misconception" }),
              h("th", { scope: "col", class: "num", text: "Students" }),
              h("th", { scope: "col", class: "num", text: "Misses" }),
            ),
          ),
          h(
            "tbody",
            {},
            lesson.rows.map((/** @type {any} */ row) =>
              h(
                "tr",
                {},
                h("td", { text: row.name }),
                h("td", { class: "num", text: String(row.students) }),
                h(
                  "td",
                  { class: "num" },
                  h("span", {
                    class: "heat-bar",
                    "aria-hidden": "true",
                    style: `width:${Math.round((100 * row.misses) / lesson.max)}px`,
                  }),
                  String(row.misses),
                ),
              ),
            ),
          ),
        ),
      ),
    );
}

function renderProgress() {
  const seal = (/** @type {number[]} */ s) =>
    s.some(Boolean) ? `${s[0]} bronze, ${s[1]} silver, ${s[2]} gold` : "none";
  $("#progress").replaceChildren(
    h(
      "div",
      { class: "table-wrap" },
      h(
        "table",
        {},
        h("caption", { class: "sr-only", text: "Each student's progress" }),
        h(
          "thead",
          {},
          h(
            "tr",
            {},
            ["Student", "Lesson", "Done", "Sections", "Clean", "Assisted", "Guessed", "Seals"].map(
              (c, k) => h("th", { scope: "col", class: k >= 4 && k < 7 ? "num" : null, text: c }),
            ),
          ),
        ),
        h(
          "tbody",
          {},
          result.students.map((/** @type {any} */ s) =>
            h(
              "tr",
              {},
              h("th", { scope: "row", text: who(s.n) }),
              h("td", { text: `${s.lesson} ${modeWord(s.mode)}` }),
              h("td", { text: s.total ? `${s.done} of ${s.total}` : String(s.done) }),
              h("td", {
                text: s.sections
                  .map((/** @type {any} */ x) => (x.of === null ? x.done : `${x.done}/${x.of}`))
                  .join(" · "),
              }),
              h("td", { class: "num", text: s.u4 ? "n/a" : String(s.clean) }),
              h("td", { class: "num", text: s.u4 ? "n/a" : String(s.assisted) }),
              h("td", { class: "num", text: s.u4 ? "n/a" : String(s.guessed) }),
              h("td", { text: s.u4 ? "n/a" : seal(s.seals) }),
            ),
          ),
        ),
      ),
    ),
    result.students.some((/** @type {any} */ s) => s.u4)
      ? h("p", {
          class: "hint",
          text: "Unit 4 studios do not record clean, assisted or guessed answers, so those columns read n/a.",
        })
      : null,
  );
}

/* ---- hinge cards ---------------------------------------------------------------------------------------------- */
function renderCards() {
  const host = $("#cards");
  host.replaceChildren(
    ...cards.map((c, k) => {
      const card = hingeCard(index, c.lesson, c.which);
      if (!card)
        return h("p", { class: "empty", text: `Lesson ${c.lesson} has no hinge question.` });
      return h(
        "article",
        { class: "hc-card", "aria-label": `Hinge card for lesson ${c.lesson}` },
        h(
          "header",
          {},
          h("span", { text: `Lesson ${card.lesson} · ${card.title}` }),
          h("span", { text: "Circle one" }),
        ),
        card.context ? h("p", { class: "hc-work", text: card.context }) : null,
        card.work.map((/** @type {string} */ w) => h("p", { class: "hc-work", text: w })),
        h("p", { class: "hc-q", text: card.question }),
        h(
          "ol",
          { class: "hc-options" },
          card.options.map((/** @type {any} */ o) =>
            h(
              "li",
              {},
              h("span", { class: "hc-letter", text: o.letter }),
              h("span", { text: o.text }),
            ),
          ),
        ),
        h(
          "aside",
          { class: "hc-key", "aria-label": "Teacher key" },
          h("h4", { text: "Teacher key" }),
          h(
            "ul",
            {},
            card.options.map((/** @type {any} */ o) =>
              h(
                "li",
                {},
                h("strong", { text: `${o.letter}: ` }),
                o.correct ? "Correct." : o.trap ? `${o.trap.name}. ${o.trap.fix}` : "Not tagged.",
              ),
            ),
          ),
          h("p", { text: `From ${card.source}.` }),
        ),
        h(
          "div",
          { class: "cp-actions no-print" },
          card.of > 1
            ? h("button", {
                class: "btn btn-sm",
                type: "button",
                text: `Another question (${card.which + 1} of ${card.of})`,
                onclick: () => {
                  c.which++;
                  renderCards();
                },
              })
            : null,
          h("button", {
            class: "btn btn-sm",
            type: "button",
            text: "Remove",
            onclick: () => {
              cards.splice(k, 1);
              renderCards();
            },
          }),
        ),
      );
    }),
  );
}
function addCard(/** @type {string} */ lesson) {
  if (!lesson || cards.some((c) => c.lesson === lesson)) return;
  cards.push({ lesson, which: 0 });
  renderCards();
}

/* ---- print --------------------------------------------------------------------------------------------------- */
function print(/** @type {"results"|"cards"} */ what) {
  document.body.dataset.print = what;
  const done = () => {
    delete document.body.dataset.print;
    window.removeEventListener("afterprint", done);
  };
  window.addEventListener("afterprint", done);
  window.print();
}

/* ---- made-up example -------------------------------------------------------------------------------------------- */
/** Seven invented students on the first two lessons that name several misconceptions. Never real data. */
function exampleCodes() {
  if (!index || !core) return "";
  const rich = Object.entries(index.lessons)
    .map(([id, L]) => [id, Object.keys(/** @type {any} */ (L).items)])
    .filter(([, traps]) => traps.length >= 3)
    .slice(0, 2);
  if (!rich.length) return "";
  const stud = (/** @type {number} */ k, /** @type {any[]} */ shape) => {
    const [lesson, traps] = rich[k % rich.length];
    const sizes = index.lessons[lesson].sizes.practice;
    return core.encode({
      lesson,
      mode: "practice",
      done: shape[0].map((/** @type {number} */ d, /** @type {number} */ t) =>
        Math.min(d, sizes[t]),
      ),
      clean: shape[1],
      assisted: shape[2],
      guessed: shape[3],
      certain: shape[4],
      fTeacher: shape[5],
      seals: shape[6],
      traps: shape[7].map((/** @type {number[]} */ [which, n]) => ({
        id: traps[which % traps.length],
        n,
      })),
      focus: shape[8],
    });
  };
  const full = [9, 9, 9, 9, 9];
  return [
    stud(0, [full, 22, 6, 0, 0, 0, [2, 1, 0], [[0, 2]], []]),
    stud(0, [
      full,
      14,
      12,
      3,
      2,
      0,
      [1, 0, 0],
      [
        [0, 4],
        [1, 2],
      ],
      [{ kind: "certain", tab: 2, i: 3 }],
    ]),
    stud(0, [
      [9, 9, 7, 4, 0],
      10,
      11,
      5,
      1,
      1,
      [1, 0, 0],
      [
        [1, 5],
        [2, 3],
        [0, 1],
      ],
      [
        { kind: "teacher", tab: 3, i: 2 },
        { kind: "guessed", tab: 2, i: 4 },
      ],
    ]),
    stud(1, [full, 24, 4, 0, 0, 0, [2, 2, 1], [], []]),
    stud(1, [
      [9, 9, 9, 3, 0],
      12,
      9,
      2,
      1,
      0,
      [1, 1, 0],
      [
        [0, 3],
        [1, 3],
      ],
      [{ kind: "certain", tab: 1, i: 2 }],
    ]),
    stud(1, [
      [9, 6, 0, 0, 0],
      6,
      8,
      4,
      0,
      1,
      [0, 0, 0],
      [
        [1, 6],
        [0, 2],
      ],
      [{ kind: "no-twin", tab: 2, i: 5 }],
    ]),
    stud(1, [full, 20, 8, 1, 0, 0, [2, 0, 0], [[0, 1]], []]),
  ].join("\n");
}

/* ---- wiring --------------------------------------------------------------------------------------------------- */
$("#btn-read").addEventListener("click", () => read());
$("#btn-demo").addEventListener("click", () => {
  const text = exampleCodes();
  if (!text) return say("The example needs the misconception list, which did not load.", true);
  $("#codes").value = text;
  for (const k of Object.keys(labels)) delete labels[Number(k)];
  read({ isDemo: true });
});
$("#btn-clear").addEventListener("click", () => {
  $("#codes").value = "";
  $("#results").hidden = true;
  $("#problems").hidden = true;
  for (const k of Object.keys(labels)) delete labels[Number(k)];
  result = null;
  demo = false;
  $("#btn-card-class").disabled = true;
  say("");
  $("#codes").focus();
});
$("#btn-print").addEventListener("click", () => print("results"));
$("#btn-card-print").addEventListener("click", () => {
  if (!cards.length) return say("Add at least one card first.", true);
  print("cards");
});
$("#btn-card-add").addEventListener("click", () => addCard($("#card-lesson").value));
$("#btn-card-class").addEventListener("click", () => {
  if (!result) return;
  for (const id of result.lessons) addCard(id);
});
$("#btn-card-clear").addEventListener("click", () => {
  cards = [];
  renderCards();
});
$("#card-key").addEventListener("change", (/** @type {any} */ e) =>
  document.body.classList.toggle("hide-key", !e.target.checked),
);

loadIndex();
