// LOCKED FILE — never modify except for explicit user instruction.
// The beta banner lives in the root layout and is immune to all version changes.
// Its markup, text, and position never move.

import Image from 'next/image'
import styles from './BetaBanner.module.css'

const BANNER_TEXT = 'This portfolio is a running design experiment and may be different the next time you see it / Work dated 2026 – 2021 / ©jared beck, united states of mind / Built with Claude Code'

function Segment() {
  return (
    <span className={styles.segment}>
      <Image src="/warning-icon.svg" alt="" width={16} height={16} aria-hidden="true" />
      <span className={styles.text}>{BANNER_TEXT}</span>
      <Image src="/warning-icon.svg" alt="" width={16} height={16} aria-hidden="true" />
    </span>
  )
}

// Ticker unit: text followed by a single separator icon.
// Two of these = "text [icon] text [icon]" — one icon between each repetition.
function TickerSegment() {
  return (
    <span className={styles.tickerSegment}>
      <span className={styles.text}>{BANNER_TEXT}</span>
      <Image src="/warning-icon.svg" alt="" width={16} height={16} aria-hidden="true" />
    </span>
  )
}

export default function BetaBanner() {
  return (
    <div className={styles.banner} role="note" aria-label="Site status">
      {/* Desktop: static centered */}
      <span className={styles.static}>
        <Segment />
      </span>
      {/* Mobile: horizontal ticker — two copies for a seamless loop */}
      <div className={styles.ticker} aria-hidden="true">
        <div className={styles.tickerTrack}>
          <TickerSegment /><TickerSegment />
        </div>
      </div>
    </div>
  )
}
