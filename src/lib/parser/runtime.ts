/**
 * Parser combinators implementation at runtime.
 * @module
 * @private
 * @internal
 */

import type { Option } from "../type-utils";

/**
 * A parser that accepts a token stream and returns a {@linkcode ParsingResult}.
 */
export interface Parser<I, R> {
  parse: (remaining: I) => ParsingResult<I, R>;
}
export type ParsingResult<I, R> = { success: true; data: R; rest: I } | { success: false };

export type MaybeLaziedParser<I, R> = Parser<I, R> | (() => Parser<I, R>);

/**
 * Parse a string using a parser.
 * @param parser The parser to use.
 * @param remaining The string to parse.
 * @returns
 *
 * @example
 * ```javascript
 * parse(just("a"), "abc"); // => { success: true; data: "a"; rest: "bc" }
 * parse("ab", "abc"); // => { success: true; data: "ab"; rest: "c" }
 * ```
 */
export function parse<I, R>(parser: MaybeLaziedParser<I, R>, remaining: I): ParsingResult<I, R> {
  const eagerParser = typeof parser === "function" ? parser() : parser;
  return eagerParser.parse(remaining);
}

/***************
 * Combinators *
 ***************/
/**
 * Matches a string from the input string and returns it.
 * @returns
 *
 * @example
 * ```javascript
 * parse(just("a"), "abc"); // => { success: true; data: "a"; rest: "bc" }
 * parse(just("ab"), "abc"); // => { success: true; data: "ab"; rest: "c" }
 * ```
 */
export function just<I extends string>(str: I): Parser<string, I> {
  return {
    parse: (remaining) => {
      if (remaining.startsWith(str))
        return { success: true, data: str, rest: remaining.slice(str.length) };
      return { success: false };
    },
  };
}

/**
 * Matches a string from the input string and returns {@linkcode as}.
 * @param str The string to match.
 * @returns
 */
export function justAs<R>(str: string, as: R): Parser<string, R> {
  return map(just(str), () => as);
}

/**
 * Tries an array of parsers in order, returning the result of the first successful one, or a
 * failure if none of them succeed.
 * @param parsers The parsers to try.
 * @returns
 */
export function choice<I, R>(parsers: readonly MaybeLaziedParser<I, R>[]): Parser<I, R> {
  return {
    parse: (remaining) => {
      for (const parser of parsers) {
        const result = parse(parser, remaining);
        if (result.success) return result;
      }
      return { success: false };
    },
  };
}

/**
 * Tries 2 parsers in order, returning the result of the first successful one, or a failure if none
 * of them succeed.
 * @param left The first parser to try.
 * @param right The second parser to try.
 * @returns
 */
export function or<I, R1, R2>(
  left: MaybeLaziedParser<I, R1>,
  right: MaybeLaziedParser<I, R2>,
): Parser<I, R1 | R2> {
  return {
    parse: (remaining) => {
      const leftResult = parse(left, remaining);
      if (leftResult.success) return leftResult;
      return parse(right, remaining);
    },
  };
}

/**
 * Matches 0 or more occurrences of a parser and returns an array of the results.
 * @param parser The parser to match.
 * @returns
 *
 * @example
 * ```javascript
 * parse(many(just("a")), "aab"); // => { success: true; data: ["a", "a"]; rest: "b" }
 * parse(many(just("a")), "b"); // => { success: true; data: []; rest: "b" }
 * ```
 */
export function many<I, R>(parser: MaybeLaziedParser<I, R>): Parser<I, R[]> {
  return {
    parse: (remaining) => {
      const results: R[] = [];
      let current = remaining;
      while (true) {
        const result = parse(parser, current);
        if (!result.success) break;
        results.push(result.data);
        current = result.rest;
      }
      return { success: true, data: results, rest: current };
    },
  };
}

/**
 * Matches 1 or more occurrences of a parser and returns an array of the results.
 * @param parser The parser to match.
 * @returns
 *
 * @example
 * ```javascript
 * parse(many1(just("a")), "aab"); // => { success: true; data: ["a", "a"]; rest: "b" }
 * parse(many1(just("a")), "b"); // => { success: false }
 * ```
 */
export function many1<I, R>(parser: MaybeLaziedParser<I, R>): Parser<I, R[]> {
  return {
    parse: (remaining) => {
      const results: R[] = [];
      let current = remaining;
      const result = parse(parser, current);
      if (!result.success) return { success: false };
      results.push(result.data);
      current = result.rest;
      while (true) {
        const result = parse(parser, current);
        if (!result.success) break;
        results.push(result.data);
        current = result.rest;
      }
      return { success: true, data: results, rest: current };
    },
  };
}

/**
 * Matches 0 or more occurrences of a parser until {@linkcode end} succeed and returns a list of the
 * results.
 *
 * Note: {@linkcode end} is not consumed.
 * @param parser The parser to match.
 * @param end The parser to match at the end.
 * @returns
 */
export function manyTill<I, R>(
  parser: MaybeLaziedParser<I, R>,
  end: MaybeLaziedParser<I, any>,
): Parser<I, R[]> {
  return {
    parse: (remaining) => {
      const results: R[] = [];
      let current = remaining;
      while (true) {
        const result = parse(parser, current);
        if (!result.success) break;
        results.push(result.data);
        current = result.rest;
        const endResult = parse(end, current);
        if (endResult.success) break;
      }
      return { success: true, data: results, rest: current };
    },
  };
}

/**
 * Matches 0 or more occurrences of a character in the given set and returns it as a string.
 * @param chars The characters to match.
 * @returns
 */
export function manyChar(chars: string): Parser<string, string> {
  return join(many(oneOf(chars)));
}

/**
 * Matches 1 or more occurrences of a character in the given set and returns it as a string.
 * @param chars The characters to match.
 * @returns
 */
export function manyChar1(chars: string): Parser<string, string> {
  return join(many1(oneOf(chars)));
}

/**
 * Matches a parser and then applies a function to the result.
 * @param parser The parser to match.
 * @param fn The function to apply to the result.
 * @returns
 *
 * @example
 * ```javascript
 * parse(map(just("42"), (n) => Number(n)), "42abc"); // => { success: true; data: 42; rest: "abc" }
 * parse(map(just("42"), (n) => Number(n)), "abc"); // => { success: false }
 * ```
 */
export function map<I, T, U>(parser: MaybeLaziedParser<I, T>, fn: (data: T) => U): Parser<I, U> {
  return {
    parse: (remaining) => {
      const result = parse(parser, remaining);
      if (!result.success) return { success: false };
      return { success: true, data: fn(result.data), rest: result.rest };
    },
  };
}

/**
 * Joins the result of a parser that returns an array of strings with a separator and returns the
 * result as a string.
 * @param parser The parser to match.
 * @param sep The separator to use.
 * @returns
 */
export function join<I>(
  parser: MaybeLaziedParser<I, readonly string[]>,
  sep = "",
): Parser<I, string> {
  return {
    parse: (remaining) => {
      const result = parse(parser, remaining);
      if (!result.success) return { success: false };
      return { success: true, data: result.data.join(sep), rest: result.rest };
    },
  };
}

/**
 * Matches 0 or 1 occurrence of a parser and returns the result in an {@linkcode Option}.
 * @param parser The parser to match.
 * @returns
 *
 * @example
 * ```javascript
 * parse(optional(just("a")), "abc"); // => { success: true; data: { _tag: "Some"; value: "a" }; rest: "bc" }
 * parse(optional(just("a")), "bc"); // => { success: true; data: { _tag: "None" }; rest: "bc" }
 * ```
 */
export function optional<I, R>(parser: MaybeLaziedParser<I, R>): Parser<I, Option<R>> {
  return {
    parse: (remaining) => {
      const result = parse(parser, remaining);
      if (result.success)
        return { success: true, data: { _tag: "Some", value: result.data }, rest: result.rest };
      return { success: true, data: { _tag: "None" }, rest: remaining };
    },
  };
}

/**
 * Matches a single character that is in the given set of characters and returns it.
 * @param chars The characters to match.
 * @returns
 *
 * @example
 * ```javascript
 * parse(oneOf("abc"), "abc"); // => { success: true; data: "a"; rest: "bc" }
 * parse(oneOf("abc"), "def"); // => { success: false }
 * ```
 */
export function oneOf(chars: string): Parser<string, string> {
  return {
    parse: (remaining) => {
      if (!remaining.length) return { success: false };
      const char = remaining[0]!;
      if (!chars.includes(char)) return { success: false };
      return { success: true, data: char, rest: remaining.slice(1) };
    },
  };
}

/**
 * Matches a single character that is not in the given set of characters and returns it.
 * @param chars The characters to match.
 * @returns
 *
 * @example
 * ```javascript
 * parse(noneOf("abc"), "abc"); // => { success: false }
 * parse(noneOf("abc"), "def"); // => { success: true; data: "d"; rest: "ef" }
 * ```
 */
export function noneOf(chars: string): Parser<string, string> {
  return {
    parse: (remaining) => {
      if (!remaining.length) return { success: false };
      const char = remaining[0]!;
      if (chars.includes(char)) return { success: false };
      return { success: true, data: char, rest: remaining.slice(1) };
    },
  };
}

/**
 * Matches 2 parsers and returns a pair of the results.
 *
 * It is actually a special case of {@linkcode seq} but is separated for better readability.
 * @param left The first parser to match.
 * @param right The second parser to match.
 * @returns
 */
export function pair<I, R1, R2>(
  left: MaybeLaziedParser<I, R1>,
  right: MaybeLaziedParser<I, R2>,
): Parser<I, [R1, R2]> {
  return {
    parse: (remaining) => {
      const leftResult = parse(left, remaining);
      if (!leftResult.success) return { success: false };
      const rightResult = parse(right, leftResult.rest);
      if (!rightResult.success) return { success: false };
      return {
        success: true,
        data: [leftResult.data, rightResult.data],
        rest: rightResult.rest,
      };
    },
  };
}

/**
 * Matches an array of parsers and returns an array of the results.
 * @param parsers The parsers to match.
 * @returns
 */
export function seq<I, const Parsers extends readonly MaybeLaziedParser<I, any>[]>(
  parsers: Parsers,
): Parser<
  I,
  {
    -readonly [K in keyof Parsers]: Parsers[K] extends MaybeLaziedParser<any, infer T> ? T : never;
  }
> {
  return {
    parse: (remaining) => {
      const results: unknown[] = [];
      let current = remaining;
      for (const parser of parsers) {
        const result = parse(parser, current);
        if (!result.success) return { success: false };
        results.push(result.data);
        current = result.rest;
      }
      return { success: true, data: results as never, rest: current };
    },
  };
}

/**
 * Matches 2 parsers in order and returns the result of the first one.
 * @param left The first parser to match.
 * @param right The second parser to match.
 * @returns
 */
export function left<I, R>(
  left: MaybeLaziedParser<I, R>,
  right: MaybeLaziedParser<I, any>,
): Parser<I, R> {
  return {
    parse: (remaining) => {
      const leftResult = parse(left, remaining);
      if (!leftResult.success) return { success: false };
      const rightResult = parse(right, leftResult.rest);
      if (!rightResult.success) return { success: false };
      return { success: true, data: leftResult.data, rest: rightResult.rest };
    },
  };
}

/**
 * Matches 2 parsers in order and returns the result of the second one.
 * @param left The first parser to match.
 * @param right The second parser to match.
 * @returns
 */
export function right<I, R>(
  left: MaybeLaziedParser<I, any>,
  right: MaybeLaziedParser<I, R>,
): Parser<I, R> {
  return {
    parse: (remaining) => {
      const leftResult = parse(left, remaining);
      if (!leftResult.success) return { success: false };
      const rightResult = parse(right, leftResult.rest);
      if (!rightResult.success) return { success: false };
      return { success: true, data: rightResult.data, rest: rightResult.rest };
    },
  };
}

/**
 * Matches a parser between two parsers and returns the result of the inner parser.
 * @param open The parser to match before the inner parser.
 * @param close The parser to match after the inner parser.
 * @param parser The inner parser to match.
 * @returns
 */
export function between<I, R>(
  open: MaybeLaziedParser<I, any>,
  close: MaybeLaziedParser<I, any>,
  parser: MaybeLaziedParser<I, R>,
): Parser<I, R> {
  return right(open, left(parser, close));
}

/**
 * Matches 0 or more occurrences of a parser separated by another parser and returns an array of the
 * results.
 * @param parser The parser to match.
 * @param sep The parser to match between occurrences.
 * @returns
 */
export function sepBy<I, R>(
  parser: MaybeLaziedParser<I, R>,
  sep: MaybeLaziedParser<I, any>,
): Parser<I, R[]> {
  return {
    parse: (remaining) => {
      const results: R[] = [];
      let current = remaining;
      while (true) {
        const result = parse(parser, current);
        if (!result.success) break;
        results.push(result.data);
        current = result.rest;
        const separatorResult = parse(sep, current);
        if (!separatorResult.success) break;
        current = separatorResult.rest;
      }
      return { success: true, data: results, rest: current };
    },
  };
}

/**
 * Matches 1 or more occurrences of a parser separated by another parser and returns an array of the
 * results.
 * @param parser The parser to match.
 * @param sep The parser to match between occurrences.
 * @returns
 */
export function sepBy1<I, R>(
  parser: MaybeLaziedParser<I, R>,
  sep: MaybeLaziedParser<I, any>,
): Parser<I, R[]> {
  return {
    parse: (remaining) => {
      const results: R[] = [];
      let current = remaining;
      const result = parse(parser, current);
      if (!result.success) return { success: false };
      results.push(result.data);
      current = result.rest;
      while (true) {
        const separatorResult = parse(sep, current);
        if (!separatorResult.success) break;
        current = separatorResult.rest;
        const result = parse(parser, current);
        if (!result.success) break;
        results.push(result.data);
        current = result.rest;
      }
      return { success: true, data: results, rest: current };
    },
  };
}

/**
 * Matches 1 or more occurrences of {@linkcode parser}, separated by {@linkcode op} returns a value
 * obtained by a left associative application of all functions returned by {@linkcode op} to the
 * values returned by {@linkcode parser}. This parser can for example be used to eliminate left
 * recursion which typically occurs in expression grammars.
 * @param parser The parser to match.
 * @param op The parser to match between occurrences.
 * @returns
 */
export function chainL1<I, R>(
  parser: MaybeLaziedParser<I, R>,
  op: MaybeLaziedParser<I, (acc: R, term: R) => R>,
): Parser<I, R> {
  return {
    parse: (remaining) => {
      const termResult = parse(parser, remaining);
      if (!termResult.success) return { success: false };
      let acc = termResult.data;
      let current = termResult.rest;
      while (true) {
        const opResult = parse(op, current);
        if (!opResult.success) break;
        current = opResult.rest;
        const termResult = parse(parser, current);
        if (!termResult.success) break;
        acc = opResult.data(acc, termResult.data);
        current = termResult.rest;
      }
      return { success: true, data: acc, rest: current };
    },
  };
}

// NOTE: Contrary to the Haskell megaparsec library, we consume the preceding whitespace instead of
// the trailing one for `lexeme` and `symbol` parsers.
// This is intentional to align with the type-level parser behavior, see `./static.ts` for
// explanation.
/**
 * Matches a lexeme and ignores the preceding whitespace.
 * @param parser The parser to match.
 * @returns
 */
export function lexeme<R>(parser: MaybeLaziedParser<string, R>): Parser<string, R> {
  return right(space, parser);
}

/**
 * Matches a symbol (a string) and ignores the preceding whitespace.
 * @param str The string to match.
 * @returns
 */
export function symbol(str: string): Parser<string, string> {
  return right(space, just(str));
}

/**
 * Matches a symbol (a string) with optional preceding whitespace and returns {@linkcode as}.
 * @param str The string to match.
 * @param as The value to return.
 * @returns
 */
export function symbolAs<R>(str: string, as: R): Parser<string, R> {
  return right(space, justAs(str, as));
}

/******************
 * Simple parsers *
 ******************/
/**
 * Matches 0 or more space characters and ignores them.
 */
export const space: Parser<string, void> = map(
  () => many(spaceChar),
  () => undefined,
);

/**
 * Matches 1 or more space characters and ignores them.
 */
export const space1: Parser<string, void> = map(
  () => many1(spaceChar),
  () => undefined,
);

// eslint-disable-next-line jsdoc/require-returns
/**
 * Matches a single literal character, handling conventional escape sequences.
 */
export const charLiteral: Parser<string, string> = or(
  right(
    just("\\"),
    choice([
      justAs("b", "\u0008"),
      justAs("f", "\u000c"),
      justAs("n", "\n"),
      justAs("r", "\r"),
      justAs("t", "\t"),
      () => anyChar,
    ]),
  ),
  () => anyChar,
);

/**
 * Matches a string literal with the given quote character and returns it.
 *
 * Note: Surrounding quotes are not included in the result.
 * @param quote The quote character to use.
 * @returns
 */
export function stringLiteral(quote: string): Parser<string, string> {
  return between(just(quote), just(quote), join(manyTill(charLiteral, just(quote))));
}

/**
 * Matches a decimal format of an integer and returns it as a number.
 */
export const decimal: Parser<string, number> = map(
  () => or(just("0"), join(pair(nonZeroDigitChar, join(many(digitChar))))),
  (str) => Number(str),
);

/**
 * Matches a decimal format of an integer and returns it as a bigint.
 */
export const decimalBigInt: Parser<string, bigint> = map(
  () => or(just("0"), join(pair(nonZeroDigitChar, join(many(digitChar))))),
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore - BigInt is only available in ES2020+
  (str) => (typeof BigInt === "function" ? BigInt(str) : (Number(str) as unknown as bigint)),
);

/**
 * Matches a floating point number and returns it as a number.
 */
export const float: Parser<string, number> = map(
  () =>
    join(
      pair(
        or(just("0"), join(pair(nonZeroDigitChar, join(many(digitChar))))),
        map(optional(join(pair(just("."), join(many1(digitChar))))), (opt) =>
          opt._tag === "Some" ? opt.value : "",
        ),
      ),
    ),
  (str) => Number(str),
);

/**
 * Matches an optional sign (`+` or `-`) and an integral parser, and returns the result as the same
 * type of the integral parser (number or bigint).
 * @param parser The parser to match.
 * @returns
 */
export function signed<N extends number | bigint>(parser: Parser<string, N>): Parser<string, N> {
  return map(
    () =>
      pair(
        map(optional(left(oneOf("+-"), space)), (sign) =>
          sign._tag === "Some" ? sign.value : "+",
        ),
        parser,
      ),
    ([sign, n]) => (sign === "-" ? -n : n) as N,
  );
}

/**************
 * Characters *
 **************/
/**
 * Matches a single character and returns it.
 */
export const anyChar: Parser<string, string> = {
  parse: (remaining) => {
    if (!remaining.length) return { success: false };
    const char = remaining[0]!;
    return { success: true, data: char, rest: remaining.slice(1) };
  },
};

export const whitespaces = " \t\n\r";
/**
 * Matches a single space character.
 */
export const spaceChar = oneOf(whitespaces);

export const nonZeroDigits = "123456789";
/**
 * Matches a single non-zero digit character.
 */
export const nonZeroDigitChar = oneOf(nonZeroDigits);

export const digits = `0${nonZeroDigits}`;
/**
 * Matches a single digit character.
 */
export const digitChar = oneOf(digits);

export const uppers = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
/**
 * Matches a single uppercase character.
 */
export const upperChar = oneOf(uppers);

export const lowers = "abcdefghijklmnopqrstuvwxyz";
/**
 * Matches a single lowercase character.
 */
export const lowerChar = oneOf(lowers);

export const letters = `${uppers}${lowers}`;
/**
 * Matches a single letter character.
 */
export const letterChar = oneOf(letters);
