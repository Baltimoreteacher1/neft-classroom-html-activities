// The five word presets: process, timeline, word-build, sentence-expand, cause-effect. Each builder takes the cleaned
// params of the block and returns { frames, table? }; a frame is { caption: {en, es}, draw(lang, id) -> {svg, alt} }.
// Nothing is generated from the teacher's words: every frame only reveals text the teacher typed, in the order
// they typed it, plus a few fixed labels in both languages.

import { COLOR, f1, text } from "./diagram-kit.js";
import {
  AN_TINT,
  AN_W,
  anArrow,
  anBadge,
  anBoth,
  anDiagram,
  anFail,
  anLines,
  anPick,
  anPlain,
  anQuote,
  anRect,
  anScene,
  anStep,
  anWrap,
  anYear,
  esc,
  textWidth,
} from "./animations-kit.js";

const anTrim = (s) => anPlain(s).replace(/[.!?]+$/, "");
const anNeed = (list, min, max, en, es) => {
  if (!Array.isArray(list) || list.length < min)
    anFail("too-few", `Add at least ${min} ${en}.`, `Agregue al menos ${min} ${es}.`);
  if (list.length > max)
    anFail("too-many", `Use at most ${max} ${en}.`, `Use como máximo ${max} ${es}.`);
};

// ── process: stages, highlight advances ──────────────────────────────────────

function anStageLayout(items, active) {
  let y = 12;
  const rows = items.map((it, i) => {
    const lines = anWrap(it.label, 30);
    const open = i === active ? anWrap(it.text, 40) : [];
    const h = Math.max(40, lines.length * 22 + 16) + (open.length ? open.length * 21 + 8 : 0);
    const row = { y, h, lines, open };
    y += h + 10;
    return row;
  });
  return { rows, h: y + 2 };
}

/** A column of labelled stages; `active` is highlighted, the ones before it are ticked. */
function anStagesSvg(items, active, { lang, id, alt, desc, height }) {
  const { rows, h } = anStageLayout(items, active);
  const body = [];
  if (rows.length > 1)
    body.push(
      `<line x1="34" y1="${f1(rows[0].y + 20)}" x2="34" y2="${f1(rows.at(-1).y + 20)}" stroke="${COLOR.grid}" stroke-width="3"/>`,
    );
  rows.forEach((r, i) => {
    const on = i === active;
    body.push(
      anRect(60, r.y, AN_W - 72, r.h, {
        fill: on ? AN_TINT : COLOR.white,
        stroke: on ? COLOR.blue : i < active ? COLOR.ink : COLOR.grid,
        sw: on ? 3.5 : 1.5,
        dash: i > active ? "6 5" : "",
      }),
      anBadge(34, r.y + 20, i + 1, on ? "on" : i < active ? "done" : "todo"),
      anLines(76, r.y + 8, r.lines, {
        size: 17,
        lh: 22,
        weight: "700",
        fill: i > active ? COLOR.muted : COLOR.ink,
      }).svg,
      anLines(76, r.y + 8 + r.lines.length * 22 + 2, r.open, { size: 16, lh: 21 }).svg,
    );
  });
  return anScene({ id, h: height ?? h, alt, desc, lang, body: body.join("") });
}

export function anProcess(p) {
  anNeed(p.stages, 2, 8, "stages", "etapas");
  const items = p.stages.map((s, i) => {
    const label = anPlain(s.label);
    if (!label)
      anFail("empty-text", `Stage ${i + 1} needs a name.`, `La etapa ${i + 1} necesita un nombre.`);
    return { label, text: anPlain(s.text) };
  });
  const height = Math.max(...items.map((_, i) => anStageLayout(items, i).h));
  const n = items.length;
  return {
    frames: items.map((it, i) => {
      const caption = anBoth(
        (l) =>
          `${anPick(l, "Stage", "Etapa")} ${i + 1} ${anPick(l, "of", "de")} ${n}: ${it.label}.${it.text ? ` ${it.text}` : ""}`,
      );
      return {
        caption,
        draw: (lang, id) => ({
          svg: anStagesSvg(items, i, {
            lang,
            id,
            alt: caption[lang],
            desc: anStep(lang, i + 1, n),
            height,
          }),
          alt: caption[lang],
        }),
      };
    }),
  };
}

// ── timeline: events revealed in order ───────────────────────────────────────

export function anTimeline(p) {
  anNeed(p.events, 2, 8, "events", "eventos");
  const events = p.events
    .map((e, i) => {
      if (!Number.isInteger(e.year))
        anFail(
          "bad-year",
          `Event ${i + 1} needs a whole-number year (use a negative year for BCE).`,
          `El evento ${i + 1} necesita un año entero (use un año negativo para a. C.).`,
        );
      const label = anPlain(e.label);
      if (!label)
        anFail(
          "empty-text",
          `Event ${i + 1} needs a name.`,
          `El evento ${i + 1} necesita un nombre.`,
        );
      return { year: e.year, label, order: i };
    })
    .sort((a, b) => a.year - b.year || a.order - b.order);
  if (new Set(events.map((e) => e.year)).size < 2)
    anFail(
      "one-year",
      "A timeline needs at least two different years.",
      "Una línea de tiempo necesita al menos dos años distintos.",
    );
  const n = events.length;
  const frames = events.map((e, k) => {
    const so_far = events.slice(0, k + 1);
    const caption = anBoth(
      (l) =>
        `${anPick(l, "Event", "Evento")} ${k + 1} ${anPick(l, "of", "de")} ${n}: ${anYear(e.year, l)}. ${e.label}`,
    );
    const scale = new Set(so_far.map((x) => x.year)).size >= 2;
    return {
      caption,
      draw: (lang, id) => {
        if (scale)
          return anDiagram(
            { kind: "timeline", events: so_far.map(({ year, label }) => ({ year, label })) },
            lang,
            id,
          );
        const items = so_far.map((x) => ({
          label: `${anYear(x.year, lang)}: ${x.label}`,
          text: "",
        }));
        return {
          svg: anStagesSvg(items, k, {
            lang,
            id,
            alt: caption[lang],
            desc: anStep(lang, k + 1, n),
          }),
          alt: caption[lang],
        };
      },
    };
  });
  return {
    frames,
    table: (lang) => ({
      headers: anPick(lang, ["Year", "Event"], ["Año", "Evento"]),
      rows: events.map((e) => [anYear(e.year, lang), e.label]),
    }),
  };
}

// ── word-build: prefix + root + suffix ───────────────────────────────────────

const AN_KIND = {
  prefix: ["Prefix", "Prefijo"],
  root: ["Root", "Raíz"],
  suffix: ["Suffix", "Sufijo"],
};
const anShown = (part) => {
  const t = part.text.replace(/^-+|-+$/g, "");
  return part.kind === "prefix" ? `${t}-` : part.kind === "suffix" ? `-${t}` : t;
};

/** Where the tiles go: they flow left to right and wrap, so five parts still fit a narrow screen. */
function anTiles(parts, joined) {
  let x = 20;
  let row = 0;
  const tiles = [];
  parts.forEach((part, i) => {
    const label = anShown(part);
    const w = textWidth(label, 28, true) + 28;
    const gap = joined ? 4 : 30;
    if (x + w > AN_W - 20 && x > 20) {
      x = 20;
      row++;
    }
    tiles.push({ part, label, x, w, row });
    x += w + gap;
    if (i === parts.length - 1) x = 20;
  });
  return { tiles, rows: Math.max(...tiles.map((t) => t.row)) + 1 };
}

function anWordSvg(parts, k, final, word, meaningLines, { lang, id, alt, desc, height }) {
  const shown = final ? parts : parts.slice(0, k + 1);
  const { tiles, rows } = anTiles(shown, final);
  const body = [];
  tiles.forEach((t, i) => {
    const y = 14 + t.row * 80;
    const newest = !final && i === k;
    body.push(
      anRect(t.x, y, t.w, 46, {
        fill: newest || final ? AN_TINT : COLOR.white,
        stroke: newest ? COLOR.blue : COLOR.ink,
        sw: newest ? 3.5 : 2,
      }),
      text(t.x + t.w / 2, y + 34, t.label, { size: 28, anchor: "middle", weight: "700" }),
      text(t.x + t.w / 2, y + 66, anPick(lang, ...AN_KIND[t.part.kind]), {
        size: 14,
        anchor: "middle",
        fill: COLOR.muted,
      }),
    );
    const next = tiles[i + 1];
    if (!final && next && next.row === t.row)
      body.push(text(t.x + t.w + 15, y + 34, "+", { size: 26, anchor: "middle", weight: "700" }));
  });
  let y = 14 + rows * 80;
  if (final) {
    body.push(text(20, y + 34, `= ${word}`, { size: 34, weight: "700", fill: COLOR.blue }));
    y += 50;
  }
  body.push(anLines(20, y, meaningLines, { size: 17, lh: 22 }).svg);
  return anScene({ id, h: height, alt, desc, lang, body: body.join("") });
}

export function anWordBuild(p) {
  anNeed(p.parts, 2, 5, "word parts", "partes de la palabra");
  const word = anPlain(p.word);
  if (!word) anFail("empty-text", "Type the whole word.", "Escriba la palabra completa.");
  const parts = p.parts.map((x, i) => {
    const t = anPlain(x.text);
    if (!t.replace(/-/g, ""))
      anFail(
        "empty-text",
        `Word part ${i + 1} needs its letters.`,
        `La parte ${i + 1} necesita sus letras.`,
      );
    return { kind: x.kind, text: t, meaning: anPlain(x.meaning) };
  });
  const whole = anPlain(p.meaning);
  const n = parts.length + 1;
  const lines = (s) => (s ? anWrap(anQuote(s), 38) : []);
  const rows = Math.max(
    anTiles(parts, true).rows,
    ...parts.map((_, i) => anTiles(parts.slice(0, i + 1), false).rows),
  );
  const tail = Math.max(...parts.map((x) => lines(x.meaning).length), lines(whole).length);
  const height = 14 + rows * 80 + 50 + tail * 22 + 16;
  const frames = parts.map((part, i) => {
    const caption = anBoth((l) => {
      const kind = anPick(l, ...AN_KIND[part.kind]);
      return `${kind}: ${anQuote(anShown(part))}.${part.meaning ? ` ${anPick(l, "Meaning", "Significado")}: ${part.meaning}.` : ""}`;
    });
    return {
      caption,
      draw: (lang, id) => ({
        svg: anWordSvg(parts, i, false, word, lines(part.meaning), {
          lang,
          id,
          alt: caption[lang],
          desc: anStep(lang, i + 1, n),
          height,
        }),
        alt: caption[lang],
      }),
    };
  });
  const joined = parts.map(anShown).join(" + ");
  const caption = anBoth(
    (l) =>
      `${anPick(l, "Put the parts together", "Une las partes")}: ${joined} = ${word}.${whole ? ` ${anPick(l, "Meaning", "Significado")}: ${whole}.` : ""}`,
  );
  frames.push({
    caption,
    draw: (lang, id) => ({
      svg: anWordSvg(parts, parts.length - 1, true, word, lines(whole), {
        lang,
        id,
        alt: caption[lang],
        desc: anStep(lang, n, n),
        height,
      }),
      alt: caption[lang],
    }),
  });
  return { frames };
}

// ── sentence-expand: a base sentence that grows ──────────────────────────────

const AN_ADDS = {
  because: ["a reason (because)", "una razón (porque)"],
  but: ["a contrast (but)", "un contraste (pero)"],
  so: ["a result (so)", "un resultado (así que)"],
  when: ["a time (when)", "un tiempo (cuando)"],
  where: ["a place (where)", "un lugar (donde)"],
  detail: ["a detail", "un detalle"],
};

/** Lines of words (each flagged new or old) no longer than `max` characters. */
function anSentenceLines(words, max) {
  const lines = [[]];
  let size = 0;
  for (const w of words) {
    if (size && size + 1 + w.t.length > max) {
      lines.push([]);
      size = 0;
    }
    lines.at(-1).push(w);
    size += (size ? 1 : 0) + w.t.length;
  }
  return lines;
}

function anSentenceSvg(words, chip, maxLines, { lang, id, alt, desc }) {
  const lines = anSentenceLines(words, 34);
  const chipW = textWidth(chip, 15, true) + 28;
  const body = [
    anRect(16, 14, chipW, 30, { fill: AN_TINT, stroke: COLOR.blue, sw: 2, rx: 15 }),
    text(30, 35, chip, { size: 15, weight: "700" }),
  ];
  lines.forEach((ln, i) => {
    let runs = "";
    ln.forEach((w, j) => {
      const t = esc(j < ln.length - 1 ? `${w.t} ` : w.t);
      runs += w.hl
        ? `<tspan font-weight="700" fill="${COLOR.blue}" text-decoration="underline">${t}</tspan>`
        : `<tspan>${t}</tspan>`;
    });
    body.push(
      `<text x="20" y="${f1(84 + i * 30)}" font-size="20" fill="${COLOR.ink}" xml:space="preserve">${runs}</text>`,
    );
  });
  return anScene({
    id,
    h: 64 + Math.max(maxLines, lines.length) * 30 + 20,
    alt,
    desc,
    lang,
    body: body.join(""),
  });
}

export function anSentence(p) {
  anNeed(p.additions, 1, 6, "added phrases", "frases agregadas");
  const base = anTrim(p.base);
  if (!base) anFail("empty-text", "Type the base sentence.", "Escriba la oración base.");
  const end = /[.!?]$/.exec(anPlain(p.base))?.[0] ?? ".";
  const adds = p.additions.map((a, i) => {
    const t = anTrim(a.text);
    if (!t)
      anFail(
        "empty-text",
        `Added phrase ${i + 1} needs words.`,
        `La frase agregada ${i + 1} necesita palabras.`,
      );
    return { adds: a.adds, text: t };
  });
  const wordsAt = (k) => {
    const all = [base, ...adds.slice(0, k).map((a) => a.text)];
    const flagged = all.flatMap((chunk, ci) =>
      chunk.split(" ").map((t) => ({ t, hl: k > 0 && ci === k })),
    );
    flagged.at(-1).t += end;
    return flagged;
  };
  const sentenceAt = (k) =>
    wordsAt(k)
      .map((w) => w.t)
      .join(" ");
  const n = adds.length + 1;
  const maxLines = anSentenceLines(wordsAt(adds.length), 34).length;
  return {
    frames: Array.from({ length: n }, (_, k) => {
      const caption = anBoth((l) =>
        k === 0
          ? `${anPick(l, "Start with the base sentence", "Empieza con la oración base")}: ${anQuote(sentenceAt(0))}`
          : `${anPick(l, "Add", "Agrega")} ${anPick(l, ...AN_ADDS[adds[k - 1].adds])}: ${anQuote(adds[k - 1].text)}. ${anPick(l, "Now the sentence says", "Ahora la oración dice")}: ${anQuote(sentenceAt(k))}`,
      );
      return {
        caption,
        draw: (lang, id) => ({
          svg: anSentenceSvg(
            wordsAt(k),
            k === 0
              ? anPick(lang, "Base sentence", "Oración base")
              : `${anPick(lang, "Adds", "Agrega")} ${anPick(lang, ...AN_ADDS[adds[k - 1].adds])}`,
            maxLines,
            { lang, id, alt: caption[lang], desc: anStep(lang, k + 1, n) },
          ),
          alt: caption[lang],
        }),
      };
    }),
  };
}

// ── cause-effect: linked pairs ───────────────────────────────────────────────

function anCauseRows(pairs) {
  let y = 48;
  return pairs.map((p) => {
    const c = anWrap(p.cause, 20);
    const e = anWrap(p.effect, 20);
    const h = Math.max(48, Math.max(c.length, e.length) * 20 + 22);
    const row = { y, h, c, e };
    y += h + 14;
    return row;
  });
}

function anCauseSvg(pairs, k, { lang, id, alt, desc }) {
  const rows = anCauseRows(pairs);
  const total = rows.at(-1).y + rows.at(-1).h + 10;
  const body = [
    text(116, 28, anPick(lang, "Cause", "Causa"), {
      size: 16,
      anchor: "middle",
      weight: "700",
      fill: COLOR.muted,
    }),
    text(364, 28, anPick(lang, "Effect", "Efecto"), {
      size: 16,
      anchor: "middle",
      weight: "700",
      fill: COLOR.muted,
    }),
  ];
  rows.slice(0, k + 1).forEach((r, i) => {
    const on = i === k;
    const style = {
      fill: on ? AN_TINT : COLOR.white,
      stroke: on ? COLOR.blue : COLOR.ink,
      sw: on ? 3.5 : 1.5,
    };
    body.push(
      anRect(16, r.y, 200, r.h, style),
      anRect(264, r.y, 200, r.h, style),
      anLines(28, r.y + 8, r.c, { size: 16, lh: 20 }).svg,
      anLines(276, r.y + 8, r.e, { size: 16, lh: 20 }).svg,
      anArrow(224, 256, r.y + r.h / 2),
    );
  });
  return anScene({ id, h: total, alt, desc, lang, body: body.join("") });
}

export function anCause(p) {
  anNeed(p.pairs, 2, 6, "cause and effect pairs", "pares de causa y efecto");
  const pairs = p.pairs.map((x, i) => {
    const cause = anPlain(x.cause);
    const effect = anPlain(x.effect);
    if (!cause || !effect)
      anFail(
        "empty-text",
        `Pair ${i + 1} needs a cause and an effect.`,
        `El par ${i + 1} necesita una causa y un efecto.`,
      );
    return { cause, effect };
  });
  const n = pairs.length;
  return {
    frames: pairs.map((x, k) => {
      const caption = anBoth(
        (l) =>
          `${anPick(l, "Cause", "Causa")}: ${x.cause}. ${anPick(l, "Effect", "Efecto")}: ${x.effect}.`,
      );
      return {
        caption,
        draw: (lang, id) => ({
          svg: anCauseSvg(pairs, k, { lang, id, alt: caption[lang], desc: anStep(lang, k + 1, n) }),
          alt: caption[lang],
        }),
      };
    }),
  };
}
