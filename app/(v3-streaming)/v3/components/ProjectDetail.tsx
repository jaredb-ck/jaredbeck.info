'use client'

import { useRef, useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { Project } from '@/types'
import { detail as detailTransitions } from '../lib/transitions'
import styles from '../v3.module.css'

interface ProjectDetailProps {
  project: Project
  sourceRect: DOMRect
  carouselProjects: Project[]
  onClose: () => void
  onNextProject: (project: Project) => void
}

export default function ProjectDetail({
  project,
  sourceRect,
  carouselProjects,
  onClose,
  onNextProject,
}: ProjectDetailProps) {
  const [imageIndex, setImageIndex] = useState(0)
  const [isClosing, setIsClosing] = useState(false)
  const detailRef = useRef<HTMLDivElement>(null)
  const overlayRef = useRef<HTMLDivElement>(null)
  const imageAreaRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const categoryRef = useRef<HTMLDivElement>(null)
  const currentImageRef = useRef<HTMLDivElement>(null)
  const imageIndexRef = useRef(imageIndex)
  imageIndexRef.current = imageIndex

  // Reset image index when project changes
  useEffect(() => {
    setImageIndex(0)
  }, [project.id])

  const currentImage = project.images[imageIndex]
  const isLandscape = currentImage ? currentImage.w / currentImage.h >= 1.0 : true
  const imgSrc = currentImage ? `/images/${project.id}/${currentImage.src}` : ''

  // Open animation
  useGSAP(() => {
    if (!detailRef.current || !overlayRef.current || !imageAreaRef.current) return

    const tl = gsap.timeline()

    gsap.set(overlayRef.current, { opacity: 0 })
    gsap.set(contentRef.current, { opacity: 0 })
    gsap.set(categoryRef.current, { opacity: 0 })

    gsap.set(imageAreaRef.current, {
      clipPath: `inset(${sourceRect.top}px ${window.innerWidth - sourceRect.right}px ${window.innerHeight - sourceRect.bottom}px ${sourceRect.left}px)`,
    })

    tl.to(imageAreaRef.current, {
      clipPath: 'inset(0px 0px 0px 0px)',
      duration: detailTransitions.open.duration,
      ease: detailTransitions.open.ease,
    })

    tl.to(overlayRef.current, {
      opacity: 1,
      duration: detailTransitions.overlayFade.duration,
    }, 0)

    tl.to([contentRef.current, categoryRef.current], {
      opacity: 1,
      duration: detailTransitions.uiFadeIn.duration,
    }, `>${detailTransitions.uiFadeIn.delay - detailTransitions.open.duration}`)
  }, { scope: detailRef })

  // Close animation
  const handleClose = useCallback(() => {
    if (isClosing) return
    setIsClosing(true)

    const tl = gsap.timeline({ onComplete: onClose })

    tl.to([contentRef.current, categoryRef.current], {
      opacity: 0,
      duration: 0.15,
    })

    tl.to(imageAreaRef.current, {
      clipPath: `inset(${sourceRect.top}px ${window.innerWidth - sourceRect.right}px ${window.innerHeight - sourceRect.bottom}px ${sourceRect.left}px)`,
      duration: detailTransitions.close.duration,
      ease: detailTransitions.close.ease,
    }, 0.1)

    tl.to(overlayRef.current, {
      opacity: 0,
      duration: detailTransitions.close.duration,
    }, 0)
  }, [isClosing, onClose, sourceRect])

  const navigateImage = useCallback((dir: number) => {
    const idx = imageIndexRef.current
    const next = idx + dir
    if (next < 0 || next >= project.images.length) return

    const prevImg = project.images[idx]
    const nextImg = project.images[next]
    const prevIsLandscape = prevImg.w / prevImg.h >= 1.0
    const nextIsLandscape = nextImg.w / nextImg.h >= 1.0
    const layoutChanges = prevIsLandscape !== nextIsLandscape

    // Crossfade
    gsap.to(currentImageRef.current, {
      opacity: 0,
      duration: detailTransitions.imageCrossfade.duration,
      ease: detailTransitions.imageCrossfade.ease,
      onComplete: () => {
        setImageIndex(next)
        gsap.fromTo(currentImageRef.current, { opacity: 0 }, {
          opacity: 1,
          duration: detailTransitions.imageCrossfade.duration,
          ease: detailTransitions.imageCrossfade.ease,
        })
      },
    })
  }, [project.images])

  // Keyboard navigation
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose()
      if (e.key === 'ArrowLeft') navigateImage(-1)
      if (e.key === 'ArrowRight') navigateImage(1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [handleClose, navigateImage])

  const handleNextProject = () => {
    const currentIdx = carouselProjects.findIndex(p => p.id === project.id)
    const nextIdx = (currentIdx + 1) % carouselProjects.length
    onNextProject(carouselProjects[nextIdx])
  }

  // Click outside image area to close
  const handleBackdropClick = (e: React.MouseEvent) => {
    // Only close if clicking the overlay itself, not children
    if (e.target === e.currentTarget) {
      handleClose()
    }
  }

  return (
    <div ref={detailRef} className={styles.detail} onClick={handleBackdropClick}>
      <div ref={overlayRef} className={styles.detailOverlay} />
      <div ref={imageAreaRef} className={styles.detailImageArea}>
        <div ref={currentImageRef} className={styles.detailImageWrap}>
          {currentImage && (
            <Image
              key={`${project.id}-${imageIndex}`}
              src={imgSrc}
              alt={`${project.title} — image ${imageIndex + 1}`}
              fill={isLandscape}
              width={!isLandscape ? currentImage.w : undefined}
              height={!isLandscape ? currentImage.h : undefined}
              className={isLandscape ? styles.imageCover : styles.imageContain}
              sizes="100vw"
              priority
            />
          )}
        </div>
        {isLandscape && <div className={styles.detailGradient} />}
        <div ref={categoryRef} className={styles.detailCategory}>
          {project.medium}
        </div>
        <div ref={contentRef} className={styles.detailContent}>
          <div className={styles.detailMeta}>
            <div className={styles.detailLabel}>Featured Project:</div>
            <h2 className={styles.detailTitle}>{project.title}</h2>
            <p className={styles.detailDescription}>{project.description}</p>
          </div>
          <div className={styles.detailNav}>
            <button className={styles.detailNextProject} onClick={handleNextProject}>
              next project
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: 'rotate(90deg)' }}>
                <line x1="12" y1="19" x2="12" y2="5" />
                <polyline points="5 12 12 5 19 12" />
              </svg>
            </button>
            <div className={styles.detailImageNav}>
              <button
                className={styles.detailArrow}
                onClick={() => navigateImage(-1)}
                disabled={imageIndex === 0}
                aria-label="Previous image"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: 'rotate(-90deg)' }}>
                  <line x1="12" y1="19" x2="12" y2="5" />
                  <polyline points="5 12 12 5 19 12" />
                </svg>
              </button>
              <button
                className={styles.detailArrow}
                onClick={() => navigateImage(1)}
                disabled={imageIndex === project.images.length - 1}
                aria-label="Next image"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: 'rotate(90deg)' }}>
                  <line x1="12" y1="19" x2="12" y2="5" />
                  <polyline points="5 12 12 5 19 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
      <div className={styles.detailProgress}>
        {project.images.map((_, i) => (
          <div
            key={i}
            className={`${styles.detailProgressSegment} ${
              i === imageIndex ? styles.detailProgressSegmentActive : ''
            }`}
          />
        ))}
      </div>
    </div>
  )
}
