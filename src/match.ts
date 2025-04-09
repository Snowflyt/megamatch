import { NonExhaustiveError } from "./errors";
import type { Equals, Option, Union } from "./lib/type-utils";
import { checkNode } from "./runtime/checker";
import { invokeCaseFn, matchNode } from "./runtime/match";
import { parsePattern } from "./runtime/parser";
import type { CheckNode } from "./static/checker";
import type { ExcludeDeep } from "./static/exclude-deep";
import type { BaseType, MatchNode } from "./static/match";
import type { ParsePattern } from "./static/parser";
import type { Node } from "./types";

/*********
 * match *
 *********/
declare const _: unique symbol;
// eslint-disable-next-line sonarjs/class-name
interface _ {
  [_]: never;
}

export type MatchFn<T, R> = (value: T) => R;

/**
 * Match a value against a set of patterns. Exhaustiveness check is performed at both compile-time
 * and runtime. The function will throw a {@linkcode NonExhaustiveError} if no pattern matches
 * the value.
 *
 * This function can be used in 2 ways:
 *
 * - **Normal style**: The first argument is the value to match, and the second argument is an
 *   object with patterns as keys and functions as values.
 * - **Point-free style**: The only argument is an object with patterns as keys and functions as
 *   values. The function returned by `match` can be called with the value to match.
 *
 * Both styles support specifying the return type or the type of the value to match via the
 * `match<ReturnType, InputType>()(...)` syntax, where `InputType` is optional.
 *
 * [Read the documentation on GitHub.](https://github.com/Snowflyt/megamatch#Quickstart)
 * @param value The value to match.
 * @param cases An object containing the patterns as keys and the corresponding functions to call
 * when the pattern matches.
 * @returns
 *
 * @throws {NonExhaustiveError} if no pattern matches the value.
 *
 * @example
 * ```typescript
 * // Normal style
 * type Data = { type: "text"; content: string } | { type: "img"; src: string };
 * type Result = { type: "ok"; data: Data } | { type?: "error" | "fatal"; message: string };
 *
 * const result: Result = ...;
 *
 * const html = match(result, {
 *   "{ type?: 'error' | 'fatal' }": (res) => `<p>Oops! Something went wrong: ${res.message}</p>`,
 *   "{ type: 'ok', data: { type: 'text', content: _ } }": (content) => `<p>${content}</p>`,
 *   "{ type: 'ok', data: { type: 'img', src } as data }": ({ src, data }) => `<img src="${src}" />`,
 * });
 * ```
 *
 * @example
 * ```typescript
 * // Point-free style
 * const quickSort: (nums: number[]) => number[] = match({
 *   "[]": () => [],
 *   "[head, ...tail]": ({ head, tail }) => {
 *     const smaller = tail.filter((n) => n <= head);
 *     const greater = tail.filter((n) => n > head);
 *     return [...quickSort(smaller), head, ...quickSort(greater)];
 *   },
 * });
 * ```
 */
export function match<const T, Pattern extends string, R>(
  value: T,
  cases: ValidateCases<T, Pattern, R>,
): R;
export function match<T, Pattern extends string, R>(
  cases: ValidateCases<T, Pattern, R>,
): MatchFn<T, R>;
export function match<R, T = _>(): Equals<T, _> extends true ?
  {
    <const T, Pattern extends string>(value: T, cases: ValidateCases<T, Pattern, R>): R;
    <T, Pattern extends string>(cases: ValidateCases<T, Pattern, R>): MatchFn<T, R>;
  }
: {
    <Pattern extends string>(value: T, cases: ValidateCases<T, Pattern, R>): R;
    <Pattern extends string>(cases: ValidateCases<T, Pattern, R>): MatchFn<T, R>;
  };
export function match(
  ...args: [] | [cases: Record<string, any>] | [value: unknown, cases: Record<string, any>]
) {
  if (!args.length) return match;

  if (args.length === 1) {
    // Optimization to avoid parse patterns on each call
    const parsedCases: [Node, (...args: unknown[]) => unknown][] = [];
    for (const pattern in args[0]) {
      const node = parsePattern(pattern);
      if (!node) throw new TypeError(`Invalid pattern: ${pattern}`);

      checkNode(node);

      parsedCases.push([node, args[0][pattern] as (...args: unknown[]) => unknown]);
    }

    return function match(value: unknown) {
      for (const [node, onMatch] of parsedCases) {
        const result = matchCase(value, node, onMatch);
        if (result._tag === "Some") return result.value;
      }

      throw new NonExhaustiveError(value);
    };
  }

  const [value, cases] = args as [unknown, Record<string, (...args: unknown[]) => unknown>];

  for (const pattern in cases) {
    const node = parsePattern(pattern);
    if (!node) throw new TypeError(`Pattern matching error: Failed to parse pattern: ${pattern}`);

    checkNode(node);

    const result = matchCase(value, node, cases[pattern]!);
    if (result._tag === "Some") return result.value;
  }

  throw new NonExhaustiveError(value);
}

const matchCase = (
  value: unknown,
  node: Node,
  onMatch: (...args: unknown[]) => unknown,
): Option<unknown> => {
  const match = matchNode(value, node);
  if (!match) return { _tag: "None" };
  return { _tag: "Some", value: invokeCaseFn(value, match, onMatch) };
};

interface NonExhaustive<T> {
  __nonExhaustive: T;
}

type ValidateCases<T, Pattern extends string, R> =
  ValidatePattern<T, Pattern> extends true ?
    [ExcludePattern<T, Pattern>] extends [never] ?
      Cases<T, Pattern, R>
    : NonExhaustive<ExcludePattern<T, Pattern>>
  : Cases<T, Pattern, R>;

type ValidatePattern<T, Pattern extends string> =
  Pattern extends unknown ?
    ParsePattern<Pattern> extends infer N extends Node ?
      [N] extends [never] ? "Failed to parse pattern"
      : [T & BaseType<N>] extends [never] ?
        "This pattern appears to be unintentional because it has no overlap with the type to match"
      : [CheckNode<N>] extends [never] ? true
      : CheckNode<N>
    : never
  : never;

// NOTE: TypeScript preserves a rough order of union types (in our case, patterns as object keys).
// Since the result of `ExcludeDeep` relies on the order of the types to exclude, we try our best to
// preserve the order of the patterns by converting the pattern string to a union of strings and
// process them one by one.
type ExcludePattern<T, Pattern extends string> = _ExcludePattern<T, Union.ToList<Pattern>>;
type _ExcludePattern<T, Patterns extends readonly string[]> =
  Patterns extends readonly [infer CurrentPattern extends string, ...infer Tail extends string[]] ?
    _ExcludePattern<ExcludeDeep<T, BaseType<ParsePattern<CurrentPattern>>>, Tail>
  : T;

// NOTE: TypeScript does not preserve the exact order of union types (in our case, patterns as
// object keys), so we cannot narrow the matched type in each case with the order of the patterns.
// However, we can assume the user always place patterns like `_` and `*` as the last case,
// in which case we will narrow the matched type.
type NarrowType<T, CurrentPattern extends string, AllPattern extends string> =
  CurrentPattern extends "_" | "*" ? ExcludePattern<T, Exclude<AllPattern, CurrentPattern>> : T;

type Cases<T, Pattern extends string, R> = {
  [P in Pattern]: ParsePattern<P> extends infer N extends Node ?
    [N] extends [never] ? "Failed to parse pattern"
    : [CheckNode<N>] extends [never] ?
      [T & BaseType<N>] extends [never] ?
        "This pattern appears to be unintentional because it has no overlap with the type to match"
      : CaseFn<NarrowType<T, P, Pattern>, N, R>
    : CheckNode<N>
  : never;
};

type CaseFn<T, N extends Node, R> =
  MatchNode<T, N> extends { matched: infer Matched; args: infer Args extends [string, unknown][] } ?
    [Args] extends [[]] ? (value: Matched) => R
    : [Args] extends [["_" | "..._", unknown][]] ? (...args: { [K in keyof Args]: Args[K][1] }) => R
    : Union.AnyExtend<Args[number][0], "_" | "..._"> extends true ?
      "Cannot mix named and unnamed arguments in a pattern"
    : [Args] extends [[infer Name extends string, unknown][]] ?
      (args: {
        [K in Name extends `...${infer Name}` ? Name : Name]: Extract<
          Args[number],
          [K | `...${K}`, unknown]
        >[1];
      }) => R
    : never
  : never;

/***********
 * matches *
 ***********/
/**
 * A type guard function that checks if a value matches a given pattern.
 *
 * This function can be used in 2 ways:
 *
 * - **Normal style**: The first argument is the value to check, and the second argument is the
 *   pattern to match against.
 * - **Point-free style**: The first argument is the pattern to match against. The function
 *   returned by `matches` can be called with the value to check.
 *
 * Both styles support specifying the type of the value to match via the `matches<InputType>()(...)`
 * syntax.
 *
 * [Read the documentation for `matches` on GitHub.](https://github.com/Snowflyt/megamatch#matches)
 * @param value The value to check.
 * @param pattern The pattern to match against.
 * @returns A boolean indicating whether the value matches the pattern.
 */
export function matches<const T, Pattern extends string>(
  value: T,
  pattern: ValidatePattern<T, Pattern> extends true ? Pattern : ValidatePattern<T, Pattern>,
): value is MatchNode<T, ParsePattern<Pattern>>["matched"] extends infer U extends T ? U : never;
export function matches<T, Pattern extends string>(
  pattern: ValidatePattern<T, Pattern> extends true ? Pattern : ValidatePattern<T, Pattern>,
): (
  value: T,
) => value is MatchNode<T, ParsePattern<Pattern>>["matched"] extends infer U extends T ? U : never;
export function matches<T>(): {
  <Pattern extends string>(
    value: T,
    pattern: ValidatePattern<T, Pattern> extends true ? Pattern : ValidatePattern<T, Pattern>,
  ): value is MatchNode<T, ParsePattern<Pattern>>["matched"] extends infer U extends T ? U : never;
  <Pattern extends string>(
    pattern: ValidatePattern<T, Pattern> extends true ? Pattern : ValidatePattern<T, Pattern>,
  ): (
    value: T,
  ) => value is MatchNode<T, ParsePattern<Pattern>>["matched"] extends infer U extends T ? U
  : never;
};
export function matches(...args: [] | [pattern: string] | [value: unknown, pattern: string]): any {
  if (!args.length) return matches;

  if (args.length === 1) {
    const pattern = args[0];

    const node = parsePattern(pattern);
    if (!node) throw new TypeError(`Invalid pattern: ${pattern}`);

    checkNode(node);

    return function matches(value: unknown) {
      return !!matchNode(value, node);
    };
  }

  const [value, pattern] = args;

  const node = parsePattern(pattern);
  if (!node) throw new TypeError(`Invalid pattern: ${pattern}`);

  checkNode(node);

  return !!matchNode(value, node);
}

/***********
 * ifMatch *
 ***********/
/**
 * Match a value against a pattern and execute a function if it matches.
 *
 * This function can be used in 3 ways:
 *
 * - **Normal style**: The first argument is the value to match, the second argument is the pattern,
 *   and the third argument is the function to execute if the pattern matches.
 * - **Point-free style 1**: The only argument is the pattern. The function returned by `ifMatch`
 *   can be called with the value to match and the function to execute if the pattern matches.
 * - **Point-free style 2**: The first argument is the pattern, the second argument is the function
 *   to execute if the pattern matches. The function returned by `ifMatch` can be called with the
 *   value to match.
 *
 * Both styles support specifying the type of the value to match via the
 * `ifMatch<ReturnType, InputType>()(...)` syntax, where `InputType` is optional.
 *
 * [Read the documentation for `ifMatch` on GitHub.](https://github.com/Snowflyt/megamatch#ifmatch)
 * @param value The value to match.
 * @param pattern The pattern to match against.
 * @param fn The function to execute if the pattern matches.
 * @returns The result of the function if the pattern matches, or `null` if it doesn't.
 */
export function ifMatch<const T, Pattern extends string, R>(
  value: T,
  pattern: ValidatePattern<T, Pattern> extends true ? Pattern : ValidatePattern<T, Pattern>,
  fn: CaseFn<T, ParsePattern<Pattern>, R>,
): R | null;
export function ifMatch<T, Pattern extends string>(
  pattern: ValidatePattern<T, Pattern> extends true ? Pattern : ValidatePattern<T, Pattern>,
): <R>(value: T, fn: CaseFn<T, ParsePattern<Pattern>, R>) => R | null;
export function ifMatch<T, Pattern extends string, R>(
  pattern: ValidatePattern<T, Pattern> extends true ? Pattern : ValidatePattern<T, Pattern>,
  fn: CaseFn<T, ParsePattern<Pattern>, R>,
): (value: T) => R | null;
export function ifMatch<R, T = _>(): Equals<T, _> extends true ?
  {
    <const T, Pattern extends string>(
      value: T,
      pattern: ValidatePattern<T, Pattern> extends true ? Pattern : ValidatePattern<T, Pattern>,
      fn: CaseFn<T, ParsePattern<Pattern>, R>,
    ): R | null;
    <T, Pattern extends string>(
      pattern: ValidatePattern<T, Pattern> extends true ? Pattern : ValidatePattern<T, Pattern>,
    ): (value: T, fn: CaseFn<T, ParsePattern<Pattern>, R>) => R | null;
    <T, Pattern extends string>(
      pattern: ValidatePattern<T, Pattern> extends true ? Pattern : ValidatePattern<T, Pattern>,
      fn: CaseFn<T, ParsePattern<Pattern>, R>,
    ): (value: T) => R | null;
  }
: {
    <Pattern extends string>(
      value: T,
      pattern: ValidatePattern<T, Pattern> extends true ? Pattern : ValidatePattern<T, Pattern>,
      fn: CaseFn<T, ParsePattern<Pattern>, R>,
    ): R | null;
    <Pattern extends string>(
      pattern: ValidatePattern<T, Pattern> extends true ? Pattern : ValidatePattern<T, Pattern>,
    ): (value: T, fn: CaseFn<T, ParsePattern<Pattern>, R>) => R | null;
    <Pattern extends string>(
      pattern: ValidatePattern<T, Pattern> extends true ? Pattern : ValidatePattern<T, Pattern>,
      fn: CaseFn<T, ParsePattern<Pattern>, R>,
    ): (value: T) => R | null;
  };
export function ifMatch(
  ...args:
    | []
    | [pattern: string]
    | [pattern: string, fn: unknown]
    | [value: unknown, pattern: string, fn: unknown]
) {
  if (!args.length) return ifMatch;

  if (args.length === 1) {
    const [pattern] = args;

    const node = parsePattern(pattern);
    if (!node) throw new TypeError(`Invalid pattern: ${pattern}`);

    checkNode(node);

    return function ifMatch(value: unknown, fn: (...args: unknown[]) => unknown) {
      const result = matchCase(value, node, fn);
      if (result._tag === "Some") return result.value;
      return null;
    };
  }

  if (args.length === 2) {
    const [pattern, fn] = args;

    const node = parsePattern(pattern);
    if (!node) throw new TypeError(`Invalid pattern: ${pattern}`);

    checkNode(node);

    return function ifMatch(value: unknown) {
      const result = matchCase(value, node, fn as (...args: unknown[]) => unknown);
      if (result._tag === "Some") return result.value;
      return null;
    };
  }

  const [value, pattern, fn] = args;

  const node = parsePattern(pattern);
  if (!node) throw new TypeError(`Invalid pattern: ${pattern}`);

  checkNode(node);

  const result = matchCase(value, node, fn as (...args: unknown[]) => unknown);
  if (result._tag === "Some") return result.value;
  return null;
}
