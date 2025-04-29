import { ProjectsList } from "@/components/projects-list"
import { BottomNavigation } from "@/components/bottom-navigation"
import { BackButton } from "@/components/back-button"

export default function ProjectsPage() {
  return (
    <main className="flex min-h-screen flex-col">
      <div className="p-4 border-b">
        <BackButton />
      </div>
      <div className="flex-1 overflow-auto pb-16">
        <ProjectsList />
      </div>
      <BottomNavigation activeTab="projects" />
    </main>
  )
}
