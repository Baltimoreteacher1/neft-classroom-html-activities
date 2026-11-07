// Teacher side of the Fluency Lab class platform (docs/class-platform.md): create a class, show its code and QR,
// watch "who needs help now" (intervention-engine.js hand-offs, refreshed by polling), set the class goal, and run
// live rooms (teacher-paced session, class game, live workspaces). The site teacher key is kept for this tab only
// (sessionStorage); a class's own passcode is remembered on this device so a projector can reopen one class.
import {
  goalProgress,
  joinUrl,
} from "../../../shared/class-platform/contract.js";
import { qrSvg } from "../../../shared/qr/qr-code.mjs";
import { createTeacherClient } from "../../../shared/class-platform/client.js";
import { getLang, setLang, t, translatePage } from "../i18n.js";
import { ALL_SKILLS } from "../problem-bank.js";
import {
  escapeHtml,
  readLocal,
  writeLocal,
} from "../school-tools.js";
import { roomProblem } from "./live.js";
import { skillLabel } from "./skill-label.js";

export { skillLabel };

export const CLASSES_KEY = "ewl-fluency-class-teacher-v1";
const SITE_KEY = "ewl-fluency-class-site-key";
export const ROSTER_POLL_MS = 10_000;
export const ROOM_POLL_MS = 3000;
const API = "/api/class";
const esc = escapeHtml;


/** Students whose intervention handed over to the teacher, most recently active first. */
export function needsHelpNow(students) {
  return students
    .map((s) => ({ ...s, help: s.docs?.fluency?.summary?.needsTeacher || [] }))
    .filter((s) => s.help.length)
    .sort((a, b) => b.lastSeen - a.lastSeen);
}

const sessionKey = () => {
  try {
    return sessionStorage.getItem(SITE_KEY) || "";
  } catch {
    return "";
  }
};

export const createTeacherApi = ({ fetchImpl, code, passcode }) =>
  createTeacherClient({ fetchImpl, code, passcode, siteKey: sessionKey });

export function rosterRowsHtml(students, now = Date.now()) {
  if (!students.length)
    return `<tr><td colspan="6">${esc(t("No students yet. Share the class code or QR."))}</td></tr>`;
  return students
    .map((s) => {
      const sum = s.docs?.fluency?.summary || {};
      const mins = Math.max(0, Math.round((now - s.lastSeen) / 60000));
      const seen =
        mins < 2
          ? t("just now")
          : mins < 120
            ? t("{n} min ago", { n: mins })
            : t("{n} h ago", { n: Math.round(mins / 60) });
      return `<tr><th scope="row">${esc(s.alias)}</th><td>${esc(seen)}</td><td>${esc(sum.activeSkill ? skillLabel(sum.activeSkill) : "—")}</td><td>${Number(sum.mastered?.length || 0)}</td><td>${Number(sum.weekDays || 0)}</td><td><button type="button" class="outline-action" data-reset="${esc(s.studentId)}">${esc(t("New student key"))}</button> <button type="button" class="outline-action" data-remove="${esc(s.studentId)}">${esc(t("Remove"))}</button></td></tr>`;
    })
    .join("");
}

function skillOptions(grade) {
  return ALL_SKILLS.filter((s) => s.grade === grade)
    .map((s) => `<option value="${esc(s.id)}">${esc(s.title || s.id)}</option>`)
    .join("");
}

export function mountTeacher(
  root,
  { fetchImpl = (...a) => fetch(...a), location = window.location } = {},
) {
  const $ = (sel) => root.querySelector(sel);
  const classes = () =>
    Array.isArray(readLocal(CLASSES_KEY, [])) ? readLocal(CLASSES_KEY, []) : [];
  let api = null;
  let current = null;
  let rosterTimer = null;
  let roomTimer = null;
  let room = null;

  const say = (msg) => {
    $("#ct-live").textContent = msg;
  };

  function renderSaved() {
    const list = classes();
    $("#ct-saved").innerHTML = list.length
      ? list
          .map(
            (c) =>
              `<li><button type="button" class="outline-action" data-open="${esc(c.code)}">${esc(t("Open {title} ({code})", { title: c.title, code: c.code }))}</button></li>`,
          )
          .join("")
      : `<li>${esc(t("No classes on this device yet."))}</li>`;
  }

  async function open(code, passcode, title = "") {
    api = createTeacherApi({ fetchImpl, code, passcode });
    const res = await api.roster();
    if (!res.ok) {
      say(
        res.httpStatus === 401
          ? t("That class code and passcode do not match.")
          : res.httpStatus === 404
            ? t("No class has that code.")
            : t("The class server is not available right now."),
      );
      return false;
    }
    current = { code, passcode, title: res.title || title };
    writeLocal(
      CLASSES_KEY,
      [current, ...classes().filter((c) => c.code !== code)].slice(0, 12),
    );
    $("#ct-dashboard").hidden = false;
    $("#ct-title").textContent = t("Class: {title}", { title: current.title });
    const url = joinUrl(
      new URL("/math/fluency-lab/", location.origin).toString(),
      code,
    );
    $("#ct-join").innerHTML =
      `<p>${esc(t("Class code"))}: <strong class="cl-key">${esc(code)}</strong> · ${esc(t("Teacher passcode"))}: <strong class="cl-key">${esc(passcode || "—")}</strong></p><p><a href="${esc(url)}">${esc(url)}</a></p>${qrSvg(url, { px: 180, label: t("QR code to join {title}", { title: current.title }) })}`;
    drawRoster(res);
    clearInterval(rosterTimer);
    rosterTimer = setInterval(async () => {
      if (document.visibilityState !== "visible") return;
      const next = await api.roster();
      if (next.ok) drawRoster(next);
    }, ROSTER_POLL_MS);
    renderSaved();
    return true;
  }

  function drawRoster(res) {
    const help = needsHelpNow(res.students);
    $("#ct-help").innerHTML = help.length
      ? help
          .map(
            (s) =>
              `<li><strong>${esc(s.alias)}</strong>: ${s.help.map((h) => esc(skillLabel(h.skill))).join(", ")}</li>`,
          )
          .join("")
      : `<li>${esc(t("Nobody is waiting for you right now."))}</li>`;
    $("#ct-roster").innerHTML = rosterRowsHtml(res.students);
    const goal = goalProgress(
      res.settings?.goal,
      res.students.map((s) => s.docs?.fluency?.summary || {}),
    );
    $("#ct-goal-now").textContent = goal
      ? t("Class goal: {label} — {value} of {target}", {
          label: goal.label || t("skills we can do on our own"),
          value: goal.value,
          target: goal.target,
        })
      : t("No class goal yet.");
  }

  async function pollRoom() {
    if (!room) return;
    const d = await api.detail(room.roomId);
    if (!d.ok) return;
    room = { ...room, ...d };
    const problem =
      d.kind === "workspace" ? null : roomProblem(d.config, d.item);
    $("#ct-room-state").textContent = t(
      "{status} · problem {n} of {count} · {answered} of {students} answered",
      {
        status: t(d.status),
        n: d.item + 1,
        count: d.config.count,
        answered: d.answered,
        students: d.students,
      },
    );
    $("#ct-room-problem").textContent = problem ? problem.question : "";
    $("#ct-room-wall").innerHTML = d.wall
      .map((w) => `<li>${esc(w.answer)}: ${w.count}</li>`)
      .join("");
    $("#ct-room-score").textContent =
      d.kind === "game"
        ? t("Class score: {score}. Team points: {teams}.", {
            score: d.classScore,
            teams: d.teamScores.join(" · "),
          })
        : "";
    $("#ct-room-work").innerHTML =
      d.kind === "workspace"
        ? d.responses
            .filter((r) => r.workspace)
            .map(
              (r) =>
                `<figure class="ct-work"><figcaption>${esc(r.alias)}</figcaption><pre>${esc((r.workspace.lines || []).join("\n"))}</pre></figure>`,
            )
            .join("") || `<p>${esc(t("No work shared yet."))}</p>`
        : "";
  }

  root.addEventListener("click", async (event) => {
    const btn = event.target.closest("button");
    if (!btn) return;
    if (btn.dataset.open) {
      const saved = classes().find((c) => c.code === btn.dataset.open);
      if (saved) open(saved.code, saved.passcode, saved.title);
    } else if (btn.dataset.reset && api) {
      const res = await api.resetStudent(btn.dataset.reset);
      if (res.ok)
        window.alert(
          t(
            "New student key: {key}. Give it to the student; the old key and family link stop working.",
            { key: res.studentKey },
          ),
        );
    } else if (btn.dataset.remove && api) {
      if (
        window.confirm(
          t(
            "Remove this student and their class data? Their progress stays on their own device.",
          ),
        )
      )
        await api.removeStudent(btn.dataset.remove);
    } else if (btn.dataset.room && api) {
      const grade = Number($("#ct-room-grade").value);
      const res = await api.openRoom(btn.dataset.room, {
        skill: $("#ct-room-skill").value,
        grade,
        count: Number($("#ct-room-count").value) || 8,
        teams: Number($("#ct-room-teams").value) || 2,
        title: btn.textContent.trim(),
      });
      if (!res.ok) return say(t("The room could not open."));
      room = { roomId: res.roomId, kind: res.kind };
      $("#ct-room").hidden = false;
      clearInterval(roomTimer);
      roomTimer = setInterval(
        () => document.visibilityState === "visible" && pollRoom(),
        ROOM_POLL_MS,
      );
      pollRoom();
    } else if (btn.dataset.control && room) {
      const c = btn.dataset.control;
      const change =
        c === "next"
          ? { item: Math.min(room.item + 1, room.config.count - 1) }
          : c === "prev"
            ? { item: Math.max(room.item - 1, 0) }
            : c === "reveal"
              ? { reveal: !room.reveal }
              : c === "snapshot"
                ? { snapshot: true }
                : { status: c };
      await api.control(room.roomId, change);
      pollRoom();
    } else if (btn.id === "ct-delete" && api) {
      const typed = window.prompt(
        t("Type the class code {code} to delete this class and all its data.", {
          code: current.code,
        }),
      );
      if (!typed) return;
      const res = await api.remove(typed);
      if (res.ok) {
        writeLocal(
          CLASSES_KEY,
          classes().filter((c) => c.code !== current.code),
        );
        location.reload();
      } else say(t("The class was not deleted. Check the code."));
    }
  });

  $("#ct-create").addEventListener("submit", async (event) => {
    event.preventDefault();
    const key = $("#ct-site-key").value.trim();
    try {
      sessionStorage.setItem(SITE_KEY, key);
    } catch {}
    const res = await fetchImpl(`${API}/create`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-teacher-key": key },
      body: JSON.stringify({ app: "fluency", title: $("#ct-new-title").value }),
    })
      .then((r) => r.json())
      .catch(() => ({ ok: false, error: "offline" }));
    if (!res.ok)
      return say(
        res.error === "unauthorized"
          ? t("That teacher key is not right.")
          : t("The class could not be created."),
      );
    open(res.code, res.teacherPasscode, res.title);
  });
  $("#ct-signin").addEventListener("submit", (event) => {
    event.preventDefault();
    open(
      $("#ct-code")
        .value.toUpperCase()
        .replace(/[^A-Z2-9]/g, ""),
      $("#ct-pass")
        .value.toUpperCase()
        .replace(/[^A-Z2-9]/g, ""),
    );
  });
  $("#ct-goal").addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!api) return;
    const res = await api.settings({
      goal: {
        metric: "mastered-skills",
        target: Number($("#ct-goal-target").value),
        label: $("#ct-goal-label").value,
      },
    });
    say(res.ok ? t("Class goal saved.") : t("The goal could not be saved."));
    if (res.ok) drawRoster(await api.roster());
  });
  const gradeSel = $("#ct-room-grade");
  gradeSel.addEventListener("change", () => {
    $("#ct-room-skill").innerHTML = skillOptions(Number(gradeSel.value));
  });
  $("#ct-room-skill").innerHTML = skillOptions(Number(gradeSel.value));
  renderSaved();
  return { open, pollRoom };
}

if (
  typeof document !== "undefined" &&
  document.querySelector("#class-teacher") &&
  !globalThis.__FLUENCY_CLASS_TEST__
) {
  const lang = new URLSearchParams(location.search).get("lang");
  if (lang) setLang(lang);
  translatePage();
  document.querySelector("#ct-lang")?.addEventListener("click", () => {
    setLang(getLang() === "es" ? "en" : "es");
    location.reload();
  });
  mountTeacher(document.querySelector("#class-teacher"));
}
