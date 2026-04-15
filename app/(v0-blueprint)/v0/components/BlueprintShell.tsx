'use client'

import { useRef } from 'react'
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

  useGSAP(
    () => {
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
    { scope: ref, dependencies: [pathname], revertOnUpdate: true }
  )

  return <div ref={ref}>{children}</div>
}
