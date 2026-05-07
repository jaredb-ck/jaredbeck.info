'use client'

import { useEffect, useState } from 'react'
import styles from '../page.module.css'

const TZ = 'America/New_York'

function getTime() {
  return new Date().toLocaleTimeString('en-US', {
    timeZone: TZ,
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
}

export default function LocalTime() {
  const [time, setTime] = useState<string | null>(null)

  useEffect(() => {
    setTime(getTime())
    const id = setInterval(() => setTime(getTime()), 60_000)
    return () => clearInterval(id)
  }, [])

  if (!time) return null

  return <span className={styles.heroLocalTime}>{time} ET</span>
}
