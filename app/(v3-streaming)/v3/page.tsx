'use client'

import { useRef, useState, useEffect, useCallback } from 'react'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { Project } from '@/types'
import projectsData from '@/data/projects.json'
import { buildCarousels } from './lib/carouselData'
import { pageEnter } from './lib/transitions'
import HeroFeature from './components/HeroFeature'
import CarouselSection from './components/CarouselSection'
import ProjectDetail from './components/ProjectDetail'
import styles from './v3.module.css'

const projects = projectsData as Project[]
const carousels = buildCarousels(projects)

interface DetailState {
  project: Project
  sourceRect: DOMRect
  carouselProjects: Project[]
}

export default function V3Page() {
  const pageRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const carouselsRef = useRef<HTMLDivElement>(null)
  const [detail, setDetail] = useState<DetailState | null>(null)
  const [isReady, setIsReady] = useState(false)

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

  useGSAP(() => {
    if (!isReady || !pageRef.current) return

    const content = contentRef.current
    const carouselEls = carouselsRef.current?.children

    const tl = gsap.timeline()

    if (content) {
      gsap.set(content, { opacity: 0 })
      tl.to(content, {
        opacity: 1,
        duration: pageEnter.heroFade.duration,
        ease: pageEnter.heroFade.ease,
      })
    }

    if (carouselEls && carouselEls.length > 0) {
      gsap.set(carouselEls, { opacity: 0, y: pageEnter.carouselStagger.y })
      tl.to(carouselEls, {
        opacity: 1,
        y: 0,
        duration: pageEnter.carouselStagger.duration,
        ease: pageEnter.carouselStagger.ease,
        stagger: pageEnter.carouselStagger.stagger,
      }, '-=0.3')
    }
  }, { scope: pageRef, dependencies: [isReady] })

  const handleCardClick = useCallback((project: Project, rect: DOMRect, carouselProjects: Project[]) => {
    setDetail({ project, sourceRect: rect, carouselProjects })
  }, [])

  const handleViewProject = useCallback((project: Project) => {
    const rect = new DOMRect(
      window.innerWidth * 0.1,
      window.innerHeight * 0.1,
      window.innerWidth * 0.8,
      window.innerHeight * 0.8
    )
    setDetail({ project, sourceRect: rect, carouselProjects: projects.filter(p => p.featured) })
  }, [])

  const handleCloseDetail = useCallback(() => {
    setDetail(null)
  }, [])

  const handleNextProject = useCallback((project: Project) => {
    if (!detail) return
    setDetail(prev => prev ? { ...prev, project } : null)
  }, [detail])

  return (
    <div ref={pageRef} className={styles.page}>
      {/* Fixed hero image behind everything */}
      <HeroFeature projects={projects} />

      {/* Scrollable content on top */}
      <div ref={contentRef} className={styles.content}>
        <HeroFeature.Content
          projects={projects}
          onViewProject={handleViewProject}
        />
        <div ref={carouselsRef}>
          <CarouselSection
            carousels={carousels}
            onCardClick={handleCardClick}
          />
        </div>
      </div>

      {detail && (
        <ProjectDetail
          project={detail.project}
          sourceRect={detail.sourceRect}
          carouselProjects={detail.carouselProjects}
          onClose={handleCloseDetail}
          onNextProject={handleNextProject}
        />
      )}
    </div>
  )
}
