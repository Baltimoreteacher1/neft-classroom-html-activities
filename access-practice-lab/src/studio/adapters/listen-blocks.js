// Read-aloud content as blocks: the script to hear (audio blocks, each within the schema's limit) plus a transcript
// passage so the words are always on the page. Shared by every adapter that carries audio or listen-only text.

import { chunkText, text } from "./util.js";

const SAY_MAX = 600;
const idOf = (kind, id) => `${kind}-${id}`.slice(0, 32);

/**
 * @param {string} id     stable block-id suffix
 * @param {string} title  what the clip is called (also the transcript heading)
 * @param {string[]} lines the spoken lines (a speaker label belongs inside the line)
 */
export function listenBlocks(id, title, lines) {
  const pieces = lines.flatMap((line) => chunkText(line, SAY_MAX));
  const label = (n) => (pieces.length > 1 ? `${title} (${n + 1}/${pieces.length})` : title).slice(0, 80);
  const audio = pieces.map((say, n) => ({
    type: "audio",
    id: idOf(pieces.length > 1 ? `a${n + 1}` : "a", id),
    say,
    label: label(n),
  }));
  const transcript = {
    type: "passage",
    id: idOf("tr", id),
    title: `Transcript: ${text(title).replace(/^Listen:\s*/i, "")}`.slice(0, 120),
    text: lines.join("\n\n"),
  };
  return [...audio, transcript];
}
