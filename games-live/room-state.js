/*
 * Neft Math Brain — Live Rooms: pure room-state logic (ESM).
 * No Durable Object, no WebSocket, no DOM — just the state machine, so it can be
 * unit-tested in Node and imported verbatim by the DO. The DO wrapper (worker.js)
 * owns transport + persistence; this owns the rules.
 *
 * A "room" hosts one standard-aligned quiz game. Players join with a code, answer
 * timed questions, earn speed-weighted points, and the host sees a live leaderboard.
 * On end, each player's run is emitted as an nt_result_v1-compatible record so live
 * play feeds the same mastery engine as every other activity.
 */
"use strict";

const MAX_POINTS = 1000;
const MIN_POINTS = 500; // correct-but-slow floor

export function makeRoom(opts) {
  opts = opts || {};
  return {
    code: opts.code,
    standard: opts.standard || "MIXED",
    title: opts.title || "Live Game",
    questions: opts.questions || [], // [{ prompt, choices[], answerIndex, skill }]
    phase: "lobby", // lobby -> question -> reveal -> ended
    current: -1,
    players: {}, // id -> { id, name, score, answers:[{q,choice,correct,ms}] }
    questionStartedAt: null,
  };
}

export function addPlayer(room, id, name) {
  if (room.phase !== "lobby") return { ok: false, error: "join-closed" };
  if (room.players[id]) return { ok: true, player: room.players[id] };
  room.players[id] = {
    id: id,
    name: String(name || "Player").slice(0, 24),
    score: 0,
    answers: [],
  };
  return { ok: true, player: room.players[id] };
}

export function start(room, now) {
  if (!room.questions.length) return { ok: false, error: "no-questions" };
  room.phase = "question";
  room.current = 0;
  room.questionStartedAt = now;
  return { ok: true };
}

// speed-weighted scoring: full points for instant, decaying to MIN_POINTS over the limit
export function pointsFor(ms, limitMs) {
  const frac = Math.max(0, Math.min(1, ms / (limitMs || 20000)));
  return Math.round(MAX_POINTS - frac * (MAX_POINTS - MIN_POINTS));
}

export function submitAnswer(room, playerId, choiceIndex, now) {
  if (room.phase !== "question") return { ok: false, error: "not-accepting" };
  const p = room.players[playerId];
  if (!p) return { ok: false, error: "no-player" };
  if (p.answers.some((a) => a.q === room.current))
    return { ok: false, error: "already-answered" };
  const q = room.questions[room.current];
  const ms = now - (room.questionStartedAt || now);
  const correct = choiceIndex === q.answerIndex;
  const gained = correct ? pointsFor(ms, q.limitMs) : 0;
  p.answers.push({
    q: room.current,
    choice: choiceIndex,
    correct: correct,
    ms: ms,
    skill: q.skill || null,
  });
  p.score += gained;
  return { ok: true, correct: correct, gained: gained, score: p.score };
}

export function reveal(room) {
  if (room.phase !== "question") return { ok: false, error: "not-in-question" };
  room.phase = "reveal";
  return { ok: true, answerIndex: room.questions[room.current].answerIndex };
}

export function next(room, now) {
  if (room.current + 1 >= room.questions.length) {
    room.phase = "ended";
    return { ok: true, ended: true };
  }
  room.current += 1;
  room.phase = "question";
  room.questionStartedAt = now;
  return { ok: true, ended: false, current: room.current };
}

export function leaderboard(room) {
  return Object.keys(room.players)
    .map((id) => ({
      name: room.players[id].name,
      score: room.players[id].score,
      id: id,
    }))
    .sort((a, b) => b.score - a.score);
}

// Per-player nt_result_v1-compatible records so live play feeds the mastery engine.
export function toResults(room, nowIso) {
  const total = room.questions.length || 1;
  return Object.keys(room.players).map((id) => {
    const p = room.players[id];
    const correct = p.answers.filter((a) => a.correct).length;
    const skills = p.answers.map((a) => ({
      skill: a.skill || room.standard,
      correct: a.correct,
    }));
    return {
      schema: "nt_result_v1",
      studentAlias: p.name,
      section: room.code,
      activityId: "live:" + room.code,
      activityTitle: room.title,
      standard: room.standard,
      scorePercent: Math.round((correct / total) * 1000) / 10,
      skills: skills,
      completedAt: nowIso,
      deviceOnly: false,
      source: "live-room",
    };
  });
}

// safe public snapshot (no answer keys leaked to players)
export function publicState(room) {
  const q =
    room.phase === "question" && room.questions[room.current]
      ? {
          prompt: room.questions[room.current].prompt,
          choices: room.questions[room.current].choices,
          index: room.current,
          total: room.questions.length,
        }
      : null;
  return {
    code: room.code,
    title: room.title,
    standard: room.standard,
    phase: room.phase,
    question: q,
    leaderboard: leaderboard(room),
    playerCount: Object.keys(room.players).length,
  };
}
