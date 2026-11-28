// Customize Activity: the adapter registry. An adapter turns ONE existing platform activity into an editable
// lp-activity/1 draft; `customizeFrom` stamps it as a new teacher draft with a lineage pointer. The platform original
// is only ever read. Pure given `fetchJson`: no DOM, no storage, no fs, so it runs in Node and in the browser.

import accessBank from "./access-bank.js";
import bcpssUnit from "./bcpss-unit.js";
import { editableFor } from "./properties.js";
import { hashSource } from "./util.js";
import readingRoom from "./reading-room.js";
import vocabAcademy from "./vocab-academy.js";
import readingLadder from "./reading-ladder.js";
import missions from "./missions.js";
import puzzleDen from "./puzzles.js";
import mentorTexts from "./mentor-texts.js";
import newsroomPrompts from "./newsroom.js";
import readingPath from "./reading-path.js";
import newcomerPacks from "./newcomer-packs.js";
import questMissions from "./quest.js";
import studioTask from "./studio-task.js";
import twr from "./twr.js";
import talkTable from "./talk-table.js";
import warmup from "./warmup.js";
import subjectReading from "./subject-reading.js";
import teachBack from "./teach-back.js";
import wordParts from "./word-parts.js";
import wordlab from "./wordlab.js";
import phonics from "./phonics.js";
import worldMissions from "./world-missions.js";
import scenarios from "./scenarios.js";
import voiceLab from "./voice-lab.js";
import scaffoldItems from "./scaffold-items.js";
import craftSentences from "./craft-sentences.js";
import labActivity from "./lab-activity.js";
import accessPrep from "./access-prep.js";
import grammarPacks from "./grammar-packs.js";
import claimCheck from "./claim-check.js";
import argumentArena from "./argument-arena.js";
import choiceBoards from "./choice-boards.js";
import languageCity from "./language-city.js";
import communication from "./communication.js";
import exhibition from "./exhibition.js";
import adventures from "./adventures.js";
import errorDetective from "./error-detective.js";
import conversationSim from "./conversation-sim.js";
import constructionLab from "./construction-lab.js";
import dialogueStudio from "./dialogue-studio.js";
import sentenceArchitect from "./sentence-architect.js";
import k2Starters from "./k2-starters.js";
import { normalizeActivity } from "../core/schema.js";
import { validateActivity } from "../core/validate.js";

export { hashSource };

/** family id -> adapter (see CUSTOMIZE.md for the contract). Order is the order a teacher sees. */
export const ADAPTERS = Object.freeze({
  [accessBank.family]: accessBank,
  [vocabAcademy.family]: vocabAcademy,
  [readingRoom.family]: readingRoom,
  [bcpssUnit.family]: bcpssUnit,
  [readingLadder.family]: readingLadder,
  [missions.family]: missions,
  [puzzleDen.family]: puzzleDen,
  [mentorTexts.family]: mentorTexts,
  [newsroomPrompts.family]: newsroomPrompts,
  [readingPath.family]: readingPath,
  [newcomerPacks.family]: newcomerPacks,
  [questMissions.family]: questMissions,
  [studioTask.family]: studioTask,
  [twr.family]: twr,
  [talkTable.family]: talkTable,
  [warmup.family]: warmup,
  [subjectReading.family]: subjectReading,
  [teachBack.family]: teachBack,
  [wordParts.family]: wordParts,
  [wordlab.family]: wordlab,
  [phonics.family]: phonics,
  [worldMissions.family]: worldMissions,
  [scenarios.family]: scenarios,
  [voiceLab.family]: voiceLab,
  [scaffoldItems.family]: scaffoldItems,
  [craftSentences.family]: craftSentences,
  [labActivity.family]: labActivity,
  [accessPrep.family]: accessPrep,
  [grammarPacks.family]: grammarPacks,
  [claimCheck.family]: claimCheck,
  [argumentArena.family]: argumentArena,
  [choiceBoards.family]: choiceBoards,
  [languageCity.family]: languageCity,
  [communication.family]: communication,
  [exhibition.family]: exhibition,
  [adventures.family]: adventures,
  [errorDetective.family]: errorDetective,
  [conversationSim.family]: conversationSim,
  [constructionLab.family]: constructionLab,
  [dialogueStudio.family]: dialogueStudio,
  [sentenceArchitect.family]: sentenceArchitect,
  [k2Starters.family]: k2Starters,
});

export class CustomizeError extends Error {
  constructor(code, message) {
    super(message || code);
    this.code = code;
  }
}

export const adapterFor = (family) => (Object.hasOwn(ADAPTERS, family) ? ADAPTERS[family] : null);

/** What the chooser shows: every family a teacher can customize, with what is and is not editable. */
export const listFamilies = () =>
  Object.values(ADAPTERS).map(({ family, label, note, editable, fixed }) => ({
    family,
    label,
    note,
    editable: [...editable],
    fixed: fixed.map((f) => ({ ...f })),
  }));

/** `newId` lives in drafts.js (newActivityId); it is a dependency so this module never imports browser code. */
const ID_RE = /^s[a-f0-9]{10}$/;
function defaultNewId() {
  const bytes = new Uint8Array(5);
  globalThis.crypto.getRandomValues(bytes);
  return `s${Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("")}`;
}

/**
 * Copy a platform activity into a fresh, unsaved teacher draft.
 * @param {string} family adapter id
 * @param {string} ref    the platform resource id (set id, unit id, ...)
 * @param {{fetchJson: (url: string) => Promise<any>, newId?: () => string, now?: number, band?: string}} deps
 * @returns {Promise<{activity, notes, editable, validation, source: {family, ref}}>}
 * Throws CustomizeError("unknown-family" | "not-found" | "bad-source") when the source cannot be read.
 */
export async function customizeFrom(family, ref, deps) {
  const adapter = adapterFor(family);
  if (!adapter) throw new CustomizeError("unknown-family");
  if (typeof deps?.fetchJson !== "function") throw new CustomizeError("no-fetch");
  let made;
  try {
    made = await adapter.extract(String(ref), deps);
  } catch (e) {
    throw new CustomizeError(e?.message === "bad-source" ? "bad-source" : "not-found", e?.message);
  }
  const now = Number.isFinite(deps.now) ? deps.now : Date.now();
  const id = (deps.newId || defaultNewId)();
  if (!ID_RE.test(id)) throw new CustomizeError("bad-id");
  const activity = normalizeActivity({
    ...made.activity,
    id,
    rev: 0,
    createdAt: now,
    updatedAt: now,
    lineage: {
      family,
      ref: String(ref),
      title: made.sourceTitle || made.activity.title,
      url: made.url || "",
      sourceHash: hashSource(made.source ?? made.activity),
    },
  });
  return {
    activity,
    notes: made.notes,
    editable: editableFor(adapter, activity),
    validation: validateActivity(activity),
    source: { family, ref: String(ref) },
  };
}
