// Thirty spot illustrations, 240x180, one flat/soft style. Informative: each ships role="img" + <title>
// (a page that already describes the picture in nearby text can hide it with aria-hidden on the host).
import { at, bush, cloud, person, place, star4, svg, tree } from "./family-art-kit.mjs";

const bg = (cy = 88, r = 76) =>
  `<ellipse cx="120" cy="152" rx="88" ry="8" class="xd"/><circle cx="120" cy="${cy}" r="${r}" class="xt"/>`;
const wrap = (title, body) => svg({ w: 240, h: 180, body: bg() + body, title });

export const SPOTS = {
  groceries: [
    "Paper grocery bag with an apple, bread and milk",
    () =>
      '<rect x="112" y="24" width="16" height="64" rx="8" class="xy" transform="rotate(14 120 56)"/><rect x="76" y="46" width="22" height="44" rx="3" class="xw"/><rect x="76" y="56" width="22" height="9" class="xa"/><circle cx="104" cy="74" r="15" class="xr"/><path d="M104 60q4-9 13-8-1 9-13 8z" class="xn"/><path d="M64 150l-6-68h98l-6 68z" class="xs2"/><path d="M58 82h98l-1.5 10H59.5z" class="xs1"/><path d="M92 122h30" class="qs3" stroke-width="3"/>',
  ],

  bus: [
    "City bus at a stop with a child waiting",
    () =>
      '<rect x="26" y="52" width="170" height="84" rx="16" class="xy"/><path d="M26 112h170" class="qa" stroke-width="6"/><rect x="40" y="64" width="26" height="30" rx="5" class="xw"/><rect x="72" y="64" width="26" height="30" rx="5" class="xw"/><rect x="104" y="64" width="26" height="30" rx="5" class="xw"/><rect x="140" y="62" width="22" height="48" rx="4" class="xt"/><rect x="168" y="64" width="20" height="30" rx="5" class="xw"/><circle cx="64" cy="138" r="14" class="xk"/><circle cx="64" cy="138" r="5" class="xw"/><circle cx="154" cy="138" r="14" class="xk"/><circle cx="154" cy="138" r="5" class="xw"/><path d="M210 150V70" class="qk" stroke-width="5"/><rect x="198" y="54" width="26" height="24" rx="6" class="xa"/>' +
      place(204, 150, { skin: 3, hair: "afro", top: "r", R: [20, -52] }, 0.5),
  ],

  court: [
    "Basketball half court seen from above with a hoop and ball",
    () =>
      '<rect x="30" y="34" width="180" height="112" rx="10" class="xw"/><path d="M30 146V34h180v112M30 146h180" class="qa" stroke-width="3"/><rect x="86" y="34" width="68" height="52" class="qa" stroke-width="3" fill="none"/><path d="M60 146a60 60 0 0 1 120 0" class="qa" stroke-width="3"/><path d="M104 86a16 16 0 0 0 32 0" class="qa" stroke-width="3"/><circle cx="120" cy="52" r="7" class="qr" stroke-width="3"/><path d="M104 40h32" class="qk" stroke-width="4"/>' +
      '<circle cx="152" cy="116" r="12" class="xr"/><path d="M140 116h24M152 104v24" class="qk" stroke-width="1.5"/>',
  ],

  kitchen: [
    "Cooking pot with steam and a measuring cup",
    () =>
      '<rect x="26" y="116" width="188" height="34" rx="8" class="xw"/><rect x="62" y="70" width="86" height="48" rx="10" class="xa"/><rect x="56" y="64" width="98" height="12" rx="6" class="xw"/><circle cx="105" cy="58" r="6" class="xk"/><path d="M62 90h-14M148 90h14" class="qk" stroke-width="5"/><path d="M86 48q-8-10 0-18t0-14M118 48q-8-10 0-18t0-14" class="qk" stroke-width="3" stroke-opacity=".35"/><path d="M168 118l-4-34h28l-4 34z" class="xw"/><path d="M168 96h22M170 106h18" class="qa" stroke-width="2.5"/><path d="M192 90q10 0 8 12" class="qk" stroke-width="3"/>',
  ],

  garden: [
    "Raised garden bed with sprouts and a watering can",
    () =>
      '<rect x="36" y="110" width="140" height="40" rx="6" class="xs4"/><rect x="30" y="104" width="152" height="10" rx="5" class="xs2"/>' +
      [66, 106, 146]
        .map(
          (x) =>
            `<path d="M${x} 108v-26M${x} 92q-14-2-16-16 14 0 16 16M${x} 86q14-2 16-16-14 0-16 16" class="qn" stroke-width="4"/>`,
        )
        .join("") +
      '<path d="M170 70h30l-6 24h-20z" class="xb"/><path d="M200 74l16-8" class="qb" stroke-width="5"/><path d="M174 70q10-14 22 0" class="qb" stroke-width="3"/><circle cx="214" cy="84" r="2.5" class="xb"/><circle cx="210" cy="96" r="2.5" class="xb"/>',
  ],

  phone: [
    "Phone with a signal bars and a chat bubble",
    () =>
      '<rect x="78" y="22" width="84" height="132" rx="16" class="xk"/><rect x="86" y="36" width="68" height="100" rx="8" class="xw"/><path d="M96 70v-8M108 70v-14M120 70v-20M132 70V44" class="qa" stroke-width="7"/><rect x="94" y="84" width="44" height="22" rx="8" class="xt"/><path d="M104 106l-2 8 10-8z" class="xt"/><circle cx="106" cy="95" r="2.5" class="xk"/><circle cx="116" cy="95" r="2.5" class="xk"/><circle cx="126" cy="95" r="2.5" class="xk"/><rect x="100" y="118" width="40" height="8" rx="4" class="xy"/><circle cx="120" cy="146" r="3" class="xw"/><path d="M168 54q18 0 18 18" class="qa" stroke-width="4"/><path d="M168 38q34 0 34 34" class="qa" stroke-width="4" stroke-opacity=".6"/>',
  ],

  "corner-store": [
    "Corner store with a striped awning and fruit crates",
    () =>
      '<rect x="34" y="52" width="172" height="98" rx="6" class="xw"/>' +
      [0, 1, 2, 3, 4, 5]
        .map(
          (i) =>
            `<path d="M${34 + i * 28.7} 52h28.7v18a14.3 14.3 0 0 1-28.7 0z" class="${i % 2 ? "xw" : "xa"}"/>`,
        )
        .join("") +
      '<rect x="46" y="92" width="76" height="44" rx="5" class="xt"/><rect x="140" y="84" width="48" height="66" rx="5" class="xs3"/><circle cx="178" cy="120" r="3" class="xy"/><rect x="36" y="130" width="40" height="20" rx="3" class="xs2"/><circle cx="46" cy="126" r="8" class="xr"/><circle cx="62" cy="126" r="8" class="xy"/><circle cx="72" cy="124" r="6" class="xn"/><rect x="82" y="134" width="40" height="16" rx="3" class="xs2"/><rect x="104" y="36" width="34" height="14" rx="7" class="xy"/><circle cx="121" cy="43" r="3" class="xk"/>' +
      place(210, 150, { skin: 2, scarf: "r", top: "w", dress: true, R: [-20, -44] }, 0.5),
  ],

  "rec-center": [
    "Rec center building with a banner and a ball",
    () =>
      '<rect x="30" y="66" width="180" height="84" rx="8" class="xw"/><path d="M30 80q90-40 180 0V66q-90-40-180 0z" class="xa"/><rect x="42" y="92" width="34" height="30" rx="5" class="xt"/><rect x="164" y="92" width="34" height="30" rx="5" class="xt"/><path d="M96 150v-40a24 24 0 0 1 48 0v40z" class="xs3"/><path d="M120 40V20" class="qk" stroke-width="3"/><path d="M120 20h26l-6 8 6 8h-26z" class="xy"/><circle cx="170" cy="142" r="9" class="xr"/><path d="M161 142h18M170 133v18" class="qk" stroke-width="1.2"/>' +
      place(196, 150, { skin: 4, hair: "cap", cap: "a", top: "y", R: [24, -30] }, 0.5),
  ],

  recipe: [
    "Recipe card with ingredients and measuring spoons",
    () =>
      '<rect x="40" y="30" width="116" height="116" rx="8" class="xw" transform="rotate(-4 98 88)"/><g transform="rotate(-4 98 88)"><rect x="40" y="30" width="116" height="26" rx="8" class="xa"/><path d="M52 74h12M52 92h12M52 110h12" class="qy" stroke-width="7"/><path d="M74 74h66M74 92h54M74 110h60" class="qk" stroke-width="3" stroke-opacity=".45"/></g><circle cx="190" cy="62" r="14" class="xy"/><path d="M178 76l-18 60" class="qy" stroke-width="5"/><circle cx="200" cy="108" r="10" class="xb"/><path d="M194 118l-22 24" class="qb" stroke-width="5"/>',
  ],

  sneakers: [
    "Sneaker next to a sale tag with a percent sign",
    () =>
      '<path d="M30 130V82q0-6 6-6h20l12 16 38 10q22 6 28 22v6z" class="xr"/><rect x="26" y="128" width="136" height="14" rx="7" class="xw"/><path d="M62 94l14 8M72 90l14 8" class="qw" stroke-width="3"/><path d="M178 38l22 24" class="qk" stroke-width="2"/><rect x="168" y="58" width="52" height="64" rx="10" class="xy" transform="rotate(8 194 90)"/><g transform="rotate(8 194 90)"><circle cx="182" cy="76" r="6" class="qk" stroke-width="3"/><circle cx="206" cy="104" r="6" class="qk" stroke-width="3"/><path d="M208 70l-28 40" class="qk" stroke-width="4"/></g>',
  ],

  lemonade: [
    "Lemonade stand with a pitcher and cups",
    () =>
      '<rect x="44" y="96" width="152" height="54" rx="6" class="xs2"/>' +
      [0, 1, 2, 3, 4]
        .map(
          (i) =>
            `<path d="M${40 + i * 32} 56h32v22a16 16 0 0 1-32 0z" class="${i % 2 ? "xa" : "xy"}"/>`,
        )
        .join("") +
      '<path d="M72 96l-6-30h28l-6 30z" class="xb"/><path d="M94 74q14 0 12 14" class="qb" stroke-width="4"/><rect x="132" y="80" width="16" height="16" rx="3" class="xw"/><rect x="152" y="80" width="16" height="16" rx="3" class="xw"/><rect x="142" y="64" width="16" height="16" rx="3" class="xw"/>',
  ],

  supplies: [
    "Pencil cup, ruler and notebook",
    () =>
      '<rect x="46" y="86" width="64" height="64" rx="8" class="xa"/><path d="M62 86V32M78 86V22M94 86V38" class="qy" stroke-width="9"/><path d="M62 32l-4-8M94 38l4-8" class="qr" stroke-width="4"/><path d="M78 22l0-6" class="qk" stroke-width="5"/><rect x="124" y="60" width="64" height="90" rx="6" class="xw"/><path d="M124 76h64M124 92h64M124 108h64" class="qk" stroke-width="1.5" stroke-opacity=".3"/><rect x="124" y="60" width="10" height="90" class="xr"/><rect x="146" y="124" width="64" height="16" rx="3" class="xy" transform="rotate(-12 178 132)"/>',
  ],

  pizza: [
    "Pizza cut into eight slices with one slice pulled out",
    () =>
      '<circle cx="108" cy="88" r="60" class="xy"/><circle cx="108" cy="88" r="50" class="xr" fill-opacity=".5"/><circle cx="108" cy="88" r="46" class="xw" fill-opacity=".55"/>' +
      [0, 1, 2, 3, 4, 5, 6, 7]
        .map(
          (i) =>
            `<path d="M108 88L${(108 + Math.cos(i * 0.7854 - 0.39) * 60).toFixed(1)} ${(88 + Math.sin(i * 0.7854 - 0.39) * 60).toFixed(1)}" class="qk" stroke-width="2" stroke-opacity=".4"/>`,
        )
        .join("") +
      '<circle cx="90" cy="70" r="7" class="xr"/><circle cx="124" cy="62" r="7" class="xr"/><circle cx="132" cy="100" r="7" class="xr"/><circle cx="94" cy="108" r="7" class="xr"/><g transform="translate(30 6)"><path d="M158 82l40-8a60 60 0 0 1-16 38z" class="xy"/><circle cx="182" cy="90" r="6" class="xr"/></g>',
  ],

  pool: [
    "Swimming pool with lane ropes and a ladder",
    () =>
      '<rect x="26" y="50" width="188" height="96" rx="14" class="xb"/><rect x="36" y="60" width="168" height="76" rx="8" class="xt"/>' +
      [84, 120, 156]
        .map(
          (y) => `<path d="M40 ${y - 14}H200" class="qa" stroke-width="4" stroke-dasharray="1 9"/>`,
        )
        .join("") +
      '<path d="M40 76H200M40 98H200M40 120H200" class="qb" stroke-width="2" stroke-opacity=".5"/><path d="M196 44v18M210 44v18M196 52h14" class="qk" stroke-width="4"/>',
  ],

  bike: [
    "Side view of a bicycle",
    () =>
      '<circle cx="66" cy="112" r="30" class="qk" stroke-width="6"/><circle cx="170" cy="112" r="30" class="qk" stroke-width="6"/><path d="M66 112l34-48h46l24 48M100 64l20 48H66M146 64l-8-22h22" class="qa" stroke-width="6"/><path d="M88 54h28" class="qk" stroke-width="8"/><circle cx="120" cy="112" r="5" class="xy"/>',
  ],

  thermometer: [
    "Thermometer between a sun and a snowflake",
    () =>
      '<rect x="108" y="22" width="24" height="108" rx="12" class="xw"/><circle cx="120" cy="132" r="18" class="xr"/><rect x="115" y="70" width="10" height="62" class="xr"/><path d="M138 36h12M138 54h12M138 72h18M138 90h12M138 108h12" class="qk" stroke-width="2.5"/><circle cx="52" cy="62" r="20" class="xy"/><path d="M52 28v10M52 86v10M18 62h10M76 62h10M28 38l7 7M69 79l7 7M76 38l-7 7M35 79l-7 7" class="qy" stroke-width="4"/><path d="M190 100v50M165 112l50 26M165 138l50-26" class="qb" stroke-width="4"/>',
  ],

  elevator: [
    "Elevator doors with a down arrow and a negative floor sign",
    () =>
      '<rect x="62" y="34" width="116" height="116" rx="8" class="xk"/><rect x="70" y="58" width="48" height="92" class="xw"/><rect x="122" y="58" width="48" height="92" class="xp"/><rect x="82" y="40" width="76" height="14" rx="4" class="xw"/><path d="M106 44h14M134 44l4 6 4-6" class="qk" stroke-width="2.5"/><circle cx="196" cy="86" r="9" class="xy"/><path d="M191 86h10M196 81v10" class="qk" stroke-width="0"/><path d="M192 86l4 4 4-4" class="qk" stroke-width="2.5"/><circle cx="196" cy="112" r="9" class="xy"/>',
  ],

  books: [
    "Stack of four library books with one leaning",
    () =>
      '<rect x="46" y="124" width="140" height="26" rx="5" class="xa"/><rect x="56" y="98" width="120" height="26" rx="5" class="xy"/><rect x="40" y="72" width="128" height="26" rx="5" class="xr"/><rect x="64" y="46" width="104" height="26" rx="5" class="xb"/><path d="M60 137h40M70 111h30M52 85h36M76 59h30" class="qw" stroke-width="3"/><rect x="190" y="68" width="22" height="82" rx="4" class="xn" transform="rotate(10 200 150)"/>',
  ],

  cookies: [
    "Baking tray with twelve cookies in three rows of four",
    () =>
      '<rect x="26" y="36" width="188" height="112" rx="12" class="xw"/><rect x="34" y="44" width="172" height="96" rx="8" class="xg"/>' +
      [0, 1, 2]
        .map((r) =>
          [0, 1, 2, 3]
            .map(
              (c) =>
                `<circle cx="${62 + c * 38}" cy="${66 + r * 32}" r="13" class="xs3"/><circle cx="${58 + c * 38}" cy="${62 + r * 32}" r="2.5" class="xs5"/><circle cx="${67 + c * 38}" cy="${68 + r * 32}" r="2.5" class="xs5"/>`,
            )
            .join(""),
        )
        .join(""),
  ],

  balance: [
    "Balance scale with a bag on one side and three blocks on the other",
    () =>
      '<path d="M120 40V148M92 150h56" class="qk" stroke-width="5"/><path d="M40 62H200" class="qk" stroke-width="5"/><circle cx="120" cy="40" r="7" class="xa"/><path d="M40 62l-18 42h36zM200 62l-18 42h36z" class="qk" stroke-width="2.5" fill="none"/><path d="M14 104h52a26 14 0 0 1-52 0zM174 104h52a26 14 0 0 1-52 0z" class="xa"/><path d="M28 104q-4-24 6-30h12q10 6 6 30z" class="xs2"/><rect x="184" y="82" width="20" height="22" rx="3" class="xr"/><rect x="204" y="82" width="20" height="22" rx="3" class="xy"/><rect x="194" y="60" width="20" height="22" rx="3" class="xw"/>',
  ],

  "savings-jar": [
    "Jar of coins with a slot in the lid",
    () =>
      '<rect x="70" y="44" width="100" height="106" rx="16" class="xw"/><rect x="70" y="44" width="100" height="106" rx="16" class="qk" stroke-width="2.5" stroke-opacity=".3"/><rect x="64" y="32" width="112" height="18" rx="6" class="xa"/><path d="M104 40h32" class="qk" stroke-width="4"/>' +
      [
        [96, 136],
        [120, 138],
        [144, 136],
        [108, 118],
        [132, 118],
        [120, 100],
      ]
        .map(
          ([x, y]) =>
            `<circle cx="${x}" cy="${y}" r="11" class="xy"/><circle cx="${x}" cy="${y}" r="6" class="qk" stroke-width="1.5" stroke-opacity=".4"/>`,
        )
        .join("") +
      '<circle cx="178" cy="68" r="11" class="xy"/><circle cx="178" cy="68" r="6" class="qk" stroke-width="1.5" stroke-opacity=".4"/>',
  ],

  "rain-gauge": [
    "Rain gauge under a cloud with raindrops",
    () =>
      cloud(112, 68, 1.4) +
      '<path d="M70 82l-6 16M96 88l-6 16M122 82l-6 16M148 88l-6 16" class="qb" stroke-width="5"/><rect x="164" y="64" width="26" height="84" rx="5" class="xw"/><rect x="164" y="112" width="26" height="36" rx="5" class="xb"/><path d="M164 80h12M164 96h12M164 112h12M164 128h12" class="qk" stroke-width="2"/>',
  ],

  ticket: [
    "Movie ticket and a bucket of popcorn",
    () =>
      '<path d="M24 58a8 8 0 0 1 8-8h96a8 8 0 0 1 8 8v14a10 10 0 0 0 0 20v14a8 8 0 0 1-8 8H32a8 8 0 0 1-8-8z" class="xy" transform="rotate(-8 80 82)"/><g transform="rotate(-8 80 82)"><path d="M104 56v52" class="qk" stroke-width="2" stroke-dasharray="3 5"/><path d="M40 72h44M40 86h30" class="qk" stroke-width="4" stroke-opacity=".6"/></g><path d="M150 84h56l-8 66h-40z" class="xr"/><path d="M162 84l4 66M178 84v66M194 84l-4 66" class="qw" stroke-width="5"/><circle cx="160" cy="76" r="9" class="xw"/><circle cx="178" cy="68" r="10" class="xw"/><circle cx="196" cy="76" r="9" class="xw"/><circle cx="170" cy="82" r="8" class="xw"/><circle cx="188" cy="82" r="8" class="xw"/>',
  ],

  "park-map": [
    "Folded park map with a dotted route and a pin",
    () =>
      '<path d="M26 54l50-14 52 14 50-14 14 4v88l-14-4-50 14-52-14-50 14z" class="xw"/><path d="M76 40v88M128 54v88M178 40v88" class="qk" stroke-width="2" stroke-opacity=".25"/><path d="M44 118Q76 60 118 96T180 62" class="qa" stroke-width="4" stroke-dasharray="2 9"/><circle cx="44" cy="118" r="7" class="xk"/><path d="M180 62q-14-16-14-28a14 14 0 0 1 28 0q0 12-14 28z" class="xr"/><circle cx="180" cy="34" r="5" class="xw"/><path d="M96 126a14 10 0 1 0 0.1 0z" class="xn"/>',
  ],

  "fruit-scale": [
    "Crate of oranges next to a hanging produce scale",
    () =>
      '<rect x="30" y="104" width="100" height="46" rx="6" class="xs2"/>' +
      [48, 70, 92, 114]
        .map((x, i) => `<circle cx="${x}" cy="${i % 2 ? 98 : 94}" r="13" class="xy"/>`)
        .join("") +
      '<path d="M172 28v22" class="qk" stroke-width="4"/><circle cx="172" cy="84" r="34" class="xw"/><circle cx="172" cy="84" r="34" class="qk" stroke-width="3" fill="none"/><path d="M172 84l14-16" class="qr" stroke-width="4"/><path d="M146 100q4-6 0-12M198 100q-4-6 0-12" class="qk" stroke-width="2"/><path d="M158 120h28l-4 24h-20z" class="xa"/>',
  ],

  "tile-floor": [
    "Square tile floor with a measuring tape along one edge",
    () =>
      '<g transform="translate(46 28)">' +
      [0, 1, 2, 3]
        .map((r) =>
          [0, 1, 2, 3]
            .map(
              (c) =>
                `<rect x="${c * 36}" y="${r * 24}" width="34" height="22" rx="3" class="${(r + c) % 2 ? "xy" : "xa"}"/>`,
            )
            .join(""),
        )
        .join("") +
      '</g><rect x="40" y="132" width="156" height="16" rx="4" class="xy"/><path d="M52 132v8M66 132v12M80 132v8M94 132v12M108 132v8M122 132v12M136 132v8M150 132v12M164 132v8M178 132v12" class="qk" stroke-width="2"/>',
  ],

  "moving-box": [
    "Cardboard box next to a stack of small cubes",
    () =>
      '<rect x="34" y="68" width="88" height="80" class="xs2"/><path d="M34 68l30-26h88l-30 26z" class="xs1"/><path d="M122 68l30-26v80l-30 26z" class="xs3"/><path d="M78 68v80M78 68l30-26" class="qy" stroke-width="8" stroke-opacity=".85"/>' +
      [0, 1]
        .map((r) =>
          [0, 1, 2]
            .map(
              (c) =>
                `<rect x="${164 + c * 22}" y="${126 - r * 22}" width="20" height="20" rx="3" class="xa" fill-opacity="${r ? 0.7 : 1}"/>`,
            )
            .join(""),
        )
        .join(""),
  ],

  "fish-tank": [
    "Fish tank with water, a fish and plants",
    () =>
      '<rect x="34" y="40" width="172" height="108" rx="10" class="xw" fill-opacity=".7"/><rect x="38" y="62" width="164" height="82" rx="6" class="xb" fill-opacity=".55"/><ellipse cx="112" cy="98" rx="22" ry="13" class="xy"/><path d="M134 98l16-12v24z" class="xy"/><circle cx="100" cy="94" r="3" class="xk"/><path d="M62 144q-8-24 4-40M76 144q8-20 0-34M172 144q-8-30 4-44" class="qn" stroke-width="5"/><circle cx="150" cy="72" r="4" class="xw"/><circle cx="158" cy="62" r="3" class="xw"/>',
  ],

  survey: [
    "Clipboard with tally marks and a pencil",
    () =>
      '<rect x="62" y="26" width="116" height="126" rx="10" class="xs2"/><rect x="72" y="44" width="96" height="100" rx="4" class="xw"/><rect x="100" y="20" width="40" height="16" rx="6" class="xk"/><path d="M82 66h14M82 90h14M82 114h14" class="qk" stroke-width="3" stroke-opacity=".5"/><path d="M104 60v14M110 60v14M116 60v14M122 60v14M100 76l26-18M104 86v14M110 86v14M116 86v14M104 112v14M110 112v14" class="qa" stroke-width="3"/><path d="M192 54l-14 90" class="qy" stroke-width="9"/><path d="M178 144l2-10 7 2z" class="xk"/>',
  ],

  soccer: [
    "Soccer goal with a net and a ball",
    () =>
      '<path d="M44 148V62h152v86" class="qk" stroke-width="6"/><path d="M44 62l-18-16h152l18 16" class="qk" stroke-width="3" stroke-opacity=".5" fill="none"/>' +
      '<path d="M60 62v86M80 62v86M100 62v86M120 62v86M140 62v86M160 62v86M180 62v86M44 86h152M44 110h152M44 134h152" class="qk" stroke-width="1.5" stroke-opacity=".25"/><circle cx="150" cy="138" r="14" class="xw"/><circle cx="150" cy="138" r="14" class="qk" stroke-width="2.5" fill="none"/><path d="M150 130l8 6-3 9h-10l-3-9z" class="xk"/>',
  ],

  paint: [
    "Paint can and brush with two colors mixed",
    () =>
      '<path d="M60 70h86l-6 78h-74z" class="xw"/><ellipse cx="103" cy="70" rx="43" ry="10" class="xa"/><ellipse cx="94" cy="68" rx="20" ry="5" class="xy"/><path d="M60 70q-10 30 0 0M146 70q22-4 26 14" class="qk" stroke-width="3"/><path d="M150 46l24-18" class="qs4" stroke-width="7"/><path d="M166 34l10-8 10 12-10 8z" class="xr"/><path d="M60 100h80" class="qa" stroke-width="3" stroke-opacity=".5"/>',
  ],

  stairs: [
    "Staircase of blocks climbing in equal steps",
    () =>
      [0, 1, 2, 3]
        .map(
          (i) =>
            `<rect x="${44 + i * 36}" y="${126 - i * 24}" width="36" height="${24 + i * 24}" rx="4" class="${["xa", "xy", "xr", "xb"][i]}"/>`,
        )
        .join("") +
      '<path d="M50 118l36-24 36-24 36-24" class="qk" stroke-width="3" stroke-dasharray="2 8"/>',
  ],
};

export const SPOT_IDS = Object.keys(SPOTS);
export const renderSpot = (id) => wrap(SPOTS[id][0], SPOTS[id][1]());
export { at, bush, person, place, star4, tree };
