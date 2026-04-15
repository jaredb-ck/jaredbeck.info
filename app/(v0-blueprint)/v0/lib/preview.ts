// Shared image preview constants — used by both the homepage project list
// and the project detail page so the transition between them is proportional.

export const PREVIEW_SIZES = [
  { width: 100, ratio: '16 / 9'  },
  { width: 95,  ratio: '2 / 3'   },
  { width: 110, ratio: '4 / 3'   },
  { width: 90,  ratio: '3 / 4'   },
  { width: 105, ratio: '16 / 10' },
]

// Detail page uses 2.5× the homepage sizes — same proportions, bigger images
export const DETAIL_SIZES = PREVIEW_SIZES.map(s => ({
  ratio: s.ratio,
  width: Math.round(s.width * 2.5),
}))

// Deterministic image count 3–15 derived from project id
export function previewCount(id: string): number {
  let h = 0
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) & 0xffffffff
  return 3 + (Math.abs(h) % 13)
}

// Project ids whose /public/images/[id]/ folder is populated with real assets.
// Components fall back to hatched placeholder boxes for any id not in this set.
// Add new ids here as projects get their assets ingested.
export const IMAGE_READY_PROJECTS: ReadonlySet<string> = new Set([
  'adidas-thrift-and-ride',
])

export function hasRealImages(id: string): boolean {
  return IMAGE_READY_PROJECTS.has(id)
}
