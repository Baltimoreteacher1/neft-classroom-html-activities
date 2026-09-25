/**
 * worksheet-scaffold-css.mjs — the stylesheet for the work-area scaffolds the
 * worksheets print under a problem: long-division frames (`.wsd-*`, drawn by
 * worksheet-figures.mjs) and the strategy scaffolds (`.wss-*`, built by
 * worksheet-scaffolds.mjs). Kept verbatim from the previous generator so the
 * scaffold tests keep meaning what they meant.
 */
import { DIVISION_FIGURE_CSS } from "@eduwonderlab/engine/core/division-walk-figure.js";

export const SCAFFOLD_CSS = `
${DIVISION_FIGURE_CSS}
.wsd-wrap {
  display: flex;
  gap: 16px;
  align-items: stretch;
  margin: 10px 0 12px;
}
.wsd-supported {
  background: #fdfbf7;
  border: 1.5px solid var(--amber-border);
  border-left: 4px solid var(--amber-dark);
  border-radius: 8px;
  padding: 10px 14px;
}
.wsd-frame {
  background: #ffffff;
  border: 1.5px solid var(--line);
  border-radius: 6px;
  padding: 8px;
  display: inline-block;
}
.wsd { display: block; }
.wsd-cell { fill: #f8fafc; stroke: #cbd5e1; stroke-width: 1; stroke-dasharray: 2 2; }
.wsd-rule { stroke: #0f172a; stroke-width: 2; }
.wsd-given { font-family: var(--font-body); font-size: 15px; font-weight: 700; fill: #0f172a; }
.wsd-rail { list-style: none; display: flex; flex-direction: column; gap: 6px; margin: 0; padding: 0; min-width: 170px; }
.wsd-step { display: flex; align-items: center; gap: 8px; font-size: 11.5px; }
.wsd-step-n { width: 18px; height: 18px; border-radius: 50%; background: var(--navy); color: #ffffff; font-size: 10px; font-weight: 800; display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0; }
.wsd-step-t { font-weight: 800; color: var(--navy); }
.wsd-step-h { color: var(--muted); font-style: italic; font-size: 10.5px; }

/* ── Task-Responsive Workspace Scaffolds ─────────────────────────────────── */
.wss-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.wss-panel {
  background: #ffffff;
  border: 1.5px solid var(--line);
  border-radius: 6px;
  padding: 8px 12px;
}
.wss-panel-tight {
  padding: 6px 10px;
}
.wss-panel-t {
  display: block;
  font-size: 11px;
  font-weight: 800;
  color: var(--navy);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  margin-bottom: 6px;
}
.wss-rules {
  display: flex;
  flex-direction: column;
  gap: 22px;
  padding: 4px 0 6px;
}
.wss-rule {
  display: block;
  border-bottom: 1.5px solid var(--line-light);
  height: 0;
}

/* 2-Column Equation & Algebra Ledger */
.wss-ledger {
  width: 100%;
  border-collapse: collapse;
  border: 1.5px solid var(--line);
  border-radius: 6px;
  overflow: hidden;
  background: #ffffff;
}
.wss-ledger th {
  background: var(--navy);
  color: #ffffff;
  font-size: 11px;
  font-weight: 700;
  padding: 6px 10px;
  text-align: left;
  letter-spacing: 0.02em;
}
.wss-ledger th:last-child {
  background: #334155;
  border-left: 1.5px solid #475569;
}
.wss-cell {
  border: 1px solid var(--line-light);
  height: 28px;
  padding: 4px 8px;
  font-family: var(--font-mono);
  font-size: 13px;
}
.wss-cell-why {
  background: #fafbfc;
  border-left: 1.5px solid var(--line);
  color: var(--muted);
  font-family: var(--font-body);
  font-size: 12px;
}

/* Step-by-Step Slot Cards (Measure, Fraction, Statistics) */
.wss-steps {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.wss-slot {
  display: flex;
  align-items: center;
  gap: 10px;
  background: #ffffff;
  border: 1.5px solid var(--line);
  border-radius: 6px;
  padding: 6px 10px;
}
.wss-slot-t {
  flex: 0 0 160px;
  font-size: 11.5px;
  font-weight: 700;
  color: var(--navy);
}
.wss-slot-w {
  flex: 1;
  border-bottom: 1.5px solid var(--navy);
  height: 20px;
}

/* Proportional Ratio Table */
.wss-ratio {
  width: 100%;
  border-collapse: collapse;
  border: 1.5px solid var(--line);
  border-radius: 6px;
  overflow: hidden;
  background: #ffffff;
}
.wss-ratio th {
  background: #e2e8f0;
  color: var(--navy);
  font-size: 11.5px;
  font-weight: 800;
  padding: 6px 10px;
  height: 24px;
}
.wss-row-per {
  background: #f0fdf4;
}
.wss-row-per .wss-cell {
  border-top: 1.5px solid #86efac;
  border-bottom: 1.5px solid #86efac;
}
.wss-per {
  display: inline-block;
  background: #166534;
  color: #ffffff;
  font-size: 10.5px;
  font-weight: 800;
  padding: 2px 8px;
  border-radius: 999px;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

/* 10-Segment Percent Benchmark Bar */
.wss-bar {
  display: grid;
  grid-template-columns: repeat(10, 1fr);
  height: 24px;
  border: 2px solid var(--navy);
  border-radius: 4px;
  overflow: hidden;
  background: #ffffff;
  margin-bottom: 4px;
}
.wss-bar span {
  border-right: 1px dashed var(--line);
  background: #ffffff;
}
.wss-bar span:last-child {
  border-right: none;
}
.wss-barlab {
  display: flex;
  justify-content: space-between;
  font-size: 10.5px;
  font-weight: 800;
  color: var(--navy);
  margin-bottom: 6px;
  padding: 0 2px;
}

/* Place Value Decimal Alignment Grid */
.wss-cols {
  display: flex;
  justify-content: center;
  gap: 16px;
  padding: 6px 0;
}
.wss-col {
  width: 28px;
  height: 36px;
  border: 1px dashed var(--line);
  border-radius: 4px;
  background: #ffffff;
}
`;
