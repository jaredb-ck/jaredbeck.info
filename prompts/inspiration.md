# Add Inspiration Folder to Existing Project

Amend the current project structure to add a permanent inspiration
folder. Do not modify any existing files or folders. This is an
additive change only.

## What to create

1. Create this folder structure:

/inspiration/
  /v0-blueprint/        ← retroactive inspiration archive for v0
    .gitkeep
  /v1-name/             ← ready for when v1 begins
    .gitkeep
  /general/             ← timeless references, not version-specific
    .gitkeep

2. Create /inspiration/README.md with these contents:

  # Inspiration Library

  Drop visual references into the folder for the version you are
  working on before starting any new version build.

  Accepted files: jpg, png, pdf, gif, webp, mood boards, exports

  Optionally add a notes.txt to any folder with:
  - URLs to sites, Behance projects, Are.na boards, Dribbble shots
  - Designer or studio names that feel relevant
  - Notes about what specifically draws you to each reference —
    the grid, the type, the color, the feeling, the motion

  Do not add inspiration files directly to this root folder.
  Always use the version subfolder.

3. Add /inspiration/ to .gitignore — raw reference images are
   never committed. Only the briefs extracted from them and stored
   in each version.config.ts are committed.

## Do not touch

- Any existing version route groups
- /data and all JSON files
- /app/layout.tsx
- changelog.module.css
- /changelog
- Any existing version.config.ts files
- /public/images
- CLAUDE.md

## Confirm when done

When complete, confirm:
- Folder structure created
- README.md written
- .gitignore updated
- No existing files were modified