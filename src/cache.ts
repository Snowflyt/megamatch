import type { Node } from "./types";

const CACHE_DEFAULT_MAX_SIZE = 10000;

/**
 * A simple FIFO cache.
 * @private
 * @internal
 */
class Cache<K, V> {
  private _maxSize: number;

  private readonly _data: Map<K, V>;
  private readonly _queue: K[];

  constructor(maxSize: number) {
    this._maxSize = maxSize;
    this._data = new Map<K, V>();
    this._queue = [];
  }

  get maxSize(): number {
    return this._maxSize;
  }

  set maxSize(size: number) {
    this._maxSize = size;
    while (this._data.size > this._maxSize) this.evict();
  }

  get(key: K): V | undefined {
    return this._data.get(key);
  }

  set(key: K, value: V): void {
    this._data.set(key, value);
    this._queue.push(key);
    while (this._data.size > this._maxSize) this.evict();
  }

  private evict(): void {
    const key = this._queue.shift();
    if (key) this._data.delete(key);
  }
}

/**
 * Caches for parsed patterns, compiled patterns and generated match functions.
 * @private
 * @internal
 */
export const _caches = {
  parse: new Cache<string, Node>(CACHE_DEFAULT_MAX_SIZE),
  compile: new Cache<string, (matchFnName: string) => string>(CACHE_DEFAULT_MAX_SIZE),
  match: new Cache<string, { fn: (...args: unknown[]) => unknown; toString: () => string }>(
    CACHE_DEFAULT_MAX_SIZE,
  ),
};

/**
 * Set the maximum size of a cache. Defaults to 10000.
 * @param size The maximum size of the pattern cache.
 */
export function setCacheLimit(type: keyof typeof _caches, size: number): void {
  _caches[type].maxSize = size;
}
