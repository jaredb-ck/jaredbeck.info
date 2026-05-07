'use client'

import { useRef, useState, useCallback, useEffect } from 'react'
import Image from 'next/image'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { Project } from '@/types'
import { getFeaturedProjects, getNextProject, getRandomFeatured, HERO_DESCRIPTORS } from '../lib/featuredRotation'
import { hero as heroTransitions } from '../lib/transitions'
import HeroProgress from './HeroProgress'
import styles from '../v3.module.css'

interface HeroFeatureProps {
  projects: Project[]
}

interface HeroContentProps {
  projects: Project[]
  onViewProject: (project: Project) => void
}

// Shared state between Background and Content via module-level store
let sharedCurrent: Project | null = null
let sharedListeners: Array<(p: Project) => void> = []

function notifyListeners(p: Project) {
  sharedCurrent = p
  sharedListeners.forEach(fn => fn(p))
}

function useSharedProject(initial: Project | null) {
  const [project, setProject] = useState<Project | null>(initial)
  useEffect(() => {
    sharedListeners.push(setProject)
    if (sharedCurrent) setProject(sharedCurrent)
    return () => {
      sharedListeners = sharedListeners.filter(fn => fn !== setProject)
    }
  }, [])
  return project
}

/**
 * Fixed background — renders the hero images behind everything.
 */
function HeroBackground({ projects }: HeroFeatureProps) {
  const featured = getFeaturedProjects(projects)
  const containerRef = useRef<HTMLDivElement>(null)
  const imageARef = useRef<HTMLDivElement>(null)
  const imageBRef = useRef<HTMLDivElement>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isTransitioning = useRef(false)
  const activeSlot = useRef<'a' | 'b'>('a')

  const [slotA, setSlotA] = useState<Project | null>(() => {
    const p = featured.length > 0 ? getRandomFeatured(featured) : null
    if (p) sharedCurrent = p
    return p
  })
  const [slotB, setSlotB] = useState<Project | null>(null)
  const [isReady, setIsReady] = useState(false)

  // Notify content of initial project
  useEffect(() => {
    if (slotA) notifyListeners(slotA)
  }, [])

  const transitionTo = useCallback((next: Project) => {
    if (isTransitioning.current) return
    isTransitioning.current = true

    const isSlotA = activeSlot.current === 'a'
    const outRef = isSlotA ? imageARef : imageBRef
    const inRef = isSlotA ? imageBRef : imageARef

    if (isSlotA) setSlotB(next)
    else setSlotA(next)
    activeSlot.current = isSlotA ? 'b' : 'a'

    notifyListeners(next)

    requestAnimationFrame(() => {
      const tl = gsap.timeline({
        onComplete: () => { isTransitioning.current = false },
      })
      tl.to(outRef.current, {
        opacity: 0,
        duration: heroTransitions.crossfade.duration,
        ease: heroTransitions.crossfade.ease,
      })
      tl.fromTo(inRef.current, { opacity: 0 }, {
        opacity: 1,
        duration: heroTransitions.crossfade.duration,
        ease: heroTransitions.crossfade.ease,
      }, '<')
    })
  }, [featured])

  useEffect(() => {
    if (!isReady || featured.length <= 1) return
    const scheduleNext = () => {
      timerRef.current = setTimeout(() => {
        const cur = activeSlot.current === 'a' ? slotA : slotB
        const next = getNextProject(featured, cur?.id ?? null)
        transitionTo(next)
        scheduleNext()
      }, heroTransitions.rotationInterval * 1000)
    }
    scheduleNext()
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [isReady, featured, transitionTo, slotA, slotB])

  useEffect(() => {
    const handler = () => setIsReady(true)
    window.addEventListener('preloader:complete', handler)
    const preloaderEl = document.querySelector('[class*="preloader"]')
    if (!preloaderEl) setIsReady(true)
    const fallback = setTimeout(() => setIsReady(true), 3000)
    return () => {
      window.removeEventListener('preloader:complete', handler)
      clearTimeout(fallback)
    }
  }, [])

  useGSAP(() => {}, { scope: containerRef })

  if (featured.length === 0) return null

  const getImgSrc = (project: Project | null) => {
    if (!project) return ''
    return `/images/${project.id}/${project.images[0].src}`
  }

  return (
    <div ref={containerRef} className={styles.hero}>
      <div ref={imageARef} className={styles.heroImageWrap} style={{ opacity: activeSlot.current === 'a' ? 1 : 0 }}>
        {slotA && (
          <Image
            src={getImgSrc(slotA)}
            alt={slotA.title}
            fill
            className={styles.heroImage}
            priority
            sizes="100vw"
          />
        )}
      </div>
      <div ref={imageBRef} className={styles.heroImageWrap} style={{ opacity: activeSlot.current === 'b' ? 1 : 0 }}>
        {slotB && (
          <Image
            src={getImgSrc(slotB)}
            alt={slotB.title}
            fill
            className={styles.heroImage}
            sizes="100vw"
          />
        )}
      </div>
    </div>
  )
}

/**
 * Scrollable content overlay — featured project info with gradient.
 */
function HeroContent({ projects, onViewProject }: HeroContentProps) {
  const featured = getFeaturedProjects(projects)
  const contentRef = useRef<HTMLDivElement>(null)
  const current = useSharedProject(featured[0] ?? null)
  const [progressIndex, setProgressIndex] = useState(0)

  // Track progress changes
  useEffect(() => {
    if (!current) return
    const idx = featured.findIndex(p => p.id === current.id)
    if (idx !== -1) setProgressIndex(idx)
  }, [current, featured])

  // Text entrance animation on project change
  useGSAP(() => {
    if (!contentRef.current || !current) return
    const els = contentRef.current.children
    gsap.fromTo(els,
      { y: heroTransitions.textEntrance.y, opacity: 0 },
      {
        y: 0, opacity: 1,
        duration: heroTransitions.textEntrance.duration,
        ease: heroTransitions.textEntrance.ease,
        stagger: heroTransitions.textEntrance.stagger,
      }
    )
  }, { scope: contentRef, dependencies: [current?.id] })

  if (!current) return null

  return (
    <>
      <div className={styles.heroGradient}>
        <div className={styles.heroContent}>
          <div ref={contentRef} className={styles.heroMeta}>
            <div className={styles.heroLabel}>featured project:</div>
            <h1 className={styles.heroTitle}>{current.title}</h1>
            <p className={styles.heroDescription}>{HERO_DESCRIPTORS[current.id] || current.description.split(/\.(?:\s|$)/)[0] + '.'}</p>
          </div>
          <button
            className={styles.heroAction}
            onClick={() => onViewProject(current)}
          >
            view project
          </button>
        </div>
      </div>
      <HeroProgress total={featured.length} activeIndex={progressIndex} />
    </>
  )
}

// Compound component pattern
HeroBackground.Content = HeroContent
export default HeroBackground
