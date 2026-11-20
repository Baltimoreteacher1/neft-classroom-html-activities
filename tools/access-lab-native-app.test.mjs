// The Language Page app layer (access-practice-lab/native-app/): the native contract with the Capacitor shells, the
// one-dictionary Spanish rule, and the promise that a plain browser loads and runs none of it.
// Run: node --test tools/access-lab-native-app.test.mjs
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { test } from "node:test";
import vm from "node:vm";

const root = new URL("../access-practice-lab/", import.meta.url);
const read = (p) => readFileSync(new URL(p, root), "utf8");
const dir = new URL("native-app/", root);
const { createNative, REMINDER_KEY, REMINDER_ID, DEV_REMINDER_ID, SHARE_URL, REMINDER_SCHEDULE } =
  await import(new URL("native.js", dir));
const { STRINGS, t, normLang } = await import(new URL("strings.js", dir));
const { readMode, writeMode, setMode, followPhoneLanguage, langChosen } = await import(
  new URL("lab-language.js", dir)
);

const NOW = Date.UTC(2026, 10, 20, 12, 0, 0);
const memory = (init = {}) => {
  const data = { ...init };
  return {
    data,
    getItem: (k) => (k in data ? data[k] : null),
    setItem: (k, v) => {
      data[k] = String(v);
    },
  };
};

/** A fake Capacitor. `perm` is what checkPermissions/requestPermissions answer; calls are recorded in order. */
function fakeCap({
  native = true,
  perm = "granted",
  requestAnswer = perm,
  via = "Plugins",
  app,
} = {}) {
  const calls = [];
  const state = { perm };
  const call = (plugin, method, options) => {
    calls.push({ plugin, method, options });
    if (method === "checkPermissions") return Promise.resolve({ display: state.perm });
    if (method === "requestPermissions") {
      state.perm = requestAnswer;
      return Promise.resolve({ display: requestAnswer });
    }
    if (method === "getInfo") return Promise.resolve(app ?? { version: "1.2.0", build: "34" });
    if (method === "addListener")
      return Promise.resolve({ remove: () => calls.push({ plugin, method: "remove" }) });
    return Promise.resolve({});
  };
  const proxy = (plugin) =>
    new Proxy({}, { get: (_, method) => (options) => call(plugin, String(method), options) });
  const cap = { isNativePlatform: () => native };
  if (via === "Plugins")
    cap.Plugins = Object.fromEntries(
      ["LocalNotifications", "App", "Share", "Network"].map((n) => [n, proxy(n)]),
    );
  else cap.nativePromise = (plugin, method, options) => call(plugin, method, options);
  return { cap, calls, state };
}
const make = (opts = {}, env = {}) => {
  const f = fakeCap(opts);
  const storage = env.storage ?? memory();
  return {
    ...f,
    storage,
    api: createNative({ cap: f.cap, storage, webShare: null, now: () => NOW, ...env }),
  };
};
const names = (calls) =>
  calls.filter((c) => c.plugin === "LocalNotifications").map((c) => c.method);

test("strings: every key exists in English and Spanish, with the same placeholders", () => {
  const en = Object.keys(STRINGS.en).sort();
  const es = Object.keys(STRINGS.es).sort();
  assert.deepEqual(es, en, "same keys in both languages");
  for (const key of en) {
    assert.ok(STRINGS.en[key].trim() && STRINGS.es[key].trim(), `${key} is not empty`);
    const holes = (s) => (s.match(/\{\w+\}/g) || []).sort().join();
    assert.equal(holes(STRINGS.es[key]), holes(STRINGS.en[key]), `${key} placeholders match`);
  }
});

test("strings: t falls back to English, then the key; bilingual mode reads English", () => {
  assert.equal(t("es", "sheet.close"), "Cerrar");
  assert.equal(t("bi", "sheet.close"), "Close");
  assert.equal(t("fr", "sheet.close"), "Close");
  assert.equal(t("es", "version.label", { version: "1.0 (3)" }), "Versión de la app: 1.0 (3)");
  assert.equal(t("en", "no.such.key"), "no.such.key");
  assert.equal(normLang("es"), "es");
  assert.equal(normLang("bi"), "en");
});

test("strings: the reminder copy is exactly the agreed words", () => {
  assert.equal(t("en", "reminder.title"), "Time to practice");
  assert.equal(t("en", "reminder.body"), "Ten minutes of English together this week.");
  assert.equal(t("es", "reminder.title"), "Hora de practicar");
  assert.equal(t("es", "reminder.body"), "Diez minutos de inglés juntos esta semana.");
});

test("reminder: loading and reading state never ask for permission", async () => {
  for (const pref of [undefined, "on", "off"]) {
    const { api, calls } = make(
      { perm: "prompt" },
      { storage: memory(pref ? { [REMINDER_KEY]: pref } : {}) },
    );
    await api.syncReminder("en");
    await api.reminderState();
    assert.ok(!names(calls).includes("requestPermissions"), `pref ${pref}`);
  }
});

test("reminder: default is off and nothing is scheduled", async () => {
  const { api, calls } = make();
  assert.equal(api.reminderPref(), "off");
  const out = await api.syncReminder("en");
  assert.equal(out.scheduled, false);
  assert.deepEqual(names(calls), []);
});

test("reminder: turning on asks once, stores on, schedules Monday 17:00 weekly (id 4101) after a cancel", async () => {
  const { api, calls, storage } = make({ perm: "prompt", requestAnswer: "granted" });
  const out = await api.setReminder(true, "en");
  assert.deepEqual(out, { pref: "on" });
  assert.equal(storage.data[REMINDER_KEY], "on");
  assert.deepEqual(names(calls), ["requestPermissions", "cancel", "schedule"]);
  const scheduled = calls.find((c) => c.method === "schedule").options.notifications;
  assert.equal(scheduled.length, 1);
  assert.deepEqual(scheduled[0], {
    id: 4101,
    title: "Time to practice",
    body: "Ten minutes of English together this week.",
    isExactNotification: false,
    schedule: { on: { weekday: 2, hour: 17, minute: 0 }, allowWhileIdle: true },
  });
  assert.deepEqual(
    REMINDER_SCHEDULE,
    { weekday: 2, hour: 17, minute: 0 },
    "Capacitor weekday 1 = Sunday, so 2 = Monday",
  );
  assert.equal(REMINDER_ID, 4101);
  assert.ok(
    calls.find((c) => c.method === "cancel").options.notifications.some((n) => n.id === 4101),
  );
});

test("reminder: Spanish text comes from the lab language", async () => {
  const { api, calls } = make({ perm: "prompt", requestAnswer: "granted" });
  await api.setReminder(true, "es");
  const n = calls.find((c) => c.method === "schedule").options.notifications[0];
  assert.equal(n.title, "Hora de practicar");
  assert.equal(n.body, "Diez minutos de inglés juntos esta semana.");
});

test("reminder: denied permission turns the toggle off, stores off and schedules nothing", async () => {
  const { api, calls, storage } = make({ perm: "prompt", requestAnswer: "denied" });
  const out = await api.setReminder(true, "en");
  assert.deepEqual(out, { pref: "off", denied: true });
  assert.equal(storage.data[REMINDER_KEY], "off");
  assert.ok(!names(calls).includes("schedule"));
});

test("reminder: on + granted reschedules on every load and resume with exactly one live notification (idempotent)", async () => {
  const { api, calls } = make({ perm: "granted" }, { storage: memory({ [REMINDER_KEY]: "on" }) });
  await api.syncReminder("en");
  await api.syncReminder("en");
  await api.syncReminder("es");
  assert.deepEqual(names(calls), [
    "checkPermissions",
    "cancel",
    "schedule",
    "checkPermissions",
    "cancel",
    "schedule",
    "checkPermissions",
    "cancel",
    "schedule",
  ]);
  for (const c of calls.filter((x) => x.method === "schedule")) {
    assert.deepEqual(
      c.options.notifications.map((n) => n.id),
      [4101],
    );
  }
});

test("reminder: on but permission revoked later does not schedule and does not prompt", async () => {
  const { api, calls } = make({ perm: "denied" }, { storage: memory({ [REMINDER_KEY]: "on" }) });
  const out = await api.syncReminder("en");
  assert.equal(out.scheduled, false);
  assert.ok(!names(calls).includes("schedule") && !names(calls).includes("requestPermissions"));
  assert.deepEqual(await api.reminderState(), {
    supported: true,
    pref: "on",
    permission: "denied",
  });
});

test("reminder: turning off cancels 4101 and stores off", async () => {
  const { api, calls, storage } = make({}, { storage: memory({ [REMINDER_KEY]: "on" }) });
  assert.deepEqual(await api.setReminder(false, "en"), { pref: "off" });
  assert.equal(storage.data[REMINDER_KEY], "off");
  assert.deepEqual(names(calls), ["cancel"]);
  assert.ok(calls[0].options.notifications.some((n) => n.id === 4101));
});

test("reminder: a plugin error never leaves the preference on", async () => {
  const { cap } = fakeCap({ perm: "prompt", requestAnswer: "granted" });
  cap.Plugins.LocalNotifications = {
    requestPermissions: async () => ({ display: "granted" }),
    cancel: async () => {},
    schedule: async () => {
      throw new Error("boom");
    },
  };
  const storage = memory();
  const api = createNative({ cap, storage });
  assert.deepEqual(await api.setReminder(true, "en"), { pref: "off", error: true });
  assert.equal(storage.data[REMINDER_KEY], "off");
});

test("reminder: dev-only accelerated one-shot id 4102 at now+N seconds, only when the dev key is a positive integer", async () => {
  for (const [value, expectShot] of [
    ["30", true],
    ["0", false],
    ["-5", false],
    ["2.5", false],
    ["abc", false],
    [undefined, false],
  ]) {
    const { api, calls } = make(
      { perm: "granted" },
      {
        storage: memory({
          [REMINDER_KEY]: "on",
          ...(value ? { "ewl-dev-reminder-seconds": value } : {}),
        }),
      },
    );
    await api.syncReminder("en");
    const list = calls.find((c) => c.method === "schedule").options.notifications;
    assert.equal(
      list.some((n) => n.id === DEV_REMINDER_ID),
      expectShot,
      String(value),
    );
    assert.equal(list[0].id, 4101, "the weekly one is always first");
    for (const n of list)
      assert.equal(
        n.isExactNotification,
        false,
        `${n.id}: inexact, so Android never opens Settings`,
      );
    if (expectShot) {
      const shot = list.find((n) => n.id === 4102);
      assert.equal(shot.schedule.at.getTime(), NOW + 30_000);
      assert.equal(shot.isExactNotification, false);
    }
  }
  assert.ok(
    !/ewl-dev-reminder-seconds/.test(read("native-app/sheet.js") + read("native-app/boot.js")),
    "the UI never sets it",
  );
});

test("plugins are reached through Capacitor.nativePromise when the Plugins proxy is missing", async () => {
  const { api, calls } = make({ perm: "prompt", requestAnswer: "granted", via: "nativePromise" });
  await api.setReminder(true, "en");
  assert.deepEqual(
    calls.map((c) => `${c.plugin}.${c.method}`),
    [
      "LocalNotifications.requestPermissions",
      "LocalNotifications.cancel",
      "LocalNotifications.schedule",
    ],
  );
  assert.equal(await api.appVersion(), "1.2.0 (34)");
});

test("not native: every call is inert and nothing touches a plugin", async () => {
  const { api, calls } = make({ native: false });
  assert.equal(api.isNative(), false);
  assert.deepEqual(await api.setReminder(true, "en"), { pref: "off", error: true });
  assert.equal((await api.syncReminder("en")).scheduled, false);
  assert.deepEqual(await api.reminderState(), { supported: false, pref: "off" });
  assert.equal(await api.appVersion(), null);
  assert.equal(await api.share("en"), "unsupported");
  assert.deepEqual(calls, []);
  assert.equal(createNative({ cap: undefined, storage: memory() }).isNative(), false);
});

test("share: native Share plugin gets only the public URL plus the bilingual line", async () => {
  const { api, calls } = make({});
  assert.equal(await api.share("en"), "shared");
  const opts = calls.find((c) => c.plugin === "Share").options;
  assert.equal(opts.url, "https://thelanguagepage.com/");
  assert.equal(SHARE_URL, "https://thelanguagepage.com/");
  assert.deepEqual(Object.keys(opts).sort(), ["dialogTitle", "text", "title", "url"]);
  assert.match(opts.text, /English practice for families · Práctica de inglés para familias/);
});

test("share: falls back to navigator.share on the web, and reports cancel or no support", async () => {
  const seen = [];
  const web = make({ native: false }, { webShare: async (d) => void seen.push(d) });
  assert.equal(web.api.canShare(), true);
  assert.equal(await web.api.share("es"), "shared");
  assert.deepEqual(Object.keys(seen[0]).sort(), ["text", "title", "url"]);
  assert.equal(seen[0].url, "https://thelanguagepage.com/");
  const cancel = make(
    { native: false },
    {
      webShare: async () => {
        throw Object.assign(new Error("x"), { name: "AbortError" });
      },
    },
  );
  assert.equal(await cancel.api.share("en"), "cancelled");
  const none = make({ native: false }, { webShare: undefined });
  assert.equal(none.api.canShare(), false);
  assert.equal(await none.api.share("en"), "unsupported");
});

test("resume: the App resume listener runs the callback and can be removed", async () => {
  const f = fakeCap({});
  let handler;
  f.cap.Plugins.App = {
    addListener: (name, fn) => {
      handler = { name, fn };
      return Promise.resolve({ remove: () => (handler.removed = true) });
    },
  };
  const api = createNative({ cap: f.cap, storage: memory() });
  let n = 0;
  const off = api.onResume(() => n++);
  assert.equal(handler.name, "resume");
  handler.fn();
  assert.equal(n, 1);
  await off();
  assert.equal(handler.removed, true);
});

test("lab language: one key, one shape; the lab's own control is clicked, with a same-key fallback", async () => {
  assert.equal(readMode(memory()), "en");
  assert.equal(readMode(memory({ "accessPracticeLab:v1:prefs": '{"lang":"es"}' })), "es");
  assert.equal(readMode(memory({ "accessPracticeLab:v1:prefs": "{broken" })), "en");
  const storage = memory({
    "accessPracticeLab:v1:prefs": JSON.stringify({
      lang: "en",
      band: "6-8",
      tiers: { Listening: "B" },
    }),
  });
  writeMode("es", storage);
  assert.deepEqual(JSON.parse(storage.data["accessPracticeLab:v1:prefs"]), {
    lang: "es",
    band: "6-8",
    tiers: { Listening: "B" },
    langChosen: true,
  });
  assert.deepEqual(
    Object.keys(storage.data),
    ["accessPracticeLab:v1:prefs"],
    "no second language key",
  );

  // The lab handles the click: no fallback write, no reload.
  const handled = memory({ "accessPracticeLab:v1:prefs": '{"lang":"en"}' });
  const clicked = [];
  const doc = {
    body: { append() {} },
    createElement: () => ({
      setAttribute(k, v) {
        this[k] = v;
      },
      remove() {},
      click() {
        clicked.push(this["data-lang-mode"]);
        writeMode(this["data-lang-mode"], handled);
      },
    }),
  };
  globalThis.location = {
    reload: () => assert.fail("must not reload when the lab handled the click"),
  };
  assert.equal(await setMode("es", { doc, storage: handled }), "es");
  assert.deepEqual(clicked, ["es"]);
  assert.equal(await setMode("es", { doc, storage: handled }), "es", "already set: no click");
  assert.deepEqual(clicked, ["es"]);

  // The lab ignores the click: the same prefs object is written and the page reloads once.
  const ignored = memory({ "accessPracticeLab:v1:prefs": '{"lang":"en"}' });
  let reloads = 0;
  globalThis.location = { reload: () => reloads++ };
  const dead = {
    body: { append() {} },
    createElement: () => ({ setAttribute() {}, remove() {}, click() {} }),
  };
  assert.equal(await setMode("bi", { doc: dead, storage: ignored }), "bi");
  assert.equal(reloads, 1);
  assert.equal(
    await setMode("fr", { doc: dead, storage: ignored }),
    "bi",
    "unknown modes are refused",
  );
  delete globalThis.location;
});

/** A fake page whose lab handles [data-lang-mode] clicks the way main.js does: lang + langChosen, nothing else. */
function fakeLabDoc(storage, { hasControl = true, handles = true } = {}) {
  const clicks = [];
  const doc = {
    body: { append() {} },
    querySelector: () => (hasControl ? {} : null),
    createElement: () => ({
      setAttribute(k, v) {
        this[k] = v;
      },
      remove() {},
      click() {
        clicks.push(this["data-lang-mode"]);
        if (!handles) return;
        const prefs = JSON.parse(storage.getItem("accessPracticeLab:v1:prefs") || "{}");
        storage.setItem(
          "accessPracticeLab:v1:prefs",
          JSON.stringify({ ...prefs, lang: this["data-lang-mode"], langChosen: true }),
        );
      },
    }),
  };
  return { doc, clicks };
}

test("phone language: a Spanish phone opens the lab in Spanish through the lab's own control", async () => {
  for (const language of ["es-US", "es", "es-MX", "ES-419"]) {
    const storage = memory();
    const { doc, clicks } = fakeLabDoc(storage);
    globalThis.location = { reload: () => assert.fail("never reloads") };
    assert.equal(
      await followPhoneLanguage({ nav: { language }, doc, storage, waitMs: 300 }),
      "switched",
      language,
    );
    assert.deepEqual(clicks, ["es"]);
    assert.equal(readMode(storage), "es");
    assert.equal(langChosen(storage), true, "as if the family tapped ES");
  }
  delete globalThis.location;
});

test("phone language: English and other phones are left alone", async () => {
  for (const language of ["en-US", "en", "fr-FR", "est", "", undefined]) {
    const storage = memory();
    const { doc, clicks } = fakeLabDoc(storage);
    assert.equal(
      await followPhoneLanguage({ nav: { language }, doc, storage, waitMs: 300 }),
      "skipped",
      String(language),
    );
    assert.deepEqual(clicks, []);
    assert.deepEqual(storage.data, {}, "writes nothing");
  }
});

test("phone language: a choice already made is never overridden", async () => {
  for (const prefs of [
    { lang: "en", langChosen: true },
    { lang: "bi", langChosen: true },
    { lang: "es", langChosen: true },
  ]) {
    const storage = memory({ "accessPracticeLab:v1:prefs": JSON.stringify(prefs) });
    const { doc, clicks } = fakeLabDoc(storage);
    assert.equal(
      await followPhoneLanguage({ nav: { language: "es-US" }, doc, storage, waitMs: 300 }),
      "skipped",
    );
    assert.deepEqual(clicks, []);
    assert.deepEqual(JSON.parse(storage.data["accessPracticeLab:v1:prefs"]), prefs);
  }
});

test("phone language: seeded lang without langChosen still goes through the control; a lab that never starts is left untouched", async () => {
  const seeded = memory({ "accessPracticeLab:v1:prefs": '{"lang":"es"}' });
  const a = fakeLabDoc(seeded);
  assert.equal(
    await followPhoneLanguage({
      nav: { language: "es-US" },
      doc: a.doc,
      storage: seeded,
      waitMs: 300,
    }),
    "switched",
  );
  assert.equal(langChosen(seeded), true);
  const storage = memory();
  const none = fakeLabDoc(storage, { hasControl: false });
  assert.equal(
    await followPhoneLanguage({ nav: { language: "es-US" }, doc: none.doc, storage, waitMs: 250 }),
    "no-lab",
  );
  const ignored = fakeLabDoc(storage, { handles: false });
  globalThis.location = { reload: () => assert.fail("no reload, no hand-written prefs") };
  await followPhoneLanguage({ nav: { language: "es-US" }, doc: ignored.doc, storage, waitMs: 300 });
  assert.deepEqual(storage.data, {}, "prefs are never written by the app layer here");
  delete globalThis.location;
});

test("the loader does nothing in a browser and imports boot.js only inside the app", async () => {
  // Plain web: no Capacitor, a Capacitor that is not native, and a broken Capacitor all return before touching anything.
  for (const Capacitor of [
    undefined,
    { isNativePlatform: () => false },
    {},
    { isNativePlatform: 1 },
  ]) {
    const touched = [];
    const sandbox = {
      window: { Capacitor },
      document: new Proxy({}, { get: (_, k) => touched.push(k) }),
    };
    vm.runInNewContext(read("native-app/native-app.js"), sandbox);
    assert.deepEqual(touched, [], "no DOM access in a browser");
  }
  const src = read("native-app/native-app.js");
  assert.match(src, /import\("\/access-practice-lab\/native-app\/boot\.js"\)/);
});

test("the lab page loads exactly one app script, deferred, and its shell copy matches", () => {
  const tag = '<script defer src="/access-practice-lab/native-app/native-app.js"></script>';
  const index = read("index.html");
  assert.equal(index.split(tag).length - 1, 1, "one tag in index.html");
  assert.equal(read("app-shell"), index, "app-shell mirrors index.html");
  assert.ok(
    index.indexOf("home-link.js") < index.indexOf(tag),
    "after the shared home button script",
  );
});

test("the app layer adds no network call, tracker, third-party script or remote URL", () => {
  const files = readdirSync(dir).filter((f) => /\.(js|css)$/.test(f));
  assert.ok(files.length >= 6);
  for (const f of files) {
    const src = read(`native-app/${f}`);
    assert.ok(src.split("\n").length <= 500, `${f} is at most 500 lines`);
    assert.doesNotMatch(
      src,
      /\bfetch\s*\(|XMLHttpRequest|sendBeacon|WebSocket|EventSource|importScripts/,
      `${f}: no network API`,
    );
    assert.doesNotMatch(src, /document\.cookie|indexedDB/, `${f}: no cookie or database`);
    for (const url of src.match(/https?:\/\/[^\s"'`)]+/g) || [])
      assert.equal(url, "https://thelanguagepage.com/", `${f}: only the public site URL (${url})`);
  }
  const storageKeys = [
    ...new Set(read("native-app/native.js").match(/"(ewl-[a-z-]+(?:-v1)?)"/g) || []),
  ].sort();
  assert.deepEqual(storageKeys, ['"ewl-dev-reminder-seconds"', '"ewl-lp-reminder-v1"']);
});

test("the privacy link points at the lab's own privacy page, which exists as a route", () => {
  assert.match(read("native-app/sheet.js"), /PRIVACY_PATH = "\/access-practice-lab\/privacy"/);
  assert.match(read("src/main.js"), /a === "privacy"/);
});
