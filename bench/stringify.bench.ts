import { match as arkMatch } from "arktype";
import { Match, pipe } from "effect";
import { P, match as tsPatternMatch } from "ts-pattern";
import { bench, describe } from "vitest";

import { match } from "../src";

const stringify = (value: unknown) => {
  if (
    typeof value === "number" ||
    typeof value === "boolean" ||
    value === null ||
    value === undefined
  )
    return String(value);
  if (typeof value === "string") return '"' + value + '"';
  if (typeof value === "bigint") return `${value}n`;
  if (Array.isArray(value)) return "[" + value.map(stringify).join(", ") + "]";
  if (typeof value === "object" && value !== null) {
    let result = "";
    for (const k in value) {
      if (result) result += ", ";
      result += `${k}: ${stringify(value[k])}`;
    }
    return result ? "{ " + result + " }" : "{}";
  }
  throw new TypeError("Cannot stringify value");
};

const stringifyMega = match({
  "number | boolean | null | undefined": (v) => String(v),
  string: (s) => '"' + s + '"',
  bigint: (b) => `${b}n`,
  Array: (a): string => "[" + a.map(stringifyMega).join(", ") + "]",
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

const stringifyMegaNormal = (value: unknown): string =>
  match(value, {
    "number | boolean | null | undefined": (v) => String(v),
    string: (s) => '"' + s + '"',
    bigint: (b) => `${b}n`,
    Array: (a) => "[" + a.map(stringifyMegaNormal).join(", ") + "]",
    object: (o) => {
      let result = "";
      for (const k in o) {
        if (result) result += ", ";
        result += `${k}: ${stringifyMegaNormal(o[k])}`;
      }
      return result ? "{ " + result + " }" : "{}";
    },
    _: () => {
      throw new TypeError("Cannot stringify value");
    },
  });

const stringifyMegaPipe = (value: unknown): string =>
  pipe(
    value,
    match({
      "number | boolean | null | undefined": (v) => String(v),
      string: (s) => '"' + s + '"',
      bigint: (b) => `${b}n`,
      Array: (a) => "[" + a.map(stringifyMegaPipe).join(", ") + "]",
      object: (o) => {
        let result = "";
        for (const k in o) {
          if (result) result += ", ";
          result += `${k}: ${stringifyMegaPipe(o[k])}`;
        }
        return result ? "{ " + result + " }" : "{}";
      },
      _: () => {
        throw new TypeError("Cannot stringify value");
      },
    }),
  );

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

const stringifyArk = arkMatch({
  "number | boolean | null | undefined": (v) => String(v),
  string: (s) => '"' + s + '"',
  bigint: (b) => `${b}n`,
  Array: (a) => "[" + a.map((v): string => stringifyArk(v)).join(", ") + "]",
  object: (o) => {
    let result = "";
    for (const k in o) {
      if (result) result += ", ";
      result += `${k}: ${stringifyArk(o[k])}`;
    }
    return result ? "{ " + result + " }" : "{}";
  },
  default: () => {
    throw new TypeError("Cannot stringify value");
  },
});

const stringifyArkPipe = (value: unknown): string =>
  pipe(
    value,
    arkMatch({
      "number | boolean | null | undefined": (v) => String(v),
      string: (s) => '"' + s + '"',
      bigint: (b) => `${b}n`,
      Array: (a) => "[" + a.map(stringifyArkPipe).join(", ") + "]",
      object: (o) => {
        let result = "";
        for (const k in o) {
          if (result) result += ", ";
          result += `${k}: ${stringifyArkPipe(o[k])}`;
        }
        return result ? "{ " + result + " }" : "{}";
      },
      default: () => {
        throw new TypeError("Cannot stringify value");
      },
    }),
  );

const stringifyEffect = Match.type<unknown>().pipe(
  Match.whenOr(Match.number, Match.boolean, Match.null, Match.undefined, (v) => String(v)),
  Match.when(Match.string, (s) => '"' + s + '"'),
  Match.when(Match.bigint, (b) => `${b}n`),
  Match.when(Match.instanceOf(Array), (a): string => "[" + a.map(stringifyEffect).join(", ") + "]"),
  Match.when(Match.record, (o) => {
    let result = "";
    for (const k in o) {
      if (result) result += ", ";
      result += `${k}: ${stringifyEffect(o[k])}`;
    }
    return result ? "{ " + result + " }" : "{}";
  }),
  Match.orElse(() => {
    throw new TypeError("Cannot stringify value");
  }),
);

const stringifyEffectNormal = (value: unknown): string =>
  Match.value(value).pipe(
    Match.whenOr(Match.number, Match.boolean, Match.null, Match.undefined, (v) => String(v)),
    Match.when(Match.string, (s) => '"' + s + '"'),
    Match.when(Match.bigint, (b) => `${b}n`),
    Match.when(Match.instanceOf(Array), (a) => "[" + a.map(stringifyEffectNormal).join(", ") + "]"),
    Match.when(Match.record, (o) => {
      let result = "";
      for (const k in o) {
        if (result) result += ", ";
        result += `${k}: ${stringifyEffectNormal(o[k])}`;
      }
      return result ? "{ " + result + " }" : "{}";
    }),
    Match.orElse(() => {
      throw new TypeError("Cannot stringify value");
    }),
  );

const stringifyEffectPipe = (value: unknown): string =>
  pipe(
    value,
    Match.type().pipe(
      Match.whenOr(Match.number, Match.boolean, Match.null, Match.undefined, (v) => String(v)),
      Match.when(Match.string, (s) => '"' + s + '"'),
      Match.when(Match.bigint, (b) => `${b}n`),
      Match.when(Match.instanceOf(Array), (a) => "[" + a.map(stringifyEffectPipe).join(", ") + "]"),
      Match.when(Match.record, (o) => {
        let result = "";
        for (const k in o) {
          if (result) result += ", ";
          result += `${k}: ${stringifyEffectPipe(o[k])}`;
        }
        return result ? "{ " + result + " }" : "{}";
      }),
      Match.orElse(() => {
        throw new TypeError("Cannot stringify value");
      }),
    ),
  );

/* Bench */
describe('stringify("foo")', () => {
  bench("native", () => void stringify("foo"));
  bench("megamatch (JIT)", () => void stringifyMega("foo"));
  bench("megamatch (normal)", () => void stringifyMegaNormal("foo"));
  bench("megamatch (pipe)", () => void stringifyMegaPipe("foo"));
  bench("TS-Pattern", () => void stringifyTSPattern("foo"));
  bench("ArkType (JIT)", () => void stringifyArk("foo"));
  bench("ArkType (pipe)", () => void stringifyArkPipe("foo"));
  bench("Effect (JIT)", () => void stringifyEffect("foo"));
  bench("Effect (normal)", () => void stringifyEffectNormal("foo"));
  bench("Effect (pipe)", () => void stringifyEffectPipe("foo"));
});

describe("stringify(5n)", () => {
  bench("native", () => void stringify(5n));
  bench("megamatch (JIT)", () => void stringifyMega(5n));
  bench("megamatch (normal)", () => void stringifyMegaNormal(5n));
  bench("megamatch (pipe)", () => void stringifyMegaPipe(5n));
  bench("TS-Pattern", () => void stringifyTSPattern(5n));
  bench("ArkType (JIT)", () => void stringifyArk(5n));
  bench("ArkType (pipe)", () => void stringifyArkPipe(5n));
  bench("Effect (JIT)", () => void stringifyEffect(5n));
  bench("Effect (normal)", () => void stringifyEffectNormal(5n));
  bench("Effect (pipe)", () => void stringifyEffectPipe(5n));
});

describe("stringify({ nestedValue: 5n })", () => {
  bench("native", () => void stringify({ nestedValue: 5n }));
  bench("megamatch (JIT)", () => void stringifyMega({ nestedValue: 5n }));
  bench("megamatch (normal)", () => void stringifyMegaNormal({ nestedValue: 5n }));
  bench("megamatch (pipe)", () => void stringifyMegaPipe({ nestedValue: 5n }));
  bench("TS-Pattern", () => void stringifyTSPattern({ nestedValue: 5n }));
  bench("ArkType (JIT)", () => void stringifyArk({ nestedValue: 5n }));
  bench("ArkType (pipe)", () => void stringifyArkPipe({ nestedValue: 5n }));
  bench("Effect (JIT)", () => void stringifyEffect({ nestedValue: 5n }));
  bench("Effect (normal)", () => void stringifyEffectNormal({ nestedValue: 5n }));
  bench("Effect (pipe)", () => void stringifyEffectPipe({ nestedValue: 5n }));
});

describe("stringify({ foo: [{ bar: 5n }, 42], baz: { qux: 'quux' } })", () => {
  const value = { foo: [{ bar: 5n }, 42], baz: { qux: "quux" } };
  bench("native", () => void stringify(value));
  bench("megamatch (JIT)", () => void stringifyMega(value));
  bench("megamatch (normal)", () => void stringifyMegaNormal(value));
  bench("megamatch (pipe)", () => void stringifyMegaPipe(value));
  bench("TS-Pattern", () => void stringifyTSPattern(value));
  bench("ArkType (JIT)", () => void stringifyArk(value));
  bench("ArkType (pipe)", () => void stringifyArkPipe(value));
  bench("Effect (JIT)", () => void stringifyEffect(value));
  bench("Effect (normal)", () => void stringifyEffectNormal(value));
  bench("Effect (pipe)", () => void stringifyEffectPipe(value));
});
