/**
 * @module
 * @private
 * @internal
 */

import type { Ask, Flow, Pipe } from "hkt-core";

import type { List, Nat, Str, Union } from "../lib/type-utils";
import type { Node } from "../types";

export type CheckNode<N extends Node> =
  N extends [type: "Tuple", elements: infer Elements extends Node[]] ?
    Pipe<
      Elements,
      List.Map$<List.Head$>,
      List.CountBy$<Str.Contains$<"Spread">>,
      Nat.Gt$<1>
    > extends true ?
      "Tuple pattern cannot have more than one spread argument"
    : CheckNode<Elements[number]>
  : N extends [type: "Object", entries: infer Entries extends [string, Node][]] ?
    Pipe<
      Entries,
      List.Map$<Flow<Ask<[string, Node]>, List.At$<1>, List.Head$>>,
      List.CountBy$<Str.Contains$<"Spread">>,
      Nat.Gt$<1>
    > extends true ?
      "Object pattern cannot have more than one spread argument"
    : CheckNode<Entries[number][1]>
  : N extends [type: "Or", variants: infer Variants extends Node[]] ?
    Pipe<Variants[number], List.At$<0>, Union.Any$<Str.Contains$<"Arg">>> extends true ?
      "Cannot use arguments in an “or” pattern"
    : CheckNode<Variants[number]>
  : never;
