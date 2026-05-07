import { DM_Sans, DM_Mono } from 'next/font/google'
import type { Metadata } from 'next'

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm-sans',
  display: 'swap',
})

const dmMono = DM_Mono({
  subsets: ['latin'],
  weight: ['300', '400', '500'],
  variable: '--font-dm-mono',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'V3: Streaming — The Living Portfolio',
}

export default function V3Layout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className={`${dmSans.variable} ${dmMono.variable}`}>
      {children}
    </div>
  )
}
