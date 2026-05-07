'use client'

import { useRef, useEffect, useCallback } from 'react'
import styles from './SearchBar.module.css'

const QUICK_TAGS = [
  'branding', 'campaign', 'ui-ux', 'illustration',
  'packaging', 'motion', 'editorial', 'print',
  'apparel', 'digital',
]

interface Props {
  query: string
  onChange: (query: string) => void
  resultInfo: { assetCount: number; projectCount: number } | null
}

export default function SearchBar({ query, onChange, resultInfo }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const commitQuery = useCallback(
    (value: string) => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
      onChange(value)
    },
    [onChange],
  )

  const handleInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value
      if (debounceRef.current) clearTimeout(debounceRef.current)
      debounceRef.current = setTimeout(() => {
        onChange(value)
      }, 400)
    },
    [onChange],
  )

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        commitQuery(e.currentTarget.value)
      }
      if (e.key === 'Escape') {
        e.currentTarget.value = ''
        commitQuery('')
        e.currentTarget.blur()
      }
    },
    [commitQuery],
  )

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [])

  // Sync external query state to input (e.g. when cleared via Escape in lightbox)
  useEffect(() => {
    if (inputRef.current && inputRef.current.value !== query) {
      inputRef.current.value = query
    }
  }, [query])

  return (
    <div className={styles.wrapper}>
      <div className={styles.bar}>
        <svg
          className={styles.icon}
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          ref={inputRef}
          type="text"
          className={styles.input}
          placeholder="What are you looking for?"
          defaultValue={query}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          aria-label="Search projects"
        />
      </div>
      <div className={styles.tagStrip}>
        <button
          className={`${styles.tagPill} ${!query.trim() ? styles.tagPillActive : ''}`}
          onClick={() => {
            if (inputRef.current) inputRef.current.value = ''
            commitQuery('')
          }}
        >
          all
        </button>
        {QUICK_TAGS.map(tag => (
          <button
            key={tag}
            className={`${styles.tagPill} ${query.trim() === tag ? styles.tagPillActive : ''}`}
            onClick={() => {
              if (inputRef.current) inputRef.current.value = tag
              commitQuery(tag)
            }}
          >
            {tag}
          </button>
        ))}
      </div>
      {resultInfo && query.trim() && (
        <p className={styles.resultCount}>
          {resultInfo.assetCount === 0
            ? 'nothing found.'
            : `${resultInfo.assetCount} asset${resultInfo.assetCount !== 1 ? 's' : ''} across ${resultInfo.projectCount} project${resultInfo.projectCount !== 1 ? 's' : ''}`}
        </p>
      )}
    </div>
  )
}
