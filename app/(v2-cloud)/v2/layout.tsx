import { DM_Mono, DM_Sans } from 'next/font/google'

const dmMono = DM_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-mono',
  display: 'swap',
})

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500'],
  variable: '--font-sans',
  display: 'swap',
})

export default function V2Layout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className={`${dmMono.variable} ${dmSans.variable}`}>
      {children}
    </div>
  )
}
