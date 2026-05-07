'use client'

import styles from './MetadataStrip.module.css'

interface Props {
  title: string
  year: number
  medium: string
  role: string
  query: string
}

function isRelevant(fieldText: string, query: string): boolean {
  if (!query.trim()) return false
  const q = query.toLowerCase()
  return fieldText.toLowerCase().includes(q) ||
    q.split(/\s+/).some(t => fieldText.toLowerCase().includes(t))
}

export default function MetadataStrip({
  title,
  year,
  medium,
  role,
  query,
}: Props) {
  const hasQuery = query.trim().length > 0

  return (
    <div className={styles.strip}>
      <div className={styles.meta}>
        <span className={`${styles.field} ${hasQuery && isRelevant(title, query) ? styles.highlight : ''}`}>
          {title}
        </span>
        <span className={`${styles.field} ${hasQuery && isRelevant(String(year), query) ? styles.highlight : ''}`}>
          {year}
        </span>
        <span className={`${styles.field} ${hasQuery && isRelevant(medium, query) ? styles.highlight : ''}`}>
          {medium}
        </span>
        <span className={`${styles.field} ${hasQuery && isRelevant(role, query) ? styles.highlight : ''}`}>
          {role}
        </span>
      </div>
    </div>
  )
}
