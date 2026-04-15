'use client'

import React, { useState, useMemo, useRef, useEffect } from 'react'
import Image from 'next/image'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import type { Project, ImageAsset } from '@/types'
import { PREVIEW_SIZES, previewCount, hasRealImages } from '../lib/preview'
import { getLenisInstance } from '../lib/smoothScroll'
import styles from './page.module.css'

// Base width landscape thumbs render at. Portraits start from this width too,
// then get scaled down (narrower, shorter) when their natural height would
// exceed ROW_IMAGE_MAX_HEIGHT — keeping every asset at its true aspect ratio
// while preventing portraits from dominating the row.
const ROW_IMAGE_WIDTH = 150
// Hard ceiling on any thumb's rendered height. Portraits taller than this at
// ROW_IMAGE_WIDTH derive their width from the cap instead, so a 9:16 frame
// becomes (200 × 9/16) ≈ 113px wide × 200px tall.
const ROW_IMAGE_MAX_HEIGHT = 200
// Padding-bottom inside .projectRow:hover .imageRow — kept in sync with CSS.
const ROW_PADDING_BOTTOM = 24

// Display dimensions for the i-th preview slot. Real assets use ROW_IMAGE_WIDTH
// at their natural aspect, height-capped at ROW_IMAGE_MAX_HEIGHT (with width
// reduced proportionally to keep aspect intact). Placeholder slots fall back
// to the decorative PREVIEW_SIZES cycle.
function slotDims(i: number, asset: ImageAsset | null): { width: number; height: number } {
  if (asset && asset.w > 0 && asset.h > 0) {
    const naturalHeight = ROW_IMAGE_WIDTH * (asset.h / asset.w)
    if (naturalHeight <= ROW_IMAGE_MAX_HEIGHT) {
      return { width: ROW_IMAGE_WIDTH, height: Math.round(naturalHeight) }
    }
    // Too tall: derive from the cap so the image gets narrower instead of cropped.
    return {
      width: Math.round(ROW_IMAGE_MAX_HEIGHT * (asset.w / asset.h)),
      height: ROW_IMAGE_MAX_HEIGHT,
    }
  }
  const ps = PREVIEW_SIZES[i % PREVIEW_SIZES.length]
  // Decorative fallback — derive height from declared ratio for the row-fit calc.
  const [rw, rh] = ps.ratio.split('/').map(s => Number(s.trim()))
  return { width: ps.width, height: Math.round(ps.width * (rh / rw)) }
}
// Fallback row height when nothing in the row tells us otherwise (placeholder
// projects with no real assets). Matches the original .imageRow hover height.
const ROW_DEFAULT_HEIGHT = 155

gsap.registerPlugin(useGSAP, ScrollTrigger)

function formatDate(dateStr: string): string {
  // Parse as UTC so the formatted month is timezone-independent — avoids a
  // server/client hydration mismatch on dates at the start of a month.
  const d = new Date(dateStr)
  const month = d.toLocaleDateString('en-US', { month: 'long', timeZone: 'UTC' })
  return `${month}, ${d.getUTCFullYear()}`
}

interface Props {
  projects: Project[]
  title?: string
  onProjectClick: (project: Project) => void
}

// Convenience wrapper used by fitSlots and the row render.
function slotWidth(i: number, asset: ImageAsset | null): number {
  return slotDims(i, asset).width
}

// Maximum preview slots that fit edge-to-edge in `width` pixels with a 6px gap.
// `assets` is the project's image list (or null array) so per-project natural
// widths drive the count — adidas's mostly-vertical 9:16 frames pack denser
// than the decorative widths would suggest.
function fitSlots(width: number, assets: (ImageAsset | null)[]): number {
  const gap = 6
  let used = 0
  let n = 0
  while (n < 1000) {
    const w = slotWidth(n, assets[n] ?? null)
    const next = used + (n > 0 ? gap : 0) + w
    if (next > width) break
    used = next
    n++
  }
  return n
}

export default function ProjectList({ projects, title, onProjectClick }: Props) {
  const [activeFilters, setActiveFilters] = useState<Set<string>>(new Set())
  const [filterBarHeight, setFilterBarHeight] = useState(60)
  // Live width of the row container, used to compute per-project preview-fit
  // counts at render time. null until measured client-side; rendering falls
  // back to each project's pdpCount before the first measurement.
  const [rowWidth, setRowWidth] = useState<number | null>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const filterBarRef = useRef<HTMLDivElement>(null)
  // The scrollY at which the filter bar first becomes sticky — captured once at
  // mount before any scrolling so we always have the true natural position.
  const stickThresholdRef = useRef(0)

  useEffect(() => {
    const el = filterBarRef.current
    if (el) {
      stickThresholdRef.current = Math.max(
        0,
        el.getBoundingClientRect().top + window.scrollY - 78
      )
    }
  }, [])

  useEffect(() => {
    const el = filterBarRef.current
    if (!el) return
    const observer = new ResizeObserver(() => setFilterBarHeight(el.offsetHeight))
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  // Measure the row container width on mount + resize. Each row computes its
  // own fit count from this — rows with portrait-heavy real images pack denser
  // than rows of landscape decorative placeholders, so a single uniform count
  // would either overflow narrow-image rows or waste space on wide-image rows.
  useEffect(() => {
    const compute = () => {
      setRowWidth(listRef.current?.clientWidth ?? window.innerWidth)
    }
    compute()
    window.addEventListener('resize', compute)
    return () => window.removeEventListener('resize', compute)
  }, [])

  // Keep a ref so year-header calculations don't re-trigger the correction effect
  const filterBarHeightRef = useRef(filterBarHeight)
  useEffect(() => { filterBarHeightRef.current = filterBarHeight }, [filterBarHeight])

  const isMounted = useRef(false)
  useEffect(() => {
    if (!isMounted.current) { isMounted.current = true; return }

    const listEl = listRef.current
    if (!listEl) return

    if (activeFilters.size === 0) {
      listEl.style.minHeight = ''
      return
    }

    const stickThreshold = listRef.current
      ? Math.max(0, listRef.current.offsetTop - filterBarHeightRef.current - 78)
      : stickThresholdRef.current
    stickThresholdRef.current = stickThreshold

    // Delta approach: adjust minHeight so that the ACTUAL page max scroll equals
    // stickThreshold — this accounts for padding-bottom on ancestor elements
    // (e.g. .contentWrap has 128px padding-bottom) that would otherwise inflate
    // the scrollable range beyond our calculated list height.
    const targetScrollH = stickThreshold + window.innerHeight
    const currentScrollH = document.documentElement.scrollHeight // forced reflow
    const currentMinH = parseFloat(listEl.style.minHeight) || 0
    const newMinH = Math.max(0, currentMinH + (targetScrollH - currentScrollH))
    listEl.style.minHeight = `${newMinH}px`
    getLenisInstance()?.resize()

    // Scroll back if the user was already past the threshold
    if (window.scrollY > stickThreshold) {
      const lenis = getLenisInstance()
      if (lenis) {
        lenis.scrollTo(stickThreshold, { duration: 0.4 })
      } else {
        window.scrollTo({ top: stickThreshold, behavior: 'smooth' })
      }
    }
  }, [activeFilters])

  const handleRowClick = (e: React.MouseEvent, project: Project) => {
    e.preventDefault()
    onProjectClick(project)
  }

  const filterGroups = useMemo(() => ({
    Type: [...new Set(projects.flatMap(p => p.medium.split(',').map(m => m.trim())))].sort(),
  }), [projects])

  const clearFilters = () => {
    if (listRef.current) listRef.current.style.minHeight = ''
    setActiveFilters(new Set())
  }

  const toggleFilter = (value: string) => {
    const turningOn = !activeFilters.has(value)
    if (turningOn) {
      const listEl = listRef.current
      if (listEl) {
        // Derive threshold from the static list element — immune to sticky offsetTop quirks
        const threshold = Math.max(0, listEl.offsetTop - filterBarHeightRef.current - 78)
        stickThresholdRef.current = threshold

        // Snap scroll to threshold NOW (synchronous, before re-render) so the
        // minHeight lock below is based on the correct position, not the full
        // scroll depth the user reached while "All" was active
        if (window.scrollY > threshold) {
          window.scrollTo(0, threshold)
          getLenisInstance()?.scrollTo(threshold, { immediate: true })
        }

        // Lock height from the corrected scroll position so the page can't
        // shrink beneath the viewport while React re-renders the filtered list
        const needed = Math.max(0, Math.min(window.scrollY, threshold) + window.innerHeight - listEl.offsetTop)
        listEl.style.minHeight = `${needed}px`
      }
    } else {
      if (listRef.current) listRef.current.style.minHeight = ''
    }
    setActiveFilters(prev => {
      if (prev.has(value)) return new Set()
      return new Set([value])
    })
  }

  const filtered = useMemo(() => {
    if (activeFilters.size === 0) return projects
    return projects.filter(p =>
      p.medium.split(',').some(m => activeFilters.has(m.trim()))
    )
  }, [projects, activeFilters])

  const byYear = useMemo(() =>
    filtered.reduce<Record<number, Project[]>>((acc, p) => {
      ;(acc[p.year] ??= []).push(p)
      return acc
    }, {}),
    [filtered]
  )

  const years = useMemo(
    () => Object.keys(byYear).map(Number).sort((a, b) => b - a),
    [byYear]
  )

  useGSAP(() => {
    const rows = gsap.utils.toArray<HTMLElement>('[data-project-row]', listRef.current)
    if (!rows.length) return

    gsap.set(rows, { opacity: 0, y: 14 })

    rows.forEach(row => {
      gsap.to(row, {
        opacity: 1,
        y: 0,
        duration: 0.45,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: row,
          start: 'top 92%',
          once: true,
        },
      })
    })
  }, { scope: listRef })

  return (
    <>
      {title && (
        <div className={styles.pageHeader}>
          <h1 className={styles.pageTitle}>{title}</h1>
        </div>
      )}

      <div ref={filterBarRef} className={styles.filterBar}>
        <div className={styles.filterGroup}>
          <button
            onClick={clearFilters}
            className={`${styles.filterPill}${activeFilters.size === 0 ? ` ${styles.filterPillActive}` : ''}`}
          >
            All
          </button>
          {filterGroups.Type.map(value => (
            <button
              key={value}
              onClick={() => toggleFilter(value)}
              className={`${styles.filterPill}${activeFilters.has(value) ? ` ${styles.filterPillActive}` : ''}`}
            >
              {value}
            </button>
          ))}
        </div>
      </div>

      <div ref={listRef} className={styles.list}>
        {years.length === 0 ? (
          <p className={styles.filterEmpty}>No projects match the selected filters.</p>
        ) : (
          years.map((year, index) => (
            <React.Fragment key={year}>
              <a
                href={`#year-${year}`}
                className={styles.yearHeader}
                style={{ top: `calc(78px + ${filterBarHeight}px + ${index} * 48px)` }}
              >
                <span className={styles.yearLabel}>{year}</span>
                <div className={styles.yearRule} aria-hidden="true" />
              </a>

              <div
                className={styles.yearGroup}
                id={`year-${year}`}
                style={{ scrollMarginTop: `${78 + filterBarHeight + (index + 1) * 48}px` }}
              >
                {byYear[year].map((project) => {
                  const useReal = hasRealImages(project.id) && project.images.length > 0
                  // Tallest slot drives the row's hover height. With slotDims
                  // capping at ROW_IMAGE_MAX_HEIGHT, this maxes out at 200 for
                  // any portrait-heavy project.
                  const rowHeight = useReal
                    ? Math.max(
                        ...project.images.map((a, i) => slotDims(i, a).height),
                        ROW_DEFAULT_HEIGHT,
                      )
                    : ROW_DEFAULT_HEIGHT
                  return (
                  <a
                    data-project-row
                    key={project.id}
                    href={`/v0/projects/${project.id}`}
                    className={styles.projectRow}
                    // border-box: total row box must include the padding so the
                    // image area = rowHeight and there's still ROW_PADDING_BOTTOM
                    // of empty space below it.
                    style={{ ['--image-row-height' as string]: `${rowHeight + ROW_PADDING_BOTTOM}px` }}
                    onClick={(e) => handleRowClick(e, project)}
                  >
                    {/* ── Metadata row ───────────────────── */}
                    <div className={styles.rowData}>
                      <span className={styles.colDate}>{formatDate(project.dateAdded)}</span>
                      <span className={styles.colTitle}>{project.title}</span>
                      <div className={styles.colMeta}>
                        <div className={styles.colRole}>
                          {project.role.split(',').map((r) => (
                            <span key={r.trim()}>{r.trim()}</span>
                          ))}
                        </div>
                        <div className={styles.colMedium}>
                          {project.medium.split(',').map((m) => (
                            <span key={m.trim()}>{m.trim()}</span>
                          ))}
                        </div>
                        <span className={styles.colClient}>{project.client}</span>
                      </div>
                    </div>

                    {/* ── Image preview row ──────────────── */}
                    <div className={styles.imageRow} aria-hidden="true">
                      {(() => {
                        // Match the PDP's image count for this project, then cap at
                        // however many slots fit in the current row width using each
                        // image's natural width. Before the viewport is measured
                        // (SSR / first paint), fall back to the PDP count.
                        const pdpCount = useReal ? project.images.length : previewCount(project.id)
                        const projectAssets: (ImageAsset | null)[] = useReal
                          ? project.images
                          : Array.from({ length: pdpCount }, () => null)
                        const slots = rowWidth !== null
                          ? Math.min(pdpCount, fitSlots(rowWidth, projectAssets))
                          : pdpCount
                        return Array.from({ length: slots }, (_, i) => {
                          const asset = useReal ? project.images[i] : null
                          // Decorative size for placeholder rows; natural ratio for real.
                          const decorative = PREVIEW_SIZES[i % PREVIEW_SIZES.length]
                          const width = slotWidth(i, asset)
                          const aspectRatio = asset && asset.w > 0 && asset.h > 0
                            ? `${asset.w} / ${asset.h}`
                            : decorative.ratio
                          return (
                            <div
                              key={i}
                              data-img-index={i}
                              className={styles.previewImage}
                              style={
                                asset
                                  ? { width, aspectRatio, position: 'relative', overflow: 'hidden' }
                                  : { width, aspectRatio }
                              }
                            >
                              {asset && (
                                <Image
                                  src={`/images/${project.id}/${asset.src}`}
                                  alt=""
                                  fill
                                  sizes={`${width}px`}
                                  style={{ objectFit: 'contain' }}
                                />
                              )}
                            </div>
                          )
                        })
                      })()}
                    </div>
                  </a>
                  )
                })}
              </div>
            </React.Fragment>
          ))
        )}
      </div>
    </>
  )
}
