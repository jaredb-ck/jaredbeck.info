# Process Inbox

Use this prompt when you have added new project assets to the /inbox folder.

---

**Trigger phrase:** "Process the inbox"

**Claude will:**
1. Read each subfolder in /inbox as a distinct project
2. Read notes.txt if present and use it to pre-fill schema fields
3. Analyze all image assets visually — generate tags, medium, and a short description
4. Move processed images to /public/images/[project-id]/ and videos to /public/videos/[project-id]/
5. **Read intrinsic pixel dimensions for every image and video** (e.g. `sips -g pixelWidth -g pixelHeight` for jpgs/pngs, `mdls -name kMDItemPixelWidth -name kMDItemPixelHeight` for mp4s) and bake them into each `ImageAsset` / `VideoAsset` entry as `{src, w, h}`. **Do not crop or resize source files** — UIs render at the native aspect ratio.
6. Append new entries to /data/projects.json — never modify existing entries
7. Set dateAdded to today's date automatically
8. Flag any uncertain fields with [NEEDS REVIEW]
9. Produce an ingestion-report.md summarizing what was processed
10. Remind you to clear the /inbox folder when complete

**Inbox rules:**
- One subfolder per project — never mix projects in one folder
- /inbox is gitignored — raw assets are never committed to git
- Processed assets live permanently in /public/images/[project-id]/
- projects.json is the source of truth — inbox is the entry point
- New entries are appended with today's date as dateAdded
- The portfolio always sorts newest first — no manual ordering needed

**notes.txt format (write naturally — no strict structure required):**

```
Title: Project Name
Year: 2024
Role: Art Director
Client: Client Name
Brief: Short description of the project scope and outcome.
```

**Asset shape in projects.json:**

```jsonc
"images": [
  { "src": "cover.jpg", "w": 3840, "h": 2160 },
  { "src": "detail-01.jpg", "w": 2160, "h": 3840 }
],
"videos": [
  { "src": "campaign-cut.mp4", "w": 1920, "h": 1080 }
]
```

Sentinel `w: 0, h: 0` is reserved for placeholder projects whose files don't yet exist on disk — do not write zeros for assets you've actually moved into /public/.
