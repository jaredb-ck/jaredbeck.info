'use client'

import { useRef } from 'react'
import Image from 'next/image'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { Project } from '@/types'
import { card as cardTransitions } from '../lib/transitions'
import styles from '../v3.module.css'

interface ProjectCardProps {
  project: Project
  onClick: (project: Project, rect: DOMRect) => void
}

const MAX_TILT = 8

export default function ProjectCard({ project, onClick }: ProjectCardProps) {
  const cardRef = useRef<HTMLDivElement>(null)
  const overlayRef = useRef<HTMLDivElement>(null)
  const metaRef = useRef<HTMLDivElement>(null)
  const shineRef = useRef<HTMLDivElement>(null)
  const borderRef = useRef<HTMLDivElement>(null)

  useGSAP(() => {
    if (!cardRef.current || !overlayRef.current || !metaRef.current || !shineRef.current || !borderRef.current) return

    const card = cardRef.current
    const overlay = overlayRef.current
    const meta = metaRef.current
    const shine = shineRef.current
    const border = borderRef.current

    const onEnter = () => {
      gsap.to(card, {
        scale: cardTransitions.hoverScale.scale,
        duration: cardTransitions.hoverScale.duration,
        ease: cardTransitions.hoverScale.ease,
      })
      gsap.to(overlay, {
        opacity: 1,
        duration: cardTransitions.metadataIn.duration,
        ease: cardTransitions.metadataIn.ease,
      })
      gsap.fromTo(meta,
        { y: cardTransitions.metadataIn.y, opacity: 0 },
        { y: 0, opacity: 1, duration: cardTransitions.metadataIn.duration, ease: cardTransitions.metadataIn.ease }
      )
      gsap.to(shine, { opacity: 1, duration: 0.3 })
      gsap.to(border, { opacity: 1, duration: 0.3 })
    }

    const onMove = (e: MouseEvent) => {
      const rect = card.getBoundingClientRect()
      const x = (e.clientX - rect.left) / rect.width
      const y = (e.clientY - rect.top) / rect.height
      const rotateY = (x - 0.5) * MAX_TILT * 2
      const rotateX = (0.5 - y) * MAX_TILT * 2

      gsap.to(card, {
        rotateX,
        rotateY,
        duration: 0.3,
        ease: 'power2.out',
        overwrite: 'auto',
      })

      const shineX = x * 100
      const shineY = y * 100
      gsap.set(shine, {
        background: `radial-gradient(circle at ${shineX}% ${shineY}%, rgba(255,255,255,0.45) 0%, rgba(255,255,255,0.15) 40%, transparent 70%)`,
      })
      gsap.set(border, {
        background: `radial-gradient(circle at ${shineX}% ${shineY}%, rgba(255,255,255,0.25) 0%, rgba(255,255,255,0.06) 30%, transparent 50%)`,
      })
    }

    const onLeave = () => {
      gsap.to(card, {
        scale: 1,
        rotateX: 0,
        rotateY: 0,
        duration: 0.4,
        ease: 'power2.out',
      })
      gsap.to(overlay, { opacity: 0, duration: cardTransitions.metadataIn.duration })
      gsap.to(shine, { opacity: 0, duration: 0.3 })
      gsap.to(border, { opacity: 0, duration: 0.3 })
    }

    card.addEventListener('mouseenter', onEnter)
    card.addEventListener('mousemove', onMove)
    card.addEventListener('mouseleave', onLeave)
    return () => {
      card.removeEventListener('mouseenter', onEnter)
      card.removeEventListener('mousemove', onMove)
      card.removeEventListener('mouseleave', onLeave)
    }
  }, { scope: cardRef })

  const heroImg = project.images[0]
  if (!heroImg) return null

  const handleClick = () => {
    if (cardRef.current) {
      onClick(project, cardRef.current.getBoundingClientRect())
    }
  }

  const shortDesc = project.description.length > 100
    ? project.description.slice(0, 100).trimEnd() + '...'
    : project.description

  return (
    <div ref={cardRef} className={styles.card} onClick={handleClick}>
      <Image
        src={`/images/${project.id}/${heroImg.src}`}
        alt={project.title}
        fill
        className={styles.cardImage}
        sizes="500px"
      />
      <div ref={shineRef} className={styles.cardShine} />
      <div ref={borderRef} className={styles.cardBorderGlow} />
      <div ref={overlayRef} className={styles.cardOverlay}>
        <div ref={metaRef} className={styles.cardMeta}>
          <p className={styles.cardTitle}>{project.title}</p>
          <p className={styles.cardDescription}>{shortDesc}</p>
        </div>
      </div>
    </div>
  )
}
