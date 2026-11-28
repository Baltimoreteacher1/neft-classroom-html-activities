// Math Literacy Studio (/math-literacy): a program for teachers, grades 1 to 8, where vocabulary, reading, writing, speaking and listening are
// taught inside the mathematics. Three doors on the landing page (Teach a Skill, Create a Resource, Support a Learner); everything else lives
// inside those workflows.
//
//   /math-literacy                       the three doors, search, where you left off
//   /math-literacy/teach[?grade=N]       grade, then skill
//   /math-literacy/skill/<id>            one skill: sequences and the whole resource collection
//   /math-literacy/create                skill, material, then the builder
//   /math-literacy/resource/<id>/<type>  builder: adjust, edit, preview, print or download (math-literacy-builder.js)
//   /math-literacy/support[?concern=]    learner-support navigator
//   /math-literacy/search?q=             search in teacher language
//   /math-literacy/progressions[/<id>]   how mathematical communication grows from grade 1 to 8
//   /math-literacy/collections           saved resources, collections, packets
//   /math-literacy/packet/<kind>/<id>    a collection or weekly packet for one skill
//   /math-literacy/learn|play|tool/...   student activities (math-literacy-play.js)
//   /math-literacy/family/<id>           family page in English and Spanish
//   /math-literacy/guide                 first-time guide and honest limits
//
// Everything is saved on this device only (accessPracticeLab:v1:mls). No account, no student data.
import { crumbsHTML, setComponentsI18n } from "../components.js";
import { i18nFor } from "../i18n.js";
import { BASE, announce, ensureStylesheet, html, icon, raw } from "../util.js";
import { loadAll, loadGrade, loadInventory, loadSkill } from "../mls/content.js";
import { navFor, CONCERNS, CONCERN_IDS } from "../mls/navigator.js";
import { SPANISH_NOTE, BANDS } from "../mls/lang.js";
import { buildResource, sequenceSteps } from "../mls/model.js";
import { ROLE_MAP, TYPE_LABEL, TYPE_META } from "../mls/roles.js";
import { optsFromParsed, parseQuery, searchResources } from "../mls/search.js";
import * as Store from "../mls/store.js";
import * as Builder from "./math-literacy-builder.js";
import * as Play from "./math-literacy-play.js";
import { generate } from "../mls/families.js";

export const ROOT = `${BASE}/math-literacy`;
// Skill ids contain a dot (g6.ratios). In a URL path the dot is written as a dash (g6-ratios) because many static servers read ".ratios" as a
// file extension; query parameters keep the dotted id.
const pathId = (seg) => (/^g[1-8]\.[a-z]+$/.test(seg) ? seg.replace(".", "-") : seg);
export const idFromPath = (seg) => (/^g[1-8]-[a-z]+$/.test(seg) ? seg.replace("-", ".") : seg);
export const mh = (p = "", q = null) => {
  const qs = q ? new URLSearchParams(Object.entries(q).filter(([, v]) => v !== "" && v != null && v !== false)).toString() : "";
  const path = p ? p.split("/").map(pathId).join("/") : "";
  return `${ROOT}${path ? `/${path}` : ""}${qs ? `?${qs}` : ""}`;
};
const param = (k) => new URLSearchParams(location.search).get(k) || "";
const SUPPORTS = [
  ["more", "More support", "Simpler wording, pictures, a word bank and a first step. The mathematics stays at grade level."],
  ["standard", "Standard", "Grade-level wording with sentence frames."],
  ["extension", "Extension", "Larger numbers or an extra step, precise language and reasoning."],
];
export const supportOf = () => (["more", "standard", "extension"].includes(param("support")) ? param("support") : ui.support);
const ui = { support: "standard", index: null, inv: null, q: "" };

const GRADE_NOTE = {
  1: "Counting, place value, adding and subtracting, time, shapes and stories.",
  2: "Place value, strategies, money and time, graphs, equal shares and multistep stories.",
  3: "Multiplication and division, fractions, number lines, area and perimeter.",
  4: "Multidigit operations, fraction equivalence and operations, decimals, angles, data.",
  5: "Decimals, fraction operations, expressions, volume, coordinate planes, modeling.",
  6: "Ratios and rates, percents, rational numbers, expressions and equations, statistics.",
  7: "Proportional relationships, percent applications, probability, sampling, arguments.",
  8: "Linear equations, systems, functions, exponents, transformations, the Pythagorean theorem.",
};
const TYPE_BLURB = {
  "lesson-guide": "Objectives, vocabulary, misconceptions, language demands and a full lesson.",
  "vocab-cards": "Pictures, examples, non-examples and Spanish cognates.",
  "guided-notes": "Notes that students complete while you model.",
  notebook: "A notebook page: notice, words, worked example, try it.",
  "reading-passage": "An original passage in two reading levels with the same mathematics.",
  organizer: "Take a word problem apart before solving.",
  poster: "A word wall page or a targets poster.",
  worksheet: "Practice with the scaffold level you choose.",
  "word-problems": "Read, picture, plan, solve, explain.",
  "task-cards": "Cards with a record sheet.",
  "vocab-practice": "Matching, cloze and everyday versus math meaning.",
  "game-sheet": "A printable matching game that rewards explaining.",
  "discussion-cards": "Which one doesn't belong, always/sometimes/never, notice and wonder, debate.",
  "speaking-task": "Partner talk with stems for the language band.",
  "listening-task": "Listen, answer and check the transcript.",
  "writing-task": "Because, but and so sentences, then an explanation.",
  "collab-activity": "Group roles, a task and a group decision.",
  "exit-ticket": "Three questions and a how-sure check.",
  "mini-assessment": "Eight items with a feedback guide, not a score.",
  "error-analysis": "Find the first wrong step, explain it, fix it.",
  "intervention-packet": "Diagnostic, prerequisite check and step-by-step practice.",
  "family-practice": "One page for home in English and Spanish.",
};
const GROUPS = [
  { id: "teach", title: "Teach", items: [["lesson-guide"], ["vocab-cards"], ["guided-notes"], ["reading-passage"], ["organizer", "anatomy"], ["notebook"], ["poster"]] },
  { id: "practice", title: "Practice", items: [["worksheet", "guided"], ["worksheet", "independent"], ["word-problems"], ["task-cards"], ["vocab-practice"], ["game-sheet"]] },
  { id: "talk", title: "Talk, listen and write", items: [["discussion-cards"], ["speaking-task"], ["listening-task"], ["writing-task"], ["collab-activity"]] },
  { id: "check", title: "Check and respond", items: [["exit-ticket"], ["mini-assessment"], ["error-analysis"], ["intervention-packet"], ["task-cards", "extension"]] },
  { id: "home", title: "At home", items: [["family-practice"]] },
];
const ENGINES = [
  ["reading-lab", "Reading Lab", "Read, find the question, highlight quantities, build a model, solve, explain, revise."],
  ["anatomy", "Word Problem Anatomy", "See what is happening, known, unknown and how quantities relate."],
  ["sentence-studio", "Sentence Studio", "Because, but and so sentences with scaffolds that fade."],
  ["translator", "Representation Translator", "Match a situation to its picture, table, graph or equation."],
  ["vocab-explorer", "Vocabulary Explorer", "Meaning, example, non-example, picture, sentence."],
  ["talk-studio", "Math Talk Studio", "Discussion prompts with stems for each language band."],
  ["listening-lab", "Listening Lab", "Listen to a situation or an explanation and respond."],
  ["error-detective", "Error Detective", "Find the first wrong step, explain it, fix it."],
  ["story-studio", "Story Studio", "A short story where your math choices move it forward."],
  ["modeling-workshop", "Modeling Workshop", "Make assumptions, build a model, test it, name its limits."],
  ["concept-comics", "Concept Comics", "Characters discuss an idea; you predict before they answer."],
  ["transfer-lab", "Language Transfer Lab", "See one relationship in different words and forms."],
];

// ---------------------------------------------------------------------------------------------------------------- data
async function loadIndex() {
  if (!ui.index) {
    const r = await fetch(`${BASE}/content/mls/index.json`, { cache: "no-cache" });
    if (!r.ok) throw new Error("mls index missing");
    ui.index = (await r.json()).skills;
  }
  return ui.index;
}
const skillFromIndex = (idx, id) => idx.find((s) => s.id === id);

// ---------------------------------------------------------------------------------------------------------------- pieces
function crumbs(I, ...trail) {
  const items = [[I.S("Lab", "Laboratorio"), `${BASE}/`], ["Math Literacy Studio", trail.length ? ROOT : null]];
  trail.forEach(([label, href]) => items.push([label, href || null]));
  return crumbsHTML(items, { i18n: I });
}
const backLink = (label = "Back to Math Literacy Studio", href = ROOT) => html`<p class="ml-back"><a class="btn small" href="${href}">${icon("arrow-left")} ${label}</a></p>`;
function resourceHref(skillId, type, variant = "", extra = {}) {
  return mh(`resource/${skillId}/${type}`, { variant, support: supportOf() === "standard" ? "" : supportOf(), ...extra });
}
function supportControl(name = "support") {
  const cur = supportOf();
  return html`<fieldset class="ml-support"><legend>How much support?</legend>
    <div class="ml-seg" role="radiogroup" aria-label="Support level">${SUPPORTS.map(([id, label, text]) => html`<label class="ml-seg-item"><input type="radio" name="${name}" value="${id}" data-ml-support ${cur === id ? raw("checked") : ""}> <span><strong>${label}</strong><span class="fine">${text}</span></span></label>`)}</div>
    <p class="fine">Language support and mathematics level are separate dials. Open "Adjust" on any resource to change them one at a time.</p></fieldset>`;
}
function resCard(skill, type, variant = "") {
  const label = variant === "guided" ? "Guided practice" : variant === "independent" ? "Independent practice" : variant === "extension" ? "Extension tasks" : variant === "anatomy" ? "Word problem anatomy" : TYPE_LABEL[type];
  const m = TYPE_META[type];
  return html`<li class="ml-res"><a class="ml-res-link" href="${resourceHref(skill.id, type, variant)}"><strong>${label}</strong><span class="fine">${TYPE_BLURB[type]}</span><span class="ml-meta">${m.minutes} min · ${m.format === "interactive" ? "print or interactive" : "print or edit"}</span></a></li>`;
}
function skillCard(s, extra = "") {
  return html`<li class="ml-skill"><a class="ml-skill-link" href="${mh(`skill/${s.id}`, { support: supportOf() === "standard" ? "" : supportOf() })}"><strong>${s.title}</strong><span class="fine">${s.domain}</span>${extra}</a></li>`;
}
async function recipeTitle(r) {
  try {
    const idx = await loadIndex();
    const s = skillFromIndex(idx, r.skillId);
    return `${s?.title || r.skillId}: ${TYPE_LABEL[r.type] || r.type}`;
  } catch {
    return `${r.skillId} ${r.type}`;
  }
}
const recipeHref = (r) => mh(`resource/${r.skillId}/${r.type}`, { ...(r.opts || {}), ...(r.opts?.pseed ? { pseed: JSON.stringify(r.opts.pseed) } : {}), variant: r.opts?.variant || "" });

// ---------------------------------------------------------------------------------------------------------------- landing
async function landing(ctx, I) {
  const idx = await loadIndex();
  const st = Store.load();
  const last = st.last;
  const recents = await Promise.all(st.recents.slice(0, 4).map(async (r) => ({ r, title: await recipeTitle(r) })));
  const q = ui.q;
  return html`${crumbs(I)}
    <header class="ml-hero panel">
      <p class="eyebrow">For teachers · Grades 1 to 8</p>
      <h1 tabindex="-1">Math Literacy Studio</h1>
      <p class="lead">Ready-to-use mathematics lessons and materials where vocabulary, reading, writing, speaking and listening are part of the math. Pick a skill, adjust the support, then print it, edit it or launch it. No account needed.</p>
      <form class="ml-search" role="search" data-ml-search><label for="ml-q">Search in your own words</label>
        <div class="ml-search-row"><input id="ml-q" type="search" name="q" value="${q}" placeholder="for example: sixth-grade ratio word problems for English learners" autocomplete="off"><button class="btn primary" type="submit">${icon("search")} Search</button></div></form>
    </header>
    <section class="ml-doors" aria-label="Start here">
      <a class="card ml-door" href="${mh("teach")}" data-focus-first>${icon("reading")}<strong>Teach a skill</strong><span>Choose a grade and a skill and get the whole collection: words, reading, practice, talk and checks.</span></a>
      <a class="card ml-door" href="${mh("create")}">${icon("writing")}<strong>Create a resource</strong><span>Choose a skill and a material, adjust a little, preview, then print or download.</span></a>
      <a class="card ml-door" href="${mh("support")}">${icon("help")}<strong>Support a learner</strong><span>Say what you notice. Get a quick check, resources and a short plan.</span></a>
    </section>
    ${last ? html`<section class="panel ml-resume"><h2>Continue where you left off</h2><p><a class="btn primary" href="${recipeHref(last)}">${icon("arrow-right")} ${await recipeTitle(last)}</a></p></section>` : ""}
    ${recents.length ? html`<section class="panel"><h2>Recent</h2><ul class="ml-list">${recents.map((x) => html`<li><a href="${recipeHref(x.r)}">${x.title}</a></li>`)}</ul></section>` : ""}
    ${st.saved.length ? html`<section class="panel"><h2>Saved</h2><ul class="ml-list">${st.saved.slice(0, 4).map((x) => html`<li><a href="${mh(`resource/${x.recipe.skillId}/${x.recipe.type}`, { saved: x.id })}">${x.name}</a></li>`)}</ul><p><a href="${mh("collections")}">All saved resources and collections</a></p></section>` : ""}
    ${st.favorites.length ? html`<section class="panel"><h2>Favorite skills</h2><ul class="ml-skills">${st.favorites.slice(0, 6).map((id) => skillFromIndex(idx, id)).filter(Boolean).map((s) => skillCard(s))}</ul></section>` : ""}
    <section class="panel"><h2>Browse by grade</h2><ul class="ml-grades">${[1, 2, 3, 4, 5, 6, 7, 8].map((g) => html`<li><a class="btn ml-grade" href="${mh("teach", { grade: g })}"><strong>Grade ${g}</strong><span class="fine">${idx.filter((s) => s.grade === g).length} skills</span></a></li>`)}</ul></section>
    <p class="ml-foot"><a href="${mh("guide")}">New here? A two-minute guide</a> · <a href="${mh("progressions")}">How math communication grows, grades 1 to 8</a> · <a href="${mh("collections")}">Saved resources and collections</a></p>`;
}

// ---------------------------------------------------------------------------------------------------------------- teach
async function teachPage(ctx, I) {
  const idx = await loadIndex();
  const g = Number(param("grade"));
  if (!(g >= 1 && g <= 8)) {
    return html`${crumbs(I, ["Teach a skill", null])}
      <header class="panel"><h1 tabindex="-1">Teach a skill</h1><p class="lead">Step 1 of 2: choose a grade.</p></header>
      <ul class="ml-grade-list">${[1, 2, 3, 4, 5, 6, 7, 8].map((n) => html`<li><a class="card ml-gradecard" href="${mh("teach", { grade: n })}"><strong>Grade ${n}</strong><span>${GRADE_NOTE[n]}</span><span class="fine">${idx.filter((s) => s.grade === n).length} skills</span></a></li>`)}</ul>`;
  }
  const skills = idx.filter((s) => s.grade === g);
  const domains = [...new Set(skills.map((s) => s.domain))];
  return html`${crumbs(I, ["Teach a skill", mh("teach")], [`Grade ${g}`, null])}
    <header class="panel"><h1 tabindex="-1">Grade ${g}: choose a skill</h1><p class="lead">${GRADE_NOTE[g]}</p>${supportControl()}</header>
    ${domains.map((d) => html`<section class="panel"><h2>${d}</h2><ul class="ml-skills">${skills.filter((s) => s.domain === d).map((s) => skillCard(s))}</ul></section>`)}
    ${backLink("Choose another grade", mh("teach"))}`;
}

// ---------------------------------------------------------------------------------------------------------------- skill
async function skillPage(ctx, I, id) {
  const skill = await loadSkill(id);
  if (!skill) return { title: "Skill not found", html: html`${crumbs(I, ["Skill not found", null])}<section class="panel"><h1>That skill is not in the studio</h1>${backLink("Choose a skill", mh("teach"))}</section>` };
  const fav = Store.isFavorite(id);
  const seqIds = ["warmup5", "routine10", "smallgroup15", "intervention20", "lesson", "multiday", "weekly"];
  const SEQ = { warmup5: "5-minute warm-up", routine10: "10-minute literacy routine", smallgroup15: "15-minute small group", intervention20: "20-minute intervention", lesson: "Full lesson", multiday: "Multiday sequence", weekly: "Weekly collection" };
  const pre = (skill.prereq || []).map((p) => p);
  return {
    title: `${skill.title} · Math Literacy Studio`,
    html: html`${crumbs(I, ["Teach a skill", mh("teach")], [`Grade ${skill.grade}`, mh("teach", { grade: skill.grade })], [skill.title, null])}
      <header class="panel ml-skillhead">
        <p class="eyebrow">Grade ${skill.grade} · ${skill.domain}</p>
        <h1 tabindex="-1">${skill.title}</h1>
        <p class="lead">${skill.objective}</p>
        <ul class="ml-criteria">${skill.successCriteria.map((c) => html`<li>${c}</li>`)}</ul>
        <p class="fine">Language objective: ${skill.languageObjective}</p>
        <p class="fine">Standards alignment (CCSS-M, ${skill.standards.version.replace(/\s*\(.*\)/, "")}): ${skill.standards.codes.join(", ")}. ${skill.standards.note}</p>
        <p><button type="button" class="btn small" data-ml-fav="${id}" aria-pressed="${fav}">${icon("star")} ${fav ? "Favorite skill" : "Add to favorites"}</button></p>
        ${supportControl()}
      </header>
      <section class="panel"><h2>How much time do you have?</h2>
        <ul class="ml-seqs">${seqIds.map((s) => html`<li><a class="ml-res-link" href="${mh(`resource/${id}/lesson-sequence`, { variant: s, support: supportOf() === "standard" ? "" : supportOf() })}"><strong>${SEQ[s]}</strong><span class="fine">${sequenceSteps(skill, s).reduce((a, x) => a + x.minutes, 0)} minutes · ${sequenceSteps(skill, s).length} step${sequenceSteps(skill, s).length > 1 ? "s" : ""}</span></a></li>`)}</ul>
        <p class="fine">Take any step on its own. You do not have to follow the whole sequence.</p></section>
      ${GROUPS.map((g) => html`<section class="panel"><h2>${g.title}</h2><ul class="ml-ress">${g.items.map(([t, v]) => resCard(skill, t, v || ""))}</ul>${g.id === "home" ? html`<p><a class="btn" href="${mh(`family/${id}`)}">${icon("home")} Open the family page (English and Spanish)</a></p>` : ""}</section>`)}
      <section class="panel"><h2>Interactive activities for students</h2>
        <p class="fine">Work on a device. Nothing is timed, answers are never shown after a wrong try, and no student data leaves the device.</p>
        <ul class="ml-ress">${ENGINES.map(([e, t, d]) => html`<li class="ml-res"><a class="ml-res-link" href="${mh(`learn/${id}/${e}`, { support: supportOf() === "standard" ? "" : supportOf() })}"><strong>${t}</strong><span class="fine">${d}</span></a></li>`)}</ul>
        <p><a class="btn" href="${mh(`tool/auto`, { skill: id })}">${icon("tools")} Open the manipulative for this skill</a> <a class="btn" href="${mh(`play/${id}/auto`)}">${icon("play")} Play a practice game</a></p></section>
      <section class="panel"><h2>Around this skill</h2>
        <ul class="ml-list"><li><a href="${mh("support", { skill: id })}">Support a learner with this skill</a></li>
          ${pre.length ? html`<li>Skills to check first: ${pre.map((p, i) => html`${i ? ", " : ""}<a href="${mh(`skill/${p}`)}">${p}</a>`)}</li>` : ""}
          <li><a href="${mh("progressions")}">How communication grows across grades</a></li>
          <li><a href="${mh("create", { grade: skill.grade, skill: id })}">Create a custom resource for this skill</a></li></ul></section>
      ${backLink("Choose another skill", mh("teach", { grade: skill.grade }))}`,
  };
}

// ---------------------------------------------------------------------------------------------------------------- create
async function createPage(ctx, I) {
  const idx = await loadIndex();
  const g = Number(param("grade")) || 0;
  const sk = param("skill");
  const gSkills = g ? idx.filter((s) => s.grade === g) : [];
  const chosen = sk ? skillFromIndex(idx, sk) : null;
  const types = Object.keys(TYPE_META);
  return html`${crumbs(I, ["Create a resource", null])}
    <header class="panel"><h1 tabindex="-1">Create a resource</h1><p class="lead">Three quick choices: a grade, a skill and a material. Then adjust and preview.</p></header>
    <section class="panel"><h2>1. Grade</h2><ul class="ml-grades">${[1, 2, 3, 4, 5, 6, 7, 8].map((n) => html`<li><a class="btn ml-grade" aria-current="${g === n ? "true" : "false"}" href="${mh("create", { grade: n, skill: chosen?.grade === n ? sk : "" })}"><strong>${n}</strong></a></li>`)}</ul></section>
    ${g ? html`<section class="panel"><h2>2. Skill</h2><ul class="ml-skills">${gSkills.map((s) => html`<li class="ml-skill"><a class="ml-skill-link" aria-current="${sk === s.id ? "true" : "false"}" href="${mh("create", { grade: g, skill: s.id })}"><strong>${s.title}</strong><span class="fine">${s.domain}</span></a></li>`)}</ul></section>` : ""}
    ${chosen ? html`<section class="panel"><h2>3. Material</h2>${supportControl()}<ul class="ml-ress">${types.map((t) => html`<li class="ml-res"><a class="ml-res-link" href="${resourceHref(sk, t)}"><strong>${TYPE_LABEL[t]}</strong><span class="fine">${TYPE_BLURB[t]}</span><span class="ml-meta">${TYPE_META[t].minutes} min</span></a></li>`)}</ul></section>` : ""}
    ${backLink()}`;
}

// ---------------------------------------------------------------------------------------------------------------- support
async function supportPage(ctx, I) {
  const idx = await loadIndex();
  const cid = param("concern");
  const g = Number(param("grade")) || 0;
  const sid = param("skill");
  const c = CONCERNS[cid];
  const skillSummary = sid ? skillFromIndex(idx, sid) : null;
  if (!c) {
    return html`${crumbs(I, ["Support a learner", null])}
      <header class="panel"><h1 tabindex="-1">Support a learner</h1><p class="lead">What are you noticing? Choose the closest one. You will get a quick check, resources and a short plan.</p>
        <p class="fine">These are teaching observations. They are not a medical, disability, psychological or language-proficiency diagnosis, and the studio does not label students.</p></header>
      <ul class="ml-concerns">${CONCERN_IDS.map((id) => html`<li><a class="card ml-concern" href="${mh("support", { concern: id, grade: g || "", skill: sid })}"><strong>${CONCERNS[id].title}</strong></a></li>`)}</ul>${backLink()}`;
  }
  if (!skillSummary) {
    const gg = g || 3;
    return html`${crumbs(I, ["Support a learner", mh("support")], [c.title, null])}
      <header class="panel"><h1 tabindex="-1">${c.title}</h1><p class="lead">${c.notice}</p></header>
      <section class="panel"><h2>Which skill is it about?</h2><ul class="ml-grades">${[1, 2, 3, 4, 5, 6, 7, 8].map((n) => html`<li><a class="btn ml-grade" aria-current="${gg === n ? "true" : "false"}" href="${mh("support", { concern: cid, grade: n })}"><strong>${n}</strong></a></li>`)}</ul>
        <ul class="ml-skills">${idx.filter((s) => s.grade === gg).map((s) => html`<li class="ml-skill"><a class="ml-skill-link" href="${mh("support", { concern: cid, grade: gg, skill: s.id })}"><strong>${s.title}</strong><span class="fine">${s.domain}</span></a></li>`)}</ul></section>${backLink("Choose a different concern", mh("support"))}`;
  }
  const skill = await loadSkill(sid);
  const plan = navFor(cid, skill);
  const seq = sequenceSteps(skill, plan.sequence);
  return html`${crumbs(I, ["Support a learner", mh("support")], [c.title, mh("support", { concern: cid, grade: skill.grade })], [skill.title, null])}
    <header class="panel"><p class="eyebrow">Grade ${skill.grade} · ${skill.title}</p><h1 tabindex="-1">${plan.title}</h1><p class="fine">${plan.note}</p></header>
    <section class="panel"><h2>1. What to look for</h2><p>${plan.notice}</p><h3>Barriers to investigate</h3><ul>${plan.barriers.map((b) => html`<li>${b}</li>`)}</ul></section>
    <section class="panel"><h2>2. A short check</h2><p>${plan.diagnostic}</p><p class="fine">Task from this skill: ${plan.diagnosticTask.prompt}</p><p class="fine">Look for: ${plan.diagnosticTask.lookFor.join("; ")}.</p><p class="fine">${plan.diagnosticTask.language}</p></section>
    <section class="panel"><h2>3. Resources</h2><ul class="ml-ress">${plan.resources.map((r) => html`<li class="ml-res"><a class="ml-res-link" href="${mh(`resource/${skill.id}/${r.type}`, { variant: r.variant, support: "more" })}"><strong>${r.label}</strong><span class="fine">${r.why}</span></a></li>`)}${plan.engine ? html`<li class="ml-res"><a class="ml-res-link" href="${mh(`learn/${skill.id}/${plan.engine}`)}"><strong>${ENGINES.find((e) => e[0] === plan.engine)?.[1]}</strong><span class="fine">Interactive activity for the student.</span></a></li>` : ""}</ul>
      <h3>Scaffolds</h3><ul>${plan.scaffolds.map((s) => html`<li>${s}</li>`)}</ul></section>
    <section class="panel"><h2>4. A short plan</h2><ol class="ml-steps">${seq.map((s) => html`<li><strong>${s.title}</strong> (${s.minutes} min): ${s.what}</li>`)}</ol><p><a class="btn" href="${mh(`resource/${skill.id}/lesson-sequence`, { variant: plan.sequence, support: "more" })}">Open this plan as a document</a></p></section>
    <section class="panel"><h2>5. Follow up and decide what to teach next</h2><p><strong>Follow-up:</strong> ${plan.followUp}</p><p><strong>Evidence to look for:</strong> ${plan.evidence}</p></section>
    ${backLink("Choose a different concern", mh("support"))}`;
}

// ---------------------------------------------------------------------------------------------------------------- search
async function searchPage(ctx, I) {
  const idx = await loadIndex();
  const q = param("q");
  ui.q = q;
  const f = { grade: Number(param("grade")) || 0, type: param("type"), purpose: param("purpose") };
  const r = q || f.grade || f.type ? searchResources(idx, q, f, 30) : { results: [], parsed: parseQuery(""), note: "" };
  const chips = [r.parsed.grade ? `Grade ${r.parsed.grade}` : "", ...r.parsed.types.map((t) => TYPE_LABEL[t]), r.parsed.support ? "More language support" : "", r.parsed.minutes ? `${r.parsed.minutes} minutes` : "", r.parsed.purpose === "intervene" ? "Intervention" : r.parsed.purpose === "extend" ? "Extension" : ""].filter(Boolean);
  const o = optsFromParsed(r.parsed);
  return html`${crumbs(I, ["Search", null])}
    <header class="panel"><h1 tabindex="-1">Search</h1>
      <form class="ml-search" role="search" data-ml-search><label for="ml-q">Search in your own words</label><div class="ml-search-row"><input id="ml-q" type="search" name="q" value="${q}" placeholder="for example: third-grade multiplication intervention"><button class="btn primary" type="submit">${icon("search")} Search</button></div></form>
      ${chips.length ? html`<p class="ml-chips" aria-label="What I understood">I understood: ${chips.map((c) => html`<span class="ml-chip">${c}</span>`)}</p>` : ""}
      <details class="ml-adv"><summary>Filters</summary><form data-ml-filter class="ml-filter"><label>Grade <select name="grade"><option value="">Any</option>${[1, 2, 3, 4, 5, 6, 7, 8].map((n) => html`<option value="${n}" ${f.grade === n ? raw("selected") : ""}>${n}</option>`)}</select></label>
        <label>Material <select name="type"><option value="">Any</option>${Object.keys(TYPE_META).map((t) => html`<option value="${t}" ${f.type === t ? raw("selected") : ""}>${TYPE_LABEL[t]}</option>`)}</select></label>
        <label>Purpose <select name="purpose"><option value="">Any</option>${[["teach", "Teach"], ["practice", "Practice"], ["discuss", "Discuss"], ["assess", "Assess"], ["intervene", "Intervene"], ["extend", "Extend"], ["family", "Family"]].map(([v, l]) => html`<option value="${v}" ${f.purpose === v ? raw("selected") : ""}>${l}</option>`)}</select></label>
        <button class="btn" type="submit">Apply</button></form></details></header>
    ${r.note ? html`<p class="panel ml-note" role="status">${r.note}</p>` : ""}
    ${q || f.grade || f.type ? (r.results.length ? html`<section class="panel"><h2>${r.results.length} resources</h2><ul class="ml-ress">${r.results.map((x) => html`<li class="ml-res"><a class="ml-res-link" href="${mh(`resource/${x.skill.id}/${x.type}`, { variant: x.variant, ...o })}"><strong>${TYPE_LABEL[x.type]}${x.variant === "extension" ? " (extension)" : ""}</strong><span class="fine">Grade ${x.skill.grade}: ${x.skill.title}</span><span class="ml-meta">${TYPE_META[x.type].minutes} min</span></a></li>`)}</ul></section>` : html`<section class="panel"><h2>No match</h2><p>Try a grade and a topic, like "fourth-grade fractions" or "second-grade vocabulary".</p></section>`) : html`<section class="panel"><h2>Try one of these</h2><ul class="ml-list">${["Sixth-grade ratio word problems for English learners", "Fourth-grade fractions with visual support", "Mathematical vocabulary for second grade", "Seventh-grade proportional reasoning speaking activity", "Eighth-grade slope writing task", "Third-grade multiplication intervention", "Five-minute math literacy warm-up"].map((e) => html`<li><a href="${mh("search", { q: e })}">${e}</a></li>`)}</ul></section>`}
    ${backLink()}`;
}

// ---------------------------------------------------------------------------------------------------------------- progressions
let progData = null;
async function progressionsPage(ctx, I, sub) {
  if (!progData) progData = await (await fetch(`${BASE}/content/mls/progressions.json`, { cache: "no-cache" })).json();
  const st = progData.strands.find((s) => s.id === sub);
  if (!st) {
    return html`${crumbs(I, ["Progressions", null])}
      <header class="panel"><h1 tabindex="-1">How math communication grows</h1><p class="lead">Choose a strand to see what students can do at each grade, and where to find it in the studio. ${progData.note}</p></header>
      <ul class="ml-concerns">${progData.strands.map((s) => html`<li><a class="card ml-concern" href="${mh(`progressions/${s.id}`)}"><strong>${s.title}</strong><span class="fine">${s.about}</span></a></li>`)}</ul>${backLink()}`;
  }
  const g = Number(param("grade")) || 0;
  return html`${crumbs(I, ["Progressions", mh("progressions")], [st.title, null])}
    <header class="panel"><h1 tabindex="-1">${st.title}</h1><p class="lead">${st.about}</p>
      <p class="fine">Pick a grade to read the earlier steps: they are the literacy demands a student may need, without repeating a lower grade's whole unit.</p></header>
    <section class="panel"><ol class="ml-prog">${st.grades.map((x) => html`<li ${g === x.grade ? raw('class="is-here"') : ""}><strong>Grade ${x.grade}</strong><span>${x.statement}</span><a href="${mh(`skill/${x.skill}`)}">See it in a skill</a></li>`)}</ol></section>
    <nav class="panel" aria-label="Other strands"><h2>Other strands</h2><ul class="ml-list">${progData.strands.filter((s) => s.id !== st.id).map((s) => html`<li><a href="${mh(`progressions/${s.id}`)}">${s.title}</a></li>`)}</ul></nav>${backLink("All progressions", mh("progressions"))}`;
}

// ---------------------------------------------------------------------------------------------------------------- collections and packets
export const PREBUILT = {
  warmups: { title: "Mathematical literacy warm-ups", recipes: [["discussion-cards"], ["vocab-cards"], ["task-cards"]] },
  newcomer: { title: "Newcomer mathematics support", recipes: [["vocab-cards"], ["reading-passage"], ["speaking-task"], ["listening-task"], ["word-problems"]], opts: { support: "more", band: "1-2" } },
  discourse: { title: "Mathematical discourse routines", recipes: [["discussion-cards"], ["speaking-task"], ["collab-activity"]] },
  "wp-reading": { title: "Word-problem reading strategies", recipes: [["organizer", "anatomy"], ["word-problems"], ["reading-passage"]] },
  writing: { title: "Writing in mathematics", recipes: [["writing-task"], ["error-analysis"], ["exit-ticket"]] },
  intervention: { title: "Mathematics intervention", recipes: [["intervention-packet"], ["worksheet", "guided"], ["exit-ticket"]], opts: { support: "more" } },
  visual: { title: "Visual mathematics", recipes: [["vocab-cards"], ["guided-notes"], ["task-cards"], ["game-sheet"]], opts: { visuals: "more" } },
  assessment: { title: "Assessment and feedback", recipes: [["exit-ticket"], ["mini-assessment"], ["error-analysis"]] },
  family: { title: "Family mathematical literacy", recipes: [["family-practice"], ["vocab-cards"]] },
  "prereq-review": { title: "Cross-grade prerequisite review", recipes: [["organizer", "prereqs"], ["intervention-packet"]] },
  weekly: { title: "Weekly mathematical literacy collection", recipes: [["vocab-practice"], ["reading-passage"], ["discussion-cards"], ["writing-task"], ["mini-assessment"]] },
};
async function collectionsPage(ctx, I) {
  const st = Store.load();
  const idx = await loadIndex();
  const g = Number(param("grade")) || 0;
  const sid = param("skill");
  return html`${crumbs(I, ["Saved and collections", null])}
    <header class="panel"><h1 tabindex="-1">Saved resources and collections</h1><p class="lead">Everything here is saved on this device. It holds your choices, not student information.</p></header>
    <section class="panel"><h2>Saved resources</h2>${st.saved.length ? html`<ul class="ml-list ml-saved">${st.saved.map((x) => html`<li><a href="${mh(`resource/${x.recipe.skillId}/${x.recipe.type}`, { saved: x.id })}">${x.name}</a> <button class="btn small" type="button" data-ml-dup="${x.id}">Duplicate</button> <button class="btn small" type="button" data-ml-del="${x.id}">Delete</button> ${st.collections.length ? html`<label class="fine">Add to <select data-ml-addcol="${x.id}"><option value="">choose...</option>${st.collections.map((c) => html`<option value="${c.id}">${c.name}</option>`)}</select></label>` : ""}</li>`)}</ul>` : html`<p>Nothing saved yet. Open any resource and choose Save.</p>`}</section>
    <section class="panel"><h2>My collections</h2><form data-ml-newcol class="ml-inline"><label>New collection <input name="name" required placeholder="for example, Week of Oct 6"></label> <button class="btn" type="submit">Create</button></form>
      ${st.collections.map((c) => html`<div class="ml-collection"><h3>${c.name}</h3><ul class="ml-list">${c.items.map((id) => st.saved.find((x) => x.id === id)).filter(Boolean).map((x) => html`<li><a href="${mh(`resource/${x.recipe.skillId}/${x.recipe.type}`, { saved: x.id })}">${x.name}</a> <button class="btn small" type="button" data-ml-rmcol="${c.id}:${x.id}">Remove</button></li>`)}</ul>${c.items.length ? html`<p><a class="btn" href="${mh(`packet/saved-${c.id}/mine`)}">Download as one packet</a></p>` : html`<p class="fine">Empty. Use "Add to" on a saved resource.</p>`} <button class="btn small" type="button" data-ml-delcol="${c.id}">Delete collection</button></div>`)}</section>
    <section class="panel"><h2>Ready-made collections</h2><p class="fine">Choose a skill, then open a collection as one packet.</p>
      <div class="ml-collections-pick"><ul class="ml-grades">${[1, 2, 3, 4, 5, 6, 7, 8].map((n) => html`<li><a class="btn ml-grade" aria-current="${g === n ? "true" : "false"}" href="${mh("collections", { grade: n })}"><strong>${n}</strong></a></li>`)}</ul>
      ${g ? html`<ul class="ml-skills">${idx.filter((s) => s.grade === g).map((s) => html`<li class="ml-skill"><a class="ml-skill-link" aria-current="${sid === s.id ? "true" : "false"}" href="${mh("collections", { grade: g, skill: s.id })}"><strong>${s.title}</strong></a></li>`)}</ul>` : ""}</div>
      ${sid ? html`<ul class="ml-ress">${Object.entries(PREBUILT).map(([id, c]) => html`<li class="ml-res"><a class="ml-res-link" href="${mh(`packet/${id}/${sid}`)}"><strong>${c.title}</strong><span class="fine">${c.recipes.map(([t, v]) => (v === "guided" ? "Guided practice" : v === "anatomy" ? "Word problem anatomy" : v === "prereqs" ? "Skills to check first" : TYPE_LABEL[t])).join(" · ")}</span></a></li>`)}</ul>` : html`<p class="fine">Pick a grade and a skill above.</p>`}</section>${backLink()}`;
}

// ---------------------------------------------------------------------------------------------------------------- guide
function guidePage(I) {
  Store.markSeen();
  return html`${crumbs(I, ["Guide", null])}
    <header class="panel"><h1 tabindex="-1">A two-minute guide</h1><p class="lead">Math Literacy Studio helps you teach a math skill while students learn the words, reading, writing, speaking and listening the skill needs.</p></header>
    <section class="panel"><h2>Three ways in</h2><ol><li><strong>Teach a skill.</strong> Pick a grade and a skill. You see the whole collection: a teacher guide, vocabulary, reading, practice, talk, writing, checks, and interactive activities.</li>
      <li><strong>Create a resource.</strong> Pick a skill and a material. Adjust a little. Preview, edit a question, print or download.</li>
      <li><strong>Support a learner.</strong> Say what you notice (for example, "can calculate but cannot explain"). You get a quick check, resources and a short plan.</li></ol></section>
    <section class="panel"><h2>Three support levels</h2><ul><li><strong>More support:</strong> simpler wording, pictures, a word bank and a first step shown. The mathematics stays at grade level.</li><li><strong>Standard:</strong> grade-level wording with sentence frames.</li><li><strong>Extension:</strong> larger numbers or an extra step, precise language and reasoning.</li></ul>
      <p>Under "Adjust" you can set the mathematics level and the language support separately, so language help never lowers the math.</p></section>
    <section class="panel"><h2>Getting it out of the screen</h2><ul><li><strong>Print or save as PDF</strong> uses your browser's print window.</li><li><strong>Word</strong> and <strong>PowerPoint</strong> files have real, editable text.</li><li><strong>Interactive web page</strong> is one file that works offline and checks answers.</li><li>The answer key is always a separate file.</li></ul></section>
    <section class="panel"><h2>What to know</h2><ul><li>Nothing leaves your device. Saved resources are your choices, not student data. No account is needed.</li><li>The studio does not assign levels to students, and it does not measure language proficiency. Language supports are informed by WIDA principles; the studio is not endorsed or reviewed by WIDA.</li><li>Standards codes are informational (CCSS-M 2010). Check your own state's standards.</li><li>Audio is the device's own speech voice, never a recording of a person.</li><li>${SPANISH_NOTE}</li><li>Use of the Writing Revolution-style sentence work (because, but, so) is original to this studio and is not affiliated with that organization.</li></ul></section>
    ${backLink()}`;
}

// ---------------------------------------------------------------------------------------------------------------- render
export async function render(ctx) {
  const I = i18nFor(ctx);
  setComponentsI18n(I);
  await ensureStylesheet("mls.css");
  const id = ctx.route.id || "";
  const sub = idFromPath(ctx.route.sub || "");
  const sub2 = idFromPath(ctx.route.sub2 || "");
  const wrap = (title, body, extra = "") => ({ title: `${title} · Math Literacy Studio`, html: html`<div class="ml-page ${extra}">${body}</div>` });
  try {
    if (!id) return { title: "Math Literacy Studio", html: html`<div class="ml-page">${await landing(ctx, I)}</div>` };
    if (id === "teach") return wrap("Teach a skill", await teachPage(ctx, I));
    if (id === "create") return wrap("Create a resource", await createPage(ctx, I));
    if (id === "support") return wrap("Support a learner", await supportPage(ctx, I));
    if (id === "search") return wrap("Search", await searchPage(ctx, I));
    if (id === "progressions") return wrap("Progressions", await progressionsPage(ctx, I, sub));
    if (id === "collections") return wrap("Saved and collections", await collectionsPage(ctx, I));
    if (id === "guide") return wrap("Guide", guidePage(I));
    if (id === "skill") {
      const out = await skillPage(ctx, I, sub);
      return { title: out.title, html: html`<div class="ml-page">${out.html}</div>` };
    }
    if (id === "family") return await Family.render(ctx, I, sub, { crumbs, backLink, mh, param, wrap });
    if (["resource", "packet"].includes(id)) return await Builder.render(ctx, I, id, sub, sub2, { crumbs, backLink, mh, param, supportOf, PREBUILT, TYPE_BLURB });
    if (["learn", "play", "tool"].includes(id)) return await Play.render(ctx, I, id, sub, sub2, { crumbs, backLink, mh, param, supportOf, ENGINES });
    return { title: "Math Literacy Studio", html: html`<div class="ml-page">${await landing(ctx, I)}</div>` };
  } catch (e) {
    console.error("[math-literacy]", e);
    return wrap("Math Literacy Studio", html`${crumbs(I)}<section class="panel error-panel"><h1>This page could not load</h1><p>Check your connection and try again.</p>${backLink()}</section>`);
  }
}

// ---------------------------------------------------------------------------------------------------------------- family page (kept in this file)
const Family = {
  async render(ctx, I, id, h) {
    const skill = await loadSkill(id);
    if (!skill) return h.wrap("Family page", html`${h.crumbs(I, ["Family page", null])}<section class="panel"><h1>That skill is not in the studio</h1>${h.backLink()}</section>`);
    const es = h.param("lang") === "es";
    const f = skill.family[es ? "es" : "en"];
    const n = Number(h.param("n")) || 1;
    const p = generate(skill.familyId, skill.params, { seed: n, level: 1, ctx: skill.contexts[0] });
    fam.current = { skill, p, n, es, picked: -1 };
    return h.wrap(`${skill.title}: family`, html`${h.crumbs(I, ["Teach a skill", h.mh("teach")], [skill.title, h.mh(`skill/${id}`)], ["Family page", null])}
      <header class="panel"><p class="eyebrow">${es ? "Para las familias" : "For families"}</p><h1 tabindex="-1">${skill.title}</h1>
        <p><a class="btn small" ${es ? raw("") : raw('aria-current="true"')} href="${h.mh(`family/${id}`)}">English</a> <a class="btn small" ${es ? raw('aria-current="true"') : raw("")} href="${h.mh(`family/${id}`, { lang: "es" })}">Español</a></p>
        ${es ? html`<p class="fine ml-note">${SPANISH_NOTE}</p>` : ""}</header>
      <section class="panel"><h2>${es ? "Lo que aprende su hijo o hija" : "What your child is learning"}</h2><p>${f.learning}</p></section>
      <section class="panel"><h2>${es ? "Palabras" : "Words to know"}</h2><dl class="ml-words">${skill.vocab.slice(0, 4).map((v) => html`<dt>${v.term}</dt><dd>${v.def}</dd>`)}</dl>${es ? html`<p class="fine">Las definiciones están en inglés.</p>` : ""}</section>
      <section class="panel ml-try" data-ml-family><h2>${es ? "Pruébenlo juntos" : "Try one together"}</h2>${familyProblem(fam.current)}</section>
      <section class="panel"><h2>${es ? "Conversación" : "Talk about it"}</h2><p><strong>${es ? "Digan:" : "Say:"}</strong> ${f.say}</p><p><strong>${es ? "Pregunten:" : "Ask:"}</strong> ${f.ask}</p><p><strong>${es ? "Actividad:" : "Activity:"}</strong> ${f.activity}</p></section>
      <section class="panel"><h2>${es ? "Imprimir" : "Print"}</h2><p><a class="btn" href="${h.mh(`resource/${id}/family-practice`)}">${icon("print")} ${es ? "Hoja para imprimir (inglés y español)" : "Printable family page (English and Spanish)"}</a></p></section>
      ${h.backLink("Back to the skill", h.mh(`skill/${id}`))}`);
  },
};
const fam = { current: null };
function familyProblem(c) {
  const { p, es, picked } = c;
  const L = es ? { ask: "Elijan una respuesta:", again: "Probar otro", ok: "Correcto. Cuéntense cómo lo supieron.", no: "Todavía no. Miren la pista e inténtenlo de nuevo.", hint: "Pista" } : { ask: "Choose an answer:", again: "Try another", ok: "Yes. Tell each other how you knew.", no: "Not yet. Look at the hint and try again.", hint: "Hint" };
  const choices = [{ text: p.answer.text, ok: true }, ...p.distractors.slice(0, 3).map((d) => ({ text: d.text, ok: false }))].sort((a, b) => a.text.localeCompare(b.text));
  c.choices = choices;
  return html`${p.stem.standard ? html`<p>${p.stem.standard}</p>` : ""}<p><strong>${p.ask.standard}</strong>${p.expr ? html` <span class="ml-expr">${p.expr}</span>` : ""}</p>
    <div role="group" aria-label="${L.ask}" class="ml-choices">${choices.map((x, i) => html`<button type="button" class="btn ml-choice" data-ml-fchoice="${i}" aria-pressed="${picked === i}">${x.text}</button>`)}</div>
    <p class="ml-feedback" role="status" aria-live="polite">${picked < 0 ? "" : choices[picked].ok ? L.ok : `${L.no} ${p.hints.conceptual}`}</p>
    <p><button type="button" class="btn small" data-ml-fnext>${L.again}</button></p>`;
}

// ---------------------------------------------------------------------------------------------------------------- events
let formT = 0;
export function onClick(e, ctx) {
  const pl = Play.onClick?.(e, ctx);
  if (pl) return true;
  const b = Builder.onClick?.(e, ctx);
  if (b) return true;
  const fav = e.target.closest("[data-ml-fav]");
  if (fav) {
    const on = Store.toggleFavorite(fav.dataset.mlFav);
    fav.setAttribute("aria-pressed", String(on));
    fav.lastChild.textContent = ` ${on ? "Favorite skill" : "Add to favorites"}`;
    announce(on ? "Added to favorites" : "Removed from favorites", { toast: false });
    return true;
  }
  const dup = e.target.closest("[data-ml-dup]");
  if (dup) return (Store.duplicateResource(dup.dataset.mlDup), ctx.rerender(), true);
  const del = e.target.closest("[data-ml-del]");
  if (del) return (Store.removeSaved(del.dataset.mlDel), ctx.rerender(), true);
  const rm = e.target.closest("[data-ml-rmcol]");
  if (rm) {
    const [c, s] = rm.dataset.mlRmcol.split(":");
    return (Store.removeFromCollection(c, s), ctx.rerender(), true);
  }
  const dc = e.target.closest("[data-ml-delcol]");
  if (dc) return (Store.deleteCollection(dc.dataset.mlDelcol), ctx.rerender(), true);
  const fc = e.target.closest("[data-ml-fchoice]");
  if (fc && fam.current) {
    fam.current.picked = Number(fc.dataset.mlFchoice);
    const sec = document.querySelector("[data-ml-family]");
    if (sec) sec.innerHTML = String(toHtmlText(familyProblem(fam.current)));
    return true;
  }
  if (e.target.closest("[data-ml-fnext]") && fam.current) {
    const u = new URL(location.href);
    u.searchParams.set("n", String((fam.current.n || 1) + 1));
    history.pushState({}, "", u);
    ctx.rerender();
    return true;
  }
  return false;
}
import { toHtml as toHtmlText } from "../util.js";
export function onChange(e, ctx) {
  if (Builder.onChange?.(e, ctx)) return true;
  const sup = e.target.closest("[data-ml-support]");
  if (sup) {
    ui.support = sup.value;
    const u = new URL(location.href);
    if (sup.value === "standard") u.searchParams.delete("support");
    else u.searchParams.set("support", sup.value);
    history.replaceState({}, "", u);
    ctx.rerender();
    return true;
  }
  const add = e.target.closest("[data-ml-addcol]");
  if (add && add.value) return (Store.addToCollection(add.value, add.dataset.mlAddcol), announce("Added to the collection", { toast: false }), ctx.rerender(), true);
  return false;
}
export function onInput(e, ctx) {
  return Builder.onInput?.(e, ctx) || false;
}
export function onSubmit(e, ctx) {
  const form = e.target.closest("form");
  if (!form) return false;
  if (form.matches("[data-ml-search]")) {
    e.preventDefault();
    const q = new FormData(form).get("q");
    ui.q = String(q || "");
    history.pushState({}, "", mh("search", { q: ui.q }));
    ctx.rerender();
    return true;
  }
  if (form.matches("[data-ml-filter]")) {
    e.preventDefault();
    const d = new FormData(form);
    history.pushState({}, "", mh("search", { q: param("q"), grade: d.get("grade"), type: d.get("type"), purpose: d.get("purpose") }));
    ctx.rerender();
    return true;
  }
  if (form.matches("[data-ml-newcol]")) {
    e.preventDefault();
    Store.newCollection(String(new FormData(form).get("name") || "").trim());
    ctx.rerender();
    return true;
  }
  return false;
}
export function mount(root, ctx) {
  Play.mount?.(root, ctx);
  const form = root.querySelector("[data-ml-search]");
  if (form && !form.dataset.wired) {
    form.dataset.wired = "1";
    form.addEventListener("submit", (e) => onSubmit(e, ctx));
  }
  for (const f of root.querySelectorAll("[data-ml-filter],[data-ml-newcol]")) {
    if (f.dataset.wired) continue;
    f.dataset.wired = "1";
    f.addEventListener("submit", (e) => onSubmit(e, ctx));
  }
  Builder.mount?.(root, ctx);
  clearTimeout(formT);
}
export function unmount() {
  Play.unmount?.();
  Builder.unmount?.();
}
export { loadAll, loadGrade, loadInventory, ROLE_MAP, BANDS, buildResource };
