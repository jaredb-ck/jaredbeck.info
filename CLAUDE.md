# The Living Portfolio — CLAUDE.md

You are helping me build "The Living Portfolio" — a graphic design
portfolio site where the UI is in permanent beta (rebuilt iteratively
with AI) while the content remains stable and consistent across all
versions.

Read this file at the start of every session. These are the ground
rules, architecture decisions, and build instructions for this
project. Never deviate from them unless I explicitly ask you to.

When starting a new version session, read only:
- This file
- The active design brief in /inspiration/[version]/
- The content schema in /data
- Nothing else — do not read inside past version route groups

---

## Core Concept

The site itself is the project. The UI mutates; the content is the
anchor. Each version is a fully self-contained app shell that loads
in its entirety when a user switches to it. The changelog of versions
is a portfolio piece in itself.

---

## Phase 1: Content Schema (do this first, before any UI)

Define and scaffold a rigid content schema as a JSON data file.
Every future UI version must render all fields correctly. Schema
should include:

- projects[] — id, title, dateAdded, year, tags[], medium,
  description, role, images[], videos[], caseStudy{ problem,
  process, outcome }
- about — bio, philosophy, skills[], collaborators[]
- cv — education[], clients[], exhibitions[]
- changelog[] — version, name, date, aesthetic, constraint,
  promptSummary, screenshot, patches[]

Image and video asset shape — always use this exact structure:
  { "src": "filename.webp", "w": 1920, "h": 1080 }

Never use "file", "width", or "height" as field names.
Sentinel w: 0, h: 0 is reserved for placeholder projects only.

Populate the schema with placeholder/sample content so the UI has
something real to render against.

---

## Phase 2: Version Architecture

Each UI version lives as a fully isolated Next.js route group with
its own root layout, components, styles, and GSAP configuration.
Versions share only the /data JSON content layer and TypeScript
interfaces — nothing else.

Directory structure:

/app
  /(v0-blueprint)/
    layout.tsx        ← v0's root layout, fonts, GSAP config
    page.tsx
    projects/[slug]/page.tsx
    about/page.tsx
    cv/page.tsx
    components/       ← v0's own components, never shared
    lib/              ← v0's own utilities, never shared
    version.config.ts ← v0's metadata, aesthetic, constraint
  /(v1-name)/
    layout.tsx        ← completely independent from v0
    page.tsx
    projects/[slug]/page.tsx
    about/page.tsx
    cv/page.tsx
    components/
    lib/
    version.config.ts
  /changelog/
    page.tsx          ← permanent, outside all version groups
  layout.tsx          ← root layout: beta banner, version
                         switcher, and Preloader only

/app/components/      ← permanent infrastructure only
  Preloader/
    Preloader.tsx           ← locked
    Preloader.module.css    ← locked permanently
    usePreloader.ts         ← locked
    assetManifest.ts        ← locked

/data/                ← shared content, never version-specific
  projects.json
  about.json
  cv.json
  changelog.json

/inbox/               ← temporary drop zone for new assets
  /project-name/
    image1.jpg
    notes.txt

/inspiration/         ← visual references per version
  /v0-blueprint/
  /v1-name/
  /general/

/prompts/             ← prompt toolkit, reference only
  pre-build-check.md
  inbox.md
  process-inbox.md
  cleanup.md
  inspiration.md
  preloader.md
  page-transitions.md

/scripts/             ← build tools
  compress-images.js
  compression-logs/

/types/               ← shared TypeScript interfaces only

/public/
  /images/            ← processed images, by project id
    /project-id/
  /videos/            ← processed videos, by project id
    /project-id/

Each version is completely isolated. Switching versions loads the
entirety of that version's app shell — it is not a theme swap.
It is a full environment change.

Past version route groups are sealed black boxes once merged
to main. Never read inside them for patterns, components, or
references when building new versions. Every new version is
built from scratch.

---

## Phase 3: Root Layout (Permanent Infrastructure)

The root layout at /app/layout.tsx contains only three permanent
elements that live outside and above all version UIs:

1. Beta banner — a persistent bar at the very top of every page
   that reads: "This portfolio is in permanent beta. The UI changes
   periodically — content stays." Styled neutrally. Never modified.

2. Version switcher — reads the versions array from changelog.json
   automatically. No hardcoded version list. Adding a new version
   to the schema surfaces it in the switcher without extra work.

3. Preloader — permanent infrastructure with its own fixed visual
   identity. Mounts above all content. Locks until all hero images
   are loaded, then loads supplementary assets in background.
   Never reskinned by version changes.

Switching versions is a full route group load, not an invisible
route change. The transition should be a deliberate designed moment.

---

## Phase 4: Version 0 — "Blueprint"

Build the first version as a fully isolated route group. Intentionally
raw and simple — this is the baseline everything else departs from.

Design brief for v0:
- Aesthetic: technical drafting, grid paper, blueprint feel
- Structure: editorial catalogue layout — horizontal rows, not
  single column. Tabular, print-inspired, spread-based.
- Typography: monospace only
- Color: 2 colors maximum — off-white background, near-black text
- Must render all content schema fields correctly
- Include a visible version badge (v0: Blueprint) and a link to
  the changelog

---

## Phase 5: Changelog Page

The changelog is a permanent, styled-once page with its own fixed
visual identity. It does not participate in versioning — it is the
record of versioning.

Build a /changelog route that:
- Has its own self-contained stylesheet (changelog.module.css)
  that is never modified when UI versions change
- Uses its own fixed typography, color palette, and layout —
  chosen once and locked permanently
- Shows all version entries with screenshot, name, date, aesthetic
  direction, design constraint, and prompt summary
- Shows patches listed under their parent version — indented,
  smaller type, no screenshot
- Displays a visual timeline of all versions
- The beta banner appears at the top as always, but otherwise the
  changelog is fully visually independent from the active version

---

## Phase 6: Project Inbox — Adding New Work

New projects are added exclusively through the /inbox folder.
Never edit projects.json directly with unprocessed assets.

Folder structure:

/inbox/
  /project-name/        ← one subfolder per new project
    image1.jpg
    image2.jpg
    cover.png
    notes.txt           ← optional, plain text, read to pre-fill
                           schema fields

Notes.txt format (no strict structure required):

  Title: Project Name
  Year: 2024
  Role: Art Director
  Client: Client Name
  Brief: Short description of the project and outcome.
  Awards:
  Collaborators:
  URL:

Asset size limits — enforced on every ingestion:
- Hero images: maximum 800KB after compression
- Supplementary images: maximum 400KB after compression
- Videos: .mp4 only, maximum 15MB per file
- .mov, .avi, .wmv files are rejected — flag and do not process

When told "Process the inbox", Claude Code will:
1. Read each subfolder as a distinct project
2. Read notes.txt if present to pre-fill schema fields
3. Analyze all image assets — generate tags, medium, description
4. Read intrinsic dimensions using sips for images, mdls for video
5. Compress images using sharp — hero max 800KB, supp max 400KB
6. Convert images to .webp, move to /public/images/[project-id]/
7. Move .mp4 videos to /public/videos/[project-id]/
8. Append new entries to /data/projects.json — never modify
   existing entries. Use { "src", "w", "h" } shape always.
9. Set dateAdded to today's date automatically
10. Flag uncertain fields with [NEEDS REVIEW]
11. Produce an ingestion-report.md
12. Remind to clear /inbox when complete

Inbox rules:
- One subfolder per project — never mix projects
- /inbox is gitignored — raw assets never committed
- projects.json is the source of truth
- New entries always appended with today's date as dateAdded
- Portfolio always sorts newest first — no manual ordering needed

---

## Ground Rules

These apply to every session, every version, forever.

1. Content schema is never broken — all fields must render in
   every version, even if currently unpopulated.

2. Every version is preserved and accessible as a distinct route
   group — past versions are archive, not dead code.

3. Each new version has a named design constraint defined and
   approved before any building begins.

4. AI collaboration is visible, not hidden — prompts, constraints,
   and process are documented in the changelog.

5. The site is always live and always in progress.

6. Projects always display in order of dateAdded, most recent
   first. Sort order lives in data logic, not UI.

7. The beta banner lives in the root layout and is immune to all
   version changes. Its markup and position never move.

8. A VERSION is a new overall concept — a new named aesthetic
   direction, layout structure, or design constraint. Versions are
   fully isolated route groups built from scratch. They get a
   changelog entry, a name, a date, and a screenshot.

9. A PATCH is a small refinement within the current version —
   font tweaks, color adjustments, spacing fixes, style changes.
   Patches do not create a new version. They are logged in the
   patches[] array of the current version with a date and note.

10. The changelog page has its own permanent visual identity.
    changelog.module.css is a locked file — never modified.

11. Each version loads in its entirety when selected. No styles,
    fonts, or components are shared between version route groups.

12. New projects are always added via the /inbox workflow — never
    by directly editing projects.json with raw unprocessed assets.

13. Past version route groups are sealed once merged to main.
    They are never opened, referenced, or used as patterns for
    new version builds. Every new version is built from scratch.
    The only shared references are /data, /types, and the active
    design brief.

14. At the start of every new version session, Claude Code reads
    only: CLAUDE.md, the active design brief in /inspiration/,
    and the content schema in /data. Past version code is not
    consulted for any reason.

15. All image and video entries in projects.json use the shape
    { "src", "w", "h" } exclusively. Never use "file", "width",
    or "height" as field names. Sentinel w: 0, h: 0 is reserved
    for placeholders only.

16. ffmpeg is located at /opt/homebrew/bin/ffmpeg — always use
    the full path for all ffmpeg commands.

---

## Locked Files

The following are permanently locked. Never modified, refactored,
or deleted for any reason including version updates, patches, or
cleanup passes. If uncertain whether something touches a locked
file — stop and ask before proceeding.

- /app/layout.tsx — root layout, beta banner, version switcher
- /app/components/Preloader/ — all files, permanently locked
- /app/components/Preloader/Preloader.module.css — locked
- /changelog — entire route and all files
- changelog.module.css — changelog styles, permanent
- /types — all shared TypeScript interfaces
- /data — all JSON files and every field, including empty fields
- /public/images — processed project assets, never deleted
- /public/videos — processed project videos, never deleted
- /prompts — reference files, never modified by Claude Code
- /scripts/compress-images.js — reusable compression script
- Any past version route group once a newer version exists
- Any version.config.ts within any version route group

---

## Tech Stack

Framework: Next.js (App Router)
- App Router with TypeScript throughout
- Route groups for version isolation
- next/image for all image handling
- next/font for font loading, per version independently
- images.formats: ['image/webp'] in next.config.js — never avif

Content: Local JSON + TypeScript types
- All content in /data as JSON files
- Shared TypeScript interfaces in /types
- No CMS — JSON is portable, AI-friendly, directly editable

Animation: GSAP
- GSAP for all meaningful motion
- ScrollTrigger for scroll-based animations
- useGSAP() from @gsap/react for React-safe cleanup
- next-transition-router for page transitions between routes
- Each version defines its own GSAP animation personality
- Animations are version-specific and never shared

Preloader: Permanent infrastructure
- Tiered loading strategy:
  Tier 1 — hero images only, loaded before site is shown
  Tier 2 — supplementary images and first 5s of video,
           loaded silently after site becomes visible
           using requestIdleCallback
  Tier 3 — full videos loaded on demand when project opens
- Videos stored as blob object URLs in module-level Map
  to prevent re-fetching on navigation
- Preloader visual identity is fixed and version-agnostic

Styling: CSS Modules + CSS custom properties
- CSS Modules for all component-scoped styles
- Each version manages its own CSS custom properties
- No global theme variables shared between versions
- No Tailwind
- changelog.module.css and Preloader.module.css are locked

Fonts: Variable fonts where possible
- Loaded via next/font/local or next/font/google
- Each version loads its own fonts via its own root layout
- Changelog and Preloader load their own fixed fonts

Version switcher
- Lives in root layout
- Reads versions array from changelog.json — no hardcoded list
- New versions surface automatically when added to schema

Version config
- Each version route group has its own version.config.ts
- Contains: name, aesthetic, constraint, font pairings,
  patch history
- No shared config — each version knows only itself

Asset compression
- sharp for image compression (dev dependency)
- ffmpeg at /opt/homebrew/bin/ffmpeg for video compression
- All compression scripts saved in /scripts/

Deployment: Vercel
- Zero-config Next.js deployment
- images.formats: ['image/webp'] prevents avif conversion
- Every version preserved as route group in production

---

## Build Order

Follow this sequence when starting the project from scratch:

1. Scaffold Next.js project with TypeScript
2. Configure next.config.js — set formats: ['image/webp']
3. Set up /data JSON files and /types interfaces
4. Build root layout — beta banner and version switcher only
5. Build Preloader — permanent infrastructure, locked on creation
6. Set up /inbox folder and add to .gitignore
7. Set up /inspiration folder structure
8. Build v0 route group — Blueprint (editorial, catalogue layout)
9. Build changelog page — style once, lock permanently
10. Verify all content renders correctly across v0
11. Do not proceed to v1 until v0 is complete and verified

---

## Git Workflow

Each new version is built on its own Git branch:
  git checkout -b v[number]-[name]

Never build a new version on main. The pre-build-check.md
prompt enforces this — run it before every new version session.

Branch naming convention:
  v0-blueprint
  v1-archive
  v2-terminal
  etc.

When a version is complete and verified, merge to main:
  git merge v[number]-[name]

Main always reflects the full working project with all versions
intact and accessible.

---

## Prompt Toolkit

All prompts live in /prompts/ and are invoked by telling
Claude Code: "Follow the instructions in prompts/[name].md"

pre-build-check.md  — run before every new version build
inbox.md            — bulk asset ingestion for existing work
process-inbox.md    — add new projects via /inbox folder
cleanup.md          — periodic maintenance between versions
inspiration.md      — read inspiration folder, generate brief
preloader.md        — build the permanent preloader (run once)
page-transitions.md — homepage → PDP transition per version

---

## Current State

Version: v0 — Blueprint complete.
Preloader: built and live.
Last patch: [update this when patches are applied]
Inbox: empty.
Git branch: [update this each session]

Next: define constraint and inspiration for v1 before building.

Update this block at the end of every session to reflect
the current state of the project accurately.