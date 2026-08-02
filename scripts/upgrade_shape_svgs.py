import os

TARGET_DIR = "/Users/joelneft/neft-classroom-html-activities/assets/vocab-images"

# Detailed shape SVGs with explicit part annotations and parallel line indicators
SHAPE_SVGS = {
    "trapezoid.svg": """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 200" role="img" aria-labelledby="t">
  <title id="t">Trapezoid with Parallel Bases and Height</title>
  <rect x="0" y="0" width="300" height="200" rx="16" fill="#F8FAFC" stroke="#E2E8F0" stroke-width="2"/>
  <!-- Main Trapezoid Polygon -->
  <polygon points="70,50 230,50 270,150 30,150" fill="rgba(13,148,136,0.18)" stroke="#0D9488" stroke-width="3"/>
  <!-- Parallel Arrow Markers on Base 1 and Base 2 -->
  <path d="M145,45 L155,50 L145,55" fill="none" stroke="#0284C7" stroke-width="2.5"/>
  <path d="M145,145 L155,150 L145,155" fill="none" stroke="#0284C7" stroke-width="2.5"/>
  <!-- Perpendicular Height Line with 90 deg box -->
  <line x1="170" y1="50" x2="170" y2="150" stroke="#EA580C" stroke-width="2.5" stroke-dasharray="6,4"/>
  <rect x="160" y="140" width="10" height="10" fill="none" stroke="#EA580C" stroke-width="1.5"/>
  <!-- Explicit Part Labels -->
  <text x="150" y="38" text-anchor="middle" font-family="Nunito, sans-serif" font-size="13" font-weight="900" fill="#0284C7">Parallel Base 1 (b₁)</text>
  <text x="150" y="172" text-anchor="middle" font-family="Nunito, sans-serif" font-size="13" font-weight="900" fill="#0284C7">Parallel Base 2 (b₂)</text>
  <text x="185" y="105" text-anchor="start" font-family="Nunito, sans-serif" font-size="13" font-weight="900" fill="#EA580C">Height (h ⊥ b₂)</text>
  <text x="35" y="100" text-anchor="middle" font-family="Nunito, sans-serif" font-size="11" font-weight="800" fill="#64748B">Leg A</text>
  <text x="265" y="100" text-anchor="middle" font-family="Nunito, sans-serif" font-size="11" font-weight="800" fill="#64748B">Leg B</text>
  <text x="150" y="192" text-anchor="middle" font-family="Nunito, sans-serif" font-size="11" font-weight="800" fill="#0D9488">b₁ ∥ b₂ (1 pair of parallel sides)</text>
</svg>""",

    "parallelogram.svg": """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 200" role="img" aria-labelledby="t">
  <title id="t">Parallelogram with Opposite Parallel Sides</title>
  <rect x="0" y="0" width="300" height="200" rx="16" fill="#F8FAFC" stroke="#E2E8F0" stroke-width="2"/>
  <polygon points="80,50 260,50 220,150 40,150" fill="rgba(2,132,199,0.18)" stroke="#0284C7" stroke-width="3"/>
  <!-- Parallel Markers -->
  <path d="M165,45 L175,50 L165,55" fill="none" stroke="#0D9488" stroke-width="2.5"/>
  <path d="M125,145 L135,150 L125,155" fill="none" stroke="#0D9488" stroke-width="2.5"/>
  <!-- Perpendicular Height -->
  <line x1="80" y1="50" x2="80" y2="150" stroke="#EA580C" stroke-width="2.5" stroke-dasharray="6,4"/>
  <rect x="80" y="140" width="10" height="10" fill="none" stroke="#EA580C" stroke-width="1.5"/>
  <!-- Labels -->
  <text x="170" y="38" text-anchor="middle" font-family="Nunito, sans-serif" font-size="13" font-weight="900" fill="#0D9488">Top Side (b₁ ∥ b₂)</text>
  <text x="130" y="172" text-anchor="middle" font-family="Nunito, sans-serif" font-size="13" font-weight="900" fill="#0D9488">Base (b₂)</text>
  <text x="95" y="105" fill="#EA580C" font-family="Nunito, sans-serif" font-size="13" font-weight="900">Height (h ⊥ b)</text>
  <text x="150" y="192" text-anchor="middle" font-family="Nunito, sans-serif" font-size="11" font-weight="800" fill="#0284C7">2 pairs of opposite parallel sides</text>
</svg>""",

    "triangle.svg": """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 200" role="img" aria-labelledby="t">
  <title id="t">Triangle with Base and Perpendicular Height</title>
  <rect x="0" y="0" width="300" height="200" rx="16" fill="#F8FAFC" stroke="#E2E8F0" stroke-width="2"/>
  <polygon points="50,150 250,150 180,40" fill="rgba(234,88,12,0.18)" stroke="#EA580C" stroke-width="3"/>
  <!-- Height Line and Right Angle -->
  <line x1="180" y1="40" x2="180" y2="150" stroke="#0D9488" stroke-width="2.5" stroke-dasharray="6,4"/>
  <rect x="170" y="140" width="10" height="10" fill="none" stroke="#0D9488" stroke-width="1.5"/>
  <!-- Labels -->
  <text x="180" y="30" text-anchor="middle" font-family="Nunito, sans-serif" font-size="13" font-weight="900" fill="#EA580C">Apex Vertex (A)</text>
  <text x="150" y="172" text-anchor="middle" font-family="Nunito, sans-serif" font-size="13" font-weight="900" fill="#EA580C">Base (b)</text>
  <text x="195" y="95" fill="#0D9488" font-family="Nunito, sans-serif" font-size="13" font-weight="900">Height (h ⊥ b)</text>
</svg>""",

    "rectangular-prism.svg": """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 200" role="img" aria-labelledby="t">
  <title id="t">3D Rectangular Prism Parts</title>
  <rect x="0" y="0" width="300" height="200" rx="16" fill="#F8FAFC" stroke="#E2E8F0" stroke-width="2"/>
  <polygon points="60,130 180,130 230,70 110,70" fill="rgba(79,70,229,0.2)" stroke="#4F46E5" stroke-width="2"/>
  <polygon points="110,70 230,70 230,25 110,25" fill="rgba(79,70,229,0.3)" stroke="#4F46E5" stroke-width="2"/>
  <polygon points="60,130 110,70 110,25 60,85" fill="rgba(79,70,229,0.4)" stroke="#4F46E5" stroke-width="2"/>
  <text x="120" y="148" text-anchor="middle" font-family="Nunito, sans-serif" font-size="12" font-weight="900" fill="#4F46E5">Length (l)</text>
  <text x="215" y="105" font-family="Nunito, sans-serif" font-size="12" font-weight="900" fill="#0D9488">Width (w)</text>
  <text x="45" y="70" font-family="Nunito, sans-serif" font-size="12" font-weight="900" fill="#EA580C">Height (h)</text>
  <text x="150" y="185" text-anchor="middle" font-family="Nunito, sans-serif" font-size="11" font-weight="800" fill="#0F172A">6 Rectangular Faces · 12 Edges · 8 Vertices</text>
</svg>""",

    "net.svg": """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 200" role="img" aria-labelledby="t">
  <title id="t">Unfolded 3D Prism Net</title>
  <rect x="0" y="0" width="300" height="200" rx="16" fill="#F8FAFC" stroke="#E2E8F0" stroke-width="2"/>
  <polygon points="150,25 100,70 200,70" fill="#0D9488" opacity="0.3" stroke="#0D9488" stroke-width="2"/>
  <rect x="100" y="70" width="100" height="60" fill="#0284C7" opacity="0.3" stroke="#0284C7" stroke-width="2"/>
  <polygon points="150,175 100,130 200,130" fill="#0D9488" opacity="0.3" stroke="#0D9488" stroke-width="2"/>
  <text x="150" y="55" text-anchor="middle" font-family="Nunito, sans-serif" font-size="11" font-weight="900" fill="#0D9488">Triangular Base 1</text>
  <text x="150" y="105" text-anchor="middle" font-family="Nunito, sans-serif" font-size="11" font-weight="900" fill="#0284C7">Rectangular Face</text>
  <text x="150" y="155" text-anchor="middle" font-family="Nunito, sans-serif" font-size="11" font-weight="900" fill="#0D9488">Triangular Base 2</text>
  <text x="150" y="190" text-anchor="middle" font-family="Nunito, sans-serif" font-size="11" font-weight="800" fill="#0F172A">2D Net Unfolded (2 Parallel Bases + Faces)</text>
</svg>"""
}

updated_count = 0
for filename, svg_content in SHAPE_SVGS.items():
    file_path = os.path.join(TARGET_DIR, filename)
    with open(file_path, "w", encoding="utf-8") as f:
        f.write(svg_content)
    updated_count += 1

print(f"Successfully upgraded {updated_count} shape SVG assets with explicit part annotations and parallel line indicators!")
