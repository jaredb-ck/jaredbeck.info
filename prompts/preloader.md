# Build the Preloader — Permanent Infrastructure

Build a preloader system that lives outside all version route
groups in the root layout. This is permanent infrastructure —
like the beta banner and version switcher. It has its own fixed
visual identity that never changes regardless of which version
of the portfolio is active.

## Architecture

All preloader files live at the root app level, not inside
any version route group:

/app/components/Preloader/
  Preloader.tsx           ← component, mounted in root layout
  Preloader.module.css    ← permanently locked visual identity
  usePreloader.ts         ← all loading logic
  assetManifest.ts        ← builds asset list from projects.json

Mount the Preloader in /app/layout.tsx alongside the beta
banner and version switcher — above all version route group
content in the layout tree.

## Philosophy
This is a graphic design portfolio — the work is the product.
Every image and video must be fully loaded and ready before
the user sees anything. The preloader is not a temporary
inconvenience, it is part of the designed experience.

A longer upfront load is always preferable to hitches,
janky animations, or unloaded images during navigation.

## What to preload
On every initial page load or hard refresh, preload in
this order:

1. All hero images across all projects in projects.json
2. All supplementary images across all projects
3. All video files across all projects
   (preload="auto" — load enough to play smoothly)
4. All fonts declared across all version route group layouts
   that have been registered in the font manifest

Run all preloads in parallel using Promise.all — never
sequentially.

## assetManifest.ts
Reads /data/projects.json and constructs a deduplicated
array of all asset URLs:
- Images: /public/images/[project-id]/[src]
- Videos: /public/videos/[project-id]/[src]

Deduplicates before returning — never preload the same
asset twice.

Exports a single typed function:
  export async function buildAssetManifest(): Promise<string[]>

## usePreloader.ts
A React hook that:
- Calls buildAssetManifest() on mount
- Preloads all assets in parallel using Promise.all
- Tracks real progress: resolved promises / total assets
- Returns { progress, isComplete }
- Fails silently on broken assets — log to console,
  resolve the promise, keep going
- Never blocks completion on a single failed asset

Preload logic:

  const preloadImage = (src: string): Promise<void> =>
    new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve();
      img.onerror = () => {
        console.warn('Preloader: failed to load', src);
        resolve();
      };
      img.src = src;
    });

  const preloadVideo = (src: string): Promise<void> =>
    new Promise((resolve) => {
      const video = document.createElement('video');
      video.preload = 'auto';
      video.oncanplaythrough = () => resolve();
      video.onerror = () => {
        console.warn('Preloader: failed to load', src);
        resolve();
      };
      video.src = src;
    });

## Preloader.tsx
- Mounts above all content in the root layout
- Uses usePreloader() to track real load progress
- Renders until isComplete is true
- When isComplete:
  1. Hold for 300ms
  2. Animate out using GSAP
  3. Unmount cleanly
  4. Dispatch a custom event 'preloader:complete' that
     version route groups can listen to in order to
     trigger their own page-enter animations

Use dynamic import with ssr: false to avoid hydration
issues — the preloader is client-side only.

On subsequent client-side navigation within the app,
do not show the preloader again — assets are already
in memory.

## Visual identity — Preloader.module.css

The preloader has its own permanent visual identity.
It does not inherit any version's CSS variables.
It does not change when versions change.
Preloader.module.css is a locked file — never modified
as part of any version update, patch, or cleanup pass.

Design spec:
- Full viewport, fixed position, z-index above everything
  including the beta banner and version switcher
- Background: #0a0a0a — near black, not pure black
- Foreground: #f0f0f0 — near white, not pure white
- A single horizontal hairline rule across the full width
  at the vertical midpoint of the viewport
- Below the rule: a progress bar — a second rule that
  grows from left to right driven by real progress value
  CSS: width driven by a CSS custom property --progress
  updated via JavaScript as assets load
- Above the rule: a large progress percentage, right-aligned
  to the right edge of the viewport with generous padding
  Typeset in: 'Courier New', Courier, monospace
  Size: clamp(4rem, 10vw, 8rem)
  Font weight: 400 — not bold
  Letter spacing: -0.02em
  The number updates in real time as assets load
- No logo, no wordmark, no decorative elements
- No spinner

Exit animation using GSAP — triggered when isComplete
is true after the 300ms hold:

  Step 1: Fade the percentage counter to opacity 0
          Duration: 200ms, ease: 'power1.out'

  Step 2: Simultaneously slide the progress bar rule
          width to 100% if not already there
          Duration: 150ms, ease: 'power2.out'

  Step 3: Slide the entire preloader panel upward off
          screen — y: '-100vh'
          Duration: 700ms, ease: 'power3.inOut'
          Delay: 100ms after step 1 completes

  Step 4: On complete, unmount the component and
          dispatch 'preloader:complete'

## Locked files — add to the locked files list in CLAUDE.md

Add the following to the Locked Files section of CLAUDE.md:

- /app/components/Preloader/ — all files within this
  directory are permanently locked
- /app/components/Preloader/Preloader.module.css —
  visual identity locked, never modified by version
  updates, patches, or cleanup passes

## Integration checklist
1. Build assetManifest.ts
2. Build usePreloader.ts
3. Build Preloader.tsx
4. Write Preloader.module.css — locked on creation
5. Mount Preloader in /app/layout.tsx
6. Add Preloader files to locked files list in CLAUDE.md
7. Add 'preloader:complete' event listener example to
   the v0 route group layout as a reference for future
   versions
8. Test: hard refresh the site and confirm the preloader
   appears, progress updates in real time, and exit
   animation fires correctly before page content appears

## Do not touch
- /app/layout.tsx beyond mounting the Preloader component
- changelog.module.css
- /changelog
- /data
- /types
- Any version route group internals
- The beta banner component
- The version switcher component

## Confirm before building
Before writing any code, confirm:
1. Total number of projects currently in projects.json
2. Estimated total asset count across all projects
3. That /app/components/ directory exists or will be created
4. That GSAP is installed at the root level

Wait for my confirmation before proceeding.