// Native glue for the Language Page app (Capacitor). Every call is feature-detected, so a plain browser never reaches it.
// The shells provide four official plugins: @capacitor/local-notifications, @capacitor/app, @capacitor/share,
// @capacitor/network.
//
// Contract with the shells (pinned by tools/access-lab-native-app.test.mjs):
//   - Plugins are read from Capacitor.Plugins.<Name>; if that proxy is missing, calls go through
//     Capacitor.nativePromise(<Name>, <method>, <options>).
//   - ewl-lp-reminder-v1 = "on" | "off" (absent = off). Permission is requested ONLY inside setReminder(true).
//   - Reminder = notification id 4101, weekly Monday 17:00 device time (Capacitor weekday 1 = Sunday, so 2 = Monday),
//     rescheduled idempotently (cancel, then schedule) on load and on App `resume`.
//   - Every notification carries isExactNotification:false. local-notifications 8.x defaults to exact alarms, and the
//     Android build strips SCHEDULE_EXACT_ALARM (Play policy): without the flag schedule() sends the user to a system
//     Settings screen and never resolves. Android therefore delivers inside an inexact window (up to about 1 hour).
//   - Dev only: localStorage["ewl-dev-reminder-seconds"] = positive integer N also schedules one-shot id 4102 at now+N s.
import { t } from "./strings.js";

export const REMINDER_KEY = "ewl-lp-reminder-v1";
export const DEV_SECONDS_KEY = "ewl-dev-reminder-seconds";
export const REMINDER_ID = 4101;
export const DEV_REMINDER_ID = 4102;
export const REMINDER_SCHEDULE = { weekday: 2, hour: 17, minute: 0 };
export const SHARE_URL = "https://thelanguagepage.com/";

/** Builds the native API over a Capacitor object (or none). `env` exists so tests can pass fakes. */
export function createNative(env = {}) {
  const cap = "cap" in env ? env.cap : globalThis.Capacitor;
  const storage = env.storage ?? globalThis.localStorage;
  const webShare =
    "webShare" in env ? env.webShare : globalThis.navigator?.share?.bind(globalThis.navigator);
  const doc = "doc" in env ? env.doc : globalThis.document;
  const now = env.now ?? (() => Date.now());

  const isNative = () =>
    !!(cap && typeof cap.isNativePlatform === "function" && cap.isNativePlatform());
  const read = (key) => {
    try {
      return storage.getItem(key);
    } catch {
      return null;
    }
  };
  const write = (key, value) => {
    try {
      storage.setItem(key, value);
    } catch {}
  };

  function plugin(name) {
    if (cap?.Plugins?.[name]) return cap.Plugins[name];
    if (cap && typeof cap.nativePromise === "function")
      return new Proxy(
        {},
        { get: (_, method) => (options) => cap.nativePromise(name, String(method), options || {}) },
      );
    return null;
  }

  // Scheduling calls never overlap: a resume event during a toggle must not interleave cancel/schedule pairs.
  let queue = Promise.resolve();
  const serial = (job) => {
    const run = queue.then(job, job);
    queue = run.catch(() => {});
    return run;
  };

  const reminderPref = () => (read(REMINDER_KEY) === "on" ? "on" : "off");
  const cancelAll = (LN) =>
    LN.cancel({ notifications: [{ id: REMINDER_ID }, { id: DEV_REMINDER_ID }] });

  async function permission() {
    const LN = plugin("LocalNotifications");
    if (!LN) return "unknown";
    try {
      return (await LN.checkPermissions()).display;
    } catch {
      return "unknown";
    }
  }

  function devSeconds() {
    const n = Number(read(DEV_SECONDS_KEY));
    return Number.isInteger(n) && n > 0 ? n : 0;
  }

  async function schedule(lang) {
    const LN = plugin("LocalNotifications");
    await cancelAll(LN);
    const title = t(lang, "reminder.title");
    const body = t(lang, "reminder.body");
    const notifications = [
      {
        id: REMINDER_ID,
        title,
        body,
        isExactNotification: false,
        schedule: { on: { ...REMINDER_SCHEDULE }, allowWhileIdle: true },
      },
    ];
    const seconds = devSeconds();
    if (seconds)
      notifications.push({
        id: DEV_REMINDER_ID,
        title,
        body,
        isExactNotification: false,
        schedule: { at: new Date(now() + seconds * 1000), allowWhileIdle: true },
      });
    await LN.schedule({ notifications });
  }

  /** Load / resume / language change: reschedule if the preference is on AND permission is already granted. */
  const syncReminder = (lang) =>
    serial(async () => {
      if (!isNative() || reminderPref() !== "on") return { scheduled: false, pref: reminderPref() };
      if ((await permission()) !== "granted")
        return { scheduled: false, pref: "on", permission: "denied" };
      try {
        await schedule(lang);
        return { scheduled: true, pref: "on", permission: "granted" };
      } catch {
        return { scheduled: false, pref: "on", error: true };
      }
    });

  /** The toggle. Only turning on may ask the system for permission. Returns { pref, denied?, error? }. */
  const setReminder = (on, lang) =>
    serial(async () => {
      const LN = isNative() ? plugin("LocalNotifications") : null;
      if (!LN) return { pref: "off", error: true };
      try {
        if (!on) {
          write(REMINDER_KEY, "off");
          await cancelAll(LN);
          return { pref: "off" };
        }
        const asked = await LN.requestPermissions();
        if (asked?.display !== "granted") {
          write(REMINDER_KEY, "off");
          return { pref: "off", denied: true };
        }
        write(REMINDER_KEY, "on");
        await schedule(lang);
        return { pref: "on" };
      } catch {
        write(REMINDER_KEY, "off");
        return { pref: "off", error: true };
      }
    });

  /** For the settings row: { supported, pref, permission }. Never prompts. */
  async function reminderState() {
    if (!isNative() || !plugin("LocalNotifications")) return { supported: false, pref: "off" };
    return { supported: true, pref: reminderPref(), permission: await permission() };
  }

  /** "1.2.0 (34)" from the App plugin, or null. */
  async function appVersion() {
    const App = isNative() ? plugin("App") : null;
    if (!App) return null;
    try {
      const info = await App.getInfo();
      if (!info?.version) return null;
      return info.build ? `${info.version} (${info.build})` : String(info.version);
    } catch {
      return null;
    }
  }

  /** Calls fn when the app returns to the foreground: the App `resume` event, else document visibility. */
  function onResume(fn) {
    const App = isNative() ? plugin("App") : null;
    if (App && typeof App.addListener === "function" && cap?.Plugins?.App) {
      const handle = App.addListener("resume", fn);
      return () => Promise.resolve(handle).then((h) => h?.remove?.());
    }
    if (!doc) return () => {};
    const onVisible = () => doc.visibilityState === "visible" && fn();
    doc.addEventListener("visibilitychange", onVisible);
    return () => doc.removeEventListener("visibilitychange", onVisible);
  }

  const canShare = () => (isNative() && !!plugin("Share")) || typeof webShare === "function";

  /** Shares only the public site URL plus a short line. Returns "shared" | "cancelled" | "unsupported". */
  async function share(lang) {
    const payload = { title: t(lang, "share.title"), text: t(lang, "share.text"), url: SHARE_URL };
    try {
      if (isNative() && plugin("Share")) {
        await plugin("Share").share({ ...payload, dialogTitle: payload.title });
        return "shared";
      }
      if (typeof webShare === "function") {
        await webShare(payload);
        return "shared";
      }
    } catch (error) {
      return /cancel|abort/i.test(`${error?.name} ${error?.message}`) ? "cancelled" : "unsupported";
    }
    return "unsupported";
  }

  /** Connectivity: native Network plugin when present, else navigator.onLine. */
  async function isOnline() {
    const Net = isNative() ? plugin("Network") : null;
    if (Net) {
      try {
        return !!(await Net.getStatus()).connected;
      } catch {}
    }
    return globalThis.navigator?.onLine !== false;
  }

  function onNetworkChange(fn) {
    const Net = isNative() ? plugin("Network") : null;
    if (Net && typeof Net.addListener === "function" && cap?.Plugins?.Network) {
      const handle = Net.addListener("networkStatusChange", (s) => fn(!!s?.connected));
      return () => Promise.resolve(handle).then((h) => h?.remove?.());
    }
    return () => {};
  }

  return {
    isNative,
    reminderPref,
    reminderState,
    setReminder,
    syncReminder,
    appVersion,
    onResume,
    canShare,
    share,
    isOnline,
    onNetworkChange,
  };
}
