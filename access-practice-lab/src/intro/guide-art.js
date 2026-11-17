// Mr. Neft, the guide on the teacher and family pages: a friendly teacher drawn in the site illustration kit's
// editorial picture-book style (no outlines; form from a lit side and a shade side, one warm light from the upper
// left), in the Deep Harbor palette: teal cardigan, ivory shirt, terracotta tie, gold lanyard badge, round glasses.
// He blinks, waves hello when his bubble appears and moves his mouth while he talks (guided.css; all off with
// reduced motion). The animated parts keep their classes and pivots: .mn-eyes (60 53), .mn-mouth (60 66),
// .mn-wave (96 96). Decorative: the visible name next to him carries the meaning.

const SKIN = "#f0c39c";
const SKIN_SHADE = "#d9a47c";
const HAIR = "#3b2a20";
const TEAL = "#0f766e";
const TEAL_SHADE = "#0b5d57";
const TEAL_LIT = "#2b9488";
const INK = "#1d2b3a";

/** The guide as inline SVG. `talking` animates the mouth while an answer is on its way (off with reduced motion). */
export function guideArtSVG({ talking = false } = {}) {
  return `<svg class="mn-art${talking ? " is-talking" : ""}" viewBox="0 0 120 120" aria-hidden="true" focusable="false">
<circle cx="60" cy="60" r="56" fill="#d7efe9"/>
<path d="M4.5 70 a56 56 0 0 0 111 0 Z" fill="#fbe7c2"/>
<circle cx="42" cy="34" r="30" fill="#ffffff" opacity=".35"/>
<path d="M14 116 q4 -32 46 -34 q42 2 46 34 Z" fill="${TEAL}"/>
<path d="M60 82 q42 2 46 34 h-30 q2 -20 -16 -34 Z" fill="${TEAL_SHADE}" opacity=".55"/>
<path d="M22 100 q6 -14 22 -17" fill="none" stroke="${TEAL_LIT}" stroke-width="3" stroke-linecap="round" opacity=".7"/>
<path d="M44 84 l16 32 l16 -32 Z" fill="#fbf6ec"/>
<path d="M60 116 l16 -32 l2 2 l-16 30 Z" fill="#e6dccb"/>
<path d="M44 84 l9 9 l7 -9 Z M76 84 l-9 9 l-7 -9 Z" fill="#ffffff"/>
<path d="M56.5 88 h7 l-1.5 4 h-4 Z" fill="#a8432a"/>
<path d="M58 92 h4 l3 15 l-5 6 l-5 -6 Z" fill="#c8553d"/>
<path d="M60 92 h2 l3 15 l-5 6 Z" fill="#a8432a" opacity=".6"/>
<path d="M40 84 q-2 16 6 32 h4 q-8 -16 -4 -32 Z" fill="${TEAL_SHADE}"/>
<path d="M80 84 q2 16 -6 32 h-4 q8 -16 4 -32 Z" fill="${TEAL_SHADE}"/>
<path d="M49 85 q11 24 22 0" fill="none" stroke="#e2a72e" stroke-width="2.4" stroke-linecap="round"/>
<path d="M70 92 v6" stroke="#c98f1f" stroke-width="2" stroke-linecap="round"/>
<rect x="63" y="97" width="14" height="11" rx="2" fill="#e2a72e"/>
<rect x="63" y="97" width="14" height="3.5" rx="1.5" fill="#f3cd6f"/>
<rect x="66" y="102" width="8" height="1.8" rx=".9" fill="#a8741c" opacity=".7"/>
<path d="M52 70 v12 q8 5 16 0 v-12 Z" fill="${SKIN_SHADE}"/>
<ellipse cx="34" cy="53" rx="5.5" ry="7.5" fill="${SKIN}"/>
<ellipse cx="34.5" cy="54" rx="2.5" ry="4" fill="${SKIN_SHADE}"/>
<ellipse cx="86" cy="53" rx="5.5" ry="7.5" fill="${SKIN_SHADE}"/>
<path d="M34 50 q0 -30 26 -30 q26 0 26 30 q0 26 -26 28 q-26 -2 -26 -28 Z" fill="${SKIN}"/>
<path d="M66 21 q20 5 20 29 q0 26 -26 28 q18 -8 18 -30 q0 -18 -12 -27 Z" fill="${SKIN_SHADE}" opacity=".55"/>
<path d="M33 46 q-2 -26 27 -28 q30 0 28 28 q-5 -11 -17 -14 q-11 8 -27 6 q-8 2 -11 8 Z" fill="${HAIR}"/>
<path d="M44 26 q10 -6 22 -3" fill="none" stroke="#6a4c3a" stroke-width="2.4" stroke-linecap="round" opacity=".8"/>
<path d="M62 32 q10 -2 18 6" fill="none" stroke="#2a1d17" stroke-width="1.6" stroke-linecap="round" opacity=".6"/>
<path d="M42 42 q6 -3.5 12 -1 M66 41 q6 -2.5 12 1" fill="none" stroke="${HAIR}" stroke-width="2.6" stroke-linecap="round"/>
<circle cx="48" cy="52" r="8" fill="#ffffff" opacity=".28"/>
<circle cx="72" cy="52" r="8" fill="#ffffff" opacity=".28"/>
<g class="mn-eyes"><circle cx="48" cy="53" r="2.7" fill="${INK}"/><circle cx="72" cy="53" r="2.7" fill="${INK}"/><circle cx="49" cy="52" r=".9" fill="#ffffff"/><circle cx="73" cy="52" r=".9" fill="#ffffff"/></g>
<path d="M40 52 a8 8 0 0 1 16 0 a8 8 0 0 1 -16 0 Z M64 52 a8 8 0 0 1 16 0 a8 8 0 0 1 -16 0 Z M56 51 q4 -2 8 0 M40 51 l-5 -1 M80 51 l5 -1" fill="none" stroke="${INK}" stroke-width="1.8" stroke-linecap="round"/>
<path d="M45 47 a6 6 0 0 1 6 -1" fill="none" stroke="#ffffff" stroke-width="1.2" stroke-linecap="round" opacity=".8"/>
<path d="M59 57 q3 4 -1 6" fill="none" stroke="${SKIN_SHADE}" stroke-width="2" stroke-linecap="round"/>
<ellipse cx="40" cy="64" rx="4.5" ry="3" fill="#e07a5f" opacity=".4"/>
<ellipse cx="80" cy="64" rx="4.5" ry="3" fill="#e07a5f" opacity=".4"/>
<g class="mn-mouth"><path d="M51 64.5 Q60 67 69 64.5 Q67.5 73 60 73 Q52.5 73 51 64.5 Z" fill="#8a3a2b"/><path d="M52.5 65.4 Q60 67.4 67.5 65.4 L67 67 Q60 68.6 53 67 Z" fill="#ffffff"/><ellipse cx="60" cy="70.8" rx="4.5" ry="2" fill="#e98a6c"/></g>
<g class="mn-wave"><path d="M96 98 q6 -14 4 -26" fill="none" stroke="${TEAL}" stroke-width="10" stroke-linecap="round"/><path d="M98.5 96 q5 -12 3.4 -22" fill="none" stroke="${TEAL_SHADE}" stroke-width="3.5" stroke-linecap="round" opacity=".6"/><path d="M95.5 74 h9" stroke="#fbf6ec" stroke-width="3.5" stroke-linecap="round"/><ellipse cx="100" cy="66" rx="6.5" ry="7" fill="${SKIN}"/><path d="M102 60 a6.5 7 0 0 1 0 13 a4 7 0 0 0 0 -13 Z" fill="${SKIN_SHADE}"/><ellipse cx="94.5" cy="68" rx="2.4" ry="3.6" fill="${SKIN}" transform="rotate(-30 94.5 68)"/><path d="M97 61 v-2 M100 60 v-2.5 M103 61 v-2" stroke="${SKIN_SHADE}" stroke-width="1.2" stroke-linecap="round"/></g>
<path d="M21 14 q1.2 6.8 8 8 q-6.8 1.2 -8 8 q-1.2 -6.8 -8 -8 q6.8 -1.2 8 -8 Z" fill="#e2a72e"/>
<path d="M21 14 q1.2 6.8 8 8 h-8 Z" fill="#f3cd6f"/>
<circle cx="31" cy="12" r="1.6" fill="#f3cd6f"/>
</svg>`;
}
