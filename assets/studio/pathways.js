/** Optional, explainable pathways through the lesson's own authored problems. */
(() => {
  const W = /** @type {any} */ (window);
  const rt = W.StudioRT;
  if (!rt?.api?.data?.lesson || rt.api.data.lesson === "0-0") return;
  const { state, data, sections, save, selectTab, expand, mountItem } = rt.api;
  const modelTarget = () => {
    let labTarget = null;
    for (let tab = 1; tab <= sections.length; tab++) {
      const items = sections[tab - 1]?.items || [];
      const index = items.findIndex((item) => item.k === "act" && item.kind);
      if (index >= 0) return { tab, index, kind: items[index].kind, type: "act" };
      const lab = items.findIndex((item) => item.k === "lab");
      if (lab >= 0 && !labTarget) labTarget = { tab, index: lab, kind: "lab", type: "lab" };
    }
    return labTarget;
  };
  const openModel = () => {
    const target = modelTarget();
    if (!target) {
      document
        .querySelector("#studio-lab-bench")
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    state.idx[target.tab] = target.index;
    selectTab(target.tab);
    rt.api.render(target.tab);
    requestAnimationFrame(() => {
      const host =
        document.querySelector(`.act-host[data-act="${CSS.escape(target.kind || "")}"]`) ||
        document.querySelector(".lab-model, .act-host, #studio-lab-bench");
      host?.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  };
  const fresh = () => ({
    choice: "",
    entry: [],
    recommendation: 1,
    evidence: { independent: 0, assisted: 0, misses: {}, transfer: 0, byItem: {} },
  });
  state.pathway ||= fresh();
  const path = state.pathway;
  path.evidence ||= fresh().evidence;
  path.evidence.misses ||= {};
  path.evidence.byItem ||= {};
  path.entry ||= [];
  const esc = rt.util.esc;
  const spanish = (s) => `<span class="es-text" lang="es">${s}</span>`;

  /** Two authored lesson items provide a short prerequisite sample, never a mastery claim. */
  function entrySpecs() {
    const slots = [];
    for (const tab of [1, 3, 4, 2, 5]) {
      const items = sections[tab - 1]?.items || [];
      let index = items.findIndex((s) => s.k === "gen");
      if (index < 0) index = items.findIndex((s) => s.k === "mc" || s.k === "num");
      if (index >= 0 && !slots.some((s) => s.tab === tab)) slots.push({ tab, index });
      if (slots.length === 2) break;
    }
    return slots;
  }

  function recommend(results, mode = data.mode) {
    if (!results.length || results.some((r) => !r.ok || !r.clean)) return 2;
    return mode === "challenge" ? 3 : 4;
  }

  const main = document.querySelector("main.main-container");
  if (!main) return;
  const panel = document.createElement("section");
  panel.className = "pathway-panel";
  panel.setAttribute("aria-labelledby", "pathway-title");
  main.prepend(panel);

  function summary() {
    const e = path.evidence;
    const tags = Object.entries(e.misses)
      .filter(([, n]) => n >= 2)
      .map(([tag]) => data.traps?.[tag]?.n || tag);
    const choice = path.choice || "Choose a route";
    const route = path.recommendation;
    return `<div class="pathway-summary" role="status"><strong>${esc(choice === "full" ? "Full sequence" : choice === "focused" ? "Suggested route" : choice)}</strong>
      ${path.focusedDone ? `<span class="pathway-done">Focused route complete. You can keep exploring the full lesson.${spanish("Ruta enfocada completa. Puedes seguir explorando la lección.")}</span>` : ""}
      ${data.concept?.objective ? `<span class="pathway-objective">Working on: ${esc(data.concept.objective)}</span>` : ""}
      <span>${esc(String(e.independent || 0))} independent · ${esc(String(e.assisted || 0))} assisted · ${esc(String(e.transfer || 0))} application/transfer</span>
      ${tags.length ? `<span>Review: ${esc(tags.join(", "))}</span>` : ""}
      ${choice === "focused" ? `<button type="button" class="pathway-go" data-path-go="${route}">Go to suggested section ${route}</button>` : ""}
      <button type="button" class="pathway-link" data-path-full>Show full sequence</button>
      <button type="button" class="pathway-link" data-path-model>Open interactive model <span class="es-text" lang="es">Abrir modelo interactivo</span></button></div>`;
  }

  function paint() {
    const slots = entrySpecs();
    if (path.choice) {
      panel.innerHTML = `<h2 id="pathway-title">Your learning route${spanish("Tu ruta de aprendizaje")}</h2>${summary()}`;
      panel
        .querySelector("[data-path-go]")
        ?.addEventListener("click", () => selectTab(path.recommendation));
      panel.querySelector("[data-path-full]")?.addEventListener("click", () => {
        path.choice = "full";
        path.recommendation = 1;
        save();
        selectTab(1);
        paint();
      });
      panel.querySelector("[data-path-model]")?.addEventListener("click", openModel);
      return;
    }
    panel.innerHTML = `<div class="pathway-intro"><div><p class="pathway-kicker">START HERE · OPTIONAL ${spanish("EMPIEZA AQUÍ · OPCIONAL")}</p><h2 id="pathway-title">Find a useful starting point${spanish("Encuentra un buen punto de partida")}</h2><p>Try two short checks, or open the full lesson. These checks recommend a section; they do not measure mastery.${spanish("Prueba dos preguntas breves o abre la lección completa. Solo recomiendan una sección.")}</p></div><div class="pathway-actions">${slots.length === 2 ? '<button type="button" class="pathway-primary" data-path-entry>Try the two checks</button>' : ""}<button type="button" class="pathway-link" data-path-full>Open full lesson</button><button type="button" class="pathway-link" data-path-model>Open interactive model <span class="es-text" lang="es">Abrir modelo interactivo</span></button></div></div><div class="pathway-check" hidden></div>`;
    panel.querySelector("[data-path-entry]")?.addEventListener("click", () => showCheck(slots));
    panel.querySelector("[data-path-full]")?.addEventListener("click", () => {
      path.choice = "full";
      save();
      paint();
    });
    panel.querySelector("[data-path-model]")?.addEventListener("click", openModel);
  }

  function finishEntry() {
    path.recommendation = recommend(path.entry);
    path.choice = "focused";
    save();
    paint();
    const section = sections[path.recommendation - 1];
    const message =
      path.recommendation === 2
        ? `Start with ${section.name}: use the lesson model and hints, then solve a new problem independently.`
        : `Start with ${section.name}: your two checks suggest you are ready for application. All earlier work remains available.`;
    panel
      .querySelector(".pathway-summary")
      ?.insertAdjacentHTML("afterbegin", `<p class="pathway-reason">${esc(message)}</p>`);
    selectTab(path.recommendation);
  }

  function showCheck(slots) {
    const box = panel.querySelector(".pathway-check");
    const index = path.entry.length;
    if (index >= slots.length) return finishEntry();
    const { tab, index: slot } = slots[index];
    const item = {
      ...expand(tab, slot, 96321 + index * 271 + Number.parseInt(data.lesson.replace("-", ""), 10)),
      id: `entry_${data.lesson}_${data.mode}_${index}`,
    };
    box.hidden = false;
    box.innerHTML = `<h3>Check ${index + 1} of ${slots.length}${spanish(`Pregunta ${index + 1} de ${slots.length}`)}</h3><p class="pathway-note">Answer on your own first. Help is available if you need it.${spanish("Responde primero por tu cuenta. Hay ayuda si la necesitas.")}</p><div class="pathway-item"></div><button type="button" class="pathway-link" data-path-skip>Use full lesson instead</button>`;
    box.querySelector("[data-path-skip]")?.addEventListener("click", () => {
      path.choice = "full";
      save();
      paint();
    });
    const host = box.querySelector(".pathway-item");
    const onAnswer = (e) => {
      if (e.itemId !== item.id || path.entry.length !== index) return;
      if (!e.ok && host.dataset.entryMiss !== "1") {
        host.dataset.entryMiss = "1";
        path.entry.push({ ok: false, clean: false, skill: item.skill || "", tag: e.tag || "" });
      } else if (e.ok) {
        path.entry.push({
          ok: true,
          clean: e.tier === "clean" && host.dataset.entryMiss !== "1",
          skill: item.skill || "",
        });
      } else return;
      save();
      const next = document.createElement("button");
      next.type = "button";
      next.className = "pathway-primary";
      next.textContent =
        path.entry.length >= slots.length ? "See my suggested route" : "Next check";
      next.addEventListener("click", () => showCheck(slots), { once: true });
      box.append(next);
    };
    W.StudioBus.on("diagnostic-answer", onAnswer);
    mountItem({ tab, it: item, host, redeem: true });
  }

  W.StudioBus.on("answer", (e) => {
    if (
      e.lesson !== data.lesson ||
      e.mode !== data.mode ||
      e.redeem ||
      String(e.itemId).startsWith("entry_")
    )
      return;
    const ev = path.evidence;
    if (!e.ok) {
      if (e.tag) ev.misses[e.tag] = (ev.misses[e.tag] || 0) + 1;
      if (path.choice === "focused" && e.tag && ev.misses[e.tag] >= 2) path.recommendation = 2;
    } else if (!ev.byItem[`${e.itemId}@${e.seed ?? "static"}`]) {
      ev.byItem[`${e.itemId}@${e.seed ?? "static"}`] = e.tier || "assisted";
      if (e.tier === "clean") ev.independent++;
      else ev.assisted++;
      if (e.tier === "clean" && (e.tab >= 4 || /transfer|apply/i.test(e.skill || "")))
        ev.transfer++;
    }
    save();
    if (path.choice) paint();
  });
  W.StudioBus.on("progress", (e) => {
    if (e.lesson !== data.lesson || e.mode !== data.mode || path.choice !== "focused") return;
    const required =
      path.recommendation === 4 ? [4, 5] : path.recommendation === 3 ? [3, 4, 5] : [2, 3, 4, 5];
    const done = required.every((tab) =>
      sections[tab - 1].items.every((it) => {
        const id = it.id;
        return !!state[`solved${tab}`]?.[id] && !state.owed?.[id] && !state.flag?.[id];
      }),
    );
    if (done !== !!path.focusedDone) {
      path.focusedDone = done;
      save();
      paint();
    }
  });
  paint();
  W.StudioPathways = { recommend, entrySpecs };
})();
