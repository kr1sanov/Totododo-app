"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { CalendarIcon, CheckCircle, Clock, AlertTriangle, ChevronDown } from "lucide-react"
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, subMonths } from "date-fns"
import { ru } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { useCalendarItems } from "@/hooks/use-calendar-items"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

export function Analytics() {
  const [activeTab, setActiveTab] = useState("overview")
  const [dateRange, setDateRange] = useState<"all" | "month" | "week" | "custom">("all")
  const [startDate, setStartDate] = useState<Date | undefined>(subMonths(new Date(), 1))
  const [endDate, setEndDate] = useState<Date | undefined>(new Date())
  const [isStartDateOpen, setIsStartDateOpen] = useState(false)
  const [isEndDateOpen, setIsEndDateOpen] = useState(false)

  const { getStatistics } = useCalendarItems()

  // Определяем диапазон дат для статистики
  const getDateRangeForStats = () => {
    const now = new Date()

    switch (dateRange) {
      case "month":
        return {
          start: startOfMonth(now),
          end: endOfMonth(now),
        }
      case "week":
        return {
          start: startOfWeek(now, { weekStartsOn: 1 }),
          end: endOfWeek(now, { weekStartsOn: 1 }),
        }
      case "custom":
        return {
          start: startDate,
          end: endDate,
        }
      default:
        return {
          start: undefined,
          end: undefined,
        }
    }
  }

  const { start, end } = getDateRangeForStats()
  const stats = getStatistics(start, end)

  const dateRangeLabels = {
    all: "Все время",
    month: "Месяц",
    week: "Неделя",
    custom: "Свой период",
  }

  return (
    <div className="p-4 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Аналитика</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-full justify-between h-12 text-base">
                  {dateRangeLabels[dateRange]}
                  <ChevronDown className="h-5 w-5 ml-2 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-[200px]">
                <DropdownMenuItem onClick={() => setDateRange("all")}>Все время</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setDateRange("month")}>Месяц</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setDateRange("week")}>Неделя</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setDateRange("custom")}>Свой период</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {dateRange === "custom" && (
              <div className="flex flex-col sm:flex-row gap-2 mt-2">
                <div className="flex-1">
                  <Popover open={isStartDateOpen} onOpenChange={setIsStartDateOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal h-12 text-base",
                          !startDate && "text-muted-foreground",
                        )}
                      >
                        <CalendarIcon className="mr-2 h-5 w-5" />
                        {startDate ? format(startDate, "d MMMM yyyy", { locale: ru }) : "Начальная дата"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={startDate}
                        onSelect={(date) => {
                          setStartDate(date)
                          setIsStartDateOpen(false)
                        }}
                        locale={ru}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="flex-1">
                  <Popover open={isEndDateOpen} onOpenChange={setIsEndDateOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal h-12 text-base",
                          !endDate && "text-muted-foreground",
                        )}
                      >
                        <CalendarIcon className="mr-2 h-5 w-5" />
                        {endDate ? format(endDate, "d MMMM yyyy", { locale: ru }) : "Конечная дата"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={endDate}
                        onSelect={(date) => {
                          setEndDate(date)
                          setIsEndDateOpen(false)
                        }}
                        locale={ru}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            )}
          </div>

          <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-2 mb-4">
              <TabsTrigger value="overview">Обзор</TabsTrigger>
              <TabsTrigger value="tasks">Задачи</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-muted/50 p-3 rounded-lg">
                  <div className="text-sm text-muted-foreground">События</div>
                  <div className="text-2xl font-bold mt-1">{stats.totalEvents}</div>
                </div>
                <div className="bg-muted/50 p-3 rounded-lg">
                  <div className="text-sm text-muted-foreground">Задачи</div>
                  <div className="text-2xl font-bold mt-1">{stats.totalTasks}</div>
                </div>
              </div>

              {stats.totalTasks > 0 && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Прогресс выполнения задач</span>
                    <span>{stats.completionRate}%</span>
                  </div>
                  <Progress value={stats.completionRate} />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-muted/50 p-3 rounded-lg">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span className="font-medium">Выполнено</span>
                  </div>
                  <div className="text-2xl font-bold mt-1">{stats.completedTasks}</div>
                </div>

                <div className="bg-muted/50 p-3 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-blue-500" />
                    <span className="font-medium">В процессе</span>
                  </div>
                  <div className="text-2xl font-bold mt-1">{stats.pendingTasks}</div>
                </div>
              </div>

              {stats.overdueTasks > 0 && (
                <div className="flex items-center justify-between bg-red-500 p-3 rounded-md text-white dark:text-black">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5" />
                    <span>Просрочено задач</span>
                  </div>
                  <div className="text-xl font-bold">{stats.overdueTasks}</div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="tasks" className="space-y-4">
              <div className="space-y-3">
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-red-500"></div>
                      <span>Высокий приоритет</span>
                    </div>
                    <span>{stats.highPriorityTasks} задач</span>
                  </div>
                  <Progress
                    value={stats.totalTasks > 0 ? (stats.highPriorityTasks / stats.totalTasks) * 100 : 0}
                    className="bg-muted h-2"
                    indicatorClassName="bg-red-500"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                      <span>Средний приоритет</span>
                    </div>
                    <span>{stats.mediumPriorityTasks} задач</span>
                  </div>
                  <Progress
                    value={stats.totalTasks > 0 ? (stats.mediumPriorityTasks / stats.totalTasks) * 100 : 0}
                    className="bg-muted h-2"
                    indicatorClassName="bg-yellow-500"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                      <span>Низкий приоритет</span>
                    </div>
                    <span>{stats.lowPriorityTasks} задач</span>
                  </div>
                  <Progress
                    value={stats.totalTasks > 0 ? (stats.lowPriorityTasks / stats.totalTasks) * 100 : 0}
                    className="bg-muted h-2"
                    indicatorClassName="bg-blue-500"
                  />
                </div>
              </div>

              <div className="pt-4 border-t">
                <div className="font-medium mb-2">Распределение по приоритетам</div>
                <div className="flex h-4 rounded-md overflow-hidden">
                  {stats.highPriorityTasks > 0 && (
                    <div
                      className="bg-red-500"
                      style={{ width: `${(stats.highPriorityTasks / stats.totalTasks) * 100}%` }}
                    ></div>
                  )}
                  {stats.mediumPriorityTasks > 0 && (
                    <div
                      className="bg-yellow-500"
                      style={{ width: `${(stats.mediumPriorityTasks / stats.totalTasks) * 100}%` }}
                    ></div>
                  )}
                  {stats.lowPriorityTasks > 0 && (
                    <div
                      className="bg-blue-500"
                      style={{ width: `${(stats.lowPriorityTasks / stats.totalTasks) * 100}%` }}
                    ></div>
                  )}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
