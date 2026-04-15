'use client'

import { useRef } from 'react'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import styles from '../page.module.css'

gsap.registerPlugin(useGSAP)

const SPEEDWAY_URL =
  'https://speedway.press/?utm_source=ig&utm_medium=social&utm_content=link_in_bio&fbclid=PAZXh0bgNhZW0CMTEAc3J0YwZhcHBfaWQMMjU2MjgxMDQwNTU4AAGnN1o5C9Ru4qxX1XG_XV2LojZd90nDFAFgI6K0UmC5MgP36E_QlSXXnPeu3zM_aem_sEjpkFMzzsqTy3nJrkjvCg'

function Words({ text }: { text: string }) {
  return (
    <>
      {text
        .trim()
        .split(/\s+/)
        .map((word, i) => (
          <span key={i} data-word className={styles.heroWord}>
            {word}
          </span>
        ))}
    </>
  )
}

export default function HeroText() {
  const ref = useRef<HTMLHeadingElement>(null)

  useGSAP(
    () => {
      const words = gsap.utils.toArray<HTMLElement>('[data-word]', ref.current)
      if (!words.length) return

      // Group words that share the same top position into lines
      const lineMap = new Map<number, HTMLElement[]>()
      words.forEach(word => {
        const top = Math.round(word.getBoundingClientRect().top)
        if (!lineMap.has(top)) lineMap.set(top, [])
        lineMap.get(top)!.push(word)
      })

      const lines = [...lineMap.values()]

      lines.forEach((lineWords, i) => {
        gsap.from(lineWords, {
          opacity: 0,
          y: 14,
          duration: 0.6,
          delay: i * 0.14,
          ease: 'power3.out',
        })
      })
    },
    { scope: ref }
  )

  return (
    <h1 ref={ref} className={styles.heroDisplay}>
      <Words text="Currently crafting digital experiences with the team at" />
      <a
        href="https://thisisgrow.com/"
        target="_blank"
        rel="noopener noreferrer"
        className={styles.heroLink}
      >
        <span data-word className={styles.heroWord}>Grow,</span>
      </a>
      <Words text="Jared is also ½ of the independent publishing team" />
      <a
        href={SPEEDWAY_URL}
        target="_blank"
        rel="noopener noreferrer"
        className={styles.heroLink}
      >
        <span data-word className={styles.heroWord}>Speedway</span>
        <span data-word className={styles.heroWord}>Press</span>
      </a>
    </h1>
  )
}
