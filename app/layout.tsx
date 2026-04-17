// ROOT LAYOUT — LOCKED FILE. Never modify this file except to mount
// permanent infrastructure (BetaBanner, VersionSwitcher, Preloader).

import type { Metadata } from 'next'
import BetaBanner from './components/BetaBanner'
import VersionSwitcher from './components/VersionSwitcher'
import PreloaderWrapper from './components/Preloader/PreloaderWrapper'
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
        <PreloaderWrapper />
        <BetaBanner />
        <VersionSwitcher />
        {children}
      </body>
    </html>
  )
}
