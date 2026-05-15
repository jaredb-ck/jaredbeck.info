'use client'

import { useRef, useState, useCallback, useEffect } from 'react'
import Image from 'next/image'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { Project } from '@/types'
import { getFeaturedProjects, getNextProject, getRandomFeatured, HERO_DESCRIPTORS, HERO_VIDEOS } from '../lib/featuredRotation'
import { hero as heroTransitions } from '../lib/transitions'
import HeroProgress from './HeroProgress'
import styles from '../v3.module.css'

interface HeroBackgroundProps {
  projects: Project[]
  currentProject: Project | null
  onProjectChange: (project: Project) => void
}

interface HeroContentProps {
  currentProject: Project | null
  featuredCount: number
  featuredIndex: number
  onViewProject: (project: Project) => void
}

/**
 * Fixed background — renders the hero images behind everything.
 */
function HeroBackground({ projects, currentProject, onProjectChange }: HeroBackgroundProps) {
  const featured = getFeaturedProjects(projects)
  const containerRef = useRef<HTMLDivElement>(null)
  const imageARef = useRef<HTMLDivElement>(null)
  const imageBRef = useRef<HTMLDivElement>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isTransitioning = useRef(false)
  const activeSlot = useRef<'a' | 'b'>('a')

  const [slotA, setSlotA] = useState<Project | null>(currentProject)
  const [slotB, setSlotB] = useState<Project | null>(null)
  const [isReady, setIsReady] = useState(false)

  const transitionTo = useCallback((next: Project) => {
    if (isTransitioning.current) return
    isTransitioning.current = true

    const isSlotA = activeSlot.current === 'a'
    const outRef = isSlotA ? imageARef : imageBRef
    const inRef = isSlotA ? imageBRef : imageARef

    if (isSlotA) setSlotB(next)
    else setSlotA(next)
    activeSlot.current = isSlotA ? 'b' : 'a'

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
      // Update text at crossfade midpoint
      tl.call(() => onProjectChange(next), [], heroTransitions.crossfade.duration * 0.5)
    })
  }, [onProjectChange])

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

  const renderMedia = (project: Project | null, priority: boolean) => {
    if (!project) return null
    const videoFile = HERO_VIDEOS[project.id]
    if (videoFile) {
      return (
        <video
          src={`/videos/${project.id}/${videoFile}`}
          className={styles.heroImage}
          autoPlay
          muted
          loop
          playsInline
        />
      )
    }
    return (
      <Image
        src={`/images/${project.id}/${project.images[0].src}`}
        alt={project.title}
        fill
        className={styles.heroImage}
        priority={priority}
        sizes="100vw"
      />
    )
  }

  return (
    <div ref={containerRef} className={styles.hero}>
      <div ref={imageARef} className={styles.heroImageWrap} style={{ opacity: activeSlot.current === 'a' ? 1 : 0 }}>
        {renderMedia(slotA, true)}
      </div>
      <div ref={imageBRef} className={styles.heroImageWrap} style={{ opacity: activeSlot.current === 'b' ? 1 : 0 }}>
        {renderMedia(slotB, false)}
      </div>
    </div>
  )
}

/**
 * Scrollable content overlay — featured project info with gradient.
 */
function HeroContent({ currentProject, featuredCount, featuredIndex, onViewProject }: HeroContentProps) {
  const contentRef = useRef<HTMLDivElement>(null)

  useGSAP(() => {
    if (!contentRef.current || !currentProject) return
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
  }, { scope: contentRef, dependencies: [currentProject?.id] })

  if (!currentProject) return null

  const desc = HERO_DESCRIPTORS[currentProject.id]
    || currentProject.description.split(/\.(?:\s|$)/)[0] + '.'

  return (
    <div className={styles.heroGradient}>
      <HeroProgress total={featuredCount} activeIndex={featuredIndex} />
      <div className={styles.heroContent}>
        <div ref={contentRef} className={styles.heroMeta}>
          <div className={styles.heroLabel}>featured project:</div>
          <h1 className={styles.heroTitle}>{currentProject.title}</h1>
          <p className={styles.heroDescription}>{desc}</p>
          <button
            className={styles.heroAction}
            onClick={() => onViewProject(currentProject)}
          >
            view project
          </button>
        </div>
      </div>
    </div>
  )
}

HeroBackground.Content = HeroContent
export default HeroBackground
