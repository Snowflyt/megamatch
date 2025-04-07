/**
 * @module
 * @private
 * @internal
 */

import type { Parser } from "../lib/parser/runtime";
import {
  between,
  chainL1,
  choice,
  decimalBigInt,
  digits,
  float,
  join,
  just,
  justAs,
  left,
  letters,
  lexeme,
  lowers,
  manyChar,
  map,
  oneOf,
  or,
  pair,
  parse,
  right,
  sepBy,
  signed,
  space,
  stringLiteral,
  symbol,
  symbolAs,
} from "../lib/parser/runtime";
import type { Node } from "../types";

export const parsePattern = (pattern: string): Node | null => {
  const result = parse(
    left(choice([unnamedOrAliasParser, namedOrAliasParser, orParser]), space),
    pattern,
  );
  if (!result.success || result.rest) return null;
  return result.data;
};

const commonParsers = () => [
  nullLiteralParser,
  undefinedLiteralParser,
  booleanLiteralParser,
  bigintLiteralParser,
  numberLiteralParser,
  stringLiteralParser,
  wildcardParser,
  unnamedArgParser,
  namedArgParser,
  tupleParser,
  objectParser,
];

/***********
 * Literal *
 ***********/
// `null`
const nullLiteralParser: Parser<string, Node> = justAs("null", ["NullLiteral"]);

// `undefined`
const undefinedLiteralParser: Parser<string, Node> = justAs("undefined", ["UndefinedLiteral"]);

// boolean
const booleanLiteralParser: Parser<string, Node> = or(
  justAs("true", ["BooleanLiteral", true]),
  justAs("false", ["BooleanLiteral", false]),
);

// bigint
const bigintLiteralParser: Parser<string, Node> = map(
  left(signed(decimalBigInt), just("n")),
  (v) => ["BigIntLiteral", v],
);

// number
const numberLiteralParser: Parser<string, Node> = map(signed(float), (v) => ["NumberLiteral", v]);

// string
const identifierParser: Parser<string, string> = join(
  pair(oneOf(`${letters}_$`), manyChar(`${letters}${digits}_$`)),
);
const lowerIdentifierParser: Parser<string, string> = join(
  pair(oneOf(`${lowers}_$`), manyChar(`${letters}${digits}_$`)),
);

const stringLiteralParser: Parser<string, Node> = map(
  or(stringLiteral("'"), stringLiteral('"')),
  (v) => ["StringLiteral", v],
);

/************
 * Wildcard *
 ************/
// *
const wildcardParser: Parser<string, Node> = choice([
  justAs("*", ["Wildcard", "unknown"]),
  ...[
    "string",
    "number",
    "boolean",
    "symbol",
    "bigint",
    "function",
    "object",
    "nonNullable",
    "Date",
    "RegExp",
    "Error",
    "ArrayBuffer",
    "Array",
    "Map",
    "Set",
    "WeakMap",
    "WeakSet",
    "Promise",
    "TypedArray",
    "DataView",
  ].map((type) => justAs(type, ["Wildcard", type] as Node)),
]);

// ... / ...*
const wildcardSpreadParser: Parser<string, Node> = map(or(just("...*"), just("...")), () => [
  "WildcardSpread",
]);

/*******
 * Arg *
 *******/
// _
const unnamedArgParser: Parser<string, Node> = justAs("_", ["UnnamedArg"]);
// ..._
const unnamedSpreadArgParser: Parser<string, Node> = justAs("..._", ["UnnamedSpreadArg"]);

// name
const namedArgParser: Parser<string, Node> = map(lowerIdentifierParser, (v) => ["NamedArg", v]);
// ...name
const namedSpreadArgParser: Parser<string, Node> = map(
  join(pair(right(just("..."), oneOf(`${lowers}_$`)), manyChar(`${letters}${digits}_$`))),
  (v) => ["NamedSpreadArg", v],
);

/*********
 * Tuple *
 *********/
const tupleParser = (): Parser<string, Node> =>
  map(
    between(
      symbol("["),
      symbol("]"),
      sepBy(
        lexeme(
          choice([
            unnamedOrAliasParser,
            namedOrAliasParser,
            orParser,
            unnamedSpreadArgParser,
            namedSpreadArgParser,
            wildcardSpreadParser,
          ]),
        ),
        symbol(","),
      ),
    ),
    (elements) => ["Tuple", elements],
  );

/**********
 * Object *
 **********/
const objectKeyParser: Parser<string, string> = left(
  lexeme(
    choice([
      stringLiteral("'"),
      stringLiteral('"'),
      join(pair(identifierParser, symbol("?"))),
      identifierParser,
    ]),
  ),
  symbol(":"),
);

const objectParser = (): Parser<string, Node> =>
  between(
    symbol("{"),
    symbol("}"),
    map(
      sepBy(
        choice([
          // Normal key-value pair
          pair(objectKeyParser, choice([unnamedOrAliasParser, namedOrAliasParser, orParser])),
          // Shorthand key-value pair
          map(lexeme(identifierParser), (key) => [key, ["NamedArg", key]] as [string, Node]),
          // Spread destructuring
          lexeme(justAs("..._", ["..._", ["UnnamedSpreadArg"]] as [string, Node])),
          map(
            lexeme(right(just("..."), lexeme(lowerIdentifierParser))),
            (key) => [`...${key}`, ["NamedSpreadArg", key]] as [string, Node],
          ),
        ]),
        symbol(","),
      ),
      (entries) => ["Object", entries],
    ),
  );

/******
 * Or *
 ******/
const orParser = chainL1(
  lexeme(choice(commonParsers())),
  symbolAs("|", (acc, node) => (acc[0] === "Or" ? ["Or", [...acc[1], node]] : ["Or", [acc, node]])),
);

const unnamedOrAliasParser: Parser<string, Node> = map(
  left(orParser, pair(symbol("as"), symbol("_"))),
  (node) => ["UnnamedArg", node],
);

const namedOrAliasParser: Parser<string, Node> = map(
  pair(orParser, right(symbol("as"), lexeme(lowerIdentifierParser))),
  ([node, name]) => ["NamedArg", name, node],
);
