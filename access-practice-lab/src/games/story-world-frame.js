// Interactive Story World: the frame around each scene (scene map, understanding streak, the guide's
// voice), the stickers and scene-complete celebration, and the content contract run by
// tools/validate-access-game-studio.mjs. Kept apart from story-world.js so each module stays small.
import { html, icon, raw } from "./engine.js";
import { mascot } from "./art.js";
import { SCENE_KEYS } from "./story-world-art.js";
import { acceptedFor, bridgeSentence } from "./story-world-view.js";

const SAY = {
  start: [
    "hi",
    "Explore the picture. Every glowing spot hides a part of the story.",
    "Explora la imagen. Cada punto brillante esconde una parte del cuento.",
  ],
  found: [
    "hi",
    "Nice find! Listen to it, then look for the next spot.",
    "¡Buen hallazgo! Escúchalo y luego busca el siguiente punto.",
  ],
  allfound: [
    "cheer",
    "You found every event! Now walk the trail and put them in order.",
    "¡Encontraste todos los hechos! Ahora recorre el sendero y ponlos en orden.",
  ],
  trail: [
    "think",
    "Which event starts everything? Time words and causes are your clues.",
    "¿Qué hecho empieza todo? Las palabras de tiempo y las causas son tus pistas.",
  ],
  right: [
    "cheer",
    "Yes! The path lights up. That event fits right there.",
    "¡Sí! El sendero se ilumina. Ese hecho va justo ahí.",
  ],
  fixed: [
    "cheer",
    "You revised it! Fixing your thinking is how readers get stronger.",
    "¡Lo corregiste! Revisar tu idea es como los lectores se hacen más fuertes.",
  ],
  early: [
    "think",
    "It bounced back: too early. What has to happen before it?",
    "Rebotó: demasiado pronto. ¿Qué tiene que pasar antes?",
  ],
  late: [
    "think",
    "It bounced back: too late. This one happens earlier.",
    "Rebotó: demasiado tarde. Este pasa antes.",
  ],
  reveal: [
    "hi",
    "Let's place it together. Read why it goes there.",
    "Vamos a colocarlo juntos. Lee por qué va ahí.",
  ],
  bridge: [
    "think",
    "Find the result, then pick the joining word that makes a true sentence.",
    "Encuentra el resultado y luego elige la palabra de unión que forma una oración verdadera.",
  ],
  linkRight: [
    "cheer",
    "The bridge holds! Tap Listen to hear your sentence.",
    "¡El puente aguanta! Toca Escuchar para oír tu oración.",
  ],
  linkRetry: [
    "think",
    "The bridge wobbled. Check the result and the joining word.",
    "El puente tembló. Revisa el resultado y la palabra de unión.",
  ],
  retell: [
    "think",
    "Last stop: which retelling tells the whole story truly?",
    "Última parada: ¿qué resumen cuenta todo el cuento de verdad?",
  ],
  retellRetry: [
    "think",
    "Close! Compare it with your trail and your bridges.",
    "¡Casi! Compáralo con tu sendero y tus puentes.",
  ],
  retellRight: [
    "cheer",
    "That retelling is true from start to finish!",
    "¡Ese resumen es verdadero de principio a fin!",
  ],
  scene: [
    "cheer",
    "Scene complete! Here is what you figured out.",
    "¡Escena terminada! Esto es lo que descubriste.",
  ],
};
export const sayOf = (s, I) => {
  const x = SAY[s.say] || SAY.start;
  return { mood: x[0], text: I.T(x[1], x[2]) };
};

export function validateStoryWorld(content) {
  const errs = [];
  const bi = (t) =>
    t &&
    typeof t.en === "string" &&
    t.en.trim() &&
    typeof t.es === "string" &&
    t.es.trim() &&
    t.en !== t.es;
  for (const band of ["3-5", "6-8"]) {
    const levels = content.bands?.[band]?.levels || [];
    if (levels.length < 3) errs.push(`${band}: needs at least 3 story levels`);
    const want = band === "3-5" ? [4, 5] : [5, 5];
    for (const st of levels) {
      const at = `${band}/${st.id}`;
      if (!SCENE_KEYS.includes(st.art)) errs.push(`${at}: unknown scene art "${st.art}"`);
      if (!bi(st.title)) errs.push(`${at}: title must be bilingual`);
      const ev = st.events || [];
      if (ev.length < want[0] || ev.length > want[1])
        errs.push(`${at}: needs ${want.join("-")} events`);
      const ids = ev.map((e) => e.id);
      if (new Set(ids).size !== ids.length) errs.push(`${at}: duplicate event ids`);
      for (const e of ev) {
        if (!e.en || !e.es || e.en === e.es)
          errs.push(`${at}/${e.id}: event needs English and Spanish`);
        if (!bi(e.clause) || !bi(e.clue))
          errs.push(`${at}/${e.id}: clause and clue must be bilingual`);
        if (
          !e.spot ||
          !(e.spot.x >= 6 && e.spot.x <= 94 && e.spot.y >= 6 && e.spot.y <= 94) ||
          !bi(e.spot)
        )
          errs.push(`${at}/${e.id}: hotspot needs x/y inside the scene and a bilingual label`);
      }
      const xs = ev.map((e) => e.spot?.x ?? 0);
      if (xs.every((x, i) => i === 0 || x >= xs[i - 1]))
        errs.push(`${at}: hotspots run left to right in story order (gives the order away)`);
      if (band === "3-5") {
        const lead = ev.map((e) => e.en.split(",")[0]);
        if (lead[0] !== "First" || lead[lead.length - 1] !== "Finally")
          errs.push(`${at}: 3-5 stories start with "First," and end with "Finally,"`);
      }
      const links = st.links || [];
      if (links.length < (band === "6-8" ? 2 : 1))
        errs.push(`${at}: needs ${band === "6-8" ? 2 : 1}+ cause links`);
      if (band === "6-8" && !links.some((l) => l.causes?.length === 2))
        errs.push(`${at}: 6-8 needs one effect with two causes`);
      links.forEach((l, i) => {
        const la = `${at}/link${i + 1}`;
        if (!["so", "because"].includes(l.form)) errs.push(`${la}: form must be so or because`);
        if (!bi(l.why)) errs.push(`${la}: why must be bilingual`);
        const eIdx = ids.indexOf(l.effect);
        if (
          eIdx < 0 ||
          !l.causes?.length ||
          l.causes.some((c) => ids.indexOf(c) < 0 || ids.indexOf(c) >= eIdx)
        )
          errs.push(`${la}: every cause must be a real event that comes before the effect`);
        if ((l.decoys || []).length < 2) errs.push(`${la}: needs 2 decoy effects`);
        for (const d of l.decoys || [])
          if (!ids.includes(d.id) || d.id === l.effect || l.causes?.includes(d.id) || !bi(d.why))
            errs.push(`${la}: decoy ${d.id} must be another event with a bilingual reason`);
      });
      const r = st.retell || [];
      if (r.length !== 3 || !r.every((x) => x.en && x.es && x.en !== x.es))
        errs.push(`${at}: retell needs 3 bilingual options`);
      if (r.slice(1).some((x) => !bi(x.why)) || r[0]?.why)
        errs.push(
          `${at}: the first retelling is the true one; the others explain why they are wrong`,
        );
      if (r[0] && r[0].en.split(/(?<!\bMr)\.\s+/).length !== 3)
        errs.push(`${at}: the true retelling should be 3 sentences`);
    }
  }
  if (/\b(timer|countdown|hurry|seconds left)\b/i.test(JSON.stringify(content)))
    errs.push("no timer or speed language");
  return errs;
}

const STICK = {
  star: {
    name: ["Story Star", "Estrella del cuento"],
    means: [
      "You understood every step on the first try.",
      "Entendiste cada paso al primer intento.",
    ],
    fill: "#f2c15b",
  },
  spark: {
    name: ["Bright Reviser", "Revisión brillante"],
    means: [
      "You used feedback and hints to fix your thinking.",
      "Usaste los comentarios y las pistas para corregir tu idea.",
    ],
    fill: "#1fa6a2",
  },
  map: {
    name: ["Trail Finder", "Sendero completo"],
    means: [
      "You followed every clue to the end of the trail.",
      "Seguiste cada pista hasta el final del sendero.",
    ],
    fill: "#f2765a",
  },
};
export const stickerInfo = (kind) => STICK[kind] || STICK.map;
export function stickerSVG(kind, size = 64) {
  const s = stickerInfo(kind);
  const mark =
    kind === "star"
      ? '<path d="M32 14l5 11l12 1l-9 8l3 12l-11 -6l-11 6l3 -12l-9 -8l12 -1Z" fill="#fff"/>'
      : kind === "spark"
        ? '<path d="M20 34l8 8l16 -18" fill="none" stroke="#fff" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>'
        : '<path d="M18 42q8 -18 14 -6t14 -14" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round" stroke-dasharray="2 7"/><circle cx="46" cy="22" r="5" fill="#fff"/>';
  return raw(
    `<svg class="sw-sticker" viewBox="0 0 64 64" width="${size}" height="${size}" aria-hidden="true" focusable="false"><circle cx="32" cy="32" r="28" fill="${s.fill}" stroke="#17324d" stroke-width="3"/><circle cx="32" cy="32" r="22" fill="none" stroke="#fff" stroke-width="2" stroke-dasharray="3 4" opacity=".8"/>${mark}</svg>`,
  );
}

// ── header: scene map, streak, mascot ───────────────────────────────────────────────────
const STAGES = [
  ["Explore", "Explorar"],
  ["Trail", "Sendero"],
  ["Cause bridge", "Puente de causa"],
  ["Retell", "Resumen"],
];
export function headerHTML(s, env, stories, say) {
  const I = env.I;
  const levels = stories.map((st, i) => {
    const got = s.stickers[i];
    const now = i === s.li;
    const status = got
      ? I.S("finished", "terminada")
      : now
        ? I.S("you are here", "estás aquí")
        : I.S("locked", "bloqueada");
    return html`<li class="sw-lv${got ? " is-done" : now ? " is-now" : " is-locked"}">
      <span class="sw-lv-badge"
        >${got ? stickerSVG(got, 34) : now ? icon("pin") : icon("lock")}</span
      >${got || now ? html`<span class="sw-lv-t">${I.T(st.title.en, st.title.es)}</span>` : ""}<span class="visually-hidden">${got || now ? "" : I.S("Scene", "Escena") + ` ${i + 1} `}(${status})</span>
    </li>`;
  });
  const steps = STAGES.map(
    (p, i) =>
      html`<li
        class="${i < s.stage ? "is-done" : i === s.stage ? "is-now" : ""}"
        ${i === s.stage ? raw(' aria-current="step"') : ""}
      >
        <span class="sw-step-n">${i < s.stage ? icon("check") : i + 1}</span>${I.T(p[0], p[1])}
      </li>`,
  );
  return html`<div class="sw-head">
      <ol class="sw-levels" aria-label="${I.S("Story scenes", "Escenas del cuento")}">
        ${levels}
      </ol>
      <p
        class="sw-streak"
        aria-label="${I.S(`Understanding streak: ${s.streak}. Best: ${s.best}.`, `Racha de comprensión: ${s.streak}. Mejor: ${s.best}.`)}"
      >
        ${icon("star")}<span>${I.T("Understanding streak", "Racha de comprensión")}</span>
        <strong>${s.streak}</strong>
      </p>
    </div>
    ${
      s.stage < 4
        ? html`<ol
            class="sw-steps"
            aria-label="${I.S("Steps in this scene", "Pasos de esta escena")}"
          >
            ${steps}
          </ol>`
        : ""
    }
    <div class="sw-guide">
      ${mascot(env.band === "3-5" ? "pip" : "juno", env.band, say.mood, 64)}
      <p class="sw-bubble">${say.text}</p>
    </div>`;
}

// ── stage 4: scene complete ─────────────────────────────────────────────────────────────
export function completeHTML(story, L, env, kind, last) {
  const I = env.I;
  const info = stickerInfo(kind);
  const built = story.links.map(
    (link) =>
      html`<li>
        ${bridgeSentence(story, link, link.effect, acceptedFor(link.form, env.band)[0], "en")}
      </li>`,
  );
  return html`<section class="sw-complete" aria-labelledby="sw-complete-h">
    <div class="sw-burst" aria-hidden="true">
      ${[0, 1, 2, 3, 4, 5, 6, 7].map((i) => html`<i style="--i:${i}"></i>`)}
    </div>
    <div class="sw-complete-sticker">${stickerSVG(kind, 112)}</div>
    <h2 id="sw-complete-h" tabindex="-1">
      ${I.T("Scene complete:", "Escena terminada:")} ${I.T(story.title.en, story.title.es)}
    </h2>
    <p class="sw-earned">
      <strong
        >${I.T("Sticker earned:", "Calcomanía ganada:")} ${I.T(info.name[0], info.name[1])}.</strong
      >
      ${I.T(info.means[0], info.means[1])}
    </p>
    <h3 class="sw-sub">${I.T("What you learned", "Lo que aprendiste")}</h3>
    <ul class="sw-recap">
      <li>
        ${icon("road")}${I.T(`You put ${story.events.length} events in story order.`, `Pusiste ${story.events.length} hechos en el orden del cuento.`)}
      </li>
      <li>
        ${icon("conversation")}${I.T("You built cause-and-effect sentences:", "Construiste oraciones de causa y efecto:")}
        <ul>
          ${built}
        </ul>
      </li>
      <li>
        ${icon("reading")}${I.T("Your retelling:", "Tu resumen:")} <em>${story.retell[0].en}</em>
      </li>
    </ul>
    <div class="gs-actions">
      <button type="button" class="btn btn-primary btn-big" data-g-next>
        ${icon(last ? "medal" : "launch")}${last ? I.T("Finish the Story World", "Terminar el Mundo de cuentos") : I.T("Unlock the next scene", "Desbloquear la siguiente escena")}
      </button>
    </div>
  </section>`;
}
