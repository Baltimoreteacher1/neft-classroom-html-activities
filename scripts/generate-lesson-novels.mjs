#!/usr/bin/env node
/**
 * generate-lesson-novels.mjs  —  Neft Teacher
 * ---------------------------------------------------------------------------
 * Extends the per-UNIT graphic novels (graphic-novels/unit<N>/graphic-novel-{1,2}.html)
 * down to a finer per-LESSON grain. Reads a grouping manifest plus the 6th-grade
 * lesson configs (lessons/<id>/config.json) and emits, for every "novel group",
 * two graphic novels:
 *
 *    graphic-novels/lessons/<groupId>/graphic-novel-1.html   (Support  — student label "#1")
 *    graphic-novels/lessons/<groupId>/graphic-novel-2.html   (Enrichment — student label "#2")
 *
 * Each emitted novel follows the SAME structure / interactivity / a11y as the
 * existing unit novels:
 *   - multi-tab Cover · Act 1 · Act 2 · Final · Glossary  (ARIA tablist, arrow-key nav)
 *   - click-to-advance bilingual dialogue (EN + ES support line, live region)
 *   - in-story math CHOICE POINTS with hint + per-option feedback + sentence frames
 *   - progressive tab locking (must finish Act 1 to unlock Act 2, etc.)
 *   - optional non-gating "Master Rank" enrichment bonus on the complete screen
 *   - GRACEFUL DARK ART FALLBACK identical to units 8/9: a missing panel image
 *     swaps to a diagonal-stripe placeholder showing the alt text, so the novel
 *     looks intentional until real art is dropped in (image API is budget-capped).
 *
 * IMPORTANT — math accuracy:
 *   Choice-point math is NOT inferred from free text. Each group in the manifest
 *   carries authored `acts[]` with explicit `choices[]` (text + correct flag) and
 *   feedback, so every emitted question is hand-verifiable. The generator only
 *   does layout/wiring; it never invents numbers. Vocabulary / glossary IS pulled
 *   live from each lesson's config.json (term, termEs, definition, definitionEs).
 *
 * Usage:
 *   node scripts/generate-lesson-novels.mjs            # generate every group in the manifest
 *   node scripts/generate-lesson-novels.mjs <groupId>  # generate a single group
 *
 * Art is referenced by PATH only; no image-API calls are made here. To mass-run
 * once the image budget reopens: author the remaining manifest groups (same shape
 * as the samples), drop PNGs under graphic-novels/_art/lessons/<groupId>/, and
 * re-run this script.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const LESSONS_DIR = path.join(ROOT, "lessons");
const OUT_DIR = path.join(ROOT, "graphic-novels", "lessons");
const MANIFEST = path.join(OUT_DIR, "manifest.json");

/* ------------------------------------------------------------------ helpers */

/** Minimal HTML-attribute / text escaper. Manifest content is trusted author
 *  text but we still escape the structural characters so quotes/brackets in
 *  math expressions (e.g. "x < 5") never break markup. */
function esc(s) {
  return String(s == null ? "" : s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function readLesson(id) {
  const file = path.join(LESSONS_DIR, id, "config.json");
  if (!fs.existsSync(file)) {
    throw new Error(`Lesson config not found for "${id}": ${file}`);
  }
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

/** Build the merged, de-duplicated glossary for a group from its lessons'
 *  vocabulary arrays. */
function buildGlossary(lessons) {
  const seen = new Set();
  const out = [];
  for (const lc of lessons) {
    for (const v of lc.vocabulary || []) {
      const key = (v.term || "").toLowerCase();
      if (!key || seen.has(key)) continue;
      seen.add(key);
      out.push({
        en: v.term,
        es: v.termEs || "",
        def: v.definition || "",
        defEs: v.definitionEs || "",
      });
    }
  }
  return out;
}

/* ------------------------------------------------------------- HTML pieces */

function renderDialogueData(acts) {
  // Emits the DLG object literal consumed by the runtime dialogue engine.
  const parts = [];
  acts.forEach((act, i) => {
    const key = act.kind === "final" ? "final" : "act" + (i + 1);
    const lines = (act.dialogue || [])
      .map(
        (l) =>
          `{ who: ${JSON.stringify(l.who)}, en: ${JSON.stringify(
            l.en,
          )}, es: ${JSON.stringify(l.es)}${l.cap ? ", cap: true" : ""} }`,
      )
      .join(",\n            ");
    parts.push(`          ${key}: [\n            ${lines}\n          ]`);
    // interlude line shown between challenge 1 and challenge 2 (optional)
    if (act.interlude) {
      const il = act.interlude;
      parts.push(
        `          ${key}b: [\n            { who: ${JSON.stringify(
          il.who,
        )}, en: ${JSON.stringify(il.en)}, es: ${JSON.stringify(il.es)} }\n          ]`,
      );
    }
  });
  return `{\n${parts.join(",\n")}\n        }`;
}

function renderChoices(idBase, choices) {
  return choices
    .map(
      (c) =>
        `            <button class="choice" data-correct="${c.correct ? "true" : "false"}">${esc(
          c.text,
        )}</button>`,
    )
    .join("\n");
}

/** Render one challenge block (a single math choice point). */
function renderChallenge(chalId, choicesId, fbId, frameId, ch) {
  const hint = ch.hint
    ? `            <div class="hint">&#128161; <b>Hint:</b> ${esc(ch.hint)}</div>\n`
    : "";
  const frame = ch.frame
    ? `            <div class="frame" id="${frameId}" style="display:none"><b>Sentence frame:</b> &ldquo;${esc(
        ch.frame,
      )}&rdquo;</div>\n`
    : "";
  return `        <div class="challenge" id="${chalId}" style="display:none">
          <div class="chal-grid">
            <div class="chal-left">
              <h3>${esc(ch.lockTitle || "Math Lock")}</h3>
              <p class="prompt" style="font-size:1.1rem;font-weight:700;line-height:1.45;margin-bottom:12px;">${esc(ch.prompt)}<span class="es" style="display:block;margin-top:6px;font-style:italic;color:var(--muted);font-weight:normal;">${esc(ch.promptEs || "")}</span></p>
${hint}${frame}            </div>
            <div class="chal-right">
              <div class="choices" id="${choicesId}">
${renderChoices(choicesId, ch.choices)}
              </div>
              <div class="feedback" id="${fbId}"></div>
            </div>
          </div>
        </div>`;
}

/** Render a full Act section (dialogue + 1 or 2 challenges + advance button). */
function renderActSection(act, idx, artBase) {
  const n = idx + 1; // 1-based act number
  const isFinal = act.kind === "final";
  const sceneId = isFinal ? "final" : "act" + n;
  const tabId = "tab-" + sceneId;
  const locked = idx > 0; // act1 open, later acts locked initially
  const lockNote = locked
    ? `        <div class="locked-note" id="lock-${sceneId}">&#128274; Finish the previous chapter first to unlock this one.</div>\n`
    : "";
  const bodyOpen = locked ? `        <div id="body-${sceneId}">\n` : "";
  const bodyClose = locked ? `        </div>\n` : "";

  const art = `        <div class="art">
            <img id="art-${sceneId}" src="${esc(act.art || artBase + "/" + sceneId + ".png")}" alt="${esc(
              act.artAlt || act.title,
            )}" />
          </div>`;

  const chals = [];
  chals.push(
    renderChallenge(
      `chal-${sceneId}-a`,
      `choices-${sceneId}-a`,
      `fb-${sceneId}-a`,
      `frame-${sceneId}-a`,
      act.challenges[0],
    ),
  );
  if (act.challenges[1]) {
    chals.push(
      renderChallenge(
        `chal-${sceneId}-b`,
        `choices-${sceneId}-b`,
        `fb-${sceneId}-b`,
        `frame-${sceneId}-b`,
        act.challenges[1],
      ),
    );
  }

  const actLabel = isFinal
    ? `Final &middot; ${esc(act.lessonRef || "")}`
    : `Act ${n} &middot; ${esc(act.lessonRef || "")}`;

  return `      <section class="scene" id="scene-${sceneId}" role="tabpanel" aria-labelledby="${tabId}">
${lockNote}${bodyOpen}          <div class="scene-head">
            <span class="act">${actLabel}</span>
            <h2>${esc(act.title)}</h2>
          </div>
${art}
          <div class="dialogue" id="dlg-${sceneId}" aria-live="polite"></div>
          <div class="dlg-row">
            <div class="dots" id="dots-${sceneId}"></div>
            <button class="next" id="next-${sceneId}">Next &#9654;</button>
          </div>
${chals.join("\n")}
          <div class="scene-foot">
            <button class="advance" id="adv-${sceneId}">${esc(act.advanceLabel || "Continue")} &#9654;</button>
          </div>
${bodyClose}      </section>`;
}

/* ----------------------------------------------------------- doc assembler */

function buildNovel(group, novel, lessons) {
  // novel: { tier: 1|2, label, levelWord, title, blurb, blurbEs, acts, complete }
  const artBase = `../../_art/lessons/${group.groupId}`;
  const acts = novel.acts;
  const glossary = buildGlossary(lessons);

  // ---- tabs ----
  const tabBtns = [
    `        <button class="tab" role="tab" aria-selected="true" data-scene="cover" id="tab-cover">Cover</button>`,
  ];
  acts.forEach((act, i) => {
    const isFinal = act.kind === "final";
    const sceneId = isFinal ? "final" : "act" + (i + 1);
    const locked = i > 0;
    const lk = locked ? '<span class="lk">&#128274;</span> ' : "";
    tabBtns.push(
      `        <button class="tab${locked ? " locked" : ""}" role="tab" aria-selected="false" data-scene="${sceneId}" id="tab-${sceneId}">${lk}${esc(
        act.tabLabel || act.title,
      )}</button>`,
    );
  });
  tabBtns.push(
    `        <button class="tab" role="tab" aria-selected="false" data-scene="gloss" id="tab-gloss">Glossary</button>`,
  );

  // ---- act sections ----
  const actSections = acts.map((act, i) => renderActSection(act, i, artBase)).join("\n\n");

  // ---- scene order array + sceneId list for runtime ----
  const sceneIds = ["cover"];
  acts.forEach((act, i) => sceneIds.push(act.kind === "final" ? "final" : "act" + (i + 1)));
  sceneIds.push("gloss");

  // ---- dialogue + glossary data ----
  const dlgData = renderDialogueData(acts);
  const glossData =
    "[\n" +
    glossary
      .map(
        (g) =>
          `          { en: ${JSON.stringify(g.en)}, es: ${JSON.stringify(
            g.es,
          )}, def: ${JSON.stringify(g.def)} }`,
      )
      .join(",\n") +
    "\n        ]";

  // ---- runtime act descriptors (drives generic engine) ----
  const actDescriptors = acts
    .map((act, i) => {
      const sceneId = act.kind === "final" ? "final" : "act" + (i + 1);
      const hasB = !!act.challenges[1];
      const next = i < acts.length - 1
        ? acts[i + 1].kind === "final"
          ? "final"
          : "act" + (i + 2)
        : null;
      return `          { scene: ${JSON.stringify(sceneId)}, hasB: ${hasB}, last: ${
        i === acts.length - 1
      }, next: ${next ? JSON.stringify(next) : "null"} }`;
    })
    .join(",\n");

  // ---- complete-screen bonus (optional, non-gating) ----
  const c = novel.complete || {};
  const bonus = c.bonus
    ? `        <div class="challenge bonus" id="chalComplete" style="margin-top:24px;text-align:left;background:#1c1606;border:2px solid #ffd166;">
          <div class="chal-grid">
            <div class="chal-left">
              <span class="bonus-tag" style="background:#ffd166;color:#1a1200;font-weight:800;font-size:0.72rem;letter-spacing:0.1em;padding:3px 8px;border-radius:6px;display:inline-block;">&#127942; MASTER RANK CHALLENGE</span>
              <h3 style="color:#ffd166;font-size:1.15rem;margin-top:8px;margin-bottom:6px;font-weight:700;">Bonus challenge — for mastery, not required.</h3>
              <p class="prompt" style="font-size:1.05rem;margin-bottom:12px;line-height:1.55;">${esc(
                c.bonus.prompt,
              )}<span class="es" style="display:block;margin-top:6px;font-style:italic;color:var(--muted);">${esc(c.bonus.promptEs || "")}</span></p>
            </div>
            <div class="chal-right">
              <div class="choices" id="choicesComplete" style="display:grid;gap:10px;">
${renderChoices("choicesComplete", c.bonus.choices)}
              </div>
              <div class="feedback" id="fbComplete" style="margin-top:12px;border-radius:12px;padding:12px 14px;font-size:1rem;display:none;"></div>
            </div>
          </div>
        </div>\n`
    : "";

  const cover = novel.cover;

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Graphic Novel #${novel.tier} &middot; ${esc(novel.title)}</title>
    <style>
      :root {
        --bg:#0a1228; --ink:#f4f7ff; --muted:#aebbdd; --accent:#ff8a3d;
        --accent2:#3da5ff; --panel:#13234d; --line:#2a4378; --ok:#39d98a;
        --bad:#ff6b6b; --bubble:#fffdf7; --bubble-ink:#16213d;
        --font:"Trebuchet MS","Segoe UI",system-ui,-apple-system,sans-serif;
      }
      *{box-sizing:border-box;margin:0;padding:0;}
      html,body{background:var(--bg);color:var(--ink);font-family:var(--font);line-height:1.5;}
      body{min-height:100vh;display:flex;flex-direction:column;overflow-x:hidden;}
      img{max-width:100%;display:block;}
      a{color:var(--accent2);}
      .topbar{position:sticky;top:0;z-index:30;background:rgba(10,18,40,0.96);border-bottom:1px solid var(--line);backdrop-filter:blur(6px);}
      .topbar-inner{max-width:1000px;margin:0 auto;padding:10px 14px;display:flex;align-items:center;gap:12px;flex-wrap:wrap;}
      .home{min-height:44px;display:flex;align-items:center;text-decoration:none;color:var(--muted);font-size:0.85rem;border:1px solid var(--line);border-radius:10px;padding:0 12px;}
      .home:hover{color:var(--ink);}
      .title{font-size:1rem;font-weight:700;}
      .title .v{color:var(--accent);}
      .progress-wrap{flex:1;min-width:160px;display:flex;align-items:center;gap:8px;}
      .progress{flex:1;height:10px;background:#0b1530;border:1px solid var(--line);border-radius:999px;overflow:hidden;}
      .progress>i{display:block;height:100%;width:0;background:linear-gradient(90deg,var(--accent2),var(--accent));transition:width 0.4s ease;}
      .progress-label{font-size:0.75rem;color:var(--muted);white-space:nowrap;}
      .tabs{display:flex;gap:6px;overflow-x:auto;padding:8px 14px;max-width:1000px;margin:0 auto;width:100%;scrollbar-width:thin;}
      .tab{flex:0 0 auto;min-height:44px;display:flex;align-items:center;gap:6px;background:#0e1c40;border:1px solid var(--line);color:var(--muted);border-radius:12px;padding:8px 14px;font-size:0.9rem;font-weight:600;cursor:pointer;white-space:nowrap;}
      .tab[aria-selected="true"]{background:linear-gradient(135deg,var(--accent),#ff6a3d);color:#1a0d02;border-color:transparent;}
      .tab:focus-visible{outline:3px solid #fff;outline-offset:2px;}
      .tab.locked{opacity:0.5;cursor:not-allowed;}
      .tab .lk{font-size:0.8rem;}
      main{flex:1;width:100%;max-width:1000px;margin:0 auto;padding:14px;}
      .scene{display:none;}
      .scene.active{display:block;animation:fade 0.35s ease;}
      @keyframes fade{from{opacity:0;transform:translateY(8px);}to{opacity:1;transform:none;}}
      .art{position:relative;border-radius:18px;overflow:hidden;border:1px solid var(--line);background:#0b1530;aspect-ratio:16/9;}
      .art img{width:100%;height:100%;object-fit:cover;}
      /* Graceful fallback when panel art is unavailable (same as units 8/9) */
      .art img.art-missing{display:none;}
      .art.art-fallback::after{content:attr(data-fallback);position:absolute;inset:0;display:flex;align-items:center;justify-content:center;text-align:center;padding:16px;color:var(--muted);font-size:0.9rem;font-style:italic;background:repeating-linear-gradient(135deg,#0b1530,#0b1530 12px,#0e1c40 12px,#0e1c40 24px);}
      .scene-head{display:flex;align-items:baseline;gap:10px;flex-wrap:wrap;margin-bottom:10px;}
      .scene-head h2{font-size:clamp(1.2rem,3.5vw,1.7rem);}
      .scene-head .act{font-size:0.75rem;letter-spacing:0.12em;text-transform:uppercase;color:var(--accent);}
      .dialogue{margin-top:14px;min-height:96px;}
      .bubble{background:var(--bubble);color:var(--bubble-ink);border-radius:16px;padding:14px 16px;position:relative;box-shadow:0 8px 20px -10px rgba(0,0,0,0.6);animation:fade 0.25s ease;}
      .bubble .who{font-weight:800;color:#c2461d;font-size:0.85rem;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:4px;}
      .bubble .en{font-size:1.05rem;}
      .bubble .es{font-size:0.92rem;color:#566677;margin-top:6px;font-style:italic;}
      .bubble.caption{background:#0e1c40;color:var(--ink);border:1px solid var(--line);}
      .bubble.caption .es{color:var(--muted);}
      .dlg-row{display:flex;justify-content:space-between;align-items:center;margin-top:10px;gap:10px;flex-wrap:wrap;}
      .dots{display:flex;gap:5px;}
      .dots i{width:8px;height:8px;border-radius:50%;background:#2a4378;}
      .dots i.on{background:var(--accent);}
      .next{min-height:44px;background:linear-gradient(135deg,var(--accent2),#5d7bff);color:#02112a;border:none;border-radius:12px;padding:10px 18px;font-weight:800;font-size:1rem;cursor:pointer;}
      .next:focus-visible{outline:3px solid #fff;outline-offset:2px;}
      .next[disabled]{opacity:0.4;cursor:default;}
      .challenge{margin-top:16px;background:#0e1c40;border:1px solid var(--line);border-radius:16px;padding:16px;}
      .challenge h3{font-size:1.05rem;margin-bottom:4px;color:var(--accent);}
      .challenge .prompt{font-size:1.05rem;margin-bottom:6px;}
      .challenge .prompt .es{display:block;font-size:0.9rem;color:var(--muted);font-style:italic;margin-top:4px;}
      .chal-grid{display:flex;flex-direction:column;gap:16px;}
      @media (min-width:768px){
        .chal-grid{display:grid;grid-template-columns:1.1fr 0.9fr;gap:24px;align-items:start;}
        .chal-left{border-right:1px dashed rgba(42,67,120,0.4);padding-right:24px;}
      }
      .hint{font-size:0.9rem;color:#ffd9b3;background:#3a2410;border:1px solid #7a4d1f;border-radius:10px;padding:8px 12px;margin:8px 0;}
      .hint b{color:var(--accent);}
      .choices{display:grid;gap:10px;margin-top:10px;}
      .choice{min-height:48px;text-align:left;background:#13234d;border:2px solid var(--line);color:var(--ink);border-radius:12px;padding:12px 14px;font-size:1rem;cursor:pointer;font-family:var(--font);}
      .choice:hover{border-color:var(--accent2);}
      .choice:focus-visible{outline:3px solid #fff;outline-offset:2px;}
      .choice.correct{border-color:var(--ok);background:#10351f;}
      .choice.wrong{border-color:var(--bad);background:#3a1414;}
      .feedback{margin-top:12px;border-radius:12px;padding:12px 14px;font-size:1rem;display:none;}
      .feedback.show{display:block;animation:fade 0.25s ease;}
      .feedback.good{background:#10351f;border:1px solid var(--ok);color:#c8ffe0;}
      .feedback.bad{background:#3a1414;border:1px solid var(--bad);color:#ffd5d5;}
      .feedback .es{display:block;font-style:italic;color:#9fd;opacity:0.85;margin-top:4px;font-size:0.9rem;}
      .frame{margin-top:12px;font-size:0.92rem;color:var(--muted);background:#0b1530;border:1px dashed var(--line);border-radius:10px;padding:10px 12px;}
      .frame b{color:var(--accent2);}
      .scene-foot{margin-top:18px;display:flex;justify-content:flex-end;}
      .advance{min-height:48px;background:linear-gradient(135deg,var(--accent),#ff6a3d);color:#1a0d02;border:none;border-radius:12px;padding:12px 22px;font-weight:800;font-size:1.05rem;cursor:pointer;display:none;}
      .advance.show{display:inline-flex;align-items:center;gap:8px;animation:fade 0.3s ease;}
      .advance:focus-visible{outline:3px solid #fff;outline-offset:2px;}
      .cover-card{text-align:center;}
      .cover-card .art{aspect-ratio:16/9;margin-bottom:16px;}
      .cover-card h2{font-size:clamp(1.6rem,5vw,2.4rem);}
      .cover-card p{color:var(--muted);max-width:620px;margin:10px auto;}
      .start{min-height:52px;margin-top:8px;background:linear-gradient(135deg,var(--accent),#ff6a3d);color:#1a0d02;border:none;border-radius:14px;padding:14px 28px;font-weight:800;font-size:1.15rem;cursor:pointer;}
      .start:focus-visible{outline:3px solid #fff;outline-offset:2px;}
      .level-pill{display:inline-block;margin-bottom:10px;font-size:0.8rem;letter-spacing:0.1em;text-transform:uppercase;color:#02112a;background:var(--accent2);border-radius:999px;padding:5px 14px;font-weight:700;}
      .gloss{display:grid;gap:12px;}
      .term{background:#0e1c40;border:1px solid var(--line);border-radius:14px;padding:14px 16px;display:flex;gap:14px;align-items:flex-start;}
      .term .ico{font-size:1.6rem;flex:0 0 auto;}
      .term h3{font-size:1.1rem;}
      .term .es-term{color:var(--accent2);font-size:0.9rem;font-style:italic;}
      .term p{color:var(--muted);margin-top:4px;}
      .complete{text-align:center;display:none;}
      .complete.show{display:block;}
      .complete .art{margin-bottom:16px;}
      .complete h2{font-size:clamp(1.6rem,5vw,2.4rem);color:var(--accent);}
      .badge-done{display:inline-block;font-size:3rem;margin:8px;}
      .restart{min-height:48px;margin-top:14px;background:#0e1c40;border:1px solid var(--line);color:var(--ink);border-radius:12px;padding:12px 20px;font-weight:700;cursor:pointer;}
      .locked-note{display:none;text-align:center;color:var(--muted);padding:30px 10px;}
      .locked-note.show{display:block;}
      @media (max-width:480px){.topbar-inner{gap:8px;}.title{font-size:0.9rem;flex:1 1 100%;}}
    </style>
  </head>
  <body>
    <div class="topbar">
      <div class="topbar-inner">
        <a class="home" href="../../index.html">&#8592; Home</a>
        <span class="title"><span class="v">#${novel.tier}</span> ${esc(novel.title)}</span>
        <div class="progress-wrap">
          <div class="progress" role="progressbar" aria-label="Story progress" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0">
            <i id="bar"></i>
          </div>
          <span class="progress-label" id="plabel">0%</span>
        </div>
      </div>
      <div class="tabs" role="tablist" aria-label="Chapters">
${tabBtns.join("\n")}
      </div>
    </div>

    <main>
      <!-- COVER -->
      <section class="scene active cover-card" id="scene-cover" role="tabpanel" aria-labelledby="tab-cover">
        <div class="art">
          <img src="${esc(artBase + "/cover.png")}" alt="${esc(cover.artAlt)}" />
        </div>
        <span class="level-pill">Graphic Novel #${novel.tier} &middot; ${esc(novel.levelWord)}</span>
        <h2>${esc(novel.title)}</h2>
        <p>${esc(cover.blurb)}</p>
        <p style="font-size:0.92rem"><i>${esc(cover.blurbEs)}</i></p>
        <button class="start" id="start-btn">${esc(cover.startLabel || "Start")} &#9654;</button>
      </section>

${actSections}

      <!-- MISSION COMPLETE -->
      <section class="scene complete" id="scene-complete" role="tabpanel" aria-label="Story complete">
        <div class="art">
          <img src="${esc(artBase + "/complete.png")}" alt="${esc(c.artAlt || "The hero celebrates a job well done")}" />
        </div>
        <span class="badge-done">&#127881;&#11088;</span>
        <h2>${esc(c.heading || "You did it!")}</h2>
        <p>${esc(c.text || "")}</p>
        <p style="color:var(--muted);font-size:0.92rem"><i>${esc(c.textEs || "")}</i></p>
${bonus}        <button class="restart" id="restart-btn">Play again &#8635;</button>
      </section>

      <!-- GLOSSARY -->
      <section class="scene" id="scene-gloss" role="tabpanel" aria-labelledby="tab-gloss">
        <div class="scene-head"><span class="act">Reference</span><h2>Glossary &middot; Word Bank</h2></div>
        <div class="gloss" id="gloss-list"></div>
      </section>
    </main>

    <script>
      (function () {
        "use strict";

        /* ---------- Graceful art fallback (panel image unavailable) ---------- */
        Array.prototype.slice.call(document.querySelectorAll(".art img")).forEach(function (im) {
          im.addEventListener("error", function () {
            im.classList.add("art-missing");
            var box = im.closest(".art");
            if (box) {
              box.classList.add("art-fallback");
              box.setAttribute("data-fallback", im.getAttribute("alt") || "Illustration");
            }
          });
          if (im.complete && im.naturalWidth === 0) {
            im.dispatchEvent(new Event("error"));
          }
        });

        var DLG = ${dlgData};
        var GLOSS = ${glossData};
        var ACTS = [
${actDescriptors}
        ];
        var SCENES = ${JSON.stringify(sceneIds)};

        function $(id) { return document.getElementById(id); }
        function qa(sel, root) {
          return Array.prototype.slice.call((root || document).querySelectorAll(sel));
        }

        /* ---------- Progress ---------- */
        var solvedCount = 0;
        function updateProgress() {
          var pct = Math.round((solvedCount / ACTS.length) * 100);
          $("bar").style.width = pct + "%";
          $("plabel").textContent = pct + "%";
          document.querySelector(".progress").setAttribute("aria-valuenow", pct);
        }

        /* ---------- Tab locking ---------- */
        var unlocked = { cover: true, gloss: true };
        ACTS.forEach(function (a, i) { unlocked[a.scene] = i === 0; });
        function refreshLocks() {
          ACTS.forEach(function (a, i) {
            if (i === 0) return;
            var locked = !unlocked[a.scene];
            var tab = $("tab-" + a.scene);
            if (tab) tab.classList.toggle("locked", locked);
            var ln = $("lock-" + a.scene);
            if (ln) ln.classList.toggle("show", locked);
            var body = $("body-" + a.scene);
            if (body) body.style.display = locked ? "none" : "";
          });
        }

        /* ---------- Scene switching ---------- */
        function showScene(name) {
          SCENES.forEach(function (s) {
            var sc = $("scene-" + s);
            if (sc) sc.classList.toggle("active", s === name);
            var tab = $("tab-" + s);
            if (tab) tab.setAttribute("aria-selected", s === name ? "true" : "false");
          });
          var comp = $("scene-complete");
          comp.classList.remove("active", "show");
          window.scrollTo({ top: 0, behavior: "smooth" });
        }
        function showComplete() {
          SCENES.forEach(function (s) { var sc = $("scene-" + s); if (sc) sc.classList.remove("active"); });
          qa(".tab").forEach(function (t) { t.setAttribute("aria-selected", "false"); });
          var c = $("scene-complete");
          c.classList.add("active", "show");
          window.scrollTo({ top: 0, behavior: "smooth" });
        }

        qa(".tab").forEach(function (tab) {
          tab.addEventListener("click", function () {
            if (tab.classList.contains("locked")) return;
            showScene(tab.dataset.scene);
          });
          tab.addEventListener("keydown", function (e) {
            var tabsArr = qa(".tab");
            var i = tabsArr.indexOf(tab);
            if (e.key === "ArrowRight") { e.preventDefault(); (tabsArr[i + 1] || tabsArr[0]).focus(); }
            if (e.key === "ArrowLeft") { e.preventDefault(); (tabsArr[i - 1] || tabsArr[tabsArr.length - 1]).focus(); }
          });
        });

        /* ---------- Dialogue engine ---------- */
        function runDialogue(opts) {
          var idx = 0;
          var dlgBox = $(opts.dlgId), nextBtn = $(opts.nextId), dots = $(opts.dotsId);
          dots.innerHTML = "";
          opts.dlg.forEach(function () { dots.appendChild(document.createElement("i")); });
          function render() {
            var line = opts.dlg[idx];
            dlgBox.innerHTML =
              '<div class="bubble' + (line.cap ? " caption" : "") + '">' +
              '<div class="who">' + line.who + "</div>" +
              '<div class="en">' + line.en + "</div>" +
              '<div class="es">' + line.es + "</div></div>";
            qa("i", dots).forEach(function (d, k) { d.classList.toggle("on", k <= idx); });
            nextBtn.textContent = idx === opts.dlg.length - 1 ? (opts.lastLabel || "Continue \\u25B6") : "Next \\u25B6";
          }
          nextBtn.onclick = function () {
            if (idx < opts.dlg.length - 1) { idx++; render(); }
            else { if (opts.onDone) opts.onDone(); }
          };
          render();
        }

        /* ---------- Choice handler ---------- */
        function wireChoices(opts) {
          var solved = false;
          qa(".choice", $(opts.choicesId)).forEach(function (btn) {
            btn.addEventListener("click", function () {
              if (solved) return;
              var correct = btn.dataset.correct === "true";
              var fb = $(opts.feedbackId);
              if (correct) {
                solved = true;
                btn.classList.add("correct");
                fb.className = "feedback show good";
                fb.innerHTML = opts.goodEn + '<span class="es">' + opts.goodEs + "</span>";
                qa(".choice", $(opts.choicesId)).forEach(function (b) { b.disabled = true; });
                if (opts.onSolve) opts.onSolve();
              } else {
                btn.classList.add("wrong");
                btn.disabled = true;
                fb.className = "feedback show bad";
                fb.innerHTML = opts.badEn + '<span class="es">' + opts.badEs + "</span>";
              }
            });
          });
        }

        /* ---------- Glossary ---------- */
        (function () {
          var list = $("gloss-list");
          GLOSS.forEach(function (g) {
            var d = document.createElement("div");
            d.className = "term";
            d.innerHTML =
              '<div class="ico">&#128218;</div><div><h3>' + g.en +
              (g.es ? ' <span class="es-term">(' + g.es + ")</span>" : "") +
              "</h3><p>" + g.def + "</p></div>";
            list.appendChild(d);
          });
        })();

        /* ---------- Per-act challenge data (math) ---------- */
        var CH = ${renderRuntimeChallengeData(acts)};

        /* ---------- Generic act initialiser ---------- */
        function initAct(actDesc) {
          var s = actDesc.scene;
          var data = CH[s];
          runDialogue({
            dlgId: "dlg-" + s, nextId: "next-" + s, dotsId: "dots-" + s,
            dlg: DLG[s], lastLabel: data.a.startLabel || "Try it \\u25B6",
            onDone: function () {
              $("next-" + s).style.display = "none";
              $("chal-" + s + "-a").style.display = "block";
              var fr = $("frame-" + s + "-a"); if (fr) fr.style.display = "block";
              $("chal-" + s + "-a").scrollIntoView({ behavior: "smooth", block: "center" });
            },
          });
          wireChoices({
            choicesId: "choices-" + s + "-a", feedbackId: "fb-" + s + "-a",
            goodEn: data.a.goodEn, goodEs: data.a.goodEs, badEn: data.a.badEn, badEs: data.a.badEs,
            onSolve: function () {
              if (actDesc.hasB) {
                var box = $("dlg-" + s);
                setTimeout(function () {
                  if (DLG[s + "b"] && DLG[s + "b"][0]) {
                    var il = DLG[s + "b"][0];
                    box.innerHTML = '<div class="bubble"><div class="who">' + il.who +
                      '</div><div class="en">' + il.en + '</div><div class="es">' + il.es + "</div></div>";
                  }
                  $("chal-" + s + "-b").style.display = "block";
                  var fr = $("frame-" + s + "-b"); if (fr) fr.style.display = "block";
                  $("chal-" + s + "-b").scrollIntoView({ behavior: "smooth", block: "center" });
                }, 500);
              } else {
                finishAct(actDesc);
              }
            },
          });
          if (actDesc.hasB) {
            wireChoices({
              choicesId: "choices-" + s + "-b", feedbackId: "fb-" + s + "-b",
              goodEn: data.b.goodEn, goodEs: data.b.goodEs, badEn: data.b.badEn, badEs: data.b.badEs,
              onSolve: function () { finishAct(actDesc); },
            });
          }
          $("adv-" + s).addEventListener("click", function () {
            if (actDesc.last) { showComplete(); }
            else { unlocked[actDesc.next] = true; refreshLocks(); showScene(actDesc.next); }
          });
        }
        function finishAct(actDesc) {
          if (!actDesc._solved) { actDesc._solved = true; solvedCount++; updateProgress(); }
          $("adv-" + actDesc.scene).classList.add("show");
        }

        /* ---------- Start / restart ---------- */
        $("start-btn").addEventListener("click", function () { showScene(ACTS[0].scene); });
        $("restart-btn").addEventListener("click", function () { location.reload(); });

        /* ---------- Optional non-gating bonus ---------- */
        (function () {
          var wrap = $("choicesComplete"); if (!wrap) return;
          var solved = false;
          var fb = $("fbComplete");
          qa(".choice", wrap).forEach(function (btn) {
            btn.addEventListener("click", function () {
              if (solved) return;
              if (btn.dataset.correct === "true") {
                solved = true;
                btn.classList.add("correct");
                fb.className = "feedback show good";
                fb.innerHTML = "&#127942; <b>Master Rank!</b> Excellent work \\u2014 you have mastered this skill. \\u2B50";
                qa(".choice", wrap).forEach(function (b) { b.disabled = true; });
              } else {
                btn.classList.add("wrong");
                btn.disabled = true;
                fb.className = "feedback show bad";
                fb.innerHTML = "&#10060; Not quite. Review your work and try another option.";
              }
            });
          });
        })();

        /* ---------- Init ---------- */
        ACTS.forEach(initAct);
        refreshLocks();
        updateProgress();
      })();
    </script>
  </body>
</html>
`;
}

/** Emit the runtime CH object: per-scene feedback strings for challenge a (+b). */
function renderRuntimeChallengeData(acts) {
  const entries = acts.map((act, i) => {
    const sceneId = act.kind === "final" ? "final" : "act" + (i + 1);
    const a = act.challenges[0];
    const aObj =
      `a: { startLabel: ${JSON.stringify(a.startLabel || "Try it ▶")}, ` +
      `goodEn: ${JSON.stringify(a.goodEn)}, goodEs: ${JSON.stringify(a.goodEs)}, ` +
      `badEn: ${JSON.stringify(a.badEn)}, badEs: ${JSON.stringify(a.badEs)} }`;
    let body = aObj;
    if (act.challenges[1]) {
      const b = act.challenges[1];
      body +=
        `, b: { goodEn: ${JSON.stringify(b.goodEn)}, goodEs: ${JSON.stringify(b.goodEs)}, ` +
        `badEn: ${JSON.stringify(b.badEn)}, badEs: ${JSON.stringify(b.badEs)} }`;
    }
    return `          ${JSON.stringify(sceneId)}: { ${body} }`;
  });
  return `{\n${entries.join(",\n")}\n        }`;
}

/* ----------------------------------------------------------------- driver */

function generateGroup(group) {
  const lessons = group.lessons.map(readLesson);
  const outDir = path.join(OUT_DIR, group.groupId);
  fs.mkdirSync(outDir, { recursive: true });
  for (const novel of group.novels) {
    const html = buildNovel(group, novel, lessons);
    const file = path.join(outDir, `graphic-novel-${novel.tier}.html`);
    fs.writeFileSync(file, html, "utf8");
    console.log(`  wrote ${path.relative(ROOT, file)} (${(html.length / 1024).toFixed(1)} KB)`);
  }
}

function main() {
  if (!fs.existsSync(MANIFEST)) {
    console.error(`Manifest not found: ${MANIFEST}`);
    process.exit(1);
  }
  const manifest = JSON.parse(fs.readFileSync(MANIFEST, "utf8"));
  const only = process.argv[2];
  const groups = (manifest.groups || []).filter((g) => g.generate !== false);
  const target = only ? groups.filter((g) => g.groupId === only) : groups;

  if (only && target.length === 0) {
    console.error(`No group with groupId "${only}" (or it is not flagged generate:true).`);
    process.exit(1);
  }

  console.log(
    `Manifest defines ${manifest.groups.length} groups; ${target.length} flagged for generation (art deferred — budget-capped).`,
  );
  for (const g of target) {
    console.log(`Group ${g.groupId} — "${g.title}" (lessons ${g.lessons.join(", ")})`);
    generateGroup(g);
  }
  console.log("Done.");
}

main();
