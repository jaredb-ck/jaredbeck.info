'use client'

import { useEffect, useRef } from 'react'
import { DETAIL_SIZES } from '../../lib/preview'
import styles from './page.module.css'

export default function ScrollImages({ count }: { count: number }) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    // Fill from current top edge to bottom of viewport
    const updateHeight = () => {
      const top = el.getBoundingClientRect().top
      el.style.height = `${window.innerHeight - top}px`
    }
    updateHeight()
    window.addEventListener('resize', updateHeight)

    // Lock page scroll so only the image strip scrolls
    const prevOverflow = document.documentElement.style.overflow
    document.documentElement.style.overflow = 'hidden'

    // Route vertical wheel to horizontal scroll
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault()
      el.scrollLeft += e.deltaY + e.deltaX
    }
    el.addEventListener('wheel', handleWheel, { passive: false })

    return () => {
      window.removeEventListener('resize', updateHeight)
      el.style.height = ''
      document.documentElement.style.overflow = prevOverflow
      el.removeEventListener('wheel', handleWheel)
    }
  }, [])

  return (
    <div data-row ref={ref} className={styles.imageScroll}>
      {Array.from({ length: count }, (_, i) => {
        const { ratio } = DETAIL_SIZES[i % DETAIL_SIZES.length]
        return (
          <div
            key={i}
            className={styles.scrollImage}
            style={{ aspectRatio: ratio }}
          />
        )
      })}
    </div>
  )
}
