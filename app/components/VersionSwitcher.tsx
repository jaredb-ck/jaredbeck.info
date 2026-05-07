// LOCKED FILE — never modify except for explicit user instruction.
// Reads versions from changelog.json automatically — no hardcoded list.
// Logo click triggers a hard refresh to the current version's root.
'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import changelogData from '@/data/changelog.json'
import type { ChangelogEntry } from '@/types'
import styles from './VersionSwitcher.module.css'

const versions = changelogData as ChangelogEntry[]

export default function VersionSwitcher() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [trayPos, setTrayPos] = useState({ top: 0, left: 0 })
  const triggerRef = useRef<HTMLButtonElement>(null)
  const trayRef = useRef<HTMLDivElement>(null)

  const activeEntry = versions.find(entry => {
    const href = `/${entry.version}`
    return pathname === href || pathname.startsWith(`${href}/`)
  })
  const activeLabel = activeEntry
    ? `${activeEntry.version}/${activeEntry.name.toLowerCase()}`
    : `${versions[0]?.version ?? ''}/${versions[0]?.name.toLowerCase() ?? ''}`
  const logoHref = activeEntry ? `/${activeEntry.version}` : `/${versions[0]?.version ?? ''}`

  const handleLogoClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault()
    window.location.href = logoHref
  }

  const toggleDropdown = useCallback(() => {
    setOpen(prev => {
      if (!prev && triggerRef.current) {
        const rect = triggerRef.current.getBoundingClientRect()
        setTrayPos({ top: rect.bottom + 4, left: rect.left })
      }
      return !prev
    })
  }, [])

  // Close on click outside or Escape
  useEffect(() => {
    if (!open) return
    const handleClick = (e: MouseEvent) => {
      const target = e.target as Node
      if (
        triggerRef.current?.contains(target) ||
        trayRef.current?.contains(target)
      ) return
      setOpen(false)
    }
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('mousedown', handleClick)
      document.removeEventListener('keydown', handleKey)
    }
  }, [open])

  return (
    <nav className={styles.switcher} aria-label="Version switcher">

      <Link href={logoHref} className={styles.logoLink} aria-label="Home" onClick={handleLogoClick}>
        <svg className={styles.logo} width="32" height="32" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <circle className={styles.logoRingStatic} cx="100" cy="100" r="75" stroke="#D9D9D9" strokeWidth="16.67" fill="none" />
          <circle
            className={styles.logoRingSpin}
            cx="100" cy="100" r="75"
            stroke="#D9D9D9" strokeWidth="16.67" fill="none"
            strokeDasharray="118 353"
            strokeLinecap="round"
          />
          <path d="M116.646 123.608C116.646 137.071 105.744 147.982 92.2809 147.982C78.8187 147.981 67.9157 137.07 67.9157 123.608V115.267H84.5827V123.608C84.5827 127.866 88.0235 131.314 92.2809 131.315C96.5389 131.315 99.9792 127.866 99.9792 123.608V74.9997H116.646V123.608ZM108.334 49.9997C112.936 49.9999 116.667 53.7314 116.667 58.3337C116.667 62.9358 112.936 66.6665 108.334 66.6667C103.731 66.6667 99.9998 62.9359 99.9997 58.3337C99.9997 53.7313 103.731 49.9997 108.334 49.9997Z" fill="#D9D9D9" />
        </svg>
      </Link>

      <div className={styles.group}>
        <span className={styles.label}>Version:</span>
        <button
          ref={triggerRef}
          className={`${styles.pill} ${styles.pillActive}`}
          onClick={toggleDropdown}
          aria-expanded={open}
          aria-haspopup="listbox"
        >
          {activeLabel}
          <Image
            src="/arrow-dropdown.svg"
            alt=""
            width={16}
            height={16}
            className={`${styles.icon} ${open ? styles.iconFlipped : ''}`}
            aria-hidden="true"
          />
        </button>
      </div>

      <Link href="/changelog" className={`${styles.pill} ${styles.pillActive}`}>
        change-log
        <Image src="/arrow-external.svg" alt="" width={16} height={16} className={styles.icon} aria-hidden="true" />
      </Link>

      {open && createPortal(
        <div
          ref={trayRef}
          className={styles.dropdownTray}
          style={{ top: trayPos.top, left: trayPos.left }}
          role="listbox"
          aria-label="Select version"
        >
          {versions.map((entry) => {
            const href = `/${entry.version}`
            const isActive = pathname === href || pathname.startsWith(`${href}/`)
            return (
              <a
                key={entry.version}
                href={href}
                className={`${styles.dropdownItem} ${isActive ? styles.dropdownItemActive : ''}`}
                role="option"
                aria-selected={isActive}
                onClick={(e) => {
                  e.preventDefault()
                  setOpen(false)
                  window.location.href = href
                }}
              >
                {entry.version}/{entry.name.toLowerCase()}
              </a>
            )
          })}
        </div>,
        document.body,
      )}

    </nav>
  )
}
