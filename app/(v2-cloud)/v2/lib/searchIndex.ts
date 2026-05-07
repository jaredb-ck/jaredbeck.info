import type { Project } from '@/types'

// ── Stopwords — filtered from both index tokens and query terms ──
const STOPWORDS = new Set([
  'a', 'an', 'the', 'and', 'or', 'of', 'in', 'at', 'to', 'for',
  'with', 'by', 'from', 'on', 'is', 'was', 'are', 'were', 'be',
  'been', 'it', 'its', 'this', 'that', 'project', 'work', 'design',
  'studio', 'co', 'inc', 'llc', 'ltd',
])

// ── Types ───────────────────────────────────────────────────────

export interface AssetIndexEntry {
  src: string
  projectId: string
  projectTitle: string
  mediaType: 'image' | 'video'
  mediaIndex: number
  w: number
  h: number
  role: 'hero' | 'supplementary'
  year: string
  medium: string
  client: string
  disciplineTags: string[]
  visualTags: string[]
  filenameTokens: string[]
  searchTokens: string[]
}

export interface AssetSearchResult {
  projectId: string
  src: string
  mediaType: 'image' | 'video'
  mediaIndex: number
  isHero: boolean
  score: number
}

export type SearchIndex = AssetIndexEntry[]

// ── Result caps ─────────────────────────────────────────────────

const MAX_RESULTS = 40
const MAX_PER_PROJECT = 4
const MIN_TOTAL_SCORE = 8
const MIN_SINGLE_TERM_SCORE = 5
const MIN_SUBSTRING_LENGTH = 4

// ── Token helpers ───────────────────────────────────────────────

function splitWords(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\s\-]/g, ' ')
    .split(/[\s]+/)
    .filter(t => t.length > 1 && !STOPWORDS.has(t))
}

/** Split a hyphenated tag into the full tag + component words.
 *  "black-and-white" → ["black-and-white", "black", "white"]
 *  "logo-design"     → ["logo-design", "logo", "design"]  (but "design" filtered by stopwords)
 */
function expandTag(tag: string): string[] {
  const tokens = [tag]
  if (tag.includes('-')) {
    for (const part of tag.split('-')) {
      if (part.length > 1 && !STOPWORDS.has(part)) tokens.push(part)
    }
  }
  return tokens
}

function dedupe(arr: string[]): string[] {
  return [...new Set(arr)]
}

// ── Build the index ─────────────────────────────────────────────

export function buildSearchIndex(projects: Project[]): SearchIndex {
  const entries: AssetIndexEntry[] = []

  for (const project of projects) {
    // Pre-compute project-level tokens
    const discTokens: string[] = []
    for (const tag of project.disciplineTags) discTokens.push(...expandTag(tag))

    const visTokens: string[] = []
    for (const tag of project.visualTags) visTokens.push(...expandTag(tag))

    const mediumTokens = splitWords(project.medium)
    // Also add hyphenated compound if medium has multi-word entries
    for (const part of project.medium.split(',')) {
      const trimmed = part.trim().toLowerCase().replace(/\s+/g, '-')
      if (trimmed.includes('-')) mediumTokens.push(trimmed)
    }

    const titleTokens = splitWords(project.title)
    const clientWords = splitWords(project.client)
    // Full client name as a single hyphenated token for exact matching
    const clientFull = project.client.toLowerCase().replace(/[^\w\s]/g, '').replace(/\s+/g, '-')
    const clientTokens = clientFull.length > 1 ? [clientFull, ...clientWords] : clientWords
    const yearToken = String(project.year)

    const projectSearchTokens = dedupe([
      ...discTokens, ...visTokens, ...mediumTokens,
      ...titleTokens, ...clientTokens, yearToken,
    ])

    // Index images
    for (let i = 0; i < project.images.length; i++) {
      const asset = project.images[i]
      if (asset.w === 0 && asset.h === 0) continue
      const basename = asset.src.replace(/\.\w+$/, '')
      const fnTokens = splitWords(basename.replace(/[-_]/g, ' '))
      entries.push({
        src: asset.src,
        projectId: project.id,
        projectTitle: project.title,
        mediaType: 'image',
        mediaIndex: i,
        w: asset.w,
        h: asset.h,
        role: i === 0 ? 'hero' : 'supplementary',
        year: yearToken,
        medium: project.medium,
        client: project.client,
        disciplineTags: project.disciplineTags,
        visualTags: project.visualTags,
        filenameTokens: fnTokens,
        searchTokens: dedupe([...projectSearchTokens, ...fnTokens]),
      })
    }

    // Index videos
    for (let i = 0; i < project.videos.length; i++) {
      const asset = project.videos[i]
      if (asset.w === 0 && asset.h === 0) continue
      const basename = asset.src.replace(/\.\w+$/, '')
      const fnTokens = splitWords(basename.replace(/[-_]/g, ' '))
      entries.push({
        src: asset.src,
        projectId: project.id,
        projectTitle: project.title,
        mediaType: 'video',
        mediaIndex: i,
        w: asset.w,
        h: asset.h,
        role: 'supplementary',
        year: yearToken,
        medium: project.medium,
        client: project.client,
        disciplineTags: project.disciplineTags,
        visualTags: project.visualTags,
        filenameTokens: fnTokens,
        searchTokens: dedupe([...projectSearchTokens, ...fnTokens]),
      })
    }
  }

  return entries
}

// ── Scoring ─────────────────────────────────────────────────────

interface TermScore {
  term: string
  score: number
  matchType: string
}

function scoreTermAgainstAsset(
  term: string,
  entry: AssetIndexEntry,
): TermScore {
  // 1. Exact matches — check each field category for the highest score

  // visualTag exact: 10
  for (const tag of entry.visualTags) {
    if (tag === term) return { term, score: 10, matchType: 'visualTag exact' }
    // Also check expanded components
    if (tag.includes('-')) {
      for (const part of tag.split('-')) {
        if (part === term && !STOPWORDS.has(part)) {
          return { term, score: 10, matchType: `visualTag exact via ${tag}` }
        }
      }
    }
  }

  // disciplineTag exact: 10
  for (const tag of entry.disciplineTags) {
    if (tag === term) return { term, score: 10, matchType: 'disciplineTag exact' }
    if (tag.includes('-')) {
      for (const part of tag.split('-')) {
        if (part === term && !STOPWORDS.has(part)) {
          return { term, score: 10, matchType: `disciplineTag exact via ${tag}` }
        }
      }
    }
  }

  // client full-name exact: 15 (highest — "adidas" matches "adidas")
  const clientFull = entry.client.toLowerCase().replace(/[^\w\s]/g, '').replace(/\s+/g, '-')
  if (clientFull === term) {
    return { term, score: 15, matchType: 'client full exact' }
  }

  // client word exact: 10 ("google" matches "Google Pixel")
  const clientWords = splitWords(entry.client)
  if (clientWords.includes(term)) {
    return { term, score: 10, matchType: 'client word exact' }
  }

  // filename exact: 10
  if (entry.filenameTokens.includes(term)) {
    return { term, score: 10, matchType: 'filename exact' }
  }

  // medium exact: 8
  const mediumWords = splitWords(entry.medium)
  if (mediumWords.includes(term)) {
    return { term, score: 8, matchType: 'medium exact' }
  }

  // title word exact: 5
  const titleWords = splitWords(entry.projectTitle)
  if (titleWords.includes(term)) {
    return { term, score: 5, matchType: 'title exact' }
  }

  // year exact: 8
  if (entry.year === term) {
    return { term, score: 8, matchType: 'year exact' }
  }

  // 2. Substring matches — only if term is >= MIN_SUBSTRING_LENGTH chars
  if (term.length >= MIN_SUBSTRING_LENGTH) {
    // client substring: 4
    if (entry.client.toLowerCase().includes(term)) {
      return { term, score: 4, matchType: 'client substring' }
    }

    // visualTag substring: 3
    for (const tag of entry.visualTags) {
      if (tag.includes(term)) {
        return { term, score: 3, matchType: `visualTag substring via ${tag}` }
      }
    }

    // disciplineTag substring: 3
    for (const tag of entry.disciplineTags) {
      if (tag.includes(term)) {
        return { term, score: 3, matchType: `disciplineTag substring via ${tag}` }
      }
    }

    // medium substring: 2
    if (entry.medium.toLowerCase().includes(term)) {
      return { term, score: 2, matchType: 'medium substring' }
    }

    // title word substring: 1
    if (entry.projectTitle.toLowerCase().includes(term)) {
      return { term, score: 1, matchType: 'title substring' }
    }
  }

  return { term, score: 0, matchType: 'no match' }
}

// ── Search ──────────────────────────────────────────────────────

export function search(
  index: SearchIndex,
  query: string,
  debug = false,
): AssetSearchResult[] {
  // Process query
  const queryTerms = splitWords(query.trim())
  if (queryTerms.length === 0) return []

  const scored: (AssetSearchResult & { _debug?: unknown })[] = []

  for (const entry of index) {
    const termScores: TermScore[] = []
    let totalScore = 0
    let maxSingleTerm = 0
    let termsMatched = 0

    for (const term of queryTerms) {
      const ts = scoreTermAgainstAsset(term, entry)
      termScores.push(ts)
      totalScore += ts.score
      if (ts.score > maxSingleTerm) maxSingleTerm = ts.score
      if (ts.score > 0) termsMatched++
    }

    // Strict threshold: ALL three conditions must pass
    // 1 term → 1 must match, 2 terms → both, 3+ → at least half
    const n = queryTerms.length
    const minTermsRequired = n <= 2 ? n : Math.ceil(n / 2)
    const passesTotal = totalScore >= MIN_TOTAL_SCORE
    const passesSingleTerm = maxSingleTerm >= MIN_SINGLE_TERM_SCORE
    const passesTermCoverage = termsMatched >= minTermsRequired

    if (passesTotal && passesSingleTerm && passesTermCoverage) {
      const result: AssetSearchResult & { _debug?: unknown } = {
        projectId: entry.projectId,
        src: entry.src,
        mediaType: entry.mediaType,
        mediaIndex: entry.mediaIndex,
        isHero: entry.role === 'hero',
        score: totalScore,
      }

      if (debug) {
        const matchedFields: Record<string, string> = {}
        for (const ts of termScores) {
          if (ts.score > 0) matchedFields[ts.term] = ts.matchType
        }
        result._debug = {
          src: entry.src,
          projectId: entry.projectId,
          score: totalScore,
          matchedTerms: termScores.filter(t => t.score > 0).map(t => t.term),
          matchedFields,
        }
      }

      scored.push(result)
    }
  }

  // ── Project boost for client matches ────────────────────────
  // If any asset matched via client (full exact 15 or word exact 10),
  // boost ALL assets from that project so they all surface.
  // These projects also skip the per-project cap.
  const boostedProjects = new Set<string>()
  for (const item of scored) {
    if (item.score >= 10) {
      // Check if this score came from a client match by re-scoring
      const entry = index.find(e =>
        e.projectId === item.projectId && e.src === item.src &&
        e.mediaType === item.mediaType && e.mediaIndex === item.mediaIndex
      )
      if (entry) {
        for (const term of queryTerms) {
          const ts = scoreTermAgainstAsset(term, entry)
          if (ts.matchType.startsWith('client')) {
            boostedProjects.add(item.projectId)
            break
          }
        }
      }
    }
  }

  // Add un-scored assets from boosted projects
  if (boostedProjects.size > 0) {
    const scoredKeys = new Set(scored.map(r => `${r.projectId}--${r.mediaType}-${r.mediaIndex}`))
    for (const entry of index) {
      if (!boostedProjects.has(entry.projectId)) continue
      const key = `${entry.projectId}--${entry.mediaType}-${entry.mediaIndex}`
      if (scoredKeys.has(key)) continue
      scored.push({
        projectId: entry.projectId,
        src: entry.src,
        mediaType: entry.mediaType,
        mediaIndex: entry.mediaIndex,
        isHero: entry.role === 'hero',
        score: MIN_TOTAL_SCORE, // boosted to threshold
      })
    }
  }

  if (debug) {
    for (const r of scored) {
      if (r._debug) console.log(JSON.stringify(r._debug, null, 2))
    }
  }

  // Sort: score desc → hero first
  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score
    if (a.isHero !== b.isHero) return a.isHero ? -1 : 1
    return 0
  })

  // Cap per project (skip cap for boosted projects), then total
  const perProject = new Map<string, number>()
  const results: AssetSearchResult[] = []

  for (const item of scored) {
    if (!boostedProjects.has(item.projectId)) {
      const count = perProject.get(item.projectId) ?? 0
      if (count >= MAX_PER_PROJECT) continue
      perProject.set(item.projectId, count + 1)
    }
    results.push(item)
    if (results.length >= MAX_RESULTS) break
  }

  return results
}
