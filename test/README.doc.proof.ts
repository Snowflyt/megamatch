import { equal, expect, strictCover, test } from "typroof";

import type { Infer, Narrow } from "../src";
import { ifMatch, match, matches } from "../src";

test("banner", () => {
  type Data = { type: "text"; content: string } | { type: "img"; src: string };
  type Result = { type: "ok"; data: Data } | { type?: "error" | "fatal"; message: string };

  const result = { message: "error" } as Result;

  const html = match(result, {
    "{ type?: 'error' | 'fatal' }": (res) => {
      expect(res).to(equal<{ type?: "error" | "fatal"; message: string }>);
      return `<p>Oops! Something went wrong: ${res.message}</p>`;
    },
    "{ type: 'ok', data: { type: 'text', content: _ } }": (content) => {
      expect(content).to(equal<string>);
      return `<p>${content}</p>`;
    },
    "{ type: 'ok', data: { type: 'img', src } as data }": ({ data, src }) => {
      expect(data).to(equal<{ type: "img"; src: string }>);
      expect(src).to(equal<string>);
      return `<img src="${src}" />`;
    },
  });
  expect(html).to(equal<string>);

  const quickSort: (nums: number[]) => number[] = match({
    "[]": (v) => {
      expect(v).to(equal<[]>);
      return [];
    },
    "[head, ...tail]": ({ head, tail }) => {
      expect(head).to(equal<number>);
      expect(tail).to(equal<number[]>);
      const smaller = tail.filter((n) => n <= head);
      const greater = tail.filter((n) => n > head);
      return [...quickSort(smaller), head, ...quickSort(greater)];
    },
  });
});

test("Quickstart", () => {
  type Data = { type: "text"; content: string } | { type: "img"; src: string };
  type Result = { type: "ok"; data: Data } | { type?: "error" | "fatal"; message: string };

  const value = { message: "error" } as Result;

  match(value, {
    // @ts-expect-error
    "{ type?: 'error' | 'fatal' }": () => "an error or fatal result",
    "{ type: 'ok', data: { type: 'text', content: _ } }": () => "a text result",
  });

  match(value, {
    "{ type?: 'error' | 'fatal' }": (res) => {
      expect(res).to(equal<{ type?: "error" | "fatal"; message: string }>);
      return "an error or fatal result";
    },
    "{ type: 'ok', data: { type: 'text', content: _ } }": (content) => {
      expect(content).to(equal<string>);
      return "a text result";
    },
    _: (v) => {
      expect(v).to(equal<{ type: "ok"; data: { type: "img"; src: string } }>);
      return "any other value";
    },
  });

  match<void>()(42, { _: () => {} });
  // @ts-expect-error
  match<string>()(42, { _: () => {} });

  match<void>()({ _: () => {} })(42);
  // @ts-expect-error
  match<string>()({ _: () => {} });

  match<void, number>()(42, { _: () => {} });
  // @ts-expect-error
  match<void, string>()(42, { _: () => {} });

  match<void, number>()({ _: () => {} })(42);
  // @ts-expect-error
  match<void, string>()({ _: () => {} })(42);
});

test("API Reference > `matches`", () => {
  type Data = { type: "text"; content: string } | { type: "img"; src: string };
  type Result = { type: "ok"; data: Data } | { type?: "error" | "fatal"; message: string };

  const value1 = 42 as any;
  if (matches(value1, "{ type: 'error' | 'fatal' }")) {
    expect(value1).to(equal<{ type: "error" | "fatal" }>);
  }

  const value2 = { message: "error" } as Result;
  if (matches(value2, "{ type: 'error' | 'fatal' }")) {
    expect(value2).to(equal<{ type: "error" | "fatal"; message: string }>);
  }

  const value3 = { message: "error" } as Result;
  if (matches(value3, "{ type?: 'error' | 'fatal' }")) {
    expect(value3).to(equal<{ type?: "error" | "fatal"; message: string }>);
  }

  const value4 = { message: "error" } as Result;
  if (matches(value4, "{ type: 'error' }")) {
    expect(value4).to(equal<{ type: "error"; message: string }>);
  }

  const value5 = { message: "error" } as Result;
  if (matches(value5, "{ type?: 'error' }")) {
    expect(value5).to(equal<{ type?: "error"; message: string }>);
  }

  const isError1 = matches("{ type: 'error' | 'fatal' }");
  expect(isError1).to(equal<(value: unknown) => value is { type: "error" | "fatal" }>);

  const isError2 = matches<Result>()("{ type: 'error' | 'fatal' }");
  expect(isError2).to(
    equal<(value: Result) => value is { type: "error" | "fatal"; message: string }>,
  );
});

test("API Reference > `ifMatch`", () => {
  type Data = { type: "text"; content: string } | { type: "img"; src: string };
  type Result = { type: "ok"; data: Data } | { type?: "error" | "fatal"; message: string };

  const value = { message: "error" } as Result;

  const result = ifMatch(value, "{ type: 'error', message: _ }", (message) => {
    expect(message).to(equal<string>);
    console.log(`Error: ${message}`);
  });
  expect(result).to(equal<void | null>);

  const value1 = 42 as any;
  ifMatch(value1, "{ type: 'error' | 'fatal' }", (value) => {
    expect(value).to(equal<{ type: "error" | "fatal" }>);
  });

  const value2 = { message: "error" } as Result;
  ifMatch(value2, "{ type: 'error' | 'fatal' }", (value) => {
    expect(value).to(equal<{ type: "error" | "fatal"; message: string }>);
  });

  const value3 = { message: "error" } as Result;
  ifMatch(value3, "{ type?: 'error' | 'fatal' }", (value) => {
    expect(value).to(equal<{ type?: "error" | "fatal"; message: string }>);
  });

  const value4 = { message: "error" } as Result;
  ifMatch(value4, "{ type: 'error' }", (value) => {
    expect(value).to(equal<{ type: "error"; message: string }>);
  });

  const value5 = { message: "error" } as Result;
  ifMatch(value5, "{ type?: 'error' }", (value) => {
    expect(value).to(equal<{ type?: "error"; message: string }>);
  });

  const ifError1 = ifMatch("{ type: 'error' | 'fatal' }");
  expect(ifError1).to(
    equal<<R>(value: unknown, fn: (value: { type: "error" | "fatal" }) => R) => R | null>,
  );

  const ifError2 = ifMatch<void>()("{ type: 'error' | 'fatal' }");
  expect(ifError2).to(
    equal<(value: unknown, fn: (value: { type: "error" | "fatal" }) => void) => void | null>,
  );

  const ifError3 = ifMatch<void, Result>()("{ type: 'error' | 'fatal' }");
  expect(ifError3).to(
    equal<
      (
        value: Result,
        fn: (value: { type: "error" | "fatal"; message: string }) => void,
      ) => void | null
    >,
  );

  const logIfError1 = ifMatch("{ type: 'error' | 'fatal' }", console.log);
  expect(logIfError1).to(equal<(value: unknown) => void | null>);

  const logIfError2 = ifMatch<void>()("{ type: 'error' | 'fatal' }", console.log);
  // @ts-expect-error
  ifMatch<number>()("{ type: 'error' | 'fatal' }", () => {});
  expect(logIfError2).to(equal<(value: unknown) => void | null>);

  const logIfError3 = ifMatch<void, Result>()("{ type: 'error' | 'fatal' }", console.log);
  expect(logIfError3).to(equal<(value: Result) => void | null>);
});

test("Patterns > Wildcards (`*`/spread wildcard/typed wildcards)", () => {
  const result1 = match(42 as number, {
    "*": (v) => {
      expect(v).to(equal<number>);
      return "any value";
    },
  });
  expect(result1).to(equal<string>);

  const result2 = match(42 as any, {
    "*": (v) => {
      expect(v).to(equal<unknown>);
      return "any value";
    },
  });
  expect(result2).to(equal<string>);

  const result3 = match(42 as unknown, {
    "*": (v) => {
      expect(v).to(equal<unknown>);
      return "any value";
    },
  });
  expect(result3).to(equal<string>);

  const result4 = match([] as unknown[], {
    "[]": (v) => {
      expect(v).to(equal<[]>);
      return "an empty array";
    },
    "[42, ...*]": (v) => {
      expect(v).to(equal<[42, ...unknown[]]>);
      return "an array with the first element 42 and any number of elements after it";
    },
    "['a', ..., 'b', 'c']": (v) => {
      expect(v).to(equal<["a", ...unknown[], "b", "c"]>);
      return "an array with 'a' at the beginning, 'b' and 'c' at the end, and any number of elements in between";
    },
    _: (v) => {
      expect(v).to(equal<[unknown, ...unknown[]]>);
      return "any other array";
    },
  });
  expect(result4).to(equal<string>);

  const result5 = match(42 as any, {
    "{ key: string }": (v) => {
      expect(v).to(equal<{ key: string }>);
      return "object with `key` property of type string";
    },
    "[number]": (v) => {
      expect(v).to(equal<[number]>);
      return "a tuple with only one number";
    },
    boolean: (v) => {
      expect(v).to(equal<boolean>);
      return "a boolean value";
    },
    symbol: (v) => {
      expect(v).to(equal<symbol>);
      return "a symbol value";
    },
    bigint: (v) => {
      expect(v).to(equal<bigint>);
      return "a bigint value";
    },
    function: (v) => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
      expect(v).to(equal<Function>);
      return "a function value";
    },
    object: (v) => {
      expect(v).to(equal<object>);
      return "an object value";
    },
    nonNullable: (v) => {
      expect(v).to(equal<{}>);
      return "any value except null and undefined";
    },
    Date: (v) => {
      expect(v).to(equal<Date>);
      return "a Date object";
    },
    RegExp: (v) => {
      expect(v).to(equal<RegExp>);
      return "a RegExp object";
    },
    Error: (v) => {
      expect(v).to(equal<Error>);
      return "an Error object";
    },
    Array: (v) => {
      expect(v).to(equal<unknown[]>);
      return "an array";
    },
    Map: (v) => {
      expect(v).to(equal<Map<unknown, unknown>>);
      return "a Map object";
    },
    Set: (v) => {
      expect(v).to(equal<Set<unknown>>);
      return "a Set object";
    },
    WeakMap: (v) => {
      expect(v).to(equal<WeakMap<WeakKey, unknown>>);
      return "a WeakMap object";
    },
    WeakSet: (v) => {
      expect(v).to(equal<WeakSet<WeakKey>>);
      return "a WeakSet object";
    },
    Promise: (v) => {
      expect(v).to(equal<Promise<unknown>>);
      return "a Promise object";
    },
    TypedArray: (v) => {
      expect(v).to(
        strictCover<
          | Int8Array
          | Uint8Array
          | Uint8ClampedArray
          | Int16Array
          | Uint16Array
          | Int32Array
          | Uint32Array
          | Float32Array
          | Float64Array
        >,
      );
      return "a TypedArray object";
    },
    ArrayBuffer: (v) => {
      expect(v).to(equal<ArrayBuffer>);
      return "an ArrayBuffer object";
    },
    DataView: (v) => {
      expect(v).to(equal<DataView>);
      return "a DataView object";
    },
    _: (v) => {
      expect(v).to(equal<unknown>);
      return "any other value";
    },
  });
  expect(result5).to(equal<string>);
});

test("Patterns > Unnamed arguments (`_`/`..._`)", () => {
  match(42 as any, {
    "[_, '+', _]": (left, right) => {
      expect(left).to(equal<unknown>);
      expect(right).to(equal<unknown>);
      return "select the first and third elements of a 3-element array with '+' in the middle";
    },
    "{ foo: _, bar: _ }": (foo, bar) => {
      expect(foo).to(equal<unknown>);
      expect(bar).to(equal<unknown>);
      return "select the `foo` and `bar` properties of an object";
    },
    _: (v) => {
      expect(v).to(equal<unknown>);
      return "any other value";
    },
  });

  match(42 as unknown, {
    "[_, '+', _]": (left, right) => {
      expect(left).to(equal<unknown>);
      expect(right).to(equal<unknown>);
      return "select the first and third elements of a 3-element array with '+' in the middle";
    },
    "{ foo: _, bar: _ }": (foo, bar) => {
      expect(foo).to(equal<unknown>);
      expect(bar).to(equal<unknown>);
      return "select the `foo` and `bar` properties of an object";
    },
    _: (v) => {
      expect(v).to(equal<unknown>);
      return "any other value";
    },
  });

  match(42 as any, {
    "[42, ..._, 'a']": (middle) => {
      expect(middle).to(equal<unknown[]>);
      return "select the middle elements of an array starting with 42 and ending with 'a'";
    },
    "{ key: _, ..._ }": (key, rest) => {
      expect(key).to(equal<unknown>);
      expect(rest).to(equal<{}>);
      return "select the `key` property and the rest of the object";
    },
    _: (v) => {
      expect(v).to(equal<unknown>);
      return "any other value";
    },
  });

  match(42 as unknown, {
    "[42, ..._, 'a']": (middle) => {
      expect(middle).to(equal<unknown[]>);
      return "select the middle elements of an array starting with 42 and ending with 'a'";
    },
    "{ key: _, ..._ }": (key, rest) => {
      expect(key).to(equal<unknown>);
      expect(rest).to(equal<{}>);
      return "select the `key` property and the rest of the object";
    },
    _: (v) => {
      expect(v).to(equal<unknown>);
      return "any other value";
    },
  });

  match(42 as any, {
    "{ key: string as _, ..._ }": (key, rest) => {
      expect(key).to(equal<string>);
      expect(rest).to(equal<{}>);
      return "select the `key` property that is a string and the rest of the object";
    },
    "['red' | 'green' | 'blue' as _, _]": (color, second) => {
      expect(color).to(equal<"red" | "green" | "blue">);
      expect(second).to(equal<unknown>);
      return "select the first element of a 2-element array that is one of 'red', 'green' or 'blue' and the second element";
    },
    _: (v) => {
      expect(v).to(equal<unknown>);
      return "any other value";
    },
  });

  match(42 as unknown, {
    "{ key: string as _, ..._ }": (key, rest) => {
      expect(key).to(equal<string>);
      expect(rest).to(equal<{}>);
      return "select the `key` property that is a string and the rest of the object";
    },
    "['red' | 'green' | 'blue' as _, _]": (color, second) => {
      expect(color).to(equal<"red" | "green" | "blue">);
      expect(second).to(equal<unknown>);
      return "select the first element of a 2-element array that is one of 'red', 'green' or 'blue' and the second element";
    },
    _: (v) => {
      expect(v).to(equal<unknown>);
      return "any other value";
    },
  });
});

test("Patterns > Named arguments", () => {
  match(42 as any, {
    "{ key: value, ...rest }": ({ rest, value }) => {
      expect(value).to(equal<unknown>);
      expect(rest).to(equal<{}>);
      return "select the `key` property as `value` and the rest of the object";
    },
    "[head, ...tail]": ({ head, tail }) => {
      expect(head).to(equal<unknown>);
      expect(tail).to(equal<unknown[]>);
      return "select the first element and the rest of the array";
    },
    _: (v) => {
      expect(v).to(equal<unknown>);
      return "any other value";
    },
  });

  match(42 as unknown, {
    "{ key: value, ...rest }": ({ rest, value }) => {
      expect(value).to(equal<unknown>);
      expect(rest).to(equal<{}>);
      return "select the `key` property as `value` and the rest of the object";
    },
    "[head, ...tail]": ({ head, tail }) => {
      expect(head).to(equal<unknown>);
      expect(tail).to(equal<unknown[]>);
      return "select the first element and the rest of the array";
    },
    _: (v) => {
      expect(v).to(equal<unknown>);
      return "any other value";
    },
  });

  match(42 as any, {
    "{ foo, bar, baz: * }": ({ bar, foo }) => {
      expect(foo).to(equal<unknown>);
      expect(bar).to(equal<unknown>);
      return "select the `foo` and `bar` properties of the object";
    },
    "{ foo: { bar: { baz } } }": ({ baz }) => {
      expect(baz).to(equal<unknown>);
      return "select the `baz` property of the nested object";
    },
    _: (v) => {
      expect(v).to(equal<unknown>);
      return "any other value";
    },
  });

  match(42 as unknown, {
    "{ foo, bar, baz: * }": ({ bar, foo }) => {
      expect(foo).to(equal<unknown>);
      expect(bar).to(equal<unknown>);
      return "select the `foo` and `bar` properties of the object";
    },
    "{ foo: { bar: { baz } } }": ({ baz }) => {
      expect(baz).to(equal<unknown>);
      return "select the `baz` property of the nested object";
    },
    _: (v) => {
      expect(v).to(equal<unknown>);
      return "any other value";
    },
  });

  match(42 as any, {
    "{ key: string as value, ...rest }": ({ rest, value }) => {
      expect(value).to(equal<string>);
      expect(rest).to(equal<{}>);
      return "select the `key` property that is a string and the rest of the object";
    },
    "['red' | 'green' | 'blue' as color, *]": ({ color }) => {
      expect(color).to(equal<"red" | "green" | "blue">);
      return "select the first element of a 2-element array that is one of 'red', 'green' or 'blue'";
    },
    _: (v) => {
      expect(v).to(equal<unknown>);
      return "any other value";
    },
  });

  match(42 as unknown, {
    "{ key: string as value, ...rest }": ({ rest, value }) => {
      expect(value).to(equal<string>);
      expect(rest).to(equal<{}>);
      return "select the `key` property that is a string and the rest of the object";
    },
    "['red' | 'green' | 'blue' as color, *]": ({ color }) => {
      expect(color).to(equal<"red" | "green" | "blue">);
      return "select the first element of a 2-element array that is one of 'red', 'green' or 'blue'";
    },
    _: (v) => {
      expect(v).to(equal<unknown>);
      return "any other value";
    },
  });
});

test("Patterns > Or patterns (`|`)", () => {
  match(42 as any, {
    "'foo' | 'bar'": (v) => {
      expect(v).to(equal<"foo" | "bar">);
      return "a string that is either 'foo' or 'bar'";
    },
    "[1 | 2 | 3]": (v) => {
      expect(v).to(equal<[1 | 2 | 3]>);
      return "a 1-element array with only 1, 2 or 3 as the element";
    },
    "{ _tag: 'None' } | { _tag: 'Some', value: string }": (v) => {
      expect(v).to(equal<{ _tag: "None" } | { _tag: "Some"; value: string }>);
      return "an object with `_tag` property that is either 'None', or 'Some' with a `value` property of type string";
    },
    _: (v) => {
      expect(v).to(equal<unknown>);
      return "any other value";
    },
  });

  match(42 as unknown, {
    "'foo' | 'bar'": (v) => {
      expect(v).to(equal<"foo" | "bar">);
      return "a string that is either 'foo' or 'bar'";
    },
    "[1 | 2 | 3]": (v) => {
      expect(v).to(equal<[1 | 2 | 3]>);
      return "a 1-element array with only 1, 2 or 3 as the element";
    },
    "{ _tag: 'None' } | { _tag: 'Some', value: string }": (v) => {
      expect(v).to(equal<{ _tag: "None" } | { _tag: "Some"; value: string }>);
      return "an object with `_tag` property that is either 'None', or 'Some' with a `value` property of type string";
    },
    _: (v) => {
      expect(v).to(equal<unknown>);
      return "any other value";
    },
  });

  match(42 as any, {
    "{ key: string | number as value }": ({ value }) => {
      expect(value).to(equal<string | number>);
      return "select the `key` property that is a string or number as `value`";
    },
    "[1 | 2 | 3 as _]": (value) => {
      expect(value).to(equal<1 | 2 | 3>);
      return "select the first element of a 1-element array that is either 1, 2 or 3";
    },
    _: (v) => {
      expect(v).to(equal<unknown>);
      return "any other value";
    },
  });

  match(42 as unknown, {
    "{ key: string | number as value }": ({ value }) => {
      expect(value).to(equal<string | number>);
      return "select the `key` property that is a string or number as `value`";
    },
    "[1 | 2 | 3 as _]": (value) => {
      expect(value).to(equal<1 | 2 | 3>);
      return "select the first element of a 1-element array that is either 1, 2 or 3";
    },
    _: (v) => {
      expect(v).to(equal<unknown>);
      return "any other value";
    },
  });
});

test("Patterns > Alias patterns (`as`)", () => {
  match<void, any>()({
    "[_, [_, *] as _, *] as _": (first, nested, second, whole) => {
      expect(first).to(equal<unknown>);
      expect(nested).to(equal<unknown>);
      expect(second).to(equal<[unknown, unknown]>);
      expect(whole).to(equal<[unknown, [unknown, unknown], unknown]>);
    },
    "{ foo: { key: string | number as key } as inner } as outer": ({ inner, key, outer }) => {
      expect(key).to(equal<string | number>);
      expect(inner).to(equal<{ key: string | number }>);
      expect(outer).to(equal<{ foo: { key: string | number } }>);
    },
    _: () => {},
  });

  match<void, unknown>()({
    "[_, [_, *] as _, *] as _": (first, nested, second, whole) => {
      expect(first).to(equal<unknown>);
      expect(nested).to(equal<unknown>);
      expect(second).to(equal<[unknown, unknown]>);
      expect(whole).to(equal<[unknown, [unknown, unknown], unknown]>);
    },
    "{ foo: { key: string | number as key } as inner } as outer": ({ inner, key, outer }) => {
      expect(key).to(equal<string | number>);
      expect(inner).to(equal<{ key: string | number }>);
      expect(outer).to(equal<{ foo: { key: string | number } }>);
    },
    _: () => {},
  });
});

test("Patterns > Literal patterns", () => {
  match(42 as any, {
    null: (v) => {
      expect(v).to(equal<null>);
      return "null value";
    },
    undefined: (v) => {
      expect(v).to(equal<undefined>);
      return "undefined value";
    },
    "true | false": (v) => {
      expect(v).to(equal<boolean>);
      return "a boolean value";
    },
    '\'foo\' | "bar" | "hello\\nworld"': (v) => {
      expect(v).to(equal<"foo" | "bar" | "hello\nworld">);
      return "a string that is either 'foo', 'bar' or 'hello\nworld'";
    },
    "42 | -5.5 | 0": (v) => {
      expect(v).to(equal<42 | -5.5 | 0>);
      return "a number that is either 42, -5.5 or 0";
    },
    "42n | -5n | 0n": (v) => {
      expect(v).to(equal<42n | -5n | 0n>);
      return "a bigint that is either 42n, -5n or 0n";
    },
    _: (v) => {
      expect(v).to(equal<unknown>);
      return "any other value";
    },
  });

  match(42 as unknown, {
    null: (v) => {
      expect(v).to(equal<null>);
      return "null value";
    },
    undefined: (v) => {
      expect(v).to(equal<undefined>);
      return "undefined value";
    },
    "true | false": (v) => {
      expect(v).to(equal<boolean>);
      return "a boolean value";
    },
    '\'foo\' | "bar" | "hello\\nworld"': (v) => {
      expect(v).to(equal<"foo" | "bar" | "hello\nworld">);
      return "a string that is either 'foo', 'bar' or 'hello\nworld'";
    },
    "42 | -5.5 | 0": (v) => {
      expect(v).to(equal<42 | -5.5 | 0>);
      return "a number that is either 42, -5.5 or 0";
    },
    "42n | -5n | 0n": (v) => {
      expect(v).to(equal<42n | -5n | 0n>);
      return "a bigint that is either 42n, -5n or 0n";
    },
    _: (v) => {
      expect(v).to(equal<unknown>);
      return "any other value";
    },
  });
});

test("Patterns > Array patterns", () => {
  type Expr = [number, "+", number] | [number, "-", number] | [number, "*", number] | ["-", number];

  const result = match(42 as unknown as Expr, {
    "[_, '+', _]": (left, right) => left + right,
    "[_, '-', _]": (left, right) => left - right,
    "[_, '*', _]": (left, right) => left * right,
    "['-', _]": (value) => -value,
  });
  expect(result).to(equal<number>);

  match(42 as any, {
    "[42, ...]": (v) => {
      expect(v).to(equal<[42, ...unknown[]]>);
      return "an array with the first element 42 and any number of elements after it";
    },
    "[1, ..._, 'a']": (middle) => {
      expect(middle).to(equal<unknown[]>);
      return "an array starting with 1 and ending with 'a'";
    },
    "[head, ...tail]": ({ head, tail }) => {
      expect(head).to(equal<unknown>);
      expect(tail).to(equal<unknown[]>);
      return "select the first element and the rest of the array";
    },
    _: (v) => {
      expect(v).to(equal<unknown>);
      return "any other value";
    },
  });

  match(42 as unknown, {
    "[42, ...]": (v) => {
      expect(v).to(equal<[42, ...unknown[]]>);
      return "an array with the first element 42 and any number of elements after it";
    },
    "[1, ..._, 'a']": (middle) => {
      expect(middle).to(equal<unknown[]>);
      return "an array starting with 1 and ending with 'a'";
    },
    "[head, ...tail]": ({ head, tail }) => {
      expect(head).to(equal<unknown>);
      expect(tail).to(equal<unknown[]>);
      return "select the first element and the rest of the array";
    },
    _: (v) => {
      expect(v).to(equal<unknown>);
      return "any other value";
    },
  });
});

test("Patterns > Object patterns", () => {
  type Expr =
    | { type: "add"; left: number; right: number }
    | { type: "sub"; left: number; right: number }
    | { type: "neg"; value: number }
    | { type: "error"; "~source": number };

  const result1 = match(42 as unknown as Expr, {
    "{ type: 'add', left: _, right: _ }": (left, right) => left + right,
    "{ type: 'sub', left: left, right: right }": ({ left, right }) => left - right,
    "{ type: 'neg', value: _ }": (value) => -value,
    "{ type: 'error', '~source': _ }": (source) => source,
  });
  expect(result1).to(equal<number>);

  const result2 = match(42 as unknown as Expr, {
    "{ type: 'add', left, right }": ({ left, right }) => left + right,
    "{ type: 'sub', left, right }": ({ left, right }) => left - right,
    "{ type: 'neg', value }": ({ value }) => -value,
    _: () => 42,
  });
  expect(result2).to(equal<number>);

  match(42 as any, {
    "{ key?: string }": (v) => {
      expect(v).to(equal<{ key?: string }>);
      return "object with an optional `key` property of type string";
    },
    "{ key?: number as _ }": (key) => {
      expect<typeof key>().to(equal<number | undefined>);
      return "object with an optional `key` property of type number and select it as an unnamed argument";
    },
    _: (v) => {
      expect(v).to(equal<unknown>);
      return "any other value";
    },
  });

  match(42 as unknown, {
    "{ key?: string }": (v) => {
      expect(v).to(equal<{ key?: string }>);
      return "object with an optional `key` property of type string";
    },
    "{ key?: number as _ }": (key) => {
      expect<typeof key>().to(equal<number | undefined>);
      return "object with an optional `key` property of type number and select it as an unnamed argument";
    },
    _: (v) => {
      expect(v).to(equal<unknown>);
      return "any other value";
    },
  });

  match(42 as any, {
    "{ key: value, ...rest }": ({ rest, value }) => {
      expect(value).to(equal<unknown>);
      expect(rest).to(equal<{}>);
      return "select the `key` property as `value` and the rest of the object";
    },
    "{ foo: 'bar', ..._ }": (rest) => {
      expect(rest).to(equal<{}>);
      return "select the rest of the object with `foo` property as 'bar'";
    },
    _: (v) => {
      expect(v).to(equal<unknown>);
      return "any other value";
    },
  });

  match(42 as unknown, {
    "{ key: value, ...rest }": ({ rest, value }) => {
      expect(value).to(equal<unknown>);
      expect(rest).to(equal<{}>);
      return "select the `key` property as `value` and the rest of the object";
    },
    "{ foo: 'bar', ..._ }": (rest) => {
      expect(rest).to(equal<{}>);
      return "select the rest of the object with `foo` property as 'bar'";
    },
    _: (v) => {
      expect(v).to(equal<unknown>);
      return "any other value";
    },
  });
});

test("Patterns > ADT (Algebraic Data Types) patterns", () => {
  type Option<T> = { _tag: "Some"; _0: T } | { _tag: "None" };

  function Some<T>(value: T): Option<T> {
    return { _tag: "Some", _0: value };
  }
  function None<T = never>(): Option<T> {
    return { _tag: "None" };
  }

  match([Some(42), None<string>()], {
    "[Some(_), Some(_)]": (a, b) => {
      expect(a).to(equal<number>);
      expect(b).to(equal<string>);
      console.log(a, b);
    },
    "[Some(_), None]": (a) => {
      expect(a).to(equal<number>);
      console.log(a);
    },
    "[None, Some(_)]": (b) => {
      expect(b).to(equal<string>);
      console.log(b);
    },
    "[None, None]": () => {
      console.log("Both are None");
    },
  });

  const getOrNull: <T>(opt: Option<T>) => T | null = match({
    Some: (value) => value,
    None: () => null,
  });
  expect(getOrNull(Some(42))).to(equal<number | null>);

  type IpAddr =
    | { _tag: "V4"; _0: number; _1: number; _2: number; _3: number }
    | { _tag: "V6"; _0: string };

  const getAddr: (addr: IpAddr) => string = match({
    V4: (a, b, c, d) => `${a}.${b}.${c}.${d}`,
    V6: (addr) => addr,
  });
  expect(getAddr({ _tag: "V6", _0: "::1" })).to(equal<string>);
});

test("Types > `Infer<Pattern>`", () => {
  const userPattern = "{ id: number, username: string, role: 'admin' | 'user' }";

  expect<Infer<typeof userPattern>>().to(
    equal<{ readonly id: number; readonly username: string; readonly role: "admin" | "user" }>,
  );
  expect<Infer<typeof userPattern, false>>().to(
    equal<{ id: number; username: string; role: "admin" | "user" }>,
  );
});

test("Types > `Narrow<T, Pattern>`", () => {
  type Data = { type: "text"; content: string } | { type: "img"; src: string };
  type Result = { type: "ok"; data: Data } | { type?: "error" | "fatal"; message: string };

  expect<Narrow<Result, "{ type: 'error' }">>().to(equal<{ type: "error"; message: string }>);
});

test("Types > About type narrowing of the input value", () => {
  const color = "blue" as "red" | "green" | "blue" | number;

  match(color, {
    "'red'": () => "red",
    string: (v) => {
      expect(v).to(equal<"red" | "green" | "blue">);
      return v;
    },
    _: (v) => {
      expect(v).to(equal<number>);
      return "unknown";
    },
  });
});
