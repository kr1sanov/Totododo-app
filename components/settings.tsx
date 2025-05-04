"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { ArchiveIcon, Trash2, Moon, Sun, Download, ExternalLink, Upload, Info, BarChart2 } from "lucide-react"
import Link from "next/link"
import { useTheme } from "next-themes"
import { toast } from "@/components/ui/use-toast"
import { removeFromStorage } from "@/lib/storage-utils"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

export function Settings() {
  const { theme, setTheme } = useTheme()
  const [isImporting, setIsImporting] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
  const [isAboutDialogOpen, setIsAboutDialogOpen] = useState(false)
  const [deleteCountdown, setDeleteCountdown] = useState(0)
  const [isDeletePressed, setIsDeletePressed] = useState(false)
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const deleteTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Проверяем, что компонент смонтирован на клиенте
  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Если компонент не смонтирован (серверный рендеринг), показываем заглушку
  if (!isMounted) {
    return (
      <div className="p-4 space-y-6 pb-20">
        <div className="animate-pulse">
          <div className="h-32 bg-muted rounded-lg mb-4"></div>
          <div className="h-32 bg-muted rounded-lg mb-4"></div>
          <div className="h-32 bg-muted rounded-lg"></div>
        </div>
      </div>
    )
  }

  const handleExportData = () => {
    try {
      // Получаем все данные из localStorage
      const calendarItems = localStorage.getItem("totododo-calendar-items") || "[]"
      const projects = localStorage.getItem("totododo-projects") || "[]"
      const archive = localStorage.getItem("totododo-archive") || "[]"
      const trash = localStorage.getItem("totododo-trash") || "[]"

      // Формируем объект для экспорта
      const exportData = {
        calendarItems: JSON.parse(calendarItems),
        projects: JSON.parse(projects),
        archive: JSON.parse(archive),
        trash: JSON.parse(trash),
        exportDate: new Date().toISOString(),
      }

      // Преобразуем в JSON и создаем ссылку для скачивания
      const dataStr = JSON.stringify(exportData, null, 2)
      const dataUri = "data:application/json;charset=utf-8," + encodeURIComponent(dataStr)
      const exportFileName = `totododo-export-${new Date().toISOString().slice(0, 10)}.json`

      const linkElement = document.createElement("a")
      linkElement.setAttribute("href", dataUri)
      linkElement.setAttribute("download", exportFileName)
      linkElement.click()

      toast({
        title: "Экспорт данных",
        description: "Данные успешно экспортированы",
      })
    } catch (error) {
      toast({
        title: "Ошибка экспорта",
        description: "Не удалось экспортировать данные",
        variant: "destructive",
      })
    }
  }

  const handleImportClick = () => {
    fileInputRef.current?.click()
  }

  const handleImportData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsImporting(true)

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string)

        // Проверяем структуру данных
        if (!data.calendarItems && !data.projects) {
          throw new Error("Неверный формат данных")
        }

        // Сохраняем данные в localStorage
        if (data.calendarItems && Array.isArray(data.calendarItems)) {
          localStorage.setItem("totododo-calendar-items", JSON.stringify(data.calendarItems))
        }

        if (data.projects && Array.isArray(data.projects)) {
          localStorage.setItem("totododo-projects", JSON.stringify(data.projects))
        }

        if (data.archive && Array.isArray(data.archive)) {
          localStorage.setItem("totododo-archive", JSON.stringify(data.archive))
        }

        if (data.trash && Array.isArray(data.trash)) {
          localStorage.setItem("totododo-trash", JSON.stringify(data.trash))
        }

        toast({
          title: "Импорт данных",
          description: "Данные успешно импортированы",
        })

        // Перезагружаем страницу для применения импортированных данных
        window.location.reload()
      } catch (error) {
        toast({
          title: "Ошибка импорта",
          description: "Не удалось импортировать данные. Проверьте формат файла.",
          variant: "destructive",
        })
      } finally {
        setIsImporting(false)
      }
    }

    reader.readAsText(file)
  }

  const handleDeleteConfirm = () => {
    setIsDeleteConfirmOpen(true)
  }

  const handleDeletePressStart = () => {
    setIsDeletePressed(true)
    setDeleteCountdown(5)

    deleteTimerRef.current = setInterval(() => {
      setDeleteCountdown((prev) => {
        if (prev <= 1) {
          if (deleteTimerRef.current) {
            clearInterval(deleteTimerRef.current)
          }
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  const handleDeletePressEnd = () => {
    setIsDeletePressed(false)
    if (deleteTimerRef.current) {
      clearInterval(deleteTimerRef.current)
    }

    if (deleteCountdown === 0) {
      // Выполняем удаление
      removeFromStorage("totododo-calendar-items")
      removeFromStorage("totododo-projects")
      removeFromStorage("totododo-archive")
      removeFromStorage("totododo-trash")

      toast({
        title: "Удаление данных",
        description: "Все данные успешно удалены",
      })

      // Перезагружаем страницу для применения изменений
      window.location.reload()
    }
  }

  return (
    <div className="p-4 space-y-6 pb-20">
      <Card>
        <CardHeader>
          <CardTitle>Внешний вид</CardTitle>
          <CardDescription>Настройте внешний вид приложения</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {theme === "dark" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
              <Label htmlFor="theme-toggle" className="text-base">
                {theme === "dark" ? "Светлый режим" : "Тёмный режим"}
              </Label>
            </div>
            <Switch
              id="theme-toggle"
              checked={theme === "dark"}
              onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
              className="h-6 w-12"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Данные</CardTitle>
          <CardDescription>Управление данными приложения</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Download className="h-5 w-5" />
              <Label className="text-base">Экспорт данных</Label>
            </div>
            <Button variant="outline" onClick={handleExportData} className="h-12 text-base">
              Экспорт
            </Button>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Upload className="h-5 w-5" />
              <Label className="text-base">Импорт данных</Label>
            </div>
            <Button variant="outline" onClick={handleImportClick} disabled={isImporting} className="h-12 text-base">
              {isImporting ? "Импорт..." : "Импорт"}
            </Button>
            <input type="file" ref={fileInputRef} onChange={handleImportData} accept=".json" className="hidden" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Аналитика и управление</CardTitle>
          <CardDescription>Статистика и управление данными</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Link href="/settings/analytics" className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <BarChart2 className="h-5 w-5" />
              <span className="text-base">Аналитика</span>
            </div>
            <Button variant="ghost" size="icon" className="h-10 w-10">
              <ExternalLink className="h-5 w-5" />
            </Button>
          </Link>

          <Link href="/settings/archive" className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <ArchiveIcon className="h-5 w-5" />
              <span className="text-base">Архив</span>
            </div>
            <Button variant="ghost" size="icon" className="h-10 w-10">
              <ExternalLink className="h-5 w-5" />
            </Button>
          </Link>

          <Link href="/settings/trash" className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Trash2 className="h-5 w-5" />
              <span className="text-base">Корзина</span>
            </div>
            <Button variant="ghost" size="icon" className="h-10 w-10">
              <ExternalLink className="h-5 w-5" />
            </Button>
          </Link>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>О сервисе</CardTitle>
          <CardDescription>Информация о приложении</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button variant="outline" onClick={() => setIsAboutDialogOpen(true)} className="w-full h-12 text-base">
            <Info className="h-5 w-5 mr-2" />
            Узнать подробнее
          </Button>
        </CardContent>
      </Card>

      <Dialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Вы уверены?</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="mb-4">Это действие удалит все ваши данные без возможности восстановления.</p>
            <p className="mb-4">Вы точно уверены, что хотите продолжить?</p>
            <div className="flex justify-center">
              <Button
                variant="destructive"
                onTouchStart={handleDeletePressStart}
                onTouchEnd={handleDeletePressEnd}
                onMouseDown={handleDeletePressStart}
                onMouseUp={handleDeletePressEnd}
                onMouseLeave={() => {
                  if (isDeletePressed) {
                    handleDeletePressEnd()
                  }
                }}
                className="h-12 text-base"
              >
                {isDeletePressed
                  ? `Удерживайте для удаления (${deleteCountdown})`
                  : deleteCountdown === 0
                    ? "Удалить все данные"
                    : "Удерживайте для удаления"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isAboutDialogOpen} onOpenChange={setIsAboutDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>О сервисе Totododo</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="mb-4">
              Totododo - минималистичный трекер задач и событий для тех, кто ценит простоту и фокус в работе.
            </p>

            <div className="space-y-2 mt-6">
              <Button variant="outline" className="w-full h-12 text-base" asChild>
                <Link href="https://t.me/+9cdaCivZESdlNjAy" target="_blank">
                  Подписаться на канал
                </Link>
              </Button>
              <Button variant="outline" className="w-full h-12 text-base" asChild>
                <Link href="https://t.me/+PGcPTvUwmLMzYzM6" target="_blank">
                  Написать в поддержку
                </Link>
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      <div className="mt-12 pt-8 border-t text-center">
        <div className="text-center font-bold mb-4">Totododo v5.5</div>
        <Button
          variant="ghost"
          size="sm"
          className="text-xs text-muted-foreground opacity-50 hover:opacity-100"
          onClick={handleDeleteConfirm}
        >
          Удалить все данные
        </Button>
      </div>
    </div>
  )
}
