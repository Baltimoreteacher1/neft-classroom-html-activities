// plan-page.test.mjs — the printable small-group plan and the route serving it.
//
// The plan names the errors individual students made and how to repair them, so
// the assertions that matter most here are the ones about REACHABILITY: it must
// live behind the same teacher gate as the JSON, and it must never render an
// empty scaffold that reads as "nothing to do".
import assert from "node:assert/strict";
import { FACILITATION_BY_LESSON } from "./_facilitation-data.js";
import { onRequest } from "./[[path]].js";
import { esc, planPageHtml } from "./_plan-page.js";

const req = (url) => ({ request: new Request(url), params: { path: url.split("/").slice(4) } });

// ── escaping ─────────────────────────────────────────────────────────────
{
  assert.equal(esc(`<script>&"'`), "&lt;script&gt;&amp;&quot;&#39;");
  assert.equal(esc(null), "", "null renders as empty, never the string 'null'");
  const html = planPageHtml("1-1-group1", { who: '<img src=x onerror="alert(1)">' });
  assert.ok(!html.includes("<img src=x"), "authored content cannot inject markup");
  assert.ok(html.includes("&lt;img"), "it is escaped, not stripped");
}

// ── the page renders the real plan ───────────────────────────────────────
{
  const facilitation = FACILITATION_BY_LESSON["1-1-group1"];
  const html = planPageHtml("1-1-group1", facilitation);

  assert.ok(html.startsWith("<!doctype html>"), "a complete document");
  assert.ok(html.includes("Lesson 1-1"), "titled by lesson, variant suffix stripped");
  assert.ok(html.includes(esc(facilitation.label)), "shows which group this is");
  assert.ok(html.includes(esc(facilitation.who)), "who to pull");
  assert.ok(html.includes(esc(facilitation.teacherMoves.ask)), "the opening question");
  assert.ok(html.includes(esc(facilitation.teacherMoves.lookFor)), "what to listen for");
  assert.ok(html.includes(esc(facilitation.teacherMoves.ifStuck)), "what to do when stuck");
  for (const frame of facilitation.frames) assert.ok(html.includes(esc(frame)), `frame: ${frame}`);

  // Self-contained: a Pages Function response cannot rely on the site's assets.
  assert.ok(!/<link[^>]+stylesheet/i.test(html), "no external stylesheet");
  assert.ok(!/<script[^>]+src=/i.test(html), "no external script");
  assert.ok(html.includes("@media print"), "carries its own print rules");
}

// ── a thin plan prints a short sheet, not empty headings ─────────────────
{
  const html = planPageHtml("9-9-group1", { label: "Extra Support" });
  assert.ok(!html.includes("Who to pull"), "an unauthored block is omitted entirely");
  assert.ok(!html.includes("Sentence frames"), "empty lists do not print a heading");
  assert.ok(html.includes("Lesson 9-9"), "the header still renders");
}

// ── every group-1 lesson produces a usable sheet ─────────────────────────
{
  const group1 = Object.entries(FACILITATION_BY_LESSON).filter(([id]) => id.endsWith("-group1"));
  assert.ok(group1.length >= 84, `expected the full group-1 fleet, got ${group1.length}`);
  const thin = [];
  for (const [id, facilitation] of group1) {
    const html = planPageHtml(id, facilitation);
    // Four blocks is the floor for a sheet worth printing: who, ask, listen,
    // if-stuck. Anything less and the teacher is holding a mostly blank page.
    const blocks = (html.match(/class="blk"/g) || []).length;
    if (blocks < 4) thin.push(`${id} (${blocks} blocks)`);
  }
  assert.deepEqual(thin, [], `group-1 plans too thin to print:\n  ${thin.join("\n  ")}`);
}

// ── the route ────────────────────────────────────────────────────────────
{
  const ok = await onRequest(req("https://x.test/teacher-small-group/1-1-group1/plan"));
  assert.equal(ok.status, 200);
  assert.match(ok.headers.get("content-type"), /text\/html/);
  assert.equal(ok.headers.get("cache-control"), "no-store", "a teacher page is never cached");
  assert.equal(ok.headers.get("x-content-type-options"), "nosniff");
  assert.ok((await ok.text()).includes("Who to pull"));

  // The JSON sibling still works — the plan is additive.
  const data = await onRequest(req("https://x.test/teacher-small-group/1-1-group1/data"));
  assert.equal(data.status, 200);
  assert.match(data.headers.get("content-type"), /application\/json/);

  // Unknown lesson, bad id, and unknown sub-path all refuse.
  assert.equal(
    (await onRequest(req("https://x.test/teacher-small-group/99-99-group1/plan"))).status,
    404,
    "a lesson with no plan 404s rather than printing a blank sheet",
  );
  assert.equal(
    (await onRequest(req("https://x.test/teacher-small-group/not-a-lesson/plan"))).status,
    400,
  );
  assert.equal(
    (await onRequest(req("https://x.test/teacher-small-group/1-1-group1/secrets"))).status,
    404,
  );
}

// ── the gate in front of it ──────────────────────────────────────────────
//
// The route itself does no authentication — functions/_middleware.js does, via
// isTeacherSurface(). This plan names the specific errors individual students
// made, so "is it actually behind the gate?" is not a question to leave to a
// comment. Asserted here because the middleware matches on a SUBSTRING, and a
// future rename ("/small-group-plan/…") would silently drop the gate.
{
  const { isTeacherSurface } = await import("../_lib/teacher-surface.js");
  assert.ok(
    isTeacherSurface("/teacher-small-group/1-1-group1/plan"),
    "the printable plan is a gated teacher surface",
  );
  assert.ok(
    isTeacherSurface("/teacher-small-group/1-1-group1/data"),
    "so is the JSON it renders",
  );
  assert.ok(
    !isTeacherSurface("/lessons/1-1-group1/"),
    "the studio itself stays open to students",
  );
}

console.log("plan-page: all assertions passed");
