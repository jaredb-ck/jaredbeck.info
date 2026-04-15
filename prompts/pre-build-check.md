# Pre-Build Verification — Run Before Every New Version

Run this verification pass before writing a single line of code
for a new version. Do not skip any step. Report back with the
full results before we begin building anything.

## Step 1 — Git Status Check
- Confirm the current Git branch name
- If we are on main or master — STOP immediately and do not
  proceed. Remind me to create a new branch first:
    git checkout -b v[number]-[name]
- If we are on a feature branch — confirm it is clean with
  no uncommitted changes from a previous session
- Run git status and report the output

## Step 2 — Verify Existing Version Route Groups
Check that all existing version route groups are present,
intact, and unmodified. For each version found in
/app/(v*) folders, confirm:
- The route group folder exists
- layout.tsx is present
- version.config.ts is present
- page.tsx is present
- No unexpected files have been added or modified

List every version found and its status.

## Step 3 — Verify Locked Files
Check that every locked file is present and unmodified:

- /app/layout.tsx — root layout
- /changelog — entire route and all files within it
- changelog.module.css — locked stylesheet
- /data/projects.json — content, never modified directly
- /data/about.json
- /data/cv.json
- /data/changelog.json
- /types — all TypeScript interfaces
- /public/images — all processed project assets

Report each file as: PRESENT / MISSING / MODIFIED
If any file is MISSING or MODIFIED — stop and flag it
before proceeding.

## Step 4 — Verify Content Schema Integrity
- Open /data/projects.json and confirm it is valid JSON
- Confirm all required fields are present in at least one
  entry: id, title, dateAdded, year, tags, medium,
  description, role, images, caseStudy
- Open /data/changelog.json and confirm the versions array
  is intact and readable

## Step 5 — Verify Dev Environment
- Confirm Next.js dependencies are installed (node_modules
  exists and is not empty)
- Confirm the project can build without errors:
    npm run build
  If build fails — stop and fix before starting new version work
- Confirm GSAP and @gsap/react are installed

## Step 6 — Active Build Declaration
Once all checks pass, declare the active build context:

  Active version: v[number] — [name]
  Branch: [branch name]
  Working directory: /app/(v[number]-[name])/
  Off limits: all other version route groups, all locked files
  Constraint for this version: [to be defined before building]

Do not begin building until I have confirmed the constraint
for this version and given explicit approval to proceed.

## Step 7 — Add Version Constraint to CLAUDE.md
Once I confirm the constraint, add the following block to
the bottom of CLAUDE.md:

  ## Active Build — v[number] [name]
  Currently building: /(v[number]-[name])/ route group only.
  Constraint: [constraint statement]
  Do not touch any other version route group.
  Do not touch /data, /types, or /app/layout.tsx.
  Do not touch changelog.module.css or /changelog.
  All new components, styles, and config go in
  /(v[number]-[name])/ exclusively.
  When in doubt — stop and ask before proceeding.

Confirm when this block has been added.

## Clean Bill of Health
Only report a clean bill of health if ALL of the following
are true:
- We are on a non-main Git branch
- All existing version route groups are intact
- All locked files are present and unmodified
- Content schema is valid
- Project builds without errors
- Active build declaration is confirmed
- CLAUDE.md has been updated with the active build block

If any check fails — stop, report what failed, and wait
for my instruction before doing anything else.