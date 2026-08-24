/* =============================================================================
 * Class Pulse — the one student-safe read of live class understanding.
 * -----------------------------------------------------------------------------
 * GET /api/class-pulse?days=7
 *   -> { ok, days, since, cohort, minCohort, suppressed, totalTagged,
 *        tags: [{ tag, label, labelEs, watchFor, count, share, standards }] }
 *
 * WHY THIS EXISTS SEPARATELY FROM /api/misconception-heatmap:
 *   The heatmap is a teacher instrument. It is TEACHER_KEY-gated and it returns
 *   lesson slugs, section names and per-lesson student counts — none of which
 *   may ever reach a student device. But three student-facing features (the
 *   Class Boss raid, Teach the Machine, and the map's student view) need to know
 *   what the class as a whole is getting wrong. This endpoint is the narrow,
 *   deliberately impoverished answer to that question:
 *
 *     - Misconception TAG COUNTS ONLY. No lesson, no section, no student, no
 *       timestamps finer than the window, no free text from any payload.
 *     - k-anonymity floor. Below MIN_COHORT distinct students or MIN_EVENTS
 *       tagged events in the window, it returns `suppressed: true` and an EMPTY
 *       tag list. With three kids in the data, "the class's top mistake" is one
 *       kid's mistake, and shipping that to a shared screen would out them.
 *     - The tag vocabulary is closed (data/misconception-labels.json). A tag the
 *       repo does not know about is dropped rather than echoed, so nothing a
 *       payload happens to contain can be reflected to other students.
 *
 * Clients MUST handle `suppressed: true` by falling back to curriculum defaults
 * (the standards graph), never by showing an empty or broken screen.
 *
 * Storage/auth mirror functions/api/misconception-heatmap.js: D1 as env.DB,
 * graceful 503 when the binding is absent, same idempotent DDL.
 * ========================================================================== */

// Kept in sync with data/misconception-labels.json (generated from
// engine/core/misconceptions.js). Inlined because Pages Functions cannot read
// repo data files at runtime; tools/validate-nervous-system.mjs asserts parity.
const TAG_LABELS = {
  "factors-multiples-confused": [
    "Confused factors with multiples",
    "Confundió factores con múltiplos",
  ],
  "property-order-vs-grouping": [
    "Confused the commutative and associative properties",
    "Confundió la propiedad conmutativa con la asociativa",
  ],
  "division-quotient-missing-zero": [
    "Dropped a placeholder zero in the quotient",
    "Omitió un cero de posición en el cociente",
  ],
  "factorization-stopped-early": [
    "Stopped factoring before every factor was prime",
    "Dejó de factorizar antes de que todos los factores fueran primos",
  ],
  "stat-question-no-variability": [
    "Chose a question with only one fixed answer",
    "Escogió una pregunta con una sola respuesta fija",
  ],
  "ratio-compared-without-common-basis": [
    "Compared two ratios without a common basis",
    "Comparó dos razones sin una base común",
  ],
  "decimal-place-value": [
    "Right digits, wrong magnitude",
    "Dígitos correctos, magnitud equivocada",
  ],
  "exponent-as-multiplication": [
    "Multiplied the base by the exponent",
    "Multiplicó la base por el exponente",
  ],
  "fraction-added-denominators": ["Added the denominators", "Sumó los denominadores"],
  "fraction-no-reciprocal": [
    "Divided fractions without inverting",
    "Dividió fracciones sin invertir",
  ],
  "fraction-straight-across-division": [
    "Divided numerators and denominators straight across",
    "Dividió numeradores y denominadores directamente",
  ],
  "geom-triangle-area-no-half": [
    "Found base × height but forgot the half",
    "Calculó base × altura pero olvidó la mitad",
  ],
  "geom-surface-area-as-volume": [
    "Found the volume instead of the surface area",
    "Halló el volumen en vez del área total",
  ],
  "geom-volume-added-dimensions": [
    "Added the dimensions instead of multiplying",
    "Sumó las dimensiones en vez de multiplicarlas",
  ],
  "algebra-distributive-partial": [
    "Distributed to the first term only",
    "Distribuyó solo al primer término",
  ],
  "equation-not-inverse-operation": ["Did not undo the operation", "No deshizo la operación"],
  "equation-answered-with-given-number": [
    "Answered with a number already in the equation",
    "Respondió con un número que ya estaba en la ecuación",
  ],
  "inequality-direction-flipped": [
    "Right boundary, symbol reversed",
    "Límite correcto, símbolo invertido",
  ],
  "inequality-boundary-inclusion": [
    "Boundary value wrongly included or excluded",
    "Valor límite incluido o excluido por error",
  ],
  "inequality-graph-direction": [
    "Graph shaded toward the wrong side",
    "Gráfica sombreada hacia el lado equivocado",
  ],
  "stat-range-for-iqr": [
    "Used the full range instead of the IQR",
    "Usó el rango completo en vez del rango intercuartílico",
  ],
  "stat-center-vs-spread": [
    "Confused a measure of center with a measure of spread",
    "Confundió una medida de centro con una de dispersión",
  ],
  "stat-mean-skewed-by-outlier": [
    "Chose the mean when an outlier distorts it",
    "Eligió la media cuando un valor atípico la distorsiona",
  ],
  "stat-frequency-vs-value": [
    "Reported a data value where a frequency was asked",
    "Dio un valor de los datos donde se pedía una frecuencia",
  ],
  "coord-xy-swapped": ["Swapped the x and y coordinates", "Intercambió las coordenadas x e y"],
  "measure-area-perimeter-swap": ["Swapped area and perimeter", "Intercambió área y perímetro"],
  "op-added-instead-of-multiplied": [
    "Added when the problem multiplies",
    "Sumó cuando el problema multiplica",
  ],
  "op-divided-instead-of-multiplied": [
    "Divided when the problem multiplies",
    "Dividió cuando el problema multiplica",
  ],
  "op-multiplied-instead-of-added": [
    "Multiplied when the problem adds",
    "Multiplicó cuando el problema suma",
  ],
  "op-multiplied-instead-of-divided": [
    "Multiplied when the problem divides",
    "Multiplicó cuando el problema divide",
  ],
  "op-reversed-division": ["Divided in the wrong order", "Dividió en el orden equivocado"],
  "op-reversed-subtraction": ["Subtracted in the wrong order", "Restó en el orden equivocado"],
  "order-of-operations-left-to-right": [
    "Worked left to right instead of by operation order",
    "Trabajó de izquierda a derecha en vez de seguir el orden de operaciones",
  ],
  "percent-scale-off-by-100": [
    "Percent answer off by a factor of 100",
    "Respuesta de porcentaje errada por un factor de 100",
  ],
  "percent-used-as-whole-number": [
    "Used the percent as a plain number",
    "Usó el porcentaje como número entero",
  ],
  "rate-not-per-one": [
    "Gave the total instead of the unit rate",
    "Dio el total en vez de la tasa unitaria",
  ],
  "ratio-inverted": ["Flipped the ratio", "Invirtió la razón"],
  "ratio-scaled-additively": [
    "Scaled a ratio by adding instead of multiplying",
    "Escaló una razón sumando en vez de multiplicando",
  ],
  "ratio-as-difference": [
    "Combined the two amounts instead of comparing them",
    "Combinó las dos cantidades en vez de compararlas",
  ],
  "stat-mean-vs-median": [
    "Used the mean where the median was asked (or the reverse)",
    "Usó la media donde se pedía la mediana (o al revés)",
  ],
  "stat-histogram-bin-misread": [
    "Misread the bins or the scale on a data display",
    "Leyó mal los intervalos o la escala de una gráfica",
  ],
  "sign-dropped": [
    "Right magnitude, lost the negative sign",
    "Magnitud correcta, perdió el signo negativo",
  ],
  "stat-summed-instead-of-averaged": [
    "Added the data set instead of averaging it",
    "Sumó el conjunto de datos en vez de promediarlo",
  ],
};

// Which standard each tag is diagnostic of — mirrors the tagStandards block of
// data/standards-prerequisites.json so the Boss and the map agree on targets.
const TAG_STANDARDS = {
  "factors-multiples-confused": ["6.NOS.4"],
  "property-order-vs-grouping": ["6.AT.7"],
  "division-quotient-missing-zero": ["6.NOS.2"],
  "factorization-stopped-early": ["6.NOS.4"],
  "stat-question-no-variability": ["6.DS.1"],
  "ratio-compared-without-common-basis": ["6.AT.3"],
  "decimal-place-value": ["6.NOS.3"],
  "exponent-as-multiplication": ["6.AT.5"],
  "fraction-added-denominators": ["6.NOS.1", "6.NOS.4"],
  "fraction-no-reciprocal": ["6.NOS.1"],
  "fraction-straight-across-division": ["6.NOS.1"],
  "geom-triangle-area-no-half": ["6.GR.1"],
  "geom-surface-area-as-volume": ["6.GR.4"],
  "geom-volume-added-dimensions": ["6.GR.2"],
  "algebra-distributive-partial": ["6.AT.7"],
  "equation-not-inverse-operation": ["6.AT.8"],
  "equation-answered-with-given-number": ["6.AT.8"],
  "inequality-direction-flipped": ["6.AT.9", "6.AT.8"],
  "inequality-boundary-inclusion": ["6.AT.9"],
  "inequality-graph-direction": ["6.AT.9"],
  "stat-range-for-iqr": ["6.DS.3", "6.DS.5"],
  "stat-center-vs-spread": ["6.DS.3", "6.DS.4"],
  "stat-mean-skewed-by-outlier": ["6.DS.6d", "6.DS.4"],
  "stat-frequency-vs-value": ["6.DS.5"],
  "coord-xy-swapped": ["6.NOS.6", "6.NOS.7"],
  "measure-area-perimeter-swap": ["6.GR.1"],
  "op-added-instead-of-multiplied": ["6.AT.6a"],
  "op-divided-instead-of-multiplied": ["6.AT.3"],
  "op-multiplied-instead-of-added": ["6.AT.6a"],
  "op-multiplied-instead-of-divided": ["6.AT.2"],
  "op-reversed-division": ["6.AT.2", "6.NOS.2"],
  "op-reversed-subtraction": ["6.AT.6a"],
  "order-of-operations-left-to-right": ["6.AT.5", "6.AT.6c"],
  "percent-scale-off-by-100": ["6.AT.4"],
  "percent-used-as-whole-number": ["6.AT.4"],
  "rate-not-per-one": ["6.AT.2"],
  "ratio-inverted": ["6.AT.1"],
  "ratio-scaled-additively": ["6.AT.1", "6.AT.3c"],
  "ratio-as-difference": ["6.AT.1"],
  "stat-mean-vs-median": ["6.DS.4", "6.DS.3"],
  "stat-histogram-bin-misread": ["6.DS.5"],
  "sign-dropped": ["6.NOS.5", "6.NOS.6c"],
  "stat-summed-instead-of-averaged": ["6.DS.4"],
};

// k-anonymity floor. Both must be met before ANY tag is released.
const MIN_COHORT = 5;
const MIN_EVENTS = 12;

const JSON_HEADERS = {
  "Content-Type": "application/json",
  "Cache-Control": "public, max-age=300",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), { status, headers: JSON_HEADERS });
}

async function ensureTelemetrySchema(db) {
  await db
    .prepare(
      `CREATE TABLE IF NOT EXISTS lesson_telemetry (
        id           INTEGER PRIMARY KEY AUTOINCREMENT,
        lesson_slug  TEXT,
        lesson_title TEXT,
        standard     TEXT,
        student_name TEXT,
        section      TEXT,
        event_type   TEXT,
        payload_json TEXT,
        created_at   TEXT NOT NULL
      )`,
    )
    .run();
}

/** Extract a KNOWN misconception tag from a payload blob, or "" . */
function payloadTag(payloadJson) {
  try {
    const p = JSON.parse(payloadJson || "{}");
    const nested = p.props && typeof p.props === "object" ? p.props : {};
    const raw = String(
      p.tag || p.misconceptionTag || p.misconception || nested.tag || nested.misconceptionTag || "",
    ).slice(0, 60);
    // Closed vocabulary: an unrecognised tag is dropped, never echoed.
    return Object.prototype.hasOwnProperty.call(TAG_LABELS, raw) ? raw : "";
  } catch {
    return "";
  }
}

function emptyPulse(days, since, extra = {}) {
  return {
    ok: true,
    days,
    since,
    cohort: 0,
    minCohort: MIN_COHORT,
    suppressed: true,
    totalTagged: 0,
    tags: [],
    ...extra,
  };
}

export async function onRequest(context) {
  const { request, env } = context;
  const method = request.method.toUpperCase();
  const url = new URL(request.url);

  if (method === "OPTIONS") return new Response(null, { status: 204, headers: JSON_HEADERS });
  if (method !== "GET") return json({ ok: false, error: "method-not-allowed" }, 405);

  const days = Math.min(Math.max(Number(url.searchParams.get("days")) || 7, 1), 60);
  const since = new Date(Date.now() - days * 86400000).toISOString();

  // No database bound: report an honest, well-formed empty pulse rather than an
  // error, so the Boss and Teach the Machine fall back to curriculum defaults
  // instead of showing a broken screen.
  if (!env.DB) return json(emptyPulse(days, since, { reason: "backend-not-configured" }));

  try {
    await ensureTelemetrySchema(env.DB);

    const rows = await env.DB.prepare(
      `SELECT student_name, payload_json
         FROM lesson_telemetry
        WHERE event_type = 'misconception' AND created_at >= ?
        ORDER BY id DESC LIMIT 6000`,
    )
      .bind(since)
      .all();

    const counts = new Map();
    const students = new Set();
    let totalTagged = 0;
    for (const r of rows.results || []) {
      const tag = payloadTag(r.payload_json);
      if (!tag) continue;
      counts.set(tag, (counts.get(tag) || 0) + 1);
      totalTagged += 1;
      if (r.student_name) students.add(r.student_name);
    }

    const cohort = students.size;
    if (cohort < MIN_COHORT || totalTagged < MIN_EVENTS) {
      // Deliberately withholds the tag list. See the k-anonymity note above.
      return json({
        ...emptyPulse(days, since, { reason: "below-cohort-floor" }),
        cohort,
        totalTagged,
      });
    }

    const tags = [...counts.entries()]
      .map(([tag, count]) => ({
        tag,
        label: TAG_LABELS[tag][0],
        labelEs: TAG_LABELS[tag][1],
        count,
        share: Math.round((count / totalTagged) * 1000) / 1000,
        standards: TAG_STANDARDS[tag] || [],
      }))
      .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag))
      .slice(0, 8);

    return json({
      ok: true,
      days,
      since,
      cohort,
      minCohort: MIN_COHORT,
      suppressed: false,
      totalTagged,
      tags,
    });
  } catch (err) {
    return json({ ok: false, error: "server-error", message: String(err) }, 500);
  }
}

export const __test__ = { TAG_LABELS, TAG_STANDARDS, MIN_COHORT, MIN_EVENTS, payloadTag };
