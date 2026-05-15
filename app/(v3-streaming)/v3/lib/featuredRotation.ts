import { Project } from '@/types'

const HERO_IDS = [
  'adidas-thrift-and-ride',
  'project-fiorina-genai-app',
  'color-study-branding',
  'rockhall',
]

// Preferred 16:9 hero video per featured project (when available)
export const HERO_VIDEOS: Record<string, string> = {
  'adidas-thrift-and-ride': 'forum-45-16x9-30mb.mp4',
  'color-study-branding': 'showreel.mp4',
  'rockhall': 'homepage.mp4',
}

export const HERO_DESCRIPTORS: Record<string, string> = {
  'adidas-thrift-and-ride': 'Campaign concept and art direction for the launch of the adidas Forum \'84 \'Forum by New York City\' colorway.',
  'project-fiorina-genai-app': 'A generative AI image creation and editing app designed for Google AI/UX. Dark-mode interface with full creation-to-export workflow.',
  'color-study-branding': 'Brand identity system for Color Study Film Studio. A geometric monogram, chrome renders, and cinematic credits sequence.',
  'rockhall': 'Full website redesign for the Rock & Roll Hall of Fame. Inductee browsing, editorial content, and the RRTV motion identity.',
}

export function getFeaturedProjects(projects: Project[]): Project[] {
  return HERO_IDS
    .map(id => projects.find(p => p.id === id))
    .filter((p): p is Project => p !== undefined && p.images.length > 0)
}

export function getNextProject(
  featured: Project[],
  currentId: string | null
): Project {
  if (featured.length === 0) {
    throw new Error('No featured projects available')
  }
  if (featured.length === 1) return featured[0]

  const currentIdx = currentId
    ? featured.findIndex(p => p.id === currentId)
    : -1
  return featured[(currentIdx + 1) % featured.length]
}

export function getRandomFeatured(featured: Project[]): Project {
  return getNextProject(featured, null)
}
