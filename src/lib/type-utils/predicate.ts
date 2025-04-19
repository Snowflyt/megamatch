/**
 * @module
 * @private
 * @internal
 */

import type { Arg0, TypeLambda } from "hkt-core";

import type { Equals, Not } from "./common";
import type { Union } from "./union";

export namespace Is {
  /* IsAny */
  export type Any<T> = 0 extends 1 & T ? true : false;
  export interface Any$ extends TypeLambda<[x: unknown], boolean> {
    return: Any<Arg0<this>>;
  }

  /* IsNever */
  export type Never<T> = [T] extends [never] ? true : false;
  export interface Never$ extends TypeLambda<[x: unknown], boolean> {
    return: Never<Arg0<this>>;
  }

  /* IsLiteral */
  export type Literal<T> =
    [T] extends [null | undefined] ? true
    : [T] extends [string] ?
      string extends T ?
        false
      : true
    : [T] extends [number] ?
      number extends T ?
        false
      : true
    : [T] extends [boolean] ?
      boolean extends T ?
        false
      : true
    : [T] extends [symbol] ?
      symbol extends T ?
        false
      : true
    : [T] extends [bigint] ?
      bigint extends T ?
        false
      : true
    : false;
  export interface Literal$ extends TypeLambda<[x: unknown], boolean> {
    return: Literal<Arg0<this>>;
  }

  /* IsUnion */
  export type Union<T> = [T] extends [Union.ToIntersection<T>] ? false : true;
  export interface Union$ extends TypeLambda<[x: unknown], boolean> {
    return: Union<Arg0<this>>;
  }

  /* IsPlainObject */
  export type PlainObject<T> =
    T extends object ?
      T extends (
        | string // Branded string types (e.g., `string & { __brand: "id" }`)
        // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
        | Function
        | readonly unknown[]
        | Date // ...The rest are built-in objects
        | RegExp
        | Generator
        | { readonly [Symbol.toStringTag]: string }
      ) ?
        false
      : true
    : false;
  export interface PlainObject$ extends TypeLambda<[x: unknown], boolean> {
    return: PlainObject<Arg0<this>>;
  }

  /* IsTuple */
  export type Tuple<T extends readonly unknown[]> =
    // NOTE: We do not use `T extends readonly [] | readonly [...unknown[], unknown] | readonly [unknown, ...unknown[]]`
    // because we have to consider cases like `[number?, ...string[]]` which have no required elements
    T extends unknown[] ? Not<Equals<T, T[number][]>>
    : T extends readonly unknown[] ? Not<Equals<T, readonly T[number][]>>
    : false;
  export interface Tuple$ extends TypeLambda<[x: readonly unknown[]], boolean> {
    return: Tuple<Arg0<this>>;
  }

  /* IsStrictArray */
  export type StrictArray<T extends readonly unknown[]> = Not<Tuple<T>>;
  export interface StrictArray$ extends TypeLambda<[x: readonly unknown[]], boolean> {
    return: StrictArray<Arg0<this>>;
  }
}
