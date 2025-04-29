"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { generateSyncCode, syncWithCode, getCurrentSyncCode } from "@/lib/sync-code-service"
import { toast } from "@/components/ui/use-toast"
import { Copy } from "lucide-react"
import { isClient } from "@/lib/storage-utils"

interface SyncCodeDialogProps {
  isOpen: boolean
  onClose: () => void
}

export function SyncCodeDialog({ isOpen, onClose }: SyncCodeDialogProps) {
  const [activeTab, setActiveTab] = useState("generate")
  const [syncCode, setSyncCode] = useState("")
  const [inputCode, setInputCode] = useState("")
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
    if (isClient && isOpen) {
      setSyncCode(getCurrentSyncCode() || "")
    }
  }, [isOpen])

  // Если компонент не смонтирован (серверный рендеринг), не показываем ничего
  if (!isMounted) {
    return null
  }

  const handleGenerateCode = () => {
    const code = generateSyncCode()
    setSyncCode(code)
    toast({
      title: "Код синхронизации создан",
      description: `Ваш код: ${code}`,
    })
  }

  const handleSyncWithCode = () => {
    if (!inputCode.trim()) {
      toast({
        title: "Ошибка синхронизации",
        description: "Введите код синхронизации",
        variant: "destructive",
      })
      return
    }

    const success = syncWithCode(inputCode.trim().toUpperCase())

    if (success) {
      toast({
        title: "Синхронизация выполнена",
        description: "Данные успешно синхронизированы",
      })
      setSyncCode(inputCode.trim().toUpperCase())
      onClose()
      // Перезагружаем страницу для применения изменений
      window.location.reload()
    } else {
      toast({
        title: "Ошибка синхронизации",
        description: "Неверный код синхронизации",
        variant: "destructive",
      })
    }
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(syncCode)
    toast({
      title: "Код скопирован",
      description: "Код синхронизации скопирован в буфер обмена",
    })
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Синхронизация устройств</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="generate" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-2 mb-4">
            <TabsTrigger value="generate">Создать код</TabsTrigger>
            <TabsTrigger value="sync">Ввести код</TabsTrigger>
          </TabsList>

          <TabsContent value="generate" className="space-y-4">
            <div className="text-sm text-muted-foreground">
              Создайте код синхронизации и поделитесь им с другим устройством для синхронизации данных.
            </div>

            {syncCode ? (
              <div className="space-y-2">
                <Label>Ваш код синхронизации</Label>
                <div className="flex gap-2">
                  <Input value={syncCode} readOnly className="font-mono text-lg text-center" />
                  <Button variant="outline" size="icon" onClick={copyToClipboard}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ) : (
              <Button onClick={handleGenerateCode} className="w-full">
                Создать код синхронизации
              </Button>
            )}
          </TabsContent>

          <TabsContent value="sync" className="space-y-4">
            <div className="text-sm text-muted-foreground">
              Введите код синхронизации, полученный с другого устройства, чтобы синхронизировать данные.
            </div>

            <div className="space-y-2">
              <Label htmlFor="sync-code">Код синхронизации</Label>
              <Input
                id="sync-code"
                value={inputCode}
                onChange={(e) => setInputCode(e.target.value)}
                placeholder="Введите код"
                className="font-mono text-lg text-center"
                maxLength={6}
              />
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Отмена
          </Button>
          {activeTab === "sync" && <Button onClick={handleSyncWithCode}>Синхронизировать</Button>}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
