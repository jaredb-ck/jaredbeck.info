# The Living Portfolio

A graphic-design portfolio site where **the UI is in permanent beta** — rebuilt
iteratively with AI — while the content stays stable across every version.
Each version is a fully isolated Next.js route group with its own layout,
components, and animation language. The changelog of versions is itself a
portfolio piece.

Full architectural rules, locked files, and ground rules live in
[`CLAUDE.md`](./CLAUDE.md). Read that first.

## Getting started

```bash
npm install
npm run dev
# http://localhost:3000
```

The site redirects to the latest version (currently `v0` — Blueprint).
Other routes: `/v0/projects/[id]`, `/v0/about`, `/v0/cv`, `/changelog`.

## Adding a new project

Never edit `data/projects.json` by hand with raw assets. Use the inbox flow:

1. Drop a folder into `/inbox/`:
   ```
   /inbox/
     /project-name/
       image1.jpg
       image2.jpg
       campaign-cut.mp4
       notes.txt   ← title, year, role, client, brief (plain text, no strict format)
   ```
2. Run the dimension extractor to get ready-to-paste `images` / `videos` arrays:
   ```bash
   node scripts/ingest-dimensions.mjs "inbox/project-name"
   ```
3. Tell Claude **"Process the inbox"** — it'll read the folder, analyse images
   visually, move processed assets to `/public/images/[id]/` (and videos to
   `/public/videos/[id]/`), append a full schema-valid entry to
   `data/projects.json`, and flag anything uncertain as `[NEEDS REVIEW]`.
4. Clear `/inbox/` when done.

Source assets are **never cropped or resized** — every image/video carries its
intrinsic `{ w, h }` in the schema, and every UI version renders at the
native aspect ratio. See [`prompts/process-inbox.md`](./prompts/process-inbox.md).

## Stack

- **Next.js** (App Router, TypeScript, Turbopack)
- **GSAP** + `@gsap/react` for motion, Lenis for smooth scroll
- **CSS Modules** scoped per version, no Tailwind
- **Local JSON** content layer (`/data/*.json`), shared TS interfaces in `/types/index.ts`

## Locked files

A set of files is permanent and never modified during version updates — the
root layout, beta banner, version switcher, changelog page and styles, all
shared types, and every past version route group. See `## Locked Files` in
`CLAUDE.md`.

## Deploy

Vercel, zero-config. Video assets larger than ~100 MB need an external host
(Vercel Blob, Cloudflare R2, Mux, or an unlisted Vimeo/YouTube) — Vercel's
static asset budget caps around that size and GitHub rejects single files
over 100 MB outright.
