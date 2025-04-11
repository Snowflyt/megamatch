// Fix TypeScript’s complaint about missing types

// For Vitest
// See: https://github.com/vitejs/vite/issues/9813
declare interface Worker {}
declare interface WebSocket {}

declare namespace WebAssembly {
  interface Module {}
}

// For Effect
declare interface QueuingStrategy<T> {}
