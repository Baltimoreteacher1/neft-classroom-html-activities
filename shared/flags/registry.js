// The committed flag registry: the single source of truth for every flag (key, owner, default, removalDate,
// environments, cohorts, requires, killSwitch). A JS module, not JSON: the Pages Functions bundler Cloudflare
// runs rejects `import ... with { type: "json" }`, and Node ESM requires it, so no JSON file can be imported
// by both. tools/flags-hygiene.mjs (G-39) checks this file; shared/flags/negative/ holds the known-bad registry.
const registry = {
  version: 1,
  flags: [
    {
      key: "student_content_egress",
      description:
        "Master switch for any path that sends student-produced content (recordings, writing, answers) off the device. Every flag that sends student content must require this one.",
      owner: "platform",
      default: false,
      removalDate: "2027-12-31",
      environments: {
        production: null,
        staging: null,
        preview: null,
        local: null,
      },
      cohorts: {
        teacher: [],
        class: [],
        demo: [],
      },
      killSwitch: true,
      sendsStudentContent: false,
      requires: [],
    },
    {
      key: "student_feedback_model",
      description:
        "Send a student's writing to the feedback model and show the returned feedback. Off unless egress is on.",
      owner: "feedback",
      default: false,
      removalDate: "2027-06-30",
      environments: {
        production: null,
        staging: null,
        preview: null,
        local: null,
      },
      cohorts: {
        teacher: [],
        class: [],
        demo: [],
      },
      killSwitch: true,
      sendsStudentContent: true,
      requires: ["student_content_egress"],
    },
    {
      key: "speaking_feedback_upload",
      description:
        "Upload a student's speaking recording for feedback. Recordings stay on the device when this is off.",
      owner: "feedback",
      default: false,
      removalDate: "2027-06-30",
      environments: {
        production: null,
        staging: null,
        preview: null,
        local: null,
      },
      cohorts: {
        teacher: [],
        class: [],
        demo: [],
      },
      killSwitch: true,
      sendsStudentContent: true,
      requires: ["student_content_egress"],
    },
    {
      key: "district_aggregate_view",
      description:
        "Show the district-level aggregate view built from class summaries with no student rows.",
      owner: "reporting",
      default: false,
      removalDate: "2027-06-30",
      environments: {
        production: null,
        staging: null,
        preview: null,
        local: null,
      },
      cohorts: {
        teacher: [],
        class: [],
        demo: [],
      },
      killSwitch: false,
      sendsStudentContent: false,
      requires: [],
    },
    {
      key: "demo_mode",
      description: "Run the studio on synthetic fixture classes only, with no live class data.",
      owner: "platform",
      default: false,
      removalDate: "2027-06-30",
      environments: {
        production: null,
        staging: null,
        preview: null,
        local: null,
      },
      cohorts: {
        teacher: [],
        class: [],
        demo: [],
      },
      killSwitch: false,
      sendsStudentContent: false,
      requires: [],
    },
    {
      key: "review_only_default",
      description:
        "Open teacher results in review-only mode so nothing is changed until a teacher chooses to edit.",
      owner: "reporting",
      default: false,
      removalDate: "2027-06-30",
      environments: {
        production: null,
        staging: null,
        preview: null,
        local: null,
      },
      cohorts: {
        teacher: [],
        class: [],
        demo: [],
      },
      killSwitch: false,
      sendsStudentContent: false,
      requires: [],
    },
    {
      key: "model_teacher_assistant",
      description:
        "Teacher-facing assistant that drafts lesson support from teacher-written input only. If it ever accepts student content, set sendsStudentContent and require egress.",
      owner: "feedback",
      default: false,
      removalDate: "2027-06-30",
      environments: {
        production: null,
        staging: null,
        preview: null,
        local: null,
      },
      cohorts: {
        teacher: [],
        class: [],
        demo: [],
      },
      killSwitch: true,
      sendsStudentContent: false,
      requires: [],
    },
    {
      key: "experiments",
      description:
        "Umbrella for short-lived experiments. Each experiment ships as its own flag with its own removal date.",
      owner: "platform",
      default: false,
      removalDate: "2027-03-31",
      environments: {
        production: null,
        staging: null,
        preview: null,
        local: null,
      },
      cohorts: {
        teacher: [],
        class: [],
        demo: [],
      },
      killSwitch: false,
      sendsStudentContent: false,
      requires: [],
    },
    {
      key: "csp_enforce",
      description: "Enforce the Content-Security-Policy instead of reporting violations only.",
      owner: "platform",
      default: false,
      removalDate: "2027-03-31",
      environments: {
        production: null,
        staging: null,
        preview: null,
        local: null,
      },
      cohorts: {
        teacher: [],
        class: [],
        demo: [],
      },
      killSwitch: false,
      sendsStudentContent: false,
      requires: [],
    },
  ],
};

export default registry;
