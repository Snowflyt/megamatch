/**
 * Error when the given input value does not match any included pattern.
 */
export class NonExhaustiveError extends Error {
  declare public readonly input: unknown;

  constructor(input: unknown) {
    super(`Pattern matching error: No pattern matches value ${stringify(input)}`);
    this.input = input;
  }
}

/**
 * Stringify a value to provide better debugging experience, handling common cases that simple
 * `JSON.stringify` does not handle, e.g., `undefined`, `bigint`, `function`, `symbol`, `Date`.
 * Circular references are considered.
 *
 * This is a simple port of the [showify](https://github.com/Snowflyt/showify/blob/7759b8778d54f686c85eba4d88b2dac2afdbcdd6/packages/lite/src/index.ts)
 * package, which is a library for stringifying objects in a human-readable way.
 * @param value The value to stringify.
 * @returns
 */
const stringify = (value: unknown): string => {
  const identifierRegex = /^[A-Za-z_$][A-Za-z0-9_$]*$/;

  const serialize = (value: unknown, ancestors: readonly unknown[]) => {
    // eslint-disable-next-line @typescript-eslint/no-base-to-string
    if (typeof value === "bigint") return `${value}n`;
    if (typeof value === "function")
      return value.name ? `[Function: ${value.name}]` : "[Function (anonymous)]";
    if (typeof value === "symbol") return value.toString();
    if (value === undefined) return "undefined";
    if (value === null) return "null";

    if (typeof value === "object") {
      if (ancestors.indexOf(value) !== -1) return "[Circular]";
      const nextAncestors = ancestors.concat([value]);

      // Handle special object types
      if (value instanceof Date) return value.toISOString();

      if (value instanceof RegExp) return value.toString();

      if (value instanceof Map) {
        const entries = Array.from(value.entries())
          .map(([k, v]) => `${serialize(k, nextAncestors)} => ${serialize(v, nextAncestors)}`)
          .join(", ");
        return `Map(${value.size}) ` + (entries ? `{ ${entries} }` : "{}");
      }

      if (value instanceof Set) {
        const values = Array.from(value)
          .map((v) => serialize(v, nextAncestors))
          .join(", ");
        return `Set(${value.size}) ` + (values ? `{ ${values} }` : "{}");
      }

      // Handle arrays and objects
      const isClassInstance =
        value.constructor && value.constructor.name && value.constructor.name !== "Object";
      const className = isClassInstance ? value.constructor.name : "";

      if (Array.isArray(value)) {
        const arrayItems = value.map((item) => serialize(item, nextAncestors)).join(", ");
        let result = `[${arrayItems}]`;
        if (className !== "Array") result = `${className}(${value.length}) ${result}`;
        return result;
      }

      const objectEntries = Reflect.ownKeys(value)
        .map((key) => {
          const keyDisplay =
            typeof key === "symbol" ? `[${key.toString()}]`
            : identifierRegex.test(key) ? key
            : JSON.stringify(key);
          const val = value[key];
          return `${keyDisplay}: ${serialize(val, nextAncestors)}`;
        })
        .join(", ");

      return (className ? `${className} ` : "") + (objectEntries ? `{ ${objectEntries} }` : "{}");
    }

    return JSON.stringify(value);
  };

  return serialize(value, []);
};
