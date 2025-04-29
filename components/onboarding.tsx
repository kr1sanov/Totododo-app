"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogFooter } from "@/components/ui/dialog"
import { Calendar, FolderKanban, Settings, Bell, ArrowRight, X } from "lucide-react"
import { getFromStorage, saveToStorage, isClient } from "@/lib/storage-utils"

interface OnboardingStep {
  title: string
  description: string
  icon: React.ReactNode
}

// Создаем объект для хранения функции перезапуска онбординга
export const onboardingActions = {
  restart: () => {},
}

export function Onboarding() {
  const [isOpen, setIsOpen] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [isMounted, setIsMounted] = useState(false)

  const steps: OnboardingStep[] = [
    {
      title: "Добро пожаловать в Totododo!",
      description:
        "Ваш личный трекер задач с минимумом интерфейса и максимумом продуктивности. Давайте познакомимся с основными функциями приложения.",
      icon: null,
    },
    {
      title: "Календарь",
      description:
        "В разделе Календарь вы можете создавать события, просматривать их в удобном формате и управлять своим расписанием. Нажмите на кнопку '+' чтобы создать новое событие.",
      icon: <Calendar className="h-12 w-12 text-primary" />,
    },
    {
      title: "Проекты",
      description:
        "Раздел Проекты позволяет организовать задачи по категориям. Создавайте проекты, добавляйте задачи и подзадачи, устанавливайте приоритеты и сроки выполнения.",
      icon: <FolderKanban className="h-12 w-12 text-primary" />,
    },
    {
      title: "Настройки",
      description:
        "В разделе Настройки вы можете настроить внешний вид приложения, управлять синхронизацией данных между устройствами и настроить уведомления.",
      icon: <Settings className="h-12 w-12 text-primary" />,
    },
    {
      title: "Уведомления",
      description:
        "Totododo может отправлять уведомления о предстоящих событиях и задачах в ваш Telegram. Настройте уведомления в разделе Настройки.",
      icon: <Bell className="h-12 w-12 text-primary" />,
    },
    {
      title: "Готово!",
      description:
        "Теперь вы знаете основные функции Totododo. Начните использовать приложение прямо сейчас и повысьте свою продуктивность!",
      icon: null,
    },
  ]

  useEffect(() => {
    setIsMounted(true)

    // Проверяем, был ли уже показан онбординг
    if (isClient) {
      const onboardingShown = getFromStorage("totododo-onboarding-shown", false)
      if (!onboardingShown) {
        setIsOpen(true)
        saveToStorage("totododo-onboarding-shown", true)
      }
    }
  }, [])

  // Если компонент не смонтирован (серверный рендеринг), не показываем ничего
  if (!isMounted) {
    return null
  }

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      setIsOpen(false)
    }
  }

  const handleSkip = () => {
    setIsOpen(false)
  }

  const handleRestart = () => {
    setCurrentStep(0)
    setIsOpen(true)
  }

  // Сохраняем функцию перезапуска в объекте onboardingActions
  onboardingActions.restart = handleRestart

  const currentStepData = steps[currentStep]

  return (
    <>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden">
          <Button variant="ghost" size="icon" className="absolute right-2 top-2 z-10" onClick={handleSkip}>
            <X className="h-4 w-4" />
          </Button>

          <div className="bg-primary/10 p-6 flex flex-col items-center justify-center">
            {currentStepData.icon && <div className="mb-4">{currentStepData.icon}</div>}
            <h2 className="text-xl font-bold text-center">{currentStepData.title}</h2>
          </div>

          <div className="p-6">
            <p className="text-center mb-6">{currentStepData.description}</p>

            <div className="flex justify-center gap-2 mb-4">
              {steps.map((_, index) => (
                <div
                  key={index}
                  className={`h-1 rounded-full ${index === currentStep ? "w-8 bg-primary" : "w-2 bg-muted"}`}
                />
              ))}
            </div>
          </div>

          <DialogFooter className="p-6 pt-0">
            <Button variant="outline" onClick={handleSkip}>
              Пропустить
            </Button>
            <Button onClick={handleNext}>
              {currentStep < steps.length - 1 ? (
                <>
                  Далее <ArrowRight className="ml-2 h-4 w-4" />
                </>
              ) : (
                "Завершить"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
