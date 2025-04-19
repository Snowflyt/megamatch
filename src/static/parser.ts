/**
 * @module
 * @private
 * @internal
 */

import type { Always, Arg0, Arg1, Identity, TypeLambda, TypeLambda1 } from "hkt-core";

import type {
  Between,
  ChainL1,
  Choice,
  DecimalBigInt,
  Digit,
  Float,
  Join,
  Just,
  JustAs,
  Left,
  Letter,
  Lexeme,
  LexemeChoice,
  Lower,
  ManyChar,
  Map,
  Or,
  Pair,
  Parse,
  Right,
  SepBy,
  Seq,
  Signed,
  Space,
  Space1,
  StringLiteral,
  Symbol,
  SymbolAs,
  Upper,
} from "../lib/parser/static";
import type { Converge, Is, List, Not, Str } from "../lib/type-utils";
import type { Node } from "../types";

export type ParsePattern<Pattern extends string> =
  Pattern extends unknown ?
    Not<Is.Never<ParseSugaredADTRoot<Pattern>>> extends true ? ParseSugaredADTRoot<Pattern>
    : // PERF: We flatten `pattern as name` here instead of defining their own parsers to avoid
    // deep instantiation
    Parse<Seq<[OrParser, Space1, Just<"as">, Space1, Just<"_">]>, Pattern> extends (
      { success: true; data: [infer N extends Node, ...unknown[]]; rest: infer Rest }
    ) ?
      Parse<Space, Rest> extends { rest: "" } ?
        [type: "UnnamedArg", boundedNode: N]
      : never
    : Parse<Seq<[OrParser, Space1, Just<"as">, Space1, LowerIdentifierParser]>, Pattern> extends (
      {
        success: true;
        data: [infer N extends Node, ...unknown[], infer Name extends string];
        rest: infer Rest;
      }
    ) ?
      Parse<Space, Rest> extends { rest: "" } ?
        [type: "NamedArg", name: Name, boundedNode: N]
      : never
    : Parse<OrParser, Pattern> extends (
      { success: true; data: infer R extends Node; rest: infer Rest }
    ) ?
      Parse<Space, Rest> extends { rest: "" } ?
        R
      : never
    : never
  : never;
type ParseSugaredADTRoot<Pattern extends string> =
  Parse<ADTTagParser, Pattern> extends (
    { success: true; data: infer Tag extends string; rest: infer Rest }
  ) ?
    [Tag] extends (
      [WildcardParser extends Choice<JustAs<infer Name extends string, any>[]> ? Name : never]
    ) ?
      never
    : Parse<Space, Rest> extends { rest: "" } ? [type: "SugaredADTRoot", tag: Tag]
    : never
  : never;

type CommonParsers = [
  NullLiteralParser,
  UndefinedLiteralParser,
  BooleanLiteralParser,
  BigIntLiteralParser,
  NumberLiteralParser,
  StringLiteralParser,
  WildcardParser,
  UnnamedArgParser,
  NamedArgParser,
  ADTParser,
  TupleParser,
  ObjectParser,
];

/***********
 * Literal *
 ***********/
// `null`
type NullLiteralParser = JustAs<"null", [type: "NullLiteral"]>;

// `undefined`
type UndefinedLiteralParser = JustAs<"undefined", [type: "UndefinedLiteral"]>;

// boolean
type BooleanLiteralParser = Or<
  JustAs<"true", [type: "BooleanLiteral", value: true]>,
  JustAs<"false", [type: "BooleanLiteral", value: false]>
>;

// bigint
type BigIntLiteralParser = Map<
  Left<Signed<DecimalBigInt>, Just<"n">>,
  List.FillTemplate$<[type: "BigIntLiteral", value: List._]>
>;

// number
type NumberLiteralParser = Map<
  Signed<Float>,
  List.FillTemplate$<[type: "NumberLiteral", value: List._]>
>;

// string
type IdentifierParser = Join<Pair<Just<Letter | "_" | "$">, ManyChar<Letter | Digit | "_" | "$">>>;
type LowerIdentifierParser = Join<
  Pair<Just<Lower | "_" | "$">, ManyChar<Letter | Digit | "_" | "$">>
>;

type StringLiteralParser = Map<
  Or<StringLiteral<"'">, StringLiteral<'"'>>,
  List.FillTemplate$<[type: "StringLiteral", value: List._]>
>;

/************
 * Wildcard *
 ************/
// *
type WildcardParser = Choice<
  [
    JustAs<"*", [type: "Wildcard", upperBound: unknown]>,
    JustAs<"string", [type: "Wildcard", upperBound: string]>,
    JustAs<"number", [type: "Wildcard", upperBound: number]>,
    JustAs<"boolean", [type: "Wildcard", upperBound: boolean]>,
    JustAs<"symbol", [type: "Wildcard", upperBound: symbol]>,
    JustAs<"bigint", [type: "Wildcard", upperBound: bigint]>,
    // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
    JustAs<"function", [type: "Wildcard", upperBound: Function]>,
    JustAs<"object", [type: "Wildcard", upperBound: object]>,
    JustAs<"nonNullable", [type: "Wildcard", upperBound: {}]>,
    JustAs<"Date", [type: "Wildcard", upperBound: Date]>,
    JustAs<"RegExp", [type: "Wildcard", upperBound: RegExp]>,
    JustAs<"Error", [type: "Wildcard", upperBound: Error]>,
    JustAs<"ArrayBuffer", [type: "Wildcard", upperBound: ArrayBuffer]>,
    JustAs<"Array", [type: "Wildcard", upperBound: unknown[]]>,
    JustAs<"Map", [type: "Wildcard", upperBound: globalThis.Map<unknown, unknown>]>,
    JustAs<"Set", [type: "Wildcard", upperBound: Set<unknown>]>,
    JustAs<"WeakMap", [type: "Wildcard", upperBound: WeakMap<WeakKey, unknown>]>,
    JustAs<"WeakSet", [type: "Wildcard", upperBound: WeakSet<WeakKey>]>,
    JustAs<"Promise", [type: "Wildcard", upperBound: Promise<unknown>]>,
    JustAs<
      "TypedArray",
      [
        type: "Wildcard",
        upperBound:
          | Int8Array
          | Uint8Array
          | Uint8ClampedArray
          | Int16Array
          | Uint16Array
          | Int32Array
          | Uint32Array
          | Float32Array
          | Float64Array
          // eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
          | (typeof globalThis extends { BigInt64Array: infer T } ? T : never)
          // eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents, @typescript-eslint/no-duplicate-type-constituents
          | (typeof globalThis extends { BigUint64Array: infer T } ? T : never),
      ]
    >,
    JustAs<"DataView", [type: "Wildcard", upperBound: DataView]>,
  ]
>;

// ... / ...*
type WildcardSpreadParser = Map<Or<Just<"...*">, Just<"...">>, Always<[type: "WildcardSpread"]>>;

/*******
 * Arg *
 *******/
// _
type UnnamedArgParser = JustAs<"_", [type: "UnnamedArg"]>;
// ..._
type UnnamedSpreadArgParser = JustAs<"..._", [type: "UnnamedSpreadArg"]>;

// name
type NamedArgParser = Map<
  LowerIdentifierParser,
  List.FillTemplate$<[type: "NamedArg", name: List._]>
>;
// ...name
type NamedSpreadArgParser = Map<
  Join<Pair<Right<Just<"...">, Just<Lower | "_" | "$">>, ManyChar<Letter | Digit | "_" | "$">>>,
  List.FillTemplate$<[type: "NamedSpreadArg", name: List._]>
>;

/*************************************************************
 * kind-adt style ADT (https://github.com/Snowflyt/kind-adt) *
 *************************************************************/
type ADTTagParser = Join<Pair<Just<Upper>, ManyChar<Letter | Digit | "_" | "$">>>;
type ADTParser = Map<
  Or<Seq<[ADTTagParser, Symbol<"(">, SepBy<OrParser, Symbol<",">>, Symbol<")">]>, ADTTagParser>,
  MapADTParseResult$
>;
interface MapADTParseResult$ extends TypeLambda1<unknown, Node> {
  return: [
    type: "Object",
    entries: Arg0<this> extends (
      [infer Tag extends Capitalize<string>, unknown, infer Fields extends Node[], unknown]
    ) ?
      [
        ["_tag", [type: "StringLiteral", value: Tag]],
        ...{ [K in keyof Fields]: [`_${K}`, Fields[K]] },
      ]
    : Arg0<this> extends infer Tag extends string ? [["_tag", [type: "StringLiteral", value: Tag]]]
    : never,
  ];
}

/*********
 * Tuple *
 *********/
type TupleParser = Map<
  Between<
    Symbol<"[">,
    Symbol<"]">,
    SepBy<
      LexemeChoice<
        [
          // PERF: We flatten `pattern as name` here instead of defining their own parsers to avoid
          // deep instantiation
          Seq<[OrParser, Space1, Just<"as">, Space1, Just<"_">]>,
          Seq<[OrParser, Space1, Just<"as">, Space1, LowerIdentifierParser]>,
          OrParser,
          UnnamedSpreadArgParser,
          NamedSpreadArgParser,
          WildcardSpreadParser,
        ]
      >,
      Symbol<",">
    >
  >,
  MapTupleParseResult$
>;
interface MapTupleParseResult$ extends TypeLambda1<unknown, Node> {
  return: [
    type: "Tuple",
    elements: Arg0<this> extends infer RawElements ?
      {
        [K in keyof RawElements]: RawElements[K] extends [string, ...unknown[]] ? RawElements[K]
        : RawElements[K] extends [infer BoundedNode, ...unknown[], "_"] ?
          [type: "UnnamedArg", boundedNode: BoundedNode]
        : RawElements[K] extends [infer BoundedNode, ...unknown[], infer Name extends string] ?
          [type: "NamedArg", name: Name, boundedNode: BoundedNode]
        : never;
      }
    : never,
  ];
}

/**********
 * Object *
 **********/
type ObjectKeyParser = Left<
  LexemeChoice<
    [
      StringLiteral<"'">,
      StringLiteral<'"'>,
      Join<Pair<IdentifierParser, Symbol<"?">>>,
      IdentifierParser,
    ]
  >,
  Symbol<":">
>;

type ObjectParser = Map<
  Between<
    Symbol<"{">,
    Symbol<"}">,
    SepBy<
      Choice<
        [
          // Normal key-value pair
          // PERF: We flatten `pattern as name` here instead of defining their own parsers to avoid
          // deep instantiation
          Seq<[ObjectKeyParser, OrParser, Space1, Just<"as">, Space1, Just<"_">]>,
          Seq<[ObjectKeyParser, OrParser, Space1, Just<"as">, Space1, LowerIdentifierParser]>,
          Pair<ObjectKeyParser, OrParser>,
          // Shorthand key-value pair
          Map<
            Lexeme<IdentifierParser>,
            Converge<
              List.OfPairWritable$$,
              Identity,
              List.FillTemplate$<[type: "NamedArg", name: List._]>
            >
          >,
          // Spread destructuring
          Lexeme<JustAs<"..._", ["..._", ["UnnamedSpreadArg"]]>>,
          Map<
            Lexeme<Right<Just<"...">, Lexeme<LowerIdentifierParser>>>,
            Converge<
              List.OfPairWritable$$,
              Str.Prepend$<"...">,
              List.FillTemplate$<[type: "NamedSpreadArg", name: List._]>
            >
          >,
        ]
      >,
      Symbol<",">
    >
  >,
  MapObjectParseResult$
>;
interface MapObjectParseResult$ extends TypeLambda1<unknown[][], Node> {
  return: [
    type: "Object",
    entries: Arg0<this> extends infer RawEntires ?
      {
        [K in keyof RawEntires]: RawEntires[K] extends [unknown, unknown] ? RawEntires[K]
        : RawEntires[K] extends [infer Key extends string, infer BoundedNode, ...unknown[], "_"] ?
          [Key, [type: "UnnamedArg", boundedNode: BoundedNode]]
        : RawEntires[K] extends (
          [infer Key extends string, infer BoundedNode, ...unknown[], infer Name extends string]
        ) ?
          [Key, [type: "NamedArg", name: Name, boundedNode: BoundedNode]]
        : never;
      }
    : never,
  ];
}

/******
 * Or *
 ******/
type OrParser = ChainL1<LexemeChoice<CommonParsers>, SymbolAs<"|", ConcatOrParseResults$>>;
interface ConcatOrParseResults$ extends TypeLambda<[acc: Node, node: Node], Node> {
  return: Arg0<this> extends [type: "Or", variants: infer Variants extends Node[]] ?
    [type: "Or", variants: [...Variants, Arg1<this>]]
  : [type: "Or", variants: [Arg0<this>, Arg1<this>]];
}
