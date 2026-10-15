/**
 * Contracts for data/curriculum/matrix.json (the Matrix Dashboard, the omnibar and the Lesson Path read it).
 *
 * Deviations from the 2026-10-15 consolidation brief, each on purpose:
 *  - `domain` uses the repo's own 2025 Maryland standard domains (AT, NOS, GR, DS; MP for Unit 1's practices), not the
 *    CCSS RP/NS/EE/G/SP letters: existing curriculum alignment outranks a new naming (data/ccss-standards.json).
 *  - No `masterPackUrl`: the per-lesson downloads stay where they are; no master PDFs exist to point at.
 *  - Unit 10 is not taught and is not listed.
 */
export type Domain = "AT" | "NOS" | "GR" | "DS" | "MP";

export type TrackId = "core" | "scaffold" | "enrichment";

/** Which pages exist for a lesson. Each value is a real path on this site (checked by tools/curriculum-matrix.test.mjs). */
export interface LessonPaths {
  lesson: string;
  path?: string;
  studio?: string;
  challenge?: string;
  group1?: string;
  group2?: string;
  catchup?: string;
  session2?: string;
  learningLab?: string;
}

export interface MatrixLesson {
  id: string;
  lessonNumber: number;
  title: string;
  standards: string[];
  objective: string;
  /** The lesson's vocabulary, for search ("unit rate", "distributive property"). */
  topics: string[];
  minutes: number | null;
  hasInteractive: boolean;
  canvas: string[];
  investigations: string[];
  paths: LessonPaths;
  /** Track -> true when that track has its own page for this lesson. Core is always true. */
  tracks: Record<TrackId, boolean>;
}

export interface MatrixUnit {
  unitNumber: number;
  title: string;
  domain: Domain;
  domains: Domain[];
  lessons: MatrixLesson[];
}

export interface CurriculumMatrix {
  schemaVersion: 1;
  grade: 6;
  units: MatrixUnit[];
}
