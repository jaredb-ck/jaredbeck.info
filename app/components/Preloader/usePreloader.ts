'use client'

import { useState, useEffect, useRef } from 'react'
import { buildTieredManifest } from './assetManifest'

// ─── Video cache ────────────────────────────────────────────────

/** Stores blob URLs for fully loaded videos (Tier 3 on-demand). */
export const videoCache = new Map<string, string>()

/** Tracks which videos are currently being fetched on demand. */
const pendingDemand = new Map<string, Promise<string | null>>()

// ─── Preload helpers ────────────────────────────────────────────

const IMAGE_TIMEOUT = 8000 // 8s — generous for WiFi, catches stalled requests

const preloadImage = (src: string): Promise<void> =>
  new Promise((resolve) => {
    const img = new Image()
    const timer = setTimeout(() => {
      img.onload = img.onerror = null
      console.warn('Preloader: timed out loading', src)
      resolve()
    }, IMAGE_TIMEOUT)
    img.onload = () => { clearTimeout(timer); resolve() }
    img.onerror = () => {
      clearTimeout(timer)
      console.warn('Preloader: failed to load', src)
      resolve()
    }
    img.src = src
  })

const preloadVideoPreview = (src: string): Promise<void> =>
  fetch(src, { headers: { Range: 'bytes=0-5242880' } })
    .then(() => {})
    .catch(() => { console.warn('Preloader: video preview failed', src) })

// ─── Tier 3: on-demand full video fetch ─────────────────────────

/**
 * Fetch a full video on demand and cache it as a blob URL.
 * Returns the blob URL, or null on failure. Deduplicates
 * concurrent requests for the same URL.
 */
export function demandLoadVideo(src: string): Promise<string | null> {
  const cached = videoCache.get(src)
  if (cached) return Promise.resolve(cached)

  const pending = pendingDemand.get(src)
  if (pending) return pending

  const promise = fetch(src)
    .then(res => res.blob())
    .then(blob => {
      const url = URL.createObjectURL(blob)
      videoCache.set(src, url)
      pendingDemand.delete(src)
      return url
    })
    .catch(() => {
      console.warn('Preloader: on-demand video failed', src)
      pendingDemand.delete(src)
      return null
    })

  pendingDemand.set(src, promise)
  return promise
}

// ─── Hook ───────────────────────────────────────────────────────

export function usePreloader() {
  const [progress, setProgress] = useState(0)
  const [isComplete, setIsComplete] = useState(false)
  const started = useRef(false)

  useEffect(() => {
    if (started.current) return
    started.current = true

    const manifest = buildTieredManifest()

    // ── Tier 1: hero images only (blocks site visibility) ─────
    const heroTotal = manifest.heroes.length
    if (heroTotal === 0) {
      setProgress(100)
      setIsComplete(true)
      return
    }

    let loaded = 0
    const heroPromises = manifest.heroes.map((url) =>
      preloadImage(url).then(() => {
        loaded++
        setProgress(Math.round((loaded / heroTotal) * 100))
      })
    )

    Promise.all(heroPromises).then(() => {
      setIsComplete(true)

      // ── Tier 2: background load after site is visible ───────
      const runTier2 = () => {
        const imgPromises = manifest.supplementary.map(preloadImage)
        const vidPromises = manifest.videoPreviews.map(preloadVideoPreview)

        Promise.all([...imgPromises, ...vidPromises]).catch(() => {
          // Individual promises already handle their own errors;
          // this catch is a safety net for any unexpected rejection.
        })
      }

      if ('requestIdleCallback' in window) {
        requestIdleCallback(runTier2, { timeout: 3000 })
      } else {
        setTimeout(runTier2, 1000)
      }
    })
  }, [])

  return { progress, isComplete }
}
