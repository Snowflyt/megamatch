/**
 * Modified from ts-pattern
 * @module
 * @private
 * @internal
 */

import type { Identity, Pipe } from "hkt-core";

import type { All, Equals, Is, List, Obj, Primitive, Union } from "../lib/type-utils";

// ==== Modified from src/types/DeepExclude.ts ====
// https://github.com/gvergnaud/ts-pattern/blob/60af2168cf998c3d6a50fc8735a50a5009cc86bf/src/types/DeepExclude.ts
export type ExcludeDeep<T, U> = Exclude<DistributeMatchingUnions<T, U>, U>;

// ==== Modified from src/types/DistributeUnions.ts ====
// https://github.com/gvergnaud/ts-pattern/blob/60af2168cf998c3d6a50fc8735a50a5009cc86bf/src/types/DistributeUnions.ts
/**
 * DistributeMatchingUnions takes two arguments:
 * - a data structure of type `a` containing unions
 * - a pattern `p`, matching this data structure
 * and turns it into a union of all possible
 * combination of each unions contained in `a` that matches `p`.
 *
 * It does this in 3 main steps:
 *  - 1. Find all unions contained in the data structure, that matches `p`
 *    with `FindUnions<a, p>`. It returns a tree of [union, path] pairs.
 *  - 2. this tree is passed to the `Distribute` type level function,
 *    Which turns it into a union of list of `[singleValue, path]` pairs.
 *    Each list correspond to one of the possible combination of the unions
 *    found in `a`.
 *  - 3. build a data structure with the same shape as `a` for each combination
 *    and return the union of these data structures.
 *
 * @example
 * type t1 = DistributeMatchingUnions<['a' | 'b', 1 | 2], ['a', 1]>;
 * // => ['a', 1] | ['a', 2] | ['b', 1] | ['b', 2]
 *
 * type t2 = DistributeMatchingUnions<['a' | 'b', 1 | 2], ['a', unknown]>;
 * // => ['a', 1 | 2] | ['b', 1 | 2]
 */
type DistributeMatchingUnions<a, p> =
  Is.Any<a> extends true ? any : BuildMany<a, Distribute<FindUnionsMany<a, p>>>;

// FindUnionsMany :: a -> Union<a> -> PropertyKey[] -> UnionConfig[]
type FindUnionsMany<a, p, path extends PropertyKey[] = []> = Union.ToList<
  (
    p extends any ?
      IsMatching<a, p> extends true ?
        FindUnions<a, p, path>
      : []
    : never
  ) extends readonly (infer T)[] ?
    T
  : never
>;

/**
 * The reason we don't look further down the tree with lists,
 * Set and Maps is that they can be heterogeneous,
 * so matching on a A[] for a in input of (A|B)[]
 * doesn't rule anything out. You can still have
 * a (A|B)[] afterward. The same logic goes for Set and Maps.
 *
 * Kinds are types of types.
 *
 * kind UnionConfig = {
 *  cases: Union<{
 *    value: b,
 *    subUnions: UnionConfig[]
 *  }>,
 *  path: string[]
 * }
 * FindUnions :: Pattern a p => a -> p -> UnionConfig[]
 */
type FindUnions<a, p, path extends PropertyKey[] = []> =
  unknown extends p ? []
  : Is.Any<p> extends true ?
    [] // Don't try to find unions after 5 levels
  : List.Length<path> extends 5 ? []
  : Is.Union<a> extends true ?
    [
      {
        cases: a extends any ?
          {
            value: a;
            subUnions: FindUnionsMany<a, p, path>;
          }
        : never;
        path: path;
      },
    ]
  : [a, p] extends [readonly any[], readonly any[]] ?
    [a, p] extends (
      [
        readonly [infer a1, infer a2, infer a3, infer a4, infer a5],
        readonly [infer p1, infer p2, infer p3, infer p4, infer p5],
      ]
    ) ?
      [
        ...FindUnions<a1, p1, [...path, 0]>,
        ...FindUnions<a2, p2, [...path, 1]>,
        ...FindUnions<a3, p3, [...path, 2]>,
        ...FindUnions<a4, p4, [...path, 3]>,
        ...FindUnions<a5, p5, [...path, 4]>,
      ]
    : [a, p] extends (
      [
        readonly [infer a1, infer a2, infer a3, infer a4],
        readonly [infer p1, infer p2, infer p3, infer p4],
      ]
    ) ?
      [
        ...FindUnions<a1, p1, [...path, 0]>,
        ...FindUnions<a2, p2, [...path, 1]>,
        ...FindUnions<a3, p3, [...path, 2]>,
        ...FindUnions<a4, p4, [...path, 3]>,
      ]
    : [a, p] extends (
      [readonly [infer a1, infer a2, infer a3], readonly [infer p1, infer p2, infer p3]]
    ) ?
      [
        ...FindUnions<a1, p1, [...path, 0]>,
        ...FindUnions<a2, p2, [...path, 1]>,
        ...FindUnions<a3, p3, [...path, 2]>,
      ]
    : [a, p] extends [readonly [infer a1, infer a2], readonly [infer p1, infer p2]] ?
      [...FindUnions<a1, p1, [...path, 0]>, ...FindUnions<a2, p2, [...path, 1]>]
    : [a, p] extends [readonly [infer a1], readonly [infer p1]] ? FindUnions<a1, p1, [...path, 0]>
    : /**
     * Special case when matching with a variadic tuple on a regular array.
     * in this case we turn the input array `A[]` into `[] | [A, ...A[]]`
     * to remove one of these cases during DeepExclude.
     */
    p extends readonly [] | readonly [any, ...any] | readonly [...any, any] ?
      Is.StrictArray<Extract<a, readonly any[]>> extends false ?
        []
      : [
          ArrayToVariadicUnion<a, p> extends infer aUnion ?
            {
              cases: aUnion extends any ?
                {
                  value: aUnion;
                  subUnions: [];
                }
              : never;
              path: path;
            }
          : never,
        ]
    : []
  : a extends Set<any> ? []
  : a extends Map<any, any> ? []
  : [Is.PlainObject<a>, Is.PlainObject<p>] extends [true, true] ?
    List.Flatten<Obj.Values<{ [k in keyof a & keyof p]: FindUnions<a[k], p[k], [...path, k]> }>>
  : [];

type ArrayToVariadicUnion<input, excluded> = Pipe<
  | (input extends readonly [any, ...any] | readonly [...any, any] ? never : [])
  | (excluded extends readonly [...any, any] ?
      [...Extract<input, readonly any[]>, Obj.ValueOf<input>]
    : [Obj.ValueOf<input>, ...Extract<input, readonly any[]>]),
  input extends unknown[] ? Identity : List.ToReadonly$
>;

// Distribute :: UnionConfig[] -> Union<[a, path][]>
type Distribute<unions extends readonly any[]> =
  unions extends readonly [{ cases: infer cases; path: infer path }, ...infer tail] ?
    cases extends { value: infer value; subUnions: infer subUnions } ?
      [[value, path], ...Distribute<Extract<subUnions, readonly any[]>>, ...Distribute<tail>]
    : never
  : [];

// ==== Modified from src/types/BuildMany.ts ====
// https://github.com/gvergnaud/ts-pattern/blob/60af2168cf998c3d6a50fc8735a50a5009cc86bf/src/types/BuildMany.ts
// BuildMany :: DataStructure -> Union<[value, path][]> -> Union<DataStructure>
type BuildMany<data, xs extends readonly any[]> = xs extends any ? BuildOne<data, xs> : never;

// BuildOne :: DataStructure
// -> [value, path][]
// -> DataStructure
type BuildOne<data, xs extends readonly any[]> =
  xs extends [[infer value, infer path], ...infer tail] ? BuildOne<SetDeep<data, value, path>, tail>
  : data;

// SetDeep :: a -> b -> PropertyKey[] -> a
type SetDeep<data, value, path> =
  path extends readonly [infer head, ...infer tail] ?
    data extends readonly any[] ?
      data extends readonly [any, ...any] ?
        head extends number ?
          List.SetAt<data, head, SetDeep<data[head], value, tail>>
        : never
      : SetDeep<Obj.ValueOf<data>, value, tail>[]
    : data extends Set<infer a> ? Set<SetDeep<a, value, tail>>
    : data extends Map<infer k, infer v> ? Map<k, SetDeep<v, value, tail>>
    : head extends keyof data ?
      {
        [k in keyof data]-?: k extends head ? SetDeep<data[head], value, tail> : data[k];
      }
    : data
  : value;

// ==== Modified from src/types/IsMatching.ts ====
// https://github.com/gvergnaud/ts-pattern/blob/60af2168cf998c3d6a50fc8735a50a5009cc86bf/src/types/IsMatching.ts
type IsMatchingTuple<a extends readonly any[], b extends readonly any[]> =
  [a, b] extends [readonly [], readonly []] ? true
  : [a, b] extends [readonly [infer a1, ...infer aRest], readonly [infer b1, ...infer bRest]] ?
    IsMatching<a1, b1> extends true ?
      IsMatchingTuple<aRest, bRest>
    : false
  : false;

type IsMatchingArray<a extends readonly any[], b extends readonly any[]> =
  b extends readonly [] ?
    true // if b is an empty array and a is an array, the pattern matches.
  : b extends readonly [infer b1, ...infer bRest] ?
    a extends readonly [infer a1, ...infer aRest] ?
      IsMatching<a1, b1> extends true ?
        IsMatchingArray<aRest, bRest>
      : false
    : // if a is shorter than b, doesn't match
    // example: a is [], b is [any, ...any[]]
    a extends readonly [] ? false
    : IsMatching<Obj.ValueOf<a>, b1> extends true ? IsMatchingArray<a, bRest>
    : false
  : b extends readonly [...infer bInit, infer b1] ?
    a extends readonly [...infer aInit, infer a1] ?
      IsMatching<a1, b1> extends true ?
        IsMatchingArray<aInit, bInit>
      : false
    : // if a is shorter than b, doesn't match
    // example: a is [], b is [any, ...any[]]
    a extends readonly [] ? false
    : IsMatching<Obj.ValueOf<a>, b1> extends true ? IsMatchingArray<a, bInit>
    : false
  : IsMatching<Obj.ValueOf<a>, Obj.ValueOf<b>>;

type IsMatching<a, b> =
  true extends Is.Union<a> | Is.Union<b> ?
    true extends (
      b extends any ?
        a extends any ?
          IsMatching<a, b>
        : never
      : never
    ) ?
      true
    : false
  : // Special case for unknown, because this is the type
  // of the inverted `_` wildcard pattern, which should
  // match everything.
  unknown extends b ? true
  : // Special case for `{}`, because this is the type
  // of the inverted `P.nonNullable` wildcard pattern,
  // which should match all objects.
  {} extends b ? true
  : b extends Primitive ?
    // if the pattern is a primitive, we want to check if there is
    // an overlap between a and b!
    a extends b ? true
    : b extends a ? true
    : false
  : Equals<a, b> extends true ? true
  : b extends readonly any[] ?
    a extends readonly any[] ?
      // both tuples
      All<[Is.Literal<List.Length<a>>, Is.Literal<List.Length<b>>]> extends true ?
        // lengths are different
        Equals<List.Length<a>, List.Length<b>> extends false ?
          false
        : IsMatchingTuple<a, b>
      : IsMatchingArray<a, b>
    : false
  : Is.PlainObject<b> extends true ?
    true extends ( // `true extends union` means "if some cases of the a union are matching"
      a extends (
        any // loop over the `a` union
      ) ?
        [keyof b & keyof a] extends (
          [never] // if no common keys
        ) ?
          false
        : /**
         * Intentionally not using ValueOf, to avoid reaching the
         * 'type instantiation is too deep error'.
         */
        { [k in keyof b & keyof a]: IsMatching<a[k], b[k]> }[keyof b & keyof a] extends true ?
          true // all values are matching
        : false
      : never
    ) ?
      true
    : false
  : b extends a ? true
  : false;
