/**
 * Accurate, self-hosted Core Web Vitals adapter.
 *
 * Vite bundles the official `web-vitals` package into this stable path. The
 * usage beacon imports it lazily so performance measurement never blocks a
 * lesson, and only the metric name/value/rating leave the browser—no element
 * selectors, interaction targets, URLs, or identifiers.
 */
import { onCLS, onINP, onLCP } from "web-vitals";

export const NT_WEB_VITALS_CONTRACT = "nt-web-vitals:v1";

export function observeCoreWebVitals(report) {
  if (typeof report !== "function") return;

  const forward = (metric) => {
    const value = Number(metric && metric.value);
    if (!metric || !Number.isFinite(value)) return;
    report({
      metric: metric.name,
      value,
      rating: metric.rating,
    });
  };

  onCLS(forward);
  onINP(forward);
  onLCP(forward);
}

if (typeof window !== "undefined" && window.NTUsage) {
  window.NTWebVitalsContract = NT_WEB_VITALS_CONTRACT;
  observeCoreWebVitals(window.NTUsage.reportVital);
}
