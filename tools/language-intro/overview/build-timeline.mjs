// Turns script.json + the synthesized line durations (narrate.py) into everything the film needs:
//   <out>/timeline.json    scene and line timings read by the Remotion composition
//   <out>/narration.wav    the narration, each line placed at its start time
//   <out>/overview.vtt     English captions, one cue per line (long lines split once at a natural break)
// Usage: node build-timeline.mjs <work-dir>   (work-dir holds narration.json and lines/*.wav from narrate.py)
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const work = process.argv[2];
const here = dirname(fileURLToPath(import.meta.url));
const script = JSON.parse(readFileSync(join(here, "script.json"), "utf8"));
const durs = JSON.parse(readFileSync(join(work, "narration.json"), "utf8"));

const LEAD_IN = 0.7; // silence before the first word
const SCENE_LEAD = 0.45;
const LINE_GAP = 0.4;
const SCENE_TAIL = 0.8;

let t = 0;
const scenes = [];
for (const [si, scene] of script.scenes.entries()) {
  const start = t;
  let cursor = start + (si === 0 ? LEAD_IN : SCENE_LEAD);
  const lines = scene.lines.map((line, i) => {
    const d = durs[scene.id][i];
    const row = {
      start: round(cursor),
      dur: round(d),
      text: line.text,
      wav: `lines/${scene.id}-${i}.wav`,
    };
    cursor += d + LINE_GAP + (line.pad || 0);
    return row;
  });
  const end = lines[lines.length - 1].start + lines[lines.length - 1].dur + SCENE_TAIL;
  scenes.push({
    id: scene.id,
    kicker: scene.kicker,
    start: round(start),
    dur: round(end - start),
    lines,
  });
  t = end;
}
const total = round(t + 0.6);
writeFileSync(join(work, "timeline.json"), JSON.stringify({ fps: 30, total, scenes }, null, 1));

// Narration: every line delayed to its start, mixed to one mono file.
const inputs = [];
const filters = [];
let n = 0;
for (const s of scenes)
  for (const l of s.lines) {
    inputs.push("-i", join(work, l.wav));
    filters.push(`[${n}:a]adelay=${Math.round(l.start * 1000)}:all=1[a${n}]`);
    n += 1;
  }
const mix = `${filters.join(";")};${Array.from({ length: n }, (_, i) => `[a${i}]`).join("")}amix=inputs=${n}:normalize=0:duration=longest[o]`;
execFileSync("ffmpeg", [
  "-v",
  "error",
  "-y",
  ...inputs,
  "-filter_complex",
  mix,
  "-map",
  "[o]",
  "-ar",
  "44100",
  "-ac",
  "1",
  join(work, "narration.wav"),
]);

// Captions.
const stamp = (s) => {
  const ms = Math.round(s * 1000);
  const p = (v, w) => String(v).padStart(w, "0");
  return `${p(Math.floor(ms / 3600000), 2)}:${p(Math.floor(ms / 60000) % 60, 2)}:${p(Math.floor(ms / 1000) % 60, 2)}.${p(ms % 1000, 3)}`;
};
function split(text) {
  if (text.length <= 78) return [text];
  const mid = text.length / 2;
  const breaks = [...text.matchAll(/[,:] |\? | and /g)].map(
    (m) => m.index + (m[0].startsWith(" and") ? 0 : m[0].length - 1),
  );
  if (!breaks.length) return [text];
  const at = breaks.reduce((a, b) => (Math.abs(b - mid) < Math.abs(a - mid) ? b : a));
  return [text.slice(0, at).trim(), text.slice(at).trim()];
}
const cues = [];
for (const s of scenes)
  for (const l of s.lines) {
    const parts = split(l.text);
    const chars = parts.reduce((a, p) => a + p.length, 0);
    let at = l.start;
    for (const p of parts) {
      const d = (l.dur * p.length) / chars;
      cues.push({ start: at, end: at + d, text: p });
      at += d;
    }
  }
const vtt = `WEBVTT\n\n${cues.map((c) => `${stamp(c.start)} --> ${stamp(c.end)}\n${c.text}`).join("\n\n")}\n`;
writeFileSync(join(work, "overview.vtt"), vtt);
console.log(`total ${total}s, ${scenes.length} scenes, ${cues.length} cues`);
console.log(scenes.map((s) => `${s.id} ${s.start}+${s.dur}`).join("  "));
function round(v) {
  return Math.round(v * 1000) / 1000;
}
