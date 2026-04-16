#!/usr/bin/env node
// ingest-dimensions.mjs
//
// Walks a directory of raw project assets, measures intrinsic pixel
// dimensions for every image and video, and prints JSON ready to paste
// into the `images` / `videos` arrays of an entry in data/projects.json.
//
// Usage:
//   node scripts/ingest-dimensions.mjs "/path/to/folder"
//   node scripts/ingest-dimensions.mjs "inbox/adidas Thrift & Ride"
//
// Image dimensions come from sips (macOS built-in).
// Video dimensions come from mdls (macOS Spotlight metadata).
//
// Output shape matches types/index.ts ImageAsset / VideoAsset:
//   { "src": "cover.jpg", "w": 3840, "h": 2160 }

import { execSync } from 'node:child_process'
import { readdirSync } from 'node:fs'
import { extname, join } from 'node:path'
import { argv, exit, platform } from 'node:process'

const IMAGE_EXTS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif', '.heic'])
const VIDEO_EXTS = new Set(['.mp4', '.mov', '.webm', '.m4v'])

function die(msg) {
  console.error(`ingest-dimensions: ${msg}`)
  exit(1)
}

if (platform !== 'darwin') {
  die('this script uses sips and mdls — macOS only. Port to ffprobe/imagemagick if you run it elsewhere.')
}

const dir = argv[2]
if (!dir) {
  die('usage: node scripts/ingest-dimensions.mjs "<folder>"')
}

function imageDims(path) {
  const out = execSync(`sips -g pixelWidth -g pixelHeight "${path}"`, { encoding: 'utf8' })
  const w = Number(out.match(/pixelWidth:\s*(\d+)/)?.[1])
  const h = Number(out.match(/pixelHeight:\s*(\d+)/)?.[1])
  if (!w || !h) throw new Error(`couldn't read dims from sips: ${path}`)
  return { w, h }
}

function videoDims(path) {
  const out = execSync(
    `mdls -name kMDItemPixelWidth -name kMDItemPixelHeight "${path}"`,
    { encoding: 'utf8' },
  )
  const w = Number(out.match(/kMDItemPixelWidth\s*=\s*(\d+)/)?.[1])
  const h = Number(out.match(/kMDItemPixelHeight\s*=\s*(\d+)/)?.[1])
  if (!w || !h) throw new Error(`couldn't read dims from mdls: ${path}`)
  return { w, h }
}

let files
try {
  files = readdirSync(dir).sort()
} catch (err) {
  die(`can't read ${dir}: ${err.message}`)
}

const images = []
const videos = []
const skipped = []

for (const file of files) {
  if (file.startsWith('.')) continue // dotfiles (.DS_Store, .gitkeep)
  const ext = extname(file).toLowerCase()
  const path = join(dir, file)
  try {
    if (IMAGE_EXTS.has(ext)) {
      images.push({ src: file, ...imageDims(path) })
    } else if (VIDEO_EXTS.has(ext)) {
      videos.push({ src: file, ...videoDims(path) })
    } else {
      skipped.push(file)
    }
  } catch (err) {
    console.error(`⚠ skipping ${file}: ${err.message}`)
    skipped.push(file)
  }
}

console.log('"images":', JSON.stringify(images, null, 2) + ',')
console.log('"videos":', JSON.stringify(videos, null, 2))

if (skipped.length) {
  console.error(`\n(skipped ${skipped.length} non-asset file(s): ${skipped.join(', ')})`)
}
