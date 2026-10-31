/* The screens around the five stops: the expedition map, the completion celebration and the printable quick-start guide. */
import { badge, icon, scene } from "./art.js";
import { COPY, STOPS } from "./copy.js";
import { h, p } from "./core.js";
import { STUCK } from "./coach-scenes.js";
import { startersFor } from "./plan.js";
import { labUrl, loadGames, practiceLinks } from "./routes.js";
import { btn } from "./ui.js";

const T = {
  mapLead: p(
    "Done stops show a check. You can open any stop again.",
    "Las paradas hechas muestran una marca. Pueden abrir cualquier parada otra vez.",
  ),
  doneTitle: p("You finished the expedition!", "¡Terminaron la expedición!"),
  doneLead: p(
    "You know how the Lab works, how to help without giving the answer, and where to start. Short and often works best.",
    "Ya saben cómo funciona el Laboratorio, cómo ayudar sin dar la respuesta y por dónde empezar. Lo corto y frecuente funciona mejor.",
  ),
  stars: (n) => p(`${n} of 5 stops finished`, `${n} de 5 paradas terminadas`),
  nextTitle: p("Your next step", "Su siguiente paso"),
  nextGo: p(
    "Start your first Family Math Night",
    "Empezar su primera noche de matemáticas en familia",
  ),
  nextNoPlan: p(
    "Make a plan, then start practicing. It takes a minute.",
    "Armen un plan y empiecen a practicar. Toma un minuto.",
  ),
  makePlan: p("Make my plan", "Armar mi plan"),
  openLab: p("Open the Math Fluency Lab", "Abrir el Laboratorio de fluidez matemática"),
  again: p("Do the expedition again", "Hacer la expedición otra vez"),
  review: p("Review a stop", "Repasar una parada"),
  printTitle: p("Family Math quick-start guide", "Guía de inicio rápido de matemáticas en familia"),
  printLink: p("Start here", "Empiecen aquí"),
  printFoot: p(
    "Short and often works best. Ask, wait, and let your child do the thinking.",
    "Lo corto y frecuente funciona mejor. Pregunten, esperen y dejen que su hijo o hija piense.",
  ),
  tips: p("When your child is stuck", "Cuando su hijo o hija se atasca"),
};

export function renderMap(ctx) {
  const { K, S } = ctx;
  const root = h("div", { class: "stop stop-map" });
  const head = h("header", { class: "stop-head" }, scene("welcome"));
  const text = h("div", { class: "stop-head-text" });
  const title = K.bi("h1", COPY.mapTitle, "stop-title");
  title.id = "stop-title";
  title.tabIndex = -1;
  text.append(title, K.bi("p", T.mapLead, "stop-lead"));
  head.append(text);
  const grid = h("div", { class: "map-grid" });
  STOPS.forEach((s, i) => {
    const done = S.done[i];
    const open = btn(K, COPY.open, {
      cls: done ? "" : "btn-primary",
      ico: "arrow",
      onClick: () => ctx.go(i),
    });
    grid.append(
      h(
        "article",
        { class: `map-card${done ? " is-done" : ""}` },
        h(
          "span",
          { class: "map-n", "aria-hidden": "true" },
          done ? icon("check", "map-check") : String(i + 1),
        ),
        K.bi("h2", s.name, "map-name"),
        K.bi("p", s.lead, "map-lead"),
        done ? h("p", { class: "map-state" }, K.plain(COPY.done)) : null,
        open,
      ),
    );
  });
  root.append(head, grid);
  if (S.done.every(Boolean))
    root.append(
      h(
        "div",
        { class: "row" },
        btn(K, T.doneTitle, { cls: "btn-quiet", ico: "star", onClick: () => ctx.toDone() }),
      ),
    );
  return root;
}

export function renderDone(ctx) {
  const { K, S } = ctx;
  const root = h("div", { class: "stop stop-done" });
  const finished = S.done.filter(Boolean).length;
  const pieces = h(
    "div",
    { class: "confetti", "aria-hidden": "true" },
    Array.from({ length: 16 }, (_, i) =>
      h("i", {
        style: `left:${(i * 37) % 100}%;animation-delay:${(i % 8) * 0.12}s`,
        class: `c${i % 4}`,
      }),
    ),
  );
  const hero = h("section", { class: "done-hero card" }, pieces, badge());
  const t = K.bi("h1", T.doneTitle, "stop-title");
  t.id = "stop-title";
  t.tabIndex = -1;
  hero.append(t, K.bi("p", T.doneLead, "hero-lead"));
  const stars = h("p", {
    class: "done-stars",
    role: "img",
    "aria-label": K.plain(T.stars(finished)),
  });
  STOPS.forEach((_, i) => stars.append(icon("star", `star${S.done[i] ? " on" : ""}`)));
  hero.append(stars);
  root.append(hero);

  const next = h("section", { class: "block card next" }, K.bi("h2", T.nextTitle, "block-title"));
  const slot = h("div", { class: "row" });
  const hasPlan = Boolean(S.plan.gameId && S.plan.skillId);
  next.append(K.bi("p", hasPlan ? T.nextGo : T.nextNoPlan, "block-help"), slot);
  slot.append(
    hasPlan
      ? h("span", { class: "spinner", "aria-hidden": "true" })
      : btn(K, T.makePlan, { cls: "btn-primary btn-big", ico: "arrow", onClick: () => ctx.go(4) }),
  );
  root.append(next);
  if (hasPlan) {
    loadGames()
      .then((games) => {
        const links = practiceLinks({
          games,
          grade: S.grade || 3,
          profile: ctx.profile(),
          mode: ctx.mode(),
          gameId: S.plan.gameId,
          skillId: S.plan.skillId,
          routine: S.plan.routine,
        });
        slot.replaceChildren(
          links
            ? btn(K, T.nextGo, { href: links.play, cls: "btn-primary btn-big", ico: "arrow" })
            : btn(K, T.makePlan, {
                cls: "btn-primary btn-big",
                ico: "arrow",
                onClick: () => ctx.go(4),
              }),
        );
      })
      .catch(() =>
        slot.replaceChildren(
          btn(K, T.makePlan, {
            cls: "btn-primary btn-big",
            ico: "arrow",
            onClick: () => ctx.go(4),
          }),
        ),
      );
  }
  root.append(
    h(
      "div",
      { class: "row done-links" },
      btn(K, T.openLab, {
        href: labUrl({ grade: S.grade || undefined, profile: ctx.profile(), mode: ctx.mode() }),
        ico: "link",
      }),
      btn(K, T.review, { cls: "btn-quiet", onClick: () => ctx.toMap() }),
      btn(K, T.again, { cls: "btn-quiet", onClick: () => ctx.askRestart() }),
    ),
  );
  return root;
}

/** The one-page guide a family can print and stick on the fridge. */
export function buildPrintSheet(ctx, links, routine, grade) {
  const { K } = ctx;
  const sheet = h("article", { class: "sheet" });
  sheet.append(
    K.bi("h1", T.printTitle),
    h(
      "p",
      { class: "sheet-sum" },
      `${K.plain(COPY.gradeWord)} ${grade} · ${K.only(links.skill.title)} · ${K.plain(routine.title)} · ${routine.minutes} min`,
    ),
  );
  const tl = h("ol", { class: "sheet-list" });
  for (const [m, text] of routine.parts)
    tl.append(h("li", {}, h("strong", {}, `${m} min `), K.bi("span", text)));
  const qs = h("ul", { class: "sheet-list" });
  for (const q of startersFor(grade)) qs.append(h("li", {}, K.bi("span", q)));
  const stuck = h("ol", { class: "sheet-list" });
  for (const [a, b] of STUCK) stuck.append(h("li", {}, K.bi("strong", a), " ", K.bi("span", b)));
  const url = new URL(links.play, location.href).href;
  sheet.append(
    h("h2", {}, K.plain(p("How to spend the time", "Cómo usar el tiempo"))),
    tl,
    h("h2", {}, K.plain(p("Things to say and ask", "Qué decir y preguntar"))),
    qs,
    h("h2", {}, K.plain(T.tips)),
    stuck,
    h("p", { class: "sheet-link" }, h("strong", {}, `${K.plain(T.printLink)}: `), url),
    K.bi("p", T.printFoot, "sheet-foot"),
  );
  return sheet;
}
