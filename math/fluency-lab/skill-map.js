// Interactive learning pathway for one grade: foundations from earlier grades, the grade's own skills in
// strand lanes, and the next-grade skills they lead to. Prerequisite links come from the same edges the
// tutor uses (tutor-engine.js prerequisiteGraph). Every node is a real button: Tab enters the map, the arrow
// keys move between skills, Enter or Space opens one. State is shown by a word, a pie-fill shape and a border
// pattern, and a prerequisite link is solid when the skill it comes from is strong and dashed when it is not.
import { t } from "./i18n.js";
import { ALL_SKILLS } from "./problem-bank.js";
import { skillSignals } from "./recommendation-engine.js";
import { escapeHtml, masteryRing, stateGlyph, stateLabel } from "./skill-card.js";
import { findSkill, prerequisiteGraph, skillKey } from "./tutor-engine.js";

export const NODE = Object.freeze({
  w: 216,
  h: 84,
  gapX: 56,
  gapY: 16,
  lanePad: 12,
  labelW: 132,
  headH: 28,
});
const STRONG = new Set(["proficient", "mastered"]);

// Pure layout, exported for tests: columns are foundation (0), grade depth (1..), next grade (last).
export function layoutSkillMap(grade) {
  const own = ALL_SKILLS.filter((skill) => skill.grade === grade);
  const ownKeys = new Set(own.map(skillKey));
  const parentsOf = (key) => prerequisiteGraph[key]?.prerequisiteSkills || [];
  const memo = new Map();
  const depthOf = (key, trail = new Set()) => {
    if (memo.has(key)) return memo.get(key);
    if (trail.has(key)) return 0;
    trail.add(key);
    const inside = parentsOf(key).filter((k) => ownKeys.has(k));
    const depth = inside.length ? 1 + Math.max(...inside.map((k) => depthOf(k, trail))) : 0;
    memo.set(key, depth);
    return depth;
  };
  const maxDepth = Math.max(0, ...own.map((skill) => depthOf(skillKey(skill))));
  const laneOf = new Map(own.map((skill) => [skillKey(skill), skill.strand]));
  const strands = [...new Set(own.map((skill) => skill.strand))];
  const placed = [];
  const add = (skill, column, strand, kind) =>
    placed.push({ skill, key: skillKey(skill), column, strand, kind });
  own.forEach((skill) => add(skill, 1 + depthOf(skillKey(skill)), skill.strand, "grade"));
  const edges = [];
  const seenOff = new Map();
  for (const skill of own) {
    for (const from of parentsOf(skillKey(skill))) {
      const source = findSkill(from);
      if (!source) continue;
      if (source.grade < grade && !seenOff.has(from)) {
        seenOff.set(from, true);
        add(source, 0, laneOf.get(skillKey(skill)), "before");
      }
      edges.push({ from, to: skillKey(skill) });
    }
    for (const to of prerequisiteGraph[skillKey(skill)]?.enrichmentSkills || []) {
      const target = findSkill(to);
      if (!target || target.grade !== grade + 1) continue;
      if (!seenOff.has(to)) {
        seenOff.set(to, true);
        add(target, maxDepth + 2, laneOf.get(skillKey(skill)), "after");
      }
    }
  }
  const nextCol = maxDepth + 2;
  for (const node of placed.filter((n) => n.kind === "after"))
    for (const from of prerequisiteGraph[node.key]?.prerequisiteSkills || [])
      if (ownKeys.has(from)) edges.push({ from, to: node.key });
  // Rows inside a lane: nodes sharing a column and lane stack.
  const cell = new Map();
  for (const node of placed) {
    const id = `${node.strand}|${node.column}`;
    node.row = cell.get(id) || 0;
    cell.set(id, node.row + 1);
  }
  let top = NODE.headH;
  const lanes = strands.map((strand) => {
    const rows = Math.max(1, ...placed.filter((n) => n.strand === strand).map((n) => n.row + 1));
    const height = rows * NODE.h + (rows - 1) * NODE.gapY + 2 * NODE.lanePad;
    const lane = { strand, top, height, rows };
    top += height + 8;
    return lane;
  });
  for (const node of placed) {
    const lane = lanes.find((l) => l.strand === node.strand);
    node.x = NODE.labelW + node.column * (NODE.w + NODE.gapX);
    node.y = lane.top + NODE.lanePad + node.row * (NODE.h + NODE.gapY);
  }
  const uniqueEdges = [...new Map(edges.map((e) => [`${e.from}>${e.to}`, e])).values()].filter(
    (e) => placed.some((n) => n.key === e.from) && placed.some((n) => n.key === e.to),
  );
  return {
    nodes: placed,
    lanes,
    edges: uniqueEdges,
    columns: nextCol + 1,
    width: NODE.labelW + (nextCol + 1) * NODE.w + nextCol * NODE.gapX + 16,
    height: top,
  };
}

const edgePath = (a, b) => {
  const x1 = a.x + NODE.w,
    y1 = a.y + NODE.h / 2,
    x2 = b.x,
    y2 = b.y + NODE.h / 2,
    mid = (x1 + x2) / 2;
  return `M${x1} ${y1}C${mid} ${y1} ${mid} ${y2} ${x2} ${y2}`;
};

function nodeHtml(node, signal, relations) {
  const off = node.kind !== "grade";
  const builds = relations.before.length
    ? t("Builds on: {list}", { list: relations.before.join(", ") })
    : "";
  const leads = relations.after.length
    ? t("Leads to: {list}", { list: relations.after.join(", ") })
    : "";
  const label = [
    t(node.skill.title),
    off ? t("Grade {n}", { n: node.skill.grade }) : "",
    node.skill.strand,
    stateLabel(signal.state),
    signal.score == null
      ? t("No score yet.")
      : t("Mastery score {score} out of 100.", { score: signal.score }),
    builds,
    leads,
  ]
    .filter(Boolean)
    .join(". ");
  const mode = signal.state === "new" ? "visual" : "adaptive";
  return `<button type="button" class="fl4-node" data-key="${node.key}" data-kind="${node.kind}" data-state="${signal.state}" data-open-key="${node.key}" data-open-mode="${mode}" aria-label="${escapeHtml(label)}" tabindex="-1" style="--x:${node.x}px;--y:${node.y - 0}px">
    ${masteryRing(signal, { size: 44, word: false })}
    <span class="fl4-node__text">${off ? `<span class="fl4-node__grade">${escapeHtml(t("Grade {n}", { n: node.skill.grade }))}</span>` : ""}<span class="fl4-node__title">${escapeHtml(t(node.skill.title))}</span>
      <span class="fl4-node__state">${stateGlyph(signal.state, 14)}${escapeHtml(stateLabel(signal.state))}</span>${builds ? `<span class="fl4-node__rel">${escapeHtml(builds)}</span>` : ""}</span></button>`;
}

const LEGEND_STATES = ["new", "learning", "developing", "proficient", "mastered"];

export function skillMapHtml(grade, tutor, now = Date.now(), id = "fl4-map") {
  const map = layoutSkillMap(grade);
  const signals = new Map(map.nodes.map((n) => [n.key, skillSignals(tutor, n.skill, now)]));
  const title = (key) => t(findSkill(key).title);
  const relations = (key) => ({
    before: (prerequisiteGraph[key]?.prerequisiteSkills || [])
      .filter((k) => findSkill(k))
      .map(title),
    after: (prerequisiteGraph[key]?.enrichmentSkills || []).filter((k) => findSkill(k)).map(title),
  });
  const byKey = new Map(map.nodes.map((n) => [n.key, n]));
  const marker = `${id}-arrow`;
  const edges = map.edges
    .map((e) => {
      const unlocked = STRONG.has(signals.get(e.from)?.state);
      return `<path class="fl4-edge" data-from="${e.from}" data-to="${e.to}" data-unlocked="${unlocked}" d="${edgePath(byKey.get(e.from), byKey.get(e.to))}" marker-end="url(#${marker})"/>`;
    })
    .join("");
  const heads = [
    [0, t("Earlier grades")],
    [1, t("Grade {n}", { n: grade })],
    [map.columns - 1, t("Next grade")],
  ];
  const lanes = map.lanes
    .map((lane, index) => {
      const nodes = map.nodes
        .filter((n) => n.strand === lane.strand)
        .sort((a, b) => a.column - b.column || a.row - b.row);
      return `<div class="fl4-lane" role="group" aria-labelledby="${id}-lane-${index}" style="--top:${lane.top}px;--h:${lane.height}px">
      <h3 class="fl4-lane__label" id="${id}-lane-${index}">${escapeHtml(t(lane.strand))}</h3>${nodes.map((n) => nodeHtml(n, signals.get(n.key), relations(n.key))).join("")}</div>`;
    })
    .join("");
  return `<div class="fl4-map" id="${id}" style="--w:${map.width}px;--h:${map.height}px">
    <p class="fl4-map__help" id="${id}-help">${escapeHtml(t("Use the arrow keys to move between skills. Press Enter to open one."))}</p>
    <ul class="fl4-legend" aria-label="${escapeHtml(t("How to read the map"))}">${LEGEND_STATES.map((s) => `<li data-state="${s}">${stateGlyph(s)}<span>${escapeHtml(stateLabel(s))}</span></li>`).join("")}
      <li class="fl4-legend__edge"><svg viewBox="0 0 32 8" width="32" height="8" aria-hidden="true"><path d="M1 4H31" class="fl4-edge" data-unlocked="true"/></svg><span>${escapeHtml(t("Builds on a strong skill"))}</span></li>
      <li class="fl4-legend__edge"><svg viewBox="0 0 32 8" width="32" height="8" aria-hidden="true"><path d="M1 4H31" class="fl4-edge" data-unlocked="false"/></svg><span>${escapeHtml(t("Builds on a skill still growing"))}</span></li></ul>
    <div class="fl4-map__scroll"><div class="fl4-map__canvas" role="group" aria-label="${escapeHtml(t("Skill map for Grade {n}", { n: grade }))}" aria-describedby="${id}-help">
      <div class="fl4-map__heads" aria-hidden="true">${heads.map(([column, text]) => `<span style="--x:${NODE.labelW + column * (NODE.w + NODE.gapX)}px">${escapeHtml(text)}</span>`).join("")}</div>
      ${lanes}
      <svg class="fl4-map__edges" viewBox="0 0 ${map.width} ${map.height}" aria-hidden="true" focusable="false"><defs><marker id="${marker}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0L10 5L0 10z" class="fl4-edge__head"/></marker></defs>${edges}</svg></div></div></div>`;
}

// Roving focus and arrow-key movement by on-screen geometry, so the same code serves the lane layout and the
// stacked list used on phones.
function neighbour(current, nodes, key) {
  const here = current.getBoundingClientRect();
  const centre = (r) => [r.left + r.width / 2, r.top + r.height / 2];
  const [cx, cy] = centre(here);
  const horizontal = key === "ArrowRight" || key === "ArrowLeft";
  const sign = key === "ArrowRight" || key === "ArrowDown" ? 1 : -1;
  let best = null;
  for (const node of nodes) {
    if (node === current) continue;
    const [x, y] = centre(node.getBoundingClientRect());
    const main = (horizontal ? x - cx : y - cy) * sign;
    const cross = Math.abs(horizontal ? y - cy : x - cx);
    if (main <= 4) continue;
    const score = main + cross * 3;
    if (!best || score < best.score) best = { node, score };
  }
  return best?.node || null;
}

export function mountSkillMap(host, { grade, tutor, now = Date.now(), id = "fl4-map" } = {}) {
  host.innerHTML = skillMapHtml(grade, tutor, now, id);
  const nodes = [...host.querySelectorAll(".fl4-node")];
  const edges = [...host.querySelectorAll("path.fl4-edge[data-from]")];
  const focusNode = (node, move = true) => {
    for (const other of nodes) other.tabIndex = other === node ? 0 : -1;
    if (move) node.focus();
  };
  const light = (node) => {
    const key = node?.dataset.key;
    const related = new Set([key]);
    for (const edge of edges) {
      const hit = key && (edge.dataset.from === key || edge.dataset.to === key);
      edge.toggleAttribute("data-active", Boolean(hit));
      if (hit) {
        related.add(edge.dataset.from);
        related.add(edge.dataset.to);
      }
    }
    for (const other of nodes)
      other.toggleAttribute("data-related", related.has(other.dataset.key) && other !== node);
  };
  const first =
    nodes.find((node) => node.dataset.kind === "grade" && node.dataset.state !== "mastered") ||
    nodes[0];
  if (first) focusNode(first, false);
  host.addEventListener("focusin", (event) => {
    const node = event.target.closest?.(".fl4-node");
    if (!node) return;
    focusNode(node, false);
    light(node);
  });
  host.addEventListener("focusout", (event) => {
    if (!host.contains(event.relatedTarget)) light(null);
  });
  host.addEventListener("mouseover", (event) =>
    light(
      event.target.closest?.(".fl4-node") || document.activeElement?.closest?.(".fl4-node") || null,
    ),
  );
  host.addEventListener("keydown", (event) => {
    const node = event.target.closest?.(".fl4-node");
    if (!node) return;
    let next = null;
    if (event.key === "Home") next = nodes[0];
    else if (event.key === "End") next = nodes.at(-1);
    else if (["ArrowRight", "ArrowLeft", "ArrowDown", "ArrowUp"].includes(event.key))
      next = neighbour(node, nodes, event.key);
    else return;
    event.preventDefault();
    if (next) focusNode(next);
  });
  return () => {
    host.replaceChildren();
  };
}
