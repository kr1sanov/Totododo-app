"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { MoreHorizontal, RotateCcw, Trash2, Calendar, CheckSquare } from "lucide-react"
import { format } from "date-fns"
import { ru } from "date-fns/locale"
import { useTrash } from "@/hooks/use-trash"
import { Badge } from "@/components/ui/badge"

export function Trash() {
  const [activeTab, setActiveTab] = useState("all")
  const { trashedItems, restoreItem, deleteItem } = useTrash()

  const filteredItems = activeTab === "all" ? trashedItems : trashedItems.filter((item) => item.type === activeTab)

  return (
    <div className="p-4">
      <Tabs defaultValue="all" onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-3 mb-6">
          <TabsTrigger value="all">Все</TabsTrigger>
          <TabsTrigger value="event">События</TabsTrigger>
          <TabsTrigger value="task">Задачи</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4">
          {filteredItems.length > 0 ? (
            filteredItems.map((item) => (
              <Card key={item.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        {item.type === "event" ? (
                          <Calendar className="h-4 w-4 text-primary" />
                        ) : (
                          <CheckSquare className="h-4 w-4 text-primary" />
                        )}
                        <div className="font-medium">{item.title}</div>
                        <Badge variant="outline" className="capitalize">
                          {item.type === "event" ? "Событие" : "Задача"}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Удалено: {format(new Date(item.deletedAt!), "d MMM yyyy", { locale: ru })}
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Действия</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => restoreItem(item.id)}>
                          <RotateCcw className="h-4 w-4 mr-2" />
                          Восстановить
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => deleteItem(item.id)} className="text-destructive">
                          <Trash2 className="h-4 w-4 mr-2" />
                          Удалить навсегда
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              В корзине нет {activeTab === "all" ? "элементов" : activeTab === "event" ? "событий" : "задач"}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
