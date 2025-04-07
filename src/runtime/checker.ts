/**
 * @module
 * @private
 * @internal
 */

import type { Node } from "../types";

export const checkNode = (node: Node): void => {
  const type = node[0];

  if (type === "Tuple") {
    const elements = node[1];
    const spreadNodes = elements.filter(([type]) => type.includes("Spread"));
    if (spreadNodes.length > 1)
      throw new Error("Tuple pattern cannot have more than one spread argument");
    for (const element of elements) checkNode(element);
  }

  if (type === "Object") {
    const entries = node[1];
    const spreadNodes = entries.filter(([, [type]]) => type.includes("Spread"));
    if (spreadNodes.length > 1)
      throw new Error("Object pattern cannot have more than one spread argument");
    for (const entry of entries) checkNode(entry[1]);
  }

  if (type === "Or") {
    const variants = node[1];
    if (variants.some(([type]) => type.includes("Arg")))
      throw new Error("Cannot use arguments in an “or” pattern");
    for (const variant of node[1]) checkNode(variant);
  }
};
