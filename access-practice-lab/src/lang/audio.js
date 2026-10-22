// Speech-activity analysis from a loudness envelope. Runs on the device, on levels the recorder
// already samples, so no audio is sent to any service. It measures *how a response unfolded*
// (time speaking, pauses, longest uninterrupted run) — never accent, pronunciation, or correctness.

const round = (v) => Math.round(v * 10) / 10;
const pct = (arr, p) => {
  const s = [...arr].sort((a, b) => a - b);
  return s.length ? s[Math.min(s.length - 1, Math.floor((p / 100) * s.length))] : 0;
};
const median5 = (a) =>
  a.map((_, i) => {
    const w = a.slice(Math.max(0, i - 2), i + 3).sort((x, y) => x - y);
    return w[Math.floor(w.length / 2)];
  });

/**
 * @param {number[]} levels loudness 0..1, one per frame
 * @param {number} fps frames per second the levels were sampled at
 */
export function summarizeEnvelope(levels, fps = 20) {
  const n = levels.length;
  const seconds = n / fps;
  if (n < fps) return { ok: false, reason: "too-short", seconds };
  const smooth = median5(levels);
  const floor = pct(smooth, 20);
  const loud = pct(smooth, 90);
  if (loud < 0.08) return { ok: false, reason: "too-quiet", seconds, loud };
  const threshold = Math.max(0.06, floor * 2.2, loud * 0.22);
  const speech = smooth.map((v) => v > threshold);
  // merge tiny gaps (< 0.25 s): plosives and breaths are not pauses
  const minGap = Math.round(0.25 * fps);
  let lastOn = -1;
  for (let i = 0; i < n; i++) {
    if (!speech[i]) continue;
    if (lastOn >= 0 && i - lastOn > 1 && i - lastOn <= minGap)
      for (let j = lastOn + 1; j < i; j++) speech[j] = true;
    lastOn = i;
  }
  const segs = [];
  let start = -1;
  for (let i = 0; i <= n; i++) {
    if (i < n && speech[i]) {
      if (start < 0) start = i;
    } else if (start >= 0) {
      if (i - start >= Math.round(0.12 * fps)) segs.push({ start: start / fps, end: i / fps });
      start = -1;
    }
  }
  if (!segs.length) return { ok: false, reason: "no-speech", seconds };
  const speechSeconds = segs.reduce((a, s) => a + (s.end - s.start), 0);
  const gaps = segs.slice(1).map((s, i) => s.start - segs[i].end);
  const pauses = gaps.filter((g) => g >= 0.8);
  const longPauses = gaps.filter((g) => g >= 2);
  const runs = segs.map((s) => s.end - s.start);
  const span = segs.at(-1).end - segs[0].start;
  return {
    ok: true,
    seconds: round(seconds),
    speechSeconds: round(speechSeconds),
    activeRatio: Math.round((speechSeconds / Math.max(span, 0.1)) * 100) / 100,
    startDelay: round(segs[0].start),
    pauseCount: pauses.length,
    longPauseCount: longPauses.length,
    pausesPer30: round((pauses.length / Math.max(span, 1)) * 30),
    longestRun: round(Math.max(...runs)),
    meanRun: round(runs.reduce((a, b) => a + b, 0) / runs.length),
    segments: segs.map((s) => ({ start: round(s.start), end: round(s.end) })),
  };
}

/** Plain-language read-out for the learner. Observations, not judgements. */
export function describeSpeech(sum, target = [30, 90]) {
  if (!sum.ok) {
    const text =
      {
        "too-short": "That take was under a second. Try again and speak for a few seconds.",
        "too-quiet": "We could barely hear you. Move closer to the microphone or check the volume.",
        "no-speech": "We did not hear speech in that take.",
      }[sum.reason] || "We could not analyze that take.";
    return [{ ok: false, text }];
  }
  const out = [
    {
      ok: true,
      text: `You spoke for ${sum.speechSeconds} seconds in a ${sum.seconds}-second recording.`,
    },
  ];
  if (sum.seconds < target[0])
    out.push({
      ok: false,
      text: `Aim for at least ${target[0]} seconds. What detail could you add?`,
    });
  else if (sum.seconds > target[1])
    out.push({
      ok: true,
      text: `Your take is longer than the usual ${target[1]} seconds. Which part is the most important?`,
    });
  else out.push({ ok: true, text: "Your take is in the target range." });
  if (sum.longestRun >= 8)
    out.push({
      ok: true,
      text: `Your longest stretch without stopping was ${sum.longestRun} seconds.`,
    });
  else if (sum.pauseCount >= 4)
    out.push({
      ok: false,
      text: `You paused ${sum.pauseCount} times. Plan the next idea before you start it, then say it in one stretch.`,
    });
  if (sum.startDelay >= 5)
    out.push({
      ok: false,
      text: `You began speaking after ${sum.startDelay} seconds. Use your plan to start right away.`,
    });
  return out;
}
