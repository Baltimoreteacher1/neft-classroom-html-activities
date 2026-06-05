// Theme-specific SVG hero illustrations for Launch phase context visuals.
// Replaces plain-text contextImage placeholders with real graphics.

const THEME_SVGS = {
  "culinary-academy": `<svg viewBox="0 0 320 200" role="img" aria-hidden="true" class="theme-hero-svg">
    <defs><linearGradient id="chef-bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#fce6de"/><stop offset="100%" stop-color="#fdf6ec"/></linearGradient></defs>
    <rect width="320" height="200" rx="16" fill="url(#chef-bg)"/>
    <ellipse cx="160" cy="175" rx="110" ry="18" fill="rgba(139,58,40,0.12)"/>
    <path d="M120 90 Q160 40 200 90 L195 130 Q160 145 125 130 Z" fill="#fff" stroke="#d9795d" stroke-width="3"/>
    <rect x="148" y="55" width="24" height="18" rx="4" fill="#d9795d"/>
    <circle cx="160" cy="108" r="28" fill="#f4c9a8" stroke="#8b3a28" stroke-width="2"/>
    <ellipse cx="160" cy="100" rx="32" ry="12" fill="#fff" stroke="#d9795d" stroke-width="2"/>
    <rect x="90" y="140" width="50" height="32" rx="6" fill="#2a9d8f" opacity="0.85"/>
    <rect x="180" y="140" width="50" height="32" rx="6" fill="#e9c46a" opacity="0.9"/>
    <text x="115" y="162" font-size="11" font-weight="700" fill="#fff" text-anchor="middle">2 cups</text>
    <text x="205" y="162" font-size="11" font-weight="700" fill="#264653" text-anchor="middle">3 cups</text>
  </svg>`,

  "music-studio": `<svg viewBox="0 0 320 200" role="img" aria-hidden="true" class="theme-hero-svg">
    <rect width="320" height="200" rx="16" fill="#ede8f7"/>
    <rect x="40" y="60" width="240" height="100" rx="12" fill="#4a2d7a" opacity="0.9"/>
    <rect x="55" y="75" width="18" height="70" rx="3" fill="#7c5cbf"/>
    <rect x="80" y="55" width="18" height="90" rx="3" fill="#e9c46a"/>
    <rect x="105" y="85" width="18" height="60" rx="3" fill="#2a9d8f"/>
    <rect x="130" y="65" width="18" height="80" rx="3" fill="#d9795d"/>
    <rect x="155" y="90" width="18" height="55" rx="3" fill="#7c5cbf"/>
    <rect x="180" y="70" width="18" height="75" rx="3" fill="#e9c46a"/>
    <rect x="205" y="80" width="18" height="65" rx="3" fill="#2a9d8f"/>
    <rect x="230" y="60" width="18" height="85" rx="3" fill="#d9795d"/>
    <circle cx="260" cy="50" r="22" fill="none" stroke="#7c5cbf" stroke-width="4"/>
    <circle cx="260" cy="50" r="8" fill="#7c5cbf"/>
    <path d="M60 155 Q160 175 260 155" stroke="#4a2d7a" stroke-width="2" fill="none" opacity="0.4"/>
  </svg>`,

  "detective-agency": `<svg viewBox="0 0 320 200" role="img" aria-hidden="true" class="theme-hero-svg">
    <rect width="320" height="200" rx="16" fill="#f0f4f8"/>
    <rect x="50" y="40" width="220" height="130" rx="8" fill="#fef7e0" stroke="#c85a3a" stroke-width="2"/>
    <line x1="70" y1="70" x2="250" y2="70" stroke="#12355b" stroke-width="2" opacity="0.3"/>
    <line x1="70" y1="95" x2="200" y2="95" stroke="#12355b" stroke-width="2" opacity="0.3"/>
    <line x1="70" y1="120" x2="230" y2="120" stroke="#12355b" stroke-width="2" opacity="0.3"/>
    <circle cx="230" cy="145" r="18" fill="none" stroke="#c85a3a" stroke-width="3"/>
    <line x1="248" y1="163" x2="270" y2="185" stroke="#c85a3a" stroke-width="4" stroke-linecap="round"/>
    <path d="M140 30 L160 10 L180 30 Z" fill="#12355b"/>
    <rect x="155" y="10" width="10" height="25" fill="#12355b"/>
  </svg>`,

  "sports-analytics": `<svg viewBox="0 0 320 200" role="img" aria-hidden="true" class="theme-hero-svg">
    <rect width="320" height="200" rx="16" fill="#e3f0fb"/>
    <rect x="40" y="50" width="240" height="120" rx="10" fill="#fff" stroke="#2f80d1" stroke-width="2"/>
    <rect x="70" y="130" width="30" height="30" fill="#2f80d1" rx="3"/>
    <rect x="110" y="100" width="30" height="60" fill="#2a9d8f" rx="3"/>
    <rect x="150" y="80" width="30" height="80" fill="#2f80d1" rx="3"/>
    <rect x="190" y="110" width="30" height="50" fill="#d9795d" rx="3"/>
    <rect x="230" y="90" width="30" height="70" fill="#2a9d8f" rx="3"/>
    <circle cx="85" cy="70" r="16" fill="#0f7c4a"/>
    <text x="85" y="75" font-size="12" font-weight="800" fill="#fff" text-anchor="middle">⚽</text>
    <polyline points="60,155 100,140 140,120 180,100 220,115 260,95" fill="none" stroke="#12355b" stroke-width="2" stroke-dasharray="4"/>
  </svg>`,

  "space-station": `<svg viewBox="0 0 320 200" role="img" aria-hidden="true" class="theme-hero-svg">
    <rect width="320" height="200" rx="16" fill="#0c1a4a"/>
    <circle cx="60" cy="40" r="2" fill="#fff" opacity="0.8"/><circle cx="120" cy="25" r="1.5" fill="#fff" opacity="0.6"/>
    <circle cx="200" cy="35" r="2" fill="#fff" opacity="0.7"/><circle cx="280" cy="50" r="1" fill="#fff" opacity="0.5"/>
    <circle cx="90" cy="80" r="1" fill="#fff" opacity="0.4"/><circle cx="250" cy="70" r="1.5" fill="#fff" opacity="0.6"/>
    <ellipse cx="160" cy="110" rx="70" ry="35" fill="#4a6cf7" opacity="0.9"/>
    <rect x="90" y="100" width="140" height="20" rx="4" fill="#e8edfe"/>
    <circle cx="160" cy="110" r="22" fill="#0c1a4a" stroke="#4a6cf7" stroke-width="3"/>
    <rect x="50" y="108" width="40" height="6" rx="3" fill="#e8edfe"/>
    <rect x="230" y="108" width="40" height="6" rx="3" fill="#e8edfe"/>
    <circle cx="160" cy="165" r="30" fill="#2a9d8f" opacity="0.5"/>
  </svg>`,

  "treasure-map": `<svg viewBox="0 0 320 200" role="img" aria-hidden="true" class="theme-hero-svg">
    <rect width="320" height="200" rx="16" fill="#fef7e0"/>
    <path d="M30 30 Q160 10 290 30 L280 170 Q160 190 40 170 Z" fill="#f5e6c8" stroke="#b8860b" stroke-width="2"/>
    <path d="M80 80 Q120 60 160 90 Q200 120 240 80" fill="none" stroke="#5c4a12" stroke-width="2" stroke-dasharray="6"/>
    <circle cx="200" cy="100" r="14" fill="#d9795d" stroke="#b8860b" stroke-width="2"/>
    <text x="200" y="105" font-size="14" font-weight="800" fill="#fff" text-anchor="middle">✕</text>
    <path d="M250 50 L260 30 L270 50 L260 55 Z" fill="#b8860b"/>
    <text x="260" y="48" font-size="8" fill="#fff" text-anchor="middle">N</text>
    <line x1="100" y1="140" x2="180" y2="140" stroke="#5c4a12" stroke-width="1" opacity="0.4"/>
    <line x1="140" y1="100" x2="140" y2="160" stroke="#5c4a12" stroke-width="1" opacity="0.4"/>
  </svg>`,

  "arcade-builder": `<svg viewBox="0 0 320 200" role="img" aria-hidden="true" class="theme-hero-svg">
    <rect width="320" height="200" rx="16" fill="#fde8ea"/>
    <rect x="60" y="50" width="200" height="120" rx="12" fill="#12355b"/>
    <rect x="75" y="65" width="170" height="80" rx="6" fill="#1a2744"/>
    <rect x="90" y="80" width="30" height="50" fill="#e63946" rx="4"/>
    <rect x="130" y="95" width="30" height="35" fill="#2a9d8f" rx="4"/>
    <rect x="170" y="70" width="30" height="60" fill="#e9c46a" rx="4"/>
    <rect x="210" y="85" width="30" height="45" fill="#4a6cf7" rx="4"/>
    <circle cx="100" cy="155" r="10" fill="#e63946"/><circle cx="140" cy="155" r="10" fill="#2a9d8f"/>
    <circle cx="180" cy="155" r="10" fill="#e9c46a"/><circle cx="220" cy="155" r="10" fill="#4a6cf7"/>
    <text x="160" y="40" font-size="14" font-weight="800" fill="#e63946" text-anchor="middle">HIGH SCORE</text>
  </svg>`,

  "time-capsule": `<svg viewBox="0 0 320 200" role="img" aria-hidden="true" class="theme-hero-svg">
    <rect width="320" height="200" rx="16" fill="#f0eaf7"/>
    <ellipse cx="160" cy="155" rx="55" ry="15" fill="rgba(107,76,154,0.2)"/>
    <rect x="110" y="70" width="100" height="80" rx="8" fill="#6b4c9a"/>
    <rect x="120" y="55" width="80" height="20" rx="10" fill="#4a3268"/>
    <circle cx="160" cy="110" r="22" fill="none" stroke="#e9c46a" stroke-width="3"/>
    <line x1="160" y1="110" x2="160" y2="95" stroke="#e9c46a" stroke-width="2"/>
    <line x1="160" y1="110" x2="172" y2="118" stroke="#e9c46a" stroke-width="2"/>
    <text x="160" y="175" font-size="11" font-weight="700" fill="#6b4c9a" text-anchor="middle">Est. 2026</text>
  </svg>`,
};

const DEFAULT_SVG = `<svg viewBox="0 0 320 200" role="img" aria-hidden="true" class="theme-hero-svg">
  <rect width="320" height="200" rx="16" fill="var(--cream,#fdf6ec)"/>
  <circle cx="160" cy="90" r="50" fill="none" stroke="var(--teal,#2a9d8f)" stroke-width="3" opacity="0.5"/>
  <text x="160" y="100" font-size="48" text-anchor="middle" dominant-baseline="middle">📐</text>
  <text x="160" y="165" font-size="13" font-weight="700" fill="var(--navy,#264653)" text-anchor="middle">Math in Action</text>
</svg>`;

export function themeIllustration(theme) {
  return THEME_SVGS[theme] || DEFAULT_SVG;
}

export function renderThemeIllustration(host, theme, caption) {
  const wrap = document.createElement("figure");
  wrap.className = "theme-illustration";
  wrap.innerHTML = themeIllustration(theme);
  if (caption) {
    const figcap = document.createElement("figcaption");
    figcap.className = "theme-illustration-caption";
    figcap.textContent = caption;
    wrap.append(figcap);
  }
  host.append(wrap);
  return wrap;
}
