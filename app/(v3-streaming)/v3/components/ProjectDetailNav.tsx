'use client'

import styles from '../v3.module.css'

interface ProjectDetailNavProps {
  currentIndex: number
  total: number
  onPrev: () => void
  onNext: () => void
}

export default function ProjectDetailNav({
  currentIndex,
  total,
  onPrev,
  onNext,
}: ProjectDetailNavProps) {
  return (
    <div className={styles.detailImageNav}>
      <button
        className={styles.detailArrow}
        onClick={onPrev}
        disabled={currentIndex === 0}
        aria-label="Previous image"
      >
        &#8249;
      </button>
      <button
        className={styles.detailArrow}
        onClick={onNext}
        disabled={currentIndex === total - 1}
        aria-label="Next image"
      >
        &#8250;
      </button>
    </div>
  )
}
