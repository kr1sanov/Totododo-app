"use client"

import { createTask } from "@/lib/data"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Filter, Plus, Search, X, Tag, BarChart2 } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuPortal,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu"
import { useProjects } from "@/hooks/use-projects"
import { TaskDialog } from "@/components/task-dialog"
import { TaskCard } from "@/components/task-card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ProjectStatistics } from "@/components/project-statistics"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"

interface ProjectDetailsProps {
  id: string
}

export function ProjectDetails({ id }: ProjectDetailsProps) {
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false)
  const [sortFilter, setSortFilter] = useState<"all" | "priority" | "date">("all")
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "completed">("all")
  const [tagFilter, setTagFilter] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [isStatsOpen, setIsStatsOpen] = useState(false)
  const { getProject } = useProjects()
  const [project, setProject] = useState(getProject(id))

  // Получаем актуальные данные проекта
  useEffect(() => {
    const currentProject = getProject(id)
    setProject(currentProject)
  }, [id, getProject])

  // Обновляем проект при изменении данных
  useEffect(() => {
    const intervalId = setInterval(() => {
      const currentProject = getProject(id)
      setProject(currentProject)
    }, 1000)

    return () => clearInterval(intervalId)
  }, [id, getProject])

  if (!project) {
    return <div className="p-4">Проект не найден</div>
  }

  // Получаем все уникальные теги из задач проекта
  const allTags = Array.from(
    new Set(project.tasks.filter((task: any) => task.tags && task.tags.length > 0).flatMap((task: any) => task.tags)),
  ).sort()

  // Фильтрация задач по статусу, тегам и поиску
  const filteredTasks = project.tasks.filter((task: any) => {
    // Фильтр по статусу
    if (statusFilter === "active" && task.completed) return false
    if (statusFilter === "completed" && !task.completed) return false

    // Фильтр по тегам
    if (tagFilter.length > 0) {
      if (!task.tags || !task.tags.some((tag: string) => tagFilter.includes(tag))) {
        return false
      }
    }

    // Поиск по запросу
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      const titleMatch = task.title.toLowerCase().includes(query)
      const descMatch = task.description?.toLowerCase().includes(query) || false
      const subtaskMatch = task.subtasks.some((subtask: any) => subtask.title.toLowerCase().includes(query))
      const tagMatch = task.tags?.some((tag: string) => tag.toLowerCase().includes(query)) || false

      return titleMatch || descMatch || subtaskMatch || tagMatch
    }

    return true
  })

  // Сортировка задач
  const sortedTasks = [...filteredTasks].sort((a, b) => {
    if (sortFilter === "priority") {
      const priorityOrder = { high: 0, medium: 1, low: 2 }
      return priorityOrder[a.priority] - priorityOrder[b.priority]
    } else if (sortFilter === "date") {
      return new Date(a.dueDate || 0).getTime() - new Date(b.dueDate || 0).getTime()
    }
    return 0
  })

  const completedTasks = project.tasks.filter((task: any) => task.completed).length
  const totalTasks = project.tasks.length
  const progressPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

  const toggleTagFilter = (tag: string) => {
    setTagFilter((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]))
  }

  const clearFilters = () => {
    setSearchQuery("")
    setStatusFilter("all")
    setTagFilter([])
    setSortFilter("all")
    setIsSearchOpen(false)
  }

  function handleCreateTask(newTaskData) {
    const newTask = {
      ...newTaskData,
      id: String(Date.now()), // временный id
      createdAt: new Date().toISOString(),
      completed: false,
    }

    // 1. Добавляем задачу сразу на экран
    setProject((prev) => ({
      ...prev,
      tasks: [newTask, ...prev.tasks],
    }))

    // 2. Отправляем на сервер
    createTask(id, newTaskData)
      .then((savedTask) => {
        // 3. Заменяем временную на настоящую
        setProject((prev) => ({
          ...prev,
          tasks: prev.tasks.map((t) => (t.id === newTask.id ? savedTask : t)),
        }))
      })
      .catch((err) => {
        console.error("Ошибка создания задачи", err)
        // 4. Если ошибка — удаляем
        setProject((prev) => ({
          ...prev,
          tasks: prev.tasks.filter((t) => t.id !== newTask.id),
        }))
      })
  }

  return (
    <div className="p-4 pb-20 relative">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold">{project.name}</h1>
        <div className="flex gap-2">
          {isSearchOpen ? (
            <div className="relative">
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Поиск задач..."
                className="w-[200px] pr-8"
                autoFocus
              />
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-full"
                onClick={() => {
                  setSearchQuery("")
                  setIsSearchOpen(false)
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <Button variant="ghost" size="icon" onClick={() => setIsSearchOpen(true)}>
              <Search className="h-4 w-4" />
            </Button>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <Filter className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuLabel>Сортировка</DropdownMenuLabel>
              <DropdownMenuRadioGroup value={sortFilter} onValueChange={(value) => setSortFilter(value as any)}>
                <DropdownMenuRadioItem value="all">По умолчанию</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="priority">По приоритету</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="date">По дате</DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>

              <DropdownMenuSeparator />

              <DropdownMenuLabel>Статус</DropdownMenuLabel>
              <DropdownMenuRadioGroup value={statusFilter} onValueChange={(value) => setStatusFilter(value as any)}>
                <DropdownMenuRadioItem value="all">Все задачи</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="active">Активные</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="completed">Выполненные</DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>

              {allTags.length > 0 && (
                <>
                  <DropdownMenuSeparator />

                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger>
                      <Tag className="h-4 w-4 mr-2" />
                      <span>Теги</span>
                      {tagFilter.length > 0 && (
                        <Badge variant="secondary" className="ml-2 px-1 py-0 text-xs">
                          {tagFilter.length}
                        </Badge>
                      )}
                    </DropdownMenuSubTrigger>
                    <DropdownMenuPortal>
                      <DropdownMenuSubContent>
                        {allTags.map((tag) => (
                          <DropdownMenuCheckboxItem
                            key={tag}
                            checked={tagFilter.includes(tag)}
                            onCheckedChange={() => toggleTagFilter(tag)}
                          >
                            {tag}
                          </DropdownMenuCheckboxItem>
                        ))}
                        {tagFilter.length > 0 && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => setTagFilter([])}>Сбросить теги</DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuSubContent>
                    </DropdownMenuPortal>
                  </DropdownMenuSub>
                </>
              )}

              {(statusFilter !== "all" || tagFilter.length > 0 || sortFilter !== "all") && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={clearFilters}>Сбросить все фильтры</DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
          <Sheet open={isStatsOpen} onOpenChange={setIsStatsOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <BarChart2 className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent className="sm:max-w-lg">
              <SheetHeader>
                <SheetTitle>Статистика проекта</SheetTitle>
              </SheetHeader>
              <ProjectStatistics project={project} />
            </SheetContent>
          </Sheet>
        </div>
      </div>

      <div className="mb-4">
        <div className="flex justify-between text-sm text-muted-foreground mb-1">
          <span>
            {completedTasks}/{totalTasks} задач
          </span>
          <span>{progressPercentage}%</span>
        </div>
        <div className="w-full bg-muted rounded-full h-2">
          <div className="bg-primary h-2 rounded-full" style={{ width: `${progressPercentage}%` }}></div>
        </div>
      </div>

      {/* Отображение активных фильтров */}
      {(statusFilter !== "all" || tagFilter.length > 0 || searchQuery) && (
        <div className="flex flex-wrap gap-2 mb-4">
          {statusFilter !== "all" && (
            <Badge variant="outline" className="flex items-center gap-1">
              Статус: {statusFilter === "active" ? "Активные" : "Выполненные"}
              <X className="h-3 w-3 cursor-pointer" onClick={() => setStatusFilter("all")} />
            </Badge>
          )}
          {tagFilter.map((tag) => (
            <Badge key={tag} variant="outline" className="flex items-center gap-1">
              Тег: {tag}
              <X className="h-3 w-3 cursor-pointer" onClick={() => toggleTagFilter(tag)} />
            </Badge>
          ))}
          {searchQuery && (
            <Badge variant="outline" className="flex items-center gap-1">
              Поиск: {searchQuery}
              <X className="h-3 w-3 cursor-pointer" onClick={() => setSearchQuery("")} />
            </Badge>
          )}
          {(statusFilter !== "all" || tagFilter.length > 0 || searchQuery) && (
            <Button variant="ghost" size="sm" onClick={clearFilters} className="h-6 px-2">
              Сбросить все
            </Button>
          )}
        </div>
      )}

      <div className="grid gap-4">
        {sortedTasks.length > 0 ? (
          sortedTasks.map((task) => <TaskCard key={task.id} task={task} projectId={project.id} />)
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            {searchQuery || statusFilter !== "all" || tagFilter.length > 0 ? (
              <>
                Задачи не найдены. Попробуйте изменить параметры поиска или фильтрации.
                <div className="mt-2">
                  <Button variant="outline" size="sm" onClick={clearFilters}>
                    Сбросить фильтры
                  </Button>
                </div>
              </>
            ) : (
              "В этом проекте пока нет задач. Создайте новую задачу, чтобы начать."
            )}
          </div>
        )}
      </div>

      <Button
        className="fixed bottom-20 right-4 rounded-full shadow-lg z-10 w-12 h-12 p-0"
        onClick={() => setIsTaskDialogOpen(true)}
      >
        <Plus className="h-6 w-6" />
      </Button>

      <TaskDialog isOpen={isTaskDialogOpen} onClose={() => setIsTaskDialogOpen(false)} projectId={project.id} />
    </div>
  )
}
