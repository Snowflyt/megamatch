/**
 * @module
 * @private
 * @internal
 */

import type { Arg0, TArg, TypeLambdaG } from "hkt-core";

/**
 * Represent a value that may not exist.
 */
export type Option<T> = Some<T> | None;
export interface Some<T> {
  _tag: "Some";
  value: T;
}
export interface None {
  _tag: "None";
}

export namespace Option {
  /* Unwrap */
  export type Unwrap<Opt extends Option<unknown>> = Opt extends Some<infer T> ? T : never;
  export interface Unwrap$ extends TypeLambdaG<["T"]> {
    signature: (opt: Option<TArg<this, "T">>) => TArg<this, "T">;
    return: Unwrap<Arg0<this>>;
  }

  /* UnwrapOr */
  export type UnwrapOr<Opt, Default> = Opt extends Some<infer T> ? T : Default;
  export interface UnwrapOr$<Default> extends TypeLambdaG<["T"]> {
    signature: (opt: Option<TArg<this, "T">>) => TArg<this, "T">;
    return: UnwrapOr<Arg0<this>, Default>;
  }
}
