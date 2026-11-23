// Vocab Quest engine. Schema: engines/vocab-quest.schema.md
// Five stages (see, use in context, retrieve, apply, revisit). A stage opens when the learner has shown the words,
// never because time passed. Hints are graduated, feedback names the real confusion, revisit is a spaced queue.
import { h, shuffle } from "../core/dom.js";
import { attemptsFor } from "../core/evidence.js";
import { loadCss } from "./engine-core.js";
import { focusHeading, loadVisuals } from "./e4-kit.js";
import { historyBoxes } from "./quest/quest-logic.js";
import { createSession } from "./quest/quest-session.js";
import { renderItem, studyCard } from "./quest/quest-item.js";
import { debrief, mapScreen, stageEnd, stageIntro } from "./quest/quest-ui.js";
import { validateQuest } from "./quest/quest-validate.js";

const COLLECTION = /^[a-z0-9-]+$/;

/** Resolve entries from a vocab collection or the activity's inline list. */
export async function loadEntries(activity) {
  if (activity.entries) return activity.entries;
  if (!COLLECTION.test(activity.collection || "")) throw new Error("bad collection id");
  const mod = await import(`../data/vocab/${activity.collection}.js`);
  return mod.default.entries;
}

async function mount(ctx) {
  loadCss("engines-base.css");
  loadCss("engines3-common.css");
  loadCss("e4-common.css");
  loadCss("vocab-quest.css");
  await loadVisuals();
  const activity = ctx.activity;
  let entries = [];
  let problems = [];
  try {
    entries = await loadEntries(activity);
    problems = validateQuest(activity, entries);
  } catch (err) {
    problems = [String(err?.message || err)];
  }
  if (problems.length) {
    console.error("vocab-quest: invalid activity", problems);
    ctx.root.replaceChildren(
      h(
        "p",
        { class: "st-vq-msg", role: "alert" },
        "This activity could not be opened because its data is incomplete. Tell your teacher.",
      ),
    );
    return;
  }
  // Distractors and word banks come only from the words this quest teaches, never from the rest of the collection.
  const used = new Set(activity.stages.flatMap((s) => s.entryIds || []));
  entries = entries.filter((e) => used.has(e.id));
  const entriesById = new Map(entries.map((e) => [e.id, e]));
  const saved = ctx.resume()?.state || null;
  const history = historyBoxes(attemptsFor(ctx.aid), [
    ...new Set(activity.stages.flatMap((s) => s.entryIds || [])),
  ]);
  const dueCount = [...history.values()].filter((x) => x.due).length;
  let session = createSession({
    activity,
    entriesById,
    shuffle,
    history,
    seed: ctx.aid,
    saved: saved?.session,
  });
  let extras = {
    summaries: {},
    studied: [],
    screen: "map",
    cur: null,
    ...(saved
      ? {
          summaries: saved.summaries || {},
          studied: saved.studied || [],
          screen: saved.screen || "map",
          cur: saved.cur || null,
        }
      : {}),
  };
  let current = null;
  let itemSettled = false;
  let liveLoop = null;

  const root = h("div", { class: "st-vq", "data-mode": ctx.mode });
  const crumb = h("p", { class: "st-vq-crumb", "aria-hidden": "false" });
  const main = h("div", { class: "st-vq-main" });
  root.append(h("h1", {}, activity.title), crumb, main);
  ctx.root.replaceChildren(root);
  for (const [id, rec] of Object.entries(session.state.records)) ctx.items.set(id, rec);

  const persist = () => ctx.save({ session: session.snapshot(), ...extras });

  function show(v, text) {
    current?.cleanup?.();
    current = v;
    main.replaceChildren(v.el);
    if (text) ctx.announce(text);
    v.focus?.();
  }
  function paintCrumb() {
    const s = session.stage();
    const p = session.position();
    crumb.textContent =
      extras.screen === "map" || extras.screen === "debrief"
        ? ""
        : `Stage ${session.state.stageIdx + 1} of ${session.stages.length}: ${s.title}.${extras.screen === "item" ? ` ${session.isRevisit() ? `${p.remaining} ${p.remaining === 1 ? "word" : "words"} left to settle.` : `Question ${Math.min(p.i + 1, p.n)} of ${p.n}.`}` : ""}`;
  }

  function toMap() {
    extras.screen = "map";
    extras.cur = null;
    paintCrumb();
    show(
      mapScreen({
        activity,
        session,
        summaries: extras.summaries,
        dueCount,
        resuming: false,
        onStart: (i) => openStage(i),
        onResume: () => {},
        onRestart: () => {},
      }),
    );
    persist();
    ctx.announce("Quest map.");
  }

  function openStage(i) {
    if (!session.open(i)) return;
    extras.screen = "intro";
    paintCrumb();
    const stage = session.stage();
    const ids = stage.kind === "revisit" ? session.allEntryIds() : stage.entryIds;
    show(
      stageIntro({
        stage,
        entries: ids.map((id) => entriesById.get(id)),
        ctx,
        onStart: () => nextItem(),
        onBack: toMap,
      }),
      `${stage.title}.`,
    );
    persist();
  }

  function nextItem() {
    const item = session.current();
    if (!item) return finishStage();
    extras.screen = "item";
    itemSettled = false;
    paintCrumb();
    const entry = entriesById.get(item.entryId);
    const run = () => {
      const restore = extras.cur?.id === item.id ? extras.cur.state : null;
      const view = renderItem({
        item,
        entry,
        entries,
        ctx,
        tier: ctx.tier,
        restore,
        onChange: (state) => {
          extras.cur = { id: item.id, state };
          persist();
        },
        onSettled: (rec, movedOn) => {
          itemSettled = true;
          const r = session.submit(rec);
          ctx.items.set(rec.id, session.state.records[rec.id]);
          extras.cur = null;
          lastEnd = r.end;
          persist();
        },
        onNext: () => (lastEnd ? finishStage() : nextItem()),
      });
      liveLoop = view.loop;
      show(view, session.isRevisit() ? "Next word." : null);
    };
    let lastEnd = false;
    if (item.study && !extras.studied.includes(entry.id) && extras.cur?.id !== item.id) {
      show(
        studyCard(entry, ctx, {
          label: item.visual ? "Match it to a picture" : "Choose its meaning",
          onContinue: () => {
            extras.studied.push(entry.id);
            persist();
            run();
          },
        }),
        `Meet the word ${entry.word}.`,
      );
    } else run();
    persist();
  }

  function finishStage() {
    if (session.isRevisit()) return toDebrief();
    const end = session.stageEnd();
    extras.screen = "stageEnd";
    extras.summaries[session.state.stageIdx] = {
      demonstrated: end.res.demonstrated,
      total: end.res.total,
    };
    paintCrumb();
    show(
      stageEnd({
        stage: session.stage(),
        end,
        entriesById,
        onReplay: () => {
          session.replay();
          nextItem();
        },
        onContinue: () => {
          session.complete();
          const nxt = session.state.stageIdx + 1;
          if (nxt < session.stages.length) openStage(nxt);
          else toDebrief();
        },
      }),
      "Stage finished.",
    );
    persist();
  }

  function toDebrief() {
    session.complete();
    extras.screen = "debrief";
    paintCrumb();
    show(
      debrief({
        activity,
        ctx,
        words: session.debrief(),
        entriesById,
        onFinish: (text) => {
          ctx.finish(text);
          const el = h(
            "section",
            { class: "st-vq-card", "aria-label": "Saved" },
            h("h2", { class: "st-vq-h", "data-focus": "" }, "Saved"),
            h(
              "p",
              {},
              "Your results are saved on this device without your name. You can close this page.",
            ),
          );
          show({ el, focus: () => focusHeading(el) }, "Saved.");
        },
      }),
      "Your words.",
    );
    persist();
  }

  // Resume exactly where the learner left off, otherwise open the map.
  const resume = () => {
    const s = saved?.screen;
    if (s === "item") return nextItem();
    if (s === "intro") return openStageResume();
    if (s === "stageEnd") return finishStage();
    if (s === "debrief") return toDebrief();
    return toMap();
  };
  function openStageResume() {
    const stage = session.stage();
    const ids = stage.kind === "revisit" ? session.allEntryIds() : stage.entryIds;
    extras.screen = "intro";
    paintCrumb();
    show(
      stageIntro({
        stage,
        entries: ids.map((id) => entriesById.get(id)),
        ctx,
        onStart: () => nextItem(),
        onBack: toMap,
      }),
    );
  }

  ctx.onTier(() => {
    if (extras.screen !== "item" || itemSettled) return;
    if (liveLoop) extras.cur = { id: session.current()?.id, state: { ...liveLoop.state } };
    nextItem();
  });

  if (saved?.screen && saved.screen !== "map") {
    // Offer the choice on the map so a learner can start over.
    const resumeMap = mapScreen({
      activity,
      session,
      summaries: extras.summaries,
      dueCount,
      resuming: true,
      onStart: () => {},
      onResume: resume,
      onRestart: () => {
        ctx.clearProgress();
        ctx.items.clear();
        session = createSession({ activity, entriesById, shuffle, history, seed: ctx.aid });
        extras = { summaries: {}, studied: [], screen: "map", cur: null };
        toMap();
      },
    });
    show(resumeMap);
  } else toMap();
}

export default { id: "vocab-quest", mount };
