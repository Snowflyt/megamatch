<h1 align="center">megamatch</h1>

<p align="center">
  <i>Painless</i> <strong>pattern matching</strong> in <strong>TypeScript</strong> with <strong>type-safety</strong> and <strong>minimalistic</strong> syntax.
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/megamatch">
    <img src="https://img.shields.io/npm/dm/megamatch.svg" alt="downloads" height="18">
  </a>
  <a href="https://www.npmjs.com/package/megamatch">
    <img src="https://img.shields.io/npm/v/megamatch.svg" alt="npm version" height="18">
  </a>
  <a href="https://bundlephobia.com/package/megamatch">
    <img src="https://img.shields.io/bundlephobia/minzip/megamatch.svg" alt="minzipped size" height="18">
  </a>
  <a href="https://coveralls.io/github/Snowflyt/megamatch?branch=main">
    <img src="https://img.shields.io/coverallsCoverage/github/Snowflyt/megamatch?branch=main" alt="coverage status" height="18">
  </a>
  <a href="https://github.com/Snowflyt/megamatch">
    <img src="https://img.shields.io/npm/l/megamatch.svg" alt="MPL-2.0 license" height="18">
  </a>
</p>

```typescript
import { match } from "megamatch";

type Data = { type: "text"; content: string } | { type: "img"; src: string };
type Result = { type: "ok"; data: Data } | { type?: "error" | "fatal"; message: string };

const result: Result = /* ... */;

// Pattern matching with exhaustiveness checking in TypeScript
const html = match(result, { // [1]
  "{ type?: 'error' | 'fatal' }": (res) => `<p>Oops! Something went wrong: ${res.message}</p>`,
  "{ type: 'ok', data: { type: 'text', content: _ } }": (content) => `<p>${content}</p>`,
  "{ type: 'ok', data: { type: 'img', src } as data }": ({ src, data }) => `<img src="${src}" />`,
});

// Point-free style API
const quickSort: (nums: number[]) => number[] = match({
  "[]": () => [],
  "[head, ...tail]": ({ head, tail }) => {
    const smaller = tail.filter((n) => n <= head);
    const greater = tail.filter((n) => n > head);
    return [...quickSort(smaller), head, ...quickSort(greater)];
  },
});
```

<small>[1]: Example inspired by <a href="https://github.com/gvergnaud/ts-pattern">TS-Pattern</a>.</small>

> [!WARNING]
>
> This library is highly experimental and relies heavily on complex type-level programming. Deeply nested patterns may cause excessive type-level recursion and slow down the TypeScript compiler.

## Features

- An embedded pattern matching language (DSL) with **minimalistic** syntax.
- Smart **type inference** with parsers on both type-level and runtime.
- **Exhaustiveness checking** ensures all cases are handled.
- **Dual API** to match in both normal and **point-free** style.
- Concise [ADT-style pattern matching](#adt-algebraic-data-types-patterns) with `Tag(...)` syntax.
- Run _[fast](#performance)_ out-of-the-box with [pattern caching](#pattern-caching) (~10x faster than [TS-Pattern](https://github.com/gvergnaud/ts-pattern)).
- Achieve **near-native speed** with [JIT compilation](#just-in-time-jit-compilation).
- **Validate** a value against a [pattern](#patterns) with [`matches`](#matches).
- Match a value against a pattern without exhaustive checking with [`ifMatch`](#ifmatch).

## Installation

To install megamatch via npm (or any other package manager you prefer):

```shell
npm install megamatch
```

## Quickstart

megamatch exports the `match`/`matchArgs` function to match a value or variadic arguments against a pattern, which can be used in **2** different ways:

1. **Normal style**: The first argument is the value to match, and the second argument is an object with patterns as keys and functions as values. (only available in `match`)
2. **Point-free style**: The only argument is an object with patterns as keys and functions as values. The function returned by `match` can be called with the value to match.

The former is more common and is similar to the pattern matching syntax in other languages, while the latter is more functional and enables [JIT compilation](#just-in-time-jit-compilation) to achieve close-to-zero runtime overhead.

Both styles support specifying the return type or input type of the function using TypeScript generics with the following syntax:

```typescript
// Note that the empty parentheses `()` are required for the generic type parameters
const result = match<ReturnType, InputType>()(value, ...);

// Omit the input type if you only want to specify the return type
const result = match<ReturnType>()(value, ...);
```

`matchArgs` also supports specifying the return type or input type of the function like `match`, except that `InputType` expects a tuple type representing the types of the input arguments.

More information about `matchArgs` can be found in the [`matchArgs`](#matchargs) section.

Aside from `match` and `matchArgs`, [`matches`](#matches) and [`ifMatch`](#ifmatch) also support both styles and allow specifying the return type or input type of the function using the same syntax.

Inside the object, each pattern is represented as a string key, and the corresponding function defines the behavior if the pattern matches. The patterns are generally a DSL (Domain-Specific Language) that resembles JavaScript destructuring syntax, supporting rest properties/elements and object shorthand properties, but with some additional features. See the [Patterns](#patterns) section for more details.

The input arguments of the functions are determined by the following rules:

1. If no “argument” is selected in the pattern, the function will receive the whole matched value as its first argument.
2. If only unnamed arguments (`_`) are selected, the function will receive each of the matched values as separate arguments by the order they appear in the pattern. For example, `"[_, '+', _]": (left, right) => ...` will receive two arguments, the first and third ones of the matched array; `"{ foo: _, bar: { baz: _ } as _ }": (foo, baz, bar) => ...` will receive three arguments, each `_` representing a matched value.
3. If only named arguments are selected (e.g., `value` and `rest` in `{ key: value, ...rest }`,`head` and `tail` in `[head, ...tail]`, `alias` and `shorthandProp` in `{ type: 'ok', shorthandProp } as alias`), the function will receive an object with the selected arguments as its first argument.

Note that unnamed and named arguments cannot be mixed in the same pattern, otherwise an error will be thrown at both runtime and type level.

`match` supports exhaustive checking, meaning that if a pattern is not matched, you’ll see TypeScript report a type error right away in your code editor:

```typescript
const result = match(value, {
  "{ type?: 'error' | 'fatal' }": (res) => "an error or fatal result",
  // ~~~~~~~~~~~~~~~~~~~~~~~~~~
  // ... 'NonExhaustive<{ type: "ok"; data: { type: "img"; src: string; }; }>'.
  "{ type: 'ok', data: { type: 'text', content: _ } }": (content) => "a text result",
});
```

To avoid this, add a “catch-all” case using `*` or `_` as the last key:

```typescript
const result = match(value, {
  "{ type?: 'error' | 'fatal' }": (res) => "an error or fatal result",
  "{ type: 'ok', data: { type: 'text', content: _ } }": (content) => "a text result",
  _: (v) => "any other value", // catch-all pattern
});
```

## API Reference

Apart from the `match` function, megamatch also provides some utility functions with patterns.

### `matchArgs`

`matchArgs` is similar to `match`, but it matches variadic arguments instead of a single value. The input type of the function can be specified as a tuple of the argument types. This is especially useful when a callback function with multiple arguments is expected.

```typescript
import { matchArgs } from "megamatch";

type IpAddr =
  | { _tag: "V4"; _0: number; _1: number; _2: number; _3: number }
  | { _tag: "V6"; _0: string };

function createArrayEquals<A>(equals: (a: A, b: A) => boolean) {
  return (as: A[], bs: A[]): boolean =>
    as.length === bs.length && as.every((a, i) => equals(a, bs[i]));
}

const ipAddrArrayEquals = createArrayEquals<IpAddr>(
  matchArgs({
    "[V4(_, _, _, _), V4(_, _, _, _)]": (a1, a2, a3, a4, b1, b2, b3, b4) =>
      a1 === b1 && a2 === b2 && a3 === b3 && a4 === b4,
    "[V6(_), V6(_)]": (addr1, addr2) => addr1 === addr2,
    _: () => false,
  }),
);
```

### `matches`

`matches` is a type guard function that validates a value against a pattern and returns a boolean indicating whether the value matches the pattern or not.

```typescript
import { matches } from "megamatch";

if (matches(value, "{ type: 'error' | 'fatal' }")) {
  // `value` is either an error or fatal result
  const { type } = value; // The type of `value` is narrowed to `{ type: 'error' | 'fatal' }`
}
```

Similar to `match`, `matches` can be used in **2** different ways:

1. **Normal style**: The first argument is the value to match, and the second argument is the pattern to match against.
2. **Point-free style**: The only argument is the pattern to match against. The function returned by `matches` can be called with the value to match.

Like `match`, `matches` also allows specifying the _input type_ of the function using TypeScript generics.

```typescript
matches(value, pattern);
matches<InputType>()(value, pattern);

const isError = matches("{ type: 'error' }");
const isError = matches<MyType>()("{ type: 'error' }");

if (isError(value)) {
  // Do something when `value` matches the pattern
}
```

### `ifMatch`

`ifMatch` validates a value against a pattern and returns the matched value if it matches, or `null` if it does not match.

```typescript
import { ifMatch } from "megamatch";

// `result` is either the matched value or null
const result = ifMatch(value, "{ type: 'error', message: _ }", (message) => {
  console.log(`Error: ${message}`);
});
```

This is useful to simplify a common pattern like this:

```typescript
match(value, {
  "{ type: 'error', message: _ }": (message) => {
    console.log(`Error: ${message}`);
  },
  _: () => {},
});
```

Since `match` forces exhaustive checking, you need to provide a catch-all pattern to avoid TypeScript errors if the patterns are not exhaustive. `ifMatch` does not require this, which is a good alternative if you want to avoid this boilerplate code:

```typescript
ifMatch(value, "{ type: 'error', message: _ }", (message) => {
  console.log(`Error: ${message}`);
});
```

This function is inspired by [Rust’s `if let` syntax](https://doc.rust-lang.org/rust-by-example/flow_control/if_let.html).

Similar to `match`, `ifMatch` can be in **3** different ways:

1. **Normal style**: The first argument is the value to match, the second argument is the pattern to match against, and the third argument is the function to call if the pattern matches.
2. **Point-free style 1**: The only argument is the pattern to match against. The function returned by `ifMatch` can be called with the value to match and the function to call if the pattern matches.
3. **Point-free style 2**: The first argument is the pattern to match against, and the second argument is the function to call if the pattern matches. The function returned by `ifMatch` can be called with the value to match.

Like `match`, `ifMatch` also allows specifying the return type or input type of the function using TypeScript generics.

```typescript
ifMatch(value, pattern, fn);
ifMatch<ReturnType>()(value, pattern, fn);
ifMatch<ReturnType, InputType>()(value, pattern, fn);

const ifError = ifMatch("{ type: 'error' }");
const ifError = ifMatch<void>()("{ type: 'error' }");
const ifError = ifMatch<void, MyType>()("{ type: 'error' }");

ifError(value, (...args) => {
  // Do something with the matched value
});

const logIfError = ifMatch("{ type: 'error' }", console.log);
const logIfError = ifMatch<void>()("{ type: 'error' }", console.log);
const logIfError = ifMatch<void, MyType>()("{ type: 'error' }", console.log);

logIfError(value);
```

## Patterns

### Wildcards (`*`/spread wildcard/typed wildcards)

`*` matches any JavaScript value, including `null` and `undefined`:

```typescript
const result = match(value, {
  "*": (v) => "any value",
});
```

**Don’t confuse `*` with `_`!** The former matches any value but does not turn it into an argument, while the latter matches any value and turns it into an argument. In many other languages, `_` is used as a wildcard, but in megamatch, it is used to destructure the matched value.

In arrays, `...*` or just `...` matches zero or more elements:

```typescript
const result = match(value, {
  "[]": (v) => "an empty array",
  "[42, ...*]": (v) => "an array with the first element 42 and any number of elements after it",
  "['a', ..., 'b', 'c']": (v) =>
    "an array with 'a' at the beginning, 'b' and 'c' at the end, and any number of elements in between",
});
```

Note that spread wildcards can only occur _once_ in an array pattern.

Some keywords are reserved as “typed wildcards” and are not recognized as named arguments. They can be used to match specific types:

```typescript
const result = match(value, {
  "{ key: string }": (v) => "object with `key` property of type string",
  "[number]": (v) => "a tuple with only one number",
  boolean: (v) => "a boolean value",
  symbol: (v) => "a symbol value",
  bigint: (v) => "a bigint value",
  function: (v) => "a function value",
  nonNullable: (v) => "any value except null and undefined",
  object: (v) =>
    "an object value (v !== null && (typeof v === 'object' || typeof v === 'function'))",
  Date: (v) => "a Date object",
  RegExp: (v) => "a RegExp object",
  Error: (v) => "an Error object",
  Array: (v) => "an array",
  Map: (v) => "a Map object",
  Set: (v) => "a Set object",
  WeakMap: (v) => "a WeakMap object",
  WeakSet: (v) => "a WeakSet object",
  Promise: (v) => "a Promise object",
  TypedArray: (v) => "a TypedArray object",
  ArrayBuffer: (v) => "an ArrayBuffer object",
  DataView: (v) => "a DataView object",
});
```

### Unnamed arguments (`_`/`..._`)

`_` matches any JavaScript value and turns it into an unnamed argument. It can be used in any pattern except [“Or” pattern](#or-patterns-), including arrays and objects:

```typescript
const result = match(value, {
  "[_, '+', _]": (left, right) =>
    "select the first and third elements of a 3-element array with '+' in the middle",
  "{ foo: _, bar: _ }": (foo, bar) => "select the `foo` and `bar` properties of an object",
});
```

Similar to wildcards, `..._` matches zero or more elements in an array _or object_ and turns them into a single unnamed argument:

```typescript
const result = match(value, {
  "[42, ..._, 'a']": (middle) =>
    "select the middle elements of an array starting with 42 and ending with 'a'",
  "{ key: _, ..._ }": (key, rest) => "select the `key` property and the rest of the object",
});
```

If you want to select an unnamed argument with some “constraints”, you can use it with the [Alias patterns](#alias-patterns-as) syntax:

```typescript
const result = match(value, {
  "{ key: string as _, ..._ }": (key, rest) =>
    "select the `key` property that is a string and the rest of the object",
  "['red' | 'green' | 'blue' as _, _]": (color, second) =>
    "select the first element of a 2-element array that is one of 'red', 'green' or 'blue' and the second element",
});
```

### Named arguments

Named arguments are used to destructure the matched value and collect the results into an object parameter. They can be used in any pattern except in ["Or" patterns](#or-patterns-), including arrays and objects.

Named arguments _must not_ start with an uppercase letter, otherwise parsing will fail. Identifiers starting with an uppercase letter are reserved for [ADT patterns](#adt-algebraic-data-types-patterns).

```typescript
const result = match(value, {
  "{ key: value, ...rest }": ({ value, rest }) =>
    "select the `key` property as `value` and the rest of the object",
  "[head, ...tail]": ({ head, tail }) => "select the first element and the rest of the array",
});
```

Similar to wildcards and unnamed patterns, `...name` matches zero or more elements in an array or object and turns them into a single named argument, which is shown above.

In object patterns, you can use shorthand properties to match the value of the property with the same name as the argument:

```typescript
const result = match(value, {
  "{ foo, bar, baz: * }": ({ foo, bar }) => "select the `foo` and `bar` properties of the object",
  "{ foo: { bar: { baz } } }": ({ baz }) => "select the `baz` property of the nested object",
});
```

Similar to unnamed arguments, you can use named arguments with the [Alias patterns](#alias-patterns-as) syntax:

```typescript
const result = match(value, {
  "{ key: string as value, ...rest }": ({ value, rest }) =>
    "select the `key` property that is a string and the rest of the object",
  "['red' | 'green' | 'blue' as color, *]": ({ color }) =>
    "select the first element of a 2-element array that is one of 'red', 'green' or 'blue'",
});
```

### Or patterns (`|`)

An “or” pattern is an expression separated by `|` that matches if any of the sub-patterns match. You can use any pattern type as sub-patterns except unnamed and named arguments. Or patterns can be nested within other pattern types.

```typescript
const result = match(value, {
  "'foo' | 'bar'": (v) => "a string that is either 'foo' or 'bar'",
  "[1 | 2 | 3]": (v) => "a 1-element array with only 1, 2 or 3 as the element",
  "{ _tag: 'None' } | { _tag: 'Some', value: string }": (v) =>
    "an object with `_tag` property that is either 'None', or 'Some' with a `value` property of type string",
});
```

The priority of `|` is higher than `as`, so you can use it to match a value with an [alias](#alias-patterns-as):

```typescript
const result = match(value, {
  "{ key: string | number as value }": ({ value }) =>
    "select the `key` property that is a string or number as `value`",
  "[1 | 2 | 3 as _]": (value) =>
    "select the first element of a 1-element array that is either 1, 2 or 3",
});
```

### Alias patterns (`as`)

An alias pattern is an expression that ends with `as _` or `as name` that matches the value and turns it into an argument. It can be used in any pattern except spread wildcards and arguments.

```typescript
const matchValue = match<void, unknown>()({
  "[_, [_, *] as _, *] as _": (first, nested, second, whole) => {
    console.log(first, nested, second, whole);
  },
  "{ foo: { key: string | number as key } as inner } as outer": ({ key, inner, outer }) => {
    console.log(key, inner, outer);
  },
  _: () => {},
});

matchValue([1, [2, 3], 4]); // 1 2 [2, 3] [1, [2, 3], 4]
matchValue({ foo: { key: 42 } }); // 42 { key: 42 } { foo: { key: 42 } }
```

### Literal patterns

The following literal patterns are supported:

- **null:** Matches `null` value. Example: `null`.
- **undefined:** Matches `undefined` value. Example: `undefined`.
- **boolean:** Matches `true` or `false`. Example: `true`, `false`.
- **string:** Matches a string literal with either single or double quotes. Common escape sequences are supported, including `\n`, `\r`, `\t`, `\\`, etc. Example: `'foo'`, `"bar"`, `"foo\\\"bar"`, `"hello\\nworld"`.
- **number:** Matches a decimal or float literal, scientific notation is _not_ supported. Example: `0`, `42`, `3.14`, `-2.50`.
- **bigint:** Matches a bigint literal with `n` suffix. The same rules as `number` apply. Example: `0n`, `42n`, `-5n`.

```typescript
const result = match(value, {
  null: (v) => "null value",
  undefined: (v) => "undefined value",
  "true | false": (v) => "a boolean value",
  '\'foo\' | "bar" | "hello\\nworld"': (v) =>
    "a string that is either 'foo', 'bar' or 'hello\nworld'",
  "42 | -5.5 | 0": (v) => "a number that is either 42, -5.5 or 0",
  "42n | -5n | 0n": (v) => "a bigint that is either 42n, -5n or 0n",
});
```

### Array patterns

Array patterns are used to match arrays and can be nested within other pattern types.

```typescript
type Expr =
  | [number, "+", number]
  | [number, "-", number]
  | [number, "*", number]
  | ["-", number];

const result = match(expr, {
  "[_, '+', _]": (left, right) => left + right,
  "[_, '-', _]": (left, right) => left - right,
  "[_, '*', _]": (left, right) => left * right,
  "['-', _]": (value) => -value,
});
```

As already mentioned in the [Wildcards](#wildcards-spread-wildcardtyped-wildcards), [Unnamed arguments](#unnamed-arguments-__) and [Named arguments](#named-arguments) sections, you can use spread patterns to match variadic elements in an array. Note that only _1_ spread pattern is allowed in an array pattern.

```typescript
const result = match(value, {
  "[42, ...]": () => "an array with the first element 42 and any number of elements after it",
  "[1, ..._, 'a']": (middle) => "an array starting with 1 and ending with 'a'",
  "[head, ...tail]": ({ head, tail }) => "select the first element and the rest of the array",
});
```

### Object patterns

Object patterns are used to match objects and can be nested within other pattern types.

Object keys can be either a valid JavaScript identifier or a string literal. If the key is a string literal, it must be enclosed in single or double quotes.

```typescript
type Expr =
  | { type: "add"; left: number; right: number }
  | { type: "sub"; left: number; right: number }
  | { type: "neg"; value: number }
  | { type: "error"; "~source": string };

const result = match<number | string>()(expr, {
  "{ type: 'add', left: _, right: _ }": (left, right) => left + right,
  "{ type: 'sub', left: left, right: right }": ({ left, right }) => left - right,
  "{ type: 'neg', value: _ }": (value) => -value,
  "{ type: 'error', '~source': _ }": (source) => `Error: ${source}`,
});
```

As already mentioned in the [Named arguments](#named-arguments) section, a shorthand property can be used to match the value of the property with the same name as the argument:

```typescript
const result = match(expr, {
  "{ type: 'add', left, right }": ({ left, right }) => left + right,
  "{ type: 'sub', left, right }": ({ left, right }) => left - right,
  "{ type: 'neg', value }": ({ value }) => -value,
});
```

Optional keys can be matched with `?`. If the key exists, it will be matched against the pattern, otherwise it will be ignored. If an argument is selected, it will be `undefined` if the key does not exist.

```typescript
match(value, {
  "{ key?: string }": () => "object with an optional `key` property of type string",
  "{ key?: number as _ }": (key) =>
    "object with an optional `key` property of type number and select it as an unnamed argument",
});
```

You can also use the spread syntax mentioned in the [Unnamed arguments](#unnamed-arguments-__) and [Named arguments](#named-arguments) sections to match the rest of the object:

```typescript
const result = match(value, {
  "{ key: value, ...rest }": ({ value, rest }) =>
    "select the `key` property as `value` and the rest of the object",
  "{ foo: 'bar', ..._ }": (rest) => "select the rest of the object with `foo` property as 'bar'",
});
```

### ADT (Algebraic Data Types) patterns

ADT patterns enables a more concise way to match objects with a specific structure. This is similar to the [**A**lgebraic **D**ata **T**ypes](https://en.wikipedia.org/wiki/Algebraic_data_type) concept in functional programming languages.

megamatch uses a special encoding for ADTs, which follows the same approach as our sister project [kind-adt](https://github.com/Snowflyt/kind-adt), so you can refer to it as “kind-adt style ADT”. In this format, an ADT is an object with a `_tag` property that indicates the type of the ADT, while the remaining properties represent the fields of the ADT. Each field name is formatted as `_${number}`, e.g., `Some(42)` is represented as `{ _tag: "Some", _0: 42 }`, and `None` is represented as `{ _tag: "None" }`. This encoding is also similar to [how ReScript encode variants](https://rescript-lang.org/docs/manual/v11.0.0/variant).

An ADT pattern should follow the `Tag(...)` format, where the parentheses and their contents can be omitted if there are no fields. The `Tag` must be a valid identifier starting with an uppercase letter, as lowercase letters are reserved for [named arguments](#named-arguments). This syntax is essentially equivalent to the `"{ _tag: 'Tag', ... }"` pattern, but provides a more concise representation.

```typescript
type Option<T> = { _tag: "Some"; _0: T } | { _tag: "None" };

function Some<T>(value: T): Option<T> {
  return { _tag: "Some", _0: value };
}
function None<T = never>(): Option<T> {
  return { _tag: "None" };
}

match([Some(42), None<string>()], {
  "[Some(_), Some(_)]": (a, b) => console.log(a, b),
  "[Some(_), None]": (a) => console.log(a),
  "[None, Some(_)]": (b) => console.log(b),
  "[None, None]": () => console.log("Both are None"),
});
```

As a syntax sugar, if a key in the match object is simply an identifier starting with an uppercase letter, it will be treated as an ADT pattern, and all fields of the matched object will be automatically selected as unnamed arguments.

```typescript
const getOrNull: <T>(opt: Option<T>) => T | null = match({
  Some: (value) => value,
  None: () => null,
});

type IpAddr =
  | { _tag: "V4"; _0: number; _1: number; _2: number; _3: number }
  | { _tag: "V6"; _0: string };

const getAddr: (addr: IpAddr) => string = match({
  V4: (a, b, c, d) => `${a}.${b}.${c}.${d}`,
  V6: (addr) => addr,
});
```

## Types

### `Infer<Pattern>`

`Infer<Pattern>` infers the type of value represented by a pattern.

```typescript
import type { Infer } from "megamatch";

const userPattern = "{ id: number, username: string, role: 'admin' | 'user' }";

type Post = Infer<typeof userPattern>;
//   ^?: { readonly id: number; readonly username: string; readonly role: "admin" | "user"; }
```

The utility accepts an optional second argument `Readonly` to control whether to infer the type as readonly or writable. By default, the inferred type is readonly (i.e., it defaults to `true`), but you can set it to `false` to infer the type as writable.

```typescript
type PostWritable = Infer<typeof userPattern, false>;
//   ^?: { id: number; username: string; role: "admin" | "user"; }
```

### `Narrow<T, Pattern>`

`Narrow<T, Pattern>` narrows the type of `T` to the type represented by the pattern.

```typescript
import type { Narrow } from "megamatch";

type Data = { type: "text"; content: string } | { type: "img"; src: string };
type Result = { type: "ok"; data: Data } | { type?: "error" | "fatal"; message: string };

type Narrowed = Narrow<Result, "{ type: 'error' }">;
//   ^?: { type: "error"; message: string }
```

megamatch already narrows the type of the input value in `match` and `ifMatch`, so you don’t need to use `Narrow` in most cases.

### About type narrowing of the input value

Some pattern matching libraries like [ts-pattern](https://github.com/gvergnaud/ts-pattern) perform type narrowing on each pattern one by one, which means that the type of the input value of the function is not only narrowed to the matched pattern, but also narrowed by previous patterns that occur "before" the matched pattern.

```typescript
import { match, P } from "ts-pattern";

const color = "blue" as "red" | "green" | "blue" | number;

match(color)
  .with("red", () => "red")
  .with(P.string, (v) => {
    //             ^?: "green" | "blue"
    // ts-pattern knows that `v` cannot be `"red"`,
    // so it is narrowed to `"green" | "blue"`
    return v;
  })
  .otherwise((v) => {
    //        ^?: number
    return "unknown";
  });
```

However, this is not the case in megamatch. TypeScript does not preserve the order of object keys on the type level, so we cannot find a reliable way to narrow the type by the order of the patterns. Instead, megamatch performs type narrowing on each pattern independently.

However, we do some special treatment to `*` and `_` patterns, assuming they occur at the end of the object. In such cases, we narrow the type of the input value of the function based on all other patterns that occur in the object. Such narrowing behavior only applies to exactly `*` and `_` patterns, not even `[*]` or `{ ..._ }`.

```typescript
import { match } from "megamatch";

const color = "blue" as "red" | "green" | "blue" | number;

match(color, {
  "'red'": () => "red",
  string: (v) => {
    //     ^?: "red" | "green" | "blue"
    return v;
  },
  _: (v) => {
    // ^?: number
    return "unknown";
  },
});
```

This can be seen as a trade-off for much cleaner pattern matching syntax, and should not be a problem in most cases.

## Performance

megamatch delivers **exceptional performance** out-of-the-box, typically running **10x faster** than [TS-Pattern](https://github.com/gvergnaud/ts-pattern) in normal style API. When using point-free style with JIT compilation, it approaches **near-native speed** with minimal runtime overhead. This means properly written megamatch code can perform virtually **as fast as hand-written conditionals**.

megamatch uses 2 different strategies to optimize the performance of pattern matching:

- **Pattern caching**: The first time a pattern is **parse**d, it is cached for future use. This eliminates the overhead of repeatedly parsing the same pattern strings across multiple executions.
- **Just-in-time (JIT) compilation**: For point-free style API, the object with patterns is compiled to a highly optimized function that directly matches values against patterns. This compilation achieves nearly native performance (typically only 20% slower than hand-written code). The JIT system uses two distinct caches: a “**compile**” cache for individual pattern code snippets, and a “**match**” cache for the fully compiled matcher functions.

Both strategies use size-limited caches (10,000 entries by default) with a simple FIFO eviction policy to prevent memory leaks. You can adjust these limits with the exported `setCacheLimit(type: "parse" | "compile" | "match", limit: number)` function.

### Pattern caching

In megamatch, each pattern string is parsed into a structured representation (AST) for efficient matching. This parsing process can be expensive, especially for complex patterns. However, string-based patterns also enable straightforward caching since they naturally serve as cache keys.

megamatch stores parsed patterns in a global `Map` object, ensuring each unique pattern string is parsed exactly once. The cached result is then reused for all subsequent matches, significantly reducing overhead for repeated pattern usage.

With this optimization alone, normal style `match` typically runs 5-10x faster than equivalent implementations in [TS-Pattern](https://github.com/gvergnaud/ts-pattern).

```typescript
import { match } from "megamatch";
import { P, match as tsPatternMatch } from "ts-pattern";

// NOTE: We use normal style API here for illustration purpose only.
// In real world, you should use point-free style API for better performance.
const stringifyMega = (value: unknown) =>
  match<unknown>()(value, {
    "number | boolean | null | undefined": (v) => String(v),
    string: (s) => '"' + s + '"',
    bigint: (b) => `${b}n`,
    Array: (a) => "[" + a.map(stringifyMega).join(", ") + "]",
    object: (o) => {
      let result = "";
      for (const k in o) {
        if (result) result += ", ";
        result += `${k}: ${stringifyMega(o[k])}`;
      }
      return result ? "{ " + result + " }" : "{}";
    },
    _: () => {
      throw new TypeError("Cannot stringify value");
    },
  });

const stringifyTSPattern = (value: unknown) =>
  tsPatternMatch(value)
    .with(P.union(P.number, P.boolean, null, undefined), (v) => String(v))
    .with(P.string, (s) => '"' + s + '"')
    .with(P.bigint, (b) => `${b}n`)
    .with(P.array(), (a) => "[" + a.map(stringifyTSPattern).join(", ") + "]")
    .with({}, (o) => {
      let result = "";
      for (const k in o) {
        if (result) result += ", ";
        result += `${k}: ${stringifyTSPattern(o[k])}`;
      }
      return result ? "{ " + result + " }" : "{}";
    })
    .otherwise(() => {
      throw new TypeError("Cannot stringify value");
    });

// (180 nanoseconds)
stringifyMega("foo"); // => "foo"
// (1045 nanoseconds)
stringifyTSPattern("foo"); // => "foo"

// (2.21 microseconds)
stringifyMega({ foo: [{ bar: 5n }, 42], baz: { qux: "quux" } });
// => '{ foo: [{ bar: 5n }, 42], baz: { qux: "quux" } }'
// (13.88 microseconds)
stringifyTSPattern({ foo: [{ bar: 5n }, 42], baz: { qux: "quux" } });
// => '{ foo: [{ bar: 5n }, 42], baz: { qux: "quux" } }'
```

### Just-in-time (JIT) compilation

While pattern caching offers significant improvements for normal style API, it still requires checking values against the AST representation of patterns. For maximum performance, megamatch implements JIT compilation in its point-free style API.

Consider the quickSort example—if you inspect the compiled function with `.toString()`, you’ll see it has been automatically transformed into an optimized implementation:

```typescript
const quickSortMega: (nums: number[]) => number[] = match({
  "[]": () => [],
  "[head, ...tail]": ({ head, tail }) => {
    const smaller = tail.filter((n) => n <= head);
    const greater = tail.filter((n) => n > head);
    return [...quickSortMega(smaller), head, ...quickSortMega(greater)];
  },
});

console.log(quickSortMega.toString());
// function match(value) {
//   if (
//     Array.isArray(value) &&
//     value.length === 0
//   )
//     return cases[0](value);
//
//   if (
//     Array.isArray(value) &&
//     value.length >= 1
//   )
//     return cases[1]({
//       head: value[0],
//       tail: value.slice(1, value.length)
//     });
//
//   throw new NonExhaustiveError(value);
// };
```

This compiled function executes with near-native performance, as shown in these benchmark results:

```typescript
const quickSortNative = (nums: number[]): number[] => {
  if (nums.length === 0) return [];
  const [head, ...tail] = nums;
  const smaller = tail.filter((n) => n <= head!);
  const greater = tail.filter((n) => n > head!);
  return [...quickSortNative(smaller), head!, ...quickSortNative(greater)];
};

const quickSortMega: (nums: number[]) => number[] = match({
  "[]": () => [],
  "[head, ...tail]": ({ head, tail }) => {
    const smaller = tail.filter((n) => n <= head);
    const greater = tail.filter((n) => n > head);
    return [...quickSortMega(smaller), head, ...quickSortMega(greater)];
  },
});

const quickSortMegaNormal = (nums: number[]): number[] =>
  match(nums, {
    "[]": () => [],
    "[head, ...tail]": ({ head, tail }) => {
      const smaller = tail.filter((n) => n <= head);
      const greater = tail.filter((n) => n > head);
      return [...quickSortMegaNormal(smaller), head, ...quickSortMegaNormal(greater)];
    },
  });

const quickSortTSPattern = (nums: number[]): number[] =>
  tsPatternMatch(nums)
    .with([], () => [])
    .with([P.select("head"), ...P.array(P.select("tail"))], ({ head, tail }) => {
      const smaller = tail.filter((n) => n <= head);
      const greater = tail.filter((n) => n > head);
      return [...quickSortTSPattern(smaller), head, ...quickSortTSPattern(greater)];
    })
    .exhaustive();

const nums = [3, 1, 4, 1, 5, 9, 2, 6, 5, 3, 5];

// (0.97 microseconds)
quickSortNative(nums); // => [1, 1, 2, 3, 3, 4, 5, 5, 5, 6, 9]
// (1.05 microseconds)
quickSortMega(nums); // => [1, 1, 2, 3, 3, 4, 5, 5, 5, 6, 9]
// (11.49 microseconds)
quickSortMegaNormal(nums); // => [1, 1, 2, 3, 3, 4, 5, 5, 5, 6, 9]
// (55.03 microseconds)
quickSortTSPattern(nums); // => [1, 1, 2, 3, 3, 4, 5, 5, 5, 6, 9]
```

The results demonstrate that:

- JIT-compiled point-free style (`quickSortMega`) performs nearly identically to hand-written code (`quickSortNative`).
- Normal style API (`quickSortMegaNormal`) is still quite fast, about 10x slower than native but 5x faster than TS-Pattern.
- All implementations remain viable for typical non-performance-critical applications.

Real world scenarios rarely perform computational intensive tasks like this quicksort example, so all of their performance, including the TS-Pattern implementation, are usually acceptable. Though the performance gain of JIT compilation is quite attractive, the choice between normal style and point-free style API in your real application should be based on your preference and the readability of the code.

## FAQ

### What’s the magic behind the scenes?

Internally, megamatch implements a tiny [parser combinator](https://en.wikipedia.org/wiki/Parser_combinator) system that parses the patterns at both runtime and type-level, where [hkt-core](https://github.com/Snowflyt/hkt-core) is used to provide type-level functions. We then implement the pattern DSL using these parser combinators at both levels to generate AST with the same structure, aligning the implementation as closely as possible.

After parsers generate AST, a checker at both levels checks the validity of the patterns, which captures common mistakes like mixing unnamed and named arguments.

If the pattern is valid, we match the value against the pattern. At runtime, we match the value against the pattern using a recursive function that traverses the AST and checks if the value matches the pattern. If it does, we call the corresponding function with the matched values. At type-level, we use a recursive type that traverses the AST and narrows the type of the matched value and infers the type of the arguments.

## Inspirations

This library is inspired by the following libraries:

- [ts-pattern](https://github.com/gvergnaud/ts-pattern), which made me aware that it is possible to implement pattern matching in TypeScript. The exhaustiveness check implementation in megamatch heavily refers to the implementation in ts-pattern.
- [Arktype](https://github.com/arktypeio/arktype), which is a runtime type validator that resembles TypeScript's type syntax in defining types. This made me realize that crazy type-level programming can be practical and even performant in TypeScript.
- [ParseBox](https://github.com/sinclairzx81/parsebox) which powers the `Syntax` API in [TypeBox](https://github.com/sinclairzx81/typebox#syntax), another runtime type validator. This library provides parser combinators on both runtime and type-level. Though megamatch does not refer to its implementation, it somehow encourages me to implement this library.
- [Megaparsec](https://github.com/mrkkrp/megaparsec), a Haskell library for parsing combinators. The API design of the parser combinators used internally in megamatch is heavily inspired by this library. As you can see here, it also inspired the name of this library. :)

The pattern matching DSL is inspired by the pattern matching syntax in many other languages, including [Haskell](https://www.haskell.org/), [Scala](https://scala-lang.org/), [Rust](https://www.rust-lang.org/) and [MoonBit](https://www.moonbitlang.com/).

## License

This project is licensed under the Mozilla Public License Version 2.0 (MPL 2.0).
For details, please refer to the `LICENSE` file.

In addition to the open-source license, a commercial license is available for proprietary use.
If you modify this library and do not wish to open-source your modifications, or if you wish to use the modified library as part of a closed-source or proprietary project, you must obtain a commercial license.

For details, see `COMMERCIAL_LICENSE.md`.
