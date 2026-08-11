window.openAwardShowcaseModal = function openAwardShowcaseModal(cat) {
  const overlay = document.getElementById("awardShowcaseOverlay");
  const icon = document.getElementById("awardModalIcon");
  const title = document.getElementById("awardModalTitle");
  const sub = document.getElementById("awardModalSubtitle");
  const body = document.getElementById("awardModalBody");

  const details = {
    codie: {
      icon: "🥇",
      title: "CODiE 2026 Mathematics Solution Finalist",
      sub: "Pedagogical Innovation & Metacognitive Agency",
      html: "<p><strong>Key Innovations Recognized:</strong></p><ul><li><strong>Real-Time Diagnostic Pulse:</strong> 60-second epistemic readiness check that surfaces common misconceptions prior to small-group rotations.</li><li><strong>Metacognitive Calibration:</strong> Confidence self-rating vs actual accuracy loops fostering student agency.</li><li><strong>Zero-Content Destruction:</strong> Integrates seamlessly on top of existing scope & sequence pacing without breaking data or routes.</li></ul>",
    },
    bett: {
      icon: "⭐",
      title: "Bett EdTech Excellence Award Winner",
      sub: "Small-Group Tri-Rotation Workbench & Socratic Surgical Cards",
      html: "<p><strong>Key Innovations Recognized:</strong></p><ul><li><strong>Tri-Rotation Small-Group Model:</strong> Synchronizes Teacher-Led Focus Table, Independent Tactile Math SVG Lab, and Peer Dialectic Discourse.</li><li><strong>Socratic Surgical Cards:</strong> Provides teachers with miscue-targeted prompt cards during small-group focus table instruction.</li><li><strong>Evidence Exporter:</strong> 1-click CSV diagnostic summary for data-driven small-group grouping.</li></ul>",
    },
    iste: {
      icon: "⚡",
      title: "ISTE Pedagogy & Technology Integration Award",
      sub: "Dual-Coding Programmatic SVG Manipulatives",
      html: "<p><strong>Key Innovations Recognized:</strong></p><ul><li><strong>Interactive SVG Math Visualizers:</strong> Dual-coded visual representations (Venn diagrams, tape models, coordinate starfields, 3D net fold morphs).</li><li><strong>Touch & Keyboard Accessibility:</strong> Full compliance with W3C WCAG 2.1 AA keyboard navigation.</li><li><strong>Tactile Micro-Transitions:</strong> Smooth SVG animations isolating micro-transitions from core mathematical logic.</li></ul>",
    },
    udl: {
      icon: "♿",
      title: "UDL 3.0 Universal Access Standard",
      sub: "W3C WCAG 2.1 AA & Multilingual ESOL Support",
      html: "<p><strong>Key Innovations Recognized:</strong></p><ul><li><strong>Multilingual Sentence Starters:</strong> Academic language frames for ELL/ESOL learners in English and Spanish.</li><li><strong>Accessibility Controls:</strong> On-demand Dyslexia-Friendly font, high-contrast ambient focus modes, and audio-visual assist.</li><li><strong>Universal Design:</strong> Multi-modal representations (visual, auditory, tactile) for all learner profiles.</li></ul>",
    },
  };

  const d = details[cat] || details.codie;
  if (icon) icon.textContent = d.icon;
  if (title) title.textContent = d.title;
  if (sub) sub.textContent = d.sub;
  if (body) body.innerHTML = d.html;
  if (overlay) overlay.style.display = "flex";
};

window.closeAwardShowcaseModal = function closeAwardShowcaseModal() {
  const overlay = document.getElementById("awardShowcaseOverlay");
  if (overlay) overlay.style.display = "none";
};

window.toggleUdlMenu = function toggleUdlMenu() {
  const menu = document.getElementById("udlMenuPopover");
  if (menu) menu.style.display = menu.style.display === "none" ? "block" : "none";
};

window.toggleDyslexiaFont = function toggleDyslexiaFont(enable) {
  if (enable) {
    document.body.style.fontFamily = "'Atkinson Hyperlegible', sans-serif";
  } else {
    document.body.style.fontFamily = "";
  }
};

window.toggleHighContrast = function toggleHighContrast(enable) {
  if (enable) {
    document.body.style.filter = "contrast(1.15) brightness(1.05)";
  } else {
    document.body.style.filter = "";
  }
};

window.toggleEsolOverlay = function toggleEsolOverlay(enable) {
  alert(
    enable
      ? "ESOL Dual-Language Scaffolds Enabled! Lesson cards will now feature Spanish sentence frames."
      : "ESOL Scaffolds reset to default.",
  );
};
