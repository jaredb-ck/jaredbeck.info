'use client'

import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import Image from 'next/image'
import gsap from 'gsap'
import type { Project, ImageAsset, VideoAsset } from '@/types'
import LightboxNav from './LightboxNav'
import MetadataStrip from './MetadataStrip'
import styles from './Lightbox.module.css'

interface MediaItem {
  type: 'image' | 'video'
  asset: ImageAsset | VideoAsset
  index: number // original index in images[] or videos[]
}

interface Props {
  project: Project
  initialMediaType: 'image' | 'video'
  initialMediaIndex: number
  startRect: DOMRect | null
  query: string
  fromSearch: boolean
  onClose: () => void
}

function computeTargetRect(aspect: number) {
  const vw = window.innerWidth
  const vh = window.innerHeight
  const maxW = vw * 0.8
  const maxH = vh * 0.65
  let w = maxW
  let h = w / aspect
  if (h > maxH) {
    h = maxH
    w = h * aspect
  }
  return {
    width: w,
    height: h,
    left: (vw - w) / 2,
    top: (vh - h) / 2 - 20,
  }
}

export default function Lightbox({
  project,
  initialMediaType,
  initialMediaIndex,
  startRect,
  query,
  fromSearch,
  onClose,
}: Props) {
  // Build a combined media list: all images then all videos
  const mediaList = useMemo<MediaItem[]>(() => {
    const items: MediaItem[] = []
    for (let i = 0; i < project.images.length; i++) {
      items.push({ type: 'image', asset: project.images[i], index: i })
    }
    for (let i = 0; i < project.videos.length; i++) {
      items.push({ type: 'video', asset: project.videos[i], index: i })
    }
    return items
  }, [project])

  // Find the initial position in the combined list
  const initialPos = useMemo(() => {
    const idx = mediaList.findIndex(
      m => m.type === initialMediaType && m.index === initialMediaIndex,
    )
    return idx >= 0 ? idx : 0
  }, [mediaList, initialMediaType, initialMediaIndex])

  const [currentPos, setCurrentPos] = useState(initialPos)
  const [animatingIn, setAnimatingIn] = useState(!!startRect)
  const isTransitioning = useRef(false)
  const overlayRef = useRef<HTMLDivElement>(null)
  const flyRef = useRef<HTMLDivElement>(null)
  const mediaRef = useRef<HTMLDivElement>(null)
  const metaRef = useRef<HTMLDivElement>(null)
  const isClosing = useRef(false)

  const currentMedia = mediaList[currentPos]
  const curAspect = currentMedia.asset.w / currentMedia.asset.h

  const handleMediaLoad = useCallback(() => {
    const el = mediaRef.current
    if (!el) return
    gsap.to(el, {
      opacity: 1,
      duration: 0.25,
      ease: 'power2.out',
      onComplete: () => { isTransitioning.current = false },
    })
  }, [])

  // Entrance animation
  useEffect(() => {
    const overlay = overlayRef.current
    if (!overlay) return

    if (startRect && flyRef.current) {
      const flyEl = flyRef.current
      const target = computeTargetRect(curAspect)

      gsap.set(overlay, { opacity: 0 })
      gsap.set(flyEl, {
        left: startRect.left,
        top: startRect.top,
        width: startRect.width,
        height: startRect.height,
        opacity: 1,
      })

      const tl = gsap.timeline({
        onComplete: () => setAnimatingIn(false),
      })

      tl.to(overlay, { opacity: 1, duration: 0.5, ease: 'power2.out' }, 0)
      tl.to(flyEl, {
        left: target.left, top: target.top,
        width: target.width, height: target.height,
        duration: 0.55, ease: 'power3.inOut',
      }, 0)

      if (metaRef.current) {
        gsap.set(metaRef.current, { opacity: 0, y: 10 })
        tl.to(metaRef.current, { opacity: 1, y: 0, duration: 0.3, ease: 'power2.out' }, 0.45)
      }
    } else {
      gsap.set(overlay, { opacity: 0 })
      gsap.to(overlay, { opacity: 1, duration: 0.3, ease: 'power2.out' })
      if (metaRef.current) {
        gsap.set(metaRef.current, { opacity: 0, y: 10 })
        gsap.to(metaRef.current, { opacity: 1, y: 0, duration: 0.4, delay: 0.2, ease: 'power2.out' })
      }
      setAnimatingIn(false)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const close = useCallback(() => {
    if (isClosing.current) return
    isClosing.current = true
    const overlay = overlayRef.current
    if (overlay) {
      gsap.to(overlay, { opacity: 0, duration: 0.25, ease: 'power2.in', onComplete: onClose })
    } else {
      onClose()
    }
  }, [onClose])

  const goTo = useCallback((pos: number) => {
    if (isTransitioning.current) return
    const total = mediaList.length
    const next = ((pos % total) + total) % total
    isTransitioning.current = true

    const el = mediaRef.current
    if (!el) {
      setCurrentPos(next)
      isTransitioning.current = false
      return
    }

    gsap.to(el, {
      opacity: 0,
      duration: 0.2,
      ease: 'power2.in',
      onComplete: () => setCurrentPos(next),
    })
  }, [mediaList.length])

  // Keyboard navigation
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
      if (e.key === 'ArrowLeft') goTo(currentPos - 1)
      if (e.key === 'ArrowRight') goTo(currentPos + 1)
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [close, currentPos, goTo])

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) close()
  }

  const target = typeof window !== 'undefined'
    ? computeTargetRect(curAspect)
    : { width: 800, height: 600, left: 0, top: 0 }

  // Resolve the path for the current media
  const mediaSrc = currentMedia.type === 'image'
    ? `/images/${project.id}/${currentMedia.asset.src}`
    : `/videos/${project.id}/${currentMedia.asset.src}`

  // Also for the flying entrance element
  const initialMedia = mediaList[initialPos]
  const flySrc = initialMedia.type === 'image'
    ? `/images/${project.id}/${initialMedia.asset.src}`
    : `/videos/${project.id}/${initialMedia.asset.src}`

  return (
    <div
      ref={overlayRef}
      className={styles.overlay}
      onClick={handleOverlayClick}
      role="dialog"
      aria-label={`${project.title} lightbox`}
      aria-modal="true"
    >
      <button className={styles.closeBtn} onClick={close} aria-label="Close lightbox">
        &times;
      </button>

      {/* Flying element — visible during entrance animation */}
      {animatingIn && startRect && (
        <div ref={flyRef} className={styles.flyImage}>
          {initialMedia.type === 'video' ? (
            <video src={flySrc} autoPlay muted loop playsInline style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <Image src={flySrc} alt="" fill sizes="80vw" style={{ objectFit: 'cover' }} priority />
          )}
        </div>
      )}

      {/* Static content — pinned at target position */}
      <div
        className={styles.content}
        style={{ opacity: animatingIn ? 0 : 1, left: target.left, top: target.top }}
      >
        <div
          ref={mediaRef}
          className={styles.imageWrap}
          style={{ width: target.width, height: target.height }}
        >
          {currentMedia.type === 'video' ? (
            <video
              key={mediaSrc}
              src={mediaSrc}
              autoPlay
              muted
              loop
              playsInline
              onLoadedData={handleMediaLoad}
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
            />
          ) : (
            <Image
              src={mediaSrc}
              alt={`${project.title} — ${currentPos + 1} of ${mediaList.length}`}
              fill
              sizes="80vw"
              style={{ objectFit: 'contain' }}
              priority
              onLoad={handleMediaLoad}
            />
          )}
        </div>
      </div>

      <div ref={metaRef} className={styles.metaFixed}>
        <MetadataStrip
          title={project.title}
          year={project.year}
          medium={project.medium}
          role={project.role}
          query={query}
        />
        {fromSearch && (
          <p className={styles.searchNote}>Showing all work from {project.title}</p>
        )}
      </div>

      <LightboxNav
        currentIndex={currentPos}
        totalCount={mediaList.length}
        onPrev={() => goTo(currentPos - 1)}
        onNext={() => goTo(currentPos + 1)}
      />
    </div>
  )
}
