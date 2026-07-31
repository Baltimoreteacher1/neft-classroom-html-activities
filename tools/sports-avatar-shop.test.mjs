import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const apps = [
  ["focus-school/sports.js", "baseball"],
  ["shai-school/sports.js", "soccer"],
];

for (const [file, key] of apps) {
  const context = { globalThis: {} };
  vm.runInNewContext(readFileSync(file, "utf8"), context, { filename: file });
  const api = context.globalThis.NeftSports;
  assert.equal(api.THEME.key, key);

  const starter = api.normalize({ xp: 0, owned: [] });
  assert.ok(starter.owned.length >= 5, `${key} includes free starter gear`);
  assert.equal(api.gearBalance(starter), 0);

  const shopper = api.normalize({ xp: 120, owned: [] });
  const levelTwoItem = api.THEME.gear.find((item) => item.level === 2);
  assert.ok(levelTwoItem, `${key} has level-two shop gear`);
  assert.equal(api.gearBalance(shopper), 120);
  const bought = api.purchase(shopper, levelTwoItem.id);
  assert.equal(bought.status, "purchased");
  assert.ok(bought.sport.owned.includes(levelTwoItem.id));
  assert.equal(bought.sport.equipped[levelTwoItem.slot], levelTwoItem.id);
  assert.equal(api.gearBalance(bought.sport), 120 - levelTwoItem.price);
  assert.equal(api.levelInfo(bought.sport.xp).level, 2, "purchases never lower level");

  const levelThreeItem = api.THEME.gear.find((item) => item.level === 3);
  assert.equal(api.purchase(shopper, levelThreeItem.id).status, "level");
  assert.deepEqual(api.equip(shopper, levelThreeItem.id).equipped, shopper.equipped);

  const legacy = api.normalize({ xp: 540 });
  assert.ok(
    api.THEME.gear
      .filter((item) => item.level <= 4)
      .every((item) => legacy.owned.includes(item.id)),
    `${key} preserves pre-shop unlocks`,
  );

  const merged = api.merge(
    { xp: 540, owned: [levelTwoItem.id] },
    { xp: 540, owned: [levelThreeItem.id] },
  );
  assert.ok(merged.owned.includes(levelTwoItem.id) && merged.owned.includes(levelThreeItem.id));

  const view = api.renderView(shopper, {
    card: (_id, title, sub, body) => `<section><h3>${title}</h3><p>${sub}</p>${body}</section>`,
  });
  assert.match(view, /<svg class="sp-avatar-svg"/);
  assert.match(view, /data-act="sports-buy"/);
  assert.match(view, /not real money/i);
}

console.log("sports avatar shop tests passed");
