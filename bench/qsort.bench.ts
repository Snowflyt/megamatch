import { match as arkMatch } from "arktype";
import { Match, pipe } from "effect";
import { P, match as tsPatternMatch } from "ts-pattern";
import { bench, describe } from "vitest";

import { match } from "../src";
import { p, sel } from "../src/patterns";

const quickSort = (nums: number[]): number[] => {
  if (nums.length === 0) return [];
  const [head, ...tail] = nums;
  const smaller = tail.filter((n) => n <= head!);
  const greater = tail.filter((n) => n > head!);
  return [...quickSort(smaller), head!, ...quickSort(greater)];
};

const quickSortMega: (nums: number[]) => number[] = match({
  "[]": () => [],
  "[head, ...tail]": ({ head, tail }) => {
    const smaller = tail.filter((n) => n <= head);
    const greater = tail.filter((n) => n > head);
    return [...quickSortMega(smaller), head, ...quickSortMega(greater)];
  },
});

const quickSortMegaP: (nums: number[]) => number[] = match({
  [p([])]: () => [],
  [p([sel("head"), ...sel("tail")])]: ({ head, tail }) => {
    const smaller = tail.filter((n) => n <= head);
    const greater = tail.filter((n) => n > head);
    return [...quickSortMegaP(smaller), head, ...quickSortMegaP(greater)];
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

const quickSortMegaNormalP = (nums: number[]): number[] =>
  match(nums, {
    [p([])]: () => [],
    [p([sel("head"), ...sel("tail")])]: ({ head, tail }) => {
      const smaller = tail.filter((n) => n <= head);
      const greater = tail.filter((n) => n > head);
      return [...quickSortMegaNormalP(smaller), head, ...quickSortMegaNormalP(greater)];
    },
  });

const quickSortMegaPipe = (nums: number[]): number[] =>
  pipe(
    nums,
    match({
      "[]": () => [],
      "[head, ...tail]": ({ head, tail }) => {
        const smaller = tail.filter((n) => n <= head);
        const greater = tail.filter((n) => n > head);
        return [...quickSortMegaPipe(smaller), head, ...quickSortMegaPipe(greater)];
      },
    }),
  );

const quickSortMegaPipeP = (nums: number[]): number[] =>
  pipe(
    nums,
    match({
      [p([])]: () => [],
      [p([sel("head"), ...sel("tail")])]: ({ head, tail }) => {
        const smaller = tail.filter((n) => n <= head);
        const greater = tail.filter((n) => n > head);
        return [...quickSortMegaPipeP(smaller), head, ...quickSortMegaPipeP(greater)];
      },
    }),
  );

const quickSortTSPattern = (nums: number[]): number[] =>
  tsPatternMatch(nums)
    .with([], () => [])
    .with([P.select("head"), ...P.array(P.select("tail"))], ({ head, tail }) => {
      const smaller = tail.filter((n) => n <= head);
      const greater = tail.filter((n) => n > head);
      return [...quickSortTSPattern(smaller), head, ...quickSortTSPattern(greater)];
    })
    .exhaustive();

const quickSortArk: (nums: number[]) => number[] = arkMatch
  .case([], () => [])
  .case(["number", "...", "number[]"], ([head, ...tail]) => {
    const smaller = tail.filter((n) => n <= head);
    const greater = tail.filter((n) => n > head);
    return [...quickSortArk(smaller), head, ...quickSortArk(greater)];
  })
  .default(() => {
    throw new Error("absurd case");
  });

const quickSortArkPipe = (nums: number[]): number[] =>
  pipe(
    nums,
    arkMatch
      .case([], () => [])
      .case(["number", "...", "number[]"], ([head, ...tail]) => {
        const smaller = tail.filter((n) => n <= head);
        const greater = tail.filter((n) => n > head);
        return [...quickSortArkPipe(smaller), head, ...quickSortArkPipe(greater)];
      })
      .default(() => {
        throw new Error("absurd case");
      }),
  );

const quickSortEffect: (nums: number[]) => number[] = Match.type().pipe(
  Match.when(
    (value: unknown): value is [] => Array.isArray(value) && value.length === 0,
    () => [],
  ),
  Match.when(
    (value: unknown): value is [number, ...number[]] => Array.isArray(value) && value.length >= 1,
    ([head, ...tail]) => {
      const smaller = tail.filter((n) => n <= head);
      const greater = tail.filter((n) => n > head);
      return [...quickSortEffect(smaller), head, ...quickSortEffect(greater)];
    },
  ),
  Match.orElse(() => {
    throw new Error("absurd case");
  }),
);

const quickSortEffectNormal = (nums: number[]): number[] =>
  Match.value(nums).pipe(
    Match.when(
      (value: unknown): value is [] => Array.isArray(value) && value.length === 0,
      () => [],
    ),
    Match.when(
      (value: unknown): value is [number, ...number[]] => Array.isArray(value) && value.length >= 1,
      ([head, ...tail]) => {
        const smaller = tail.filter((n) => n <= head);
        const greater = tail.filter((n) => n > head);
        return [...quickSortEffectNormal(smaller), head, ...quickSortEffectNormal(greater)];
      },
    ),
    Match.orElse(() => {
      throw new Error("absurd case");
    }),
  );

/* Bench */
describe("quickSort([])", () => {
  const nums: number[] = [];
  bench("native", () => void quickSort(nums));
  bench("megamatch (JIT)", () => void quickSortMega(nums));
  bench("megamatch (JIT/p)", () => void quickSortMegaP(nums));
  bench("megamatch (normal)", () => void quickSortMegaNormal(nums));
  bench("megamatch (normal/p)", () => void quickSortMegaNormalP(nums));
  bench("megamatch (pipe)", () => void quickSortMegaPipe(nums));
  bench("megamatch (pipe/p)", () => void quickSortMegaPipeP(nums));
  bench("TS-Pattern", () => void quickSortTSPattern(nums));
  bench("ArkType (JIT)", () => void quickSortArk(nums));
  bench("ArkType (pipe)", () => void quickSortArkPipe(nums));
});

describe("quickSort([1])", () => {
  const nums = [1];
  bench("native", () => void quickSort(nums));
  bench("megamatch (JIT)", () => void quickSortMega(nums));
  bench("megamatch (JIT/p)", () => void quickSortMegaP(nums));
  bench("megamatch (normal)", () => void quickSortMegaNormal(nums));
  bench("megamatch (normal/p)", () => void quickSortMegaNormalP(nums));
  bench("megamatch (pipe)", () => void quickSortMegaPipe(nums));
  bench("megamatch (pipe/p)", () => void quickSortMegaPipeP(nums));
  bench("TS-Pattern", () => void quickSortTSPattern(nums));
  bench("ArkType (JIT)", () => void quickSortArk(nums));
  bench("ArkType (pipe)", () => void quickSortArkPipe(nums));
});

describe("quickSort([2, 1])", () => {
  const nums = [2, 1];
  bench("native", () => void quickSort(nums));
  bench("megamatch (JIT)", () => void quickSortMega(nums));
  bench("megamatch (JIT/p)", () => void quickSortMegaP(nums));
  bench("megamatch (normal)", () => void quickSortMegaNormal(nums));
  bench("megamatch (normal/p)", () => void quickSortMegaNormalP(nums));
  bench("megamatch (pipe)", () => void quickSortMegaPipe(nums));
  bench("megamatch (pipe/p)", () => void quickSortMegaPipeP(nums));
  bench("TS-Pattern", () => void quickSortTSPattern(nums));
  bench("ArkType (JIT)", () => void quickSortArk(nums));
  bench("ArkType (pipe)", () => void quickSortArkPipe(nums));
});

describe("quickSort([5, 3, 8, 1, 2])", () => {
  const nums = [5, 3, 8, 1, 2];
  bench("native", () => void quickSort(nums));
  bench("megamatch (JIT)", () => void quickSortMega(nums));
  bench("megamatch (JIT/p)", () => void quickSortMegaP(nums));
  bench("megamatch (normal)", () => void quickSortMegaNormal(nums));
  bench("megamatch (normal/p)", () => void quickSortMegaNormalP(nums));
  bench("megamatch (pipe)", () => void quickSortMegaPipe(nums));
  bench("megamatch (pipe/p)", () => void quickSortMegaPipeP(nums));
  bench("TS-Pattern", () => void quickSortTSPattern(nums));
  bench("ArkType (JIT)", () => void quickSortArk(nums));
  bench("ArkType (pipe)", () => void quickSortArkPipe(nums));
});

describe("quickSort([3, 1, 4, 1, 5, 9, 2, 6, 5, 3, 5])", () => {
  const nums = [3, 1, 4, 1, 5, 9, 2, 6, 5, 3, 5];
  bench("native", () => void quickSort(nums));
  bench("megamatch (JIT)", () => void quickSortMega(nums));
  bench("megamatch (JIT/p)", () => void quickSortMegaP(nums));
  bench("megamatch (normal)", () => void quickSortMegaNormal(nums));
  bench("megamatch (normal/p)", () => void quickSortMegaNormalP(nums));
  bench("megamatch (pipe)", () => void quickSortMegaPipe(nums));
  bench("megamatch (pipe/p)", () => void quickSortMegaPipeP(nums));
  bench("TS-Pattern", () => void quickSortTSPattern(nums));
  bench("ArkType (JIT)", () => void quickSortArk(nums));
  bench("ArkType (pipe)", () => void quickSortArkPipe(nums));
});
