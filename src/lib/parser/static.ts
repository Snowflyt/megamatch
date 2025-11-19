/**
 * Parser combinators implementation at type-level TypeScript.
 *
 * Note: To avoid the maximum instantiation depth error (i.e., `Type instantiation is excessively
 * deep and possibly infinite`), optimizations are applied to the combinators as much as possible.
 * For example, we can define `Between` as `Right<Open, Left<P, Close>>`, but this would increase
 * the instantiation depth too much, so we define it as a separate combinator.
 * @module
 * @private
 * @internal
 */

import type { Arg0, Call1W, Call2W, RetType, TypeLambda, TypeLambda1 } from "hkt-core";

import type { List, Option, Str } from "../type-utils";

/**
 * A parser is a {@linkcode TypeLambda} that accepts a token stream and returns a
 * {@linkcode ParsingResult}.
 */
export type Parser<I, R> = TypeLambda<[remaining: I], ParsingResult<I, R>>;
export type ParsingResult<I, R> = { success: true; data: R; rest: I } | { success: false };

export type MaybeLaziedParser<I, R> = Parser<I, R> | (() => Parser<I, R>);

/**
 * Parse a token stream using a {@linkcode MaybeLaziedParser}.
 *
 * @example
 * ```typescript
 * type _1 = Parse<Just<"a">, "abc">; // { success: true; data: "a"; rest: "bc" }
 * type _2 = Parse<Just<"ab">, "abc">; // { success: true; data: "ab"; rest: "c" }
 * ```
 */
export type Parse<P, Remaining> =
  (P extends () => infer P ? P : P) extends infer P ? Call1W<P, Remaining> : never;

/**
 * Extract the input type of a {@linkcode MaybeLaziedParser}.
 */
export type ExtractParserInput<P> =
  (P extends () => infer P ? P : P) extends infer P ?
    P extends Parser<infer I, any> ?
      I
    : unknown // TypeScript sometimes can’t handle recursive parsers, we use `unknown` as a fallback
  : never;
/**
 * Extract the return type of a {@linkcode MaybeLaziedParser}.
 */
export type ExtractParserReturn<P> =
  (P extends () => infer P ? P : P) extends infer P ?
    P extends Parser<any, infer R> ?
      R
    : unknown // TypeScript sometimes can’t handle recursive parsers, we use `unknown` as a fallback
  : never;

/***************
 * Combinators *
 ***************/
/**
 * Matches a string from the input string and returns it.
 *
 * @example
 * ```typescript
 * type _1 = Parse<Just<"a">, "abc">; // { success: true; data: "a"; rest: "bc" }
 * type _2 = Parse<Just<"ab">, "abc">; // { success: true; data: "ab"; rest: "c" }
 * type _3 = Parse<Just<"a" | "b">, "bca">; // { success: true; data: "b"; rest: "ca" }
 * ```
 */
export interface Just<Str extends string> extends Parser<string, Str> {
  return: ParseJust<Arg0<this>, Str>;
}
type ParseJust<Remaining, Str extends string> =
  Remaining extends `${Str}${infer Rest}` ?
    Remaining extends `${infer S extends Str}${Rest}` ?
      { success: true; data: S; rest: Rest }
    : never
  : { success: false };

/**
 * Matches a string from the input string and returns {@linkcode As}.
 */
export interface JustAs<Str extends string, As> extends Parser<string, As> {
  return: ParseJust<Arg0<this>, Str> extends { success: true; rest: infer Rest } ?
    { success: true; data: As; rest: Rest }
  : { success: false };
}

/**
 * Matches a keyword from the input string and returns it.
 *
 * The difference between {@linkcode Just} and {@linkcode Keyword} is that the
 * next character after the matched keyword must be the end of input or not
 * in the given alphabet.
 *
 * @example
 * ```typescript
 * type _1 = Parse<Keyword<"let", Letter>, "letx = 10">; // { success: false }
 * type _2 = Parse<Keyword<"let", Letter>, "let x = 10">; // { success: true; data: "let"; rest: " x = 10" }
 * ```
 */
export interface Keyword<Str extends string, Alphabet extends string> extends Parser<string, Str> {
  return: ParseKeyword<Arg0<this>, Str, Alphabet>;
}
type ParseKeyword<Remaining, Str extends string, Alphabet extends string> =
  Remaining extends `${Str}${Alphabet}${string}` ? { success: false } : ParseJust<Remaining, Str>;

/**
 * Matches a keyword from the input string and returns {@linkcode As}.
 *
 * The difference between {@linkcode JustAs} and {@linkcode KeywordAs} is that
 * the next character after the matched keyword must be the end of input or not
 * in the given alphabet.
 */
export interface KeywordAs<Str extends string, Alphabet extends string, As>
  extends Parser<string, As> {
  return: ParseKeyword<Arg0<this>, Str, Alphabet> extends { success: true; rest: infer Rest } ?
    { success: true; data: As; rest: Rest }
  : { success: false };
}

/**
 * Tries a list of parsers in order, returning the result of the first successful one, or a failure
 * if none of them succeed.
 */
export interface Choice<Parsers extends MaybeLaziedParser<any, any>[]>
  extends Parser<ExtractParserInput<Parsers[number]>, ExtractParserReturn<Parsers[number]>> {
  return: ParseChoice<Arg0<this>, Parsers>;
}
type ParseChoice<Remaining, Parsers> =
  Parsers extends readonly [infer Head, ...infer Tail] ?
    Parse<Head, Remaining> extends { success: true; data: infer Data; rest: infer Rest } ?
      { success: true; data: Data; rest: Rest }
    : ParseChoice<Remaining, Tail>
  : { success: false };

/**
 * Tries 2 parsers in order, returning the result of the first successful one, or a failure if none
 * of them succeed.
 */
export interface Or<L extends MaybeLaziedParser<any, any>, R extends MaybeLaziedParser<any, any>>
  extends Parser<
    ExtractParserInput<L> | ExtractParserInput<R>,
    ExtractParserReturn<L> | ExtractParserReturn<R>
  > {
  return: ParseOr<Arg0<this>, L, R>;
}
type ParseOr<Remaining, L, R> =
  Parse<L, Remaining> extends { success: true; data: infer Left; rest: infer Rest } ?
    { success: true; data: Left; rest: Rest }
  : Parse<R, Remaining> extends { success: true; data: infer Right; rest: infer Rest } ?
    { success: true; data: Right; rest: Rest }
  : { success: false };

/**
 * Matches 0 or more occurrences of a parser and returns a list of the results.
 */
export interface Many<P extends MaybeLaziedParser<any, any>>
  extends Parser<ExtractParserInput<P>, ExtractParserReturn<P>[]> {
  return: ParseMany<Arg0<this>, P>;
}
type ParseMany<Remaining, P, Acc extends unknown[] = []> =
  Parse<P, Remaining> extends { success: true; data: infer Data; rest: infer Rest } ?
    ParseMany<Rest, P, [...Acc, Data]>
  : { success: true; data: Acc; rest: Remaining };

/**
 * Matches 1 or more occurrences of a parser and returns a list of the results.
 */
export interface Many1<P extends MaybeLaziedParser<any, any>>
  extends Parser<ExtractParserInput<P>, ExtractParserReturn<P>[]> {
  return: ParseMany1<Arg0<this>, P>;
}
type ParseMany1<Remaining, P, Acc extends unknown[] = []> =
  Parse<P, Remaining> extends { success: true; data: infer Data; rest: infer Rest } ?
    ParseMany1<Rest, P, [...Acc, Data]>
  : Acc extends [] ? { success: false }
  : { success: true; data: Acc; rest: Remaining };

/**
 * Matches 0 or more occurrences of a parser until {@linkcode End} succeed and returns a list of the
 * results.
 *
 * Note: {@linkcode End} is not consumed.
 */
export interface ManyTill<
  P extends MaybeLaziedParser<any, any>,
  End extends MaybeLaziedParser<any, any>,
> extends Parser<ExtractParserInput<P>, ExtractParserReturn<P>[]> {
  return: ParseManyUntil<Arg0<this>, P, End>;
}
type ParseManyUntil<Remaining, P, End, Acc extends unknown[] = []> =
  Parse<End, Remaining> extends { success: true } ? { success: true; data: Acc; rest: Remaining }
  : Parse<P, Remaining> extends { success: true; data: infer Data; rest: infer Rest } ?
    ParseManyUntil<Rest, P, End, [...Acc, Data]>
  : { success: false };

/**
 * Matches 0 or more occurrences of a character in the given set and returns it as a string.
 */
export interface ManyChar<Char extends string> extends Parser<string, string> {
  return: ParseManyChar<Arg0<this>, Char>;
}
type ParseManyChar<Remaining, Char extends string, Acc extends string = ""> =
  Remaining extends `${infer C extends Char}${infer Rest}` ? ParseManyChar<Rest, Char, `${Acc}${C}`>
  : { success: true; data: Acc; rest: Remaining };

/**
 * Matches 1 or more occurrences of a character in the given set and returns it as a string.
 */
export interface ManyChar1<Char extends string> extends Parser<string, string> {
  return: ParseManyChar1<Arg0<this>, Char>;
}
type ParseManyChar1<Remaining, Char extends string, Acc extends string = ""> =
  Remaining extends `${infer C extends Char}${infer Rest}` ?
    ParseManyChar<Rest, Char, `${Acc}${C}`> extends (
      { success: true; data: infer Data extends string; rest: infer Rest2 }
    ) ?
      { success: true; data: `${Acc}${Data}`; rest: Rest2 }
    : never
  : { success: false };

/**
 * Matches a parser and then applies a type-level function to the result.
 */
export interface Map<
  P extends MaybeLaziedParser<any, any>,
  F extends TypeLambda1<ExtractParserReturn<P>>,
> extends Parser<ExtractParserInput<P>, RetType<F, [ExtractParserReturn<P>]>> {
  return: ParseMapResult<Arg0<this>, P, F>;
}
type ParseMapResult<Remaining, P, F> =
  Parse<P, Remaining> extends { success: true; data: infer Data; rest: infer Rest } ?
    { success: true; data: Call1W<F, Data>; rest: Rest }
  : { success: false };

/**
 * Joins the result of a parser with a separator and returns the result as a string.
 */
export interface Join<P extends MaybeLaziedParser<any, readonly string[]>, Sep extends string = "">
  extends Parser<ExtractParserInput<P>, string> {
  return: ParseJoin<Arg0<this>, P, Sep>;
}
type ParseJoin<Remaining, P, Sep extends string> =
  Parse<P, Remaining> extends (
    { success: true; data: infer Data extends readonly string[]; rest: infer Rest }
  ) ?
    { success: true; data: List.Join<Data, Sep>; rest: Rest }
  : { success: false };

/**
 * Matches 0 or 1 occurrence of a parser and returns the result in an {@linkcode Option}.
 */
export interface Optional<P extends MaybeLaziedParser<any, any>>
  extends Parser<ExtractParserInput<P>, Option<ExtractParserReturn<P>>> {
  return: ParseOptional<Arg0<this>, P>;
}
type ParseOptional<Remaining, P> =
  Parse<P, Remaining> extends { success: true; data: infer Data; rest: infer Rest } ?
    { success: true; data: { _tag: "Some"; value: Data }; rest: Rest }
  : { success: true; data: { _tag: "None" }; rest: Remaining };

/**
 * Matches a single character that does not extend the given char and returns it.
 */
export interface NoneOf<Char extends string> extends Parser<string, string> {
  return: ParseNoneOf<Arg0<this>, Char>;
}
type ParseNoneOf<Remaining, Char> =
  Remaining extends `${infer C}${infer Rest}` ?
    C extends Char ?
      { success: false }
    : { success: true; data: C; rest: Rest }
  : { success: false };

/**
 * Matches 2 parsers and returns a pair of the results.
 *
 * It is actually a special case of {@linkcode Seq} but is separated for better readability.
 */
export interface Pair<L extends MaybeLaziedParser<any, any>, R extends MaybeLaziedParser<any, any>>
  extends Parser<
    ExtractParserInput<L> | ExtractParserInput<R>,
    [ExtractParserReturn<L>, ExtractParserReturn<R>]
  > {
  return: ParsePair<Arg0<this>, L, R>;
}
type ParsePair<Remaining, L, R> =
  Parse<L, Remaining> extends { success: true; data: infer Left; rest: infer Rest } ?
    Parse<R, Rest> extends { success: true; data: infer Right; rest: infer Rest2 } ?
      { success: true; data: [Left, Right]; rest: Rest2 }
    : { success: false }
  : { success: false };

/**
 * Matches a list of parsers and returns a list of the results.
 */
export interface Seq<Parsers extends MaybeLaziedParser<any, any>[]>
  extends Parser<
    ExtractParserInput<Parsers[number]>,
    { [K in keyof Parsers]: ExtractParserReturn<Parsers[K]> }
  > {
  return: ParseSeq<Arg0<this>, Parsers>;
}
type ParseSeq<Remaining, Parsers, Acc extends unknown[] = []> =
  Parsers extends readonly [infer Head, ...infer Tail] ?
    Parse<Head, Remaining> extends { success: true; data: infer Data; rest: infer Rest } ?
      ParseSeq<Rest, Tail, [...Acc, Data]>
    : { success: false }
  : { success: true; data: Acc; rest: Remaining };

/**
 * Matches 2 parsers in order and returns the result of the first one.
 */
export interface Left<L extends MaybeLaziedParser<any, any>, R extends MaybeLaziedParser<any, any>>
  extends Parser<ExtractParserInput<L> | ExtractParserInput<R>, ExtractParserReturn<L>> {
  return: ParseLeft<Arg0<this>, L, R>;
}
type ParseLeft<Remaining, L, R> =
  Parse<L, Remaining> extends { success: true; data: infer Left; rest: infer Rest } ?
    Parse<R, Rest> extends { success: true; rest: infer Rest2 } ?
      { success: true; data: Left; rest: Rest2 }
    : { success: false }
  : { success: false };

/**
 * Matches 2 parsers in order and returns the result of the second one.
 */
export interface Right<L extends MaybeLaziedParser<any, any>, R extends MaybeLaziedParser<any, any>>
  extends Parser<ExtractParserInput<L> | ExtractParserInput<R>, ExtractParserReturn<R>> {
  return: ParseRight<Arg0<this>, L, R>;
}
type ParseRight<Remaining, L, R> =
  Parse<L, Remaining> extends { success: true; rest: infer Rest } ?
    Parse<R, Rest> extends { success: true; data: infer Right; rest: infer Rest2 } ?
      { success: true; data: Right; rest: Rest2 }
    : { success: false }
  : { success: false };

/**
 * Matches a parser between two parsers and returns the result of the inner parser.
 */
export interface Between<
  Open extends MaybeLaziedParser<any, any>,
  Close extends MaybeLaziedParser<any, any>,
  P extends MaybeLaziedParser<any, any>,
> extends Parser<
    ExtractParserInput<Open> | ExtractParserInput<Close> | ExtractParserInput<P>,
    ExtractParserReturn<P>
  > {
  return: ParseBetween<Arg0<this>, Open, Close, P>;
}
type ParseBetween<Remaining, Open, Close, P> =
  Parse<Open, Remaining> extends { success: true; rest: infer Rest } ?
    Parse<P, Rest> extends { success: true; data: infer Data; rest: infer Rest2 } ?
      Parse<Close, Rest2> extends { success: true; rest: infer Rest3 } ?
        { success: true; data: Data; rest: Rest3 }
      : { success: false }
    : { success: false }
  : { success: false };

/**
 * Matches 0 or more occurrences of a parser separated by another parser and returns a list of the
 * results.
 */
export interface SepBy<
  P extends MaybeLaziedParser<any, any>,
  Sep extends MaybeLaziedParser<any, any>,
> extends Parser<ExtractParserInput<P> | ExtractParserInput<Sep>, ExtractParserReturn<P>[]> {
  return: ParseSepBy<Arg0<this>, P, Sep>;
}
type ParseSepBy<Remaining, P, Sep> =
  // If the first parser succeeds, try to parse [Sep, P] repeatedly
  Parse<P, Remaining> extends { success: true; data: infer Data; rest: infer Rest } ?
    ConsumeSepByRest<Rest, P, Sep, [Data]> extends [infer Result, infer Rest2] ?
      { success: true; data: Result; rest: Rest2 }
    : never
  : // If the first parser fails, return an empty list.
    { success: true; data: []; rest: Remaining };
// Parse [Sep, P] repeatedly
type ConsumeSepByRest<Remaining, P, Sep, Acc extends unknown[]> =
  Parse<Sep, Remaining> extends { success: true; rest: infer Rest } ?
    Parse<P, Rest> extends { success: true; data: infer Data; rest: infer Rest2 } ?
      ConsumeSepByRest<Rest2, P, Sep, [...Acc, Data]>
    : [Acc, Remaining]
  : [Acc, Remaining];

/**
 * Matches 1 or more occurrences of a parser separated by another parser and returns a list of the
 * results.
 */
export interface SepBy1<
  P extends MaybeLaziedParser<any, any>,
  Sep extends MaybeLaziedParser<any, any>,
> extends Parser<ExtractParserInput<P> | ExtractParserInput<Sep>, ExtractParserReturn<P>[]> {
  return: ParseSepBy1<Arg0<this>, P, Sep>;
}
type ParseSepBy1<Remaining, P, Sep> =
  // If the first parser succeeds, try to parse [Sep, P] repeatedly
  Parse<P, Remaining> extends { success: true; data: infer Data; rest: infer Rest } ?
    ConsumeSepByRest<Rest, P, Sep, [Data]> extends [infer Result, infer Rest2] ?
      { success: true; data: Result; rest: Rest2 }
    : never
  : // If the first parser fails, return a failure
    { success: false };

/**
 * Matches 1 or more occurrences of {@linkcode P}, separated by {@linkcode Op} returns a value
 * obtained by a left associative application of all functions returned by {@linkcode Op} to the
 * values returned by {@linkcode P}. This parser can for example be used to eliminate left recursion
 * which typically occurs in expression grammars.
 */
export interface ChainL1<
  P extends MaybeLaziedParser<any, any>,
  Op extends MaybeLaziedParser<any, any>,
> extends Parser<ExtractParserInput<P> | ExtractParserInput<Op>, ExtractParserReturn<P>[]> {
  return: ParseChainL1<Arg0<this>, P, Op>;
}
type ParseChainL1<Remaining, P, Op> =
  // If the first parser succeeds, try to parse [Op, P] repeatedly
  Parse<P, Remaining> extends { success: true; data: infer Data; rest: infer Rest } ?
    ParseChainL1Rest<Rest, P, Op, Data> extends [infer Result, infer Rest2] ?
      { success: true; data: Result; rest: Rest2 }
    : never
  : // If the first parser fails, return a failure
    { success: false };
// Parse [Op, P] repeatedly
type ParseChainL1Rest<Remaining, P, Op, Acc> =
  Parse<Op, Remaining> extends { success: true; data: infer F; rest: infer Rest } ?
    Parse<P, Rest> extends { success: true; data: infer Data; rest: infer Rest2 } ?
      ParseChainL1Rest<Rest2, P, Op, Call2W<F, Acc, Data>>
    : [Acc, Remaining]
  : [Acc, Remaining];

// NOTE: Contrary to the Haskell megaparsec library, we consume the preceding whitespace instead of
// the trailing one for `Lexeme` and `Symbol` parsers.
// This is intentional because TypeScript always complains `Type instantiation is excessively deep`
// when we try to use the trailing version.
// I have no idea why this happens, but it seems changing to preceding whitespace just works.
/**
 * Matches a lexeme and ignores the preceding whitespace.
 */
export type Lexeme<P extends MaybeLaziedParser<any, any>> = Right<Space, P>;

/**
 * PERF: An optimization for `Lexeme<Choice<...>>` to avoid the maximum instantiation depth error.
 */
export interface LexemeChoice<Parsers extends MaybeLaziedParser<any, any>[]>
  extends Parser<string, ExtractParserReturn<Parsers[number]>> {
  return: ParseChoice<ParseSpace<Arg0<this>>["rest"], Parsers>;
}

/**
 * Matches a symbol (a string) and ignores the preceding whitespace.
 */
export type Symbol<Str extends string> = Right<Space, Just<Str>>;

/**
 * Matches a symbol (a string) with optional preceding whitespace and returns {@linkcode As}.
 */
export interface SymbolAs<Str extends string, As> extends Parser<string, As> {
  return: ParseSymbolAs<Arg0<this>, Str, As>;
}
type ParseSymbolAs<Remaining, Str extends string, As> =
  ParseSpace<Remaining>["rest"] extends `${Str}${infer Rest}` ?
    { success: true; data: As; rest: Rest }
  : { success: false };

/******************
 * Simple parsers *
 ******************/
/**
 * Matches 0 or more space characters and ignores them.
 */
export interface Space extends Parser<string, void> {
  return: ParseSpace<Arg0<this>>;
}
type ParseSpace<Remaining> =
  Remaining extends `${Whitespace}${infer Rest}` ?
    { success: true; data: void; rest: ParseSpace<Rest>["rest"] }
  : { success: true; data: void; rest: Remaining };

/**
 * Matches 1 or more space characters and ignores them.
 */
export interface Space1 extends Parser<string, void> {
  return: ParseSpace1<Arg0<this>>;
}
type ParseSpace1<Remaining> =
  Remaining extends `${Whitespace}${infer Rest}` ? ParseSpace<Rest> : { success: false };

/**
 * Matches a single literal character, handling conventional escape sequences.
 */
export interface CharLiteral extends Parser<string, string> {
  return: ParseCharLiteral<Arg0<this>>;
}
type ParseCharLiteral<Remaining> =
  Remaining extends `${infer C}${infer Rest}` ?
    C extends "\\" ?
      ParseEscape<Rest>
    : { success: true; data: C; rest: Rest }
  : { success: false };
type ParseEscape<Remaining> =
  Remaining extends `${infer C}${infer Rest}` ?
    C extends "b" ? { success: true; data: "\u0008"; rest: Rest }
    : C extends "f" ? { success: true; data: "\u000c"; rest: Rest }
    : C extends "n" ? { success: true; data: "\n"; rest: Rest }
    : C extends "r" ? { success: true; data: "\r"; rest: Rest }
    : C extends "t" ? { success: true; data: "\t"; rest: Rest }
    : { success: true; data: C; rest: Remaining }
  : { success: false };

/**
 * Matches a string literal with the given quote character and returns it.
 *
 * Note: Surrounding quotes are not included in the result.
 */
export interface StringLiteral<Quote extends string> extends Parser<string, string> {
  return: ParseStringLiteral<Arg0<this>, Quote>;
}
type ParseStringLiteral<Remaining, Quote extends string> =
  Remaining extends `${Quote}${infer Rest}` ? ParseStringLiteralRest<Rest, Quote>
  : { success: false };
type ParseStringLiteralRest<Remaining, Quote extends string, Acc extends string = ""> =
  ParseCharLiteral<Remaining> extends (
    { success: true; data: infer Data extends string; rest: infer Rest }
  ) ?
    Rest extends `${Quote}${infer Rest2}` ?
      { success: true; data: `${Acc}${Data}`; rest: Rest2 }
    : ParseStringLiteralRest<Rest, Quote, `${Acc}${Data}`>
  : { success: false };

/**
 * Matches a decimal format of an integer and returns it as a number.
 */
export interface Decimal extends Parser<string, number> {
  return: ParseDecimal<Arg0<this>>;
}
type ParseDecimal<Remaining> =
  Remaining extends `0${infer Rest}` ? { success: true; data: 0; rest: Rest }
  : ConsumeDigits<Remaining> extends [infer Rest, infer Acc extends string] ?
    Acc extends "" ?
      { success: false }
    : { success: true; data: Str.ToNumUnsafe<Acc>; rest: Rest }
  : never;
type ConsumeDigits<Remaining, Acc extends string = ""> =
  Remaining extends `${infer D extends Digit}${infer Rest}` ? ConsumeDigits<Rest, `${Acc}${D}`>
  : [Remaining, Acc];

/**
 * Matches a decimal format of an integer and returns it as a bigint.
 */
export interface DecimalBigInt extends Parser<string, bigint> {
  return: ParseDecimalBigInt<Arg0<this>>;
}
type ParseDecimalBigInt<Remaining> =
  Remaining extends `0${infer Rest}` ? { success: true; data: 0n; rest: Rest }
  : ConsumeDigits<Remaining> extends [infer Rest, infer Acc extends string] ?
    Acc extends "" ?
      { success: false }
    : { success: true; data: Str.ToBigIntUnsafe<Acc>; rest: Rest }
  : never;

/**
 * Matches a floating point number and returns it as a number.
 */
export interface Float extends Parser<string, number> {
  return: ParseFloat<Arg0<this>>;
}
type ParseFloat<Remaining> =
  ParseDecimal<Remaining> extends (
    { success: true; data: infer Data extends number; rest: infer Rest }
  ) ?
    Rest extends `.${infer Rest2}` ?
      ConsumeDigits<Rest2> extends [infer Rest3, infer Acc extends string] ?
        Acc extends "" ?
          { success: true; data: Data; rest: Rest }
        : { success: true; data: Str.ToNumUnsafe<`${Data}.${Acc}`>; rest: Rest3 }
      : never
    : { success: true; data: Data; rest: Rest }
  : { success: false };

/**
 * Matches an optional sign (`+` or `-`) and an integral parser, and returns the result as the same
 * type of the integral parser (number or bigint).
 */
export interface Signed<P extends MaybeLaziedParser<string, number | bigint>>
  extends Parser<ExtractParserInput<P>, ExtractParserReturn<P>> {
  return: ParseSigned<Arg0<this>, P>;
}
type ParseSigned<Remaining, P> =
  Remaining extends `-${infer Rest}` ?
    Parse<P, ParseSpace<Rest>["rest"]> extends (
      { success: true; data: infer Data extends number | bigint; rest: infer Rest2 }
    ) ?
      {
        success: true;
        data: Data extends number ? Str.ToNumUnsafe<`-${Data}`> : Str.ToBigIntUnsafe<`-${Data}`>;
        rest: Rest2;
      }
    : { success: false }
  : (Remaining extends `+${infer Rest}` ? ParseSpace<Rest>["rest"] : Remaining) extends (
    infer Remaining
  ) ?
    Parse<P, Remaining> extends (
      { success: true; data: infer Data extends number | bigint; rest: infer Rest }
    ) ?
      {
        success: true;
        data: Data extends number ? Str.ToNumUnsafe<`${Data}`> : Str.ToBigIntUnsafe<`${Data}`>;
        rest: Rest;
      }
    : { success: false }
  : never;

/**************
 * Characters *
 **************/
/**
 * Matches a single character and returns it.
 */
export interface AnyChar extends Parser<string, string> {
  return: ParseAnyChar<Arg0<this>>;
}
type ParseAnyChar<Remaining> =
  Remaining extends `${infer C}${infer Rest}` ? { success: true; data: C; rest: Rest }
  : { success: false };

export type Whitespace = " " | "\t" | "\n" | "\r";
/**
 * Matches a single space character.
 */
export type SpaceChar = Just<Whitespace>;

export type NonZeroDigit = Exclude<Digit, "0">;
/**
 * Matches a single non-zero digit character.
 */
export type NonZeroDigitChar = Just<NonZeroDigit>;

export type Digit = "0" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9";
/**
 * Matches a single digit character.
 */
export type DigitChar = Just<Digit>;

// prettier-ignore
export type Upper =
  | "A" | "B" | "C" | "D" | "E" | "F" | "G" | "H" | "I" | "J" | "K" | "L" | "M" | "N" | "O"
  | "P" | "Q" | "R" | "S" | "T" | "U" | "V" | "W" | "X" | "Y" | "Z";
/**
 * Matches a single uppercase character.
 */
export type UpperChar = Just<Upper>;

// prettier-ignore
export type Lower =
  | "a" | "b" | "c" | "d" | "e" | "f" | "g" | "h" | "i" | "j" | "k" | "l" | "m" | "n" | "o"
  | "p" | "q" | "r" | "s" | "t" | "u" | "v" | "w" | "x" | "y" | "z";
/**
 * Matches a single lowercase character.
 */
export type LowerChar = Just<Lower>;

export type Letter = Upper | Lower;
/**
 * Matches a single letter character.
 */
export type LetterChar = Just<Letter>;
