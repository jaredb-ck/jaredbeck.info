'use client'

import styles from '../v3.module.css'

interface HeroProgressProps {
  total: number
  activeIndex: number
}

export default function HeroProgress({ total, activeIndex }: HeroProgressProps) {
  return (
    <div className={styles.heroProgress}>
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} className={styles.heroProgressSegment}>
          <div
            className={`${styles.heroProgressFill} ${
              i === activeIndex
                ? styles.heroProgressFillActive
                : i < activeIndex
                  ? styles.heroProgressFillDone
                  : ''
            }`}
          />
        </div>
      ))}
    </div>
  )
}
