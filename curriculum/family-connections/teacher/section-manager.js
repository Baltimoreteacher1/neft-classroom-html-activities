const MAX_SECTIONS = 12;

function sectionName(value) {
  const name = String(value ?? "").trim().slice(0, 80);
  if (!name) throw new Error("Add a section name.");
  return name;
}

function findSection(sections, id) {
  const section = sections.find((item) => item.id === id);
  if (!section) throw new Error("That section is no longer available.");
  return section;
}

function slug(value) {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || "class";
}

export function addSection(sections, name, template) {
  if (sections.length >= MAX_SECTIONS) throw new Error("A maximum of 12 sections is supported.");
  const label = sectionName(name);
  const baseId = slug(label);
  const used = new Set(sections.map((item) => item.id));
  let id = baseId;
  let suffix = 2;
  while (used.has(id)) id = `${baseId}-${suffix++}`;
  const section = { ...structuredClone(template), id, label, visible: true, isDefault: false };
  return { sections: [...sections, section], section };
}

export function renameSection(sections, id, name) {
  const label = sectionName(name);
  findSection(sections, id);
  return sections.map((item) => (item.id === id ? { ...item, label } : item));
}

export function setDefaultSection(sections, id) {
  findSection(sections, id);
  return sections.map((item) => ({ ...item, isDefault: item.id === id }));
}

export function deleteSection(sections, id, activeId) {
  if (sections.length <= 1) throw new Error("The last section cannot be deleted.");
  const removed = findSection(sections, id);
  const remaining = sections.filter((item) => item.id !== id).map((item) => ({ ...item }));
  if (removed.isDefault || !remaining.some((item) => item.isDefault)) {
    remaining.forEach((item, index) => {
      item.isDefault = index === 0;
    });
  }
  return {
    sections: remaining,
    activeId: activeId === id ? remaining[0].id : activeId,
  };
}

function button(label, className, handler) {
  const item = document.createElement("button");
  item.type = "button";
  item.className = className;
  item.textContent = label;
  item.addEventListener("click", handler);
  return item;
}

export function renderSectionManager(root, sections, activeId, handlers) {
  root.replaceChildren();
  sections.forEach((section) => {
    const row = document.createElement("article");
    row.className = "section-manager-row";
    if (section.id === activeId) row.dataset.active = "true";

    const nameLabel = document.createElement("label");
    nameLabel.textContent = "Section name";
    const name = document.createElement("input");
    name.value = section.label;
    name.maxLength = 80;
    name.autocomplete = "off";
    name.addEventListener("change", () => handlers.rename(section.id, name.value));
    nameLabel.append(name);

    const actions = document.createElement("div");
    actions.className = "section-manager-actions";
    const edit = button(section.id === activeId ? "Editing" : "Edit", "text-button", () =>
      handlers.select(section.id),
    );
    edit.setAttribute("aria-pressed", String(section.id === activeId));
    const makeDefault = button(
      section.isDefault ? "Default" : "Make default",
      "text-button",
      () => handlers.setDefault(section.id),
    );
    makeDefault.setAttribute("aria-pressed", String(section.isDefault));
    const remove = button(`Delete ${section.label}`, "text-button section-delete", () =>
      handlers.remove(section.id),
    );
    remove.disabled = sections.length === 1;
    if (remove.disabled) remove.title = "The final section cannot be deleted.";
    actions.append(edit, makeDefault, remove);
    row.append(nameLabel, actions);
    root.append(row);
  });
}
