// "My class" card on Home: opt-in join by class code (or the ?class= link a QR carries), the student key to sign
// in on another device, sync status, the class goal meter, live-session entry and the family digest link.
// Logic lives in class-link.js; this file only draws and wires.
import {
  activeRooms,
  cleanLink,
  classInfo,
  createSync,
  digestUrl,
  joinClass,
  loadLink,
  saveLink,
  whoAmI,
} from "./class-link.js";
import { getLang, t } from "./i18n.js";

const ERRORS = {
  "invalid-code": "Check the class code: it has 6 letters and numbers.",
  "class-not-found": "No class has that code. Check it with your teacher.",
  "alias-too-short": "Your nickname needs at least 2 letters.",
  "alias-too-long": "Your nickname can be 20 letters at most.",
  "alias-contact": "Use a nickname, not an email or phone number.",
  "alias-characters": "Use letters, numbers, spaces or - only.",
  "alias-too-many-words": "Use one or two words, not your full name.",
  "alias-taken":
    "Someone in this class already uses that nickname. If it is you, type your student key.",
  "wrong-student-key": "That student key does not match. Ask your teacher for a new one.",
  "class-full": "This class is full. Ask your teacher.",
  offline: "You are offline. Your progress is safe on this device and will sync later.",
  "backend-not-configured":
    "Class sync is not available right now. Your progress stays on this device.",
};
/** Keys passed to t() by variable (error lines, room states), for tools/fluency-i18n.test.mjs. */
export const CLASS_I18N_KEYS = [...Object.values(ERRORS), "lobby", "live", "paused", "ended"];
const errorText = (code) =>
  t(ERRORS[code] || "Something went wrong. Your progress is safe on this device.");

const el = (tag, attrs = {}, text = null) => {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === "class") node.className = v;
    else if (v !== false && v != null) node.setAttribute(k, v === true ? "" : v);
  }
  if (text != null) node.textContent = text;
  return node;
};

function fmtTime(ms) {
  try {
    return new Date(ms).toLocaleString(getLang() === "es" ? "es" : "en", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return new Date(ms).toISOString();
  }
}

export function goalMeter(goal) {
  const box = el("div", { class: "cl-goal" });
  if (!goal) return box;
  box.append(
    el(
      "p",
      {},
      t("Class goal: {label} — {value} of {target}", {
        label: goal.label || t("skills we can do on our own"),
        value: goal.value,
        target: goal.target,
      }),
    ),
  );
  const bar = el("div", {
    class: "cl-goal-bar",
    role: "progressbar",
    "aria-valuemin": "0",
    "aria-valuemax": String(goal.target),
    "aria-valuenow": String(Math.min(goal.value, goal.target)),
    "aria-label": t("Class goal"),
  });
  const fill = el("span");
  fill.style.inlineSize = `${goal.percent}%`;
  bar.append(fill);
  box.append(bar);
  if (goal.reached) box.append(el("p", {}, t("We reached our class goal together!")));
  return box;
}

/**
 * @param {HTMLElement} host
 * @param {{ getBackup: () => object, getSummary: () => object, hasLocalProgress: () => boolean,
 *   applyBackup: (raw: object) => void, downloadCurrent: () => void, announce?: (msg: string) => void,
 *   fetchImpl?: typeof fetch, location?: Location }} deps
 */
export function mountClassLink(host, deps) {
  if (!host) return null;
  const fetchImpl = deps.fetchImpl || ((...a) => fetch(...a));
  const loc = deps.location || window.location;
  const announce = deps.announce || (() => {});
  let statusLine = null;
  let roomsTimer = null;
  const sync = createSync({
    fetchImpl,
    getBackup: deps.getBackup,
    getSummary: deps.getSummary,
    hasLocalProgress: deps.hasLocalProgress,
    onStatus: (s) => {
      if (!statusLine) return;
      statusLine.textContent =
        s.state === "synced"
          ? t("Saved to your class at {time}.", { time: fmtTime(s.at) })
          : s.state === "offline"
            ? errorText("offline")
            : t("Not synced yet. Your progress is safe on this device.");
    },
    onRemoteNewer: (remote, decision) => {
      if (decision === "restore") {
        deps.applyBackup(remote.data);
        sync.acceptRemote(remote.updatedAt);
        announce(t("Your class progress is on this device now."));
        render();
      } else askMerge(remote);
    },
  });

  function askMerge(remote) {
    const dialog = el("dialog", { class: "cl-dialog", "aria-labelledby": "cl-merge-title" });
    dialog.append(
      el("h2", { id: "cl-merge-title" }, t("Your class copy is newer")),
      el(
        "p",
        {},
        t(
          "Your class saved progress on {time} from another device. Use it here? This device's progress downloads as a backup file first.",
          { time: fmtTime(remote.updatedAt) },
        ),
      ),
    );
    const row = el("div", { class: "cl-row" });
    const use = el("button", { type: "button", class: "primary-action" }, t("Use my class copy"));
    const keep = el(
      "button",
      { type: "button", class: "outline-action" },
      t("Keep this device's progress"),
    );
    use.addEventListener("click", () => {
      deps.downloadCurrent();
      deps.applyBackup(remote.data);
      sync.acceptRemote(remote.updatedAt);
      dialog.close();
      dialog.remove();
      announce(t("Your class progress is on this device now."));
      render();
    });
    keep.addEventListener("click", () => {
      sync.keepLocal(remote.updatedAt);
      dialog.close();
      dialog.remove();
    });
    row.append(use, keep);
    dialog.append(row);
    host.append(dialog);
    if (typeof dialog.showModal === "function") dialog.showModal();
    else dialog.setAttribute("open", "");
  }

  function renderJoin(prefill = "") {
    host.replaceChildren();
    host.append(
      el("h2", { id: "class-link-title" }, t("Join your class")),
      el(
        "p",
        {},
        t(
          "Optional. Join with the code your teacher gives you, and your progress follows you to any device. Use a nickname, not your real name.",
        ),
      ),
    );
    const form = el("form", { "aria-labelledby": "class-link-title", novalidate: true });
    const code = el("input", {
      name: "code",
      autocomplete: "off",
      inputmode: "text",
      maxlength: "8",
      required: true,
      value: prefill,
    });
    const alias = el("input", {
      name: "alias",
      autocomplete: "nickname",
      maxlength: "20",
      required: true,
    });
    const key = el("input", { name: "studentKey", autocomplete: "off", maxlength: "10" });
    const lab = (text, input) => {
      const l = el("label", {}, null);
      l.append(el("span", {}, text), input);
      return l;
    };
    form.append(
      lab(t("Class code"), code),
      lab(t("Nickname"), alias),
      lab(t("Student key (only if you joined on another device)"), key),
      el("button", { type: "submit", class: "primary-action" }, t("Join class")),
    );
    const error = el("p", { class: "cl-error", role: "alert" });
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      error.textContent = "";
      const res = await joinClass(
        { code: code.value, alias: alias.value, studentKey: key.value.trim() || undefined },
        fetchImpl,
      );
      if (!res.ok) {
        error.textContent = errorText(res.error);
        return;
      }
      saveLink(
        cleanLink({
          code: normalize(code.value),
          studentId: res.studentId,
          studentKey: res.studentKey,
          alias: res.alias,
          title: res.title,
        }),
      );
      announce(t("You joined {title}.", { title: res.title }));
      render();
      await sync.pull();
    });
    host.append(form, error);
    if (prefill) alias.focus();
  }

  const normalize = (value) =>
    String(value)
      .toUpperCase()
      .replace(/[^A-Z2-9]/g, "");

  async function renderLinked(link) {
    host.replaceChildren();
    host.append(
      el(
        "h2",
        { id: "class-link-title" },
        t("My class: {title}", { title: link.title || link.code }),
      ),
      el("p", {}, t("You are {alias} in this class.", { alias: link.alias })),
    );
    const keyRow = el("p");
    keyRow.append(
      el("span", {}, `${t("Your student key (write it down to sign in on another device):")} `),
      el("span", { class: "cl-key" }, link.studentKey),
    );
    host.append(keyRow);
    statusLine = el(
      "p",
      { class: "cl-status", role: "status" },
      link.syncedAt
        ? t("Saved to your class at {time}.", { time: fmtTime(link.syncedAt) })
        : t("Not synced yet. Your progress is safe on this device."),
    );
    host.append(statusLine);
    const goalBox = el("div");
    const liveBox = el("div", { "aria-live": "polite" });
    host.append(goalBox, liveBox);
    const row = el("div", { class: "cl-row" });
    const family = el(
      "button",
      { type: "button", class: "outline-action" },
      t("Copy my family link"),
    );
    const leave = el(
      "button",
      { type: "button", class: "outline-action" },
      t("Leave class on this device"),
    );
    family.addEventListener("click", async () => {
      const me = await whoAmI(link, fetchImpl);
      if (!me.ok) return announce(errorText(me.error));
      const url = digestUrl(loc.origin, link, me.familyToken, getLang());
      try {
        await navigator.clipboard.writeText(url);
        announce(t("Family link copied. Share it with your family."));
      } catch {
        window.prompt(t("Copy this family link:"), url);
      }
    });
    leave.addEventListener("click", () => {
      if (
        !window.confirm(
          t(
            "Leave this class on this device? Your progress stays on this device and in your class.",
          ),
        )
      )
        return;
      saveLink(null);
      clearInterval(roomsTimer);
      render();
    });
    row.append(family, leave);
    host.append(row);
    const info = await classInfo(link.code, fetchImpl);
    if (info.ok) goalBox.replaceChildren(goalMeter(info.goal));
    const refreshRooms = async () => {
      const res = await activeRooms(link, fetchImpl);
      liveBox.replaceChildren();
      for (const room of res.ok ? res.rooms : []) {
        const card = el("div", { class: "cl-live" });
        card.append(
          el(
            "p",
            {},
            room.kind === "game"
              ? t("Your class game is open.")
              : room.kind === "workspace"
                ? t("Your teacher opened a live workspace.")
                : t("Your teacher started a live session."),
          ),
        );
        card.append(
          el(
            "a",
            {
              class: "primary-action",
              href: `class/live.html?room=${encodeURIComponent(room.roomId)}`,
            },
            t("Join now"),
          ),
        );
        liveBox.append(card);
      }
    };
    await refreshRooms();
    clearInterval(roomsTimer);
    roomsTimer = setInterval(() => {
      if (document.visibilityState === "visible" && host.isConnected) refreshRooms();
    }, 30_000);
  }

  function render() {
    const link = loadLink();
    if (link) renderLinked(link);
    else renderJoin(normalize(new URLSearchParams(loc.search).get("class") || ""));
  }

  host.hidden = false;
  render();
  if (loadLink()) sync.pull();
  if (new URLSearchParams(loc.search).get("class")) host.scrollIntoView?.({ block: "center" });
  window.addEventListener("fluency-lang-changed", render);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") sync.push();
  });
  return {
    ...sync,
    stop() {
      sync.stop();
      clearInterval(roomsTimer);
    },
  };
}
