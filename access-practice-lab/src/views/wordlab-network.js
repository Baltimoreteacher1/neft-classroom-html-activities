// Semantic Network: authored relationships, student explanations, revision and independent transfer.
// All responses stay in the existing browser-local Word Lab record. A local rule checks only
// observable features; it never assigns language proficiency or judges the quality of an idea.
import { html, icon } from "../util.js";
import { bandWords, wlEvidence, wlSave } from "./wordlab-common.js";

export const NETWORKS = [
  {
    id: "living-places", band: "3-5", center: "habitat", title: "Where living things belong",
    source: "A pond is a frog's habitat. Its wet surroundings help it live. A plant grows near the pond, and a seed can become a new plant.",
    links: [
      { word: "plant", relation: "living thing", why: "A plant is a living thing that can grow in a habitat." },
      { word: "seed", relation: "part of a life cycle", why: "A seed can grow into a plant; it is part of a life cycle in this place." },
      { word: "adaptation", relation: "helps survival", why: "An adaptation is a feature or behavior that helps a living thing survive in its habitat." },
    ],
    choices: ["living thing", "part of a life cycle", "helps survival", "location"],
    prompt: "How do a habitat and two connected ideas help you explain where a frog could live?",
    transfer: "A dry desert has little water. Explain one feature that could help a plant survive there, and why.",
  },
  {
    id: "weather-chain", band: "3-5", center: "weather", title: "Follow a weather change",
    source: "The weather became warmer. Water in a puddle slowly changed into vapor. Later the vapor cooled and made small drops in clouds.",
    links: [
      { word: "temperature", relation: "condition", why: "Temperature describes how warm or cool the weather is." },
      { word: "evaporation", relation: "change caused by heat", why: "Evaporation changes liquid water into vapor as it warms." },
      { word: "condensation", relation: "change caused by cooling", why: "Condensation changes water vapor into liquid drops when it cools." },
    ],
    choices: ["condition", "change caused by heat", "change caused by cooling", "location"],
    prompt: "Use two connected words to explain how the puddle and cloud are related.",
    transfer: "A cold cup gathers drops on its outside. Explain the change that made the drops.",
  },
  {
    id: "reasoning-map", band: "6-8", center: "claim", title: "Build an evidence chain",
    source: "A student claims the garden needs more shade. Her observation is that leaves wilt on hot afternoons. A temperature record is another source of data; it does not by itself prove the cause.",
    links: [
      { word: "source", relation: "origin of information", why: "A source is where the information came from; its reliability matters when evaluating a claim." },
      { word: "data", relation: "recorded measurements", why: "A temperature record is data: measured information to interpret alongside other evidence." },
      { word: "evidence", relation: "support to evaluate", why: "Evidence supports or challenges a claim, but a single observation may not settle it." },
    ],
    choices: ["origin of information", "recorded measurements", "support to evaluate", "opposing claim"],
    prompt: "Explain how a source and data could support or limit the garden claim.",
    transfer: "A class claims its new reading routine helped. Explain what evidence you would gather before accepting that claim.",
  },
  {
    id: "argument-map", band: "6-8", center: "argument", title: "Trace an argument",
    source: "A school newspaper argues for a longer lunch break. Its claim is that students need more time to eat. A survey is one source of evidence. The writer evaluates schedules at other schools before recommending a change.",
    links: [
      { word: "claim", relation: "position to defend", why: "The claim states the position the argument asks readers to accept." },
      { word: "evidence", relation: "support to evaluate", why: "Evidence helps readers judge whether the claim is justified." },
      { word: "evaluate", relation: "reasoning move", why: "To evaluate is to judge the schedules and evidence before recommending a change." },
    ],
    choices: ["position to defend", "support to evaluate", "reasoning move", "unrelated detail"],
    prompt: "Explain how the claim and evidence work together in this argument, and why evaluating schedules matters.",
    transfer: "A class argues for a new library hour. State what evidence and comparison would help a reader judge that argument.",
  },
];

const clean = (v) => String(v || "").trim();
const hasWord = (text, word) => new RegExp(`\\b${word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i").test(text);
export function explanationFeedback(text, network) {
  const words = [network.center, ...network.links.map((l) => l.word)];
  const used = words.filter((w) => hasWord(text, w));
  const connects = /\b(because|so|therefore|as a result|which|helps|causes|supports|but|however|when)\b/i.test(text);
  if (!clean(text)) return { ready: false, message: "Write your own explanation before checking it." };
  if (used.length < 2) return { ready: false, message: `Name at least two connected ideas from the map. You used ${used.length}.` };
  if (!connects) return { ready: false, message: "You named connected ideas. Add how or why they connect, using a phrase such as ‘because,’ ‘when,’ or ‘helps.’" };
  return { ready: true, message: "You named connected ideas and stated a relationship. Reread the source: does your explanation match its evidence? Revise one detail for your reader." };
}
export function checkRelation(network, word, relation) {
  const link = network.links.find((l) => l.word === word);
  if (!link) return { correct: false, message: "Choose a word connected to this map." };
  return relation === link.relation
    ? { correct: true, message: link.why }
    : { correct: false, message: `That relationship is plausible in some contexts. Here, look again at what “${word}” does in the source, then try another connection.` };
}
const nextNetwork = (band, done) => NETWORKS.filter((n) => n.band === band).find((n) => !done[n.id]) || NETWORKS.find((n) => n.band === band);
const recordFor = (st, id) => (st.network[id] ||= { links: {}, attempts: {}, draft: "", revision: "", transfer: "", submitted: false, done: false, support: false });
const selectedNetwork = (ctx, st, id) => NETWORKS.find((n) => n.id === id && n.band === ctx.band) || nextNetwork(ctx.band, st.network);

export const network = {
  render(ctx, I, st, ui, id) {
    const n = selectedNetwork(ctx, st, id);
    if (!n) return html`<p>Choose grades 3–5 or 6–8 to explore a network.</p>`;
    const r = recordFor(st, n.id);
    const names = new Map(bandWords(ctx.band).map((w) => [w.w, w]));
    const allConnected = n.links.every((link) => r.links[link.word] === link.relation);
    const draftFeedback = r.submitted ? explanationFeedback(r.draft, n) : null;
    const revised = r.revision && r.revision.trim() !== r.draft.trim();
    return html`<div class="wl-network-nav" aria-label="Semantic maps">${NETWORKS.filter((x) => x.band === ctx.band).map((x) => html`<a class="btn ${n.id === x.id ? "btn-primary" : ""}" href="/access-practice-lab/wordlab/network/${x.id}?grades=${ctx.band}">${x.title}${st.network[x.id]?.done ? html` ${icon("check")}` : ""}</a>`)}</div>
      <section class="panel wl-network" aria-labelledby="wl-network-title">
        <p class="eyebrow">Semantic Network · ${n.id === "reasoning-map" ? "Argument" : "Connections"}</p>
        <h2 id="wl-network-title">${n.title}</h2>
        <p>Read the source, then connect each word to the central idea. A word can have other relationships elsewhere; use this source to decide.</p>
        <blockquote class="wl-network-source">${n.source}</blockquote>
        <div class="wl-network-map" role="group" aria-label="Word relationship map">
          <div class="wl-network-center"><small>Central idea</small><strong>${n.center}</strong><span>${names.get(n.center)?.d || ""}</span></div>
          <div class="wl-network-links">${n.links.map((link) => html`<div class="wl-network-link">
            <strong>${link.word}</strong><span>${names.get(link.word)?.d || ""}</span>
            <label>Relationship to ${n.center}<select data-wl-network-link="${link.word}" aria-label="Relationship between ${link.word} and ${n.center}"><option value="">Choose a connection</option>${n.choices.map((choice) => html`<option value="${choice}" ${r.links[link.word] === choice ? "selected" : ""}>${choice}</option>`)}</select></label>
            ${r.attempts[link.word] ? html`<p class="${r.links[link.word] === link.relation ? "is-right" : "is-try"}" role="status">${checkRelation(n, link.word, r.links[link.word]).message}</p>` : ""}
          </div>`)}</div>
        </div>
        ${allConnected ? html`<div class="wl-network-response">
          <h3>Explain the network</h3><p>${n.prompt}</p>
          <label for="wl-network-draft">My first explanation</label><textarea id="wl-network-draft" data-wl-network-text="draft" rows="4" maxlength="1200">${r.draft}</textarea>
          <button type="button" class="btn btn-primary" data-wl-network-check>Check my explanation</button>
          ${draftFeedback ? html`<p class="wl-network-feedback" role="status">${draftFeedback.message}</p>` : ""}
          ${draftFeedback?.ready ? html`<label for="wl-network-revision">Revise one detail for your reader</label><textarea id="wl-network-revision" data-wl-network-text="revision" rows="4" maxlength="1200">${r.revision}</textarea>
            ${revised ? html`<details><summary>Compare my two explanations</summary><p><strong>First:</strong> ${r.draft}</p><p><strong>Revised:</strong> ${r.revision}</p></details>
              <label for="wl-network-transfer">Try a new situation on your own</label><p>${n.transfer}</p><textarea id="wl-network-transfer" data-wl-network-text="transfer" rows="4" maxlength="1200">${r.transfer}</textarea>
              <button type="button" class="btn btn-primary" data-wl-network-finish ${r.done ? "disabled" : ""}>${r.done ? "Saved on this device" : "Save my transfer"}</button>${ui.transferError ? html`<p role="alert">Write at least eight words about the new situation before saving. This is a practice prompt, not an automated quality score.</p>` : ""}` : ""}` : ""}
        </div>` : html`<p class="fine" role="status">Connect all three words to open the explanation challenge.</p>`}
        ${r.done ? html`<p role="status">You connected, explained, revised, and applied this idea. Choose another map or revisit a word in your garden.</p><a class="btn" href="/access-practice-lab/wordlab/garden?grades=${ctx.band}">Visit my word garden ${icon("arrow-right")}</a>` : ""}
      </section>`;
  },
  click(e, ctx, I, st, ui) {
    const n = selectedNetwork(ctx, st, ctx.route.sub);
    if (!n) return false;
    const r = recordFor(st, n.id);
    if (e.target.closest("[data-wl-network-check]")) {
      r.submitted = true;
      wlSave(st); ctx.rerender(); return true;
    }
    if (e.target.closest("[data-wl-network-finish]")) {
      if (!n.links.every((l) => r.links[l.word] === l.relation) || !explanationFeedback(r.draft, n).ready || !r.revision.trim() || r.revision.trim() === r.draft.trim()) return false;
      if (r.transfer.trim().split(/\s+/).length < 8) { ui.transferError = true; ctx.rerender(); return true; }
      ui.transferError = false;
      r.done = true;
      wlEvidence(st, ctx, `network-${n.id}`, { relations: n.links.length, drafted: true, revised: true, transferWords: r.transfer.trim().split(/\s+/).length }, r.support ? { hint: true } : {}, "Explain");
      wlSave(st); ctx.rerender(); return true;
    }
    return false;
  },
  change(e, ctx, st) {
    const n = selectedNetwork(ctx, st, ctx.route.sub);
    if (!n) return false;
    const link = e.target.closest?.("[data-wl-network-link]");
    if (link) {
      const r = recordFor(st, n.id);
      r.links[link.dataset.wlNetworkLink] = link.value;
      r.attempts[link.dataset.wlNetworkLink] = (r.attempts[link.dataset.wlNetworkLink] || 0) + 1;
      if (r.attempts[link.dataset.wlNetworkLink] > 1) r.support = true;
      wlSave(st); ctx.rerender(); return true;
    }
    if (e.target.closest?.('[data-wl-network-text="revision"]')) {
      const r = recordFor(st, n.id);
      r.revision = e.target.value.slice(0, 1200);
      wlSave(st); ctx.rerender(); return true;
    }
    return false;
  },
  input(e, ctx, st) {
    const box = e.target.closest?.("[data-wl-network-text]");
    if (!box) return false;
    const n = selectedNetwork(ctx, st, ctx.route.sub);
    if (!n) return false;
    const r = recordFor(st, n.id);
    r[box.dataset.wlNetworkText] = box.value.slice(0, 1200);
    if (box.dataset.wlNetworkText === "draft") r.submitted = false;
    wlSave(st); return true;
  },
};
