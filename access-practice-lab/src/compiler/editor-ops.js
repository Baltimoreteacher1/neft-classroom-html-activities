// Experience Builder: the editor's operations on a mission definition. Pure (no DOM): applyOp(def, op) returns a NEW
// definition, or { error } when the operation itself makes no sense (for example removing the only scene). Whether
// the result is still a valid, playable experience is decided by validateExperience right after, so the editor can
// say precisely what an edit broke.
// Rules it keeps: an edit never invents an id that already exists; removing a thing also removes the references to
// it (hotspots, gives, comparison pairs, conditions), so a removal cannot leave a dangling pointer.
const clone = (v) => JSON.parse(JSON.stringify(v));
const P = (en, es) => [en, es];
const byId = (list, id) => (list || []).find((x) => x.id === id);
const SPOT_XY = [
  [18, 62],
  [50, 44],
  [80, 60],
  [34, 26],
  [66, 24],
  [50, 78],
  [14, 30],
  [86, 32],
  [30, 82],
  [70, 82],
];
const freeId = (taken, prefix) => {
  for (let n = 1; ; n++) if (!taken.has(`${prefix}${n}`)) return `${prefix}${n}`;
};
const place = (scene) => SPOT_XY[scene.hotspots.length % SPOT_XY.length];
const spot = (scene, id, label, opens) => {
  const [x, y] = place(scene);
  scene.hotspots.push({ id, label, x, y, opens });
};
const allHotspotIds = (def) => new Set(def.scenes.flatMap((s) => s.hotspots.map((h) => h.id)));

/** Set one side of an [en, es] pair, or both sides when `lang` is "both" (source-language text). */
function setPair(holder, field, lang, value) {
  const text = String(value ?? "");
  const pair = Array.isArray(holder[field]) ? [...holder[field]] : ["", ""];
  if (lang === "both") holder[field] = [text, text];
  else {
    pair[lang === "es" ? 1 : 0] = text;
    holder[field] = pair;
  }
}

/** Drop every condition that mentions a removed thing; an emptied all/any becomes "no condition". */
function pruneCond(cond, hit) {
  if (!cond || typeof cond !== "object") return cond;
  if (hit(cond)) return null;
  for (const k of ["all", "any"])
    if (Array.isArray(cond[k])) {
      const kept = cond[k].map((c) => pruneCond(c, hit)).filter(Boolean);
      return kept.length ? { [k]: kept } : null;
    }
  if ("not" in cond) {
    const inner = pruneCond(cond.not, hit);
    return inner ? { not: inner } : null;
  }
  return cond;
}
function pruneAll(def, hit) {
  const fix = (holder, key) => {
    if (holder[key] == null) return;
    const next = pruneCond(holder[key], hit);
    if (next) holder[key] = next;
    else delete holder[key];
  };
  for (const s of def.scenes) {
    fix(s, "requires");
    for (const h of s.hotspots) fix(h, "requires");
  }
  for (const c of def.characters) for (const t of c.topics) fix(t, "requires");
  for (const t of def.tasks) fix(t, "requires");
  for (const a of def.acts) {
    fix(a, "done");
    if (a.done == null) a.done = { evidence: 0 };
  }
  def.outcomes.forEach((o, i) => {
    if (i < def.outcomes.length - 1) {
      fix(o, "when");
      if (o.when == null) o.when = { evidence: 0 };
    }
  });
}

const OPS = {
  // ── scenes ────────────────────────────────────────────────────────────────
  "scene.move"(def, { id, dir }) {
    const i = def.scenes.findIndex((s) => s.id === id);
    const j = i + (dir < 0 ? -1 : 1);
    if (i < 0) return "unknown-scene";
    if (j < 0 || j >= def.scenes.length) return "cannot-move";
    [def.scenes[i], def.scenes[j]] = [def.scenes[j], def.scenes[i]];
  },
  "scene.add"(def) {
    const id = freeId(new Set(def.scenes.map((s) => s.id)), "s");
    const prev = def.scenes[def.scenes.length - 1];
    const hot = allHotspotIds(def);
    const scene = {
      id,
      title: P("A new place", "Un lugar nuevo"),
      art: prev.art,
      description: P(
        "Describe what learners find here.",
        "Describe lo que los estudiantes encuentran aquí.",
      ),
      hotspots: [],
    };
    spot(
      scene,
      freeId(hot, "h-door"),
      P(`Go back to ${prev.title[0].toLowerCase()}`, `Vuelve a ${prev.title[1].toLowerCase()}`),
      { scene: prev.id },
    );
    hot.add(scene.hotspots[0].id);
    spot(prev, freeId(hot, "h-door"), P("Go on to a new place", "Sigue a un lugar nuevo"), {
      scene: id,
    });
    def.scenes.push(scene);
  },
  "scene.remove"(def, { id }) {
    const i = def.scenes.findIndex((s) => s.id === id);
    if (i < 0) return "unknown-scene";
    if (def.scenes.length < 2) return "last-scene";
    const gone = def.scenes[i];
    const home = def.scenes[i > 0 ? i - 1 : 1];
    def.scenes.splice(i, 1);
    // Its doors move to the neighbour, so the places behind it stay reachable; its contents move there too.
    for (const s of def.scenes) s.hotspots = s.hotspots.filter((h) => h.opens.scene !== id);
    for (const h of gone.hotspots) {
      if (
        h.opens.scene &&
        (h.opens.scene === home.id || home.hotspots.some((x) => x.opens.scene === h.opens.scene))
      )
        continue;
      const [x, y] = place(home);
      home.hotspots.push({ ...h, x, y });
      if (h.opens.scene) {
        // the scene behind the removed one needs a door back to where its door now stands
        const far = byId(def.scenes, h.opens.scene);
        if (far && !far.hotspots.some((x2) => x2.opens.scene === home.id))
          spot(
            far,
            freeId(allHotspotIds(def), "h-door"),
            P(
              `Go back to ${home.title[0].toLowerCase()}`,
              `Vuelve a ${home.title[1].toLowerCase()}`,
            ),
            { scene: home.id },
          );
      }
    }
    for (const c of def.characters) if (c.scene === id) c.scene = home.id;
    for (const t of def.tasks) if (t.scene === id) t.scene = home.id;
    if (def.start === id) def.start = home.id;
    if (Array.isArray(def.map)) def.map = def.map.filter((m) => m.scene !== id);
  },
  "scene.set"(def, { id, field, lang, value }) {
    const s = byId(def.scenes, id);
    if (!s) return "unknown-scene";
    if (field === "art") s.art = String(value);
    else if (field === "title" || field === "description") setPair(s, field, lang, value);
    else return "unknown-field";
  },
  "hotspot.set"(def, { scene, id, field, lang, value }) {
    const h = byId(byId(def.scenes, scene)?.hotspots, id);
    if (!h) return "unknown-hotspot";
    if (field === "label") setPair(h, "label", lang, value);
    else if (field === "x" || field === "y")
      h[field] = Math.max(0, Math.min(100, Number(value) || 0));
    else return "unknown-field";
  },
  "hotspot.remove"(def, { scene, id }) {
    const s = byId(def.scenes, scene);
    if (!s || !byId(s.hotspots, id)) return "unknown-hotspot";
    s.hotspots = s.hotspots.filter((h) => h.id !== id);
  },
  "hotspot.add"(def, { scene, kind, target }) {
    const s = byId(def.scenes, scene);
    const list = {
      evidence: def.evidence,
      character: def.characters,
      task: def.tasks,
      scene: def.scenes,
    }[kind];
    const item = byId(list, target);
    if (!s || !item) return "unknown-target";
    if (kind === "evidence" && item.kind === "testimony") return "testimony-is-given";
    if (kind === "scene" && target === scene) return "same-scene";
    const name = kind === "character" ? item.name : kind === "task" ? item.id : null;
    const label =
      kind === "character"
        ? P(`Talk with ${name}`, `Habla con ${name}`)
        : kind === "task"
          ? P(`Open the task: ${item.type}`, `Abre la tarea: ${item.type}`)
          : kind === "scene"
            ? P(`Go to ${item.title[0].toLowerCase()}`, `Ve a ${item.title[1].toLowerCase()}`)
            : P(`Open: ${item.title[0]}`, `Abre: ${item.title[1]}`);
    spot(s, freeId(allHotspotIds(def), "h-new"), label, { [kind]: target });
    if (kind === "character") item.scene = scene;
    if (kind === "task") item.scene = scene;
  },

  // ── characters ────────────────────────────────────────────────────────────
  "character.set"(def, { id, field, lang, value }) {
    const c = byId(def.characters, id);
    if (!c) return "unknown-character";
    if (field === "name" || field === "look") c[field] = String(value);
    else if (["role", "style", "greeting", "fallback"].includes(field))
      setPair(c, field, lang, value);
    else return "unknown-field";
  },
  "topic.set"(def, { character, id, field, lang, value }) {
    const t = byId(byId(def.characters, character)?.topics, id);
    if (!t) return "unknown-topic";
    if (field === "ask" || field === "answer") setPair(t, field, lang, value);
    else if (field === "keywords")
      t.keywords = String(value)
        .split(/[,\n]/)
        .map((k) => k.trim())
        .filter(Boolean)
        .slice(0, 12);
    else if (field === "clarify.ask" || field === "clarify.answer") {
      t.clarify ||= {
        ask: P("Can you tell me more about that?", "¿Me puedes decir más sobre eso?"),
        answer: ["", ""],
      };
      setPair(t.clarify, field.split(".")[1], lang, value);
    } else return "unknown-field";
    // An edited answer no longer claims the sentences it was built from; the validator re-checks it against the whole text.
    if (field === "answer") delete t.from;
    if (field === "clarify.answer") delete t.clarify.from;
  },
  "topic.add"(def, { character }) {
    const c = byId(def.characters, character);
    if (!c) return "unknown-character";
    const id = freeId(new Set(c.topics.map((t) => t.id)), "t-new");
    c.topics.push({
      id,
      ask: P("What else can you tell me?", "¿Qué más me puedes decir?"),
      keywords: ["else"],
      answer: P(
        "Write this answer with a sentence from your text.",
        "Escribe esta respuesta con una oración de tu texto.",
      ),
    });
  },
  "topic.remove"(def, { character, id }) {
    const c = byId(def.characters, character);
    if (!c || !byId(c.topics, id)) return "unknown-topic";
    if (c.topics.length < 2) return "last-topic";
    c.topics = c.topics.filter((t) => t.id !== id);
  },

  // ── evidence ──────────────────────────────────────────────────────────────
  "evidence.add"(def, { kind = "document", scene }) {
    if (!["document", "data", "object", "audio"].includes(kind)) return "unknown-kind";
    const id = freeId(new Set(def.evidence.map((e) => e.id)), "ev-new");
    def.evidence.push({
      id,
      kind,
      title: P("New evidence", "Evidencia nueva"),
      body: P("Copy a sentence from your text here.", "Copia aquí una oración de tu texto."),
      strength: "weak",
      ...(kind === "audio" ? { transcript: true } : {}),
    });
    const s = byId(def.scenes, scene) || byId(def.scenes, def.start) || def.scenes[0];
    spot(s, freeId(allHotspotIds(def), "h-new"), P("Open: New evidence", "Abre: Evidencia nueva"), {
      evidence: id,
    });
  },
  "evidence.set"(def, { id, field, lang, value }) {
    const e = byId(def.evidence, id);
    if (!e) return "unknown-evidence";
    if (field === "title") setPair(e, "title", lang, value);
    else if (field === "body") {
      setPair(e, "body", lang, value);
      delete e.from;
    } else if (field === "kind") {
      if (!["document", "data", "object", "audio", "testimony"].includes(value))
        return "unknown-kind";
      const opened = def.scenes.some((s) => s.hotspots.some((h) => h.opens.evidence === id));
      if (value === "testimony" && opened) return "testimony-is-given";
      e.kind = value;
      if (value === "audio") e.transcript = true;
      else delete e.transcript;
    } else if (field === "strength") e.strength = value === "strong" ? "strong" : "weak";
    else if (field === "link") {
      // value = "supports:<explanationId>" | "contradicts:<explanationId>" | "none:<explanationId>"
      const [how, ex] = String(value).split(":");
      if (!byId(def.explanations, ex)) return "unknown-explanation";
      for (const k of ["supports", "contradicts"]) {
        const next = (e[k] || []).filter((x) => x !== ex);
        if (k === how) next.push(ex);
        if (next.length) e[k] = next;
        else delete e[k];
      }
    } else return "unknown-field";
  },
  "evidence.remove"(def, { id }) {
    if (!byId(def.evidence, id)) return "unknown-evidence";
    def.evidence = def.evidence.filter((e) => e.id !== id);
    for (const s of def.scenes) s.hotspots = s.hotspots.filter((h) => h.opens.evidence !== id);
    for (const c of def.characters)
      for (const t of c.topics) {
        if (t.gives) t.gives = t.gives.filter((x) => x !== id);
        if (t.clarify?.gives) t.clarify.gives = t.clarify.gives.filter((x) => x !== id);
      }
    for (const t of def.tasks) if (t.pairs) t.pairs = t.pairs.filter((p) => !p.includes(id));
    pruneAll(def, (c) => c.has === id);
  },

  // ── tasks, decision, supports, feedback ───────────────────────────────────
  "task.set"(def, { id, field, lang, value }) {
    const t = byId(def.tasks, id);
    if (!t) return "unknown-task";
    if (field === "prompt") setPair(t, "prompt", lang, value);
    else if (field === "minWords") t.minWords = Math.max(0, Math.round(Number(value) || 0));
    else return "unknown-field";
  },
  "option.set"(def, { task, id, lang, value }) {
    const o = byId(byId(def.tasks, task)?.options, id);
    if (!o) return "unknown-option";
    setPair(o, "label", lang, value);
    const ex = byId(def.explanations, o.explanation);
    if (ex) ex.label = [...o.label];
  },
  "supports.set"(def, { key, value }) {
    if (!["glossary", "frames", "readAloud", "spanish", "wordBank"].includes(key))
      return "unknown-support";
    def.compiled ||= {};
    def.supports = { ...(def.supports || def.compiled.supports || {}), [key]: Boolean(value) };
    def.compiled.supports = { ...def.supports };
    if (key === "frames")
      for (const t of def.tasks)
        if (t.type === "speak" || t.type === "write") {
          if (value) t.frames = clone(def.compiled.frames || t.frames || []);
          else {
            if (t.frames?.length) def.compiled.frames = clone(t.frames);
            delete t.frames;
          }
        }
    if (key === "glossary") {
      if (value) def.vocabulary = clone(def.compiled.vocabulary || def.vocabulary || []);
      else {
        if (def.vocabulary?.length) def.compiled.vocabulary = clone(def.vocabulary);
        def.vocabulary = [];
      }
    }
  },
  "feedback.set"(def, { field, value }) {
    if (field === "keyUse") {
      def.keyUses = [String(value)];
      for (const t of def.tasks) t.keyUse = String(value);
    } else if (field === "speak" || field === "write") {
      const n = Math.max(0, Math.round(Number(value) || 0));
      for (const t of def.tasks)
        if (t.type === field || (field === "write" && t.type === "revise")) t.minWords = n;
    } else return "unknown-field";
    def.compiled ||= {};
    const f = (def.compiled.feedback ||= { minWords: {} });
    if (field === "keyUse") f.keyUse = String(value);
    else (f.minWords ||= {})[field] = Math.max(0, Math.round(Number(value) || 0));
  },
  "meta.set"(def, { field, lang, value }) {
    if (field === "title" || field === "summary") setPair(def, field, lang, value);
    else if (field === "language" || field === "content")
      setPair(def.objectives, field, lang, value);
    else if (field === "showSource") {
      def.compiled ||= {};
      def.compiled.settings = { ...(def.compiled.settings || {}), showSource: Boolean(value) };
    } else return "unknown-field";
  },
};
export const OP_TYPES = Object.keys(OPS);

/**
 * Apply one editor operation.
 * @returns {{ def: object, error?: string }} a new definition; on `error` the given definition is returned untouched
 */
export function applyOp(def, op) {
  const run = OPS[op?.type];
  if (!run) return { def, error: "unknown-operation" };
  const next = clone(def);
  const error = run(next, op);
  return typeof error === "string" ? { def, error } : { def: next };
}

export const OP_ERRORS = Object.freeze({
  "cannot-move": [
    "That scene is already at the end of the list.",
    "Esa escena ya está al final de la lista.",
  ],
  "last-scene": [
    "An experience needs at least one scene.",
    "Una experiencia necesita al menos una escena.",
  ],
  "last-topic": [
    "A character needs at least one thing to talk about.",
    "Un personaje necesita al menos un tema del que hablar.",
  ],
  "testimony-is-given": [
    "Testimony is something a character says, so it cannot be opened from a scene.",
    "Un testimonio es algo que dice un personaje; no se puede abrir desde una escena.",
  ],
  "same-scene": [
    "A door cannot lead to the scene it is in.",
    "Una puerta no puede llevar a la misma escena.",
  ],
});
