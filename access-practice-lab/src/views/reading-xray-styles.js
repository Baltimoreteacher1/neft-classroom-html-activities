// Reading X-Ray styles, injected once on the Reading Room route that uses them (the shell stylesheet budget is
// ratcheted, and a module is precached with the app). Tokens come from ds.css; Reading domain colour, no new palette.
// Meaning never rides on colour alone: links get an underline style, active ideas get a printed text tag.
const CSS = `
.rx{display:grid;gap:var(--s-3,.75rem);margin:var(--s-4,1rem) 0;padding:var(--s-3,.75rem) var(--s-4,1rem);border:1px solid var(--line-strong);border-left:4px solid var(--reading);border-radius:var(--radius-md,10px);background:var(--surface);min-width:0}
.rx-bar{display:grid;gap:.4rem}
.rx-title{margin:0;font-size:1.0625rem;color:var(--reading-ink)}
.rx-sub,.rx-how{margin:0;color:var(--ink-2);font-size:.9375rem;line-height:1.5}
.rx-lenses{display:flex;flex-wrap:wrap;gap:.5rem}
.rx-lens{min-height:44px;padding:.45rem .85rem;border:1px solid var(--line-control);border-radius:var(--radius-sm,6px);background:var(--surface);color:var(--ink);font:inherit;font-weight:600;cursor:pointer}
.rx-lens[aria-pressed="true"]{background:var(--reading);border-color:var(--reading);color:#fff}
.rx-lens[aria-pressed="true"]::before{content:"\\2713\\00a0"}
.rx-panel{display:grid;gap:.6rem;border-top:1px solid var(--line);padding-top:.6rem}
.rx-detail{margin:0;min-height:1.5em;font-weight:600;color:var(--reading-ink);overflow-wrap:anywhere}
.rx-detail:empty{display:none}
.rx-list{margin:0;padding-left:1.25rem;display:grid;gap:.35rem}
.rx-item{min-height:44px;width:100%;text-align:left;padding:.45rem .6rem;border:1px solid var(--line);border-radius:var(--radius-sm,6px);background:var(--surface-2,var(--surface));color:var(--ink);font:inherit;line-height:1.45;cursor:pointer;overflow-wrap:anywhere}
.rx-item.is-on{border-color:var(--reading);box-shadow:inset 3px 0 0 var(--reading)}
.rx-kind{font-size:.8125rem;font-weight:700;color:var(--reading-ink);text-transform:uppercase;letter-spacing:.02em}
.rx-where{display:inline-block;font-size:.8125rem;color:var(--ink-2)}
.rx-locked{color:var(--ink-2);padding:.35rem 0}
.rx-all-title{margin:0;font-size:.9375rem;font-weight:700;color:var(--reading-ink)}
.rx :focus-visible,.rr-passage .rx-anchor:focus-visible,.rx-role:focus-visible{outline:3px solid var(--focus);outline-offset:2px}
.rr-passage{position:relative}
.rr-passage .rx-anchor{display:inline;min-height:0;margin:0;padding:0 .1em;border:0;border-bottom:2px dotted var(--reading);border-radius:2px;background:none;color:inherit;font:inherit;line-height:inherit;cursor:pointer}
.rr-passage .rx-anchor:hover{background:var(--reading-soft)}
.rr-passage .rx-anchor.is-on{border-bottom-style:solid;background:var(--reading-soft);font-weight:700}
.rr-passage .rx-span.is-on{background:var(--reading-soft);box-shadow:0 2px 0 var(--reading);border-radius:2px;-webkit-box-decoration-break:clone;box-decoration-break:clone}
.rr-passage .rx-span[data-rx-tag]::before{content:attr(data-rx-tag);display:inline-block;margin-right:.3em;padding:0 .35em;border:1px solid var(--reading);border-radius:4px;background:var(--surface);color:var(--reading-ink);font-size:.75em;font-weight:700;line-height:1.5;vertical-align:.1em}
.rx-role{display:inline-block;margin-right:.4em;padding:.05em .5em;border:1px solid var(--reading);border-radius:4px;color:var(--reading-ink);font-size:.8125em;font-weight:700;letter-spacing:.02em;text-transform:uppercase}
.rx-arrow{position:absolute;inset:0;pointer-events:none;overflow:visible}
.rx-arrow path{fill:none;stroke:var(--reading);stroke-width:2}
.rx-arrow marker path{fill:var(--reading);stroke:none}
@media (prefers-reduced-motion: reduce){.rx *,.rr-passage .rx-anchor,.rr-passage .rx-span{transition:none!important;animation:none!important}}
@media (forced-colors: active){.rr-passage .rx-span.is-on{outline:2px solid CanvasText}.rx-lens[aria-pressed="true"]{outline:3px solid Highlight}}
@media print{.rx-lenses,.rx-sub,.rx-how,.rx-arrow{display:none!important}.rx{border:1px solid #999;break-inside:avoid}.rx-item{border:0;padding:0;min-height:0;background:none}.rr-passage .rx-anchor{border-bottom:1px solid #000}}
`;

/** Add the X-Ray stylesheet to the document once. */
export function ensureXrayStyles() {
  if (typeof document === "undefined" || document.getElementById("rx-styles")) return;
  const style = document.createElement("style");
  style.id = "rx-styles";
  style.textContent = CSS;
  document.head.append(style);
}
