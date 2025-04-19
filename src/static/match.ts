/**
 * @module
 * @private
 * @internal
 */

import type { Pipe } from "hkt-core";

import type {
  Extends,
  Extends$,
  Is,
  List,
  Nat,
  Not,
  Obj,
  Option,
  Or,
  Str,
  Union,
} from "../lib/type-utils";
import type { Node } from "../types";

type MatchResult<T = unknown> = { matched: T; args: unknown[] };

/**
 * Get the base type of a {@linkcode Node}.
 */
export type BaseType<N extends Node, Readonly extends boolean = true> =
  N extends [type: "NullLiteral"] ? null
  : N extends [type: "UndefinedLiteral"] ? undefined
  : N extends [type: "BooleanLiteral", value: infer T extends boolean] ? T
  : N extends [type: "BigIntLiteral", value: infer T extends bigint] ? T
  : N extends [type: "NumberLiteral", value: infer T extends number] ? T
  : N extends [type: "StringLiteral", value: infer T extends string] ? T
  : N extends [type: "Wildcard", upperBound: infer T] ? T
  : N extends [type: "UnnamedArg"] ? unknown
  : N extends [type: "UnnamedArg", boundedNode: infer N extends Node] ? BaseType<N, Readonly>
  : N extends [type: "NamedArg", name: string] ? unknown
  : N extends [type: "NamedArg", name: string, boundedNode: infer N extends Node] ?
    BaseType<N, Readonly>
  : N extends [type: "Tuple", elements: infer Elements extends Node[]] ?
    BaseTypeTuple<Elements, Readonly>
  : N extends [type: "Object", entries: infer Entries extends [string, Node][]] ?
    Readonly extends true ?
      Obj.Prettify<
        {
          readonly [K in Exclude<Entries[number][0], `${string}?`> as Extract<
            Entries[number],
            [K, Node]
          >[1][0] extends `${string}Spread${string}` ?
            never
          : K]: BaseType<Extract<Entries[number], [K, Node]>[1], Readonly>;
        } & {
          readonly [K in Extract<Entries[number][0], `${string}?`> as Extract<
            Entries[number],
            [K, Node]
          >[1][0] extends `${string}Spread${string}` ?
            never
          : K extends `${infer K}?` ? K
          : never]?: BaseType<Extract<Entries[number], [K, Node]>[1], Readonly>;
        }
      >
    : Obj.Prettify<
        {
          [K in Exclude<Entries[number][0], `${string}?`> as Extract<
            Entries[number],
            [K, Node]
          >[1][0] extends `${string}Spread${string}` ?
            never
          : K]: BaseType<Extract<Entries[number], [K, Node]>[1], Readonly>;
        } & {
          [K in Extract<Entries[number][0], `${string}?`> as Extract<
            Entries[number],
            [K, Node]
          >[1][0] extends `${string}Spread${string}` ?
            never
          : K extends `${infer K}?` ? K
          : never]?: BaseType<Extract<Entries[number], [K, Node]>[1], Readonly>;
        }
      >
  : N extends [type: "Or", variants: infer Variants extends Node[]] ?
    BaseType<Variants[number], Readonly>
  : N extends [type: "SugaredADTRoot", tag: infer Tag] ?
    Readonly extends true ?
      { readonly _tag: Tag }
    : { _tag: Tag }
  : never;
type BaseTypeTuple<NS extends Node[], Readonly extends boolean, Acc extends unknown[] = []> =
  NS extends [infer N extends Node, ...infer Rest extends Node[]] ?
    N[0] extends `${string}Spread${string}` ?
      BaseTypeTuple<Rest, Readonly, [...Acc, ...unknown[]]>
    : BaseTypeTuple<Rest, Readonly, [...Acc, BaseType<N, Readonly>]>
  : Readonly extends true ? readonly [...Acc]
  : Acc;

/**
 * Refine the matched type of a {@linkcode Node} with the given value type and returns the matched
 * arguments as a tuple.
 */
export type MatchNode<T, N extends Node> =
  (
    N extends [type: "NullLiteral"] ? { matched: null; args: [] }
    : N extends [type: "UndefinedLiteral"] ? { matched: undefined; args: [] }
    : N extends [type: "BooleanLiteral", value: infer U extends boolean] ?
      { matched: (Is.Any<T> extends true ? unknown : T) & U; args: [] }
    : N extends [type: "BigIntLiteral", value: infer U extends bigint] ?
      { matched: (Is.Any<T> extends true ? unknown : T) & U; args: [] }
    : N extends [type: "NumberLiteral", value: infer U extends number] ?
      { matched: (Is.Any<T> extends true ? unknown : T) & U; args: [] }
    : N extends [type: "StringLiteral", value: infer U extends string] ?
      { matched: (Is.Any<T> extends true ? unknown : T) & U; args: [] }
    : N extends [type: "Wildcard", upperBound: infer U] ?
      { matched: (Is.Any<T> extends true ? unknown : T) & U; args: [] }
    : N extends [type: "UnnamedArg"] ?
      {
        matched: Is.Any<T> extends true ? unknown : T;
        args: [["_", Is.Any<T> extends true ? unknown : T]];
      }
    : N extends (
      [
        type: "UnnamedArg",
        boundedNode: [type: "Or", variants: [infer N extends Node, [type: "UndefinedLiteral"]]],
      ]
    ) ?
      {
        matched: MatchNode<T, N>["matched"] | undefined;
        args: [...MatchNode<T, N>["args"], ["_", MatchNode<T, N>["matched"] | undefined]];
      }
    : N extends [type: "UnnamedArg", boundedNode: infer N extends Node] ?
      {
        matched: MatchNode<T, N>["matched"];
        args: [...MatchNode<T, N>["args"], ["_", MatchNode<T, N>["matched"]]];
      }
    : N extends [type: "NamedArg", name: infer Name extends string] ?
      {
        matched: Is.Any<T> extends true ? unknown : T;
        args: [[Name, Is.Any<T> extends true ? unknown : T]];
      }
    : N extends (
      [
        type: "NamedArg",
        name: infer Name extends string,
        boundedNode: [type: "Or", variants: [infer N extends Node, [type: "UndefinedLiteral"]]],
      ]
    ) ?
      {
        matched: MatchNode<T, N>["matched"] | undefined;
        args: [...MatchNode<T, N>["args"], [Name, MatchNode<T, N>["matched"] | undefined]];
      }
    : N extends (
      [type: "NamedArg", name: infer Name extends string, boundedNode: infer N extends Node]
    ) ?
      {
        matched: MatchNode<T, N>["matched"];
        args: [...MatchNode<T, N>["args"], [Name, MatchNode<T, N>["matched"]]];
      }
    : N extends [type: "Tuple", elements: infer Elements extends Node[]] ?
      Is.Any<T> extends true ? MatchTupleElements<unknown[], Elements>
      : Union.AnyExtend<T, readonly unknown[]> extends true ?
        T extends unknown ?
          [T & BaseType<N>] extends [never] ?
            never // Filter out irrelevant types
          : T extends readonly unknown[] ? MatchTupleElements<T, Elements>
          : never
        : never
      : MatchTupleElements<unknown[], Elements>
    : N extends [type: "Object", entries: infer Entries extends [string, Node][]] ?
      T extends unknown ?
        [T & BaseType<N>] extends [never] ?
          never // Filter out irrelevant types
        : {
            matched: Or<Is.Any<T>, Not<Extends<T, object>>> extends true ?
              Obj.Prettify<
                {
                  [K in Exclude<
                    Exclude<
                      Entries[number],
                      [string, [type: `${string}Spread${string}`, ...unknown[]]]
                    >[0],
                    `${string}?`
                  >]: MatchNode<T, Extract<Entries[number], [K, Node]>[1]>["matched"];
                } & {
                  [K in Str.RemoveSuffix<
                    Extract<
                      Exclude<
                        Entries[number],
                        [string, [type: `${string}Spread${string}`, ...unknown[]]]
                      >[0],
                      `${string}?`
                    >,
                    "?"
                  >]?: MatchNode<T, Extract<Entries[number], [`${K}?`, Node]>[1]>["matched"];
                }
              >
            : Obj.Prettify<
                {
                  // Make optional key non-optional if the pattern contains the key without "?"
                  [K in Extract<Entries[number][0], Obj.OptionalKeyOf<T>>]: MatchNode<
                    NonNullable<K extends keyof T ? T[K] : never>,
                    Extract<Entries[number], [K, Node]>[1]
                  >["matched"];
                } & {
                  [K in keyof T]: K extends (
                    Str.RemoveSuffix<
                      Exclude<
                        Entries[number],
                        [string, [type: `${string}Spread${string}`, ...unknown[]]]
                      >[0],
                      "?"
                    >
                  ) ?
                    MatchNode<
                      NonNullable<T[K]>,
                      Extract<Entries[number], [K | `${K}?`, Node]>[1]
                    >["matched"]
                  : T[K];
                }
              >;
            args: GetObjectArgs<T, Entries>;
          }
      : never
    : N extends [type: "Or", variants: infer Variants extends Node[]] ?
      {
        matched: MatchNode<T, Variants[number]>["matched"];
        args: MatchNode<T, Variants[number]>["args"];
      }
    : N extends [type: "SugaredADTRoot", tag: infer Tag] ?
      Is.Any<T> extends true ?
        {
          matched: { _tag: Tag };
          args: [];
        }
      : {
          matched: Extract<T, { readonly _tag: Tag }>;
          args: ExtractSugaredRootADTArgs<Extract<T, { readonly _tag: Tag }>>;
        }
    : never
  ) extends infer R extends MatchResult ?
    R
  : never;

type MatchTupleElements<TS extends readonly unknown[], NS extends readonly Node[]> =
  Union.AnyExtend<NS[number][0], `${string}Spread${string}`> extends false ?
    MatchNodesSimple<TS, NS>
  : List.FindIndex<NS, Extends$<[type: `${string}Spread${string}`, ...unknown[]]>> extends (
    infer SpreadNodeIndex extends Nat
  ) ?
    [
      List.Take<NS, SpreadNodeIndex>,
      List.AtUnsafe<NS, SpreadNodeIndex>,
      List.Drop<NS, Nat.Inc<SpreadNodeIndex>>,
    ] extends (
      [
        infer Before extends Node[],
        infer Spread extends
          | [type: "WildcardSpread"]
          | [type: "UnnamedSpreadArg"]
          | [type: "NamedSpreadArg", name: string],
        infer After extends Node[],
      ]
    ) ?
      [
        MatchNodesSimple<List.Take<TS, Before["length"]>, Before>,
        Pipe<TS, List.Drop$<Before["length"]>, List.DropLast$<After["length"]>>,
        MatchNodesSimple<List.TakeLast<TS, After["length"]>, After>,
      ] extends (
        [
          infer BeforeResult extends MatchResult<unknown[]>,
          infer SpreadMatched extends readonly unknown[],
          infer AfterResult extends MatchResult<unknown[]>,
        ]
      ) ?
        {
          matched: [...BeforeResult["matched"], ...SpreadMatched, ...AfterResult["matched"]];
          args: [
            ...BeforeResult["args"],
            ...(Spread[0] extends "WildcardSpread" ? []
            : Spread[0] extends "UnnamedSpreadArg" ? [["..._", SpreadMatched]]
            : Spread[0] extends "NamedSpreadArg" ? [[`...${Spread[1]}`, SpreadMatched]]
            : never),
            ...AfterResult["args"],
          ];
        }
      : never
    : never
  : never;

type GetObjectArgs<T, Entries extends [string, Node][]> =
  Union.AnyExtend<Entries[number][1][0], `${string}Spread${string}`> extends false ?
    GetObjectArgsSimple<T, Entries>
  : [
    List.TakeUntil<Entries, Extends$<[string, [type: `${string}Spread${string}`, ...unknown[]]]>>,
    List.FindUnsafe<Entries, Extends$<[string, [type: `${string}Spread${string}`, ...unknown[]]]>>,
    Pipe<
      Entries,
      List.DropUntil$<Extends$<[string, [type: `${string}Spread${string}`, ...unknown[]]]>>,
      List.Drop$<1>
    >,
  ] extends (
    [
      infer Before extends [string, Node][],
      [
        string,
        infer Spread extends [type: "UnnamedSpreadArg"] | [type: "NamedSpreadArg", name: string],
      ],
      infer After extends [string, Node][],
    ]
  ) ?
    [
      ...GetObjectArgsSimple<T, Before>,
      ...[
        [
          Spread[0] extends "UnnamedSpreadArg" ? `..._`
          : Spread[0] extends "NamedSpreadArg" ? `...${Spread[1]}`
          : never,
          {
            [K in Exclude<
              Is.Any<T> extends true ? never : keyof T,
              Before[number][0] | After[number][0]
            >]: T[K];
          },
        ],
      ],
      ...GetObjectArgsSimple<T, After>,
    ]
  : never;

type GetObjectArgsSimple<T, Entries extends [string, Node][]> = MatchNodesSimple<
  {
    [K in keyof Entries]: [Entries[K][0]] extends [keyof T] ? T[Entries[K][0]]
    : BaseType<Entries[K][1], false>;
  },
  {
    [K in keyof Entries]: Entries[K][0] extends `${string}?` ?
      Entries[K][1] extends [type: "UnnamedArg", boundedNode: infer N extends Node] ?
        [type: "UnnamedArg", boundedNode: [type: "Or", variants: [N, [type: "UndefinedLiteral"]]]]
      : Entries[K][1] extends (
        [type: "NamedArg", name: infer Name, boundedNode: infer N extends Node]
      ) ?
        [
          type: "NamedArg",
          name: Name,
          boundedNode: [type: "Or", variants: [N, [type: "UndefinedLiteral"]]],
        ]
      : Entries[K][1]
    : Entries[K][1];
  }
>["args"];

type MatchNodesSimple<
  TS,
  NS extends readonly Node[],
  Acc extends MatchResult<unknown[]> = { matched: []; args: [] },
> =
  NS extends readonly [infer N extends Node, ...infer Rest extends readonly Node[]] ?
    MatchNodesSimple<
      Is.Any<TS> extends true ? any
      : TS extends readonly unknown[] ? Option.UnwrapOr<List.TailOption<TS>, []>
      : unknown[],
      Rest,
      {
        matched: [
          ...Acc["matched"],
          MatchNode<TS extends readonly unknown[] ? List.HeadUnsafe<TS> : unknown, N>["matched"],
        ];
        args: [
          ...Acc["args"],
          ...MatchNode<TS extends readonly unknown[] ? List.HeadUnsafe<TS> : unknown, N>["args"],
        ];
      }
    >
  : Acc;

type ExtractSugaredRootADTArgs<ADT, Counter extends void[] = [], Acc extends unknown[] = []> =
  ADT extends { readonly [K in `_${Counter["length"]}`]: infer T } ?
    ExtractSugaredRootADTArgs<ADT, [...Counter, void], [...Acc, ["_", T]]>
  : Acc;
