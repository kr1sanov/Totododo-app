"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Plus, MoreHorizontal } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { useProjects } from "@/hooks/use-projects"
import { useToast } from "@/components/ui/use-toast"

export function ProjectsList() {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [projectName, setProjectName] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { projects, addProject, deleteProject, archiveProject } = useProjects()
  const { toast } = useToast()

  const handleCreateProject = async () => {
    if (projectName.trim()) {
      setIsSubmitting(true)

      try {
        await addProject(projectName)

        // Reset form and close dialog
        setProjectName("")
        setIsDialogOpen(false)
      } catch (error) {
        toast({
          title: "Ошибка",
          description: "Не удалось создать проект. Пожалуйста, попробуйте снова.",
          variant: "destructive",
        })
      } finally {
        setIsSubmitting(false)
      }
    }
  }

  const handleDeleteProject = async (id: string, name: string) => {
    try {
      await deleteProject(id)
    } catch (error) {
      toast({
        title: "Ошибка",
        description: `Не удалось удалить проект "${name}". Пожалуйста, попробуйте снова.`,
        variant: "destructive",
      })
    }
  }

  const handleArchiveProject = async (id: string, name: string) => {
    try {
      await archiveProject(id)
    } catch (error) {
      toast({
        title: "Ошибка",
        description: `Не удалось архивировать проект "${name}". Пожалуйста, попробуйте снова.`,
        variant: "destructive",
      })
    }
  }

  return (
    <div className="p-4 pb-20">
      <div className="grid gap-4">
        {projects.length > 0 ? (
          projects.map((project) => (
            <Card key={project.id} className="border-white/10 bg-card/80 shadow-[0_20px_60px_-26px_rgba(0,0,0,0.55)] backdrop-blur-xl">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <Link href={`/projects/${project.id}`} className="flex-1">
                    <div className="font-medium">{project.title}</div>
                    <div className="mt-1 text-sm text-muted-foreground">
                      {project.tasks.length > 0
                        ? `${project.tasks.filter((t) => t.completed).length}/${project.tasks.length} задач`
                        : "Нет задач"}
                    </div>
                  </Link>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Действия</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>Изменить</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleArchiveProject(project.id, project.title)}>
                        Архивировать
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleDeleteProject(project.id, project.title)}
                        className="text-destructive"
                      >
                        Удалить
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="rounded-2xl border border-dashed border-white/10 bg-card/40 px-4 py-10 text-center text-muted-foreground backdrop-blur-sm">
            У вас пока нет проектов. Создайте новый проект, чтобы начать.
          </div>
        )}
      </div>

      <Button
        className="fixed bottom-24 right-4 z-10 h-14 w-14 rounded-full shadow-[0_16px_50px_-20px_rgba(56,189,248,0.7)]"
        onClick={() => setIsDialogOpen(true)}
      >
        <Plus className="h-6 w-6" />
      </Button>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Новый проект</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Название проекта</Label>
              <Input
                id="name"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="Введите название проекта"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isSubmitting}>
              Отменить
            </Button>
            <Button onClick={handleCreateProject} disabled={!projectName.trim() || isSubmitting}>
              {isSubmitting ? "Создание..." : "Создать"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
