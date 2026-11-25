// ACCESS Practice Lab bank stimuli -> lp-activity/1 content blocks.
//   passage -> passage block        table -> text heading + table block        prompt -> text block (task context)
//   audio   -> audio block(s) holding the read-aloud script, PLUS a passage block with the transcript, so the
//              words are always on the page (the customized copy is instructional practice, not a test).

import { listenBlocks } from "./listen-blocks.js";
import { tableBlocks, text } from "./util.js";

const idOf = (kind, id) => `${kind}-${id}`.slice(0, 32);

const turnLines = (turns) =>
  turns.length === 1
    ? [text(turns[0].text)]
    : turns.map((tn) => `${text(tn.speaker)}: ${text(tn.text)}`);

const audioBlocks = (stim) => listenBlocks(stim.id, stim.title, turnLines(stim.turns));

const BUILD = {
  passage: (s) => [
    {
      type: "passage",
      id: idOf("p", s.id),
      title: text(s.title),
      text: s.paragraphs.map(text).join("\n\n"),
    },
  ],
  prompt: (s) => [
    {
      type: "text",
      id: idOf("t", s.id),
      role: "body",
      text: `**${text(s.title)}**\n\n${s.paragraphs.map(text).join("\n\n")}`,
    },
  ],
  table: (s, flags) => [
    { type: "text", id: idOf("h", s.id), role: "heading", text: text(s.title) },
    ...tableBlocks(idOf("tb", s.id), text(s.caption), s.columns.map(text), s.rows.map((r) => r.map(text)), flags),
  ],
  audio: audioBlocks,
};

export const STIMULUS_KINDS = Object.freeze(Object.keys(BUILD));

/** The blocks for one stimulus, or an empty list for a kind this adapter does not know (the caller reports it). */
export const blocksForStimulus = (stim, flags = new Set()) =>
  BUILD[stim.kind] ? BUILD[stim.kind](stim, flags) : [];
