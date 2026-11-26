// Communication Consequence Engine scenarios, in the order the hub lists them.
import { CIVICS } from "./civics.js";
import { ROBOT } from "./robot.js";
import { SCIENCE } from "./science.js";

export const SCENARIOS = [ROBOT, SCIENCE, CIVICS];
export const scenarioById = (id) => SCENARIOS.find((s) => s.id === id) || null;
