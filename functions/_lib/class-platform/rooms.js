/* =============================================================================
 * Live rooms for the class platform — poll-based on D1 (the sg-room design,
 * widened from a table of six seats to a class).
 * -----------------------------------------------------------------------------
 * Kinds:
 *   session    Fluency Lab teacher-paced session: pause, pace to problem N,
 *              anonymized response wall, snapshots. Untimed by construction:
 *              the room stores no deadline and exposes no answer times.
 *   game       Fluency Lab cross-device class game: turns advance when the
 *              teacher moves to the next problem (never on a clock); every
 *              right first answer adds to ONE class score and to the player's
 *              team, and nothing ever subtracts.
 *   workspace  Fluency Lab live view of student workspaces (teacher only sees
 *              them; students never see each other's).
 *   quiz       Language Page live class quiz: untimed accuracy rounds over the
 *              lab's own item bank ids.
 * Problems are generated on every device from the shared config (skill, grade,
 * seed) or named by item id, so the server stores no problem. The SERVER judges
 * every answer: it regenerates the problem from the same seed (session, game)
 * or reads the quiz key (quiz), and ignores any `correct` the client sends, so a
 * modified client cannot inflate the class score.
 *
 * Routes (/api/class/room/*):
 *   POST open      { code, kind, config }                  teacher -> { roomId, state }
 *   POST control   { code, roomId, status?, item?, reveal?, snapshot? }  teacher
 *   GET  active?code=                                       student|teacher
 *   GET  state?code=&roomId=                                student|teacher
 *   POST respond   { code, roomId, item, answer, correct }  student
 *   POST workspace { code, roomId, workspace }              student
 *   GET  detail?code=&roomId=                               teacher (aliases)
 * ========================================================================== */

import {
  ALL_SKILLS,
  generateProblem,
  seededRandom,
  validateAnswer,
} from "../../../math/fluency-lab/problem-bank.js";
import { cleanText, isRoomId, LIMITS } from "../../../shared/class-platform/contract.js";
import quizKey from "../../../shared/class-platform/quiz-key.js";
import { clientIp, createRateLimiter, tooManyRequests } from "../http.js";
import { parseJson, ROOM_TTL_MS, randomHex, studentFromRequest, teacherRole } from "./store.js";

export const ROOM_KINDS = Object.freeze({
  session: { app: "fluency", replace: true },
  game: { app: "fluency", replace: false },
  workspace: { app: "fluency", replace: true },
  quiz: { app: "language", replace: false },
});
const STATUSES = ["lobby", "live", "paused", "ended"];
const MAX_ITEMS = 60;
const MAX_SNAPSHOTS = 20;
const ID_RE = /^[a-z0-9][a-z0-9:_-]{0,39}$/;
const respondLimit = createRateLimiter({ max: 600, windowMs: 60_000 });

export function validateRoomConfig(kind, raw) {
  const c = raw && typeof raw === "object" ? raw : {};
  const out = { title: cleanText(c.title, 60) };
  if (kind === "quiz") {
    if (
      !Array.isArray(c.itemIds) ||
      !c.itemIds.length ||
      c.itemIds.length > MAX_ITEMS ||
      !c.itemIds.every((id) => typeof id === "string" && ID_RE.test(id) && quizKey.items[id])
    )
      return { ok: false, error: "invalid-items" };
    out.itemIds = [...new Set(c.itemIds)];
    out.count = out.itemIds.length;
    return { ok: true, config: out };
  }
  if (typeof c.skill !== "string" || !ID_RE.test(c.skill))
    return { ok: false, error: "invalid-skill" };
  if (!Number.isInteger(c.grade) || c.grade < 0 || c.grade > 8)
    return { ok: false, error: "invalid-grade" };
  if (!fluencySkill(c.grade, c.skill)) return { ok: false, error: "unknown-skill" };
  const count = c.count ?? 8;
  if (!Number.isInteger(count) || count < 1 || count > MAX_ITEMS)
    return { ok: false, error: "invalid-count" };
  out.skill = c.skill;
  out.grade = c.grade;
  out.count = count;
  out.seed = Number.isInteger(c.seed) && c.seed > 0 ? c.seed : Math.floor(Math.random() * 1e9) + 1;
  if (kind === "game") {
    const teams = c.teams ?? 2;
    if (!Number.isInteger(teams) || teams < 1 || teams > 4)
      return { ok: false, error: "invalid-teams" };
    out.teams = teams;
  }
  return { ok: true, config: out };
}

const fluencySkill = (grade, id) =>
  ALL_SKILLS.find((skill) => skill.grade === grade && skill.id === id) || null;

/**
 * The server's own verdict on an answer (1 right, 0 wrong). Fluency rooms regenerate problem N from the shared
 * seed exactly as every device does (math/fluency-lab/class/live.js `roomProblem`); quiz rooms read the key.
 * The client's `correct` is never consulted, so a modified client cannot inflate a score.
 */
export function judgeAnswer(kind, config, item, answer) {
  if (kind === "quiz") {
    const key = quizKey.items[config.itemIds?.[item]];
    return key && answer === key.answer ? 1 : 0;
  }
  const skill = fluencySkill(config.grade, config.skill);
  if (!skill) return 0;
  const problem = generateProblem(skill, seededRandom((config.seed + item * 7919) >>> 0));
  return validateAnswer(answer, problem) ? 1 : 0;
}

/** Team for a student in a game room: stable, spread evenly by join order hash. */
export const teamOf = (studentId, teams) =>
  (Number.parseInt(studentId.slice(1, 7), 16) % teams) + 1;

async function loadRoom(ctx, cls, roomId) {
  if (!isRoomId(roomId)) return null;
  const row = await ctx.db
    .prepare(`SELECT * FROM class_platform_room WHERE room_id = ? AND code = ? AND expires_at >= ?`)
    .bind(roomId, cls.code, ctx.now)
    .first();
  return row ? { ...row, state: parseJson(row.state_json, {}) } : null;
}

async function itemResponses(ctx, roomId, item) {
  const res = await ctx.db
    .prepare(
      `SELECT student_id, response_json, correct FROM class_platform_response WHERE room_id = ? AND item = ?`,
    )
    .bind(roomId, String(item))
    .all();
  return res.results || [];
}

/** The anonymized wall: distinct answers with counts, no names, shuffled by value not time. */
export function wallOf(rows) {
  const counts = new Map();
  for (const r of rows) {
    const answer = parseJson(r.response_json, {}).answer;
    if (typeof answer !== "string" || !answer) continue;
    counts.set(answer, (counts.get(answer) || 0) + 1);
  }
  return [...counts.entries()]
    .map(([answer, count]) => ({ answer, count }))
    .sort((a, b) => b.count - a.count || a.answer.localeCompare(b.answer));
}

async function scores(ctx, room) {
  const res = await ctx.db
    .prepare(
      `SELECT student_id, correct FROM class_platform_response WHERE room_id = ? AND item != 'ws' AND correct = 1`,
    )
    .bind(room.room_id)
    .all();
  const rows = res.results || [];
  const out = { classScore: rows.length };
  if (room.kind === "game") {
    const teams = Array.from({ length: room.state.config.teams }, () => 0);
    for (const r of rows) teams[teamOf(r.student_id, room.state.config.teams) - 1] += 1;
    out.teamScores = teams;
  }
  return out;
}

async function publicState(ctx, room, student) {
  const { state } = room;
  const rows = await itemResponses(ctx, room.room_id, state.item);
  const total = await ctx.db
    .prepare(`SELECT COUNT(*) AS n FROM class_platform_student WHERE code = ?`)
    .bind(room.code)
    .first();
  const mine = student ? rows.find((r) => r.student_id === student.student_id) : null;
  return {
    ok: true,
    roomId: room.room_id,
    kind: room.kind,
    version: Number(room.version),
    status: state.status,
    item: state.item,
    reveal: state.reveal,
    config: state.config,
    snapshots: state.snapshots || [],
    answered: rows.length,
    students: Number(total?.n) || 0,
    wall: state.reveal && room.kind !== "workspace" ? wallOf(rows) : [],
    ...(room.kind === "game" || room.kind === "quiz" ? await scores(ctx, room) : {}),
    ...(student && room.kind === "game"
      ? { team: teamOf(student.student_id, state.config.teams) }
      : {}),
    ...(mine
      ? {
          mine: {
            ...parseJson(mine.response_json, {}),
            correct:
              mine.correct == null || !(room.kind === "quiz" || state.reveal)
                ? null
                : mine.correct === 1,
          },
        }
      : {}),
  };
}

async function asStudentOrTeacher(ctx, cls) {
  if (await teacherRole(ctx.request, ctx.env, cls)) return { teacher: true };
  const student = await studentFromRequest(ctx.request, ctx.db, cls);
  return student ? { student } : null;
}

export async function handleRoom(ctx, action) {
  const { db, body, url, now, method, fail } = ctx;
  const key = `${method} ${action}`;
  const codeRaw = method === "GET" ? url.searchParams.get("code") : body?.code;

  if (key === "POST open" || key === "POST control" || key === "GET detail") {
    const auth = await ctx.requireTeacher(ctx, codeRaw);
    if (auth.error) return auth.error;
    const { cls } = auth;
    if (key === "POST open") {
      const kind = ROOM_KINDS[body?.kind];
      if (!kind || kind.app !== cls.app) return fail("invalid-kind");
      const config = validateRoomConfig(body.kind, body.config);
      if (!config.ok) return fail(config.error);
      const roomId = `r${randomHex(5)}`;
      const state = {
        status: "lobby",
        item: 0,
        reveal: false,
        config: config.config,
        snapshots: [],
      };
      // One live room of a kind per class: opening a new one ends the old.
      await db.batch([
        db
          .prepare(
            `UPDATE class_platform_room SET expires_at = ? WHERE code = ? AND kind = ? AND expires_at >= ?`,
          )
          .bind(now - 1, cls.code, body.kind, now),
        db
          .prepare(
            `INSERT INTO class_platform_room (room_id, code, kind, state_json, version, updated_at, expires_at) VALUES (?, ?, ?, ?, 1, ?, ?)`,
          )
          .bind(roomId, cls.code, body.kind, JSON.stringify(state), now, now + ROOM_TTL_MS),
      ]);
      return { ok: true, roomId, kind: body.kind, state };
    }
    const room = await loadRoom(
      ctx,
      cls,
      method === "GET" ? url.searchParams.get("roomId") : body?.roomId,
    );
    if (!room) return fail("room-not-found", 404);
    if (key === "GET detail") {
      const res = await db
        .prepare(
          `SELECT r.student_id, s.alias, r.item, r.response_json, r.correct FROM class_platform_response r
           JOIN class_platform_student s ON s.code = ? AND s.student_id = r.student_id WHERE r.room_id = ?`,
        )
        .bind(cls.code, room.room_id)
        .all();
      return {
        ...(await publicState(ctx, room, null)),
        wall: wallOf(await itemResponses(ctx, room.room_id, room.state.item)),
        responses: (res.results || []).map((r) => ({
          studentId: r.student_id,
          alias: r.alias,
          item: r.item,
          ...parseJson(r.response_json, {}),
          correct: r.correct == null ? null : r.correct === 1,
          ...(room.kind === "game" ? { team: teamOf(r.student_id, room.state.config.teams) } : {}),
        })),
      };
    }
    const state = { ...room.state };
    if (body.status !== undefined) {
      if (!STATUSES.includes(body.status)) return fail("invalid-status");
      state.status = body.status;
    }
    if (body.item !== undefined) {
      if (!Number.isInteger(body.item) || body.item < 0 || body.item >= state.config.count)
        return fail("invalid-item");
      if (body.item !== state.item) state.reveal = false;
      state.item = body.item;
    }
    if (body.reveal !== undefined) state.reveal = body.reveal === true;
    if (body.snapshot === true) {
      const wall = wallOf(await itemResponses(ctx, room.room_id, state.item));
      state.snapshots = [...(state.snapshots || []), { item: state.item, at: now, wall }].slice(
        -MAX_SNAPSHOTS,
      );
    }
    await db
      .prepare(
        `UPDATE class_platform_room SET state_json = ?, version = version + 1, updated_at = ? WHERE room_id = ?`,
      )
      .bind(JSON.stringify(state), now, room.room_id)
      .run();
    return publicState(ctx, { ...room, state, version: Number(room.version) + 1 }, null);
  }

  const found = await ctx.requireClass(db, codeRaw, now);
  if (found.error) return found.error;
  const { cls } = found;
  const who = await asStudentOrTeacher(ctx, cls);
  if (!who) return fail("unauthorized", 401);

  if (key === "GET active") {
    const res = await db
      .prepare(
        `SELECT room_id, kind, state_json FROM class_platform_room WHERE code = ? AND expires_at >= ? ORDER BY updated_at DESC`,
      )
      .bind(cls.code, now)
      .all();
    return {
      ok: true,
      rooms: (res.results || [])
        .map((r) => ({ roomId: r.room_id, kind: r.kind, state: parseJson(r.state_json, {}) }))
        .filter((r) => r.state.status !== "ended")
        .map((r) => ({
          roomId: r.roomId,
          kind: r.kind,
          status: r.state.status,
          title: r.state.config?.title || "",
        })),
    };
  }

  const room = await loadRoom(
    ctx,
    cls,
    method === "GET" ? url.searchParams.get("roomId") : body?.roomId,
  );
  if (!room) return fail("room-not-found", 404);
  if (key === "GET state") return publicState(ctx, room, who.student || null);

  if (!who.student) return fail("students-only", 403);
  if (respondLimit(clientIp(ctx.request), now)) return tooManyRequests();
  if (room.state.status !== "live") return fail("room-not-live", 409);

  if (key === "POST respond") {
    if (room.kind === "workspace") return fail("invalid-kind");
    if (body.item !== room.state.item) return fail("not-current-item", 409);
    const answer = cleanText(body.answer, LIMITS.maxResponse);
    if (!answer) return fail("missing-answer");
    const correct = judgeAnswer(room.kind, room.state.config, room.state.item, answer);
    const verb =
      ROOM_KINDS[room.kind].replace && !room.state.reveal
        ? "INSERT OR REPLACE"
        : "INSERT OR IGNORE";
    const res = await db
      .prepare(
        `${verb} INTO class_platform_response (room_id, student_id, item, response_json, correct, created_at) VALUES (?, ?, ?, ?, ?, ?)`,
      )
      .bind(
        room.room_id,
        who.student.student_id,
        String(room.state.item),
        JSON.stringify({ answer }),
        correct,
        now,
      )
      .run();
    const recorded = Number(res.meta?.changes || 0) > 0;
    // Quiz rounds give feedback as soon as the learner commits; the other rooms wait for the teacher's reveal.
    return {
      ok: true,
      recorded,
      ...(room.kind === "quiz" && recorded ? { correct: correct === 1 } : {}),
    };
  }

  if (key === "POST workspace") {
    if (room.kind !== "workspace") return fail("invalid-kind");
    const ws = body.workspace;
    const text = ws && typeof ws === "object" ? JSON.stringify(ws) : "";
    if (!text || text.length > LIMITS.maxWorkspaceBytes)
      return fail("invalid-workspace", text ? 413 : 400);
    await db
      .prepare(
        `INSERT OR REPLACE INTO class_platform_response (room_id, student_id, item, response_json, correct, created_at) VALUES (?, ?, 'ws', ?, NULL, ?)`,
      )
      .bind(
        room.room_id,
        who.student.student_id,
        JSON.stringify({ answer: "ws", workspace: ws }),
        now,
      )
      .run();
    return { ok: true };
  }
  return fail("not-found", 404);
}
