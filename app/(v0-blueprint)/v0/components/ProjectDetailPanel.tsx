'use client'

import { useState, useEffect, useLayoutEffect, useRef, useCallback } from 'react'
import { flushSync } from 'react-dom'
import Image from 'next/image'
import gsap from 'gsap'
import type { Project, ImageAsset, VideoAsset } from '@/types'
import { videoCache, demandLoadVideo } from '@/app/components/Preloader/usePreloader'
import styles from './ProjectDetailPanel.module.css'

interface Props {
  project: Project
  index: number
  totalCount: number
  projects: Project[]
  onBack: () => void
  onOpenComplete: () => void
  onPrev: () => void
  onNext: () => void
  onGoToProject: (index: number) => void
  direction: 'prev' | 'next' | null
}

function formatMenuDate(dateStr: string): string {
  const d = new Date(dateStr)
  const month = d.toLocaleDateString('en-US', { month: 'short', timeZone: 'UTC' })
  return `${month} ${d.getUTCFullYear()}`
}

/**
 * Tier 3 on-demand video loader. Checks the video cache first,
 * then fetches the full file as a blob if not cached. Shows a
 * dark placeholder until the video is ready to play.
 */
function LazyVideo({ src }: { src: string }) {
  const [videoSrc, setVideoSrc] = useState<string | null>(
    () => videoCache.get(src) ?? null
  )

  useEffect(() => {
    if (videoSrc) return
    let cancelled = false
    demandLoadVideo(src).then((blobUrl) => {
      if (cancelled) return
      setVideoSrc(blobUrl ?? src)
    })
    return () => { cancelled = true }
  }, [src, videoSrc])

  if (!videoSrc) {
    // Empty placeholder — the parent .scrollImage shimmer shows through
    return <div style={{ width: '100%', height: '100%' }} />
  }

  return (
    <video
      src={videoSrc}
      autoPlay
      loop
      muted
      playsInline
      preload="auto"
      style={{ width: '100%', height: '100%', objectFit: 'contain', background: '#000' }}
    />
  )
}

export default function ProjectDetailPanel({
  project,
  index,
  totalCount,
  projects,
  onBack,
  onOpenComplete,
  onPrev,
  onNext,
  onGoToProject,
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
  // True when nav was initiated by scroll overscroll (versus a pagination click).
  // Scroll-triggered prev lands the new project at its end; clicks always
  // land at the start. Set in the wheel handler, read + cleared in the
  // [project] effect.
  const scrollTriggeredNavRef = useRef(false)

  // Pixels of sustained overshoot past an edge before nav fires
  const OVERSCROLL_THRESHOLD = 800

  useEffect(() => {
    onNextRef.current     = onNext
    onPrevRef.current     = onPrev
    indexRef.current      = index
    totalCountRef.current = totalCount
  })

  // ─── Project menu state ────────────────────────────────────────
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const menuScrollRef = useRef<HTMLDivElement>(null)
  const menuThumbRef = useRef<HTMLDivElement>(null)
  const pillRef = useRef<HTMLDivElement>(null)
  const menuOpenRef = useRef(false)
  const menuAnimRef = useRef<gsap.core.Timeline | null>(null)

  useEffect(() => { menuOpenRef.current = menuOpen }, [menuOpen])

  const openMenu = useCallback(() => {
    setMenuOpen(true)
  }, [])

  const closeMenu = useCallback(() => {
    setMenuOpen(false)
  }, [])

  // Cache the pill's collapsed width so the close animation doesn't
  // need to do any measurement dance (which causes flicker).
  const collapsedWidthRef = useRef(0)
  const hasAnimatedRef = useRef(false)

  // Animate menu on open/close — useLayoutEffect so the first frame
  // of the animation is painted (no single-frame flash between state
  // change and animation start).
  useLayoutEffect(() => {
    const menu = menuRef.current
    const pill = pillRef.current
    if (!menu || !pill) return

    // Skip the close branch on initial mount and during project transitions —
    // menu is already hidden via inline style={{ display: 'none' }}, and
    // project transitions call setMenuOpen(false) which shouldn't trigger
    // the close animation.
    if (!menuOpen && !hasAnimatedRef.current) return
    if (!menuOpen && isTransitioning.current) {
      gsap.set(menu, { display: 'none', clearProps: 'height,autoAlpha' })
      gsap.set(pill, { clearProps: 'width,borderRadius,overflow,paddingTop' })
      return
    }
    hasAnimatedRef.current = true

    menuAnimRef.current?.kill()

    if (menuOpen) {
      // Capture collapsed pill width before expanding
      collapsedWidthRef.current = pill.offsetWidth

      // Clip the container during animation so content doesn't spill
      gsap.set(pill, { overflow: 'hidden' })
      // Briefly show menu to measure expanded pill width
      gsap.set(menu, { display: 'flex', visibility: 'hidden' })
      const expandedW = pill.offsetWidth
      const expandedH = menu.offsetHeight

      // Set start state: menu at zero height, pill at collapsed width
      gsap.set(menu, { visibility: 'visible', autoAlpha: 0, height: 0 })
      gsap.set(pill, { width: collapsedWidthRef.current })

      const tl = gsap.timeline({
        onComplete: () => {
          // Clear GSAP inline styles — remove overflow: hidden from
          // the container so the menu's CSS overflow-y: auto can scroll
          gsap.set(menu, { clearProps: 'height,visibility,autoAlpha' })
          gsap.set(menu, { display: 'flex', opacity: 1, visibility: 'visible' })
          pill.style.removeProperty('overflow')
          gsap.set(pill, { clearProps: 'width' })
          const activeItem = menu.querySelector('[data-menu-item-active]')
          if (activeItem) activeItem.scrollIntoView({ block: 'nearest' })
        },
      })
      tl.to(pill, { width: expandedW, borderRadius: 12, duration: 0.35, ease: 'power2.out' }, 0)
      tl.to(menu, { autoAlpha: 1, height: expandedH, duration: 0.35, ease: 'power2.out' }, 0.04)
      menuAnimRef.current = tl
    } else {
      menu.scrollTop = 0
      const currentW = pill.offsetWidth
      const targetW = collapsedWidthRef.current || currentW

      // Lock the pill width and clip during close
      gsap.set(pill, { width: currentW, overflow: 'hidden' })

      const tl = gsap.timeline({
        onComplete: () => {
          gsap.set(menu, { display: 'none', clearProps: 'height,autoAlpha' })
          gsap.set(pill, { clearProps: 'width,borderRadius,overflow,paddingTop' })
        },
      })
      tl.to(menu, { autoAlpha: 0, height: 0, duration: 0.3, ease: 'power2.inOut' }, 0)
      tl.to(pill, { width: targetW, borderRadius: 100, paddingTop: 0, duration: 0.3, ease: 'power2.inOut' }, 0)
      menuAnimRef.current = tl
    }
  }, [menuOpen])

  // Escape key closes menu
  useEffect(() => {
    if (!menuOpen) return
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') closeMenu() }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [menuOpen, closeMenu])

  // displayProject lags behind the prop — content renders from here
  // while the header (nav counter) updates immediately from index/project
  const [displayProject, setDisplayProject] = useState(project)
  const [isExpanded, setIsExpanded] = useState(false)

  // Build the ordered list of scroll slots. Opening sequence: first image,
  // then the first video. Remaining videos are spaced evenly across the
  // remaining image stream so they never cluster at the start or end.
  type Slot =
    | { kind: 'image'; asset: ImageAsset }
    | { kind: 'video'; asset: VideoAsset }
  const LEAD_IMAGES = 1
  const slots: Slot[] = []
  {
    const imgs = displayProject.images
    const vids = displayProject.videos
    // Lead-in: first image, then the first video.
    for (let li = 0; li < Math.min(LEAD_IMAGES, imgs.length); li++) {
      slots.push({ kind: 'image', asset: imgs[li] })
    }
    if (vids.length > 0) {
      slots.push({ kind: 'video', asset: vids[0] })
    }
    // Distribute remaining videos evenly across the remaining image stream.
    const remainImgs = imgs.slice(LEAD_IMAGES)
    const remainVids = vids.slice(1)
    if (remainVids.length === 0) {
      for (const img of remainImgs) slots.push({ kind: 'image', asset: img })
    } else {
      const stride = Math.ceil(remainImgs.length / (remainVids.length + 1))
      let vi = 0
      for (let idx = 0; idx < remainImgs.length; idx++) {
        slots.push({ kind: 'image', asset: remainImgs[idx] })
        if (vi < remainVids.length && (idx + 1) % stride === 0) {
          slots.push({ kind: 'video', asset: remainVids[vi++] })
        }
      }
      while (vi < remainVids.length) {
        slots.push({ kind: 'video', asset: remainVids[vi++] })
      }
    }
  }
  const count = slots.length

  // Lazy-load: only mount <Image> for wrappers that have entered (or are
  // within rootMargin of) the horizontal scrollRef viewport. First two are
  // always mounted so the panel never opens to an empty cover.
  const [visibleIndices, setVisibleIndices] = useState<Set<number>>(() => new Set([0, 1]))

  // Set initial invisible state — the parent V0App drives the entrance animation
  // on a coordinated timeline with the homepage recession.
  useLayoutEffect(() => {
    const panelEl = panelRef.current
    if (!panelEl) return

    const panelBg  = panelEl.querySelector<HTMLElement>('[data-panel-bg]')
    const headerEl = panelEl.querySelector<HTMLElement>('[data-detail-header]')
    const titleEl  = titleRef.current
    const imgEls   = scrollRef.current
      ? Array.from(scrollRef.current.querySelectorAll<HTMLElement>('[data-scroll-img]'))
      : []

    gsap.set(panelEl,  { scale: 1.015, autoAlpha: 0 })
    if (panelBg)  gsap.set(panelBg,  { autoAlpha: 0 })
    if (headerEl) gsap.set(headerEl, { autoAlpha: 0, y: 8 })
    if (titleEl)  gsap.set(titleEl,  { autoAlpha: 0, y: 8 })
    gsap.set(imgEls, { autoAlpha: 0, y: 6 })
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

    // Lenis sets html { overflow: hidden } at init and doesn't restore it
    // when stopped. On mobile, that blocks ALL scroll — even inside a
    // fixed-position panel with overflow-y: auto. Force it back to auto
    // when the panel mounts at mobile width.
    const MOBILE_BREAKPOINT = 900
    const isMobile = () => window.innerWidth <= MOBILE_BREAKPOINT
    const htmlEl = document.documentElement
    let originalHtmlOverflow = ''
    const syncHtmlOverflow = () => {
      if (isMobile()) {
        if (!originalHtmlOverflow) originalHtmlOverflow = htmlEl.style.overflow
        htmlEl.style.overflow = 'auto'
      } else if (originalHtmlOverflow !== '') {
        htmlEl.style.overflow = originalHtmlOverflow
        originalHtmlOverflow = ''
      }
    }
    syncHtmlOverflow()

    targetXRef.current = el.scrollLeft
    el.addEventListener('scroll', updateIndicator, { passive: true })

    const handleWheel = (e: WheelEvent) => {
      // At ≤900px the layout is a native vertical scroll — let the browser
      // handle it. Don't preventDefault, don't hijack for horizontal.
      if (isMobile()) return
      if (menuOpenRef.current) { e.stopPropagation(); return }
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
          navFiredRef.current        = true
          overscrollRef.current      = 0
          scrollTriggeredNavRef.current = true
          onNextRef.current()
        }
      } else if (refused < 0 && armPrevRef.current) {
        overscrollRef.current = Math.min(overscrollRef.current, 0) + refused
        if (
          -overscrollRef.current > OVERSCROLL_THRESHOLD &&
          indexRef.current > 0
        ) {
          navFiredRef.current        = true
          overscrollRef.current      = 0
          scrollTriggeredNavRef.current = true
          onPrevRef.current()
        }
      } else {
        // Scroll is moving within bounds — any previous overscroll is cancelled
        overscrollRef.current = 0
      }

      targetXRef.current = clampedTarget
      gsap.to(el, { scrollLeft: targetXRef.current, duration: 1.1, ease: 'power3.out', overwrite: true })
    }
    // Dynamically attach/detach the non-passive wheel handler based on
    // viewport width. At ≤900px the layout is vertical native scroll — a
    // non-passive wheel listener blocks the compositor thread even when the
    // handler doesn't call preventDefault, killing scroll on resize.
    //
    // At mobile we also need to stop wheel events from bubbling to Lenis's
    // non-passive listener on window. Lenis.stop() leaves its listeners
    // attached — they don't call preventDefault when stopped, but the
    // passive:false registration still stalls the compositor. Calling
    // stopPropagation on the panel keeps the event local so the browser's
    // default scroll action fires on imageScroll unblocked.
    let wheelAttached = false
    let mobileWheelAttached = false
    const stopBubble = (e: WheelEvent) => { e.stopPropagation() }
    // Same as stopBubble but for touch events — Lenis.stop() leaves its
    // non-passive touchmove listener on window, which stalls the compositor
    // even when Lenis isn't calling preventDefault. Stopping propagation
    // on the panel keeps touch events local so native scroll works.
    const stopTouchBubble = (e: TouchEvent) => { e.stopPropagation() }
    let touchAttached = false
    const syncWheel = () => {
      if (!isMobile()) {
        // Desktop: hijack wheel for horizontal scroll
        if (!wheelAttached) {
          panel.addEventListener('wheel', handleWheel, { passive: false })
          wheelAttached = true
        }
        if (mobileWheelAttached) {
          panel.removeEventListener('wheel', stopBubble)
          mobileWheelAttached = false
        }
      } else {
        // Mobile: just block bubbling so Lenis can't stall the compositor
        if (wheelAttached) {
          panel.removeEventListener('wheel', handleWheel)
          wheelAttached = false
        }
        if (!mobileWheelAttached) {
          panel.addEventListener('wheel', stopBubble, { passive: true })
          mobileWheelAttached = true
        }
      }
      // Block touch event bubbling at all widths — PDP is a fixed overlay
      // with Lenis stopped, so touch events should never reach Lenis.
      if (!touchAttached) {
        panel.addEventListener('touchstart', stopTouchBubble, { passive: true })
        panel.addEventListener('touchmove', stopTouchBubble, { passive: true })
        touchAttached = true
      }
    }
    syncWheel()
    const onResizeFull = () => {
      onResize()
      syncWheel()
      syncHtmlOverflow()
    }
    window.addEventListener('resize', onResizeFull)

    return () => {
      window.removeEventListener('resize', onResizeFull)
      el.removeEventListener('scroll', updateIndicator)
      panel.removeEventListener('wheel', handleWheel)
      panel.removeEventListener('wheel', stopBubble)
      panel.removeEventListener('touchstart', stopTouchBubble)
      panel.removeEventListener('touchmove', stopTouchBubble)
      gsap.killTweensOf(el)
      // Restore html overflow so Lenis can take over again on close
      if (originalHtmlOverflow !== '') {
        htmlEl.style.overflow = originalHtmlOverflow
      }
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
    setMenuOpen(false)

    // Capture direction so the async onComplete can use it for the enter position.
    directionRef.current = direction
    // Capture + reset the scroll-trigger flag. Only a scroll-overscroll-driven
    // prev should land the new project at its end — clicking the prev
    // pagination button should always start at the beginning.
    const wasScrollTriggered = scrollTriggeredNavRef.current
    scrollTriggeredNavRef.current = false
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
        // next (or any click) → land at the start (scrollLeft = 0).
        // scroll-triggered prev → land at the end (scrollLeft = maxScroll).
        const scrollMax = scrollEl.scrollWidth - scrollEl.clientWidth
        const landAtEnd = directionRef.current === 'prev' && wasScrollTriggered
        const target    = landAtEnd ? Math.max(0, scrollMax) : 0
        scrollEl.scrollLeft = target
        targetXRef.current  = target
        // At mobile, imageScroll is the vertical scroll container
        // (overflow-y: scroll). Reset both scrollTop (vertical/mobile)
        // and the panel's scrollTop to catch either layout.
        scrollEl.scrollTop = 0
        if (panelRef.current) panelRef.current.scrollTop = 0
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
  }, [displayProject.id, count])

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
        {displayProject.url && (
          <a
            href={displayProject.url}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.urlButton}
          >
            View project
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <path d="M9.12254 6.17037H5.16274L5.17158 5.17158H10.8284V10.8284L9.82964 10.8373V6.87747L5.52513 11.182L4.81802 10.4749L9.12254 6.17037Z" fill="currentColor"/>
            </svg>
          </a>
        )}
      </header>

      <div ref={scrollRef} className={styles.imageScroll}>
        {/* First "page" of the horizontal scroll: title + description + meta */}
        <div ref={titleRef} data-detail-title className={`${styles.titleBlock}${isExpanded ? ` ${styles.titleBlockExpanded}` : ''}`}>
          <div className={styles.titleGroup}>
            {displayProject.client && (
              <span className={styles.clientEyebrow}>{displayProject.client}</span>
            )}
            <h1 className={styles.title}>{displayProject.title}</h1>
          </div>
          <div className={styles.titleLeft}>
            <p className={styles.description}>{displayProject.description}</p>
            {(() => {
              // Only surface the case study section if at least one field is
              // actually populated — placeholder-only or entirely-empty case
              // studies shouldn't show the More button at all.
              const cs = displayProject.caseStudy
              const hasContent = !!(
                cs?.problem?.trim() ||
                cs?.process?.trim() ||
                cs?.outcome?.trim()
              )
              if (!hasContent) return null
              return (
                <>
                  <button
                    className={styles.moreBtn}
                    onClick={() => setIsExpanded(v => !v)}
                    aria-expanded={isExpanded}
                  >
                    {isExpanded ? 'Less' : 'More'}
                  </button>
                  {isExpanded && (
                    <div className={styles.caseStudy}>
                      {cs.problem?.trim() && (
                        <div className={styles.caseStudySection}>
                          <span className={styles.metaLabel}>Problem</span>
                          <p className={styles.caseStudyBody}>{cs.problem}</p>
                        </div>
                      )}
                      {cs.process?.trim() && (
                        <div className={styles.caseStudySection}>
                          <span className={styles.metaLabel}>Process</span>
                          <p className={styles.caseStudyBody}>{cs.process}</p>
                        </div>
                      )}
                      {cs.outcome?.trim() && (
                        <div className={styles.caseStudySection}>
                          <span className={styles.metaLabel}>Outcome</span>
                          <p className={styles.caseStudyBody}>{cs.outcome}</p>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )
            })()}
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

        {slots.map((slot, i) => {
          const imageAsset: ImageAsset | null = slot.kind === 'image' ? slot.asset : null
          const videoAsset: VideoAsset | null = slot.kind === 'video' ? slot.asset : null
          const asset = imageAsset ?? videoAsset!
          // Every asset has intrinsic pixel dimensions — the old decorative
          // aspect-ratio fallback is gone now that every project is ingested
          // with real w/h.
          const aspectRatio = `${asset.w} / ${asset.h}`
          // Priority window = first 2 + last 2 slots. Eager-load covers the
          // two possible arrival positions: scrollLeft=0 (fresh open / next)
          // and scrollLeft=maxScroll (prev). Anything in between is
          // IntersectionObserver-driven lazy load.
          const PRIORITY_EDGE = 2
          const isPriority = i < PRIORITY_EDGE || i >= count - PRIORITY_EDGE
          const shouldLoad = visibleIndices.has(i) || isPriority
          return (
            <div
              key={`${displayProject.id}-${i}`}
              data-scroll-img={i}
              className={`${styles.scrollImage}${shouldLoad ? ` ${styles.scrollImageVisible}` : ''}`}
              style={{ aspectRatio, position: 'relative', overflow: 'hidden' }}
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
                <LazyVideo
                  src={`/videos/${displayProject.id}/${videoAsset.src}`}
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

      {/* Invisible backdrop to catch outside clicks when menu is open */}
      {menuOpen && (
        <div className={styles.menuBackdrop} onClick={closeMenu} />
      )}

      {/* Pagination — unified container that expands from pill to menu.
          The pill bar is always visible; the project list appears above it. */}
      <div
        ref={pillRef}
        className={styles.projectNavFixed}
      >
        {/* Project list — always in DOM, toggled via GSAP */}
        <div ref={menuRef} className={styles.menuWrap} style={{ display: 'none' }}>
          <div
            ref={menuScrollRef}
            className={styles.projectMenu}
            onScroll={() => {
              const el = menuScrollRef.current
              const thumb = menuThumbRef.current
              const track = thumb?.parentElement
              if (!el || !thumb || !track) return
              const trackH = track.clientHeight
              const ratio = el.clientHeight / el.scrollHeight
              if (ratio >= 1) { thumb.style.height = '0'; return }
              const thumbH = Math.max(12, ratio * trackH)
              const scrollMax = el.scrollHeight - el.clientHeight
              const progress = scrollMax > 0 ? el.scrollTop / scrollMax : 0
              thumb.style.height = `${thumbH}px`
              thumb.style.top = `${progress * (trackH - thumbH)}px`
            }}
          >
            {projects.map((p, i) => (
              <button
                key={p.id}
                data-menu-item
                {...(i === index ? { 'data-menu-item-active': '' } : {})}
                className={`${styles.menuItem}${i === index ? ` ${styles.menuItemActive}` : ''}`}
                onClick={() => { onGoToProject(i); setMenuOpen(false) }}
              >
                <span className={styles.menuDate}>{String(i + 1).padStart(2, '0')}. {formatMenuDate(p.dateAdded)}</span>
                <span className={styles.menuProjectTitle}>{p.title}</span>
              </button>
            ))}
          </div>
          <div className={styles.menuScrollTrack}>
            <div ref={menuThumbRef} className={styles.menuScrollThumb} />
          </div>
        </div>

        {/* Pill bar — always visible */}
        <div className={styles.pillContent}>
          <button
            className={styles.navArrow}
            onClick={onPrev}
            disabled={index === 0}
            aria-label="Previous project"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <button className={styles.centerPill} onClick={menuOpen ? closeMenu : openMenu}>
            {/* List icon (closed) / Close icon (open) */}
            {menuOpen ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <path d="M6 6L18 18M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <path d="M4 7H20M4 12H20M4 17H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            )}
            <span className={styles.projectNum}>
              {String(index + 1).padStart(2, '0')} / {String(totalCount).padStart(2, '0')}
            </span>
          </button>
          <button
            className={styles.navArrow}
            onClick={onNext}
            disabled={index === totalCount - 1}
            aria-label="Next project"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <path d="M9 6L15 12L9 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}
