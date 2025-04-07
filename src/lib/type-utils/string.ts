/**
 * @module
 * @private
 * @internal
 */

import type { Arg0, Arg1, TypeLambda } from "hkt-core";

import type { None, Some } from "./option";

export namespace Str {
  /* Cap */
  export type Cap<S extends string> = Capitalize<S>;
  export interface Cap$ extends TypeLambda<[s: string], string> {
    return: Cap<Arg0<this>>;
  }

  /* Upper */
  export type Upper<S extends string> = Uppercase<S>;
  export interface Upper$ extends TypeLambda<[s: string], string> {
    return: Upper<Arg0<this>>;
  }

  /* Lower */
  export type Lower<S extends string> = Lowercase<S>;
  export interface Lower$ extends TypeLambda<[s: string], string> {
    return: Lower<Arg0<this>>;
  }

  /* Head */
  export type Head<S extends string> = S extends `${infer C}${string}` ? C : never;
  export interface Head$ extends TypeLambda<[s: string], string> {
    return: Head<Arg0<this>>;
  }

  /* Last */
  export type Last<S extends string> = S extends `${string}${infer C}` ? C : never;
  export interface Last$ extends TypeLambda<[s: string], string> {
    return: Last<Arg0<this>>;
  }

  /* Concat */
  export type Concat<S1 extends string, S2 extends string> = `${S1}${S2}`;
  export interface Concat$$ extends TypeLambda<[s1: string, s2: string], string> {
    return: Concat<Arg0<this>, Arg1<this>>;
  }

  /* Contains */
  export type Contains<S extends string, Sub extends string> =
    S extends `${string}${Sub}${string}` ? true : false;
  export interface Contains$<Sub extends string> extends TypeLambda<[s: string], boolean> {
    return: Contains<Arg0<this>, Sub>;
  }

  /* StartsWith */
  export type StartsWith<S extends string, Prefix extends string> =
    S extends `${Prefix}${string}` ? true : false;
  export interface StartsWith$<Prefix extends string> extends TypeLambda<[s: string], boolean> {
    return: StartsWith<Arg0<this>, Prefix>;
  }

  /* EndsWith */
  export type EndsWith<S extends string, Suffix extends string> =
    S extends `${string}${Suffix}` ? true : false;
  export interface EndsWith$<Suffix extends string> extends TypeLambda<[s: string], boolean> {
    return: EndsWith<Arg0<this>, Suffix>;
  }

  /* RemovePrefix */
  export type RemovePrefix<S extends string, Prefix extends string> =
    S extends `${Prefix}${infer Rest}` ? Rest : S;
  export interface RemovePrefix$<Prefix extends string> extends TypeLambda<[s: string], string> {
    return: RemovePrefix<Arg0<this>, Prefix>;
  }
  export interface RemovePrefix$$ extends TypeLambda<[s: string, prefix: string], string> {
    return: RemovePrefix<Arg0<this>, Arg1<this>>;
  }

  /* RemoveSuffix */
  export type RemoveSuffix<S extends string, Suffix extends string> =
    S extends `${infer Rest}${Suffix}` ? Rest : S;
  export interface RemoveSuffix$<Suffix extends string> extends TypeLambda<[s: string], string> {
    return: RemoveSuffix<Arg0<this>, Suffix>;
  }
  export interface RemoveSuffix$$ extends TypeLambda<[s: string, suffix: string], string> {
    return: RemoveSuffix<Arg0<this>, Arg1<this>>;
  }

  /* Append */
  export type Append<S extends string, Suffix extends string> = `${S}${Suffix}`;
  export interface Append$<Suffix extends string> extends TypeLambda<[s: string], string> {
    return: Append<Arg0<this>, Suffix>;
  }

  /* Prepend */
  export type Prepend<S extends string, Prefix extends string> = `${Prefix}${S}`;
  export interface Prepend$<Prefix extends string> extends TypeLambda<[s: string], string> {
    return: Prepend<Arg0<this>, Prefix>;
  }

  /* Length */
  export type Length<S extends string> = _Length<S>;
  export type _Length<S extends string, Acc extends void[] = []> =
    S extends `${string}${infer Tail}` ? _Length<Tail, [...Acc, void]> : Acc["length"];
  export interface Length$ extends TypeLambda<[s: string], number> {
    return: _Length<Arg0<this>>;
  }

  /* Chars */
  export type Chars<S extends string> = _Chars<S>;
  type _Chars<S extends string, Acc extends string[] = []> =
    S extends `${infer Head}${infer Tail}` ? _Chars<Tail, [...Acc, Head]> : Acc;
  export interface Chars$ extends TypeLambda<[s: string], string[]> {
    return: Chars<Arg0<this>>;
  }

  /* ToNum */
  export type ToNum<S extends string> =
    RemoveTrailingFloatZeroes<S> extends `${infer N extends number}` ? Some<N> : None;
  export interface ToNum$ extends TypeLambda<[s: string], number> {
    return: ToNum<Arg0<this>>;
  }

  /* ToNumUnsafe */
  export type ToNumUnsafe<S extends string> =
    RemoveTrailingFloatZeroes<S> extends `${infer N extends number}` ? N : never;
  export interface ToNumUnsafe$ extends TypeLambda<[s: string], number> {
    return: ToNumUnsafe<Arg0<this>>;
  }

  /* ToBigInt */
  export type ToBigInt<S extends string> =
    RemoveTrailingFloatZeroes<S> extends `${infer N extends bigint}` ? Some<N> : None;
  export interface ToBigInt$ extends TypeLambda<[s: string], bigint> {
    return: ToBigInt<Arg0<this>>;
  }

  /* ToBigIntUnsafe */
  export type ToBigIntUnsafe<S extends string> =
    RemoveTrailingFloatZeroes<S> extends `${infer N extends bigint}` ? N : never;
  export interface ToBigIntUnsafe$ extends TypeLambda<[s: string], bigint> {
    return: ToBigIntUnsafe<Arg0<this>>;
  }
}

/**********************
 * Internal utilities *
 **********************/
type RemoveTrailingFloatZeroes<S extends string> =
  S extends "0" ? "0"
  : S extends `${infer Decimal}.` ? Decimal
  : S extends `${infer Decimal}.${infer Float}0` ? RemoveTrailingFloatZeroes<`${Decimal}.${Float}`>
  : S;
