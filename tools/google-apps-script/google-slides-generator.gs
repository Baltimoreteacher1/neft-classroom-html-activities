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
  FONT_FAMILY: "Calibri",
  TITLE_FONT_FAMILY: "Calibri",
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
    
    // Header Bar
    var header = slide.insertShape(SlidesApp.ShapeType.RECTANGLE, 0, 0, 720, 50);
    header.getFill().setSolidFill(CONFIG.COLOR_NAVY);
    header.getBorder().setTransparent();
    
    var headerText = header.getText();
    headerText.setText(headerTitle);
    headerText.getTextStyle().setFontFamily(CONFIG.TITLE_FONT_FAMILY);
    headerText.getTextStyle().setFontSize(18);
    headerText.getTextStyle().setBold(true);
    headerText.getTextStyle().setForegroundColor(CONFIG.COLOR_AMBER);
    headerText.getParagraphStyle().setParagraphAlignment(SlidesApp.ParagraphAlignment.CENTER);
    
    // Footer Bar
    var footer = slide.insertShape(SlidesApp.ShapeType.RECTANGLE, 0, 375, 720, 30);
    footer.getFill().setSolidFill(CONFIG.COLOR_NAVY);
    footer.getBorder().setTransparent();
    
    var footerTextObj = footer.getText();
    footerTextObj.setText(footerText || "Neft Teacher · Grade 6 Math");
    footerTextObj.getTextStyle().setFontFamily(CONFIG.FONT_FAMILY);
    footerTextObj.getTextStyle().setFontSize(11);
    footerTextObj.getTextStyle().setForegroundColor(CONFIG.COLOR_WHITE);
    footerTextObj.getParagraphStyle().setParagraphAlignment(SlidesApp.ParagraphAlignment.CENTER);
  },

  /** SLIDE 1: Objectives & Session Map */
  buildSlide1_Objectives: function(presentation, lessonId, data) {
    var slide = presentation.appendSlide(SlidesApp.PredefinedLayout.BLANK);
    this.applySlideTheme(slide, "LESSON " + lessonId + " · OBJECTIVES", "Grade 6 Math · Unit " + (data.unit || ""));
    
    // Objective Card
    var card = slide.insertShape(SlidesApp.ShapeType.ROUND_RECTANGLE, 40, 80, 640, 200);
    card.getFill().setSolidFill(CONFIG.COLOR_WHITE);
    card.getBorder().getLineFill().setSolidFill(CONFIG.COLOR_TEAL);
    card.getBorder().setWeight(2);
    
    var textRange = card.getText();
    textRange.setText(
      "🎯 Content Objective:\n" + (data.contentObjective || "I can explain the mathematical relationships in this lesson.") + "\n\n" +
      "🗣️ Language Objective:\n" + (data.languageObjective || "I can discuss my reasoning using vocabulary terms.")
    );
    textRange.getTextStyle().setFontFamily(CONFIG.FONT_FAMILY);
    textRange.getTextStyle().setFontSize(16);
    textRange.getTextStyle().setForegroundColor(CONFIG.COLOR_BODY_TEXT);
    
    // Format headers in bold
    var contentIdx = textRange.asString().indexOf("🎯 Content Objective:");
    if (contentIdx !== -1) {
      textRange.getRange(contentIdx, contentIdx + 20).getTextStyle().setBold(true).setForegroundColor(CONFIG.COLOR_NAVY);
    }
    var langIdx = textRange.asString().indexOf("🗣️ Language Objective:");
    if (langIdx !== -1) {
      textRange.getRange(langIdx, langIdx + 21).getTextStyle().setBold(true).setForegroundColor(CONFIG.COLOR_NAVY);
    }
    
    // Learning Path Map
    var pathBox = slide.insertShape(SlidesApp.ShapeType.RECTANGLE, 40, 300, 640, 50);
    pathBox.getFill().setSolidFill(CONFIG.COLOR_TEAL_LIGHT);
    pathBox.getBorder().setTransparent();
    var pathText = pathBox.getText();
    pathText.setText("🗺️ Learning Path: 1. Launch ➔ 2. Explore ➔ 3. Vocabulary ➔ 4. Guided ➔ 5. Practice ➔ 6. Reflect");
    pathText.getTextStyle().setFontFamily(CONFIG.FONT_FAMILY);
    pathText.getTextStyle().setFontSize(12);
    pathText.getTextStyle().setBold(true);
    pathText.getTextStyle().setForegroundColor(CONFIG.COLOR_NAVY);
    pathText.getParagraphStyle().setParagraphAlignment(SlidesApp.ParagraphAlignment.CENTER);
  },

  /** SLIDE 2: Be Curious (Notice & Wonder) */
  buildSlide2_BeCurious: function(presentation, lessonId, data) {
    var slide = presentation.appendSlide(SlidesApp.PredefinedLayout.BLANK);
    this.applySlideTheme(slide, "BE CURIOUS · LAUNCH", "Observe the scenario. What do you Notice and Wonder?");
    
    // Left: Scenario Card
    var leftCard = slide.insertShape(SlidesApp.ShapeType.ROUND_RECTANGLE, 40, 80, 310, 270);
    leftCard.getFill().setSolidFill(CONFIG.COLOR_WHITE);
    leftCard.getBorder().getLineFill().setSolidFill(CONFIG.COLOR_TEAL);
    leftCard.getBorder().setWeight(1.5);
    
    var scenarioText = "";
    if (data.turnAndTalk && data.turnAndTalk.length > 0) {
      scenarioText = data.turnAndTalk[0].question || "Read the scenario and prepare to share your observations.";
    } else {
      scenarioText = "Discuss the math concepts presented in this lesson with your partner.";
    }
    
    var leftText = leftCard.getText();
    leftText.setText("📋 Launch Problem:\n\n" + scenarioText);
    leftText.getTextStyle().setFontFamily(CONFIG.FONT_FAMILY);
    leftText.getTextStyle().setFontSize(14);
    leftText.getTextStyle().setForegroundColor(CONFIG.COLOR_BODY_TEXT);
    leftText.getRange(0, 18).getTextStyle().setBold(true).setForegroundColor(CONFIG.COLOR_NAVY).setFontSize(16);
    
    // Right Top: Notice Panel
    var rightTop = slide.insertShape(SlidesApp.ShapeType.ROUND_RECTANGLE, 370, 80, 310, 125);
    rightTop.getFill().setSolidFill(CONFIG.COLOR_TEAL_LIGHT);
    rightTop.getBorder().setTransparent();
    
    var noticeStems = "";
    if (data.turnAndTalk && data.turnAndTalk.length > 0 && data.turnAndTalk[0].stems) {
      var stems = data.turnAndTalk[0].stems;
      noticeStems = stems.map(function(s) { return "✍️ " + (s.en || s); }).join("\n");
    } else {
      noticeStems = "✍️ I notice that...\n✍️ Another observation is...";
    }
    
    var rightTopText = rightTop.getText();
    rightTopText.setText("👀 Things I Notice:\n" + noticeStems);
    rightTopText.getTextStyle().setFontFamily(CONFIG.FONT_FAMILY);
    rightTopText.getTextStyle().setFontSize(12);
    rightTopText.getTextStyle().setForegroundColor(CONFIG.COLOR_BODY_TEXT);
    rightTopText.getRange(0, 18).getTextStyle().setBold(true).setForegroundColor(CONFIG.COLOR_NAVY).setFontSize(13);
    
    // Right Bottom: Wonder Panel
    var rightBottom = slide.insertShape(SlidesApp.ShapeType.ROUND_RECTANGLE, 370, 225, 310, 125);
    rightBottom.getFill().setSolidFill(CONFIG.COLOR_CORAL);
    rightBottom.getBorder().setTransparent();
    
    var wonderStems = "";
    if (data.turnAndTalk && data.turnAndTalk.length > 0 && data.turnAndTalk[0].extendStems) {
      var extStems = data.turnAndTalk[0].extendStems;
      wonderStems = extStems.map(function(s) { return "❓ " + (s.en || s); }).join("\n");
    } else if (data.turnAndTalk && data.turnAndTalk.length > 0 && data.turnAndTalk[0].extend) {
      wonderStems = "❓ " + data.turnAndTalk[0].extend;
    } else {
      wonderStems = "❓ I wonder what would happen if...\n❓ How relates to...";
    }
    
    var rightBottomText = rightBottom.getText();
    rightBottomText.setText("💭 Things I Wonder:\n" + wonderStems);
    rightBottomText.getTextStyle().setFontFamily(CONFIG.FONT_FAMILY);
    rightBottomText.getTextStyle().setFontSize(12);
    rightBottomText.getTextStyle().setForegroundColor(CONFIG.COLOR_BODY_TEXT);
    rightBottomText.getRange(0, 19).getTextStyle().setBold(true).setForegroundColor(CONFIG.COLOR_NAVY).setFontSize(13);
  },

  /** SLIDE 3: Vocabulary & Reference */
  buildSlide3_Vocabulary: function(presentation, lessonId, data) {
    var slide = presentation.appendSlide(SlidesApp.PredefinedLayout.BLANK);
    this.applySlideTheme(slide, "KEY VOCABULARY & FLOW", "Master these key terms to support your math talk.");
    
    // Show Vocabulary terms from turnAndTalk word bank or placeholders
    var vocabTerms = [];
    if (data.turnAndTalk && data.turnAndTalk.length > 0 && data.turnAndTalk[0].wordBank) {
      vocabTerms = data.turnAndTalk[0].wordBank;
    } else {
      vocabTerms = ["ratio", "relationship", "value", "quantity"];
    }
    
    // We will place 4 vocab blocks in a 2x2 grid
    var positions = [
      { x: 40, y: 80 }, { x: 370, y: 80 },
      { x: 40, y: 200 }, { x: 370, y: 200 }
    ];
    
    for (var i = 0; i < 4; i++) {
      var term = vocabTerms[i] || "Math Term";
      var pos = positions[i];
      
      var vocabBox = slide.insertShape(SlidesApp.ShapeType.ROUND_RECTANGLE, pos.x, pos.y, 310, 100);
      vocabBox.getFill().setSolidFill(CONFIG.COLOR_WHITE);
      vocabBox.getBorder().getLineFill().setSolidFill(CONFIG.COLOR_GRAY);
      vocabBox.getBorder().setWeight(1);
      
      var vocabText = vocabBox.getText();
      // Provide simple, standard student-friendly helper definitions
      var def = "Verbalize this concept using lesson examples.";
      if (term.toLowerCase().indexOf("prime") > -1) def = "A number greater than 1 that only has factors 1 and itself.";
      if (term.toLowerCase().indexOf("composite") > -1) def = "A number that has factors other than 1 and itself.";
      if (term.toLowerCase().indexOf("factor") > -1) def = "A number multiplied by another number to get a product.";
      if (term.toLowerCase().indexOf("ratio") > -1) def = "A comparison of two quantities by division.";
      
      vocabText.setText("📝 " + term.toUpperCase() + "\n" + def);
      vocabText.getTextStyle().setFontFamily(CONFIG.FONT_FAMILY);
      vocabText.getTextStyle().setFontSize(11);
      vocabText.getTextStyle().setForegroundColor(CONFIG.COLOR_BODY_TEXT);
      
      var termLength = term.length + 3;
      vocabText.getRange(0, termLength).getTextStyle().setBold(true).setForegroundColor(CONFIG.COLOR_TEAL).setFontSize(13);
    }
    
    // Reference Flow Diagram
    var flowBox = slide.insertShape(SlidesApp.ShapeType.ROUND_RECTANGLE, 40, 315, 640, 45);
    flowBox.getFill().setSolidFill(CONFIG.COLOR_TEAL_LIGHT);
    flowBox.getBorder().setTransparent();
    var flowText = flowBox.getText();
    flowText.setText("💡 Core Flow: INPUT (Independent Variable) ➔ PROCESS (Equation/Rule) ➔ OUTPUT (Dependent Variable)");
    flowText.getTextStyle().setFontFamily(CONFIG.FONT_FAMILY);
    flowText.getTextStyle().setFontSize(11);
    flowText.getTextStyle().setBold(true);
    flowText.getTextStyle().setForegroundColor(CONFIG.COLOR_NAVY);
    flowText.getParagraphStyle().setParagraphAlignment(SlidesApp.ParagraphAlignment.CENTER);
  },

  /** SLIDE 4: Visual Model (Using Programmatic SVG insert) */
  buildSlide4_VisualModel: function(presentation, lessonId, data) {
    var slide = presentation.appendSlide(SlidesApp.PredefinedLayout.BLANK);
    this.applySlideTheme(slide, "VISUAL MODELING WORKSPACE", "Draw, label, or build a mathematical representation.");
    
    // Workspace Board
    var board = slide.insertShape(SlidesApp.ShapeType.RECTANGLE, 40, 80, 640, 270);
    board.getFill().setSolidFill(CONFIG.COLOR_WHITE);
    board.getBorder().getLineFill().setSolidFill(CONFIG.COLOR_TEAL);
    board.getBorder().setWeight(2);
    
    var boardText = board.getText();
    boardText.setText("📐 Visual Model Workspace:\n");
    boardText.getTextStyle().setFontFamily(CONFIG.FONT_FAMILY);
    boardText.getTextStyle().setFontSize(14);
    boardText.getTextStyle().setBold(true);
    boardText.getTextStyle().setForegroundColor(CONFIG.COLOR_NAVY);
    
    // Programmatic Visual Math SVG creation
    var svgString = this.generateMathVisualSvg(lessonId, data);
    
    try {
      var blob = Utilities.newBlob(svgString, "image/svg+xml", "visual-model.svg");
      // Insert visual math into presentation slide
      var insertedImg = slide.insertImage(blob);
      // Position and size nicely on the whiteboard area
      insertedImg.setLeft(210);
      insertedImg.setTop(110);
      insertedImg.setWidth(300);
      insertedImg.setHeight(200);
      Logger.log("Successfully inserted programmatic visual math SVG.");
    } catch (err) {
      Logger.log("Failed to insert programmatic SVG: " + err.message + ". Fallback to text diagram.");
      // Fallback label
      var fallbackLabel = slide.insertShape(SlidesApp.ShapeType.ROUND_RECTANGLE, 210, 110, 300, 200);
      fallbackLabel.getFill().setSolidFill(CONFIG.COLOR_TEAL_LIGHT);
      fallbackLabel.getBorder().getLineFill().setSolidFill(CONFIG.COLOR_TEAL);
      var fallbackText = fallbackLabel.getText();
      fallbackText.setText("[Visual Math Model Grid]\n\n" + (data.contentObjective || "Math Diagram Workspace"));
      fallbackText.getTextStyle().setFontFamily(CONFIG.FONT_FAMILY);
      fallbackText.getTextStyle().setFontSize(14);
      fallbackText.getParagraphStyle().setParagraphAlignment(SlidesApp.ParagraphAlignment.CENTER);
    }
  },

  /** SLIDE 5: Guided Practice (TWR Sentinel Frames) */
  buildSlide5_GuidedPractice: function(presentation, lessonId, data) {
    var slide = presentation.appendSlide(SlidesApp.PredefinedLayout.BLANK);
    this.applySlideTheme(slide, "GUIDED PRACTICE", "Work together to solve this problem and justify your answer.");
    
    // Left: Guided Problem
    var leftBox = slide.insertShape(SlidesApp.ShapeType.ROUND_RECTANGLE, 40, 80, 310, 270);
    leftBox.getFill().setSolidFill(CONFIG.COLOR_WHITE);
    leftBox.getBorder().getLineFill().setSolidFill(CONFIG.COLOR_NAVY);
    leftBox.getBorder().setWeight(1.5);
    
    var leftText = leftBox.getText();
    var stem = "Verify your mathematical calculations with your teacher and partner.";
    if (data.turnAndTalk && data.turnAndTalk.length > 1) {
      stem = data.turnAndTalk[1].question || stem;
    }
    
    leftText.setText("📖 Guided Challenge:\n\n" + stem);
    leftText.getTextStyle().setFontFamily(CONFIG.FONT_FAMILY);
    leftText.getTextStyle().setFontSize(13);
    leftText.getTextStyle().setForegroundColor(CONFIG.COLOR_BODY_TEXT);
    leftText.getRange(0, 20).getTextStyle().setBold(true).setForegroundColor(CONFIG.COLOR_NAVY).setFontSize(15);
    
    // Right: Write About It (TWR Frames)
    var rightBox = slide.insertShape(SlidesApp.ShapeType.ROUND_RECTANGLE, 370, 80, 310, 270);
    rightBox.getFill().setSolidFill(CONFIG.COLOR_TEAL_LIGHT);
    rightBox.getBorder().setTransparent();
    
    var rightText = rightBox.getText();
    
    var stemsText = "";
    if (data.turnAndTalk && data.turnAndTalk.length > 1 && data.turnAndTalk[1].stems) {
      var stems = data.turnAndTalk[1].stems;
      stemsText = stems.map(function(s) { return "🔹 " + (s.en || s); }).join("\n\n");
    } else {
      stemsText = "🔹 First, I know that... because...\n\n🔹 This means that... so I can conclude...";
    }
    
    rightText.setText("✍️ TWR Sentence Expansion:\n\n" + stemsText);
    rightText.getTextStyle().setFontFamily(CONFIG.FONT_FAMILY);
    rightText.getTextStyle().setFontSize(12);
    rightText.getTextStyle().setForegroundColor(CONFIG.COLOR_BODY_TEXT);
    rightText.getRange(0, 26).getTextStyle().setBold(true).setForegroundColor(CONFIG.COLOR_NAVY).setFontSize(14);
  },

  /** SLIDE 6: Interactive Activity A (e.g. Partner Dialogue) */
  buildSlide6_ActivityA: function(presentation, lessonId, data) {
    var slide = presentation.appendSlide(SlidesApp.PredefinedLayout.BLANK);
    this.applySlideTheme(slide, "INTERACTIVE WORKSHOP A", "Collaborate and communicate to solve the partner challenge.");
    
    // Partner A Panel
    var aBox = slide.insertShape(SlidesApp.ShapeType.ROUND_RECTANGLE, 40, 80, 310, 270);
    aBox.getFill().setSolidFill(CONFIG.COLOR_WHITE);
    aBox.getBorder().getLineFill().setSolidFill(CONFIG.COLOR_TEAL);
    aBox.getBorder().setWeight(1.5);
    var aText = aBox.getText();
    aText.setText("👥 Partner A:\n\nExplain how you can approach solving this problem. What steps will you perform first, and what tools will you use?");
    aText.getTextStyle().setFontFamily(CONFIG.FONT_FAMILY);
    aText.getTextStyle().setFontSize(14);
    aText.getTextStyle().setForegroundColor(CONFIG.COLOR_BODY_TEXT);
    aText.getRange(0, 13).getTextStyle().setBold(true).setForegroundColor(CONFIG.COLOR_TEAL).setFontSize(16);
    
    // Partner B Panel
    var bBox = slide.insertShape(SlidesApp.ShapeType.ROUND_RECTANGLE, 370, 80, 310, 270);
    bBox.getFill().setSolidFill(CONFIG.COLOR_WHITE);
    bBox.getBorder().getLineFill().setSolidFill(CONFIG.COLOR_NAVY);
    bBox.getBorder().setWeight(1.5);
    var bText = bBox.getText();
    bText.setText("👥 Partner B:\n\nRespond to your partner's explanation. Do you agree with their approach? How would you verify their final calculations?");
    bText.getTextStyle().setFontFamily(CONFIG.FONT_FAMILY);
    bText.getTextStyle().setFontSize(14);
    bText.getTextStyle().setForegroundColor(CONFIG.COLOR_BODY_TEXT);
    bText.getRange(0, 13).getTextStyle().setBold(true).setForegroundColor(CONFIG.COLOR_NAVY).setFontSize(16);
  },

  /** SLIDE 7: Interactive Activity B (e.g. Error Analysis) */
  buildSlide7_ActivityB: function(presentation, lessonId, data) {
    var slide = presentation.appendSlide(SlidesApp.PredefinedLayout.BLANK);
    this.applySlideTheme(slide, "INTERACTIVE WORKSHOP B · ERROR ANALYSIS", "Analyze the math mistake. Find it, explain it, and fix it.");
    
    // Left: The Misconception
    var leftBox = slide.insertShape(SlidesApp.ShapeType.ROUND_RECTANGLE, 40, 80, 310, 270);
    leftBox.getFill().setSolidFill(CONFIG.COLOR_WHITE);
    leftBox.getBorder().getLineFill().setSolidFill(CONFIG.COLOR_AMBER);
    leftBox.getBorder().setWeight(1.5);
    
    var leftText = leftBox.getText();
    leftText.setText("⚠️ Incorrect Mathematical Claim:\n\nA student claims that when solving this problem, they should add the values instead of multiplying.\n\nWhy is this reasoning incorrect?");
    leftText.getTextStyle().setFontFamily(CONFIG.FONT_FAMILY);
    leftText.getTextStyle().setFontSize(13);
    leftText.getTextStyle().setForegroundColor(CONFIG.COLOR_BODY_TEXT);
    leftText.getRange(0, 31).getTextStyle().setBold(true).setForegroundColor(CONFIG.COLOR_AMBER).setFontSize(15);
    
    // Right: Explaining and Fixing
    var rightBox = slide.insertShape(SlidesApp.ShapeType.ROUND_RECTANGLE, 370, 80, 310, 270);
    rightBox.getFill().setSolidFill(CONFIG.COLOR_CORAL);
    rightBox.getBorder().setTransparent();
    var rightText = rightBox.getText();
    rightText.setText("🛠️ Fix & Justify:\n\n" +
                  "1. What is the actual math mistake?\n" +
                  "___________________________________\n\n" +
                  "2. Show the correct steps below:\n" +
                  "___________________________________");
    rightText.getTextStyle().setFontFamily(CONFIG.FONT_FAMILY);
    rightText.getTextStyle().setFontSize(13);
    rightText.getTextStyle().setForegroundColor(CONFIG.COLOR_BODY_TEXT);
    rightText.getRange(0, 17).getTextStyle().setBold(true).setForegroundColor(CONFIG.COLOR_NAVY).setFontSize(15);
  },

  /** SLIDE 8: Real-World Connection */
  buildSlide8_RealWorld: function(presentation, lessonId, data) {
    var slide = presentation.appendSlide(SlidesApp.PredefinedLayout.BLANK);
    this.applySlideTheme(slide, "REAL-WORLD CONNECTION · MATH IN THE WILD", "How is this math useful outside of the classroom?");
    
    // Context text
    var connText = "Math is used by engineers, designers, and scientists daily to model systems and solve problems.";
    if (data.projects && data.projects.length > 0) {
      var proj = data.projects[0];
      connText = (proj.title || "Real-world project") + ": " + (proj.desc || connText);
    }
    
    // Big Connection Box
    var connectionBox = slide.insertShape(SlidesApp.ShapeType.ROUND_RECTANGLE, 40, 80, 640, 130);
    connectionBox.getFill().setSolidFill(CONFIG.COLOR_WHITE);
    connectionBox.getBorder().getLineFill().setSolidFill(CONFIG.COLOR_NAVY);
    connectionBox.getBorder().setWeight(1.5);
    var boxText = connectionBox.getText();
    boxText.setText("🌍 Context Scenario:\n\n" + connText);
    boxText.getTextStyle().setFontFamily(CONFIG.FONT_FAMILY);
    boxText.getTextStyle().setFontSize(14);
    boxText.getTextStyle().setForegroundColor(CONFIG.COLOR_BODY_TEXT);
    boxText.getRange(0, 21).getTextStyle().setBold(true).setForegroundColor(CONFIG.COLOR_NAVY).setFontSize(16);
    
    // Application prompt
    var writeBox = slide.insertShape(SlidesApp.ShapeType.ROUND_RECTANGLE, 40, 230, 640, 120);
    writeBox.getFill().setSolidFill(CONFIG.COLOR_TEAL_LIGHT);
    writeBox.getBorder().setTransparent();
    var writeText = writeBox.getText();
    writeText.setText("✍️ Connection Reasoning:\n\n" +
                     "• This math applies to this scenario because...\n" +
                     "• Understanding this concept helps me solve real-world problems like...");
    writeText.getTextStyle().setFontFamily(CONFIG.FONT_FAMILY);
    writeText.getTextStyle().setFontSize(14);
    writeText.getTextStyle().setForegroundColor(CONFIG.COLOR_BODY_TEXT);
    writeText.getRange(0, 25).getTextStyle().setBold(true).setForegroundColor(CONFIG.COLOR_NAVY).setFontSize(15);
  },

  /** SLIDE 9: Reflection + Exit Ticket */
  buildSlide9_Reflection: function(presentation, lessonId, data) {
    var slide = presentation.appendSlide(SlidesApp.PredefinedLayout.BLANK);
    this.applySlideTheme(slide, "REFLECTION & EXIT TICKET", "Summarize what you learned and complete the exit problem.");
    
    // Left: Reflection Checklist
    var leftBox = slide.insertShape(SlidesApp.ShapeType.ROUND_RECTANGLE, 40, 80, 310, 270);
    leftBox.getFill().setSolidFill(CONFIG.COLOR_WHITE);
    leftBox.getBorder().getLineFill().setSolidFill(CONFIG.COLOR_TEAL);
    leftBox.getBorder().setWeight(1.5);
    
    var leftText = leftBox.getText();
    leftText.setText("🤔 3-2-1 Reflection:\n\n" +
                  "📝 3 Things I learned today:\n" +
                  "   1. ______________ 2. ______________ 3. ______________\n\n" +
                  "💡 2 Connections I made:\n" +
                  "   1. ______________ 2. ______________\n\n" +
                  "❓ 1 Question I still have:\n" +
                  "   1. ______________");
    leftText.getTextStyle().setFontFamily(CONFIG.FONT_FAMILY);
    leftText.getTextStyle().setFontSize(11);
    leftText.getTextStyle().setForegroundColor(CONFIG.COLOR_BODY_TEXT);
    leftText.getRange(0, 20).getTextStyle().setBold(true).setForegroundColor(CONFIG.COLOR_NAVY).setFontSize(15);
    
    // Right: Exit Ticket
    var rightBox = slide.insertShape(SlidesApp.ShapeType.ROUND_RECTANGLE, 370, 80, 310, 270);
    rightBox.getFill().setSolidFill(CONFIG.COLOR_TEAL_LIGHT);
    rightBox.getBorder().getLineFill().setSolidFill(CONFIG.COLOR_TEAL);
    rightBox.getBorder().setWeight(1);
    
    var rightText = rightBox.getText();
    rightText.setText("📝 Exit Ticket:\n\nApply your learning to solve this final question independently:\n\n" +
                     "Evaluate the prime parts or relationship of the lesson values.");
    rightText.getTextStyle().setFontFamily(CONFIG.FONT_FAMILY);
    rightText.getTextStyle().setFontSize(13);
    rightText.getTextStyle().setForegroundColor(CONFIG.COLOR_BODY_TEXT);
    rightText.getRange(0, 15).getTextStyle().setBold(true).setForegroundColor(CONFIG.COLOR_NAVY).setFontSize(15);
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
      svg += '<text x="140" y="180" font-family="Calibri" font-size="12" fill="' + CONFIG.COLOR_NAVY + '" font-weight="bold">Base (b)</text>';
      // Height dashed line
      svg += '<line x1="150" y1="50" x2="150" y2="150" stroke="' + CONFIG.COLOR_AMBER + '" stroke-width="1.5" stroke-dasharray="4,4"/>';
      svg += '<text x="160" y="100" font-family="Calibri" font-size="12" fill="' + CONFIG.COLOR_NAVY + '" font-weight="bold">Height (h)</text>';
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
      svg += '<text x="240" y="180" font-family="Calibri" font-size="11" fill="' + CONFIG.COLOR_NAVY + '" font-weight="bold">Input (x)</text>';
      svg += '<text x="15" y="45" font-family="Calibri" font-size="11" fill="' + CONFIG.COLOR_NAVY + '" font-weight="bold">Output (y)</text>';
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
        svg += '<text x="' + (ticks[t] - 4) + '" y="' + (125) + '" font-family="Calibri" font-size="11" fill="' + CONFIG.COLOR_NAVY + '" font-weight="bold">' + labels[t] + '</text>';
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
