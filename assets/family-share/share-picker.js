/* =============================================================================
 * Show my family — the student's choosing screen (ES module, no dependencies)
 * -----------------------------------------------------------------------------
 * A student picks what their family sees in the Weekly Family Broadcast:
 * up to three skills they grew in, ONE explanation in their own words, and a
 * favorite math tool. It is OFF until the student turns it on, and a student can
 * stop sharing at any moment; stopping erases the picks.
 *
 *   import { mountSharePicker } from "/assets/family-share/share-picker.js";
 *   const picker = mountSharePicker(hostElement, {
 *     skills: [{ std: "6.AT.1", label: "Understanding ratios", labelEs: "Comprender las razones" }],
 *     explanations: [{ lesson: "3-1", text: "A ratio compares two amounts..." }], // optional
 *   });
 *   picker.destroy();
 *
 * Options: lang ("en"|"es", default the page language), code (save code, default
 * found on this device), models (ids from SHARE_MODELS, default all), onChange.
 *
 * STORAGE. The choice is written into the student's existing save-code progress
 * record with the existing endpoints: GET /api/progress/load then POST
 * /api/progress/save, merging into state.custom.familyShare and leaving every
 * other field of the record exactly as it was. No new table, endpoint or
 * schema. A copy is kept in localStorage (try/catch) and pushed again the next
 * time the picker opens if an activity's own save replaced the record.
 *
 * PAGES WITH THE SAVE/RESUME ENGINE also get a state provider, so the engine's
 * later saves keep the choice instead of rebuilding the record without it.
 *
 * Every value is inserted with textContent. Nothing is ever HTML.
 * ========================================================================== */

import {
  applyShare,
  cleanText,
  findShare,
  SHARE_FAMILY_COPY,
  SHARE_MAX_SKILLS,
  SHARE_MAX_TEXT,
  SHARE_MODELS,
  SHARE_STUDENT_COPY,
  SHARE_VERSION,
  sanitizeShare,
  shareableText,
} from "/assets/family-share/family-share.js";

const LOCAL_PREFIX = "nt-family-share:";
const CODE_RE = /^[A-Z0-9]{1,12}-[A-Z0-9]{3,8}$/;
const PROVIDER_FLAG = "__ntFamilyShareProvider";

const store = {
  get(key) {
    try {
      return localStorage.getItem(key);
    } catch (_e) {
      return null;
    }
  },
  set(key, value) {
    try {
      localStorage.setItem(key, value);
    } catch (_e) {
      /* private browsing: the server copy is the one that matters */
    }
  },
};

function pageLang() {
  if (document.documentElement.lang === "es") return "es";
  return store.get("nt-lang") === "es" ? "es" : "en";
}

function node(tag, className, text) {
  const n = document.createElement(tag);
  if (className) n.className = className;
  if (text != null) n.textContent = text;
  return n;
}

/** The save code of the work in front of the student, else the newest on this device. */
function detectCode() {
  try {
    const engine = window.NeftSaveResume;
    const live = engine && engine.record && engine.record.saveCode;
    if (live && CODE_RE.test(String(live).toUpperCase())) return String(live).toUpperCase();
  } catch (_e) {
    /* fall through to storage */
  }
  let best = { code: "", at: -1 };
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i) || "";
      if (!key.startsWith("nsr:rec:")) continue;
      const rec = JSON.parse(localStorage.getItem(key) || "null");
      const code = String((rec && rec.saveCode) || key.slice(8)).toUpperCase();
      const at = Date.parse((rec && (rec.updatedAt || rec.createdAt)) || "") || 0;
      if (CODE_RE.test(code) && at > best.at) best = { code, at };
    }
  } catch (_e) {
    /* unreadable storage: the student can type the code */
  }
  return best.code;
}

async function loadRecord(code) {
  const res = await fetch(`/api/progress/load?code=${encodeURIComponent(code)}`, {
    credentials: "omit",
    cache: "no-store",
  });
  if (!res.ok) return null;
  const body = await res.json();
  return body && body.ok && body.record ? body.record : null;
}

/** Merge the choice into the existing record and save it back, field for field. */
async function writeRecord(code, record, share) {
  const state = applyShare(
    record.state && typeof record.state === "object" ? record.state : {},
    share,
  );
  const res = await fetch("/api/progress/save", {
    method: "POST",
    credentials: "omit",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      saveCode: code,
      activityId: record.activityId || "family-share",
      activityTitle: record.activityTitle || "",
      studentName: record.studentName || "",
      section: record.section || "",
      progressPercent: Number(record.progressPercent) || 0,
      createdAt: record.createdAt,
      state,
    }),
  });
  return res.ok;
}

/** Let the Save/Resume engine keep the choice in the saves it makes itself. */
function registerProvider(getShare) {
  const engine = window.NeftSaveResume;
  if (!engine || typeof engine.registerStateProvider !== "function" || engine[PROVIDER_FLAG]) {
    return;
  }
  engine[PROVIDER_FLAG] = true;
  engine.registerStateProvider(() => {
    const share = getShare();
    return share ? { familyShare: share } : null;
  });
}

export function mountSharePicker(host, options = {}) {
  const lang = options.lang === "es" ? "es" : options.lang === "en" ? "en" : pageLang();
  const t = SHARE_STUDENT_COPY[lang];
  const other = SHARE_STUDENT_COPY[lang === "es" ? "en" : "es"];
  const skills = Array.isArray(options.skills) ? options.skills.slice(0, 40) : [];
  const explanations = Array.isArray(options.explanations) ? options.explanations.slice(0, 12) : [];
  const modelIds = (options.models || Object.keys(SHARE_MODELS)).filter((id) =>
    Object.hasOwn(SHARE_MODELS, id),
  );
  const uid = `fs-${Math.random().toString(36).slice(2, 8)}`;

  let code = options.code ? String(options.code).toUpperCase() : detectCode();
  let current = null; // the share last saved, or null
  let busy = false;

  const root = node("section", "fs-picker");
  root.setAttribute("aria-labelledby", `${uid}-title`);
  host.textContent = "";
  host.appendChild(root);

  /* ---- heading + consent copy, in both languages ---- */
  root.appendChild(Object.assign(node("h2", "fs-title", t.title), { id: `${uid}-title` }));
  root.appendChild(node("p", "fs-why", t.why));
  root.appendChild(
    Object.assign(node("p", "fs-why fs-sub", other.why), { lang: lang === "es" ? "en" : "es" }),
  );
  root.appendChild(node("p", "fs-who", t.whoSees));

  /* ---- master switch (off by default) ---- */
  const switchRow = node("label", "fs-switch");
  const toggle = node("input");
  toggle.type = "checkbox";
  toggle.id = `${uid}-on`;
  const toggleText = node("span", "fs-switch-text", t.toggleOff);
  switchRow.append(toggle, toggleText);
  root.appendChild(switchRow);

  /* ---- code (only when none was found) ---- */
  const codeRow = node("div", "fs-field");
  const codeLabel = node("label", null, t.codeLabel);
  const codeInput = node("input", "fs-input");
  codeInput.id = `${uid}-code`;
  codeInput.type = "text";
  codeInput.maxLength = 21;
  codeInput.autocapitalize = "characters";
  codeInput.spellcheck = false;
  codeLabel.htmlFor = codeInput.id;
  codeInput.setAttribute("aria-describedby", `${uid}-code-hint`);
  codeRow.append(
    codeLabel,
    codeInput,
    Object.assign(node("p", "fs-hint", t.needCode), { id: `${uid}-code-hint` }),
  );
  codeRow.hidden = Boolean(code);
  root.appendChild(codeRow);

  /* ---- skills ---- */
  const skillSet = node("fieldset", "fs-set");
  skillSet.appendChild(node("legend", null, t.skillsHeading));
  const skillBoxes = [];
  if (!skills.length) skillSet.appendChild(node("p", "fs-hint", t.skillsNone));
  for (const skill of skills) {
    const row = node("label", "fs-check");
    const box = node("input");
    box.type = "checkbox";
    box.value = String(skill.std || "");
    row.append(box, node("span", null, lang === "es" ? skill.labelEs || skill.label : skill.label));
    skillSet.appendChild(row);
    skillBoxes.push(box);
  }
  root.appendChild(skillSet);

  /* ---- one explanation ---- */
  const wordsSet = node("div", "fs-field");
  wordsSet.appendChild(
    Object.assign(node("label", null, t.wordsHeading), { htmlFor: `${uid}-words` }),
  );
  let wordsPick = null;
  if (explanations.length) {
    wordsPick = node("select", "fs-input");
    wordsPick.setAttribute("aria-label", t.wordsLabel);
    wordsPick.appendChild(Object.assign(node("option", null, "—"), { value: "" }));
    explanations.forEach((e, i) => {
      const text = cleanText(e && e.text);
      if (text)
        wordsPick.appendChild(
          Object.assign(node("option", null, text.slice(0, 60)), { value: String(i) }),
        );
    });
    wordsSet.appendChild(wordsPick);
  }
  const words = node("textarea", "fs-input fs-words");
  words.id = `${uid}-words`;
  words.rows = 4;
  words.maxLength = SHARE_MAX_TEXT;
  words.setAttribute("aria-describedby", `${uid}-words-hint ${uid}-count`);
  wordsSet.append(
    words,
    Object.assign(node("p", "fs-hint", t.wordsHint), { id: `${uid}-words-hint` }),
    Object.assign(node("p", "fs-hint", ""), { id: `${uid}-count` }),
  );
  const count = wordsSet.querySelector(`#${uid}-count`);
  root.appendChild(wordsSet);

  /* ---- favorite model ---- */
  const modelRow = node("div", "fs-field");
  modelRow.appendChild(
    Object.assign(node("label", null, t.modelHeading), { htmlFor: `${uid}-model` }),
  );
  const model = node("select", "fs-input");
  model.id = `${uid}-model`;
  model.appendChild(Object.assign(node("option", null, t.modelNone), { value: "" }));
  for (const id of modelIds) {
    const m = SHARE_MODELS[id];
    model.appendChild(
      Object.assign(node("option", null, lang === "es" ? m.es : m.en), { value: id }),
    );
  }
  modelRow.appendChild(model);
  root.appendChild(modelRow);

  /* ---- preview, actions, status ---- */
  const preview = node("div", "fs-preview");
  preview.appendChild(node("h3", null, t.preview));
  const previewBody = node("div", "fs-preview-body");
  preview.appendChild(previewBody);
  root.appendChild(preview);

  const actions = node("div", "fs-actions");
  const saveBtn = node("button", "fs-btn fs-btn-primary", t.save);
  saveBtn.type = "button";
  const stopBtn = node("button", "fs-btn", t.unshare);
  stopBtn.type = "button";
  stopBtn.hidden = true;
  actions.append(saveBtn, stopBtn);
  root.appendChild(actions);

  const status = node("p", "fs-status");
  status.setAttribute("role", "status");
  status.setAttribute("aria-live", "polite");
  root.appendChild(status);

  /* ---- reading the form ---- */
  function chosenSkills() {
    return skillBoxes.filter((b) => b.checked).map((b) => ({ kind: "skill", std: b.value }));
  }

  function draft() {
    /** @type {Array<Record<string, string>>} */
    const items = chosenSkills();
    const text = cleanText(words.value);
    if (text) items.push({ kind: "words", text });
    if (model.value) items.push({ kind: "model", id: model.value });
    return { v: SHARE_VERSION, on: toggle.checked, items, at: new Date().toISOString() };
  }

  function say(message) {
    status.textContent = message;
  }

  function renderPreview() {
    previewBody.textContent = "";
    const share = sanitizeShare(draft());
    const copy = SHARE_FAMILY_COPY;
    if (!share || !share.on) {
      previewBody.appendChild(node("p", "fs-hint", t.toggleOff));
      return;
    }
    for (const item of share.items) {
      if (item.kind === "skill") {
        const s = skills.find((x) => x.std === item.std);
        const label = s ? (lang === "es" ? s.labelEs || s.label : s.label) : item.std;
        previewBody.appendChild(node("p", null, copy.skill[lang](label)));
      } else if (item.kind === "model") {
        const m = SHARE_MODELS[item.id];
        previewBody.appendChild(node("p", null, copy.model[lang](lang === "es" ? m.es : m.en)));
      } else {
        previewBody.appendChild(node("strong", null, copy.words[lang]));
        previewBody.appendChild(node("blockquote", "fs-quote", item.text));
      }
    }
  }

  function sync() {
    const picked = skillBoxes.filter((b) => b.checked).length;
    for (const b of skillBoxes) b.disabled = !b.checked && picked >= SHARE_MAX_SKILLS;
    toggleText.textContent = toggle.checked ? t.toggleOn : t.toggleOff;
    count.textContent = t.wordsCount(words.value.length);
    stopBtn.hidden = !(current && current.on);
    renderPreview();
  }

  function fill(share) {
    toggle.checked = Boolean(share && share.on);
    const items = share && share.on ? share.items : [];
    for (const b of skillBoxes)
      b.checked = items.some((i) => i.kind === "skill" && i.std === b.value);
    const w = items.find((i) => i.kind === "words");
    words.value = w ? w.text : "";
    const m = items.find((i) => i.kind === "model");
    model.value = m ? m.id : "";
    sync();
  }

  /* ---- talking to the progress record ---- */
  async function persist(share) {
    const entered = codeRow.hidden ? code : codeInput.value.trim().toUpperCase();
    if (!CODE_RE.test(entered)) {
      codeRow.hidden = false;
      codeInput.focus();
      say(t.needCode);
      return false;
    }
    code = entered;
    store.set(LOCAL_PREFIX + code, JSON.stringify(share));
    try {
      const record = await loadRecord(code);
      if (!record) {
        say(t.offline);
        return false;
      }
      if (!(await writeRecord(code, record, share))) {
        say(t.offline);
        return false;
      }
    } catch (_e) {
      say(t.offline);
      return false;
    }
    current = share;
    registerProvider(() => current);
    if (typeof options.onChange === "function") options.onChange(share);
    return true;
  }

  async function save() {
    if (busy) return;
    const share = draft();
    if (words.value.trim() && !shareableText(words.value)) {
      say(t.badText);
      words.focus();
      return;
    }
    const clean = sanitizeShare(share) || { v: SHARE_VERSION, on: false, items: [], at: share.at };
    busy = true;
    saveBtn.disabled = stopBtn.disabled = true;
    if (await persist(clean)) say(clean.on ? t.saved : t.savedOff);
    saveBtn.disabled = stopBtn.disabled = false;
    busy = false;
    sync();
  }

  async function stop() {
    if (busy) return;
    busy = true;
    saveBtn.disabled = stopBtn.disabled = true;
    const off = { v: SHARE_VERSION, on: false, items: [], at: new Date().toISOString() };
    const ok = await persist(off);
    if (ok) {
      fill(off);
      say(t.unshared);
    }
    saveBtn.disabled = stopBtn.disabled = false;
    busy = false;
    sync();
  }

  /* ---- events ---- */
  const onInput = () => sync();
  toggle.addEventListener("change", sync);
  words.addEventListener("input", onInput);
  model.addEventListener("change", onInput);
  for (const b of skillBoxes) b.addEventListener("change", onInput);
  if (wordsPick) {
    wordsPick.addEventListener("change", () => {
      const e = explanations[Number(wordsPick.value)];
      if (e) words.value = cleanText(e.text);
      sync();
    });
  }
  saveBtn.addEventListener("click", save);
  stopBtn.addEventListener("click", stop);

  /* ---- start: local copy first, then the server's, healing a lost record ---- */
  const localRaw = code ? store.get(LOCAL_PREFIX + code) : null;
  let local = null;
  try {
    local = localRaw ? sanitizeShare(JSON.parse(localRaw)) : null;
  } catch (_e) {
    local = null;
  }
  fill(local);
  current = local && local.on ? local : null;
  sync();

  if (code) {
    loadRecord(code)
      .then((record) => {
        if (!record) return;
        const remote = findShare(record.state);
        if (remote && (!local || remote.at >= local.at)) {
          current = remote.on ? remote : null;
          fill(remote);
          registerProvider(() => current);
        } else if (local && local.on) {
          // An activity's own save replaced the record: put the choice back.
          writeRecord(code, record, local).then((ok) => {
            if (ok) registerProvider(() => current);
          });
        }
      })
      .catch(() => {});
  }

  return {
    destroy() {
      host.textContent = "";
    },
    get share() {
      return current;
    },
  };
}
