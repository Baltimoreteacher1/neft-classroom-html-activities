/* plan-render.js — painting the plan, the margin marks, and the note rail.
 *
 * Kept separate from plan-notes.js because this is the part with no network and
 * no state: pages plus notes in, DOM out. That makes the relocation rule —
 * quote first, page second, unpinned never dropped — testable on its own, which
 * matters more here than anywhere else in the surface. Notes that silently
 * vanish are the failure this whole tool is built to avoid.
 */

const KIND_META = {
  timing: { icon: "⏱", label: "Timing", cls: "k-timing" },
  "watch-for": { icon: "⚠", label: "Watch-for", cls: "k-watch" },
  swap: { icon: "⇄", label: "Swap", cls: "k-swap" },
  resource: { icon: "🔗", label: "Resource", cls: "k-resource" },
  note: { icon: "✎", label: "Note", cls: "k-note" },
};

const LEVEL_LABEL = {
  0: "Level 0 — most support",
  1: "Level 1 — support",
  2: "Level 2 — enrichment",
};

/**
 * Find where each note belongs in the current document text.
 *
 * Exact quote match wins. A re-exported PDF reflows whitespace, so a
 * whitespace-insensitive pass runs before giving up on the quote. Page is the
 * fallback. Anything left over is "unpinned" — surfaced in its own tray, never
 * discarded.
 *
 * @param {object[]} notes
 * @param {{page:number,text:string}[]} pages
 */
export function relocateAll(notes, pages) {
  return notes.map((note) => {
    const quote = note.anchorRef?.quote || "";
    if (quote) {
      for (const p of pages) {
        const idx = p.text.indexOf(quote);
        if (idx !== -1) return { note, status: "quote", page: p.page, offset: idx, quote };
      }
      const loose = quote.replace(/\s+/g, " ").trim();
      for (const p of pages) {
        const idx = p.text.replace(/\s+/g, " ").indexOf(loose);
        if (idx !== -1) return { note, status: "quote-loose", page: p.page, offset: idx, quote };
      }
    }
    const page = note.anchorRef?.page;
    if (page != null && pages.some((p) => p.page === page)) {
      return { note, status: "page", page, offset: null, quote };
    }
    return { note, status: "unpinned", page: null, offset: null, quote };
  });
}

/**
 * Paint the plan text with a highlight and a margin dot per pinned note.
 * Built from text nodes rather than innerHTML: plan documents are outside
 * content, and there is no reason to hand them a path to script injection.
 */
export function renderPlan(container, pages, resolved, onMarkClick) {
  container.textContent = "";

  for (const p of pages) {
    const section = document.createElement("section");
    section.className = "pn-page";
    section.dataset.page = String(p.page);

    if (pages.length > 1) {
      const h = document.createElement("h3");
      h.className = "pn-page-num";
      h.textContent = `Page ${p.page}`;
      section.appendChild(h);
    }

    // Every quote anchored to this page, in document order, so the text can be
    // walked once and split around them.
    const marks = resolved
      .filter((r) => r.page === p.page && r.offset != null && r.quote)
      .sort((a, b) => a.offset - b.offset);

    const body = document.createElement("div");
    body.className = "pn-page-body";

    let cursor = 0;
    for (const m of marks) {
      // Overlapping quotes: the second one starts before the first ended. Skip
      // it here rather than producing tangled markup — its rail entry still
      // shows, so the note is not lost, only un-highlighted.
      if (m.offset < cursor) continue;
      body.appendChild(document.createTextNode(p.text.slice(cursor, m.offset)));

      const mark = document.createElement("mark");
      const meta = KIND_META[m.note.kind] || KIND_META.note;
      mark.className = `pn-mark ${meta.cls}`;
      mark.dataset.noteId = m.note.id;
      mark.title = `${meta.label}: ${m.note.body || m.note.bodyAlt || ""}`.slice(0, 200);
      mark.textContent = p.text.substr(m.offset, m.quote.length);
      mark.addEventListener("click", () => onMarkClick(m.note.id));
      body.appendChild(mark);

      cursor = m.offset + m.quote.length;
    }
    body.appendChild(document.createTextNode(p.text.slice(cursor)));

    section.appendChild(body);
    container.appendChild(section);
  }
}

function chip(text, cls) {
  const el = document.createElement("span");
  el.className = `pn-chip ${cls || ""}`.trim();
  el.textContent = text;
  return el;
}

/** The note rail. Pinned notes first, unpinned last and marked as such. */
export function renderRail(list, resolved, vocab, onEdit) {
  list.textContent = "";

  const order = { quote: 0, "quote-loose": 0, page: 1, unpinned: 2 };
  const sorted = [...resolved].sort((a, b) => {
    const byStatus = order[a.status] - order[b.status];
    if (byStatus !== 0) return byStatus;
    if (a.page !== b.page) return (a.page ?? 0) - (b.page ?? 0);
    return (a.offset ?? 0) - (b.offset ?? 0);
  });

  for (const r of sorted) {
    const n = r.note;
    const meta = KIND_META[n.kind] || KIND_META.note;

    const li = document.createElement("li");
    li.className = `pn-note ${meta.cls}`;
    if (r.status === "unpinned") li.classList.add("is-unpinned");

    const head = document.createElement("button");
    head.type = "button";
    head.className = "pn-note-head";
    head.addEventListener("click", () => onEdit(n));

    const kindEl = document.createElement("span");
    kindEl.className = "pn-note-kind";
    kindEl.textContent = `${meta.icon} ${meta.label}`;
    head.appendChild(kindEl);

    if (n.origin === "ai") head.appendChild(chip("drafted", "pn-chip-ai"));
    if (n.pending) head.appendChild(chip("syncing", "pn-chip-pending"));
    if (r.status === "unpinned") head.appendChild(chip("unpinned", "pn-chip-warn"));
    li.appendChild(head);

    if (n.kind === "timing" && n.timingMin != null) {
      const t = document.createElement("p");
      t.className = "pn-note-strong";
      t.textContent = `${n.timingMin} min`;
      li.appendChild(t);
    }

    if (n.body) {
      const p = document.createElement("p");
      p.className = "pn-note-body";
      p.textContent = n.body;
      li.appendChild(p);
    }

    if (n.kind === "swap" && n.bodyAlt) {
      const alt = document.createElement("p");
      alt.className = "pn-note-alt";
      alt.textContent = `→ ${n.bodyAlt}`;
      li.appendChild(alt);
      if (n.level != null) li.appendChild(chip(LEVEL_LABEL[n.level], "pn-chip-level"));
    }

    for (const tag of n.misconceptionTags || []) {
      li.appendChild(chip(vocab.misconceptions[tag]?.label || tag, "pn-chip-tag"));
    }

    for (const path of n.activityRefs || []) {
      const a = document.createElement("a");
      a.className = "pn-note-link";
      a.href = path;
      a.target = "_blank";
      a.rel = "noopener";
      a.textContent = vocab.activities.find((x) => x.path === path)?.title || path;
      li.appendChild(a);
    }

    if (r.quote && r.status !== "unpinned") {
      const q = document.createElement("p");
      q.className = "pn-note-quote";
      q.textContent = `“${r.quote.slice(0, 90)}${r.quote.length > 90 ? "…" : ""}”`;
      li.appendChild(q);
    }

    list.appendChild(li);
  }
}

/**
 * The strip a teacher actually glances at before teaching: how much time the
 * notes account for, which mistakes are flagged, what is pinned in.
 */
export function renderSummary(container, resolved, vocab) {
  const notes = resolved.map((r) => r.note);
  container.textContent = "";
  container.hidden = notes.length === 0;
  if (!notes.length) return;

  const minutes = notes.reduce((sum, n) => sum + (n.timingMin || 0), 0);
  const tags = [...new Set(notes.flatMap((n) => n.misconceptionTags || []))];
  const swaps = notes.filter((n) => n.kind === "swap").length;
  const resources = [...new Set(notes.flatMap((n) => n.activityRefs || []))];

  if (minutes) container.appendChild(chip(`${minutes} min noted`, "pn-chip-time"));
  if (swaps) container.appendChild(chip(`${swaps} swap${swaps === 1 ? "" : "s"}`, "pn-chip-level"));
  for (const t of tags) {
    container.appendChild(chip(vocab.misconceptions[t]?.label || t, "pn-chip-tag"));
  }
  for (const path of resources) {
    container.appendChild(
      chip(vocab.activities.find((x) => x.path === path)?.title || path, "pn-chip-res"),
    );
  }
}
