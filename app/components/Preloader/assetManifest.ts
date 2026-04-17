import projectsData from '@/data/projects.json'
import type { Project } from '@/types'

export interface AssetEntry {
  url: string
  kind: 'image' | 'video'
  isHero: boolean
}

/**
 * Construct the /_next/image optimised URL that the browser will
 * actually request when next/image renders the component.
 */
function getNextImageUrl(src: string, width: number): string {
  return `/_next/image?url=${encodeURIComponent(src)}&w=${width}&q=75`
}

/**
 * Builds a deduplicated list of all asset URLs from projects.json.
 *
 * Images are returned as /_next/image optimised URLs (matching what
 * next/image will request at render time) so the browser cache hit
 * is guaranteed. Hero images (first per project) get both a desktop
 * (1920) and mobile (1200) variant. Supplementary images get 1200.
 *
 * Videos are returned as raw paths — they bypass next/image.
 */
export function buildAssetManifest(): AssetEntry[] {
  const seen = new Set<string>()
  const entries: AssetEntry[] = []

  const projects = projectsData as Project[]

  for (const project of projects) {
    project.images.forEach((img, i) => {
      const raw = `/images/${project.id}/${img.src}`
      const isHero = i === 0

      if (isHero) {
        // Desktop + mobile sizes for hero images
        for (const w of [1920, 1200]) {
          const url = getNextImageUrl(raw, w)
          if (!seen.has(url)) {
            seen.add(url)
            entries.push({ url, kind: 'image', isHero: true })
          }
        }
      } else {
        const url = getNextImageUrl(raw, 1200)
        if (!seen.has(url)) {
          seen.add(url)
          entries.push({ url, kind: 'image', isHero: false })
        }
      }
    })

    for (const vid of project.videos) {
      const url = `/videos/${project.id}/${vid.src}`
      if (!seen.has(url)) {
        seen.add(url)
        entries.push({ url, kind: 'video', isHero: false })
      }
    }
  }

  return entries
}
