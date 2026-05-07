'use client'

import styles from './Lightbox.module.css'

interface Props {
  currentIndex: number
  totalCount: number
  onPrev: () => void
  onNext: () => void
}

export default function LightboxNav({
  currentIndex,
  totalCount,
  onPrev,
  onNext,
}: Props) {
  const pad = (n: number) => String(n).padStart(2, '0')

  return (
    <>
      <button
        className={styles.navArrow}
        style={{ left: 20 }}
        onClick={onPrev}
        aria-label="Previous image"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 18 9 12 15 6" />
        </svg>
      </button>
      <button
        className={styles.navArrow}
        style={{ right: 20 }}
        onClick={onNext}
        aria-label="Next image"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </button>
      <span className={styles.counter}>
        {pad(currentIndex + 1)} / {pad(totalCount)}
      </span>
    </>
  )
}
