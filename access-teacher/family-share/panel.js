// "Share with families": the teacher's view for the Family Language Story. Pick a student, edit what the family will
// see, preview the real family page in either language, approve it, then copy the link or print a card. The teacher is
// always in control: nothing is sent, and a link exists only for a story the teacher approved. Opened from the class
// intelligence panel and the Data Studio (`?task=analyze&share=families`). Contract: family/story/link.js.
import { el } from "../../access-practice-lab/src/class/dom.js";
import { makeI18n } from "../../access-practice-lab/src/i18n.js";
import { listenStory } from "../../access-practice-lab/src/family/story/audio.js";
import { decodeStory, encodeStory, storyUrl } from "../../access-practice-lab/src/family/story/link.js";
import { LIMITS, cleanText, compose, normalizeStory } from "../../access-practice-lab/src/family/story/model.js";
import { storyHTML } from "../../access-practice-lab/src/family/story/render.js";
import { STARTER_IDS } from "../../access-practice-lab/src/family/story/wording.js";
import { speak, speakSpanish, stop } from "../../access-practice-lab/src/speech.js";
import { toHtml } from "../../access-practice-lab/src/util.js";
import { SAMPLE_ID, loadSource } from "../intel/data.js";
import { studentRows } from "../intel/model.js";
import { editorNodes } from "./editor.js";
import { evidenceFor } from "./evidence.js";
import { printApproved } from "./print.js";
import { resultNodes } from "./result.js";
import { readItem, writeItem } from "./store.js";
import { copy } from "./wording.js";

/** Three different talks: a repeated choice is replaced by the next talk not already picked. */
const fillTalks = (picks) => {
  const out = [];
  for (const id of picks) out.push(!out.includes(id) ? id : STARTER_IDS.find((x) => !out.includes(x) && !picks.includes(x)) || STARTER_IDS.find((x) => !out.includes(x)));
  return out;
};
const EMPTY_TRIES = { ticks: {}, how: "tried", both: false };
let chosen = "";

/** Start a story from the evidence: facts always fresh, choices from the saved draft or the first candidate. */
function storyFrom(evidence, saved) {
  const first = evidence.candidates[0];
  const base = saved || {
    c: first?.c || "ef",
    q: first?.q || "",
    m: first?.m || "w",
    s: evidence.s,
  };
  return normalizeStory({ ...base, d: evidence.d, w: evidence.w, k: evidence.k });
}

/**
 * Mount into `root`. `source` is an intel data source ({ id, kind, cls?, title? }); `onBack()` returns to the class
 * intelligence view; `onLang(lang)` keeps the hub's language choice in step.
 */
export async function mountFamilyShare(root, { source, band = "6-8", roster = [], lang = "en", onBack, onLang }) {
  let ui = lang === "es" ? "es" : "en";
  let previewLang = "";
  const sample = source?.id === SAMPLE_ID;
  const S = (...a) => makeI18n(ui, "en").S(...a);
  const live = el("p", { class: "visually-hidden", role: "status", "aria-live": "polite" });
  // A fresh container per open, so the listeners below never pile up on the hub's long-lived root.
  const host = el("div", { class: "fsh" });
  root.replaceChildren(host);
  host.lang = ui;
  host.replaceChildren(el("p", { class: "fine", role: "status" }, copy(S).loading));
  const data = await loadSource(source, { roster });
  const rows = studentRows({ members: data.members, roster: data.roster, band: sample ? null : band });
  const sourceId = source?.id || "none";
  const sourceTitle = source?.title || copy(S).title;
  let row = rows.find((r) => r.alias === chosen) || rows.find((r) => !readItem(sourceId, r.alias).approved) || rows[0];
  let evidence;
  let story;

  const select = (alias) => {
    row = rows.find((r) => r.alias === alias) || rows[0];
    chosen = row.alias;
    evidence = evidenceFor(row, data.now);
    story = storyFrom(evidence, readItem(sourceId, row.alias).story);
    previewLang = story.l;
  };
  const item = () => ({ story, approved: readItem(sourceId, row.alias).approved });
  const save = () => writeItem(sourceId, row.alias, item());
  const approvedCount = () => rows.filter((r) => readItem(sourceId, r.alias).approved).length;
  const i18n = (mode) => makeI18n(mode, "en");

  function renderPreview() {
    const box = host.querySelector("#fshPreview");
    if (!box) return;
    box.innerHTML = toHtml(storyHTML(i18n(previewLang), compose(story), EMPTY_TRIES, { preview: true }));
    box.lang = previewLang === "es" ? "es" : "en";
    host.querySelectorAll("[data-fsh-plang]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.fshPlang === previewLang)));
  }

  function renderResult() {
    const box = host.querySelector("#fshResult");
    if (!box) return;
    const c = copy(S);
    box.replaceChildren(...resultNodes(c, { story, saved: readItem(sourceId, row.alias), count: approvedCount(), origin: location.origin }));
  }

  function renderAll() {
    const c = copy(S);
    host.lang = ui;
    const options = rows.map((r) =>
      el("option", { value: r.alias, selected: r.alias === row.alias }, readItem(sourceId, r.alias).approved ? `${r.alias} ✓ ${c.approvedMark}` : r.alias),
    );
    host.replaceChildren(
      live,
      el(
        "div",
        { class: "ti-head fsh-head" },
        el("button", { type: "button", class: "ti-link", "data-fsh": "back" }, `← ${c.back}`),
        el("h3", { id: "fshTitle", tabindex: "-1" }, c.title),
        el("p", { class: "fine" }, c.lead),
        sample ? el("p", { class: "ti-sample" }, c.sample) : "",
        el(
          "div",
          { class: "ti-controls" },
          el("label", { class: "ti-field", for: "fshStudent" }, el("span", {}, `${c.student} · ${sourceTitle}`), el("select", { id: "fshStudent", "data-fsh": "student" }, options)),
          el(
            "div",
            { class: "ti-lang", role: "group", "aria-label": "Language / Idioma" },
            ["en", "es"].map((m) => el("button", { type: "button", class: "ti-btn", "data-fsh-ui": m, "aria-pressed": String(ui === m), lang: m }, m === "en" ? "English" : "Español")),
          ),
        ),
      ),
      el(
        "div",
        { class: "fsh-grid" },
        el("div", { class: "fsh-form" }, editorNodes(c, evidence, story, S)),
        el(
          "div",
          { class: "fsh-side" },
          el("h4", {}, c.previewHeading),
          el("div", { class: "fsh-plang" }, el("span", { class: "fsh-label" }, c.previewLang), ...["en", "es", "bi"].map((m) => el("button", { type: "button", class: "fsh-seg-btn", "data-fsh-plang": m, "aria-pressed": String(previewLang === m), lang: m === "es" ? "es" : null }, c.langs[m]))),
          el("div", { class: "fsh-phone", id: "fshPreview" }),
          el("div", { id: "fshResult", class: "fsh-result" }),
        ),
      ),
    );
    renderPreview();
    renderResult();
  }

  const changed = () => {
    save();
    renderPreview();
    renderResult();
  };

  function approve(next) {
    const c = copy(S);
    writeItem(sourceId, row.alias, { story, approved: encodeStory(story) });
    live.textContent = c.statusApproved(row.alias);
    if (next) {
      const after = rows[(rows.indexOf(row) + 1) % rows.length];
      select(after.alias);
      renderAll();
      host.querySelector("#fshName")?.focus();
    } else {
      renderAll();
      host.querySelector("[data-fsh='copy']")?.focus();
    }
  }

  host.addEventListener("click", async (e) => {
    const t = e.target.closest("[data-fsh],[data-fsh-ui],[data-fsh-lang],[data-fsh-plang],[data-fsh-notelang],[data-say],[data-say-es],[data-fls-listen],[data-stop-audio]");
    if (!t) return;
    const c = copy(S);
    if (t.dataset.say) speak(t.dataset.say);
    else if (t.dataset.sayEs) speakSpanish(t.dataset.sayEs);
    else if (t.hasAttribute("data-stop-audio")) stop();
    else if (t.hasAttribute("data-fls-listen")) listenStory(story, i18n(previewLang));
    else if (t.dataset.fshUi) {
      ui = t.dataset.fshUi;
      onLang?.(ui);
      renderAll();
      host.querySelector(`[data-fsh-ui="${ui}"]`)?.focus();
    } else if (t.dataset.fshLang) {
      story = normalizeStory({ ...story, l: t.dataset.fshLang });
      previewLang = story.l;
      host.querySelectorAll("[data-fsh-lang]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.fshLang === story.l)));
      changed();
    } else if (t.dataset.fshPlang) {
      previewLang = t.dataset.fshPlang;
      renderPreview();
    } else if (t.dataset.fshNotelang) {
      story = normalizeStory({ ...story, x: t.dataset.fshNotelang });
      host.querySelectorAll("[data-fsh-notelang]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.fshNotelang === story.x)));
      changed();
    } else if (t.dataset.fsh === "back") onBack?.();
    else if (t.dataset.fsh === "approve" || t.dataset.fsh === "approve-next") approve(t.dataset.fsh === "approve-next");
    else if (t.dataset.fsh === "copy") {
      const url = storyUrl(story, { origin: location.origin });
      try {
        await navigator.clipboard.writeText(url);
        live.textContent = c.copied;
      } catch {
        host.querySelector("#fshLink")?.select();
      }
    } else if (t.dataset.fsh === "share") {
      navigator.share?.({ url: storyUrl(story, { origin: location.origin }) }).catch(() => {});
    } else if (t.dataset.fsh === "print") printApproved([{ alias: row.alias, story }], c);
    else if (t.dataset.fsh === "print-all")
      printApproved(
        rows.flatMap((r) => {
          const saved = readItem(sourceId, r.alias);
          const approved = decodeStory(saved.approved);
          return approved ? [{ alias: r.alias, story: approved }] : [];
        }),
        c,
      );
  });

  host.addEventListener("input", (e) => {
    if (e.target.matches("[data-fsh-name]")) {
      story = normalizeStory({ ...story, n: e.target.value });
      changed();
    } else if (e.target.matches("[data-fsh-note]")) {
      const raw = e.target.value;
      const ok = cleanText(raw, LIMITS.note);
      host.querySelector("#fshNoteBad").hidden = !raw.trim() || Boolean(ok);
      story = normalizeStory({ ...story, t: raw });
      changed();
    }
  });

  host.addEventListener("change", (e) => {
    if (e.target.matches("[data-fsh='student']")) {
      select(e.target.value);
      renderAll();
      host.querySelector("#fshStudent")?.focus();
    } else if (e.target.matches("[data-fsh-quote]")) {
      const cand = e.target.value === "" ? null : evidence.candidates[Number(e.target.value)];
      story = normalizeStory({ ...story, c: cand?.c || "ef", q: cand?.q || "", m: cand?.m || "w" });
      changed();
    } else if (e.target.matches("[data-fsh-talk]")) {
      const picks = fillTalks([...host.querySelectorAll("[data-fsh-talk]")].map((x) => x.value));
      host.querySelectorAll("[data-fsh-talk]").forEach((x, i) => (x.value = picks[i]));
      story = normalizeStory({ ...story, s: picks });
      changed();
    }
  });

  if (!rows.length) {
    const c = copy(S);
    host.replaceChildren(
      el("button", { type: "button", class: "ti-link", onclick: () => onBack?.() }, `← ${c.back}`),
      el("div", { class: "ti-empty" }, el("p", {}, c.empty.none), el("a", { class: "btn btn-primary", href: "#liveClass" }, c.empty.live), el("a", { class: "btn", href: "#classEvidence" }, c.empty.evidence)),
    );
    return;
  }
  select(row.alias);
  renderAll();
  host.querySelector("#fshTitle")?.focus();
}

