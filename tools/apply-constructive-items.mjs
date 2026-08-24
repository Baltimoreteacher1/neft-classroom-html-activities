#!/usr/bin/env node
// Append authored constructive items to core lesson practice tiers.
import { readFileSync, writeFileSync } from "node:fs";
import a from "./constructive-items-a.mjs";
import b from "./constructive-items-b.mjs";

const all = { ...a, ...b };
let lessons = 0,
  items = 0;
for (const [id, tiers] of Object.entries(all)) {
  const path = `lessons/${id}/config.json`;
  const config = JSON.parse(readFileSync(path, "utf8"));
  if (!config.practice) throw new Error(`${id}: no practice block`);
  for (const [tier, list] of Object.entries(tiers)) {
    if (!Array.isArray(config.practice[tier])) throw new Error(`${id}: no ${tier} tier`);
    for (const item of list) {
      delete item.explanationNote; // authoring scratch key, never ship it
      config.practice[tier].push(item);
      items++;
    }
  }
  writeFileSync(path, JSON.stringify(config, null, 2) + "\n");
  lessons++;
}
console.log(`applied ${items} items across ${lessons} lessons`);
