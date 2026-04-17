'use client'

import { useState, useEffect, useRef } from 'react'
import { buildAssetManifest, type AssetEntry } from './assetManifest'

/**
 * Module-level cache for video blob URLs. Videos are fetched in full
 * during preload and stored as object URLs so they never re-fetch
 * on navigation. Version components import this map and use the
 * cached URL when available.
 */
export const videoCache = new Map<string, string>()

/**
 * Inject a <link rel="preload"> into <head> for high-priority images.
 */
function injectPreloadLink(href: string): void {
  const link = document.createElement('link')
  link.rel = 'preload'
  link.as = 'image'
  link.href = href
  document.head.appendChild(link)
}

/**
 * Preload an image via new Image() — the browser fetches the exact
 * /_next/image URL that next/image will request at render time.
 */
const preloadImage = (src: string): Promise<void> =>
  new Promise((resolve) => {
    const img = new Image()
    img.onload = () => resolve()
    img.onerror = () => {
      console.warn('Preloader: failed to load', src)
      resolve()
    }
    img.src = src
  })

/**
 * Preload a video by fetching the full file and storing the blob
 * as an object URL in videoCache. Components use the cached URL
 * so the browser never re-fetches on navigation.
 */
const preloadVideo = (src: string): Promise<void> => {
  if (videoCache.has(src)) return Promise.resolve()
  return fetch(src)
    .then(res => res.blob())
    .then(blob => {
      const url = URL.createObjectURL(blob)
      videoCache.set(src, url)
    })
    .catch(() => {
      console.warn('Preloader: video failed', src)
    })
}

export function usePreloader() {
  const [progress, setProgress] = useState(0)
  const [isComplete, setIsComplete] = useState(false)
  const started = useRef(false)

  useEffect(() => {
    if (started.current) return
    started.current = true

    const entries = buildAssetManifest()
    const total = entries.length

    if (total === 0) {
      setProgress(100)
      setIsComplete(true)
      return
    }

    // Inject <link rel="preload"> for hero images
    for (const entry of entries) {
      if (entry.isHero && entry.kind === 'image') {
        injectPreloadLink(entry.url)
      }
    }

    let loaded = 0

    const promises = entries.map((entry: AssetEntry) => {
      const loader = entry.kind === 'video'
        ? preloadVideo(entry.url)
        : preloadImage(entry.url)
      return loader.then(() => {
        loaded++
        setProgress(Math.round((loaded / total) * 100))
      })
    })

    Promise.all(promises).then(() => {
      setIsComplete(true)
    })
  }, [])

  return { progress, isComplete }
}
