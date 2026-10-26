// A skill room (one domain, one level): a big "Next activity" button, the
// level's skill strands as a folded list, and a tier picker. Replaces the old
// wall of 28 cards.
import { crumbsHTML, ringHTML, tierPickerHTML } from "../components.js";
import { bandDomains, loadDomain, ordered } from "../content.js";
import { activityStatus } from "../practice-plan.js";
import { loadRecord } from "../store.js";
import { ART, BASE, DOMAIN_META, TIERS, bandLabel, html, icon } from "../util.js";
import { tierFor } from "./home.js";

const TYPE_LABEL = {
  multipleChoice: "Choose",
  multiSelect: "Choose all",
  sort: "Sort",
  order: "Put in order",
  cloze: "Fill in",
  hotText: "Find evidence",
  constructed: "Your answer",
  worksheet: "Printable",
};

export function activityHref(domain, level, id) {
  if (domain === "Model-Test") {
    const [cluster, band, lv] = level.split("-");
    return `${BASE}/Model-Test/${cluster}-${band}/${lv}/${id}`;
  }
  return `${BASE}/${domain}/${level}/${id}`;
}
export function roomHref(domain, level) {
  if (domain === "Model-Test") {
    const [cluster, band, lv] = level.split("-");
    return `${BASE}/Model-Test/${cluster}-${band}/${lv}`;
  }
  return `${BASE}/${domain}/${level}`;
}

export async function render(ctx) {
  const { domain } = ctx.route;
  const band = ctx.band;
  const domains = await bandDomains(band);
  if (!domains[domain])
    return {
      title: domain,
      html: html`<section class="panel">
        <h1 tabindex="-1">${domain}</h1>
        <p>This skill is not available for ${bandLabel(band)} yet.</p>
        <p><a class="btn" href="${BASE}/">Back to the lab</a></p>
      </section>`,
    };
  const levels = domains[domain].levels;
  let level = ctx.route.level;
  if (!levels[level]) level = tierFor(ctx, domain, levels);
  else if (domain !== "Model-Test" && ctx.prefs.tiers?.[domain] !== level)
    ctx.setPrefs({ tiers: { ...ctx.prefs.tiers, [domain]: level } });
  const data = await loadDomain(band, domain);
  const L = data.levels[level];
  const record = loadRecord(band, domain, level);
  const done = new Set(record.complete);
  const list = ordered(L);
  const next = list.find((a) => !done.has(a.id)) || list[0];
  const meta = DOMAIN_META[domain];
  const tier = TIERS[level];
  const doneCount = list.filter((a) => done.has(a.id)).length;
  const byId = new Map(list.map((a) => [a.id, a]));
  const cats = (L.categories || []).length
    ? L.categories
    : [{ id: "all", title: "All activities", activityIds: list.map((a) => a.id) }];
  const listed = new Set(cats.flatMap((c) => c.activityIds));
  const extra = list.filter((a) => !listed.has(a.id));
  if (extra.length)
    cats.push({ id: "more", title: "More practice", activityIds: extra.map((a) => a.id) });

  const packetBase = `${band === "3-5" ? "g3-5-" : ""}${domain}-${level}`.replace(/\s+/g, "");

  const row = (a) => {
    const savedStatus = activityStatus(record, a.id);
    const status = savedStatus === "done" ? "done" : savedStatus === "new" ? "new" : "tried";
    return html`<li class="act-row is-${status}">
      <a href="${activityHref(domain, level, a.id)}">
        <span class="act-status" aria-hidden="true">${status === "done" ? icon("check") : status === "tried" ? icon("pin") : ""}</span>
        <span class="act-title">${a.title}</span>
        <span class="act-meta">${TYPE_LABEL[a.type] || ""} · ${a.time || ""}</span>
        <span class="visually-hidden"
          >${status === "done" ? "(done)" : status === "tried" ? "(started)" : ""}</span
        >
      </a>
    </li>`;
  };

  return {
    title: `${meta.room} · ${tier?.name || level}`,
    html: html`${crumbsHTML([
        ["Lab", `${BASE}/`],
        [meta.room, null],
      ])}
      <section class="room-hero d-${domain.toLowerCase()}">
        <div class="room-hero-copy">
          <p class="eyebrow">${bandLabel(band)}${tier ? ` · ${tier.name} support` : ""}</p>
          <h1 tabindex="-1">${meta.room}</h1>
          <p class="lead">${L.info?.headline || L.studentGoal || data.description}</p>
          ${domain !== "Model-Test" ? tierPickerHTML(domain, level, (k) => roomHref(domain, k)) : ""}
          <a class="btn btn-primary btn-big btn-next" href="${activityHref(domain, level, next.id)}">
            <span class="btn-kicker">${doneCount ? "Keep going" : "Start here"}</span><span class="next-title">${next.title}</span>${icon("arrow-right")}
          </a>
        </div>
        <div class="room-hero-art">
          <img src="${ART}/domain-${domain === "Model-Test" ? "reading" : domain.toLowerCase()}.svg" width="480" height="360" alt="" decoding="async" />
          <div class="room-hero-progress">
            ${ringHTML(doneCount, list.length, { size: 64, label: `${doneCount} of ${list.length} done` })}
            <p><strong>${doneCount} of ${list.length}</strong><span>activities done at this level</span></p>
          </div>
        </div>
      </section>
      <div class="room-layout">
      <div class="room-main">
      <section class="strands" aria-label="All activities">
        ${cats.map((c) => {
          const acts = c.activityIds.map((id) => byId.get(id)).filter(Boolean);
          const n = acts.filter((a) => done.has(a.id)).length;
          return html`<details class="strand" ${cats.length <= 2 ? "open" : ""}>
            <summary>
              <span class="strand-title">${c.title}</span
              ><span class="strand-count">${n}/${acts.length}</span>
            </summary>
            ${c.desc ? html`<p class="strand-desc">${c.desc}</p>` : ""}
            <ol class="act-list">
              ${acts.map(row)}
            </ol>
          </details>`;
        })}
      </section>
      </div>
      <aside class="room-aside" aria-label="Goals and printables">
        ${
          L.info?.canDo?.length
            ? html`<section class="aside-card">
                <h2>${icon("flag")} “I can…” goals</h2>
                <ul>
                  ${L.info.canDo.map((c) => html`<li>${c}</li>`)}
                </ul>
              </section>`
            : ""
        }
        <section class="aside-card">
          <h2>${icon("library")} Build a practice set</h2>
          <p class="fine">Search every activity and choose your own set.</p>
          <a class="btn" href="${BASE}/library?grades=${band}&domain=${domain}&level=${level}">Search activities${icon("arrow-right")}</a>
        </section>
        <section class="aside-card packet-downloads" aria-labelledby="packetHeading">
          <h2 id="packetHeading">${icon("print")} Take this practice to paper</h2>
          <p class="fine">Illustrated activities, clear directions, and room to respond. Student edition · ${bandLabel(band)}.</p>
          <div class="row-actions"><a class="btn" href="${BASE}/printables/${packetBase}.html">Preview &amp; print</a><a class="btn" href="${BASE}/printables/${packetBase}.docx" download>Download Word packet</a></div>
        </section>
      </aside>
      </div>`,
  };
}
