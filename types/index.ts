// Shared TypeScript interfaces for The Living Portfolio.
// This file is locked — never modify field names or types.
// All UI versions must render every field, even if unpopulated.
//
// Schema changes (2026-04-15, per explicit user request):
//   - Project.client: string  — the entity the work was done for
//   - Project.agency removed — the metadata column it occupied now shows client.
//   - Project.videos: VideoAsset[] — paths relative to /public/videos/[id]/
//   - Project.images: ImageAsset[]  — was string[]; now carries intrinsic
//     pixel dimensions so UIs render at the source aspect ratio with no crop
//     and no layout shift. For projects with no real assets on disk, w and h
//     are 0 sentinels — components fall back to decorative aspect ratios.

export interface CaseStudy {
  problem: string;
  process: string;
  outcome: string;
}

// Intrinsic pixel dimensions for an asset. w and h are 0 when the file is not
// yet on disk (placeholder projects); rendering falls back to decorative sizes.
export interface ImageAsset {
  src: string; // filename, relative to /public/images/[id]/
  w: number;
  h: number;
}

export interface VideoAsset {
  src: string; // filename, relative to /public/videos/[id]/
  w: number;
  h: number;
}

export interface Credit {
  name: string;
  role?: string;
}

export interface Project {
  id: string;
  title: string;
  dateAdded: string; // ISO 8601 date string
  year: number;
  disciplineTags: string[];
  visualTags: string[];
  featured: boolean;
  medium: string;
  client: string; // the entity the work was done for
  url?: string; // live project URL, rendered as a link on the PDP
  description: string;
  role: string;
  credits: Credit[]; // collaborators and contributors on this project
  images: ImageAsset[]; // ordered list; first is the cover
  videos: VideoAsset[];
  caseStudy: CaseStudy;
}

export interface Collaborator {
  name: string;
  role: string;
  url?: string;
}

export interface About {
  bio: string;
  philosophy: string;
  skills: string[];
  collaborators: Collaborator[];
}

export interface Education {
  institution: string;
  degree: string;
  year: number;
}

export interface Client {
  name: string;
  project: string;
  year: number;
}

export interface Exhibition {
  title: string;
  venue: string;
  year: number;
  location: string;
}

export interface CV {
  education: Education[];
  clients: Client[];
  exhibitions: Exhibition[];
}

export interface Patch {
  date: string; // ISO 8601 date string
  note: string;
}

export interface ChangelogEntry {
  version: string; // e.g. "v0", "v1"
  name: string;    // e.g. "Blueprint"
  date: string;    // ISO 8601 date string
  aesthetic: string;
  constraint: string;
  promptSummary: string;
  screenshot: string; // path relative to /public/images/changelog/
  patches: Patch[];
}
