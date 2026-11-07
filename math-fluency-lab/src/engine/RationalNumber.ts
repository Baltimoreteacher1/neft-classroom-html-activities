/**
 * Exact Rational Arithmetic Engine
 * Enforces zero floating-point drift via continuous Euclidean GCD reduction.
 */
export class RationalNumber {
  public readonly n: bigint;
  public readonly d: bigint;

  constructor(numerator: bigint | number, denominator: bigint | number = 1n) {
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

  private static gcd(a: bigint, b: bigint): bigint {
    while (b !== 0n) {
      const temp = b;
      b = a % b;
      a = temp;
    }
    return a;
  }

  public add(rhs: RationalNumber): RationalNumber {
    return new RationalNumber(
      this.n * rhs.d + rhs.n * this.d,
      this.d * rhs.d
    );
  }

  public sub(rhs: RationalNumber): RationalNumber {
    return new RationalNumber(
      this.n * rhs.d - rhs.n * this.d,
      this.d * rhs.d
    );
  }

  public mul(rhs: RationalNumber): RationalNumber {
    return new RationalNumber(
      this.n * rhs.n,
      this.d * rhs.d
    );
  }

  public div(rhs: RationalNumber): RationalNumber {
    if (rhs.n === 0n) {
      throw new RangeError("DivisionByZero: Cannot divide by zero fraction.");
    }
    return new RationalNumber(
      this.n * rhs.d,
      this.d * rhs.n
    );
  }

  public equals(rhs: RationalNumber): boolean {
    return this.n === rhs.n && this.d === rhs.d;
  }

  public toDecimal(): number {
    return Number(this.n) / Number(this.d);
  }

  public toString(): string {
    return this.d === 1n ? `${this.n}` : `${this.n}/${this.d}`;
  }
}
