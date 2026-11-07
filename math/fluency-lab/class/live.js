// Student side of a live class room (teacher-paced session, class game, live workspace). Poll-based: the page asks
// for the room state every few seconds while it is visible. Untimed by construction: no clock is shown, nothing
// advances on its own, and the teacher moves the class to the next problem. Problems are generated on this device
// from the room's skill, grade and seed, so every device in the class sees the same problem N.
import { loadLink, roomRespond, roomState, roomWorkspace } from "../class-link.js";
import { getLang, setLang, t, translatePage } from "../i18n.js";
import { generateProblem, seededRandom } from "../problem-bank.js";
import { questionEs } from "../question-es.js";
import { peekCap } from "../step-leak.js";
import { findSkill } from "../tutor-engine.js";

export const POLL_MS = 3000;

/** Problem N of a room: the same on every device. */
export function roomProblem(config, index) {
  const skill = findSkill(`${config.grade}:${config.skill}`);
  if (!skill) return null;
  return generateProblem(skill, seededRandom((config.seed + index * 7919) >>> 0));
}

const el = (tag, attrs = {}, text = null) => {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === "class") node.className = v;
    else if (v != null && v !== false) node.setAttribute(k, v === true ? "" : v);
  }
  if (text != null) node.textContent = text;
  return node;
};

export function mountLive(
  root,
  { fetchImpl = (...a) => fetch(...a), location = window.location } = {},
) {
  const link = loadLink();
  const roomId = new URLSearchParams(location.search).get("room") || "";
  const status = root.querySelector("#live-status");
  const stage = root.querySelector("#live-stage");
  let last = null;
  let shown = -1;
  let peeks = 0;
  let wsTimer = null;
  let timer = null;

  if (!link) {
    status.textContent = t("Join your class on the Fluency Lab home page first.");
    stage.replaceChildren(
      el("a", { class: "primary-action", href: "../" }, t("Go to the Fluency Lab")),
    );
    return null;
  }

  function scoreLine(s) {
    if (s.kind === "game") {
      const p = el(
        "p",
        { class: "cl-live" },
        t("Class score: {score}. Your team: {team}. Team points: {teams}.", {
          score: s.classScore,
          team: s.team,
          teams: s.teamScores.join(" · "),
        }),
      );
      return p;
    }
    return null;
  }

  function wall(s) {
    if (!s.reveal || !s.wall.length) return null;
    const box = el("section", { "aria-label": t("Class answers") });
    box.append(el("h3", {}, t("Class answers (no names)")));
    const list = el("ul");
    for (const w of s.wall)
      list.append(el("li", {}, t("{answer}: {count}", { answer: w.answer, count: w.count })));
    box.append(list);
    return box;
  }

  function drawProblem(s) {
    const item = roomProblem(s.config, s.item);
    stage.replaceChildren();
    if (!item) {
      stage.append(el("p", {}, t("This problem could not be loaded. Tell your teacher.")));
      return;
    }
    stage.append(
      el(
        "h2",
        { id: "live-problem-title" },
        t("Problem {n} of {count}", { n: s.item + 1, count: s.config.count }),
      ),
    );
    stage.append(el("p", { class: "live-question", lang: "en" }, item.question));
    if (getLang() === "es") {
      const es = questionEs(item);
      if (es && es !== item.question)
        stage.append(el("p", { class: "live-question-es", lang: "es" }, es));
    }
    if (s.kind === "workspace") {
      const label = el(
        "label",
        { for: "live-work" },
        t("Show your work. Your teacher can see it; classmates cannot."),
      );
      const area = el("textarea", { id: "live-work", rows: "6", maxlength: "4000" });
      area.addEventListener("input", () => {
        clearTimeout(wsTimer);
        wsTimer = setTimeout(
          () =>
            roomWorkspace(
              link,
              {
                roomId,
                workspace: {
                  item: s.item,
                  problem: item.question,
                  lines: area.value.split("\n").slice(0, 60),
                },
              },
              fetchImpl,
            ),
          1200,
        );
      });
      stage.append(label, area);
      return;
    }
    const form = el("form", { "aria-labelledby": "live-problem-title" });
    const input = el("input", {
      id: "live-answer",
      name: "answer",
      autocomplete: "off",
      inputmode: "text",
      maxlength: "60",
      required: true,
    });
    form.append(
      el("label", { for: "live-answer" }, t("Your answer")),
      input,
      el("button", { type: "submit", class: "primary-action" }, t("Send my answer")),
    );
    const said = el("p", { role: "status", class: "cl-status" });
    const steps = el("ol", { class: "live-steps" });
    const peek = el("button", { type: "button", class: "outline-action" }, t("Show a step"));
    peek.addEventListener("click", () => {
      const cap = peekCap(item);
      if (peeks >= cap) {
        said.textContent = t(
          "No more steps without giving the answer away. Try it, then talk with your team.",
        );
        return;
      }
      steps.append(el("li", {}, item.steps[peeks]));
      peeks += 1;
    });
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const answer = input.value.trim();
      if (!answer) return;
      // The server judges the answer from the shared seed; the device only reports what was typed.
      const res = await roomRespond(link, { roomId, item: s.item, answer }, fetchImpl);
      said.textContent = res.ok
        ? res.recorded
          ? t("Answer sent. Wait for your teacher.")
          : t("Your first answer already counts for this problem.")
        : res.error === "room-not-live"
          ? t("Your teacher paused the class. Hold on to your answer.")
          : t("Something went wrong. Your progress is safe on this device.");
    });
    stage.append(form, peek, steps, said);
    if (s.mine) said.textContent = t("You answered: {answer}", { answer: s.mine.answer });
  }

  async function tick() {
    const s = await roomState(link, roomId, fetchImpl);
    if (!s.ok) {
      status.textContent =
        s.error === "room-not-found" ? t("This live room has ended.") : t("Reconnecting…");
      return;
    }
    status.textContent =
      s.status === "lobby"
        ? t("You are in. Waiting for your teacher to start.")
        : s.status === "paused"
          ? t("Paused. Your teacher will continue.")
          : s.status === "ended"
            ? t("This live room has ended. Great work today!")
            : t("{answered} of {students} classmates have answered.", {
                answered: s.answered,
                students: s.students,
              });
    const extra = root.querySelector("#live-extra");
    extra.replaceChildren(...[scoreLine(s), wall(s)].filter(Boolean));
    if (s.status === "live" && (shown !== s.item || last?.status !== "live")) {
      if (shown !== s.item) peeks = 0;
      shown = s.item;
      drawProblem(s);
    }
    if (s.status === "ended")
      stage.replaceChildren(
        el("a", { class: "primary-action", href: "../" }, t("Back to the Fluency Lab")),
      );
    last = s;
  }

  const loop = () => {
    clearTimeout(timer);
    timer = setTimeout(async () => {
      if (document.visibilityState === "visible") await tick();
      if (last?.status !== "ended") loop();
    }, POLL_MS);
  };
  tick().then(loop);
  return { tick, stop: () => clearTimeout(timer) };
}

if (
  typeof document !== "undefined" &&
  document.querySelector("#live-root") &&
  !globalThis.__FLUENCY_LIVE_TEST__
) {
  const lang = new URLSearchParams(location.search).get("lang");
  if (lang) setLang(lang);
  translatePage();
  document.querySelector("#live-lang")?.addEventListener("click", () => {
    setLang(getLang() === "es" ? "en" : "es");
    location.reload();
  });
  mountLive(document.querySelector("#live-root"));
}
