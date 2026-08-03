/**
 * Site-wide runtime globals.
 *
 * This site is script-tag-composed, not bundled: a page loads several <script>
 * files and they cooperate through `window.*` handles (window.CurriculumHub,
 * window.NTSignal, window.NeftScorm, ...). That is deliberate here — it is what
 * lets a static HTML activity pull in a shared layer with no build step — but
 * it is invisible to a per-file type checker, which sees only "Property 'X'
 * does not exist on type 'Window'". Before this file, EVERY window property was
 * equally unknown, so nothing about them was checkable.
 *
 * Declaring them makes a typo in one of these names an error.
 *
 * They are typed `any` on purpose. Pretending to know their shape would be
 * fiction; the value here is name-level checking. Narrow one when you are ready
 * to own its contract.
 *
 * Regenerate the candidate list with:
 *   git ls-files assets engine shared functions curriculum \
 *     | grep -E "\\.(js|mjs)$" | grep -v vendor \
 *     | xargs grep -ho "window\\.[A-Za-z_$][A-Za-z0-9_$]*" | sort -u
 */

interface Window {
  $: any;
  AudioSynth: any;
  CURRICULUM_SYNC: any;
  CurriculumCockpit: any;
  CurriculumHub: any;
  CurriculumLiveSignal: any;
  CurriculumNextMove: any;
  CurriculumProgressBridge: any;
  CurriculumTeacherPlanning: any;
  DeviceOrientationEvent: any;
  EDUPULSE_CONFIG: any;
  EWLAdapt: any;
  EWLLearningSupports: any;
  EWLPeerRelay: any;
  EWLScoreBridge: any;
  EWLSupportsAdaptations: any;
  EWLSupportsSchema: any;
  EduPulse: any;
  Evidence: any;
  EvidenceCSV: any;
  EvidenceReport: any;
  GameFX: any;
  GameJuice: any;
  Games2DData: any;
  LESSON_BONUS_ACTIVITIES: any;
  LESSON_FAMILY_HOMEWORK: any;
  NEFT_BRAIN_GRAPH: any;
  NEFT_BRAIN_TAXONOMY: any;
  NTAdaptive: any;
  NTAnswerKeyLink: any;
  NTChalk: any;
  NTCheck: any;
  NTComplete: any;
  NTDeclutter: any;
  NTDiscourse: any;
  NTEdgeTwins: any;
  NTFocus: any;
  NTFuture: any;
  NTHubUnits: any;
  NTIdentity: any;
  NTInkMath: any;
  NTJuice: any;
  NTKit: any;
  NTLiveSim: any;
  NTMentor: any;
  NTMentorAvatar: any;
  NTMentorRoster: any;
  NTMeta: any;
  NTPassport: any;
  NTProcessTelemetry: any;
  NTReasoningReplay: any;
  NTResults: any;
  NTSignal: any;
  NTSkeptic: any;
  NTSync: any;
  NTUsage: any;
  NTVoiceLesson: any;
  NTWebVitalsContract: any;
  NT_ACTIVITY: any;
  NT_ADAPTIVE_AUTOSTART: any;
  NT_GRADE_ITEMS: any;
  NT_LESSON_LEVEL: any;
  NT_LESSON_STANDARD: any;
  NT_MISCONCEPTIONS: any;
  NT_MUTED: any;
  NT_PRIOR_ITEMS: any;
  NT_SYNC: any;
  NT_TELEMETRY_CONFIG: any;
  NT_UNIT_THEME: any;
  NTa11y: any;
  NTtelemetry: any;
  NeftAwardStudio: any;
  NeftBrain: any;
  NeftCalm: any;
  NeftCanvasBridge: any;
  NeftCanvasBridgeConfig: any;
  NeftCanvasCodeUI: any;
  NeftCanvasCodec: any;
  NeftDocx: any;
  NeftFutures: any;
  NeftGradeCore: any;
  NeftHintLadder: any;
  NeftIdentity: any;
  NeftLessonPlatform: any;
  NeftLineGrapher: any;
  NeftManips: any;
  NeftPrint: any;
  NeftSaveResume: any;
  NeftSaveResumeConfig: any;
  NeftScore: any;
  NeftScorm: any;
  NeftTheme: any;
  NeftTutor: any;
  P3D: any;
  PK: any;
  PKTabs: any;
  Phaser: any;
  ProjectPublication: any;
  REVEAL_MATH_CLUSTERS: any;
  REVEAL_MATH_LESSONS: any;
  REVEAL_MATH_UNITS: any;
  ROUNDS: any;
  S: any;
  StudyPack: any;
  WebGLRenderingContext: any;
  WonderPass: any;
  __currArrowPaging: any;
  __gameVisualsInit: any;
  __neftGameAccess: any;
  __ntChromeLoaded: any;
  __ntClearLessonAnswers: any;
  __ntHubIdentityBooted: any;
  __ntLessonClearApi: any;
  __ntLessonMeta: any;
  __ntLessonSession: any;
  __ntPageEnhance: any;
  __ntProtectedTerms: any;
  __ntShellGuard: any;
  __ntShowcaseLoaded: any;
  __ntlpScriptsAdded: any;
  __ntmLevel0Navigation: any;
  __nzProjectsZoom: any;
  __p3dBooted: any;
  __pkRefLightbox: any;
  buildReport: any;
  cheatAddLives: any;
  cheatAutoWin: any;
  clearScratchCanvas: any;
  days: any;
  endGame: any;
  ffGame: any;
  fireConfetti: any;
  game: any;
  goStep: any;
  mailboxLinkReady: any;
  onLevelChange: any;
  playConfetti: any;
  readGameAloud: any;
  roundWon: any;
  setLevel: any;
  setScratchColor: any;
  studentDigitalMailboxLinks: any;
  toggleArcadePassport: any;
  toggleCabinetFilter: any;
  toggleCheatConsole: any;
  toggleControlsDialog: any;
  toggleGameContrast: any;
  toggleGameLanguage: any;
  toggleGamePause: any;
  toggleGameSound: any;
  toggleGradingConsole: any;
  toggleMathScratchpad: any;
  toggleVoiceInput: any;
  winGame: any;
  winLevel: any;
}

declare var $: any;
declare var AudioSynth: any;
declare var CURRICULUM_SYNC: any;
declare var CurriculumCockpit: any;
declare var CurriculumHub: any;
declare var CurriculumLiveSignal: any;
declare var CurriculumNextMove: any;
declare var CurriculumProgressBridge: any;
declare var CurriculumTeacherPlanning: any;
declare var DeviceOrientationEvent: any;
declare var EDUPULSE_CONFIG: any;
declare var EWLAdapt: any;
declare var EWLLearningSupports: any;
declare var EWLPeerRelay: any;
declare var EWLScoreBridge: any;
declare var EWLSupportsAdaptations: any;
declare var EWLSupportsSchema: any;
declare var EduPulse: any;
declare var Evidence: any;
declare var EvidenceCSV: any;
declare var EvidenceReport: any;
declare var GameFX: any;
declare var GameJuice: any;
declare var Games2DData: any;
declare var LESSON_BONUS_ACTIVITIES: any;
declare var LESSON_FAMILY_HOMEWORK: any;
declare var NEFT_BRAIN_GRAPH: any;
declare var NEFT_BRAIN_TAXONOMY: any;
declare var NTAdaptive: any;
declare var NTAnswerKeyLink: any;
declare var NTChalk: any;
declare var NTCheck: any;
declare var NTComplete: any;
declare var NTDeclutter: any;
declare var NTDiscourse: any;
declare var NTEdgeTwins: any;
declare var NTFocus: any;
declare var NTFuture: any;
declare var NTHubUnits: any;
declare var NTIdentity: any;
declare var NTInkMath: any;
declare var NTJuice: any;
declare var NTKit: any;
declare var NTLiveSim: any;
declare var NTMentor: any;
declare var NTMentorAvatar: any;
declare var NTMentorRoster: any;
declare var NTMeta: any;
declare var NTPassport: any;
declare var NTProcessTelemetry: any;
declare var NTReasoningReplay: any;
declare var NTResults: any;
declare var NTSignal: any;
declare var NTSkeptic: any;
declare var NTSync: any;
declare var NTUsage: any;
declare var NTVoiceLesson: any;
declare var NTWebVitalsContract: any;
declare var NT_ACTIVITY: any;
declare var NT_ADAPTIVE_AUTOSTART: any;
declare var NT_GRADE_ITEMS: any;
declare var NT_LESSON_LEVEL: any;
declare var NT_LESSON_STANDARD: any;
declare var NT_MISCONCEPTIONS: any;
declare var NT_MUTED: any;
declare var NT_PRIOR_ITEMS: any;
declare var NT_SYNC: any;
declare var NT_TELEMETRY_CONFIG: any;
declare var NT_UNIT_THEME: any;
declare var NTa11y: any;
declare var NTtelemetry: any;
declare var NeftAwardStudio: any;
declare var NeftBrain: any;
declare var NeftCalm: any;
declare var NeftCanvasBridge: any;
declare var NeftCanvasBridgeConfig: any;
declare var NeftCanvasCodeUI: any;
declare var NeftCanvasCodec: any;
declare var NeftDocx: any;
declare var NeftFutures: any;
declare var NeftGradeCore: any;
declare var NeftHintLadder: any;
declare var NeftIdentity: any;
declare var NeftLessonPlatform: any;
declare var NeftLineGrapher: any;
declare var NeftManips: any;
declare var NeftPrint: any;
declare var NeftSaveResume: any;
declare var NeftSaveResumeConfig: any;
declare var NeftScore: any;
declare var NeftScorm: any;
declare var NeftTheme: any;
declare var NeftTutor: any;
declare var P3D: any;
declare var PK: any;
declare var PKTabs: any;
declare var Phaser: any;
declare var ProjectPublication: any;
declare var REVEAL_MATH_CLUSTERS: any;
declare var REVEAL_MATH_LESSONS: any;
declare var REVEAL_MATH_UNITS: any;
declare var ROUNDS: any;
declare var S: any;
declare var StudyPack: any;
declare var WebGLRenderingContext: any;
declare var WonderPass: any;
declare var __currArrowPaging: any;
declare var __gameVisualsInit: any;
declare var __neftGameAccess: any;
declare var __ntChromeLoaded: any;
declare var __ntClearLessonAnswers: any;
declare var __ntHubIdentityBooted: any;
declare var __ntLessonClearApi: any;
declare var __ntLessonMeta: any;
declare var __ntLessonSession: any;
declare var __ntPageEnhance: any;
declare var __ntProtectedTerms: any;
declare var __ntShellGuard: any;
declare var __ntShowcaseLoaded: any;
declare var __ntlpScriptsAdded: any;
declare var __ntmLevel0Navigation: any;
declare var __nzProjectsZoom: any;
declare var __p3dBooted: any;
declare var __pkRefLightbox: any;
declare var buildReport: any;
declare var cheatAddLives: any;
declare var cheatAutoWin: any;
declare var clearScratchCanvas: any;
declare var days: any;
declare var endGame: any;
declare var ffGame: any;
declare var fireConfetti: any;
declare var game: any;
declare var goStep: any;
declare var mailboxLinkReady: any;
declare var onLevelChange: any;
declare var playConfetti: any;
declare var readGameAloud: any;
declare var roundWon: any;
declare var setLevel: any;
declare var setScratchColor: any;
declare var studentDigitalMailboxLinks: any;
declare var toggleArcadePassport: any;
declare var toggleCabinetFilter: any;
declare var toggleCheatConsole: any;
declare var toggleControlsDialog: any;
declare var toggleGameContrast: any;
declare var toggleGameLanguage: any;
declare var toggleGamePause: any;
declare var toggleGameSound: any;
declare var toggleGradingConsole: any;
declare var toggleMathScratchpad: any;
declare var toggleVoiceInput: any;
declare var winGame: any;
declare var winLevel: any;

/**
 * Browser globals the TS DOM lib does not declare.
 *
 * The webkit-prefixed pair are real: Safari and older Chrome expose speech
 * recognition and the audio context only under those names, and the code
 * deliberately falls back to them. Declaring them is not a fiction — it is the
 * platform.
 */
interface Window {
  SpeechRecognition: any;
  webkitSpeechRecognition: any;
  webkitAudioContext: any;
  /**
   * `assets/formula-popup.js` publishes this so any page that loads the popup
   * can open the vocab card for a term. It is looked up defensively
   * (`if (window.openVocabModal)`) because pages that do not load the script
   * simply will not have it.
   */
  openVocabModal?: (termOrKey: string) => void;
}

/**
 * Vite resolves side-effect CSS imports (`import "./flagship.css"`) at build
 * time; there is no type to import, so declare the shape as a module.
 */
declare module "*.css";
