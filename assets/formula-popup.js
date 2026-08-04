/* ==========================================================================
   EDUWONDERLAB FORMULA & VOCABULARY POPUP + SCROLL RESET SYSTEM
   ========================================================================== */

(function() {
  // 1. Force Page Scroll to Top on Lesson Boot
  if ('scrollRestoration' in history) {
    history.scrollRestoration = 'manual';
  }
  window.scrollTo(0, 0);
  document.documentElement.scrollTop = 0;
  document.body.scrollTop = 0;
  window.addEventListener('load', function() {
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  });

  // 2. Comprehensive Vocabulary & Formula Database with SVG Diagrams
  const VOCAB_DB = {
    "add": {
      title: "Add",
      def: "To combine two or more numbers or quantities to find a total sum.",
      example: "If you have 6 blocks and add 4 more, 6 + 4 = 10.",
      svg: `<svg viewBox="0 0 280 120" style="background:#F0FDF4; border-radius:12px; border:1px solid #BBF7D0; width:100%;">
        <rect x="30" y="35" width="45" height="45" fill="#16A34A" rx="8"/>
        <text x="52" y="62" text-anchor="middle" fill="#FFF" font-weight="900" font-size="18">6</text>
        <text x="100" y="65" text-anchor="middle" fill="#16A34A" font-weight="900" font-size="24">+</text>
        <rect x="120" y="35" width="45" height="45" fill="#16A34A" rx="8"/>
        <text x="142" y="62" text-anchor="middle" fill="#FFF" font-weight="900" font-size="18">4</text>
        <text x="190" y="65" text-anchor="middle" fill="#16A34A" font-weight="900" font-size="24">=</text>
        <rect x="210" y="30" width="55" height="55" fill="#047857" rx="10"/>
        <text x="237" y="65" text-anchor="middle" fill="#FFF" font-weight="900" font-size="22">10</text>
        <text x="140" y="105" text-anchor="middle" fill="#166534" font-weight="800" font-size="12">Combine parts ➜ Total Sum</text>
      </svg>`
    },
    "subtract": {
      title: "Subtract",
      def: "To take one number away from another to find the difference.",
      example: "If you have 10 counters and take away 4, 10 - 4 = 6.",
      svg: `<svg viewBox="0 0 280 120" style="background:#FEF2F2; border-radius:12px; border:1px solid #FCA5A5; width:100%;">
        <rect x="30" y="30" width="55" height="55" fill="#DC2626" rx="10"/>
        <text x="57" y="65" text-anchor="middle" fill="#FFF" font-weight="900" font-size="22">10</text>
        <text x="110" y="65" text-anchor="middle" fill="#DC2626" font-weight="900" font-size="24">−</text>
        <rect x="130" y="35" width="45" height="45" fill="#EF4444" rx="8"/>
        <text x="152" y="62" text-anchor="middle" fill="#FFF" font-weight="900" font-size="18">4</text>
        <text x="200" y="65" text-anchor="middle" fill="#DC2626" font-weight="900" font-size="24">=</text>
        <rect x="220" y="35" width="45" height="45" fill="#B91C1C" rx="8"/>
        <text x="242" y="62" text-anchor="middle" fill="#FFF" font-weight="900" font-size="18">6</text>
        <text x="140" y="105" text-anchor="middle" fill="#991B1B" font-weight="800" font-size="12">Take away ➜ Difference</text>
      </svg>`
    },
    "multiply": {
      title: "Multiply",
      def: "To add a number to itself a specific number of times (repeated addition).",
      example: "6 × 8 means 6 groups of 8, which equals 48.",
      svg: `<svg viewBox="0 0 280 120" style="background:#F0F9FF; border-radius:12px; border:1px solid #BAE6FD; width:100%;">
        <g fill="#0284C7">
          <circle cx="50" cy="40" r="8"/><circle cx="70" cy="40" r="8"/><circle cx="90" cy="40" r="8"/>
          <circle cx="50" cy="60" r="8"/><circle cx="70" cy="60" r="8"/><circle cx="90" cy="40" r="8"/>
        </g>
        <text x="140" y="55" text-anchor="middle" fill="#0369A1" font-weight="900" font-size="20">3 × 4 = 12</text>
        <rect x="180" y="25" width="70" height="50" fill="none" stroke="#0284C7" stroke-width="2" stroke-dasharray="4" rx="6"/>
        <text x="215" y="55" text-anchor="middle" fill="#0284C7" font-weight="800" font-size="12">Array Grid</text>
        <text x="140" y="105" text-anchor="middle" fill="#0369A1" font-weight="800" font-size="12">Equal groups ➜ Product</text>
      </svg>`
    },
    "divide": {
      title: "Divide",
      def: "To split a number into equal parts or groups.",
      example: "12 ÷ 3 means sharing 12 items into 3 equal groups of 4.",
      svg: `<svg viewBox="0 0 280 120" style="background:#FAF5FF; border-radius:12px; border:1px solid #E9D5FF; width:100%;">
        <circle cx="50" cy="45" r="20" fill="#9333EA"/>
        <circle cx="100" cy="45" r="20" fill="#9333EA"/>
        <circle cx="150" cy="45" r="20" fill="#9333EA"/>
        <text x="50" y="50" text-anchor="middle" fill="#FFF" font-weight="900" font-size="14">4</text>
        <text x="100" y="50" text-anchor="middle" fill="#FFF" font-weight="900" font-size="14">4</text>
        <text x="150" y="50" text-anchor="middle" fill="#FFF" font-weight="900" font-size="14">4</text>
        <text x="220" y="50" text-anchor="middle" fill="#7E22CE" font-weight="900" font-size="18">12 ÷ 3 = 4</text>
        <text x="140" y="105" text-anchor="middle" fill="#6B21A8" font-weight="800" font-size="12">Split equally ➜ Quotient</text>
      </svg>`
    },
    "half": {
      title: "Half",
      def: "One of two equal parts of a whole; the same as dividing by 2 (or multiplying by ½).",
      example: "Half of 12 is 6, because 12 ÷ 2 = 6.",
      svg: `<svg viewBox="0 0 280 120" style="background:#FFFBEB; border-radius:12px; border:1px solid #FDE68A; width:100%;">
        <circle cx="80" cy="50" r="32" fill="#F59E0B"/>
        <path d="M 80,18 A 32,32 0 0,1 80,82 Z" fill="#D97706"/>
        <line x1="80" y1="18" x2="80" y2="82" stroke="#FFF" stroke-width="3"/>
        <text x="185" y="55" text-anchor="middle" fill="#B45309" font-weight="900" font-size="18">½ of Total</text>
        <text x="140" y="105" text-anchor="middle" fill="#92400E" font-weight="800" font-size="12">Split in 2 equal pieces</text>
      </svg>`
    },
    "rectangle": {
      title: "Rectangle",
      def: "A 4-sided flat shape with 4 right angles (90°) and opposite sides equal.",
      example: "A door, smartphone screen, or book cover is shaped like a rectangle.",
      svg: `<svg viewBox="0 0 280 120" style="background:#F8FAFC; border-radius:12px; border:1px solid #CBD5E1; width:100%;">
        <rect x="50" y="25" width="180" height="60" fill="rgba(2,132,199,0.15)" stroke="#0284C7" stroke-width="3" rx="4"/>
        <rect x="50" y="25" width="10" height="10" fill="none" stroke="#0284C7" stroke-width="1.5"/>
        <rect x="220" y="25" width="10" height="10" fill="none" stroke="#0284C7" stroke-width="1.5"/>
        <rect x="50" y="75" width="10" height="10" fill="none" stroke="#0284C7" stroke-width="1.5"/>
        <rect x="220" y="75" width="10" height="10" fill="none" stroke="#0284C7" stroke-width="1.5"/>
        <text x="140" y="60" text-anchor="middle" fill="#0F172A" font-weight="900" font-size="14">4 Right Angles (90°)</text>
        <text x="140" y="105" text-anchor="middle" fill="#475569" font-weight="800" font-size="12">Opposite sides are parallel & equal</text>
      </svg>`
    },
    "trapezoid": {
      title: "Trapezoid",
      def: "A 4-sided flat shape with exactly one pair of parallel sides (called bases).",
      example: "A trapezoid has a top base b₁ and a bottom base b₂ with height h.",
      svg: `<svg viewBox="0 0 280 120" style="background:#FFF7ED; border-radius:12px; border:1px solid #FFEDD5; width:100%;">
        <polygon points="80,25 200,25 240,85 40,85" fill="rgba(234,88,12,0.18)" stroke="#EA580C" stroke-width="3"/>
        <text x="140" y="20" text-anchor="middle" fill="#C2410C" font-weight="900" font-size="12">Base 1 (b₁)</text>
        <text x="140" y="100" text-anchor="middle" fill="#C2410C" font-weight="900" font-size="12">Base 2 (b₂)</text>
        <line x1="140" y1="25" x2="140" y2="85" stroke="#0D9488" stroke-width="2" stroke-dasharray="4"/>
        <text x="152" y="60" fill="#0D9488" font-weight="900" font-size="12">h</text>
      </svg>`
    },
    "parallelogram": {
      title: "Parallelogram",
      def: "A 4-sided flat shape with both pairs of opposite sides parallel and equal in length.",
      example: "Area of a parallelogram = base × height (A = b × h).",
      svg: `<svg viewBox="0 0 280 120" style="background:#F0FDFA; border-radius:12px; border:1px solid #CCFBF1; width:100%;">
        <polygon points="70,25 220,25 180,85 30,85" fill="rgba(13,148,136,0.18)" stroke="#0D9488" stroke-width="3"/>
        <line x1="70" y1="25" x2="70" y2="85" stroke="#EA580C" stroke-width="2" stroke-dasharray="4"/>
        <text x="82" y="60" fill="#EA580C" font-weight="900" font-size="12">Height (h)</text>
        <text x="110" y="102" fill="#0D9488" font-weight="900" font-size="12">Base (b)</text>
      </svg>`
    },
    "triangle": {
      title: "Triangle",
      def: "A 3-sided flat polygon with three interior angles adding up to 180°.",
      example: "Area = ½ × base × height.",
      svg: `<svg viewBox="0 0 280 120" style="background:#F0F9FF; border-radius:12px; border:1px solid #BAE6FD; width:100%;">
        <polygon points="40,85 240,85 160,20" fill="rgba(2,132,199,0.18)" stroke="#0284C7" stroke-width="3"/>
        <line x1="160" y1="20" x2="160" y2="85" stroke="#EA580C" stroke-width="2" stroke-dasharray="4"/>
        <text x="172" y="55" fill="#EA580C" font-weight="900" font-size="12">Height (h)</text>
        <text x="140" y="102" fill="#0284C7" font-weight="900" font-size="12">Base (b)</text>
      </svg>`
    },
    "parallel": {
      title: "Parallel",
      def: "Lines or sides in the same plane that stay the exact same distance apart and never cross or intersect.",
      example: "The top and bottom bases of a trapezoid (or opposite sides of a rectangle) are parallel lines.",
      svg: `<svg viewBox="0 0 280 120" style="background:#F0F9FF; border-radius:12px; border:1px solid #BAE6FD; width:100%;">
        <line x1="40" y1="35" x2="240" y2="35" stroke="#0284C7" stroke-width="4"/>
        <line x1="40" y1="85" x2="240" y2="85" stroke="#0284C7" stroke-width="4"/>
        <!-- Parallel line arrows -->
        <polygon points="135,30 145,35 135,40" fill="#0284C7"/>
        <polygon points="135,80 145,85 135,90" fill="#0284C7"/>
        <!-- Distance indicator -->
        <line x1="70" y1="35" x2="70" y2="85" stroke="#EA580C" stroke-width="2" stroke-dasharray="4"/>
        <text x="82" y="64" fill="#EA580C" font-weight="900" font-size="12">Equal distance</text>
        <text x="180" y="64" fill="#0369A1" font-weight="900" font-size="14">Never intersect (∥)</text>
      </svg>`
    },
    "parallel lines": {
      title: "Parallel Lines",
      def: "Two or more straight lines that lie in the same plane and never touch or intersect no matter how far extended.",
      example: "Railroad tracks or opposite sides of a window frame are parallel lines.",
      svg: `<svg viewBox="0 0 280 120" style="background:#F0F9FF; border-radius:12px; border:1px solid #BAE6FD; width:100%;">
        <line x1="40" y1="35" x2="240" y2="35" stroke="#0284C7" stroke-width="4"/>
        <line x1="40" y1="85" x2="240" y2="85" stroke="#0284C7" stroke-width="4"/>
        <polygon points="135,30 145,35 135,40" fill="#0284C7"/>
        <polygon points="135,80 145,85 135,90" fill="#0284C7"/>
        <text x="140" y="64" text-anchor="middle" fill="#0369A1" font-weight="900" font-size="14">Always Same Distance Apart</text>
      </svg>`
    },
    "base": {
      title: "Base",
      def: "A side of a flat shape (or one of the parallel top/bottom sides in a trapezoid) used as a foundation to measure length and height.",
      example: "In a trapezoid, there are two parallel bases: Base 1 (b₁) and Base 2 (b₂).",
      svg: `<svg viewBox="0 0 280 120" style="background:#FFF7ED; border-radius:12px; border:1px solid #FFEDD5; width:100%;">
        <polygon points="80,25 200,25 240,85 40,85" fill="rgba(234,88,12,0.18)" stroke="#EA580C" stroke-width="3"/>
        <text x="140" y="20" text-anchor="middle" fill="#C2410C" font-weight="900" font-size="12">Top Base (b₁)</text>
        <text x="140" y="102" text-anchor="middle" fill="#C2410C" font-weight="900" font-size="12">Bottom Base (b₂)</text>
        <line x1="80" y1="25" x2="200" y2="25" stroke="#0284C7" stroke-width="4"/>
        <line x1="40" y1="85" x2="240" y2="85" stroke="#0284C7" stroke-width="4"/>
      </svg>`
    },
    "bases": {
      title: "Bases",
      def: "Plural of base. The parallel sides of a polygon (such as a trapezoid) used to compute area.",
      example: "A trapezoid's bases are added together: (b₁ + b₂).",
      svg: `<svg viewBox="0 0 280 120" style="background:#FFF7ED; border-radius:12px; border:1px solid #FFEDD5; width:100%;">
        <polygon points="80,25 200,25 240,85 40,85" fill="rgba(234,88,12,0.18)" stroke="#EA580C" stroke-width="3"/>
        <text x="140" y="20" text-anchor="middle" fill="#C2410C" font-weight="900" font-size="12">Base 1 (b₁)</text>
        <text x="140" y="102" text-anchor="middle" fill="#C2410C" font-weight="900" font-size="12">Base 2 (b₂)</text>
      </svg>`
    },
    "area": {
      title: "Area",
      def: "The total amount of 2D surface space enclosed inside a shape (measured in square units).",
      example: "A 4cm × 5cm rectangle has an area of 20 square centimeters (cm²).",
      svg: `<svg viewBox="0 0 280 120" style="background:#F0FDF4; border-radius:12px; border:1px solid #BBF7D0; width:100%;">
        <rect x="60" y="20" width="160" height="70" fill="rgba(22,163,74,0.15)" stroke="#16A34A" stroke-width="3" rx="4"/>
        <g stroke="#16A34A" stroke-width="1" opacity="0.4">
          <line x1="100" y1="20" x2="100" y2="90"/><line x1="140" y1="20" x2="140" y2="90"/><line x1="180" y1="20" x2="180" y2="90"/>
          <line x1="60" y1="43" x2="220" y2="43"/><line x1="60" y1="66" x2="220" y2="66"/>
        </g>
        <text x="140" y="60" text-anchor="middle" fill="#15803D" font-weight="900" font-size="14">Covered Grid Squares</text>
        <text x="140" y="108" text-anchor="middle" fill="#166534" font-weight="800" font-size="12">Inside space (square units)</text>
      </svg>`
    },
    "perimeter": {
      title: "Perimeter",
      def: "The total length of the outer boundary edge around a 2D shape.",
      example: "Adding all side lengths around a garden fence gives its perimeter.",
      svg: `<svg viewBox="0 0 280 120" style="background:#EFF6FF; border-radius:12px; border:1px solid #BFDBFE; width:100%;">
        <rect x="60" y="25" width="160" height="60" fill="none" stroke="#2563EB" stroke-width="4" stroke-dasharray="6" rx="4"/>
        <text x="140" y="60" text-anchor="middle" fill="#1D4ED8" font-weight="900" font-size="14">Distance Around Outside</text>
        <text x="140" y="105" text-anchor="middle" fill="#1E40AF" font-weight="800" font-size="12">P = Side₁ + Side₂ + Side₃ + Side₄</text>
      </svg>`
    },
    "volume": {
      title: "Volume",
      def: "The total 3D space occupied inside a 3D solid object (measured in cubic units).",
      example: "Volume of a prism = length × width × height (V = l × w × h).",
      svg: `<svg viewBox="0 0 280 120" style="background:#FAF5FF; border-radius:12px; border:1px solid #E9D5FF; width:100%;">
        <polygon points="60,80 180,80 220,40 100,40" fill="rgba(147,51,234,0.2)" stroke="#9333EA" stroke-width="2"/>
        <polygon points="100,40 220,40 220,15 100,15" fill="rgba(147,51,234,0.3)" stroke="#9333EA" stroke-width="2"/>
        <polygon points="60,80 100,40 100,15 60,55" fill="rgba(147,51,234,0.4)" stroke="#9333EA" stroke-width="2"/>
        <text x="140" y="60" text-anchor="middle" fill="#6B21A8" font-weight="900" font-size="14">3D Cube Space (V = l · w · h)</text>
      </svg>`
    },
    "fraction": {
      title: "Fraction",
      def: "A number representing part of a whole, written as numerator over denominator.",
      example: "¾ means 3 equal parts out of 4 total parts.",
      svg: `<svg viewBox="0 0 280 120" style="background:#F0F9FF; border-radius:12px; border:1px solid #BAE6FD; width:100%;">
        <rect x="40" y="30" width="120" height="40" fill="#FFF" stroke="#0284C7" stroke-width="2" rx="4"/>
        <rect x="40" y="30" width="90" height="40" fill="#0284C7"/>
        <line x1="70" y1="30" x2="70" y2="70" stroke="#FFF"/>
        <line x1="100" y1="30" x2="100" y2="70" stroke="#FFF"/>
        <line x1="130" y1="30" x2="130" y2="70" stroke="#0284C7"/>
        <text x="210" y="48" text-anchor="middle" fill="#0369A1" font-weight="900" font-size="20">3</text>
        <line x1="190" y1="54" x2="230" y2="54" stroke="#0369A1" stroke-width="3"/>
        <text x="210" y="76" text-anchor="middle" fill="#0369A1" font-weight="900" font-size="20">4</text>
        <text x="140" y="105" text-anchor="middle" fill="#0284C7" font-weight="800" font-size="12">Shaded Parts / Total Parts</text>
      </svg>`
    },
    "ratio": {
      title: "Ratio",
      def: "A relationship comparing two quantities by division (written as a:b, a to b, or a/b).",
      example: "If there are 2 blue stars and 3 orange circles, the ratio of stars to circles is 2:3.",
      svg: `<svg viewBox="0 0 280 120" style="background:#FEF3C7; border-radius:12px; border:1px solid #FDE68A; width:100%;">
        <circle cx="50" cy="45" r="16" fill="#0284C7"/>
        <circle cx="90" cy="45" r="16" fill="#0284C7"/>
        <circle cx="150" cy="45" r="16" fill="#EA580C"/>
        <circle cx="190" cy="45" r="16" fill="#EA580C"/>
        <circle cx="230" cy="45" r="16" fill="#EA580C"/>
        <text x="140" y="92" text-anchor="middle" fill="#92400E" font-weight="900" font-size="16">Ratio = 2 : 3</text>
      </svg>`
    },
    "unit rate": {
      title: "Unit Rate",
      def: "A rate simplified so that the second quantity is 1 unit (e.g., miles per hour, price per pound).",
      example: "$12 for 3 shirts ➜ $4 per 1 shirt.",
      svg: `<svg viewBox="0 0 280 120" style="background:#F0FDF4; border-radius:12px; border:1px solid #BBF7D0; width:100%;">
        <rect x="40" y="30" width="200" height="40" fill="#16A34A" rx="8"/>
        <text x="140" y="56" text-anchor="middle" fill="#FFF" font-weight="900" font-size="18">$4.00 for 1 Item</text>
        <text x="140" y="100" text-anchor="middle" fill="#15803D" font-weight="800" font-size="12">Denominator is always 1</text>
      </svg>`
    },
    "equation": {
      title: "Equation",
      def: "A mathematical statement showing that two expressions are equal with an equals sign (=).",
      example: "x + 5 = 12 (Solve for x: x = 7).",
      svg: `<svg viewBox="0 0 280 120" style="background:#F8FAFC; border-radius:12px; border:1px solid #CBD5E1; width:100%;">
        <rect x="30" y="35" width="80" height="45" fill="#0D9488" rx="8"/>
        <text x="70" y="63" text-anchor="middle" fill="#FFF" font-weight="900" font-size="16">x + 5</text>
        <text x="140" y="65" text-anchor="middle" fill="#0284C7" font-weight="900" font-size="24">=</text>
        <rect x="170" y="35" width="80" height="45" fill="#0284C7" rx="8"/>
        <text x="210" y="63" text-anchor="middle" fill="#FFF" font-weight="900" font-size="16">12</text>
        <text x="140" y="105" text-anchor="middle" fill="#334155" font-weight="800" font-size="12">Balanced on both sides</text>
      </svg>`
    },
    "expression": {
      title: "Expression",
      def: "A mathematical phrase with numbers, variables, and operation symbols (no equals sign).",
      example: "3x + 7 is an algebraic expression.",
      svg: `<svg viewBox="0 0 280 120" style="background:#FDF4FF; border-radius:12px; border:1px solid #F5D0FE; width:100%;">
        <rect x="40" y="30" width="200" height="45" fill="#C026D3" rx="8"/>
        <text x="140" y="58" text-anchor="middle" fill="#FFF" font-weight="900" font-size="20">3x + 7</text>
        <text x="140" y="102" text-anchor="middle" fill="#86198F" font-weight="800" font-size="12">No equals sign (=)</text>
      </svg>`
    },
    "variable": {
      title: "Variable",
      def: "A symbol or letter (like x or n) representing an unknown number or value.",
      example: "In x + 3 = 8, x is the variable representing 5.",
      svg: `<svg viewBox="0 0 280 120" style="background:#EFF6FF; border-radius:12px; border:1px solid #BFDBFE; width:100%;">
        <rect x="100" y="25" width="80" height="55" fill="#2563EB" rx="12"/>
        <text x="140" y="62" text-anchor="middle" fill="#FFF" font-weight="900" font-size="32">x</text>
        <text x="140" y="105" text-anchor="middle" fill="#1E40AF" font-weight="800" font-size="12">Unknown letter value</text>
      </svg>`
    },
    "factor": {
      title: "Factor",
      def: "A whole number that divides another number evenly with zero remainder.",
      example: "The factors of 12 are 1, 2, 3, 4, 6, and 12.",
      svg: `<svg viewBox="0 0 280 120" style="background:#F0FDF4; border-radius:12px; border:1px solid #BBF7D0; width:100%;">
        <text x="140" y="45" text-anchor="middle" fill="#166534" font-weight="900" font-size="20">3 × 4 = 12</text>
        <text x="140" y="85" text-anchor="middle" fill="#15803D" font-weight="800" font-size="14">3 and 4 are factors of 12</text>
      </svg>`
    },
    "multiple": {
      title: "Multiple",
      def: "The product of multiplying a number by any whole number (1, 2, 3...).",
      example: "Multiples of 5 are 5, 10, 15, 20, 25, 30...",
      svg: `<svg viewBox="0 0 280 120" style="background:#FFFBEB; border-radius:12px; border:1px solid #FDE68A; width:100%;">
        <text x="140" y="45" text-anchor="middle" fill="#92400E" font-weight="900" font-size="18">5, 10, 15, 20, 25...</text>
        <text x="140" y="85" text-anchor="middle" fill="#B45309" font-weight="800" font-size="13">Skip counting by 5s</text>
      </svg>`
    },
    "height": {
      title: "Height",
      def: "The perpendicular (straight 90°) distance from the base to the top vertex or side of a shape.",
      example: "Height must always meet the base at a right angle (90°).",
      svg: `<svg viewBox="0 0 280 120" style="background:#F0FDFA; border-radius:12px; border:1px solid #99F6E4; width:100%;">
        <polygon points="60,85 200,85 150,25" fill="rgba(13,148,136,0.15)" stroke="#0D9488" stroke-width="3"/>
        <line x1="150" y1="25" x2="150" y2="85" stroke="#EA580C" stroke-width="3" stroke-dasharray="4"/>
        <rect x="150" y="75" width="10" height="10" fill="none" stroke="#EA580C" stroke-width="1.5"/>
        <text x="165" y="60" fill="#EA580C" font-weight="900" font-size="14">h (90°)</text>
      </svg>`
    },
    "width": {
      title: "Width",
      def: "How wide a shape or object is — the distance across it from one side to the other.",
      example: "A rectangle that measures 8 cm across has a width of 8 cm.",
      svg: `<svg viewBox="0 0 280 120" style="background:#F0F9FF; border-radius:12px; border:1px solid #BAE6FD; width:100%;">
        <rect x="55" y="30" width="170" height="50" fill="rgba(2,132,199,0.15)" stroke="#0284C7" stroke-width="3"/>
        <line x1="55" y1="98" x2="225" y2="98" stroke="#EA580C" stroke-width="3"/>
        <line x1="55" y1="92" x2="55" y2="104" stroke="#EA580C" stroke-width="3"/>
        <line x1="225" y1="92" x2="225" y2="104" stroke="#EA580C" stroke-width="3"/>
        <text x="140" y="115" text-anchor="middle" fill="#EA580C" font-weight="900" font-size="13">width = 8 cm</text>
      </svg>`
    },
    "length": {
      title: "Length",
      def: "How long a shape or object is — the distance from one end to the other.",
      example: "A rectangle 8 cm long and 3 cm wide has a length of 8 cm.",
      svg: `<svg viewBox="0 0 280 120" style="background:#F0F9FF; border-radius:12px; border:1px solid #BAE6FD; width:100%;">
        <rect x="55" y="25" width="160" height="55" fill="rgba(2,132,199,0.15)" stroke="#0284C7" stroke-width="3"/>
        <line x1="55" y1="98" x2="215" y2="98" stroke="#0284C7" stroke-width="3"/>
        <line x1="55" y1="92" x2="55" y2="104" stroke="#0284C7" stroke-width="3"/>
        <line x1="215" y1="92" x2="215" y2="104" stroke="#0284C7" stroke-width="3"/>
        <text x="135" y="115" text-anchor="middle" fill="#0284C7" font-weight="900" font-size="13">length = 8 cm</text>
        <text x="232" y="58" fill="#EA580C" font-weight="900" font-size="12">3 cm</text>
      </svg>`
    },
    "exponent": {
      title: "Exponent",
      def: "A small number placed above and to the right of a base showing how many times to multiply the base by itself.",
      example: "In 2³, 3 is the exponent (2 × 2 × 2 = 8).",
      svg: `<svg viewBox="0 0 280 120" style="background:#EFF6FF; border-radius:12px; border:1px solid #BFDBFE; width:100%;">
        <text x="120" y="75" fill="#1D4ED8" font-weight="900" font-size="44">2</text>
        <text x="150" y="45" fill="#DC2626" font-weight="900" font-size="28">3</text>
        <text x="140" y="105" text-anchor="middle" fill="#1E40AF" font-weight="800" font-size="12">Multiply 2 three times: 2 · 2 · 2 = 8</text>
      </svg>`
    },
    "percent": {
      title: "Percent",
      def: "A ratio or fraction comparing a quantity out of 100, written with the % symbol.",
      example: "25% means 25 out of 100, or ¼.",
      svg: `<svg viewBox="0 0 280 120" style="background:#FEF2F2; border-radius:12px; border:1px solid #FCA5A5; width:100%;">
        <rect x="80" y="25" width="120" height="50" fill="#DC2626" rx="8"/>
        <text x="140" y="58" text-anchor="middle" fill="#FFF" font-weight="900" font-size="24">75%</text>
        <text x="140" y="105" text-anchor="middle" fill="#991B1B" font-weight="800" font-size="12">75 per 100 (75/100)</text>
      </svg>`
    },
    "polygon": {
      title: "Polygon",
      def: "A closed 2D shape made up of 3 or more straight line segments that meet at corners.",
      example: "Triangles, rectangles, pentagons, and hexagons are all polygons.",
      svg: `<svg viewBox="0 0 280 120" style="background:#F0FDF4; border-radius:12px; border:1px solid #BBF7D0; width:100%;">
        <polygon points="60,80 100,25 180,25 220,80 140,105" fill="rgba(22,163,74,0.2)" stroke="#16A34A" stroke-width="3"/>
        <text x="140" y="65" text-anchor="middle" fill="#15803D" font-weight="900" font-size="14">Straight Sides & Closed</text>
      </svg>`
    }
  };

  // 3. Inject Universal Modal Card
  function initVocabModal() {
    if (document.getElementById('formula-popup-modal')) return;
    const modalHtml = `
      <div id="formula-popup-modal" style="position:fixed; top:0; left:0; width:100vw; height:100vh; background:rgba(15,23,42,0.65); backdrop-filter:blur(4px); z-index:99999; display:none; align-items:center; justify-content:center;">
        <div style="background:#FFF; width:480px; max-width:92vw; border-radius:20px; padding:24px; box-shadow:0 20px 50px rgba(0,0,0,0.25); border:1px solid #E2E8F0; font-family:'Nunito', 'Outfit', sans-serif;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:14px;">
            <div style="display:flex; align-items:center; gap:8px;">
              <span style="background:#F0F9FF; color:#0284C7; font-size:1.2rem; padding:4px 10px; border-radius:10px; font-weight:900;">📖</span>
              <h3 id="formula-modal-title" style="margin:0; font-size:1.25rem; font-weight:900; color:#0F172A;">Vocabulary Reference</h3>
            </div>
            <button onclick="closeFormulaModal()" style="background:#F1F5F9; border:none; width:32px; height:32px; border-radius:50%; font-weight:800; cursor:pointer;">✕</button>
          </div>
          
          <div id="formula-modal-svg" style="margin-bottom:14px;"></div>
          
          <div style="background:#F8FAFC; border:1px solid #E2E8F0; border-radius:12px; padding:14px; margin-bottom:14px;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
              <span style="font-size:0.75rem; font-weight:900; background:#0284C7; color:#FFF; padding:2px 8px; border-radius:6px; text-transform:uppercase;">Simple Definition</span>
              <button id="vocab-tts-btn" style="background:#E0F2FE; color:#0369A1; border:none; padding:4px 10px; border-radius:8px; font-size:0.8rem; font-weight:800; cursor:pointer; display:flex; align-items:center; gap:4px;">🗣️ Listen</button>
            </div>
            <p id="formula-modal-def" style="margin:0; font-size:0.95rem; color:#0F172A; line-height:1.5; font-weight:700;"></p>
          </div>

          <div style="background:#FFFBEB; border:1px solid #FDE68A; border-radius:12px; padding:12px 14px; margin-bottom:16px;">
            <div style="font-size:0.75rem; font-weight:900; color:#B45309; text-transform:uppercase; margin-bottom:4px;">Example</div>
            <p id="formula-modal-example" style="margin:0; font-size:0.88rem; color:#78350F; line-height:1.4;"></p>
          </div>

          <button onclick="closeFormulaModal()" style="width:100%; background:#0284C7; color:#FFF; border:none; padding:12px; border-radius:12px; font-weight:800; font-size:0.95rem; cursor:pointer;">Got it!</button>
        </div>
      </div>
    `;
    const div = document.createElement('div');
    div.innerHTML = modalHtml;
    document.body.appendChild(div);
  }

  // 4. Global Handler Functions
  window['openVocabModal'] = function(termOrKey) {
    initVocabModal();
    const key = (termOrKey || '').toLowerCase().trim();
    const data = VOCAB_DB[key] || {
      title: termOrKey.charAt(0).toUpperCase() + termOrKey.slice(1),
      def: "A mathematical term used to represent quantitative relationships, measurements, or operations.",
      example: `Applying the term "${termOrKey}" step-by-step in mathematical problem solving.`,
      svg: `<svg viewBox="0 0 280 120" style="background:#F0F9FF; border-radius:12px; border:1px solid #BAE6FD; width:100%;">
        <rect x="40" y="30" width="200" height="50" fill="#0284C7" rx="10"/>
        <text x="140" y="62" text-anchor="middle" fill="#FFF" font-weight="900" font-size="18">${termOrKey.toUpperCase()}</text>
      </svg>`
    };

    document.getElementById('formula-modal-title').innerText = data.title;
    document.getElementById('formula-modal-def').innerText = data.def;
    document.getElementById('formula-modal-example').innerText = data.example;
    document.getElementById('formula-modal-svg').innerHTML = data.svg;

    // Attach Speech Synthesis to Listen button
    const ttsBtn = document.getElementById('vocab-tts-btn');
    if (ttsBtn) {
      ttsBtn.onclick = function() {
        if ('speechSynthesis' in window) {
          window.speechSynthesis.cancel();
          const text = `${data.title}. ${data.def} Example: ${data.example}`;
          const u = new SpeechSynthesisUtterance(text);
          u.rate = 0.92;
          window.speechSynthesis.speak(u);
        }
      };
    }

    const modal = document.getElementById('formula-popup-modal');
    if (modal) modal.style.display = 'flex';
  };

  window['openFormulaModal'] = function(key) {
    window['openVocabModal'](key);
  };

  window['closeFormulaModal'] = function() {
    const modal = document.getElementById('formula-popup-modal');
    if (modal) {
      modal.style.display = 'none';
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    }
  };

  // 5. Docked Notice/Wonder Scaffold & Word Bank Toolbar Auto-Injector
  function initNoticeWonderScaffolds() {
    const textareas = /** @type {NodeListOf<HTMLTextAreaElement>} */ (
      document.querySelectorAll('textarea.ref-lined-input, .ref-nw-panel textarea, .notice-wonder textarea, .talk-about-it textarea, .discourse textarea, textarea[placeholder*="notice"], textarea[placeholder*="wonder"], textarea[placeholder*="Notice"], textarea[placeholder*="Wonder"]')
    );
    
    textareas.forEach((ta) => {
      if (ta.dataset.nwScaffoldInjected) return;
      ta.dataset.nwScaffoldInjected = "true";

      const placeholder = (ta.placeholder || '').toLowerCase();
      const parentText = (ta.parentElement ? ta.parentElement.innerText : '').toLowerCase();
      const isWonder = placeholder.includes('wonder') || parentText.includes('wonder');

      const starters = isWonder ? [
        'I wonder why...',
        'What would happen if...',
        'How does...',
        'Why are...'
      ] : [
        'I notice that...',
        'I observe...',
        'The shape has...',
        'The dimensions show...'
      ];

      const vocabWords = ['base', 'trapezoid', 'height', 'area', 'parallel', 'formula', 'dimension'];

      const bar = document.createElement('div');
      bar.className = 'nw-scaffold-toolbar';
      bar.style.cssText = 'background:#F8FAFC; border:1px solid #CBD5E1; border-bottom:none; border-radius:12px 12px 0 0; padding:8px 12px; margin-top:10px; display:flex; flex-direction:column; gap:6px; font-family:"Nunito", sans-serif; box-shadow:0 -2px 10px rgba(0,0,0,0.03);';
      
      let startersHtml = starters.map(s => `<button type="button" class="nw-starter-btn" style="background:#FFF; border:1px solid #BAE6FD; color:#0369A1; font-weight:800; font-size:0.75rem; padding:3px 9px; border-radius:16px; cursor:pointer;" data-insert="${s}">${s}</button>`).join('');
      let vocabHtml = vocabWords.map(w => `<button type="button" class="nw-vocab-btn" style="background:#F0FDFA; border:1px solid #99F6E4; color:#0D9488; font-weight:900; font-size:0.75rem; padding:2px 8px; border-radius:8px; cursor:pointer;" data-word="${w}">${w} 🔍</button>`).join('');

      bar.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap;">
          <span style="font-size:0.72rem; font-weight:900; color:#0369A1; text-transform:uppercase;">⚡ Quick Response Helpers (Click to insert):</span>
        </div>
        <div style="display:flex; gap:6px; flex-wrap:wrap; align-items:center;">
          <span style="font-size:0.72rem; font-weight:900; color:#0284C7; background:#E0F2FE; padding:1px 6px; border-radius:4px;">Starters:</span>
          ${startersHtml}
        </div>
        <div style="display:flex; gap:6px; flex-wrap:wrap; align-items:center;">
          <span style="font-size:0.72rem; font-weight:900; color:#0D9488; background:#CCFBF1; padding:1px 6px; border-radius:4px;">Word Bank:</span>
          ${vocabHtml}
        </div>
      `;

      ta.style.borderTopLeftRadius = '0px';
      ta.style.borderTopRightRadius = '0px';
      ta.parentNode.insertBefore(bar, ta);

      const starterButtons = /** @type {NodeListOf<HTMLButtonElement>} */ (
        bar.querySelectorAll('.nw-starter-btn')
      );
      starterButtons.forEach(btn => {
        btn.onclick = function(e) {
          e.preventDefault();
          const txt = btn.getAttribute('data-insert');
          if (!ta.value.trim()) {
            ta.value = txt + " ";
          } else {
            ta.value += " " + txt + " ";
          }
          ta.focus();
        };
      });

      const vocabButtons = /** @type {NodeListOf<HTMLButtonElement>} */ (
        bar.querySelectorAll('.nw-vocab-btn')
      );
      vocabButtons.forEach(btn => {
        btn.onclick = function(e) {
          e.preventDefault();
          const word = btn.getAttribute('data-word');
          const start = ta.selectionStart || ta.value.length;
          const end = ta.selectionEnd || ta.value.length;
          const val = ta.value;
          ta.value = val.substring(0, start) + (start > 0 && val[start-1] !== ' ' ? ' ' : '') + word + ' ' + val.substring(end);
          ta.focus();
          if (window['openVocabModal']) window['openVocabModal'](word);
        };
      });
    });
  }

  // 6. Auto-bind events on DOM Content Loaded
  window.addEventListener('DOMContentLoaded', function() {
    initVocabModal();
    initNoticeWonderScaffolds();
    setTimeout(initNoticeWonderScaffolds, 1000);
  });
})();
