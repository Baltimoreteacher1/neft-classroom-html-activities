/* Forecast Engine — Groups: who to pull, in what groups, in the time you have. */
(() => {
  "use strict";
  const NFE = window.NFE;
  const { S, M, esc, fmt, store } = NFE;
  NFE.views = NFE.views || {};

  /** Support tags map to neutral levels, never to a label for the student. */
  const tier = (tags) =>
    /ml|newcomer|esol|ell|iep|504/i.test(String(tags || ""))
      ? ["info", "Level 1 scaffold"]
      : ["ok", "Level 2 extension"];
  const moveKey = (id, code) => `${id}|${code}`;

  /** Support groups with the teacher's manual moves applied. */
  function currentGroups() {
    const s = store.state;
    const base = M.supportGroups(NFE.grid(), s.settings.target);
    const byCode = new Map(base.map((g) => [g.standard.code, { standard: g.standard, kids: [] }]));
    base.forEach((g) =>
      g.kids.forEach((k) => {
        const to = s.groupMoves[moveKey(k.student.id, g.standard.code)];
        const dest = to && s.standards.some((x) => x.code === to) ? to : g.standard.code;
        if (!byCode.has(dest))
          byCode.set(dest, { standard: s.standards.find((x) => x.code === dest), kids: [] });
        byCode
          .get(dest)
          .kids.push({ ...k, moved: dest !== g.standard.code, from: g.standard.code });
      }),
    );
    return [...byCode.values()]
      .filter((g) => g.kids.length)
      .map((g) => ({ ...g, kids: g.kids.sort((a, b) => a.f.proj - b.f.proj) }))
      .sort((a, b) => b.kids.length - a.kids.length);
  }

  function lessonShape(min) {
    const a = Math.max(1, Math.round(min * 0.2));
    const b = Math.max(2, Math.round(min * 0.3));
    const d = Math.max(1, Math.round(min * 0.15));
    return `${a} min warm-up · ${b} min worked example · ${Math.max(2, min - a - b - d)} min guided practice · ${d} min exit check`;
  }

  function groupCard(g, planned) {
    const s = store.state;
    const s0 = s.groupNames[`g_${g.standard.code}`] || "";
    const others = s.standards.filter((x) => x.code !== g.standard.code);
    const names = g.kids.map((k) => k.student.name).join(", ");
    return `<article class="card group-card" data-code="${esc(g.standard.code)}">
      <div class="card-head"><div><label class="sr" for="gn-${esc(g.standard.code)}">Group name</label><input class="group-title" id="gn-${esc(g.standard.code)}" data-gname="${esc(g.standard.code)}" value="${esc(s0 || `${g.standard.code}: ${g.standard.desc}`)}"></div>${NFE.badge(planned ? "on" : "watch", planned ? "In this week's plan" : "Waiting for time")}</div>
      <p class="muted">${fmt.plural(g.kids.length, "student")} · average forecast ${Math.round(S.mean(g.kids.map((k) => k.f.proj)))}%</p>
      <ul class="kids">${g.kids
        .map((k) => {
          const [kind, label] = tier(k.student.tags);
          return `<li><span class="kid-name">${esc(k.student.name)}${k.moved ? ` <span class="muted small-note">(moved from ${esc(k.from)})</span>` : ""}</span><span class="kid-num">${Math.round(k.f.proj)}%</span><span class="kid-meta">${NFE.trendChip(k.f)}${NFE.badge(kind, label)}
            <label class="move"><span class="sr">Move ${esc(k.student.name)} to another group</span><select data-move="${esc(k.student.id)}" data-from="${esc(k.from)}"><option value="">Move to…</option>${others.map((x) => `<option value="${esc(x.code)}">${esc(x.code)}</option>`).join("")}${k.moved ? '<option value="__back">Back to original</option>' : ""}</select></label></span></li>`;
        })
        .join("")}</ul>
      <p class="muted small-note">Suggested ${s.settings.minutes}-minute session: ${esc(lessonShape(s.settings.minutes))}.</p>
      <div class="btn-row"><button class="btn small" type="button" data-copy="${esc(names)}">${NFE.icon("copy", 16)}Copy names for Canvas</button></div></article>`;
  }

  function planCard(plan) {
    const s = store.state;
    if (!plan.planned.length) return "";
    const pct = plan.studentsNeeding
      ? Math.round((100 * plan.studentsCovered) / plan.studentsNeeding)
      : 100;
    return `<section class="card" aria-labelledby="h-plan"><h2 id="h-plan">This week's plan</h2>
      ${NFE.say(`With <strong>${s.settings.weeklyMinutes} minutes</strong> a week you can run <strong>${fmt.plural(plan.planned.length, "group")}</strong> of ${s.settings.minutes} minutes. That reaches <strong>${plan.studentsCovered} of ${plan.studentsNeeding}</strong> students who need support (${pct}%).${plan.waiting.length ? ` ${fmt.plural(plan.waiting.length, "group")} will have to wait. Another ${plan.minutesWanted - plan.minutesUsed} minutes would cover everyone.` : " Everyone who needs support is covered."}`)}
      <div class="meter" role="img" aria-label="${pct} percent of students needing support are covered"><div class="meter-fill ${pct >= 80 ? "on" : pct >= 50 ? "watch" : "support"}" style="width:${pct}%"></div></div>
      <div class="table-wrap"><table class="plain"><thead><tr><th scope="col">Group</th><th scope="col">Standard</th><th scope="col">Students</th><th scope="col">Time</th></tr></thead><tbody>${plan.planned
        .map(
          (x, i) =>
            `<tr><th scope="row">${i + 1}</th><td>${esc(x.standard.code)}<br><span class="muted small-note">${esc(x.standard.desc)}</span></td><td>${esc(x.kids.map((k) => k.student.name).join(", "))}</td><td>${x.minutes} min</td></tr>`,
        )
        .join("")}</tbody></table></div>
      ${NFE.how("We look at every student below the target on each standard, split them into groups no bigger than your limit, and rank groups by how far below target their students sit. Then we fill the minutes you have, biggest need first.", "Raise the minutes to see how much more of the class you could reach. Lower the group size to see how many more sessions that creates.", "A student below target on several standards appears in several groups. Combine the topics when you can.")}</section>`;
  }

  NFE.views.groups = {
    mount(root) {
      const s = store.state;
      if (!s.evidence.length) {
        root.innerHTML = NFE.empty(
          "No scores yet",
          "Add scores and groups build themselves here.",
          '<button class="btn primary" data-go="data">Add scores</button>',
        );
        return;
      }
      root.innerHTML = `<section class="card" aria-labelledby="h-gset"><h2 id="h-gset">Settings</h2><div class="ctl-grid">
        ${NFE.slider({ path: "settings.target", label: "Target score", min: 40, max: 95, value: s.settings.target, unit: "%", help: "Students forecast below this are grouped for support." })}
        ${NFE.slider({ path: "settings.groupCap", label: "Biggest group", min: 2, max: 10, value: s.settings.groupCap, unit: " students" })}
        ${NFE.slider({ path: "settings.minutes", label: "Minutes per group", min: 5, max: 60, step: 5, value: s.settings.minutes, unit: " min" })}
        ${NFE.slider({ path: "settings.weeklyMinutes", label: "Small-group time each week", min: 15, max: 400, step: 15, value: s.settings.weeklyMinutes, unit: " min", help: "The minutes you can really protect." })}
        </div></section><div id="g-out"></div>`;
      NFE.views.groups.update(root);
    },
    update(root) {
      const out = NFE.$("#g-out", root);
      if (!out) return;
      const s = store.state;
      const groups = currentGroups();
      if (!groups.length) {
        out.innerHTML = NFE.empty(
          "Nobody is below the target",
          `No student is forecast under ${s.settings.target}%. Raise the target or add more scores.`,
        );
        return;
      }
      const plan = M.resourcePlan(groups, s.settings.target, {
        cap: s.settings.groupCap,
        minutes: s.settings.minutes,
        slots: Math.floor(s.settings.weeklyMinutes / s.settings.minutes),
      });
      const inPlan = new Set(plan.planned.map((p) => p.standard.code));
      out.innerHTML = `${planCard(plan)}<div class="btn-row noprint"><button class="btn" type="button" data-act="print-groups">${NFE.icon("print", 16)}Print group sheets</button></div><div class="grid g2" id="group-sheets">${groups.map((g) => groupCard(g, inPlan.has(g.standard.code))).join("")}</div>`;
    },
    wire(root) {
      NFE.bind(
        root,
        () => store.state,
        () => {
          store.touch();
          NFE.views.groups.update(root);
        },
      );
      root.addEventListener("change", (e) => {
        const mv = e.target.closest("[data-move]");
        if (mv && mv.value) {
          const key = moveKey(mv.dataset.move, mv.dataset.from);
          store.quiet((s) => {
            if (mv.value === "__back") delete s.groupMoves[key];
            else s.groupMoves[key] = mv.value;
          });
          NFE.toast(
            mv.value === "__back"
              ? "Student returned to the original group."
              : `Moved to ${mv.value}. Evidence is unchanged.`,
          );
          NFE.views.groups.update(root);
        }
        const name = e.target.closest("[data-gname]");
        if (name)
          store.quiet((s) => {
            s.groupNames[`g_${name.dataset.gname}`] = name.value.trim();
          });
      });
      root.addEventListener("click", async (e) => {
        const copy = e.target.closest("[data-copy]");
        if (copy) {
          const ok = await NFE.copy(copy.dataset.copy);
          NFE.toast(
            ok
              ? "Names copied. Paste them into Canvas Assign To."
              : "Copy failed. Select the names by hand.",
          );
        }
        if (e.target.closest("[data-act='print-groups']")) {
          document.body.dataset.print = "groups";
          window.print();
        }
      });
    },
  };
})();
