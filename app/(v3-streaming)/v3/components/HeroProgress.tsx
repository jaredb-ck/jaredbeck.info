'use client'

import styles from '../v3.module.css'

interface HeroProgressProps {
  total: number
  activeIndex: number
}

export default function HeroProgress({ total, activeIndex }: HeroProgressProps) {
  return (
    <div className={styles.heroIndicator}>
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={`${styles.heroIndicatorSegment} ${
            i === activeIndex ? styles.heroIndicatorSegmentActive : ''
          }`}
        >
          {i === activeIndex && (
            <div className={`${styles.heroIndicatorFill} ${styles.heroIndicatorFillActive}`} />
          )}
        </div>
      ))}
    </div>
  )
}
