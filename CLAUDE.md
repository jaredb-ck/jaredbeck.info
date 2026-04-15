# The Living Portfolio — CLAUDE.md

You are helping me build "The Living Portfolio" — a graphic design
portfolio site where the UI is in permanent beta (rebuilt iteratively
with AI) while the content remains stable and consistent across all
versions.

Read this file at the start of every session. These are the ground
rules, architecture decisions, and build instructions for this
project. Never deviate from them unless I explicitly ask you to.

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
  description, role, images[], caseStudy{ problem, process, outcome }
- about — bio, philosophy, skills[], collaborators[]
- cv — education[], clients[], exhibitions[]
- changelog[] — version, name, date, aesthetic, constraint,
  promptSummary, screenshot, patches[]

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
    projects/page.tsx
    about/page.tsx
    cv/page.tsx
  /(v1-name)/
    layout.tsx        ← v1's completely independent root layout
    page.tsx
    projects/page.tsx
    about/page.tsx
    cv/page.tsx
  /changelog/
    page.tsx          ← permanent, outside all version groups
  layout.tsx          ← root layout: beta banner + version switcher only

/data/                ← shared content, never version-specific
  projects.json
  about.json
  cv.json
  changelog.json

/inbox/               ← temporary drop zone for new project assets
  /project-name/
    image1.jpg
    notes.txt

/prompts/             ← prompt toolkit, for reference only
  inbox.md
  cleanup.md
  process-inbox.md

/types/               ← shared TypeScript interfaces only

/public/images/       ← processed assets, organized by project id
  /project-id/

Each version is completely isolated. Switching versions loads the
entirety of that version's app shell — it is not a theme swap.
It is a full environment change.

---

## Phase 3: Root Layout (Permanent Infrastructure)

The root layout at /app/layout.tsx contains only two permanent
elements that live outside and above all version UIs:

1. Beta banner — a persistent bar at the very top of every page
   that reads: "This portfolio is in permanent beta. The UI changes
   periodically — content stays." Styled neutrally so it never
   clashes with any version theme. Never modified.

2. Version switcher — a small persistent component that lets users
   navigate between available versions. It reads the versions array
   from changelog.json automatically — no hardcoded version list.
   Adding a new version to the schema surfaces it in the switcher
   without any extra work.

Switching versions is a full route group load, not an invisible
route change. The transition should be a deliberate designed moment
— a brief loading state, version number display, or similar signal
that communicates "you are now entering v2."

---

## Phase 4: Version 0 — "Blueprint"

Build the first version as a fully isolated route group. Intentionally
raw and simple — this is the baseline everything else departs from.

Design brief for v0:
- Aesthetic: technical drafting, grid paper, blueprint feel
- Structure: single scrolling column, no frills
- Typography: monospace only
- Color: 2 colors maximum
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
    notes.txt           ← optional, plain text, Claude will read
                           this to pre-fill schema fields

Notes.txt format (no strict structure required — write naturally):

  Title: Meridian Brand Identity
  Year: 2024
  Role: Art Director
  Client: Meridian Coffee Co.
  Brief: Full brand identity system for a specialty coffee roaster.
  Included wordmark, packaging, and collateral.

When told "Process the inbox", Claude Code will:
1. Read each subfolder as a distinct project
2. Read notes.txt if present and use it to pre-fill schema fields
3. Analyze all image assets visually — generate tags, medium,
   and a short description
4. Move processed images to /public/images/[project-id]/ and
   videos to /public/videos/[project-id]/
5. Read intrinsic pixel dimensions (w, h) for every image and
   video and store each as { src, w, h } so UIs render at the
   native aspect ratio without cropping or layout shift. Never
   re-encode or resize source files in this step.
6. Append new entries to /data/projects.json — never modify
   existing entries
7. Set dateAdded to today's date automatically
8. Flag any uncertain fields with [NEEDS REVIEW]
9. Produce an ingestion-report.md summarizing what was processed
10. Remind me to clear the /inbox folder when complete

Inbox rules:
- One subfolder per project — never mix projects in one folder
- /inbox is gitignored — raw assets are never committed to git
- Processed assets live permanently in /public/images/[project-id]/
- projects.json is the source of truth — inbox is the entry point
- New entries are appended with today's date as dateAdded
- The portfolio always sorts newest first — no manual ordering needed

---

## Ground Rules

These apply to every session, every version, forever.

1. Content schema is never broken — all fields must render in
   every version, even if a field is currently unpopulated.

2. Every version is preserved and accessible as a distinct route
   group — past versions are archive, not dead code.

3. Each new version has a named design constraint defined before
   any building begins.

4. AI collaboration is visible, not hidden — prompts, constraints,
   and process are documented in the changelog.

5. The site is always live and always in progress.

6. Projects always display in order of dateAdded, most recent
   first. This sort order lives in data logic, not UI, so it
   cannot be broken by a version change.

7. The beta banner lives in the root layout and is immune to all
   version changes. Its markup and position never move.

8. A VERSION is a new overall concept — a new named aesthetic
   direction, layout structure, or design constraint. Versions are
   fully isolated route groups with a changelog entry, a name,
   a date, and a screenshot.

9. A PATCH is a small refinement within the current version —
   font tweaks, color adjustments, spacing fixes, style changes.
   Patches do not create a new version. They are logged in the
   patches[] array of the current version with a date and a
   short note. The version timeline stays clean.

10. The changelog page has its own permanent visual identity.
    changelog.module.css is a locked file — never modified as
    part of a version update or cleanup pass.

11. Each version loads in its entirety when selected. No styles,
    fonts, or components are shared between version route groups.

12. New projects are always added via the /inbox workflow — never
    by directly editing projects.json with raw unprocessed assets.

13. Source assets are never cropped or resized during ingestion.
    Every image and video carries its intrinsic { w, h } in the
    schema, and every UI version must render at that native aspect
    ratio. Cover-cropping to a layout grid is a banned pattern.

---

## Locked Files

The following files are permanently locked. They are never modified,
refactored, or deleted for any reason including version updates,
patch updates, or cleanup passes. If uncertain whether something
touches a locked file, ask before proceeding.

- /app/layout.tsx — root layout, beta banner, version switcher
- /app/components/BetaBanner.tsx — beta banner markup, never changes
- /app/components/BetaBanner.module.css — beta banner styles, never changes
- /app/components/VersionSwitcher.tsx — version switcher logic, never changes
- /app/components/VersionSwitcher.module.css — version switcher styles, never changes
- changelog.module.css — changelog styles, permanent
- /changelog — all files within this route
- /types — all shared TypeScript interfaces
- /data — all JSON files and every field within them, including
  empty fields. Empty fields are intentional placeholders.
- /public/images — processed project assets, never deleted
- /prompts — reference files, never modified by Claude Code
- Any past version route group (e.g. /(v0-blueprint)) once a
  newer version exists — preserved as archive
- Any version.config.ts file within any version route group

## Chrome z-index convention

The beta banner (z-index 100) and version switcher (z-index 99) are
position:fixed and must always be visible above all version UI. Version
UI elements — panels, overlays, modals — must never exceed z-index 90.
The --chrome-height CSS variable (88px, defined in globals.css) is the
combined height of both bars. All version layouts must offset their
content by this amount.

---

## Tech Stack

Framework: Next.js (App Router)
- App Router with TypeScript throughout
- Route groups for version isolation
- next/image for all image handling
- next/font for font loading, per version independently

Content: Local JSON + TypeScript types
- All content in /data as JSON files
- Shared TypeScript interfaces in /types
- No CMS — JSON is portable, AI-friendly, and directly editable

Animation: GSAP
- GSAP for all meaningful motion — page transitions, project
  reveals, changelog timeline, version transition moments
- ScrollTrigger for scroll-based animations
- useGSAP() hook from @gsap/react for React-safe cleanup
- Each version defines its own GSAP animation personality as
  part of its design brief — animations are version-specific

Styling: CSS Modules + CSS custom properties
- CSS Modules for all component-scoped styles
- Each version manages its own CSS custom properties internally
- No global theme variables shared between versions
- No Tailwind
- changelog.module.css is locked and never modified

Fonts: Variable fonts where possible
- Loaded via next/font/local or next/font/google
- Each version loads its own fonts via its own root layout
- The changelog loads its own fixed font independently

Version switcher
- Lives in root layout
- Reads versions array from changelog.json — no hardcoded list
- New versions surface automatically when added to the schema

Version config
- Each version route group has its own version.config.ts
- Contains: name, aesthetic direction, design constraint,
  font pairings, and any version-specific metadata
- No shared config file — each version knows only itself

Deployment: Vercel
- Zero-config Next.js deployment
- Every version preserved as an accessible route group in
  production — not just a branch or preview URL

---

## Build Order

Follow this sequence exactly when starting the project from scratch:

1. Scaffold the Next.js project with TypeScript
2. Set up /data JSON files and /types interfaces
3. Build root layout — beta banner and version switcher only
4. Set up /inbox folder and add it to .gitignore
5. Build v0 route group — Blueprint
6. Build changelog page — style it once, lock it
7. Verify all content renders correctly across v0
8. Do not proceed to v1 until v0 is complete and verified

---

## Current State

Version: v0 — not yet started.
Last patch: none.
Inbox: empty.

Start here: "Let's start with Phase 1 — scaffold the content schema."