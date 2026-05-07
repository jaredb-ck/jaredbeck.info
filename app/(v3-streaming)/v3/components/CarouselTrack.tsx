'use client'

import { useRef, useState, useCallback, useEffect } from 'react'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { Project } from '@/types'
import { carousel as carouselTransitions } from '../lib/transitions'
import ProjectCard from './ProjectCard'
import styles from '../v3.module.css'

interface CarouselTrackProps {
  title: string
  projects: Project[]
  onCardClick: (project: Project, rect: DOMRect, carouselProjects: Project[]) => void
}

const CARD_WIDTH = 500
const GAP = 24

export default function CarouselTrack({ title, projects, onCardClick }: CarouselTrackProps) {
  const trackRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(true)

  const updateScrollState = useCallback(() => {
    const track = trackRef.current
    if (!track) return
    setCanScrollLeft(track.scrollLeft > 5)
    setCanScrollRight(track.scrollLeft < track.scrollWidth - track.clientWidth - 5)
  }, [])

  useEffect(() => {
    const track = trackRef.current
    if (!track) return
    updateScrollState()
    track.addEventListener('scroll', updateScrollState, { passive: true })
    return () => track.removeEventListener('scroll', updateScrollState)
  }, [updateScrollState])

  const { contextSafe } = useGSAP({ scope: trackRef })

  const scrollBy = contextSafe((direction: 'left' | 'right') => {
    const track = trackRef.current
    if (!track) return
    const amount = direction === 'left' ? -(CARD_WIDTH + GAP) : (CARD_WIDTH + GAP)
    gsap.to(track, {
      scrollLeft: track.scrollLeft + amount,
      duration: carouselTransitions.scroll.duration,
      ease: carouselTransitions.scroll.ease,
      onUpdate: updateScrollState,
    })
  })

  const handleCardClick = (project: Project, rect: DOMRect) => {
    onCardClick(project, rect, projects)
  }

  return (
    <div className={styles.carousel}>
      <div className={styles.carouselHeader}>
        <h2 className={styles.carouselTitle}>{title}</h2>
        <div className={styles.carouselNav}>
          <button
            className={styles.carouselArrow}
            onClick={() => scrollBy('left')}
            disabled={!canScrollLeft}
            aria-label="Scroll left"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: 'rotate(-90deg)' }}>
              <line x1="12" y1="19" x2="12" y2="5" />
              <polyline points="5 12 12 5 19 12" />
            </svg>
          </button>
          <button
            className={styles.carouselArrow}
            onClick={() => scrollBy('right')}
            disabled={!canScrollRight}
            aria-label="Scroll right"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: 'rotate(90deg)' }}>
              <line x1="12" y1="19" x2="12" y2="5" />
              <polyline points="5 12 12 5 19 12" />
            </svg>
          </button>
        </div>
      </div>
      <div ref={trackRef} className={styles.carouselTrack}>
        {projects.map(project => (
          <ProjectCard
            key={project.id}
            project={project}
            onClick={handleCardClick}
          />
        ))}
      </div>
    </div>
  )
}
