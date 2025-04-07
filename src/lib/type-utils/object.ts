/**
 * @module
 * @private
 * @internal
 */

import type { Arg0, TArg, TypeLambda, TypeLambdaG } from "hkt-core";

import type { Union } from "./union";

export namespace Obj {
  /******************
   * Static methods *
   ******************/
  /* FromEntries */
  export type FromEntries<Entries extends readonly (readonly [PropertyKey, unknown])[]> = Prettify<{
    readonly [K in Entries[number][0]]: Extract<Entries[number], readonly [K, unknown]>[1];
  }>;
  export interface FromEntries$ extends TypeLambdaG<[["K", PropertyKey], "V"]> {
    signature: (entries: readonly (readonly [TArg<this, "K">, TArg<this, "V">])[]) => {
      [K in TArg<this, "K">]: TArg<this, "V">;
    };
    return: FromEntries<Arg0<this>>;
  }

  /***********
   * Methods *
   ***********/
  /* KeyOf */
  export type KeyOf<O> = O extends readonly unknown[] ? number : keyof O;
  export interface KeyOf$ extends TypeLambda<[obj: object], PropertyKey> {
    return: KeyOf<Arg0<this>>;
  }

  /* OptionalKeyOf */
  // See: https://stackoverflow.com/a/49683575/21418758
  export type OptionalKeyOf<O> = {
    [K in keyof O]-?: {} extends { [P in K]: O[K] } ? K : never;
  }[keyof O];

  /* ValueOf */
  export type ValueOf<O> = O extends readonly unknown[] ? O[number] : O[keyof O];
  export interface ValueOf$ extends TypeLambda<[obj: object], unknown> {
    return: ValueOf<Arg0<this>>;
  }

  /* Keys */
  export type Keys<O> = Union.ToList<keyof O>;
  export interface Keys$ extends TypeLambda<[obj: object], readonly PropertyKey[]> {
    return: Keys<Arg0<this>>;
  }

  /* Values */
  export type Values<O extends object> = Union.ToList<ValueOf<O>>;
  export interface Values$ extends TypeLambda<[obj: object], readonly unknown[]> {
    return: Values<Arg0<this>>;
  }

  /* Entries */
  export type Entries<O> =
    Union.ToList<{ [K in keyof O]: readonly [K, O[K]] }[keyof O]> extends (
      infer R extends readonly (readonly [PropertyKey, unknown])[]
    ) ?
      R
    : never;
  export interface Entries$ extends TypeLambdaG<[["K", PropertyKey], "V"]> {
    signature: (
      obj: Record<TArg<this, "K">, TArg<this, "V">>,
    ) => readonly (readonly [TArg<this, "K">, TArg<this, "V">])[];
    return: Entries<Arg0<this>>;
  }

  /* Prettify */
  export type Prettify<O> =
    O extends readonly unknown[] ? O
    : O extends object ? { [K in keyof O]: O[K] }
    : O;
  export interface Prettify$ extends TypeLambdaG<["O"]> {
    signature: (obj: TArg<this, "O">) => TArg<this, "O">;
    return: Prettify<Arg0<this>>;
  }
}
