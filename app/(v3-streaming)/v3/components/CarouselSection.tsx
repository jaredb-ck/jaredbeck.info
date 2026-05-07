'use client'

import { useRef } from 'react'
import { Project } from '@/types'
import { CarouselDef } from '../lib/carouselData'
import CarouselTrack from './CarouselTrack'
import styles from '../v3.module.css'

interface CarouselSectionProps {
  carousels: CarouselDef[]
  onCardClick: (project: Project, rect: DOMRect, carouselProjects: Project[]) => void
}

export default function CarouselSection({ carousels, onCardClick }: CarouselSectionProps) {
  const sectionRef = useRef<HTMLDivElement>(null)

  return (
    <div ref={sectionRef} className={styles.carousels}>
      {carousels.map(carousel => (
        <CarouselTrack
          key={carousel.title}
          title={carousel.title}
          projects={carousel.projects}
          onCardClick={onCardClick}
        />
      ))}
    </div>
  )
}
