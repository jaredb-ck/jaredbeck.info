'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import styles from './Nav.module.css'

const links = [
  { href: '/v0', label: 'work' },
  { href: '/v0/about', label: 'about' },
  { href: '/v0/cv', label: 'cv' },
]

export default function Nav() {
  const pathname = usePathname()

  return (
    <header className={styles.header}>
      <nav className={styles.nav} aria-label="Primary navigation">
        {links.map(({ href, label }) => {
          const isActive =
            href === '/v0' ? pathname === '/v0' : pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={`${styles.link} ${isActive ? styles.active : ''}`}
              aria-current={isActive ? 'page' : undefined}
            >
              {label}
            </Link>
          )
        })}
      </nav>
      <Link href="/changelog" className={styles.badge}>
        v0: Blueprint ↗
      </Link>
    </header>
  )
}
