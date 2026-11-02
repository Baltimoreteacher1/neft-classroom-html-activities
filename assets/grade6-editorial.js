/* Small, additive chapter illustrations for Grade 6 curriculum entry pages. */
(() => {
  const chapters = {
    0: {
      label: "Rational numbers located on a number line",
      svg: `<svg viewBox="0 0 260 200" aria-hidden="true"><path d="M34 105h192M34 105l10-6v12zM226 105l-10-6v12z" fill="#17324d" stroke="#17324d" stroke-width="2"/><g stroke="#17324d" stroke-width="1.5"><path d="M58 96v18M98 96v18M138 96v18M178 96v18M218 96v18"/></g><g fill="#2f6fa3" stroke="#fffefa" stroke-width="3"><circle cx="58" cy="105" r="7"/><circle cx="138" cy="105" r="7"/><circle cx="218" cy="105" r="7"/></g><g fill="#17324d" font-family="Georgia,serif" font-size="17" text-anchor="middle"><text x="58" y="142">−2</text><text x="138" y="142">0</text><text x="218" y="142">2</text><text x="130" y="55" font-size="18">Locate · compare · explain</text></g></svg>`,
    },
    1: {
      label: "Factors and number operations",
      svg: `<svg viewBox="0 0 260 200" aria-hidden="true"><path d="M130 30v32M130 62 78 104M130 62l52 42M78 104v30M78 134 48 166M78 134l30 32M182 104v30M182 134l-26 32M182 134l30 32" fill="none" stroke="currentColor" stroke-width="2"/><g fill="#fffefa" stroke="currentColor" stroke-width="2"><circle cx="130" cy="28" r="22"/><circle cx="78" cy="104" r="20"/><circle cx="182" cy="104" r="20"/><circle cx="48" cy="166" r="17"/><circle cx="108" cy="166" r="17"/><circle cx="156" cy="166" r="17"/><circle cx="212" cy="166" r="17"/></g><g fill="#17324d" font-family="Georgia,serif" font-size="18" text-anchor="middle"><text x="130" y="34">60</text><text x="78" y="110">6</text><text x="182" y="110">10</text><text x="48" y="172">2</text><text x="108" y="172">3</text><text x="156" y="172">2</text><text x="212" y="172">5</text></g></svg>`,
    },
    2: {
      label: "Statistical data and distributions",
      svg: `<svg viewBox="0 0 260 200" aria-hidden="true"><path d="M30 160h210M42 160v-8M82 160v-8M122 160v-8M162 160v-8M202 160v-8" stroke="#17324d" stroke-width="2"/><path d="M82 128h80v32H82z" fill="#d9ebe5" stroke="currentColor" stroke-width="2"/><path d="M122 96h40v32h-40zM162 64h40v96h-40z" fill="#ead9b1" stroke="currentColor" stroke-width="2"/><g fill="#17324d"><circle cx="82" cy="145" r="4"/><circle cx="102" cy="145" r="4"/><circle cx="122" cy="145" r="4"/><circle cx="142" cy="145" r="4"/><circle cx="162" cy="145" r="4"/><circle cx="182" cy="145" r="4"/></g><text x="30" y="34" fill="#17324d" font-family="Georgia,serif" font-size="19">A distribution has a shape.</text></svg>`,
    },
    3: {
      label: "Equivalent ratios in a tape diagram",
      svg: `<svg viewBox="0 0 260 200" aria-hidden="true"><text x="22" y="52" fill="#17324d" font-family="Georgia,serif" font-size="16">2 : 3</text><text x="22" y="122" fill="#17324d" font-family="Georgia,serif" font-size="16">4 : 6</text><g stroke="#17324d" stroke-width="2"><path d="M82 30h44v42H82zM126 30h66v42h-66zM82 100h44v42H82zM126 100h44v42h-44zM170 100h44v42h-44z" fill="#d9ebe5"/><path d="M82 30h22v42H82zM126 30h22v42h-22zM82 100h22v42H82zM126 100h22v42h-22z" fill="#cde2dc"/></g><path d="M82 166h132" stroke="#b87926" stroke-width="2"/><text x="148" y="188" text-anchor="middle" fill="#53636e" font-family="system-ui,sans-serif" font-size="13">same relationship, scaled</text></svg>`,
    },
    4: {
      label: "Twenty-five hundredths shown on a percent grid",
      svg: `<svg viewBox="0 0 260 200" aria-hidden="true"><g transform="translate(43 22)" stroke="#fffefa" stroke-width="1"><rect width="140" height="140" fill="#f2ead7"/>${Array.from({ length: 25 }, (_, i) => `<rect x="${(i % 10) * 14}" y="${Math.floor(i / 10) * 14}" width="14" height="14" fill="#b3402a"/>`).join("")}${Array.from({ length: 100 }, (_, i) => `<path d="M${(i % 10) * 14} ${Math.floor(i / 10) * 14}h14v14H${(i % 10) * 14}z" fill="none" stroke="#fffefa" stroke-width=".7"/>`).join("")}</g><text x="202" y="95" fill="#17324d" font-family="Georgia,serif" font-size="28">25%</text><text x="202" y="117" fill="#53636e" font-family="system-ui,sans-serif" font-size="12">25 of 100</text></svg>`,
    },
    5: {
      label: "Area as the sum of rearranged shapes",
      svg: `<svg viewBox="0 0 260 200" aria-hidden="true"><path d="M44 150 100 48l56 102z" fill="#d9ebe5" stroke="currentColor" stroke-width="2"/><path d="M156 150 212 48v102z" fill="#ead9b1" stroke="currentColor" stroke-width="2"/><path d="M100 48v102" stroke="#17324d" stroke-width="1.5" stroke-dasharray="4 4"/><path d="M44 166h112M156 166h56" stroke="#17324d" stroke-width="1.5"/><text x="130" y="28" text-anchor="middle" fill="#17324d" font-family="Georgia,serif" font-size="18">decompose · find · combine</text></svg>`,
    },
    6: {
      label: "An expression represented with algebra tiles",
      svg: `<svg viewBox="0 0 260 200" aria-hidden="true"><g stroke="#17324d" stroke-width="2"><rect x="34" y="54" width="100" height="78" rx="3" fill="#d9ebe5"/><rect x="134" y="54" width="42" height="78" rx="3" fill="#ead9b1"/><rect x="176" y="54" width="42" height="78" rx="3" fill="#ead9b1"/></g><text x="84" y="102" text-anchor="middle" fill="#17324d" font-family="Georgia,serif" font-size="28">x</text><text x="155" y="102" text-anchor="middle" fill="#17324d" font-family="Georgia,serif" font-size="24">1</text><text x="197" y="102" text-anchor="middle" fill="#17324d" font-family="Georgia,serif" font-size="24">1</text><text x="130" y="164" text-anchor="middle" fill="#53636e" font-family="system-ui,sans-serif" font-size="14">x + 2</text></svg>`,
    },
    7: {
      label: "Ordered pairs on the coordinate plane",
      svg: `<svg viewBox="0 0 260 200" aria-hidden="true"><g stroke="#b9c5c1" stroke-width="1"><path d="M58 30v140M88 30v140M118 30v140M148 30v140M178 30v140M208 30v140M28 50h200M28 80h200M28 110h200M28 140h200"/></g><path d="M28 110h205M118 170V25" stroke="#17324d" stroke-width="2"/><path d="M178 50 148 80 88 140" fill="none" stroke="#3f6db5" stroke-width="2"/><g fill="#3f6db5"><circle cx="178" cy="50" r="5"/><circle cx="148" cy="80" r="5"/><circle cx="88" cy="140" r="5"/></g><text x="182" y="43" fill="#17324d" font-family="system-ui,sans-serif" font-size="13">(2, 2)</text></svg>`,
    },
    8: {
      label: "Equation solved by keeping both sides balanced",
      svg: `<svg viewBox="0 0 260 200" aria-hidden="true"><path d="M130 38v94M42 66h176M58 66l-20 48h64L82 66M178 66l-20 48h64l-22-48M88 142h84" fill="none" stroke="#17324d" stroke-width="3"/><rect x="48" y="47" width="40" height="18" rx="2" fill="#d9ebe5" stroke="#17324d" stroke-width="2"/><circle cx="56" cy="102" r="7" fill="#ead9b1" stroke="#17324d" stroke-width="2"/><circle cx="76" cy="102" r="7" fill="#ead9b1" stroke="#17324d" stroke-width="2"/><g fill="#ead9b1" stroke="#17324d" stroke-width="1.5"><circle cx="165" cy="91" r="7"/><circle cx="182" cy="91" r="7"/><circle cx="199" cy="91" r="7"/><circle cx="173" cy="108" r="7"/><circle cx="190" cy="108" r="7"/></g><text x="130" y="174" text-anchor="middle" fill="#17324d" font-family="Georgia,serif" font-size="18">x + 2 = 5</text></svg>`,
    },
    9: {
      label: "Two related quantities shown in a table and graph",
      svg: `<svg viewBox="0 0 260 200" aria-hidden="true"><path d="M32 154h106M32 154V44" stroke="#17324d" stroke-width="2"/><path d="M48 138 72 116 96 94 120 72" fill="none" stroke="#557a2f" stroke-width="2.5"/><g fill="#557a2f"><circle cx="48" cy="138" r="4"/><circle cx="72" cy="116" r="4"/><circle cx="96" cy="94" r="4"/><circle cx="120" cy="72" r="4"/></g><rect x="160" y="48" width="74" height="108" fill="#fffefa" stroke="#17324d" stroke-width="2"/><path d="M160 76h74M160 104h74M160 132h74M197 48v108" stroke="#b9c5c1"/><text x="177" y="68" text-anchor="middle" fill="#53636e" font-size="12" font-family="system-ui,sans-serif">x</text><text x="215" y="68" text-anchor="middle" fill="#53636e" font-size="12" font-family="system-ui,sans-serif">y</text><text x="177" y="96" text-anchor="middle" fill="#17324d" font-size="12">1</text><text x="215" y="96" text-anchor="middle" fill="#17324d" font-size="12">3</text><text x="177" y="124" text-anchor="middle" fill="#17324d" font-size="12">2</text><text x="215" y="124" text-anchor="middle" fill="#17324d" font-size="12">6</text></svg>`,
    },
    10: {
      label: "A rectangular prism and its measurable dimensions",
      svg: `<svg viewBox="0 0 260 200" aria-hidden="true"><path d="M62 80 130 44l72 36-70 39z" fill="#e8eadf" stroke="#17324d" stroke-width="2"/><path d="M62 80v72l70 39v-72z" fill="#d9ebe5" stroke="#17324d" stroke-width="2"/><path d="M132 119v72l70-39V80z" fill="#ead9b1" stroke="#17324d" stroke-width="2"/><path d="M48 80v72M44 80h8M44 152h8M62 164l70 39M62 160l-5 7M132 199l-5 6M208 74v78M204 74h8M204 152h8" fill="none" stroke="#17324d" stroke-width="1.5"/><text x="130" y="25" text-anchor="middle" fill="#17324d" font-family="Georgia,serif" font-size="18">volume · surface area</text></svg>`,
    },
  };
  const accents = [
    "#316f62",
    "#2f6fa3",
    "#b5562b",
    "#b3402a",
    "#2f8a8a",
    "#a8792a",
    "#3f6db5",
    "#a34a6b",
    "#557a2f",
    "#5b6470",
  ];
  const unitMatch = location.pathname.match(/^\/math\/unit-(\d+)\//);
  const hero = document.querySelector("main.page-shell > .hero, body > .wrap > .hero");
  if (!hero) return;
  if (location.pathname === "/math/" || location.pathname === "/math/index.html") {
    document.body.classList.add("grade6-overview-page");
    return;
  }
  let chapter;
  if (unitMatch) {
    const unit = Number(unitMatch[1]);
    chapter = chapters[unit] || chapters[1];
    if (!chapter) return;
    document.body.classList.add("grade6-chapter-page");
    if (unit === 0) document.body.classList.add("grade6-unit-zero-page");
    document.body.style.setProperty("--chapter-accent", accents[Math.max(0, unit - 1)]);
    const copy = hero.querySelector(".hero-copy");
    if (copy) copy.id ||= "chapter-description";
    const previous = hero.querySelector(".chapter-art");
    if (previous) previous.remove();
    const art = document.createElement("figure");
    art.className = "chapter-art";
    art.setAttribute("role", "img");
    art.setAttribute("aria-label", chapter.label);
    art.innerHTML = chapter.svg;
    hero.append(art);
    hero.setAttribute("aria-label", `Grade 6, Unit ${unit}: ${chapter.label}`);
  } else {
    const headings = {
      "Number System": chapters[7],
      "Ratios and Proportions": chapters[3],
      "Expressions, Equations, and Variables": chapters[9],
      "Statistics and Data": chapters[2],
    };
    chapter = headings[hero.querySelector("h1")?.textContent.trim()];
    if (!chapter) return;
    document.body.classList.add("grade6-strand-page");
    const art = document.createElement("figure");
    art.className = "chapter-art strand-art";
    art.setAttribute("role", "img");
    art.setAttribute("aria-label", chapter.label);
    art.innerHTML = chapter.svg;
    hero.append(art);
  }
})();
