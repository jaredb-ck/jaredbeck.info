# Tag Enrichment — Visual Asset Analysis

Analyze every image asset across all projects and enrich
the tags in projects.json with additional tags inferred
from the visual content of each image. This makes the v2
Cloud search surface projects through visual content, not
just manually written metadata.

Tags are split into two distinct arrays:
- disciplineTags[] — what kind of work it is
- visualTags[] — what is visually present in the work

This is a read-and-write pass on /data/projects.json only.
No other files are touched except where noted below.

---

## Schema change

Update the project schema to replace the single tags[]
array with two separate arrays:

  "disciplineTags": ["branding", "print", "packaging"],
  "visualTags": ["typographic", "black-and-white", "cat"]

Migrate all existing tags[] values into the correct new
array as part of this pass. After migration, remove the
tags[] field entirely from every project entry.

Update /types to reflect this schema change:
  disciplineTags: string[]
  visualTags: string[]

Remove the tags field from the TypeScript interface.

---

## Tag visibility

disciplineTags[] and visualTags[] are backend and search
data only. They are never rendered in any UI — not on
project cards, not in the lightbox metadata strip, not
on any project detail page across any version.

The only places tags are consumed are:
- The search index in /app/(v2-cloud)/lib/searchIndex.ts
- The tag vocabulary file /data/tags.json

When updating TypeScript interfaces and version components
in Step 6, ensure no component renders disciplineTags or
visualTags directly. If any existing component currently
renders the old tags[] array visually — remove that
rendering entirely. The data exists, it just never appears
on screen.

The lightbox metadata strip shows only:
- title
- year
- medium
- role

Nothing else. Tags are invisible to the user in all
versions, current and future.

---

## disciplineTags — what kind of work it is

These describe the project type, discipline, medium, and
deliverable. They answer: "what did you make?"

Infer from the images, the existing medium field, and
any notes.txt context if available.

### Disciplines
- brand-identity
- logo-design
- typography
- type-design
- print
- editorial
- publication
- poster
- packaging
- apparel
- merchandise
- environmental
- signage
- wayfinding
- out-of-home
- billboard
- social-media
- digital
- ui-ux
- web-design
- app-design
- motion
- video
- animation
- 3d
- illustration
- photography
- art-direction
- campaign
- activation
- experiential
- installation

### Format / output type
- identity-system
- brand-guidelines
- lookbook
- catalog
- book
- zine
- flyer
- card
- stationery
- label
- tag
- badge
- uniform
- jersey
- hat
- tote
- screen
- deck
- mockup
- prototype

### Industry / sector
- sports
- fashion
- food-and-beverage
- music
- entertainment
- culture
- arts
- nonprofit
- tech
- retail
- hospitality
- travel
- health
- beauty
- education
- civic

---

## visualTags — what is visually present

These describe what you can literally see in the images —
subjects, objects, environments, color, mood, style, and
photographic characteristics. They answer: "what does it
look like?"

### Subjects and objects
- People: person, woman, man, crowd, hands, face,
  portrait, model, athlete, child, group, silhouette
- Animals: cat, dog, bird, horse — any animal present
- Objects: clothing, food, drink, vehicle, bus, car,
  signage, packaging, bottle, book, phone, screen,
  device, plant, flower, furniture, chair, table,
  trophy, ball, equipment, instrument, record
- Architecture: building, interior, exterior, storefront,
  stadium, arena, museum, office, home, street, alley,
  bridge, window, door, staircase, wall, ceiling, floor
- Nature: sky, ocean, beach, forest, mountain, grass,
  water, sand, rock, tree, field, desert, snow, rain,
  sunset, clouds, night

### Environment and setting
- indoor, outdoor, studio, urban, suburban, rural,
  street, retail, restaurant, office, stage, arena,
  gallery, warehouse, rooftop, underground, on-location

### Color and tone
- black-and-white, monochrome, duotone, full-color,
  muted, saturated, high-contrast, low-contrast,
  dark, light, bright, neon, pastel, earth-tones,
  warm, cool, neutral
- Dominant colors if visually distinctive:
  red, blue, green, yellow, orange, purple, pink,
  gold, silver, teal, cream, beige, brown, black,
  white, grey

### Mood and feeling
- minimal, bold, energetic, calm, dramatic, playful,
  serious, nostalgic, futuristic, gritty, clean,
  luxurious, raw, refined, editorial, documentary,
  commercial, experimental, irreverent, elegant,
  aggressive, soft, clinical, warm, cold, chaotic,
  structured

### Graphic and typographic elements
- typographic, lettering, hand-lettering, serif,
  sans-serif, monospace, display-type, condensed,
  script, blackletter, outline, stacked-type,
  large-type, small-type, all-caps, mixed-case,
  pattern, texture, grid, geometric, organic,
  abstract, collage, layered, flat, illustrated,
  rendered, photographic, mixed-media, halftone,
  risograph, screenprint, stamp, distressed, clean

### Photography style
- portrait, landscape, product, lifestyle, documentary,
  editorial-photography, street-photography,
  architectural, close-up, macro, wide-angle, aerial,
  action, still-life, fashion-photography, reportage,
  candid, staged, long-exposure, film, digital-photo

---

## Instructions

### Step 1 — Inventory
List every project in projects.json with:
- Its current tags[] array
- Its medium field
- Number of images
Present this before analyzing anything.

### Step 2 — Migrate existing tags
For each project, sort every value currently in tags[]
into either disciplineTags[] or visualTags[]:
- If it describes what kind of work → disciplineTags
- If it describes what it looks like → visualTags
- If uncertain → disciplineTags by default

### Step 3 — Analyze each project visually
For each project, analyze every image in images[] at:
  /public/images/[project-id]/[src]

Extract:
- disciplineTags from visual evidence of deliverable
  type, format, and industry context
- visualTags from what is literally present — subjects,
  objects, color, mood, environment, graphic style

Compile the full tag set by merging across all images
in the project. If any image contains a cat, the project
gets visualTag "cat". If any image shows a jersey, the
project gets disciplineTag "apparel" and visualTag
"jersey".

### Step 4 — Confirm before writing
Present a summary for every project:

  [Project Title]
  medium: [existing medium field]

  disciplineTags (existing → final):
    migrated from tags[]: [list]
    newly extracted: [list]
    final: [complete array]

  visualTags (existing → final):
    migrated from tags[]: [list]
    newly extracted: [list]
    final: [complete array]

Wait for my explicit approval before writing anything
to projects.json.

### Step 5 — Write to projects.json
Once approved:
- Replace tags[] with disciplineTags[] and visualTags[]
  on every project entry
- Do not modify any other field
- Validate the file is still valid JSON after writing
- Report total tags added across both arrays and
  across all projects

### Step 6 — Update TypeScript interfaces
Update /types to reflect the new schema:
- Remove the tags field
- Add disciplineTags: string[]
- Add visualTags: string[]

Check every version route group for any component that
currently renders project.tags visually and remove that
rendering. Update any reference to project.tags in
non-rendering contexts (search index, filters) to use
project.disciplineTags or project.visualTags as
appropriate.

Report every file that was updated.

### Step 7 — Build a tag vocabulary file
Generate a complete sorted vocabulary of every unique
tag in use. Save as /data/tags.json:

  {
    "disciplineTags": [
      {
        "tag": "brand-identity",
        "count": 8,
        "projects": ["project-id-1", "project-id-2"]
      }
    ],
    "visualTags": [
      {
        "tag": "black-and-white",
        "count": 12,
        "projects": ["project-id-1", "project-id-3"]
      }
    ]
  }

### Step 8 — Update the v2 search index
Update /app/(v2-cloud)/lib/searchIndex.ts to:
- Index disciplineTags with high search weight —
  these are the primary navigation tags
- Index visualTags with medium search weight —
  these are discovery tags
- Load and index /data/tags.json for fast vocabulary
  lookup at runtime
- Update search scoring logic to treat discipline
  and visual matches as equal in relevance but
  ensure neither array is ever passed to a rendering
  component — search results return project ids only,
  not tag arrays

---

## Quality rules

- Only tag what is genuinely, clearly present
- Do not speculate — if uncertain, skip the tag
- Maximum 15 disciplineTags per project
- Maximum 25 visualTags per project
- Minimum 5 disciplineTags per project
- Minimum 8 visualTags per project
- Normalize to lowercase, hyphenated:
  "street photography" → "street-photography"
  "hand lettering" → "hand-lettering"
  "black and white" → "black-and-white"
- Sort each array alphabetically
- No tag should appear in both arrays
- Tags are never rendered — if any code path would
  cause a tag to appear on screen, remove it

---

## Locked files — do not touch

- Any field in projects.json other than tags[],
  disciplineTags[], and visualTags[]
- /app/layout.tsx
- Preloader.module.css
- changelog.module.css
- /changelog
- /public/images
- /public/videos

---

## After completion

1. Confirm total projects updated
2. Confirm total disciplineTags added across all projects
3. Confirm total visualTags added across all projects
4. Confirm /data/tags.json has been written
5. Confirm no component in any version renders
   disciplineTags or visualTags
6. Confirm the v2 search index has been updated

Update the Current State block in CLAUDE.md:
- Note that tags[] has been replaced with
  disciplineTags[] and visualTags[]
- Note that /data/tags.json now exists
- Note that tags are search-only — never rendered
- Note that the v2 search index has been updated