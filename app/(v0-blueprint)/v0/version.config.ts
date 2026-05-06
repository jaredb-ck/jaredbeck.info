// Version config for v0 — Baseline.
// This file is locked once a newer version exists.
// Never modify after v1 ships.

export const versionConfig = {
  version: 'v0',
  name: 'Baseline',
  aesthetic: 'Light document/archive aesthetic. Cream background, near-black ink. Sparse whitespace, typographic hero, numbered catalogue structure. Inspired by design studio sites, printed catalogues, and receipt/form design.',
  constraint: 'Monospace type only. Two colors maximum. Single scrolling column. No decorative elements.',
  fonts: {
    primary: 'IBM Plex Mono',
  },
  latestPatch: {
    date: '2026-04-13',
    note: 'Layout redesigned — editorial catalogue direction, horizontal row grid replacing single column',
  },
} as const
