/*
 * Neft Math Brain — Live Rooms: pure room-state logic.
 * No Durable Object, no WebSocket, no DOM — just the state machine, so it can be
 * unit-tested in Node and reused verbatim inside the DO. The DO wrapper (worker.js)
 * owns transport + persistence; this owns the rules.
 *
 * A "room" hosts one standard-aligned quiz game. Players join with a code, answer
 * timed questions, earn speed-weighted points, and the host sees a live leaderboard.
 * On end, each player's run is emitted as an nt_result_v1-compatible record so live
 * play feeds the same mastery engine as every other activity.
 */
(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  root.NeftLiveRoom = api;
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  var MAX_POINTS = 1000;
  var MIN_POINTS = 500; // correct-but-slow floor

  function makeRoom(opts) {
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

  function addPlayer(room, id, name) {
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

  function start(room, now) {
    if (!room.questions.length) return { ok: false, error: "no-questions" };
    room.phase = "question";
    room.current = 0;
    room.questionStartedAt = now;
    return { ok: true };
  }

  // speed-weighted scoring: full points for instant, decaying to MIN_POINTS over the limit
  function pointsFor(ms, limitMs) {
    var frac = Math.max(0, Math.min(1, ms / (limitMs || 20000)));
    return Math.round(MAX_POINTS - frac * (MAX_POINTS - MIN_POINTS));
  }

  function submitAnswer(room, playerId, choiceIndex, now) {
    if (room.phase !== "question") return { ok: false, error: "not-accepting" };
    var p = room.players[playerId];
    if (!p) return { ok: false, error: "no-player" };
    if (
      p.answers.some(function (a) {
        return a.q === room.current;
      })
    )
      return { ok: false, error: "already-answered" };
    var q = room.questions[room.current];
    var ms = now - (room.questionStartedAt || now);
    var correct = choiceIndex === q.answerIndex;
    var gained = correct ? pointsFor(ms, q.limitMs) : 0;
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

  function reveal(room) {
    if (room.phase !== "question")
      return { ok: false, error: "not-in-question" };
    room.phase = "reveal";
    return { ok: true, answerIndex: room.questions[room.current].answerIndex };
  }

  function next(room, now) {
    if (room.current + 1 >= room.questions.length) {
      room.phase = "ended";
      return { ok: true, ended: true };
    }
    room.current += 1;
    room.phase = "question";
    room.questionStartedAt = now;
    return { ok: true, ended: false, current: room.current };
  }

  function leaderboard(room) {
    return Object.keys(room.players)
      .map(function (id) {
        return {
          name: room.players[id].name,
          score: room.players[id].score,
          id: id,
        };
      })
      .sort(function (a, b) {
        return b.score - a.score;
      });
  }

  // Per-player nt_result_v1-compatible records so live play feeds the mastery engine.
  function toResults(room, nowIso) {
    var total = room.questions.length || 1;
    return Object.keys(room.players).map(function (id) {
      var p = room.players[id];
      var correct = p.answers.filter(function (a) {
        return a.correct;
      }).length;
      var skills = p.answers.map(function (a) {
        return { skill: a.skill || room.standard, correct: a.correct };
      });
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
  function publicState(room) {
    var q =
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

  return {
    makeRoom: makeRoom,
    addPlayer: addPlayer,
    start: start,
    submitAnswer: submitAnswer,
    reveal: reveal,
    next: next,
    leaderboard: leaderboard,
    toResults: toResults,
    publicState: publicState,
    pointsFor: pointsFor,
  };
});
