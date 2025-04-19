import type { BaseType, MatchNode } from "./static/match";
import type { ParsePattern } from "./static/parser";

/**
 * AST Node for the pattern matching language.
 * @private
 * @internal
 */
export type Node =
  | [type: "NullLiteral"]
  | [type: "UndefinedLiteral"]
  | [type: "BooleanLiteral", value: boolean]
  | [type: "BigIntLiteral", value: bigint]
  | [type: "NumberLiteral", value: number]
  | [type: "StringLiteral", value: string]
  | [type: "Wildcard", upperBound: unknown]
  | [type: "UnnamedArg", boundedNode?: Node]
  | [type: "UnnamedSpreadArg"]
  | [type: "NamedArg", name: string, boundedNode?: Node]
  | [type: "NamedSpreadArg", name: string]
  | [type: "WildcardSpread"]
  | [type: "Tuple", elements: Node[]]
  | [type: "Object", entries: [string, Node][]]
  | [type: "SugaredADTRoot", tag: string]
  | [type: "Or", variants: Node[]];

/**
 * Infer the type of value represented by a pattern.
 * @param Pattern The pattern to infer the type from.
 * @param Readonly Whether to make the inferred type readonly. Defaults to `true`.
 *
 * [Read the documentation for `Infer` on GitHub.](https://github.com/Snowflyt/megamatch#inferpattern)
 *
 * @example
 * ```typescript
 * const userPattern = "{ id: number, username: string, role: 'admin' | 'user' }";
 * type Post = Infer<typeof userPattern>;
 * //   ^?: { readonly id: number; readonly username: string; readonly role: "admin" | "user"; }
 * type PostWritable = Infer<typeof userPattern, false>;
 * //   ^?: { id: number; username: string; role: "admin" | "user"; }
 * ```
 */
export type Infer<Pattern extends string, Readonly extends boolean = true> = BaseType<
  ParsePattern<Pattern>,
  Readonly
>;

/**
 * Narrow a type based on a pattern.
 * @param T The type to narrow.
 * @param Pattern The pattern to narrow the type with.
 *
 * [Read the documentation for `Narrow` on GitHub.](https://github.com/Snowflyt/megamatch#narrowt-pattern)
 *
 * @example
 * ```typescript
 * type Data = { type: "text"; content: string } | { type: "img"; src: string };
 * type Result = { type: "ok"; data: Data } | { type?: "error" | "fatal"; message: string };
 *
 * type Narrowed = Narrow<Result, "{ type: 'error' }">;
 * //   ^?: { type: "error"; message: string }
 * ```
 */
export type Narrow<T, Pattern extends string> = MatchNode<T, ParsePattern<Pattern>>["matched"];
