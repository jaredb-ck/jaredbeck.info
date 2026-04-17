You are helping me organize, catalogue, and optimize a folder of
graphic design portfolio assets. The output should be a structured
JSON file that maps directly into my portfolio's content schema,
and all assets should be compressed and web-ready before being
referenced in the schema.

## Context
This is for "The Living Portfolio" — a graphic design portfolio site.
The content schema expects projects to be defined with specific fields
(see Target Schema below). Your job is to analyze the assets, infer
as much as possible, compress all images for web, and produce a draft
JSON that I can review and amend before it goes live.

## Target Schema
Each project should conform to this shape:

{
  "id": "unique-kebab-case-id",
  "title": "Project Title",
  "dateAdded": "YYYY-MM-DD",
  "year": "YYYY",
  "tags": ["tag1", "tag2"],
  "medium": "e.g. Brand Identity / Print / Digital / Illustration",
  "description": "A short 1-2 sentence description of the project.",
  "role": "e.g. Art Director / Designer / Collaborator",
  "images": [
    {
      "src": "filename.webp",
      "w": 1920,
      "h": 1080,
      "originalSize": "4.2MB",
      "compressedSize": "180KB"
    }
  ],
  "videos": [
    {
      "src": "filename.mp4",
      "w": 1920,
      "h": 1080
    }
  ],
  "caseStudy": {
    "problem": "",
    "process": "",
    "outcome": ""
  }
}

## Instructions

### Step 1 — Inventory
Scan the provided asset folder. List every file with:
- Filename
- Format (jpg, jpeg, png, tiff, gif, pdf, mp4, etc.)
- Dimensions and aspect ratio
- File size
- Any date metadata available (EXIF or filename)
- Flag any file under 800px wide as [TOO SMALL — possible thumbnail]
- Flag any file with an unusual aspect ratio (under 0.3 or over 4.0)
  as [UNUSUAL RATIO — confirm before processing]

Skip and flag the following — do not process:
- GIF files — flag in report, leave in source folder
- PDF files — flag in report, leave in source folder
- Any file under 400px in its largest dimension

### Step 2 — Duplicate Detection
Before grouping, check for duplicates:
- Compare filenames against existing entries in /data/projects.json
- Compare filenames against existing files in /public/images/
- Flag any matches as [POSSIBLE DUPLICATE] and exclude from
  processing unless I explicitly confirm otherwise

### Step 3 — Group into Projects
Analyze the images visually and by filename patterns. Group images
that appear to belong to the same project.

Process in batches of 20 images maximum. After each batch, present
the proposed groupings and wait for my confirmation before moving
to the next batch.

Flag any images you are uncertain about as "ungrouped" for me
to sort manually.

STOP after Step 3. Present all proposed groupings and wait for
my explicit approval before compressing or moving anything.

### Step 4 — Analyze and Tag Each Project
Once groupings are approved, generate for each project:
- **title** — infer from filenames or visual content; flag as
  [NEEDS REVIEW] if uncertain
- **year** — extract from EXIF or filename if available; otherwise
  leave blank and flag
- **dateAdded** — use today's date as placeholder; I will amend
  chronological order manually
- **medium** — infer from visual content: Brand Identity, Print,
  Editorial, Digital, Illustration, Packaging, Environmental,
  Motion, Type Design, etc.
- **tags** — generate 3-6 tags per project from these categories:
    - Medium: branding, print, digital, illustration, packaging,
      editorial, type, motion, environmental
    - Style: minimal, maximalist, geometric, organic, typographic,
      photographic, collage, system
    - Color: monochrome, duotone, full-color, muted, saturated,
      black-and-white
    - Industry: fashion, food, music, tech, culture, publishing,
      retail, nonprofit (infer if possible)
- **description** — write a neutral 1-2 sentence description of
  what the work appears to be
- **role** — leave blank and flag as [NEEDS REVIEW]
- **images** — list all image files in the group; read intrinsic
  pixel dimensions using:
    sips -g pixelWidth -g pixelHeight [filename]
  Designate the strongest image as "hero", rest as "supplementary"
- **videos** — list all video files in the group; read intrinsic
  pixel dimensions using:
    mdls -name kMDItemPixelWidth -name kMDItemPixelHeight [filename]
- **caseStudy** — leave all fields blank; I will fill these in

### Step 5 — Compress and Optimize All Images
Install sharp as a dev dependency if not already available:

  npm install sharp --save-dev

Save the following script as scripts/compress-images.js before
running it — this makes it reusable for future ingestion sessions:

  const sharp = require('sharp');
  const fs = require('fs');
  const path = require('path');

  const images = [
    // populated dynamically per session
    // { input, output, role, hasTransparency }
  ];

  async function compressImage({ input, output, role, hasTransparency }) {
    const isHero = role === 'hero';
    const maxWidth = isHero ? 1920 : 1200;
    const quality = isHero ? 85 : 80;

    const originalSize = fs.statSync(input).size;

    const pipeline = sharp(input)
      .resize({ width: maxWidth, withoutEnlargement: true });

    if (hasTransparency) {
      await pipeline
        .webp({ lossless: true })
        .withMetadata(false)
        .toFile(output);
    } else {
      await pipeline
        .webp({ quality })
        .withMetadata(false)
        .toFile(output);
    }

    const compressedSize = fs.statSync(output).size;
    const heroThreshold = 500 * 1024;
    const suppThreshold = 300 * 1024;
    const threshold = isHero ? heroThreshold : suppThreshold;
    const overThreshold = compressedSize > threshold;

    return {
      file: path.basename(output),
      originalSize: (originalSize / 1024 / 1024).toFixed(2) + 'MB',
      compressedSize: (compressedSize / 1024).toFixed(0) + 'KB',
      savings: (((originalSize - compressedSize) / originalSize) * 100).toFixed(0) + '%',
      overThreshold
    };
  }

  async function run() {
    fs.mkdirSync('scripts/compression-logs', { recursive: true });
    const results = [];

    for (const image of images) {
      const result = await compressImage(image);
      results.push(result);
      console.log(result);
    }

    fs.writeFileSync(
      'scripts/compression-logs/last-run.json',
      JSON.stringify(results, null, 2)
    );

    const overThreshold = results.filter(r => r.overThreshold);
    if (overThreshold.length > 0) {
      console.log('\nFLAGGED — still over size threshold:');
      overThreshold.forEach(r => console.log(' -', r.file, r.compressedSize));
    }
  }

  run();

**Conversion rules:**
- Convert jpg, jpeg, png, tiff → .webp
- Detect transparency in PNG files — use lossless WebP for those
- Strip all EXIF metadata on output
- Do not enlarge images smaller than the max width
- Do not compress video files — move as-is to
  /public/videos/[project-id]/

**Size thresholds — flag and ask before proceeding if exceeded:**
- Hero images: flag if still over 500KB after compression
- Supplementary images: flag if still over 300KB after compression

**Naming convention for output files:**
  [project-id]-01.webp
  [project-id]-02.webp
  etc.

Record compression results in scripts/compression-logs/last-run.json
for reference.

### Step 6 — Move Assets
Move all compressed .webp files to:
  /public/images/[project-id]/

Move all video files as-is to:
  /public/videos/[project-id]/

Do not move original source files. Leave them untouched in the
source folder.

### Step 7 — Output
Produce two files:

1. **draft-projects.json** — the full structured JSON array using
   { "src", "w", "h" } for all image and video entries, ready to
   copy into /data/projects.json after review. Include originalSize
   and compressedSize on image entries. Flag every field needing
   input with [NEEDS REVIEW].

2. **ingestion-report.md** — a human-readable summary including:
   - Total assets processed
   - Total size before and after compression
   - Overall size savings percentage
   - Per-project compression summary
   - Number of projects identified
   - List of ungrouped/ambiguous images needing manual sorting
   - Files skipped: GIFs, PDFs, duplicates, undersized files
   - Files still over size threshold after compression
   - Unusual aspect ratios flagged
   - Assumptions made during grouping or tagging

## Asset Location
[Specify the folder path here when running in Claude Code]

## Notes
- Do not rename original source files — only compressed outputs
  get renamed to the [project-id]-01.webp convention
- All image entries use { "src", "w", "h" } — never use
  "file", "width", or "height" as field names
- If an image appears to be a mockup or presentation of another
  piece, keep them in the same project group
- Prefer grouping conservatively — smaller certain groups over
  large uncertain ones
- next/image handles responsive serving at runtime — one compressed
  file per image at max dimensions is sufficient, no size variants
  needed
- The compression script is saved to scripts/compress-images.js
  and can be rerun independently in future sessions
- Sentinel w: 0, h: 0 is reserved for placeholder projects only —
  never write zeros for assets that have actually been processed