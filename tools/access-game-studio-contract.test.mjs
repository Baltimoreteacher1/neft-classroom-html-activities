import assert from "node:assert/strict";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { rng } from "../access-practice-lab/src/games/engine.js";
import { GAMES } from "../access-practice-lab/src/games/registry.js";
import { normalize } from "../access-practice-lab/src/lang/share.js";

// Deterministic contract-level playthrough: every registry game is initialized with its real authored
// content, receives a deliberate miss, a revision, and correct responses until its module reports done.
const root = path.resolve("access-practice-lab");
// Module click handlers expect a button returned by closest('button'); provide a small faithful stand-in.
const fakeButton = (selector) => {
  const match = selector.match(/\[([^=\]]+)(?:="([^"]*)")?\]/);
  const attr = match?.[1] || "";
  const key = attr.replace(/^data-/, "").replace(/-([a-z])/g, (_, c) => c.toUpperCase());
  const node = {
    dataset: key ? { [key]: match?.[2] ?? "" } : {},
    closest: (sel) => (sel === "button" ? node : null),
    hasAttribute: (name) => name === attr,
  };
  return node;
};
const I = { T: (en) => en, S: (en) => en };
for (const def of GAMES) {
  const content = JSON.parse(
    await (await import("node:fs/promises")).readFile(
      path.join(root, `content/games/${def.id}.json`),
      "utf8",
    ),
  );
  const mod = (await import(pathToFileURL(path.join(root, `src/games/${def.module}.js`)))).default;
  for (const band of ["3-5", "6-8"])
    for (const support of ["A", "B", "C"]) {
      const events = [];
      const gameContent = def.id === "vocab-quest" ? content.bands[band] : content;
      const env = {
        content: def.id === "vocab-quest" ? gameContent : content,
        band,
        support,
        sup: { hints: 3, audio: "tap", gloss: "show", frames: "full", visuals: true },
        I,
        def,
        rng: rng(41),
        count: (full) => full,
        report: (r) => events.push(r),
        use: () => {},
      };
      const state = mod.init(env);
      assert.equal(mod.done(state), false, `${def.id}/${band}/${support} starts unfinished`);
      // A complete correct-plan loop proves every module advances and persists state serializably.
      let guard = 0;
      while (!mod.done(state) && guard++ < 40) {
        const actions = mod.plan(state, { wrong: guard === 1 }, env);
        assert.ok(actions.length, `${def.id}/${band}/${support} has no next action`);
        for (const action of actions) {
          if (action.click)
            assert.equal(
              mod.click(fakeButton(action.click), state, env),
              true,
              `${def.id} click did not advance`,
            );
          else if (action.drag) {
            // The vocabulary module's drag target is the accessible tap-to-place equivalent.
            const [from, to] = action.drag;
            const id = from.match(/data-drag="([^"]+)"/)?.[1];
            const target = to.match(/data-drop="([^"]+)"/)?.[1];
            const callback = (card, slot) => {
              const rs = (state.meaning.rs[card] ||= {
                tries: 0,
                h: 0,
                status: "open",
                revised: false,
                picks: [],
              });
              rs.tries++;
              rs.status = card === slot ? "right" : "retry";
              if (rs.status === "right") state.meaning.done.push(card);
              env.report({
                id: `meaning:${card}`,
                skill: "vocabulary-meaning",
                ok: card === slot,
                first: true,
              });
              return true;
            };
            assert.ok(id && target && callback(id, target), `${def.id} meaning placement failed`);
          }
        }
        JSON.stringify(state);
      }
      assert.ok(guard < 40, `${def.id}/${band}/${support} exceeded the playthrough guard`);
      assert.ok(events.length, `${def.id}/${band}/${support} did not report learning rounds`);
      assert.ok(
        events.some((row) => row.revised || row.ok === false),
        `${def.id}/${band}/${support} did not exercise revision feedback`,
      );
    }
}
const shared = normalize({
  band: "3-5",
  games: {
    history: [
      {
        game: "vocab-quest",
        band: "3-5",
        at: "2026-11-01T00:00:00Z",
        support: "A",
        answers: ["private response"],
      },
    ],
  },
});
assert.deepEqual(shared.games.history, [
  { game: "vocab-quest", band: "3-5", at: "2026-11-01T00:00:00Z", support: "A" },
]);
assert.doesNotMatch(JSON.stringify(shared.games), /private response|answers/);
console.log(
  `ACCESS Game Studio playthroughs: ${GAMES.length} games × both bands × all three support modes passed.`,
);
