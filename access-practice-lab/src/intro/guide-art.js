// Mr. Neft, the guide on the teacher and family pages: a friendly cartoon teacher, drawn in the lab's illustration
// style (DESIGN-SYSTEM.md "Icons and illustration": 3px navy stroke, round joins, fills from the palette).
// Decorative: the visible name next to him carries the meaning.

const NAVY = "#17324d";
const S = `stroke="${NAVY}" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"`;

/** The guide as inline SVG. `talking` animates the mouth while an answer is on its way (off with reduced motion). */
export function guideArtSVG({ talking = false } = {}) {
  return `<svg class="mn-art${talking ? " is-talking" : ""}" viewBox="0 0 120 120" aria-hidden="true" focusable="false">
<circle cx="60" cy="60" r="56" fill="#e4eafa"/>
<path d="M18 112 q4 -30 42 -32 q38 2 42 32 Z" fill="#1d2b58" ${S}/>
<path d="M48 82 l12 14 l12 -14" fill="#fbf8f1" ${S}/>
<path d="M60 96 l-4 6 l4 12 l4 -12 Z" fill="#9a4a26" ${S}/>
<path d="M52 72 v10 h16 v-10" fill="#e3ad84" ${S}/>
<ellipse cx="34" cy="52" rx="6" ry="8" fill="#e3ad84" ${S}/>
<ellipse cx="86" cy="52" rx="6" ry="8" fill="#e3ad84" ${S}/>
<path d="M34 50 q0 -30 26 -30 q26 0 26 30 q0 26 -26 28 q-26 -2 -26 -28 Z" fill="#f0c39c" ${S}/>
<path d="M33 46 q-2 -26 27 -28 q30 0 28 28 q-6 -12 -18 -14 q-10 8 -26 6 q-8 2 -11 8 Z" fill="#3b2a20" ${S}/>
<circle cx="48" cy="52" r="8" fill="#fff" fill-opacity=".35" ${S}/>
<circle cx="72" cy="52" r="8" fill="#fff" fill-opacity=".35" ${S}/>
<path d="M56 52 h8" fill="none" ${S}/>
<circle cx="48" cy="53" r="2.4" fill="${NAVY}"/>
<circle cx="72" cy="53" r="2.4" fill="${NAVY}"/>
<path d="M42 41 q6 -4 12 -1 M66 40 q6 -3 12 1" fill="none" ${S}/>
<circle cx="40" cy="64" r="4" fill="#e98f7a" opacity=".55"/>
<circle cx="80" cy="64" r="4" fill="#e98f7a" opacity=".55"/>
<path class="mn-mouth" d="M51 65 q9 8 18 0" fill="#8a3a2b" ${S}/>
<path d="M98 22 l3 -7 l3 7 l7 3 l-7 3 l-3 7 l-3 -7 l-7 -3 Z" fill="#f5d6a8" ${S}/>
</svg>`;
}
