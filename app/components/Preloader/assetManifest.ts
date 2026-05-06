import projectsData from '@/data/projects.json'
import type { Project } from '@/types'

export interface TieredManifest {
  /** Tier 1: hero images only — preloaded before site is shown */
  heroes: string[]
  /** Tier 2: supplementary images — loaded in background */
  supplementary: string[]
  /** Tier 2: video preview URLs (first 5MB via Range fetch) */
  videoPreviews: string[]
}

/**
 * Construct the /_next/image optimised URL that the browser will
 * actually request when next/image renders the component.
 */
function getNextImageUrl(src: string, width: number): string {
  return `/_next/image?url=${encodeURIComponent(src)}&w=${width}&q=75`
}

/**
 * Builds a tiered asset manifest from projects.json.
 *
 * Tier 1 (heroes): first image per project at 1920 + 1200 widths
 * Tier 2 (supplementary): remaining images at 1200 width
 * Tier 2 (videoPreviews): raw video URLs for Range-fetch preview
 */
export function buildTieredManifest(): TieredManifest {
  const seen = new Set<string>()
  const heroes: string[] = []
  const supplementary: string[] = []
  const videoPreviews: string[] = []

  const projects = projectsData as Project[]

  for (const project of projects) {
    project.images.forEach((img, i) => {
      const raw = `/images/${project.id}/${img.src}`

      if (i === 0) {
        for (const w of [1920, 1200]) {
          const url = getNextImageUrl(raw, w)
          if (!seen.has(url)) {
            seen.add(url)
            heroes.push(url)
          }
        }
      } else {
        const url = getNextImageUrl(raw, 1200)
        if (!seen.has(url)) {
          seen.add(url)
          supplementary.push(url)
        }
      }
    })

    for (const vid of project.videos) {
      const url = `/videos/${project.id}/${vid.src}`
      if (!seen.has(url)) {
        seen.add(url)
        videoPreviews.push(url)
      }
    }
  }

  return { heroes, supplementary, videoPreviews }
}
