// Mr. Neft, the guide on the teacher and family pages: a friendly cartoon teacher, drawn in the lab's illustration
// style (DESIGN-SYSTEM.md "Icons and illustration": 3px navy stroke, round joins, fills from the palette), in the
// Deep Harbor palette: teal cardigan, ivory shirt, terracotta tie, gold lanyard badge.
// He blinks, waves hello when his bubble appears and moves his mouth while he talks (guided.css; all off with
// reduced motion). Decorative: the visible name next to him carries the meaning.

const NAVY = "#0d1c2e";
const S = `stroke="${NAVY}" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"`;

/** The guide as inline SVG. `talking` animates the mouth while an answer is on its way (off with reduced motion). */
export function guideArtSVG({ talking = false } = {}) {
  return `<svg class="mn-art${talking ? " is-talking" : ""}" viewBox="0 0 120 120" aria-hidden="true" focusable="false">
<circle cx="60" cy="60" r="56" fill="#d7efe9"/>
<path d="M4.5 70 a56 56 0 0 0 111 0 Z" fill="#fbe7c2"/>
<path d="M14 116 q4 -32 46 -34 q42 2 46 34 Z" fill="#0f766e" ${S}/>
<path d="M44 84 l16 30 l16 -30" fill="#fffcf5" ${S}/>
<path d="M60 92 l-4 5 l4 15 l4 -15 Z" fill="#c2532f" ${S}/>
<path d="M44 84 q-4 12 4 30 M76 84 q4 12 -4 30" fill="none" ${S}/>
<path d="M50 84 q10 22 20 0" fill="none" stroke="#e2a72e" stroke-width="3" stroke-linecap="round"/>
<rect x="64" y="98" width="13" height="10" rx="2" fill="#e2a72e" ${S}/>
<path d="M52 72 v10 h16 v-10" fill="#e3ad84" ${S}/>
<ellipse cx="34" cy="52" rx="6" ry="8" fill="#e3ad84" ${S}/>
<ellipse cx="86" cy="52" rx="6" ry="8" fill="#e3ad84" ${S}/>
<path d="M34 50 q0 -30 26 -30 q26 0 26 30 q0 26 -26 28 q-26 -2 -26 -28 Z" fill="#f0c39c" ${S}/>
<path d="M33 46 q-2 -26 27 -28 q30 0 28 28 q-6 -12 -18 -14 q-10 8 -26 6 q-8 2 -11 8 Z" fill="#3b2a20" ${S}/>
<circle cx="48" cy="52" r="8" fill="#fff" fill-opacity=".4" ${S}/>
<circle cx="72" cy="52" r="8" fill="#fff" fill-opacity=".4" ${S}/>
<path d="M56 52 h8" fill="none" ${S}/>
<g class="mn-eyes"><circle cx="48" cy="53" r="2.6" fill="${NAVY}"/><circle cx="72" cy="53" r="2.6" fill="${NAVY}"/></g>
<path d="M42 41 q6 -4 12 -1 M66 40 q6 -3 12 1" fill="none" ${S}/>
<circle cx="40" cy="64" r="4" fill="#e07a5f" opacity=".5"/>
<circle cx="80" cy="64" r="4" fill="#e07a5f" opacity=".5"/>
<path class="mn-mouth" d="M51 65 q9 8 18 0" fill="#8a3a2b" ${S}/>
<g class="mn-wave"><path d="M96 96 q6 -14 4 -26" fill="none" stroke="#0f766e" stroke-width="9" stroke-linecap="round"/><path d="M96 96 q6 -14 4 -26" fill="none" ${S} stroke-width="2"/><circle cx="100" cy="66" r="6.5" fill="#f0c39c" ${S}/></g>
<path d="M18 22 l3 -7 l3 7 l7 3 l-7 3 l-3 7 l-3 -7 l-7 -3 Z" fill="#e2a72e" ${S}/>
</svg>`;
}
