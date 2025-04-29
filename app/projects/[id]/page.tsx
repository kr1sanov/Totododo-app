import { ProjectDetails } from "@/components/project-details"
import { BottomNavigation } from "@/components/bottom-navigation"
import { BackButton } from "@/components/back-button"

export default function ProjectPage({ params }: { params: { id: string } }) {
  return (
    <main className="flex min-h-screen flex-col">
      <div className="p-4 border-b">
        <BackButton />
      </div>
      <div className="flex-1 overflow-auto pb-16">
        <ProjectDetails id={params.id} />
      </div>
      <BottomNavigation activeTab="projects" />
    </main>
  )
}
