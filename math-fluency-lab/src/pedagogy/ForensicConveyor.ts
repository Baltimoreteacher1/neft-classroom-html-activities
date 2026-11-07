import { RationalNumber } from '../engine/RationalNumber.js';

export interface BreakpointRule {
  id: string;
  name: string;
  predicate: (input: { numA: RationalNumber; numB: RationalNumber; studentInput: RationalNumber }) => boolean;
  axiomPatch: string;
}

export class ForensicConveyor {
  private breakpoints: BreakpointRule[] = [];

  constructor() {
    this.registerDefaultBreakpoints();
  }

  private registerDefaultBreakpoints() {
    // Tripwire: "Denominator Addition Fallacy" e.g., 1/2 + 1/3 = 2/5
    this.breakpoints.push({
      id: 'DENOMINATOR_ADDITION_FALLACY',
      name: 'Independent Numerator/Denominator Addition',
      predicate: ({ numA, numB, studentInput }) => {
        const naiveNumerator = numA.n + numB.n;
        const naiveDenominator = numA.d + numB.d;
        return studentInput.n === naiveNumerator && studentInput.d === naiveDenominator;
      },
      axiomPatch: 'Fractions represent equal parts of a whole, not isolated integer pairs. Denominators must be aligned via common units prior to addition.'
    });
  }

  public inspectSubmission(
    numA: RationalNumber,
    numB: RationalNumber,
    studentInput: RationalNumber
  ): { tripped: boolean; rule?: BreakpointRule } {
    for (const rule of this.breakpoints) {
      if (rule.predicate({ numA, numB, studentInput })) {
        return { tripped: true, rule };
      }
    }
    return { tripped: false };
  }
}
