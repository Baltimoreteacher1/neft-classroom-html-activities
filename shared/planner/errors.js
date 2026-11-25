// Planner errors live apart from the solver so browser code (render.js) never pulls the solver in.
export class PlannerError extends Error {
  constructor(message) {
    super(message);
    this.name = "PlannerError";
  }
}
