// LOCKED FILE — never modify except for explicit user instruction.
// Reads versions from changelog.json automatically — no hardcoded list.
// Logo click returns to the current version's homepage via popstate so
// each version SPA can animate the transition in its own style.
'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import changelogData from '@/data/changelog.json'
import type { ChangelogEntry } from '@/types'
import styles from './VersionSwitcher.module.css'

const versions = changelogData as ChangelogEntry[]

export default function VersionSwitcher() {
  const pathname = usePathname()

  const activeHref = versions.find(entry => {
    const href = `/${entry.version}`
    return pathname === href || pathname.startsWith(`${href}/`)
  })
  const logoHref = activeHref ? `/${activeHref.version}` : `/${versions[0]?.version ?? ''}`

  // The SPA manages its own URL via history.pushState without going through the
  // Next.js router, so usePathname() may lag behind window.location.pathname.
  // When the logo is clicked from a version sub-path (e.g. /v0/projects/some-id),
  // intercept the Link navigation, push the version root into history, and
  // dispatch a popstate event — every version SPA already has a popstate handler
  // that closes any open view and returns to the list.
  const handleLogoClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (typeof window === 'undefined') return
    const currentPath = window.location.pathname
    if (currentPath === logoHref) return
    if (currentPath.startsWith(logoHref + '/')) {
      e.preventDefault()
      window.history.pushState(null, '', logoHref)
      window.dispatchEvent(new PopStateEvent('popstate'))
    }
    // Otherwise let Next.js Link navigate normally (e.g. cross-version jump)
  }

  return (
    <nav className={styles.switcher} aria-label="Version switcher">

      <Link href={logoHref} className={styles.logoLink} aria-label="Home" onClick={handleLogoClick}>
        <Image src="/logo.svg" alt="" width={24} height={24} className={styles.logo} priority aria-hidden="true" />
      </Link>

      <div className={styles.group}>
        <span className={styles.label}>Version:</span>
        {versions.map((entry) => {
          const href = `/${entry.version}`
          const isActive = pathname === href || pathname.startsWith(`${href}/`)
          return (
            <Link
              key={entry.version}
              href={href}
              className={`${styles.pill} ${isActive ? styles.pillActive : ''}`}
              aria-current={isActive ? 'page' : undefined}
            >
              {entry.version}
              <Image src="/arrow-dropdown.svg" alt="" width={16} height={16} className={styles.icon} aria-hidden="true" />
            </Link>
          )
        })}
      </div>

      <Link href="/changelog" className={`${styles.pill} ${styles.pillActive}`}>
        change-log
        <Image src="/arrow-external.svg" alt="" width={16} height={16} className={styles.icon} aria-hidden="true" />
      </Link>

    </nav>
  )
}
