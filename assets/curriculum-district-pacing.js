(function () {
  "use strict";
  const crosswalk = [
    {
      sequence: 1,
      quarter: "Q1",
      district_title: "Pre Unit: Course 1 Pre Unit",
      eduwonderlab_unit: "Unit 0 & Unit 1 + Computation Launch Pad",
      start_date: "8/24/26",
      end_date: "9/10/26",
      instructional_days: 14.0,
      additional_days: 1.0,
      assessments: ["Unit Quiz (9/9/26)", "iReady Placement Window"],
      lessons: [
        { id: "1-1", title: "Math is Mine", standards: ["MPP.3"] },
        { id: "1-2", title: "Math is Exploring Thinking", standards: ["5.NF.B.4"] },
        { id: "1-3", title: "Math is My World", standards: ["5.NBT.B.7", "5.G.A.2"] },
        { id: "1-4", title: "Math is Explaining and Sharing", standards: ["5.MD.C.5"] },
        { id: "1-5", title: "Math is Finding Patterns", standards: ["5.OA.A.2"] },
        { id: "1-6", title: "Math is Ours", standards: ["MPP.3"] },
        {
          id: "2-6",
          title: "Divide Multi-Digit Whole Numbers (Computation Bridge)",
          standards: ["6.NS.B.2"],
        },
        {
          id: "2-7",
          title: "Divide Decimals Using Algorithm (Computation Bridge)",
          standards: ["6.NS.B.2", "6.NS.B.3"],
        },
        {
          id: "2-11",
          title: "Add & Subtract Decimals (Computation Bridge)",
          standards: ["6.NS.B.3"],
        },
        { id: "2-12", title: "Multiply Decimals (Computation Bridge)", standards: ["6.NS.B.3"] },
      ],
    },
    {
      sequence: 2,
      quarter: "Q1",
      district_title: "Unit 3: Ratios & Rates",
      eduwonderlab_unit: "Unit 3: Ratios & Rates",
      start_date: "9/14/26",
      end_date: "10/19/26",
      instructional_days: 19.0,
      additional_days: 2.0,
      assessments: ["Unit Assessment (10/9/26)", "iReady Progress Monitor", "MSTAR Math Task"],
      lessons: [
        { id: "3-1", title: "Understand Ratios", standards: ["6.RP.A.1"] },
        { id: "3-2", title: "Understand Rates and Unit Rates", standards: ["6.RP.A.2"] },
        { id: "3-3", title: "Determine Equivalent Ratios Using Tables", standards: ["6.RP.A.3a"] },
        { id: "3-4", title: "Determine Equivalent Ratios Using Graphs", standards: ["6.RP.A.3a"] },
        { id: "3-5", title: "Compare Ratio Relationships", standards: ["6.RP.A.3a"] },
        {
          id: "3-6",
          title: "Ratio Reasoning: Convert Measurements (Same System)",
          standards: ["6.RP.A.3d"],
        },
        {
          id: "3-7",
          title: "Ratio Reasoning: Convert Measurements (Between Systems)",
          standards: ["6.RP.A.3d"],
        },
      ],
    },
    {
      sequence: 3,
      quarter: "Q1",
      district_title: "Unit 4: Understand and Use Percentages",
      eduwonderlab_unit: "Unit 4: Percents",
      start_date: "10/26/26",
      end_date: "11/5/26",
      instructional_days: 15.0,
      additional_days: 2.0,
      assessments: ["Unit Assessment (11/5/26)", "MSTAR Math Task"],
      lessons: [
        { id: "4-1", title: "Understand Percent", standards: ["6.RP.A.3"] },
        {
          id: "4-2",
          title: "Relate Fractions, Decimals, and Percentages",
          standards: ["6.RP.A.3c"],
        },
        { id: "4-3", title: "Estimate the Percent of a Number", standards: ["6.RP.A.3c"] },
        { id: "4-4", title: "Find and Compare with Percentages", standards: ["6.RP.A.3c"] },
        {
          id: "4-5",
          title: "Determine the Whole Given Part and Percent",
          standards: ["6.RP.A.3c"],
        },
      ],
    },
    {
      sequence: 4,
      quarter: "Q2",
      district_title: "Unit 6: Numerical and Algebraic Expressions",
      eduwonderlab_unit: "Unit 6: Expressions",
      start_date: "11/9/26",
      end_date: "12/21/26",
      instructional_days: 17.0,
      additional_days: 2.0,
      assessments: ["Unit Assessment (12/8/26)", "MSTAR Math Task"],
      lessons: [
        {
          id: "6-1",
          title: "Division Expressions with Fractions & Whole Numbers",
          standards: ["6.NS.A.1"],
        },
        {
          id: "6-2",
          title: "Division Expressions with Fractions & Mixed Numbers",
          standards: ["6.NS.A.1"],
        },
        {
          id: "6-3",
          title: "Explore Numerical Expressions with Exponents",
          standards: ["6.EE.A.1"],
        },
        {
          id: "6-4",
          title: "Write and Evaluate Numerical Expressions with Exponents",
          standards: ["6.EE.A.1"],
        },
        { id: "6-5", title: "Write and Evaluate Algebraic Expressions", standards: ["6.EE.A.2"] },
        { id: "6-6", title: "Identify Equivalent Algebraic Expressions", standards: ["6.EE.A.4"] },
        { id: "6-7", title: "Find Factors and Multiples (GCF / LCM)", standards: ["6.NS.B.4"] },
        {
          id: "6-8",
          title: "Generate Equivalent Expressions (Distributive Property)",
          standards: ["6.EE.A.3"],
        },
      ],
    },
    {
      sequence: 5,
      quarter: "Q3",
      district_title: "Unit 7: Integers, Rational Numbers, and the Coordinate Plane",
      eduwonderlab_unit: "Unit 7: Integers & Coordinate Plane",
      start_date: "1/4/27",
      end_date: "1/21/27",
      instructional_days: 19.0,
      additional_days: 2.0,
      assessments: ["Unit Assessment (1/21/27)", "iReady Window", "MSTAR Math Task"],
      lessons: [
        { id: "7-1", title: "Explore Integers and Their Opposites", standards: ["6.NS.C.5"] },
        { id: "7-2", title: "Represent Rational Numbers on Number Line", standards: ["6.NS.C.6a"] },
        { id: "7-3", title: "Understand Absolute Value", standards: ["6.NS.C.7c"] },
        { id: "7-4", title: "Compare and Order Rational Numbers", standards: ["6.NS.C.7a"] },
        {
          id: "7-5",
          title: "Represent Rational Numbers on Coordinate Plane",
          standards: ["6.NS.C.6b"],
        },
        { id: "7-6", title: "Determine Distance on Coordinate Plane", standards: ["6.NS.C.8"] },
        { id: "7-7", title: "Represent Polygons on Coordinate Plane", standards: ["6.G.A.3"] },
      ],
    },
    {
      sequence: 6,
      quarter: "Q3",
      district_title: "Unit 8: Equations & Inequalities",
      eduwonderlab_unit: "Unit 8: Equations & Inequalities",
      start_date: "1/25/27",
      end_date: "2/22/27",
      instructional_days: 20.0,
      additional_days: 2.0,
      assessments: ["Unit Assessment (2/22/27)", "iReady Window", "MSTAR Math Task"],
      lessons: [
        { id: "8-1", title: "Understand Equations and Their Solutions", standards: ["6.EE.B.5"] },
        {
          id: "8-2",
          title: "Write and Solve Addition/Subtraction Equations",
          standards: ["6.EE.B.7"],
        },
        {
          id: "8-3",
          title: "Write and Solve Multiplication/Division Equations",
          standards: ["6.EE.B.7"],
        },
        { id: "8-4", title: "Write and Represent Inequalities", standards: ["6.EE.B.8"] },
        {
          id: "8-5",
          title: "Understand Inequalities and Their Solutions",
          standards: ["6.EE.B.8"],
        },
      ],
    },
    {
      sequence: 7,
      quarter: "Q3",
      district_title: "Unit 9: Relationships Between Two Variables",
      eduwonderlab_unit: "Unit 9: Two-Variable Relationships",
      start_date: "2/23/27",
      end_date: "3/22/27",
      instructional_days: 13.0,
      additional_days: 2.0,
      assessments: ["Unit Assessment (3/17/27)", "MSTAR Math Task"],
      lessons: [
        { id: "9-1", title: "Independent and Dependent Variables", standards: ["6.EE.C.9"] },
        {
          id: "9-2",
          title: "Represent Two-Variable Relationships with Tables & Equations",
          standards: ["6.EE.C.9"],
        },
        { id: "9-3", title: "Graph Two-Variable Relationships", standards: ["6.EE.C.9"] },
        { id: "9-4", title: "Analyze Two-Variable Relationships", standards: ["6.EE.C.9"] },
      ],
    },
    {
      sequence: 8,
      quarter: "Q4",
      district_title: "Unit 5: Solve Area, Surface Area, and Volume Problems",
      eduwonderlab_unit: "Unit 5: Area, Surface Area & Volume",
      start_date: "4/5/27",
      end_date: "4/21/27",
      instructional_days: 18.0,
      additional_days: 1.0,
      assessments: ["Unit Assessment (4/21/27)", "MSTAR Math Task"],
      lessons: [
        { id: "5-1", title: "Area of Parallelograms & Rhombuses", standards: ["6.G.A.1"] },
        { id: "5-2", title: "Area of Triangles", standards: ["6.G.A.1"] },
        { id: "5-3", title: "Area of Trapezoids", standards: ["6.G.A.1"] },
        { id: "5-4", title: "Apply Area Concepts to Solve Problems", standards: ["6.G.A.1"] },
        { id: "5-5", title: "Determine Volume of Rectangular Prisms", standards: ["6.G.A.2"] },
        { id: "5-6", title: "Represent 3D Figures in 2D Nets", standards: ["6.G.A.4"] },
        { id: "5-7", title: "Determine Surface Area of Prisms", standards: ["6.G.A.4"] },
        { id: "5-8", title: "Determine Surface Area of Pyramids", standards: ["6.G.A.4"] },
      ],
    },
    {
      sequence: 9,
      quarter: "Q4",
      district_title: "Unit 2: Understanding the World Around Us Through Statistics",
      eduwonderlab_unit: "Unit 2: Statistics (Data Displays & Variation)",
      start_date: "4/22/27",
      end_date: "5/17/27",
      instructional_days: 16.0,
      additional_days: 1.0,
      assessments: ["Unit Assessment (5/17/27)", "MSTAR Review Tasks"],
      lessons: [
        { id: "2-1", title: "Understand Statistical Questions", standards: ["6.SP.A.1"] },
        { id: "2-2", title: "Data in a Histogram", standards: ["6.SP.B.4"] },
        { id: "2-3", title: "Describe Data Using Median", standards: ["6.SP.A.2"] },
        {
          id: "2-4",
          title: "Represent and Describe Data in Box Plot",
          standards: ["6.SP.A.2", "6.SP.B.4"],
        },
        { id: "2-5", title: "Describe Data by Range & IQR", standards: ["6.SP.A.3"] },
        { id: "2-8", title: "Describe Data Using Mean", standards: ["6.SP.A.3"] },
        {
          id: "2-9",
          title: "Describe Data by Mean Absolute Deviation (MAD)",
          standards: ["6.SP.B.5c"],
        },
        {
          id: "2-10",
          title: "Choose Appropriate Measures of Center/Variation",
          standards: ["6.SP.B.5d"],
        },
      ],
    },
    {
      sequence: 10,
      quarter: "Q4",
      district_title: "MSTAR Preparation & Take MSTAR",
      eduwonderlab_unit: "MSTAR Prep / Arcade Blitz / Command Center",
      start_date: "5/18/27",
      end_date: "5/24/27",
      instructional_days: 9.0,
      additional_days: 0.0,
      assessments: ["State MSTAR Math Blueprint Testing"],
      lessons: [
        {
          id: "MSTAR-1",
          title: "MSTAR Domain Blitz: Ratios & Expressions",
          standards: ["6.RP", "6.EE"],
        },
        {
          id: "MSTAR-2",
          title: "MSTAR Domain Blitz: Number System & Geometry",
          standards: ["6.NS", "6.G"],
        },
        {
          id: "MSTAR-3",
          title: "MSTAR Practice Performance Tasks",
          standards: ["6.SP", "6.RP", "6.EE"],
        },
      ],
    },
    {
      sequence: 11,
      quarter: "Q4",
      district_title: "Unit 10: Math Is...",
      eduwonderlab_unit: "Unit 10: Reflection & EOY Showcase",
      start_date: "6/1/27",
      end_date: "6/7/27",
      instructional_days: 8.5,
      additional_days: 0.0,
      assessments: ["EOY Student Portfolio & Project Showcase"],
      lessons: [
        { id: "10-1", title: "Math is Reflection & Growth", standards: ["MPP.3"] },
        { id: "10-2", title: "Culminating Math Showcase & Portfolio", standards: ["MPP.3"] },
      ],
    },
  ];

  window.getActiveDistrictSeq = function () {
    const select = document.getElementById("district-seq-select");
    const seqVal = select ? select.value : "1";
    return crosswalk.find((x) => x.sequence == seqVal) || crosswalk[0];
  };

  window.onDistrictSeqChange = function (seqVal) {
    const item = crosswalk.find((x) => x.sequence == seqVal);
    const lessonSelect = document.getElementById("district-lesson-select");
    if (!item || !lessonSelect) return;

    lessonSelect.innerHTML = "";

    const groupActions = document.createElement("optgroup");
    groupActions.label =
      "⚡ Quick Unit Planning Actions (Synced to " + item.quarter + " Seq " + item.sequence + ")";
    groupActions.innerHTML = `
      <option value="launch_first">🚀 Launch First Lesson of Unit (${item.lessons[0] ? item.lessons[0].id : ""})</option>
      <option value="build_week">🗓️ Plan the Week on Class Board (Seq ${item.sequence})</option>
      <option value="playlist">🎵 Tiered Student Playlist (Seq ${item.sequence})</option>
      <option value="unit_map">🗺️ Unit Scope & Prerequisites Map</option>
      <option value="groups">👥 Studio Small-Group Rotation Console</option>
      <option value="scorm">🎓 Download Canvas SCORM Package for Sequence ${item.sequence}</option>
    `;
    lessonSelect.appendChild(groupActions);

    const groupLessons = document.createElement("optgroup");
    groupLessons.label = "📖 Lessons & Synced Small-Group Pathways (District Sequence)";

    item.lessons.forEach((l) => {
      // Parent Interactive Lesson
      const optMain = document.createElement("option");
      optMain.value = `lesson_${l.id}`;
      optMain.textContent = `Lesson ${l.id}: ${l.title} [${l.standards.join(", ")}]`;
      groupLessons.appendChild(optMain);

      // Synced Group 1 (Support / Level 1)
      const optG1 = document.createElement("option");
      optG1.value = `sg1_${l.id}`;
      optG1.textContent = `    ↳ 💡 Lesson ${l.id} Group 1 (Level 1 Support Pathway)`;
      groupLessons.appendChild(optG1);

      // Synced Group 2 (Enrichment / Level 2)
      const optG2 = document.createElement("option");
      optG2.value = `sg2_${l.id}`;
      optG2.textContent = `    ↳ 🚀 Lesson ${l.id} Group 2 (Level 2 Enrichment Pathway)`;
      groupLessons.appendChild(optG2);
    });
    lessonSelect.appendChild(groupLessons);
  };

  window.executeQuickAction = function (actionType) {
    const item = window.getActiveDistrictSeq();
    const seq = item.sequence;
    const unitTitle = encodeURIComponent(item.district_title);
    const firstLessonId = item.lessons[0] ? item.lessons[0].id : "1-1";

    if (actionType === "launch_first") {
      window.open("/lessons/" + firstLessonId + "/", "_blank");
    } else if (actionType === "build_week") {
      window.open("/math/student-board/?seq=" + seq + "&unit=" + unitTitle + "&edit=1", "_blank");
    } else if (actionType === "playlist") {
      window.open(
        "/teacher-tools/tiered-differentiation-builder/?seq=" + seq + "&unit=" + unitTitle,
        "_blank",
      );
    } else if (actionType === "unit_map") {
      window.open("/curriculum/map/?seq=" + seq + "&unit=" + unitTitle, "_blank");
    } else if (actionType === "groups") {
      window.open("/neft-math-lab-studio/?seq=" + seq + "&unit=" + unitTitle, "_blank");
    } else if (actionType === "scorm") {
      window.open("/teacher-tools/canvas-scorm/?seq=" + seq + "&unit=" + unitTitle, "_blank");
    }
  };

  window.onDistrictLessonChange = function (val) {
    if (!val) return;
    if (val.startsWith("lesson_")) {
      const lid = val.replace("lesson_", "");
      window.open("/lessons/" + lid + "/", "_blank");
    } else if (val.startsWith("sg1_")) {
      const lid = val.replace("sg1_", "");
      window.open("/lessons/" + lid + "-group1/", "_blank");
    } else if (val.startsWith("sg2_")) {
      const lid = val.replace("sg2_", "");
      window.open("/lessons/" + lid + "-group2/", "_blank");
    } else {
      window.executeQuickAction(val);
    }
  };

  window.launchTargetLesson = function () {
    const select = document.getElementById("district-lesson-select");
    const val = select ? select.value : "";
    if (val) {
      window.onDistrictLessonChange(val);
    } else {
      window.executeQuickAction("launch_first");
    }
  };

  document.addEventListener("DOMContentLoaded", function () {
    const select = document.getElementById("district-seq-select");
    if (select && select.value) window.onDistrictSeqChange(select.value);
  });
})();
