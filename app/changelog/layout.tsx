// LOCKED FILE — never modify.
// The changelog has its own permanent visual identity, separate from all versions.
// This layout loads the changelog's own fixed font and wraps all changelog routes.

import type { Metadata } from 'next'
import { Newsreader } from 'next/font/google'
import styles from './changelog.module.css'

const newsreader = Newsreader({
  subsets: ['latin'],
  weight: ['400', '500'],
  style: ['normal', 'italic'],
  variable: '--font-newsreader',
})

export const metadata: Metadata = {
  title: 'Changelog — Living Portfolio',
  description: 'Version history for the Living Portfolio — every design direction, constraint, and process note.',
}

export default function ChangelogLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className={`${styles.wrap} ${newsreader.variable}`}>
      {children}
    </div>
  )
}
