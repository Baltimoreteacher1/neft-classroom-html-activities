// The Math Writing Studio: pick an organizer, get a fresh problem from a skill, write each part, watch the paragraph
// build, check it against a short list, then save or print it. Writing is never graded here; the checklist only shows
// which language moves the words already make. Writing lives on this device and does not touch practice evidence.
import { getLang, t } from "./i18n.js";
import { analyze } from "./language-journal.js";
import { getLevel, readJson, setLevel, writeJson } from "./language-settings.js";
import { languageProfile } from "./language-terms.js";
import { speak } from "./speech.js";
import { organizerById, starterFor } from "./writing-organizers.js";
import { blankOrganizerHtml, esc, pieceHtml } from "./writing-print.js";
import { ALL_SKILLS } from "./problem-bank.js";
import { buildPrompt, skillById, skillsForGrade } from "./writing-prompts.js";
import { addPiece, joinParagraph, loadPieces, removePiece } from "./writing-store.js";
import {
  bankHtml,
  boxesHtml,
  heroHtml,
  looksHtml,
  modelHtml,
  organizerCardsHtml,
  portfolioHtml,
  previewHtml,
  taskHtml,
  testHtml,
} from "./writing-view.js";

const DRAFT_KEY = "ewl-writing-draft-v1";
// Which of the four language moves each organizer asks for (the checklist reads the same four the journal does).
const LOOKS = {
  paragraph: ["term", "reason", "sequence", "check"],
  test: ["term", "reason", "sequence", "check"],
  cer: ["term", "reason"],
  compare: ["term", "reason"],
  fix: ["term", "reason", "check"],
};
const LOOK_LABELS = {
  term: () => t("I used a math word."),
  reason: () => t("I gave a reason."),
  sequence: () => t("I told my steps in order."),
  check: () => t("I showed how I checked."),
};
const TICKS = [
  ["parts", () => t("I answered every part of the question.")],
  ["numbers", () => t("I used numbers from the problem.")],
];
const BLANK = "___";

const wordCount = (text) => (String(text).trim() ? String(text).trim().split(/\s+/).length : 0);

export function mountWriting(
  host,
  { grade, skillKey, organizer: startOrganizer, onPrint, announce },
) {
  const saved = readJson(DRAFT_KEY, {});
  const startSkill =
    skillById(skillKey) ||
    skillById(saved.skill) ||
    skillsForGrade(grade)[0] ||
    ALL_SKILLS[0];
  const state = {
    grade: startSkill.grade,
    skill: startSkill,
    organizer: organizerById(startOrganizer || saved.organizer),
    lang: saved.lang === "es" || saved.lang === "en" ? saved.lang : getLang(),
    level: getLevel(),
    test: false,
    boxes: {},
    asked: {},
    ticks: {},
    confirmNew: false,
    prompt: null,
    lastBox: "",
  };
  const drafts = saved.drafts && typeof saved.drafts === "object" ? saved.drafts : {};

  const persist = () => {
    drafts[state.organizer.id] = {
      boxes: state.boxes,
      prompt: state.prompt,
      skill: state.skill.id,
      grade: state.skill.grade,
    };
    writeJson(DRAFT_KEY, {
      skill: `${state.skill.grade}:${state.skill.id}`,
      organizer: state.organizer.id,
      lang: state.lang,
      drafts,
    });
  };

  const newPrompt = () => {
    state.prompt = buildPrompt(
      state.skill,
      state.organizer.id,
      state.organizer.prompt,
      Math.floor(Math.random() * 6),
    );
    state.boxes = {};
    state.asked = {};
    state.ticks = {};
  };
  const restoreOrNew = () => {
    const draft = drafts[state.organizer.id];
    if (
      draft?.prompt?.problem &&
      draft.skill === state.skill.id &&
      draft.grade === state.skill.grade
    ) {
      state.prompt = draft.prompt;
      state.boxes = draft.boxes || {};
      state.asked = {};
      state.ticks = {};
    } else newPrompt();
  };
  restoreOrNew();

  const paragraphParts = () => {
    if (state.test)
      return state.boxes.all
        ? [{ job: "end", text: joinParagraph(state.organizer, { all: state.boxes.all }) }]
        : [];
    return state.organizer.boxes
      .filter((box) => (state.boxes[box.id] || "").trim())
      .map((box) => {
        const text = state.boxes[box.id].trim();
        return {
          job: box.job,
          text: /[.!?¡¿]$/.test(text) ? text : `${text}.`,
          label: state.lang === "es" ? box.label.es : box.label.en,
        };
      });
  };
  // What the learner is writing right now: the one block in test view, or the organizer's boxes.
  const shown = () => {
    if (state.test) return { all: state.boxes.all || "" };
    const { all: _block, ...parts } = state.boxes;
    return parts;
  };
  const fullText = () =>
    joinParagraph(state.organizer, shown());
  const blanksLeft = () =>
    Object.values(shown()).reduce(
      (sum, text) => sum + (String(text).split(BLANK).length - 1),
      0,
    );

  const lookItems = () => {
    const read = analyze(fullText());
    const moves = LOOKS[state.organizer.id].map((key) => ({
      key,
      label: LOOK_LABELS[key](),
      done: Boolean(read.moves[key]),
    }));
    const ticks = state.test
      ? TICKS.map(([key, label]) => ({
          key,
          label: label(),
          done: Boolean(state.ticks[key]),
          manual: true,
        }))
      : [];
    return [...moves, ...ticks];
  };

  const refreshLive = () => {
    host.querySelector("[data-wr-preview]").innerHTML = previewHtml(state, paragraphParts());
    host.querySelector("[data-wr-looks]").innerHTML = looksHtml(lookItems());
    const words = wordCount(fullText());
    host.querySelector("[data-wr-count]").textContent = t("{n} words", { n: words });
    const left = blanksLeft();
    const save = host.querySelector("[data-wr-save]");
    const note = host.querySelector("[data-wr-save-note]");
    save.disabled = !words || left > 0;
    note.textContent =
      left > 0
        ? t("Fill in every ___ before you save.")
        : words
          ? ""
          : t("Write at least one part to save.");
  };

  const render = () => {
    const { terms } = languageProfile(state.skill);
    const pieces = loadPieces();
    host.innerHTML = `<div class="wr-studio" data-lang="${state.lang}">
      ${heroHtml(state.level)}
      ${organizerCardsHtml(state.organizer.id, state.lang)}
      ${taskHtml(state, skillsForGrade(state.skill.grade))}
      <div class="wr-bench">
        <div class="wr-main">${state.test ? testHtml(state) : boxesHtml(state)}</div>
        <aside class="wr-side">
          ${state.test ? "" : bankHtml(state, terms)}
          ${state.test ? "" : modelHtml(state)}
          <section class="wr-paper" aria-labelledby="wr-preview-title">
            <h4 id="wr-preview-title">${esc(t("My paragraph"))} <small data-wr-count></small></h4>
            <div data-wr-preview></div>
            <button type="button" class="wr-btn" data-wr-read>${esc(t("Read it aloud"))}</button>
          </section>
          <section class="wr-check" aria-labelledby="wr-looks-title">
            <h4 id="wr-looks-title">${esc(t("Check my writing"))}</h4>
            <div data-wr-looks></div>
            <p class="wr-note">${esc(t("This shows ideas your words already carry. It is not a grade."))}</p>
          </section>
          <div class="wr-actions">
            <button type="button" class="wr-btn wr-btn-main" data-wr-save>${esc(t("Save to my writing folder"))}</button>
            <button type="button" class="wr-btn" data-wr-print>${esc(t("Print my writing"))}</button>
            <button type="button" class="wr-btn" data-wr-print-blank>${esc(t("Print a blank organizer"))}</button>
            <p class="wr-note" data-wr-save-note role="status"></p>
          </div>
        </aside>
      </div>
      <section class="wr-folder" aria-labelledby="wr-folder-title"><h3 id="wr-folder-title">${esc(t("My writing folder"))}</h3>${portfolioHtml(pieces, state.lang)}</section>
    </div>`;
    refreshLive();
  };

  const insert = (box, text) => {
    const area = host.querySelector(`[data-wr-box="${box}"]`);
    if (!area) return;
    const start = area.selectionStart ?? area.value.length;
    const end = area.selectionEnd ?? start;
    const before = area.value.slice(0, start);
    const pad = before && !/\s$/.test(before) ? " " : "";
    area.value = `${before}${pad}${text}${area.value.slice(end)}`;
    const end2 = start + pad.length + text.length;
    const at = area.value.indexOf(BLANK, start);
    area.focus();
    if (at >= 0 && at < end2) area.setSelectionRange(at, at + BLANK.length);
    else area.setSelectionRange(end2, end2);
    state.boxes[box] = area.value;
    state.lastBox = box;
    persist();
    refreshLive();
  };

  const nextBlank = (box) => {
    const area = host.querySelector(`[data-wr-box="${box}"]`);
    if (!area) return;
    const from = area.selectionEnd ?? 0;
    let at = area.value.indexOf(BLANK, from);
    if (at < 0) at = area.value.indexOf(BLANK);
    area.focus();
    if (at >= 0) area.setSelectionRange(at, at + BLANK.length);
  };

  const save = () => {
    const boxes = shown();
    const piece = addPiece({
      organizer: state.organizer.id,
      lang: state.lang,
      level: state.level,
      grade: state.skill.grade,
      skill: state.skill.id,
      problem: state.prompt.problem,
      boxes,
      day: new Date().toISOString().slice(0, 10),
    });
    if (!piece) {
      host.querySelector("[data-wr-save-note]").textContent = t(
        "This browser could not save. Your words are still here.",
      );
      return;
    }
    host.querySelector(".wr-folder").innerHTML =
      `<h3 id="wr-folder-title">${esc(t("My writing folder"))}</h3>${portfolioHtml(loadPieces(), state.lang)}`;
    host.querySelector("[data-wr-save-note]").textContent = t("Saved on this device.");
    announce?.(t("Saved on this device."));
  };

  const draftPiece = () => ({
    organizer: state.organizer.id,
    lang: state.lang,
    problem: state.prompt.problem,
    boxes: shown(),
  });

  host.addEventListener("input", (event) => {
    const area = event.target.closest?.("[data-wr-box]");
    if (!area) return;
    state.boxes[area.dataset.wrBox] = area.value;
    state.lastBox = area.dataset.wrBox;
    persist();
    refreshLive();
  });
  host.addEventListener("focusin", (event) => {
    const area = event.target.closest?.("[data-wr-box]");
    if (area) state.lastBox = area.dataset.wrBox;
  });
  host.addEventListener("change", (event) => {
    const tick = event.target.closest?.("[data-wr-tick]");
    if (tick) {
      state.ticks[tick.dataset.wrTick] = tick.checked;
      refreshLive();
      return;
    }
    const pickSkill = event.target.closest?.("[data-wr-skill]");
    if (pickSkill) {
      state.skill = skillById(pickSkill.value) || state.skill;
      delete drafts[state.organizer.id];
      newPrompt();
      persist();
      render();
    }
  });

  host.addEventListener("click", (event) => {
    const hit = (attr) => event.target.closest?.(`[${attr}]`);
    let el;
    if ((el = hit("data-wr-organizer"))) {
      persist();
      state.organizer = organizerById(el.dataset.wrOrganizer);
      state.test = false;
      restoreOrNew();
      persist();
      render();
    } else if ((el = hit("data-wr-level"))) {
      state.level = setLevel(Number(el.dataset.wrLevel));
      render();
    } else if ((el = hit("data-wr-lang"))) {
      state.lang = el.dataset.wrLang;
      persist();
      render();
    } else if ((el = hit("data-wr-mode"))) {
      state.test = el.dataset.wrMode === "test";
      render();
    } else if ((el = hit("data-wr-new"))) {
      const choice = el.dataset.wrNew;
      const hasText = Object.values(state.boxes).some((text) => String(text).trim());
      if (choice === "ask" && hasText) state.confirmNew = true;
      else {
        state.confirmNew = false;
        if (choice !== "no") {
          delete drafts[state.organizer.id];
          newPrompt();
          persist();
        }
      }
      render();
    } else if ((el = hit("data-wr-ask"))) {
      state.asked[el.dataset.wrAsk] = true;
      render();
    } else if ((el = hit("data-wr-starter"))) {
      const box = state.organizer.boxes.find((entry) => entry.id === el.dataset.wrStarter);
      insert(box.id, starterFor(box, state.level, state.lang, { asked: true }));
    } else if ((el = hit("data-wr-blank"))) nextBlank(el.dataset.wrBlank);
    else if ((el = hit("data-wr-chip")))
      insert(state.lastBox || (state.organizer.boxes[0]?.id ?? "all"), el.dataset.wrChip);
    else if (hit("data-wr-read")) speak(fullText(), state.lang);
    else if (hit("data-wr-save")) save();
    else if (hit("data-wr-print"))
      onPrint?.(pieceHtml({ ...draftPiece(), boxes: draftPiece().boxes }, state.organizer));
    else if (hit("data-wr-print-blank")) {
      onPrint?.(
        blankOrganizerHtml(state.organizer, {
          lang: state.lang,
          problem: state.prompt.problem,
          task: state.lang === "es" ? state.organizer.prompt.es : state.organizer.prompt.en,
        }),
      );
    } else if ((el = hit("data-wr-open"))) {
      const piece = loadPieces().find((entry) => entry.id === el.dataset.wrOpen);
      if (!piece) return;
      state.organizer = organizerById(piece.organizer);
      state.lang = piece.lang;
      state.test = piece.boxes.all !== undefined;
      state.boxes = { ...piece.boxes };
      const skill = skillById(`${piece.grade}:${piece.skill}`) || state.skill;
      state.skill = skill;
      state.prompt = {
        item: { question: piece.problem },
        problem: piece.problem,
        spanish: "",
        claim: null,
        task: state.organizer.prompt,
      };
      persist();
      render();
      host.querySelector(".wr-bench")?.scrollIntoView({ behavior: "smooth", block: "start" });
    } else if ((el = hit("data-wr-print-piece"))) {
      const piece = loadPieces().find((entry) => entry.id === el.dataset.wrPrintPiece);
      if (piece) onPrint?.(pieceHtml(piece, organizerById(piece.organizer)));
    } else if ((el = hit("data-wr-delete"))) {
      removePiece(el.dataset.wrDelete);
      host.querySelector(".wr-folder").innerHTML =
        `<h3 id="wr-folder-title">${esc(t("My writing folder"))}</h3>${portfolioHtml(loadPieces(), state.lang)}`;
    }
  });

  render();
  return () => host.replaceChildren();
}

