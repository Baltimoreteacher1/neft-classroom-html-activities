#!/usr/bin/env node
/**
 * family-hook-cards.test.mjs: the six hook-card templates are pure, bilingual, readable and honest about their slots.
 */
import assert from "node:assert/strict";
import test from "node:test";
import { JSDOM } from "jsdom";
import {
  HOOK_KINDS,
  HOOK_SLOTS,
  renderHookCard,
  sampleSlots,
} from "../assets/design/family/art/hook-cards.mjs";

const parse = (svg) => new JSDOM(svg, { contentType: "image/svg+xml" }).window.document;

test("six templates, each drawn from its own slots", () => {
  assert.deepEqual([...HOOK_KINDS], ["price", "recipe", "score", "map", "ticket", "receipt"]);
  for (const kind of HOOK_KINDS) {
    for (const lang of ["en", "es"]) {
      const slots = sampleSlots(kind, lang);
      const svg = renderHookCard(kind, slots, { lang });
      assert.equal(svg, renderHookCard(kind, slots, { lang }), `${kind}/${lang} is deterministic`);
      const doc = parse(svg);
      assert.equal(doc.documentElement.getAttribute("role"), "img");
      assert.ok(doc.querySelector("title").textContent.length > 10);
      const marked = [...doc.querySelectorAll("[data-slot]")].map((e) =>
        e.getAttribute("data-slot"),
      );
      assert.deepEqual(
        [...marked].sort(),
        Object.keys(HOOK_SLOTS[kind]).sort(),
        `${kind}: every slot is marked data-slot, and nothing else is`,
      );
      for (const [key, value] of Object.entries(slots)) {
        assert.equal(
          doc.querySelector(`[data-slot="${key}"]`).textContent,
          value,
          `${kind}.${key} shows the slot text`,
        );
      }
      assert.ok(Buffer.byteLength(svg) < 4096, `${kind} stays small`);
    }
  }
});

test("text is at least 14px (the sizes the stylesheet declares)", () => {
  const css = renderHookCard("price", sampleSlots("price"), { lang: "en" }).match(
    /<style>([^<]*)<\/style>/,
  )[1];
  for (const m of css.matchAll(/(?:font:[^;]*?|font-size:)(\d+(?:\.\d+)?)px/g))
    assert.ok(Number(m[1]) >= 14, `${m[0]} is under 14px`);
});

test("slots are required, unknown slots throw, long text is clipped with an ellipsis", () => {
  assert.throws(
    () => renderHookCard("price", { item: "x", price: "$1" }),
    /slot "note" is required/,
  );
  assert.throws(
    () => renderHookCard("price", { ...sampleSlots("price"), colour: "red" }),
    /unrecognized slot "colour"/,
  );
  assert.throws(() => renderHookCard("pie", {}), /Unknown hook card/);
  assert.throws(
    () => renderHookCard("price", sampleSlots("price"), { lang: "fr" }),
    /lang must be/,
  );
  assert.throws(() => renderHookCard("price", { ...sampleSlots("price"), item: "" }), /is empty/);
  const long = renderHookCard("price", { ...sampleSlots("price"), item: "A".repeat(60) });
  const shown = parse(long).querySelector('[data-slot="item"]').textContent;
  assert.ok(shown.length <= HOOK_SLOTS.price.item.max && shown.endsWith("…"), shown);
  const es = renderHookCard(
    "price",
    { item: { en: "Shoes", es: "Zapatos" }, price: "$5", note: { en: "Sale", es: "Oferta" } },
    { lang: "es" },
  );
  assert.match(es, />Zapatos</);
});

test("EN and ES cards on one page never share an id", () => {
  const page = HOOK_KINDS.flatMap((k) =>
    ["en", "es"].map((lang) => renderHookCard(k, sampleSlots(k, lang), { lang })),
  ).join("");
  const ids = [...page.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]);
  assert.equal(new Set(ids).size, ids.length);
  assert.ok(ids.length >= 12);
});

test("text in the card is escaped", () => {
  const svg = renderHookCard("ticket", { ...sampleSlots("ticket"), event: "<b>&" });
  assert.doesNotMatch(svg, /<b>/);
  assert.match(svg, /&lt;b&gt;&amp;/);
});
