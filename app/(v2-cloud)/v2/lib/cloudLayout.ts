import type { Project, ImageAsset, VideoAsset } from '@/types'

export interface CloudItem {
  id: string
  projectId: string
  project: Project
  asset: ImageAsset | VideoAsset
  mediaType: 'image' | 'video'
  /** Index within the project's images[] or videos[] array. */
  mediaIndex: number
  isHero: boolean
  x: number // % of canvas width (0–100)
  y: number // % of canvas height (0–100)
  width: number // rendered width in px
  driftFreqX: number
  driftFreqY: number
  driftAmpX: number
  driftAmpY: number
  driftPhaseX: number
  driftPhaseY: number
}

/** Mulberry32 PRNG — deterministic from a given seed. */
function mulberry32(seed: number) {
  return () => {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

interface RawAsset {
  project: Project
  asset: ImageAsset | VideoAsset
  mediaType: 'image' | 'video'
  index: number
  isHero: boolean
}

function collectAssets(projects: Project[]): RawAsset[] {
  const all: RawAsset[] = []
  for (const project of projects) {
    for (let i = 0; i < project.images.length; i++) {
      const asset = project.images[i]
      if (asset.w === 0 || asset.h === 0) continue
      all.push({ project, asset, mediaType: 'image', index: i, isHero: i === 0 })
    }
    for (let i = 0; i < project.videos.length; i++) {
      const asset = project.videos[i]
      if (asset.w === 0 || asset.h === 0) continue
      all.push({ project, asset, mediaType: 'video', index: i, isHero: false })
    }
  }
  return all
}

function shuffle<T>(arr: T[], rng: () => number): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// Dead zone around the search bar so assets float around it, not behind it.
// The search bar sits at viewport (50%, 44%). Canvas is 140%×130% with
// inset -20%/-15%, so viewport coords map to canvas coords via:
//   cx = (vx + 20) / 140 * 100,  cy = (vy + 15) / 130 * 100
//
// The zone must be large enough to clear the search bar PLUS half the
// width/height of the largest asset (heroes up to 400px) so no asset
// visually overlaps the bar.
const DEAD_ZONE = {
  cx: 50,   // canvas center x %
  cy: 45.4, // canvas center y %
  hw: 18,   // half-width in canvas %
  hh: 13,   // half-height in canvas %
}

/** Push a point outside the dead zone if it falls inside. */
function nudgeFromDeadZone(x: number, y: number, rng: () => number): { x: number; y: number } {
  const dx = x - DEAD_ZONE.cx
  const dy = y - DEAD_ZONE.cy

  if (Math.abs(dx) >= DEAD_ZONE.hw || Math.abs(dy) >= DEAD_ZONE.hh) {
    return { x, y } // already outside
  }

  // Distance to each edge of the dead zone
  const toRight = DEAD_ZONE.hw - dx
  const toLeft  = DEAD_ZONE.hw + dx
  const toDown  = DEAD_ZONE.hh - dy
  const toUp    = DEAD_ZONE.hh + dy
  const minDist = Math.min(toRight, toLeft, toDown, toUp)

  // Push to the nearest edge + a small random buffer
  const pad = 1 + rng() * 3
  if (minDist === toRight) return { x: DEAD_ZONE.cx + DEAD_ZONE.hw + pad, y }
  if (minDist === toLeft)  return { x: DEAD_ZONE.cx - DEAD_ZONE.hw - pad, y }
  if (minDist === toDown)  return { x, y: DEAD_ZONE.cy + DEAD_ZONE.hh + pad }
  return { x, y: DEAD_ZONE.cy - DEAD_ZONE.hh - pad }
}

function assignPositions(
  items: RawAsset[],
  rng: () => number,
  marginPct: number = 5,
): CloudItem[] {
  const count = items.length
  if (count === 0) return []

  const cols = Math.ceil(Math.sqrt(count * 1.4))
  const rows = Math.ceil(count / cols)
  const areaW = 100 - marginPct * 2
  const areaH = 100 - marginPct * 2
  const cellW = areaW / cols
  const cellH = areaH / rows

  return items.map((item, i) => {
    const col = i % cols
    const row = Math.floor(i / cols)

    const jitterX = (rng() - 0.5) * cellW * 0.7
    const jitterY = (rng() - 0.5) * cellH * 0.7
    let x = marginPct + (col + 0.5) * cellW + jitterX
    let y = marginPct + (row + 0.5) * cellH + jitterY

    // Keep assets clear of the search bar
    const nudged = nudgeFromDeadZone(x, y, rng)
    x = nudged.x
    y = nudged.y

    const aspectRatio = item.asset.w / item.asset.h
    let baseWidth = item.isHero
      ? 180 + rng() * 120
      : 100 + rng() * 80
    // Cap so neither dimension exceeds 300px
    if (baseWidth > 300) baseWidth = 300
    if (baseWidth / aspectRatio > 300) baseWidth = 300 * aspectRatio

    return {
      id: `${item.project.id}--${item.mediaType}-${item.index}`,
      projectId: item.project.id,
      project: item.project,
      asset: item.asset,
      mediaType: item.mediaType,
      mediaIndex: item.index,
      isHero: item.isHero,
      x: Math.max(3, Math.min(97, x)),
      y: Math.max(3, Math.min(97, y)),
      width: Math.round(baseWidth),
      driftFreqX: 0.06 + rng() * 0.12,
      driftFreqY: 0.05 + rng() * 0.1,
      driftAmpX: 15 + rng() * 35,
      driftAmpY: 12 + rng() * 30,
      driftPhaseX: rng() * Math.PI * 2,
      driftPhaseY: rng() * Math.PI * 2,
    }
  })
}

/**
 * Generate a random cloud layout from all projects.
 * Picks `count` assets with hero images weighted toward inclusion.
 */
export function generateCloudLayout(
  projects: Project[],
  count: number = 25,
  seed?: number,
): CloudItem[] {
  const rng = mulberry32(seed ?? (Date.now() ^ 0xdeadbeef))
  const all = collectAssets(projects)

  // Ensure every project has at least one hero if possible
  const heroes = all.filter(a => a.isHero)
  const supp = shuffle(all.filter(a => !a.isHero), rng)

  const selected: RawAsset[] = [...shuffle(heroes, rng)]
  const usedIds = new Set(selected.map(a => `${a.project.id}--${a.mediaType}-${a.index}`))

  for (const item of supp) {
    if (selected.length >= count) break
    const key = `${item.project.id}--${item.mediaType}-${item.index}`
    if (!usedIds.has(key)) {
      selected.push(item)
      usedIds.add(key)
    }
  }

  return assignPositions(shuffle(selected.slice(0, count), rng), rng)
}

/** Asset-level search result used by generateSearchResultLayout. */
export interface AssetMatch {
  projectId: string
  mediaType: 'image' | 'video'
  mediaIndex: number
  isHero: boolean
}

/**
 * Generate a cloud layout from specific matched assets (not entire projects).
 */
export function generateSearchResultLayout(
  projects: Project[],
  matches: AssetMatch[],
  maxCount: number = 30,
  seed?: number,
): CloudItem[] {
  const rng = mulberry32(seed ?? (Date.now() ^ 0xcafebabe))

  const projectMap = new Map(projects.map(p => [p.id, p]))

  const items: RawAsset[] = []
  for (const match of matches) {
    const project = projectMap.get(match.projectId)
    if (!project) continue
    const arr = match.mediaType === 'image' ? project.images : project.videos
    const asset = arr[match.mediaIndex]
    if (!asset || (asset.w === 0 && asset.h === 0)) continue
    items.push({
      project,
      asset,
      mediaType: match.mediaType,
      index: match.mediaIndex,
      isHero: match.isHero,
    })
  }

  const selected = items.length <= maxCount
    ? shuffle(items, rng)
    : shuffle(items, rng).slice(0, maxCount)

  return assignPositions(selected, rng, 10)
}
