// ROOT LAYOUT — LOCKED FILE. Never modify this file.
// Contains only two permanent elements: BetaBanner and VersionSwitcher.
// These live outside and above all version UIs, forever.

import type { Metadata } from 'next'
import BetaBanner from './components/BetaBanner'
import VersionSwitcher from './components/VersionSwitcher'
import './globals.css'

export const metadata: Metadata = {
  title: 'Living Portfolio',
  description: 'A graphic design portfolio in permanent beta.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <BetaBanner />
        <VersionSwitcher />
        {children}
      </body>
    </html>
  )
}
