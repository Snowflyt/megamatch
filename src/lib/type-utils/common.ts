/**
 * @module
 * @private
 * @internal
 */

import type {
  ApplyW,
  Arg0,
  Arg1,
  Call1W,
  Param0,
  Params,
  RetType,
  TypeLambda,
  TypeLambda1,
} from "hkt-core";

export type Primitive = number | boolean | string | undefined | null | symbol | bigint;

/** A type guard that narrows the type. */
export type TypeGuard<T> =
  | (true & { _tag: "TypeIs"; value: T })
  | (false & { _tag: "TypeIsNot"; value: T });

/* All */
export type All<BS extends readonly boolean[]> = BS[number] extends true ? true : false;
export interface All$ extends TypeLambda<[bs: readonly boolean[]], boolean> {
  return: All<Arg0<this>>;
}

/* And */
export type And<B1 extends boolean, B2 extends boolean> =
  B1 extends true ?
    B2 extends true ?
      true
    : false
  : false;
export interface And$<B2 extends boolean> extends TypeLambda<[b: boolean], boolean> {
  return: And<Arg0<this>, B2>;
}

/* Or */
export type Or<B1 extends boolean, B2 extends boolean> =
  B1 extends true ? true
  : B2 extends true ? true
  : false;
export interface Or$<B2 extends boolean> extends TypeLambda<[b: boolean], boolean> {
  return: Or<Arg0<this>, B2>;
}

/* Not */
export type Not<B extends boolean> = B extends true ? false : true;
export interface Not$ extends TypeLambda<[b: boolean], boolean> {
  return: Not<Arg0<this>>;
}

/* Equals */
export type Equals<T, U> =
  (<G>() => G extends T ? 1 : 2) extends <G>() => G extends U ? 1 : 2 ? true : false;
export interface Equals$<U> extends TypeLambda<[x: unknown], boolean> {
  return: Equals<Arg0<this>, U>;
}
export interface Equals$$ extends TypeLambda<[x: unknown, y: unknown], boolean> {
  return: Equals<Arg0<this>, Arg1<this>>;
}

/* Extends */
export type Extends<T, U> = T extends U ? true : false;
export interface Extends$<U> extends TypeLambda<[x: unknown], TypeGuard<U>> {
  return: Extends<Arg0<this>, U>;
}

/* IfElse */
export type IfElse<Cond extends boolean, Then extends TypeLambda1, Else extends TypeLambda1> =
  Cond extends true ? Then : Else;
export interface IfElse$<
  Cond extends TypeLambda1<never, boolean>,
  Then extends TypeLambda1<
    RetType<Cond> extends TypeGuard<infer T> ? Param0<Cond> & T : Param0<Cond>
  >,
  Else extends TypeLambda1<
    RetType<Cond> extends TypeGuard<infer T> ? Exclude<Param0<Cond>, T> : Param0<Cond>
  >,
> extends TypeLambda<
    [x: Param0<Cond>],
    | RetType<Then, [RetType<Cond> extends TypeGuard<infer T> ? Param0<Cond> & T : Param0<Cond>]>
    | RetType<
        Else,
        [RetType<Cond> extends TypeGuard<infer T> ? Exclude<Param0<Cond>, T> : Param0<Cond>]
      >
  > {
  return: Call1W<Cond, Arg0<this>> extends true ? Call1W<Then, Arg0<this>>
  : Call1W<Else, Arg0<this>>;
}

/* Converge */
type GetBranches<F extends TypeLambda> = _GetBranches<Params<F>>;
type _GetBranches<TS extends readonly unknown[]> =
  TS extends readonly [infer Head, ...infer Tail] ?
    readonly [TypeLambda1<never, Head>, ..._GetBranches<Tail>]
  : readonly [];

type GetBranch<F extends TypeLambda, I extends number> =
  GetBranches<F>[I] extends infer B extends TypeLambda1<never, unknown> ? B : never;

type GetReturnFnParamType<Branches extends readonly TypeLambda1<never, unknown>[]> =
  Branches extends (
    readonly [
      infer Head extends TypeLambda1<never, unknown>,
      ...infer Tail extends TypeLambda1<never, unknown>[],
    ]
  ) ?
    Param0<Head> & GetReturnFnParamType<Tail>
  : unknown;

type GetBranchesParams<Branches extends readonly TypeLambda1<never, unknown>[]> =
  Branches extends (
    readonly [
      infer Head extends TypeLambda1<never, unknown>,
      ...infer Tail extends TypeLambda1<never, unknown>[],
    ]
  ) ?
    readonly [Param0<Head>, ...GetBranchesParams<Tail>]
  : readonly [];

type CallBranches<Branches extends readonly TypeLambda1<never, unknown>[], T> =
  Branches extends (
    readonly [
      infer Head extends TypeLambda1<never, unknown>,
      ...infer Tail extends TypeLambda1<never, unknown>[],
    ]
  ) ?
    [Call1W<Head, T>, ...CallBranches<Tail, T>]
  : [];

type FilterOutNevers<TS extends readonly unknown[]> =
  TS extends readonly [infer Head, ...infer Tail] ?
    [Head] extends [never] ?
      FilterOutNevers<Tail>
    : readonly [Head, ...FilterOutNevers<Tail>]
  : TS;

/**
 * [Fn] Accepts a converging function and a list of branching functions and returns a new function.
 *
 * Sig: `<X1, X2, ..., A, B, ..., R>(converging: (x1: X1, x2: X2, ...) => R, ...branches: [(a: A) => X1, (b: B) => X2, ...]) => (x: A & B & ...) => R`
 */
export interface Converge<
  Converging extends TypeLambda,
  Branch1 extends GetBranch<Converging, 0> = never,
  Branch2 extends GetBranch<Converging, 1> = never,
  Branch3 extends GetBranch<Converging, 2> = never,
  Branch4 extends GetBranch<Converging, 3> = never,
> extends TypeLambda<
    [x: GetReturnFnParamType<FilterOutNevers<[Branch1, Branch2, Branch3, Branch4]>>],
    RetType<Converging, GetBranchesParams<FilterOutNevers<[Branch1, Branch2, Branch3, Branch4]>>>
  > {
  return: ApplyW<
    Converging,
    CallBranches<FilterOutNevers<[Branch1, Branch2, Branch3, Branch4]>, Arg0<this>>
  >;
}
