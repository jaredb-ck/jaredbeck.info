import type Lenis from 'lenis'

// Module-level singleton so V0App can pause/resume without prop drilling.
// Only exists client-side — always null on the server.
let instance: Lenis | null = null

export function setLenisInstance(l: Lenis | null) {
  instance = l
}

export function getLenisInstance() {
  return instance
}
