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

const ArrowUp = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="19" x2="12" y2="5" />
    <polyline points="5 12 12 5 19 12" />
  </svg>
)

export default function ProjectDetail({
  project,
  sourceRect,
  carouselProjects,
  onClose,
  onNextProject,
}: ProjectDetailProps) {
  // Interleave images and videos so videos are spread evenly
  type MediaItem = { type: 'image' | 'video'; src: string; w: number; h: number }
  const images: MediaItem[] = project.images.map(img => ({ type: 'image', src: `/images/${project.id}/${img.src}`, w: img.w, h: img.h }))
  const videos: MediaItem[] = project.videos.map(vid => ({ type: 'video', src: `/videos/${project.id}/${vid.src}`, w: vid.w, h: vid.h }))

  const media: MediaItem[] = []
  if (videos.length === 0) {
    media.push(...images)
  } else {
    const stride = Math.max(1, Math.floor(images.length / (videos.length + 1)))
    let vidIdx = 0
    for (let i = 0; i < images.length; i++) {
      media.push(images[i])
      if (vidIdx < videos.length && (i + 1) % stride === 0 && i !== 0) {
        media.push(videos[vidIdx++])
      }
    }
    // Append any remaining videos
    while (vidIdx < videos.length) {
      media.push(videos[vidIdx++])
    }
  }

  const [mediaIndex, setMediaIndex] = useState(0)
  const [isClosing, setIsClosing] = useState(false)
  const detailRef = useRef<HTMLDivElement>(null)
  const overlayRef = useRef<HTMLDivElement>(null)
  const imageAreaRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const currentImageRef = useRef<HTMLDivElement>(null)
  const mediaIndexRef = useRef(mediaIndex)
  mediaIndexRef.current = mediaIndex

  useEffect(() => {
    setMediaIndex(0)
  }, [project.id])

  const currentMedia = media[mediaIndex]
  const isPortrait = currentMedia ? currentMedia.w / currentMedia.h < 1.0 : false
  const progressFillRef = useRef<HTMLDivElement>(null)
  const progressTweenRef = useRef<gsap.core.Tween | null>(null)

  // Open animation
  useGSAP(() => {
    if (!detailRef.current || !overlayRef.current || !imageAreaRef.current) return

    const tl = gsap.timeline()

    gsap.set(detailRef.current, { opacity: 0 })
    gsap.set(contentRef.current, { opacity: 0 })

    tl.to(detailRef.current, {
      opacity: 1,
      duration: detailTransitions.open.duration,
      ease: detailTransitions.open.ease,
    })

    tl.to(contentRef.current, {
      opacity: 1,
      duration: detailTransitions.uiFadeIn.duration,
    }, detailTransitions.uiFadeIn.delay)
  }, { scope: detailRef })

  const handleClose = useCallback(() => {
    if (isClosing) return
    setIsClosing(true)

    const tl = gsap.timeline({ onComplete: onClose })

    tl.to(detailRef.current, {
      opacity: 0,
      duration: detailTransitions.close.duration,
      ease: detailTransitions.close.ease,
    })
  }, [isClosing, onClose, sourceRect])

  const navigateMedia = useCallback((dir: number) => {
    const idx = mediaIndexRef.current
    const next = idx + dir
    if (next < 0 || next >= media.length) return

    gsap.to(currentImageRef.current, {
      opacity: 0,
      duration: detailTransitions.imageCrossfade.duration,
      ease: detailTransitions.imageCrossfade.ease,
      onComplete: () => {
        setMediaIndex(next)
      },
    })
  }, [media.length])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose()
      if (e.key === 'ArrowLeft') navigateMedia(-1)
      if (e.key === 'ArrowRight') navigateMedia(1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [handleClose, navigateMedia])

  // Auto-advance: 6s for images, wait for video to end
  const autoAdvanceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isVideoPlaying = useRef(false)

  const clearAutoAdvance = useCallback(() => {
    if (autoAdvanceRef.current) clearTimeout(autoAdvanceRef.current)
    autoAdvanceRef.current = null
  }, [])

  const advanceNext = useCallback(() => {
    const idx = mediaIndexRef.current
    if (idx < media.length - 1) {
      navigateMedia(1)
    } else {
      // Last asset — go to next project
      const currentIdx = carouselProjects.findIndex(p => p.id === project.id)
      const nextIdx = (currentIdx + 1) % carouselProjects.length
      gsap.to(imageAreaRef.current, {
        opacity: 0,
        duration: 0.3,
        ease: 'power2.in',
        onComplete: () => {
          onNextProject(carouselProjects[nextIdx])
          requestAnimationFrame(() => {
            gsap.to(imageAreaRef.current, {
              opacity: 1,
              duration: 0.4,
              ease: 'power2.out',
            })
          })
        },
      })
    }
  }, [media.length, navigateMedia, carouselProjects, project.id, onNextProject])

  const scheduleImageAdvance = useCallback(() => {
    clearAutoAdvance()
    autoAdvanceRef.current = setTimeout(advanceNext, 5000)
  }, [clearAutoAdvance, advanceNext])

  const handleVideoEnded = useCallback(() => {
    isVideoPlaying.current = false
    advanceNext()
  }, [advanceNext])

  // Animate progress bar from current segment start to end
  const animateProgress = useCallback((duration: number) => {
    if (!progressFillRef.current || media.length <= 1) return
    if (progressTweenRef.current) progressTweenRef.current.kill()
    const startPct = (mediaIndex / media.length) * 100
    const endPct = ((mediaIndex + 1) / media.length) * 100
    gsap.set(progressFillRef.current, { width: `${startPct}%` })
    progressTweenRef.current = gsap.to(progressFillRef.current, {
      width: `${endPct}%`,
      duration,
      ease: 'none',
    })
  }, [mediaIndex, media.length])

  // On media change, set up auto-advance based on type
  useEffect(() => {
    clearAutoAdvance()
    isVideoPlaying.current = false
    const cur = media[mediaIndex]
    if (cur && cur.type === 'image') {
      scheduleImageAdvance()
      animateProgress(5)
    }
    // For videos, progress is driven by onLoadedMetadata
    return () => {
      clearAutoAdvance()
      if (progressTweenRef.current) progressTweenRef.current.kill()
    }
  }, [mediaIndex, media, clearAutoAdvance, scheduleImageAdvance, animateProgress])

  // Hide UI after 3s of idle, show on any interaction
  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const uiVisible = useRef(true)

  const hideUI = useCallback(() => {
    if (!uiVisible.current) return
    uiVisible.current = false
    gsap.to(contentRef.current, { opacity: 0, duration: 0.4, ease: 'power2.out' })
  }, [])

  const showUI = useCallback(() => {
    if (uiVisible.current) {
      // Already visible — just reset the timer
      if (idleTimer.current) clearTimeout(idleTimer.current)
      idleTimer.current = setTimeout(hideUI, 4000)
      return
    }
    uiVisible.current = true
    gsap.to(contentRef.current, { opacity: 1, duration: 0.3, ease: 'power2.out' })
    if (idleTimer.current) clearTimeout(idleTimer.current)
    idleTimer.current = setTimeout(hideUI, 4000)
  }, [hideUI])

  useEffect(() => {
    idleTimer.current = setTimeout(hideUI, 4000)
    const onActivity = () => showUI()
    window.addEventListener('mousemove', onActivity)
    window.addEventListener('keydown', onActivity)
    window.addEventListener('click', onActivity)
    return () => {
      if (idleTimer.current) clearTimeout(idleTimer.current)
      window.removeEventListener('mousemove', onActivity)
      window.removeEventListener('keydown', onActivity)
      window.removeEventListener('click', onActivity)
    }
  }, [hideUI, showUI])

  const handleNextProject = () => {
    const currentIdx = carouselProjects.findIndex(p => p.id === project.id)
    const nextIdx = (currentIdx + 1) % carouselProjects.length
    // Fade out current content, then swap project
    gsap.to(imageAreaRef.current, {
      opacity: 0,
      duration: 0.3,
      ease: 'power2.in',
      onComplete: () => {
        onNextProject(carouselProjects[nextIdx])
        // Fade back in after React re-renders with new project
        requestAnimationFrame(() => {
          gsap.to(imageAreaRef.current, {
            opacity: 1,
            duration: 0.4,
            ease: 'power2.out',
          })
        })
      },
    })
  }

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) handleClose()
  }

  // First sentence for description
  const shortDesc = project.description.split(/\.(?:\s|$)/)[0] + '.'

  return (
    <div ref={detailRef} className={styles.detail} onClick={handleBackdropClick}>
      <div ref={overlayRef} className={styles.detailOverlay} />
      <div ref={imageAreaRef} className={styles.detailImageArea}>
        <button className={styles.detailClose} onClick={handleClose} aria-label="Close">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        <div ref={currentImageRef} className={styles.detailImageWrap} style={{ opacity: 0 }}>
          {currentMedia && currentMedia.type === 'image' && (
            <Image
              key={`${project.id}-img-${mediaIndex}`}
              src={currentMedia.src}
              alt={`${project.title} — ${mediaIndex + 1}`}
              fill
              className={isPortrait ? styles.imageContain : styles.imageCover}
              sizes={isPortrait ? '50vw' : '100vw'}
              priority
              onLoad={() => {
                gsap.fromTo(currentImageRef.current,
                  { opacity: 0 },
                  { opacity: 1, duration: 0.5, ease: 'power2.out' }
                )
              }}
            />
          )}
          {currentMedia && currentMedia.type === 'video' && (
            <video
              key={`${project.id}-vid-${mediaIndex}`}
              src={currentMedia.src}
              className={isPortrait ? styles.imageContain : styles.imageCover}
              autoPlay
              muted
              playsInline
              onLoadedData={(e) => {
                isVideoPlaying.current = true
                const vid = e.currentTarget
                animateProgress(vid.duration || 30)
                gsap.fromTo(currentImageRef.current,
                  { opacity: 0 },
                  { opacity: 1, duration: 0.5, ease: 'power2.out' }
                )
              }}
              onEnded={handleVideoEnded}
            />
          )}
        </div>

        <div className={styles.detailGradient} />

        {/* Left/right image navigation */}
        <div className={styles.detailImageNav}>
          <button
            className={styles.detailArrow}
            onClick={() => navigateMedia(-1)}
            disabled={mediaIndex === 0}
            aria-label="Previous image"
          >
            <span style={{ transform: 'rotate(-90deg)', display: 'flex' }}><ArrowUp /></span>
          </button>
          <button
            className={styles.detailArrow}
            onClick={() => navigateMedia(1)}
            disabled={mediaIndex === media.length - 1}
            aria-label="Next image"
          >
            <span style={{ transform: 'rotate(90deg)', display: 'flex' }}><ArrowUp /></span>
          </button>
        </div>

        {/* Bottom content */}
        <div ref={contentRef} className={styles.detailContent}>
          <div className={styles.detailBottom}>
            <div className={styles.detailMeta}>
              <div className={styles.detailLabel}>featured project:</div>
              <h2 className={styles.detailTitle}>{project.title}</h2>
              <p className={styles.detailDescription}>{shortDesc}</p>
            </div>
            <div className={styles.detailActions}>
              {project.url && (
                <a
                  href={project.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.detailPill}
                >
                  view live site
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                    <polyline points="15 3 21 3 21 9" />
                    <line x1="10" y1="14" x2="21" y2="3" />
                  </svg>
                </a>
              )}
              <button className={styles.detailPill} onClick={handleNextProject}>
                next project
                <span style={{ transform: 'rotate(90deg)', display: 'flex' }}><ArrowUp /></span>
              </button>
            </div>
          </div>
          <div className={styles.detailProgress}>
            <div
              ref={progressFillRef}
              className={styles.detailProgressFill}
              style={{ width: '0%' }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
