import aboutData from '@/data/about.json'
import type { About } from '@/types'
import styles from './page.module.css'

export const metadata = { title: 'About' }

const about = aboutData as About

export default function AboutPage() {
  return (
    <>
      <p data-row className={styles.pageLabel}>About</p>

      {/* Editorial statement blocks — full width, no label */}
      <div data-row className={styles.statement}>
        <p className={styles.statementText}>{about.bio}</p>
      </div>

      <div data-row className={styles.statement}>
        <p className={styles.statementText}>{about.philosophy}</p>
      </div>

      {/* Two-column: skills | collaborators */}
      <div data-row className={styles.lower}>

        <section className={styles.lowerSection}>
          <h2 className={styles.lowerLabel}>Skills</h2>
          <ul className={styles.skillGrid}>
            {about.skills.map((skill) => (
              <li key={skill} className={styles.skill}>{skill}</li>
            ))}
          </ul>
        </section>

        <section className={styles.lowerSection}>
          <h2 className={styles.lowerLabel}>Collaborators</h2>
          <ul className={styles.collaboratorList}>
            {about.collaborators.map((c) => (
              <li key={c.name} className={styles.collaboratorRow}>
                <span className={styles.collaboratorName}>{c.name}</span>
                <span className={styles.collaboratorRole}>{c.role}</span>
              </li>
            ))}
          </ul>
        </section>

      </div>
    </>
  )
}
