import { describe, expect, it } from "vitest";

import { NonExhaustiveError } from "../src";

// This helper function extracts the result of `stringify` by triggering an `NonExhaustiveError`
// and extracting the formatted string from the error message
const stringify = (value: unknown): string => {
  try {
    throw new NonExhaustiveError(value);
  } catch (e) {
    return (e as Error).message.slice("Pattern matching error: No pattern matches value ".length);
  }
};

describe("stringify (internal implementation)", () => {
  it("should handle primitive values correctly", () => {
    expect(stringify(42)).toBe("42");
    expect(stringify("hello")).toBe('"hello"');
    expect(stringify(true)).toBe("true");
    expect(stringify(null)).toBe("null");
    expect(stringify(undefined)).toBe("undefined");
    expect(stringify(123n)).toBe("123n");
    expect(stringify(Symbol("test"))).toBe("Symbol(test)");
  });

  it("should handle arrays correctly", () => {
    expect(stringify([1, 2, 3])).toBe("[1, 2, 3]");
    expect(stringify(["a", "b", true])).toBe('["a", "b", true]');
    expect(stringify([])).toBe("[]");
  });

  it("should handle arrays subclasses correctly", () => {
    class MyArray<T> extends Array<T> {
      // eslint-disable-next-line @typescript-eslint/no-useless-constructor
      constructor(...args: T[]) {
        super(...args);
      }
    }

    expect(stringify(new MyArray(1, 2, 3))).toBe("MyArray(3) [1, 2, 3]");
  });

  it("should handle objects correctly", () => {
    expect(stringify({ a: 1, b: "test" })).toBe('{ a: 1, b: "test" }');
    expect(stringify({})).toBe("{}");
  });

  it("should handle different key types in objects", () => {
    // Symbol keys
    const symbolKey = Symbol("test");
    const objWithSymbol = { [symbolKey]: "value" };
    expect(stringify(objWithSymbol)).toBe('{ [Symbol(test)]: "value" }');

    // Valid identifier keys
    const objWithValidIds = { abc: 1, $valid: 2, _key123: 3 };
    expect(stringify(objWithValidIds)).toBe("{ abc: 1, $valid: 2, _key123: 3 }");

    // Keys that aren't valid identifiers
    const objWithInvalidIds = { "not-valid": 1, "123": 2, "a b": 3 };
    expect(stringify(objWithInvalidIds)).toBe('{ "123": 2, "not-valid": 1, "a b": 3 }');

    // Mixed keys
    const mixedObj = {
      validId: 1,
      "invalid-id": 2,
      [Symbol("sym")]: 3,
    };
    expect(stringify(mixedObj)).toBe('{ validId: 1, "invalid-id": 2, [Symbol(sym)]: 3 }');
  });

  it("should handle Date objects correctly", () => {
    const date = new Date("2023-01-01T00:00:00.000Z");
    expect(stringify(date)).toBe(date.toISOString());
  });

  it("should handle RegExp objects correctly", () => {
    expect(stringify(/test/g)).toBe("/test/g");
  });

  it("should handle Map and Set correctly", () => {
    expect(stringify(new Map())).toBe("Map(0) {}");
    expect(stringify(new Set())).toBe("Set(0) {}");

    const map = new Map<any, any>([
      ["key", "value"],
      [1, 2],
    ]);
    expect(stringify(map)).toBe('Map(2) { "key" => "value", 1 => 2 }');

    const set = new Set([1, "test", true]);
    expect(stringify(set)).toBe('Set(3) { 1, "test", true }');
  });

  it("should handle functions correctly", () => {
    function namedFunction() {
      return 42;
    }
    expect(stringify(namedFunction)).toBe("[Function: namedFunction]");

    const anonymousFunction = (() => () => {})();
    expect(stringify(anonymousFunction)).toBe("[Function (anonymous)]");
  });

  it("should handle circular references", () => {
    const obj: Record<string, unknown> = { a: 1 };
    obj.self = obj;
    expect(stringify(obj)).toBe("{ a: 1, self: [Circular] }");
  });

  it("should handle class instances correctly", () => {
    class TestClass {
      value = 42;
    }
    expect(stringify(new TestClass())).toBe("TestClass { value: 42 }");

    class EmptyClass {}
    expect(stringify(new EmptyClass())).toBe("EmptyClass {}");
  });

  it("should handle nested complex structures", () => {
    const date = new Date("2023-01-01T00:00:00.000Z");
    const complex = {
      array: [1, { nested: true }],
      map: new Map([["key", { deep: new Set([1, 2]) }]]),
      date,
    };
    complex.map.set("self", complex as never);

    expect(stringify(complex)).toBe(
      `{ array: [1, { nested: true }], ` +
        `map: Map(2) { "key" => { deep: Set(2) { 1, 2 } }, "self" => [Circular] }, ` +
        `date: ${date.toISOString()} }`,
    );
  });
});
