// Fluency Lab AI hint tutor (#28): the model only picks among authored hints, nothing leaks the answer, and every
// failure falls back to null so the authored strategy hint shows as before.
import assert from "node:assert/strict";
import test from "node:test";
import { chooseHint, hintCandidates } from "../math/fluency-lab/ai-hint.js";
import { ALL_SKILLS, generateProblem, seededRandom } from "../math/fluency-lab/problem-bank.js";
import { stepLeaks } from "../math/fluency-lab/step-leak.js";

const skill = ALL_SKILLS.find((s) => s.grade === 3 && s.id === "mul-0-5");
const items = Array.from({ length: 40 }, (_, i) => generateProblem(skill, seededRandom(100 + i)));

test("candidates are the item's own hints and never state the answer", () => {
  for (const item of items) {
    const own = new Set([item.hint, ...item.steps]);
    for (const hint of hintCandidates(item)) {
      assert.ok(own.has(hint), "only authored text is offered");
      assert.equal(stepLeaks(hint, item), false, `${item.question}: ${hint}`);
    }
  }
});

const fetchFor =
  (reply, calls = []) =>
  async (url, init) => {
    calls.push([String(url), init?.body && JSON.parse(init.body)]);
    if (String(url).endsWith("/health"))
      return Response.json({ ok: true, claude: false, workersAi: true });
    return reply(init);
  };

test("a valid pick returns one of the offered hints; the request carries no extra learner data", async () => {
  const item = items.find((i) => hintCandidates(i).length >= 2);
  const calls = [];
  const out = await chooseHint(
    item,
    "7",
    fetchFor(() => Response.json({ ok: true, index: 1 }), calls),
  );
  assert.equal(out, hintCandidates(item)[1]);
  const body = calls.find(([u]) => u.endsWith("/hint"))[1];
  assert.deepEqual(Object.keys(body).sort(), ["answers", "attempt", "hints", "question"]);
});

test("every failure mode returns null (authored hint stays)", async () => {
  const item = items.find((i) => hintCandidates(i).length >= 2);
  assert.equal(
    await chooseHint(
      item,
      "7",
      fetchFor(() => Response.json({ ok: false }, { status: 503 })),
    ),
    null,
  );
  assert.equal(
    await chooseHint(
      item,
      "7",
      fetchFor(() => Response.json({ ok: true, index: 99 })),
    ),
    null,
  );
  assert.equal(
    await chooseHint(
      item,
      "7",
      fetchFor(() => {
        throw new Error("offline");
      }),
    ),
    null,
  );
  assert.equal(
    await chooseHint(
      { ...item, steps: [], hint: "only one" },
      "7",
      fetchFor(() => Response.json({ ok: true, index: 0 })),
    ),
    null,
  );
});
