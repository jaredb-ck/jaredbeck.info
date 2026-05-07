'use client'

import { useState, useRef, useEffect, useCallback, useMemo, useLayoutEffect } from 'react'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import type { Project } from '@/types'
import CloudAsset from './CloudAsset'
import SearchBar from './SearchBar'
import Lightbox from './Lightbox'
import { buildSearchIndex, search } from '../lib/searchIndex'
import {
  generateCloudLayout,
  generateSearchResultLayout,
  type CloudItem,
} from '../lib/cloudLayout'
import { animatePoolOut, animatePoolIn } from '../lib/transitions'
import styles from './AssetCloud.module.css'

gsap.registerPlugin(useGSAP)

const POOL_SIZE = 25

// Wrapping margin — assets fully exit the viewport before reappearing
// on the opposite side. Must be larger than the biggest asset (300px).
const WRAP_MARGIN = 400

// Scroll: wheel input scales down for a slower feel, then decays each frame.
const SCROLL_INPUT_SCALE = 0.05  // low = slow scroll per gesture
const SCROLL_DECAY = 0.985      // high = long coast (98.5% kept per frame, ~4s to stop)

interface LightboxState {
  project: Project
  initialMediaType: 'image' | 'video'
  initialMediaIndex: number
  startRect: DOMRect | null
  fromSearch: boolean
}

export default function AssetCloud({ projects }: { projects: Project[] }) {
  const [pool, setPool] = useState<CloudItem[]>([])
  const [query, setQuery] = useState('')
  const [lightbox, setLightbox] = useState<LightboxState | null>(null)

  const containerRef = useRef<HTMLDivElement>(null)
  const assetEls = useRef<Map<string, HTMLDivElement>>(new Map())
  const panPos = useRef({ x: 0, y: 0 })      // current pan position
  const panVel = useRef({ x: 0, y: 0 })      // current pan velocity
  const transitioning = useRef(false)
  const poolGenKey = useRef(0)

  const searchIndex = useMemo(() => buildSearchIndex(projects), [projects])

  // ── Initial pool ──────────────────────────────────────────────
  useEffect(() => {
    const items = generateCloudLayout(projects, POOL_SIZE)
    setPool(items)
  }, [projects])

  // ── Animate pool in on mount / pool change ────────────────────
  useLayoutEffect(() => {
    if (pool.length === 0) return
    requestAnimationFrame(() => {
      const els = Array.from(assetEls.current.values())
      if (els.length === 0) return
      animatePoolIn(els)
    })
  }, [pool])

  // ── Ref registration for CloudAsset ───────────────────────────
  const registerRef = useCallback(
    (id: string) => (el: HTMLDivElement | null) => {
      if (el) assetEls.current.set(id, el)
      else assetEls.current.delete(id)
    },
    [],
  )

  // ── Omni-directional scroll via wheel / trackpad ──────────────
  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault()
      panVel.current.x += e.deltaX * SCROLL_INPUT_SCALE
      panVel.current.y += e.deltaY * SCROLL_INPUT_SCALE
    }
    container.addEventListener('wheel', handleWheel, { passive: false })
    return () => container.removeEventListener('wheel', handleWheel)
  }, [])

  // ── Unified ticker: position + drift + viewport wrap ──────────
  useGSAP(() => {
    const tick = () => {
      const container = containerRef.current
      if (!container) return
      const t = gsap.ticker.time
      const vw = container.clientWidth
      const vh = container.clientHeight
      const wrapW = vw + WRAP_MARGIN * 2
      const wrapH = vh + WRAP_MARGIN * 2

      // Apply velocity then decay — cloud coasts to a stop
      panPos.current.x += panVel.current.x
      panPos.current.y += panVel.current.y
      panVel.current.x *= SCROLL_DECAY
      panVel.current.y *= SCROLL_DECAY
      // Kill tiny residual velocity to avoid infinite micro-drift
      if (Math.abs(panVel.current.x) < 0.01) panVel.current.x = 0
      if (Math.abs(panVel.current.y) < 0.01) panVel.current.y = 0

      for (const item of pool) {
        const el = assetEls.current.get(item.id)
        if (!el) continue

        // Base position mapped to wrap-space pixels
        const baseX = (item.x / 100) * wrapW
        const baseY = (item.y / 100) * wrapH

        // Drift
        const driftX = Math.sin(t * item.driftFreqX + item.driftPhaseX) * item.driftAmpX
        const driftY = Math.cos(t * item.driftFreqY + item.driftPhaseY) * item.driftAmpY

        // Pan + wrap: modulo keeps position within one tile, then
        // shift by -WRAP_MARGIN so the visible band is [0, vw].
        const rawX = baseX + driftX - panPos.current.x
        const rawY = baseY + driftY - panPos.current.y
        const x = ((rawX % wrapW) + wrapW) % wrapW - WRAP_MARGIN
        const y = ((rawY % wrapH) + wrapH) % wrapH - WRAP_MARGIN

        // Center the asset on its position
        const cx = x - item.width / 2
        const h = el.offsetHeight || 0
        const cy = y - h / 2

        gsap.set(el, { x: cx, y: cy })
      }
    }
    gsap.ticker.add(tick)
    return () => {
      gsap.ticker.remove(tick)
    }
  }, { dependencies: [pool] })

  // ── Search → pool transition ──────────────────────────────────
  const handleQueryChange = useCallback(
    (newQuery: string) => {
      setQuery(newQuery)

      if (transitioning.current) return
      transitioning.current = true
      poolGenKey.current++
      const key = poolGenKey.current

      const currentEls = Array.from(assetEls.current.values())

      const outTl = animatePoolOut(currentEls)
      outTl.then(() => {
        if (poolGenKey.current !== key) {
          transitioning.current = false
          return
        }

        if (!newQuery.trim()) {
          setPool(generateCloudLayout(projects, POOL_SIZE))
        } else {
          const results = search(searchIndex, newQuery)
          if (results.length > 0) {
            const matches = results.map(r => ({
              projectId: r.projectId,
              mediaType: r.mediaType,
              mediaIndex: r.mediaIndex,
              isHero: r.isHero,
            }))
            setPool(generateSearchResultLayout(projects, matches))
          } else {
            setPool([])
          }
        }
        transitioning.current = false
      })
    },
    [projects, searchIndex],
  )

  // ── Result info for search bar ────────────────────────────────
  const resultInfo = useMemo(() => {
    if (!query.trim()) return null
    const assetCount = pool.length
    const projectCount = new Set(pool.map(item => item.projectId)).size
    return { assetCount, projectCount }
  }, [query, pool])

  // ── Asset click → lightbox ────────────────────────────────────
  const handleAssetClick = useCallback(
    (item: CloudItem, rect: DOMRect) => {
      setLightbox({
        project: item.project,
        initialMediaType: item.mediaType,
        initialMediaIndex: item.mediaIndex,
        startRect: rect,
        fromSearch: !!query.trim(),
      })
    },
    [query],
  )

  const closeLightbox = useCallback(() => {
    setLightbox(null)
  }, [])

  return (
    <div ref={containerRef} className={styles.container}>
      {pool.map(item => (
        <CloudAsset
          key={item.id}
          ref={registerRef(item.id)}
          item={item}
          onClick={handleAssetClick}
        />
      ))}

      <SearchBar
        query={query}
        onChange={handleQueryChange}
        resultInfo={resultInfo}
      />

      <span className={styles.versionBadge}>V2/CLOUD</span>

      {lightbox && (
        <Lightbox
          project={lightbox.project}
          initialMediaType={lightbox.initialMediaType}
          initialMediaIndex={lightbox.initialMediaIndex}
          startRect={lightbox.startRect}
          query={query}
          fromSearch={lightbox.fromSearch}
          onClose={closeLightbox}
        />
      )}
    </div>
  )
}
