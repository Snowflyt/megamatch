/**
 * @module
 * @private
 * @internal
 */

import type {
  Arg0,
  Call1W,
  Param0,
  RetType,
  TArg,
  TypeLambda,
  TypeLambda1,
  TypeLambdaG,
} from "hkt-core";

import type { Equals } from "./common";

export namespace Union {
  /* ToList */
  export type ToList<U> = _ToList<U> extends infer R extends readonly U[] ? R : never;
  type _ToList<U, Acc extends readonly unknown[] = readonly [], LastU = Last<U>> =
    [U] extends [never] ? Acc : _ToList<Exclude<U, LastU>, readonly [LastU, ...Acc]>;
  export interface ToList$ extends TypeLambdaG<["U"]> {
    signature: (union: TArg<this, "U">) => readonly TArg<this, "U">[];
    return: ToList<Arg0<this>>;
  }

  /* ToIntersection */
  export type ToIntersection<U> =
    (U extends unknown ? (k: U) => void : never) extends (k: infer I) => void ? I : never;
  export interface ToIntersection$ extends TypeLambda<[union: unknown], unknown> {
    return: ToIntersection<Arg0<this>>;
  }

  /* Last */
  export type Last<U> =
    ToIntersection<U extends unknown ? (x: U) => void : never> extends (x: infer P) => void ? P
    : never;
  export interface Last$ extends TypeLambdaG<["U"]> {
    signature: (union: TArg<this, "U">) => TArg<this, "U">;
    return: Last<Arg0<this>>;
  }

  /* Map */
  /**
   * Maps over a union type {@linkcode U} using the given function {@linkcode F}.
   *
   * **Note:** You do not need to use this in most cases, as most utilities already handle unions
   * correctly. For example, `Union.Map<1 | 2 | 3, Nat.Inc$>` is equivalent to `Nat.Inc<1 | 2 | 3>`.
   */
  export type Map<U, F extends TypeLambda1<never, unknown>> =
    U extends unknown ? Call1W<F, U> : never;
  /**
   * [Fn] Maps over a union type {@linkcode U} using the given function {@linkcode F}.
   *
   * **Note:** You do not need to use this in most cases, as most utilities already handle unions
   * correctly. For example, `Pipe<1 | 2 | 3, Union.Map$<Nat.Inc$>>` is equivalent to
   * `Pipe<1 | 2 | 3, Nat.Inc$>`.
   */
  export interface Map$<F extends TypeLambda1<never, unknown>>
    extends TypeLambda<[union: Param0<F>], RetType<F>> {
    return: Map<Arg0<this>, F>;
  }

  /* Any */
  export type Any<U, F extends TypeLambda1<never, boolean>> =
    (
      U extends unknown ?
        Call1W<F, U> extends true ?
          true
        : false
      : never
    ) extends false ?
      false
    : true;
  export interface Any$<F extends TypeLambda1<never, boolean>>
    extends TypeLambda<[union: unknown], boolean> {
    return: Any<Arg0<this>, F>;
  }

  /* AnyEqual */
  export type AnyEqual<U, T> =
    (
      U extends unknown ?
        Equals<U, T> extends true ?
          true
        : false
      : never
    ) extends false ?
      false
    : true;
  export interface AnyEqual$<T> extends TypeLambda<[union: unknown], boolean> {
    return: AnyEqual<Arg0<this>, T>;
  }

  /* AnyExtend */
  export type AnyExtend<U, T> =
    (
      U extends unknown ?
        U extends T ?
          true
        : false
      : never
    ) extends false ?
      false
    : true;
  export interface AnyExtend$<T> extends TypeLambda<[union: unknown], boolean> {
    return: AnyExtend<Arg0<this>, T>;
  }

  /* All */
  export type All<U, F extends TypeLambda1<never, boolean>> =
    false extends (
      U extends unknown ?
        Call1W<F, U> extends true ?
          true
        : false
      : never
    ) ?
      false
    : true;
  export interface All$<F extends TypeLambda1<never, boolean>>
    extends TypeLambda<[union: unknown], boolean> {
    return: All<Arg0<this>, F>;
  }

  /* AllEqual */
  export type AllEqual<U, T> =
    false extends (
      U extends unknown ?
        Equals<U, T> extends true ?
          true
        : false
      : never
    ) ?
      false
    : true;
  export interface AllEqual$<T> extends TypeLambda<[union: unknown], boolean> {
    return: AllEqual<Arg0<this>, T>;
  }

  /* AllExtend */
  export type AllExtend<U, T> =
    false extends (
      U extends unknown ?
        U extends T ?
          true
        : false
      : never
    ) ?
      false
    : true;
  export interface AllExtend$<T> extends TypeLambda<[union: unknown], boolean> {
    return: AllExtend<Arg0<this>, T>;
  }
}
