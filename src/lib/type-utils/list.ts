/**
 * @module
 * @private
 * @internal
 */

import type {
  Arg0,
  Arg1,
  Arg2,
  Call1W,
  Call2W,
  Param0,
  Param1,
  RetType,
  TArg,
  TypeLambda,
  TypeLambda1,
  TypeLambda2,
  TypeLambdaG,
} from "hkt-core";

import type { Equals } from "./common";
import type { Nat } from "./number";
import type { None, Option, Some } from "./option";
import type { Is } from "./predicate";

export namespace List {
  /******************
   * Static methods *
   ******************/
  /* Of */
  export type Of<T> = readonly [T];
  export interface Of$ extends TypeLambdaG<["T"]> {
    signature: (x: TArg<this, "T">) => readonly [TArg<this, "T">];
    return: Of<Arg0<this>>;
  }

  /* OfWritable */
  export type OfWritable<T> = [T];
  export interface OfWritable$ extends TypeLambdaG<["T"]> {
    signature: (x: TArg<this, "T">) => [TArg<this, "T">];
    return: OfWritable<Arg0<this>>;
  }

  /* OfPair */
  export type OfPair<T, U> = readonly [T, U];
  export interface OfPair$$ extends TypeLambdaG<["T", "U"]> {
    signature: (
      x: TArg<this, "T">,
      y: TArg<this, "U">,
    ) => readonly [TArg<this, "T">, TArg<this, "U">];
    return: OfPair<Arg0<this>, Arg1<this>>;
  }

  /* OfPairWritable */
  export type OfPairWritable<T, U> = [T, U];
  export interface OfPairWritable$$ extends TypeLambdaG<["T", "U"]> {
    signature: (x: TArg<this, "T">, y: TArg<this, "U">) => [TArg<this, "T">, TArg<this, "U">];
    return: OfPairWritable<Arg0<this>, Arg1<this>>;
  }

  /* Repeat */
  export type Repeat<T, N extends Nat> = _Repeat<T, N>;
  type _Repeat<T, N extends Nat, Acc extends readonly unknown[] = readonly []> =
    Acc["length"] extends N ? Acc : _Repeat<T, N, readonly [...Acc, T]>;
  export interface Repeat$<N extends Nat> extends TypeLambdaG<["T"]> {
    signature: (x: TArg<this, "T">) => readonly TArg<this, "T">[];
    return: _Repeat<Arg0<this>, N>;
  }
  export interface Repeat$$ extends TypeLambdaG<["T"]> {
    signature: (x: TArg<this, "T">, n: number) => readonly TArg<this, "T">[];
    return: _Repeat<Arg0<this>, Arg1<this>>;
  }

  /* RepeatWritable */
  export type RepeatWritable<T, N extends Nat> = _RepeatWritable<T, N>;
  type _RepeatWritable<T, N extends Nat, Acc extends unknown[] = []> =
    Acc["length"] extends N ? Acc : _RepeatWritable<T, N, [...Acc, T]>;
  export interface RepeatWritable$<N extends Nat> extends TypeLambdaG<["T"]> {
    signature: (x: TArg<this, "T">) => TArg<this, "T">[];
    return: _RepeatWritable<Arg0<this>, N>;
  }
  export interface RepeatWritable$$ extends TypeLambdaG<["T"]> {
    signature: (x: TArg<this, "T">, n: number) => TArg<this, "T">[];
    return: _RepeatWritable<Arg0<this>, Arg1<this>>;
  }

  /***********
   * Methods *
   ***********/
  /* ToReadonly */
  export type ToReadonly<TS extends unknown[]> = readonly [...TS];
  export interface ToReadonly$ extends TypeLambda<[xs: unknown[]], readonly unknown[]> {
    return: ToReadonly<Arg0<this>>;
  }

  /* ToWritable */
  export type ToWritable<TS extends readonly unknown[]> = { -readonly [K in keyof TS]: TS[K] };
  export interface ToWritable$ extends TypeLambdaG<["T"]> {
    signature: (xs: readonly TArg<this, "T">[]) => TArg<this, "T">[];
    return: ToWritable<Arg0<this>>;
  }

  /* Filter */
  export type Filter<
    TS extends readonly unknown[],
    F extends TypeLambda1<TS[number], boolean>,
  > = _Filter<TS, F>;
  type _Filter<TS, F, Acc extends readonly unknown[] = TS extends unknown[] ? [] : readonly []> =
    TS extends readonly [infer Head, ...infer Tail] ?
      Call1W<F, Head> extends true ?
        // Use `..._HeadPart` to preserve label
        _Filter<
          Tail,
          F,
          Acc extends unknown[] ? [...Acc, ..._HeadPart<TS>] : readonly [...Acc, ..._HeadPart<TS>]
        >
      : _Filter<Tail, F, Acc>
    : Acc;
  export interface Filter$<F extends TypeLambda1<never, boolean>>
    extends TypeLambda<[xs: readonly Param0<F>[]], readonly Param0<F>[]> {
    return: _Filter<Arg0<this>, F>;
  }
  export interface Filter$$ extends TypeLambdaG<["T"]> {
    signature: (
      xs: readonly TArg<this, "T">[],
      f: TypeLambda<[x: TArg<this, "T">], boolean>,
    ) => readonly TArg<this, "T">[];
    return: _Filter<Arg0<this>, Arg1<this>>;
  }

  /* Reject */
  export type Reject<
    TS extends readonly unknown[],
    F extends TypeLambda1<TS[number], boolean>,
  > = _Reject<TS, F>;
  type _Reject<TS, F, Acc extends readonly unknown[] = TS extends unknown[] ? [] : readonly []> =
    TS extends readonly [infer Head, ...infer Tail] ?
      Call1W<F, Head> extends true ?
        _Reject<Tail, F, Acc>
      : // Use `..._HeadPart` to preserve label
        _Reject<
          Tail,
          F,
          Acc extends unknown[] ? [...Acc, ..._HeadPart<TS>] : readonly [...Acc, ..._HeadPart<TS>]
        >
    : Acc;
  export interface Reject$<F extends TypeLambda1<never, boolean>>
    extends TypeLambdaG<[["T", Param0<F>]]> {
    signature: (xs: readonly TArg<this, "T">[]) => readonly TArg<this, "T">[];
    return: _Reject<Arg0<this>, F>;
  }
  export interface Reject$$ extends TypeLambdaG<["T"]> {
    signature: (
      xs: readonly TArg<this, "T">[],
      f: TypeLambda<[x: TArg<this, "T">], boolean>,
    ) => readonly TArg<this, "T">[];
    return: _Reject<Arg0<this>, Arg1<this>>;
  }

  /* Map */
  export type Map<TS extends readonly unknown[], F extends TypeLambda1<TS[number], unknown>> = _Map<
    F,
    TS
  >;
  type _Map<TS, F> = { [K in keyof TS]: Call1W<F, TS[K]> };
  export interface Map$<F extends TypeLambda1<never, unknown>>
    extends TypeLambda<[xs: readonly Param0<F>[]], readonly RetType<F>[]> {
    return: _Map<Arg0<this>, F>;
  }
  export interface Map$$ extends TypeLambdaG<["T", "U"]> {
    signature: (
      xs: readonly TArg<this, "T">[],
      f: TypeLambda<[x: TArg<this, "T">], TArg<this, "U">>,
    ) => readonly TArg<this, "U">[];
    return: _Map<Arg0<this>, Arg1<this>>;
  }

  /* Flatten */
  export type Flatten<TS extends readonly unknown[]> = _Flatten<TS>;
  type _Flatten<
    TS extends readonly unknown[],
    Acc extends readonly unknown[] = TS extends unknown[] ? [] : readonly [],
  > =
    TS extends readonly [infer Head, ...infer Tail] ?
      _Flatten<
        Tail,
        Acc extends unknown[] ? [...Acc, ...Extract<Head, readonly unknown[]>]
        : readonly [...Acc, ...Extract<Head, readonly unknown[]>]
      >
    : Acc;
  export interface Flatten$ extends TypeLambdaG<["T"]> {
    signature: (xs: readonly (readonly TArg<this, "T">[])[]) => readonly TArg<this, "T">[];
    return: _Flatten<Arg0<this>>;
  }

  /* FlatMap */
  export type FlatMap<
    TS extends readonly unknown[],
    F extends TypeLambda1<TS[number], readonly unknown[]>,
  > = _FlatMap<TS, F>;
  type _FlatMap<TS, F> = _FoldL<TS extends unknown[] ? [] : readonly [], ConcatW$$, _Map<F, TS>>;
  export interface FlatMap$<F extends TypeLambda1<never, readonly unknown[]>>
    extends TypeLambda<[xs: readonly Param0<F>[]], readonly RetType<F>[]> {
    return: _FlatMap<F, Arg0<this>>;
  }
  export interface FlatMap$$ extends TypeLambdaG<["T", "U"]> {
    signature: (
      f: TypeLambda<[x: TArg<this, "T">], readonly TArg<this, "U">[]>,
      xs: readonly TArg<this, "T">[],
    ) => readonly TArg<this, "U">[];
    return: _FlatMap<Arg0<this>, Arg1<this>>;
  }

  /* Count */
  export type Count<TS extends readonly unknown[], T> = _Count<TS, T>;
  type _Count<TS, T, Counter extends void[] = []> =
    TS extends readonly [infer Head, ...infer Tail] ?
      Equals<T, Head> extends true ?
        _Count<Tail, T, [...Counter, void]>
      : _Count<Tail, T, Counter>
    : Counter["length"];
  export interface Count$<T> extends TypeLambda<[xs: readonly T[]], number> {
    return: _Count<Arg0<this>, T>;
  }
  export interface Count$$ extends TypeLambdaG<["T"]> {
    signature: (xs: readonly TArg<this, "T">[], x: TArg<this, "T">) => number;
    return: _Count<Arg0<this>, Arg1<this>>;
  }

  /* CountBy */
  export type CountBy<
    TS extends readonly unknown[],
    F extends TypeLambda1<TS[number], boolean>,
  > = _CountBy<TS, F>;
  type _CountBy<TS, F, Counter extends void[] = []> =
    TS extends readonly [infer Head, ...infer Tail] ?
      Call1W<F, Head> extends true ?
        _CountBy<Tail, F, [...Counter, void]>
      : _CountBy<Tail, F, Counter>
    : Counter["length"];
  export interface CountBy$<F extends TypeLambda1<never, boolean>> extends TypeLambdaG<["T"]> {
    signature: (xs: readonly TArg<this, "T">[]) => number;
    return: _CountBy<Arg0<this>, F>;
  }
  export interface CountBy$$ extends TypeLambdaG<["T"]> {
    signature: (
      xs: readonly TArg<this, "T">[],
      f: TypeLambda<[x: TArg<this, "T">], boolean>,
    ) => number;
    return: _CountBy<Arg0<this>, Arg1<this>>;
  }

  /* Any */
  export type Any<TS extends readonly unknown[], F extends TypeLambda1<TS[number], boolean>> = _Any<
    TS,
    F
  >;
  type _Any<TS, F> =
    TS extends readonly [infer Head, ...infer Tail] ?
      Call1W<F, Head> extends true ?
        true
      : _Any<Tail, F>
    : false;
  export interface Any$<F extends TypeLambda1<never, boolean>>
    extends TypeLambda<[xs: readonly Param0<F>[]], boolean> {
    return: _Any<Arg0<this>, F>;
  }

  /* All */
  export type All<TS extends readonly unknown[], F extends TypeLambda1<TS[number], boolean>> = _All<
    TS,
    F
  >;
  type _All<TS, F> =
    TS extends readonly [infer Head, ...infer Tail] ?
      Call1W<F, Head> extends true ?
        _All<Tail, F>
      : false
    : true;
  export interface All$<F extends TypeLambda1<never, boolean>>
    extends TypeLambda<[xs: readonly Param0<F>[]], boolean> {
    return: _All<Arg0<this>, F>;
  }

  /* FoldL(eft) */
  export type FoldL<
    TS extends readonly unknown[],
    F extends TypeLambda2<never, TS[number]>,
    Init extends Param0<F>,
  > = _FoldL<TS, F, Init>;
  type _FoldL<TS, F, Acc> =
    TS extends readonly [infer Head, ...infer Tail] ? _FoldL<Tail, F, Call2W<F, Acc, Head>> : Acc;
  export interface FoldL$<F extends TypeLambda2, Init extends Param0<F>>
    extends TypeLambda<[xs: readonly Param1<F>[]], Param0<F>> {
    return: _FoldL<F, Arg0<this>, Init>;
  }
  export interface FoldL$$$ extends TypeLambdaG<["T", "U"]> {
    signature: (
      xs: readonly TArg<this, "T">[],
      f: TypeLambda<[acc: TArg<this, "U">, x: TArg<this, "T">], TArg<this, "U">>,
      init: TArg<this, "U">,
    ) => TArg<this, "U">;
    return: _FoldL<Arg0<this>, Arg1<this>, Arg2<this>>;
  }

  /* Take */
  export type Take<TS extends readonly unknown[], N extends Nat> =
    Is.Tuple<TS> extends true ? _Take<TS, N> : TS;
  type _Take<
    TS extends readonly unknown[],
    N extends number,
    Counter extends void[] = [],
    Acc extends readonly unknown[] = TS extends unknown[] ? [] : readonly [],
  > =
    TS extends readonly [infer Head, ...infer Tail] ?
      Counter["length"] extends N ?
        Acc
      : _Take<
          Tail,
          N,
          [...Counter, void],
          Acc extends unknown[] ? [...Acc, Head] : readonly [Head, ...Acc]
        >
    : Acc;
  export interface Take$<N extends number> extends TypeLambdaG<["T"]> {
    signature: (xs: readonly TArg<this, "T">[]) => readonly TArg<this, "T">[];
    return: Take<Arg0<this>, N>;
  }
  export interface Take$$ extends TypeLambdaG<["T"]> {
    signature: (xs: readonly TArg<this, "T">[], n: number) => readonly TArg<this, "T">[];
    return: Take<Arg0<this>, Arg1<this>>;
  }

  /* TakeLast */
  export type TakeLast<TS extends readonly unknown[], N extends Nat> =
    Is.Tuple<TS> extends true ? _TakeLast<TS, N> : TS;
  type _TakeLast<
    TS extends readonly unknown[],
    N extends number,
    Counter extends void[] = [],
    Acc extends readonly unknown[] = TS extends unknown[] ? [] : readonly [],
  > =
    TS extends readonly [...infer Init, infer Last] ?
      Counter["length"] extends N ?
        Acc
      : _TakeLast<
          Init,
          N,
          [...Counter, void],
          Acc extends unknown[] ? [Last, ...Acc] : readonly [Last, ...Acc]
        >
    : Acc;
  export interface TakeLast$<N extends number> extends TypeLambdaG<["T"]> {
    signature: (xs: readonly TArg<this, "T">[]) => readonly TArg<this, "T">[];
    return: TakeLast<Arg0<this>, N>;
  }
  export interface TakeLast$$ extends TypeLambdaG<["T"]> {
    signature: (xs: readonly TArg<this, "T">[], n: number) => readonly TArg<this, "T">[];
    return: TakeLast<Arg0<this>, Arg1<this>>;
  }

  /* TakeWhile */
  export type TakeWhile<
    TS extends readonly unknown[],
    F extends TypeLambda1<TS[number], boolean>,
  > = TakeWhileW<TS, F>;
  type TakeWhileW<TS extends readonly unknown[], F> =
    Is.Tuple<TS> extends true ? _TakeWhile<TS, F>
    : Call1W<F, TS[number]> extends true ? TS
    : TS extends unknown[] ? []
    : readonly [];
  type _TakeWhile<TS, F, Acc extends readonly unknown[] = TS extends unknown[] ? [] : readonly []> =
    TS extends readonly [infer Head, ...infer Tail] ?
      Call1W<F, Head> extends true ?
        _TakeWhile<Tail, F, Acc extends unknown[] ? [...Acc, Head] : readonly [Head, ...Acc]>
      : Acc
    : Acc;
  export interface TakeWhile$<F extends TypeLambda1<never, boolean>> extends TypeLambdaG<["T"]> {
    signature: (xs: readonly TArg<this, "T">[]) => readonly TArg<this, "T">[];
    return: TakeWhileW<Arg0<this>, F>;
  }
  export interface TakeWhile$$ extends TypeLambdaG<["T"]> {
    signature: (
      xs: readonly TArg<this, "T">[],
      f: TypeLambda<[x: TArg<this, "T">], boolean>,
    ) => readonly TArg<this, "T">[];
    return: TakeWhileW<Arg0<this>, Arg1<this>>;
  }

  /* TakeUntil */
  export type TakeUntil<
    TS extends readonly unknown[],
    F extends TypeLambda1<TS[number], boolean>,
  > = TakeUntilW<TS, F>;
  type TakeUntilW<TS extends readonly unknown[], F> =
    Is.Tuple<TS> extends true ? _TakeUntil<TS, F>
    : Call1W<F, TS[number]> extends false ? TS
    : TS extends unknown[] ? []
    : readonly [];
  type _TakeUntil<TS, F, Acc extends readonly unknown[] = TS extends unknown[] ? [] : readonly []> =
    TS extends readonly [infer Head, ...infer Tail] ?
      Call1W<F, Head> extends true ?
        Acc
      : _TakeUntil<Tail, F, Acc extends unknown[] ? [...Acc, Head] : readonly [Head, ...Acc]>
    : Acc;
  export interface TakeUntil$<F extends TypeLambda1<never, boolean>> extends TypeLambdaG<["T"]> {
    signature: (xs: readonly TArg<this, "T">[]) => readonly TArg<this, "T">[];
    return: TakeUntilW<Arg0<this>, F>;
  }
  export interface TakeUntil$$ extends TypeLambdaG<["T"]> {
    signature: (
      xs: readonly TArg<this, "T">[],
      f: TypeLambda<[x: TArg<this, "T">], boolean>,
    ) => readonly TArg<this, "T">[];
    return: TakeUntilW<Arg0<this>, Arg1<this>>;
  }

  /* Drop */
  export type Drop<TS extends readonly unknown[], N extends Nat> = _Drop<TS, N>;
  type _Drop<TS extends readonly unknown[], N extends number, Counter extends void[] = []> =
    TS extends readonly [unknown, ...infer Tail] ?
      Counter["length"] extends N ?
        TS extends unknown[] ?
          TS
        : readonly [...TS]
      : _Drop<TS extends unknown[] ? Tail : readonly [...Tail], N, [...Counter, void]>
    : TS;
  export interface Drop$<N extends number> extends TypeLambdaG<["T"]> {
    signature: (xs: readonly TArg<this, "T">[]) => readonly TArg<this, "T">[];
    return: _Drop<Arg0<this>, N>;
  }
  export interface Drop$$ extends TypeLambdaG<["T"]> {
    signature: (xs: readonly TArg<this, "T">[], n: number) => readonly TArg<this, "T">[];
    return: _Drop<Arg0<this>, Arg1<this>>;
  }

  /* DropLast */
  export type DropLast<TS extends readonly unknown[], N extends Nat> = _DropLast<TS, N>;
  type _DropLast<TS extends readonly unknown[], N extends number, Counter extends void[] = []> =
    TS extends readonly [...infer Init, unknown] ?
      Counter["length"] extends N ?
        TS extends unknown[] ?
          TS
        : readonly [...TS]
      : _DropLast<TS extends unknown[] ? Init : readonly [...Init], N, [...Counter, void]>
    : TS;
  export interface DropLast$<N extends number> extends TypeLambdaG<["T"]> {
    signature: (xs: readonly TArg<this, "T">[]) => readonly TArg<this, "T">[];
    return: _DropLast<Arg0<this>, N>;
  }
  export interface DropLast$$ extends TypeLambdaG<["T"]> {
    signature: (xs: readonly TArg<this, "T">[], n: number) => readonly TArg<this, "T">[];
    return: _DropLast<Arg0<this>, Arg1<this>>;
  }

  /* DropWhile */
  export type DropWhile<
    TS extends readonly unknown[],
    F extends TypeLambda1<TS[number], boolean>,
  > = _DropWhile<TS, F>;
  type _DropWhile<TS, F> =
    TS extends readonly [infer Head, ...infer Tail] ?
      Call1W<F, Head> extends true ?
        _DropWhile<Tail, F>
      : TS
    : TS;
  export interface DropWhile$<F extends TypeLambda1<never, boolean>> extends TypeLambdaG<["T"]> {
    signature: (xs: readonly TArg<this, "T">[]) => readonly TArg<this, "T">[];
    return: _DropWhile<Arg0<this>, F>;
  }
  export interface DropWhile$$ extends TypeLambdaG<["T"]> {
    signature: (
      xs: readonly TArg<this, "T">[],
      f: TypeLambda<[x: TArg<this, "T">], boolean>,
    ) => readonly TArg<this, "T">[];
    return: _DropWhile<Arg0<this>, Arg1<this>>;
  }

  /* DropUntil */
  export type DropUntil<
    TS extends readonly unknown[],
    F extends TypeLambda1<TS[number], boolean>,
  > = _DropUntil<TS, F>;
  type _DropUntil<TS, F> =
    TS extends readonly [infer Head, ...infer Tail] ?
      Call1W<F, Head> extends false ?
        _DropUntil<Tail, F>
      : TS
    : TS;
  export interface DropUntil$<F extends TypeLambda1<never, boolean>> extends TypeLambdaG<["T"]> {
    signature: (xs: readonly TArg<this, "T">[]) => readonly TArg<this, "T">[];
    return: _DropUntil<Arg0<this>, F>;
  }
  export interface DropUntil$$ extends TypeLambdaG<["T"]> {
    signature: (
      xs: readonly TArg<this, "T">[],
      f: TypeLambda<[x: TArg<this, "T">], boolean>,
    ) => readonly TArg<this, "T">[];
    return: _DropUntil<Arg0<this>, Arg1<this>>;
  }

  /* Reverse */
  export type Reverse<TS extends readonly unknown[]> = _Reverse<TS>;
  type _Reverse<
    TS extends readonly unknown[],
    Acc extends readonly unknown[] = TS extends unknown[] ? [] : readonly [],
  > =
    TS extends readonly [infer Head, ...infer Tail] ?
      _Reverse<Tail, Acc extends unknown[] ? [Head, ...Acc] : readonly [Head, ...Acc]>
    : Acc;
  export interface Reverse$ extends TypeLambdaG<["T"]> {
    signature: (xs: readonly TArg<this, "T">[]) => readonly TArg<this, "T">[];
    return: _Reverse<Arg0<this>>;
  }

  /* Append */
  export type Append<TS extends readonly unknown[], T extends TS[number]> =
    TS extends unknown[] ? [...TS, T] : readonly [...TS, T];
  export interface Append$<T> extends TypeLambda<[xs: readonly T[]], readonly T[]> {
    return: Append<Arg0<this>, T>;
  }
  export interface Append$$ extends TypeLambdaG<["T"]> {
    signature: (xs: readonly TArg<this, "T">[], x: TArg<this, "T">) => readonly TArg<this, "T">[];
    return: Append<Arg0<this>, Arg1<this>>;
  }

  /* Prepend */
  export type Prepend<TS extends readonly unknown[], T extends TS[number]> =
    TS extends unknown[] ? [T, ...TS] : readonly [T, ...TS];
  export interface Prepend$<T> extends TypeLambda<[xs: readonly T[]], readonly T[]> {
    return: Prepend<Arg0<this>, T>;
  }
  export interface Prepend$$ extends TypeLambdaG<["T"]> {
    signature: (xs: readonly TArg<this, "T">[], x: TArg<this, "T">) => readonly TArg<this, "T">[];
    return: Prepend<Arg0<this>, Arg1<this> extends readonly unknown[] ? Arg1<this> : never>;
  }

  /* Concat */
  export type Concat<TS extends readonly unknown[], US extends readonly TS[number][]> = ConcatW<
    TS,
    US
  >;
  export interface Concat$$ extends TypeLambdaG<["T"]> {
    signature: (
      xs: readonly TArg<this, "T">[],
      ys: readonly TArg<this, "T">[],
    ) => readonly TArg<this, "T">[];
    return: Concat<Arg0<this>, Arg1<this>>;
  }

  /* ConcatW */
  export type ConcatW<TS extends readonly unknown[], US extends readonly unknown[]> =
    TS extends unknown[] ? [...TS, ...US] : readonly [...TS, ...US];
  export interface ConcatW$$ extends TypeLambdaG<["T", "U"]> {
    signature: (
      xs: readonly TArg<this, "T">[],
      ys: readonly TArg<this, "U">[],
    ) => readonly (TArg<this, "T"> | TArg<this, "U">)[];
    return: ConcatW<Arg0<this>, Arg1<this>>;
  }

  /* Contains */
  export type Contains<TS extends readonly unknown[], T extends TS[number]> =
    TS extends readonly [infer Head, ...infer Tail] ?
      Equals<T, Head> extends true ?
        true
      : Contains<Tail, T>
    : false;
  export interface Contains$<T> extends TypeLambda<[xs: readonly T[]], readonly T[]> {
    return: Contains<Arg0<this>, T>;
  }
  export interface Contains$$ extends TypeLambdaG<["T"]> {
    signature: (xs: readonly TArg<this, "T">[], x: TArg<this, "T">) => boolean;
    return: Contains<Arg0<this>, Arg1<this>>;
  }

  /* Length */
  export type Length<TS extends readonly unknown[]> = TS["length"];
  export interface Length$ extends TypeLambda<[xs: readonly unknown[]], number> {
    return: Length<Arg0<this>>;
  }

  /* At */
  export type At<
    TS extends readonly [..._BuildTuple<Nat.Inc<Index>, unknown>, ...unknown[]],
    Index extends Nat,
  > = _At<TS, Index>;
  type _At<TS extends readonly unknown[], Index extends Nat, Counter extends void[] = []> =
    TS extends readonly [infer Head, ...infer Tail] ?
      Counter["length"] extends Index ?
        Head
      : _At<Tail, Index, [...Counter, void]>
    : never;
  export interface At$<Index extends Nat> extends TypeLambdaG<["T"]> {
    signature: (
      xs: readonly [..._BuildTuple<Index, unknown>, TArg<this, "T">, ...unknown[]],
    ) => TArg<this, "T">;
    return: _At<Arg0<this>, Index>;
  }

  /* AtOption */
  export type AtOption<TS extends readonly unknown[], Index extends Nat> = _AtOption<TS, Index>;
  type _AtOption<TS extends readonly unknown[], Index extends Nat, Counter extends void[] = []> =
    TS extends readonly [infer Head, ...infer Tail] ?
      Counter["length"] extends Index ?
        Some<Head>
      : _AtOption<Tail, Index, [...Counter, void]>
    : None;
  export interface AtOption$<Index extends Nat> extends TypeLambdaG<["T"]> {
    signature: (xs: readonly TArg<this, "T">[]) => Option<TArg<this, "T">>;
    return: _AtOption<Arg0<this>, Index>;
  }

  /* AtUnsafe */
  export type AtUnsafe<TS extends readonly unknown[], Index extends Nat> = _AtUnsafe<TS, Index>;
  type _AtUnsafe<TS extends readonly unknown[], Index extends Nat, Counter extends void[] = []> =
    TS extends readonly [infer Head, ...infer Tail] ?
      Counter["length"] extends Index ?
        Head
      : _AtUnsafe<Tail, Index, [...Counter, void]>
    : never;
  export interface AtUnsafe$<Index extends Nat> extends TypeLambdaG<["T"]> {
    signature: (xs: readonly TArg<this, "T">[]) => TArg<this, "T">;
    return: _AtUnsafe<Arg0<this>, Index>;
  }

  /* IndexOf */
  export type IndexOf<TS extends readonly unknown[], T> = _IndexOf<TS, T>;
  type _IndexOf<TS, T, Acc extends void[] = []> =
    TS extends readonly [infer Head, ...infer Tail] ?
      Equals<T, Head> extends true ?
        Acc["length"]
      : _IndexOf<Tail, T, [...Acc, void]>
    : -1;
  export interface IndexOf$<T> extends TypeLambda<[xs: readonly T[]], number> {
    return: _IndexOf<Arg0<this>, T>;
  }
  export interface IndexOf$$ extends TypeLambdaG<["T"]> {
    signature: (xs: readonly TArg<this, "T">[], x: TArg<this, "T">) => number;
    return: _IndexOf<Arg0<this>, Arg1<this>>;
  }

  /* Find */
  export type Find<
    TS extends readonly unknown[],
    F extends TypeLambda1<TS[number], boolean>,
  > = _Find<TS, F>;
  type _Find<TS, F> =
    TS extends readonly [infer Head, ...infer Tail] ?
      Call1W<F, Head> extends true ?
        Some<Head>
      : _Find<Tail, F>
    : None;
  export interface Find$<F extends TypeLambda1<never, boolean>> extends TypeLambdaG<["T"]> {
    signature: (xs: readonly TArg<this, "T">[]) => Option<TArg<this, "T">>;
    return: _Find<Arg0<this>, F>;
  }
  export interface Find$$ extends TypeLambdaG<["T"]> {
    signature: (
      xs: readonly TArg<this, "T">[],
      f: TypeLambda<[x: TArg<this, "T">], boolean>,
    ) => Option<TArg<this, "T">>;
    return: _Find<Arg0<this>, Arg1<this>>;
  }

  /* FindUnsafe */
  export type FindUnsafe<
    TS extends readonly unknown[],
    F extends TypeLambda1<TS[number], boolean>,
  > = _FindUnsafe<TS, F>;
  type _FindUnsafe<TS, F> =
    TS extends readonly [infer Head, ...infer Tail] ?
      Call1W<F, Head> extends true ?
        Head
      : _FindUnsafe<Tail, F>
    : never;
  export interface FindUnsafe$<F extends TypeLambda1<never, boolean>> extends TypeLambdaG<["T"]> {
    signature: (xs: readonly TArg<this, "T">[]) => TArg<this, "T">;
    return: _FindUnsafe<Arg0<this>, F>;
  }
  export interface FindUnsafe$$ extends TypeLambdaG<["T"]> {
    signature: (
      xs: readonly TArg<this, "T">[],
      f: TypeLambda<[x: TArg<this, "T">], boolean>,
    ) => TArg<this, "T">;
    return: _FindUnsafe<Arg0<this>, Arg1<this>>;
  }

  /* FindIndex */
  export type FindIndex<
    TS extends readonly unknown[],
    F extends TypeLambda1<TS[number], boolean>,
  > = _FindIndex<TS, F>;
  type _FindIndex<TS, F, Acc extends void[] = []> =
    TS extends readonly [infer Head, ...infer Tail] ?
      Call1W<F, Head> extends true ?
        Acc["length"]
      : _FindIndex<Tail, F, [...Acc, void]>
    : -1;
  export interface FindIndex$<F extends TypeLambda1<never, boolean>> extends TypeLambdaG<["T"]> {
    signature: (xs: readonly TArg<this, "T">[]) => Nat;
    return: _FindIndex<Arg0<this>, F>;
  }
  export interface FindIndex$$ extends TypeLambdaG<["T"]> {
    signature: (
      xs: readonly TArg<this, "T">[],
      f: TypeLambda<[x: TArg<this, "T">], boolean>,
    ) => Nat;
    return: _FindIndex<Arg0<this>, Arg1<this>>;
  }

  /* SetAt */
  export type SetAt<TS extends readonly unknown[], Index extends Nat, Value> = _SetAt<
    TS,
    Index,
    Value
  >;
  export type _SetAt<
    TS extends readonly unknown[],
    Index extends Nat,
    Value,
    Acc extends readonly unknown[] = TS extends unknown[] ? [] : readonly [],
  > =
    TS extends readonly [infer Head, ...infer Tail] ?
      Acc["length"] extends Index ?
        Acc extends unknown[] ?
          [...Acc, Value, ...Tail]
        : readonly [...Acc, Value, ...Tail]
      : _SetAt<Tail, Index, Value, Acc extends unknown[] ? [...Acc, Head] : readonly [...Acc, Head]>
    : TS;
  export interface SetAt$<Index extends number, Value> extends TypeLambdaG<["T"]> {
    signature: (xs: readonly TArg<this, "T">[]) => readonly (TArg<this, "T"> | Value)[];
    return: _SetAt<Arg0<this>, Index, Value>;
  }

  /* Join */
  export type Join<SS extends readonly string[], Sep extends string> = _Join<SS, Sep>;
  type _Join<SS extends readonly string[], Sep extends string, Acc extends string = ""> =
    SS extends readonly [infer Head extends string, ...infer Tail extends string[]] ?
      Tail extends [] ?
        `${Acc}${Head}`
      : _Join<Tail, Sep, `${Acc}${Head}${Sep}`>
    : Acc;
  export interface Join$<Sep extends string> extends TypeLambda<[xs: readonly string[]], string> {
    return: Join<Arg0<this>, Sep>;
  }
  export interface Join$$ extends TypeLambdaG<["T"]> {
    signature: (xs: readonly string[], sep: string) => string;
    return: Join<Arg0<this>, Arg1<this>>;
  }

  /* Head */
  export type Head<TS extends readonly [unknown, ...unknown[]]> =
    TS extends readonly [infer Head, ...unknown[]] ? Head : never;
  export interface Head$ extends TypeLambdaG<["T"]> {
    signature: (xs: readonly [TArg<this, "T">, ...unknown[]]) => TArg<this, "T">;
    return: Head<Arg0<this>>;
  }

  /* HeadOption */
  export type HeadOption<TS extends readonly unknown[]> =
    TS extends readonly [infer Head, ...unknown[]] ? Some<Head> : None;
  export interface HeadOption$ extends TypeLambdaG<["T"]> {
    signature: (xs: readonly TArg<this, "T">[]) => Option<TArg<this, "T">>;
    return: HeadOption<Arg0<this>>;
  }

  /* HeadUnsafe */
  export type HeadUnsafe<TS> =
    TS extends readonly [infer Head, ...unknown[]] ? Head
    : TS extends readonly unknown[] ? TS[number]
    : never;
  export interface HeadUnsafe$ extends TypeLambdaG<["T"]> {
    signature: (xs: readonly TArg<this, "T">[]) => TArg<this, "T">;
    return: HeadUnsafe<Arg0<this>>;
  }

  /* Tail */
  export type Tail<TS extends readonly [unknown, ...unknown[]]> =
    Is.Tuple<TS> extends false ? TS
    : TS extends readonly [unknown, ...infer Tail] ? Tail
    : never;
  export interface Tail$ extends TypeLambdaG<[["TS", unknown[]]]> {
    signature: (xs: readonly [unknown, ...TArg<this, "TS">]) => readonly [...TArg<this, "TS">];
    return: Tail<Arg0<this>>;
  }

  /* TailOption */
  export type TailOption<TS extends readonly unknown[]> =
    Is.Tuple<TS> extends false ? Some<TS>
    : TS extends readonly [unknown, ...infer Tail] ? Some<Tail>
    : None;
  export interface TailOption$ extends TypeLambdaG<["T"]> {
    signature: (xs: readonly TArg<this, "T">[]) => Option<readonly TArg<this, "T">[]>;
    return: TailOption<Arg0<this>>;
  }

  /* TailUnsafe */
  export type TailUnsafe<TS> =
    TS extends [unknown, ...infer Tail] ? Tail
    : TS extends readonly [unknown, ...infer Tail] ? { readonly [K in keyof Tail]: Tail[K] }
    : TS extends readonly [] ? never
    : TS;
  export interface TailUnsafe$ extends TypeLambdaG<["T"]> {
    signature: (xs: readonly TArg<this, "T">[]) => readonly TArg<this, "T">[];
    return: TailUnsafe<Arg0<this>>;
  }

  /* FillTemplate */
  export type _ = { __placeholder: never };
  export type FillTemplate<Template extends readonly unknown[], Fill> = {
    [K in keyof Template]: Template[K] extends _ ? Fill : Template[K];
  };
  export interface FillTemplate$<Template extends readonly unknown[]> extends TypeLambdaG<["T"]> {
    signature: (fill: TArg<this, "T">) => FillTemplate<Template, TArg<this, "T">>;
    return: FillTemplate<Template, Arg0<this>>;
  }
}

/**********************
 * Internal utilities *
 **********************/
type _Tail<TS> =
  TS extends [unknown, ...infer Tail] ? Tail
  : TS extends readonly [unknown, ...infer Tail] ? readonly [...Tail]
  : TS extends [] ? []
  : TS extends readonly [] ? readonly []
  : never;

type _Init<TS> =
  TS extends [...infer Init, unknown] ? Init
  : TS extends readonly [...infer Init, unknown] ? readonly [...Init]
  : TS extends [] ? []
  : TS extends readonly [] ? readonly []
  : never;

type _HeadPart<TS, Result = TS> =
  Result extends readonly [] | readonly [unknown] ? Result : _HeadPart<_Tail<TS>, _Init<Result>>;

type _BuildTuple<Length extends Nat, Fill, Acc extends readonly unknown[] = readonly []> =
  Acc["length"] extends Length ? Acc : _BuildTuple<Length, Fill, readonly [...Acc, Fill]>;
