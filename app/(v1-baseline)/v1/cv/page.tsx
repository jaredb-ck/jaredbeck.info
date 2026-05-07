import cvData from '@/data/cv.json'
import type { CV } from '@/types'
import styles from './page.module.css'

export const metadata = { title: 'CV' }

const cv = cvData as CV

export default function CVPage() {
  return (
    <>
      <p data-row className={styles.pageLabel}>Curriculum Vitae</p>

      {/* Education */}
      <section data-row className={styles.section}>
        <h2 className={styles.sectionTitle}>Education</h2>
        <ul className={styles.educationList}>
          {cv.education.map((e) => (
            <li key={`${e.institution}-${e.year}`} className={styles.educationRow}>
              <span className={styles.eduInstitution}>{e.institution}</span>
              <span className={styles.eduDegree}>{e.degree}</span>
              <span className={styles.eduYear}>{e.year}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* Clients */}
      <section data-row className={styles.section}>
        <h2 className={styles.sectionTitle}>Clients</h2>
        <ul className={styles.clientList}>
          {cv.clients.map((c, i) => (
            <li key={`${c.name}-${c.year}`} className={styles.clientRow}>
              <span className={styles.clientNum}>{String(i + 1).padStart(2, '0')}</span>
              <span className={styles.clientName}>{c.name}</span>
              <span className={styles.clientProject}>{c.project}</span>
              <span className={styles.clientYear}>{c.year}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* Exhibitions */}
      <section data-row className={styles.section}>
        <h2 className={styles.sectionTitle}>Exhibitions &amp; Recognition</h2>
        <ul className={styles.exhibitionList}>
          {cv.exhibitions.map((e) => (
            <li key={`${e.title}-${e.year}`} className={styles.exhibitionRow}>
              <span className={styles.exhibitionTitle}>{e.title}</span>
              <span className={styles.exhibitionVenue}>{e.venue}</span>
              <span className={styles.exhibitionLocation}>{e.location}</span>
              <span className={styles.exhibitionYear}>{e.year}</span>
            </li>
          ))}
        </ul>
      </section>
    </>
  )
}
