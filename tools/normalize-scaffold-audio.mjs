// Loudness normalisation for human-recorded scaffold audio. Put recordings in
// access-practice-lab/content/scaffold/audio/raw/<word-id>.(wav|m4a|mp3|ogg); this writes <word-id>.mp3 into
// content/scaffold/audio/ at -16 LUFS (two-pass loudnorm, true peak -1.5 dB) and prints the measured result.
//   node tools/normalize-scaffold-audio.mjs           normalise everything in raw/
//   node tools/normalize-scaffold-audio.mjs --check   measure only; exit 1 if any output is outside -16 +/- 1.5 LUFS
// Registering a recording is a separate, human step: add the word's entry in audio-manifest.json with
// source "human", the file name and `recordedBy`; validate:scaffold-content then enforces the loudness range.
import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync } from "node:fs";
import { basename, extname, join } from "node:path";

const DIR = new URL("../access-practice-lab/content/scaffold/audio/", import.meta.url).pathname;
const RAW = join(DIR, "raw");
const TARGET = -16;
const TOL = 1.5;

const ff = spawnSync("ffmpeg", ["-version"]);
if (ff.error) {
  console.warn("SKIP normalize-scaffold-audio: ffmpeg not found");
  process.exit(3);
}

function measure(file, filter = "loudnorm=I=-16:TP=-1.5:LRA=11:print_format=json") {
  const r = spawnSync(
    "ffmpeg",
    ["-hide_banner", "-nostats", "-i", file, "-af", filter, "-f", "null", "-"],
    { encoding: "utf8" },
  );
  const m = r.stderr.match(/\{[\s\S]*?\}/g);
  if (!m) throw new Error(`could not measure ${file}`);
  return JSON.parse(m[m.length - 1]);
}

const check = process.argv.includes("--check");
if (check) {
  const outs = existsSync(DIR) ? readdirSync(DIR).filter((f) => f.endsWith(".mp3")) : [];
  let bad = 0;
  for (const f of outs) {
    const lufs = Number(measure(join(DIR, f)).input_i);
    const ok = Math.abs(lufs - TARGET) <= TOL;
    if (!ok) bad++;
    console.log(`${ok ? "ok  " : "FAIL"} ${f} ${lufs.toFixed(1)} LUFS`);
  }
  console.log(
    outs.length
      ? `${outs.length - bad}/${outs.length} within ${TARGET} +/- ${TOL} LUFS`
      : "no normalised audio yet",
  );
  process.exit(bad ? 1 : 0);
}

if (!existsSync(RAW)) {
  console.log(`nothing to do: put recordings in ${RAW}`);
  process.exit(0);
}
mkdirSync(DIR, { recursive: true });
const files = readdirSync(RAW).filter((f) => /\.(wav|m4a|mp3|ogg)$/i.test(f));
for (const f of files) {
  const src = join(RAW, f);
  const m = measure(src);
  const filter = `loudnorm=I=${TARGET}:TP=-1.5:LRA=11:measured_I=${m.input_i}:measured_TP=${m.input_tp}:measured_LRA=${m.input_lra}:measured_thresh=${m.input_thresh}:offset=${m.target_offset}:linear=true`;
  const out = join(DIR, `${basename(f, extname(f))}.mp3`);
  execFileSync("ffmpeg", [
    "-hide_banner",
    "-loglevel",
    "error",
    "-y",
    "-i",
    src,
    "-af",
    filter,
    "-ar",
    "44100",
    "-ac",
    "1",
    "-b:a",
    "96k",
    out,
  ]);
  console.log(
    `${f}: ${Number(m.input_i).toFixed(1)} -> ${Number(measure(out).input_i).toFixed(1)} LUFS`,
  );
}
console.log(files.length ? `${files.length} file(s) normalised` : "no recordings found in raw/");
