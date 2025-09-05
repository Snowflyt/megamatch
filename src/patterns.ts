/**
 * An optional module containing helpers to use alternative syntax to build pattern string.
 * @module
 */

import type { List, Union } from "./lib/type-utils";
import type { ValidUpperBoundStringLiteral } from "./types";

export type PatternLike =
  | string
  | number
  | boolean
  | bigint
  | null
  | undefined
  | DataViewConstructor
  | UnnamedArg
  | UnnamedArgSpread
  | NamedArg<string>
  | NamedArgSpread<string>
  | Any
  | DateConstructor
  | RegExpConstructor
  | ErrorConstructor
  | ArrayBufferConstructor
  | ArrayConstructor
  | MapConstructor
  | SetConstructor
  | WeakMapConstructor
  | WeakSetConstructor
  | PromiseConstructor
  | Int8ArrayConstructor
  | Uint8ArrayConstructor
  | Uint8ClampedArrayConstructor
  | Int16ArrayConstructor
  | Uint16ArrayConstructor
  | Int32ArrayConstructor
  | Uint32ArrayConstructor
  | Float32ArrayConstructor
  | Float64ArrayConstructor
  // eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
  | (typeof globalThis extends { BigInt64ArrayConstructor: infer T } ? T : never)
  // eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents, @typescript-eslint/no-duplicate-type-constituents
  | (typeof globalThis extends { BigUint64ArrayConstructor: infer T } ? T : never)
  | readonly PatternLike[]
  | { readonly [K in string]: PatternLike };

export type Stringify<P> =
  (
    [P] extends [never] ? "never"
    : [P] extends [bigint] ? `${P}n`
    : [P] extends [number | boolean | null | undefined] ? `${P}`
    : [P] extends [Any] ? "*"
    : [P] extends [Escaped<infer P>] ? P
    : [P] extends [string] ? `'${P}'`
    : [P] extends [DateConstructor] ? "Date"
    : [P] extends [RegExpConstructor] ? "RegExp"
    : [P] extends [ErrorConstructor] ? "Error"
    : [P] extends [ArrayBufferConstructor] ? "ArrayBuffer"
    : [P] extends [ArrayConstructor] ? "Array"
    : [P] extends [MapConstructor] ? "Map"
    : [P] extends [SetConstructor] ? "Set"
    : [P] extends [WeakMapConstructor] ? "WeakMap"
    : [P] extends [WeakSetConstructor] ? "WeakSet"
    : [P] extends [PromiseConstructor] ? "Promise"
    : [P] extends [Int8ArrayConstructor] ? "Int8Array"
    : [P] extends [Uint8ArrayConstructor] ? "Uint8Array"
    : [P] extends [Uint8ClampedArrayConstructor] ? "Uint8ClampedArray"
    : [P] extends [Int16ArrayConstructor] ? "Int16Array"
    : [P] extends [Uint16ArrayConstructor] ? "Uint16Array"
    : [P] extends [Int32ArrayConstructor] ? "Int32Array"
    : [P] extends [Uint32ArrayConstructor] ? "Uint32Array"
    : [P] extends [Float32ArrayConstructor] ? "Float32Array"
    : [P] extends [Float64ArrayConstructor] ? "Float64Array"
    : [P] extends [typeof globalThis extends { BigInt64ArrayConstructor: infer T } ? T : never] ?
      "BigInt64Array"
    : [P] extends [typeof globalThis extends { BigUint64ArrayConstructor: infer T } ? T : never] ?
      "BigUint64Array"
    : [P] extends [UnnamedArg] ? "_"
    : [P] extends [UnnamedArgSpread] ? `..._`
    : [P] extends [NamedArg<infer Name>] ? Name
    : [P] extends [NamedArgSpread<infer Name>] ? `...${Name}`
    : [P] extends [readonly unknown[]] ?
      { [K in keyof P]: Stringify<P[K]> } extends (
        infer StringifiedElements extends readonly string[]
      ) ?
        `[${List.Join<StringifiedElements, ", ">}]`
      : never
    : [keyof P] extends [never] ? "{}"
    : `{ ${StringifyObject<P>} }`
  ) extends infer R extends string ?
    R
  : never;
type StringifyObject<O, K extends keyof O = keyof O, Acc extends string = ""> =
  (
    [K] extends [never] ?
      Acc
    : StringifyObject<
        O,
        Exclude<K, Union.Last<K>>,
        `${Union.Last<K> & string}: ${Stringify<O[Union.Last<K> & keyof O]>}${Acc extends "" ? "" : ", "}${Acc}`
      >
  ) extends infer R extends string ?
    R
  : never;

/**
 * Build a pattern string.
 * @param pattern The pattern to stringify.
 * @returns
 */
export function p<const P extends PatternLike>(pattern: P): Stringify<P> {
  // eslint-disable-next-line @typescript-eslint/no-base-to-string
  if (typeof pattern === "bigint") return `${pattern}n` as Stringify<P>;
  if (
    typeof pattern === "number" ||
    typeof pattern === "boolean" ||
    pattern === null ||
    pattern === undefined
  )
    return String(pattern) as Stringify<P>;

  if (pattern === any) return "*" as Stringify<P>;

  if (typeof pattern === "string")
    return (
      pattern.startsWith("«") && pattern.endsWith("»") ?
        pattern.slice(1, -1)
      : "'" + pattern + "'") as Stringify<P>;

  if (Array.isArray(pattern) && pattern.length === 1 && unnamedArgSymbol in pattern[0])
    return "_" as Stringify<P>;
  if (unnamedArgSymbol in pattern) return "..._" as Stringify<P>;

  if (Array.isArray(pattern) && pattern.length === 1 && namedArgSymbol in pattern[0])
    return pattern[0].name as Stringify<P>;
  if (namedArgSymbol in pattern) return ("..." + pattern.name) as Stringify<P>;

  if (Array.isArray(pattern))
    return ("[" + (pattern as readonly PatternLike[]).map(p).join(", ") + "]") as Stringify<P>;

  if ((pattern as unknown) === Date) return "Date" as Stringify<P>;
  if ((pattern as unknown) === RegExp) return "RegExp" as Stringify<P>;
  if ((pattern as unknown) === Error) return "Error" as Stringify<P>;
  if ((pattern as unknown) === ArrayBuffer) return "ArrayBuffer" as Stringify<P>;
  if ((pattern as unknown) === Array) return "Array" as Stringify<P>;
  if ((pattern as unknown) === Map) return "Map" as Stringify<P>;
  if ((pattern as unknown) === Set) return "Set" as Stringify<P>;
  if ((pattern as unknown) === WeakMap) return "WeakMap" as Stringify<P>;
  if ((pattern as unknown) === WeakSet) return "WeakSet" as Stringify<P>;
  if ((pattern as unknown) === Promise) return "Promise" as Stringify<P>;
  if ((pattern as unknown) === Int8Array) return "Int8Array" as Stringify<P>;
  if ((pattern as unknown) === Uint8Array) return "Uint8Array" as Stringify<P>;
  if ((pattern as unknown) === Uint8ClampedArray) return "Uint8ClampedArray" as Stringify<P>;
  if ((pattern as unknown) === Int16Array) return "Int16Array" as Stringify<P>;
  if ((pattern as unknown) === Uint16Array) return "Uint16Array" as Stringify<P>;
  if ((pattern as unknown) === Int32Array) return "Int32Array" as Stringify<P>;
  if ((pattern as unknown) === Uint32Array) return "Uint32Array" as Stringify<P>;
  if ((pattern as unknown) === Float32Array) return "Float32Array" as Stringify<P>;
  if ((pattern as unknown) === Float64Array) return "Float64Array" as Stringify<P>;
  try {
    if (
      typeof globalThis !== "undefined" &&
      (pattern as unknown) === (globalThis as any).BigInt64Array
    )
      return "BigInt64Array" as Stringify<P>;
    if (
      typeof globalThis !== "undefined" &&
      (pattern as unknown) === (globalThis as any).BigUint64Array
    )
      return "BigUint64Array" as Stringify<P>;
  } catch {
    // Ignore
  }

  let result = "";
  for (const key in pattern as object) {
    const value = pattern[key];
    if (result) result += ", ";
    result += `${key}: ${p(value)}`;
  }
  return (result ? "{ " + result + " }" : "{}") as Stringify<P>;
}

export type Escaped<P extends string> = `«${P}»`;
function escape<P extends string>(pattern: P): Escaped<P> {
  return `«${pattern}»`;
}

/************
 * Wildcard *
 ************/
/**
 * A wildcard pattern.
 * @param upperBound The upper bound of the wildcard.
 * @returns
 */
export function any<UpperBound extends ValidUpperBoundStringLiteral>(
  upperBound: UpperBound,
): Escaped<UpperBound> {
  return escape(upperBound);
}
export type Any = <UpperBound extends ValidUpperBoundStringLiteral>(
  upperBound: UpperBound,
) => Escaped<UpperBound>;

export const string = any("string");
export const number = any("number");
export const boolean = any("boolean");
export const symbol = any("symbol");
export const bigint = any("bigint");
const function_ = any("function");
export { function_ as function };
export const object = any("object");
export const nonNullable = any("nonNullable");

/*******
 * Arg *
 *******/
const unnamedArgSymbol = Symbol();
export type UnnamedArg = [UnnamedArgSpread];
export interface UnnamedArgSpread {
  [unnamedArgSymbol]: true;
}

/**
 * Select an unnamed argument.
 */
export const _: UnnamedArg = [{ [unnamedArgSymbol]: true }];

const namedArgSymbol = Symbol();
export type NamedArg<Name extends string> = [NamedArgSpread<Name>];
export interface NamedArgSpread<Name extends string> {
  [namedArgSymbol]: true;
  name: Name;
}

/**
 * Select a named argument.
 * @param name The name of the argument.
 * @returns
 */
export function sel<Name extends string>(name: Name): NamedArg<Name> {
  return [{ [namedArgSymbol]: true, name }];
}

/**************
 * Or pattern *
 **************/
/**
 * Build an “or pattern”.
 * @param patterns The patterns to combine.
 * @returns
 */
export function or<const PS extends PatternLike[]>(
  ...patterns: PS
): Escaped<List.Join<{ [K in keyof PS]: Stringify<PS[K]> }, " | ">> {
  return escape(
    patterns.map(p).join(" | ") as List.Join<{ [K in keyof PS]: Stringify<PS[K]> }, " | ">,
  );
}

/*****************
 * Alias pattern *
 *****************/
/**
 * Build an “alias pattern”.
 * @param pattern The pattern to alias.
 * @param alias The alias name.
 * @returns
 */
export function as<
  const P extends PatternLike,
  Alias extends string | UnnamedArg | NamedArg<string>,
>(
  pattern: P,
  alias: Alias,
): Escaped<`${Stringify<P>} as ${Alias extends string ? Alias : Stringify<Alias>}`> {
  return escape(
    `${p(pattern)} as ${typeof alias === "string" ? alias : p(alias)}` as `${Stringify<P>} as ${Alias extends string ? Alias : Stringify<Alias>}`,
  );
}
