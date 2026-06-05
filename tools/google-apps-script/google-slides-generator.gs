/**
 * google-slides-generator.gs
 * Neft Teacher — Google Slides Lesson Generator
 * Version 1.0.0
 *
 * PURPOSE:
 * Generates custom, source-faithful Google Slides presentations matching
 * the Grade 6 HTML lessons.
 *
 * LAYOUT RULES (v5.1 Design System):
 * - Background: #F7F4EC (warm off-white)
 * - Primary Header/Chrome: #17324D (navy)
 * - Accent: #1FA6A2 (teal)
 * - Highlight: #F2C15B (amber)
 * - Body Text: #24323F (Calibri, size 16-24pt)
 * - Banned Colors: Purple (#4A2580) and its variants.
 * - Visual Math: Generated programmatically using SVGs as image blobs.
 */

// ═══════════════════════════════════════════════════════════════════
// CONFIG LAYER
// ═══════════════════════════════════════════════════════════════════
var CONFIG = {
  PAGES_DEV_BASE_URL: "https://neft-classroom-html-activities.pages.dev",
  FONT_FAMILY: "Lexend",
  TITLE_FONT_FAMILY: "Lexend",
  COLOR_BG: "#F7F4EC",
  COLOR_NAVY: "#17324D",
  COLOR_TEAL: "#1FA6A2",
  COLOR_TEAL_LIGHT: "#DFF2EE",
  COLOR_AMBER: "#F2C15B",
  COLOR_BODY_TEXT: "#24323F",
  COLOR_WHITE: "#FFFFFF",
  COLOR_CORAL: "#FCE6DE",
  COLOR_GRAY: "#8A96A3"
};

/** Validate all configuration variables. */
function validateConfig() {
  if (!CONFIG.PAGES_DEV_BASE_URL || !CONFIG.PAGES_DEV_BASE_URL.startsWith("http")) {
    throw new Error("Invalid Configuration: PAGES_DEV_BASE_URL must be a valid HTTP/S endpoint.");
  }
  if (!CONFIG.COLOR_NAVY.startsWith("#") || CONFIG.COLOR_NAVY.toUpperCase() === "#4A2580") {
    throw new Error("Invalid Configuration: COLOR_NAVY must be a valid hex code and CANNOT be purple.");
  }
  Logger.log("Configuration successfully validated.");
  return true;
}

// ═══════════════════════════════════════════════════════════════════
// REPOSITORY LAYER (Data Access)
// ═══════════════════════════════════════════════════════════════════
var Repository = {
  /** Fetch the lesson's config.json from production site. */
  fetchLessonConfig: function(lessonId) {
    validateConfig();
    var cleanId = String(lessonId).trim();
    var url = CONFIG.PAGES_DEV_BASE_URL + "/lessons/" + cleanId + "/config.json";
    
    Logger.log("Fetching lesson data from: " + url);
    var response = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
    
    if (response.getResponseCode() !== 200) {
      throw new Error("Failed to fetch lesson config for '" + cleanId + "' (Status " + response.getResponseCode() + ")");
    }
    
    var data;
    try {
      data = JSON.parse(response.getContentText());
    } catch (e) {
      throw new Error("Failed to parse config JSON for lesson '" + cleanId + "': " + e.message);
    }
    
    return data;
  }
};

// ═══════════════════════════════════════════════════════════════════
// SERVICE LAYER (Business Logic)
// ═══════════════════════════════════════════════════════════════════
var Service = {
  /** Create a beautiful, themed Google Slides presentation. */
  createLessonSlides: function(lessonId, data) {
    var title = "Lesson " + lessonId + " : " + (data.title || "Math Interactive");
    var presentation = SlidesApp.create(title);
    var slides = presentation.getSlides();
    
    // Clean up initial default slide if any
    if (slides.length > 0) {
      slides[0].remove();
    }
    
    // Build Slide Deck in order
    this.buildSlide1_Objectives(presentation, lessonId, data);
    this.buildSlide2_BeCurious(presentation, lessonId, data);
    this.buildSlide3_Vocabulary(presentation, lessonId, data);
    this.buildSlide4_VisualModel(presentation, lessonId, data);
    this.buildSlide5_GuidedPractice(presentation, lessonId, data);
    this.buildSlide6_ActivityA(presentation, lessonId, data);
    this.buildSlide7_ActivityB(presentation, lessonId, data);
    this.buildSlide8_RealWorld(presentation, lessonId, data);
    this.buildSlide9_Reflection(presentation, lessonId, data);
    
    return presentation.getUrl();
  },

  /** Apply background color and headers/footers to slides. */
  applySlideTheme: function(slide, headerTitle, footerText) {
    slide.getBackground().setSolidFill(CONFIG.COLOR_BG);
    
    var pres = slide.getParent();
    var width = pres.getPageWidth();
    var height = pres.getPageHeight();
    
    // Header Bar
    var header = slide.insertShape(SlidesApp.ShapeType.RECTANGLE, 0, 0, width, 55);
    header.getFill().setSolidFill(CONFIG.COLOR_NAVY);
    header.getBorder().setTransparent();
    
    var headerText = header.getText();
    headerText.setText(headerTitle);
    headerText.getTextStyle().setFontFamily(CONFIG.TITLE_FONT_FAMILY);
    headerText.getTextStyle().setFontSize(18);
    headerText.getTextStyle().setBold(true);
    headerText.getTextStyle().setForegroundColor(CONFIG.COLOR_AMBER);
    headerText.getParagraphStyle().setParagraphAlignment(SlidesApp.ParagraphAlignment.CENTER);
    
    // TPT Accent Line under Header Bar
    var headerLine = slide.insertShape(SlidesApp.ShapeType.RECTANGLE, 0, 55, width, 4);
    headerLine.getFill().setSolidFill(CONFIG.COLOR_AMBER);
    headerLine.getBorder().setTransparent();
    
    // Footer Bar
    var footer = slide.insertShape(SlidesApp.ShapeType.RECTANGLE, 0, height - 35, width, 35);
    footer.getFill().setSolidFill(CONFIG.COLOR_NAVY);
    footer.getBorder().setTransparent();
    
    var footerTextObj = footer.getText();
    footerTextObj.setText(footerText || "Neft Teacher · Grade 6 Math");
    footerTextObj.getTextStyle().setFontFamily(CONFIG.FONT_FAMILY);
    footerTextObj.getTextStyle().setFontSize(11);
    footerTextObj.getTextStyle().setForegroundColor(CONFIG.COLOR_WHITE);
    footerTextObj.getParagraphStyle().setParagraphAlignment(SlidesApp.ParagraphAlignment.CENTER);
  },

  /** Helper to insert a beautiful drop-shadow card. */
  insertCardWithShadow: function(slide, x, y, w, h, bgColor, borderColor, borderWidth) {
    // Drop shadow
    var shadow = slide.insertShape(SlidesApp.ShapeType.ROUND_RECTANGLE, x + 4, y + 4, w, h);
    shadow.getFill().setSolidFill("#D5D1C7");
    shadow.getBorder().setTransparent();
    
    // Main card
    var card = slide.insertShape(SlidesApp.ShapeType.ROUND_RECTANGLE, x, y, w, h);
    card.getFill().setSolidFill(bgColor || CONFIG.COLOR_WHITE);
    if (borderColor) {
      card.getBorder().getLineFill().setSolidFill(borderColor);
      card.getBorder().setWeight(borderWidth || 1.5);
    } else {
      card.getBorder().setTransparent();
    }
    
    return card;
  },

  /** Helper to insert a tilted sticky note. */
  insertStickyNote: function(slide, x, y, w, h, bgColor, rotationAngle) {
    var shadow = slide.insertShape(SlidesApp.ShapeType.ROUND_RECTANGLE, x + 3, y + 3, w, h);
    shadow.getFill().setSolidFill("#D5D1C7");
    shadow.getBorder().setTransparent();
    shadow.setRotation(rotationAngle);
    
    var note = slide.insertShape(SlidesApp.ShapeType.ROUND_RECTANGLE, x, y, w, h);
    note.getFill().setSolidFill(bgColor);
    note.getBorder().setTransparent();
    note.setRotation(rotationAngle);
    
    return note;
  },

  /** Helper to insert a realistic wooden clipboard with white paper sheet. */
  insertClipboard: function(slide, x, y, w, h) {
    // Clipboard wood backing
    var back = slide.insertShape(SlidesApp.ShapeType.ROUND_RECTANGLE, x, y, w, h);
    back.getFill().setSolidFill("#8C6B45");
    back.getBorder().setTransparent();
    
    // Clipboard shadow
    var shadow = slide.insertShape(SlidesApp.ShapeType.ROUND_RECTANGLE, x + 4, y + 4, w, h);
    shadow.getFill().setSolidFill("#2A1E11");
    shadow.getFill().setAlpha(0.2);
    shadow.getBorder().setTransparent();
    
    // Silver metal clip
    var clipW = Math.min(w * 0.4, 120);
    var clipX = x + (w - clipW) / 2;
    var clip = slide.insertShape(SlidesApp.ShapeType.ROUND_RECTANGLE, clipX, y - 8, clipW, 22);
    clip.getFill().setSolidFill("#A1A5A8");
    clip.getBorder().getLineFill().setSolidFill("#7B7E80");
    clip.getBorder().setWeight(1);
    
    // Left & Right screws on the clip
    var screwL = slide.insertShape(SlidesApp.ShapeType.OVAL, clipX + 8, y - 2, 6, 6);
    screwL.getFill().setSolidFill("#5B5E60");
    screwL.getBorder().setTransparent();
    
    var screwR = slide.insertShape(SlidesApp.ShapeType.OVAL, clipX + clipW - 14, y - 2, 6, 6);
    screwR.getFill().setSolidFill("#5B5E60");
    screwR.getBorder().setTransparent();
    
    // Clipboard white paper sheet
    var paperMargin = 15;
    var paper = slide.insertShape(SlidesApp.ShapeType.RECTANGLE, x + paperMargin, y + 25, w - (paperMargin * 2), h - 35);
    paper.getFill().setSolidFill(CONFIG.COLOR_WHITE);
    paper.getBorder().setTransparent();
    
    return paper;
  },

  /** Helper to insert a binder index card with notebook lines & holes. */
  insertNotebookCard: function(slide, x, y, w, h) {
    // Shadow
    var shadow = slide.insertShape(SlidesApp.ShapeType.ROUND_RECTANGLE, x + 4, y + 4, w, h);
    shadow.getFill().setSolidFill("#D5D1C7");
    shadow.getBorder().setTransparent();
    
    // Card face
    var card = slide.insertShape(SlidesApp.ShapeType.ROUND_RECTANGLE, x, y, w, h);
    card.getFill().setSolidFill(CONFIG.COLOR_WHITE);
    card.getBorder().getLineFill().setSolidFill(CONFIG.COLOR_GRAY);
    card.getBorder().setWeight(1);
    
    // Red margin line
    var redLine = slide.insertShape(SlidesApp.ShapeType.RECTANGLE, x + 40, y + 4, 1.5, h - 8);
    redLine.getFill().setSolidFill("#FFC2C2");
    redLine.getBorder().setTransparent();
    
    // Holes and spirals
    for (var hy = y + 25; hy < y + h - 25; hy += 45) {
      var hole = slide.insertShape(SlidesApp.ShapeType.OVAL, x + 15, hy, 8, 8);
      hole.getFill().setSolidFill(CONFIG.COLOR_BG);
      hole.getBorder().setTransparent();
      
      var ring = slide.insertShape(SlidesApp.ShapeType.ROUND_RECTANGLE, x - 4, hy + 2, 23, 4);
      ring.getFill().setSolidFill("#B2B6B9");
      ring.getBorder().setTransparent();
    }
    
    return card;
  },

  /** Helper to place a cute push pin on top of cards. */
  insertPushPin: function(slide, cx, cy) {
    // Shadow
    var sh = slide.insertShape(SlidesApp.ShapeType.OVAL, cx + 2, cy + 2, 14, 14);
    sh.getFill().setSolidFill("#000000");
    sh.getFill().setAlpha(0.15);
    sh.getBorder().setTransparent();
    
    // Head (Red)
    var pin = slide.insertShape(SlidesApp.ShapeType.OVAL, cx, cy, 14, 14);
    pin.getFill().setSolidFill("#FF4C4C");
    pin.getBorder().setTransparent();
    
    // Inner glare for 3D look
    var glare = slide.insertShape(SlidesApp.ShapeType.OVAL, cx + 3, cy + 3, 5, 5);
    glare.getFill().setSolidFill("#FFB3B3");
    glare.getBorder().setTransparent();
  },

  /** SLIDE 1: Objectives & Session Map */
  buildSlide1_Objectives: function(presentation, lessonId, data) {
    var slide = presentation.appendSlide(SlidesApp.PredefinedLayout.BLANK);
    var width = presentation.getPageWidth();
    var height = presentation.getPageHeight();
    this.applySlideTheme(slide, "LESSON " + lessonId + " · OBJECTIVES & AGENDA", "Grade 6 Math · Unit " + (data.unit || ""));
    
    // Split into Content and Language Objective cards side-by-side
    var contentCard = this.insertCardWithShadow(slide, 50, 85, 410, 240, CONFIG.COLOR_WHITE, CONFIG.COLOR_TEAL, 2);
    var ct = contentCard.getText();
    ct.setText("🎯 Content Objective:\n\n" + (data.contentObjective || "I can explain the mathematical relationships in this lesson."));
    ct.getTextStyle().setFontFamily(CONFIG.FONT_FAMILY).setFontSize(14).setForegroundColor(CONFIG.COLOR_BODY_TEXT);
    ct.getRange(0, 20).getTextStyle().setBold(true).setForegroundColor(CONFIG.COLOR_NAVY).setFontSize(16);
    
    var langCard = this.insertCardWithShadow(slide, 500, 85, 410, 240, CONFIG.COLOR_WHITE, CONFIG.COLOR_AMBER, 2);
    var lt = langCard.getText();
    lt.setText("🗣️ Language Objective:\n\n" + (data.languageObjective || "I can discuss my reasoning using vocabulary terms."));
    lt.getTextStyle().setFontFamily(CONFIG.FONT_FAMILY).setFontSize(14).setForegroundColor(CONFIG.COLOR_BODY_TEXT);
    lt.getRange(0, 21).getTextStyle().setBold(true).setForegroundColor(CONFIG.COLOR_NAVY).setFontSize(16);
    
    // Chevron-style Learning Path Agenda Map
    var steps = ["1. Launch", "2. Explore", "3. Vocab", "4. Guided", "5. Practice", "6. Exit"];
    for (var s = 0; s < steps.length; s++) {
      var badgeX = 50 + (s * 150);
      var badge = slide.insertShape(SlidesApp.ShapeType.ROUND_RECTANGLE, badgeX, 350, 115, 45);
      badge.getFill().setSolidFill(s === 0 ? CONFIG.COLOR_TEAL : CONFIG.COLOR_TEAL_LIGHT);
      badge.getBorder().setTransparent();
      var bText = badge.getText();
      bText.setText(steps[s]);
      bText.getTextStyle().setFontFamily(CONFIG.FONT_FAMILY).setFontSize(11).setBold(true)
           .setForegroundColor(s === 0 ? CONFIG.COLOR_WHITE : CONFIG.COLOR_NAVY);
      bText.getParagraphStyle().setParagraphAlignment(SlidesApp.ParagraphAlignment.CENTER);
      
      // Draw arrow indicator except for last step
      if (s < steps.length - 1) {
        var arrow = slide.insertShape(SlidesApp.ShapeType.RIGHT_ARROW, badgeX + 120, 362, 25, 20);
        arrow.getFill().setSolidFill(CONFIG.COLOR_AMBER);
        arrow.getBorder().setTransparent();
      }
    }
    
    // Draggable Progress Stars in a progress container on the right
    var progressLabel = slide.insertShape(SlidesApp.ShapeType.RECTANGLE, 660, 422, 200, 20);
    progressLabel.getFill().setTransparent();
    progressLabel.getBorder().setTransparent();
    progressLabel.getText().setText("⭐ Drag star to track your progress:").getTextStyle().setFontFamily(CONFIG.FONT_FAMILY).setFontSize(9).setBold(true).setForegroundColor(CONFIG.COLOR_GRAY);
    
    var progressStar = slide.insertShape(SlidesApp.ShapeType.STAR_5, 875, 418, 24, 24);
    progressStar.getFill().setSolidFill(CONFIG.COLOR_AMBER);
    progressStar.getBorder().setTransparent();
  },

  /** SLIDE 2: Be Curious (Notice & Wonder) */
  buildSlide2_BeCurious: function(presentation, lessonId, data) {
    var slide = presentation.appendSlide(SlidesApp.PredefinedLayout.BLANK);
    this.applySlideTheme(slide, "BE CURIOUS · LAUNCH PROBLEM", "Observe the scenario. What do you Notice and Wonder?");
    
    // Left: Realistic Wood Clipboard
    var clipPaper = this.insertClipboard(slide, 50, 85, 410, 320);
    
    var scenarioText = "";
    if (data.turnAndTalk && data.turnAndTalk.length > 0) {
      scenarioText = data.turnAndTalk[0].question || "Read the scenario and prepare to share your observations.";
    } else {
      scenarioText = "Discuss the math concepts presented in this lesson with your partner.";
    }
    
    var leftText = clipPaper.getText();
    leftText.setText("📋 Launch Problem:\n\n" + scenarioText);
    leftText.getTextStyle().setFontFamily(CONFIG.FONT_FAMILY).setFontSize(13).setForegroundColor(CONFIG.COLOR_BODY_TEXT);
    leftText.getRange(0, 18).getTextStyle().setBold(true).setForegroundColor(CONFIG.COLOR_NAVY).setFontSize(15);
    
    // Right Top: Notice Sticky Note
    var noticeBox = this.insertStickyNote(slide, 500, 85, 410, 145, "#FFF5C3", -1.5);
    var noticeStems = "";
    if (data.turnAndTalk && data.turnAndTalk.length > 0 && data.turnAndTalk[0].stems) {
      var stems = data.turnAndTalk[0].stems;
      noticeStems = stems.map(function(s) { return "✍️ " + (s.en || s); }).join("\n");
    } else {
      noticeStems = "✍️ I notice that...\n✍️ Another observation is...";
    }
    
    var noticeText = noticeBox.getText();
    noticeText.setText("👀 Things I Notice:\n" + noticeStems + "\n\n[Double-click to type observations here...]");
    noticeText.getTextStyle().setFontFamily(CONFIG.FONT_FAMILY).setFontSize(11).setForegroundColor(CONFIG.COLOR_BODY_TEXT);
    noticeText.getRange(0, 18).getTextStyle().setBold(true).setForegroundColor(CONFIG.COLOR_NAVY).setFontSize(13);
    
    // Right Bottom: Wonder Sticky Note
    var wonderBox = this.insertStickyNote(slide, 500, 260, 410, 145, "#FCDCD4", 1.5);
    var wonderStems = "";
    if (data.turnAndTalk && data.turnAndTalk.length > 0 && data.turnAndTalk[0].extendStems) {
      var extStems = data.turnAndTalk[0].extendStems;
      wonderStems = extStems.map(function(s) { return "❓ " + (s.en || s); }).join("\n");
    } else if (data.turnAndTalk && data.turnAndTalk.length > 0 && data.turnAndTalk[0].extend) {
      wonderStems = "❓ " + data.turnAndTalk[0].extend;
    } else {
      wonderStems = "❓ I wonder what would happen if...\n❓ How relates to...";
    }
    
    var wonderText = wonderBox.getText();
    wonderText.setText("💭 Things I Wonder:\n" + wonderStems + "\n\n[Double-click to type questions here...]");
    wonderText.getTextStyle().setFontFamily(CONFIG.FONT_FAMILY).setFontSize(11).setForegroundColor(CONFIG.COLOR_BODY_TEXT);
    wonderText.getRange(0, 19).getTextStyle().setBold(true).setForegroundColor(CONFIG.COLOR_NAVY).setFontSize(13);
  },

  /** SLIDE 3: Vocabulary & Reference */
  buildSlide3_Vocabulary: function(presentation, lessonId, data) {
    var slide = presentation.appendSlide(SlidesApp.PredefinedLayout.BLANK);
    this.applySlideTheme(slide, "KEY VOCABULARY & FLASHCARDS", "Master these key terms to support your math talk.");
    
    var vocabTerms = [];
    if (data.turnAndTalk && data.turnAndTalk.length > 0 && data.turnAndTalk[0].wordBank) {
      vocabTerms = data.turnAndTalk[0].wordBank;
    } else {
      vocabTerms = ["ratio", "relationship", "value", "quantity"];
    }
    
    var positions = [
      { x: 50, y: 85 }, { x: 500, y: 85 },
      { x: 50, y: 240 }, { x: 500, y: 240 }
    ];
    
    for (var i = 0; i < 4; i++) {
      var term = vocabTerms[i] || "Math Term";
      var pos = positions[i];
      
      // Flashcard
      var card = this.insertCardWithShadow(slide, pos.x, pos.y, 410, 140, CONFIG.COLOR_WHITE, CONFIG.COLOR_GRAY, 1);
      
      // Flashcard color tab
      var tab = slide.insertShape(SlidesApp.ShapeType.RECTANGLE, pos.x, pos.y, 120, 15);
      tab.getFill().setSolidFill(CONFIG.COLOR_TEAL);
      tab.getBorder().setTransparent();
      
      // Push pin at the top center of card
      this.insertPushPin(slide, pos.x + 205 - 7, pos.y - 7);
      
      var def = "Verbalize this concept using lesson examples.";
      if (term.toLowerCase().indexOf("prime") > -1) def = "A number greater than 1 that only has factors 1 and itself.";
      if (term.toLowerCase().indexOf("composite") > -1) def = "A number that has factors other than 1 and itself.";
      if (term.toLowerCase().indexOf("factor") > -1) def = "A number multiplied by another number to get a product.";
      if (term.toLowerCase().indexOf("ratio") > -1) def = "A comparison of two quantities by division.";
      
      var cardText = card.getText();
      cardText.setText("\n📝 " + term.toUpperCase() + "\n" + def);
      cardText.getTextStyle().setFontFamily(CONFIG.FONT_FAMILY).setFontSize(11).setForegroundColor(CONFIG.COLOR_BODY_TEXT);
      
      var termLength = term.length + 4;
      cardText.getRange(0, termLength).getTextStyle().setBold(true).setForegroundColor(CONFIG.COLOR_NAVY).setFontSize(13);
    }
    
    // Core Reference Flow Diagram at the bottom
    var flowBox = slide.insertShape(SlidesApp.ShapeType.ROUND_RECTANGLE, 50, 395, 860, 40);
    flowBox.getFill().setSolidFill(CONFIG.COLOR_TEAL_LIGHT);
    flowBox.getBorder().setTransparent();
    var flowText = flowBox.getText();
    flowText.setText("💡 Core Flow: INPUT (Independent Variable) ➔ PROCESS (Equation/Rule) ➔ OUTPUT (Dependent Variable)");
    flowText.getTextStyle().setFontFamily(CONFIG.FONT_FAMILY).setFontSize(11).setBold(true).setForegroundColor(CONFIG.COLOR_NAVY);
    flowText.getParagraphStyle().setParagraphAlignment(SlidesApp.ParagraphAlignment.CENTER);
    
    // Draggable Progress Checkmark
    var checkLabel = slide.insertShape(SlidesApp.ShapeType.RECTANGLE, 50, 440, 220, 20);
    checkLabel.getFill().setTransparent();
    checkLabel.getBorder().setTransparent();
    checkLabel.getText().setText("✏️ Drag checks to mark mastered terms:").getTextStyle().setFontFamily(CONFIG.FONT_FAMILY).setFontSize(9).setBold(true).setForegroundColor(CONFIG.COLOR_GRAY);
    
    for (var c = 0; c < 4; c++) {
      var check = slide.insertShape(SlidesApp.ShapeType.OVAL, 300 + (c * 40), 438, 22, 22);
      check.getFill().setSolidFill(CONFIG.COLOR_TEAL_LIGHT);
      check.getBorder().getLineFill().setSolidFill(CONFIG.COLOR_TEAL);
      check.getBorder().setWeight(1.5);
      var ckText = check.getText();
      ckText.setText("✔️");
      ckText.getTextStyle().setFontSize(11).setBold(true).setForegroundColor(CONFIG.COLOR_TEAL);
      ckText.getParagraphStyle().setParagraphAlignment(SlidesApp.ParagraphAlignment.CENTER);
    }
  },

  /** SLIDE 4: Visual Model (Using Programmatic SVG insert & Draggable Tray) */
  buildSlide4_VisualModel: function(presentation, lessonId, data) {
    var slide = presentation.appendSlide(SlidesApp.PredefinedLayout.BLANK);
    this.applySlideTheme(slide, "VISUAL MODELING WORKSPACE", "Draw, label, or build a mathematical representation.");
    
    // Workspace Whiteboard
    var board = this.insertCardWithShadow(slide, 50, 85, 600, 320, CONFIG.COLOR_WHITE, CONFIG.COLOR_NAVY, 4);
    var boardText = board.getText();
    boardText.setText("📐 Visual Model Workspace:\n");
    boardText.getTextStyle().setFontFamily(CONFIG.FONT_FAMILY).setFontSize(14).setBold(true).setForegroundColor(CONFIG.COLOR_NAVY);
    
    // Programmatic Visual Math SVG creation
    var svgString = this.generateMathVisualSvg(lessonId, data);
    
    try {
      var blob = Utilities.newBlob(svgString, "image/svg+xml", "visual-model.svg");
      var insertedImg = slide.insertImage(blob);
      insertedImg.setLeft(100);
      insertedImg.setTop(120);
      insertedImg.setWidth(500);
      insertedImg.setHeight(270);
      Logger.log("Successfully inserted widescreen visual math SVG.");
    } catch (err) {
      Logger.log("Failed to insert programmatic SVG: " + err.message + ". Fallback to text diagram.");
      var fallbackLabel = slide.insertShape(SlidesApp.ShapeType.ROUND_RECTANGLE, 150, 120, 400, 250);
      fallbackLabel.getFill().setSolidFill(CONFIG.COLOR_TEAL_LIGHT);
      fallbackLabel.getBorder().getLineFill().setSolidFill(CONFIG.COLOR_TEAL);
      var fallbackText = fallbackLabel.getText();
      fallbackText.setText("[Visual Math Model Grid]\n\n" + (data.contentObjective || "Math Diagram Workspace"));
      fallbackText.getTextStyle().setFontFamily(CONFIG.FONT_FAMILY).setFontSize(14).setForegroundColor(CONFIG.COLOR_NAVY);
      fallbackText.getParagraphStyle().setParagraphAlignment(SlidesApp.ParagraphAlignment.CENTER);
    }
    
    // Manipulatives Tray on the right
    var tray = this.insertCardWithShadow(slide, 680, 85, 230, 320, CONFIG.COLOR_TEAL_LIGHT, CONFIG.COLOR_TEAL, 2);
    var trayText = tray.getText();
    trayText.setText("🛠️ MANIPULATIVES TRAY\n");
    trayText.getTextStyle().setFontFamily(CONFIG.FONT_FAMILY).setFontSize(12).setBold(true).setForegroundColor(CONFIG.COLOR_NAVY);
    trayText.getParagraphStyle().setParagraphAlignment(SlidesApp.ParagraphAlignment.CENTER);
    
    // Add row labels
    var redLabel = slide.insertShape(SlidesApp.ShapeType.RECTANGLE, 690, 115, 210, 16);
    redLabel.getFill().setTransparent(); redLabel.getBorder().setTransparent();
    redLabel.getText().setText("🔴 Counters (Red)").getTextStyle().setFontFamily(CONFIG.FONT_FAMILY).setFontSize(9).setBold(true).setForegroundColor(CONFIG.COLOR_NAVY);
    
    var blueLabel = slide.insertShape(SlidesApp.ShapeType.RECTANGLE, 690, 180, 210, 16);
    blueLabel.getFill().setTransparent(); blueLabel.getBorder().setTransparent();
    blueLabel.getText().setText("🔵 Counters (Blue)").getTextStyle().setFontFamily(CONFIG.FONT_FAMILY).setFontSize(9).setBold(true).setForegroundColor(CONFIG.COLOR_NAVY);
    
    var blockLabel = slide.insertShape(SlidesApp.ShapeType.RECTANGLE, 690, 245, 210, 16);
    blockLabel.getFill().setTransparent(); blockLabel.getBorder().setTransparent();
    blockLabel.getText().setText("🟨 Unit Blocks").getTextStyle().setFontFamily(CONFIG.FONT_FAMILY).setFontSize(9).setBold(true).setForegroundColor(CONFIG.COLOR_NAVY);
    
    // Generate counters inside the tray in offset stacks
    for (var r = 0; r < 6; r++) {
      var red = slide.insertShape(SlidesApp.ShapeType.OVAL, 700 + (r * 22), 140, 24, 24);
      red.getFill().setSolidFill("#D9795D"); // Coral Red
      red.getBorder().getLineFill().setSolidFill(CONFIG.COLOR_NAVY);
      red.getBorder().setWeight(1);
      
      var blue = slide.insertShape(SlidesApp.ShapeType.OVAL, 700 + (r * 22), 205, 24, 24);
      blue.getFill().setSolidFill(CONFIG.COLOR_TEAL); // Teal
      blue.getBorder().getLineFill().setSolidFill(CONFIG.COLOR_NAVY);
      blue.getBorder().setWeight(1);
      
      var block = slide.insertShape(SlidesApp.ShapeType.ROUND_RECTANGLE, 700 + (r * 22), 270, 24, 24);
      block.getFill().setSolidFill(CONFIG.COLOR_AMBER); // Amber
      block.getBorder().getLineFill().setSolidFill(CONFIG.COLOR_NAVY);
      block.getBorder().setWeight(1);
      var bText = block.getText();
      bText.setText("1");
      bText.getTextStyle().setFontFamily(CONFIG.FONT_FAMILY).setFontSize(10).setBold(true).setForegroundColor(CONFIG.COLOR_NAVY);
      bText.getParagraphStyle().setParagraphAlignment(SlidesApp.ParagraphAlignment.CENTER);
    }
  },

  /** SLIDE 5: Guided Practice (TWR Lined Notebook Page) */
  buildSlide5_GuidedPractice: function(presentation, lessonId, data) {
    var slide = presentation.appendSlide(SlidesApp.PredefinedLayout.BLANK);
    this.applySlideTheme(slide, "GUIDED PRACTICE & WRITING", "Work together to solve this challenge and explain your steps.");
    
    // Left: Structured Notebook Card
    var leftBox = this.insertCardWithShadow(slide, 50, 85, 410, 320, CONFIG.COLOR_WHITE, CONFIG.COLOR_NAVY, 1.5);
    
    // Paper Clip icon representation
    var clip = slide.insertShape(SlidesApp.ShapeType.ROUND_RECTANGLE, 70, 75, 20, 30);
    clip.getFill().setSolidFill(CONFIG.COLOR_GRAY);
    clip.getBorder().setTransparent();
    
    var stem = "Verify your mathematical calculations with your teacher and partner.";
    if (data.turnAndTalk && data.turnAndTalk.length > 1) {
      stem = data.turnAndTalk[1].question || stem;
    }
    
    var leftText = leftBox.getText();
    leftText.setText("\n📖 Guided Challenge:\n\n" + stem);
    leftText.getTextStyle().setFontFamily(CONFIG.FONT_FAMILY).setFontSize(13).setForegroundColor(CONFIG.COLOR_BODY_TEXT);
    leftText.getRange(0, 20).getTextStyle().setBold(true).setForegroundColor(CONFIG.COLOR_NAVY).setFontSize(15);
    
    // Right: Ruled Notebook Spiral Card for Writing Stems
    var rightBox = this.insertNotebookCard(slide, 500, 85, 410, 320);
    
    // Lined rules inside the notebook sheet (shifted to not overlap spirals)
    for (var lineY = 145; lineY < 390; lineY += 24) {
      var line = slide.insertShape(SlidesApp.ShapeType.RECTANGLE, 550, lineY, 340, 1);
      line.getFill().setSolidFill("#E1EAEF");
      line.getBorder().setTransparent();
    }
    
    var stemsText = "";
    if (data.turnAndTalk && data.turnAndTalk.length > 1 && data.turnAndTalk[1].stems) {
      var stems = data.turnAndTalk[1].stems;
      stemsText = stems.map(function(s) { return "🔹 " + (s.en || s); }).join("\n\n");
    } else {
      stemsText = "🔹 First, I know that... because...\n\n🔹 This means that... so I can conclude...";
    }
    
    var rightText = rightBox.getText();
    rightText.setText("✍️ TWR Sentence Expansion:\n\n" + stemsText + "\n\nWorkspace: [Double-click to type response here...]");
    rightText.getTextStyle().setFontFamily(CONFIG.FONT_FAMILY).setFontSize(11).setForegroundColor(CONFIG.COLOR_BODY_TEXT);
    rightText.getRange(0, 26).getTextStyle().setBold(true).setForegroundColor(CONFIG.COLOR_NAVY).setFontSize(14);
    
    // Draggable semi-transparent highlighting strip
    var highlighter = slide.insertShape(SlidesApp.ShapeType.RECTANGLE, 50, 415, 150, 24);
    highlighter.getFill().setSolidFill("#F2C15B");
    highlighter.getFill().setAlpha(0.4);
    highlighter.getBorder().setTransparent();
    var hlText = highlighter.getText();
    hlText.setText("🖍️ Drag to highlight text");
    hlText.getTextStyle().setFontFamily(CONFIG.FONT_FAMILY).setFontSize(8).setBold(true).setForegroundColor(CONFIG.COLOR_NAVY);
    hlText.getParagraphStyle().setParagraphAlignment(SlidesApp.ParagraphAlignment.CENTER);
  },

  /** SLIDE 6: Interactive Activity A (Partner Speech Bubbles & Reactions) */
  buildSlide6_ActivityA: function(presentation, lessonId, data) {
    var slide = presentation.appendSlide(SlidesApp.PredefinedLayout.BLANK);
    this.applySlideTheme(slide, "INTERACTIVE WORKSHOP A", "Collaborate and communicate to solve the partner challenge.");
    
    // Partner A Speech Bubble Callout
    var aBox = slide.insertShape(SlidesApp.ShapeType.ROUNDED_RECTANGLE_CALLOUT, 50, 85, 410, 240);
    aBox.getFill().setSolidFill(CONFIG.COLOR_TEAL_LIGHT);
    aBox.getBorder().getLineFill().setSolidFill(CONFIG.COLOR_TEAL);
    aBox.getBorder().setWeight(2);
    var aText = aBox.getText();
    aText.setText("👥 Partner A:\n\nExplain how you can approach solving this problem. What steps will you perform first, and what tools will you use?\n\nPartner A Workspace: [Double-click to type here]");
    aText.getTextStyle().setFontFamily(CONFIG.FONT_FAMILY).setFontSize(13).setForegroundColor(CONFIG.COLOR_BODY_TEXT);
    aText.getRange(0, 13).getTextStyle().setBold(true).setForegroundColor(CONFIG.COLOR_NAVY).setFontSize(15);
    
    // Partner B Speech Bubble Callout
    var bBox = slide.insertShape(SlidesApp.ShapeType.ROUNDED_RECTANGLE_CALLOUT, 500, 85, 410, 240);
    bBox.getFill().setSolidFill(CONFIG.COLOR_WHITE);
    bBox.getBorder().getLineFill().setSolidFill(CONFIG.COLOR_NAVY);
    bBox.getBorder().setWeight(2);
    var bText = bBox.getText();
    bText.setText("👥 Partner B:\n\nRespond to your partner's explanation. Do you agree with their approach? How would you verify their final calculations?\n\nPartner B Workspace: [Double-click to type here]");
    bText.getTextStyle().setFontFamily(CONFIG.FONT_FAMILY).setFontSize(13).setForegroundColor(CONFIG.COLOR_BODY_TEXT);
    bText.getRange(0, 13).getTextStyle().setBold(true).setForegroundColor(CONFIG.COLOR_NAVY).setFontSize(15);
    
    // Feedback Reaction Emojis
    var feedbackLabel = slide.insertShape(SlidesApp.ShapeType.RECTANGLE, 50, 345, 250, 20);
    feedbackLabel.getFill().setTransparent();
    feedbackLabel.getBorder().setTransparent();
    feedbackLabel.getText().setText("💬 Drag emojis below to give feedback:").getTextStyle().setFontFamily(CONFIG.FONT_FAMILY).setFontSize(9).setBold(true).setItalic(true).setForegroundColor(CONFIG.COLOR_GRAY);
    
    var emojis = ["👍", "🤔", "❤️", "⭐"];
    for (var eIdx = 0; eIdx < emojis.length; eIdx++) {
      var emojiShape = slide.insertShape(SlidesApp.ShapeType.OVAL, 50 + (eIdx * 45), 370, 32, 32);
      emojiShape.getFill().setSolidFill(CONFIG.COLOR_WHITE);
      emojiShape.getBorder().getLineFill().setSolidFill(CONFIG.COLOR_GRAY);
      emojiShape.getBorder().setWeight(1);
      var emText = emojiShape.getText();
      emText.setText(emojis[eIdx]);
      emText.getTextStyle().setFontSize(14);
      emText.getParagraphStyle().setParagraphAlignment(SlidesApp.ParagraphAlignment.CENTER);
    }
  },

  /** SLIDE 7: Interactive Activity B (Error Analysis Diagnostic Clipboard) */
  buildSlide7_ActivityB: function(presentation, lessonId, data) {
    var slide = presentation.appendSlide(SlidesApp.PredefinedLayout.BLANK);
    this.applySlideTheme(slide, "INTERACTIVE WORKSHOP B · ERROR ANALYSIS", "Analyze the math mistake. Find it, explain it, and fix it.");
    
    // Left: Tilted struggling student's paper block
    var leftBox = this.insertStickyNote(slide, 50, 85, 410, 320, "#FFF9E6", -1.5);
    var leftText = leftBox.getText();
    leftText.setText("⚠️ Incorrect Student Work:\n\n" +
                      "A student claims that when solving this problem, they should add the values instead of multiplying.\n\n" +
                      "For example: 'To evaluate the lesson values, I just combine the base parts.'\n\n" +
                      "Why is this reasoning incorrect?");
    leftText.getTextStyle().setFontFamily(CONFIG.FONT_FAMILY).setFontSize(12).setForegroundColor(CONFIG.COLOR_BODY_TEXT);
    leftText.getRange(0, 26).getTextStyle().setBold(true).setForegroundColor(CONFIG.COLOR_NAVY).setFontSize(14);
    
    // Right: Math Doctor's Diagnostic Report clipboard
    var clipPaper = this.insertClipboard(slide, 500, 85, 410, 320);
    
    var rightText = clipPaper.getText();
    rightText.setText("📋 Diagnostic Report:\n\n" +
                    "1. What is the actual math mistake?\n" +
                    "[Double-click to type diagnostic here...]\n\n" +
                    "2. Show the correct mathematical steps:\n" +
                    "[Double-click to type correct work here...]");
    rightText.getTextStyle().setFontFamily(CONFIG.FONT_FAMILY).setFontSize(12).setForegroundColor(CONFIG.COLOR_BODY_TEXT);
    rightText.getRange(0, 22).getTextStyle().setBold(true).setForegroundColor(CONFIG.COLOR_NAVY).setFontSize(14);
    
    // Draggable rubber stamps
    var stampsLabel = slide.insertShape(SlidesApp.ShapeType.RECTANGLE, 50, 415, 120, 20);
    stampsLabel.getFill().setTransparent();
    stampsLabel.getBorder().setTransparent();
    stampsLabel.getText().setText("🏷️ Stamp your labels:").getTextStyle().setFontFamily(CONFIG.FONT_FAMILY).setFontSize(9).setBold(true).setForegroundColor(CONFIG.COLOR_GRAY);
    
    var stamp1 = this.insertRubberStamp(slide, 200, 412, "❌ ERROR", "#D9795D", -8);
    var stamp2 = this.insertRubberStamp(slide, 290, 412, "✅ FIXED", CONFIG.COLOR_TEAL, 6);
  },

  /** SLIDE 8: Real-World Connection (Field Journal Magazine Style) */
  buildSlide8_RealWorld: function(presentation, lessonId, data) {
    var slide = presentation.appendSlide(SlidesApp.PredefinedLayout.BLANK);
    this.applySlideTheme(slide, "REAL-WORLD CONNECTION · MATH IN ACTION", "How is this math useful outside of the classroom?");
    
    var connText = "Math is used by engineers, designers, and scientists daily to model systems and solve problems.";
    if (data.projects && data.projects.length > 0) {
      var proj = data.projects[0];
      connText = (proj.title || "Real-world project") + ": " + (proj.desc || connText);
    }
    
    // Left: Polaroid Photograph frame
    var photoFrame = this.insertCardWithShadow(slide, 50, 85, 320, 320, CONFIG.COLOR_WHITE, CONFIG.COLOR_GRAY, 1.5);
    
    // Sticky masking tape shape at the top center of polaroid
    var tape = slide.insertShape(SlidesApp.ShapeType.RECTANGLE, 150, 75, 110, 20);
    tape.getFill().setSolidFill(CONFIG.COLOR_AMBER);
    tape.getFill().setAlpha(0.6); // semi-transparent masking tape look
    tape.getBorder().setTransparent();
    tape.setRotation(-4);
    
    // Insert SVG inside the photo frame
    var svgString = this.generateMathVisualSvg(lessonId, data);
    try {
      var blob = Utilities.newBlob(svgString, "image/svg+xml", "wild-photo.svg");
      var img = slide.insertImage(blob);
      img.setLeft(70);
      img.setTop(105);
      img.setWidth(280);
      img.setHeight(210);
    } catch (e) {
      var placeholder = slide.insertShape(SlidesApp.ShapeType.RECTANGLE, 70, 105, 280, 210);
      placeholder.getFill().setSolidFill(CONFIG.COLOR_TEAL_LIGHT);
      placeholder.getBorder().setTransparent();
    }
    
    var caption = slide.insertShape(SlidesApp.ShapeType.RECTANGLE, 50, 325, 320, 35);
    caption.getFill().setTransparent();
    caption.getBorder().setTransparent();
    var capText = caption.getText();
    capText.setText("📸 Field Photo Model");
    capText.getTextStyle().setFontFamily(CONFIG.FONT_FAMILY).setFontSize(12).setBold(true).setItalic(true).setForegroundColor(CONFIG.COLOR_GRAY);
    capText.getParagraphStyle().setParagraphAlignment(SlidesApp.ParagraphAlignment.CENTER);
    
    // Right: Field Journal Notebook Card
    var journal = this.insertNotebookCard(slide, 400, 85, 510, 320);
    
    // Rules inside field journal
    for (var lineY = 145; lineY < 390; lineY += 24) {
      var line = slide.insertShape(SlidesApp.ShapeType.RECTANGLE, 450, lineY, 440, 1);
      line.getFill().setSolidFill("#E1EAEF");
      line.getBorder().setTransparent();
    }
    
    var jText = journal.getText();
    jText.setText("\n   🌍 Context Scenario:\n   " + connText + "\n\n   ✍️ Field Journal Reflection:\n" +
                  "   • This math applies to this scenario because...\n" +
                  "   • Understanding this concept helps me solve real-world problems like...\n\n" +
                  "   [Double-click to type journal entry here...]");
    jText.getTextStyle().setFontFamily(CONFIG.FONT_FAMILY).setFontSize(12).setForegroundColor(CONFIG.COLOR_BODY_TEXT);
    jText.getRange(0, 24).getTextStyle().setBold(true).setForegroundColor(CONFIG.COLOR_NAVY).setFontSize(14);
    var reflectionIdx = jText.asString().indexOf("✍️ Field Journal Reflection:");
    if (reflectionIdx !== -1) {
      jText.getRange(reflectionIdx, reflectionIdx + 29).getTextStyle().setBold(true).setForegroundColor(CONFIG.COLOR_NAVY).setFontSize(14);
    }
  },

  /** SLIDE 9: Reflection + Exit Ticket Tablet Screen */
  buildSlide9_Reflection: function(presentation, lessonId, data) {
    var slide = presentation.appendSlide(SlidesApp.PredefinedLayout.BLANK);
    this.applySlideTheme(slide, "REFLECTION & EXIT TICKET", "Summarize what you learned and complete the exit problem.");
    
    // Left: Mint Checklist Sticky Note
    var leftBox = this.insertStickyNote(slide, 50, 85, 410, 320, "#E6F5F2", -1);
    var leftText = leftBox.getText();
    leftText.setText("🤔 3-2-1 Reflection:\n\n" +
                  "✔️ 3 Things I learned today:\n" +
                  "   1. [Type here] 2. [Type here] 3. [Type here]\n\n" +
                  "✔️ 2 Connections I made:\n" +
                  "   1. [Type here] 2. [Type here]\n\n" +
                  "✔️ 1 Question I still have:\n" +
                  "   1. [Type here]");
    leftText.getTextStyle().setFontFamily(CONFIG.FONT_FAMILY).setFontSize(11).setForegroundColor(CONFIG.COLOR_BODY_TEXT);
    leftText.getRange(0, 20).getTextStyle().setBold(true).setForegroundColor(CONFIG.COLOR_NAVY).setFontSize(14);
    
    // Right: Exit Ticket inside a Tablet Outline
    var tabletBorder = slide.insertShape(SlidesApp.ShapeType.ROUND_RECTANGLE, 500, 85, 410, 240);
    tabletBorder.getFill().setSolidFill("#1C1A17"); // black tablet frame
    tabletBorder.getBorder().setTransparent();
    
    var tabletScreen = slide.insertShape(SlidesApp.ShapeType.RECTANGLE, 512, 95, 386, 220);
    tabletScreen.getFill().setSolidFill(CONFIG.COLOR_WHITE);
    tabletScreen.getBorder().setTransparent();
    
    var exitText = tabletScreen.getText();
    exitText.setText("📱 DIGITAL EXIT TICKET\n\nApply your learning to solve this final question:\n\nEvaluate the prime parts or relationship of the lesson values.\n\nWorkspace: [Double-click to type response here]");
    exitText.getTextStyle().setFontFamily(CONFIG.FONT_FAMILY).setFontSize(11).setForegroundColor(CONFIG.COLOR_BODY_TEXT);
    exitText.getRange(0, 22).getTextStyle().setBold(true).setForegroundColor(CONFIG.COLOR_NAVY).setFontSize(13);
    
    // Self-Assessment Scale under tablet
    var scaleBox = slide.insertShape(SlidesApp.ShapeType.ROUND_RECTANGLE, 500, 335, 410, 70);
    scaleBox.getFill().setSolidFill(CONFIG.COLOR_TEAL_LIGHT);
    scaleBox.getBorder().setTransparent();
    var scaleText = scaleBox.getText();
    scaleText.setText("🚦 Self-Assessment: Rate your learning level:\n              🔴 Struggling      🟡 Getting There      🟢 Mastered");
    scaleText.getTextStyle().setFontFamily(CONFIG.FONT_FAMILY).setFontSize(10).setBold(true).setForegroundColor(CONFIG.COLOR_NAVY);
    
    // Self-assessment color dot indicators
    var redDot = slide.insertShape(SlidesApp.ShapeType.OVAL, 530, 370, 20, 20);
    redDot.getFill().setSolidFill("#FF4D4D");
    redDot.getBorder().setTransparent();
    
    var yellowDot = slide.insertShape(SlidesApp.ShapeType.OVAL, 665, 370, 20, 20);
    yellowDot.getFill().setSolidFill("#FFD700");
    yellowDot.getBorder().setTransparent();
    
    var greenDot = slide.insertShape(SlidesApp.ShapeType.OVAL, 805, 370, 20, 20);
    greenDot.getFill().setSolidFill("#4CAF50");
    greenDot.getBorder().setTransparent();
    
    // Draggable Highlight Ring (placed to the side)
    var ring = slide.insertShape(SlidesApp.ShapeType.OVAL, 875, 355, 26, 26);
    ring.getFill().setTransparent();
    ring.getBorder().getLineFill().setSolidFill(CONFIG.COLOR_NAVY); // Navy highlight ring
    ring.getBorder().setWeight(3);
  },

  /** Programmatic Visual Math SVG Generator.
   * Generates a clean math grid or coordinate system.
   * Returns a raw SVG string.
   */
  generateMathVisualSvg: function(lessonId, data) {
    var width = 300;
    var height = 200;
    
    var svg = '<svg xmlns="http://www.w3.org/2000/svg" width="' + width + '" height="' + height + '" style="background:white">';
    
    // Draw outer grid outline
    svg += '<rect x="5" y="5" width="' + (width - 10) + '" height="' + (height - 10) + '" fill="#F9FBFC" stroke="' + CONFIG.COLOR_TEAL + '" stroke-width="2"/>';
    
    // Draw Grid Lines (10px increments)
    for (var x = 20; x < width - 10; x += 30) {
      svg += '<line x1="' + x + '" y1="5" x2="' + x + '" y2="' + (height - 5) + '" stroke="#E1EAEF" stroke-width="1"/>';
    }
    for (var y = 20; y < height - 10; y += 30) {
      svg += '<line x1="5" y1="' + y + '" x2="' + (width - 5) + '" y2="' + y + '" stroke="#E1EAEF" stroke-width="1"/>';
    }
    
    // Draw lesson-type custom structures
    var isGeometry = (data.standard && data.standard.indexOf(".G.") > -1) || lessonId.startsWith("5-") || lessonId.startsWith("10-");
    var isProportional = (data.standard && data.standard.indexOf(".RP.") > -1) || lessonId.startsWith("3-") || lessonId.startsWith("4-");
    
    if (isGeometry) {
      // Area Triangle/Parallelogram representation
      svg += '<polygon points="50,150 150,50 250,150" fill="' + CONFIG.COLOR_TEAL_LIGHT + '" stroke="' + CONFIG.COLOR_NAVY + '" stroke-width="2"/>';
      // Base label line
      svg += '<line x1="50" y1="165" x2="250" y2="165" stroke="' + CONFIG.COLOR_NAVY + '" stroke-width="1.5" stroke-dasharray="3,3"/>';
      svg += '<text x="140" y="180" font-family="Lexend, Calibri, sans-serif" font-size="12" fill="' + CONFIG.COLOR_NAVY + '" font-weight="bold">Base (b)</text>';
      // Height dashed line
      svg += '<line x1="150" y1="50" x2="150" y2="150" stroke="' + CONFIG.COLOR_AMBER + '" stroke-width="1.5" stroke-dasharray="4,4"/>';
      svg += '<text x="160" y="100" font-family="Lexend, Calibri, sans-serif" font-size="12" fill="' + CONFIG.COLOR_NAVY + '" font-weight="bold">Height (h)</text>';
    } else if (isProportional) {
      // Coordinate grid quadrant representation
      svg += '<line x1="40" y1="160" x2="260" y2="160" stroke="' + CONFIG.COLOR_NAVY + '" stroke-width="2"/>'; // X axis
      svg += '<line x1="50" y1="30" x2="50" y2="170" stroke="' + CONFIG.COLOR_NAVY + '" stroke-width="2"/>'; // Y axis
      // Plot arrows
      svg += '<line x1="260" y1="160" x2="255" y2="155" stroke="' + CONFIG.COLOR_NAVY + '" stroke-width="2"/>';
      svg += '<line x1="260" y1="160" x2="255" y2="165" stroke="' + CONFIG.COLOR_NAVY + '" stroke-width="2"/>';
      svg += '<line x1="50" y1="30" x2="45" y2="35" stroke="' + CONFIG.COLOR_NAVY + '" stroke-width="2"/>';
      svg += '<line x1="50" y1="30" x2="55" y2="35" stroke="' + CONFIG.COLOR_NAVY + '" stroke-width="2"/>';
      // Axis labels
      svg += '<text x="240" y="180" font-family="Lexend, Calibri, sans-serif" font-size="11" fill="' + CONFIG.COLOR_NAVY + '" font-weight="bold">Input (x)</text>';
      svg += '<text x="15" y="45" font-family="Lexend, Calibri, sans-serif" font-size="11" fill="' + CONFIG.COLOR_NAVY + '" font-weight="bold">Output (y)</text>';
      // Linear plot line
      svg += '<line x1="50" y1="160" x2="220" y2="60" stroke="' + CONFIG.COLOR_AMBER + '" stroke-width="3"/>';
      svg += '<circle cx="135" cy="110" r="4" fill="' + CONFIG.COLOR_TEAL + '"/>';
      svg += '<circle cx="220" cy="60" r="4" fill="' + CONFIG.COLOR_TEAL + '"/>';
    } else {
      // General Number Line representation
      svg += '<line x1="30" y1="100" x2="270" y2="100" stroke="' + CONFIG.COLOR_NAVY + '" stroke-width="2"/>';
      // Arrows
      svg += '<line x1="30" y1="100" x2="38" y2="94" stroke="' + CONFIG.COLOR_NAVY + '" stroke-width="2"/>';
      svg += '<line x1="30" y1="100" x2="38" y2="106" stroke="' + CONFIG.COLOR_NAVY + '" stroke-width="2"/>';
      svg += '<line x1="270" y1="100" x2="262" y2="94" stroke="' + CONFIG.COLOR_NAVY + '" stroke-width="2"/>';
      svg += '<line x1="270" y1="100" x2="262" y2="106" stroke="' + CONFIG.COLOR_NAVY + '" stroke-width="2"/>';
      // Ticks and labels
      var ticks = [60, 100, 140, 180, 220];
      var labels = ["-2", "-1", "0", "1", "2"];
      for (var t = 0; t < ticks.length; t++) {
        svg += '<line x1="' + ticks[t] + '" y1="92" x2="' + ticks[t] + '" y2="108" stroke="' + CONFIG.COLOR_NAVY + '" stroke-width="1.5"/>';
        svg += '<text x="' + (ticks[t] - 4) + '" y="' + (125) + '" font-family="Lexend, Calibri, sans-serif" font-size="11" fill="' + CONFIG.COLOR_NAVY + '" font-weight="bold">' + labels[t] + '</text>';
      }
      // Highlight dot
      svg += '<circle cx="180" cy="100" r="5" fill="' + CONFIG.COLOR_TEAL + '" stroke="' + CONFIG.COLOR_NAVY + '" stroke-width="1"/>';
    }
    
    svg += '</svg>';
    return svg;
  }
};

// ═══════════════════════════════════════════════════════════════════
// CONTROLLER & ROUTER LAYER
// ═══════════════════════════════════════════════════════════════════

/** Entry point for Web App GET requests. */
function doGet(e) {
  var p = (e && e.parameter) || {};
  
  // Explicit State machine mapping
  var state = "INITIAL";
  if (p.selftest === "1") {
    state = "SELF_TEST";
  } else if (p.debug === "1") {
    state = "DEBUG_SELF_TEST";
  } else if (p.geturls === "1") {
    state = "GET_URLS";
  } else if (p.generateall === "1") {
    state = "GENERATE_ALL";
  } else if (p.lesson) {
    state = "GENERATE_SLIDES";
  }
  
  Logger.log("State Transition: " + state);
  
  try {
    switch (state) {
      case "SELF_TEST":
        var result = selfTest();
        return renderHtmlOutput_("🧪 Self Test Results", "<h3>Self-Test Executed Successfully</h3><pre>" + result + "</pre>");
        
      case "DEBUG_SELF_TEST":
        var result = debugSelfTest(p);
        return ContentService.createTextOutput(result).setMimeType(ContentService.MimeType.TEXT);
        
      case "GET_URLS":
        var files = DriveApp.getFilesByName("google-slides-urls.json");
        if (files.hasNext()) {
          var content = files.next().getBlob().getDataAsString();
          return ContentService.createTextOutput(content).setMimeType(ContentService.MimeType.JSON);
        }
        return ContentService.createTextOutput("{}").setMimeType(ContentService.MimeType.JSON);
        
      case "GENERATE_ALL":
        generateAllSlides();
        return renderHtmlOutput_("🚀 Bulk Generation Complete", "<h3>Bulk Slide Generation Completed Natively</h3><p>The script finished running. Please query the URL list to retrieve the data.</p>");
        
      case "GENERATE_SLIDES":
        var lessonId = String(p.lesson).trim();
        var data = Repository.fetchLessonConfig(lessonId);
        var slidesUrl = Service.createLessonSlides(lessonId, data);
        
        return renderSuccessHtml_(lessonId, data.title || "Lesson presentation", slidesUrl);
        
      case "INITIAL":
      default:
        return renderInitialUi_();
    }
  } catch (err) {
    Logger.log("ERROR: " + err.message);
    return renderErrorHtml_(err.message);
  }
}

// ═══════════════════════════════════════════════════════════════════
// UI & HTML RENDERING LAYER
// ═══════════════════════════════════════════════════════════════════

/** Renders standard HTML dashboard wrapper. */
function renderHtmlOutput_(title, bodyContentHTML) {
  var html = "<!DOCTYPE html><html><head><meta charset='utf-8'/><title>" + title + "</title>" +
             "<style>" +
             "body { font-family:'Segoe UI',sans-serif; background:#F7F4EC; color:#24323F; padding:40px; margin:0; }" +
             ".container { max-width:600px; margin:0 auto; background:#FFFFFF; border:1px solid #D7E2ED; border-radius:14px; padding:32px; box-shadow:0 4px 20px rgba(0,0,0,0.05); }" +
             "h2 { color:#17324D; margin-top:0; font-weight:800; }" +
             "p { line-height:1.6; font-size:15px; }" +
             ".btn { display:inline-block; padding:12px 24px; background:#1FA6A2; color:#FFFFFF; text-decoration:none; border-radius:8px; font-weight:600; text-align:center; transition:background 0.2s; }" +
             ".btn:hover { background:#17324D; }" +
             "pre { background:#F5F7FA; padding:16px; border-radius:8px; font-size:12px; overflow-x:auto; }" +
             ".footer { text-align:center; margin-top:24px; font-size:12px; color:#8A96A3; }" +
             "</style></head><body>" +
             "<div class='container'>" +
             "<h2>Neft Teacher · Google Slides</h2>" +
             bodyContentHTML +
             "</div>" +
             "<div class='footer'>Created with EduWonderLab Toolchain</div>" +
             "</body></html>";
  return ContentService.createTextOutput(html).setMimeType(ContentService.MimeType.HTML);
}

/** Renders initial dashboard landing view. */
function renderInitialUi_() {
  var content = "<p>Welcome to the <strong>Google Slides Web App Generator</strong>. This service dynamically extracts curriculum metadata from the lesson config JSON templates and automatically compiles them into custom, editable Google Slides presentations inside your Google Drive.</p>" +
                "<p>To launch slides creation, append <code>?lesson=LESSON_ID</code> to this URL (e.g. <code>?lesson=1-1</code>).</p>" +
                "<div style='margin-top:24px;'><a class='btn' href='?selftest=1'>Run System Self-Test 🧪</a></div>";
  return renderHtmlOutput_("Slides Web App", content);
}

/** Renders success details card with button to open Slides directly. */
function renderSuccessHtml_(lessonId, lessonTitle, url) {
  var content = "<div style='text-align:center; padding:16px 0;'>" +
                "<div style='font-size:48px; margin-bottom:16px;'>🎉</div>" +
                "<h3>Lesson " + lessonId + " Slides Created!</h3>" +
                "<p style='margin-bottom:24px;'><strong>Title:</strong> " + lessonTitle + "</p>" +
                "<a class='btn' href='" + url + "' target='_blank'>Open in Google Slides ➔</a>" +
                "<p style='font-size:12px; color:#8A96A3; margin-top:16px;'>The presentation is saved in the root of your Google Drive.</p>" +
                "</div>";
  return renderHtmlOutput_("Slides Created Successfully", content);
}

/** Renders clean error report. */
function renderErrorHtml_(errorMsg) {
  var content = "<div style='color:#D9795D;'>" +
                "<h3>⚠️ Slide Generation Failed</h3>" +
                "<p>The slides generator encountered an error while processing your request:</p>" +
                "<pre>" + errorMsg + "</pre>" +
                "<p style='color:#24323F; margin-top:24px;'><a class='btn' href='?'>Back to Dashboard</a></p>" +
                "</div>";
  return renderHtmlOutput_("Generation Error", content);
}

// ═══════════════════════════════════════════════════════════════════
// SELF-TEST LAYER
// ═══════════════════════════════════════════════════════════════════

/** Self-Test routine checking data pipeline integrity. */
function selfTest() {
  Logger.log("Starting full self-test...");
  validateConfig();
  
  // Construct a Mock Lesson data structure
  var mockData = {
    title: "Self-Test Prime Numbers",
    unit: 1,
    lesson: 1,
    standard: "6.NS.4",
    contentObjective: "I can identify prime and composite numbers under self-test conditions.",
    languageObjective: "I can explain prime factors in a mock environment.",
    turnAndTalk: [
      {
        question: "Is the number 7 prime or composite, and how do you know?",
        stems: [
          { en: "7 is a ___ number because..." }
        ],
        extend: "What about the number 9?",
        extendStems: [
          { en: "9 is composite because its factors are..." }
        ],
        wordBank: ["prime", "composite", "factors"]
      },
      {
        question: "Write 12 as a product of prime factors.",
        stems: [
          { en: "12 factors into..." }
        ]
      }
    ],
    projects: [
      {
        title: "Mock Real-World Builders",
        desc: "Design a rectangular grid layout using factors."
      }
    ]
  };
  
  Logger.log("Compiling mock presentation...");
  var mockUrl = Service.createLessonSlides("TEST-1", mockData);
  Logger.log("Mock slides created: " + mockUrl);
  
  return "Self-Test passed successfully!\nMock Slides Url: " + mockUrl;
}

/** Bulk generation routine to create Google Slides for all 74 lessons natively on the server. */
function generateAllSlides() {
  var lessonIds = ["1-1","1-1-flagship","1-2","1-3","1-4","1-5","1-6","1-7","2-1","2-1-flagship","2-2","2-3","2-4","2-5","3-1","3-1-flagship","3-2","3-3","3-4","3-5","3-6","3-7","4-1","4-1-flagship","4-2","4-3","4-4","4-5","4-6","4-7","5-1","5-2","5-3","5-3-flagship","5-4","5-5","6-1","6-1-flagship","6-2","6-3","6-4","6-5","6-6","6-7","7-1","7-1-flagship","7-2","7-3","7-4","7-5","7-6","7-7","8-1","8-1-flagship","8-2","8-3","8-4","8-5","8-6","8-7","9-1","9-1-flagship","9-2","9-3","9-4","9-5","9-6","9-7","10-1","10-1-flagship","10-2","10-3","10-4","10-5"];
  
  var files = DriveApp.getFilesByName("google-slides-urls.json");
  var file;
  var urlMap = {};
  if (files.hasNext()) {
    file = files.next();
    try {
      urlMap = JSON.parse(file.getBlob().getDataAsString());
      Logger.log("Loaded existing mapped URLs: " + Object.keys(urlMap).length);
    } catch(e) {
      Logger.log("Failed to parse existing file, starting fresh.");
    }
  }
  
  for (var i = 0; i < lessonIds.length; i++) {
    var id = lessonIds[i];
    if (urlMap[id]) {
      Logger.log("[" + id + "] Already generated: " + urlMap[id]);
      continue;
    }
    
    Logger.log("[" + id + "] Generating slides (" + (i+1) + "/" + lessonIds.length + ")...");
    try {
      var data = Repository.fetchLessonConfig(id);
      var url = Service.createLessonSlides(id, data);
      urlMap[id] = url;
      Logger.log("[" + id + "] SUCCESS: " + url);
      
      // Update the progress file incrementally
      if (file) {
        file.setContent(JSON.stringify(urlMap, null, 2));
      } else {
        file = DriveApp.createFile("google-slides-urls.json", JSON.stringify(urlMap, null, 2), "application/json");
      }
    } catch(err) {
      Logger.log("[" + id + "] FAILED: " + err.message);
    }
    
    // Tiny pacing delay
    Utilities.sleep(500);
  }
  
  Logger.log("Bulk generation complete! Result stored in Drive.");
}

/** Debug routine to read presentation structure and return as text. */
function debugSelfTest(p) {
  var id = (p && p.id) || "1yuz3Ks6dhFXWFjfXusDmMak4ffZemdPhMycwMDPaqUU";
  try {
    var pres = SlidesApp.openById(id);
    var slides = pres.getSlides();
    var log = "Presentation Name: " + pres.getName() + "\n";
    log += "Slide Count: " + slides.length + "\n";
    for (var i = 0; i < slides.length; i++) {
      var slide = slides[i];
      var elements = slide.getPageElements();
      log += "Slide " + (i + 1) + " Elements Count: " + elements.length + "\n";
      for (var j = 0; j < elements.length; j++) {
        var el = elements[j];
        var type = el.getPageElementType();
        var txt = "";
        if (type == SlidesApp.PageElementType.SHAPE) {
          var shape = el.asShape();
          txt = shape.getText().asString();
        }
        log += "  - Element " + (j + 1) + ": Type=" + type + ", TextLength=" + txt.length + " (" + txt.substring(0, 40).replace(/\n/g, "\\n") + ")\n";
      }
    }
    return log;
  } catch (err) {
    return "Error: " + err.message;
  }
}
