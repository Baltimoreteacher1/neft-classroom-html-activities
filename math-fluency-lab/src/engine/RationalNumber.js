/**
 * Exact Rational Arithmetic Engine
 * Enforces zero floating-point drift via continuous Euclidean GCD reduction.
 */
export class RationalNumber {
    n;
    d;
    constructor(numerator, denominator = 1n) {
        let num = BigInt(numerator);
        let den = BigInt(denominator);
        if (den === 0n) {
            throw new RangeError("DivisionByZero: Denominator cannot be zero.");
        }
        if (den < 0n) {
            num = -num;
            den = -den;
        }
        const commonGCD = RationalNumber.gcd(num < 0n ? -num : num, den);
        this.n = num / commonGCD;
        this.d = den / commonGCD;
    }
    static gcd(a, b) {
        while (b !== 0n) {
            const temp = b;
            b = a % b;
            a = temp;
        }
        return a;
    }
    add(rhs) {
        return new RationalNumber(this.n * rhs.d + rhs.n * this.d, this.d * rhs.d);
    }
    sub(rhs) {
        return new RationalNumber(this.n * rhs.d - rhs.n * this.d, this.d * rhs.d);
    }
    mul(rhs) {
        return new RationalNumber(this.n * rhs.n, this.d * rhs.d);
    }
    div(rhs) {
        if (rhs.n === 0n) {
            throw new RangeError("DivisionByZero: Cannot divide by zero fraction.");
        }
        return new RationalNumber(this.n * rhs.d, this.d * rhs.n);
    }
    equals(rhs) {
        return this.n === rhs.n && this.d === rhs.d;
    }
    toDecimal() {
        return Number(this.n) / Number(this.d);
    }
    toString() {
        return this.d === 1n ? `${this.n}` : `${this.n}/${this.d}`;
    }
}
