"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Search, X, Calendar, Clock } from "lucide-react"
import { format } from "date-fns"
import { ru } from "date-fns/locale"
import { useProjects } from "@/hooks/use-projects"
import { useEvents } from "@/hooks/use-events"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"

interface SearchDialogProps {
  isOpen: boolean
  onClose: () => void
}

export function SearchDialog({ isOpen, onClose }: SearchDialogProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<any[]>([])
  const { projects } = useProjects()
  const { events } = useEvents()
  const router = useRouter()

  // Выполняем поиск при изменении запроса
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([])
      return
    }

    const query = searchQuery.toLowerCase().trim()
    const results: any[] = []

    // Поиск по задачам
    projects.forEach((project) => {
      project.tasks.forEach((task) => {
        if (
          task.title.toLowerCase().includes(query) ||
          (task.description && task.description.toLowerCase().includes(query)) ||
          (task.location && task.location.toLowerCase().includes(query))
        ) {
          results.push({
            type: "task",
            id: task.id,
            projectId: project.id,
            projectName: project.title,
            title: task.title,
            description: task.description,
            dueDate: task.dueDate,
            priority: task.priority,
            completed: task.completed,
          })
        }
      })
    })

    // Поиск по событиям
    events.forEach((event) => {
      if (
        event.title.toLowerCase().includes(query) ||
        (event.description && event.description.toLowerCase().includes(query)) ||
        (event.location && event.location.toLowerCase().includes(query))
      ) {
        results.push({
          type: "event",
          id: event.id,
          title: event.title,
          description: event.description,
          startDate: event.startDate,
          endDate: event.endDate,
          location: event.location,
        })
      }
    })

    // Поиск по проектам
    projects.forEach((project) => {
      if (project.title.toLowerCase().includes(query)) {
        results.push({
          type: "project",
          id: project.id,
          title: project.title,
          tasksCount: project.tasks.length,
        })
      }
    })

    setSearchResults(results)
  }, [searchQuery, projects, events])

  const handleResultClick = (result: any) => {
    if (result.type === "task") {
      router.push(`/projects/${result.projectId}`)
    } else if (result.type === "project") {
      router.push(`/projects/${result.id}`)
    } else if (result.type === "event") {
      // Для событий просто закрываем диалог, так как нет отдельной страницы для событий
      onClose()
    }
  }

  const priorityColors = {
    low: "bg-blue-100 text-blue-800",
    medium: "bg-yellow-100 text-yellow-800",
    high: "bg-red-100 text-red-800",
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] p-0">
        <div className="flex items-center p-4 border-b">
          <Search className="h-5 w-5 text-muted-foreground mr-2" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Поиск по задачам, событиям и проектам..."
            className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
            autoFocus
          />
          {searchQuery && (
            <Button variant="ghost" size="icon" onClick={() => setSearchQuery("")}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-2">
          {searchResults.length > 0 ? (
            <div className="space-y-2">
              {searchResults.map((result) => (
                <div
                  key={`${result.type}-${result.id}`}
                  className="p-3 hover:bg-muted rounded-md cursor-pointer"
                  onClick={() => handleResultClick(result)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {result.type === "task" && (
                        <Badge variant={result.completed ? "outline" : "secondary"} className="capitalize">
                          Задача
                        </Badge>
                      )}
                      {result.type === "event" && (
                        <Badge variant="secondary" className="bg-green-100 text-green-800 capitalize">
                          Событие
                        </Badge>
                      )}
                      {result.type === "project" && (
                        <Badge variant="secondary" className="bg-purple-100 text-purple-800 capitalize">
                          Проект
                        </Badge>
                      )}
                      <h3 className={cn("font-medium", result.completed && "line-through")}>{result.title}</h3>
                    </div>

                    {result.type === "task" && result.priority && (
                      <Badge className={priorityColors[result.priority]}>
                        {result.priority === "low" ? "Низкий" : result.priority === "medium" ? "Средний" : "Высокий"}
                      </Badge>
                    )}
                  </div>

                  {result.type === "task" && (
                    <div className="mt-1 text-sm text-muted-foreground">
                      {result.projectName && <div>Проект: {result.projectName}</div>}
                      {result.dueDate && (
                        <div className="flex items-center gap-1 mt-1">
                          <Clock className="h-3 w-3" />
                          {format(new Date(result.dueDate), "d MMM yyyy HH:mm", { locale: ru })}
                        </div>
                      )}
                    </div>
                  )}

                  {result.type === "event" && (
                    <div className="mt-1 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(result.startDate), "d MMM yyyy HH:mm", { locale: ru })}
                      </div>
                      {result.location && <div className="mt-1">{result.location}</div>}
                    </div>
                  )}

                  {result.type === "project" && (
                    <div className="mt-1 text-sm text-muted-foreground">{result.tasksCount} задач</div>
                  )}
                </div>
              ))}
            </div>
          ) : searchQuery ? (
            <div className="text-center py-8 text-muted-foreground">
              Ничего не найдено по запросу &quot;{searchQuery}&quot;
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">Введите запрос для поиска</div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
