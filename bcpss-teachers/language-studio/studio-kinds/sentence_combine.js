// sentence_combine ("Link it up"): join short kernel sentences with a connector (TWR sentence combining).
// Kernel cards + highlighted connector chip with its meaning, a typed sentence with live checks, teaching feedback,
// "Show me" after two tries (fewer stars), then a side-by-side compare with one model and a self-check.
// Levels: Starter = "Start me off" + hear both; Core = hear both; Stretch = try a second connector and compare.
import { createKit, h, icon } from "./_kit.js";
import { checklist, insertAtCaret } from "../studio-ui.js";

// TWR connector meanings (kid language). Unknown connectors get no hint rather than a wrong one.
const MEANINGS = [
  ["because|since", "gives a reason. It answers why?"],
  ["so that", "tells the purpose. It answers what for?"],
  [
    "so|as a result( of)?|therefore|consequently|(which )?(leads|led) to|leading to|which led|(which )?causes",
    "tells a result. It answers what happened because of it?",
  ],
  ["but|yet|however|even so", "changes direction. The next idea is different."],
  ["although|even though|though", "shows a surprise. One idea is true even with the other."],
  ["whereas|in contrast|unlike", "shows a contrast. It puts two different things side by side."],
  ["while", "shows a contrast, or two things at the same time."],
  ["when|after|before|(and )?then|later|eventually|meanwhile", "tells time. It answers when?"],
  ["and|also|both", "adds another idea."],
  [
    "which|that|that has|which (means|shows|shows that|helps|makes|proves that)",
    "adds information about the thing you just named.",
  ],
  ["according to|as shown by|for example", "names the evidence. It answers how do you know?"],
].map(([k, v]) => [new RegExp(`^(${k})$`), v]);
const meaningOf = (c) =>
  MEANINGS.find(([re]) => re.test(String(c).trim().toLowerCase()))?.[1] || "";
const STRETCH_TRY = ["because", "but", "so", "although", "which", "when"];
const STOP =
  /^(the|a|an|is|are|was|were|it|its|i|we|you|he|she|they|this|that|these|those|of|to|in|on|at|and|or|but|so|for|with|my|our|their|his|her|be|has|have|had|can|do|does|did|am|not|no)$/;

const words = (s) =>
  String(s || "")
    .toLowerCase()
    .replace(/[^a-z0-9'\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
const flat = (s) => ` ${words(s).join(" ")} `;
const usesConn = (text, conn) => flat(text).includes(` ${words(conn).join(" ")} `);
const strip = (s) =>
  String(s)
    .trim()
    .replace(/[.?!]+$/, "");
/** Two sentences: an end mark, a space, then a capital (titles like "Mr." do not count). */
const TWO = /(?<!\b(?:Mr|Mrs|Ms|Dr|St|Jr|Sr))[.?!]\s+["“]?[A-Za-z]/;
const escRe = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const btn = (cls, text, onclick, attrs = {}) =>
  h("button", { type: "button", class: `st-btn ${cls}`, text, onclick, ...attrs });
const checkLi = (ok, label) =>
  h(
    "li",
    { class: ok ? "is-on" : "" },
    ok ? icon("check") : h("span", { class: "ss-dot" }),
    label,
    h("span", { class: "st-sr", text: ok ? ": done" : ": not yet" }),
  );
const cap = (s) => String(s).charAt(0).toUpperCase() + String(s).slice(1);

/** Share of a kernel's content words (4-letter stems) found in the text. */
function coverage(kernel, text) {
  const have = new Set(words(text).map((w) => w.slice(0, 4)));
  const need = words(kernel).filter((w) => !STOP.test(w));
  if (!need.length) return 1;
  return need.filter((w) => have.has(w.slice(0, 4))).length / need.length;
}

/** Live checks on a typed combination. Each: { ok, label, fix }. */
export function checkCombined(text, item, conn = item.connector) {
  const v = String(text || "").trim();
  // Thresholds never ask for more than the model itself shows, so the model always passes.
  const missing = item.sentences.findIndex(
    (s) => coverage(s, v) < Math.min(0.5, coverage(s, item.model) - 0.01),
  );
  const two = TWO.test(item.model); // the model is itself two sentences ("It snows. As a result, ...")
  const row = (ok, label, fix) => ({ ok, label, fix });
  return [
    row(
      usesConn(v, conn),
      `Uses "${conn}"`,
      `Use "${conn}" to join the ideas. "${conn}" ${meaningOf(conn) || "links the two ideas."}`,
    ),
    row(
      v.length > 0 && missing < 0,
      `Keeps the ideas from ${item.sentences.length === 2 ? "both" : "all"} sentences`,
      `Keep every idea. The idea from sentence ${missing + 1} is missing. Read it again.`,
    ),
    two
      ? null
      : row(
          v.length > 0 && !TWO.test(v),
          "Is one sentence",
          `Make it one sentence. Take out the end mark in the middle and join with "${conn}".`,
        ),
    row(
      /^["“]?[A-Z0-9−-]/.test(v) && /[.?!]["”]?$/.test(v),
      "Capital letter and end mark",
      "Start with a capital letter. End with a period or other end mark.",
    ),
  ].filter(Boolean);
}

/** Repeated-subject tip: "The sponge is soft and the sponge is squishy." */
function repeatTip(text, item) {
  const subj = item.sentences.map((s) => words(s).slice(0, 2).join(" "));
  if (subj.length < 2 || subj[0] !== subj[1] || subj[0].split(" ").length < 2) return "";
  const n = flat(text).split(` ${subj[0]} `).length - 1;
  return n > 1 ? `Tip: you wrote "${subj[0]}" two times. Can you say it once, or use "it"?` : "";
}

/** Text with the connector wrapped in <mark>. */
function marked(text, conn) {
  const parts = String(text).split(new RegExp(`(\\b${escRe(conn)}\\b)`, "i"));
  return parts.map((p, i) => (i % 2 ? h("mark", { class: "ss-hl", text: p }) : p));
}

export default function mount(root, ctx) {
  const kit = createKit(root, ctx, "sentence_combine");
  root.classList.add("ss");
  const items = ctx.payload.items;
  const level = ctx.level || "l3_4";
  const dots = kit.dots(items.length, "Sentences");
  const fb = kit.feedback(
    "Read the short sentences. Join them into one sentence with the connector.",
  );
  const stage = h("div", { class: "ss-stage" });
  const fresh = () => ({ cur: 0, results: [], drafts: [], alts: [], tries: 0, done: false });
  let st = fresh();
  const save = () => ctx.saveState({ v: 2, n: items.length, ...st });

  function paintDots() {
    items.forEach((_, i) =>
      dots.set(
        i,
        i < st.cur ? (st.results[i] === "shown" ? "miss" : "ok") : i === st.cur ? "now" : "",
      ),
    );
    dots.label(`Sentence ${st.cur + 1} of ${items.length}`);
  }

  function kernels(it) {
    return h(
      "div",
      { class: "ss-kernels" },
      it.sentences.map((s, k) =>
        h(
          "div",
          { class: "ss-kernel" },
          h("span", { class: "sc-sent__n", text: String(k + 1) }),
          h("p", { class: "ss-kernel__text", text: s }),
          kit.speakBtn(s, `Listen to sentence ${k + 1}`),
        ),
      ),
    );
  }

  function connBox(conn, area) {
    const chip = h(
      "button",
      {
        type: "button",
        class: "ss-chip ss-chip--link ss-conn",
        "aria-label": `Add the connector "${conn}" to your sentence`,
      },
      h("span", { class: "ss-role", "aria-hidden": "true", text: "Link" }),
      h("span", { class: "ss-chip__text", text: conn }),
    );
    chip.addEventListener("click", () => insertAtCaret(area, conn));
    const mean = meaningOf(conn);
    return h(
      "div",
      { class: "ss-connbox" },
      h("span", { class: "ss-eyebrow", text: "Join with" }),
      chip,
      mean ? h("p", { class: "ss-meaning" }, h("b", { text: `"${conn}"` }), ` ${mean}`) : null,
    );
  }

  function liveChecks(area, item, conn) {
    const list = h("ul", { class: "ss-checks", "aria-label": "Sentence checks" });
    const tip = h("p", { class: "ss-tip", hidden: true });
    const paint = () => {
      const rows = checkCombined(area.value, item, conn);
      list.replaceChildren(...rows.map((r) => checkLi(r.ok, r.label)));
      const t = repeatTip(area.value, item);
      tip.textContent = t;
      tip.hidden = !t;
    };
    area.addEventListener("input", paint);
    paint();
    return h("div", { class: "ss-live" }, list, tip);
  }

  function showWrite() {
    const it = items[st.cur];
    const conn = it.connector;
    paintDots();
    fb.set("");
    const area = h("textarea", {
      class: "ss-area",
      rows: "3",
      id: `ss-area-${st.cur}`,
      placeholder: "Write one sentence…",
      spellcheck: "true",
    });
    area.value = st.drafts[st.cur] || "";
    area.addEventListener("input", () => {
      st.drafts[st.cur] = area.value;
      save();
    });
    const tools = h("div", { class: "ss-tools" });
    if (level !== "l5_6") {
      const both = kit.speakBtn(it.sentences.join(" "), "Hear both sentences");
      if (both) {
        both.classList.add("ss-tool");
        both.append(h("span", { text: "Hear both" }));
        tools.append(both);
      }
    }
    const starter = level === "l1_2" ? starterText(it) : "";
    if (starter) {
      const sb = btn("st-btn--ghost st-btn--sm ss-tool", "Start me off", () => {
        if (area.value.trim()) return area.focus();
        area.value = starter;
        area.dispatchEvent(new Event("input", { bubbles: true }));
        area.focus();
        area.setSelectionRange(starter.length, starter.length);
        ctx.announce("The start is written for you. Finish the sentence.");
      });
      tools.append(sb);
    }
    const show = btn(
      "st-btn--ghost st-btn--lg",
      "Show me",
      () => finishItem("shown", area.value.trim()),
      {
        hidden: st.tries < 2,
      },
    );
    const go = h(
      "button",
      { type: "button", class: "st-btn st-btn--primary st-btn--lg" },
      icon("check"),
      "Check my sentence",
    );
    go.addEventListener("click", () => {
      if (area.value.trim().split(/\s+/).length < 3) {
        fb.set("Write the whole sentence first. Use the ideas from the short sentences.", "hint");
        return area.focus();
      }
      const rows = checkCombined(area.value, it);
      const miss = rows.find((r) => !r.ok);
      if (!miss) return finishItem(st.tries === 0 ? "first" : "retry", area.value.trim());
      st.tries++;
      save();
      kit.fx(area, "sg-shake");
      fb.set(st.tries >= 2 ? `${miss.fix} You can also tap "Show me".` : miss.fix, "no");
      show.hidden = st.tries < 2;
    });
    const mean = meaningOf(conn);
    const hints = kit.hints(() => [
      "Read both short sentences. What idea do they share?",
      `Join them with “${conn}”${mean ? `: “${conn}” ${mean}` : ""}. Say your sentence out loud before you write it.`,
      `Start with the first idea (“${strip(it.sentences[0])}”), add “${conn}”, then the second idea in your own words.`,
    ]);
    stage.replaceChildren(
      h(
        "div",
        { class: "ss-card" },
        h(
          "div",
          { class: "ss-head" },
          h("p", { class: "ss-eyebrow", text: `Sentence ${st.cur + 1} of ${items.length}` }),
          tools,
        ),
        kernels(it),
        hints,
        connBox(conn, area),
        h("label", {
          class: "ss-eyebrow ss-label",
          for: `ss-area-${st.cur}`,
          text: "Your sentence",
        }),
        area,
        liveChecks(area, it, conn),
        h("div", { class: "ss-actions" }, show, go),
      ),
    );
    area.focus({ preventScroll: true });
  }

  /** Starter scaffold: kernel 1 (no end mark) + the connector, only when the model really starts that way. */
  function starterText(it) {
    const conn = it.connector;
    const model = String(it.model);
    if (flat(model).startsWith(` ${words(conn).join(" ")} `)) return `${cap(conn)} `;
    const k1 = strip(it.sentences[0]);
    if (!flat(model).startsWith(flat(k1))) return "";
    const comma = new RegExp(`,\\s*${escRe(conn)}\\b`, "i").test(model) ? "," : "";
    return `${k1}${comma} ${conn} `;
  }

  function finishItem(result, text) {
    st.results[st.cur] = result;
    st.drafts[st.cur] = text;
    st.done = true;
    save();
    showCompare(true);
  }

  function compareCard(title, text, conn, tone) {
    return h(
      "div",
      { class: `ss-cmp ss-cmp--${tone}` },
      h("p", { class: "ss-eyebrow", text: title }),
      h(
        "p",
        { class: "ss-cmp__text" },
        text ? marked(text, conn) : h("i", { text: "(nothing written)" }),
      ),
      text ? kit.speakBtn(text, `Listen: ${title}`) : null,
    );
  }

  function showCompare(announce) {
    const it = items[st.cur];
    const conn = it.connector;
    const r = st.results[st.cur];
    const mineText = st.drafts[st.cur] || "";
    paintDots();
    const exact = flat(mineText) === flat(it.model);
    const msg =
      r === "shown"
        ? `Here is one way to join them with "${conn}". Read it aloud, then compare.`
        : exact
          ? "Your sentence matches the model. Excellent joining!"
          : `You joined the ideas with "${conn}". Compare with one possible answer. More than one answer can be right.`;
    if (announce) fb.set(msg, r === "shown" ? "hint" : "ok");
    const ticks = checklist([
      `I used "${conn}" to join the ideas.`,
      "My sentence keeps every idea from the short sentences.",
      "I read it aloud and it sounds right.",
    ]);
    const label = st.cur + 1 < items.length ? "Next sentence" : "See my sentences";
    const next = btn("st-btn--primary st-btn--lg", label, () => {
      if (st.cur + 1 >= items.length) return summary();
      st.cur++;
      st.tries = 0;
      st.done = false;
      save();
      showWrite();
    });
    const card = h(
      "div",
      { class: "ss-card" },
      h(
        "div",
        { class: "ss-head" },
        h("p", { class: "ss-eyebrow", text: `Sentence ${st.cur + 1} of ${items.length}` }),
      ),
      kernels(it),
      h(
        "div",
        { class: "ss-compare" },
        compareCard("Your sentence", mineText, conn, "mine"),
        compareCard("One possible answer", it.model, conn, "model"),
      ),
      h("p", { class: "ss-eyebrow", text: "Self-check" }),
      ticks.el,
      level === "l5_6" ? altPanel(it) : null,
      h("div", { class: "ss-actions" }, next),
    );
    stage.replaceChildren(card);
    if (!kit.reduced && announce && r !== "shown")
      kit.fx(card.querySelector(".ss-compare"), "ss-win");
    next.focus({ preventScroll: true });
  }

  /** Stretch: rewrite with a second connector and compare meanings. Optional and unscored. */
  function altPanel(it) {
    const options = STRETCH_TRY.filter((c) => c !== it.connector.toLowerCase()).slice(0, 5);
    const saved = st.alts[st.cur];
    const box = h("section", { class: "ss-own", "aria-label": "Try another connector" });
    const body = h("div", { class: "ss-own__body" });
    let pick = saved?.conn || "";
    const chips = options.map((c) => {
      const b = h(
        "button",
        {
          type: "button",
          class: "ss-chip ss-chip--link ss-pick",
          "aria-pressed": String(c === pick),
        },
        h("span", { class: "ss-chip__text", text: c }),
      );
      b.addEventListener("click", () => {
        pick = c;
        for (const x of chips) x.setAttribute("aria-pressed", String(x === b));
        paint();
      });
      return b;
    });
    const paint = () => {
      if (!pick) return body.replaceChildren();
      const area = h("textarea", {
        class: "ss-area",
        rows: "2",
        "aria-label": `Your sentence with "${pick}"`,
        placeholder: `Join the ideas with "${pick}"…`,
      });
      area.value = saved?.conn === pick ? saved.text : "";
      const out = h("div", { class: "ss-alt-out", "aria-live": "polite" });
      const keep = btn("st-btn--primary", "Save and compare", () => {
        const text = area.value.trim();
        if (!text) return area.focus();
        st.alts[st.cur] = { conn: pick, text };
        save();
        out.replaceChildren(
          h(
            "p",
            null,
            h("b", { text: `"${it.connector}" ` }),
            meaningOf(it.connector) || "links the ideas.",
          ),
          h("p", null, h("b", { text: `"${pick}" ` }), meaningOf(pick)),
          h("p", {
            class: "ss-tip",
            text: usesConn(text, pick)
              ? "Read both versions aloud. How did the meaning change? Does the new one still make sense?"
              : `Your new sentence does not use "${pick}" yet.`,
          }),
        );
      });
      body.replaceChildren(
        h("p", { class: "ss-meaning" }, h("b", { text: `"${pick}"` }), ` ${meaningOf(pick)}`),
        area,
        liveChecks(area, it, pick),
        h("div", { class: "ss-actions" }, keep),
        out,
      );
    };
    box.append(
      h("p", { class: "ss-eyebrow", text: "Stretch: try another connector (optional)" }),
      h("p", {
        class: "ss-own__lead",
        text: "Pick a different connector. Does the meaning change? Does it still make sense?",
      }),
      h("div", { class: "ss-picks", role: "group", "aria-label": "Connectors to try" }, chips),
      body,
    );
    paint();
    return box;
  }

  function summary() {
    ctx.saveState(null);
    items.forEach((_, i) => dots.set(i, st.results[i] === "shown" ? "miss" : "ok"));
    dots.label("All sentences joined");
    const first = st.results.filter((r) => r === "first").length;
    const used = st.results.filter((r) => r === "shown").length;
    const stars = used ? 1 : first >= Math.ceil(items.length * 0.75) ? 3 : 2;
    const label = { first: "First try", retry: "Fixed it", shown: "Shown" };
    stage.replaceChildren(
      h(
        "section",
        { class: "ss-summary", "aria-label": "Your sentences" },
        h("h2", { class: "ss-summary__title", text: "Your linked sentences" }),
        h(
          "ol",
          { class: "ss-summary__list" },
          items.map((it, i) =>
            h(
              "li",
              null,
              h("span", {
                class: `ss-badge ss-badge--${st.results[i]}`,
                text: label[st.results[i]],
              }),
              h(
                "span",
                { class: "ss-summary__text" },
                marked(st.drafts[i] || it.model, it.connector),
              ),
              h("span", { class: "ss-summary__mine", text: `Model: ${it.model}` }),
            ),
          ),
        ),
      ),
    );
    fb.set(`${first} of ${items.length} joined on the first try.`, "ok");
    ctx.done({
      stars,
      detail: `You joined ${first} of ${items.length} sentences on the first try.`,
    });
  }

  root.append(h("div", { class: "sg-topbar" }, dots.el), stage);
  kit.dock(fb.el);
  const saved = ctx.loadState?.();
  if (saved?.v === 2 && saved.n === items.length && saved.cur < items.length) {
    st = { ...fresh(), ...saved };
    if (st.done) showCompare(false);
    else showWrite();
  } else showWrite();
  return () => kit.destroy();
}
