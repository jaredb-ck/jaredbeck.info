'use client'

import { useRef, useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'

gsap.registerPlugin(useGSAP)

export default function BlueprintShell({
  children,
}: {
  children: React.ReactNode
}) {
  const ref = useRef<HTMLDivElement>(null)
  const pathname = usePathname()
  const [preloaderDone, setPreloaderDone] = useState(false)

  // Wait for the preloader to finish before running entrance animations.
  // Future versions should listen for 'preloader:complete' the same way.
  useEffect(() => {
    const handler = () => setPreloaderDone(true)
    window.addEventListener('preloader:complete', handler)
    return () => window.removeEventListener('preloader:complete', handler)
  }, [])

  useGSAP(
    () => {
      if (!preloaderDone) return

      const rows = ref.current?.querySelectorAll('[data-row]') ?? []

      if (rows.length > 0) {
        // Staggered row reveal — document loading, not site transitioning
        gsap.from(rows, {
          opacity: 0,
          y: 4,
          duration: 0.28,
          stagger: 0.055,
          ease: 'power2.out',
        })
      } else {
        // Fallback: simple fade for pages without discrete rows
        gsap.from(ref.current, {
          opacity: 0,
          y: 6,
          duration: 0.32,
          ease: 'power2.out',
        })
      }
    },
    { scope: ref, dependencies: [pathname, preloaderDone], revertOnUpdate: true }
  )

  return <div ref={ref}>{children}</div>
}
