// A skill room (one domain, one level): a big "Next activity" button, the
// level's skill strands as a folded list, and a tier picker. Replaces the old
// wall of 28 cards.
import { crumbsHTML, ringHTML, tierPickerHTML } from "../components.js";
import { bandDomains, loadDomain, ordered } from "../content.js";
import { loadRecord } from "../store.js";
import { BASE, DOMAIN_META, TIERS, bandLabel, html } from "../util.js";
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

  const row = (a) => {
    const r = record.results[a.id];
    const status = done.has(a.id) ? "done" : r ? "tried" : "new";
    return html`<li class="act-row is-${status}">
      <a href="${activityHref(domain, level, a.id)}">
        <span class="act-status" aria-hidden="true"
          >${status === "done" ? "✓" : status === "tried" ? "•" : ""}</span
        >
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
      <section class="room-hero" style="--room:${data.color}">
        <div>
          <p class="eyebrow">
            ${bandLabel(band)} · ${tier ? `${tier.name} (${tier.range})` : L.displayLabel || level}
          </p>
          <h1 tabindex="-1"><span aria-hidden="true">${meta.glyph}</span> ${meta.room}</h1>
          <p class="lead">${L.info?.headline || L.studentGoal || data.description}</p>
        </div>
        ${ringHTML(doneCount, list.length, { size: 84, label: `${doneCount} of ${list.length} done` })}
      </section>
      ${domain !== "Model-Test" ? tierPickerHTML(domain, level, (k) => roomHref(domain, k)) : ""}
      <a class="btn btn-primary btn-next" href="${activityHref(domain, level, next.id)}">
        <span class="btn-kicker">${doneCount ? "Keep going" : "Start here"}</span>${next.title} →
      </a>
      ${
        L.info?.canDo?.length
          ? html`<details class="cando">
              <summary>“I can…” goals for this level</summary>
              <ul>
                ${L.info.canDo.map((c) => html`<li>${c}</li>`)}
              </ul>
            </details>`
          : ""
      }
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
      </section>`,
  };
}
