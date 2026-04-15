import { notFound } from 'next/navigation'
import projectsData from '@/data/projects.json'
import aboutData from '@/data/about.json'
import type { Project, About } from '@/types'
import V0App from '../../V0App'

const projects = (projectsData as Project[]).sort(
  (a, b) => new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime()
)
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
    <V0App
      projects={projects}
      aboutSkillsCount={about.skills.length}
    />
  )
}
