'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
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
  const match = window.location.pathname.match(/\/v0\/projects\/([^/]+)$/)
  if (!match) return null
  const index = projects.findIndex(p => p.id === match[1])
  return index !== -1 ? { project: projects[index], index } : null
}

export default function V0App({
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

  // Open the correct panel on hard refresh to a project URL — runs after
  // hydration so server and client start from the same null state.
  useEffect(() => {
    const initial = getInitialActive(projects)
    if (initial) setActive(initial)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Browser back / forward — instant, no animation
  useEffect(() => {
    const handlePop = () => {
      const match = location.pathname.match(/\/v0\/projects\/([^/]+)$/)
      if (match) {
        const index = projects.findIndex(p => p.id === match[1])
        if (index !== -1) {
          if (listRef.current) gsap.set(listRef.current, { clearProps: 'opacity,visibility' })
          setActive({ project: projects[index], index })
        }
      } else {
        tlRef.current?.kill()
        isAnimating.current = false
        if (listRef.current) gsap.set(listRef.current, { clearProps: 'opacity,visibility' })
        setActive(null)
      }
    }
    window.addEventListener('popstate', handlePop)
    return () => window.removeEventListener('popstate', handlePop)
  }, [projects])

  const openProject = useCallback((project: Project) => {
    if (isAnimating.current) return
    isAnimating.current = true
    const index = projects.findIndex(p => p.id === project.id)
    setActive({ project, index })
    history.pushState({}, '', `/v0/projects/${project.id}`)
    // Fade list out while panel animates in
    if (listRef.current) gsap.to(listRef.current, { autoAlpha: 0, duration: 0.25, ease: 'power2.out' })
  }, [projects])

  const goToPrev = useCallback(() => {
    if (!active || active.index === 0) return
    const newIndex = active.index - 1
    const project = projects[newIndex]
    history.replaceState({}, '', `/v0/projects/${project.id}`)
    setNavDirection('prev')
    setActive({ project, index: newIndex })
  }, [active, projects])

  const goToNext = useCallback(() => {
    if (!active || active.index === projects.length - 1) return
    const newIndex = active.index + 1
    const project = projects[newIndex]
    history.replaceState({}, '', `/v0/projects/${project.id}`)
    setNavDirection('next')
    setActive({ project, index: newIndex })
  }, [active, projects])

  const onOpenComplete = useCallback(() => {
    isAnimating.current = false
  }, [])

  // Pause smooth scroll while the panel is open so Lenis doesn't
  // accumulate vertical scroll velocity and fight the horizontal redirect.
  useEffect(() => {
    const lenis = getLenisInstance()
    if (!lenis) return
    if (active) {
      lenis.stop()
    } else {
      lenis.start()
      // Reset target to current position — prevents any drift accumulated
      // from wheel events that fired while the panel was covering the page.
      lenis.scrollTo(window.scrollY, { immediate: true })
    }
  }, [active])

  // Close: slide panel down + fade out, then restore list
  const closeProject = useCallback(() => {
    if (isAnimating.current || !active) return
    isAnimating.current = true

    // Update URL while panel is still covering the screen so any Next.js
    // usePathname() watchers (e.g. ScrollReset) fire before the list is visible.
    history.replaceState({}, '', '/v0')

    tlRef.current?.kill()
    const tl = gsap.timeline({
      onComplete: () => {
        setActive(null)
        isAnimating.current = false
      },
    })
    tlRef.current = tl

    // Target the fixed panel element directly — animating the wrapper div with `y`
    // would create a new containing block and break position:fixed on the child.
    const panelEl = detailRef.current?.querySelector<HTMLElement>('[data-panel]')
    if (panelEl) tl.to(panelEl, { autoAlpha: 0, y: 20, duration: 0.3, ease: 'power3.in' }, 0)
    tl.to(listRef.current, { autoAlpha: 1, duration: 0.3, ease: 'power2.out' }, 0.1)
  }, [active])

  return (
    <>
      {/* Solid strip behind the transparent version switcher so the scrolling
          project list doesn't peek through between the beta banner and the
          sticky filter bar. z-index: 30 keeps it below the PDP panel (40)
          so opening a project hides it automatically. */}
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
            onBack={closeProject}
            onOpenComplete={onOpenComplete}
            onPrev={goToPrev}
            onNext={goToNext}
            direction={navDirection}
          />
        </div>
      )}
    </>
  )
}
