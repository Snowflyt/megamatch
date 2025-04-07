/**
 * Type-level number operations with optimization supporting very large numbers.
 *
 * Such support might be an overkill for this repo. I place it here because I used to dive deep into
 * this topic and I just copy and paste my previous work here. :)
 * @module
 * @private
 * @internal
 */

import type { Arg0, Arg1, TypeLambda } from "hkt-core";

/** A natural number. */
export type Nat = number;
export namespace Nat {
  /* Inc */
  /**
   * Increment a natural number.
   *
   * Sig: `(n: Nat) -> Nat`
   *
   * @example
   * ```typescript
   * type _ = Nat.Inc<4356>; // => 4357
   * ```
   */
  export type Inc<N extends Nat> =
    0 extends 1 & NoInfer<N> ? Nat
    : N extends unknown ? _AddNat<N, 1>
    : never;
  /**
   * [Fn] Increment a natural number.
   *
   * Sig: `(n: Nat) -> Nat`
   *
   * @example
   * ```typescript
   * type _ = Call1<Nat.Inc$, 4356>; // => 4357
   * ```
   */
  export interface Inc$ extends TypeLambda<[n: number], number> {
    return: Inc<Arg0<this>>;
  }

  /* Dec */
  /**
   * Decrement a natural number.
   *
   * **⚠️ Warning:** {@linkcode N} must be greater than 0.
   *
   * Sig: `(n: Nat) -> Nat`
   *
   * @example
   * ```typescript
   * type _ = Nat.Dec<4356>; // => 4355
   * ```
   */
  export type Dec<N extends Nat> =
    0 extends 1 & NoInfer<N> ? Nat
    : N extends unknown ? _SubNat<N, 1>
    : never;
  /**
   * [Fn] Decrement a natural number.
   *
   * **⚠️ Warning:** `n` must be greater than 0.
   *
   * Sig: `(n: Nat) -> Nat`
   *
   * @example
   * ```typescript
   * type _ = Call1<Nat.Dec$, 4356>; // => 4355
   * ```
   */
  export interface Dec$ extends TypeLambda<[n: number], number> {
    return: Dec<Arg0<this>>;
  }

  /* Add */
  /**
   * Add two natural numbers.
   *
   * Sig: `(n1: Nat, n2: Nat) -> Nat`
   *
   * @example
   * ```typescript
   * type _ = Nat.Add<4356, 832>; // => 5188
   * ```
   */
  export type Add<N1 extends Nat, N2 extends Nat> =
    0 extends 1 & NoInfer<N1> ? Nat
    : 0 extends 1 & NoInfer<N2> ? Nat
    : N1 extends unknown ?
      N2 extends unknown ?
        _AddNat<N1, N2>
      : never
    : never;
  /**
   * [Fn] Add a natural number to another natural number.
   *
   * Sig: `[n2: Nat](n1: Nat) -> Nat`
   *
   * @example
   * ```typescript
   * type _ = Call1<Nat.Add$<832>, 4356>; // => 5188
   * ```
   */
  export interface Add$<N2 extends Nat> extends TypeLambda<[n1: number], number> {
    return: Add<Arg0<this>, N2>;
  }
  /**
   * [Fn] Add two natural numbers.
   *
   * Sig: `(n1: Nat, n2: Nat) -> Nat`
   *
   * @example
   * ```typescript
   * type _ = Call2<Nat.Add$$, 4356, 832>; // => 5188
   * ```
   */
  export interface Add$$ extends TypeLambda<[n1: number, n2: number], number> {
    return: Add<Arg0<this>, Arg1<this>>;
  }

  /* Sub */
  /**
   * Subtract two natural numbers.
   *
   * **⚠️ Warning:** {@linkcode N1} must be greater than or equal to {@linkcode N2}.
   *
   * Sig: `(n1: Nat, n2: Nat) -> Nat`
   *
   * @example
   * ```typescript
   * type _ = Nat.Sub<4356, 832>; // => 3524
   * ```
   */
  export type Sub<N1 extends Nat, N2 extends Nat> =
    0 extends 1 & NoInfer<N1> ? Nat
    : 0 extends 1 & NoInfer<N2> ? Nat
    : N1 extends unknown ?
      N2 extends unknown ?
        _SubNat<N1, N2>
      : never
    : never;
  /**
   * [Fn] Subtract a natural number to another natural number.
   *
   * **⚠️ Warning:** `n1` must be greater than or equal to `n2`.
   *
   * Sig: `[n2: Nat](n1: Nat) -> Nat`
   *
   * @example
   * ```typescript
   * type _ = Call1<Nat.Sub$<832>, 4356>; // => 3524
   * ```
   */
  export interface Sub$<N2 extends Nat> extends TypeLambda<[n1: number], number> {
    return: Sub<Arg0<this>, N2>;
  }
  /**
   * [Fn] Subtract two natural numbers.
   *
   * **⚠️ Warning:** `n1` must be greater than or equal to `n2`.
   *
   * Sig: `(n1: Nat, n2: Nat) -> Nat`
   *
   * @example
   * ```typescript
   * type _ = Call2<Nat.Sub$$, 4356, 832>; // => 3524
   * ```
   */
  export interface Sub$$ extends TypeLambda<[n1: number, n2: number], number> {
    return: Sub<Arg0<this>, Arg1<this>>;
  }

  /* Gt */
  export type Gt<N1 extends Nat, N2 extends Nat> =
    0 extends 1 & NoInfer<N1> ? boolean
    : 0 extends 1 & NoInfer<N2> ? boolean
    : N1 extends unknown ?
      N2 extends unknown ?
        _CompareNat<N1, N2> extends 1 ?
          true
        : false
      : never
    : never;
  export interface Gt$<N2 extends Nat> extends TypeLambda<[n1: number], boolean> {
    return: Gt<Arg0<this>, N2>;
  }
  export interface Gt$$ extends TypeLambda<[n1: number, n2: number], boolean> {
    return: Gt<Arg0<this>, Arg1<this>>;
  }

  /* Gte */
  export type Gte<N1 extends Nat, N2 extends Nat> =
    0 extends 1 & NoInfer<N1> ? boolean
    : 0 extends 1 & NoInfer<N2> ? boolean
    : N1 extends unknown ?
      N2 extends unknown ?
        _CompareNat<N1, N2> extends 1 | 0 ?
          true
        : false
      : never
    : never;
  export interface Gte$<N2 extends Nat> extends TypeLambda<[n1: number], boolean> {
    return: Gte<Arg0<this>, N2>;
  }
  export interface Gte$$ extends TypeLambda<[n1: number, n2: number], boolean> {
    return: Gte<Arg0<this>, Arg1<this>>;
  }

  /* Lt */
  export type Lt<N1 extends Nat, N2 extends Nat> =
    0 extends 1 & NoInfer<N1> ? boolean
    : 0 extends 1 & NoInfer<N2> ? boolean
    : N1 extends unknown ?
      N2 extends unknown ?
        _CompareNat<N1, N2> extends -1 ?
          true
        : false
      : never
    : never;
  export interface Lt$<N2 extends Nat> extends TypeLambda<[n1: number], boolean> {
    return: Lt<Arg0<this>, N2>;
  }
  export interface Lt$$ extends TypeLambda<[n1: number, n2: number], boolean> {
    return: Lt<Arg0<this>, Arg1<this>>;
  }

  /* Lte */
  export type Lte<N1 extends Nat, N2 extends Nat> =
    0 extends 1 & NoInfer<N1> ? boolean
    : 0 extends 1 & NoInfer<N2> ? boolean
    : N1 extends unknown ?
      N2 extends unknown ?
        _CompareNat<N1, N2> extends -1 | 0 ?
          true
        : false
      : never
    : never;
  export interface Lte$<N2 extends Nat> extends TypeLambda<[n1: number], boolean> {
    return: Lte<Arg0<this>, N2>;
  }
  export interface Lte$$ extends TypeLambda<[n1: number, n2: number], boolean> {
    return: Lte<Arg0<this>, Arg1<this>>;
  }
}

/** An integer. */
export type Int = number;
export namespace Int {
  /* Add */
  /**
   * Add two integers.
   *
   * Sig: `(n1: Int, n2: Int) -> Int`
   *
   * @example
   * ```typescript
   * type _ = Int.Add<4356, 832>; // => 5188
   * ```
   */
  export type Add<N1 extends Int, N2 extends Int> =
    0 extends 1 & NoInfer<N1> ? Nat
    : 0 extends 1 & NoInfer<N2> ? Nat
    : N1 extends unknown ?
      N2 extends unknown ?
        _AddInt<N1, N2>
      : never
    : never;

  /**
   * [Fn] Add an integer to another integer.
   *
   * Sig: `[n2: Int](n1: Int) -> Int`
   *
   * @example
   * ```typescript
   * type _ = Call1<Int.Add$<832>, 4356>; // => 5188
   * ```
   */
  export interface Add$<N2 extends Int> extends TypeLambda<[n1: Int], Int> {
    return: Add<Arg0<this>, N2>;
  }
  /**
   * [Fn] Add two integers.
   *
   * Sig: `(n1: Int, n2: Int) -> Int`
   *
   * @example
   * ```typescript
   * type _ = Call2<Int.Add$$, 4356, 832>; // => 5188
   * ```
   */
  export interface Add$$ extends TypeLambda<[n1: Int, n2: Int], Int> {
    return: Add<Arg0<this>, Arg1<this>>;
  }

  /* Sub */
  /**
   * Subtract two integers.
   *
   * Sig: `(n1: Int, n2: Int) -> Int`
   *
   * @example
   * ```typescript
   * type _ = Num.Sub<4356, 832>; // => 3524
   * ```
   */
  export type Sub<N1 extends Int, N2 extends Int> =
    0 extends 1 & NoInfer<N1> ? Nat
    : 0 extends 1 & NoInfer<N2> ? Nat
    : N1 extends unknown ?
      N2 extends unknown ?
        _SubInt<N1, N2>
      : never
    : never;
  /**
   * [Fn] Subtract an integer to another integer.
   *
   * Sig: `[n2: Int](n1: Int) -> Int`
   *
   * @example
   * ```typescript
   * type _ = Call1<Int.Sub$<832>, 4356>; // => 3524
   * ```
   */
  export interface Sub$<N2 extends Int> extends TypeLambda<[n1: Int], Int> {
    return: Sub<Arg0<this>, N2>;
  }
  /**
   * [Fn] Subtract two integers.
   *
   * Sig: `(n1: Int, n2: Int) -> Int`
   *
   * @example
   * ```typescript
   * type _ = Call2<Int.Sub$$, 4356, 832>; // => 3524
   * ```
   */
  export interface Sub$$ extends TypeLambda<[n1: Int, n2: Int], Int> {
    return: Sub<Arg0<this>, Arg1<this>>;
  }
}

/**********************
 * Internal utilities *
 **********************/
/**
 * Convert a string to a number.
 */
type _StrToNum<S extends string> = S extends `${infer N extends number}` ? N : never;

/**
 * Convert a string representation of a number to a list of its digits.
 *
 * If the string representation is shorter than the length of {@linkcode LengthAtLeast}, it is
 * padded with zeroes on the higher-order end.
 *
 * @example
 * ```typescript
 * type _1 = _ToDigits<"512", "12345">; // => [0, 0, 5, 1, 2]
 * type _2 = _ToDigits<"512", "12">; // => [5, 1, 2]
 * ```
 */
type _ToDigits<S extends string, LengthAtLeast extends string, Acc extends number[] = []> =
  S extends `${infer Char}${infer Rest}` ?
    LengthAtLeast extends `${string}${infer LengthRest}` ?
      _ToDigits<Rest, LengthRest, [...Acc, _StrToNum<Char>]>
    : _ToDigits<Rest, "", [...Acc, _StrToNum<Char>]>
  : LengthAtLeast extends `${string}${infer LengthRest}` ? _ToDigits<"", LengthRest, [0, ...Acc]>
  : Acc;

/**
 * Like {@linkcode _ToDigits}, but in reverse order.
 *
 * @example
 * ```typescript
 * type _1 = _ToDigitsRev<"512", "12345">; // => [2, 1, 5, 0, 0]
 * type _2 = _ToDigitsRev<"512", "12">; // => [2, 1, 5]
 * ```
 */
type _ToDigitsRev<S extends string, LengthAtLeast extends string, Acc extends number[] = []> =
  S extends `${infer Char}${infer Rest}` ?
    LengthAtLeast extends `${string}${infer LengthRest}` ?
      _ToDigitsRev<Rest, LengthRest, [_StrToNum<Char>, ...Acc]>
    : _ToDigitsRev<Rest, "", [_StrToNum<Char>, ...Acc]>
  : LengthAtLeast extends `${string}${infer LengthRest}` ? _ToDigitsRev<"", LengthRest, [...Acc, 0]>
  : Acc;

/**
 * Like {@linkcode _ToDigits}, but faster and without padding.
 */
type _FastToDigits<S extends string, Acc extends number[] = []> =
  S extends `${infer Char}${infer Rest}` ? _FastToDigits<Rest, [...Acc, _StrToNum<Char>]> : Acc;

/**
 * Add two natural numbers.
 */
type _AddNat<N1 extends number, N2 extends number> = AddDigits<
  _ToDigitsRev<`${N1}`, `${N2}`>,
  _ToDigitsRev<`${N2}`, `${N1}`>
>;
type AddDigits<
  N1 extends number[],
  N2 extends number[],
  Carry extends number = 0,
  Acc extends string = "",
> =
  [N1, N2] extends (
    [
      [infer D1 extends number, ...infer RestDigits1 extends number[]],
      [infer D2 extends number, ...infer RestDigits2 extends number[]],
    ]
  ) ?
    AddDigits<
      RestDigits1,
      RestDigits2,
      AddMatrix[CarryMatrix[D1][D2]][CarryMatrix[AddMatrix[D1][D2]][Carry]],
      `${AddMatrix[AddMatrix[D1][D2]][Carry]}${Acc}`
    >
  : Carry extends 1 ? _StrToNum<`1${Acc}`>
  : _StrToNum<Acc>;
type AddMatrix = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  [1, 2, 3, 4, 5, 6, 7, 8, 9, 0],
  [2, 3, 4, 5, 6, 7, 8, 9, 0, 1],
  [3, 4, 5, 6, 7, 8, 9, 0, 1, 2],
  [4, 5, 6, 7, 8, 9, 0, 1, 2, 3],
  [5, 6, 7, 8, 9, 0, 1, 2, 3, 4],
  [6, 7, 8, 9, 0, 1, 2, 3, 4, 5],
  [7, 8, 9, 0, 1, 2, 3, 4, 5, 6],
  [8, 9, 0, 1, 2, 3, 4, 5, 6, 7],
  [9, 0, 1, 2, 3, 4, 5, 6, 7, 8],
];
type CarryMatrix = [
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [0, 0, 0, 0, 0, 0, 0, 0, 1, 1],
  [0, 0, 0, 0, 0, 0, 0, 1, 1, 1],
  [0, 0, 0, 0, 0, 0, 1, 1, 1, 1],
  [0, 0, 0, 0, 0, 1, 1, 1, 1, 1],
  [0, 0, 0, 0, 1, 1, 1, 1, 1, 1],
  [0, 0, 0, 1, 1, 1, 1, 1, 1, 1],
  [0, 0, 1, 1, 1, 1, 1, 1, 1, 1],
  [0, 1, 1, 1, 1, 1, 1, 1, 1, 1],
];

/**
 * Subtract two natural numbers.
 *
 * **⚠️ Warning:** {@linkcode N1} must be greater than or equal to {@linkcode N2}.
 */
type _SubNat<N1 extends number, N2 extends number> = SubDigits<
  _ToDigitsRev<`${N1}`, `${N2}`>,
  _ToDigitsRev<`${N2}`, `${N1}`>
>;
type SubDigits<
  N1 extends number[],
  N2 extends number[],
  Borrow extends number = 0,
  Acc extends string = "",
> =
  [N1, N2] extends (
    [
      [infer D1 extends number, ...infer RestDigits1 extends number[]],
      [infer D2 extends number, ...infer RestDigits2 extends number[]],
    ]
  ) ?
    SubDigits<
      RestDigits1,
      RestDigits2,
      SubMatrix[BorrowMatrix[D1][D2]][BorrowMatrix[SubMatrix[D1][D2]][Borrow]],
      `${SubMatrix[SubMatrix[D1][D2]][Borrow]}${Acc}`
    >
  : RemovePaddingZeroes<Acc> extends "" ? 0
  : _StrToNum<RemovePaddingZeroes<Acc>>;
type SubMatrix = [
  [0, 9, 8, 7, 6, 5, 4, 3, 2, 1],
  [1, 0, 9, 8, 7, 6, 5, 4, 3, 2],
  [2, 1, 0, 9, 8, 7, 6, 5, 4, 3],
  [3, 2, 1, 0, 9, 8, 7, 6, 5, 4],
  [4, 3, 2, 1, 0, 9, 8, 7, 6, 5],
  [5, 4, 3, 2, 1, 0, 9, 8, 7, 6],
  [6, 5, 4, 3, 2, 1, 0, 9, 8, 7],
  [7, 6, 5, 4, 3, 2, 1, 0, 9, 8],
  [8, 7, 6, 5, 4, 3, 2, 1, 0, 9],
  [9, 8, 7, 6, 5, 4, 3, 2, 1, 0],
];
type BorrowMatrix = [
  [0, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  [0, 0, 1, 1, 1, 1, 1, 1, 1, 1],
  [0, 0, 0, 1, 1, 1, 1, 1, 1, 1],
  [0, 0, 0, 0, 1, 1, 1, 1, 1, 1],
  [0, 0, 0, 0, 0, 1, 1, 1, 1, 1],
  [0, 0, 0, 0, 0, 0, 1, 1, 1, 1],
  [0, 0, 0, 0, 0, 0, 0, 1, 1, 1],
  [0, 0, 0, 0, 0, 0, 0, 0, 1, 1],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
];
type RemovePaddingZeroes<S extends string> =
  S extends `0${infer Rest}` ? RemovePaddingZeroes<Rest> : S;

/**
 * Returns the absolute value of a number.
 */
type _Abs<N extends number> = `${N}` extends `-${infer M extends number}` ? M : N;

/**
 * Check if a number is negative.
 */
type _IsNeg<N extends number> = `${N}` extends `-${string}` ? true : false;

/**
 * Add two integers.
 */
type _AddInt<N1 extends number, N2 extends number> =
  _IsNeg<N1> extends true ?
    _IsNeg<N2> extends true ? _StrToNum<`-${_AddNat<_Abs<N1>, _Abs<N2>>}`>
    : _CompareNat<_Abs<N1>, N2> extends 1 ? _StrToNum<`-${_SubNat<_Abs<N1>, N2>}`>
    : _SubNat<N2, _Abs<N1>>
  : _IsNeg<N2> extends true ?
    _CompareNat<N1, _Abs<N2>> extends -1 ?
      _StrToNum<`-${_SubNat<_Abs<N2>, N1>}`>
    : _SubNat<N1, _Abs<N2>>
  : _AddNat<N1, N2>;

/**
 * Add two integers.
 */
type _SubInt<N1 extends number, N2 extends number> =
  _IsNeg<N1> extends true ?
    _IsNeg<N2> extends true ?
      _CompareNat<_Abs<N1>, _Abs<N2>> extends 1 ?
        _StrToNum<`-${_SubNat<_Abs<N1>, _Abs<N2>>}`>
      : _SubNat<_Abs<N2>, _Abs<N1>>
    : _StrToNum<`-${_AddNat<_Abs<N1>, N2>}`>
  : _IsNeg<N2> extends true ? _AddNat<N1, _Abs<N2>>
  : _CompareNat<N1, N2> extends -1 ? _StrToNum<`-${_SubNat<N2, N1>}`>
  : _SubNat<N1, N2>;

/**
 * Compare two natural numbers.
 */
type _CompareNat<N1 extends number, N2 extends number> =
  CompareStrLength<`${N1}`, `${N2}`> extends 1 ? 1
  : CompareStrLength<`${N1}`, `${N2}`> extends -1 ? -1
  : CompareSameLengthDigits<_FastToDigits<`${N1}`>, _FastToDigits<`${N2}`>>;
type CompareStrLength<S1 extends string, S2 extends string> =
  S1 extends `${string}${infer Rest1}` ?
    S2 extends `${string}${infer Rest2}` ?
      CompareStrLength<Rest1, Rest2>
    : 1
  : S2 extends "" ? 0
  : -1;
type DigitComparisonMatrix = [
  [0, -1, -1, -1, -1, -1, -1, -1, -1, -1],
  [1, 0, -1, -1, -1, -1, -1, -1, -1, -1],
  [1, 1, 0, -1, -1, -1, -1, -1, -1, -1],
  [1, 1, 1, 0, -1, -1, -1, -1, -1, -1],
  [1, 1, 1, 1, 0, -1, -1, -1, -1, -1],
  [1, 1, 1, 1, 1, 0, -1, -1, -1, -1],
  [1, 1, 1, 1, 1, 1, 0, -1, -1, -1],
  [1, 1, 1, 1, 1, 1, 1, 0, -1, -1],
  [1, 1, 1, 1, 1, 1, 1, 1, 0, -1],
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 0],
];
type CompareSameLengthDigits<N1 extends number[], N2 extends number[]> =
  N1 extends [infer D1 extends number, ...infer Rest1 extends number[]] ?
    N2 extends [infer D2 extends number, ...infer Rest2 extends number[]] ?
      DigitComparisonMatrix[D1][D2] extends 1 ? 1
      : DigitComparisonMatrix[D1][D2] extends -1 ? -1
      : CompareSameLengthDigits<Rest1, Rest2>
    : never
  : 0;
