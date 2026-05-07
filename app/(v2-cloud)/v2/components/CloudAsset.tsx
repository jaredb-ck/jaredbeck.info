'use client'

import { forwardRef, useCallback } from 'react'
import Image from 'next/image'
import type { CloudItem } from '../lib/cloudLayout'
import styles from './CloudAsset.module.css'

interface Props {
  item: CloudItem
  onClick: (item: CloudItem, rect: DOMRect) => void
}

const CloudAsset = forwardRef<HTMLDivElement, Props>(
  function CloudAsset({ item, onClick }, ref) {
    const aspectRatio = item.asset.w / item.asset.h
    const height = Math.round(item.width / aspectRatio)

    const handleClick = useCallback(
      (e: React.MouseEvent<HTMLDivElement>) => {
        const rect = e.currentTarget.getBoundingClientRect()
        onClick(item, rect)
      },
      [item, onClick],
    )

    return (
      <div
        ref={ref}
        className={styles.asset}
        data-cloud-asset={item.id}
        style={{
          width: item.width,
          height,
        }}
        onClick={handleClick}
        role="button"
        tabIndex={0}
        aria-label={`${item.project.title} — ${item.asset.src.replace(/\.\w+$/, '').replace(/[-_]/g, ' ')}`}
        onKeyDown={e => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            const rect = e.currentTarget.getBoundingClientRect()
            onClick(item, rect)
          }
        }}
      >
        {item.mediaType === 'video' ? (
          <video
            src={`/videos/${item.projectId}/${item.asset.src}`}
            width={item.width}
            height={height}
            className={styles.image}
            autoPlay
            muted
            loop
            playsInline
            draggable={false}
          />
        ) : (
          <Image
            src={`/images/${item.projectId}/${item.asset.src}`}
            alt={item.project.title}
            width={item.width}
            height={height}
            sizes={`${item.width}px`}
            className={styles.image}
            draggable={false}
          />
        )}
      </div>
    )
  },
)

export default CloudAsset
