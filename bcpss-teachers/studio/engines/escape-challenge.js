// Digital Escape Challenge engine. Schema: engines/escape-challenge.schema.md
// A coherent story, 3-5 rooms, one curriculum puzzle per room, a door code derived from the learner's own correct
// answers, graduated hints, a worked-example stuck path, a debrief of secure vs supported concepts. No timers, no lives.
import { h } from "../core/dom.js";
import { loadCss } from "./engine-core.js";
import { createSession, loopItem } from "./escape/escape-logic.js";
import { renderDebrief, renderDoor } from "./escape/escape-end.js";
import { mountRoom } from "./escape/escape-room.js";
import { validateEscape } from "./escape/escape-validate.js";
import { loadVisuals } from "./escape/visual-el.js";

const btn = (label, cls, onclick, attrs = {}) =>
  h("button", { type: "button", class: `st-btn ${cls}`, onclick, ...attrs }, label);

async function mount(ctx) {
  loadCss("engines-base.css");
  loadCss("engines3-common.css");
  loadCss("escape-challenge.css");
  await loadVisuals();
  const activity = ctx.activity;
  const problems = validateEscape(activity);
  if (problems.length) {
    console.error("escape-challenge: invalid activity", problems);
    ctx.root.replaceChildren(
      h(
        "p",
        { class: "st-esc-msg", role: "alert" },
        "This activity could not be opened because its data is incomplete. Tell your teacher.",
      ),
    );
    return;
  }
  const rooms = activity.rooms;
  const saved = ctx.resume()?.state || null;
  const session = createSession(activity, saved || {});
  const loops = {};
  const flags = { ...(saved?.flags || {}) };
  const records = {};
  const st = { screen: "intro", roomIdx: saved?.roomIdx || 0, review: null };
  let current = null;

  const loopFor = (room) => {
    if (!loops[room.id]) {
      loops[room.id] = ctx.loop(loopItem(room));
      if (saved?.loops?.[room.id]) Object.assign(loops[room.id].state, saved.loops[room.id]);
    }
    return loops[room.id];
  };
  // Re-populate evidence for rooms solved before a reload.
  for (const r of rooms) if (session.solved(r.id)) records[r.id] = ctx.settle(loopFor(r));

  const save = () =>
    ctx.save({
      screen: st.screen,
      roomIdx: st.roomIdx,
      pieces: session.pieces,
      loops: Object.fromEntries(Object.entries(loops).map(([k, v]) => [k, { ...v.state }])),
      flags,
    });

  const root = h("div", { class: "st-esc", "data-mode": ctx.mode });
  const header = h("header", { class: "st-esc-head" });
  const mapHost = h("nav", { class: "st-esc-mapnav", "aria-label": "Rooms" });
  const main = h("div", { class: "st-esc-main" });
  const notebook = h("aside", { class: "st-esc-notebook", "aria-label": "Code notebook" });
  root.append(header, mapHost, main, notebook);
  ctx.root.replaceChildren(root);

  function drawHeader() {
    header.replaceChildren(
      h("h1", {}, activity.title),
      h("p", { class: "st-esc-setting" }, activity.story.setting),
    );
  }

  function drawMap() {
    const items = rooms.map((r, i) => {
      const solved = session.solved(r.id);
      const isCurrent = st.screen === "room" && st.roomIdx === i && !st.review;
      const locked = !solved && !isCurrent && st.screen !== "debrief" && i > st.roomIdx;
      const state = solved ? "Solved" : isCurrent ? "Open" : locked ? "Locked" : "Waiting";
      const label = h("span", { class: "st-esc-roomname" }, `${i + 1}. ${r.title}`);
      const stateEl = h("span", { class: "st-esc-state" }, state);
      const content = solved
        ? btn("", "st-esc-mapbtn", () => reviewRoom(i), {
            "aria-label": `${r.title}, solved. Review this room.`,
          })
        : h("span", { class: "st-esc-mapbtn" });
      content.append(label, stateEl);
      return h(
        "li",
        {
          class: "st-esc-mapitem",
          "data-state": state.toLowerCase(),
          "aria-current": isCurrent ? "step" : null,
        },
        content,
      );
    });
    const doorState =
      st.screen === "debrief" || st.screen === "done"
        ? "Open"
        : st.screen === "door"
          ? "Open"
          : "Locked";
    items.push(
      h(
        "li",
        {
          class: "st-esc-mapitem",
          "data-state": doorState.toLowerCase(),
          "aria-current": st.screen === "door" ? "step" : null,
        },
        h(
          "span",
          { class: "st-esc-mapbtn" },
          h("span", { class: "st-esc-roomname" }, "The door"),
          h("span", { class: "st-esc-state" }, doorState),
        ),
      ),
    );
    mapHost.replaceChildren(h("ol", { class: "st-esc-map" }, items));
  }

  function drawNotebook() {
    notebook.replaceChildren(
      h("h2", { class: "st-esc-nb-title" }, "Code notebook"),
      h(
        "p",
        { class: "st-esc-note" },
        "Each solved room gives a piece of the door code, made from your own answer.",
      ),
      h(
        "ul",
        { class: "st-esc-pieces" },
        rooms.map((r) =>
          h(
            "li",
            {},
            h("span", {}, `${r.title}: `),
            h("strong", { class: "st-esc-piece" }, session.pieces[r.id] ?? "not found yet"),
          ),
        ),
      ),
    );
  }

  function show(view, announceText, { persist = true } = {}) {
    current?.cleanup?.();
    current = view;
    main.replaceChildren(view.el);
    drawHeader();
    drawMap();
    drawNotebook();
    if (persist) save();
    if (announceText) ctx.announce(announceText);
    view.focus?.();
  }

  const beat = (after) => activity.story.beats.find((b) => b.after === after);

  function intro() {
    st.screen = "intro";
    const resumeLine =
      saved && saved.screen && saved.screen !== "intro"
        ? h("p", { class: "st-esc-note" }, "You have a saved game on this device.")
        : null;
    const heading = h("h2", { class: "st-esc-room-title", tabindex: "-1" }, activity.story.title);
    const el = h(
      "section",
      { class: "st-esc-room" },
      heading,
      h("p", { class: "st-esc-narrative" }, activity.intro),
      h("p", { class: "st-esc-story" }, beat("start").text),
      h(
        "p",
        { class: "st-esc-note" },
        "Each room has a puzzle about today's math. Solve it to earn a piece of the door code. Hints are always there when you need them. There is no timer.",
      ),
      resumeLine,
      h(
        "div",
        { class: "st-esc-actions" },
        saved?.screen && saved.screen !== "intro"
          ? btn("Continue my game", "st-btn-primary", () => go(saved.screen, saved.roomIdx))
          : btn("Enter the first room", "st-btn-primary", () => go("room", 0)),
        saved?.screen && saved.screen !== "intro"
          ? btn("Start over", "st-btn-quiet", () => reset())
          : null,
        btn("Listen", "st-btn-quiet", () => ctx.speak(`${activity.intro} ${beat("start").text}`)),
      ),
    );
    show({ el, focus: () => heading.focus() }, null, { persist: false });
  }

  function reset() {
    ctx.clearProgress();
    ctx.items.clear();
    for (const k of Object.keys(session.pieces)) delete session.pieces[k];
    for (const k of Object.keys(loops)) delete loops[k];
    for (const k of Object.keys(flags)) delete flags[k];
    for (const k of Object.keys(records)) delete records[k];
    saved?.loops && Object.keys(saved.loops).forEach((k) => delete saved.loops[k]);
    if (saved) saved.screen = "intro";
    go("room", 0);
  }

  function go(screen, idx = 0) {
    st.review = null;
    if (screen === "room") {
      let i = Math.min(idx, rooms.length - 1);
      while (i < rooms.length && session.solved(rooms[i].id)) i++;
      if (i >= rooms.length) return go("door");
      st.screen = "room";
      st.roomIdx = i;
      return roomScreen(rooms[i], i);
    }
    st.screen = screen;
    if (screen === "door") return doorScreen();
    if (screen === "debrief") return debriefScreen();
    return intro();
  }

  function foundBlock(room, i, piece) {
    const b = beat(room.id);
    const last = i === rooms.length - 1;
    const heading = h("h3", { tabindex: "-1" }, "Room solved");
    const el = h(
      "div",
      { class: "st-esc-found" },
      heading,
      h("p", {}, room.reveal),
      h(
        "p",
        { class: "st-esc-pieceline" },
        "Your code piece: ",
        h("strong", { class: "st-esc-piece" }, piece),
      ),
      b ? h("p", { class: "st-esc-story" }, b.text) : null,
      h(
        "div",
        { class: "st-esc-actions" },
        btn(last ? "Go to the door" : "Next room", "st-btn-primary", () =>
          go(last ? "door" : "room", i + 1),
        ),
      ),
    );
    return { el, heading };
  }

  function roomScreen(room, i) {
    const loop = loopFor(room);
    flags[room.id] = flags[room.id] || {};
    const view = mountRoom({
      ctx,
      room,
      session,
      loop,
      flags: flags[room.id],
      onChange: save,
      onSolved: ({ piece, record }) => {
        records[room.id] = record;
        const f = foundBlock(room, i, piece);
        view.el.append(f.el);
        drawMap();
        drawNotebook();
        save();
        ctx.announce(`Room solved. You earned the code piece ${piece}.`);
        f.heading.focus();
      },
    });
    show(view, `Room ${i + 1} of ${rooms.length}: ${room.title}`);
  }

  function reviewRoom(i) {
    const room = rooms[i];
    st.review = i;
    const heading = h("h2", { class: "st-esc-room-title", tabindex: "-1" }, room.title);
    const el = h(
      "section",
      { class: "st-esc-room" },
      heading,
      h("p", { class: "st-esc-narrative" }, room.narrative),
      h("p", {}, room.reveal),
      h(
        "p",
        { class: "st-esc-pieceline" },
        "Your code piece: ",
        h("strong", { class: "st-esc-piece" }, session.pieces[room.id]),
      ),
      h("p", { class: "st-esc-why" }, room.puzzle.why),
      h(
        "div",
        { class: "st-esc-actions" },
        btn("Back to where I was", "st-btn-primary", () =>
          go(session.allSolved() ? "door" : "room", st.roomIdx),
        ),
      ),
    );
    show({ el, focus: () => heading.focus() });
  }

  function doorScreen() {
    const view = renderDoor({
      ctx,
      activity,
      session,
      onOpen: () => {
        const door = h(
          "div",
          { class: "st-esc-found" },
          h("h3", {}, "The door opens"),
          h("p", {}, activity.door.success),
          h("p", { class: "st-esc-story" }, beat("end").text),
          h(
            "div",
            { class: "st-esc-actions" },
            btn("See my debrief", "st-btn-primary", () => go("debrief")),
          ),
        );
        view.el.append(door);
        view.el.querySelector(".st-esc-code").disabled = true;
        ctx.announce("The door opens.");
        door.querySelector("h3").setAttribute("tabindex", "-1");
        door.querySelector("h3").focus();
      },
    });
    show(view, "The door");
  }

  function debriefScreen() {
    const view = renderDebrief({
      ctx,
      activity,
      records,
      flags,
      session,
      onFinish: (text) => {
        ctx.finish(text);
        const el = h(
          "section",
          { class: "st-esc-room" },
          h("h2", { class: "st-esc-room-title", tabindex: "-1" }, "Saved"),
          h(
            "p",
            { class: "st-esc-narrative" },
            "Your results are saved on this device without your name. You can close this page.",
          ),
        );
        st.screen = "done";
        main.replaceChildren(el);
        drawMap();
        el.querySelector("h2").focus();
      },
    });
    show(view, "Debrief");
  }

  intro();
}

export default { id: "escape-challenge", mount };
