// Classes: list, create/edit, and the class page (profile, pathway, pasted evidence, evidence dashboard).
import { addClassEvidence, classEvidence, clearClassEvidence } from "../core/evidence.js";
import { h } from "../core/dom.js";
import { tierShares } from "../core/classes.js";
import { emptyState, gradeLabel, plural, subjectChip } from "../core/ui.js";
import { SUBJECT_PROFILE, TIERS } from "../data/taxonomy.js";
import { classForm } from "./classes-form.js";

function distribution(cls) {
  const shares = tierShares(cls);
  if (!shares) return h("p", { class: "st-hint" }, "No proficiency numbers entered yet.");
  return h(
    "div",
    {},
    h("div", { class: "st-dist", role: "img", "aria-label": TIERS.map((t) => `${t.short} ${shares[t.id]} percent`).join(", ") }, TIERS.map((t) => h("span", { "data-tier": t.id, style: `width:${shares[t.id]}%` }))),
    h("ul", { class: "st-legend" }, TIERS.map((t) => h("li", {}, `${t.short} ${shares[t.id]}%`))),
  );
}

function listView(root, shell) {
  const all = shell.classes.listClasses();
  const add = h("a", { class: "st-btn st-btn-primary", href: "#/classes?new=1" }, "New class");
  root.append(
    h("h1", {}, "Classes"),
    h("p", { class: "st-lede" }, "A class profile tunes supports and pathways to the students in front of you. It holds a nickname and broad counts, never names. It stays on this device."),
    h("p", { class: "st-row" }, add),
  );
  if (!all.length) {
    root.append(emptyState({ title: "No classes yet", body: "Create one in about a minute, or use the studio without one. Every tool works with no class selected.", actions: [h("a", { class: "st-btn", href: "#/prepare" }, "Prepare without a class")] }));
    return;
  }
  root.append(
    h(
      "ul",
      { class: "st-class-grid", "aria-label": "Your classes" },
      all.map((c) =>
        h(
          "li",
          {},
          h(
            "article",
            { class: "st-card" },
            h("h2", { class: "st-card-title" }, h("a", { class: "st-card-link", href: `#/class/${encodeURIComponent(c.id)}` }, c.nickname)),
            h("p", { class: "st-meta" }, h("span", { class: "st-chip st-chip-plain" }, gradeLabel(c.grade)), subjectChip(c.subject)),
            distribution(c),
          ),
        ),
      ),
    ),
  );
}

function formView(root, shell, cls) {
  let errors = {};
  const draw = (value) => {
    root.replaceChildren(h("h1", {}, cls?.id ? "Edit class" : "New class"), classForm({ cls: value || cls || undefined, errors, onSubmit: save, onCancel: () => shell.nav(cls?.id ? `#/class/${cls.id}` : "#/classes") }));
    shell.setTitle(cls?.id ? "Edit class" : "New class");
  };
  function save(profile) {
    const r = shell.classes.saveClass(profile);
    if (!r.ok) {
      errors = r.errors;
      draw(r.cls);
      return shell.announce("The form has problems. Please fix them and save again.");
    }
    shell.announce(`${r.cls.nickname} saved.`);
    shell.nav(`#/class/${encodeURIComponent(r.cls.id)}`);
  }
  draw();
}

function confirmButton(label, confirmLabel, onConfirm) {
  const b = h("button", { class: "st-btn st-btn-danger", type: "button" }, label);
  let armed = false;
  b.addEventListener("click", () => {
    if (!armed) {
      armed = true;
      b.textContent = confirmLabel;
      setTimeout(() => {
        armed = false;
        b.textContent = label;
      }, 6000);
      return;
    }
    onConfirm();
  });
  b.addEventListener("blur", () => {
    armed = false;
    b.textContent = label;
  });
  return b;
}

/** core/dash.js is another worker's module; use it when it offers a pathway, otherwise real links from the profile. */
async function pathwayBlock(cls, shell) {
  const box = h("div", {});
  try {
    const dash = await import("../core/dash.js");
    const fn = dash.recommendPathway || dash.pathwayFor || dash.recommend || dash.classPathway;
    if (typeof fn === "function") {
      const out = await fn(cls, { catalog: shell.catalog });
      if (out?.nodeType) return out;
      if (Array.isArray(out) && out.length) {
        box.append(h("ul", { class: "st-plain-list" }, out.map((o) => h("li", {}, o.href ? h("a", { href: o.href }, o.title || o.text) : o.title || o.text, o.why ? h("small", {}, ` ${o.why}`) : null))));
        return box;
      }
    }
  } catch {
    /* dash unavailable: fall through to the profile-based links */
  }
  const q = `grade=${cls.grade}&subject=${cls.subject}`;
  box.append(
    h("ul", { class: "st-plain-list" }, [
      h("li", {}, h("a", { href: `#/find?${q}` }, `Find ${gradeLabel(cls.grade)} ${SUBJECT_PROFILE[cls.subject].short} lessons`)),
      h("li", {}, h("a", { href: `#/prepare?class=${encodeURIComponent(cls.id)}` }, "Prepare a lesson for this class")),
      h("li", {}, h("a", { href: `#/wida/path?class=${encodeURIComponent(cls.id)}` }, "WIDA practice path for this class")),
      h("li", {}, h("a", { href: "#/lens" }, "Language Lens: check a text for language demands")),
    ]),
  );
  return box;
}

function evidenceBlock(cls, shell) {
  const dash = h("div", { id: "st-evidence", class: "st-card" });
  const note = h("p", { class: "st-hint", role: "status" });
  const ta = h("textarea", { id: "st-ev-codes", rows: "4", placeholder: "Paste one evidence code per line", spellcheck: "false" });
  const count = () => `${plural(classEvidence(cls.id).length, "attempt")} recorded for this class.`;
  const paint = async () => {
    note.textContent = count();
    dash.replaceChildren();
    try {
      const mod = await import("./evidence.js");
      await mod.renderEvidence({ root: dash, classId: cls.id });
    } catch {
      const retry = h("button", { class: "st-btn", type: "button" }, "Try again");
      retry.addEventListener("click", paint);
      dash.replaceChildren(h("p", {}, "The evidence dashboard did not load. Your pasted evidence is saved on this device."), retry);
    }
  };
  const add = h("button", { class: "st-btn st-btn-primary", type: "button" }, "Add evidence");
  add.addEventListener("click", () => {
    const codes = ta.value.split(/\s+/).filter(Boolean);
    let ok = 0;
    const bad = [];
    for (const c of codes) {
      try {
        addClassEvidence(cls.id, c);
        ok += 1;
      } catch (e) {
        bad.push(e.message);
      }
    }
    if (!codes.length) bad.push("Paste at least one evidence code first.");
    ta.value = "";
    shell.announce(`${plural(ok, "code")} added.${bad.length ? ` ${bad[0]}` : ""}`);
    paint().then(() => {
      if (bad.length) note.textContent = `${count()} ${bad[0]}`;
    });
  });
  const clear = confirmButton("Clear evidence", "Confirm: clear all evidence for this class", () => {
    clearClassEvidence(cls.id);
    shell.announce("Evidence cleared for this class.");
    paint();
  });
  const section = h(
    "section",
    { "aria-labelledby": "st-ev-h" },
    h("h2", { id: "st-ev-h" }, "Class evidence"),
    h("p", { class: "st-hint" }, "Students share an anonymous evidence code from the activity player. Paste codes here. Codes carry no names."),
    h("div", { class: "st-field" }, h("label", { for: "st-ev-codes" }, "Evidence codes"), ta),
    h("div", { class: "st-row" }, add, clear),
    note,
    dash,
  );
  paint();
  return section;
}

async function pageView(root, shell, cls) {
  const bits = [];
  const dl = (k, v) => v && bits.push(h("dt", {}, k), h("dd", {}, v));
  dl("Grade", gradeLabel(cls.grade));
  dl("Subject", SUBJECT_PROFILE[cls.subject].label);
  dl("Curriculum", cls.curriculum);
  dl("Current unit", cls.unit);
  dl("Priority domains", cls.domainPriorities.join(", "));
  dl("Key language uses", cls.klus.join(", "));
  const tiered = Object.entries(cls.domainTiers).filter(([, t]) => t !== "mixed").map(([d, t]) => `${d}: ${TIERS.find((x) => x.id === t).short}`);
  dl("Domain levels", tiered.join("; "));
  dl("Goals", cls.goals);
  const dup = h("button", { class: "st-btn", type: "button" }, "Duplicate");
  dup.addEventListener("click", () => {
    const copy = shell.classes.duplicateClass(cls.id);
    shell.announce(`Created ${copy.nickname}.`);
    shell.nav(`#/class/${encodeURIComponent(copy.id)}`);
  });
  const del = confirmButton("Delete class", "Confirm: delete this class and its evidence", () => {
    shell.classes.deleteClass(cls.id);
    shell.announce(`${cls.nickname} deleted.`);
    shell.nav("#/classes");
  });
  root.append(
    h("p", {}, h("a", { href: "#/classes" }, "All classes")),
    h("h1", {}, cls.nickname),
    h("p", { class: "st-row" }, h("a", { class: "st-btn st-btn-primary", href: `#/prepare?class=${encodeURIComponent(cls.id)}` }, "Prepare a lesson"), h("a", { class: "st-btn", href: `#/class/${encodeURIComponent(cls.id)}?edit=1` }, "Edit"), dup, del),
    h("div", { class: "st-two" }, h("section", { "aria-labelledby": "st-prof" }, h("h2", { id: "st-prof" }, "Profile"), distribution(cls), h("dl", { class: "st-dl" }, bits)), h("section", { "aria-labelledby": "st-path" }, h("h2", { id: "st-path" }, "Recommended pathway"), await pathwayBlock(cls, shell))),
    evidenceBlock(cls, shell),
  );
}

export async function render({ root, params, shell }) {
  if (params.route === "class" && params.id) {
    const cls = shell.classes.getClass(params.id);
    if (!cls) {
      root.append(h("h1", {}, "That class is not on this device"), h("p", {}, "Classes are stored per browser. It may have been deleted, or created on another computer."), h("p", { class: "st-row" }, h("a", { class: "st-btn", href: "#/classes" }, "See my classes")));
      return;
    }
    return params.edit === "1" ? formView(root, shell, cls) : pageView(root, shell, cls);
  }
  if (params.new === "1") return formView(root, shell, null);
  listView(root, shell);
}
