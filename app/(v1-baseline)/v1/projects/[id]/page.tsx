import { notFound } from 'next/navigation'
import projectsData from '@/data/projects.json'
import aboutData from '@/data/about.json'
import type { Project, About } from '@/types'
import V1App from '../../V1App'

const projects = (projectsData as Project[]).sort((a, b) => {
  // Primary: newest-added first.
  const byDate = new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime()
  if (byDate !== 0) return byDate
  // Tiebreaker when multiple projects share a dateAdded (e.g. ingested in
  // the same batch): newer project year first, so pagination walks the list
  // in most-recent-work order.
  return b.year - a.year
})
const about = aboutData as About

export function generateStaticParams() {
  return projects.map((p) => ({ id: p.id }))
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const project = projects.find((p) => p.id === id)
  return { title: project?.title ?? 'Project' }
}

export default async function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!projects.find((p) => p.id === id)) notFound()

  return (
    <V1App
      projects={projects}
      aboutSkillsCount={about.skills.length}
    />
  )
}
