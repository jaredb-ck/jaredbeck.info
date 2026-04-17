'use client'

import { useState, useRef, useEffect } from 'react'
import gsap from 'gsap'
import { usePreloader } from './usePreloader'
import styles from './Preloader.module.css'

export default function Preloader() {
  const { progress, isComplete } = usePreloader()
  const [visible, setVisible] = useState(true)
  const containerRef = useRef<HTMLDivElement>(null)
  const percentRef = useRef<HTMLDivElement>(null)
  const barRef = useRef<HTMLDivElement>(null)
  const hasExited = useRef(false)

  useEffect(() => {
    if (!isComplete || hasExited.current) return
    hasExited.current = true

    const container = containerRef.current
    const percent = percentRef.current
    const bar = barRef.current
    if (!container || !percent || !bar) return

    // Hold for 300ms, then run exit sequence
    const holdTimer = setTimeout(() => {
      const tl = gsap.timeline({
        onComplete: () => {
          setVisible(false)
          window.dispatchEvent(new CustomEvent('preloader:complete'))
        },
      })

      // Step 1: Fade percentage counter
      tl.to(percent, { opacity: 0, duration: 0.2, ease: 'power1.out' }, 0)

      // Step 2: Fill progress bar to 100%
      tl.to(bar, { width: '100%', duration: 0.15, ease: 'power2.out' }, 0)

      // Step 3: Slide entire panel up off screen
      tl.to(container, {
        y: '-100vh',
        duration: 0.7,
        ease: 'power3.inOut',
      }, '+=0.1')
    }, 300)

    return () => clearTimeout(holdTimer)
  }, [isComplete])

  if (!visible) return null

  return (
    <div
      ref={containerRef}
      className={styles.preloader}
    >
      <div className={styles.rule} />
      <div
        ref={barRef}
        className={styles.progressBar}
        style={{ '--progress': progress } as React.CSSProperties}
      />
      <div ref={percentRef} className={styles.percentage}>
        {progress}%
      </div>
    </div>
  )
}
