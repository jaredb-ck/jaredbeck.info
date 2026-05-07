import type { Metadata } from 'next'
import { DM_Mono, DM_Sans } from 'next/font/google'
import { versionConfig } from './version.config'
import BlueprintShell from './components/BlueprintShell'
import SmoothScroll from './components/SmoothScroll'
import styles from './layout.module.css'

const mono = DM_Mono({
  subsets: ['latin'],
  weight: ['300', '400', '500'],
  variable: '--font-mono',
})

const sans = DM_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  variable: '--font-sans',
})

export const metadata: Metadata = {
  title: {
    template: '%s — Living Portfolio',
    default: `${versionConfig.name} — Living Portfolio`,
  },
  description: versionConfig.aesthetic,
}

export default function V0Layout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className={`${styles.root} ${mono.variable} ${sans.variable}`}>
      <SmoothScroll>
        <div className={styles.contentWrap}>
          <main>
            <BlueprintShell>{children}</BlueprintShell>
          </main>
        </div>
      </SmoothScroll>
    </div>
  )
}
