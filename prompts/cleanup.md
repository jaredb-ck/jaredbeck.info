# Cleanup Reference

Guidelines for what Claude Code may and may not clean up in this project.

## Locked — never touch

These files and directories are permanently locked. Do not modify, refactor,
delete, or rename any of these regardless of the reason:

- /app/layout.tsx — root layout with beta banner and version switcher
- /app/changelog/ — all files within this route
- /changelog/changelog.module.css — styles locked permanently
- /types/ — all TypeScript interfaces
- /data/ — all JSON files and every field within them
- /public/images/ — processed project assets
- /prompts/ — reference files, not modified by Claude Code
- Any past version route group once a newer version exists
- Any version.config.ts within any version route group

## Safe to clean up

- Unused imports within a version's own files
- Dead code within a version's own components (not shared code)
- Formatting and whitespace in non-locked files

## Patches vs versions

A PATCH is a small refinement within the current version.
Log it in the patches[] array of the current version in changelog.json.
Do not create a new version route group for a patch.

A VERSION is a new overall concept with its own aesthetic direction.
Create a new fully isolated route group. Add a new changelog entry.

## When in doubt

If uncertain whether a cleanup action touches a locked file, ask before proceeding.
