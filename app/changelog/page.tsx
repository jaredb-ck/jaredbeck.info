// LOCKED FILE — never modify.
// The changelog page renders all version history from /data/changelog.json.
// All schema fields are rendered. Styled by changelog.module.css, which is also locked.

import Image from 'next/image'
import changelogData from '@/data/changelog.json'
import type { ChangelogEntry } from '@/types'
import styles from './changelog.module.css'

const entries = changelogData as ChangelogEntry[]

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export default function Changelog() {
  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <p className={styles.headerLabel}>Living Portfolio</p>
        <h1 className={styles.headerTitle}>Changelog</h1>
        <p className={styles.headerSub}>
          Every version, in order — aesthetic direction, design constraint, and process note.
        </p>
      </header>

      <div className={styles.timeline}>
        {entries.map((entry) => (
          <article key={entry.version} className={styles.entry}>
            <div className={styles.entryDot} aria-hidden="true" />

            <header className={styles.entryHead}>
              <div>
                <p className={styles.entryVersion}>{entry.version}</p>
                <h2 className={styles.entryName}>{entry.name}</h2>
              </div>
              <time className={styles.entryDate} dateTime={entry.date}>
                {formatDate(entry.date)}
              </time>
            </header>

            <div className={styles.entryBody}>
              <div className={styles.field}>
                <span className={styles.fieldLabel}>Aesthetic</span>
                <span className={styles.fieldText}>{entry.aesthetic}</span>
              </div>

              <div className={styles.field}>
                <span className={styles.fieldLabel}>Constraint</span>
                <span className={styles.fieldText}>{entry.constraint}</span>
              </div>

              <div className={styles.field}>
                <span className={styles.fieldLabel}>Process</span>
                <span className={styles.fieldText}>{entry.promptSummary}</span>
              </div>

              <div className={styles.screenshotWrap}>
                {entry.screenshot ? (
                  <Image
                    src={entry.screenshot}
                    alt={`Screenshot of ${entry.name}`}
                    width={760}
                    height={440}
                    className={styles.screenshot}
                  />
                ) : (
                  <div className={styles.screenshotPlaceholder}>
                    screenshot pending
                  </div>
                )}
              </div>

              <div className={styles.patches}>
                <p className={styles.patchesLabel}>patches</p>
                {entry.patches.length === 0 ? (
                  <p className={styles.noPatches}>none</p>
                ) : (
                  <ul className={styles.patchList}>
                    {entry.patches.map((patch, i) => (
                      <li key={i} className={styles.patch}>
                        <time className={styles.patchDate} dateTime={patch.date}>
                          {formatDate(patch.date)}
                        </time>
                        <p className={styles.patchNote}>{patch.note}</p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}
