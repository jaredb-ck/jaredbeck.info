'use client'

import { useState, useRef, useEffect } from 'react'
import gsap from 'gsap'
import changelogData from '@/data/changelog.json'
import type { ChangelogEntry } from '@/types'
import { usePreloader } from './usePreloader'
import styles from './Preloader.module.css'

const versions = changelogData as ChangelogEntry[]
const currentEntry = versions[0]
const currentVersionLabel = currentEntry
  ? `${currentEntry.version}/${currentEntry.name.toLowerCase()}`
  : 'v0'

const CIRCUMFERENCE = 2 * Math.PI * 75 // ~471

/** J logo with progress circle — matches logo.svg proportions exactly.
 *  Circle stroke fills clockwise from the top as progress goes 0→100. */
function LogoProgress({ progress }: { progress: number }) {
  const offset = CIRCUMFERENCE * (1 - progress / 100)
  return (
    <svg width="80" height="80" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Static track circle — matches logo ring position */}
      <circle cx="100" cy="100" r="75" stroke="rgba(240,240,240,0.08)" strokeWidth="16.67" fill="none" />
      {/* Progress fill — starts from top (rotate -90deg), fills clockwise */}
      <circle
        className={styles.progressRing}
        cx="100" cy="100" r="75"
        stroke="#f0f0f0" strokeWidth="16.67" fill="none"
        strokeDasharray={CIRCUMFERENCE}
        strokeDashoffset={offset}
      />
      {/* J letterform */}
      <path
        d="M116.646 123.608C116.646 137.071 105.744 147.982 92.2809 147.982C78.8187 147.981 67.9157 137.07 67.9157 123.608V115.267H84.5827V123.608C84.5827 127.866 88.0235 131.314 92.2809 131.315C96.5389 131.315 99.9792 127.866 99.9792 123.608V74.9997H116.646V123.608ZM108.334 49.9997C112.936 49.9999 116.667 53.7314 116.667 58.3337C116.667 62.9358 112.936 66.6665 108.334 66.6667C103.731 66.6667 99.9998 62.9359 99.9997 58.3337C99.9997 53.7313 103.731 49.9997 108.334 49.9997Z"
        fill="#f0f0f0"
      />
    </svg>
  )
}

export default function Preloader() {
  const { progress, isComplete } = usePreloader()
  const [visible, setVisible] = useState(true)
  const containerRef = useRef<HTMLDivElement>(null)
  const hasExited = useRef(false)

  useEffect(() => {
    if (!isComplete || hasExited.current) return
    hasExited.current = true

    const container = containerRef.current
    if (!container) return

    const holdTimer = setTimeout(() => {
      // Reveal page content behind the preloader before fading
      window.dispatchEvent(new CustomEvent('preloader:complete'))

      const tl = gsap.timeline({
        onComplete: () => {
          setVisible(false)
        },
      })

      // Blur and fade the preloader — page content comes into focus behind it
      tl.to(container, {
        opacity: 0,
        filter: 'blur(20px)',
        duration: 0.8,
        ease: 'power2.inOut',
      }, 0)
    }, 300)

    return () => clearTimeout(holdTimer)
  }, [isComplete])

  if (!visible) return null

  return (
    <div ref={containerRef} className={styles.preloader}>
      <LogoProgress progress={progress} />
      <span className={styles.versionLabel}>
        loading {currentVersionLabel}
      </span>
    </div>
  )
}
