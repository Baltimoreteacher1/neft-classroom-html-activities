// Real-Life Scenarios logic (pure, no DOM): walking a branching scene, summarizing the language a learner used, and a
// wording check for the "say it" step. The check looks at WORDS (does the line show the language target?). It never
// judges pronunciation, accent or speed, and it never produces a score.

export const TAGS = {
  greet: ["Greeting", "Saludar", "Start with a greeting such as Hello or Good morning."],
  request: [
    "Polite request",
    "Pedir con cortesía",
    "Try a polite starter: Could you…, May I…, or add please.",
  ],
  question: [
    "Question",
    "Hacer una pregunta",
    "Start with a question word (Where, What, How) or a helper word (Can, Do, Is) and end with a question mark.",
  ],
  clarify: [
    "Asking to clarify",
    "Pedir que aclaren",
    "Ask for another try: Could you say that again? or What does … mean?",
  ],
  apologize: ["Apology", "Disculparse", "Use Sorry, I am sorry, or Excuse me."],
  disagree: [
    "Polite disagreement",
    "Desacuerdo cortés",
    "Acknowledge first (I see your point), then offer another idea (but maybe we could…).",
  ],
  thank: ["Thanking", "Dar las gracias", "Say Thank you or Thanks."],
  offer: ["Offering help", "Ofrecer ayuda", "Try Can I help…? or Let me…"],
  explain: ["Giving a reason", "Dar una razón", "Add because… or so that… to say why."],
  refuse: [
    "Polite no",
    "Decir que no con cortesía",
    "Soften a no: Sorry, but I can’t… or No, thank you.",
  ],
  describe: ["Describing", "Describir", "Give details: my…, it hurts, it started…, it is…"],
  invite: ["Inviting", "Invitar", "Try Would you like to…? or Do you want to join us?"],
  accept: ["Accepting", "Aceptar", "Say Yes, sure, Of course, or That sounds good."],
};
export const TAG_IDS = Object.keys(TAGS);

export const QUALITY = {
  2: ["Clear and polite", "Claro y cortés"],
  1: ["Understood, but you can say it better", "Se entiende, pero puedes decirlo mejor"],
  0: [
    "This could confuse or upset the listener",
    "Esto podría confundir o molestar a quien escucha",
  ],
};

const RULES = {
  greet: /\b(hello|hi|hey|good (morning|afternoon|evening)|nice to meet you|welcome)\b/,
  request: /\b(please|could you|would you|can you|may i|could i|can i|i would like|i'd like|would it be (ok|okay|possible))\b/,
  clarify:
    /\b(repeat|say (that )?again|slowly|slow down|what do you mean|what does .* mean|explain|i don't understand|i do not understand|do you mean|you mean|is it okay if|is that (right|okay|ok)|just to (check|be sure)|to be sure|let me check)\b|\bright\?$/,
  apologize: /\b(sorry|apolog|excuse me|my mistake|my fault|pardon)\b/,
  thank: /\b(thank|thanks|appreciate)\b/,
  offer:
    /\b(can i help|may i help|i can (help|write|draw|make|check|bring|carry|do|share|take|add|start|find|read|get|give|sit|explain)|i will|i'll|let me|would you like me|do you want me|shall i|i could|we could|how about|do you want to|would you like to|let's|what if)\b/,
  explain: /\b(because|so that|since|that is why|that's why|the reason)\b|,\s*so\b/,
  describe:
    /\b(my|i have|i feel|it hurts|hurts|sore|ache|started|since|is broken|is missing|lost|last saw|saw it|it is|it looks|it was|color|near|next to|behind|under|inside|beside)\b/,
  invite: /\b(would you like to|do you want to|want to join|join us|sit with|sit here|let's|let us|why don't you|come and)\b/,
  accept:
    /\b(yes|sure|okay|ok|of course|sounds good|that works|i'd love|i would love|i would like to|i'd like to|i can do that|happy to|gladly|great idea)\b/,
};
const sentences = (text) =>
  String(text)
    .split(/(?<=[.?!])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);

/** Does `text` show the language target `tag`? Returns { ok, hint } where hint is the learner-facing reminder when it does not. */
export function checkLine(tag, text) {
  const t = String(text || "")
    .toLowerCase()
    .replace(/[’]/g, "'");
  if (!t.trim()) return { ok: false, empty: true };
  let ok;
  if (tag === "question")
    ok = sentences(t).some(
      (s) =>
        s.endsWith("?") &&
        /^(who|what|when|where|why|how|which|do|does|did|is|are|can|could|would|will|may|should|have|has)\b/.test(
          s.replace(/^((hello|hi|excuse me|sorry|please|yes|sure|okay|ok|thanks|thank you)[,.!]?\s+)+/, ""),
        ),
    );
  else if (tag === "refuse")
    ok =
      /\b(no, thank|no thank|sorry, but|i can't|i cannot|i'd rather not|i would rather not|not right now|i don't think i can)\b/.test(
        t,
      ) && /\b(sorry|thank|but|please)\b/.test(t);
  else if (tag === "disagree")
    ok =
      /\b(see your point|understand|good idea|great idea|i think|maybe|not sure|what if|how about)\b/.test(
        t,
      ) && (/\b(but|however|instead|disagree|what if|how about|another)\b/.test(t) || /\b(maybe|i think) we (should|could)\b/.test(t));
  else ok = RULES[tag]?.test(t) ?? false;
  return { ok, hint: ok ? "" : TAGS[tag]?.[2] || "" };
}

// ── walking a scene ───────────────────────────────────────────────────────────
export const nodeOf = (scene, id) => scene.nodes[id] || null;
export const choiceOf = (node, id) => node?.choices?.find((c) => c.id === id) || null;

/** The node the learner is on after `path` ([{n, c}]) when the last choice's feedback has been read (`ack`). */
export function currentNode(scene, path, ack = true) {
  if (!path.length) return scene.start;
  const last = path[path.length - 1];
  if (!ack) return last.n;
  return choiceOf(nodeOf(scene, last.n), last.c)?.next || last.n;
}

/** The learner's turns with the NPC line each one answered and the strong alternative at that node. */
export function transcript(scene, path) {
  const turns = [];
  let prev = scene.start;
  for (const { n, c } of path) {
    const node = nodeOf(scene, n);
    const ch = choiceOf(node, c);
    if (!node || !ch) break;
    turns.push({
      n,
      node,
      ch,
      npcSaid: node.say,
      strong: node.choices.find((x) => x.q === 2) || null,
    });
    prev = ch.next;
  }
  return { turns, endId: prev };
}

/** Counts and the language targets used: { strong, ok, weak, turns, tags: { tag: { strong, total } } }. */
export function summarize(scene, path) {
  const { turns, endId } = transcript(scene, path);
  const tags = {};
  let strong = 0;
  let ok = 0;
  let weak = 0;
  for (const t of turns) {
    const k = (tags[t.ch.tag] ||= { strong: 0, total: 0 });
    k.total += 1;
    if (t.ch.q === 2) ((k.strong += 1), (strong += 1));
    else if (t.ch.q === 1) ok += 1;
    else weak += 1;
  }
  const end = nodeOf(scene, endId);
  return {
    turns: turns.length,
    strong,
    ok,
    weak,
    tags,
    end: end?.end ? end : null,
    targetsShown: Object.values(tags).filter((k) => k.strong).length,
  };
}

/** Longest and shortest number of learner turns from the start (the scene must be a DAG). */
export function pathLengths(scene) {
  const memo = new Map();
  const walk = (id) => {
    const node = scene.nodes[id];
    if (!node || node.end) return [0, 0];
    if (memo.has(id)) return memo.get(id);
    const lens = node.choices.map((c) => walk(c.next));
    const r = [1 + Math.max(...lens.map((l) => l[0])), 1 + Math.min(...lens.map((l) => l[1]))];
    memo.set(id, r);
    return r;
  };
  const [max, min] = walk(scene.start);
  return { max, min };
}

export const PLACE_GROUP = {
  office: "school",
  classroom: "school",
  hallway: "school",
  library: "school",
  playground: "school",
  lunch: "school",
  bus: "school",
  clinic: "health",
  pharmacy: "health",
  store: "community",
  phone: "community",
  street: "community",
  home: "community",
};
export const GROUPS = [
  ["school", "At school", "En la escuela"],
  ["health", "Staying healthy", "Cuidar la salud"],
  ["community", "In the community", "En la comunidad"],
];
