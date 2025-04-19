import { expect, test } from "vitest";

import { NonExhaustiveError, ifMatch, match, matches } from "../src";

test("banner", () => {
  type Data = { type: "text"; content: string } | { type: "img"; src: string };
  type Result = { type: "ok"; data: Data } | { type?: "error" | "fatal"; message: string };

  const getHTML = (result: Result) =>
    match(result, {
      "{ type?: 'error' | 'fatal' }": (res) => `<p>Oops! Something went wrong: ${res.message}</p>`,
      "{ type: 'ok', data: { type: 'text', content: _ } }": (content) => `<p>${content}</p>`,
      "{ type: 'ok', data: { type: 'img', src } as data }": ({ data, src }) =>
        `<img src="${src}" data="${JSON.stringify(data)}" />`,
    });

  expect(getHTML({ message: "error" })).toEqual(`<p>Oops! Something went wrong: error</p>`);
  expect(getHTML({ type: "fatal", message: "fatal" })).toEqual(
    `<p>Oops! Something went wrong: fatal</p>`,
  );
  expect(getHTML({ type: "ok", data: { type: "text", content: "hello" } })).toEqual(`<p>hello</p>`);
  expect(getHTML({ type: "ok", data: { type: "img", src: "image.png" } })).toEqual(
    `<img src="image.png" data="${JSON.stringify({ type: "img", src: "image.png" })}" />`,
  );

  const quickSort: (nums: number[]) => number[] = match({
    "[]": () => [],
    "[head, ...tail]": ({ head, tail }) => {
      const smaller = tail.filter((n) => n <= head);
      const greater = tail.filter((n) => n > head);
      return [...quickSort(smaller), head, ...quickSort(greater)];
    },
  });

  expect(quickSort([3, 1, 4, 1, 5, 9, 2, 6, 5, 3, 5])).toEqual([1, 1, 2, 3, 3, 4, 5, 5, 5, 6, 9]);
});

test("Quickstart", () => {
  type Data = { type: "text"; content: string } | { type: "img"; src: string };
  type Result = { type: "ok"; data: Data } | { type?: "error" | "fatal"; message: string };

  expect(match()).toBe(match);

  expect(() =>
    match({ type: "ok", data: { type: "img", src: "image.png" } } as Result, {
      // @ts-expect-error
      "{ type?: 'error' | 'fatal' }": () => "an error or fatal result",
      "{ type: 'ok', data: { type: 'text', content: _ } }": () => "a text result",
    }),
  ).toThrow(new NonExhaustiveError({ type: "ok", data: { type: "img", src: "image.png" } }));

  expect(
    match({ type: "ok", data: { type: "img", src: "image.png" } } as Result, {
      "{ type?: 'error' | 'fatal' }": () => "an error or fatal result",
      "{ type: 'ok', data: { type: 'text', content: _ } }": () => "a text result",
      _: (v) => v as any,
    }),
  ).toEqual({ type: "ok", data: { type: "img", src: "image.png" } });

  expect(() =>
    // prettier-ignore
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
    (match({
        // @ts-expect-error
        "{ type?: 'error' | 'fatal' }": () => "an error or fatal result",
        "{ type: 'ok', data: { type: 'text', content: _ } }": () => "a text result",
      }) as (value: any) => any)(
      { type: "ok", data: { type: "img", src: "image.png" } },
    ),
  ).toThrow(new NonExhaustiveError({ type: "ok", data: { type: "img", src: "image.png" } }));

  expect(
    match({
      "{ type?: 'error' | 'fatal' }": () => "an error or fatal result",
      "{ type: 'ok', data: { type: 'text', content: _ } }": () => "a text result",
      _: (v) => v as any,
    })({ type: "ok", data: { type: "img", src: "image.png" } }),
  ).toEqual({ type: "ok", data: { type: "img", src: "image.png" } });
});

test("API Reference > `matches`", () => {
  type Data = { type: "text"; content: string } | { type: "img"; src: string };
  type Result = { type: "ok"; data: Data } | { type?: "error" | "fatal"; message: string };

  expect(matches()).toBe(matches);

  expect(
    matches({ type: "error", message: "error" } as Result, "{ type: 'error' | 'fatal' }"),
  ).toBe(true);
  expect(
    matches(
      { type: "ok", data: { type: "img", src: "image.png" } } as Result,
      "{ type: 'error' | 'fatal' }",
    ),
  ).toBe(false);

  expect(matches("{ type: 'error' | 'fatal' }")(42)).toBe(false);
  expect(matches("{ type: 'error' | 'fatal' }")({ type: "error", message: "error" })).toBe(true);
  expect(matches("{ type?: 'error' | 'fatal' }")({ message: "error" })).toBe(true);
  expect(matches("{ type?: 'error' | 'fatal' }")({ type: "ok" })).toBe(false);
  expect(
    matches("{ type: 'error' | 'fatal' }")({ type: "ok", data: { type: "img", src: "image.png" } }),
  ).toBe(false);
});

test("API Reference > `ifMatch`", () => {
  type Data = { type: "text"; content: string } | { type: "img"; src: string };
  type Result = { type: "ok"; data: Data } | { type?: "error" | "fatal"; message: string };

  let matched = false;

  ifMatch({ type: "error", message: "error" }, "{ type: 'error', message: _ }", (message) => {
    matched = true;
    expect(message).toBe("error");
  });
  expect(matched).toBe(true);

  matched = false;
  ifMatch(
    { type: "ok", data: { type: "img", src: "image.png" } } as Result,
    "{ type: 'error' }",
    () => {
      matched = true;
    },
  );
  expect(matched).toBe(false);

  matched = false;
  ifMatch("{ type: 'error', message: _ }")({ type: "error", message: "error" }, (message) => {
    matched = true;
    expect(message).toBe("error");
  });
  expect(matched).toBe(true);

  matched = false;
  ifMatch("{ type: 'error' }")({ type: "ok", data: { type: "img", src: "image.png" } }, () => {
    matched = true;
  });
  expect(matched).toBe(false);

  matched = false;
  ifMatch("{ type: 'error', message: _ }", (message) => {
    matched = true;
    expect(message).toBe("error");
  })({ type: "error", message: "error" });
  expect(matched).toBe(true);

  matched = false;
  ifMatch("{ type: 'error' }", () => {
    matched = true;
  })({ type: "ok", data: { type: "img", src: "image.png" } });
  expect(matched).toBe(false);
});

test("Patterns > Wildcards (`*`/spread wildcard/typed wildcards)", () => {
  expect(
    match(42, {
      "*": (v) => {
        expect(v).toBe(42);
        return "any value";
      },
    }),
  ).toEqual("any value");

  expect(
    match([], {
      "*": (v) => {
        expect(v).toEqual([]);
        return "any value";
      },
    }),
  ).toEqual("any value");

  expect(
    match(
      { foo: "bar" },
      {
        "*": (v) => {
          expect(v).toEqual({ foo: "bar" });
          return "any value";
        },
      },
    ),
  ).toEqual("any value");

  const matchValue1 = (value: unknown[]) =>
    match<[number, unknown]>()(value, {
      "[]": (v) => [0, v],
      "[42, ...*]": (v) => [1, v],
      "['a', ..., 'b', 'c']": (v) => [2, v],
      _: (v) => [-1, v],
    });

  expect(matchValue1([])).toEqual([0, []]);
  expect(matchValue1([42])).toEqual([1, [42]]);
  expect(matchValue1([42, "a", "b", "c"])).toEqual([1, [42, "a", "b", "c"]]);
  expect(matchValue1(["a", "b", "c"])).toEqual([2, ["a", "b", "c"]]);
  expect(matchValue1(["a", "d", "e", "b", "c"])).toEqual([2, ["a", "d", "e", "b", "c"]]);
  expect(matchValue1([1, 2, 3])).toEqual([-1, [1, 2, 3]]);

  const matchValue2 = (value: unknown) =>
    match<[number, unknown]>()(value, {
      "{ key: string }": (v) => [0, v],
      "[number]": (v) => [1, v],
      boolean: (v) => [2, v],
      symbol: (v) => [3, v],
      bigint: (v) => [4, v],
      function: (v) => [5, v],
      Date: (v) => [8, v],
      RegExp: (v) => [9, v],
      Error: (v) => [10, v],
      Array: (v) => [11, v],
      Map: (v) => [12, v],
      Set: (v) => [13, v],
      WeakMap: (v) => [14, v],
      WeakSet: (v) => [15, v],
      Promise: (v) => [16, v],
      TypedArray: (v) => [17, v],
      ArrayBuffer: (v) => [18, v],
      DataView: (v) => [19, v],
      object: (v) => [6, v],
      nonNullable: (v) => [7, v],
      _: (v) => [-1, v],
    });

  expect(matchValue2({ key: "value" })).toEqual([0, { key: "value" }]);
  expect(matchValue2({ key: 42 })).toEqual([6, { key: 42 }]);
  expect(matchValue2([42])).toEqual([1, [42]]);
  expect(matchValue2(true)).toEqual([2, true]);
  const symbol = Symbol("foo");
  expect(matchValue2(symbol)).toEqual([3, symbol]);
  expect(matchValue2(42n)).toEqual([4, 42n]);
  const f = () => {};
  expect(matchValue2(f)).toEqual([5, f]);
  expect(matchValue2({})).toEqual([6, {}]);
  const date = new Date();
  expect(matchValue2(date)).toEqual([8, date]);
  expect(matchValue2(/foo/)).toEqual([9, /foo/]);
  expect(matchValue2(new Error("error"))).toEqual([10, new Error("error")]);
  expect(matchValue2([])).toEqual([11, []]);
  expect(matchValue2(new Map())).toEqual([12, new Map()]);
  expect(matchValue2(new Set())).toEqual([13, new Set()]);
  expect(matchValue2(new WeakMap())).toEqual([14, new WeakMap()]);
  expect(matchValue2(new WeakSet())).toEqual([15, new WeakSet()]);
  expect(matchValue2(new Promise(() => {}))).toEqual([16, new Promise(() => {})]);
  expect(matchValue2(new Int8Array())).toEqual([17, new Int8Array()]);
  expect(matchValue2(new ArrayBuffer(8))).toEqual([18, new ArrayBuffer(8)]);
  expect(matchValue2(new DataView(new ArrayBuffer(8)))).toEqual([
    19,
    new DataView(new ArrayBuffer(8)),
  ]);
  expect(matchValue2("string")).toEqual([7, "string"]);
  expect(matchValue2(42)).toEqual([7, 42]);
  expect(matchValue2(null)).toEqual([-1, null]);
  expect(matchValue2(undefined)).toEqual([-1, undefined]);
});

test("Patterns > Unnamed arguments (`_`/`..._`)", () => {
  const matchValue1 = (value: unknown) =>
    match<unknown[]>()(value, {
      "[_, '+', _]": (left, right) => [left, right],
      "{ foo: _, bar: _ }": (foo, bar) => [foo, bar],
      _: (v) => [-1, v],
    });

  expect(matchValue1([42, "+", 43])).toEqual([42, 43]);
  expect(matchValue1({ foo: "bar", bar: "baz" })).toEqual(["bar", "baz"]);
  expect(matchValue1([42, "-", 43])).toEqual([-1, [42, "-", 43]]);

  const matchValue2 = (value: unknown) =>
    match<unknown[]>()(value, {
      "[42, ..._, 'a']": (middle) => [middle],
      "{ key: _, ..._ }": (key, rest) => [key, rest],
      _: (v) => [-1, v],
    });

  expect(matchValue2([42, 43, 44, "a"])).toEqual([[43, 44]]);
  expect(matchValue2({ key: "value", foo: "bar" })).toEqual(["value", { foo: "bar" }]);
  expect(matchValue2([42, 43, 44])).toEqual([-1, [42, 43, 44]]);

  const matchValue3 = (value: unknown) =>
    match(value, {
      "{ key: string as _, ..._ }": (key, rest) => [key, rest],
      "['red' | 'green' | 'blue' as _, _]": (color, second) => [color, second],
      _: (v) => [-1, v],
    });

  expect(matchValue3({ key: "value", foo: "bar" })).toEqual(["value", { foo: "bar" }]);
  expect(matchValue3({ key: 42, foo: "bar" })).toEqual([-1, { key: 42, foo: "bar" }]);
  expect(matchValue3(["red", "green"])).toEqual(["red", "green"]);
  expect(matchValue3(["green", "blue"])).toEqual(["green", "blue"]);
  expect(matchValue3(["blue", "red"])).toEqual(["blue", "red"]);
  expect(matchValue3(["yellow", "green"])).toEqual([-1, ["yellow", "green"]]);
});

test("Patterns > Named arguments", () => {
  const matchValue1 = (value: unknown) =>
    match<unknown[]>()(value, {
      "{ key: value, ...rest }": ({ rest, value }) => [value, rest],
      "[head, ...tail]": ({ head, tail }) => [head, tail],
      _: (v) => [-1, v],
    });

  expect(matchValue1({ key: "value", foo: "bar" })).toEqual(["value", { foo: "bar" }]);
  expect(matchValue1([42, 43, 44])).toEqual([42, [43, 44]]);
  expect(matchValue1(42)).toEqual([-1, 42]);

  const matchValue2 = (value: unknown) =>
    match<unknown[]>()(value, {
      "{ foo, bar, baz: * }": ({ bar, foo }) => [foo, bar],
      "{ foo: { bar: { baz } } }": ({ baz }) => [baz],
      _: (v) => [-1, v],
    });

  expect(matchValue2({ foo: "bar", bar: "baz", baz: "qux" })).toEqual(["bar", "baz"]);
  expect(matchValue2({ foo: { bar: { baz: "qux" } } })).toEqual(["qux"]);
  expect(matchValue2({ foo: "bar", baz: "qux" })).toEqual([-1, { foo: "bar", baz: "qux" }]);

  const matchValue3 = (value: unknown) =>
    match(value, {
      "{ key: string as value, ...rest }": ({ rest, value }) => [value, rest],
      "['red' | 'green' | 'blue' as color, *]": ({ color }) => [color],
      _: (v) => [-1, v],
    });

  expect(matchValue3({ key: "value", foo: "bar" })).toEqual(["value", { foo: "bar" }]);
  expect(matchValue3({ key: "value" })).toEqual(["value", {}]);
  expect(matchValue3({ key: 42, foo: "bar" })).toEqual([-1, { key: 42, foo: "bar" }]);
  expect(matchValue3(["red", "green"])).toEqual(["red"]);
  expect(matchValue3(["green", "blue"])).toEqual(["green"]);
  expect(matchValue3(["blue", "red"])).toEqual(["blue"]);
  expect(matchValue3(["yellow", "green"])).toEqual([-1, ["yellow", "green"]]);
});

test("Patterns > Or patterns (`|`)", () => {
  const matchValue1 = (value: unknown) =>
    match<unknown[]>()(value, {
      "'foo' | 'bar'": (v) => [0, v],
      "[1 | 2 | 3]": (v) => [1, v],
      "{ _tag: 'None' } | { _tag: 'Some', value: string }": (v) => [2, v],
      _: (v) => [-1, v],
    });

  expect(matchValue1("foo")).toEqual([0, "foo"]);
  expect(matchValue1("bar")).toEqual([0, "bar"]);
  expect(matchValue1("baz")).toEqual([-1, "baz"]);
  expect(matchValue1([1])).toEqual([1, [1]]);
  expect(matchValue1([2])).toEqual([1, [2]]);
  expect(matchValue1([3])).toEqual([1, [3]]);
  expect(matchValue1([4])).toEqual([-1, [4]]);
  expect(matchValue1({ _tag: "None" })).toEqual([2, { _tag: "None" }]);
  expect(matchValue1({ _tag: "Some", value: "foo" })).toEqual([2, { _tag: "Some", value: "foo" }]);
  expect(matchValue1({ _tag: "Some", value: 42 })).toEqual([-1, { _tag: "Some", value: 42 }]);
  expect(matchValue1({ _tag: "Some" })).toEqual([-1, { _tag: "Some" }]);
  expect(matchValue1({})).toEqual([-1, {}]);
  expect(matchValue1([])).toEqual([-1, []]);

  const matchValue2 = (value: unknown) =>
    match(value, {
      "{ key: string | number as value }": ({ value }) => [0, value],
      "[1 | 2 | 3 as _]": (value) => [1, value],
      _: (v) => [-1, v],
    });

  expect(matchValue2({ key: "value" })).toEqual([0, "value"]);
  expect(matchValue2({ key: 42 })).toEqual([0, 42]);
  expect(matchValue2({ key: true })).toEqual([-1, { key: true }]);
  expect(matchValue2([1])).toEqual([1, 1]);
  expect(matchValue2([2])).toEqual([1, 2]);
  expect(matchValue2([3])).toEqual([1, 3]);
  expect(matchValue2([4])).toEqual([-1, [4]]);
  expect(matchValue2("foo")).toEqual([-1, "foo"]);
  expect(matchValue2({})).toEqual([-1, {}]);
  expect(matchValue2([])).toEqual([-1, []]);
});

test("Patterns > Alias patterns (`as`)", () => {
  const matchValue = match<unknown[], unknown>()({
    "[_, [_, *] as _, *] as _": (first, nested, second, whole) => [first, nested, second, whole],
    "{ foo: { key: string | number as key } as inner } as outer": ({ inner, key, outer }) => [
      key,
      inner,
      outer,
    ],
    _: (v) => [-1, v],
  });

  expect(matchValue([42, [43, 44], 45])).toEqual([42, 43, [43, 44], [42, [43, 44], 45]]);
  expect(matchValue([42, [43, 44, 45], 46])).toEqual([-1, [42, [43, 44, 45], 46]]);
  expect(matchValue([42, [43, 44], 45, 46])).toEqual([-1, [42, [43, 44], 45, 46]]);
  expect(matchValue({ foo: { key: "value" } })).toEqual([
    "value",
    { key: "value" },
    { foo: { key: "value" } },
  ]);
  expect(matchValue({ foo: { key: 42 } })).toEqual([42, { key: 42 }, { foo: { key: 42 } }]);
  expect(matchValue({ foo: { key: true } })).toEqual([-1, { foo: { key: true } }]);
  expect(matchValue("foo")).toEqual([-1, "foo"]);
  expect(matchValue({})).toEqual([-1, {}]);
  expect(matchValue([])).toEqual([-1, []]);
});

test("Patterns > Literal patterns", () => {
  const matchValue = (value: unknown) =>
    match(value, {
      null: (v) => ["null", v],
      undefined: (v) => ["undefined", v],
      "true | false": (v) => ["boolean", v],
      '\'foo\' | "bar" | "hello\\nworld"': (v) => ["string", v],
      "42 | -5.5 | 0": (v) => ["number", v],
      "42n | -5n | 0n": (v) => ["bigint", v],
      _: (v) => [-1, v],
    });

  expect(matchValue(null)).toEqual(["null", null]);
  expect(matchValue(undefined)).toEqual(["undefined", undefined]);
  expect(matchValue(true)).toEqual(["boolean", true]);
  expect(matchValue(false)).toEqual(["boolean", false]);
  expect(matchValue("foo")).toEqual(["string", "foo"]);
  expect(matchValue("bar")).toEqual(["string", "bar"]);
  expect(matchValue("hello\nworld")).toEqual(["string", "hello\nworld"]);
  expect(matchValue("baz")).toEqual([-1, "baz"]);
  expect(matchValue(42)).toEqual(["number", 42]);
  expect(matchValue(-5.5)).toEqual(["number", -5.5]);
  expect(matchValue(0)).toEqual(["number", 0]);
  expect(matchValue(3.14)).toEqual([-1, 3.14]);
  expect(matchValue(42n)).toEqual(["bigint", 42n]);
  expect(matchValue(-5n)).toEqual(["bigint", -5n]);
  expect(matchValue(0n)).toEqual(["bigint", 0n]);
  expect(matchValue(3n)).toEqual([-1, 3n]);
  expect(matchValue({})).toEqual([-1, {}]);
  expect(matchValue([])).toEqual([-1, []]);
});

test("Patterns > Array patterns", () => {
  type Expr = [number, "+", number] | [number, "-", number] | [number, "*", number] | ["-", number];

  const matchExpr = (expr: Expr) =>
    match(expr, {
      "[_, '+', _]": (left, right) => left + right,
      "[_, '-', _]": (left, right) => left - right,
      "[_, '*', _]": (left, right) => left * right,
      "['-', _]": (value) => -value,
    });

  expect(matchExpr([1, "+", 2])).toEqual(3);
  expect(matchExpr([5, "-", 3])).toEqual(2);
  expect(matchExpr([2, "*", 3])).toEqual(6);
  expect(matchExpr(["-", 4])).toEqual(-4);

  const matchValue = (value: unknown) =>
    match(value, {
      "[42, ...]": (v) => [0, v],
      "[1, ..._, 'a']": (middle) => [1, middle],
      "[head, ...tail]": ({ head, tail }) => [2, head, tail],
      _: (v) => [-1, v],
    });

  expect(matchValue([42, 43, 44])).toEqual([0, [42, 43, 44]]);
  expect(matchValue([42, 43, 44, "a"])).toEqual([0, [42, 43, 44, "a"]]);
  expect(matchValue([1, 2, 3, "a"])).toEqual([1, [2, 3]]);
  expect(matchValue([1, 2, 3])).toEqual([2, 1, [2, 3]]);
  expect(matchValue([1, 2, 3, 4])).toEqual([2, 1, [2, 3, 4]]);
  expect(matchValue([1])).toEqual([2, 1, []]);
  expect(matchValue("foo")).toEqual([-1, "foo"]);
  expect(matchValue({})).toEqual([-1, {}]);
  expect(matchValue([])).toEqual([-1, []]);
});

test("Patterns > Object patterns", () => {
  type Expr =
    | { type: "add"; left: number; right: number }
    | { type: "sub"; left: number; right: number }
    | { type: "neg"; value: number }
    | { type: "error"; "~source": string };

  const matchExpr1 = (expr: Expr) =>
    match<number | string>()(expr, {
      "{ type: 'add', left: _, right: _ }": (left, right) => left + right,
      "{ type: 'sub', left: left, right: right }": ({ left, right }) => left - right,
      "{ type: 'neg', value: _ }": (value) => -value,
      "{ type: 'error', '~source': _ }": (source) => `Error: ${source}`,
    });

  expect(matchExpr1({ type: "add", left: 1, right: 2 })).toEqual(3);
  expect(matchExpr1({ type: "sub", left: 5, right: 3 })).toEqual(2);
  expect(matchExpr1({ type: "neg", value: 4 })).toEqual(-4);
  expect(matchExpr1({ type: "error", "~source": "foo" })).toEqual("Error: foo");

  const matchExpr2 = (expr: Expr) =>
    match(expr, {
      "{ type: 'add', left, right }": ({ left, right }) => left + right,
      "{ type: 'sub', left, right }": ({ left, right }) => left - right,
      "{ type: 'neg', value }": ({ value }) => -value,
      _: () => 42,
    });

  expect(matchExpr2({ type: "add", left: 1, right: 2 })).toEqual(3);
  expect(matchExpr2({ type: "sub", left: 5, right: 3 })).toEqual(2);
  expect(matchExpr2({ type: "neg", value: 4 })).toEqual(-4);
  expect(matchExpr2({ type: "error", "~source": "foo" })).toEqual(42);

  const matchValue1 = (value: unknown) =>
    match(value, {
      "{ key?: string, foo: null }": (v) => [0, v],
      "{ key?: number as _ }": (key) => [1, key],
      _: (v) => [-1, v],
    });

  expect(matchValue1({ key: "value", foo: null })).toEqual([0, { key: "value", foo: null }]);
  expect(matchValue1({ foo: null })).toEqual([0, { foo: null }]);
  expect(matchValue1({ key: 42 })).toEqual([1, 42]);
  expect(matchValue1({})).toEqual([1, undefined]);
  expect(matchValue1({ key: "foo", foo: "bar" })).toEqual([-1, { key: "foo", foo: "bar" }]);
  expect(matchValue1({ key: true })).toEqual([-1, { key: true }]);

  const matchValue2 = (value: unknown) =>
    match(value, {
      "{ key: value, ...rest }": ({ rest, value }) => [value, rest],
      "{ foo: 'bar', ..._ }": (rest) => [rest],
      _: (v) => [-1, v],
    });

  expect(matchValue2({ key: "value", foo: "bar" })).toEqual(["value", { foo: "bar" }]);
  expect(matchValue2({ key: 42, foo: "baz" })).toEqual([42, { foo: "baz" }]);
  expect(matchValue2({ foo: "bar" })).toEqual([{}]);
  expect(matchValue2({ foo: "bar", bar: "baz" })).toEqual([{ bar: "baz" }]);
  expect(matchValue2({ bar: "baz" })).toEqual([-1, { bar: "baz" }]);
  expect(matchValue2({})).toEqual([-1, {}]);
  expect(matchValue2([])).toEqual([-1, []]);
});

test("Patterns > ADT (Algebraic Data Types) patterns", () => {
  type Option<T> = { _tag: "Some"; _0: T } | { _tag: "None" };

  function Some<T>(value: T): Option<T> {
    return { _tag: "Some", _0: value };
  }
  const None: Option<never> = { _tag: "None" };

  const matchValue = (pair: [Option<number>, Option<string>]) =>
    match(pair, {
      "[Some(_), Some(_)]": (a, b) => [0, a, b],
      "[Some(_), None]": (a) => [1, a],
      "[None, Some(_)]": (b) => [2, b],
      "[None, None]": () => [-1],
    });

  expect(matchValue([Some(42), Some("foo")])).toEqual([0, 42, "foo"]);
  expect(matchValue([Some(42), None])).toEqual([1, 42]);
  expect(matchValue([None, Some("foo")])).toEqual([2, "foo"]);
  expect(matchValue([None, None])).toEqual([-1]);

  const getOrNull: <T>(opt: Option<T>) => T | null = match({
    Some: (value) => value,
    None: () => null,
  });

  expect(getOrNull(Some(42))).toEqual(42);
  expect(getOrNull(None)).toEqual(null);

  type IpAddr =
    | { _tag: "V4"; _0: number; _1: number; _2: number; _3: number }
    | { _tag: "V6"; _0: string };

  function V4(a: number, b: number, c: number, d: number): IpAddr {
    return { _tag: "V4", _0: a, _1: b, _2: c, _3: d };
  }
  function V6(addr: string): IpAddr {
    return { _tag: "V6", _0: addr };
  }

  const getAddr: (addr: IpAddr) => string = match({
    V4: (a, b, c, d) => `${a}.${b}.${c}.${d}`,
    V6: (addr) => addr,
  });

  expect(getAddr(V4(127, 0, 0, 1))).toEqual("127.0.0.1");
  expect(getAddr(V6("::1"))).toEqual("::1");
});
