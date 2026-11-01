// Word Sprint: a 60-second round over one band's Word Builder items, one attempt per word.
// Pure state logic only; the Word Builder view draws it. Results are practice counts on this device,
// not a proficiency or fluency score.
export const SPRINT_SECONDS = 60;

const clampCount = (value) => (Number.isInteger(value) && value > 0 ? value : 0);

// Fisher–Yates over a copy, so the caller's array is never reordered.
function shuffled(ids, random) {
  const out = [...ids];
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export function startSprint(items, now, random = Math.random) {
  return {
    startedAt: now,
    deadline: now + SPRINT_SECONDS * 1000,
    order: shuffled(
      items.map((item) => item.id),
      random,
    ),
    index: 0,
    answered: 0,
    correct: 0,
    checked: false,
  };
}

export function sprintStatus(sprint, now) {
  if (!sprint) return "none";
  return now >= sprint.deadline ? "over" : "running";
}

// The word on screen during a running sprint. The order wraps so a fast learner never runs out of words.
export function sprintWordId(sprint) {
  return sprint.order[sprint.index % sprint.order.length];
}

export function recordSprintAnswer(sprint, correct) {
  return {
    ...sprint,
    answered: clampCount(sprint.answered) + 1,
    correct: clampCount(sprint.correct) + (correct ? 1 : 0),
    checked: true,
  };
}

export function advanceSprint(sprint) {
  return { ...sprint, index: clampCount(sprint.index) + 1, checked: false };
}

// Ends a sprint and keeps the best correct count for this band. Returns the next saved band state.
export function closeSprint(bandState) {
  const { sprint, ...rest } = bandState;
  if (!sprint) return rest;
  return { ...rest, sprintBest: Math.max(clampCount(rest.sprintBest), clampCount(sprint.correct)) };
}

export function clockText(msLeft) {
  const seconds = Math.max(0, Math.ceil(msLeft / 1000));
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}
