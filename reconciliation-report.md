# Reconciliation Report — 2026-04-16

Audit triggered by update to `prompts/inbox.md`. Checked all 8
project entries in `projects.json`, all files in `/public/images/`
and `/public/videos/`, and locked file integrity.

---

## Step 1 — projects.json Schema Audit

| Check | Result |
|-------|--------|
| `"file"` → `"src"` renames | **None needed** — all 8 projects already use `"src"` |
| `"width"` → `"w"` renames | **None needed** — all entries already use `"w"` |
| `"height"` → `"h"` renames | **None needed** — all entries already use `"h"` |
| `w: 0` / `h: 0` on real assets | **None found** — all dimensions are real values |
| Missing `videos[]` array | **None** — all 8 projects have a `videos[]` array |
| Valid JSON | **Yes** — file parses cleanly |

**No changes made to projects.json.**

---

## Step 2 — /public/images/ Audit

**Broken references (JSON src with no file on disk):** None

**Orphaned files (on disk but not in JSON):** None

All 8 project image directories verified:

| Project | Images in JSON | Files on disk | Match |
|---------|---------------|---------------|-------|
| adidas-thrift-and-ride | 15 | 15 | OK |
| ping | 9 | 9 | OK |
| rockhall | 8 | 8 | OK |
| color-study-branding | 12 | 12 | OK |
| speed-shapes-branding | 12 | 12 | OK |
| bandupgotti-branding | 10 | 10 | OK |
| frank-and-pattys-marketing | 9 | 9 | OK |
| onlyyou-marketing | 15 | 15 | OK |

Note: `/public/images/changelog/` exists and is not project data — skipped.

---

## Step 3 — /public/videos/ Audit

**Broken references (JSON src with no file on disk):** None

**Orphaned files (on disk but not in JSON):** None

| Project | Videos in JSON | Files on disk | Match |
|---------|---------------|---------------|-------|
| adidas-thrift-and-ride | 1 | 1 | OK |
| ping | 3 | 3 | OK |
| rockhall | 12 | 12 | OK |
| color-study-branding | 8 | 8 | OK |
| speed-shapes-branding | 4 | 4 | OK |
| bandupgotti-branding | 1 | 1 | OK |
| frank-and-pattys-marketing | 0 | 0 | OK |
| onlyyou-marketing | 1 | 1 | OK |

---

## Step 4 — compress-images.js

`scripts/compress-images.js` does not exist. No `scripts/` directory
found in the project. **Nothing to update.**

---

## Step 5 — Locked Files

**No locked files were modified during this reconciliation pass.**

Pre-existing uncommitted changes (from prior sessions, NOT this pass):

| File | Status |
|------|--------|
| `app/components/VersionSwitcher.module.css` | Modified (unstaged) |
| `types/index.ts` | Modified (unstaged) |

Additionally, 5 previously committed image files show as deleted in
the working tree (likely renamed in a prior ingestion session):

- `public/images/ping/club-category-desktop.png` (deleted)
- `public/images/ping/home-desktop.png` (deleted)
- `public/images/ping/pdp-desktop.png` (deleted)
- `public/images/rockhall/home.png` (deleted)
- `public/images/rockhall/museum-desktop.png` (deleted)

These are stale git-tracked files that no longer exist on disk and
are not referenced in projects.json. They should be staged as
deletions in the next commit.

---

## Step 6 — Summary

| Category | Issues Found | Changes Made |
|----------|-------------|--------------|
| Field renames (`file`→`src`, `width`→`w`, `height`→`h`) | 0 | 0 |
| Zero-sentinel dimensions on real assets | 0 | 0 |
| Missing `videos[]` arrays | 0 | 0 |
| Broken image references | 0 | — |
| Orphaned image files | 0 | — |
| Broken video references | 0 | — |
| Orphaned video files | 0 | — |
| compress-images.js updates | N/A (file doesn't exist) | 0 |
| Locked files modified by this pass | 0 | 0 |

**The codebase is fully aligned with the updated inbox.md schema.
No data or code changes were required.**

---

## Items for Your Input

1. **Stale git deletions** — 5 image files from `ping` and `rockhall`
   are tracked by git but no longer exist on disk. Recommend staging
   these deletions (`git add -u public/images/ping/ public/images/rockhall/`)
   in the next commit.

2. **Pre-existing locked file modifications** — `VersionSwitcher.module.css`
   and `types/index.ts` have uncommitted changes from a prior session.
   These were not touched during this pass, but should be reviewed
   and committed or reverted at your discretion.
