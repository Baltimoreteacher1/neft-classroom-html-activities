/** District pacing for the public units page: which unit is being taught,
 * the order units are taught in, and the "Today / Next" strip.
 *
 * Both inputs come from the generated `assets/pacing-unit-dates.generated.js`
 * (compiled from data/pacing-unit-ranges.json by tools/import-pacing-baseline.mjs):
 *   window.__NT_PACING_DATES  keyed by DISTRICT SEQUENCE (1 = Pre-Unit,
 *                             2 = Unit 3, …); each entry names its
 *                             `curriculum_unit`. Never index it by unit number.
 *   window.__NT_PACING_DAYS   one row per school day: [iso, lessonId, dayType, planTitle].
 * Pure helpers take their data as arguments so tools/curriculum-units-pacing.test.mjs
 * can pin them to a fixed date.
 */
(function () {
  "use strict";

  const MONTHS = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const MESES = [
    "ene",
    "feb",
    "mar",
    "abr",
    "may",
    "jun",
    "jul",
    "ago",
    "sep",
    "oct",
    "nov",
    "dic",
  ];
  const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const DIAS = ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"];

  /** "10/9/26" → "2026-10-09"; null when unparseable. @param {unknown} text */
  function isoFromUs(text) {
    const m = /^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/.exec(String(text || "").trim());
    if (!m) return null;
    const year = m[3].length === 2 ? 2000 + Number(m[3]) : Number(m[3]);
    return `${year}-${m[1].padStart(2, "0")}-${m[2].padStart(2, "0")}`;
  }

  /** Local calendar date as ISO (the plan is local, never UTC). @param {Date} date */
  function isoDate(date) {
    const p = (n) => String(n).padStart(2, "0");
    return `${date.getFullYear()}-${p(date.getMonth() + 1)}-${p(date.getDate())}`;
  }

  /** @param {string} iso */
  function parts(iso) {
    const [y, m, d] = iso.split("-").map(Number);
    return { month: m - 1, day: d, weekday: new Date(y, m - 1, d).getDay() };
  }

  /** "Aug 24". @param {string} iso */
  function shortDate(iso) {
    const p = parts(iso);
    return `${MONTHS[p.month]} ${p.day}`;
  }

  /** ["Fri Oct 9", "vie 9 oct"]. @param {string} iso */
  function dayLabels(iso) {
    const p = parts(iso);
    return [
      `${DAYS[p.weekday]} ${MONTHS[p.month]} ${p.day}`,
      `${DIAS[p.weekday]} ${p.day} ${MESES[p.month]}`,
    ];
  }

  /**
   * Curriculum unit number → its paced range. Entries without a
   * `curriculum_unit` (MSTAR) own no lessons and are skipped. Returns an empty
   * map for a stale generated file that predates `curriculum_unit`, so the page
   * prints no dates rather than the wrong ones.
   * @param {Record<string, any>} dates
   */
  function unitRanges(dates) {
    const out = new Map();
    if (!dates || typeof dates !== "object") return out;
    for (const [sequence, entry] of Object.entries(dates)) {
      const unit = Number(entry?.curriculum_unit);
      const start = isoFromUs(entry?.start_date);
      const end = isoFromUs(entry?.end_date);
      if (!unit || !start || !end || out.has(unit)) continue;
      out.set(unit, {
        unit,
        sequence: Number(sequence),
        start,
        end,
        days: Number(entry.instructional_days) || 0,
      });
    }
    return out;
  }

  /** First school day on or after `today` (weekends and holidays roll forward). */
  function anchorIndex(days, today) {
    if (!Array.isArray(days)) return -1;
    return days.findIndex((row) => Array.isArray(row) && String(row[0]) >= today);
  }

  /**
   * The unit being taught: the one whose range holds today, or — on a weekend
   * or holiday between units — the next school day.
   * @param {Map<number, any>} ranges @param {unknown[]} days @param {string} today
   */
  function currentUnit(ranges, days, today) {
    const index = anchorIndex(days, today);
    const anchor = index >= 0 ? String(days[index][0]) : today;
    for (const range of ranges.values()) {
      if (range.start <= anchor && anchor <= range.end) return range.unit;
    }
    return null;
  }

  /** "past" | "now" | "next" | "later" relative to the unit being taught; "" when unknown. */
  function unitStatus(range, current, ranges) {
    const now = current != null ? ranges.get(current) : null;
    if (!range || !now) return "";
    if (range.unit === now.unit) return "now";
    if (range.sequence < now.sequence) return "past";
    const after = [...ranges.values()].filter((r) => r.sequence > now.sequence);
    const nextSequence = Math.min(...after.map((r) => r.sequence));
    return range.sequence === nextSequence ? "next" : "later";
  }

  /** Unit numbers in district teaching order; unpaced units keep numeric order at the end. */
  function teachingOrder(unitNumbers, ranges) {
    return unitNumbers.slice().sort((a, b) => {
      const ra = ranges.get(Number(a));
      const rb = ranges.get(Number(b));
      if (ra && rb) return ra.sequence - rb.sequence;
      if (ra || rb) return ra ? -1 : 1;
      return Number(a) - Number(b);
    });
  }

  /** @param {unknown[]} row */
  function dayFrom(row) {
    return {
      date: String(row[0]),
      lessonId: String(row[1] || ""),
      dayType: String(row[2] || ""),
      planTitle: String(row[3] || ""),
    };
  }

  /**
   * Today's place in the plan and the school day after it.
   * @returns {{today: ReturnType<typeof dayFrom>, isToday: boolean, next: ReturnType<typeof dayFrom> | null} | null}
   */
  function todayAndNext(days, today) {
    const index = anchorIndex(days, today);
    if (index < 0) return null;
    const first = dayFrom(days[index]);
    const after = days.slice(index + 1).find((row) => Array.isArray(row));
    return { today: first, isToday: first.date === today, next: after ? dayFrom(after) : null };
  }

  /** The lesson a teacher would expect selected: today's, else the latest taught in that unit. */
  function currentLessonId(days, today, unit) {
    if (!Array.isArray(days)) return "";
    let found = "";
    const prefix = unit + "-";
    for (const row of days) {
      if (!Array.isArray(row) || String(row[0]) > today) break;
      if (String(row[1] || "").startsWith(prefix)) found = String(row[1]);
    }
    if (!found) {
      const next = days.find(
        (row) =>
          Array.isArray(row) && String(row[0]) >= today && String(row[1] || "").startsWith(prefix),
      );
      found = next ? String(next[1]) : "";
    }
    // Catch-up days are not rows on the unit card; select their core lesson.
    return found.replace(/-catchup$/, "");
  }

  /**
   * What a non-lesson day is, in both languages. The plan's own title is
   * English-only, so the bilingual wording is derived from its day type.
   * @param {ReturnType<typeof dayFrom>} day @param {number | null} unit
   */
  function nonLessonLabels(day, unit) {
    const title = day.planTitle;
    const u = unit != null ? unit : "";
    const dayNo = /day\s+(\d+)/i.exec(title)?.[1];
    const suffix = dayNo ? [` (day ${dayNo})`, ` (día ${dayNo})`] : ["", ""];
    if (/showcase/i.test(title))
      return ["Course showcase & reflection", "Exposición y reflexión del curso"];
    if (/mstar/i.test(title) && /admin/i.test(title)) return ["MSTAR testing", "Pruebas MSTAR"];
    if (/mstar/i.test(title)) return ["MSTAR preparation", "Preparación para MSTAR"];
    switch (day.dayType) {
      case "Project":
        return [`Unit ${u} project${suffix[0]}`, `Proyecto de la Unidad ${u}${suffix[1]}`];
      case "Review":
        return [`Unit ${u} review`, `Repaso de la Unidad ${u}`];
      case "Assessment":
        return /quiz/i.test(title)
          ? [`Unit ${u} quiz`, `Prueba corta de la Unidad ${u}`]
          : [`Unit ${u} test`, `Examen de la Unidad ${u}`];
      case "Flex":
        return ["Flex / catch-up day", "Día flexible para ponerse al día"];
      default:
        return [title || "No new lesson", "Sin lección nueva"];
    }
  }

  /**
   * One strip entry: labels plus the lesson to link, if the day has one.
   * @param {ReturnType<typeof dayFrom>} day
   * @param {(id: string) => {lessonId: string, title: string, displayTitle?: string} | null} findLesson
   * @param {Map<number, any>} ranges
   */
  function describeDay(day, findLesson, ranges) {
    const lesson = day.lessonId ? findLesson(day.lessonId) : null;
    if (lesson) {
      const name = String(lesson.displayTitle || lesson.title)
        .replace(/\s+/g, " ")
        .trim();
      const notes = {
        "Continued Lesson": [" (day 2)", " (día 2)"],
        "Catch-Up": [" (catch-up day)", " (día para ponerse al día)"],
      }[day.dayType] || ["", ""];
      // Lesson names are curriculum titles; only the "Lesson" word is translated.
      const nombre = name.replace(/^Lesson\b/, "Lección");
      return { lesson, en: name + notes[0], es: nombre + notes[1] };
    }
    let unit = null;
    for (const range of ranges.values()) {
      if (range.start <= day.date && day.date <= range.end) unit = range.unit;
    }
    const [en, es] = nonLessonLabels(day, unit);
    return { lesson: null, en, es };
  }

  /** @param {string} tag @param {string} [className] @param {string} [text] */
  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
  }

  /**
   * Fill the static #units-today placeholder. Returns false (and hides it)
   * when there is no plan for today, e.g. after the school year.
   * @param {HTMLElement} container
   * @param {{days: unknown[], ranges: Map<number, any>, today: string,
   *   findLesson: (id: string) => any, lessonHref: (lesson: any) => string}} opts
   */
  function renderToday(container, opts) {
    const plan = todayAndNext(opts.days, opts.today);
    if (!plan) {
      container.hidden = true;
      return false;
    }
    const list = el("ol", "units-today__list");
    const entries = [
      [plan.isToday ? ["Today", "Hoy"] : ["Next class", "Próxima clase"], plan.today],
    ];
    if (plan.next)
      entries.push([plan.isToday ? ["Next", "Después"] : ["Then", "Luego"], plan.next]);
    entries.forEach(([[label, etiqueta], day], index) => {
      const info = describeDay(day, opts.findLesson, opts.ranges);
      const [when, cuando] = dayLabels(day.date);
      const item = el("li", "units-today__item");
      item.dataset.date = day.date;
      if (index === 0) item.classList.add("is-today");
      const head = el("p", "units-today__when");
      head.append(el("strong", "", label), ` · ${when}`);
      const headEs = el("span", "units-today__es", ` · ${etiqueta} · ${cuando}`);
      headEs.lang = "es";
      head.appendChild(headEs);
      const what = el("p", "units-today__what");
      if (info.lesson) {
        const link = el("a", "units-today__link", info.en);
        link.href = opts.lessonHref(info.lesson);
        what.appendChild(link);
      } else {
        what.appendChild(el("span", "units-today__plan", info.en));
      }
      const es = el("p", "units-today__es units-today__what-es", info.es);
      es.lang = "es";
      item.append(head, what, es);
      list.appendChild(item);
    });
    const title = container.querySelector(".units-today__title");
    container.replaceChildren(...(title ? [title] : []), list);
    container.hidden = false;
    return true;
  }

  const api = {
    isoFromUs,
    isoDate,
    shortDate,
    dayLabels,
    unitRanges,
    currentUnit,
    unitStatus,
    teachingOrder,
    todayAndNext,
    currentLessonId,
    describeDay,
    renderToday,
  };
  /** @type {any} */ (window).NTUnitsPacing = api;
})();
