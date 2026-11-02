const SVG_NS = "http://www.w3.org/2000/svg";
const STYLE_ID = "ewl-prerequisite-map-styles";
let renderSequence = 0;

const STYLES = `
.ewl-prereq-map{--pm-ink:#19324d;--pm-muted:#53677d;--pm-edge:#9aaec1;--pm-prereq:#177e89;--pm-enrich:#9c5f19;color:var(--pm-ink);font:inherit}
.ewl-prereq-map__scroll{overflow:auto;max-width:100%;border:1px solid #d7e1eb;border-radius:12px;background:#f8fbff;overscroll-behavior-inline:contain}
.ewl-prereq-map svg{display:block;width:100%;min-width:820px;height:auto}.ewl-prereq-map__edge{fill:none;stroke:var(--pm-edge);stroke-width:1.8;opacity:.72}.ewl-prereq-map__edge--prerequisite{stroke:var(--pm-prereq);stroke-width:2.2}.ewl-prereq-map__edge--enrichment{stroke:var(--pm-enrich);stroke-dasharray:5 4}
.ewl-prereq-map__grade{font-size:13px;font-weight:800;fill:var(--pm-muted)}.ewl-prereq-map__node{cursor:pointer;outline:none}.ewl-prereq-map__node rect{fill:#fff;stroke:#9fb3c7;stroke-width:1.5;transition:stroke .18s ease,fill .18s ease}.ewl-prereq-map__node text{font-family:inherit;font-size:11px;font-weight:600;fill:var(--pm-ink);pointer-events:none}.ewl-prereq-map__node--selected rect{fill:#fff1bd;stroke:#9a6d00;stroke-width:3}.ewl-prereq-map__node--related rect{fill:#e7f5f5;stroke:var(--pm-prereq);stroke-width:2}.ewl-prereq-map__node:focus rect,.ewl-prereq-map__node:hover rect{stroke:#145b85;stroke-width:3}.ewl-prereq-map__node--dim{opacity:.48}.ewl-prereq-map__legend{display:flex;flex-wrap:wrap;gap:.5rem 1.2rem;margin:.55rem 0;color:var(--pm-muted);font-size:.9rem}.ewl-prereq-map__legend span{display:inline-flex;align-items:center;gap:.4rem}.ewl-prereq-map__swatch{width:1.3rem;border-top:3px solid var(--pm-prereq)}.ewl-prereq-map__swatch--enrichment{border-top:2px dashed var(--pm-enrich)}
@media(prefers-reduced-motion:reduce){.ewl-prereq-map *{scroll-behavior:auto!important;transition:none!important}}
`;

function svg(document, tag, attrs = {}, label) {
  const element = document.createElementNS(SVG_NS, tag);
  Object.entries(attrs).forEach(([key, value]) => element.setAttribute(key, String(value)));
  if (label !== undefined) element.textContent = String(label);
  return element;
}

function ensureStyles(document) {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = STYLES;
  document.head?.append(style);
}

const skillKey = (skill) => String(skill.key || skill.skillKey || `${skill.grade}:${skill.id}`);
const idFor = (key) => `pm-${String(key).replace(/[^a-zA-Z0-9_-]/g, "-")}`;
const edgeKey = (from, to) => `${from}\u0000${to}`;

function normalizeGraph(skills, edgeData) {
  const nodes = (Array.isArray(skills) ? skills : []).filter((skill) => skill && Number(skill.grade) >= 1 && Number(skill.grade) <= 8 && skill.id != null).map((skill) => ({ ...skill, grade: Number(skill.grade), key: skillKey(skill) }));
  const keys = new Set(nodes.map((node) => node.key));
  const edges = new Map();
  const add = (from, to, type) => {
    const normalizedType = type === "enrichment" ? "enrichment" : "prerequisite";
    if (!keys.has(from) || !keys.has(to) || from === to) return;
    const key = edgeKey(from, to);
    const current = edges.get(key);
    if (!current || normalizedType === "prerequisite") edges.set(key, { from, to, type: normalizedType });
  };
  for (const node of nodes) {
    for (const prerequisite of node.prerequisiteSkills || []) add(String(prerequisite), node.key, "prerequisite");
    for (const enrichment of node.enrichmentSkills || []) add(node.key, String(enrichment), "enrichment");
  }
  if (Array.isArray(edgeData)) {
    for (const edge of edgeData) add(String(edge.from ?? edge.source ?? ""), String(edge.to ?? edge.target ?? ""), edge.type);
  } else if (edgeData && typeof edgeData === "object") {
    for (const [key, relations] of Object.entries(edgeData)) {
      for (const prerequisite of relations?.prerequisiteSkills || []) add(String(prerequisite), key, "prerequisite");
      for (const enrichment of relations?.enrichmentSkills || []) add(key, String(enrichment), "enrichment");
    }
  }
  return { nodes, edges: [...edges.values()] };
}

function relationKeys(node, edges) {
  const prereqs = edges.filter((edge) => edge.to === node.key && edge.type === "prerequisite").map((edge) => edge.from);
  const enrichment = edges.filter((edge) => edge.from === node.key && edge.type === "enrichment").map((edge) => edge.to);
  // Directed prerequisite edges also point from foundation to target, so provide the inverse next-skill list as enrichment.
  const unlocks = edges.filter((edge) => edge.from === node.key && edge.type === "prerequisite").map((edge) => edge.to);
  return { prereqs, enrichment: [...new Set([...enrichment, ...unlocks])] };
}

function shortenedTitle(title, max = 19) {
  const value = String(title || "Untitled skill");
  return value.length > max ? `${value.slice(0, max - 1)}…` : value;
}

/**
 * Render a keyboard-accessible Grade 1–8 prerequisite constellation.
 * @param {Element} container Target DOM element.
 * @param {Array<object>|object} skillsOrOptions Skill nodes or {skills, edges, selectedGrade, onOpenSkill}.
 * @param {object|Array<object>} edgeData Edges array / edge map when skills are passed separately.
 * @param {object} options selectedGrade, onOpenSkill, and localized labels.
 * @returns {() => void} Cleanup function.
 */
export function renderPrerequisiteMap(container, skillsOrOptions, edgeData = {}, options = {}) {
  if (!container?.ownerDocument) throw new TypeError("A DOM container is required.");
  const config = Array.isArray(skillsOrOptions)
    ? { ...options, skills: skillsOrOptions, edges: edgeData }
    : { ...(skillsOrOptions || {}) };
  const { nodes, edges } = normalizeGraph(config.skills, config.edges || {});
  if (!nodes.length) throw new TypeError("At least one Grade 1–8 skill node is required.");
  const document = container.ownerDocument;
  ensureStyles(document);
  const language = config.language === "es" ? "es" : "en";
  const strings = language === "es"
    ? { title: "Mapa de habilidades", description: "Explora cómo se conectan las habilidades. Usa Tab para recorrerlas y Enter o Espacio para abrir una habilidad.", grade: (n) => `Grado ${n}`, prerequisite: "Habilidad previa", enrichment: "Habilidad siguiente", relationBefore: "Requiere", relationAfter: "Prepara para", selected: "seleccionada" }
    : { title: "Skill constellation", description: "Explore how skills connect. Use Tab to move through skills and Enter or Space to open one.", grade: (n) => `Grade ${n}`, prerequisite: "Prerequisite skill", enrichment: "Next skill", relationBefore: "Requires", relationAfter: "Builds toward", selected: "selected" };
  const selectedGrade = Number(config.selectedGrade) >= 1 && Number(config.selectedGrade) <= 8 ? Number(config.selectedGrade) : null;
  const sequence = ++renderSequence;
  const wrapper = document.createElement("section");
  wrapper.className = "ewl-prereq-map";
  wrapper.setAttribute("aria-label", strings.title);
  wrapper.append(Object.assign(document.createElement("h3"), { textContent: strings.title }));
  wrapper.append(Object.assign(document.createElement("p"), { textContent: strings.description }));

  const legend = document.createElement("div");
  legend.className = "ewl-prereq-map__legend";
  legend.setAttribute("aria-label", language === "es" ? "Leyenda de conexiones" : "Connection legend");
  const legendEntry = (label, extra = "") => {
    const entry = document.createElement("span");
    const line = document.createElement("i");
    line.className = `ewl-prereq-map__swatch${extra}`;
    line.setAttribute("aria-hidden", "true");
    entry.append(line, document.createTextNode(label));
    return entry;
  };
  legend.append(legendEntry(strings.prerequisite), legendEntry(strings.enrichment, " ewl-prereq-map__swatch--enrichment"));
  wrapper.append(legend);

  const gradeOrder = [...new Set(nodes.map((node) => node.grade))].sort((a, b) => a - b);
  const grouped = new Map(gradeOrder.map((grade) => [grade, nodes.filter((node) => node.grade === grade).sort((a, b) => String(a.title).localeCompare(String(b.title)) || a.key.localeCompare(b.key))]));
  const colGap = 152, rowGap = 62, nodeWidth = 132, nodeHeight = 44, padX = 48, padY = 42;
  const maxRows = Math.max(...[...grouped.values()].map((group) => group.length));
  const width = padX * 2 + Math.max(0, gradeOrder.length - 1) * colGap + nodeWidth;
  const height = padY * 2 + 28 + Math.max(0, maxRows - 1) * rowGap + nodeHeight;
  const positions = new Map();
  gradeOrder.forEach((grade, gradeIndex) => grouped.get(grade).forEach((node, rowIndex) => {
    positions.set(node.key, { x: padX + gradeIndex * colGap, y: padY + 28 + rowIndex * rowGap, node });
  }));
  const svgRoot = svg(document, "svg", { viewBox: `0 0 ${width} ${height}`, role: "group", "aria-labelledby": `pm-title-${sequence} pm-desc-${sequence}` });
  svgRoot.append(svg(document, "title", { id: `pm-title-${sequence}` }, strings.title));
  svgRoot.append(svg(document, "desc", { id: `pm-desc-${sequence}` }, strings.description));
  const defs = svg(document, "defs");
  const marker = svg(document, "marker", { id: `pm-arrow-${sequence}`, viewBox: "0 0 10 10", refX: 8, refY: 5, markerWidth: 6, markerHeight: 6, orient: "auto-start-reverse" });
  marker.append(svg(document, "path", { d: "M 0 0 L 10 5 L 0 10 z", fill: "#557386" }));
  defs.append(marker);
  svgRoot.append(defs);

  for (const grade of gradeOrder) {
    const first = positions.get(grouped.get(grade)[0].key);
    svgRoot.append(svg(document, "text", { x: first.x + nodeWidth / 2, y: 22, "text-anchor": "middle", class: "ewl-prereq-map__grade" }, strings.grade(grade)));
  }
  const edgeLayer = svg(document, "g", { "aria-hidden": "true" });
  for (const edge of edges) {
    const from = positions.get(edge.from), to = positions.get(edge.to);
    if (!from || !to) continue;
    const startX = from.x + nodeWidth, startY = from.y + nodeHeight / 2;
    const endX = to.x, endY = to.y + nodeHeight / 2;
    const midX = (startX + endX) / 2;
    const relationClass = edge.type === "enrichment" ? "enrichment" : "prerequisite";
    edgeLayer.append(svg(document, "path", {
      d: `M ${startX} ${startY} C ${midX} ${startY}, ${midX} ${endY}, ${endX} ${endY}`,
      class: `ewl-prereq-map__edge ewl-prereq-map__edge--${relationClass}`,
      "data-from": edge.from,
      "data-to": edge.to,
      "data-relation": relationClass,
      "marker-end": `url(#pm-arrow-${sequence})`,
    }));
  }
  svgRoot.append(edgeLayer);

  const connectedToSelected = new Set();
  if (selectedGrade != null) {
    const selected = nodes.filter((node) => node.grade === selectedGrade);
    for (const node of selected) {
      connectedToSelected.add(node.key);
      for (const edge of edges) if (edge.from === node.key) connectedToSelected.add(edge.to); else if (edge.to === node.key) connectedToSelected.add(edge.from);
    }
  }
  for (const node of nodes) {
    const point = positions.get(node.key);
    const relations = relationKeys(node, edges);
    const prereqTitles = relations.prereqs.map((key) => nodes.find((entry) => entry.key === key)?.title).filter(Boolean);
    const enrichmentTitles = relations.enrichment.map((key) => nodes.find((entry) => entry.key === key)?.title).filter(Boolean);
    const context = [
      `${strings.grade(node.grade)}: ${node.title}`,
      prereqTitles.length ? `${strings.relationBefore}: ${prereqTitles.join(", ")}` : "",
      enrichmentTitles.length ? `${strings.relationAfter}: ${enrichmentTitles.join(", ")}` : "",
      selectedGrade === node.grade ? strings.selected : "",
    ].filter(Boolean).join(". ");
    const group = svg(document, "g", {
      id: idFor(node.key),
      class: ["ewl-prereq-map__node", selectedGrade === node.grade ? "ewl-prereq-map__node--selected" : "", selectedGrade != null && connectedToSelected.has(node.key) && node.grade !== selectedGrade ? "ewl-prereq-map__node--related" : "", selectedGrade != null && !connectedToSelected.has(node.key) && node.grade !== selectedGrade ? "ewl-prereq-map__node--dim" : ""].filter(Boolean).join(" "),
      role: "button",
      tabindex: "0",
      "aria-label": context,
      ...(selectedGrade === node.grade ? { "aria-current": "true" } : {}),
      "data-open-key": node.key,
      "data-grade": node.grade,
      "data-prerequisites": relations.prereqs.join(" "),
      "data-enrichment": relations.enrichment.join(" "),
    });
    group.append(svg(document, "title", {}, context));
    group.append(svg(document, "rect", { x: point.x, y: point.y, width: nodeWidth, height: nodeHeight, rx: 10 }));
    group.append(svg(document, "text", { x: point.x + nodeWidth / 2, y: point.y + 18, "text-anchor": "middle" }, shortenedTitle(node.title)));
    group.append(svg(document, "text", { x: point.x + nodeWidth / 2, y: point.y + 34, "text-anchor": "middle", "font-size": 9 }, `${node.grade}:${node.id}`));
    const activate = () => {
      if (typeof config.onOpenSkill === "function") config.onOpenSkill(node.key, node);
      container.dispatchEvent(new document.defaultView.CustomEvent("fluency:open-skill", { bubbles: true, detail: { key: node.key, skill: node } }));
    };
    group.addEventListener("click", activate);
    group.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") { event.preventDefault(); activate(); }
    });
    svgRoot.append(group);
  }
  const scroll = document.createElement("div");
  scroll.className = "ewl-prereq-map__scroll";
  scroll.setAttribute("role", "region");
  scroll.setAttribute("aria-label", language === "es" ? "Constelación de habilidades desplazable" : "Scrollable skill constellation");
  scroll.tabIndex = 0;
  scroll.append(svgRoot);
  wrapper.append(scroll);
  container.replaceChildren(wrapper);
  return () => { if (wrapper.parentNode === container) wrapper.remove(); };
}

export const mountPrerequisiteMap = renderPrerequisiteMap;
export default renderPrerequisiteMap;
