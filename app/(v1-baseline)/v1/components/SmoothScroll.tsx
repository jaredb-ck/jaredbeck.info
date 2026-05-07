'use client'

import { useEffect } from 'react'
import Lenis from 'lenis'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { setLenisInstance } from '../lib/smoothScroll'

gsap.registerPlugin(ScrollTrigger)

export default function SmoothScroll({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const isMobile = window.matchMedia('(pointer: coarse) and (hover: none)').matches
    const lenis = new Lenis({
      lerp: 0.08,
      ...(isMobile && {
        syncTouch: true,
        syncTouchLerp: 0.14,
        touchInertiaMultiplier: 100,
        touchInertiaExponent: 1.8,
      }),
    })

    setLenisInstance(lenis)

    // Drive Lenis off GSAP's ticker so ScrollTrigger stays in sync
    const tick = (time: number) => lenis.raf(time * 1000)
    gsap.ticker.add(tick)
    gsap.ticker.lagSmoothing(0)
    lenis.on('scroll', ScrollTrigger.update)

    return () => {
      gsap.ticker.remove(tick)
      lenis.destroy()
      setLenisInstance(null)
    }
  }, [])

  return <>{children}</>
}
