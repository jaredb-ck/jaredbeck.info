'use client'

import { useState, useRef, useEffect, useLayoutEffect, useCallback } from 'react'
import gsap from 'gsap'
import type { Project } from '@/types'
import ProjectList from './projects/ProjectList'
import ProjectDetailPanel from './components/ProjectDetailPanel'
import HeroText from './components/HeroText'
import LocalTime from './components/LocalTime'
import { getLenisInstance } from './lib/smoothScroll'
import styles from './page.module.css'

interface ActiveState {
  project: Project
  index: number
}

function getInitialActive(projects: Project[]): ActiveState | null {
  if (typeof window === 'undefined') return null
  const match = window.location.pathname.match(/\/v1\/projects\/([^/]+)$/)
  if (!match) return null
  const index = projects.findIndex(p => p.id === match[1])
  return index !== -1 ? { project: projects[index], index } : null
}

export default function V1App({
  projects,
  aboutSkillsCount,
}: {
  projects: Project[]
  aboutSkillsCount: number
}) {
  const [active, setActive] = useState<ActiveState | null>(null)
  const [navDirection, setNavDirection] = useState<'prev' | 'next' | null>(null)

  const listRef     = useRef<HTMLDivElement>(null)
  const detailRef   = useRef<HTMLDivElement>(null)
  const isAnimating = useRef(false)
  const tlRef       = useRef<gsap.core.Timeline | null>(null)
  // Track whether this is the initial mount (hard refresh to a project URL)
  // so we skip the entrance animation and show the PDP immediately.
  const isInitialMount = useRef(true)
  // Track previous active state so we only run the open transition when
  // going from null → project, not project → project (prev/next nav).
  const prevActiveRef = useRef<ActiveState | null>(null)

  // Open the correct panel on hard refresh to a project URL
  useEffect(() => {
    const initial = getInitialActive(projects)
    if (initial) setActive(initial)
    // Mark initial mount complete after first render cycle
    requestAnimationFrame(() => { isInitialMount.current = false })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Browser back / forward — instant, no animation
  useEffect(() => {
    const handlePop = () => {
      const match = location.pathname.match(/\/v1\/projects\/([^/]+)$/)
      if (match) {
        const index = projects.findIndex(p => p.id === match[1])
        if (index !== -1) {
          if (listRef.current) gsap.set(listRef.current, { clearProps: 'opacity,visibility,scale,filter,willChange' })
          setActive({ project: projects[index], index })
        }
      } else {
        tlRef.current?.kill()
        isAnimating.current = false
        if (listRef.current) gsap.set(listRef.current, { clearProps: 'opacity,visibility,scale,filter,willChange' })
        setActive(null)
      }
    }
    window.addEventListener('popstate', handlePop)
    return () => window.removeEventListener('popstate', handlePop)
  }, [projects])

  // ── Coordinated open transition ────────────────────────────────
  // Runs after the PDP mounts into the DOM (active changes from null to non-null).
  // Drives both the homepage recession and PDP emergence on a single timeline.
  useLayoutEffect(() => {
    const wasNull = prevActiveRef.current === null
    prevActiveRef.current = active

    // Only run the open transition when going from no project to a project
    if (!active || !wasNull || !detailRef.current || !listRef.current) return
    // Skip animation on hard-refresh (PDP should just appear)
    if (isInitialMount.current) {
      isAnimating.current = false
      return
    }

    const panelEl  = detailRef.current.querySelector<HTMLElement>('[data-panel]')
    const panelBg  = detailRef.current.querySelector<HTMLElement>('[data-panel-bg]')
    const headerEl = detailRef.current.querySelector<HTMLElement>('[data-detail-header]')
    const titleEl  = detailRef.current.querySelector<HTMLElement>('[data-detail-title]')
    const scrollEl = detailRef.current.querySelector<HTMLElement>('[data-scroll-img]')?.parentElement
    const imgEls   = scrollEl
      ? Array.from(scrollEl.querySelectorAll<HTMLElement>('[data-scroll-img]'))
      : []

    if (!panelEl) return

    // Set initial states
    gsap.set(panelEl,  { scale: 1.015, autoAlpha: 0 })
    if (panelBg)  gsap.set(panelBg,  { autoAlpha: 0 })
    if (headerEl) gsap.set(headerEl, { autoAlpha: 0, y: 8 })
    if (titleEl)  gsap.set(titleEl,  { autoAlpha: 0, y: 8 })
    gsap.set(imgEls, { autoAlpha: 0, y: 6 })

    tlRef.current?.kill()
    const tl = gsap.timeline({
      onComplete: () => { isAnimating.current = false },
    })
    tlRef.current = tl

    // Phase 1: Homepage recedes
    tl.to(listRef.current, {
      scale: 0.97,
      autoAlpha: 0,
      filter: 'blur(6px)',
      duration: 0.4,
      ease: 'power2.in',
    }, 0)

    // Phase 2: PDP emerges (overlapping)
    tl.to(panelEl, {
      scale: 1,
      autoAlpha: 1,
      duration: 0.5,
      ease: 'power2.out',
    }, 0.12)

    if (panelBg) {
      tl.to(panelBg, { autoAlpha: 1, duration: 0.35, ease: 'power2.out' }, 0.12)
    }
    if (headerEl) {
      tl.to(headerEl, { autoAlpha: 1, y: 0, duration: 0.3, ease: 'power2.out' }, 0.28)
    }
    if (titleEl) {
      tl.to(titleEl, { autoAlpha: 1, y: 0, duration: 0.3, ease: 'power2.out' }, 0.34)
    }
    if (imgEls.length > 0) {
      tl.to(imgEls, { autoAlpha: 1, y: 0, duration: 0.3, stagger: 0.02, ease: 'power2.out' }, 0.4)
    }
  }, [active]) // eslint-disable-line react-hooks/exhaustive-deps

  const openProject = useCallback((project: Project) => {
    if (isAnimating.current) return
    isAnimating.current = true
    const index = projects.findIndex(p => p.id === project.id)
    setActive({ project, index })
    history.pushState({}, '', `/v1/projects/${project.id}`)
    // The useLayoutEffect above handles the animation once the PDP mounts
  }, [projects])

  const goToPrev = useCallback(() => {
    if (!active || active.index === 0) return
    const newIndex = active.index - 1
    const project = projects[newIndex]
    history.replaceState({}, '', `/v1/projects/${project.id}`)
    setNavDirection('prev')
    setActive({ project, index: newIndex })
  }, [active, projects])

  const goToNext = useCallback(() => {
    if (!active || active.index === projects.length - 1) return
    const newIndex = active.index + 1
    const project = projects[newIndex]
    history.replaceState({}, '', `/v1/projects/${project.id}`)
    setNavDirection('next')
    setActive({ project, index: newIndex })
  }, [active, projects])

  const goToProject = useCallback((targetIndex: number) => {
    if (!active || targetIndex === active.index) return
    if (targetIndex < 0 || targetIndex >= projects.length) return
    const project = projects[targetIndex]
    history.replaceState({}, '', `/v1/projects/${project.id}`)
    setNavDirection(targetIndex < active.index ? 'prev' : 'next')
    setActive({ project, index: targetIndex })
  }, [active, projects])

  const onOpenComplete = useCallback(() => {
    isAnimating.current = false
  }, [])

  // Pause smooth scroll while the panel is open
  useEffect(() => {
    const lenis = getLenisInstance()
    if (!lenis) return
    if (active) {
      lenis.stop()
    } else {
      lenis.start()
      lenis.scrollTo(window.scrollY, { immediate: true })
    }
  }, [active])

  // ── Coordinated close transition ───────────────────────────────
  const closeProject = useCallback(() => {
    if (isAnimating.current || !active) return
    isAnimating.current = true

    history.replaceState({}, '', '/v1')

    tlRef.current?.kill()
    const tl = gsap.timeline({
      onComplete: () => {
        setActive(null)
        isAnimating.current = false
        if (listRef.current) {
          gsap.set(listRef.current, { clearProps: 'scale,filter,willChange,opacity,visibility' })
        }
      },
    })
    tlRef.current = tl

    // Phase 1: PDP recedes
    const panelEl = detailRef.current?.querySelector<HTMLElement>('[data-panel]')
    if (panelEl) {
      tl.to(panelEl, {
        scale: 1.015,
        autoAlpha: 0,
        duration: 0.35,
        ease: 'power2.in',
      }, 0)
    }

    // Phase 2: Homepage returns (overlapping)
    // Clear transform before fading in so sticky elements work correctly
    tl.call(() => {
      if (listRef.current) {
        gsap.set(listRef.current, { clearProps: 'scale,filter' })
      }
    }, [], 0.1)

    tl.to(listRef.current, {
      autoAlpha: 1,
      duration: 0.4,
      ease: 'power2.out',
    }, 0.1)
  }, [active])

  return (
    <>
      <div aria-hidden="true" className={styles.chromeVeil} />

      <div ref={listRef}>
        <section data-row className={styles.hero}>
          <div className={styles.heroLeft}>
            <div className={styles.heroEyebrow}>
              <p className={styles.heroLabel}>
                Jared Beck, Multidisciplinary Designer — Norfolk, VA
              </p>
              <LocalTime />
            </div>
            <HeroText />
          </div>
          <div className={styles.heroRight}>
            <a href="mailto:contact@jaredbeck.info" className={styles.heroMeta}>contact@jaredbeck.info</a>
            <a href="tel:+17574015596" className={styles.heroMeta}>1.757.401.5596</a>
            <a href="https://www.instagram.com/_iared/" target="_blank" rel="noopener noreferrer" className={styles.heroMeta}>instagram</a>
          </div>
        </section>

        <ProjectList projects={projects} onProjectClick={openProject} />
      </div>

      {active && (
        <div ref={detailRef}>
          <ProjectDetailPanel
            project={active.project}
            index={active.index}
            totalCount={projects.length}
            projects={projects}
            onBack={closeProject}
            onOpenComplete={onOpenComplete}
            onPrev={goToPrev}
            onNext={goToNext}
            onGoToProject={goToProject}
            direction={navDirection}
          />
        </div>
      )}
    </>
  )
}
