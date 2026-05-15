import { Project } from '@/types'

export interface CarouselDef {
  title: string
  projects: Project[]
}

function hasAnyDisciplineTag(project: Project, tags: string[]): boolean {
  return project.disciplineTags.some(t => tags.includes(t))
}

function hasAnyVisualTag(project: Project, tags: string[]): boolean {
  return project.visualTags.some(t => tags.includes(t))
}

function byDateDescending(a: Project, b: Project): number {
  return b.dateAdded.localeCompare(a.dateAdded)
}

export function buildCarousels(projects: Project[]): CarouselDef[] {
  const all = [...projects].sort(byDateDescending)
  const MIN = 2

  const defs: { title: string; filter: (p: Project) => boolean; sort?: (a: Project, b: Project) => number; limit?: number }[] = [
    // Tier 1
    {
      title: 'Recently Added',
      filter: p => p.year >= 2025,
    },
    {
      title: 'Digital & UI',
      filter: p => hasAnyDisciplineTag(p, ['ui-ux', 'web-design', 'app-design', 'digital', 'screen', 'prototype']),
    },
    {
      title: 'Branding',
      filter: p => hasAnyDisciplineTag(p, ['brand-identity', 'logo-design', 'identity-system', 'brand-guidelines', 'wordmark']),
    },
    {
      title: 'Print & Editorial',
      filter: p => hasAnyDisciplineTag(p, ['print', 'editorial', 'publication', 'book', 'zine', 'poster', 'catalog', 'lookbook']),
    },
    {
      title: 'Motion & Video',
      filter: p => hasAnyDisciplineTag(p, ['motion', 'video', 'animation']),
    },
    {
      title: 'Made to Wear',
      filter: p => hasAnyDisciplineTag(p, ['apparel', 'merchandise', 'uniform', 'jersey', 'hat', 'tote']) ||
                   hasAnyVisualTag(p, ['clothing', 'jersey', 'hat', 'apparel']),
    },
    {
      title: 'Made for the Wall',
      filter: p => hasAnyDisciplineTag(p, ['poster', 'billboard', 'out-of-home', 'environmental', 'signage', 'wayfinding']) ||
                   hasAnyVisualTag(p, ['billboard', 'poster', 'mural']),
    },
    {
      title: 'Type-Driven',
      filter: p => hasAnyVisualTag(p, ['typographic', 'lettering', 'hand-lettering', 'display-type', 'large-type', 'all-caps']),
    },
    {
      title: 'Photography & Direction',
      filter: p => hasAnyDisciplineTag(p, ['photography', 'art-direction']) ||
                   hasAnyVisualTag(p, ['portrait', 'lifestyle', 'editorial-photography', 'fashion-photography']),
    },
    // Tier 2
    {
      title: 'For Sport',
      filter: p => hasAnyDisciplineTag(p, ['sports']) ||
                   hasAnyVisualTag(p, ['athlete', 'stadium', 'jersey', 'ball', 'trophy', 'sport']),
    },
    {
      title: 'For Culture',
      filter: p => hasAnyDisciplineTag(p, ['music', 'entertainment', 'culture', 'arts', 'nonprofit', 'civic']) ||
                   hasAnyVisualTag(p, ['record', 'stage', 'crowd', 'gallery']),
    },
    {
      title: 'For Food & Drink',
      filter: p => hasAnyDisciplineTag(p, ['food-and-beverage']) ||
                   hasAnyVisualTag(p, ['food', 'drink', 'bottle', 'packaging', 'coffee', 'restaurant']),
    },
    {
      title: 'Night Work',
      filter: p => {
        const vt = p.visualTags
        const hasDark = vt.some(t => ['dark', 'high-contrast', 'neon', 'night'].includes(t))
        const hasMoody = vt.some(t => ['black-and-white', 'moody'].includes(t))
        return hasDark && hasMoody
      },
    },
    {
      title: 'Self-Initiated',
      filter: p => p.client === 'Self-initiated',
    },
    {
      title: 'Packaging',
      filter: p => hasAnyDisciplineTag(p, ['packaging', 'label', 'stationery']),
    },
  ]

  const carousels: CarouselDef[] = []

  for (const def of defs) {
    const filtered = all.filter(def.filter)
    const sorted = def.sort ? filtered.sort(def.sort) : filtered
    const limited = def.limit ? sorted.slice(0, def.limit) : sorted

    if (limited.length >= MIN) {
      carousels.push({ title: def.title, projects: limited })
    }
  }

  return carousels
}
