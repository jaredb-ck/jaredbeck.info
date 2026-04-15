'use client'

import { useState, useEffect, useLayoutEffect, useRef } from 'react'
import { flushSync } from 'react-dom'
import Image from 'next/image'
import gsap from 'gsap'
import type { Project, ImageAsset, VideoAsset } from '@/types'
import { DETAIL_SIZES, previewCount, hasRealImages } from '../lib/preview'
import styles from './ProjectDetailPanel.module.css'

interface Props {
  project: Project
  index: number
  totalCount: number
  onBack: () => void
  onOpenComplete: () => void
  onPrev: () => void
  onNext: () => void
  direction: 'prev' | 'next' | null
}

export default function ProjectDetailPanel({
  project,
  index,
  totalCount,
  onBack,
  onOpenComplete,
  onPrev,
  onNext,
  direction,
}: Props) {
  const scrollRef      = useRef<HTMLDivElement>(null)
  const panelRef       = useRef<HTMLDivElement>(null)
  const titleRef       = useRef<HTMLDivElement>(null)
  const indicatorRef   = useRef<HTMLDivElement>(null)
  const thumbRef       = useRef<HTMLDivElement>(null)
  const targetXRef     = useRef(0)
  const isTransitioning = useRef(false)
  const directionRef    = useRef<'prev' | 'next' | null>(null)
  const exitTlRef       = useRef<gsap.core.Timeline | null>(null)
  const enterTlRef      = useRef<gsap.core.Timeline | null>(null)

  // Overscroll-to-navigate refs — wheel handler lives in an empty-deps effect,
  // so it reads live props/state from refs instead of stale closures.
  const onNextRef       = useRef(onNext)
  const onPrevRef       = useRef(onPrev)
  const indexRef        = useRef(index)
  const totalCountRef   = useRef(totalCount)
  const overscrollRef   = useRef(0)      // signed accumulator: +right, -left
  const armPrevRef      = useRef(false)  // disarmed on fresh project until user scrolls right
  const navFiredRef     = useRef(false)  // latch so one gesture can't fire nav twice

  // Pixels of sustained overshoot past an edge before nav fires
  const OVERSCROLL_THRESHOLD = 800

  useEffect(() => {
    onNextRef.current     = onNext
    onPrevRef.current     = onPrev
    indexRef.current      = index
    totalCountRef.current = totalCount
  })

  // displayProject lags behind the prop — content renders from here
  // while the header (nav counter) updates immediately from index/project
  const [displayProject, setDisplayProject] = useState(project)
  const [isExpanded, setIsExpanded] = useState(false)

  const useReal = hasRealImages(displayProject.id) && displayProject.images.length > 0

  // Build the ordered list of scroll slots. First video gets inserted at the
  // 6th position (index 5) so it lands mid-scroll rather than at the end;
  // any additional videos fall through to the tail. Placeholder projects
  // continue to render decorative boxes.
  type Slot =
    | { kind: 'image'; asset: ImageAsset }
    | { kind: 'video'; asset: VideoAsset }
  const VIDEO_SLOT = 5
  const slots: Slot[] = []
  if (useReal) {
    const imgs = displayProject.images
    const vids = displayProject.videos
    imgs.forEach((img, i) => {
      if (i === VIDEO_SLOT && vids.length > 0) {
        slots.push({ kind: 'video', asset: vids[0] })
      }
      slots.push({ kind: 'image', asset: img })
    })
    // Video slot falls off the end — append so we never lose the video.
    if (vids.length > 0 && imgs.length <= VIDEO_SLOT) {
      slots.push({ kind: 'video', asset: vids[0] })
    }
    // Any extra videos append at the end in order.
    for (let v = 1; v < vids.length; v++) {
      slots.push({ kind: 'video', asset: vids[v] })
    }
  }
  const count = useReal ? slots.length : previewCount(displayProject.id)

  // Lazy-load: only mount <Image> for wrappers that have entered (or are
  // within rootMargin of) the horizontal scrollRef viewport. First two are
  // always mounted so the panel never opens to an empty cover.
  const [visibleIndices, setVisibleIndices] = useState<Set<number>>(() => new Set([0, 1]))

  // Open animation — panel rises up, content staggers in top-to-bottom
  useLayoutEffect(() => {
    const panelEl = panelRef.current
    if (!panelEl) return

    const panelBg  = panelEl.querySelector<HTMLElement>('[data-panel-bg]')
    const headerEl = panelEl.querySelector<HTMLElement>('[data-detail-header]')
    const titleEl  = titleRef.current
    const scrollEl = scrollRef.current
    const imgEls   = scrollEl
      ? Array.from(scrollEl.querySelectorAll<HTMLElement>('[data-scroll-img]'))
      : []

    if (panelBg)  gsap.set(panelBg,  { autoAlpha: 0 })
    if (headerEl) gsap.set(headerEl, { autoAlpha: 0, y: 10 })
    if (titleEl)  gsap.set(titleEl,  { autoAlpha: 0, y: 10 })
    gsap.set(imgEls, { autoAlpha: 0, y: 10 })
    gsap.set(panelEl, { y: 20 })

    const tl = gsap.timeline({ onComplete: onOpenComplete })

    tl.to(panelEl,  { y: 0,                          duration: 0.55, ease: 'expo.out'   }, 0)
    if (panelBg)  tl.to(panelBg,  { autoAlpha: 1,   duration: 0.4,  ease: 'power2.out' }, 0)
    if (headerEl) tl.to(headerEl, { autoAlpha: 1, y: 0, duration: 0.3,  ease: 'power2.out' }, 0.15)
    if (titleEl)  tl.to(titleEl,  { autoAlpha: 1, y: 0, duration: 0.3,  ease: 'power2.out' }, 0.22)
    if (imgEls.length > 0) {
      tl.to(imgEls, { autoAlpha: 1, y: 0, duration: 0.35, stagger: 0.025, ease: 'power2.out' }, 0.3)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Image scroll height + wheel redirect + scroll indicator
  useEffect(() => {
    const panel = panelRef.current
    const el    = scrollRef.current
    if (!panel || !el) return

    // Write indicator geometry directly to the DOM. No React state on the scroll
    // path — setState during a smooth-scroll tween causes per-frame re-renders
    // of all 15 image wrappers, which is the hitch you saw.
    let rafPending = false
    const writeIndicator = () => {
      rafPending = false
      const indicator = indicatorRef.current
      const thumb     = thumbRef.current
      if (!indicator || !thumb) return
      const ratio = el.scrollWidth > el.clientWidth ? el.clientWidth / el.scrollWidth : 1
      if (ratio >= 1) {
        indicator.style.display = 'none'
        return
      }
      indicator.style.display = ''
      const scrollMax = el.scrollWidth - el.clientWidth
      const progress  = scrollMax > 0 ? el.scrollLeft / scrollMax : 0
      const widthPx   = Math.max(12, ratio * 120)
      thumb.style.width = `${widthPx}px`
      thumb.style.left  = `${progress * (120 - widthPx)}px`
    }
    const updateIndicator = () => {
      if (rafPending) return
      rafPending = true
      requestAnimationFrame(writeIndicator)
    }

    // Height is now driven by CSS (imageScroll is position:absolute, inset:0
    // on the panel). Just refresh the indicator on mount + on resize.
    writeIndicator()
    const onResize = () => writeIndicator()
    window.addEventListener('resize', onResize)

    targetXRef.current = el.scrollLeft
    el.addEventListener('scroll', updateIndicator, { passive: true })

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault()
      if (navFiredRef.current || isTransitioning.current) return

      const delta         = e.deltaY + e.deltaX
      const maxScroll     = el.scrollWidth - el.clientWidth
      const newTarget     = targetXRef.current + delta
      const clampedTarget = Math.max(0, Math.min(newTarget, maxScroll))
      // Portion of delta that was refused by clamping: >0 at right edge, <0 at left
      const refused       = newTarget - clampedTarget

      // If the container isn't scrollable yet (layout race on first paint),
      // every delta would otherwise land in `refused` and fire next project.
      // Skip overscroll accumulation until real scrollable width exists.
      if (maxScroll <= 0) {
        targetXRef.current = 0
        return
      }

      // Arm prev trigger only after user has scrolled meaningfully right — prevents
      // a stray leftward flick on a freshly loaded project from firing prev
      if (clampedTarget > 20) armPrevRef.current = true

      if (refused > 0) {
        // Accumulate right overscroll (clear any leftover left-overscroll first)
        overscrollRef.current = Math.max(overscrollRef.current, 0) + refused
        if (
          overscrollRef.current > OVERSCROLL_THRESHOLD &&
          indexRef.current < totalCountRef.current - 1
        ) {
          navFiredRef.current   = true
          overscrollRef.current = 0
          onNextRef.current()
        }
      } else if (refused < 0 && armPrevRef.current) {
        overscrollRef.current = Math.min(overscrollRef.current, 0) + refused
        if (
          -overscrollRef.current > OVERSCROLL_THRESHOLD &&
          indexRef.current > 0
        ) {
          navFiredRef.current   = true
          overscrollRef.current = 0
          onPrevRef.current()
        }
      } else {
        // Scroll is moving within bounds — any previous overscroll is cancelled
        overscrollRef.current = 0
      }

      targetXRef.current = clampedTarget
      gsap.to(el, { scrollLeft: targetXRef.current, duration: 1.1, ease: 'power3.out', overwrite: true })
    }
    panel.addEventListener('wheel', handleWheel, { passive: false })

    return () => {
      window.removeEventListener('resize', onResize)
      el.removeEventListener('scroll', updateIndicator)
      panel.removeEventListener('wheel', handleWheel)
      gsap.killTweensOf(el)
    }
  }, [])

  // Exit: fires when the incoming project prop changes
  useEffect(() => {
    // Skip if the content already matches (initial mount + Strict Mode double-invoke)
    if (project.id === displayProject.id) return

    const titleEl  = titleRef.current
    const scrollEl = scrollRef.current
    if (!titleEl || !scrollEl) return

    // Kill existing timelines with .kill() — NOT killTweensOf — so stale
    // onComplete callbacks never fire and corrupt displayProject state.
    exitTlRef.current?.kill()
    enterTlRef.current?.kill()
    // Also kill any in-flight wheel-driven scrollLeft tween (1.1s) — if it's
    // still animating after the transition settles it would drag the scroll
    // position back toward the user's last wheel target, causing the visible
    // "jump" the user reported on both next and prev nav.
    gsap.killTweensOf(scrollEl, 'scrollLeft')
    isTransitioning.current = true
    setIsExpanded(false)

    // Capture direction so the async onComplete can use it for the enter position
    directionRef.current = direction
    // next: new content enters from right (exits left, enters from right)
    // prev / null: new content enters from left (exits right, enters from left)
    const exitX  = direction === 'next' ? -40 :  40
    const enterX = direction === 'next' ?  40 : -40

    const tl = gsap.timeline({
      onComplete: () => {
        gsap.set(titleEl,  { x: enterX })
        gsap.set(scrollEl, { x: enterX * 2 })
        // Commit the new project synchronously so the DOM has the new
        // scrollWidth before we set scrollLeft — this is what avoids the
        // pre-paint flash the user saw on both directions.
        flushSync(() => setDisplayProject(project))
        // next → land at the start (scrollLeft = 0).
        // prev → land at the end (scrollLeft = maxScroll of the new project).
        const scrollMax = scrollEl.scrollWidth - scrollEl.clientWidth
        const target    = directionRef.current === 'prev' ? Math.max(0, scrollMax) : 0
        scrollEl.scrollLeft = target
        targetXRef.current  = target
      },
    })
    exitTlRef.current = tl

    tl.to(titleEl,  { opacity: 0, x: exitX,     duration: 0.22, ease: 'power2.in' }, 0)
    tl.to(scrollEl, { opacity: 0, x: exitX * 2, duration: 0.25, ease: 'power2.in' }, 0)
  }, [project]) // eslint-disable-line react-hooks/exhaustive-deps

  // Recalculate scroll indicator whenever displayed project changes (different image count = different scrollWidth)
  useEffect(() => {
    const el        = scrollRef.current
    const indicator = indicatorRef.current
    const thumb     = thumbRef.current
    if (el && indicator && thumb) {
      const ratio = el.scrollWidth > el.clientWidth ? el.clientWidth / el.scrollWidth : 1
      if (ratio >= 1) {
        indicator.style.display = 'none'
      } else {
        indicator.style.display = ''
        const scrollMax = el.scrollWidth - el.clientWidth
        const progress  = scrollMax > 0 ? el.scrollLeft / scrollMax : 0
        const widthPx   = Math.max(12, ratio * 120)
        thumb.style.width = `${widthPx}px`
        thumb.style.left  = `${progress * (120 - widthPx)}px`
      }
    }

    // Reset overscroll state so each new project starts clean — prevents
    // trackpad momentum from the previous project spilling a second nav fire.
    overscrollRef.current = 0
    armPrevRef.current    = false
    navFiredRef.current   = false
  }, [displayProject])

  // Lazy-load observer — scoped to the horizontal scrollRef so visibility is
  // computed against the scroller's clip box, not the document viewport.
  // (Native loading="lazy" measures against the document and would treat
  // every image as "visible" since they all sit within the panel's bounds.)
  useEffect(() => {
    if (!useReal) return
    const root = scrollRef.current
    if (!root) return

    // Reset on project change so the next project doesn't inherit the
    // previous one's "already loaded" indices.
    setVisibleIndices(new Set([0, 1]))

    const wrappers = Array.from(root.querySelectorAll<HTMLElement>('[data-scroll-img]'))
    if (wrappers.length === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        setVisibleIndices(prev => {
          let changed = false
          const next = new Set(prev)
          for (const entry of entries) {
            if (!entry.isIntersecting) continue
            const i = Number(entry.target.getAttribute('data-scroll-img'))
            if (!next.has(i)) { next.add(i); changed = true }
          }
          return changed ? next : prev
        })
      },
      { root, rootMargin: '0px 400px 0px 400px' }
    )

    wrappers.forEach(w => observer.observe(w))
    return () => observer.disconnect()
  }, [displayProject.id, useReal, count])

  // Enter: fires when displayProject is swapped in
  useEffect(() => {
    if (!isTransitioning.current) return

    const titleEl  = titleRef.current
    const scrollEl = scrollRef.current
    if (!titleEl || !scrollEl) return

    const tl = gsap.timeline({
      onComplete: () => { isTransitioning.current = false },
    })
    enterTlRef.current = tl

    tl.to(titleEl,  { opacity: 1, x: 0, duration: 0.32, ease: 'power3.out' }, 0)
    tl.to(scrollEl, { opacity: 1, x: 0, duration: 0.38, ease: 'power3.out' }, 0.04)
  }, [displayProject]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div ref={panelRef} data-panel className={styles.panel}>
      <div data-panel-bg className={styles.panelBg} />

      <header data-detail-header className={styles.header}>
        <button onClick={onBack} className={styles.back}>
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <path d="M2.66663 12.6667V6.66667C2.66663 6.45556 2.71396 6.25556 2.80863 6.06667C2.90329 5.87778 3.03374 5.72222 3.19996 5.6L7.19996 2.6C7.43329 2.42222 7.69996 2.33334 7.99996 2.33334C8.29996 2.33334 8.56663 2.42222 8.79996 2.6L12.8 5.6C12.9666 5.72222 13.0973 5.87778 13.192 6.06667C13.2866 6.25556 13.3337 6.45556 13.3333 6.66667V12.6667C13.3333 13.0333 13.2026 13.3473 12.9413 13.6087C12.68 13.87 12.3662 14.0004 12 14H9.99996C9.81107 14 9.65285 13.936 9.52529 13.808C9.39774 13.68 9.33374 13.5218 9.33329 13.3333V10C9.33329 9.81111 9.26929 9.65289 9.14129 9.52534C9.01329 9.39778 8.85507 9.33378 8.66663 9.33334H7.33329C7.1444 9.33334 6.98618 9.39734 6.85863 9.52534C6.73107 9.65334 6.66707 9.81156 6.66663 10V13.3333C6.66663 13.5222 6.60263 13.6807 6.47463 13.8087C6.34663 13.9367 6.1884 14.0004 5.99996 14H3.99996C3.63329 14 3.31951 13.8696 3.05863 13.6087C2.79774 13.3478 2.66707 13.0338 2.66663 12.6667Z" fill="currentColor"/>
          </svg>
          Home
        </button>
      </header>

      <div ref={scrollRef} className={styles.imageScroll}>
        {/* First "page" of the horizontal scroll: title + description + meta */}
        <div ref={titleRef} data-detail-title className={`${styles.titleBlock}${isExpanded ? ` ${styles.titleBlockExpanded}` : ''}`}>
          <div className={styles.titleLeft}>
            <h1 className={styles.title}>{displayProject.title}</h1>
            <p className={styles.description}>{displayProject.description}</p>
            <button
              className={styles.moreBtn}
              onClick={() => setIsExpanded(v => !v)}
            >
              {isExpanded ? 'Less' : 'More'}
            </button>
          </div>
          <div className={styles.meta}>
            <div className={`${styles.metaCol} ${styles.metaColYear}`}>
              <span className={styles.metaLabel}>Year</span>
              <span className={styles.metaValue}>{displayProject.year}</span>
            </div>
            <div className={`${styles.metaCol} ${styles.metaColMedium}`}>
              <span className={styles.metaLabel}>Medium</span>
              {displayProject.medium.split(',').map(m => (
                <span key={m.trim()} className={styles.metaValue}>{m.trim()}</span>
              ))}
            </div>
            <div className={`${styles.metaCol} ${styles.metaColRole}`}>
              <span className={styles.metaLabel}>Role</span>
              {displayProject.role.split(',').map(r => (
                <span key={r.trim()} className={styles.metaValue}>{r.trim()}</span>
              ))}
            </div>
            {displayProject.client && (
              <div className={`${styles.metaCol} ${styles.metaColClient}`}>
                <span className={styles.metaLabel}>Client</span>
                <span className={styles.metaValue}>{displayProject.client}</span>
              </div>
            )}
            <div className={`${styles.metaCol} ${styles.metaColCredits}`}>
              <span className={styles.metaLabel}>Credits</span>
              {displayProject.credits.length > 0 ? (
                displayProject.credits.map((c, i) => (
                  <div key={i} className={styles.metaItem}>
                    <span className={styles.metaValue}>{c.name}</span>
                    {c.role && <span className={styles.metaCredit}>{c.role}</span>}
                  </div>
                ))
              ) : (
                <span className={styles.metaValue}>—</span>
              )}
            </div>
          </div>
        </div>

        {Array.from({ length: count }, (_, i) => {
          const slot: Slot | null = useReal ? slots[i] ?? null : null
          const imageAsset: ImageAsset | null = slot?.kind === 'image' ? slot.asset : null
          const videoAsset: VideoAsset | null = slot?.kind === 'video' ? slot.asset : null
          const asset = imageAsset ?? videoAsset
          // Use the asset's intrinsic ratio when available so portraits stay
          // portrait and landscapes stay landscape — never crop. Fall back to
          // the decorative DETAIL_SIZES cycle for placeholder boxes.
          const aspectRatio = asset && asset.w > 0 && asset.h > 0
            ? `${asset.w} / ${asset.h}`
            : DETAIL_SIZES[i % DETAIL_SIZES.length].ratio
          // Priority window = first 2 + last 2 slots. Eager-load covers the
          // two possible arrival positions: scrollLeft=0 (fresh open / next)
          // and scrollLeft=maxScroll (prev). Anything in between is
          // IntersectionObserver-driven lazy load.
          const PRIORITY_EDGE = 2
          const isPriority = i < PRIORITY_EDGE || i >= count - PRIORITY_EDGE
          const shouldLoad = !!asset && (visibleIndices.has(i) || isPriority)
          return (
            <div
              key={i}
              data-scroll-img={i}
              className={styles.scrollImage}
              style={
                asset
                  ? { aspectRatio, position: 'relative', overflow: 'hidden' }
                  : { aspectRatio }
              }
            >
              {shouldLoad && imageAsset && (
                <Image
                  src={`/images/${displayProject.id}/${imageAsset.src}`}
                  alt={`${displayProject.title} — ${i + 1}`}
                  fill
                  sizes="(max-width: 768px) 90vw, 50vw"
                  style={{ objectFit: 'contain' }}
                  priority={isPriority}
                />
              )}
              {shouldLoad && videoAsset && (
                <video
                  src={`/videos/${displayProject.id}/${videoAsset.src}`}
                  autoPlay
                  loop
                  muted
                  playsInline
                  preload="metadata"
                  style={{ width: '100%', height: '100%', objectFit: 'contain', background: '#000' }}
                />
              )}
            </div>
          )
        })}
      </div>

      <div
        ref={indicatorRef}
        className={styles.scrollIndicator}
        style={{ display: 'none' }}
      >
        <div ref={thumbRef} className={styles.scrollThumb} />
      </div>

      {/* Pagination pinned to the bottom-right of the panel. Floats above the
          horizontal scroll so it's always reachable regardless of position. */}
      <div className={styles.projectNavFixed}>
        <button
          className={styles.navArrow}
          onClick={onPrev}
          disabled={index === 0}
          aria-label="Previous project"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <path d="M7.5 9.5L4 6L7.5 2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <span className={styles.projectNum}>
          {String(index + 1).padStart(2, '0')} / {String(totalCount).padStart(2, '0')}
        </span>
        <button
          className={styles.navArrow}
          onClick={onNext}
          disabled={index === totalCount - 1}
          aria-label="Next project"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <path d="M4.5 2.5L8 6L4.5 9.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>
    </div>
  )
}
