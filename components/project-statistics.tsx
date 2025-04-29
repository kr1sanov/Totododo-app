"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, Clock, AlertTriangle, Tag } from "lucide-react"
import { format, isAfter, isBefore, addDays } from "date-fns"
import { ru } from "date-fns/locale"

interface ProjectStatisticsProps {
  project: any
}

export function ProjectStatistics({ project }: ProjectStatisticsProps) {
  const [activeTab, setActiveTab] = useState("overview")

  // Общая статистика
  const totalTasks = project.tasks.length
  const completedTasks = project.tasks.filter((task: any) => task.completed).length
  const activeTasks = totalTasks - completedTasks
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

  // Статистика по приоритетам
  const highPriorityTasks = project.tasks.filter((task: any) => task.priority === "high").length
  const mediumPriorityTasks = project.tasks.filter((task: any) => task.priority === "medium").length
  const lowPriorityTasks = project.tasks.filter((task: any) => task.priority === "low").length

  // Статистика по срокам
  const now = new Date()
  const overdueTasks = project.tasks.filter(
    (task: any) => !task.completed && task.dueDate && isBefore(new Date(task.dueDate), now),
  ).length

  const dueSoonTasks = project.tasks.filter(
    (task: any) =>
      !task.completed &&
      task.dueDate &&
      isAfter(new Date(task.dueDate), now) &&
      isBefore(new Date(task.dueDate), addDays(now, 3)),
  ).length

  // Статистика по тегам
  const allTags = Array.from(
    new Set(project.tasks.filter((task: any) => task.tags && task.tags.length > 0).flatMap((task: any) => task.tags)),
  )

  const tagStats = allTags
    .map((tag) => {
      const tasksWithTag = project.tasks.filter((task: any) => task.tags && task.tags.includes(tag)).length

      const completedTasksWithTag = project.tasks.filter(
        (task: any) => task.completed && task.tags && task.tags.includes(tag),
      ).length

      const completionRate = tasksWithTag > 0 ? Math.round((completedTasksWithTag / tasksWithTag) * 100) : 0

      return {
        tag,
        tasksCount: tasksWithTag,
        completedCount: completedTasksWithTag,
        completionRate,
      }
    })
    .sort((a, b) => b.tasksCount - a.tasksCount)

  // Последние действия
  const recentTasks = [...project.tasks]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Статистика проекта</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="overview">Обзор</TabsTrigger>
            <TabsTrigger value="priorities">Приоритеты</TabsTrigger>
            <TabsTrigger value="tags">Теги</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Прогресс проекта</span>
                <span>{completionRate}%</span>
              </div>
              <Progress value={completionRate} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-muted/50 p-3 rounded-lg">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span className="font-medium">Выполнено</span>
                </div>
                <div className="text-2xl font-bold mt-1">{completedTasks}</div>
              </div>

              <div className="bg-muted/50 p-3 rounded-lg">
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-blue-500" />
                  <span className="font-medium">Активно</span>
                </div>
                <div className="text-2xl font-bold mt-1">{activeTasks}</div>
              </div>
            </div>

            {(overdueTasks > 0 || dueSoonTasks > 0) && (
              <div className="space-y-2">
                <div className="font-medium">Сроки</div>

                {overdueTasks > 0 && (
                  <div className="flex items-center justify-between bg-red-50 p-2 rounded-md">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-red-500" />
                      <span>Просрочено</span>
                    </div>
                    <Badge variant="destructive">{overdueTasks}</Badge>
                  </div>
                )}

                {dueSoonTasks > 0 && (
                  <div className="flex items-center justify-between bg-yellow-50 p-2 rounded-md">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-yellow-500" />
                      <span>Скоро дедлайн</span>
                    </div>
                    <Badge variant="outline" className="bg-yellow-100">
                      {dueSoonTasks}
                    </Badge>
                  </div>
                )}
              </div>
            )}

            {recentTasks.length > 0 && (
              <div className="space-y-2">
                <div className="font-medium">Последние задачи</div>
                <div className="space-y-1">
                  {recentTasks.map((task) => (
                    <div key={task.id} className="text-sm flex items-center justify-between">
                      <div className={task.completed ? "line-through text-muted-foreground" : ""}>{task.title}</div>
                      <div className="text-xs text-muted-foreground">
                        {format(new Date(task.createdAt), "d MMM", { locale: ru })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="priorities" className="space-y-4">
            <div className="space-y-3">
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <span>Высокий</span>
                  </div>
                  <span>{highPriorityTasks} задач</span>
                </div>
                <Progress
                  value={totalTasks > 0 ? (highPriorityTasks / totalTasks) * 100 : 0}
                  className="bg-muted h-2"
                  indicatorClassName="bg-red-500"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                    <span>Средний</span>
                  </div>
                  <span>{mediumPriorityTasks} задач</span>
                </div>
                <Progress
                  value={totalTasks > 0 ? (mediumPriorityTasks / totalTasks) * 100 : 0}
                  className="bg-muted h-2"
                  indicatorClassName="bg-yellow-500"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                    <span>Низкий</span>
                  </div>
                  <span>{lowPriorityTasks} задач</span>
                </div>
                <Progress
                  value={totalTasks > 0 ? (lowPriorityTasks / totalTasks) * 100 : 0}
                  className="bg-muted h-2"
                  indicatorClassName="bg-blue-500"
                />
              </div>
            </div>

            <div className="pt-4 border-t">
              <div className="font-medium mb-2">Распределение по приоритетам</div>
              <div className="flex h-4 rounded-md overflow-hidden">
                {highPriorityTasks > 0 && (
                  <div className="bg-red-500" style={{ width: `${(highPriorityTasks / totalTasks) * 100}%` }}></div>
                )}
                {mediumPriorityTasks > 0 && (
                  <div
                    className="bg-yellow-500"
                    style={{ width: `${(mediumPriorityTasks / totalTasks) * 100}%` }}
                  ></div>
                )}
                {lowPriorityTasks > 0 && (
                  <div className="bg-blue-500" style={{ width: `${(lowPriorityTasks / totalTasks) * 100}%` }}></div>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="tags" className="space-y-4">
            {tagStats.length > 0 ? (
              <div className="space-y-3">
                {tagStats.map((stat) => (
                  <div key={stat.tag} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <Tag className="h-3 w-3" />
                        <span>{stat.tag}</span>
                      </div>
                      <span>
                        {stat.completedCount}/{stat.tasksCount} ({stat.completionRate}%)
                      </span>
                    </div>
                    <Progress value={stat.completionRate} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">В этом проекте пока нет задач с тегами.</div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
