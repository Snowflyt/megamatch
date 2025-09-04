import { _caches } from "../cache";
import { NonExhaustiveError } from "../errors";
import type { Node } from "../types";

import { parsePattern } from "./parser";

const MATCH_CACHE_PATTERN_SEPARATOR = " <|> ";

/**
 * Just-in-time (JIT) compile the match function.
 * @param cases The cases to compile.
 * @returns
 */
export const compile = <Variadic extends boolean = false>(
  cases: Record<string, (...args: unknown[]) => unknown>,
  variadic: Variadic = false as Variadic,
): Variadic extends false ? (value: unknown) => unknown : (...args: unknown[]) => unknown => {
  const patterns = Object.keys(cases);

  const { fn: compiled, toString } = (() => {
    const matchCacheKey =
      (variadic ? "<variadic> " : "") + patterns.join(MATCH_CACHE_PATTERN_SEPARATOR);
    const cached = _caches.match.get(matchCacheKey);
    if (cached) return cached;

    let body = "";
    let hasDefault = false;

    const nodes = patterns.map((pattern) => {
      // NOTE: `parsePattern` is already cached, so this would not introduce extra overhead
      const node = parsePattern(pattern);
      if (!node) throw new TypeError(`Invalid pattern: ${pattern}`);
      return node;
    });

    for (let i = 0; i < patterns.length; i++) {
      const pattern = patterns[i]!;
      const node = nodes[i]!;

      const compileCacheKey = "<matchTarget:" + (variadic ? "args" : "value") + "> " + pattern;
      const cached = _caches.compile.get(compileCacheKey);
      if (cached) {
        if (body) body += "\n\n";
        const part = cached("cases[" + i + "]");
        body += part;
        if (part.startsWith("return ")) {
          hasDefault = true;
          break;
        }
        continue;
      }

      const [predicates, args] = compileNode(variadic ? "args" : "value", [], node);
      let condition = constructCondition(predicates);

      if (body) body += "\n\n";

      if (!condition) {
        hasDefault = true;
        let constructedArgs = constructArgs(variadic ? "args" : "value", args);
        if (!constructedArgs.startsWith("{")) constructedArgs = indent(constructedArgs, true);
        _caches.compile.set(
          compileCacheKey,
          (matchFnName) => "return " + matchFnName + "(" + constructedArgs + ");",
        );
        body += "return cases[" + i + "](" + constructedArgs + ");";
        break;
      }

      condition = indent(condition, true);

      let constructedArgs = constructArgs(variadic ? "args" : "value", args);
      if (constructedArgs.startsWith("{")) constructedArgs = indent(constructedArgs, false);
      else constructedArgs = indent(constructedArgs, true, 2);
      _caches.compile.set(
        compileCacheKey,
        (matchFnName) =>
          "if (" + condition + ")\n  return " + matchFnName + "(" + constructedArgs + ");",
      );
      body += "if (" + condition + ")\n  return cases[" + i + "](" + constructedArgs + ");";
    }

    const bodyIndented = body
      .split("\n")
      .map((line) => "  " + line)
      .join("\n");

    // eslint-disable-next-line @typescript-eslint/no-implied-eval
    const fn = new Function(
      "return function match(" +
        (variadic ? "args" : "value") +
        ", cases" +
        (hasDefault ? ") {\n" : ", NonExhaustiveError) {\n") +
        bodyIndented +
        (hasDefault ? "\n};" : (
          "\n\n  throw new NonExhaustiveError(" + (variadic ? "args" : "value") + ");\n};"
        )),
    )();

    const displayString =
      "function match(" +
      (variadic ? "...args" : "value") +
      ") {\n" +
      bodyIndented +
      (hasDefault ? "\n};" : (
        "\n\n  throw new NonExhaustiveError(" + (variadic ? "args" : "value") + ");\n};"
      ));
    function toString() {
      return displayString;
    }

    const cache = { fn, toString };
    _caches.match.set(matchCacheKey, cache);
    return cache;
  })();

  const caseFns = patterns.map((pattern) => cases[pattern]!);

  return Object.defineProperty(
    variadic ?
      function match(...args: unknown[]) {
        return compiled(args, caseFns, NonExhaustiveError);
      }
    : function match(value: unknown) {
        return compiled(value, caseFns, NonExhaustiveError);
      },
    "toString",
    {
      value: toString,
      configurable: true,
      writable: true,
    },
  );
};

const constructCondition = (predicates: string[]): string | null => {
  if (!predicates.length) return null;
  if (predicates.length === 1) {
    let predicate = predicates[0]!;
    if (predicate.startsWith("(") && predicate.endsWith(")")) predicate = predicate.slice(1, -1);
    return predicate;
  }
  return predicates.reduce(
    (acc, predicate) =>
      acc + (predicate.startsWith("(\n") ? " && (\n" + predicate.slice(2) : " &&\n" + predicate),
  );
};

const constructArgs = (matchTarget: string, args: CompileResult[1]): string => {
  if (!args.length) return matchTarget;

  if (args.every(([name]) => name === "_")) {
    if (args.length === 1) return args[0]![1];
    return args.map(([, getter]) => getter).join(",\n");
  }

  if (!args.some(([name]) => name === "_"))
    return (
      "{\n  " +
      args
        .map(
          ([name, getter]) =>
            (identifierRegex.test(name) ? name : JSON.stringify(name)) +
            ": " +
            indent(getter, false),
        )
        .join(",\n  ") +
      "\n}"
    );

  throw new TypeError(
    "Pattern matching error: Cannot mix named and unnamed arguments in a pattern",
  );
};

type CompileResult = [predicates: string[], args: [argName: string, getter: string][]];

const compileNode = (matchTarget: string, path: (string | number)[], node: Node): CompileResult => {
  const type = node[0];

  if (type === "NullLiteral") return [[joinPath(matchTarget, path) + " === null"], []];
  if (type === "UndefinedLiteral") return [[joinPath(matchTarget, path) + " === undefined"], []];

  if (type === "BigIntLiteral")
    // eslint-disable-next-line @typescript-eslint/no-base-to-string
    return [[joinPath(matchTarget, path) + " === " + node[1] + "n"], []];
  if (type === "NumberLiteral")
    return [["Object.is(" + joinPath(matchTarget, path) + ", " + node[1] + ")"], []];
  if (type === "BooleanLiteral") return [[joinPath(matchTarget, path) + " === " + node[1]], []];
  if (type === "StringLiteral")
    return [[joinPath(matchTarget, path) + " === " + JSON.stringify(node[1])], []];

  if (type === "Wildcard")
    return [[compileUpperBound(matchTarget, path, node[1])].filter((v) => v !== null), []];

  if (type === "UnnamedArg") {
    const [, boundedNode] = node;
    if (!boundedNode) return [[], [["_", joinPath(matchTarget, path)]]];
    const [predicates, args] = compileNode(matchTarget, path, boundedNode);
    return [predicates, [...args, ["_", joinPath(matchTarget, path)]]];
  }
  if (type === "NamedArg") {
    const [, name, boundedNode] = node;
    if (!boundedNode) return [[], [[name, joinPath(matchTarget, path)]]];
    const [predicates, args] = compileNode(matchTarget, path, boundedNode);
    return [predicates, [...args, [name, joinPath(matchTarget, path)]]];
  }

  if (type === "Tuple") {
    const predicates =
      matchTarget === "args" ? [] : [`Array.isArray(${joinPath(matchTarget, path)})`];

    const elements = node[1];
    predicates.push(
      !elements.some(([type]) => type.includes("Spread")) ?
        joinPath(matchTarget, path) + ".length === " + elements.length
      : joinPath(matchTarget, path) + ".length >= " + (elements.length - 1),
    );

    let visitedSpread = false;
    const args: CompileResult[1] = [];
    for (let i = 0; i < elements.length; i++) {
      const node = elements[i]!;

      if (node[0] === "WildcardSpread") {
        visitedSpread = true;
        continue;
      }
      if (node[0] === "UnnamedSpreadArg" || node[0] === "NamedSpreadArg") {
        visitedSpread = true;
        args.push([
          node[0] === "UnnamedSpreadArg" ? "_" : node[1],
          joinPath(matchTarget, path) +
            ".slice(" +
            i +
            ", " +
            joinPath(matchTarget, path) +
            ".length" +
            (i === elements.length - 1 ? "" : " - " + (elements.length - i - 1)) +
            ")",
        ]);
        continue;
      }

      const [subPredicates, subArgs] = compileNode(
        matchTarget,
        [...path, visitedSpread ? i - elements.length : i],
        node,
      );
      Array.prototype.push.apply(predicates, subPredicates);
      Array.prototype.push.apply(args, subArgs);
    }
    return [predicates, args];
  }

  if (type === "Object") {
    const predicates = [compileUpperBound(matchTarget, path, "object")!];

    const entries = node[1];

    const args: CompileResult[1] = [];
    for (const [key, node] of entries) {
      if (node[0] === "UnnamedSpreadArg" || node[0] === "NamedSpreadArg") {
        const matchedKeys = entries
          .filter(([, [type]]) => !type.includes("Spread"))
          .map(([key]) => (key.endsWith("?") ? key.slice(0, -1) : key));
        args.push([
          node[0] === "UnnamedSpreadArg" ? "_" : node[1],
          "(() => {\n" +
            "  const result = {};\n" +
            `  for (const key of Reflect.ownKeys(${joinPath(matchTarget, path)})) {\n` +
            `    if (!Reflect.getOwnPropertyDescriptor(${joinPath(matchTarget, path)}, key).enumerable) continue;\n` +
            `    if (${JSON.stringify(matchedKeys)}.indexOf(key) !== -1) continue;\n` +
            `    result[key] = ${joinPath(matchTarget, path)}[key];\n` +
            "  }\n" +
            "  return result;\n" +
            "})()",
        ]);
        continue;
      }

      // Optional key
      if (key.endsWith("?")) {
        const realKey = key.slice(0, -1);

        if (node[0] === "UnnamedArg" || node[0] === "NamedArg") {
          const boundedNode = node[0] === "UnnamedArg" ? node[1] : node[2];
          if (!boundedNode) {
            args.push([
              node[0] === "UnnamedArg" ? "_" : node[1],
              `"${realKey}" in ${joinPath(matchTarget, path)} ? ${joinPath(matchTarget, path)}["${realKey}"] : undefined`,
            ]);
            continue;
          }
          const [boundedPredicates, boundedArgs] = compileNode(
            matchTarget,
            [...path, realKey],
            boundedNode,
          );
          if (boundedPredicates)
            predicates.push(
              `(!("${realKey}" in ${joinPath(matchTarget, path)}) || ` +
                (boundedPredicates.length === 1 ?
                  boundedPredicates[0]!
                : "(\n  " +
                  boundedPredicates.map((predicate) => indent(predicate, false)).join(" &&\n  ") +
                  "\n)") +
                ")",
            );
          for (const [argName, getter] of boundedArgs)
            args.push([
              argName,
              `"${realKey}" in ${joinPath(matchTarget, path)}` +
                " ?\n  " +
                indent(getter, false) +
                "\n: undefined",
            ]);
          args.push([
            node[0] === "UnnamedArg" ? "_" : node[1],
            `"${realKey}" in ${joinPath(matchTarget, path)}` +
              " ?\n  " +
              joinPath(matchTarget, [...path, realKey]) +
              "\n: undefined",
          ]);
          continue;
        }

        const [subPredicates, subArgs] = compileNode(matchTarget, [...path, realKey], node);
        if (subPredicates)
          predicates.push(
            `(!("${realKey}" in ${joinPath(matchTarget, path)}) || ` +
              (subPredicates.length === 1 ?
                subPredicates[0]!
              : "(\n  " +
                subPredicates.map((predicate) => indent(predicate, false)).join(" &&\n  ") +
                "\n)") +
              ")",
          );
        for (const [argName, getter] of subArgs)
          args.push([
            argName,
            `"${realKey}" in ${joinPath(matchTarget, path)}` +
              " ?\n  " +
              indent(getter, false) +
              "\n: undefined",
          ]);
      }

      // Required key
      else {
        predicates.push(`"${key}" in ${joinPath(matchTarget, path)}`);
        const [subPredicates, subArgs] = compileNode(matchTarget, [...path, key], node);
        Array.prototype.push.apply(predicates, subPredicates);
        Array.prototype.push.apply(args, subArgs);
      }
    }
    return [predicates, args];
  }

  if (type === "SugaredADTRoot") {
    const predicates = [
      compileUpperBound(matchTarget, path, "object")!,
      '"_tag" in ' +
        joinPath(matchTarget, path) +
        " && " +
        joinPath(matchTarget, path) +
        '._tag === "' +
        node[1] +
        '"',
    ];
    const arg = [
      "_",
      "...(() => {\n" +
        "  const entries = [];\n" +
        `  for (const key in ${joinPath(matchTarget, path)})\n` +
        `    if (Object.prototype.hasOwnProperty.call(${joinPath(matchTarget, path)}, key))\n` +
        `      entries.push([key, ${joinPath(matchTarget, path)}[key]]);\n` +
        "  return entries\n" +
        '    .filter(([key]) => key.startsWith("_") && !Object.is(Number(key.slice(1)), NaN))\n' +
        "    .sort(([a], [b]) => Number(a.slice(1)) - Number(b.slice(1)))\n" +
        "    .map(([, value]) => value);\n" +
        "})()",
    ] as CompileResult[1][number];
    return [predicates, [arg]];
  }

  if (type === "Or") {
    const predicates: string[] = [];
    for (const variant of node[1]) {
      const [subPredicates] = compileNode(matchTarget, path, variant);
      predicates.push(subPredicates.join(" && "));
    }
    return [
      ["(\n  " + predicates.map((predicate) => indent(predicate, false)).join(" ||\n  ") + "\n)"],
      [],
    ];
  }

  throw new Error(`Cannot handle pattern type: ${type}`);
};

const compileUpperBound = (
  matchTarget: string,
  path: (string | number)[],
  upperBound: unknown,
): string | null => {
  if (upperBound === "unknown") return null;

  if (upperBound === "string") return `typeof ${joinPath(matchTarget, path)} === "string"`;
  if (upperBound === "number") return `typeof ${joinPath(matchTarget, path)} === "number"`;
  if (upperBound === "boolean") return `typeof ${joinPath(matchTarget, path)} === "boolean"`;
  if (upperBound === "symbol") return `typeof ${joinPath(matchTarget, path)} === "symbol"`;
  if (upperBound === "bigint") return `typeof ${joinPath(matchTarget, path)} === "bigint"`;
  if (upperBound === "function") return `typeof ${joinPath(matchTarget, path)} === "function"`;
  if (upperBound === "object")
    return `((${joinPath(matchTarget, path)} !== null && typeof ${joinPath(matchTarget, path)} === "object") || typeof ${joinPath(matchTarget, path)} === "function")`;
  if (upperBound === "nonNullable")
    return `${joinPath(matchTarget, path)} !== null && ${joinPath(matchTarget, path)} !== undefined`;

  if (upperBound === "Date") return `${joinPath(matchTarget, path)} instanceof Date`;
  if (upperBound === "RegExp") return `${joinPath(matchTarget, path)} instanceof RegExp`;
  if (upperBound === "Error") return `${joinPath(matchTarget, path)} instanceof Error`;
  if (upperBound === "Array") return `Array.isArray(${joinPath(matchTarget, path)})`;
  if (upperBound === "Map") return `${joinPath(matchTarget, path)} instanceof Map`;
  if (upperBound === "Set") return `${joinPath(matchTarget, path)} instanceof Set`;
  if (upperBound === "WeakMap") return `${joinPath(matchTarget, path)} instanceof WeakMap`;
  if (upperBound === "WeakSet") return `${joinPath(matchTarget, path)} instanceof WeakSet`;
  if (upperBound === "Promise") return `${joinPath(matchTarget, path)} instanceof Promise`;
  // See: https://stackoverflow.com/a/29651223/21418758
  if (upperBound === "TypedArray")
    return `(ArrayBuffer.isView(${joinPath(matchTarget, path)}) && !(${joinPath(matchTarget, path)} instanceof DataView))`;
  if (upperBound === "ArrayBuffer") return `${joinPath(matchTarget, path)} instanceof ArrayBuffer`;
  if (upperBound === "DataView") return `${joinPath(matchTarget, path)} instanceof DataView`;

  throw new Error(`Unknown upper bound: ${String(upperBound)}`);
};

const identifierRegex = /^[a-zA-Z_$][0-9a-zA-Z_$]*$/;
const joinPath = (matchTarget: string, path: (string | number)[]): string => {
  let result = matchTarget;
  for (const part of path)
    if (typeof part === "string")
      if (identifierRegex.test(part)) result += "." + part;
      else result += "[" + JSON.stringify(part) + "]";
    else
      result += "[" + (part >= 0 ? part : joinPath(matchTarget, path) + ".length - " + -part) + "]";
  return result;
};

const indent = (str: string, newLineAround: boolean, level = 1): string => {
  if (!str.includes("\n")) return str;
  const lines = str.split("\n");
  return (
    (newLineAround ? "\n" + "  ".repeat(level) : "") +
    lines[0]! +
    "\n" +
    lines
      .slice(1)
      .map((line) => "  ".repeat(level) + line)
      .join("\n") +
    (newLineAround ? "\n" + "  ".repeat(level - 1) : "")
  );
};
