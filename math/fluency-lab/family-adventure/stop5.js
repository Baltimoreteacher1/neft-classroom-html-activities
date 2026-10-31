/* Stop 5 — Your first Family Math Night: choose a grade, a skill and a routine, get a plan, and start the real practice. */
import { icon } from "./art.js";
import { COPY } from "./copy.js";
import { GRADES, h, p } from "./core.js";
import { ROUTINES, startersFor } from "./plan.js";
import { defaultSkill, loadGames, practiceLinks, skillChoices } from "./routes.js";
import { btn, stopHeader, stopNav } from "./ui.js";

const T = {
  build: p("Build your plan", "Armen su plan"),
  gradeL: p("Grade", "Grado"),
  skillL: p("Skill to practice", "Destreza para practicar"),
  routineL: p("How long tonight?", "¿Cuánto tiempo esta noche?"),
  yourPlan: p("Your plan", "Su plan"),
  tryThis: p("Try one like this", "Prueben uno como este"),
  game: p("The activity", "La actividad"),
  timeline: p("How to spend the time", "Cómo usar el tiempo"),
  starters: p("Things to say and ask", "Qué decir y preguntar"),
  startNow: p("Start practicing now", "Empezar a practicar ahora"),
  openFamily: p("Open this plan in Family Math", "Abrir este plan en Matemáticas en familia"),
  print: p("Print the quick-start guide", "Imprimir la guía de inicio rápido"),
  finish: p("Finish the expedition", "Terminar la expedición"),
  min: (n) => p(`${n} min`, `${n} min`),
  rounds: (n) => p(`${n} rounds of practice`, `${n} rondas de práctica`),
  noSkills: p(
    "No practice is ready for this grade yet.",
    "Todavía no hay práctica lista para este grado.",
  ),
  together: p("Together", "Juntos"),
  solo: p("Your child leads", "Su hijo o hija dirige"),
};

export function renderNight(ctx) {
  const { K, S } = ctx;
  const root = h("div", { class: "stop stop-night" });
  root.append(stopHeader(ctx, 4));
  const body = h("div", { class: "night-body", "aria-busy": "true" });
  root.append(body);
  root.append(stopNav(ctx, 4));

  const loading = () =>
    body.replaceChildren(
      h(
        "div",
        { class: "state state-load", role: "status" },
        h("span", { class: "spinner", "aria-hidden": "true" }),
        K.bi("span", COPY.loading),
      ),
    );
  const failed = () => {
    body.replaceChildren(
      h(
        "div",
        { class: "state state-error", role: "alert" },
        K.bi("p", COPY.loadFail),
        btn(K, COPY.retry, { cls: "btn-primary", onClick: () => start() }),
      ),
    );
    body.setAttribute("aria-busy", "false");
  };

  async function start() {
    loading();
    try {
      const games = await loadGames();
      if (!games.length) throw new Error("no games");
      body.setAttribute("aria-busy", "false");
      build(games);
    } catch {
      failed();
    }
  }

  function build(games) {
    const grade = S.grade || 3;
    const choices = skillChoices(games, grade);
    let pick =
      choices.find((c) => c.gameId === S.plan.gameId && c.skillId === S.plan.skillId) ||
      defaultSkill(choices, grade);
    const view = h("div", { class: "plan" });
    body.replaceChildren(view);

    const draw = () => {
      view.replaceChildren();
      S.plan.gameId = pick?.gameId || "";
      S.plan.skillId = pick?.skillId || "";
      ctx.save();

      // Controls.
      const gradeSel = h(
        "select",
        { id: "pl-grade", class: "field" },
        GRADES.map((g) =>
          h("option", { value: String(g), selected: g === grade }, `${K.plain(T.gradeL)} ${g}`),
        ),
      );
      gradeSel.addEventListener("change", () => {
        S.grade = Number(gradeSel.value);
        S.plan.gameId = "";
        S.plan.skillId = "";
        ctx.save();
        ctx.redraw();
      });
      const skillSel = h("select", { id: "pl-skill", class: "field" });
      const groups = new Map();
      for (const c of choices) {
        const key = K.only(c.strand);
        if (!groups.has(key)) groups.set(key, h("optgroup", { label: key }));
        groups
          .get(key)
          .append(
            h(
              "option",
              {
                value: `${c.gameId}|${c.skillId}`,
                selected: pick && c.gameId === pick.gameId && c.skillId === pick.skillId,
              },
              K.only(c.title),
            ),
          );
      }
      skillSel.append(...groups.values());
      skillSel.addEventListener("change", () => {
        const [g, s] = skillSel.value.split("|");
        pick = choices.find((c) => c.gameId === g && c.skillId === s);
        draw();
        skillSel.focus();
      });
      const routines = h("div", {
        class: "routines",
        role: "radiogroup",
        "aria-labelledby": "pl-routine-l",
      });
      for (const [id, r] of Object.entries(ROUTINES)) {
        const on = S.plan.routine === id;
        const b = h(
          "button",
          {
            type: "button",
            class: `routine${on ? " is-on" : ""}`,
            role: "radio",
            "aria-checked": String(on),
            tabindex: on ? "0" : "-1",
          },
          icon("clock", "routine-ico"),
          K.bi("strong", r.title),
          K.bi("span", r.tag, "routine-tag"),
          K.bi("span", r.who, "routine-who"),
        );
        b.addEventListener("click", () => {
          S.plan.routine = id;
          draw();
          view.querySelector(`.routine.is-on`)?.focus();
        });
        routines.append(b);
      }
      routines.addEventListener("keydown", (e) => {
        const ids = Object.keys(ROUTINES);
        const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
        if (!step) return;
        e.preventDefault();
        S.plan.routine = ids[(ids.indexOf(S.plan.routine) + step + ids.length) % ids.length];
        draw();
        view.querySelector(".routine.is-on")?.focus();
      });
      const rl = K.bi("span", T.routineL, "field-label");
      rl.id = "pl-routine-l";
      view.append(
        h(
          "section",
          { class: "block card controls" },
          K.bi("h2", T.build, "block-title"),
          h(
            "div",
            { class: "fields" },
            h(
              "div",
              { class: "field-wrap" },
              h("label", { for: "pl-grade", class: "field-label" }, K.plain(T.gradeL)),
              gradeSel,
            ),
            h(
              "div",
              { class: "field-wrap grow" },
              h("label", { for: "pl-skill", class: "field-label" }, K.plain(T.skillL)),
              skillSel,
            ),
          ),
          rl,
          routines,
        ),
      );

      if (!pick) return view.append(h("p", { class: "note" }, K.plain(T.noSkills)));
      const mode = ctx.mode();
      const links = practiceLinks({
        games,
        grade,
        profile: ctx.profile(),
        mode,
        gameId: pick.gameId,
        skillId: pick.skillId,
        routine: S.plan.routine,
      });
      if (!links) return view.append(h("p", { class: "note" }, K.plain(T.noSkills)));
      const r = ROUTINES[S.plan.routine];
      const lang = K.one();

      // The plan.
      const bar = h(
        "div",
        { class: "timebar", "aria-hidden": "true" },
        r.parts.map(([m], i) => h("span", { class: `tb tb-${i}`, style: `flex:${m}` }, String(m))),
      );
      const steps = h("ol", { class: "timeline" });
      r.parts.forEach(([m, text]) =>
        steps.append(
          h("li", {}, h("span", { class: "tl-min" }, K.plain(T.min(m))), K.bi("span", text)),
        ),
      );
      const starters = h("ul", { class: "ask-list" });
      for (const q of startersFor(grade))
        starters.append(h("li", {}, icon("bulb", "ask-ico"), K.bi("span", q)));

      const go = h(
        "a",
        { class: "btn btn-primary btn-big", href: links.play, id: "go-practice" },
        icon("arrow", "btn-ico"),
        K.bi("span", T.startNow, "btn-label"),
      );
      go.addEventListener("click", () => ctx.markDone(4));
      const fam = btn(K, T.openFamily, { href: links.tonight, cls: "", ico: "home" });
      fam.addEventListener("click", () => ctx.markDone(4));
      const print = btn(K, T.print, {
        cls: "btn-quiet",
        ico: "print",
        onClick: () => ctx.printGuide(links, r, grade),
      });
      const finish = btn(K, T.finish, {
        cls: "btn-quiet",
        ico: "check",
        onClick: () => ctx.finishExpedition(),
      });

      view.append(
        h(
          "section",
          { class: "block card plan-card", "aria-labelledby": "plan-h" },
          (() => {
            const t = K.bi("h2", T.yourPlan, "block-title");
            t.id = "plan-h";
            return t;
          })(),
          h(
            "p",
            { class: "plan-sum" },
            `${K.plain(T.gradeL)} ${grade} · ${K.only(pick.title)} · ${K.plain(r.title)} · ${K.plain(T.min(r.minutes))}`,
          ),
          h(
            "div",
            { class: "plan-grid" },
            h(
              "div",
              { class: "plan-game" },
              K.bi("h3", T.game),
              h("p", { class: "plan-game-name" }, K.only(links.game.title)),
              h("p", {}, K.only(links.game.tagline)),
              links.about ? h("p", { class: "note" }, links.about) : null,
              links.example
                ? h(
                    "div",
                    { class: "try" },
                    K.bi("strong", T.tryThis),
                    h("p", { class: "try-q", lang }, links.example),
                  )
                : null,
              h(
                "p",
                { class: "note" },
                `${K.plain(T.rounds(links.rounds))} · ${K.plain(S.plan.routine === "quick" ? T.solo : T.together)}`,
              ),
            ),
            h("div", { class: "plan-time" }, K.bi("h3", T.timeline), bar, steps),
          ),
          h("div", { class: "cta" }, go, h("div", { class: "row" }, fam, print, finish)),
        ),
        h("section", { class: "block card" }, K.bi("h2", T.starters, "block-title"), starters),
      );
    };
    draw();
  }

  start();
  return root;
}
