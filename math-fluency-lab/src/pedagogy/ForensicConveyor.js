export class ForensicConveyor {
    breakpoints = [];
    constructor() {
        this.registerDefaultBreakpoints();
    }
    registerDefaultBreakpoints() {
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
    inspectSubmission(numA, numB, studentInput) {
        for (const rule of this.breakpoints) {
            if (rule.predicate({ numA, numB, studentInput })) {
                return { tripped: true, rule };
            }
        }
        return { tripped: false };
    }
}
