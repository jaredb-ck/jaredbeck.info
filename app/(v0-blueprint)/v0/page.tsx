import projectsData from '@/data/projects.json'
import aboutData from '@/data/about.json'
import type { Project, About } from '@/types'
import V0App from './V0App'

const projects = (projectsData as Project[]).sort(
  (a, b) => new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime()
)
const about = aboutData as About

export default function Home() {
  return (
    <V0App
      projects={projects}
      aboutSkillsCount={about.skills.length}
    />
  )
}
