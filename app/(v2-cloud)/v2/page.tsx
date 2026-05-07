import projectsData from '@/data/projects.json'
import type { Project } from '@/types'
import AssetCloud from './components/AssetCloud'

const projects = (projectsData as Project[]).sort((a, b) => {
  const byDate =
    new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime()
  if (byDate !== 0) return byDate
  return b.year - a.year
})

export default function CloudPage() {
  return <AssetCloud projects={projects} />
}
