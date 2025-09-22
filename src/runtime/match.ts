/**
 * @module
 * @private
 * @internal
 */

import type { Node } from "../types";

export const invokeCaseFn = (
  value: unknown,
  matchResult: MatchResult,
  onMatch: (...args: unknown[]) => unknown,
): unknown => {
  const { args } = matchResult;
  if (Array.isArray(args)) {
    if (!args.length) return onMatch(value);
    return onMatch(...args);
  }
  if (!Object.keys(args).length) return onMatch(value);
  return onMatch(args);
};

export interface MatchResult {
  args: readonly unknown[] | Record<string, unknown>;
}

export const matchNode = (value: unknown, node: Node): MatchResult | null => {
  const type = node[0];

  if (type === "NullLiteral") return value === null ? { args: [] } : null;
  if (type === "UndefinedLiteral") return value === undefined ? { args: [] } : null;
  if (
    type === "BooleanLiteral" ||
    type === "BigIntLiteral" ||
    type === "NumberLiteral" ||
    type === "StringLiteral"
  )
    return Object.is(value, node[1]) ? { args: [] } : null;

  if (type === "Wildcard") {
    if (!validateUpperBound(value, node[1])) return null;
    return { args: [] };
  }

  if (type === "UnnamedArg") {
    const [, boundedNode] = node;
    if (!boundedNode) return { args: [value] };
    const result = matchNode(value, boundedNode);
    if (!result) return null;
    return { args: mergeArgs(result.args, [value]) };
  }
  if (type === "NamedArg") {
    const [, name, boundedNode] = node;
    if (!boundedNode) return { args: { [name]: value } };
    const result = matchNode(value, boundedNode);
    if (!result) return null;
    return { args: mergeArgs(result.args, { [name]: value }) };
  }

  if (type === "Tuple") {
    if (!Array.isArray(value)) return null;

    const elements = node[1];
    if (!elements.some(([type]) => type.includes("Spread")) && elements.length !== value.length)
      return null;
    if (value.length < elements.length - 1) return null;

    let rest = value.concat([]);

    let args: readonly unknown[] | Record<string, unknown> = [];
    for (let i = 0; i < elements.length; i++) {
      const node = elements[i]!;

      if (node[0] === "WildcardSpread") {
        rest = rest.slice(value.length - (elements.length - i));
        continue;
      }
      if (node[0] === "UnnamedSpreadArg") {
        args = mergeArgs(args, [rest.slice(0, value.length - (elements.length - i))]);
        rest = rest.slice(value.length - (elements.length - i));
        continue;
      }
      if (node[0] === "NamedSpreadArg") {
        args = mergeArgs(args, { [node[1]]: rest.slice(0, value.length - (elements.length - i)) });
        rest = rest.slice(value.length - (elements.length - i));
        continue;
      }

      const result = matchNode(rest[0], node);
      if (!result) return null;
      args = mergeArgs(args, result.args);
      rest = rest.slice(1);
    }
    return { args };
  }

  if (type === "Object") {
    if (value === null || (typeof value !== "object" && typeof value !== "function")) return null;

    const entries = node[1];

    let args: readonly unknown[] | Record<string, unknown> = [];
    for (const [key, node] of entries) {
      if (node[0] === "UnnamedSpreadArg" || node[0] === "NamedSpreadArg") {
        const result = {};
        for (const key of Reflect.ownKeys(value)) {
          if (!Reflect.getOwnPropertyDescriptor(value, key)!.enumerable) continue;
          if (
            entries.some(
              ([k, [type]]) =>
                !type.includes("Spread") && (k.endsWith("?") ? k.slice(0, -1) : k) === key,
            )
          )
            continue;
          result[key] = value[key];
        }
        args = mergeArgs(args, node[0] === "UnnamedSpreadArg" ? [result] : { [node[1]]: result });
        continue;
      }

      // Optional key
      if (key.endsWith("?")) {
        const realKey = key.slice(0, -1);

        if (!(realKey in value)) {
          args = mergeArgs(args, extractAllArgs(node, undefined));
          continue;
        }

        const result = matchNode(value[realKey], node);
        if (!result) return null;
        args = mergeArgs(args, result.args);
      }

      // Required key
      else {
        if (!(key in value)) return null;
        const result = matchNode(value[key], node);
        if (!result) return null;
        args = mergeArgs(args, result.args);
      }
    }
    return { args };
  }

  if (type === "SugaredADTRoot") {
    if (
      value == null ||
      (typeof value !== "object" && typeof value !== "function") ||
      !("_tag" in value) ||
      value._tag !== node[1]
    )
      return null;
    return {
      args: entriesOf(value)
        .filter(([key]) => key.startsWith("_") && !Object.is(Number(key.slice(1)), NaN))
        .sort(([a], [b]) => Number(a.slice(1)) - Number(b.slice(1)))
        .map(([, value]) => value),
    };
  }

  if (type === "Or") {
    for (const variant of node[1]) {
      const result = matchNode(value, variant);
      if (result) return result;
    }
    return null;
  }

  throw new Error(`Cannot handle pattern type: ${type}`);
};

/**********************
 * Internal utilities *
 **********************/
const validateUpperBound = (value: unknown, upperBound: unknown): boolean => {
  if (upperBound === "unknown") return true;

  if (upperBound === "object") {
    if (value === null || (typeof value !== "object" && typeof value !== "function")) return false;
  } else if (upperBound === "nonNullable") {
    if (value === null || value === undefined) return false;
  } else if (upperBound === "Date") {
    if (!(value instanceof Date)) return false;
  } else if (upperBound === "RegExp") {
    if (!(value instanceof RegExp)) return false;
  } else if (upperBound === "Error") {
    if (!(value instanceof Error)) return false;
  } else if (upperBound === "Array") {
    if (!Array.isArray(value)) return false;
  } else if (upperBound === "Map") {
    if (!(value instanceof Map)) return false;
  } else if (upperBound === "Set") {
    if (!(value instanceof Set)) return false;
  } else if (upperBound === "WeakMap") {
    if (!(value instanceof WeakMap)) return false;
  } else if (upperBound === "WeakSet") {
    if (!(value instanceof WeakSet)) return false;
  } else if (upperBound === "Promise") {
    if (!(value instanceof Promise)) return false;
  } else if (upperBound === "TypedArray") {
    // See: https://stackoverflow.com/a/29651223/21418758
    if (!ArrayBuffer.isView(value) || value instanceof DataView) return false;
  } else if (upperBound === "ArrayBuffer") {
    if (!(value instanceof ArrayBuffer)) return false;
  } else if (upperBound === "DataView") {
    if (!(value instanceof DataView)) return false;
  } else {
    if (typeof value !== upperBound) return false;
  }

  return true;
};

const mergeArgs = (
  args1: readonly unknown[] | Record<string, unknown>,
  args2: readonly unknown[] | Record<string, unknown>,
): readonly unknown[] | Record<string, unknown> => {
  if (Array.isArray(args2) ? !args2.length : !Object.keys(args2).length) return args1;
  if (Array.isArray(args1) ? !args1.length : !Object.keys(args1).length) return args2;

  if (Array.isArray(args1) && Array.isArray(args2)) return args1.concat(args2);
  if (!Array.isArray(args1) && !Array.isArray(args2))
    return Object.assign({}, args1 as Record<string, unknown>, args2 as Record<string, unknown>);

  throw new TypeError(" matching error: Cannot mix named and unnamed arguments in a pattern");
};

const extractAllArgs = (node: Node, fill: unknown): MatchResult["args"] => {
  const type = node[0];

  if (type === "UnnamedArg") {
    const [, boundedNode] = node;
    if (!boundedNode) return [fill];
    return mergeArgs(extractAllArgs(boundedNode, fill), [fill]);
  }
  if (type === "NamedArg") {
    const [, name, boundedNode] = node;
    if (!boundedNode) return { [name]: fill };
    return mergeArgs(extractAllArgs(boundedNode, fill), { [name]: fill });
  }

  if (type === "UnnamedSpreadArg") return [fill];
  if (type === "NamedSpreadArg") return { [node[1]]: fill };

  if (type === "Tuple")
    return node[1].reduce<MatchResult["args"]>(
      (acc, node) => mergeArgs(acc, extractAllArgs(node, fill)),
      [],
    );

  if (type === "Object")
    return node[1].reduce<MatchResult["args"]>(
      (acc, [, node]) => mergeArgs(acc, extractAllArgs(node, fill)),
      [],
    );

  return [];
};

const entriesOf = (obj: object): [string, unknown][] => {
  const entries: [string, unknown][] = [];
  for (const key in obj)
    if (Object.prototype.hasOwnProperty.call(obj, key)) entries.push([key, obj[key]]);
  return entries;
};
