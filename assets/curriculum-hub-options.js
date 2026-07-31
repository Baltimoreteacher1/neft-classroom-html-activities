/* Curriculum Hub — extracted from curriculum/index.html.
 * Loaded with defer at the same document position: defer scripts execute
 * after parsing in document order, so this keeps its relative order with
 * the other hub scripts and still runs before /assets/curriculum-*.js.
 * Keep the ?v= stamp in the hub in sync with this file's content hash;
 * tools/curriculum-hub-assets.test.mjs enforces that.
 */
document.addEventListener("DOMContentLoaded", () => {
  const optionsRoot = document.getElementById("ewl-linkgen-options");
  const select = /** @type {HTMLSelectElement} */ (document.getElementById("ewl-linkgen-lesson"));
  const copyBtn = /** @type {HTMLButtonElement} */ (document.getElementById("ewl-linkgen-copy"));
  const preview = document.getElementById("ewl-linkgen-preview");
  const previewUrl = document.getElementById("ewl-linkgen-preview-url");
  const empty = document.getElementById("ewl-linkgen-empty");
  if (!optionsRoot || !select || !copyBtn) return;

  // Prepare Learning Supports — rendered from the SHARED taxonomy
  // (assets/learning-supports/supports-schema.js →
  // window.EWLSupportsSchema), the SAME district IEP/ESOL menus the
  // lesson dock and Teacher Tools console use. Single source of
  // truth: editing the schema updates this panel automatically, so
  // the hub can never drift from the official accommodation lists.
  //
  // The copy-LINK transport (#supports=) only carries the engine's
  // coarse profile/tool keys, so each schema item is mapped to the
  // profile (or tool) that delivers it. `interactive` items with a
  // known tool become DIGITAL (they ride the link); `flag`/`adaptive`
  // items (extended time, workload, teacher moves) can't be switched
  // on by a link, so they go to the 🤝 in-person copyable list.
  const TOOL_TO_LINK_KEY = {
    calculator: "calculator",
    model: "model",
    multchart: "multchart",
    numberline: "numberline",
    placevalue: "placevalue",
    listen: "read-understand",
    words: "read-understand",
    directions: "read-understand",
    explain: "express-thinking",
    notepad: "express-thinking",
    organizer: "express-thinking",
    highlighter: "focus-organize",
    checkin: "focus-organize",
    checklist: "focus-organize",
    break: "focus-organize",
    translate: "language-support",
  };
  const GROUP_NOTES = {
    iep: "District IEP accommodations & modifications",
    esol: "District ESOL modifications (WIDA)",
  };
  const schema = window.EWLSupportsSchema;
  const IEP_GROUPS = (schema && Array.isArray(schema.groups) ? schema.groups : []).map((g) => ({
    name: `${g.icon ? g.icon + " " : ""}${g.label}`,
    note: GROUP_NOTES[g.id] || "",
    items: (g.items || []).map((it) => {
      const linkKey = it.apply === "interactive" && it.tool ? TOOL_TO_LINK_KEY[it.tool] : null;
      return linkKey ? { label: it.label, keys: [linkKey] } : { label: it.label, inPerson: true };
    }),
  }));
  if (!IEP_GROUPS.length) {
    optionsRoot.innerHTML =
      '<p class="ewl-linkgen-empty" style="display:block">Supports list failed to load. Reload the page to try again.</p>';
    return;
  }

  // Render every group as individually-checkable accommodations.
  // Digital items carry data-keys (comma-joined engine keys);
  // in-person items carry data-inperson and a 🤝 tag.
  optionsRoot.innerHTML = IEP_GROUPS.map(
    (g) => `
      <div class="ewl-linkgen-group">
        <p class="ewl-linkgen-group-head">
          <span class="ewl-linkgen-opt-name">${g.name}</span>
          <span class="ewl-linkgen-opt-note">${g.note}</span>
        </p>
        <div class="ewl-linkgen-group-items">
          ${g.items
            .map(
              (it) => `
            <label class="ewl-linkgen-item">
              <input type="checkbox"
                data-label="${it.label.replace(/"/g, "&quot;")}"
                ${it.keys ? `data-keys="${it.keys.join(",")}"` : ""}
                ${it.inPerson ? 'data-inperson="1"' : ""} />
              <span class="ewl-linkgen-item-label">${it.label}${
                it.inPerson ? ' <span class="ewl-linkgen-item-tag">🤝 in-person</span>' : ""
              }</span>
            </label>`,
            )
            .join("")}
        </div>
      </div>`,
  ).join("");

  // Populate the "start on" lesson menu from the per-unit counts.
  const lessonsCount = { 1: 7, 2: 5, 3: 7, 4: 7, 5: 5, 6: 7, 7: 7, 8: 7, 9: 7, 10: 5 };
  select.innerHTML = "";
  for (let u = 1; u <= 10; u++) {
    for (let l = 1; l <= lessonsCount[u]; l++) {
      const opt = document.createElement("option");
      opt.value = `${u}-${l}`;
      opt.textContent = `Lesson ${u}.${l}`;
      select.appendChild(opt);
    }
  }

  // Checked accommodations, split into the engine keys that go in
  // the link and the in-person items that go in the copyable list.
  const selectedItems = () =>
    Array.from(optionsRoot.querySelectorAll("input:checked")).map((cb) => ({
      label: cb.getAttribute("data-label") || "",
      keys: (cb.getAttribute("data-keys") || "").split(",").filter(Boolean),
      inPerson: cb.getAttribute("data-inperson") === "1",
    }));
  const selectedProfiles = () => [...new Set(selectedItems().flatMap((it) => it.keys))];

  const buildUrl = (profiles) =>
    `${window.location.origin}/lessons/${select.value}/#supports=${[...new Set(profiles)].join(",")}`;

  // Keep the buttons, empty hint, and live preview in sync with the
  // current selection. Copy link / SCORM are disabled until a
  // DIGITAL accommodation is checked so teachers never hand out a
  // link that turns nothing on; Copy list works for any selection.
  const scormBtn = /** @type {HTMLButtonElement} */ (document.getElementById("ewl-linkgen-scorm"));
  const listBtn = /** @type {HTMLButtonElement} */ (document.getElementById("ewl-linkgen-list"));
  const refresh = () => {
    const items = selectedItems();
    const profiles = selectedProfiles();
    const hasDigital = profiles.length > 0;
    copyBtn.disabled = !hasDigital;
    if (scormBtn) scormBtn.disabled = !hasDigital;
    if (listBtn) listBtn.disabled = items.length === 0;
    empty.hidden = items.length > 0;
    preview.hidden = !hasDigital;
    if (hasDigital) previewUrl.textContent = buildUrl(profiles);
  };

  optionsRoot.addEventListener("change", refresh);
  select.addEventListener("change", refresh);

  const setAll = (checked) => {
    optionsRoot.querySelectorAll("input[type=checkbox]").forEach((el) => {
      const cb = /** @type {HTMLInputElement} */ (el);
      cb.checked = checked;
    });
    refresh();
  };
  document.getElementById("ewl-linkgen-all")?.addEventListener("click", () => setAll(true));
  document.getElementById("ewl-linkgen-clear")?.addEventListener("click", () => setAll(false));

  refresh();

  copyBtn.addEventListener("click", () => {
    const profiles = selectedProfiles();
    if (!profiles.length) return;
    navigator.clipboard
      .writeText(buildUrl(profiles))
      .then(() => {
        const orig = copyBtn.textContent;
        copyBtn.textContent = "✓ Copied!";
        setTimeout(() => {
          copyBtn.textContent = orig;
        }, 1500);
      })
      .catch((err) => console.error("Clipboard copy failed:", err));
  });

  // Download the chosen lesson as a personalized SCORM package with
  // the selected supports baked into its launch query. Reuses the
  // site's on-demand builder (/api/scorm) — same endpoint the lesson
  // dock's "Download SCORM for these students" uses.
  scormBtn?.addEventListener("click", () => {
    const profiles = selectedProfiles();
    if (!profiles.length) return;
    const params = new URLSearchParams();
    params.set("activity", select.value);
    params.set("supports", [...new Set(profiles)].join(","));
    const a = document.createElement("a");
    a.href = `/api/scorm?${params.toString()}`;
    a.rel = "noopener";
    document.body.appendChild(a);
    a.click();
    a.remove();
    const orig = scormBtn.textContent;
    scormBtn.textContent = "⬇️ Building package…";
    setTimeout(() => {
      scormBtn.textContent = orig;
    }, 2500);
  });

  // Copy the checked accommodations as a plain-text IEP-style list
  // (digital + in-person) for sub plans, emails, or documentation.
  listBtn?.addEventListener("click", () => {
    const items = selectedItems();
    if (!items.length) return;
    const digital = items.filter((it) => !it.inPerson).map((it) => it.label);
    const inPerson = items.filter((it) => it.inPerson).map((it) => it.label);
    const lines = [`IEP accommodations — Lesson ${select.value}`];
    if (digital.length) {
      lines.push("In the lesson link:", ...digital.map((l) => `• ${l}`));
    }
    if (inPerson.length) {
      lines.push("Teacher-provided (in person):", ...inPerson.map((l) => `• ${l}`));
    }
    if (digital.length) {
      lines.push(`Link: ${buildUrl(selectedProfiles())}`);
    }
    navigator.clipboard
      .writeText(lines.join("\n"))
      .then(() => {
        const orig = listBtn.textContent;
        listBtn.textContent = "✓ Copied!";
        setTimeout(() => {
          listBtn.textContent = orig;
        }, 1500);
      })
      .catch((err) => console.error("Clipboard copy failed:", err));
  });
});
